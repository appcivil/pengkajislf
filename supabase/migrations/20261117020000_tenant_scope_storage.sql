-- Tenant-scope Storage objects. Project file paths are:
-- project-photos: <project-uuid>/egress/<file>
-- templates:      <project-uuid>/<timestamp>.<ext>
-- project-files:  field_data/<project-uuid>/<type>/<file> (legacy layout)

create or replace function private.storage_project_id(p_bucket text, p_name text)
returns uuid
language plpgsql
immutable
security definer
set search_path = ''
as $$
declare
  v_first text := split_part(coalesce(p_name, ''), '/', 1);
  v_second text := split_part(coalesce(p_name, ''), '/', 2);
  v_candidate text;
begin
  if p_bucket = 'project-files' and v_first = 'field_data' then
    v_candidate := v_second;
  else
    v_candidate := v_first;
  end if;

  if v_candidate ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return v_candidate::uuid;
  end if;
  return null;
end;
$$;

revoke all on function private.storage_project_id(text, text) from public, anon;
grant execute on function private.storage_project_id(text, text) to authenticated;

-- Provision the buckets referenced by the application and fail closed on
-- legacy project storage. Existing object paths remain unchanged.
insert into storage.buckets (id, name, public)
values
  ('project-files', 'project-files', false),
  ('project-photos', 'project-photos', false),
  ('templates', 'templates', false),
  ('system-assets', 'system-assets', true)
on conflict (id) do update
set public = excluded.public;

-- Legacy bucket is not used by current application code; keep it private.
update storage.buckets set public = false where id = 'skpslf';

-- Remove known broad policies from the original setup guide.
drop policy if exists "Berkas proyek untuk pengguna login" on storage.objects;
drop policy if exists "Unggah berkas proyek" on storage.objects;
drop policy if exists "Ubah/hapus berkas proyek milik sendiri" on storage.objects;
drop policy if exists "Template & aset sistem bisa dibaca publik" on storage.objects;
drop policy if exists "Unggah template oleh pengguna login" on storage.objects;

-- Remove previously created tenant policy versions for idempotent re-apply.
drop policy if exists tenant_project_storage_select on storage.objects;
drop policy if exists tenant_project_storage_insert on storage.objects;
drop policy if exists tenant_project_storage_update on storage.objects;
drop policy if exists tenant_project_storage_delete on storage.objects;
drop policy if exists system_assets_public_read on storage.objects;

create policy tenant_project_storage_select on storage.objects
for select to authenticated
using (
  bucket_id in ('project-files', 'project-photos', 'templates')
  and exists (
    select 1 from public.proyek p
    where p.id = private.storage_project_id(bucket_id, name)
      and private.is_org_member(p.organization_id)
  )
);

create policy tenant_project_storage_insert on storage.objects
for insert to authenticated
with check (
  bucket_id in ('project-files', 'project-photos', 'templates')
  and exists (
    select 1 from public.proyek p
    where p.id = private.storage_project_id(bucket_id, name)
      and private.has_org_role(p.organization_id, array['owner','admin','member'])
  )
);

create policy tenant_project_storage_update on storage.objects
for update to authenticated
using (
  bucket_id in ('project-files', 'project-photos', 'templates')
  and exists (
    select 1 from public.proyek p
    where p.id = private.storage_project_id(bucket_id, name)
      and private.has_org_role(p.organization_id, array['owner','admin','member'])
  )
)
with check (
  bucket_id in ('project-files', 'project-photos', 'templates')
  and exists (
    select 1 from public.proyek p
    where p.id = private.storage_project_id(bucket_id, name)
      and private.has_org_role(p.organization_id, array['owner','admin','member'])
  )
);

create policy tenant_project_storage_delete on storage.objects
for delete to authenticated
using (
  bucket_id in ('project-files', 'project-photos', 'templates')
  and exists (
    select 1 from public.proyek p
    where p.id = private.storage_project_id(bucket_id, name)
      and private.has_org_role(p.organization_id, array['owner','admin','member'])
  )
);

-- Public system assets are deliberately separate from project documents.
create policy system_assets_public_read on storage.objects
for select to public
using (bucket_id = 'system-assets');
