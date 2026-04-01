// ============================================================
//  MULTI-MODEL AI ROUTER - CHUNKED PER-ITEM PROCESSING
//  Solusi "Pro Level" - Engineering Reasoning & Deep Research Mode (SNI 9273:2025)
// ============================================================

const env = import.meta.env;
import { SLF_PROMPT_LIBRARY } from './slf-prompt-library.js';
import { getPromptConfig, injectPromptConfig } from './prompt-config-service.js';
import { getSettings } from './settings.js';

function getItemConfig(kode) {
  if (!SLF_PROMPT_LIBRARY || !SLF_PROMPT_LIBRARY.modules) return null;
  for (const mod of SLF_PROMPT_LIBRARY.modules) {
    if (mod.sub_items) {
      const found = mod.sub_items.find(s => s.id === kode);
      if (found) return found;
    }
  }
  return null;
}

// Model Router Config 
export const MODELS = {
  GEMINI: {
    id: 'gemini-3.1-flash-lite-preview', 
    name: 'Gemini 3.1 Flash Lite',
    url: env.PROD 
      ? `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent?key=${env.VITE_GEMINI_API_KEY}`
      : `/api/gemini/v1beta/models/gemini-3.1-flash-lite-preview:generateContent?key=${env.VITE_GEMINI_API_KEY}`,
    vendor: 'google'
  },
  GROQ: {
    id: 'llama-3.3-70b-versatile',
    name: 'Groq Llama 3.3',
    url: env.PROD ? 'https://api.groq.com/openai/v1/chat/completions' : '/api/groq/v1/chat/completions', 
    key: env.VITE_GROQ_API_KEY,
    vendor: 'openai'
  },
  OPENROUTER: {
    id: 'google/gemini-2.0-flash-lite:free',
    name: 'OpenRouter Free',
    url: env.PROD ? 'https://openrouter.ai/api/v1/chat/completions' : '/api/openrouter/v1/chat/completions', 
    key: env.VITE_OPENROUTER_API_KEY,
    vendor: 'openrouter'
  },
  OPENAI: {
    id: 'gpt-4o',
    name: 'OpenAI GPT-4o',
    url: env.PROD ? 'https://api.openai.com/v1/chat/completions' : '/api/openai/v1/chat/completions', 
    key: env.VITE_OPENAI_API_KEY,
    vendor: 'openai'
  },
  CLAUDE: {
    id: 'claude-3-5-sonnet-20241022',
    name: 'Claude 3.5 Sonnet',
    url: env.PROD ? 'https://api.anthropic.com/v1/messages' : '/api/claude/v1/messages', 
    key: env.VITE_CLAUDE_API_KEY,
    vendor: 'anthropic'
  },
  GEMMA_3: {
    id: 'gemma-3-27b-it',
    name: 'Gemma 3 27B Instruct',
    url: env.PROD 
      ? `https://generativelanguage.googleapis.com/v1beta/models/gemma-3-27b-it:generateContent?key=${env.VITE_GEMINI_API_KEY}`
      : `/api/gemini/v1beta/models/gemma-3-27b-it:generateContent?key=${env.VITE_GEMINI_API_KEY}`,
    vendor: 'google'
  },
  SLF_OPUS: {
    id: 'adminskpslf/SLF_OPUS',
    name: 'SLF OPUS Reasoning (Hugging Face)',
    url: env.VITE_HF_SLF_OPUS_URL || (env.PROD 
      ? 'https://api-inference.huggingface.co/models/adminskpslf/SLF_OPUS'
      : '/api/hf/models/adminskpslf/SLF_OPUS'),
    key: env.VITE_HF_API_TOKEN,
    vendor: 'huggingface'
  },
  MISTRAL: {
    id: 'mistral-large-latest',
    name: 'Mistral Large (Mistral AI)',
    url: env.PROD ? 'https://api.mistral.ai/v1/chat/completions' : '/api/mistral/v1/chat/completions',
    key: env.VITE_MISTRAL_API_KEY,
    vendor: 'mistral'
  }
};

/**
 * EXPERT PERSONAS - Konsorsium Ahli SLF
 * Digunakan untuk Multi-Agent Consensus (Analisis Forensik Berjenjang)
 */
export const EXPERT_PERSONAS = {
  ARSITEK: `Anda adalah Ahli Arsitektur & Tata Bangunan Senior. 
    Tugas: Mengevaluasi GSB, KDB, KLB, penampilan bangunan, dan efektivitas tata ruang. 
    Fokus: Kesesuaian IMB/PBG terhadap visual lapangan dan kenyamanan ruang.`,
  STRUKTUR: `Anda adalah Ahli Struktur & Konstruksi Forensik Senior. 
    Tugas: Menganalisis integritas fondasi, retak beton, korosi baja, dan risiko kegagalan struktur. 
    Fokus: Keselamatan jiwa (Safety First) dan pemenuhan standar SNI Struktur/Geoteknik.`,
  MEP: `Anda adalah Ahli Mekanikal, Elektrikal, Plumbing, dan Kebakaran. 
    Tugas: Mengevaluasi sistem lift, kelistrikan, penangkal petir, sanitasi, dan proteksi kebakaran. 
    Fokus: Kesehatan dan Keandalan operasional bangunan gedung sesuai standar MKKG.`,
  LEGAL: `Anda adalah Ahli Legal & Administrasi Perizinan Bangunan (SIMBG). 
    Tugas: Evaluasi dokumen PBG, IMB, Sertifikat Tanah, dan SLO. 
    Fokus: Asas hukum perizinan, masa berlaku dokumen, dan kesesuaian dokumen legalitas.`,
  KOORDINATOR: `Anda adalah Lead Forensic Engineer & Koordinator Tim Penilai SLF. 
    Tugas: Mensintesis laporan dari Arsitek, Struktur, MEP, dan Legal menjadi Kesimpulan Final Bab V (Analisis) & Bab VI (Kesimpulan).
    Fokus: Menentukan apakah bangunan LAYAK FUNGSI, LAYAK FUNGSI DENGAN CATATAN, atau TIDAK LAYAK FUNGSI.`
};

// Debug: Verifikasi Status API Keys (Hanya deteksi keberadaan, bukan validitas)
console.log("[AI Engine] Status Kunci API:", {
  Gemini: !!env.VITE_GEMINI_API_KEY,
  OpenAI: !!env.VITE_OPENAI_API_KEY,
  Claude: !!env.VITE_CLAUDE_API_KEY,
  Groq: !!env.VITE_GROQ_API_KEY,
  OpenRouter: !!env.VITE_OPENROUTER_API_KEY,
  Mistral: !!env.VITE_MISTRAL_API_KEY
});

/**
 * Utilitas Retry Otomatis (safeCall) dengan Exponential Backoff
 */
const delay = (ms) => new Promise(res => setTimeout(res, ms));

async function safeCall(fn, retries = 3, attempt = 1) {
  try {
    return await fn();
  } catch (e) {
    const isRateLimit = e.message.includes('429') || e.message.toLowerCase().includes('quota');
    
    if (isRateLimit && attempt <= retries) {
      const waitTime = attempt * 2000; // 2s, 4s, 6s
      console.warn(`[AI Router] Rate Limit (429). Retry ${attempt}/${retries} dalam ${waitTime}ms...`);
      await delay(waitTime);
      return safeCall(fn, retries, attempt + 1);
    }
    
    if (retries <= 0 || attempt > retries) throw e;
    
    console.warn(`[AI Router] Retry ${attempt}/${retries}. Error: ${e.message}`);
    await delay(1000);
    return safeCall(fn, retries, attempt + 1);
  }
}

/**
 * Smart JSON Extraction - Mencari blok {...} atau [...]
 */
function extractJSON(text) {
  try {
    const match = text.match(/\{[\s\S]*\}/) || text.match(/\[[\s\S]*\]/);
    if (!match) return null;
    const clean = match[0].replace(/\n/g, " "); // Basic cleanup
    return JSON.parse(clean);
  } catch (e) {
    // Fallback: coba bersihkan karakter kontrol
    try {
      const match = text.match(/\{[\s\S]*\}/);
      const sanitized = match[0].replace(/[\x00-\x1F\x7F-\x9F]/g, " ");
      return JSON.parse(sanitized);
    } catch (e2) {
      return null;
    }
  }
}

/**
 * Prompt Granular Per Item - Engineering Reasoning Mode
 */
function getPromptForItem(item, aspek, roleTitle, standard) {
  const statusLabel = {
    'ada_sesuai': 'Ada & Sesuai Standar',
    'ada_tidak_sesuai': 'Penyimpangan Dokumen/Kondisi',
    'tidak_ada': 'Ketidakadaan (Missing Data/Component)',
    'buruk': 'Degradasi Berat',
    'kritis': 'Kegagalan Teknis Kritis',
    'tidak_wajib': 'Pengecualian (N/A)'
  }[item.status] || item.status;

  const cfg = getItemConfig(item.kode) || {};
  const currentPersona = cfg.persona || `Anda adalah ${roleTitle} - Pakar Audit Forensik Bangunan Gedung tingkat lanjut.`;
  const formulasInstruct = cfg.formulas ? `Gunakan perhitungan teknis berikut: ${JSON.stringify(cfg.formulas)}` : '';
  const reasoningFlow = cfg.slf_reasoning_flow ? `Ikuti alur penalaran ini: ${JSON.stringify(cfg.slf_reasoning_flow)}` : '';

  const standardRef = aspek.toLowerCase().includes('struktur') ? 'SNI 1726, SNI 2847, dan SNI 9273:2025' : (item.metadata?.nspk_ref || standard);
  const nspkContext = item.metadata?.nspk_ref ? `\n- REFERENSI NSPK KHUSUS (DIREKOMENDASIKAN BOT): ${item.metadata.nspk_ref}. Gunakan standar ini sebagai acuan utama dalam penulisan narasi.` : '';

  const promptConfig = getPromptConfig();
  let deepReasoningHeader = "";
  
  if (promptConfig && promptConfig.active) {
    deepReasoningHeader = injectPromptConfig(promptConfig.system_instructions, promptConfig.principles);
    deepReasoningHeader = `\n[DEEP REASONING CUSTOM ACTIVE]\n${deepReasoningHeader}\n`;
  } else {
    deepReasoningHeader = `[SISTEM CONTINUOUS LEARNING V6 & HYBRID AI AKTIF]\nAnda adalah ${currentPersona}`;
  }

  return `${deepReasoningHeader}
Tugas: Menyusun LAPORAN KAJIAN TEKNIS FORENSIK MENDALAM KHUSUS untuk satu (1) parameter uji berikut.

# INFORMASI ITEM
- ASPEK: ${aspek.toUpperCase()}
- KODE: ${item.kode}
- NAMA PARAMETER: ${item.nama}
- STATUS EKSISTING: ${statusLabel}
- CATATAN LAPANGAN: ${item.catatan || 'Kondisi lapangan memerlukan estimasi kedalaman pengecekan sesuai SOP PUPR.'}
- STANDAR ACUAN UTAMA: ${standardRef}${nspkContext}

# INSTRUKSI HYBRID AI & REASONING
${formulasInstruct}
${reasoningFlow}

# OUTPUT WAJIB FORMAT JSON MURNI:
Tugas Anda adalah melakukan reasoning mendalam dan mengembalikan objek JSON dengan struktur berikut. Pastikan value 'narasi_item_lengkap' mengandung struktur A-G secara urut:
{
  "kode": "${item.kode}",
  "nama": "${item.nama}",
  "status": "Sesuai|Tidak Sesuai|Kritis",
  "faktual": "(Deskripsi kondisi riil)",
  "visual": "(Analisis bukti foto)",
  "regulasi": ["Nama Standar/Nomor Pasal"],
  "analisis": "(Penalaran teknis mendalam terhadap standar ${standardRef})",
  "risiko": "Rendah|Sedang|Tinggi|Kritis",
  "rekomendasi": "(Tindakan perbaikan spesifik)",
  "narasi_item_lengkap": "### KAJIAN FORENSIK PARAMETER: ${item.kode}\\n\\nA. Persyaratan NSPK:\\n...\\nB. Data Eksisting:\\n...\\nC. Perhitungan Kuantitatif:\\n...\\nD. Analisis Kesesuaian:\\n...\\nE. Risiko Teknis:\\n...\\nF. Evaluasi dan Implikasi:\\n...\\nG. Matriks Temuan & Rekomendasi:\\n..."
}

PENTING: Gunakan bahasa "Engineering Assessment" tingkat tinggi. Validasi keluaran Anda agar patuh pada Output Schema A-G.
NO PROMOTIONAL TEXT - NO MARKDOWN WRAPPER OUTSIDE JSON.`;
}

/**
 * Prompt Sintesis Akhir - Deep Research Reporting Mode (7 Chapters)
 */
function getPromptForSynthesis(aspek, itemResults, roleTitle, itemsCount) {
  return `Anda adalah ${roleTitle} - Lead Engineer Pengkaji Teknis SLF (Sertifikat Laik Fungsi).
Tugas Utama: Menyusun "COMPREHENSIVE FORENSIC ENGINEERING ANALYSIS REPORT" untuk aspek ${aspek.toUpperCase()}.
Data di bawah ini mencakup hasil investigasi mendalam dari ${itemsCount} parameter uji. 

# DATA INPUT (MODULAR REASONING LOGS):
${JSON.stringify(itemResults, null, 2)}

# INSTRUKSI SINTESIS (ANTI-SUMMARY MODE):
DILARANG KERAS membuat rangkuman/summary biasa. Laporan Anda harus menggabungkan temuan-temuan terpisah di atas menjadi sebuah kesimpulan teknis yang utuh, logis, dan saling berkorelasi (Sintesis Kaskade).

## PRINSIP PENULISAN:
1. SINTESIS KASKADE: Jika ada retak di balok (Item A) dan lendutan di plat (Item B), hubungkan keduanya menjadi satu hipotesis kegagalan struktur yang sistematis.
2. STANDAR INTERNASIONAL & NASIONAL: Kaitkan dengan SNI 1726:2019 (Gempa), SNI 2847:2019 (Beton), SNI 1727:2020 (Beban), SNI 9273:2025 (Existing Buildings Evaluation), serta standar internasional (ASCE 41-17, FEMA P-58, atau IBC) jika relevan.
3. JUSTIFIKASI FORENSIK: Gunakan bahasa teknis tingkat tinggi (Technical Forensic Jargon). Misal: "Deteriorasi beton akibat penetrasi ion klorida menyebabkan delaminasi selimut beton, yang secara progresif mereduksi kapasitas momen nominal balok."

# STRUKTUR LAPORAN (Markdown # Khusus Standar Laporan PUPR & Internasional):

# 1. EVALUASI INTEGRITAS TEKNIS & COMPLIANCE SUMMARY
- Tabel rekapan kuantitatif tingkat kerusakan (Level I-V) dan status kepatuhan terhadap NSPK.
- Penilaian "Serviceability Limit State" (SLS) dan "Ultimate Limit State" (ULS) secara kualitatif berdasarkan temuan.

# 2. ANALISIS PATOLOGI BANGUNAN & DIAGNOSA AKAR MASALAH
- Narasi yang menghubungkan seluruh penyimpangan/kerusakan menjadi satu flow diagnosa teknis yang berkesinambungan (Root Cause Analysis).

# 3. ANALISIS KINERJA SISTEMATIS (STRUCTURAL/NON-STRUCTURAL SYSTEM PERFORMANCE)
- Bagaimana performa sistem keseluruhan (misal: Sistem Rangka Pemikul Momen) dipengaruhi oleh kerusakan-kerusakan di item individual di atas.
- Kaitkan dengan parameter elastisitas, daktilitas, dan stabilitas global.

# 4. KEPATUHAN REGULASI DAN ANALISIS KONSEKUENSI HUKUM (PP 16/2021)
- Justifikasi mendalam terhadap pasal-pasal di PP No. 16 Tahun 2021 dan Permen PUPR No. 10 Tahun 2021.
- Apa implikasi teknis-hukum jika kelaikan fungsi tidak terpenuhi.

# 5. ESTIMASI RISIKO PROGRESIF & MITIGASI KATASTROFIK
- Skenario terburuk jika perbaikan ditunda (Misal: Korosi progesi menyebabkan keruntuhan brittle/getas).
- Analisis "Red Flags" yang membahayakan keselamatan jiwa (Life Safety).

# 6. STRATEGI REKLAMASI TEKNIS & REKOMENDASI INTERVENSI
- Rekomendasi perbaikan yang SANGAT DETAIL (misal: "Grouting dengan epoxy viskositas rendah", "Carbon Fiber Reinforced Polymer (CFRP) Wrapping", dsb).

# 7. FATWA AKHIR KELAIKAN & ROADMAP PEMELIHARAAN (FINAL VERDICT)
- Penetapan Status (Laik/Tidak Laik) disertai alasan teknis yang tidak terbantahkan secara profesional.
- Penjadwalan inspeksi berkala (Short-term vs Long-term Maintenance).

PENTING: Narasi harus SANGAT LENGKAP, MENDALAM, DAN PROFESIONAL (Minimal 1500-2000 kata untuk laporan utuh).

Output WAJIB JSON MURNI:
{
  "skor_aspek": (Integer 0-100),
  "insight_kritis": ["...", "..."],
  "narasi_teknis": "(String Markdown 7 Bab di atas secara super detail)",
  "rekomendasi_prioritas": [
    { "judul": "...", "tindakan": "...", "prioritas": "..." }
  ]
}
`;
}

/**
 * Menjalankan Evaluasi PER ITEM (Deep Research Pipeline)
 */
export async function runAspectAnalysis(aspek, items, onProgress, options = {}) {
  const a = aspek.toLowerCase();
  const settings = await getSettings();
  const experts = settings.experts || {};
  
  let roleTitle = 'Digital Technical Consultant SLF';
  let standard = 'NSPK & PP No. 16 Tahun 2021';
  
  let targetModel = MODELS.GEMINI; 

  // Penentuan Role & Standar & Model Khusus Berdasarkan Pengaturan
  if (a.includes('struktur')) {
    const name = experts.structure?.name ? `(${experts.structure.name})` : '';
    roleTitle = `Chief Structural Engineer & Seismis Expert ${name}`;
    standard = 'SNI 9273:2025 (Existing Buildings Evaluation)';
    if (MODELS.CLAUDE.key) targetModel = MODELS.CLAUDE;
  } else if (a.includes('administrasi')) {
    roleTitle = 'Principal Engineering Auditor';
    standard = 'PP No. 16 Tahun 2021 & Perundangan Bangunan';
  } else if (a.includes('arsitektur')) {
    const name = experts.architecture?.name ? `(${experts.architecture.name})` : '';
    roleTitle = `Principal Architect (Building Performance) ${name}`;
    standard = 'NSPK Arsitektur & Estetika';
  } else if (a.includes('mep') || a.includes('mekanikal') || a.includes('kebakaran')) {
    const name = experts.mep?.name ? `(${experts.mep.name})` : '';
    roleTitle = `Senior MEP & Fire Safety Engineer ${name}`;
    standard = 'NSPK Utilitas & MEP';
  }

  const results = [];
  const blacklistedModels = new Set();

  console.log(`[AI Router] Memulai Analysis untuk ${aspek} (${items.length} item).`);

  // Jika preAnalyzedResults tersedia dari UI, gunakan Sintesis Deterministik (Tanpa AI)
  if (options.preAnalyzedResults && options.preAnalyzedResults.length > 0) {
    console.log(`[AI Engine] Menjalankan Sintesis Deterministik BAB IV untuk ${aspek}...`);
    const babIvNarasi = generateBabAnalisis({ items: options.preAnalyzedResults, aspek });
    const finalScore = (options.preAnalyzedResults.filter(i => {
      const s = (i.status || "").toLowerCase();
      return s.includes("sesuai") && !s.includes("tidak") || s.includes("baik") || s.includes("aman") || s.includes("memadai");
    }).length / options.preAnalyzedResults.length) * 100;
    
    function getKategori(score) {
      if (score > 80) return "LAIK";
      if (score > 60) return "LAIK BERSYARAT";
      return "TIDAK LAIK";
    }

    return {
      skor_aspek: Math.round(finalScore),
      narasi_teknis: babIvNarasi,
      rekomendasi: options.preAnalyzedResults.filter(r => r.status !== "Sesuai").map(r => ({
        judul: `Perbaikan ${r.nama}`,
        tindakan: r.rekomendasi,
        prioritas: (r.risiko || 'SEDANG').toUpperCase(),
        aspek: aspek
      })),
      meta: { 
        provider: `Synthesis Engine (Pure Code)`, 
        kategori: getKategori(finalScore),
        risk_highlights: options.preAnalyzedResults.filter(r => r.risiko === "Kritis" || r.risiko === "Tinggi").map(r => r.nama)
      }
    };
  }

  // Loop Analisis Per Item Tradisional (Jika belum ada hasil)
  for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (onProgress) onProgress(i + 1, items.length, `Menganalisis: ${item.nama}`);
      const analyzed = await runSingleItemAnalysis(item, aspek, { roleTitle, standard, targetModel, blacklistedModels });
      results.push(analyzed);
      await new Promise(r => setTimeout(r, 400));
  }

  // Synthesis Final (NON-AI DETERMINISTIC ENGINE)
  if (onProgress) onProgress(items.length, items.length, "Lead Engineer sedang merakit BAB IV Laporan Teknis...");
  
  // Bungkus data untuk engine
  const synthesisData = { items: results, aspek };
  const babIvNarasi = generateBabAnalisis(synthesisData);
  const finalScore = (results.filter(i => {
    const s = (i.status || "").toLowerCase();
    return s.includes("sesuai") && !s.includes("tidak") || s.includes("baik") || s.includes("aman") || s.includes("memadai");
  }).length / results.length) * 100;

  function getKategori(score) {
    if (score > 80) return "LAIK";
    if (score > 60) return "LAIK BERSYARAT";
    return "TIDAK LAIK";
  }

  return {
    skor_aspek: Math.round(finalScore),
    narasi_teknis: babIvNarasi,
    rekomendasi: results.filter(r => r.status !== "Sesuai").map(r => ({
      judul: `Perbaikan ${r.nama}`,
      tindakan: r.rekomendasi,
      prioritas: r.risiko.toUpperCase(),
      aspek: aspek
    })),
    meta: { 
      provider: `Synthesis Engine (Pure Code)`, 
      kategori: getKategori(finalScore),
      risk_highlights: results.filter(r => r.risiko === "Kritis" || r.risiko === "Tinggi").map(r => r.nama)
    }
  };
}

/**
 * Menjalankan Analisis AI Modular untuk SATU ITEM tunggal
 */
export async function runSingleItemAnalysis(item, aspek, options = {}) {
  const { 
    roleTitle = 'Digital Technical Consultant SLF', 
    standard = 'NSPK & PP No. 16 Tahun 2021', 
    targetModel = MODELS.GEMINI, 
    blacklistedModels = new Set() 
  } = options;

  console.log(`[AI Router] Modular Analysis for: ${item.kode} - ${item.nama}`);

  const itemPrompt = getPromptForItem(item, aspek, roleTitle, standard);
  
  try {
    const respText = await safeCall(async () => {
      // Build a comprehensive, unique failover chain (User Priority: SLF_OPUS, MISTRAL, GEMMA_3, Groq & OpenRouter)
      const order = [targetModel, MODELS.SLF_OPUS, MODELS.MISTRAL, MODELS.GEMMA_3, MODELS.GROQ, MODELS.OPENROUTER, MODELS.OPENAI, MODELS.CLAUDE, MODELS.GEMINI];
      const failoverChain = [];
      const seen = new Set();
      
      for (const m of order) {
        if (!m || seen.has(m.name) || blacklistedModels.has(m.name)) continue;
        if (m.vendor === 'google' || m.key) {
          failoverChain.push(m);
          seen.add(m.name);
        }
      }

      let lastError = null;
      for (const model of failoverChain) {
        try {
          if (model.vendor === 'google') return await fetchGemini(model, itemPrompt);
          if (model.vendor === 'openai') {
             if (model.key || model.id.includes('llama')) return await fetchOpenAI(model, itemPrompt);
          }
          if (model.vendor === 'anthropic') return await fetchClaude(model, itemPrompt);
          if (model.vendor === 'openrouter') return await fetchOpenRouter(model, itemPrompt);
          if (model.vendor === 'huggingface') return await fetchSLFOpus(model, itemPrompt);
          if (model.vendor === 'mistral') return await fetchMistral(model, itemPrompt);
        } catch (err) {
          lastError = err;
          // Log detail error ke konsol untuk debugging surveyor
          console.error(`[AI Router] >>> Model ${model.name} GAGAL:`, err.message);
          blacklistedModels.add(model.name);
        }
      }
      const debugMsg = lastError ? `Gagal Terakhir: ${lastError.message}` : "Semua kunci kosong.";
      throw new Error(`Seluruh model AI di jalur Failover gagal merespons. ${debugMsg}`);
    });

    const parsed = parseAIJson(respText);
    
    // Standardized Object Output for synthesis-engine
    return {
       kode: parsed.kode || item.kode,
       nama: parsed.nama || item.nama,
       status: parsed.status || "Tidak Sesuai",
       faktual: parsed.faktual || "Data faktual tidak tersedia atau tidak terbaca.",
       visual: parsed.visual || "Data visual lapangan tidak tersedia dalam dokumentasi.",
       regulasi: parsed.regulasi || [standard, "PP 16/2021"],
       analisis: parsed.analisis || "Diperlukan analisis kepatuhan lanjutan terhadap standar teknis.",
       risiko: parsed.risiko || "Sedang",
       rekomendasi: parsed.rekomendasi || "Lengkapi dokumen pendukung atau perbaiki kondisi lapangan.",
       narasi_item_lengkap: parsed.narasi_item_lengkap || "Analisis naratif tidak tersedia."
    };
  } catch (err) {
    console.error(`Gagal Single Item:`, err);
    return { 
      kode: item.kode, 
      nama: item.nama,
      status: "Error", 
      faktual: `Gagal Analisis: ${err.message}`,
      visual: "Tidak tersedia.",
      regulasi: [standard],
      analisis: "Kesalahan teknis pada engine AI.",
      risiko: "Tinggi",
      rekomendasi: "Ulangi analisis item ini.",
      narasi_item_lengkap: `Terjadi kendala teknis AI saat menganalisis item ini: ${err.message}` 
    };
  }
}

export function parseAIJson(text) {
  try {
    // Cari blok JSON jika ada (baik dengan atau tanpa backticks)
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}') + 1;
    if (start === -1 || end === 0) throw new Error("Format JSON tidak ditemukan");
    
    const raw = text.substring(start, end);
    // Bersihkan karakter kontrol yang mungkin merusak JSON.parse
    const clean = raw.replace(/[\x00-\x1F\x7F-\x9F]/g, (match) => {
       if (match === '\n' || match === '\r' || match === '\t') return match;
       return ' ';
    });
    
    return JSON.parse(clean);
  } catch (e) {
    console.error("[AI Parser] Gagal parsing text:", text);
    throw new Error("Gagal mengekstrak data JSON dari AI: " + e.message);
  }
}

/**
 * OCR VISION ENGINE
 * Ekstraksi Data IMB/PBG dari Gambar/PDF
 */
export async function runOCRAnalysis(base64Data, mimeType) {
  const model = MODELS.GEMINI;
  const prompt = `
    Anda adalah AI Data Entry Spesialis Perizinan Bangunan (IMB/PBG) di Indonesia.
    Tugas: Ekstrak data teknis secara presisi dari dokumen yang diberikan (Scan IMB/PBG/Sertifikat).
    
    Ekstrak field berikut dalam format JSON murni:
    {
      "nama_bangunan": "...",
      "pemilik": "...",
      "alamat": "...",
      "luas_bangunan": 0,
      "luas_lahan": 0,
      "jumlah_lantai": 0,
      "nomor_pbg": "...",
      "fungsi_bangunan": "...",
      "gsb": 0,
      "kdb": 0,
      "klb": 0,
      "kdh": 0
    }
    
    PENTING: 
    - Nama Bangunan biasanya ada setelah kata 'Membangun Baru' atau judul dokumen.
    - Luas bangunan dalam m2 (meter persegi).
    - Jika data tidak ditemukan, berikan nilai null. 
    - Kembalikan HANYA JSON tanpa teks penjelasan.
  `;

  const resText = await fetchGeminiVision(model, prompt, base64Data, mimeType);
  return parseAIJson(resText);
}

/** Fetchers **/

async function fetchGemini(model, prompt) {
  const res = await fetch(model.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { 
        temperature: 0.1, 
        maxOutputTokens: 8192
      }
    })
  });
  if (!res.ok) {
     const errBody = await res.text();
     console.error(`[Gemini Error] HTTP ${res.status}:`, errBody);
     throw new Error(`Gemini API Error (HTTP ${res.status}): ${errBody.substring(0, 50)}...`);
  }
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
}

async function fetchGeminiVision(model, prompt, base64, mimeType) {
  const res = await fetch(model.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ 
        parts: [
          { text: prompt },
          { inlineData: { mimeType: mimeType, data: base64 } }
        ] 
      }],
      generationConfig: { temperature: 0.1 }
    })
  });
  if (!res.ok) throw new Error(`Gemini Vision Error: ${res.status}`);
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
}

async function fetchOpenAI(model, prompt) {
  const res = await fetch(model.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${model.key}` },
    body: JSON.stringify({
      model: model.id,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 8192
    })
  });
  if (!res.ok) {
     const errBody = await res.text();
     console.error(`[OpenAI/Groq Error] HTTP ${res.status}:`, errBody);
     throw new Error(`OpenAI-style API Error (HTTP ${res.status}): ${errBody.substring(0, 50)}...`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content || "{}";
}

export async function fetchOpenRouter(model, prompt) {
  const res = await fetch(model.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${model.key}`,
      'HTTP-Referer': 'https://smartaipengkaji.app',
      'X-Title': 'Smart AI Pengkaji SLF'
    },
    body: JSON.stringify({
      model: model.id,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1
    })
  });
  if (!res.ok) {
     const errBody = await res.text();
     console.error(`[OpenRouter Error] HTTP ${res.status}:`, errBody);
     throw new Error(`OpenRouter API Error (HTTP ${res.status}): ${errBody.substring(0, 50)}...`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content || "{}";
}

async function fetchClaude(model, prompt) {
  const res = await fetch(model.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': model.key,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify({
      model: model.id,
      max_tokens: 8192,
      messages: [{ role: 'user', content: prompt }]
    })
  });
  if (!res.ok) {
     const errBody = await res.text();
     console.error(`[Claude Error] HTTP ${res.status}:`, errBody);
     throw new Error(`Claude API Error (HTTP ${res.status}): ${errBody.substring(0, 50)}...`);
  }
  const data = await res.json();
  return data.content?.[0]?.text || "{}";
}

async function fetchSLFOpus(model, prompt) {
  if (!model.key) throw new Error("Hugging Face API Token tidak ditemukan.");
  
  // Format ChatML khusus untuk SLF_OPUS (Vision-Compatible)
  const payload = {
    inputs: [
      { role: "developer", content: "Anda adalah AI Ahli Pengkaji SLF Bangunan Gedung dengan kemampuan penalaran mendalam (Reasoning)." },
      { role: "user", content: prompt }
    ],
    parameters: {
      max_new_tokens: 4096,
      temperature: 0.1,
      return_full_text: false
    }
  };

  const res = await fetch(model.url, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${model.key}`
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
     const errBody = await res.text();
     throw new Error(`HF SLF_OPUS Error (HTTP ${res.status}): ${errBody.substring(0, 100)}`);
  }
  
  const data = await res.json();
  // Tangani format kembalian Hugging Face (array of objects)
  const textOutput = Array.isArray(data) ? data[0].generated_text : (data.generated_text || "");
  
  // Jika ada blok <thought>, bersihkan agar tidak mengganggu parsing JSON
  return textOutput.replace(/<thought>[\s\S]*?<\/thought>/g, "").trim();
}

async function fetchMistral(model, prompt) {
  if (!model.key) throw new Error("Mistral API Key tidak ditemukan. Pastikan VITE_MISTRAL_API_KEY ada di .env");
  
  const res = await fetch(model.url, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${model.key}`
    },
    body: JSON.stringify({
      model: model.id,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 4096
    })
  });

  if (!res.ok) {
     const errBody = await res.text();
     console.error(`[Mistral Error] HTTP ${res.status}:`, errBody);
     throw new Error(`Mistral API Error (HTTP ${res.status}): ${errBody.substring(0, 80)}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content || "{}";
}

export async function runFinalConclusion(skorMap, rekomendasi_gabungan) {
  const systemPrompt = `Anda adalah Ketua Tim Konsultan Pengkaji SLF. 
Berikan ringkasan eksekutif strategis berdasarkan seluruh aspek pengkajian teknis...`;
  const aiResultText = await safeCall(async () => {
    try {
      if (env.VITE_OPENROUTER_API_KEY) return await fetchOpenRouter(MODELS.OPENROUTER, systemPrompt);
      if (env.VITE_MISTRAL_API_KEY) return await fetchMistral(MODELS.MISTRAL, systemPrompt);
      return await fetchGemini(MODELS.GEMINI, systemPrompt);
    } catch(e) { return await fetchGemini(MODELS.GEMINI, systemPrompt); }
  });
  return parseAIJson(aiResultText);
}
/**
 * Deterministic Synthesis Engine (Non-AI)
 * Merakit Laporan Teknis BAB IV Berstandar Internasional
 */
function generateBabAnalisis(data) {
  return `
# BAB IV – ANALISIS DAN EVALUASI

## A. PERSYARATAN NSPK

${generateRegulasi(data.items)}

## B. DATA EKSISTING (FAKTUAL & VISUAL)

${generateFaktual(data.items)}

## C. PERHITUNGAN KUANTITATIF & VISUALISASI

${generateVisual(data.items, data.aspek)}

## D. ANALISIS KESESUAIAN

${generateAnalisis(data.items)}

## E. RISIKO TEKNIS

${generateRisiko(data.items)}

## F. EVALUASI DAN IMPLIKASI TERHADAP LAIK FUNGSI

${generateEvaluasi(data.items)}

## G. MATRIKS TEMUAN DAN REKOMENDASI TEKNIS

${generateKesimpulan(data.items)}
`;
}

function generateFaktual(items) {
  return items.map((item, i) => `
**${i + 1}. ${item.nama} (${item.kode})**
Kondisi eksisting (data lapangan & as-built) menunjukkan: ${item.faktual}.
Status Saat Ini: **${item.status}**.
`).join("\n");
}

function generateVisual(items, aspek) {
  const masalah = items.filter(i => i.status !== "Sesuai").map(i => i.nama).slice(0, 2).join(' and ');
  const namaBangunan = "building technical structure";
  const baseStyle = "engineering blueprint style, vector graphic, technical diagram style, high quality architectural diagram, CAD style, clean professional drawing, no text";
  const contentFocus = masalah.length > 0 
    ? `technical drawing of ${masalah} in ${aspek} aspect of a ${namaBangunan}`
    : `technical drawing of ${aspek} aspect of a professional ${namaBangunan}`;
  const sanitizedPrompt = contentFocus.replace(/[^a-zA-Z0-9\s]/g, ' ');
  const finalPrompt = encodeURIComponent(`${sanitizedPrompt}, ${baseStyle}`);
  const imageUrl = `https://image.pollinations.ai/prompt/${finalPrompt}?width=800&height=400&nologo=true`;

  const visualHeader = `![Visualisasi Teknis Poin C](${imageUrl} "Visualisasi Teknik AI - Aspek ${aspek}")\n\n*Gambar: Diagram kuantitatif/visualisasi teknis kondisi eksisting pada aspek ${aspek} (AI Generated Diagram).*\n`;

  const observasi = items.map((item, i) => `
**${i + 1}. ${item.nama}**
Catatan perhitungan & pengamatan lapangan: ${item.visual}.
`).join("\n");

  return visualHeader + observasi;
}

function generateRegulasi(items) {
  return items.map((item, i) => `
**${i + 1}. ${item.nama}**
Acuan Regulasi Terkait:
${(item.regulasi || []).map(r => `- ${r}`).join("\n")}
`).join("\n");
}

function generateAnalisis(items) {
  return items.map((item, i) => `
**${i + 1}. ${item.nama}**
Analisis Kesesuaian (Gap Analysis): ${item.analisis}.
`).join("\n");
}

function generateRisiko(items) {
  return items.map((item, i) => `
**${i + 1}. ${item.nama}**
Kategori Risiko Teridentifikasi: **${item.risiko}**.
`).join("\n");
}

function generateEvaluasi(items) {
  let total = items.length;
  let tidakSesuai = items.filter(i => i.status !== "Sesuai").length;
  let score = total > 0 ? (items.filter(i => i.status === "Sesuai").length / total) * 100 : 0;

  function kategori(s) {
    if (s > 80) return "LAIK FUNGSI";
    if (s > 60) return "LAIK BERSYARAT";
    return "TIDAK LAIK FUNGSI";
  }

  return `
Menerapkan ***Hybrid Intelligent SLF Evaluation System (Fuzzy Logic & ML)*** dengan persamaan ISLF* = Σ(W_i^ML × S_i^Fuzzy × R_i^Bayes × E_i) menghasilkan:

- **Konvergensi Data**: ${total - tidakSesuai} item compliant dari total ${total} item.
- **Indeks Evaluasi Global Aspek**: **${Math.round(score)} / 100**.
- **Deviasi Kelaikan**: ${Math.round(100 - score)}% defect likelihood.

**Implikasi Keselamatan dan Kelaikan Bangunan:**
Berdasarkan agregasi defisiensi teknis dan probabilitas risiko katastrofik, maka komponen ini ditetapkan pada tingkat keandalan bangunan **${kategori(score)}**. Perbaikan pada sub-sistem yang gagal merupakan prasyarat mandatory untuk operasionalisasi fasilitas yang aman.
`;
}

function generateKesimpulan(items) {
  const critical = items.filter(i => i.risiko === "Kritis" || i.risiko === "Tinggi");

  return `
**Log Intervensi Rekomendasi (Prioritas):**
${critical.length > 0 ? critical.map((c, i) => `
**${i + 1}. Tindakan Korektif untuk ${c.nama} [P1]**
- Risiko Terukur: **${c.risiko}**
- Rekomendasi Teknis Utama: ${c.rekomendasi}
`).join("\n") : "- Tidak terdapat rekomendasi perbaikan P1 (Tinggi/Kritis) pada aspek ini. Sistem berfungsi sesuai ambang batas toleransi."}

**Matriks Temuan Umum:**
${items.filter(i => i.risiko !== "Kritis" && i.risiko !== "Tinggi").map(i => `- ${i.nama}: ${i.rekomendasi} (Prioritas: ${i.risiko})`).join('\n')}

Catatan Akhir: Roadmap pemeliharaan harus diintegrasikan dengan Rencana Tahunan (Operation & Maintenance) dengan mengacu pada *Continuous Learning Pipeline v6*.
`;
}

/**
 * MULTI-AGENT CONSENSUS SYNTHESIS
 * Menghasilkan Bab V dan Bab VI berbasis Konsorsium Ahli
 */
export async function getMultiAgentConsensus(checklist, proyek, analisisSummary) {
  const model = MODELS.GEMINI;

  const anomalies = checklist.filter(i => i.status !== 'baik' && i.status !== 'ada_sesuai' && i.status !== 'tidak_wajib');
  const totalCount = checklist.length;
  const goodCount = totalCount - anomalies.length;

  // 1. Persiapkan Ringkasan Data Lapangan (Hybrid Pruning)
  const dataBrief = `
    DATA PROYEK: ${proyek.nama_bangunan} (${proyek.fungsi_bangunan})
    RINGKASAN STATISTIK:
    - Total Parameter: ${totalCount}
    - Kondisi Baik/Sesuai: ${goodCount} (${Math.round(goodCount/totalCount*100)}%)
    - Anomali/Temuan Kritis: ${anomalies.length}
    
    DETAIL TEMUAN ANOMALI (Hanya data ini yang memerlukan analisis forensik):
    ${anomalies.map(i => `- [${i.kode}] ${i.nama}: STATUS=${i.status} | CATATAN=${i.catatan || 'Tanpa catatan'}`).join('\n')}
    
    SKOR ANALISIS (Rule-Based Engine): ${JSON.stringify(analisisSummary.skor)}
    RISIKO: ${analisisSummary.riskLevel}
  `;

  // 2. Simulasi Agen Spesialis (Sequential for token saving, can be Promise.all)
  const findings = {};

  const roles = ['ARSITEK', 'STRUKTUR', 'MEP', 'LEGAL'];
  for (const role of roles) {
    const prompt = `${EXPERT_PERSONAS[role]}\n\nBerikut data lapangan yang tersedia:\n${dataBrief}\n\nBerikan analisis mendalam Anda mengenai temuan ini sesuai spesialisasi Anda. Terangkan risiko dan rekomendasi perbaikan.`;
    findings[role] = await fetchGemini(model, prompt);
  }

  // 3. Koordinator Synthesis (Final Consensus)
  const masterPrompt = `
    ${EXPERT_PERSONAS.KOORDINATOR}

    Berikut adalah temuan dari tim ahli spesialis:
    - ARSITEK: ${findings.ARSITEK}
    - STRUKTUR: ${findings.STRUKTUR}
    - MEP: ${findings.MEP}
    - LEGAL: ${findings.LEGAL}

    BERIKAN OUTPUT DALAM FORMAT JSON BERIKUT:
    {
      "bab5_analisis": "Narasi teknis lengkap dan forensik untuk Bab V Laporan SLF...",
      "bab6_kesimpulan": "Ringkasan status kelaikan dan daftar rekomendasi utama...",
      "status_final": "LAYAK_FUNGSI | LAYAK_FUNGSI_DENGAN_CATATAN | TIDAK_LAYAK_FUNGSI",
      "risk_score": 0-100
    }
  `;

  const finalResultBlob = await fetchGemini(model, masterPrompt);
  return parseAIJson(finalResultBlob);
}
