-- ============================================================================
-- Member mobile numbers
--
-- Signup now asks for a mobile number. profiles.phone_e164 already exists;
-- this migration makes it dependable:
--
--   1. Copies the number from signup metadata onto the profile row as it is
--      created, so it is saved even on the fallback signup path that cannot use
--      the service role.
--   2. Backfills members who signed up with a number before this ran.
--   3. Rejects anything that is not E.164 (+923001234567).
--   4. One account per number.
--
-- Safe to run more than once. If two existing accounts already share a number,
-- the unique index is skipped with a NOTICE instead of failing the whole
-- migration; the query at the bottom lists them so they can be fixed.
-- ============================================================================

begin;

create or replace function public.profile_phone_from_signup()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.phone_e164 is null then
    select nullif(btrim(u.raw_user_meta_data ->> 'phone_e164'), '')
      into new.phone_e164
      from auth.users u
     where u.id = new.id;
  end if;

  if new.phone_e164 is not null and new.phone_e164 !~ '^\+[1-9][0-9]{7,14}$' then
    new.phone_e164 := null;
  end if;

  return new;
end;
$$;

revoke all on function public.profile_phone_from_signup() from public, anon, authenticated;

drop trigger if exists profile_phone_from_signup on public.profiles;
create trigger profile_phone_from_signup
  before insert on public.profiles
  for each row execute function public.profile_phone_from_signup();

-- Backfill from metadata, never overwriting a number already on the profile.
update public.profiles p
   set phone_e164 = btrim(u.raw_user_meta_data ->> 'phone_e164')
  from auth.users u
 where u.id = p.id
   and p.phone_e164 is null
   and btrim(u.raw_user_meta_data ->> 'phone_e164') ~ '^\+[1-9][0-9]{7,14}$';

-- NOT VALID: enforced for every new write, without failing on a legacy row.
alter table public.profiles drop constraint if exists profiles_phone_e164_format;
alter table public.profiles
  add constraint profiles_phone_e164_format
  check (phone_e164 is null or phone_e164 ~ '^\+[1-9][0-9]{7,14}$') not valid;

do $$
begin
  if exists (
    select 1 from public.profiles
     where phone_e164 is not null
     group by phone_e164 having count(*) > 1
  ) then
    raise notice 'profiles_phone_e164_unique skipped: duplicate numbers exist. Run the query at the end of this file.';
  else
    create unique index if not exists profiles_phone_e164_unique
      on public.profiles (phone_e164) where phone_e164 is not null;
  end if;
end $$;

notify pgrst, 'reload schema';

commit;

-- Duplicates, if the NOTICE above fired:
--   select phone_e164, array_agg(username) from public.profiles
--   where phone_e164 is not null group by phone_e164 having count(*) > 1;
