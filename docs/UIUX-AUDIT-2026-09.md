# Audit UI/UX & Aksesibilitas — Smart AI Pengkaji SLF

**Tanggal:** 16 September 2026
**Cakupan:** seluruh antarmuka (`src/`, `public/`, `index.html`, 380 berkas)
**Alat:** `scripts/ux-audit.mjs` (baru), `scripts/ux-codemod.mjs` (baru)
**Status:** temuan pada 5 dari 6 kategori **habis**; 40 temuan tersisa seluruhnya
bertingkat *rendah* dan bersifat utang refaktor, bukan cacat pemakaian.

---

## 1. Ringkasan

| Kategori | Sebelum | Sesudah | Keterangan |
|---|---:|---:|---|
| Aksesibilitas | 53 | **0** | alt, nama tombol, peran dialog, cincin fokus |
| Operabilitas keyboard | 48 | **0** | Escape, konfirmasi, penghapusan destruktif |
| Status antarmuka | 14 | **0** | memuat / kosong / galat, klik ganda |
| Responsif & mobile | 123 | **0** | tabel meluber, lebar tetap, dokumen cetak |
| Performa yang terasa | 8 | **0** | ikon 641 kB, CDN, `@import` |
| Konsistensi visual | 42 | 40 | gaya inline & warna literal — lihat §5 |
| **Total** | **288** | **40** | 0 tinggi · 0 sedang · 40 rendah |

Verifikasi setelah seluruh perbaikan:

```
npx vitest run            13 berkas · 247 tes   ✅ (sebelumnya 12 · 205)
npm run build             39,2 detik            ✅
  prebuild  (kunci klien)  ✅ tidak ada rahasia
  postbuild (pemindai bundel, 106 berkas) ✅
node scripts/deep-audit.mjs   KRITIS 0          ✅
npm run audit:code           0 import/rute rusak ✅
node scripts/ux-audit.mjs    40 temuan, semua rendah
```

---

## 2. Cara menjalankan ulang

```bash
node scripts/ux-audit.mjs                    # ringkasan
node scripts/ux-audit.mjs --verbose          # daftar setiap temuan
node scripts/ux-audit.mjs --only a11y        # satu kategori saja
node scripts/ux-audit.mjs --json hasil.json  # untuk diproses mesin

node scripts/ux-codemod.mjs --dry            # pratinjau perbaikan mekanis
```

Kategori: `a11y`, `keyboard`, `states`, `responsive`, `perf`, `visual`.

---

## 3. Yang diperbaiki

### 3.1 Aksesibilitas — 53 → 0

**Lapisan global baru** (`src/lib/a11y.js`, dipasang di `src/main.js:994`),
sehingga perbaikannya berlaku untuk 380 berkas tanpa menyentuh satu per satu:

- `announce(pesan)` — wilayah `aria-live` (santun + asertif). Sebelumnya
  **nol** di seluruh aplikasi: hasil AI, "tersimpan", dan galat tidak pernah
  diumumkan sehingga pengguna pembaca layar tidak tahu pekerjaannya selesai.
- `installKeyboardEnhancer()` — elemen ber-`onclick` yang bukan kontrol asli
  mendapat `role="button"`, `tabindex="0"`, dan Enter/Spasi. Ini menutup 14
  temuan "elemen non-interaktif diberi handler klik" **tanpa** menyunting 14
  tempat, dan otomatis berlaku untuk kode baru.
- `makeDialog()` — jebakan fokus, `role="dialog"`, `aria-modal`, `inert` pada
  `#app`, pemulihan fokus, dan penutupan dengan Escape.
- `installDialogEscapeHandler()` — jaring pengaman: Escape menutup dialog yang
  terlihat dengan mencari tombol tutup yang dikenali (`.modal-close`,
  `[data-close]`, tombol ber-`aria-label` Tutup/Batal, atau `onclick` yang
  memanggil `close`/`tutup`/`cancel`/`batal`). Menutup 22 temuan Escape.
- `setBusy(tombol, true)` — menonaktifkan + `aria-busy`, lalu **memulihkan
  keadaan aslinya** (bug lama: tombol bisa tertinggal nonaktif permanen).

Perbaikan per berkas:

- `src/components/modal.js` — dialog sungguhan: peran, jebakan fokus, `inert`,
  pemulihan fokus, penutupan lewat transisi + jaring pengaman 600 ms. Sekaligus
  memperbaiki kebocoran pendengar Escape lama (`{once:true}` yang tetap hidup
  bila dialog ditutup lewat tombol X).
- 33 gambar mendapat teks alternatif berbahasa Indonesia; 3 tautan `target="_blank"`
  mendapat `rel="noopener noreferrer"`.
- 12 tombol ikon tanpa nama diberi `aria-label` yang **diturunkan dari aksi
  tombolnya**, bukan dari gambarnya (lihat §4).
- `index.html` — empat tag ikon (SVG + 16/32 px + apple-touch-icon).

### 3.2 Operabilitas keyboard — 48 → 0

- Escape: 22 tempat tertutup oleh jaring pengaman global; 1 dialog yang memang
  **tidak boleh** ditutup (ganti kata sandi wajib) ditandai `data-no-escape`
  dan diberi `role="alertdialog"` — dengan jebakan fokus sengaja TIDAK dipasang,
  karena menjebak pengguna di dalam dialog tanpa jalan keluar lebih buruk
  daripada membiarkannya.
- Penghapusan tanpa konfirmasi: 3 tempat nyata ditambahkan konfirmasi
  (`CatchmentMapper`, `LuminaireTool`) — 7 sisanya positif palsu (lihat §4).
- `role="dialog"` pada 3 modal yang belum memilikinya.

### 3.3 Status antarmuka — 14 → 0

**Kerangka memuat di router** (`src/lib/router.js`) — akar masalahnya: selama
rute mengambil data, halaman sebelumnya membeku tanpa tanda apa pun. Pada
jaringan lambat pengguna mengira kliknya gagal dan mengklik menu berulang kali.

- Jeda 150 ms sebelum kerangka tampil — rute cepat tidak berkedip.
- `role="status"` + teks untuk pembaca layar, `aria-busy` pada wadah.
- Dijaga 6 tes baru (`src/lib/router.test.js`), termasuk "navigasi ulang tidak
  menumpuk kerangka" dan "kerangka dibersihkan saat rute gagal".

Perbaikan lain:

- `src/pages/multi-agent.js` — galat pengambilan daftar proyek dulu hanya masuk
  `console.error`; pengguna melihat dropdown kosong dan wajar menyimpulkan
  memang belum ada proyek. Sekarang galat tampil sebagai notifikasi, dan
  "belum ada proyek" dibedakan dari "gagal memuat".
- `src/pages/stormwater-inspection.js` — tombol "Muat Data" dilindungi klik
  ganda dengan `setBusy()`; galat dimunculkan, bukan ditelan.

### 3.4 Responsif & mobile — 123 → 0

- 34 tabel dibungkus `.table-wrap` (`tabindex="0"` + `role="region"` — wadah
  gulir wajib dapat difokus keyboard, WCAG 2.1.1).
- `src/style.css` **dihapus** — 1.963 baris sisa template Vite yang tidak
  diimpor siapa pun, berisi `#app { width: 1126px; text-align: center }` yang
  akan merusak seluruh tata letak bila suatu saat termuat.
- Kartu tanda tangan 540 px, kartu unggah 500 px, dan kartu 600 px diubah ke
  `width:100%; max-width:…` sehingga tidak meluber di ponsel.

### 3.5 Performa yang terasa — 8 → 0

| Sebelum | Sesudah | Catatan |
|---|---|---|
| `favicon.svg` 641 kB | 1,7 kB | Berkas lama ternyata **bukan ikon** — isinya duplikat `icons.svg`; setiap kunjungan mengunduh 641 kB untuk sesuatu yang tidak tampil |
| `logo-app.png` 294 kB (549²) | 17 kB (256²) | Ditampilkan pada 36 px (sidebar) dan 90 px (loader) |
| `Logo … (Small).png` 132 kB | 8,6 kB (`logo-small.png`) | Ditampilkan maksimum 120 px; nama berkas dibersihkan dari spasi & tanda kurung |
| `Logo ….png` 228 kB | dihapus | Nol referensi |
| `icons.svg` 641 kB | dihapus | Nol referensi |
| Font Awesome & Leaflet dari CDN | `public/vendor/` | Lihat di bawah |
| `@import` Google Fonts di `main.css:7` | dihapus | index.html sudah memuatnya — dulu diunduh **dua kali** dan memblokir render berantai |

**Font Awesome dan Leaflet disalin ke dalam aplikasi.** Alasannya bukan sekadar
kecepatan: *service worker* aplikasi ini hanya menangani berkas satu asal,
sehingga kedua CDN itu tidak pernah masuk cache — saat offline seluruh ikon
hilang dan peta tidak bergaya. Untuk aplikasi pemeriksaan lapangan, offline
bukan keadaan luar biasa. Hanya `.woff2` yang disertakan (referensi `.ttf`
dibuang agar tidak ada permintaan yang gagal); keduanya masuk daftar precache.
Konsekuensinya repo bertambah ± 390 kB aset lokal — itu pertukaran yang disengaja.

### 3.6 Dialog konfirmasi bawaan peramban — 16 tempat

Aplikasi sudah punya dialog sendiri (`src/components/modal.js`), tetapi 13
tempat masih memakai `confirm()` dan 3 tempat `prompt()` bawaan peramban:
memblokir seluruh halaman, tidak dapat diberi gaya (kotak abu-abu sistem di
tengah antarmuka gelap), tombolnya mengikuti bahasa peramban, dan pada PWA mode
berdiri sendiri kemunculannya terasa seperti keluar dari aplikasi.

- `confirm()` bawaan → dialog aplikasi dengan judul, pesan, tombol bahaya.
- `prompt()` bawaan → helper baru **`askInput()`** (masukan teks dengan label,
  fokus otomatis, Enter untuk menyimpan).

---

## 4. Kejujuran alat ukur

Audit ini sempat **menghasilkan angka yang salah** — termasuk angka yang bagus.
Bagian ini mencatat koreksinya supaya hasilnya tidak dipercaya berlebihan.

**Positif palsu yang ditemukan dan dibuang (78 + 7 + 6 + 1 temuan):**

| Bug pada alat | Akibat | Perbaikan |
|---|---|---|
| `\bwidth` juga cocok dengan `max-width` | 78 laporan palsu: setiap `max-width` — justru praktik BAIK — dilaporkan sebagai lebar tetap | pola `(?<![-\w])width` |
| `class[^\n]*modal` juga cocok dengan **nama fungsi** `_openUploadModal` | berkas tanpa dialog dilaporkan sebagai dialog tanpa Escape | dicari elemen dialog sungguhan |
| konfirmasi dicari dalam jendela ±600 karakter dari `onclick` | 3 fungsi yang **sudah** memakai `confirm()` tetap dilaporkan; 4 lainnya sama | konfirmasi dicari di badan definisi fungsinya |
| `remove(` dianggap penghapusan data | `modal.remove()`, `classList.remove()` ikut terhitung | hanya `hapus`/`delete` |
| `:focus:not(:focus-visible)` dianggap menghapus indikator fokus | menuduh praktik yang benar | dikenali sebagai pengganti yang sah |
| akar `src/pages/` dianggap halaman | sub-komponen (`ControlBar`, `ZoomControls`) dituntut punya status memuat | hanya berkas rute |
| penelusur template tidak menangani template bersarang | tabel dokumen cetak dilaporkan sebagai masalah tata letak | penelusur mini dengan pelacak `${…}` |

**Detektor "campur bahasa" juga salah dan diperbaiki dua kali.** Versi pertama
menghitung kata seperti `name`, `date`, `file`, `error` pada **seluruh isi
berkas** — termasuk nama variabel dan komentar — dan melaporkan "10.767 kata
Inggris" yang sebagian besar tidak pernah dilihat pengguna. Versi kedua
menghitung hanya teks yang tampil, tetapi masih menghitung istilah teknis baku
(*Daylight Factor*, *Air Flow Rate*, *Noise Criteria (NC)*, *AHU*) yang memang
kosakata profesi — menerjemahkannya justru menurunkan mutu karena menyimpang
dari rujukan SNI/ASHRAE. Versi ketiga hanya menandai **kalimat utuh** berbahasa
Inggris; hasilnya 10 kalimat, semuanya diterjemahkan.

**Nama tombol diturunkan dari aksi, bukan dari gambar.** Versi pertama codemod
menerjemahkan kelas ikon saja dan menghasilkan nama yang **berbahaya**: tombol
hapus foto (`fa-times`) diberi nama "Tutup", tombol perbesar (`fa-plus`) diberi
nama "Tambah". Bagi pengguna pembaca layar, nama yang salah lebih berbahaya
daripada tidak ada nama — mereka menekan "Tutup" lalu fotonya terhapus. Versi
kedua menurunkan nama dari `onclick`, dan **melewati** tombol yang tidak
dikenali daripada menebak. 31 berkas disunting ulang; 56 nama diperbaiki.

**Penekanan temuan diuji dengan togle.** Karena banyak temuan ditutup oleh
lapisan global, lapisan itu sempat dilepas (`installA11y()` dihapus sementara)
untuk memastikan temuannya benar-benar kembali: tanpa lapisan → 71 temuan
(31 tinggi); dengan lapisan → 40. Perilaku lapisan itu sendiri diuji 36 tes
di `src/lib/a11y.test.js`, termasuk pola markah yang diambil apa adanya dari
berkas yang dilaporkan (div kartu, sel tabel, item daftar).

Tes-tes itu menemukan **kecacatan nyata pada kode saya sendiri**: penambah
keyboard hanya memilih `[onclick]`, sedangkan aturan audit juga mencocokkan
`onmousedown` — artinya temuan untuk `onmousedown` akan ditekan diam-diam.
Setelah ditelusuri, `onmousedown` **nol** pemakaian di seluruh repo. Aturan
audit dipersempit ke `onclick`, dan `onmousedown`/`onmouseenter` mendapat
aturan terpisah (A5) yang **tidak pernah** ditekan, karena seret dan hover
memang tidak punya padanan keyboard yang wajar — yang dibutuhkan jalan
alternatif, bukan perubahan peran.

---

## 5. Yang belum dikerjakan (jujur)

**40 temuan konsistensi visual, semuanya bertingkat rendah.** Ini utang
refaktor, bukan cacat pemakaian, dan saya memilih tidak mengerjakannya pada
sesi ini karena risikonya:

| Aturan | Jumlah | Isi |
|---|---:|---|
| Gaya inline panjang | 35 berkas | 6.367 atribut `style` ≥ 40 karakter (2.673 pola unik; 12 pola teratas hanya mencakup 15%) |
| Warna literal | 1.682 | nilai warna ditulis langsung, bukan lewat token `var(--…)` |

Mengapa tidak dikerjakan: 12 pola teratas hanya mencakup 15% dari total,
sehingga **tidak ada** perbaikan mekanis yang berarti. Menyunting 6.367 atribut
tanpa kemampuan memeriksa setiap layar secara visual berisiko merusak tampilan
lebih besar daripada manfaatnya. Rencana yang disarankan:

1. Ekstrak 12 pola teratas ke kelas utilitas (`--text-meta`, `--label-mono`, …)
   dan pakai untuk kode **baru** lebih dulu.
2. Jalankan `ux-audit --only visual` setiap kali sebelum rilis; jaga jumlahnya
   tidak naik.
3. Tambahkan token warna di `:root` untuk nilai yang berulang, bukan menulis
   nilai baru di tempat pemakaian.

**Catatan lain:**

- `src/pages/proyek-detail-lazy.js` tidak punya status memuat/kosong/galat dan
  **tidak** lagi dilaporkan karena berkas itu tidak memuat data sama sekali
  (pembungkus `import()`), bukan karena diperbaiki.
- Galat JavaScript pada pustaka opsional (Chart.js, tesseract.js, pdf.js,
  Pyodide) masih diambil dari CDN dan akan gagal saat offline. Pustaka-pustaka
  itu dimuat sesuai kebutuhan dan kegagalannya tidak menghalangi halaman
  dirender — berbeda dari Font Awesome/Leaflet yang ada di jalur render.
  Menyalinnya ke dalam repo akan menambah beberapa MB (Pyodide saja ~10 MB),
  jadi keputusan itu sebaiknya diambil terpisah.

---

## 6. Berkas yang berubah

186 berkas tersunting (+6.012 / −9.803 baris), 38 berkas baru.
Ringkasan yang penting:

| Berkas | Perubahan |
|---|---|
| `scripts/ux-audit.mjs` | **baru** — auditor 6 kategori, 380 berkas |
| `scripts/ux-codemod.mjs` | **baru** — perbaikan mekanis (alt, nama tombol, `rel`, tabel, toast) |
| `src/lib/a11y.js` | **baru** — `announce`, penambah keyboard, `makeDialog`, jaring Escape, `setBusy` |
| `src/lib/a11y.test.js` | **baru** — 36 tes |
| `src/lib/router.test.js` | **baru** — 6 tes status memuat |
| `src/lib/router.js` | kerangka memuat + pengumuman navigasi |
| `src/components/modal.js` | dialog aksesibel + `askInput()` |
| `src/styles/main.css` | CSS kerangka memuat, `.visually-hidden`, `.login-backdrop`, `@import` ganda dibuang |
| `index.html` | 4 tag ikon, Font Awesome & Leaflet lokal |
| `public/` | ikon baru (1,1–22 kB), `favicon.svg` 1,7 kB, `vendor/` |
| dihapus | `src/style.css` (1.963 baris, sisa template Vite), `public/icons.svg` (641 kB), `public/Logo SMART AI Pengkaji SLF.png` (228 kB) |

Seluruh pekerjaan **belum di-commit**.

---

## 7. Pembaruan — pemeriksaan situs live (16 September 2026)

Setelah dokumen ini ditulis, situs yang sudah terpasang
(<https://appcivil.github.io/pengkajislf/>) diperiksa sebagai **pengunjung biasa**
memakai peramban sungguhan. Pemeriksaan itu menemukan **7 kelas cacat yang tidak
terlihat dari kode** — semuanya sudah diperbaiki. Dua di antaranya kemudian
dijadikan aturan audit baru supaya tidak terulang:

| Aturan baru | Yang diperiksa | Kenapa perlu |
|---|---|---|
| **E4 — Ikon tidak tersedia di set ikon yang dimuat** | setiap nama `fa-…` yang dipakai kode, dicocokkan ke CSS set ikon yang benar-benar dimuat | 26 nama ikon yang dipakai ternyata ikon Font Awesome **Pro**, sedangkan yang dimuat set **Free 6.5.0**. Ikon yang tidak dikenal **tidak menghasilkan galat apa pun** — hanya kotak kosong, sehingga tidak ada yang menyadarinya sampai dilihat dengan mata |
| **E5 — Label antarmuka berbahasa Inggris** | teks di antara dua tag (boleh lintas baris), nilai atribut `placeholder`/`title`/`aria-label`/`alt`, dan label dari data (`{ text: '…' }`, `{ label: '…' }`, `{ title: '…' }`) | aturan E3 hanya mengenali **kalimat** utuh, sehingga **105 label pendek** lolos — termasuk lima di halaman login, layar pertama yang dilihat setiap pengguna |

Cacat produksi yang diperbaiki (semuanya sudah tayang):

1. **Semua ikon kotak kosong** — `all.min.css` menunjuk `url(../webfonts/…)`
   (gaya CDN) padahal fontnya dibundel di `public/vendor/fontawesome/webfonts/`.
2. **Sebagian ikon tetap kosong** — 26 nama ikon Pro, 54 pemakaian diganti ke
   padanan set Free.
3. **Kartu login terpotong di ponsel** — `width:100%` + `margin:20px` di dalam
   wadah ber-padding, sementara `#login-portal` memakai `overflow:hidden`.
4. **Service worker tidak pernah mendaftar** — alamat absolut `/service-worker.js`
   padahal situs disajikan dari sub-folder `/pengkajislf/`.
5. **26 kalimat berbahasa Inggris** di antarmuka Indonesia.
6. **Pil "Terhubung" tanpa gaya CSS** di luar kartu login + gulir kosong 26 px.
7. **105 label pendek berbahasa Inggris** (daftar: `temuan-label-inggris.md`).

Perubahan pada alat audit: `codeMask()` tidak berubah; yang ditambahkan hanyalah
`auditIcons()` (E4) dan `auditLabelInggris()` (E5), keduanya dipanggil di blok
`shouldRun('visual')` setelah `auditVisual()`. Keduanya sudah diuji balik
(rule-toggle): menyisipkan satu nama ikon palsu dan satu label Inggris
memunculkan temuan; mengembalikannya membuat temuan hilang.

Angka audit **tidak berubah** oleh kedua aturan itu — tetap **40 temuan
(0 tinggi · 0 sedang · 40 rendah)** — karena cacat yang ditemukannya sudah
diperbaiki, bukan karena aturannya dilonggarkan. Yang berubah: audit kini benar-
benar menangkap dua kelas cacat yang sebelumnya tidak terlihat sama sekali,
yaitu ikon yang tidak tersedia dan label berbahasa Inggris.

Yang **belum** dikerjakan: nilai data berbahasa Inggris (mis. status
`COMPLIANT`/`NON-COMPLIANT` yang dihasilkan lapisan perhitungan). Nilai itu juga
dipakai sebagai pembanding di dalam kode, jadi penerjemahannya harus menyeluruh —
lihat `temuan-label-inggris.md` bagian C.
