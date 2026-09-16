/**
 * ============================================================
 *  LAZY CARD — hidrasi kartu modul saat masuk viewport
 *
 *  MASALAH: halaman `proyek-detail` mengimpor 18 modul komponen
 *  secara statis dan merender semuanya sekaligus. Akibatnya chunk
 *  `proyek-detail` membengkak ~990 KB dan seluruh kode modul ikut
 *  terunduh walaupun sebagian besar kartu ada di luar layar.
 *
 *  SOLUSI: kartu berat dirender sebagai kerangka (skeleton) lebih
 *  dulu, lalu modulnya di-`import()` dinamis saat kartu mendekati
 *  viewport. Handler (init) dijalankan setelah kartu terpasang.
 *
 *  Yang dijaga:
 *   - `id` root kartu tetap sama setelah hidrasi, sehingga
 *     navigasi tab (?tab=fire) dan scroll-into-view tetap bekerja.
 *   - Bila IntersectionObserver tidak tersedia → hidrasi langsung.
 *   - Bila modul/datanya gagal dimuat → tampilkan kartu error,
 *     bukan halaman kosong.
 *   - Idempoten: satu kartu tidak pernah dihidrasi dua kali.
 *
 *  @module lib/lazy-card
 */

import { createLogger } from './logger.js';

import { escapeHtml } from './safe-markdown.js';
const log = createLogger('LazyCard');

/** @type {Map<string, {loader: Function, rootId: string, renderKey: string, initKey?: string, fetchKey?: string}>} */
const registry = new Map();

/** Berapa jauh di luar viewport kartu mulai dimuat. */
const PRELOAD_MARGIN = '400px';

/** Kartu yang sudah dihidrasi (atau sedang diproses). */
const hydrated = new Set();

/**
 * Daftarkan definisi kartu berat.
 *
 * @param {string} key       pengenal kartu, mis. 'fire'
 * @param {object} def
 * @param {string} def.rootId     id elemen root setelah dirender (mis. 'fire-protection-card')
 * @param {Function} def.loader   () => import('...')
 * @param {string} def.renderKey  nama fungsi render di modul (mis. 'renderFireProtectionCard')
 * @param {string} [def.initKey]  nama fungsi init di modul (mis. 'initFireProtectionHandlers')
 * @param {string} [def.fetchKey] nama fungsi fetch ringkasan di modul (mis. 'fetchFireProtectionSummary')
 * @param {object} [def.fetchArgs] argumen tambahan untuk fetch (default: [proyekId])
 */
export function defineLazyCard(key, def) {
  registry.set(key, def);
}

/** Kerangka kartu yang ditampilkan sebelum modul aslinya dimuat. */
export function lazyCardShell(key, { minHeight = 200, label = 'Memuat modul…' } = {}) {
  const def = registry.get(key);
  const rootId = def?.rootId || `lazy-${key}`;

  return `
    <div id="${escapeHtml(rootId)}" data-lazy-card="${escapeHtml(key)}" class="card-glass lazy-card-shell"
         style="min-height:${escapeHtml(minHeight)}px; display:flex; align-items:center; justify-content:center; opacity:0.7">
      <div style="display:flex; align-items:center; gap:12px; color:var(--text-tertiary); font-size:0.8rem">
        <i class="fas fa-circle-notch fa-spin" style="font-size:1.1rem"></i>
        <span>${escapeHtml(label)}</span>
      </div>
    </div>
  `;
}

/** Kartu gagal dimuat — tetap tampil, tidak membuat halaman kosong. */
function errorCard(rootId, error) {
  return `
    <div id="${escapeHtml(rootId)}" class="card-glass" style="padding:20px">
      <div style="display:flex; align-items:center; gap:12px; color:var(--danger-400, #f87171)">
        <i class="fas fa-triangle-exclamation"></i>
        <div>
          <div style="font-weight:700; font-size:0.85rem">Modul gagal dimuat</div>
          <div style="font-size:0.72rem; color:var(--text-tertiary)">${escapeHtml(String(error?.message || error))}</div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Hidrasi SATU kartu: impor modul → ambil ringkasan → render → pasang → init.
 *
 * @param {string} key
 * @param {object} ctx  konteks halaman: { p (proyek), id, params, stats, ... }
 * @returns {Promise<boolean>} true bila berhasil
 */
export async function hydrateCard(key, ctx = {}) {
  const def = registry.get(key);
  const shell = document.querySelector(`[data-lazy-card="${key}"]`);

  if (!def || !shell) return false;
  if (hydrated.has(key)) return true;      // idempoten
  hydrated.add(key);

  const { rootId, loader, renderKey, initKey, fetchKey, fetchArgs } = def;

  try {
    const mod = await loader();

    // Ambil data ringkasan (opsional) — paralel dengan pengambilan modul
    let summary = ctx.summaries?.[key];
    if (summary === undefined && fetchKey && typeof mod[fetchKey] === 'function') {
      const args = fetchArgs ? fetchArgs(ctx) : [ctx.id];
      try {
        summary = await mod[fetchKey](...args);
      } catch (err) {
        log.warn(`Ringkasan '${key}' gagal dimuat:`, err?.message);
        summary = {};
      }
      if (ctx.summaries) ctx.summaries[key] = summary;
    }

    const renderFn = mod[renderKey];
    if (typeof renderFn !== 'function') {
      throw new Error(`modul tidak mengekspor ${renderKey}`);
    }

    // Struktur bangunan butuh statistik checklist, bukan summary
    const html = renderFn(ctx.p, summary ?? (def.renderArgs ? def.renderArgs(ctx) : {}));

    // Ganti kerangka dengan kartu asli (id root dipertahankan)
    shell.outerHTML = html;

    // Pasang handler setelah DOM kartu ada
    if (initKey && typeof mod[initKey] === 'function') {
      const args = def.initArgs ? def.initArgs(ctx) : [ctx.id];
      try {
        mod[initKey](...args);
      } catch (err) {
        log.warn(`init '${key}' gagal:`, err?.message);
      }
    }

    log.debug(`Kartu '${key}' terhidrasi.`);
    return true;
  } catch (err) {
    log.error(`Hidrasi kartu '${key}' gagal:`, err);
    const target = document.querySelector(`[data-lazy-card="${key}"]`);
    if (target) target.outerHTML = errorCard(rootId, err);
    return false;
  }
}

/**
 * Pasang pemantau untuk semua kerangka kartu di halaman.
 *
 * @param {object} ctx
 * @param {string[]} [options.force] key yang harus langsung dihidrasi
 *                                   (mis. kartu yang jadi target ?tab=...)
 * @returns {() => void} fungsi pembersih (dipanggil saat pindah halaman)
 */
export function hydrateLazyCards(ctx = {}, options = {}) {
  const { force = [] } = options;
  const shells = [...document.querySelectorAll('[data-lazy-card]')];

  if (shells.length === 0) return () => {};

  // 1. Kartu yang diminta langsung (target tab) → hidrasi sekarang
  force.forEach((key) => {
    if (registry.has(key)) hydrateCard(key, ctx);
  });

  // 2. Tanpa IntersectionObserver → hidrasi semua (perilaku lama)
  if (typeof IntersectionObserver === 'undefined') {
    shells.forEach((el) => {
      const key = el.dataset.lazyCard;
      if (key && !hydrated.has(key)) hydrateCard(key, ctx);
    });
    return () => {};
  }

  // 3. Hidrasi saat mendekati viewport
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const key = entry.target.dataset.lazyCard;
      if (!key || hydrated.has(key)) return;
      hydrateCard(key, ctx);
      observer.unobserve(entry.target);
    });
  }, { rootMargin: PRELOAD_MARGIN, threshold: 0.01 });

  shells.forEach((el) => {
    const key = el.dataset.lazyCard;
    if (key && !hydrated.has(key)) observer.observe(el);
  });

  return () => observer.disconnect();
}

/** Reset status hidrasi — dipanggil saat halaman dibangun ulang. */
export function resetLazyCards() {
  hydrated.clear();
}

/** Daftar kartu yang sudah terdaftar (untuk audit/debug). */
export function listLazyCards() {
  return [...registry.keys()];
}

export default { defineLazyCard, lazyCardShell, hydrateCard, hydrateLazyCards, resetLazyCards, listLazyCards };
