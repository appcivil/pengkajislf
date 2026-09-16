/**
 * ============================================================
 *  EGRESS GUARD — PUBLIC API
 *
 *  Cara pakai (sudah dipasang otomatis di src/lib/supabase.js):
 *
 *    import { supabase } from './lib/supabase.js';
 *    const { data } = await supabase.from('proyek').select('id,nama'); // ← otomatis di-cache
 *
 *  Debug dari console browser:
 *    await window.__slfEgress.report()      // ringkasan byte & HIT/MISS
 *    window.__slfEgress.stats()             // objek statistik mentah
 *    await window.__slfEgress.invalidate('proyek')
 * ============================================================
 *
 * @module lib/egress
 */

import { EGRESS_CONFIG, ttlForTable } from './egress-config.js';
import { EgressCache } from './idb-cache.js';
import { createGuardedFetch, tableFromUrl, deriveScope } from './rest-fetch-adapter.js';

/** Cache bersama (satu instance untuk seluruh aplikasi). */
export const egressCache = new EgressCache();

/** Instance fetch yang di-guard (dibuat sekali, lalu dipakai supabase-js). */
export const guardedFetch = createGuardedFetch({ cache: egressCache });

/**
 * Pasang helper debugging ke window (aman: tidak mengubah perilaku).
 * @param {typeof guardedFetch} [instance]
 */
export function exposeEgressControls(instance = guardedFetch) {
  if (!EGRESS_CONFIG.exposeGlobal) return;
  if (typeof window === 'undefined') return;

  window.__slfEgress = {
    config: EGRESS_CONFIG,
    stats: () => instance.__getStats(),
    report: () => instance.__report(),
    invalidate: (table) => instance.__invalidateTable(table),
    reset: () => instance.__reset(),
    cacheInfo: () => egressCache.inspect(),
    ttlFor: (table) => ttlForTable(table),
    tableFromUrl,
    deriveScope,
  };
}

/**
 * Helper: cek keberadaan data TANPA menarik isinya.
 * Menggantikan pola `select('*')` yang hanya dipakai untuk `length > 0`.
 *
 *   const { exists } = await dataExists(supabase, 'analisis', q => q.eq('proyek_id', id));
 *
 * Egress: hanya header + 1 baris (limit 1), bukan seluruh tabel.
 *
 * @param {object} client
 * @param {string} table
 * @param {(q: any) => any} [filter]
 * @returns {Promise<{exists: boolean, count: number|null, error: any}>}
 */
export async function dataExists(client, table, filter = (q) => q) {
  const query = filter(client.from(table).select('id', { count: 'exact', head: true }).limit(1));
  const { count, error } = await query;
  if (error) return { exists: false, count: null, error };
  return { exists: (count || 0) > 0, count: count ?? null, error: null };
}

/**
 * Helper: paksa proyeksi kolom agar tidak ada kolom besar yang ikut terkirim.
 *
 *   const q = narrowSelect(supabase, 'proyek', 'id,nama,alamat'); // bukan select('*')
 *
 * @param {object} client
 * @param {string} table
 * @param {string} columns
 */
export function narrowSelect(client, table, columns) {
  if (!columns || columns === '*') {
    console.warn(`[EgressGuard] narrowSelect('${table}') tanpa kolom spesifik → egress besar.`);
  }
  return client.from(table).select(columns);
}

export { EGRESS_CONFIG, ttlForTable, EgressCache, createGuardedFetch, tableFromUrl, deriveScope };
export default guardedFetch;
