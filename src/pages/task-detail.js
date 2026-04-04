import { supabase } from '../lib/supabase.js';
import { navigate } from '../lib/router.js';
import { showSuccess, showError } from '../components/toast.js';

/**
 * Task Detail Page - Display comprehensive info for a specific todo_task
 */
export async function taskDetailPage(params = {}) {
  const taskId = params.id;
  if (!taskId) return `<div class="p-8 text-center"><p class="text-tertiary">Invalid Task ID</p></div>`;

  const task = await fetchTask(taskId);
  if (!task) return `
    <div class="p-20 text-center">
      <div style="font-size:3rem; margin-bottom:20px; color:var(--text-tertiary)"><i class="fas fa-search"></i></div>
      <h2 style="color:var(--text-primary)">Task Tidak Ditemukan</h2>
      <p style="color:var(--text-tertiary)">ID tugas ini tidak terdaftar atau sudah dihapus.</p>
      <button class="btn btn-primary mt-8" onclick="window.navigate('dashboard')">Kembali ke Dashboard</button>
    </div>
  `;

  return renderTaskHero(task);
}

export function afterTaskDetailRender(params = {}) {
  // Add any needed JS interactivity here
}

async function fetchTask(id) {
  const { data } = await supabase
    .from('todo_tasks')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  return data;
}

function renderTaskHero(t) {
  const prioColors = {
    critical: 'var(--danger-500)',
    high: 'var(--warning-500)',
    medium: 'var(--brand-500)',
    low: 'var(--success-500)'
  };
  
  const statusLabels = {
    todo: 'BELUM DIKERJAKAN',
    in_progress: 'DALAM PENGERJAAN',
    review: 'MENUNGGU REVIEW',
    done: 'SELESAI'
  };

  const c = prioColors[t.priority] || 'var(--text-tertiary)';

  return `
    <div style="animation: page-fade-in 0.6s ease-out">
      <!-- Breadcrumbs -->
      <div style="display:flex; align-items:center; gap:8px; margin-bottom:32px; font-size:0.75rem; font-family:var(--font-mono); letter-spacing:1px; color:var(--text-tertiary)">
         <span class="clickable" onclick="window.navigate('dashboard')">SYSTEM</span>
         <i class="fas fa-chevron-right" style="font-size:8px"></i>
         <span class="clickable" onclick="window.navigate('todo')">KANBAN</span>
         <i class="fas fa-chevron-right" style="font-size:8px"></i>
         <span style="color:var(--brand-400)">TASK DETAIL</span>
      </div>

      <div class="grid-main-side" style="gap:40px; align-items:flex-start">
         
         <!-- LEFT: Information Base -->
         <div style="display:flex; flex-direction:column; gap:32px">
            
            <!-- Main Content Card -->
            <div class="card-quartz" style="padding:40px">
               <div style="display:flex; align-items:flex-start; gap:24px; margin-bottom:32px">
                  <div style="width:64px; height:64px; border-radius:18px; background:hsla(220, 95%, 52%, 0.1); border:1px solid hsla(220, 95%, 52%, 0.2); display:flex; align-items:center; justify-content:center; flex-shrink:0">
                     <i class="fas fa-list-check" style="font-size:1.6rem; color:var(--brand-400)"></i>
                  </div>
                  <div style="flex:1">
                     <div style="font-family:var(--font-mono); font-size:10px; font-weight:800; color:var(--brand-400); letter-spacing:2px; text-transform:uppercase; margin-bottom:12px">Detail Temuan / Rekomendasi</div>
                     <h1 style="font-family:'Outfit', sans-serif; font-weight:800; font-size:1.8rem; line-height:1.2; color:var(--text-primary)">${esc(t.judul || t.title)}</h1>
                  </div>
               </div>

               <div style="padding:24px; background:hsla(224, 20%, 100%, 0.02); border:1px solid hsla(224, 20%, 100%, 0.05); border-radius:18px; line-height:1.8; color:var(--text-secondary); font-size:0.95rem">
                  ${t.description ? esc(t.description).replace(/\n/g, '<br>') : '<span style="opacity:0.4; font-style:italic">Tidak ada keterangan tambahan.</span>'}
               </div>
            </div>

            <!-- Meta Information Grid -->
            <div class="grid-2-col" style="gap:24px">
               <div class="card-quartz" style="padding:24px">
                  <div style="font-size:0.75rem; color:var(--text-tertiary); margin-bottom:8px">PROYEK TERKAIT</div>
                  <div style="font-weight:700; color:var(--brand-400)">${esc(t.proyek_nama || 'General Task')}</div>
               </div>
               <div class="card-quartz" style="padding:24px">
                  <div style="font-size:0.75rem; color:var(--text-tertiary); margin-bottom:8px">TENGGAT WAKTU</div>
                  <div style="font-weight:700; color:var(--text-primary)">
                    <i class="far fa-calendar-alt" style="margin-right:8px; opacity:0.5"></i>
                    ${t.due_date ? new Date(t.due_date).toLocaleDateString('id-ID', {day:'numeric', month:'long', year:'numeric'}) : 'Tidak Ada'}
                  </div>
               </div>
            </div>

         </div>

         <!-- RIGHT: Control Panel & Status -->
         <div style="display:flex; flex-direction:column; gap:24px; position:sticky; top:24px">
            
            <!-- Status Card -->
            <div class="card-quartz" style="padding:32px; border-left: 4px solid ${c}">
               <div style="font-size:0.7rem; font-weight:800; color:var(--text-tertiary); letter-spacing:1.5px; text-transform:uppercase; margin-bottom:20px">Current Operational Status</div>
               
               <div style="display:flex; flex-direction:column; gap:12px">
                  <div style="padding:16px; border-radius:12px; background:${c}11; border:1px solid ${c}33; display:flex; align-items:center; gap:12px">
                     <div style="width:8px; height:8px; border-radius:50%; background:${c}; box-shadow: 0 0 10px ${c}"></div>
                     <span style="font-family:var(--font-mono); font-size:0.85rem; font-weight:800; color:${c}">${statusLabels[t.status] || 'UNKNOWN'}</span>
                  </div>
                  
                  <div style="padding:16px; border-radius:12px; background:hsla(0,0%,100%,0.03); border:1px solid var(--glass-border); display:flex; flex-direction:column; gap:6px">
                     <div style="font-size:0.65rem; color:var(--text-tertiary)">PRIORITY LEVEL</div>
                     <div style="font-size:0.9rem; font-weight:800; text-transform:uppercase; color:var(--text-primary)">${t.priority}</div>
                  </div>
               </div>

               <div style="margin-top:24px; border-top:1px solid hsla(0,0%,100%,0.05); padding-top:24px; display:flex; flex-direction:column; gap:12px">
                  <button class="btn btn-secondary w-full" onclick="window._changeTaskStatus('${t.id}')">
                    <i class="fas fa-rotate" style="margin-right:8px"></i> Ganti Status
                  </button>
                  <button class="btn btn-ghost w-full" style="color:var(--danger-400)" onclick="window._deleteTask('${t.id}')">
                    <i class="fas fa-trash-can" style="margin-right:8px"></i> Hapus Tugas
                  </button>
               </div>
            </div>

            <!-- Audit Trail (Placeholder for future) -->
            <div style="padding:20px; border-radius:18px; border:1px dashed var(--border-default); text-align:center">
               <div style="font-size:0.7rem; color:var(--text-tertiary); text-transform:uppercase; letter-spacing:1px">Digital ID: ${t.id.slice(0,8)}...</div>
            </div>

         </div>

      </div>
    </div>
  `;
}

// Global actions for this page
window._changeTaskStatus = async (id) => {
  const statuses = ['todo', 'in_progress', 'review', 'done'];
  const labels = ['To Do', 'In Progress', 'Review', 'Done'];
  
  const current = (await supabase.from('todo_tasks').select('status').eq('id', id).single()).data?.status;
  const nextIdx = (statuses.indexOf(current) + 1) % statuses.length;
  
  if (confirm(`Ubah status menjadi "${labels[nextIdx]}"?`)) {
    const { error } = await supabase.from('todo_tasks').update({ status: statuses[nextIdx] }).eq('id', id);
    if (!error) {
      showSuccess(`Status diperbarui ke ${labels[nextIdx]}`);
      window.location.reload();
    } else {
      showError('Gagal memperbarui status.');
    }
  }
};

window._deleteTask = async (id) => {
  if (confirm('Anda yakin ingin menghapus tugas ini secara permanen?')) {
    const { error } = await supabase.from('todo_tasks').delete().eq('id', id);
    if (!error) {
      showSuccess('Tugas berhasil dihapus.');
      navigate('todo');
    } else {
      showError('Gagal menghapus tugas.');
    }
  }
};

function esc(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
