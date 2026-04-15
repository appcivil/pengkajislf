// ============================================================
//  PROYEK DETAIL PAGE
//  PRESIDENTIAL CLASS (QUARTZ PREMIUM)
//  Strategic Management Hub for Building Assets
// ============================================================
import { supabase } from '../lib/supabase.js';
import { isAdmin }  from '../lib/auth.js';
import { getAuditLogs, getReportVersions } from '../lib/audit-service.js';
import { navigate, getParams }  from '../lib/router.js';
import { showSuccess, showError, showInfo } from '../components/toast.js';
import { confirm }   from '../components/modal.js';
import { APP_CONFIG } from '../lib/config.js';
import { syncWithSIMBG, pushToSIMBG } from '../lib/simbg.js';
import { getProjectPIC } from '../lib/team-service.js';
import { getSimulasiSummary, loadSimulasi } from '../lib/simulation-engine.js';
import { renderStrukturBangunanCard, initStrukturBangunanHandlers } from '../components/struktur-bangunan-module.js';
import { renderElectricalSystemCard, initElectricalSystemHandlers, fetchElectricalSummary } from '../components/electrical-system-module.js';
import { renderLPSCard, initLPSHandlers, fetchLPSSummary } from '../components/lightning-protection-module.js';
import { renderFireProtectionCard, initFireProtectionHandlers, fetchFireProtectionSummary } from '../components/fire-protection-module.js';
import { renderArchitecturalCard, initArchitecturalHandlers, fetchArchitecturalSummary } from '../components/architectural-requirements-module.js';
import { renderBuildingIntensityCard, initBuildingIntensityHandlers, fetchBuildingIntensitySummary } from '../components/building-intensity-module.js';
import { renderEgressSystemCard, initEgressSystemHandlers, fetchEgressSummary } from '../components/egress-system-module.js';
import { renderEnvironmentalCard, initEnvironmentalHandlers, fetchEnvironmentalSummary } from '../components/environmental-module.js';
import { renderSanitationCard, initSanitationHandlers, fetchSanitationSummary } from '../components/sanitation-module.js';
import { renderWaterSystemCard, initWaterSystemHandlers, fetchWaterSystemSummary } from '../components/water-system-module.js';
import { renderStormwaterCard, initStormwaterHandlers, fetchStormwaterSummary } from '../components/stormwater-module.js';
import { renderAccessibilityCard, fetchAccessibilitySummary, initAccessibilityHandlers } from '../components/accessibility-module.js';

export async function proyekDetailPage(params = {}) {
  const id = params.id;
  if (!id) { navigate('proyek'); return ''; }

  const root = document.getElementById('page-root');
  if (root) root.innerHTML = renderSkeleton();

  const proyek = await fetchProyek(id);
  if (!proyek) {
    navigate('proyek');
    showError('Proyek tidak ditemukan.');
    return '';
  }

  const [checklistStats, analisisData, pic, simulasiSummary, electricalSummary, lpsSummary, fireProtectionSummary, buildingIntensitySummary, architecturalSummary, egressSummary, environmentalSummary, sanitationSummary, waterSummary, accessibilitySummary, stormwaterSummary] = await Promise.all([
    fetchChecklistStats(id),
    fetchLastAnalisis(id),
    getProjectPIC(id),
    getSimulasiSummary(id),
    fetchElectricalSummary(id),
    fetchLPSSummary(id),
    fetchFireProtectionSummary(id),
    fetchBuildingIntensitySummary(id),
    fetchArchitecturalSummary(id),
    fetchEgressSummary(id),
    fetchEnvironmentalSummary(id),
    fetchSanitationSummary(id),
    fetchWaterSystemSummary(id),
    fetchAccessibilitySummary(id),
    fetchStormwaterSummary(id)
  ]);

  const html = buildHtml(proyek, checklistStats, analisisData, pic, simulasiSummary, electricalSummary, lpsSummary, fireProtectionSummary, buildingIntensitySummary, architecturalSummary, egressSummary, environmentalSummary, sanitationSummary, accessibilitySummary, waterSummary, stormwaterSummary);
  if (root) {
    root.innerHTML = html;
    initProyekDetailAfterRender(proyek, checklistStats, analisisData, simulasiSummary, electricalSummary, lpsSummary, fireProtectionSummary, buildingIntensitySummary, architecturalSummary, egressSummary, environmentalSummary, sanitationSummary, accessibilitySummary, waterSummary, stormwaterSummary);
  }
  return html;
}

// ── HTML Builder ─────────────────────────────────────────────
function buildHtml(p, stats, analisis, pic, simulasiSummary = {}, electricalSummary = {}, lpsSummary = {}, fireProtectionSummary = {}, buildingIntensitySummary = {}, architecturalSummary = {}, egressSummary = {}, environmentalSummary = {}, sanitationSummary = {}, accessibilitySummary = {}, waterSummary = {}, stormwaterSummary = {}) {
  const statusMap = {
    LAIK_FUNGSI:           { label: 'LAIK FUNGSI',       cls: 'badge-laik',       icon: 'fa-shield-check',   color: 'var(--success-400)' },
    LAIK_FUNGSI_BERSYARAT: { label: 'LAIK BERSYARAT',    cls: 'badge-bersyarat',  icon: 'fa-triangle-exclamation', color: 'var(--gold-400)' },
    TIDAK_LAIK_FUNGSI:     { label: 'TIDAK LAIK',        cls: 'badge-tidak-laik', icon: 'fa-circle-xmark',   color: 'var(--danger-400)' },
    DALAM_PENGKAJIAN:      { label: 'DALAM PENGKAJIAN',  cls: 'badge-proses',     icon: 'fa-clock',          color: 'var(--brand-400)' },
  };
  const st = statusMap[p.status_slf] || statusMap['DALAM_PENGKAJIAN'];
  const prog = p.progress || 0;

  const workflowSteps = [
    { label: 'INTEGRITAS DATA', icon: 'fa-database',       key: 'input' },
    { label: 'AUDIT TEKNIS',    icon: 'fa-clipboard-check', key: 'checklist' },
    { label: 'AI ANALYTICS',    icon: 'fa-brain-circuit',   key: 'analisis' },
    { label: 'EXECUTIVE RPT',   icon: 'fa-file-seal',       key: 'laporan' },
    { label: 'CERTIFICATION',   icon: 'fa-certificate',     key: 'final' },
  ];

  const currentStep = prog < 20 ? 0 : prog < 40 ? 1 : prog < 60 ? 2 : prog < 80 ? 3 : 4;

  return `
    <div id="proyek-detail-page" style="animation: page-fade-in 0.8s ease-out">
      
      <!-- Presidential Hero Header -->
      <div class="card-quartz" style="padding: var(--space-8); margin-bottom: var(--space-8); background: var(--gradient-dark); border-color: hsla(220, 95%, 52%, 0.2); position:relative; overflow:hidden">
         <!-- Abstract Background Effect -->
         <div style="position:absolute; right:-100px; top:-100px; width:400px; height:400px; border-radius:50%; background:radial-gradient(circle, hsla(220, 95%, 52%, 0.1) 0%, transparent 70%); pointer-events:none"></div>

         <div class="flex-between flex-stack" style="align-items:flex-start; position:relative; z-index:2; gap:var(--space-6)">
            <div style="flex:1">
               <button class="btn btn-ghost btn-xs" onclick="window.navigate('proyek')" style="margin-bottom:20px; color:var(--brand-300); padding:0; font-weight:700; letter-spacing:1px">
                 <i class="fas fa-arrow-left" style="margin-right:8px"></i> KEMBALI LIST PROYEK
               </button>
               <h1 class="page-title" style="font-family:'Outfit', sans-serif; font-weight:800; color:white; letter-spacing:-0.03em; margin:0; line-height:1.1">
                 ${escHtml(p.nama_bangunan)}
               </h1>
               <div style="display:flex; gap:16px; margin-top:20px; align-items:center; flex-wrap:wrap">
                  <span class="badge" style="background:${st.color}1a; border:1px solid ${st.color}44; color:${st.color}; font-weight:800; font-family:var(--font-mono); font-size:11px; padding:6px 12px">
                    <i class="fas ${st.icon}" style="margin-right:6px"></i> ${st.label}
                  </span>
                  <span class="badge" style="background:hsla(220, 20%, 100%, 0.05); border:1px solid hsla(220, 20%, 100%, 0.1); color:var(--text-secondary); font-weight:700; font-size:11px; padding:6px 12px">
                    <i class="fas fa-location-dot" style="margin-right:6px; color:var(--brand-400)"></i> ${escHtml(p.kota || 'INDONESIA')}
                  </span>
                  <div class="hide-mobile" style="width:1px; height:20px; background:hsla(220, 20%, 100%, 0.1)"></div>
                  <span style="font-family:var(--font-mono); font-size:11px; font-weight:800; color:var(--gold-400); letter-spacing:1px">
                    ${p.nomor_pbg || 'NO REGISTRATION'}
                  </span>
               </div>
            </div>
            
            <div class="flex gap-3 flex-stack" style="width:auto">
               <button class="btn btn-outline" style="height:48px; border-radius:14px; border-color:hsla(220, 20%, 100%, 0.1); color:white; padding: 0 20px" onclick="window.navigate('proyek-edit', {id:'${p.id}'})">
                 <i class="fas fa-pen-nib" style="margin-right:8px"></i> Edit Manifest
               </button>
               <button class="btn btn-ghost" style="height:48px; width:48px; padding:0; border-radius:14px; background:hsla(0, 85%, 60%, 0.1); color:var(--danger-400)" onclick="window._hapusProyek('${p.id}')">
                 <i class="fas fa-trash-can"></i>
               </button>
            </div>
         </div>

         <!-- Immersive Workflow Bar -->
         <div style="margin-top: 40px; padding-top: 40px; border-top: 1px solid hsla(220, 20%, 100%, 0.05); overflow-x: auto; padding-bottom: 10px;">
            <div class="workflow-timeline" style="margin-bottom:12px; min-width: 600px">
              ${workflowSteps.map((s, i) => `
                <div class="workflow-step ${i < currentStep ? 'done' : i === currentStep ? 'active' : ''}" style="flex:1; position:relative; text-align:center">
                  <div style="width:36px; height:36px; border-radius:50%; background:${i <= currentStep ? 'var(--brand-500)' : 'hsla(220, 20%, 100%, 0.05)'}; margin:0 auto; display:flex; align-items:center; justify-content:center; color:white; border:4px solid ${i <= currentStep ? 'hsla(220, 95%, 52%, 0.2)' : 'transparent'}; z-index:2; position:relative; box-shadow: ${i === currentStep ? '0 0 20px var(--brand-500)' : 'none'}">
                    <i class="fas ${s.icon}" style="font-size:0.85rem"></i>
                  </div>
                  <div style="font-family:var(--font-mono); font-size:9px; font-weight:800; color:${i <= currentStep ? 'white' : 'var(--text-tertiary)'}; margin-top:12px; letter-spacing:1px">${s.label}</div>
                  ${i < workflowSteps.length - 1 ? `<div style="position:absolute; top:18px; left:50%; width:100%; height:2px; background:${i < currentStep ? 'var(--brand-500)' : 'hsla(220, 20%, 100%, 0.05)'}; z-index:1"></div>` : ''}
                </div>
              `).join('')}
            </div>
         </div>
      </div>

      <!-- Main Workspace Grid -->
      <div class="grid-dashboard-main">
        
        <!-- Left: Operations & Data -->
        <div style="display:flex; flex-direction:column; gap:var(--space-8)">
          
          <!-- Functional Modules Grid -->
          <div class="grid-2-col">
            
            <!-- Checklist Card -->
            <div class="card-quartz clickable" onclick="window.navigate('checklist',{id:'${p.id}'})" style="padding: var(--space-6)">
              <div class="flex-between" style="margin-bottom:20px">
                <div style="width:48px; height:48px; border-radius:14px; background:hsla(220, 95%, 52%, 0.1); display:flex; align-items:center; justify-content:center; color:var(--brand-400)">
                  <i class="fas fa-clipboard-list-check" style="font-size:1.4rem"></i>
                </div>
                <div style="font-family:var(--font-mono); font-size:12px; font-weight:800; color:var(--brand-400)">PHASE 02</div>
              </div>
              <h3 style="font-family:'Outfit', sans-serif; font-weight:800; font-size:1.1rem; color:var(--text-primary); margin-bottom:4px">Audit Teknis Lapangan</h3>
              <p style="font-size:0.75rem; color:var(--text-tertiary); line-height:1.5">Inspeksi menyeluruh terhadap komponen arsitektur, struktur dan MEP.</p>
              
              <div style="margin-top:20px">
                <div class="flex-between" style="margin-bottom:8px">
                  <span style="font-size:0.7rem; font-weight:700; color:var(--text-tertiary)">COMPLETION RATE</span>
                  <span style="font-size:0.7rem; font-weight:800; color:var(--brand-400)">${stats.done}/${stats.total} ITEMS</span>
                </div>
                <div style="height:6px; background:hsla(220, 20%, 100%, 0.05); border-radius:10px">
                  <div style="width:${stats.pct}%; height:100%; border-radius:10px; background:var(--gradient-brand); box-shadow: var(--shadow-sapphire)"></div>
                </div>
              </div>
            </div>

            <!-- PEMERIKSAAN STRUKTUR BANGUNAN MODULE -->
            ${renderStrukturBangunanCard(p, { tier1: stats.pct, tier2: 0, tier3: 0 })}

            <!-- SISTEM KELISTRIKAN MODULE -->
            ${renderElectricalSystemCard(p, electricalSummary)}

            <!-- SISTEM PROTEKSI PETIR MODULE -->
            ${renderLPSCard(p, lpsSummary)}

            <!-- FIRE PROTECTION & LIFE SAFETY MODULE -->
            ${renderFireProtectionCard(p, fireProtectionSummary)}

            <!-- INTENSITAS BANGUNAN & KESESUAIAN FUNGSI MODULE -->
            ${renderBuildingIntensityCard(p, buildingIntensitySummary)}

            <!-- PERSYARATAN ARSITEKTUR MODULE -->
            ${renderArchitecturalCard(p, architecturalSummary)}

            <!-- SISTEM JALUR EVAKUASI MODULE -->
            ${renderEgressSystemCard(p, egressSummary)}

            <!-- PENGENDALIAN DAMPAK LINGKUNGAN MODULE -->
            ${renderEnvironmentalCard(p, environmentalSummary)}

            <!-- SISTEM PENGELOLAAN AIR HUJAN MODULE -->
            ${renderStormwaterCard(p, stormwaterSummary)}

            <!-- SISTEM PEMBUANGAN KOTORAN & SAMPAH MODULE -->
            ${renderSanitationCard(p, sanitationSummary)}

            <!-- AKSESIBILITAS MODULE -->
            ${renderAccessibilityCard(p, accessibilitySummary)}

            <!-- SISTEM AIR BERSIH MODULE -->
            ${renderWaterSystemCard(p, waterSummary)}

            <!-- ASPEK KENYAMANAN MODULE -->
            <div class="card-quartz clickable" onclick="window.navigate('comfort-inspection',{id:'${p.id}'})" style="padding: var(--space-6)">
              <div class="flex-between" style="margin-bottom:20px">
                <div style="width:48px; height:48px; border-radius:14px; background:linear-gradient(135deg, hsla(160, 100%, 45%, 0.15), hsla(220, 95%, 52%, 0.1)); display:flex; align-items:center; justify-content:center; color:var(--success-400)">
                  <i class="fas fa-couch" style="font-size:1.4rem"></i>
                </div>
                <div style="font-family:var(--font-mono); font-size:12px; font-weight:800; color:var(--success-400)">PHASE 02D</div>
              </div>
              <h3 style="font-family:'Outfit', sans-serif; font-weight:800; font-size:1.1rem; color:var(--text-primary); margin-bottom:4px">Aspek Kenyamanan</h3>
              <p style="font-size:0.75rem; color:var(--text-tertiary); line-height:1.5">Evaluasi ruang gerak, kondisi udara (PMV/PPD), pandangan, getaran & kebisingan.</p>
              <div style="margin-top:20px; display:flex; align-items:center; gap:8px; flex-wrap:wrap">
                <span class="badge" style="background:hsla(160, 100%, 45%, 0.1); color:var(--success-400); border:1px solid hsla(160, 100%, 45%, 0.2); font-size:9px">PP 16/2021</span>
                <span class="badge" style="background:hsla(220, 95%, 52%, 0.1); color:var(--brand-400); border:1px solid hsla(220, 95%, 52%, 0.2); font-size:9px">ASHRAE 55</span>
              </div>
            </div>

            <!-- Analisis Card -->
            <div class="card-quartz clickable" onclick="window.navigate('analisis',{id:'${p.id}'})" style="padding: var(--space-6)">
              <div class="flex-between" style="margin-bottom:20px">
                <div style="width:48px; height:48px; border-radius:14px; background:hsla(45, 90%, 60%, 0.1); display:flex; align-items:center; justify-content:center; color:var(--gold-400)">
                  <i class="fas fa-brain-circuit" style="font-size:1.4rem"></i>
                </div>
                <div style="font-family:var(--font-mono); font-size:12px; font-weight:800; color:var(--gold-400)">PHASE 03</div>
              </div>
              <h3 style="font-family:'Outfit', sans-serif; font-weight:800; font-size:1.1rem; color:var(--text-primary); margin-bottom:4px">Risk Analysis AI</h3>
              <p style="font-size:0.75rem; color:var(--text-tertiary); line-height:1.5">Automated technical scoring & mitigation recommendations based on audit data.</p>
              <div style="margin-top:20px; display:flex; align-items:center; gap:8px">
                <span class="badge" style="background:hsla(45, 90%, 60%, 0.1); color:var(--gold-400); border:1px solid hsla(45, 90%, 60%, 0.2); font-size:10px">NEURAL ENGINE ACTIVE</span>
              </div>
            </div>

            <!-- Kondisi Fisik Card -->
            <div class="card-quartz clickable" onclick="window.navigate('kondisi',{id:'${p.id}'})" style="padding: var(--space-6)">
              <div class="flex-between" style="margin-bottom:20px">
                <div style="width:48px; height:48px; border-radius:14px; background:hsla(0, 85%, 60%, 0.1); display:flex; align-items:center; justify-content:center; color:var(--danger-400)">
                  <i class="fas fa-building-circle-exclamation" style="font-size:1.4rem"></i>
                </div>
                <div style="font-family:var(--font-mono); font-size:12px; font-weight:800; color:var(--danger-400)">PHASE 02.5</div>
              </div>
              <h3 style="font-family:'Outfit', sans-serif; font-weight:800; font-size:1.1rem; color:var(--text-primary); margin-bottom:4px">Pemeriksaan Kondisi</h3>
              <p style="font-size:0.75rem; color:var(--text-tertiary); line-height:1.5">Penilaian tingkat kerusakan bangunan sesuai standar Permen PU 16/2010.</p>
              ${analisis ? `
                <div style="margin-top:20px; display:flex; align-items:center; gap:8px">
                  <span class="badge" style="background:${analisis.skor_total > 70 ? 'var(--success-500)1a' : 'var(--danger-500)1a'}; color:${analisis.skor_total > 70 ? 'var(--success-400)' : 'var(--danger-400)'}; border:1px solid ${analisis.skor_total > 70 ? 'var(--success-500)44' : 'var(--danger-500)44'}; font-size:10px; font-weight:800">
                    SKOR: ${analisis.skor_total}%
                  </span>
                </div>
              ` : ''}
            </div>

            <!-- Documents Card -->
            <div class="card-quartz clickable" onclick="window.navigate('proyek-files',{id:'${p.id}'})" style="padding: var(--space-6)">
              <div class="flex-between" style="margin-bottom:20px">
                <div style="width:48px; height:48px; border-radius:14px; background:hsla(220, 20%, 100%, 0.05); display:flex; align-items:center; justify-content:center; color:var(--text-secondary)">
                  <i class="fas fa-folder-tree" style="font-size:1.4rem"></i>
                </div>
                <div style="font-family:var(--font-mono); font-size:12px; font-weight:800; color:var(--text-tertiary)">PHASE 01</div>
              </div>
              <h3 style="font-family:'Outfit', sans-serif; font-weight:800; font-size:1.1rem; color:var(--text-primary); margin-bottom:4px">Manajemen Berkas SIMBG</h3>
              <p style="font-size:0.75rem; color:var(--text-tertiary); line-height:1.5">Synchronization with national SIMBG database for architectural & structural blueprints.</p>
            </div>

            <!-- Report Card -->
            <div class="card-quartz clickable" onclick="window.navigate('laporan',{id:'${p.id}'})" style="padding: var(--space-6)">
              <div class="flex-between" style="margin-bottom:20px">
                <div style="width:48px; height:48px; border-radius:14px; background:hsla(158, 85%, 45%, 0.1); display:flex; align-items:center; justify-content:center; color:var(--success-400)">
                  <i class="fas fa-file-invoice" style="font-size:1.4rem"></i>
                </div>
                <div style="font-family:var(--font-mono); font-size:12px; font-weight:800; color:var(--success-400)">PHASE 04</div>
              </div>
              <h3 style="font-family:'Outfit', sans-serif; font-weight:800; font-size:1.1rem; color:var(--text-primary); margin-bottom:4px">Laporan Kajian SLF</h3>
              <p style="font-size:0.75rem; color:var(--text-tertiary); line-height:1.5">Executive summary & full technical report generation with legally compliant format.</p>
            </div>
          </div>

          <!-- Secondary Grid: Gallery, Surat, TODO -->
          <div class="grid-3-col">
             <div class="card-quartz clickable" onclick="window.navigate('galeri', {id:'${p.id}'})" style="text-align:center; padding:var(--space-5)">
                <i class="fas fa-images" style="font-size:1.4rem; color:var(--brand-400); margin-bottom:12px"></i>
                <div style="font-weight:700; font-size:0.85rem; color:white">Visual Gallery</div>
             </div>
             <div class="card-quartz clickable" onclick="window.navigate('surat-pernyataan', {id:'${p.id}'})" style="text-align:center; padding:var(--space-5)">
                <i class="fas fa-file-contract" style="font-size:1.4rem; color:var(--gold-400); margin-bottom:12px"></i>
                <div style="font-weight:700; font-size:0.85rem; color:white">Statements</div>
             </div>
             <div class="card-quartz clickable" onclick="window.navigate('todo', {proyekId:'${p.id}'})" style="text-align:center; padding:var(--space-5)">
                <i class="fas fa-list-check" style="font-size:1.4rem; color:var(--success-400); margin-bottom:12px"></i>
                <div style="font-weight:700; font-size:0.85rem; color:white">Remedial Tasks</div>
             </div>
          </div>

          <!-- Technical Specs -->
          <div class="card-quartz" style="padding: var(--space-8)">
            <div style="font-family:'Outfit', sans-serif; font-weight:800; font-size:1rem; color:white; margin-bottom:24px; display:flex; align-items:center; gap:12px">
              <i class="fas fa-microchip" style="color:var(--brand-400)"></i> SPESIFIKASI TEKNIS STRATEGIS
            </div>
            <div class="grid-3-col">
              ${[
                ['BAHAN_MODUL',     p.jenis_bangunan   || '-', 'fa-tag', 'KATEGORI ASSET'],
                ['STAIRS_LEVEL',    p.jumlah_lantai ? `${p.jumlah_lantai} LANTAI` : '-', 'fa-stairs', 'VOLUME VERTIKAL'],
                ['SURFACE_AREA',    p.luas_bangunan ? `${Number(p.luas_bangunan).toLocaleString('id-ID')} M²` : '-', 'fa-ruler-combined', 'TOTAL AREA'],
                ['CHRONO_YEAR',     p.tahun_dibangun || '-', 'fa-calendar', 'TAHUN KONSTRUKSI'],
                ['CORE_FUNCTION',   p.fungsi_bangunan || '-', 'fa-building-columns', 'FUNGSI UTAMA'],
                ['GOV_REGISTRY',    p.nomor_pbg || '-', 'fa-file-certificate', 'NOMOR PBG/REG'],
              ].map(([k, v, ic, lbl]) => `
                <div style="background:hsla(220, 20%, 100%, 0.02); border:1px solid hsla(220, 20%, 100%, 0.05); border-radius:12px; padding:20px; text-align:center">
                  <div style="font-family:var(--font-mono); font-size:8px; font-weight:800; color:var(--text-tertiary); letter-spacing:1px; margin-bottom:8px">${lbl}</div>
                  <div style="font-size:1rem; font-weight:800; color:white">${escHtml(v)}</div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- Right: Control Center & Intel -->
        <div style="display:flex; flex-direction:column; gap:var(--space-8)">
          
          <!-- Operation Command (Radar) -->
          <div class="card-quartz" style="padding: var(--space-6); background: var(--gradient-dark); border-color: hsla(220, 95%, 52%, 0.2); position:relative">
            <div style="font-family:'Outfit', sans-serif; font-weight:800; font-size: 0.9rem; color:white; margin-bottom: 24px; text-align:center; letter-spacing:1px">RISK PULSE INTERFACE</div>
            <div style="height:280px; display:flex; align-items:center; justify-content:center">
               <canvas id="project-radar-chart"></canvas>
            </div>
            ${!analisis ? `<div style="position:absolute; inset:0; background:rgba(0,0,0,0.7); backdrop-filter:blur(6px); display:flex; align-items:center; justify-content:center; text-align:center; padding:40px; font-size:0.75rem; color:var(--text-tertiary); font-weight:600">AUDIT DATA INSUFFICIENT<br>Complete field checklist to generate risk pulse.</div>` : ''}
          </div>

          <!-- PIC Card -->
          <div class="card-quartz" style="padding: var(--space-6); border-left: 4px solid var(--brand-400)">
            <div style="font-weight:800; font-size: 0.8rem; color:var(--brand-400); margin-bottom:16px; font-family:var(--font-mono); letter-spacing:1.5px">PIC PENGKAJI</div>
            ${pic ? `
              <div style="display:flex; align-items:center; gap:16px">
                <div style="width:56px; height:56px; border-radius:50%; background:var(--gradient-brand); color:white; display:flex; align-items:center; justify-content:center; font-weight:800; border:2px solid hsla(220, 95%, 52%, 0.3)">
                   ${pic.avatar_url ? `<img src="${pic.avatar_url}" style="width:100%;height:100%;border-radius:50%">` : `<span>${pic.full_name?.charAt(0)}</span>`}
                </div>
                <div style="overflow:hidden">
                  <div style="font-family:'Outfit', sans-serif; font-weight:800; font-size:1rem; color:white">${pic.full_name}</div>
                  <div style="font-size:0.7rem; color:var(--brand-300); text-transform:uppercase; font-weight:700; letter-spacing:1px">${pic.role || 'Tenaga Ahli'}</div>
                </div>
              </div>
            ` : `
              <div class="text-center" style="padding:24px; background:hsla(220, 20%, 100%, 0.02); border:1px dashed hsla(220, 20%, 100%, 0.1); border-radius:12px">
                <p style="font-size:0.75rem; color:var(--text-tertiary); margin-bottom:16px">No commander assigned.</p>
                <button class="btn btn-outline btn-xs" onclick="window.navigate('proyek-edit', {id:'${p.id}'})">
                  <i class="fas fa-user-plus" style="margin-right:8px"></i> Assign PIC
                </button>
              </div>
            `}
          </div>

          <!-- Ownership -->
          <div class="card-quartz" style="padding: var(--space-6)">
            <div style="font-weight:800; font-size: 0.8rem; color:var(--gold-400); margin-bottom:16px; font-family:var(--font-mono); letter-spacing:1.5px">PEMILIK BANGUNAN</div>
            <div style="display:flex; flex-direction:column; gap:12px">
               <div style="display:flex; align-items:center; gap:12px">
                  <i class="fas fa-building-user" style="color:var(--text-tertiary); width:16px"></i>
                  <span style="font-size:0.85rem; font-weight:700; color:white">${escHtml(p.pemilik || '-')}</span>
               </div>
               <div style="display:flex; align-items:center; gap:12px">
                  <i class="fas fa-phone-office" style="color:var(--text-tertiary); width:16px"></i>
                  <span style="font-size:0.8rem; color:var(--text-secondary)">${escHtml(p.telepon || '-')}</span>
               </div>
               <div style="display:flex; align-items:center; gap:12px">
                  <i class="fas fa-envelope" style="color:var(--text-tertiary); width:16px"></i>
                  <span style="font-size:0.8rem; color:var(--text-secondary)">${escHtml(p.email_pemilik || '-')}</span>
               </div>
            </div>
          </div>

          <div class="card-quartz" style="padding: var(--space-6); background:hsla(220, 95%, 52%, 0.05); border-color:hsla(220, 95%, 52%, 0.1)">
             <div class="flex-between" style="margin-bottom:20px">
                <div style="display:flex; align-items:center; gap:12px">
                   <i class="fas fa-cloud-arrow-down" style="color:var(--brand-400)"></i>
                   <div style="font-weight:800; font-size:0.85rem; color:white">SIMBG INTERFACE</div>
                </div>
                ${p.updated_at ? `<div style="font-size:8px; font-family:var(--font-mono); color:var(--text-tertiary)">SYNC: ${new Date(p.updated_at).toLocaleDateString()}</div>` : ''}
             </div>
             
             <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px">
                <button class="btn-presidential gold" style="width:100%; height:44px; border-radius:12px; font-size:10px" id="btn-sync-simbg" ${!p.simbg_email ? 'disabled' : ''}>
                   <i class="fas fa-bolt" style="margin-right:8px"></i> PULL FROM
                </button>
                <button class="btn btn-outline" style="width:100%; height:44px; border-radius:12px; font-size:10px; border-color:hsla(220, 95%, 52%, 0.2); color:white" id="btn-push-simbg" ${!p.simbg_id ? 'disabled' : ''}>
                   <i class="fas fa-cloud-arrow-up" style="margin-right:8px"></i> PUSH DATA
                </button>
             </div>

             ${!p.simbg_email ? `<p style="font-size:9px; color:var(--text-tertiary); text-align:center; margin-top:12px"><i class="fas fa-shield-slash"></i> Credentials missing in manifest.</p>` : ''}
          </div>

          <!-- Engineering Simulation Card -->
          <div class="card-quartz" style="padding: var(--space-6); background:hsla(45, 90%, 60%, 0.05); border-color:hsla(45, 90%, 60%, 0.2)">
             <div class="flex-between" style="margin-bottom:20px">
                <div style="display:flex; align-items:center; gap:12px">
                   <i class="fas fa-flask" style="color:var(--gold-400)"></i>
                   <div style="font-weight:800; font-size:0.85rem; color:white">ENGINEERING SIMULATION</div>
                </div>
                <div style="font-size:8px; font-family:var(--font-mono); color:var(--text-tertiary)">
                   ${simulasiSummary.total_simulasi || 0} RUNS
                </div>
             </div>
             
             <div style="display:grid; grid-template-columns: repeat(2, 1fr); gap:8px; margin-bottom:16px">
                <div style="background:hsla(220, 20%, 100%, 0.03); padding:8px; border-radius:8px; text-align:center">
                   <div style="font-size:1.2rem; font-weight:800; color:${simulasiSummary.sim_pencahayaan ? 'var(--success-400)' : 'var(--text-tertiary)'}">${simulasiSummary.sim_pencahayaan || 0}</div>
                   <div style="font-size:9px; color:var(--text-tertiary)">Cahaya</div>
                </div>
                <div style="background:hsla(220, 20%, 100%, 0.03); padding:8px; border-radius:8px; text-align:center">
                   <div style="font-size:1.2rem; font-weight:800; color:${simulasiSummary.sim_ventilasi ? 'var(--success-400)' : 'var(--text-tertiary)'}">${simulasiSummary.sim_ventilasi || 0}</div>
                   <div style="font-size:9px; color:var(--text-tertiary)">Angin</div>
                </div>
                <div style="background:hsla(220, 20%, 100%, 0.03); padding:8px; border-radius:8px; text-align:center">
                   <div style="font-size:1.2rem; font-weight:800; color:${simulasiSummary.sim_evakuasi ? 'var(--success-400)' : 'var(--text-tertiary)'}">${simulasiSummary.sim_evakuasi || 0}</div>
                   <div style="font-size:9px; color:var(--text-tertiary)">Evakuasi</div>
                </div>
                <div style="background:hsla(220, 20%, 100%, 0.03); padding:8px; border-radius:8px; text-align:center">
                   <div style="font-size:1.2rem; font-weight:800; color:${simulasiSummary.sim_ndt ? 'var(--success-400)' : 'var(--text-tertiary)'}">${simulasiSummary.sim_ndt || 0}</div>
                   <div style="font-size:9px; color:var(--text-tertiary)">NDT</div>
                </div>
             </div>

             <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px">
                <button class="btn-presidential gold" style="width:100%; height:44px; border-radius:12px; font-size:10px" onclick="window._openSimulationModal('${p.id}')">
                   <i class="fas fa-play" style="margin-right:8px"></i> RUN NEW
                </button>
                <button class="btn btn-outline" style="width:100%; height:44px; border-radius:12px; font-size:10px; border-color:hsla(45, 90%, 60%, 0.2); color:white" onclick="window._viewSimulationHistory('${p.id}')">
                   <i class="fas fa-history" style="margin-right:8px"></i> HISTORY
                </button>
             </div>

             ${simulasiSummary.avg_skor_kelayakan ? `
                <div style="margin-top:16px; padding-top:16px; border-top:1px solid hsla(220, 20%, 100%, 0.05)">
                   <div style="font-size:9px; color:var(--text-tertiary); margin-bottom:4px">AVG KELAYAKAN</div>
                   <div style="font-size:1.5rem; font-weight:800; color:${simulasiSummary.avg_skor_kelayakan >= 70 ? 'var(--success-400)' : simulasiSummary.avg_skor_kelayakan >= 50 ? 'var(--warning-400)' : 'var(--danger-400)'}">
                      ${Math.round(simulasiSummary.avg_skor_kelayakan)}%
                   </div>
                </div>
             ` : ''}
          </div>

          <!-- SIMBG PROGRESS OVERLAY -->
          <div id="simbg-progress-overlay" style="display:none; position:fixed; inset:0; background:rgba(2,4,8,0.9); backdrop-filter:blur(10px); z-index:10000; align-items:center; justify-content:center; flex-direction:column; padding:40px">
                   
                   <div style="height:4px; background:hsla(220, 20%, 100%, 0.05); border-radius:10px; overflow:hidden">
                      <div id="simbg-progress-bar" style="width:0%; height:100%; background:var(--gradient-brand); transition:width 0.3s"></div>
                   </div>
                </div>
             </div>
          </div>

          <!-- Activity Audit -->
          <div class="card-quartz" style="padding: var(--space-6)">
            <div class="flex-between" style="margin-bottom:20px">
               <div style="font-weight:800; font-size: 0.8rem; color:white; font-family:var(--font-mono); letter-spacing:1px">INTEL FEED</div>
               <div class="flex gap-4">
                  <button class="text-xs font-bold btn-tab active" id="tab-audit-act" onclick="window._switchAuditTab('act')" style="border:none; background:none; cursor:pointer; color:var(--brand-400); font-family:var(--font-mono)">LOGS</button>
                  <button class="text-xs font-bold btn-tab" id="tab-audit-ver" onclick="window._switchAuditTab('ver')" style="border:none; background:none; cursor:pointer; color:var(--text-tertiary); font-family:var(--font-mono)">ARCHIVE</button>
               </div>
            </div>
            
            <div id="audit-trail-container">
              <div id="audit-trail-list" class="audit-tab-content" style="display:flex; flex-direction:column; gap:12px; max-height:400px; overflow-y:auto;">
                <div class="skeleton" style="height:48px"></div>
              </div>
              <div id="report-versions-list" class="audit-tab-content" style="display:none; flex-direction:column; gap:12px; max-height:400px; overflow-y:auto;">
                <div class="skeleton" style="height:48px"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ── After Render Logic ──────────────────────────────────────────
function initProyekDetailAfterRender(p, stats, analisis, simulasiSummary = {}, electricalSummary = {}, lpsSummary = {}, fireProtectionSummary = {}, buildingIntensitySummary = {}, architecturalSummary = {}, egressSummary = {}, environmentalSummary = {}, sanitationSummary = {}, accessibilitySummary = {}, waterSummary = {}, stormwaterSummary = {}) {
  // Initialize Radar Chart
  initProjectRadar(analisis);

  // Fetch Logs & Versions
  renderAuditTrail(p.id);
  renderReportVersions(p.id);

  // Initialize Struktur Bangunan Module
  initStrukturBangunanHandlers(p.id);

  // Initialize Electrical System Module
  initElectricalSystemHandlers(p.id, electricalSummary);

  // Initialize LPS Module
  initLPSHandlers(p.id);

  // Initialize Fire Protection Module
  initFireProtectionHandlers(p.id);

  // Initialize Building Intensity Module
  initBuildingIntensityHandlers(p.id);

  // Initialize Architectural Requirements Module
  initArchitecturalHandlers(p.id);

  // Initialize Egress System Module
  initEgressSystemHandlers(p.id);

  // Initialize Environmental Module
  initEnvironmentalHandlers(p.id);

  // Initialize Sanitation Module
  initSanitationHandlers(p.id);

  // Initialize Water System Module
  initWaterSystemHandlers();

  // Initialize Accessibility Module
  initAccessibilityHandlers(p.id, accessibilitySummary);

  // Initialize Stormwater Module
  initStormwaterHandlers(p.id, stormwaterSummary);

  // PRELOAD INSPECTION MODULES: Load semua inspection pages di background
  // untuk memastikan tab switching lancar saat user navigasi
  import('../main.js').then(({ onProyekDetailEnter }) => {
    onProyekDetailEnter();
  }).catch(err => {
    console.warn('[ProyekDetail] Failed to preload inspection modules:', err);
  });

  // Handle tab parameter for direct module navigation
  const params = getParams();
  if (params.tab) {
    handleModuleTabNavigation(params.tab);
  }

  // Tab Switcher
  window._switchAuditTab = (type) => {
    document.querySelectorAll('.audit-tab-content').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.btn-tab').forEach(el => el.style.color = 'var(--text-tertiary)');
    
    if (type === 'act') {
      document.getElementById('audit-trail-list').style.display = 'flex';
      document.getElementById('tab-audit-act').style.color = 'var(--brand-400)';
    } else {
      document.getElementById('report-versions-list').style.display = 'flex';
      document.getElementById('tab-audit-ver').style.color = 'var(--brand-400)';
    }
  };

  // Actions
  window._openSIMBGConfig = async (proyekId, idPermohonan, email, pass) => {
  const { openModal, closeModal } = await import('../components/modal.js');
  
  openModal({
    title: 'SIMBG ACCOUNT CONFIGURATION',
    body: `
      <div style="padding:10px 0">
        <p style="font-size:0.8rem; color:var(--text-tertiary); margin-bottom:20px">Kredensial ini digunakan untuk sinkronisasi otomatis dengan portal simbg.pu.go.id khusus untuk proyek ini.</p>
        <div class="form-group" style="margin-bottom:16px">
          <label style="display:block; margin-bottom:8px; font-size:0.75rem; font-weight:800; color:var(--text-secondary)">ID PERMOHONAN (SIMBG ID)</label>
          <input type="text" id="simbg-id-input" class="form-control" value="${idPermohonan}" placeholder="SIMBG-XXXXXXXXX" style="width:100%; padding:12px; border-radius:8px; background:hsla(220, 20%, 100%, 0.05); border:1px solid hsla(220, 20%, 100%, 0.1); color:white; font-family:var(--font-mono)">
        </div>
        <div class="form-group" style="margin-bottom:16px">
          <label style="display:block; margin-bottom:8px; font-size:0.75rem; font-weight:800; color:var(--text-secondary)">EMAIL AKUN SIMBG</label>
          <input type="email" id="simbg-email-input" class="form-control" value="${email}" placeholder="example@outlook.co.id" style="width:100%; padding:12px; border-radius:8px; background:hsla(220, 20%, 100%, 0.05); border:1px solid hsla(220, 20%, 100%, 0.1); color:white">
        </div>
        <div class="form-group">
          <label style="display:block; margin-bottom:8px; font-size:0.75rem; font-weight:800; color:var(--text-secondary)">KATA SANDI</label>
          <input type="password" id="simbg-pass-input" class="form-control" value="${pass}" placeholder="••••••••" style="width:100%; padding:12px; border-radius:8px; background:hsla(220, 20%, 100%, 0.05); border:1px solid hsla(220, 20%, 100%, 0.1); color:white">
        </div>
      </div>
    `,
    footer: `
      <button class="btn btn-ghost" id="simbg-cancel-btn">Batal</button>
      <button class="btn btn-primary" id="simbg-save-btn">Simpan Perubahan</button>
    `
  });

  document.getElementById('simbg-cancel-btn').onclick = () => closeModal();
  document.getElementById('simbg-save-btn').onclick = async () => {
    const newId    = document.getElementById('simbg-id-input').value;
    const newEmail = document.getElementById('simbg-email-input').value;
    const newPass  = document.getElementById('simbg-pass-input').value;

    try {
      showInfo('Sedang menyimpan kredensial...');
      const { error } = await supabase
        .from('proyek')
        .update({ 
          simbg_id: newId, 
          simbg_email: newEmail, 
          simbg_password: newPass 
        })
        .eq('id', proyekId);

      if (error) throw error;
      
      showSuccess('Kredensial SIMBG berhasil disimpan.');
      closeModal();
      
      // Hard refresh to ensure data consistency
      setTimeout(() => { window.location.reload(); }, 1000);
    } catch (err) {
      showError('Gagal menyimpan: ' + err.message);
    }
  };
};

window._syncProjectWithSIMBG = async (proyekId) => {
  try {
    const btn = document.getElementById('simbg-sync-status');
    if (btn) {
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> SYNCING...';
      btn.style.color = 'var(--gold-400)';
    }

    showSuccess('Menghubungkan ke Portal SIMBG...');
    const result = await syncWithSIMBG(proyekId);
    
    showSuccess(`Sinkronisasi Berhasil: Data ${result.nomor_pbg} telah diperbarui.`);
    
    if (btn) {
      btn.innerHTML = 'SUCCESS';
      btn.style.color = 'var(--success-400)';
    }

    // Refresh page to show updated data
    setTimeout(() => {
      navigate('proyek-detail', { id: proyekId });
    }, 1000);

  } catch (err) {
    showError('Gagal sinkronisasi SIMBG: ' + err.message);
    const btn = document.getElementById('simbg-sync-status');
    if (btn) {
      btn.innerHTML = 'FAILED';
      btn.style.color = 'var(--danger-400)';
    }
  }
};

window._hapusProyek = async (id) => {
    const ok = await confirm({
      title: 'TERMINATE ASSET',
      message: `Are you sure you want to permanently remove <strong>"${p.nama_bangunan}"</strong> from the presidential portfolio? This action is irreversible.`,
      confirmText: 'CONFIRM TERMINATION',
      danger: true,
    });
    if (!ok) return;
    try {
      const { error } = await supabase.from('proyek').delete().eq('id', id);
      if (error) throw error;
      showSuccess('Asset successfully terminated.');
      navigate('proyek');
    } catch (e) {
      showError('Audit failure: ' + e.message);
    }
  };

  // SIMBG Pull
  const btnSync = document.getElementById('btn-sync-simbg');
  if (btnSync) {
    btnSync.onclick = async () => {
      const ok = await confirm({
        title: 'SIMBG SYNC INITIALIZATION',
        message: 'System will access SIMBG portal to extract technical blueprints and regulatory data. Proceed?',
        confirmText: 'INITIATE SYNC',
      });
      if (!ok) return;

      btnSync.disabled = true;
      btnSync.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> INTERFACING...';
      
      try {
        const result = await syncWithSIMBG(p.id);
        if (result) {
          showSuccess('Tactical data successfully pulled from SIMBG.');
          setTimeout(() => location.reload(), 1000);
        }
      } catch (err) {
        showError('Link failure: ' + err.message);
      } finally {
        btnSync.disabled = false;
        btnSync.innerHTML = '<i class="fas fa-bolt" style="margin-right:8px"></i> PULL FROM';
      }
    };
  }

  // SIMBG Push
  const btnPush = document.getElementById('btn-push-simbg');
  if (btnPush) {
    btnPush.onclick = async () => {
      const ok = await confirm({
        title: 'REVERSE SYNC INITIALIZATION',
        message: 'System will push project parameters and verified audits to SIMBG portal. This action is tracked in the ministry registry. Proceed?',
        confirmText: 'INITIATE PUSH',
      });
      if (!ok) return;

      const overlay = document.getElementById('simbg-progress-overlay');
      const bar = document.getElementById('simbg-progress-bar');
      const msg = document.getElementById('simbg-progress-msg');
      
      if (overlay) overlay.style.display = 'flex';
      
      try {
        await pushToSIMBG(p.id, (perc, text) => {
           if (bar) bar.style.width = perc + '%';
           if (msg) msg.textContent = text.toUpperCase();
        });
        showSuccess('Audit data successfully pushed to SIMBG.');
        setTimeout(() => location.reload(), 1500);
      } catch (err) {
        showError('Push failure: ' + err.message);
        if (overlay) overlay.style.display = 'none';
      }
    };
  }

  // ============================================================
  //  SIMULATION HANDLERS
  //  Integrasi simulasi engineering per proyek
  // ============================================================
  
  window._openSimulationModal = (proyekId) => {
    navigate('simulation', { proyekId, mode: 'project' });
  };

  window._viewSimulationHistory = async (proyekId) => {
    const { openModal, closeModal } = await import('../components/modal.js');
    const { loadSimulasi } = await import('../lib/simulation-engine.js');
    
    showInfo('Memuat history simulasi...');
    
    try {
      const simulations = await loadSimulasi(proyekId);
      
      const typeLabels = {
        'pencahayaan': '<i class="fas fa-sun"></i> Pencahayaan',
        'ventilasi': '<i class="fas fa-wind"></i> Ventilasi',
        'evakuasi': '<i class="fas fa-running"></i> Evakuasi',
        'ndt_rebound': '<i class="fas fa-hammer"></i> NDT Rebound',
        'ndt_upv': '<i class="fas fa-wave-square"></i> NDT UPV'
      };
      
      const listHtml = simulations.length === 0 
        ? '<p style="text-align:center; padding:40px; color:var(--text-tertiary)">Belum ada simulasi yang dijalankan.</p>'
        : simulations.map(sim => {
            const date = new Date(sim.created_at).toLocaleString('id-ID', { 
              day: 'numeric', month: 'short', year: 'numeric',
              hour: '2-digit', minute: '2-digit'
            });
            const skor = sim.skor_kelayakan || 0;
            const skorColor = skor >= 70 ? 'var(--success-400)' : skor >= 50 ? 'var(--warning-400)' : 'var(--danger-400)';
            
            return `
              <div style="background:hsla(220, 20%, 100%, 0.02); padding:16px; border-radius:12px; border:1px solid hsla(220, 20%, 100%, 0.05); margin-bottom:12px;">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px;">
                  <div>
                    <div style="font-weight:800; font-size:0.85rem; color:white; margin-bottom:4px;">${typeLabels[sim.tipe_simulasi] || sim.tipe_simulasi}</div>
                    <div style="font-size:0.7rem; color:var(--text-tertiary);">${date}</div>
                  </div>
                  <div style="text-align:right;">
                    <div style="font-size:1.5rem; font-weight:800; color:${skorColor};">${skor}%</div>
                    <div style="font-size:0.65rem; color:var(--text-tertiary);">KELAYAKAN</div>
                  </div>
                </div>
                ${sim.rekomendasi && sim.rekomendasi.length > 0 ? `
                  <div style="font-size:0.75rem; color:var(--text-secondary); margin-top:8px; padding-top:8px; border-top:1px solid hsla(220, 20%, 100%, 0.05);">
                    <i class="fas fa-lightbulb" style="color:var(--gold-400); margin-right:6px;"></i>
                    ${sim.rekomendasi[0]}
                  </div>
                ` : ''}
              </div>
            `;
          }).join('');
      
      openModal({
        title: 'SIMULATION HISTORY',
        body: `
          <div style="max-height:500px; overflow-y:auto; padding:4px;">
            ${listHtml}
          </div>
        `,
        footer: `
          <button class="btn btn-ghost" onclick="closeModal()">Tutup</button>
          <button class="btn btn-primary" onclick="window._openSimulationModal('${proyekId}'); closeModal();">
            <i class="fas fa-play"></i> Jalankan Simulasi Baru
          </button>
        `
      });
      
      document.querySelector('.modal-footer button.btn-ghost').onclick = closeModal;
      
    } catch (err) {
      showError('Gagal memuat history: ' + err.message);
    }
  };
}

function initProjectRadar(analisis) {
  const canvas = document.getElementById('project-radar-chart');
  if (!canvas || typeof Chart === 'undefined') return;

  const labels = ['STRUKTUR', 'ARSITEKTUR', 'UTILITAS', 'KEBAKARAN', 'AKSES'];
  let dataPoints = [0, 0, 0, 0, 0];

  if (analisis && analisis.metadata?.scores) {
    const s = analisis.metadata.scores;
    dataPoints = [
      s.struktur || 0,
      s.arsitektur || 0,
      s.mep || 0,
      s.proteksi_kebakaran || 0,
      s.aksesibilitas || 0
    ];
  }

  const sapphire = 'hsl(220, 95%, 52%)';
  const gold = 'hsl(45, 90%, 60%)';

  new Chart(canvas, {
    type: 'radar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Asset Score',
        data: dataPoints,
        backgroundColor: 'rgba(220, 95, 52, 0.15)',
        borderColor: sapphire,
        pointBackgroundColor: gold,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        tension: 0.2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        r: {
          min: 0,
          max: 100,
          ticks: { display: false },
          grid: { color: 'rgba(255,255,255,0.05)' },
          angleLines: { color: 'rgba(255,255,255,0.05)' },
          pointLabels: { 
            color: 'rgba(255,255,255,0.5)', 
            font: { family: 'var(--font-mono)', size: 8, weight: '800' } 
          }
        }
      }
    }
  });
}

async function renderAuditTrail(proyekId) {
  const container = document.getElementById('audit-trail-list');
  if (!container) return;

  try {
    const logs = await getAuditLogs(proyekId);
    if (!logs || logs.length === 0) {
      container.innerHTML = '<p style="font-size:0.7rem; color:var(--text-tertiary); text-align:center; padding:20px">NO ACTIVITY RECORDED</p>';
      return;
    }

    container.innerHTML = logs.map(log => {
      const date = new Date(log.created_at).toLocaleString('id-ID', { hour:'2-digit', minute:'2-digit', day:'numeric', month:'short' });
      return `
        <div style="background:hsla(220, 20%, 100%, 0.02); padding:12px; border-radius:10px; border:1px solid hsla(220, 20%, 100%, 0.05); display:flex; gap:12px;">
          <div style="width:32px; height:32px; border-radius:8px; background:hsla(220, 95%, 52%, 0.1); color:var(--brand-400); display:flex; align-items:center; justify-content:center; flex-shrink:0;">
            <i class="fas fa-fingerprint" style="font-size:0.8rem"></i>
          </div>
          <div style="overflow:hidden">
            <div style="font-size:0.75rem; font-weight:800; color:white; text-transform:uppercase">${log.action.replace(/_/g, ' ')}</div>
            <div style="font-size:0.65rem; color:var(--text-tertiary); opacity:0.6">${date}</div>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    container.innerHTML = `<p style="font-size:0.7rem; color:var(--danger-400)">Audit Trail unreachable.</p>`;
  }
}

async function renderReportVersions(proyekId) {
  const container = document.getElementById('report-versions-list');
  if (!container) return;

  try {
    const versions = await getReportVersions(proyekId);
    if (!versions || versions.length === 0) {
      container.innerHTML = '<p style="font-size:0.7rem; color:var(--text-tertiary); text-align:center; padding:20px">NO ARCHIVE FOUND</p>';
      return;
    }

    container.innerHTML = versions.map(v => {
      const date = new Date(v.created_at).toLocaleString('id-ID', { day:'numeric', month:'short', year:'numeric' });
      return `
        <div style="background:hsla(220, 20%, 100%, 0.02); padding:12px; border-radius:10px; border:1px solid hsla(220, 20%, 100%, 0.05); display:flex; align-items:center; gap:12px;">
          <div style="width:36px; height:36px; border-radius:8px; background:hsla(158, 85%, 45%, 0.1); color:var(--success-400); display:flex; align-items:center; justify-content:center; flex-shrink:0;">
            <i class="fas fa-file-shield" style="font-size:1rem"></i>
          </div>
          <div style="flex:1; overflow:hidden">
            <div style="font-size:0.75rem; font-weight:800; color:white; white-space:nowrap; overflow:hidden; text-overflow:ellipsis">${v.file_name}</div>
            <div style="font-size:0.65rem; color:var(--text-tertiary)">VERIFIED ${date}</div>
          </div>
          <button class="btn btn-ghost btn-xs" onclick="window.open('${v.file_url}', '_blank')"><i class="fas fa-download"></i></button>
        </div>
      `;
    }).join('');
  } catch (err) {
    container.innerHTML = `<p style="font-size:0.7rem; color:var(--danger-400)">Archive unreachable.</p>`;
  }
}

async function fetchProyek(id) {
  try {
    const { data } = await supabase.from('proyek').select('*').eq('id', id).maybeSingle();
    return data;
  } catch { return null; }
}

async function fetchChecklistStats(proyekId) {
  try {
    const { data } = await supabase.from('checklist_items').select('id, status').eq('proyek_id', proyekId);
    const total = data?.length || 0;
    const done  = data?.filter(d => d.status && d.status !== 'belum').length || 0;
    return { total, done, pct: total > 0 ? Math.round((done / total) * 100) : 0 };
  } catch { return { total: 0, done: 0, pct: 0 }; }
}

async function fetchLastAnalisis(proyekId) {
  try {
    const { data } = await supabase.from('hasil_analisis').select('*').eq('proyek_id', proyekId).order('created_at', { ascending: false }).limit(1);
    return data && data.length > 0 ? data[0] : null;
  } catch { return null; }
}

function renderSkeleton() {
  return `
    <div class="card-quartz" style="height:300px; margin-bottom:40px">
      <div class="skeleton" style="height:48px; width:400px; margin-bottom:20px"></div>
      <div class="skeleton" style="height:20px; width:200px"></div>
    </div>
    <div class="grid-dashboard-main">
       <div class="grid-2-col">
          ${Array(4).fill(0).map(() => `<div class="card-quartz" style="height:180px"></div>`).join('')}
       </div>
       <div class="card-quartz" style="height:500px"></div>
    </div>
  `;
}

function escHtml(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ── Module Tab Navigation Handler ─────────────────────────────────────
function handleModuleTabNavigation(tab) {
  const moduleMap = {
    'lps': 'lps-module-card',
    'fire': 'fire-protection-card',
    'intensity': 'building-intensity-card',
    'architectural': 'architectural-card',
    'egress': 'egress-system-card',
    'environmental': 'environmental-card',
    'accessibility': 'accessibility-card',
    'electrical': 'electrical-card',
    'struktur': 'struktur-bangunan-card'
  };

  const cardId = moduleMap[tab];
  if (!cardId) return;

  setTimeout(() => {
    const card = document.getElementById(cardId);
    if (card) {
      // Scroll ke card
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Highlight card dengan animasi
      card.style.transition = 'box-shadow 0.3s ease';
      card.style.boxShadow = '0 0 30px var(--brand-400), 0 0 60px var(--brand-400)66';
      
      // Hapus highlight setelah 2 detik
      setTimeout(() => {
        card.style.boxShadow = '';
      }, 2000);
      
      // Jika modul punya tab internal, bisa di-expand di sini
      if (tab === 'lps' && window._expandLPSCard) {
        window._expandLPSCard();
      }
    }
  }, 300);
}
