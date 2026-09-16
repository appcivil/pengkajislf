/**
 * SYNC UI COMPONENT
 * Monitors connection status and pending offline drafts.
 */
import { hasPendingDrafts } from '../lib/sync.js';

export function initSyncIndicator() {
  const container = document.getElementById('sync-indicator-root');
  if (!container) return;

  const update = async () => {
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

  // Poll for pending drafts every 5 seconds
  // Catatan: `update()` hanya membaca IndexedDB lokal (hasPendingDrafts),
  // tidak menyentuh jaringan — jadi tidak menambah egress Supabase.
  initSyncIndicator._intervalId = setInterval(update, 5000);
  update();
}

/** Hentikan polling (dipakai saat logout / pembersihan). */
export function stopSyncIndicator() {
  if (initSyncIndicator._intervalId) {
    clearInterval(initSyncIndicator._intervalId);
    initSyncIndicator._intervalId = null;
  }
  initSyncIndicator._initialized = false;
}
