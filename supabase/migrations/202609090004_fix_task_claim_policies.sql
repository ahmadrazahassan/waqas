-- ============================================================================
-- Task claims: restore the permissive INSERT policy
--
-- Symptom: every "Claim this task" failed. Zero rows in task_claims despite
-- open tasks with spaces left, an active membership, and a matching rank.
--
-- Cause: 202609090001 added
--
--     create policy verified_member_task_claim on public.task_claims
--       as restrictive for insert ...
--
-- A RESTRICTIVE policy only narrows what PERMISSIVE policies already allow.
-- With RLS enabled, a table needs at least one permissive policy to pass or
-- everything is denied, and restrictive policies cannot grant anything back.
-- If the original permissive insert policy was named differently, dropped, or
-- never created for this role, the restrictive gate is the only policy present
-- and every insert fails with 42501.
--
-- This migration is idempotent and safe to run whatever the current state:
-- it (re)creates the permissive policy, keeps the verified-membership gate as
-- the restrictive layer on top, and makes sure the grant exists.
-- ============================================================================

begin;

alter table public.task_claims enable row level security;

-- The grant is separate from RLS. Both have to be right.
grant select, insert on public.task_claims to authenticated;

-- Permissive: a member may create and read a claim that belongs to them.
drop policy if exists "members claim tasks" on public.task_claims;
create policy "members claim tasks" on public.task_claims
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "members read own claims" on public.task_claims;
create policy "members read own claims" on public.task_claims
  for select to authenticated
  using (user_id = auth.uid() or public.is_staff());

drop policy if exists "members update own claims" on public.task_claims;
create policy "members update own claims" on public.task_claims
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Restrictive: on top of the above, the member must hold a verified
-- membership. Recreated here so the ordering is explicit in one file.
drop policy if exists verified_member_task_claim on public.task_claims;
create policy verified_member_task_claim on public.task_claims
  as restrictive for insert to authenticated
  with check (user_id = auth.uid() and public.has_verified_membership());

commit;

-- ---------------------------------------------------------------------------
-- Check afterwards. Expect at least one PERMISSIVE row for INSERT.
--
--   select policyname, cmd, permissive
--   from pg_policies
--   where schemaname = 'public' and tablename = 'task_claims'
--   order by permissive desc, cmd;
--
-- And confirm the gate itself passes for a given member:
--
--   select public.has_verified_membership();   -- run as that user
-- ---------------------------------------------------------------------------
