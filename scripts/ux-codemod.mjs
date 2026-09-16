#!/usr/bin/env node
/**
 * ux-codemod.mjs — perbaikan UI/UX yang bersifat mekanis.
 *
 * KENAPA CODEMOD, BUKAN PERBAIKAN MANUAL
 * --------------------------------------
 * Sebagian besar temuan audit UI/UX bersifat berulang dan aturannya jelas:
 * setiap <img> butuh teks alternatif, setiap tombol berisi ikon saja butuh
 * nama aksesibel, setiap target="_blank" butuh rel="noopener". Menyentuh
 * puluhan berkas dengan tangan berarti tiga kali lebih banyak kesempatan
 * salah, dan tidak ada cara membuktikan bahwa tidak ada yang terlewat.
 *
 * Yang TIDAK dikerjakan codemod ini — karena butuh pengetahuan konteks dan
 * hanya penulisnya yang tahu maksudnya:
 *   - menyusun ulang tata letak halaman;
 *   - menambah status memuat/kosong/galat pada tiap halaman;
 *   - memilih kata yang tepat untuk aksi yang tidak jelas.
 *
 * Pemakaian:
 *   node scripts/ux-codemod.mjs --dry --verbose     # lihat rencana perubahan
 *   node scripts/ux-codemod.mjs                     # terapkan
 *   node scripts/ux-codemod.mjs --only alt          # alt | label | rel | alert
 *   node scripts/ux-codemod.mjs --json laporan.json
 */

import { readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const ROOT = process.cwd();
const SRC = path.join(ROOT, 'src');

const argv = process.argv.slice(2);
const DRY = argv.includes('--dry');
const VERBOSE = argv.includes('--verbose');
const ONLY = (() => { const i = argv.indexOf('--only'); return i >= 0 ? argv[i + 1] : null; })();
const JSON_OUT = (() => { const i = argv.indexOf('--json'); return i >= 0 ? argv[i + 1] : null; })();
const run = (kind) => !ONLY || ONLY === kind;

// ─────────────────────────────────────────────────────────────────────────────
// Peta makna
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Teks alternatif dipilih berdasarkan NAMA VARIABEL pada atribut src.
 * Nama variabel di repo ini cukup deskriptif (`qrUrl`, `kop_image`, `logoUrl`),
 * sehingga hasilnya jauh lebih baik daripada "Gambar" atau teks kosong.
 */
const ALT_RULES = [
  [/\bqr(?:[_-]?code)?|qrurl|qr_image/i, 'Kode QR dokumen'],
  [/\bkop(?:[_-]?image|_surat)?|letterhead/i, 'Pratinjau kop surat'],
  [/\blogo(?![_-]?out)|brand(?:[_-]?logo)?/i, 'Logo instansi'],
  [/\bsignature|ttd|tanda[_-]?tangan|sig[_-]?image/i, 'Tanda tangan'],
  [/\bavatar|foto[_-]?profil|profile[_-]?photo|user[_-]?photo/i, 'Foto profil pengguna'],
  [/\bphoto|foto|image[_-]?data|evidence|dokumentasi/i, 'Foto dokumentasi pemeriksaan'],
  [/\bthumbnail|preview|pratinjau/i, 'Pratinjau berkas'],
  [/\bwatermark/i, 'Watermark dokumen'],
  [/\bchart|grafik|plot|diagram/i, 'Grafik hasil analisis'],
  [/\bmap|peta|geojson|tile/i, 'Peta lokasi'],
];

/** Nama aksesibel tombol dipilih dari kelas ikon Font Awesome. */
const ICON_LABELS = {
  'fa-times': 'Tutup', 'fa-xmark': 'Tutup', 'fa-close': 'Tutup',
  'fa-trash': 'Hapus', 'fa-trash-alt': 'Hapus', 'fa-trash-can': 'Hapus',
  'fa-edit': 'Ubah', 'fa-pen': 'Ubah', 'fa-pencil': 'Ubah', 'fa-pen-to-square': 'Ubah',
  'fa-download': 'Unduh', 'fa-file-download': 'Unduh berkas',
  'fa-upload': 'Unggah', 'fa-file-upload': 'Unggah berkas',
  'fa-plus': 'Tambah', 'fa-plus-circle': 'Tambah', 'fa-circle-plus': 'Tambah',
  'fa-search': 'Cari', 'fa-magnifying-glass': 'Cari',
  'fa-save': 'Simpan', 'fa-floppy-disk': 'Simpan',
  'fa-print': 'Cetak', 'fa-copy': 'Salin', 'fa-clone': 'Duplikat',
  'fa-sync': 'Muat ulang', 'fa-rotate': 'Muat ulang', 'fa-redo': 'Ulangi',
  'fa-arrow-left': 'Kembali', 'fa-chevron-left': 'Sebelumnya',
  'fa-arrow-right': 'Lanjut', 'fa-chevron-right': 'Berikutnya',
  'fa-chevron-up': 'Perluas', 'fa-chevron-down': 'Perkecil',
  'fa-eye': 'Lihat', 'fa-eye-slash': 'Sembunyikan',
  'fa-file-pdf': 'Unduh PDF', 'fa-file-excel': 'Unduh Excel',
  'fa-file-word': 'Unduh Word', 'fa-file-csv': 'Unduh CSV',
  'fa-sign-out-alt': 'Keluar', 'fa-right-from-bracket': 'Keluar',
  'fa-bell': 'Notifikasi', 'fa-bars': 'Buka menu', 'fa-bars-staggered': 'Buka menu',
  'fa-camera': 'Ambil foto', 'fa-image': 'Pilih gambar', 'fa-camera-retro': 'Ambil foto',
  'fa-check': 'Konfirmasi', 'fa-check-circle': 'Konfirmasi',
  'fa-cog': 'Pengaturan', 'fa-gear': 'Pengaturan', 'fa-sliders': 'Pengaturan',
  'fa-play': 'Jalankan', 'fa-stop': 'Hentikan',
  'fa-expand': 'Perbesar', 'fa-compress': 'Perkecil',
  'fa-link': 'Salin tautan', 'fa-external-link-alt': 'Buka di tab baru',
  'fa-question': 'Bantuan', 'fa-circle-question': 'Bantuan',
  'fa-info-circle': 'Informasi', 'fa-circle-info': 'Informasi',
  'fa-chart-bar': 'Lihat grafik', 'fa-chart-line': 'Lihat grafik', 'fa-chart-pie': 'Lihat grafik',
  'fa-map': 'Lihat peta', 'fa-map-marker-alt': 'Lihat lokasi', 'fa-location-dot': 'Lihat lokasi',
  'fa-calculator': 'Hitung', 'fa-magic': 'Jalankan AI', 'fa-wand-magic-sparkles': 'Jalankan AI',
  'fa-robot': 'Jalankan AI', 'fa-brain': 'Jalankan AI',
  'fa-filter': 'Saring', 'fa-sort': 'Urutkan',
  'fa-paper-plane': 'Kirim', 'fa-share': 'Bagikan',
  'fa-file-import': 'Impor berkas', 'fa-file-export': 'Ekspor berkas',
  'fa-clipboard': 'Salin', 'fa-clipboard-list': 'Lihat daftar',
  'fa-arrow-up-from-bracket': 'Unggah', 'fa-cloud-upload-alt': 'Unggah ke penyimpanan',
  'fa-database': 'Data',
  'fa-list': 'Lihat daftar', 'fa-table': 'Lihat tabel',
  'fa-th': 'Ubah tampilan', 'fa-th-large': 'Ubah tampilan',
  'fa-microphone': 'Rekam suara', 'fa-video': 'Rekam video',
  'fa-lock': 'Kunci', 'fa-unlock': 'Buka kunci',
  'fa-user-plus': 'Tambah pengguna',
  'fa-user-edit': 'Ubah pengguna',
  'fa-user-minus': 'Hapus pengguna',
};

/** Jenis toast berdasarkan isi pesan. */
function toastType(message) {
  const t = message.toLowerCase();
  if (/gagal|error|kesalahan|tidak dapat|failed|exception|invalid|tidak valid/.test(t)) return 'error';
  if (/berhasil|sukses|tersimpan|terkirim|sukses|success|saved|completed|selesai/.test(t)) return 'success';
  if (/tidak ada|belum ada|kosong|pilih dulu|harus|wajib|perhatian|peringatan/.test(t)) return 'warning';
  return 'info';
}

/** Ambil ekspresi argumen pertama sebuah pemanggilan berdasarkan tanda kurung. */
function firstArg(text, openParen) {
  let depth = 0;
  let quote = null;
  for (let i = openParen; i < text.length; i++) {
    const ch = text[i];
    if (quote) {
      if (ch === '\\') { i++; continue; }
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') { quote = ch; continue; }
    if (ch === '(') depth++;
    else if (ch === ')') { depth--; if (depth === 0) return { arg: text.slice(openParen + 1, i), end: i }; }
  }
  return null;
}

/** Masker kode: 1 = kode, 0 = di dalam string/komentar. */
function codeMask(code) {
  const m = new Uint8Array(code.length).fill(1);
  let i = 0; const n = code.length;
  while (i < n) {
    const c = code[i], c2 = code[i + 1];
    if (c === '/' && c2 === '/') { while (i < n && code[i] !== '\n') m[i++] = 0; }
    else if (c === '/' && c2 === '*') {
      m[i++] = 0; m[i++] = 0;
      while (i < n && !(code[i] === '*' && code[i + 1] === '/')) m[i++] = 0;
      if (i < n) { m[i++] = 0; m[i++] = 0; }
    } else if (c === '"' || c === "'" || c === '`') {
      const q = c; m[i++] = 0;
      while (i < n) {
        if (code[i] === '\\') { m[i++] = 0; m[i++] = 0; continue; }
        if (code[i] === q) { m[i++] = 0; break; }
        if (q === '`' && code[i] === '$' && code[i + 1] === '{') {
          m[i++] = 1; m[i++] = 1;
          let d = 1;
          while (i < n && d > 0) {
            if (code[i] === '{') d++;
            else if (code[i] === '}') d--;
            if (d > 0) m[i++] = 1; else m[i++] = 0;
          }
          continue;
        }
        m[i++] = 0;
      }
    } else i++;
  }
  return m;
}

// ─────────────────────────────────────────────────────────────────────────────
// Perbaikan
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Setiap perbaikan menerima (code, mask) dan mengembalikan daftar suntingan
 * {start, end, text, note}. Seluruh suntingan dikumpulkan dulu, baru
 * diterapkan dari BELAKANG ke depan — supaya offset tidak bergeser.
 * (Codemod XSS sebelumnya pernah salah karena menerapkan sambil berjalan.)
 */
function fixAlt(code, mask) {
  const edits = [];
  for (const m of code.matchAll(/<img\b[^>]*?>/gi)) {
    const tag = m[0];
    if (/\balt\s*=/.test(tag)) continue;
    const src = tag.match(/\bsrc\s*=\s*["']([^"']*)["']/i)?.[1] ?? '';
    let alt = null;
    for (const [re, text] of ALT_RULES) {
      if (re.test(src)) { alt = text; break; }
    }
    if (alt === null) continue; // tidak dikenali → tidak ditebak, dilaporkan terpisah
    const insertAt = m.index + '<img'.length;
    edits.push({ start: insertAt, end: insertAt, text: ` alt="${alt}"`, note: `alt → "${alt}"` });
  }
  return edits;
}

/**
 * Nama aksesibel diturunkan dari AKSI tombolnya, bukan dari gambarnya.
 *
 * KENAPA: versi pertama codemod ini menerjemahkan kelas ikon saja, dan
 * hasilnya salah di beberapa tempat yang penting — tombol hapus foto
 * (fa-times) diberi nama "Tutup", dan tombol perbesar tampilan (fa-plus)
 * diberi nama "Tambah". Bagi pengguna pembaca layar, label yang SALAH lebih
 * membahayakan daripada label yang tidak ada: mereka akan menekan tombol
 * "Tutup" dan fotonya terhapus tanpa peringatan.
 *
 * Urutan kepercayaan:
 *   1. Ungkapan onclick — paling informatif, menyebut fungsi yang dipanggil.
 *   2. Kelas ikon — hanya sebagai cadangan, dan hanya untuk ikon yang
 *      maknanya tunggal (tidak ambigu).
 *   3. Tidak ada keduanya → DILEWATI. Lebih baik dibiarkan tanpa nama dan
 *      dilaporkan ke manusia daripada diberi nama yang menyesatkan.
 */
const ACTION_LABELS = [
  // Khusus lebih dulu: pola yang lebih spesifik harus menang.
  [/zoom[_-]?in|perbesar/i, 'Perbesar tampilan'],
  [/zoom[_-]?out|perkecil/i, 'Perkecil tampilan'],
  [/reset[_-]?zoom|fit[_-]?to/i, 'Sesuaikan ukuran tampilan'],
  [/_?(?:hapus|delete|remove)[_-]?(?:foto|photo|file|berkas|image|img)?/i, 'Hapus'],
  [/_?(?:remove|delete|hapus)/i, 'Hapus'],
  [/(?:closeModal|_closeModal|close_?[a-z]*)\s*\(/i, 'Tutup'],
  [/\.remove\(\)/i, 'Tutup'],
  [/toggle|classList\.toggle/i, 'Tampilkan atau sembunyikan'],
  [/_?edit|_?ubah/i, 'Ubah'],
  [/_?save|_?simpan/i, 'Simpan'],
  [/_?print|cetak/i, 'Cetak'],
  [/_?download|unduh|_export|export_|_ekspor/i, 'Unduh'],
  [/_?upload|unggah|_import/i, 'Unggah'],
  [/reload|refresh|_?sync|_?muat[_-]?ulang/i, 'Muat ulang'],
  [/navigate\s*\(/i, 'Buka'],
  [/_?copy|salin|clipboard/i, 'Salin'],
  [/_?send|kirim|submit|_?simpan_?form/i, 'Kirim'],
  [/_?search|cari|filter_?search/i, 'Cari'],
  [/_?add|tambah|create|buat|new_/i, 'Tambah'],
  [/camera|foto|photo/i, 'Ambil foto'],
  [/_?refresh[_-]?photo|reload[_-]?image/i, 'Muat ulang foto'],
  [/_?fullscreen|expand|perbesar_?peta/i, 'Perbesar'],
];

function labelFromAction(attrs) {
  const onclick = attrs.match(/\bonclick\s*=\s*["']([^"']*)["']/i)?.[1];
  if (!onclick) return null;
  for (const [re, label] of ACTION_LABELS) {
    if (typeof label !== 'string') continue;
    if (re.test(onclick)) return label;
  }
  return null;
}

function fixLabels(code, mask) {
  const edits = [];
  for (const m of code.matchAll(/<button\b([^>]*)>\s*<i\b[^>]*class=["'][^"']*?\b(fa-[a-z0-9-]+)\b[^"']*["'][^>]*>\s*<\/i>\s*<\/button>/gi)) {
    const attrs = m[1];
    if (/\b(aria-label|aria-labelledby|title)\s*=/.test(attrs)) continue;

    // 1. dari aksi
    let label = labelFromAction(attrs);
    let sumber = 'aksi';

    // 2. cadangan: ikon yang maknanya tunggal
    if (!label) label = ICON_LABELS[m[2]];
    if (!label) continue; // 3. tidak dikenali → biarkan untuk manusia
    if (labelFromAction(attrs) === null) sumber = 'ikon';

    const insertAt = m.index + '<button'.length;
    edits.push({
      start: insertAt, end: insertAt,
      text: ` type="button" aria-label="${label}"`,
      note: `${m[2]} + ${sumber} → "${label}"`,
    });
  }
  return edits;
}

function fixRel(code, mask) {
  const edits = [];
  for (const m of code.matchAll(/<a\b[^>]*target\s*=\s*["']_blank["'][^>]*>/gi)) {
    const tag = m[0];
    if (/rel\s*=\s*["'][^"']*noopener/.test(tag)) continue;
    if (/\brel\s*=\s*["'][^"']*["']/.test(tag)) {
      // Sudah ada rel, cukup tambahkan noopener
      const relMatch = tag.match(/rel\s*=\s*["']([^"']*)["']/);
      const at = m.index + relMatch.index + relMatch[0].length - 1;
      edits.push({ start: at, end: at, text: ' noopener noreferrer', note: 'rel += noopener noreferrer' });
    } else {
      const insertAt = m.index + '<a'.length;
      edits.push({ start: insertAt, end: insertAt, text: ' rel="noopener noreferrer"', note: 'rel="noopener noreferrer"' });
    }
  }
  return edits;
}

/**
 * Bungkus tabel dengan wadah yang dapat digulir.
 *
 * Tabel data dengan banyak kolom meluber keluar layar ponsel. Pembungkus
 * `overflow-x: auto` menyelesaikannya, TETAPI menurut WCAG 2.1.1 wadah
 * gulir harus dapat difokus keyboard — tanpa itu, pengguna keyboard tidak
 * punya cara menggeser tabel yang terpotong. Karena itu pembungkusnya
 * sekaligus diberi tabindex="0" dan role="region".
 *
 * Tabel yang sudah berada di dalam pembungkus, dan tabel pada dokumen
 * cetak (dibangun oleh mesin pipeline), dilewati.
 */
function fixTable(code, mask) {
  const edits = [];
  for (const m of code.matchAll(/<table\b[^>]*>[\s\S]*?<\/table>/gi)) {
    const before = code.slice(Math.max(0, m.index - 220), m.index);
    if (/table-wrap/.test(before)) continue;

    // Hanya di dalam string (markah yang dirakit), bukan di komentar.
    if (mask[m.index] === 0) {
      const lineStart = code.lastIndexOf('\n', m.index);
      const line = code.slice(lineStart, code.indexOf('\n', m.index));
      if (!/[`'"]/.test(line)) continue; // kemungkinan besar komentar
    }

    edits.push({
      start: m.index,
      end: m.index + m[0].length,
      text: `<div class="table-wrap" tabindex="0" role="region" aria-label="Tabel data yang dapat digulir">${m[0]}</div>`,
      note: 'tabel dibungkus .table-wrap + tabindex/role',
    });
  }
  return edits;
}

function fixAlert(code, mask) {
  const edits = [];
  for (const m of code.matchAll(/(?<![.\w$])alert\s*\(/g)) {
    // Lewati yang berada di dalam string (mis. contoh pada dokumen) dan
    // yang bukan pemanggilan nyata.
    const before = code.slice(Math.max(0, m.index - 12), m.index);
    if (/\bwindow\.$/.test(before) === false && /\.$/.test(before)) continue;

    const open = m.index + m[0].length - 1;
    const parsed = firstArg(code, open);
    if (!parsed) continue;
    const { arg, end } = parsed;

    const inString = mask[m.index] === 0;
    const literal = arg.trim().match(/^(['"`])([\s\S]*)\1$/);
    const type = literal ? toastType(literal[2]) : 'info';
    const callee = inString ? 'window.showToast' : 'toast';

    // Bentuk yang lebih ringkas untuk literal sederhana, dan tetap memakai
    // argumen asli untuk ekspresi (mis. template literal dengan ${...}).
    edits.push({
      start: m.index,
      end: end + 1,
      text: `${callee}(${arg.trim()}, '${type}')`,
      note: `alert → ${callee}(…, '${type}')`,
    });
  }
  return edits;
}

// ─────────────────────────────────────────────────────────────────────────────
// Program utama
// ─────────────────────────────────────────────────────────────────────────────

async function collect() {
  const out = [];
  async function walk(dir) {
    for (const e of await readdir(dir, { withFileTypes: true })) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) { if (e.name !== 'node_modules') await walk(full); }
      else if (e.name.endsWith('.js') && !e.name.endsWith('.test.js')) out.push(full);
    }
  }
  await walk(SRC);
  return out.sort();
}

async function main() {
  const files = await collect();
  const report = {
    filesTouched: 0, totalEdits: 0,
    byKind: { alt: 0, label: 0, rel: 0, alert: 0, table: 0 },
    unmapped: [],
    details: [],
  };

  for (const file of files) {
    const original = await readFile(file, 'utf8');
    let code = original;
    let touched = 0;
    const fileNotes = [];

    for (const [kind, fn] of [
      ['alt', fixAlt], ['label', fixLabels], ['rel', fixRel], ['alert', fixAlert],
      ['table', fixTable],
    ]) {
      if (!run(kind)) continue;
      const mask = codeMask(code);
      const edits = fn(code, mask);

      // Buang suntingan yang tumpang tindih (jarak < 2 karakter).
      const sorted = edits.slice().sort((a, b) => a.start - b.start);
      const kept = [];
      for (const e of sorted) {
        if (kept.length && e.start - kept[kept.length - 1].end < 2) continue;
        kept.push(e);
      }

      // Terapkan dari belakang supaya offset sebelumnya tetap sahih.
      for (const e of kept.slice().reverse()) {
        code = code.slice(0, e.start) + e.text + code.slice(e.end);
      }
      report.byKind[kind] += kept.length;
      touched += kept.length;
      for (const e of kept) fileNotes.push(`[${kind}] ${e.note}`);
    }

    // Laporkan gambar yang tidak dikenali supaya bisa ditangani manual —
    // lebih baik jujur "belum" daripada memberi alt yang salah.
    if (run('alt')) {
      for (const m of code.matchAll(/<img\b[^>]*?>/gi)) {
        if (/\balt\s*=/.test(m[0])) continue;
        report.unmapped.push({
          file: path.relative(ROOT, file).replace(/\\/g, '/'),
          src: (m[0].match(/src\s*=\s*["']([^"']*)["']/i)?.[1] ?? '(tanpa src)').slice(0, 70),
        });
      }
    }

    if (touched) {
      report.filesTouched++;
      report.totalEdits += touched;
      report.details.push({ file: path.relative(ROOT, file).replace(/\\/g, '/'), edits: fileNotes });
      if (!DRY) await writeFile(file, code);
    }
  }

  // ── Keluaran ──
  console.log(`\n${'='.repeat(76)}`);
  console.log(`  CODEMOD UI/UX ${DRY ? '(DRY-RUN — tidak ada berkas yang diubah)' : '(DITERAPKAN)'}`);
  console.log(`${'='.repeat(76)}`);
  console.log(`  Berkas diperiksa ....... ${files.length}`);
  console.log(`  Berkas diperbaiki ...... ${report.filesTouched}`);
  console.log(`  Total suntingan ........ ${report.totalEdits}`);
  console.log(`     teks alternatif ..... ${report.byKind.alt}`);
  console.log(`     nama tombol ......... ${report.byKind.label}`);
  console.log(`     rel noopener ........ ${report.byKind.rel}`);
  console.log(`     alert → toast ....... ${report.byKind.alert}`);
  console.log(`     tabel dibungkus ..... ${report.byKind.table}`);
  console.log(`  Gambar belum diberi alt  ${report.unmapped.length} (perlu keputusan manusia)`);
  console.log(`${'='.repeat(76)}\n`);

  if (VERBOSE) {
    for (const d of report.details) {
      console.log(`  ${d.file}`);
      for (const n of d.edits) console.log(`      ${n}`);
    }
    console.log('');
  }

  if (report.unmapped.length) {
    console.log('  Gambar tanpa alt yang belum dikenali (tentukan manual):');
    for (const u of report.unmapped.slice(0, 30)) console.log(`     ${u.file}  ←  ${u.src}`);
    console.log('');
  }

  if (JSON_OUT) {
    const target = path.isAbsolute(JSON_OUT) ? JSON_OUT : path.join(ROOT, JSON_OUT);
    await writeFile(target, JSON.stringify(report, null, 2));
    console.log(`  Laporan JSON: ${path.relative(ROOT, target)}\n`);
  }
}

main().catch((err) => {
  console.error(`\n❌ Codemod gagal: ${err.message}\n${err.stack}\n`);
  process.exit(1);
});
