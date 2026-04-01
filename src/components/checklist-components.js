/**
 * CHECKLIST COMPONENTS
 * Modular UI templates for Building Inspection Checklists.
 * PRESIDENTIAL CLASS (QUARTZ PREMIUM)
 */
import { escHtml, getFileNameFromUrl } from '../lib/utils.js';

/**
 * Main Checklist Shell (Header & Navigation)
 */
export function renderChecklistShell(proyek, checklist) {
  const adminDone = Object.values(checklist.dataMap).filter(i => i.kategori === 'administrasi' && i.status).length;
  const teknisDone = Object.values(checklist.dataMap).filter(i => i.kategori === 'teknis' && i.status).length;
  const totalItems = 70; // Hardcoded benchmark for visual
  const progressPct = Math.round(((adminDone + teknisDone) / totalItems) * 100);

  return `
    <div id="checklist-page" style="animation: page-fade-in 0.8s ease-out">
      
      <!-- Presidential Header -->
      <div class="page-header" style="margin-bottom:var(--space-8)">
        <div class="flex-between" style="align-items: flex-start">
          <div>
            <button class="btn btn-ghost btn-xs" onclick="window.navigate('proyek-detail',{id:'${proyek.id}'})" style="margin-bottom:12px; padding:0; color:var(--brand-300); font-weight:700; letter-spacing:1px">
              <i class="fas fa-arrow-left" style="margin-right:8px"></i> ${escHtml(proyek.nama_bangunan)}
            </button>
            <h1 class="page-title" style="font-family:'Outfit', sans-serif; font-weight:800; font-size: 2.2rem; letter-spacing:-0.02em; margin-bottom:4px">
              Checklist <span class="text-gradient-gold">Pemeriksaan SLF</span>
            </h1>
            <p class="page-subtitle" style="font-family:var(--font-mono); font-size: 0.7rem; letter-spacing:1px; opacity:0.6; text-transform:uppercase">
              TECHNICAL AUDIT PROTOCOL &bull; AUTO-SYNC ENABLED
            </p>
          </div>
          
          <div class="flex gap-6" style="align-items:center">
            <div id="save-indicator" style="background:hsla(220, 20%, 100%, 0.03); padding:8px 16px; border-radius:12px; border:1px solid hsla(220, 20%, 100%, 0.05); min-width:180px; text-align:center">
              ${checklist.isSaving 
                ? `<div style="font-size:10px; font-weight:800; color:var(--brand-400); text-transform:uppercase" class="animate-pulse"><i class="fas fa-circle-notch fa-spin"></i> Synchronizing...</div>` 
                : `<div style="font-size:10px; font-weight:800; color:var(--text-tertiary); text-transform:uppercase">
                    <i class="fas fa-shield-check ${checklist.lastSaveTime ? 'text-success-400' : ''}" style="margin-right:6px"></i> 
                    ${checklist.lastSaveTime ? `Synced: ${checklist.lastSaveTime}` : 'Cloud Integrity Valid'}
                   </div>`
              }
            </div>
            <div style="text-align:right">
               <div style="font-family:var(--font-mono); font-size:9px; font-weight:800; color:var(--text-tertiary); text-transform:uppercase; letter-spacing:1px; margin-bottom:4px">Audit Progress</div>
               <div style="font-family:'Outfit', sans-serif; font-weight:800; font-size:1.4rem; color:white; line-height:1">${adminDone + teknisDone} <span style="font-size:0.8rem; color:var(--text-tertiary)">/ ${totalItems}</span></div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- AI Recommendation Banner (Presidential Glass) -->
      ${(adminDone + teknisDone) < 10 ? `
      <div class="card-quartz" style="margin-bottom:var(--space-8); background: var(--gradient-dark); border-color: hsla(220, 95%, 52%, 0.2); padding: var(--space-6)">
        <div class="flex-between">
          <div class="flex gap-5 items-center">
            <div style="width:56px; height:56px; background:var(--gradient-brand); color:white; border-radius:16px; display:flex; align-items:center; justify-content:center; font-size:1.6rem; box-shadow: var(--shadow-sapphire); border:1px solid hsla(220, 95%, 52%, 0.3)">
              <i class="fas fa-brain-circuit"></i>
            </div>
            <div>
              <div style="font-family:'Outfit', sans-serif; font-weight:800; font-size:1.1rem; color:white">AI STRATEGIC MAPPING ENABLED</div>
              <p style="font-size:0.8rem; color:var(--brand-300); margin-top:4px; max-width:500px">Neural engine detected blueprints in SIMBG drive. Utilize smart-sync to automatically populate technical findings from document audit logs.</p>
            </div>
          </div>
          <button class="btn-presidential gold" onclick="window._triggerGlobalAiSync()" style="height:48px; padding:0 32px">
            <i class="fas fa-bolt" style="margin-right:10px"></i> ACTIVATE SMART SYNC
          </button>
        </div>
      </div>
      ` : ''}

      <!-- Presidential Tab Bar -->
      <div class="card-quartz" style="padding: 6px; margin-bottom: var(--space-8); display: flex; gap: 8px; background: hsla(224, 25%, 4%, 0.6)">
        ${[
          { id: 'admin', icon: 'fa-file-shield', label: 'ADMINISTRASI' },
          { id: 'teknis', icon: 'fa-building-circle-check', label: 'EVALUASI TEKNIS' },
          { id: 'kajian', icon: 'fa-file-signature', label: 'DAFTAR SIMAK' },
          { id: 'files',  icon: 'fa-folder-tree', label: 'BERKAS SIMBG' }
        ].map(tab => `
          <button onclick="window._switchTab('${tab.id}')" 
                  style="flex:1; height:44px; border:none; border-radius:10px; cursor:pointer; font-family:var(--font-mono); font-size:10px; font-weight:800; letter-spacing:1px; display:flex; align-items:center; justify-content:center; gap:10px; transition:all 0.3s; 
                         background:${checklist.activeTab === tab.id ? 'var(--gradient-brand)' : 'transparent'}; 
                         color:${checklist.activeTab === tab.id ? 'white' : 'var(--text-tertiary)'};
                         box-shadow:${checklist.activeTab === tab.id ? 'var(--shadow-sapphire)' : 'none'}">
            <i class="fas ${tab.icon}"></i> ${tab.label}
          </button>
        `).join('')}
      </div>

      <div id="checklist-content" class="route-fade">
         <!-- Active Tab Content Injected Here -->
      </div>

      <!-- Live Viewfinder (Presidential Overlay) -->
      <div id="camera-modal" class="camera-modal" style="display:none; position: fixed; top: 0; left: 0; width:100vw; height:100vh; background:#020408; z-index:9999; display:flex; flex-direction:column">
        <div style="position:absolute; inset:0; z-index:10; display:flex; flex-direction:column; justify-content:space-between; padding:32px; pointer-events:none">
           <div style="display:flex; justify-content:space-between; align-items:center; pointer-events:auto">
              <div style="font-family:var(--font-mono); font-size:12px; font-weight:800; color:white; letter-spacing:2px; display:flex; align-items:center; gap:12px">
                 <div class="animate-pulse" style="width:8px; height:8px; border-radius:50%; background:var(--danger-500)"></div>
                 LIVE FIELD INSPEKSI RECON
              </div>
              <button class="btn btn-ghost" onclick="window._closeCamera()" style="width:44px; height:44px; border-radius:50%; background:hsla(220, 20%, 100%, 0.1); color:white; padding:0">
                 <i class="fas fa-times"></i>
              </button>
           </div>
           
           <div class="camera-controls" style="display:flex; flex-direction:column; align-items:center; gap:32px; pointer-events:auto">
              <div id="camera-wm-preview" style="font-family:'Outfit', sans-serif; font-weight:800; font-size:1.2rem; color:white; text-shadow:0 2px 10px rgba(0,0,0,0.8); text-align:center"></div>
              <div class="flex gap-8" style="align-items:center">
                 <button class="btn" onclick="window._flipCamera()" style="width:56px; height:56px; border-radius:50%; background:hsla(220, 20%, 100%, 0.1); color:white; border:1px solid hsla(220, 20%, 100%, 0.2)">
                    <i class="fas fa-camera-rotate"></i>
                 </button>
                 <button onclick="window._takePhoto()" style="width:88px; height:88px; border-radius:50%; background:white; border:6px solid hsla(220, 20%, 100%, 0.3); display:flex; align-items:center; justify-content:center; cursor:pointer; box-shadow:0 0 30px rgba(255,255,255,0.4)">
                    <div style="width:68px; height:68px; border-radius:50%; border:2px solid #020408"></div>
                 </button>
                 <div style="width:56px"></div>
              </div>
           </div>
        </div>
        <video id="camera-video" style="width:100%; height:100%; object-fit:cover" autoplay playsinline muted></video>
        <canvas id="camera-canvas" style="display:none"></canvas>
      </div>
    </div>
  `;
}

/**
 * Admin & Teknis Table View
 */
export function renderChecklistTable(title, subtitle, items, dataMap, options, kategori) {
  return `
    <div class="card-quartz" style="padding:0; overflow:hidden; border: 1px solid var(--border-strong)">
      <div class="card-header flex-between" style="padding: var(--space-6) var(--space-8); border-bottom:1px solid var(--border-subtle); background: hsla(220, 20%, 100%, 0.02)">
        <div>
          <h2 style="font-family:'Outfit', sans-serif; font-weight:800; font-size:1.1rem; color:white; margin:0">${title}</h2>
          <p style="font-size:0.75rem; color:var(--text-tertiary); text-transform:uppercase; letter-spacing:1px; margin-top:4px">${subtitle}</p>
        </div>
        <div class="flex gap-4">
           <div id="ai-batch-status" style="display:none; align-items:center; gap:8px; background:hsla(220, 95%, 52%, 0.1); padding:0 16px; border-radius:10px; border:1px solid hsla(220, 95%, 52%, 0.2)">
              <i class="fas fa-circle-notch fa-spin" style="color:var(--brand-400); font-size:0.7rem"></i>
              <span style="font-family:var(--font-mono); font-size:9px; font-weight:800; color:var(--brand-400)">ENGINE RUNNING...</span>
           </div>
           <button class="btn-presidential gold" style="height:38px; padding:0 20px; font-size:11px" onclick="window._runBatchSmartEngine('${kategori}')">
             <i class="fas fa-microchip" style="margin-right:8px"></i> SMART BATCH ANALYTICS
           </button>
        </div>
      </div>
      <div style="overflow-x:auto">
        <table class="checklist-table" style="width:100%; border-collapse:collapse">
          <thead>
            <tr style="background: hsla(220, 20%, 100%, 0.01)">
              <th style="width:80px; text-align:center; padding:16px; color:var(--text-tertiary); font-family:var(--font-mono); font-size:10px; letter-spacing:1px">KODE</th>
              <th style="text-align:left; padding:16px; color:var(--text-tertiary); font-family:var(--font-mono); font-size:10px; letter-spacing:1px">AUDIT COMPONENT</th>
              <th style="width:220px; text-align:left; padding:16px; color:var(--text-tertiary); font-family:var(--font-mono); font-size:10px; letter-spacing:1px">STATUS CONDITIONS</th>
              <th style="width:340px; text-align:left; padding:16px; color:var(--text-tertiary); font-family:var(--font-mono); font-size:10px; letter-spacing:1px">INTEL & MITIGATION</th>
            </tr>
          </thead>
          <tbody>
            ${items.map(item => {
              const entry = dataMap[item.kode] || {};
              const hasEvidence = (entry.foto_urls && entry.foto_urls.length > 0);
              
              return `
                <tr style="border-bottom:1px solid hsla(220, 20%, 100%, 0.03); transition:all 0.2s" onmouseenter="this.style.background='hsla(220, 20%, 100%, 0.01)'" onmouseleave="this.style.background='transparent'">
                  <td style="text-align:center; vertical-align:top; padding:20px 16px"><span style="font-family:var(--font-mono); font-weight:800; font-size:10px; color:var(--brand-400); background:hsla(220, 95%, 52%, 0.1); padding:4px 8px; border-radius:6px">${item.kode}</span></td>
                  <td style="vertical-align:top; padding:20px 16px">
                    <div style="display:flex; align-items:center; gap:10px; margin-bottom:12px">
                       <div style="font-weight:800; font-size:0.95rem; color:white">${escHtml(item.nama)}</div>
                       ${entry.metadata?.is_ai_draft ? `<span class="badge" style="font-size:8px; font-weight:800; background:hsla(45, 90%, 60%, 0.1); color:var(--gold-400); border:1px solid hsla(45, 90%, 60%, 0.2); letter-spacing:1px"><i class="fas fa-wand-magic-sparkles" style="margin-right:4px"></i> AI DRAFTED</span>` : ''}
                    </div>
                    
                    <!-- Evidence Module -->
                    <div style="display:flex; flex-direction:column; gap:8px">
                       ${hasEvidence ? entry.foto_urls.map(url => {
                         const isImage = url.match(/\.(jpg|jpeg|png|gif|webp)/i) || url.includes('googleusercontent.com');
                         const fileName = getFileNameFromUrl(url);
                         return `
                           <div style="display:flex; align-items:center; gap:12px; padding:10px 16px; background:hsla(220, 20%, 100%, 0.02); border:1px solid hsla(220, 20%, 100%, 0.05); border-radius:12px; transition:all 0.2s" onmouseenter="this.style.borderColor='hsla(220, 20%, 100%, 0.1)'" onmouseleave="this.style.borderColor='hsla(220, 20%, 100%, 0.05)'">
                              <div style="width:36px; height:36px; border-radius:8px; background:hsla(220, 20%, 100%, 0.03); display:flex; align-items:center; justify-content:center; color:white; border:1px solid hsla(220, 20%, 100%, 0.1)">
                                 <i class="fas ${isImage ? 'fa-image' : 'fa-file-pdf'}" style="font-size:0.9rem"></i>
                              </div>
                              <div style="flex:1; overflow:hidden">
                                 <div style="font-size:0.75rem; font-weight:700; color:white; white-space:nowrap; overflow:hidden; text-overflow:ellipsis">${escHtml(fileName)}</div>
                                 <div style="font-size:0.65rem; color:var(--text-tertiary); font-family:var(--font-mono); text-transform:uppercase; letter-spacing:1px; opacity:0.6">${isImage ? 'MEDIA ATTACHMENT' : 'REGULATORY DOC'}</div>
                              </div>
                              <div class="flex gap-2">
                                 <button class="btn btn-ghost btn-xs" onclick="window._showLightbox('${url}')" style="color:var(--brand-400)"><i class="fas fa-eye"></i></button>
                                 <button class="btn btn-ghost btn-xs" onclick="window._removeFile('${item.kode}', '${url}')" style="color:var(--danger-400)"><i class="fas fa-trash-can"></i></button>
                              </div>
                           </div>
                         `;
                       }).join('') : `
                         <div onclick="document.getElementById('file-${item.kode}').click()" style="height:70px; border:1px dashed hsla(220, 20%, 100%, 0.1); border-radius:12px; display:flex; flex-direction:column; align-items:center; justify-content:center; color:var(--text-tertiary); font-size:0.7rem; background:hsla(220, 20%, 100%, 0.01); cursor:pointer; transition:all 0.2s" onmouseenter="this.style.borderColor='hsla(220, 20%, 100%, 0.2)'; this.style.background='hsla(220, 20%, 100%, 0.03)'" onmouseleave="this.style.borderColor='hsla(220, 20%, 100%, 0.1)'; this.style.background='hsla(220, 20%, 100%, 0.01)'">
                            <i class="fas fa-cloud-upload" style="margin-bottom:6px; font-size:1rem; opacity:0.5"></i>
                            IMPORT EVIDENCE
                         </div>
                       `}
                    </div>
                  </td>
                  <td style="vertical-align:top; padding:20px 16px">
                    <select class="form-select" 
                            style="width:100%; height:42px; background:hsla(220, 20%, 100%, 0.03); border-color:hsla(220, 20%, 100%, 0.05); border-radius:10px; font-weight:700; font-size:0.8rem; color:white"
                            onchange="window._onFieldChange('${item.kode}', 'status', this.value)">
                      <option value="">— SELECT STATUS —</option>
                      ${options.map(o => `<option value="${o.value}" ${entry.status === o.value ? 'selected' : ''}>${o.label.toUpperCase()}</option>`).join('')}
                    </select>
                  </td>
                  <td style="vertical-align:top; padding:20px 16px">
                    <div style="position:relative; margin-bottom:12px">
                       <textarea class="form-input" rows="2"
                                 placeholder="Tactical Findings..."
                                 onchange="window._onFieldChange('${item.kode}', 'catatan', this.value)"
                                 style="font-size:0.75rem; padding:12px; padding-right:40px; background:hsla(220, 20%, 100%, 0.03); border-color:hsla(220, 20%, 100%, 0.05); border-radius:10px; color:white">${escHtml(entry.catatan || '')}</textarea>
                       <button class="btn ${entry.isRecording ? 'btn-danger animate-pulse' : 'btn-ghost'}" 
                               style="position:absolute; top:8px; right:8px; width:28px; height:28px; border-radius:8px; padding:0; background:${entry.isRecording ? 'var(--danger-500)' : 'hsla(220, 20%, 100%, 0.05)'}; color:white"
                               onclick="window._toggleVoiceNote('${item.kode}')">
                          <i class="fas ${entry.isRecording ? 'fa-microphone-slash' : 'fa-microphone'}"></i>
                       </button>
                    </div>

                    <!-- Remedial Mitigation -->
                    <div style="background:hsla(45, 90%, 60%, 0.05); padding:12px; border-radius:12px; border:1px solid hsla(45, 90%, 60%, 0.1); margin-bottom:16px">
                      <div style="font-family:var(--font-mono); font-size:8px; font-weight:800; color:var(--gold-400); letter-spacing:1px; margin-bottom:8px">MITIGATION RECOMMENDATION</div>
                      <textarea class="form-input" rows="1" 
                                placeholder="Required remedial actions..."
                                onchange="window._onFieldChange('${item.kode}', 'rekomendasi', this.value)"
                                style="font-size:0.7rem; padding:8px; background:transparent; border:none; border-bottom:1px solid hsla(45, 90%, 60%, 0.2); color:white; resize:none">${escHtml(entry.rekomendasi || '')}</textarea>
                      <div class="mt-3 flex-between">
                         <div style="font-family:var(--font-mono); font-size:8px; font-weight:800; color:var(--text-tertiary); letter-spacing:1px">TARGET TIMEFRAME</div>
                         <input type="text" class="form-input" placeholder="e.g. 14 Days" onchange="window._onFieldChange('${item.kode}', 'remedy_time', this.value)" value="${escHtml(entry.remedy_time || '')}" style="width:100px; font-size:0.75rem; font-weight:800; text-align:right; border:none; background:transparent; color:var(--brand-400)">
                      </div>
                    </div>

                    <div class="flex gap-2" style="justify-content:flex-end">
                       <button class="btn btn-ghost btn-xs" onclick="window._fetchItemData('${item.kode}', '${item.nama}')" style="color:var(--brand-300); font-family:var(--font-mono); font-size:8px; font-weight:800; padding:6px 12px; border:1px solid hsla(220, 20%, 100%, 0.05); border-radius:8px">
                         <i class="fas fa-microchip" style="margin-right:6px"></i> AI FETCH
                       </button>
                       <button class="btn btn-ghost btn-xs" onclick="document.getElementById('file-${item.kode}').click()" style="color:var(--text-secondary); font-family:var(--font-mono); font-size:8px; font-weight:800; padding:6px 12px; border:1px solid hsla(220, 20%, 100%, 0.05); border-radius:8px">
                         <i class="fas fa-upload" style="margin-right:6px"></i> UPLOAD
                       </button>
                       <button class="btn-presidential gold" style="height:28px; width:28px; padding:0; border-radius:8px" onclick="window._openLiveCamera('${item.kode}', '${item.nama}', '${kategori}')">
                         <i class="fas fa-camera"></i>
                       </button>
                       <input type="file" id="file-${item.kode}" multiple style="display:none" onchange="window._handleImageSelect(event, '${item.kode}', '${item.nama}', '${kategori}')">
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

/**
 * Daftar Simak K.1 - K.2 Blocks (Forensic Format)
 */
export function renderKajianBlocks(groups, dataMap) {
  return `
    <div style="display:flex; flex-direction:column; gap:var(--space-8); animation: page-fade-in 0.8s ease-out">
       <div class="flex-between" style="align-items:flex-start">
          <div>
            <h2 style="font-family:'Outfit', sans-serif; font-weight:800; font-size:1.6rem; color:white; margin:0">Daftar Simak Kajian Teknis</h2>
            <p style="font-size:0.75rem; color:var(--text-tertiary); text-transform:uppercase; letter-spacing:1px; margin-top:4px">Formal Audit protocol based on Permen PUPR 16/2010</p>
          </div>
          <button class="btn-presidential gold" style="height:44px; padding:0 24px" onclick="window._autoFillFromAgents()">
             <i class="fas fa-wand-magic-sparkles" style="margin-right:10px"></i> MULTI-AGENT AUTO-FILL
          </button>
       </div>
       
       ${groups.map(grup => `
          <div style="background:linear-gradient(90deg, hsla(220, 95%, 52%, 0.1) 0%, transparent 100%); padding:12px 24px; border-left:4px solid var(--brand-500); border-radius:0 12px 12px 0; font-family:'Outfit', sans-serif; font-weight:800; font-size:1.1rem; color:white; margin-top:16px">
             ${escHtml(grup.aspek).toUpperCase()}
          </div>
          <div style="display:grid; grid-template-columns: 1fr; gap:20px">
            ${grup.items.map(item => {
               const entry = dataMap[item.kode] || {};
               return `
                 <div class="card-quartz" style="padding:0; overflow:hidden; border-color:hsla(220, 20%, 100%, 0.05)">
                    <div class="flex-between" style="background:hsla(220, 20%, 100%, 0.02); padding:16px 24px; border-bottom:1px solid hsla(220, 20%, 100%, 0.03)">
                       <div style="font-weight:800; font-size:1rem; color:white">${item.kode}. ${escHtml(item.nama)}</div>
                       <div style="font-family:var(--font-mono); font-size:10px; font-weight:800; color:var(--text-tertiary); letter-spacing:1px">REGULATORY REF: ${item.ref}</div>
                    </div>
                    <div style="display:grid; grid-template-columns: 1fr 1fr 1.5fr; padding:24px; gap:32px">
                       <div>
                          <div style="font-family:var(--font-mono); font-size:9px; font-weight:800; color:var(--brand-400); letter-spacing:1px; margin-bottom:12px">PENILAIAN VISUAL</div>
                          <select class="form-select" style="width:100%; height:44px; background:hsla(220, 20%, 100%, 0.03); border-color:hsla(220, 20%, 100%, 0.05); border-radius:12px; font-weight:700; color:white"
                                  onchange="window._onFieldChange('${item.kode}', 'status', this.value)">
                             <option value="baik" ${entry.status === 'baik' ? 'selected' : ''}>BAIK / SESUAI</option>
                             <option value="rusak_ringan" ${entry.status === 'rusak_ringan' ? 'selected' : ''}>RUSAK RINGAN</option>
                             <option value="rusak_sedang" ${entry.status === 'rusak_sedang' ? 'selected' : ''}>RUSAK SEDANG</option>
                             <option value="rusak_berat" ${entry.status === 'rusak_berat' ? 'selected' : ''}>RUSAK BERAT</option>
                          </select>
                       </div>
                       <div>
                          <div style="font-family:var(--font-mono); font-size:9px; font-weight:800; color:var(--gold-400); letter-spacing:1px; margin-bottom:12px">VALIDASI DOKUMEN</div>
                          <div style="display:flex; gap:20px; height:44px; align-items:center">
                             <label style="flex:1; cursor:pointer; background:hsla(220, 20%, 100%, 0.03); border-radius:12px; height:100%; display:flex; align-items:center; justify-content:center; gap:8px; border:1px solid ${entry.metadata?.kesesuaian === 'sesuai' ? 'var(--success-500)' : 'transparent'}">
                                <input type="radio" name="rad-${item.kode}" value="sesuai" style="accent-color:var(--success-500)"
                                       ${entry.metadata?.kesesuaian === 'sesuai' ? 'checked' : ''}
                                       onchange="window._onMetadataChange('${item.kode}', 'kesesuaian', 'sesuai')"> 
                                <span style="font-size:0.8rem; font-weight:700; color:${entry.metadata?.kesesuaian === 'sesuai' ? 'white' : 'var(--text-tertiary)'}">SESUAI</span>
                             </label>
                             <label style="flex:1; cursor:pointer; background:hsla(220, 20%, 100%, 0.03); border-radius:12px; height:100%; display:flex; align-items:center; justify-content:center; gap:8px; border:1px solid ${entry.metadata?.kesesuaian === 'tidak' ? 'var(--danger-500)' : 'transparent'}">
                                <input type="radio" name="rad-${item.kode}" value="tidak" style="accent-color:var(--danger-500)"
                                       ${entry.metadata?.kesesuaian === 'tidak' ? 'checked' : ''}
                                       onchange="window._onMetadataChange('${item.kode}', 'kesesuaian', 'tidak')"> 
                                <span style="font-size:0.8rem; font-weight:700; color:${entry.metadata?.kesesuaian === 'tidak' ? 'white' : 'var(--text-tertiary)'}">TIDAK</span>
                             </label>
                          </div>
                       </div>
                       <div>
                          <div style="font-family:var(--font-mono); font-size:9px; font-weight:800; color:var(--text-secondary); letter-spacing:1px; margin-bottom:12px">REKOMENDASI KELAYAKAN</div>
                          <textarea class="form-input" rows="2" 
                                    onchange="window._onFieldChange('${item.kode}', 'catatan', this.value)"
                                    style="font-size:0.8rem; padding:12px; background:hsla(220, 20%, 100%, 0.03); border-color:hsla(220, 20%, 100%, 0.05); border-radius:12px; color:white">${escHtml(entry.catatan || '')}</textarea>
                       </div>
                    </div>
                 </div>
               `;
            }).join('')}
          </div>
       `).join('')}
    </div>
  `;
}
