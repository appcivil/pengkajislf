# 📑 Cheat Sheet Placeholder Laporan SLF (Smart AI Pengkaji)

Gunakan daftar variabel di bawah ini di dalam template Google Docs Anda dengan format **`{{NAMA_VARIABLE}}`**. Sistem akan otomatis menggantinya dengan data nyata dari proyek saat tombol *Generate* diklik.

---

## 🏗️ 1. Identitas Bangunan & Proyek
Data yang diambil dari profil proyek yang Anda isi di aplikasi.

| Placeholder | Deskripsi | Contoh Output |
| :--- | :--- | :--- |
| `{{NAMA_BANGUNAN}}` | Nama lengkap gedung | Gedung Menara Saidah |
| `{{FUNGSI_BANGUNAN}}` | Fungsi sesuai PBG | Perkantoran |
| `{{JENIS_BANGUNAN}}` | Klasifikasi bangunan | Bangunan Tinggi |
| `{{ALAMAT_LENGKAP}}` | Alamat, Kota, dan Provinsi | Jl. Gatot Subroto, Jakarta Selatan, DKI Jakarta |
| `{{PEMILIK}}` | Nama pemilik/perusahaan | PT. Jaya Konstruksi |
| `{{TAHUN_DIBANGUN}}` | Tahun konstruksi selesai | 2010 |
| `{{JUMLAH_LANTAI}}` | Total lantai gedung | 12 Lantai |
| `{{LUAS_BANGUNAN}}` | Total luas lantai (m²) | 5.500 m² |
| `{{LUAS_LAHAN}}` | Total luas lahan (m²) | 2.000 m² |
| `{{JENIS_KONSTRUKSI}}`| Sistem struktur utama | Beton Bertulang / Baja |
| `{{NOMOR_PBG}}` | Nomor izin bangunan | PBG-3273-01022024-01 |

---

## 📅 2. Tanggal & Konsultan
Atribut waktu laporan dan identitas perusahaan pengkaji.

| Placeholder | Deskripsi | Contoh Output |
| :--- | :--- | :--- |
| `{{TANGGAL_LAPORAN}}` | Tanggal hari ini (Full) | 30 Maret 2026 |
| `{{BULAN_TAHUN}}` | Bulan dan Tahun | Maret 2026 |
| `{{TAHUN}}` | Tahun saja | 2026 |
| `{{NAMA_KONSULTAN}}` | Nama PT/CV Konsultan | CV. Smart AI Engineering |
| `{{ALAMAT_KONSULTAN}}`| Alamat kantor konsultan | Jl. Puspa No. 10, Bandung |
| `{{KOTA_PENETAPAN}}` | Kota tempat tanda tangan | Bandung |
| `{{TANGGAL_PENETAPAN}}`| Tanggal tanda tangan | 30 Maret 2026 |

---

## 📊 3. Hasil Skoring AI (Kuantitatif)
Nilai kepatuhan yang dihasilkan oleh mesin perhitungaan AI (0-100).

| Placeholder | Deskripsi | Acuan Standar |
| :--- | :--- | :--- |
| `{{SKOR_TOTAL}}` | **Skor Kepatuhan Akhir** | **Gabungan Semua Aspek** |
| `{{SKOR_ADMINISTRASI}}`| Skor aspek dokumen | PP 16/2021 |
| `{{SKOR_STRUKTUR}}` | Skor kekuatan struktur | SNI 1726/1727 |
| `{{SKOR_ARSITEKTUR}}` | Skor tata ruang & fasad | NSPK Arsitektur |
| `{{SKOR_MEP}}` | Skor utilitas & listrik | SNI PUIL / Plumbing |
| `{{SKOR_KEBAKARAN}}` | Skor proteksi kebakaran | Permen PU 26/2008 |
| `{{SKOR_KESEHATAN}}` | Skor sanitasi & udara | Permen PUPR 14/2017 |
| `{{SKOR_KENYAMANAN}}` | Skor suhu, suara, getaran | SNI Kenyamanan |
| `{{SKOR_KEMUDAHAN}}` | Skor aksesibilitas (difabel) | Permen PU 30/2006 |

---

## 🧠 4. Hasil Analisis AI (Kualitatif)
Kesimpulan naratif dan status kelaikan hasil Deep Reasoning AI.

| Placeholder | Deskripsi | Contoh Output |
| :--- | :--- | :--- |
| `{{RISK_LEVEL}}` | Tingkat risiko teknis | RENDAH / SEDANG / TINGGI |
| `{{STATUS_SLF}}` | Status kelaikan fungsi | LAIK FUNGSI BERSYARAT |
| `{{STATUS_SLF_NARATIF}}`| Penjelasan detail status | "Bangunan dapat dioperasikan dengan syarat..." |
| `{{NARASI_BAB4}}` | **Analisis Komprehensif** | **Teks panjang analisis per aspek (Bab IV)** |

---

## 📑 5. Statistik Checklist
Ringkasan jumlah temuan pemeriksaan lapangan.

| Placeholder | Deskripsi | Contoh Output |
| :--- | :--- | :--- |
| `{{TOTAL_ITEM}}` | Total parameter diperiksa | 124 |
| `{{ITEM_SESUAI}}` | Jumlah item yang "Baik" | 110 |
| `{{ITEM_TIDAK_SESUAI}}`| Jumlah temuan/kerusakan | 14 |
| `{{PERSEN_KEPATUHAN}}` | Persentase (%) | 88% |

---

## 📉 6. Tabel Dinamis (Otomatis)
**Cara Penggunaan:** Buat tabel di Google Docs, lalu ketik kode placeholder di bawah ini pada **Baris Pertama, Kolom Pertama**. Baris di bawahnya akan otomatis terisi data sebanyak temuan yang ada.

| Placeholder | Nama Tabel | Kolom yang Dihasilkan |
| :--- | :--- | :--- |
| `{{TABLE_CHECKLIST_ADMIN}}`| Checklist Administrasi | No, Kode, Item, Status, Catatan |
| `{{TABLE_CHECKLIST_TEKNIS}}`| Checklist Teknis | No, Kode, Item, Status, Catatan |
| `{{TABLE_SKOR_ASPEK}}` | Ringkasan Skoring | No, Aspek, Skor, Bobot, Acuan |
| `{{TABLE_REKOMENDASI_P1}}` | Rekomendasi Kritis | No, Aspek, Tindakan, Standar, Prioritas |
| `{{TABLE_REKOMENDASI_P2}}` | Rekomendasi Sedang | No, Aspek, Tindakan, Standar, Prioritas |
| `{{TABLE_TIM_AHLI}}` | Daftar Tenaga Ahli | No, Nama Ahli, SKA/NRE, Paraf |

---

## 💡 Contoh Implementasi di Bab Laporan

**Bab I: Pendahuluan**
> Berdasarkan pemeriksaan pada gedung **{{NAMA_BANGUNAN}}** yang beralamat di **{{ALAMAT_LENGKAP}}**, diperoleh kesimpulan awal bahwa bangunan yang dimiliki oleh **{{PEMILIK}}** ini memiliki luas **{{LUAS_BANGUNAN}}**.

**Bab V: Kesimpulan**
> Berdasarkan skor kepatuhan sebesar **{{SKOR_TOTAL}}%**, maka bangunan dinyatakan:
> ### **{{STATUS_SLF}}**
