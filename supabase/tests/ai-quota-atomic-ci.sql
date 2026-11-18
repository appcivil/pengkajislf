-- Atomic AI quota ledger integration tests.
-- Executed only in the disposable local Supabase CI database.

begin;

do $privileges$
begin
  if not has_schema_privilege('authenticated', 'private', 'USAGE') then
    raise exception 'authenticated must retain private schema usage for tenant RLS helpers';
  end if;
  if has_table_privilege('authenticated', 'private.ai_quota_policies', 'SELECT')
     or has_table_privilege('authenticated', 'private.ai_usage_buckets', 'SELECT')
     or has_table_privilege('authenticated', 'private.ai_usage_reservations', 'SELECT')
     or has_table_privilege('anon', 'private.ai_usage_reservations', 'SELECT')
     or has_table_privilege('service_role', 'private.ai_usage_reservations', 'SELECT') then
    raise exception 'quota ledger tables must not be directly readable by client or service role';
  end if;
  if has_function_privilege('authenticated', 'public.ai_quota_reserve(uuid,uuid,text,integer,integer)', 'EXECUTE')
     or has_function_privilege('anon', 'public.ai_quota_reserve(uuid,uuid,text,integer,integer)', 'EXECUTE') then
    raise exception 'private quota reservation RPC must be service_role-only';
  end if;
  if has_function_privilege('authenticated', 'public.ai_quota_reserve(uuid,uuid,text,integer,integer)', 'EXECUTE')
     or has_function_privilege('anon', 'public.ai_quota_reserve(uuid,uuid,text,integer,integer)', 'EXECUTE')
     or not has_function_privilege('service_role', 'public.ai_quota_reserve(uuid,uuid,text,integer,integer)', 'EXECUTE')
     or has_function_privilege('authenticated', 'public.ai_quota_finalize(uuid,integer)', 'EXECUTE')
     or has_function_privilege('anon', 'public.ai_quota_finalize(uuid,integer)', 'EXECUTE')
     or not has_function_privilege('service_role', 'public.ai_quota_finalize(uuid,integer)', 'EXECUTE')
     or has_function_privilege('authenticated', 'public.ai_quota_release(uuid)', 'EXECUTE')
     or has_function_privilege('anon', 'public.ai_quota_release(uuid)', 'EXECUTE')
     or not has_function_privilege('service_role', 'public.ai_quota_release(uuid)', 'EXECUTE') then
    raise exception 'public quota gateway must be executable only by service_role';
  end if;
end;
$privileges$;

insert into private.ai_quota_policies
  (scope, plan_key, window_seconds, max_requests, max_tokens, enabled)
values
  ('user', 'free', 86400, 5, 1000, true),
  ('organization', 'free', 86400, 2, 1500, true)
on conflict (scope, plan_key, window_seconds) do update
set max_requests = excluded.max_requests,
    max_tokens = excluded.max_tokens,
    enabled = true;

set local role service_role;

do $$
declare
  v_first record;
  v_duplicate record;
  v_second_user record;
  v_denied_org record;
  v_denied_user record;
  v_after_finalize record;
  v_after_release record;
  v_expiring record;
  v_org_b_first record;
  v_org_b_second record;
  v_org_b_denied record;
  v_user_a uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  v_user_b uuid := 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  v_user_c uuid := 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
  v_org uuid := 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
  v_org_b uuid := 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
begin
  select * into v_first
  from public.ai_quota_reserve(v_user_a, v_org, 'quota-test-user-a-1', 600, 900);
  if not v_first.allowed then raise exception 'first reservation should be allowed: %', v_first.reason; end if;

  select * into v_duplicate
  from public.ai_quota_reserve(v_user_a, v_org, 'quota-test-user-a-1', 600, 900);
  if not v_duplicate.allowed or v_duplicate.reservation_id <> v_first.reservation_id then
    raise exception 'same idempotency key must return the same reservation';
  end if;

  select * into v_second_user
  from public.ai_quota_reserve(v_user_b, v_org, 'quota-test-user-b-1', 600, 900);
  if not v_second_user.allowed then raise exception 'second tenant member should be allowed: %', v_second_user.reason; end if;

  select * into v_denied_org
  from public.ai_quota_reserve(v_user_c, v_org, 'quota-test-user-c-1', 100, 900);
  if v_denied_org.allowed or v_denied_org.reason <> 'request_quota_exceeded' then
    raise exception 'shared organization request cap must reject third request';
  end if;

  -- A full quota in organization A must not consume organization B capacity.
  select * into v_org_b_first
  from public.ai_quota_reserve(v_user_c, v_org_b, 'quota-test-user-c-org-b-1', 100, 900);
  if not v_org_b_first.allowed then
    raise exception 'organization B must have independent quota capacity: %', v_org_b_first.reason;
  end if;
  select * into v_org_b_second
  from public.ai_quota_reserve(v_user_c, v_org_b, 'quota-test-user-c-org-b-2', 100, 900);
  if not v_org_b_second.allowed then
    raise exception 'organization B second request should fit its own quota: %', v_org_b_second.reason;
  end if;
  select * into v_org_b_denied
  from public.ai_quota_reserve(v_user_c, v_org_b, 'quota-test-user-c-org-b-3', 100, 900);
  if v_org_b_denied.allowed or v_org_b_denied.reason <> 'request_quota_exceeded' then
    raise exception 'organization B must enforce its own independent request cap';
  end if;
  if not public.ai_quota_release(v_org_b_first.reservation_id)
     or not public.ai_quota_release(v_org_b_second.reservation_id) then
    raise exception 'organization B test reservations should release cleanly';
  end if;

  select * into v_denied_user
  from public.ai_quota_reserve(v_user_a, null, 'quota-test-user-a-2', 500, 900);
  if v_denied_user.allowed or v_denied_user.reason <> 'token_quota_exceeded' then
    raise exception 'user token cap must include outstanding reservations';
  end if;

  if not public.ai_quota_finalize(v_first.reservation_id, 550) then
    raise exception 'first finalization should succeed';
  end if;
  if not public.ai_quota_finalize(v_first.reservation_id, 550) then
    raise exception 'repeated finalization should be idempotent';
  end if;
  if public.ai_quota_finalize(v_first.reservation_id, 551) then
    raise exception 'conflicting repeated finalization must be rejected';
  end if;

  select * into v_after_finalize
  from public.ai_quota_reserve(v_user_a, null, 'quota-test-user-a-3', 400, 900);
  if not v_after_finalize.allowed then
    raise exception 'finalized actual usage should replace reservation amount: %', v_after_finalize.reason;
  end if;

  select * into v_expiring
  from public.ai_quota_reserve(v_user_c, null, 'quota-test-user-c-expire', 100, 900);
  if not v_expiring.allowed then
    raise exception 'expiry fixture reservation should be allowed';
  end if;

  if not public.ai_quota_release(v_second_user.reservation_id) then
    raise exception 'release should succeed';
  end if;
  if not public.ai_quota_release(v_second_user.reservation_id) then
    raise exception 'repeated release should be idempotent';
  end if;

  -- A pre-provider release must restore the organization request slot.
  select * into v_after_release
  from public.ai_quota_reserve(v_user_b, v_org, 'quota-test-user-b-after-release', 100, 900);
  if not v_after_release.allowed then
    raise exception 'released pre-provider reservation must restore quota capacity: %', v_after_release.reason;
  end if;
  if not public.ai_quota_release(v_after_release.reservation_id) then
    raise exception 'follow-up reservation release should succeed';
  end if;
end;
$$;

reset role;

do $accounting$
begin
  if not exists (
    select 1 from private.ai_usage_buckets b
    where b.scope = 'user'
      and b.subject_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
      and b.window_seconds in (60, 3600, 2592000)
      and b.used_requests >= 1
      and b.used_tokens >= 550
  ) then
    raise exception 'disabled accounting windows must still record actual usage';
  end if;
end;
$accounting$;

update private.ai_usage_reservations
set expires_at = now() - interval '1 minute'
where idempotency_key = 'quota-test-user-c-expire';

set local role service_role;
do $quota_expire$
declare
  v_expired integer;
begin
  v_expired := public.ai_quota_expire_reservations(50);
  if v_expired < 1 then raise exception 'expired reservation should be released'; end if;

  -- Expired idempotency keys remain consumed and cannot create a fresh reservation.
  if exists (
    select 1 from public.ai_quota_reserve(
      'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
      null,
      'quota-test-user-c-expire',
      100,
      900
    ) q where q.allowed
  ) then
    raise exception 'expired idempotency key must not create a new reservation';
  end if;
end;
$quota_expire$;
reset role;

delete from private.ai_usage_reservations
where idempotency_key like 'quota-test-user-%';
delete from private.ai_usage_buckets
where subject_id in (
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
  'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'
);
update private.ai_quota_policies
set max_requests = null, max_tokens = null, enabled = false, updated_at = now()
where plan_key = 'free' and scope in ('user', 'organization') and window_seconds = 86400;

commit;
