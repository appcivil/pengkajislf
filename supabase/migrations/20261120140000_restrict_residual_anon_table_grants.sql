-- Reduce residual anon grants on public tables to SELECT only where a public-role SELECT policy exists.
-- RLS continues to determine whether a row is visible. No public write privileges are retained.
begin;
do $$
declare
  r record;
  has_public_select boolean;
begin
  for r in
    select distinct c.relname
    from pg_class c
    join pg_namespace n on n.oid=c.relnamespace
    join information_schema.table_privileges tp
      on tp.table_schema=n.nspname and tp.table_name=c.relname and tp.grantee='anon'
    where n.nspname='public' and c.relkind in ('r','p')
  loop
    select exists (
      select 1 from pg_policy p
      where p.polrelid = format('public.%I',r.relname)::regclass
        and p.polroles @> array[0::oid]
        and p.polcmd in ('r','*')
    ) into has_public_select;

    execute format('revoke all privileges on table public.%I from anon',r.relname);
    if has_public_select then
      execute format('grant select on table public.%I to anon',r.relname);
    end if;
  end loop;
end $$;
commit;
