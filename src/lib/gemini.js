// ============================================================
//  MULTI-MODAL AI VISION & DOCUMENT ROUTER
//  Menggantikan fungsi asli gemini tunggal menjadi multi-AI
//  Enhanced dengan Deep Reasoning Engineering
// ============================================================

const env = import.meta.env;
import { supabase } from './supabase.js';
import { getSmartAIIntegration } from '../infrastructure/ai/deep-reasoning-integration.js';
import { escapeHtml } from './safe-markdown.js';

/**
 * Menganalisis gambar/dokumen (multi-file) berbasis komponen menggunakan AI terpilih (dengan Failover cerdas).
 * Enhanced dengan Deep Reasoning Engineering untuk analisis yang lebih mendalam.
 * @param {Array<{base64: string, mimeType: string}>} filesData
 * @param {string} componentName
 * @param {string} kategori
 * @param {string} aspek
 * @returns {Promise<{status: string, catatan: string}>}
 */
export async function analyzeChecklistImage(filesData, componentName, kategori = 'teknis', aspek = '', options = {}) {
  if (!Array.isArray(filesData) || filesData.length === 0 || filesData.length > 10) throw new Error('Jumlah bukti gambar harus 1 sampai 10.');
  if (!options.projectId) throw new Error('ID proyek wajib untuk analisis bukti checklist.');
  const bahasaDirective = `[Bahasa Indonesia Protocol - WAJIB]
Gunakan Bahasa Indonesia formal, akademik, teknis, dan profesional.`;
  const systemPrompt = kategori === 'administrasi'
    ? bahasaDirective + `Anda adalah Auditor Administrasi SLF. Telaah ${escapeHtml(filesData.length)} bukti untuk komponen "${escapeHtml(componentName)}" dan verifikasi kesesuaian PP No. 16 Tahun 2021.
Kembalikan JSON murni: {"status":"ada_sesuai|ada_tidak_sesuai|tidak_ada","catatan":"uraian bukti yang terlihat","rekomendasi":"tindak lanjut"}`
    : bahasaDirective + `Anda adalah Insinyur Sipil/Struktur ahli audit keandalan bangunan. Diagnosa ${escapeHtml(filesData.length)} bukti visual untuk komponen "${escapeHtml(componentName)}" pada aspek "${escapeHtml(aspek)}". Jelaskan kondisi yang benar-benar terlihat, risiko, dan rekomendasi.
Kembalikan JSON murni: {"status":"baik|sedang|buruk|kritis","catatan":"analisis visual teknis","rekomendasi":"tindakan engineering"}`;
  const raw = await callGeminiVision(filesData, systemPrompt, options.projectId);
  let parsedResult = parseAIJson(raw);
  if (options.useDeepReasoning !== false) {
    try {
      const integration = getSmartAIIntegration();
      if (integration?.isInitialized) {
        const enhanced = await integration.analyzeWithDeepReasoning(filesData, aspek, {
          ...options, componentName, kategori, baseResult: parsedResult, useDeepReasoning: false
        });
        parsedResult = { ...parsedResult, ...enhanced, deep_reasoning_enabled: true };
      }
    } catch (error) {
      console.warn('[Vision AI] Deep Reasoning gagal; hasil proxy dipertahankan:', error.message);
    }
  }
  return parsedResult;
}

/**
 * AI Document Processor - Khusus untuk klasifikasi & OCR dokumen SLF
 * Enhanced dengan Deep Reasoning untuk validasi regulasi
 * @param {Object} fileData {base64, mimeType}
 * @returns {Promise<{category: string, subcategory: string, extracted_text: string, metadata: Object}>}
 */
export async function analyzeDocument(fileData, options = {}) {
  if (!options.projectId) throw new Error('ID proyek wajib untuk analisis dokumen.');
  const prompt = `Anda adalah Auditor Dokumentasi Bangunan Gedung SLF.
Analisis dokumen dan tentukan kategori tanah atau umum, subkategori, nomor dokumen, tanggal terbit, pemilik/pemohon, dan abstraksi isi.
Kembalikan JSON murni: {"category":"tanah|umum","subcategory":"...","extracted_text":"...","metadata":{"doc_no":"...","date":"...","owner":"..."}}`;
  const raw = await callGeminiVision([fileData], prompt, options.projectId);
  const parsedResult = parseAIJson(raw);
  if (options.useDeepReasoning !== false) {
    try {
      const integration = getSmartAIIntegration();
      if (integration?.isInitialized) {
        const enhanced = await integration.analyzeDocumentWithDeepReasoning(fileData, { ...options, baseResult: parsedResult, useDeepReasoning: false });
        return { ...parsedResult, ...enhanced, regulation_validated: true, deep_reasoning_enabled: true };
      }
    } catch (error) {
      console.warn('[Document AI] Deep Reasoning gagal; hasil proxy dipertahankan:', error.message);
    }
  }
  return parsedResult;
}

/**
 * Menganalisis perbandingan antara beberapa dokumen (misal KRK vs Siteplan)
 * Enhanced dengan Deep Reasoning untuk analisis komparatif yang lebih mendalam
 */
export async function analyzeComparativeAudit(filesData, itemName, itemKode, context = '', options = {}) {
  if (!options.projectId) throw new Error('ID proyek wajib untuk analisis komparatif.');
  if (!Array.isArray(filesData) || filesData.length === 0 || filesData.length > 10) throw new Error('Jumlah dokumen komparatif harus 1 sampai 10.');
  const prompt = `Anda adalah Auditor Engineering SLF.
Bandingkan bukti dokumen untuk item "${itemName}" (kode "${itemKode}").
Konteks: ${context}
Bandingkan parameter dokumen legal dan fisik/teknis, identifikasi deviasi, dan berikan rekomendasi.
Kembalikan JSON murni: {"status":"baik|sedang|buruk|kritis","catatan":"analisis komparatif bukti","rekomendasi":"..."}`;
  const raw = await callGeminiVision(filesData, prompt, options.projectId);
  const parsedResult = parseAIJson(raw);
  if (options.useDeepReasoning !== false) {
    try {
      const integration = getSmartAIIntegration();
      if (integration?.isInitialized) {
        const enhanced = await integration.analyzeComparativeWithDeepReasoning(filesData, itemName, itemKode, context, { ...options, baseResult: parsedResult, useDeepReasoning: false });
        return { ...parsedResult, ...enhanced, deep_reasoning_enabled: true };
      }
    } catch (error) {
      console.warn('[Comparative AI] Deep Reasoning gagal; hasil proxy dipertahankan:', error.message);
    }
  }
  return parsedResult;
}

async function callGeminiVision(filesData, prompt, projectId) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Sesi login diperlukan untuk analisis AI.');
  const proxyUrl = env.VITE_AI_PROXY_URL ||
    (env.VITE_SUPABASE_URL ? `${env.VITE_SUPABASE_URL.replace(/[/]+$/, '')}/functions/v1/ai-proxy` : '/functions/v1/ai-proxy');
  const images = filesData.map((file) => ({
    base64Data: file.base64,
    mimeType: String(file.mimeType || '').split(';')[0]
  }));
  const response = await fetch(proxyUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
      'apikey': env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || env.VITE_SUPABASE_ANON_KEY || ''
    },
    body: JSON.stringify({
      provider: 'gemini', model: 'gemini-2.0-flash', prompt, images, projectId,
      maxTokens: 2048, temperature: 0.2
    })
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `AI Proxy gagal (HTTP ${response.status}).`);
  }
  const data = await response.json();
  if (typeof data.result !== 'string') throw new Error('Respons AI Proxy tidak valid.');
  return data.result;
}

function parseAIJson(text) {
  const clean = String(text || '').replace(/\x60{3}json/gi, '').replace(/\x60{3}/g, '').trim();
  const start = clean.indexOf('{');
  const end = clean.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error('AI tidak mengembalikan JSON yang valid.');
  return JSON.parse(clean.slice(start, end + 1));
}

