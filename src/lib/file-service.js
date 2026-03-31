/**
 * FILE SERVICE
 * Orchestrates document & image management across Google Drive and Supabase.
 */
import { supabase } from './supabase.js';
import { store, updateFiles } from './store.js';
import { uploadToGoogleDrive } from './drive.js';

/**
 * Upload a single file to Google Drive and record in Supabase.
 * @param {File} file 
 * @param {string} proyekId 
 * @param {string} category 
 * @param {string} subcategory 
 * @param {string} driveProxyUrl 
 */
export async function uploadSingleFile(file, proyekId, category, subcategory, driveProxyUrl) {
  try {
    updateFiles({ isSyncing: true, syncProgress: 10 });
    
    // Read file as Base64
    const b64 = await fileToBase64(file);
    updateFiles({ syncProgress: 30 });

    // 1. Upload to Google Drive (via Proxy)
    const urls = await uploadToGoogleDrive(
        [{ base64: b64, mimeType: file.type, name: file.name }], 
        proyekId, 
        category, 
        subcategory, 
        driveProxyUrl
    );

    if (!urls?.length) throw new Error("Gagal mengunggah ke Google Drive Workspace.");
    updateFiles({ syncProgress: 70 });

    // 2. Prepare Payload for Supabase
    const payload = {
        proyek_id: proyekId,
        name: file.name,
        file_url: urls[0],
        category: category,
        subcategory: subcategory,
        storage_type: 'google_drive',
        metadata: {
            size: file.size,
            type: file.type,
            lastModified: file.lastModified
        }
    };

    // 3. Upsert into Supabase
    // Check for existing file with same subcategory in same project
    const { data: existing } = await supabase.from('proyek_files')
        .select('id')
        .eq('proyek_id', proyekId)
        .eq('category', category)
        .eq('subcategory', subcategory)
        .maybeSingle();

    if (existing) {
        await supabase.from('proyek_files').update(payload).eq('id', existing.id);
    } else {
        await supabase.from('proyek_files').insert([payload]);
    }

    updateFiles({ isSyncing: false, syncProgress: 100 });
    return urls[0];

  } catch (err) {
    updateFiles({ isSyncing: false, syncProgress: 0 });
    throw err;
  }
}

/**
 * Sync Document status with SIMBG Portal (Simulated Real-time Progress)
 * @param {string} proyekId 
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
