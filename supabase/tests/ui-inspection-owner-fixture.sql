-- Isolated owner/project fixture for browser navigation against local Supabase.
-- Test-only identity; never use these credentials outside disposable CI databases.
insert into auth.users
  (id, aud, role, email, encrypted_password, email_confirmed_at,
   raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'authenticated', 'authenticated',
   'ui-inspection-owner@example.test',
   crypt('ci-ui-owner-password', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"UI Inspection Owner"}',
   now(), now())
on conflict (id) do nothing;

insert into public.organizations (id, name, slug, created_by)
values (
  'eeeeeeee-0000-4eee-8eee-eeeeeeeeeeee',
  'UI Inspection CI',
  'ui-inspection-ci',
  'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'
)
on conflict (id) do nothing;

insert into public.organization_members (organization_id, user_id, role)
values (
  'eeeeeeee-0000-4eee-8eee-eeeeeeeeeeee',
  'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
  'owner'
)
on conflict (organization_id, user_id) do update set role = excluded.role;

insert into public.proyek (id, nama_bangunan, organization_id, created_by)
values (
  'eeeeeeee-1111-4eee-8eee-eeeeeeeeeeee',
  'UI Inspection Test Building',
  'eeeeeeee-0000-4eee-8eee-eeeeeeeeeeee',
  'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'
)
on conflict (id) do nothing;
