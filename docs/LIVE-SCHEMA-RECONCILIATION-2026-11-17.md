# Live Schema Reconciliation — 17 November 2026

**Project:** `hrzplcqeadhvbrfhlfuh` (Singapore region)  
**Repository ref inspected:** `a6b377c240f6973e7f5022c77eef7b410ac6d864`  
**Method:** read-only SQL/catalog queries and Supabase advisors. No DDL, DML, Storage, Auth, or Edge Function changes were made.

## Executive result

The current local migration replay is green, but it is **not representative of the live database**. The live database has a large legacy schema that is not declared in the committed migration chain, and the live migration history endpoint returned an empty list.

| Live inventory | Observed |
|---|---:|
| Public base tables | 151 |
| Public views | 24 |
| Public RLS policies | 292 |
| Public functions | 192 |
| Public tables with RLS disabled | 1 |
| Public tables with RLS enabled but no policies | 6 |
| Views still using SECURITY DEFINER semantics | 12 |
| Functions with mutable/unpinned search_path (Advisor) | 43 |
| SECURITY DEFINER RPCs executable by anon (Advisor) | 13 |
| GraphQL objects discoverable to anon (Advisor) | 172 |
| GraphQL objects discoverable to authenticated (Advisor) | 175 |

The live project also has 3 Auth users and 1 row in `public.proyek` at the time of the audit. No row contents or credentials are reproduced here.

## 1. Migration history and schema drift

- Supabase `list_migrations` returned an empty migration list.
- The committed base SQL files declare only 27 base/optional tables before the SaaS tenant tables: 10 in `20240401_01_initial_schema.sql`, 1 in `20260916_keepalive_and_indexes.sql`, 10 sanitation tables, and 6 SmartAI pipeline tables.
- The live database contains 151 public base tables and 24 public views. Large groups such as accessibility, architecture, electrical, evacuation, fire, lighting, structural, stormwater, water, and waste modules exist live but are not fully represented by the committed base migration files.
- The sanitation and SmartAI table scripts remain outside `supabase/migrations/`; local CI does not automatically apply those files as part of the migration chain.
- Consequently, a green `supabase db reset` only proves the committed local chain is internally replayable. It does not prove that chain can safely upgrade the live schema.

**Required action:** build a complete, reviewed schema baseline from the live catalog (tables, columns, constraints, indexes, triggers, policies, grants, views, functions, extensions and Storage). Do not create a synthetic “baseline” by blindly dumping production and replaying it over the existing database.

## 2. Immediate security findings

### 2.1 `schema_migrations` — highest priority

- `public.schema_migrations` has RLS disabled.
- Advisor reports the table as public and RLS-disabled.
- Direct privilege checks confirm `anon` has SELECT, INSERT, UPDATE and DELETE privileges.
- The table currently contains 3 rows.

This is a real exposure surface. It is not safe to assume the table is harmless just because it is named as a migration ledger. The table should be assessed for its purpose, consumers and contents before designing a least-privilege fix. No changes were made.

### 2.2 Six tables have RLS but no policies

| Table | Initial classification / required review |
|---|---|
| `multi_agent_results` | Project-scoped AI output; must inherit tenant access from `proyek_id`. |
| `smartai_chunks` | Must inherit access through parent `smartai_documents`; no generic authenticated access. |
| `smartai_embeddings` | Backend-only cache/data; client roles should not receive direct access. |
| `smartai_logs` | User/job-scoped operational data; confirm ownership and retention model. |
| `architectural_standards_ref` | Reference dataset; likely read-only, but confirm intended anonymous/public access. |
| `zoning_reference` | Reference dataset; likely read-only, but confirm intended anonymous/public access. |

All six currently have RLS enabled but no policies, so ordinary client access is denied by RLS. However, catalog checks show broad table privileges for anon/authenticated on these objects. The reference tables may be intentionally public read-only; the other four should be treated as private until their access model is confirmed.

### 2.3 Views still bypass caller RLS

12 of 24 public views still have `security_invoker=false` / default owner-rights behavior. Examples include `fire_project_summary`, `chat_analytics`, `memory_analytics`, sanitation summaries, `water_system_summary`, `latest_water_quality`, and `tank_level_summary`.

The repository migration `20261117060000_secure_public_views.sql` is not recorded as applied on live. Every view needs dependency and caller-permission review before applying a blanket conversion; a view may rely on owner rights intentionally, so test its application query and expected grants after hardening.

### 2.4 SECURITY DEFINER RPCs and search_path

Supabase Security Advisor currently reports:
- 13 public SECURITY DEFINER RPCs executable by anon.
- 43 functions with mutable/unpinned `search_path`.

The branch contains `20261117070000_harden_security_definer_rpcs.sql`, but it is not recorded as applied on live. Confirm exact live function signatures and bodies against that migration before any rollout. Do not assume name-only equivalence.

### 2.5 GraphQL exposure

Advisor reports 172 objects discoverable by anon and 175 by authenticated users. Discoverability is not by itself proof of row disclosure, but it increases the exposed API surface and makes grants/RLS/view semantics important. Reconcile intended Data API exposure object-by-object; do not indiscriminately revoke grants that the application requires.

## 3. Storage configuration drift

Read-only Storage inventory:

| Bucket | Public | Objects | Storage object policies |
|---|---:|---:|---:|
| `skpslf` | yes | 0 | 0 |
| `templates` | yes | 0 | 0 |

The branch migration `20261117020000_tenant_scope_storage.sql` expects private project/template buckets and provisions `project-files`, `project-photos`, `templates`, and `system-assets`. Live currently has only `skpslf` and `templates`, both public, and no policies on `storage.objects`.

Although both observed buckets currently have zero objects, do not change bucket visibility until a fresh object inventory and application path audit are completed. Bucket creation and policy application should be staged and tested before live rollout.

## 4. Performance observations

The Performance Advisor reports 13 duplicate-index groups. These are optimization candidates, not migration blockers. Do not drop indexes automatically: inspect index definitions, constraints, query plans, and write workload before removing any duplicate.

## 5. Safe next work sequence

1. **Freeze production DDL and deployments.** Keep the SaaS PR Draft; do not apply the current migration chain to live.
2. Capture schema-only metadata in a controlled, access-restricted artifact. Exclude table row data, secrets, Auth credentials and Storage object contents.
3. Compare each live table/view/function/trigger/policy/grant/index to repository SQL and classify as: migration-managed, legacy-managed, reference data, platform/internal, or obsolete candidate.
4. Recover/author migration definitions for live-only modules, including their FK graph and RLS model. Keep sanitation and SmartAI SQL inside a tested migration chain rather than undocumented manual setup.
5. Build a disposable staging database with the full live schema baseline. Test the SaaS tenant migrations against that baseline, including existing data mapping and rollback/recovery.
6. Fix `schema_migrations`, the four private no-policy tables, 12 views, 13 SECURITY DEFINER RPC grants and 43 mutable search paths through reviewed, least-privilege migrations.
7. Reconcile Storage bucket IDs, object paths, bucket visibility and object policies; run tenant A/B access tests.
8. Run advisors, application integration tests, tenant A/B tests, and rollback rehearsal on staging.
9. Only after written approval, schedule a production rollout with a verified backup and explicit rollback plan.

## 6. Scope and limitations

- This report is a catalog/security inventory, not a full schema diff. Column-level and function-body equivalence across all 151 tables and 192 functions still needs to be generated and reviewed.
- Supabase migration history being empty does not mean the live schema is empty; it means the existing live DDL has not been reconciled into the CLI migration ledger.
- No production changes were performed during this audit.


## 7. Exact table-level reconciliation (catalog inventory)

A second pass used Supabase's verbose table catalog (151 public base tables, including columns, primary keys and foreign keys) and parsed every checked-in SQL file under `supabase/`.

### 7.1 Tables represented by existing checked-in table-creation SQL

The live catalog contains 26 tables represented by the existing core/optional SQL files. The optional `keepalive_ping` table is declared in `20260916_keepalive_and_indexes.sql` but was not present in the verbose live table listing. The SaaS migration will create `organizations` and `organization_members`; neither appears in the current live table inventory.

### 7.2 125 live tables not declared by checked-in CREATE TABLE statements

These are present in the live catalog but no matching `CREATE TABLE` declaration was found in the checked-in SQL files. They need their original DDL recovered or re-authored and reviewed before a full clean-database baseline can be claimed.

**Core and AI / collaboration**
- `agent_prompts`, `multi_agent_results`, `system_logs`, `laporan_versions`, `tata_ruang_analisis`, `tata_ruang_luasan`, `proyek_access`, `chat_sessions`, `generated_contents`, `ai_memories`

**Electrical, lightning protection and building intensity**
- `electrical_panels`, `electrical_measurements`, `electrical_thermal_images`, `electrical_protection_settings`, `electrical_compliance_checks`, `electrical_reports`, `lightning_risk_assessments`, `lps_components`, `lps_grounding_tests`, `lps_inspections`, `lps_internal_protection`, `lps_risk_assessments`, `lps_air_terminals`, `lps_grounding`, `building_intensity_assessments`, `building_setback_details`, `building_room_schedules`, `building_intensity_files`, `zoning_reference`

**Architecture, evacuation and structural**
- `architectural_assessments`, `architectural_rooms`, `architectural_facade_photos`, `architectural_files`, `architectural_standards_ref`, `egress_routes`, `exit_components`, `emergency_lighting`, `smoke_zones`, `occupant_loads`, `evacuation_drills`, `ref_occupant_factors`, `ref_travel_distance_limits`, `simulasi_summary`, `egress_analysis`, `etabs_models`, `fema356_analysis_results`, `timehistory_analysis_results`, `structural_analysis_reports`, `architecture_data`, `archsim_sessions`, `archsim_snapshots`, `evacuation_simulations`, `evacuation_exits`, `evacuation_agents`, `evacuation_buildings`

**Fire safety and lighting**
- `fire_simulations`, `fire_sources`, `fire_timeline`, `fire_integrated_analysis`, `fire_assets`, `fire_inspections`, `fire_calculations`, `fire_egress_plans`, `fire_pump_tests`, `fire_hydrant_tests`, `fire_risk_assessments`, `fire_inspection_files`, `lighting_projects`, `lighting_calculations`, `luminaire_library`, `furniture_library`, `daylight_calculations`, `lighting_reports`

**Building comfort and sanitation**
- `comfort_rooms`, `comfort_climate`, `comfort_view`, `comfort_noise`, `comfort_vibration`, `comfort_ventilation`, `comfort_furniture_layout`, `comfort_summary`, `wastewater_systems`, `sewer_network`, `treatment_units`, `effluent_quality`, `sanitary_fixtures`, `maintenance_schedule`, `pump_stations`, `pump_units`

**Stormwater, water and accessibility**
- `stormwater_simulations`, `stormwater_evaluations`, `stormwater_catchments`, `stormwater_design_storms`, `stormwater_lid_systems`, `stormwater_channels`, `water_systems`, `water_quality_tests`, `water_tanks`, `water_pipes`, `water_pumps`, `water_meters`, `water_meter_readings`, `water_fixtures`, `accessibility_scores`, `accessibility_corridors`, `accessibility_ramps`, `accessibility_stairs`, `accessibility_elevators`, `accessibility_toilets`, `accessibility_parking`, `accessibility_signage`, `accessibility_infrastructure`, `accessibility_files`, `accessibility_reports`

**Environmental modules and ledger**
- `environmental_documents`, `wastewater_monitoring`, `waste_audits`, `air_emissions`, `noise_measurements`, `hazardous_waste`, `energy_audits`, `water_audits`, `drainage_analysis`, `green_space_analysis`, `schema_migrations`

### 7.3 Ownership and indirect-parent coverage

The catalog identifies 17 live tables without any direct `project_id`, `proyek_id`, `organization_id`, `user_id`, `created_by`, or `owner_id` column:

- Parent-linked child rows: `electrical_protection_settings`, `building_setback_details`, `building_room_schedules`, `architectural_rooms`, `evacuation_exits`, `evacuation_agents`, `fire_sources`, `fire_timeline`, `lighting_reports`, `pump_units`.
- Shared/reference/system candidates: `agent_prompts`, `zoning_reference`, `architectural_standards_ref`, `ref_occupant_factors`, `ref_travel_distance_limits`, `luminaire_library`, `schema_migrations`.

The current branch migration `20261117050000_scope_indirect_project_children.sql` explicitly covers the ten parent-linked child tables (including electrical protection settings) and gives `agent_prompts` platform-admin-only write access. The four reference tables and `luminaire_library` still need explicit policy classification; `schema_migrations` needs a dedicated internal-only access model. Do not grant all authenticated users broad access merely to make the Advisor warning disappear.

### 7.4 Important limitation in the current branch

The branch's SaaS migration set is designed as a tenant-security layer over the existing application schema. It is **not yet a complete database bootstrap** for a fresh project: 125 live table definitions are not represented in checked-in `CREATE TABLE` SQL, and several live views/functions/triggers are also outside the base migration set. The existing CI proves replayability of the committed partial schema, not reproducibility of the entire live application database.

A complete migration baseline must be produced as a separate reviewed workstream. It should be generated from schema-only metadata, preserve dependency ordering, and be tested against a disposable local/staging database before the SaaS security migrations are layered on top.


## 8. RLS policy semantics and legacy-policy collision (second pass)

A read-only catalog query on 17 Nov 2026 counted:
- 485 constraints (primary, foreign-key, unique and check combined)
- 458 indexes
- 72 triggers
- 24 ordinary views; no materialized views
- 192 public-schema functions
- 292 public RLS policies
- 101 policies have a literal `true` in either `USING` or `WITH CHECK`
- 88 of those policies target/include `authenticated`
- 71 policies still reference deprecated `auth.role()`

These are policy-expression counts, not a claim that every row is currently exposed: effective access also depends on command, role, grants, RLS state, and the other predicates. However, any permissive policy with an unconditional `USING (true)` or `WITH CHECK (true)` can materially weaken tenant boundaries for its operation.

**Critical PostgreSQL behavior:** permissive RLS policies are OR-combined. A new restrictive-looking policy does not neutralize an older permissive policy. The foundation migration correctly drops all existing policies before creating tenant policies for tables it discovers through direct `project_id` / `proyek_id` columns. The indirect-child migration also replaces policies for its explicit child-table mapping. This does not, by itself, prove every live table is covered: tables with neither direct ownership columns nor an explicit parent mapping can retain broad legacy policies unless separately classified and handled.

The current catalog surfaced broad-policy candidates across modules including stormwater, settings, sanitation/wastewater, water, fire, electrical, accessibility, environmental and report tables. These names are a review queue, not a blanket instruction to revoke access: each table must be assigned a tenant, user-owned, shared-reference, system-only, or internal-ledger model before migration SQL is written.

### Required pre-rollout gate

1. Build a per-table matrix linking each live table to its tenant key or parent chain, effective RLS policies, grants, and intended role permissions.
2. For each table, prove that migration logic either replaces every permissive legacy policy or intentionally preserves only a reviewed shared-reference policy.
3. Add a CI assertion that scans the resulting schema for unexpected permissive `true` policies on tenant-owned tables and fails if any remain.
4. Add integration tests for SELECT, INSERT, UPDATE (including changing ownership columns), and DELETE across tenant A/B for every module family, not just the core `proyek` table.
5. Do not apply the tenant migrations to production until this reconciliation and tests are complete.

### Scope note

The constraint/index/trigger/view/function/policy counts above were obtained from live PostgreSQL catalogs. The full object definitions are not included in this public report to avoid unnecessarily publishing internal schema and implementation details. This remains a metadata/security audit; no row data or secrets were exported and no production object was changed.


## 9. View and SECURITY DEFINER verification

A direct catalog check found 24 ordinary public views and **all 24 currently lack `security_invoker=true`** (the PostgreSQL default is owner-rights / security-definer view behavior). This is broader than the 12 view warnings previously surfaced by the Security Advisor; the Advisor warning count should not be treated as the complete view inventory.

The same query found 13 public SECURITY DEFINER functions, and all 13 lack a pinned `search_path` setting in `pg_proc.proconfig`. The live Security Advisor's separate count of 43 mutable function search paths is a wider set of functions and remains a separate remediation queue.

Trigger inventory: 72 public triggers (71 BEFORE, 1 AFTER, 0 INSTEAD OF).

**Correction / interpretation:** the branch migration `20261117060000_secure_public_views.sql` is intended to set `security_invoker=true` for every public view and restrict grants, but it has not been applied to live production. Its local CI result is not evidence that production views are already hardened.
