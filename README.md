<div align="center">
  <img src="/smartaipengkaji/favicon.svg" width="80" height="80" alt="Logo" />
  <h1>🏢 Smart AI Pengkaji SLF</h1>
  <p><strong>Sistem Pakar Berbasis AI untuk Audit Forensik & Pengkajian Teknis Sertifikat Laik Fungsi (SLF) Bangunan Gedung</strong></p>
  
  <p>
    <img src="https://img.shields.io/badge/Version-1.1.0-blue?style=for-the-badge" alt="Version" />
    <img src="https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E" alt="Vite" />
    <img src="https://img.shields.io/badge/Mistral_AI-FF6300?style=for-the-badge&logo=mistral&logoColor=black" alt="Mistral AI" />
    <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
    <img src="https://img.shields.io/badge/Forensic_1:1-000000?style=for-the-badge&logo=pdf&logoColor=white" alt="Forensic 1:1" />
  </p>
</div>

---

## 📖 Deskripsi# Smart AI Pengkaji SLF (v3.0 Professional)

**Smart AI Pengkaji SLF** adalah platform *forensic engineering* berbasis AI yang dirancang untuk mengotomatisasi proses pengkajian teknis Bangunan Gedung (SLF) di Indonesia. Sistem ini menggabungkan kecerdasan buatan multi-agent dengan standar regulasi **PP No. 16 Tahun 2021 (NSPK PUPR)** untuk menghasilkan laporan kajian yang audit-ready, komprehensif, dan profesional.

## Fitur Utama v3.0 Professional
- 🧠 **Forensic AI Engine**: Analisis 6-langkah (Identifikasi s/d Rekomendasi).
- 🏗️ **Multi-Disciplinary Experts**: Konsorsium AI Arsitektur, Struktur, MEP, dan Kelistrikan.
- 🔌 **Sistem Kelistrikan PUIL 2020**: Inspeksi panel, thermal imaging, proteksi, dan compliance.
- 🏛️ **Struktur Bangunan ASCE 41-17**: Evaluasi tier, NDT testing (Rebound/UPV), analisis seismik.
- 📄 **Executive Report Synthesis**: Laporan 6-bab dengan integrasi data Struktur & Kelistrikan.
- 🛡️ **Security Hardened (Supabase v15.0)**: RLS ketat dan audit trail.
- ☁️ **Cloud Sync Integration**: Sinkronisasi otomatis dengan Google Docs & Drive.
*   **SNI 9273:2025**: Standar nasional terbaru untuk Evaluasi Bangunan Gedung Eksisting.
*   **Standar PUPR**: Format Daftar Simak Forensik 1:1 dan logika skoring kerusakan I - V.

---

## ✨ Fitur Unggulan Terbaru

### 1. 🧠 Multi-Model AI Router (Mistral AI Integrated)
Sistem cerdas `ai-router.js` kini mendukung **Mistral AI** (Mistral Large & Pixtral) sebagai tenaga ahli tambahan. Dilengkapi jalur failover otomatis:
*   **Primary**: Google Gemini 2.0 & Mistral Large.
*   **Alternative**: OpenAI GPT-4o & Claude 3.5 Sonnet.
*   **Vision**: Pixtral 12B & Gemini Vision untuk deteksi kerusakan visual.

### 2. 🗂️ Multi-Sample Point Inspection
Mendukung inspeksi banyak titik dalam satu parameter pemeriksaan (misal: Ruang Kelas 1, 2, 3...). Fitur5.  **Audit Laporan**: Sistem akan menyintesis Bab IV menggunakan 6-Step Forensic Logic.
6.  **Finalisasi**: Tanda tangani secara digital dan simpan versi PDF/Word.
tetap terorganisir.

### 3. 🎨 Yellow Block Forensic UI (Standard PUPR 1:1)
Antarmuka pada tab "Daftar Simak" didesain identik dengan formulir fisik audit forensik PUPR. Menggunakan sistem blok kontras tinggi (Yellow Block) untuk meminimalkan kesalahan input dan memudahkan verifikasi visual.

### 4. ☁️ Google Drive Proxy Storage
Integrasi dengan **Google Apps Script (GAS)** memungkinkan unggahan file foto dan PDF audit berukuran besar langsung ke Google Drive Proyek, menjaga database Supabase tetap ringan dan file mudah diakses secara kolaboratif.

### 5. 📑 Professional Word Reporting & Synthesis
Mengompilasi temuan dari ratusan titik sampel menjadi draf **BAB IV – ANALISIS DAN EVALUASI** otomatis. Laporan dihasilkan dalam format `.docx` profesional lengkap dengan matriks risiko dan rekomendasi perbaikan teknis.

### 6. ⚡ Sistem Kelistrikan (PUIL 2020 / SNI / IEC)
Modul inspeksi sistem kelistrikan dengan fitur lengkap:
*   **Panel Management**: Registrasi MDB, SMDB, DB dengan spesifikasi lengkap.
*   **Load Analysis**: Analisis pembebanan real-time dengan status Safe/Warning/Overload.
*   **Thermal Imaging**: Upload & analisis gambar inframerah untuk deteksi hotspot.
*   **Protection Coordination**: Verifikasi koordinasi proteksi MCB/MCCB.
*   **Data Logger Import**: Import CSV/Excel dari power meter otomatis.
*   **Simulasi**: MCB Upgrade, Load Transfer, dan Cable Sizing.
*   **Compliance Check**: Validasi terhadap PUIL 2020, SNI 0225:2011, IEC 60364.

### 7. 🏛️ Struktur Bangunan (ASCE 41-17 / SNI 1726:2019)
Evaluasi ketahanan gempa dan kondisi struktur:
*   **ASCE 41-17 Tier Evaluation**: Tier 1 (Screening), Tier 2 (Evaluation), Tier 3 (Detailed).
*   **NDT Testing**: Rebound Hammer Test (ASTM C805) & UPV Test (ASTM C597).
*   **Seismic Analysis**: Perhitungan parameter seismik SNI 1726:2019.
*   **Pushover Analysis**: Analisis performa gempa non-linear.
*   **Material Strength**: Evaluasi kekuatan beton hasil uji NDT.

### 8. � Laporan DOCX Terintegrasi
Laporan kajian SLF kini mencakup:
*   **BAB 3.5**: Pemeriksaan Struktur Bangunan (hasil NDT, tier evaluation, rekomendasi).
*   **BAB 3.6**: Pemeriksaan Sistem Kelistrikan (status panel, thermal, proteksi).
*   Template-based generation dengan data real-time dari database.

---

## �🛠️ Stack Teknologi

*   **Runtime**: [Vite](https://vitejs.dev/) & Vanilla JavaScript (ESM).
*   **Persistence**: [Supabase](https://supabase.com/) (PostgreSQL & RLS Policy).
*   **Storage Proxy**: [Google Apps Script](https://developers.google.com/apps-script).
*   **LLM Providers**: Gemini API, Mistral API, OpenAI API, Anthropic API, Hugging Face.

---

## 📂 Struktur Direktori Utama

```text
├── gas/                 # Google Apps Script (Drive Proxy & PDF Generator)
├── src/
│   ├── components/      # UI Components (Electrical, Struktur, Checklist)
│   ├── lib/             # Logic (AI Router, Supabase, DOCX Generator, Electrical Calc)
│   ├── pages/           # Page Controller (Checklist, Dashboard, Electrical, Struktur)
│   ├── styles/          # Design System (Yellow Block Forensic CSS)
│   └── main.js          # Entry Point Aplikasi
├── public/              # Assets & Favicon
├── supabase/            # Edge Functions & SQL Migrations
│   └── functions/
├── .env.example         # Template Konfigurasi Environment
├── supabase_schema.sql  # Skema Database PostgreSQL
└── supabase_electrical_tables.sql  # Skema Tabel Electrical Inspection
```

---

## 🚀 Panduan Memulai

### 1. Instalasi
```bash
git clone https://github.com/bangPUPR/Pengkaji-smart-AI.git
npm install
```

### 2. Konfigurasi Environment (`.env`)
Salin file `.env.example` menjadi `.env` dan lengkapi kredensial:

```env
# SUPABASE SETUP
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# AI ENGINE API KEYS
VITE_GEMINI_API_KEY=...
VITE_MISTRAL_API_KEY=...
VITE_OPENAI_API_KEY=...

# DRIVE PROXY
VITE_DRIVE_PROXY_URL=https://script.google.com/macros/s/.../exec
```

### 3. Jalankan Aplikasi
```bash
npm run dev
```

---

## 📄 Lisensi & Disclaimer
Sistem ini adalah alat bantu (*Expert Support System*). Seluruh output yang dihasilkan oleh AI tetap memerlukan validasi dan pengesahan akhir oleh **Insinyur Pengkaji Berlisensi**. 

---
<div align="center">
  <p>Dikembangkan oleh <strong>Tim Smart AI Pengkaji</strong></p>
  <p>&copy; 2026 - Forensic AI Building Audit System</p>
</div>
