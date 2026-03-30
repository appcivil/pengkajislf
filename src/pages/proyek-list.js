// ============================================================
//  PROYEK LIST PAGE
// ============================================================
import { supabase } from '../lib/supabase.js';
import { navigate } from '../lib/router.js';
import { confirm } from '../components/modal.js';
import { showSuccess, showError } from '../components/toast.js';

export async function proyekListPage() {
  return `
    <div id="proyek-list-page">
      <div class="page-header flex-between">
        <div>
          <h1 class="page-title">Daftar Proyek SLF</h1>
          <p class="page-subtitle">Kelola seluruh proyek pengkajian Sertifikat Laik Fungsi</p>
        </div>
        <div class="flex gap-3">
          <button class="btn btn-secondary" onclick="exportProyek()">
            <i class="fas fa-file-export"></i> Export
          </button>
          <button class="btn btn-primary" onclick="window.navigate('proyek-baru')">
            <i class="fas fa-plus"></i> Proyek Baru
          </button>
        </div>
      </div>

      <!-- Filters (Responsive Grid) -->
      <div class="card" style="padding:var(--space-4);margin-bottom:var(--space-5)">
        <div class="grid-main-responsive" style="align-items:center; grid-template-columns: 1fr auto auto auto;">
          <div style="position:relative">
            <i class="fas fa-search" style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--text-tertiary);font-size:0.8rem"></i>
            <input type="text" id="search-proyek" class="form-input" placeholder="Cari gedung/pemilik..."
                   style="padding-left:36px" oninput="filterProyek(this.value)" />
          </div>
          <select class="form-select" id="filter-status" onchange="filterProyek()" style="min-width:140px">
            <option value="">Status</option>
            <option value="DALAM_PENGKAJIAN">Proses</option>
            <option value="LAIK_FUNGSI">Laik</option>
            <option value="LAIK_FUNGSI_BERSYARAT">Bersyarat</option>
            <option value="TIDAK_LAIK_FUNGSI">Tidak Laik</option>
          </select>
          <select class="form-select" id="filter-sort" onchange="sortProyek(this.value)" style="min-width:120px">
            <option value="updated_at">Terbaru</option>
            <option value="nama_bangunan">A-Z</option>
          </select>
          <div id="proyek-count" class="text-xs text-tertiary" style="white-space:nowrap"></div>
        </div>
      </div>

      <!-- Loading -->
      <div id="proyek-loading">
        ${Array(5).fill(0).map(() => `
          <div class="card" style="margin-bottom:12px;display:flex;gap:16px;padding:20px">
            <div class="skeleton" style="width:48px;height:48px;border-radius:10px;flex-shrink:0"></div>
            <div style="flex:1">
              <div class="skeleton" style="height:20px;width:60%;margin-bottom:8px"></div>
              <div class="skeleton" style="height:16px;width:40%"></div>
            </div>
          </div>
        `).join('')}
      </div>

      <!-- Proyek Cards -->
      <div id="proyek-list-container"></div>
    </div>
  `;
}

// Called after render
export async function afterProyekListRender() {
  await loadProyek();
}

let _allProyek = [];

async function loadProyek() {
  try {
    const { data, error } = await supabase
      .from('proyek')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) throw error;
    _allProyek = data || [];
    renderProyekCards(_allProyek);
  } catch (err) {
    showError('Gagal memuat data proyek: ' + err.message);
    document.getElementById('proyek-loading').innerHTML = `
      <div class="empty-state">
        <div class="empty-icon"><i class="fas fa-triangle-exclamation"></i></div>
        <p class="empty-title">Gagal memuat proyek</p>
        <p class="empty-desc">${err.message}</p>
        <button class="btn btn-secondary mt-4" onclick="location.reload()">Coba Lagi</button>
      </div>
    `;
  }
}

function renderProyekCards(proyek) {
  const loading = document.getElementById('proyek-loading');
  const container = document.getElementById('proyek-list-container');
  const countEl = document.getElementById('proyek-count');

  if (loading) loading.style.display = 'none';
  if (countEl) countEl.textContent = `${proyek.length} proyek`;

  if (!container) return;

  if (!proyek.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon"><i class="fas fa-folder-open"></i></div>
        <h3 class="empty-title">Belum ada proyek</h3>
        <p class="empty-desc">Mulai dengan membuat proyek SLF pertama Anda.</p>
        <button class="btn btn-primary mt-4" onclick="window.navigate('proyek-baru')">
          <i class="fas fa-plus"></i> Buat Proyek Pertama
        </button>
      </div>
    `;
    return;
  }

  const statusMap = {
    LAIK_FUNGSI:           { label: 'Laik Fungsi',      cls: 'badge-laik',       icon: 'fa-circle-check' },
    LAIK_FUNGSI_BERSYARAT: { label: 'Laik Bersyarat',   cls: 'badge-bersyarat',  icon: 'fa-triangle-exclamation' },
    TIDAK_LAIK_FUNGSI:     { label: 'Tidak Laik',       cls: 'badge-tidak-laik', icon: 'fa-circle-xmark' },
    DALAM_PENGKAJIAN:      { label: 'Dalam Pengkajian', cls: 'badge-proses',     icon: 'fa-clock' },
  };

  container.innerHTML = proyek.map(p => {
    const s    = statusMap[p.status_slf] || { label: p.status_slf || '-', cls: 'badge-proses', icon: 'fa-circle' };
    const prog = p.progress || 0;
    const date = p.updated_at ? new Date(p.updated_at).toLocaleDateString('id-ID') : '-';

    return `
      <div class="card" style="margin-bottom:12px;cursor:pointer;display:flex;gap:var(--space-4);align-items:center;flex-wrap:wrap"
           onclick="window.navigate('proyek-detail', {id:'${p.id}'})"
           onmouseenter="this.style.transform='translateY(-1px)';this.style.borderColor='var(--border-brand)'"
           onmouseleave="this.style.transform='';this.style.borderColor=''">

        <!-- Icon (Hidden on very small mobile) -->
        <div class="hide-mobile" style="width:48px;height:48px;border-radius:var(--radius-lg);background:var(--gradient-brand);display:flex;align-items:center;justify-content:center;color:white;font-size:1.1rem;flex-shrink:0">
          <i class="fas fa-building"></i>
        </div>

        <!-- Info -->
        <div style="flex:1;overflow:hidden">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">
            <h3 class="font-semibold text-primary" style="font-size:0.95rem">${p.nama_bangunan || 'Tanpa Nama'}</h3>
            <span class="badge ${s.cls}">
              <i class="fas ${s.icon}"></i> ${s.label}
            </span>
          </div>
          <div class="text-xs text-tertiary" style="margin-bottom:8px">
            <i class="fas fa-location-dot" style="margin-right:4px;color:var(--brand-400)"></i>${p.alamat || '-'}
            &bull;
            <i class="fas fa-user" style="margin-left:6px;margin-right:4px;color:var(--brand-400)"></i>${p.pemilik || '-'}
          </div>
          <div style="display:flex;align-items:center;gap:10px">
            <div class="progress-wrap" style="flex:1;max-width:200px">
              <div class="progress-fill ${prog >= 80 ? 'green' : prog >= 40 ? 'blue' : 'yellow'}" style="width:${prog}%"></div>
            </div>
            <span class="text-xs text-tertiary">${prog}%</span>
          </div>
        </div>

        <!-- Meta -->
        <div style="text-align:right;flex-shrink:0">
          <div class="text-xs text-tertiary">${date}</div>
          <div class="text-xs text-brand mt-1">${p.jenis_bangunan || 'Bangunan Gedung'}</div>
        </div>

        <!-- Actions -->
        <div class="flex gap-2" onclick="event.stopPropagation()">
          <button class="btn btn-ghost btn-sm" title="Checklist" onclick="event.stopPropagation();window.navigate('checklist',{id:'${p.id}'})">
            <i class="fas fa-clipboard-check"></i>
          </button>
          <button class="btn btn-ghost btn-sm" title="Analisis AI" onclick="event.stopPropagation();window.navigate('analisis',{id:'${p.id}'})">
            <i class="fas fa-brain"></i>
          </button>
          <button class="btn btn-ghost btn-sm text-danger" title="Hapus" onclick="event.stopPropagation();deleteProyek('${p.id}','${p.nama_bangunan}')">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// Global functions
window.filterProyek = function(q = '') {
  const search  = (q || document.getElementById('search-proyek')?.value || '').toLowerCase();
  const status  = document.getElementById('filter-status')?.value || '';
  const filtered = _allProyek.filter(p => {
    const matchSearch = !search ||
      (p.nama_bangunan || '').toLowerCase().includes(search) ||
      (p.alamat || '').toLowerCase().includes(search) ||
      (p.pemilik || '').toLowerCase().includes(search);
    const matchStatus = !status || p.status_slf === status;
    return matchSearch && matchStatus;
  });
  renderProyekCards(filtered);
};

window.sortProyek = function(field) {
  const sorted = [..._allProyek].sort((a, b) => {
    if (field === 'nama_bangunan') return (a.nama_bangunan || '').localeCompare(b.nama_bangunan || '');
    if (field === 'status_slf')    return (a.status_slf || '').localeCompare(b.status_slf || '');
    return new Date(b.updated_at) - new Date(a.updated_at);
  });
  renderProyekCards(sorted);
};

window.deleteProyek = async function(id, name) {
  const ok = await confirm({
    title: 'Hapus Proyek',
    message: `Yakin ingin menghapus proyek <strong>${name}</strong>? Semua data terkait akan ikut terhapus.`,
    confirmText: 'Hapus Permanen',
    danger: true,
  });
  if (!ok) return;
  try {
    const { error } = await supabase.from('proyek').delete().eq('id', id);
    if (error) throw error;
    _allProyek = _allProyek.filter(p => p.id !== id);
    renderProyekCards(_allProyek);
    showSuccess('Proyek berhasil dihapus.');
  } catch (err) {
    showError('Gagal menghapus proyek: ' + err.message);
  }
};

window.exportProyek = function() {
  if (!_allProyek.length) return;
  const csv = [
    'ID,Nama Bangunan,Alamat,Pemilik,Status SLF,Progress,Tanggal Update',
    ..._allProyek.map(p => [
      p.id, `"${p.nama_bangunan}"`, `"${p.alamat}"`, `"${p.pemilik}"`,
      p.status_slf, p.progress, p.updated_at
    ].join(','))
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = `proyek-slf-${Date.now()}.csv`; a.click();
  URL.revokeObjectURL(url);
};
