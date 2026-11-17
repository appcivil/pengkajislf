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
rollback;
select 'PASS: tenant SELECT/UPDATE/DELETE/INSERT isolation and viewer read-only' as result;
