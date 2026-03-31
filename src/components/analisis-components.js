/**
 * ANALYSIS PAGE COMPONENTS
 * Modular UI templates for the Analysis Engine.
 */
import { marked } from 'marked';
import { escHtml, formatTanggal, riskColor, riskLabel } from '../lib/utils.js';

/**
 * Skeleton Loader
 */
export function renderSkeleton() {
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

/**
 * Empty/NoData Panel
 */
export function renderNoDataPanel(proyekId) {
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

/**
 * Initial Ready Panel
 */
export function renderReadyPanel(proyekId) {
  const aspects = [
    { label: 'Administrasi', desc: 'Verifikasi Lintas Instansi' },
    { label: 'Pemanfaatan', desc: 'Kesesuaian Item-01 & 02' },
    { label: 'Arsitektur',  desc: 'Desain & Lingkungan (Item-03 & 04)' },
    { label: 'Struktur',   desc: 'Keselamatan Bangunan (Item-05A)' },
    { label: 'Mekanikal',  desc: 'Kebakaran, Petir, Listrik (Item-05)' },
    { label: 'Kesehatan',   desc: 'Utilitas & Material (Item-06)' },
    { label: 'Kenyamanan',  desc: 'Ruang, Termal, Visual (Item-07)' },
    { label: 'Kemudahan',   desc: 'Akses & Prasarana (Item-08)' }
  ];

  return `
    <div class="ai-panel" style="text-align:center;padding:var(--space-10)">
      <div class="empty-state">
        <div class="empty-icon"><i class="fas fa-microchip"></i></div>
        <h3 style="font-size:1.25rem;font-weight:700;margin-bottom:var(--space-2)">Mulai Analisis Modular (Hybrid AI v6)</h3>
        <p style="color:var(--text-secondary);max-width:500px;margin:0 auto var(--space-5)">
          Pilihlah modul parameter satu persatu untuk dianalisis secara mendalam oleh AI. Algoritma Hybrid AI akan melakukan Fuzzy Logic & Bayesian Calculation berdasarkan data lapangan.
        </p>
        
        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(180px, 1fr));gap:var(--space-3);max-width:1000px;margin:0 auto var(--space-5)">
          ${aspects.map(a => `
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
    </div>
  `;
}

/**
 * Result Panel Summary
 */
export function renderResultPanel(result, proyek, checklistData) {
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

  const rekomendasi = result.rekomendasi ? (typeof result.rekomendasi === 'string' ? JSON.parse(result.rekomendasi) : result.rekomendasi) : [];

  let displayScore = result?.skor_total || 0;
  if (displayScore === 0) {
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

    <!-- Modular Audit Grid -->
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
        ${window._renderDetailedModularAudit(checklistData)}
      </div>
    </div>

    <!-- Score Grid (Summary) -->
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--space-4)">
      <div style="font-weight:700;color:var(--text-tertiary);text-transform:uppercase;font-size:0.75rem;letter-spacing:0.1em">Ringkasan Skor Per Aspek</div>
      <button class="btn btn-primary btn-sm" onclick="window.navigate('laporan', {id: '${proyek.id}'})" style="padding: 6px 16px; border-radius: 99px">
        <i class="fas fa-file-invoice"></i> Buka Laporan SLF Lengkap &rarr;
      </button>
    </div>
    <div class="aspek-score-grid" style="margin-bottom:var(--space-8)">
      ${aspekDefs.map(a => {
        const skor = result?.[a.key] || 0;
        const warna = skor >= 80 ? 'hsl(160,65%,46%)' : skor >= 60 ? 'hsl(40,80%,55%)' : 'hsl(0,74%,52%)';
        
        const itemsInAspek = checklistData.filter(item => {
           const itemAsp = item.kategori === 'administrasi' ? 'Administrasi' : (item.aspek || 'Lainnya');
           return itemAsp === a.label;
        });
        const analyzedCount = itemsInAspek.filter(it => !!it.catatan && (it.catatan.includes('###') || it.catatan.length > 50)).length;
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
            
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; background: var(--bg-100); padding: 8px; border-radius: 8px">
              <span class="badge ${isComplete ? 'badge-success' : 'badge-warning'}" style="font-size:0.6rem">
                <i class="fas ${isComplete ? 'fa-check-double' : 'fa-hourglass-half'}"></i> ${isComplete ? 'Siap Lapor' : 'Progress'}
              </span>
              ${isComplete ? `<button class="btn btn-ghost btn-xs" onclick="window._showAspectPreview('${a.label}')" style="font-size:0.65rem">Preview</button>` : ''}
            </div>
            
            <button class="btn ${isComplete ? 'btn-primary' : 'btn-outline'} btn-sm" style="width:100%" onclick="window._runAspect('${a.label}')">
              <i class="fas ${isComplete ? 'fa-file-invoice' : 'fa-list-check'}"></i> ${isComplete ? 'Sintesis Laporan' : 'Audit Data'}
            </button>
          </div>
        `;
      }).join('')}
    </div>

    <!-- Recommendations & Charts Grid -->
    <div style="display:grid;grid-template-columns:360px 1fr;gap:var(--space-5)">
      <div class="card">
        <div class="card-title" style="margin-bottom:var(--space-4)"><i class="fas fa-chart-radar"></i> Radar Skor</div>
        <div class="radar-wrap"><canvas id="radar-chart"></canvas></div>
      </div>

      <div class="card">
        <div class="card-header" style="margin-bottom:var(--space-4)">
          <div class="card-title">Rekomendasi Teknis</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:var(--space-3)">
          ${rekomendasi.length === 0 ? `<div class="ai-finding success">Tidak ada rekomendasi kritis.</div>` : rekomendasi.map((r, i) => `
            <div class="rekom-card">
              <div class="rekom-priority" style="background:${riskColor(r.prioritas)}"></div>
              <div style="flex:1">
                <div class="text-sm font-semibold">${i+1}. ${escHtml(r.judul)}</div>
                <p class="text-xs text-secondary">${escHtml(r.tindakan)}</p>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>

    ${result.narasi_teknis ? `
      <div class="card" style="margin-top:var(--space-5)">
        <div class="card-title"><i class="fas fa-file-alt"></i> Narasi Teknis</div>
        <div class="markdown-content">${marked.parse(result.narasi_teknis)}</div>
      </div>
    ` : ''}
  `;
}

/**
 * Detailed Modular Audit (TABS UI)
 */
export function renderDetailedModularAudit(checklistData, activeTab, relatedFiles) {
  const grouped = {};
  checklistData.forEach(item => {
    const asp = item.kategori === 'administrasi' ? 'Administrasi' : (item.aspek || 'Lainnya');
    if (!grouped[asp]) grouped[asp] = [];
    grouped[asp].push(item);
  });

  const allAspek = Object.keys(grouped).sort((a,b) => {
     if (a === 'Administrasi') return -1;
     if (b === 'Administrasi') return 1;
     return a.localeCompare(b);
  });

  const currentTab = activeTab || allAspek[0];

  return `
    <div class="modular-tabs-container" style="display:grid;grid-template-columns:260px 1fr;gap:var(--space-6);background:var(--bg-card);border-radius:var(--radius-xl);border:1px solid var(--border-subtle);overflow:hidden;min-height:600px">
      <div class="modular-sidebar" style="background:var(--bg-input);border-right:1px solid var(--border-subtle);padding:var(--space-4);display:flex;flex-direction:column;gap:var(--space-2)">
        <div style="font-size:0.7rem;font-weight:700;color:var(--text-tertiary);text-transform:uppercase;margin-bottom:var(--space-2);padding:0 var(--space-2)">Kategori Poin Audit</div>
        ${allAspek.map(asp => {
          const items = grouped[asp];
          const done = items.filter(it => !!it.catatan && (it.catatan.includes('###') || it.catatan.length > 50)).length;
          const pct = Math.round((done / items.length) * 100);
          const isActive = currentTab === asp;
          
          return `
            <button class="modular-tab-btn ${isActive ? 'active' : ''}" 
                    onclick="window._switchModularTab('${asp}')"
                    style="display:flex;flex-direction:column;align-items:flex-start;padding:var(--space-3) var(--space-4);border-radius:var(--radius-lg);border:none;background:${isActive ? 'var(--bg-card)' : 'transparent'};color:${isActive ? 'var(--brand-400)' : 'var(--text-secondary)'};cursor:pointer;transition:all 0.2s ease;text-align:left;box-shadow:${isActive ? 'var(--shadow-md)' : 'none'}">
              <span style="font-size:0.9rem;font-weight:700">${asp}</span>
              <div style="display:flex;align-items:center;gap:6px;margin-top:4px;width:100%">
                <div style="flex:1;height:4px;background:var(--border-subtle);border-radius:2px">
                   <div style="width:${pct}%;height:100%;background:${pct === 100 ? 'var(--brand-500)' : 'var(--brand-400)'};border-radius:2px"></div>
                </div>
                <span style="font-size:0.65rem;font-weight:600;min-width:40px">${done}/${items.length}</span>
              </div>
            </button>
          `;
        }).join('')}
      </div>

      <div id="modular-items-grid" style="display:grid;grid-template-columns:repeat(auto-fill, minmax(280px, 1fr));gap:var(--space-4);padding:var(--space-6);overflow-y:auto">
        ${(grouped[currentTab] || []).map(item => {
          const hasAi = !!item.catatan && (item.catatan.includes('###') || item.catatan.length > 50);
          const itemFiles = (relatedFiles || []).filter(f => {
             const search = (f.subcategory || f.category || "").toLowerCase();
             const itemNama = item.nama.toLowerCase();
             return itemNama.includes(search) || search.includes(itemNama.substring(0, 10));
          });

          return `
            <div class="card item-card-modular" style="padding:var(--space-4);display:flex;flex-direction:column;border-top:3px solid ${hasAi ? 'var(--brand-500)' : 'var(--border-subtle)'}">
              <div style="flex:1">
                <div class="flex-between" style="margin-bottom:8px">
                  <span style="font-family:monospace;font-weight:700;color:var(--brand-400);font-size:0.8rem">${item.kode}</span>
                  <span class="badge" style="font-size:0.6rem;background:var(--bg-input);padding:2px 8px">${escHtml(item.status || 'Belum')}</span>
                </div>
                <h4 style="font-size:0.85rem;font-weight:700;margin-bottom:12px;cursor:pointer" onclick="window._showModularDetail('${item.id}', '${currentTab}')">
                  ${escHtml(item.nama)}
                </h4>
                
                <div style="background:var(--bg-input);border-radius:var(--radius-md);padding:10px;margin-bottom:12px;border:1px solid var(--border-subtle)">
                  <div style="font-size:0.65rem;font-weight:700;color:var(--text-tertiary);text-transform:uppercase;margin-bottom:4px">Data Lapangan</div>
                  <div style="font-size:0.75rem;color:var(--text-secondary)">
                    ${item.catatan && !hasAi ? escHtml(item.catatan) : (item.status ? `Status: ${escHtml(item.status)}` : '<i>Tidak ada catatan</i>')}
                  </div>
                </div>

                ${itemFiles.length > 0 ? `
                  <div style="margin-bottom:12px;display:flex;flex-wrap:wrap;gap:4px">
                    ${itemFiles.map(f => `<span class="badge badge-outline" style="font-size:0.6rem"><i class="fas fa-paperclip"></i> ${escHtml(f.name.substring(0,10))}...</span>`).join('')}
                  </div>
                ` : ''}

                ${hasAi ? `
                  <div style="font-size:0.7rem;color:var(--text-secondary);background:hsla(220,70%,50%,0.05);padding:8px;border-radius:6px;border:1px solid hsla(220,70%,50%,0.1)">
                    ${item.catatan.substring(0, 100)}...
                  </div>
                ` : ''}
              </div>
              
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px">
                <button class="btn btn-outline btn-xs" onclick="window._runNSPKBotForItem('${item.id}', '${item.nama}')">Bot NSPK</button>
                <button class="btn ${hasAi ? 'btn-secondary' : 'btn-primary'} btn-xs" onclick="window._runSingleItemAnalysis('${item.id}', '${currentTab}')">${hasAi ? 'Ulangi AI' : 'Analisis AI'}</button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}
