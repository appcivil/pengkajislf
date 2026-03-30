import { supabase } from '../lib/supabase.js';
import { navigate } from '../lib/router.js';
import { showSuccess, showError } from '../components/toast.js';

/**
 * Surat Pernyataan Page (High-Fidelity PP 16/2021)
 * Interactive A4 preview and editor for 3 Experts & TTE.
 */
export async function suratPernyataanPage(params = {}) {
  const id = params.id;
  if (!id) { navigate('proyek'); return ''; }

  const root = document.getElementById('page-root');
  if (root) root.innerHTML = '<div class="loading-full"><div class="spinner"></div><p>Sinkronisasi Format Resmi SIMBG...</p></div>';

  try {
    const [proyek, settingsRes] = await Promise.all([
      fetchProyek(id),
      supabase.from('settings').select('*').eq('id', '00000000-0000-0000-0000-000000000000').single()
    ]).catch(err => {
      console.error("[SLF] Initial Fetch Error:", err);
      throw new Error("Gagal mengambil data proyek atau pengaturan.");
    });

    const settings = settingsRes.data?.data || {};

    if (!proyek) {
      showError('Proyek tidak ditemukan.');
      navigate('proyek');
      return '';
    }

    const html = buildHtml(proyek, settings);
    if (root) {
      root.innerHTML = html;
      initAfterRender(proyek, settings);
    }
    return html;
  } catch (err) {
    console.error("[SLF] Page Error:", err);
    if (root) {
      root.innerHTML = `
        <div class="empty-state" style="min-height:70vh">
          <div class="empty-icon" style="color:var(--danger-400)"><i class="fas fa-exclamation-triangle"></i></div>
          <h2 class="empty-title">Gagal Memuat Halaman</h2>
          <p class="empty-desc">${err.message}</p>
          <button class="btn btn-primary" onclick="window.location.reload()">Muat Ulang</button>
        </div>
      `;
    }
    return '';
  }
}

function buildHtml(p, s) {
  return `
    <div id="surat-pernyataan-page" class="legal-page hf-version">
      <div class="legal-sidebar">
        <div class="sidebar-header">
          <button class="btn btn-ghost btn-sm" onclick="window.navigate('proyek-detail', {id:'${p.id}'})">
            <i class="fas fa-arrow-left"></i> Kembali ke Proyek
          </button>
          <h2>Format Resmi SIMBG</h2>
          <p class="text-xs text-tertiary">PP 16/2021 · 3 Pilar Tenaga Ahli</p>
        </div>

        <div class="sidebar-menu">
          <div class="menu-item active" data-type="konsultan">
            <i class="fas fa-file-shield"></i>
            <div class="menu-label">
              <span>Pernyataan Konsultan</span>
              <small>3 Bidang Ahli (+TTE)</small>
            </div>
          </div>
          <div class="menu-item" data-type="pemilik">
            <i class="fas fa-user-check"></i>
            <div class="menu-label">
              <span>Pernyataan Pemilik</span>
              <small>Komitmen Pemeliharaan</small>
            </div>
          </div>
        </div>

        <div class="sidebar-footer">
          <div class="alert alert-info" style="font-size:11px; margin-bottom:15px;">
            <i class="fas fa-info-circle"></i>
            Koordinat & Data Teknis ditarik otomatis. Aktifkan "Mode Edit" untuk perubahan manual.
          </div>
          <div class="form-group" style="padding:0 10px 15px 10px;">
            <label class="toggle" style="justify-content:space-between; width:100%; font-size:13px; font-weight:600;">
              <span><i class="fas fa-edit"></i> Mode Edit Teks</span>
              <input type="checkbox" id="toggle-edit-mode">
              <span class="toggle-slider"></span>
            </label>
          </div>
          <button class="btn btn-primary btn-block" id="btn-download-docx">
            <i class="fas fa-file-word"></i> Ekspor Word (TTE Ready)
          </button>
        </div>
      </div>

      <div class="legal-canvas">
        <div class="paper-a4" id="legal-preview" contenteditable="false">
          ${renderDocTemplate('konsultan', p, s)}
        </div>
      </div>
    </div>

    <style>
      .legal-page.hf-version { display: flex; height: calc(100vh - 64px); background: #f1f5f9; overflow: hidden; }
      .legal-sidebar { width: 340px; background: #fff; border-right: 1px solid #e2e8f0; display: flex; flex-direction: column; box-shadow: 10px 0 30px rgba(0,0,0,0.03); z-index: 10; }
      .sidebar-header { padding: 30px 24px; border-bottom: 1px solid #f1f5f9; }
      .sidebar-header h2 { margin-top: 15px; font-size: 20px; color: #1e293b; font-weight: 800; }
      
      .sidebar-menu { flex: 1; padding: 15px; }
      .menu-item { display: flex; align-items: center; gap: 15px; padding: 16px; border-radius: 12px; cursor: pointer; transition: all 0.3s; margin-bottom: 8px; border: 1px solid transparent; color: #475569; }
      .menu-item:hover { background: #f1f5f9; border-color: #cbd5e1; color: #1e293b; }
      .menu-item.active { background: #2563eb; color: #fff; border-color: #1d4ed8; box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.2); }
      .menu-item i { font-size: 24px; opacity: 0.8; }
      .menu-item.active i { opacity: 1; color: #fff; }
      .menu-label { display: flex; flex-direction: column; }
      .menu-label span { font-weight: 700; font-size: 15px; color: inherit; }
      .menu-label small { font-size: 11px; opacity: 0.8; font-weight: 500; color: inherit; }
      .menu-item.active .menu-label small { opacity: 0.9; color: #dbeafe; }

      .sidebar-footer { padding: 25px; background: #fff; border-top: 1px solid #f1f5f9; color: #1e293b; }
      .alert-info { background: #dbeafe !important; color: #1e3a8a !important; border-color: #3b82f6 !important; opacity: 1 !important; }
      .sidebar-footer label { color: #1e293b !important; }
      .sidebar-footer .text-xs { color: #64748b !important; }

      .legal-canvas { flex: 1; overflow-y: auto; padding: 60px; display: flex; justify-content: center; scroll-behavior: smooth; }
      
      .paper-a4 {
        width: 210mm;
        min-height: 297mm;
        background: #fff;
        box-shadow: 0 20px 50px rgba(0,0,0,0.15);
        padding: 25mm 20mm;
        font-family: "Times New Roman", serif;
        font-size: 11.5pt;
        line-height: 1.4;
        color: #000;
        outline: none;
        position: relative;
        text-align: justify;
      }
      .paper-a4:focus { border: 1px dashed #3b82f6; }

      /* Detailed Document Styles */
      .doc-header-hf { position: relative; min-height: 100px; margin-bottom: 20px; }
      .doc-kop-img { width: 100%; max-height: 150px; object-fit: contain; }
      .doc-kop-text { border-bottom: 4px double #000; padding-bottom: 10px; text-align: center; line-height: 1.2; }
      .doc-kop-text h1 { font-size: 16pt; font-weight: bold; margin: 0; text-transform: uppercase; }
      .doc-kop-text h2 { font-size: 14pt; font-weight: bold; margin: 2px 0; text-transform: uppercase; }
      .doc-kop-text p { font-size: 9pt; margin: 2px 0; font-style: italic; }
      
      .doc-title-hf { text-align: center; margin-bottom: 25px; }
      .doc-title-hf h2 { font-size: 13pt; margin: 0; font-weight: bold; line-height: 1.2; text-transform: uppercase; }
      .doc-meta-hf { margin-bottom: 20px; font-weight: 500; }
      .meta-row { display: grid; grid-template-columns: 80px 10px 1fr; margin-bottom: 2px; }

      .doc-section-title { font-weight: bold; margin-bottom: 10px; }
      .doc-list { list-style: none; padding-left: 20px; margin-bottom: 15px; }
      .doc-list li { margin-bottom: 4px; display: flex; gap: 8px; }

      .sig-director-content { display: flex; align-items: flex-end; justify-content: flex-end; gap: 40px; margin-top: 25px; width: 100%; }
      .materai-box { width: 95px; height: 95px; border: 1px dashed #64748b; border-radius: 2px; display: flex; flex-direction: column; align-items: center; justify-content: center; font-size: 8px; color: #64748b; line-height: 1.2; text-align: center; background: #fafafa; opacity: 0.8; font-family: 'Inter', sans-serif; margin-bottom: 20px; }
      .materai-box b { font-size: 10px; color: #475569; letter-spacing: 1px; margin-bottom: 3px; }
      .sig-director-right { display: flex; flex-direction: column; align-items: center; min-width: 280px; }
      .sig-img-director { max-width: 150px; max-height: 80px; object-fit: contain; }
      .sig-img-qr-std { width: 65px; height: 65px; object-fit: contain; background: white; padding: 2px; border: 1px solid #f1f5f9; }
      .sig-header-text { font-weight: bold; font-size: 10pt; min-height: 35px; display: flex; align-items: center; justify-content: center; line-height: 1.2; text-align: center; margin-bottom: 8px; }
      .director-name-container { text-align: center; width: 100%; margin-top: 8px; }
      .director-job-text { font-size: 10pt; margin-top: 4px; display: block; }
      .list-num { min-width: 20px; }

      .doc-grid-11 { margin: 15px 0 25px 25px; display: flex; flex-direction: column; gap: 4px; }
      .grid-11-row { display: grid; grid-template-columns: 20px 180px 10px 1fr; align-items: baseline; }

      .box-pernyataan { border: 2px solid #000; padding: 15px; text-align: center; font-weight: bold; font-size: 13pt; margin: 25px 0; text-transform: uppercase; }

      /* 3 Column Signature */
      .sig-3-col { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 40px; }
      .sig-cell { text-align: center; display: flex; flex-direction: column; align-items: center; }
      .sig-role { font-weight: bold; font-size: 9pt; min-height: 35px; display: flex; align-items: center; justify-content: center; line-height: 1.2; }
      .sig-box-tte { height: 90px; width: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; margin: 8px 0; position: relative; }
      .sig-img-signature { position: absolute; max-height: 60px; max-width: 80%; object-fit: contain; z-index: 1; opacity: 0.9; }
      .sig-img-qr { max-height: 65px; max-width: 65px; object-fit: contain; z-index: 2; border: 1px solid #eee; background: #fff; padding: 2px; border-radius: 4px; }
      .sig-placeholder { font-size: 7pt; color: #666; font-style: italic; opacity: 0.3; border: 1px dashed #ccc; width: 65px; height: 65px; display: flex; align-items: center; justify-content: center; }
      .sig-name { font-weight: bold; text-decoration: underline; font-size: 10pt; margin-top: 8px; text-transform: uppercase; }
      .sig-skk { font-size: 8pt; margin-top: 2px; opacity: 0.8; }
    </style>
  `;
}

function renderDocTemplate(type, p, s) {
  const dateStr = formatDate(new Date());
  const experts = s.experts || {};
  
  if (type === 'konsultan') {
    const kopHeader = s.consultant?.kop_image 
      ? `<img src="${s.consultant.kop_image}" class="doc-kop-img">`
      : `<div class="doc-kop-text">${(s.consultant?.kop_text || 'KOP SURAT').split('\n').map((line, i) => i === 0 ? `<h1>${line}</h1>` : i === 1 ? `<h2>${line}</h2>` : `<p>${line}</p>`).join('')}</div>`;

    return `
      <div class="doc-header-hf">
        ${kopHeader}
      </div>

      <div class="doc-title-hf">
        <h2>SURAT PERNYATAAN KELAIKAN FUNGSI<br>BANGUNAN GEDUNG</h2>
      </div>

      <div class="doc-meta-hf">
        <div class="meta-row"><div>Nomor</div><div>:</div><div>__________</div></div>
        <div class="meta-row"><div>Tanggal</div><div>:</div><div>${dateStr}</div></div>
        <div class="meta-row"><div>Lampiran</div><div>:</div><div>1 (Satu) Berkas</div></div>
      </div>

      <div style="margin-bottom:15px;">
        Pada hari ini, tanggal ${new Date().getDate()} bulan ${formatMonth(new Date())} tahun ${new Date().getFullYear()}, yang bertanda tangan di bawah ini:
      </div>

      <div class="doc-list">
        <li><div class="list-num">□</div><div>Penyedia jasa pengkaji teknis / Penyedia jasa pengawas konstruksi / Penyedia jasa manajemen konstruksi / Instansi penyelenggara SLF Pemerintah Daerah</div></li>
      </div>

      <div style="margin-left:25px; margin-bottom:20px;">
        <div class="meta-row" style="grid-template-columns: 180px 10px 1fr;"><div>Nama perusahaan/instansi</div><div>:</div><div>${escHtml(s.consultant?.name || '-')}</div></div>
        <div class="meta-row" style="grid-template-columns: 180px 10px 1fr;"><div>Alamat</div><div>:</div><div>${escHtml(s.consultant?.address || '-')}</div></div>
        <div class="meta-row" style="grid-template-columns: 180px 10px 1fr;"><div>Telepon</div><div>:</div><div>${escHtml(p.telepon || '-')}</div></div>
        <div class="meta-row" style="grid-template-columns: 180px 10px 1fr;"><div>Email</div><div>:</div><div>${escHtml(p.email_pemilik || '-')}</div></div>
      </div>

      <div class="doc-section-title">Pelaksana pemeriksaan kelaikan fungsi bangunan gedung:</div>
      <div style="margin-left:25px; margin-bottom:15px;">
        <div class="grid-11-row"><div>1)</div><div style="font-weight:bold">Bidang arsitektur / tata ruang-luar:</div></div>
        <div class="grid-11-row"><div></div><div style="padding-left:15px">a) Nama</div><div>:</div><div>${escHtml(experts.architecture?.name || '____________________')}</div></div>
        <div class="grid-11-row"><div></div><div style="padding-left:15px">b) Nomor sertifikat keahlian</div><div>:</div><div>${escHtml(experts.architecture?.skk || '____________________')}</div></div>
        
        <div class="grid-11-row" style="margin-top:4px"><div>2)</div><div style="font-weight:bold">Bidang struktur:</div></div>
        <div class="grid-11-row"><div></div><div style="padding-left:15px">a) Nama</div><div>:</div><div>${escHtml(experts.structure?.name || '____________________')}</div></div>
        <div class="grid-11-row"><div></div><div style="padding-left:15px">b) Nomor sertifikat keahlian</div><div>:</div><div>${escHtml(experts.structure?.skk || '____________________')}</div></div>

        <div class="grid-11-row" style="margin-top:4px"><div>3)</div><div style="font-weight:bold">Bidang utilitas / MEP:</div></div>
        <div class="grid-11-row"><div></div><div style="padding-left:15px">a) Nama</div><div>:</div><div>${escHtml(experts.mep?.name || '____________________')}</div></div>
        <div class="grid-11-row"><div></div><div style="padding-left:15px">b) Nomor sertifikat keahlian</div><div>:</div><div>${escHtml(experts.mep?.skk || '____________________')}</div></div>
      </div>

      <div class="doc-section-title">Telah melaksanakan pemeriksaan kelaikan fungsi bangunan gedung pada:</div>
      <div class="doc-grid-11">
        <div class="grid-11-row"><div>1)</div><div>Nama bangunan</div><div>:</div><div>${escHtml(p.nama_bangunan)}</div></div>
        <div class="grid-11-row"><div>2)</div><div>Alamat bangunan</div><div>:</div><div>${escHtml(p.alamat || '-')}</div></div>
        <div class="grid-11-row"><div>3)</div><div>Posisi koordinat</div><div>:</div><div>${p.latitude || '0'}, ${p.longitude || '0'}</div></div>
        <div class="grid-11-row"><div>4)</div><div>Fungsi bangunan</div><div>:</div><div>${escHtml(p.fungsi_bangunan || '-')}</div></div>
        <div class="grid-11-row"><div>5)</div><div>Klasifikasi kompleksitas</div><div>:</div><div>Sederhana / Tidak Sederhana</div></div>
        <div class="grid-11-row"><div>6)</div><div>Ketinggian bangunan</div><div>:</div><div>${p.tahun_dibangun || '-'}</div></div>
        <div class="grid-11-row"><div>7)</div><div>Jumlah lantai bangunan</div><div>:</div><div>${p.jumlah_lantai || 1} Lantai</div></div>
        <div class="grid-11-row"><div>8)</div><div>Luas lantai bangunan</div><div>:</div><div>${p.luas_bangunan || 0} m²</div></div>
        <div class="grid-11-row"><div>9)</div><div>Jumlah basement</div><div>:</div><div>-</div></div>
        <div class="grid-11-row"><div>10)</div><div>Luas lantai basement</div><div>:</div><div>-</div></div>
        <div class="grid-11-row"><div>11)</div><div>Luas tanah</div><div>:</div><div>${p.luas_lahan || 0} m²</div></div>
      </div>

      <div class="doc-section-title">Berdasarkan hasil pemeriksaan persyaratan kelaikan fungsi yang terdiri dari:</div>
      <div class="doc-list" style="margin-left:15px">
        <li><div class="list-num">1)</div><div>Pemeriksaan dokumen administratif bangunan gedung;</div></li>
        <li><div class="list-num">2)</div><div>Pemeriksaan persyaratan teknis bangunan gedung, yaitu:</div></li>
        <div style="margin-left:30px">
          <li><div class="list-num">a.</div><div>pemeriksaan persyaratan tata bangunan, meliputi peruntukan, intensitas, arsitektur dan pengendalian dampak lingkungan;</div></li>
          <li><div class="list-num">b.</div><div>pemeriksaan persyaratan keandalan bangunan gedung, meliputi keselamatan, kesehatan, kenyamanan, dan kemudahan.</div></li>
        </div>
      </div>

      <div style="margin-top:15px">Dengan ini menyatakan bahwa:</div>
      <div class="box-pernyataan">
        BANGUNAN GEDUNG DINYATAKAN LAIK FUNGSI
      </div>

      <div style="margin-bottom:12px">Sesuai kesimpulan dari analisis dan evaluasi terhadap hasil pemeriksaan dokumen dan pemeriksaan kondisi fisik bangunan gedung sebagaimana termuat dalam Laporan Pemeriksaan Kelaikan Fungsi Bangunan Gedung terlampir.</div>
      
      <div style="margin-bottom:12px">Surat pernyataan ini berlaku sepanjang tidak ada perubahan yang dilakukan oleh pemilik atau pengguna terhadap bangunan gedung atau penyebab gangguan lainnya yang dibuktikan kemudian.</div>
      
      <div style="margin-bottom:12px">
        <p>Demikian Surat Pernyataan ini kami buat dengan sebenarnya untuk dapat dipergunakan sebagaimana mestinya.</p>

        <div class="sig-director-block" style="margin-top: 40px">
          <div class="sig-director-content">
            <!-- e-Materai on the Left per BSN -->
            <div class="materai-box">
              <b>MATERAI</b>
              ELEKTRONIK
              <div style="font-size:7px; margin-top:4px; opacity:0.7;">SEPULUH RIBU RUPIAH</div>
            </div>
            
            <div class="sig-director-right">
              <div class="sig-header-text">${escHtml(s.consultant?.name || 'NAMA PERUSAHAAN')}</div>
              
              <div class="sig-box-tte" style="height:90px;">
                ${(() => {
                  const verifyUrl = `${window.location.origin}${window.location.pathname}#/verify?id=${p.id}&expert=director`;
                  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(verifyUrl)}`;
                  return `<img src="${qrSrc}" class="sig-img-qr-std">`;
                })()}
                
                ${s.consultant?.signature ? `<img src="${s.consultant.signature}" class="sig-img-signature" style="transform: translateX(30px) translateY(15px);">` : ''}
              </div>

              <div class="director-name-container">
                <div class="sig-name">${escHtml(s.consultant?.director_name || 'NAMA DIREKTUR')}</div>
                <div class="director-job-text">${escHtml(s.consultant?.director_job || 'Direktur')}</div>
                <div style="font-size:7px; margin-top:8px; opacity:0.5; font-style:italic">Scan untuk Verifikasi Digital (Direktur)</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="sig-3-col">
        ${['architecture', 'structure', 'mep'].map(type => {
          const expert = experts[type] || {};
          const roleLabel = type === 'architecture' ? 'Bidang Arsitektur /<br>Tata Ruang Luar' : type === 'structure' ? 'Bidang Struktur' : 'Bidang Utilitas /<br>MEP';
          const verifyUrl = `${window.location.origin}${window.location.pathname}#/verify?id=${p.id}&expert=${type}`;
          const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(verifyUrl)}`;
          
          return `
            <div class="sig-cell">
              <div class="sig-role">${roleLabel}</div>
              <div class="sig-box-tte">
                 <img src="${qrSrc}" class="sig-img-qr">
                 ${expert.signature ? `<img src="${expert.signature}" class="sig-img-signature" style="transform:translateX(20px) translateY(10px);">` : ''}
              </div>
              <div class="sig-name">${escHtml(expert.name || 'NAME')}</div>
              <div class="sig-skk">No. SKK: ${escHtml(expert.skk || '-')}</div>
              <div style="font-size:7px; margin-top:5px; opacity:0.5; font-style:italic">Scan untuk Verifikasi Digital</div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  } else {
    // Owner version remains similar but styled
    return `
      <div class="doc-title-hf" style="margin-top: 40px">
        <h2>SURAT PERNYATAAN PEMILIK / PENGELOLA</h2>
        <p>TENTANG KESEDIAAN MEMELIHARA BANGUNAN GEDUNG</p>
      </div>

      <div style="margin: 30px 0 15px 0;">Yang bertanda tangan di bawah ini:</div>

      <div class="doc-grid-11" style="margin-left:0">
        <div class="grid-11-row"><div>-</div><div style="width:140px">Nama Pemilik</div><div>:</div><div>${escHtml(p.pemilik || '____________________')}</div></div>
        <div class="grid-11-row"><div>-</div><div style="width:140px">Nomor Identitas</div><div>:</div><div>${escHtml(p.ktp_pemilik || '____________________')}</div></div>
        <div class="grid-11-row"><div>-</div><div style="width:140px">Alamat</div><div>:</div><div>${escHtml(p.alamat_pemilik || '____________________')}</div></div>
      </div>

      <div style="margin-bottom:15px">Adalah selaku pemilik/pengelola bangunan gedung yang berlokasi di:</div>

      <div class="doc-grid-11" style="margin-left:0">
        <div class="grid-11-row"><div>-</div><div style="width:140px">Nama Bangunan</div><div>:</div><div>${escHtml(p.nama_bangunan)}</div></div>
        <div class="grid-11-row"><div>-</div><div style="width:140px">Alamat Bangunan</div><div>:</div><div>${escHtml(p.alamat || '-')}</div></div>
      </div>

      <div style="margin-top:20px; line-height:1.6">
        Dengan ini menyatakan bahwa saya akan memelihara dan merawat bangunan gedung tersebut sesuai dengan standar teknis dan peruntukannya, serta menjamin kebenaran seluruh dokumen yang disampaikan dalam permohonan SLF melalui sistem SIMBG.
      </div>

      <div style="margin-top:15px; line-height:1.6">
        Apabila dikemudian hari ditemukan ketidakbenaran atas pernyataan ini, saya bersedia mempertanggungjawabkannya sesuai ketentuan hukum yang berlaku.
      </div>

      <div style="display:flex; justify-content:flex-end; margin-top:60px;">
        <div style="text-align:center; width: 250px;">
          <div>${p.kota || 'Bandung'}, ${dateStr}</div>
          <div style="font-weight:bold; margin-top:5px;">Pemilik Bangunan,</div>
          <div style="height: 100px; display:flex; align-items:center; justify-content:center; opacity:0.3; border: 1px dashed #ccc; margin:15px 0">
            [Meterai Rp10.000]
          </div>
          <div style="border-bottom:1px solid #000; font-weight:bold; text-transform:uppercase">${escHtml(p.pemilik || '____________________')}</div>
        </div>
      </div>
    `;
  }
}

async function fetchProyek(id) {
  const { data, error } = await supabase.from('proyek').select('*').eq('id', id).single();
  return error ? null : data;
}

function initAfterRender(p, s) {
  const menuItems = document.querySelectorAll('.menu-item');
  const preview = document.getElementById('legal-preview');
  
  menuItems.forEach(item => {
    item.onclick = () => {
      menuItems.forEach(m => m.classList.remove('active'));
      item.classList.add('active');
      const type = item.getAttribute('data-type');
      preview.innerHTML = renderDocTemplate(type, p, s);
    };
  });

  const btnDownload = document.getElementById('btn-download-docx');
  if (btnDownload) {
    btnDownload.onclick = () => downloadAsDocx(p);
  }

  const toggleEdit = document.getElementById('toggle-edit-mode');
  if (toggleEdit) {
    toggleEdit.onchange = (e) => {
      preview.setAttribute('contenteditable', e.target.checked ? 'true' : 'false');
      if (e.target.checked) {
        showSuccess('Mode Edit Aktif. Anda dapat mengubah teks dokumen langsung.');
        preview.focus();
      }
    };
  }
}

async function downloadAsDocx(p) {
  const preview = document.getElementById('legal-preview');
  const type = document.querySelector('.menu-item.active')?.getAttribute('data-type') || 'konsultan';
  
  showSuccess(`Menyiapkan Word: ${type === 'konsultan' ? 'Pernyataan Konsultan' : 'Pernyataan Pemilik'}...`);
  
  try {
    const { data: sRes, error: sErr } = await supabase
      .from('settings')
      .select('data')
      .eq('id', '00000000-0000-0000-0000-000000000000')
      .single();
    
    if (sErr) throw sErr;
    const settings = sRes?.data || {};
    
    const { downloadLegalDocx } = await import('../lib/surat-pernyataan-service.js');
    const htmlContent = preview.innerHTML;
    
    await downloadLegalDocx(p, settings, type, htmlContent);
    showSuccess('Dokumen berhasil diunduh.');
  } catch (err) {
    console.error("Docx Export Error:", err);
    showError('Gagal mengunduh: ' + err.message);
  }
}

function escHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}

function formatDate(d) {
  if (!d) return '-';
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatMonth(d) {
  return d.toLocaleDateString('id-ID', { month: 'long' });
}
