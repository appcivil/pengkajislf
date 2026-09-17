# Laporan pemeriksaan tampilan web

**Situs:** <https://appcivil.github.io/pengkajislf/>
**Tanggal pemeriksaan:** 16 September 2026
**Versi yang diperiksa:** commit `4977b9e` (sudah terpasang di GitHub Pages; alur CI **lulus**)
**Cara memeriksa:** situs dibuka sebagai **pengunjung biasa** memakai peramban sungguhan (Chromium headless 153) pada dua ukuran layar — desktop 1440×900 dan ponsel 390×844 — lalu diperiksa juga DOM dan gaya terhitungnya (warna, ukuran, posisi, gulir), bukan sekadar membaca kode sumber.

---

## 1. Ringkasan

Ditemukan **7 kelas cacat tampilan**. Semuanya sudah diperbaiki dan sudah tayang di situs live:

| # | Yang dilihat pengunjung | Diperbaiki di |
|---|---|---|
| 1 | **Semua ikon tampil kotak kosong** — setiap tombol dan menu tanpa lambang | `288af28` |
| 2 | **Sebagian ikon tetap kosong** walau font sudah termuat (26 nama ikon tidak ada di set yang dimuat) | `8086e51` |
| 3 | **Halaman login terpotong di ponsel** — sisi kanan kartu keluar layar | `288af28` |
| 4 | **Mode luring tidak pernah aktif** — service worker gagal mendaftar di alamat sub-folder | `288af28` |
| 5 | **Campur bahasa** — kalimat/keterangan berbahasa Inggris di tengah antarmuka Indonesia | `288af28` |
| 6 | **Tulisan "Terhubung" tanpa gaya** di luar kartu + gulir kosong 26 px di bawah halaman | `dd373d5` |
| 7 | **Label pendek berbahasa Inggris** — **105 label**, termasuk 5 di halaman login | `4977b9e` |

Ditambah satu perubahan tata letak atas permintaan Anda: **pil "Terhubung" sekarang berada di dalam kartu login** (`4977b9e`).

**Temuan yang belum saya kerjakan** — satu kelas, dengan alasan jelas di §5.

---

## 2. Apa yang dilihat pengunjung sekarang

Membuka <https://appcivil.github.io/pengkajislf/> menampilkan satu kartu gelap di tengah:

- **Panel kiri** — logo, judul **Smart AI Pengkaji SLF**, keterangan berbahasa Indonesia, lima baris keunggulan (Sintesis Neural Kuantum, Pengawasan Integritas & Kepatuhan Otomatis, Orkestrator Segel Digital GDocs Resmi, Visualisasi Data Strategis & Peta Denyut, Arsitektur Cloud Terenkripsi) **dengan ikonnya tergambar semua**, lalu empat label standar: SNI 1726 · SNI 2847 · ASCE 41-17 · PP 16/2021.
- **Panel kanan** — judul **Masuk Sistem**, tombol **MASUK DENGAN GOOGLE**, pemisah **ATAU MASUK LANGSUNG**, kolom **ALAMAT SUREL** (contoh `nama@instansi.go.id`) dan **KATA SANDI**, tombol kuning **MASUK**, lalu **"Versi sistem v1.0.0 • © 2026 Konsorsium. Terenkripsi oleh Smart AI Pengkaji"**.
- **Pil "Terhubung"** berpenanda hijau, kini **di dalam kartu**, tepat di bawah baris versi.

Halaman tidak punya gulir kosong, tidak ada teks yang keluar layar di ponsel, dan aplikasi punya cache luring karena service worker-nya aktif.

---

## 3. Rincian tiap perbaikan

### 1) Semua ikon tampil kotak kosong — `288af28`
Berkas font Font Awesome **404 saat dimuat**: di dalam `all.min.css`, tautan font masih menunjuk `url(../webfonts/…)` (gaya CDN), sedangkan berkasnya ikut dibundel di `public/vendor/fontawesome/webfonts/…`. Tidak ada satu pun ikon yang tergambar di seluruh aplikasi. Diperbaiki menjadi `url(webfonts/…)`; sekarang lebar glif terukur **21,0 px** (sebelumnya 14 px = kotak kosong).

### 2) Sebagian ikon tetap kosong — `8086e51`
Setelah font termuat, ternyata **26 nama ikon yang dipakai di kode adalah ikon Font Awesome *Pro***, sedangkan aplikasi memuat set ***Free* 6.5.0** (set yang sama dengan tautan CDN aslinya — jadi ini cacat bawaan, bukan akibat perbaikan sebelumnya). Nama yang tidak dikenal tidak memunculkan galat apa pun: ia hanya tergambar sebagai kotak kosong. **54 pemakaian di 18 berkas** diganti ke nama yang setara di set Free, contoh: `fa-brain-circuit → fa-brain`, `fa-shield-check → fa-shield-halved`, `fa-chart-network → fa-diagram-project`. Hasil di situs live: **7 dari 7 ikon halaman login tergambar** (sebelumnya 2 dari 7).

### 3) Halaman login terpotong di ponsel — `288af28`
Kartu login memakai `width:100%` **plus** `margin:20px` di dalam wadah yang sudah punya padding, sementara `#login-portal` memakai `overflow:hidden`. Di layar ≤850 px sisi kanan kartu terpotong. Setelah perbaikan: sisi kanan kartu **370 px pada layar 390 px**, tidak ada elemen yang keluar layar.

### 4) Service worker tidak pernah aktif — `288af28`
Pendaftarannya memakai alamat absolut (`/service-worker.js`) padahal situs disajikan dari sub-folder `/pengkajislf/`, jadi pendaftaran selalu gagal. Sekarang alamatnya mengikuti `import.meta.env.BASE_URL`. Di situs live: cakupan `https://appcivil.github.io/pengkajislf/`, status **activated**, cache `slf-static-v2.2` menyimpan **15 dari 15** aset pra-cache.

### 5) Campur bahasa (kalimat) — `288af28`
**26 kalimat** berbahasa Inggris (pesan galat, keterangan, judul) diterjemahkan di 13 berkas. Istilah baku profesi dan judul standar (Daylight Factor, AHU, NC, NFPA 13, dsb.) sengaja tidak diterjemahkan karena itu kosakata resmi rujukan SNI/ASHRAE.

### 6) Tulisan "Terhubung" tanpa gaya di luar kartu + gulir kosong — `dd373d5`
`index.html` menyediakan wadah `#sync-indicator-root`, dan `sync-ui.js` mengisinya dengan `.sync-badge > .sync-dot + .sync-text`. Ketiga kelas itu **tidak punya satu pun aturan CSS** (yang ada hanya `.sync-status`, milik indikator di header — komponen berbeda). Akibatnya tulisannya tergambar sebagai teks polos tanpa latar/border/jarak, dan elemennya ikut mengalir di badan halaman sehingga **tinggi halaman 926 px pada layar 900 px** (ponsel 870 px pada 844 px) → gulir kosong ±26 px bagi setiap pengunjung.

### 7) Label pendek berbahasa Inggris — `4977b9e`
**105 label** diterjemahkan di 44 berkas (daftar lengkap: `temuan-label-inggris.md`). Yang paling penting adalah lima label di halaman login — layar pertama yang dilihat setiap pengguna:

| Sebelum | Sesudah |
|---|---|
| `Consortium Entry` | **Masuk Sistem** |
| `SECURE SIGN-IN WITH GOOGLE` | **MASUK DENGAN GOOGLE** |
| `OR DIRECT ALIAS` | **ATAU MASUK LANGSUNG** |
| `IDENTITY ALIAS (EMAIL)` | **ALAMAT SUREL** |
| `SECURITY KEYCASE (PASSWORD)` | **KATA SANDI** |
| `AUTHORIZE DIRECT` | **MASUK** |

Sisanya mis. `Executive View` → *Tampilan Eksekutif*, `Generate PDF Report` → *Buat Laporan PDF*, `Encrypted View` → *Tampilan Terenkripsi*, `Active Cloud Repository` → *Repositori Cloud Aktif*, `Calculation Results` → *Hasil Perhitungan*, `Reset View` → *Atur Ulang Tampilan*, `No Preview Available` → *Pratinjau Tidak Tersedia*, `Proceed to Dashboard` → *Lanjut ke Dasbor*.

Kelima label di halaman login itu **lolos dari aturan audit sebelumnya** — aturan itu (E3) hanya mengenali *kalimat* utuh (minimal 5 kata + kata fungsi Inggris), sehingga label pendek tidak pernah terdeteksi. Karena itu ditambahkan aturan baru.

### 7b) Aturan audit baru agar tidak terulang — `4977b9e`
Aturan **E5 "Label antarmuka berbahasa Inggris"** di `scripts/ux-audit.mjs` memeriksa tiga bentuk label sekaligus, karena satu pun tidak cukup:

1. teks di antara dua tag (`>Label<`) — boleh berada di barisnya sendiri;
2. nilai atribut `placeholder` / `title` / `aria-label` / `alt`;
3. label yang datang dari **DATA**, mis. `{ text: 'Quantum Neural Synthesis…' }`, `{ label: 'Import Data' }`, `{ title: 'Executive Dashboard' }` — 9 di antaranya tidak terlihat oleh dua pola pertama, termasuk lima baris keunggulan di panel kiri halaman login.

Penjaga agar tidak berisik: satu kata Indonesia sudah cukup untuk meloloskan label; ejaan yang sama di dua bahasa (*data, volume, minimum, total, status*) tidak dihitung; istilah baku profesi (Pushover Analysis, ACH/DF Minimum Required, Daylight Factor, Noise Criteria, nama standar) tetap dibiarkan.

**Bukti aturan bekerja:** sebelum diterjemahkan, aturan melaporkan **79 + 23 + 9 label**; setelah diterjemahkan, **0 temuan**; diuji balik dengan mengembalikan satu label Inggris → temuan muncul kembali (41 temuan), lalu dihapus lagi → kembali 40.

### Permintaan Anda: pil status pindah ke dalam kartu login — `4977b9e`
`sync-ui.js` memindahkan wadah `#sync-indicator-root` ke `#login-sync-slot` (baru, di dalam kartu login, tepat di bawah "Terenkripsi oleh Smart AI Pengkaji") selama pengguna di halaman login; di halaman lain ia kembali menjadi elemen tetap di sudut layar. Pengait `route-changed` **dan** `MutationObserver` (sekali per frame, tidak menyentuh DOM bila posisinya sudah benar) membuat perpindahan terjadi seketika: terukur **sejak 0,8 detik** sudah berada di dalam kartu. Sebelum ini sempat terlambat sampai polling 5 detik dan sempat hilang sesaat karena isi `#app` dirender ulang.

---

## 4. Bukti pemeriksaan ulang di situs live (commit `4977b9e`)

| Pemeriksaan | Hasil |
|---|---|
| Berkas font Font Awesome | ✅ tidak ada 404 |
| Font termuat di peramban | ✅ *Font Awesome 6 Free* — lebar glif 21,0 px |
| Ikon halaman login | ✅ **7 / 7 tergambar** (desktop & ponsel), 0 kotak kosong |
| Tata letak ponsel 390 px | ✅ tidak ada elemen keluar layar; sisi kanan kartu 370 px |
| Service worker | ✅ terdaftar · cakupan `/pengkajislf/` · status activated · 15/15 aset ter-cache |
| Kalimat berbahasa Inggris di layar | ✅ 0 kalimat |
| Label berbahasa Inggris | ✅ 0 label (aturan E5) |
| Teks kartu login | ✅ seluruhnya bahasa Indonesia |
| Pil "Terhubung" | ✅ **di dalam kartu** (position: static, dalam batas kartu), terukur sejak 0,8 detik |
| Gulir kosong | ✅ 0 px (tinggi halaman = tinggi layar, 900/900 dan 844/844) |

**Mutu kode (dijalankan di repositori):**

- `npx vitest run` → 14 berkas / **264 uji lulus**
- `node scripts/ux-audit.mjs` → **40 temuan: 0 tinggi · 0 sedang · 40 rendah** (semuanya "gaya inline panjang" — kosmetik, bukan cacat tampilan; tidak naik dari sebelum perubahan)
- `npm run audit:code` → tidak ada import/export/rute rusak
- `node scripts/deep-audit.mjs` → KRITIS 0
- `rm -rf dist && npm run build` → exit 0; pemeriksa bundel: 102 berkas, tidak ada kunci/rahasia
- Alur CI untuk `288af28`, `8086e51`, `dd373d5`, dan `4977b9e` → semuanya `completed / success` (13 langkah hijau, termasuk deploy Edge Function)

> **Catatan penyimpanan.** Berkas tangkapan layar **tidak di-commit** ke repositori
> (ukurannya beberapa megabita dan dapat dihasilkan ulang kapan saja). Skrip di
> `tools/` menulisnya ke `tangkapan-live/` dan `tangkapan-dalam/` pada direktori
> kerja, dan kedua folder itu sudah masuk `.gitignore`.

**Berkas bukti tangkapan layar** di `tangkapan-live/`: `desktop-final.png`, `ponsel-final.png`, `ponsel-label-final.png` (kartu login setelah terjemahan + pil di dalam kartu), `desktop-label-final.png`, `ponsel-indikator.png` (sudut kiri bawah ponsel), serta pembanding sebelum perbaikan: `desktop-setelah-perbaikan.png` (masih ada 4 kotak kosong) dan `ponsel-diagnosa.png` (kartu terpotong).

---

## 5. Yang belum dikerjakan (dan mengapa)

**Nilai data berbahasa Inggris.** Sebagian teks di layar bukan label, melainkan **nilai hasil perhitungan**: mis. kolom "Status:" diikuti `COMPLIANT` / `NON-COMPLIANT` / `Wheelchair Accessible`. Nilai itu dipakai juga sebagai pembanding di dalam kode (`status === 'COMPLIANT'`), jadi menerjemahkannya hanya di lapisan tampilan akan membuat tampilan dan logika tidak sinkron. Perbaikannya harus menyeluruh: peta nilai di seluruh aplikasi. Ini kelas pekerjaan tersendiri, saya tidak lakukan tanpa persetujuan Anda — **beri tahu kalau ingin saya kerjakan**.

Istilah profesi dan nama standar tetap berbahasa Inggris dengan sengaja (daftar di `temuan-label-inggris.md` bagian B).

**Batas pemeriksaan ini:**

- Halaman **dalam** aplikasi (dashboard, analisis, laporan) tidak bisa dibuka tanpa akun, jadi bagian dalam diperiksa dari kode (peta ikon, label, gaya) — bukan tangkapan layar pengunjung.
- Alur **Google Sign-In tidak diuji sampai berhasil masuk** karena saya tidak memakai akun produksi.
- Angka "40 temuan audit" seluruhnya berkategori *rendah* (gaya inline panjang) — tidak memengaruhi tampilan yang dilihat pengguna.

---

## 6. Yang perlu Anda lakukan

1. **Cabut kedua token GitHub (PAT)** yang pernah Anda kirimkan di percakapan — keduanya sudah terpakai dan sebaiknya dianggap bocor: <https://github.com/settings/tokens>. (Setiap sesi baru meminta token lagi; itu wajar.)
2. Putuskan apakah **nilai data berbahasa Inggris (§5)** perlu diterjemahkan juga.
3. Masih tertahan dari sebelumnya: `SUPABASE_DB_URL` untuk pemeriksaan 112 tabel basis data.

## 7. Cara memeriksa ulang sendiri

```bash
cd pengkajislf
npm install
node scripts/ux-audit.mjs --verbose   # audit UI/UX, termasuk aturan ikon (E4) & label Inggris (E5)
npx vitest run                        # 264 uji
npm run dev                           # coba di http://localhost:5173
```

Untuk memeriksa situs live dengan peramban sungguhan, skrip yang saya pakai sudah disalin ke `tools/` — lihat `tools/README.md`.
