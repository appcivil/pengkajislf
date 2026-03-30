
import { supabase } from '../lib/supabase.js';
import { navigate } from '../lib/router.js';
import { showSuccess, showError, showInfo } from '../components/toast.js';

/**
 * PROYEK GALERI PAGE
 * Manajemen Foto Temuan & Bukti Visual Lapangan
 */
export async function galeriPage(params) {
  const proyekId = params.id;
  if (!proyekId) { navigate('proyek'); return ''; }

  const root = document.getElementById('page-root');
  if (root) root.innerHTML = renderSkeleton();

  // 1. Fetch Data
  const [proyek, allChecklist, allFiles] = await Promise.all([
    fetchProyek(proyekId),
    fetchProjectPhotosFromChecklist(proyekId),
    fetchProjectPhotosFromFiles(proyekId)
  ]);

  if (!proyek) { navigate('proyek'); return ''; }

  // 2. Combine & Normalize Photos
  // checklistPhotos: { url, kode, nama_item, aspek, is_starred }
  // filePhotos: { url, name, category, is_starred, id }
  const combinedPhotos = [...allChecklist, ...allFiles];
  window._currentPhotos = combinedPhotos;
  window._galeriFilter = 'all';

  // 3. Render
  const html = renderShell(proyek, combinedPhotos);
  if (root) {
    root.innerHTML = html;
    renderPhotoGrid(combinedPhotos);
  }

  return html;
}

// ── Data Fetchers ─────────────────────────────────────────────

async function fetchProyek(id) {
  const { data } = await supabase.from('proyek').select('*').eq('id', id).maybeSingle();
  return data;
}

async function fetchProjectPhotosFromChecklist(proyekId) {
  const { data, error } = await supabase
    .from('checklist_items')
    .select('kode, nama, aspek, foto_urls, metadata')
    .eq('proyek_id', proyekId);
  
  if (error) return [];
  
  const photos = [];
  data.forEach(item => {
    if (item.foto_urls && Array.isArray(item.foto_urls)) {
      item.foto_urls.forEach((url, idx) => {
        photos.push({
          id: `${item.kode}_${idx}`,
          source: 'checklist',
          url: url,
          kode: item.kode,
          nama: item.nama,
          aspek: item.aspek || 'Lainnya',
          is_starred: item.metadata?.featured_photos?.includes(url) || false,
          raw_item: item
        });
      });
    }
  });
  return photos;
}

async function fetchProjectPhotosFromFiles(proyekId) {
  const { data, error } = await supabase
    .from('proyek_files')
    .select('*')
    .eq('proyek_id', proyekId);
  
  if (error) return [];
  
  // Filter only images
  return data
    .filter(f => f.file_url && f.name.match(/\.(jpg|jpeg|png|webp|gif)$/i))
    .map(f => ({
      id: f.id,
      source: 'files',
      url: f.file_url,
      name: f.name,
      category: f.category || 'Umum',
      aspek: f.category === 'teknis' ? 'Teknis' : 'Administrasi',
      is_starred: f.metadata?.is_starred || false,
      raw_file: f
    }));
}

// ── View Components ───────────────────────────────────────────

function renderShell(proyek, photos) {
  return `
    <div class="page-container">
      <div class="page-header" style="margin-bottom:var(--space-6)">
        <div class="flex-between">
          <div>
            <button class="btn btn-ghost btn-sm" onclick="window.navigate('proyek-detail', {id:'${proyek.id}'})" style="margin-bottom:8px">
              <i class="fas fa-arrow-left"></i> Kembali ke Proyek
            </button>
            <h1 class="page-title">Galeri Bukti Visual</h1>
            <p class="page-subtitle">${photos.length} total foto teridentifikasi dalam proyek ini.</p>
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
        <div class="card" style="margin-top:var(--space-5); padding:var(--space-3); display:flex; gap:var(--space-2); overflow-x:auto">
          <button class="btn btn-sm btn-filter active" data-filter="all" onclick="window._filterGaleri('all', this)">Semua Foto</button>
          <button class="btn btn-sm btn-filter" data-filter="starred" onclick="window._filterGaleri('starred', this)">
            <i class="fas fa-star text-yellow-500"></i> Terpilih (Laporan)
          </button>
          <div style="width:1px; background:var(--border-subtle); margin:4px 8px"></div>
          <button class="btn btn-sm btn-filter" data-filter="Struktur" onclick="window._filterGaleri('Struktur', this)">Struktur</button>
          <button class="btn btn-sm btn-filter" data-filter="Arsitektur" onclick="window._filterGaleri('Arsitektur', this)">Arsitektur</button>
          <button class="btn btn-sm btn-filter" data-filter="Mekanikal" onclick="window._filterGaleri('Mekanikal', this)">MEP / Utilitas</button>
          <button class="btn btn-sm btn-filter" data-filter="Administrasi" onclick="window._filterGaleri('Administrasi', this)">Administrasi</button>
        </div>
      </div>

      <div id="galeri-grid" class="galeri-grid">
        <!-- Photo cards will be injected here -->
      </div>

      <!-- Lightbox Overlay -->
      <div id="galeri-lightbox" class="lightbox-overlay" style="display:none" onclick="window._closeLightbox()">
        <img id="lightbox-img" src="" alt="Enlarged view">
        <div class="lightbox-caption" id="lightbox-caption"></div>
        <button class="lightbox-close"><i class="fas fa-times"></i></button>
      </div>
    </div>

    <style>
      .galeri-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: var(--space-4);
      }
      .photo-card {
        background: var(--bg-card);
        border-radius: var(--radius-lg);
        overflow: hidden;
        border: 1px solid var(--border-subtle);
        transition: transform 0.2s ease, box-shadow 0.2s ease;
        position: relative;
      }
      .photo-card:hover {
        transform: translateY(-4px);
        box-shadow: var(--shadow-lg);
      }
      .photo-card.starred {
        border: 2px solid var(--brand-500);
      }
      .photo-thumb-wrap {
        position: relative;
        aspect-ratio: 4/3;
        background: var(--bg-elevated);
        cursor: zoom-in;
      }
      .photo-thumb {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .photo-info {
        padding: var(--space-3);
      }
      .photo-title {
        font-weight: 700;
        font-size: 0.85rem;
        margin-bottom: 4px;
        color: var(--text-primary);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .photo-meta {
        font-size: 0.75rem;
        color: var(--text-tertiary);
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .star-btn {
        position: absolute;
        top: 8px;
        right: 8px;
        background: rgba(0,0,0,0.5);
        border: none;
        color: white;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s ease;
        backdrop-filter: blur(4px);
      }
      .star-btn.active {
        background: var(--brand-500);
        color: white;
      }
      .star-btn:hover {
        transform: scale(1.1);
      }
      .source-badge {
        position: absolute;
        top: 8px;
        left: 8px;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 0.6rem;
        font-weight: 800;
        text-transform: uppercase;
        background: rgba(0,0,0,0.6);
        color: white;
        backdrop-filter: blur(4px);
      }
      .lightbox-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.9);
        z-index: 10000;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: var(--space-10);
      }
      #lightbox-img {
        max-width: 90%;
        max-height: 80vh;
        border-radius: 8px;
        box-shadow: 0 0 40px rgba(0,0,0,0.5);
      }
      .lightbox-caption {
        margin-top: 20px;
        color: white;
        text-align: center;
        max-width: 600px;
      }
      .lightbox-close {
        position: absolute;
        top: 30px;
        right: 30px;
        background: none;
        border: none;
        color: white;
        font-size: 2rem;
        cursor: pointer;
      }
      .btn-filter.active {
        background: var(--brand-500);
        color: white;
        border-color: var(--brand-500);
      }
    </style>
  `;
}

function renderPhotoGrid(photos) {
  const container = document.getElementById('galeri-grid');
  if (!container) return;

  if (photos.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1/-1; text-align:center; padding:var(--space-12); background:var(--bg-card); border-radius:var(--radius-xl)">
        <i class="fas fa-images" style="font-size:3rem; color:var(--text-tertiary); margin-bottom:var(--space-4)"></i>
        <h3>Belum Ada Foto</h3>
        <p class="text-secondary">Ambil foto saat inspeksi atau unggah dokumen di modul checklist.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = photos.map(p => `
    <div class="photo-card ${p.is_starred ? 'starred' : ''}" id="card-${p.id}">
      <div class="photo-thumb-wrap" onclick="window._openLightbox('${p.url}', '${p.nama || p.name}', '${p.aspek || p.category}')">
        <img src="${p.url}" class="photo-thumb" loading="lazy">
        <div class="source-badge">${p.source === 'checklist' ? p.kode : p.category}</div>
        <button class="star-btn ${p.is_starred ? 'active' : ''}" 
                onclick="event.stopPropagation(); window._toggleStar('${p.id}')" 
                title="Pilih untuk Laporan Utama">
          <i class="fas fa-star"></i>
        </button>
      </div>
      <div class="photo-info">
        <div class="photo-title" title="${p.nama || p.name}">${p.nama || p.name}</div>
        <div class="photo-meta">
          <span><i class="fas fa-tag"></i> ${p.aspek || p.category}</span>
          <span style="opacity:0.6">${p.source === 'checklist' ? 'Audit Lapangan' : 'Dokumen Proyek'}</span>
        </div>
      </div>
    </div>
  `).join('');
}

// ── Global Handlers (onclick) ───────────────────────────────

window._filterGaleri = (filter, btn) => {
  window._galeriFilter = filter;
  
  // Update UI Tabs
  document.querySelectorAll('.btn-filter').forEach(el => el.classList.remove('active'));
  btn.classList.add('active');

  let filtered = window._currentPhotos;
  if (filter === 'starred') {
    filtered = window._currentPhotos.filter(p => p.is_starred);
  } else if (filter !== 'all') {
    filtered = window._currentPhotos.filter(p => p.aspek === filter || p.category === filter);
  }

  renderPhotoGrid(filtered);
};

window._openLightbox = (url, title, aspek) => {
  const lb = document.getElementById('galeri-lightbox');
  const img = document.getElementById('lightbox-img');
  const cap = document.getElementById('lightbox-caption');
  
  img.src = url;
  cap.innerHTML = `<strong>${title}</strong><br><span style="opacity:0.7">Aspek: ${aspek}</span>`;
  lb.style.display = 'flex';
  lb.style.opacity = '0';
  setTimeout(() => lb.style.opacity = '1', 50);
};

window._closeLightbox = () => {
  const lb = document.getElementById('galeri-lightbox');
  lb.style.opacity = '0';
  setTimeout(() => lb.style.display = 'none', 300);
};

window._toggleStar = async (id) => {
  const photo = window._currentPhotos.find(p => p.id === id);
  if (!photo) return;

  const newState = !photo.is_starred;
  photo.is_starred = newState;

  // Update UI locally
  const card = document.getElementById(`card-${id}`);
  const btn = card?.querySelector('.star-btn');
  if (card) newState ? card.classList.add('starred') : card.classList.remove('starred');
  if (btn) newState ? btn.classList.add('active') : btn.classList.remove('active');

  try {
    if (photo.source === 'checklist') {
      const item = photo.raw_item;
      let featured = item.metadata?.featured_photos || [];
      if (newState) {
        if (!featured.includes(photo.url)) featured.push(photo.url);
      } else {
        featured = featured.filter(u => u !== photo.url);
      }
      
      await supabase.from('checklist_items').update({
        metadata: { ...item.metadata, featured_photos: featured }
      }).eq('proyek_id', item.raw_item.proyek_id).eq('kode', item.raw_item.kode);

    } else {
      // Photo from proyect_files
      const file = photo.raw_file;
      await supabase.from('proyek_files').update({
        metadata: { ...file.metadata, is_starred: newState }
      }).eq('id', file.id);
    }
    
    showSuccess(newState ? "Foto dipilih untuk laporan utama." : "Foto dilepas dari laporan utama.");
  } catch (err) {
    showError("Gagal menyimpan status foto: " + err.message);
  }
};

window._refreshGaleri = () => {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  galeriPage({ id });
};

function renderSkeleton() {
  return `
    <div class="page-container">
      <div class="skeleton" style="height:40px; width:300px; margin-bottom:20px"></div>
      <div class="skeleton" style="height:100px; margin-bottom:20px; border-radius:12px"></div>
      <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap:20px">
        ${Array(6).fill('<div class="skeleton" style="height:250px; border-radius:12px"></div>').join('')}
      </div>
    </div>
  `;
}
