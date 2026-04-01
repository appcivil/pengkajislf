/**
 * Register file metadata in Supabase (Global Documents & Checklist integration).
 * Ensures consistency across SIMBG Documents, Checklist Items, and Gallery.
 */
import { supabase } from './supabase.js';
import { store, updateFiles } from './store.js';
import { uploadToGoogleDrive } from './drive.js';

export async function registerFileMetadata(proyekId, url, name, category, subcategory = '', driveId = null) {
    try {
        // 1. Record in Global Documents (proyek_files)
        const payload = {
            proyek_id: proyekId,
            name: name,
            file_url: url,
            drive_id: driveId,
            category: category || 'Umum',
            subcategory: subcategory,
            storage_type: 'google_drive',
            ai_status: 'pending',
            metadata: { 
                last_sync: new Date().toISOString(),
                original_name: name
            }
        };

        // Find existing record to preserve metadata or perform update
        const { data: existing } = await supabase.from('proyek_files')
            .select('id, metadata')
            .eq('proyek_id', proyekId)
            .eq('name', name)
            .maybeSingle();

        let fileRecord;
        if (existing) {
            const { data, error } = await supabase.from('proyek_files')
                .update({ 
                    ...payload, 
                    metadata: { ...(existing.metadata || {}), ...payload.metadata } 
                })
                .eq('id', existing.id)
                .select()
                .single();
            if (error) throw error;
            fileRecord = data;
        } else {
            const { data, error } = await supabase.from('proyek_files')
                .insert([payload])
                .select()
                .single();
            if (error) throw error;
            fileRecord = data;
        }

        // 2. Cross-Sync to Checklist (Daftar Simak)
        // Detect Checklist Code (A01, B02, etc) from Subcategory or Name
        const searchStr = (subcategory + ' ' + name).toUpperCase();
        const kodeMatch = searchStr.match(/[A-Z]\d{2}/);
        
        if (kodeMatch) {
            const kode = kodeMatch[0];
            console.log(`[FileSync] Detected Checklist Code: ${kode} for ${name}`);
            
            const { data: item } = await supabase.from('checklist_items')
                .select('id, foto_urls, evidence_links, metadata')
                .eq('proyek_id', proyekId)
                .eq('kode', kode)
                .maybeSingle();

            if (item) {
                const currentUrls = item.foto_urls || [];
                const currentEvidence = item.evidence_links || [];
                
                if (!currentUrls.includes(url)) {
                    const newUrls = [...currentUrls, url];
                    const newEvidence = [...currentEvidence, {
                        file_id: fileRecord.id,
                        url: url,
                        name: name,
                        type: 'document',
                        synced_at: new Date().toISOString()
                    }];

                    await supabase.from('checklist_items').update({
                        foto_urls: newUrls,
                        evidence_links: newEvidence,
                        metadata: { ...(item.metadata || {}), drive_sync: true, last_file_id: fileRecord.id }
                    }).eq('id', item.id);
                    
                    // Update global store if active
                    const state = store.get();
                    if (state.checklist?.dataMap?.[kode]) {
                        const updatedItem = { 
                            ...state.checklist.dataMap[kode], 
                            foto_urls: newUrls,
                            evidence_links: newEvidence
                        };
                        // Trigger UI update for checklist if needed
                        if (window._refreshChecklistUI) window._refreshChecklistUI(kode, updatedItem);
                    }
                }
            }
        }

        return true;
    } catch (err) {
        console.error("[FileSync] Registration failed:", err);
        return false;
    }
}

/**
 * Upload a single file to Google Drive and record in Supabase.
 */
export async function uploadSingleFile(file, proyekId, category, subcategory, driveProxyUrl) {
  try {
    updateFiles({ isSyncing: true, syncProgress: 10 });
    
    // Read file as Base64
    const b64 = await fileToBase64(file);
    updateFiles({ syncProgress: 30 });

    // 1. Upload to Google Drive (via Proxy)
    const results = await uploadToGoogleDrive(
        [{ base64: b64, mimeType: file.type, name: file.name }], 
        proyekId, 
        category, 
        subcategory, 
        driveProxyUrl
    );

    if (!results?.length) throw new Error("Gagal mengunggah ke Google Drive Workspace.");
    updateFiles({ syncProgress: 70 });

    // 2. Integrated Registration (Global + Checklist Sync)
    await registerFileMetadata(proyekId, results[0].url, file.name, category, subcategory, results[0].id);

    updateFiles({ isSyncing: false, syncProgress: 100 });
    return results[0].url;

  } catch (err) {
    updateFiles({ isSyncing: false, syncProgress: 0 });
    throw err;
  }
}

/**
 * Sync Document status with SIMBG Portal (Simulated Real-time Progress)
 */
export async function syncWithSIMBG(proyekId) {
    try {
        updateFiles({ isSyncing: true, syncProgress: 0 });
        
        // Simulation of multi-step bot process
        const steps = [
            { p: 15, msg: 'Membuka Browser Headless SIMBG...' },
            { p: 35, msg: 'Autentikasi Akun Konsultan...' },
            { p: 55, msg: 'Memeriksa Kelengkapan Berkas...' },
            { p: 75, msg: 'Sinkronisasi Digital Fingerprint...' },
            { p: 90, msg: 'Memvalidasi Status Kelaikan...' },
            { p: 100, msg: 'Sinkronisasi Selesai!' }
        ];

        for (const step of steps) {
            updateFiles({ syncProgress: step.p });
            // Wait for visual feedback
            await new Promise(r => setTimeout(r, 600));
        }

        updateFiles({ isSyncing: false });
        return true;
    } catch (err) {
        updateFiles({ isSyncing: false });
        throw err;
    }
}

/**
 * Helper: File to Base64
 */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = error => reject(error);
  });
}

