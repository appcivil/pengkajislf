# Live Table Security Matrix — 18 November 2026

## Scope and method

This matrix is a read-only reconciliation of the live `public` schema in Supabase project `hrzplcqeadhvbrfhlfuh`. It inventories 151 base tables, direct ownership-like columns, declared foreign-key parent chains, RLS state, and existing policy metadata. No row values, credentials, or secrets were queried or exported. No live schema, data, policy, Storage, Auth, or Edge Function changes were made.

Machine-readable detail: [LIVE-TABLE-SECURITY-MATRIX-2026-11-18.csv](./LIVE-TABLE-SECURITY-MATRIX-2026-11-18.csv).

## Classification summary

| Classification | Tables | Meaning |
|---|---:|---|
| TENANT_PROJECT_DIRECT | 119 | Has `project_id`, `proyek_id`, or `organization_id`; tenant predicate still requires review |
| TENANT_INDIRECT_CANDIDATE | 11 | No direct tenant key; FK path reaches a project-owned parent |
| USER_OWNED_REVIEW | 12 | Has `user_id`, `created_by`, or `owner_id`, without a direct tenant key or parent path |
| SHARED_REFERENCE_CANDIDATE | 2 | Reference/standards naming suggests shared data; intended read/write scope unconfirmed |
| UNCLASSIFIED_REVIEW | 6 | No safe ownership inference from the available columns/FKs |
| INTERNAL_MIGRATION_LEDGER | 1 | `schema_migrations`; separately flagged because RLS is disabled and anon CRUD grants were found |

These are triage labels, not proof that the current policies or the proposed migration are safe. A column named `project_id` is not enough by itself: the FK target, nullability, write path, policy predicate, table grants, and role intent must all agree.

## Indirect parent-chain candidates

The catalog FK graph found these candidate paths:

- `electrical_protection_settings → electrical_panels → proyek`
- `building_setback_details → building_intensity_assessments → proyek`
- `building_room_schedules → building_intensity_assessments → proyek`
- `architectural_rooms → architectural_assessments → proyek`
- `evacuation_exits → evacuation_simulations → proyek`
- `evacuation_agents → evacuation_simulations → proyek`
- `fire_sources → fire_simulations → proyek`
- `fire_timeline → fire_simulations → proyek`
- `pump_units → pump_stations → proyek` (also has a path through `wastewater_systems`)
- `lighting_reports → lighting_calculations → lighting_projects`
- `smartai_chunks → smartai_documents → smartai_jobs`

The last two chains do not terminate at `proyek` in the catalog graph. They need explicit ownership semantics confirmed; do not assume that the project relationship is enforceable merely because a parent table has a familiar name. The migration's explicit indirect-child list must be checked against every row above, including the actual deployed FK definitions.

## Immediate findings

- Seven tables have zero policies in the live catalog: `multi_agent_results`, `zoning_reference`, `architectural_standards_ref`, `smartai_chunks`, `smartai_embeddings`, `smartai_logs`, and `schema_migrations`. Six of these are RLS-enabled; the migration ledger is the known RLS-disabled exception. Zero policies on an RLS-enabled table normally means API roles cannot access rows through RLS, but grants and service-role paths still require review.
- The matrix records 73 tables with at least one policy whose `USING` or `WITH CHECK` expression is literally `true`. This is a table count, not the previously reported 101 policy count. These policies are not automatically exploitable: command, role, grants, RLS state, and other predicates matter. However, PostgreSQL permissive policies are OR-combined, so a restrictive new tenant policy does not cancel a legacy permissive policy.
- The CSV includes policy names and command types, plus per-table counts for literal-true expressions, policies that include `authenticated`, and legacy `auth.role()` references. It intentionally omits policy expression bodies to keep the artifact concise and avoid publishing implementation details unnecessarily.
- Six tables are explicitly left unclassified: `profiles`, `agent_prompts`, `luminaire_library`, `smartai_embeddings`, and two reference-factor tables? The exact classification is recorded per table in the CSV; review it before assigning tenant semantics.

## Required next gate before any live migration

1. For every table, approve one authoritative ownership model: organization direct, project direct, project via a named parent, user-owned, globally shared reference, or backend-only.
2. For every FK-based child, verify the FK is real and non-null where required, and implement/test a policy that derives access through the approved parent chain. A missing FK must be treated as unclassified, not guessed.
3. Review all legacy permissive policies, especially literal-`true` policies. Do not simply add a stricter policy alongside them; remove/replace legacy policies only in a reviewed migration and after role-intent tests.
4. For each tenant-owned table, test SELECT, INSERT, UPDATE (including changing the owner/project FK), and DELETE for tenant A, tenant B, viewer, member, admin, owner, anonymous, and service role as appropriate.
5. Resolve the seven zero-policy tables and the `schema_migrations` privilege/RLS issue separately.
6. Compare this live matrix against migration files `20261117000000` through `20261117070000`; the matrix is not evidence that those migrations have been applied.
7. Keep the PR Draft and do not run migrations against production until staging rehearsal, rollback, and explicit production approval.

## Important correction to the triage labels

The FK chain is generated mechanically from declared foreign keys (up to five hops). It is a candidate relationship only; it does not inspect application semantics, SQL function bodies, JSON references, or runtime access paths. The six unclassified tables must remain blocked from tenant rollout until reviewed. Likewise, the 119 direct-key tables are not yet certified: direct ownership keys and effective policies must be validated table by table.
