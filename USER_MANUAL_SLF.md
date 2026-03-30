# 📖 Manual Penggunaan: Smart AI Pengkaji SLF
> **Panduan Operasional Komprehensif untuk Auditor & Insinyur Pengkaji**

Selamat datang di sistem **Smart AI Pengkaji SLF**. Manual ini dirancang untuk memandu Anda melakukan audit bangunan gedung secara digital, akurat, dan berbasis AI sesuai standar **PP No. 16 Tahun 2021** dan **SNI 9273:2025**.

---

## 📑 DAFTAR ISI
1. [Tahap 1: Akses & Dashboard](#tahap-1)
2. [Tahap 2: Manajemen Proyek Baru](#tahap-2)
3. [Tahap 3: Audit Administrasi (OCR Dokumen)](#tahap-3)
4. [Tahap 4: Pemeriksaan Teknis (Daftar Simak Forensik)](#tahap-4)
5. [Tahap 5: Multi-Sample Audit (Baris Sampel)](#tahap-5)
6. [Tahap 6: Analisis AI Hybrid Reasoning](#tahap-6)
7. [Tahap 7: Finalisasi & Cetak Laporan](#tahap-7)

---

<a name="tahap-1"></a>
## 🔐 TAHAP 1: Akses & Dashboard Utama
Langkah awal untuk memulai pengkajian:
1. **Login**: Masukkan email dan password akun Pengkaji Anda.
2. **Dashboard**: Di sini Anda akan melihat ringkasan seluruh proyek yang sedang berjalan (Running), selesai (Done), atau tertunda (Pending).
3. **Statistik AI**: Perhatikan panel statistik untuk melihat berapa banyak item yang sudah dianalisis oleh AI.

---

<a name="tahap-2"></a>
## 🏗️ TAHAP 2: Membuat Proyek Audit Baru
Setiap bangunan gedung harus didaftarkan sebagai satu proyek unik.
1. Klik tombol **`[+] Buat Proyek SLF Baru`**.
2. **Data Umum**: Isi Nama Bangunan, Alamat Lengkap, Luas Bangunan, dan Jumlah Lantai.
3. **Klasifikasi**: Pilih Fungsi Bangunan (Hunian, Usaha, Sosial Budaya, dsb).
4. **Foto Sampul**: Unggah foto fasad (tampak depan) gedung agar proyek mudah dikenali.
5. Klik **Simpan Proyek**. Sistem akan otomatis menyiapkan database dan folder penyimpanan di Google Drive.

---

<a name="tahap-3"></a>
## 📂 TAHAP 3: Audit Kelengkapan Dokumen (Administrasi)
Tahap ini bertujuan untuk memvalidasi dokumen legalitas (IMB/PBG/As-Built Drawing).
1. Pilih tab **"Administrasi"**.
2. **Unggah Berkas**: Tarik file PDF (misal: IMB) ke kotak unggahan yang tersedia.
3. **Smart OCR Analysis**: Klik tombol **`Scan Dokumen`**. AI akan memindai teks di dalam PDF Anda untuk mendeteksi nomor dokumen, tanggal penerbitan, dan kesesuaian data.
4. **Skoring Otomatis**: Berdasarkan hasil scan, Anda dapat memberikan status (Lengkap/Tidak Lengkap) secara instan.

---

<a name="tahap-4"></a>
## 📐 TAHAP 4: Pemeriksaan Teknis (Daftar Simak Forensik)
Ini adalah inti dari proses pengkajian lapangan. Terdiri dari Arsitektur, Struktur, dan Utilitas (MKKG).
1. Pilih tab **"Daftar Simak"**.
2. Anda akan melihat **Blok Kuning (Forensic View)** yang berisi daftar item pemeriksaan sesuai regulasi PUPR.
3. **Status Pemeriksaan**: Klik tombol status (BAIK, RUSAK RINGAN, RUSAK SEDANG, dsb). Warnanya akan berubah secara otomatis sesuai standar grading engineering.
4. **Catatan Auditor**: Isi catatan fakta lapangan (misal: "Ditemukan retak rambut sepanjang 2 meter").

---

<a name="tahap-5"></a>
## 🗂️ TAHAP 5: Multi-Sample Audit (Banyak Titik Sampel)
Gunakan fitur ini jika pemeriksaan dilakukan pada banyak ruangan/titik dalam satu kategori.
1. Klik tombol **`[+] Tambah Baris Sampel Baru`**.
2. Sistem akan membuat baris baru (misal: **Sampel 1: Ruang Dekan**, **Sampel 2: Ruang Rapat**).
3. Setiap sampel dapat memiliki **Status** dan **Foto** bukti yang berbeda.
4. Klik ikon Kamera pada setiap baris untuk mengunggah foto bukti spesifik titik tersebut.

---

<a name="tahap-6"></a>
## 🧠 TAHAP 6: Memicu Analisis AI Hybrid Reasoning
Cara mendapatkan narasi audit profesional dalam hitungan detik.
1. Pastikan Anda sudah mengisi **Catatan Auditor** atau mengunggah **Foto**.
2. Klik tombol **`Tarik Analisis AI`** (Ikon Petir Kuning).
3. **Proses AI**: Sistem akan mengirim data fakta lapangan Anda ke konsorsium AI (Gemini/Mistral/OpenAI).
4. **Hasil Narasi**: AI akan menghasilkan teks audit ilmiah (misal: "Berdasarkan pengamatan visual, kolom struktur mengalami degradasi akibat korosi tulangan..."). Anda bisa mengedit hasil ini jika diperlukan.

---

<a name="tahap-7"></a>
## 📄 TAHAP 7: Finalisasi & Cetak Laporan Akhir
Langkah terakhir setelah seluruh audit mencapai progres 100%.
1. Periksa tab **"Kesimpulan Akhir"**. Klik tombol **`Generate Kesimpulan Otomatis`** agar AI merangkum seluruh temuan menjadi Ringkasan Eksekutif.
2. Pilih status kelaikan: **LAIK FUNGSI** atau **TIDAK LAIK FUNGSI**.
3. Klik tombol **`Cetak Laporan Lengkap (.docx)`**.
4. **Selesai**: File Microsoft Word akan terunduh. Laporan tersebut sudah diformat rapi sesuai standar laporan resmi SLF (Bab I - Bab V).

---

## 💡 Tips untuk Hasil Audit Maksimal
- **Gunakan Foto yang Jelas**: AI memiliki kemampuan Vision (Pixtral/Gemini) yang sangat tajam dalam mendeteksi jenis retak jika foto yang diunggah berkualitas baik.
- **Catatan Spesifik**: Semakin detil catatan auditor Anda (misal: menyebutkan dimensi retak dalam mm), semakin akurat narasi teknis yang dihasilkan AI.
- **Auto-Save**: Sistem melakukan penyimpanan otomatis secara berkala, namun pastikan Anda menekan tombol **`Simpan Progres`** sebelum menutup aplikasi.

---
**Smart AI Pengkaji SLF** 
*Partner Digital Anda dalam Mewujudkan Bangunan Aman & Laik Fungsi.*
