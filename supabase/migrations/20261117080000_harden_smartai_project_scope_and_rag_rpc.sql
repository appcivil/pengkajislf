-- SmartAI tables were installed from a legacy SQL bootstrap and their
-- project_id columns intentionally have no FK. Scope them explicitly.
do $$
declare
  t text;
  p record;
begin
  foreach t in array array['smartai_jobs','smartai_documents'] loop
    if to_regclass(format('public.%I',t)) is null then
      continue;
    end if;

    execute format('alter table public.%I enable row level security',t);
    for p in
      select policyname from pg_policies
      where schemaname='public' and tablename=t
    loop
      execute format('drop policy %I on public.%I',p.policyname,t);
    end loop;

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
        user_id = (select auth.uid()) and (
          (project_id is not null and exists (
            select 1 from public.proyek p
            where p.id = %I.project_id
              and private.has_org_role(p.organization_id, array[''owner'',''admin'',''member''])
          )) or project_id is null
        )
      )',t,t
    );
    execute format(
      'create policy tenant_scope_update on public.%I for update to authenticated using (
        (project_id is not null and exists (
          select 1 from public.proyek p
          where p.id = %I.project_id
            and private.has_org_role(p.organization_id, array[''owner'',''admin'',''member''])
        )) or (project_id is null and user_id = (select auth.uid()))
      ) with check (
        user_id = (select auth.uid()) and (
          (project_id is not null and exists (
            select 1 from public.proyek p
            where p.id = %I.project_id
              and private.has_org_role(p.organization_id, array[''owner'',''admin'',''member''])
          )) or project_id is null
        )
      )',t,t,t
    );
    execute format(
      'create policy tenant_scope_delete on public.%I for delete to authenticated using (
        (project_id is not null and exists (
          select 1 from public.proyek p
          where p.id = %I.project_id
            and private.has_org_role(p.organization_id, array[''owner'',''admin'',''member''])
        )) or (project_id is null and user_id = (select auth.uid()))
      )',t,t
    );
  end loop;
end;
$$;

-- Restrict vector search RPC to authenticated callers and bound its work.
do $$
begin
  if to_regprocedure('public.match_documents(public.vector,double precision,integer,uuid[])') is not null then
    execute $fn$
      create or replace function public.match_documents(
        query_embedding public.vector(384),
        match_threshold double precision,
        match_count integer,
        filter_document_ids uuid[] default null
      )
      returns table(
        id uuid,
        document_id uuid,
        chunk_index integer,
        text text,
        metadata jsonb,
        similarity double precision
      )
      language plpgsql
      set search_path = public, pg_temp
      as $body$
      begin
        if query_embedding is null then
          raise exception using errcode='22023', message='query_embedding is required';
        end if;
        if match_threshold is null or match_threshold < 0 or match_threshold > 1 then
          raise exception using errcode='22023', message='match_threshold must be between 0 and 1';
        end if;
        if match_count is null or match_count < 1 or match_count > 50 then
          raise exception using errcode='22023', message='match_count must be between 1 and 50';
        end if;
        if filter_document_ids is not null and cardinality(filter_document_ids) > 1000 then
          raise exception using errcode='22023', message='too many document filters';
        end if;

        return query
        select c.id, c.document_id, c.chunk_index, c.text, c.metadata,
               (1 - (c.embedding <=> query_embedding))::double precision
        from public.smartai_chunks c
        where c.embedding is not null
          and 1 - (c.embedding <=> query_embedding) > match_threshold
          and (filter_document_ids is null or c.document_id = any(filter_document_ids))
        order by c.embedding <=> query_embedding
        limit match_count;
      end;
      $body$;
    $fn$;

    revoke all on function public.match_documents(public.vector,double precision,integer,uuid[]) from public, anon;
    grant execute on function public.match_documents(public.vector,double precision,integer,uuid[]) to authenticated, service_role;
  end if;
end;
$$;
