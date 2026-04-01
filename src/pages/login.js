/**
 * LOGIN PAGE
 * PRESIDENTIAL CLASS (QUARTZ PREMIUM)
 * Entry Gateway to the Strategic AI Audit Ecosystem
 */
import { signInWithGoogle, signInWithEmail, signUpWithEmail, devModeBypass } from '../lib/auth.js';
import { APP_CONFIG } from '../lib/config.js';
import { showError, showInfo } from '../components/toast.js';

export async function loginPage() {
  const features = [
    { icon: 'fa-brain-circuit',   text: 'Quantum Neural Synthesis (SNI 9273:2025)' },
    { icon: 'fa-shield-check',    text: 'Automated Integrity & Compliance Overwatch' },
    { icon: 'fa-file-signature',  text: 'Official GDocs Digital Sealing Orchestrator' },
    { icon: 'fa-chart-network',   text: 'Strategic Data Visualization & Pulse Maps' },
    { icon: 'fa-cloud-binary',    text: 'Encrypted Cloud Architecture (256-bit AES)' },
  ];

  const year = new Date().getFullYear();

  const html = `
    <div id="login-portal" style="min-height:100vh; background:#020408; position:relative; overflow:hidden; font-family:'Inter', sans-serif">
      
      <!-- Immersive Architectural Backsplash -->
      <div style="position:fixed; inset:0; z-index:0; overflow:hidden">
         <img src="./presidential_architecture_login_1775021702654.png" style="width:100%; height:100%; object-fit:cover; opacity:0.6; filter: grayscale(0.2) contrast(1.1) brightness(0.7)">
         <div style="position:absolute; inset:0; background:radial-gradient(circle at center, transparent 0%, #020408 100%); mix-blend-mode: multiply"></div>
      </div>

      <!-- Floating Quartz Panel -->
      <div style="position:relative; z-index:1; min-height:100vh; display:flex; align-items:center; justify-content:center; padding:40px">
        
        <div class="card-quartz" style="width:100%; max-width:960px; min-height:640px; display:grid; grid-template-columns: 1.2fr 1fr; overflow:hidden; padding:0; border-color:hsla(220, 20%, 100%, 0.1); animation: modal-up 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)">
           
           <!-- Narrative Side -->
           <div style="padding:60px; background:hsla(224, 25%, 4%, 0.6); display:flex; flex-direction:column; border-right:1px solid hsla(220, 20%, 100%, 0.05)">
              <div style="width:64px; height:64px; background:var(--gradient-brand); border-radius:16px; display:flex; align-items:center; justify-content:center; color:white; font-size:2rem; margin-bottom:40px; box-shadow:var(--shadow-sapphire); border:1px solid hsla(220, 95%, 52%, 0.3)">
                 <i class="fas fa-building"></i>
              </div>
              
              <h1 style="font-family:'Outfit', sans-serif; font-weight:800; font-size:2.8rem; line-height:1.1; letter-spacing:-0.04em; color:white; margin-bottom:24px">
                 Smart AI <span class="text-gradient-gold">Pengkaji SLF</span>
              </h1>
              
              <p style="color:var(--text-tertiary); font-size:0.95rem; line-height:1.6; margin-bottom:48px; max-width:400px">
                 The elite ecosystem for architectural compliance, technical auditing, and structural integrity modeling. Sealed for government-grade operations.
              </p>

              <div style="display:flex; flex-direction:column; gap:20px; flex:1">
                 ${features.map(f => `
                    <div style="display:flex; align-items:center; gap:20px">
                       <div style="width:32px; height:32px; background:hsla(220, 20%, 100%, 0.03); border:1px solid hsla(220, 20%, 100%, 0.1); border-radius:8px; display:flex; align-items:center; justify-content:center; color:var(--brand-400); font-size:0.9rem">
                          <i class="fas ${f.icon}"></i>
                       </div>
                       <span style="font-family:var(--font-mono); font-size:9px; font-weight:800; color:var(--brand-300); letter-spacing:1px; text-transform:uppercase">${f.text}</span>
                    </div>
                 `).join('')}
              </div>

              <div style="display:flex; gap:10px; margin-top:40px; flex-wrap:wrap">
                 ${['SNI 1726', 'SNI 2847', 'ASCE 41-17', 'PP 16/2021'].map(s => `
                    <div style="background:hsla(220, 20%, 100%, 0.03); border:1px solid hsla(220, 20%, 100%, 0.1); padding:6px 12px; border-radius:100px; font-family:var(--font-mono); font-size:8px; color:var(--text-tertiary); letter-spacing:1px">${s}</div>
                 `).join('')}
              </div>
           </div>

           <!-- Interaction Side -->
           <div style="padding:60px; background:transparent; display:flex; flex-direction:column; justify-content:center">
              <div id="login-view" class="route-fade">
                 <h2 style="font-family:'Outfit', sans-serif; font-weight:800; font-size:1.8rem; color:white; margin-bottom:12px">Consortium Entry</h2>
                 <p style="color:var(--text-tertiary); font-size:0.85rem; margin-bottom:40px">Verify your identity to access the strategic registry.</p>
                 
                 <button class="btn btn-outline" id="btn-google-signin" style="width:100%; height:56px; border-radius:14px; background:white; color:#020408; font-weight:800; border:none; display:flex; align-items:center; justify-content:center; gap:12px; transition:transform 0.2s" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
                    <svg style="width:20px; height:20px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    SECURE SIGN-IN WITH GOOGLE
                 </button>

                 <div style="text-align:center; position:relative; margin:32px 0">
                    <div style="position:absolute; height:1px; background:hsla(220, 20%, 100%, 0.1); left:0; right:0; top:50%"></div>
                    <span style="position:relative; background:#0D1117; padding:0 16px; font-family:var(--font-mono); font-size:9px; color:var(--text-tertiary); letter-spacing:2px; font-weight:800">OR DIRECT ALIAS</span>
                 </div>

                 <form id="email-login-form" style="display:flex; flex-direction:column; gap:20px">
                    <div class="form-group">
                       <label class="form-label" style="font-size:10px; letter-spacing:1.5px">IDENTITY ALIAS (EMAIL)</label>
                       <input type="email" id="login-email" class="form-input" placeholder="authorized.personnel@registry.gov" required>
                    </div>
                    <div class="form-group">
                       <label class="form-label" style="font-size:10px; letter-spacing:1.5px">SECURITY KEYCASE (PASSWORD)</label>
                       <input type="password" id="login-pass" class="form-input" placeholder="••••••••" required>
                    </div>
                    <button type="submit" class="btn-presidential gold" id="btn-email-signin" style="height:52px; border-radius:12px; font-weight:800; font-size:0.9rem">
                       <i class="fas fa-shield-keyhole" style="margin-right:12px"></i> AUTHORIZE DIRECT
                    </button>
                    ${!APP_CONFIG.features.isPublished ? `
                      <button type="button" class="btn btn-ghost" id="btn-dev-bypass" style="color:var(--brand-300); font-family:var(--font-mono); font-size:9px; font-weight:800; letter-spacing:2px">
                        <i class="fas fa-terminal" style="margin-right:10px"></i> OVERRIDE PROTOCOL (BYPASS)
                      </button>
                    ` : ''}
                 </form>

                 <div style="margin-top:40px; text-align:center">
                    <p style="font-size:0.8rem; color:hsla(220, 20%, 100%, 0.4); line-height:1.6">
                       System version v${APP_CONFIG.version} &bull; © ${year} Consortium.<br>
                       Encrypted by <span style="color:var(--brand-400); font-weight:800">Smart AI Pengkaji</span>
                    </p>
                 </div>
              </div>
           </div>

        </div>
      </div>

    </div>
  `;

  const app = document.getElementById('app') || document.body;
  app.innerHTML = html;
  
  // Event listeners
  document.getElementById('btn-google-signin')?.addEventListener('click', handleGoogleSignIn);
  document.getElementById('email-login-form')?.addEventListener('submit', handleEmailSignIn);
  
  document.getElementById('btn-dev-bypass')?.addEventListener('click', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn-dev-bypass');
    btn.disabled = true;
    btn.innerHTML = `<i class="fas fa-circle-notch fa-spin"></i> OVERRIDING...`;
    try {
      await devModeBypass();
      window.navigate('dashboard');
    } catch(err) {
      showError('Bypass Failure: ' + err.message);
      btn.disabled = false;
      btn.innerHTML = `<i class="fas fa-terminal"></i> OVERRIDE PROTOCOL (BYPASS)`;
    }
  });
}

// SHARED AUTH LOGIC
async function handleGoogleSignIn() {
  const btn = document.getElementById('btn-google-signin');
  if (!btn) return;
  btn.disabled = true;
  btn.innerHTML = `<i class="fas fa-circle-notch fa-spin"></i> INTERFACING...`;
  try {
    showInfo('Authenticating via Google Cloud Gate...');
    await signInWithGoogle();
  } catch (err) {
    showError('Authentication Failure.');
    btn.disabled = false;
    btn.innerHTML = `SECURE SIGN-IN WITH GOOGLE`;
  }
}

async function handleEmailSignIn(e) {
  e.preventDefault();
  const btn = document.getElementById('btn-email-signin');
  const email = document.getElementById('login-email').value;
  const pass = document.getElementById('login-pass').value;
  btn.disabled = true;
  btn.innerHTML = `<i class="fas fa-circle-notch fa-spin"></i> VERIFYING...`;
  try {
    await signInWithEmail(email, pass);
  } catch (err) {
    showError('Identity Verification Rejected.');
    btn.disabled = false;
    btn.innerHTML = `<i class="fas fa-shield-keyhole"></i> AUTHORIZE DIRECT`;
  }
}
