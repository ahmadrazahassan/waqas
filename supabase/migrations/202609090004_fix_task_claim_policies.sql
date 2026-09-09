-- ============================================================================
-- Task claims: make claiming work, without assuming earlier migrations ran
--
-- Symptom: every "Claim this task" failed. Zero rows in task_claims despite
-- open tasks with spaces left, an active membership and a matching rank.
--
-- The first version of this migration referenced public.has_verified_membership(),
-- and running it produced:
--
--     ERROR: 42883: function public.has_verified_membership() does not exist
--
-- which is the real finding: 202609090001 never applied. It is wrapped in a
-- transaction, so it either all landed or none of it did, and none of it did.
-- That rules out the restrictive policy as the cause of the claim failure,
-- because that policy was never created either.
--
-- What is left is the likelier explanation: task_claims has RLS enabled with
-- no permissive INSERT policy. With RLS on, a table needs at least one
-- permissive policy to pass or every write is denied with 42501, which matches
-- a table that has never accepted a single row.
--
-- This migration therefore assumes nothing. It creates the membership gate it
-- needs, then the policies, and is safe to run repeatedly and safe to run
-- whether or not 202609090001 is applied later.
-- ============================================================================

begin;

-- ---------------------------------------------------------------------------
-- The gate. Created here so this file does not depend on 202609090001.
-- "create or replace" means the later migration can redefine it harmlessly.
-- ---------------------------------------------------------------------------
create or replace function public.has_verified_membership()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.memberships m
    join public.profiles p on p.id = m.user_id
    where m.user_id = auth.uid()
      and p.status = 'active'
      and m.status = 'active'
      and m.revoked_at is null
      and (m.expires_at is null or m.expires_at > now())
  );
$$;

revoke all on function public.has_verified_membership() from public, anon;
grant execute on function public.has_verified_membership() to authenticated;

-- ---------------------------------------------------------------------------
-- Policies. The grant and the policy are separate things and both must be right.
-- ---------------------------------------------------------------------------
alter table public.task_claims enable row level security;

grant select, insert, update on public.task_claims to authenticated;

-- Permissive: a member may create, read and update a claim that is theirs.
-- Without at least one of these, nothing else matters.
drop policy if exists "members claim tasks" on public.task_claims;
create policy "members claim tasks" on public.task_claims
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "members read own claims" on public.task_claims;
create policy "members read own claims" on public.task_claims
  for select to authenticated
  -- Staff check inlined rather than calling public.is_staff(), so this file
  -- depends on nothing that an earlier migration may not have created.
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.user_roles r
      where r.user_id = auth.uid()
        and r.role in ('reviewer', 'support', 'finance', 'admin', 'owner')
    )
  );

drop policy if exists "members update own claims" on public.task_claims;
create policy "members update own claims" on public.task_claims
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Restrictive: on top of the above, the member must hold a verified
-- membership. This narrows the permissive policies, it cannot replace them.
drop policy if exists verified_member_task_claim on public.task_claims;
create policy verified_member_task_claim on public.task_claims
  as restrictive for insert to authenticated
  with check (user_id = auth.uid() and public.has_verified_membership());

commit;

-- ---------------------------------------------------------------------------
-- Check afterwards. Expect at least one row with permissive = 'PERMISSIVE'
-- and cmd = 'INSERT'. If the only INSERT row is RESTRICTIVE, claiming is still
-- blocked and something dropped the permissive policy again.
--
--   select policyname, cmd, permissive
--   from pg_policies
--   where schemaname = 'public' and tablename = 'task_claims'
--   order by permissive desc, cmd;
-- ---------------------------------------------------------------------------
