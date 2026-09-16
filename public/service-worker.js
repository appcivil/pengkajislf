/**
 * ============================================================
 *  SERVICE WORKER — Smart AI Pengkaji SLF
 *
 *  Fokus versi ini:
 *   1. PERBAIKAN: precache tidak lagi memakai cache.addAll() yang
 *      gagal total bila satu file hilang (file /src/main.js,
 *      /assets/hero.png, /icons/icon-192x192.png tidak ada di build,
 *      sehingga install SW sebelumnya SELALU gagal = SW tidak aktif).
 *      Sekarang tiap file dicache terpisah dan kegagalan diabaikan.
 *
 *   2. EGRESS: objek Supabase Storage (foto/evidence/lampiran)
 *      disajikan cache-first dengan masa simpan panjang, sehingga
 *      membuka halaman yang sama berulang kali TIDAK menarik ulang
 *      byte dari CDN Supabase.
 *
 *  Catatan pembagian tugas:
 *   - Request REST (/rest/v1/...) TIDAK ditangani di sini, karena
 *     sudah ditangani Egress Guard di aplikasi
 *     (src/lib/egress/rest-fetch-adapter.js) yang punya TTL per-tabel,
 *     revalidasi ETag/304, dedup, dan meteran byte.
 *   - /auth/v1, /realtime/v1, /functions/v1 selalu langsung ke jaringan.
 * ============================================================
 */

const CACHE_VERSION = 'v2.2';
const STATIC_CACHE = `slf-static-${CACHE_VERSION}`;
const STORAGE_CACHE = `slf-supabase-storage-${CACHE_VERSION}`;
const RUNTIME_CACHE = `slf-runtime-${CACHE_VERSION}`;
const OWNED_CACHES = [STATIC_CACHE, STORAGE_CACHE, RUNTIME_CACHE];

/** Masa simpan objek Supabase Storage (30 hari) — file proyek bersifat tetap. */
const STORAGE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Aset yang memang ada di build. Sengaja KONSERVATIF: hanya file
 * yang dijamin ada. Kegagalan satu file tidak boleh menggagalkan install.
 */
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/favicon-32.png',
  '/manifest.json',
  '/logo-app.png',
  // Pustaka tampilan yang disalin ke dalam aplikasi (dulu dari CDN).
  // Tanpa keduanya di cache, aplikasi offline tampil tanpa ikon sama sekali
  // dan peta tidak bergaya — padahal justru saat offline-lah aplikasi ini
  // paling dibutuhkan di lapangan.
  '/vendor/fontawesome/all.min.css',
  '/vendor/fontawesome/webfonts/fa-solid-900.woff2',
  '/vendor/fontawesome/webfonts/fa-regular-400.woff2',
  '/vendor/fontawesome/webfonts/fa-brands-400.woff2',
  '/vendor/leaflet/leaflet.css',
  '/vendor/leaflet/leaflet.js',
  '/vendor/leaflet/images/marker-icon.png',
  '/vendor/leaflet/images/marker-shadow.png',
  '/vendor/leaflet/images/layers.png',
];

// ------------------------------------------------------------
// INSTALL
// ------------------------------------------------------------
self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(STATIC_CACHE);

    // Tolerant precache: Promise.allSettled, bukan addAll.
    // Satu 404 tidak lagi membatalkan seluruh instalasi service worker.
    const results = await Promise.allSettled(
      PRECACHE_ASSETS.map(async (url) => {
        try {
          const res = await fetch(url, { cache: 'no-cache' });
          if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
          await cache.put(url, res);
          return url;
        } catch (err) {
          console.warn('[SW] Precache dilewati:', err.message);
          return null;
        }
      })
    );

    const ok = results.filter(r => r.status === 'fulfilled' && r.value).length;
    console.log(`[SW] Precache selesai: ${ok}/${PRECACHE_ASSETS.length} aset.`);
    await self.skipWaiting();
  })());
});

// ------------------------------------------------------------
// ACTIVATE — bersihkan cache versi lama
// ------------------------------------------------------------
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(
      names
        .filter((name) => name.startsWith('slf-') && !OWNED_CACHES.includes(name))
        .map((name) => {
          console.log('[SW] Menghapus cache lama:', name);
          return caches.delete(name);
        })
    );
    await self.clients.claim();
    console.log('[SW] Aktif — versi', CACHE_VERSION);
  })());
});

// ------------------------------------------------------------
// FETCH
// ------------------------------------------------------------
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  let url;
  try { url = new URL(request.url); } catch (_) { return; }
  if (!url.protocol.startsWith('http')) return;

  // --- 1. Auth & Realtime: JANGAN pernah di-cache (keamanan + kesegaran) ---
  if (url.pathname.includes('/auth/v1/') || url.pathname.includes('/realtime/v1/')) return;

  // --- 2. Supabase Storage: cache-first (ini penghemat egress terbesar) ---
  if (url.hostname.includes('supabase.co') && url.pathname.includes('/storage/v1/object/')) {
    // Signed/upload endpoint tetap langsung ke jaringan
    if (url.pathname.includes('/object/sign/') ||
        url.pathname.includes('/object/upload/') ||
        url.pathname.includes('/object/authenticated/')) return;
    event.respondWith(storageCacheFirst(request));
    return;
  }

  // --- 3. REST: ditangani Egress Guard di aplikasi (jangan dobel) ---
  if (url.pathname.includes('/rest/v1/')) return;

  // --- 4. Edge Functions: selalu jaringan ---
  if (url.pathname.includes('/functions/v1/')) return;

  // --- 5. Static same-origin assets: stale-while-revalidate ---
  if (url.origin === self.location.origin) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }
});

/**
 * Cache-first untuk objek Storage (foto, lampiran, template).
 * Bila ada di cache dan belum kedaluwarsa → 0 byte dari Supabase.
 */
async function storageCacheFirst(request) {
  const cache = await caches.open(STORAGE_CACHE);
  const cached = await cache.match(request);

  if (cached) {
    const storedAt = Number(cached.headers.get('x-slf-cached-at') || 0);
    if (storedAt && (Date.now() - storedAt) < STORAGE_TTL_MS) {
      return cached;   // HIT: tidak ada egress
    }
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      // Simpan salinan dengan cap waktu
      const headers = new Headers(response.headers);
      headers.set('x-slf-cached-at', String(Date.now()));
      const body = await response.clone().blob();
      cache.put(request, new Response(body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      })).catch(() => {});
    }
    return response;
  } catch (err) {
    if (cached) return cached;   // offline → sajikan salinan lama
    return new Response('Offline — berkas belum tersedia di cache', {
      status: 503,
      headers: { 'content-type': 'text/plain; charset=utf-8' },
    });
  }
}

/** Stale-while-revalidate untuk aset statis same-origin. */
async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);

  const network = fetch(request)
    .then((response) => {
      if (response && response.ok && response.type !== 'opaque') {
        cache.put(request, response.clone()).catch(() => {});
      }
      return response;
    })
    .catch(() => null);

  if (cached) return cached;

  const fresh = await network;
  if (fresh) return fresh;

  if (request.destination === 'document' || request.mode === 'navigate') {
    const shell = await caches.match('/index.html');
    if (shell) return shell;
  }

  return new Response('Offline — sumber daya tidak tersedia', {
    status: 503,
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  });
}

// ------------------------------------------------------------
// MESSAGE — kontrol manual dari aplikasi
// ------------------------------------------------------------
self.addEventListener('message', (event) => {
  const { type } = event.data || {};
  if (type === 'SKIP_WAITING') { self.skipWaiting(); return; }

  if (type === 'CLEAR_EGRESS_CACHES') {
    event.waitUntil((async () => {
      await Promise.all(OWNED_CACHES.map((name) => caches.delete(name)));
      event.source?.postMessage?.({ type: 'EGRESS_CACHES_CLEARED' });
    })());
  }

  if (type === 'CACHE_STATS') {
    event.waitUntil((async () => {
      const stats = {};
      for (const name of OWNED_CACHES) {
        const cache = await caches.open(name);
        const keys = await cache.keys();
        stats[name] = keys.length;
      }
      stats.storageTtlDays = Math.round(STORAGE_TTL_MS / 86400000);
      event.source?.postMessage?.({ type: 'CACHE_STATS_RESULT', stats });
    })());
  }
});

// ------------------------------------------------------------
// BACKGROUND SYNC
// ------------------------------------------------------------
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-checklist' || event.tag === 'sync-photos') {
    event.waitUntil((async () => {
      const clients = await self.clients.matchAll();
      clients.forEach((client) => {
        client.postMessage({ type: 'SYNC_COMPLETE', message: 'Data tersinkronisasi' });
      });
    })());
  }
});

// ------------------------------------------------------------
// PUSH NOTIFICATION
// ------------------------------------------------------------
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  const options = {
    body: data.body || 'Notifikasi Smart AI Pengkaji SLF',
    icon: '/logo-app.png',        // ikon lama /icons/icon-192x192.png tidak ada di build
    badge: '/favicon-32.png',
    data: data.data || {},
  };
  event.waitUntil(
    self.registration.showNotification(data.title || 'Smart AI Pengkaji SLF', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(self.clients.openWindow('/'));
});
