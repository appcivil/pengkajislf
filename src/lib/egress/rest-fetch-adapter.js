/**
 * ============================================================
 *  SUPABASE REST FETCH ADAPTER (EGRESS GUARD)
 *
 *  Dipasang sebagai `global.fetch` pada Supabase createClient,
 *  sehingga SEMUA query REST otomatis melalui lapisan ini.
 *
 *  Yang dilakukan:
 *   1. CACHE      — GET yang masih segar dijawab dari cache lokal
 *                   (0 byte keluar dari Supabase).
 *   2. REVALIDASI — GET yang basi dikirim dengan `If-None-Match`.
 *                   Bila server menjawab 304, body tidak dikirim
 *                   ulang (hanya header) → egress nyaris nol.
 *   3. DEDUP      — N request identik yang berjalan bersamaan
 *                   hanya menghasilkan 1 request jaringan.
 *   4. INVALIDASI — Setiap POST/PATCH/PUT/DELETE membersihkan
 *                   cache tabel terkait agar data tidak basi.
 *   5. METERING   — Menghitung byte masuk / byte yang dihemat
 *                   sehingga kebocoran egress bisa diukur.
 *
 *  TIDAK pernah di-cache: /auth/v1, /realtime/v1, signed URL,
 *  dan semua non-GET.
 * ============================================================
 *
 * @module lib/egress/rest-fetch-adapter
 */

import { EGRESS_CONFIG, ttlForTable } from './egress-config.js';
import { EgressCache, byteLength } from './idb-cache.js';

/** FNV-1a 32-bit — hash cepat untuk scope user (bukan untuk keamanan). */
export function fnv1a(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}

/** Ambil klaim `sub` dari JWT tanpa verifikasi (hanya untuk scoping cache). */
function jwtSubject(token) {
  try {
    const raw = String(token).replace(/^Bearer\s+/i, '').split('.')[1];
    if (!raw) return null;
    const base64 = raw.replace(/-/g, '+').replace(/_/g, '/');
    const json = typeof atob === 'function'
      ? atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '='))
      : Buffer.from(base64, 'base64').toString('utf8');
    return JSON.parse(json)?.sub || null;
  } catch (_) {
    return null;
  }
}

/**
 * Scope cache: memastikan data user A tidak pernah dibaca user B
 * pada perangkat yang sama.
 */
export function deriveScope(headers) {
  let auth = '';
  try {
    auth = headers?.get?.('authorization') || headers?.get?.('apikey') || '';
  } catch (_) {
    auth = '';
  }
  if (!auth) return 'anon';
  const sub = jwtSubject(auth);
  return sub ? `u:${sub}` : `h:${fnv1a(auth)}`;
}

/** Ekstrak nama tabel dari URL PostgREST. */
export function tableFromUrl(url) {
  const match = String(url).match(/\/rest\/v1\/([^/?#]+)/i);
  if (!match) return null;
  const name = decodeURIComponent(match[1]);
  return name && name !== '' ? name.toLowerCase() : null;
}

const headersToObject = (headers) => {
  const out = {};
  if (!headers) return out;
  if (typeof headers.forEach === 'function') headers.forEach((v, k) => { out[k] = v; });
  else Object.entries(headers).forEach(([k, v]) => { out[k] = v; });
  return out;
};

/**
 * Buat custom fetch untuk Supabase.
 *
 * @param {object} [options]
 * @param {typeof fetch} [options.baseFetch] fetch asli (default: window.fetch yang terikat)
 * @param {EgressCache} [options.cache]
 * @param {(event: object) => void} [options.onEvent] hook observability
 * @returns {typeof fetch}
 */
export function createGuardedFetch(options = {}) {
  const baseFetch = options.baseFetch
    || (typeof globalThis !== 'undefined' && globalThis.fetch ? globalThis.fetch.bind(globalThis) : null);
  const cache = options.cache || new EgressCache();
  const onEvent = options.onEvent || (() => {});
  /** @type {Map<string, Promise<Response>>} single-flight registry */
  const inflight = new Map();

  const meter = {
    bytesIn: 0,
    bytesSaved: 0,
    requests: 0,
    networkRequests: 0,
    cacheHits: 0,
    revalidations: 0,
    notModified: 0,
    deduped: 0,
    errors: 0,
    startedAt: Date.now(),
  };

  let warnedBudget = false;

  const record = (event) => {
    if (EGRESS_CONFIG.debug) console.debug('[EgressGuard]', event.type, event);
    onEvent(event);
  };

  const addBytesIn = (bytes) => {
    meter.bytesIn += bytes;
    if (!warnedBudget && meter.bytesIn > EGRESS_CONFIG.sessionBudgetBytes) {
      warnedBudget = true;
      console.warn(
        `[EgressGuard] ⚠️ Sesi ini sudah menarik ${(meter.bytesIn / 1048576).toFixed(1)} MB dari Supabase ` +
        `(anggaran ${(EGRESS_CONFIG.sessionBudgetBytes / 1048576).toFixed(0)} MB). ` +
        'Periksa query yang tidak perlu via window.__slfEgress.report()'
      );
    }
  };

  const isCacheable = (url, method) => {
    if (!EGRESS_CONFIG.enabled) return false;
    if (String(method).toUpperCase() !== 'GET') return false;
    const u = String(url);
    if (EGRESS_CONFIG.neverCachePatterns.some(p => u.includes(p))) return false;
    if (!EGRESS_CONFIG.cacheablePathPatterns.some(p => u.includes(p))) return false;
    return true;
  };

  /** Bangun Response dari entri cache. */
  const responseFromEntry = (entry, source) => new Response(entry.body, {
    status: entry.status || 200,
    statusText: 'OK',
    headers: {
      'content-type': entry.contentType || 'application/json; charset=utf-8',
      'x-slf-egress': source,
    },
  });

  /**
   * Beri penanda asal-usul response (MISS/HIT/REVALIDATED/...) tanpa
   * mengubah body — memudahkan debugging lewat Network tab.
   */
  const tagResponse = (res, tag) => {
    try {
      const headers = new Headers(res.headers);
      headers.set('x-slf-egress', tag);
      // Body dari fetch() sudah didekode. Header ini harus dibuang agar
      // browser tidak mencoba mendekode ulang / salah menghitung panjang.
      headers.delete('content-encoding');
      headers.delete('content-length');
      return new Response(res.body, {
        status: res.status,
        statusText: res.statusText,
        headers,
      });
    } catch (_) {
      return res;
    }
  };

  const guardedFetch = async (input, init = {}) => {
    if (!baseFetch) throw new Error('[EgressGuard] fetch tidak tersedia di environment ini');

    const url = typeof input === 'string' ? input : (input?.url || String(input));
    const method = (init?.method || input?.method || 'GET').toUpperCase();

    // ---- Non-GET: teruskan + invalidasi cache tabel ----
    if (method !== 'GET') {
      const res = await baseFetch(input, init);
      const table = tableFromUrl(url);
      if (table && res.ok) {
        await cache.invalidateTable(table);
        record({ type: 'invalidate', table, method });
      }
      return res;
    }

    if (!isCacheable(url, method)) {
      meter.requests++;
      meter.networkRequests++;
      const res = await baseFetch(input, init);
      return res;
    }

    await cache.init();

    // ---- Kumpulkan header untuk scope & conditional request ----
    // Catatan: supabase-js selalu memakai fetch(urlString, { headers }),
    // tetapi bila suatu saat `input` berupa Request, header-nya tetap dibaca
    // agar Authorization tidak pernah hilang.
    let headers;
    try {
      headers = new Headers(init?.headers || (typeof input === 'object' ? input.headers : undefined));
    } catch (_) {
      headers = new Headers();
    }

    const scope = deriveScope(headers);
    const table = tableFromUrl(url);
    const ttl = ttlForTable(table);
    const key = `${scope}|${url}`;

    // ---- Tabel yang dilarang cache: langsung network ----
    if (ttl === 0) {
      meter.requests++;
      meter.networkRequests++;
      return baseFetch(input, init);
    }

    meter.requests++;

    // ---- 1. Cek cache (basi pun diambil, untuk revalidasi & fallback offline) ----
    const cached = await cache.get(key, { allowStale: true });
    if (cached && cached._fresh) {
      meter.cacheHits++;
      const bytes = cached.bytes || byteLength(cached.body);
      meter.bytesSaved += bytes;
      record({ type: 'hit', table, url, bytes });
      return responseFromEntry(cached, 'HIT');
    }

    // ---- 2. Dedup: request identik yang masih berjalan ----
    if (inflight.has(key)) {
      meter.deduped++;
      record({ type: 'dedup', table, url });
      return inflight.get(key);
    }

    const run = (async () => {
      // ---- 3. Cache basi → conditional request (If-None-Match) ----
      const reqInit = { ...init };
      // Prioritaskan header dari init, lalu fallback ke header Request (bila ada),
      // supaya Authorization/apikey tidak pernah terlepas.
      const reqHeaders = new Headers(
        reqInit.headers || (typeof input === 'object' ? input.headers : undefined) || undefined
      );
      let revalidating = false;

      if (cached && cached.etag) {
        reqHeaders.set('if-none-match', cached.etag);
        revalidating = true;
      }
      reqInit.headers = reqHeaders;

      let res;
      try {
        res = await baseFetch(input, reqInit);
      } catch (err) {
        // ---- Offline / error jaringan → sajikan data basi bila ada ----
        if (cached) {
          meter.cacheHits++;
          meter.bytesSaved += cached.bytes || 0;
          record({ type: 'stale-fallback', table, url, reason: String(err?.message || err) });
          return responseFromEntry(cached, 'STALE-OFFLINE');
        }
        meter.errors++;
        throw err;
      }

      meter.networkRequests++;

      // ---- 4. 304 Not Modified → pakai body lama, perpanjang masa segar ----
      if (res.status === 304 && cached) {
        meter.revalidations++;
        meter.notModified++;
        meter.bytesSaved += cached.bytes || 0;   // body TIDAK ditransfer ulang
        addBytesIn(32);                           // hanya header
        const refreshed = {
          ...cached,
          expiresAt: Date.now() + ttl,
          storedAt: Date.now(),
          etag: cached.etag,
        };
        await cache.set(refreshed);
        record({ type: 'revalidated-304', table, url, savedBytes: cached.bytes || 0 });
        return responseFromEntry(refreshed, 'REVALIDATED');
      }

      if (!res.ok) {
        // 5xx / 42x → kalau ada cache, lebih baik sajikan daripada gagal
        if (cached && res.status >= 500) {
          record({ type: 'stale-fallback', table, url, status: res.status });
          return responseFromEntry(cached, 'STALE-ERROR');
        }
        return res;
      }

      // ---- 5. Simpan response sukses ke cache ----
      const body = await res.clone().text();
      const bytes = byteLength(body);
      addBytesIn(bytes);

      const cc = (res.headers.get('cache-control') || '').toLowerCase();
      const storable = !cc.includes('no-store');

      if (storable) {
        const contentType = res.headers.get('content-type') || 'application/json; charset=utf-8';
        await cache.set({
          key,
          scope,
          table,
          url,
          body,
          bytes,
          status: res.status,
          contentType,
          etag: res.headers.get('etag') || null,
          expiresAt: Date.now() + ttl,
        });
        record({
          type: revalidating ? 'revalidated-200' : 'miss',
          table,
          url,
          bytes,
          ttlMs: ttl,
        });
      }

      return storable
        ? tagResponse(res, revalidating ? 'REVALIDATED-200' : 'MISS')
        : res;
    })();

    inflight.set(key, run);
    try {
      return await run;
    } finally {
      inflight.delete(key);
    }
  };

  /** Statistik egress sesi ini. */
  const getStats = () => {
    const total = meter.bytesIn + meter.bytesSaved;
    return {
      ...meter,
      cache: cache.stats,
      savedPercent: total > 0 ? Number(((meter.bytesSaved / total) * 100).toFixed(1)) : 0,
      uptimeMs: Date.now() - meter.startedAt,
      bytesInMB: Number((meter.bytesIn / 1048576).toFixed(3)),
      bytesSavedMB: Number((meter.bytesSaved / 1048576).toFixed(3)),
    };
  };

  /** Cetak laporan ringkas (dipakai window.__slfEgress.report()). */
  const report = async () => {
    const stats = getStats();
    const table = await cache.inspect();
     
    console.group('%c[EgressGuard] Laporan Sesi', 'color:#34d399;font-weight:bold');
    console.table({
      'Request total': stats.requests,
      'Ke jaringan': stats.networkRequests,
      'Cache HIT': stats.cacheHits,
      'Dedup': stats.deduped,
      '304 Not Modified': stats.notModified,
      'Byte masuk (MB)': stats.bytesInMB,
      'Byte dihemat (MB)': stats.bytesSavedMB,
      'Hemat (%)': stats.savedPercent,
    });
    console.log('Cache per tabel:', table.byTable);
    console.groupEnd();
    return stats;
  };

  return Object.assign(guardedFetch, {
    /** Akses langsung ke cache (untuk invalidasi manual). */
    __cache: cache,
    __meter: meter,
    __getStats: getStats,
    __report: report,
    __invalidateTable: (table, scope) => cache.invalidateTable(table, scope),
    /** Bersihkan SEMUA cache — dipanggil saat logout agar data user tidak tertinggal. */
    __reset: async () => {
      await cache.clear();
      inflight.clear();
    },
  });
}

export default createGuardedFetch;
