/**
 * CENTRALIZED APP STORE (Checklist Expansion)
 * Manages application state reactively.
 */

class Store {
  constructor(initialState = {}) {
    const persisted = localStorage.getItem('slf_app_state');
    this.state = persisted ? { ...initialState, ...JSON.parse(persisted) } : initialState;
    this.listeners = new Set();
    
    // Initial Sync Status
    this.state.ui = { ...this.state.ui, isOnline: navigator.onLine };
  }

  get() {
    return this.state;
  }

  set(newState) {
    this.state = { ...this.state, ...newState };
    this.persist();
    this.notify();
  }

  persist() {
     try {
        // Don't persist sensitive or transient data
        const toPersist = { ...this.state };
        delete toPersist.user; 
        localStorage.setItem('slf_app_state', JSON.stringify(toPersist));
     } catch (e) {
        console.warn("Failed to persist state", e);
     }
  }

  subscribe(fn) {
    this.listeners.add(fn);
    fn(this.state);
    return () => this.listeners.delete(fn);
  }

  notify() {
    this.listeners.forEach(fn => fn(this.state));
  }
}

// Online/Offline detection
window.addEventListener('online', () => store.set({ ui: { ...store.get().ui, isOnline: true } }));
window.addEventListener('offline', () => store.set({ ui: { ...store.get().ui, isOnline: false } }));

// Global App Store
export const store = new Store({
  user: null,
  currentProyekId: null,
  currentProyek: null,
  currentAnalisis: null,
  
  // Checklist State
  checklist: {
    dataMap: {},
    fotoLinks: {},
    activeTab: 'admin',
    isDirty: false,
    dirtyKodes: new Set(),
    lastSaveTime: null,
    isSaving: false
  },
  
  // Gallery & Files State
  gallery: { photos: [], filter: 'all', activePhoto: null },
  files: { documents: [], activeCategory: 'umum', searchQuery: '', isSyncing: false, syncProgress: 0 },
  
  ui: {
    activeModularTab: 'Administrasi',
    sidebarOpen: window.innerWidth > 768,
    inspectorOpen: true,
    isOnline: navigator.onLine
  },

  workspace: {
    activeView: 'projects', // 'projects' | 'smart' | 'recent' | 'trash'
    viewMode: 'grid', // 'grid' | 'list' | 'columns'
    selectedFileId: null,
    selectedProjectId: null,
    activeInspectorTab: 'preview', // 'preview' | 'info' | 'ai' | 'versions'
    smartFilter: null
  }
});

/**
 * Update Helpers
 */
export const updateUI = (newUIState) => {
  const currentState = store.get();
  store.set({ ui: { ...currentState.ui, ...newUIState } });
};

export const updateChecklist = (newChecklistState) => {
  const currentState = store.get();
  store.set({ checklist: { ...currentState.checklist, ...newChecklistState } });
};

export const updateGallery = (newGalleryState) => {
  const currentState = store.get();
  store.set({ gallery: { ...currentState.gallery, ...newGalleryState } });
};

export const updateFiles = (newFilesState) => {
  const currentState = store.get();
  store.set({ files: { ...currentState.files, ...newFilesState } });
};

export const updateWorkspace = (newWorkspaceState) => {
  const currentState = store.get();
  store.set({ workspace: { ...currentState.workspace, ...newWorkspaceState } });
};

export default store;
