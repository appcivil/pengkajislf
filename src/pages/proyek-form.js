/**
 * PROYEK FORM PAGE
 * PRESIDENTIAL CLASS (QUARTZ PREMIUM)
 * High-End Asset Induction & Intelligence Framework
 */
import { supabase } from '../lib/supabase.js';
import { escapeHtml } from '../lib/safe-markdown.js';
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
      <div class="page-header" style="margin-bottom: 32px">
        <div class="flex-between flex-stack">
          <div>
            <button class="btn btn-ghost btn-xs" onclick="window.navigate('proyek')" style="margin-bottom:12px; padding:0; color:var(--brand-300); font-weight:700; letter-spacing:0.5px">
              <i class="fas fa-arrow-left" style="margin-right:8px"></i> KEMBALI KE DAFTAR PROYEK
            </button>
            <h1 class="page-title" style="font-family:'Outfit', sans-serif; font-weight:800; font-size: 2.1rem; letter-spacing:-0.02em; margin-bottom:4px">
              ${isEdit ? 'Ubah Data <span class="text-gradient-gold">Proyek Gedung</span>' : 'Pendaftaran <span class="text-gradient-gold">Proyek Baru</span>'}
            </h1>
            <p class="page-subtitle" style="font-size: 0.85rem; color:var(--text-tertiary); margin-bottom:0">
              ${isEdit ? 'Perbarui data teknis, legalitas, dan parameter gedung' : 'Registrasi gedung baru untuk pengkajian teknis kelaikan fungsi (SLF)'}
            </p>
          </div>
          
          ${!isEdit ? `
            <button class="btn-presidential gold" onclick="window._triggerOCRScan()" style="height:44px; padding:0 20px; border-radius:12px; width:auto; font-size:0.85rem">
              <i class="fas fa-file-invoice" style="margin-right:8px"></i> Pindai Dokumen PBG (AI OCR)
            </button>
          ` : ''}
        </div>

        <!-- Presidential Stepper -->
        <div class="card-quartz hide-mobile" style="padding: 12px; margin-top: 24px; display: flex; align-items: center; background: hsla(224, 25%, 4%, 0.6); position:relative; overflow:hidden; border: 1px solid var(--border-default);">
           <div style="position:absolute; height:2px; background:hsla(220, 20%, 100%, 0.05); left:15%; right:15%; top:50%; transform:translateY(-50%); z-index:0"></div>
           <div id="stepper-fill" style="position:absolute; height:2px; background:var(--gradient-brand); left:15%; width:0%; top:50%; transform:translateY(-50%); z-index:1; transition:width 0.4s ease"></div>
           
           ${[
             { n: 1, label: 'IDENTITAS GEDUNG' },
             { n: 2, label: 'PARAMETER TEKNIS' },
             { n: 3, label: 'KEPEMILIKAN & TIM' }
           ].map(s => `
             <div class="step-item ${s.n === 1 ? 'active' : ''}" id="step-dot-${escapeHtml(s.n)}" style="flex:1; z-index:2; position:relative; text-align:center">
                <div class="step-circle" style="width:36px; height:36px; background:var(--bg-elevated); border:2px solid hsla(220, 20%, 100%, 0.1); border-radius:50%; margin:0 auto 8px; display:flex; align-items:center; justify-content:center; font-family:var(--font-mono); font-size:12px; font-weight:800; color:var(--text-tertiary); transition:all 0.3s">
                   ${escapeHtml(s.n)}
                </div>
                <div class="step-label" style="font-family:var(--font-mono); font-size:9px; font-weight:700; color:var(--text-tertiary); letter-spacing:0.5px">${escapeHtml(s.label)}</div>
             </div>
           `).join('')}
        </div>
      </div>

      <!-- AI LOADING OVERLAY -->
      <div id="ai-loading-overlay" style="display:none; position:fixed; inset:0; background:hsla(224, 25%, 4%, 0.95); backdrop-filter:blur(20px); z-index:10000; align-items:center; justify-content:center; flex-direction:column; text-align:center">
         <div style="position:relative; margin-bottom:32px">
            <div class="animate-ping" style="position:absolute; inset:0; border:2px solid var(--brand-500); border-radius:50%; opacity:0.1"></div>
            <div style="width:88px; height:88px; background:var(--gradient-brand); border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:2.5rem; color:white; box-shadow:var(--shadow-sapphire)">
               <i class="fas fa-brain"></i>
            </div>
         </div>
         <h2 style="font-family:'Outfit', sans-serif; font-weight:800; font-size:1.8rem; color:white; margin-bottom:8px">PEMINDAIAN AI BERJALAN</h2>
         <p id="ai-status-msg" style="color:var(--brand-300); font-size:0.85rem; max-width:440px; line-height:1.6">Mengekstrak data teks dari dokumen perizinan PBG/IMB ke formulir...</p>
         <div style="width:300px; height:4px; background:hsla(220, 20%, 100%, 0.05); border-radius:10px; margin-top:24px; overflow:hidden">
            <div id="ai-progress-fill" style="width:0%; height:100%; background:var(--gradient-brand); border-radius:10px; transition:width 0.3s"></div>
         </div>
      </div>

      <input type="file" id="ocr-file-input" accept="image/*,application/pdf" style="display:none" onchange="window._handleOCRFile(event)" />

      <form id="proyek-form" onsubmit="window.submitProyek(event)">
        
        <!-- STEP 1: IDENTITY & GEOSPATIAL -->
        <div class="form-step-section active" id="step-1" style="display:block">
           <div class="grid-main-side">
              
              <div class="card-quartz" style="padding:var(--space-6) var(--space-8)">
                 <div style="font-family:'Outfit', sans-serif; font-weight:800; font-size:1.2rem; color:white; margin-bottom:28px; display:flex; align-items:center; gap:12px; text-align: left">
                    <i class="fas fa-landmark" style="color:var(--brand-400)"></i> I. IDENTITAS BANGUNAN
                 </div>
                 
                 <div class="form-group mb-6">
                    <label class="form-label">Nama Bangunan Gedung <span style="color:var(--danger-400)">*</span></label>
                    <input type="text" class="form-input" name="nama_bangunan" value="${escapeHtml(data.nama_bangunan || '')}" placeholder="cth: Gedung Menara Graha" required>
                 </div>
                 
                 <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px">
                    <div class="form-group mb-6">
                       <label class="form-label">Fungsi Bangunan <span style="color:var(--danger-400)">*</span></label>
                       <select class="form-select" name="jenis_bangunan" required>
                          <option value="">-- Pilih Fungsi Bangunan --</option>
                          ${jenis.map(j => `<option value="${escapeHtml(j)}" ${data.jenis_bangunan === j ? 'selected' : ''}>${escapeHtml(j)}</option>`).join('')}
                       </select>
                    </div>
                    <div class="form-group mb-6">
                       <label class="form-label">Jenis Konstruksi Utama</label>
                       <select class="form-select" name="jenis_konstruksi">
                          ${konstruksi.map(k => `<option value="${escapeHtml(k)}" ${data.jenis_konstruksi === k ? 'selected' : ''}>${escapeHtml(k)}</option>`).join('')}
                       </select>
                    </div>
                 </div>

                 <div class="form-group">
                    <label class="form-label">Alamat Lengkap Bangunan <span style="color:var(--danger-400)">*</span></label>
                    <textarea class="form-input" name="alamat" rows="3" placeholder="Jalan, RT/RW, Kelurahan, Kecamatan, Kota/Kabupaten..." required>${escapeHtml(data.alamat || '')}</textarea>
                 </div>
              </div>

              <div class="card-quartz" style="padding:var(--space-6); border-color: hsla(220, 95%, 52%, 0.1)">
                 <div style="font-family:'Outfit', sans-serif; font-weight:800; font-size:1.05rem; color:white; margin-bottom:20px; display:flex; align-items:center; gap:10px; text-align: left">
                    <i class="fas fa-crosshairs" style="color:var(--brand-400)"></i> Titik Koordinat Gedung
                 </div>
                 <div id="proyek-map" style="width:100%; height:300px; border-radius:14px; background:hsla(224, 25%, 4%, 0.8); border:1px solid hsla(220, 20%, 100%, 0.05)"></div>
                 <div class="grid-2-col" style="margin-top:20px">
                    <div class="form-group">
                       <label class="form-label-xs">LATITUDE</label>
                       <input type="text" id="input-lat" name="latitude" value="${escapeHtml(data.latitude || '')}" class="form-input-compact" placeholder="-6.2088" onchange="window._updateMapFromInput()">
                    </div>
                    <div class="form-group">
                       <label class="form-label-xs">LONGITUDE</label>
                       <input type="text" id="input-lng" name="longitude" value="${escapeHtml(data.longitude || '')}" class="form-input-compact" placeholder="106.8456" onchange="window._updateMapFromInput()">
                    </div>
                 </div>
                 <p style="font-size:0.75rem; color:var(--text-tertiary); margin-top:12px; line-height:1.5"><i class="fas fa-info-circle"></i> Geser pin di peta atau masukkan koordinat manual.</p>
              </div>

           </div>
        </div>

        <!-- STEP 2: TECHNICAL & LAND DATA -->
        <div class="form-step-section" id="step-2" style="display:none">
           <div class="grid-main-side">
              
              <div class="card-quartz" style="padding:var(--space-6) var(--space-8)">
                 <div style="font-family:'Outfit', sans-serif; font-weight:800; font-size:1.2rem; color:white; margin-bottom:28px; display:flex; align-items:center; gap:12px; text-align: left">
                    <i class="fas fa-ruler-combined" style="color:var(--brand-400)"></i> II. PARAMETER TEKNIS BANGUNAN
                 </div>
                 
                 <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px">
                    <div class="form-group mb-6">
                       <label class="form-label">Total Luas Bangunan (m²)</label>
                       <input type="number" class="form-input" name="luas_bangunan" value="${escapeHtml(data.luas_bangunan || '')}" placeholder="0.00">
                    </div>
                    <div class="form-group mb-6">
                       <label class="form-label">Jumlah Lantai</label>
                       <input type="number" class="form-input" name="jumlah_lantai" value="${escapeHtml(data.jumlah_lantai || '')}" placeholder="1">
                    </div>
                 </div>

                 <div class="form-group mb-6">
                    <label class="form-label">Nomor Registrasi PBG / IMB</label>
                    <input type="text" class="form-input font-mono" name="nomor_pbg" value="${escapeHtml(data.nomor_pbg || '')}" placeholder="PBG-XXXXXXXXX">
                 </div>

                 <div class="card-quartz" style="background:hsla(220, 95%, 52%, 0.03); border-color: hsla(220, 95%, 52%, 0.1); padding:20px; margin-top:20px">
                    <label class="form-label" style="color:var(--brand-400); margin-bottom:14px"><i class="fas fa-chart-line"></i> Batasan Intensitas Bangunan (GSB/KDB/KLB/KDH)</label>
                    <div class="grid-4-col" style="gap:12px">
                       <div class="form-group"><label class="form-label-xs">GSB (m)</label><input type="number" step="0.1" class="form-input-compact" name="gsb" value="${escapeHtml(data.gsb || '')}"></div>
                       <div class="form-group"><label class="form-label-xs">KDB (%)</label><input type="number" step="0.1" class="form-input-compact" name="kdb" value="${escapeHtml(data.kdb || '')}"></div>
                       <div class="form-group"><label class="form-label-xs">KLB</label><input type="number" step="0.1" class="form-input-compact" name="klb" value="${escapeHtml(data.klb || '')}"></div>
                       <div class="form-group"><label class="form-label-xs">KDH (%)</label><input type="number" step="0.1" class="form-input-compact" name="kdh" value="${escapeHtml(data.kdh || '')}"></div>
                    </div>
                 </div>
              </div>

              <div class="card-quartz" style="padding:var(--space-6) var(--space-8)">
                 <div style="font-family:'Outfit', sans-serif; font-weight:800; font-size:1.2rem; color:white; margin-bottom:28px; display:flex; align-items:center; gap:12px">
                    <i class="fas fa-map-marked-alt" style="color:var(--brand-400)"></i> Data Lahan & Sertifikat
                 </div>
                 <div class="form-group mb-6">
                    <label class="form-label">Nomor Sertifikat / Bukti Hak Tanah</label>
                    <input type="text" class="form-input" name="no_dokumen_tanah" value="${escapeHtml(data.no_dokumen_tanah || '')}" placeholder="cth: SHM No. 1234 / HGB No. 567">
                 </div>
                 <div class="form-group mb-6">
                    <label class="form-label">Nama Pemegang Hak Tanah</label>
                    <input type="text" class="form-input" name="nama_pemilik_tanah" value="${escapeHtml(data.nama_pemilik_tanah || '')}">
                 </div>
                 <div class="card-quartz" style="padding:14px; background:hsla(220, 20%, 100%, 0.02)">
                    <label style="display:flex; align-items:center; gap:12px; cursor:pointer">
                       <input type="checkbox" name="pemilik_tanah_sama" value="true" ${data.pemilik_tanah_sama ? 'checked' : ''} style="width:18px; height:18px; accent-color:var(--brand-500)">
                       <span style="font-size:0.8rem; color:var(--text-secondary)">Pemegang hak tanah sama dengan pemilik bangunan</span>
                    </label>
                 </div>

                 <div class="card-quartz" style="padding:24px; margin-top:24px; border-color:var(--border-default)">
                     <div style="font-family:'Outfit', sans-serif; font-weight:800; font-size:1.05rem; color:white; margin-bottom:16px; display:flex; align-items:center; gap:12px">
                        <i class="fas fa-cloud-arrow-down" style="color:var(--brand-400)"></i> Integrasi Akun Portal SIMBG
                     </div>
                     <div class="form-group mb-4">
                        <label class="form-label">ID Permohonan SIMBG</label>
                        <input type="text" class="form-input font-mono" name="simbg_id" value="${escapeHtml(data.simbg_id || '')}" placeholder="SIMBG-XXXXXXXXX">
                     </div>
                     <div class="form-group mb-4">
                        <label class="form-label">Google Drive Proxy URL</label>
                        <input type="text" class="form-input text-xs font-mono" name="drive_proxy_url" value="${data.drive_proxy_url || (!isEdit ? APP_CONFIG.gasApiUrl : '')}" placeholder="https://script.google.com/macros/s/...">
                     </div>
                     <div class="grid-2-col">
                        <div class="form-group">
                           <label class="form-label">Email Akun SIMBG</label>
                           <input type="email" class="form-input text-xs" name="simbg_email" value="${escapeHtml(data.simbg_email || '')}" placeholder="email@pemohon.go.id">
                        </div>
                        <div class="form-group">
                           <label class="form-label">Kata Sandi SIMBG</label>
                           <input type="password" class="form-input text-xs" name="simbg_password" value="${escapeHtml(data.simbg_password || '')}" placeholder="••••••••">
                        </div>
                     </div>
                     <p style="font-size:0.75rem; color:var(--text-tertiary); margin-top:12px; line-height:1.5"><i class="fas fa-shield-alt"></i> Kredensial digunakan untuk sinkronisasi dokumen perizinan dengan sistem SIMBG.</p>
                  </div>
              </div>

           </div>
        </div>

        <!-- STEP 3: BENEFICIARY & CONSENSUS -->
        <div class="form-step-section" id="step-3" style="display:none">
           <div class="grid-main-side">
              
              <div class="card-quartz" style="padding:var(--space-6) var(--space-8)">
                 <div style="font-family:'Outfit', sans-serif; font-weight:800; font-size:1.2rem; color:white; margin-bottom:28px; display:flex; align-items:center; gap:12px">
                    <i class="fas fa-user-tie" style="color:var(--brand-400)"></i> III. DATA PEMILIK / PEMOHON
                 </div>
                 <div class="form-group mb-6">
                    <label class="form-label">Nama Pemilik / Badan Usaha <span style="color:var(--danger-400)">*</span></label>
                    <input type="text" class="form-input" name="pemilik" value="${escapeHtml(data.pemilik || '')}" placeholder="cth: PT Pembangunan Graha / Bpk. Hendra" required>
                 </div>
                 <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px">
                    <div class="form-group mb-6">
                       <label class="form-label">Penanggung Jawab (PIC)</label>
                       <input type="text" class="form-input" name="penanggung_jawab" value="${escapeHtml(data.penanggung_jawab || '')}">
                    </div>
                    <div class="form-group mb-6">
                       <label class="form-label">Nomor Telepon / WhatsApp</label>
                       <input type="tel" class="form-input" name="telepon" value="${escapeHtml(data.telepon || '')}" placeholder="08xxxxxxxxxx">
                    </div>
                 </div>
                 <div class="form-group">
                    <label class="form-label">Alamat Email Pemohon</label>
                    <input type="email" class="form-input" name="email_pemilik" value="${escapeHtml(data.email_pemilik || '')}" placeholder="pemilik@perusahaan.com">
                 </div>
              </div>

              <div class="card-quartz" style="padding:var(--space-6) var(--space-8)">
                 <div style="font-family:'Outfit', sans-serif; font-weight:800; font-size:1.2rem; color:white; margin-bottom:28px; display:flex; align-items:center; gap:12px">
                    <i class="fas fa-users-gear" style="color:var(--brand-400)"></i> Penugasan Tim Pengkaji Teknis
                 </div>
                 <div class="form-group mb-6">
                    <label class="form-label">Koordinator / Lead Engineer (PIC)</label>
                    <select class="form-select" name="assigned_to" style="border-color:hsla(45, 90%, 60%, 0.3)">
                       <option value="">-- Pilih Tim Pengkaji --</option>
                       ${teamMembers.map(m => `<option value="${escapeHtml(m.id)}" ${data.assigned_to === m.id ? 'selected' : ''}>${escapeHtml(m.full_name)}</option>`).join('')}
                    </select>
                 </div>
                 <div class="grid-2-col">
                    <div class="form-group">
                       <label class="form-label">Tanggal Mulai Kajian</label>
                       <input type="date" class="form-input" name="tanggal_mulai" value="${escapeHtml(data.tanggal_mulai || '')}">
                    </div>
                    <div class="form-group">
                       <label class="form-label">Target Penyelesaian SLF</label>
                       <input type="date" class="form-input" name="tanggal_target" value="${escapeHtml(data.tanggal_target || '')}">
                    </div>
                 </div>
                 
                 <div class="card-quartz" style="margin-top:24px; background:var(--gradient-dark); border-color: hsla(220, 95%, 52%, 0.2); padding:20px">
                    <div style="display:flex; align-items:center; gap:12px; margin-bottom:12px">
                       <div style="width:32px; height:32px; border-radius:8px; background:hsla(220, 95%, 52%, 0.1); display:flex; align-items:center; justify-content:center; color:var(--brand-400)">
                          <i class="fas fa-brain"></i>
                       </div>
                       <strong style="font-size:0.88rem; color:white">Fokus Prioritas Analisis AI</strong>
                    </div>
                    <select class="form-select text-xs" name="ai_focus" style="background:transparent; border-color:var(--border-subtle)">
                       <option value="komprehensif">Analisis Komprehensif (Seluruh Aspek SLF)</option>
                       <option value="struktur">Prioritas Aspek Keselamatan Struktur</option>
                       <option value="kebakaran">Prioritas Proteksi Kebakaran & Jalur Evakuasi</option>
                    </select>
                 </div>
              </div>

           </div>
        </div>

        <!-- FOOTER NAVIGATION -->
        <div style="margin-top:40px; display:flex; justify-content:space-between; align-items:center">
           <button type="button" class="btn btn-ghost" id="btn-prev-step" onclick="window._switchStep(window._currentStep - 1)" style="visibility:hidden; height:46px; padding:0 24px; font-weight:700">
              <i class="fas fa-arrow-left" style="margin-right:8px"></i> Sebelumnya
           </button>
           
           <div style="display:flex; gap:12px">
              <button type="button" class="btn-presidential gold" id="btn-next-step" onclick="window._switchStep(window._currentStep + 1)" style="height:48px; padding:0 32px; font-size:0.95rem; border-radius:12px">
                 Lanjutkan <i class="fas fa-arrow-right" style="margin-left:8px"></i>
              </button>
              <button type="submit" class="btn-presidential gold" style="height:48px; padding:0 36px; border-radius:12px; display:none" id="btn-submit-proyek">
                 <i class="fas fa-check-double" style="margin-right:8px"></i> ${isEdit ? 'Simpan Perubahan' : 'Daftarkan Proyek'}
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
 * Update map position from manual coordinate input
 */
window._updateMapFromInput = function() {
  const latInput = document.getElementById('input-lat');
  const lngInput = document.getElementById('input-lng');
  if (!latInput || !lngInput) return;

  const lat = parseFloat(latInput.value);
  const lng = parseFloat(lngInput.value);

  if (isNaN(lat) || isNaN(lng)) return;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    showError('Koordinat tidak valid. Latitude: -90 sampai 90, Longitude: -180 sampai 180');
    return;
  }

  if (window._proyekMap && window._proyekMarker) {
    window._proyekMap.setView([lat, lng], 17);
    window._proyekMarker.setLatLng([lat, lng]);
  }
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
      cleanData.created_at = new Date().toISOString();
      const { data: created, error: insertError } = await supabase.from('proyek').insert(cleanData).select().single();
      if (insertError) throw insertError;
      if (created) {
         try { await initializeProjectFolder(created.id, created.nama_bangunan); } catch(e){ console.warn('Drive init failed:', e); }
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

// ============================================================
//  OCR INTEGRATION - Fitur #7: OCR Teks & Tabel
//  Auto-fill form dari dokumen IMB/PBG
// ============================================================

window._triggerOCRScan = () => {
  document.getElementById('ocr-file-input').click();
};

window._handleOCRFile = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const overlay = document.getElementById('ai-loading-overlay');
  const statusMsg = document.getElementById('ai-status-msg');
  const progressFill = document.getElementById('ai-progress-fill');
  
  overlay.style.display = 'flex';
  statusMsg.textContent = 'MEMBACA DOKUMEN...';
  progressFill.style.width = '20%';

  try {
    // Import OCR service
    const { extractTextFromPDF, extractTextFromImage, parseIMBDocument } = await import('../lib/ocr-service.js');
    
    let ocrResult;
    
    if (file.type === 'application/pdf') {
      statusMsg.textContent = 'MENGEKSTRAK TEKS DARI PDF...';
      progressFill.style.width = '40%';
      ocrResult = await extractTextFromPDF(file);
    } else if (file.type.startsWith('image/')) {
      statusMsg.textContent = 'MENJALANKAN OCR PADA GAMBAR...';
      progressFill.style.width = '40%';
      ocrResult = await extractTextFromImage(file);
    } else {
      throw new Error('Format file tidak didukung. Gunakan PDF atau gambar.');
    }

    if (!ocrResult.success) {
      throw new Error(ocrResult.error || 'Gagal membaca dokumen');
    }

    statusMsg.textContent = 'MEMPARSING DATA PERIZINAN...';
    progressFill.style.width = '70%';
    
    const parsed = await parseIMBDocument(ocrResult.fullText || ocrResult.text);
    
    statusMsg.textContent = 'MENGISI FORM...';
    progressFill.style.width = '90%';
    
    // Fill form fields
    const fields = {
      'nama_bangunan': parsed.raw.nama_pemilik || '',
      'nomor_pbg': parsed.raw.nomor_pbg || parsed.raw.nomor_imb || '',
      'alamat': parsed.raw.alamat || '',
      'luas_bangunan': parsed.raw.luas_bangunan || '',
      'luas_lahan': parsed.raw.luas_tanah || '',
      'jumlah_lantai': parsed.raw.jumlah_lantai || '',
      'fungsi_bangunan': parsed.raw.fungsi_bangunan || '',
      'gsb': parsed.raw.gsb || '',
      'kdb': parsed.raw.kdb || '',
      'klb': parsed.raw.klb || '',
      'kdh': parsed.raw.kdh || '',
    };
    
    let filledCount = 0;
    for (const [fieldId, value] of Object.entries(fields)) {
      const input = document.querySelector(`[name="${fieldId}"]`);
      if (input && value) {
        input.value = value;
        filledCount++;
        // Trigger change event
        input.dispatchEvent(new Event('change'));
      }
    }
    
    progressFill.style.width = '100%';
    statusMsg.textContent = `BERHASIL - ${filledCount} FIELD DIISI`;
    
    setTimeout(() => {
      overlay.style.display = 'none';
      showSuccess(`OCR Berhasil: ${filledCount} field terisi otomatis`);
    }, 1000);
    
  } catch (err) {
    overlay.style.display = 'none';
    showError('OCR Error: ' + err.message);
    console.error('[OCR] Error:', err);
  }
  
  // Reset file input
  event.target.value = '';
};
