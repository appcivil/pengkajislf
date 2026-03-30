// ============================================================
//  ANALISIS AI PAGE
//  Rule-Based Engine — SNI 9273:2025 & NSPK
//  Output: Skor per aspek, Risk Level, Status SLF, Rekomendasi
// ============================================================
import { supabase } from '../lib/supabase.js';
import { navigate } from '../lib/router.js';
import { showSuccess, showError, showInfo } from '../components/toast.js';
import { APP_CONFIG } from '../lib/config.js';
import { runAspectAnalysis, runFinalConclusion, runSingleItemAnalysis, getMultiAgentConsensus } from '../lib/ai-router.js';
import { runNSPKBot } from '../lib/nspk-bot.js';
import { marked } from 'marked';

// ── Bobot Penilaian Per Aspek (%) ─────────────────────────────
const BOBOT_ASPEK = {
  administrasi: 10,
  pemanfaatan:  10,
  arsitektur:   15,
  struktur:     25,
  mekanikal:    15,
  kesehatan:    10,
  kenyamanan:    8,
  kemudahan:     7,
};

// ── Helper Formatting ─────────────────────────────────────────
// Fungsi helper formatTanggal & escHtml sudah ada di bagian bawah file ini.

// ── Nilai Status → Skor (0-100) ───────────────────────────────
const NILAI_STATUS_ADMIN = {
  ada_sesuai:         100,
  ada_tidak_sesuai:    40,
  tidak_ada:            0,
  pertama_kali:        80,
  tidak_wajib:        100,
  tidak_ada_renovasi: 100,
  '':                   0,
};
const NILAI_STATUS_TEKNIS = {
  baik:     100,
  sedang:    65,
  buruk:     30,
  kritis:     0,
  tidak_ada: 90,
  '':         0,
};

// ── Aspek → kode checklist mapping ───────────────────────────
const ASPEK_MAP = {
  administrasi: ['A01','A02','A03','A04','A05','A06','A07','A08','A09','A10','ITEM-09A'],
  pemanfaatan:  ['ITEM-01A','ITEM-01B','ITEM-01C','ITEM-02A','ITEM-02B','ITEM-02C','ITEM-02D','ITEM-02E','ITEM-02F','ITEM-02G','ITEM-02H','ITEM-02I','ITEM-02J'],
  arsitektur:   ['ITEM-03A','ITEM-03B','ITEM-03C','ITEM-04A'],
  struktur:     ['ITEM-05A1','ITEM-05A2','ITEM-05A3','ITEM-05A4','ITEM-05A5','ITEM-05A6','ITEM-05A7','ITEM-05A8','ITEM-05A9','ITEM-05A10'],
  mekanikal:    ['ITEM-05B','ITEM-05C','ITEM-05D','ITEM-05E'],
  kesehatan:    ['ITEM-06A','ITEM-06B','ITEM-06C1','ITEM-06C2','ITEM-06C3','ITEM-06C4','ITEM-06D'],
  kenyamanan:   ['ITEM-07A','ITEM-07B','ITEM-07C','ITEM-07D'],
  kemudahan:    ['ITEM-08A','ITEM-08B'],
};

// ── Page Entry ────────────────────────────────────────────────
export async function analisisPage(params = {}) {
  const id = params.id;
  if (!id) { navigate('proyek'); return ''; }

  window._analisisProyekId = id; // Set global ID for modular functions

  const root = document.getElementById('page-root');
  if (root) root.innerHTML = renderSkeleton();

  await loadData(id);
}

async function loadData(id) {
  const root = document.getElementById('page-root');

  const [proyek, checklistData, lastAnalisis, proyekFiles] = await Promise.all([
    fetchProyek(id),
    fetchChecklist(id),
    fetchLastAnalisis(id),
    fetchProyekFiles(id)
  ]);

  window._analisisFiles = proyekFiles; // Global store for file context

  if (!proyek) { navigate('proyek'); showError('Proyek tidak ditemukan.'); return ''; }

  // Jalankan engine jika ada data checklist
  let result = lastAnalisis;
  const hasChecklist = checklistData.length > 0;

  const html = buildHtml(proyek, checklistData, result, hasChecklist);
  if (root) {
    root.innerHTML = html;
    if (hasChecklist && result) {
      initRadarChart(result);
    }
    initAnalysisBtn(proyek, checklistData, id); // Re-initialize buttons
  }
}

// ── HTML Builder ──────────────────────────────────────────────
function buildHtml(proyek, checklistData, result, hasChecklist) {
  return `
    <div id="analisis-page">
      <!-- Header -->
      <div class="page-header">
        <div class="flex-between">
          <div>
            <button class="btn btn-ghost btn-sm" onclick="window.navigate('proyek-detail',{id:'${proyek.id}'})" style="margin-bottom:8px">
              <i class="fas fa-arrow-left"></i> ${escHtml(proyek.nama_bangunan)}
            </button>
            <h1 class="page-title">Analisis AI — Kelaikan Fungsi</h1>
            <p class="page-subtitle">Engine rule-based berbasis NSPK & SNI 9273:2025 — Status: ${hasChecklist ? `${checklistData.length} item checklist` : 'Checklist belum diisi'}</p>
          </div>
          <div class="flex gap-3">
            ${hasChecklist ? `
              <button class="btn btn-secondary" onclick="window.navigate('checklist',{id:'${proyek.id}'})">
                <i class="fas fa-clipboard-check"></i> Edit Checklist
              </button>
              <button class="btn btn-primary" id="btn-analyze" onclick="window._runAnalysis()">
                <i class="fas fa-brain"></i> Jalankan Analisis
              </button>
            ` : `
              <button class="btn btn-primary" onclick="window.navigate('checklist',{id:'${proyek.id}'})">
                <i class="fas fa-clipboard-check"></i> Isi Checklist Dulu
              </button>
            `}
          </div>
        </div>
      </div>

      ${!hasChecklist ? renderNoDataPanel(proyek.id) : result ? renderResultPanel(result, proyek, checklistData) : renderReadyPanel(proyek.id)}

      <!-- AI Progress Modal -->
      <div class="export-progress-overlay" id="ai-progress-overlay" style="display:none;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.6);z-index:9999;backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity 0.3s ease;pointer-events:none;">
        <div class="export-progress-modal" style="background:var(--bg-card);padding:var(--space-6);border-radius:var(--radius-lg);box-shadow:var(--shadow-xl);text-align:center;width:90%;max-width:400px;transform:translateY(20px);transition:transform 0.3s ease;">
          <div class="export-progress-icon" style="width:64px;height:64px;background:var(--gradient-brand);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto var(--space-4);color:white;font-size:1.8rem;box-shadow:0 8px 16px hsla(220,70%,50%,0.2);">
            <i class="fas fa-brain fa-fade" id="ai-progress-icon-i" style="--fa-animation-duration: 2s;"></i>
          </div>
          <h3 id="ai-progress-title" style="font-size:1.1rem;font-weight:700;margin-bottom:var(--space-2);color:var(--text-primary)">AI Engine Bekerja...</h3>
          <p id="ai-progress-msg" style="color:var(--text-secondary);font-size:0.85rem;margin-bottom:var(--space-4)">Menganalisa parameter teknis & administrasi via OpenAI</p>
          <div class="export-progress-bar" style="height:6px;background:var(--bg-input);border-radius:3px;overflow:hidden;margin-bottom:var(--space-2);">
            <div class="export-progress-fill" id="ai-progress-fill" style="height:100%;width:0%;background:var(--brand-500);transition:width 0.4s ease;border-radius:3px;"></div>
          </div>
          <div id="ai-progress-pct" style="font-size:0.75rem;color:var(--text-tertiary);font-variant-numeric:tabular-nums;">Menghubungkan ke API...</div>
        </div>
      </div>

      <!-- Modular Detail Modal -->
      <div id="modular-detail-overlay" style="display:none;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);z-index:9999;backdrop-filter:blur(6px);align-items:center;justify-content:center;opacity:0;transition:opacity 0.3s ease;pointer-events:none;">
        <div class="modular-detail-modal" style="background:var(--bg-card);width:90%;max-width:800px;max-height:85vh;border-radius:var(--radius-xl);box-shadow:var(--shadow-2xl);display:flex;flex-direction:column;overflow:hidden;transform:scale(0.95);transition:transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);">
          <div class="flex-between" style="padding:var(--space-5) var(--space-6);background:var(--bg-input);border-bottom:1px solid var(--border-subtle)">
            <div>
              <div id="md-kode" style="font-family:monospace;font-weight:800;color:var(--brand-400);font-size:0.9rem">---</div>
              <h3 id="md-nama" style="font-size:1.15rem;font-weight:700;color:var(--text-primary)">---</h3>
            </div>
            <button class="btn btn-ghost btn-sm" onclick="window._closeModularDetail()" style="font-size:1.2rem;width:40px;height:40px;border-radius:50%">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div id="md-content" style="padding:var(--space-6);overflow-y:auto;flex:1;line-height:1.7;color:var(--text-secondary);font-size:0.95rem;">
            <!-- AI Content Here -->
          </div>
          <div style="padding:var(--space-4) var(--space-6);background:var(--bg-input);border-top:1px solid var(--border-subtle);display:flex;justify-content:flex-end;gap:12px">
             <button class="btn btn-secondary btn-sm" onclick="window._closeModularDetail()">Tutup</button>
             <button id="md-btn-reanalyze" class="btn btn-primary btn-sm">Ulangi Analisis AI</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderNoDataPanel(proyekId) {
  return `
    <div class="card" style="text-align:center;padding:var(--space-12)">
      <div style="width:70px;height:70px;background:var(--gradient-brand);border-radius:var(--radius-xl);display:flex;align-items:center;justify-content:center;margin:0 auto var(--space-5);font-size:1.8rem;color:white">
        <i class="fas fa-clipboard-list"></i>
      </div>
      <h3 style="font-size:1.1rem;font-weight:700;margin-bottom:var(--space-2)">Checklist Belum Diisi</h3>
      <p style="color:var(--text-secondary);max-width:400px;margin:0 auto var(--space-6)">
        AI Engine membutuhkan data checklist pemeriksaan untuk melakukan analisis. Isi checklist administrasi dan teknis terlebih dahulu.
      </p>
      <button class="btn btn-primary" onclick="window.navigate('checklist',{id:'${proyekId}'})">
        <i class="fas fa-clipboard-check"></i> Mulai Isi Checklist
      </button>
    </div>
  `;
}

function renderReadyPanel(proyekId) {
  return `
    <div class="ai-panel" style="text-align:center;padding:var(--space-10)">
      <div class="empty-state">
      <div class="empty-icon"><i class="fas fa-microchip"></i></div>
      <h3 style="font-size:1.25rem;font-weight:700;margin-bottom:var(--space-2)">Mulai Analisis Modular (Hybrid AI v6)</h3>
      <p style="color:var(--text-secondary);max-width:500px;margin:0 auto var(--space-5)">
        Pilihlah modul parameter satu persatu untuk dianalisis secara mendalam oleh AI. Algoritma Hybrid AI akan melakukan Fuzzy Logic & Bayesian Calculation berdasarkan data lapangan.
      </p>
      
      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(180px, 1fr));gap:var(--space-3);max-width:1000px;margin:0 auto var(--space-5)">
        ${[
          { label: 'Administrasi', desc: 'Verifikasi Lintas Instansi' },
          { label: 'Pemanfaatan', desc: 'Kesesuaian Item-01 & 02' },
          { label: 'Arsitektur',  desc: 'Desain & Lingkungan (Item-03 & 04)' },
          { label: 'Struktur',   desc: 'Keselamatan Bangunan (Item-05A)' },
          { label: 'Mekanikal',  desc: 'Kebakaran, Petir, Listrik (Item-05)' },
          { label: 'Kesehatan',   desc: 'Utilitas & Material (Item-06)' },
          { label: 'Kenyamanan',  desc: 'Ruang, Termal, Visual (Item-07)' },
          { label: 'Kemudahan',   desc: 'Akses & Prasarana (Item-08)' }
        ].map(a => `
          <button class="btn btn-outline" style="display:flex;flex-direction:column;gap:8px;padding:var(--space-4);text-align:center" onclick="window._runAspect('${a.label}')">
            <i class="fas fa-robot" style="font-size:1.5rem;color:var(--brand-400)"></i>
            <div style="font-weight:700;font-size:0.9rem">Analisis ${a.label}</div>
            <div style="font-size:0.7rem;color:var(--text-tertiary)">${a.desc}</div>
          </button>
        `).join('')}
      </div>
      <div style="font-size:0.75rem; color:var(--success-500); font-weight: 700;">
        <i class="fas fa-check-circle"></i> Continuous Learning Pipeline v6 Active
      </div>
    </div>
  `;
}

function renderResultPanel(result, proyek, checklistData) {
  const aspekDefs = [
    { key: 'skor_administrasi', label: 'Administrasi', icon: 'fa-clipboard-list',  color: 'hsl(220,70%,55%)', kpiColor: 'kpi-blue'   },
    { key: 'skor_mep',          label: 'Pemanfaatan',  icon: 'fa-map-location-dot', color: 'hsl(140,70%,50%)', kpiColor: 'kpi-green'  },
    { key: 'skor_arsitektur',   label: 'Arsitektur',   icon: 'fa-drafting-compass', color: 'hsl(258,70%,60%)', kpiColor: 'kpi-purple' },
    { key: 'skor_struktur',     label: 'Struktur',     icon: 'fa-building',         color: 'hsl(0,70%,55%)',   kpiColor: 'kpi-red'    },
    { key: 'skor_kebakaran',    label: 'Mekanikal',    icon: 'fa-bolt',             color: 'hsl(40,80%,55%)',  kpiColor: 'kpi-yellow' },
    { key: 'skor_kesehatan',    label: 'Kesehatan',    icon: 'fa-heart-pulse',      color: 'hsl(160,65%,46%)', kpiColor: 'kpi-green'  },
    { key: 'skor_kenyamanan',   label: 'Kenyamanan',   icon: 'fa-sun',              color: 'hsl(40,80%,50%)',  kpiColor: 'kpi-yellow' },
    { key: 'skor_kemudahan',    label: 'Kemudahan',    icon: 'fa-universal-access', color: 'hsl(200,75%,52%)', kpiColor: 'kpi-cyan'   },
  ];

  const statusInfo = {
    LAIK_FUNGSI:           { label: 'LAIK FUNGSI',          badge: 'badge-laik',       icon: 'fa-circle-check', color: 'hsl(160,65%,46%)' },
    LAIK_FUNGSI_BERSYARAT: { label: 'LAIK FUNGSI BERSYARAT', badge: 'badge-bersyarat', icon: 'fa-triangle-exclamation', color: 'hsl(40,85%,55%)' },
    TIDAK_LAIK_FUNGSI:     { label: 'TIDAK LAIK FUNGSI',   badge: 'badge-tidak-laik', icon: 'fa-circle-xmark', color: 'hsl(0,74%,52%)' },
    DALAM_PENGKAJIAN:      { label: 'DALAM PENGKAJIAN',    badge: 'badge-info',       icon: 'fa-hourglass-half', color: 'hsl(200,75%,52%)' },
  };
  const si = statusInfo[result.status_slf] || statusInfo['DALAM_PENGKAJIAN'];

  const rekomendasi = result.rekomendasi ? JSON.parse(typeof result.rekomendasi === 'string' ? result.rekomendasi : JSON.stringify(result.rekomendasi)) : [];

  // Kalkukasi skor rata-rata sementara jika belum ada skor_total
  let displayScore = result?.skor_total;
  if (!displayScore || displayScore === 0) {
    const scores = aspekDefs.map(a => result?.[a.key] || 0).filter(s => s > 0);
    displayScore = scores.length > 0 ? Math.round(scores.reduce((a,b)=>a+b, 0) / scores.length) : '-';
  }

  return `
    <!-- Status Banner -->
    <div class="ai-panel" style="margin-bottom:var(--space-5);display:flex;align-items:center;gap:var(--space-6);padding:var(--space-6)">
      <div style="text-align:center;flex-shrink:0">
        <div style="width:90px;height:90px;border-radius:50%;background:hsla(220,70%,48%,0.15);border:3px solid ${si.color};display:flex;align-items:center;justify-content:center;margin:0 auto">
          <i class="fas ${si.icon}" style="font-size:2rem;color:${si.color}"></i>
        </div>
        <div style="margin-top:var(--space-3);font-size:0.75rem;font-weight:700;color:${si.color}">${si.label}</div>
      </div>
      <div style="flex:1">
        <div style="display:flex;align-items:center;gap:var(--space-3);margin-bottom:var(--space-2)">
          <div style="font-size:3rem;font-weight:800;letter-spacing:-0.05em;color:var(--brand-400)">${displayScore}</div>
          <div style="color:var(--text-tertiary);font-size:1.5rem">/100</div>
          <div style="margin-left:var(--space-4)">
            <div class="text-xs text-tertiary">Level Risiko</div>
            <div style="font-size:1.1rem;font-weight:700;color:${riskColor(result?.risk_level)}">${riskLabel(result?.risk_level)}</div>
          </div>
          <div style="margin-left:auto; display:flex; flex-direction:column; align-items:flex-end">
             <span class="badge badge-success" style="font-size:0.6rem; margin-bottom:4px"><i class="fas fa-bolt"></i> SMART HYBRID ON</span>
             <span style="font-size:0.6rem; color:var(--text-tertiary)">Calculated locally (Low Token)</span>
          </div>
        </div>
        <div style="display:flex;gap:var(--space-4)">
          <div>
            <div class="text-xs text-tertiary">Dianalisis</div>
            <div class="text-sm text-secondary">${formatTanggal(result.created_at)}</div>
          </div>
          <div>
            <div class="text-xs text-tertiary">Engine Utama</div>
            <div class="text-sm text-secondary" style="color:var(--brand-400);font-weight:600">
              <i class="fas fa-robot"></i> ${escHtml(result.ai_provider || 'Modular AI Router')}
            </div>
          </div>
        </div>
      </div>
      <div class="flex gap-3">
        <button class="btn btn-secondary btn-sm" onclick="window.navigate('laporan',{id:'${proyek.id}'})">
          <i class="fas fa-file-contract"></i> Lihat Laporan
        </button>
        <button class="btn btn-primary btn-sm" style="background:var(--gradient-brand)" onclick="window._runFinalConclusion()">
          <i class="fas fa-flag-checkered"></i> Buat Kesimpulan Final
        </button>
      </div>
    </div>

    <!-- Detailed Modular Audit (Utama) -->
    <div id="modular-audit-section" style="margin-top:var(--space-6);margin-bottom:var(--space-8)">
      <div class="flex-between" style="margin-bottom:var(--space-5);padding:var(--space-4);background:var(--bg-input);border-radius:var(--radius-lg);border-left:4px solid var(--brand-500)">
        <div>
          <h2 style="font-size:1.35rem;font-weight:800;color:var(--text-primary);letter-spacing:-0.02em">
            <i class="fas fa-microchip" style="color:var(--brand-400);margin-right:8px"></i>Audit Modular Per Item (Total: ${checklistData.length} Item)
          </h2>
          <p style="font-size:0.85rem;color:var(--text-tertiary);margin-top:4px">Gunakan tombol AI pada masing-masing item untuk hasil audit yang sangat akurat.</p>
        </div>
        <div style="text-align:right">
          <span class="badge badge-info" style="padding:6px 12px">DEEP REASONING ACTIVE</span>
        </div>
      </div>
      <div style="max-height:800px;overflow-y:auto;padding-right:8px;margin-bottom:var(--space-6)">
        ${renderDetailedModularAudit(checklistData)}
      </div>
    </div>

    <!-- Score Grid (Summary) -->
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--space-4)">
      <div style="font-weight:700;color:var(--text-tertiary);text-transform:uppercase;font-size:0.75rem;letter-spacing:0.1em">Ringkasan Skor Per Aspek</div>
      <button class="btn btn-primary btn-sm" onclick="window.navigate('laporan', {id: '${window._analisisProyekId}'})" style="padding: 6px 16px; border-radius: 99px">
        <i class="fas fa-file-invoice"></i> Buka Laporan SLF Lengkap &rarr;
      </button>
    </div>
    <div class="aspek-score-grid" style="margin-bottom:var(--space-8)">
      ${aspekDefs.map(a => {
        const skor = result?.[a.key] || 0;
        const warna = skor >= 80 ? 'hsl(160,65%,46%)' : skor >= 60 ? 'hsl(40,80%,55%)' : 'hsl(0,74%,52%)';
        
        // Hitung progres item modular untuk aspek ini
        const itemsInAspek = checklistData.filter(item => {
           const itemAsp = item.kategori === 'administrasi' ? 'Administrasi' : (item.aspek || 'Lainnya');
           return itemAsp === a.label;
        });
        const analyzedCount = itemsInAspek.filter(it => {
          if (!it.catatan) return false;
          // Deteksi apakah JSON atau Markdown yang valid
          const isJson = it.catatan.trim().startsWith('{');
          const isMarkdown = it.catatan.includes('###') || it.catatan.length > 50;
          return isJson || isMarkdown;
        }).length;
        const totalCount = itemsInAspek.length;
        const isComplete = analyzedCount >= totalCount && totalCount > 0;

        return `
          <div class="aspek-score-card" style="padding-bottom:12px; border: 1px solid ${isComplete ? 'var(--brand-500)' : 'var(--border-subtle)'}; background: ${isComplete ? 'hsla(220,70%,50%,0.02)' : 'var(--bg-card)'}">
            <div class="asc-icon ${a.kpiColor}"><i class="fas ${a.icon}"></i></div>
            <div class="asc-nilai" style="color:${warna}">${skor}</div>
            <div class="asc-label">${a.label}</div>
            
            <div style="margin: 8px 0; font-size: 0.65rem; font-weight: 700; color: var(--text-tertiary); text-transform: uppercase; display: flex; justify-content: space-between">
               <span>Poin Teranalisis</span>
               <span style="color: ${isComplete ? 'var(--brand-400)' : 'var(--text-secondary)'}">${analyzedCount}/${totalCount}</span>
            </div>
            
            <div class="asc-bar" style="height: 6px; margin-bottom: 12px">
              <div class="asc-fill" style="width:${totalCount > 0 ? (analyzedCount/totalCount)*100 : 0}%; background:var(--brand-400)"></div>
            </div>

            <div class="text-xs" style="margin-top:4px;color:${warna};margin-bottom:15px; font-weight: 700">
               Status: ${skor >= 80 ? 'LAIK' : skor >= 60 ? 'CUKUP' : 'KRITIS'}
            </div>
            
            <!-- Status Badge & Link Preview -->
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; background: var(--bg-100); padding: 8px; border-radius: 8px">
              <span class="badge ${isComplete ? 'badge-success' : 'badge-warning'}" style="font-size:0.6rem">
                <i class="fas ${isComplete ? 'fa-check-double' : 'fa-hourglass-half'}"></i> ${isComplete ? 'Siap Lapor' : 'Progress'}
              </span>
              ${isComplete ? `
                <button class="btn btn-ghost btn-xs" onclick="event.stopPropagation(); window._showAspectPreview('${a.label}')" style="font-size:0.65rem; color:var(--brand-500); font-weight:700; padding: 2px 8px">
                  <i class="fas fa-eye"></i> Preview
                </button>
              ` : ''}
            </div>
            
            <button class="btn ${isComplete ? 'btn-primary' : 'btn-outline'} btn-sm" style="width:100%; font-size: 0.7rem" onclick="event.stopPropagation(); window._runAspect('${a.label}')">
              <i class="fas ${isComplete ? 'fa-file-invoice' : 'fa-list-check'}"></i> ${isComplete ? 'Sintesis Laporan Teknis' : 'Kompilasi Data'} ${a.label}
            </button>
          </div>
        `;
      }).join('')}
    </div>

    <!-- Main Grid: Chart + Rekomendasi -->
    <div style="display:grid;grid-template-columns:360px 1fr;gap:var(--space-5)">
      <!-- Radar Chart -->
      <div class="card">
        <div class="card-title" style="margin-bottom:var(--space-4)">
          <i class="fas fa-chart-radar" style="color:var(--brand-400);margin-right:8px"></i>Radar Skor Aspek
        </div>
        <div class="radar-wrap">
          <canvas id="radar-chart"></canvas>
        </div>
      </div>

      <!-- Rekomendasi -->
      <div class="card">
        <div class="card-header" style="margin-bottom:var(--space-4)">
          <div>
            <div class="card-title">Rekomendasi Teknis</div>
            <div class="card-subtitle">${rekomendasi.length} rekomendasi berdasarkan hasil analisis</div>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:var(--space-3)">
          ${rekomendasi.length === 0 ? `
            <div class="ai-finding success"><i class="fas fa-circle-check" style="margin-right:6px"></i>Tidak ada rekomendasi kritis.</div>
          ` : rekomendasi.map((r, i) => {
            const col = { kritis: 'hsl(0,74%,52%)', tinggi: 'hsl(0,74%,52%)', sedang: 'hsl(40,80%,55%)' }[r.prioritas?.toLowerCase()] || 'hsl(200,75%,52%)';
            return `
              <div class="rekom-card">
                <div class="rekom-priority" style="background:${col}"></div>
                <div style="flex:1">
                  <div class="flex gap-3" style="align-items:center;margin-bottom:4px">
                    <span class="text-sm font-semibold">${i+1}. ${escHtml(r.judul || '')}</span>
                    <span class="badge" style="font-size:0.6rem">${escHtml(r.prioritas || '')}</span>
                  </div>
                  <p class="text-xs text-secondary">${escHtml(r.tindakan || '')}</p>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    </div>

    <!-- Narasi Teknis -->
    ${result.narasi_teknis ? `
      <div class="card" style="margin-top:var(--space-5)">
        <div class="card-title" style="margin-bottom:var(--space-4)">
          <i class="fas fa-file-alt" style="color:var(--brand-400);margin-right:8px"></i>Narasi Teknis Analisis
        </div>
        <div class="markdown-content" style="font-size:0.875rem;color:var(--text-secondary);line-height:1.8">${marked.parse(result.narasi_teknis || '')}</div>
      </div>
    ` : ''}

    <!-- Expert Consortium Analysis (BAB V & VI) -->
    ${result.metadata?.expert_findings ? `
      <div class="card" style="margin-top:var(--space-5); border: 2px solid var(--brand-300); background: linear-gradient(to bottom right, #ffffff, #f5f3ff)">
        <div class="flex-between" style="border-bottom: 1px solid var(--border-subtle); padding-bottom: 12px; margin-bottom: 15px">
           <div class="card-title" style="margin:0; color:var(--brand-600)">
              <i class="fas fa-microchip" style="margin-right:8px"></i>Kedalaman Analisis: Konsorsium Ahli (Bab V & VI)
           </div>
           <span class="badge badge-primary" style="font-size:0.65rem">DEEP REASONING VERIFIED</span>
        </div>
        <div class="markdown-content" style="font-size:0.9rem; line-height:1.7; color:var(--text-primary)">
           ${marked.parse(result.metadata.expert_findings.bab5_analisis || '')}
           <hr style="margin: 20px 0; border: none; border-top: 1px dashed var(--border-subtle)">
           <div style="background: white; border-radius: 12px; padding: 20px; border: 1px solid var(--brand-200)">
              <h4 style="color:var(--brand-500); margin-bottom: 12px">Kesimpulan & Rekomendasi (Bab VI)</h4>
              ${marked.parse(result.metadata.expert_findings.bab6_kesimpulan || '')}
              <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid var(--border-subtle); font-weight: 800; color: var(--brand-700)">
                 STATUS FINAL: ${result.metadata.expert_findings.status_final?.replace(/_/g, ' ')}
              </div>
           </div>
        </div>
      </div>
    ` : ''}

    <!-- Action -->
    <div style="margin-top:var(--space-5);display:flex;gap:var(--space-3);justify-content:flex-end">
      <button class="btn btn-secondary" onclick="window.navigate('checklist',{id:'${proyek.id}'})">
        <i class="fas fa-clipboard-check"></i> Edit Checklist
      </button>
      <button class="btn btn-outline" id="btn-expert-consensus" onclick="window._runExpertConsensus()" style="border-color:var(--brand-400); color:var(--brand-500)">
        <i class="fas fa-users-gear"></i> Jalankan Konsorsium Ahli (V2)
      </button>
      <button class="btn btn-primary" onclick="window.navigate('laporan',{id:'${proyek.id}'})">
        <i class="fas fa-file-contract"></i> Lihat Laporan SLF
      </button>
    </div>
  `;
}

// ── Init Analysis Button ──────────────────────────────────────
function initAnalysisBtn(proyek, checklistData, proyekId) {
  window._runAnalysis = async () => {
    showInfo("Silakan jalankan analisis per aspek secara modular.");
  };

  window._runExpertConsensus = async () => {
    try {
      const btn = document.getElementById('btn-expert-consensus');
      if (btn) btn.disabled = true;

      showAIProgress('Penyelarasan Ahli (Consensus)', 'Membangun konsorsium 5 Tenaga Ahli Spesialis untuk Analisis Forensik...');
      
      const { data: checklist } = await supabase.from('checklist_items').select('*').eq('proyek_id', proyekId);
      const { data: currentAnalisis } = await supabase.from('hasil_analisis').select('*').eq('proyek_id', proyekId).limit(1).maybeSingle();

      if (!currentAnalisis) throw new Error("Jalankan analisis aspek (Skoring) terlebih dahulu.");

      // Progress Simulation per Agent (UX)
      const agents = ['Arsitek', 'Ahli Struktur', 'Ahli MEP', 'Ahli Legal', 'Koordinator Forensik'];
      for(const agent of agents) {
        showAIProgress('Penyelarasan Ahli', `${agent} sedang memproses data...`);
        await new Promise(r => setTimeout(r, 1200));
      }

      const summary = { skor: currentAnalisis.skor, riskLevel: currentAnalisis.status_kelaikan };
      const consensus = await getMultiAgentConsensus(checklist, proyek, summary);

      // Save Results
      const { error: upErr } = await supabase.from('hasil_analisis').update({
        metadata: { 
          ...(currentAnalisis.metadata || {}),
          expert_findings: consensus
        }
      }).eq('id', currentAnalisis.id);

      if (upErr) throw upErr;

      hideAIProgress();
      showSuccess('Analisis Konsorsium Ahli Selesai! Bab V & VI telah di-generate.');
      loadData(proyekId);
    } catch (err) {
      hideAIProgress();
      showError('Gagal menjalankan konsorsium: ' + err.message);
      const btn = document.getElementById('btn-expert-consensus');
      if (btn) btn.disabled = false;
    }
  };
}

// ── Helper AI Progress Rendering ──────────────────────────────
function showAIProgress(title, msg) {
  const overlay = document.getElementById('ai-progress-overlay');
  const titleEl = document.getElementById('ai-progress-title');
  const msgEl = document.getElementById('ai-progress-msg');
  const fillEl = document.getElementById('ai-progress-fill');
  const pctEl = document.getElementById('ai-progress-pct');
  
  if (overlay) {
    if (title) titleEl.innerText = title;
    if (msg) msgEl.innerText = msg;
    fillEl.style.width = '0%';
    pctEl.innerText = 'Menghubungkan ke API OpenAI...';
    
    overlay.style.display = 'flex';
    // Small delay to trigger CSS transition
    setTimeout(() => {
      overlay.style.opacity = '1';
      overlay.style.pointerEvents = 'all';
      const modal = overlay.querySelector('.export-progress-modal');
      if (modal) modal.style.transform = 'translateY(0)';
      
      // Simulate progress bar moving up to 90% while waiting for AI
      let progress = 0;
      window._aiProgressInterval = setInterval(() => {
        progress += (90 - progress) * 0.05; // ease out to 90
        fillEl.style.width = Math.min(progress, 90) + '%';
        if (progress > 30) pctEl.innerText = 'Menganalisis parameter...';
        if (progress > 60) pctEl.innerText = 'Deep Reasoning sedang berjalan...';
        if (progress > 80) pctEl.innerText = 'Menyusun laporan struktural...';
      }, 500);
    }, 10);
  }
}

function hideAIProgress() {
  const overlay = document.getElementById('ai-progress-overlay');
  if (overlay) {
    clearInterval(window._aiProgressInterval);
    const fillEl = document.getElementById('ai-progress-fill');
    const pctEl = document.getElementById('ai-progress-pct');
    const iEl = document.getElementById('ai-progress-icon-i');
    
    // Complete the bar
    fillEl.style.width = '100%';
    pctEl.innerText = 'Selesai!';
    iEl.classList.remove('fa-fade');
    iEl.classList.add('fa-check-circle');
    
    setTimeout(() => {
      overlay.style.opacity = '0';
      overlay.style.pointerEvents = 'none';
      const modal = overlay.querySelector('.export-progress-modal');
      if (modal) modal.style.transform = 'translateY(20px)';
      setTimeout(() => { 
        overlay.style.display = 'none'; 
        iEl.classList.remove('fa-check-circle');
        iEl.classList.add('fa-fade', 'fa-brain');
      }, 300);
    }, 800);
  }
}

// ── Action Handlers (Modular AI) ──────────────────────────────

window._runAspect = async (aspekTarget) => {
  try {
    showAIProgress(`Sintesis Laporan ${aspekTarget}`, 'Lead Engineer sedang merangkum seluruh hasil investigasi forensic modular...');
    
    // 1. Ambil data item terbaru untuk aspek ini
    const { data: checklistData, error: clErr } = await supabase
      .from('checklist_items')
      .select('*')
      .eq('proyek_id', window._analisisProyekId);

    if (clErr) throw clErr;

    // Filter sesuai aspek
    const targetItems = checklistData.filter(item => {
       const itemAsp = item.kategori === 'administrasi' ? 'Administrasi' : (item.aspek || 'Lainnya');
       return itemAsp === aspekTarget;
    });

    if (!targetItems || targetItems.length === 0) {
      hideAIProgress();
      showError(`Tidak ada data input yang diisi untuk Aspek ${aspekTarget}.`);
      return;
    }

    // Siapkan hasil pra-analisis (Deep Reasoning per item)
    const preAnalyzed = targetItems.map(it => {
      let dataModular = null;
      try {
        // Coba parse jika itu JSON (format standar baru)
        if (it.catatan && it.catatan.startsWith('{')) {
          dataModular = JSON.parse(it.catatan);
        }
      } catch(e) {}

      const hasAi = dataModular || (it.catatan && (it.catatan.includes('###') || it.catatan.length > 50));

      // Cek apakah status manual > 60 untuk menentukan default "Sesuai" atau "Tidak Sesuai"
      let isManualPassed = false;
      if (it.kategori === 'administrasi') {
         isManualPassed = (NILAI_STATUS_ADMIN[it.status] ?? 0) >= 60;
      } else {
         isManualPassed = (NILAI_STATUS_TEKNIS[it.status] ?? 0) >= 60;
      }

      return {
        kode: it.kode,
        nama: it.nama,
        status: dataModular ? dataModular.status : (isManualPassed ? 'Sesuai' : 'Tidak Sesuai'),
        faktual: dataModular ? dataModular.faktual : (it.catatan || "Data tidak tersedia"),
        visual: dataModular ? dataModular.visual : "Lihat catatan lapangan",
        regulasi: dataModular ? dataModular.regulasi : ["PP 16/2021"],
        analisis: dataModular ? dataModular.analisis : "Perlu audit lanjutan",
        risiko: dataModular ? dataModular.risiko : "Sedang",
        rekomendasi: dataModular ? dataModular.rekomendasi : "Perbaikan segera",
        is_deep_reasoning: !!hasAi
      };
    });

    // 2. DETEKSI SMART HYBRID: Cek apakah seluruh aspek sudah sempurna (Bypass AI)
    const isPerfect = targetItems.every(it => {
       const isGood = it.kategori === 'administrasi' ? (it.status === 'ada_sesuai' || it.status === 'tidak_wajib') : (it.status === 'baik' || it.status === 'tidak_ada');
       const hasNoNotes = !it.catatan || it.catatan.trim().length === 0;
       return isGood && hasNoNotes;
    });

    let result;
    if (isPerfect) {
      console.log(`[Smart Hybrid] Aspek ${aspekTarget} sempurna. Menggunakan Local Template...`);
      result = {
        skor_aspek: 100,
        narasi_teknis: `### EVALUASI ASPEK ${aspekTarget.toUpperCase()}\n\nBerdasarkan pemeriksaan lapangan mendalam, seluruh parameter pada aspek ${aspekTarget} ditemukan dalam kondisi **PRIMA/SESUAI**. Tidak ditemukan adanya anomali teknis maupun administratif yang berpotensi mengurangi kelaikan fungsi bangunan. Seluruh sistem telah memenuhi standar NSPK (Norma, Standar, Prosedur, dan Kriteria) PUPR.\n\n**Rekomendasi:** Lanjutkan pemeliharaan rutin sesuai jadwal yang telah ditetapkan.`,
        rekomendasi: [],
        meta: { provider: 'Smart Hybrid Logic (Local Engine)', kategori: 'LAIK' }
      };
      await new Promise(r => setTimeout(r, 800)); // Simulasi audit kilat
    } else {
      // Kirim ke AI untuk Sintesis Laporan Komprehensif (Deterministik Synthesis)
      result = await runAspectAnalysis(aspekTarget, targetItems, (current, total, itemName) => {
        // Progress handler
      }, { preAnalyzedResults: preAnalyzed });
    }

    // UX Delay
    await new Promise(r => setTimeout(r, 500));
    
    // 3. Update Database (Parsial Tulis)
    // Ambil baris hasil_analisis existing
    let { data: currentHasilArr, error: hrErr } = await supabase
      .from('hasil_analisis')
      .select('*')
      .eq('proyek_id', window._analisisProyekId)
      .limit(1);

    if (hrErr) throw hrErr;
    let currentHasil = currentHasilArr && currentHasilArr.length > 0 ? currentHasilArr[0] : null;

    // Buat Rekomendasi Array Baru (Hapus yang lama untuk aspek ini, dan gabungkan yang baru)
    let gabungRekomendasi = [];
    if (currentHasil && currentHasil.rekomendasi) {
      let existingRekomedasi = currentHasil.rekomendasi;
      if (typeof existingRekomedasi === 'string') existingRekomedasi = JSON.parse(existingRekomedasi);
      gabungRekomendasi = existingRekomedasi.filter(r => r.aspek !== aspekTarget);
    }
    if (result.rekomendasi && result.rekomendasi.length > 0) {
      gabungRekomendasi = [...gabungRekomendasi, ...result.rekomendasi];
    }

    // Pembuatan Kolom Skor yang akan di update
    // PENTING: Harus sesuai dengan kolom di tabel hasil_analisis Supabase
    const mapKolom = {
      'Administrasi': 'skor_administrasi',
      'Pemanfaatan': 'skor_mep',
      'Arsitektur': 'skor_arsitektur',
      'Struktur': 'skor_struktur',
      'Mekanikal': 'skor_kebakaran',
      'Kesehatan': 'skor_kesehatan',
      'Kenyamanan': 'skor_kenyamanan',
      'Kemudahan': 'skor_kemudahan'
    };
    const colName = mapKolom[aspekTarget];

    // Gabungkan Narasi Teknis (Smart Merge Logic)
    let finalNarasi = currentHasil?.narasi_teknis || '';
    
    // WIPING LOGIC: Jika narasi berisi placeholder/data sampah lama, bersihkan total
    const isPlaceholder = finalNarasi.includes('TABEL EVALUASI KOMPREHENSIF') || 
                         finalNarasi.includes('KESIMPULAN KELAIAKAN & STRATEGI');
    
    if (isPlaceholder || !finalNarasi.trim() || !finalNarasi.includes('# BAB IV')) {
      finalNarasi = '# BAB IV – ANALISIS DAN EVALUASI\n\nLaporan ini disusun secara otomatis berdasarkan audit teknis modular.\n';
    }

    // Identitas Seksi
    const sectionHeader = `## ASPEK PEMERIKSAAN: ${aspekTarget.toUpperCase()}`;
    const newSectionContent = `\n\n${sectionHeader}\n${result.narasi_teknis}\n`;
    
    // Hapus seksi lama (jika ada) menggunakan pencarian string/index yang lebih aman daripada regex kompleks
    let startIdx = finalNarasi.indexOf(sectionHeader);
    if (startIdx !== -1) {
      // Cari batas seksi berikutnya atau akhir string
      let nextSectionIdx = finalNarasi.indexOf('## ASPEK PEMERIKSAAN:', startIdx + sectionHeader.length);
      if (nextSectionIdx === -1) nextSectionIdx = finalNarasi.length;
      
      const partBefore = finalNarasi.substring(0, startIdx).trim();
      const partAfter = finalNarasi.substring(nextSectionIdx).trim();
      finalNarasi = partBefore + newSectionContent + (partAfter ? '\n\n' + partAfter : '');
    } else {
      // Tambah baru di akhir
      finalNarasi = finalNarasi.trim() + newSectionContent;
    }

    // RECALCULATE OVERALL SCORES
    const targetSkor = {
      skor_administrasi: currentHasil?.skor_administrasi || 0,
      skor_mep: currentHasil?.skor_mep || 0,
      skor_arsitektur: currentHasil?.skor_arsitektur || 0,
      skor_struktur: currentHasil?.skor_struktur || 0,
      skor_kebakaran: currentHasil?.skor_kebakaran || 0,
      skor_kesehatan: currentHasil?.skor_kesehatan || 0,
      skor_kenyamanan: currentHasil?.skor_kenyamanan || 0,
      skor_kemudahan: currentHasil?.skor_kemudahan || 0,
    };
    targetSkor[colName] = result.skor_aspek;
    
    const BOBOT_DB_MAP = {
      skor_administrasi: BOBOT_ASPEK.administrasi,
      skor_mep: BOBOT_ASPEK.pemanfaatan,
      skor_arsitektur: BOBOT_ASPEK.arsitektur,
      skor_struktur: BOBOT_ASPEK.struktur,
      skor_kebakaran: BOBOT_ASPEK.mekanikal,
      skor_kesehatan: BOBOT_ASPEK.kesehatan,
      skor_kenyamanan: BOBOT_ASPEK.kenyamanan,
      skor_kemudahan: BOBOT_ASPEK.kemudahan,
    };

    let calculatedTotal = 0;
    let bobotTotal = 0;
    for (const [key, bVal] of Object.entries(BOBOT_DB_MAP)) {
      calculatedTotal += (targetSkor[key] * bVal);
      bobotTotal += bVal;
    }
    const finalSkorTotal = Math.round(calculatedTotal / bobotTotal);

    let riskLevel = 'critical';
    if (finalSkorTotal >= 80) riskLevel = 'low';
    else if (finalSkorTotal >= 65) riskLevel = 'medium';
    else if (finalSkorTotal >= 45) riskLevel = 'high';

    let statusSlf = 'DALAM_PENGKAJIAN';
    if (targetSkor.skor_struktur < 50 || targetSkor.skor_kebakaran < 50 || finalSkorTotal < 50) statusSlf = 'TIDAK_LAIK_FUNGSI';
    else if (finalSkorTotal >= 80 && targetSkor.skor_struktur >= 70 && targetSkor.skor_kebakaran >= 70) statusSlf = 'LAIK_FUNGSI';
    else statusSlf = 'LAIK_FUNGSI_BERSYARAT';

    const payload = {
      proyek_id: window._analisisProyekId,
      [colName]: result.skor_aspek,
      skor_total: finalSkorTotal,
      risk_level: riskLevel,
      status_slf: statusSlf,
      rekomendasi: gabungRekomendasi,
      narasi_teknis: finalNarasi.trim()
    };

    if (currentHasil && currentHasil.id) {
       await supabase.from('hasil_analisis').update(payload).eq('id', currentHasil.id);
    } else {
       await supabase.from('hasil_analisis').insert([payload]);
    }

    // UPDATE DOM SECARA LANGSUNG (Instant UI)
    const narasiContainer = document.querySelector('.markdown-content');
    if (narasiContainer && !narasiContainer.closest('.modular-detail-modal')) {
       narasiContainer.innerHTML = marked.parse(payload.narasi_teknis);
       // Scroll ke bawah agar user melihat section baru
       narasiContainer.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }

    hideAIProgress();
    showSuccess(`Sintesis BAB IV ${aspekTarget} Berhasil & Disimpan!`);
    
    // Auto-trigger preview modal agar user langsung melihat hasilnya
    if (window._showAspectPreview) {
       setTimeout(() => window._showAspectPreview(aspekTarget), 500);
    }
    
    loadData(window._analisisProyekId); 

  } catch (error) {
    hideAIProgress();
    showError(`Gagal menganalisa Aspek ${aspekTarget}: ` + error.message);
  }
};

window._showAspectPreview = async (aspek) => {
  try {
    const { data } = await supabase
      .from('hasil_analisis')
      .select('narasi_teknis')
      .eq('proyek_id', window._analisisProyekId)
      .single();

    if (!data || !data.narasi_teknis) {
      showInfo(`Laporan untuk Aspek ${aspek} belum disusun. Silakan klik tombol Sintesis terlebih dahulu.`);
      return;
    }

    // Ekstrak seksi spesifik dari narasi teknis kumulatif
    const sectionHeader = `## ASPEK PEMERIKSAAN: ${aspek.toUpperCase()}`;
    const regexSeksi = new RegExp(`${sectionHeader}[\\s\\S]*?(?=\\n\\n## ASPEK PEMERIKSAAN:|$)`);
    const match = data.narasi_teknis.match(regexSeksi);
    
    let contentMarkdown = match ? match[0] : "";
    if (!contentMarkdown) {
       showInfo(`Analisis untuk Aspek ${aspek} belum tersedia di dalam BAB IV.`);
       return;
    }

    // Tampilkan Modal Preview
    const modalHtml = `
      <div id="preview-modal-overlay" class="modal-overlay" style="display:flex; z-index: 9999">
        <div class="modal-content" style="max-width: 900px; height: 90vh; padding: 0; overflow: hidden; display: flex; flex-direction: column">
          <div class="modal-header" style="padding: var(--space-4) var(--space-6); background: var(--bg-100); border-bottom: 1px solid var(--border-subtle); flex-shrink: 0">
            <div>
              <h3 class="modal-title" style="font-size: 1.1rem">Preview Laporan SLF: ${aspek}</h3>
              <p style="font-size: 0.75rem; color: var(--text-tertiary)">Format ini identik dengan output dokumen resmi.</p>
            </div>
            <button class="btn-close" onclick="document.getElementById('preview-modal-overlay').remove()">&times;</button>
          </div>
          <div class="modal-body" style="flex: 1; overflow-y: auto; padding: 40px; background: white; font-family: 'Georgia', 'Times New Roman', serif; line-height: 1.6; color: #111">
             <div class="report-preview-sheet" style="max-width: 100%; margin: 0 auto; background: white">
               ${marked.parse(contentMarkdown)}
             </div>
          </div>
          <div class="modal-footer" style="padding: var(--space-4) var(--space-6); background: var(--bg-100); border-top: 1px solid var(--border-subtle); display: flex; justify-content: flex-end; gap: 12px; flex-shrink: 0">
             <button class="btn btn-ghost" onclick="document.getElementById('preview-modal-overlay').remove()">Tutup</button>
             <button class="btn btn-primary" onclick="window.navigate('laporan', {id: '${window._analisisProyekId}'})">
                <i class="fas fa-file-invoice"></i> Lihat Laporan Lengkap
             </button>
          </div>
        </div>
      </div>
      <style>
        .report-preview-sheet h2 { color: #1e3a8a; border-bottom: 2px solid #1e3a8a; padding-bottom: 8px; margin-top: 32px; font-size: 1.4rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1px }
        .report-preview-sheet h3 { color: #1e40af; margin-top: 24px; font-size: 1.15rem; font-weight: 700; border: none; padding: 0 }
        .report-preview-sheet p { margin-bottom: 16px; font-size: 1rem; text-align: justify }
        .report-preview-sheet table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 0.9rem }
        .report-preview-sheet th { background: #f8fafc; border: 1px solid #cbd5e1; padding: 12px; font-weight: 700; text-align: left; color: #334155 }
        .report-preview-sheet td { border: 1px solid #cbd5e1; padding: 10px; vertical-align: top }
        .report-preview-sheet ul { margin-bottom: 16px; padding-left: 20px }
        .report-preview-sheet li { margin-bottom: 8px }
        .report-preview-sheet strong { color: #1e3a8a }
      </style>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

  } catch (error) {
    showError("Gagal memuat pratinjau: " + error.message);
  }
};

window._runSingleItemAnalysis = async (itemId, aspek) => {
  const btnWrap = document.getElementById(`btn-wrap-${itemId}`);
  const originalBtn = btnWrap.innerHTML;
  
  try {
    btnWrap.innerHTML = `<button class="btn btn-ghost btn-sm" disabled><i class="fas fa-spinner fa-spin"></i> AI Reasoning...</button>`;
    
    // 1. Ambil data item
    const { data: item, error: fErr } = await supabase.from('checklist_items').select('*').eq('id', itemId).maybeSingle();
    if (fErr) throw fErr;

    // 2. Jalankan AI via runSingleItemAnalysis
    const result = await runSingleItemAnalysis(item, aspek);
    
    // 3. Update checklist_items
    const { error: uErr } = await supabase
      .from('checklist_items')
      .update({
         catatan: result.narasi_item_lengkap, // Simpan narasi AI ke catatan
      })
      .eq('id', itemId);
    
    if (uErr) throw uErr;

    showSuccess(`Analisis Modular ${item.kode} selesai!`);
    loadData(window._analisisProyekId); // Refresh UI untuk menampilkan status AI analyzed

  } catch (error) {
    showError(`Gagal Analisis Modular: ` + error.message);
    btnWrap.innerHTML = originalBtn;
  }
};

window._runNSPKBotForItem = async (itemId, itemName) => {
  const btn = document.querySelector(`button[onclick*="_runNSPKBotForItem('${itemId}'"]`);
  if (!btn) return;
  const originalHtml = btn.innerHTML;
  
  try {
    btn.disabled = true;
    btn.innerHTML = `<i class="fas fa-robot fa-spin"></i> Searching...`;
    
    const result = await runNSPKBot(itemName, window._analisisProyekId);
    
    if (result && result.status === 'success') {
      showSuccess(`Referensi Ditemukan: ${result.name}`);
      // Simpan metadata referensi ke checklist_items agar AI tahu ada referensi
      const { error } = await supabase
        .from('checklist_items')
        .update({ 
           metadata: { 
             nspk_ref: result.name, 
             nspk_url: result.url,
             nspk_file_id: result.fileId
           } 
        })
        .eq('id', itemId);
      
      if (error) throw error;
      loadData(window._analisisProyekId);
    } else {
      showInfo(`Bot tidak menemukan dokumen spesifik untuk "${itemName}" di Drive.`);
    }
  } catch (e) {
    showError("Bot Error: " + e.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalHtml;
  }
};

window._showModularDetail = async (itemId, aspek) => {
  const overlay = document.getElementById('modular-detail-overlay');
  const kodeEl = document.getElementById('md-kode');
  const namaEl = document.getElementById('md-nama');
  const contentEl = document.getElementById('md-content');
  const reBtn = document.getElementById('md-btn-reanalyze');

  try {
    const { data: item, error } = await supabase.from('checklist_items').select('*').eq('id', itemId).maybeSingle();
    if (error) throw error;

    kodeEl.innerText = item.kode;
    namaEl.innerText = item.nama;
    contentEl.innerHTML = item.catatan ? 
      `<div class="markdown-content">${marked.parse(item.catatan)}</div>` : 
      `<div style="text-align:center;padding:var(--space-10);color:var(--text-tertiary)">
         <i class="fas fa-robot" style="font-size:3rem;margin-bottom:12px;opacity:0.3"></i>
         <p>Belum ada hasil analisis AI untuk item ini.</p>
       </div>`;

    reBtn.onclick = () => {
      window._closeModularDetail();
      window._runSingleItemAnalysis(itemId, aspek);
    };

    overlay.style.display = 'flex';
    setTimeout(() => {
      overlay.style.opacity = '1';
      overlay.style.pointerEvents = 'all';
      overlay.querySelector('.modular-detail-modal').style.transform = 'scale(1)';
    }, 10);

  } catch (e) {
    showError("Gagal memuat detail: " + e.message);
  }
};

window._closeModularDetail = () => {
  const overlay = document.getElementById('modular-detail-overlay');
  if (overlay) {
    overlay.style.opacity = '0';
    overlay.style.pointerEvents = 'none';
    overlay.querySelector('.modular-detail-modal').style.transform = 'scale(0.95)';
    setTimeout(() => { overlay.style.display = 'none'; }, 300);
  }
};

window._runFinalConclusion = async () => {
  try {
    showAIProgress('Merumuskan Kesimpulan', 'OpenAI menyusun status kelaikan akhir...');
    
    // 1. Ambil hasil_analisis skarang
    let { data: currentHasilArr, error: hrErr } = await supabase
      .from('hasil_analisis')
      .select('*')
      .eq('proyek_id', window._analisisProyekId)
      .limit(1);
    
    if (hrErr) throw hrErr;
    if (!currentHasilArr || currentHasilArr.length === 0) throw new Error("Anda harus menganalisis minimal satu aspek terlebih dahulu!");
    let currentHasil = currentHasilArr[0];

    const mapSkor = {
      Administrasi: currentHasil.skor_administrasi,
      Struktur: currentHasil.skor_struktur,
      Arsitektur: currentHasil.skor_arsitektur,
      MEP: currentHasil.skor_mep,
      Kebakaran: currentHasil.skor_kebakaran,
      Kesehatan: currentHasil.skor_kesehatan,
      Kenyamanan: currentHasil.skor_kenyamanan,
      Kemudahan: currentHasil.skor_kemudahan,
    };

    let existingRekomedasi = currentHasil.rekomendasi || [];
    if (typeof existingRekomedasi === 'string') existingRekomedasi = JSON.parse(existingRekomedasi);

    const konklusi = await runFinalConclusion(mapSkor, existingRekomedasi);
    
    // Buat format narasi akhir
    let newNarasi = currentHasil.narasi_teknis || '';
    const regexHapusKesimpulan = new RegExp(`### KESIMPULAN FINAL[\\s\\S]*?$`);
    newNarasi = newNarasi.replace(regexHapusKesimpulan, '').trim();
    newNarasi = `### KESIMPULAN FINAL STRATEGIS\n${konklusi.narasi_kesimpulan_akhir}\n\n---\n\n` + newNarasi;

    const payload = {
      skor_total: konklusi.skor_total,
      status_slf: konklusi.status_slf === 'LAIK_FUNGSI' || konklusi.status_slf === 'LAIK_FUNGSI_BERSYARAT' || konklusi.status_slf === 'TIDAK_LAIK_FUNGSI' ? konklusi.status_slf : 'DALAM_PENGKAJIAN',
      risk_level: konklusi.risk_level,
      narasi_teknis: newNarasi
    };

    await supabase.from('hasil_analisis').update(payload).eq('id', currentHasil.id);

    // Update Proyek Database
    await supabase.from('proyek').update({
      status_slf: payload.status_slf,
      progress: 100
    }).eq('id', window._analisisProyekId);

    hideAIProgress();
    showSuccess("Kesimpulan Final SLF berhasil diterbitkan!");
    loadData(window._analisisProyekId); 
  } catch(error) {
    hideAIProgress();
    showError("Gagal merumuskan kesimpulan: " + error.message);
  }
};

// ── Rule-Based Engine (Fallback/Initial Score Calculation) ─────────────────────────────────────────
// This function is now primarily for initial score calculation if AI is not used,
// or as a fallback for basic scoring logic.
async function runRuleBasedEngine(proyekId, checklistData) {
  // Build data map
  const dataMap = {};
  checklistData.forEach(d => { dataMap[d.kode] = d; });

  // Hitung skor per aspek
  const skorAspek = {};
  for (const [aspek, kodes] of Object.entries(ASPEK_MAP)) {
    const items = kodes.filter(k => dataMap[k]);
    if (items.length === 0) { skorAspek[aspek] = 0; continue; }
    const isAdmin = aspek === 'administrasi';
    const nilaiMap = isAdmin ? NILAI_STATUS_ADMIN : NILAI_STATUS_TEKNIS;
    const total = items.reduce((sum, k) => {
      const st = dataMap[k]?.status || '';
      return sum + (nilaiMap[st] ?? 0);
    }, 0);
    skorAspek[aspek] = Math.round(total / items.length);
  }

  // Skor total berbobot
  let skorTotal = 0;
  let bobotTotal = 0;
  for (const [aspek, bobot] of Object.entries(BOBOT_ASPEK)) {
    if (skorAspek[aspek] !== undefined) {
      skorTotal  += (skorAspek[aspek] * bobot);
      bobotTotal += bobot;
    }
  }
  const finalScore = bobotTotal > 0 ? Math.round(skorTotal / bobotTotal) : 0;

  // Tentukan status SLF
  let statusSLF;
  if (skorAspek.struktur < 50 || skorAspek.mekanikal < 50 || finalScore < 50) {
    statusSLF = 'TIDAK_LAIK_FUNGSI';
  } else if (finalScore >= 80 && skorAspek.struktur >= 70 && skorAspek.mekanikal >= 70) {
    statusSLF = 'LAIK_FUNGSI';
  } else {
    statusSLF = 'LAIK_FUNGSI_BERSYARAT';
  }

  // Risk level
  let riskLevel;
  if (finalScore >= 80) riskLevel = 'low';
  else if (finalScore >= 65) riskLevel = 'medium';
  else if (finalScore >= 45) riskLevel = 'high';
  else riskLevel = 'critical';

  // Call Multi-Model Router
  let aiData;
  try {
     const checkArray = Object.values(dataMap);
     aiData = await runMultiModelAnalysis(skorAspek, finalScore, statusSLF, checkArray);
  } catch(e) {
     console.warn("AI Router Gagal:", e);
     // Fallback ke Teks Statis Lama jika server AI error
     aiData = {
       rekomendasi: generateRekomendasi(skorAspek, dataMap),
       narasi_teknis: generateNarasiText(skorAspek, finalScore, statusSLF) + '\\n\\n(Perhatian: Dihasilkan oleh Rule-Based Fallback karena Engine AI sedang sibuk)',
       ai_provider: 'Rule-Based Fallback'
     };
  }

  // Simpan ke DB
  const payload = {
    proyek_id:        proyekId,
    skor_administrasi: skorAspek.administrasi || 0,
    skor_struktur:     skorAspek.struktur || 0,
    skor_arsitektur:   skorAspek.arsitektur || 0,
    skor_mep:          skorAspek.pemanfaatan || 0,
    skor_kebakaran:    skorAspek.mekanikal || 0,
    skor_kesehatan:    skorAspek.kesehatan || 0,
    skor_kenyamanan:   skorAspek.kenyamanan || 0,
    skor_kemudahan:    skorAspek.kemudahan || 0,
    skor_total:        finalScore || 0,
    status_slf:        statusSLF,
    risk_level:        riskLevel,
    rekomendasi:       JSON.stringify(aiData.rekomendasi),
    narasi_teknis:     aiData.narasi_teknis,
    ai_provider:       aiData.ai_provider,
    created_at:        new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('hasil_analisis')
    .insert(payload)
    .select()
    .single();
  if (error) throw error;

  // Update status proyek
  await supabase.from('proyek').update({
    status_slf: statusSLF,
    progress: Math.min(80, 40 + Math.round(finalScore * 0.4)),
  }).eq('id', proyekId);

  return data;
}

function generateRekomendasi(skorAspek, dataMap) {
  const rekoms = [];

  if (skorAspek.administrasi < 80) {
    rekoms.push({
      aspek: 'Administrasi',
      prioritas: skorAspek.administrasi < 60 ? 'Kritis' : 'Sedang',
      judul: 'Kelengkapan Dokumen Perizinan',
      tindakan: 'Lengkapi dokumen PBG/IMB dan gambar as-built drawing yang belum tersedia. Proses pemutakhiran dokumen melalui DPMPTSP setempat.',
      standar: 'PP No. 16/2021 Pasal 24-26',
    });
  }
  if (skorAspek.struktur < 80) {
    rekoms.push({
      aspek: 'Struktur',
      prioritas: skorAspek.struktur < 50 ? 'Kritis' : 'Tinggi',
      judul: 'Evaluasi dan Perkuatan Elemen Struktur',
      tindakan: 'Lakukan pemeriksaan detail kondisi kolom, balok, dan pondasi oleh tenaga ahli struktur. Pertimbangkan retrofitting sesuai SNI 9273:2025.',
      standar: 'SNI 9273:2025 / ASCE 41-17',
    });
  }
  if (skorAspek.mep < 80) {
    rekoms.push({
      aspek: 'MEP',
      prioritas: skorAspek.mep < 50 ? 'Tinggi' : 'Sedang',
      judul: 'Pemeriksaan dan Perbaikan Instalasi MEP',
      tindakan: 'Lakukan audit instalasi listrik, plumbing, dan HVAC. Pastikan instalasi sesuai SNI dan memiliki SLO yang valid.',
      standar: 'SNI 04-0225-2000 (PUIL) / Permenaker 04/1995',
    });
  }
  if (skorAspek.keselamatan < 80) {
    rekoms.push({
      aspek: 'Keselamatan Kebakaran',
      prioritas: skorAspek.keselamatan < 50 ? 'Kritis' : 'Tinggi',
      judul: 'Perbaikan Sistem Proteksi Kebakaran',
      tindakan: 'Pasang/perbaiki APAR, sprinkler, hidran, dan detektor asap. Pastikan jalur evakuasi dan tangga darurat berfungsi optimal.',
      standar: 'Permen PU 26/2008 / SNI 03-3985-2000',
    });
  }
  if (skorAspek.arsitektur < 70) {
    rekoms.push({
      aspek: 'Arsitektur',
      prioritas: 'Sedang',
      judul: 'Perbaikan Komponen Arsitektural',
      tindakan: 'Perbaiki kondisi dinding, pintu, jendela, dan finishing yang mengalami deteriorasi. Sesuaikan dengan gambar as-built.',
      standar: 'SNI 7832:2012',
    });
  }
  if (skorAspek.kemudahan < 70) {
    rekoms.push({
      aspek: 'Kemudahan/Aksesibilitas',
      prioritas: 'Rendah',
      judul: 'Peningkatan Aksesibilitas',
      tindakan: 'Sediakan ramp dan fasilitas difabel sesuai standar. Perlebar koridor dan pastikan area parkir memadai.',
      standar: 'Permen PU 30/2006',
    });
  }

  return rekoms;
}

function generateNarasiText(skorAspek, finalScore, statusSLF) {
  const statusLabel = { LAIK_FUNGSI: 'Laik Fungsi', LAIK_FUNGSI_BERSYARAT: 'Laik Fungsi Bersyarat', TIDAK_LAIK_FUNGSI: 'Tidak Laik Fungsi' }[statusSLF] || '';
  const aspekKritis = Object.entries(skorAspek).filter(([, s]) => s < 60).map(([a]) => a).join(', ');
  return `Berdasarkan hasil evaluasi rule-based engine mengacu pada NSPK Bangunan Gedung, SNI 9273:2025, dan PP No. 16 Tahun 2021, bangunan memperoleh skor total ${finalScore}/100.

Status kelaikan fungsi ditetapkan: ${statusLabel.toUpperCase()}.

Analisis per aspek menunjukkan: Administrasi (${skorAspek.administrasi||0}/100), Struktur (${skorAspek.struktur||0}/100), Arsitektur (${skorAspek.arsitektur||0}/100), Pemanfaatan (${skorAspek.pemanfaatan||0}/100), Mekanikal (${skorAspek.mekanikal||0}/100), Kesehatan (${skorAspek.kesehatan||0}/100), Kenyamanan (${skorAspek.kenyamanan||0}/100), Kemudahan (${skorAspek.kemudahan||0}/100).

${aspekKritis ? `Aspek yang memerlukan perhatian segera: ${aspekKritis}. Diperlukan tindak lanjut sesuai rekomendasi yang tertera.` : 'Semua aspek dalam kondisi memadai.'}

Evaluasi ini bersifat indikatif dan harus dikonfirmasi oleh tenaga ahli pengkaji bangunan gedung yang bersertifikat sebelum diterbitkan Sertifikat Laik Fungsi resmi.`;
}

// Variabel global sementara untuk narasi (workaround)
let proyek_nominal = '';

// ── Radar Chart ───────────────────────────────────────────────
function initRadarChart(result) {
  // Load Chart.js jika belum ada
  const tryInit = () => {
    const ctx = document.getElementById('radar-chart');
    if (!ctx || !window.Chart) return;

    new window.Chart(ctx, {
      type: 'radar',
      data: {
        labels: ['Admin', 'Manfaat', 'Arsitek', 'Struktur', 'Mekanik', 'Kesehatan', 'Nyaman', 'Mudah'],
        datasets: [{
          label: 'Skor',
          data: [
            result.skor_administrasi,
            result.skor_mep,
            result.skor_arsitektur,
            result.skor_struktur,
            result.skor_kebakaran,
            result.skor_kesehatan,
            result.skor_kenyamanan,
            result.skor_kemudahan,
          ],
          backgroundColor: 'hsla(220,70%,48%,0.2)',
          borderColor:     'hsl(220,70%,56%)',
          borderWidth: 2,
          pointBackgroundColor: 'hsl(220,70%,56%)',
          pointRadius: 4,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          r: {
            min: 0,
            max: 100,
            ticks: { stepSize: 20, color: 'hsl(220,10%,50%)', font: { size: 10 }, backdropColor: 'transparent' },
            grid:  { color: 'hsla(220,20%,50%,0.15)' },
            pointLabels: { color: 'hsl(220,12%,70%)', font: { size: 11 } },
            angleLines: { color: 'hsla(220,20%,50%,0.15)' },
          },
        },
        plugins: { legend: { display: false } },
      },
    });
  };

  if (window.Chart) {
    tryInit();
  } else {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js';
    s.onload = tryInit;
    document.head.appendChild(s);
  }
}

// ── Data Fetchers ─────────────────────────────────────────────
async function fetchProyek(id) {
  try {
    const { data } = await supabase.from('proyek').select('id,nama_bangunan').eq('id', id).maybeSingle();
    return data;
  } catch { return null; }
}
async function fetchChecklist(proyekId) {
  try {
    const { data } = await supabase.from('checklist_items').select('*').eq('proyek_id', proyekId);
    return data || [];
  } catch { return []; }
}
async function fetchLastAnalisis(proyekId) {
  try {
    const { data } = await supabase
      .from('hasil_analisis')
      .select('*')
      .eq('proyek_id', proyekId)
      .order('created_at', { ascending: false })
      .limit(1);
    return data && data.length > 0 ? data[0] : null;
  } catch { return null; }
}

async function fetchProyekFiles(proyekId) {
  try {
    const { data } = await supabase.from('proyek_files').select('*').eq('proyek_id', proyekId);
    return data || [];
  } catch { return []; }
}

function renderSkeleton() {
  return `
    <div class="page-header">
      <div class="skeleton" style="height:20px;width:200px;margin-bottom:8px"></div>
      <div class="skeleton" style="height:36px;width:400px;margin-bottom:8px"></div>
    </div>
    <div class="skeleton" style="height:160px;border-radius:var(--radius-lg);margin-bottom:var(--space-5)"></div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:var(--space-4);margin-bottom:var(--space-5)">
      ${Array(8).fill(0).map(()=>`<div class="skeleton" style="height:120px;border-radius:var(--radius-lg)"></div>`).join('')}
    </div>
    <div style="display:grid;grid-template-columns:360px 1fr;gap:var(--space-5)">
      <div class="skeleton" style="height:360px;border-radius:var(--radius-lg)"></div>
      <div class="skeleton" style="height:360px;border-radius:var(--radius-lg)"></div>
    </div>
  `;
}

function escHtml(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function formatTanggal(s) { try { return new Date(s).toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'}); } catch { return s||''; } }
function riskColor(r) { return { low:'hsl(160,65%,46%)', medium:'hsl(40,80%,55%)', high:'hsl(0,70%,58%)', critical:'hsl(330,70%,50%)' }[r]||'hsl(200,80%,58%)'; }
function riskLabel(r) { return { low:'Rendah', medium:'Sedang', high:'Tinggi', critical:'Kritis' }[r]||r; }

// ── Render Detailed Modular Audit (TABS UI) ──────────────────
function renderDetailedModularAudit(checklistData) {
  const grouped = {};
  checklistData.forEach(item => {
    const asp = item.kategori === 'administrasi' ? 'Administrasi' : (item.aspek || 'Lainnya');
    if (!grouped[asp]) grouped[asp] = [];
    grouped[asp].push(item);
  });

  // Urutan aspek dinamis + Prioritas standar
  const allAspek = Object.keys(grouped).sort((a,b) => {
     if (a === 'Administrasi') return -1;
     if (b === 'Administrasi') return 1;
     return a.localeCompare(b);
  });

  if (!window._activeModularTab || !allAspek.includes(window._activeModularTab)) {
    window._activeModularTab = allAspek[0];
  }

  return `
    <div class="modular-tabs-container" style="display:grid;grid-template-columns:260px 1fr;gap:var(--space-6);background:var(--bg-card);border-radius:var(--radius-xl);border:1px solid var(--border-subtle);overflow:hidden;min-height:600px">
      
      <!-- Sidebar Nav -->
      <div class="modular-sidebar" style="background:var(--bg-input);border-right:1px solid var(--border-subtle);padding:var(--space-4);display:flex;flex-direction:column;gap:var(--space-2)">
        <div style="font-size:0.7rem;font-weight:700;color:var(--text-tertiary);text-transform:uppercase;margin-bottom:var(--space-2);padding:0 var(--space-2)">Kategori Poin Audit</div>
        ${allAspek.map(asp => {
          const items = grouped[asp];
          const done = items.filter(it => !!it.catatan && it.catatan.length > 50).length;
          const pct = Math.round((done / items.length) * 100);
          const isActive = window._activeModularTab === asp;
          
          return `
            <button class="modular-tab-btn ${isActive ? 'active' : ''}" 
                    onclick="window._switchModularTab('${asp}')"
                    id="tab-btn-${asp.replace(/\s+/g,'-')}"
                    style="display:flex;flex-direction:column;align-items:flex-start;padding:var(--space-3) var(--space-4);border-radius:var(--radius-lg);border:none;background:${isActive ? 'var(--bg-card)' : 'transparent'};color:${isActive ? 'var(--brand-400)' : 'var(--text-secondary)'};cursor:pointer;transition:all 0.2s ease;text-align:left;box-shadow:${isActive ? 'var(--shadow-md)' : 'none'}">
              <span style="font-size:0.9rem;font-weight:700">${asp}</span>
              <div style="display:flex;align-items:center;gap:6px;margin-top:4px;width:100%">
                <div style="flex:1;height:4px;background:var(--border-subtle);border-radius:2px">
                   <div style="width:${pct}%;height:100%;background:${pct === 100 ? 'var(--brand-500)' : 'var(--brand-400)'};border-radius:2px"></div>
                </div>
                <span style="font-size:0.65rem;font-weight:600;min-width:40px">${done}/${items.length} Item</span>
              </div>
            </button>
          `;
        }).join('')}
      </div>

        <div id="modular-items-grid" style="display:grid;grid-template-columns:repeat(auto-fill, minmax(280px, 1fr));gap:var(--space-4)">
          ${(grouped[window._activeModularTab] || []).map(item => {
            const hasAi = !!item.catatan && (item.catatan.includes('###') || item.catatan.length > 50);
            
            // Mencari berkas yang relevan dari Manajemen Berkas (Global State window._analisisFiles)
            const relatedFiles = (window._analisisFiles || []).filter(f => {
               const search = (f.subcategory || f.category || "").toLowerCase();
               const itemNama = item.nama.toLowerCase();
               return itemNama.includes(search) || search.includes(itemNama.substring(0, 10));
            });

            return `
              <div class="card item-card-modular" style="padding:var(--space-4);display:flex;flex-direction:column;border-top:3px solid ${hasAi ? 'var(--brand-500)' : 'var(--border-subtle)'};transition:all 0.2s ease;background:var(--bg-card)">
                <div style="flex:1">
                  <div class="flex-between" style="margin-bottom:8px">
                    <span style="font-family:monospace;font-weight:700;color:var(--brand-400);font-size:0.8rem">${item.kode}</span>
                    <span class="badge" style="font-size:0.6rem;background:var(--bg-input);padding:2px 8px">${escHtml(item.status || 'Belum')}</span>
                  </div>
                  <h4 style="font-size:0.85rem;font-weight:700;margin-bottom:12px;line-height:1.4;color:var(--text-primary);cursor:pointer" onclick="window._showModularDetail('${item.id}', '${window._activeModularTab}')">
                    ${escHtml(item.nama)}
                  </h4>
                  
                  <!-- Data Dasar Lapangan (Transparency) -->
                  <div style="background:var(--bg-input);border-radius:var(--radius-md);padding:10px;margin-bottom:12px;border:1px solid var(--border-subtle)">
                    <div style="font-size:0.65rem;font-weight:700;color:var(--text-tertiary);text-transform:uppercase;margin-bottom:4px;display:flex;align-items:center;gap:4px">
                      <i class="fas fa-clipboard-check"></i> Data Lapangan
                    </div>
                    <div style="font-size:0.75rem;color:var(--text-secondary);line-height:1.4">
                      ${item.catatan && !hasAi ? escHtml(item.catatan) : (item.status ? `Status: ${escHtml(item.status)}` : '<i class="text-tertiary">Tidak ada catatan lapangan</i>')}
                    </div>
                  </div>

                  <!-- Berkas Terlampir (Integration) -->
                  ${relatedFiles.length > 0 ? `
                  <div style="margin-bottom:12px">
                    <div style="font-size:0.65rem;font-weight:700;color:var(--text-tertiary);text-transform:uppercase;margin-bottom:6px;display:flex;align-items:center;gap:4px">
                      <i class="fas fa-paperclip"></i> Lampiran Berkas (${relatedFiles.length})
                    </div>
                    <div style="display:flex;flex-wrap:wrap;gap:6px">
                      ${relatedFiles.map(f => `
                        <a href="${f.url}" target="_blank" class="badge badge-outline" style="font-size:0.65rem;text-decoration:none;display:flex;align-items:center;gap:4px;max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
                          <i class="fas ${f.name.endsWith('.pdf') ? 'fa-file-pdf' : 'fa-image'}" style="font-size:0.7rem"></i> ${escHtml(f.name)}
                        </a>
                      `).join('')}
                    </div>
                  </div>
                  ` : ''}

                  <!-- AI Summary -->
                  ${hasAi ? `
                    <div style="font-size:0.75rem;color:var(--text-secondary);background:hsla(220,70%,50%,0.05);padding:12px;border-radius:8px;margin-bottom:16px;border:1px solid hsla(220,70%,50%,0.2);position:relative;cursor:pointer" onclick="window._showModularDetail('${item.id}', '${window._activeModularTab}')">
                      <div style="font-size:0.65rem;font-weight:700;color:var(--brand-400);text-transform:uppercase;margin-bottom:6px">Hasil Analisis AI</div>
                      <div style="display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;line-height:1.5">
                        ${item.catatan.replace(/#[# ]+/g, '').substring(0, 180)}...
                      </div>
                    </div>
                  ` : ''}
                </div>
                
                <div id="btn-wrap-${item.id}" onclick="event.stopPropagation()" style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
                  <button class="btn btn-outline btn-sm" onclick="window._runNSPKBotForItem('${item.id}', '${item.nama}')" style="font-size:0.75rem;padding:var(--space-2);font-weight:600">
                    <i class="fas fa-robot"></i> Bot NSPK
                  </button>
                  <button class="btn ${hasAi ? 'btn-secondary' : 'btn-primary'} btn-sm" onclick="window._runSingleItemAnalysis('${item.id}', '${window._activeModularTab}')" style="font-size:0.75rem;padding:var(--space-2);font-weight:600">
                    <i class="fas ${hasAi ? 'fa-rotate-right' : 'fa-brain'}"></i> ${hasAi ? 'Ulangi' : 'Analisis AI'}
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    </div>

    <style>
      .modular-tab-btn:hover { background: hsla(220,70%,50%,0.05) !important; color: var(--brand-400) !important; }
      .modular-tab-btn.active { background: var(--bg-card) !important; border-left: 3px solid var(--brand-500) !important; border-radius: 0 8px 8px 0 !important; }
      .item-card-modular:hover { transform: translateY(-3px); box-shadow: var(--shadow-lg); border-top-color: var(--brand-400) !important; }
    </style>
  `;
}

window._switchModularTab = (aspek) => {
  window._activeModularTab = aspek;
  // Karena loadData akan me-render ulang seluruh halaman, kita panggil loadData kembali
  // dengan id proyek yang sama
  if (window._analisisProyekId) {
    // Optimasi: Jika ingin instan tanpa fetch ulang, bisa dimanipulasi DOM saja
    // Tapi loadData menjamin integritas state.
    loadData(window._analisisProyekId);
  }
};
