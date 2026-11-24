-- Rate limits for the Sync chat. Every chat turn calls take_sync_turn()
-- before it reaches Claude. The log lives in the private schema, so students
-- can't read, clear or edit it.

create table if not exists private.sync_turns (
  id bigint generated always as identity primary key,
  student_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists sync_turns_student_created_idx on private.sync_turns (student_id, created_at desc);

revoke all on private.sync_turns from public, anon, authenticated;

-- Returns 'ok' and logs the turn, or 'burst' / 'daily' when the student is
-- over a limit.
create or replace function public.take_sync_turn()
returns text language plpgsql security definer set search_path = '' as $$
declare
  v_me uuid := private.me();
  v_recent int;
  v_today int;
begin
  if v_me is null or private.my_role() is distinct from 'student' then
    raise exception 'Only students can chat with Sync.' using errcode = '42501';
  end if;

  -- One check at a time per student, so parallel requests can't slip past.
  perform pg_advisory_xact_lock(hashtextextended(v_me::text, 0));

  select count(*) filter (where created_at > now() - interval '10 minutes'), count(*)
  into v_recent, v_today
  from private.sync_turns
  where student_id = v_me and created_at > now() - interval '1 day';

  if v_recent >= 20 then return 'burst'; end if;
  if v_today >= 150 then return 'daily'; end if;

  insert into private.sync_turns (student_id) values (v_me);
  delete from private.sync_turns where student_id = v_me and created_at < now() - interval '2 days';
  return 'ok';
end;
$$;

revoke all on function public.take_sync_turn() from public, anon;
grant execute on function public.take_sync_turn() to authenticated;
