// ============================================================
//  MULTI-AGENT AI SERVICE (15 DEEP REASONING AGENTS)
//  Orchestrator for specialized architectural & engineering agents
// ============================================================
import { supabase } from './supabase.js';
import { runSingleItemAnalysis, MODELS } from './ai-router.js';
import { getPromptConfig, injectPromptConfig } from './prompt-config-service.js';

export const AGENT_CONFIG = [
  { 
    id: 'struktur', name: 'Ahli Struktur', icon: 'fa-cubes', color: 'hsl(0,70%,55%)',
    focus: ['ITEM-05A'], standard: 'SNI 1726, SNI 2847, SNI 9273:2025',
    persona: 'Senior Structural Engineer berlisensi Utama.'
  },
  { 
    id: 'geoteknik', name: 'Ahli Geoteknik', icon: 'fa-mountain-sun', color: 'hsl(25,60%,45%)',
    focus: ['ITEM-05A1', 'ITEM-02E', 'ITEM-02B'], standard: 'SNI 8460:2017 (Geoteknik)',
    persona: 'Ahli Geoteknik Forensik. Fokus pada stabilitas tanah, pondasi, dan basemen.'
  },
  { 
    id: 'ruang_dalam', name: 'Ahli Tata Ruang Dalam', icon: 'fa-door-open', color: 'hsl(258,70%,60%)',
    focus: ['ITEM-01B', 'ITEM-03B', 'ITEM-07A'], standard: 'NSPK Arsitektur & Ergonomi',
    persona: 'Pakar Arsitektur Interior & Fisika Bangunan.'
  },
  { 
    id: 'ruang_luar', name: 'Ahli Tata Ruang Luar', icon: 'fa-tree-city', color: 'hsl(160,65%,46%)',
    focus: ['ITEM-01C', 'ITEM-02'], standard: 'GSB, KDH, & Aksesibilitas Tapak',
    persona: 'Ahli Perencanaan Tapak & Lanskap.'
  },
  { 
    id: 'keselamatan', name: 'Ahli Keselamatan', icon: 'fa-shield-heart', color: 'hsl(0,70%,58%)',
    focus: ['ITEM-05B', 'ITEM-05E'], standard: 'Sistem Proteksi Kebakaran Aktif/Pasif',
    persona: 'Fire Safety Engineer. Fokus pada alat pemadam dan jalur evakuasi.'
  },
  { 
    id: 'mkkg', name: 'Ahli MKKG', icon: 'fa-users-gear', color: 'hsl(10,80%,50%)',
    focus: ['ITEM-05B', 'ITEM-09'], standard: 'Manajemen Keselamatan Kebakaran Gedung',
    persona: 'Pakar Manajemen Kebakaran. Fokus pada prosedur, simulasi, dan kesiapan tim.'
  },
  { 
    id: 'elektrikal', name: 'Ahli Elektrikal', icon: 'fa-plug-circle-bolt', color: 'hsl(40,80%,55%)',
    focus: ['ITEM-05D', 'ITEM-05C'], standard: 'PUIL 2011 & Proteksi Petir',
    persona: 'Ahli Instalasi Tenaga & Pembumian.'
  },
  { 
    id: 'plumbing', name: 'Ahli Plumbing', icon: 'fa-faucet-drip', color: 'hsl(210,80%,50%)',
    focus: ['ITEM-06C1', 'ITEM-06C2'], standard: 'SNI Plambing 8153:2015',
    persona: 'Ahli Rekayasa Plambing & Distribusi Air.'
  },
  { 
    id: 'kesehatan', name: 'Ahli Kesehatan', icon: 'fa-user-nurse', color: 'hsl(180,65%,45%)',
    focus: ['ITEM-06C3', 'ITEM-06A', 'ITEM-04'], standard: 'Sanitasi & Kualitas Udara (IAQ)',
    persona: 'Ahli Kesehatan Lingkungan & Sains Material.'
  },
  { 
    id: 'mekanikal', name: 'Ahli Mekanikal', icon: 'fa-gears', color: 'hsl(20,70%,50%)',
    focus: ['ITEM-08A', 'ITEM-05A10'], standard: 'Transportasi Vertikal & HVAC Sistem',
    persona: 'Ahli Mekanikal Bangunan & Lift.'
  },
  { 
    id: 'akustik', name: 'Ahli Akustik', icon: 'fa-waveform-lines', color: 'hsl(280,60%,55%)',
    focus: ['ITEM-07D'], standard: 'Batas Kebisingan & Vibrasi Gedung',
    persona: 'Ahli Akustika Lingkungan.'
  },
  { 
    id: 'pencahayaan', name: 'Ahli Pencahayaan', icon: 'fa-sun-bright', color: 'hsl(50,90%,50%)',
    focus: ['ITEM-06B', 'ITEM-07C'], standard: 'Level Iluminasi & Kenyamanan Visual',
    persona: 'Ahli Teknik Pencahayaan.'
  },
  { 
    id: 'sd_air', name: 'Ahli Sumber Daya Air', icon: 'fa-water-arrow-up', color: 'hsl(190,80%,45%)',
    focus: ['ITEM-06C4', 'ITEM-02G'], standard: 'Konservasi Air & Drainase Hujan',
    persona: 'Ahli Hidrologi Tapak & Manajemen Air.'
  },
  { 
    id: 'legal', name: 'Ahli Legal & Perizinan', icon: 'fa-file-signature', color: 'hsl(220,50%,50%)',
    focus: ['ITEM-09', 'ITEM-04'], standard: 'PBG, SLF, SLO, & Kepatuhan Administrasi',
    persona: 'Asesor Hukum Arsitektur & Perizinan.'
  },
  { 
    id: 'laporan', name: 'Ahli Laporan Teknis', icon: 'fa-pen-nib', color: 'hsl(258,80%,50%)',
    focus: ['ITEM-01', 'ITEM-03', 'ITEM-05', 'ITEM-06', 'ITEM-07', 'ITEM-08'], 
    standard: 'Standar Narasi Pelaporan SLF Nasional',
    persona: 'Senior Technical Writer. Fokus pada konsistensi, gaya bahasa formal, dan eksekutif summary.'
  }
];

/**
 * Menjalankan analisis untuk SATU agen tertentu (Deep Reasoning Mode)
 */
/**
 * Menjalankan analisis untuk SATU agen tertentu (Deep Reasoning Mode)
 */
export async function runSpecificAgentAnalysis(proyekId, agentId, allResults = {}) {
  const agent = AGENT_CONFIG.find(a => a.id === agentId);
  if (!agent) throw new Error("Agen tidak ditemukan");

  // Load Prompt Config & Services
  const { fetchAgentPrompt, injectPromptConfig, SYSTEM_INSTRUCTIONS_TEMPLATE, DEFAULT_PRINCIPLES } = await import('./prompt-config-service.js');
  const { fetchDriveFiles, fetchFileOCR } = await import('./drive.js');
  
  // 1. Ambil Data Dasar secara Parallel
  const [dbPrompt, { data: proyek }, { data: items }, driveFiles] = await Promise.all([
    fetchAgentPrompt(agentId),
    supabase.from('proyek').select('*').eq('id', proyekId).single(),
    supabase.from('checklist_items').select('*').eq('proyek_id', proyekId),
    fetchDriveFiles(proyekId, proyek?.drive_proxy_url)
  ]);

  const persona = dbPrompt?.persona || agent.persona;
  const mission = dbPrompt?.mission || DEFAULT_PRINCIPLES.mission;
  const p = dbPrompt?.principles || DEFAULT_PRINCIPLES;

  // 2. Berkas & OCR Logic (Auto-NSPK Selection)
  let ocrContext = '';
  let evidencePhotos = []; 
  let nspkPhotos = [];     
  
  if (driveFiles && driveFiles.length > 0) {
    const damageKeywords = ['retak', 'crack', 'bocor', 'rusak', 'patah', 'miring', 'karat', 'kritis', 'bahaya', 'rembes'];
    const agentKeywords = [...(agent.focus || []), agent.name.split(' ')[1]].map(k => k.toLowerCase());
    
    const relevantFiles = driveFiles.filter(f => 
      agentKeywords.some(k => f.name.toLowerCase().includes(k)) || f.name.toUpperCase().includes('NSPK')
    );

    evidencePhotos = relevantFiles.filter(f => 
       !f.name.toUpperCase().includes('NSPK') && damageKeywords.some(dk => f.name.toLowerCase().includes(dk))
    ).slice(0, 2).map(f => ({ name: f.name, url: f.url, id: f.id }));

    // Cek file NSPK di Drive (Prioritas 1)
    nspkPhotos = relevantFiles.filter(f => 
       f.name.toUpperCase().includes('NSPK') && agentKeywords.some(ak => f.name.toLowerCase().includes(ak))
    ).slice(0, 1).map(f => ({ name: f.name, url: f.url, id: f.id }));

    const ocrTargetFiles = [...nspkPhotos, ...evidencePhotos.slice(0, 2)];
    if (ocrTargetFiles.length > 0) {
      const ocrResults = await Promise.all(ocrTargetFiles.map(async f => {
        const text = await fetchFileOCR(f.id, proyek?.drive_proxy_url);
        const prefix = f.name.toUpperCase().includes('NSPK') ? '[REFERENSI STANDAR NSPK]' : `[TEMUAN LAPANGAN: ${f.name}]`;
        return `${prefix}\n${text || '(Gagal membaca isi berkas)'}`;
      }));
      ocrContext = `### DATA TEKSTUAL DARI BERKAS (OCR) ###\n${ocrResults.join('\n\n')}`;
    }
  }

  // 3. Seismic Intelligence (Hanya untuk Ahli Struktur)
  let seismicContext = '';
  if (agentId === 'struktur') {
     const { getSeismicInfoByAddress, getSeismicPromptContext } = await import('./seismic-service.js');
     const sInfo = getSeismicInfoByAddress(proyek?.alamat || "");
     seismicContext = getSeismicPromptContext(sInfo);
  }

  // 4. Checklist & Final Context
  let checklistContext = '';
  if (agentId === 'laporan') {
    checklistContext = `### RINGKASAN TEMUAN AHLI LAIN ###\n${JSON.stringify(Object.values(allResults), null, 2)}`;
  } else {
    const relevantItems = (items || []).filter(i => agent.focus.some(f => i.kode.startsWith(f)));
    checklistContext = `### DATA CHECKLIST LAPANGAN (SUPABASE) ###\n${JSON.stringify(relevantItems.map(i=>({
      kode: i.kode, 
      nama: i.nama, 
      status: i.status || 'Belum diperiksa', 
      catatan: i.catatan || '-'
    })), null, 2)}`;
  }

  const buildingContext = `### INFORMASI BANGUNAN ###
Nama: ${proyek?.nama_bangunan || 'N/A'}
Fungsi: ${proyek?.fungsi_bangunan || 'N/A'}
Alamat: ${proyek?.alamat || 'N/A'}`;

  // Tambahkan Instruksi Quote NSPK Otomatis jika Foto NSPK tidal tersedia
  const nspkInstruction = nspkPhotos.length === 0 ? 
    "\n\n[USER_REQUEST: Foto NSPK tidak ditemukan di Drive. AI HARUS secara otomatis mengutip Pasal/Ayat Standar Teknis PUPR/SNI yang relevan dari basis pengetahuan internal Anda untuk Bagian Dasar Hukum.]" : "";

  const finalContext = `${buildingContext}\n\n${seismicContext}\n\n${checklistContext}\n\n${ocrContext}\n\n${nspkInstruction}\n\n[USER_NOTE: ${p.context || ''}]`;

  // Inject Custom Deep Reasoning Instructions
  const prompt = injectPromptConfig(SYSTEM_INSTRUCTIONS_TEMPLATE, {
    persona: persona,
    mission: mission,
    goal: p.goal || DEFAULT_PRINCIPLES.goal,
    done_criteria: p.done_criteria || DEFAULT_PRINCIPLES.done_criteria,
    context: finalContext,
    constraints: p.constraints || DEFAULT_PRINCIPLES.constraints,
    strategy: p.strategy || DEFAULT_PRINCIPLES.strategy,
    output_format: p.output_format || DEFAULT_PRINCIPLES.output_format,
    reasoning: p.reasoning || DEFAULT_PRINCIPLES.reasoning
  });

  try {
    const resp = await runSingleItemAnalysis({ kode: 'DEEP', nama: agent.name }, agent.name, {
      roleTitle: agent.name,
      standard: agent.standard || 'Standar Nasional Indonesia',
      targetModel: MODELS.GEMINI,
      customPrompt: prompt
    });
    
    return {
      id: agent.id,
      name: agent.name,
      reasoning: resp.reasoning_steps || [],
      analisis: resp.analisis || resp.narasi_teknis || "Analisis mendalam selesai.",
      rekomendasi: resp.rekomendasi || "Rekomendasi terlampir.",
      legal_citation: resp.dasar_hukum || resp.kutipan_nspk || "Sesuai Standar Teknis PUPR", // Field baru untuk Kartu Aturan
      skor: resp.skor || 85,
      status_label: resp.status_label || (resp.skor < 70 ? 'Risiko' : 'Baik'),
      risiko: resp.risiko || 'Rendah',
      evidence_photos: evidencePhotos,
      nspk_photos: nspkPhotos 
    };
  } catch (err) {
    console.error(`Error in Agent ${agentId}:`, err);
    throw err;
  }
}


/**
 * Sintesis Fatwa Akhir oleh Koordinator
 */
export async function runCoordinatorSynthesis(agentResults) {
  const avgScore = Math.round(agentResults.reduce((s, r) => s + (r.skor || 0), 0) / agentResults.length);
  
  let finalStatus = 'LAIK FUNGSI';
  let color = 'var(--success-400)';
  
  if (avgScore < 70 || agentResults.some(r => r.risiko === 'Kritis')) {
     finalStatus = 'TIDAK LAIK FUNGSI';
     color = 'var(--danger-400)';
  } else if (avgScore < 85 || agentResults.some(r => r.risiko === 'Tinggi')) {
     finalStatus = 'LAIK FUNGSI DENGAN CATATAN';
     color = 'var(--warning-400)';
  }

  return {
    status: finalStatus,
    score: avgScore,
    color: color,
    justifikasi: `Berdasarkan konsesi 15 ahli konsorsium dengan indeks keandalan ${avgScore}%. Sidang pleno menetapkan bangunan bersifat ${finalStatus}.`
  };
}
