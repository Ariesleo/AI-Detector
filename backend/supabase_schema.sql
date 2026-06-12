-- AI Content Detection — Supabase schema
-- Run once in the Supabase dashboard → SQL editor.
-- The backend talks to these tables with the service_role key (bypasses RLS).
-- RLS is enabled with user-read policies so the mobile app can later read
-- history/reports directly with the anon key + user JWT if we want.

-- Persistent report cache, keyed by image content hash.
create table if not exists public.reports (
  sha256      text primary key,
  report_id   text not null unique,
  verdict     text not null,
  report      jsonb not null,
  created_at  timestamptz not null default now()
);

create index if not exists reports_report_id_idx on public.reports (report_id);

-- One row per check an authenticated user runs (cache hits included).
create table if not exists public.history (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references auth.users (id) on delete cascade,
  report_id   text not null,
  sha256      text not null,
  verdict     text not null,
  confidence  real not null,
  created_at  timestamptz not null default now()
);

create index if not exists history_user_created_idx
  on public.history (user_id, created_at desc);

-- Lock both tables down; the backend's service_role key bypasses RLS.
alter table public.reports enable row level security;
alter table public.history enable row level security;

-- Users may read their own history (for a future direct-from-app path).
create policy "users read own history"
  on public.history for select
  using (auth.uid() = user_id);

-- Reports are not user-owned; no anon/user policies — service key only.
