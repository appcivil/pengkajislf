// ============================================================
//  MULTI-MODAL AI VISION & DOCUMENT ROUTER
//  Menggantikan fungsi asli gemini tunggal menjadi multi-AI
//  Enhanced dengan Deep Reasoning Engineering
// ============================================================

const env = import.meta.env;
import { getSmartAIIntegration } from '../infrastructure/ai/deep-reasoning-integration.js';

const MODELS = {
  GROQ_VISION: {
    id: 'llama-3.2-11b-vision-preview',
    url: env.PROD ? 'https://api.groq.com/openai/v1/chat/completions' : '/api/groq/v1/chat/completions',
    key: env.VITE_GROQ_API_KEY,
    proxyProvider: 'groq'
  },
  GROQ_REASONING: {
    id: 'deepseek-r1-distill-llama-70b',
    url: env.PROD ? 'https://api.groq.com/openai/v1/chat/completions' : '/api/groq/v1/chat/completions',
    key: env.VITE_GROQ_API_KEY,
    proxyProvider: 'groq'
  },
  GEMINI: {
    id: 'gemini-2.0-flash',
    url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${env.VITE_GEMINI_API_KEY}`
  },
  OPENAI: {
    id: 'gpt-4o',
    url: env.PROD ? 'https://api.openai.com/v1/chat/completions' : '/api/openai/v1/chat/completions',
    key: env.VITE_OPENAI_API_KEY
  },
  CLAUDE: {
    id: 'claude-3-5-sonnet-20241022',
    url: env.PROD ? 'https://api.anthropic.com/v1/messages' : '/api/claude/v1/messages',
    key: env.VITE_CLAUDE_API_KEY
  },
  SLF_OPUS: {
    id: 'adminskpslf/SLF_OPUS',
    url: env.VITE_HF_SLF_OPUS_URL || 'https://api-inference.huggingface.co/models/adminskpslf/SLF_OPUS',
    key: env.VITE_HF_API_TOKEN
  }
};

/**
 * Menganalisis gambar/dokumen (multi-file) berbasis komponen menggunakan AI terpilih (dengan Failover cerdas).
 * Enhanced dengan Deep Reasoning Engineering untuk analisis yang lebih mendalam.
 * @param {Array<{base64: string, mimeType: string}>} filesData
 * @param {string} componentName
 * @param {string} kategori
 * @param {string} aspek
 * @returns {Promise<{status: string, catatan: string}>}
 */
export async function analyzeChecklistImage(filesData, componentName, kategori = 'teknis', aspek = '') {
  if (!filesData || filesData.length === 0) {
    throw new Error('Tidak ada file untuk dianalisis.');
  }

  // Cek apakah Deep Reasoning Integration tersedia
  let useDeepReasoning = false;
  try {
    const integration = getSmartAIIntegration();
    if (integration && integration.isInitialized) {
      useDeepReasoning = true;
    }
  } catch (e) {
    // Fallback ke sistem lama jika integration belum tersedia
  }

  // 1. Tentukan Urutan Provider (Chain of Responsibility)
  // Prioritaskan Groq gratis untuk vision dan reasoning
  let providerChain = ['groq_vision', 'groq_reasoning', 'gemini', 'openai'];

  // Custom priority based on complexity
  const a = aspek.toLowerCase();
  if (a.includes('struktur') || a.includes('kebakaran')) {
    // Struktur dan kebakaran perlu reasoning mendalam + vision
    providerChain = ['groq_vision', 'groq_reasoning', 'slf_opus', 'claude', 'gemini'];
  } else if (kategori === 'administrasi') {
    providerChain = ['groq_reasoning', 'gemini', 'slf_opus'];
  } else {
    // Default chain dengan Groq Vision diprioritaskan (gratis & multimodal)
    providerChain = ['groq_vision', 'groq_reasoning', 'slf_opus', 'gemini'];
  }

  // 2. Siapkan Prompt Bersama dengan Deep Reasoning Engineering
  const bahasaDirective = `[Bahasa Indonesia Protocol - WAJIB]
✓ Gunakan Bahasa Indonesia yang baik dan benar (eyd yang sempurna)
✓ Gaya bahasa: akademik, teknis, formal, profesional
✓ Terminologi: gunakan istilah engineering dan perizinan bangunan Indonesia yang tepat
✓ Hindari: slang, singkatan tidak baku, campur-campur bahasa
✓ Struktur: logis, komprehensif, mudah dipahami

`;

  let systemPrompt = '';
  if (kategori === 'administrasi') {
    systemPrompt = bahasaDirective + `Anda adalah seorang Auditor Administrasi Tingkat Lanjut untuk Sertifikat Laik Fungsi (SLF) Bangunan Gedung di Indonesia.
Gunakan mekanisme "Deep Reasoning Engineering" untuk menelaah secara komprehensif terhadap ${filesData.length} sampel dokumen pada komponen: "${componentName}".
Verifikasi kesesuaian berdasarkan PP No. 16 Tahun 2021.
Format JSON wajib: { 
  "status": "ada_sesuai|ada_tidak_sesuai|tidak_ada", 
  "catatan": "<deskripsi teknis temuan/isi dokumen yang terlihat>", 
  "rekomendasi": "<saran kelengkapan dokumen atau perbaikan>" 
}
PENTING: Isi 'catatan' meskipun status 'ada_sesuai' (jelaskan apa yang ada).`;
  } else {
    systemPrompt = bahasaDirective + `Anda adalah seorang Insinyur Sipil/Struktur Ahli Audit Keandalan Bangunan (SNI 9273:2025).
Gunakan "Deep Reasoning Engineering" untuk mendiagnosa ${filesData.length} sampel visual dari komponen: "${componentName}".
Analisis patologi material, risiko kegagalan, dan integritas struktur.
Format JSON wajib: { 
  "status": "baik|sedang|buruk|kritis", 
  "catatan": "<analisis teknis visual dari kondisi material/komponen>", 
  "rekomendasi": "<saran engineering untuk pemeliharaan/perbaikan/penggantian>" 
}
PENTING: Isi 'catatan' dengan deskripsi kondisi fisik yang terlihat meskipun status 'baik'.`;
  }

  // 3. Eksekusi dengan Failover Otomatis
  let lastError = null;
  for (const provider of providerChain) {
    try {
      console.log(`[Vision AI] Mencoba provider: ${provider.toUpperCase()} untuk ${componentName}`);
      let aiResultText = "";

      if (provider === 'gemini') {
        aiResultText = await callGeminiVision(filesData, systemPrompt);
      } else if (provider === 'openai') {
        if (!MODELS.OPENAI.key) continue;
        aiResultText = await callOpenAIVision(filesData, systemPrompt);
      } else if (provider === 'claude') {
        if (!MODELS.CLAUDE.key) continue;
        aiResultText = await callClaudeVision(filesData, systemPrompt);
      } else if (provider === 'slf_opus') {
        if (!MODELS.SLF_OPUS.key) continue;
        aiResultText = await callSLFOpusVision(filesData, systemPrompt);
      }

      // 4. Parsing Output JSON
      const raw = aiResultText.replace(/```json/gi, '').replace(/```/g, '').trim();
      let parsedResult = JSON.parse(raw);

      // 5. Enhanced dengan Deep Reasoning jika tersedia
      if (useDeepReasoning) {
        try {
          const integration = getSmartAIIntegration();
          const enhancedResult = await integration.analyzeWithDeepReasoning(
            filesData,
            componentName,
            kategori,
            aspek
          );

          // Merge hasil dengan hasil asli
          parsedResult = {
            ...parsedResult,
            ...enhancedResult,
            reasoning_steps: enhancedResult.reasoning_steps || [],
            legal_references: enhancedResult.legal_references || [],
            deep_reasoning_enabled: true
          };
        } catch (e) {
          console.warn('[Vision AI] Deep Reasoning gagal, menggunakan hasil standar:', e.message);
        }
      }

      return parsedResult;

    } catch (error) {
      lastError = error;
      console.warn(`[Vision AI] Provider ${provider.toUpperCase()} Gagal:`, error.message);
      // Lanjut ke provider berikutnya di chain...
    }
  }

  throw new Error(`Seluruh AI Vision gagal memproses gambar. Error terakhir: ${lastError?.message}`);
}

/**
 * AI Document Processor - Khusus untuk klasifikasi & OCR dokumen SLF
 * Enhanced dengan Deep Reasoning untuk validasi regulasi
 * @param {Object} fileData {base64, mimeType}
 * @returns {Promise<{category: string, subcategory: string, extracted_text: string, metadata: Object}>}
 */
export async function analyzeDocument(fileData) {
  let useDeepReasoning = false;
  try {
    const integration = getSmartAIIntegration();
    if (integration && integration.isInitialized) {
      useDeepReasoning = true;
    }
  } catch (e) {
    // Fallback ke sistem lama
  }
  const prompt = `Anda adalah AI Dokumentasi Bangunan Gedung (Auditor Teknis).
Analisis gambar/dokumen ini dan tentukan:
1. Kategori (Hanya pilih: "tanah" atau "umum")
2. Sub-kategori sesuai daftar: "Dokumen Kepemilikan Lahan", "Izin Pemanfaatan Tanah", "Gambar Batas Tanah", "Hasil Penyelidikan Tanah", "Siteplan Disetujui", "Andalalin", "Sartek Polres", "Sartek Bina Marga", "AMDAL / UKL-UPL", "Proteksi Kebakaran", "Peil Banjir", "Irigasi", "Intensitas Bangunan (KKPR/KRK)", "Perizinan Bangunan (IMB/PBG/SLF)", "Identitas Pemilik".
3. Ekstrak teks penting (Nomor Dokumen, Tanggal Terbit, Nama Pemilik/Pemohon).
4. Berikan abstraksi singkat isi dokumen.

Output WAJIB JSON murni:
{
  "category": "...",
  "subcategory": "...",
  "extracted_text": "...",
  "metadata": {
    "doc_no": "...",
    "date": "...",
    "owner": "..."
  }
}`;

  try {
    const rawResult = await callGeminiVision([fileData], prompt);
    const cleanJson = rawResult.replace(/```json/gi, '').replace(/```/g, '').trim();
    let parsedResult = JSON.parse(cleanJson);

    // Enhanced dengan Deep Reasoning jika tersedia
    if (useDeepReasoning) {
      try {
        const integration = getSmartAIIntegration();
        const enhancedResult = await integration.analyzeDocumentWithDeepReasoning(fileData);

        parsedResult = {
          ...parsedResult,
          ...enhancedResult,
          regulation_validated: true,
          deep_reasoning_enabled: true
        };
      } catch (e) {
        console.warn('[Document AI] Deep Reasoning gagal, menggunakan hasil standar:', e.message);
      }
    }

    return parsedResult;
  } catch (e) {
    console.error("[Document AI] Gagal:", e);
    throw e;
  }
}

/**
 * Menganalisis perbandingan antara beberapa dokumen (misal KRK vs Siteplan)
 * Enhanced dengan Deep Reasoning untuk analisis komparatif yang lebih mendalam
 */
export async function analyzeComparativeAudit(filesData, itemName, itemKode, context = '') {
  let useDeepReasoning = false;
  try {
    const integration = getSmartAIIntegration();
    if (integration && integration.isInitialized) {
      useDeepReasoning = true;
    }
  } catch (e) {
    // Fallback ke sistem lama
  }
  const prompt = `Anda adalah Senior Engineering Auditor untuk Sertifikat Laik Fungsi (SLF).
Tugas: Melakukan VALIDASI KOMPARATIF antara dokumen-dokumen rujukan yang dilampirkan untuk item: "${itemName}" (Kode: ${itemKode}).

KONTEKS TAMBAHAN: ${context}

INSTRUKSI DETAIL:
1. Identifikasi angka/parameter teknis pada Dokumen Legal (KRK/KKPR/PBG).
2. Identifikasi angka/parameter teknis pada Dokumen Fisik/Teknis (Siteplan/Denah/Gambar).
3. Bandingkan keduanya. Apakah ada deviasi? Apakah sesuai dengan standar PUPR?
4. Susun narasi profesional (ENGINEERING REASONING) dalam Bahasa Indonesia untuk dimasukkan ke Bab IV Laporan Teknis.

Output WAJIB JSON murni:
{
  "status": "baik|sedang|buruk|kritis",
  "catatan": "### ANALISIS KOMPARATIF BUKTI\\n\\n**A. Data Dokumen Legal:** ...\\n**B. Data Dokumen Teknis:** ...\\n**C. Hasil Verifikasi:** ...\\n\\nKesimpulan: ..."
}`;

  let providerChain = ['slf_opus', 'claude', 'gemini', 'openai'];
  let lastError = null;
  for (const provider of providerChain) {
    try {
      let aiResultText = "";
      if (provider === 'gemini') aiResultText = await callGeminiVision(filesData, prompt);
      else if (provider === 'openai' && MODELS.OPENAI.key) aiResultText = await callOpenAIVision(filesData, prompt);
      else if (provider === 'claude' && MODELS.CLAUDE.key) aiResultText = await callClaudeVision(filesData, prompt);
      else if (provider === 'slf_opus' && MODELS.SLF_OPUS.key) aiResultText = await callSLFOpusVision(filesData, systemPrompt);

      const raw = aiResultText.replace(/```json/gi, '').replace(/```/g, '').trim();
      let parsedResult = JSON.parse(raw);

      // Enhanced dengan Deep Reasoning jika tersedia
      if (useDeepReasoning) {
        try {
          const integration = getSmartAIIntegration();
          const enhancedResult = await integration.analyzeComparativeWithDeepReasoning(
            filesData,
            itemName,
            itemKode,
            context
          );

          parsedResult = {
            ...parsedResult,
            ...enhancedResult,
            comparative_analysis: enhancedResult.comparative_analysis || {},
            deep_reasoning_enabled: true
          };
        } catch (e) {
          console.warn('[Comparative AI] Deep Reasoning gagal, menggunakan hasil standar:', e.message);
        }
      }

      return parsedResult;
    } catch (error) {
      lastError = error;
    }
  }
  throw new Error(`Gagal melakukan komparasi AI: ${lastError?.message}`);
}

// ── IMPLEMENTASI PEMANGGILAN SPESIFIK PROVIDER ──────────────────

async function callGeminiVision(filesData, prompt) {
  if (!env.VITE_GEMINI_API_KEY) throw new Error("API Key Gemini hilang");
  const imageParts = filesData.map(file => ({
    inline_data: { mime_type: file.mimeType, data: file.base64 }
  }));

  const res = await fetch(MODELS.GEMINI.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }, ...imageParts] }],
      generationConfig: {
        temperature: 0.2
      }
    })
  });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
}

async function callOpenAIVision(filesData, prompt) {
  if (!MODELS.OPENAI.key) throw new Error("API Key OpenAI hilang");

  const contentArray = [{ type: "text", text: prompt }];
  filesData.forEach(file => {
    contentArray.push({
      type: "image_url",
      image_url: { url: `data:${file.mimeType};base64,${file.base64}` }
    });
  });

  const res = await fetch(MODELS.OPENAI.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${MODELS.OPENAI.key}`
    },
    body: JSON.stringify({
      model: MODELS.OPENAI.id,
      messages: [{ role: 'user', content: contentArray }],
      temperature: 0.2,
      max_tokens: 500
    })
  });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  return data.choices?.[0]?.message?.content || "{}";
}

async function callClaudeVision(filesData, prompt) {
  if (!MODELS.CLAUDE.key) throw new Error("API Key Claude hilang");

  const contentArray = [];
  filesData.forEach(file => {
    // Anthropic mengharapkan mimetype tanpa parameter ekstra
    const mime = file.mimeType.split(';')[0];
    contentArray.push({
      type: "image",
      source: {
        type: "base64",
        media_type: mime,
        data: file.base64
      }
    });
  });
  contentArray.push({ type: "text", text: prompt });

  const res = await fetch(MODELS.CLAUDE.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': MODELS.CLAUDE.key,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify({
      model: MODELS.CLAUDE.id,
      max_tokens: 1024,
      temperature: 0.2,
      messages: [{ role: 'user', content: contentArray }]
    })
  });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  return data.content?.[0]?.text || "{}";
}

async function callSLFOpusVision(filesData, systemPrompt) {
  const content = [{ type: "text", text: systemPrompt }];

  filesData.forEach(file => {
    content.push({
      type: "image_url",
      image_url: { url: `data:${file.mimeType};base64,${file.base64}` }
    });
  });

  const payload = {
    inputs: [{ role: "user", content: content }],
    parameters: { max_new_tokens: 1024, temperature: 0.1 }
  };

  const res = await fetch(MODELS.SLF_OPUS.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${MODELS.SLF_OPUS.key}`
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`SLF_OPUS Vision Error: ${errText.substring(0, 100)}`);
  }

  const data = await res.json();
  const text = Array.isArray(data) ? data[0].generated_text : (data.generated_text || "");

  // Bersihkan tag thought jika ada agar JSON parsing aman
  return text.replace(/<thought>[\s\S]*?<\/thought>/g, "").trim();
}
