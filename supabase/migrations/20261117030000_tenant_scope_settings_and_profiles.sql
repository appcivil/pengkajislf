-- Tenant-scope organization settings and profile visibility.
-- User profile identity is global, but it is visible only to users who share
-- at least one organization. Tenant-specific configuration belongs to a
-- single organization, not the global all-zero UUID row.

alter table public.settings
  add column if not exists organization_id uuid
  references public.organizations(id) on delete cascade;

update public.settings
set organization_id = '11111111-1111-4111-8111-111111111111'
where organization_id is null;

alter table public.settings
  alter column organization_id set not null,
  alter column id set default gen_random_uuid();

create unique index if not exists settings_organization_id_uidx
  on public.settings(organization_id);

do $$
declare v_policy record;
begin
  for v_policy in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'settings'
  loop
    execute format('drop policy %I on public.settings', v_policy.policyname);
  end loop;
end;
$$;

create policy settings_tenant_select on public.settings
for select to authenticated
using (private.is_org_member(organization_id));

create policy settings_tenant_insert on public.settings
for insert to authenticated
with check (private.has_org_role(organization_id, array['owner','admin']));

create policy settings_tenant_update on public.settings
for update to authenticated
using (private.has_org_role(organization_id, array['owner','admin']))
with check (private.has_org_role(organization_id, array['owner','admin']));

create policy settings_tenant_delete on public.settings
for delete to authenticated
using (private.has_org_role(organization_id, array['owner']));

revoke all on public.settings from anon;
grant select, insert, update, delete on public.settings to authenticated;

-- Profiles can be seen by oneself or by colleagues sharing a tenant.
create or replace function private.can_view_profile(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select p_user_id = (select auth.uid())
    or exists (
      select 1
      from public.organization_members mine
      join public.organization_members theirs
        on theirs.organization_id = mine.organization_id
      where mine.user_id = (select auth.uid())
        and theirs.user_id = p_user_id
    );
$$;

revoke all on function private.can_view_profile(uuid) from public, anon;
grant execute on function private.can_view_profile(uuid) to authenticated;

do $$
declare v_policy record;
begin
  for v_policy in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'profiles'
  loop
    execute format('drop policy %I on public.profiles', v_policy.policyname);
  end loop;
end;
$$;

alter table public.profiles enable row level security;

create policy profiles_shared_tenant_select on public.profiles
for select to authenticated
using (private.can_view_profile(id));

create policy profiles_self_update on public.profiles
for update to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

revoke all on public.profiles from anon;
grant select, update on public.profiles to authenticated;
