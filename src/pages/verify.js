import { supabase } from '../lib/supabase.js';
import { getSettings } from '../lib/settings.js';

export async function verifyPage(params = {}) {
  const id = params.id;
  const expertType = params.expert; // architecture, structure, mep
  
  const root = document.getElementById('page-root');
  if (root) {
    root.innerHTML = `
      <div class="verify-loading">
        <div class="verify-spinner"></div>
        <p>Memverifikasi Dokumen Digital...</p>
      </div>
      <style>
        .verify-loading { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; gap: 20px; color: #64748b; font-family: 'Inter', sans-serif; }
        .verify-spinner { width: 50px; height: 50px; border: 5px solid #e2e8f0; border-top-color: #2563eb; border-radius: 50%; animation: v-spin 1s linear infinite; }
        @keyframes v-spin { to { transform: rotate(360deg); } }
      </style>
    `;
  }

  try {
    // 1. Fetch Data
    const [proyekRes, analisisRes, settings] = await Promise.all([
      supabase.from('proyek').select('*').eq('id', id).single(),
      supabase.from('hasil_analisis').select('*').eq('proyek_id', id).maybeSingle(),
      getSettings()
    ]);

    if (proyekRes.error || !proyekRes.data) {
      throw new Error("Dokumen tidak ditemukan dalam pusat data (Invalid).");
    }

    const p = proyekRes.data;
    const a = analisisRes.data;
    const exp = settings.experts?.[expertType] || {};

    const html = buildVerifyHtml(p, a, settings, expertType);
    if (root) root.innerHTML = html;
  } catch (err) {
    if (root) root.innerHTML = renderError(err.message);
  }
  return '';
}

function buildVerifyHtml(p, a, s, expertType) {
  const dateStr = new Date(p.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  const statusLabel = a?.status_slf?.replace(/_/g, ' ') || 'DALAM PENGKAJIAN';
  
  let expert = {};
  let roleLabel = '';
  
  if (expertType === 'director') {
    expert = {
      name: s.consultant?.director_name || 'DIREKTUR',
      skk: null,
      job: s.consultant?.director_job || 'Direktur'
    };
    roleLabel = expert.job.toUpperCase();
  } else {
    expert = s.experts?.[expertType] || {};
    roleLabel = `Bidang ${expertType?.toUpperCase()}`;
  }

  return `
    <div class="verify-container">
      <div class="verify-card">
        <!-- Header: Status Badge -->
        <div class="verify-badge">
           <div class="badge-icon"><i class="fas fa-check-shield"></i></div>
           <div class="badge-text">
             <span class="status-top">DOKUMEN TERVERIFIKASI ASLI</span>
             <span class="status-id">ID: ${p.id.slice(0, 8)}...</span>
           </div>
        </div>

        <!-- Building Photo -->
        <div class="verify-hero">
           ${p.foto_bangunan ? `<img src="${p.foto_bangunan}" alt="Foto Bangunan">` : `<div class="photo-placeholder"><i class="fas fa-building"></i><br>Foto Bangunan Galeri</div>`}
           <div class="hero-label">${escHtml(p.nama_bangunan)}</div>
        </div>

        <div class="verify-content">
          <!-- Information Grid -->
          <div class="info-grid">
            <div class="info-item">
              <label>Pemilik</label>
              <span>${escHtml(p.pemilik || '-')}</span>
            </div>
            <div class="info-item">
              <label>Lokasi</label>
              <span class="text-sm">${escHtml(p.alamat || '-')}</span>
            </div>
            <div class="info-item">
              <label>Konsultan Pengkaji</label>
              <span>${escHtml(s.consultant?.name || '-')}</span>
            </div>
            <div class="info-item">
              <label>Tanggal Terbit</label>
              <span>${dateStr}</span>
            </div>
          </div>

          <!-- Document Validity Status -->
          <div class="validity-box ${a?.status_slf === 'LAIK_FUNGSI' ? 'v-success' : 'v-warning'}">
             <div class="v-label">STATUS KELAIKAN FUNGSI</div>
             <div class="v-value">${statusLabel}</div>
             <div class="v-score">Indeks Keandalan: ${a?.skor_total || '--'}%</div>
          </div>

          ${expertType ? `
            <!-- Expert Verification -->
            <div class="expert-box">
               <div class="expert-header">PENANDATANGAN (TTE)</div>
               <div class="expert-main">
                  <div class="expert-info">
                    <div class="ex-name">${escHtml(expert.name || 'PENANGGUNG JAWAB')}</div>
                    ${expert.skk ? `<div class="ex-skk">No. SKK: ${escHtml(expert.skk)}</div>` : ''}
                    <div class="ex-role">${escHtml(roleLabel)}</div>
                  </div>
                  <div class="expert-check"><i class="fas fa-file-signature"></i> SIGNED</div>
               </div>
            </div>
          ` : ''}

          <!-- Aspect Summary (Informative) -->
          <div class="summary-section">
             <div class="summary-title">RINGKASAN ASPEK TEKNIS</div>
             <div class="summary-row">
                <div class="s-dot col-arch"></div><div class="s-label">Arsitektur</div><div class="s-skor">${a?.skor_arsitektur || '--'}</div>
                <div class="s-dot col-str"></div><div class="s-label">Struktur</div><div class="s-skor">${a?.skor_struktur || '--'}</div>
                <div class="s-dot col-mep"></div><div class="s-label">Mekanikal</div><div class="s-skor">${a?.skor_kebakaran || '--'}</div>
             </div>
          </div>

          <div class="verify-footer">
            <p>© ${new Date().getFullYear()} Smart AI Pengkaji SLF · Sistem Informasi SIMBG</p>
            <p class="text-xs">Sesuai Peraturan Pemerintah No. 16 Tahun 2021</p>
          </div>
        </div>
      </div>
    </div>

    <style>
      :root {
        --v-primary: #0f172a;
        --v-accent: #2563eb;
        --v-success: #10b981;
        --v-warning: #f59e0b;
        --v-text: #1e293b;
        --v-text-light: #64748b;
      }
      .verify-container { min-height: 100vh; background: #f8fafc; display: flex; justify-content: center; padding: 20px; font-family: 'Inter', sans-serif; color: var(--v-text); }
      .verify-card { width: 100%; max-width: 480px; background: white; border-radius: 24px; box-shadow: 0 10px 40px rgba(0,0,0,0.08); overflow: hidden; height: fit-content; }
      
      .verify-badge { background: #ecf3ff; padding: 20px; display: flex; align-items: center; gap: 15px; border-bottom: 1px solid #e2e8f0; }
      .badge-icon { width: 44px; height: 44px; background: white; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; color: var(--v-success); box-shadow: 0 4px 10px rgba(16, 185, 129, 0.1); }
      .status-top { display: block; font-weight: 800; font-size: 13px; color: var(--v-success); letter-spacing: 0.5px; }
      .status-id { display: block; font-size: 11px; color: var(--v-text-light); }

      .verify-hero { position: relative; height: 220px; overflow: hidden; background: #eee; }
      .verify-hero img { width: 100%; height: 100%; object-fit: cover; }
      .photo-placeholder { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #cbd5e1; font-weight: 700; }
      .photo-placeholder i { font-size: 3rem; margin-bottom: 10px; }
      .hero-label { position: absolute; bottom: 0; left: 0; right: 0; padding: 30px 20px 15px; background: linear-gradient(transparent, rgba(0,0,0,0.7)); color: white; font-weight: 700; font-size: 1.1rem; }

      .verify-content { padding: 24px; }
      
      .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 25px; }
      .info-item label { display: block; font-size: 11px; font-weight: 700; color: var(--v-text-light); text-transform: uppercase; margin-bottom: 4px; }
      .info-item span { display: block; font-weight: 600; font-size: 14px; }
      .text-sm { font-size: 12px !important; line-height: 1.4; color: #475569; }

      .validity-box { padding: 20px; border-radius: 16px; text-align: center; margin-bottom: 25px; }
      .validity-box.v-success { background: #f0fdf4; border: 1px solid #dcfce7; }
      .validity-box.v-success .v-value { color: var(--v-success); }
      .validity-box.v-warning { background: #fffbeb; border: 1px solid #fef3c7; }
      .validity-box.v-warning .v-value { color: var(--v-warning); }
      
      .v-label { font-size: 10px; font-weight: 800; color: var(--v-text-light); letter-spacing: 1px; margin-bottom: 5px; }
      .v-value { font-size: 1.25rem; font-weight: 900; margin-bottom: 2px; text-transform: uppercase; }
      .v-score { font-size: 12px; font-weight: 600; opacity: 0.7; }

      .expert-box { background: #f1f5f9; padding: 15px; border-radius: 14px; margin-bottom: 25px; }
      .expert-header { font-size: 10px; font-weight: 800; color: var(--v-text-light); margin-bottom: 10px; letter-spacing: 0.5px; }
      .expert-main { display: flex; justify-content: space-between; align-items: center; }
      .ex-name { font-weight: 800; font-size: 14px; text-decoration: underline; }
      .ex-skk { font-size: 11px; margin-top: 2px; }
      .ex-role { font-size: 10px; color: var(--v-accent); font-weight: 700; margin-top: 4px; }
      .expert-check { font-size: 10px; font-weight: 800; color: var(--v-success); background: white; padding: 4px 10px; border-radius: 6px; }

      .summary-section { border-top: 1px solid #f1f5f9; padding-top: 20px; }
      .summary-title { font-size: 10px; font-weight: 800; color: var(--v-text-light); margin-bottom: 12px; text-align: center; }
      .summary-row { display: flex; justify-content: center; align-items: center; gap: 15px; font-size: 11px; }
      .s-dot { width: 8px; height: 8px; border-radius: 50%; }
      .col-arch { background: #a855f7; }
      .col-str { background: #ef4444; }
      .col-mep { background: #3b82f6; }
      .s-label { font-weight: 600; color: #475569; }
      .s-skor { font-weight: 800; color: var(--v-text); }

      .verify-footer { margin-top: 35px; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 20px; }
      .verify-footer p { font-size: 11px; color: var(--v-text-light); margin-bottom: 4px; }
      .text-xs { font-size: 10px !important; opacity: 0.6; }
    </style>
  `;
}

function renderError(msg) {
  return `
    <div class="verify-container">
      <div class="verify-card" style="padding: 60px 40px; text-align:center">
        <div style="font-size: 4rem; color: #ef4444; margin-bottom: 20px"><i class="fas fa-triangle-exclamation"></i></div>
        <h2 style="font-weight: 800; margin-bottom: 10px">Verifikasi Gagal</h2>
        <p style="color: #64748b; font-size: 14px; line-height: 1.6">${msg}</p>
        <button class="btn btn-primary" style="margin-top: 30px" onclick="window.navigate('dashboard')">Kembali ke Dashboard</button>
      </div>
    </div>
  `;
}

function escHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}
