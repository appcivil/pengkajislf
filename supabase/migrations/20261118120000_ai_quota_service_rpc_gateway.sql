-- PostgREST exposes public by default, not the private schema.
-- Keep ledger tables and implementation private; publish only narrow RPC gateways
-- and grant execution exclusively to service_role for Edge Function use.

create or replace function public.ai_quota_reserve(
  p_user_id uuid,
  p_organization_id uuid,
  p_idempotency_key text,
  p_reserved_tokens integer,
  p_ttl_seconds integer default 900
)
returns table (allowed boolean, reservation_id uuid, reason text, retry_after timestamptz)
language sql
security definer
set search_path = ''
as $$
  select * from private.ai_quota_reserve(
    p_user_id, p_organization_id, p_idempotency_key, p_reserved_tokens, p_ttl_seconds
  );
$$;

create or replace function public.ai_quota_finalize(
  p_reservation_id uuid,
  p_actual_tokens integer
)
returns boolean
language sql
security definer
set search_path = ''
as $$
  select private.ai_quota_finalize(p_reservation_id, p_actual_tokens);
$$;

create or replace function public.ai_quota_release(p_reservation_id uuid)
returns boolean
language sql
security definer
set search_path = ''
as $$
  select private.ai_quota_release(p_reservation_id);
$$;

create or replace function public.ai_quota_expire_reservations(p_limit integer default 500)
returns integer
language sql
security definer
set search_path = ''
as $$
  select private.ai_quota_expire_reservations(p_limit);
$$;

revoke all on function public.ai_quota_reserve(uuid, uuid, text, integer, integer) from public, anon, authenticated;
revoke all on function public.ai_quota_finalize(uuid, integer) from public, anon, authenticated;
revoke all on function public.ai_quota_release(uuid) from public, anon, authenticated;
revoke all on function public.ai_quota_expire_reservations(integer) from public, anon, authenticated;

grant execute on function public.ai_quota_reserve(uuid, uuid, text, integer, integer) to service_role;
grant execute on function public.ai_quota_finalize(uuid, integer) to service_role;
grant execute on function public.ai_quota_release(uuid) to service_role;
grant execute on function public.ai_quota_expire_reservations(integer) to service_role;

comment on function public.ai_quota_reserve(uuid, uuid, text, integer, integer) is
  'Service-role-only PostgREST gateway to the private atomic AI quota ledger.';
comment on function public.ai_quota_finalize(uuid, integer) is
  'Service-role-only PostgREST gateway to finalize an AI quota reservation.';
comment on function public.ai_quota_release(uuid) is
  'Service-role-only PostgREST gateway to release a pre-provider AI quota reservation.';
comment on function public.ai_quota_expire_reservations(integer) is
  'Service-role-only PostgREST gateway to expire stale AI quota reservations.';
