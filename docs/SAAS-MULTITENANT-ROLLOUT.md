# SaaS multi-tenant rollout

## Status

This branch introduces the database isolation foundation. It is intentionally not a production rollout yet.

- Each customer organization is represented by `public.organizations`.
- Membership and role are represented by `public.organization_members`.
- `public.proyek.organization_id` is required.
- Project child tables with a `proyek_id` column inherit tenant scope through the parent project.
- `viewer` is read-only; `member`, `admin`, and `owner` can write project data.
- The existing sample project is mapped to the explicitly approved tenant `PT. TAPAK CITRA REKAYASA`. Platform administration is assigned to `enjangwahyudin.st@gmail.com`; tenant ownership is assigned separately to `inannmar@gmail.com`.

## Critical rollout warning

The migration is **not sufficient to launch SaaS by itself**. Existing customers have not yet been separated into their actual organizations. Until the data owner maps each existing project and each user to the correct tenant, all pre-existing users remain members of the single legacy workspace.

Do not run this migration against production until:
1. A verified database backup exists.
2. The active Supabase project is restored and healthy.
3. The complete production schema is compared with the repository migrations.
4. The tenant owner has approved the legacy-user/project mapping plan.
5. Organization onboarding, organization selection, and tenant-aware project creation have been tested in the browser.
6. Invitation and membership administration workflows are still pending.
7. Storage bucket policies, settings, profiles, SmartAI tables, and every remaining table not linked through `proyek_id`/`project_id` have been audited on the actual staging schema.

## Apply

Run these migrations in order in a staging Supabase project:

1. `20261117000000_saas_multi_tenant_foundation.sql`
2. `20261117010000_harden_tenant_membership_and_roles.sql`
3. `20261117020000_tenant_scope_storage.sql`
4. `20261117030000_tenant_scope_settings_and_profiles.sql`
5. `20261117040000_smartai_tenant_rls.sql`

The first migration preserves the existing project row by assigning it to the approved `PT. TAPAK CITRA REKAYASA` sample tenant, creates a separate private platform-admin registry, and grants no broad legacy membership. It grants platform-admin to the verified `enjangwahyudin.st@gmail.com` account and tenant-owner to the separately verified `inannmar@gmail.com` account, only when each exists at migration time. The later migrations harden membership roles, scope Storage objects, and scope tenant settings/profile visibility. Review the affected table and storage policy inventory on staging before production.

## Data migration to real tenants

For each customer organization:
1. Create an organization using `public.create_organization(name)` while authenticated as its first owner.
2. Invite/add only approved users to `public.organization_members`, with an approved role.
3. Move projects to the new organization only after confirming the project owner and customer contract.
4. Verify all dependent records follow their parent project automatically.
5. Remove legacy membership only after all projects and users have been reconciled.

Never infer a customer's tenant from email domain alone.


## Approved sample tenant and administrator bootstrap

- Platform administrator: `enjangwahyudin.st@gmail.com`.
- Owner of sample tenant: `inannmar@gmail.com`.
- Sample customer tenant: `PT. TAPAK CITRA REKAYASA`.
- Existing sample project: assigned to the Tapak tenant by the foundation migration.
- Both Auth accounts were confirmed verified by a read-only lookup on 2026-11-17.
- Platform admin is not a blanket tenant super-owner. Cross-tenant support access must be separately authorized and audited.

The foundation migration bootstraps the two identities separately. For a recovery/reconciliation run, use this one-time SQL as a trusted database administrator (not from the browser):

\`\`\`sql
DO $$
DECLARE
  v_admin uuid;
  v_owner uuid;
BEGIN
  SELECT id INTO v_admin FROM auth.users
  WHERE lower(email) = 'enjangwahyudin.st@gmail.com' AND email_confirmed_at IS NOT NULL;
  SELECT id INTO v_owner FROM auth.users
  WHERE lower(email) = 'inannmar@gmail.com' AND email_confirmed_at IS NOT NULL;
  IF v_admin IS NULL OR v_owner IS NULL THEN
    RAISE EXCEPTION 'Both designated accounts must be verified';
  END IF;
  INSERT INTO private.platform_admins(user_id, email_at_assignment)
  VALUES (v_admin, 'enjangwahyudin.st@gmail.com')
  ON CONFLICT (user_id) DO NOTHING;
  INSERT INTO public.organization_members(organization_id, user_id, role)
  VALUES ('22222222-2222-4222-8222-222222222222', v_owner, 'owner')
  ON CONFLICT (organization_id, user_id) DO UPDATE SET role = 'owner';
END;
$$;
\`\`\`

Do not run the bootstrap until the Auth account is verified and the migration has first passed on staging. The platform-admin UI email check is only a display convenience; all privileged server/database operations must check `private.is_platform_admin()` or an equivalent server-verified authorization path.

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

## Completed in this branch

- Basic organization onboarding, membership listing, active-tenant selection, and tenant selection on project creation.
- Tenant-scoped settings and shared-tenant profile visibility policies.
- SmartAI jobs/documents follow project tenant access; chunks inherit parent-document access; embedding vectors are backend-only; user cache/logs are owner-scoped.
- Tenant-scoped Storage policies and signed URLs for field data and report templates.
- Account-bound app-store persistence; account switching clears project/checklist/file state.
- Staging smoke-test script for cross-tenant reads/updates and viewer read-only behavior.
- Pull-request CI workflow for tests, static audits, and production build.

## Remaining before production

- Invitation flow and full membership administration with server-side authorization.
- Complete inventory and RLS review of every table without `proyek_id`/`project_id`, including auxiliary analysis tables and all RPC functions.
- Tenant scoping for AI Proxy quotas, usage ledger, rate limits, model allowlist, and Edge Functions.
- Realtime subscriptions and all views/RPC functions must be checked for tenant leaks.
- Storage legacy object audit, path verification, and migration of old public template URLs.
- End-to-end tests for cross-tenant SELECT/INSERT/UPDATE/DELETE and all roles on a live staging database.
- Enforce account status and privileged roles on the server, never only in frontend code.
- Confirm `npm ci`, unit tests, static audits, and production build pass in GitHub Actions.
