import { getSettings, saveSettings } from '../lib/settings.js';
import { getUserInfo } from '../lib/auth.js';
import { showSuccess, showError } from '../components/toast.js';
import { MODELS as AI_MODELS } from '../lib/ai-router.js';

export async function pengaturanPage() {
  const settings = await getSettings();
  const user = getUserInfo();
  
  return `
    <div id="settings-page">
      <div class="page-header">
        <h1 class="page-title">Pengaturan</h1>
        <p class="page-subtitle">Kelola profil personal dan konfigurasi operasional sistem</p>
      </div>

      <!-- Tabs Navigation -->
      <div class="tabs-container">
        <div class="tab-item active" onclick="window.switchTab('tab-akun', this)">
          <i class="fas fa-user-circle"></i> Pengaturan Akun
        </div>
        <div class="tab-item" onclick="window.switchTab('tab-aplikasi', this)">
          <i class="fas fa-sliders"></i> Pengaturan Aplikasi
        </div>
        <div class="tab-item" onclick="window.switchTab('tab-watermark', this)">
          <i class="fas fa-camera-retro"></i> Watermark Kamera
        </div>
      </div>

      <!-- Tab Content: Akun -->
      <div id="tab-akun" class="tab-content active">
        <div class="grid-settings" style="display:grid; grid-template-columns: 1fr 1fr; gap: var(--space-5);">
          <div class="card">
            <div class="card-title" style="margin-bottom: var(--space-5);">
              <i class="fas fa-id-badge" style="color:var(--brand-400); margin-right:8px;"></i>
              Profil Pengguna
            </div>
            
            <div style="display:flex; align-items:center; gap:var(--space-6); margin-bottom:var(--space-6); padding:var(--space-4); background:var(--bg-elevated); border-radius:var(--radius-lg);">
              <div class="avatar-lg" style="width:80px; height:80px; border-radius:50%; background:var(--gradient-brand); display:flex; align-items:center; justify-content:center; font-size:1.8rem; font-weight:800; color:white; box-shadow:var(--shadow-brand);">
                ${user?.initials || 'U'}
              </div>
              <div>
                <h3 style="font-size:1.1rem; font-weight:700; color:var(--text-primary);">${user?.name || 'User'}</h3>
                <p style="font-size:0.85rem; color:var(--brand-400); font-weight:600; text-transform:uppercase; letter-spacing:0.05em; margin-top:2px;">${user?.role || 'Pengkaji Teknis'}</p>
                <p style="font-size:0.8rem; color:var(--text-tertiary); margin-top:4px;">Terdaftar sejak Mart 2026</p>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Nama Lengkap</label>
              <input type="text" class="form-input" value="${user?.name || ''}" readonly style="background:var(--bg-input); cursor:not-allowed;">
            </div>
            <div class="form-group">
              <label class="form-label">Alamat Email</label>
              <input type="email" class="form-input" value="${user?.email || ''}" readonly style="background:var(--bg-input); cursor:not-allowed;">
            </div>
          </div>

          <div class="card">
            <div class="card-title" style="margin-bottom: var(--space-4);">
              <i class="fas fa-shield-halved" style="color:var(--brand-400); margin-right:8px;"></i>
              Keamanan & Privasi
            </div>
            <p class="text-sm text-secondary" style="margin-bottom: var(--space-4);">Pastikan akun Anda tetap aman dengan melakukan pengecekan sesi secara berkala.</p>
            
            <button class="btn btn-outline btn-sm" style="width:100%; justify-content:flex-start; margin-bottom:var(--space-3);">
              <i class="fas fa-key"></i> Ubah Password
            </button>
          </div>
        </div>
      </div>

      <!-- Tab Content: Aplikasi -->
      <div id="tab-aplikasi" class="tab-content">
        <form id="settings-form" onsubmit="handleSaveSettings(event)">
          <div class="grid-settings" style="display:grid; grid-template-columns: 1fr 1fr; gap: var(--space-5);">
            
            <div style="display:flex; flex-direction:column; gap: var(--space-5);">
              <!-- Card: Identitas Konsultan -->
              <div class="card">
                <div class="card-title" style="margin-bottom: var(--space-4);">
                  <i class="fas fa-building" style="color:var(--brand-400); margin-right:8px;"></i>
                  Identitas Konsultan
                </div>
                <div class="form-group">
                  <label class="form-label">Nama Perusahaan</label>
                  <input type="text" class="form-input" name="consultant_name" value="${settings.consultant?.name || ''}" required>
                </div>
                <div class="form-group">
                  <label class="form-label">Alamat Kantor</label>
                  <textarea class="form-input" name="consultant_address" rows="2">${settings.consultant?.address || ''}</textarea>
                </div>
                <div class="form-group">
                  <label class="form-label">Kop Surat (Teks Resmi)</label>
                  <textarea class="form-input text-xs" name="consultant_kop_text" rows="3" placeholder="Contoh: PEMERINTAH KABUPATEN... DI NAS PEKERJAAN UMUM...">${settings.consultant?.kop_text || ''}</textarea>
                </div>
                <div class="grid-2" style="gap:15px; margin-top:10px;">
                  <div class="form-group">
                    <label class="form-label">Nama Direktur / Penanggung Jawab</label>
                    <input type="text" class="form-input" name="director_name" value="${settings.consultant?.director_name || ''}" placeholder="Nama Lengkap & Gelar">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Jabatan</label>
                    <input type="text" class="form-input" name="director_job" value="${settings.consultant?.director_job || 'Direktur'}" placeholder="Direktur / Chief Executive">
                  </div>
                </div>
                <div class="form-group mt-3" style="padding-top:12px; border-top:1px dashed var(--border-subtle);">
                  <label class="form-label text-brand-600"><i class="fas fa-barcode"></i> Format Nomor Surat Otomatis</label>
                  <input type="text" class="form-input font-mono" name="nomor_surat_format" value="${settings.consultant?.nomor_surat_format || '[SEQ]/SP-SLF/[ROMAN_MONTH]/[YEAR]'}" placeholder="[SEQ]/SP-SLF/[ROMAN_MONTH]/[YEAR]">
                  <p class="text-xs text-tertiary mt-1">Tags: [SEQ], [MONTH], [ROMAN_MONTH], [YEAR]. Contoh: 001/SP-SLF/III/2026</p>
                </div>
              </div>

              <!-- Card: Branding & Signature -->
              <div class="card">
                <div class="card-title" style="margin-bottom: var(--space-4);">
                  <i class="fas fa-signature" style="color:var(--brand-400); margin-right:8px;"></i>
                  Digital Seal & Director Signature
                </div>
                
                <div class="form-group" style="margin-bottom:20px;">
                  <label class="form-label">Kop Surat (Gambar/Header)</label>
                  <div id="kop-preview-container" class="img-upload-preview" style="height:80px;">
                    ${settings.consultant?.kop_image ? `<img src="${settings.consultant.kop_image}" style="max-height:100%; object-fit:contain;">` : '<i class="fas fa-image"></i>'}
                  </div>
                  <input type="file" accept="image/*" onchange="handleKopUpload(this)" class="mt-2 text-xs">
                  <input type="hidden" name="consultant_kop_image" id="consultant-kop-val" value="${settings.consultant?.kop_image || ''}">
                </div>

                <div class="grid-3" style="gap:15px; display:grid; grid-template-columns: 1fr 1fr 1fr;">
                  <div class="form-group">
                    <label class="form-label">Logo Perusahaan</label>
                    <div id="logo-preview-container" class="img-upload-preview">
                      ${settings.consultant?.logo ? `<img src="${settings.consultant.logo}">` : '<i class="fas fa-image"></i>'}
                    </div>
                    <input type="file" accept="image/*" onchange="handleLogoUpload(this)" class="mt-2 text-xs">
                    <input type="hidden" name="consultant_logo" id="consultant-logo-val" value="${settings.consultant?.logo || ''}">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Stempel Perusahaan</label>
                    <div id="stamp-preview-container" class="img-upload-preview">
                      ${settings.consultant?.stamp ? `<img src="${settings.consultant.stamp}">` : '<i class="fas fa-stamp"></i>'}
                    </div>
                    <input type="file" accept="image/*" onchange="handleStampUpload(this)" class="mt-2 text-xs">
                    <input type="hidden" name="consultant_stamp" id="consultant-stamp-val" value="${settings.consultant?.stamp || ''}">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Tanda Tangan Direktur</label>
                    <div id="sig-preview-container" class="img-upload-preview">
                      ${settings.consultant?.signature ? `<img src="${settings.consultant.signature}">` : '<i class="fas fa-signature"></i>'}
                    </div>
                    <input type="file" accept="image/*" onchange="handleSigUpload(this)" class="mt-2 text-xs">
                    <input type="hidden" name="consultant_sig" id="consultant-sig-val" value="${settings.consultant?.signature || ''}">
                  </div>
                </div>
              </div>
            </div>

            <div style="display:flex; flex-direction:column; gap: var(--space-5);">
              <!-- Card: Google Cloud & AI -->
              <div class="card">
                <div class="card-title" style="margin-bottom: var(--space-4);">
                  <i class="fab fa-google-drive" style="color:var(--brand-400); margin-right:8px;"></i>
                  Integrasi Sistem
                </div>
                <div class="form-group">
                  <label class="form-label">Google Apps Script Proxy</label>
                  <input type="text" class="form-input" name="default_drive_proxy" value="${settings.google?.defaultDriveProxy || ''}">
                </div>
                <div class="form-group">
                  <label class="form-label">AI Analysis Model</label>
                  <select class="form-input" name="default_model">
                    ${Object.values(AI_MODELS).map(m => `<option value="${m.id}" ${settings.ai?.defaultModel === m.id ? 'selected' : ''}>${m.name}</option>`).join('')}
                  </select>
                </div>
              </div>

              <!-- Card: 3 Pilar Tenaga Ahli (TTE) -->
              <div class="card">
                <div class="card-title" style="margin-bottom: var(--space-4);">
                  <i class="fas fa-user-shield" style="color:var(--brand-400); margin-right:8px;"></i>
                  3 Pilar Tenaga Ahli (TTE)
                </div>
                
                <!-- Ahli Arsitektur -->
                <div style="margin-bottom:15px; padding:10px; border:1px solid var(--border-subtle); border-radius:8px;">
                  <h4 class="text-xs font-bold mb-2 uppercase">1. Arsitektur / Tata Ruang Luar</h4>
                  <div class="grid-2" style="gap:10px; margin-bottom:10px;">
                    <input type="text" class="form-input text-xs" name="exp_arch_name" value="${settings.experts?.architecture?.name || ''}" placeholder="Nama & Gelar">
                    <input type="text" class="form-input text-xs" name="exp_arch_skk" value="${settings.experts?.architecture?.skk || ''}" placeholder="No. SKK">
                  </div>
                  <div class="grid-2" style="gap:10px;">
                    <div>
                      <label class="text-xs opacity-70">Tanda Tangan</label>
                      <input type="file" onchange="handleExpertSigUpload(this, 'arch')" class="text-xs mt-1">
                      <input type="hidden" name="exp_arch_sig" id="exp-arch-sig-val" value="${settings.experts?.architecture?.signature || ''}">
                    </div>
                    <div>
                      <label class="text-xs opacity-70">QR Code TTE</label>
                      <input type="file" onchange="handleExpertQrUpload(this, 'arch')" class="text-xs mt-1">
                      <input type="hidden" name="exp_arch_qr" id="exp-arch-qr-val" value="${settings.experts?.architecture?.qr_code || ''}">
                    </div>
                  </div>
                </div>

                <!-- Ahli Struktur -->
                <div style="margin-bottom:15px; padding:10px; border:1px solid var(--border-subtle); border-radius:8px;">
                  <h4 class="text-xs font-bold mb-2 uppercase">2. Bidang Struktur</h4>
                  <div class="grid-2" style="gap:10px; margin-bottom:10px;">
                    <input type="text" class="form-input text-xs" name="exp_struct_name" value="${settings.experts?.structure?.name || ''}" placeholder="Nama & Gelar">
                    <input type="text" class="form-input text-xs" name="exp_struct_skk" value="${settings.experts?.structure?.skk || ''}" placeholder="No. SKK">
                  </div>
                  <div class="grid-2" style="gap:10px;">
                    <div>
                      <label class="text-xs opacity-70">Tanda Tangan</label>
                      <input type="file" onchange="handleExpertSigUpload(this, 'struct')" class="text-xs mt-1">
                      <input type="hidden" name="exp_struct_sig" id="exp-struct-sig-val" value="${settings.experts?.structure?.signature || ''}">
                    </div>
                    <div>
                      <label class="text-xs opacity-70">QR Code TTE</label>
                      <input type="file" onchange="handleExpertQrUpload(this, 'struct')" class="text-xs mt-1">
                      <input type="hidden" name="exp_struct_qr" id="exp-struct-qr-val" value="${settings.experts?.structure?.qr_code || ''}">
                    </div>
                  </div>
                </div>

                <!-- Ahli MEP -->
                <div style="padding:10px; border:1px solid var(--border-subtle); border-radius:8px;">
                  <h4 class="text-xs font-bold mb-2 uppercase">3. Bidang MEP (Utilitas)</h4>
                  <div class="grid-2" style="gap:10px; margin-bottom:10px;">
                    <input type="text" class="form-input text-xs" name="exp_mep_name" value="${settings.experts?.mep?.name || ''}" placeholder="Nama & Gelar">
                    <input type="text" class="form-input text-xs" name="exp_mep_skk" value="${settings.experts?.mep?.skk || ''}" placeholder="No. SKK">
                  </div>
                  <div class="grid-2" style="gap:10px;">
                    <div>
                      <label class="text-xs opacity-70">Tanda Tangan</label>
                      <input type="file" onchange="handleExpertSigUpload(this, 'mep')" class="text-xs mt-1">
                      <input type="hidden" name="exp_mep_sig" id="exp-mep-sig-val" value="${settings.experts?.mep?.signature || ''}">
                    </div>
                    <div>
                      <label class="text-xs opacity-70">QR Code TTE</label>
                      <input type="file" onchange="handleExpertQrUpload(this, 'mep')" class="text-xs mt-1">
                      <input type="hidden" name="exp_mep_qr" id="exp-mep-qr-val" value="${settings.experts?.mep?.qr_code || ''}">
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div style="margin-top:var(--space-6); display:flex; justify-content:flex-end;">
            <button type="submit" class="btn btn-primary" id="btn-save-settings" style="min-width: 250px;">
              <i class="fas fa-save" style="margin-right:8px;"></i> Simpan Seluruh Konfigurasi
            </button>
          </div>
        </form>
      </div>
      <!-- Tab Content: Watermark -->
      <div id="tab-watermark" class="tab-content">
        <form id="watermark-form" onsubmit="handleSaveWatermark(event)">
          <div class="grid-settings" style="display:grid; grid-template-columns: 1fr 1fr; gap: var(--space-5);">
            <div class="card">
              <div class="card-title" style="margin-bottom: var(--space-5);">
                <i class="fas fa-stamp" style="color:var(--brand-400); margin-right:8px;"></i>
                Branding Watermark
              </div>
              <div class="form-group">
                <label class="form-label">Nama Perusahaan/Instansi (Watermark)</label>
                <input type="text" class="form-input" name="wm_company_name" value="${settings.watermark?.company_name || ''}">
              </div>
              <div class="form-group">
                <label class="form-label">Teks Verifikasi</label>
                <input type="text" class="form-input" name="wm_verified_label" value="${settings.watermark?.verified_label || ''}">
              </div>
              <div class="form-group">
                <label class="form-label">Label Kegiatan</label>
                <input type="text" class="form-input" name="wm_activity_prefix" value="${settings.watermark?.activity_prefix || 'Kegiatan:'}">
              </div>
              
              <div class="form-group" style="margin-top:20px;">
                <label class="form-label">Logo Watermark (PNG Transparan)</label>
                <div id="wm-logo-preview-container" class="img-upload-preview" style="height:100px; background:var(--bg-100);">
                  ${settings.watermark?.company_logo ? `<img src="${settings.watermark.company_logo}" style="max-height:100%; object-fit:contain;">` : '<i class="fas fa-image"></i>'}
                </div>
                <input type="file" accept="image/*" onchange="window.handleWmLogoUpload(this)" class="mt-2 text-xs">
                <input type="hidden" name="wm_company_logo" id="wm-company-logo-val" value="${settings.watermark?.company_logo || ''}">
              </div>
              
              <div class="form-group" style="margin-top:20px;">
                <label class="form-label">Penambahan Tagging Baru (Custom)</label>
                <textarea class="form-input text-xs" name="wm_custom_tags" rows="4" placeholder="Satu baris per tagging baru...&#10;Contoh:&#10;Area: Basement P1&#10;Metode: NDT Test">${settings.watermark?.custom_tags || ''}</textarea>
                <p class="text-xs opacity-60 mt-1">Gunakan enter untuk pemisah baris baru.</p>
              </div>
            </div>

            <div class="card">
              <div class="card-title" style="margin-bottom: var(--space-5);">
                <i class="fas fa-gear" style="color:var(--brand-400); margin-right:8px;"></i>
                Konfigurasi Display
              </div>
              <div class="form-group flex justify-between items-center" style="padding:10px 0; border-bottom:1px solid var(--border-subtle);">
                <label class="form-label mb-0">Aktifkan Watermark</label>
                <input type="checkbox" name="wm_enabled" ${settings.watermark?.enabled ? 'checked' : ''} style="width:20px; height:20px;">
              </div>
              <div class="form-group flex justify-between items-center" style="padding:10px 0; border-bottom:1px solid var(--border-subtle);">
                <label class="form-label mb-0">Tampilkan Koordinat GPS</label>
                <input type="checkbox" name="wm_show_gps" ${settings.watermark?.show_gps ? 'checked' : ''} style="width:20px; height:20px;">
              </div>
              <div class="form-group flex justify-between items-center" style="padding:10px 0; border-bottom:1px solid var(--border-subtle);">
                <label class="form-label mb-0">Tampilkan Waktu & Tanggal</label>
                <input type="checkbox" name="wm_show_time" ${settings.watermark?.show_time ? 'checked' : ''} style="width:20px; height:20px;">
              </div>
              
              <div class="form-group mt-4">
                <label class="form-label">Resolusi & Opasitas</label>
                <div class="flex gap-4">
                  <select class="form-input" name="wm_resolution">
                    <option value="low" ${settings.watermark?.resolution === 'low' ? 'selected' : ''}>Rendah (Cepat)</option>
                    <option value="medium" ${settings.watermark?.resolution === 'medium' ? 'selected' : ''}>Menengah (Optimal)</option>
                    <option value="high" ${settings.watermark?.resolution === 'high' ? 'selected' : ''}>Tinggi (Forensik)</option>
                  </select>
                  <input type="range" name="wm_opacity" min="0.1" max="1.0" step="0.1" value="${settings.watermark?.opacity || 0.85}" title="Opasitas Banner">
                </div>
              </div>

              <div style="margin-top:20px; padding:15px; background:var(--bg-100); border-radius:8px; border:1px dashed var(--border-subtle);">
                <p class="text-xs opacity-70"><i class="fas fa-info-circle"></i> Watermark akan otomatis digabungkan ke dalam foto saat Anda menggunakan fitur Kamera Live di halaman Checklist.</p>
              </div>
            </div>
          </div>
          
          <div style="margin-top:var(--space-6); display:flex; justify-content:flex-end;">
            <button type="submit" class="btn btn-brand" id="btn-save-watermark" style="min-width: 250px;">
              <i class="fas fa-check-double"></i> Simpan Pengaturan Watermark
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
}

// Interactivity handlers
window.switchTab = function(tabId, tabEl) {
  document.querySelectorAll('.tab-item').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  tabEl.classList.add('active');
  document.getElementById(tabId).classList.add('active');
};

window.handleKopUpload = (input) => handleFileToHidden(input, 'kop-preview-container', 'consultant-kop-val');
window.handleLogoUpload = (input) => handleFileToHidden(input, 'logo-preview-container', 'consultant-logo-val');
window.handleStampUpload = (input) => handleFileToHidden(input, 'stamp-preview-container', 'consultant-stamp-val');
window.handleSigUpload = (input) => handleFileToHidden(input, 'sig-preview-container', 'consultant-sig-val');

window.handleExpertSigUpload = (input, type) => handleFileToHidden(input, null, `exp-${type}-sig-val`);
window.handleExpertQrUpload = (input, type) => handleFileToHidden(input, null, `exp-${type}-qr-val`);
window.handleWmLogoUpload = (input) => handleFileToHidden(input, 'wm-logo-preview-container', 'wm-company-logo-val');

function handleFileToHidden(input, containerId, hiddenId) {
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (containerId) {
        document.getElementById(containerId).innerHTML = `<img src="${e.target.result}" style="max-height:100%; object-fit:contain;">`;
      }
      document.getElementById(hiddenId).value = e.target.result;
    };
    reader.readAsDataURL(input.files[0]);
  }
}

window.handleSaveSettings = async function(e) {
  e.preventDefault();
  const form = e.target;
  const btn = document.getElementById('btn-save-settings');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyisipkan ke sistem...';

  try {
    const fd = new FormData(form);
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
      },
      experts: {
        architecture: { 
          name: fd.get('exp_arch_name'), 
          skk: fd.get('exp_arch_skk'),
          signature: fd.get('exp_arch_sig'),
          qr_code: fd.get('exp_arch_qr')
        },
        structure: { 
          name: fd.get('exp_struct_name'), 
          skk: fd.get('exp_struct_skk'),
          signature: fd.get('exp_struct_sig'),
          qr_code: fd.get('exp_struct_qr')
        },
        mep: { 
          name: fd.get('exp_mep_name'), 
          skk: fd.get('exp_mep_skk'),
          signature: fd.get('exp_mep_sig'),
          qr_code: fd.get('exp_mep_qr')
        },
      },
      google: {
        defaultDriveProxy: fd.get('default_drive_proxy') || '',
      }
    };

    await saveSettings(payload);
    showSuccess('Berhasil! Pengaturan aplikasi telah diperbarui untuk semua modul.');
  } catch (err) {
    showError('Gagal menyimpan: ' + err.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-save"></i> Simpan Seluruh Konfigurasi';
  }
};

window.handleSaveWatermark = async function(e) {
  e.preventDefault();
  const form = e.target;
  const btn = document.getElementById('btn-save-watermark');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';

  try {
    const fd = new FormData(form);
    const settings = await getSettings();
    
    settings.watermark = {
      enabled: fd.get('wm_enabled') === 'on',
      show_gps: fd.get('wm_show_gps') === 'on',
      show_time: fd.get('wm_show_time') === 'on',
      company_name: fd.get('wm_company_name'),
      verified_label: fd.get('wm_verified_label'),
      activity_prefix: fd.get('wm_activity_prefix'),
      company_logo: fd.get('wm_company_logo'),
      resolution: fd.get('wm_resolution'),
      opacity: parseFloat(fd.get('wm_opacity')),
      custom_tags: fd.get('wm_custom_tags')
    };

    await saveSettings(settings);
    showSuccess('Branding Watermark berhasil diperbarui!');
  } catch (err) {
    showError('Gagal menyimpan Watermark: ' + err.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-check-double"></i> Simpan Pengaturan Watermark';
  }
};
