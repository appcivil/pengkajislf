# Live Supabase Database Audit — 2026-11-17

## Scope and safety

This document records a read-only inspection of the currently active Supabase project. No SQL DDL/DML, migration, bucket mutation, policy mutation, branch creation, or deployment was performed as part of this inspection.

Project reference: `hrzplcqeadhvbrfhlfuh` (Singapore region). The project was restored to `ACTIVE_HEALTHY` before this inspection. The migration history endpoint returned no applied migrations.

## Verified live inventory

- 151 base tables in `public`.
- 150 of those tables have RLS enabled; one does not. No table currently has FORCE ROW LEVEL SECURITY.
- 292 policies were reported in the initial public-policy inventory.
- 117 tables contain `project_id`; 20 contain `proyek_id`; 15 contain `user_id`; 40 contain `created_by`. These sets overlap.
- 25 tables have none of those four ownership columns; a separate keyless inventory found 20 RLS-enabled tables with none of `project_id`, `proyek_id`, `user_id`, `created_by`, or `organization_id`, plus the unprotected `schema_migrations` table. Reference/configuration tables need explicit classification rather than blanket tenant scoping.
- `public.proyek` currently has one row, and its `created_by` is NULL. It has no `organization_id` column.
- `auth.users` had two users at the time of inspection.
- The `proyek` schema includes sensitive integration/contact fields such as `simbg_email`, `simbg_password`, `simbg_nik`, and `ktp_pemilik`. The one current project had a non-NULL `simbg_email`, but NULL values for the other three inspected fields. Do not expose these values in logs or reports.
- Storage buckets are `skpslf` and `templates`; both are currently marked public. The inspected policy inventory returned zero policies on `storage.objects`.
- Six RLS-enabled tables had no policies in the initial inventory: `multi_agent_results`, `zoning_reference`, `architectural_standards_ref`, `smartai_chunks`, `smartai_embeddings`, and `smartai_logs`.
- A function inventory found 13 SECURITY DEFINER functions in `public`; all 13 were executable by `anon`. 192 functions in `public` had no pinned `search_path` configuration (this count is broader than the SECURITY DEFINER subset).
- Prior Security Advisor inspection also reported 12 SECURITY DEFINER views and 43 functions with mutable/unpinned search_path. Reconcile those counts with the current function/view inventory before remediation.

## High-priority risks

1. **Tenant isolation is not established.** Several policies use unconditional `true` predicates or permit broad authenticated/public access. Examples include `proyek`, `settings`, `agent_prompts`, `hasil_analisis`, `todo_tasks`, `profiles`, and multiple discipline-specific tables. Authentication-only predicates are not tenant isolation.
2. **Storage is not private by default.** Both existing buckets are public and no `storage.objects` policies were returned. The current application and migration assumptions refer to different bucket names in places. Reconcile actual object paths and client code before changing visibility or policies.
3. **Legacy project ownership is unresolved.** The only project has NULL `created_by`; a migration that blindly maps by creator cannot reliably assign it to an organization. The two auth users must not be assumed to own it without an explicit owner decision.
4. **Credential exposure risk.** The `proyek` table contains a `simbg_password` column. Even when currently NULL, it should not be treated as ordinary project metadata. Prefer secret storage (or a server-side integration credential vault), strict access, and rotation if any real credential has ever been stored.
5. **SECURITY DEFINER attack surface.** Anon-executable SECURITY DEFINER functions and unpinned search paths require function-by-function review. Do not bulk revoke or alter them without mapping RPC usage and required grants.
6. **No-policy RLS tables need classification.** Some may intentionally be backend-only or static reference data; others may be inaccessible to clients. Define intended access before creating policies.

## Required work before production migration

- Export and review all 151 table definitions, foreign keys, views, triggers, RPC/function signatures and grants, Storage object paths, Edge Functions, Realtime publications, and application queries.
- Classify every table as tenant-owned, project-owned, user-owned, global reference, system/backend-only, or intentionally public. Add an explicit ownership strategy for the 25 tables with no existing ownership key.
- Design a data-preserving ownership assignment for the existing project and records with NULL owner/project keys. Obtain an explicit owner mapping; do not infer ownership from the first auth user.
- Reconcile actual Storage buckets and object prefixes (`skpslf`, `templates`) with application code. Stage private bucket and signed URL changes only after object inventory and download/upload tests.
- Review all 13 SECURITY DEFINER functions and 12 reported SECURITY DEFINER views; pin safe search paths, minimize grants, and test dependent RPCs.
- Test with two real staging tenants and at least owner/admin/member/viewer roles. Cover SELECT/INSERT/UPDATE/DELETE, foreign-key reassignment, RPCs, views, Storage upload/download/list/delete, SmartAI jobs/documents/chunks/embeddings, and account switching.
- Apply migrations to a disposable staging copy first, verify backup/restore, run automated isolation tests, then plan a separately approved production maintenance window.

## Relationship to the SaaS foundation PR

The SaaS foundation PR is a code and migration proposal, not an applied database change. Its generic policy replacement logic is not sufficient for this live schema: it only scopes tables matching known project key conventions and does not automatically solve keyless tables, SECURITY DEFINER functions/views, existing public Storage buckets, or legacy rows with NULL ownership. Adapt the migration to this inventory before considering it deployable.

## Explicit non-actions

No production database schema or data was modified. No migrations were applied. No bucket visibility or Storage policies were changed. No staging branch was created. No production deployment was triggered.
