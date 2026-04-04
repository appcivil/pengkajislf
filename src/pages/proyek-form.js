/**
 * PROYEK FORM PAGE
 * PRESIDENTIAL CLASS (QUARTZ PREMIUM)
 * High-End Asset Induction & Intelligence Framework
 */
import { supabase } from '../lib/supabase.js';
import { navigate } from '../lib/router.js';
import { getUserInfo } from '../lib/auth.js';
import { showSuccess, showError, showInfo } from '../components/toast.js';
import { fetchTeamMembers } from '../lib/team-service.js';
import { runOCRAnalysis } from '../lib/ai-router.js';
import { initializeProjectFolder } from '../lib/drive.js';
import { APP_CONFIG } from '../lib/config.js';

export async function proyekFormPage(params = {}) {
  const isEdit = !!params.id;
  let data = {};
  window._currentStep = 1;

  if (isEdit) {
    const { data: existing } = await supabase.from('proyek').select('*').eq('id', params.id).maybeSingle();
    data = existing || {};
  }

  const teamMembers = await fetchTeamMembers();
  const jenis = ['Bangunan Gedung', 'Hunian', 'Komersial', 'Industri', 'Pendidikan', 'Kesehatan', 'Ibadah', 'Pemerintahan', 'Campuran'];
  const konstruksi = ['Beton Bertulang', 'Baja', 'Kayu', 'Bata', 'Komposit'];

  // Map initialization delay
  setTimeout(() => window.initProyekMap && window.initProyekMap(data.latitude, data.longitude), 300);

  return `
    <div id="proyek-form-page" style="animation: page-fade-in 0.8s ease-out">
      
      <!-- Executive Header -->
      <div class="page-header" style="margin-bottom: 40px">
        <div class="flex-between flex-stack">
          <div>
            <button class="btn btn-ghost btn-xs" onclick="window.navigate('proyek')" style="margin-bottom:12px; padding:0; color:var(--brand-300); font-weight:700; letter-spacing:1px">
              <i class="fas fa-arrow-left" style="margin-right:8px"></i> BACK TO REGISTRY
            </button>
            <h1 class="page-title" style="font-family:'Outfit', sans-serif; font-weight:800; font-size: 2.2rem; letter-spacing:-0.02em; margin-bottom:4px">
              ${isEdit ? 'Asset <span class="text-gradient-gold">Modification</span>' : 'Asset <span class="text-gradient-gold">Induction</span>'}
            </h1>
            <p class="page-subtitle" style="font-family:var(--font-mono); font-size: 0.7rem; letter-spacing:1px; opacity:0.6; text-transform:uppercase">
              ${isEdit ? 'UPDATING ARCHITECTURAL CORE DATA' : 'INITIATING NEW GOVERNMENTAL COMPLIANCE AUDIT'}
            </p>
          </div>
          
          ${!isEdit ? `
            <button class="btn-presidential gold" onclick="window._triggerOCRScan()" style="height:48px; padding:0 24px; border-radius:14px; width:auto">
              <i class="fas fa-expand-arrows-alt" style="margin-right:12px"></i> AI OCR SCANNER
            </button>
          ` : ''}
        </div>

        <!-- Presidential Stepper -->
        <div class="card-quartz hide-mobile" style="padding: 12px; margin-top: 32px; display: flex; align-items: center; background: hsla(224, 25%, 4%, 0.6); position:relative; overflow:hidden">
           <div style="position:absolute; height:2px; background:hsla(220, 20%, 100%, 0.05); left:15%; right:15%; top:50%; transform:translateY(-50%); z-index:0"></div>
           <div id="stepper-fill" style="position:absolute; height:2px; background:var(--gradient-brand); left:15%; width:0%; top:50%; transform:translateY(-50%); z-index:1; transition:width 0.4s ease"></div>
           
           ${[
             { n: 1, label: 'CORE IDENTITY' },
             { n: 2, label: 'TECHNICAL PARAMETERS' },
             { n: 3, label: 'BENEFICIARY & CONSENSUS' }
           ].map(s => `
             <div class="step-item ${s.n === 1 ? 'active' : ''}" id="step-dot-${s.n}" style="flex:1; z-index:2; position:relative; text-align:center">
                <div class="step-circle" style="width:36px; height:36px; background:var(--bg-elevated); border:2px solid hsla(220, 20%, 100%, 0.1); border-radius:50%; margin:0 auto 8px; display:flex; align-items:center; justify-content:center; font-family:var(--font-mono); font-size:12px; font-weight:800; color:var(--text-tertiary); transition:all 0.3s">
                   ${s.n}
                </div>
                <div class="step-label" style="font-family:var(--font-mono); font-size:8px; font-weight:800; color:var(--text-tertiary); letter-spacing:1px">${s.label}</div>
             </div>
           `).join('')}
        </div>
      </div>

      <!-- AI LOADING OVERLAY (DPI OPTIMIZED) -->
      <div id="ai-loading-overlay" style="display:none; position:fixed; inset:0; background:hsla(224, 25%, 4%, 0.95); backdrop-filter:blur(20px); z-index:10000; align-items:center; justify-content:center; flex-direction:column; text-align:center">
         <div style="position:relative; margin-bottom:40px">
            <div class="animate-ping" style="position:absolute; inset:0; border:2px solid var(--brand-500); border-radius:50%; opacity:0.1"></div>
            <div style="width:100px; height:100px; background:var(--gradient-brand); border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:3rem; color:white; box-shadow:var(--shadow-sapphire)">
               <i class="fas fa-brain-circuit"></i>
            </div>
         </div>
         <h2 style="font-family:'Outfit', sans-serif; font-weight:800; font-size:2rem; color:white; margin-bottom:12px">NEURAL SCAN IN PROGRESS</h2>
         <p id="ai-status-msg" style="color:var(--brand-300); font-family:var(--font-mono); font-size:10px; letter-spacing:2px; max-width:400px; line-height:1.8">SYNTHESIZING IMB/PBG DATA INTO REGISTRY STRUCTURE...</p>
         <div style="width:320px; height:4px; background:hsla(220, 20%, 100%, 0.05); border-radius:10px; margin-top:32px; overflow:hidden">
            <div id="ai-progress-fill" style="width:0%; height:100%; background:var(--gradient-brand); border-radius:10px; transition:width 0.3s"></div>
         </div>
      </div>

      <input type="file" id="ocr-file-input" accept="image/*,application/pdf" style="display:none" onchange="window._handleOCRFile(event)" />

      <form id="proyek-form" onsubmit="window.submitProyek(event)">
        
        <!-- STEP 1: IDENTITY & GEOSPATIAL -->
        <div class="form-step-section active" id="step-1" style="display:block">
           <div class="grid-main-side">
              
              <div class="card-quartz" style="padding:var(--space-6) var(--space-8)">
                 <div style="font-family:'Outfit', sans-serif; font-weight:800; font-size:1.25rem; color:white; margin-bottom:32px; display:flex; align-items:center; gap:16px; text-align: left">
                    <i class="fas fa-landmark" style="color:var(--brand-400)"></i> I. Physical Identity
                 </div>
                 
                 <div class="form-group mb-8">
                    <label class="form-label" style="letter-spacing:1.5px">ASSET OFFICIAL NAME <span style="color:var(--danger-400)">*</span></label>
                    <input type="text" class="form-input" name="nama_bangunan" value="${data.nama_bangunan || ''}" placeholder="e.g. Quartz Executive Tower" required>
                 </div>
                 
                 <div style="display:grid; grid-template-columns: 1fr 1fr; gap:24px">
                    <div class="form-group mb-8">
                       <label class="form-label" style="letter-spacing:1.5px">FUNCTIONAL CLASS <span style="color:var(--danger-400)">*</span></label>
                       <select class="form-select" name="jenis_bangunan" required>
                          <option value="">-- SELECT CLASSIFICATION --</option>
                          ${jenis.map(j => `<option value="${j}" ${data.jenis_bangunan === j ? 'selected' : ''}>${j.toUpperCase()}</option>`).join('')}
                       </select>
                    </div>
                    <div class="form-group mb-8">
                       <label class="form-label" style="letter-spacing:1.5px">CORE CONSTRUCTION</label>
                       <select class="form-select" name="jenis_konstruksi">
                          ${konstruksi.map(k => `<option value="${k}" ${data.jenis_konstruksi === k ? 'selected' : ''}>${k.toUpperCase()}</option>`).join('')}
                       </select>
                    </div>
                 </div>

                 <div class="form-group">
                    <label class="form-label" style="letter-spacing:1.5px">GEOSPATIAL ADDRESS <span style="color:var(--danger-400)">*</span></label>
                    <textarea class="form-input" name="alamat" rows="3" placeholder="Full street address, district, and province..." required>${data.alamat || ''}</textarea>
                 </div>
              </div>

              <div class="card-quartz" style="padding:var(--space-6); border-color: hsla(220, 95%, 52%, 0.1)">
                 <div style="font-family:'Outfit', sans-serif; font-weight:800; font-size:1.1rem; color:white; margin-bottom:24px; display:flex; align-items:center; gap:12px; text-align: left">
                    <i class="fas fa-crosshairs" style="color:var(--brand-400)"></i> Geospatial Lock
                 </div>
                 <div id="proyek-map" style="width:100%; height:320px; border-radius:16px; background:hsla(224, 25%, 4%, 0.8); border:1px solid hsla(220, 20%, 100%, 0.05)"></div>
                 <div class="grid-2-col" style="margin-top:24px">
                    <div class="form-group">
                       <label class="form-label-xs">LATITUDE</label>
                       <input type="text" id="input-lat" name="latitude" value="${data.latitude || ''}" class="form-input-compact" readonly>
                    </div>
                    <div class="form-group">
                       <label class="form-label-xs">LONGITUDE</label>
                       <input type="text" id="input-lng" name="longitude" value="${data.longitude || ''}" class="form-input-compact" readonly>
                    </div>
                 </div>
                 <p style="font-family:var(--font-mono); font-size:8px; color:var(--text-tertiary); margin-top:16px; line-height:1.5"><i class="fas fa-info-circle"></i> Drag the digital pin to precisely synchronize high-fidelity satellite coordinates with the asset footprint.</p>
              </div>

           </div>
        </div>

        <!-- STEP 2: TECHNICAL & LAND DATA -->
        <div class="form-step-section" id="step-2" style="display:none">
           <div class="grid-main-side">
              
              <div class="card-quartz" style="padding:var(--space-6) var(--space-8)">
                 <div style="font-family:'Outfit', sans-serif; font-weight:800; font-size:1.25rem; color:white; margin-bottom:32px; display:flex; align-items:center; gap:16px; text-align: left">
                    <i class="fas fa-ruler-combined" style="color:var(--brand-400)"></i> II. Technical Parameters
                 </div>
                 
                 <div style="display:grid; grid-template-columns: 1fr 1fr; gap:24px">
                    <div class="form-group mb-8">
                       <label class="form-label" style="letter-spacing:1.5px">TOTAL AREA (M²)</label>
                       <input type="number" class="form-input" name="luas_bangunan" value="${data.luas_bangunan || ''}" placeholder="0.00">
                    </div>
                    <div class="form-group mb-8">
                       <label class="form-label" style="letter-spacing:1.5px">VERTICAL FLOORS</label>
                       <input type="number" class="form-input" name="jumlah_lantai" value="${data.jumlah_lantai || ''}" placeholder="1">
                    </div>
                 </div>

                 <div class="form-group mb-8">
                    <label class="form-label" style="letter-spacing:1.5px">PBG / IMB REGISTRY NUMBER</label>
                    <input type="text" class="form-input font-mono" name="nomor_pbg" value="${data.nomor_pbg || ''}" placeholder="PBG-XXXXXXXXX">
                 </div>

                 <div class="card-quartz" style="background:hsla(220, 95%, 52%, 0.03); border-color: hsla(220, 95%, 52%, 0.1); padding:24px; margin-top:24px">
                    <label class="form-label" style="color:var(--brand-400); margin-bottom:16px"><i class="fas fa-chart-line"></i> BUILDING INTENSITY LIMITS (GSB/KDB)</label>
                    <div class="grid-4-col" style="gap:12px">
                       <div class="form-group"><label class="form-label-xs">GSB</label><input type="number" step="0.1" class="form-input-compact" name="gsb" value="${data.gsb || ''}"></div>
                       <div class="form-group"><label class="form-label-xs">KDB</label><input type="number" step="0.1" class="form-input-compact" name="kdb" value="${data.kdb || ''}"></div>
                       <div class="form-group"><label class="form-label-xs">KLB</label><input type="number" step="0.1" class="form-input-compact" name="klb" value="${data.klb || ''}"></div>
                       <div class="form-group"><label class="form-label-xs">KDH</label><input type="number" step="0.1" class="form-input-compact" name="kdh" value="${data.kdh || ''}"></div>
                    </div>
                 </div>
              </div>

              <div class="card-quartz" style="padding:40px">
                 <div style="font-family:'Outfit', sans-serif; font-weight:800; font-size:1.25rem; color:white; margin-bottom:32px; display:flex; align-items:center; gap:16px">
                    <i class="fas fa-map-marked-alt" style="color:var(--brand-400)"></i> Land Registry
                 </div>
                 <div class="form-group mb-6">
                    <label class="form-label">LAND TITLE / CERTIFICATE NO.</label>
                    <input type="text" class="form-input" name="no_dokumen_tanah" value="${data.no_dokumen_tanah || ''}">
                 </div>
                 <div class="form-group mb-8">
                    <label class="form-label">LEGAL LAND OWNER</label>
                    <input type="text" class="form-input" name="nama_pemilik_tanah" value="${data.nama_pemilik_tanah || ''}">
                 </div>
                 <div class="card-quartz" style="padding:16px; background:hsla(220, 20%, 100%, 0.02)">
                    <label style="display:flex; align-items:center; gap:16px; cursor:pointer">
                       <input type="checkbox" name="pemilik_tanah_sama" value="true" ${data.pemilik_tanah_sama ? 'checked' : ''} style="width:20px; height:20px; accent-color:var(--brand-500)">
                       <span style="font-family:var(--font-mono); font-size:9px; font-weight:800; color:var(--text-tertiary); letter-spacing:1px">OWNER IDENTITY MATCHES ASSET BENEFICIARY</span>
                    </label>
                 </div>

                 <div class="card-quartz" style="padding:40px; margin-top:32px; border-color:var(--brand-400)">
                     <div style="font-family:'Outfit', sans-serif; font-weight:800; font-size:1.1rem; color:white; margin-bottom:24px; display:flex; align-items:center; gap:16px">
                        <i class="fas fa-cloud-arrow-down" style="color:var(--brand-400)"></i> SIMBG Portal Integration
                     </div>
                     <div class="form-group mb-6">
                        <label class="form-label">SIMBG APPLICATION ID (ID PERMOHONAN)</label>
                        <input type="text" class="form-input font-mono" name="simbg_id" value="${data.simbg_id || ''}" placeholder="SIMBG-XXXXXXXXX">
                     </div>
                     <div class="form-group mb-6">
                        <label class="form-label">GOOGLE DRIVE PROXY URL</label>
                        <input type="text" class="form-input text-xs font-mono" name="drive_proxy_url" value="${data.drive_proxy_url || (!isEdit ? APP_CONFIG.gasApiUrl : '')}" placeholder="https://script.google.com/macros/s/...">
                     </div>
                     <div class="grid-2-col">
                        <div class="form-group">
                           <label class="form-label">PORTAL EMAIL</label>
                           <input type="email" class="form-input text-xs" name="simbg_email" value="${data.simbg_email || ''}" placeholder="email@pendaftar.go.id">
                        </div>
                        <div class="form-group">
                           <label class="form-label">PORTAL PASSWORD</label>
                           <input type="password" class="form-input text-xs" name="simbg_password" value="${data.simbg_password || ''}" placeholder="••••••••">
                        </div>
                     </div>
                     <p style="font-family:var(--font-mono); font-size:8px; color:var(--text-tertiary); margin-top:16px; line-height:1.5"><i class="fas fa-shield-alt"></i> Credentials are used for automated synchronization with the national SIMBG database. Proxy URL is auto-filled from global app config.</p>
                  </div>
              </div>

           </div>
        </div>

        <!-- STEP 3: BENEFICIARY & CONSENSUS -->
        <div class="form-step-section" id="step-3" style="display:none">
           <div class="grid-main-side">
              
              <div class="card-quartz" style="padding:40px">
                 <div style="font-family:'Outfit', sans-serif; font-weight:800; font-size:1.25rem; color:white; margin-bottom:32px; display:flex; align-items:center; gap:16px">
                    <i class="fas fa-user-tie" style="color:var(--brand-400)"></i> III. Legal Beneficiary
                 </div>
                 <div class="form-group mb-8">
                    <label class="form-label">PRIMARY OWNER / INSTITUTION <span style="color:var(--danger-400)">*</span></label>
                    <input type="text" class="form-input" name="pemilik" value="${data.pemilik || ''}" placeholder="e.g. PT Artha Graha / John Doe" required>
                 </div>
                 <div style="display:grid; grid-template-columns: 1fr 1fr; gap:24px">
                    <div class="form-group mb-8">
                       <label class="form-label">AUTHORIZED PIC</label>
                       <input type="text" class="form-input" name="penanggung_jawab" value="${data.penanggung_jawab || ''}">
                    </div>
                    <div class="form-group mb-8">
                       <label class="form-label">SECURE LINE (PHONE)</label>
                       <input type="tel" class="form-input" name="telepon" value="${data.telepon || ''}">
                    </div>
                 </div>
                 <div class="form-group">
                    <label class="form-label">ENCRYPTED EMAIL ALIAS</label>
                    <input type="email" class="form-input" name="email_pemilik" value="${data.email_pemilik || ''}">
                 </div>
              </div>

              <div class="card-quartz" style="padding:40px">
                 <div style="font-family:'Outfit', sans-serif; font-weight:800; font-size:1.25rem; color:white; margin-bottom:32px; display:flex; align-items:center; gap:16px">
                    <i class="fas fa-users-gear" style="color:var(--brand-400)"></i> Audit Delegation
                 </div>
                 <div class="form-group mb-8">
                    <label class="form-label">DELEGATE TO (TEAM PIC)</label>
                    <select class="form-select" name="assigned_to" style="border-color:hsla(45, 90%, 60%, 0.3)">
                       <option value="">-- SELECT AUTHORIZED AGENT --</option>
                       ${teamMembers.map(m => `<option value="${m.id}" ${data.assigned_to === m.id ? 'selected' : ''}>${m.full_name.toUpperCase()}</option>`).join('')}
                    </select>
                 </div>
                 <div class="grid-2-col">
                    <div class="form-group">
                       <label class="form-label">COMMENCEMENT DATE</label>
                       <input type="date" class="form-input" name="tanggal_mulai" value="${data.tanggal_mulai || ''}">
                    </div>
                    <div class="form-group">
                       <label class="form-label">TARGET SEALING DATE</label>
                       <input type="date" class="form-input" name="tanggal_target" value="${data.tanggal_target || ''}">
                    </div>
                 </div>
                 
                 <div class="card-quartz" style="margin-top:32px; background:var(--gradient-dark); border-color: hsla(220, 95%, 52%, 0.2); padding:24px">
                    <div style="display:flex; align-items:center; gap:16px; margin-bottom:16px">
                       <div style="width:32px; height:32px; border-radius:8px; background:hsla(220, 95%, 52%, 0.1); display:flex; align-items:center; justify-content:center; color:var(--brand-400)">
                          <i class="fas fa-brain"></i>
                       </div>
                       <strong style="font-family:'Outfit', sans-serif; font-size:0.9rem">QUANTUM NEURAL FOCUS</strong>
                    </div>
                    <select class="form-select text-xs" name="ai_focus" style="background:transparent; border-color:hsla(220, 20%, 100%, 0.1)">
                       <option value="komprehensif">PROTOCOL: COMPREHENSIVE SYNTHESIS</option>
                       <option value="struktur">PROTOCOL: STRUCTURAL DEPTH-SCAN</option>
                       <option value="kebakaran">PROTOCOL: FIRE SAFETY OVERWATCH</option>
                    </select>
                 </div>
              </div>

           </div>
        </div>

        <!-- FOOTER NAVIGATION -->
        <div style="margin-top:60px; display:flex; justify-content:space-between; align-items:center">
           <button type="button" class="btn btn-ghost" id="btn-prev-step" onclick="window._switchStep(window._currentStep - 1)" style="visibility:hidden; height:48px; padding:0 24px; font-weight:700">
              <i class="fas fa-arrow-left" style="margin-right:12px"></i> PREVIOUS STEP
           </button>
           
           <div style="display:flex; gap:16px">
              <button type="button" class="btn-presidential gold" id="btn-next-step" onclick="window._switchStep(window._currentStep + 1)" style="height:56px; padding:0 40px; font-size:1rem; border-radius:14px">
                 CONTINUE <i class="fas fa-arrow-right" style="margin-left:12px"></i>
              </button>
              <button type="submit" class="btn-presidential gold" style="height:56px; padding:0 48px; border-radius:14px; display:none" id="btn-submit-proyek">
                 <i class="fas fa-check-double" style="margin-right:12px"></i> ${isEdit ? 'SEAL CHANGES' : 'INITIATE REGISTRY'}
              </button>
           </div>
        </div>

      </form>
    </div>
  `;
}

// INTERACTIVITY: STEPPER ORCHESTRATION
window._switchStep = (nextStep) => {
  if (nextStep < 1 || nextStep > 3) return;
  
  window._currentStep = nextStep;
  
  // Toggle Sections
  document.querySelectorAll('.form-step-section').forEach((el, idx) => {
    el.style.display = (idx + 1) === nextStep ? 'block' : 'none';
  });
  
  // Update Stepper Dots
  document.querySelectorAll('.step-item').forEach((el, idx) => {
    const dot = el.querySelector('.step-circle');
    const label = el.querySelector('.step-label');
    const stepIdx = idx + 1;
    
    if (stepIdx === nextStep) {
       dot.style.background = 'var(--gradient-brand)';
       dot.style.borderColor = 'hsla(220, 95%, 52%, 0.3)';
       dot.style.color = 'white';
       dot.style.boxShadow = 'var(--shadow-sapphire)';
       label.style.color = 'white';
    } else if (stepIdx < nextStep) {
       dot.style.background = 'hsla(158, 85%, 45%, 0.2)';
       dot.style.borderColor = 'hsla(158, 85%, 45%, 0.3)';
       dot.style.color = 'var(--success-400)';
       dot.innerHTML = '<i class="fas fa-check"></i>';
       label.style.color = 'var(--success-400)';
    } else {
       dot.style.background = 'var(--bg-elevated)';
       dot.style.borderColor = 'hsla(220, 20%, 100%, 0.1)';
       dot.style.color = 'var(--text-tertiary)';
       dot.innerHTML = stepIdx;
       label.style.color = 'var(--text-tertiary)';
    }
  });
  
  const fill = document.getElementById('stepper-fill');
  if (fill) fill.style.width = ((nextStep - 1) / 2 * 70) + '%';
  
  // Update Buttons
  const btnPrev = document.getElementById('btn-prev-step');
  const btnNext = document.getElementById('btn-next-step');
  const btnSubmit = document.getElementById('btn-submit-proyek');
  
  if (btnPrev) btnPrev.style.visibility = nextStep === 1 ? 'hidden' : 'visible';
  if (btnNext) btnNext.style.display = nextStep === 3 ? 'none' : 'block';
  if (btnSubmit) btnSubmit.style.display = nextStep === 3 ? 'block' : 'none';

  if (nextStep === 1) {
     setTimeout(() => { if (window._proyekMap) window._proyekMap.invalidateSize(); }, 350);
  }
};

/**
 * Handle Map Logic
 */
window.initProyekMap = function(initLat, initLng) {
  if (typeof window.L === 'undefined') return;
  const mapEl = document.getElementById('proyek-map');
  if (!mapEl) return;

  if (window._proyekMap) {
    window._proyekMap.off();
    window._proyekMap.remove();
  }

  let lat = initLat ? parseFloat(initLat) : -6.2088;
  let lng = initLng ? parseFloat(initLng) : 106.8456;

  const map = window.L.map('proyek-map').setView([lat, lng], 17);
  window._proyekMap = map;

  window.L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap'
  }).addTo(map);

  const marker = window.L.marker([lat, lng], { 
     draggable: true,
     icon: window.L.divIcon({
        className: 'modern-pin-wrap',
        html: `<div class="modern-pin" style="width:50px; height:50px; background:var(--gradient-brand); border:4px solid white; border-radius:50%; box-shadow:0 0 20px rgba(0,0,0,0.4); display:flex; align-items:center; justify-content:center; color:white"><i class="fas fa-building"></i></div>`,
        iconSize: [50, 50],
        iconAnchor: [25, 50]
     })
  }).addTo(map);
  
  window._proyekMarker = marker;
  
  if (!initLat && document.getElementById('input-lat')) {
     document.getElementById('input-lat').value = lat.toFixed(6);
     document.getElementById('input-lng').value = lng.toFixed(6);
  }

  marker.on('dragend', function(e) {
    const pos = marker.getLatLng();
    if (document.getElementById('input-lat')) document.getElementById('input-lat').value = pos.lat.toFixed(6);
    if (document.getElementById('input-lng')) document.getElementById('input-lng').value = pos.lng.toFixed(6);
  });
};

/**
 * AI OCR Logic
 */
window._triggerOCRScan = () => {
  const input = document.getElementById('ocr-file-input');
  if (input) input.click();
};

window._handleOCRFile = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const overlay = document.getElementById('ai-loading-overlay');
  const progress = document.getElementById('ai-progress-fill');
  const statusEl = document.getElementById('ai-status-msg');
  
  if (overlay) overlay.style.display = 'flex';
  if (progress) progress.style.width = '20%';

  try {
    const base64 = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.readAsDataURL(file);
    });

    if (progress) progress.style.width = '50%';
    if (statusEl) statusEl.textContent = 'EXTRACTING GEOMETRIC & LEGAL PARAMETERS...';

    const result = await runOCRAnalysis(base64, file.type);
    
    if (progress) progress.style.width = '100%';
    
    if (result) {
      const form = document.getElementById('proyek-form');
      const fields = ['nama_bangunan', 'pemilik', 'alamat', 'luas_bangunan', 'jumlah_lantai', 'nomor_pbg', 'gsb', 'kdb', 'klb', 'kdh'];

      fields.forEach(f => {
        if (result[f] && form.elements[f]) {
          form.elements[f].value = result[f];
          const fg = form.elements[f].closest('.form-group');
          if (fg) {
             fg.style.animation = 'glow-gold 2s ease-out';
             setTimeout(() => fg.style.animation = '', 2000);
          }
        }
      });

      showSuccess('AI Reconstruction Complete. Field parameters populated.');
      if (window._switchStep) window._switchStep(1);
    }
  } catch (err) {
    showError("OCR Integration Error: " + err.message);
  } finally {
    if (overlay) overlay.style.display = 'none';
    if (progress) progress.style.width = '0%';
    event.target.value = '';
  }
};

/**
 * Submit Core Logic
 */
window.submitProyek = async function(event) {
  event.preventDefault();
  const form = event.target;
  const btn  = document.getElementById('btn-submit-proyek');
  const fd = new FormData(form);
  const data = Object.fromEntries(fd);
  const id   = new URLSearchParams(window.location.hash.split('?')[1]).get('id');

  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> SEALING DATA...';

  try {
    const cleanData = {
      nama_bangunan:    data.nama_bangunan,
      jenis_bangunan:   data.jenis_bangunan,
      alamat:           data.alamat,
      pemilik:          data.pemilik,
      penanggung_jawab: data.penanggung_jawab || null,
      telepon:          data.telepon || null,
      email_pemilik:    data.email_pemilik || null,
      tanggal_mulai:    data.tanggal_mulai || null,
      tanggal_target:   data.tanggal_target || null,
      jumlah_lantai:    data.jumlah_lantai ? parseInt(data.jumlah_lantai) : null,
      luas_bangunan:    data.luas_bangunan ? parseFloat(data.luas_bangunan) : null,
      jenis_konstruksi: data.jenis_konstruksi,
      nomor_pbg:        data.nomor_pbg,
      latitude:         data.latitude ? parseFloat(data.latitude) : null,
      longitude:        data.longitude ? parseFloat(data.longitude) : null,
      gsb:              data.gsb ? parseFloat(data.gsb) : null,
      kdb:              data.kdb ? parseFloat(data.kdb) : null,
      klb:              data.klb ? parseFloat(data.klb) : null,
      kdh:              data.kdh ? parseFloat(data.kdh) : null,
      no_dokumen_tanah:    data.no_dokumen_tanah || null,
      nama_pemilik_tanah:  data.nama_pemilik_tanah || null,
      pemilik_tanah_sama:  data.pemilik_tanah_sama === 'true',
      assigned_to:         data.assigned_to || null,
      simbg_id:            data.simbg_id || null,
      simbg_email:         data.simbg_email || null,
      simbg_password:      data.simbg_password || null,
      drive_proxy_url:     data.drive_proxy_url || null,
      updated_at:       new Date().toISOString()
    };
    
    if (id) {
      await supabase.from('proyek').update(cleanData).eq('id', id);
    } else {
      const { data: created } = await supabase.from('proyek').insert(cleanData).select().single();
      if (created) {
         try { await initializeProjectFolder(created.id, created.nama_bangunan); } catch(e){}
         setTimeout(() => navigate('proyek-detail', { id: created.id }), 800);
      }
    }
    showSuccess('Registry Authenticated Successfully.');
  } catch (err) {
    showError('Sealing Error: ' + err.message);
    btn.disabled = false;
    btn.innerHTML = `<i class="fas fa-check-double"></i> SEAL CHANGES`;
  }
};
