-- ============================================================================
-- Read-only diagnostic. Changes nothing. Run it in the Supabase SQL editor
-- and read the answers before applying any fix.
--
-- Written after a claim bug was diagnosed twice from guesswork and got the
-- cause wrong the first time. Look at the database, then decide.
-- ============================================================================

-- 1. Which of our functions actually exist?
--    A missing has_verified_membership means 202609090001 never applied.
select
  f.name,
  to_regprocedure('public.' || f.name) is not null as exists
from (values
  ('has_verified_membership()'),
  ('is_staff()'),
  ('is_admin()'),
  ('guard_jazzcash_declaration()'),
  ('record_payment(uuid,smallint,integer,text,text,integer,integer)'),
  ('confirm_declaration(uuid,uuid)'),
  ('grant_role(text,public.app_role)'),
  ('pay_level_rewards()')
) as f(name);

-- 2. Policies on task_claims.
--    Claiming needs at least one PERMISSIVE row with cmd = INSERT.
--    A lone RESTRICTIVE INSERT row denies everything.
select policyname, cmd, permissive, roles::text
from pg_policies
where schemaname = 'public' and tablename = 'task_claims'
order by permissive desc, cmd;

-- 3. Table privileges. The grant and the policy are separate, both must pass.
select grantee, string_agg(privilege_type, ', ' order by privilege_type) as privileges
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name = 'task_claims'
  and grantee in ('authenticated', 'anon', 'service_role')
group by grantee;

-- 4. Is RLS on at all?
select relname, relrowsecurity as rls_enabled, relforcerowsecurity as rls_forced
from pg_class
where oid = 'public.task_claims'::regclass;

-- 5. Would the gate pass for each member, evaluated directly rather than
--    through auth.uid()? Anyone showing false cannot claim.
select
  p.username,
  p.status::text as profile_status,
  m.status::text as membership_status,
  m.revoked_at,
  m.expires_at,
  (p.status = 'active'
   and m.status = 'active'
   and m.revoked_at is null
   and (m.expires_at is null or m.expires_at > now())) as would_pass_gate
from public.profiles p
left join public.memberships m on m.user_id = p.id
order by p.created_at;

-- 6. Which migrations does Supabase think it has applied?
select version, name
from supabase_migrations.schema_migrations
order by version desc
limit 20;
