# Alat periksa tampilan & label (tools/)

Skrip-skrip ini membuka situs **sebagai pengunjung biasa** memakai peramban
sungguhan (Chromium headless) dan memeriksa hal-hal yang tidak terlihat dari
kode: ikon yang gagal tergambar, elemen yang keluar layar, service worker yang
tidak mendaftar, pil status yang salah tempat, dan label yang masih berbahasa
Inggris.

## Persiapkan sekali

```bash
mkdir -p ~/alat-playwright && cd ~/alat-playwright
npm init -y && npm i playwright
npx playwright install chromium
sudo npx playwright install-deps chromium     # butuh pustaka sistem, sekali saja
```

Skrip memakai `import { chromium } from 'playwright'`, jadi jalankan dari folder
yang berisi `node_modules/playwright` (mis. `~/alat-playwright`), atau salin
folder ini ke sana.

## Periksa situs (butuh jaringan)

```bash
node verifikasi-lokal.mjs https://appcivil.github.io/pengkajislf/
#   7 pemeriksaan: berkas font tidak 404 · font termuat · lebar glif ikon wajar ·
#   tidak ada elemen keluar layar 390 px · kartu login di dalam layar ·
#   service worker terdaftar · tidak ada kalimat Inggris.
#   Tangkapan layar ke ./tangkapan-live/

node cek-ikon.mjs <url>       # setiap <i class="fa-…">: punya glif & lebar ≥ 1 px?
node cek-login.mjs <url>      # pil status di dalam kartu? teks kartu Indonesia?
                              # gulir kosong? elemen keluar layar? → + tangkapan layar
node cek-badge.mjs <url>      # gaya pil #sync-indicator-root (lebih ringkas)
node debug-slot.mjs <url>     # memantau ke mana wadah pil terpasang, per detik
node ambil-bukti.mjs <url>    # tangkapan layar desktop 1440×900 & ponsel 390×844
                              # + rekap jumlah ikon yang tergambar
```

Ganti alamat dengan `http://localhost:5173/` untuk memeriksa versi pengembangan.

## Periksa label berbahasa Inggris (tanpa jaringan)

```bash
node tools/daftar-label.mjs .        # label dari teks di template & atribut
node tools/daftar-label-data.mjs .   # label yang datang dari data, mis. { text: '…' }
node tools/terjemahkan-label.mjs .            # uji: laporkan saja
node tools/terjemahkan-label.mjs . --tulis    # terapkan kamus-label.json
```

`kamus-label.json` memuat 105 terjemahan yang dipakai. Skrip penerjemah mengganti
**hanya** potongan yang terdeteksi sebagai label (teks di antara dua tag, nilai
atribut label, dan nilai `text:`/`label:`/`title:` pada data), sehingga kunci
objek, `id`, dan perbandingan string tidak tersentuh.

Aturan yang setara sudah tertanam di `scripts/ux-audit.mjs` sebagai **E5**, jadi
pemeriksaan rutin tidak bergantung pada skrip-skrip ini:

```bash
node scripts/ux-audit.mjs --verbose     # daftar label Inggris yang tersisa
```

## Periksa halaman DALAM aplikasi (perlu masuk)

Aplikasi memakai Supabase; di kotak uji, `.env` diisi nilai palsu dan tombol
"mode pratinjau" dipakai untuk masuk tanpa backend.

```bash
cd pengkajislf && npm run dev            # http://localhost:5173

node sapu-halaman.mjs http://localhost:5173/ desktop
#   Menyapu 37 rute: lebar dokumen (gulir mendatar?), halaman yang masih
#   "memuat", jumlah h1, tepi kiri isi, teks terlalu redup, galat konsol,
#   + tangkapan layar setiap halaman ke /home/user/tangkapan-dalam/<mode>/

node ukur-sidebar.mjs <url>    # pohon elemen sidebar + apakah ada yang terpotong
node cek-pinggir.mjs <url>     # elemen yang keluar dari rel sidebar 72 px
node cek-ponsel.mjs <url>      # 390×844: gulir mendatar, banner, menu bawah,
                               # tumpang-tindih tombol chat dengan menu bawah
node uji-produksi.mjs <url>    # pada bundel produksi: apakah window.navigate
                               # tersedia & navigasi benar-benar berpindah rute
```

Catatan: halaman dalam akan tampil sebagai kerangka memuat karena backend
palsu — itu wajar. Yang dinilai adalah tata letak, kerangka, dan navigasi.
