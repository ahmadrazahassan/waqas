-- ============================================================================
-- Granting staff access by email
--
-- Admin access is a row in public.user_roles, never a flag on the profile. A
-- boolean column is one careless UPDATE away from handing someone the payouts
-- queue, whereas a role row is explicit and shows up in an audit.
--
-- ---------------------------------------------------------------------------
-- READ THIS BEFORE CREATING AN ADMIN BY HAND
--
-- Do NOT insert into auth.users directly. GoTrue reads several token columns
-- into non-nullable Go strings, and it needs a matching auth.identities row
-- for email/password login. A hand-inserted user is missing both, and every
-- login attempt then fails with the useless message:
--
--     "Database error querying schema"
--
-- The password is correct, the account exists, and nothing explains why. The
-- repair is at the bottom of this file.
--
-- The safe route is always: sign the person up through /signup like any other
-- member, then call grant_role() below.
-- ============================================================================

create or replace function public.grant_role(
  p_email text,
  p_role  public.app_role
)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_id uuid;
begin
  select id into v_id from auth.users where lower(email) = lower(p_email);

  if v_id is null then
    return format('No account for %s. Sign them up at /signup first.', p_email);
  end if;

  insert into public.user_roles (user_id, role)
  values (v_id, p_role)
  on conflict (user_id, role) do nothing;

  return format(
    '%s now has: %s',
    p_email,
    (select string_agg(role::text, ', ' order by role)
       from public.user_roles where user_id = v_id)
  );
end;
$$;

create or replace function public.revoke_role(
  p_email text,
  p_role  public.app_role
)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_id uuid;
begin
  select id into v_id from auth.users where lower(email) = lower(p_email);
  if v_id is null then
    return format('No account for %s.', p_email);
  end if;

  delete from public.user_roles where user_id = v_id and role = p_role;

  return format(
    '%s now has: %s',
    p_email,
    coalesce((select string_agg(role::text, ', ' order by role)
                from public.user_roles where user_id = v_id), 'no roles')
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Repair for an account that was inserted into auth.users by hand and cannot
-- log in. Idempotent, so it is safe to run over accounts that are already fine.
-- ---------------------------------------------------------------------------
create or replace function public.repair_auth_user(p_email text)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_id uuid;
  v_added_identity boolean := false;
begin
  select id into v_id from auth.users where lower(email) = lower(p_email);
  if v_id is null then
    return format('No account for %s.', p_email);
  end if;

  -- GoTrue cannot scan NULL into a Go string.
  update auth.users
  set confirmation_token         = coalesce(confirmation_token, ''),
      recovery_token             = coalesce(recovery_token, ''),
      email_change               = coalesce(email_change, ''),
      email_change_token_new     = coalesce(email_change_token_new, ''),
      email_change_token_current = coalesce(email_change_token_current, ''),
      phone_change               = coalesce(phone_change, ''),
      phone_change_token         = coalesce(phone_change_token, ''),
      reauthentication_token     = coalesce(reauthentication_token, ''),
      email_confirmed_at         = coalesce(email_confirmed_at, now())
  where id = v_id;

  -- Email/password login requires an identity row.
  if not exists (
    select 1 from auth.identities
    where user_id = v_id and provider = 'email'
  ) then
    insert into auth.identities (
      id, user_id, identity_data, provider, provider_id,
      last_sign_in_at, created_at, updated_at
    )
    select gen_random_uuid(), u.id,
           jsonb_build_object(
             'sub', u.id::text, 'email', u.email,
             'email_verified', true, 'phone_verified', false
           ),
           'email', u.id::text, now(), now(), now()
    from auth.users u where u.id = v_id;
    v_added_identity := true;
  end if;

  return format(
    'Repaired %s. Tokens blanked%s.',
    p_email,
    case when v_added_identity then ', identity row added' else '' end
  );
end;
$$;

revoke all on function public.grant_role(text, public.app_role)      from public, anon, authenticated;
revoke all on function public.revoke_role(text, public.app_role)     from public, anon, authenticated;
revoke all on function public.repair_auth_user(text)                 from public, anon, authenticated;
grant execute on function public.grant_role(text, public.app_role)   to service_role;
grant execute on function public.revoke_role(text, public.app_role)  to service_role;
grant execute on function public.repair_auth_user(text)              to service_role;

comment on function public.grant_role(text, public.app_role) is
  'Grant a staff role by email. Roles: member, reviewer, support, finance, admin, owner. Anything from reviewer up can open /admin.';
