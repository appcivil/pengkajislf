# Laporan pemeriksaan tampilan dalam aplikasi

**Situs:** <https://appcivil.github.io/pengkajislf/> (dan aplikasinya sendiri, bukan hanya halaman login)
**Tanggal:** 17 September 2026
**Versi:** commit `1305998` — sudah terpasang, CI **lulus** (13 langkah hijau)
**Cara memeriksa:** aplikasi dijalankan lokal, masuk memakai **mode pratinjau**, lalu **37 rute disapu satu per satu dengan peramban sungguhan** (Chromium) pada **1440×900** dan **390×844**. Setiap halaman diukur DOM-nya (lebar dokumen, posisi elemen, gaya terhitung, tumpang-tindih antar-elemen, jumlah notifikasi) dan dipotret. Bukan pemeriksaan "membaca kode".

---

## 1. Ringkasan

**8 kelompok cacat** ditemukan dan diperbaiki. Yang paling merusak adalah nomor 1 — selama ini **sebagian besar tombol di aplikasi tidak berfungsi**.

| # | Cacat | Akibat bagi pengguna | Diperbaiki |
|---|---|---|---|
| 1 | `window.navigate` hanya dipasang di halaman Dasbor | **103 tombol** di halaman lain mati: "window.navigate is not a function" — termasuk tombol PROYEK BARU, tab pemeriksaan, tombol keluar | `1305998` |
| 2 | Notifikasi galat tak terbatas | 9 notifikasi "Gagal" menutupi **separuh layar** dan menutupi tombol yang dibutuhkan | `1305998` |
| 3 | Empat keluarga kelas CSS dipakai tapi **tidak pernah didefinisikan** | Lencana verifikasi, bilah konteks proyek, spanduk peringatan, teks status kosong → tergambar tanpa bentuk | `1305998` |
| 4 | Kaki sidebar meluber keluar rel 72 px | Kartu pengguna terukur pada x = −71…143 px (rel 0…72), terpotong tepi layar; lencana tertumpuk kartu | `1305998` |
| 5 | Tombol chat menutupi menu bawah ponsel | Menu "Hub AI" tidak bisa ditekan | `1305998` |
| 6 | `#/tier-checklist` tanpa proyek → error | Halaman kosong tanpa penjelasan | `1305998` |
| 7 | Judul header kosong untuk 25 dari 46 rute | Header menampilkan nama aplikasi, bukan nama halaman | `1305998` |
| 8 | Alur masuk masih berbahasa Inggris | Pesan galat login ("Identity alias is invalid…") muncul tepat saat pengguna gagal masuk | `1305998` |

Ditambah 16 label pemuatan yang bocor sebagai nama rute ("Memuat files…") dan dua label menu bawah yang masih Inggris ("Home", "AI Hub").

---

## 2. Yang paling penting: navigasi mati

Ini bukan soal tampilan, tetapi ditemukan justru karena memeriksa tampilan.

`window.navigate(...)` dipanggil dari **103 tempat** melalui atribut `onclick` — seluruh menu, tombol, tab, dan tabel di aplikasi. Tetapi fungsinya **hanya dipasang di satu berkas**: `src/pages/dashboard.js`. Akibatnya:

- membuka halaman apa pun selain Dasbor lalu menekan tombol → **tidak terjadi apa-apa**, dan pengguna melihat notifikasi merah "**Gagal — window.navigate is not a function**";
- bahkan dari Dasbor pun tidak selalu tersedia, sebab `dashboard.js` dimuat secara malas (lazy) — bila pengguna langsung membuka `#/proyek`, tombolnya sama-sama mati.

**Perbaikan:** dipasang sekali di kerangka aplikasi (`pasangNavigateGlobal()` di `src/components/layout.js`), dipanggil dari `main.js` **sebelum rute mana pun dirender** — halaman login pun memakainya untuk tombol mode pratinjau. Penetapan lama di `dashboard.js` dihapus.

**Bukti:** pada bundel produksi `typeof window.navigate === 'function'` → YA, dan `window.navigate('proyek')` benar-benar berpindah ke `#/proyek`. Sebelum perbaikan, alat penyapu 37 rute selalu memunculkan galat ini di setiap halaman.

---

## 3. Notifikasi yang menutupi layar

Pesan galat sengaja tidak hilang sendiri (agar terbaca), tetapi satu halaman yang gagal memuat beberapa berkas sekaligus memanggilnya berulang-ulang. Terukur di halaman **Simulasi Pencahayaan** dan **Verifikasi**: **9 notifikasi "Gagal"** berturut-turut menutupi separuh sisi kanan layar — dan ikut menutupi tombol yang justru dibutuhkan pengguna untuk memperbaiki masalahnya.

**Perbaikan:** maksimal **3 notifikasi** tampil bersamaan; yang dibuang adalah yang **tertua**, sehingga yang selalu terlihat adalah pesan terbaru. Diuji dengan 6 uji baru di `src/components/toast.test.js` (termasuk urutan pembuangan dan perlakuan pesan kosong).

---

## 4. Kelas CSS yang hilang (pola yang berulang)

Empat keluarga komponen memakai kelas yang **tidak punya satu pun aturan CSS**. Pola yang sama seperti pil "Terhubung" yang diperbaiki ronde lalu:

| Keluarga kelas | Yang tergambar sebelum diperbaiki |
|---|---|
| `.verified-badge` · `.badge-icon` · `.badge-text` | Lencana "PENGKAJI TERVERIFIKASI" di kaki sidebar — teksnya bahkan tidak dirender karena `.badge-text` tanpa tata letak |
| `.project-context-bar` · `.context-*` · `.ctx-btn` · `.context-status-pill` · `.status-dot` | Bilah konteks proyek yang muncul di setiap halaman proyek |
| `.bypass-warning-banner` · `.sync-banner` | Spanduk "Mode Pratinjau" dan status sinkronisasi: tanpa latar, ikon tidak sejajar, dan di layar 390 px **teksnya terpotong tepi kanan** |
| `.empty-sub` · `.animate-fade-in` | Kalimat penjelas pada status kosong; animasi masuk |

Untuk `.verified-badge`, riwayatnya ditelusuri lewat `git log -S`: aturannya **pernah ada** di versi lama berkas, lalu hilang saat berkas ditulis ulang — sedangkan markup-nya tetap memakai kelas itu. Semua kini punya aturan yang mengikuti bahasa desain yang sudah ada (latar kaca, sudut membulat, aksen emas/biru), bukan gaya baru yang berdiri sendiri.

---

## 5. Tata letak: sidebar & ponsel

**Kaki sidebar meluber keluar rel.** Mode ringkas memakai flex **baris** pada `.sidebar-footer`, sementara lencana dan kartu pengguna tidak punya aturan mode ringkas (ikut hilang bersama §4). Terukur: kartu pengguna berada pada **x = −71…143 px** padahal rel sidebar **0…72 px** — keluar 71 px ke kiri dan 71 px ke kanan, terpotong tepi layar. Kini keduanya **ditumpuk vertikal**: avatar di atas, bulatan lencana di bawah. Diperiksa ulang: **0 elemen keluar rel**.

**Tombol chat menutupi menu bawah.** `.floating-chat-wrapper` dipatok 1 rem dari dasar layar, sedangkan menu bawah setinggi **72 px** ada di sana — tombol chat menimpa menu "Hub AI". Kini dinaikkan ke atas menu (termasuk menghitung safe-area perangkat). Diperiksa ulang: **tumpang-tindih 0 px²**.

**Banner Mode Pratinjau terpotong.** Di layar 390 px, teksnya melewati tepi kanan karena `span` di dalam flex tidak boleh mengecil. Kini membungkus di dalam kolomnya dan ikon sejajar baris pertama. Diperiksa ulang: **gulir mendatar 0 px**.

---

## 6. Kekosongan yang menyesatkan & label yang bocor

- **Judul header.** Peta judul hanya punya **11 entri** untuk **46 rute**, sehingga 25 halaman (Berkas, Galeri, Simulasi, seluruh halaman pemeriksaan) menampilkan nama aplikasi "Smart AI SLF" sebagai judul — pengguna tidak dapat memastikan sedang di halaman mana. Peta kini lengkap: **41 ikon**, semuanya diverifikasi ada di set ikon yang dimuat.
- **Label pemuatan bocor sebagai nama rute:** "Memuat files…", "Memuat surat pernyataan list…". **16 label** ditambahkan ke `ROUTE_LABELS` di `src/lib/router.js`.
- **Menu bawah ponsel:** "Home" → **Dasbor**, "AI Hub" → **Hub AI**.
- **Halaman `#/tier-checklist` tanpa proyek** sebelumnya error (`TypeError: Cannot read properties of null`) dan hanya menyisakan halaman kosong. Kini ada penjaga yang menjelaskan dan mengarahkan ke pemilihan proyek.

---

## 7. Alur masuk: 10 teks diperbaiki

Pesan galat yang muncul **tepat saat pengguna gagal masuk** masih berbahasa Inggris, dan tombol kembali memakai teks lamanya:

| Sebelum | Sesudah |
|---|---|
| `Identity alias is invalid or missing.` | **Alamat surel belum diisi atau formatnya salah.** |
| `Security key is too short or missing.` | **Kata sandi belum diisi atau kurang dari 6 karakter.** |
| `Identity Verification Rejected.` | **Surel atau kata sandi tidak cocok.** |
| `VERIFYING...` / `AUTHORIZE DIRECT` | **MEMVERIFIKASI...** / **MASUK** |
| `Bypass Failure: …` | **Mode pratinjau gagal dibuka: …** |

Navigasi setelah berhasil masuk juga tidak lagi bergantung pada global: `login.js` mengimpor `navigate` langsung dari router.

---

## 8. Verifikasi

| Pemeriksaan | Hasil |
|---|---|
| `npx vitest run` | **15 berkas / 270 uji lulus** (6 uji baru untuk notifikasi) |
| `node scripts/ux-audit.mjs` | **40 temuan — 0 tinggi · 0 sedang · 40 rendah**, tidak naik dari sebelum perubahan |
| `npm run audit:code` | 0 import/export/dependensi rusak |
| `node scripts/deep-audit.mjs` | KRITIS 0 (112 tabel tanpa skema menunggu `SUPABASE_DB_URL`) |
| `rm -rf dist && npm run build` | exit 0; pemeriksa bundel: 102 berkas bersih |
| Sapuan ulang 37 rute | **0 halaman meluber**, **0 galat "is not a function"** |
| Kaki sidebar | 0 elemen keluar rel · **0 px²** tumpang-tindih tombol chat dengan menu bawah |
| Ponsel 390 px | gulir mendatar **0 px**; banner, menu bawah, tombol chat rapi |

**Tangkapan layar bukti** (sebelum → sesudah) di `tangkapan-dalam/`:
`desktop/` berisi **37 tangkapan halaman versi SEBELUM perbaikan** (mis. `lighting-simulation.png` dengan 9 notifikasi menumpuk, `verify.png` sama), sedangkan `ponsel-dashboard-setelah.png`, `dashboard-setelah.png`, `kaki-sidebar-setelah.png`, dan `bilah-konteks.png` menunjukkan hasil sesudahnya.

> **Catatan penyimpanan.** Berkas tangkapan layar **tidak di-commit** ke repositori
> (ukurannya beberapa megabita dan dapat dihasilkan ulang kapan saja). Skrip di
> `tools/` menulisnya ke `tangkapan-live/` dan `tangkapan-dalam/` pada direktori
> kerja, dan kedua folder itu sudah masuk `.gitignore`.

**Alat yang saya tulis untuk ini** ada di `tools/`: `sapu-halaman.mjs` (menyapu seluruh rute + mengukur), `ukur-sidebar.mjs`, `cek-pinggir.mjs`, `cek-ponsel.mjs`, `uji-produksi.mjs`.

---

## 9. Yang BELUM diperbaiki — jujur

1. **Isi halaman dalam tidak dapat dinilai penuh di sini.** Aplikasi memakai Supabase; di lingkungan saya URL-nya palsu, jadi daftar proyek, dasbor, dan laporan tampil sebagai **kerangka memuat** ("skeleton"). Artinya: **tata letak, kerangka, dan navigasi** sudah diperiksa dan diperbaiki, tetapi **kepadatan isi, tabel berisi data, dan grafik** belum pernah saya lihat terisi. Untuk menilainya saya perlu data contoh atau akun uji.
2. **Label Inggris di halaman dalam masih banyak** — mis. "Room Layout", "3D Visualization", "Draw a room in 2D view to start", "Deep Reasoning Center", "AI Design Studio", "AUTHORIZED PERSONNEL DIRECTORY". Sebagian adalah label pendek yang belum masuk kamus, sebagian **nilai data** (status `COMPLIANT`, `PASS`) yang juga dipakai sebagai pembanding di kode sehingga penerjemahannya harus menyeluruh. Ini pekerjaan tersendiri — bilang saja kalau mau saya lanjutkan.
3. **Kolom pencarian di header tidak melakukan apa pun.** Ia memancarkan peristiwa `global-search`, tetapi **tidak ada satu pun pendengar** di seluruh aplikasi. Pilihannya: diimplementasikan (mencari proyek/berkas/tugas) atau disembunyikan sampai siap. Saya belum memutuskan sendiri karena ini menyangkut fitur, bukan tampilan.
4. **112 tabel tanpa skema** masih menunggu `SUPABASE_DB_URL` dari Anda (tertahan sejak beberapa ronde lalu).

---

## 10. Yang perlu Anda lakukan

1. **Cabut token GitHub** yang Anda kirimkan di percakapan: <https://github.com/settings/tokens> (sudah terpakai; setiap sesi baru memang meminta lagi).
2. Beri tahu kalau mau saya lanjutkan ke butir §9 nomor 1–3 (isi halaman dalam dengan data contoh, terjemahan lanjutan, kolom pencarian).
3. Kirim `SUPABASE_DB_URL` bila ingin pemeriksaan 112 tabel diselesaikan.

## 11. Cara memeriksa ulang sendiri

```bash
cd pengkajislf
npm install
npm run dev                              # http://localhost:5173
node scripts/ux-audit.mjs --verbose       # audit UI/UX
npx vitest run                            # 270 uji
node tools/sapu-halaman.mjs http://localhost:5173/ desktop   # sapu 37 rute
```
