-- Demo personas show an upcoming interview, but the seeded dates are relative
-- to when the seed ran, so they go stale (Bea's "Interview with Kalye
-- Logistics" disappeared two days after seeding). Every hour, move any demo
-- interview that's less than a day away forward by whole weeks, keeping its
-- weekday and time. Only demo profiles are touched.

create or replace function private.roll_demo_interviews()
returns integer language plpgsql security definer set search_path = '' as $$
declare
  v_count integer;
begin
  update public.applications a
  set interview_at = a.interview_at
    + ceil(extract(epoch from (now() + interval '1 day' - a.interview_at)) / 604800) * interval '7 days'
  from public.profiles p
  where p.id = a.student_id
    and p.demo
    and a.status = 'interview'
    and a.interview_at is not null
    and a.interview_at < now() + interval '1 day';
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function private.roll_demo_interviews() from public, anon, authenticated;

create extension if not exists pg_cron;

-- Scheduling under the same name replaces the job, so this is safe to rerun.
select cron.schedule('roll-demo-interviews', '0 * * * *', $$select private.roll_demo_interviews()$$);

select private.roll_demo_interviews();
