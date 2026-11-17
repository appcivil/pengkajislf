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
