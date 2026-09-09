begin;

-- A manual access grant is distinct from verification of an incoming payment.
-- Keep account access, membership changes and the audit record in one transaction.
create or replace function public.admin_set_member_plan(
  p_member uuid, p_plan integer, p_status text, p_reason text, p_actor uuid
) returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_member public.profiles%rowtype;
  v_membership public.memberships%rowtype;
  v_id uuid;
  v_plan_name text;
begin
  if not exists (
    select 1 from public.user_roles r join public.profiles p on p.id = r.user_id
    where r.user_id = p_actor and r.role in ('admin', 'owner') and p.status = 'active'
  ) then raise exception 'An active admin or owner is required'; end if;
  if p_status is null or p_status not in ('active', 'paused', 'cancelled') then
    raise exception 'Choose an access status';
  end if;
  if length(btrim(coalesce(p_reason, ''))) not between 10 and 500 then
    raise exception 'Explain the reason for changing this plan';
  end if;
  select * into v_member from public.profiles where id = p_member for update;
  if not found then raise exception 'Member not found'; end if;
  select name into v_plan_name from public.plans where id = p_plan and is_active;
  if not found then raise exception 'Choose an available plan'; end if;
  -- Pending receipts must be reviewed through the payment workflow, so a
  -- manual grant cannot strand a receipt or label unverified funds as paid.
  if p_status = 'active' and exists (
    select 1 from public.payment_declarations where user_id = p_member and status = 'submitted'
  ) then raise exception 'This member has a pending receipt. Review it in Payment reviews before changing plan access'; end if;

  select * into v_membership from public.memberships where user_id = p_member
    order by (status in ('active', 'trialing', 'past_due')) desc, created_at desc, id desc
    limit 1 for update;
  if v_membership.id is null then
    if p_status <> 'active' then raise exception 'This member has no plan to pause or cancel'; end if;
    insert into public.memberships(user_id, plan_id, status, provider, expires_at)
      values (p_member, p_plan, 'active', 'admin_grant', null) returning id into v_id;
  else
    v_id := v_membership.id;
    update public.memberships
    set plan_id = p_plan, status = p_status::public.subscription_status,
        expires_at = null,
        revoked_at = case when p_status = 'cancelled' then now() else null end,
        revoked_reason = case when p_status = 'cancelled' then btrim(p_reason) else null end,
        updated_at = now()
    where id = v_id;
  end if;
  if p_status = 'active' then
    update public.profiles set status = 'active', updated_at = now() where id = p_member;
  end if;
  insert into public.audit_log(actor_id, action, subject_table, subject_id, before, after)
    values (p_actor, 'member.plan_updated', 'profiles', p_member::text,
      jsonb_build_object('membership', to_jsonb(v_membership), 'account_status', v_member.status),
      jsonb_build_object('membership_id', v_id, 'plan_id', p_plan, 'status', p_status, 'reason', btrim(p_reason)));
  insert into public.notifications(user_id, kind, title, body, href)
    values (p_member, 'plan_updated', 'Your plan access was updated',
      v_plan_name || ' access is now ' || p_status || '.', '/dashboard/billing');
  return v_id;
end;
$$;
revoke all on function public.admin_set_member_plan(uuid, integer, text, text, uuid) from public, anon, authenticated;
grant execute on function public.admin_set_member_plan(uuid, integer, text, text, uuid) to service_role;
notify pgrst, 'reload schema';
commit;
