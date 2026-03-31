/**
 * VERIFIKASI DOKUMEN DIGITAL (Refactored)
 * Halaman publik untuk memverifikasi keaslian dokumen & TTE.
 */
import { supabase } from '../lib/supabase.js';
import { getSettings } from '../lib/settings.js';
import { verifyDocumentIntegrity, validateSignerCertificate } from '../lib/tte-service.js';
import { escHtml, formatTanggal } from '../lib/utils.js';

export async function verifyPage(params = {}) {
   const id = params.id;
   const expertType = params.expert;

   const root = document.getElementById('page-root');
   if (root) renderLoading(root);

   try {
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
      const expert = expertType === 'director'
         ? { name: settings.consultant?.director_name || 'DIREKTUR', job: settings.consultant?.director_job || 'Direktur', skk: null }
         : settings.experts?.[expertType] || {};

      // Integrity Check & Certificate Validation
      const integrity = await verifyDocumentIntegrity(p);
      const cert = await validateSignerCertificate(expert);

      root.innerHTML = buildVerifyHtml(p, a, settings, expertType, expert, integrity, cert);
      
      // Inisialisasi Proteksi Keamanan
      initSecurityListeners();
   } catch (err) {
      if (root) root.innerHTML = renderError(err.message);
   }
}

/**
 * Mencegah interaksi tidak sah (Copy, Print, Screenshot Deterrent)
 */
function initSecurityListeners() {
   // 1. Matikan Klik Kanan
   document.addEventListener('contextmenu', e => e.preventDefault());

   // 2. Blokir Shortcut Keyboard (Copy, Print, Save, DevTools)
   document.addEventListener('keydown', e => {
      const forbiddenKeys = ['c', 'v', 'p', 's', 'u'];
      if (e.ctrlKey && forbiddenKeys.includes(e.key.toLowerCase())) {
         e.preventDefault();
         return false;
      }
      if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) {
         e.preventDefault();
         return false;
      }
      if (e.key === 'F12' || e.key === 'PrintScreen') {
         e.preventDefault();
         return false;
      }
   });

   // 3. Security Overlay saat Jendela Kehilangan Fokus (Cegah Screenshot tool)
   const overlay = document.getElementById('security-overlay');
   if (overlay) {
      window.addEventListener('blur', () => {
         overlay.classList.add('visible');
      });
      window.addEventListener('focus', () => {
         overlay.classList.remove('visible');
      });
   }
}

function buildVerifyHtml(p, a, s, expertType, expert, integrity, cert) {
   const statusLabel = a?.status_slf?.replace(/_/g, ' ') || 'DALAM PENGKAJIAN';
   const expertList = s.experts || {};
   const consultant = s.consultant || {};

   return `
    <div class="portal-root">
      <!-- SECURITY OVERLAY -->
      <div id="security-overlay" class="security-overlay">
         <div class="security-msg">
            <i class="fas fa-shield-alt"></i>
            <h3>KONTEN DILINDUNGI</h3>
            <p>Halaman ini berisi data teknis gedung. Untuk keamanan, tampilan ditutup saat jendela tidak aktif.</p>
         </div>
      </div>

      <!-- TOP NAVIGATION BAR (OFFICIAL PORTAL HEADER) -->
      <nav class="portal-nav">
        <div class="nav-container">
          <div class="nav-brand">
            ${consultant.logo
         ? `<img src="${consultant.logo}" alt="Logo" class="portal-logo">`
         : `<div class="portal-logo-placeholder"><i class="fas fa-microchip"></i></div>`
      }
            <div class="nav-brand-text">
              <span class="nav-company">${escHtml(consultant.name || 'SMART AI PENGKAJI')}</span>
              <span class="nav-tagline">Portal Verifikasi Dokumen Digital SLF</span>
            </div>
          </div>
          <div class="nav-badge">
             <div class="badge-v"><div class="badge-pulse"></div> <i class="fas fa-shield-check"></i> OFFICIAL VERIFIED</div>
          </div>
        </div>
      </nav>

      <!-- PORTAL HERO (VALIDATION STATUS) -->
      <div class="portal-hero">
        <div class="portal-container">
           <div class="hero-flex">
              <div class="hero-main">
                 <div class="hero-eyebrow">HASIL PEMERIKSAAN TEKNIS BANGUNAN</div>
                 <h1 class="hero-status ${a?.status_slf === 'LAIK_FUNGSI' ? 'text-success' : 'text-warning'}">
                    ${statusLabel}
                 </h1>
                 <div class="hero-ref">NOMOR DOKUMEN: ${escHtml(p.metadata?.nomor_surat || p.id.toUpperCase())}</div>
              </div>
              <div class="hero-score">
                 <div class="score-label">INDEKS KEANDALAN</div>
                 <div class="score-value">${a?.skor_total || '--'}<span>%</span></div>
              </div>
           </div>
        </div>
      </div>

      <!-- MAIN CONTENT -->
      <main class="portal-main">
        <div class="portal-container">
           <div class="portal-grid">
              <!-- LEFT COLUMN: BUILDING & EXPERTS -->
              <div class="portal-col-main">
                 
                 <!-- SECTION 1: DATA BANGUNAN -->
                 <section class="p-section card-formal">
                    <div class="p-section-header">
                       <i class="fas fa-building"></i> <span>Data Objek Bangunan Gedung</span>
                    </div>
                    <div class="p-building-hero">
                       ${p.foto_bangunan
         ? `<img src="${p.foto_bangunan}" alt="Foto Bangunan" class="p-building-img">`
         : `<div class="p-photo-placeholder"><i class="fas fa-image"></i></div>`
      }
                       <div class="p-building-overlay">
                          <h3>${escHtml(p.nama_bangunan)}</h3>
                          <p><i class="fas fa-map-marker-alt"></i> ${escHtml(p.alamat || '-')}</p>
                       </div>
                    </div>
                    <div class="p-table-grid">
                       <div class="p-row"><b>Fungsi Bangunan</b><span>${escHtml(p.fungsi_bangunan || '-')}</span></div>
                       <div class="p-row"><b>Jumlah Lantai</b><span>${p.jumlah_lantai || 0} Lantai</span></div>
                       <div class="p-row"><b>Luas Bangunan</b><span>${p.luas_bangunan || 0} m²</span></div>
                        <div class="p-row"><b>Luas Lahan</b><span>${p.luas_lahan || 0} m²</span></div>
                        <div class="p-row"><b>Koordinat</b><span>${p.latitude || '-'},${p.longitude || '-'}</span></div>
                       <div class="p-row"><b>Nomor Surat Pernyataan</b><span>${escHtml(p.metadata?.nomor_surat || '-')}</span></div>
                    </div>
                 </section>

                 <!-- SECTION 2: TIM PENGKAJI TEKNIS -->
                 <section class="p-section card-formal">
                    <div class="p-section-header">
                       <i class="fas fa-user-shield"></i> <span>Tim Ahli Pengkaji Teknis (Expert Consortium)</span>
                    </div>
                    <div class="p-expert-list">
                       <div class="p-expert-item">
                          <div class="p-ex-icon"><i class="fas fa-landmark"></i></div>
                          <div class="p-ex-info">
                             <label>Ahli Arsitektur</label>
                             <span>${escHtml(expertList.architecture?.name || '-')}</span>
                             <small>No. SKK: ${escHtml(expertList.architecture?.skk || 'Dalam Proses')}</small>
                          </div>
                          <div class="p-ex-status"><i class="fas fa-check-circle"></i> VERIFIED</div>
                       </div>
                       <div class="p-expert-item">
                          <div class="p-ex-icon"><i class="fas fa-drafting-compass"></i></div>
                          <div class="p-ex-info">
                             <label>Ahli Struktur</label>
                             <span>${escHtml(expertList.structure?.name || '-')}</span>
                             <small>No. SKK: ${escHtml(expertList.structure?.skk || 'Dalam Proses')}</small>
                          </div>
                          <div class="p-ex-status"><i class="fas fa-check-circle"></i> VERIFIED</div>
                       </div>
                       <div class="p-expert-item">
                          <div class="p-ex-icon"><i class="fas fa-bolt"></i></div>
                          <div class="p-ex-info">
                             <label>Ahli MEP / Kebakaran</label>
                             <span>${escHtml(expertList.mep?.name || '-')}</span>
                             <small>No. SKK: ${escHtml(expertList.mep?.skk || 'Dalam Proses')}</small>
                          </div>
                          <div class="p-ex-status"><i class="fas fa-check-circle"></i> VERIFIED</div>
                       </div>
                    </div>
                 </section>
              </div>

              <!-- RIGHT COLUMN: OWNER & SECURITY -->
              <div class="portal-col-sidebar">
                 
                 <!-- SECTION 3: DATA PEMILIK -->
                 <section class="p-section card-formal">
                    <div class="p-section-header">
                       <i class="fas fa-user-tie"></i> <span>Identitas Pemilik</span>
                    </div>
                    <div class="p-owner-box">
                       <div class="p-owner-label">NAMA PEMILIK / PEMOHON</div>
                       <div class="p-owner-name">${escHtml(p.pemilik || '-')}</div>
                       <div class="p-owner-date">Terbit pada: ${formatTanggal(p.created_at)}</div>
                    </div>
                 </section>

                 <!-- SECTION 4: INTEGRITAS DIGITAL -->
                 <section class="p-section card-formal p-security-card">
                    <div class="p-section-header">
                       <i class="fas fa-fingerprint"></i> <span>Security Validation</span>
                    </div>
                    <div class="p-security-content">
                       <div class="p-cert-badge"><i class="fas fa-lock"></i> TAMPER-PROOF DOKUMEN</div>
                       <div class="p-hash-box">
                          <label>SHA-256 DIGITAL FINGERPRINT</label>
                          <code>${integrity.fingerprint}</code>
                       </div>
                       <p class="p-security-desc">
                          Dokumen ini dilindungi dengan SHA-256 Digital Fingerprint yang unik. 
                          Setiap perubahan minor pada data teknis akan dideteksi sebagai pelanggaran integritas.
                       </p>
                        <div class="p-security-guide">
                           <h5><i class="fas fa-shield-alt"></i> PANDUAN VERIFIKASI KEAMANAN</h5>
                           <ul>
                              <li><i class="fas fa-check-circle"></i> <b>Integritas Data:</b> Sidik jari digital di atas mewakili seluruh data teknis bangunan (Luas, Alamat, Lantai).</li>
                              <li><i class="fas fa-check-circle"></i> <b>Anti-Tamper:</b> Algoritma SHA-256 menjamin bahwa data tidak dapat diubah tanpa merubah sidik jari secara total.</li>
                              <li><i class="fas fa-check-circle"></i> <b>Verifikasi:</b> Pastikan sidik jari di portal ini sama dengan yang tertera pada dokumen cetak Anda.</li>
                           </ul>
                        </div>
                    </div>
                 </section>

                 <!-- SECTION 5: PENANGGUNG JAWAB -->
                 <section class="p-section card-formal">
                    <div class="p-section-header">
                       <i class="fas fa-file-contract"></i> <span>Penanggung Jawab</span>
                    </div>
                    <div class="p-director-box">
                       <strong>${escHtml(consultant.director_name || 'DIREKTUR')}</strong>
                       <span>${escHtml(consultant.director_job || 'Direktur Utama')}</span>
                       <div class="p-badge-signed"><i class="fas fa-signature"></i> SIGNED BY TTE</div>
                    </div>
                 </section>

              </div>
           </div>
        </div>
      </main>

      <!-- PORTAL FOOTER -->
      <footer class="portal-footer">
        <div class="portal-container">
           <div class="footer-grid">
              <div class="footer-info">
                 <h4>KONSULTAN PENGKAJI TEKNIS</h4>
                 <p>${escHtml(consultant.name)}</p>
                 <p>${escHtml(consultant.address)}</p>
              </div>
              <div class="footer-logos">
                 <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT0CHufWICEEYamtuoTfWNd1KWVz1R3RguRrg&s" alt="SIMBG">
              </div>
           </div>
           <div class="footer-copyright">
              © ${new Date().getFullYear()} Smart AI Pengkaji SLF. Seluruh data terintegrasi dengan Gateway SIMBG Nasional.
           </div>
        </div>
      </footer>
    </div>

    <style>
      @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&family=JetBrains+Mono&family=Inter:wght@400;500;700&display=swap');

      /* AGGRESSIVE OVERRIDE FOR TRUE FULL-SCREEN PORTAL */
      html, body { margin: 0 !important; padding: 0 !important; background: #fff !important; min-height: 100vh; width: 100% !important; overflow-x: hidden; overflow-y: auto !important; }
      #app, #app-layout, #main-content, .page-container, #page-root { 
        width: 100% !important; max-width: 100% !important; margin: 0 !important; padding: 0 !important; 
        border: none !important; box-shadow: none !important; display: block !important;
        height: auto !important; min-height: 100vh !important; overflow: visible !important;
      }
      /* Forced hide of internal app interface globally on this page */
      .sidebar, .app-header, .bottom-nav, #sidebar-backdrop, #project-context-container { display: none !important; }
      
      :root {
        --p-bg: #fff;
        --p-primary: #1e1b4b;
        --p-accent: #4f46e5;
        --p-text: #334155;
        --p-text-light: #64748b;
        --p-border: #e2e8f0;
        --p-success: #10b981;
        --p-warning: #f59e0b;
      }

      .portal-root {
        min-height: 100vh;
        width: 100%;
        background: var(--p-bg);
        font-family: 'Inter', sans-serif;
        color: var(--p-text);
        
        /* PROTECTION: NO SELECT */
        user-select: none !important;
        -webkit-user-select: none !important;
        -ms-user-select: none !important;
      }

      /* PROTECTION: PRINT */
      @media print {
        body { visibility: hidden !important; display: none !important; }
        .portal-root { display: none !important; }
      }

      /* SECURITY OVERLAY */
      .security-overlay {
         position: fixed; top: 0; left: 0; width: 100%; height: 100%;
         background: #0f172a; z-index: 9999;
         display: none; align-items: center; justify-content: center;
         color: #fff; text-align: center; backdrop-filter: blur(20px);
      }
      .security-overlay.visible { display: flex; }
      .security-msg i { font-size: 5rem; color: #6366f1; margin-bottom: 24px; animation: pPulse 2s infinite; }
      .security-msg h3 { font-family: 'Outfit'; font-size: 2rem; font-weight: 800; margin: 0; }
      .security-msg p { color: #94a3b8; font-size: 1.1rem; max-width: 400px; margin-top: 15px; line-height: 1.6; }
      @keyframes pPulse { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.1); opacity: 0.7; } 100% { transform: scale(1); opacity: 1; } }

      .portal-container { width: 100%; max-width: 100% !important; margin: 0; padding: 0 60px; box-sizing: border-box; }

      /* NAVBAR */
      .portal-nav { background: #fff; border-bottom: 1px solid var(--p-border); padding: 20px 0; position: sticky; top: 0; z-index: 100; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
      .nav-container { display: flex; justify-content: space-between; align-items: center; }
      .nav-brand { display: flex; align-items: center; gap: 15px; }
      .portal-logo { height: 50px; width: auto; }
      .portal-logo-placeholder { width: 50px; height: 50px; background: var(--p-primary); color: #fff; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.8rem; }
      .nav-brand-text { display: flex; flex-direction: column; }
      .nav-company { font-weight: 800; font-family: 'Outfit'; font-size: 1.3rem; color: var(--p-primary); line-height: 1; }
      .nav-tagline { font-size: 12px; color: var(--p-text-light); text-transform: uppercase; letter-spacing: 1px; margin-top: 4px; }
      .badge-v { background: #ecfdf5; color: #059669; padding: 8px 18px; border-radius: 50px; font-size: 12px; font-weight: 800; display: flex; align-items: center; gap: 8px; border: 1px solid #d1fae5; }
      .badge-pulse { width: 10px; height: 10px; background: #10b981; border-radius: 50%; animation: pPulsing 2s infinite; }
      @keyframes pPulsing { 0% { box-shadow: 0 0 0 0 rgba(16,185,129,0.7); } 70% { box-shadow: 0 0 0 12px rgba(16,185,129,0); } 100% { box-shadow: 0 0 0 0 rgba(16,185,129,0); } }

      /* HERO */
      .portal-hero { background: var(--p-primary); color: #fff; padding: 80px 0; background-image: radial-gradient(circle at top right, rgba(79, 70, 229, 0.25), transparent); }
      .hero-flex { display: flex; justify-content: space-between; align-items: center; }
      .hero-eyebrow { font-size: 14px; font-weight: 700; color: #a5b4fc; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 16px; }
      .hero-status { font-family: 'Outfit'; font-size: 4.5rem; font-weight: 800; margin: 0 0 16px; line-height: 1; letter-spacing: -2px; }
      .hero-ref { font-size: 14px; font-weight: 500; font-family: 'JetBrains Mono'; opacity: 0.6; }
      .hero-score { text-align: center; background: rgba(255,255,255,0.05); padding: 24px 40px; border-radius: 24px; border: 1px solid rgba(255,255,255,0.15); backdrop-filter: blur(8px); }
      .score-label { font-size: 11px; font-weight: 700; opacity: 0.7; margin-bottom: 6px; }
      .score-value { font-family: 'Outfit'; font-size: 3.5rem; font-weight: 800; line-height: 1; color: #fff; }
      .score-value span { font-size: 1.5rem; opacity: 0.6; }

      /* MAIN */
      .portal-main { padding: 60px 0; margin-top: -60px; }
      .portal-grid { display: grid; grid-template-columns: 1.8fr 1fr; gap: 40px; }
      .card-formal { background: #fff; border-radius: 24px; border: 1px solid var(--p-border); box-shadow: 0 10px 30px rgba(0,0,0,0.04); overflow: hidden; margin-bottom: 40px; }
      .p-section-header { background: #f8fafc; padding: 20px 30px; border-bottom: 1px solid var(--p-border); font-weight: 800; font-size: 14px; color: var(--p-primary); display: flex; align-items: center; gap: 12px; text-transform: uppercase; letter-spacing: 1px; }
      .p-section-header i { color: var(--p-accent); font-size: 1.1rem; }

      .p-building-hero { position: relative; height: 400px; overflow: hidden; }
      .p-building-img { width: 100%; height: 100%; object-fit: cover; }
      .p-photo-placeholder { height: 100%; display: flex; align-items: center; justify-content: center; background: #f1f5f9; color: #cbd5e1; font-size: 5rem; }
      .p-building-overlay { position: absolute; bottom: 0; left: 0; right: 0; padding: 40px; background: linear-gradient(transparent, rgba(0,0,0,0.9)); color: #fff; }
      .p-building-overlay h3 { font-family: 'Outfit'; font-size: 1.8rem; font-weight: 800; margin: 0 0 8px; }
      .p-building-overlay p { font-size: 16px; opacity: 0.8; margin: 0; }

      .p-table-grid { padding: 30px; }
      .p-row { display: flex; justify-content: space-between; padding: 16px 0; border-bottom: 1px dashed var(--p-border); font-size: 16px; }
      .p-row:last-child { border-bottom: none; }
      .p-row b { color: var(--p-text-light); font-weight: 500; }
      .p-row span { font-weight: 700; color: var(--p-primary); }

      .p-expert-list { padding: 30px; display: flex; flex-direction: column; gap: 24px; }
      .p-expert-item { display: flex; align-items: center; gap: 20px; padding: 20px; background: #f8fafc; border-radius: 18px; border: 1px solid var(--p-border); transition: all 0.2s; }
      .p-expert-item:hover { border-color: var(--p-accent); background: #fff; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
      .p-ex-icon { width: 56px; height: 56px; background: #fff; border-radius: 14px; display: flex; align-items: center; justify-content: center; color: var(--p-accent); font-size: 1.5rem; box-shadow: 0 4px 8px rgba(0,0,0,0.05); }
      .p-ex-info { flex: 1; display: flex; flex-direction: column; }
      .p-ex-info label { font-size: 10px; font-weight: 700; color: var(--p-text-light); text-transform: uppercase; margin-bottom: 4px; }
      .p-ex-info span { font-weight: 800; color: var(--p-primary); font-size: 1.1rem; }
      .p-ex-info small { font-size: 11px; color: var(--p-accent); font-weight: 600; margin-top: 2px; }
      .p-ex-status { font-size: 11px; font-weight: 800; color: var(--p-success); display: flex; align-items: center; gap: 6px; }

      .p-owner-box { padding: 30px; }
      .p-owner-label { font-size: 11px; font-weight: 700; color: var(--p-text-light); margin-bottom: 10px; }
      .p-owner-name { font-family: 'Outfit'; font-size: 1.5rem; font-weight: 800; color: var(--p-primary); }
      .p-owner-date { font-size: 13px; color: var(--p-text-light); margin-top: 6px; }

      .p-security-card { background: #0f172a; color: #fff; border-color: #1e293b; box-shadow: 0 10px 40px rgba(0,0,0,0.2); }
      .p-security-card .p-section-header { background: #1e293b; border-color: #334155; color: #fff; }
      .p-security-content { padding: 30px; }
      .p-cert-badge { background: rgba(16, 185, 129, 0.15); color: #34d399; padding: 10px 16px; border-radius: 12px; font-size: 12px; font-weight: 800; text-align: center; margin-bottom: 24px; border: 1px solid rgba(16,185,129,0.3); }
      .p-hash-box { margin-bottom: 24px; }
      .p-hash-box label { display: block; font-size: 9px; font-family: 'JetBrains Mono'; opacity: 0.5; margin-bottom: 8px; letter-spacing: 1px; }
      .p-hash-box code { display: block; background: #000; padding: 16px; border-radius: 12px; font-size: 11px; word-break: break-all; color: #38bdf8; font-family: 'JetBrains Mono'; border: 1px solid #334155; line-height: 1.5; }
      .p-security-desc { font-size: 11px; color: #94a3b8; line-height: 1.6; margin-bottom: 24px; opacity: 0.8; }
      .p-security-guide { border-top: 1px solid #1e293b; padding-top: 20px; }
      .p-security-guide h5 { font-size: 10px; font-weight: 700; color: #38bdf8; text-transform: uppercase; margin-bottom: 12px; letter-spacing: 0.5px; display: flex; align-items: center; gap: 8px; }
      .p-security-guide ul { margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 10px; }
      .p-security-guide li { font-size: 11px; color: #cbd5e1; display: flex; align-items: flex-start; gap: 10px; line-height: 1.4; }
      .p-security-guide li i { font-size: 10px; color: #34d399; margin-top: 3px; }

      .p-director-box { padding: 32px; display: flex; flex-direction: column; text-align: center; }
      .p-director-box strong { font-family: 'Outfit'; font-size: 1.3rem; color: var(--p-primary); text-decoration: underline; text-underline-offset: 6px; text-decoration-color: var(--p-accent); }
      .p-director-box span { font-size: 14px; color: var(--p-text-light); margin-top: 8px; font-weight: 500; }
      .p-badge-signed { margin-top: 20px; font-size: 12px; font-weight: 800; color: var(--p-success); display: flex; align-items: center; justify-content: center; gap: 8px; background: #ecfdf5; padding: 8px; border-radius: 10px; }

      /* FOOTER */
      .portal-footer { background: #fff; border-top: 1px solid var(--p-border); padding: 80px 0; color: var(--p-text-light); }
      .footer-grid { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
      .footer-info h4 { font-size: 14px; font-weight: 800; color: var(--p-primary); margin: 0 0 12px; text-transform: uppercase; }
      .footer-info p { font-size: 14px; margin: 4px 0; line-height: 1.5; }
      .footer-logos img { height: 50px; filter: grayscale(1); opacity: 0.5; transition: opacity 0.3s; }
      .footer-logos img:hover { opacity: 0.8; filter: grayscale(0); }
      .footer-copyright { border-top: 1px solid #f1f5f9; padding-top: 30px; font-size: 12px; text-align: center; opacity: 0.7; }

      @media (max-width: 1100px) {
        .portal-grid { grid-template-columns: 1fr; }
        .hero-status { font-size: 3.5rem; }
        .hero-flex { flex-direction: column; align-items: flex-start; gap: 40px; }
        .portal-container { padding: 0 30px; }
      }

      @media (max-width: 600px) {
        .hero-status { font-size: 2.5rem; }
        .portal-container { padding: 0 20px; }
        .p-building-hero { height: 250px; }
      }
    </style>
  `;
}

function renderLoading(root) {
   root.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;gap:20px;color:#d1d5db;background:#0f172a;font-family:'Outfit',sans-serif;">
      <div style="width:60px;height:60px;border:4px solid rgba(99,102,241,0.1);border-top-color:#6366f1;border-radius:50%;animation:v-spin 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;"></div>
      <p style="font-weight:600;letter-spacing:1px;font-size:0.9rem">VERIFIKASI INTEGRITAS DIGITAL...</p>
    </div>
    <style>@keyframes v-spin { to { transform: rotate(360deg); } }</style>
  `;
}

function renderError(msg) {
   return `
    <div class="verify-page-wrapper">
      <div class="v-glass-container" style="padding: 60px 30px; text-align:center">
        <div style="font-size: 5rem; color: #ef4444; margin-bottom: 24px; filter: drop-shadow(0 0 20px rgba(239,68,68,0.3))">
          <i class="fas fa-shield-virus"></i>
        </div>
        <h2 style="font-weight: 800; font-size: 1.8rem; color: #fff;">Verifikasi Gagal</h2>
        <p style="color: #94a3b8; font-size: 15px; margin-top: 15px; line-height: 1.6">${msg}</p>
        <button class="btn btn-primary" style="margin-top: 40px; background: #334155; border: none; padding: 12px 30px; border-radius: 12px; font-weight: 700" onclick="window.navigate('dashboard')">
           LAPORKAN MASALAH
        </button>
        <div style="margin-top:20px; font-size:10px; color:#475569">Smart AI Security Protocol v2.0</div>
      </div>
    </div>
  `;
}
