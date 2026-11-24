-- Students can delete their resume and start over, and anyone can delete
-- their account. Both go through checked functions; clients still have no
-- delete rights on the tables themselves.

-- 1. Shared demo personas can't be deleted. The flag lives in a column no
--    client can write, so changing the account's email doesn't get around it.
alter table public.profiles add column if not exists demo boolean not null default false;
update public.profiles set demo = true where lower(coalesce(email, '')) ~ '(@|\.)example\.com$';

-- 2. Students remove their own uploaded forms (account deletion clears the
--    folder through the Storage API first).
drop policy if exists "Students delete their own forms" on storage.objects;
create policy "Students delete their own forms" on storage.objects
  for delete to authenticated
  using (bucket_id = 'forms' and (storage.foldername(name))[1] = (select private.me())::text);

-- 3. Start over: removes the resume and resets the resume form. The student
--    rebuilds it from onboarding.
create or replace function public.delete_my_resume()
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_me uuid := private.me();
begin
  if v_me is null or private.my_role() is distinct from 'student' then
    raise exception 'Only students have a resume to delete.' using errcode = '42501';
  end if;
  delete from public.resumes where student_id = v_me;
  update public.student_forms set status = 'missing', file_path = null, updated_at = now()
  where student_id = v_me and form_key = 'resume';
end;
$$;

-- 4. Delete the caller's profile and everything that cascades from it:
--    resume, applications, forms, hours, saved jobs, notifications and Sync
--    chat usage. Audit lines keep the name but lose the link.
create or replace function public.delete_my_account()
returns void language plpgsql security definer set search_path = '' as $$
declare
  me public.profiles%rowtype;
  v_company uuid;
  v_name text;
begin
  select * into me from public.profiles where id = (select private.me());
  if me.id is null then raise exception 'Sign in first.' using errcode = '42501'; end if;
  if me.demo then raise exception 'Demo accounts can''t be deleted.' using errcode = '42501'; end if;

  -- A school always keeps at least one admin.
  if me.role = 'admin' and me.school_id is not null and not exists (
    select 1 from public.profiles
    where school_id = me.school_id and role = 'admin' and status = 'active' and id <> me.id
  ) then
    raise exception 'You''re the only admin for your school. Make someone else an admin first.';
  end if;

  v_name := coalesce(nullif(me.full_name, ''), me.email, 'Someone');

  -- Companies still considering this student hear that they've left.
  if me.role = 'student' then
    for v_company in
      select distinct j.company_id
      from public.applications a join public.jobs j on j.id = a.job_id
      where a.student_id = me.id and a.status not in ('declined', 'withdrawn')
    loop
      perform private.notify_company(v_company, v_name || ' deleted their Unisync account', 'info');
    end loop;
  end if;

  -- The last supervisor leaving closes the company's open jobs, so students
  -- don't apply to postings nobody reads.
  if me.role = 'supervisor' and me.company_id is not null and not exists (
    select 1 from public.profiles where company_id = me.company_id and role = 'supervisor' and id <> me.id
  ) then
    update public.jobs set status = 'closed' where company_id = me.company_id and status = 'open';
  end if;

  perform private.log(me.school_id, 'deleted their account', v_name);
  delete from public.profiles where id = me.id;
end;
$$;

revoke all on function public.delete_my_resume() from public, anon;
revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_resume() to authenticated;
grant execute on function public.delete_my_account() to authenticated;
