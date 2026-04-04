/**
 * AI WORKSPACE SERVICE
 * Mocked intelligence layer for the Engineering Workspace.
 * Integrated with the document metadata.
 */
import { MODELS, fetchOpenRouter, parseAIJson } from '../lib/ai-router.js';
import { PROYEK_AI_TEMPLATES } from '../application/ai-templates/ProyekAI.js';

const OPENROUTER_MODEL = MODELS.OPENROUTER;

export async function analyzeDocumentIntelligence(fileId) {
    // 1. Fetch file record
    const { data: file } = await supabase.from('proyek_files').select('*').eq('id', fileId).single();
    if (!file) return null;

    console.log(`[AI] Analyzing file with OpenRouter: ${file.name}`);

    // 2. AI Prompt for Classification & Summarization
    // 2. AI Prompt for Classification & Summarization (Centralized Template)
    const prompt = PROYEK_AI_TEMPLATES.DOCUMENT_ANALYSIS(file.name, file.category);

    let aiResult;
    try {
       const respText = await fetchOpenRouter(OPENROUTER_MODEL, prompt);
       aiResult = parseAIJson(respText);
    } catch (err) {
       console.error("[AI] OpenRouter failed, using fallback mock", err);
       aiResult = {
         category: file.category || 'umum',
         subcategory: 'Dokumen Teknik',
         ai_summary: `File ${file.name} telah diunggah. Analisis AI tertunda atau gagal terhubung ke OpenRouter.`,
         completeness: 50,
         status: 'In Review'
       };
    }

    const aiData = {
        ai_status: 'ready',
        category: aiResult.category || file.category,
        subcategory: aiResult.subcategory || file.subcategory,
        ai_summary: aiResult.ai_summary,
        completeness: aiResult.completeness || 0,
        status: aiResult.status || 'Draft',
        metadata: {
            ...(file.metadata || {}),
            ai_last_run: new Date().toISOString(),
            provider: 'OpenRouter-Gemini'
        }
    };

    // 3. Persist back to DB
    const { error } = await supabase.from('proyek_files').update(aiData).eq('id', fileId);
    if (error) throw error;

    return aiData;
}

function generateMockSummary(name, type) {
    const intros = [
        "Dokumen ini berisi",
        "Analisis menunjukkan bahwa file ini adalah",
        "Hasil pemindaian mengidentifikasi"
    ];
    const details = [
        `laporan teknis untuk bagian ${type || 'umum'}.`,
        `perhitungan struktur yang mencakup parameter beban gempa SNI 1726.`,
        `gambar arsitektur detail yang memenuhi standar kelaikan fungsi.`
    ];
    const conclusion = [
        "Data terlihat konsisten dengan standar yang berlaku.",
        "Ditemukan beberapa kekurangan minor pada lampiran tanda tangan.",
        "Dokumen siap untuk tahap verifikasi akhir."
    ];

    return `${intros[Math.floor(Math.random() * intros.length)]} ${details[Math.floor(Math.random() * details.length)]} ${conclusion[Math.floor(Math.random() * conclusion.length)]}`;
}

function determineStatus(name) {
    if (name.toLowerCase().includes('final')) return 'Final';
    if (name.toLowerCase().includes('rev')) return 'In Review';
    return 'Draft';
}

export async function validateProjectCompleteness(proyekId) {
    // Check all required files for a project
    const { data: files } = await supabase.from('proyek_files').select('category, subcategory, completeness').eq('proyek_id', proyekId);
    
    const required = {
      'umum': ['Data Umum', 'Data Penyedia Jasa', 'Laporan Pemeriksaan SLF'],
      'tanah': ['Sertifikat Tanah', 'Hasil Penyelidikan Tanah'],
      'arsitektur': ['Gambar Denah', 'Gambar Tampak', 'Gambar Potongan'],
      'struktur': ['Perhitungan Struktur', 'Gambar Detail Struktur'],
      'mep': ['Gambar MEP', 'Laporan MEP'],
      'lapangan': ['Foto Lapangan', 'Hasil Uji Lab']
    };

    const audit = {
       score: 0,
       missing: [],
       details: []
    };

    let totalPoints = 0;
    let earnedPoints = 0;

    Object.keys(required).forEach(cat => {
       required[cat].forEach(sub => {
          totalPoints += 100;
          const found = files.find(f => f.category === cat && f.subcategory && f.subcategory.toLowerCase().includes(sub.toLowerCase()));
          if (found) {
             earnedPoints += found.completeness || 100;
             audit.details.push({ cat, sub, status: 'Ada', score: found.completeness });
          } else {
             audit.missing.push(`${cat}: ${sub}`);
             audit.details.push({ cat, sub, status: 'Missing', score: 0 });
          }
       });
    });

    audit.score = Math.round((earnedPoints / totalPoints) * 100);
    return audit;
}
