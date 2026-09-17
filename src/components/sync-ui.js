/**
 * SYNC UI COMPONENT
 * Monitors connection status and pending offline drafts.
 */
import { hasPendingDrafts } from '../lib/sync.js';

export function initSyncIndicator() {
  const container = document.getElementById('sync-indicator-root');
  if (!container) return;

  // Halaman login menyediakan #login-sync-slot di dalam kartu. Selama slot itu
  // ada, pil status dipindahkan ke dalam kartu (menyatu dengan desain); di
  // halaman lain ia kembali menjadi elemen tetap di sudut layar. Penempatan
  // ulang dilakukan setiap kali indikator diperbarui, jadi perpindahan halaman
  // (event 'route-changed') ikut tertangani tanpa pengait tambahan di router.
  const pindahkan = () => {
    const slot = document.getElementById('login-sync-slot');
    const tujuan = slot || document.body;
    if (container.parentElement !== tujuan) tujuan.appendChild(container);
    container.classList.toggle('di-dalam-kartu', Boolean(slot));
  };

  const update = async () => {
    pindahkan();
    const isOnline = navigator.onLine;
    const hasPending = await hasPendingDrafts();
    
    container.innerHTML = `
      <div class="sync-badge ${isOnline ? 'online' : 'offline'} ${hasPending ? 'pending' : ''}">
        <div class="sync-dot"></div>
        <span class="sync-text">
          ${isOnline 
            ? (hasPending ? 'Sinkronisasi...' : 'Terhubung') 
            : 'Mode Offline'}
        </span>
        ${hasPending ? `<span class="sync-count"><i class="fas fa-cloud-upload-alt"></i> Pending</span>` : ''}
      </div>
    `;
  };

  // Guard: initSyncIndicator hanya boleh memasang satu set listener/timer.
  // Tanpa ini, pemanggilan ulang (mis. setelah render ulang shell) membuat
  // polling 5 detik berjalan berganda.
  if (initSyncIndicator._initialized) return;
  initSyncIndicator._initialized = true;

  // Listeners
  window.addEventListener('online', update);
  window.addEventListener('offline', update);
  // Router mengumumkan pergantian halaman SETELAH DOM-nya terpasang
  // (src/lib/router.js), jadi saat itu juga pil dapat dipindahkan ke dalam
  // kartu login — tanpa menunggu polling 5 detik berikutnya.
  window.addEventListener('route-changed', update);

  // Poll for pending drafts every 5 seconds
  // Catatan: `update()` hanya membaca IndexedDB lokal (hasPendingDrafts),
  // tidak menyentuh jaringan — jadi tidak menambah egress Supabase.
  initSyncIndicator._intervalId = setInterval(update, 5000);
  update();

  // Rute dirender secara asinkron, dan isi #app bisa diganti lebih dari sekali
  // (mis. render awal lalu render ulang setelah status autentikasi diketahui).
  // Pil yang sudah dipindahkan ke dalam kartu akan IKUT TERHAPUS bersama kartu
  // lamanya, sehingga sempat hilang sampai polling 5 detik memasangnya kembali.
  // Pengamat ini memasangnya kembali secepatnya — sekali per frame, dan
  // pindahkan() tidak menyentuh DOM kalau posisinya sudah benar.
  let tertunda = false;
  const pengamat = new MutationObserver(() => {
    if (tertunda) return;
    tertunda = true;
    requestAnimationFrame(() => {
      tertunda = false;
      pindahkan();
    });
  });
  pengamat.observe(document.body, { childList: true, subtree: true });
  pindahkan();
}

/** Hentikan polling (dipakai saat logout / pembersihan). */
export function stopSyncIndicator() {
  if (initSyncIndicator._intervalId) {
    clearInterval(initSyncIndicator._intervalId);
    initSyncIndicator._intervalId = null;
  }
  initSyncIndicator._initialized = false;
}
