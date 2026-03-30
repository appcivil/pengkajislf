// ============================================================
//  NOTIFICATION SYSTEM (REAL-TIME)
// ============================================================
import { supabase } from '../lib/supabase.js';
import { getUserInfo } from '../lib/auth.js';
import { showInfo } from './toast.js';

let _notifDropdown = null;
let _notifChannel = null;

/**
 * Inisialisasi sistem notifikasi. 
 * Memasang UI Dropdown dan membuka jalur koneksi sinkronisasi Real-Time ke Supabase.
 */
export async function initNotifications() {
  const btnNotif = document.getElementById('btn-notif');
  if (!btnNotif) return;

  // 1. Setup UI Dropdown
  setupUIDropdown(btnNotif);

  // 2. Fetch Notifikasi Awal (Misal 10 terbaru)
  await fetchInitialNotifications();

  // 3. Menghubungkan ke Real-time Database Supabase
  setupRealtimeSubscription();

  // 4. Event Listener Tombol Bell
  window.addEventListener('open-notifications', toggleDropdown);

  // Tumbuk event listener 'click' agar langsung trigger event custom jika belum ada.
  // (Di header.js sudah ada, tapi jika belum terikat bisa ditimpa)
  btnNotif.onclick = (e) => {
    e.stopPropagation();
    toggleDropdown();
  };

  // Tutup dropdown jika klik di luar
  document.addEventListener('click', (e) => {
    if (_notifDropdown && _notifDropdown.classList.contains('show')) {
      if (!btnNotif.contains(e.target) && !_notifDropdown.contains(e.target)) {
        _notifDropdown.classList.remove('show');
      }
    }
  });
}

/**
 * Menyiapkan kontainer dropdown UI di dalam DOM.
 */
function setupUIDropdown(btnAnchor) {
  // Jika sudah ada (mungkin saat re-render)
  if (document.getElementById('notif-dropdown')) {
    _notifDropdown = document.getElementById('notif-dropdown');
    return;
  }

  // Buat div kontainer
  _notifDropdown = document.createElement('div');
  _notifDropdown.id = 'notif-dropdown';
  _notifDropdown.className = 'notif-dropdown';
  _notifDropdown.innerHTML = `
    <div class="notif-header">
      <h4 style="font-size:0.9rem;font-weight:700;color:var(--text-primary);margin:0">Notifikasi Sistem</h4>
      <button class="btn btn-ghost btn-sm" id="btn-read-all" style="font-size:0.75rem;padding:2px 8px;margin:0" title="Tandai semua dibaca">
        <i class="fas fa-check-double"></i>
      </button>
    </div>
    <div class="notif-body" id="notif-list">
      <div style="padding:var(--space-4);text-align:center;color:var(--text-tertiary);font-size:0.8rem">
        <i class="fas fa-circle-notch fa-spin" style="margin-bottom:8px;font-size:1.2rem;color:var(--brand-400)"></i><br>
        Memuat data...
      </div>
    </div>
  `;

  // Sisipkan menempel dengan tombol Bell (Header Right)
  const headerRight = document.querySelector('.header-right');
  if (headerRight) {
    // Beri posisi relatif agar dropdown bisa menempel di sekitarnya
    headerRight.style.position = 'relative';
    headerRight.appendChild(_notifDropdown);
  } else {
    document.body.appendChild(_notifDropdown);
  }

  document.getElementById('btn-read-all')?.addEventListener('click', markAllAsRead);
}

/**
 * Memunculkan atau menyembunyikan laci notifikasi.
 */
function toggleDropdown() {
  if (!_notifDropdown) return;
  _notifDropdown.classList.toggle('show');
}

/**
 * Pemanggillan API awal. 
 * Menyiasati apabila tabel 'notifications' belum dibuat oleh User di Supabase, 
 * kita sediakan mock-ups (dummy) sebagai cadangan fallback.
 */
async function fetchInitialNotifications() {
  const user = getUserInfo();
  if (!user) return;

  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      // Jika kode error berhubungan dengan tabel tidak ada
      if (error.code === '42P01') {
        console.warn("[Notif] Tabel 'notifications' belum dibuat di DB Supabase. Memakai UI contoh (Mock Data).");
        renderFallbackMockup();
        return;
      }
      throw error;
    }

    renderNotifications(data);
  } catch (err) {
    if (String(err.message).includes('relation "notifications" does not exist')) {
        console.warn("[Notif] Realtime belum ada. Merender dummy mockup...");
        renderFallbackMockup();
        return;
    }
    console.error('[Notif] Gagal memuat notifikasi, fallback ke dummy:', err);
    renderFallbackMockup(); // Render dummy
  }
}

/**
 * Berlangganan (Subscribe) ke perubahan tabel Notifications di Supabase Realtime.
 */
function setupRealtimeSubscription() {
  const user = getUserInfo();
  if (!user) return;

  _notifChannel = supabase.channel('realtime_notifications_tracker')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`
      },
      (payload) => {
        const baru = payload.new;
        // Peringatkan pengguna lewat Toast ringan
        showInfo(`Notif Baru: ${baru.title}`);
        
        // Nyalakan dot merah
        updateRedDot(true);
        
        // Refresh daftar list (Opsi: Push element manual ke DOM)
        fetchInitialNotifications();
      }
    )
    .subscribe((status) => {
      // Abaikan log subscribe
    });
}

/**
 * Menghapus/Menandai notifikasi sebagai dibaca.
 */
async function markAllAsRead() {
  const user = getUserInfo();
  if (!user) return;

  // Optimistic UI updates
  updateRedDot(false);
  const items = document.querySelectorAll('.notif-item.unread');
  items.forEach(el => el.classList.remove('unread'));

  // Update backend (Hanya kalau tabelnya ada)
  try {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);
  } catch(e) { } // Abaikan kalau error
}

/**
 * Merender rentetan pesan JSON berwujud HTML Node ke wadah dropdown.
 */
function renderNotifications(items = []) {
  const listEl = document.getElementById('notif-list');
  if (!listEl) return;

  if (items.length === 0) {
    listEl.innerHTML = `
      <div style="padding:var(--space-6) var(--space-4);text-align:center;color:var(--text-tertiary)">
        <i class="fas fa-bell-slash" style="font-size:2rem;margin-bottom:12px;opacity:0.5"></i>
        <div style="font-size:0.8rem">Belum ada notifikasi saat ini.</div>
        <p style="font-size:0.6rem; margin-top:12px; opacity:0.6;">(Tips: Buat tabel <b>notifications</b> di Supabase untuk mengaktifkan DB log)</p>
      </div>
    `;
    updateRedDot(false);
    return;
  }

  // Cek apakah ada yg belum dibaca (unread)
  let sumUnread = 0;
  items.forEach(it => { if(it.is_read === false) sumUnread++; });
  updateRedDot(sumUnread > 0);

  listEl.innerHTML = items.map(item => `
    <div class="notif-item ${item.is_read ? '' : 'unread'}" data-id="${item.id || ''}">
      <div class="ni-icon ${getIconClassForType(item.type)}">
        <i class="fas ${getIconNameForType(item.type)}"></i>
      </div>
      <div class="ni-content">
        <div class="ni-title">${item.title}</div>
        <div class="ni-desc">${item.message}</div>
        <div class="ni-time">${formatWaktuMundur(item.created_at)}</div>
      </div>
    </div>
  `).join('');
}

/**
 * Jika User belum membuat tabel `notifications` di Supabase SQL, kita render Data Sampel
 * Ini mencegah UI kosong (Blank) agar user tetap bisa tes Front-End dropdwonnya berjalan.
 */
function renderFallbackMockup() {
  const sampleData = [
    {
      id: 'n1',
      title: 'Selamat Datang di v14.0',
      message: 'Sistem Hybrid AI telah diperbarui dengan modul form Sign Up terintegrasi!',
      type: 'info',
      created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 menit lalu
      is_read: false
    },
    {
      id: 'n2',
      title: 'Real-Time Sync Ready',
      message: 'Supabase Realtime Channel siap mendengarkan INSERT pada tabel notifications Anda.',
      type: 'success',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 jam lalu
      is_read: false
    },
    {
      id: 'n3',
      title: 'Dokumen Berhasil Ditarik',
      message: 'Berkas Laporan SLF proyek "Gedung Pusat" (PDF) berhasil di-generate.',
      type: 'success',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 hari lalu
      is_read: true
    }
  ];
  renderNotifications(sampleData);
}

// ======================== Helper Utilities =========================

/** Mengelola CSS styling badge merah (indikator pesan baru) */
function updateRedDot(show) {
  const dot = document.querySelector('.notif-dot');
  if (dot) {
    dot.style.display = show ? 'block' : 'none';
  }
}

/** Mengembalikan warna background CSS badge notifikasi sesuai tipenya */
function getIconClassForType(type) {
  switch (type) {
    case 'success': 
      return 'bg-success text-success';
    case 'alert':
    case 'warning': 
      return 'bg-warning text-warning';
    case 'error': 
      return 'bg-danger text-danger';
    case 'info':
    default: 
      return 'bg-brand text-brand';
  }
}

/** Mengambil nama class logo FontAwesome spesifik */
function getIconNameForType(type) {
  switch (type) {
    case 'success': return 'fa-check-circle';
    case 'alert':
    case 'warning': return 'fa-exclamation-triangle';
    case 'error': return 'fa-times-circle';
    case 'info':
    default: return 'fa-info-circle';
  }
}

/** Mengubah objek Date mentah menjadi "3 menit lalu" dsb. */
function formatWaktuMundur(isoString) {
  if (!isoString) return 'Baru saja';
  const t = new Date(isoString).getTime();
  const diff = (Date.now() - t) / 1000;
  
  if (diff < 60) return 'Baru saja';
  if (diff < 3600) return Math.floor(diff/60) + ' mnt yang lalu';
  if (diff < 86400) return Math.floor(diff/3600) + ' jam yang lalu';
  return Math.floor(diff/86400) + ' hari yang lalu';
}

/** Berguna kala Logout (supaya Channel tak bocor) */
export function destroyNotifications() {
  if (_notifChannel) {
    _notifChannel.unsubscribe();
    _notifChannel = null;
  }
  if (_notifDropdown) {
    _notifDropdown.remove();
    _notifDropdown = null;
  }
}
