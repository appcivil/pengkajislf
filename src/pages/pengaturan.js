/**
 * PENGATURAN (SETTINGS) PAGE
 * PRESIDENTIAL CLASS (QUARTZ PREMIUM)
 * Executive Control Center for System Configuration
 */
import { getSettings, saveSettings } from '../lib/settings.js';
import { updateProfile } from '../lib/team-service.js';
import { getUserInfo } from '../lib/auth.js';
import { showSuccess, showError, showInfo } from '../components/toast.js';
import { MODELS as AI_MODELS } from '../lib/ai-router.js';
import { fetchLocalModels } from '../lib/ollama-service.js';

export async function pengaturanPage() {
  const settings = await getSettings();
  const user = getUserInfo();
  
  return `
    <div id="settings-page" style="animation: page-fade-in 0.8s ease-out">
      
      <!-- Presidential Header -->
      <div class="page-header" style="margin-bottom:var(--space-8)">
        <div class="flex-between flex-stack" style="gap:var(--space-4)">
          <div>
            <h1 class="page-title" style="font-family:'Outfit', sans-serif; font-weight:800; font-size: 2.2rem; letter-spacing:-0.02em; margin-bottom:4px">
              System <span class="text-gradient-gold">Infrastructure</span>
            </h1>
            <p class="page-subtitle" style="font-family:var(--font-mono); font-size: 0.7rem; letter-spacing:1px; opacity:0.6; text-transform:uppercase">
              EXECUTIVE COMMAND & REGISTRY CONTROL
            </p>
          </div>
          <div style="background:hsla(220, 20%, 100%, 0.03); padding:10px 20px; border-radius:12px; border:1px solid hsla(220, 20%, 100%, 0.05); display:flex; align-items:center; gap:12px; height:fit-content">
             <div class="animate-pulse" style="width:8px; height:8px; border-radius:50%; background:var(--success-500)"></div>
             <div style="font-family:var(--font-mono); font-size:10px; font-weight:800; color:var(--text-tertiary); letter-spacing:1px">CORE NODE: ONLINE</div>
          </div>
        </div>

        <!-- Presidential Tab Navigation -->
        <div class="card-quartz" style="padding: 6px; margin-top: 32px; display: flex; gap: 8px; background: hsla(224, 25%, 4%, 0.6); flex-wrap: wrap">
          <button onclick="window.switchTab('tab-akun', this)" 
                  class="tab-item active"
                  style="flex:1; min-width:160px; height:44px; border:none; border-radius:10px; cursor:pointer; font-family:var(--font-mono); font-size:10px; font-weight:800; letter-spacing:1px; display:flex; align-items:center; justify-content:center; gap:12px; transition:all 0.3s; background:var(--gradient-brand); color:white; box-shadow:var(--shadow-sapphire)">
            <i class="fas fa-user-shield"></i> IDENTITY & ACCESS
          </button>
          <button onclick="window.switchTab('tab-aplikasi', this)" 
                  class="tab-item"
                  style="flex:1; min-width:160px; height:44px; border:none; border-radius:10px; cursor:pointer; font-family:var(--font-mono); font-size:10px; font-weight:800; letter-spacing:1px; display:flex; align-items:center; justify-content:center; gap:12px; transition:all 0.3s; color:var(--text-tertiary)">
            <i class="fas fa-microchip"></i> ENGINE & INTEGRATION
          </button>
          <button onclick="window.switchTab('tab-watermark', this)" 
                  class="tab-item"
                  style="flex:1; min-width:140px; height:44px; border:none; border-radius:10px; cursor:pointer; font-family:var(--font-mono); font-size:10px; font-weight:800; letter-spacing:1px; display:flex; align-items:center; justify-content:center; gap:12px; transition:all 0.3s; color:var(--text-tertiary)">
            <i class="fas fa-camera-retro"></i> FIELD CALIBRATION
          </button>
          <button onclick="window.switchTab('tab-template', this)" 
                  class="tab-item"
                  style="flex:1; min-width:140px; height:44px; border:none; border-radius:10px; cursor:pointer; font-family:var(--font-mono); font-size:10px; font-weight:800; letter-spacing:1px; display:flex; align-items:center; justify-content:center; gap:12px; transition:all 0.3s; color:var(--text-tertiary)">
            <i class="fas fa-file-word"></i> REPORT FORMAT
          </button>
        </div>
      </div>

      <!-- TAB CONTENT: AKUN -->
      <div id="tab-akun" class="tab-content active route-fade">
        <div class="grid-main-side">
          
          <div class="card-quartz" style="padding:40px">
            <div class="flex-between flex-stack" style="align-items:flex-start; gap:32px; margin-bottom:48px">
              <div style="position:relative; flex-shrink:0">
                <div style="width:120px; height:120px; border-radius:24px; background:var(--gradient-brand); border:2px solid hsla(220, 95%, 52%, 0.3); display:flex; align-items:center; justify-content:center; font-family:'Outfit', sans-serif; font-weight:800; font-size:3rem; color:white; box-shadow:var(--shadow-sapphire)">
                  ${user?.initials || 'U'}
                </div>
                <div style="position:absolute; -right:10px; -bottom:10px; width:44px; height:44px; background:var(--gold-500); border-radius:50%; border:4px solid #020408; display:flex; align-items:center; justify-content:center; color:#020408; font-size:1rem; box-shadow:0 0 20px hsla(45, 90%, 60%, 0.4)">
                  <i class="fas fa-check-double"></i>
                </div>
              </div>
              <div style="padding-top:12px">
                <h3 style="font-family:'Outfit', sans-serif; font-weight:800; font-size:1.6rem; color:white; margin-bottom:4px">${user?.name || 'Authorized Personnel'}</h3>
                <div style="display:flex; align-items:center; gap:12px; margin-bottom:12px">
                   <span class="badge" style="background:hsla(45, 90%, 60%, 0.1); color:var(--gold-400); border:1px solid hsla(45, 90%, 60%, 0.2); font-weight:800; letter-spacing:1px; font-size:9px"><i class="fas fa-crown" style="margin-right:6px"></i> ${user?.role || 'PENGKAJI UTAMA'}</span>
                   <span style="font-family:var(--font-mono); font-size:9px; color:var(--text-tertiary); letter-spacing:1px">ID: REG-${(user?.id || '001').substring(0,8).toUpperCase()}</span>
                </div>
                <p style="font-size:0.85rem; color:var(--text-tertiary); line-height:1.6">Technical Director with high-level clearance for structural integrity auditing and neural synthesis protocols.</p>
              </div>
            </div>

            <div style="display:grid; grid-template-columns: 1fr; gap:24px">
               <div class="form-group">
                 <label style="font-family:var(--font-mono); font-size:9px; font-weight:800; color:var(--text-tertiary); text-transform:uppercase; letter-spacing:2px; display:block; margin-bottom:12px">FULL DISCLOSURE NAME</label>
                 <div style="display:flex; gap:12px">
                   <input type="text" id="my-profile-name" class="form-input" value="${user?.name || ''}" style="background:hsla(220, 20%, 100%, 0.02); border-color:hsla(220, 20%, 100%, 0.1); color:white; font-weight:700; flex:1">
                   <button type="button" onclick="window.handleUpdateMyProfile(this)" class="btn btn-primary" style="height:48px; border-radius:12px; padding:0 24px; font-size:0.7rem; font-weight:800; background:var(--gradient-brand); border:none">
                     <i class="fas fa-id-card-clip" style="margin-right:10px"></i> UPDATE IDENTITY
                   </button>
                 </div>
               </div>
               <div class="form-group">
                 <label style="font-family:var(--font-mono); font-size:9px; font-weight:800; color:var(--text-tertiary); text-transform:uppercase; letter-spacing:2px; display:block; margin-bottom:12px">ENCRYPTED EMAIL ALIAS</label>
                 <input type="email" class="form-input" value="${user?.email || ''}" readonly style="background:hsla(220, 20%, 100%, 0.02); border-color:hsla(220, 20%, 100%, 0.05); color:hsla(220, 20%, 100%, 0.4); font-weight:700">
               </div>
            </div>
          </div>

          <div style="display:flex; flex-direction:column; gap:32px">
             <div class="card-quartz" style="padding:32px; border-color:hsla(45, 90%, 60%, 0.1)">
                <div style="font-family:'Outfit', sans-serif; font-weight:800; font-size:1.1rem; color:white; margin-bottom:16px; display:flex; align-items:center; gap:12px">
                   <i class="fas fa-shield-halved" style="color:var(--gold-400)"></i> Security Protocol
                </div>
                <p style="font-size:0.8rem; color:var(--text-tertiary); margin-bottom:24px; line-height:1.6">Your account is secured with 256-bit encryption. Multi-factor authentication is active for all document sealing operations.</p>
                <button class="btn btn-outline" style="width:100%; height:44px; border-radius:12px; font-weight:700; color:white; border-color:hsla(220, 20%, 100%, 0.1)">
                  <i class="fas fa-key" style="margin-right:10px"></i> REGENERATE ACCESS KEY
                </button>
             </div>
             
             <div class="card-quartz" style="padding:32px">
                <div style="font-family:'Outfit', sans-serif; font-weight:800; font-size:1.1rem; color:white; margin-bottom:16px; display:flex; align-items:center; gap:12px">
                   <i class="fas fa-timeline" style="color:var(--brand-400)"></i> Last Activity
                </div>
                <div style="display:flex; flex-direction:column; gap:16px">
                   ${['Checklist update on Hotel Quartz', 'AI Synthesis for Building B', 'Executive Report Exported'].map(log => `
                     <div style="display:flex; align-items:center; gap:12px; font-size:0.75rem; color:var(--text-tertiary)">
                        <div style="width:6px; height:6px; border-radius:50%; background:var(--brand-500)"></div>
                        ${log}
                     </div>
                   `).join('')}
                </div>
             </div>
          </div>

        </div>
      </div>

      <!-- TAB CONTENT: APLIKASI -->
      <div id="tab-aplikasi" class="tab-content route-fade" style="display:none">
        <form id="settings-form" onsubmit="handleSaveSettings(event)">
          <div class="grid-main-side">
            
            <div style="display:flex; flex-direction:column; gap: 32px">
              <!-- Consultant Identity Card -->
              <div class="card-quartz" style="padding:32px">
                <div style="font-family:'Outfit', sans-serif; font-weight:800; font-size:1.2rem; color:white; margin-bottom:24px; display:flex; align-items:center; gap:12px">
                   <i class="fas fa-building" style="color:var(--brand-400)"></i> Official Consultant Registry
                </div>
                <div class="form-group mb-6">
                  <label class="form-label">CORPORATE ENTITY NAME</label>
                  <input type="text" class="form-input" name="consultant_name" value="${settings.consultant?.name || ''}" placeholder="e.g. PT Guna Bina Audit" required>
                </div>
                <div class="form-group mb-6">
                  <label class="form-label">HEADQUARTER ADDRESS</label>
                  <textarea class="form-input" name="consultant_address" rows="2" placeholder="Full legal office address...">${settings.consultant?.address || ''}</textarea>
                </div>
                <div class="form-group mb-6">
                  <label class="form-label">REGULATORY HEADER (PLAINTEXT)</label>
                  <textarea class="form-input font-mono text-xs" name="consultant_kop_text" rows="3" placeholder="Contoh: DINAS PEKERJAAN UMUM DAN PENATAAN RUANG...">${settings.consultant?.kop_text || ''}</textarea>
                </div>
                
                <div class="grid-2-col">
                  <div class="form-group">
                    <label class="form-label">DIRECTOR IN CHARGE</label>
                    <input type="text" class="form-input" name="director_name" value="${settings.consultant?.director_name || ''}" placeholder="Full Name & Title">
                  </div>
                  <div class="form-group">
                    <label class="form-label">EXECUTIVE TITLE</label>
                    <input type="text" class="form-input" name="director_job" value="${settings.consultant?.director_job || 'Direktur Utama'}" placeholder="e.g. CEO / Director">
                  </div>
                </div>
                
                <div class="card-quartz" style="margin-top:24px; background:hsla(220, 95%, 52%, 0.03); border-color:hsla(220, 95%, 52%, 0.1)">
                   <label class="form-label" style="color:var(--brand-400)"><i class="fas fa-barcode"></i> DYNAMIC DOCUMENT NOMINATION</label>
                   <input type="text" class="form-input font-mono" name="nomor_surat_format" value="${settings.consultant?.nomor_surat_format || '[SEQ]/SP-SLF/[ROMAN_MONTH]/[YEAR]'}" style="background:transparent">
                   <p style="font-family:var(--font-mono); font-size:8px; color:var(--text-tertiary); margin-top:8px; letter-spacing:1px">TAGS: [SEQ], [MONTH], [ROMAN_MONTH], [YEAR] &bull; AUTO-INCREMENTING MODULE</p>
                </div>
              </div>

              <!-- Assets & Branding -->
              <div class="card-quartz" style="padding:32px">
                <div style="font-family:'Outfit', sans-serif; font-weight:800; font-size:1.2rem; color:white; margin-bottom:24px; display:flex; align-items:center; gap:12px">
                   <i class="fas fa-signature" style="color:var(--brand-400)"></i> Branding & Digital Assets
                </div>
                
                <div class="form-group mb-8">
                  <label class="form-label">LETTERHEAD HEADER (DPI OPTIMIZED)</label>
                  <div id="kop-preview-container" class="card-quartz" style="height:120px; display:flex; align-items:center; justify-content:center; background:hsla(220, 20%, 100%, 0.02); padding:10px">
                    ${settings.consultant?.kop_image ? `<img src="${settings.consultant.kop_image}" style="max-height:100%; max-width:100%; object-fit:contain">` : '<i class="fas fa-image" style="font-size:2rem; opacity:0.1"></i>'}
                  </div>
                  <input type="file" accept="image/*" onchange="window.handleKopUpload(this)" class="mt-4 text-xs" style="color:var(--text-tertiary)">
                  <input type="hidden" name="consultant_kop_image" id="consultant-kop-val" value="${settings.consultant?.kop_image || ''}">
                </div>

                <div class="grid-3-col">
                  <div class="form-group">
                    <label class="form-label">OFFICIAL LOGO</label>
                    <div id="logo-preview-container" class="card-quartz" style="height:100px; display:flex; align-items:center; justify-content:center; background:hsla(220, 20%, 100%, 0.02); padding:10px">
                      ${settings.consultant?.logo ? `<img src="${settings.consultant.logo}" style="max-height:100%; max-width:100%; object-fit:contain">` : '<i class="fas fa-image" style="opacity:0.1"></i>'}
                    </div>
                    <input type="file" accept="image/*" onchange="window.handleLogoUpload(this)" class="mt-2 text-xs" style="width:100%">
                    <input type="hidden" name="consultant_logo" id="consultant-logo-val" value="${settings.consultant?.logo || ''}">
                  </div>
                  <div class="form-group">
                    <label class="form-label">CORPORATE SEAL</label>
                    <div id="stamp-preview-container" class="card-quartz" style="height:100px; display:flex; align-items:center; justify-content:center; background:hsla(220, 20%, 100%, 0.02); padding:10px">
                      ${settings.consultant?.stamp ? `<img src="${settings.consultant.stamp}" style="max-height:100%; max-width:100%; object-fit:contain">` : '<i class="fas fa-stamp" style="opacity:0.1"></i>'}
                    </div>
                    <input type="file" accept="image/*" onchange="window.handleStampUpload(this)" class="mt-2 text-xs" style="width:100%">
                    <input type="hidden" name="consultant_stamp" id="consultant-stamp-val" value="${settings.consultant?.stamp || ''}">
                  </div>
                  <div class="form-group">
                    <label class="form-label">DIRECTOR SIG</label>
                    <div id="sig-preview-container" class="card-quartz" style="height:100px; display:flex; align-items:center; justify-content:center; background:hsla(220, 20%, 100%, 0.02); padding:10px">
                      ${settings.consultant?.signature ? `<img src="${settings.consultant.signature}" style="max-height:100%; max-width:100%; object-fit:contain">` : '<i class="fas fa-signature" style="opacity:0.1"></i>'}
                    </div>
                    <input type="file" accept="image/*" onchange="window.handleSigUpload(this)" class="mt-2 text-xs" style="width:100%">
                    <input type="hidden" name="consultant_sig" id="consultant-sig-val" value="${settings.consultant?.signature || ''}">
                  </div>
                </div>
              </div>
            </div>

            <div style="display:flex; flex-direction:column; gap: 32px">
              <!-- Engine Connectivity -->
                <div class="form-group mb-10">
                  <label class="form-label">QUANTUM REASONING MODEL (CLOUD)</label>
                  <select class="form-select" name="default_model" style="height:48px; border-radius:12px">
                    ${Object.values(AI_MODELS).map(m => `<option value="${m.id}" ${settings.ai?.defaultModel === m.id ? 'selected' : ''}>${m.name.toUpperCase()}</option>`).join('')}
                  </select>
                </div>

                <!-- NEW: LOCAL NEURAL NODE (OLLAMA) -->
                <div class="card-quartz" style="padding:24px; background:hsla(160, 100%, 50%, 0.02); border-color:hsla(160, 100%, 50%, 0.1); margin-top:24px">
                  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px">
                    <div style="font-family:'Outfit', sans-serif; font-weight:800; font-size:1rem; color:white; display:flex; align-items:center; gap:10px">
                       <i class="fas fa-microchip" style="color:var(--success-400)"></i> LOCAL NEURAL NODE (OLLAMA)
                    </div>
                    <div style="display:flex; align-items:center; gap:8px">
                      <span style="font-family:var(--font-mono); font-size:9px; font-weight:800; color:var(--text-tertiary)">ENABLED</span>
                      <input type="checkbox" name="ollama_enabled" ${settings.ai?.ollamaEnabled ? 'checked' : ''} style="width:16px; height:16px; accent-color:var(--success-500)">
                    </div>
                  </div>

                  <div class="form-group mb-6">
                    <label class="form-label">ENDPOINT URL</label>
                    <div style="display:flex; gap:12px">
                      <input type="text" class="form-input font-mono text-xs" name="ollama_endpoint" value="${settings.ai?.ollamaEndpoint || 'http://localhost:11434'}" placeholder="e.g. http://localhost:11434" style="flex:1">
                      <button type="button" onclick="window.syncOllamaModels(this)" class="btn btn-ghost" style="height:40px; border-radius:10px; border:1px solid hsla(220, 20%, 100%, 0.1); padding:0 16px; font-size:0.7rem; font-weight:800">
                        <i class="fas fa-sync-alt" style="margin-right:8px"></i> SCAN MODELS
                      </button>
                    </div>
                  </div>

                  <div class="form-group">
                    <label class="form-label">LOCAL MODEL PRIORITY</label>
                    <select class="form-select" name="ollama_model" id="ollama-model-select" style="height:48px; border-radius:12px">
                      <option value="">-- PILIH MODEL (KLIK SCAN) --</option>
                      ${(settings.ai?.availableLocalModels || []).map(m => `
                        <option value="${m}" ${settings.ai?.ollamaModel === m ? 'selected' : ''}>${m.toUpperCase()}</option>
                      `).join('')}
                    </select>
                    <p style="font-family:var(--font-mono); font-size:8px; color:var(--text-tertiary); margin-top:12px; line-height:1.4">
                      PRO-TIP: ATUR <code style="color:var(--brand-400)">OLLAMA_ORIGINS="*"</code> PADA SERVER OLLAMA UNTUK MENGIZINKAN AKSES BROWSER. DEFAULT: <span style="color:var(--success-400)">GEMMA3:27B</span>
                    </p>
                  </div>
                </div>
              </div>

              <!-- SIMBG Global Governance -->
              <div class="card-quartz" style="padding:32px; border-color:var(--brand-400)">
                 <div style="font-family:'Outfit', sans-serif; font-weight:800; font-size:1.2rem; color:white; margin-bottom:24px; display:flex; align-items:center; gap:12px">
                    <i class="fas fa-landmark-dome" style="color:var(--brand-400)"></i> SIMBG Global Governance
                 </div>
                 <div class="form-group mb-6">
                   <label class="form-label">MASTER BRIDGE ENDPOINT</label>
                   <input type="text" class="form-input font-mono text-xs" name="simbg_bridge_url" value="${settings.simbg?.bridgeUrl || 'https://simbg.pu.go.id/auth/login'}" placeholder="Portal URL...">
                 </div>
                 <div class="form-group">
                   <label class="form-label">AUTO-SYNC BEHAVIOR</label>
                   <select class="form-select" name="simbg_sync_mode" style="height:48px; border-radius:12px">
                      <option value="manual" ${settings.simbg?.syncMode === 'manual' ? 'selected' : ''}>MANUAL OVERRIDE ONLY</option>
                      <option value="daily" ${settings.simbg?.syncMode === 'daily' ? 'selected' : ''}>SCHEDULED DAILY PULSE</option>
                   </select>
                 </div>
              </div>

              <!-- Technical Expert Pillars -->
              <div class="card-quartz" style="padding:32px; border-color: hsla(220, 95%, 52%, 0.1)">
                <div style="font-family:'Outfit', sans-serif; font-weight:800; font-size:1.2rem; color:white; margin-bottom:24px; display:flex; align-items:center; gap:12px">
                   <i class="fas fa-user-shield" style="color:var(--brand-400)"></i> Technical Expert Pillars (TTE)
                </div>
                
                ${[
                  { id: 'arch', label: 'ARCHITECTURE & ZONING', color: 'var(--brand-400)', expert: settings.experts?.architecture },
                  { id: 'struct', label: 'STRUCTURAL INTEGRITY',  color: 'var(--danger-400)', expert: settings.experts?.structure },
                  { id: 'mep', label: 'MEP & FIRE SYSTEMS',     color: 'var(--gold-400)', expert: settings.experts?.mep }
                ].map(p => `
                  <div style="margin-bottom:24px; padding:20px; background:hsla(220, 20%, 100%, 0.02); border:1px solid hsla(220, 20%, 100%, 0.05); border-radius:16px">
                    <div style="font-family:var(--font-mono); font-size:9px; font-weight:800; color:${p.color}; letter-spacing:1.5px; margin-bottom:16px">${p.label}</div>
                    <div class="grid-2-col" style="margin-bottom:16px">
                      <input type="text" class="form-input text-xs" name="exp_${p.id}_name" value="${p.expert?.name || ''}" placeholder="Name & Legal Title" style="background:transparent">
                      <input type="text" class="form-input text-xs" name="exp_${p.id}_skk" value="${p.expert?.skk || ''}" placeholder="Certificate No. (SKK)" style="background:transparent">
                    </div>
                    <div class="grid-2-col">
                      <div>
                        <label style="font-size:0.65rem; color:var(--text-tertiary); text-transform:uppercase; font-weight:700">Digital ID (Signature)</label>
                        <input type="file" onchange="window.handleExpertSigUpload(this, '${p.id}')" class="text-xs mt-2" style="width:100%; color:var(--text-tertiary)">
                        <input type="hidden" name="exp_${p.id}_sig" id="exp-${p.id}-sig-val" value="${p.expert?.signature || ''}">
                      </div>
                      <div>
                        <label style="font-size:0.65rem; color:var(--text-tertiary); text-transform:uppercase; font-weight:700">QR Registry Key</label>
                        <input type="file" onchange="window.handleExpertQrUpload(this, '${p.id}')" class="text-xs mt-2" style="width:100%; color:var(--text-tertiary)">
                        <input type="hidden" name="exp_${p.id}_qr" id="exp-${p.id}-qr-val" value="${p.expert?.qr_code || ''}">
                      </div>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>

          <div style="margin-top:48px; display:flex; justify-content:flex-end">
            <button type="submit" class="btn-presidential gold" id="btn-save-settings" style="height:56px; padding:0 48px; font-size:1rem; border-radius:14px">
              <i class="fas fa-shield-check" style="margin-right:12px"></i> SEAL GLOBAL CONFIGURATION
            </button>
          </div>
        </form>
      </div>

      <!-- TAB CONTENT: WATERMARK -->
      <div id="tab-watermark" class="tab-content route-fade" style="display:none">
        <form id="watermark-form" onsubmit="handleSaveWatermark(event)">
          <div class="grid-main-side" style="gap: 40px">
            <div class="card-quartz" style="padding:40px">
              <div style="font-family:'Outfit', sans-serif; font-weight:800; font-size:1.4rem; color:white; margin-bottom:32px; display:flex; align-items:center; gap:16px">
                 <i class="fas fa-print" style="color:var(--brand-400)"></i> Field Authentication Watermark
              </div>
              <div class="form-group mb-8">
                <label class="form-label">IDENTITY STRING (PLAINTEXT)</label>
                <input type="text" class="form-input" name="wm_company_name" value="${settings.watermark?.company_name || ''}" placeholder="e.g. SMART AI PENGKAJI SLF">
              </div>
              <div class="form-group mb-8">
                <label class="form-label">VERIFICATION BADGE LABEL</label>
                <input type="text" class="form-input" name="wm_verified_label" value="${settings.watermark?.verified_label || ''}" placeholder="e.g. ELECTRONICALLY VERIFIED">
              </div>
              
              <div class="form-group mb-8">
                <label class="form-label">CALIBRATION LOGO (TRANSPARENT PNG)</label>
                <div id="wm-logo-preview-container" class="card-quartz" style="height:120px; display:flex; align-items:center; justify-content:center; background:hsla(220, 20%, 100%, 0.02)">
                  ${settings.watermark?.company_logo ? `<img src="${settings.watermark.company_logo}" style="max-height:100%; object-fit:contain">` : '<i class="fas fa-image" style="opacity:0.1; font-size:2rem"></i>'}
                </div>
                <input type="file" accept="image/*" onchange="window.handleWmLogoUpload(this)" class="mt-4 text-xs" style="color:var(--text-tertiary)">
                <input type="hidden" name="wm_company_logo" id="wm-company-logo-val" value="${settings.watermark?.company_logo || ''}">
              </div>
              
              <div class="form-group">
                <label class="form-label">DYNAMIC METADATA OVERRIDE</label>
                <textarea class="form-input font-mono text-xs" name="wm_custom_tags" rows="4" placeholder="Method: Visual Audit&#10;Equipment: Thermal Drone">${settings.watermark?.custom_tags || ''}</textarea>
                <p style="font-family:var(--font-mono); font-size:8px; color:var(--text-tertiary); margin-top:8px; letter-spacing:1px">ADD ONE DATA TAG PER LINE</p>
              </div>
            </div>

            <div style="display:flex; flex-direction:column; gap:32px">
              <div class="card-quartz" style="padding:40px">
                <div style="font-family:'Outfit', sans-serif; font-weight:800; font-size:1.2rem; color:white; margin-bottom:32px">System Calibration</div>
                
                <div style="display:flex; flex-direction:column; gap:20px">
                   ${[
                     { name: 'wm_enabled', label: 'ACTIVATE NEURAL WATERMARK', checked: settings.watermark?.enabled },
                     { name: 'wm_show_gps', label: 'APPEND GEOSPATIAL COORDINATES', checked: settings.watermark?.show_gps },
                     { name: 'wm_show_time', label: 'INJECT ATOMIC TIMESTAMP', checked: settings.watermark?.show_time }
                   ].map(opt => `
                     <div style="display:flex; justify-content:space-between; align-items:center; padding:16px 20px; background:hsla(220, 20%, 100%, 0.02); border:1px solid hsla(220, 20%, 100%, 0.05); border-radius:12px">
                        <label style="font-family:var(--font-mono); font-size:0.7rem; font-weight:800; color:white">${opt.label}</label>
                        <input type="checkbox" name="${opt.name}" ${opt.checked ? 'checked' : ''} style="width:20px; height:20px; accent-color:var(--brand-500)">
                     </div>
                   `).join('')}
                </div>
                
                <div class="form-group mt-10">
                  <label class="form-label">LENS FIDELITY & RENDER OPACITY</label>
                  <div style="display:flex; gap:16px">
                    <select class="form-select" name="wm_resolution" style="flex:1">
                      <option value="low" ${settings.watermark?.resolution === 'low' ? 'selected' : ''}>STANDARD (FAST)</option>
                      <option value="medium" ${settings.watermark?.resolution === 'medium' ? 'selected' : ''}>HIGH DEFINITION</option>
                      <option value="high" ${settings.watermark?.resolution === 'high' ? 'selected' : ''}>FORENSIC GRADE</option>
                    </select>
                    <input type="range" name="wm_opacity" min="0.1" max="1.0" step="0.1" value="${settings.watermark?.opacity || 0.85}" style="flex:1; accent-color:var(--brand-500)">
                  </div>
                </div>
              </div>

              <div class="card-quartz" style="padding:32px; background:hsla(220, 95%, 52%, 0.03); border:1px dashed hsla(220, 95%, 52%, 0.2)">
                 <div style="font-size:0.8rem; color:var(--brand-300); line-height:1.6; font-weight:600">
                    <i class="fas fa-microchip" style="margin-right:10px"></i> Calibration engine will process high-frequency image artifacts during final render. Ensure camera hardware is calibrated to local timezone.
                 </div>
              </div>
            </div>
          </div>
          
          <div style="margin-top:48px; display:flex; justify-content:flex-end">
            <button type="submit" class="btn-presidential gold" id="btn-save-watermark" style="height:56px; padding:0 48px; font-size:1rem; border-radius:14px">
              <i class="fas fa-check-double" style="margin-right:12px"></i> UPDATE CALIBRATION LOG
            </button>
          </div>
        </form>
      </div>

      <!-- TAB CONTENT: TEMPLATE DOCX -->
      <div id="tab-template" class="tab-content route-fade" style="display:none">
        <div class="grid-main-side">
          <div class="card-quartz" style="padding:40px">
            <div style="font-family:'Outfit', sans-serif; font-weight:800; font-size:1.4rem; color:white; margin-bottom:32px; display:flex; align-items:center; gap:16px">
               <i class="fas fa-file-word" style="color:var(--brand-400)"></i> Global Report Formatting (.docx)
            </div>
            
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:32px">
               <!-- Download Reference -->
               <div class="card-quartz" style="padding:32px; background:hsla(220, 20%, 100%, 0.02)">
                  <h4 style="color:white; font-size:1rem; margin-bottom:12px; font-weight:800">1. Reference Template</h4>
                  <p style="font-size:0.8rem; color:var(--text-tertiary); margin-bottom:24px; line-height:1.6">Download a template containing all available placeholders (Tags) that can be used in your document.</p>
                  <button type="button" onclick="window.downloadDocxReference()" class="btn btn-outline" style="width:100%; height:48px; border-radius:12px; font-weight:700; color:white; border-color:var(--brand-400)">
                    <i class="fas fa-download" style="margin-right:10px"></i> DOWNLOAD REFERENCE TAGS
                  </button>
               </div>

               <!-- Upload Custom -->
               <div class="card-quartz" style="padding:32px; background:hsla(220, 20%, 100%, 0.02)">
                  <h4 style="color:white; font-size:1rem; margin-bottom:12px; font-weight:800">2. Custom Template</h4>
                  <p style="font-size:0.8rem; color:var(--text-tertiary); margin-bottom:24px; line-height:1.6">Upload your corporate-branded .docx file. The system will auto-fill the tags upon exporting reports.</p>
                  
                  <div id="template-status" style="margin-bottom:16px">
                     <div class="badge" style="background:var(--text-tertiary); color:white; padding:8px 16px; border-radius:8px; font-size:10px">
                        <i class="fas fa-info-circle" style="margin-right:8px"></i> STANDAR SISTEM AKTIF
                     </div>
                  </div>

                  <div style="display:flex; flex-direction:column; gap:12px">
                    <input type="file" id="template-uploader" accept=".docx" onchange="window.handleTemplateUpload(this)" hidden>
                    <button type="button" onclick="document.getElementById('template-uploader').click()" class="btn-presidential gold" style="width:100%; height:48px; border-radius:12px; font-size:0.85rem">
                      <i class="fas fa-upload" style="margin-right:10px"></i> UPLOAD .DOCX TEMPLATE
                    </button>
                    <p style="font-family:var(--font-mono); font-size:8px; color:var(--text-tertiary); text-align:center">MAX SIZE: 20MB &bull; MUST BE VALID OPENXML DOCX</p>
                  </div>
               </div>
            </div>

            <div class="card-quartz" style="margin-top:40px; background:hsla(45, 90%, 60%, 0.03); border-color:hsla(45, 90%, 60%, 0.1)">
               <h4 style="color:var(--gold-400); font-size:0.9rem; font-weight:800; margin-bottom:16px"><i class="fas fa-triangle-exclamation"></i> Templating Rules</h4>
               <ul style="font-size:0.8rem; color:var(--text-tertiary); padding-left:20px; line-height:1.8">
                  <li>Use double curly braces for tags: <code style="color:var(--brand-400)">{{NAMA_BANGUNAN}}</code>, <code style="color:var(--brand-400)">{{ALAMAT}}</code>, etc.</li>
                  <li>For tables, use the looping syntax: <code style="color:var(--gold-400)">{#_checklistTeknis}</code> ... <code style="color:var(--gold-400)">{/_checklistTeknis}</code>.</li>
                  <li>Recommended fonts: Calibri or Arial for cross-platform compatibility.</li>
                  <li>Ensure your file is a pure <code style="color:white">.docx</code> (not .doc or .rtf).</li>
               </ul>
            </div>
          </div>

          <div style="display:flex; flex-direction:column; gap:32px">
             <div class="card-quartz" style="padding:32px; background:var(--gradient-dark)">
                <h4 style="color:white; font-size:1rem; margin-bottom:16px">Cloud Sync Status</h4>
                <div style="display:flex; align-items:center; gap:16px; margin-bottom:20px">
                   <div style="width:48px; height:48px; border-radius:12px; background:hsla(220, 95%, 52%, 0.1); display:flex; align-items:center; justify-content:center; color:var(--brand-400)">
                      <i class="fas fa-cloud-arrow-up" style="font-size:1.4rem"></i>
                   </div>
                   <div>
                      <div style="font-size:0.85rem; color:white; font-weight:700">Storage Synchronization</div>
                      <div style="font-size:0.7rem; color:var(--text-tertiary)">Templates are stored in Supabase Cluster.</div>
                   </div>
                </div>
                <button class="btn btn-ghost" style="width:100%; border:1px solid hsla(220, 20%, 100%, 0.1); border-radius:12px; color:white; font-size:0.75rem">
                   <i class="fas fa-trash-can" style="margin-right:10px"></i> RESET TO SYSTEM DEFAULT
                </button>
             </div>
          </div>
        </div>
      </div>

    </div>
  `;
}

// INTERACTIVITY: SHARED ACTIONS
window.switchTab = function(tabId, tabEl) {
  document.querySelectorAll('.tab-item').forEach(el => {
    el.classList.remove('active');
    el.style.background = 'transparent';
    el.style.color = 'var(--text-tertiary)';
    el.style.boxShadow = 'none';
  });
  document.querySelectorAll('.tab-content').forEach(el => el.style.display = 'none');
  
  tabEl.classList.add('active');
  tabEl.style.background = 'var(--gradient-brand)';
  tabEl.style.color = 'white';
  tabEl.style.boxShadow = 'var(--shadow-sapphire)';
  
  const content = document.getElementById(tabId);
  if (content) content.style.display = 'block';
};

/**
 * Handle Image Uploads to Base64
 */
function handleFileToHidden(input, containerId, hiddenId) {
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (containerId) {
        document.getElementById(containerId).innerHTML = `<img src="${e.target.result}" style="max-height:100%; max-width:100%; object-fit:contain">`;
      }
      document.getElementById(hiddenId).value = e.target.result;
    };
    reader.readAsDataURL(input.files[0]);
  }
}

window.handleKopUpload = (input) => handleFileToHidden(input, 'kop-preview-container', 'consultant-kop-val');
window.handleLogoUpload = (input) => handleFileToHidden(input, 'logo-preview-container', 'consultant-logo-val');
window.handleStampUpload = (input) => handleFileToHidden(input, 'stamp-preview-container', 'consultant-stamp-val');
window.handleSigUpload = (input) => handleFileToHidden(input, 'sig-preview-container', 'consultant-sig-val');
window.handleExpertSigUpload = (input, type) => handleFileToHidden(input, null, `exp-${type}-sig-val`);
window.handleExpertQrUpload = (input, type) => handleFileToHidden(input, null, `exp-${type}-qr-val`);
window.handleWmLogoUpload = (input) => handleFileToHidden(input, 'wm-logo-preview-container', 'wm-company-logo-val');

/**
 * Handle Template Upload
 */
window.handleTemplateUpload = async function(input) {
  if (!input.files || !input.files[0]) return;
  const file = input.files[0];
  
  if (!file.name.endsWith('.docx')) {
    showError('Hanya file .docx yang diizinkan sebagai template.');
    return;
  }

  showInfo('Uploading Template to Cloud...');
  
  try {
    // 1. Convert to base64 for now (Storage is better, but this is immediate)
    // In a production app, we would use supabase.storage.from('system-assets').upload()
    const reader = new FileReader();
    reader.onload = async (e) => {
        const base64 = e.target.result;
        const settings = await getSettings();
        if (!settings.report) settings.report = {};
        settings.report.customTemplateBase64 = base64;
        settings.report.customTemplateName = file.name;
        settings.report.customTemplateUrl = 'active'; // Flag
        
        await saveSettings(settings);
        showSuccess('Template berhasil diperbarui.');
        document.getElementById('template-status').innerHTML = `
          <div class="badge" style="background:var(--success-500); color:white; padding:8px 16px; border-radius:8px; font-size:10px">
            <i class="fas fa-check-circle" style="margin-right:8px"></i> SUCCESS: ${file.name.toUpperCase()}
          </div>
        `;
    };
    reader.readAsDataURL(file);
  } catch (err) {
    showError('Gagal mengunggah template: ' + err.message);
  }
};

/**
 * Handle Reference Download
 */
window.downloadDocxReference = async function() {
    showInfo('Generating Reference Tags...');
    try {
        const { generateReferenceTemplate } = await import('../lib/docx-service.js');
        await generateReferenceTemplate();
        showSuccess('Dokumen referensi berhasil diunduh.');
    } catch (err) {
        showError('Gagal membuat referensi: ' + err.message);
    }
};

/**
 * Handle Save Global Settings
 */
window.handleSaveSettings = async function(e) {
  e.preventDefault();
  const btn = document.getElementById('btn-save-settings');
  const fd = new FormData(e.target);
  
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> SEALING CONFIG...';

  try {
    const payload = {
      consultant: {
        name: fd.get('consultant_name'),
        address: fd.get('consultant_address'),
        logo: fd.get('consultant_logo'),
        stamp: fd.get('consultant_stamp'),
        kop_image: fd.get('consultant_kop_image'),
        kop_text: fd.get('consultant_kop_text'),
        signature: fd.get('consultant_sig'),
        director_name: fd.get('director_name'),
        director_job: fd.get('director_job'),
        nomor_surat_format: fd.get('nomor_surat_format'),
      },
      ai: { 
        defaultModel: fd.get('default_model'),
        ollamaEnabled: fd.get('ollama_enabled') === 'on',
        ollamaEndpoint: fd.get('ollama_endpoint'),
        ollamaModel: fd.get('ollama_model'),
        availableLocalModels: settings.ai?.availableLocalModels || []
      },
      experts: {
        architecture: { name: fd.get('exp_arch_name'), skk: fd.get('exp_arch_skk'), signature: fd.get('exp_arch_sig'), qr_code: fd.get('exp_arch_qr') },
        structure: { name: fd.get('exp_struct_name'), skk: fd.get('exp_struct_skk'), signature: fd.get('exp_struct_sig'), qr_code: fd.get('exp_struct_qr') },
        mep: { name: fd.get('exp_mep_name'), skk: fd.get('exp_mep_skk'), signature: fd.get('exp_mep_sig'), qr_code: fd.get('exp_mep_qr') },
      },
      google: { defaultDriveProxy: fd.get('default_drive_proxy') || '' },
      simbg: {
        bridgeUrl: fd.get('simbg_bridge_url'),
        syncMode: fd.get('simbg_sync_mode')
      }
    };
    await saveSettings(payload);
    showSuccess('Global Registry Updated Successfully.');
  } catch (err) {
    showError('Registry Update Failed: ' + err.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-shield-check" style="margin-right:12px"></i> SEAL GLOBAL CONFIGURATION';
  }
};

/**
 * Handle Save Watermark
 */
window.handleSaveWatermark = async function(e) {
  e.preventDefault();
  const btn = document.getElementById('btn-save-watermark');
  const fd = new FormData(e.target);
  
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> CALIBRATING...';

  try {
    const settings = await getSettings();
    settings.watermark = {
      enabled: fd.get('wm_enabled') === 'on',
      show_gps: fd.get('wm_show_gps') === 'on',
      show_time: fd.get('wm_show_time') === 'on',
      company_name: fd.get('wm_company_name'),
      verified_label: fd.get('wm_verified_label'),
      company_logo: fd.get('wm_company_logo'),
      resolution: fd.get('wm_resolution'),
      opacity: parseFloat(fd.get('wm_opacity')),
      custom_tags: fd.get('wm_custom_tags')
    };
    await saveSettings(settings);
    showSuccess('Field Calibration Log Updated.');
  } catch (err) {
    showError('Calibration Update Failed.');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-check-double" style="margin-right:12px"></i> UPDATE CALIBRATION LOG';
  }
};

/**
 * Handle Update User's own Profile Name
 */
window.handleUpdateMyProfile = async function(btn) {
  const nameInput = document.getElementById('my-profile-name');
  const newName = nameInput.value.trim();
  const user = getUserInfo();
  
  if (!user || !user.id) return;
  if (!newName) {
    showError('Name cannot be empty.');
    return;
  }

  const originalHtml = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> SEALING...';

  try {
    await updateProfile(user.id, { full_name: newName });
    showSuccess('Identity Profile Updated.');
    
    // Refresh to update UI globally (header, sidebar, etc)
    setTimeout(() => window.location.reload(), 1000);
  } catch (err) {
    showError('Update Failed: ' + err.message);
    btn.disabled = false;
    btn.innerHTML = originalHtml;
  }
};

/**
 * Sync Ollama Models dynamically
 */
window.syncOllamaModels = async function(btn) {
  const originalHtml = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> SCANNING...';
  
  try {
    const models = await fetchLocalModels();
    const select = document.getElementById('ollama-model-select');
    
    if (select) {
      select.innerHTML = models.map(m => `
        <option value="${m.name}">${m.name.toUpperCase()}</option>
      `).join('');
      
      // Auto-select gemma3:27b if it exists
      if (models.some(m => m.name === 'gemma3:27b')) {
        select.value = 'gemma3:27b';
      }
    }
    
    showSuccess(`Berhasil menarik ${models.length} model dari Ollama.`);
  } catch (err) {
    showError(err.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalHtml;
  }
};

function renderSkeleton() {
  return `<div class="card-quartz" style="height:200px; margin-bottom:40px"></div><div class="card-quartz" style="height:600px"></div>`;
}

function escHtml(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function formatTanggalwTime(d) {
  try { return new Date(d).toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}); } 
  catch { return String(d); } 
}
