# Mitigasi Egress Supabase + Keepalive 2 Hari

**Proyek:** Smart AI Pengkaji SLF (`appcivil/pengkajislf`)
**Tanggal:** 16 September 2026
**Status:** Sudah terpasang di kode — beberapa langkah manual (SQL & secrets) perlu dijalankan sekali.

---

## 1. Ringkasan Kuota yang Berlaku

| Item | Free Plan | Catatan |
|---|---|---|
| **Egress uncached** (origin) | **5 GB / siklus billing** | Query REST, Auth, Realtime, Edge Function |
| **Egress cached** (CDN hit) | **5 GB / siklus billing** | Terutama objek Storage publik |
| Cara hitung | Per **organisasi**, bukan per proyek | Semua proyek berbagi kuota |
| Reset | Awal siklus billing berikutnya | **Bukan** tanggal 1 tiap bulan |
| Kalau lewat | Email + masa tenggang → lalu **Fair Use restriction** | API bisa balas **HTTP 402**, DB read-only |
| Pemulihan | Naik ke Pro atau tunggu siklus reset | Data tidak pernah dihapus |
| **Inactivity pause** | Proyek di-pause setelah **7 hari tanpa aktivitas database** | Pulih dalam 90 hari; tidak dihapus |

Poin penting yang sering disalahpahami:

- **Upload tidak dihitung egress.** Yang dihitung adalah setiap kali file itu **diunduh/dilihat**.
- Cache browser/CDN adalah **satu-satunya** cara membuat unduhan berulang "gratis" (masuk hitungan cached, bukan uncached).
- Timer 7 hari dihitung dari **aktivitas database** — membuka dashboard Supabase **tidak** mereset timer.

> Rujukan: [docs Supabase — Manage Egress usage](https://supabase.com/docs/guides/platform/manage-your-usage/egress), [changelog cached egress](https://supabase.com/changelog/38119-3x-cheaper-egress-for-cache-hits).

---

## 2. Temuan Audit di Repo Ini

Dijalankan dengan `npm run audit:egress` (368 berkas di `src/`):

| Pola | Jumlah | Dampak egress |
|---|---|---|
| `select('*')` | **265** | Kolom besar (metadata, base64, JSON besar) ikut terkirim tiap query |
| Query `SELECT` tanpa `.limit()` | **143** | Satu query bisa menarik ribuan baris |
| Upload Storage tanpa `cacheControl` panjang | 2 → **0** (diperbaiki) | File ditarik ulang dari origin tiap kali dibuka |
| Realtime `.channel()` | 2 | Payload dikirim tiap ada perubahan baris |
| `setInterval` polling | 12 | Request berulang tanpa henti selama tab terbuka |
| `base64` tersimpan di database | 10 | Baris membengkak → **setiap** `select` proyek ikut menariknya |

Tabel yang paling sering dibaca dengan `select('*')`: `proyek` (34×), `checklist_items` (13×), `hasil_analisis` (12×), `proyek_files` (9×).

**Temuan paling berbahaya:** template laporan disimpan sebagai
`proyek.metadata.report_template_base64`. Satu template DOCX berukuran ratusan KB
sampai beberapa MB, dan ikut terkirim **setiap kali metadata proyek dibaca**.
Migrasi SQL di bawah menghapus kolom ini secara massal.

---

## 3. Mitigasi yang Sudah Dipasang

### 3.1 Egress Guard — lapisan cache di dalam aplikasi

**Berkas:** `src/lib/egress/` (`egress-config.js`, `idb-cache.js`, `rest-fetch-adapter.js`, `index.js`)

Dipasang otomatis ke Supabase client (`src/lib/supabase.js`) sebagai `global.fetch`,
sehingga **semua** query REST melewatinya tanpa perlu mengubah 193 titik pemanggilan:

| Mekanisme | Efek terhadap egress |
|---|---|
| **Cache lokal** (IndexedDB + memori) dengan TTL per tabel | GET berulang dijawab lokal → **0 byte** dari Supabase |
| **Revalidasi `If-None-Match`** | Respons basi diperbarui dengan 304 → hanya header (± 32 byte), body tidak dikirim ulang |
| **Dedup (single-flight)** | 5 request identik bersamaan → **1** request jaringan |
| **Invalidasi saat menulis** | POST/PATCH/PUT/DELETE membersihkan cache tabel itu → data tetap akurat |
| **Fallback offline/5xx** | Sajikan data basi (maks 7 hari) → dashboard tidak blank saat sinyal hilang di lapangan |
| **Meteran byte** | `bytesIn`, `bytesSaved`, `savedPercent` per sesi |

TTL default: master data (nspk, settings, template) **24 jam**; data proyek **5 menit**;
tabel realtime/kritis (`notifications`, `audit_logs`, `ai_jobs`, `sync_queue`) **tidak pernah di-cache**.

API bantu untuk memangkas egress pada kode baru:

```js
import { dataExists, narrowSelect } from './lib/egress/index.js';

// Dulu: select('*') hanya untuk mengecek "ada atau tidak"
await supabase.from('analisis').select('*').eq('proyek_id', id);        // ❌ tarik semua kolom
const { exists } = await dataExists(supabase, 'analisis', q => q.eq('proyek_id', id)); // ✅ header saja

// Dulu: select('*') padahal cuma butuh 3 kolom
narrowSelect(supabase, 'proyek', 'id,nama,alamat');                     // ✅
```

**Matikan bila bermasalah:** set `VITE_EGRESS_GUARD=off` di `.env` (kembali ke perilaku lama).

### 3.2 Service Worker — cache objek Storage

**Berkas:** `public/service-worker.js`

- **Bug yang diperbaiki:** precache memakai `cache.addAll()` dengan daftar berisi
  file yang **tidak ada di build** (`/src/main.js`, `/src/style.css`, `/assets/hero.png`,
  `/icons/icon-192x192.png`). Satu saja gagal → `addAll` menolak → **install SW gagal total**,
  artinya aplikasi selama ini **tidak punya service worker aktif sama sekali**.
  Sekarang tiap URL dicache terpisah (`Promise.allSettled`) sehingga aman.
- **Baru:** foto & lampiran Supabase Storage disajikan **cache-first** dengan masa simpan
  30 hari → membuka halaman berulang kali tidak menarik ulang byte dari CDN.
- Pembagian tugas: REST ditangani Egress Guard (di aplikasi); Storage + aset statis di SW;
  `/auth/v1`, `/realtime/v1`, `/functions/v1` selalu langsung ke jaringan.

### 3.3 Cache panjang untuk file yang diunggah

`src/lib/field-data-import.js`, `src/pages/laporan.js`, `src/domain/repositories/EgressRepository.js`:
`cacheControl` diubah dari default/`'3600'` (1 jam) → **`'31536000'` (1 tahun)**.
Nama berkas sudah memuat timestamp sehingga isinya tidak pernah berubah — aman di-cache lama.

### 3.4 Keepalive 3 Lapis (anti-pause 7 hari)

| Lapis | Berkas | Frekuensi | Catatan |
|---|---|---|---|
| 1. GitHub Actions | `.github/workflows/supabase-keepalive.yml` | **Setiap 2 hari**, 03:00 UTC | Perlu 2 secrets |
| 2. Aplikasi klien | `src/lib/keepalive.js` (dipanggil dari `main.js`) | Maks **1× / 48 jam / perangkat** | Berjalan sendiri setiap aplikasi dibuka |
| 3. Edge Function | `supabase/functions/keepalive/index.ts` | Sesuai pemanggil | Bisa dipakai cron eksternal (cron-job.org / n8n / UptimeRobot) |

- 2 hari memberi margin besar terhadap batas 7 hari — kalau satu eksekusi gagal, masih aman.
- Setiap ping memakai **parameter cache-buster** (`_cb=<waktu+random>`) agar CDN tidak
  menyajikan respons cache — ping yang di-cache tidak menyentuh database sama sekali.
- Egress per ping < 1 KB (1 baris / header saja). 15 ping/bulan ≈ **15 KB** → tidak terukur
  dibanding kuota 5 GB.
- ⚠️ **GitHub menonaktifkan workflow terjadwal setelah 60 hari tanpa commit di repo.**
  Karena itu ada lapis 2 dan 3. Kalau repo akan lama tidak disentuh, tambahkan cron eksternal:

```bash
# cron-job.org / server sendiri, panggil setiap 2 hari:
node scripts/keepalive.mjs            # atau
curl -s "https://<ref>.supabase.co/functions/v1/keepalive" -H "Authorization: Bearer <ANON_KEY>"
```

Skrip CLI: `npm run keepalive` (atau `npm run keepalive:force` untuk memaksa + verbose).
Mendukung banyak proyek sekaligus lewat `keepalive.targets.json` (lihat `keepalive.targets.json.example`).

---

## 4. Langkah Manual yang Masih Perlu Dijalankan

### 4.1 Jalankan migrasi keepalive (sekali)

Buka Supabase SQL Editor → tempel isi
`supabase/migrations/20260916_keepalive_and_indexes.sql` → Run.
Isinya: tabel `keepalive_ping` + RLS + fungsi retensi + **pembersihan base64 template**.

### 4.2 Deploy Edge Function

```bash
supabase functions deploy keepalive
```

### 4.3 Isi secrets GitHub

Repo → **Settings → Secrets and variables → Actions → New repository secret**:

| Nama | Nilai |
|---|---|
| `SUPABASE_URL` | `https://<project-ref>.supabase.co` |
| `SUPABASE_ANON_KEY` | anon/publishable key (aman dipublikasikan, dilindungi RLS) |

Lalu tab **Actions → Supabase Keep-Alive → Run workflow** untuk uji manual.

### 4.4 Isi `.env`

Salin `.env.example` → `.env` (tanpa ini aplikasi memakai `placeholder.supabase.co`).

### 4.5 Analisis query terberat (opsional, sangat disarankan)

Jalankan `supabase/analysis/egress-hotspots.sql` di SQL Editor untuk melihat
query & tabel mana yang benar-benar memakan byte paling banyak di proyek Anda.

### 4.6 Tindak lanjut bertahap untuk 265 `select('*')`

Tidak perlu sekaligus. Urutan prioritas berdasarkan audit:

1. `src/pages/laporan/services/laporanService.js` (20×)
2. `src/infrastructure/persistence/InspectionRepository.js` (16×)
3. Tabel `proyek` (34×) — sudah dibantu migrasi base64 + cache 5 menit
4. `src/infrastructure/chat/ApplicationDataProvider.js` (12×)

Ganti `select('*')` → kolom yang benar-benar dipakai, dan tambahkan `.limit()` pada
daftar yang berpotensi panjang. Cache Egress Guard sudah menutup dampak terbesarnya
(permintaan berulang), tetapi permintaan **pertama** tetap sebesar apa pun isi barisnya.

---

## 5. Cara Mengukur Hasil

### Di browser (per sesi pemakaian)

```js
// Console DevTools
await window.__slfEgress.report()      // tabel: request, HIT, 304, byte masuk, byte dihemat, %
window.__slfEgress.stats()             // objek mentah
await window.__slfEgress.cacheInfo()   // cache per tabel
await window.__slfEgress.invalidate('proyek')  // paksa ambil ulang
```

Setiap respons REST juga membawa header diagnostik:
`x-slf-egress: HIT | MISS | REVALIDATED | REVALIDATED-200 | STALE-OFFLINE | STALE-ERROR`
(terlihat di tab Network).

### Dari kode / CLI

```bash
npm run audit:egress              # pemindaian ulang risiko di src/
npm run keepalive:force           # uji ping + lihat byte yang dikirim
```

### Resmi dari Supabase

Dashboard → **Organization Settings → Usage** → pantau *Egress* dan *Cached Egress*.
Naikkan perhatian bila uncached mendekati 5 GB, atau pasang notifikasi ke email billing.

---

## 6. Troubleshooting

| Gejala | Penyebab & solusi |
|---|---|
| Data terasa "tidak update" setelah edit | Penulisan menginvalidasi tabel terkait secara otomatis. Jika ada penulisan lewat jalur non-REST (mis. Edge Function), panggil `window.__slfEgress.invalidate('nama_tabel')`. |
| Ingin mematikan cache sementara | `.env` → `VITE_EGRESS_GUARD=off`, restart dev server. |
| Perlu lihat detail tiap request | `.env` → `VITE_EGRESS_DEBUG=on`. |
| Cache terlalu besar / HP penuh | Turunkan `VITE_EGRESS_CACHE_MB` (default 12). Cache lama otomatis dibuang (LRU). |
| Data pengguna tertinggal di perangkat bersama | Sudah ditangani: `signOut()` membersihkan seluruh cache (`src/lib/auth.js`). |
| Ping keepalive gagal semua | Cek `SUPABASE_URL`/key, apakah proyek sedang di-pause (restore dari dashboard), dan apakah migrasi keepalive sudah dijalankan. |
| Workflow keepalive berhenti sendiri | GitHub mematikan workflow terjadwal setelah 60 hari tanpa commit — aktifkan lagi dari tab Actions, atau pakai cron eksternal. |
| Service worker versi lama masih jalan | Cache diberi versi (`slf-*-v2.2`); SW lama otomatis dihapus saat activate. Paksa lewat DevTools → Application → Service Workers → Update. |

---

## 7. Rollback

```bash
# Kembalikan perilaku asli (tanpa egress guard)
echo "VITE_EGRESS_GUARD=off" >> .env

# Kembalikan service worker & upload ke versi repo
git checkout public/service-worker.js src/lib/field-data-import.js \
             src/pages/laporan.js src/domain/repositories/EgressRepository.js

# Lepas pemasangan di client Supabase
git checkout src/lib/supabase.js src/main.js src/lib/auth.js
```

Menghapus pekerjaan keepalive: hapus `.github/workflows/supabase-keepalive.yml`,
`supabase/functions/keepalive/`, dan `src/lib/keepalive.js` (+ importnya di `main.js`).

---

## 8. Ringkasan Berkas

**Baru:**

| Berkas | Fungsi |
|---|---|
| `src/lib/egress/{egress-config,idb-cache,rest-fetch-adapter,index}.js` | Egress Guard (cache, dedup, 304, invalidasi, meteran) |
| `src/lib/egress/rest-fetch-adapter.test.js` | 15 tes yang membuktikan tiap mekanisme bekerja |
| `src/lib/keepalive.js` | Ping keepalive dari klien (throttle 48 jam) |
| `supabase/functions/keepalive/index.ts` | Edge Function ping |
| `supabase/migrations/20260916_keepalive_and_indexes.sql` | Tabel keepalive + RLS + retensi + bersih-bersih base64 |
| `supabase/analysis/egress-hotspots.sql` | Query analisis egress di SQL Editor |
| `.github/workflows/supabase-keepalive.yml` | Cron ping 2 hari |
| `scripts/keepalive.mjs` | Ping standalone untuk scheduler apa pun |
| `scripts/egress-audit.mjs` | Pemindai risiko egress |
| `.env.example`, `.gitignore`, `keepalive.targets.json.example` | Konfigurasi |

**Diubah:** `src/lib/supabase.js` (guard terpasang), `src/main.js` (init keepalive),
`src/lib/auth.js` (bersihkan cache saat logout), `public/service-worker.js` (perbaikan install + cache Storage),
`src/lib/field-data-import.js`, `src/pages/laporan.js`, `src/domain/repositories/EgressRepository.js`
(`cacheControl` 1 tahun), `supabase/config.toml`, `package.json` (npm scripts).

---

## 9. Verifikasi yang Sudah Dilakukan

| Pemeriksaan | Hasil |
|---|---|
| `npx vitest run` | **163 tes lolos** (148 bawaan + 15 tes baru Egress Guard) |
| `npx vite build` | Sukses, 46 detik, tanpa error |
| Dev server | Modul `supabase.js`, `keepalive.js`, `egress/*` termuat (HTTP 200) |
| `npm run audit:egress` | Berjalan; upload tanpa cache panjang turun dari 4 → 0 |
