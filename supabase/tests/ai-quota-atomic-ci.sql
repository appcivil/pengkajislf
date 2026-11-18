-- Atomic AI quota ledger integration tests.
-- Executed only in the disposable local Supabase CI database.

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
  v_user_a uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  v_user_b uuid := 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  v_user_c uuid := 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
  v_org uuid := 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
begin
  select * into v_first
  from private.ai_quota_reserve(v_user_a, v_org, 'quota-test-user-a-1', 600, 900);
  if not v_first.allowed then raise exception 'first reservation should be allowed: %', v_first.reason; end if;

  select * into v_duplicate
  from private.ai_quota_reserve(v_user_a, v_org, 'quota-test-user-a-1', 600, 900);
  if not v_duplicate.allowed or v_duplicate.reservation_id <> v_first.reservation_id then
    raise exception 'same idempotency key must return the same reservation';
  end if;

  select * into v_second_user
  from private.ai_quota_reserve(v_user_b, v_org, 'quota-test-user-b-1', 600, 900);
  if not v_second_user.allowed then raise exception 'second tenant member should be allowed: %', v_second_user.reason; end if;

  select * into v_denied_org
  from private.ai_quota_reserve(v_user_c, v_org, 'quota-test-user-c-1', 100, 900);
  if v_denied_org.allowed or v_denied_org.reason <> 'request_quota_exceeded' then
    raise exception 'shared organization request cap must reject third request';
  end if;

  select * into v_denied_user
  from private.ai_quota_reserve(v_user_a, null, 'quota-test-user-a-2', 500, 900);
  if v_denied_user.allowed or v_denied_user.reason <> 'token_quota_exceeded' then
    raise exception 'user token cap must include outstanding reservations';
  end if;

  if not private.ai_quota_finalize(v_first.reservation_id, 550) then
    raise exception 'first finalization should succeed';
  end if;
  if not private.ai_quota_finalize(v_first.reservation_id, 550) then
    raise exception 'repeated finalization should be idempotent';
  end if;

  select * into v_after_finalize
  from private.ai_quota_reserve(v_user_a, null, 'quota-test-user-a-3', 400, 900);
  if not v_after_finalize.allowed then
    raise exception 'finalized actual usage should replace reservation amount: %', v_after_finalize.reason;
  end if;

  if not private.ai_quota_release(v_second_user.reservation_id) then
    raise exception 'release should succeed';
  end if;
  if not private.ai_quota_release(v_second_user.reservation_id) then
    raise exception 'repeated release should be idempotent';
  end if;
end;
$$;

reset role;

delete from private.ai_usage_reservations
where idempotency_key like 'quota-test-user-%';
delete from private.ai_usage_buckets
where subject_id in (
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  'dddddddd-dddd-4ddd-8ddd-dddddddddddd'
);
delete from private.ai_quota_policies
where plan_key = 'free' and scope in ('user', 'organization') and window_seconds = 86400;
