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
 * CARA MENDETEKSI — DAN SATU KESALAHAN YANG PERNAH TERJADI
 * -------------------------------------------------------
 * Versi pertama skrip ini punya dua pemeriksaan:
 *   (1) NAMA variabel berakhiran rahasia   → tepat
 *   (2) NILAI apa pun yang panjang dan "berpola token" pada variabel VITE_
 *       yang tidak dikenal                 → terlalu luas
 *
 * Pemeriksaan (2) pernah MENGGAGALKAN SELURUH DEPLOY. Nilai seperti ID Google
 * Docs (1AbCdEf…) dan OAuth Client ID (123456-abc.apps.googleusercontent.com)
 * memang panjang dan tanpa spasi, tetapi KEDUANYA BUKAN RAHASIA — keduanya
 * memang terbit di peramban; yang melindungi adalah pembatasan referrer dan
 * daftar origin yang diizinkan di Google Cloud Console. Deploy GitHub Pages
 * berhenti di langkah Build selama dua kali push karena keduanya dianggap
 * "rahasia", padahal tidak ada yang bocor.
 *
 * Karena itu pemeriksaan (2) diganti: yang dicocokkan adalah BENTUK KUNCI yang
 * benar-benar dikenali (AIza… untuk Google, sk-… untuk OpenAI/OpenRouter,
 * ghp_… untuk GitHub, dst), bukan sekadar "panjang dan mencurigakan".
 * Ditambah pemeriksaan JWT: bila sebuah variabel berisi JWT dengan klaim
 * `role: "service_role"`, itu selalu pelanggaran — bahkan bila namanya adalah
 * VITE_SUPABASE_ANON_KEY yang ada di daftar izin, karena isinya kunci master
 * yang menembus RLS.
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

/**
 * Bentuk kunci rahasia yang dikenali dari NILAI-nya.
 *
 * Sengaja tidak memakai aturan "panjang dan tanpa spasi" seperti versi pertama
 * — aturan itu menandai ID dokumen dan Client ID yang bukan rahasia, lalu
 * menggagalkan deploy. Pola di bawah ini khas milik penyedia masing-masing dan
 * tidak akan cocok dengan identifier publik biasa.
 */
const SECRET_VALUE_PATTERNS = [
  [/^AIza[0-9A-Za-z_-]{30,}$/,                'kunci Google API (Gemini / Cloud)'],
  [/^sk-[A-Za-z0-9_-]{16,}$/,                 'kunci OpenAI / OpenRouter'],
  [/^gh[pousr]_[A-Za-z0-9]{20,}$/,            'token akses GitHub'],
  [/^github_pat_[A-Za-z0-9_]{20,}$/,          'token GitHub (fine-grained)'],
  [/^xox[baprs]-[A-Za-z0-9-]{10,}$/,          'token Slack'],
  [/^sbp_[A-Za-z0-9]{20,}$/,                  'Personal Access Token Supabase'],
  [/^AKIA[0-9A-Z]{16}$/,                      'kunci AWS'],
  [/^glpat-[A-Za-z0-9_-]{15,}$/,               'token GitLab'],
  [/^-----BEGIN [A-Z ]*PRIVATE KEY-----/,     'kunci privat'],
  [/^sk_live_[A-Za-z0-9]{16,}$/,              'kunci rahasia Stripe'],
];

for (const [name, value] of Object.entries(env)) {
  if (!name.startsWith('VITE_') || !value || typeof value !== 'string') continue;
  if (violations.some(v => v.name === name)) continue;
  // Daftar izin tetap berlaku di sini — tetapi hanya untuk variabel yang
  // memang sudah ditinjau dan didokumentasikan alasannya (lihat ALLOWLIST).
  //
  // Contoh yang penting: VITE_GCP_API_KEY berbentuk seperti kunci Google
  // (AIza…) dan memang ISINYA kunci Google — hanya saja kunci itu dirancang
  // untuk terbit di peramban, dengan perlindungan berupa pembatasan referrer.
  // Karena itu ia ada di daftar izin; bila suatu saat entri itu dihapus, tes
  // di scripts/check-client-secrets.test.js akan gagal dan memaksa peninjauan
  // ulang. Untuk JWT service_role di bawah, daftar izin TIDAK berlaku.
  if (ALLOWLIST.has(name)) continue;
  for (const [re, reason] of SECRET_VALUE_PATTERNS) {
    if (re.test(value)) { violations.push({ name, reason }); break; }
  }
}

/**
 * Klaim `role` di dalam JWT, bila nilainya memang JWT.
 *
 * Kunci Supabase berbentuk JWT. Kunci `anon` memang untuk peramban; kunci
 * `service_role` menembus seluruh RLS dan TIDAK BOLEH ada di klien. Keduanya
 * sulit dibedakan dari bentuk luarnya, jadi klaimnya dibaca langsung.
 */
function jwtRole(value) {
  const m = /^eyJ[A-Za-z0-9_-]+\.([A-Za-z0-9_-]+)\./.exec(value);
  if (!m) return null;
  try {
    const b64 = m[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64.padEnd(Math.ceil(b64.length / 4) * 4, '=');
    return JSON.parse(Buffer.from(padded, 'base64').toString('utf8')).role ?? null;
  } catch {
    return null;
  }
}

// JWT service_role selalu pelanggaran — walau namanya ada di daftar izin.
// Kasus paling berbahaya: kunci master tertempel pada variabel bernama
// VITE_SUPABASE_ANON_KEY, sehingga tampak aman dari namanya saja.
for (const [name, value] of Object.entries(env)) {
  if (!name.startsWith('VITE_') || !value || typeof value !== 'string') continue;
  if (jwtRole(value) === 'service_role') {
    violations.push({
      name,
      reason: 'berisi JWT dengan klaim role="service_role" — kunci ini menembus RLS dan wajib hanya ada di sisi server',
    });
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
