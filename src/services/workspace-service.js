/**
 * WORKSPACE SERVICE
 * Central logic for file loading, selection, and workspace coordination.
 */
import { supabase } from '../lib/supabase.js';
import { store, updateFiles, updateWorkspace } from '../lib/store.js';
import { analyzeDocumentIntelligence } from './ai-workspace-service.js';
import { deleteFromGoogleDrive } from '../lib/drive.js';

export async function loadWorkspaceData(proyekId = null) {
  console.log(`[WorkspaceService] Memuat data workspace untuk: ${proyekId || 'Global'}`);
  try {
    // 1. Fetch Global or Project-specific Files
    let query = supabase.from('proyek_files').select('*, proyek(nama_bangunan)');
    if (proyekId) query = query.eq('proyek_id', proyekId);
    
    console.log("[WorkspaceService] Mengambil data pembanding & berkas...");
    const [ fileRes, projRes ] = await Promise.all([
      query.order('created_at', { ascending: false }),
      supabase.from('proyek').select('id, nama_bangunan, created_at').order('created_at', { ascending: false })
    ]);

    if (fileRes.error) throw new Error(`Berkas: ${fileRes.error.message}`);
    if (projRes.error) throw new Error(`Proyek: ${projRes.error.message}`);

    const files = fileRes.data || [];
    const projects = projRes.data || [];

    console.log(`[WorkspaceService] Pengambilan selesai: ${files.length} berkas, ${projects.length} proyek.`);

    // 2. Update Store
    updateFiles({ documents: files });
    updateWorkspace({ selectedProjectId: proyekId });
    window._allProjects = projects; 

    return true;
  } catch (err) {
    console.error("[WorkspaceService] Gagal memuat data workspace:", err.message);
    throw err;
  }
}

export async function selectFile(fileId) {
    updateWorkspace({ selectedFileId: fileId });
    
    // Auto-analyze if it hasn't been analyzed yet
    const { documents } = store.get().files;
    const file = documents.find(f => f.id === fileId);
    
    if (file && !file.ai_status) {
        console.log("[Workspace] Auto-triggering AI Analysis...");
        try {
            await analyzeDocumentIntelligence(fileId);
            // Re-load to update UI
            const { selectedProjectId } = store.get().workspace;
            await loadWorkspaceData(selectedProjectId);
        } catch (err) {
            console.error("AI Auto-analysis failed:", err);
        }
    }
}

/**
 * KEYBOARD CONTROLLER
 * Spacebar for Quick Look, Ctrl+K for Command Palette.
 */
export function initWorkspaceHotkeys() {
  window.onkeydown = (e) => {
    // 1. Quick Look (Space)
    if (e.code === 'Space' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
       e.preventDefault();
       const { selectedFileId } = store.get().workspace;
       if (selectedFileId && !window._quickLookOpen) {
          window._openQuickLook(selectedFileId);
       } else if (window._quickLookOpen) {
          window._closeQuickLook();
       }
    }

    // 2. Command Palette (Ctrl+K)
    if (e.ctrlKey && e.key === 'k') {
       e.preventDefault();
       window._openCommandPalette();
    }

    // 3. Escape to close everything
    if (e.key === 'Escape') {
       window._closeQuickLook();
       window._closeCommandPalette();
    }
  };
}

export async function deleteWorkspaceFile(fileId) {
    if (!confirm("Hapus file dari workspace? Berkas akan dipindahkan ke Kotak Sampah Google Drive (otomatis terhapus permanen dalam 30 hari).")) return false;
    
    try {
        // 1. Get file details for cleanup
        const { data: file } = await supabase.from('proyek_files')
            .select('id, file_url, drive_id, proyek_id')
            .eq('id', fileId)
            .maybeSingle();

        if (!file) return false;

        // 2. Sync with Google Drive (Trash)
        if (file.drive_id) {
            console.log(`[WorkspaceService] Moving Drive File to Trash: ${file.drive_id}`);
            const { currentProyek } = store.get();
            await deleteFromGoogleDrive(file.drive_id, currentProyek?.drive_proxy_url);
        }

        // 3. Cleanup Rujukan in Checklist Items (Daftar Simak)
        const { data: linkedItems } = await supabase.from('checklist_items')
            .select('id, foto_urls, evidence_links')
            .eq('proyek_id', file.proyek_id);

        if (linkedItems && linkedItems.length > 0) {
            for (const item of linkedItems) {
                let isModified = false;
                let nextUrls = item.foto_urls || [];
                let nextEvidence = item.evidence_links || [];

                // Filter out URL
                if (nextUrls.includes(file.file_url)) {
                    nextUrls = nextUrls.filter(u => u !== file.file_url);
                    isModified = true;
                }

                // Filter out Evidence Mapping
                const prevLen = nextEvidence.length;
                nextEvidence = nextEvidence.filter(ev => ev.file_id !== fileId);
                if (nextEvidence.length !== prevLen) isModified = true;

                if (isModified) {
                    await supabase.from('checklist_items').update({
                        foto_urls: nextUrls,
                        evidence_links: nextEvidence
                    }).eq('id', item.id);
                }
            }
        }

        // 4. Delete DB record
        const { error } = await supabase.from('proyek_files').delete().eq('id', fileId);
        if (!error) {
            const { selectedProjectId } = store.get().workspace;
            await loadWorkspaceData(selectedProjectId);
            updateWorkspace({ selectedFileId: null });
            return true;
        }
    } catch (err) {
        console.error("[WorkspaceService] Cleanup & Delete failed:", err);
    }
    return false;
}

window._addTag = async (fileId) => {
   const tag = prompt("Masukan tag baru:");
   if (!tag) return;

   const { documents } = store.get().files;
   const file = documents.find(f => f.id === fileId);
   const metadata = file.metadata || {};
   const tags = metadata.tags || [];
   
   if (!tags.includes(tag)) {
      tags.push(tag);
      const newMetadata = { ...metadata, tags };
      const { error } = await supabase.from('proyek_files').update({ metadata: newMetadata }).eq('id', fileId);
      if (!error) {
         const { selectedProjectId } = store.get().workspace;
         await loadWorkspaceData(selectedProjectId);
      }
   }
};
