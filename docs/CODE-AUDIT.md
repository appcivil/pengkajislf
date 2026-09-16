# Audit Kode — Temuan & Perbaikan

**Proyek:** Smart AI Pengkaji SLF
**Tanggal:** 16 September 2026
**Skrip:** `scripts/code-audit.mjs` · **Berkas diperiksa:** 381 (folder `src/`)

---

## 1. Cara Menjalankan

```bash
node scripts/code-audit.mjs                 # ringkasan
node scripts/code-audit.mjs --verbose       # tampilkan SEMUA temuan
node scripts/code-audit.mjs --json code-audit.json
node scripts/code-audit.mjs --top 40        # tampilkan lebih banyak per bagian

npm run audit:code                          # alias
```

Skrip keluar dengan kode `1` bila masih ada temuan **FATAL**, sehingga bisa
dipakai sebagai gerbang di CI.

## 2. Yang Diperiksa

| # | Pemeriksaan | Arti | Tingkat |
|---|---|---|---|
| 1 | **Import rusak** | Path relatif/alias tidak menunjuk berkas mana pun | ❌ Fatal |
| 2 | **Export rusak** | Nama yang diimpor tidak diekspor modul tujuan | ❌ Fatal |
| 3 | **Dependensi npm hilang** | `import` paket yang tidak terdaftar di `package.json` | ❌ Fatal |
| 4 | **Rute tidak terdaftar** | `navigate('x')` tapi `route('x')` tidak pernah didaftarkan → tombol mendarat di 404 | ❌ Fatal |
| 5 | **Import sirkular** | A → B → A | ⚠️ Peringatan |
| 6 | **Halaman tidak ter-wire** | Halaman di `src/pages/` yang tidak pernah dirender router | ⚠️ Peringatan |
| 7 | **Import dari CDN** | URL `https://...` di dalam `import()` — tidak ikut di-bundle | ⚠️ Peringatan |
| 8 | **Modul orphan** | Berkas yang tidak diimpor siapa pun | ℹ️ Info |

### Catatan teknis: kenapa parser-nya tidak sepele

Versi pertama skrip ini melaporkan **36 "export rusak" yang semuanya palsu**.
Penyebabnya dua, dan keduanya penting agar hasil audit bisa dipercaya:

1. **Kata `import` di dalam template literal HTML.**
   File UI di proyek ini banyak memuat string HTML di dalam backtick
   (`<button onclick="importProject()">`). Pencocokan tanpa konteks membaca
   kata itu sebagai pernyataan import.

2. **Template literal bersarang** — `\`${x ? \`<b>${y}</b>\` : ''}\``.
   Parser state-machine sederhana mengira template luar sudah selesai di
   backtick dalam, sehingga tokenizer "keluar jalur" dan **seluruh sisa berkas
   dianggap teks**. Akibatnya `export function closeModal()` di
   `src/components/modal.js` pun tidak terdeteksi.

Solusinya: **tokenizer berbasis stack** (`computeCodeMask`) yang menandai setiap
karakter sebagai kode/teks, mendukung `\`...\`` bersarang lewat pelacakan
`${ }`, komentar, string, dan regex literal. Pencocokan kata kunci hanya diterima
bila posisinya ditandai "kode". Setelah perbaikan itu: **export rusak = 0**, dan
temuan yang tersisa semuanya nyata.

---

## 3. Hasil Sebelum → Sesudah

| Pemeriksaan | Sebelum | Sesudah |
|---|---|---|
| Import rusak | 1 | **0** |
| Export rusak | 0 (setelah 1 bug manual diperbaiki) | **0** |
| Dependensi npm hilang | 2 nyata (+4 positif palsu URL) | **0** |
| **Rute tidak terdaftar** | **5** | **0** |
| Import sirkular | 4 | 4 (dinilai aman — §6) |
| Halaman tidak ter-wire | 25 | 25 (dead code — §7) |
| Import dari CDN | 4 | 4 (disengaja — §6) |
| Modul orphan | 83 | 83 (dead code — §7) |

---

## 4. Bug yang Ditemukan & Diperbaiki

### 4.1 Lima rute mati (dampak paling terasa bagi pengguna)

Tombol di UI memanggil nama rute yang **tidak pernah didaftarkan**, sehingga
klik-nya berakhir di halaman 404:

| Rute yang dipanggil | Lokasi pemanggil | Rute yang sebenarnya ada |
|---|---|---|
| `accessibility-inspection` | `src/components/accessibility-module.js:1017, 1485, 1493` | `accessibility` |
| `fire-inspection` | `src/components/fire-protection-module.js:1650` | `fire-protection` |
| `architectural-new-assessment` | `src/components/architectural-requirements-module.js:747` | `architectural` |
| `intensity-new-assessment` | `src/components/building-intensity-module.js:1105` | `building-intensity` |
| `comfort-inspection` | `src/components/comfort-module.js:77` | **tidak ada sama sekali** |

**Perbaikan:**

- Empat yang pertama didaftarkan sebagai **alias** yang memakai handler yang
  sama persis (`src/main.js` → blok `ROUTE_ALIASES`), memanfaatkan
  `getRouteHandler()` yang baru diekspos dari `src/lib/router.js`.
  Tidak ada logika yang diduplikasi.
- `comfort-inspection` didaftarkan sebagai rute sungguhan. Selama ini halaman
  `pages.comfortInspection` sudah ada di registry tetapi **tidak pernah bisa
  diakses** karena tidak ada satu pun rute yang merendernya.

### 4.2 Import dengan path salah

`src/modules/plumbing/core/HydraulicEngine.js:7`
`'../../core/EventBus.js'` → menunjuk `src/modules/core/EventBus.js` (**tidak ada**).
Diperbaiki menjadi `'../../../core/EventBus.js'` (`src/core/EventBus.js`).
Modul ini gagal dimuat setiap kali dipanggil.

### 4.3 Dependensi yang tidak dideklarasikan

`html2canvas` diimpor dinamis oleh `src/infrastructure/pipeline/engines/visualization-engine.js`
dan `web-screenshot-engine.js`, tetapi **tidak ada di `package.json`**. Build
berhasil hanya karena `html2canvas` kebetulan menjadi *optional dependency* milik
`jspdf`. Bila jspdf berhenti menyertakannya, build langsung gagal tanpa sebab jelas.
Sudah ditambahkan sebagai dependency eksplisit (`^1.4.1`).

### 4.4 Bug lama dari sesi sebelumnya (konteks)

Sebelumnya ditemukan `checkAIHealth` diimpor oleh `src/pages/checklist.js` tetapi
tidak diekspor `src/lib/ai-anti-rate-limit-integration.js` — sudah diperbaiki saat
pemasangan pertama. Audit ini memastikan tidak ada kasus serupa yang tersisa.

---

## 5. Cara Menambah Pemeriksaan Baru

Tambahkan ke `scripts/code-audit.mjs`:

```js
// 1) inisialisasi penampung di objek `findings`
const findings = { /* ... */ cekBaru: [] };

// 2) isi temuan di main() — gunakan computeCodeMask() bila memindai
//    pola yang bisa muncul di dalam komentar/string
const mask = computeCodeMask(code);
for (const m of code.matchAll(/polaAnda\(/g)) {
  if (mask[m.index] !== 1) continue;     // lewati komentar & string
  findings.cekBaru.push({ file: path.relative(ROOT, file), line: ... });
}

// 3) daftarkan di array `sections` dan tambahkan show(...) bila perlu detail
```

---

## 6. Temuan yang Dinilai Aman (tidak diubah)

### Import sirkular (4)

| Siklus | Penilaian |
|---|---|
| `infrastructure/ai/deep-reasoning-integration.js` ↔ `lib/gemini.js` | Siklus nyata, tetapi keduanya hanya saling memakai fungsi di dalam *function body* (bukan saat inisialisasi modul), sehingga tidak menyebabkan `undefined`. **Saran jangka panjang:** pindahkan fungsi bersama ke modul ketiga. |
| `main.js` ↔ `pages/proyek-detail.js` | Terjadi lewat `import('../main.js')` yang **dinamis** di dalam fungsi (mengambil `onProyekDetailEnter`). ESM menanganinya dengan aman. |

### Import dari CDN (4)

`tesseract.js`, `pdfjs-dist`, `pyodide`, dan `konva` dimuat dari CDN di dalam
`import()`. Ini disengaja untuk pustaka besar yang jarang dipakai (OCR, WebAssembly
Python, kanvas). **Konsekuensinya:** keempat fitur itu **tidak dapat dipakai offline**
dan tidak bisa dipreview di lingkungan tanpa akses jaringan. Bila fitur tersebut
ingin dipakai di lapangan tanpa sinyal, pindahkan ke npm agar ikut ter-bundle.

---

## 7. Dead Code (dilaporkan, belum dihapus)

Total **25 halaman tidak ter-wire (≈996 KB)** dan **83 modul orphan (≈1,5 MB)**.
Dead code **tidak membebani bundel** (Vite hanya membundel modul yang tercapai dari
entry), jadi ini murni soal kebersihan repo — tetapi jumlahnya besar dan
menyulitkan pencarian kode yang benar.

### Kelompok 1 — Halaman inspeksi lama yang sudah digantikan (12 berkas, ≈740 KB)

`src/pages/{comfort,wastewater,electrical,egress,fire-protection,architectural,lps,building-intensity,sanitation,environmental,stormwater,water}-inspection.js`

Versi yang **benar-benar dipakai** ada di `src/application/use-cases/*Inspection.js`
(didaftarkan di registry `pages` pada `src/main.js`). Berkas lama di `src/pages/`
adalah implementasi sebelumnya yang tertinggal.

### Kelompok 2 — Berkas Laporan lama

| Berkas | Ukuran | Catatan |
|---|---|---|
| `src/pages/laporan.js` | 103,8 KB | Digantikan `src/pages/laporan/index.js` (11,3 KB) |
| `src/pages/laporan/index-old.js` | 20,6 KB | Salinan versi lama |
| `src/pages/laporan/LaporanPage.js` | 20,4 KB | Tidak dipakai |
| `src/pages/laporan/index-clean.js` | 9,6 KB | Percobaan |
| `src/pages/laporan/index.js.backup` | 12,1 KB | Cadangan |
| `src/pages/laporan/components/{DocxPreviewTab,ControlBar,NavigationPane,ZoomControls}.js` | 25,9 KB | Hanya dipakai berkas lama di atas |

> ⚠️ Perhatikan: `src/pages/laporan.js` memuat **dua deklarasi `export async function laporanPage`**
> (baris 31 dan 236). Ini hanya "lolos" karena berkasnya tidak pernah di-bundle.
> Kalau berkas ini suatu saat diimpor, build akan gagal.

### Kelompok 3 — Halaman lain

`src/pages/executive.js` (18,3 KB), `src/pages/legal.js` (5,0 KB),
`src/pages/todo-detail.js` (7,1 KB — hati-hati: rute `todo-detail` ada dan
merender `pages.taskDetail`, jadi berkas ini memang tidak terpakai).

### Kelompok 4 — Modul orphan terbesar (bukan halaman)

| Berkas | Ukuran |
|---|---|
| `src/lib/accessibility-calculators.js` | 33,8 KB |
| `src/domain/entities/EnvironmentalImpact.js` | 33,2 KB |
| `src/lib/environmental-calculators.js` | 28,1 KB |
| `src/lib/lps-calculators.js` | 26,0 KB |
| `src/lib/fire-protection-report-generator.js` | 19,4 KB |
| `src/infrastructure/pipeline/engines/cad-engine.js` | 19,3 KB |
| `src/lib/egress-calculators.js` | 19,1 KB |
| `src/infrastructure/ai/example-usage.js` | 18,4 KB (memuat `import 'react'` yang tidak ada di proyek) |

> **Jangan hapus `*-calculators.js` tanpa cek dulu.** Beberapa modul kalkulator
> mungkin diimpor secara dinamis dari string (mis. lewat konfigurasi), sehingga
> tidak terdeteksi pemeriksa statis. Verifikasi dengan
> `grep -rn "nama-modul" src/` sebelum menghapus.

**Rekomendasi:** hapus Kelompok 1 dan 2 (paling jelas), lalu periksa Kelompok 4
satu per satu. Untuk sementara, dead code bisa dipindahkan ke `src/legacy/` agar
tidak tercampur dengan kode aktif.

---

## 8. Ringkasan Status

```
✅ IMPORT RUSAK ................... 0
✅ EXPORT RUSAK ................... 0
✅ DEPENDENSI NPM HILANG .......... 0
✅ RUTE TIDAK TERDAFTAR ........... 0
⚠️  IMPORT SIRKULAR ............... 4  (dinilai aman — §6)
⚠️  HALAMAN TIDAK TER-WIRE ........ 25 (dead code — §7)
⚠️  IMPORT DARI CDN ............... 4  (disengaja — §6)
ℹ️  MODUL ORPHAN .................. 83 (dead code — §7)
```
