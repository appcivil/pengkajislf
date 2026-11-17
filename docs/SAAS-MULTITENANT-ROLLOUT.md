# SaaS multi-tenant rollout

## Status

This branch introduces the database isolation foundation. It is intentionally not a production rollout yet.

- Each customer organization is represented by `public.organizations`.
- Membership and role are represented by `public.organization_members`.
- `public.proyek.organization_id` is required.
- Project child tables with a `proyek_id` column inherit tenant scope through the parent project.
- `viewer` is read-only; `member`, `admin`, and `owner` can write project data.
- The legacy dataset is preserved in a dedicated legacy workspace. Existing users are initially members of that workspace so existing data is not orphaned during the transition.

## Critical rollout warning

The migration is **not sufficient to launch SaaS by itself**. Existing customers have not yet been separated into their actual organizations. Until the data owner maps each existing project and each user to the correct tenant, all pre-existing users remain members of the single legacy workspace.

Do not run this migration against production until:
1. A verified database backup exists.
2. The active Supabase project is restored and healthy.
3. The complete production schema is compared with the repository migrations.
4. The tenant owner has approved the legacy-user/project mapping plan.
5. Application support for organization onboarding, organization switching, invitations, membership administration, and tenant-aware project creation has been implemented and tested.
6. Storage bucket policies and every table not linked through `proyek_id` have been audited separately.

## Apply

Run the migration in a staging Supabase project first:

`supabase/migrations/20261117000000_saas_multi_tenant_foundation.sql`

This migration is designed to preserve existing project rows by assigning them to the legacy workspace. It replaces permissive policies on the `proyek` table and on public tables containing a `proyek_id` column. Review the exact affected table list on staging before production.

## Data migration to real tenants

For each customer organization:
1. Create an organization using `public.create_organization(name)` while authenticated as its first owner.
2. Invite/add only approved users to `public.organization_members`, with an approved role.
3. Move projects to the new organization only after confirming the project owner and customer contract.
4. Verify all dependent records follow their parent project automatically.
5. Remove legacy membership only after all projects and users have been reconciled.

Never infer a customer's tenant from email domain alone.

## Verification checklist

Run these checks in staging after migration:

- Anonymous users cannot read `organizations`, `organization_members`, `proyek`, or project child tables.
- A user in tenant A can read tenant A projects and children.
- A user in tenant A cannot read, insert, update, or delete tenant B projects or children.
- A `viewer` can read but cannot insert, update, or delete project data.
- A `member` can create and update projects but cannot manage organization membership.
- An `admin` can manage tenant membership but cannot read another tenant.
- A user who belongs to two tenants can access only the tenant selected for a new project.
- Changing a project's `organization_id` cannot grant access to a user who is not a member of the destination tenant.
- Storage objects, signed URL generation, Edge Functions, exports, AI proxy requests, and Realtime subscriptions are tenant-scoped independently.
- All tables in exposed schemas have RLS enabled and no permissive legacy policy bypasses tenant checks.

## Known follow-up work

- Add organization picker/switcher and tenant onboarding UI.
- Add invitation flow and role management UI with server-side authorization.
- Scope storage object paths and policies to organization/project IDs.
- Audit and scope tables without `proyek_id` (including profiles, settings, notifications, and user-owned records).
- Add automated pgTAP tests for cross-tenant SELECT/INSERT/UPDATE/DELETE and role boundaries.
- Add AI proxy per-tenant quotas, rate limits, usage ledger, and model allowlist.
- Ensure logout clears app-store localStorage and all tenant-scoped caches.
- Enforce account status and privileged roles on the server, never only in frontend code.
