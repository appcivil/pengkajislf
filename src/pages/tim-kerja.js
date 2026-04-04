/**
 * TIM KERJA (TEAM MANAGEMENT) PAGE
 * PRESIDENTIAL CLASS (QUARTZ PREMIUM)
 * Authorized Personnel Directory & Tactical Workload Monitoring
 */
import { fetchTeamMembers, fetchTeamWorkload, createProfile, updateProfile, deleteProfile } from '../lib/team-service.js';
import { supabase } from '../lib/supabase.js';
import { navigate } from '../lib/router.js';
import { isAdmin } from '../lib/auth.js';
import { showSuccess, showError } from '../components/toast.js';
import { confirm } from '../components/modal.js';
import { APP_CONFIG } from '../lib/config.js';

export async function timKerjaPage() {
  const workload = await fetchTeamWorkload();
  const members  = await fetchTeamMembers();
  
  return buildHtml(workload, members);
}

/**
 * Lifecycle Hook: Inisialisasi setelah render DOM selesai
 */
export function afterTimKerjaRender() {
  initEvents();
}

function buildHtml(workload, members) {
  const totalProjects = workload.reduce((s, m) => s + (m.projectCount || 0), 0);
  const avgProgress   = workload.length > 0 
    ? Math.round(workload.reduce((s, m) => s + (m.avgProgress || 0), 0) / workload.length)
    : 0;

  return `
    <div id="tim-kerja-page" style="animation: page-fade-in 0.8s ease-out">
      
      <!-- Presidential Header -->
      <div class="page-header" style="margin-bottom: 40px">
        <div class="flex-between">
          <div>
            <h1 class="page-title" style="font-family:'Outfit', sans-serif; font-weight:800; font-size: 2.2rem; letter-spacing:-0.02em; margin-bottom:4px">
              Team <span class="text-gradient-gold">Consortium</span>
            </h1>
            <p class="page-subtitle" style="font-family:var(--font-mono); font-size: 0.7rem; letter-spacing:1px; opacity:0.6; text-transform:uppercase">
              AUTHORIZED PERSONNEL DIRECTORY & REAL-TIME LOAD MONITORING
            </p>
          </div>
          <div class="flex gap-4">
             <button class="btn btn-outline" style="height:44px; padding:0 20px; border-radius:12px" onclick="window.location.reload()">
                <i class="fas fa-rotate"></i>
             </button>
             ${isAdmin() ? `
               <button class="btn-presidential gold" style="height:44px; padding:0 24px; border-radius:12px" onclick="window.open('https://supabase.com/dashboard/project/hrzplcqeadhvbrfhlfuh/auth/users', '_blank')">
                 <i class="fas fa-user-plus" style="margin-right:12px"></i> ADD AGENT
               </button>
             ` : ''}
          </div>
        </div>
      </div>

      <!-- Strategic Metrics -->
      <div style="display:grid; grid-template-columns: repeat(4, 1fr); gap: 24px; margin-bottom:40px">
        ${[
          { label: 'ACTIVE AGENTS', val: members.length, icon: 'fa-users-gear', color: 'var(--brand-400)' },
          { label: 'DELEGATED ASSETS', val: totalProjects, icon: 'fa-building-shield', color: 'var(--gold-400)' },
          { label: 'CONSENSUS PROGRESS', val: `${avgProgress}%`, icon: 'fa-chart-network', color: 'var(--success-400)' },
          { label: 'READY FOR DEPLOY', val: workload.filter(w => w.status === 'Active').length, icon: 'fa-shield-check', color: 'var(--brand-300)' }
        ].map(k => `
          <div class="card-quartz" style="padding:24px; display:flex; align-items:center; gap:20px">
             <div style="width:52px; height:52px; border-radius:14px; background:hsla(220, 20%, 100%, 0.03); display:flex; align-items:center; justify-content:center; color:${k.color}; font-size:1.4rem; border:1px solid hsla(220, 20%, 100%, 0.05)">
                <i class="fas ${k.icon}"></i>
             </div>
             <div>
                <div style="font-family:var(--font-mono); font-size:9px; font-weight:800; color:var(--text-tertiary); letter-spacing:1px">${k.label}</div>
                <div style="font-family:'Outfit', sans-serif; font-weight:800; font-size:1.6rem; color:white; line-height:1">${k.val}</div>
             </div>
          </div>
        `).join('')}
      </div>

      <!-- Expert Registry Matrix -->
      <div class="card-quartz" style="padding:0; overflow:hidden">
         <div style="padding:24px 32px; background:hsla(224, 25%, 4%, 0.6); border-bottom:1px solid hsla(220, 20%, 100%, 0.05); display:flex; justify-content:space-between; align-items:center">
            <h3 style="font-family:'Outfit', sans-serif; font-weight:800; font-size:1.1rem; color:white">Credentialed Expert Matrix</h3>
            <div style="font-family:var(--font-mono); font-size:9px; color:var(--text-tertiary); letter-spacing:1px">SYNC: REAL-TIME SECURE FEED</div>
         </div>
         
         <div style="overflow-x:auto">
            <table style="width:100%; border-collapse:collapse">
               <thead style="background:hsla(220, 20%, 100%, 0.02)">
                  <tr>
                     <th style="padding:20px 32px; text-align:left; font-family:var(--font-mono); font-size:9px; color:var(--text-tertiary); letter-spacing:1px">AUTHORIZED AGENT</th>
                     <th style="padding:20px 32px; text-align:left; font-family:var(--font-mono); font-size:9px; color:var(--text-tertiary); letter-spacing:1px">SPECIALIZATION</th>
                     <th style="padding:20px 32px; text-align:left; font-family:var(--font-mono); font-size:9px; color:var(--text-tertiary); letter-spacing:1px">ACTIVE LOAD</th>
                     <th style="padding:20px 32px; text-align:left; font-family:var(--font-mono); font-size:9px; color:var(--text-tertiary); letter-spacing:1px">EFFICIENCY</th>
                     <th style="padding:20px 32px; text-align:left; font-family:var(--font-mono); font-size:9px; color:var(--text-tertiary); letter-spacing:1px">CLEARANCE</th>
                     <th style="padding:20px 32px; text-align:right; font-family:var(--font-mono); font-size:9px; color:var(--text-tertiary); letter-spacing:1px">ACTIONS</th>
                  </tr>
               </thead>
               <tbody>
                  ${workload.length === 0 ? `<tr><td colspan="6" style="padding:100px; text-align:center; color:var(--text-tertiary)">NO REGISTERED PERSONNEL IN LOCAL NODE.</td></tr>` : ''}
                  ${workload.map(m => renderMemberRow(m)).join('')}
               </tbody>
            </table>
         </div>
      </div>

      <!-- Tactical Visual Load -->
      <div style="display:grid; grid-template-columns: 2fr 1fr; gap:32px; margin-top:40px">
         
         <div class="card-quartz" style="padding:32px">
            <div style="font-family:'Outfit', sans-serif; font-weight:800; font-size:1.1rem; color:white; margin-bottom:32px">Strategic Distribution Chart</div>
            <div style="height:300px; display:flex; align-items:flex-end; gap:32px; justify-content:space-around; padding:0 40px">
               ${workload.map(m => `
                  <div style="flex:1; display:flex; flex-direction:column; align-items:center; gap:20px">
                     <div style="width:40px; border-radius:8px 8px 4px 4px; background:var(--gradient-brand); height:${Math.max(5, (m.activeProjects / (totalProjects || 1)) * 250)}px; transition:height 1s cubic-bezier(0.34, 1.56, 0.64, 1); box-shadow:var(--shadow-sapphire); position:relative">
                        <div style="position:absolute; top:-30px; left:50%; transform:translateX(-50%); font-family:var(--font-mono); font-size:9px; font-weight:800; color:var(--brand-300)">${m.activeProjects || 0}</div>
                     </div>
                     <div style="font-family:var(--font-mono); font-size:8px; font-weight:800; color:var(--text-tertiary); text-align:center; text-transform:uppercase; letter-spacing:1px">${m.full_name?.split(' ')[0]}</div>
                  </div>
               `).join('')}
            </div>
         </div>

         <div class="card-quartz" style="padding:32px">
            <div style="font-family:'Outfit', sans-serif; font-weight:800; font-size:1.1rem; color:white; margin-bottom:24px">Availability Overwatch</div>
            <div style="display:flex; flex-direction:column; gap:16px">
               ${members.map(m => `
                  <div style="display:flex; align-items:center; justify-content:space-between; padding:16px; background:hsla(220, 20%, 100%, 0.02); border-radius:12px; border:1px solid hsla(220, 20%, 100%, 0.05)">
                     <div style="display:flex; align-items:center; gap:12px">
                        <div class="animate-pulse" style="width:8px; height:8px; border-radius:50%; background:${m.status === 'Active' ? 'var(--success-500)' : 'var(--gold-500)'}"></div>
                        <span style="font-family:'Outfit', sans-serif; font-weight:700; font-size:0.9rem; color:white">${m.full_name}</span>
                     </div>
                     <span style="font-family:var(--font-mono); font-size:8px; color:var(--text-tertiary); letter-spacing:1px">${m.role?.toUpperCase()}</span>
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
    <tr style="border-bottom:1px solid hsla(220, 20%, 100%, 0.03); transition:background 0.2s" onmouseover="this.style.background='hsla(220, 20%, 100%, 0.02)'" onmouseout="this.style.background='transparent'">
      <td style="padding:20px 32px">
         <div style="display:flex; align-items:center; gap:16px">
            <div style="width:40px; height:40px; border-radius:12px; background:var(--gradient-dark); border:1px solid hsla(220, 20%, 100%, 0.1); display:flex; align-items:center; justify-content:center; color:white; font-size:1.1rem; font-weight:800">
               ${m.avatar_url ? `<img src="${m.avatar_url}" style="width:100%; height:100%; border-radius:12px">` : m.full_name?.charAt(0) || 'U'}
            </div>
            <div>
               <div style="font-family:'Outfit', sans-serif; font-weight:800; font-size:1rem; color:white">${m.full_name}</div>
               <div style="font-family:var(--font-mono); font-size:8px; color:var(--text-tertiary); letter-spacing:1px">UID: ${m.id?.substring(0,8).toUpperCase()}</div>
            </div>
         </div>
      </td>
      <td style="padding:20px 32px">
         <span class="badge" style="background:hsla(45, 90%, 60%, 0.1); color:var(--gold-400); border:1px solid hsla(45, 90%, 60%, 0.2); font-size:9px; font-weight:800; letter-spacing:1px">${m.role?.toUpperCase() || 'PENGKAJI'}</span>
      </td>
      <td style="padding:20px 32px">
         <div style="font-family:'Outfit', sans-serif; font-weight:800; font-size:1.1rem; color:var(--brand-400)">${m.activeProjects || 0} <span style="font-size:0.7rem; color:var(--text-tertiary); font-weight:500; font-family:var(--font-mono)">ACTIVE</span></div>
      </td>
      <td style="padding:20px 32px">
         <div style="width:140px">
            <div style="display:flex; justify-content:space-between; margin-bottom:8px">
               <span style="font-family:var(--font-mono); font-size:9px; font-weight:800; color:white">${m.avgProgress || 0}%</span>
            </div>
            <div style="height:4px; background:hsla(220, 20%, 100%, 0.05); border-radius:10px; overflow:hidden">
               <div style="width:${m.avgProgress || 0}%; height:100%; background:var(--gradient-brand); border-radius:10px"></div>
            </div>
         </div>
      </td>
      <td style="padding:20px 32px">
         <div style="display:flex; align-items:center; gap:8px; font-family:var(--font-mono); font-size:9px; font-weight:800; color:${m.status === 'Active' ? 'var(--success-400)' : 'var(--gold-400)'}">
            <div style="width:6px; height:6px; border-radius:50%; background:currentColor"></div>
            ${m.status?.toUpperCase() || 'ACTIVE'}
         </div>
      </td>
      <td style="padding:20px 32px; text-align:right">
         <div style="display:flex; gap:8px; justify-content:flex-end">
            <button class="btn btn-icon" onclick="window.navigate('proyek', {PIC: '${m.id}'})" style="width:36px; height:36px; border-radius:10px; color:var(--brand-300); border-color:hsla(220, 20%, 100%, 0.05)">
               <i class="fas fa-folder-tree"></i>
            </button>
            ${isAdmin() ? `
               <button class="btn btn-icon" onclick="window._showEditMemberModal('${m.id}')" style="width:36px; height:36px; border-radius:10px; color:white; border-color:hsla(220, 20%, 100%, 0.05)">
                  <i class="fas fa-user-pen"></i>
               </button>
               <button class="btn btn-icon" onclick="window._deleteMember('${m.id}', '${m.full_name}')" style="width:36px; height:36px; border-radius:10px; color:var(--danger-400); border-color:hsla(0, 85%, 60%, 0.1)">
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
      showError('Registry failure: ' + err.message);
    }
  };

  window._deleteMember = async (id, name) => {
    const ok = await confirm({
      title: 'Remove Authorized Personnel',
      message: `De-authorize <strong>${name}</strong>? This action will revoke all registry access and re-route active delegations.`,
      confirmText: 'DE-AUTHORIZE',
      danger: true
    });
    if (!ok) return;

    try {
      await deleteProfile(id);
      showSuccess(`Agent ${name} purged from consortium.`);
      timKerjaPage();
    } catch (err) {
      showError('Purge failure: ' + err.message);
    }
  };
}

function renderMemberModal(member = null) {
  const isEdit = !!member;
  const roles = Object.entries(APP_CONFIG.roles);
  
  const modalHtml = `
    <div id="member-modal-overlay" style="position:fixed; inset:0; background:rgba(0,0,0,0.8); backdrop-filter:blur(15px); z-index:9999; display:flex; align-items:center; justify-content:center; padding:20px; animation: fade-in 0.3s ease;">
      <div class="card-quartz" style="width:100%; max-width:480px; padding:40px; animation: modal-up 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:32px">
          <h3 style="font-family:'Outfit', sans-serif; font-weight:800; font-size:1.4rem; color:white; margin:0">
            ${isEdit ? 'Update Personnel Registry' : 'New Agent Induction'}
          </h3>
          <button onclick="document.getElementById('member-modal-overlay').remove()" style="background:transparent; border:none; color:var(--text-tertiary); cursor:pointer; font-size:1.2rem">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <form id="member-form" style="display:flex; flex-direction:column; gap:24px;">
          <div class="form-group">
            <label class="form-label">LEGAL NAME & CERTS</label>
            <input type="text" name="full_name" class="form-input" placeholder="e.g. Ir. Budi Santoso, M.T." required value="${member?.full_name || ''}">
          </div>
          
          <div class="form-group">
            <label class="form-label">OFFICIAL ENCRYPTED EMAIL</label>
            <input type="email" name="email" class="form-input" placeholder="Masukkan email resmi agent..." required value="${member?.email || ''}" ${isEdit ? 'readonly' : ''}>
          </div>

          <div class="form-group">
            <label class="form-label">TEMPORARY ACCESS PASSWORD</label>
            <input type="password" name="password" class="form-input" placeholder="••••••••" value="${isEdit ? '' : '@skpslf123'}" ${isEdit ? 'disabled placeholder="Stored in Auth Module"' : 'required'}>
            <p style="font-family:var(--font-mono); font-size:8px; color:var(--text-tertiary); margin-top:8px">
              <i class="fas fa-info-circle"></i> NOTE: This password is used for the Auth account setup.
            </p>
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px;">
            <div class="form-group">
              <label class="form-label">ASSIGNED ROLE</label>
              <select name="role" class="form-select" required>
                ${roles.map(([val, label]) => `<option value="${label}" ${member?.role === label ? 'selected' : ''}>${label.toUpperCase()}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">STATUS</label>
              <select name="status" class="form-select">
                <option value="Active" ${member?.status === 'Active' ? 'selected' : ''}>ACTIVE / READY</option>
                <option value="Away" ${member?.status === 'Away' ? 'selected' : ''}>LEAVE / INACTIVE</option>
                <option value="Busy" ${member?.status === 'Busy' ? 'selected' : ''}>ON FIELD AUDIT</option>
              </select>
            </div>
          </div>

          <div style="margin-top:24px; display:flex; gap:16px; justify-content:flex-end">
             <button type="button" onclick="document.getElementById('member-modal-overlay').remove()" class="btn btn-ghost" style="color:var(--text-tertiary)">CANCEL</button>
             <button type="submit" class="btn-presidential gold" id="btn-save-member" style="height:48px; border-radius:12px; padding:0 32px">
              <i class="fas fa-shield-check" style="margin-right:12px"></i> AUTHORIZE AGENT
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHtml);

  document.getElementById('member-form').onsubmit = async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn-save-member');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> INDUCTING...';

    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    try {
      if (isEdit) {
        await updateProfile(member.id, data);
        showSuccess('Registry updated.');
      } else {
        await createProfile(data);
        showSuccess('New agent inducted. Opening Supabase Auth setup...');
        
        // Buka dashboard Supabase SEGERA di tab baru
        window.open('https://supabase.com/dashboard/project/hrzplcqeadhvbrfhlfuh/auth/users', '_blank');
      }
      document.getElementById('member-modal-overlay').remove();
      timKerjaPage();
    } catch (err) {
      showError('Induction failure: ' + err.message);
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-shield-check"></i> AUTHORIZE AGENT';
    }
  };
}

function renderSkeleton() {
  return `
    <div style="margin-bottom:40px"><div class="card-quartz" style="height:100px"></div></div>
    <div style="display:grid; grid-template-columns: repeat(4, 1fr); gap:24px; margin-bottom:40px">
       ${Array(4).fill(0).map(()=>`<div class="card-quartz" style="height:110px"></div>`).join('')}
    </div>
    <div class="card-quartz" style="height:500px"></div>
  `;
}
