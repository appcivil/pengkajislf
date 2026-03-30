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

  if (isEdit) {
    const { data: existing } = await supabase.from('proyek').select('*').eq('id', params.id).maybeSingle();
    data = existing || {};
  }

  const teamMembers = await fetchTeamMembers();

  const jenis = ['Bangunan Gedung', 'Hunian', 'Komersial', 'Industri', 'Pendidikan', 'Kesehatan', 'Ibadah', 'Pemerintahan', 'Campuran'];
  const konstruksi = ['Beton Bertulang', 'Baja', 'Kayu', 'Bata', 'Komposit'];

  setTimeout(() => window.initProyekMap && window.initProyekMap(data.latitude, data.longitude), 100);

  return `
    <div id="proyek-form-page">
      <div class="page-header flex-between">
        <div>
          <button class="btn btn-ghost btn-sm" onclick="window.navigate('proyek')" style="margin-bottom:8px">
            <i class="fas fa-arrow-left"></i> Kembali
          </button>
          <h1 class="page-title">${isEdit ? 'Edit Proyek' : 'Proyek SLF Baru'}</h1>
          <p class="page-subtitle">${isEdit ? 'Perbarui data proyek pengkajian SLF' : 'Isi data bangunan yang akan dikaji Sertifikat Laik Fungsinya'}</p>
        </div>
        ${!isEdit ? `
          <div class="ai-scanner-btn" onclick="window._triggerOCRScan()">
            <i class="fas fa-expand-arrows-alt"></i>
            <span>Scan IMB via AI OCR</span>
          </div>
        ` : ''}
      </div>

      <form id="proyek-form" onsubmit="submitProyek(event)">
        <div style="display:grid;grid-template-columns:2fr 1fr;gap:var(--space-5)">

          <!-- Left Column -->
          <div style="display:flex;flex-direction:column;gap:var(--space-5)">

            <!-- Data Bangunan -->
            <div class="card">
              <div class="card-title" style="margin-bottom:var(--space-5)">
                <i class="fas fa-building" style="color:var(--brand-400);margin-right:8px"></i>
                Data Bangunan
              </div>

              <div class="form-group">
                <label class="form-label">Nama Bangunan <span class="required">*</span></label>
                <input type="text" class="form-input" name="nama_bangunan"
                       value="${data.nama_bangunan || ''}" placeholder="Gedung Perkantoran XYZ" required />
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
                    <option value="">Pilih Konstruksi</option>
                    ${konstruksi.map(k => `<option value="${k}" ${data.jenis_konstruksi === k ? 'selected' : ''}>${k}</option>`).join('')}
                  </select>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Alamat Lengkap <span class="required">*</span></label>
                <textarea class="form-textarea" name="alamat" rows="2" placeholder="Jl. Contoh No. 123, Kelurahan, Kecamatan, Kota" required>${data.alamat || ''}</textarea>
              </div>

              <div class="grid-2">
                <div class="form-group">
                  <label class="form-label">Kecamatan <span class="required">*</span></label>
                  <input type="text" class="form-input" name="kecamatan" value="${data.kecamatan || ''}" placeholder="Kec. Banjarwangi" required />
                </div>
                <div class="form-group">
                  <label class="form-label">Kelurahan / Desa <span class="required">*</span></label>
                  <input type="text" class="form-input" name="kelurahan" value="${data.kelurahan || ''}" placeholder="Desa Kadongdong" required />
                </div>
              </div>

              <div class="grid-2">
                <div class="form-group">
                  <label class="form-label">Kota / Kabupaten <span class="required">*</span></label>
                  <input type="text" class="form-input" name="kota" value="${data.kota || ''}" placeholder="Kab. Garut" required />
                </div>
                <div class="form-group">
                  <label class="form-label">Provinsi <span class="required">*</span></label>
                  <input type="text" class="form-input" name="provinsi" value="${data.provinsi || ''}" placeholder="Jawa Barat" required />
                </div>
              </div>

              <!-- Peta GeoLocation -->
              <div class="form-group" style="margin-top:var(--space-4)">
                <label class="form-label">Titik Koordinat Asli GPS <span class="required">*</span></label>
                <div class="form-hint" style="margin-bottom:8px">Geser <i>pin</i> merah ke lokasi gedung dengan akurat. Anda juga dapat menggunakan lokasi Anda saat ini.</div>
                <div id="proyek-map" style="width:100%;height:250px;border-radius:var(--radius-md);border:1px solid var(--border-subtle);z-index:1;background:#f1f5f9"></div>
                <div class="grid-2" style="margin-top:8px">
                  <input type="text" class="form-input" id="input-lat" name="latitude" value="${data.latitude || ''}" placeholder="Latitude" readonly style="background:var(--bg-elevated);color:var(--text-300)" />
                  <input type="text" class="form-input" id="input-lng" name="longitude" value="${data.longitude || ''}" placeholder="Longitude" readonly style="background:var(--bg-elevated);color:var(--text-300)" />
                </div>
              </div>
            </div>

            <!-- Data Teknis -->
            <div class="card">
              <div class="card-title" style="margin-bottom:var(--space-5)">
                <i class="fas fa-ruler-combined" style="color:var(--brand-400);margin-right:8px"></i>
                Data Teknis Bangunan
              </div>

              <div class="grid-2">
                <div class="form-group">
                  <label class="form-label">Luas Bangunan (m²)</label>
                  <input type="number" class="form-input" name="luas_bangunan" value="${data.luas_bangunan || ''}" placeholder="1000" min="0" />
                </div>
                <div class="form-group">
                  <label class="form-label">Luas Lahan (m²)</label>
                  <input type="number" class="form-input" name="luas_lahan" value="${data.luas_lahan || ''}" placeholder="2000" min="0" />
                </div>
              </div>

              <div class="grid-2">
                <div class="form-group">
                  <label class="form-label">Jumlah Lantai</label>
                  <input type="number" class="form-input" name="jumlah_lantai" value="${data.jumlah_lantai || ''}" placeholder="5" min="1" />
                </div>
                <div class="form-group">
                  <label class="form-label">Tahun Dibangun</label>
                  <input type="number" class="form-input" name="tahun_dibangun" value="${data.tahun_dibangun || ''}" placeholder="2000" min="1900" max="${new Date().getFullYear()}" />
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Nomor PBG / IMB</label>
                <input type="text" class="form-input" name="nomor_pbg" value="${data.nomor_pbg || ''}" placeholder="No. IMB/PBG jika ada" />
                <span class="form-hint">Persetujuan Bangunan Gedung / Izin Mendirikan Bangunan</span>
              </div>

              <div class="form-group">
                <label class="form-label">Fungsi Utama Bangunan</label>
                <textarea class="form-textarea" name="fungsi_bangunan" rows="2" placeholder="Deskripsi fungsi utama bangunan...">${data.fungsi_bangunan || ''}</textarea>
              </div>

              <!-- SIMBG Technical Intensity -->
              <div style="margin-top:var(--space-4); padding:var(--space-4); background:var(--bg-elevated); border-radius:var(--radius-md); border-left:3px solid var(--brand-400)">
                <div class="card-title" style="margin-bottom:var(--space-3); font-size:0.9rem">
                  Data Intensitas Bangunan (SIMBG)
                </div>
                <div class="grid-4">
                  <div class="form-group">
                    <label class="form-label">GSB (m)</label>
                    <input type="number" step="0.1" class="form-input" name="gsb" value="${data.gsb || ''}" placeholder="3.0" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">KDB (%)</label>
                    <input type="number" step="0.1" class="form-input" name="kdb" value="${data.kdb || ''}" placeholder="60.0" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">KLB</label>
                    <input type="number" step="0.1" class="form-input" name="klb" value="${data.klb || ''}" placeholder="2.4" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">KDH (%)</label>
                    <input type="number" step="0.1" class="form-input" name="kdh" value="${data.kdh || ''}" placeholder="10.0" />
                  </div>
                </div>
              </div>
            </div>

            <!-- Data Tanah Detail (Sesuai SIMBG) -->
            <div class="card">
              <div class="card-title" style="margin-bottom:var(--space-5)">
                <i class="fas fa-map-marked-alt" style="color:var(--brand-400);margin-right:8px"></i>
                Data Tanah Detail (SIMBG Step 2)
              </div>
              
              <div class="grid-2">
                <div class="form-group">
                  <label class="form-label">Jenis Dokumen Tanah</label>
                  <select class="form-input" name="jenis_dokumen_tanah">
                    <option value="" disabled ${!data.jenis_dokumen_tanah ? 'selected' : ''}>Pilih Jenis...</option>
                    <option value="Sertifikat" ${data.jenis_dokumen_tanah === 'Sertifikat' ? 'selected' : ''}>Sertifikat</option>
                    <option value="AJB" ${data.jenis_dokumen_tanah === 'AJB' ? 'selected' : ''}>AJB (Akta Jual Beli)</option>
                    <option value="Girik" ${data.jenis_dokumen_tanah === 'Girik' ? 'selected' : ''}>Girik / Letter C</option>
                    <option value="Lainnya" ${data.jenis_dokumen_tanah === 'Lainnya' ? 'selected' : ''}>Lainnya</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Hak Kepemilikan (Status Hak)</label>
                  <select class="form-input" name="hak_kepemilikan">
                    <option value="" disabled ${!data.hak_kepemilikan ? 'selected' : ''}>Pilih Hak...</option>
                    <option value="Hak Milik" ${data.hak_kepemilikan === 'Hak Milik' ? 'selected' : ''}>Hak Milik (SHM)</option>
                    <option value="HGB" ${data.hak_kepemilikan === 'HGB' ? 'selected' : ''}>Hak Guna Bangunan (HGB)</option>
                    <option value="Hak Pakai" ${data.hak_kepemilikan === 'Hak Pakai' ? 'selected' : ''}>Hak Pakai (HP)</option>
                    <option value="Hak Kelola" ${data.hak_kepemilikan === 'Hak Kelola' ? 'selected' : ''}>Hak Pengelolaan</option>
                  </select>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Nomor Dokumen Tanah (No. Sertifikat)</label>
                <input type="text" class="form-input" name="no_dokumen_tanah" value="${data.no_dokumen_tanah || data.no_sertifikat || ''}" placeholder="Contoh: 10.17.19.06.1.01072" />
              </div>

              <div class="grid-2" style="margin-top:var(--space-2)">
                <div class="form-group">
                  <label class="form-label">Tanggal Terbit Dokumen</label>
                  <input type="date" class="form-input" name="tgl_terbit_tanah" value="${data.tgl_terbit_tanah || data.tgl_sertifikat || ''}" />
                </div>
                <div class="form-group">
                  <label class="form-label">Luas Tanah (m²)</label>
                  <input type="number" class="form-input" name="luas_tanah" value="${data.luas_tanah || ''}" placeholder="1798" />
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Nama Lengkap Pemilik Hak Tanah</label>
                <input type="text" class="form-input" name="nama_pemilik_tanah" value="${data.nama_pemilik_tanah || ''}" placeholder="Sesuai Nama di Sertifikat" />
              </div>

              <div class="grid-2">
                <div class="form-group">
                  <label class="form-label">Provinsi Tanah</label>
                  <input type="text" class="form-input" name="tanah_provinsi" value="${data.tanah_provinsi || ''}" placeholder="Jawa Barat" />
                </div>
                <div class="form-group">
                  <label class="form-label">Kabupaten / Kota Tanah</label>
                  <input type="text" class="form-input" name="tanah_kota" value="${data.tanah_kota || ''}" placeholder="Kab. Garut" />
                </div>
              </div>
              <div class="grid-2">
                <div class="form-group">
                  <label class="form-label">Kecamatan Tanah</label>
                  <input type="text" class="form-input" name="tanah_kecamatan" value="${data.tanah_kecamatan || ''}" placeholder="Banjarwangi" />
                </div>
                <div class="form-group">
                  <label class="form-label">Kelurahan / Desa Tanah</label>
                  <input type="text" class="form-input" name="tanah_kelurahan" value="${data.tanah_kelurahan || ''}" placeholder="Kadongdong" />
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Alamat Lengkap Tanah (Kp/Blok/RT/RW)</label>
                <textarea class="form-textarea" name="alamat_tanah_lengkap" rows="2" placeholder="Detail alamat di sertifikat...">${data.alamat_tanah_lengkap || ''}</textarea>
              </div>

              <div style="margin-top:var(--space-4); padding:var(--space-4); background:var(--bg-elevated); border-radius:var(--radius-md)">
                <div class="form-group mb-0">
                  <label class="form-label" style="display:flex; align-items:center; gap:8px">
                    <input type="checkbox" name="pemilik_tanah_sama" value="true" ${data.pemilik_tanah_sama ? 'checked' : ''} onchange="togglePemanfaatanSection(this.checked)" /> 
                    Pemilik tanah sama dengan pemilik bangunan?
                  </label>
                </div>
              </div>

              <!-- Section: Perjanjian Pemanfaatan (Muncul jika pemilik berbeda) -->
              <div id="section-pemanfaatan" style="margin-top:var(--space-4); border-top:1px dashed var(--border-subtle); padding-top:var(--space-4); ${data.pemilik_tanah_sama ? 'display:none' : ''}">
                <div class="card-title text-sm" style="margin-bottom:var(--space-3)">
                  Perjanjian Pemanfaatan Tanah
                </div>
                <div class="form-group">
                  <label class="form-label text-xs">Nomor Surat Perjanjian</label>
                  <input type="text" class="form-input" name="no_surat_perjanjian" value="${data.no_surat_perjanjian || ''}" placeholder="25/SMK-IMG/VIII/2025" />
                </div>
                <div class="grid-2">
                  <div class="form-group">
                    <label class="form-label text-xs">Tanggal Terbit Surat</label>
                    <input type="date" class="form-input" name="tgl_surat_perjanjian" value="${data.tgl_surat_perjanjian || ''}" />
                  </div>
                  <div class="form-group">
                    <label class="form-label text-xs">Nama Penerima / Pemegang Surat</label>
                    <input type="text" class="form-input" name="penerima_perjanjian" value="${data.penerima_perjanjian || ''}" />
                  </div>
                </div>
              </div>
            </div>

            <!-- Catatan / Kondisi Awal -->
            <div class="card">
              <div class="card-title" style="margin-bottom:var(--space-5)">
                <i class="fas fa-note-sticky" style="color:var(--brand-400);margin-right:8px"></i>
                Catatan Awal
              </div>
              <div class="form-group">
                <label class="form-label">Kondisi Umum Bangunan</label>
                <textarea class="form-textarea" name="kondisi_umum" rows="3" placeholder="Deskripsi kondisi umum bangunan saat ini...">${data.kondisi_umum || ''}</textarea>
              </div>
              <div class="form-group">
                <label class="form-label">Catatan Khusus</label>
                <textarea class="form-textarea" name="catatan" rows="2" placeholder="Catatan tambahan untuk pengkaji...">${data.catatan || ''}</textarea>
              </div>
            </div>
          </div>

          <!-- Right Column -->
          <div style="display:flex;flex-direction:column;gap:var(--space-5)">

            <!-- Pemilik -->
            <div class="card">
              <div class="card-title" style="margin-bottom:var(--space-5)">
                <i class="fas fa-user" style="color:var(--brand-400);margin-right:8px"></i>
                Data Pemilik / Pemohon
              </div>

              <div class="form-group">
                <label class="form-label">Nama Pemilik <span class="required">*</span></label>
                <input type="text" class="form-input" name="pemilik" value="${data.pemilik || ''}" placeholder="PT Contoh atau Nama Pribadi" required />
              </div>
              <div class="form-group">
                <label class="form-label">Penanggung Jawab</label>
                <input type="text" class="form-input" name="penanggung_jawab" value="${data.penanggung_jawab || ''}" placeholder="Nama PIC" />
              </div>
              <div class="form-group">
                <label class="form-label">Telepon / HP</label>
                <input type="tel" class="form-input" name="telepon" value="${data.telepon || ''}" placeholder="08xx-xxxx-xxxx" />
              </div>
              <div class="form-group">
                <label class="form-label">Email</label>
                <input type="email" class="form-input" name="email_pemilik" value="${data.email_pemilik || ''}" placeholder="email@domain.com" />
              </div>
            </div>

            <!-- Status SLF -->
            <div class="card">
              <div class="card-title" style="margin-bottom:var(--space-5)">
                <i class="fas fa-shield-halved" style="color:var(--brand-400);margin-right:8px"></i>
                Status SLF
              </div>

              <div class="form-group">
                <label class="form-label">Status Awal</label>
                <select class="form-select" name="status_slf">
                  ${APP_CONFIG.statusSLF.map(s => `
                    <option value="${s.value}" ${(data.status_slf || 'DALAM_PENGKAJIAN') === s.value ? 'selected' : ''}>${s.label}</option>
                  `).join('')}
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Tanggal Mulai Pengkajian</label>
                <input type="date" class="form-input" name="tanggal_mulai" value="${data.tanggal_mulai || new Date().toISOString().split('T')[0]}" />
              </div>
              <div class="form-group">
                <label class="form-label">Target Selesai</label>
                <input type="date" class="form-input" name="tanggal_target" value="${data.tanggal_target || ''}" />
              </div>
              <div class="form-group" style="padding-top:var(--space-4); border-top:1px solid var(--border-subtle); margin-top:var(--space-4)">
                <label class="form-label">Penanggung Jawab (PIC) <i class="fas fa-user-gear" style="margin-left:4px; font-size:0.8rem"></i></label>
                <select class="form-select" name="assigned_to">
                  <option value="">-- Delegasikan ke --</option>
                  ${teamMembers.map(m => `
                    <option value="${m.id}" ${data.assigned_to === m.id ? 'selected' : ''}>${m.full_name} (${m.role})</option>
                  `).join('')}
                </select>
                <span class="form-hint" style="font-size:0.7rem">Delegasikan proyek ini ke anggota tim tertentu.</span>
              </div>
            </div>
            
            <!-- SIMBG Integration -->
            <div class="card" style="border-left: 3px solid #3b82f6;">
              <div class="card-title" style="margin-bottom:var(--space-5)">
                <i class="fas fa-link" style="color:#3b82f6;margin-right:8px"></i>
                Integrasi SIMBG (Pemohon)
              </div>
              <p class="text-xs text-tertiary" style="margin-bottom:var(--space-4)">
                Gunakan kredensial akun SIMBG pemohon untuk sinkronisasi data teknis otomatis.
              </p>
              <div class="form-group">
                <label class="form-label">Email Akun SIMBG</label>
                <input type="email" class="form-input" name="simbg_email" value="${data.simbg_email || ''}" placeholder="email@simbg.pu.go.id" />
              </div>
              <div class="form-group">
                <label class="form-label">Password Akun SIMBG</label>
                <input type="password" class="form-input" name="simbg_password" value="${data.simbg_password || ''}" placeholder="••••••••" />
              </div>
              <div class="form-group">
                <label class="form-label">ID Permohonan SIMBG (UUID)</label>
                <input type="text" class="form-input" name="simbg_id" value="${data.simbg_id || ''}" placeholder="fb327276-a285-4fe9-8e6a..." />
                <span class="form-hint" style="font-size:0.65rem">ID unik dari URL dashboard SIMBG.</span>
              </div>
              <div class="form-hint" style="font-size:0.7rem; color:var(--text-tertiary)">
                <i class="fas fa-shield-halved"></i> Data disimpan untuk proses otomatisasi bot (Opsi A).
              </div>
            </div>

            <!-- AI Configuration -->
            <div class="ai-panel">
              <div class="ai-panel-header">
                <div class="ai-icon"><i class="fas fa-brain"></i></div>
                <div>
                  <div class="ai-panel-title">AI Engine</div>
                  <div class="ai-panel-subtitle">Konfigurasi analisis otomatis</div>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label" style="color:hsla(258,60%,80%,0.8)">Fokus Analisis</label>
                <select class="form-select" name="ai_focus" style="background:hsla(0,0%,0%,0.3);border-color:hsla(258,60%,50%,0.3)">
                  <option value="komprehensif">Komprehensif (Semua Aspek)</option>
                  <option value="struktur">Prioritas Struktur</option>
                  <option value="kebakaran">Prioritas Keselamatan Kebakaran</option>
                  <option value="seismik">Analisis Seismik (ASCE 41-17)</option>
                </select>
              </div>
              <div class="ai-finding success">
                <i class="fas fa-circle-check" style="margin-right:6px"></i>
                AI Engine siap menganalisis setelah checklist diisi
              </div>
            </div>

            <!-- Submit -->
            <div style="display:flex;gap:var(--space-3)">
              <button type="submit" class="btn btn-primary" style="flex:1;padding:14px" id="btn-submit-proyek">
                <i class="fas ${isEdit ? 'fa-save' : 'fa-plus'}"></i>
                ${isEdit ? 'Simpan Perubahan' : 'Buat Proyek'}
              </button>
              ${!isEdit ? `
                <button type="button" class="btn btn-secondary" style="padding:14px" id="btn-fill-sample" title="Isi Data Dummy" onclick="fillSampleData()">
                  <i class="fas fa-magic"></i>
                </button>
              ` : ''}
            </div>
          </div>
        </div>
      </form>
    </div>
  `;
}

window.fillSampleData = function() {
  const form = document.getElementById('proyek-form');
  if (!form) return;
  form.elements['nama_bangunan'].value = 'Gedung Rektorat Universitas Teknologi';
  form.elements['jenis_bangunan'].value = 'Pendidikan';
  form.elements['jenis_konstruksi'].value = 'Beton Bertulang';
  form.elements['alamat'].value = 'Jl. Anggrek Cendrawasih No. 45, Kecamatan Pakubuwono, Kota Megapolitan';
  form.elements['kota'].value = 'Megapolitan';
  form.elements['provinsi'].value = 'Jawa Barat';
  form.elements['latitude'].value = '-6.208800';
  form.elements['longitude'].value = '106.845600';
  if (window._proyekMarker) {
    window._proyekMarker.setLatLng([-6.2088, 106.8456]);
    window._proyekMap.panTo([-6.2088, 106.8456]);
  }
  form.elements['luas_bangunan'].value = '4200';
  form.elements['luas_lahan'].value = '6500';
  form.elements['jumlah_lantai'].value = '8';
  form.elements['tahun_dibangun'].value = '2010';
  form.elements['nomor_pbg'].value = 'PBG/2010/REK-UT/0042';
  form.elements['fungsi_bangunan'].value = 'Fasilitas pendidikan utama yang menampung kantor administratif universitas dan ruang pertemuan VIP.';
  form.elements['kondisi_umum'].value = 'Struktur bangunan masih terlihat dominan kokoh, ada sedikit perlemahan visual (retak rambut 0.1mm) pada sambungan balok-kolom di lantai 2 dan 3. Catatan minor rembesan pada dinding kamar mandi timur.';
  form.elements['catatan'].value = 'Perlu fokus inspeksi pada Fire Hydrant karena ada indikasi tekanan air melemah di atas lantai 4.';
  form.elements['pemilik'].value = 'Yayasan Pendidikan Teknologi';
  form.elements['penanggung_jawab'].value = 'Dr. Eng. Kusuma Wardana';
  form.elements['telepon'].value = '0812-3456-7890';
  form.elements['email_pemilik'].value = 'rektorat@univtek.ac.id';
  form.elements['status_slf'].value = 'DALAM_PENGKAJIAN';
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
    fungsi_bangunan:  data.fungsi_bangunan,
    alamat:           data.alamat,
    kelurahan:        data.kelurahan,
    kecamatan:        data.kecamatan,
    kota:             data.kota,
    provinsi:         data.provinsi,
    pemilik:          data.pemilik,
    penanggung_jawab: data.penanggung_jawab || null,
    telepon:          data.telepon || null,
    email_pemilik:    data.email_pemilik || null,
    kondisi_umum:     data.kondisi_umum || null,
    catatan:          data.catatan || null,
    tanggal_mulai:    data.tanggal_mulai || null,
    tanggal_target:   data.tanggal_target || null,
    tahun_dibangun:   data.tahun_dibangun ? parseInt(data.tahun_dibangun) : null,
    jumlah_lantai:    data.jumlah_lantai ? parseInt(data.jumlah_lantai) : null,
    luas_bangunan:    data.luas_bangunan ? parseFloat(data.luas_bangunan) : null,
    luas_lahan:       data.luas_lahan ? parseFloat(data.luas_lahan) : null,
    jenis_konstruksi: data.jenis_konstruksi,
    nomor_pbg:        data.nomor_pbg,
    latitude:         data.latitude ? parseFloat(data.latitude) : null,
    longitude:        data.longitude ? parseFloat(data.longitude) : null,
    status_slf:       data.status_slf || 'DALAM_PENGKAJIAN',
    simbg_email:      data.simbg_email || null,
    simbg_password:   data.simbg_password || null,
    simbg_id:         data.simbg_id || null,
    gsb:              data.gsb ? parseFloat(data.gsb) : null,
    kdb:              data.kdb ? parseFloat(data.kdb) : null,
    klb:              data.klb ? parseFloat(data.klb) : null,
    kdh:              data.kdh ? parseFloat(data.kdh) : null,
    no_sertifikat:    data.no_dokumen_tanah || data.no_sertifikat || null,
    luas_tanah:       data.luas_tanah ? parseFloat(data.luas_tanah) : null,
    tgl_sertifikat:   data.tgl_terbit_tanah || data.tgl_sertifikat || null,
    // Detailed Land Fields
    jenis_dokumen_tanah: data.jenis_dokumen_tanah || null,
    no_dokumen_tanah:    data.no_dokumen_tanah || null,
    tgl_terbit_tanah:    data.tgl_terbit_tanah || null,
    hak_kepemilikan:     data.hak_kepemilikan || null,
    nama_pemilik_tanah:  data.nama_pemilik_tanah || null,
    tanah_provinsi:      data.tanah_provinsi || null,
    tanah_kota:          data.tanah_kota || null,
    tanah_kecamatan:     data.tanah_kecamatan || null,
    tanah_kelurahan:     data.tanah_kelurahan || null,
    alamat_tanah_lengkap: data.alamat_tanah_lengkap || null,
    pemilik_tanah_sama:  data.pemilik_tanah_sama === 'true',
    no_surat_perjanjian: data.no_surat_perjanjian || null,
    tgl_surat_perjanjian: data.tgl_surat_perjanjian || null,
    penerima_perjanjian: data.penerima_perjanjian || null,
    assigned_to:         data.assigned_to || null,
  };

  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Menyimpan...';

  try {
    const user = getUserInfo();
    const payload = {
      ...cleanData,
      progress: 0,
      updated_at: new Date().toISOString(),
    };
    
    // Hanya assign created_by jika ini UUID asli Supabase, untuk mencegah error foreign key saat bypass local
    if (user?.id && user.id.length > 15 && user.id !== '00000000-0000-0000-0000-000000000001') {
      payload.created_by = user.id;
    }

    let error;
    if (isEdit && id) {
      ({ error } = await supabase.from('proyek').update(payload).eq('id', id));
    } else {
      ({ error } = await supabase.from('proyek').insert(payload));
    }

    if (error) throw error;
    showSuccess(isEdit ? 'Proyek berhasil diperbarui!' : 'Proyek SLF berhasil dibuat!');
    setTimeout(() => navigate('proyek'), 800);
  } catch (err) {
    showError('Gagal menyimpan: ' + err.message);
    btn.disabled = false;
    btn.innerHTML = `<i class="fas fa-save"></i> ${isEdit ? 'Simpan Perubahan' : 'Buat Proyek'}`;
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

  const map = window.L.map('proyek-map').setView([lat, lng], 14);
  window._proyekMap = map;

  window.L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap'
  }).addTo(map);

  const marker = window.L.marker([lat, lng], { draggable: true }).addTo(map);
  window._proyekMarker = marker;
  
  if (!initLat && !initLng) {
    document.getElementById('input-lat').value = lat.toFixed(6);
    document.getElementById('input-lng').value = lng.toFixed(6);
  }

  marker.on('dragend', function(e) {
    const position = marker.getLatLng();
    map.panTo(new window.L.LatLng(position.lat, position.lng));
    document.getElementById('input-lat').value = position.lat.toFixed(6);
    document.getElementById('input-lng').value = position.lng.toFixed(6);
  });

  if (!initLat) {
    map.locate({setView: true, maxZoom: 16});
    map.on('locationfound', function(e) {
      marker.setLatLng(e.latlng);
      document.getElementById('input-lat').value = e.latlng.lat.toFixed(6);
      document.getElementById('input-lng').value = e.latlng.lng.toFixed(6);
    });
  }
};

window.togglePemanfaatanSection = function(isSama) {
  const el = document.getElementById('section-pemanfaatan');
  if (el) el.style.display = isSama ? 'none' : 'block';
};

window._triggerOCRScan = () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*,application/pdf';
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    showInfo("Sedang membaca dokumen dengan AI Vision...");
    
    // 1. Convert to Base64
    const reader = new FileReader();
    reader.onload = async () => {
      const b64 = reader.result.split(',')[1];
      try {
        const data = await runOCRAnalysis(b64, file.type);
        if (data) {
          showSuccess("Data berhasil diekstrak otomatis!");
          
          // 2. Map to form fields
          const form = document.getElementById('proyek-form');
          if (data.nama_bangunan) form.elements['nama_bangunan'].value = data.nama_bangunan;
          if (data.pemilik) form.elements['pemilik'].value = data.pemilik;
          if (data.alamat) form.elements['alamat'].value = data.alamat;
          if (data.luas_bangunan) form.elements['luas_bangunan'].value = data.luas_bangunan;
          if (data.luas_lahan) form.elements['luas_lahan'].value = data.luas_lahan;
          if (data.jumlah_lantai) form.elements['jumlah_lantai'].value = data.jumlah_lantai;
          if (data.tahun_dibangun) form.elements['tahun_dibangun'].value = data.tahun_dibangun;
          if (data.nomor_pbg) form.elements['nomor_pbg'].value = data.nomor_pbg;
          if (data.fungsi_bangunan) form.elements['fungsi_bangunan'].value = data.fungsi_bangunan;
          if (data.gsb) form.elements['gsb'].value = data.gsb;
          if (data.kdb) form.elements['kdb'].value = data.kdb;
          if (data.klb) form.elements['klb'].value = data.klb;
          if (data.kdh) form.elements['kdh'].value = data.kdh;
          
          // Flash effect to show update
          form.classList.add('ai-updated');
          setTimeout(() => form.classList.remove('ai-updated'), 1000);
        }
      } catch (err) {
        showError("Gagal sinkron data: " + err.message);
      }
    };
    reader.readAsDataURL(file);
  };
  input.click();
};
