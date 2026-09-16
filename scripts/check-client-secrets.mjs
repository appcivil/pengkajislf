#!/usr/bin/env node
/**
 * check-client-secrets.mjs — gerbang pra-build: cegah rahasia ikut ke bundel.
 *
 * MASALAH YANG DICEGAH
 * --------------------
 * Vite mengganti setiap `import.meta.env.VITE_*` menjadi NILAI TEKS BIASA di
 * dalam berkas JS hasil build. Artinya:
 *
 *     # .env
 *     VITE_GEMINI_API_KEY=AIza...            ← ada di .env saat build
 *
 * akan menghasilkan bundel yang memuat "AIza..." apa adanya. Siapa pun dapat
 * membukanya lewat DevTools dan memakainya atas biaya pemilik proyek.
 * Kunci tidak bisa "disembunyikan" di dalam kode klien — memang tidak ada
 * mekanismenya.
 *
 * Karena itu skrip ini memeriksa environment SEBELUM bundel dibuat, dan
 * MENGGAGALKAN build bila menemukan rahasia dengan awalan VITE_ yang
 * seharusnya hanya ada di sisi server (variabel yang namanya berakhiran
 * _API_KEY / _SECRET / _TOKEN / _PRIVATE / _SERVICE_ROLE).
 *
 * Pemakaian:
 *   node scripts/check-client-secrets.mjs            # memeriksa lingkungan
 *   node scripts/check-client-secrets.mjs --allow    # hanya memperingatkan
 *
 * Sudah terpasang otomatis sebagai `prebuild`, jadi `npm run build` selalu
 * melewatinya.
 */

import { readFileSync, existsSync } from 'node:fs';
import process from 'node:process';

const ALLOW = process.argv.includes('--allow');

/** Nama variabel yang menandakan rahasia bila berawalan VITE_. */
const SECRET_SUFFIX = /_(API_?KEY|SECRET|TOKEN|PRIVATE|SERVICE_ROLE(_KEY)?|WEBHOOK(_URL)?)$/i;

/**
 * Variabel yang MEMANG boleh ada di klien.
 * Nilai ini tidak berbahaya bila terbit: anon key Supabase dirancang untuk
 * dipakai peramban dan dilindungi RLS, sedangkan URL/ID bersifat publik.
 */
const ALLOWLIST = new Set([
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'VITE_SUPABASE_PROJECT_REF',
  'VITE_AI_PROXY_URL',
  'VITE_APP_URL',
  'VITE_APP_NAME',
  'VITE_APP_VERSION',
  'VITE_GA_ID',
  'VITE_SENTRY_DSN',
  // Kunci API Google Cloud untuk pemakaian peramban (Places, Maps, Drive
  // Picker). Kunci jenis ini MEMANG dirancang terbit — perlindungannya bukan
  // kerahasiaan, melainkan pembatasan HTTP referrer dan kuota di Google Cloud
  // Console. Karena itu ia diizinkan di sini, DENGAN SYARAT sudah dibatasi.
  // Bila belum: Application restrictions → HTTP referrers → domain Anda.
  'VITE_GCP_API_KEY',
]);

/** Bacakan `.env` bila ada, sebagai pelengkap environment proses. */
function readDotEnv(path) {
  const out = {};
  if (!existsSync(path)) return out;
  for (const raw of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq < 1) continue;
    const name = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    out[name] = value;
  }
  return out;
}

const env = { ...readDotEnv('.env'), ...readDotEnv('.env.production'), ...process.env };

const violations = [];
for (const [name, value] of Object.entries(env)) {
  if (!name.startsWith('VITE_')) continue;
  if (!value) continue;
  if (ALLOWLIST.has(name)) continue;
  if (SECRET_SUFFIX.test(name)) {
    violations.push({ name, reason: 'rahasia server terpasang dengan awalan VITE_ — akan ter-inline ke bundel' });
  }
}

// Nilai yang kelihatannya token panjang pada variabel VITE_ yang tidak dikenal
// juga diperiksa: kunci AI biasanya ≥ 30 karakter tanpa spasi.
for (const [name, value] of Object.entries(env)) {
  if (!name.startsWith('VITE_') || ALLOWLIST.has(name) || !value) continue;
  if (violations.some(v => v.name === name)) continue;
  if (typeof value === 'string' && value.length >= 30 && !/\s/.test(value) &&
      /^[A-Za-z0-9_\-.]{30,}$/.test(value)) {
    violations.push({ name, reason: 'panjang & berpola seperti token pada variabel VITE_ yang tidak dikenal' });
  }
}

if (!violations.length) {
  console.log('✅ check-client-secrets: tidak ada rahasia yang akan ter-inline ke bundel klien.');
  process.exit(0);
}

console.error('\n❌ RAHASIA AKAN IKUT KE BUNDEL KLIEN\n');
for (const v of violations) console.error(`   ${v.name}  —  ${v.reason}`);
console.error(`
   Setiap variabel berawalan VITE_ akan DISALIN sebagai teks biasa ke dalam
   berkas JS publik saat build, sehingga dapat dibaca siapa pun lewat DevTools.

   Cara memperbaiki:
     1. Hapus variabel tersebut dari .env / environment build.
     2. Simpan kuncinya sebagai secret sisi server — untuk Supabase:
          supabase secrets set GEMINI_API_KEY=... OPENROUTER_API_KEY=... KIMI_API_KEY=...
     3. Isi VITE_AI_PROXY_URL ke URL Edge Function ai-proxy, yaitu satu-satunya
        variabel VITE_ yang memang boleh diketahui peramban.
     4. ROTASI kunci lama: kunci yang pernah ikut ke bundel harus dianggap bocor.

   Untuk melewati pemeriksaan ini sekali (tidak disarankan):
     node scripts/check-client-secrets.mjs --allow
`);

process.exit(ALLOW ? 0 : 1);
