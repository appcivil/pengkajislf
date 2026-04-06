/**
 * LOCAL DATA MANAGEMENT
 * IndexedDB wrapper for offline-first data storage
 * Auto-save functionality
 */

// Database configuration
const DB_NAME = 'SLFDatabase';
const DB_VERSION = 2;

// Store names
const STORES = {
  PROJECTS: 'projects',
  CHECKLISTS: 'checklists',
  PHOTOS: 'photos',
  NDT_TESTS: 'ndt_tests',
  ANALYSIS: 'analysis',
  SYNC_QUEUE: 'sync_queue',
  BACKUPS: 'backups'
};

// Initialize IndexedDB
let db = null;

export async function initLocalDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };
    
    request.onupgradeneeded = (event) => {
      const database = event.target.result;
      
      // Projects store
      if (!database.objectStoreNames.contains(STORES.PROJECTS)) {
        const projectStore = database.createObjectStore(STORES.PROJECTS, { keyPath: 'id' });
        projectStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        projectStore.createIndex('syncStatus', 'syncStatus', { unique: false });
      }
      
      // Checklists store
      if (!database.objectStoreNames.contains(STORES.CHECKLISTS)) {
        const checklistStore = database.createObjectStore(STORES.CHECKLISTS, { keyPath: 'id' });
        checklistStore.createIndex('proyekId', 'proyekId', { unique: false });
        checklistStore.createIndex('tier', 'tier', { unique: false });
      }
      
      // Photos store
      if (!database.objectStoreNames.contains(STORES.PHOTOS)) {
        const photoStore = database.createObjectStore(STORES.PHOTOS, { keyPath: 'id' });
        photoStore.createIndex('proyekId', 'proyekId', { unique: false });
        photoStore.createIndex('itemKode', 'itemKode', { unique: false });
      }
      
      // NDT Tests store
      if (!database.objectStoreNames.contains(STORES.NDT_TESTS)) {
        const ndtStore = database.createObjectStore(STORES.NDT_TESTS, { keyPath: 'id' });
        ndtStore.createIndex('proyekId', 'proyekId', { unique: false });
        ndtStore.createIndex('type', 'type', { unique: false });
      }
      
      // Analysis store
      if (!database.objectStoreNames.contains(STORES.ANALYSIS)) {
        const analysisStore = database.createObjectStore(STORES.ANALYSIS, { keyPath: 'id' });
        analysisStore.createIndex('proyekId', 'proyekId', { unique: false });
      }
      
      // Sync queue
      if (!database.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
        database.createObjectStore(STORES.SYNC_QUEUE, { keyPath: 'id', autoIncrement: true });
      }
      
      // Backups
      if (!database.objectStoreNames.contains(STORES.BACKUPS)) {
        const backupStore = database.createObjectStore(STORES.BACKUPS, { keyPath: 'id' });
        backupStore.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };
  });
}

// Generic CRUD operations
export async function dbPut(storeName, data) {
  if (!db) await initLocalDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    
    const request = store.put(data);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function dbGet(storeName, id) {
  if (!db) await initLocalDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function dbGetAll(storeName, indexName = null, query = null) {
  if (!db) await initLocalDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    
    let request;
    if (indexName) {
      const index = store.index(indexName);
      request = query ? index.getAll(query) : index.getAll();
    } else {
      request = store.getAll();
    }
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function dbDelete(storeName, id) {
  if (!db) await initLocalDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Project-specific operations
export async function saveProject(projectData) {
  const data = {
    ...projectData,
    updatedAt: new Date().toISOString(),
    syncStatus: 'pending'
  };
  return dbPut(STORES.PROJECTS, data);
}

export async function getProject(id) {
  return dbGet(STORES.PROJECTS, id);
}

export async function getAllProjects() {
  return dbGetAll(STORES.PROJECTS, 'updatedAt');
}

export async function deleteProject(id) {
  // Delete project and all related data
  await dbDelete(STORES.PROJECTS, id);
  
  // Delete related checklists
  const checklists = await dbGetAll(STORES.CHECKLISTS, 'proyekId', id);
  await Promise.all(checklists.map(c => dbDelete(STORES.CHECKLISTS, c.id)));
  
  // Delete related photos
  const photos = await dbGetAll(STORES.PHOTOS, 'proyekId', id);
  await Promise.all(photos.map(p => dbDelete(STORES.PHOTOS, p.id)));
}

// Checklist operations
export async function saveChecklist(proyekId, tier, checklistData) {
  const id = `${proyekId}_${tier}`;
  const data = {
    id,
    proyekId,
    tier,
    data: checklistData,
    updatedAt: new Date().toISOString(),
    syncStatus: 'pending'
  };
  return dbPut(STORES.CHECKLISTS, data);
}

export async function getChecklist(proyekId, tier) {
  return dbGet(STORES.CHECKLISTS, `${proyekId}_${tier}`);
}

// Photo operations
export async function savePhoto(photoData) {
  const data = {
    ...photoData,
    id: photoData.id || `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
    syncStatus: 'pending'
  };
  return dbPut(STORES.PHOTOS, data);
}

export async function getPhotosByProject(proyekId) {
  return dbGetAll(STORES.PHOTOS, 'proyekId', proyekId);
}

export async function getPhotosByItem(proyekId, itemKode) {
  const photos = await dbGetAll(STORES.PHOTOS, 'proyekId', proyekId);
  return photos.filter(p => p.itemKode === itemKode);
}

// NDT Test operations
export async function saveNDTTest(testData) {
  const data = {
    ...testData,
    id: testData.id || `ndt_${Date.now()}`,
    createdAt: new Date().toISOString()
  };
  return dbPut(STORES.NDT_TESTS, data);
}

export async function getNDTTestsByProject(proyekId) {
  return dbGetAll(STORES.NDT_TESTS, 'proyekId', proyekId);
}

export async function getNDTTestsByType(proyekId, type) {
  const tests = await dbGetAll(STORES.NDT_TESTS, 'proyekId', proyekId);
  return tests.filter(t => t.type === type);
}

// ==========================================
// AUTO-SAVE FUNCTIONALITY
// ==========================================

const AUTO_SAVE_DELAY = 5000; // 5 seconds
const autoSaveTimers = {};

/**
 * Schedule auto-save for a project
 */
export function scheduleAutoSave(proyekId, saveFunction) {
  // Clear existing timer
  if (autoSaveTimers[proyekId]) {
    clearTimeout(autoSaveTimers[proyekId]);
  }
  
  // Set new timer
  autoSaveTimers[proyekId] = setTimeout(async () => {
    try {
      await saveFunction();
      showSaveIndicator(proyekId, 'saved');
    } catch (error) {
      console.error('[AutoSave] Error:', error);
      showSaveIndicator(proyekId, 'error');
    }
  }, AUTO_SAVE_DELAY);
  
  showSaveIndicator(proyekId, 'saving');
}

/**
 * Cancel scheduled auto-save
 */
export function cancelAutoSave(proyekId) {
  if (autoSaveTimers[proyekId]) {
    clearTimeout(autoSaveTimers[proyekId]);
    delete autoSaveTimers[proyekId];
  }
}

function showSaveIndicator(proyekId, status) {
  const indicator = document.getElementById(`save-indicator-${proyekId}`);
  if (!indicator) return;
  
  const icons = {
    saving: '<i class="fas fa-circle-notch fa-spin"></i>',
    saved: '<i class="fas fa-check"></i>',
    error: '<i class="fas fa-exclamation-triangle"></i>'
  };
  
  const texts = {
    saving: 'Menyimpan...',
    saved: 'Tersimpan',
    error: 'Gagal menyimpan'
  };
  
  const colors = {
    saving: 'var(--text-tertiary)',
    saved: 'var(--success-400)',
    error: 'var(--danger-400)'
  };
  
  indicator.innerHTML = `${icons[status]} ${texts[status]}`;
  indicator.style.color = colors[status];
  indicator.style.display = 'flex';
  
  if (status === 'saved') {
    setTimeout(() => {
      indicator.style.display = 'none';
    }, 3000);
  }
}

// ==========================================
// IMPORT/EXPORT FUNCTIONALITY
// ==========================================

/**
 * Export entire project as JSON
 */
export async function exportProjectToJSON(proyekId) {
  const project = await getProject(proyekId);
  if (!project) throw new Error('Project not found');
  
  const checklistTier1 = await getChecklist(proyekId, 'tier1');
  const checklistTier2 = await getChecklist(proyekId, 'tier2');
  const checklistTier3 = await getChecklist(proyekId, 'tier3');
  const photos = await getPhotosByProject(proyekId);
  const ndtTests = await getNDTTestsByProject(proyekId);
  
  const exportData = {
    version: '2.1',
    exportedAt: new Date().toISOString(),
    project,
    checklists: {
      tier1: checklistTier1?.data || {},
      tier2: checklistTier2?.data || {},
      tier3: checklistTier3?.data || {}
    },
    photos: photos.map(p => ({
      ...p,
      // Exclude actual image data for performance, include reference
      imageData: p.imageData ? '[BASE64_IMAGE]' : null
    })),
    ndtTests
  };
  
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `SLF_Project_${project.nama_bangunan || proyekId}_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  return exportData;
}

/**
 * Import project from JSON
 */
export async function importProjectFromJSON(jsonString) {
  const data = JSON.parse(jsonString);
  
  if (!data.project) {
    throw new Error('Invalid project file');
  }
  
  // Generate new ID for imported project
  const newId = `imported_${Date.now()}`;
  const project = {
    ...data.project,
    id: newId,
    importedAt: new Date().toISOString(),
    originalId: data.project.id
  };
  
  // Save project
  await saveProject(project);
  
  // Save checklists
  if (data.checklists?.tier1) {
    await saveChecklist(newId, 'tier1', data.checklists.tier1);
  }
  if (data.checklists?.tier2) {
    await saveChecklist(newId, 'tier2', data.checklists.tier2);
  }
  if (data.checklists?.tier3) {
    await saveChecklist(newId, 'tier3', data.checklists.tier3);
  }
  
  // Save NDT tests
  if (data.ndtTests) {
    for (const test of data.ndtTests) {
      await saveNDTTest({
        ...test,
        id: `${newId}_${test.id}`,
        proyekId: newId
      });
    }
  }
  
  // Note: Photos need to be re-uploaded as they contain base64 data
  
  return { id: newId, project };
}

/**
 * Create backup of all data
 */
export async function createFullBackup() {
  const backup = {
    id: `backup_${Date.now()}`,
    createdAt: new Date().toISOString(),
    projects: await dbGetAll(STORES.PROJECTS),
    checklists: await dbGetAll(STORES.CHECKLISTS),
    ndtTests: await dbGetAll(STORES.NDT_TESTS)
  };
  
  await dbPut(STORES.BACKUPS, backup);
  
  // Export as file
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `SLF_Full_Backup_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  return backup;
}

/**
 * Restore from backup
 */
export async function restoreFromBackup(backupData) {
  const data = typeof backupData === 'string' ? JSON.parse(backupData) : backupData;
  
  // Restore projects
  if (data.projects) {
    for (const project of data.projects) {
      await dbPut(STORES.PROJECTS, project);
    }
  }
  
  // Restore checklists
  if (data.checklists) {
    for (const checklist of data.checklists) {
      await dbPut(STORES.CHECKLISTS, checklist);
    }
  }
  
  // Restore NDT tests
  if (data.ndtTests) {
    for (const test of data.ndtTests) {
      await dbPut(STORES.NDT_TESTS, test);
    }
  }
  
  return { 
    projectsRestored: data.projects?.length || 0,
    checklistsRestored: data.checklists?.length || 0,
    testsRestored: data.ndtTests?.length || 0
  };
}

export { STORES };
