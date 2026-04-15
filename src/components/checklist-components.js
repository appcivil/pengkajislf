/**
 * CHECKLIST COMPONENTS
 * Modular UI templates for Building Inspection Checklists.
 * PRESIDENTIAL CLASS (QUARTZ DIGITAL SIDEBAR)
 */
import { escHtml, getFileNameFromUrl } from '../lib/utils.js';
import { CHECKLIST_SECTIONS, SCALE_OPTIONS } from '../lib/checklist-data.js';

/**
 * Main Checklist Shell (Sidebar & Main content Grid)
 */
export function renderChecklistShell(proyek, checklist) {
  const totalItems = checklist.fullSchema?.length || 70;
  const doneItems = Object.values(checklist.dataMap).filter(i => i.status || i.nilai).length;
  const progressPct = Math.round((doneItems / totalItems) * 100);

  return `
    <div id="checklist-page" style="animation: page-fade-in 0.6s ease-out; display: grid; grid-template-columns: 320px 1fr; gap: var(--space-8); height: calc(100vh - 120px); overflow: hidden">
      
      <!-- LEFT SIDEBAR (Navigation & Progress) -->
      <div class="sidebar-quartz" style="display: flex; flex-direction: column; gap: 24px; overflow-y: auto; padding-right: 8px">
         
         <!-- Progress Card -->
         <div class="card-quartz" style="padding: 24px; background: var(--gradient-dark); border-color: hsla(220, 95%, 52%, 0.2)">
            <div style="font-family: var(--font-mono); font-size: 9px; font-weight: 800; color: var(--text-tertiary); letter-spacing: 1px; margin-bottom: 12px">OVERALL AUDIT PROGRESS</div>
            <div style="display: flex; align-items: baseline; gap: 8px; margin-bottom: 16px">
               <span style="font-size: 2.2rem; font-weight: 900; color: white; line-height: 1">${progressPct}%</span>
               <span style="font-size: 0.8rem; color: var(--text-tertiary)">COMPLETED</span>
            </div>
            <div class="progress-wrap" style="height: 6px; background: hsla(220, 20%, 100%, 0.05)">
               <div class="progress-fill" style="width: ${progressPct}%; background: var(--gradient-brand); box-shadow: 0 0 15px var(--brand-500)"></div>
            </div>
         </div>

         <!-- Category Menu -->
         <div style="display: flex; flex-direction: column; gap: 8px">
            ${CHECKLIST_SECTIONS.map(sec => {
              const isActive = (checklist.activeTab || 'identitas') === sec.id;
              const secItems = checklist.fullSchema?.filter(i => i.category === sec.id) || [];
              const secDone = secItems.filter(i => checklist.dataMap[i.kode]?.status || checklist.dataMap[i.kode]?.nilai).length;
              
              return `
              <button onclick="window._switchTab('${sec.id}')" 
                      class="nav-item-quartz ${isActive ? 'active' : ''}"
                      style="display: flex; align-items: center; gap: 16px; padding: 16px 20px; border-radius: 16px; border: 1px solid ${isActive ? 'hsla(220, 95%, 52%, 0.3)' : 'transparent'}; 
                             background: ${isActive ? 'hsla(220, 95%, 52%, 0.1)' : 'transparent'}; 
                             transition: all 0.3s; cursor: pointer; text-align: left; width: 100%">
                 <div style="width: 40px; height: 40px; border-radius: 12px; background: ${isActive ? 'var(--gradient-brand)' : 'hsla(220, 20%, 100%, 0.03)'}; 
                             display: flex; align-items: center; justify-content: center; color: ${isActive ? 'white' : 'var(--text-tertiary)'}; font-size: 1.1rem">
                    <i class="fas ${sec.icon}"></i>
                 </div>
                 <div style="flex: 1">
                    <div style="font-weight: 800; font-size: 0.85rem; color: ${isActive ? 'white' : 'var(--text-secondary)'}; text-transform: uppercase; letter-spacing: 0.5px">${sec.label}</div>
                    <div style="font-size: 0.7rem; color: var(--text-tertiary); margin-top: 2px">${secDone} / ${secItems.length} Sub-items</div>
                 </div>
                 ${secDone === secItems.length && secItems.length > 0 ? `<i class="fas fa-check-circle text-success-400" style="font-size: 0.8rem"></i>` : ''}
              </button>
              `;
            }).join('')}
         </div>

         <div style="margin-top: auto; padding: 20px">
            <button class="btn btn-ghost" onclick="window.navigate('proyek-detail',{id:'${proyek.id}'})" style="width:100%; border-radius:12px; font-size:0.8rem; color: var(--text-tertiary)">
               <i class="fas fa-sign-out-alt" style="margin-right:8px"></i> BACK TO OVERVIEW
            </button>
         </div>
      </div>

      <!-- RIGHT CONTENT (Form Sections) -->
      <div id="checklist-content-wrap" style="overflow-y: auto; padding-right: 8px">
         <div id="checklist-content" class="route-fade">
            <!-- Content Injected Dynamically -->
         </div>
      </div>

      <!-- Live Viewfinder (Presidential Overlay) -->
      <div id="camera-modal" class="camera-modal" style="display:none; position: fixed; top: 0; left: 0; width:100vw; height:100vh; background:#020408; z-index:9999; flex-direction:column">
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
 * Render a vertical list of items for a specific section
 */
export function renderChecklistSection(sectionId, items, dataMap) {
  const section = CHECKLIST_SECTIONS.find(s => s.id === sectionId) || {};
  
  return `
    <div style="animation: slide-up 0.4s ease-out">
       <div class="flex-between flex-stack" style="margin-bottom: 32px">
          <div>
             <h1 style="font-family:'Outfit', sans-serif; font-weight:800; font-size: 2.2rem; margin:0; color:white">${section.label}</h1>
             <p style="font-size:0.8rem; color:var(--text-tertiary); margin-top:8px">Pemeriksaan teknis kelaikan fungsi bangunan berdasarkan standar Kementerian PUPR.</p>
          </div>
          <div class="flex gap-3">
             <button class="btn btn-secondary btn-sm" onclick="window._saveDraft()">
                <i class="fas fa-save" style="margin-right:8px"></i> SIMPAN DRAFT
             </button>
             <button class="btn-presidential gold btn-sm" onclick="window._autoFillFromAgents()">
                <i class="fas fa-wand-magic-sparkles" style="margin-right:8px"></i> AI AUTO-FILL
             </button>
          </div>
       </div>

       <div style="display: flex; flex-direction: column; gap: 24px">
          ${items.map((item, idx) => {
            const entry = dataMap[item.kode] || {};
            const isSubHeader = item.sub && (!items[idx-1] || items[idx-1].sub !== item.sub);
            
            return `
               ${isSubHeader ? `<div style="font-family:var(--font-mono); font-size:10px; font-weight:800; color:var(--brand-400); letter-spacing:2px; margin-top:16px; text-transform:uppercase">${item.sub}</div>` : ''}
               
               <div class="card-quartz" style="padding: 24px; border-color: hsla(220, 20%, 100%, 0.05); transition: all 0.3s">
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; align-items: start">
                     
                     <!-- Left: Item Info & Evidence -->
                     <div>
                        <div style="display: flex; gap: 16px; align-items: flex-start; margin-bottom: 16px">
                           <div style="font-family: var(--font-mono); font-weight: 800; font-size: 11px; color: var(--brand-400); background: hsla(220, 95%, 52%, 0.1); padding: 4px 8px; border-radius: 6px">${item.kode}</div>
                           <div style="font-weight: 800; font-size: 1.05rem; color: white">${escHtml(item.nama)}</div>
                        </div>
                        
                        <div id="evidence-container-${item.kode}" style="display: flex; flex-wrap: wrap; gap: 12px">
                           ${(entry.foto_urls || []).map(url => `
                              <div style="position: relative; width: 64px; height: 64px; border-radius: 12px; overflow: hidden; border: 1px solid hsla(220, 20%, 100%, 0.1)">
                                 <img src="${url}" style="width: 100%; height: 100%; object-fit: cover; cursor: pointer" onclick="window._showLightbox('${url}')">
                                 <button onclick="window._removeFile('${item.kode}', '${url}')" style="position: absolute; top: 4px; right: 4px; width: 18px; height: 18px; border-radius: 50%; background: var(--danger-500); color: white; border: none; font-size: 8px; cursor: pointer"><i class="fas fa-times"></i></button>
                              </div>
                           `).join('')}
                           <button class="btn-presidential gold" 
                                   style="width: 64px; height: 64px; border-radius: 12px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; font-size: 0.6rem"
                                   onclick="window._openLiveCamera('${item.kode}', '${item.nama}', '${sectionId}')">
                              <i class="fas fa-camera" style="font-size: 1.1rem"></i>
                              FOTO
                           </button>
                           <label class="btn btn-outline" 
                                  style="width: 64px; height: 64px; border-radius: 12px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; font-size: 0.6rem; cursor: pointer; border-color: hsla(220, 20%, 100%, 0.2); color: var(--text-secondary)">
                              <i class="fas fa-folder-open" style="font-size: 1.1rem"></i>
                              DOKUMEN
                              <input type="file" multiple accept="image/*,application/pdf,.doc,.docx" 
                                     style="display: none" 
                                     onchange="window._handleMultiFileSelect(event, '${item.kode}', '${item.nama}', '${sectionId}')">
                           </label>
                        </div>
                     </div>

                     <!-- Right: Inputs -->
                     <div style="display: flex; flex-direction: column; gap: 16px">
                        ${renderItemInput(item, entry)}
                        
                        <div style="position: relative">
                           <textarea class="form-input" rows="2" placeholder="Catatan pemeriksaan / Temuan lapangan..."
                                     onchange="window._onFieldChange('${item.kode}', 'catatan', this.value)"
                                     style="background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.05); border-radius: 12px; color: white; font-size: 0.85rem">${escHtml(entry.catatan || '')}</textarea>
                           <button class="btn btn-ghost" 
                                   style="position: absolute; bottom: 8px; right: 8px; width: 32px; height: 32px; padding: 0; border-radius: 8px; color: var(--text-tertiary)"
                                   onclick="window._toggleVoiceNote('${item.kode}')">
                              <i class="fas fa-microphone"></i>
                           </button>
                        </div>
                     </div>

                  </div>
               </div>
            `;
          }).join('')}
       </div>
    </div>
  `;
}

/**
 * Dynamic Input Renderer
 */
function renderItemInput(item, entry) {
  const val = entry.status || entry.nilai || '';
  
  switch(item.type) {
    case 'boolean':
      const isSesuai = val === 'sesuai';
      const isTidak = val === 'tidak_sesuai';
      return `
        <div style="font-family: var(--font-mono); font-size: 9px; font-weight: 800; color: var(--text-tertiary); letter-spacing: 1px; margin-bottom: 8px">KESESUAIAN STANDAR</div>
        <div style="display: flex; gap: 12px">
           <button class="btn btn-sm" onclick="window._onFieldChange('${item.kode}', 'status', 'sesuai')"
                   style="flex: 1; height: 42px; border-radius: 12px; background: ${isSesuai ? 'var(--success-500)' : 'hsla(220, 20%, 100%, 0.03)'}; border-color: ${isSesuai ? 'transparent' : 'hsla(220, 20%, 100%, 0.05)'}; color: ${isSesuai ? 'white' : 'var(--text-tertiary)'}; font-weight: 800; font-size: 0.8rem">
              <i class="fas fa-check" style="margin-right: 8px"></i> SESUAI
           </button>
           <button class="btn btn-sm" onclick="window._onFieldChange('${item.kode}', 'status', 'tidak_sesuai')"
                   style="flex: 1; height: 42px; border-radius: 12px; background: ${isTidak ? 'var(--danger-500)' : 'hsla(220, 20%, 100%, 0.03)'}; border-color: ${isTidak ? 'transparent' : 'hsla(220, 20%, 100%, 0.05)'}; color: ${isTidak ? 'white' : 'var(--text-tertiary)'}; font-weight: 800; font-size: 0.8rem">
              <i class="fas fa-times" style="margin-right: 8px"></i> TIDAK
           </button>
        </div>
      `;
    
    case 'scale':
      return `
        <div style="font-family: var(--font-mono); font-size: 9px; font-weight: 800; color: var(--text-tertiary); letter-spacing: 1px; margin-bottom: 8px">KONDISI FISIK</div>
        <select class="form-select" onchange="window._onFieldChange('${item.kode}', 'status', this.value)"
                style="height: 42px; border-radius: 12px; background: rgba(255,255,255,0.9); color: #0f172a; font-weight: 800; font-size: 0.85rem">
           <option value="">-- PILIH KONDISI --</option>
           ${SCALE_OPTIONS.map(o => `<option value="${o.value}" ${val === o.value ? 'selected' : ''} style="color:#0f172a">${o.label.toUpperCase()}</option>`).join('')}
        </select>
      `;

    case 'number':
      return `
        <div style="font-family: var(--font-mono); font-size: 9px; font-weight: 800; color: var(--text-tertiary); letter-spacing: 1px; margin-bottom: 8px">PENGUKURAN TEKNIS</div>
        <div style="position: relative">
          <input type="number" step="0.1" value="${val}" class="form-input" placeholder="0.0"
                 onchange="window._onFieldChange('${item.kode}', 'nilai', this.value)"
                 style="background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.05); border-radius: 12px; color: white; font-weight: 900; font-size: 1.1rem; padding-right: 60px">
          <span style="position: absolute; right: 16px; top: 50%; transform: translateY(-50%); font-weight: 800; color: var(--brand-400); font-size: 0.8rem">${item.unit || ''}</span>
        </div>
      `;

    case 'radio':
      const options = item.options || [];
      return `
        <div style="font-family: var(--font-mono); font-size: 9px; font-weight: 800; color: var(--text-tertiary); letter-spacing: 1px; margin-bottom: 8px">KATEGORI</div>
        <select class="form-select" onchange="window._onFieldChange('${item.kode}', 'status', this.value)"
                style="height: 42px; border-radius: 12px; background: rgba(255,255,255,0.9); color: #0f172a; font-weight: 800; font-size: 0.85rem">
           <option value="">-- PILIH --</option>
           ${options.map(o => `<option value="${o}" ${val === o ? 'selected' : ''} style="color:#0f172a">${o.toUpperCase()}</option>`).join('')}
        </select>
      `;

    default:
      return `
        <div style="font-family: var(--font-mono); font-size: 9px; font-weight: 800; color: var(--text-tertiary); letter-spacing: 1px; margin-bottom: 8px">DATA TEKNIS</div>
        <input type="text" value="${val}" class="form-input" placeholder="Ketik keterangan..."
               onchange="window._onFieldChange('${item.kode}', 'status', this.value)"
               style="background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.05); border-radius: 12px; color: white; font-size: 0.85rem">
      `;
  }
}

