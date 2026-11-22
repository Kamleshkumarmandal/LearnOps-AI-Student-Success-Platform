-- LearnOps PostgreSQL schema foundation. Run in Supabase SQL Editor.
-- The dashboard's sample data is not connected to this schema yet.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role text not null check (role in ('student', 'mentor', 'admin')),
  github_username text,
  cohort text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cohorts (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  start_date date,
  end_date date,
  created_at timestamptz not null default now()
);

create table if not exists public.cohort_members (
  cohort_id uuid not null references public.cohorts(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (cohort_id, student_id)
);

create table if not exists public.learning_projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  repository_full_name text,
  status text not null default 'active' check (status in ('draft', 'active', 'submitted', 'reviewed')),
  progress integer not null default 0 check (progress between 0 and 100),
  due_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.learning_activities (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  source text not null check (source in ('github', 'assessment', 'project', 'mentor', 'system')),
  activity_type text not null,
  external_id text,
  repository_full_name text,
  title text not null,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique (source, external_id)
);

create table if not exists public.assessments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  score numeric(5,2) not null check (score between 0 and 100),
  max_score numeric(7,2) not null default 100,
  assessed_at timestamptz not null default now()
);

create table if not exists public.mentor_interventions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  mentor_id uuid references public.profiles(id) on delete set null,
  reason text not null,
  priority integer not null default 0 check (priority between 0 and 100),
  status text not null default 'open' check (status in ('open', 'scheduled', 'in_progress', 'resolved')),
  due_at timestamptz,
  resolution_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.github_webhook_events (
  id uuid primary key default gen_random_uuid(),
  delivery_id text not null unique,
  event_type text not null,
  repository_full_name text not null,
  sender_login text,
  action text,
  payload jsonb not null,
  received_at timestamptz not null default now()
);

create index if not exists profiles_cohort_idx on public.profiles(cohort);
create index if not exists activities_student_time_idx on public.learning_activities(student_id, occurred_at desc);
create index if not exists projects_owner_status_idx on public.learning_projects(owner_id, status);
create index if not exists interventions_priority_idx on public.mentor_interventions(status, priority desc);
create index if not exists webhook_repository_time_idx on public.github_webhook_events(repository_full_name, received_at desc);

alter table public.profiles enable row level security;
alter table public.cohorts enable row level security;
alter table public.cohort_members enable row level security;
alter table public.learning_projects enable row level security;
alter table public.learning_activities enable row level security;
alter table public.assessments enable row level security;
alter table public.mentor_interventions enable row level security;
alter table public.github_webhook_events enable row level security;

create policy "Profiles readable by owner" on public.profiles
  for select to authenticated using (id = auth.uid());
create policy "Profiles updatable by owner" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy "Students manage own projects" on public.learning_projects
  for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "Students read own activities" on public.learning_activities
  for select to authenticated using (student_id = auth.uid());
create policy "Students read own assessments" on public.assessments
  for select to authenticated using (student_id = auth.uid());
create policy "Students read own interventions" on public.mentor_interventions
  for select to authenticated using (student_id = auth.uid());

-- Starter read access only; add institution/cohort membership policies before production.
create policy "Authenticated users read cohorts" on public.cohorts
  for select to authenticated using (true);
create policy "Authenticated users read cohort membership" on public.cohort_members
  for select to authenticated using (true);

-- There is deliberately no browser policy for webhook inbox rows.
-- The server route uses the service-role credential to insert verified deliveries.
