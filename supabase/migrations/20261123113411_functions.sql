-- Triggers and RPCs. Every RPC checks the caller's role itself, runs with a
-- fixed search_path, and is callable only by signed-in users.

-- Who the caller is, for activity log lines.
create or replace function private.my_name()
returns text language sql stable security definer set search_path = '' as $$
  select coalesce(nullif(full_name, ''), email, 'Someone') from public.profiles where id = (select auth.uid())
$$;

create or replace function private.log(p_school uuid, p_action text, p_actor_name text default null)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if p_school is null then return; end if;
  insert into public.audit_log (school_id, actor_id, actor_name, action)
  values (p_school, (select auth.uid()), coalesce(p_actor_name, private.my_name(), 'Unisync'), p_action);
end;
$$;

create or replace function private.notify(p_user uuid, p_title text, p_kind text default 'info')
returns void language sql security definer set search_path = '' as $$
  insert into public.notifications (user_id, title, kind) values (p_user, p_title, p_kind)
$$;

create or replace function private.notify_company(p_company uuid, p_title text, p_kind text default 'info')
returns void language sql security definer set search_path = '' as $$
  insert into public.notifications (user_id, title, kind)
  select id, p_title, p_kind from public.profiles where company_id = p_company and role = 'supervisor'
$$;

revoke all on all functions in schema private from public, anon;
grant execute on all functions in schema private to authenticated;

-- New auth user -> profile. Invites decide role and school; otherwise a school
-- email domain links the student to their school.
create or replace function private.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  inv public.invites%rowtype;
  v_role public.app_role := 'student';
  v_school uuid;
  v_company uuid;
  v_scope text;
  v_domain text := lower(split_part(coalesce(new.email, ''), '@', 2));
begin
  if new.email is not null then
    select * into inv from public.invites
    where lower(email) = lower(new.email) and accepted_at is null
    order by created_at desc limit 1;
  end if;

  if inv.id is not null then
    v_role := inv.role;
    v_school := inv.school_id;
    v_company := inv.company_id;
    v_scope := inv.scope;
    update public.invites set accepted_at = now() where id = inv.id;
  elsif coalesce(new.raw_user_meta_data ->> 'account_type', '') = 'employer' then
    v_role := 'supervisor';
  elsif v_domain <> '' then
    select id into v_school from public.schools where email_domain = v_domain;
  end if;

  insert into public.profiles (id, role, full_name, email, phone, school_id, company_id, scope)
  values (
    new.id, v_role,
    left(coalesce(new.raw_user_meta_data ->> 'full_name', ''), 120),
    new.email, new.phone, v_school, v_company, v_scope
  );

  if v_role = 'student' then
    insert into public.student_forms (student_id, form_key)
    select new.id, k from unnest(array['resume', 'consent', 'medical', 'orientation', 'endorsement', 'training_plan']) as k;
  end if;

  if inv.id is not null and v_school is not null then
    perform private.log(v_school, 'joined as ' || v_role::text,
      coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), new.email));
  end if;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- Application changes notify the other side.
create or replace function private.on_application_change()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_company uuid;
  v_company_name text;
  v_title text;
  v_student text;
begin
  select j.company_id, c.name, j.title into v_company, v_company_name, v_title
  from public.jobs j join public.companies c on c.id = j.company_id where j.id = new.job_id;

  if tg_op = 'INSERT' then
    select coalesce(nullif(full_name, ''), 'A student') into v_student from public.profiles where id = new.student_id;
    perform private.notify_company(v_company, v_student || ' applied to ' || v_title, 'applicant');
    return new;
  end if;

  if new.status is distinct from old.status then
    new.updated_at := now();
    if new.status = 'interview' then
      perform private.notify(new.student_id, v_company_name || ' wants to interview you', 'interview');
    elsif new.status = 'offer' then
      perform private.notify(new.student_id, v_company_name || ' sent you an offer', 'offer');
    elsif new.status = 'declined' then
      perform private.notify(new.student_id, v_company_name || ' filled the ' || v_title || ' role', 'info');
    elsif new.status = 'reviewing' and old.status = 'new' then
      perform private.notify(new.student_id, v_company_name || ' viewed your application', 'info');
    end if;
  end if;
  if new.interview_at is distinct from old.interview_at and new.interview_at is not null and new.status = old.status then
    perform private.notify(new.student_id, v_company_name || ' changed your interview time', 'interview');
  end if;
  return new;
end;
$$;

create trigger applications_after_insert
  after insert on public.applications
  for each row execute function private.on_application_change();

create trigger applications_before_update
  before update on public.applications
  for each row execute function private.on_application_change();

-- Students: approve the resume (hold to approve).
create or replace function public.approve_resume()
returns timestamptz language plpgsql security definer set search_path = '' as $$
declare v_at timestamptz;
begin
  update public.resumes set approved_at = coalesce(approved_at, now())
  where student_id = (select auth.uid())
  returning approved_at into v_at;
  if v_at is null then raise exception 'Build your resume first.'; end if;
  update public.student_forms set status = 'approved', updated_at = now()
  where student_id = (select auth.uid()) and form_key = 'resume';
  return v_at;
end;
$$;

-- Students: mark a form as submitted after uploading the file.
create or replace function public.submit_form(p_form text, p_path text)
returns void language plpgsql security definer set search_path = '' as $$
declare v_school uuid;
begin
  if p_form not in ('consent', 'medical', 'orientation', 'training_plan') then
    raise exception 'You can''t upload that form.';
  end if;
  if p_path is null or split_part(p_path, '/', 1) <> (select auth.uid())::text then
    raise exception 'Upload the file to your own folder.';
  end if;
  update public.student_forms set status = 'submitted', file_path = p_path, updated_at = now()
  where student_id = (select auth.uid()) and form_key = p_form and status <> 'approved';
  select school_id into v_school from public.profiles where id = (select auth.uid());
  perform private.log(v_school, 'uploaded the ' || replace(p_form, '_', ' ') || ' form');
end;
$$;

-- Students: accept an offer.
create or replace function public.accept_offer(p_application uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_company uuid;
  v_company_name text;
  v_school uuid;
begin
  update public.applications set status = 'hired', updated_at = now()
  where id = p_application and student_id = (select auth.uid()) and status = 'offer';
  if not found then raise exception 'That offer isn''t open.'; end if;

  select j.company_id, c.name into v_company, v_company_name
  from public.applications a join public.jobs j on j.id = a.job_id join public.companies c on c.id = j.company_id
  where a.id = p_application;

  perform private.notify_company(v_company, private.my_name() || ' accepted your offer', 'hired');
  select school_id into v_school from public.profiles where id = (select auth.uid());
  perform private.log(v_school, 'accepted an offer from ' || v_company_name);
end;
$$;

-- Students: log hours at the company that hired them.
create or replace function public.log_hours(p_date date, p_hours numeric, p_note text default '')
returns void language plpgsql security definer set search_path = '' as $$
declare v_company uuid;
begin
  select j.company_id into v_company
  from public.applications a join public.jobs j on j.id = a.job_id
  where a.student_id = (select auth.uid()) and a.status = 'hired'
  order by a.updated_at desc limit 1;
  if v_company is null then raise exception 'You can log hours once you start an internship.'; end if;
  if p_date > current_date then raise exception 'You can''t log future hours.'; end if;
  insert into public.time_logs (student_id, company_id, work_date, hours, note)
  values ((select auth.uid()), v_company, p_date, p_hours, left(coalesce(p_note, ''), 300));
end;
$$;

-- Supervisors: approve every pending time log for their company.
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
  update public.time_logs set status = 'approved', approved_by = (select auth.uid())
  where company_id = v_company and status = 'pending';
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

-- Supervisors: send a message to an applicant. Asking for money is blocked.
create or replace function public.send_message(p_application uuid, p_body text)
returns text language plpgsql security definer set search_path = '' as $$
declare
  v_student uuid;
  v_school uuid;
  v_company_name text;
begin
  if not private.is_my_company_job((select job_id from public.applications where id = p_application)) then
    raise exception 'You can only message your own applicants.';
  end if;
  if char_length(coalesce(p_body, '')) not between 1 and 1000 then
    raise exception 'Write a message up to 1,000 characters.';
  end if;
  select a.student_id, p.school_id, c.name into v_student, v_school, v_company_name
  from public.applications a
  join public.profiles p on p.id = a.student_id
  join public.jobs j on j.id = a.job_id
  join public.companies c on c.id = j.company_id
  where a.id = p_application;

  if p_body ~* '(deposit|processing fee|placement fee|training fee|reservation fee|bayad|magbayad|send money|gcash|maya|bank transfer|remit)' then
    perform private.log(v_school, 'blocked a message from ' || v_company_name || ' asking for money', 'Unisync');
    return 'blocked';
  end if;

  perform private.notify(v_student, v_company_name || ': ' || left(p_body, 180), 'message');
  return 'sent';
end;
$$;

-- Staff: remind students (needs attention, bulk bar).
create or replace function public.send_reminders(p_students uuid[], p_message text default null)
returns int language plpgsql security definer set search_path = '' as $$
declare v_count int;
begin
  if not private.is_staff() then raise exception 'Only school staff can send reminders.'; end if;
  insert into public.notifications (user_id, title, kind)
  select s.id, coalesce(nullif(p_message, ''), 'Your coordinator sent a reminder: finish your resume and school forms.'), 'reminder'
  from public.profiles s
  where s.id = any (p_students) and s.role = 'student' and s.school_id = private.my_school();
  get diagnostics v_count = row_count;
  perform private.log(private.my_school(), 'sent a reminder to ' || v_count || case when v_count = 1 then ' student' else ' students' end);
  return v_count;
end;
$$;

-- Staff: endorse students (approves the endorsement letter).
create or replace function public.endorse_students(p_students uuid[])
returns int language plpgsql security definer set search_path = '' as $$
declare v_count int;
begin
  if not private.is_staff() then raise exception 'Only school staff can endorse students.'; end if;
  update public.student_forms f set status = 'approved', updated_at = now()
  from public.profiles s
  where f.student_id = s.id and f.form_key = 'endorsement'
    and s.id = any (p_students) and s.school_id = private.my_school() and f.status <> 'approved';
  get diagnostics v_count = row_count;
  insert into public.notifications (user_id, title, kind)
  select s.id, 'Your school endorsed you for internships', 'form'
  from public.profiles s where s.id = any (p_students) and s.school_id = private.my_school();
  perform private.log(private.my_school(), 'endorsed ' || v_count || case when v_count = 1 then ' student' else ' students' end);
  return v_count;
end;
$$;

-- Staff: approve or return a submitted form.
create or replace function public.review_form(p_student uuid, p_form text, p_approve boolean)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not private.student_in_my_school(p_student) then raise exception 'That student isn''t in your school.'; end if;
  update public.student_forms
  set status = case when p_approve then 'approved'::public.form_status else 'missing'::public.form_status end,
      file_path = case when p_approve then file_path else null end,
      updated_at = now()
  where student_id = p_student and form_key = p_form;
  perform private.notify(p_student,
    case when p_approve then 'Your ' || replace(p_form, '_', ' ') || ' form was approved'
         else 'Your coordinator returned your ' || replace(p_form, '_', ' ') || ' form. Upload it again.' end,
    'form');
end;
$$;

-- Staff: send MOAs to partner companies that don't have a signed one.
create or replace function public.send_moas(p_companies uuid[] default null)
returns int language plpgsql security definer set search_path = '' as $$
declare
  v_school uuid := private.my_school();
  v_school_name text;
  v_count int;
  r record;
begin
  if not private.is_staff() then raise exception 'Only school staff can send MOAs.'; end if;
  select name into v_school_name from public.schools where id = v_school;
  for r in
    update public.school_partners set moa_status = 'sent', updated_at = now()
    where school_id = v_school and moa_status = 'none'
      and (p_companies is null or company_id = any (p_companies))
    returning company_id
  loop
    perform private.notify_company(r.company_id, v_school_name || ' sent you an MOA to sign', 'moa');
  end loop;
  get diagnostics v_count = row_count;
  select count(*) into v_count from public.school_partners where school_id = v_school and moa_status = 'sent';
  perform private.log(v_school, 'sent MOAs to partner companies');
  return v_count;
end;
$$;

-- Supervisors: sign a school's MOA.
create or replace function public.sign_moa(p_school uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare v_company uuid := private.my_company();
begin
  if v_company is null then raise exception 'Only company supervisors can sign MOAs.'; end if;
  update public.school_partners set moa_status = 'signed', updated_at = now()
  where school_id = p_school and company_id = v_company and moa_status <> 'signed';
  if not found then raise exception 'There''s no MOA to sign.'; end if;
  perform private.log(p_school, 'signed the MOA for ' || (select name from public.companies where id = v_company));
end;
$$;

-- Staff: nudge supervisors who have time logs waiting.
create or replace function public.remind_supervisors()
returns int language plpgsql security definer set search_path = '' as $$
declare
  v_school uuid := private.my_school();
  v_count int;
begin
  if not private.is_staff() then raise exception 'Only school staff can remind supervisors.'; end if;
  insert into public.notifications (user_id, title, kind)
  select distinct sup.id, 'Time logs are waiting for your approval', 'reminder'
  from public.time_logs t
  join public.profiles s on s.id = t.student_id
  join public.profiles sup on sup.company_id = t.company_id and sup.role = 'supervisor'
  where t.status = 'pending' and s.school_id = v_school;
  get diagnostics v_count = row_count;
  perform private.log(v_school, 'reminded supervisors about pending time logs');
  return v_count;
end;
$$;

-- Admins and coordinators: invite people. Coordinators can only invite students.
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
      delete from public.invites where lower(email) = v_email and accepted_at is null;
      insert into public.invites (email, role, school_id, scope, invited_by)
      values (v_email, p_role, v_school, p_scope, (select auth.uid()));
    end if;
    v_count := v_count + 1;
  end loop;

  perform private.log(v_school, 'invited ' || v_count || ' ' || p_role::text || case when v_count = 1 then '' else 's' end);
  return v_count;
end;
$$;

-- Admins: change a member's role or pause them.
create or replace function public.set_member(p_user uuid, p_role public.app_role default null, p_status text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_name text;
  v_old public.app_role;
begin
  if not private.is_admin() then raise exception 'Only admins can change roles.'; end if;
  if p_user = (select auth.uid()) then raise exception 'Ask another admin to change your own role.'; end if;
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

-- Employers: register a company. The caller signed up as an employer.
create or replace function public.register_company(
  p_name text, p_registration_type text, p_registration_no text,
  p_work_email text, p_phone text, p_city text, p_about text default null
) returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_id uuid;
  v_domain text := lower(split_part(coalesce(p_work_email, ''), '@', 2));
  v_free boolean;
begin
  if private.my_role() <> 'supervisor' or private.my_company() is not null then
    raise exception 'Sign up as an employer to register a company.';
  end if;
  if char_length(coalesce(p_registration_no, '')) < 4 then raise exception 'Add your SEC or DTI registration number.'; end if;
  if v_domain = '' then raise exception 'Add a work email.'; end if;
  if char_length(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g')) < 7 then raise exception 'Add a phone number.'; end if;

  v_free := v_domain in ('gmail.com', 'yahoo.com', 'yahoo.com.ph', 'outlook.com', 'hotmail.com', 'icloud.com', 'proton.me', 'protonmail.com', 'live.com', 'ymail.com');

  insert into public.companies (name, city, about, registration_type, registration_no, work_email, phone, email_check, created_by)
  values (trim(p_name), p_city, p_about, p_registration_type, trim(p_registration_no), lower(trim(p_work_email)), trim(p_phone),
          case when v_free then 'failed'::public.check_status else 'confirmed'::public.check_status end,
          (select auth.uid()))
  returning id into v_id;

  update public.profiles set company_id = v_id, scope = trim(p_name) where id = (select auth.uid());
  return v_id;
end;
$$;

-- Admins: approve a company after checking its records.
create or replace function public.approve_company(p_company uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare v_name text;
begin
  if not private.is_admin() then raise exception 'Only admins can approve companies.'; end if;
  update public.companies
  set verified_at = coalesce(verified_at, now()), verified_by = (select auth.uid()),
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

-- Staff: export the CHED report (logs the export; the app builds the CSV).
create or replace function public.log_ched_export()
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not private.is_staff() then raise exception 'Only school staff can export reports.'; end if;
  perform private.log(private.my_school(), 'exported the CHED report');
end;
$$;

-- Lock down: only signed-in users may call the public RPCs.
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
