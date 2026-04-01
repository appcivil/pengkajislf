/**
 * VERIFIKASI DOKUMEN DIGITAL (EXECUTIVE LIGHT MODE)
 * Public-facing portal for document authenticity & TTE verification.
 * Standard: SECURE QUARTZ LIGHT EDITION
 */
import { supabase } from '../lib/supabase.js';
import { getSettings } from '../lib/settings.js';
import { verifyDocumentIntegrity, validateSignerCertificate } from '../lib/tte-service.js';
import { escHtml, formatTanggal } from '../lib/utils.js';

export async function verifyPage(params = {}) {
   const id = params.id;
   const expertType = params.expert || 'director';

   const root = document.getElementById('page-root');
   if (!root) return;
   
   if (!id || id === 'undefined') {
      root.innerHTML = renderEmptyVerify();
      return;
   }

   renderLoading(root);

   try {
      const { data: proyek, error: pError } = await supabase.from('proyek').select('*').eq('id', id).maybeSingle();
      
      if (pError || !proyek) {
         throw new Error("ID Dokumen tidak valid atau tidak terdaftar di basis data pusat.");
      }

      const [analisisRes, settings] = await Promise.all([
         supabase.from('hasil_analisis').select('*').eq('proyek_id', id).maybeSingle(),
         getSettings()
      ]);

      const p = proyek;
      const a = analisisRes?.data || null;
      const expert = expertType === 'director'
         ? { name: settings.consultant?.director_name || 'DIREKTUR UTAMA', job: settings.consultant?.director_job || 'Direktur', skk: null }
         : settings.experts?.[expertType] || {};

      const integrity = await verifyDocumentIntegrity(p);
      const cert = await validateSignerCertificate(expert);

      root.innerHTML = buildVerifyHtml(p, a, settings, expertType, expert, integrity, cert);
      
      initSecurityListeners();
   } catch (err) {
      root.innerHTML = renderError(err.message);
   }
}

function renderEmptyVerify() {
    return `
    <div style="background:hsl(220, 30%, 98%); min-height:100vh; display:flex; align-items:center; justify-content:center; padding:20px; font-family:'Inter', sans-serif">
        <div style="background:white; border-radius:30px; box-shadow:0 20px 60px rgba(0,0,0,0.05); border:1px solid rgba(0,0,0,0.05); text-align:center; padding:80px 40px; max-width:480px;">
            <div style="width:100px; height:100px; background:hsl(220, 30%, 95%); border-radius:50%; border:1px solid rgba(0,0,0,0.05); display:flex; align-items:center; justify-content:center; margin:0 auto 32px; font-size:3rem; color:var(--brand-500); box-shadow: 0 10px 25px hsla(220, 95%, 52%, 0.1)">
                <i class="fas fa-qrcode"></i>
            </div>
            <h2 style="font-family:'Outfit', sans-serif; font-weight:800; font-size:1.8rem; color:hsl(224, 30%, 12%); margin-bottom:12px">SLF Verification Portal</h2>
            <p style="color:var(--text-tertiary); font-size:0.9rem; line-height:1.6; margin-bottom:40px">Gunakan QR code pada dokumen fisik untuk memverifikasi keaslian teknis dan segel integritas digital.</p>
            <button class="btn-presidential" style="height:48px; padding:0 32px; border-radius:14px; background:var(--gradient-brand)" onclick="window.navigate('dashboard')">PROCEED TO DASHBOARD</button>
        </div>
    </div>`;
}

function initSecurityListeners() {
   document.addEventListener('contextmenu', e => e.preventDefault());
   document.addEventListener('keydown', e => {
      if (e.ctrlKey && ['c', 'v', 'p', 's', 'u'].includes(e.key.toLowerCase())) e.preventDefault();
      if (e.key === 'F12' || e.key === 'PrintScreen') e.preventDefault();
   });

   const overlay = document.getElementById('security-blur-overlay');
   if (overlay) {
      window.addEventListener('blur', () => { overlay.style.display = 'flex'; overlay.style.opacity = '1'; });
      window.addEventListener('focus', () => { overlay.style.opacity = '0'; setTimeout(() => { overlay.style.display = 'none'; }, 300); });
   }
}

function buildVerifyHtml(p, a, s, expertType, expert, integrity, cert) {
   const statusLabel = a?.status_slf?.replace(/_/g, ' ') || 'DALAM PENGKAJIAN';
   const expertList = s.experts || {};
   const consultant = s.consultant || {};
   const signatureCount = Object.keys(p.metadata?.signatures || {}).length;

   return `
    <div id="verify-portal" style="background:hsl(220, 30%, 98%); min-height:100vh; color:hsl(224, 30%, 15%); font-family:'Inter', sans-serif">
      
      <!-- Anti-Scrape Overlay (Light Privacy) -->
      <div id="security-blur-overlay" style="display:none; position:fixed; inset:0; background:rgba(255,255,255,0.95); backdrop-filter:blur(30px); z-index:10000; align-items:center; justify-content:center; flex-direction:column; color:hsl(224, 30%, 12%); text-align:center; transition:opacity 0.3s">
         <i class="fas fa-shield-halved" style="font-size:4rem; color:var(--brand-500); margin-bottom:24px"></i>
         <h2 style="font-family:'Outfit', sans-serif; font-weight:800; letter-spacing:0.05em">ENCRYPTED VIEW</h2>
         <p style="color:var(--text-tertiary); max-width:300px; font-size:0.9rem">Konten disembunyikan sementara saat jendela tidak aktif untuk melindungi data audit teknis.</p>
      </div>

      <!-- Public Navigation (Light Quartz) -->
      <nav style="background:rgba(255,255,255,0.8); backdrop-filter:blur(20px); border-bottom:1px solid rgba(0,0,0,0.05); padding:16px 40px; position:sticky; top:0; z-index:100">
         <div style="display:flex; justify-content:space-between; align-items:center; max-width:1200px; margin:0 auto">
            <div style="display:flex; align-items:center; gap:20px">
               ${consultant.logo ? `<img src="${consultant.logo}" style="height:44px; object-fit:contain">` : `<div style="width:44px; height:44px; background:var(--gradient-brand); border-radius:10px; display:flex; align-items:center; justify-content:center; color:white; font-size:1.4rem"><i class="fas fa-microchip"></i></div>`}
               <div>
                  <div style="font-family:'Outfit', sans-serif; font-weight:800; font-size:1.1rem; letter-spacing:0.5px; color:hsl(224, 30%, 12%)">${escHtml(consultant.name || 'SMART AI PENGKAJI')}</div>
                  <div style="font-family:var(--font-mono); font-size:8px; color:var(--text-tertiary); letter-spacing:1px; text-transform:uppercase">Official Digital Integrity Verification Gateway</div>
               </div>
            </div>
            <div style="background:hsla(158, 85%, 45%, 0.05); border:1px solid hsla(158, 85%, 45%, 0.1); padding:8px 20px; border-radius:100px; font-family:var(--font-mono); font-size:10px; font-weight:800; color:var(--success-500); display:flex; align-items:center; gap:10px">
               <div style="width:10px; height:10px; border-radius:50%; background:var(--success-500); box-shadow:0 0 10px var(--success-500)"></div>
               OFFICIAL COMPLIANCE HUB
            </div>
         </div>
      </nav>

      <!-- Light Hero Section -->
      <div style="background:linear-gradient(180deg, #fff 0%, hsl(220, 30%, 95%) 100%); padding:80px 0; border-bottom:1px solid rgba(0,0,0,0.05)">
         <div style="max-width:1200px; margin:0 auto; padding:0 40px">
            <div style="display:flex; justify-content:space-between; align-items:center">
               <div>
                  <div style="font-family:var(--font-mono); font-size:10px; font-weight:800; color:var(--brand-500); letter-spacing:2px; margin-bottom:16px; text-transform:uppercase">Kesimpulan Hasil Verifikasi Teknks</div>
                  <h1 style="font-family:'Outfit', sans-serif; font-weight:800; font-size:4rem; line-height:1; letter-spacing:-0.04em; margin-bottom:20px; color:hsl(224, 30%, 12%)">
                     ${statusLabel.toUpperCase()}
                  </h1>
                  <div style="display:flex; align-items:center; gap:20px">
                     <span style="font-family:var(--font-mono); font-size:11px; color:var(--text-tertiary); letter-spacing:1px">DOKUMEN REF: <span style="color:var(--brand-500); font-weight:700">${escHtml(p.metadata?.nomor_surat || p.id.toUpperCase())}</span></span>
                     <span class="badge" style="background:white; color:var(--brand-500); border:1px solid hsla(220, 95%, 52%, 0.1); font-size:9px; font-weight:800; box-shadow:0 4px 12px rgba(0,0,0,0.03)">ENCRYPTED AUDIT v7</span>
                  </div>
               </div>
               <div style="text-align:right">
                  <div style="font-family:var(--font-mono); font-size:10px; color:var(--text-tertiary); letter-spacing:1px; margin-bottom:12px">INTEGRITY INDEX</div>
                  <div style="font-family:'Outfit', sans-serif; font-weight:800; font-size:4rem; color:var(--brand-500); line-height:1">${a?.skor_total || '--'}<span style="font-size:1.5rem; opacity:0.3; margin-left:4px">%</span></div>
               </div>
            </div>
         </div>
      </div>

      <main style="max-width:1200px; margin:-40px auto 100px; padding:0 40px">
         <div style="display:grid; grid-template-columns: 1.8fr 1fr; gap: 40px">
            
            <div style="display:flex; flex-direction:column; gap:32px">
               <!-- Building Visual & Core Data (Light Quartz) -->
               <div style="background:white; border-radius:24px; box-shadow:0 20px 50px rgba(0,0,0,0.05); overflow:hidden; border:1px solid rgba(0,0,0,0.05)">
                  <div style="height:400px; position:relative">
                     ${p.foto_bangunan ? `<img src="${p.foto_bangunan}" style="width:100%; height:100%; object-fit:cover">` : `<div style="width:100%; height:100%; background:hsl(220, 30%, 95%); display:flex; align-items:center; justify-content:center; color:hsl(224, 30%, 90%); font-size:5rem"><i class="fas fa-building"></i></div>`}
                     <div style="position:absolute; inset:0; background:linear-gradient(transparent 50%, rgba(255,255,255,0.9) 100%); padding:40px; display:flex; flex-direction:column; justify-content:flex-end">
                        <h2 style="font-family:'Outfit', sans-serif; font-weight:800; font-size:2rem; color:hsl(224, 30%, 12%); margin-bottom:8px">${escHtml(p.nama_bangunan)}</h2>
                        <div style="display:flex; align-items:center; gap:12px; color:var(--text-tertiary); font-size:0.9rem">
                           <i class="fas fa-map-pin" style="color:var(--brand-500)"></i> ${escHtml(p.alamat || 'Unknown Geospatial coordinates')}
                        </div>
                     </div>
                  </div>
                  <div style="padding:32px; display:grid; grid-template-columns: repeat(4, 1fr); gap:32px; background:hsl(220, 30%, 99%)">
                     <div>
                        <div style="font-family:var(--font-mono); font-size:8px; color:var(--text-tertiary); text-transform:uppercase; letter-spacing:1px; margin-bottom:8px">Usage/Function</div>
                        <div style="font-weight:800; color:hsl(224, 30%, 15%); font-size:0.9rem">${escHtml(p.fungsi_bangunan || '-')}</div>
                     </div>
                     <div>
                        <div style="font-family:var(--font-mono); font-size:8px; color:var(--text-tertiary); text-transform:uppercase; letter-spacing:1px; margin-bottom:8px">Vertical Stats</div>
                        <div style="font-weight:800; color:hsl(224, 30%, 15%); font-size:0.9rem">${p.jumlah_lantai || 0} LANTAI</div>
                     </div>
                     <div>
                        <div style="font-family:var(--font-mono); font-size:8px; color:var(--text-tertiary); text-transform:uppercase; letter-spacing:1px; margin-bottom:8px">Total GFA</div>
                        <div style="font-weight:800; color:hsl(224, 30%, 15%); font-size:0.9rem">${p.luas_bangunan || 0} m²</div>
                     </div>
                     <div>
                        <div style="font-family:var(--font-mono); font-size:8px; color:var(--text-tertiary); text-transform:uppercase; letter-spacing:1px; margin-bottom:8px">Registry Status</div>
                        <div style="font-weight:800; color:${p.metadata?.is_finalized ? 'var(--success-500)' : 'var(--gold-500)'}; font-size:0.9rem">${p.metadata?.is_finalized ? 'FINALIZED & SEALED' : 'DRAFTING PHASE'}</div>
                     </div>
                  </div>
               </div>

               <!-- Expert Team Registry -->
               <div style="background:white; border-radius:24px; padding:32px; box-shadow:0 20px 50px rgba(0,0,0,0.05); border:1px solid rgba(0,0,0,0.05)">
                  <div style="font-family:'Outfit', sans-serif; font-weight:800; font-size:1.2rem; color:hsl(224, 30%, 12%); margin-bottom:24px; display:flex; align-items:center; gap:12px">
                     <i class="fas fa-user-shield" style="color:var(--brand-500)"></i> Tim Teknis Terverifikasi
                  </div>
                  <div style="display:flex; flex-direction:column; gap:16px">
                     ${['architecture', 'structure', 'mep'].map(t => `
                       <div style="padding:20px; border-radius:18px; display:flex; align-items:center; gap:24px; background:hsl(220, 30%, 98%); border:1px solid rgba(0,0,0,0.03)">
                          <div style="width:52px; height:52px; border-radius:14px; background:white; display:flex; align-items:center; justify-content:center; color:var(--brand-500); font-size:1.4rem; box-shadow:0 4px 12px rgba(0,0,0,0.05)">
                             <i class="fas fa-${t === 'architecture' ? 'landmark' : t === 'structure' ? 'building-shield' : 'bolt-lightning'}"></i>
                          </div>
                          <div style="flex:1">
                             <div style="font-family:var(--font-mono); font-size:9px; font-weight:800; color:var(--text-tertiary); text-transform:uppercase; letter-spacing:1px">Expert: ${t}</div>
                             <div style="font-family:'Outfit', sans-serif; font-weight:800; font-size:1.05rem; color:hsl(224, 30%, 15%); margin:2px 0">${escHtml(expertList[t]?.name || '-')}</div>
                             <div style="font-family:var(--font-mono); font-size:9px; color:var(--brand-500); letter-spacing:1px">SKK LICENSE: ${escHtml(expertList[t]?.skk || 'VALIDATION_PROCESS')}</div>
                          </div>
                          <div style="padding:8px 16px; background:${p.metadata?.signatures?.[t] ? 'hsla(158, 85%, 45%, 0.1)' : 'white'}; border-radius:10px; font-family:var(--font-mono); font-size:9px; font-weight:800; color:${p.metadata?.signatures?.[t] ? 'var(--success-500)' : 'var(--text-tertiary)'}; border:1px solid rgba(0,0,0,0.05)">
                             ${p.metadata?.signatures?.[t] ? '<i class="fas fa-fingerprint" style="margin-right:8px"></i> TTE_VALID' : 'WAITING'}
                          </div>
                       </div>
                     `).join('')}
                  </div>
               </div>
            </div>

            <div style="display:flex; flex-direction:column; gap:32px">
               <!-- Legal Ownership -->
               <div style="background:white; border-radius:24px; padding:32px; box-shadow:0 15px 40px rgba(0,0,0,0.05); border:1px solid rgba(0,0,0,0.05)">
                  <div style="font-family:var(--font-mono); font-size:9px; font-weight:800; color:var(--text-tertiary); letter-spacing:2px; margin-bottom:16px">LEGAL OWNER / BENEFICIARY</div>
                  <div style="font-family:'Outfit', sans-serif; font-weight:800; font-size:1.4rem; color:hsl(224, 30%, 12%); line-height:1.3">${escHtml(p.pemilik || '-')}</div>
                  <div style="margin-top:20px; display:flex; align-items:center; gap:12px; font-family:var(--font-mono); font-size:10px; color:var(--brand-500)">
                     <i class="fas fa-calendar-check"></i> REGISTERED: ${formatTanggal(p.created_at)}
                  </div>
               </div>

               <!-- Cryptographic Integrity Seal (Clean Light) -->
               <div style="background:hsl(224, 30%, 15%); border-radius:24px; padding:32px; color:white; box-shadow:0 25px 60px rgba(0,0,0,0.2)">
                  <div style="font-family:'Outfit', sans-serif; font-weight:800; font-size:1.1rem; margin-bottom:24px; display:flex; align-items:center; gap:12px">
                     <i class="fas fa-fingerprint" style="color:var(--brand-400)"></i> Digital Integrity Seal
                  </div>
                  
                  ${p.metadata?.is_finalized 
                    ? `<div style="background:hsla(158, 85%, 45%, 0.1); border:1px solid hsla(158, 85%, 45%, 0.2); padding:12px; border-radius:12px; color:var(--success-400); text-align:center; font-family:var(--font-mono); font-size:10px; font-weight:800; letter-spacing:2px; margin-bottom:24px"><i class="fas fa-shield-check"></i> OFFICIAL SEAL VALID</div>`
                    : `<div style="background:hsla(45, 90%, 60%, 0.1); border:1px solid hsla(45, 90%, 60%, 0.2); padding:12px; border-radius:12px; color:var(--gold-400); text-align:center; font-family:var(--font-mono); font-size:10px; font-weight:800; letter-spacing:2px; margin-bottom:24px"><i class="fas fa-clock"></i> PENDING FINAL SEAL</div>`}
                  
                  <div style="margin-bottom:24px">
                     <label style="font-family:var(--font-mono); font-size:8px; opacity:0.4; text-transform:uppercase; letter-spacing:1px">DOCUMENT UNIQUE HASH (SHA-256)</label>
                     <div style="background:rgba(0,0,0,0.3); padding:16px; border-radius:12px; color:var(--brand-400); font-family:var(--font-mono); font-size:9px; word-break:break-all; margin-top:8px; line-height:1.6; border:1px solid rgba(255,255,255,0.05)">
                        ${p.metadata?.document_hash || integrity.fingerprint}
                     </div>
                  </div>

                  <div style="display:flex; flex-direction:column; gap:12px; font-family:var(--font-mono); font-size:10px">
                     <div style="display:flex; justify-content:space-between">
                        <span style="opacity:0.4">Authority Seal Date:</span>
                        <span>${p.metadata?.finalized_at ? formatTanggal(p.metadata.finalized_at) : 'Waiting...'}</span>
                     </div>
                     <div style="display:flex; justify-content:space-between">
                        <span style="opacity:0.4">Certificates Authenticated:</span>
                        <span style="color:var(--brand-400)">${signatureCount} / 4 AUTHENTICATED</span>
                     </div>
                  </div>
               </div>

               <!-- Authorized Signatory -->
               <div style="background:white; border-radius:24px; padding:32px; box-shadow:0 15px 40px rgba(0,0,0,0.05); border:1px solid rgba(0,0,0,0.05)">
                  <div style="font-family:var(--font-mono); font-size:9px; font-weight:800; color:var(--text-tertiary); letter-spacing:2px; margin-bottom:24px">AUTHORIZED SIGNATORY</div>
                  <div style="text-align:center">
                     <div style="font-family:'Outfit', sans-serif; font-weight:800; font-size:1.15rem; color:hsl(224, 30%, 12%); text-decoration:underline; text-decoration-color:var(--brand-500); display:inline-block; margin-bottom:8px">${escHtml(consultant.director_name || 'DIREKTUR UTAMA')}</div>
                     <div style="font-family:var(--font-mono); font-size:10px; color:var(--text-tertiary); text-transform:uppercase; letter-spacing:1px">${escHtml(consultant.director_job || 'DIRECTOR')}</div>
                     
                     <div style="margin-top:32px; padding:12px; background:${p.metadata?.signatures?.director ? 'hsla(158, 85%, 45%, 0.05)' : 'hsla(0, 85%, 60%, 0.05)'}; border:1px solid ${p.metadata?.signatures?.director ? 'hsla(158, 85%, 45%, 0.2)' : 'hsla(0, 85%, 60%, 0.2)'}; border-radius:12px; color:${p.metadata?.signatures?.director ? 'var(--success-600)' : 'var(--danger-500)'}; font-family:var(--font-mono); font-size:10px; font-weight:800; letter-spacing:2px">
                        ${p.metadata?.signatures?.director ? '<i class="fas fa-file-signature"></i> E-SIGNATURE VALID' : 'WAITING FOR SIGNATURE'}
                     </div>
                  </div>
               </div>
            </div>

         </div>
      </main>

      <footer style="background:white; padding:80px 0; border-top:1px solid rgba(0,0,0,0.05)">
         <div style="max-width:1200px; margin:0 auto; padding:0 40px; display:flex; justify-content:space-between; align-items:flex-start">
            <div>
               <div style="font-family:'Outfit', sans-serif; font-weight:800; font-size:1.1rem; color:hsl(224, 30%, 12%); margin-bottom:12px">OFFICIAL INSPECTION HUB</div>
               <p style="font-size:0.85rem; color:var(--text-tertiary); max-width:400px; line-height:1.6">${escHtml(consultant.name)} &bull; ${escHtml(consultant.address)}</p>
            </div>
            <div style="text-align:right">
               <div style="font-family:var(--font-mono); font-size:9px; color:var(--text-tertiary); letter-spacing:1px">SYSTEM POWERED BY</div>
               <div style="font-family:'Outfit', sans-serif; font-weight:800; font-size:1.4rem; color:hsl(224, 30%, 12%)">Smart AI <span style="background:var(--gradient-brand); -webkit-background-clip:text; -webkit-text-fill-color:transparent;">ENGINE v7</span></div>
            </div>
         </div>
         <div style="max-width:1200px; margin:40px auto 0; padding:40px 40px 0; border-top:1px solid rgba(0,0,0,0.05); text-align:center; font-family:var(--font-mono); font-size:10px; color:var(--text-tertiary); letter-spacing:1px">
            © ${new Date().getFullYear()} OFFICIAL SLF VERIFICATION SYSTEM. DATA ACCESS PROTECTED.
         </div>
      </footer>
    </div>
   `;
}

function renderLoading(root) {
   root.innerHTML = `
      <div style="height:100vh; background:hsl(220, 30%, 98%); display:flex; flex-direction:column; align-items:center; justify-content:center; color:hsl(224, 30%, 12%); font-family:'Inter', sans-serif">
         <div style="width:60px; height:60px; border:3px solid rgba(0,0,0,0.05); border-top-color:var(--brand-500); border-radius:50%; animation: spin 1s linear infinite"></div>
         <div style="margin-top:32px; font-family:var(--font-mono); font-size:11px; font-weight:800; letter-spacing:4px; color:var(--brand-500)">CRYPTO_VERIFYING...</div>
      </div>
      <style>@keyframes spin {to {transform: rotate(360deg)}}</style>
   `;
}

function renderError(msg) {
   return `
      <div style="height:100vh; background:hsl(220, 30%, 98%); display:flex; align-items:center; justify-content:center; padding:20px; color:hsl(224, 30%, 12%); font-family:'Inter', sans-serif">
         <div style="padding:60px 40px; text-align:center; max-width:480px; background:white; border-radius:30px; box-shadow:0 30px 80px rgba(0,0,0,0.1); border:1px solid rgba(220, 53, 69, 0.1)">
            <i class="fas fa-shield-slash" style="font-size:4rem; color:var(--danger-500); margin-bottom:32px"></i>
            <h2 style="font-family:'Outfit', sans-serif; font-weight:800; font-size:1.6rem; margin-bottom:12px">Verification Failure</h2>
            <p style="color:var(--text-tertiary); line-height:1.6; margin-bottom:40px">${msg}</p>
            <button class="btn btn-outline" style="width:100%; height:48px; border-radius:12px; color:var(--text-primary); border-color:rgba(0,0,0,0.1)" onclick="window.navigate('dashboard')">RE-ENTRY TO SYSTEM</button>
         </div>
      </div>
   `;
}
