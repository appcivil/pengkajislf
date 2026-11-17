-- Harden tenant membership management.
-- Organization creation must go through create_organization() so an owner
-- membership is always created atomically. Admins may manage member/viewer
-- seats but cannot grant owner/admin privileges.

drop policy if exists organizations_create_self on public.organizations;

drop policy if exists org_members_insert_owner_or_admin on public.organization_members;
create policy org_members_insert_managed_roles on public.organization_members
for insert to authenticated
with check (
  (
    private.has_org_role(organization_id, array['owner'])
  )
  or
  (
    role in ('member', 'viewer')
    and private.has_org_role(organization_id, array['owner','admin'])
  )
);

drop policy if exists org_members_update_admin on public.organization_members;
create policy org_members_update_owner on public.organization_members
for update to authenticated
using (private.has_org_role(organization_id, array['owner']))
with check (private.has_org_role(organization_id, array['owner']));

drop policy if exists org_members_delete_admin on public.organization_members;
create policy org_members_delete_managed on public.organization_members
for delete to authenticated
using (
  role <> 'owner'
  and private.has_org_role(organization_id, array['owner','admin'])
);

-- Prevent anonymous access explicitly even if default grants change later.
revoke all on public.organizations from anon;
revoke all on public.organization_members from anon;
grant select, insert, update, delete on public.organizations to authenticated;
grant select, insert, update, delete on public.organization_members to authenticated;

-- No client-side code should be able to invoke the private helpers as anon.
revoke execute on function private.is_org_member(uuid) from anon;
revoke execute on function private.has_org_role(uuid, text[]) from anon;
