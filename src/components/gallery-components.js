/**
 * GALLERY COMPONENTS
 * Reusable UI templates for the Project Gallery.
 */
import { escHtml } from '../lib/utils.js';

/**
 * Main Gallery Shell
 */
export function renderGalleryShell(proyek, photos) {
  return `
    <div class="page-container">
      <div class="page-header" style="margin-bottom:var(--space-6)">
        <div class="flex-between">
          <div>
            <button class="btn btn-ghost btn-sm" onclick="window.navigate('proyek-detail', {id:'${proyek.id}'})" style="margin-bottom:8px">
              <i class="fas fa-arrow-left"></i> Kembali ke Proyek
            </button>
            <h1 class="page-title">Galeri Bukti Visual</h1>
            <p class="page-subtitle">${photos.length} foto teridentifikasi dalam proyek ini.</p>
          </div>
          <div class="flex gap-2">
            <button class="btn btn-outline" onclick="window._refreshGaleri()">
              <i class="fas fa-sync"></i> Refresh
            </button>
            <button class="btn btn-primary" onclick="window.navigate('laporan', {id:'${proyek.id}'})">
              <i class="fas fa-file-contract"></i> Lihat Laporan
            </button>
          </div>
        </div>

        <!-- Filter Bar -->
        <div class="card" style="margin-top:var(--space-5); padding:var(--space-3); display:flex; gap:var(--space-2); overflow-x:auto; background:var(--bg-elevated); border:1px solid var(--border-subtle)">
          <button class="btn btn-sm btn-filter" id="filter-all" onclick="window._filterGaleri('all')">Semua Foto</button>
          <button class="btn btn-sm btn-filter" id="filter-starred" onclick="window._filterGaleri('starred')">
            <i class="fas fa-star" style="color:var(--warning-400)"></i> Pilihan Laporan
          </button>
          <div style="width:1px; background:var(--border-subtle); margin:4px 8px"></div>
          ${['Struktur', 'Arsitektur', 'Mekanikal', 'Administrasi'].map(f => `
            <button class="btn btn-sm btn-filter" id="filter-${f}" onclick="window._filterGaleri('${f}')">${f}</button>
          `).join('')}
        </div>
      </div>

      <div id="galeri-grid" class="galeri-grid">
        <!-- Rendered by Grid function -->
      </div>
    </div>
  `;
}

/**
 * Photo Grid Renderer
 */
export function renderPhotoGrid(photos) {
  if (photos.length === 0) {
    return `
      <div style="grid-column:1/-1; text-align:center; padding:var(--space-12); background:var(--bg-card); border-radius:var(--radius-xl); border:1px dashed var(--border-subtle)">
        <i class="fas fa-images" style="font-size:3rem; color:var(--text-tertiary); margin-bottom:var(--space-4)"></i>
        <h3 style="font-weight:700">Belum Ada Foto</h3>
        <p class="text-secondary">Foto otomatis muncul jika Anda mengunggah berkas teknis atau mengisi checklist lapangan.</p>
      </div>
    `;
  }

  return photos.map(p => `
    <div class="photo-card ${p.is_starred ? 'starred' : ''}" id="card-${p.id}">
      <div class="photo-thumb-wrap" onclick="window._openLightbox('${p.id}')">
        <img src="${p.url}" class="photo-thumb" loading="lazy">
        <div class="source-badge">${p.source === 'checklist' ? p.kode : (p.category || 'FILE')}</div>
        <button class="star-btn ${p.is_starred ? 'active' : ''}" 
                onclick="event.stopPropagation(); window._toggleStar('${p.id}')">
          <i class="fas fa-star"></i>
        </button>
      </div>
      <div class="photo-info">
        <div class="photo-title" title="${escHtml(p.nama || p.name)}">${escHtml(p.nama || p.name)}</div>
        <div class="photo-meta">
          <span style="font-weight:700; color:var(--brand-400)"><i class="fas fa-tag"></i> ${escHtml(p.aspek || p.category)}</span>
          <span style="opacity:0.6; font-size:0.6rem">${p.source === 'checklist' ? 'Audit GPS' : 'Drive Link'}</span>
        </div>
      </div>
    </div>
  `).join('');
}

/**
 * Lightbox Modal Overlay
 */
export function renderLightbox(photo) {
  if (!photo) return '';
  return `
    <div id="galeri-lightbox" class="lightbox-overlay" onclick="window._closeLightbox()">
      <div class="lightbox-content" onclick="event.stopPropagation()">
        <img id="lightbox-img" src="${photo.url}" alt="${escHtml(photo.nama || photo.name)}">
        <div class="lightbox-footer">
          <div style="flex:1">
             <div class="text-sm font-bold">${escHtml(photo.nama || photo.name)}</div>
             <div class="text-xs text-tertiary">Aspek: ${escHtml(photo.aspek || photo.category)} · ID: ${photo.kode || photo.id}</div>
          </div>
          <button class="btn btn-primary btn-sm" onclick="window._toggleStar('${photo.id}')">
             <i class="fas fa-star"></i> ${photo.is_starred ? 'Hapus Pilihan' : 'Pilih Lap. Utama'}
          </button>
        </div>
        <button class="lightbox-close" onclick="window._closeLightbox()"><i class="fas fa-times"></i></button>
      </div>
    </div>
  `;
}
