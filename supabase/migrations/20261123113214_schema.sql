-- Unisync core schema: schools, companies, people, resumes, jobs, applications,
-- CHED forms, time logs, notifications, invites and the activity log.

create schema if not exists private;

create type public.app_role as enum ('student', 'coordinator', 'supervisor', 'admin');
create type public.app_status as enum ('new', 'reviewing', 'interview', 'offer', 'hired', 'declined', 'withdrawn');
create type public.form_status as enum ('missing', 'submitted', 'approved');
create type public.check_status as enum ('pending', 'confirmed', 'failed');
create type public.moa_status as enum ('none', 'sent', 'signed');

create table public.schools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  short_name text not null,
  email_domain text unique,
  term_label text not null default 'Midyear OJT 2027',
  required_hours int not null default 486 check (required_hours > 0),
  created_at timestamptz not null default now()
);

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  city text,
  about text,
  logo text not null default 'spark',
  logo_bg text not null default '#E8EBFF',
  registration_type text not null default 'SEC' check (registration_type in ('SEC', 'DTI')),
  registration_no text,
  work_email text,
  phone text,
  registration_check public.check_status not null default 'pending',
  email_check public.check_status not null default 'pending',
  phone_check public.check_status not null default 'pending',
  verified_at timestamptz,
  verified_by uuid references auth.users (id) on delete set null,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.app_role not null default 'student',
  full_name text not null default '' check (char_length(full_name) <= 120),
  email text,
  phone text check (char_length(phone) <= 32),
  school_id uuid references public.schools (id) on delete set null,
  company_id uuid references public.companies (id) on delete set null,
  course text check (char_length(course) <= 120),
  year_level text check (char_length(year_level) <= 40),
  city text check (char_length(city) <= 80),
  scope text,
  status text not null default 'active' check (status in ('active', 'paused')),
  last_active_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index profiles_school_idx on public.profiles (school_id);
create index profiles_company_idx on public.profiles (company_id);
create index profiles_email_idx on public.profiles (lower(email));

create table public.school_partners (
  school_id uuid not null references public.schools (id) on delete cascade,
  company_id uuid not null references public.companies (id) on delete cascade,
  moa_status public.moa_status not null default 'none',
  updated_at timestamptz not null default now(),
  primary key (school_id, company_id)
);
create index school_partners_company_idx on public.school_partners (company_id);

create table public.resumes (
  student_id uuid primary key references public.profiles (id) on delete cascade,
  data jsonb not null default '{}'::jsonb check (pg_column_size(data) < 64000),
  template text not null default 'classic' check (template in ('classic', 'modern', 'compact')),
  approved_at timestamptz,
  updated_at timestamptz not null default now()
);

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  title text not null check (char_length(title) between 2 and 120),
  city text not null check (char_length(city) between 1 and 80),
  mode text not null default 'On-site' check (mode in ('On-site', 'Hybrid', 'Remote')),
  allowance int not null default 0 check (allowance between 0 and 200000),
  schedule text not null default '',
  dates text not null default '',
  hours int not null default 486 check (hours between 1 and 2000),
  teaser text not null default '',
  about text not null default '',
  duties text[] not null default '{}',
  needs text[] not null default '{}',
  perks text[] not null default '{}',
  programs text[] not null default '{}',
  skills text[] not null default '{}',
  openings int not null default 1 check (openings between 1 and 100),
  status text not null default 'open' check (status in ('open', 'closed')),
  created_at timestamptz not null default now()
);
create index jobs_company_idx on public.jobs (company_id);

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  status public.app_status not null default 'new',
  viewed_at timestamptz,
  interview_at timestamptz,
  interview_where text check (char_length(interview_where) <= 200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (job_id, student_id)
);
create index applications_student_idx on public.applications (student_id);

create table public.saved_jobs (
  student_id uuid not null references public.profiles (id) on delete cascade,
  job_id uuid not null references public.jobs (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (student_id, job_id)
);
create index saved_jobs_job_idx on public.saved_jobs (job_id);

create table public.student_forms (
  student_id uuid not null references public.profiles (id) on delete cascade,
  form_key text not null check (form_key in ('resume', 'consent', 'medical', 'orientation', 'endorsement', 'training_plan')),
  status public.form_status not null default 'missing',
  file_path text,
  updated_at timestamptz not null default now(),
  primary key (student_id, form_key)
);

create table public.time_logs (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  company_id uuid not null references public.companies (id) on delete cascade,
  work_date date not null default current_date,
  hours numeric(4, 1) not null check (hours > 0 and hours <= 12),
  note text not null default '' check (char_length(note) <= 300),
  status text not null default 'pending' check (status in ('pending', 'approved')),
  approved_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
create index time_logs_student_idx on public.time_logs (student_id);
create index time_logs_company_idx on public.time_logs (company_id);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  kind text not null default 'info',
  created_at timestamptz not null default now(),
  read_at timestamptz
);
create index notifications_user_idx on public.notifications (user_id, created_at desc);

create table public.invites (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  role public.app_role not null,
  school_id uuid references public.schools (id) on delete cascade,
  company_id uuid references public.companies (id) on delete cascade,
  scope text,
  invited_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  accepted_at timestamptz
);
create unique index invites_open_email_idx on public.invites (lower(email)) where accepted_at is null;
create index invites_school_idx on public.invites (school_id);

create table public.audit_log (
  id bigint generated always as identity primary key,
  school_id uuid references public.schools (id) on delete cascade,
  actor_id uuid references auth.users (id) on delete set null,
  actor_name text not null,
  action text not null,
  created_at timestamptz not null default now()
);
create index audit_log_school_idx on public.audit_log (school_id, created_at desc);
