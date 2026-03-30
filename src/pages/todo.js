// ============================================================
//  TODO (KANBAN) PAGE
//  Manajemen task temuan/rekomendasi SLF
// ============================================================
import { supabase } from '../lib/supabase.js';
import { navigate } from '../lib/router.js';
import { showSuccess, showError } from '../components/toast.js';

export async function todoPage() {
  const root = document.getElementById('page-root');
  if (root) root.innerHTML = renderSkeleton();

  const tasks = await fetchTasks();
  
  const html = buildHtml(tasks);
  if (root) {
    root.innerHTML = html;
    initKanban();
  }
  return html;
}

function buildHtml(tasks) {
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
            <h1 class="page-title">Task Management</h1>
            <p class="page-subtitle">Papan Kanban pemantauan tindak lanjut rekomendasi SLF</p>
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
      <div class="modal-overlay" id="modal-task">
        <div class="modal">
          <div class="modal-header">
            <div class="modal-title">Tambah Task Baru</div>
            <button class="modal-close" onclick="document.getElementById('modal-task').classList.remove('open')">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="modal-body form-grid">
            <div class="form-group" style="grid-column: span 2">
              <label class="form-label">Judul Task</label>
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
              <label class="form-label">Batas Waktu</label>
              <input type="date" id="nt-date" class="form-control">
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
  return `
    <div class="task-card" draggable="true" data-id="${t.id}" onclick="window.navigate('todo-detail',{id:'${t.id}'})">
      <div class="tc-header">
        <div class="tc-prio ${t.priority || 'medium'}">${t.priority || 'medium'}</div>
        <div class="tc-proyek"><i class="fas fa-building"></i> ${escHtml(t.proyek_nama || 'General')}</div>
      </div>
      <div class="tc-title">${escHtml(t.judul || t.title || 'Untitled Task')}</div>
      <div class="tc-footer">
        <div><i class="fas fa-clock"></i> ${t.due_date ? new Date(t.due_date).toLocaleDateString() : 'No date'}</div>
        <div style="background:var(--bg-elevated);width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:1px solid var(--border-subtle)"><i class="fas fa-user" style="font-size:0.6rem"></i></div>
      </div>
    </div>
  `;
}

function initKanban() {
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
        // background update
        await supabase.from('todo_tasks').update({ status: newStatus }).eq('id', taskId);
      }
    });
  });

  window._showNewTaskModal = () => document.getElementById('modal-task').classList.add('open');
  window._saveNewTask = async () => {
    const judul = document.getElementById('nt-judul').value;
    const prio = document.getElementById('nt-prio').value;
    const date = document.getElementById('nt-date').value;
    if(!judul) return showError('Judul wajib diisi');
    
    // Optimistic insert (mock as no valid schema defined clearly, assuming table exists)
    try {
      const user = window.getUserInfo ? window.getUserInfo() : null;
      const { data, error } = await supabase.from('todo_tasks').insert([{
        judul, 
        title: judul, 
        priority: prio, 
        due_date: date || null, 
        status: 'todo',
        user_id: user?.id || null
      }]).select().maybeSingle();
      if(error) throw error;
      document.getElementById('modal-task').classList.remove('open');
      showSuccess('Task ditambahkan!');
      todoPage(); // reload
    } catch (e) {
      if(e.message.includes('relation "todo_tasks" does not exist')) {
        showError('Tabel todo_tasks belum dibuat di Supabase.');
      } else {
        showError(e.message);
      }
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

// Mock fallback logic if table doesn't exist
async function fetchTasks() {
  try {
    const { data } = await supabase.from('todo_tasks').select('*').order('created_at', { ascending: false });
    return data || [];
  } catch {
    // Return sample local data if remote fails (for demo purposes)
    return [
      { id:'1', title:'Perbaikan Retak Kolom K1', priority:'critical', status:'todo', due_date:'2026-04-10', proyek_nama:'Gedung Sate' },
      { id:'2', title:'Pengisian Ulang APAR', priority:'medium', status:'todo', due_date:'2026-04-05', proyek_nama:'Mall Pusat' },
      { id:'3', title:'Review IMB As-Built', priority:'high', status:'in_progress', due_date:'2026-03-30', proyek_nama:'Puskesmas C' },
      { id:'4', title:'Instalasi Grounding', priority:'high', status:'review', proyek_nama:'Gedung Sate' },
      { id:'5', title:'Pembersihan Saluran', priority:'low', status:'done', proyek_nama:'Mall Pusat' }
    ];
  }
}

function renderSkeleton() {
  return `<div class="page-header"><div class="skeleton" style="height:36px;width:300px"></div></div>
          <div class="kanban-board">
            ${Array(4).fill(0).map(()=>`<div class="skeleton" style="flex:0 0 320px;height:600px;border-radius:var(--radius-lg)"></div>`).join('')}
          </div>`;
}

function escHtml(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
