import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

// Isolated PostgreSQL fixture. Never connects to the live Supabase project.
for (const method of ['jazzcash', 'easypaisa']) test(`${method} migration enforces payment review and atomic activation`, async () => {
  const db = new PGlite();
  try {
    await db.exec(`
      create role anon; create role authenticated; create role service_role bypassrls;
      create schema auth; create schema storage;
      create function auth.uid() returns uuid language sql as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      create table public.profiles(id uuid primary key, status text not null);
      create table public.user_roles(user_id uuid, role text);
      create table public.plans(id smallint primary key, price_minor integer, is_active boolean);
      create table public.memberships(id uuid default gen_random_uuid(), user_id uuid, plan_id smallint, status text, revoked_at timestamptz, expires_at timestamptz);
      create table public.payments(id uuid primary key default gen_random_uuid(), user_id uuid, plan_id smallint, gross_minor integer, status text);
      create table public.payment_declarations(id uuid primary key default gen_random_uuid(), user_id uuid, plan_id smallint, amount_minor integer, currency text default 'PKR', method text, reference text, proof_path text, note text, status text, created_at timestamptz default now(), reviewed_at timestamptz, reviewed_by uuid, payment_id uuid, reject_reason text);
      create table public.notifications(id uuid default gen_random_uuid(), user_id uuid, kind text, title text, body text, href text);
      create table public.audit_log(actor_id uuid, action text, subject_table text, subject_id text, before jsonb, after jsonb);
      create table public.task_claims(id uuid default gen_random_uuid(), user_id uuid);
      alter table public.task_claims enable row level security;
      create policy baseline_claim on public.task_claims for insert to authenticated with check (true);
      create table storage.buckets(id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
      create table storage.objects(bucket_id text, name text);
      alter table storage.objects enable row level security;
      create policy overly_broad_legacy on storage.objects for all to authenticated using (true) with check (true);
      create function public.record_payment(p_user uuid, p_plan smallint, p_gross_minor integer, p_provider text default 'bank_transfer', p_provider_ref text default null, p_fee_minor integer default 0, p_tax_minor integer default 0)
      returns uuid language plpgsql as $$ declare payment uuid; begin
        insert into public.payments(user_id, plan_id, gross_minor, status) values (p_user, p_plan, p_gross_minor, 'succeeded') returning id into payment;
        insert into public.memberships(user_id, plan_id, status) values(p_user, p_plan, 'active');
        return payment;
      end $$;
      grant usage on schema public, auth, storage to authenticated, service_role;
      grant all on all tables in schema public, storage to authenticated, service_role;
      insert into public.plans values (1, 500000, true);
    `);
    const migration = await readFile(new URL('../supabase/migrations/202609090001_jazzcash_payment_review.sql', import.meta.url), 'utf8');
    await db.exec(migration);
    await db.exec(migration); // Re-applying remains safe.
    if (method === 'easypaisa') {
      const qrMigration = await readFile(new URL('../supabase/migrations/202609130001_plan_payment_qrs.sql', import.meta.url), 'utf8');
      await db.exec(qrMigration);
      await db.exec(qrMigration);
    }
    const reviewer = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    const member = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
    const second = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
    await db.query("insert into public.profiles values ($1,'active'),($2,'pending'),($3,'pending')", [reviewer, member, second]);
    await db.query("insert into public.user_roles values ($1,'finance')", [reviewer]);
    const proof = `${member}/dddddddd-dddd-4ddd-8ddd-dddddddddddd.png`;
    const proof2 = `${second}/eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee.png`;
    await db.query("insert into storage.objects values ('payment-proofs',$1),('payment-proofs',$2)", [proof, proof2]);
    const insert = "insert into public.payment_declarations(user_id,plan_id,amount_minor,method,reference,proof_path,status,created_at) values ($1,1,$2,$3,$4,$5,'submitted','2000-01-01') returning *";
    for (const [amount, invalidMethod, ref, path] of [[1,method,'REF1',proof],[500000,'card','REF1',proof],[500000,method,'REF1',null],[500000,method,'REF1',proof2]]) {
      await assert.rejects(db.query(insert, [member, amount, invalidMethod, ref, path]));
    }
    const { rows: [d] } = await db.query(insert, [member,500000,method,'ref100',proof]);
    assert.equal(d.reference, 'REF100');
    assert.ok(new Date(d.created_at).getFullYear() > 2020, 'timestamp cannot be backdated');
    assert.equal((await db.query('select * from memberships')).rows.length, 0, 'submission does not activate');
    await assert.rejects(db.query(insert, [member,500000,method,'REF101',proof]));
    await assert.rejects(db.query(insert, [second,500000,method,'REF100',proof2]));
    await assert.rejects(db.query("update payment_declarations set created_at = now() + interval '6 hours' where id=$1", [d.id]));
    await assert.rejects(db.query("select confirm_declaration($1,$2)", [d.id,member]));
    // Simulate an authenticated caller bypassing the UI.
    await db.exec(`set role authenticated;`);
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [member]);
    await assert.rejects(db.query(insert, [member,500000,method,'REF102',proof]));
    await assert.rejects(db.query("select confirm_declaration($1,$2)", [d.id,reviewer]));
    await assert.rejects(db.query("select record_payment($1,1::smallint,500000)", [member]));
    await assert.rejects(db.query("insert into task_claims(user_id) values($1)", [member]));
    assert.equal((await db.query("select * from storage.objects where bucket_id='payment-proofs'")).rows.length, 0, 'even legacy broad storage policies cannot expose receipts');
    await db.exec('reset role;');
    const { rows: [firstApproval] } = await db.query("select confirm_declaration($1,$2) as payment", [d.id,reviewer]);
    const { rows: [repeatApproval] } = await db.query("select confirm_declaration($1,$2) as payment", [d.id,reviewer]);
    assert.equal(firstApproval.payment, repeatApproval.payment);
    assert.equal((await db.query('select * from payments')).rows.length, 1, 'approval is idempotent');
    assert.equal((await db.query('select * from memberships')).rows.length, 1);
    assert.equal((await db.query("select status from profiles where id=$1", [member])).rows[0].status, 'active');
    assert.equal((await db.query('select * from notifications')).rows.length, 1);
    assert.equal((await db.query('select * from audit_log')).rows.length, 1);
    await db.exec('set role authenticated;');
    await db.query("insert into task_claims(user_id) values($1)", [member]);
    await db.exec('reset role;');
    const { rows: [rejected] } = await db.query(insert, [second,500000,method,'REF200',proof2]);
    await db.query("update payment_declarations set status='rejected', reviewed_by=$2, reject_reason='Amount does not match the statement' where id=$1", [rejected.id, reviewer]);
    await assert.rejects(db.query("select confirm_declaration($1,$2)", [rejected.id,reviewer]));
    assert.equal((await db.query("select status from profiles where id=$1", [second])).rows[0].status, 'pending');
    assert.equal((await db.query("select * from notifications where user_id=$1 and kind='payment_rejected'", [second])).rows.length, 1);
    const { rows: [retry] } = await db.query(insert, [second,500000,method,'REF200',proof2]);
    // Force the existing payment procedure to fail. Every side effect rolls back.
    await db.exec("create function fail_membership() returns trigger language plpgsql as $$ begin raise exception 'simulated activation failure'; end $$; create trigger fail_membership before insert on memberships for each row execute function fail_membership();");
    await assert.rejects(db.query("select confirm_declaration($1,$2)", [retry.id,reviewer]));
    assert.equal((await db.query('select * from payments')).rows.length, 1);
    assert.equal((await db.query('select status from payment_declarations where id=$1', [retry.id])).rows[0].status, 'submitted');
  } finally { await db.close(); }
});
