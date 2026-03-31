/**
 * CHECKLIST COMPONENTS
 * Modular UI templates for Building Inspection Checklists.
 */
import { escHtml } from '../lib/utils.js';

/**
 * Main Checklist Shell (Header & Navigation)
 */
export function renderChecklistShell(proyek, checklist) {
  const adminDone = Object.values(checklist.dataMap).filter(i => i.kategori === 'administrasi' && i.status).length;
  const teknisDone = Object.values(checklist.dataMap).filter(i => i.kategori === 'teknis' && i.status).length;
  
  return `
    <div id="checklist-page" class="page-container">
      <div class="page-header" style="margin-bottom:var(--space-6)">
        <div class="flex-between">
          <div>
            <button class="btn btn-ghost btn-sm" onclick="window.navigate('proyek-detail',{id:'${proyek.id}'})" style="margin-bottom:8px">
              <i class="fas fa-arrow-left"></i> ${escHtml(proyek.nama_bangunan)}
            </button>
            <h1 class="page-title">Checklist Pemeriksaan SLF</h1>
            <p class="page-subtitle">Modul audit NSPK PUPR — Perubahan tersimpan otomatis</p>
          </div>
          <div class="flex gap-3" style="align-items:center">
            ${checklist.isSaving ? `<div class="text-xs text-brand-400 animate-pulse"><i class="fas fa-sync fa-spin"></i> Menyimpan...</div>` : ''}
            <div style="text-align:right">
              <div class="text-xs text-tertiary">Progres Audit</div>
              <div class="text-sm font-bold text-primary">${adminDone + teknisDone} / 70 Item</div>
            </div>
            <button class="btn btn-primary" onclick="window._saveChecklist()" id="btn-save-main">
              <i class="fas fa-save"></i> ${checklist.isSaving ? 'Saving...' : 'Simpan Semua'}
            </button>
          </div>
        </div>
      </div>
      
      <!-- AI Automation Banner (Quartz Recommendation) -->
      ${(adminDone + teknisDone) < 5 ? `
      <div class="ai-recommendation-card card" style="margin-bottom:var(--space-5); border: 1px solid var(--brand-200); background: linear-gradient(135deg, rgba(139, 92, 246, 0.05), rgba(139, 92, 246, 0.02));">
        <div class="flex-between">
          <div class="flex gap-4 items-center">
            <div class="ai-sparkle-icon" style="width:48px; height:48px; background:var(--brand-500); color:white; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:1.5rem; box-shadow:0 8px 16px rgba(139, 92, 246, 0.3)">
              <i class="fas fa-wand-magic-sparkles"></i>
            </div>
            <div>
              <div class="text-sm font-bold text-brand-700">AI Quick-Start Smart Sync</div>
              <div class="text-xs text-secondary mt-1">AI mendeteksi berkas proyek di Drive. Ingin draf checklist diisi otomatis lewat sinkronisasi smart-mapping?</div>
            </div>
          </div>
          <button class="btn btn-brand btn-sm" onclick="window._triggerGlobalAiSync()" style="padding:10px 20px">
            <i class="fas fa-bolt"></i> Mulai Sinkronisasi AI
          </button>
        </div>
      </div>
      ` : ''}

      <!-- Tab Navigation -->
      <div class="tab-bar card" style="margin-bottom:var(--space-5); padding:4px; background:var(--bg-elevated); border:1px solid var(--border-subtle)">
        <button class="tab-btn ${checklist.activeTab === 'admin' ? 'active' : ''}" onclick="window._switchTab('admin')">
          <i class="fas fa-clipboard-list"></i> Administrasi
        </button>
        <button class="tab-btn ${checklist.activeTab === 'teknis' ? 'active' : ''}" onclick="window._switchTab('teknis')">
          <i class="fas fa-building"></i> Teknis
        </button>
        <button class="tab-btn ${checklist.activeTab === 'kajian' ? 'active' : ''}" onclick="window._switchTab('kajian')">
          <i class="fas fa-file-signature"></i> Daftar Simak
        </button>
        <button class="tab-btn ${checklist.activeTab === 'files' ? 'active' : ''}" onclick="window._switchTab('files')">
          <i class="fas fa-folder-tree"></i> Berkas SIMBG
        </button>
      </div>

      <div id="checklist-content" class="tab-content active">
         <!-- Active Tab Content Injected Here -->
      </div>

      <!-- Live Camera Viewfinder Modal (Overlay) -->
      <div id="camera-modal" class="camera-modal" style="display:none">
        <div class="camera-overlay">
           <div class="camera-header">
              <div class="text-white font-bold"><i class="fas fa-video"></i> LIVE VIEW INSPEKSI</div>
              <button class="btn btn-icon btn-xs text-white" onclick="window._closeCamera()" style="background:rgba(255,255,255,0.1)">
                 <i class="fas fa-times"></i>
              </button>
           </div>
           
           <!-- Watermark Preview (Simulated) -->
           <div id="camera-wm-preview" class="camera-wm-preview"></div>
           
           <div class="camera-controls">
              <div class="flex gap-4">
                 <button class="btn btn-icon btn-lg" onclick="window._flipCamera()" style="background:rgba(255,255,255,0.2); border-radius:50%; width:50px; height:50px">
                    <i class="fas fa-sync"></i>
                 </button>
                 <button class="btn btn-capture" onclick="window._takePhoto()" id="btn-capture">
                    <div class="capture-inner"></div>
                 </button>
                 <div style="width:50px"></div> <!-- Spacer -->
              </div>
           </div>
        </div>
        <video id="camera-video" autoplay playsinline muted></video>
        <canvas id="camera-canvas" style="display:none"></canvas>
      </div>

      <style>
        .camera-modal {
          position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
          background: #000; z-index: 9999; display: flex; align-items: center; justify-content: center;
        }
        #camera-video { width: 100%; height: 100%; object-fit: cover; }
        .camera-overlay { 
          position: absolute; inset: 0; z-index: 10; 
          display: flex; flex-direction: column; justify-content: space-between;
          padding: 20px; pointer-events: none;
        }
        .camera-header { display: flex; justify-content: space-between; align-items: center; pointer-events: auto; }
        .camera-controls { 
          display: flex; flex-direction: column; align-items: center; 
          padding-bottom: 40px; pointer-events: auto;
        }
        .btn-capture {
          width: 80px; height: 80px; border-radius: 50%; background: #fff;
          display: flex; align-items: center; justify-content: center; padding: 0;
          border: 4px solid rgba(255,255,255,0.3); box-shadow: 0 0 20px rgba(0,0,0,0.5);
        }
        .btn-capture:active { transform: scale(0.9); }
        .capture-inner { width: 64px; height: 64px; border-radius: 50%; border: 2px solid #000; }
        
        .camera-wm-preview {
          position: absolute; bottom: 140px; left: 20px; right: 20px;
          min-height: 100px; display: flex; align-items: flex-end;
          transition: all 0.3s ease;
        }
        
        /* Lightbox for Preview */
        .lightbox-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.9); z-index: 10000;
          display: flex; align-items: center; justify-content: center; padding: 20px;
          cursor: zoom-out;
        }
        .lightbox-content { max-width: 95%; max-height: 90vh; border-radius: 12px; box-shadow: 0 0 40px rgba(0,0,0,0.8); }
      </style>
    </div>
  `;
}

/**
 * Admin & Teknis Table View
 */
export function renderChecklistTable(title, subtitle, items, dataMap, options, kategori) {
  return `
    <div class="card" style="padding:0; overflow:hidden; border:1px solid var(--border-subtle)">
      <div class="card-header flex-between" style="padding:var(--space-5); border-bottom:1px solid var(--border-subtle)">
        <div>
          <h2 class="card-title">${title}</h2>
          <p class="card-subtitle">${subtitle}</p>
        </div>
        <button class="btn btn-secondary btn-sm" onclick="window._runBatchSmartEngine('${kategori}')">
          <i class="fas fa-microchip"></i> 🚀 Jalankan Smart Engine
        </button>
      </div>
      <div style="overflow-x:auto">
        <table class="checklist-table">
          <thead>
            <tr>
              <th style="width:60px">Kode</th>
              <th>Item Pemeriksaan</th>
              <th style="width:220px">Status Kondisi</th>
              <th style="width:280px">Catatan & AI Vision</th>
            </tr>
          </thead>
          <tbody>
            ${items.map(item => {
              const entry = dataMap[item.kode] || {};
              return `
                <tr>
                  <td><span class="cl-kode">${item.kode}</span></td>
                  <td>
                    <div class="flex items-center gap-2" style="margin-bottom:8px">
                       <div class="font-bold text-sm">${escHtml(item.nama)}</div>
                       ${entry.metadata?.is_ai_draft ? `<span class="badge badge-brand" style="font-size:0.6rem; padding:2px 8px; border-radius:100px"><i class="fas fa-wand-magic-sparkles"></i> AI DRAFT</span>` : ''}
                    </div>
                    
                    <!-- Space for thumbnails (Previews) -->
                    ${(entry.foto_urls && entry.foto_urls.length > 0) ? `
                      <div class="cl-media-gallery" style="display:flex; gap:12px; overflow-x:auto; padding:8px 0; margin-bottom:8px">
                        ${entry.foto_urls.map(url => `
                          <div class="cl-media-thumb" onclick="window._showLightbox('${url}')" 
                               style="width:100px; height:100px; flex-shrink:0; border-radius:12px; background-image:url('${url}'); background-size:cover; background-position:center; cursor:pointer; border:2px solid var(--bg-300); transition:all 0.2s; box-shadow:var(--shadow-md);">
                          </div>
                        `).join('')}
                      </div>
                    ` : `
                      <div style="height:100px; width:100%; border:2px dashed var(--border-subtle); border-radius:12px; display:flex; align-items:center; justify-content:center; color:var(--text-tertiary); font-size:0.8rem; background:rgba(255,179,0,0.03); margin-bottom:8px">
                         <i class="fas fa-images" style="margin-right:10px; font-size:1.2rem"></i> Area Preview Lampiran
                      </div>
                    `}
                  </td>
                    <select class="form-select cl-status-select" 
                            id="cl-${item.kode}-status"
                            onchange="window._onFieldChange('${item.kode}', 'status', this.value)">
                      <option value="">— Pilih Status —</option>
                      ${options.map(o => `<option value="${o.value}" ${entry.status === o.value ? 'selected' : ''}>${o.label}</option>`).join('')}
                    </select>
                  </td>
          <td>
            <div style="position:relative">
               <textarea class="form-input cl-catatan" 
                         id="cl-${item.kode}-catatan" rows="2"
                         placeholder="Temuan Pemeriksaan..."
                         onchange="window._onFieldChange('${item.kode}', 'catatan', this.value)"
                         style="font-size:0.75rem; padding-right:30px; margin-bottom:6px">${escHtml(entry.catatan || '')}</textarea>
               <button class="btn btn-icon btn-xs ${entry.isRecording ? 'btn-danger animate-pulse' : ''}" 
                       id="btn-voice-${item.kode}"
                       style="position:absolute; top:6px; right:6px; width:28px; height:28px"
                       onclick="window._toggleVoiceNote('${item.kode}')" title="${entry.isRecording ? 'Berhenti Merekam' : 'Dikte Suara'}">
                  <i class="fas ${entry.isRecording ? 'fa-stop' : 'fa-microphone'}"></i>
               </button>
            </div>

            <!-- Tambahan: Rekomendasi & Waktu Penyelesaian -->
            <div class="cl-remedy-fields" style="background:var(--bg-100); padding:8px; border-radius:6px; margin-bottom:8px; border:1px solid var(--border-subtle)">
              <div class="text-xs font-bold mb-1" style="color:var(--brand-600)"><i class="fas fa-hammer"></i> Rekomendasi Perbaikan:</div>
              <textarea class="form-input" rows="1" 
                        placeholder="Apa yang harus diperbaiki?"
                        onchange="window._onFieldChange('${item.kode}', 'rekomendasi', this.value)"
                        style="font-size:0.7rem; padding:4px 8px">${escHtml(entry.rekomendasi || '')}</textarea>
              
              <div class="mt-2 flex-between">
                <div class="text-xs font-bold" style="color:var(--danger-600)"><i class="fas fa-calendar-check"></i> Target Waktu:</div>
                <input type="text" class="form-input" 
                       placeholder="Misal: 2 Minggu"
                       onchange="window._onFieldChange('${item.kode}', 'remedy_time', this.value)"
                       value="${escHtml(entry.remedy_time || '')}"
                       style="width:100px; font-size:0.7rem; padding:2px 6px">
              </div>
            </div>

            <div class="cl-evidence-toolbar" style="display:flex; gap:6px; justify-content:flex-end">
               <button class="btn btn-secondary btn-xs" onclick="window._fetchItemData('${item.kode}', '${item.nama}')" title="Ambil Data dari SIMBG/Master">
                 <i class="fas fa-sync-alt"></i> Ambil Data
               </button>
               <button class="btn btn-secondary btn-xs" onclick="document.getElementById('file-${item.kode}').click()" title="Pilih Dokumen/File">
                 <i class="fas fa-file-upload"></i> Pilih Berkas
               </button>
               <button class="btn btn-brand btn-xs" onclick="window._openLiveCamera('${item.kode}', '${item.nama}', '${kategori}')" title="Ambil Foto Langsung">
                 <i class="fas fa-camera"></i> Kamera
               </button>
               <input type="file" id="file-${item.kode}" multiple style="display:none" onchange="window._handleImageSelect(event, '${item.kode}', '${item.nama}', '${kategori}')">
               <input type="file" id="cam-${item.kode}" accept="image/*" capture="environment" style="display:none" onchange="window._handleCameraCapture(event, '${item.kode}', '${item.nama}', '${kategori}')">
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
    <div class="kajian-container" style="display:flex; flex-direction:column; gap:var(--space-5)">
       <div class="flex-between" style="margin-bottom:var(--space-3)">
          <h2 class="card-title"><i class="fas fa-tasks"></i> Daftar Simak Kajian Teknis SLF</h2>
          <button class="btn btn-secondary btn-sm" onclick="window._autoFillFromAgents()">
             <i class="fas fa-bolt"></i> Tarik Analisis Multi-Agent
          </button>
       </div>
       
       ${groups.map(grup => `
          <div class="grup-header" style="background:var(--bg-100); padding:var(--space-3); border-radius:8px; font-weight:800; border:1px solid var(--border-subtle)">
             <i class="fas fa-folder-tree" style="margin-right:8px; color:var(--brand-400)"></i> ${escHtml(grup.aspek)}
          </div>
          ${grup.items.map(item => {
             const entry = dataMap[item.kode] || {};
             return `
               <div class="kajian-block card" style="padding:0; overflow:hidden; border:2px solid var(--border-subtle)">
                  <div class="flex-between" style="background:var(--bg-elevated); padding:8px 15px; border-bottom:1px solid var(--border-subtle)">
                     <div class="font-bold text-sm">${item.kode}. ${escHtml(item.nama)}</div>
                     <div class="text-xs text-tertiary">REF: ${item.ref}</div>
                  </div>
                  <div class="grid-3" style="padding:var(--space-4); gap:var(--space-4)">
                     <div>
                        <div class="text-xs font-bold uppercase mb-2">Penilaian Visual</div>
                        <select class="form-select form-select-sm" 
                                onchange="window._onFieldChange('${item.kode}', 'status', this.value)">
                           <option value="baik" ${entry.status === 'baik' ? 'selected' : ''}>Baik / Sesuai</option>
                           <option value="rusak_ringan" ${entry.status === 'rusak_ringan' ? 'selected' : ''}>Rusak Ringan</option>
                           <option value="rusak_sedang" ${entry.status === 'rusak_sedang' ? 'selected' : ''}>Rusak Sedang</option>
                           <option value="rusak_berat" ${entry.status === 'rusak_berat' ? 'selected' : ''}>Rusak Berat</option>
                        </select>
                     </div>
                     <div>
                        <div class="text-xs font-bold uppercase mb-2">Pemeriksaan Gambar</div>
                        <div class="flex gap-3">
                           <label class="flex items-center gap-2 cursor-pointer">
                              <input type="radio" name="rad-${item.kode}" value="sesuai" 
                                     ${entry.metadata?.kesesuaian === 'sesuai' ? 'checked' : ''}
                                     onchange="window._onMetadataChange('${item.kode}', 'kesesuaian', 'sesuai')"> Sesuai
                           </label>
                           <label class="flex items-center gap-2 cursor-pointer">
                              <input type="radio" name="rad-${item.kode}" value="tidak" 
                                     ${entry.metadata?.kesesuaian === 'tidak' ? 'checked' : ''}
                                     onchange="window._onMetadataChange('${item.kode}', 'kesesuaian', 'tidak')"> Tidak
                           </label>
                        </div>
                     </div>
                     <div>
                        <div class="text-xs font-bold uppercase mb-2">Catatan Kelayakan</div>
                        <textarea class="form-input" rows="2" 
                                  onchange="window._onFieldChange('${item.kode}', 'catatan', this.value)"
                                  style="font-size:0.75rem">${escHtml(entry.catatan || '')}</textarea>
                     </div>
                  </div>
               </div>
             `;
          }).join('')}
       `).join('')}
    </div>
  `;
}
