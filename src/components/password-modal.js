/**
 * MODAL: FORCE PASSWORD CHANGE
 * Memaksa pengguna untuk memperbarui password mereka saat login pertama
 */
import { supabase } from '../lib/supabase.js';

export function renderPasswordChangeModal(userInfo) {
  const modalId = 'modal-force-password-change';
  if (document.getElementById(modalId)) return;

  const modalOverlay = document.createElement('div');
  modalOverlay.id = modalId;
  modalOverlay.className = 'modal-overlay show';
  modalOverlay.style.zIndex = '9999';
  modalOverlay.innerHTML = `
    <div class="modal-content" style="max-width: 450px; border-top: 4px solid var(--accent-primary);">
      <div class="modal-header">
        <h2 class="modal-title">
          <i class="fas fa-shield-alt" style="color:var(--accent-primary); margin-right:12px;"></i>
          Security Initialization
        </h2>
      </div>
      
      <div class="modal-body">
        <p style="margin-bottom:20px; color:var(--text-secondary); font-size:14px; line-height:1.6;">
          Hi <b>${userInfo.name}</b>, for security reasons, you are required to change your temporary access password before proceeding to the Consortium Dashboard.
        </p>

        <form id="form-change-password">
          <div class="form-group">
            <label class="form-label">NEW SECURE PASSWORD</label>
            <input type="password" id="new-password" class="form-input" placeholder="Min 8 characters" required minlength="8">
          </div>

          <div class="form-group">
            <label class="form-label">CONFIRM NEW PASSWORD</label>
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
      alert('Failed to update password: ' + err.message);
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="fas fa-key"></i> TRY AGAIN';
    }
  };
}
