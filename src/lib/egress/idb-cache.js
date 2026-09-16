/**
 * ============================================================
 *  EGRESS CACHE — L1 (memory) + L2 (IndexedDB)
 *
 *  Menyimpan body response REST Supabase agar request berulang
 *  tidak perlu menyentuh origin (origin egress = kuota termahal).
 *
 *  Bila IndexedDB tidak tersedia (private mode / happy-dom / SSR),
 *  otomatis turun ke memory-only tanpa error.
 * ============================================================
 *
 * @module lib/egress/idb-cache
 */

import { EGRESS_CONFIG } from './egress-config.js';

const DB_NAME = 'slf_egress_cache';
const DB_VERSION = 1;
const STORE = 'entries';
const MEM_ENTRY_LIMIT = 200;

/** Estimasi ukuran byte dari sebuah string. */
export function byteLength(str) {
  if (!str) return 0;
  if (typeof TextEncoder !== 'undefined') {
    try { return new TextEncoder().encode(str).length; } catch (_) { /* noop */ }
  }
  return str.length;
}

export class EgressCache {
  /**
   * @param {object} [options]
   * @param {number} [options.maxBytes] batas total byte cache
   * @param {boolean} [options.useIndexedDB] paksa matikan/nyalakan IDB
   */
  constructor(options = {}) {
    this.maxBytes = options.maxBytes || EGRESS_CONFIG.maxCacheBytes;
    this.useIndexedDB = options.useIndexedDB !== false;
    /** @type {Map<string, object>} L1 memory cache */
    this.memory = new Map();
    this.db = null;
    this.ready = null;
    this.stats = {
      entries: 0,
      bytes: 0,
      hits: 0,
      staleHits: 0,
      misses: 0,
      invalidations: 0,
      evicted: 0,
    };
  }

  /** Buka IndexedDB (sekali saja). Aman dipanggil berkali-kali. */
  async init() {
    if (this.ready) return this.ready;

    this.ready = (async () => {
      if (!this.useIndexedDB || typeof indexedDB === 'undefined') return;
      try {
        const { openDB } = await import('idb');
        this.db = await openDB(DB_NAME, DB_VERSION, {
          upgrade(db) {
            if (!db.objectStoreNames.contains(STORE)) {
              const store = db.createObjectStore(STORE, { keyPath: 'key' });
              store.createIndex('table', 'table', { unique: false });
              store.createIndex('expiresAt', 'expiresAt', { unique: false });
              store.createIndex('lastAccess', 'lastAccess', { unique: false });
            }
          },
        });
        await this.prune();
      } catch (err) {
        // Tidak fatal — jalan terus dengan memory-only
        this.db = null;
        if (EGRESS_CONFIG.debug) console.warn('[EgressCache] IndexedDB tidak tersedia:', err?.message);
      }
    })();

    return this.ready;
  }

  /**
   * Ambil entri cache.
   * @param {string} key
   * @param {{allowStale?: boolean}} [opts]
   * @returns {Promise<object|null>}
   */
  async get(key, opts = {}) {
    const { allowStale = false } = opts;

    let entry = this.memory.get(key) || null;

    if (!entry && this.db) {
      try {
        entry = await this.db.get(STORE, key);
        if (entry) this._toMemory(entry);
      } catch (_) { entry = null; }
    }

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    const age = Date.now() - (entry.storedAt || 0);
    const isFresh = Date.now() < (entry.expiresAt || 0);
    const withinStaleWindow = age <= EGRESS_CONFIG.maxStaleMs;

    // Entri basi hanya dikembalikan bila pemanggil mengizinkan
    // (dipakai adapter untuk revalidasi 304 & fallback saat offline).
    if (!isFresh && !(allowStale && withinStaleWindow)) {
      this.stats.misses++;
      return null;
    }

    entry._fresh = isFresh;
    entry._stale = !isFresh;
    entry.lastAccess = Date.now();
    this._toMemory(entry);
    // Persist lastAccess tanpa memblokir pemanggil
    if (this.db) {
      this.db.put(STORE, entry).catch(() => {});
    }

    if (isFresh) this.stats.hits++;
    else this.stats.staleHits++;

    return entry;
  }

  /**
   * Simpan entri cache.
   * @param {object} entry {key, scope, table, url, body, etag, status, contentType, expiresAt, bytes}
   */
  async set(entry) {
    const record = {
      ...entry,
      storedAt: Date.now(),
      lastAccess: Date.now(),
      bytes: entry.bytes || byteLength(entry.body),
    };
    this._toMemory(record);
    if (this.db) {
      try { await this.db.put(STORE, record); } catch (_) { /* noop */ }
    }
    await this.prune();
    return record;
  }

  /** Hapus semua entri untuk tabel tertentu (dipakai setelah operasi tulis). */
  async invalidateTable(table, scope = null) {
    if (!table) return 0;
    let removed = 0;
    const name = String(table).toLowerCase();

    for (const [key, entry] of this.memory) {
      if (entry.table === name && (scope === null || entry.scope === scope)) {
        this.memory.delete(key);
        removed++;
      }
    }

    if (this.db) {
      try {
        const all = await this.db.getAll(STORE);
        const tx = this.db.transaction(STORE, 'readwrite');
        await Promise.all(all.map(async (entry) => {
          if (entry.table !== name) return;
          if (scope !== null && entry.scope !== scope) return;
          removed++;
          await tx.store.delete(entry.key);
        }));
        await tx.done;
      } catch (_) { /* noop */ }
    }

    this.stats.invalidations += removed;
    return removed;
  }

  /** Hapus seluruh isi cache. */
  async clear() {
    this.memory.clear();
    if (this.db) {
      try { await this.db.clear(STORE); } catch (_) { /* noop */ }
    }
  }

  /**
   * Buang entri kedaluwarsa + jaga total byte tetap di bawah anggaran (LRU).
   */
  async prune() {
    const now = Date.now();
    let entries = [...this.memory.values()];

    if (this.db) {
      try { entries = await this.db.getAll(STORE); } catch (_) { /* pakai memory */ }
    }

    // 1. Buang yang melewati jendela stale
    const expired = entries.filter(e => (now - (e.storedAt || 0)) > EGRESS_CONFIG.maxStaleMs);
    for (const e of expired) {
      this.memory.delete(e.key);
      if (this.db) await this.db.delete(STORE, e.key).catch(() => {});
    }

    // 2. Kecilkan sampai di bawah anggaran byte (buang yang paling lama diakses)
    let total = entries
      .filter(e => !expired.includes(e))
      .reduce((sum, e) => sum + (e.bytes || 0), 0);

    if (total > this.maxBytes) {
      const sorted = entries
        .filter(e => !expired.includes(e))
        .sort((a, b) => (a.lastAccess || 0) - (b.lastAccess || 0));

      for (const e of sorted) {
        if (total <= this.maxBytes) break;
        total -= (e.bytes || 0);
        this.memory.delete(e.key);
        this.stats.evicted++;
        if (this.db) await this.db.delete(STORE, e.key).catch(() => {});
      }
    }

    this.stats.entries = entries.length - expired.length;
    this.stats.bytes = Math.max(0, total);
    return { removed: expired.length, bytes: this.stats.bytes };
  }

  /** Ringkasan isi cache untuk debugging. */
  async inspect() {
    let entries = [...this.memory.values()];
    if (this.db) {
      try { entries = await this.db.getAll(STORE); } catch (_) { /* noop */ }
    }
    return {
      ...this.stats,
      entries: entries.length,
      bytes: entries.reduce((s, e) => s + (e.bytes || 0), 0),
      byTable: entries.reduce((acc, e) => {
        acc[e.table] = acc[e.table] || { count: 0, bytes: 0 };
        acc[e.table].count++;
        acc[e.table].bytes += e.bytes || 0;
        return acc;
      }, {}),
    };
  }

  /** @private masukkan ke L1 memory + jaga batas jumlah entri. */
  _toMemory(entry) {
    this.memory.delete(entry.key);
    this.memory.set(entry.key, entry);
    while (this.memory.size > MEM_ENTRY_LIMIT) {
      const oldest = this.memory.keys().next().value;
      this.memory.delete(oldest);
    }
  }
}

export default EgressCache;
