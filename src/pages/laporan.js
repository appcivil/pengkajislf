// ============================================================
//  LAPORAN PAGE — Professional Report Preview & Export
//  Fitur Utama: Integrasi Template Google Docs (Baru)
//  Fitur Fallback: Preview Lokal HTML & Export Legacy
//  Standard: PUPR 
// ============================================================
import { supabase } from '../lib/supabase.js';
import { navigate } from '../lib/router.js';
import { logActivity } from '../lib/audit-service.js';
import { showSuccess, showError, showInfo } from '../components/toast.js';
import { marked } from 'marked';
import { generateDocx, generateDocxBlob } from '../lib/docx-service.js';
import { generatePDF } from '../lib/pdf-service.js';
import { parseNarasiAI, renderToHTML } from '../lib/report-formatter.js';
import { getSettings } from '../lib/settings.js';

import {
  generateFromTemplate,
  updateExistingDoc,
  getGoogleDocsEmbedUrl,
  getGoogleDocsEditUrl,
  getGoogleDocsExportDocxUrl,
  getGoogleDocsExportPdfUrl,
  getCachedDocId,
  checkGoogleIntegration,
  cacheDocId,
  clearCachedDocId
} from '../lib/gdocs-template-service.js';

export async function laporanPage(params = {}) {
  const id = params.id;
  if (!id) { navigate('proyek'); return ''; }

  const root = document.getElementById('page-root');
  if (root) root.innerHTML = renderSkeleton();

  const [proyek, analisis, checklist, settings, starredPhotos] = await Promise.all([
    fetchProyek(id),
    fetchLastAnalisis(id),
    fetchChecklist(id),
    getSettings(),
    fetchStarredPhotos(id)
  ]);

  if (!proyek) { navigate('proyek'); showError('Proyek tidak ditemukan.'); return ''; }
  
  window._reportPhotos = starredPhotos;

  const gdocStatus = await checkGoogleIntegration();
  const cachedDoc = getCachedDocId(id);

  const html = buildHtml(proyek, analisis, checklist, settings, gdocStatus, cachedDoc);
  if (root) {
    root.innerHTML = html;
    initLaporanActions(proyek, analisis, checklist, settings, gdocStatus, cachedDoc);
    initExportDropdown();
  }
  return html;
}

function buildHtml(proyek, analisis, checklist, settings, gdocStatus, cachedDoc) {
  if (!analisis) {
    return `
      <div class="page-container flex-center">
        <div class="card" style="text-align:center;padding:var(--space-12);max-width:500px">
          <div style="width:70px;height:70px;background:var(--gradient-brand);border-radius:var(--radius-xl);display:flex;align-items:center;justify-content:center;margin:0 auto var(--space-5);font-size:1.8rem;color:white">
            <i class="fas fa-file-contract"></i>
          </div>
          <h3 style="font-size:1.1rem;font-weight:700;margin-bottom:var(--space-2)">Laporan Belum Tersedia</h3>
          <p style="color:var(--text-secondary);margin:0 auto var(--space-6)">
            Laporan SLF baru dapat di-generate setelah Anda melengkapi checklist dan melakukan Analisis AI.
          </p>
          <button class="btn btn-primary" onclick="window.navigate('analisis',{id:'${proyek.id}'})">
            <i class="fas fa-brain"></i> Buka Halaman Analisis
          </button>
        </div>
      </div>
    `;
  }

  return `
    <div id="laporan-page">
      <!-- Action Bar (No Print) -->
      <div class="page-header no-print" style="margin-bottom:var(--space-4)">
        <div class="flex-between">
          <div>
            <button class="btn btn-ghost btn-sm" onclick="window.navigate('proyek-detail',{id:'${proyek.id}'})" style="margin-bottom:8px">
              <i class="fas fa-arrow-left"></i> ${escHtml(proyek.nama_bangunan)}
            </button>
            <h1 class="page-title">Penyusunan Laporan SLF</h1>
            <div style="display:flex; align-items:center; gap:12px">
              <p class="page-subtitle">Sistem otomatisasi penyusunan laporan berbasis template.</p>
              <div class="trust-seal-mini" style="background:#f0fdf4; color:#166534; border:1px solid #bbf7d0; padding:2px 10px; border-radius:100px; font-size:10px; font-weight:800; display:flex; align-items:center; gap:5px">
                <i class="fas fa-certificate"></i> TTE AKTIF
              </div>
            </div>
          </div>
        </div>
        
        <!-- Tabs -->
        <div class="tabs-container" style="margin-top:var(--space-5);margin-bottom:0">
          <div class="tab-item active" onclick="window._switchContentTab('tab-gdocs', this)" id="nav-tab-gdocs">
            <i class="fas fa-file-word"></i> Editor Cerdas (Template Google Docs)
          </div>
          <div class="tab-item" onclick="window._switchContentTab('tab-legacy', this)" id="nav-tab-legacy">
            <i class="fas fa-desktop"></i> Preview Lokal (Legacy)
          </div>
        </div>
      </div>

      <!-- Export Progress Modal -->
      <div class="export-progress-overlay" id="export-progress-overlay" style="display:none">
        <div class="export-progress-modal card">
          <div class="export-progress-icon">
            <i class="fas fa-circle-notch fa-spin" id="export-progress-icon-i" style="font-size:2.5rem;color:var(--brand-400)"></i>
          </div>
          <h3 id="export-progress-title" style="margin-top:16px;margin-bottom:8px">Mengeksport Dokumen...</h3>
          <p id="export-progress-msg" style="color:var(--text-secondary);font-size:0.85rem;margin-bottom:var(--space-4)">Menyiapkan integrasi...</p>
          <div class="export-progress-bar" style="width:100%;height:8px;background:var(--bg-elevated);border-radius:4px;overflow:hidden">
            <div class="export-progress-fill" id="export-progress-fill" style="width:0%;height:100%;background:var(--gradient-brand);transition:width 0.3s ease"></div>
          </div>
          <div id="export-progress-pct" style="font-size:0.85rem;font-weight:600;color:var(--text-primary);margin-top:var(--space-2);text-align:right">0%</div>
        </div>
      </div>

      <!-- TAB 1: GOOGLE DOCS EDITOR -->
      <div id="tab-gdocs" class="tab-content active" style="padding:0">
        ${renderGDocsTab(proyek, gdocStatus, cachedDoc)}
      </div>

      <!-- TAB 2: PREVIEW LOKAL (LEGACY) -->
      <div id="tab-legacy" class="tab-content" style="padding:0">
        ${renderLegacyTab(proyek, analisis, checklist, settings)}
      </div>

    </div>
  `;
}

function renderGDocsTab(proyek, gdocStatus, cachedDoc) {
  // Scenario 1: GAS / Template missing from settings
  if (!gdocStatus.ready) {
    return `
      <div class="card" style="text-align:center;padding:var(--space-12)">
        <div style="width:70px;height:70px;background:#fff1f2;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto var(--space-4);font-size:1.8rem;color:#e11d48">
          <i class="fas fa-plug-circle-xmark"></i>
        </div>
        <h3 style="font-size:1.2rem;font-weight:700;margin-bottom:8px">Integrasi Google Docs Belum Siap</h3>
        <p style="color:var(--text-secondary);max-width:500px;margin:0 auto var(--space-6);line-height:1.6">
          ${escHtml(gdocStatus.message)}<br>
          Silakan lengkapi konfigurasi Google Apps Script dan ID Template Master di halaman Pengaturan.
        </p>
        <button class="btn btn-outline" onclick="window.navigate('settings')">
          <i class="fas fa-sliders"></i> Buka Pengaturan
        </button>
      </div>
    `;
  }

  // Scenario 2: Laporan belum di-generate
  if (!cachedDoc) {
    return `
      <div class="card" style="text-align:center;padding:var(--space-10)">
        <div style="width:80px;height:80px;background:#f0f9ff;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto var(--space-4);font-size:2rem;color:var(--brand-400)">
          <i class="fas fa-wand-magic-sparkles"></i>
        </div>
        <h3 style="font-size:1.3rem;font-weight:700;margin-bottom:12px">Buat Laporan dari Template</h3>
        <p style="color:var(--text-secondary);max-width:600px;margin:0 auto var(--space-6);line-height:1.6">
          Sistem akan membuat salinan dokumen master dan mengisi seluruh data proyek, checklist, dan analisis AI secara otomatis.
        </p>
        <button class="btn btn-primary btn-lg" onclick="window._generateGDoc()" id="btn-generate-gdoc">
          <i class="fas fa-file-signature" style="margin-right:8px"></i> Generate Dokumen Laporan
        </button>
      </div>
    `;
  }

  // Scenario 3: Laporan sudah ada
  const docId = cachedDoc.docId;
  const embedUrl = getGoogleDocsEmbedUrl(docId);
  const editUrl = getGoogleDocsEditUrl(docId);
  
  return `
    <div style="display:grid;grid-template-columns:1fr;gap:var(--space-4)">
      
      <!-- Laporan Action Bar -->
      <div class="card" style="display:flex;justify-content:space-between;align-items:center;padding:12px 20px;margin-bottom:0">
        <div style="display:flex;align-items:center;gap:12px">
          <div style="width:40px;height:40px;background:rgba(59,130,246,0.1);border-radius:8px;display:flex;align-items:center;justify-content:center;color:#2563eb;font-size:1.2rem">
            <i class="fas fa-file-word"></i>
          </div>
          <div>
            <div style="font-weight:700;color:var(--text-primary)">Laporan SLF Aktif</div>
            <div style="font-size:0.75rem;color:var(--text-secondary)">Dibuat: ${formatTanggalwTime(cachedDoc.generatedAt)}</div>
          </div>
        </div>
        
        <div style="display:flex;gap:12px">
          <button class="btn btn-outline btn-sm" onclick="window._reGenerateGDoc()" id="btn-re-generate">
            <i class="fas fa-rotate"></i> Sinkronisasi Ulang Data
          </button>
          
          <button class="btn btn-outline btn-sm" onclick="window.open('${editUrl}','_blank')">
            <i class="fas fa-external-link-alt"></i> Buka Editor Teks Penuh
          </button>
          
          <div class="export-dropdown" id="dropdown-gdocs-export">
            <button class="btn btn-primary btn-sm" onclick="window._toggleGDocsExport()">
              <i class="fas fa-download"></i> Download Hasil
              <i class="fas fa-chevron-down" style="font-size:0.7rem;margin-left:4px"></i>
            </button>
            <div class="export-dropdown-menu" id="menu-gdocs-export" style="right:0">
              <button class="export-option" onclick="window._downloadGDocsWord('${docId}')">
                <div class="export-option-icon" style="background:hsla(220,80%,55%,0.15);color:hsl(220,80%,55%)"><i class="fas fa-file-word"></i></div>
                <div><div class="export-option-title">Microsoft Word</div><div class="export-option-desc">Export final .docx</div></div>
              </button>
              <button class="export-option" onclick="window._downloadGDocsPdf('${docId}')">
                <div class="export-option-icon" style="background:hsla(0,74%,52%,0.15);color:hsl(0,74%,52%)"><i class="fas fa-file-pdf"></i></div>
                <div><div class="export-option-title">PDF Document</div><div class="export-option-desc">Export final .pdf siap cetak</div></div>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Editor Iframe -->
      <div class="card" style="padding:0;overflow:hidden;border:1px solid var(--border-subtle);height:75vh;position:relative">
         <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:var(--text-tertiary);display:flex;flex-direction:column;align-items:center;gap:12px;z-index:0">
           <i class="fas fa-circle-notch fa-spin" style="font-size:2rem"></i>
           <span>Memuat Google Docs...</span>
         </div>
         <iframe src="${embedUrl}" style="width:100%;height:100%;border:none;position:relative;z-index:1;background:transparent"></iframe>
      </div>
    </div>
  `;
}

// =========================================================================
// RENDER LEGACY PREVIEW (Kode Laporan.js yg asli namun dengan perampingan)
// =========================================================================

function renderLegacyTab(proyek, analisis, checklist, settings) {
  const sections = [
    { id: 'cover', icon: 'fa-book', label: 'Cover Laporan' },
    { id: 'bab1', icon: 'fa-building', label: 'Bab I: Gambaran' },
    { id: 'bab2', icon: 'fa-search', label: 'Bab II: Metodologi' },
    { id: 'bab3', icon: 'fa-clipboard-check', label: 'Bab III: Checklist' },
    { id: 'bab4', icon: 'fa-brain', label: 'Bab IV: Analisis AI' },
    { id: 'bab5', icon: 'fa-certificate', label: 'Bab V: Kesimpulan' },
    { id: 'bab6', icon: 'fa-list-check', label: 'Bab VI: Rekomendasi' },
  ];

  return `
    <div class="laporan-wrap">
      <!-- Left: Nav (No Print) -->
      <div class="no-print" style="position:relative">
        
        <!-- Legacy Action Box -->
        <div class="card no-print" style="margin-bottom:var(--space-4);padding:var(--space-4)">
          <div style="font-size:0.75rem;font-weight:700;color:var(--text-tertiary);text-transform:uppercase;margin-bottom:12px">Legacy Export Engine</div>
          
          <div style="display:flex;flex-direction:column;gap:8px">
            <button class="btn btn-outline btn-sm" onclick="window._downloadWord()" style="width:100%;justify-content:center">
              <i class="fas fa-file-word"></i> Word (.docx) Lokal
            </button>
            <button class="btn btn-outline btn-sm" onclick="window._downloadPDF()" style="width:100%;justify-content:center">
              <i class="fas fa-file-pdf"></i> PDF Lokal
            </button>
            <button class="btn btn-outline btn-sm" onclick="window._printReport()" style="width:100%;justify-content:center">
              <i class="fas fa-print"></i> Cetak Browser
            </button>
          </div>
          <p class="text-xs text-secondary mt-3">
            Gunakan mode Legacy ini jika Anda offline atau tidak menggunakan integrasi Google Docs.
          </p>
        </div>

        <div class="laporan-nav pt-0 mt-0">
          <div style="font-size:0.75rem;font-weight:700;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:var(--space-2)">Struktur Laporan</div>
          <div style="display:flex;flex-direction:column;gap:4px">
            ${sections.map((s, i) => `
              <a href="javascript:void(0)" class="laporan-nav-item ${i===0?'active':''}" 
                 onclick="document.querySelectorAll('.laporan-nav-item').forEach(el=>el.classList.remove('active')); this.classList.add('active'); document.getElementById('lap-${s.id}').scrollIntoView({ behavior: 'smooth', block: 'start' });">
                <i class="fas ${s.icon} shrink-0" style="width:20px;text-align:center"></i>
                <span class="truncate">${s.label}</span>
              </a>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- Right: Content (Printable) -->
      <div class="laporan-content" id="print-area">
        
        <!-- COVER -->
        <div id="lap-cover" class="laporan-cover" style="min-height:297mm;display:flex;flex-direction:column;justify-content:center">
          <div style="font-size:1.2rem;opacity:0.9;margin-bottom:24px;text-transform:uppercase;letter-spacing:2px">Laporan Kajian Teknis</div>
          <h1 style="font-size:2.8rem;line-height:1.2;margin-bottom:32px;text-shadow:0 4px 12px rgba(0,0,0,0.3)">Sertifikat Laik Fungsi<br>(SLF) Bangunan Gedung</h1>
          
          <div style="background:rgba(255,255,255,0.1);backdrop-filter:blur(8px);border-radius:16px;padding:32px;margin:0 auto 48px;max-width:500px;border:1px solid rgba(255,255,255,0.2)">
            <h2 style="font-size:1.4rem;margin-bottom:12px;border:none;padding:0">${escHtml(proyek.nama_bangunan)}</h2>
            <p style="font-size:1rem;margin:0;opacity:0.9">${escHtml(proyek.alamat)}, ${escHtml(proyek.kota || '')}</p>
          </div>

          <div style="margin-top:auto;padding-top:60px">
            <p style="font-size:1.1rem;margin-bottom:8px">Diajukan oleh:</p>
            <p style="font-size:1.3rem;font-weight:700;margin-bottom:32px">${escHtml(proyek.pemilik)}</p>
            
            <div style="width:60px;height:4px;background:rgba(255,255,255,0.3);margin:0 auto 24px;border-radius:2px"></div>
            <p style="font-size:1rem;opacity:0.8">${formatTanggalwTime(new Date())}</p>
            <div style="margin-top:40px;padding-top:20px;border-top:1px solid rgba(255,255,255,0.1)">
              <p style="font-size:0.85rem;opacity:0.7;margin-bottom:8px">Disusun Oleh:</p>
              <p style="font-size:1.1rem;font-weight:700">${escHtml(settings.consultant.name)}</p>
            </div>
          </div>
        </div>

        <!-- BAB I: GAMBARAN UMUM -->
        <div id="lap-bab1" class="laporan-section pdf-page-break" style="page-break-before:always">
          <h2>BAB I: Gambaran Umum Bangunan</h2>
          <h3>1.1. Latar Belakang</h3>
          <p>Penilaian kelaikan fungsi bangunan gedung merupakan kewajiban yang diamanatkan dalam PP No. 16 Tahun 2021 tentang Peraturan Pelaksanaan UU No. 28/2002 tentang Bangunan Gedung. Penilaian ini bertujuan untuk memastikan bahwa bangunan gedung memenuhi persyaratan teknis.</p>

          <h3>1.3. Data Umum Bangunan</h3>
          <table>
            <tbody>
              <tr><td style="width:30%;font-weight:600">Nama Bangunan</td><td><b>${escHtml(proyek.nama_bangunan)}</b></td></tr>
              <tr><td style="font-weight:600">Alamat Lokasi</td><td>${escHtml(proyek.alamat || '-')}, ${escHtml(proyek.kota || '-')}, ${escHtml(proyek.provinsi || '-')}</td></tr>
              <tr><td style="font-weight:600">Nama Pemilik</td><td>${escHtml(proyek.pemilik)}</td></tr>
            </tbody>
          </table>
        </div>

        <!-- BAB III: HASIL CHECKLIST -->
        <div id="lap-bab3" class="laporan-section pdf-page-break" style="page-break-before:always">
          <h2>BAB III: Hasil Pemeriksaan Checklist</h2>
          <h3>3.1. Dokumen Administrasi</h3>
          ${renderLegacyChecklistTable(checklist.filter(c => c.kategori === 'administrasi'))}

          <h3 style="margin-top:24px">3.2. Kondisi Teknis Eksisting</h3>
          ${renderLegacyChecklistTable(checklist.filter(c => c.kategori === 'teknis'))}
        </div>

        <!-- BAB IV: ANALISIS AI -->
        <div id="lap-bab4" class="laporan-section pdf-page-break" style="page-break-before:always">
          <h2>BAB IV: Hasil Analisis AI SLF</h2>
          <div style="display:flex;gap:20px;margin:24px 0">
            <div style="width:240px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:24px;text-align:center;display:flex;flex-direction:column;justify-content:center">
              <div style="font-size:0.8rem;text-transform:uppercase;letter-spacing:1px;color:#64748b;margin-bottom:8px">Skor Keseluruhan</div>
              <div style="font-size:4rem;font-weight:800;color:#1e3a8a;line-height:1">${analisis.skor_total || 0}</div>
              <div style="margin-top:16px;font-size:0.9rem;font-weight:700;color:${analisis.risk_level==='low'?'#059669':analisis.risk_level==='medium'?'#d97706':'#dc2626'}">
                Risiko ${analisis.risk_level==='low'?'Rendah':analisis.risk_level==='medium'?'Sedang':analisis.risk_level==='high'?'Tinggi':'Kritis'}
              </div>
            </div>
            <div style="flex:1">
              ${analisis.narasi_teknis ? `
                <div class="bab4-narasi-content">
                  ${analisis.narasi_teknis.includes('## ASPEK PEMERIKSAAN:') ? marked.parse(analisis.narasi_teknis) : renderToHTML(parseNarasiAI(analisis.narasi_teknis))}
                </div>
              ` : `<div style="padding:24px;text-align:center;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px"><i class="fas fa-info-circle text-secondary"></i> Narasi belum tersedia.</div>`}
            </div>
          </div>
        </div>

        <!-- BAB V: ANALISIS FORENSIK (EXPERT CONSORTIUM) -->
        ${analisis.metadata?.expert_findings ? `
          <div id="lap-bab5" class="laporan-section pdf-page-break" style="page-break-before:always">
            <h2>BAB V: Analisis Teknis & Ketajaman Profesional</h2>
            <p style="font-style:italic; color:#64748b; margin-bottom:20px">Bagian ini disusun berdasarkan analisis mendalam oleh Konsorsium Tenaga Ahli Spesialis (Arsitektur, Struktur, MEP, dan Legal).</p>
            <div class="bab5-forensic-content markdown-content" style="line-height:1.7">
              ${marked.parse(analisis.metadata.expert_findings.bab5_analisis || '')}
            </div>
          </div>

          <!-- BAB VI: KESIMPULAN & REKOMENDASI -->
          <div id="lap-bab6" class="laporan-section pdf-page-break" style="page-break-before:always">
            <h2>BAB VI: Kesimpulan & Rekomendasi Utama</h2>
            <div style="background:#f1f5f9; border-radius:12px; padding:24px; border:1px solid #e2e8f0">
               <h4 style="margin-top:0; color:#1e3a8a">6.1. Status Kelaikan Hasil Audit</h4>
               <div style="font-size:1.2rem; font-weight:800; color:#1e293b; margin-bottom:15px; border-bottom:2px solid #cbd5e1; padding-bottom:10px">
                  REKOMENDASI STATUS: ${analisis.metadata.expert_findings.status_final?.replace(/_/g, ' ')}
               </div>
               <div class="bab6-conclusion-content markdown-content" style="font-size:0.95rem">
                  ${marked.parse(analisis.metadata.expert_findings.bab6_kesimpulan || '')}
               </div>
            </div>
          </div>
        ` : ''}

        </div>

        <!-- LAMPIRAN FOTO TEMUAN (DARI GALERI) -->
        <div id="lap-lampiran" class="laporan-section pdf-page-break" style="page-break-before:always">
          <h2>LAMPIRAN: BUKTI VISUAL LAPORAN</h2>
          <div class="galeri-laporan-grid" style="display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-top:20px">
            ${window._reportPhotos && window._reportPhotos.length > 0 ? window._reportPhotos.map(p => `
              <div style="border:1px solid #e2e8f0; padding:10px; border-radius:8px; page-break-inside:avoid">
                <img src="${p.url}" style="width:100%; height:180px; object-fit:cover; border-radius:4px; margin-bottom:8px">
                <div style="font-size:0.75rem; font-weight:700; color:#1e293b">${escHtml(p.nama || p.name)}</div>
                <div style="font-size:0.65rem; color:#64748b; margin-top:2px">Aspek: ${escHtml(p.aspek || p.category)}</div>
              </div>
            `).join('') : '<div style="grid-column:1/-1; text-align:center; padding:40px; color:#94a3b8; border:2px dashed #e2e8f0; border-radius:12px">Belum ada foto yang dipilih dari Galeri.</div>'}
          </div>
        </div>

        <!-- PENGESAHAN (SIGNATURE & STAMP) -->
        <div id="lap-pengesahan" class="laporan-section pdf-page-break" style="page-break-before:always; padding:40px; color:#000">
          <div style="margin-top:100px; display:flex; justify-content:flex-end">
            <div style="width:340px; text-align:center; position:relative">
              <div style="margin-bottom:60px; font-size:11pt">
                Dibuat di: <b>${escHtml(proyek.kota || 'Jakarta')}</b><br>
                Tanggal: <b>${new Date().toLocaleDateString('id-ID', {day:'numeric', month:'long', year:'numeric'})}</b>
              </div>
              <div style="font-weight:800; margin-bottom:4px; font-size:10pt">KONSULTAN PENGKAJI TEKNIS:</div>
              <div style="font-weight:800; margin-bottom:15px; font-size:11pt; border-bottom:1px solid #000; padding-bottom:5px">${escHtml(settings.consultant.name)}</div>
              
              <div style="display:flex; align-items:center; justify-content:center; gap:30px; margin-bottom:30px">
                <!-- e-Materai -->
                <div style="width:85px; height:85px; border:1px solid #3b82f6; background:#eff6ff; border-radius:4px; display:flex; flex-direction:column; align-items:center; justify-content:center; font-size:8px; line-height:1.2; color:#1e40af">
                   <b>MATERAI</b>
                   ELEKTRONIK
                   <div style="font-size:11px; font-weight:900; margin-top:2px">10.000</div>
                   <div style="font-size:6px; opacity:0.7">TTE TERVERIFIKASI</div>
                </div>

                <!-- TTE QR -->
                <div style="position:relative; width:100px; height:100px">
                   ${(() => {
                     const verifyUrl = `${window.location.origin}${window.location.pathname}#/verify?id=${proyek.id}&expert=director`;
                     const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(verifyUrl)}`;
                     return `<img src="${qrSrc}" style="width:100%; height:100%; border:1px solid #eee; background:#fff; padding:3px; border-radius:4px">`;
                   })()}
                   ${settings.consultant.signature ? `<img src="${settings.consultant.signature}" style="position:absolute; top:20px; left:20px; width:100px; height:60px; object-fit:contain; opacity:0.9">` : ''}
                   ${settings.consultant.stamp ? `<img src="${settings.consultant.stamp}" style="position:absolute; bottom:-10px; right:-20px; width:80px; height:80px; opacity:0.7; object-fit:contain">` : ''}
                </div>
              </div>

              <div style="font-weight:800; text-decoration:underline; font-size:11pt; margin-top:30px">
                ${escHtml(settings.consultant?.director_name || 'NAMA DIREKTUR')}
              </div>
              <div style="font-size:10pt; margin-top:4px">
                ${escHtml(settings.consultant?.director_job || 'Direktur')}
              </div>
              <div style="font-size:8pt; margin-top:10px; opacity:0.6; font-style:italic">
                Tanda Tangan Elektronik Terverifikasi (UU ITE)
              </div>
            </div>
          </div>

          <!-- Bottom Footer Information -->
          <div style="margin-top:100px; border-top:2px solid #000; padding-top:10px; display:flex; justify-content:space-between; align-items:center; font-size:8pt">
             <div>
               <b>Integritas Dokumen Digital:</b> ${(proyek.id + proyek.created_at).split('').reduce((a,b)=>{a=((a<<5)-a)+b.charCodeAt(0);return a&a},0).toString(16).toUpperCase().padStart(32,'0')}
             </div>
             <div style="text-align:right">
               Smart AI Pengkaji SLF · Sistem SIMBG Berbasis Cloud
             </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Helper untuk Legacy Tab
function renderLegacyChecklistTable(items) {
  if (!items || items.length === 0) return '<p style="font-size:0.85rem;font-style:italic">Data tidak tersedia.</p>';
  return `
    <table>
      <thead>
        <tr><th style="width:12%">Kode</th><th style="width:38%">Item / Komponen</th><th style="width:15%">Status</th><th style="width:35%">Catatan Teknis</th></tr>
      </thead>
      <tbody>
        ${items.map(i => `
          <tr class="pdf-avoid-break">
            <td style="font-family:monospace;font-size:0.8rem;color:#64748b">${escHtml(i.kode || '-')}</td>
            <td><b>${escHtml(i.nama)}</b></td>
            <td><span style="font-weight:700">${escHtml(i.status)}</span></td>
            <td style="font-size:0.825rem">${escHtml(i.catatan || '-')}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

// ── Actions & Event Handlers ─────────────────────────────────

function initLaporanActions(proyek, analisis, checklist, settings, gdocStatus, cachedDoc) {
  // Show/hide progress overlay
  const showProgress = (pct, msg) => {
    const overlay = document.getElementById('export-progress-overlay');
    const fill = document.getElementById('export-progress-fill');
    const pctEl = document.getElementById('export-progress-pct');
    const msgEl = document.getElementById('export-progress-msg');
    
    if (overlay) overlay.style.display = 'flex';
    if (fill) fill.style.width = `${pct}%`;
    if (pctEl) pctEl.textContent = `${pct}%`;
    if (msgEl && msg) msgEl.textContent = msg;
  };

  const hideProgress = () => {
    const overlay = document.getElementById('export-progress-overlay');
    if (overlay) overlay.style.display = 'none';
  };

  // Google Docs Operations
  window._generateGDoc = async () => {
    try {
      showProgress(0, 'Memulai proses ke Google Cloud...');
      await generateFromTemplate(proyek, analisis, checklist, showProgress);
      
      logActivity('GENERATE_GDOC', proyek.id, { 
        action: 'new_template_generation'
      });

      showSuccess('Dokumen Laporan berhasil digenerate di Google Docs!');
      // Refresh UI by navigating back to self
      setTimeout(() => navigate('laporan', { id: proyek.id }), 500);
    } catch (err) {
      hideProgress();
      showError('Gagal generate dokumen: ' + err.message);
    }
  };

  window._reGenerateGDoc = async () => {
    if (!cachedDoc) return;
    try {
      showProgress(0, 'Menyiapkan pembaruan dokumen...');
      await updateExistingDoc(cachedDoc.docId, proyek, analisis, checklist, showProgress);
      showSuccess('Data pada laporan Google Docs berhasil diperbarui!');
    } catch (err) {
      hideProgress();
      showError('Gagal sinkronisasi data ulang: ' + err.message);
    }
  };

  // Switch tabs
  window._switchContentTab = (tabId, tabEl) => {
    document.querySelectorAll('.tab-item').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    tabEl.classList.add('active');
    document.getElementById(tabId).classList.add('active');
  };

  // Dropdowns
  initExportDropdown();

  // Legacy Operations
  window._downloadWord = async () => {
    try {
      showProgress(5, 'Menyiapkan dokumen Word...');
      await generateDocx(proyek, analisis, checklist, showProgress);
      
      logActivity('EXPORT_WORD', proyek.id, { 
        type: 'legacy_docx'
      });

      showSuccess('Dokumen Word (.docx) berhasil di-download!');
      setTimeout(hideProgress, 1000);
    } catch (err) {
      hideProgress();
      showError('Gagal membuat dokumen Word: ' + err.message);
    }
  };

  window._downloadPDF = async () => {
    try {
      showProgress(10, 'Memuat library PDF...');
      const printArea = document.getElementById('print-area');
      await generatePDF(printArea, proyek, showProgress);
      
      logActivity('EXPORT_PDF', proyek.id, { 
        filename: `SLF_${proyek.nama_bangunan}.pdf`
      });

      showSuccess('Dokumen PDF berhasil di-download!');
      setTimeout(hideProgress, 1000);
    } catch (err) {
      hideProgress();
      showError('Gagal membuat PDF: ' + err.message);
    }
  };

  window._printReport = () => {
    showInfo('Membuka dialog cetak...');
    setTimeout(() => window.print(), 300);
  };
}

// Dropdown Helper untuk Gdocs Export
window._toggleGDocsExport = () => {
  const menu = document.getElementById('menu-gdocs-export');
  if (menu) menu.classList.toggle('open');
};

window._downloadGDocsWord = (docId) => {
  window.open(getGoogleDocsExportDocxUrl(docId), '_blank');
  document.getElementById('menu-gdocs-export').classList.remove('open');
};

window._downloadGDocsPdf = (docId) => {
  window.open(getGoogleDocsExportPdfUrl(docId), '_blank');
  document.getElementById('menu-gdocs-export').classList.remove('open');
};


function initExportDropdown() {
  document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('dropdown-gdocs-export');
    if (dropdown && !dropdown.contains(e.target)) {
      document.getElementById('menu-gdocs-export')?.classList.remove('open');
    }
  });
}

// ── Data Fetchers ─────────────────────────────────────────────
async function fetchProyek(id) {
  try {
    const { data } = await supabase.from('proyek').select('*').eq('id', id).maybeSingle();
    return data;
  } catch { return null; }
}
async function fetchLastAnalisis(proyekId) {
  try {
    const { data } = await supabase.from('hasil_analisis').select('*').eq('proyek_id', proyekId).order('created_at',{ascending:false}).limit(1);
    return data && data.length > 0 ? data[0] : null;
  } catch { return null; }
}

async function fetchStarredPhotos(proyekId) {
  const [{ data: clData }, { data: flData }] = await Promise.all([
    supabase.from('checklist_items').select('kode, nama, aspek, foto_urls, metadata').eq('proyek_id', proyekId),
    supabase.from('proyek_files').select('*').eq('proyek_id', proyekId)
  ]);

  const photos = [];
  clData?.forEach(item => {
    if (item.metadata?.featured_photos) {
      item.metadata.featured_photos.forEach(url => {
        photos.push({ url, nama: item.nama, aspek: item.aspek });
      });
    }
  });
  flData?.forEach(f => {
    if (f.metadata?.is_starred) {
      photos.push({ url: f.file_url, name: f.name, category: f.category });
    }
  });
  return photos;
}
async function fetchChecklist(proyekId) {
  try {
    const { data } = await supabase.from('checklist_items').select('*').eq('proyek_id', proyekId);
    return data || [];
  } catch { return []; }
}

function renderSkeleton() {
  return `
    <div class="page-header">
      <div class="skeleton" style="height:36px;width:300px;margin-bottom:8px"></div>
      <div class="skeleton" style="height:20px;width:400px"></div>
    </div>
    <div style="display:grid;grid-template-columns:1fr;gap:var(--space-5);margin-top:20px">
      <div class="skeleton" style="height:500px;border-radius:var(--radius-lg)"></div>
    </div>
  `;
}

function escHtml(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function formatTanggalwTime(d) {
  try { 
    return new Date(d).toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit'}); 
  } catch { return String(d); } 
}
