-- Banner Lab · details the Studio keeps per project and per banner set.
--   projects.typography  { heading, body } font ids
--   projects.site        the website a logo was fetched from (Firecrawl)
--   banner_sets.meta     { brief, sentPrompt, error, referenceCount }
alter table public.projects
  add column if not exists typography jsonb,
  add column if not exists site text;

alter table public.banner_sets
  add column if not exists meta jsonb not null default '{}'::jsonb;
