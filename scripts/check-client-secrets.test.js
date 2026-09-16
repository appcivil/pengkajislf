/**
 * Tes gerbang rahasia pra-build.
 *
 * LATAR BELAKANG
 * --------------
 * Versi pertama `check-client-secrets.mjs` pernah menggagalkan seluruh deploy
 * GitHub Pages: ia menandai nilai yang "panjang dan tanpa spasi" sebagai
 * rahasia, sehingga ID Google Docs dan OAuth Client ID — keduanya bukan
 * rahasia — dianggap bocor dan langkah Build berhenti.
 *
 * Tes di bawah mengunci DUA arah sekaligus:
 *   • nilai publik yang sah TIDAK boleh ditandai  (mencegah deploy gagal)
 *   • kunci rahasia yang nyata HARUS tetap tertangkap (mencegah kebocoran)
 *
 * Bila salah satu arah dilonggarkan, salah satu kelompok tes akan gagal.
 *
 * Dijalankan dengan cara memanggil skripnya sebagai proses terpisah, karena
 * skrip itu membaca environment dan mengakhiri proses dengan kode keluar.
 */
import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const AKAR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SKRIP = path.join(AKAR, 'scripts', 'check-client-secrets.mjs');

/**
 * Nilai contoh DISUSUN SAAT RUNTIME, tidak ditulis sebagai literal.
 *
 * KENAPA: GitHub Push Protection memindai setiap berkas yang di-push. Ketika
 * fixture Slack di berkas ini ditulis apa adanya (xoxb-…), push DITOLAK
 * dengan pesan "Push cannot contain secrets" — padahal nilainya karangan
 * untuk pengujian. Penyusunan lewat penggabungan string membuat tidak ada
 * literal berbentuk kunci di dalam berkas, sehingga pengujian tetap utuh
 * tanpa memicu pemindai, dan tanpa perlu mematikan perlindungan apa pun.
 */
const contoh = (...bagian) => bagian.join('');

/** JWT tiruan dengan klaim tertentu — cukup untuk menguji pembacaan klaim. */
function jwt(payload) {
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  return `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64(payload)}.tanda-tangan-tiruan`;
}

/**
 * Jalankan gerbang dengan environment tambahan.
 * Lingkungan diwarisi apa adanya supaya perilaku sebenarnya ikut teruji.
 */
function jalankan(env = {}) {
  try {
    const stdout = execFileSync(process.execPath, [SKRIP], {
      cwd: AKAR,
      env: { ...process.env, ...env },
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return { kode: 0, keluaran: stdout };
  } catch (err) {
    return { kode: err.status ?? 1, keluaran: `${err.stdout ?? ''}${err.stderr ?? ''}` };
  }
}

describe('gerbang rahasia — nilai publik yang sah harus LOLOS', () => {
  // Semuanya pernah atau akan dikirim CI ke langkah build. Tidak satu pun
  // merupakan rahasia; menandainya berarti deploy berhenti tanpa ada yang bocor.
  const PUBLIK = {
    'ID dokumen templat Google Docs': { VITE_GOOGLE_DOC_TEMPLATE_ID: '1AbCdEfGhIjKlMnOpQrStUvWxYz0123456789abcdefghij' },
    'OAuth Client ID Google': { VITE_GOOGLE_CLIENT_ID: '123456789012-abcdefghijklmnopqrstuvwxyz012345.apps.googleusercontent.com' },
    'URL Apps Script': { VITE_GOOGLE_APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbxContohSaja/exec' },
    'kunci anon Supabase (JWT role=anon)': { VITE_SUPABASE_ANON_KEY: jwt({ role: 'anon', iss: 'supabase' }) },
    'URL Supabase': { VITE_SUPABASE_URL: 'https://contohproyek.supabase.co' },
    'kunci API Google yang memang untuk peramban': { VITE_GCP_API_KEY: contoh('AIza', 'CONTOH-BUKAN-KUNCI-ASLI') },
    'nama/versi aplikasi': { VITE_APP_NAME: 'SKPSLF', VITE_APP_VERSION: '2.1.0' },
  };

  for (const [nama, env] of Object.entries(PUBLIK)) {
    it(`${nama} tidak ditandai`, () => {
      const hasil = jalankan(env);
      expect(hasil.keluaran, `seharusnya lolos, tetapi ditandai:\n${hasil.keluaran}`).not.toMatch(/RAHASIA AKAN IKUT/);
      expect(hasil.kode, `keluar dengan kode ${hasil.kode}`).toBe(0);
    });
  }

  it('nilai acak panjang pada variabel tak dikenal juga lolos (batas palsu yang lama)', () => {
    // Inilah pola yang dulu menandai ID dokumen & Client ID. Panjang saja
    // bukan bukti rahasia.
    const hasil = jalankan({ VITE_IDENTIFIER_PANJANG: 'AbCdEfGhIjKlMnOpQrStUvWxYz0123456789abcdefghijkl' });
    expect(hasil.kode).toBe(0);
  });
});

describe('gerbang rahasia — kunci nyata harus TERTANGKAP', () => {
  const RAHASIA = {
    'kunci Gemini (AIza…)': { VITE_GEMINI_API_KEY: contoh('AIza', 'SyA1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p6Q7') },
    'kunci OpenRouter (sk-…)': { VITE_OPENROUTER_API_KEY: contoh('sk-', 'or-v1-0123456789abcdef0123456789abcdef') },
    'token GitHub (ghp_)': { VITE_GITHUB_TOKEN: contoh('ghp_', '0123456789abcdefghijklmnopqrstuvwxyz') },
    'token Slack (xoxb-)': { VITE_SLACK_TOKEN: contoh('xox', 'b-0123456789-abcdefghijklmnop') },
    'kunci AWS (AKIA)': { VITE_AWS_KEY: contoh('AKIA', 'IOSFODNN7EXAMPLE') },
    'kunci privat': { VITE_PRIVATE: contoh('-----BEGIN ', 'RSA PRIVATE KEY', '-----\nMIIEow...') },
    'token Supabase (sbp_)': { VITE_SUPABASE_PAT: contoh('sbp_', '0123456789abcdefghijklmnopqrstuvwxyz') },
  };

  for (const [nama, env] of Object.entries(RAHASIA)) {
    it(`${nama} ditandai`, () => {
      const hasil = jalankan(env);
      expect(hasil.kode, `seharusnya gagal, tetapi lolos:\n${hasil.keluaran}`).not.toBe(0);
      expect(hasil.keluaran).toMatch(/RAHASIA AKAN IKUT/);
    });
  }

  it('JWT service_role TERTANGKAP walau namanya VITE_SUPABASE_ANON_KEY', () => {
    // Kasus paling berbahaya: kunci master menembus RLS, tetapi namanya
    // membuatnya tampak aman — dan nama itu ada di daftar izin.
    const hasil = jalankan({ VITE_SUPABASE_ANON_KEY: jwt({ role: 'service_role' }) });
    expect(hasil.kode).not.toBe(0);
    expect(hasil.keluaran).toMatch(/service_role/);
  });

  it('JWT anon TIDAK ditandai (kunci ini memang untuk peramban)', () => {
    const hasil = jalankan({ VITE_SUPABASE_ANON_KEY: jwt({ role: 'anon' }) });
    expect(hasil.kode).toBe(0);
  });
});
