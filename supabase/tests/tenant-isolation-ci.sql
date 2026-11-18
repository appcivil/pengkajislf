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

 update public.proyek set nama_bangunan=nama_bangunan where id='bbbbbbbb-2222-4222-8222-bbbbbbbbbbbb';
 get diagnostics n = row_count;
 if n <> 0 then raise exception 'FAIL: tenant A updated tenant B project'; end if;

 delete from public.proyek where id='bbbbbbbb-2222-4222-8222-bbbbbbbbbbbb';
 get diagnostics n = row_count;
 if n <> 0 then raise exception 'FAIL: tenant A deleted tenant B project'; end if;

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
do $
declare
  v_missing record;
  v_bad record;
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

  -- Indirect-child policies must exist whenever the child module is present.
  if to_regclass('public.architectural_rooms') is not null
     and not exists (select 1 from pg_policies where schemaname='public'
       and tablename='architectural_rooms' and policyname='tenant_parent_select') then
    raise exception 'FAIL: architectural_rooms lacks parent tenant policy';
  end if;
  if to_regclass('public.electrical_protection_settings') is not null
     and not exists (select 1 from pg_policies where schemaname='public'
       and tablename='electrical_protection_settings' and policyname='tenant_parent_select') then
    raise exception 'FAIL: electrical_protection_settings lacks parent tenant policy';
  end if;

  -- Lighting tables have a different legacy root and must not be rewritten
  -- by the generic proyek policy until an organization mapping is approved.
  if to_regclass('public.lighting_calculations') is not null
     and exists (select 1 from pg_policies where schemaname='public'
       and tablename='lighting_calculations' and policyname='tenant_scope_select') then
    raise exception 'FAIL: lighting_calculations was incorrectly assigned proyek policy';
  end if;
end;
$$;
rollback;
select 'PASS: tenant isolation, direct FK policy coverage, non-proyek FK exclusion, and indirect policy assertions' as result;
