-- Banner Lab · deleting a project keeps its usage history. generation_jobs
-- still cascades on project delete, so detach the jobs first (they keep their
-- workspace, so monthly totals don't change).
create or replace function private.detach_generation_jobs()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.generation_jobs
     set project_id = null,
         workspace_id = coalesce(workspace_id, old.workspace_id)
   where project_id = old.id;
  return old;
end
$$;
revoke all on function private.detach_generation_jobs() from public, anon, authenticated;

create trigger projects_keep_usage
  before delete on public.projects
  for each row execute function private.detach_generation_jobs();
