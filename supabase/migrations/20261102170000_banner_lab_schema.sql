-- Banner Lab · core schema
--
-- Auth is Clerk, connected to Supabase as a third-party auth provider, so a
-- request's user is the Clerk user id in the JWT `sub` claim (text, e.g.
-- "user_2ab…"), not a Supabase auth.users row.
--
-- Projects belong to a workspace: a Clerk Organization, or a personal
-- workspace for someone working alone. Workspaces and memberships are written
-- by the Clerk webhook (server, service role); people only read them.
--
-- Every table has row-level security. Access is granted explicitly per table
-- (new tables are NOT exposed to the Data API by default; see the top).

-- ── Don't expose new tables automatically ──────────────────────────────────
-- The project was created with "Automatically expose new tables" on; turn that
-- off so every table is granted on purpose.
alter default privileges for role postgres in schema public revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema public revoke all on sequences from anon, authenticated;
alter default privileges for role postgres in schema public revoke execute on functions from anon, authenticated;

-- ── Helpers (private schema: not exposed through the Data API) ────────────
create schema if not exists private;
grant usage on schema private to authenticated;

-- The Clerk user id of the request (null when not signed in).
create or replace function private.user_id()
returns text
language sql stable
set search_path = ''
as $$ select nullif(auth.jwt() ->> 'sub', '') $$;

-- ── Workspaces ────────────────────────────────────────────────────────────
create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  clerk_org_id text unique,                -- Clerk Organization id (null for a personal workspace)
  personal_owner text unique,              -- Clerk user id (only for a personal workspace)
  name text not null,
  created_at timestamptz not null default now(),
  constraint workspaces_kind check ((clerk_org_id is null) <> (personal_owner is null))
);

create table public.workspace_members (
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id text not null,                   -- Clerk user id
  role text not null default 'member' check (role in ('admin', 'member')),
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);
create index workspace_members_user_idx on public.workspace_members (user_id);

-- Is the request's user in this workspace? SECURITY DEFINER so policies on
-- other tables can ask without tripping workspace_members' own RLS.
create or replace function private.is_member(ws uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.workspace_members m
    where m.workspace_id = ws and m.user_id = private.user_id()
  ) or exists (
    select 1 from public.workspaces w
    where w.id = ws and w.personal_owner = private.user_id()
  )
$$;

-- ── Projects ──────────────────────────────────────────────────────────────
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  created_by text not null default private.user_id(),
  name text not null,
  kind text not null default 'kit' check (kind in ('kit', 'logo', 'banner')),
  event_key text,                          -- sample / vertical key the project was started from
  prompt text,
  model_id text,
  colors jsonb not null default '{}'::jsonb,
  logo_lab jsonb,                          -- { methodId, lookId, lookLabel } for logo projects
  selected_banner_id uuid,                 -- FK added below (banners references projects)
  status text not null default 'ready' check (status in ('building', 'ready')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index projects_workspace_idx on public.projects (workspace_id, updated_at desc);

create or replace function private.can_access_project(pid uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$ select coalesce((select private.is_member(p.workspace_id) from public.projects p where p.id = pid), false) $$;

create or replace function private.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$ begin new.updated_at := now(); return new; end $$;

create trigger projects_touch before update on public.projects
  for each row execute function private.touch_updated_at();

-- ── Logo files: upload, cleaned versions, dark-banner looks, SVG ──────────
create table public.brand_assets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  kind text not null check (kind in ('logo_upload', 'logo_clean', 'logo_look', 'logo_svg')),
  label text,
  storage_path text not null,              -- banner-lab bucket: {workspace_id}/{project_id}/…
  width int,
  height int,
  meta jsonb not null default '{}'::jsonb, -- method / look id, contrast scores…
  created_at timestamptz not null default now()
);
create index brand_assets_project_idx on public.brand_assets (project_id);

-- ── Banner sets (one per prompt) and their banners ───────────────────────
create table public.banner_sets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  n int not null,                          -- Set 1, Set 2…
  prompt text not null,
  model_id text,
  status text not null default 'building' check (status in ('building', 'ready', 'failed')),
  created_by text not null default private.user_id(),
  created_at timestamptz not null default now(),
  unique (project_id, n)
);

create table public.banners (
  id uuid primary key default gen_random_uuid(),
  set_id uuid not null references public.banner_sets (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  position int not null default 0,
  storage_path text,                       -- our copy (Higgsfield URLs expire after ~7 days)
  source_url text,                         -- original generation URL
  kind text check (kind in ('photo', 'pattern')),
  width int,
  height int,
  grade jsonb,                             -- banner-standard check (center contrast…)
  created_at timestamptz not null default now()
);
create index banners_set_idx on public.banners (set_id, position);
create index banners_project_idx on public.banners (project_id);

alter table public.projects
  add constraint projects_selected_banner_fk
  foreign key (selected_banner_id) references public.banners (id) on delete set null;
create index projects_selected_banner_idx on public.projects (selected_banner_id);

-- ── The agent conversation for a project ─────────────────────────────────
create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  role text not null check (role in ('user', 'agent')),
  body text not null,
  items jsonb,                             -- bullet list under an agent message
  action jsonb,                            -- e.g. { id: 'make-banners', label }
  attachments jsonb,
  created_by text default private.user_id(),
  created_at timestamptz not null default now()
);
create index chat_messages_project_idx on public.chat_messages (project_id, created_at);

-- ── Generation jobs (Higgsfield), with credits for usage reporting ───────
-- Written by the server only (it calls Higgsfield and records the cost).
create table public.generation_jobs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  set_id uuid references public.banner_sets (id) on delete set null,
  provider text not null default 'higgsfield',
  model text not null,
  request_id text,                         -- provider request id
  status text not null default 'queued' check (status in ('queued', 'in_progress', 'completed', 'failed', 'cancelled')),
  credits numeric(10, 2) not null default 0,
  prompt text,
  error text,
  created_by text not null,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
create index generation_jobs_project_idx on public.generation_jobs (project_id, created_at desc);
create index generation_jobs_set_idx on public.generation_jobs (set_id);

-- Credits per workspace per month (reads through the caller's RLS).
create view public.workspace_credit_usage
with (security_invoker = true) as
  select p.workspace_id,
         date_trunc('month', j.created_at) as month,
         sum(j.credits) as credits,
         count(*) as jobs
  from public.generation_jobs j
  join public.projects p on p.id = j.project_id
  group by p.workspace_id, date_trunc('month', j.created_at);

-- ── Row-level security ────────────────────────────────────────────────────
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.projects enable row level security;
alter table public.brand_assets enable row level security;
alter table public.banner_sets enable row level security;
alter table public.banners enable row level security;
alter table public.chat_messages enable row level security;
alter table public.generation_jobs enable row level security;

-- Workspaces and memberships: members can read; the Clerk webhook writes.
create policy "members read their workspaces" on public.workspaces
  for select to authenticated using ((select private.is_member(id)));
create policy "members read their workspace's members" on public.workspace_members
  for select to authenticated using ((select private.is_member(workspace_id)));

-- Projects: any member of the workspace can read and edit.
create policy "members read projects" on public.projects
  for select to authenticated using ((select private.is_member(workspace_id)));
create policy "members create projects" on public.projects
  for insert to authenticated
  with check ((select private.is_member(workspace_id)) and created_by = (select private.user_id()));
create policy "members update projects" on public.projects
  for update to authenticated
  using ((select private.is_member(workspace_id))) with check ((select private.is_member(workspace_id)));
create policy "members delete projects" on public.projects
  for delete to authenticated using ((select private.is_member(workspace_id)));

-- Project children: access follows the project.
create policy "project members manage brand assets" on public.brand_assets
  for all to authenticated
  using ((select private.can_access_project(project_id))) with check ((select private.can_access_project(project_id)));
create policy "project members manage banner sets" on public.banner_sets
  for all to authenticated
  using ((select private.can_access_project(project_id))) with check ((select private.can_access_project(project_id)));
create policy "project members manage banners" on public.banners
  for all to authenticated
  using ((select private.can_access_project(project_id))) with check ((select private.can_access_project(project_id)));
create policy "project members manage chat" on public.chat_messages
  for all to authenticated
  using ((select private.can_access_project(project_id))) with check ((select private.can_access_project(project_id)));

-- Generation jobs: read-only for people; the server records them.
create policy "project members read generation jobs" on public.generation_jobs
  for select to authenticated using ((select private.can_access_project(project_id)));

-- ── Grants (explicit; anon gets nothing) ──────────────────────────────────
revoke all on all tables in schema public from anon, authenticated;
grant select on public.workspaces, public.workspace_members to authenticated;
grant select, insert, update, delete on public.projects, public.brand_assets, public.banner_sets, public.banners, public.chat_messages to authenticated;
grant select on public.generation_jobs, public.workspace_credit_usage to authenticated;

revoke all on function private.user_id() from public, anon;
revoke all on function private.is_member(uuid) from public, anon;
revoke all on function private.can_access_project(uuid) from public, anon;
grant execute on function private.user_id(), private.is_member(uuid), private.can_access_project(uuid) to authenticated;
