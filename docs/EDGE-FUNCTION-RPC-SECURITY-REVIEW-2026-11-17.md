# Edge Functions and RPC Security Review — 2026-11-17

## Scope

Read-only inspection of the four currently deployed Supabase Edge Functions and the matching repository sources on `feat/saas-multi-tenant-foundation`. Also inspected live PostgreSQL SECURITY DEFINER function metadata. No Edge Function was redeployed and no SQL privileges or function definitions were changed.

## Deployed function versions

| Function | Active version | JWT verification |
|---|---:|---|
| `ai-proxy` | 81 | enabled |
| `keepalive` | 21 | enabled |
| `auto-fill-simak` | 20 | enabled |
| `photo-checklist-mapper` | 20 | enabled |

The deployed source content matched the repository source for the inspected functions. All four have `verify_jwt=true`; this only checks JWT validity at the gateway and does not prove tenant membership.

## Findings

### Critical — auto-fill and photo mapper trust the Authorization header

Both `auto-fill-simak` and `photo-checklist-mapper` only test whether an Authorization header exists. They do not call Supabase Auth `getUser(token)` or otherwise verify the token in the handler.

Both accept `proyekId` but do not query the project or check the caller's membership. A caller with a syntactically present Authorization header can therefore request paid AI processing for arbitrary caller-supplied project context. JWT gateway verification is a useful outer gate but is not a substitute for checking project authorization in the function itself.

Additional input controls are incomplete:
- Auto-fill accepts caller-supplied project data and checklist template without strict shape/size bounds.
- Photo mapper accepts up to 20 base64 images but has no aggregate request-byte cap, strict MIME allowlist, or server-side project authorization.
- `batchSize` is caller-controlled and is not clamped.
- AI errors are returned in client-visible response bodies and may expose provider diagnostics.

### High — AI proxy has incomplete cost and input controls

The deployed `ai-proxy` validates the user access token with Supabase Auth `getUser(token)` and rejects non-authenticated JWT roles. This is a meaningful improvement over header-presence checks.

Remaining issues:
- No per-user or per-tenant request/token budget, concurrency limit, or rate limit is enforced in the function.
- `model` is client-controlled and is not constrained by a server-side provider/model allowlist.
- `maxTokens` is client-controlled (default 8192) and not bounded to a provider-specific safe maximum.
- Prompt, system prompt, and base64 payload sizes are not bounded at the application layer.
- Provider error bodies can be reflected in 500 responses.
- The CORS origin is wildcard. CORS is not authentication, but production should use an explicit origin allowlist where practical.
- The declared provider type includes `ollama`, but the switch has no Ollama implementation; the accepted contract and implementation should be aligned.

### High — keepalive endpoint uses a service-role credential without caller authentication

The function uses `SUPABASE_SERVICE_ROLE_KEY` when available and accepts the anon key as a fallback. It performs a database read and attempts an insert into `keepalive_ping`. Gateway `verify_jwt=true` accepts the public anon JWT, so the endpoint is not restricted to a trusted scheduler. An internet caller who knows the public anon key can trigger service-role-backed database work and repeated inserts. The client and deployment documentation explicitly describe anon-key invocation.

Required redesign: either make keepalive a truly read-only, low-impact public health check that does not use service role, or require a dedicated scheduler secret / signed request and apply a server-side time window and idempotency guard. Do not expose the service-role path to anonymous invocation.

## Live SECURITY DEFINER RPC inventory

The live database returned 13 public SECURITY DEFINER functions, all owned by `postgres`, all with no function-level `search_path` configuration, and all executable by `anon` as well as `authenticated`:

- `cleanup_expired_memories()`
- `cleanup_old_chat_sessions(integer)`
- `create_welcome_session(uuid)`
- `duplicate_lighting_project(uuid,text)`
- `get_chat_stats(uuid)`
- `get_user_memory_summary(uuid)`
- `handle_new_user()`
- `increment_memory_access(text)`
- `is_admin()`
- `is_project_member(uuid)`
- `search_chat_messages(text,uuid)`
- `search_memories(uuid,text,integer)`
- `verify_rls_status()`

This inventory is a high-priority review list, not proof that every function is exploitable. Each function body, argument validation, grants, and intended caller must be reviewed before revoking access or changing function security. Trigger-only functions such as `handle_new_user()` should not be treated like client RPCs.

## Required remediation before Edge Function redeployment

1. For project-scoped AI functions, require a real Bearer access token, validate it with `auth.getUser(token)`, require a valid `proyekId`, and verify access to that project using the same authenticated user-scoped Supabase client so project RLS is enforced. Return 401 for invalid sessions and 403/404 for unauthorized or nonexistent projects.
2. Do not trust caller-supplied project identity or membership claims. For auto-fill, load the project context from the database after authorization; for photo analysis, ensure every photo request is bound to that authorized project.
3. Add hard body-size, image count, per-image base64 size, MIME allowlist, template/context length, and batch-size limits. Validate AI output against a strict schema before returning it.
4. Add atomic per-user/per-tenant quotas and concurrency limits in the database or a trusted rate-limiting service. A client-side counter is not a security control.
5. Add server-side provider/model allowlists and provider-specific token caps. Never echo raw provider error bodies to clients; log a correlation ID and sanitized status instead.
6. Restrict keepalive to a dedicated secret-authenticated scheduler or remove service-role writes from any endpoint callable with the public anon key.
7. Review each SECURITY DEFINER RPC individually. Pin a safe `search_path` (or schema-qualify every reference with an empty path), revoke execution from `PUBLIC`/anon by default, and grant only to intended roles. Preserve trigger execution and legitimate internal call paths.
8. Test valid user A / tenant A, user B / tenant B, anonymous key, expired token, invalid token, missing project ID, foreign project ID, oversized payload, repeated calls, and direct invocation bypassing the browser.

## Important dependency

The live database does not yet have `organizations`, `organization_members`, or `proyek.organization_id`. Therefore do not deploy tenant-aware Edge Function code that depends on the new SaaS schema until the adapted migration has been applied to a staging database and validated. The current branch's tenant migration is not applied to production.

## Explicit non-actions

No Edge Function deployment occurred. No database function, grant, policy, or table was changed. No secret was read or displayed. No production traffic was intentionally generated.
