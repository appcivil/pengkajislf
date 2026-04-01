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

  // Set saving state for UI feedback
  updateChecklist({ isSaving: true });

  // 1. Prepare Payload (Cleanup and ensure consistent types)
  const itemsMap = new Map();
  
  Object.values(checklist.dataMap)
    .filter(item => item.status && item.status !== '')
    .forEach(item => {
        const cleaned = { 
           kode: item.kode,
           nama: item.nama || 'Item Pemeriksaan',
           status: item.status || null,
           catatan: item.catatan || null,
           rekomendasi: item.rekomendasi || null,
           remedy_time: item.remedy_time || null,
           foto_urls: Array.isArray(item.foto_urls) ? item.foto_urls : [],
           evidence_links: Array.isArray(item.evidence_links) ? item.evidence_links : [],
           nilai: Number(item.nilai) || 0,
           bobot: Number(item.bobot) || 0,
           is_wajib: Boolean(item.is_wajib),
           metadata: typeof item.metadata === 'object' ? item.metadata : {},
           kategori: item.kategori || 'teknis',
           sub_kategori: item.sub_kategori || null,
           aspek: item.aspek || null,
           proyek_id: currentProyekId
        };
        
        // ONLY send ID if it's a valid UUID
        if (item.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.id)) {
           cleaned.id = item.id;
        }

        // Deduplicate by kode (latest one wins)
        itemsMap.set(item.kode, cleaned);
    });

  const validItems = Array.from(itemsMap.values());

  if (validItems.length === 0) {
    if (showToast) showInfo('Pekerjaan disimpan.');
    updateChecklist({ isSaving: false });
    return;
  }

  try {
    // 2. ALWAYS Save to Offline Storage (IndexedDB/Cache)
    await saveOfflineDrafts(validItems);

    // 3. If Online, Sync to Supabase
    if (navigator.onLine) {
      const { error } = await supabase.from('checklist_items').upsert(
        validItems, 
        { onConflict: 'proyek_id,kode' }
      );

      if (error) throw error;

      // Update Project Progress (Calculated weight)
      // Assuming 120 items total for a full building audit
      const progress = Math.min(45, Math.round((validItems.length / 120) * 100));
      await supabase.from('proyek').update({ progress }).eq('id', currentProyekId);

      if (showToast) {
        logActivity('SIMPAN_CHECKLIST', currentProyekId, { items_count: validItems.length });
        showSuccess('Data berhasil disinkronkan!');
      }
      
      updateChecklist({ 
        isDirty: false, 
        dirtyKodes: new Set(), 
        lastSaveTime: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) 
      });
    } else {
      if (showToast) showInfo('Mode Offline: Tersimpan di perangkat.');
    }
  } catch (err) {
    console.error("[SaveError]", err);
    let msg = err.message;
    if (msg.includes("column") && msg.includes("not found")) {
      msg = `Kolom database belum sinkron. Harap jalankan SQL Update v14.1 (Error: ${msg})`;
    }
    if (showToast) showError('Gagal menyimpan: ' + msg);
  } finally {
    // Small delay to prevent flickering on fast connections
    setTimeout(() => {
        updateChecklist({ isSaving: false });
    }, 800);
  }
}
