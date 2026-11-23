-- Switch identity from Supabase Auth to Clerk (Supabase third-party auth).
-- Clerk session tokens carry sub (the Clerk user id), role = authenticated,
-- and the verified primary email. Profiles keep a uuid key and gain clerk_id.

-- 1. Profiles no longer mirror auth.users.
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists private.handle_new_user();

alter table public.profiles drop constraint if exists profiles_id_fkey;
alter table public.profiles alter column id set default gen_random_uuid();
alter table public.profiles add column if not exists clerk_id text unique;

-- Actor columns now point at profiles.
alter table public.companies drop constraint if exists companies_verified_by_fkey;
alter table public.companies drop constraint if exists companies_created_by_fkey;
alter table public.time_logs drop constraint if exists time_logs_approved_by_fkey;
alter table public.invites drop constraint if exists invites_invited_by_fkey;
alter table public.audit_log drop constraint if exists audit_log_actor_id_fkey;

alter table public.companies
  add constraint companies_verified_by_fkey foreign key (verified_by) references public.profiles (id) on delete set null,
  add constraint companies_created_by_fkey foreign key (created_by) references public.profiles (id) on delete set null;
alter table public.time_logs
  add constraint time_logs_approved_by_fkey foreign key (approved_by) references public.profiles (id) on delete set null;
alter table public.invites
  add constraint invites_invited_by_fkey foreign key (invited_by) references public.profiles (id) on delete set null;
alter table public.audit_log
  add constraint audit_log_actor_id_fkey foreign key (actor_id) references public.profiles (id) on delete set null;

-- 2. Who is calling: the profile linked to the Clerk user in the token.
create or replace function private.me()
returns uuid language sql stable security definer set search_path = '' as $$
  select id from public.profiles where clerk_id = (select auth.jwt() ->> 'sub')
$$;

create or replace function private.my_role()
returns public.app_role language sql stable security definer set search_path = '' as $$
  select role from public.profiles where id = (select private.me())
$$;

create or replace function private.my_school()
returns uuid language sql stable security definer set search_path = '' as $$
  select school_id from public.profiles where id = (select private.me())
$$;

create or replace function private.my_company()
returns uuid language sql stable security definer set search_path = '' as $$
  select company_id from public.profiles where id = (select private.me()) and role = 'supervisor'
$$;

create or replace function private.is_staff()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles
    where id = (select private.me()) and role in ('coordinator', 'admin') and school_id is not null
  )
$$;

create or replace function private.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles
    where id = (select private.me()) and role = 'admin' and school_id is not null
  )
$$;

create or replace function private.student_in_my_school(student uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles s
    join public.profiles me on me.id = (select private.me())
    where s.id = student and me.role in ('coordinator', 'admin')
      and me.school_id is not null and s.school_id = me.school_id
  )
$$;

create or replace function private.student_folder_in_my_school(folder text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles s
    join public.profiles me on me.id = (select private.me())
    where s.id::text = folder and me.role in ('coordinator', 'admin')
      and me.school_id is not null and s.school_id = me.school_id
  )
$$;

create or replace function private.applied_to_my_company(student uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.applications a
    join public.jobs j on j.id = a.job_id
    join public.profiles me on me.id = (select private.me())
    where a.student_id = student and me.role = 'supervisor' and j.company_id = me.company_id
  )
$$;

create or replace function private.is_my_company_job(job uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.jobs j
    join public.profiles me on me.id = (select private.me())
    where j.id = job and me.role = 'supervisor' and j.company_id = me.company_id
  )
$$;

create or replace function private.partner_of_my_school(company uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.school_partners sp
    join public.profiles me on me.id = (select private.me())
    where sp.company_id = company and sp.school_id = me.school_id
      and me.role in ('coordinator', 'admin')
  )
$$;

create or replace function private.my_name()
returns text language sql stable security definer set search_path = '' as $$
  select coalesce(nullif(full_name, ''), email, 'Someone') from public.profiles where id = (select private.me())
$$;

create or replace function private.log(p_school uuid, p_action text, p_actor_name text default null)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if p_school is null then return; end if;
  insert into public.audit_log (school_id, actor_id, actor_name, action)
  values (p_school, (select private.me()), coalesce(p_actor_name, private.my_name(), 'Unisync'), p_action);
end;
$$;

-- 3. Policies that named the caller directly.
alter policy "Read yourself, your school, or your applicants" on public.profiles using (
  id = (select private.me())
  or (school_id is not null and school_id = (select private.my_school()) and (select private.is_staff()))
  or (role = 'supervisor' and company_id is not null and (select private.is_staff()) and private.partner_of_my_school(company_id))
  or (company_id is not null and company_id = (select private.my_company()))
  or private.applied_to_my_company(id)
);
alter policy "Update your own profile" on public.profiles
  using (id = (select private.me())) with check (id = (select private.me()));

alter policy "Read your resume, your students', or your applicants'" on public.resumes using (
  student_id = (select private.me())
  or private.student_in_my_school(student_id)
  or private.applied_to_my_company(student_id)
);
alter policy "Students create their resume" on public.resumes with check (student_id = (select private.me()));
alter policy "Students edit their resume" on public.resumes
  using (student_id = (select private.me())) with check (student_id = (select private.me()));

alter policy "Read your applications, your applicants, or your students'" on public.applications using (
  student_id = (select private.me())
  or private.is_my_company_job(job_id)
  or private.student_in_my_school(student_id)
);
alter policy "Students apply to open jobs" on public.applications with check (
  student_id = (select private.me())
  and (select private.my_role()) = 'student'
  and exists (
    select 1 from public.jobs j
    where j.id = job_id and j.status = 'open' and private.company_verified(j.company_id)
  )
);

alter policy "Students manage saved jobs" on public.saved_jobs
  using (student_id = (select private.me())) with check (student_id = (select private.me()));

alter policy "Read your forms or your students' forms" on public.student_forms using (
  student_id = (select private.me()) or private.student_in_my_school(student_id)
);

alter policy "Read your hours, your interns' hours, or your students' hours" on public.time_logs using (
  student_id = (select private.me())
  or company_id = (select private.my_company())
  or private.student_in_my_school(student_id)
);

alter policy "Read your notifications" on public.notifications using (user_id = (select private.me()));
alter policy "Mark your notifications read" on public.notifications
  using (user_id = (select private.me())) with check (user_id = (select private.me()));

alter policy "Students upload their own forms" on storage.objects
  with check (bucket_id = 'forms' and (storage.foldername(name))[1] = (select private.me())::text);
alter policy "Students replace their own forms" on storage.objects
  using (bucket_id = 'forms' and (storage.foldername(name))[1] = (select private.me())::text)
  with check (bucket_id = 'forms' and (storage.foldername(name))[1] = (select private.me())::text);
alter policy "Students and their school read forms" on storage.objects using (
  bucket_id = 'forms'
  and (
    (storage.foldername(name))[1] = (select private.me())::text
    or private.student_folder_in_my_school((storage.foldername(name))[1])
  )
);

-- 4. First sign-in: find, claim or create the caller's profile.
-- Claims come from the signed Clerk token, so the email is verified.
create or replace function public.ensure_profile(p_full_name text default null, p_account_type text default null)
returns table (id uuid, role public.app_role, is_new boolean)
language plpgsql security definer set search_path = '' as $$
#variable_conflict use_column
declare
  v_sub text := (select auth.jwt() ->> 'sub');
  v_email text := lower(nullif(trim((select auth.jwt() ->> 'email')), ''));
  v_name text := left(coalesce(nullif(trim(p_full_name), ''), nullif(trim((select auth.jwt() ->> 'name')), ''), ''), 120);
  v_id uuid;
  v_role public.app_role := 'student';
  v_school uuid;
  v_company uuid;
  v_scope text;
  inv public.invites%rowtype;
begin
  if v_sub is null then raise exception 'Sign in first.'; end if;

  select p.id, p.role into v_id, v_role from public.profiles p where p.clerk_id = v_sub;
  if v_id is not null then
    update public.profiles p set last_active_at = now(), email = coalesce(v_email, p.email),
      full_name = case when p.full_name = '' then v_name else p.full_name end
    where p.id = v_id;
    return query select v_id, v_role, false;
    return;
  end if;

  -- A profile made before sign-up (an invite applied to an existing record, or demo data).
  if v_email is not null then
    update public.profiles p set clerk_id = v_sub, last_active_at = now(),
      full_name = case when p.full_name = '' then v_name else p.full_name end
    where p.clerk_id is null and lower(p.email) = v_email
    returning p.id, p.role into v_id, v_role;
    if v_id is not null then
      return query select v_id, v_role, false;
      return;
    end if;

    select * into inv from public.invites i
    where lower(i.email) = v_email and i.accepted_at is null
    order by i.created_at desc limit 1;
  end if;

  if inv.id is not null then
    v_role := inv.role;
    v_school := inv.school_id;
    v_company := inv.company_id;
    v_scope := inv.scope;
    update public.invites set accepted_at = now() where invites.id = inv.id;
  elsif p_account_type = 'employer' then
    v_role := 'supervisor';
  else
    v_role := 'student';
    if v_email is not null then
      select s.id into v_school from public.schools s where s.email_domain = split_part(v_email, '@', 2);
    end if;
  end if;

  insert into public.profiles (clerk_id, role, full_name, email, school_id, company_id, scope)
  values (v_sub, v_role, v_name, v_email, v_school, v_company, v_scope)
  returning profiles.id into v_id;

  if v_role = 'student' then
    insert into public.student_forms (student_id, form_key)
    select v_id, k from unnest(array['resume', 'consent', 'medical', 'orientation', 'endorsement', 'training_plan']) as k;
  end if;

  if inv.id is not null and v_school is not null then
    perform private.log(v_school, 'joined as ' || v_role::text, coalesce(nullif(v_name, ''), v_email));
  end if;

  return query select v_id, v_role, true;
end;
$$;

-- 5. RPCs that named the caller directly.
create or replace function public.approve_resume()
returns timestamptz language plpgsql security definer set search_path = '' as $$
declare v_at timestamptz;
begin
  update public.resumes set approved_at = coalesce(approved_at, now())
  where student_id = (select private.me())
  returning approved_at into v_at;
  if v_at is null then raise exception 'Build your resume first.'; end if;
  update public.student_forms set status = 'approved', updated_at = now()
  where student_id = (select private.me()) and form_key = 'resume';
  return v_at;
end;
$$;

create or replace function public.submit_form(p_form text, p_path text)
returns void language plpgsql security definer set search_path = '' as $$
declare v_school uuid;
begin
  if p_form not in ('consent', 'medical', 'orientation', 'training_plan') then
    raise exception 'You can''t upload that form.';
  end if;
  if p_path is null or split_part(p_path, '/', 1) <> (select private.me())::text then
    raise exception 'Upload the file to your own folder.';
  end if;
  update public.student_forms set status = 'submitted', file_path = p_path, updated_at = now()
  where student_id = (select private.me()) and form_key = p_form and status <> 'approved';
  select school_id into v_school from public.profiles where id = (select private.me());
  perform private.log(v_school, 'uploaded the ' || replace(p_form, '_', ' ') || ' form');
end;
$$;

create or replace function public.accept_offer(p_application uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_company uuid;
  v_company_name text;
  v_school uuid;
begin
  update public.applications set status = 'hired', updated_at = now()
  where id = p_application and student_id = (select private.me()) and status = 'offer';
  if not found then raise exception 'That offer isn''t open.'; end if;

  select j.company_id, c.name into v_company, v_company_name
  from public.applications a join public.jobs j on j.id = a.job_id join public.companies c on c.id = j.company_id
  where a.id = p_application;

  perform private.notify_company(v_company, private.my_name() || ' accepted your offer', 'hired');
  select school_id into v_school from public.profiles where id = (select private.me());
  perform private.log(v_school, 'accepted an offer from ' || v_company_name);
end;
$$;

create or replace function public.log_hours(p_date date, p_hours numeric, p_note text default '')
returns void language plpgsql security definer set search_path = '' as $$
declare v_company uuid;
begin
  select j.company_id into v_company
  from public.applications a join public.jobs j on j.id = a.job_id
  where a.student_id = (select private.me()) and a.status = 'hired'
  order by a.updated_at desc limit 1;
  if v_company is null then raise exception 'You can log hours once you start an internship.'; end if;
  if p_date > current_date then raise exception 'You can''t log future hours.'; end if;
  insert into public.time_logs (student_id, company_id, work_date, hours, note)
  values ((select private.me()), v_company, p_date, p_hours, left(coalesce(p_note, ''), 300));
end;
$$;

create or replace function public.approve_hours()
returns int language plpgsql security definer set search_path = '' as $$
declare
  v_company uuid := private.my_company();
  v_count int;
  r record;
begin
  if v_company is null then raise exception 'Only company supervisors can approve hours.'; end if;
  for r in
    select p.school_id, count(*) as n
    from public.time_logs t join public.profiles p on p.id = t.student_id
    where t.company_id = v_company and t.status = 'pending'
    group by p.school_id
  loop
    perform private.log(r.school_id, 'approved ' || r.n || ' time logs');
  end loop;
  update public.time_logs set status = 'approved', approved_by = (select private.me())
  where company_id = v_company and status = 'pending';
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

create or replace function public.invite_people(p_emails text[], p_role public.app_role, p_scope text default null)
returns int language plpgsql security definer set search_path = '' as $$
declare
  v_school uuid := private.my_school();
  v_email text;
  v_count int := 0;
  v_existing uuid;
begin
  if not private.is_staff() then raise exception 'Only school staff can invite people.'; end if;
  if p_role = 'supervisor' then raise exception 'Supervisors join through their company.'; end if;
  if p_role <> 'student' and not private.is_admin() then raise exception 'Only admins can invite staff.'; end if;
  if coalesce(array_length(p_emails, 1), 0) > 500 then raise exception 'Invite up to 500 people at a time.'; end if;

  foreach v_email in array p_emails loop
    v_email := lower(trim(v_email));
    continue when v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$';
    v_existing := null;
    select id into v_existing from public.profiles
    where lower(email) = v_email and (school_id is null or school_id = v_school) and role <> 'supervisor';
    if v_existing is not null then
      update public.profiles set role = p_role, school_id = v_school, scope = coalesce(p_scope, scope)
      where id = v_existing;
      if p_role = 'student' then
        insert into public.student_forms (student_id, form_key)
        select v_existing, k from unnest(array['resume', 'consent', 'medical', 'orientation', 'endorsement', 'training_plan']) k
        on conflict do nothing;
      end if;
    else
      update public.invites set accepted_at = now() where lower(email) = v_email and accepted_at is null;
      insert into public.invites (email, role, school_id, scope, invited_by)
      values (v_email, p_role, v_school, p_scope, (select private.me()));
    end if;
    v_count := v_count + 1;
  end loop;

  perform private.log(v_school, 'invited ' || v_count || ' ' || p_role::text || case when v_count = 1 then '' else 's' end);
  return v_count;
end;
$$;

create or replace function public.set_member(p_user uuid, p_role public.app_role default null, p_status text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_name text;
  v_old public.app_role;
begin
  if not private.is_admin() then raise exception 'Only admins can change roles.'; end if;
  if p_user = (select private.me()) then raise exception 'Ask another admin to change your own role.'; end if;
  select coalesce(nullif(full_name, ''), email), role into v_name, v_old
  from public.profiles where id = p_user and school_id = private.my_school();
  if v_name is null then raise exception 'That person isn''t in your school.'; end if;
  if p_role = 'supervisor' or v_old = 'supervisor' then raise exception 'Supervisor roles belong to their company.'; end if;

  update public.profiles
  set role = coalesce(p_role, role), status = coalesce(p_status, status)
  where id = p_user;

  if p_role is not null and p_role <> v_old then
    perform private.log(private.my_school(), 'made ' || v_name || ' ' ||
      case p_role when 'admin' then 'an admin' else 'a ' || p_role::text end);
  end if;
  if p_status is not null then
    perform private.log(private.my_school(), case p_status when 'paused' then 'paused ' else 'reactivated ' end || v_name);
  end if;
end;
$$;

create or replace function public.register_company(
  p_name text, p_registration_type text, p_registration_no text,
  p_work_email text, p_phone text, p_city text, p_about text default null
) returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_id uuid;
  v_domain text := lower(split_part(coalesce(p_work_email, ''), '@', 2));
  v_free boolean;
begin
  if private.my_role() is distinct from 'supervisor' or private.my_company() is not null then
    raise exception 'Sign up as an employer to register a company.';
  end if;
  if char_length(coalesce(trim(p_name), '')) < 2 then raise exception 'Add your company name.'; end if;
  if char_length(coalesce(p_registration_no, '')) < 4 then raise exception 'Add your SEC or DTI registration number.'; end if;
  if v_domain = '' then raise exception 'Add a work email.'; end if;
  if char_length(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g')) < 7 then raise exception 'Add a phone number.'; end if;

  v_free := v_domain in ('gmail.com', 'yahoo.com', 'yahoo.com.ph', 'outlook.com', 'hotmail.com', 'icloud.com', 'proton.me', 'protonmail.com', 'live.com', 'ymail.com');

  insert into public.companies (name, city, about, registration_type, registration_no, work_email, phone, email_check, created_by)
  values (trim(p_name), p_city, p_about, p_registration_type, trim(p_registration_no), lower(trim(p_work_email)), trim(p_phone),
          case when v_free then 'failed'::public.check_status else 'confirmed'::public.check_status end,
          (select private.me()))
  returning id into v_id;

  update public.profiles set company_id = v_id, scope = trim(p_name) where id = (select private.me());
  return v_id;
end;
$$;

create or replace function public.approve_company(p_company uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare v_name text;
begin
  if not private.is_admin() then raise exception 'Only admins can approve companies.'; end if;
  update public.companies
  set verified_at = coalesce(verified_at, now()), verified_by = (select private.me()),
      registration_check = 'confirmed', email_check = 'confirmed', phone_check = 'confirmed'
  where id = p_company
  returning name into v_name;
  if v_name is null then raise exception 'Company not found.'; end if;
  insert into public.school_partners (school_id, company_id) values (private.my_school(), p_company)
  on conflict do nothing;
  perform private.notify_company(p_company, 'Unisync verified ' || v_name || '. Your jobs are live.', 'verified');
  perform private.log(private.my_school(), 'approved ' || v_name);
end;
$$;

-- Grants: signed-in users only.
do $$
declare f record;
begin
  for f in
    select p.oid::regprocedure as sig
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.prokind = 'f'
  loop
    execute format('revoke all on function %s from public, anon', f.sig);
    execute format('grant execute on function %s to authenticated', f.sig);
  end loop;
end;
$$;

revoke all on all functions in schema private from public, anon;
grant execute on all functions in schema private to authenticated;
