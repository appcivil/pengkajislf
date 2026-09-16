/**
 * EDGE FUNCTION: keepalive
 * ---------------------------------------------------------------
 * Tujuan: menghasilkan AKTIVITAS DATABASE yang nyata (dan sekecil
 * mungkin) agar proyek Supabase Free tidak di-pause setelah 7 hari
 * tanpa aktivitas.
 *
 * Dipanggil oleh:
 *   1. GitHub Actions  → .github/workflows/supabase-keepalive.yml (tiap 2 hari)
 *   2. Aplikasi klien  → src/lib/keepalive.js (jalur cadangan)
 *   3. Scheduler eksternal apa pun (cron-job.org, n8n, UptimeRobot, dl.)
 *
 * Egress yang dihasilkan: < 1 KB per pemanggilan (satu baris kecil).
 *
 * Deploy:
 *   supabase functions deploy keepalive
 *
 * Uji manual:
 *   curl -i "https://<project-ref>.supabase.co/functions/v1/keepalive" \
 *        -H "Authorization: Bearer <ANON_KEY>"
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const KEEPALIVE_TABLE = 'keepalive_ping';
const FALLBACK_TABLE = 'proyek';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

const json = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { ...CORS_HEADERS, 'content-type': 'application/json; charset=utf-8' },
  });

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  const started = Date.now();

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  // Service role dipakai agar ping tetap berhasil walau RLS membatasi anon,
  // dan agar ping tetap tercatat sebagai aktivitas database.
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    ?? Deno.env.get('SUPABASE_ANON_KEY');

  if (!supabaseUrl || !serviceKey) {
    return json({ ok: false, error: 'Konfigurasi Supabase tidak tersedia di Edge Function' }, 500);
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // --- Ping 1: baca 1 baris dari tabel keepalive (query nyata ke Postgres) ---
  const read = await supabase
    .from(KEEPALIVE_TABLE)
    .select('id')
    .limit(1);

  if (!read.error) {
    // Catat ping supaya ada jejak (dan sekaligus aktivitas tulis).
    // Insert ini opsional: kalau gagal, ping baca di atas tetap sah.
    await supabase
      .from(KEEPALIVE_TABLE)
      .insert({ source: 'edge-function', created_at: new Date().toISOString() })
      .select('id')
      .limit(1)
      .then(() => undefined, () => undefined);

    return json({
      ok: true,
      via: 'keepalive_ping',
      rows: read.data?.length ?? 0,
      ms: Date.now() - started,
      ts: new Date().toISOString(),
    });
  }

  // --- Ping 2: tabel keepalive belum ada → pakai head count (0 byte baris) ---
  const head = await supabase
    .from(FALLBACK_TABLE)
    .select('id', { count: 'exact', head: true })
    .limit(1);

  if (!head.error) {
    return json({
      ok: true,
      via: `head:${FALLBACK_TABLE}`,
      count: head.count ?? null,
      note: `Tabel ${KEEPALIVE_TABLE} belum ada — jalankan migration 20260916_keepalive_and_indexes.sql`,
      ms: Date.now() - started,
      ts: new Date().toISOString(),
    });
  }

  return json({
    ok: false,
    error: read.error.message || head.error.message,
    hint: 'Pastikan migration keepalive sudah dijalankan atau ubah FALLBACK_TABLE.',
    ms: Date.now() - started,
  }, 500);
});
