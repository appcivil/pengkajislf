/**
 * ============================================================
 *  EGRESS GUARD — KONFIGURASI
 *  Mengatur seberapa agresif cache & proteksi egress Supabase.
 *
 *  Semua nilai dapat dioverride lewat .env (prefix VITE_).
 *  Untuk mematikan sepenuhnya: VITE_EGRESS_GUARD=off
 * ============================================================
 *
 * @module lib/egress/egress-config
 */

const env = (typeof import.meta !== 'undefined' && import.meta.env) || {};

const num = (v, fallback) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

/**
 * TTL (masa segar) cache per tabel.
 * Semakin jarang data berubah, semakin panjang TTL-nya.
 * TTL 0 = JANGAN pernah di-cache (data realtime / sensitif).
 */
export const TABLE_TTL_MS = Object.freeze({
  // — Referensi / master data: hampir tidak pernah berubah —
  settings:              24 * HOUR,
  pengaturan:            24 * HOUR,
  nspk:                  24 * HOUR,
  nspk_items:            24 * HOUR,
  referensi:             24 * HOUR,
  master_aspek:          24 * HOUR,
  aspek_slf:             24 * HOUR,
  checklist_templates:   24 * HOUR,
  checklist_master:      24 * HOUR,
  simak_templates:       24 * HOUR,
  users_profile:          6 * HOUR,
  profil:                 6 * HOUR,
  organisasi:             6 * HOUR,

  // — Data proyek / audit: boleh agak basi, tapi tidak lama —
  proyek:                    5 * MINUTE,
  proyek_files:              5 * MINUTE,
  checklist_items:           5 * MINUTE,
  checklist_batches:         5 * MINUTE,
  analisis:                  5 * MINUTE,
  analisis_ai:               5 * MINUTE,
  laporan:                   5 * MINUTE,
  ndt_tests:                 5 * MINUTE,
  egress_data:               5 * MINUTE,
  electrical_data:           5 * MINUTE,
  fire_data:                 5 * MINUTE,
  accessibility_data:        5 * MINUTE,
  field_data:                5 * MINUTE,

  // — Jangan pernah di-cache: payload berubah terus & milik user —
  notifications:             0,
  audit_logs:                0,
  audit_log:                 0,
  login_attempts:            0,
  ai_jobs:                   0,
  ai_job_queue:              0,
  realtime_events:           0,
  sync_queue:                0,
});

/** Tabel yang tidak boleh di-cache sama sekali (selalu network). */
export const NO_CACHE_PREFIXES = Object.freeze([
  'notifications',
  'audit_log',
  'login_attempts',
  'ai_job',
  'realtime',
  'sync_queue',
]);

/** Prefix tabel yang otomatis dianggap master data (TTL panjang). */
export const MASTER_PREFIXES = Object.freeze([
  'master_',
  'ref_',
  'nspk',
  'referensi',
  'template',
]);

export const EGRESS_CONFIG = Object.freeze({
  /** Master switch. `VITE_EGRESS_GUARD=off` → semua wrap dilewati (network langsung). */
  enabled: env.VITE_EGRESS_GUARD !== 'off',

  /** Log detail tiap HIT/MISS/REVALIDATE ke console. */
  debug: env.VITE_EGRESS_DEBUG === 'on',

  /** TTL default untuk tabel yang tidak ada di TABLE_TTL_MS. */
  defaultTtlMs: num(env.VITE_EGRESS_CACHE_TTL_MS, 30 * 1000),

  /**
   * Umur maksimum entri basi yang masih boleh disajikan saat OFFLINE
   * atau saat server error. 7 hari = aman untuk kerja lapangan.
   */
  maxStaleMs: num(env.VITE_EGRESS_MAX_STALE_MS, 7 * 24 * HOUR),

  /** Batas total ukuran cache di disk (MB). Default 12 MB. */
  maxCacheBytes: num(env.VITE_EGRESS_CACHE_MB, 12) * 1024 * 1024,

  /**
   * Anggaran byte per sesi (soft warning). Bukan hard limit — hanya
   * untuk memunculkan peringatan agar kebocoran egress cepat terdeteksi.
   */
  sessionBudgetBytes: num(env.VITE_EGRESS_BUDGET_MB, 30) * 1024 * 1024,

  /** Tampilkan statistik egress di console setiap N ms (0 = mati). */
  reportIntervalMs: num(env.VITE_EGRESS_REPORT_MS, 5 * MINUTE),

  /** Kirim statistik ke window.__slfEgress untuk debugging manual. */
  exposeGlobal: true,

  /** Pola URL REST yang boleh di-cache. */
  cacheablePathPatterns: ['/rest/v1/'],

  /** Pola URL yang tidak boleh di-cache walau GET (auth, realtime, dst). */
  neverCachePatterns: [
    '/auth/v1/',
    '/realtime/v1/',
    '/storage/v1/object/sign/',
    '/storage/v1/object/upload/',
    '/storage/v1/object/authenticated/',
  ],

  TABLE_TTL_MS,
  NO_CACHE_PREFIXES,
  MASTER_PREFIXES,
});

/**
 * Tentukan TTL (ms) untuk sebuah tabel.
 * @param {string} table
 * @returns {number} 0 = tidak boleh di-cache
 */
export function ttlForTable(table) {
  if (!table) return EGRESS_CONFIG.defaultTtlMs;

  const name = String(table).toLowerCase();
  if (EGRESS_CONFIG.NO_CACHE_PREFIXES.some(p => name.startsWith(p))) return 0;
  if (Object.prototype.hasOwnProperty.call(TABLE_TTL_MS, name)) return TABLE_TTL_MS[name];

  // Cocokkan prefix (mis. "master_kategori" → master data)
  for (const [key, ttl] of Object.entries(TABLE_TTL_MS)) {
    if (name.startsWith(key)) return ttl;
  }
  if (EGRESS_CONFIG.MASTER_PREFIXES.some(p => name.startsWith(p))) return 24 * 60 * 60 * 1000;

  return EGRESS_CONFIG.defaultTtlMs;
}

export default EGRESS_CONFIG;
