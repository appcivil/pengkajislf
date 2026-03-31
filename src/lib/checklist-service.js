/**
 * CHECKLIST SERVICE
 * Core data orchestration and synchronization for the building checklist system.
 */
import { supabase } from './supabase.js';
import { store, updateChecklist } from './store.js';
import { showSuccess, showError, showInfo } from '../components/toast.js';
import { logActivity } from './audit-service.js';
import { saveOfflineDrafts } from './sync.js';

/**
 * Fetch all checklist items for a project and sync with the store.
 */
export async function loadChecklistData(proyekId) {
  try {
    const { data, error } = await supabase
      .from('checklist_items')
      .select('*')
      .eq('proyek_id', proyekId);

    if (error) throw error;

    const dataMap = {};
    const fotoLinks = {};
    (data || []).forEach(item => {
      dataMap[item.kode] = item;
      fotoLinks[item.kode] = item.foto_urls || [];
    });

    updateChecklist({ 
        dataMap, 
        fotoLinks, 
        isDirty: false, 
        dirtyKodes: new Set() 
    });
    
    return { dataMap, fotoLinks };
  } catch (err) {
    console.error("[ChecklistService] fetch failed:", err);
    return { dataMap: {}, fotoLinks: {} };
  }
}

/**
 * Triggered when a field is modified. Handles auto-save debounce.
 */
let _saveTimer = null;
export function markDirty(kode) {
  const { checklist } = store.get();
  checklist.dirtyKodes.add(kode);
  
  updateChecklist({ isDirty: true });
  
  clearTimeout(_saveTimer);
  _saveTimer = setTimeout(() => doSave(false), 2000);
}

/**
 * Core Save Orchestrator (Cloud + Offline Backup)
 */
export async function doSave(showToast = true) {
  const state = store.get();
  const { currentProyekId, checklist } = state;
  if (!currentProyekId) return;

  if (showToast) updateChecklist({ isSaving: true });

  // 1. Prepare Payload
  const validItems = Object.values(checklist.dataMap)
    .filter(item => item.status && item.status !== '')
    .map(item => ({
       ...item,
       proyek_id: currentProyekId,
       updated_at: new Date().toISOString()
    }));

  if (validItems.length === 0) {
    if (showToast) {
        showInfo('Pekerjaan disimpan. (Belum ada status terisi)');
        updateChecklist({ isSaving: false });
    }
    return;
  }

  try {
    // 2. ALWAYS Save to Offline Storage first (Backup)
    await saveOfflineDrafts(validItems);

    // 3. If Online, Sync to Supabase
    if (navigator.onLine) {
      const { error } = await supabase.from('checklist_items').upsert(
        validItems, 
        { onConflict: 'proyek_id, kode' }
      );

      if (error) throw error;

      // Update Project Progress (Calculated weight)
      const clPct = Math.round((validItems.length / 70) * 100); // 70 is a rough total
      const progress = Math.min(40, Math.round(clPct * 0.4));
      await supabase.from('proyek').update({ progress }).eq('id', currentProyekId);

      if (showToast) {
        logActivity('SIMPAN_CHECKLIST', currentProyekId, { items_count: validItems.length });
        showSuccess('Data berhasil disinkronkan ke Cloud!');
      }
      
      updateChecklist({ isDirty: false, dirtyKodes: new Set(), lastSaveTime: new Date().toISOString() });
    } else {
      if (showToast) showInfo('Mode Offline: Data disimpan di antrean perangkat.');
    }
  } catch (err) {
    showError('Kesalahan sinkronisasi: ' + err.message);
  } finally {
    if (showToast) updateChecklist({ isSaving: false });
  }
}
