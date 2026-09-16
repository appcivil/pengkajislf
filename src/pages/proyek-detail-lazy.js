/**
 * ============================================================
 *  REGISTRY KARTU LAZY — halaman Detail Proyek
 *
 *  Delapan modul terberat (total ~630 KB kode sumber) tidak lagi
 *  diimpor statis oleh proyek-detail.js. Modul-modul ini dimuat
 *  saat kartunya mendekati viewport.
 *
 *  Modul kecil (≤16 KB) sengaja TETAP statis karena penghematannya
 *  kecil sementara jumlah perubahan kode bertambah.
 *
 *  Setiap entri memetakan:
 *    loader    → import() dinamis modulnya
 *    rootId    → id root kartu (harus sama seperti sebelumnya agar
 *                ?tab=..., scrollIntoView, dan selector lain tetap jalan)
 *    fetchKey  → fungsi ringkasan yang dipanggil lazy (bukan saat load halaman)
 *    renderKey → fungsi render kartu
 *    initKey   → fungsi pemasangan handler
 *
 *  @module pages/proyek-detail-lazy
 */

import { defineLazyCard } from '../lib/lazy-card.js';

// ── 1. Struktur Bangunan (80 KB) → tier statistik, tanpa fetch ──
defineLazyCard('struktur', {
  rootId: 'struktur-bangunan-card',
  loader: () => import('../components/struktur-bangunan-module.js'),
  renderKey: 'renderStrukturBangunanCard',
  initKey: 'initStrukturBangunanHandlers',
  // renderStrukturBangunanCard(p, { tier1, tier2, tier3 })
  renderArgs: (ctx) => ({ tier1: ctx.stats?.pct ?? 0, tier2: 0, tier3: 0 }),
});

// ── 2. Proteksi Petir / LPS (76 KB) ──
defineLazyCard('lps', {
  rootId: 'lps-module-card',
  loader: () => import('../components/lightning-protection-module.js'),
  fetchKey: 'fetchLPSSummary',
  renderKey: 'renderLPSCard',
  initKey: 'initLPSHandlers',
});

// ── 3. Proteksi Kebakaran (92 KB) ──
defineLazyCard('fire', {
  rootId: 'fire-protection-card',
  loader: () => import('../components/fire-protection-module.js'),
  fetchKey: 'fetchFireProtectionSummary',
  renderKey: 'renderFireProtectionCard',
  initKey: 'initFireProtectionHandlers',
});

// ── 4. Intensitas Bangunan (60 KB) ──
defineLazyCard('intensity', {
  rootId: 'building-intensity-card',
  loader: () => import('../components/building-intensity-module.js'),
  fetchKey: 'fetchBuildingIntensitySummary',
  renderKey: 'renderBuildingIntensityCard',
  initKey: 'initBuildingIntensityHandlers',
});

// ── 5. Persyaratan Arsitektur (56 KB) ──
defineLazyCard('architectural', {
  rootId: 'architectural-card',
  loader: () => import('../components/architectural-requirements-module.js'),
  fetchKey: 'fetchArchitecturalSummary',
  renderKey: 'renderArchitecturalCard',
  initKey: 'initArchitecturalHandlers',
});

// ── 6. Jalur Evakuasi / Egress (84 KB) ──
defineLazyCard('egress', {
  rootId: 'egress-system-card',
  loader: () => import('../components/egress-system-module.js'),
  fetchKey: 'fetchEgressSummary',
  renderKey: 'renderEgressSystemCard',
  initKey: 'initEgressSystemHandlers',
});

// ── 7. Dampak Lingkungan (92 KB) ──
defineLazyCard('environmental', {
  rootId: 'environmental-card',
  loader: () => import('../components/environmental-module.js'),
  fetchKey: 'fetchEnvironmentalSummary',
  renderKey: 'renderEnvironmentalCard',
  initKey: 'initEnvironmentalHandlers',
});

// ── 8. Aksesibilitas (92 KB) ──
defineLazyCard('accessibility', {
  rootId: 'accessibility-card',
  loader: () => import('../components/accessibility-module.js'),
  fetchKey: 'fetchAccessibilitySummary',
  renderKey: 'renderAccessibilityCard',
  initKey: 'initAccessibilityHandlers',
});

/**
 * Pemetaan tab URL → key kartu lazy.
 * Dipakai supaya `?tab=fire` tetap melompat ke kartu yang benar
 * walaupun kartunya belum terhidrasi (dipaksa muat lebih dulu).
 */
export const TAB_TO_LAZY_KEY = Object.freeze({
  struktur: 'struktur',
  lps: 'lps',
  fire: 'fire',
  intensity: 'intensity',
  architectural: 'architectural',
  egress: 'egress',
  environmental: 'environmental',
  accessibility: 'accessibility',
});
