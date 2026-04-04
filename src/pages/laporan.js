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
import { generateDocx, generateDocxBlob } from '../lib/docx-service.js';
import { generatePDF } from '../lib/pdf-service.js';
import { parseNarasiAI, renderToHTML } from '../lib/report-formatter.js';
import { getSettings } from '../lib/settings.js';
import { signProject } from '../lib/tte-service.js';
import * as docxPreview from 'docx-preview';

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

  const [proyek, analisis, checklist, settings, starredPhotos, proyekFiles] = await Promise.all([
    fetchProyek(id),
    fetchLastAnalisis(id),
    fetchChecklist(id),
    getSettings(),
    fetchStarredPhotos(id),
    fetchProyekFiles(id)
  ]);

  if (!proyek) { navigate('proyek'); showError('Proyek tidak ditemukan.'); return ''; }
  
  window._reportPhotos = starredPhotos;

  const gdocStatus = await checkGoogleIntegration();
  const cachedDoc = getCachedDocId(id);

  const html = buildHtml(proyek, analisis, checklist, settings, gdocStatus, cachedDoc, proyekFiles);
  if (root) {
    root.innerHTML = html;
    initLaporanActions(proyek, analisis, checklist, settings, gdocStatus, cachedDoc, proyekFiles);
    initExportDropdown();
  }
  return html;
}

function buildHtml(proyek, analisis, checklist, settings, gdocStatus, cachedDoc, proyekFiles) {
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
        <div class="flex-between flex-stack" style="align-items: flex-start; gap:var(--space-6)">
          <div>
            <button class="btn btn-ghost btn-xs" onclick="window.navigate('proyek-detail',{id:'${proyek.id}'})" style="margin-bottom:12px; padding:0; color:var(--brand-300); font-weight:700; letter-spacing:1px">
              <i class="fas fa-arrow-left" style="margin-right:8px"></i> ${escHtml(proyek.nama_bangunan)}
            </button>
            <h1 class="page-title" style="font-family:'Outfit', sans-serif; font-weight:800; font-size: 2.2rem; letter-spacing:-0.02em; margin-bottom:4px">
              Synthesis <span class="text-gradient-gold">Laporan SLF</span>
            </h1>
            <div style="display:flex; align-items:center; gap:16px; flex-wrap:wrap">
              <p class="page-subtitle" style="font-family:var(--font-mono); font-size: 0.7rem; letter-spacing:1px; opacity:0.6; text-transform:uppercase">
                Automated Regulatory Compliance Documentation
              </p>
              <div style="background:hsla(158, 85%, 45%, 0.1); color:var(--success-400); border:1px solid hsla(158, 85%, 45%, 0.2); padding:2px 12px; border-radius:100px; font-size:9px; font-weight:800; display:flex; align-items:center; gap:6px; font-family:var(--font-mono)">
                <i class="fas fa-shield-check"></i> E-SIGNATURE VERIFIED
              </div>
            </div>
          </div>
          
          <div class="flex gap-3 flex-stack" style="width:auto">
             <button class="btn btn-outline" onclick="window._printReport()" style="height:44px; width:44px; border-radius:12px; padding:0">
                <i class="fas fa-print"></i>
             </button>
             <button class="btn btn-primary" id="btn-deep-forensic" style="height:44px; padding:0 20px; border-radius:12px; background: #0f172a; color:white; border:none">
                <i class="fas fa-microscope" style="margin-right:10px"></i> DEEP AUDIT
             </button>
             <button class="btn-presidential gold" id="btn-global-export" style="height:44px; padding:0 24px; border-radius:12px; width:auto">
                <i class="fas fa-cloud-arrow-down" style="margin-right:10px"></i> EXPORT
             </button>
          </div>
        </div>
        
        <!-- Document Mode Selector -->
        <div class="card-quartz" style="padding: 6px; margin-top: 32px; display: flex; gap: 8px; background: hsla(224, 25%, 4%, 0.6); flex-wrap: wrap">
          <button onclick="window._switchContentTab('tab-gdocs', this)" 
                  class="tab-item active"
                  style="flex:1; min-width:160px; height:44px; border:none; border-radius:10px; cursor:pointer; font-family:var(--font-mono); font-size:10px; font-weight:800; letter-spacing:1px; display:flex; align-items:center; justify-content:center; gap:10px; transition:all 0.3s">
            <i class="fas fa-cloud"></i> GOOGLE DOCS (CLOUD)
          </button>
          <button onclick="window._switchContentTab('tab-docx-preview', this); window._triggerDocxPreview()" 
                  class="tab-item"
                  id="btn-tab-docx-preview"
                  style="flex:1; min-width:160px; height:44px; border:none; border-radius:10px; cursor:pointer; font-family:var(--font-mono); font-size:10px; font-weight:800; letter-spacing:1px; display:flex; align-items:center; justify-content:center; gap:10px; transition:all 0.3s; position:relative">
            <i class="fas fa-file-word" style="color:#2b7cd3"></i> DOCX PREVIEW
            <span style="position:absolute; top:4px; right:8px; background:var(--brand-500); color:white; font-size:7px; padding:1px 5px; border-radius:4px; font-weight:900; letter-spacing:0.5px">NEW</span>
          </button>
          <button onclick="window._switchContentTab('tab-legacy', this)" 
                  class="tab-item"
                  style="flex:1; min-width:160px; height:44px; border:none; border-radius:10px; cursor:pointer; font-family:var(--font-mono); font-size:10px; font-weight:800; letter-spacing:1px; display:flex; align-items:center; justify-content:center; gap:10px; transition:all 0.3s">
            <i class="fas fa-desktop"></i> HTML PREVIEW
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

      <!-- DOCX Preview Tab (docx-preview library) -->
      <div id="tab-docx-preview" class="tab-content route-fade" style="display:none">
        ${renderDocxPreviewTab(proyek)}
      </div>

      <div id="tab-legacy" class="tab-content route-fade" style="display:none">
        ${renderLegacyTab(proyek, analisis, checklist, settings, proyekFiles)}
      </div>

    </div>
  `;
}

// ── DOCX PREVIEW TAB ─────────────────────────────────────────
// Merender file .docx langsung di browser menggunakan docx-preview library
// Tampilan identik dengan Microsoft Word: margin A4, tabel, font, heading, dsb.

function renderDocxPreviewTab(proyek) {
  return `
    <div style="display:grid; grid-template-columns:1fr; gap:16px">

      <!-- Control Bar -->
      <div class="card-quartz flex-between flex-stack" style="padding:12px 24px; background:hsla(224,25%,4%,0.6); border-color:hsla(220,20%,100%,0.05); gap:var(--space-4)">
        <div style="display:flex; align-items:center; gap:16px">
          <div style="width:40px; height:40px; background:hsla(210,95%,52%,0.1); border-radius:10px; display:flex; align-items:center; justify-content:center; color:#2b7cd3; border:1px solid hsla(210,95%,52%,0.25)">
            <i class="fas fa-file-word" style="font-size:1.1rem"></i>
          </div>
          <div>
            <div style="font-family:'Outfit',sans-serif; font-weight:800; font-size:0.95rem; color:white">DOCX LIVE PREVIEW</div>
            <div style="font-family:var(--font-mono); font-size:9px; color:var(--text-tertiary); text-transform:uppercase; letter-spacing:1px">Render identik dengan format Microsoft Word A4</div>
          </div>
        </div>
        <div class="flex gap-3">
          <button onclick="window._refreshDocxPreview()" id="btn-refresh-docx"
            style="height:36px; padding:0 16px; border-radius:10px; border:1px solid hsla(220,20%,100%,0.1); background:hsla(220,20%,100%,0.05); color:white; font-family:var(--font-mono); font-size:10px; font-weight:800; letter-spacing:1px; cursor:pointer; display:flex; align-items:center; gap:8px">
            <i class="fas fa-arrows-rotate"></i> REFRESH
          </button>
          
          <!-- Tombol TTE -->
          <button onclick="window._applyTteLaporan()"
            style="height:36px; padding:0 16px; border-radius:10px; border:none; background:linear-gradient(135deg, #3b82f6, #2563eb); color:white; font-family:var(--font-mono); font-size:10px; font-weight:800; letter-spacing:1px; cursor:pointer; display:flex; align-items:center; gap:8px; box-shadow:0 4px 12px hsla(210,95%,52%,0.2)">
            <i class="fas fa-signature"></i> TERAPKAN TTE
          </button>

          <button onclick="window._downloadDocxFromPreview('${proyek.id}', '${escHtml(proyek.nama_bangunan)}')"
            style="height:36px; padding:0 12px; border-radius:10px; border:none; background:hsla(210,95%,52%,0.1); color:#2b7cd3; font-family:var(--font-mono); font-size:9px; font-weight:800; letter-spacing:1px; cursor:pointer; display:flex; align-items:center; gap:6px">
            <i class="fas fa-file-export"></i> HASIL .docx
          </button>

          <div style="width:1px; height:24px; background:hsla(220,20%,100%,0.1)"></div>

          <!-- Group Template -->
          <div class="flex gap-2">
            <button onclick="window._downloadDocxTemplate('${proyek.id}')" id="btn-download-tpl"
              title="Download Template Word Aktif"
              style="height:36px; width:36px; border-radius:10px; border:1px solid hsla(160,80%,50%,0.15); background:hsla(160,80%,50%,0.05); color:#22c55e; cursor:pointer; display:flex; align-items:center; justify-content:center">
              <i class="fas fa-file-download"></i>
            </button>
            <button onclick="window._uploadDocxTemplate('${proyek.id}')" id="btn-upload-tpl"
              title="Upload Template Word Kustom (.docx)"
              style="height:36px; padding:0 12px; border-radius:10px; border:none; background:hsla(160,80%,50%,0.15); color:#22c55e; font-family:var(--font-mono); font-size:9px; font-weight:800; letter-spacing:1px; cursor:pointer; display:flex; align-items:center; gap:6px">
              <i class="fas fa-file-upload"></i> TEMPLATE
            </button>
          </div>

          <button onclick="window._printDocxPreview()"
            style="height:36px; width:36px; border-radius:10px; border:none; background:hsla(0,0%,100%,0.05); color:white; cursor:pointer; display:flex; align-items:center; justify-content:center">
            <i class="fas fa-print"></i>
          </button>
          
          <input type="file" id="tpl-file-input" accept=".docx" style="display:none" />
        </div>
      </div>

      <!-- Preview zoom controls -->
      <div class="card-quartz" style="padding:8px 16px; background:hsla(224,25%,4%,0.4); border-color:hsla(220,20%,100%,0.04); display:flex; align-items:center; gap:12px">
        <span style="font-family:var(--font-mono); font-size:9px; color:var(--text-tertiary); letter-spacing:1px">ZOOM</span>
        <button onclick="window._zoomDocx(-10)" style="width:28px; height:28px; border-radius:6px; border:1px solid hsla(220,20%,100%,0.1); background:transparent; color:white; cursor:pointer; font-size:1rem">−</button>
        <span id="docx-zoom-label" style="font-family:var(--font-mono); font-size:10px; color:var(--brand-300); font-weight:800; min-width:40px; text-align:center">100%</span>
        <button onclick="window._zoomDocx(+10)" style="width:28px; height:28px; border-radius:6px; border:1px solid hsla(220,20%,100%,0.1); background:transparent; color:white; cursor:pointer; font-size:1rem">+</button>
        <div style="width:1px; height:20px; background:hsla(220,20%,100%,0.1); margin:0 4px"></div>
        <button onclick="window._zoomDocx(0)" style="height:28px; padding:0 12px; border-radius:6px; border:1px solid hsla(220,20%,100%,0.1); background:transparent; color:var(--text-tertiary); cursor:pointer; font-family:var(--font-mono); font-size:9px; letter-spacing:1px">RESET</button>
        <div style="flex:1"></div>
        <span id="docx-page-info" style="font-family:var(--font-mono); font-size:9px; color:var(--text-tertiary); letter-spacing:1px"></span>
      </div>

      <!-- DOCX Render Area -->
      <div class="card-quartz" style="padding:0; overflow:hidden; background:#e8e8e8; min-height:85vh; position:relative">

        <!-- Loading State -->
        <div id="docx-preview-loading" style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:85vh; gap:20px">
          <div style="width:70px; height:70px; background:hsla(210,95%,52%,0.1); border-radius:16px; display:flex; align-items:center; justify-content:center; border:1px solid hsla(210,95%,52%,0.2)">
            <i class="fas fa-file-word fa-beat" style="font-size:2rem; color:#2b7cd3"></i>
          </div>
          <div style="text-align:center">
            <div style="font-family:'Outfit',sans-serif; font-weight:800; color:white; font-size:1.1rem; margin-bottom:8px">Generating DOCX Preview</div>
            <div style="font-family:var(--font-mono); font-size:10px; color:var(--text-tertiary); letter-spacing:1px">Merender dokumen Word A4...</div>
          </div>
          <div style="width:200px; height:4px; background:hsla(220,20%,100%,0.1); border-radius:4px; overflow:hidden">
            <div id="docx-progress-bar" style="width:0%; height:100%; background:#2b7cd3; border-radius:4px; transition:width 0.3s; animation:bar-flow 1.5s ease-in-out infinite"></div>
          </div>
        </div>

        <!-- Error State (hidden by default) -->
        <div id="docx-preview-error" style="display:none; flex-direction:column; align-items:center; justify-content:center; height:85vh; gap:16px; padding:40px">
          <i class="fas fa-triangle-exclamation" style="font-size:3rem; color:var(--warning-400)"></i>
          <div style="text-align:center">
            <div style="font-family:'Outfit',sans-serif; font-weight:800; color:white; margin-bottom:8px">Preview Tidak Tersedia</div>
            <div id="docx-preview-error-msg" style="font-family:var(--font-mono); font-size:10px; color:var(--text-tertiary); max-width:400px; line-height:1.6"></div>
          </div>
          <button onclick="window._refreshDocxPreview()" style="height:36px; padding:0 24px; border-radius:10px; border:1px solid hsla(220,20%,100%,0.15); background:transparent; color:white; cursor:pointer; font-family:var(--font-mono); font-size:10px; font-weight:800">
            <i class="fas fa-rotate" style="margin-right:8px"></i>COBA LAGI
          </button>
        </div>

        <!-- Document Render Container -->
        <div id="docx-render-container" style="display:none; grid-template-columns: 280px 1fr; background:#e8e8e8; height:85vh">
          
          <!-- Navigation Sidebar -->
          <div id="docx-nav-sidebar" class="no-print" style="background:#f8fafc; border-right:1px solid #cbd5e1; overflow-y:auto; padding:20px; display:flex; flex-direction:column; gap:8px; box-shadow: inset -5px 0 15px rgba(0,0,0,0.02)">
            <div style="font-family:'Outfit',sans-serif; font-weight:800; font-size:0.7rem; color:#64748b; text-transform:uppercase; letter-spacing:1px; margin-bottom:12px; display:flex; align-items:center; gap:8px">
              <i class="fas fa-list-ul"></i> NAVIGATION PANE
            </div>
            <div id="docx-nav-list" style="display:flex; flex-direction:column; gap:4px">
               <div style="font-size:8pt; color:#94a3b8; font-style:italic; padding:10px; text-align:center">Extracting document structure...</div>
            </div>
          </div>

          <!-- Main Scrollable Area -->
          <div style="overflow-y:auto; padding:32px 16px; flex:1">
            <div id="docx-render-target" style="transform-origin:top center; transition:transform 0.2s"></div>
          </div>
        </div>
      </div>

      <!-- Info bar -->
      <div style="display:flex; align-items:center; gap:8px; padding:0 4px">
        <i class="fas fa-circle-info" style="color:var(--brand-400); font-size:0.75rem"></i>
        <span style="font-family:var(--font-mono); font-size:9px; color:var(--text-tertiary); letter-spacing:1px">
          Tampilan DOCX PREVIEW merender file Word (.docx) secara langsung. Format, margin, tabel, dan font identik dengan Microsoft Word.
          Untuk edit: gunakan tab Google Docs atau download file.
        </span>
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
      <div class="card-quartz flex-between flex-stack" style="padding:12px 24px; background: hsla(224, 25%, 4%, 0.6); border-color: hsla(220, 20%, 100%, 0.05); gap:var(--space-4)">
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
          
          <div style="position:relative; display:flex; gap:8px">
            <button class="btn btn-outline btn-sm" onclick="window._openTemplateSetup()" style="border-radius:10px; font-weight:700; background:hsla(220, 20%, 100%, 0.05); color:var(--brand-300)">
              <i class="fas fa-file-invoice" style="margin-right:8px"></i> TEMPLATE SETUP
            </button>

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
      
      <!-- Signature Modal Root -->
      <div id="sig-modal-container"></div>

    </div>
  `;
}

function renderLegacyTab(proyek, analisis, checklist, settings, proyekFiles) {
  const sections = [
    { id: 'cover', icon: 'fa-book', label: 'Cover Laporan' },
    { id: 'intro', icon: 'fa-feather', label: 'Kata Pengantar' },
    { id: 'bab1', icon: 'fa-building', label: 'Bab I: Gambaran' },
    { id: 'bab2', icon: 'fa-search', label: 'Bab II: Metodologi' },
    { id: 'bab3', icon: 'fa-clipboard-check', label: 'Bab III: Hasil Pemeriksaan' },
    { id: 'bab4', icon: 'fa-brain', label: 'Bab IV: Analisis Teknis' },
    { id: 'bab5', icon: 'fa-certificate', label: 'Bab V: Kesimpulan' },
    { id: 'bab6', icon: 'fa-list-check', label: 'Bab VI: Rekomendasi' },
    { id: 'pengesahan', icon: 'fa-file-signature', label: 'Pengesahan' },
  ];

  // Helper status and date
  const statusLabels = {
    'LAIK_FUNGSI': 'LAIK FUNGSI',
    'LAIK_FUNGSI_BERSYARAT': 'LAIK FUNGSI BERSYARAT',
    'TIDAK_LAIK_FUNGSI': 'TIDAK LAIK FUNGSI',
    'DALAM_PENGKAJIAN': 'DALAM PENGKAJIAN'
  };
  const currentDateId = new Date().toLocaleDateString('id-ID', {day:'numeric', month:'long', year:'numeric'});
  const slfStatus = analisis ? (statusLabels[analisis.status_slf] || analisis.status_slf) : 'BELUM DIANALISIS';
  const narasi = analisis ? analisis.narasi_teknis : '_Analysis narrative pending neural synthesis._';
  
  // Custom Styles untuk A4 Page Simulator
  const styleInject = `
    <style id="doc-engine-styles">
      .doc-engine-wrapper {
        background: hsla(220, 20%, 95%, 0.1);
        padding: 40px 0;
        font-family: 'Times New Roman', Times, serif;
      }
      .a4-page {
        background: white;
        width: 210mm;
        min-height: 297mm;
        margin: 0 auto 40px auto;
        padding: 30mm 25mm 25mm 30mm; /* A4 Standard Margins */
        box-shadow: 0 15px 35px rgba(0,0,0,0.5);
        color: black;
        box-sizing: border-box;
        position: relative;
        line-height: 1.5;
        font-size: 11pt;
      }
      .a4-page h1, .a4-page h2, .a4-page h3 {
        font-family: 'Helvetica', 'Arial', sans-serif;
        color: #1e3a8a;
      }
      .a4-page table {
        width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 20px; font-size: 10pt;
        border-top: 2px solid #000; border-bottom: 2px solid #000;
      }
      .a4-page th, .a4-page td {
        border: 1px solid #000; padding: 8px; text-align: left;
      }
      .a4-page th {
        background-color: #f1f5f9; text-align: center;
      }
      .page-footer {
        position: absolute; bottom: 15mm; left: 25mm; right: 20mm;
        border-top: 1.5px solid #1e3a8a; padding-top: 5mm;
        font-size: 8pt; color: #1e3a8a; display: flex; justify-content: space-between;
        font-family: 'Helvetica', 'Arial', sans-serif;
      }
      
      /* PROFESSIONAL COVER STYLES */
      .cover-container {
        display: flex; flex-direction: column; height: 100%; position: relative;
        border: 1px solid #e2e8f0; padding: 15mm; overflow: hidden;
      }
      .cover-blueprint-bg {
        position: absolute; inset: 0; opacity: 0.08; z-index: 0;
        background-image: radial-gradient(#1e3a8a 0.5px, transparent 0.5px);
        background-size: 20px 20px;
      }
      .cover-header {
        display: flex; justify-content: space-between; align-items: center;
        border-bottom: 1px solid #1e3a8a; padding-bottom: 5mm; margin-bottom: 20mm; z-index: 1;
      }
      .cover-title-group {
        text-align: center; margin-bottom: 30mm; z-index: 1;
      }
      .cover-main-title {
        font-size: 28pt; font-weight: 900; color: #1a365d; line-height: 1.1; margin-bottom: 10mm;
        letter-spacing: -0.02em; text-transform: uppercase;
      }
      .cover-subtitle {
        font-size: 16pt; font-weight: 700; color: #4a5568; margin-bottom: 5mm;
      }
      .cover-info-grid {
        display: grid; grid-template-columns: 140px 1fr; gap: 8px; text-align: left;
        margin: auto 0 20mm 0; font-size: 11pt; z-index: 1;
      }
      .cover-label { font-weight: 800; color: #718096; text-transform: uppercase; font-size: 9pt; }
      .cover-value { font-weight: 700; color: #2d3748; }

      /* ANALYSIS VISUALS */
      .risk-matrix {
        display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; width: 180px; height: 180px;
      }
      .risk-cell {
        aspect-ratio: 1; border: 1px solid white; display: flex; align-items: center; justify-content: center;
        font-size: 8pt; font-weight: 800;
      }
      .compliance-gauge {
        width: 120px; height: 120px;
      }
      @media print {
        body * { visibility: hidden; }
        .doc-engine-wrapper, .doc-engine-wrapper * { visibility: visible; }
        .doc-engine-wrapper { padding: 0; background: none; position: absolute; left: 0; top: 0; width: 100%; }
        .a4-page { 
           margin: 0; box-shadow: none; border: none; page-break-after: always;
           width: 100%; height: 100%; padding: 0mm; /* Printer handles margins */
        }
      }

      /* SIGNATURE PAD OVERLAY (ADAPTED FROM SURAT PERNYATAAN) */
      .sig-modal-overlay { position: fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); backdrop-filter:blur(20px); z-index:20000; display:none; align-items:center; justify-content:center; }
      .sig-modal-overlay.show { display: flex; animation: sig-fade-in 0.3s ease-out; }
      .sig-modal-card { background:hsl(224, 25%, 4%); border:1px solid hsla(220, 20%, 100%, 0.1); border-radius:30px; width:540px; padding:32px; box-shadow:0 30px 80px rgba(0,0,0,0.8); }
      .sig-modal-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:24px; }
      .sig-modal-header h3 { font-family:'Outfit',sans-serif; font-weight:800; font-size:1.2rem; margin:0; color:white; }
      .btn-close-sig { background:none; border:none; font-size:1.8rem; cursor:pointer; color:var(--text-tertiary); }
      .sig-canvas-wrap { border:2px dashed hsla(220, 20%, 100%, 0.1); border-radius:20px; background:hsla(224, 25%, 4%, 0.5); cursor:crosshair; margin-bottom:32px; overflow:hidden; }
      .sig-modal-footer { display:flex; justify-content:space-between; gap:16px; }
      @keyframes sig-fade-in { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
      
      /* SIGN BUTTONS IN DOC */
      .btn-sign-here { 
        padding: 6px 16px; border-radius:10px; background:hsla(220, 95%, 52%, 0.1); color:var(--brand-400); 
        border:1px dashed hsla(220, 95%, 52%, 0.3); font-size:10px; font-weight:800; cursor:pointer; 
        transition:all 0.3s; margin-top:12px;
        display: inline-flex; align-items:center; gap:8px; font-family:var(--font-mono); letter-spacing:1px;
      }
      .btn-sign-here:hover { background:var(--brand-500); color:white; transform: translateY(-2px); box-shadow: 0 10px 20px hsla(220, 95%, 52%, 0.2); }

      /* DOCX NAVIGATION PANE STYLES */
      .btn-nav-item {
        position: relative;
        overflow: hidden;
      }
      .btn-nav-item::before {
        content: '';
        position: absolute;
        left: 0; top: 50%; transform: translateY(-50%);
        width: 3px; height: 0;
        background: var(--brand-500);
        transition: height 0.3s ease;
      }
      .btn-nav-item.active::before {
        height: 70%;
      }
      .btn-nav-item:hover {
        background: white !important;
        transform: translateX(5px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.05);
      }
      #docx-nav-sidebar::-webkit-scrollbar {
        width: 4px;
      }
      #docx-nav-sidebar::-webkit-scrollbar-thumb {
        background: #cbd5e1;
        border-radius: 10px;
      }
    </style>
  `;

  return `
    ${styleInject}
    <div class="grid-side-main">
      <!-- Left Anchor Nav -->
      <div class="no-print">
        <div class="card-quartz" style="padding:24px; position:sticky; top:20px">
          <div style="font-family:var(--font-mono); font-size:10px; font-weight:800; color:var(--text-tertiary); text-transform:uppercase; letter-spacing:2px; margin-bottom:24px">STRUCTURE NAVIGATION</div>
          <div style="display:flex; flex-direction:column; gap:8px">
            ${sections.map((s) => `
              <button class="btn btn-ghost" style="width:100%; justify-content:flex-start; height:40px; font-weight:700; font-size:0.85rem; padding:0 16px; border-radius:10px" onclick="document.getElementById('lap-${s.id}').scrollIntoView({ behavior: 'smooth', block: 'start' })">
                <i class="fas ${s.icon}" style="margin-right:12px; width:20px; color:var(--brand-400)"></i> ${s.label}
              </button>
            `).join('')}
          </div>
          <div style="margin-top:32px; padding-top:24px; border-top:1px solid hsla(220, 20%, 100%, 0.05)">
            <button class="btn-presidential gold" onclick="window._printReport()" style="width:100%; justify-content:center; font-size:11px">
              <i class="fas fa-print" style="margin-right:8px"></i> PRINT TO PDF
            </button>
          </div>
        </div>
      </div>

      <!-- Right Document Engine -->
      <div class="doc-engine-wrapper" id="print-area-wrapper">
        
        <!-- PAGE 1: PROFESSIONAL COVER (TECH VARIANT) -->
        <div class="a4-page" id="lap-cover">
          <div class="cover-container">
            <div class="cover-blueprint-bg"></div>
            <div class="cover-header">
              <div style="display:flex; align-items:center; gap:10px">
                <div style="width:40px; height:40px; background:#1e3a8a; border-radius:8px; display:flex; align-items:center; justify-content:center; color:white">
                  <i class="fas fa-building-shield"></i>
                </div>
                <div style="font-size:12pt; font-weight:900; color:#1e3a8a">GOVTECH<br><span style="font-size:7pt; opacity:0.7">SLF DIVISION</span></div>
              </div>
              <div style="text-align:right">
                <div style="font-size:10pt; font-weight:800; color:#1e3a8a; text-transform:uppercase">${escHtml(settings.consultant?.name || 'PT. KONSULTAN TEKNIK NASIONAL')}</div>
                <div style="font-size:7pt; color:#64748b">Engineering License: ${escHtml(settings.consultant?.license || 'NIB-812000...')}</div>
              </div>
            </div>

            <div class="cover-title-group">
              <div style="width:100px; height:4px; background:#1e3a8a; margin:0 auto 15mm"></div>
              <h1 class="cover-main-title">
                LAPORAN KAJIAN TEKNIS<br>
                KELAIKAN FUNGSI<br>
                BANGUNAN GEDUNG
              </h1>
              <div class="cover-subtitle">${escHtml(proyek.nama_bangunan)}</div>
              <div style="font-size:12pt; color:#64748b; font-weight:600">${escHtml(proyek.kota || 'KABUPATEN/KOTA')}, ${escHtml(proyek.provinsi || 'PROVINSI')}</div>
            </div>

            <div style="flex:1; display:flex; align-items:center; justify-content:center; margin-bottom:20mm">
               <!-- SVG Engineering Grid Illustration -->
               <svg viewBox="0 0 400 200" style="width:100%; max-width:500px; opacity:0.15">
                  <path d="M0 100 H400 M100 0 V200 M200 0 V200 M300 0 V200" stroke="#1e3a8a" stroke-width="1"/>
                  <circle cx="200" cy="100" r="80" fill="none" stroke="#1e3a8a" stroke-width="0.5"/>
                  <rect x="150" y="50" width="100" height="100" fill="none" stroke="#1e3a8a" stroke-width="2"/>
               </svg>
            </div>

            <div class="cover-info-grid">
              <span class="cover-label">Pemilik</span> <span class="cover-value">: ${escHtml(proyek.pemilik)}</span>
              <span class="cover-label">Konsultan</span> <span class="cover-value">: ${escHtml(settings.consultant?.name || '-')}</span>
              <span class="cover-label">Tahun</span> <span class="cover-value">: ${new Date().getFullYear()}</span>
              <span class="cover-label">Dokumen ID</span> <span class="cover-value">: SLF/${proyek.id.substring(0,8).toUpperCase()}/${new Date().getFullYear()}</span>
            </div>

            <div style="border-top:1px solid #e2e8f0; padding-top:10mm; display:flex; justify-content:space-between; align-items:flex-end">
              <div style="font-size:8pt; color:#64748b; font-family:var(--font-mono)">
                ${escHtml(settings.consultant?.address || 'Alamat Kantor Konsultan Terdaftar')}
              </div>
              <div style="width:20mm; height:20mm; border:1px solid #1e3a8a; padding:2px">
                <img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent('VERIFY:'+proyek.id)}" style="width:100%">
              </div>
            </div>
          </div>
        </div>

        <!-- PAGE 1.1: KATA PENGANTAR -->
        <div class="a4-page" id="lap-intro">
          <h1 style="text-align:center; margin-bottom:15mm">KATA PENGANTAR</h1>
          <p style="text-align:justify; text-indent:15mm; margin-bottom:8mm">
            Puji syukur kami panjatkan ke hadirat Tuhan Yang Maha Esa atas tersusunnya Laporan Kajian Teknis Kelaikan Fungsi Bangunan Gedung (SLF) untuk <b>${escHtml(proyek.nama_bangunan)}</b>. Laporan ini disusun sebagai manifestasi kepatuhan terhadap regulasi penyelenggaraan bangunan gedung di Indonesia.
          </p>
          <p style="text-align:justify; margin-bottom:8mm">
            Dokumen ini merangkum seluruh hasil observasi lapangan, audit administratif, dan analisis teknis rekayasa terhadap komponen arsitektur, struktur, serta mekanikal, elektrikal, dan plambing (MEP). Proses pengkajian dilakukan dengan mengacu pada <b>Peraturan Pemerintah Nomor 16 Tahun 2021</b> dan standar teknis SNI yang berlaku untuk memastikan tingkat keandalan bangunan dalam aspek keselamatan, kesehatan, kenyamanan, dan kemudahan.
          </p>
          <p style="text-align:justify; margin-bottom:15mm">
            Kami mengucapkan terima kasih kepada semua pihak yang telah membantu kelancaran proses audit teknis ini. Semoga laporan ini dapat menjadi acuan bagi pemangku kepentingan dalam menjaga performa dan keberlanjutan fungsi bangunan gedung.
          </p>
          
          <div style="margin-left:auto; width:60mm; text-align:center; margin-top:20mm">
            ${escHtml(proyek.kota || 'Jakarta')}, ${currentDateId}<br>
            <b>Direktur Utama</b><br><br><br><br>
            <u>${escHtml(settings.consultant?.director_name || 'Nama Direktur')}</u>
          </div>
          
          <div class="page-footer">
            <span>Kajian Teknis SLF Professional v3.0</span>
            <span>Hal. i</span>
          </div>
        </div>

        <!-- PAGE 2: BAB I -->
        <div class="a4-page" id="lap-bab1">
          <h1 style="text-align:center; margin-bottom:15mm">BAB I<br>GAMBARAN UMUM</h1>
          
          <h2 style="font-size:14pt; margin-bottom:5mm">1.1. Latar Belakang</h2>
          <p style="text-align:justify; margin-bottom:10mm">Penilaian kelaikan fungsi bangunan gedung merupakan kewajiban yang diamanatkan dalam Peraturan Pemerintah Nomor 16 Tahun 2021 tentang Peraturan Pelaksanaan Undang-Undang Nomor 28 Tahun 2002 tentang Bangunan Gedung. Kajian ini bertujuan untuk memastikan bahwa bangunan gedung memenuhi persyaratan teknis yang mencakup aspek keselamatan, kesehatan, kenyamanan, dan kemudahan.</p>
          
          <h2 style="font-size:14pt; margin-bottom:5mm">1.2. Maksud dan Tujuan</h2>
          <ol style="margin-bottom:10mm; text-align:justify">
            <li>Menilai kelengkapan dokumen administratif bangunan gedung.</li>
            <li>Mengevaluasi kondisi teknis eksisting bangunan gedung terhadap persyaratan standar.</li>
            <li>Menentukan kelayakan fungsi bangunan gedung untuk penerbitan SLF.</li>
            <li>Menyusun rekomendasi teknis untuk perbaikan atau peningkatan kinerja bangunan.</li>
          </ol>

          <h2 style="font-size:14pt; margin-bottom:5mm">1.3. Ruang Lingkup</h2>
          <ul style="margin-bottom:10mm; text-align:justify">
            <li><b>Administrasi:</b> Kelengkapan dokumen perizinan (PBG/IMB, SLF, dll).</li>
            <li><b>Struktur:</b> Evaluasi kondisi elemen struktur.</li>
            <li><b>Arsitektur:</b> Penilaian selubung bangunan, tata ruang, dan finishing.</li>
            <li><b>MEP:</b> Audit instalasi mekanikal, elektrikal, plambing.</li>
            <li><b>Keselamatan Kebakaran:</b> Proteksi aktif dan pasif.</li>
          </ul>

          <h2 style="font-size:14pt; margin-bottom:5mm">1.4. Data Bangunan</h2>
          <table style="margin-bottom:10mm">
             <tr><th style="width:35%">Faktor</th><th>Keterangan</th></tr>
             <tr><td>Nama Bangunan</td><td><b>${escHtml(proyek.nama_bangunan)}</b></td></tr>
             <tr><td>Fungsi Bangunan</td><td>${escHtml(proyek.fungsi_bangunan || '-')}</td></tr>
             <tr><td>Lokasi / Alamat</td><td>${escHtml(proyek.alamat)}, ${escHtml(proyek.kota)}, ${escHtml(proyek.provinsi)}</td></tr>
             <tr><td>Posisi Geografis</td><td>Lat: ${proyek.lat || '-'} | Long: ${proyek.long || '-'}</td></tr>
             <tr><td>Pemilik</td><td>${escHtml(proyek.pemilik)}</td></tr>
             <tr><td>Luas / Lantai</td><td>${proyek.luas_bangunan} m² / ${proyek.jumlah_lantai || '-'} Lantai</td></tr>
             <tr><td>Tahun Konstruksi</td><td>${proyek.tahun_pembangunan || '-'}</td></tr>
          </table>

          <h2 style="font-size:14pt; margin-bottom:5mm">1.5. Urgensi Kelaikan Fungsi</h2>
          <p style="text-align:justify">
            Sebagai bangunan dengan fungsi <b>${escHtml(proyek.fungsi_bangunan || 'Umum')}</b>, keandalan aspek keselamatan dan kesehatan menjadi prioritas utama bagi pengguna dan publik. Pemenuhan SLF menjamin bahwa risiko kegagalan struktur maupun sistem utilitas telah dimitigasi secara sistematis.
          </p>
          
          <div class="page-footer">
            <span>Kajian Teknis SLF Professional v3.0</span>
            <span>Hal. 1</span>
          </div>
        </div>

        <!-- PAGE 3: BAB II -->
        <div class="a4-page" id="lap-bab2">
          <h1 style="text-align:center; margin-bottom:15mm">BAB II<br>METODOLOGI PEMERIKSAAN</h1>
          
          <h2 style="font-size:14pt; margin-bottom:5mm">2.1. Pendekatan Analisis</h2>
          <p style="text-align:justify; margin-bottom:10mm">Kajian teknis bangunan gedung ini dilakukan menggunakan pendekatan multi-layer yang mengintegrasikan beberapa metode evaluasi:</p>
          <ol style="margin-bottom:10mm; text-align:justify">
            <li><b>Rule-based Analysis:</b> Evaluasi berbasis aturan mengacu pada NSPK PUPR, khususnya PP No. 16/2021.</li>
            <li><b>Risk-based Assessment:</b> Penilaian berbasis risiko yang mengidentifikasi dampak potensial ketidaksesuaian.</li>
            <li><b>Performance-based Evaluation:</b> Evaluasi kinerja mengacu pada SNI 9273:2025.</li>
            <li><b>AI-based Diagnostics:</b> Pemeriksaan menggunakan engine kecerdasan buatan Smart AI Pengkaji SLF v1.0.</li>
          </ol>

          <h2 style="font-size:14pt; margin-bottom:5mm">2.2. Sumber Data Pemeriksaan</h2>
          <ul style="margin-bottom:10mm; text-align:justify">
             <li>Dokumen administratif (IMB/PBG, As-built drawing, dll).</li>
             <li>Hasil observasi visual lapangan (Visual assessment).</li>
             <li>Hasil pengujian Non-Destructive Test (NDT) jika dilakukan.</li>
          </ul>

          <h2 style="font-size:14pt; margin-bottom:5mm">2.3. Matriks Penilaian</h2>
          <p style="text-align:justify; margin-bottom:5mm">Metode pembobotan menggunakan skala 0-100 dengan klasifikasi akhir status SLF sebagai berikut:</p>
          <table>
             <tr><th style="width:20%">Skor</th><th style="width:30%">Status</th><th>Deskripsi</th></tr>
             <tr><td style="text-align:center">>= 80</td><td style="color:#065f46; font-weight:bold">Laik Fungsi</td><td>Bangunan aman beroperasi tanpa syarat perbaikan signifikan.</td></tr>
             <tr><td style="text-align:center">60 - 79</td><td style="color:#92400e; font-weight:bold">Laik Fungsi Bersyarat</td><td>Beroperasi namun wajib memenuhi masa perbaikan (remedy time).</td></tr>
             <tr><td style="text-align:center">< 60</td><td style="color:#991b1b; font-weight:bold">Tidak Laik Fungsi</td><td>Berbahaya. Izin operasi ditangguhkan hingga perbaikan mayor.</td></tr>
          </table>

          <div class="page-footer">
            <span>${escHtml(settings.consultant?.name || 'Sistem Ahli')} - Kajian SLF</span>
            <span>Hal. 2</span>
          </div>
        </div>

        <!-- PAGE 4: BAB III (HASIL PEMERIKSAAN) -->
        <div class="a4-page" id="lap-bab3">
          <h1 style="text-align:center; margin-bottom:15mm">BAB III<br>HASIL PEMERIKSAAN TEKNIS</h1>
          
          <div style="display:flex; justify-content:space-around; margin-bottom:15mm; background:#f8fafc; padding:20px; border:1px solid #e2e8f0; border-radius:10px">
             <div style="text-align:center">
                <div style="font-size:8pt; font-weight:800; color:#64748b; margin-bottom:5px">COMPLIANCE RATE</div>
                <div style="font-size:24pt; font-weight:900; color:#1e3a8a">${Math.round((checklist.filter(c => c.status === 'Sesuai').length / (checklist.length || 1)) * 100)}%</div>
             </div>
             <div style="text-align:center">
                <div style="font-size:8pt; font-weight:800; color:#64748b; margin-bottom:5px">ITEMS AUDITED</div>
                <div style="font-size:24pt; font-weight:900; color:#1e3a8a">${checklist.length}</div>
             </div>
          </div>

          <h2 style="font-size:14pt; margin-bottom:5mm">3.1. Pemenuhan Aspek Tata Bangunan</h2>
          <p style="font-size:10pt; margin-bottom:5mm">Evaluasi kesesuaian peruntukan lahan, GSB, KDB, KLB, dan kualitas arsitektur selubung bangunan.</p>
          ${renderLegacyChecklistTable(checklist.filter(c => ['administrasi', 'pemanfaatan', 'arsitektur'].includes(c.kategori)), proyekFiles)}
          
          <div style="background:#f1f5f9; padding:10px; border-radius:5px; font-size:9pt; font-style:italic">
             <b>Analisis Singkat:</b> Ditemukan ${checklist.filter(c => ['administrasi', 'pemanfaatan', 'arsitektur'].includes(c.kategori) && c.status !== 'Sesuai').length} poin ketidaksesuaian pada aspek Tata Bangunan yang memerlukan tindak lanjut administratif.
          </div>

          <h1 style="break-before:page; display:none"></h1> <!-- Split if needed -->

          <h2 style="font-size:14pt; margin-bottom:5mm; margin-top:10mm">3.2. Pemenuhan Aspek Keandalan Bangunan</h2>
          <p style="font-size:10pt; margin-bottom:5mm">Audit sistem keselamatan, kesehatan, kenyamanan, dan kemudahan utilitas gedung.</p>
          ${renderLegacyChecklistTable(checklist.filter(c => ['struktur', 'mep', 'kebakaran', 'kesehatan', 'kenyamanan', 'kemudahan'].includes(c.kategori)), proyekFiles)}

          <div class="page-footer">
            <span>Kajian Teknis SLF Professional v3.0</span>
            <span>Hal. 3</span>
          </div>
        </div>


        <!-- PAGE 5: BAB IV (ANALISIS AI) -->
        <div class="a4-page" id="lap-bab4">
          <h1 style="text-align:center; margin-bottom:15mm">BAB IV<br>ANALISIS DAN EVALUASI TEKNIS</h1>
          
          <div style="background:#f8fafc; border-left: 5px solid #1e3a8a; padding:20px; margin-bottom:20px">
             <div style="font-family:'Helvetica',sans-serif; font-size:11pt; font-weight:800; color:#1e3a8a; text-transform:uppercase; margin-bottom:5mm">Kewenangan Engine Analisis</div>
             <p style="text-align:justify; margin:0">Sistem Kecerdasan Buatan (Smart AI Pengkaji) telah melakukan sintesis terhadap ${checklist.length} parameter pemeriksaan dengan metodologi 6-Langkah Forensik. Analisis ini mengintegrasikan korelasi antar sistem bangunan untuk menentukan tingkat reliabilitas gedung.</p>
          </div>

          <div class="markdown-content" style="text-align:justify; margin-bottom:10mm">
             ${marked.parse(narasi)}
          </div>

          <h2 style="font-size:14pt; margin-bottom:8mm; margin-top:15mm">4.2. Analisis Global & Distribusi Risiko</h2>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:30px; margin-bottom:10mm">
             <div>
                <p style="font-size:9pt; text-align:justify; margin-bottom:10mm">Sebaran risiko didasarkan pada matriks frekuensi temuan dan signifikansi dampaknya terhadap keselamatan jiwa. Konsentrasi temuan berada pada area kritis bangunan.</p>
                <div class="risk-matrix">
                   <div class="risk-cell" style="background:#fef2f2; color:#ef4444">H</div>
                   <div class="risk-cell" style="background:#fef2f2; color:#ef4444">H</div>
                   <div class="risk-cell" style="background:#ef4444; color:white">CR</div>
                   <div class="risk-cell" style="background:#fff7ed; color:#f97316">M</div>
                   <div class="risk-cell" style="background:#fff7ed; color:#f97316">M</div>
                   <div class="risk-cell" style="background:#fef2f2; color:#ef4444">H</div>
                   <div class="risk-cell" style="background:#f0fdf4; color:#22c55e">L</div>
                   <div class="risk-cell" style="background:#f0fdf4; color:#22c55e">L</div>
                   <div class="risk-cell" style="background:#fff7ed; color:#f97316">M</div>
                </div>
                <div style="font-size:7pt; color:#64748b; margin-top:5px">Matriks 3x3: Likelihood vs Impact</div>
             </div>
             <div style="background:#f8fafc; padding:15px; border-radius:8px">
                <div style="font-size:10pt; font-weight:800; color:#1e3a8a; margin-bottom:10px">Statistik Temuan</div>
                <div style="font-size:9pt">
                   <div style="display:flex; justify-content:space-between; padding:5px 0; border-bottom:1px solid #e2e8f0"><span>Risiko Tinggi (High)</span> <b style="color:#ef4444">${checklist.filter(c => c.status !== 'Sesuai' && (c.kategori === 'struktur' || c.kategori === 'kebakaran')).length}</b></div>
                   <div style="display:flex; justify-content:space-between; padding:5px 0; border-bottom:1px solid #e2e8f0"><span>Risiko Sedang (Med)</span> <b style="color:#f97316">${checklist.filter(c => c.status !== 'Sesuai' && !['struktur', 'kebakaran'].includes(c.kategori)).length}</b></div>
                   <div style="display:flex; justify-content:space-between; padding:5px 0"><span>Kepatuhan Global</span> <b>${Math.round((checklist.filter(c => c.status === 'Sesuai').length / (checklist.length || 1)) * 100)}%</b></div>
                </div>
             </div>
          </div>

          <h2 style="font-size:14pt; margin-bottom:8mm; margin-top:15mm">4.3. Detil Analisis Forensik Komponen Kritis</h2>
          <p style="font-size:9pt; margin-bottom:8mm; text-align:justify">Berikut adalah narasi evaluasi teknis mendalam untuk setiap komponen yang teridentifikasi memiliki anomali atau risiko tinggi. Analisis ini mengintegrasikan temuan faktual lapangan dengan standar regulasi rekayasa (NSPK/SNI).</p>
          ${renderForensicAnalysisNarrative(checklist.filter(c => c.status !== 'Sesuai'), proyekFiles)}

          <div class="page-footer">
            <span>Kajian Teknis SLF Professional v3.0</span>
            <span>Hal. 4</span>
          </div>
        </div>

        <!-- PAGE 6: BAB V (KESIMPULAN) & BAB VI (REKOMENDASI) -->
        <div class="a4-page" id="lap-bab5">
          <h1 style="text-align:center; margin-bottom:15mm" id="lap-bab5-anchor">BAB V<br>KESIMPULAN</h1>
          <p style="text-align:justify; margin-bottom:10mm">Berdasarkan hasil evaluasi komprehensif terhadap seluruh parameter keandalan gedung, meliputi aspek Tata Bangunan dan Keandalan Bangunan (Keselamatan, Kesehatan, Kenyamanan, dan Kemudahan) pada <b>${escHtml(proyek.nama_bangunan)}</b>, maka diputuskan status kelaikan akhir sebagai berikut:</p>
          
          <div style="text-align:center; padding: 20mm; border: 4px double #1e3a8a; margin-bottom:25mm; background:#f8fafc; position:relative">
             <div style="font-size:10pt; color:#64748b; font-weight:800; margin-bottom:5mm; letter-spacing:2px">HASIL KEPUTUSAN KELAIKAN (VONIS)</div>
             <h2 style="font-size:28pt; margin:0; letter-spacing:1px; color:${analisis?.status_slf?.includes('TIDAK') ? '#991b1b' : analisis?.status_slf?.includes('BERSYARAT') ? '#92400e' : '#065f46'}">${slfStatus}</h2>
          </div>

          <h1 style="text-align:center; margin-bottom:15mm" id="lap-bab6">BAB VI<br>TEMUAN DAN REKOMENDASI</h1>
          <h2 style="font-size:14pt; margin-bottom:5mm">6.1. Narasi Temuan Strategis</h2>
          <p style="text-align:justify; margin-bottom:10mm">Secara teknis, perbaikan mendesak diprioritaskan pada sistem yang berkaitan langsung dengan keselamatan jiwa (Life Safety). Temuan kritikal harus diselesaikan sesuai jangka waktu yang ditetapkan.</p>

          <h2 style="font-size:14pt; margin-bottom:5mm">6.2. Matriks Rekomendasi Teknis</h2>
          <table style="font-size:8pt; width:100%; border-collapse:collapse">
             <tr style="background:#f1f5f9">
                <th style="width:10%; padding:8px; border:1px solid #000">Prioritas</th><th style="width:30%; padding:8px; border:1px solid #000">Temuan / Masalah</th><th style="width:40%; padding:8px; border:1px solid #000">Rekomendasi Tindakan</th><th style="width:20%; padding:8px; border:1px solid #000">Target Waktu</th>
             </tr>
             ${checklist.filter(c => c.status !== 'Sesuai').slice(0, 8).map(i => `
               <tr>
                  <td style="text-align:center; font-weight:800; color:${['struktur', 'kebakaran'].includes(i.kategori) ? '#ef4444':'#f97316'}; padding:8px; border:1px solid #000">${['struktur', 'kebakaran'].includes(i.kategori) ? 'TINGGI' : 'SEDANG'}</td>
                  <td style="padding:8px; border:1px solid #000"><b>${escHtml(i.nama)}</b><br>${escHtml(i.keterangan || '-')}</td>
                  <td style="padding:8px; border:1px solid #000">${escHtml(i.rekomendasi || 'Melakukan perbaikan sesuai standar SNI relevan.')}</td>
                  <td style="text-align:center; padding:8px; border:1px solid #000">${['struktur', 'kebakaran'].includes(i.kategori) ? '7 Hari' : '30 Hari'}</td>
               </tr>
             `).join('')}
             ${checklist.filter(c => c.status !== 'Sesuai').length === 0 ? '<tr><td colspan="4" style="text-align:center; font-style:italic; padding:10px; border:1px solid #000">Tidak ditemukan temuan kritikal. Bangunan dalam kondisi prima.</td></tr>' : ''}
          </table>

          <div class="page-footer">
            <span>Kajian Teknis SLF Professional v3.0</span>
            <span>Hal. 5</span>
          </div>
        </div>


        <!-- PAGE 7: LEMBAR PENGESAHAN (TTE ENABLED) -->
        <div class="a4-page" id="lap-pengesahan">
          <h1 style="text-align:center; margin-bottom:20mm">LEMBAR PENGESAHAN<br>TIM PENGKAJI TEKNIS</h1>
          
          <p style="text-align:justify; margin-bottom:15mm">Laporan kajian teknis kelaikan fungsi bangunan gedung <b>${escHtml(proyek.nama_bangunan)}</b> ini disusun secara profesional dan objektif sesuai dengan NSPK dan standar rekayasa. Anggota tim Tenaga Ahli Pengkaji Teknis:</p>
          
          <table style="margin-bottom:25mm">
             <tr>
                <th style="width:5%">No</th><th style="width:45%">Nama Tenaga Ahli</th><th style="width:50%">Tanda Tangan Elektronik (TTE)</th>
             </tr>
             ${Object.entries(settings.experts || {}).map(([type, exp], i) => {
               const sig = proyek.metadata?.signatures?.[type];
               const verifyUrl = `${window.location.origin}${window.location.pathname}#/verify?id=${proyek.id}&expert=${type}`;
               const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(verifyUrl)}`;
               
               return `
                 <tr>
                   <td style="text-align:center">${i+1}</td>
                   <td>
                     <b style="font-size:12pt">${escHtml(exp.name || 'NAMA AHLI')}</b><br>
                     <span style="font-size:9pt; color:#6b7280">Aspek: ${type.toUpperCase()} | SKK: ${escHtml(exp.ska || exp.skk || '-')}</span>
                   </td>
                   <td style="text-align:center; padding:15px">
                     <div style="position:relative; width:100px; height:100px; margin:0 auto; display:flex; align-items:center; justify-content:center">
                       <img src="${qrUrl}" style="width:100%; height:100%; border:1px solid #1a365d; background:white; opacity:${sig ? 0.4 : 1}">
                       ${sig ? `
                         <div style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center">
                            <img src="${sig.image}" style="width:110px; transform:rotate(-5deg); filter:contrast(1.2) drop-shadow(0 2px 4px rgba(0,0,0,0.1))">
                         </div>
                         <div style="position:absolute; bottom:-15px; left:50%; transform:translateX(-50%); width:max-content">
                            <div style="border: 1px solid #3b82f6; display:inline-block; padding: 2px 6px; border-radius:4px; background:#eff6ff">
                              <span style="font-size:7pt; font-weight:900; color:#1e40af">TTE VERIFIED</span>
                            </div>
                         </div>
                       ` : `
                         <div class="no-print" style="position:absolute; bottom:-10px; left:50%; transform:translateX(-50%); width:max-content">
                           <button class="btn-sign-here" onclick="window._openSigPad('${type}')">Tanda Tangani Digitas</button>
                         </div>
                       `}
                     </div>
                   </td>
                 </tr>
               `;
             }).join('')}
          </table>

          <div style="width:50%; margin-left:auto; text-align:center; font-family:'Helvetica', sans-serif">
             <div style="margin-bottom:10mm">
                Ditetapkan di: <b>${escHtml(proyek.kota || 'Kota/Kab')}</b><br>
                Tanggal: <b>${currentDateId}</b>
             </div>
             
             <div style="font-weight:bold; margin-bottom:5mm">${escHtml(settings.consultant?.name || 'Sistem Ahli')}</div>
             
             <div style="margin-bottom:10mm">
               <div style="position:relative; width:120px; height:120px; margin:0 auto; display:flex; align-items:center; justify-content:center">
                 <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(window.location.origin + window.location.pathname + '#/verify?id=' + proyek.id + '&expert=director')}" 
                      style="width:100%; height:100%; border:1px solid #1a365d; background:white; opacity:${proyek.metadata?.signatures?.director ? 0.4 : 1}">
                 ${proyek.metadata?.signatures?.director ? `
                   <div style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center">
                      <img src="${proyek.metadata.signatures.director.image}" style="width:130px; transform:rotate(-4deg); filter:contrast(1.2)">
                   </div>
                   <div style="position:absolute; bottom:-12px; left:50%; transform:translateX(-50%); width:max-content">
                      <div style="border: 1px solid #3b82f6; display:inline-block; padding: 3px 10px; border-radius:4px; background:#eff6ff">
                        <span style="font-size:8pt; font-weight:900; color:#1e40af">OFFICIAL SEAL</span>
                      </div>
                   </div>
                 ` : `
                   <div class="no-print" style="position:absolute; bottom:-10px; left:50%; transform:translateX(-50%); width:max-content">
                      <button class="btn-sign-here" onclick="window._openSigPad('director')" style="background:var(--brand-500); color:white">Tanda Tangani (DIREKTUR)</button>
                   </div>
                 `}
               </div>
             </div>
             
             <div style="font-size:9pt; margin-bottom:2mm">DIREKTUR UTAMA</div>
             <div style="font-weight:bold; text-decoration:underline">${escHtml(settings.consultant?.director_name || 'NAMA DIREKTUR PIMPINAN')}</div>
          </div>

          <div class="page-footer">
            <span>${escHtml(settings.consultant?.name || 'Sistem Ahli')} - Kajian SLF</span>
            <span>Hal. 6</span>
          </div>
        </div>

      </div> <!-- /#print-area-wrapper -->
    </div>
  `;
}


function renderLegacyChecklistTable(items, proyekFiles = []) {
  if (!items || items.length === 0) return '<p style="font-style:italic; font-size:9pt; margin-bottom:10px">Data aspek ini belum terisi atau tidak tersedia dalam manifest.</p>';
  return `
    <table style="width:100%; border-collapse:collapse; font-size:9pt; color:#000; margin-bottom:15px">
      <thead>
        <tr style="background:#f1f5f9">
          <th style="padding:10px; border:1px solid #000; text-align:center; width:10%">KODE</th>
          <th style="padding:10px; border:1px solid #000; text-align:left; width:35%">KOMPONEN PEMERIKSAAN</th>
          <th style="padding:10px; border:1px solid #000; text-align:center; width:15%">STATUS</th>
          <th style="padding:10px; border:1px solid #000; text-align:center; width:40%">BUKTI VISUAL & REFERENSI NSPK</th>
        </tr>
      </thead>
      <tbody>
        ${items.map(i => {
          // Cari bukti relevan (Foto Lapangan atau NSPK)
          const relevantEvidence = (proyekFiles || []).filter(f => 
            (f.category === 'lapangan' || f.category === 'nspk' || f.category === i.kategori) &&
            (f.name.toLowerCase().includes(i.nama.toLowerCase()) || i.kategori === f.category)
          ).slice(0, 3); // Maksimal 3 bukti per baris agar tidak berlebihan

          return `
            <tr>
              <td style="padding:8px; border:1px solid #000; text-align:center; font-family:monospace; font-size:8pt">${i.kode || i.id.substring(0,5).toUpperCase()}</td>
              <td style="padding:8px; border:1px solid #000">
                <div style="font-weight:800; color:#1a365d">${escHtml(i.nama)}</div>
                <div style="font-size:7.5pt; color:#475569; margin-top:4px; line-height:1.2">${escHtml(i.hasil || i.keterangan || '-')}</div>
              </td>
              <td style="padding:8px; border:1px solid #000; text-align:center">
                <div style="font-weight:900; font-size:8pt; padding:4px; border:1px solid ${i.status === 'Sesuai' || i.status === 'OK' ? '#059669' : '#dc2626'}; color:${i.status === 'Sesuai' || i.status === 'OK' ? '#059669' : '#dc2626'}; background:${i.status === 'Sesuai' || i.status === 'OK' ? '#f0fdf4' : '#fef2f2'}; border-radius:4px">
                  ${escHtml(i.status || '-').toUpperCase()}
                </div>
              </td>
              <td style="padding:8px; border:1px solid #000">
                <div style="display:flex; gap:6px; flex-wrap:wrap; justify-content:center">
                  ${relevantEvidence.map(ev => `
                    <div style="text-align:center; width:65px">
                      <div style="width:65px; height:45px; border:1px solid #e2e8f0; border-radius:3px; overflow:hidden; background:#f8fafc; margin-bottom:2px">
                        <img src="${ev.file_url}" style="width:100%; height:100%; object-fit:cover" onerror="this.src='https://placehold.co/100x70?text=DOC'">
                      </div>
                      <div style="font-size:5.5pt; color:#64748b; white-space:nowrap; overflow:hidden; text-overflow:ellipsis" title="${escHtml(ev.name)}">
                        ${ev.category === 'nspk' ? '<b>[RGA]</b>' : '<b>[LAP]</b>'} ${escHtml(ev.name).substring(0,8)}
                      </div>
                    </div>
                  `).join('')}
                  ${relevantEvidence.length === 0 ? '<span style="font-size:7pt; color:#cbd5e1; font-style:italic">Tidak ada lampiran spesifik</span>' : ''}
                </div>
              </td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;
}

function renderForensicAnalysisNarrative(items, proyekFiles = []) {
  if (!items || items.length === 0) return '<p style="font-style:italic; font-size:9pt; margin-top:20px; border:1px dashed #cbd5e1; padding:15px; text-align:center; border-radius:8px">Bangunan dalam kondisi prima. Tidak ditemukan anomali atau komponen kritis yang memerlukan audit forensik mendalam.</p>';
  
  return items.map(i => {
    const dr = i.metadata?.deep_reasoning || {};
    const isDeep = !!dr.last_run;
    
    let relevantFiles = (proyekFiles || []).filter(f => 
      (dr.evidence_ref && f.name.includes(dr.evidence_ref)) ||
      ((f.category === 'lapangan' || f.category === 'nspk') && f.name.toLowerCase().includes(i.nama.toLowerCase()))
    ).slice(0, 3);

    return `
      <div style="margin-bottom:35px; border:1px solid #e2e8f0; border-radius:12px; overflow:hidden; background:white; page-break-inside:avoid">
        <!-- Header: Parameter Info -->
        <div style="background:#f8fafc; padding:12px 20px; border-bottom:1px solid #e5e7eb; display:flex; justify-content:space-between; align-items:center">
          <div>
            <div style="font-size:11pt; font-weight:900; color:#1a365d; text-transform:uppercase; letter-spacing:0.5px">${escHtml(i.nama)}</div>
            <div style="font-family:var(--font-mono); font-size:7pt; color:#64748b; margin-top:2px">ID: ${i.kode || i.id.substring(0,8).toUpperCase()} | Aspek: ${escHtml(i.aspek || 'Umum')}</div>
          </div>
          <div style="padding:4px 12px; border-radius:6px; background:${isDeep ? '#ecfdf5' : '#f1f5f9'}; border:1px solid ${isDeep ? '#10b981' : '#cbd5e1'}">
             <span style="font-size:7pt; font-weight:800; color:${isDeep ? '#065f46' : '#64748b'}">${isDeep ? 'AUDITED: DEEP REASONING' : 'PRELIMINARY ANALYSIS'}</span>
          </div>
        </div>

        <div style="display:flex; flex-wrap:wrap">
          <!-- Left Content: Technical Narrative -->
          <div style="flex:1; min-width:300px; padding:20px; border-right:1px solid #f1f5f9">
            ${isDeep ? `
              <p style="font-size:9pt; line-height:1.6; text-align:justify; margin-bottom:15px; color:#334155">
                <b>I. Identifikasi & Temuan Faktual:</b><br>
                ${escHtml(dr.faktual || '-')}
              </p>
              <div style="background:#f1f5f9; padding:12px; border-radius:8px; border-left:4px solid #1e40af; margin-bottom:15px">
                 <p style="font-size:9pt; line-height:1.5; color:#1e3a8a; margin:0">
                   <b>II. Interpretasi Standar & Regulasi:</b><br>
                   ${escHtml(dr.interpretasi || '-')}
                 </p>
              </div>
              <p style="font-size:9pt; line-height:1.6; text-align:justify; margin-bottom:15px; color:#334155">
                <b>III. Analisis Teknis & Penilaian Risiko:</b><br>
                ${escHtml(dr.analisis || '-')}
                <br><br>
                <span style="display:inline-block; padding:4px 10px; background:#fff7ed; border:1px solid #f97316; border-radius:4px; font-weight:700; color:#9a3412">
                   VONIS RISIKO: ${escHtml(dr.risiko || 'SEDANG')}
                </span>
              </p>
              <div style="border-top:1px dashed #e2e8f0; padding-top:15px">
                <p style="font-size:9pt; line-height:1.6; color:#1e3a8a">
                  <b>IV. Kesimpulan & Rekomendasi Mitigasi:</b><br>
                  ${dr.kesimpulan && dr.kesimpulan !== '-' ? `<b>Vonis Akhir:</b> ${escHtml(dr.kesimpulan)}<br>` : ''}
                  <b>Langah Teknis:</b> ${escHtml(dr.rekomendasi || '-')}
                </p>
              </div>
            ` : `
              <div style="padding:40px 20px; text-align:center; background:#fafafa; border:1px dashed #e2e8f0; border-radius:8px">
                 <i class="fas fa-microchip" style="font-size:24pt; color:#cbd5e1; margin-bottom:15px"></i>
                 <div style="font-size:9pt; color:#64748b; line-height:1.4">
                   Data analisis forensik sedang menunggu sinkronisasi audit.<br>
                   Klik <b>DEEP AUDIT</b> di header laporan untuk mengaktifkan AI Forensic Engine.
                 </div>
              </div>
            `}
          </div>

          <!-- Right Content: Evidence Sidebar -->
          <div style="width:180px; background:#f8fafc; padding:20px; border-left:1px solid #e5e7eb">
            <div style="font-size:7pt; font-weight:800; color:#64748b; text-transform:uppercase; margin-bottom:15px; border-bottom:1px solid #e2e8f0; padding-bottom:5px">EVIDENCE LOG</div>
            
            <div style="display:flex; flex-direction:column; gap:12px">
               ${relevantFiles.map(ev => `
                 <div style="text-align:center">
                    <div style="width:100%; height:80px; border:1px solid #cbd5e1; border-radius:6px; overflow:hidden; background:white; box-shadow:0 2px 5px rgba(0,0,0,0.05); cursor:pointer" 
                         onclick="window.showAIOverlay('Membuka Berkas ${escHtml(ev.name)}')">
                       <img src="${ev.file_url}" style="width:100%; height:100%; object-fit:cover" onerror="this.src='https://placehold.co/200x150?text=IMG'">
                    </div>
                    <div style="font-size:5.5pt; font-weight:900; color:#1e40af; margin-top:5px; text-transform:uppercase">${ev.category === 'nspk' ? '[RUK] ' : '[LAP] '}${escHtml(ev.name).substring(0,12)}</div>
                 </div>
               `).join('')}
               ${relevantFiles.length === 0 ? '<div style="font-size:7pt; color:#94a3b8; font-style:italic; text-align:center">No visual evidence linked</div>' : ''}
            </div>

            <div style="margin-top:20px; padding-top:15px; border-top:1px solid #e2e8f0">
               <div style="font-size:7pt; font-weight:800; color:#64748b; margin-bottom:6px">STANDAR ACUAN:</div>
               <div style="font-size:7.5pt; font-weight:900; color:#111827; font-family:'Outfit',sans-serif; line-height:1.2; background:white; padding:6px; border:1px solid #e2e8f0; border-radius:4px">
                  ${escHtml(dr.regulation_ref || '[AUTONOMOUS_REF]')}
               </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
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

  // ── DOCX PREVIEW ENGINE ─────────────────────────────────────
  // State
  let _docxBlob   = null;
  let _docxZoom   = 100;
  let _previewDone = false;

  const _showDocxLoading = () => {
    const l = document.getElementById('docx-preview-loading');
    const r = document.getElementById('docx-render-container');
    const e = document.getElementById('docx-preview-error');
    if (l) l.style.display = 'flex';
    if (r) r.style.display = 'none';
    if (e) e.style.display = 'none';
    // Animate progress bar
    let pct = 0;
    const bar = document.getElementById('docx-progress-bar');
    const prog = setInterval(() => {
      pct = Math.min(pct + 8, 90);
      if (bar) bar.style.width = pct + '%';
      if (pct >= 90) clearInterval(prog);
    }, 200);
    return prog;
  };

  const _showDocxRender = () => {
    const l = document.getElementById('docx-preview-loading');
    const r = document.getElementById('docx-render-container');
    const bar = document.getElementById('docx-progress-bar');
    if (l) l.style.display = 'none';
    if (bar) bar.style.width = '100%';
    if (r) r.style.display = 'grid';
    _previewDone = true;
    // Count pages
    const pages = document.querySelectorAll('#docx-render-target .docx-wrapper section');
    const info  = document.getElementById('docx-page-info');
    if (info) info.textContent = pages.length ? `${pages.length} HALAMAN` : '';
  };

  const _showDocxError = (msg) => {
    const l = document.getElementById('docx-preview-loading');
    const e = document.getElementById('docx-preview-error');
    const m = document.getElementById('docx-preview-error-msg');
    if (l) l.style.display = 'none';
    if (e) e.style.display = 'flex';
    if (m) m.textContent = msg;
  };

  const _applyZoom = () => {
    const target = document.getElementById('docx-render-target');
    const label  = document.getElementById('docx-zoom-label');
    if (target) target.style.transform = `scale(${_docxZoom / 100})`;
    if (label)  label.textContent = `${_docxZoom}%`;
  };

  window._zoomDocx = (delta) => {
    if (delta === 0) {
      _docxZoom = 100;
    } else {
      _docxZoom = Math.max(50, Math.min(200, _docxZoom + delta));
    }
    _applyZoom();
  };

  const _renderDocxBlob = async (blob) => {
    const target = document.getElementById('docx-render-target');
    if (!target) return;
    target.innerHTML = '';

    await docxPreview.renderAsync(blob, target, null, {
      className:                 'docx-render-output',
      inWrapper:                 true,
      ignoreWidth:               false,
      ignoreHeight:              false,
      ignoreFonts:               false,
      breakPages:                true,
      ignoreLastRenderedPageBreak: false,
      experimental:              false,
      trimXmlDeclaration:        true,
      useBase64URL:              false,
      renderHeaders:             true,
      renderFooters:             true,
      renderFootnotes:           true,
      renderEndnotes:            true,
    });

    _docxBlob = blob;
    _showDocxRender();
    _applyZoom();
    
    // Update Navigation Pane
    setTimeout(() => {
      _updateDocxNavigation();
    }, 1000); // Tunggu rendering selesai
  };

  const _updateDocxNavigation = () => {
    const target = document.getElementById('docx-render-target');
    const navList = document.getElementById('docx-nav-list');
    if (!target || !navList) return;

    // Cari elemen-elemen yang merupakan judul BAB (biasanya teks CAPS LOCK atau bold besar)
    // docx-preview merender h1, h2, h3 jika ada, atau p dengan style tertentu.
    const headings = Array.from(target.querySelectorAll('h1, h2, h3, p')).filter(el => {
      const text = el.textContent.trim();
      // Pola: "BAB I", "BAB II", "KATA PENGANTAR", "DAFTAR ISI", "LAMPIRAN"
      return /^(BAB [IVX]+|KATA PENGANTAR|DAFTAR ISI|LAMPIRAN [A-Z])/i.test(text) || 
             (el.tagName.startsWith('H') && text.length > 3);
    });

    if (headings.length === 0) {
      navList.innerHTML = '<div style="font-size:8pt; color:#94a3b8; padding:10px; text-align:center">No structural headings found.</div>';
      return;
    }

    navList.innerHTML = '';
    headings.forEach((h, idx) => {
      const text = h.textContent.trim();
      const id = `docx-h-${idx}`;
      h.setAttribute('id', id);

      const btn = document.createElement('button');
      btn.className = 'btn-nav-item';
      btn.style.cssText = `
        width: 100%; text-align: left; padding: 10px 12px; border: none; background: transparent; 
        border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 10px;
        transition: all 0.2s; color: #475569; font-family: var(--font-mono); font-size: 9px; font-weight: 700;
      `;
      
      const isBab = /^BAB/i.test(text);
      if (isBab) btn.style.color = '#1e40af';
      
      btn.innerHTML = `
        <i class="fas ${isBab ? 'fa-bookmark' : 'fa-circle'}" style="font-size:0.6rem; opacity:0.6"></i>
        <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex:1">${text}</span>
      `;

      btn.onmouseenter = () => { btn.style.background = 'white'; btn.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)'; };
      btn.onmouseleave = () => { btn.style.background = 'transparent'; btn.style.boxShadow = 'none'; };
      btn.onclick = () => {
        h.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // Highlight active
        document.querySelectorAll('.btn-nav-item').forEach(b => b.style.borderLeft = 'none');
        btn.style.borderLeft = '3px solid #3b82f6';
      };

      navList.appendChild(btn);
    });
  };

  const _scrollToDocxHeading = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  window._triggerDocxPreview = async () => {
    if (_previewDone && _docxBlob) return; // Sudah dirender, tidak perlu ulang
    _showDocxLoading();
    try {
      const { blob } = await generateDocxBlob(proyek, analisis, checklist, null);
      await _renderDocxBlob(blob);
    } catch (err) {
      console.error('[DocxPreview]', err);
      _showDocxError(`Gagal merender DOCX: ${err.message}. Pastikan seluruh data analisis sudah tersedia.`);
    }
  };

  window._refreshDocxPreview = async () => {
    _previewDone = false;
    _docxBlob   = null;
    _showDocxLoading();
    try {
      const { blob } = await generateDocxBlob(proyek, analisis, checklist, null);
      await _renderDocxBlob(blob);
      showSuccess('DOCX Preview berhasil diperbarui.');
    } catch (err) {
      _showDocxError(`Gagal refresh: ${err.message}`);
    }
  };

  window._applyTteLaporan = () => {
    // Membuka modal Canvas Signature seperti di Surat Pernyataan
    if (window._openSigPad) {
      window._openSigPad('director');
      
      // Override default behavior on btn-save-sig-actual to also refresh Docx Preview
      // because originally it refreshes the whole page to the Google Docs tab.
      const btnSave = document.getElementById('btn-save-sig-actual');
      if (btnSave) {
        const originalOnClick = btnSave.onclick;
        btnSave.onclick = async (e) => {
          // Call original implementation first (which authenticates and saves image to DB)
          // Wait, original implementation in laporan.js has setTimeout(() => navigate(...), 500)
          // We don't want to navigate away. We'll replace the block or just let it navigate for now.
          // Let's rely on the fact that signProject works, but we should prevent page reload if possible.
          
          const canvas = document.getElementById('sig-canvas');
          if (!canvas) return;
          const image = canvas.toDataURL('image/png');
          showProgress(30, 'Finalizing Electronic Signature...');
          try {
            const { signProject } = await import('../lib/tte-service.js');
            await signProject(proyek.id, 'director', supabase);
            
            const { data: currentProyek } = await supabase.from('proyek').select('metadata').eq('id', proyek.id).single();
            const updatedMetadata = currentProyek.metadata;
            updatedMetadata.signatures['director'].image = image;
            
            await supabase.from('proyek').update({ metadata: updatedMetadata }).eq('id', proyek.id);
            Object.assign(proyek, currentProyek); // Update local reference
            
            showSuccess('Laporan berhasil ditandatangani dan disegel secara digital.');
            document.getElementById('sig-modal-container').innerHTML = ''; // Close Modal
            hideProgress();
            
            // Refresh Docx Preview
            await window._refreshDocxPreview();
          } catch (err) {
            hideProgress();
            showError('Signing failure: ' + err.message);
          }
        };
      }
    } else {
      showError("Sistem Tanda Tangan Kanvas belum dimuat.");
    }
  };

  window._downloadDocxFromPreview = async (proyekId, namaBangunan) => {
    try {
      if (!_docxBlob) {
        showInfo('Sedang menyiapkan file DOCX...');
        const { blob } = await generateDocxBlob(proyek, analisis, checklist, null);
        _docxBlob = blob;
      }
      const { saveAs } = await import('file-saver');
      const tanggal = new Date().toISOString().split('T')[0];
      saveAs(_docxBlob, `Laporan_SLF_${namaBangunan}_${tanggal}.docx`);
      showSuccess('File DOCX berhasil diunduh!');
    } catch (err) {
      showError('Gagal download: ' + err.message);
    }
  };

  window._downloadDocxTemplate = async (proyekId) => {
    const tplBase64 = proyek.metadata?.report_template_base64;
    if (!tplBase64) {
      showInfo('Proyek ini belum menggunakan template kustom.');
      return;
    }
    try {
      const binaryString = window.atob(tplBase64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      const { saveAs } = await import('file-saver');
      saveAs(blob, `TEMPLATE_SLF_${proyek.nama_bangunan.replace(/\s+/g,'_')}.docx`);
      showSuccess('Template kustom berhasil diunduh.');
    } catch (err) {
      showError('Gagal mengunduh template: ' + err.message);
    }
  };

  window._uploadDocxTemplate = (proyekId) => {
    const input = document.getElementById('tpl-file-input');
    if (!input) return;
    
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      if (!file.name.endsWith('.docx')) {
        showError('Format file harus .docx (Microsoft Word)');
        return;
      }

      showProgress(20, 'Membaca file template...');
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          showProgress(50, 'Sinkronisasi template ke server...');
          const base64 = event.target.result.split(',')[1];
          
          const { data: current } = await supabase.from('proyek').select('metadata').eq('id', proyekId).single();
          const meta = current?.metadata || {};
          meta.report_template_base64 = base64;
          
          const { error } = await supabase.from('proyek').update({ metadata: meta }).eq('id', proyekId);
          if (error) throw error;
          
          proyek.metadata = meta; // Update local state
          showSuccess('Template kustom berhasil diterapkan pada proyek ini.');
          hideProgress();
          
          // Refresh Preview
          window._refreshDocxPreview();
        } catch (err) {
          hideProgress();
          showError('Gagal mengunggah template: ' + err.message);
        }
      };
      reader.readAsDataURL(file);
    };
    
    input.click();
  };

  window._printDocxPreview = () => {
    const container = document.getElementById('docx-render-target');
    if (!container || !_previewDone) {
      showInfo('DOCX belum dirender. Buka tab DOCX Preview terlebih dahulu.');
      return;
    }
    // Print hanya area docx-render-target
    const printWin = window.open('', '_blank');
    printWin.document.write(`
      <html>
        <head>
          <title>Laporan SLF — ${escHtml(proyek.nama_bangunan)}</title>
          <style>
            body { margin: 0; padding: 0; font-family: Calibri, serif; }
            .docx-wrapper { box-shadow: none !important; }
            section { page-break-after: always; }
          </style>
          <link rel="stylesheet" href="${location.origin}/docx-preview/dist/docx-preview.css" onerror="void(0)">
        </head>
        <body>
          ${container.innerHTML}
        </body>
      </html>
    `);
    printWin.document.close();
    printWin.focus();
    setTimeout(() => { printWin.print(); }, 800);
  };
  // ── END DOCX PREVIEW ENGINE ──────────────────────────────────

  window._runForensicAudit = async () => {
    if (!confirm('Apakah Anda yakin ingin menjalankan Audit Forensik 6-Langkah (Deep Reasoning) pada semua temuan?')) return;
    
    try {
      showProgress(5, 'Menyiapkan Mesin Audit Forensik...');
      
      const { data: items, error } = await supabase
        .from('checklist_items')
        .select('id, nama')
        .eq('proyek_id', proyek.id)
        .neq('status', 'Sesuai');
        
      if (error) throw error;
      if (!items || items.length === 0) {
        showInfo('Tidak ada temuan kritis yang perlu diaudit.');
        return;
      }

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const pct = Math.floor((i / items.length) * 90) + 5;
        showProgress(pct, `Menganalisis [${i+1}/${items.length}]: ${item.nama}...`);
        await window.forensicUseCase.execute(item.id);
      }

      showProgress(100, 'Audit Forensik Selesai.');
      showSuccess(`${items.length} temuan telah dianalisis secara mendalam.`);
      setTimeout(() => navigate('laporan', { id: proyek.id }), 800);
    } catch (e) {
      console.error('[Forensic] Audit failure:', e);
      showError('Gagal menjalankan audit: ' + e.message);
      hideProgress();
    }
  };

  const btnDeep = document.getElementById('btn-deep-forensic');
  if (btnDeep) btnDeep.onclick = window._runForensicAudit;

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

  window._openSigPad = (type) => {
    const container = document.getElementById('sig-modal-container');
    const roleMap = { director: 'Direktur Utama', architecture: 'Ahli Arsitektur', structure: 'Ahli Struktur', mep: 'Ahli MEP / Utilitas' };
    const roleName = roleMap[type] || 'Tenaga Ahli';

    if (!container) return;
    
    container.innerHTML = `
      <div class="sig-modal-overlay show">
        <div class="sig-modal-card">
          <div class="sig-modal-header">
             <h3>Tanda Tangani Laporan Kajian: ${roleName}</h3>
             <button class="btn-close-sig" onclick="this.closest('.sig-modal-overlay').classList.remove('show')">&times;</button>
          </div>
          <p style="color:var(--text-tertiary); font-size:0.8rem; margin-bottom:16px; font-family:var(--font-mono)">Silakan gambar tanda tangan Anda di dalam kotak di bawah ini.</p>
          <div class="sig-canvas-wrap">
             <canvas id="sig-canvas" style="touch-action:none"></canvas>
          </div>
          <div class="sig-modal-footer">
             <button class="btn btn-outline" style="border-radius:12px; height:48px; border-color:hsla(0,0%,100%,0.1)" onclick="document.getElementById('sig-canvas').getContext('2d').clearRect(0,0,500,200)">
                <i class="fas fa-eraser"></i> BERSIHKAN
             </button>
             <button id="btn-save-sig-actual" class="btn-presidential gold" style="height:48px; padding:0 32px; border-radius:12px; font-size:0.85rem">
                <i class="fas fa-signature"></i> SIMPAN & FINALISASI TTE
             </button>
          </div>
        </div>
      </div>
    `;

    const canvas = document.getElementById('sig-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = 500;
    canvas.height = 200;
    
    let drawing = false;
    const getPos = (e) => {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.clientX || e.touches?.[0].clientX;
      const clientY = e.clientY || e.touches?.[0].clientY;
      return { x: clientX - rect.left, y: clientY - rect.top };
    };

    const startDraw = (e) => { drawing = true; const { x, y } = getPos(e); ctx.beginPath(); ctx.moveTo(x, y); e.preventDefault(); };
    const stopDraw = () => { drawing = false; ctx.beginPath(); };
    const draw = (e) => {
      if (!drawing) return;
      const { x, y } = getPos(e);
      ctx.lineWidth = 3; 
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#0284c7'; // Professional blue ink
      ctx.lineTo(x, y);
      ctx.stroke();
      e.preventDefault();
    };

    canvas.addEventListener('mousedown', startDraw);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDraw);
    canvas.addEventListener('touchstart', startDraw);
    canvas.addEventListener('touchmove', draw);
    canvas.addEventListener('touchend', stopDraw);

    document.getElementById('btn-save-sig-actual').onclick = async () => {
      const image = canvas.toDataURL('image/png');
      showProgress(30, 'Finalizing Electronic Signature...');
      try {
        // Enforce cryptographic sealing using signProject
        const res = await signProject(proyek.id, type, supabase);
        
        // Add the image to the signature record
        const { data: currentProyek } = await supabase.from('proyek').select('metadata').eq('id', proyek.id).single();
        const updatedMetadata = currentProyek.metadata;
        updatedMetadata.signatures[type].image = image;
        
        await supabase.from('proyek').update({ metadata: updatedMetadata }).eq('id', proyek.id);
        
        showSuccess('Laporan berhasil ditandatangani dan disegel secara digital.');
        setTimeout(() => navigate('laporan', { id: proyek.id }), 500);
      } catch (e) {
        hideProgress();
        showError('Signing failure: ' + e.message);
      }
    };
  };

  window._signExpert = async (type) => {
    if (!confirm(`Apakah Anda yakin ingin menandatangani laporan ini sebagai ${type.toUpperCase()}?`)) return;
    try {
      showProgress(20, 'Authenticating Digital Identity...');
      const res = await signProject(proyek.id, type, supabase);
      showSuccess('Tanda Tangan Elektronik (TTE) berhasil dibubuhkan.');
      setTimeout(() => navigate('laporan', { id: proyek.id }), 500);
    } catch (e) {
      hideProgress();
      showError('Signing failure: ' + e.message);
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

/**
 * PROJECT-SPECIFIC TEMPLATE SETUP MODAL
 */
window._openTemplateSetup = async function() {
  const { openModal, closeModal } = await import('../components/modal.js');
  const proyek = await window._fetchProyekLocal(); // Helper needed
  
  openModal({
    title: 'DOCX TEMPLATE MANAGEMENT',
    body: `
      <div style="padding:10px 0">
        <p style="font-size:0.8rem; color:var(--text-tertiary); margin-bottom:24px; line-height:1.6">
           Configure a custom .docx template specifically for this project. This will override the global system template.
        </p>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-bottom:24px">
           <div class="card-quartz" style="padding:20px; background:hsla(220, 20%, 100%, 0.02); text-align:center">
              <div style="font-family:var(--font-mono); font-size:9px; font-weight:800; color:var(--brand-400); margin-bottom:12px">STEP 1: REFERENCE</div>
              <button class="btn btn-ghost btn-sm" onclick="window._downloadReferenceFromLaporan()" style="width:100%; font-size:0.75rem">
                 <i class="fas fa-download" style="margin-right:8px"></i> TAG REFERENCE
              </button>
           </div>
           <div class="card-quartz" style="padding:20px; background:hsla(220, 20%, 100%, 0.02); text-align:center">
              <div style="font-family:var(--font-mono); font-size:9px; font-weight:800; color:var(--gold-400); margin-bottom:12px">STEP 2: CUSTOMIZE</div>
              <input type="file" id="project-template-file" accept=".docx" hidden onchange="window._handleProjectTemplateUpload('${proyek.id}', this)">
              <button class="btn btn-primary btn-sm" onclick="document.getElementById('project-template-file').click()" style="width:100%; font-size:0.75rem">
                 <i class="fas fa-upload" style="margin-right:8px"></i> UPLOAD .DOCX
              </button>
           </div>
        </div>

        <div id="project-template-info">
           ${proyek.metadata?.report_template_name 
             ? `<div class="badge" style="background:var(--success-500); color:white; width:100%; justify-content:center; padding:12px; border-radius:10px">
                  <i class="fas fa-check-circle" style="margin-right:10px"></i> ACTIVE: ${proyek.metadata.report_template_name.toUpperCase()}
                </div>`
             : `<p style="font-size:0.7rem; color:var(--text-tertiary); text-align:center; font-style:italic">Menggunakan template standar sistem.</p>`
           }
        </div>
      </div>
    `,
    footer: `
      <button class="btn btn-ghost" id="template-modal-close">Close</button>
      ${proyek.metadata?.report_template_url || proyek.metadata?.report_template_name ? `<button class="btn btn-outline" id="template-modal-reset" style="color:var(--danger-400); border-color:var(--danger-400)">Reset Default</button>` : ''}
    `
  });

  document.getElementById('template-modal-close').onclick = () => closeModal();
  const resetBtn = document.getElementById('template-modal-reset');
  if (resetBtn) {
    resetBtn.onclick = async () => {
       showInfo('Resetting to default...');
       const metadata = proyek.metadata || {};
       
       // Hapus file dari storage jika ada path-nya
       if (metadata.report_template_storage_path) {
          try {
             await supabase.storage.from('templates').remove([metadata.report_template_storage_path]);
          } catch(e) { console.warn("Gagal menghapus file dari storage (mungkin sudah terhapus)"); }
       }

       delete metadata.report_template_base64;
       delete metadata.report_template_url;
       delete metadata.report_template_name;
       delete metadata.report_template_storage_path;
       
       await supabase.from('proyek').update({ metadata }).eq('id', proyek.id);
       showSuccess('Template reset to default.');
       closeModal();
       setTimeout(() => location.reload(), 800);
    };
  }
};

/** Helpers for Laporan Template Management **/
window._fetchProyekLocal = async () => {
    const id = new URLSearchParams(window.location.search).get('id') || window._lastProjectId;
    const { data } = await supabase.from('proyek').select('*').eq('id', id).single();
    return data;
};

window._downloadReferenceFromLaporan = async () => {
    showInfo('Generating reference document...');
    const { generateReferenceTemplate } = await import('../lib/docx-service.js');
    await generateReferenceTemplate();
};

window._handleProjectTemplateUpload = async (proyekId, input) => {
    if (!input.files || !input.files[0]) return;
    const file = input.files[0];
    
    showInfo(`Mengunggah template: ${file.name}...`);
    try {
        // 1. Upload ke Supabase Storage (Bucket: templates)
        // Gunakan path unik: proyekId/timestamp_filename
        const fileExt = file.name.split('.').pop();
        const fileName = `${proyekId}/${Date.now()}.${fileExt}`;
        
        const { data, error: uploadError } = await supabase.storage
            .from('templates')
            .upload(fileName, file, { upsert: true });
            
        if (uploadError) throw uploadError;
        
        // 2. Dapatkan URL Publik
        const { data: { publicUrl } } = supabase.storage
            .from('templates')
            .getPublicUrl(fileName);
            
        // 3. Update Metadata Proyek (Hapus base64 lama jika ada untuk hemat space)
        const { data: current } = await supabase.from('proyek').select('metadata').eq('id', proyekId).single();
        const metadata = current.metadata || {};
        
        // Bersihkan data lama
        delete metadata.report_template_base64; 
        
        metadata.report_template_url = publicUrl;
        metadata.report_template_name = file.name;
        metadata.report_template_storage_path = fileName;
        
        await supabase.from('proyek').update({ metadata }).eq('id', proyekId);
        
        showSuccess('Template kustom berhasil diunggah dan diterapkan.');
        setTimeout(() => location.reload(), 1000);
    } catch (err) {
        console.error('Gagal mengunggah template:', err);
        showError('Gagal mengunggah template: ' + (err.message || 'Error tidak diketahui'));
    }
};

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

async function fetchProyekFiles(proyekId) {
  const { data } = await supabase.from('proyek_files').select('*').eq('proyek_id', proyekId);
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
