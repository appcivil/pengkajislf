#!/usr/bin/env node
/**
 * check-bundle-secrets.mjs — gerbang PASCA-BUILD: memeriksa berkas hasil build.
 *
 * KENAPA ADA DUA GERBANG
 * ----------------------
 * `check-client-secrets.mjs` (prebuild) memeriksa ENVIRONMENT sebelum bundel
 * dibuat. Itu menangkap kunci yang terpasang sebagai variabel.
 *
 * Skrip ini memeriksa HASILNYA — berkas nyata di `dist/`. Bedanya penting:
 * ia juga menangkap kunci yang ditulis LANGSUNG di dalam kode (bukan lewat
 * environment), yang tidak akan pernah terlihat oleh gerbang prebuild.
 *
 * DASARNYA: VARIABEL VITE_ TIDAK DAPAT DISEMBUNYIKAN
 * --------------------------------------------------
 * Diuji dengan Vite 6 (lihat docs/DEEP-AUDIT-2026-09.md §2.5). Keempat pola
 * ini SEMUANYA membocorkan nilainya ke bundel produksi:
 *
 *     import.meta.env.VITE_KUNCI        → "nilai"
 *     const env = import.meta.env;
 *     env.VITE_KUNCI                    → "nilai"
 *     env['VITE_' + 'KUNCI']            → "nilai"   ← akses dinamis pun gagal
 *     { ...env }                        → seluruh objek env disalin
 *
 * Jadi tidak ada trik penamaan, alias, atau akses dinamis yang menolong.
 * Satu-satunya pertahanan yang benar-benar bekerja adalah memastikan kunci
 * TIDAK PERNAH ADA di lingkungan saat build. Skrip ini adalah jaring
 * pengaman terakhir untuk kalau-kalau ada yang lolos.
 *
 * Pemakaian:
 *   node scripts/check-bundle-secrets.mjs           # default: memeriksa dist/
 *   node scripts/check-bundle-secrets.mjs --dir out # direktori lain
 *   node scripts/check-bundle-secrets.mjs --allow   # hanya memperingatkan
 */

import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const argv = process.argv.slice(2);
const ALLOW = argv.includes('--allow');
const dirArg = argv.indexOf('--dir');
const ROOT = path.resolve(dirArg >= 0 && argv[dirArg + 1] ? argv[dirArg + 1] : 'dist');

/**
 * Pola kunci penyedia AI dan rahasia umum yang dikenal.
 * Ditulis sebagai {nama, pola, keterangan}. Setiap pola harus spesifik
 * supaya tidak memicu positif palsu pada bundel normal.
 */
const SIGNATURES = [
  ['Google / Gemini API key', /AIza[0-9A-Za-z_\-]{30,}/g],
  ['OpenAI API key',          /sk-(?:proj-)?[A-Za-z0-9_\-]{32,}/g],
  ['Anthropic API key',       /sk-ant-[A-Za-z0-9_\-]{20,}/g],
  ['OpenRouter API key',      /sk-or-v1-[a-f0-9]{32,}/g],
  ['Groq API key',            /gsk_[A-Za-z0-9]{40,}/g],
  ['HuggingFace token',       /hf_[A-Za-z0-9]{30,}/g],
  // Kunci Mistral tidak punya awalan yang khas (32 karakter alfanumerik),
  // sehingga pola apa pun akan memicu positif palsu pada bundel minifikasi
  // (hash, id, nama variabel pendek). Sengaja tidak dipakai: gerbang yang
  // sering salah akan diabaikan orang, dan itu lebih buruk daripada tidak ada.
  // Cakupannya diambil alih pemeriksaan nama variabel di gerbang prebuild.
  ['Supabase service role',   /service_role/],
  ['Private key',             /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
  ['AWS access key',          /AKIA[0-9A-Z]{16}/g],
];

/**
 * Nilai yang memang boleh ada di bundel. Anon key Supabase dirancang untuk
 * dipakai peramban dan dilindungi RLS, jadi keberadaannya normal.
 */
const BENIGN = [
  /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[A-Za-z0-9_\-]{10,}\.[A-Za-z0-9_\-]{20,}/g, // JWT (anon key)
];

function walk(dir, acc = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (/\.(m?js|cjs|css|html|json|map)$/.test(e.name)) acc.push(p);
  }
  return acc;
}

if (!existsSync(ROOT)) {
  console.error(`\n❌ check-bundle-secrets: direktori tidak ada — ${path.relative(process.cwd(), ROOT)}`);
  console.error('   Jalankan `npm run build` lebih dulu.\n');
  process.exit(1);
}

const files = walk(ROOT);
const findings = [];

for (const file of files) {
  let text;
  try { text = readFileSync(file, 'utf8'); } catch { continue; }

  // Bersihkan nilai yang memang publik sebelum mencocokkan.
  let scrubbed = text;
  for (const b of BENIGN) scrubbed = scrubbed.replace(b, '«JWT-PUBLIK»');

  for (const [name, pattern] of SIGNATURES) {
    const re = new RegExp(pattern.source, pattern.flags.includes('g') ? 'g' : 'g');
    let m;
    while ((m = re.exec(scrubbed)) !== null) {
      findings.push({
        file: path.relative(process.cwd(), file),
        name,
        sample: m[0].slice(0, 8) + '…' + m[0].slice(-4),
        size: statSync(file).size,
      });
      if (findings.length > 50) break;
    }
  }
}

const unique = [...new Map(findings.map(f => [`${f.file}|${f.name}|${f.sample}`, f])).values()];

console.log(`\n  Memeriksa ${files.length} berkas hasil build di ${path.relative(process.cwd(), ROOT)}…`);

if (!unique.length) {
  console.log('  ✅ Tidak ada kunci/rahasia yang ditemukan di dalam bundel.\n');
  process.exit(0);
}

console.error(`\n❌ RAHASIA DITEMUKAN DI DALAM BUNDEL (${unique.length} temuan)\n`);
for (const f of unique) {
  console.error(`   ${f.name}`);
  console.error(`     berkas : ${f.file}`);
  console.error(`     contoh : ${f.sample}\n`);
}
console.error(`   Bundel ini AKAN TERBIT apa adanya ke internet. Siapa pun yang membuka
   situs lalu menekan F12 dapat menyalin nilai di atas dan memakainya atas
   biaya pemilik proyek.

   Cara memperbaiki:
     1. Hapus variabel kunci dari environment build, atau
     2. pindahkan pemakaiannya ke Edge Function (mis. ai-proxy) dan kirim
        lewat VITE_AI_PROXY_URL.
     3. ROTASI kunci yang sudah terlanjur ada di bundel — anggap bocor.

   Periksa juga bahwa kunci tidak ditulis LANGSUNG di dalam berkas sumber:
     grep -rn "sk-\\|AIza\\|gsk_\\|hf_" src/

   Untuk melewati pemeriksaan ini sekali (tidak disarankan): --allow
`);

process.exit(ALLOW ? 0 : 1);
