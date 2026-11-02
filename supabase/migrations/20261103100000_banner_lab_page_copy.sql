-- Banner Lab · the text on a project's Presto page banner, edited in the Studio.
--   projects.page_copy  { headline, meta, tagline, show: { headline, meta, tagline } }
--   null = the event's own wording, every line on.
alter table public.projects
  add column if not exists page_copy jsonb;
