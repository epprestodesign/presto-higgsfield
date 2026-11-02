-- Banner Lab · private file storage
--
-- One private bucket. Paths start with the workspace id, so access follows
-- workspace membership:  {workspace_id}/{project_id}/{logos|banners|exports}/{file}
-- The app shows files through short-lived signed URLs.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'banner-lab', 'banner-lab', false,
  20 * 1024 * 1024, -- 20 MB per file
  array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml', 'application/zip']
)
on conflict (id) do nothing;

-- Is the request's user a member of the workspace named by a path's first
-- folder? (Text compare, so a malformed path is simply denied.)
create or replace function private.can_access_path(object_name text)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.workspaces w
    where w.id::text = (storage.foldername(object_name))[1]
      and private.is_member(w.id)
  )
$$;
revoke all on function private.can_access_path(text) from public, anon;
grant execute on function private.can_access_path(text) to authenticated;

create policy "workspace members read banner-lab files" on storage.objects
  for select to authenticated
  using (bucket_id = 'banner-lab' and (select private.can_access_path(name)));

create policy "workspace members add banner-lab files" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'banner-lab' and (select private.can_access_path(name)));

create policy "workspace members replace banner-lab files" on storage.objects
  for update to authenticated
  using (bucket_id = 'banner-lab' and (select private.can_access_path(name)))
  with check (bucket_id = 'banner-lab' and (select private.can_access_path(name)));

create policy "workspace members delete banner-lab files" on storage.objects
  for delete to authenticated
  using (bucket_id = 'banner-lab' and (select private.can_access_path(name)));
