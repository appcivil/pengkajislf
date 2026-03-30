// ============================================================
//  LOGIN PAGE
// ============================================================
import { signInWithGoogle, signInWithEmail, signUpWithEmail, devModeBypass } from '../lib/auth.js';
import { APP_CONFIG } from '../lib/config.js';
import { showError, showInfo } from '../components/toast.js';

export async function loginPage() {
  const features = [
    { icon: 'fa-brain',           text: 'AI Engine terintegrasi (SNI 9273:2025, ASCE 41-17)' },
    { icon: 'fa-shield-halved',   text: 'Penilaian Laik Fungsi otomatis berbasis standar' },
    { icon: 'fa-file-contract',   text: 'Laporan kajian SLF profesional otomatis' },
    { icon: 'fa-chart-line',      text: 'Dashboard analitik & executive report' },
    { icon: 'fa-database',        text: 'Database terintegrasi Google Workspace' },
  ];

  const year = new Date().getFullYear();

  const html = `
    <div class="auth-page" id="login-page">
      <!-- Visual Side -->
      <div class="auth-visual">
        <div class="auth-visual-content">
          <div class="auth-logo-big">
            <i class="fas fa-building"></i>
          </div>
          <h1 class="auth-visual-title">Smart AI Konsultan<br>Pengkaji SLF</h1>
          <p class="auth-visual-subtitle">
            Sistem berbasis AI untuk pengkajian teknis bangunan gedung
            sesuai standar NSPK, SNI, dan ASCE/SEI
          </p>

          <div class="auth-features">
            ${features.map(f => `
              <div class="auth-feature-item">
                <i class="fas ${f.icon}"></i>
                <span>${f.text}</span>
              </div>
            `).join('')}
          </div>

          <!-- Standards badges -->
          <div style="display:flex;gap:8px;margin-top:32px;flex-wrap:wrap;justify-content:center">
            ${['PP No. 16/2021', 'SNI 9273:2025', 'ASCE/SEI 41-17', 'NSPK'].map(s => `
              <span style="background:hsla(220,70%,48%,0.15);border:1px solid hsla(220,70%,48%,0.3);color:var(--brand-400);padding:4px 10px;border-radius:var(--radius-full);font-size:0.72rem;font-weight:600">
                ${s}
              </span>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- Form Side -->
      <div class="auth-form-panel">
        <div class="auth-form-wrap">
          <h2 class="auth-form-title">Selamat Datang</h2>
          <p class="auth-form-subtitle">
            Masuk ke sistem Smart AI Pengkaji SLF menggunakan akun Google Anda.
          </p>

          <!-- Google Sign In Button -->
          <button class="btn-google" id="btn-google-signin" type="button">
            <svg class="google-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Masuk dengan Google
          </button>

          <div class="auth-divider"><span>atau</span></div>

          <div id="login-container">
            <form id="email-login-form" style="display:flex;flex-direction:column;gap:12px;margin-top:16px;">
              <div style="text-align:left">
                <label style="font-size:0.8rem;font-weight:600;margin-bottom:4px;display:block">Alamat Email</label>
                <input type="email" id="login-email" class="form-control" placeholder="admin@pengkaji.com" required style="width:100%">
              </div>
              <div style="text-align:left">
                <label style="font-size:0.8rem;font-weight:600;margin-bottom:4px;display:block">Kata Sandi (Password)</label>
                <input type="password" id="login-pass" class="form-control" placeholder="••••••••" required style="width:100%">
              </div>
              <button type="submit" class="btn btn-primary" id="btn-email-signin" style="width:100%;margin-top:8px">
                <i class="fas fa-sign-in-alt"></i> Masuk dengan Email
              </button>
              <button type="button" class="btn btn-secondary" id="btn-dev-bypass" style="width:100%;">
                <i class="fas fa-hammer"></i> Masuk Tanpa Login (Bypass API)
              </button>
            </form>
            <div style="margin-top:16px;text-align:center;font-size:0.85rem">
              Belum punya akun? <a href="#" id="link-to-signup" style="color:var(--brand-400);font-weight:600;text-decoration:none">Daftar sekarang</a>
            </div>
          </div>

          <div id="signup-container" style="display:none;">
            <form id="email-signup-form" style="display:flex;flex-direction:column;gap:12px;margin-top:16px;">
              <div style="text-align:left">
                <label style="font-size:0.8rem;font-weight:600;margin-bottom:4px;display:block">Nama Lengkap</label>
                <input type="text" id="signup-name" class="form-control" placeholder="Ir. Budi Santoso" required style="width:100%">
              </div>
              <div style="text-align:left">
                <label style="font-size:0.8rem;font-weight:600;margin-bottom:4px;display:block">Alamat Email</label>
                <input type="email" id="signup-email" class="form-control" placeholder="admin@pengkaji.com" required style="width:100%">
              </div>
              <div style="text-align:left">
                <label style="font-size:0.8rem;font-weight:600;margin-bottom:4px;display:block">Kata Sandi (Minimal 6 karakter)</label>
                <input type="password" id="signup-pass" class="form-control" placeholder="••••••••" required minlength="6" style="width:100%">
              </div>
              <button type="submit" class="btn border-primary text-primary" id="btn-email-signup" style="width:100%;margin-top:8px">
                <i class="fas fa-user-plus"></i> Buat Akun Baru
              </button>
            </form>
            <div style="margin-top:16px;text-align:center;font-size:0.85rem">
              Sudah punya akun? <a href="#" id="link-to-login" style="color:var(--brand-400);font-weight:600;text-decoration:none">Masuk di sini</a>
            </div>
          </div>

          <div class="auth-disclaimer">
            Dengan masuk, Anda menyetujui Syarat & Ketentuan penggunaan sistem.<br>
            &copy; ${year} Smart AI Pengkaji SLF &bullet; v${APP_CONFIG.version}
          </div>
        </div>
      </div>
    </div>
  `;

  // Fix: jangan override body, render ke mount point #app
  const app = document.getElementById('app') || document.body;
  app.innerHTML = html;
  
  // Event listeners
  document.getElementById('btn-google-signin')?.addEventListener('click', handleGoogleSignIn);
  document.getElementById('email-login-form')?.addEventListener('submit', handleEmailSignIn);
  document.getElementById('email-signup-form')?.addEventListener('submit', handleEmailSignUp);
  
  document.getElementById('link-to-signup')?.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('login-container').style.display = 'none';
    document.getElementById('signup-container').style.display = 'block';
    document.querySelector('.auth-form-title').innerText = 'Buat Akun Baru';
    document.querySelector('.auth-form-subtitle').innerText = 'Daftarkan diri Anda untuk mengakses alat Pengkaji SLF.';
  });

  document.getElementById('link-to-login')?.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('signup-container').style.display = 'none';
    document.getElementById('login-container').style.display = 'block';
    document.querySelector('.auth-form-title').innerText = 'Selamat Datang';
    document.querySelector('.auth-form-subtitle').innerText = 'Masuk ke sistem Smart AI Pengkaji SLF menggunakan akun Google Anda.';
  });

  document.getElementById('btn-dev-bypass')?.addEventListener('click', async (e) => {
    e.preventDefault(); // Mencegah form ke-submit
    const btn = document.getElementById('btn-dev-bypass');
    btn.disabled = true;
    btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Memuat...`;
    
    try {
      await devModeBypass();
      // Paksa router pindah ke dashboard tanpa re-render keseluruhan dokumen!
      window.navigate('dashboard');
    } catch(err) {
      showError('Gagal Bypass: ' + err.message);
      btn.disabled = false;
      btn.innerHTML = `<i class="fas fa-hammer"></i> Masuk Tanpa Login (Bypass API)`;
    }
  });
}

async function handleGoogleSignIn() {
  const btn = document.getElementById('btn-google-signin');
  if (!btn) return;

  btn.disabled = true;
  btn.innerHTML = `
    <i class="fas fa-circle-notch fa-spin"></i>
    Menghubungkan ke Google...
  `;

  try {
    showInfo('Membuka jendela login Google...');
    await signInWithGoogle();
    // Supabase will redirect back, so no need to handle success here
  } catch (err) {
    console.error('[Login] Google sign-in error:', err);
    showError('Gagal masuk dengan Google. ' + (err.message || 'Periksa koneksi Anda.'));
    btn.disabled = false;
    btn.innerHTML = `
      <svg class="google-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
      Masuk dengan Google
    `;
  }
}

async function handleEmailSignIn(e) {
  e.preventDefault();
  const btn = document.getElementById('btn-email-signin');
  const email = document.getElementById('login-email').value;
  const pass = document.getElementById('login-pass').value;

  if (!email || !pass) return showError('Lengkapi email dan password');

  btn.disabled = true;
  const oldText = btn.innerHTML;
  btn.innerHTML = `<i class="fas fa-circle-notch fa-spin"></i> Memeriksa...`;

  try {
    await signInWithEmail(email, pass);
    // Success will be handled by auth state change listener in app.js / router.js
  } catch (err) {
    if (err.message.includes('Invalid login credentials')) {
      showError('Email atau kata sandi salah!');
    } else if (err.message.includes('Email not confirmed')) {
      showError('Email belum diverifikasi. Silakan periksa inbox Anda.');
    } else {
      showError('Gagal masuk. Pastikan koneksi internet stabil.');
    }
    btn.disabled = false;
    btn.innerHTML = oldText;
  }
}

async function handleEmailSignUp(e) {
  e.preventDefault();
  const btn = document.getElementById('btn-email-signup');
  const name = document.getElementById('signup-name').value;
  const email = document.getElementById('signup-email').value;
  const pass = document.getElementById('signup-pass').value;

  if (!name || !email || !pass) return showError('Semua form wajib diisi');
  if (pass.length < 6) return showError('Kata sandi minimal 6 karakter');

  btn.disabled = true;
  const oldText = btn.innerHTML;
  btn.innerHTML = `<i class="fas fa-circle-notch fa-spin"></i> Mendaftarkan...`;

  try {
    const data = await signUpWithEmail(email, pass, name);
    
    // Based on user configuration, confirm email is ON in backend.
    showSuccess('Pendaftaran berhasil! Silakan periksa kotak masuk (Inbox/Spam) email Anda untuk menekan tombol verifikasi.');
    
    // Switch to login view
    document.getElementById('link-to-login').click();
    
    // Pre-fill email so user remembers which email they registered
    document.getElementById('login-email').value = email;
    document.getElementById('login-pass').value = '';
    
    // Re-enable button
    btn.disabled = false;
    btn.innerHTML = oldText;
  } catch (err) {
    if (err.message.includes('User already registered')) {
      showError('Email ini sudah terdaftar. Silakan reset password atau langsung masuk.');
    } else {
      showError('Pendaftaran gagal: ' + err.message);
    }
    btn.disabled = false;
    btn.innerHTML = oldText;
  }
}
