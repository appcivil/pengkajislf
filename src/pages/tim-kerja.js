// ============================================================
//  TEAM WORK MANAGEMENT PAGE
//  Monitoring beban kerja & monitoring progres tim
// ============================================================
import { fetchTeamMembers, fetchTeamWorkload } from '../lib/team-service.js';
import { supabase } from '../lib/supabase.js';
import { navigate } from '../lib/router.js';

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
            <h1 class="page-title">Monitoring Tim Kerja</h1>
            <p class="page-subtitle">Pantau distribusi beban kerja dan efektivitas personil pengkaji</p>
          </div>
          <div class="flex gap-2">
             <button class="btn btn-outline" onclick="window.location.reload()">
              <i class="fas fa-rotate"></i> Refresh
            </button>
            <button class="btn btn-primary" onclick="window._showAddMemberModal()">
              <i class="fas fa-plus"></i> Anggota Baru
            </button>
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
        <button class="btn btn-icon" onclick="window.navigate('proyek', {PIC: '${m.id}'})" title="Lihat Proyek">
          <i class="fas fa-folder-open"></i>
        </button>
      </td>
    </tr>
  `;
}

function initEvents() {
  window._showAddMemberModal = () => {
    // Implement add member logic or show message
    alert('Fungsionalitas pendaftaran anggota baru memerlukan integrasi dengan Supabase Auth Invites.');
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
