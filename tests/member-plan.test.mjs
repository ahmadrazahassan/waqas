import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

test('manual plan access is atomic, role checked, and keeps pending payments in review', async () => {
  const db = new PGlite();
  try {
    await db.exec(`
      create role anon; create role authenticated; create role service_role;
      create type subscription_status as enum ('active','paused','cancelled','trialing','past_due','expired');
      create table profiles(id uuid primary key, status text, updated_at timestamptz);
      create table user_roles(user_id uuid, role text);
      create table plans(id integer primary key, name text, is_active boolean);
      create table memberships(id uuid primary key default gen_random_uuid(), user_id uuid references profiles(id), plan_id integer references plans(id),
        status subscription_status, provider text, created_at timestamptz default now(), updated_at timestamptz,
        expires_at timestamptz, revoked_at timestamptz, revoked_reason text);
      create unique index one_live on memberships(user_id) where status in ('active','trialing','past_due');
      create table payment_declarations(user_id uuid, status text);
      create table audit_log(actor_id uuid, action text, subject_table text, subject_id text, before jsonb, after jsonb);
      create table notifications(user_id uuid, kind text, title text, body text, href text);
      insert into plans values (1,'Starter',true),(2,'Pro',true),(3,'Old plan',false);
    `);
    await db.exec(await readFile(new URL('../supabase/migrations/202609090005_admin_member_plan.sql', import.meta.url), 'utf8'));
    const actor = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    const member = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
    await db.query("insert into profiles values ($1,'active',now()),($2,'pending',now())", [actor, member]);
    await db.query("insert into user_roles values ($1,'owner')", [actor]);
    const update = (plan, status, who = actor) => db.query('select admin_set_member_plan($1,$2,$3,$4,$5)', [member, plan, status, 'Approved account access correction', who]);
    await assert.rejects(update(1, 'active', member), /active admin/);
    await db.exec('set role authenticated');
    await assert.rejects(update(1, 'active'), /permission denied/);
    await db.exec('reset role');
    await assert.rejects(update(3, 'active'), /available plan/);
    await db.query("insert into payment_declarations values ($1,'submitted')", [member]);
    await assert.rejects(update(1, 'active'), /pending receipt/);
    assert.equal((await db.query('select * from memberships')).rows.length, 0);
    await db.exec("update payment_declarations set status='rejected'");
    await update(1, 'active');
    assert.equal((await db.query('select * from memberships')).rows[0].provider, 'admin_grant');
    assert.equal((await db.query('select status from profiles where id=$1', [member])).rows[0].status, 'active');
    await update(2, 'active');
    assert.equal((await db.query('select * from memberships')).rows.length, 1);
    assert.equal((await db.query('select plan_id from memberships')).rows[0].plan_id, 2);
    await update(2, 'paused');
    assert.equal((await db.query('select status from memberships')).rows[0].status, 'paused');
    await update(1, 'cancelled');
    assert.ok((await db.query('select revoked_at from memberships')).rows[0].revoked_at);
    await update(1, 'active');
    assert.equal((await db.query('select revoked_at from memberships')).rows[0].revoked_at, null);
    await db.exec("create function fail_audit() returns trigger language plpgsql as $$ begin raise exception 'audit failed'; end $$; create trigger fail_audit before insert on audit_log for each row execute function fail_audit();");
    await assert.rejects(update(2, 'active'), /audit failed/);
    assert.equal((await db.query('select plan_id from memberships')).rows[0].plan_id, 1, 'audit failure rolls back access changes');
    assert.equal((await db.query('select * from audit_log')).rows.length, 5);
  } finally { await db.close(); }
});
