// ============================================================
//  PROYEK LIST PAGE
//  PRESIDENTIAL CLASS (QUARTZ PREMIUM)
// ============================================================
import { supabase } from '../lib/supabase.js';
import { navigate } from '../lib/router.js';
import { confirm } from '../components/modal.js';
import { showSuccess, showError } from '../components/toast.js';

export async function proyekListPage() {
  return `
    <div id="proyek-list-page" style="animation: page-fade-in 0.6s ease-out">
      <div class="page-header flex-between flex-stack" style="margin-bottom: var(--space-8)">
        <div>
          <h1 class="page-title" style="font-family:'Outfit', sans-serif; font-weight:800; font-size: 2.2rem; letter-spacing:-0.02em; margin-bottom:4px">
            Daftar <span class="text-gradient-gold">Proyek SLF</span>
          </h1>
          <p class="page-subtitle" style="font-family:var(--font-mono); font-size: 0.75rem; letter-spacing:1px; opacity:0.6; text-transform:uppercase">
            Portfolio Management &bull; Strategic Assets
          </p>
        </div>
        <div class="flex gap-4 flex-stack">
          <button class="btn btn-outline" onclick="exportProyek()" style="height:44px; padding:0 24px; border-radius:12px; font-weight:700">
            <i class="fas fa-file-export" style="margin-right:8px"></i> Export CSV
          </button>
          <button class="btn-presidential gold" onclick="window.navigate('proyek-baru')" style="height:44px; padding:0 24px; border-radius:12px">
            <i class="fas fa-plus" style="margin-right:8px"></i> Proyek Baru
          </button>
        </div>
      </div>

      <!-- Filters (Quartz Bar) -->
      <div class="card-quartz" style="padding:var(--space-5); margin-bottom:var(--space-8); border: 1px solid var(--border-strong);">
        <div class="flex-between flex-stack" style="gap:24px;">
          <div style="position:relative; flex:1; width:100%">
            <i class="fas fa-magnifying-glass" style="position:absolute; left:16px; top:50%; transform:translateY(-50%); color:var(--brand-400); font-size:0.9rem"></i>
            <input type="text" id="search-proyek" class="form-input" placeholder="Cari gedung, pemilik, atau lokasi..."
                   style="padding-left:48px; background:hsla(220, 20%, 100%, 0.03); border:1px solid hsla(220, 20%, 100%, 0.05); height:48px; border-radius:12px; width:100%" 
                   oninput="filterProyek(this.value)" />
          </div>
          <div class="flex gap-4 flex-stack" style="width:100%">
            <select class="form-select" id="filter-status" onchange="filterProyek()" style="flex:1; min-width:140px; height:48px; background:hsla(220, 20%, 100%, 0.03); border-radius:12px">
              <option value="">Semua Status</option>
              <option value="DALAM_PENGKAJIAN">Dalam Proses</option>
              <option value="LAIK_FUNGSI">Laik Fungsi</option>
              <option value="LAIK_FUNGSI_BERSYARAT">Laik Bersyarat</option>
              <option value="TIDAK_LAIK_FUNGSI">Tidak Laik</option>
            </select>
            <select class="form-select" id="filter-sort" onchange="sortProyek(this.value)" style="flex:1; min-width:120px; height:48px; background:hsla(220, 20%, 100%, 0.03); border-radius:12px">
              <option value="updated_at">Terbaru</option>
              <option value="nama_bangunan">Nama A-Z</option>
            </select>
            <div id="proyek-count" style="display:flex; align-items:center; background:hsla(158, 85%, 45%, 0.1); color:var(--success-400); padding:0 16px; border-radius:12px; font-weight:800; font-family:var(--font-mono); font-size:11px; text-transform:uppercase; letter-spacing:1px; border:1px solid hsla(158, 85%, 45%, 0.2); height:48px; justify-content:center">
              0 ASSETS
            </div>
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div id="proyek-loading">
        ${Array(5).fill(0).map(() => `
          <div class="card-quartz" style="margin-bottom:16px; display:flex; gap:20px; padding:24px">
            <div class="skeleton" style="width:64px; height:64px; border-radius:16px; flex-shrink:0"></div>
            <div style="flex:1">
              <div class="skeleton" style="height:24px; width:40%; margin-bottom:12px"></div>
              <div class="skeleton" style="height:16px; width:20%"></div>
            </div>
          </div>
        `).join('')}
      </div>

      <!-- Proyek Cards -->
      <div id="proyek-list-container" style="display:grid; grid-template-columns:1fr; gap:16px"></div>
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
  if (countEl) countEl.textContent = `${proyek.length} ASSETS`;

  if (!container) return;

  if (!proyek.length) {
    container.innerHTML = `
      <div class="empty-state" style="padding: 100px 20px">
        <div class="empty-icon" style="background:var(--gradient-dark); border:1px solid var(--glass-border); width:80px; height:80px; border-radius:50%; display:flex; align-items:center; justify-content:center; color:var(--text-tertiary); font-size:2rem; margin-bottom:24px">
          <i class="fas fa-folder-open"></i>
        </div>
        <h3 class="empty-title" style="font-family:'Outfit', sans-serif; font-weight:800; color:white">No strategic assets found</h3>
        <p class="empty-desc" style="opacity:0.6; margin-bottom: 24px">Start by creating your first ministerial building project.</p>
        <button class="btn-presidential gold" onclick="window.navigate('proyek-baru')">
          <i class="fas fa-plus"></i> Initiate New Project
        </button>
      </div>
    `;
    return;
  }

  const statusMap = {
    LAIK_FUNGSI:           { label: 'LAIK FUNGSI',      cls: 'badge-laik',       icon: 'fa-circle-check',   color: 'var(--success-400)' },
    LAIK_FUNGSI_BERSYARAT: { label: 'LAIK BERSYARAT',   cls: 'badge-bersyarat',  icon: 'fa-triangle-exclamation', color: 'var(--gold-400)' },
    TIDAK_LAIK_FUNGSI:     { label: 'TIDAK LAIK',       cls: 'badge-tidak-laik', icon: 'fa-circle-xmark',   color: 'var(--danger-400)' },
    DALAM_PENGKAJIAN:      { label: 'PENGKAJIAN',       cls: 'badge-proses',     icon: 'fa-clock',          color: 'var(--brand-400)' },
  };

  container.innerHTML = proyek.map(p => {
    const s    = statusMap[p.status_slf] || { label: p.status_slf || '-', cls: 'badge-proses', icon: 'fa-circle', color: 'var(--text-tertiary)' };
    const prog = p.progress || 0;
    const date = p.updated_at ? new Date(p.updated_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';

    return `
      <div class="card-quartz" style="padding: var(--space-6); display:flex; gap:24px; align-items:center; cursor:pointer; position:relative; overflow:hidden; flex-wrap:wrap"
           onclick="window.navigate('proyek-detail', {id:'${p.id}'})">
        
        <!-- Status Indicator line -->
        <div style="position:absolute; left:0; top:0; bottom:0; width:4px; background:${s.color}"></div>

        <!-- Project Icon -->
        <div class="hide-mobile" style="width:64px; height:64px; border-radius:18px; background:var(--gradient-brand); display:flex; align-items:center; justify-content:center; color:white; font-size:1.6rem; flex-shrink:0; box-shadow: var(--shadow-sapphire); border:1px solid hsla(220, 95%, 52%, 0.3)">
          <i class="fas fa-building"></i>
        </div>

        <!-- Info Section -->
        <div style="flex:1; min-width:200px; overflow:hidden">
          <div style="display:flex; align-items:center; gap:12px; margin-bottom:8px; flex-wrap:wrap">
            <h3 style="font-family:'Outfit', sans-serif; font-weight:800; font-size:1.15rem; color:var(--text-primary); margin:0">${p.nama_bangunan || 'UNTITLED ASSET'}</h3>
            <span class="badge ${s.cls}" style="font-family:var(--font-mono); font-size:10px; font-weight:800; letter-spacing:1px; border:1px solid ${s.color}66; background:${s.color}1a; color:${s.color}">
              <i class="fas ${s.icon}"></i> ${s.label}
            </span>
          </div>
          
          <div style="display:flex; align-items:center; gap:16px; margin-bottom:16px; flex-wrap:wrap">
            <div style="font-size: 0.75rem; color:var(--text-tertiary); display:flex; align-items:center; gap:6px">
              <i class="fas fa-location-dot" style="color:var(--brand-400)"></i> ${p.alamat || p.kota || 'Location Pending'}
            </div>
            <div style="font-size: 0.75rem; color:var(--text-tertiary); display:flex; align-items:center; gap:6px">
              <i class="fas fa-user-tie" style="color:var(--gold-400)"></i> ${p.pemilik || 'Private Ownership'}
            </div>
          </div>

          <div style="display:flex; align-items:center; gap:16px; flex-wrap:wrap">
            <div class="progress-wrap" style="flex:1; min-width:140px; max-width:240px; height:6px; background:hsla(220, 20%, 100%, 0.05); border-radius:10px">
              <div class="progress-fill" style="width:${prog}%; height:100%; border-radius:10px; background:${prog >= 80 ? 'var(--gradient-brand)' : prog >= 40 ? 'var(--gradient-gold)' : 'var(--gradient-danger)'}; box-shadow: 0 0 10px ${prog >= 80 ? 'var(--brand-500)66' : 'var(--gold-500)66'}"></div>
            </div>
            <span style="font-family:var(--font-mono); font-weight:800; font-size:11px; color:var(--brand-400)">${prog}% INTEGRITY</span>
          </div>
        </div>

        <!-- Meta Section (Visible on some tablets, hidden on tiny mobile) -->
        <div style="text-align:right; flex-shrink:0; min-width:100px" class="hide-mobile">
          <div style="font-family:var(--font-mono); font-size:10px; color:var(--text-tertiary); text-transform:uppercase; letter-spacing:1px; margin-bottom:4px">Last Synced</div>
          <div style="font-weight:700; color:var(--text-primary); font-size:0.85rem">${date}</div>
        </div>

        <!-- Action Pills -->
        <div class="flex gap-2" style="margin-left: auto" onclick="event.stopPropagation()">
          <button class="btn btn-ghost" title="Checklist" onclick="event.stopPropagation();window.navigate('checklist',{id:'${p.id}'})" style="width:38px; height:38px; padding:0; border-radius:10px; border:1px solid hsla(220, 20%, 100%, 0.05)">
            <i class="fas fa-clipboard-list" style="color:var(--brand-400)"></i>
          </button>
          <button class="btn btn-ghost" title="Analytics" onclick="event.stopPropagation();window.navigate('analisis',{id:'${p.id}'})" style="width:38px; height:38px; padding:0; border-radius:10px; border:1px solid hsla(220, 20%, 100%, 0.05)">
            <i class="fas fa-chart-network" style="color:var(--gold-400)"></i>
          </button>
          <button class="btn btn-ghost" title="Archive" onclick="event.stopPropagation();deleteProyek('${p.id}','${p.nama_bangunan}')" style="width:38px; height:38px; padding:0; border-radius:10px; border:1px solid hsla(0, 85%, 60%, 0.1)">
            <i class="fas fa-trash-can" style="color:var(--danger-400)"></i>
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
    return new Date(b.updated_at) - new Date(a.updated_at);
  });
  renderProyekCards(sorted);
};

window.deleteProyek = async function(id, name) {
  const ok = await confirm({
    title: 'Archive Project',
    message: `Are you sure you want to archive <strong>${name}</strong>? This action will remove the asset from the current portfolio.`,
    confirmText: 'Confirm Archive',
    danger: true,
  });
  if (!ok) return;
  try {
    const { error } = await supabase.from('proyek').delete().eq('id', id);
    if (error) throw error;
    _allProyek = _allProyek.filter(p => p.id !== id);
    renderProyekCards(_allProyek);
    showSuccess('Asset successfully archived.');
  } catch (err) {
    showError('Action failed: ' + err.message);
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
