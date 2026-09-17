/**
 * MODAL: FORCE PASSWORD CHANGE
 * Memaksa pengguna untuk memperbarui password mereka saat login pertama
 */
import { supabase } from '../lib/supabase.js';

import { escapeHtml } from '../lib/safe-markdown.js';
import { toast } from '../components/toast.js';
export function renderPasswordChangeModal(userInfo) {
  const modalId = 'modal-force-password-change';
  if (document.getElementById(modalId)) return;

  const modalOverlay = document.createElement('div');
  modalOverlay.id = modalId;
  modalOverlay.className = 'modal-overlay show';
  modalOverlay.style.zIndex = '9999';

  // Dialog ini SENGAJA tidak dapat ditutup dengan Escape.
  //
  // Pengguna yang kata sandinya harus diganti tidak boleh bisa kembali ke
  // aplikasi sebelum menggantinya — itu inti dari alur ini. Penanda
  // data-no-escape memberi tahu lapisan aksesibilitas (src/lib/a11y.js)
  // supaya tombol Escape TIDAK menutup dialog ini.
  //
  // Sengaja TIDAK memakai role="dialog" + aria-modal="true" dengan jebakan
  // fokus: perangkap fokus akan menjebak pengguna keyboard di dalam dialog
  // yang memang tidak punya jalan keluar selain mengganti kata sandi —
  // pengalaman yang menyesatkan. Sebagai gantinya peran dan atribut yang
  // tepat adalah "alertdialog" tanpa modal, plus judul yang dikaitkan.
  modalOverlay.setAttribute('data-no-escape', 'true');
  modalOverlay.setAttribute('role', 'alertdialog');
  modalOverlay.setAttribute('aria-labelledby', 'force-password-title');
  modalOverlay.innerHTML = `
    <div class="modal-content" style="max-width: 450px; border-top: 4px solid var(--accent-primary);">
      <div class="modal-header">
        <h2 class="modal-title" id="force-password-title">
          <i class="fas fa-shield-alt" style="color:var(--accent-primary); margin-right:12px;"></i>
          Security Initialization
        </h2>
      </div>
      
      <div class="modal-body">
        <p style="margin-bottom:20px; color:var(--text-secondary); font-size:14px; line-height:1.6;">
          Halo <b>${escapeHtml(userInfo.name)}</b>, demi alasan keamanan Anda diwajibkan mengganti kata sandi akses sementara sebelum masuk ke Dasbor.
        </p>

        <form id="form-change-password">
          <div class="form-group">
            <label class="form-label">KATA SANDI BARU</label>
            <input type="password" id="new-password" class="form-input" placeholder="Min 8 characters" required minlength="8">
          </div>

          <div class="form-group">
            <label class="form-label">ULANGI KATA SANDI BARU</label>
            <input type="password" id="confirm-password" class="form-input" placeholder="Repeat password" required minlength="8">
          </div>

          <div id="password-error" style="color:var(--status-danger); font-size:12px; margin-top:-10px; margin-bottom:15px; display:none;">
            Passwords do not match.
          </div>

          <button type="submit" class="btn btn-primary btn-block" style="margin-top:10px;">
            <i class="fas fa-key"></i> UPDATE & INITIALIZE ACCESS
          </button>
        </form>
      </div>
    </div>
  `;

  document.body.appendChild(modalOverlay);

  // Handle Form Submission
  const form = document.getElementById('form-change-password');
  const errorMsg = document.getElementById('password-error');

  form.onsubmit = async (e) => {
    e.preventDefault();
    const newPass = document.getElementById('new-password').value;
    const confirmPass = document.getElementById('confirm-password').value;
    const submitBtn = form.querySelector('button[type="submit"]');

    if (newPass !== confirmPass) {
      errorMsg.style.display = 'block';
      return;
    }

    errorMsg.style.display = 'none';
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Initializing...';

    try {
      // 1. Update Supabase Auth Password
      const { error: authError } = await supabase.auth.updateUser({ password: newPass });
      if (authError) throw authError;

      // 2. Update Profile Table (Clear force flag)
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ force_password_change: false })
        .eq('id', userInfo.id);
      
      if (profileError) throw profileError;

      // 3. Success
      modalOverlay.classList.remove('show');
      setTimeout(() => {
        modalOverlay.remove();
        window.location.reload(); // Reload to ensure all state is clean
      }, 300);

    } catch (err) {
      console.error('[Security] Failed to update password:', err.message);
      toast('Gagal memperbarui kata sandi: ' + err.message, 'error');
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="fas fa-key"></i> TRY AGAIN';
    }
  };
}
