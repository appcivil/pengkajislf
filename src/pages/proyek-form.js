// ============================================================
//  PROYEK FORM PAGE (Create / Edit)
// ============================================================
import { supabase } from '../lib/supabase.js';
import { navigate } from '../lib/router.js';
import { getUserInfo } from '../lib/auth.js';
import { showSuccess, showError, showInfo } from '../components/toast.js';
import { APP_CONFIG } from '../lib/config.js';
import { fetchTeamMembers } from '../lib/team-service.js';
import { runOCRAnalysis } from '../lib/ai-router.js';

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

  setTimeout(() => window.initProyekMap && window.initProyekMap(data.latitude, data.longitude), 100);

  const renderStepper = () => `
    <div class="stepper-wrap">
      <div class="stepper-line-bg"></div>
      <div id="stepper-fill" class="stepper-line-fill" style="width: 0%"></div>
      
      <div class="step-item active" id="step-dot-1">
        <div class="step-circle">1</div>
        <div class="step-label">Identitas</div>
      </div>
      
      <div class="step-item" id="step-dot-2">
        <div class="step-circle">2</div>
        <div class="step-label">Teknis</div>
      </div>
      
      <div class="step-item" id="step-dot-3">
        <div class="step-circle">3</div>
        <div class="step-label">Pemilik & Tim</div>
      </div>
    </div>
  `;

  setTimeout(() => window.initProyekMap && window.initProyekMap(data.latitude, data.longitude), 100);

  const template = `
    <div id="proyek-form-page">
      <div class="page-header flex-between" style="margin-bottom: 2rem;">
        <div>
          <button class="btn btn-ghost btn-sm" onclick="window.navigate('proyek')" style="margin-bottom:8px">
            <i class="fas fa-arrow-left"></i> Kembali
          </button>
          <h1 class="page-title">${isEdit ? 'Edit Proyek' : 'Proyek SLF Baru'}</h1>
        </div>
        ${!isEdit ? `
          <div class="ai-scanner-btn" onclick="window._triggerOCRScan()">
            <i class="fas fa-expand-arrows-alt"></i>
            <span>Scan IMB via AI OCR</span>
          </div>
        ` : ''}
      </div>

      ${renderStepper()}

      <form id="proyek-form" onsubmit="window.submitProyek(event)">
        
        <!-- STEP 1: IDENTITAS & LOKASI -->
        <div class="form-step-section active" id="step-1">
          <div style="display:grid; grid-template-columns: 1.5fr 1fr; gap: 24px;">
            <div class="card">
              <div class="card-title" style="font-weight:700; color:var(--brand-600); border-bottom:1px solid var(--border); padding-bottom:12px; margin-bottom:20px;">
                <i class="fas fa-building mr-2"></i> 1. Identitas Bangunan
              </div>
              <div class="form-group">
                <label class="form-label">Nama Bangunan <span class="required">*</span></label>
                <input type="text" class="form-input" name="nama_bangunan" value="${data.nama_bangunan || ''}" placeholder="Gedung Perkantoran XYZ" required />
              </div>
              <div class="grid-2">
                <div class="form-group">
                  <label class="form-label">Jenis Bangunan <span class="required">*</span></label>
                  <select class="form-select" name="jenis_bangunan" required>
                    <option value="">Pilih Jenis</option>
                    ${jenis.map(j => `<option value="${j}" ${data.jenis_bangunan === j ? 'selected' : ''}>${j}</option>`).join('')}
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Konstruksi Utama</label>
                  <select class="form-select" name="jenis_konstruksi">
                    ${konstruksi.map(k => `<option value="${k}" ${data.jenis_konstruksi === k ? 'selected' : ''}>${k}</option>`).join('')}
                  </select>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Alamat Lengkap <span class="required">*</span></label>
                <textarea class="form-textarea" name="alamat" rows="3" required placeholder="Jl. Contoh No. 123, Kelurahan, Kecamatan, Kota">${data.alamat || ''}</textarea>
              </div>
            </div>

            <div class="card">
              <div class="card-title" style="font-weight:700; border-bottom:1px solid var(--border); padding-bottom:12px; margin-bottom:20px;">
                <i class="fas fa-location-dot mr-2"></i> Geolocation
              </div>
              <div id="proyek-map" style="width:100%;height:320px;border-radius:12px;margin: 16px 0; border:1px solid var(--border);"></div>
              <div class="grid-2">
                <div class="form-group">
                   <label class="form-label">Latitude</label>
                   <input type="text" class="form-input" id="input-lat" name="latitude" value="${data.latitude || ''}" readonly style="background:var(--bg-main)" />
                </div>
                <div class="form-group">
                   <label class="form-label">Longitude</label>
                   <input type="text" class="form-input" id="input-lng" name="longitude" value="${data.longitude || ''}" readonly style="background:var(--bg-main)" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- STEP 2: TEKNIS & TANAH -->
        <div class="form-step-section" id="step-2">
           <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 24px;">
              <div class="card">
                <div class="card-title" style="font-weight:700; color:var(--brand-600); border-bottom:1px solid var(--border); padding-bottom:12px; margin-bottom:20px;">
                  <i class="fas fa-ruler-combined mr-2"></i> 2. Parameter Teknis
                </div>
                <div class="grid-2">
                  <div class="form-group">
                    <label class="form-label">Luas Bangunan (m²)</label>
                    <input type="number" class="form-input" name="luas_bangunan" value="${data.luas_bangunan || ''}" placeholder="0" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Jumlah Lantai</label>
                    <input type="number" class="form-input" name="jumlah_lantai" value="${data.jumlah_lantai || ''}" placeholder="1" />
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label">Nomor PBG / IMB</label>
                  <input type="text" class="form-input" name="nomor_pbg" value="${data.nomor_pbg || ''}" placeholder="No. PBG / IMB" />
                </div>
                <div style="margin-top:20px; padding:20px; background:rgba(139, 92, 246, 0.03); border-radius:12px; border:1px dashed var(--brand-100)">
                   <label class="form-label" style="color:var(--brand-600)">Intensitas Bangunan (SIMBG)</label>
                   <div class="grid-4 mt-2">
                      <div class="form-group"><label class="form-label text-xs">GSB</label><input type="number" step="0.1" class="form-input" name="gsb" value="${data.gsb || ''}" /></div>
                      <div class="form-group"><label class="form-label text-xs">KDB</label><input type="number" step="0.1" class="form-input" name="kdb" value="${data.kdb || ''}" /></div>
                      <div class="form-group"><label class="form-label text-xs">KLB</label><input type="number" step="0.1" class="form-input" name="klb" value="${data.klb || ''}" /></div>
                      <div class="form-group"><label class="form-label text-xs">KDH</label><input type="number" step="0.1" class="form-input" name="kdh" value="${data.kdh || ''}" /></div>
                   </div>
                </div>
              </div>

              <div class="card">
                <div class="card-title" style="font-weight:700; border-bottom:1px solid var(--border); padding-bottom:12px; margin-bottom:20px;">
                  <i class="fas fa-map-marked-alt mr-2"></i> Data Tanah
                </div>
                <div class="form-group">
                  <label class="form-label">Nomor Sertifikat / Dokumen</label>
                  <input type="text" class="form-input" name="no_dokumen_tanah" value="${data.no_dokumen_tanah || ''}" />
                </div>
                <div class="form-group">
                  <label class="form-label">Nama Pemilik Tanah</label>
                  <input type="text" class="form-input" name="nama_pemilik_tanah" value="${data.nama_pemilik_tanah || ''}" />
                </div>
                <div class="form-group" style="margin-top:20px;">
                   <label class="form-label checkbox-label" style="display:flex; align-items:center; gap:10px; cursor:pointer">
                    <input type="checkbox" name="pemilik_tanah_sama" value="true" ${data.pemilik_tanah_sama ? 'checked' : ''} style="width:18px;height:18px" /> 
                    <span>Pemilik tanah sama dengan pemilik bangunan?</span>
                  </label>
                </div>
              </div>
           </div>
        </div>

        <!-- STEP 3: PEMILIK, TIM & AI -->
        <div class="form-step-section" id="step-3">
          <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 24px;">
            <div class="card">
              <div class="card-title" style="font-weight:700; color:var(--brand-600); border-bottom:1px solid var(--border); padding-bottom:12px; margin-bottom:20px;">
                <i class="fas fa-user-tie mr-2"></i> 3. Data Pemohon (Klien)
              </div>
              <div class="form-group">
                <label class="form-label">Nama Pemilik / Institusi <span class="required">*</span></label>
                <input type="text" class="form-input" name="pemilik" value="${data.pemilik || ''}" placeholder="PT XYZ / Bapak Budi" required />
              </div>
              <div class="grid-2">
                <div class="form-group">
                  <label class="form-label">Penanggung Jawab</label>
                  <input type="text" class="form-input" name="penanggung_jawab" value="${data.penanggung_jawab || ''}" />
                </div>
                <div class="form-group">
                  <label class="form-label">Telepon</label>
                  <input type="tel" class="form-input" name="telepon" value="${data.telepon || ''}" />
                </div>
              </div>
              <div class="form-group">
                 <label class="form-label">Email Pemilik</label>
                 <input type="email" class="form-input" name="email_pemilik" value="${data.email_pemilik || ''}" />
              </div>
            </div>

            <div class="card">
              <div class="card-title" style="font-weight:700; border-bottom:1px solid var(--border); padding-bottom:12px; margin-bottom:20px;">
                <i class="fas fa-users-gear mr-2"></i> Tim & Jadwal Audit
              </div>
              <div class="form-group">
                <label class="form-label">Delegasikan Ke (PIC Tim)</label>
                <select class="form-select" name="assigned_to">
                  <option value="">-- Pilih Anggota Tim --</option>
                  ${teamMembers.map(m => `<option value="${m.id}" ${data.assigned_to === m.id ? 'selected' : ''}>${m.full_name}</option>`).join('')}
                </select>
              </div>
              <div class="grid-2">
                <div class="form-group">
                  <label class="form-label">Mulai Audit</label>
                  <input type="date" class="form-input" name="tanggal_mulai" value="${data.tanggal_mulai || ''}" />
                </div>
                <div class="form-group">
                  <label class="form-label">Target Selesai</label>
                  <input type="date" class="form-input" name="tanggal_target" value="${data.tanggal_target || ''}" />
                </div>
              </div>
              
              <div class="ai-panel mt-4" style="padding:16px; background:var(--brand-50); border:1px solid var(--brand-100); border-radius:12px;">
                 <div style="display:flex; align-items:center; gap:10px; margin-bottom:10px;">
                    <i class="fas fa-brain" style="color:var(--brand-500)"></i>
                    <strong style="font-size:0.8rem">AI-First Automation</strong>
                 </div>
                 <select class="form-select text-xs" name="ai_focus">
                    <option value="komprehensif">Fokus: Komprehensif</option>
                    <option value="struktur">Fokus: Integritas Struktur</option>
                    <option value="kebakaran">Fokus: Safety Proteksi</option>
                 </select>
              </div>
            </div>
          </div>
        </div>

        <div class="form-footer-nav">
          <button type="button" class="btn btn-ghost" id="btn-prev-step" onclick="window._switchStep(window._currentStep - 1)" style="visibility:hidden">
            <i class="fas fa-arrow-left"></i> Sebelumnya
          </button>
          
          <div style="display:flex; gap:12px">
            <button type="button" class="btn btn-primary" id="btn-next-step" onclick="window._switchStep(window._currentStep + 1)" style="min-width:150px">
              Selanjutnya <i class="fas fa-arrow-right"></i>
            </button>
            <button type="submit" class="btn btn-primary" style="min-width:200px; display:none" id="btn-submit-proyek">
              <i class="fas fa-check-circle"></i> ${isEdit ? 'Simpan Perubahan' : 'Selesaikan & Buka Proyek'}
            </button>
          </div>
        </div>

      </form>
    </div>
  `;

  window._switchStep = (nextStep) => {
    if (nextStep < 1 || nextStep > 3) return;
    
    // Update State
    window._currentStep = nextStep;
    
    // Toggle Sections
    document.querySelectorAll('.form-step-section').forEach((el, idx) => {
      el.classList.toggle('active', (idx + 1) === nextStep);
    });
    
    // Update Stepper Visuals
    document.querySelectorAll('.step-item').forEach((el, idx) => {
      el.classList.toggle('active', (idx + 1) === nextStep);
      el.classList.toggle('completed', (idx + 1) < nextStep);
    });
    
    const fill = document.getElementById('stepper-fill');
    if (fill) fill.style.width = ((nextStep - 1) / 2 * 100) + '%';
    
    // Update Buttons
    const btnPrev = document.getElementById('btn-prev-step');
    const btnNext = document.getElementById('btn-next-step');
    const btnSubmit = document.getElementById('btn-submit-proyek');
    
    if (btnPrev) btnPrev.style.visibility = nextStep === 1 ? 'hidden' : 'visible';
    if (btnNext) btnNext.style.display = nextStep === 3 ? 'none' : 'block';
    if (btnSubmit) btnSubmit.style.display = nextStep === 3 ? 'block' : 'none';

    // Map refresh if step 1
    if (nextStep === 1) {
       setTimeout(() => {
         if (window._proyekMap) window._proyekMap.invalidateSize();
       }, 50);
    }
    
    // Scroll to top
    document.getElementById('main-content')?.scrollTo(0, 0);
  };

  return template;
}

window.fillSampleData = function() {
  const form = document.getElementById('proyek-form');
  if (!form) return;
  form.elements['nama_bangunan'].value = 'Gedung Rektorat Universitas Teknologi';
  form.elements['jenis_bangunan'].value = 'Pendidikan';
  form.elements['jenis_konstruksi'].value = 'Beton Bertulang';
  form.elements['alamat'].value = 'Jl. Anggrek Cendrawasih No. 45, Kecamatan Pakubuwono, Kota Megapolitan';
  form.elements['latitude'].value = '-6.208800';
  form.elements['longitude'].value = '106.845600';
  if (window._proyekMarker) {
    window._proyekMarker.setLatLng([-6.2088, 106.8456]);
    window._proyekMap.panTo([-6.2088, 106.8456]);
  }
  form.elements['luas_bangunan'].value = '4200';
  form.elements['jumlah_lantai'].value = '8';
  form.elements['nomor_pbg'].value = 'PBG/2010/REK-UT/0042';
  form.elements['pemilik'].value = 'Yayasan Pendidikan Teknologi';
  form.elements['penanggung_jawab'].value = 'Dr. Eng. Kusuma Wardana';
  form.elements['telepon'].value = '0812-3456-7890';
  form.elements['email_pemilik'].value = 'rektorat@univtek.ac.id';
};

window.submitProyek = async function(event) {
  event.preventDefault();
  const form = event.target;
  const btn  = document.getElementById('btn-submit-proyek');

  const data = Object.fromEntries(new FormData(form));
  const isEdit = !!new URLSearchParams(window.location.hash.split('?')[1]).get('id');
  const id   = new URLSearchParams(window.location.hash.split('?')[1]).get('id');

  // Basic validation
  if (!data.nama_bangunan || !data.pemilik || !data.alamat) {
    showError('Lengkapi field yang wajib diisi (*)');
    return;
  }

  // Filter properti agar hanya sesuai schema 'proyek' yang valid
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
  };

  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Menyimpan...';

  try {
    const user = getUserInfo();
    const payload = {
      ...cleanData,
      updated_at: new Date().toISOString(),
    };
    
    if (user?.id && user.id.length > 15) {
      payload.created_by = user.id;
    }

    let error;
    let createdId = id;

    if (isEdit && id) {
      ({ error } = await supabase.from('proyek').update(payload).eq('id', id));
    } else {
      const { data: created, error: insErr } = await supabase.from('proyek').insert(payload).select('id').single();
      error = insErr;
      if (created) createdId = created.id;
    }

    if (error) throw error;
    showSuccess(isEdit ? 'Proyek diperbarui!' : 'Proyek Berhasil Dibuat!');
    setTimeout(() => navigate('proyek-detail', { id: createdId }), 800);
  } catch (err) {
    showError('Gagal: ' + err.message);
    btn.disabled = false;
    btn.innerHTML = `<i class="fas fa-save"></i> Simpan`;
  }
};

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

  const map = window.L.map('proyek-map').setView([lat, lng], 18);
  window._proyekMap = map;

  window.L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap'
  }).addTo(map);

  const icon = window.L.divIcon({
    className: 'modern-pin-wrap',
    html: `<div class="modern-pin" style="width:44px; height:44px; font-size:20px"></div>`,
    iconSize: [44, 44],
    iconAnchor: [22, 44]
  });

  const marker = window.L.marker([lat, lng], { icon, draggable: true }).addTo(map);
  window._proyekMarker = marker;
  
  if (!initLat) {
     document.getElementById('input-lat').value = lat.toFixed(6);
     document.getElementById('input-lng').value = lng.toFixed(6);
  }

  marker.on('dragend', function(e) {
    const pos = marker.getLatLng();
    document.getElementById('input-lat').value = pos.lat.toFixed(6);
    document.getElementById('input-lng').value = pos.lng.toFixed(6);
  });
};

window._triggerOCRScan = () => {
  // OCR Scan logic (impl from original)
};
