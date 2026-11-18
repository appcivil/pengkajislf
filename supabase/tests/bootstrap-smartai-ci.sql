-- CI-only bootstrap for the legacy SmartAI schema, installed from the
-- documented SQL setup script rather than a committed migration.
\ir ../supabase_smartai_pipeline_tables.sql

do $$
declare p record;
begin
  for p in
    select policyname, tablename
    from pg_policies
    where schemaname='public'
      and tablename in ('smartai_jobs','smartai_documents')
  loop
    execute format('drop policy %I on public.%I',p.policyname,p.tablename);
  end loop;
end;
$$;

-- Mirror the direct-project policy contract for these legacy tables.
do $$
declare t text;
begin
  foreach t in array array['smartai_jobs','smartai_documents'] loop
    execute format(
      'create policy tenant_scope_select on public.%I for select to authenticated using (
        (project_id is not null and exists (
          select 1 from public.proyek p
          where p.id = %I.project_id and private.is_org_member(p.organization_id)
        )) or (project_id is null and user_id = (select auth.uid()))
      )',t,t
    );
    execute format(
      'create policy tenant_scope_insert on public.%I for insert to authenticated with check (
        (project_id is not null and exists (
          select 1 from public.proyek p
          where p.id = %I.project_id and private.has_org_role(p.organization_id, array[''owner'',''admin'',''member''])
        )) or (project_id is null and user_id = (select auth.uid()))
      )',t,t
    );
    execute format(
      'create policy tenant_scope_update on public.%I for update to authenticated using (
        (project_id is not null and exists (
          select 1 from public.proyek p
          where p.id = %I.project_id and private.has_org_role(p.organization_id, array[''owner'',''admin'',''member''])
        )) or (project_id is null and user_id = (select auth.uid()))
      ) with check (
        (project_id is not null and exists (
          select 1 from public.proyek p
          where p.id = %I.project_id and private.has_org_role(p.organization_id, array[''owner'',''admin'',''member''])
        )) or (project_id is null and user_id = (select auth.uid()))
      )',t,t,t
    );
    execute format(
      'create policy tenant_scope_delete on public.%I for delete to authenticated using (
        (project_id is not null and exists (
          select 1 from public.proyek p
          where p.id = %I.project_id and private.has_org_role(p.organization_id, array[''owner'',''admin'',''member''])
        )) or (project_id is null and user_id = (select auth.uid()))
      )',t,t
    );
  end loop;
end;
$$;

-- Re-apply the committed SmartAI-specific RLS after the legacy schema exists.
\ir ../migrations/20261117040000_smartai_tenant_rls.sql
