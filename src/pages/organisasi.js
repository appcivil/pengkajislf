import { supabase } from '../lib/supabase.js';
import { escapeHtml } from '../lib/safe-markdown.js';
import { showSuccess, showError } from '../components/toast.js';
import { store } from '../lib/store.js';

export async function organisasiPage() {
  const { data, error } = await supabase
    .from('organization_members')
    .select('organization_id, role, created_at, organizations(name, slug, is_legacy)')
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error('Tidak dapat memuat organisasi: ' + error.message);
  }

  const memberships = (data || []).filter(row => row.organization_id);
  const activeOrganizationId = store.get().activeOrganizationId || null;
  const cards = memberships.length
    ? memberships.map(row => `
      <div class="card-quartz" style="padding:24px; margin-bottom:16px">
        <div style="display:flex; justify-content:space-between; gap:16px; align-items:flex-start">
          <div>
            <h3 style="font-size:1.05rem; color:white; margin:0 0 8px">${escapeHtml(row.organizations?.name || 'Organisasi')}</h3>
            <p style="font-size:.78rem; color:var(--text-tertiary); margin:0">
              ${escapeHtml(row.organizations?.slug || 'Tanpa slug')}
              ${row.organizations?.is_legacy ? ' · Workspace migrasi lama' : ''}
            </p>
          </div>
          <span class="badge">${escapeHtml(row.role)}</span>
        </div>
        <p style="font-size:.8rem; color:var(--text-secondary); margin:16px 0 0">
          ID tenant: <code>${escapeHtml(row.organization_id)}</code>
        </p>
        <div style="display:flex; justify-content:flex-end; margin-top:14px">
          ${activeOrganizationId === row.organization_id
            ? '<span class="badge" style="background:var(--success-500); color:white">Organisasi aktif</span>'
            : '<button type="button" class="btn btn-outline btn-sm" onclick="window.selectActiveOrganization(\'' + escapeHtml(row.organization_id) + '\')">Jadikan aktif</button>'}
        </div>
      </div>
    `).join('')
    : '<div class="card-quartz" style="padding:24px">Akun ini belum menjadi anggota organisasi.</div>';

  return `
    <div class="page-header" style="margin-bottom:28px">
      <h1 class="page-title">Organisasi <span class="text-gradient-gold">Tenant</span></h1>
      <p class="page-subtitle">Kelola ruang kerja instansi dan lihat keanggotaan akun Anda.</p>
    </div>
    <div class="grid-main-side">
      <section>
        <h2 style="font-size:1.1rem; margin-bottom:16px">Organisasi saya</h2>
        ${cards}
      </section>
      <aside class="card-quartz" style="padding:24px; height:fit-content">
        <h2 style="font-size:1.05rem; margin:0 0 12px">Buat organisasi baru</h2>
        <p style="font-size:.8rem; color:var(--text-tertiary); line-height:1.6">
          Pembuat organisasi otomatis menjadi owner pertama. Buat tenant terpisah untuk setiap instansi atau konsultan.
        </p>
        <form id="create-organization-form" onsubmit="window.handleCreateOrganization(event)">
          <div class="form-group">
            <label class="form-label" for="organization-name">Nama organisasi</label>
            <input id="organization-name" class="form-input" name="name" minlength="2" maxlength="160" required placeholder="Contoh: PT Konsultan SLF Nusantara">
          </div>
          <button class="btn-presidential gold" id="create-organization-button" type="submit" style="width:100%; height:46px">
            Buat organisasi
          </button>
        </form>
        <p style="font-size:.72rem; color:var(--text-tertiary); margin-top:16px">
          Undangan anggota dan pemindahan data lama belum diaktifkan sampai proses verifikasi tenant selesai.
        </p>
      </aside>
    </div>
  `;
}

window.selectActiveOrganization = function(organizationId) {
  const allowed = document.querySelectorAll('[data-organization-id]');
  // The server-side membership check remains authoritative; this is only
  // a UI context choice and never grants access to another tenant.
  store.set({ activeOrganizationId: organizationId });
  showSuccess('Organisasi aktif diperbarui.');
  window.navigate('organisasi');
};

window.handleCreateOrganization = async function(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const button = document.getElementById('create-organization-button');
  const name = String(new FormData(form).get('name') || '').trim();
  if (name.length < 2 || name.length > 160) {
    showError('Nama organisasi harus 2–160 karakter.');
    return;
  }

  button.disabled = true;
  try {
    const { error } = await supabase.rpc('create_organization', { p_name: name });
    if (error) throw error;
    showSuccess('Organisasi berhasil dibuat. Anda menjadi owner pertama.');
    window.navigate('organisasi');
  } catch (error) {
    showError('Gagal membuat organisasi: ' + error.message);
    button.disabled = false;
  }
};
