/**
 * PROYEK GALERI PAGE (Refactored)
 * Modular architecture using Centralized Store and Gallery Components.
 */
import { supabase } from '../lib/supabase.js';
import { navigate } from '../lib/router.js';
import { showSuccess, showError } from '../components/toast.js';
import { store, updateGallery } from '../lib/store.js';
import { escHtml } from '../lib/utils.js';
import { 
  renderGalleryShell, 
  renderPhotoGrid, 
  renderLightbox 
} from '../components/gallery-components.js';

export async function galeriPage(params) {
  const proyekId = params.id;
  if (!proyekId) { navigate('proyek'); return ''; }

  const root = document.getElementById('page-root');
  if (root) root.innerHTML = '<div class="skeleton" style="height:400px"></div>';

  // 1. Fetch & Sync
  await loadGalleryData(proyekId);
}

async function loadGalleryData(proyekId) {
  const root = document.getElementById('page-root');
  
  try {
    const [proyek, checklistPhotos, filePhotos] = await Promise.all([
      fetchProyek(proyekId),
      fetchChecklistPhotos(proyekId),
      fetchFilePhotos(proyekId)
    ]);

    if (!proyek) { navigate('proyek'); return; }

    const combined = [...checklistPhotos, ...filePhotos];
    
    // Sync Store
    store.set({ currentProyek: proyek, currentProyekId: proyekId });
    updateGallery({ photos: combined });

    render(root);
  } catch (err) {
    showError('Gagal memuat galeri: ' + err.message);
  }
}

function render(root) {
  const { currentProyek, gallery } = store.get();
  
  // Filter Logic
  let filtered = gallery.photos;
  if (gallery.filter === 'starred') {
    filtered = gallery.photos.filter(p => p.is_starred);
  } else if (gallery.filter !== 'all') {
    filtered = gallery.photos.filter(p => p.aspek === gallery.filter || p.category === gallery.filter);
  }

  root.innerHTML = renderGalleryShell(currentProyek, gallery.photos);
  
  const grid = document.getElementById('galeri-grid');
  if (grid) grid.innerHTML = renderPhotoGrid(filtered);

  // Update Filter Tabs UI
  document.querySelectorAll('.btn-filter').forEach(el => {
    el.classList.toggle('active', el.id === `filter-${gallery.filter}`);
  });

  // Lightbox
  if (gallery.activePhoto) {
     const lightboxHtml = renderLightbox(gallery.activePhoto);
     document.body.insertAdjacentHTML('beforeend', lightboxHtml);
  }
}

// ── Shared Handlers (Exposed to Window) ───────────────────────

window._filterGaleri = (filter) => {
  updateGallery({ filter });
  render(document.getElementById('page-root'));
};

window._refreshGaleri = () => {
    const { currentProyekId } = store.get();
    loadGalleryData(currentProyekId);
};

window._openLightbox = (photoId) => {
    const { gallery } = store.get();
    const photo = gallery.photos.find(p => p.id === photoId);
    if (photo) {
        updateGallery({ activePhoto: photo });
        render(document.getElementById('page-root'));
    }
};

window._closeLightbox = () => {
    const overlay = document.getElementById('galeri-lightbox');
    if (overlay) overlay.remove();
    updateGallery({ activePhoto: null });
};

window._toggleStar = async (id) => {
  const { gallery, currentProyekId } = store.get();
  const photo = gallery.photos.find(p => p.id === id);
  if (!photo) return;

  const newState = !photo.is_starred;
  
  try {
    if (photo.source === 'checklist') {
      let featured = photo.raw_item?.metadata?.featured_photos || [];
      featured = newState ? [...new Set([...featured, photo.url])] : featured.filter(u => u !== photo.url);
      
      await supabase.from('checklist_items').update({
        metadata: { ...photo.raw_item.metadata, featured_photos: featured }
      }).eq('proyek_id', currentProyekId).eq('kode', photo.kode);

    } else {
      await supabase.from('proyek_files').update({
        metadata: { ...photo.raw_file.metadata, is_starred: newState }
      }).eq('id', photo.raw_file.id);
    }
    
    // Update Local Store
    const updatedPhotos = gallery.photos.map(p => p.id === id ? { ...p, is_starred: newState } : p);
    updateGallery({ photos: updatedPhotos, activePhoto: gallery.activePhoto?.id === id ? { ...gallery.activePhoto, is_starred: newState } : gallery.activePhoto });
    
    showSuccess(newState ? "Ditambahkan ke Pilihan Laporan." : "Dihapus dari Pilihan Laporan.");
    render(document.getElementById('page-root'));

  } catch (err) {
    showError("Gagal update status: " + err.message);
  }
};

// ── Data Fetchers ─────────────────────────────────────────────

async function fetchProyek(id) {
  const { data } = await supabase.from('proyek').select('*').eq('id', id).single();
  return data;
}

async function fetchChecklistPhotos(proyekId) {
  const { data } = await supabase.from('checklist_items').select('*').eq('proyek_id', proyekId);
  const photos = [];
  (data || []).forEach(item => {
    if (item.foto_urls && Array.isArray(item.foto_urls)) {
      item.foto_urls.forEach((url, idx) => {
        photos.push({
          id: `${item.kode}_${idx}`,
          source: 'checklist',
          url,
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

async function fetchFilePhotos(proyekId) {
  const { data } = await supabase.from('proyek_files').select('*').eq('proyek_id', proyekId);
  return (data || [])
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
