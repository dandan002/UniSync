-- Row-level security. Helper functions live in the private schema, which the
-- Data API does not expose, so clients can't call them directly.

grant usage on schema private to authenticated;

create or replace function private.my_role()
returns public.app_role language sql stable security definer set search_path = '' as $$
  select role from public.profiles where id = (select auth.uid())
$$;

create or replace function private.my_school()
returns uuid language sql stable security definer set search_path = '' as $$
  select school_id from public.profiles where id = (select auth.uid())
$$;

create or replace function private.my_company()
returns uuid language sql stable security definer set search_path = '' as $$
  select company_id from public.profiles
  where id = (select auth.uid()) and role = 'supervisor'
$$;

create or replace function private.is_staff()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role in ('coordinator', 'admin') and school_id is not null
  )
$$;

create or replace function private.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin' and school_id is not null
  )
$$;

-- True when the student belongs to the caller's school and the caller is staff there.
create or replace function private.student_in_my_school(student uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles s
    join public.profiles me on me.id = (select auth.uid())
    where s.id = student
      and me.role in ('coordinator', 'admin')
      and me.school_id is not null
      and s.school_id = me.school_id
  )
$$;

-- Same check keyed by a storage folder name, compared as text so a stray
-- folder name never fails a uuid cast.
create or replace function private.student_folder_in_my_school(folder text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles s
    join public.profiles me on me.id = (select auth.uid())
    where s.id::text = folder
      and me.role in ('coordinator', 'admin')
      and me.school_id is not null
      and s.school_id = me.school_id
  )
$$;

-- True when the student applied to a job at the caller's company.
create or replace function private.applied_to_my_company(student uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.applications a
    join public.jobs j on j.id = a.job_id
    join public.profiles me on me.id = (select auth.uid())
    where a.student_id = student and me.role = 'supervisor' and j.company_id = me.company_id
  )
$$;

create or replace function private.is_my_company_job(job uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.jobs j
    join public.profiles me on me.id = (select auth.uid())
    where j.id = job and me.role = 'supervisor' and j.company_id = me.company_id
  )
$$;

create or replace function private.company_verified(company uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.companies where id = company and verified_at is not null)
$$;

create or replace function private.partner_of_my_school(company uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.school_partners sp
    join public.profiles me on me.id = (select auth.uid())
    where sp.company_id = company and sp.school_id = me.school_id
      and me.role in ('coordinator', 'admin')
  )
$$;

revoke all on all functions in schema private from public, anon;
grant execute on all functions in schema private to authenticated;

-- Enable RLS everywhere. anon gets nothing; every page requires sign-in.
alter table public.schools enable row level security;
alter table public.companies enable row level security;
alter table public.profiles enable row level security;
alter table public.school_partners enable row level security;
alter table public.resumes enable row level security;
alter table public.jobs enable row level security;
alter table public.applications enable row level security;
alter table public.saved_jobs enable row level security;
alter table public.student_forms enable row level security;
alter table public.time_logs enable row level security;
alter table public.notifications enable row level security;
alter table public.invites enable row level security;
alter table public.audit_log enable row level security;

revoke all on all tables in schema public from anon;

-- Writes that change state go through checked functions. Clients only get the
-- column-level update rights listed below.
revoke insert, update, delete on
  public.schools, public.companies, public.profiles, public.school_partners,
  public.student_forms, public.time_logs, public.notifications, public.invites,
  public.audit_log
from authenticated;
revoke insert, update, delete on public.resumes, public.applications from authenticated;

grant update (full_name, phone, course, year_level, city, last_active_at) on public.profiles to authenticated;
grant update (city, about) on public.companies to authenticated;
grant insert (student_id, data, template) on public.resumes to authenticated;
grant update (student_id, data, template, updated_at) on public.resumes to authenticated;
grant insert (job_id, student_id) on public.applications to authenticated;
grant update (status, viewed_at, interview_at, interview_where, updated_at) on public.applications to authenticated;
grant update (read_at) on public.notifications to authenticated;

-- schools
create policy "Signed-in users can read schools" on public.schools
  for select to authenticated using (true);

-- companies
create policy "Read verified companies, your own, or any as admin" on public.companies
  for select to authenticated using (
    verified_at is not null
    or id = (select private.my_company())
    or (select private.is_admin())
  );
create policy "Supervisors edit their company profile" on public.companies
  for update to authenticated
  using (id = (select private.my_company()))
  with check (id = (select private.my_company()));

-- profiles
create policy "Read yourself, your school, or your applicants" on public.profiles
  for select to authenticated using (
    id = (select auth.uid())
    or (school_id is not null and school_id = (select private.my_school()) and (select private.is_staff()))
    or (role = 'supervisor' and company_id is not null and (select private.is_staff()) and private.partner_of_my_school(company_id))
    or (company_id is not null and company_id = (select private.my_company()))
    or private.applied_to_my_company(id)
  );
create policy "Update your own profile" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- school_partners
create policy "Read partnerships for your school or company" on public.school_partners
  for select to authenticated using (
    school_id = (select private.my_school()) or company_id = (select private.my_company())
  );

-- resumes
create policy "Read your resume, your students', or your applicants'" on public.resumes
  for select to authenticated using (
    student_id = (select auth.uid())
    or private.student_in_my_school(student_id)
    or private.applied_to_my_company(student_id)
  );
create policy "Students create their resume" on public.resumes
  for insert to authenticated with check (student_id = (select auth.uid()));
create policy "Students edit their resume" on public.resumes
  for update to authenticated
  using (student_id = (select auth.uid()))
  with check (student_id = (select auth.uid()));

-- jobs
create policy "Read open jobs at verified companies, plus your own" on public.jobs
  for select to authenticated using (
    (status = 'open' and private.company_verified(company_id))
    or company_id = (select private.my_company())
    or (select private.is_admin())
    or private.partner_of_my_school(company_id)
  );
create policy "Supervisors post jobs for their company" on public.jobs
  for insert to authenticated with check (company_id = (select private.my_company()));
create policy "Supervisors edit their company's jobs" on public.jobs
  for update to authenticated
  using (company_id = (select private.my_company()))
  with check (company_id = (select private.my_company()));
create policy "Supervisors delete their company's jobs" on public.jobs
  for delete to authenticated using (company_id = (select private.my_company()));

-- applications
create policy "Read your applications, your applicants, or your students'" on public.applications
  for select to authenticated using (
    student_id = (select auth.uid())
    or private.is_my_company_job(job_id)
    or private.student_in_my_school(student_id)
  );
create policy "Students apply to open jobs" on public.applications
  for insert to authenticated with check (
    student_id = (select auth.uid())
    and (select private.my_role()) = 'student'
    and exists (
      select 1 from public.jobs j
      where j.id = job_id and j.status = 'open' and private.company_verified(j.company_id)
    )
  );
create policy "Supervisors move their applicants" on public.applications
  for update to authenticated
  using (private.is_my_company_job(job_id))
  with check (private.is_my_company_job(job_id));

-- saved_jobs
create policy "Students manage saved jobs" on public.saved_jobs
  for all to authenticated
  using (student_id = (select auth.uid()))
  with check (student_id = (select auth.uid()));

-- student_forms
create policy "Read your forms or your students' forms" on public.student_forms
  for select to authenticated using (
    student_id = (select auth.uid()) or private.student_in_my_school(student_id)
  );

-- time_logs
create policy "Read your hours, your interns' hours, or your students' hours" on public.time_logs
  for select to authenticated using (
    student_id = (select auth.uid())
    or company_id = (select private.my_company())
    or private.student_in_my_school(student_id)
  );

-- notifications
create policy "Read your notifications" on public.notifications
  for select to authenticated using (user_id = (select auth.uid()));
create policy "Mark your notifications read" on public.notifications
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- invites
create policy "Staff read their school's invites" on public.invites
  for select to authenticated using (
    school_id = (select private.my_school()) and (select private.is_staff())
  );

-- audit_log
create policy "Staff read their school's activity" on public.audit_log
  for select to authenticated using (
    school_id = (select private.my_school()) and (select private.is_staff())
  );

-- Coordinator roster. security_invoker keeps the caller's RLS in force.
create view public.student_overview with (security_invoker = true) as
select
  p.id,
  p.full_name,
  p.email,
  p.school_id,
  p.course,
  p.year_level,
  p.last_active_at,
  r.approved_at as resume_approved_at,
  (select count(*) from public.student_forms f where f.student_id = p.id and f.status <> 'missing')::int as forms_done,
  (select coalesce(sum(t.hours), 0) from public.time_logs t where t.student_id = p.id and t.status = 'approved')::numeric as hours,
  (select count(*) from public.time_logs t where t.student_id = p.id and t.status = 'pending')::int as pending_logs,
  (select count(*) from public.applications a where a.student_id = p.id)::int as app_count,
  hired.company_id as host_company_id,
  hired.company_name as host_company,
  case
    when hired.company_name is not null then 'Interning'
    when r.approved_at is not null or exists (select 1 from public.applications a where a.student_id = p.id) then 'Applying'
    else 'Signing up'
  end as stage
from public.profiles p
left join public.resumes r on r.student_id = p.id
left join lateral (
  select c.id as company_id, c.name as company_name
  from public.applications a
  join public.jobs j on j.id = a.job_id
  join public.companies c on c.id = j.company_id
  where a.student_id = p.id and a.status = 'hired'
  order by a.updated_at desc
  limit 1
) hired on true
where p.role = 'student';

revoke all on public.student_overview from anon;
grant select on public.student_overview to authenticated;

-- Form uploads: private bucket, one folder per student.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('forms', 'forms', false, 10485760, array['application/pdf', 'image/jpeg', 'image/png'])
on conflict (id) do nothing;

create policy "Students upload their own forms" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'forms' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Students replace their own forms" on storage.objects
  for update to authenticated
  using (bucket_id = 'forms' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'forms' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Students and their school read forms" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'forms'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or private.student_folder_in_my_school((storage.foldername(name))[1])
    )
  );
