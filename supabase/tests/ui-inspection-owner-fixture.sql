-- Isolated tenant/project fixture for browser navigation against local Supabase.
-- The owner account is created through the Supabase Auth Admin API in CI.
with owner as (
  select id from auth.users where email = 'ui-inspection-owner@example.test'
)
insert into public.organizations (id, name, slug, created_by)
select 'eeeeeeee-0000-4eee-8eee-eeeeeeeeeeee', 'UI Inspection CI', 'ui-inspection-ci', owner.id
from owner
on conflict (id) do update set created_by = excluded.created_by;

insert into public.organization_members (organization_id, user_id, role)
select 'eeeeeeee-0000-4eee-8eee-eeeeeeeeeeee', id, 'owner'
from auth.users where email = 'ui-inspection-owner@example.test'
on conflict (organization_id, user_id) do update set role = excluded.role;

insert into public.proyek (id, nama_bangunan, organization_id, created_by)
select 'eeeeeeee-1111-4eee-8eee-eeeeeeeeeeee', 'UI Inspection Test Building',
       'eeeeeeee-0000-4eee-8eee-eeeeeeeeeeee', id
from auth.users where email = 'ui-inspection-owner@example.test'
on conflict (id) do update set created_by = excluded.created_by;
