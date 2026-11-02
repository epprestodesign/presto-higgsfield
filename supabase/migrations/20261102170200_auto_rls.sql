-- Safety net: any table created later in `public` gets row-level security
-- turned on automatically (the project was created with "Enable automatic RLS"
-- off). Without a policy, such a table is unreadable through the API until
-- someone writes one on purpose.

create or replace function private.rls_auto_enable()
returns event_trigger
language plpgsql
set search_path = ''
as $$
declare
  obj record;
begin
  for obj in
    select * from pg_event_trigger_ddl_commands()
    where command_tag in ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      and object_type = 'table'
      and schema_name = 'public'
  loop
    execute format('alter table %s enable row level security', obj.object_identity);
  end loop;
end
$$;

drop event trigger if exists banner_lab_rls_auto_enable;
create event trigger banner_lab_rls_auto_enable
  on ddl_command_end
  when tag in ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
  execute function private.rls_auto_enable();
