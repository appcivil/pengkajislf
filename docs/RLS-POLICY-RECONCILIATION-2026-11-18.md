# RLS Policy Reconciliation — 18 November 2026

## Executive finding

The current SaaS migration set is **not ready for production application**. A live-schema comparison found two non-standard `project_id` foreign-key targets that conflict with the generic policy generator in `20261117000000_saas_multi_tenant_foundation.sql`. It also found user-owned and shared module tables whose access model cannot safely be inferred from a generic project policy.

This is a static, read-only review. No production DDL, policies, data, Auth, Storage, or Edge Functions were changed.

## Confirmed migration mismatch: `project_id` does not always mean `proyek.id`

The foundation migration discovers every public table containing `project_id` or `proyek_id`, then builds a predicate equivalent to:

```sql
exists (
  select 1
  from public.proyek p
  where p.id = child.project_id
    and private.is_org_member(p.organization_id)
)
```

Live FK metadata shows two exceptions:

| Table | Column | Actual FK target | Consequence if generic policy is applied |
|---|---|---|---|
| `daylight_calculations` | `project_id` | `public.lighting_projects(id)` | Predicate compares a lighting-project UUID with `proyek.id`; access will normally fail closed and break this module |
| `lighting_calculations` | `project_id` | `public.lighting_projects(id)` | Same mismatch; generic migration drops the existing lighting-specific policies and replaces them with a predicate against the wrong parent |

The live lighting module currently uses `lighting_projects.owner_id` and `shared_with` to define ownership/sharing. It is not currently mapped to `organizations` or `proyek`. The migration must not silently reinterpret it as a Pengkaji SLF project.

### Required correction

1. Exclude `project_id` columns whose declared FK target is not `public.proyek(id)` from the generic project-child policy generator.
2. Explicitly classify the lighting module. Preferred long-term design is an organization ownership key on `lighting_projects`, with a reviewed backfill from owner-to-organization membership and explicit handling for owners in multiple organizations.
3. Until that ownership mapping is approved and tested, preserve a deliberately isolated legacy lighting access model or fail closed with an explicit product limitation. Do not silently drop its existing policies.
4. Add a CI schema assertion that every table entering the generic `project_id` policy generator either has an FK to `public.proyek(id)` or is explicitly allow-listed as an FK-less legacy relationship (for example SmartAI project references, if that remains intentional).

## Additional policy and ownership findings

### User-owned and legacy-shared tables

Live metadata identifies user ownership on tables such as `ai_memories`, `archsim_sessions`, `archsim_snapshots`, `chat_sessions`, `generated_contents`, `notifications`, `lighting_projects`, and SmartAI user/job/document tables. Several other module tables have `created_by` but are also project-owned via a separate project key.

Important examples:

- `archsim_snapshots` uses `auth.role() = 'authenticated'` policies for all four commands while carrying a `created_by` column. The current policy is role-gating, not row ownership.
- `archsim_sessions` SELECT uses `auth.role() = 'authenticated'`, while its writes use `auth.uid() = user_id`. Its SELECT policy is broader than its write policy.
- `architectural_assessments`, `building_intensity_assessments`, `electrical_panels`, `electrical_measurements`, `electrical_thermal_images`, `environmental_documents`, `effluent_quality`, `maintenance_schedule`, `water_systems`, and other module tables have legacy permissive policies with literal `true`. For tables with a direct project FK, the foundation migration intends to replace those policies. Tables not discovered by the generic generator require a separate explicit model.
- `lighting_projects` uses owner and shared-user semantics. A user-to-tenant migration must define whether sharing outside an organization remains permitted.
- `smartai_documents` and `smartai_jobs` have `project_id` but no declared FK. Their intended relationship to `proyek` is currently application-level rather than FK-enforced; require explicit validation and reject orphan/foreign project IDs at write time.

### Tables requiring explicit decisions

- `profiles`: user profile; should remain self-managed, with any tenant-shared profile fields narrowly defined.
- `agent_prompts`: shared system configuration; the migration's read-authenticated/write-platform-admin model is appropriate only after confirming that all prompt content is safe for all authenticated tenants.
- `ref_occupant_factors`, `ref_travel_distance_limits`, `zoning_reference`, `architectural_standards_ref`, `luminaire_library`: likely shared reference/catalogue data, but read/write intent and public exposure must be explicit. The current live zero-policy state on some of these tables means authenticated access may be blocked by RLS even if table grants exist.
- `smartai_embeddings`: backend-only vector cache; the migration revokes client grants. Verify service-role/backend workflows separately.
- `smartai_logs`: user-owned or backend-only logs; current zero-policy state is fail-closed for API roles. The migration provides user-scoped access only for non-null matching `user_id`.
- `multi_agent_results`: zero-policy table; classify as backend-only or attach to a project/tenant explicitly.
- `schema_migrations`: internal migration ledger; separate hardening required because it has RLS disabled and previously confirmed anon CRUD grants.

## Review of indirect parent chains

The explicit indirect-child migration includes nine ordinary parent mappings plus the electrical protection special case. SmartAI chunks are separately handled in the SmartAI migration. The live FK graph is consistent with those intended child-to-parent relationships for the named tables.

One implementation concern remains: the indirect migration uses `continue` when either child or parent table is absent. That is convenient for the reduced CI baseline, but can silently skip protection if a child exists while its required parent is absent. Replace that behavior with a fail-closed check: skip only when the child table itself is absent; if child exists and required parent/columns/FK are missing, raise an exception. Keep local optional-schema behavior through explicit allow-lists, not a blanket skip.

## Required code/CI changes before staging

1. Correct the generic `project_id` table discovery to validate FK targets.
2. Add an explicit lighting-module ownership decision and tests; do not auto-map `lighting_projects.owner_id` to an organization without ambiguity handling.
3. Require a real FK or an explicit allow-list for FK-less SmartAI `project_id` fields, and validate referenced `proyek` ownership in INSERT/UPDATE.
4. Change indirect-child migration to fail when an existing child lacks its required parent table, FK, or expected key columns.
5. Add a machine-checked policy matrix test asserting:
   - no unexpected permissive `true` policies remain on tenant-owned tables;
   - every direct project table has a policy that reaches the correct ownership root;
   - every indirect child has parent-scoped SELECT/INSERT/UPDATE/DELETE policies;
   - UPDATE has both `USING` and `WITH CHECK`;
   - no user can change a row's project/parent reference to another tenant;
   - user-owned and reference tables have explicit allow-listed access models.
6. Add cross-tenant tests for tenant A and B, owner/admin/member/viewer, anonymous, and service-role paths. Include lighting owner/shared-user scenarios and SmartAI rows with null, valid, invalid, and foreign project IDs.

## Production safety

Do not apply the current migration set to production. Keep PR #1 Draft. First implement the above fixes on the feature branch, run the full local Supabase reset/RLS suite and production build in GitHub Actions, then rehearse against a disposable staging baseline. Production requires a separate explicit approval after backup and rollback rehearsal.
