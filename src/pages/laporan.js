// ============================================================
//  LAPORAN PAGE
//  PRESIDENTIAL CLASS (QUARTZ PREMIUM)
//  Executive Document Orchestration System
// ============================================================
import { supabase } from '../lib/supabase.js';
import { navigate } from '../lib/router.js';
import { logActivity, saveReportVersion } from '../lib/audit-service.js';
import { showSuccess, showError, showInfo } from '../components/toast.js';
import { marked } from 'marked';
import { generateDocx } from '../lib/docx-service.js';
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
  checkGoogleIntegration
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
      <div id="laporan-page" style="animation: page-fade-in 0.8s ease-out">
        <div class="card-quartz" style="text-align:center; padding:100px 40px; border-color: hsla(0, 85%, 60%, 0.1)">
          <div style="width:100px; height:100px; background:var(--gradient-dark); border:1px solid var(--glass-border); border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 32px; font-size:2.5rem; color:var(--text-tertiary)">
            <i class="fas fa-file-circle-exclamation"></i>
          </div>
          <h3 style="font-family:'Outfit', sans-serif; font-weight:800; font-size:1.4rem; color:white; margin-bottom:12px">Analytics Data Required</h3>
          <p style="color:var(--text-tertiary); max-width:460px; margin:0 auto 32px; line-height:1.6">
            The executive report cannot be synthesized until the AI analysis is finalized. Please run the kelaikan check first.
          </p>
          <button class="btn-presidential gold" onclick="window.navigate('analisis',{id:'${proyek.id}'})">
            <i class="fas fa-brain-circuit" style="margin-right:10px"></i> OPEN AI ANALYTICS
          </button>
        </div>
      </div>
    `;
  }

  return `
    <div id="laporan-page" style="animation: page-fade-in 0.8s ease-out">
      
      <!-- Presidential Action Header -->
      <div class="page-header" style="margin-bottom:var(--space-8)">
        <div class="flex-between" style="align-items: flex-start">
          <div>
            <button class="btn btn-ghost btn-xs" onclick="window.navigate('proyek-detail',{id:'${proyek.id}'})" style="margin-bottom:12px; padding:0; color:var(--brand-300); font-weight:700; letter-spacing:1px">
              <i class="fas fa-arrow-left" style="margin-right:8px"></i> ${escHtml(proyek.nama_bangunan)}
            </button>
            <h1 class="page-title" style="font-family:'Outfit', sans-serif; font-weight:800; font-size: 2.2rem; letter-spacing:-0.02em; margin-bottom:4px">
              Synthesis <span class="text-gradient-gold">Laporan SLF</span>
            </h1>
            <div style="display:flex; align-items:center; gap:16px">
              <p class="page-subtitle" style="font-family:var(--font-mono); font-size: 0.7rem; letter-spacing:1px; opacity:0.6; text-transform:uppercase">
                Automated Regulatory Compliance Documentation
              </p>
              <div style="background:hsla(158, 85%, 45%, 0.1); color:var(--success-400); border:1px solid hsla(158, 85%, 45%, 0.2); padding:2px 12px; border-radius:100px; font-size:9px; font-weight:800; display:flex; align-items:center; gap:6px; font-family:var(--font-mono)">
                <i class="fas fa-shield-check"></i> E-SIGNATURE VERIFIED
              </div>
            </div>
          </div>
          
          <div class="flex gap-4">
             <button class="btn btn-outline" onclick="window._printReport()" style="height:44px; padding:0 20px; border-radius:12px">
                <i class="fas fa-print"></i>
             </button>
             <button class="btn-presidential gold" id="btn-global-export" style="height:44px; padding:0 24px; border-radius:12px">
                <i class="fas fa-cloud-arrow-down" style="margin-right:10px"></i> EXPORT CORE ARCHIVE
             </button>
          </div>
        </div>
        
        <!-- Document Mode Selector -->
        <div class="card-quartz" style="padding: 6px; margin-top: 32px; display: flex; gap: 8px; background: hsla(224, 25%, 4%, 0.6)">
          <button onclick="window._switchContentTab('tab-gdocs', this)" 
                  class="tab-item active"
                  style="flex:1; height:44px; border:none; border-radius:10px; cursor:pointer; font-family:var(--font-mono); font-size:10px; font-weight:800; letter-spacing:1px; display:flex; align-items:center; justify-content:center; gap:10px; transition:all 0.3s">
            <i class="fas fa-file-word"></i> GOOGLE DOCS EDITOR (CLOUD SYNC)
          </button>
          <button onclick="window._switchContentTab('tab-legacy', this)" 
                  class="tab-item"
                  style="flex:1; height:44px; border:none; border-radius:10px; cursor:pointer; font-family:var(--font-mono); font-size:10px; font-weight:800; letter-spacing:1px; display:flex; align-items:center; justify-content:center; gap:10px; transition:all 0.3s">
            <i class="fas fa-desktop"></i> LOCAL PAPER PREVIEW (LEGACY)
          </button>
        </div>
      </div>

      <!-- Processing Progress Modal -->
      <div id="export-progress-overlay" style="display:none; position:fixed; inset:0; background:hsla(224, 25%, 4%, 0.9); backdrop-filter:blur(10px); z-index:10000; align-items:center; justify-content:center">
        <div class="card-quartz" style="width:420px; padding:40px; text-align:center; box-shadow:0 0 50px rgba(0,0,0,0.5)">
          <div style="width:80px; height:80px; background:hsla(220, 95%, 52%, 0.1); border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 24px">
            <i class="fas fa-microchip fa-spin" style="font-size:2rem; color:var(--brand-400)"></i>
          </div>
          <h3 id="export-progress-title" style="font-family:'Outfit', sans-serif; font-weight:800; color:white; margin-bottom:12px">Document Processor</h3>
          <p id="export-progress-msg" style="color:var(--text-tertiary); font-size:0.85rem; margin-bottom:32px">Authenticating with Google Cloud...</p>
          
          <div style="height:6px; background:hsla(220, 20%, 100%, 0.05); border-radius:10px; overflow:hidden">
            <div id="export-progress-fill" style="width:0%; height:100%; border-radius:10px; background:var(--gradient-brand); transition:width 0.4s"></div>
          </div>
          <div id="export-progress-pct" style="font-family:var(--font-mono); font-size:11px; font-weight:800; color:var(--brand-400); margin-top:12px; text-align:right">0%</div>
        </div>
      </div>

      <!-- Main Content Tabs -->
      <div id="tab-gdocs" class="tab-content active route-fade">
        ${renderGDocsTab(proyek, gdocStatus, cachedDoc)}
      </div>

      <div id="tab-legacy" class="tab-content route-fade" style="display:none">
        ${renderLegacyTab(proyek, analisis, checklist, settings)}
      </div>

    </div>
  `;
}

function renderGDocsTab(proyek, gdocStatus, cachedDoc) {
  if (!gdocStatus.ready) {
    return `
      <div class="card-quartz" style="text-align:center; padding:80px 40px; border-color: hsla(0, 85%, 60%, 0.1)">
        <i class="fas fa-link-slash" style="font-size:3rem; color:var(--danger-400); margin-bottom:24px; opacity:0.5"></i>
        <h3 style="font-family:'Outfit', sans-serif; font-weight:800; color:white; margin-bottom:12px">Cloud Integration Failure</h3>
        <p style="color:var(--text-tertiary); max-width:500px; margin:0 auto 32px">
          ${escHtml(gdocStatus.message)}
        </p>
        <button class="btn btn-outline" onclick="window.navigate('settings')">
          <i class="fas fa-gears" style="margin-right:10px"></i> RECONFIGURE SETTINGS
        </button>
      </div>
    `;
  }

  if (!cachedDoc) {
    return `
      <div class="card-quartz" style="text-align:center; padding:100px 40px; background:var(--gradient-dark); border-color: hsla(220, 95%, 52%, 0.2)">
        <div style="width:80px; height:80px; background:var(--gradient-brand); border-radius:18px; display:flex; align-items:center; justify-content:center; margin:0 auto 24px; font-size:2rem; color:white; box-shadow:var(--shadow-sapphire); border:1px solid hsla(220, 95%, 52%, 0.3)">
          <i class="fas fa-file-sparkles"></i>
        </div>
        <h3 style="font-family:'Outfit', sans-serif; font-weight:800; font-size:1.6rem; color:white; margin-bottom:12px">Generate Intelligent Executive Report</h3>
        <p style="color:var(--brand-300); max-width:640px; margin:0 auto 40px; line-height:1.6; font-weight:600">
          Neural engine will replicate the master template and auto-populate all field findings, risk matrices, and visual evidence logs into a legally compliant Google Document.
        </p>
        <button class="btn-presidential gold" onclick="window._generateGDoc()" id="btn-generate-gdoc" style="height:56px; padding:0 40px; font-size:1rem">
          <i class="fas fa-wand-magic-sparkles" style="margin-right:12px"></i> INITIATE TEMPLATE BINDING
        </button>
      </div>
    `;
  }

  const docId = cachedDoc.docId;
  const embedUrl = getGoogleDocsEmbedUrl(docId);
  const editUrl = getGoogleDocsEditUrl(docId);
  
  return `
    <div style="display:grid; grid-template-columns:1fr; gap:16px">
      
      <!-- Control Bar -->
      <div class="card-quartz" style="display:flex; justify-content:space-between; align-items:center; padding:12px 24px; background: hsla(224, 25%, 4%, 0.6); border-color: hsla(220, 20%, 100%, 0.05)">
        <div style="display:flex; align-items:center; gap:16px">
          <div style="width:40px; height:40px; background:hsla(220, 95%, 52%, 0.1); border-radius:10px; display:flex; align-items:center; justify-content:center; color:var(--brand-400); border:1px solid hsla(220, 95%, 52%, 0.2)">
            <i class="fas fa-file-word"></i>
          </div>
          <div>
            <div style="font-family:'Outfit', sans-serif; font-weight:800; font-size:0.95rem; color:white">ACTIVE CLOUD REPOSITORY</div>
            <div style="font-family:var(--font-mono); font-size:9px; color:var(--text-tertiary); text-transform:uppercase; letter-spacing:1px">SYNCED: ${formatTanggalwTime(cachedDoc.generatedAt)}</div>
          </div>
        </div>
        
        <div class="flex gap-4">
          <button class="btn btn-ghost btn-sm" onclick="window._reGenerateGDoc()" style="color:var(--brand-300); font-family:var(--font-mono); font-size:10px; font-weight:800; letter-spacing:1px">
            <i class="fas fa-sync-alt" style="margin-right:8px"></i> SYNC CORE DATA
          </button>
          
          <button class="btn btn-outline btn-sm" onclick="window.open('${editUrl}','_blank')" style="border-radius:10px; font-weight:700">
            <i class="fas fa-external-link" style="margin-right:8px"></i> OPEN EDITOR
          </button>
          
          <div style="position:relative">
            <button class="btn-presidential gold" onclick="window._toggleGDocsExport()" style="height:36px; padding:0 20px; font-size:11px; border-radius:10px">
              <i class="fas fa-download" style="margin-right:8px"></i> EXPORT
              <i class="fas fa-chevron-down" style="margin-left:8px; font-size:8px"></i>
            </button>
            <div id="menu-gdocs-export" class="card-quartz" style="display:none; position:absolute; top:44px; right:0; width:220px; z-index:100; padding:8px">
               <button class="export-option" onclick="window._downloadGDocsWord('${docId}', '${proyek.id}', '${proyek.nama_bangunan}')" style="width:100%; text-align:left; padding:12px; border:none; background:transparent; border-radius:8px; display:flex; align-items:center; gap:12px; cursor:pointer" onmouseenter="this.style.background='hsla(220, 20%, 100%, 0.05)'" onmouseleave="this.style.background='transparent'">
                  <i class="fas fa-file-word" style="color:var(--brand-400)"></i>
                  <span style="font-family:var(--font-mono); font-size:10px; font-weight:800; color:white; letter-spacing:1px">MICROSOFT WORD</span>
               </button>
               <button class="export-option" onclick="window._downloadGDocsPdf('${docId}', '${proyek.id}', '${proyek.nama_bangunan}')" style="width:100%; text-align:left; padding:12px; border:none; background:transparent; border-radius:8px; display:flex; align-items:center; gap:12px; cursor:pointer" onmouseenter="this.style.background='hsla(220, 20%, 100%, 0.05)'" onmouseleave="this.style.background='transparent'">
                  <i class="fas fa-file-pdf" style="color:var(--danger-400)"></i>
                  <span style="font-family:var(--font-mono); font-size:10px; font-weight:800; color:white; letter-spacing:1px">ADOBE PDF</span>
               </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Editor Frame -->
      <div class="card-quartz" style="padding:0; overflow:hidden; height:75vh; position:relative; background:hsla(224, 25%, 4%, 0.4)">
         <div style="position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); color:var(--text-tertiary); display:flex; flex-direction:column; align-items:center; gap:16px; z-index:0">
           <i class="fas fa-circle-notch fa-spin" style="font-size:2.5rem; color:var(--brand-400)"></i>
           <span style="font-family:var(--font-mono); font-size:10px; font-weight:800; letter-spacing:2px">INTERFACING GOOGLE CLOUD...</span>
         </div>
         <iframe src="${embedUrl}" style="width:100%; height:100%; border:none; position:relative; z-index:1; background:transparent"></iframe>
      </div>
    </div>
  `;
}

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
    <div style="display:grid; grid-template-columns: 280px 1fr; gap: 32px">
      <!-- Left Anchor Nav -->
      <div class="no-print">
        <div class="card-quartz" style="padding:24px; position:sticky; top:20px">
          <div style="font-family:var(--font-mono); font-size:10px; font-weight:800; color:var(--text-tertiary); text-transform:uppercase; letter-spacing:2px; margin-bottom:24px">STRUCTURE NAVIGATION</div>
          <div style="display:flex; flex-direction:column; gap:8px">
            ${sections.map((s, i) => `
              <button class="btn btn-ghost" style="width:100%; justify-content:flex-start; height:40px; font-weight:700; font-size:0.85rem; padding:0 16px; border-radius:10px" onclick="document.getElementById('lap-${s.id}').scrollIntoView({ behavior: 'smooth', block: 'start' })">
                <i class="fas ${s.icon}" style="margin-right:12px; width:20px; color:var(--brand-400)"></i> ${s.label}
              </button>
            `).join('')}
          </div>
          
          <div style="margin-top:32px; padding-top:24px; border-top:1px solid hsla(220, 20%, 100%, 0.05)">
            <button class="btn btn-outline btn-sm" onclick="window._downloadWord()" style="width:100%; margin-bottom:12px; justify-content:center">LEGACY WORD</button>
            <button class="btn btn-outline btn-sm" onclick="window._downloadPDF()" style="width:100%; justify-content:center">LEGACY PDF</button>
          </div>
        </div>
      </div>

      <!-- Right Paper Content -->
      <div id="print-area" style="background:white; border-radius:4px; box-shadow: 0 10px 40px rgba(0,0,0,0.5); padding: 0.5in; max-width: 210mm; min-height: 297mm; margin: 0 auto; color:#000">
         
         <!-- Paper Cover -->
         <div id="lap-cover" style="height: 250mm; display:flex; flex-direction:column; justify-content:center; text-align:center; border: 15px double #000; padding:1in; margin-bottom:40px">
            <h2 style="font-size:1.5rem; text-transform:uppercase; letter-spacing:3px; margin-bottom:40px">Laporan Kajian Teknis</h2>
            <h1 style="font-size:3rem; line-height:1.1; margin-bottom:60px">SERTIFIKAT LAIK FUNGSI<br>(SLF) BANGUNAN GEDUNG</h1>
            
            <div style="border-top:2px solid #000; border-bottom:2px solid #000; padding:40px 0; margin-bottom:60px">
               <h2 style="font-size:1.8rem; margin-bottom:12px">${escHtml(proyek.nama_bangunan)}</h2>
               <p style="font-size:1.1rem; opacity:0.8">${escHtml(proyek.alamat)}, ${escHtml(proyek.kota || '')}</p>
            </div>

            <div style="margin-top:auto">
               <p style="font-size:1rem; margin-bottom:32px">Diajukan oleh:<br><b>${escHtml(proyek.pemilik)}</b></p>
               <div style="font-size:1rem; font-weight:800; border:1px solid #000; display:inline-block; padding:10px 30px">TAHUN ANGGARAN ${new Date().getFullYear()}</div>
            </div>
         </div>

         <!-- Inner Content Sections -->
         <div class="laporan-section" id="lap-bab1">
            <h2 style="border-bottom:2px solid #000; padding-bottom:10px; margin-bottom:20px">BAB I: DATA ADMINISTRASI</h2>
            <table style="width:100%; border-collapse:collapse">
               <tr><td style="width:40%; padding:10px; border:1px solid #000; font-weight:800">NAMA BANGUNAN</td><td style="padding:10px; border:1px solid #000">${escHtml(proyek.nama_bangunan)}</td></tr>
               <tr><td style="padding:10px; border:1px solid #000; font-weight:800">LOKASI</td><td style="padding:10px; border:1px solid #000">${escHtml(proyek.alamat)}</td></tr>
               <tr><td style="padding:10px; border:1px solid #000; font-weight:800">PEMILIK</td><td style="padding:10px; border:1px solid #000">${escHtml(proyek.pemilik)}</td></tr>
               <tr><td style="padding:10px; border:1px solid #000; font-weight:800">NOMOR PBG/REG</td><td style="padding:10px; border:1px solid #000">${escHtml(proyek.nomor_pbg || '-')}</td></tr>
            </table>
         </div>

         <div class="laporan-section" id="lap-bab3" style="margin-top:60px">
            <h2 style="border-bottom:2px solid #000; padding-bottom:10px; margin-bottom:20px">BAB III: HASIL PEMERIKSAAN</h2>
            <div style="margin-bottom:40px">
               <h3>3.1. Dokumen Administrasi</h3>
               ${renderLegacyChecklistTable(checklist.filter(c => c.kategori === 'administrasi'))}
            </div>
            <div>
               <h3>3.2. Kondisi Teknis Lapangan</h3>
               ${renderLegacyChecklistTable(checklist.filter(c => c.kategori === 'teknis'))}
            </div>
         </div>

         <div class="laporan-section" id="lap-bab4" style="margin-top:60px; page-break-before:always">
            <h2 style="border-bottom:2px solid #000; padding-bottom:10px; margin-bottom:20px">BAB IV: HASIL ANALISIS AI</h2>
            <div style="background:#f8fafc; padding:32px; border:1px solid #e2e8f0; border-radius:12px">
               <div style="font-weight:800; color:#1e3a8a; margin-bottom:24px">REKOMENDASI KELAIKAN: ${analisis.status_slf || 'DALAM PENGKAJIAN'}</div>
               <div class="markdown-content" style="font-size:0.95rem; line-height:1.7">
                  ${marked.parse(analisis.narasi_teknis || '_Analysis narrative pending neural synthesis._')}
               </div>
            </div>
         </div>

         <!-- Signatures Area -->
         <div style="margin-top:100px; display:flex; justify-content:flex-end; text-align:center">
            <div style="width:300px">
               <div style="margin-bottom:80px">
                  Ditetapkan di: <b>${escHtml(proyek.kota || 'Jakarta')}</b><br>
                  Tanggal: <b>${new Date().toLocaleDateString('id-ID', {day:'numeric', month:'long', year:'numeric'})}</b>
               </div>
               <div style="font-weight:800; border-bottom:1px solid #000; padding-bottom:8px; margin-bottom:4px">${escHtml(settings.consultant.name)}</div>
               <div style="font-size:0.8rem; margin-bottom:40px">Direktur Utama:</div>
               <div style="font-weight:800; text-decoration:underline">${escHtml(settings.consultant.director_name || 'NAMA DIREKTUR')}</div>
            </div>
         </div>
      </div>
    </div>
  `;
}

function renderLegacyChecklistTable(items) {
  if (!items || items.length === 0) return '<p style="font-style:italic">Data not found in manifest.</p>';
  return `
    <table style="width:100%; border-collapse:collapse; font-size:9pt; color:#000">
      <thead>
        <tr style="background:#f1f5f9"><th style="padding:10px; border:1in solid #000; border-width:1px; text-align:center">KODE</th><th style="padding:10px; border:1in solid #000; border-width:1px; text-align:left">KOMPONEN</th><th style="padding:10px; border:1in solid #000; border-width:1px; text-align:center">STATUS</th></tr>
      </thead>
      <tbody>
        ${items.map(i => `
          <tr>
            <td style="padding:10px; border:1px solid #000; text-align:center; font-family:monospace">${i.kode}</td>
            <td style="padding:10px; border:1px solid #000">${escHtml(i.nama)}</td>
            <td style="padding:10px; border:1px solid #000; text-align:center; font-weight:800">${escHtml(i.status || '-')}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

// ── Shared Actions ─────────────────────────────────────────────

function initLaporanActions(proyek, analisis, checklist, settings, gdocStatus, cachedDoc) {
  const showProgress = (pct, msg) => {
    const overlay = document.getElementById('export-progress-overlay');
    const fill = document.getElementById('export-progress-fill');
    const pctEl = document.getElementById('export-progress-pct');
    const msgEl = document.getElementById('export-progress-msg');
    
    if (overlay) overlay.style.display = 'flex';
    if (fill) fill.style.width = `${pct}%`;
    if (pctEl) pctEl.textContent = `${pct}%`;
    if (msgEl) msgEl.textContent = msg;
  };

  const hideProgress = () => {
    const overlay = document.getElementById('export-progress-overlay');
    if (overlay) overlay.style.display = 'none';
  };

  window._generateGDoc = async () => {
    try {
      showProgress(10, 'Initializing Neural Template Bridge...');
      await generateFromTemplate(proyek, analisis, checklist, showProgress);
      logActivity('GENERATE_GDOC', proyek.id, { mode: 'presidential_v7' });
      showSuccess('Intelligence Report generated on cloud successfully.');
      setTimeout(() => navigate('laporan', { id: proyek.id }), 500);
    } catch (err) {
      hideProgress();
      showError('Link failure: ' + err.message);
    }
  };

  window._reGenerateGDoc = async () => {
    if (!cachedDoc) return;
    try {
      showProgress(0, 'Updating Cloud Document Repositories...');
      await updateExistingDoc(cachedDoc.docId, proyek, analisis, checklist, showProgress);
      showSuccess('Cloud repository updated with latest field findings.');
      setTimeout(hideProgress, 1000);
    } catch (err) {
      hideProgress();
      showError('Sync failure: ' + err.message);
    }
  };

  window._switchContentTab = (tabId, btn) => {
    document.querySelectorAll('.tab-content').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.tab-item').forEach(el => {
       el.classList.remove('active');
       el.style.background = 'transparent';
       el.style.color = 'var(--text-tertiary)';
       el.style.boxShadow = 'none';
    });

    const content = document.getElementById(tabId);
    if (content) content.style.display = 'block';
    
    btn.classList.add('active');
    btn.style.background = 'var(--gradient-brand)';
    btn.style.color = 'white';
    btn.style.boxShadow = 'var(--shadow-sapphire)';
  };

  // Sync initial tab style
  const activeTab = document.querySelector('.tab-item.active');
  if (activeTab) {
     activeTab.style.background = 'var(--gradient-brand)';
     activeTab.style.color = 'white';
     activeTab.style.boxShadow = 'var(--shadow-sapphire)';
  }

  window._printReport = () => {
    showInfo('Activating printer interface...');
    setTimeout(() => window.print(), 300);
  };

  window._downloadWord = async () => {
    try {
      showProgress(20, 'Assembling Word Manifest...');
      await generateDocx(proyek, analisis, checklist, showProgress);
      showSuccess('Legacy .docx manifest downloaded.');
      setTimeout(hideProgress, 1000);
    } catch (e) {
      hideProgress();
      showError('Assembly failure: ' + e.message);
    }
  };

  window._downloadPDF = async () => {
    try {
       showProgress(20, 'Assembling PDF Container...');
       const printArea = document.getElementById('print-area');
       await generatePDF(printArea, proyek, showProgress);
       showSuccess('Legacy .pdf container downloaded.');
       setTimeout(hideProgress, 1000);
    } catch (e) {
       hideProgress();
       showError('Assembly failure: ' + e.message);
    }
  };
}

window._toggleGDocsExport = () => {
  const menu = document.getElementById('menu-gdocs-export');
  if (menu) menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
};

window._downloadGDocsWord = async (docId, proyekId, nama) => {
  const url = getGoogleDocsExportDocxUrl(docId);
  window.open(url, '_blank');
  document.getElementById('menu-gdocs-export').style.display = 'none';
  await saveReportVersion(proyekId, `LAPORAN_${nama}.docx`, url, { source: 'gdocs' });
};

window._downloadGDocsPdf = async (docId, proyekId, nama) => {
  const url = getGoogleDocsExportPdfUrl(docId);
  window.open(url, '_blank');
  document.getElementById('menu-gdocs-export').style.display = 'none';
  await saveReportVersion(proyekId, `LAPORAN_${nama}.pdf`, url, { source: 'gdocs' });
};

function initExportDropdown() {
  document.addEventListener('click', (e) => {
    const btn = document.getElementById('btn-global-export');
    if (btn && !btn.contains(e.target)) {
      const menu = document.getElementById('menu-gdocs-export');
      if (menu) menu.style.display = 'none';
    }
  });
}

// ── Fetchers ──────────────────────────────────────────────────

async function fetchProyek(id) {
  const { data } = await supabase.from('proyek').select('*').eq('id', id).maybeSingle();
  return data;
}

async function fetchLastAnalisis(proyekId) {
  const { data } = await supabase.from('hasil_analisis').select('*').eq('proyek_id', proyekId).order('created_at',{ascending:false}).limit(1);
  return data && data.length > 0 ? data[0] : null;
}

async function fetchChecklist(proyekId) {
  const { data } = await supabase.from('checklist_items').select('*').eq('proyek_id', proyekId);
  return data || [];
}

async function fetchStarredPhotos(proyekId) {
  const [{ data: clData }, { data: flData }] = await Promise.all([
    supabase.from('checklist_items').select('nama, aspek, foto_urls, metadata').eq('proyek_id', proyekId),
    supabase.from('proyek_files').select('*').eq('proyek_id', proyekId)
  ]);
  const photos = [];
  clData?.forEach(item => {
    if (item.metadata?.featured_photos) {
      item.metadata.featured_photos.forEach(url => photos.push({ url, nama: item.nama, aspek: item.aspek }));
    }
  });
  return photos;
}

function renderSkeleton() {
  return `
    <div class="card-quartz" style="height:200px; margin-bottom:40px"></div>
    <div class="card-quartz" style="height:600px"></div>
  `;
}

function escHtml(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function formatTanggalwTime(d) {
  try { return new Date(d).toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}); } 
  catch { return String(d); } 
}
