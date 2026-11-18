#!/usr/bin/env bash
set -euo pipefail

DB_URL="$DATABASE_URL"
TMP_DIR="$(mktemp -d)"
ORG_ID="eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee"
USER_A="11111111-1111-4111-8111-111111111111"
USER_B="22222222-2222-4222-8222-222222222222"
KEY_A="quota-concurrency-user-a"
KEY_B="quota-concurrency-user-b"

cleanup() {
  psql "$DB_URL" -Xq -v ON_ERROR_STOP=1 -c "
    delete from private.ai_usage_reservations
    where idempotency_key in ('$KEY_A', '$KEY_B');
    delete from private.ai_usage_buckets
    where subject_id in ('$ORG_ID', '$USER_A', '$USER_B');
    update private.ai_quota_policies
    set max_requests = null, max_tokens = null, enabled = false, updated_at = now()
    where scope = 'organization' and plan_key = 'free' and window_seconds = 86400;
  " >/dev/null 2>&1 || true
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT

psql "$DB_URL" -Xq -v ON_ERROR_STOP=1 -c "
  update private.ai_quota_policies
  set max_requests = 1, max_tokens = 10000, enabled = true, updated_at = now()
  where scope = 'organization' and plan_key = 'free' and window_seconds = 86400;
"

psql "$DB_URL" -XqAt -v ON_ERROR_STOP=1 -c "
  set role service_role;
  select allowed
  from private.ai_quota_reserve('$USER_A', '$ORG_ID', '$KEY_A', 100, 900);
" > "$TMP_DIR/a" &
PID_A=$!

psql "$DB_URL" -XqAt -v ON_ERROR_STOP=1 -c "
  set role service_role;
  select allowed
  from private.ai_quota_reserve('$USER_B', '$ORG_ID', '$KEY_B', 100, 900);
" > "$TMP_DIR/b" &
PID_B=$!

STATUS_A=0
STATUS_B=0
wait "$PID_A" || STATUS_A=$?
wait "$PID_B" || STATUS_B=$?

if [ "$STATUS_A" -ne 0 ] || [ "$STATUS_B" -ne 0 ]; then
  echo "A concurrent quota reservation SQL call failed."
  cat "$TMP_DIR/a" "$TMP_DIR/b"
  exit 1
fi

SUCCESS_COUNT="$(cat "$TMP_DIR/a" "$TMP_DIR/b" | grep -c '^t$' || true)"
DENIED_COUNT="$(cat "$TMP_DIR/a" "$TMP_DIR/b" | grep -c '^f$' || true)"

if [ "$SUCCESS_COUNT" -ne 1 ] || [ "$DENIED_COUNT" -ne 1 ]; then
  echo "Expected exactly one concurrent reservation to pass; got allowed=$SUCCESS_COUNT denied=$DENIED_COUNT."
  cat "$TMP_DIR/a" "$TMP_DIR/b"
  exit 1
fi

echo "PASS: concurrent requests sharing one organization quota cannot exceed the atomic request cap."
