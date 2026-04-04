// ============================================================
//  AI ROUTER — MULTI-MODEL DENGAN SUPABASE EDGE FUNCTION PROXY
//  SECURITY FIX: Semua AI API call di production diroute melalui
//  Supabase Edge Function (ai-proxy) agar API key tidak terekspos.
//
//  Di development (Vite dev server), gunakan proxy lokal.
//  Di production, gunakan Edge Function URL.
// ============================================================

const env = import.meta.env;
import { SLF_PROMPT_LIBRARY } from './slf-prompt-library.js';
import { getPromptConfig, injectPromptConfig } from './prompt-config-service.js';
import { getSettings } from './settings.js';
import { generateOllamaCompletion } from './ollama-service.js';
import { supabase } from './supabase.js';

// ── Edge Function Proxy URL ───────────────────────────────────
// Di production: set VITE_AI_PROXY_URL di .env ke URL Edge Function Anda
// Contoh: https://hrzplcqeadhvbrfhlfuh.supabase.co/functions/v1/ai-proxy
const AI_PROXY_URL = env.VITE_AI_PROXY_URL || '';
const USE_PROXY = env.PROD && !!AI_PROXY_URL;

// ── Legacy direct mode (untuk dev atau jika belum ada proxy) ──
const DIRECT_ENDPOINTS = {
  gemini: (model) => env.PROD
    ? `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.VITE_GEMINI_API_KEY}`
    : `/api/gemini/v1beta/models/${model}:generateContent?key=${env.VITE_GEMINI_API_KEY}`,
  openai: env.PROD ? 'https://api.openai.com/v1/chat/completions' : '/api/openai/v1/chat/completions',
  groq: env.PROD ? 'https://api.groq.com/openai/v1/chat/completions' : '/api/groq/v1/chat/completions',
  claude: env.PROD ? 'https://api.anthropic.com/v1/messages' : '/api/claude/v1/messages',
  openrouter: env.PROD ? 'https://openrouter.ai/api/v1/chat/completions' : '/api/openrouter/v1/chat/completions',
  mistral: env.PROD ? 'https://api.mistral.ai/v1/chat/completions' : '/api/mistral/v1/chat/completions',
  huggingface: env.VITE_HF_SLF_OPUS_URL || 'https://api-inference.huggingface.co/models/adminskpslf/SLF_OPUS',
};

// ── Model Registry ────────────────────────────────────────────
export const MODELS = {
  GEMINI: {
    id: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    vendor: 'google',
    proxyProvider: 'gemini',
  },
  GROQ: {
    id: 'llama-3.3-70b-versatile',
    name: 'Groq Llama 3.3',
    url: DIRECT_ENDPOINTS.groq,
    key: env.VITE_GROQ_API_KEY,
    vendor: 'openai',
    proxyProvider: 'groq',
  },
  OPENROUTER: {
    id: 'google/gemini-2.0-flash-lite:free',
    name: 'OpenRouter Free',
    url: DIRECT_ENDPOINTS.openrouter,
    key: env.VITE_OPENROUTER_API_KEY,
    vendor: 'openrouter',
    proxyProvider: 'openrouter',
  },
  OPENAI: {
    id: 'gpt-4o',
    name: 'OpenAI GPT-4o',
    url: DIRECT_ENDPOINTS.openai,
    key: env.VITE_OPENAI_API_KEY,
    vendor: 'openai',
    proxyProvider: 'openai',
  },
  CLAUDE: {
    id: 'claude-3-5-sonnet-20241022',
    name: 'Claude 3.5 Sonnet',
    url: DIRECT_ENDPOINTS.claude,
    key: env.VITE_CLAUDE_API_KEY,
    vendor: 'anthropic',
    proxyProvider: 'claude',
  },
  GEMMA_3: {
    id: 'gemma-3-27b-it',
    name: 'Gemma 3 27B Instruct',
    vendor: 'google',
    proxyProvider: 'gemini',
  },
  SLF_OPUS: {
    id: 'adminskpslf/SLF_OPUS',
    name: 'SLF OPUS Reasoning (Hugging Face)',
    url: DIRECT_ENDPOINTS.huggingface,
    key: env.VITE_HF_API_TOKEN,
    vendor: 'huggingface',
    proxyProvider: 'huggingface',
  },
  MISTRAL: {
    id: 'mistral-large-latest',
    name: 'Mistral Large',
    url: DIRECT_ENDPOINTS.mistral,
    key: env.VITE_MISTRAL_API_KEY,
    vendor: 'mistral',
    proxyProvider: 'mistral',
  },
  OLLAMA: {
    id: 'gemma3:27b',
    name: 'Ollama Local Node',
    vendor: 'ollama',
  }
};

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

/**
 * EXPERT PERSONAS - Konsorsium Ahli SLF
 */
export const EXPERT_PERSONAS = {
  ARSITEK: `Anda adalah Senior Architect & Urban Planner (Building Codes Expert). 
    Tugas: Mengevaluasi Aspek Tata Bangunan (Zoning, GSB, KDB, KLB, Penampilan Fasad, dan Sirkulasi Ruang). 
    Fokus: Kesesuaian Keterangan Rencana Kota (KRK) dan integrasi estetika arsitektur terhadap fungsi bangunan.`,
  STRUKTUR: `Anda adalah Senior Forensic Structural Engineer (HAKI Specialist). 
    Tugas: Menganalisis Aspek Keandalan Bangunan - Keselamatan Struktur (Fondasi, Kolom, Balok, Plat, dan Daktilitas). 
    Fokus: Identifikasi retak struktural (SNI 2847), ketahanan gempa (SNI 1726), dan analisis sisa umur layan struktur.`,
  MEP: `Anda adalah Senior Mechanical, Electrical, & Plumbing Engineer. 
    Tugas: Mengevaluasi Aspek Keandalan Bangunan - Sistem Utilitas (Lift, Kelistrikan, Proteksi Petir, Sanitasi, dan Proteksi Kebakaran Aktif). 
    Fokus: Keandalan operasional, integrasi sistem proteksi kebakaran (SNI 03-1745), dan efisiensi energi (SNI 0225:2020).`,
  LEGAL: `Anda adalah Senior Regulatory Affairs Specialist (SIMBG & PUPR). 
    Tugas: Evaluasi Aspek Tata Bangunan - Administrasi Perizinan (PBG, IMB, Dokumen Tanah). 
    Fokus: Legalitas operasional, masa berlaku dokumen, dan kepatuhan terhadap PP No. 16/2021.`,
  KOORDINATOR: `Anda adalah Lead Engineering Consultant & Lead Auditor SLF. 
    Tugas: Mensintesis laporan multidisiplin menjadi Narasi Evaluasi Komprehensif (Bab IV) dan Kesimpulan Final (Bab V).
    Fokus: Mengelompokkan analisis ke dalam pilar Tata Bangunan dan Keandalan Bangunan sesuai standar NSPK.`
};

// Log status (hanya keberadaan key, bukan nilai)
if (env.DEV) {
  console.log('[AI Engine] Status Kunci API (DEV):', {
    Gemini: !!env.VITE_GEMINI_API_KEY,
    OpenAI: !!env.VITE_OPENAI_API_KEY,
    Claude: !!env.VITE_CLAUDE_API_KEY,
    Groq: !!env.VITE_GROQ_API_KEY,
    OpenRouter: !!env.VITE_OPENROUTER_API_KEY,
    Mistral: !!env.VITE_MISTRAL_API_KEY,
    'AI Proxy': USE_PROXY ? AI_PROXY_URL : 'Tidak aktif (gunakan direct)',
  });
}

// ── Retry dengan Exponential Backoff ─────────────────────────
const delay = (ms) => new Promise(res => setTimeout(res, ms));

async function safeCall(fn, retries = 3, attempt = 1) {
  try {
    return await fn();
  } catch (e) {
    const isRateLimit = e.message.includes('429') || e.message.toLowerCase().includes('quota');
    if (isRateLimit && attempt <= retries) {
      const waitTime = attempt * 2000;
      console.warn(`[AI Router] Rate Limit. Retry ${attempt}/${retries} dalam ${waitTime}ms...`);
      await delay(waitTime);
      return safeCall(fn, retries, attempt + 1);
    }
    if (retries <= 0 || attempt > retries) throw e;
    console.warn(`[AI Router] Retry ${attempt}/${retries}. Error: ${e.message}`);
    await delay(1000);
    return safeCall(fn, retries, attempt + 1);
  }
}

// ── CORE: Panggil AI melalui Proxy atau Direct ────────────────
/**
 * Kirim request ke AI melalui Supabase Edge Function (production)
 * atau langsung ke API (development).
 */
async function callAI(model, prompt, options = {}) {
  // Mode 1: Gunakan Edge Function Proxy (production, aman)
  if (USE_PROXY) {
    const session = await supabase.auth.getSession();
    const token = session.data?.session?.access_token;
    if (!token) throw new Error('Sesi tidak valid — silakan login ulang.');

    const res = await fetch(AI_PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'apikey': env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        provider: model.proxyProvider || model.vendor,
        model: model.id,
        prompt,
        ...options,
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`AI Proxy Error (${res.status}): ${errBody.substring(0, 100)}`);
    }
    const data = await res.json();
    if (data.error) throw new Error(`AI Proxy: ${data.error}`);
    return data.result;
  }

  // Mode 2: Direct API call (development / fallback jika proxy belum di-deploy)
  switch (model.vendor) {
    case 'google': return await fetchGemini(model, prompt, options);
    case 'openai': return await fetchOpenAI(model, prompt);
    case 'anthropic': return await fetchClaude(model, prompt);
    case 'openrouter': return await fetchOpenRouter(model, prompt);
    case 'huggingface': return await fetchSLFOpus(model, prompt);
    case 'mistral': return await fetchMistral(model, prompt);
    case 'ollama': return await fetchOllama(model, prompt);
    default: throw new Error(`Vendor '${model.vendor}' tidak dikenal`);
  }
}

// ── JSON Extraction ──────────────────────────────────────────
function extractJSON(text) {
  try {
    const match = text.match(/\{[\s\S]*\}/) || text.match(/\[[\s\S]*\]/);
    if (!match) return null;
    return JSON.parse(match[0].replace(/\n/g, ' '));
  } catch {
    try {
      const match = text.match(/\{[\s\S]*\}/);
      const sanitized = match[0].replace(/[\x00-\x1F\x7F-\x9F]/g, ' ');
      return JSON.parse(sanitized);
    } catch {
      return null;
    }
  }
}

// ── Prompt Builders ──────────────────────────────────────────
function getPromptForItem(item, aspek, roleTitle, standard) {
  const statusLabel = {
    'ada_sesuai': 'Ada & Sesuai Standar',
    'ada_tidak_sesuai': 'Penyimpangan Dokumen/Kondisi',
    'tidak_ada': 'Ketidakadaan (Missing Data/Component)',
    'buruk': 'Degradasi Berat',
    'kritis': 'Kegagalan Teknis Kritis',
    'tidak_wajib': 'Pengecualian (N/A)',
  }[item.status] || item.status;

  const cfg = getItemConfig(item.kode) || {};
  const currentPersona = cfg.persona || `Anda adalah ${roleTitle} - Pakar Audit Forensik Bangunan Gedung tingkat lanjut.`;
  const formulasInstruct = cfg.formulas ? `Gunakan perhitungan teknis berikut: ${JSON.stringify(cfg.formulas)}` : '';
  const reasoningFlow = cfg.slf_reasoning_flow ? `Ikuti alur penalaran ini: ${JSON.stringify(cfg.slf_reasoning_flow)}` : '';

  const standardRef = aspek.toLowerCase().includes('struktur')
    ? 'SNI 1726, SNI 2847, dan SNI 9273:2025'
    : (item.metadata?.nspk_ref || standard);
  const nspkContext = item.metadata?.nspk_ref
    ? `\n- REFERENSI NSPK KHUSUS (DIREKOMENDASIKAN BOT): ${item.metadata.nspk_ref}.`
    : '';

  const promptConfig = getPromptConfig();
  let deepReasoningHeader = '';
  if (promptConfig?.active) {
    deepReasoningHeader = `\n[DEEP REASONING CUSTOM ACTIVE]\n${injectPromptConfig(promptConfig.system_instructions, promptConfig.principles)}\n`;
  } else {
    deepReasoningHeader = `[SISTEM CONTINUOUS LEARNING V6 & HYBRID AI AKTIF]\nAnda adalah ${currentPersona}`;
  }

  return `${deepReasoningHeader}
Tugas: Susun Analisis Forensik Teknik Sipil/MEP komprehensif untuk parameter berikut.

# INFORMASI ITEM
- ASPEK: ${aspek.toUpperCase()}
- KODE: ${item.kode}
- PARAMETER: ${item.nama}
- HASIL LAPANGAN: ${statusLabel}
- CATATAN TEKNIS: ${item.catatan || 'Kondisi memerlukan tinjauan teori rekayasa.'}
- STANDAR ACUAN: ${standardRef}${nspkContext}

# BUKTI DOKUMEN/FISIK TERSEDIA (EVIDENCE BACKGROUND)
${(item.metadata?.evidence || options.evidence || []).map(e => `- [${e.category.toUpperCase()}] ${e.name} (${e.abstract})`).join('\n') || 'Tidak ada dokumen bukti spesifik yang ditautkan.'}

# WAJIB GUNAKAN LOGIKA 6-STEP FORENSIK:
1. IDENTIFIKASI: Temuan visual/faktual di lapangan secara detail. WAJIB RUJUK DOKUMEN BUKTI DI ATAS JIKA ADA.
2. INTERPRETASI: Makna temuan terhadap persyaratan teknis standar.
3. ANALISIS TEKNIS: Penjelasan mendalam menggunakan prinsip rekayasa/rumus/standar SNI relevan.
4. PENILAIAN RISIKO: Evaluasi dampak kegagalan (Rendah/Sedang/Tinggi/Kritis).
5. KESIMPULAN ITEM: Kesesuaian akhir terhadap standar kelaikan.
6. REKOMENDASI: Tindakan perbaikan spesifik, teknis, dan aplikatif.

# OUTPUT WAJIB FORMAT JSON:
{
  "kode": "${item.kode}",
  "nama": "${item.nama}",
  "status": "Sesuai|Tidak Sesuai|Kritis",
  "faktual": "(Step 1 & 2 summary)",
  "analisis": "(Step 3 Technical Depth analysis)",
  "risiko": "Rendah|Sedang|Tinggi|Kritis",
  "rekomendasi": "(Step 6 Recommendation)",
  "narasi_item_lengkap": "### ANALISIS TEKNIS: ${item.kode}\\n\\n**1. Identifikasi & Interpretasi**\\n...\\n**2. Analisis Rekayasa (SNI ${standardRef})**\\n...\\n**3. Penilaian Risiko & Implikasi**\\n...\\n**4. Kesimpulan & Rekomendasi Mitigasi**\\n..."
}

PENTING: Gunakan terminologi profesional seperti "diskontinuitas", "efek termal", "antropometrik", "karbonasi", dll.`
}

// ── Aspect Analysis ──────────────────────────────────────────
export async function runAspectAnalysis(aspek, items, onProgress, options = {}) {
  const a = aspek.toLowerCase();
  const settings = await getSettings();
  const experts = settings.experts || {};

  let roleTitle = 'Digital Technical Consultant SLF';
  let standard = 'NSPK & PP No. 16 Tahun 2021';
  let targetModel = MODELS.GEMINI;

  if (a.includes('struktur')) {
    const name = experts.structure?.name ? `(${experts.structure.name})` : '';
    roleTitle = `Chief Structural Engineer & Seismis Expert ${name}`;
    standard = 'SNI 9273:2025 (Existing Buildings Evaluation)';
    if (MODELS.CLAUDE.key || USE_PROXY) targetModel = MODELS.CLAUDE;
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

  // Jika preAnalyzedResults tersedia, gunakan Sintesis Deterministik
  if (options.preAnalyzedResults?.length > 0) {
    const babIvNarasi = generateBabAnalisis({ items: options.preAnalyzedResults, aspek });
    const finalScore = calcScore(options.preAnalyzedResults);
    return {
      skor_aspek: Math.round(finalScore),
      narasi_teknis: babIvNarasi,
      rekomendasi: options.preAnalyzedResults
        .filter(r => r.status !== 'Sesuai')
        .map(r => ({ judul: `Perbaikan ${r.nama}`, tindakan: r.rekomendasi, prioritas: (r.risiko || 'SEDANG').toUpperCase(), aspek })),
      meta: {
        provider: 'Synthesis Engine (Pure Code)',
        kategori: getKategori(finalScore),
        risk_highlights: options.preAnalyzedResults.filter(r => r.risiko === 'Kritis' || r.risiko === 'Tinggi').map(r => r.nama),
      },
    };
  }

  // Loop Analisis Per Item
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (onProgress) onProgress(i + 1, items.length, `Menganalisis: ${item.nama}`);
    const analyzed = await runSingleItemAnalysis(item, aspek, { roleTitle, standard, targetModel, blacklistedModels });
    results.push(analyzed);
    await new Promise(r => setTimeout(r, 400));
  }

  if (onProgress) onProgress(items.length, items.length, 'Lead Engineer sedang merakit Laporan Teknis...');

  const babIvNarasi = generateBabAnalisis({ items: results, aspek });
  const finalScore = calcScore(results);

  return {
    skor_aspek: Math.round(finalScore),
    narasi_teknis: babIvNarasi,
    rekomendasi: results
      .filter(r => r.status !== 'Sesuai')
      .map(r => ({ judul: `Perbaikan ${r.nama}`, tindakan: r.rekomendasi, prioritas: r.risiko.toUpperCase(), aspek })),
    meta: {
      provider: 'Synthesis Engine (Pure Code)',
      kategori: getKategori(finalScore),
      risk_highlights: results.filter(r => r.risiko === 'Kritis' || r.risiko === 'Tinggi').map(r => r.nama),
    },
  };
}

function calcScore(items) {
  return items.length > 0
    ? (items.filter(i => {
      const s = (i.status || '').toLowerCase();
      return (s.includes('sesuai') && !s.includes('tidak')) || s.includes('baik') || s.includes('aman') || s.includes('memadai');
    }).length / items.length) * 100
    : 0;
}

function getKategori(score) {
  if (score > 80) return 'LAIK';
  if (score > 60) return 'LAIK BERSYARAT';
  return 'TIDAK LAIK';
}

// ── Single Item Analysis ─────────────────────────────────────
export async function runSingleItemAnalysis(item, aspek, options = {}) {
  const {
    roleTitle = 'Digital Technical Consultant SLF',
    standard = 'NSPK & PP No. 16 Tahun 2021',
    targetModel = MODELS.GEMINI,
    blacklistedModels = new Set(),
  } = options;

  const itemPrompt = getPromptForItem(item, aspek, roleTitle, standard);

  try {
    const respText = await safeCall(async () => {
      const settings = await getSettings();

      // Failover chain
      const order = [targetModel, MODELS.SLF_OPUS, MODELS.MISTRAL, MODELS.GEMMA_3, MODELS.GROQ, MODELS.OPENROUTER, MODELS.OPENAI, MODELS.CLAUDE, MODELS.GEMINI];
      const failoverChain = [];
      const seen = new Set();

      // Ollama di awal jika diaktifkan
      if (settings.ai?.ollamaEnabled && settings.ai?.ollamaModel) {
        const ollamaModel = { ...MODELS.OLLAMA, id: settings.ai.ollamaModel, name: `Ollama (${settings.ai.ollamaModel})` };
        failoverChain.push(ollamaModel);
        seen.add(ollamaModel.name);
      }

      for (const m of order) {
        if (!m || seen.has(m.name) || blacklistedModels.has(m.name)) continue;
        // Di production dengan proxy: semua model bisa dipakai tanpa mengecek key
        if (USE_PROXY || m.vendor === 'google' || m.key || m.vendor === 'ollama') {
          failoverChain.push(m);
          seen.add(m.name);
        }
      }

      let lastError = null;
      for (const model of failoverChain) {
        try {
          return await callAI(model, itemPrompt);
        } catch (err) {
          lastError = err;
          console.warn(`[AI Router] Model ${model.name} GAGAL: ${err.message}`);
          blacklistedModels.add(model.name);
        }
      }
      throw new Error(`Seluruh model AI gagal. Error terakhir: ${lastError?.message ?? 'Unknown'}`);
    });

    const parsed = parseAIJson(respText);
    return {
      kode: parsed.kode || item.kode,
      nama: parsed.nama || item.nama,
      status: parsed.status || 'Tidak Sesuai',
      faktual: parsed.faktual || 'Data faktual tidak tersedia.',
      visual: parsed.visual || 'Data visual tidak tersedia.',
      regulasi: parsed.regulasi || [standard, 'PP 16/2021'],
      analisis: parsed.analisis || 'Diperlukan analisis lebih lanjut.',
      risiko: parsed.risiko || 'Sedang',
      rekomendasi: parsed.rekomendasi || 'Lengkapi dokumen pendukung.',
      narasi_item_lengkap: parsed.narasi_item_lengkap || 'Analisis naratif tidak tersedia.',
    };
  } catch (err) {
    console.error('[runSingleItemAnalysis] Gagal:', err);
    return {
      kode: item.kode,
      nama: item.nama,
      status: 'Error',
      faktual: `Gagal Analisis: ${err.message}`,
      visual: 'Tidak tersedia.',
      regulasi: [standard],
      analisis: 'Kesalahan teknis pada engine AI.',
      risiko: 'Tinggi',
      rekomendasi: 'Ulangi analisis item ini.',
      narasi_item_lengkap: `Terjadi kendala teknis AI: ${err.message}`,
    };
  }
}

export function parseAIJson(text) {
  try {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}') + 1;
    if (start === -1 || end === 0) throw new Error('Format JSON tidak ditemukan');
    const raw = text.substring(start, end);
    const clean = raw.replace(/[\x00-\x1F\x7F-\x9F]/g, (m) => (m === '\n' || m === '\r' || m === '\t' ? m : ' '));
    return JSON.parse(clean);
  } catch (e) {
    console.error('[AI Parser] Gagal parsing:', text?.substring(0, 200));
    throw new Error('Gagal mengekstrak JSON dari AI: ' + e.message);
  }
}

/**
 * OCR Vision Engine — ekstrak data IMB/PBG dari gambar/PDF
 */
export async function runOCRAnalysis(base64Data, mimeType) {
  const model = MODELS.GEMINI;
  const prompt = `
    Anda adalah AI Data Entry Spesialis Perizinan Bangunan (IMB/PBG) di Indonesia.
    Tugas: Ekstrak data teknis secara presisi dari dokumen yang diberikan (Scan IMB/PBG/Sertifikat).
    
    Ekstrak field berikut dalam format JSON murni:
    {
      "nama_bangunan": "...", "pemilik": "...", "alamat": "...",
      "luas_bangunan": 0, "luas_lahan": 0, "jumlah_lantai": 0,
      "nomor_pbg": "...", "fungsi_bangunan": "...",
      "gsb": 0, "kdb": 0, "klb": 0, "kdh": 0
    }
    PENTING: Jika data tidak ditemukan, berikan nilai null. Kembalikan HANYA JSON.
  `;

  const resText = await callAI(model, prompt, { base64Data, mimeType });
  return parseAIJson(resText);
}

// ── Direct Fetchers (hanya aktif di dev mode) ─────────────────

async function fetchOllama(model, prompt) {
  return await generateOllamaCompletion(
    prompt,
    'Anda adalah asisten ahli audit teknis bangunan gedung SLF. Balas dalam format JSON.',
    model.id
  );
}

async function fetchGemini(model, prompt, options = {}) {
  const url = DIRECT_ENDPOINTS.gemini(model.id);
  const parts = [{ text: prompt }];
  if (options.base64Data && options.mimeType) {
    parts.push({ inlineData: { mimeType: options.mimeType, data: options.base64Data } });
  }
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 8192 },
    }),
  });
  if (!res.ok) throw new Error(`Gemini Error (HTTP ${res.status}): ${await res.text().then(t => t.substring(0, 50))}`);
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';
}

async function fetchOpenAI(model, prompt) {
  const res = await fetch(model.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${model.key}` },
    body: JSON.stringify({ model: model.id, messages: [{ role: 'user', content: prompt }], temperature: 0.1, max_tokens: 8192 }),
  });
  if (!res.ok) throw new Error(`OpenAI/Groq Error (HTTP ${res.status})`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '{}';
}

export async function fetchOpenRouter(model, prompt) {
  const res = await fetch(model.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${model.key}`,
      'HTTP-Referer': 'https://smartaipengkaji.app',
      'X-Title': 'Smart AI Pengkaji SLF',
    },
    body: JSON.stringify({ model: model.id, messages: [{ role: 'user', content: prompt }], temperature: 0.1 }),
  });
  if (!res.ok) throw new Error(`OpenRouter Error (HTTP ${res.status})`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '{}';
}

async function fetchClaude(model, prompt) {
  const res = await fetch(model.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': model.key,
      'anthropic-version': '2023-06-01',
      // NOTE: Header ini hanya untuk dev/testing. Di production, gunakan Edge Function proxy.
      ...(env.DEV ? { 'anthropic-dangerous-direct-browser-access': 'true' } : {}),
    },
    body: JSON.stringify({ model: model.id, max_tokens: 8192, messages: [{ role: 'user', content: prompt }] }),
  });
  if (!res.ok) throw new Error(`Claude Error (HTTP ${res.status})`);
  const data = await res.json();
  return data.content?.[0]?.text ?? '{}';
}

async function fetchSLFOpus(model, prompt) {
  if (!model.key) throw new Error('HuggingFace API Token tidak ditemukan.');
  const res = await fetch(model.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${model.key}` },
    body: JSON.stringify({
      inputs: [
        { role: 'developer', content: 'Anda adalah AI Ahli Pengkaji SLF Bangunan Gedung dengan kemampuan penalaran mendalam.' },
        { role: 'user', content: prompt },
      ],
      parameters: { max_new_tokens: 4096, temperature: 0.1, return_full_text: false },
    }),
  });
  if (!res.ok) throw new Error(`HF SLF_OPUS Error (HTTP ${res.status})`);
  const data = await res.json();
  const text = Array.isArray(data) ? data[0]?.generated_text : (data.generated_text ?? '');
  return text.replace(/<thought>[\s\S]*?<\/thought>/g, '').trim();
}

async function fetchMistral(model, prompt) {
  if (!model.key) throw new Error('Mistral API Key tidak ditemukan.');
  const res = await fetch(model.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${model.key}` },
    body: JSON.stringify({ model: model.id, messages: [{ role: 'user', content: prompt }], temperature: 0.1, max_tokens: 4096 }),
  });
  if (!res.ok) throw new Error(`Mistral Error (HTTP ${res.status})`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '{}';
}

export async function runFinalConclusion(skorMap, rekomendasi_gabungan) {
  const systemPrompt = `Anda adalah Ketua Tim Konsultan Pengkaji SLF. 
Berikan ringkasan eksekutif strategis berdasarkan seluruh aspek pengkajian teknis.
Skor per aspek: ${JSON.stringify(skorMap)}
Rekomendasi Gabungan: ${JSON.stringify(rekomendasi_gabungan?.slice(0, 10))}

Output WAJIB JSON:
{ "kesimpulan_eksekutif": "...", "status_final": "LAIK_FUNGSI|LAIK_BERSYARAT|TIDAK_LAIK", "risk_score": 0-100 }`;

  const aiResultText = await safeCall(async () => callAI(MODELS.GEMINI, systemPrompt));
  return parseAIJson(aiResultText);
}

/**
 * Multi-Agent Consensus
 */
export async function getMultiAgentConsensus(checklist, proyek, analisisSummary) {
  const anomalies = checklist.filter(i => i.status !== 'baik' && i.status !== 'ada_sesuai' && i.status !== 'tidak_wajib');
  const totalCount = checklist.length;
  const goodCount = totalCount - anomalies.length;

  const dataBrief = `
    DATA PROYEK: ${proyek.nama_bangunan} (${proyek.fungsi_bangunan})
    RINGKASAN STATISTIK:
    - Total Parameter: ${totalCount}
    - Kondisi Baik/Sesuai: ${goodCount} (${Math.round(goodCount / totalCount * 100)}%)
    - Anomali/Temuan Kritis: ${anomalies.length}
    
    DETAIL TEMUAN ANOMALI:
    ${anomalies.map(i => `- [${i.kode}] ${i.nama}: STATUS=${i.status} | CATATAN=${i.catatan || '-'}`).join('\n')}
    
    SKOR ANALISIS: ${JSON.stringify(analisisSummary.skor)}
    RISIKO: ${analisisSummary.riskLevel}
  `;

  const findings = {};
  for (const role of ['ARSITEK', 'STRUKTUR', 'MEP', 'LEGAL']) {
    const prompt = `${EXPERT_PERSONAS[role]}\n\nData lapangan:\n${dataBrief}\n\nBerikan analisis mendalam sesuai spesialisasi Anda. Terangkan risiko dan rekomendasi perbaikan.`;
    findings[role] = await callAI(MODELS.GEMINI, prompt);
  }

  const masterPrompt = `
    ${EXPERT_PERSONAS.KOORDINATOR}

    Temuan dari tim ahli spesialis:
    - ARSITEK: ${findings.ARSITEK}
    - STRUKTUR: ${findings.STRUKTUR}
    - MEP: ${findings.MEP}
    - LEGAL: ${findings.LEGAL}

    OUTPUT FORMAT JSON:
    {
      "bab5_analisis": "...",
      "bab6_kesimpulan": "...",
      "status_final": "LAYAK_FUNGSI | LAYAK_FUNGSI_DENGAN_CATATAN | TIDAK_LAYAK_FUNGSI",
      "risk_score": 0-100
    }
  `;

  const finalResultBlob = await callAI(MODELS.GEMINI, masterPrompt);
  return parseAIJson(finalResultBlob);
}

// ── Deterministic Synthesis Engine (Non-AI) ──────────────────
function generateBabAnalisis(data) {
  const isTataBangunan = ['administrasi', 'pemanfaatan', 'arsitektur'].includes(data.aspek.toLowerCase());
  const pillarName = isTataBangunan ? 'ASPEK TATA BANGUNAN' : 'ASPEK KEANDALAN BANGUNAN';

  return `
# BAB IV – ANALISIS TEKNIS DAN EVALUASI

## 4.1. ANALISIS ${pillarName}

### A. IDENTIFIKASI DAN INTERPRETASI DATA LAPANGAN
${generateFaktual(data.items)}

### B. ANALISIS REKAYASA DAN KESESUAIAN STANDAR (SNI/NSPK)
${generateAnalisis(data.items)}

### C. PENILAIAN RISIKO DAN IMPLIKASI TEKNIS
${generateRisiko(data.items)}

### D. EVALUASI DAN REKOMENDASI MITIGASI
${generateKesimpulan(data.items)}

## 4.2. RINGKASAN TINGKAT KEANDALAN
${generateEvaluasi(data.items)}
`;
}

function generateFaktual(items) {
  return items.map((item, i) => `
**${i + 1}. ${item.nama} (${item.kode})**
Kondisi eksisting: ${item.faktual}.
Status Saat Ini: **${item.status}**.
`).join('\n');
}

function generateVisual(items, aspek) {
  const masalah = items.filter(i => i.status !== 'Sesuai').map(i => i.nama).slice(0, 2).join(' and ');
  const baseStyle = 'engineering blueprint style, vector graphic, technical diagram, high quality, CAD style, no text';
  const contentFocus = masalah.length > 0
    ? `technical drawing of ${masalah} in ${aspek} aspect`
    : `technical drawing of ${aspek} aspect of a professional building`;
  const sanitized = contentFocus.replace(/[^a-zA-Z0-9\s]/g, ' ');
  const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(`${sanitized}, ${baseStyle}`)}?width=800&height=400&nologo=true`;

  return `![Visualisasi Teknis Poin C](${imageUrl})\n\n*Gambar: Diagram teknis kondisi eksisting pada aspek ${aspek} (AI Generated).*\n\n` +
    items.map((item, i) => `\n**${i + 1}. ${item.nama}**\nCatatan: ${item.visual}.`).join('\n');
}

function generateRegulasi(items) {
  return items.map((item, i) => `\n**${i + 1}. ${item.nama}**\nAcuan Regulasi:\n${(item.regulasi || []).map(r => `- ${r}`).join('\n')}`).join('\n');
}

function generateAnalisis(items) {
  return items.map((item, i) => `\n**${i + 1}. ${item.nama}**\nAnalisis Kesesuaian: ${item.analisis}.`).join('\n');
}

function generateRisiko(items) {
  return items.map((item, i) => `\n**${i + 1}. ${item.nama}**\nKategori Risiko: **${item.risiko}**.`).join('\n');
}

function generateEvaluasi(items) {
  const total = items.length;
  const tidakSesuai = items.filter(i => i.status !== 'Sesuai').length;
  const score = total > 0 ? (items.filter(i => i.status === 'Sesuai').length / total) * 100 : 0;

  return `
- **Konvergensi Data**: ${total - tidakSesuai} item compliant dari total ${total} item.
- **Indeks Evaluasi Global Aspek**: **${Math.round(score)} / 100**.
- **Deviasi Kelaikan**: ${Math.round(100 - score)}% defect likelihood.

**Implikasi Keselamatan:**
Komponen ini ditetapkan pada tingkat keandalan bangunan **${getKategori(score)}**. 
Perbaikan pada sub-sistem yang gagal merupakan prasyarat mandatory untuk operasionalisasi fasilitas yang aman.
`;
}

function generateKesimpulan(items) {
  const critical = items.filter(i => i.risiko === 'Kritis' || i.risiko === 'Tinggi');
  return `
**Log Intervensi Rekomendasi (Prioritas):**
${critical.length > 0
      ? critical.map((c, i) => `\n**${i + 1}. Tindakan Korektif: ${c.nama} [P1]**\n- Risiko: **${c.risiko}**\n- Rekomendasi: ${c.rekomendasi}`).join('\n')
      : '- Tidak terdapat rekomendasi P1 (Tinggi/Kritis) pada aspek ini.'}

**Matriks Temuan Umum:**
${items.filter(i => i.risiko !== 'Kritis' && i.risiko !== 'Tinggi').map(i => `- ${i.nama}: ${i.rekomendasi} (Prioritas: ${i.risiko})`).join('\n')}
`;
}
