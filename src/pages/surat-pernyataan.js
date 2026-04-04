import { supabase } from '../lib/supabase.js';
import { navigate } from '../lib/router.js';
import { showSuccess, showError, showInfo } from '../components/toast.js';
import { getSettings } from '../lib/settings.js';
import { getNextSequence, formatDocumentNumber } from '../lib/numbering-service.js';
import { logActivity } from '../lib/audit-service.js';

/**
 * SURAT PERNYATAAN PAGE (ULTRA MODERN UI/UX)
 * Interactive A4 preview and editor for 3 Experts & TTE.
 * Follows PP 16/2021 & SIMBG Formal Standard.
 */
export async function suratPernyataanPage(params = {}) {
  const id = params.id;
  if (!id) { navigate('proyek'); return ''; }

  const root = document.getElementById('page-root');
  if (root) root.innerHTML = '<div class="loading-full-overlay"><div class="modern-spinner"></div><p>Sinkronisasi Enkripsi TTE SIMBG...</p></div>';

  try {
    // 1. Concurrent fetching for speed
    const [proyekRes, settings, findingsRes] = await Promise.all([
      supabase.from('proyek').select('*').eq('id', id).single(),
      getSettings(),
      supabase.from('checklist_items').select('*').eq('proyek_id', id)
    ]);

    if (proyekRes.error) throw proyekRes.error;
    
    const proyek = proyekRes.data;
    
    // Auto-generate nomor_surat if missing
    if (!proyek.metadata?.nomor_surat) {
       try {
          const seq = await getNextSequence();
          const format = settings.consultant?.nomor_surat_format || '[SEQ]/SP-SLF/[ROMAN_MONTH]/[YEAR]';
          const newNum = formatDocumentNumber(format, seq);
          
          proyek.metadata = { ...(proyek.metadata || {}), nomor_surat: newNum };
          
          // Save back to DB
          await supabase.from('proyek').update({ metadata: proyek.metadata }).eq('id', id);
          showInfo(`Nomor surat baru dihasilkan: ${newNum}`);
       } catch (err) {
          console.error("Failed to auto-number:", err);
       }
    }
    
    // Filtering findings meticulously in JS
    const findings = (findingsRes.data || []).filter(item => 
      item.status && 
      !['baik', 'ada_sesuai', 'tidak_wajib'].includes(item.status)
    );

    // 2. Build Shell
    if (root) {
      root.className = 'page-no-scroll';
      root.innerHTML = buildModernLayout(proyek, settings);
      
      // 3. Initialize UI Handlers
      initModernHandlers(proyek, settings, findings);
      
      // 4. Trigger Initial Render (Consultant by default)
      const preview = document.getElementById('legal-preview');
      if (preview) {
         preview.innerHTML = renderDocTemplate('konsultan', proyek, settings, findings);
      }

      // 5. Signature Modal Root
      if (!document.getElementById('sig-modal-container')) {
         const div = document.createElement('div');
         div.id = 'sig-modal-container';
         document.body.appendChild(div);
      }
    }
  } catch (err) {
    console.error("[SURAT_PERNYATAAN] Critical Error:", err);
    if (root) {
      root.innerHTML = `<div class="p-10 text-center"><h2 class="text-danger">Gagal Memuat Dokumen</h2><p>${err.message}</p></div>`;
    }
  }
}

/**
 * Modern Sidebar & Canvas Layout (Glassmorphism)
 */
function buildModernLayout(p, s) {
  return `
    <div id="sp-modern-container" class="modern-app-layout">
      <!-- Sidebar Glass -->
      <aside class="sp-sidebar-glass">
        <div class="sidebar-top">
          <button class="btn-back-modern" onclick="window.navigate('proyek-detail', {id:'${p.id}'})">
            <i class="fas fa-chevron-left"></i> Kembali ke Proyek
          </button>
          
          <div class="sidebar-brand-box">
             <div class="brand-chip">FORMAT RESMI SIMBG</div>
             <h1>Legal Statement</h1>
             <p>Aspek Keandalan Bangunan · PP 16/2021</p>
          </div>
        </div>

        <nav class="sidebar-nav-modern">
          <div class="nav-card active" data-type="konsultan">
            <div class="nav-card-icon"><i class="fas fa-shield-halved"></i></div>
            <div class="nav-card-body">
              <span class="nav-title">Pernyataan Pengkaji</span>
              <span class="nav-subtitle">Konsultan & 3 Tenaga Ahli</span>
            </div>
            <div class="nav-card-status"><i class="fas fa-check-circle"></i></div>
          </div>

          <div class="nav-card" data-type="pemilik">
            <div class="nav-card-icon"><i class="fas fa-user-check"></i></div>
            <div class="nav-card-body">
              <span class="nav-title">Pernyataan Pemilik</span>
              <span class="nav-subtitle">Komitmen & Tabel Temuan</span>
            </div>
            <div class="nav-card-status"><i class="fas fa-circle"></i></div>
          </div>
        </nav>

        <div class="sidebar-bottom">
           <div class="tte-security-badge">
              <i class="fas fa-fingerprint"></i>
              <div>
                <strong>TTE TERVERIFIKASI</strong>
                <p>UU ITE No. 11/2008 Aktif</p>
              </div>
           </div>

           <div class="edit-mode-glass">
              <label class="toggle-modern">
                <div class="toggle-text">
                   <strong>Mode Edit Bebas</strong>
                   <p>Kertas A4 menjadi editable</p>
                </div>
                <input type="checkbox" id="toggle-edit-mode">
                <span class="slider-modern"></span>
              </label>
           </div>

           <button class="btn-modern btn-primary btn-lg shadow-blue w-full" id="btn-export-word">
              <i class="fas fa-file-word"></i> Ekspor Ms. Word Resmi
           </button>

           <div style="margin-top:20px; padding-top:15px; border-top:1px dashed rgba(0,0,0,0.1)">
              <button class="btn-modern btn-lg w-full" id="btn-finalize-doc" 
                      style="background:#0f172a; color:#fff; border:none">
                 <i class="fas fa-stamp"></i> FINALISASI & SEGEL
              </button>
              <p style="font-size:9px; color:#64748b; text-align:center; margin-top:10px">
                 <i class="fas fa-info-circle"></i> Setelah disegel, data teknis tidak dapat diubah lagi.
              </p>
           </div>
        </div>
      </aside>

      <!-- Document Canvas Technical -->
      <main class="sp-canvas-technical">
         <div class="canvas-viewport">
            <div id="legal-preview" class="paper-a4-modern" contenteditable="false">
               <!-- Content injected here -->
            </div>
         </div>
      </main>
    </div>

    <style>      .modern-app-layout { display: grid; grid-template-columns: 320px 1fr; height: calc(100vh - 64px); background: #f0f2f5; overflow: hidden; font-family: 'Inter', sans-serif; }
      
      @media (max-width: 1024px) {
        .modern-app-layout { grid-template-columns: 1fr; height: auto; overflow-y: auto; }
        .sp-sidebar-glass { width: 100% !important; border-right: none; border-bottom: 1px solid rgba(0,0,0,0.05); height: auto; position: relative !important; }
        .sp-canvas-technical { height: calc(100vh - 100px); overflow-x: auto; }
      }

      /* Sidebar Modern Glass */
      .sp-sidebar-glass { 
        width: 320px; 
        background: rgba(255, 255, 255, 0.7); 
        backdrop-filter: blur(15px); 
        -webkit-backdrop-filter: blur(15px);
        border-right: 1px solid rgba(0,0,0,0.05);
        display: flex; flex-direction: column; padding: 24px;
        box-shadow: 10px 0 40px rgba(0,0,0,0.03); 
        overflow-y: auto;
      }
      .btn-back-modern { 
        background: none; border: none; font-size: 13px; font-weight: 600; color: #1e40af; 
        display: flex; align-items:center; gap: 8px; cursor: pointer; padding: 0; margin-bottom: 24px; 
        transition: opacity 0.2s;
      }
      .btn-back-modern:hover { opacity: 0.6; }
      .brand-chip { display: inline-block; padding: 4px 10px; background: #dbeafe; color: #1e40af; font-size: 10px; font-weight: 800; border-radius: 6px; margin-bottom: 8px; }
      .sidebar-brand-box h1 { font-size: 24px; font-weight: 900; color: #0f172a; margin: 0; letter-spacing: -0.5px; }
      .sidebar-brand-box p { font-size: 12px; color: #64748b; margin-top: 4px; }

      .sidebar-nav-modern { flex: 1; margin: 30px 0; display: flex; flex-direction: column; gap: 12px; }
      .nav-card { 
        display: flex; align-items: center; gap: 16px; padding: 18px; border-radius: 16px; 
        background: #fff; border: 1px solid #f1f5f9; cursor: pointer; transition: all 0.3s ease; 
        position: relative;
      }
      .nav-card:hover { border-color: #3b82f6; transform: translateY(-2px); box-shadow: 0 10px 20px rgba(0,0,0,0.05); }
      .nav-card.active { border-color: #2563eb; background: linear-gradient(135deg, #1d4ed8, #2563eb); color: #fff; }
      .nav-card-icon { width: 44px; height: 44px; background: #eff6ff; display: flex; align-items:center; justify-content:center; border-radius: 12px; font-size: 20px; color: #2563eb; }
      .nav-card.active .nav-card-icon { background: rgba(255,255,255,0.2); color: #fff; }
      .nav-card-body { flex: 1; }
      .nav-title { display: block; font-weight: 800; font-size: 14px; }
      .nav-subtitle { display: block; font-size: 10px; opacity: 0.7; }
      .nav-card-status { font-size: 18px; color: #cbd5e1; }
      .nav-card.active .nav-card-status { color: #fff; }

      .tte-security-badge { 
        display: flex; align-items: center; gap: 15px; padding: 16px; 
        background: #0f172a; color: #fff; border-radius: 16px; margin-bottom: 16px; 
      }
      .tte-security-badge i { font-size: 28px; color: #3b82f6; }
      .tte-security-badge strong { font-size: 12px; display: block; }
      .tte-security-badge p { font-size: 10px; opacity: 0.6; margin: 0; }

      .edit-mode-glass { background: #fff; border-radius: 12px; padding: 15px; border: 1px solid #f1f5f9; margin-bottom: 20px; }
      .toggle-modern { display: flex; align-items: center; justify-content: space-between; gap: 15px; cursor: pointer; }
      .toggle-text strong { display: block; font-size: 13px; color: #1e293b; }
      .toggle-text p { font-size: 10px; color: #64748b; margin: 0; }
      
      .btn-modern { 
        border: none; border-radius: 12px; font-weight: 800; cursor: pointer; 
        display: flex; align-items: center; justify-content: center; gap: 10px;
        transition: all 0.3s;
      }
      .btn-modern.btn-lg { height: 56px; font-size: 15px; }
      .btn-modern.btn-primary { background: #2563eb; color: #fff; }
      .btn-modern.btn-primary:hover { background: #1d4ed8; transform: translateY(-2px); box-shadow: 0 15px 30px rgba(37, 99, 235, 0.4); }

      /* Technical Canvas */
      .sp-canvas-technical { flex: 1; overflow: hidden; position: relative; }
      .canvas-viewport { 
         height: 100%; overflow-y: auto; padding: 40px 20px 200px 20px; display: flex; justify-content: center;
         background-color: #cbd5e1;
         background-image: 
           linear-gradient(45deg, #e2e8f0 25%, transparent 25%, transparent 50%, #e2e8f0 50%, #e2e8f0 75%, transparent 75%, transparent);
         background-size: 100px 100px;
         scroll-behavior: smooth;
      }

      .paper-a4-modern { 
        width: 210mm; min-height: 297mm; height: auto; 
        background-color: #fff;
        background-image: 
          linear-gradient(to bottom, #fff 0, #fff 297mm, #cbd5e1 297mm, #cbd5e1 307mm);
        background-size: 100% 307mm;
        padding: 0; /* Changed: padding now on internal pages */
        box-shadow: 0 10px 30px rgba(0,0,0,0.2); 
        font-family: 'Times New Roman', serif;
        word-wrap: break-word; color: #000; text-align: justify;
        line-height: 1.5; font-size: 11pt; position: relative;
        animation: paperFadeIn 0.5s ease-out;
      }

      @media (max-width: 210mm) {
        .paper-a4-modern { 
           transform: scale(0.9);
           transform-origin: top center;
           margin-bottom: -100px;
        }
      }
      @media (max-width: 600px) {
        .paper-a4-modern { 
           transform: scale(0.6);
           transform-origin: top center;
           margin-bottom: -400px;
        }
      }

      .paper-page-content {
        padding: 30mm 20mm;
        min-height: 297mm;
        width: 100%;
        display: flex;
        flex-direction: column;
        position: relative;
      }

      @keyframes paperFadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }


      /* Formal Document Styling Internal (PP 16/2021) */
      .hf-doc-header { border-bottom: 4px double #000; padding-bottom: 20px; margin-bottom: 25px; text-align: center; }
      .hf-doc-title { text-align: center; font-weight: bold; font-size: 13pt; margin-bottom: 25px; line-height: 1.2; text-transform: uppercase; }
      
      .hf-meta-grid { display: grid; grid-template-columns: 80px 10px 1fr; margin-bottom: 20px; font-weight: 500; font-size: 10.5pt; }
      
      .hf-section-title { font-weight: bold; margin: 15px 0 10px 0; font-size: 11pt; text-decoration: underline; }
      
      /* Universal Data Alignment Grid */
      .hf-data-grid { margin: 10px 0 20px 0; display: flex; flex-direction: column; gap: 4px; font-size: 10.5pt; }
      .hf-grid-row { display: grid; grid-template-columns: 25px 180px 15px 1fr; align-items: baseline; }
      .hf-grid-row.nested { margin-left: 25px; grid-template-columns: 25px 155px 15px 1fr; }

      .box-result-formal { border: 2px solid #000; padding: 12px; text-align: center; font-weight: bold; font-size: 11pt; margin: 20px 0; text-transform: uppercase; letter-spacing: 0.5px; }

      /* Multi-Signature Block (Revised for Director Center Above Experts) */
      .sig-director-area { margin-top: 30px; display: flex; justify-content: center; }
      .sig-director-box { width: 450px; text-align: center; position: relative; }
      .sig-director-flex { display: flex; align-items: center; justify-content: center; gap: 30px; margin: 15px 0; }
      
      .ematerai-placeholder { 
        width: 100px; height: 100px; border: 2px dashed #3b82f6; border-radius: 4px; 
        display: flex; flex-direction: column; align-items:center; justify-content:center;
        font-size: 8pt; color: #1e40af; background: #eff6ff; font-family: 'Inter', sans-serif;
        font-weight: 900; line-height: 1.1; padding: 5px; opacity: 0.9;
      }
      .ematerai-placeholder span.val { font-size: 14pt; display: block; border-top: 1px solid #3b82f6; margin-top:5px; padding-top:6px; width: 100%; }
      
      .sig-experts-container { margin-top: 40px; }
      .sig-experts-title { text-align: center; font-weight: bold; margin-bottom: 25px; text-decoration: underline; font-size: 11pt; }
      .sig-experts-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
      .sig-expert-card { text-align: center; font-size: 9.5pt; break-inside: avoid; }
      
      .sig-box-tte { height: 110px; width: 100%; display: flex; align-items: center; justify-content: center; position: relative; }
      .sig-qr-small { width: 100px; height: 100px; border: 1px solid #000; background: #fff; padding: 2px; }
      .sig-name-underline { font-weight: bold; text-decoration: underline; text-transform: uppercase; margin-top: 10px; font-size: 10.5pt; }

      /* Page Break Simulation */
      .page-break-professional { padding: 40px 0; text-align: center; color: #64748b; font-size: 10px; font-weight: bold; opacity: 0.5; }
      
      /* Avoid splits */
      .hf-data-grid, .hf-meta-grid, .sig-director-area, .sig-experts-container, .box-result-formal { break-inside: avoid; }
    <style>
      .modern-table-temuan { width: 100%; border-collapse: separate; border-spacing: 0; border: 1px solid #000; margin-top: 15px; font-size: 10pt; }
      .modern-table-temuan th { background: #f8fafc; border: 1px solid #000; padding: 8px; text-align: left; font-weight: bold; }
      .modern-table-temuan td { border: 1px solid #000; padding: 8px; vertical-align: top; }

      /* SIGNATURE PAD OVERLAY */
      .sig-modal-overlay { position: fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); backdrop-filter:blur(10px); z-index:20000; display:flex; align-items:center; justify-content:center; }
      .sig-modal-card { background:#fff; border-radius:24px; width:540px; padding:24px; box-shadow:0 30px 60px rgba(0,0,0,0.5); }
      .sig-modal-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; }
      .sig-modal-header h3 { font-family:'Inter'; font-weight:800; font-size:1.1rem; margin:0; }
      .btn-close-sig { background:none; border:none; font-size:1.5rem; cursor:pointer; }
      .sig-canvas-wrap { border:2px dashed #cbd5e1; border-radius:12px; background:#f8fafc; cursor:crosshair; margin-bottom:20px; overflow:hidden; }
      .sig-modal-footer { display:flex; justify-content:space-between; }
      
      /* SIGN BUTTON IN DOC */
      .btn-sign-here { 
        padding: 4px 12px; border-radius:6px; background:#eff6ff; color:#2563eb; 
        border:1px dashed #2563eb; font-size:9px; font-weight:800; cursor:pointer; 
        transition:all 0.2s; margin-top:8px;
        display: inline-flex; align-items:center; gap:4px;
      }
      .btn-sign-here:hover { background:#2563eb; color:#fff; }
    </style>
  `;
}

function formatMonth(d) {
  return d.toLocaleDateString('id-ID', { month: 'long' });
}

/**
 * Handle Tab switching and UI interactions
 */
function initModernHandlers(p, s, findings) {
  const navCards = document.querySelectorAll('.nav-card');
  const preview = document.getElementById('legal-preview');
  
  navCards.forEach(card => {
    card.onclick = () => {
      navCards.forEach(c => {
         c.classList.remove('active');
         c.querySelector('.nav-card-status i').className = 'fas fa-circle';
      });
      card.classList.add('active');
      card.querySelector('.nav-card-status i').className = 'fas fa-check-circle';
      
      const type = card.getAttribute('data-type');
      preview.innerHTML = renderDocTemplate(type, p, s, findings);
    };
  });

  // Export Logic
  document.getElementById('btn-export-word').onclick = () => {
     downloadDocx(p, s);
  };

  // Toggle Edit Mode
  const toggleEdit = document.getElementById('toggle-edit-mode');
  if (toggleEdit) {
    toggleEdit.onchange = (e) => {
      preview.setAttribute('contenteditable', e.target.checked ? 'true' : 'false');
      if (e.target.checked) {
         showSuccess("Mode Edit Bebas Aktif. Anda dapat mengetik langsung di kertas.");
         preview.focus();
      }
    };
  }

  // Signature Buttons Click Handlers (Delegated)
  preview.onclick = (e) => {
     const btn = e.target.closest('.btn-sign-here');
     if (btn) {
        const type = btn.dataset.type; // architecture, structure, mep, director
        openSignaturePad(type, p, s, findings);
     }
  };

  // Finalize Button
  const btnFinalize = document.getElementById('btn-finalize-doc');
  if (btnFinalize) {
     if (p.metadata?.is_finalized) {
        btnFinalize.disabled = true;
        btnFinalize.innerHTML = '<i class="fas fa-lock"></i> TELAH DISEGEL';
        btnFinalize.style.background = '#059669';
     }

     btnFinalize.onclick = async () => {
        if (!confirm("Apakah Bapak yakin ingin memfinalisasi & menyegel dokumen ini? \n\nData SEGERA DIKUNCI dan sidik jari digital (Hash) akan dihasilkan untuk keperluan hukum.")) return;
        
        btnFinalize.disabled = true;
        btnFinalize.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Menghitung Hash SHA-256...';
        
        try {
           const { verifyDocumentIntegrity } = await import('../lib/tte-service.js');
           const res = await verifyDocumentIntegrity(p);
           
           const metadata = { 
              ...(p.metadata || {}), 
              is_finalized: true, 
              finalized_at: new Date().toISOString(),
              document_hash: res.fingerprint 
           };
           
           const { error } = await supabase.from('proyek').update({ metadata }).eq('id', p.id);
           if (error) throw error;
           
           // Log Audit
           await logActivity('FINALISASI_DOKUMEN', p.id, { hash: res.fingerprint });
           
           p.metadata = metadata;
           showSuccess("Dokumen Berhasil Difinalisasi & Disegel secara Digital.");
           window.location.reload(); // Refresh to lock everything
        } catch (err) {
           showError(err.message);
           btnFinalize.disabled = false;
           btnFinalize.innerHTML = '<i class="fas fa-stamp"></i> FINALISASI & SEGEL';
        }
     };
  }
}

/**
 * OPEN SIGNATURE PAD OVERLAY
 */
function openSignaturePad(type, p, s, findings) {
  const container = document.getElementById('sig-modal-container');
  const roleName = type === 'director' ? 'Direktur' : (`Ahli ${type.charAt(0).toUpperCase() + type.slice(1)}`);
  
  container.innerHTML = `
    <div class="sig-modal-overlay show">
      <div class="sig-modal-card">
        <div class="sig-modal-header">
           <h3>Tanda Tangan Digital: ${roleName}</h3>
           <button class="btn-close-sig" onclick="this.closest('.sig-modal-overlay').remove()">&times;</button>
        </div>
        <div class="sig-canvas-wrap">
           <canvas id="sig-canvas"></canvas>
        </div>
        <div class="sig-modal-footer">
           <button class="btn btn-secondary" onclick="document.getElementById('sig-canvas').getContext('2d').clearRect(0,0,500,200)">
              <i class="fas fa-eraser"></i> Bersihkan
           </button>
           <button id="btn-save-sig-actual" class="btn btn-primary">
              <i class="fas fa-signature"></i> Simpan Tanda Tangan
           </button>
        </div>
      </div>
    </div>
  `;

  const canvas = document.getElementById('sig-canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = 500;
  canvas.height = 200;
  
  // Basic Canvas Draw Logic
  let drawing = false;
  const startDraw = (e) => { drawing = true; draw(e); };
  const stopDraw = () => { drawing = false; ctx.beginPath(); };
  const draw = (e) => {
     if (!drawing) return;
     const rect = canvas.getBoundingClientRect();
     const x = (e.clientX || e.touches?.[0].clientX) - rect.left;
     const y = (e.clientY || e.touches?.[0].clientY) - rect.top;
     ctx.lineWidth = 2.5; 
     ctx.lineCap = 'round';
     ctx.strokeStyle = '#0f172a';
     ctx.lineTo(x, y);
     ctx.stroke();
     ctx.beginPath();
     ctx.moveTo(x, y);
  };

  canvas.addEventListener('mousedown', startDraw);
  canvas.addEventListener('mousemove', draw);
  canvas.addEventListener('mouseup', stopDraw);
  canvas.addEventListener('touchstart', startDraw);
  canvas.addEventListener('touchmove', draw);
  canvas.addEventListener('touchend', stopDraw);

  document.getElementById('btn-save-sig-actual').onclick = async () => {
     const dataUrl = canvas.toDataURL('image/png');
     showInfo(`Menyimpan tanda tangan ${roleName}...`);
     
     try {
        const metadata = { ...(p.metadata || {}), signatures: { ...(p.metadata?.signatures || {}), [type]: dataUrl } };
        const { error } = await supabase.from('proyek').update({ metadata }).eq('id', p.id);
        if (error) throw error;
        
        // Log Audit
        await logActivity('TTE_SIGNATURE', p.id, { role: type });

        p.metadata = metadata; // Update local state
        showSuccess(`Tanda tangan ${roleName} berhasil disimpan.`);
        container.innerHTML = '';
        
        // Refresh Preview
        const activeCard = document.querySelector('.nav-card.active');
        const docType = activeCard ? activeCard.getAttribute('data-type') : 'konsultan';
        document.getElementById('legal-preview').innerHTML = renderDocTemplate(docType, p, s, findings);
     } catch (err) { showError(err.message); }
  };
}

/**
 * Robust Rendering Template (Consultant or Owner)
 */
function renderDocTemplate(type, p, s, findings = []) {
  try {
    const experts = s.experts || {};
    const dateStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

    let content = '';
    if (type === 'konsultan') {
       content = renderConsultantTemplate(p, s, experts, dateStr);
    } else {
       content = renderOwnerTemplate(p, findings, dateStr);
    }

    return `<div class="paper-page-content">${content}</div>`;
  } catch (err) {
    console.error("Render Failed:", err);
    return `<div class="p-10 text-center"><h3 class="text-danger">Gagal me-render pratinjau</h3><p>${err.message}</p></div>`;
  }
}

function renderConsultantTemplate(p, s, experts, dateStr) {
  return `
    <div class="hf-doc-header">
       ${s.consultant?.kop_image 
         ? `<img src="${s.consultant.kop_image}" style="width:100%; max-height:110px; object-fit:contain;">`
         : `<div style="text-align:center;">
              <h1 style="font-size:16pt; margin:0; font-weight:bold">${escHtml(s.consultant?.name || 'KONSULTAN PENGKAJI TEKNIS')}</h1>
              <p style="font-size:10pt; margin:0">${escHtml(s.consultant?.address || 'Alamat Perusahaan / Instansi')}</p>
            </div>`
       }
    </div>

    <div class="hf-doc-title">
        SURAT PERNYATAAN KELAIKAN FUNGSI<br>BANGUNAN GEDUNG
    </div>

    <div class="hf-meta-grid">
       <div>Nomor</div><div>:</div><div>${escHtml(p.metadata?.nomor_surat || '__________')}</div>
       <div>Tanggal</div><div>:</div><div>${dateStr}</div>
       <div>Lampiran</div><div>:</div><div>1 (Satu) Berkas</div>
    </div>

    <p style="margin-bottom:15px">Pada hari ini, tanggal ${new Date().getDate()} bulan ${formatMonth(new Date())} tahun ${new Date().getFullYear()}, yang bertanda tangan di bawah ini:</p>
    
    <div style="margin-left:25px; margin-bottom:15px">
       <div style="display:flex; margin-bottom:4px; align-items:flex-start">
          <div style="width:20px"><i class="far fa-check-square"></i></div>
          <div style="flex:1; font-size:10pt">Penyedia jasa pengkaji teknis / Penyedia jasa pengawas konstruksi / Penyedia jasa manajemen konstruksi / Instansi penyelenggara SLF Pemerintah Daerah <br><i>(coret yang tidak perlu)</i></div>
       </div>
       <div class="hf-data-grid" style="margin-top:10px; margin-left:0">
          <div class="hf-grid-row"><div></div><div>Nama perusahaan</div><div>:</div><div style="font-weight:bold">${escHtml(s.consultant?.name || '-')}</div></div>
          <div class="hf-grid-row"><div></div><div>Alamat</div><div>:</div><div>${escHtml(s.consultant?.address || '-')}</div></div>
          <div class="hf-grid-row"><div></div><div>Telepon</div><div>:</div><div>${escHtml(s.consultant?.phone || '-')}</div></div>
          <div class="hf-grid-row"><div></div><div>Email</div><div>:</div><div>${escHtml(s.consultant?.email || '-')}</div></div>
       </div>
    </div>

    <div class="hf-section-title">Pelaksana pemeriksaan kelaikan fungsi bangunan gedung:</div>
    <div class="hf-data-grid">
       <div class="hf-grid-row"><div>1)</div><div>Bidang Arsitektur</div><div>:</div><div style="font-weight:bold">Tenaga Ahli Tetap</div></div>
       <div class="hf-grid-row nested"><div>a)</div><div>Nama</div><div>:</div><div>${escHtml(experts.architecture?.name || '____________________')}</div></div>
       <div class="hf-grid-row nested"><div>b)</div><div>Nomor SKK</div><div>:</div><div>${escHtml(experts.architecture?.skk || '-')}</div></div>

       <div class="hf-grid-row" style="margin-top:5px"><div>2)</div><div>Bidang Struktur</div><div>:</div><div style="font-weight:bold">Tenaga Ahli Tetap</div></div>
       <div class="hf-grid-row nested"><div>a)</div><div>Nama</div><div>:</div><div>${escHtml(experts.structure?.name || '____________________')}</div></div>
       <div class="hf-grid-row nested"><div>b)</div><div>Nomor SKK</div><div>:</div><div>${escHtml(experts.structure?.skk || '-')}</div></div>

       <div class="hf-grid-row" style="margin-top:5px"><div>3)</div><div>Bidang MEP / Utilitas</div><div>:</div><div style="font-weight:bold">Tenaga Ahli Tetap</div></div>
       <div class="hf-grid-row nested"><div>a)</div><div>Nama</div><div>:</div><div>${escHtml(experts.mep?.name || '____________________')}</div></div>
       <div class="hf-grid-row nested"><div>b)</div><div>Nomor SKK</div><div>:</div><div>${escHtml(experts.mep?.skk || '-')}</div></div>
    </div>

    <div class="hf-section-title">Telah melaksanakan pemeriksaan kelaikan fungsi bangunan gedung pada:</div>
    <div class="hf-data-grid" style="font-size:10pt">
       <div class="hf-grid-row"><div>1)</div><div>Nama bangunan</div><div>:</div><div style="font-weight:bold">${escHtml(p.nama_bangunan)}</div></div>
       <div class="hf-grid-row"><div>2)</div><div>Alamat bangunan</div><div>:</div><div>${escHtml(p.alamat || '-')}</div></div>
       <div class="hf-grid-row"><div>3)</div><div>Posisi koordinat</div><div>:</div><div>Lat: ${p.latitude || '0'}, Lng: ${p.longitude || '0'}</div></div>
       <div class="hf-grid-row"><div>4)</div><div>Fungsi bangunan</div><div>:</div><div>${escHtml(p.fungsi_bangunan || '-')}</div></div>
       <div class="hf-grid-row"><div>5)</div><div>Klasifikasi</div><div>:</div><div>${escHtml(p.klasifikasi || 'Bangunan Tidak Sederhana')}</div></div>
       <div class="hf-grid-row"><div>6)</div><div>Ketinggian bangunan</div><div>:</div><div>${p.ketinggian || '-'} Meter</div></div>
       <div class="hf-grid-row"><div>7)</div><div>Jumlah lantai</div><div>:</div><div>${p.jumlah_lantai || 1} Lantai</div></div>
       <div class="hf-grid-row"><div>8)</div><div>Luas lantai</div><div>:</div><div>${p.luas_bangunan || 0} m²</div></div>
       <div class="hf-grid-row"><div>9)</div><div>Jumlah basement</div><div>:</div><div>${p.jumlah_basement || 0} Lantai</div></div>
       <div class="hf-grid-row"><div>10)</div><div>Luas basement</div><div>:</div><div>${p.luas_basement || 0} m²</div></div>
       <div class="hf-grid-row"><div>11)</div><div>Luas lahan</div><div>:</div><div>${p.luas_lahan || 0} m²</div></div>
    </div>

    <p style="margin-top:10px; font-size:10pt">Berdasarkan hasil pemeriksaan persyaratan kelaikan fungsi yang terdiri dari pemeriksaan dokumen administratif dan teknis (Tata Bangunan & Keandalan Bangunan), dengan ini menyatakan bahwa:</p>
    
    <div class="box-result-formal">
       BANGUNAN GEDUNG DINYATAKAN LAIK FUNGSI
    </div>

    <p style="font-size:10pt; text-align:justify; line-height:1.4">Sesuai kesimpulan dari analisis terhadap hasil pemeriksaan dokumen dan kondisi lapangan sebagaimana termuat dalam Laporan Pemeriksaan Kelaikan Fungsi terlampir. Surat pernyataan ini berlaku sepanjang tidak ada perubahan fungsi dan struktur. Selanjutnya pemilik dapat menggunakan surat ini untuk permohonan SLF.</p>

    <p style="margin-top:10px; font-size:10pt">Demikian surat pernyataan ini dibuat dengan penuh tanggung jawab profesional sesuai dengan ketentuan dalam <b>Undang-undang Nomor 2 Tahun 2017 tentang Jasa Konstruksi</b>.</p>

    <div style="display:flex; justify-content:center; margin-top:20px; font-size:10.5pt">
       <div style="width:380px; text-align:center">
          <div>${p.kota || 'Bandung'}, ${dateStr}</div>
       </div>
    </div>

    <!-- AREA DIREKTUR (DI TENGAH & QR DIPERBESAR) -->
    <div class="sig-director-area">
       <div class="sig-director-box">
          <div style="font-weight:bold; margin-bottom:5px; font-size:11pt">${escHtml(s.consultant?.name || 'KONSULTAN')}</div>
          <div class="sig-director-flex">
             <div class="ematerai-placeholder">
                <div style="font-size:7pt; opacity:0.8">INDONESIA</div>
                <div style="font-weight:900; margin: 3px 0">BEA</div>
                <div style="font-weight:800">METERAI</div>
                <div class="val">10000</div>
                <div style="font-size:6pt; margin-top:3px; font-weight:400">TGL. 2024</div>
             </div>
             <div class="sig-box-tte" style="width:auto">
                ${(() => {
                   const vUrl = `${window.location.origin}${window.location.pathname}#/verify?id=${p.id}&role=director`;
                   return `<img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(vUrl)}" class="sig-qr-small shadow-sm">`;
                })()}
                ${p.metadata?.signatures?.director 
                  ? `<img src="${p.metadata.signatures.director}" style="position:absolute; width:130px; opacity:0.8; transform:translateX(15px) translateY(10px)">` 
                  : `<button class="btn-sign-here" data-type="director"><i class="fas fa-pen-nib"></i> Tanda Tangani</button>`}
             </div>
          </div>
          <div class="sig-name-underline">${escHtml(s.consultant?.director_name || 'NAMA DIREKTUR')}</div>
          <div style="font-size:10pt">${escHtml(s.consultant?.director_job || 'Direktur Utama')}</div>
       </div>
    </div>

    <!-- AREA PARA AHLI -->
    <div class="sig-experts-container">
       <div class="sig-experts-title">PELAKSANA PEMERIKSAAN KELAIKAN FUNGSI</div>
       <div class="sig-experts-grid">
          ${['architecture', 'structure', 'mep'].map(t => {
            const ex = experts[t] || {};
            const role = t === 'architecture' ? 'Bidang Arsitektur' : t === 'structure' ? 'Bidang Struktur' : 'Bidang MEP / Utilitas';
            const vUrl = `${window.location.origin}${window.location.pathname}#/verify?id=${p.id}&expert=${t}`;
            return `
              <div class="sig-expert-card">
                 <div style="font-weight:bold; min-height:28px; line-height:1.2">${role}</div>
                 <div class="sig-box-tte">
                   <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(vUrl)}" class="sig-qr-small">
                   ${p.metadata?.signatures?.[t] 
                     ? `<img src="${p.metadata.signatures[t]}" style="position:absolute; width:75px; opacity:0.75; transform:translateX(10px) translateY(5px)">` 
                     : `<button class="btn-sign-here" data-type="${t}"><i class="fas fa-pen-nib"></i> Sign</button>`}
                 </div>
                 <div class="sig-name-underline" style="font-size:9pt">${escHtml(ex.name || 'NAME')}</div>
                 <div style="font-size:8pt; margin-top:2px">Tenaga Ahli Tetap</div>
              </div>
            `;
          }).join('')}
       </div>
    </div>
  `;
}

function renderOwnerTemplate(p, findings, dateStr) {
  return `
    <div style="text-align:center; font-weight:bold; font-size:14pt; margin-bottom:40px; text-transform:uppercase">
        SURAT PERNYATAAN PEMILIK / PENGELOLA<br>
        <span style="font-size:11pt">TENTANG KESEDIAAN MEMELIHARA BANGUNAN GEDUNG</span>
    </div>

    <div style="margin-bottom:15px">Yang bertanda tangan di bawah ini:</div>
    <div style="margin-left:25px; margin-bottom:20px">
       <div style="display:flex"><div style="width:160px">Nama Pemilik</div><div style="width:10px">:</div><div>${escHtml(p.pemilik || '-')}</div></div>
       <div style="display:flex"><div style="width:160px">Nomor KTP/NIB</div><div style="width:10px">:</div><div>${escHtml(p.ktp_pemilik || '-')}</div></div>
       <div style="display:flex"><div style="width:160px">Alamat</div><div style="width:10px">:</div><div>${escHtml(p.alamat_pemilik || '-')}</div></div>
    </div>

    <div style="margin-bottom:20px">Atas bangunan gedung:</div>
    <div style="margin-left:25px; margin-bottom:20px">
       <div style="display:flex"><div style="width:160px">Nama Bangunan</div><div style="width:10px">:</div><div>${escHtml(p.nama_bangunan)}</div></div>
       <div style="display:flex"><div style="width:160px">Alamat Bangunan</div><div style="width:10px">:</div><div>${escHtml(p.alamat || '-')}</div></div>
    </div>

    <p style="text-align:justify">Menyatakan dengan sebenarnya bahwa saya akan memelihara bangunan gedung tersebut sesuai dengan standar teknis dan menjamin kebenaran seluruh dokumen yang disampaikan.</p>
    
    <p style="text-align:justify">Apabila terdapat temuan teknis hasil pengkajian, saya bersedia menindaklanjuti sesuai dengan rekomendasi dan jangka waktu yang telah ditentukan sebagai berikut:</p>

    <!-- TABEL TEMUAN LAMPIRAN -->
    <table class="modern-table-temuan">
       <thead>
          <tr>
             <th style="width:30px; text-align:center">No</th>
             <th style="width:150px">Item / Aspek</th>
             <th>Kondisi Temuan</th>
             <th>Rekomendasi Perbaikan</th>
             <th style="width:90px; text-align:center">Target</th>
          </tr>
       </thead>
       <tbody>
          ${findings.length === 0 
            ? '<tr><td colspan="5" style="text-align:center; padding:20px; font-style:italic">Tidak ada temuan ketidaksesuaian kritis. Bangunan dinyatakan laik fungsi tanpa syarat perbaikan mendesak.</td></tr>'
            : findings.map((f, i) => `
              <tr>
                 <td style="text-align:center">${i + 1}</td>
                 <td style="font-weight:bold">${escHtml(f.nama)}</td>
                 <td>${escHtml(f.catatan || '-')}</td>
                 <td style="color:#1e40af; font-weight:500">${escHtml(f.rekomendasi || '-')}</td>
                 <td style="text-align:center; font-weight:bold; color:#dc2626">${escHtml(f.remedy_time || '-')}</td>
              </tr>
            `).join('')
          }
       </tbody>
    </table>

    <p style="margin-top:20px">Demikian surat pernyataan ini saya buat dengan penuh tanggung jawab.</p>

    <div style="display:flex; justify-content:flex-end; margin-top:50px">
       <div style="text-align:center; width:220px">
          <div>${p.kota || 'Bandung'}, ${dateStr}</div>
          <div style="font-weight:bold; margin-top:5px; margin-bottom:80px">Pemilik Bangunan,</div>
          <div style="border-bottom:1px solid #000; font-weight:bold; text-transform:uppercase">${escHtml(p.pemilik || '____________________')}</div>
       </div>
    </div>
  `;
}

/**
 * Handle Word Export
 */
async function downloadDocx(p, s) {
   const activeCard = document.querySelector('.nav-card.active');
   const type = activeCard ? activeCard.getAttribute('data-type') : 'konsultan';
   
   showSuccess(`Sedang mengekspor ${type === 'konsultan' ? 'Pernyataan Konsultan' : 'Pernyataan Pemilik'}...`);
   
   try {
     const { downloadLegalDocx } = await import('../lib/surat-pernyataan-service.js');
     const preview = document.getElementById('legal-preview');
     
     if (!preview) throw new Error("Preview element not found");
     
     await downloadLegalDocx(p, s, type, preview.innerHTML);
     showSuccess("Dokumen Word berhasil dibuat.");
   } catch (err) {
     console.error("Export Error:", err);
     showError("Gagal ekspor: " + err.message);
   }
}

/**
 * Utils
 */
function escHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}
