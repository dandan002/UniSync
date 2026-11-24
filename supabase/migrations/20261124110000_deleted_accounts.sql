-- A Clerk session token stays valid for up to a minute after the Clerk user
-- is deleted. Without this, the next page load in that minute ran
-- ensure_profile() and recreated an empty account. Deleted logins are
-- remembered for a day (well past any token's life) and can't come back.

create table if not exists private.deleted_accounts (
  clerk_id text primary key,
  deleted_at timestamptz not null default now()
);
revoke all on private.deleted_accounts from public, anon, authenticated;

-- Private tables are only read by security definer functions, which own
-- them. RLS with no policies keeps everyone else out even if a grant slips.
alter table private.deleted_accounts enable row level security;
alter table private.sync_turns enable row level security;

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

  -- The app treats this hint as signed out.
  if exists (select 1 from private.deleted_accounts d where d.clerk_id = v_sub) then
    raise exception 'This account was deleted.' using errcode = '42501', hint = 'account_deleted';
  end if;

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

  if me.clerk_id is not null then
    insert into private.deleted_accounts (clerk_id) values (me.clerk_id) on conflict (clerk_id) do nothing;
  end if;
  delete from private.deleted_accounts where deleted_at < now() - interval '1 day';

  delete from public.profiles where id = me.id;
end;
$$;

revoke all on function public.ensure_profile(text, text) from public, anon;
grant execute on function public.ensure_profile(text, text) to authenticated;
revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
