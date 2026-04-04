// ============================================================
//  HTML SECURITY UTILITY
//  Fungsi-fungsi untuk mencegah XSS di template string HTML
//
//  PENGGUNAAN:
//    import { esc, escAttr, escUrl } from '../lib/html-utils.js';
//
//    // Di template string:
//    return `<div class="card">${esc(proyek.nama_bangunan)}</div>`;
//    return `<a href="${escUrl(link)}">${esc(linkText)}</a>`;
//    return `<div onclick="navigate('detail', {id:'${escAttr(p.id)}'})">`;
//
// ============================================================

const HTML_ESCAPE_MAP = {
  '&':  '&amp;',
  '<':  '&lt;',
  '>':  '&gt;',
  '"':  '&quot;',
  "'":  '&#39;',
  '`':  '&#96;',
  '/':  '&#x2F;',
};

/**
 * Escape karakter HTML berbahaya dari string.
 * Gunakan untuk semua data text dari DB/user yang dimasukkan ke innerHTML template.
 * 
 * @param {*} value - Nilai yang akan di-escape
 * @returns {string} String yang aman untuk diinsert ke HTML
 */
export function esc(value) {
  if (value === null || value === undefined) return '';
  return String(value).replace(/[&<>"'`/]/g, (char) => HTML_ESCAPE_MAP[char]);
}

/**
 * Escape untuk nilai dalam atribut HTML (href, data-*, dsb).
 * Lebih ketat dari esc() biasa.
 */
export function escAttr(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Validasi dan escape URL — mencegah javascript: protocol injection.
 * Gunakan untuk semua URL yang berasal dari input user / database.
 * 
 * @param {string} url - URL yang akan divalidasi
 * @param {string} fallback - URL fallback jika tidak valid
 */
export function escUrl(url, fallback = '#') {
  if (!url) return fallback;
  const str = String(url).trim();
  // Block javascript:, data:, vbscript: dan protokol berbahaya lainnya
  if (/^(javascript|data|vbscript):/i.test(str)) return fallback;
  // Hanya izinkan http, https, dan relative URL
  if (!/^(https?:\/\/|\/|\.\/|#)/.test(str)) return fallback;
  return str;
}

/**
 * Truncate string dengan aman (setelah di-escape).
 * Berguna untuk nama bangunan panjang di card/table.
 */
export function escTrunc(value, maxLen = 50) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  const truncated = str.length > maxLen ? str.substring(0, maxLen) + '…' : str;
  return esc(truncated);
}

/**
 * Format angka dengan locale Indonesia, aman untuk HTML.
 */
export function escNum(value, decimals = 0) {
  const num = parseFloat(value);
  if (isNaN(num)) return '-';
  return num.toLocaleString('id-ID', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

/**
 * Format tanggal Indonesia, aman untuk HTML.
 */
export function escDate(value, opts = {}) {
  if (!value) return '-';
  try {
    const date = new Date(value);
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric',
      ...opts,
    });
  } catch {
    return '-';
  }
}

/**
 * Tag template literal untuk HTML escape otomatis.
 * Penggunaan: html`<div>${userInput}</div>`
 * Semua interpolasi ${} otomatis di-escape.
 * 
 * Untuk nilai yang memang HTML aman (dari kode kita sendiri), 
 * wrap dengan raw(): html`<div>${raw(ourHtml)}</div>`
 */
export function html(strings, ...values) {
  return strings.reduce((result, str, i) => {
    const value = values[i - 1];
    return result + esc(value) + str;
  });
}

/**
 * Tandai string sebagai HTML aman (tidak perlu di-escape).
 * HANYA gunakan untuk HTML yang dihasilkan oleh kode kita sendiri,
 * BUKAN untuk data dari user/database.
 */
export function raw(value) {
  return { __raw: true, value: String(value) };
}
