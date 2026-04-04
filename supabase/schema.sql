-- UniSync database schema
-- Run this in Supabase dashboard → SQL Editor to set up the database.

-- Users table
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  clerk_id text unique not null,
  email text not null,
  name text,
  avatar_url text,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now()
);

-- Profiles table
create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  headline text,
  summary text,
  location text,
  skills text[] not null default '{}',
  interests text[] not null default '{}',
  miscellaneous text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id)
);

-- Experiences table
create table if not exists experiences (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  company text,
  title text,
  start_date date,
  end_date date,
  is_current boolean not null default false,
  bullets text[] not null default '{}',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- Education table
create table if not exists education (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  school text,
  degree text,
  field text,
  start_date date,
  end_date date,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- Resumes table
create table if not exists resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  name text not null,
  template_id text not null default 'modern-minimalist',
  sections_config jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table resumes add column if not exists template_id text not null default 'modern-minimalist';
alter table resumes add column if not exists sections_config jsonb not null default '[]'::jsonb;

-- Enable RLS on all tables (defense in depth; primary guard is server-side filtering via service_role)
alter table users enable row level security;
alter table profiles enable row level security;
alter table experiences enable row level security;
alter table education enable row level security;
alter table resumes enable row level security;
