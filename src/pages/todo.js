// ============================================================
//  TODO (KANBAN) PAGE
//  Manajemen task temuan/rekomendasi SLF
// ============================================================
import { supabase } from '../lib/supabase.js';
import { navigate } from '../lib/router.js';
import { showSuccess, showError } from '../components/toast.js';

export async function todoPage(params = {}) {
  const proyekId = params.proyekId;
  const root = document.getElementById('page-root');
  if (root) root.innerHTML = renderSkeleton();

  const [tasks, proyek] = await Promise.all([
    fetchTasks(proyekId),
    proyekId ? fetchProyek(proyekId) : Promise.resolve(null)
  ]);
  
  const html = buildHtml(tasks, proyek);
  if (root) {
    root.innerHTML = html;
    initKanban(proyekId);
  }
  return html;
}

function buildHtml(tasks, proyek) {
  const cols = [
    { id: 'todo', label: 'To Do', color: 'hsl(220,10%,50%)' },
    { id: 'in_progress', label: 'In Progress', color: 'hsl(40,80%,55%)' },
    { id: 'review', label: 'Review', color: 'hsl(258,80%,60%)' },
    { id: 'done', label: 'Done', color: 'hsl(160,65%,46%)' }
  ];

  return `
    <div id="todo-page">
      <div class="page-header">
        <div class="flex-between">
          <div>
            <button class="btn btn-ghost btn-sm" onclick="window.navigate('proyek-detail',{id:'${proyek?.id || ''}'})" style="margin-bottom:8px">
              <i class="fas fa-arrow-left"></i> Kembali ke Proyek
            </button>
            <h1 class="page-title">Task & Tindak Lanjut</h1>
            <p class="page-subtitle">${proyek ? `Monitoring perbaikan untuk <strong>${escHtml(proyek.nama_bangunan)}</strong>` : 'Papan Kanban pemantauan rekomendasi SLF'}</p>
          </div>
          <button class="btn btn-primary" onclick="window._showNewTaskModal()">
            <i class="fas fa-plus"></i> Task Baru
          </button>
        </div>
      </div>

      <div class="kanban-board">
        ${cols.map(col => {
          const colTasks = tasks.filter(t => (t.status || 'todo') === col.id);
          return `
            <div class="kanban-col" data-status="${col.id}">
              <div class="kanban-col-header" style="border-top: 3px solid ${col.color}">
                <div class="kch-title">
                  <div style="width:10px;height:10px;border-radius:50%;background:${col.color}"></div>
                  ${col.label}
                </div>
                <div class="kch-count" id="count-${col.id}">${colTasks.length}</div>
              </div>
              <div class="kanban-col-body" id="col-${col.id}">
                ${colTasks.map(t => renderTaskCard(t)).join('')}
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <!-- Modal Tambah Task -->
      <div class="modal-overlay" id="modal-task" style="z-index: 10002">
        <div class="modal">
          <div class="modal-header">
            <div class="modal-title">Tambah Task Baru</div>
            <button class="modal-close" onclick="document.getElementById('modal-task').classList.remove('open')">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="modal-body form-grid">
            <div class="form-group" style="grid-column: span 2">
              <label class="form-label">Judul Task / Temuan</label>
              <input type="text" id="nt-judul" class="form-control" placeholder="Contoh: Perbaikan panel listrik lantai 1">
            </div>
            <div class="form-group">
              <label class="form-label">Prioritas</label>
              <select id="nt-prio" class="form-control">
                <option value="low">Low</option>
                <option value="medium" selected>Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Tenggat Waktu</label>
              <input type="date" id="nt-date" class="form-control">
            </div>
            <div class="form-group" style="grid-column: span 2">
              <label class="form-label">Keterangan Tambahan</label>
              <textarea id="nt-desc" class="form-control" placeholder="Detail temuan atau rekomendasi perbaikan..."></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="document.getElementById('modal-task').classList.remove('open')">Batal</button>
            <button class="btn btn-primary" onclick="window._saveNewTask()">Simpan Task</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderTaskCard(t) {
  const prioLabels = { low: 'Low', medium: 'Medium', high: 'High', critical: 'Critical' };
  return `
    <div class="task-card" draggable="true" data-id="${t.id}">
      <div class="tc-header">
        <div class="tc-prio ${t.priority || 'medium'}">${prioLabels[t.priority] || 'Medium'}</div>
        <div class="tc-proyek"><i class="fas fa-building"></i> ${escHtml(t.proyek_nama || 'General')}</div>
      </div>
      <div class="tc-title" onclick="window.navigate('todo-detail',{id:'${t.id}'})" style="cursor:pointer; font-weight:600; color:var(--text-primary); margin-bottom:8px">
        ${escHtml(t.judul || t.title || 'Untitled Task')}
      </div>
      <div class="tc-footer">
        <div style="font-size:0.7rem; color:var(--text-tertiary)">
          <i class="fas fa-calendar-day"></i> ${t.due_date ? new Date(t.due_date).toLocaleDateString('id-ID') : 'No date'}
        </div>
        <div style="background:var(--bg-elevated);width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:1px solid var(--border-subtle)">
          <i class="fas fa-user" style="font-size:0.6rem; color:var(--text-tertiary)"></i>
        </div>
      </div>
    </div>
  `;
}

function initKanban(proyekId) {
  const cards = document.querySelectorAll('.task-card');
  const columns = document.querySelectorAll('.kanban-col-body');
  let draggedCard = null;

  cards.forEach(card => {
    card.addEventListener('dragstart', () => {
      draggedCard = card;
      setTimeout(() => card.classList.add('dragging'), 0);
    });
    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
      draggedCard = null;
      updateCounts();
    });
  });

  columns.forEach(col => {
    col.addEventListener('dragover', e => {
      e.preventDefault();
      col.classList.add('drag-over');
      const afterElement = getDragAfterElement(col, e.clientY);
      if (afterElement == null) col.appendChild(draggedCard);
      else col.insertBefore(draggedCard, afterElement);
    });
    col.addEventListener('dragleave', () => col.classList.remove('drag-over'));
    col.addEventListener('drop', async (e) => {
      e.preventDefault();
      col.classList.remove('drag-over');
      if (draggedCard) {
        const taskId = draggedCard.dataset.id;
        const newStatus = col.parentElement.dataset.status;
        try {
          await supabase.from('todo_tasks').update({ status: newStatus }).eq('id', taskId);
        } catch (err) {
          showError('Gagal update status: ' + err.message);
        }
      }
    });
  });

  window._showNewTaskModal = () => {
    const modal = document.getElementById('modal-task');
    if (modal) modal.classList.add('open');
  };

  window._saveNewTask = async () => {
    const judul = document.getElementById('nt-judul').value;
    const prio = document.getElementById('nt-prio').value;
    const date = document.getElementById('nt-date').value;
    const desc = document.getElementById('nt-desc').value;
    
    if(!judul) return showError('Judul wajib diisi');
    
    try {
      const { error } = await supabase.from('todo_tasks').insert([{
        proyek_id: proyekId,
        judul: judul, 
        priority: prio, 
        due_date: date || null, 
        description: desc || '',
        status: 'todo',
        proyek_nama: document.querySelector('.page-subtitle strong')?.innerText || 'General'
      }]);
      
      if(error) throw error;
      
      document.getElementById('modal-task').classList.remove('open');
      showSuccess('Task berhasil ditambahkan!');
      todoPage({ proyekId }); // reload
    } catch (e) {
      showError('Gagal menyimpan task: ' + e.message);
    }
  };
}

function getDragAfterElement(container, y) {
  const draggableElements = [...container.querySelectorAll('.task-card:not(.dragging)')];
  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) return { offset: offset, element: child };
    else return closest;
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function updateCounts() {
  ['todo', 'in_progress', 'review', 'done'].forEach(id => {
    const col = document.getElementById(`col-${id}`);
    const count = document.getElementById(`count-${id}`);
    if (col && count) count.textContent = col.children.length;
  });
}

async function fetchProyek(id) {
  const { data } = await supabase.from('proyek').select('*').eq('id', id).maybeSingle();
  return data;
}

async function fetchTasks(proyekId) {
  try {
    let query = supabase.from('todo_tasks').select('*').order('created_at', { ascending: false });
    if (proyekId) query = query.eq('proyek_id', proyekId);
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.warn('[Todo] Fetch failed, using fallback.', err.message);
    return [];
  }
}

function renderSkeleton() {
  return `
    <div class="page-header">
      <div class="skeleton" style="height:20px;width:150px;margin-bottom:8px"></div>
      <div class="skeleton" style="height:36px;width:300px;margin-bottom:4px"></div>
      <div class="skeleton" style="height:20px;width:200px"></div>
    </div>
    <div class="kanban-board">
      ${Array(4).fill(0).map(()=>`<div class="skeleton" style="flex:0 0 320px;height:600px;border-radius:var(--radius-lg)"></div>`).join('')}
    </div>
  `;
}

function escHtml(s) { 
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); 
}
