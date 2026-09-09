-- Apply to the existing schema after the payment-review migration.
-- Serialises submission versions and moves the claim into review atomically.
begin;
create or replace function public.guard_task_submission()
returns trigger language plpgsql security definer set search_path = '' as $$
declare c public.task_claims%rowtype; task_brief text; spec jsonb; words integer; file_path text;
begin
  select * into c from public.task_claims where id = new.claim_id for update;
  if not found or c.user_id <> new.user_id or (auth.uid() is not null and c.user_id <> auth.uid()) then
    raise exception 'The task claim does not belong to this member';
  end if;
  if c.status not in ('active','revision') or c.due_at <= clock_timestamp() then
    raise exception 'Claim is closed, submitted or past its deadline';
  end if;
  new.task_id := c.task_id;
  new.created_at := clock_timestamp();
  select coalesce(max(version),0) + 1 into new.version from public.submissions where claim_id = c.id;
  if length(btrim(coalesce(new.body,''))) < 50 or length(new.body) > 40000 then raise exception 'Invalid submission length'; end if;
  if cardinality(new.file_paths) > 10 then raise exception 'At most 10 files are allowed'; end if;
  foreach file_path in array coalesce(new.file_paths, array[]::text[]) loop
    if split_part(file_path,'/',1) <> c.user_id::text or file_path like '%..%' or
      not exists (select 1 from storage.objects where bucket_id = 'submissions' and name = file_path) then
      raise exception 'Submission attachment is missing or belongs to another member';
    end if;
  end loop;
  select brief into task_brief from public.tasks where id = c.task_id;
  begin spec := task_brief::jsonb; exception when invalid_text_representation then spec := null; end;
  if spec->>'version' = '1' then
    words := cardinality(regexp_split_to_array(btrim(new.body), '\s+'));
    if words < (spec->>'minWords')::integer or words > (spec->>'maxWords')::integer then
      raise exception 'Submission does not meet the task word count';
    end if;
    if (spec->>'proofRequired')::boolean and coalesce(cardinality(new.file_paths),0) = 0 then
      raise exception 'This task requires proof';
    end if;
  end if;
  return new;
end $$;
create or replace function public.queue_task_submission()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  update public.task_claims set status = 'submitted' where id = new.claim_id;
  return new;
end $$;
drop trigger if exists guard_task_submission on public.submissions;
create trigger guard_task_submission before insert on public.submissions for each row execute function public.guard_task_submission();
drop trigger if exists queue_task_submission on public.submissions;
create trigger queue_task_submission after insert on public.submissions for each row execute function public.queue_task_submission();
revoke all on function public.guard_task_submission(), public.queue_task_submission() from public, anon, authenticated;
commit;
