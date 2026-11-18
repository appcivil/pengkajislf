# Keepalive security rollout

## Purpose

The keepalive Edge Function is a scheduler endpoint, not a browser API. The gateway JWT check remains enabled, and the function additionally requires a dedicated `KEEPALIVE_SECRET` header.

## Required configuration

Generate a random secret with at least 32 bytes of entropy. Use the same value in:

- Supabase Edge Function secret: `KEEPALIVE_SECRET`
- GitHub Actions repository secret: `KEEPALIVE_SECRET`
- Any external scheduler, in HTTP header `x-keepalive-secret`

Do not use the Supabase service-role key as this secret. Do not use a `VITE_*` variable, browser storage, or a committed file.

## Deployment (requires explicit production approval)

After the secret has been configured in the Supabase project:

```bash
supabase secrets set KEEPALIVE_SECRET="<random-secret>" --project-ref <project-ref>
supabase functions deploy keepalive --project-ref <project-ref>
```

No deployment is performed by this change.

## Request contract

Send a POST request with both the public anon JWT (for the Supabase gateway) and the dedicated secret:

```bash
curl -i -X POST "https://<project-ref>.supabase.co/functions/v1/keepalive" \
  -H "apikey: <ANON_KEY>" \
  -H "Authorization: Bearer <ANON_KEY>" \
  -H "x-keepalive-secret: <KEEPALIVE_SECRET>" \
  -H "Content-Type: application/json" --data '{}'
```

Expected behavior:

- Missing or incorrect scheduler secret: HTTP 401.
- Non-POST request: HTTP 405.
- Authenticated scheduler: one bounded insert into `keepalive_ping`.
- The function does not accept table names, SQL, or arbitrary payload fields.
- Service-role access is only created after the scheduler secret is validated.

## Callers

- Browser: may only use the regular Supabase client with the caller's current session and RLS. It never invokes this privileged Edge Function.
- GitHub Actions: direct anon read of `keepalive_ping` first; if that fails, calls the Edge Function with `KEEPALIVE_SECRET`.
- External scheduler: must send both the anon JWT and `x-keepalive-secret`.

## Rollout sequence

1. Configure `KEEPALIVE_SECRET` in Supabase Edge Function secrets and GitHub Actions secrets.
2. Deploy the updated Edge Function after approval.
3. Test that missing secret returns 401 and valid secret returns 200.
4. Run GitHub Actions manually and confirm its fallback path succeeds.
5. Update external schedulers before relying on them; legacy anon-only calls will be rejected.
6. Rotate the secret by updating both Supabase and all scheduler secret stores, then redeploy/restart callers as needed.

This repository change does not read, create, or modify any production secret and does not deploy the function.
