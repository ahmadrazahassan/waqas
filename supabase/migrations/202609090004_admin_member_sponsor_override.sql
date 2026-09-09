-- Admin-only sponsor changes. The normal signup path keeps sponsors locked;
-- this audited procedure is the explicit exception for correcting a referral
-- relationship without leaving the closure table stale.

create or replace function public.enforce_sponsor_lock()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if coalesce(current_setting('app.sponsor_override', true), 'off') <> 'on'
     and old.sponsor_locked_at is not null
     and new.referred_by is distinct from old.referred_by then
    raise exception 'Sponsor is locked and cannot be changed. Use the audited sponsor_override procedure.';
  end if;

  if new.referred_by is not null and new.referred_by is distinct from old.referred_by then
    new.sponsor_locked_at := now();
  elsif new.referred_by is null and new.referred_by is distinct from old.referred_by then
    new.sponsor_locked_at := null;
  end if;

  new.updated_at := now();
  return new;
end;
$$;

create or replace function public.admin_update_member_sponsor(p_member uuid, p_sponsor uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if p_member is null then
    raise exception 'Member is required.';
  end if;

  if p_sponsor is not null and p_member = p_sponsor then
    raise exception 'A member cannot sponsor themselves.';
  end if;

  if not exists (select 1 from public.profiles where id = p_member) then
    raise exception 'Member not found.';
  end if;

  if p_sponsor is not null and not exists (select 1 from public.profiles where id = p_sponsor) then
    raise exception 'Sponsor not found.';
  end if;

  -- If the proposed sponsor is already below the member, this change would
  -- close the chain into a cycle.
  if p_sponsor is not null and exists (
    select 1 from public.referral_edges
    where ancestor_id = p_member and descendant_id = p_sponsor
  ) then
    raise exception 'Refusing to create a referral cycle.';
  end if;

  perform pg_advisory_xact_lock(hashtext('assignwork-referral-graph'));
  perform set_config('app.sponsor_override', 'on', true);

  update public.profiles
  set referred_by = p_sponsor,
      sponsor_locked_at = case when p_sponsor is null then null else now() end
  where id = p_member;

  -- Rebuild the closure table from the source-of-truth parent pointers. This
  -- also fixes any legacy edges left behind by an earlier sponsor correction.
  delete from public.referral_edges;

  insert into public.referral_edges (ancestor_id, descendant_id, depth)
  with recursive chain as (
    select p.referred_by as ancestor_id, p.id as descendant_id, 1::smallint as depth
    from public.profiles p
    where p.referred_by is not null

    union all

    select c.ancestor_id, p.id, (c.depth + 1)::smallint
    from chain c
    join public.profiles p on p.referred_by = c.descendant_id
    where c.depth < 20
  )
  select ancestor_id, descendant_id, depth
  from chain
  on conflict (ancestor_id, descendant_id) do nothing;
end;
$$;

revoke execute on function public.admin_update_member_sponsor(uuid, uuid) from public, anon, authenticated;
grant execute on function public.admin_update_member_sponsor(uuid, uuid) to service_role;
