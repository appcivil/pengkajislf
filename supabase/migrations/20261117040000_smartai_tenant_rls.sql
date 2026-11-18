-- SmartAI pipeline tables need explicit tenant/user boundaries.
-- jobs/documents with project_id are already covered by the generic tenant
-- migration. Chunks inherit access through their parent document. Embedding
-- vectors are backend-only; user cache/log rows are private to their owner.

do $$
declare v_policy record;
begin
  if to_regclass('public.smartai_chunks') is not null then
    for v_policy in
      select policyname from pg_policies
      where schemaname = 'public' and tablename = 'smartai_chunks'
    loop
      execute format('drop policy %I on public.smartai_chunks', v_policy.policyname);
    end loop;

    alter table public.smartai_chunks enable row level security;

    create policy smartai_chunks_tenant_select on public.smartai_chunks
    for select to authenticated
    using (
      exists (
        select 1 from public.smartai_documents d
        where d.id = smartai_chunks.document_id
      )
    );

    create policy smartai_chunks_tenant_insert on public.smartai_chunks
    for insert to authenticated
    with check (
      exists (
        select 1
        from public.smartai_documents d
        where d.id = smartai_chunks.document_id
          and (
            (d.project_id is null and d.user_id = (select auth.uid()))
            or exists (
              select 1 from public.proyek p
              where p.id = d.project_id
                and private.has_org_role(p.organization_id, array['owner','admin','member'])
            )
          )
      )
    );

    create policy smartai_chunks_tenant_update on public.smartai_chunks
    for update to authenticated
    using (
      exists (
        select 1
        from public.smartai_documents d
        where d.id = smartai_chunks.document_id
          and (
            (d.project_id is null and d.user_id = (select auth.uid()))
            or exists (
              select 1 from public.proyek p
              where p.id = d.project_id
                and private.has_org_role(p.organization_id, array['owner','admin','member'])
            )
          )
      )
    )
    with check (
      exists (
        select 1
        from public.smartai_documents d
        where d.id = smartai_chunks.document_id
          and (
            (d.project_id is null and d.user_id = (select auth.uid()))
            or exists (
              select 1 from public.proyek p
              where p.id = d.project_id
                and private.has_org_role(p.organization_id, array['owner','admin','member'])
            )
          )
      )
    );

    create policy smartai_chunks_tenant_delete on public.smartai_chunks
    for delete to authenticated
    using (
      exists (
        select 1
        from public.smartai_documents d
        where d.id = smartai_chunks.document_id
          and (
            (d.project_id is null and d.user_id = (select auth.uid()))
            or exists (
              select 1 from public.proyek p
              where p.id = d.project_id
                and private.has_org_role(p.organization_id, array['owner','admin','member'])
            )
          )
      )
    );
  end if;
end;
$$;

-- Embeddings are a shared internal vector cache. Do not expose raw text
-- previews or vectors through the public PostgREST API.
do $$
declare v_policy record;
begin
  if to_regclass('public.smartai_embeddings') is not null then
    for v_policy in
      select policyname from pg_policies
      where schemaname = 'public' and tablename = 'smartai_embeddings'
    loop
      execute format('drop policy %I on public.smartai_embeddings', v_policy.policyname);
    end loop;
    alter table public.smartai_embeddings enable row level security;
    revoke all on public.smartai_embeddings from anon, authenticated;
  end if;
end;
$$;

-- Cache entries must be user-owned. Null user_id is no longer a public/global
-- cache channel because cache payloads can contain customer data.
do $$
declare v_policy record;
begin
  if to_regclass('public.smartai_cache') is not null then
    for v_policy in
      select policyname from pg_policies
      where schemaname = 'public' and tablename = 'smartai_cache'
    loop
      execute format('drop policy %I on public.smartai_cache', v_policy.policyname);
    end loop;
    alter table public.smartai_cache enable row level security;

    create policy smartai_cache_select_own on public.smartai_cache
    for select to authenticated using (user_id = (select auth.uid()));
    create policy smartai_cache_insert_own on public.smartai_cache
    for insert to authenticated with check (user_id = (select auth.uid()));
    create policy smartai_cache_update_own on public.smartai_cache
    for update to authenticated
    using (user_id = (select auth.uid()))
    with check (user_id = (select auth.uid()));
    create policy smartai_cache_delete_own on public.smartai_cache
    for delete to authenticated using (user_id = (select auth.uid()));
  end if;
end;
$$;

-- Logs are visible only to their authenticated owner. Null-user system logs
-- remain backend-only.
do $$
declare v_policy record;
begin
  if to_regclass('public.smartai_logs') is not null then
    for v_policy in
      select policyname from pg_policies
      where schemaname = 'public' and tablename = 'smartai_logs'
    loop
      execute format('drop policy %I on public.smartai_logs', v_policy.policyname);
    end loop;
    alter table public.smartai_logs enable row level security;

    create policy smartai_logs_select_own on public.smartai_logs
    for select to authenticated using (user_id = (select auth.uid()));
    create policy smartai_logs_insert_own on public.smartai_logs
    for insert to authenticated with check (user_id = (select auth.uid()));
  end if;
end;
$$;
