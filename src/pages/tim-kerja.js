// ============================================================
//  TEAM WORK MANAGEMENT PAGE
//  Monitoring beban kerja & monitoring progres tim
// ============================================================
import { fetchTeamMembers, fetchTeamWorkload, createProfile, updateProfile, deleteProfile } from '../lib/team-service.js';
import { supabase } from '../lib/supabase.js';
import { navigate } from '../lib/router.js';
import { isAdmin } from '../lib/auth.js';
import { showSuccess, showError } from '../components/toast.js';
import { confirm } from '../components/modal.js';
import { APP_CONFIG } from '../lib/config.js';

export async function timKerjaPage() {
  const root = document.getElementById('page-root');
  if (root) root.innerHTML = renderSkeleton();

  const workload = await fetchTeamWorkload();
  const members  = await fetchTeamMembers();
  
  const html = buildHtml(workload, members);
  if (root) {
    root.innerHTML = html;
    initEvents();
  }
  return html;
}

function buildHtml(workload, members) {
  const totalProjects = workload.reduce((s, m) => s + (m.projectCount || 0), 0);
  const avgProgress   = workload.length > 0 
    ? Math.round(workload.reduce((s, m) => s + (m.avgProgress || 0), 0) / workload.length)
    : 0;

  return `
    <div id="tim-kerja-page">
      <div class="page-header">
        <div class="flex-between">
          <div>
            <h1 class="page-title">Manajemen User & Aktivitas Tim</h1>
            <p class="page-subtitle">Kelola hak akses personil dan pantau distribusi beban kerja secara real-time</p>
          </div>
          <div class="flex gap-2">
             <button class="btn btn-outline" onclick="window.location.reload()">
              <i class="fas fa-rotate"></i> Refresh
            </button>
            ${isAdmin() ? `
              <button class="btn btn-primary" onclick="window._showAddMemberModal()">
                <i class="fas fa-plus"></i> Anggota Baru
              </button>
            ` : ''}
          </div>
        </div>
      </div>

      <!-- Team Stats -->
      <div class="kpi-grid" style="margin-bottom:var(--space-6)">
        <div class="kpi-card">
          <div class="kpi-icon-wrap kpi-blue"><i class="fas fa-users"></i></div>
          <div class="kpi-value">${members.length}</div>
          <div class="kpi-label">Total Personil</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon-wrap kpi-indigo"><i class="fas fa-briefcase"></i></div>
          <div class="kpi-value">${totalProjects}</div>
          <div class="kpi-label">Proyek Terdelegasi</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon-wrap kpi-green"><i class="fas fa-chart-line"></i></div>
          <div class="kpi-value">${avgProgress}%</div>
          <div class="kpi-label">Rata-rata Progres</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon-wrap kpi-purple"><i class="fas fa-check-double"></i></div>
          <div class="kpi-value">${workload.filter(w => w.status === 'Active').length}</div>
          <div class="kpi-label">Personil Siaga</div>
        </div>
      </div>

      <!-- Team Workload Grid -->
      <div class="card">
        <div class="card-header">
          <div class="card-title">Distribusi Beban Kerja Tim</div>
          <div class="card-subtitle">Menampilkan jumlah proyek aktif per personil</div>
        </div>
        <div class="table-container">
          <table class="team-table">
            <thead>
              <tr>
                <th style="width:50px"></th>
                <th>Nama Personil</th>
                <th>Spesialisasi / Role</th>
                <th>Proyek Aktif</th>
                <th>Rerata Progres</th>
                <th style="width:100px">Status</th>
                <th style="text-align:right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              ${workload.length === 0 ? `<tr><td colspan="7" style="text-align:center;padding:40px">Belum ada data anggota tim terdaftar.</td></tr>` : ''}
              ${workload.map(m => renderMemberRow(m)).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Activity Feed Placeholder -->
      <div class="grid-2-1" style="margin-top:var(--space-6)">
        <div class="card">
            <div class="card-header">
                <div class="card-title">Beban Kerja Visual</div>
            </div>
            <div style="padding:20px; height:300px; display:flex; align-items:flex-end; gap:20px; justify-content:space-around">
                ${workload.map(m => `
                    <div style="flex:1; display:flex; flex-direction:column; align-items:center; gap:10px">
                        <div class="progress-wrap" style="width:20px; height:200px; flex-direction:column; justify-content:flex-end">
                            <div class="progress-fill blue" style="width:100%; height:${(m.activeProjects / (totalProjects || 1)) * 100}%"></div>
                        </div>
                        <div class="text-xs font-bold" style="text-align:center">${m.full_name?.split(' ')[0]}</div>
                    </div>
                `).join('')}
            </div>
        </div>
        <div class="card">
             <div class="card-header">
                <div class="card-title">Ketersediaan Personil</div>
            </div>
            <div style="padding:10px 20px">
                ${members.map(m => `
                    <div style="display:flex; align-items:center; justify-content:space-between; padding:12px 0; border-bottom:1px solid var(--border-subtle)">
                        <div style="display:flex; align-items:center; gap:10px">
                            <div style="width:10px; height:10px; border-radius:50%; background:${m.status === 'Active' ? 'var(--success-400)' : 'var(--warning-400)'}"></div>
                            <span class="text-sm font-semibold">${m.full_name}</span>
                        </div>
                        <span class="text-xs text-tertiary">${m.role}</span>
                    </div>
                `).join('')}
            </div>
        </div>
      </div>
    </div>
  `;
}

function renderMemberRow(m) {
  return `
    <tr class="member-row">
      <td>
        <div class="avatar-sm" style="background:var(--bg-elevated); color:var(--text-primary); border:1px solid var(--border-subtle)">
          ${m.avatar_url ? `<img src="${m.avatar_url}" style="width:100%;height:100%;border-radius:50%">` : `<i class="fas fa-user-tie"></i>`}
        </div>
      </td>
      <td>
        <div class="font-bold text-primary">${m.full_name}</div>
        <div class="text-xs text-tertiary">ID: ${m.id}</div>
      </td>
      <td>
        <span class="badge badge-proses" style="background:var(--bg-elevated); color:var(--text-secondary)">${m.role || 'Tenaga Ahli'}</span>
      </td>
      <td>
        <div class="font-bold" style="font-size:1.1rem; color:var(--brand-400)">${m.activeProjects || 0} <span class="text-xs font-normal text-tertiary">Proyek</span></div>
      </td>
      <td>
        <div class="flex-between mb-1" style="width:120px">
          <span class="text-xs text-secondary">${m.avgProgress || 0}%</span>
        </div>
        <div class="progress-wrap" style="width:120px; height:6px">
          <div class="progress-fill ${m.avgProgress > 70 ? 'green' : 'blue'}" style="width:${m.avgProgress || 0}%"></div>
        </div>
      </td>
      <td>
        <span class="badge ${m.status === 'Active' ? 'badge-laik' : 'badge-bersyarat'}">${m.status || 'Active'}</span>
      </td>
      <td style="text-align:right">
        <div class="flex gap-1" style="justify-content:flex-end">
          <button class="btn btn-icon" onclick="window.navigate('proyek', {PIC: '${m.id}'})" title="Lihat Proyek">
            <i class="fas fa-folder-open"></i>
          </button>
          ${isAdmin() ? `
            <button class="btn btn-icon text-primary" onclick="window._showEditMemberModal('${m.id}')" title="Edit Personil">
              <i class="fas fa-user-pen"></i>
            </button>
            <button class="btn btn-icon text-danger" onclick="window._deleteMember('${m.id}', '${m.full_name}')" title="Hapus Personil">
              <i class="fas fa-trash-can"></i>
            </button>
          ` : ''}
        </div>
      </td>
    </tr>
  `;
}

function initEvents() {
  window._showAddMemberModal = () => renderMemberModal();
  
  window._showEditMemberModal = async (id) => {
    try {
      const { data: member } = await supabase.from('profiles').select('*').eq('id', id).single();
      renderMemberModal(member);
    } catch (err) {
      showError('Gagal mengambil data personil: ' + err.message);
    }
  };

  window._deleteMember = async (id, name) => {
    const ok = await confirm({
      title: 'Hapus Personil',
      message: `Apakah Anda yakin ingin menghapus <strong>${name}</strong> dari daftar tim? Akses ke proyek mungkin terganggu.`,
      confirmText: 'Hapus',
      danger: true
    });
    if (!ok) return;

    try {
      await deleteProfile(id);
      showSuccess(`Personil ${name} telah dihapus.`);
      timKerjaPage(); // Refresh
    } catch (err) {
      showError('Gagal hapus: ' + err.message);
    }
  };
}

/**
 * Renders the Create/Edit Modal
 */
function renderMemberModal(member = null) {
  const isEdit = !!member;
  const roles = Object.entries(APP_CONFIG.roles);
  
  const modalHtml = `
    <div id="member-modal-overlay" style="position:fixed; inset:0; background:rgba(0,0,0,0.5); backdrop-filter:blur(6px); z-index:9999; display:flex; align-items:center; justify-content:center; padding:20px; animation: fade-in 0.3s ease;">
      <div style="background:var(--bg-card); width:100%; max-width:450px; border-radius:20px; box-shadow:0 25px 70px rgba(0,0,0,0.4); border:1px solid var(--border-subtle); overflow:hidden; animation: modal-up 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);">
        <div style="padding:24px; border-bottom:1px solid var(--border-subtle); display:flex; justify-content:space-between; align-items:center; background:linear-gradient(to right, var(--bg-card), var(--bg-elevated));">
          <h3 style="margin:0; font-size:1.25rem; font-weight:900; color:var(--text-h); letter-spacing:-0.02em;">
            ${isEdit ? 'Edit Data Personil' : 'Tambah Anggota Tim Baru'}
          </h3>
          <button onclick="document.getElementById('member-modal-overlay').remove()" style="background:rgba(0,0,0,0.05); border:none; width:32px; height:32px; border-radius:50%; color:var(--text-tertiary); cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all 0.2s;">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <form id="member-form" style="padding:24px; display:flex; flex-direction:column; gap:20px;">
          <div class="form-group">
            <label class="form-label">Nama Lengkap & Gelar</label>
            <div class="form-control-wrap">
              <i class="fas fa-user-tie form-control-icon"></i>
              <input type="text" name="full_name" class="form-control with-icon" placeholder="Ir. Budi Santoso, M.T." required value="${member?.full_name || ''}">
            </div>
          </div>
          
          <div class="form-group">
            <label class="form-label">Alamat Email Resmi</label>
            <div class="form-control-wrap">
              <i class="fas fa-envelope form-control-icon"></i>
              <input type="email" name="email" class="form-control with-icon" placeholder="budi@pengkaji.com" required value="${member?.email || ''}" ${isEdit ? 'readonly' : ''}>
            </div>
            ${isEdit ? '<div style="font-size:10px; color:var(--tertiary); padding-left:2px; margin-top:2px;">Email tidak dapat diubah oleh Admin.</div>' : ''}
          </div>

          <div style="display:grid; grid-template-columns:1px 1fr 1fr; gap:16px;">
            <div style="grid-column: 2/3" class="form-group">
              <label class="form-label">Jabatan</label>
              <div class="form-control-wrap">
                <i class="fas fa-id-badge form-control-icon"></i>
                <select name="role" class="form-control with-icon" required>
                  ${roles.map(([val, label]) => `<option value="${label}" ${member?.role === label ? 'selected' : ''}>${label}</option>`).join('')}
                </select>
              </div>
            </div>
            <div style="grid-column: 3/4" class="form-group">
              <label class="form-label">Status</label>
              <div class="form-control-wrap">
                <i class="fas fa-circle-check form-control-icon"></i>
                <select name="status" class="form-control with-icon">
                  <option value="Active" ${member?.status === 'Active' ? 'selected' : ''}>Active / Siaga</option>
                  <option value="Away" ${member?.status === 'Away' ? 'selected' : ''}>Ijin / Sakit</option>
                  <option value="Busy" ${member?.status === 'Busy' ? 'selected' : ''}>Di Lapangan</option>
                </select>
              </div>
            </div>
          </div>

          <div style="margin-top:12px; display:flex; gap:12px; justify-content:flex-end; align-items:center;">
             <a href="javascript:void(0)" onclick="document.getElementById('member-modal-overlay').remove()" style="color:var(--text-tertiary); font-size:14px; font-weight:700; text-decoration:none;">Batal</a>
             <button type="submit" class="btn btn-primary" id="btn-save-member" style="padding:12px 24px; border-radius:14px; box-shadow: 0 10px 20px -5px var(--accent-bg);">
              <i class="fas fa-save" style="margin-right:8px"></i> Simpan Data
            </button>
          </div>
        </form>
      </div>
    </div>
    <style>
      @keyframes modal-up { from { opacity:0; transform:translateY(30px) scale(0.95); } to { opacity:1; transform:translateY(0) scale(1); } }
      @keyframes fade-in { from { opacity:0; } to { opacity:1; } }
      #member-modal-overlay button:hover { background:rgba(0,0,0,0.1); color:var(--error); transform:rotate(90deg); }
    </style>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHtml);

  document.getElementById('member-form').onsubmit = async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn-save-member');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';

    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    try {
      if (isEdit) {
        await updateProfile(member.id, data);
        showSuccess('Data personil berhasil diperbarui.');
      } else {
        await createProfile(data);
        showSuccess('Anggota baru berhasil ditambahkan.');
      }
      document.getElementById('member-modal-overlay').remove();
      timKerjaPage(); // Refresh UI
    } catch (err) {
      showError('Gagal menyimpan: ' + err.message);
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-save"></i> Simpan Data';
    }
  };
}

function renderSkeleton() {
  return `
    <div class="page-header">
      <div class="skeleton" style="height:36px;width:300px;margin-bottom:8px"></div>
      <div class="skeleton" style="height:20px;width:400px"></div>
    </div>
    <div class="kpi-grid">
      ${Array(4).fill(0).map(() => `<div class="skeleton" style="height:120px;border-radius:var(--radius-lg)"></div>`).join('')}
    </div>
    <div class="skeleton" style="height:400px;margin-top:20px;border-radius:var(--radius-lg)"></div>
  `;
}
