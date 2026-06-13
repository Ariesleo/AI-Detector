-- Veritas — Phase A tenancy migration (see ../docs/TENANCY.md)
-- Run once in the Supabase dashboard → SQL editor, AFTER supabase_schema.sql.
-- Pre-launch: rebuilds the history table to the workspace model (no real data yet).

-- ---------- workspaces ----------
create table if not exists public.workspaces (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  kind        text not null default 'personal' check (kind in ('personal', 'org')),
  plan        text not null default 'free' check (plan in ('free', 'pro')),
  created_by  uuid references auth.users (id) on delete set null,
  created_at  timestamptz not null default now()
);

create table if not exists public.workspace_members (
  workspace_id  uuid not null references public.workspaces (id) on delete cascade,
  user_id       uuid not null references auth.users (id) on delete cascade,
  role          text not null default 'member' check (role in ('owner', 'admin', 'member')),
  created_at    timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create index if not exists workspace_members_user_idx on public.workspace_members (user_id);

-- ---------- invitations (used from Phase B; schema ready now) ----------
create table if not exists public.invitations (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces (id) on delete cascade,
  email         text not null,
  role          text not null default 'member' check (role in ('admin', 'member')),
  token         uuid not null unique default gen_random_uuid(),
  invited_by    uuid references auth.users (id) on delete set null,
  expires_at    timestamptz not null default now() + interval '7 days',
  accepted_at   timestamptz,
  created_at    timestamptz not null default now()
);

create index if not exists invitations_ws_idx on public.invitations (workspace_id);

-- ---------- history: rebuild workspace-scoped (pre-launch, table is empty) ----------
drop table if exists public.history;
create table public.history (
  id            bigint generated always as identity primary key,
  workspace_id  uuid not null references public.workspaces (id) on delete cascade,
  user_id       uuid not null references auth.users (id) on delete cascade,
  report_id     text not null,
  sha256        text not null,
  verdict       text not null,
  confidence    real not null,
  created_at    timestamptz not null default now()
);

create index history_ws_created_idx on public.history (workspace_id, created_at desc);

-- ---------- usage metering (billing source of truth later) ----------
create table if not exists public.usage_events (
  id            bigint generated always as identity primary key,
  workspace_id  uuid not null references public.workspaces (id) on delete cascade,
  user_id       uuid references auth.users (id) on delete set null,
  engine        text not null,
  llm_used      boolean not null default false,
  created_at    timestamptz not null default now()
);

create index if not exists usage_ws_created_idx on public.usage_events (workspace_id, created_at desc);

-- ---------- audit log (append-only; written from Phase B) ----------
create table if not exists public.audit_log (
  id              bigint generated always as identity primary key,
  workspace_id    uuid not null references public.workspaces (id) on delete cascade,
  actor_user_id   uuid references auth.users (id) on delete set null,
  action          text not null,
  detail          jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now()
);

-- ---------- personal workspace auto-created at signup ----------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  ws_id uuid;
begin
  insert into public.workspaces (name, kind, created_by)
  values (coalesce(nullif(split_part(new.email, '@', 1), ''), 'Personal'), 'personal', new.id)
  returning id into ws_id;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (ws_id, new.id, 'owner');

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- backfill: personal workspaces for any pre-existing users ----------
insert into public.workspaces (name, kind, created_by)
select coalesce(nullif(split_part(u.email, '@', 1), ''), 'Personal'), 'personal', u.id
from auth.users u
where not exists (
  select 1
  from public.workspace_members m
  join public.workspaces w on w.id = m.workspace_id and w.kind = 'personal'
  where m.user_id = u.id
);

insert into public.workspace_members (workspace_id, user_id, role)
select w.id, w.created_by, 'owner'
from public.workspaces w
where w.created_by is not null
  and not exists (
    select 1 from public.workspace_members m where m.workspace_id = w.id
  );

-- ---------- RLS: defense-in-depth (backend service key bypasses) ----------
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.invitations enable row level security;
alter table public.history enable row level security;
alter table public.usage_events enable row level security;
alter table public.audit_log enable row level security;

create or replace function public.is_member(ws uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.workspace_members
    where workspace_id = ws and user_id = auth.uid()
  );
$$;

create policy "members read their workspaces"
  on public.workspaces for select using (public.is_member(id));

create policy "members read memberships"
  on public.workspace_members for select using (public.is_member(workspace_id));

create policy "members read workspace history"
  on public.history for select using (public.is_member(workspace_id));

-- invitations / usage_events / audit_log: service-key only for now (no policies).
