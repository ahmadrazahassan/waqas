-- Apply in Supabase SQL Editor before deploying the matching application.
-- Additive migration for the existing Assignwork schema. No payment data is deleted.
begin;

create unique index if not exists jazzcash_one_pending_per_member
  on public.payment_declarations(user_id) where status = 'submitted';
create unique index if not exists jazzcash_unique_transaction
  on public.payment_declarations(upper(btrim(reference)))
  where method = 'jazzcash' and status in ('submitted', 'confirmed');
create unique index if not exists jazzcash_unique_receipt
  on public.payment_declarations(proof_path)
  where method = 'jazzcash' and status in ('submitted', 'confirmed');

-- Payment writes must pass through authenticated server actions. RLS also
-- prevents browser API calls even if broad table grants are added later.
revoke insert, update, delete on public.payment_declarations from anon, authenticated;
alter table public.payment_declarations enable row level security;
drop policy if exists payment_declarations_no_client_writes on public.payment_declarations;
create policy payment_declarations_no_client_writes on public.payment_declarations
  as restrictive for all to anon, authenticated
  using (user_id = auth.uid() or exists (
    select 1 from public.user_roles r where r.user_id = auth.uid() and r.role in ('finance', 'admin', 'owner')
  )) with check (false);

create or replace function public.guard_jazzcash_declaration()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_price bigint;
begin
  if TG_OP = 'INSERT' then
    if new.method <> 'jazzcash' or new.status <> 'submitted' then
      raise exception 'Only submitted JazzCash payments are accepted';
    end if;
    if not exists (select 1 from public.profiles where id = new.user_id and status in ('pending', 'active')) then
      raise exception 'Account is not eligible for payment';
    end if;
    if exists (select 1 from public.memberships where user_id = new.user_id and status = 'active') then
      raise exception 'Member already has an active plan; upgrades require a separate quote';
    end if;
    select price_minor into v_price from public.plans where id = new.plan_id and is_active;
    if v_price is null or new.amount_minor <> v_price or new.currency <> 'PKR' then
      raise exception 'Plan or payment amount is invalid';
    end if;
    new.reference := upper(btrim(new.reference));
    if new.reference is null or new.reference !~ '^[A-Z0-9-]{4,80}$' then
      raise exception 'A valid JazzCash transaction ID is required';
    end if;
    if new.proof_path is null or new.proof_path !~ ('^' || new.user_id::text || '/[a-f0-9-]{36}\.(png|jpg|webp)$') then
      raise exception 'A receipt belonging to the member is required';
    end if;
    if not exists (select 1 from storage.objects where bucket_id = 'payment-proofs' and name = new.proof_path) then
      raise exception 'Receipt was not uploaded';
    end if;
    -- Timestamp is authoritative and cannot be chosen by the caller.
    new.created_at := clock_timestamp();
    new.reviewed_at := null;
    new.reviewed_by := null;
    new.payment_id := null;
    new.reject_reason := null;
  else
    if (to_jsonb(new) - array['status','reviewed_at','reviewed_by','payment_id','reject_reason'])
       is distinct from (to_jsonb(old) - array['status','reviewed_at','reviewed_by','payment_id','reject_reason']) then
      raise exception 'Submitted payment details are immutable';
    end if;
    if old.status <> 'submitted' or new.status not in ('confirmed', 'rejected', 'cancelled') then
      raise exception 'Payment has already been reviewed or transition is invalid';
    end if;
    if new.status in ('confirmed', 'rejected') and not exists (
      select 1 from public.user_roles r join public.profiles p on p.id = r.user_id
      where r.user_id = new.reviewed_by and r.role in ('finance','admin','owner') and p.status = 'active'
    ) then raise exception 'An active finance reviewer is required'; end if;
    if new.status = 'rejected' then
      if length(btrim(coalesce(new.reject_reason, ''))) not between 5 and 500 then
        raise exception 'A rejection reason is required';
      end if;
      new.reviewed_at := clock_timestamp();
      insert into public.notifications(user_id, kind, title, body, href)
      values (new.user_id, 'payment_rejected', 'Your payment needs attention', new.reject_reason, '/dashboard/billing');
    end if;
    if new.status = 'confirmed' and not exists (
      select 1 from public.payments p where p.id = new.payment_id and p.user_id = new.user_id
        and p.plan_id = new.plan_id and p.gross_minor = new.amount_minor and p.status = 'succeeded'
    ) then raise exception 'A matching verified payment is required'; end if;
    insert into public.audit_log(actor_id, action, subject_table, subject_id, before, after)
    values (new.reviewed_by, 'declaration.' || new.status::text, 'payment_declarations', new.id::text, to_jsonb(old), to_jsonb(new));
  end if;
  return new;
end;
$$;
drop trigger if exists guard_jazzcash_declaration on public.payment_declarations;
create trigger guard_jazzcash_declaration before insert or update on public.payment_declarations
  for each row execute function public.guard_jazzcash_declaration();
revoke all on function public.guard_jazzcash_declaration() from public, anon, authenticated;

-- Preserve the existing record_payment business logic (membership, commission,
-- leaderboard). Lock the declaration first so concurrent approvals run once.
create or replace function public.confirm_declaration(p_declaration uuid, p_reviewer uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare d public.payment_declarations%rowtype; v_payment uuid;
begin
  if not exists (
    select 1 from public.user_roles r join public.profiles p on p.id = r.user_id
    where r.user_id = p_reviewer and r.role in ('finance','admin','owner') and p.status = 'active'
  ) then raise exception 'Not an authorised reviewer'; end if;
  select * into d from public.payment_declarations where id = p_declaration for update;
  if not found then raise exception 'Payment request not found'; end if;
  if d.status = 'confirmed' then return d.payment_id; end if;
  if d.status <> 'submitted' then raise exception 'Payment is no longer awaiting review'; end if;
  if d.user_id = p_reviewer then raise exception 'A reviewer cannot approve their own payment'; end if;
  -- Lock the member as well; two different declarations cannot activate twice.
  perform 1 from public.profiles where id = d.user_id and status in ('pending', 'active') for update;
  if not found then raise exception 'Member is restricted or unavailable'; end if;
  if exists (select 1 from public.memberships where user_id = d.user_id and status = 'active') then
    raise exception 'An active membership already exists';
  end if;
  if d.method = 'jazzcash' and not exists (
    select 1 from storage.objects where bucket_id = 'payment-proofs' and name = d.proof_path
  ) then raise exception 'Payment screenshot is missing'; end if;
  v_payment := public.record_payment(
    p_user => d.user_id, p_plan => d.plan_id, p_gross_minor => d.amount_minor,
    p_provider => d.method, p_provider_ref => d.reference
  );
  if not exists (select 1 from public.memberships where user_id = d.user_id and plan_id = d.plan_id and status = 'active') then
    raise exception 'Membership activation failed';
  end if;
  update public.profiles set status = 'active' where id = d.user_id;
  update public.payment_declarations set status = 'confirmed', payment_id = v_payment,
    reviewed_by = p_reviewer, reviewed_at = clock_timestamp() where id = d.id;
  insert into public.notifications(user_id, kind, title, body, href)
  values (d.user_id, 'payment_confirmed', 'Your account is active', 'Your payment has been verified. Your plan access is ready.', '/dashboard');
  return v_payment;
end;
$$;
revoke all on function public.confirm_declaration(uuid, uuid) from public, anon, authenticated;
grant execute on function public.confirm_declaration(uuid, uuid) to service_role;
-- No direct browser route may mint paid access or commission.
do $$ declare f regprocedure; begin
  for f in select p.oid::regprocedure from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'record_payment'
  loop
    execute format('revoke all on function %s from public, anon, authenticated', f);
    execute format('grant execute on function %s to service_role', f);
  end loop;
end $$;

create or replace function public.has_verified_membership()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.memberships m join public.profiles p on p.id = m.user_id
    where m.user_id = auth.uid() and p.status = 'active' and m.status = 'active'
      and m.revoked_at is null and (m.expires_at is null or m.expires_at > now())
  );
$$;
revoke all on function public.has_verified_membership() from public, anon;
grant execute on function public.has_verified_membership() to authenticated;
drop policy if exists verified_member_task_claim on public.task_claims;
create policy verified_member_task_claim on public.task_claims
  as restrictive for insert to authenticated with check (user_id = auth.uid() and public.has_verified_membership());

-- Private receipts are written only by the server and served through an
-- authenticated, no-store route. Never create public URLs or client upload policies.
insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('payment-proofs', 'payment-proofs', false, 5242880, array['image/png','image/jpeg','image/webp'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
drop policy if exists payment_proofs_server_only on storage.objects;
create policy payment_proofs_server_only on storage.objects
  as restrictive for all to anon, authenticated
  using (bucket_id <> 'payment-proofs') with check (bucket_id <> 'payment-proofs');

commit;
