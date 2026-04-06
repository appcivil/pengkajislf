// ============================================================
//  OCR SERVICE - Fitur #7: OCR Teks & Tabel dengan Tesseract.js + pdf.js
//  Ekstrak teks dan tabel dari PDF/foto dokumen perizinan
// ============================================================

import { GEMINI_ROUTER } from './ai-router.js';

// Lazy load Tesseract.js
let Tesseract = null;

async function loadTesseract() {
  if (!Tesseract) {
    // Dynamic import untuk mengurangi bundle size awal
    const module = await import('https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.esm.min.js');
    Tesseract = module.default || module;
  }
  return Tesseract;
}

// OCR Configuration
const OCR_CONFIG = {
  language: 'ind',
  logger: (m) => {
    if (m.status === 'recognizing text') {
      console.log(`[OCR] Progress: ${(m.progress * 100).toFixed(1)}%`);
    }
  }
};

/**
 * Extract text from image using Tesseract.js
 * @param {string|File} imageSource - URL, base64, atau File object
 * @param {Object} options - OCR options
 */
export async function extractTextFromImage(imageSource, options = {}) {
  const tesseract = await loadTesseract();
  const config = { ...OCR_CONFIG, ...options };
  
  try {
    const result = await tesseract.recognize(imageSource, config.language, {
      logger: config.logger,
      errorHandler: (err) => console.error('[OCR] Error:', err)
    });

    return {
      success: true,
      text: result.data.text,
      confidence: result.data.confidence,
      words: result.data.words,
      lines: result.data.lines,
      paragraphs: result.data.paragraphs,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      text: '',
      confidence: 0
    };
  }
}

/**
 * Extract text from PDF using pdf.js + Tesseract.js untuk halaman ber-gambar
 * @param {ArrayBuffer|File} pdfSource - PDF file atau ArrayBuffer
 * @param {Object} options - Extraction options
 */
export async function extractTextFromPDF(pdfSource, options = {}) {
  const { extractImages = true, maxPages = 10, onProgress } = options;
  
  try {
    // Dynamic import pdf.js
    const pdfjsLib = await import('https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.189/+esm');
    
    // Set worker
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.189/build/pdf.worker.min.mjs';
    
    const arrayBuffer = pdfSource instanceof File ? await pdfSource.arrayBuffer() : pdfSource;
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    const numPages = Math.min(pdf.numPages, maxPages);
    const results = [];
    let fullText = '';
    
    for (let i = 1; i <= numPages; i++) {
      if (onProgress) onProgress(i, numPages, `Memproses halaman ${i}/${numPages}`);
      
      const page = await pdf.getPage(i);
      
      // Extract text content
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      fullText += pageText + '\n';
      
      const pageResult = {
        page: i,
        text: pageText,
        hasText: pageText.trim().length > 0,
        images: []
      };
      
      // Jika halaman sedikit teksnya, coba OCR gambar
      if (extractImages && pageText.trim().length < 100) {
        try {
          const scale = 2.0;
          const viewport = page.getViewport({ scale });
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          
          await page.render({ canvasContext: context, viewport }).promise;
          
          const imageData = canvas.toDataURL('image/png');
          const ocrResult = await extractTextFromImage(imageData);
          
          if (ocrResult.success && ocrResult.text.trim().length > 0) {
            pageResult.images.push({
              ocrText: ocrResult.text,
              confidence: ocrResult.confidence
            });
            fullText += ocrResult.text + '\n';
          }
        } catch (imgErr) {
          console.warn(`[PDF OCR] Gagal OCR gambar halaman ${i}:`, imgErr);
        }
      }
      
      results.push(pageResult);
      
      // Cleanup
      page.cleanup();
    }
    
    pdf.destroy();
    
    return {
      success: true,
      numPages: pdf.numPages,
      processedPages: numPages,
      fullText,
      pages: results,
      hasTables: detectTables(fullText)
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message,
      fullText: '',
      pages: []
    };
  }
}

/**
 * Parse dokumen IMB/PBG dari hasil OCR
 * Menggunakan AI untuk ekstrak field struktur
 */
export async function parseIMBDocument(ocrText, useGemini = true) {
  const fields = {
    nomor_imb: /(?:IMB|PBG|Nomor|No\.?)\s*[:\-]?\s*([A-Z0-9\-/]+)/i,
    nama_pemilik: /(?:Pemilik|Atas Nama|Nama)\s*[:\-]?\s*([A-Z][a-zA-Z\s\.]+)/,
    alamat: /(?:Alamat|Lokasi|Jalan)\s*[:\-]?\s*([^\n]+)/i,
    luas_tanah: /(?:Luas Tanah|LT)\s*[:\-]?\s*(\d+[\.,]?\d*)\s*m?²?/i,
    luas_bangunan: /(?:Luas Bangunan|LB)\s*[:\-]?\s*(\d+[\.,]?\d*)\s*m?²?/i,
    jumlah_lantai: /(?:Lantai|Jumlah Lantai)\s*[:\-]?\s*(\d+)/i,
    fungsi_bangunan: /(?:Fungsi|Jenis Bangunan)\s*[:\-]?\s*([^\n]+)/i,
    gsb: /GSB\s*[:\-]?\s*(\d+[\.,]?\d*)/i,
    kdb: /KDB\s*[:\-]?\s*(\d+[\.,]?\d*)/i,
    klb: /KLB\s*[:\-]?\s*(\d+[\.,]?\d*)/i,
    kdh: /KDH\s*[:\-]?\s*(\d+[\.,]?\d*)/i,
  };
  
  const extracted = {};
  
  // Regex extraction
  for (const [field, pattern] of Object.entries(fields)) {
    const match = ocrText.match(pattern);
    if (match) {
      extracted[field] = match[1].trim();
    }
  }
  
  // AI enhancement dengan Gemini Flash (hemat quota)
  if (useGemini && ocrText.length > 50) {
    try {
      const prompt = `
Anda adalah AI Data Entry untuk dokumen perizinan bangunan Indonesia (IMB/PBG/SLF).
Ekstrak informasi berikut dari teks OCR berikut:

TEKS OCR:
${ocrText.substring(0, 2000)}

Field yang perlu diekstrak:
- nomor_pbg/imb
- nama_pemilik
- alamat_lengkap
- luas_tanah (m²)
- luas_bangunan (m²)
- jumlah_lantai
- fungsi_bangunan
- gsb, kdb, klb, kdh (intensitas teknis)
- tahun_terbit

Output JSON:
{
  "nomor_pbg": "...",
  "nama_pemilik": "...",
  "alamat": "...",
  "luas_tanah": 0,
  "luas_bangunan": 0,
  "jumlah_lantai": 0,
  "fungsi_bangunan": "...",
  "gsb": 0,
  "kdb": 0,
  "klb": 0,
  "kdh": 0,
  "tahun_terbit": 0
}

PENTING: Kembalikan HANYA JSON valid tanpa markdown.`;

      const selection = GEMINI_ROUTER.selectModel({ taskType: 'ocr', fastMode: true });
      
      // Call AI via edge function atau direct
      const { supabase } = await import('./supabase.js');
      const session = await supabase.auth.getSession();
      const token = session.data?.session?.access_token;
      
      const res = await fetch('/functions/v1/ai-proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          provider: 'gemini',
          model: selection.model.id,
          prompt: prompt
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        const aiExtracted = JSON.parse(data.result || '{}');
        
        // Merge dengan regex results (AI lebih dipercaya)
        Object.assign(extracted, aiExtracted);
      }
    } catch (aiErr) {
      console.warn('[OCR] AI enhancement failed:', aiErr);
    }
  }
  
  return {
    raw: extracted,
    confidence: calculateExtractionConfidence(extracted),
    isComplete: checkCompleteness(extracted)
  };
}

/**
 * Parse tabel dari PDF text
 * @param {string} text - Teks hasil OCR dari PDF
 * @returns {Array} Array of table rows
 */
export function parsePDFTables(text) {
  const lines = text.split('\n').filter(line => line.trim());
  const tables = [];
  let currentTable = [];
  
  for (const line of lines) {
    // Deteksi baris tabel: memiliki angka/tab/spasi berturut-turut
    const isTableRow = /(\d+\.?\s+)|(\t)|(\s{3,})/.test(line) || 
                       line.includes('|') ||
                       line.match(/\d+\.\d+/);
    
    if (isTableRow) {
      // Parse kolom dari baris
      const columns = line.split(/\t|\s{3,}|\|/)
        .map(c => c.trim())
        .filter(c => c.length > 0);
      
      if (columns.length >= 2) {
        currentTable.push(columns);
      }
    } else if (currentTable.length > 0) {
      // End of current table
      if (currentTable.length >= 2) {
        tables.push([...currentTable]);
      }
      currentTable = [];
    }
  }
  
  // Don't miss last table
  if (currentTable.length >= 2) {
    tables.push(currentTable);
  }
  
  return tables;
}

/**
 * Detect tables dalam teks
 */
function detectTables(text) {
  // Pattern untuk tabel (baris dengan multiple numbers/spaces)
  const tablePattern = /(\d+\s+[\d\.]+\s+.*\n?)+/g;
  const matches = text.match(tablePattern);
  return matches ? matches.length > 0 : false;
}

/**
 * Calculate confidence berdasarkan field yang terisi
 */
function calculateExtractionConfidence(extracted) {
  const criticalFields = ['nomor_pbg', 'nama_pemilik', 'alamat', 'luas_bangunan'];
  const filled = criticalFields.filter(f => extracted[f] && extracted[f].toString().trim() !== '');
  return Math.round((filled.length / criticalFields.length) * 100);
}

/**
 * Check apakah data sudah lengkap
 */
function checkCompleteness(extracted) {
  const required = ['nomor_pbg', 'nama_pemilik', 'alamat', 'luas_bangunan', 'fungsi_bangunan'];
  return required.every(f => extracted[f] && extracted[f].toString().trim() !== '');
}

/**
 * Batch process multiple documents
 */
export async function batchOCRProcess(files, onProgress) {
  const results = [];
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (onProgress) onProgress(i + 1, files.length, `Memproses ${file.name}...`);
    
    try {
      let result;
      if (file.type === 'application/pdf') {
        result = await extractTextFromPDF(file);
      } else if (file.type.startsWith('image/')) {
        result = await extractTextFromImage(file);
      } else {
        result = { success: false, error: 'Format tidak didukung' };
      }
      
      // Parse jika dokumen perizinan
      if (result.success && result.fullText) {
        result.parsed = await parseIMBDocument(result.fullText);
      }
      
      results.push({
        filename: file.name,
        type: file.type,
        ...result
      });
      
    } catch (err) {
      results.push({
        filename: file.name,
        type: file.type,
        success: false,
        error: err.message
      });
    }
  }
  
  return results;
}

/**
 * UI Component untuk OCR Upload
 */
export function createOCRUploadButton(onResult) {
  const container = document.createElement('div');
  container.className = 'ocr-upload-container';
  container.innerHTML = `
    <input type="file" id="ocr-input" accept=".pdf,.png,.jpg,.jpeg" multiple style="display:none">
    <button class="btn btn-secondary" id="ocr-btn">
      <i class="fas fa-file-import"></i> OCR Dokumen
    </button>
    <div class="ocr-status" style="margin-top:8px;font-size:12px;color:var(--text-tertiary)"></div>
  `;
  
  const input = container.querySelector('#ocr-input');
  const btn = container.querySelector('#ocr-btn');
  const status = container.querySelector('.ocr-status');
  
  btn.addEventListener('click', () => input.click());
  
  input.addEventListener('change', async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    btn.disabled = true;
    status.textContent = `Memproses ${files.length} dokumen...`;
    
    const results = await batchOCRProcess(files, (current, total, msg) => {
      status.textContent = msg;
    });
    
    btn.disabled = false;
    status.textContent = `Selesai: ${results.filter(r => r.success).length}/${files.length} dokumen`;
    
    if (onResult) onResult(results);
  });
  
  return container;
}

// Export semua fungsi
export default {
  extractTextFromImage,
  extractTextFromPDF,
  parsePDFTables,
  parseIMBDocument,
  batchOCRProcess,
  createOCRUploadButton
};
