// ============================================================
//  SIMULATION REPORT INTEGRATION SERVICE
//  Export hasil simulasi + visualisasi ke Google Drive & laporan
//  Integrasi dengan Google Apps Script untuk narasi otomatis
// ============================================================

import { exportSimulationVisuals } from './simulation-visualization.js';
import { saveSimulasi } from './simulation-engine.js';
import { supabase } from './supabase.js';

const GAS_WEBHOOK_URL = import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL || '';

/**
 * Export hasil simulasi lengkap ke Google Drive dan database
 * @param {string} proyekId - ID proyek
 * @param {string} tipe - Tipe simulasi
 * @param {Object} result - Hasil simulasi
 * @param {Object} options - Options
 */
export async function exportSimulationToReport(proyekId, tipe, result, options = {}) {
  const { saveToDrive = true, generateNarrative = true, folderId = null } = options;
  
  try {
    console.log('[SimReport] Starting export for', tipe);
    
    // 1. Generate visualisasi
    const visuals = await exportSimulationVisuals(tipe, result);
    
    // 2. Save ke database dengan referensi gambar
    const simulasiData = await saveSimulasi(proyekId, tipe, {}, {
      ...result,
      has_visualization: !!visuals.png,
      visualization_desc: visuals.metadata.description
    }, { status: 'final' });
    
    // 3. Upload ke Google Drive jika diaktifkan
    let driveFiles = null;
    if (saveToDrive && GAS_WEBHOOK_URL) {
      driveFiles = await uploadToDrive(proyekId, tipe, result, visuals, folderId);
    }
    
    // 4. Generate narasi AI jika diaktifkan
    let narrative = null;
    if (generateNarrative) {
      narrative = await generateSimulationNarrative(proyekId, tipe, result, visuals);
    }
    
    return {
      success: true,
      simulasiId: simulasiData.id,
      visuals,
      driveFiles,
      narrative,
      message: 'Simulasi berhasil diekspor ke laporan'
    };
    
  } catch (err) {
    console.error('[SimReport] Export failed:', err);
    throw err;
  }
}

/**
 * Upload hasil simulasi ke Google Drive via GAS
 */
async function uploadToDrive(proyekId, tipe, result, visuals, folderId) {
  try {
    const { data: proyek } = await supabase
      .from('proyek')
      .select('nama_bangunan, drive_proxy_url')
      .eq('id', proyekId)
      .single();
    
    const payload = {
      action: 'uploadSimulationResults',
      proyekId,
      proyekName: proyek?.nama_bangunan || 'Unknown',
      tipe,
      timestamp: new Date().toISOString(),
      data: {
        result,
        visualization: visuals.png,
        visualizationSvg: visuals.svg,
        metadata: visuals.metadata
      },
      folderId: folderId || proyek?.drive_proxy_url
    };
    
    const response = await fetch(GAS_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      throw new Error(`GAS upload failed: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Update database dengan Drive file IDs
    if (data.fileId) {
      await supabase
        .from('hasil_simulasi')
        .update({
          drive_file_id: data.fileId,
          drive_file_url: data.fileUrl,
          drive_folder_id: data.folderId
        })
        .eq('proyek_id', proyekId)
        .eq('tipe_simulasi', tipe)
        .order('created_at', { ascending: false })
        .limit(1);
    }
    
    return {
      fileId: data.fileId,
      fileUrl: data.fileUrl,
      folderId: data.folderId
    };
    
  } catch (err) {
    console.error('[SimReport] Drive upload failed:', err);
    // Don't throw - continue tanpa Drive upload
    return null;
  }
}

/**
 * Generate narasi AI untuk hasil simulasi
 * Menggunakan Gemini Hybrid Router (Flash untuk narasi cepat)
 */
async function generateSimulationNarrative(proyekId, tipe, result, visuals) {
  try {
    // Import AI router
    const { GEMINI_ROUTER } = await import('./ai-router.js');
    
    // Pilih model (Flash untuk narasi cepat)
    const selection = GEMINI_ROUTER.selectModel({ taskType: 'narrative', fastMode: true });
    
    // Prepare prompt
    const prompt = buildNarrativePrompt(tipe, result, visuals);
    
    // Call AI via edge function
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
        prompt: prompt,
        maxTokens: 2048
      })
    });
    
    if (!res.ok) throw new Error('AI narrative generation failed');
    
    const data = await res.json();
    const narrative = data.result;
    
    // Save narrative to database
    await supabase
      .from('hasil_simulasi')
      .update({ narrative_ai: narrative })
      .eq('proyek_id', proyekId)
      .eq('tipe_simulasi', tipe)
      .order('created_at', { ascending: false })
      .limit(1);
    
    return narrative;
    
  } catch (err) {
    console.error('[SimReport] Narrative generation failed:', err);
    return null;
  }
}

/**
 * Build narrative prompt untuk AI
 */
function buildNarrativePrompt(tipe, result, visuals) {
  const typeLabels = {
    'pencahayaan': 'Simulasi Pencahayaan Alami',
    'ventilasi': 'Simulasi Ventilasi',
    'evakuasi': 'Simulasi Jalur Evakuasi',
    'ndt_rebound': 'Uji NDT Rebound Hammer',
    'ndt_upv': 'Uji NDT Ultrasonic Pulse Velocity'
  };
  
  const basePrompt = `Anda adalah Insinyur Struktur dan AI Technical Writer untuk laporan SLF.
Buat narasi teknis profesional untuk ${typeLabels[tipe]} berdasarkan hasil berikut:

HASIL PERHITUNGAN:
${JSON.stringify(result, null, 2)}

DESKRIPSI VISUALISASI:
${visuals.metadata.description}

Format narasi yang diinginkan:
1. PENDAHULUAN (2-3 kalimat tentang tujuan simulasi)
2. METODOLOGI (singkat, metode perhitungan yang digunakan)
3. HASIL PERHITUNGAN (dengan angka spesifik dan satuan)
4. EVALUASI STANDAR (pembandingan dengan SNI yang relevan)
5. KESIMPULAN DAN REKOMENDASI

Gaya penulisan:
- Formal, teknis, sesuai standar pelaporan teknik Indonesia
- Gunakan rumus matematika jika relevan (format: $rumus$)
- Referensi SNI yang sesuai
- Panjang: 200-300 kata

Kembalikan HANYA narasi tanpa header tambahan.`;

  return basePrompt;
}

/**
 * Get semua hasil simulasi untuk report generation
 * @param {string} proyekId - ID proyek
 */
export async function getSimulationReportData(proyekId) {
  try {
    const { data: simulations, error } = await supabase
      .from('hasil_simulasi')
      .select('*')
      .eq('proyek_id', proyekId)
      .eq('status', 'final')
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    
    // Group by type
    const grouped = {
      pencahayaan: simulations?.filter(s => s.tipe_simulasi === 'pencahayaan') || [],
      ventilasi: simulations?.filter(s => s.tipe_simulasi === 'ventilasi') || [],
      evakuasi: simulations?.filter(s => s.tipe_simulasi === 'evakuasi') || [],
      ndt: simulations?.filter(s => s.tipe_simulasi?.startsWith('ndt_')) || []
    };
    
    // Count totals
    const summary = {
      total: simulations?.length || 0,
      hasVisualization: simulations?.some(s => s.drive_file_id) || false,
      hasNarrative: simulations?.some(s => s.narrative_ai) || false,
      types: Object.keys(grouped).filter(k => grouped[k].length > 0)
    };
    
    return {
      simulations,
      grouped,
      summary
    };
    
  } catch (err) {
    console.error('[SimReport] Failed to get report data:', err);
    throw err;
  }
}

/**
 * Generate bab simulasi lengkap untuk laporan SLF
 * @param {string} proyekId - ID proyek
 * @param {Object} options - Options
 */
export async function generateSimulationChapter(proyekId, options = {}) {
  const { format = 'html', includeVisuals = true } = options;
  
  try {
    const { simulations, grouped, summary } = await getSimulationReportData(proyekId);
    
    if (summary.total === 0) {
      return {
        hasContent: false,
        message: 'Belum ada simulasi yang dijalankan untuk proyek ini'
      };
    }
    
    // Build chapter content
    const chapter = {
      title: 'BAB VI: ANALISIS SIMULASI ENGINEERING',
      introduction: `Bab ini menyajikan hasil analisis simulasi engineering yang dilakukan untuk mengevaluasi kelaikan fungsi bangunan dari aspek pencahayaan, ventilasi, keselamatan evakuasi, dan kondisi struktur. Total ${summary.total} simulasi telah dijalankan menggunakan engine Pyodide dengan library SciPy dan NetworkX.`,
      sections: []
    };
    
    // Section per tipe
    if (grouped.pencahayaan.length > 0) {
      chapter.sections.push({
        title: '6.1 Simulasi Pencahayaan Alami',
        content: grouped.pencahayaan[0]?.narrative_ai || 'Hasil simulasi pencahayaan...',
        data: grouped.pencahayaan[0]?.hasil,
        visualUrl: grouped.pencahayaan[0]?.drive_file_url,
        sni: 'SNI 03-2396-2001'
      });
    }
    
    if (grouped.ventilasi.length > 0) {
      chapter.sections.push({
        title: '6.2 Simulasi Ventilasi',
        content: grouped.ventilasi[0]?.narrative_ai || 'Hasil simulasi ventilasi...',
        data: grouped.ventilasi[0]?.hasil,
        visualUrl: grouped.ventilasi[0]?.drive_file_url,
        sni: 'SNI 03-6572-2001'
      });
    }
    
    if (grouped.evakuasi.length > 0) {
      chapter.sections.push({
        title: '6.3 Simulasi Jalur Evakuasi',
        content: grouped.evakuasi[0]?.narrative_ai || 'Hasil simulasi evakuasi...',
        data: grouped.evakuasi[0]?.hasil,
        visualUrl: grouped.evakuasi[0]?.drive_file_url,
        sni: 'SNI 03-1736-2012'
      });
    }
    
    if (grouped.ndt.length > 0) {
      chapter.sections.push({
        title: '6.4 Uji NDT (Non-Destructive Test)',
        content: grouped.ndt.map(n => n.narrative_ai).join('\n\n') || 'Hasil uji NDT...',
        data: grouped.ndt.map(n => n.hasil),
        visualUrl: grouped.ndt[0]?.drive_file_url,
        sni: 'SNI 2847:2019'
      });
    }
    
    // Format output
    let formatted = '';
    if (format === 'html') {
      formatted = formatAsHTML(chapter);
    } else if (format === 'docx') {
      formatted = formatAsDocxJSON(chapter);
    } else if (format === 'markdown') {
      formatted = formatAsMarkdown(chapter);
    }
    
    return {
      hasContent: true,
      chapter,
      formatted,
      summary
    };
    
  } catch (err) {
    console.error('[SimReport] Chapter generation failed:', err);
    throw err;
  }
}

// Formatters
function formatAsHTML(chapter) {
  let html = `<div class="simulation-chapter">`;
  html += `<h1>${chapter.title}</h1>`;
  html += `<p class="introduction">${chapter.introduction}</p>`;
  
  chapter.sections.forEach(section => {
    html += `<section>`;
    html += `<h2>${section.title}</h2>`;
    html += `<div class="narrative">${section.content}</div>`;
    
    if (section.visualUrl) {
      html += `<figure>`;
      html += `<img src="${section.visualUrl}" alt="Visualisasi ${section.title}"/>`;
      html += `<figcaption>Gambar 6.${chapter.sections.indexOf(section) + 1}: Hasil ${section.title}</figcaption>`;
      html += `</figure>`;
    }
    
    html += `<p class="sni-reference"><strong>Standar:</strong> ${section.sni}</p>`;
    html += `</section>`;
  });
  
  html += `</div>`;
  return html;
}

function formatAsDocxJSON(chapter) {
  // Return struktur yang bisa di-convert ke DOCX
  return {
    type: 'chapter',
    title: chapter.title,
    children: [
      { type: 'paragraph', text: chapter.introduction },
      ...chapter.sections.flatMap(section => [
        { type: 'heading', level: 2, text: section.title },
        { type: 'paragraph', text: section.content },
        section.visualUrl ? { type: 'image', url: section.visualUrl, caption: `Gambar: ${section.title}` } : null,
        { type: 'paragraph', text: `Standar: ${section.sni}`, style: 'Reference' }
      ].filter(Boolean))
    ]
  };
}

function formatAsMarkdown(chapter) {
  let md = `# ${chapter.title}\n\n`;
  md += `${chapter.introduction}\n\n`;
  
  chapter.sections.forEach(section => {
    md += `## ${section.title}\n\n`;
    md += `${section.content}\n\n`;
    
    if (section.visualUrl) {
      md += `![${section.title}](${section.visualUrl})\n\n`;
    }
    
    md += `**Standar:** ${section.sni}\n\n`;
  });
  
  return md;
}

// Export all
export default {
  exportSimulationToReport,
  getSimulationReportData,
  generateSimulationChapter
};
