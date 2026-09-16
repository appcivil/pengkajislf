#!/usr/bin/env node
/**
 * ============================================================
 *  KEEPALIVE STANDALONE (tanpa dependensi)
 *
 *  Mengirim satu query kecil ke Supabase agar proyek Free tidak
 *  di-pause setelah 7 hari tanpa aktivitas database.
 *
 *  Bisa dijalankan oleh scheduler apa pun:
 *    - cron (Linux/macOS)     : 0 3,15 * * *  → 2x sehari
 *    - Task Scheduler Windows : harian / 2 harian
 *    - cron-job.org / n8n / GitHub Actions
 *
 *  Pemakaian:
 *    node scripts/keepalive.mjs                 # baca .env otomatis
 *    node scripts/keepalive.mjs --force         # abaikan throttle
 *    node scripts/keepalive.mjs --verbose       # tampilkan detail
 *    node scripts/keepalive.mjs --all           # semua target di keepalive.targets.json
 *
 *  Konfigurasi (via .env atau environment variable):
 *    VITE_SUPABASE_URL=https://xxxx.supabase.co
 *    VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
 *
 *  Untuk beberapa proyek sekaligus, buat keepalive.targets.json:
 *    [{ "name": "SLF Prod", "url": "https://a.supabase.co", "key": "eyJ..." }]
 *
 *  Egress per ping: < 1 KB.
 * ============================================================
 */

import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const ROOT = path.resolve(import.meta.dirname, '..');
const ANON_KEY_HEADER = 'apikey';

const args = process.argv.slice(2);
const hasFlag = (f) => args.includes(f);
const VERBOSE = hasFlag('--verbose') || hasFlag('-v');
const ALL = hasFlag('--all');

/** Baca .env sederhana (tanpa dotenv). */
async function loadEnvFile(file = path.join(ROOT, '.env')) {
  const env = {};
  if (!existsSync(file)) return env;
  const raw = await readFile(file, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

/** Ambil daftar target: dari keepalive.targets.json atau environment. */
async function resolveTargets(env) {
  if (ALL) {
    const file = path.join(ROOT, 'keepalive.targets.json');
    if (!existsSync(file)) {
      console.error('❌ --all dipakai tetapi keepalive.targets.json tidak ditemukan.');
      process.exit(1);
    }
    const list = JSON.parse(await readFile(file, 'utf8'));
    return list.map((t) => ({ name: t.name || t.url, url: t.url, key: t.key }));
  }

  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || env.VITE_SUPABASE_URL || env.SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY
    || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
    || process.env.SUPABASE_ANON_KEY
    || env.VITE_SUPABASE_ANON_KEY
    || env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
    || env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.error('❌ VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY tidak ditemukan di .env atau environment.');
    console.error('   Buat file .env (lihat .env.example) atau isi environment variable.');
    process.exit(1);
  }
  return [{ name: 'default', url, key }];
}

/** Ping satu target. Mengembalikan {ok, bytes, via, ms}. */
async function ping(target) {
  const started = Date.now();
  const base = target.url.replace(/\/+$/, '');
  const bust = `${Date.now()}${Math.floor(Math.random() * 1e6)}`;

  const attempts = [
    {
      via: 'rest:keepalive_ping',
      url: `${base}/rest/v1/keepalive_ping?select=id&limit=1&_cb=${bust}`,
      init: { method: 'GET' },
    },
    {
      via: 'rest:head-proyek',
      url: `${base}/rest/v1/proyek?select=id&limit=1&_cb=${bust}`,
      init: { method: 'HEAD', headers: { Prefer: 'count=exact' } },
    },
    {
      via: 'edge:keepalive',
      url: `${base}/functions/v1/keepalive?cb=${bust}`,
      init: { method: 'POST', body: '{}' },
    },
  ];

  const headers = {
    [ANON_KEY_HEADER]: target.key,
    Authorization: `Bearer ${target.key}`,
    Accept: 'application/json',
    'Cache-Control': 'no-cache',
    'Content-Type': 'application/json',
  };

  for (const attempt of attempts) {
    try {
      const res = await fetch(attempt.url, {
        ...attempt.init,
        headers: { ...headers, ...(attempt.init.headers || {}) },
        signal: AbortSignal.timeout(30000),
      });

      // Ukur byte yang benar-benar diterima (menunjukkan biaya egress ping)
      let bytes = 0;
      try {
        const text = await res.text();
        bytes = Buffer.byteLength(text, 'utf8');
      } catch (_) { bytes = 0; }

      if (res.ok) {
        return { ok: true, via: attempt.via, status: res.status, bytes, ms: Date.now() - started };
      }

      if (VERBOSE) {
        console.warn(`   ↳ ${attempt.via} → HTTP ${res.status}`);
      }
    } catch (err) {
      if (VERBOSE) console.warn(`   ↳ ${attempt.via} → ${err?.message}`);
    }
  }

  return { ok: false, via: 'none', status: 0, bytes: 0, ms: Date.now() - started };
}

async function main() {
  const env = await loadEnvFile();
  const targets = await resolveTargets(env);
  const intervalHours = Number(process.env.KEEPALIVE_INTERVAL_HOURS || 48);
  const force = hasFlag('--force');

  // Throttle lokal (berkas cap waktu) supaya cron yang jalan terlalu sering
  // tidak menambah egress tanpa guna.
  const stampFile = path.join(ROOT, '.keepalive-stamp');
  if (!force && existsSync(stampFile)) {
    const last = Number((await readFile(stampFile, 'utf8')).trim()) || 0;
    const ageHours = (Date.now() - last) / 3600000;
    if (ageHours < intervalHours) {
      console.log(`⏭️  Dilewati — ping terakhir ${ageHours.toFixed(1)} jam lalu (interval ${intervalHours} jam).`);
      console.log('   Gunakan --force untuk memaksa.');
      return;
    }
  }

  console.log(`🫀 Keepalive Supabase — ${new Date().toISOString()}`);

  let allOk = true;
  for (const target of targets) {
    const res = await ping(target);
    if (res.ok) {
      console.log(`   ✅ ${target.name}: OK via ${res.via} — HTTP ${res.status}, ${res.bytes} byte, ${res.ms} ms`);
    } else {
      allOk = false;
      console.error(`   ❌ ${target.name}: SEMUA jalur ping gagal.`);
      console.error('      Proyek mungkin sedang di-pause → buka dashboard Supabase untuk restore.');
    }
  }

  if (allOk) {
    const { writeFile } = await import('node:fs/promises');
    await writeFile(stampFile, String(Date.now()), 'utf8');
    const est = targets.length * 0.5;
    console.log(`\n💡 Egress ping ini sangat kecil (± ${est.toFixed(1)} KB). Kuota Free: 5 GB uncached/bulan.`);
    process.exit(0);
  }

  process.exit(1);
}

main().catch((err) => {
  console.error('Keepalive error:', err);
  process.exit(1);
});
