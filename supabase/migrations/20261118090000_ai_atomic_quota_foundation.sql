-- Atomic AI quota ledger foundation.
-- No active quota caps are seeded: numeric limits require explicit owner approval.
-- All writes are performed through service-role-only SECURITY DEFINER RPCs.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to service_role;

create table if not exists private.ai_quota_policies (
  id uuid primary key default gen_random_uuid(),
  scope text not null check (scope in ('user', 'organization')),
  plan_key text not null check (length(plan_key) between 1 and 40),
  window_seconds integer not null check (window_seconds between 60 and 2678400),
  max_requests integer check (max_requests is null or max_requests >= 0),
  max_tokens bigint check (max_tokens is null or max_tokens >= 0),
  enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (scope, plan_key, window_seconds),
  check (max_requests is not null or max_tokens is not null)
);

create table if not exists private.ai_usage_buckets (
  scope text not null check (scope in ('user', 'organization')),
  subject_id uuid not null,
  window_seconds integer not null,
  period_start timestamptz not null,
  reserved_requests bigint not null default 0 check (reserved_requests >= 0),
  used_requests bigint not null default 0 check (used_requests >= 0),
  reserved_tokens bigint not null default 0 check (reserved_tokens >= 0),
  used_tokens bigint not null default 0 check (used_tokens >= 0),
  updated_at timestamptz not null default now(),
  primary key (scope, subject_id, window_seconds, period_start)
);

create table if not exists private.ai_usage_reservations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  organization_id uuid,
  idempotency_key text not null check (length(idempotency_key) between 8 and 128),
  reserved_tokens integer not null check (reserved_tokens between 1 and 1000000),
  actual_tokens integer check (actual_tokens is null or actual_tokens between 0 and 1000000),
  bucket_refs jsonb not null default '[]'::jsonb check (jsonb_typeof(bucket_refs) = 'array'),
  status text not null default 'reserved' check (status in ('reserved', 'finalized', 'released', 'expired')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  finalized_at timestamptz,
  unique (user_id, idempotency_key)
);

alter table private.ai_quota_policies enable row level security;
alter table private.ai_usage_buckets enable row level security;
alter table private.ai_usage_reservations enable row level security;

create index if not exists ai_usage_reservations_expiry_idx
  on private.ai_usage_reservations (expires_at)
  where status = 'reserved';

revoke all on all tables in schema private from public, anon, authenticated, service_role;
revoke all on all sequences in schema private from public, anon, authenticated, service_role;

create or replace function private.ai_quota_reserve(
  p_user_id uuid,
  p_organization_id uuid,
  p_idempotency_key text,
  p_reserved_tokens integer,
  p_ttl_seconds integer default 900
)
returns table (allowed boolean, reservation_id uuid, reason text, retry_after timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_existing private.ai_usage_reservations%rowtype;
  v_reservation_id uuid;
  v_scope text;
  v_subject_id uuid;
  v_policy record;
  v_period_start timestamptz;
  v_bucket private.ai_usage_buckets%rowtype;
  v_refs jsonb := '[]'::jsonb;
  v_now timestamptz := clock_timestamp();
begin
  if p_user_id is null
     or p_idempotency_key is null
     or length(p_idempotency_key) < 8
     or length(p_idempotency_key) > 128
     or p_reserved_tokens is null
     or p_reserved_tokens < 1
     or p_reserved_tokens > 1000000
     or p_ttl_seconds is null
     or p_ttl_seconds < 30
     or p_ttl_seconds > 3600 then
    raise exception 'invalid quota reservation arguments' using errcode = '22023';
  end if;

  -- Deterministic lock order: user first, organization second.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('ai-user:' || p_user_id::text, 0));
  if p_organization_id is not null then
    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('ai-org:' || p_organization_id::text, 0));
  end if;

  select * into v_existing
  from private.ai_usage_reservations r
  where r.user_id = p_user_id and r.idempotency_key = p_idempotency_key
  for update;

  if found then
    if v_existing.status = 'reserved'
       and v_existing.reserved_tokens = p_reserved_tokens
       and v_existing.organization_id is not distinct from p_organization_id then
      return query select true, v_existing.id, 'existing_reservation'::text, v_existing.expires_at;
    else
      return query select false, v_existing.id, 'idempotency_key_already_used'::text, null::timestamptz;
    end if;
    return;
  end if;

  foreach v_scope in array (
    case when p_organization_id is null
      then array['user']::text[]
      else array['user','organization']::text[]
    end
  )
  loop
    v_subject_id := case when v_scope = 'user' then p_user_id else p_organization_id end;

    for v_policy in
      select p.window_seconds, p.max_requests, p.max_tokens
      from private.ai_quota_policies p
      where p.scope = v_scope and p.plan_key = 'free' and p.enabled = true
      order by p.window_seconds
    loop
      v_period_start := pg_catalog.date_bin(
        pg_catalog.make_interval(secs => v_policy.window_seconds),
        v_now,
        'epoch'::timestamptz
      );

      insert into private.ai_usage_buckets (
        scope, subject_id, window_seconds, period_start
      ) values (
        v_scope, v_subject_id, v_policy.window_seconds, v_period_start
      ) on conflict do nothing;

      select * into v_bucket
      from private.ai_usage_buckets b
      where b.scope = v_scope
        and b.subject_id = v_subject_id
        and b.window_seconds = v_policy.window_seconds
        and b.period_start = v_period_start
      for update;

      if v_policy.max_requests is not null
         and v_bucket.used_requests + v_bucket.reserved_requests + 1 > v_policy.max_requests then
        return query select false, null::uuid, 'request_quota_exceeded'::text,
          v_period_start + pg_catalog.make_interval(secs => v_policy.window_seconds);
        return;
      end if;

      if v_policy.max_tokens is not null
         and v_bucket.used_tokens + v_bucket.reserved_tokens + p_reserved_tokens > v_policy.max_tokens then
        return query select false, null::uuid, 'token_quota_exceeded'::text,
          v_period_start + pg_catalog.make_interval(secs => v_policy.window_seconds);
        return;
      end if;

      v_refs := v_refs || pg_catalog.jsonb_build_array(pg_catalog.jsonb_build_object(
        'scope', v_scope,
        'subject_id', v_subject_id,
        'window_seconds', v_policy.window_seconds,
        'period_start', v_period_start
      ));
    end loop;
  end loop;

  -- All applicable scopes/windows passed. Only now reserve all buckets.
  for v_policy in select value from pg_catalog.jsonb_array_elements(v_refs)
  loop
    update private.ai_usage_buckets b
    set reserved_requests = b.reserved_requests + 1,
        reserved_tokens = b.reserved_tokens + p_reserved_tokens,
        updated_at = v_now
    where b.scope = v_policy.value->>'scope'
      and b.subject_id = (v_policy.value->>'subject_id')::uuid
      and b.window_seconds = (v_policy.value->>'window_seconds')::integer
      and b.period_start = (v_policy.value->>'period_start')::timestamptz;
  end loop;

  insert into private.ai_usage_reservations (
    user_id, organization_id, idempotency_key, reserved_tokens,
    bucket_refs, status, expires_at
  ) values (
    p_user_id, p_organization_id, p_idempotency_key, p_reserved_tokens,
    v_refs, 'reserved', v_now + pg_catalog.make_interval(secs => p_ttl_seconds)
  ) returning id into v_reservation_id;

  return query select true, v_reservation_id, 'reserved'::text,
    v_now + pg_catalog.make_interval(secs => p_ttl_seconds);
end;
$$;

create or replace function private.ai_quota_finalize(
  p_reservation_id uuid,
  p_actual_tokens integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_reservation private.ai_usage_reservations%rowtype;
  v_ref jsonb;
begin
  if p_reservation_id is null or p_actual_tokens is null
     or p_actual_tokens < 0 or p_actual_tokens > 1000000 then
    raise exception 'invalid quota finalization arguments' using errcode = '22023';
  end if;

  select * into v_reservation
  from private.ai_usage_reservations r
  where r.id = p_reservation_id
  for update;

  if not found then return false; end if;
  if v_reservation.status = 'finalized' then return true; end if;
  if v_reservation.status <> 'reserved' then return false; end if;

  for v_ref in select value from pg_catalog.jsonb_array_elements(v_reservation.bucket_refs)
  loop
    update private.ai_usage_buckets b
    set reserved_requests = greatest(0, b.reserved_requests - 1),
        reserved_tokens = greatest(0, b.reserved_tokens - v_reservation.reserved_tokens),
        used_requests = b.used_requests + 1,
        used_tokens = b.used_tokens + p_actual_tokens,
        updated_at = clock_timestamp()
    where b.scope = v_ref->>'scope'
      and b.subject_id = (v_ref->>'subject_id')::uuid
      and b.window_seconds = (v_ref->>'window_seconds')::integer
      and b.period_start = (v_ref->>'period_start')::timestamptz;
  end loop;

  update private.ai_usage_reservations
  set status = 'finalized', actual_tokens = p_actual_tokens, finalized_at = clock_timestamp()
  where id = p_reservation_id;
  return true;
end;
$$;

create or replace function private.ai_quota_release(p_reservation_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_reservation private.ai_usage_reservations%rowtype;
  v_ref jsonb;
begin
  if p_reservation_id is null then
    raise exception 'reservation id is required' using errcode = '22023';
  end if;

  select * into v_reservation
  from private.ai_usage_reservations r
  where r.id = p_reservation_id
  for update;

  if not found then return false; end if;
  if v_reservation.status = 'released' then return true; end if;
  if v_reservation.status <> 'reserved' then return false; end if;

  for v_ref in select value from pg_catalog.jsonb_array_elements(v_reservation.bucket_refs)
  loop
    update private.ai_usage_buckets b
    set reserved_requests = greatest(0, b.reserved_requests - 1),
        reserved_tokens = greatest(0, b.reserved_tokens - v_reservation.reserved_tokens),
        updated_at = clock_timestamp()
    where b.scope = v_ref->>'scope'
      and b.subject_id = (v_ref->>'subject_id')::uuid
      and b.window_seconds = (v_ref->>'window_seconds')::integer
      and b.period_start = (v_ref->>'period_start')::timestamptz;
  end loop;

  update private.ai_usage_reservations
  set status = 'released', finalized_at = clock_timestamp()
  where id = p_reservation_id;
  return true;
end;
$$;

create or replace function private.ai_quota_expire_reservations(p_limit integer default 500)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_reservation private.ai_usage_reservations%rowtype;
  v_ref jsonb;
  v_count integer := 0;
begin
  if p_limit is null or p_limit < 1 or p_limit > 5000 then
    raise exception 'invalid expiry batch size' using errcode = '22023';
  end if;

  for v_reservation in
    select * from private.ai_usage_reservations r
    where r.status = 'reserved' and r.expires_at < clock_timestamp()
    order by r.expires_at
    limit p_limit
    for update skip locked
  loop
    for v_ref in select value from pg_catalog.jsonb_array_elements(v_reservation.bucket_refs)
    loop
      update private.ai_usage_buckets b
      set reserved_requests = greatest(0, b.reserved_requests - 1),
          reserved_tokens = greatest(0, b.reserved_tokens - v_reservation.reserved_tokens),
          updated_at = clock_timestamp()
      where b.scope = v_ref->>'scope'
        and b.subject_id = (v_ref->>'subject_id')::uuid
        and b.window_seconds = (v_ref->>'window_seconds')::integer
        and b.period_start = (v_ref->>'period_start')::timestamptz;
    end loop;

    update private.ai_usage_reservations
    set status = 'expired', finalized_at = clock_timestamp()
    where id = v_reservation.id;
    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

revoke all on function private.ai_quota_reserve(uuid, uuid, text, integer, integer) from public, anon, authenticated;
revoke all on function private.ai_quota_finalize(uuid, integer) from public, anon, authenticated;
revoke all on function private.ai_quota_release(uuid) from public, anon, authenticated;
revoke all on function private.ai_quota_expire_reservations(integer) from public, anon, authenticated;
grant execute on function private.ai_quota_reserve(uuid, uuid, text, integer, integer) to service_role;
grant execute on function private.ai_quota_finalize(uuid, integer) to service_role;
grant execute on function private.ai_quota_release(uuid) to service_role;
grant execute on function private.ai_quota_expire_reservations(integer) to service_role;

comment on table private.ai_quota_policies is
  'Server-managed quota policies. No active caps are seeded pending owner-approved numerical limits.';
comment on table private.ai_usage_reservations is
  'Minimal AI usage reservation ledger; never stores prompts, documents, images, API keys, or access tokens.';
