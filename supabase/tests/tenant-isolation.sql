-- Manual staging smoke test for tenant isolation.
-- Run with psql against a disposable STAGING database after applying all
-- migrations. Replace the four UUID values below with fixture records:
--   user A is member of tenant A only
--   user A viewer is viewer of tenant A only
--   project A belongs to tenant A
--   project B belongs to tenant B
--
-- Example:
-- psql "$STAGING_DATABASE_URL" -v tenant_a_user_id=... \
--   -v tenant_a_viewer_id=... -v project_a_id=... -v project_b_id=... \
--   -f supabase/tests/tenant-isolation.sql

\set ON_ERROR_STOP on
begin;

select set_config('test.tenant_a_user_id', :'tenant_a_user_id', true);
select set_config('test.tenant_a_viewer_id', :'tenant_a_viewer_id', true);
select set_config('test.project_a_id', :'project_a_id', true);
select set_config('test.project_b_id', :'project_b_id', true);

set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('test.tenant_a_user_id'), true);

do $$
declare
  v_project_a uuid := current_setting('test.project_a_id')::uuid;
  v_project_b uuid := current_setting('test.project_b_id')::uuid;
  v_count integer;
begin
  select count(*) into v_count from public.proyek where id = v_project_a;
  if v_count <> 1 then
    raise exception 'FAIL: tenant A member cannot read own project';
  end if;

  select count(*) into v_count from public.proyek where id = v_project_b;
  if v_count <> 0 then
    raise exception 'FAIL: tenant A member can read tenant B project';
  end if;

  update public.proyek
    set nama_bangunan = nama_bangunan
    where id = v_project_b;
  get diagnostics v_count = row_count;
  if v_count <> 0 then
    raise exception 'FAIL: tenant A member updated tenant B project';
  end if;
end;
$$;

-- Viewer must be able to read tenant A, but not write.
select set_config('request.jwt.claim.sub', current_setting('test.tenant_a_viewer_id'), true);

do $$
declare
  v_project_a uuid := current_setting('test.project_a_id')::uuid;
  v_count integer;
begin
  select count(*) into v_count from public.proyek where id = v_project_a;
  if v_count <> 1 then
    raise exception 'FAIL: viewer cannot read own tenant project';
  end if;

  update public.proyek
    set nama_bangunan = nama_bangunan
    where id = v_project_a;
  get diagnostics v_count = row_count;
  if v_count <> 0 then
    raise exception 'FAIL: viewer updated project despite read-only role';
  end if;
end;
$$;

reset role;
rollback;

select 'PASS: cross-tenant SELECT/UPDATE and viewer read-only smoke tests' as result;
