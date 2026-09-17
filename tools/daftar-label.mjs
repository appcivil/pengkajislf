/**
 * Daftar label antarmuka yang masih berbahasa Inggris.
 *
 * Memakai heuristik yang sama dengan aturan audit E3 (hanya KALIMAT utuh),
 * tetapi diperluas ke LABEL PENDEK: teks di dalam tag dan atribut
 * placeholder/title/aria-label/alt. Label yang memuat kata fungsi Indonesia
 * atau istilah baku profesi dilewati.
 *
 * Pakai: node alat-periksa/daftar-label.mjs        (dari akar repositori)
 */
import { readdirSync, statSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const AKAR = process.argv[2] || process.cwd();
const KELUAR = process.argv[3] || '/tmp/daftar-label.json';

// Istilah baku profesi / nama merek yang MEMANG berbahasa Inggris.
const TETAP = /^(pushover analysis|ach minimum required|df minimum required|google cloud \(simbg\))/i;
// Kata fungsi Indonesia yang menandakan teks sudah berbahasa Indonesia.
const ID = /\b(yang|dan|dengan|untuk|tidak|adalah|akan|dari|pada|ini|itu|atau|sudah|belum|di|ke|oleh|agar|jika|bila|serta|dalam|hasil|nilai|silakan|masukkan|pilih|tambah|hapus|simpan|batal|tutup|kembali|halaman|berkas|total|rata|biaya|luas|berat|tinggi|lebar|panjang|jumlah|waktu|tanggal|nama|laporan|analisis|proyek|struktur|bangunan|pengguna|peran|status|memuat|gagal|berhasil|perhatian|catatan|langkah|bagian|daftar|tabel|grafik|satuan|perhitungan|sedang|telah|dapat|harus|lebih|kurang|sama|lain|setiap|semua|hanya|juga|masih|saja)\b/i;
// Kosakata label antarmuka berbahasa Inggris.
const EN = new Set(('secure sign in with google authorize direct identity alias email security keycase password override protocol bypass consortium entry quantum neural synthesis automated integrity compliance overwatch official gdocs digital sealing orchestrator strategic data visualization pulse maps encrypted cloud architecture bit aes executive summary report generate export print download upload settings configuration user profile logout sign out welcome home dashboard project projects building structure analysis result results history search filter sort column row table chart graph total average maximum minimum cost area weight height width length volume time date name description notes instructions steps section list value unit calculation loading failed success warning attention notice please enter select add remove delete save cancel close back page file users role status connected connection error invalid required optional title subtitle heading label placeholder button submit reset confirm apply preview edit update create new open view details overview recent latest all none yes no or the of to for from without by on at in is are will can cannot must should your you this that when while before after until then than there here what which who how why enabled disabled active inactive pending completed running stopped started finished paused retry refresh reload sync synchronize import backup restore asset new run a finalized fit generating document').split(/\s+/));

const berkas = [];
(function jalan(d) {
  for (const n of readdirSync(d)) {
    if (/node_modules|\.git$/.test(n)) continue;
    const p = join(d, n), s = statSync(p);
    if (s.isDirectory()) jalan(p);
    else if (/\.(js|html)$/.test(n) && !/\.test\.js$/.test(n)) berkas.push(p);
  }
})(join(AKAR, 'src'));
berkas.push(join(AKAR, 'index.html'));

const hasil = [];
for (const p of berkas) {
  const code = readFileSync(p, 'utf8');
  code.split('\n').forEach((ln, i) => {
    for (const m of ln.matchAll(/>([^<>{}\n]{6,120})</g)) {
      const mentah = m[1];
      const t = mentah.replace(/&[a-z]+;/gi, ' ').replace(/\s+/g, ' ').trim();
      if (t.length < 6 || /[${]|&&|\/\/|https?:|=/.test(t)) continue;
      if (TETAP.test(t) || ID.test(t)) continue;
      const kata = t.split(/[^A-Za-z'()%/·&+.-]+/).filter(Boolean);
      if (kata.length < 2) continue;
      if (kata.filter((w) => EN.has(w.toLowerCase())).length / kata.length < 0.6) continue;
      hasil.push({ rel: relative(AKAR, p), line: i + 1, mentah, tampak: t });
      break;
    }
  });
}
writeFileSync(KELUAR, JSON.stringify(hasil, null, 1));
const perBerkas = new Set(hasil.map((h) => h.rel));
console.log(`  ${hasil.length} label berbahasa Inggris di ${perBerkas.size} berkas → ${KELUAR}`);
for (const h of hasil) console.log(`  ${h.rel}:${h.line}  "${h.tampak}"`);
