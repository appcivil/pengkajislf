// ============================================================
//  TODO DETAIL PAGE
//  Detail dari satu task beserta log dan komentar
// ============================================================
import { supabase } from '../lib/supabase.js';
import { navigate } from '../lib/router.js';

export async function todoDetailPage(params = {}) {
  const id = params.id;
  if (!id) { navigate('todo'); return ''; }

  const root = document.getElementById('page-root');
  if (root) root.innerHTML = renderSkeleton();

  const task = await fetchTask(id);
  if (!task) { navigate('todo'); return ''; }

  const html = buildHtml(task);
  if (root) root.innerHTML = html;
  return html;
}

function buildHtml(task) {
  const statusLabel = {
    'todo': { l: 'To Do', c: 'hsl(220,10%,50%)' },
    'in_progress': { l: 'In Progress', c: 'hsl(40,80%,55%)' },
    'review': { l: 'Review', c: 'hsl(258,80%,60%)' },
    'done': { l: 'Done', c: 'hsl(160,65%,46%)' },
  }[task.status || 'todo'];

  return `
    <div id="todo-detail">
      <div class="page-header">
        <button class="btn btn-ghost btn-sm" onclick="window.navigate('todo')" style="margin-bottom:8px">
          <i class="fas fa-arrow-left"></i> Kembali ke Kanban
        </button>
        <div class="flex-between">
          <div>
            <div class="text-sm text-tertiary" style="margin-bottom:4px">
              ID Task: ${task.id} • ${new Date(task.created_at || Date.now()).toLocaleDateString('id-ID')}
            </div>
            <h1 class="page-title">${escHtml(task.judul || task.title)}</h1>
          </div>
          <div class="flex gap-3">
             <span class="badge" style="background:${statusLabel.c}22;color:${statusLabel.c};font-size:0.9rem;border:1px solid ${statusLabel.c}44">
               ${statusLabel.l}
             </span>
             <button class="btn btn-primary" onclick="alert('Simpan form...')"><i class="fas fa-save"></i> Simpan</button>
          </div>
        </div>
      </div>

      <div class="grid-2">
        <!-- Main Form -->
        <div class="card form-grid">
          <div class="card-title" style="grid-column:span 2"><i class="fas fa-info-circle"></i> Info Task</div>
          
          <div class="form-group" style="grid-column:span 2">
             <label class="form-label">Deskripsi & Catatan</label>
             <textarea class="form-control" rows="5" placeholder="Tuliskan detail pekerjaan...">${escHtml(task.deskripsi || '')}</textarea>
          </div>

          <div class="form-group">
            <label class="form-label">Prioritas</label>
             <select class="form-control" id="td-prio">
               <option value="low" ${task.priority==='low'?'selected':''}>Low</option>
               <option value="medium" ${task.priority==='medium'?'selected':''}>Medium</option>
               <option value="high" ${task.priority==='high'?'selected':''}>High</option>
               <option value="critical" ${task.priority==='critical'?'selected':''}>Critical</option>
             </select>
          </div>
          <div class="form-group">
            <label class="form-label">Tenggat Waktu / Due Date</label>
            <input type="date" class="form-control" value="${task.due_date ? task.due_date.substring(0,10) : ''}">
          </div>

          <div class="form-group" style="grid-column:span 2">
            <label class="form-label">Bukti Penyelesaian (Lampiran)</label>
            <div style="border:2px dashed var(--border-default);border-radius:var(--radius-md);padding:var(--space-5);text-align:center;color:var(--text-tertiary)">
              <i class="fas fa-cloud-upload-alt" style="font-size:2rem;margin-bottom:8px"></i>
              <div>Drag & Drop file lampiran dokumentasi ke sini</div>
              <button class="btn btn-secondary btn-sm" style="margin-top:var(--space-3)">Pilih File</button>
            </div>
          </div>
        </div>

        <!-- Sidebar / Activity -->
        <div style="display:flex;flex-direction:column;gap:var(--space-4)">
          <div class="card">
            <div class="card-title">Atribut</div>
            <div class="form-group" style="margin-top:var(--space-3)">
              <label class="form-label">Terkait Proyek SLF</label>
              <div class="form-control" style="background:var(--bg-elevated);pointer-events:none">
                <i class="fas fa-building text-brand"></i> ${escHtml(task.proyek_nama || 'Tidak ada/Pusat')}
              </div>
            </div>
            <div class="form-group">
               <label class="form-label">Ditugaskan Kepada</label>
               <div style="display:flex;align-items:center;gap:12px;padding:8px 12px;border:1px solid var(--border-default);border-radius:var(--radius-sm)">
                 <div style="width:32px;height:32px;border-radius:50%;background:var(--bg-elevated);display:flex;align-items:center;justify-content:center"><i class="fas fa-user"></i></div>
                 <div>
                   <div style="font-size:0.875rem;font-weight:600">Admin Pemeliharaan</div>
                   <div style="font-size:0.75rem;color:var(--text-tertiary)">admin@pengkaji-slf.go.id</div>
                 </div>
               </div>
            </div>
          </div>

          <div class="card" style="flex:1">
            <div class="card-title"><i class="fas fa-history"></i> Log Aktivitas</div>
            <div style="margin-top:var(--space-4);display:flex;flex-direction:column;gap:var(--space-4)">
              <div style="display:flex;gap:12px">
                <div style="width:12px;height:12px;border-radius:50%;background:var(--success-400);margin-top:4px"></div>
                <div>
                  <div class="text-sm"><b>Admin</b> membuat task ini.</div>
                  <div class="text-xs text-tertiary">${new Date().toLocaleString()}</div>
                </div>
              </div>
            </div>
            <div style="margin-top:var(--space-5);border-top:1px solid var(--border-subtle);padding-top:var(--space-3);display:flex;gap:var(--space-2)">
              <input type="text" class="form-control" placeholder="Tulis komentar/update log...">
              <button class="btn btn-primary"><i class="fas fa-paper-plane"></i></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Fallback logic
async function fetchTask(id) {
  try {
    const { data } = await supabase.from('todo_tasks').select('*').eq('id', id).maybeSingle();
    if (data) return data;
  } catch (e) {
    // If table doesn't exist, fallback mock
  }
  return { id, title: 'Mock Task #'+id, priority: 'critical', deskripsi: 'Analisis mendalam terhadap struktur bangunan gedung untuk menemukan keretakan mikroskopis di kolom utama. Harap tinjau lampiran PDF inspeksi sebelumnya.', created_at: new Date().toISOString() };
}

function renderSkeleton() {
  return `<div class="skeleton" style="height:60px;margin-bottom:20px;width:30%"></div>
          <div class="grid-2">
            <div class="skeleton" style="height:600px;border-radius:12px"></div>
            <div class="skeleton" style="height:400px;border-radius:12px"></div>
          </div>`;
}
function escHtml(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
