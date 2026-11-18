-- Deterministic local CI RLS regression test.
-- Run only against the disposable Supabase local database after db reset.
\set ON_ERROR_STOP on
begin;

-- Stable fixture identities; the transaction is rolled back at the end.
insert into auth.users (id, aud, role, email, encrypted_password, email_confirmed_at,
                        raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','authenticated','authenticated','tenant-a-member@example.test','',now(),'{}','{}',now(),now()),
 ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','authenticated','authenticated','tenant-b-member@example.test','',now(),'{}','{}',now(),now()),
 ('cccccccc-cccc-4ccc-8ccc-cccccccccccc','authenticated','authenticated','tenant-a-viewer@example.test','',now(),'{}','{}',now(),now())
on conflict (id) do nothing;

insert into public.organizations (id,name,slug)
values
 ('aaaaaaaa-0000-4000-8000-000000000001','CI Tenant A','ci-tenant-a'),
 ('bbbbbbbb-0000-4000-8000-000000000002','CI Tenant B','ci-tenant-b')
on conflict (id) do nothing;

insert into public.organization_members (organization_id,user_id,role)
values
 ('aaaaaaaa-0000-4000-8000-000000000001','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','member'),
 ('bbbbbbbb-0000-4000-8000-000000000002','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','member'),
 ('aaaaaaaa-0000-4000-8000-000000000001','cccccccc-cccc-4ccc-8ccc-cccccccccccc','viewer')
on conflict (organization_id,user_id) do update set role=excluded.role;

insert into public.proyek (id,nama_bangunan,organization_id,created_by)
values
 ('aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa','CI Project A','aaaaaaaa-0000-4000-8000-000000000001','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
 ('bbbbbbbb-2222-4222-8222-bbbbbbbbbbbb','CI Project B','bbbbbbbb-0000-4000-8000-000000000002','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb')
on conflict (id) do nothing;

-- SmartAI records inherit tenant scope from their project/document chain.
insert into public.smartai_jobs (id,type,status,user_id,project_id)
values
 ('aaaaaaaa-3333-4333-8333-aaaaaaaaaaaa','rag','completed','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa'),
 ('bbbbbbbb-3333-4333-8333-bbbbbbbbbbbb','rag','completed','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','bbbbbbbb-2222-4222-8222-bbbbbbbbbbbb')
on conflict (id) do nothing;

insert into public.smartai_documents (id,job_id,user_id,project_id,file_name)
values
 ('aaaaaaaa-4444-4444-8444-aaaaaaaaaaaa','aaaaaaaa-3333-4333-8333-aaaaaaaaaaaa','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa','tenant-a.txt'),
 ('bbbbbbbb-4444-4444-8444-bbbbbbbbbbbb','bbbbbbbb-3333-4333-8333-bbbbbbbbbbbb','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','bbbbbbbb-2222-4222-8222-bbbbbbbbbbbb','tenant-b.txt')
on conflict (id) do nothing;

insert into public.smartai_chunks (id,document_id,chunk_index,text,embedding)
values
 ('aaaaaaaa-5555-4555-8555-aaaaaaaaaaaa','aaaaaaaa-4444-4444-8444-aaaaaaaaaaaa',0,'Tenant A private chunk','[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]'::public.vector(384)),
 ('bbbbbbbb-5555-4555-8555-bbbbbbbbbbbb','bbbbbbbb-4444-4444-8444-bbbbbbbbbbbb',0,'Tenant B private chunk','[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]'::public.vector(384))
on conflict (id) do nothing;

set local role authenticated;
select set_config('request.jwt.claim.sub','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',true);
select set_config('request.jwt.claims','{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","role":"authenticated"}',true);

do $$
declare n integer;
begin
 select count(*) into n from public.proyek where id='aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa';
 if n <> 1 then raise exception 'FAIL: tenant A cannot read its own project'; end if;

 select count(*) into n from public.proyek where id='bbbbbbbb-2222-4222-8222-bbbbbbbbbbbb';
 if n <> 0 then raise exception 'FAIL: tenant A can read tenant B project'; end if;

 -- SmartAI document and chunk reads must follow the parent project's tenant.
 select count(*) into n from public.smartai_documents where id='aaaaaaaa-4444-4444-8444-aaaaaaaaaaaa';
 if n <> 1 then raise exception 'FAIL: tenant A cannot read its own SmartAI document'; end if;
 select count(*) into n from public.smartai_documents where id='bbbbbbbb-4444-4444-8444-bbbbbbbbbbbb';
 if n <> 0 then raise exception 'FAIL: tenant A can read tenant B SmartAI document'; end if;
 select count(*) into n from public.smartai_chunks where id='aaaaaaaa-5555-4555-8555-aaaaaaaaaaaa';
 if n <> 1 then raise exception 'FAIL: tenant A cannot read its own SmartAI chunk'; end if;
 select count(*) into n from public.smartai_chunks where id='bbbbbbbb-5555-4555-8555-bbbbbbbbbbbb';
 if n <> 0 then raise exception 'FAIL: tenant A can read tenant B SmartAI chunk'; end if;
 select count(*) into n from public.match_documents('[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]'::public.vector(384),0.7,5,null);
 if n <> 1 then raise exception 'FAIL: match_documents returned cross-tenant or missing chunks'; end if;

 begin
   perform * from public.match_documents('[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]'::public.vector(384),0.7,500,null);
   raise exception 'FAIL: match_documents accepted an excessive result limit';
 exception when invalid_parameter_value then null;
 end;

 begin
   insert into public.smartai_chunks (document_id,chunk_index,text)
   values ('bbbbbbbb-4444-4444-8444-bbbbbbbbbbbb',1,'unauthorized cross-tenant chunk');
   raise exception 'FAIL: tenant A inserted chunk into tenant B document';
 exception when insufficient_privilege then null;
 end;
 update public.smartai_chunks set text=text where id='bbbbbbbb-5555-4555-8555-bbbbbbbbbbbb';
 get diagnostics n = row_count;
 if n <> 0 then raise exception 'FAIL: tenant A updated tenant B SmartAI chunk'; end if;
 delete from public.smartai_chunks where id='bbbbbbbb-5555-4555-8555-bbbbbbbbbbbb';
 get diagnostics n = row_count;
 if n <> 0 then raise exception 'FAIL: tenant A deleted tenant B SmartAI chunk'; end if;

 update public.proyek set nama_bangunan=nama_bangunan where id='bbbbbbbb-2222-4222-8222-bbbbbbbbbbbb';
 get diagnostics n = row_count;
 if n <> 0 then raise exception 'FAIL: tenant A updated tenant B project'; end if;

 delete from public.proyek where id='bbbbbbbb-2222-4222-8222-bbbbbbbbbbbb';
 get diagnostics n = row_count;
 if n <> 0 then raise exception 'FAIL: tenant A deleted tenant B project'; end if;

 -- A regular member may edit project data, but may not delete projects
 -- or move a project across tenant boundaries.
 delete from public.proyek where id='aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa';
 get diagnostics n = row_count;
 if n <> 0 then raise exception 'FAIL: tenant member deleted own tenant project'; end if;

 begin
   update public.proyek
   set organization_id='bbbbbbbb-0000-4000-8000-000000000002'
   where id='aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa';
   get diagnostics n = row_count;
   if n <> 0 then raise exception 'FAIL: tenant member moved project to another tenant'; end if;
 exception when insufficient_privilege then null;
 end;

 begin
   insert into public.proyek (nama_bangunan,organization_id)
   values ('Forbidden cross-tenant insert','bbbbbbbb-0000-4000-8000-000000000002');
   raise exception 'FAIL: tenant A inserted into tenant B';
 exception when insufficient_privilege then null;
 end;
end;
$$;

select set_config('request.jwt.claim.sub','cccccccc-cccc-4ccc-8ccc-cccccccccccc',true);
select set_config('request.jwt.claims','{"sub":"cccccccc-cccc-4ccc-8ccc-cccccccccccc","role":"authenticated"}',true);
do $$
declare n integer;
begin
 select count(*) into n from public.proyek where id='aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa';
 if n <> 1 then raise exception 'FAIL: viewer cannot read own tenant project'; end if;
 update public.proyek set nama_bangunan=nama_bangunan where id='aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa';
 get diagnostics n = row_count;
 if n <> 0 then raise exception 'FAIL: viewer updated project'; end if;
end;
$$;

reset role;

-- Static catalog assertions: every project-key FK to public.proyek must have
-- the four tenant policies; foreign project roots must not be treated as
-- public.proyek IDs; no legacy literal-true/auth.role policies may remain on
-- tables governed by the generic direct-project policy.
do $$
declare
  v_missing record;
  v_bad record;
  v_table_name text;
  v_policy_name text;
  v_required_policies text[];
begin
  select n.nspname, c.relname, a.attname
    into v_missing
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  join pg_attribute a on a.attrelid = c.oid
  join pg_constraint fk on fk.conrelid = c.oid
    and fk.contype = 'f' and a.attnum = any(fk.conkey)
  join pg_class target on target.oid = fk.confrelid
  join pg_namespace target_ns on target_ns.oid = target.relnamespace
  where n.nspname = 'public'
    and c.relkind = 'r'
    and a.attname in ('project_id', 'proyek_id')
    and target_ns.nspname = 'public'
    and target.relname = 'proyek'
    and not exists (
      select 1 from pg_policies p
      where p.schemaname = 'public'
        and p.tablename = c.relname
        and p.policyname = 'tenant_scope_select'
    )
  limit 1;

  if found then
    raise exception 'FAIL: %.% lacks tenant_scope_select for FK key %',
      v_missing.nspname, v_missing.relname, v_missing.attname;
  end if;

  -- Every direct FK-to-proyek table must have complete CRUD policy coverage.
  for v_table_name in
    select distinct c.relname
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    join pg_attribute a on a.attrelid = c.oid
    join pg_constraint fk on fk.conrelid = c.oid
      and fk.contype = 'f' and a.attnum = any(fk.conkey)
    where n.nspname = 'public' and c.relkind = 'r'
      and a.attname in ('project_id', 'proyek_id')
      and fk.confrelid = 'public.proyek'::regclass
  loop
    foreach v_policy_name in array array[
      'tenant_scope_select','tenant_scope_insert',
      'tenant_scope_update','tenant_scope_delete'
    ] loop
      if not exists (
        select 1 from pg_policies p
        where p.schemaname='public' and p.tablename=v_table_name
          and p.policyname=v_policy_name
      ) then
        raise exception 'FAIL: %.% lacks policy %',
          'public', v_table_name, v_policy_name;
      end if;
    end loop;

    if not exists (
      select 1 from pg_policies p
      where p.schemaname='public' and p.tablename=v_table_name
        and p.policyname='tenant_scope_update'
        and nullif(p.qual, '') is not null
        and nullif(p.with_check, '') is not null
    ) then
      raise exception 'FAIL: public.% update policy must constrain USING and WITH CHECK',
        v_table_name;
    end if;
  end loop;

  select n.nspname, c.relname, a.attname, target.relname as target_name
    into v_bad
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  join pg_attribute a on a.attrelid = c.oid
  join pg_constraint fk on fk.conrelid = c.oid
    and fk.contype = 'f' and a.attnum = any(fk.conkey)
  join pg_class target on target.oid = fk.confrelid
  join pg_namespace target_ns on target_ns.oid = target.relnamespace
  where n.nspname = 'public'
    and c.relkind = 'r'
    and a.attname in ('project_id', 'proyek_id')
    and target_ns.nspname = 'public'
    and target.relname <> 'proyek'
    and exists (
      select 1 from pg_policies p
      where p.schemaname = 'public'
        and p.tablename = c.relname
        and p.policyname = 'tenant_scope_select'
    )
  limit 1;

  if found then
    raise exception 'FAIL: %.% incorrectly uses generic proyek policy for FK to %',
      v_bad.nspname, v_bad.relname, v_bad.target_name;
  end if;

  select p.schemaname, p.tablename, p.policyname
    into v_bad
  from pg_policies p
  where p.schemaname = 'public'
    and p.policyname = 'tenant_scope_select'
    and (
      lower(coalesce(p.qual, '')) = 'true'
      or lower(coalesce(p.with_check, '')) = 'true'
      or coalesce(p.qual, '') ilike '%auth.role()%'
      or coalesce(p.with_check, '') ilike '%auth.role()%'
    )
  limit 1;

  if found then
    raise exception 'FAIL: generic tenant policy on %.% is broad or uses auth.role()',
      v_bad.schemaname, v_bad.tablename;
  end if;

  -- All configured indirect children must have complete CRUD parent policies.
  for v_table_name in
    select child_table from (values
      ('architectural_rooms'),
      ('building_room_schedules'),
      ('building_setback_details'),
      ('evacuation_agents'),
      ('evacuation_exits'),
      ('fire_sources'),
      ('fire_timeline'),
      ('pump_units'),
      ('electrical_protection_settings')
    ) as expected(child_table)
    where to_regclass(format('public.%I', child_table)) is not null
  loop
    foreach v_policy_name in array array[
      'tenant_parent_select','tenant_parent_insert',
      'tenant_parent_update','tenant_parent_delete'
    ] loop
      if not exists (
        select 1 from pg_policies p
        where p.schemaname='public' and p.tablename=v_table_name
          and p.policyname=v_policy_name
      ) then
        raise exception 'FAIL: public.% lacks indirect policy %',
          v_table_name, v_policy_name;
      end if;
    end loop;

    if not exists (
      select 1 from pg_policies p
      where p.schemaname='public' and p.tablename=v_table_name
        and p.policyname='tenant_parent_update'
        and nullif(p.qual, '') is not null
        and nullif(p.with_check, '') is not null
    ) then
      raise exception 'FAIL: public.% indirect UPDATE must constrain USING and WITH CHECK',
        v_table_name;
    end if;
  end loop;

  -- SmartAI's project/document chain is handled by its dedicated policies.
  if to_regclass('public.smartai_documents') is not null then
    foreach v_policy_name in array array[
      'tenant_scope_select','tenant_scope_insert',
      'tenant_scope_update','tenant_scope_delete'
    ] loop
      if not exists (select 1 from pg_policies p
        where p.schemaname='public' and p.tablename='smartai_documents'
          and p.policyname=v_policy_name) then
        raise exception 'FAIL: smartai_documents lacks policy %', v_policy_name;
      end if;
    end loop;
  end if;

  if to_regclass('public.smartai_jobs') is not null then
    foreach v_policy_name in array array[
      'tenant_scope_select','tenant_scope_insert',
      'tenant_scope_update','tenant_scope_delete'
    ] loop
      if not exists (select 1 from pg_policies p
        where p.schemaname='public' and p.tablename='smartai_jobs'
          and p.policyname=v_policy_name) then
        raise exception 'FAIL: smartai_jobs lacks policy %', v_policy_name;
      end if;
    end loop;
  end if;

  if to_regclass('public.smartai_chunks') is not null then
    foreach v_policy_name in array array[
      'smartai_chunks_tenant_select','smartai_chunks_tenant_insert',
      'smartai_chunks_tenant_update','smartai_chunks_tenant_delete'
    ] loop
      if not exists (select 1 from pg_policies p
        where p.schemaname='public' and p.tablename='smartai_chunks'
          and p.policyname=v_policy_name) then
        raise exception 'FAIL: smartai_chunks lacks policy %', v_policy_name;
      end if;
    end loop;
  end if;

  -- SmartAI RAG RPC must not be callable anonymously and must remain
  -- invoker-security so chunk RLS is applied to the caller.
  if to_regprocedure('public.match_documents(public.vector,double precision,integer,uuid[])') is not null then
    if has_function_privilege('anon',
      'public.match_documents(public.vector,double precision,integer,uuid[])','EXECUTE') then
      raise exception 'FAIL: anon can execute match_documents';
    end if;
    if not has_function_privilege('authenticated',
      'public.match_documents(public.vector,double precision,integer,uuid[])','EXECUTE') then
      raise exception 'FAIL: authenticated cannot execute match_documents';
    end if;
    if (select prosecdef from pg_proc where oid =
      'public.match_documents(public.vector,double precision,integer,uuid[])'::regprocedure) then
      raise exception 'FAIL: match_documents must remain SECURITY INVOKER';
    end if;
  end if;

  -- Lighting tables have a different legacy root and must not be rewritten
  -- by the generic proyek policy until an organization mapping is approved.
  foreach v_table_name in array array['lighting_calculations','daylight_calculations'] loop
    if to_regclass(format('public.%I', v_table_name)) is not null
       and exists (select 1 from pg_policies where schemaname='public'
         and tablename=v_table_name and policyname='tenant_scope_select') then
      raise exception 'FAIL: % was incorrectly assigned proyek policy', v_table_name;
    end if;
  end loop;
end;
$$;
rollback;
select 'PASS: tenant isolation, direct FK policy coverage, non-proyek FK exclusion, and indirect policy assertions' as result;
