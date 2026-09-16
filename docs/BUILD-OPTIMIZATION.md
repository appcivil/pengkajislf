# Optimasi Build — Hasil & Cara Menambah

**Proyek:** Smart AI Pengkaji SLF
**Tanggal:** 16 September 2026

---

## 1. Hasil

### Chunk terbesar

| Chunk | Sebelum | Sesudah | Perubahan |
|---|---:|---:|---:|
| `proyek-detail` | **987,53 kB** (gzip 219,16) | **128,18 kB** (gzip 27,60) | **−87 %** |
| `main` | 352,66 kB (gzip 111,53) | 269,86 kB (gzip 85,02) | −23 % |
| `three` | 728,80 kB | 780,92 kB | → chunk sendiri (tidak lagi bercampur) |
| `docx-service` | 511,24 kB | 141,40 kB | → generator pindah ke chunk `docx` |
| `docx` (vendor) | *(menyatu)* | 835,16 kB | hanya dimuat saat generate laporan |
| `docx-preview` | *(tercampur)* | 171,19 kB | hanya dimuat saat tab pratinjau dibuka |
| `charts` (chart.js) | *(di dalam proyek-detail)* | 205,14 kB | hanya dimuat halaman bergrafik |
| `pdf` (jspdf) | 415,94 kB | 417,04 kB | chunk sendiri |
| `xlsx` | 417,70 kB | 417,70 kB | chunk sendiri |

### Efek nyata bagi pengguna

Halaman detail proyek adalah halaman yang paling sering dibuka. Sebelumnya
membuka satu proyek berarti mengunduh **≈990 kB JS** (≈275 kB tersaring gzip)
sebelum kartu pertama terlihat. Kini:

```
Sebelum : main + proyek-detail + 8 modul digabung  = 987 kB satu tarikan
Sesudah : proyek-detail 128 kB + modul dimuat saat kartunya masuk layar
```

Praktisnya: **8 modul terberat (±630 kB kode, ≈115 kB gzip) tidak lagi diunduh
di awal**, melainkan bertahap sesuai posisi scroll. Membuka daftar proyek lalu
satu proyek terasa jauh lebih ringan, terutama di jaringan seluler.

> Catatan gzip: total tetap sama bila seluruh kartu dilihat sampai bawah —
> yang berubah adalah **kapan** byte itu diunduh. Pada perangkat lapangan
> dengan sinyal buruk, ini perbedaan antara "halaman terbuka" dan "layar kosong".

---

## 2. Dua Teknik yang Dipakai

### 2.1 Pemisahan chunk vendor (`vite.config.js`)

`manualChunks` diubah dari bentuk objek menjadi **fungsi**. Pustaka besar
dikelompokkan satu per satu:

```js
const GROUPS = {
  'three':        ['three'],
  'charts':       ['chart.js'],
  'xlsx':         ['xlsx'],
  'pdf':          ['jspdf', 'jspdf-autotable'],
  'docx':         ['docx', 'docxtemplater', 'pizzip', 'file-saver'],
  'docx-preview': ['docx-preview'],
  'screenshot':   ['html2canvas'],
  'ai-local':     ['@tensorflow/tfjs', '@xenova/transformers'],
  'markdown':     ['marked'],
  'dompurify':    ['dompurify'],
  'supabase':     ['@supabase/supabase-js'],
  'tesseract':    ['tesseract.js'],
};
```

Alasan memakai fungsi, bukan objek: bentuk objek hanya bisa memetakan paket
**root** dan mudah bentrok bila satu paket muncul di dua grup. Bentuk fungsi
membaca nama paket sebenarnya dari path modul (termasuk scope `@scope/nama`)
dan mengembalikan `undefined` untuk sisanya sehingga Rollup tetap bebas
melakukan code-splitting otomatis.

Manfaat:

1. **Caching.** Chunk vendor jarang berubah, jadi mengubah satu baris kode
   aplikasi tidak memaksa browser mengunduh ulang ratusan kB pustaka.
2. **Isolasi.** Halaman yang tidak memakai grafik/PDF tidak mengunduh chunk itu.

### 2.2 Kartu lazy di halaman detail proyek

**Masalah:** `src/pages/proyek-detail.js` mengimpor **18 modul komponen secara
statis** dan merender semuanya dalam satu template, sehingga seluruh kode
(±750 kB sumber) masuk ke satu chunk.

**Solusi:** 8 modul terberat dipindahkan ke registry lazy.

| Modul | Ukuran sumber | Chunk hasil |
|---|---:|---|
| `accessibility-module.js` | 92 KB | 98,15 kB |
| `environmental-module.js` | 92 KB | 94,61 kB |
| `fire-protection-module.js` | 92 KB | 89,72 kB |
| `egress-system-module.js` | 84 KB | 81,40 kB |
| `struktur-bangunan-module.js` | 80 KB | 92,37 kB |
| `lightning-protection-module.js` | 76 KB | 73,83 kB |
| `building-intensity-module.js` | 60 KB | 64,09 kB |
| `architectural-requirements-module.js` | 56 KB | — |

Modul kecil (≤16 KB: electrical, sanitation, stormwater, simulation-hub,
wastewater, water, comfort, kondisi, disaster) **tetap statis** — penghematannya
kecil sementara jumlah berkas yang harus diubah bertambah.

**Cara kerjanya** (`src/lib/lazy-card.js` + `src/pages/proyek-detail-lazy.js`):

```
1. Halaman dirender dengan kerangka kartu  →  lazyCardShell('fire')
   (id root sudah final: <div id="fire-protection-card" data-lazy-card="fire">)
2. IntersectionObserver memantau, rootMargin 400px
3. Kartu mendekati layar → import() modulnya
4. fetchXSummary() dipanggil (sebelumnya dipanggil serentak di awal halaman)
5. Kartu asli menggantikan kerangka (id root dipertahankan)
6. initXHandlers() dijalankan setelah DOM kartu ada
```

Yang dijaga:

| Risiko | Penanganan |
|---|---|
| `?tab=fire` tidak menemukan kartu | Kartu target **dipaksa** dimuat lebih dulu (`force`) sebelum `handleModuleTabNavigation` |
| Layout melompat saat kartu terisi | Kerangka memakai `min-height` sesuai ukuran kartu asli |
| `IntersectionObserver` tidak tersedia | Hidrasi semua kartu segera (perilaku lama) |
| Chunk gagal diunduh (sinyal hilang) | Kartu menampilkan pesan error, **bukan** halaman kosong |
| Halaman dibuka ulang | `resetLazyCards()` dipanggil di awal `proyekDetailPage()` |
| Handler dipasang dua kali | `hydrateCard()` idempoten (dilacak lewat `Set`) |

---

## 3. Cara Menambah Kartu Lazy Baru

Satu entri saja di `src/pages/proyek-detail-lazy.js`:

```js
import { defineLazyCard } from '../lib/lazy-card.js';

defineLazyCard('kondisi', {
  rootId:   'kondisi-card',                              // id elemen root setelah render
  loader:   () => import('../components/kondisi-module.js'),
  fetchKey: 'fetchKondisiSummary',                       // opsional
  renderKey:'renderKondisiCard',
  initKey:  'initKondisiHandlers',                       // opsional
});
```

Lalu di `src/pages/proyek-detail.js`:

```diff
- import { renderKondisiCard, initKondisiHandlers } from '../components/kondisi-module.js';
+ // (hapus — sudah ditangani registry)

- ${renderKondisiCard(p, kondisiSummary)}
+ ${lazyCardShell('kondisi', { minHeight: 240, label: 'Memuat modul kondisi…' })}

- initKondisiHandlers(p, kondisiSummary);
+ // (hapus — dipasang otomatis setelah kartu terhidrasi)
```

Bila kartu dipakai oleh navigasi tab, tambahkan juga pemetaannya di
`TAB_TO_LAZY_KEY` (file yang sama).

### Penyesuaian signature

Beberapa modul menerima argumen berbeda. Dua kait yang tersedia:

```js
defineLazyCard('struktur', {
  rootId: 'struktur-bangunan-card',
  loader: () => import('../components/struktur-bangunan-module.js'),
  renderKey: 'renderStrukturBangunanCard',
  initKey: 'initStrukturBangunanHandlers',
  // nilai default argumen ke-2 untuk render (di sini statistik checklist)
  renderArgs: (ctx) => ({ tier1: ctx.stats?.pct ?? 0, tier2: 0, tier3: 0 }),
  // argumen untuk fungsi init (di sini p.id saja)
  initArgs: (ctx) => [ctx.id],
});
```

---

## 4. Verifikasi

```bash
npm run build          # cek ukuran chunk
npm test               # 171 tes, termasuk 8 tes lazy-card
```

Tes `src/lib/lazy-card.test.js` memverifikasi mekanisme yang sulit dilihat
manual di browser:

- kerangka dirender dengan **id root yang benar** (supaya `?tab=` tetap bekerja)
- kartu asli menggantikan kerangka dan **id root dipertahankan**
- `initXHandlers` dipanggil **setelah** DOM kartu terpasang
- `fetchXSummary` **tidak** dipanggil saat halaman dibuka, hanya saat hidrasi
- **idempoten** — tidak dihidrasi dua kali
- kegagalan modul → **kartu error**, bukan halaman kosong
- fallback tanpa `IntersectionObserver`
- kartu target `?tab=` dimuat lebih dulu

### Batas ukuran chunk (opsional)

Build masih memperingatkan chunk > 500 kB (`three` 781 kB, `docx` 835 kB).
Keduanya wajar karena dimuat hanya saat fitur terkait dipakai. Bila ingin
peringatan hilang:

```js
build: { chunkSizeWarningLimit: 900 }
```

---

## 5. Peluang Lanjutan (belum dikerjakan)

| Kandidat | Potensi | Catatan |
|---|---|---|
| `three` 781 kB | Tinggi | Bila 3D viewer hanya dipakai 1–2 halaman, chunk ini sudah terisolasi; memuatnya hanya saat tab 3D dibuka akan menghemat bagi pengguna yang tidak memakainya. |
| `docx` 835 kB | Sedang | Hanya dimuat saat membuat laporan — wajar. Bisa dipecah per bagian laporan bila perlu. |
| 9 modul kecil tersisa di `proyek-detail` | Rendah | ≈100 kB total; melakukan lazy pada semuanya menambah kompleksitas tanpa manfaat besar. |
| `src/lib/transformers` / TF.js | Sedang | `ai-local` belum muncul di daftar chunk — pastikan hanya dimuat bila fitur AI lokal benar-benar dipakai. |
| Dead code 25 halaman + 83 modul orphan | — | Tidak memengaruhi bundel; lihat `docs/CODE-AUDIT.md` §7. |

---

## 6. Berkas yang Berubah

| Berkas | Perubahan |
|---|---|
| `vite.config.js` | `manualChunks` objek → fungsi; grup vendor dipisah |
| `src/lib/lazy-card.js` | **Baru** — infrastruktur kartu lazy |
| `src/lib/lazy-card.test.js` | **Baru** — 8 tes |
| `src/pages/proyek-detail-lazy.js` | **Baru** — registry 8 kartu + `TAB_TO_LAZY_KEY` |
| `src/pages/proyek-detail.js` | 8 import statis dihapus; 8 render kartu → kerangka; 8 init dipindah ke hidrasi; 7 fetch ringkasan ditunda |
