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
import { supabase } from './supabase.js';

// ── Edge Function Proxy URL ───────────────────────────────────
// Di production: set VITE_AI_PROXY_URL di .env ke URL Edge Function Anda
// Contoh: https://<project-ref>.supabase.co/functions/v1/ai-proxy
// (ref proyek sengaja tidak ditulis di sini: repo ini publik, dan setiap
//  pengguna harus memakai proyeknya sendiri — jangan hardcode ref produksi.)
const AI_PROXY_URL = env.VITE_AI_PROXY_URL || (env.VITE_SUPABASE_URL
  ? `${env.VITE_SUPABASE_URL.replace(/[/]+$/, '')}/functions/v1/ai-proxy`
  : (env.DEV ? '/functions/v1/ai-proxy' : ''));
const USE_PROXY = !!AI_PROXY_URL;

// ── Legacy direct mode (untuk dev atau jika belum ada proxy) ──
// ── Model Registry ────────────────────────────────────────────
export const MODELS = {
  // KIMI FAMILY - Default model (Moonshot AI)
  KIMI: {
    id: 'moonshot-v1-8k',
    name: 'Kimi (Moonshot)',
    vendor: 'openai', // OpenAI-compatible API
    proxyProvider: 'kimi',
    type: 'text',
    costTier: 'free',
    maxTokens: 8192,
    contextWindow: 8000,
    recommended: true, // Marked as recommended default
  },
  KIMI_32K: {
    id: 'moonshot-v1-32k',
    name: 'Kimi 32K',
    vendor: 'openai',
    proxyProvider: 'kimi',
    type: 'text',
    costTier: 'free',
    maxTokens: 32768,
    contextWindow: 32000,
  },
  KIMI_128K: {
    id: 'moonshot-v1-128k',
    name: 'Kimi 128K',
    vendor: 'openai',
    proxyProvider: 'kimi',
    type: 'text',
    costTier: 'free',
    maxTokens: 128000,
    contextWindow: 128000,
  },
  
  // GEMINI HYBRID FAMILY - Model selector akan memilih yang tepat
  GEMINI_FLASH: {
    id: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    vendor: 'google',
    proxyProvider: 'gemini',
    type: 'text', // Optimized for fast text generation
    costTier: 'low',
    maxTokens: 8192,
  },
  GEMINI_FLASH_LITE: {
    id: 'gemini-2.0-flash-lite',
    name: 'Gemini 2.0 Flash Lite',
    vendor: 'google',
    proxyProvider: 'gemini',
    type: 'text',
    costTier: 'lowest',
    maxTokens: 8192,
  },
  GEMINI_PRO: {
    id: 'gemini-2.5-pro-exp-03-25',
    name: 'Gemini 2.5 Pro',
    vendor: 'google',
    proxyProvider: 'gemini',
    type: 'vision', // Optimized for complex reasoning & vision
    costTier: 'high',
    maxTokens: 65536,
  },
  GEMINI: { // Default fallback ke Flash untuk backward compatibility
    id: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    vendor: 'google',
    proxyProvider: 'gemini',
    type: 'text',
    costTier: 'low',
  },
  GROQ: {
    id: 'llama-3.3-70b-versatile',
    name: 'Groq Llama 3.3 70B (Ultra-Fast)',
    vendor: 'openai',
    proxyProvider: 'groq',
    type: 'text',
    costTier: 'free',
    maxTokens: 8192,
    contextWindow: 128000,
    capabilities: ['reasoning', 'analysis', 'code', 'narrative'],
  },
  GROQ_VISION: {
    id: 'llama-3.2-11b-vision-preview',
    name: 'Groq Llama 3.2 11B Vision (Multimodal)',
    vendor: 'openai',
    proxyProvider: 'groq',
    type: 'vision',
    costTier: 'free',
    maxTokens: 4096,
    contextWindow: 128000,
    capabilities: ['vision', 'analysis', 'multimodal', 'documents'],
  },
  GROQ_REASONING: {
    id: 'deepseek-r1-distill-llama-70b',
    name: 'Groq DeepSeek R1 (Advanced Reasoning)',
    vendor: 'openai',
    proxyProvider: 'groq',
    type: 'reasoning',
    costTier: 'free',
    maxTokens: 8192,
    contextWindow: 128000,
    capabilities: ['deep_reasoning', 'chain_of_thought', 'analysis', 'problem_solving'],
  },
  GROQ_GPT_OSS_20B: {
    id: 'openai/gpt-oss-20b',
    name: 'Groq GPT-OSS 20B (Gratis - Lightweight)',
    vendor: 'openai',
    proxyProvider: 'groq',
    type: 'text',
    costTier: 'free',
    maxTokens: 4096,
    contextWindow: 128000,
    capabilities: ['text', 'analysis', 'lightweight'],
  },
  GROQ_GPT_OSS_120B: {
    id: 'openai/gpt-oss-120b',
    name: 'Groq GPT-OSS 120B (Gratis - Powerful)',
    vendor: 'openai',
    proxyProvider: 'groq',
    type: 'text',
    costTier: 'free',
    maxTokens: 8192,
    contextWindow: 128000,
    capabilities: ['text', 'analysis', 'complex_reasoning'],
    recommended: true,
  },
  GROQ_QWEN_32B: {
    id: 'qwen/qwen3-32b',
    name: 'Groq Qwen 3 32B (Gratis - Multilingual)',
    vendor: 'openai',
    proxyProvider: 'groq',
    type: 'text',
    costTier: 'free',
    maxTokens: 8192,
    contextWindow: 128000,
    capabilities: ['text', 'multilingual', 'analysis', 'coding'],
  },
  GROQ_LLAMA_4_SCOUT: {
    id: 'meta-llama/llama-4-scout-17b-16e-instruct',
    name: 'Groq Llama 4 Scout 17B (Gratis - Latest)',
    vendor: 'openai',
    proxyProvider: 'groq',
    type: 'text',
    costTier: 'free',
    maxTokens: 8192,
    contextWindow: 128000,
    capabilities: ['text', 'analysis', 'reasoning', 'latest'],
    recommended: true,
  },
  GROQ_WHISPER_TURBO: {
    id: 'whisper-large-v3-turbo',
    name: 'Groq Whisper Turbo (Speech-to-Text)',
    vendor: 'openai',
    proxyProvider: 'groq',
    type: 'audio',
    costTier: 'free',
    maxTokens: 4096,
    capabilities: ['speech_recognition', 'multilingual', 'fast'],
  },
  GROQ_WHISPER_LARGE: {
    id: 'whisper-large-v3',
    name: 'Groq Whisper Large V3 (Speech-to-Text)',
    vendor: 'openai',
    proxyProvider: 'groq',
    type: 'audio',
    costTier: 'free',
    maxTokens: 4096,
    capabilities: ['speech_recognition', 'multilingual', 'high_accuracy'],
  },
  OPENROUTER: {
    id: 'google/gemini-2.0-flash-lite:free',
    name: 'OpenRouter Free',
    vendor: 'openrouter',
    proxyProvider: 'openrouter',
  },
  OPENAI: {
    id: 'gpt-4o',
    name: 'OpenAI GPT-4o',
    vendor: 'openai',
    proxyProvider: 'openai',
  },
  CLAUDE: {
    id: 'claude-3-5-sonnet-20241022',
    name: 'Claude 3.5 Sonnet',
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
    vendor: 'huggingface',
    proxyProvider: 'huggingface',
  },
  MISTRAL: {
    id: 'mistral-large-latest',
    name: 'Mistral Large',
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

// ============================================================
//  KIMI vs GEMINI MODEL COMPARATOR
//  Pilih model terbaik berdasarkan konteks dan ketersediaan
// ============================================================

/**
 * Pilih model default terbaik antara Kimi dan Gemini
 * Mempertimbangkan:
 * - Gratis vs Berbayar
 * - Context length yang dibutuhkan
 * - Task type (vision, narrative, analysis)
 * - Rate limit dan availability
 */
export function getDefaultModel(options = {}) {
  const { hasVision = false, complexReasoning = false, fastMode = false, taskType = 'analysis' } = options;
  if (hasVision || taskType === 'vision' || taskType === 'ocr' || complexReasoning || taskType === 'deep_analysis') {
    return { model: MODELS.GEMINI_PRO, reason: 'Gemini Pro via server-side proxy', estimatedCost: 'high', advantage: 'Vision dan reasoning diproses server-side' };
  }
  if (fastMode || taskType === 'suggestion' || taskType === 'autocomplete') {
    return { model: MODELS.GEMINI_FLASH_LITE, reason: 'Gemini Flash Lite via server-side proxy', estimatedCost: 'lowest', advantage: 'Model ringan untuk tugas cepat' };
  }
  return { model: MODELS.GEMINI_FLASH, reason: 'Gemini Flash via server-side proxy', estimatedCost: 'low', advantage: 'Model teks standar melalui proxy' };
}

/**
 * Model comparator untuk membandingkan performa Kimi vs Gemini
 */
export const MODEL_COMPARATOR = {
  // Perbandingan berdasarkan use case
  comparisons: {
    vision: {
      winner: 'gemini_pro',
      reason: 'Gemini Pro memiliki multimodal capability yang lebih baik',
      kimiAlternative: null,
      geminiModel: MODELS.GEMINI_PRO
    },
    
    narrative_generation: {
      winner: 'kimi',
      reason: 'Kimi gratis menghasilkan narasi berkualitas tinggi tanpa biaya',
      kimiModel: MODELS.KIMI,
      geminiAlternative: MODELS.GEMINI_FLASH
    },
    
    document_analysis: {
      winner: 'kimi_128k',
      reason: 'Kimi 128K gratis dengan context window besar lebih baik untuk analisis dokumen panjang',
      kimiModel: MODELS.KIMI_128K,
      geminiAlternative: MODELS.GEMINI_PRO
    },
    
    fast_response: {
      winner: 'gemini_flash_lite',
      reason: 'Flash Lite dioptimalkan untuk response cepat',
      kimiAlternative: MODELS.KIMI,
      geminiModel: MODELS.GEMINI_FLASH_LITE
    },
    
    complex_reasoning: {
      winner: 'gemini_pro',
      reason: 'Gemini Pro lebih baik untuk penalaran kompleks',
      kimiAlternative: MODELS.KIMI_128K,
      geminiModel: MODELS.GEMINI_PRO
    },
    
    structured_output: {
      winner: 'kimi',
      reason: 'Kimi sangat baik dalam menghasilkan output JSON terstruktur',
      kimiModel: MODELS.KIMI,
      geminiAlternative: MODELS.GEMINI_FLASH
    }
  },
  
  /**
   * Get rekomendasi model berdasarkan task type
   */
  recommend(taskType, options = {}) {
    const comparison = this.comparisons[taskType];
    if (!comparison) {
      return getDefaultModel(options);
    }
    
    const selectedModel = comparison.geminiModel || MODELS.GEMINI_FLASH;
    return {
      model: selectedModel,
      reason: comparison.reason,
      estimatedCost: selectedModel.costTier || 'low',
      advantage: comparison.reason
    };
  }
};
//  Otomatis pilih model: Flash untuk narasi & teks, 
//  Pro hanya untuk vision & analisis gambar kompleks.
//  Menghemat quota Pro hingga 80%.
// ============================================================

export const GEMINI_ROUTER = {
  /**
   * Pilih model Gemini yang tepat berdasarkan konteks request
   * @param {Object} options - Konfigurasi request
   * @param {boolean} options.hasVision - Apakah ada input gambar/base64
   * @param {boolean} options.complexReasoning - Butuh reasoning mendalam?
   * @param {boolean} options.fastMode - Mode cepat (prioritaskan Flash Lite)
   * @param {string} options.taskType - 'narrative' | 'analysis' | 'ocr' | 'vision' | 'code'
   * @returns {Object} Model yang dipilih
   */
  selectModel(options = {}) {
    const { hasVision = false, complexReasoning = false, fastMode = false, taskType = 'analysis' } = options;
    
    // RULE 1: Vision analysis SELALU gunakan Pro
    if (hasVision || taskType === 'vision' || taskType === 'ocr') {
      return { 
        model: MODELS.GEMINI_PRO, 
        reason: 'Vision/complex-image requires Pro',
        estimatedCost: 'high'
      };
    }
    
    // RULE 2: Complex reasoning yang memerlukan konteks panjang
    if (complexReasoning || taskType === 'deep_analysis') {
      return { 
        model: MODELS.GEMINI_PRO, 
        reason: 'Complex reasoning with long context',
        estimatedCost: 'high'
      };
    }
    
    // RULE 3: Fast mode untuk response cepat (misal: autocomplete, suggestions)
    if (fastMode || taskType === 'suggestion' || taskType === 'autocomplete') {
      return { 
        model: MODELS.GEMINI_FLASH_LITE, 
        reason: 'Fast mode - lightweight tasks',
        estimatedCost: 'lowest'
      };
    }
    
    // RULE 4: Narrative generation, text analysis -> Flash (default)
    // Ini menghemat 80% quota Pro karena sebagian besar request adalah teks
    return { 
      model: MODELS.GEMINI_FLASH, 
      reason: 'Text/narrative - Flash is optimal',
      estimatedCost: 'low'
    };
  },

  /**
   * Routing dengan fallback chain cerdas
   * @param {Array} preferredModels - Array model dalam urutan preferensi
   * @param {Function} callFn - Function untuk memanggil AI
   */
  async routeWithFallback(preferredModels, callFn) {
    const errors = [];
    
    for (const modelInfo of preferredModels) {
      try {
        const result = await callFn(modelInfo.model);
        return {
          success: true,
          result,
          modelUsed: modelInfo.model.name,
          reason: modelInfo.reason,
          cost: modelInfo.estimatedCost
        };
      } catch (err) {
        errors.push({ model: modelInfo.model.name, error: err.message });
        console.warn(`[Gemini Router] ${modelInfo.model.name} failed: ${err.message}`);
        continue;
      }
    }
    
    throw new Error(`All models failed. Errors: ${JSON.stringify(errors)}`);
  },

  /**
   * Batch routing untuk mengoptimalkan cost pada multiple requests
   * Pisahkan vision tasks (ke Pro) dari text tasks (ke Flash)
   * @param {Array} requests - Array request objects
   * @returns {Object} Grouped by model type
   */
  batchOptimize(requests) {
    const batches = {
      pro: [],    // Vision/complex reasoning
      flash: [],  // Standard text
      lite: []    // Fast/lightweight
    };
    
    for (const req of requests) {
      const selection = this.selectModel(req.options);
      
      if (selection.model.id === MODELS.GEMINI_PRO.id) {
        batches.pro.push(req);
      } else if (selection.model.id === MODELS.GEMINI_FLASH_LITE.id) {
        batches.lite.push(req);
      } else {
        batches.flash.push(req);
      }
    }
    
    return {
      batches,
      stats: {
        pro: batches.pro.length,
        flash: batches.flash.length,
        lite: batches.lite.length,
        estimatedSavings: `~${Math.round((batches.pro.length / requests.length) * 100)}% using Pro, ${Math.round(((batches.flash.length + batches.lite.length) / requests.length) * 100)}% using Flash`
      }
    };
  }
};

// Legacy compatibility - export MODELS.GEMINI sebagai default
Object.defineProperty(MODELS, 'GEMINI', {
  get() {
    // Gunakan getDefaultModel untuk memilih antara Kimi dan Gemini
    const selection = getDefaultModel({});
    return selection.model;
  },
  configurable: true
});

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

// ── Retry dengan True Exponential Backoff ─────────────────────────
const delay = (ms) => new Promise(res => setTimeout(res, ms));

/**
 * Extract retry-after dari error response header jika tersedia
 * @param {Error} error - Error object
 * @returns {number|null} - Milliseconds untuk wait atau null
 */
function getRetryAfterMs(error) {
  if (!error) return null;

  // Check untuk retry-after header dalam error response
  if (error.response?.headers?.['retry-after']) {
    const retryAfter = error.response.headers['retry-after'];
    // Jika angka, itu adalah seconds
    if (!isNaN(retryAfter)) {
      return parseInt(retryAfter) * 1000;
    }
    // Jika date string, hitung delta
    const retryDate = new Date(retryAfter);
    if (!isNaN(retryDate.getTime())) {
      return Math.max(0, retryDate.getTime() - Date.now());
    }
  }

  // Parse dari error message untuk Groq/Gemini specific
  const msg = error.message || error.toString();
  const groqMatch = msg.match(/try again in (\d+(?:\.\d+)?)\s*(ms|s|seconds?|minutes?|m)/i);
  if (groqMatch) {
    const value = parseFloat(groqMatch[1]);
    const unit = groqMatch[2].toLowerCase();
    if (unit.startsWith('m')) return value * 60 * 1000;
    if (unit.startsWith('s')) return value * 1000;
    if (unit === 'ms') return value;
  }

  return null;
}

/**
 * Calculate exponential backoff dengan jitter
 * Base: 2^attempt * 1000ms + random jitter
 */
function calculateBackoff(attempt, baseDelay = 1000, maxDelay = 60000) {
  // Exponential: 2^attempt * baseDelay
  const exponential = Math.pow(2, attempt) * baseDelay;

  // Jitter: random 0-1000ms untuk menghindari thundering herd
  const jitter = Math.floor(Math.random() * 1000);

  // Cap at maxDelay
  return Math.min(exponential + jitter, maxDelay);
}

async function safeCall(fn, retries = 3, attempt = 1, options = {}) {
  try {
    return await fn();
  } catch (e) {
    const isRateLimit = e.message?.includes('429') ||
                        e.message?.toLowerCase().includes('quota') ||
                        e.message?.toLowerCase().includes('rate limit') ||
                        e.message?.toLowerCase().includes('too many requests');

    if (attempt <= retries) {
      let waitTime;

      if (isRateLimit) {
        // Prioritaskan retry-after header jika tersedia
        const retryAfterMs = getRetryAfterMs(e);
        if (retryAfterMs) {
          waitTime = Math.max(retryAfterMs, 1000); // Minimum 1 detik
          console.warn(`[AI Router] Rate Limit dengan Retry-After. Retry ${attempt}/${retries} dalam ${waitTime}ms...`);
        } else {
          // Gunakan exponential backoff untuk rate limit
          waitTime = calculateBackoff(attempt, 2000, 60000);
          console.warn(`[AI Router] Rate Limit 429. Retry ${attempt}/${retries} dengan exponential backoff: ${waitTime}ms...`);
        }
      } else {
        // Untuk error non-rate-limit, gunakan backoff yang lebih ringan
        waitTime = calculateBackoff(attempt, 1000, 30000);
        console.warn(`[AI Router] Retry ${attempt}/${retries}. Error: ${e.message}. Wait: ${waitTime}ms`);
      }

      await delay(waitTime);
      return safeCall(fn, retries, attempt + 1, options);
    }

    throw e;
  }
}

// ── CORE: Panggil AI melalui Proxy atau Direct ────────────────
/**
 * Kirim request ke AI melalui Supabase Edge Function (production)
 * atau langsung ke API (development).
 */
export async function callAI(model, prompt, options = {}) {
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

  // Provider requests are never sent directly from the browser, including DEV.
  throw new Error(
    'AI Proxy belum dikonfigurasi. Set VITE_AI_PROXY_URL atau VITE_SUPABASE_URL ' +
    'dan jalankan Edge Function ai-proxy.'
  );
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
  const bahasaDirective = `[Bahasa Indonesia Protocol - WAJIB]
✓ Gunakan Bahasa Indonesia yang baik dan benar (eyd yang sempurna)
✓ Gaya bahasa: akademik, teknis, formal, profesional
✓ Terminologi: gunakan istilah engineering dan perizinan bangunan Indonesia yang tepat
✓ Hindari: slang, singkatan tidak baku, campur-campur bahasa (kecuali istilah teknis standar)
✓ Struktur: logis, komprehensif, mudah dipahami

`;

  if (promptConfig?.active) {
    deepReasoningHeader = `\n[DEEP REASONING CUSTOM ACTIVE]\n${bahasaDirective}${injectPromptConfig(promptConfig.system_instructions, promptConfig.principles)}\n`;
  } else {
    deepReasoningHeader = `[SISTEM CONTINUOUS LEARNING V6 & HYBRID AI AKTIF]\n${bahasaDirective}Anda adalah ${currentPersona}`;
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
    // Prioritaskan Groq Reasoning untuk analisis struktur yang kompleks, gratis & powerful
    targetModel = MODELS.GROQ_REASONING || MODELS.GROQ || MODELS.CLAUDE;
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
    // MEP & Fire Safety analysis requires complex reasoning - use Groq Reasoning
    targetModel = MODELS.GROQ_REASONING || MODELS.GROQ_VISION || MODELS.GROQ;
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
    const analyzed = await runSingleItemAnalysis(item, aspek, { roleTitle, standard, targetModel, blacklistedModels, projectId: options.projectId });
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
  if (!options.projectId) throw new Error('ID proyek wajib untuk analisis item SLF.');
  const {
    roleTitle = 'Digital Technical Consultant SLF',
    standard = 'NSPK & PP No. 16 Tahun 2021',
    targetModel = MODELS.GEMINI,
    blacklistedModels = new Set(),
    projectId,
  } = options;

  const itemPrompt = getPromptForItem(item, aspek, roleTitle, standard);

  try {
    const respText = await safeCall(async () => {
      const settings = await getSettings();

      // Failover chain - Prioritaskan model gratis & reasoning-capable
      const order = [
        targetModel, 
        MODELS.GROQ_REASONING,  // DeepSeek R1 Distill - advanced reasoning, gratis
        MODELS.GROQ_VISION,     // Llama 3.2 11B Vision - multimodal, gratis
        MODELS.GROQ,            // Llama 3.3 70B - fast & capable, gratis
        MODELS.SLF_OPUS, 
        MODELS.MISTRAL, 
        MODELS.GEMMA_3, 
        MODELS.OPENROUTER, 
        MODELS.OPENAI, 
        MODELS.CLAUDE, 
        MODELS.GEMINI
      ];
      const failoverChain = [];
      const seen = new Set();

      // Local Ollama is not exposed through the authenticated ai-proxy and is intentionally not routed from the browser.

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
          return await callAI(model, itemPrompt, { projectId });
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
 * Menggunakan Gemini Pro via Hybrid Router (Fitur #7 & #26)
 */
export async function runOCRAnalysis(base64Data, mimeType) {
  // Gunakan Gemini Pro untuk vision tasks via Hybrid Router
  const selection = GEMINI_ROUTER.selectModel({ 
    hasVision: true, 
    taskType: 'ocr' 
  });
  
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

  const resText = await callAI(selection.model, prompt, { base64Data, mimeType });
  return parseAIJson(resText);
}

/**
 * Batch Photo Analysis — Fitur #22 Photo-to-Checklist Mapper
 * Menganalisis banyak foto sekaligus untuk mapping ke checklist
 */
export async function runBatchPhotoAnalysis(photoArray, checklistContext = {}) {
  const projectId = checklistContext.projectId;
  if (!projectId) throw new Error('ID proyek wajib untuk analisis foto checklist.');
  // Batch optimize untuk hemat quota
  const requests = photoArray.map((photo, idx) => ({
    id: idx,
    photo,
    options: { hasVision: true, taskType: 'vision' }
  }));
  
  const batchPlan = GEMINI_ROUTER.batchOptimize(requests);
  const results = [];
  
  // Proses Pro batch (vision intensive)
  for (const req of batchPlan.batches.pro) {
    const prompt = `
Anda adalah AI Inspector Bangunan untuk Sertifikat Laik Fungsi (SLF).
Analisis foto berikut dan identifikasi:
1. Komponen bangunan yang terlihat (struktur, arsitektur, MEP)
2. Kondisi visual (baik/sedang/buruk/kritis)
3. Kerusakan yang terdeteksi
4. Mapping ke kode checklist SLF yang relevan

Context: ${JSON.stringify(checklistContext)}

Output JSON:
{
  "photoIndex": ${req.id},
  "komponen": ["kolom", "balok", "dll"],
  "kondisi": "baik|sedang|buruk|kritis",
  "kerusakan": ["retak", "karat", "dll"],
  "checklistMapping": ["ITEM-05A1", "ITEM-03A"],
  "confidence": 0.0-1.0,
  "rekomendasi": "..."
}`;
    
    try {
      const selection = GEMINI_ROUTER.selectModel({ hasVision: true, taskType: 'vision' });
      const resText = await callAI(selection.model, prompt, { 
        base64Data: req.photo.base64, 
        mimeType: req.photo.mimeType,
        projectId
      });
      results.push(parseAIJson(resText));
    } catch (err) {
      results.push({ 
        photoIndex: req.id, 
        error: err.message,
        kondisi: 'unknown',
        confidence: 0 
      });
    }
  }
  
  return {
    results,
    stats: batchPlan.stats,
    totalProcessed: results.length
  };
}

/**
 * Auto-Fill Daftar Simak — Fitur #8
 * Menggunakan Gemini Flash untuk generate checklist otomatis dari data proyek
 */
export async function generateDaftarSimak(proyekData, checklistTemplate) {
  const projectId = proyekData?.id || proyekData?.proyek_id;
  if (!projectId) throw new Error('ID proyek wajib untuk membuat Daftar Simak AI.');
  const selection = GEMINI_ROUTER.selectModel({ 
    taskType: 'narrative',
    fastMode: true // Use Flash Lite for speed
  });
  
  const prompt = `
Anda adalah AI Assistant untuk pengisian Daftar Simak SLF.
Berdasarkan data proyek berikut, generate status checklist yang sesuai:

DATA PROYEK:
${JSON.stringify(proyekData, null, 2)}

TEMPLATE CHECKLIST:
${JSON.stringify(checklistTemplate, null, 2)}

Generate array checklist items dengan format:
[{
  "kode": "ITEM-XX",
  "status": "ada_sesuai|ada_tidak_sesuai|tidak_ada|baik|sedang|buruk",
  "catatan": "...",
  "nilai": 0-100,
  "confidence": 0.0-1.0
}]

PENTING: Gunakan Flash untuk hemat quota. Prioritaskan akurasi pada item struktur & kebakaran.
`;

  try {
    const resText = await callAI(selection.model, prompt, { projectId });
    const parsed = parseAIJson(resText);
    return {
      items: Array.isArray(parsed) ? parsed : [],
      modelUsed: selection.model.name,
      cost: selection.estimatedCost
    };
  } catch (err) {
    console.error('[generateDaftarSimak] Error:', err);
    return { items: [], error: err.message };
  }
}

/** Public provider helper; the only supported route is authenticated ai-proxy. */
export async function fetchOpenRouter(model, prompt, options = {}) {
  return callAI({ ...model, vendor: 'openrouter', proxyProvider: 'openrouter' }, prompt, options);
}

export async function runFinalConclusion(skorMap, rekomendasi_gabungan, options = {}) {
  if (!options.projectId) throw new Error('ID proyek wajib untuk kesimpulan AI.');
  const systemPrompt = `Anda adalah Ketua Tim Konsultan Pengkaji SLF. 
Berikan ringkasan eksekutif strategis berdasarkan seluruh aspek pengkajian teknis.
Skor per aspek: ${JSON.stringify(skorMap)}
Rekomendasi Gabungan: ${JSON.stringify(rekomendasi_gabungan?.slice(0, 10))}

Output WAJIB JSON:
{ "kesimpulan_eksekutif": "...", "status_final": "LAIK_FUNGSI|LAIK_BERSYARAT|TIDAK_LAIK", "risk_score": 0-100 }`;

  const aiResultText = await safeCall(async () => callAI(MODELS.GEMINI, systemPrompt, { projectId: options.projectId }));
  return parseAIJson(aiResultText);
}

/**
 * Multi-Agent Consensus
 */
export async function getMultiAgentConsensus(checklist, proyek, analisisSummary) {
  const projectId = proyek?.id;
  if (!projectId) throw new Error('ID proyek wajib untuk konsensus Multi-Agent.');
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
    findings[role] = await callAI(MODELS.GEMINI, prompt, { projectId });
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

  const finalResultBlob = await callAI(MODELS.GEMINI, masterPrompt, { projectId });
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
