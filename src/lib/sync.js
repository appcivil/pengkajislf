/**
 * Offline Sync Utility (IndexedDB)
 * Handles local storage of inspection drafts when offline.
 */

const DB_NAME = 'SmartAISyncDB';
const DB_VERSION = 2; // Bumped for image_queue store creation
const STORE_NAME = 'checklist_drafts';
const IMAGE_STORE = 'image_queue';

/**
 * Initialize IndexedDB
 */
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(IMAGE_STORE)) {
        db.createObjectStore(IMAGE_STORE, { keyPath: 'id' });
      }
    };
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e.target.error);
  });
}

/**
 * Save checklist items to local draft
 * @param {Array} items - List of checklist items
 */
export async function saveOfflineDrafts(items) {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  
  for (const item of items) {
    // Generate unique ID for IndexedDB
    const draft = { ...item, id: `${item.proyek_id}_${item.kode}` };
    store.put(draft);
  }
  
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Get all pending drafts
 */
export async function getPendingDrafts() {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readonly');
  const store = tx.objectStore(STORE_NAME);
  const request = store.getAll();
  
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Check if there are any pending items
 */
export async function hasPendingDrafts() {
  const db = await openDB();
  const tx = db.transaction([STORE_NAME, IMAGE_STORE], 'readonly');
  const drafts = tx.objectStore(STORE_NAME).count();
  const imgs = tx.objectStore(IMAGE_STORE).count();

  return new Promise((resolve) => {
    let dCount = 0;
    let iCount = 0;
    drafts.onsuccess = () => { dCount = drafts.result; };
    imgs.onsuccess = () => { iCount = imgs.result; };
    tx.oncomplete = () => resolve(dCount > 0 || iCount > 0);
    tx.onerror = () => resolve(false);
  });
}

/**
 * Clear specific drafts after successful sync
 * @param {Array} ids - List of draft IDs (proyek_id_kode)
 */
export async function clearSyncedDrafts(ids) {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  
  for (const id of ids) {
    store.delete(id);
  }
  
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Save image to offline queue
 */
export async function saveImageToQueue(proyekId, kode, file, metadata) {
  const db = await openDB();
  const id = `img_${proyekId}_${kode}_${Date.now()}`;
  const tx = db.transaction(IMAGE_STORE, 'readwrite');
  tx.objectStore(IMAGE_STORE).put({ id, proyekId, kode, file, metadata, status: 'pending' });
  return new Promise((res, rej) => { tx.oncomplete = res; tx.onerror = rej; });
}

/**
 * Background Sync Engine - Runs when back online
 */
export async function startBackgroundSync(supabase, uploadToDrive) {
  if (!navigator.onLine) return;

  const drafts = await getPendingDrafts();
  const images = await getPendingImages();

  if (drafts.length === 0 && images.length === 0) return;

  console.log(`[Sync Engine] Starting background sync: ${drafts.length} drafts, ${images.length} images.`);

  // 1. Sync Checklist Drafts
  for (const draft of drafts) {
    try {
      const { id, ...data } = draft;
      
      // Data Integrity Fallback for legacy drafts missing 'nama' or other fields
      const syncData = {
        ...data,
        nama: data.nama || 'Item Pemeriksaan',
        foto_urls: data.foto_urls || [],
        metadata: data.metadata || {}
      };

      const { error } = await supabase.from('checklist_items').upsert(syncData, { onConflict: 'proyek_id,kode' });
      if (!error) await clearSyncedDrafts([id]);
    } catch (e) { console.error("Sync failed for item:", draft.kode, e); }
  }

  // 2. Sync Image Queue
  for (const img of images) {
    try {
      // Re-trigger drive upload
      await uploadToDrive(img.file, img.proyekId, img.kode, img.metadata);
      await clearSyncedImage(img.id);
    } catch (e) { console.error("Image sync failed:", img.id, e); }
  }
}

async function getPendingImages() {
  const db = await openDB();
  const tx = db.transaction(IMAGE_STORE, 'readonly');
  const request = tx.objectStore(IMAGE_STORE).getAll();
  return new Promise(res => { request.onsuccess = () => res(request.result); });
}

async function clearSyncedImage(id) {
  const db = await openDB();
  const tx = db.transaction(IMAGE_STORE, 'readwrite');
  tx.objectStore(IMAGE_STORE).delete(id);
  return new Promise(res => { tx.oncomplete = res; });
}
