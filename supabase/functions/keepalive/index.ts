/**
 * Scheduler-only keepalive endpoint.
 * Gateway JWT remains enabled; application auth additionally requires
 * x-keepalive-secret. Never expose this secret to browser code.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const json = (payload: unknown, status = 200) => new Response(JSON.stringify(payload), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
});

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return json({ ok: false, error: 'Method not allowed' }, 405);

  const expected = Deno.env.get('KEEPALIVE_SECRET') || '';
  const supplied = req.headers.get('x-keepalive-secret') || '';
  if (!expected || !supplied || !constantTimeEqual(supplied, expected)) {
    return json({ ok: false, error: 'Unauthorized scheduler' }, 401);
  }

  const url = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !serviceRoleKey) return json({ ok: false, error: 'Server configuration incomplete' }, 500);

  // One fixed, bounded database write only after scheduler authentication.
  const db = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await db.from('keepalive_ping')
    .insert({ source: 'trusted-scheduler' }).select('id').single();

  if (error) return json({ ok: false, error: 'Database keepalive write failed' }, 503);

  // Best-effort retention; do not fail a successful ping if cleanup is unavailable.
  await db.rpc('keepalive_prune').then(() => undefined, () => undefined);
  return json({ ok: true, via: 'keepalive_ping', id: data.id, ts: new Date().toISOString() });
});
