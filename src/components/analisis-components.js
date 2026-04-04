/**
 * ANALYSIS PAGE COMPONENTS
 * Modular UI templates for the Analysis Engine.
 * PRESIDENTIAL CLASS (QUARTZ PREMIUM)
 */
import { marked } from 'marked';
import { escHtml, formatTanggal, riskColor, riskLabel } from '../lib/utils.js';

/**
 * Skeleton Loader
 */
export function renderSkeleton() {
  return `
    <div id="analisis-skeleton" style="animation: page-fade-in 0.8s ease-out">
      <div class="card-quartz" style="height:180px; margin-bottom:var(--space-8)">
        <div class="skeleton" style="height:32px; width:40%; margin-bottom:16px"></div>
        <div class="skeleton" style="height:16px; width:60%"></div>
      </div>
      <div class="grid-4-col" style="gap:20px; margin-bottom:var(--space-8)">
        ${Array(8).fill(0).map(() => `<div class="card-quartz" style="height:140px"></div>`).join('')}
      </div>
      <div class="grid-main-side" style="gap:32px">
        <div class="card-quartz" style="height:400px"></div>
        <div class="card-quartz" style="height:400px"></div>
      </div>
    </div>
  `;
}

/**
 * Empty/NoData Panel
 */
export function renderNoDataPanel(proyekId) {
  return `
    <div class="card-quartz" style="text-align:center; padding:100px 40px; border-color: hsla(0, 85%, 60%, 0.1)">
      <div style="width:100px; height:100px; background:var(--gradient-dark); border:1px solid var(--glass-border); border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 32px; font-size:2.5rem; color:var(--text-tertiary)">
        <i class="fas fa-database-slash"></i>
      </div>
      <h3 style="font-family:'Outfit', sans-serif; font-weight:800; font-size:1.4rem; color:white; margin-bottom:12px">Checklist Manifest Missing</h3>
      <p style="color:var(--text-tertiary); max-width:460px; margin:0 auto 32px; line-height:1.6">
        The AI Strategic Engine requires a completed technical manifest to generate risk analytics. Please finalize the building inspection checklists first.
      </p>
      <button class="btn-presidential gold" onclick="window.navigate('checklist',{id:'${proyekId}'})" style="height:48px; padding:0 32px; border-radius:14px">
        <i class="fas fa-clipboard-check" style="margin-right:10px"></i> INITIALIZE AUDIT CHECKLIST
      </button>
    </div>
  `;
}

/**
 * Initial Ready Panel (Strategic Engine Hub)
 */
export function renderReadyPanel(proyekId) {
  const aspects = [
    { label: 'Administrasi', desc: 'Legal Compliance Audit', icon: 'fa-file-shield' },
    { label: 'Pemanfaatan', desc: 'Zoning & Usage Intel',  icon: 'fa-map-location-dot' },
    { label: 'Arsitektur',  desc: 'Structural Aesthetics',  icon: 'fa-drafting-compass' },
    { label: 'Struktur',   desc: 'Integrity & Stability',   icon: 'fa-building-shield' },
    { label: 'Mekanikal',  desc: 'MEP Systems Health',    icon: 'fa-bolt-lightning' },
    { label: 'Kesehatan',   desc: 'Environmental Safety',  icon: 'fa-mask-ventilator' },
    { label: 'Kenyamanan',  desc: 'Occupant Well-being',   icon: 'fa-couch' },
    { label: 'Kemudahan',   desc: 'Accessibility Access',  icon: 'fa-universal-access' }
  ];

  return `
    <div style="animation: page-fade-in 0.8s ease-out">
      <div class="card-quartz" style="text-align:center; padding: 60px 40px; margin-bottom: 40px; background:var(--gradient-dark); border-color: hsla(220, 95%, 52%, 0.2)">
        <div style="width:80px; height:80px; background:var(--gradient-brand); border-radius:24px; display:flex; align-items:center; justify-content:center; margin:0 auto 24px; font-size:2rem; color:white; box-shadow: var(--shadow-sapphire); border:1px solid hsla(220, 95%, 52%, 0.3)">
          <i class="fas fa-microchip-ai"></i>
        </div>
        <h3 style="font-family:'Outfit', sans-serif; font-weight:800; font-size:1.8rem; color:white; margin-bottom:12px">Strategic AI Engine v7.4</h3>
        <p style="color:var(--brand-300); max-width:600px; margin:0 auto 40px; font-weight:600; font-size:0.9rem">
          Initialize target-specific neural audit modules. Engine will utilize Fuzzy Logic & Bayesian inferences to determine building safety status.
        </p>
        
        <div class="grid-4-col" style="gap:16px; max-width:1100px; margin:0 auto">
          ${aspects.map(a => `
            <button class="card-quartz clickable w-full" style="display:flex; flex-direction:column; align-items:center; gap:12px; padding:24px; background:hsla(220, 20%, 100%, 0.03); border-color:hsla(220, 20%, 100%, 0.05)" onclick="window._runAspect('${a.label}')">
              <i class="fas ${a.icon}" style="font-size:1.8rem; color:var(--brand-400); opacity:0.8"></i>
              <div style="font-family:'Outfit', sans-serif; font-weight:800; font-size:0.85rem; color:white; letter-spacing:0.5px">${a.label.toUpperCase()}</div>
              <div style="font-family:var(--font-mono); font-size:8px; color:var(--text-tertiary); text-transform:uppercase; letter-spacing:1.5px">${a.desc}</div>
            </button>
          `).join('')}
        </div>
        
        <div style="margin-top: 40px; font-family:var(--font-mono); font-size:9px; font-weight:800; color:var(--success-400); letter-spacing:2px">
           <i class="fas fa-shield-halved" style="margin-right:8px"></i> NEURAL NETWORK READY FOR PORTFOLIO RECON
        </div>
      </div>
    </div>
  `;
}

/**
 * Result Panel (Executive Summary)
 */
export function renderResultPanel(result, proyek, checklistData) {
  const aspeksTata = [
    { key: 'skor_administrasi', label: 'ADMINISTRASI', icon: 'fa-file-shield',      color: 'var(--brand-400)' },
    { key: 'skor_mep',          label: 'PEMANFAATAN',  icon: 'fa-map-location-dot', color: 'var(--success-400)' },
    { key: 'skor_arsitektur',   label: 'ARSITEKTUR',   icon: 'fa-drafting-compass', color: 'hsla(258, 70%, 65%, 1)' },
  ];

  const aspeksKeandalan = [
    { key: 'skor_struktur',     label: 'STRUKTUR',     icon: 'fa-building-shield',  color: 'var(--danger-400)' },
    { key: 'skor_kebakaran',    label: 'MEKANIKAL',    icon: 'fa-bolt-lightning',   color: 'var(--gold-400)' },
    { key: 'skor_kesehatan',    label: 'KESEHATAN',    icon: 'fa-heart-pulse',      color: 'var(--success-400)' },
    { key: 'skor_kenyamanan',   label: 'KENYAMANAN',   icon: 'fa-couch',            color: 'var(--gold-400)' },
    { key: 'skor_kemudahan',    label: 'KEMUDAHAN',    icon: 'fa-universal-access', color: 'var(--brand-400)' },
  ];

  const statusInfo = {
    LAIK_FUNGSI:           { label: 'LAIK FUNGSI',          cls: 'badge-laik',       icon: 'fa-shield-check',   color: 'var(--success-400)' },
    LAIK_FUNGSI_BERSYARAT: { label: 'LAIK BERSYARAT',       cls: 'badge-bersyarat',  icon: 'fa-triangle-exclamation', color: 'var(--gold-400)' },
    TIDAK_LAIK_FUNGSI:     { label: 'TIDAK LAIK',           cls: 'badge-tidak-laik', icon: 'fa-circle-xmark',   color: 'var(--danger-400)' },
    DALAM_PENGKAJIAN:      { label: 'PENGKAJIAN',           cls: 'badge-proses',     icon: 'fa-hourglass-half', color: 'var(--brand-400)' },
  };
  const si = statusInfo[result.status_slf] || statusInfo['DALAM_PENGKAJIAN'];

  const rekomendasi = result.rekomendasi ? (typeof result.rekomendasi === 'string' ? JSON.parse(result.rekomendasi) : result.rekomendasi) : [];

  let displayScore = result?.skor_total || 0;

  return `
    <div style="animation: page-fade-in 0.8s ease-out">
      
      <!-- Strategic Status Banner -->
      <div class="card-quartz" style="margin-bottom:var(--space-8); padding:var(--space-8); background:var(--gradient-dark); border-color: hsla(220, 95%, 52%, 0.2); overflow:hidden">
         <div class="flex-between flex-stack" style="gap:40px; position:relative; z-index:2; align-items:center">
          <div style="text-align:center; flex-shrink:0;">
              <div style="width:120px; height:120px; border-radius:50%; background:hsla(220, 20%, 100%, 0.03); border:2px solid ${si.color}44; display:flex; align-items:center; justify-content:center; position:relative; box-shadow: 0 0 30px ${si.color}22; margin: 0 auto">
                <i class="fas ${si.icon}" style="font-size:3rem; color:${si.color}"></i>
                <!-- Status Pulse Circle -->
                <div class="animate-ping" style="position:absolute; inset:-4px; border:2px solid ${si.color}; border-radius:50%; opacity:0.1"></div>
              </div>
              <div style="margin-top:16px; font-family:var(--font-mono); font-size:11px; font-weight:800; color:${si.color}; letter-spacing:1.5px">${si.label}</div>
          </div>

          <div style="flex:1; text-align: left">
              <div class="flex-stack" style="align-items:baseline; gap:8px; margin-bottom:4px">
                <span class="responsive-score" style="font-family:'Outfit', sans-serif; font-weight:800; font-size:clamp(3rem, 15vw, 4.5rem); color:white; letter-spacing:-0.04em; line-height:1">${displayScore}</span>
                <span style="font-family:var(--font-mono); font-size:1.5rem; color:var(--text-tertiary); font-weight:700">/100</span>
                
                <div class="mobile-risk-box" style="margin-left:40px">
                    <div style="font-family:var(--font-mono); font-size:9px; font-weight:800; color:var(--text-tertiary); text-transform:uppercase; letter-spacing:1.5px; margin-bottom:4px">INTELLIGENCE LEVEL</div>
                    <div style="font-family:'Outfit', sans-serif; font-weight:800; font-size:1.4rem; color:${riskColor(result?.risk_level)}">${riskLabel(result?.risk_level).toUpperCase()}</div>
                </div>
              </div>
              <div class="flex-stack" style="gap:32px; margin-top:16px">
                <div>
                    <div style="font-family:var(--font-mono); font-size:9px; color:var(--text-tertiary); text-transform:uppercase; letter-spacing:1px; margin-bottom:4px">Audit Cycle</div>
                    <div style="font-weight:700; color:white; font-size:0.85rem">${formatTanggal(result.created_at)}</div>
                </div>
                <div>
                    <div style="font-family:var(--font-mono); font-size:9px; color:var(--text-tertiary); text-transform:uppercase; letter-spacing:1px; margin-bottom:4px">Primary Engine</div>
                    <div style="font-weight:700; color:var(--brand-400); font-size:0.85rem">
                      <i class="fas fa-brain-circuit" style="margin-right:8px"></i> NEURAL ROUTER v7
                    </div>
                </div>
              </div>
          </div>

          <div class="flex-stack gap-3" style="width: auto">
              <button class="btn btn-outline" style="height:48px; padding:0 24px; border-radius:14px; border-color:hsla(220, 20%, 100%, 0.1); color:white" onclick="window.navigate('laporan',{id:'${proyek.id}'})">
                <i class="fas fa-file-invoice" style="margin-right:10px"></i> VIEW REPORT
              </button>
              <button class="btn-presidential gold" style="height:48px; padding:0 24px; border-radius:14px" onclick="window._runFinalConclusion()">
                <i class="fas fa-shield-halved" style="margin-right:10px"></i> SEAL FINAL STATUS
              </button>
          </div>
         </div>
      </div>

      <!-- Modular Audit Intelligence -->
      <div style="margin-bottom: var(--space-8)">
         <div class="flex-between flex-stack" style="margin-bottom:20px; padding:0 12px; gap:16px">
            <div style="text-align: left">
               <h2 style="font-family:'Outfit', sans-serif; font-weight:800; font-size:1.6rem; color:white; margin:0">Neural Audit Modules</h2>
               <p style="font-size:0.8rem; color:var(--text-tertiary); letter-spacing:1px; text-transform:uppercase; margin-top:4px">Component-level analysis across ${checklistData.length} strategic points</p>
            </div>
            <div style="background:hsla(158, 85%, 45%, 0.1); padding:8px 16px; border-radius:12px; border:1px solid hsla(158, 85%, 45%, 0.2); font-family:var(--font-mono); font-size:9px; font-weight:800; color:var(--success-400); letter-spacing:2px; height: fit-content; width: fit-content">
               <i class="fas fa-circle-check" style="margin-right:8px"></i> REASONING ENGINE ONLINE
            </div>
         </div>
         <div style="max-height:800px; overflow-y:auto; padding-right:8px">
            ${window._renderDetailedModularAudit(checklistData)}
         </div>
      </div>

      <!-- Aspect Scoring Matrix -->
      <div style="margin-bottom: var(--space-8)">
         <div style="font-family:var(--font-mono); font-size:10px; font-weight:800; color:var(--text-tertiary); text-transform:uppercase; letter-spacing:2px; margin-bottom:24px; padding:0 12px">STRATEGIC SCORING MATRIX</div>
         
         <!-- Pillar: Tata Bangunan -->
         <h4 style="font-family:'Outfit', sans-serif; font-size:0.9rem; color:var(--brand-300); margin:0 12px 16px; font-weight:800">PILLAR I: ASPEK TATA BANGUNAN</h4>
         <div class="grid-4-col" style="gap:20px; margin-bottom: 32px">
           ${aspeksTata.map(a => renderAspectCard(a, result, checklistData)).join('')}
         </div>

         <!-- Pillar: Keandalan Bangunan -->
         <h4 style="font-family:'Outfit', sans-serif; font-size:0.9rem; color:var(--success-400); margin:0 12px 16px; font-weight:800">PILLAR II: ASPEK KEANDALAN BANGUNAN</h4>
         <div class="grid-4-col" style="gap:20px">
           ${aspeksKeandalan.map(a => renderAspectCard(a, result, checklistData)).join('')}
         </div>
      </div>

      <!-- Radar & Recommendations -->
      <div class="grid-main-side" style="gap: 32px">
         <div class="card-quartz" style="padding: 32px; background:var(--gradient-dark); border-color: hsla(220, 95%, 52%, 0.1)">
            <div style="font-family:'Outfit', sans-serif; font-weight:800; font-size:0.9rem; color:white; text-align:center; letter-spacing:1px; margin-bottom:32px">ASSET INTEGRITY PULSE</div>
            <div style="height:320px; display:flex; align-items:center; justify-content:center">
               <canvas id="radar-chart"></canvas>
            </div>
         </div>

         <div class="card-quartz" style="padding: 32px">
            <div style="font-family:'Outfit', sans-serif; font-weight:800; font-size:0.9rem; color:white; letter-spacing:1px; margin-bottom:24px">MITIGATION RECOMMENDATIONS</div>
            <div style="display:grid; grid-template-columns: 1fr; gap:12px">
               ${rekomendasi.length === 0 ? `
                 <div style="padding:40px; text-align:center; background:hsla(158, 85%, 45%, 0.02); border:1px dashed hsla(158, 85%, 45%, 0.2); border-radius:16px">
                   <i class="fas fa-circle-check" style="color:var(--success-400); font-size:2.5rem; margin-bottom:16px"></i>
                   <div style="color:white; font-weight:700">No critical findings detected. Building asset is within safety thresholds.</div>
                 </div>
               ` : rekomendasi.map((r, i) => `
                 <div style="background:hsla(220, 20%, 100%, 0.02); border:1px solid hsla(220, 20%, 100%, 0.05); border-radius:14px; padding:20px; display:flex; gap:20px; align-items:center">
                    <div style="width:4px; height:40px; border-radius:4px; background:${riskColor(r.prioritas)}; flex-shrink:0"></div>
                    <div style="flex:1">
                       <div style="font-family:'Outfit', sans-serif; font-weight:800; font-size:0.95rem; color:white; margin-bottom:4px">${i+1}. ${escHtml(r.judul).toUpperCase()}</div>
                       <div style="font-size:0.8rem; color:var(--text-tertiary); line-height:1.5">${escHtml(r.tindakan)}</div>
                    </div>
                    <div style="padding:6px 12px; background:${riskColor(r.prioritas)}1a; color:${riskColor(r.prioritas)}; border:1px solid ${riskColor(r.prioritas)}44; border-radius:8px; font-family:var(--font-mono); font-size:9px; font-weight:800">${r.prioritas.toUpperCase()} PRIORITY</div>
                 </div>
               `).join('')}
            </div>
         </div>
      </div>

      ${result.narasi_teknis ? `
        <div class="card-quartz" style="margin-top:var(--space-8); padding:var(--space-8)">
          <div style="font-family:'Outfit', sans-serif; font-weight:800; font-size:1rem; color:white; margin-bottom:24px; display:flex; align-items:center; gap:12px">
            <i class="fas fa-file-signature" style="color:var(--brand-400)"></i> EXECUTIVE SUMMARY NARRATIVE
          </div>
          <div class="markdown-content" style="font-size:0.9rem; line-height:1.8; color:hsla(220, 20%, 100%, 0.8)">
            ${marked.parse(result.narasi_teknis)}
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

/**
 * Detailed Modular Audit (Presidential TABS UI)
 */
export function renderDetailedModularAudit(checklistData, activeTab, relatedFiles) {
  const grouped = {};
  checklistData.forEach(item => {
    const asp = item.kategori === 'administrasi' ? 'ADMINISTRASI' : (item.aspek || 'Lainnya').toUpperCase();
    if (!grouped[asp]) grouped[asp] = [];
    grouped[asp].push(item);
  });

  const allAspek = Object.keys(grouped).sort((a,b) => {
     if (a === 'ADMINISTRASI') return -1;
     if (b === 'ADMINISTRASI') return 1;
     return a.localeCompare(b);
  });

  const currentTab = activeTab || allAspek[0];

  return `
    <div class="card-quartz" style="padding:0; border: 1px solid var(--border-strong); display:flex; flex-direction: column;">
      <div class="grid-side-layout" style="min-height:600px; flex: 1">
      <!-- Sidebar Tabs -->
      <div style="background: hsla(220, 20%, 100%, 0.02); border-right: 1px solid hsla(220, 20%, 100%, 0.05); padding: 24px">
        <div style="font-family:var(--font-mono); font-size:9px; font-weight:800; color:var(--text-tertiary); text-transform:uppercase; letter-spacing:1.5px; margin-bottom:24px; padding:0 12px">INTELLIGENCE MODULES</div>
        <div style="display:flex; flex-direction:column; gap:8px">
          ${allAspek.map(asp => {
            const items = grouped[asp];
            const done = items.filter(it => it.catatan && it.catatan.length > 50).length;
            const pct = Math.round((done / items.length) * 100);
            const isActive = currentTab === asp;
            
            return `
              <button onclick="window._switchModularTab('${asp}')"
                      style="display:flex; flex-direction:column; align-items:flex-start; padding:16px 20px; border-radius:14px; border:1px solid ${isActive ? 'hsla(220, 95%, 52%, 0.2)' : 'transparent'}; background:${isActive ? 'hsla(220, 95%, 52%, 0.1)' : 'transparent'}; color:white; cursor:pointer; transition:all 0.3s ease; text-align:left">
                <span style="font-family:'Outfit', sans-serif; font-weight:800; font-size:0.95rem; color:${isActive ? 'white' : 'var(--text-secondary)'}; margin-bottom:8px">${asp}</span>
                <div style="display:flex; align-items:center; gap:8px; width:100%">
                  <div style="flex:1; height:4px; background:hsla(220, 20%, 100%, 0.05); border-radius:10px">
                     <div style="width:${pct}%; height:100%; background:${isActive ? 'var(--brand-500)' : 'var(--text-tertiary)'}; border-radius:10px; box-shadow:${isActive ? '0 0 10px hsla(220, 95%, 52%, 0.5)' : 'none'}"></div>
                  </div>
                  <span style="font-family:var(--font-mono); font-size:8px; font-weight:800; color:var(--text-tertiary); min-width:35px; text-align:right">${done}/${items.length}</span>
                </div>
              </button>
            `;
          }).join('')}
        </div>
      </div>

      </div>
 
      <!-- Items Grid -->
      <div id="modular-items-grid" class="grid-2-col" style="padding:24px; background: hsla(220, 20%, 100%, 0.01); gap:20px; align-content:start; overflow-y:auto; max-height:800px; flex: 1">
        ${(grouped[currentTab] || []).map(item => {
          const hasAi = !!item.catatan && item.catatan.length > 50;
          return `
            <div class="card-quartz" style="padding:20px; border-top: 3px solid ${hasAi ? 'var(--brand-500)' : 'hsla(220, 20%, 100%, 0.05)'}; display:flex; flex-direction:column; gap:16px">
              <div class="flex-between">
                 <span style="font-family:var(--font-mono); font-size:9px; font-weight:800; color:var(--brand-400); background:hsla(220, 95%, 52%, 0.1); padding:4px 8px; border-radius:6px">${item.kode}</span>
                 <span style="font-family:var(--font-mono); font-size:9px; font-weight:800; color:white; opacity:0.6">${(item.status || 'BELUM').toUpperCase()}</span>
              </div>
              <h4 style="font-family:'Outfit', sans-serif; font-weight:800; font-size:0.95rem; color:white; line-height:1.4">${escHtml(item.nama)}</h4>
              
              <div style="background:hsla(220, 20%, 100%, 0.02); border:1px solid hsla(220, 20%, 100%, 0.05); border-radius:10px; padding:12px">
                <div style="font-family:var(--font-mono); font-size:8px; font-weight:800; color:var(--text-tertiary); text-transform:uppercase; letter-spacing:1px; margin-bottom:8px">FIELD EVIDENCE LOG</div>
                <div style="font-size:0.75rem; color:var(--text-secondary); line-height:1.5">
                  ${item.catatan && !hasAi ? escHtml(item.catatan) : (item.status ? `Verification result: ${escHtml(item.status)}` : '<i>Awaiting inspection data...</i>')}
                </div>
              </div>

              ${item.metadata?.deep_reasoning ? `
                <div style="padding:16px; background:hsla(160, 100%, 50%, 0.03); border:1px solid hsla(160, 100%, 50%, 0.1); border-radius:12px">
                  <div class="flex-between" style="margin-bottom:12px">
                    <div style="font-family:var(--font-mono); font-size:8px; font-weight:800; color:var(--success-400); letter-spacing:1px">🧠 DEEP REASONING PROTOCOL</div>
                    <div style="font-family:var(--font-mono); font-size:9px; font-weight:800; color:var(--success-400)">${Math.round(item.metadata.deep_reasoning.confidence * 100)}% CONFIDENCE</div>
                  </div>
                  
                  ${item.metadata.deep_reasoning.steps ? `
                    <div style="font-size:0.7rem; color:hsla(160, 100%, 80%, 0.7); line-height:1.5; margin-bottom:12px">
                      <i class="fas fa-microchip" style="margin-right:6px"></i> Methodology: ${item.metadata.deep_reasoning.steps[0]}...
                    </div>
                  ` : ''}

                  <div style="display:flex; flex-wrap:wrap; gap:4px">
                    ${(item.metadata.deep_reasoning.rules || []).slice(0, 3).map(r => `
                      <span style="font-family:var(--font-mono); font-size:7px; padding:2px 6px; background:hsla(160, 100%, 50%, 0.1); border-radius:4px; color:var(--success-300)">${r.id}</span>
                    `).join('')}
                  </div>
                </div>
              ` : ''}

              <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px">
                <button class="btn btn-ghost" style="height:32px; font-size:10px; font-weight:700; color:var(--brand-400); border:1px solid hsla(220, 95%, 52%, 0.2)" onclick="window._runNSPKBotForItem('${item.id}', '${item.nama}')">NSPK BOT</button>
                <button class="btn ${hasAi ? 'btn-ghost' : 'btn-presidential gold'}" style="height:32px; font-size:10px; font-weight:700" onclick="window._runSingleItemAnalysis('${item.id}', '${currentTab}')">
                  ${hasAi ? 'RE-ANALYZE' : 'AI NEURAL'}
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}
function renderAspectCard(a, result, checklistData) {
  const skor = result?.[a.key] || 0;
  const itemsInAspek = checklistData.filter(item => {
     const itemAsp = item.kategori === 'administrasi' ? 'ADMINISTRASI' : (item.aspek || 'Lainnya').toUpperCase();
     return itemAsp === a.label;
  });
  const analyzedCount = itemsInAspek.filter(it => !!it.catatan && it.catatan.length > 50).length;
  const totalCount = itemsInAspek.length;

  return `
    <div class="card-quartz" style="padding:20px; border-top: 3px solid ${skor >= 80 ? 'var(--success-500)' : skor >= 60 ? 'var(--gold-500)' : 'var(--danger-500)'}">
      <div class="flex-between" style="margin-bottom:16px">
         <div style="width:36px; height:36px; border-radius:8px; background:hsla(220, 20%, 100%, 0.05); display:flex; align-items:center; justify-content:center; color:white">
            <i class="fas ${a.icon}" style="font-size:0.9rem; color:${a.color}"></i>
         </div>
         <div style="font-family:'Outfit', sans-serif; font-weight:800; font-size:1.4rem; color:white">${skor}</div>
      </div>
      <div style="font-family:'Outfit', sans-serif; font-weight:800; font-size:0.8rem; color:white; margin-bottom:12px">${a.label}</div>
      <div class="flex-between" style="margin-bottom:12px">
         <span style="font-family:var(--font-mono); font-size:8px; color:var(--text-tertiary)">SYNC</span>
         <span style="font-family:var(--font-mono); font-size:9px; font-weight:800; color:white">${analyzedCount}/${totalCount}</span>
      </div>
      <button class="btn btn-ghost" style="width:100%; height:28px; font-family:var(--font-mono); font-size:8px; font-weight:800; border-radius:6px; color:white" onclick="window._runAspect('${a.label}')">
         <i class="fas fa-microchip" style="margin-right:6px"></i> AUDIT
      </button>
    </div>
  `;
}
