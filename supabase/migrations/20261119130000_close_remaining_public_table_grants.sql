-- Close residual grants on internal and reference tables after tenant hardening.
-- Static standards tables remain readable to signed-in users, but never writable.
begin;

revoke all privileges on table public.schema_migrations from anon, authenticated;
alter table public.schema_migrations enable row level security;

revoke all privileges on table public.smartai_logs from anon, authenticated;
revoke all privileges on table public.smartai_embeddings from anon, authenticated;

-- These two tables are shared, non-tenant reference catalogs.
revoke all privileges on table public.architectural_standards_ref from anon;
revoke insert, update, delete, truncate, references, trigger
  on table public.architectural_standards_ref from authenticated;
grant select on table public.architectural_standards_ref to authenticated;
drop policy if exists architectural_standards_ref_authenticated_read on public.architectural_standards_ref;
create policy architectural_standards_ref_authenticated_read
  on public.architectural_standards_ref
  for select to authenticated
  using (true);

revoke all privileges on table public.zoning_reference from anon;
revoke insert, update, delete, truncate, references, trigger
  on table public.zoning_reference from authenticated;
grant select on table public.zoning_reference to authenticated;
drop policy if exists zoning_reference_authenticated_read on public.zoning_reference;
create policy zoning_reference_authenticated_read
  on public.zoning_reference
  for select to authenticated
  using (true);

-- Tenant-scoped result/chunk tables retain their existing authenticated RLS policies.
revoke all privileges on table public.multi_agent_results from anon;
revoke all privileges on table public.smartai_chunks from anon;

commit;
