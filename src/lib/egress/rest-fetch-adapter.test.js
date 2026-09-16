/**
 * Tes Egress Guard — memverifikasi bahwa byte yang keluar dari Supabase
 * benar-benar bisa ditekan (cache, dedup, revalidasi 304, invalidasi tulis).
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createGuardedFetch, tableFromUrl, deriveScope } from './rest-fetch-adapter.js';
import { EgressCache } from './idb-cache.js';
import { ttlForTable } from './egress-config.js';

const REST = 'https://proj.supabase.co/rest/v1';
const AUTH_HEADERS = { apikey: 'anon-key', authorization: 'Bearer fake.jwt.token' };

/** Mock fetch yang menghitung jumlah panggilan + byte yang "ditransfer". */
function makeMockFetch(handler) {
  const calls = [];
  const fn = vi.fn(async (input, init) => {
    const url = typeof input === 'string' ? input : input.url;
    calls.push({ url, init });
    return handler(url, init, calls.length);
  });
  fn.calls = calls;
  return fn;
}

const jsonResponse = (data, headers = {}) => new Response(JSON.stringify(data), {
  status: 200,
  headers: { 'content-type': 'application/json', ...headers },
});

function makeFetch(handler) {
  const cache = new EgressCache({ useIndexedDB: false });
  const baseFetch = makeMockFetch(handler);
  const guarded = createGuardedFetch({ baseFetch, cache });
  return { guarded, baseFetch, cache };
}

const get = (guarded, url, headers = AUTH_HEADERS, init = {}) =>
  guarded(url, { method: 'GET', headers, ...init });

describe('EgressGuard — pemetaan URL & scope', () => {
  it('mengambil nama tabel dari URL PostgREST', () => {
    expect(tableFromUrl(`${REST}/proyek?select=*`)).toBe('proyek');
    expect(tableFromUrl(`${REST}/checklist_items?proyek_id=eq.1`)).toBe('checklist_items');
    expect(tableFromUrl('https://proj.supabase.co/auth/v1/token')).toBeNull();
  });

  it('TTL master data jauh lebih panjang dari tabel proyek', () => {
    expect(ttlForTable('nspk_items')).toBeGreaterThan(ttlForTable('proyek'));
    expect(ttlForTable('master_kategori')).toBe(24 * 60 * 60 * 1000);
    expect(ttlForTable('notifications')).toBe(0); // dilarang cache
    expect(ttlForTable('audit_logs')).toBe(0);
  });

  it('scope cache berbeda untuk user berbeda', () => {
    const a = deriveScope(new Headers({ authorization: 'Bearer aaa.bbb.ccc' }));
    const b = deriveScope(new Headers({ authorization: 'Bearer xxx.yyy.zzz' }));
    expect(a).not.toBe(b);
    expect(deriveScope(new Headers())).toBe('anon');
  });
});

describe('EgressGuard — cache & dedup', () => {
  let h;

  beforeEach(() => {
    h = makeFetch(async () => jsonResponse([{ id: 1, nama: 'Gedung A' }], { etag: 'W/"abc1"' }));
  });

  it('request kedua dijawab dari cache (0 byte dari Supabase)', async () => {
    const url = `${REST}/proyek?select=id,nama`;

    const r1 = await get(h.guarded, url);
    const r2 = await get(h.guarded, url);

    expect(h.baseFetch).toHaveBeenCalledTimes(1);
    expect(r1.headers.get('x-slf-egress')).toBe('MISS');
    expect(r2.headers.get('x-slf-egress')).toBe('HIT');
    expect(await r2.json()).toEqual([{ id: 1, nama: 'Gedung A' }]);

    const stats = h.guarded.__getStats();
    expect(stats.cacheHits).toBe(1);
    expect(stats.bytesSaved).toBeGreaterThan(0);
    expect(stats.savedPercent).toBeGreaterThan(0);
  });

  it('N request identik bersamaan → hanya 1 ke jaringan (dedup)', async () => {
    const url = `${REST}/checklist_items?select=id`;
    await Promise.all([
      get(h.guarded, url),
      get(h.guarded, url),
      get(h.guarded, url),
    ]);
    expect(h.baseFetch).toHaveBeenCalledTimes(1);
    expect(h.guarded.__getStats().deduped).toBeGreaterThanOrEqual(2);
  });

  it('cache kedaluwarsa → dikirim ulang (MISS), bukan HIT', async () => {
    const url = `${REST}/proyek?select=id`;
    const scope = deriveScope(new Headers(AUTH_HEADERS));
    await h.cache.set({
      key: `${scope}|${url}`, scope, table: 'proyek', url,
      body: '[]', bytes: 2, status: 200,
      expiresAt: Date.now() - 1,   // sudah basi
    });
    const res = await get(h.guarded, url);
    expect(res.headers.get('x-slf-egress')).toBe('MISS');
    expect(h.baseFetch).toHaveBeenCalledTimes(1);
  });
});

describe('EgressGuard — revalidasi If-None-Match (304)', () => {
  it('304 memakai body lama tanpa transfer ulang', async () => {
    let n = 0;
    const h = makeFetch(async () => {
      n++;
      if (n === 1) return jsonResponse({ id: 7, payload: 'x'.repeat(500) }, { etag: 'W/"v1"' });
      return new Response(null, { status: 304, headers: { etag: 'W/"v1"' } });
    });

    const url = `${REST}/laporan?select=id,payload`;
    await get(h.guarded, url);

    // paksa entri jadi basi supaya revalidasi dipicu
    const entries = [...h.cache.memory.values()];
    entries[0].expiresAt = Date.now() - 1;

    const res = await get(h.guarded, url);

    expect(h.baseFetch).toHaveBeenCalledTimes(2);
    const secondCall = h.baseFetch.calls[1];
    const sentHeaders = new Headers(secondCall.init.headers);
    expect(sentHeaders.get('if-none-match')).toBe('W/"v1"');

    expect(res.headers.get('x-slf-egress')).toBe('REVALIDATED');
    expect((await res.json()).payload).toHaveLength(500);

    const stats = h.guarded.__getStats();
    expect(stats.notModified).toBe(1);
    expect(stats.bytesSaved).toBeGreaterThan(500);
  });
});

describe('EgressGuard — operasi tulis menginvalidasi cache', () => {
  it('PATCH lalu GET berikutnya mengambil data baru', async () => {
    let value = 'lama';
    const h = makeFetch(async (url, init) => {
      if ((init?.method || 'GET').toUpperCase() === 'PATCH') return jsonResponse([{ ok: true }]);
      return jsonResponse([{ nama: value }]);
    });

    const url = `${REST}/proyek?select=nama`;
    await get(h.guarded, url);
    expect(h.baseFetch).toHaveBeenCalledTimes(1);

    value = 'baru';
    await h.guarded(`${REST}/proyek?id=eq.1`, { method: 'PATCH', headers: AUTH_HEADERS, body: '{}' });

    const res = await get(h.guarded, url);
    expect(await res.json()).toEqual([{ nama: 'baru' }]);
    expect(h.baseFetch).toHaveBeenCalledTimes(3);
  });
});

describe('EgressGuard — api yang TIDAK boleh di-cache', () => {
  it('endpoint auth selalu ke jaringan', async () => {
    const h = makeFetch(async () => jsonResponse({ access_token: 't' }));
    const url = 'https://proj.supabase.co/auth/v1/token?grant_type=password';
    await get(h.guarded, url);
    await get(h.guarded, url);
    expect(h.baseFetch).toHaveBeenCalledTimes(2);
  });

  it('tabel notifications & audit_logs selalu ke jaringan', async () => {
    const h = makeFetch(async () => jsonResponse([{ id: 1 }]));
    const n = `${REST}/notifications?select=*`;
    const a = `${REST}/audit_logs?select=*`;
    await get(h.guarded, n); await get(h.guarded, n);
    await get(h.guarded, a); await get(h.guarded, a);
    expect(h.baseFetch).toHaveBeenCalledTimes(4);
  });

  it('POST tidak di-cache', async () => {
    const h = makeFetch(async () => jsonResponse([{ id: 1 }]));
    await h.guarded(`${REST}/proyek`, { method: 'POST', headers: AUTH_HEADERS, body: '{}' });
    await h.guarded(`${REST}/proyek`, { method: 'POST', headers: AUTH_HEADERS, body: '{}' });
    expect(h.baseFetch).toHaveBeenCalledTimes(2);
  });
});

describe('EgressGuard — ketahanan offline & error', () => {
  it('saat jaringan mati, data basi tetap disajikan (mode lapangan)', async () => {
    let fail = false;
    const h = makeFetch(async () => {
      if (fail) throw new Error('Failed to fetch');
      return jsonResponse({ id: 3, nama: 'Proyek Lapangan' });
    });

    const url = `${REST}/proyek?select=id,nama&id=eq.3`;
    await get(h.guarded, url);

    // buat entri basi, lalu matikan jaringan
    [...h.cache.memory.values()].forEach(e => { e.expiresAt = Date.now() - 1; });
    fail = true;

    const res = await get(h.guarded, url);
    expect(res.headers.get('x-slf-egress')).toBe('STALE-OFFLINE');
    expect((await res.json()).nama).toBe('Proyek Lapangan');
  });

  it('error 500 → pakai cache bila ada (dashboard tidak blank)', async () => {
    let mode = 'ok';
    const h = makeFetch(async () => {
      if (mode === 'err') return new Response('boom', { status: 500 });
      return jsonResponse({ ok: 1 });
    });

    const url = `${REST}/analisis?select=id`;
    await get(h.guarded, url);
    [...h.cache.memory.values()].forEach(e => { e.expiresAt = Date.now() - 1; });
    mode = 'err';

    const res = await get(h.guarded, url);
    expect(res.headers.get('x-slf-egress')).toBe('STALE-ERROR');
  });

  it('tanpa cache + jaringan mati → error diteruskan (tidak menelan bug)', async () => {
    const h = makeFetch(async () => { throw new Error('offline'); });
    await expect(get(h.guarded, `${REST}/proyek?select=id`)).rejects.toThrow('offline');
  });
});

describe('EgressGuard — meteran byte', () => {
  it('menghitung byte masuk dan byte yang dihemat', async () => {
    const h = makeFetch(async () => jsonResponse({ big: 'y'.repeat(2000) }));
    const url = `${REST}/settings?select=big`;

    await get(h.guarded, url);
    await get(h.guarded, url);
    await get(h.guarded, url);

    const s = h.guarded.__getStats();
    expect(s.bytesIn).toBeGreaterThan(2000);
    expect(s.bytesSaved).toBeGreaterThan(4000);
    expect(s.savedPercent).toBeGreaterThan(50);
    expect(s.requests).toBe(3);
    expect(s.networkRequests).toBe(1);
  });
});
