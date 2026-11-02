-- Banner Lab · usage log for every paid request (Higgsfield generations,
-- Firecrawl logo lookups). A lookup happens before its project exists, so a
-- job belongs to a workspace and only optionally to a project.
-- Additive only: the original project-based read policy and the
-- workspace_credit_usage view stay; this adds a workspace read policy and a
-- per-provider monthly view.
alter table public.generation_jobs
  alter column project_id set default null,
  add column if not exists workspace_id uuid references public.workspaces (id) on delete cascade;
alter table public.generation_jobs alter column project_id drop not null;

create index if not exists generation_jobs_workspace_idx on public.generation_jobs (workspace_id, created_at desc);
create index if not exists generation_jobs_request_idx on public.generation_jobs (request_id);

create policy "members read workspace generation jobs" on public.generation_jobs
  for select to authenticated
  using ((select private.is_member(workspace_id)));

-- Credits per workspace, month and provider.
create view public.workspace_usage_by_provider
with (security_invoker = true) as
  select coalesce(j.workspace_id, p.workspace_id) as workspace_id,
         date_trunc('month', j.created_at) as month,
         j.provider,
         sum(j.credits) as credits,
         count(*) as jobs
  from public.generation_jobs j
  left join public.projects p on p.id = j.project_id
  group by 1, 2, 3;
grant select on public.workspace_usage_by_provider to authenticated;
