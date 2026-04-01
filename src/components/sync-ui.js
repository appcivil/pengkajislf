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

  // Listeners
  window.addEventListener('online', update);
  window.addEventListener('offline', update);
  
  // Poll for pending drafts every 5 seconds
  setInterval(update, 5000);
  update();
}
