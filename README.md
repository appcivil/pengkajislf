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

## 📖 Deskripsi Proyek

**Smart AI Pengkaji SLF** adalah platform *Enterprise-Grade* berbasis *Progressive Web App* (PWA) yang dirancang khusus untuk memodernisasi cara Insinyur dan Konsultan Pengkaji Teknis melakukan audit bangunan. Menggunakan teknologi **Hybrid AI**, sistem ini mampu mentransformasi data mentah hasil inspeksi menjadi narasi evaluasi teknis yang koheren, mendalam, dan patuh terhadap regulasi nasional.

### ⚖️ Kepatuhan Standar & Regulasi
Aplikasi ini di-tuning secara khusus untuk selaras dengan:
*   **PP No. 16 Tahun 2021**: Peraturan Pelaksanaan UU Bangunan Gedung.
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
Mendukung inspeksi banyak titik dalam satu parameter pemeriksaan (misal: Ruang Kelas 1, 2, 3...). Fitur **Add Row Dinamis** memungkinkan auditor menambahkan baris sampel tanpa batas dengan struktur data yang tetap terorganisir.

### 3. 🎨 Yellow Block Forensic UI (Standard PUPR 1:1)
Antarmuka pada tab "Daftar Simak" didesain identik dengan formulir fisik audit forensik PUPR. Menggunakan sistem blok kontras tinggi (Yellow Block) untuk meminimalkan kesalahan input dan memudahkan verifikasi visual.

### 4. ☁️ Google Drive Proxy Storage
Integrasi dengan **Google Apps Script (GAS)** memungkinkan unggahan file foto dan PDF audit berukuran besar langsung ke Google Drive Proyek, menjaga database Supabase tetap ringan dan file mudah diakses secara kolaboratif.

### 5. 📑 Professional Word Reporting & Synthesis
Mengompilasi temuan dari ratusan titik sampel menjadi draf **BAB IV – ANALISIS DAN EVALUASI** otomatis. Laporan dihasilkan dalam format `.docx` profesional lengkap dengan matriks risiko dan rekomendasi perbaikan teknis.

---

## 🛠️ Stack Teknologi

*   **Runtime**: [Vite](https://vitejs.dev/) & Vanilla JavaScript (ESM).
*   **Persistence**: [Supabase](https://supabase.com/) (PostgreSQL & RLS Policy).
*   **Storage Proxy**: [Google Apps Script](https://developers.google.com/apps-script).
*   **LLM Providers**: Gemini API, Mistral API, OpenAI API, Anthropic API, Hugging Face.

---

## 📂 Struktur Direktori Utama

```text
├── gas/                 # Google Apps Script (Drive Proxy & PDF Generator)
├── src/
│   ├── lib/             # Logic (AI Router, Supabase, Prompt Library)
│   ├── pages/           # Page Controller (Checklist, Dashboard, Auth)
│   ├── styles/          # Design System (Yellow Block Forensic CSS)
│   └── main.js          # Entry Point Aplikasi
├── public/              # Assets & Favicon
├── .env.example         # Template Konfigurasi Environment
└── supabase_schema.sql  # Skema Database PostgreSQL
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
