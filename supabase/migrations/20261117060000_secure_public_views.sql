-- Views in public are executable query surfaces. By default PostgreSQL views
-- run with the view owner's privileges and can bypass base-table RLS.
-- Force caller privileges and remove anonymous/PUBLIC access.
do $$
declare
  v_view record;
begin
  for v_view in
    select n.nspname, c.relname
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind = 'v'
  loop
    execute format(
      'alter view %I.%I set (security_invoker = true)',
      v_view.nspname, v_view.relname
    );
    execute format(
      'revoke all on table %I.%I from public, anon',
      v_view.nspname, v_view.relname
    );
    execute format(
      'grant select on table %I.%I to authenticated',
      v_view.nspname, v_view.relname
    );
  end loop;
end;
$$;

-- Verify that no ordinary public view remains accessible to anon.
do $$
declare
  v_leak record;
begin
  select n.nspname, c.relname
    into v_leak
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relkind = 'v'
    and has_table_privilege('anon', c.oid, 'select')
  limit 1;

  if found then
    raise exception 'Anonymous SELECT remains granted on %.%',
      v_leak.nspname, v_leak.relname;
  end if;
end;
$$;
