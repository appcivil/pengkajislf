// ============================================================
//  KUMPULAN SURAT PERNYATAAN (GLOBAL HUB)
//  Centralized management of SLF Statements & Legal Docs
// ============================================================
import { supabase } from '../lib/supabase.js';
import { navigate } from '../lib/router.js';
import { showSuccess, showError } from '../components/toast.js';

export async function suratPernyataanListPage() {
  const root = document.getElementById('page-root');
  if (root) root.innerHTML = renderSkeleton();

  const { data: projects, error } = await supabase
    .from('proyek')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) {
    showError('Gagal memuat daftar pernyataan: ' + error.message);
    return;
  }

  const html = buildHtml(projects || []);
  if (root) {
    root.innerHTML = html;
    initEvents(projects || []);
  }
}

function buildHtml(projects) {
  return `
    <div id="sp-list-page">
      <div class="page-header flex-between">
        <div>
          <h1 class="page-title">Kumpulan Surat Pernyataan</h1>
          <p class="page-subtitle">Pusat dokumentasi legal Kelaikan Fungsi (SLF) seluruh proyek</p>
        </div>
        <div class="flex gap-2">
           <button class="btn btn-outline" onclick="window.location.reload()"><i class="fas fa-rotate"></i> Refresh</button>
        </div>
      </div>

      <!-- Stats Bar -->
      <div class="kpi-grid" style="margin-bottom:var(--space-6)">
        <div class="kpi-card">
          <div class="kpi-icon-wrap kpi-blue"><i class="fas fa-file-signature"></i></div>
          <div class="kpi-value">${projects.length}</div>
          <div class="kpi-label">Total Dokumen</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon-wrap kpi-green"><i class="fas fa-certificate"></i></div>
          <div class="kpi-value">${projects.filter(p => p.status_slf === 'LAIK_FUNGSI').length}</div>
          <div class="kpi-label">Terbit SLF Laik</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon-wrap kpi-amber"><i class="fas fa-triangle-exclamation"></i></div>
          <div class="kpi-value">${projects.filter(p => p.status_slf === 'LAIK_FUNGSI_BERSYARAT').length}</div>
          <div class="kpi-label">Laik Bersyarat</div>
        </div>
      </div>

      <div class="card" style="padding:var(--space-4); margin-bottom:var(--space-6)">
        <div class="flex-between gap-4">
          <div style="position:relative; flex:1">
            <i class="fas fa-search" style="position:absolute; left:12px; top:50%; transform:translateY(-50%); color:var(--text-tertiary)"></i>
            <input type="text" id="sr-search" class="form-input" placeholder="Cari nama gedung atau pemilik..." style="padding-left:36px" oninput="window._filterSP(this.value)">
          </div>
          <select class="form-select" id="sr-filter-status" onchange="window._filterSP()" style="width:200px">
            <option value="">Semua Status</option>
            <option value="LAIK_FUNGSI">Laik Fungsi</option>
            <option value="LAIK_FUNGSI_BERSYARAT">Laik Bersyarat</option>
            <option value="TIDAK_LAIK_FUNGSI">Tidak Laik</option>
            <option value="DALAM_PENGKAJIAN">Proses Pengkajian</option>
          </select>
        </div>
      </div>

      <div class="grid-main-responsive" id="sp-container">
        ${projects.map(p => renderSPCard(p)).join('')}
        ${projects.length === 0 ? '<div style="grid-column:1/-1;text-align:center;padding:100px;color:var(--text-tertiary)"><i class="fas fa-folder-open" style="font-size:3rem;margin-bottom:15px;display:block"></i>Belum ada data proyek.</div>' : ''}
      </div>
    </div>
  `;
}

function renderSPCard(p) {
  const statusLabels = {
    LAIK_FUNGSI: { label: 'LAIK FUNGSI', cls: 'badge-laik', icon: 'fa-certificate' },
    LAIK_FUNGSI_BERSYARAT: { label: 'BERSYARAT', cls: 'badge-bersyarat', icon: 'fa-triangle-exclamation' },
    TIDAK_LAIK_FUNGSI: { label: 'TIDAK LAIK', cls: 'badge-tidak-laik', icon: 'fa-circle-xmark' },
    DALAM_PENGKAJIAN: { label: 'PROSES', cls: 'badge-proses', icon: 'fa-clock' }
  };
  const s = statusLabels[p.status_slf] || { label: p.status_slf || 'PROSES', cls: 'badge-proses', icon: 'fa-clock' };
  const date = new Date(p.updated_at || p.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

  return `
    <div class="card sp-card-item" data-name="${(p.nama_bangunan || '').toLowerCase()}" data-pemilik="${(p.pemilik || '').toLowerCase()}" data-status="${p.status_slf || ''}">
      <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:15px">
        <div class="badge ${s.cls}"><i class="fas ${s.icon}"></i> ${s.label}</div>
        <div class="text-xs text-tertiary">${date}</div>
      </div>
      
      <h3 style="font-size:1rem; font-weight:800; color:var(--text-primary); margin-bottom:4px; line-height:1.2; height:2.4em; overflow:hidden; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical">
        ${p.nama_bangunan || 'Proyek Tanpa Nama'}
      </h3>
      <div style="font-size:0.8rem; color:var(--text-secondary); margin-bottom:15px; display:flex; align-items:center; gap:8px">
        <i class="fas fa-user-circle"></i> ${p.pemilik || '-'}
      </div>

      <div style="border-top:1px solid var(--border-subtle); padding-top:15px; margin-top:auto; display:flex; gap:8px">
        <button class="btn btn-primary btn-sm" onclick="window.navigate('surat-pernyataan', {id:'${p.id}'})" style="flex:1">
          <i class="fas fa-file-signature"></i> Preview
        </button>
        <button class="btn btn-outline btn-sm" onclick="window._copyVerifyLink('${p.id}')" title="Copy Link Verifikasi QR">
          <i class="fas fa-qrcode"></i>
        </button>
      </div>
    </div>
  `;
}

function initEvents(allProjects) {
  window._filterSP = () => {
    const q = document.getElementById('sr-search')?.value.toLowerCase() || '';
    const status = document.getElementById('sr-filter-status')?.value || '';
    const cards = document.querySelectorAll('.sp-card-item');

    cards.forEach(card => {
      const name = card.getAttribute('data-name');
      const pemilik = card.getAttribute('data-pemilik');
      const cStatus = card.getAttribute('data-status');

      const matchSearch = name.includes(q) || pemilik.includes(q);
      const matchStatus = !status || cStatus === status;

      card.style.display = (matchSearch && matchStatus) ? 'block' : 'none';
    });
  };

  window._copyVerifyLink = (id) => {
    const link = `${window.location.origin}${window.location.pathname}#/verify?id=${id}`;
    navigator.clipboard.writeText(link);
    showSuccess('Link verifikasi QR berhasil disalin!');
  };
}

function renderSkeleton() {
  return `
    <div class="page-header">
      <div class="skeleton" style="height:36px;width:300px;margin-bottom:8px"></div>
      <div class="skeleton" style="height:20px;width:400px"></div>
    </div>
    <div class="kpi-grid">
      ${Array(3).fill(0).map(() => `<div class="skeleton" style="height:120px;border-radius:var(--radius-lg)"></div>`).join('')}
    </div>
    <div class="grid-main-responsive" style="margin-top:40px">
      ${Array(6).fill(0).map(() => `<div class="skeleton" style="height:200px;border-radius:var(--radius-lg)"></div>`).join('')}
    </div>
  `;
}
