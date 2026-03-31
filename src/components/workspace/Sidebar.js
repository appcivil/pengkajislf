/**
 * WORKSPACE SIDEBAR
 * macOS-inspired translucent sidebar for navigation.
 */
import { store, updateWorkspace } from '../../lib/store.js';

export function renderSidebar() {
  const { workspace, ui } = store.get();
  
  const sections = [
    {
      label: 'Favorites',
      items: [
        { id: 'recent', label: 'Recents', icon: 'fa-clock', view: 'recent' },
        { id: 'projects', label: 'Projects', icon: 'fa-folder', view: 'projects' },
        { id: 'icloud', label: 'AI File Nexus', icon: 'fa-cloud', view: 'smart' }
      ]
    },
    {
      label: 'Smart Collections',
      items: [
        { id: 'incomplete', label: 'Incomplete', icon: 'fa-exclamation-circle', filter: 'incomplete' },
        { id: 'needs-review', label: 'Needs Review', icon: 'fa-eye', filter: 'review' },
        { id: 'final', label: 'Final Documents', icon: 'fa-check-double', filter: 'final' }
      ]
    },
    {
      label: 'Engineering',
      items: [
        { id: 'standards', label: 'Standards & SNI', icon: 'fa-book', view: 'standards' },
        { id: 'evidence', label: 'Evidence Vault', icon: 'fa-camera', view: 'evidence' },
        { id: 'tasks', label: 'AI Tasks', icon: 'fa-robot', view: 'tasks' }
      ]
    }
  ];

  return `
    <aside class="workspace-sidebar">
      <!-- Traffic Lights -->
      <div class="mac-traffic">
        <div class="mac-dot red"></div>
        <div class="mac-dot yellow"></div>
        <div class="mac-dot green"></div>
      </div>

      ${sections.map(section => `
        <div class="sidebar-label" style="font-size:0.6rem; font-weight:800; color:var(--tertiary); text-transform:uppercase; margin:16px 0 8px 8px; letter-spacing:0.05em">
          ${section.label}
        </div>
        ${section.items.map(item => {
          const isActive = (item.view && workspace.activeView === item.view) || 
                          (item.filter && workspace.smartFilter === item.filter);
          return `
            <button class="drive-nav-item ${isActive ? 'active' : ''}" 
                    onclick="window._handleWorkspaceNav('${item.view || ''}', '${item.filter || ''}')">
              <i class="fas ${item.icon}"></i>
              <span>${item.label}</span>
            </button>
          `;
        }).join('')}
      `).join('')}

      <div style="flex:1"></div>

      <div class="sidebar-footer" style="padding:12px; border-top:1px solid var(--border); opacity:0.8">
        <div class="flex items-center gap-2 text-[0.65rem] font-extrabold uppercase">
          <i class="fas ${ui.isOnline ? 'fa-signal text-success' : 'fa-plane text-warning'}"></i>
          <span>${ui.isOnline ? 'Online' : 'Offline Mode'}</span>
          <div class="status-dot ${ui.isOnline ? 'green' : 'yellow animate-pulse'}" style="margin-left:auto"></div>
        </div>
      </div>
    </aside>
  `;
}

window._handleWorkspaceNav = (view, filter) => {
  updateWorkspace({ 
    activeView: view || 'smart', 
    smartFilter: filter || null, 
    selectedFileId: null 
  });
  // The page renderer will pick up the change
};
