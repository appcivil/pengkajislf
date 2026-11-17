-- SaaS multi-tenant foundation for Pengkaji SLF.
-- Existing records are preserved in a legacy workspace. Do not remove that
-- workspace until its projects have been explicitly reassigned to tenants.

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 2 and 160),
  slug text unique,
  created_by uuid references auth.users(id) on delete set null,
  is_legacy boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member'
    check (role in ('owner', 'admin', 'member', 'viewer')),
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create index if not exists organization_members_user_idx
  on public.organization_members(user_id, organization_id);

alter table public.proyek
  add column if not exists organization_id uuid
  references public.organizations(id) on delete restrict;

-- Keep the pre-SaaS dataset in one explicit legacy tenant. Existing users are
-- members (not admins); a business owner must later assign users/projects to
-- their actual organizations using the documented onboarding process.
insert into public.organizations
  (id, name, slug, created_by, is_legacy)
values
  ('11111111-1111-4111-8111-111111111111',
   'Workspace lama — perlu pemetaan tenant',
   'legacy-workspace', null, true)
on conflict (id) do nothing;

update public.proyek
set organization_id = '11111111-1111-4111-8111-111111111111'
where organization_id is null;

insert into public.organization_members (organization_id, user_id, role)
select '11111111-1111-4111-8111-111111111111', u.id, 'member'
from auth.users u
on conflict (organization_id, user_id) do nothing;

alter table public.proyek
  alter column organization_id set not null;

create or replace function private.is_org_member(p_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_members m
    where m.organization_id = p_org_id
      and m.user_id = (select auth.uid())
  );
$$;

create or replace function private.has_org_role(p_org_id uuid, p_roles text[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_members m
    where m.organization_id = p_org_id
      and m.user_id = (select auth.uid())
      and m.role = any(p_roles)
  );
$$;

revoke all on function private.is_org_member(uuid) from public, anon;
revoke all on function private.has_org_role(uuid, text[]) from public, anon;
grant execute on function private.is_org_member(uuid) to authenticated;
grant execute on function private.has_org_role(uuid, text[]) to authenticated;

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;

drop policy if exists organizations_select_member on public.organizations;
create policy organizations_select_member on public.organizations
for select to authenticated
using (private.is_org_member(id));

drop policy if exists organizations_create_self on public.organizations;
create policy organizations_create_self on public.organizations
for insert to authenticated
with check (created_by = (select auth.uid()) and is_legacy = false);

drop policy if exists organizations_update_admin on public.organizations;
create policy organizations_update_admin on public.organizations
for update to authenticated
using (private.has_org_role(id, array['owner','admin']))
with check (private.has_org_role(id, array['owner','admin']));

drop policy if exists org_members_select_self_or_admin on public.organization_members;
create policy org_members_select_self_or_admin on public.organization_members
for select to authenticated
using (
  user_id = (select auth.uid())
  or private.has_org_role(organization_id, array['owner','admin'])
);

drop policy if exists org_members_insert_owner_or_admin on public.organization_members;
create policy org_members_insert_owner_or_admin on public.organization_members
for insert to authenticated
with check (
  (
    user_id = (select auth.uid())
    and role = 'owner'
    and exists (
      select 1 from public.organizations o
      where o.id = organization_id
        and o.created_by = (select auth.uid())
        and o.is_legacy = false
    )
  )
  or private.has_org_role(organization_id, array['owner','admin'])
);

drop policy if exists org_members_update_admin on public.organization_members;
create policy org_members_update_admin on public.organization_members
for update to authenticated
using (private.has_org_role(organization_id, array['owner','admin']))
with check (private.has_org_role(organization_id, array['owner','admin']));

drop policy if exists org_members_delete_admin on public.organization_members;
create policy org_members_delete_admin on public.organization_members
for delete to authenticated
using (
  private.has_org_role(organization_id, array['owner','admin'])
  and role <> 'owner'
);

-- Atomic tenant creation: the caller becomes the first owner.
create or replace function public.create_organization(p_name text)
returns public.organizations
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_org public.organizations;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if p_name is null or length(trim(p_name)) not between 2 and 160 then
    raise exception 'Nama organisasi harus 2–160 karakter' using errcode = '22023';
  end if;

  insert into public.organizations(name, created_by)
  values (trim(p_name), v_user_id)
  returning * into v_org;

  insert into public.organization_members(organization_id, user_id, role)
  values (v_org.id, v_user_id, 'owner');

  return v_org;
end;
$$;

revoke all on function public.create_organization(text) from public, anon;
grant execute on function public.create_organization(text) to authenticated;

-- Backward-compatible project creation: when a user has exactly one tenant,
-- infer it. Multi-tenant users must pass organization_id explicitly.
create or replace function private.set_project_organization()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_org_count integer;
  v_org_id uuid;
begin
  if new.organization_id is null then
    select count(*), (array_agg(m.organization_id order by m.created_at))[1]
      into v_org_count, v_org_id
    from public.organization_members m
    where m.user_id = (select auth.uid());

    if v_org_count <> 1 then
      raise exception 'Pilih organisasi sebelum membuat proyek'
        using errcode = '23514';
    end if;
    new.organization_id := v_org_id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_set_project_organization on public.proyek;
create trigger trg_set_project_organization
before insert or update of organization_id on public.proyek
for each row execute function private.set_project_organization();

-- Replace the legacy authenticated-wide project policy. RLS on every
-- project-child table is derived from its parent proyek_id. Existing policies
-- are removed first because PostgreSQL combines permissive policies with OR.
do $$
declare
  v_table record;
  v_has_user_id boolean;
  v_using text;
  v_write text;
  v_policy record;
begin
  for v_table in
    select c.relname,
      case
        when bool_or(col.column_name = 'proyek_id') then 'proyek_id'
        else 'project_id'
      end as project_column
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    join information_schema.columns col
      on col.table_schema = n.nspname
     and col.table_name = c.relname
     and col.column_name in ('proyek_id', 'project_id')
    where n.nspname = 'public'
      and c.relkind = 'r'
      and c.relname <> 'proyek'
    group by c.relname
  loop
    select exists (
      select 1 from information_schema.columns
      where table_schema = 'public'
        and table_name = v_table.relname
        and column_name = 'user_id'
    ) into v_has_user_id;

    v_using := format(
      'exists (select 1 from public.proyek p where p.id = %I.%I and private.is_org_member(p.organization_id))',
      v_table.relname, v_table.project_column
    );
    v_write := format(
      'exists (select 1 from public.proyek p where p.id = %I.%I and private.has_org_role(p.organization_id, array[''owner'',''admin'',''member'']))',
      v_table.relname, v_table.project_column
    );

    if v_has_user_id then
      v_using := '(' || v_using || format(
        ' or (%I.%I is null and %I.user_id = (select auth.uid()))',
        v_table.relname, v_table.project_column, v_table.relname
      ) || ')';
      v_write := '(' || v_write || format(
        ' or (%I.%I is null and %I.user_id = (select auth.uid()))',
        v_table.relname, v_table.project_column, v_table.relname
      ) || ')';
    end if;

    for v_policy in
      select policyname from pg_policies
      where schemaname = 'public' and tablename = v_table.relname
    loop
      execute format('drop policy %I on public.%I', v_policy.policyname, v_table.relname);
    end loop;

    execute format('alter table public.%I enable row level security', v_table.relname);
    execute format(
      'create policy tenant_scope_select on public.%I for select to authenticated using (%s)',
      v_table.relname, v_using
    );
    execute format(
      'create policy tenant_scope_insert on public.%I for insert to authenticated with check (%s)',
      v_table.relname, v_write
    );
    execute format(
      'create policy tenant_scope_update on public.%I for update to authenticated using (%s) with check (%s)',
      v_table.relname, v_write, v_write
    );
    execute format(
      'create policy tenant_scope_delete on public.%I for delete to authenticated using (%s)',
      v_table.relname, v_write
    );
  end loop;
end;
$$;

-- proyek itself is tenant-scoped. Remove all permissive legacy policies.
do $$
declare v_policy record;
begin
  for v_policy in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'proyek'
  loop
    execute format('drop policy %I on public.proyek', v_policy.policyname);
  end loop;
end;
$$;

create policy proyek_tenant_select on public.proyek
for select to authenticated
using (private.is_org_member(organization_id));

create policy proyek_tenant_insert on public.proyek
for insert to authenticated
with check (private.has_org_role(organization_id, array['owner','admin','member']));

create policy proyek_tenant_update on public.proyek
for update to authenticated
using (private.has_org_role(organization_id, array['owner','admin','member']))
with check (private.has_org_role(organization_id, array['owner','admin','member']));

create policy proyek_tenant_delete on public.proyek
for delete to authenticated
using (private.has_org_role(organization_id, array['owner','admin','member']));

create index if not exists proyek_organization_id_idx
  on public.proyek(organization_id);

comment on table public.organizations is
  'Tenant boundary for Pengkaji SLF SaaS. Every customer organization is isolated by RLS.';
comment on column public.proyek.organization_id is
  'Tenant owner of the project; required for all new and existing project rows.';
