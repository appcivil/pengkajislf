/**
 * =========================================================
 * ACCESSIBILITY SERVICE - Supabase & Google Drive Integration
 * Layanan integrasi untuk modul aksesibilitas
 * =========================================================
 */

import { supabase } from './supabase.js';
import { uploadToGoogleDrive, fetchDriveFiles, deleteFromGoogleDrive } from './drive.js';
import { showSuccess, showError, showInfo } from '../components/toast.js';

// ============================================================
// CONSTANTS
// ============================================================

const ACCESSIBILITY_TABLES = {
  SCORES: 'accessibility_scores',
  CORRIDORS: 'accessibility_corridors',
  RAMPS: 'accessibility_ramps',
  STAIRS: 'accessibility_stairs',
  ELEVATORS: 'accessibility_elevators',
  TOILETS: 'accessibility_toilets',
  PARKING: 'accessibility_parking',
  SIGNAGE: 'accessibility_signage',
  INFRASTRUCTURE: 'accessibility_infrastructure',
  FILES: 'accessibility_files',
  REPORTS: 'accessibility_reports'
};

const DRIVE_FOLDER_NAMES = {
  ACCESSIBILITY: 'Aksesibilitas',
  PHOTOS: 'Foto Dokumentasi',
  REPORTS: 'Laporan',
  DOCUMENTS: 'Dokumen Pendukung'
};

// ============================================================
// SUPABASE CRUD OPERATIONS
// ============================================================

/**
 * Simpan data skor aksesibilitas ke Supabase
 */
export async function saveAccessibilityScore(projectId, scoreData) {
  try {
    const { data, error } = await supabase
      .from(ACCESSIBILITY_TABLES.SCORES)
      .upsert({
        project_id: projectId,
        ...scoreData,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'project_id'
      });

    if (error) throw error;
    showSuccess('Skor aksesibilitas disimpan');
    return data;
  } catch (err) {
    console.error('Error saving accessibility score:', err);
    showError('Gagal menyimpan skor: ' + err.message);
    throw err;
  }
}

/**
 * Simpan data elemen aksesibilitas
 */
export async function saveAccessibilityElement(projectId, elementType, elementData) {
  const tableMap = {
    corridor: ACCESSIBILITY_TABLES.CORRIDORS,
    ramp: ACCESSIBILITY_TABLES.RAMPS,
    stair: ACCESSIBILITY_TABLES.STAIRS,
    elevator: ACCESSIBILITY_TABLES.ELEVATORS,
    toilet: ACCESSIBILITY_TABLES.TOILETS,
    parking: ACCESSIBILITY_TABLES.PARKING,
    signage: ACCESSIBILITY_TABLES.SIGNAGE
  };

  const table = tableMap[elementType];
  if (!table) throw new Error(`Unknown element type: ${elementType}`);

  try {
    const { data, error } = await supabase
      .from(table)
      .insert({
        project_id: projectId,
        ...elementData,
        created_at: new Date().toISOString()
      });

    if (error) throw error;
    showSuccess(`${elementType} berhasil disimpan`);
    return data;
  } catch (err) {
    console.error(`Error saving ${elementType}:`, err);
    showError(`Gagal menyimpan ${elementType}: ` + err.message);
    throw err;
  }
}

/**
 * Ambil semua data aksesibilitas untuk proyek
 */
export async function fetchAccessibilityData(projectId) {
  try {
    const [scores, corridors, ramps, stairs, elevators, toilets, parking, signage, infrastructure] = await Promise.all([
      supabase.from(ACCESSIBILITY_TABLES.SCORES).select('*').eq('project_id', projectId).order('created_at', { ascending: false }).limit(1),
      supabase.from(ACCESSIBILITY_TABLES.CORRIDORS).select('*').eq('project_id', projectId),
      supabase.from(ACCESSIBILITY_TABLES.RAMPS).select('*').eq('project_id', projectId),
      supabase.from(ACCESSIBILITY_TABLES.STAIRS).select('*').eq('project_id', projectId),
      supabase.from(ACCESSIBILITY_TABLES.ELEVATORS).select('*').eq('project_id', projectId),
      supabase.from(ACCESSIBILITY_TABLES.TOILETS).select('*').eq('project_id', projectId),
      supabase.from(ACCESSIBILITY_TABLES.PARKING).select('*').eq('project_id', projectId),
      supabase.from(ACCESSIBILITY_TABLES.SIGNAGE).select('*').eq('project_id', projectId),
      supabase.from(ACCESSIBILITY_TABLES.INFRASTRUCTURE).select('*').eq('project_id', projectId).limit(1)
    ]);

    return {
      score: scores.data?.[0] || null,
      corridors: corridors.data || [],
      ramps: ramps.data || [],
      stairs: stairs.data || [],
      elevators: elevators.data || [],
      toilets: toilets.data || [],
      parking: parking.data || [],
      signage: signage.data || [],
      infrastructure: infrastructure.data?.[0] || null
    };
  } catch (err) {
    console.error('Error fetching accessibility data:', err);
    throw err;
  }
}

/**
 * Hapus data elemen aksesibilitas
 */
export async function deleteAccessibilityElement(elementType, elementId) {
  const tableMap = {
    corridor: ACCESSIBILITY_TABLES.CORRIDORS,
    ramp: ACCESSIBILITY_TABLES.RAMPS,
    stair: ACCESSIBILITY_TABLES.STAIRS,
    elevator: ACCESSIBILITY_TABLES.ELEVATORS,
    toilet: ACCESSIBILITY_TABLES.TOILETS,
    parking: ACCESSIBILITY_TABLES.PARKING,
    signage: ACCESSIBILITY_TABLES.SIGNAGE
  };

  const table = tableMap[elementType];
  if (!table) throw new Error(`Unknown element type: ${elementType}`);

  try {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', elementId);

    if (error) throw error;
    showSuccess(`${elementType} berhasil dihapus`);
  } catch (err) {
    console.error(`Error deleting ${elementType}:`, err);
    showError(`Gagal menghapus ${elementType}: ` + err.message);
    throw err;
  }
}

// ============================================================
// GOOGLE DRIVE INTEGRATION
// ============================================================

/**
 * Upload file dokumentasi ke Google Drive
 */
export async function uploadAccessibilityFile(projectId, fileData, fileType = 'photo', folderId = null) {
  try {
    showInfo('Mengunggah file ke Google Drive...');
    
    const aspekMap = {
      photo: 'Dokumentasi Aksesibilitas',
      document: 'Dokumen Pendukung',
      report: 'Laporan Aksesibilitas'
    };

    const result = await uploadToGoogleDrive(
      [fileData],
      projectId,
      aspekMap[fileType] || 'Aksesibilitas',
      fileType,
      folderId
    );

    if (result && result.length > 0) {
      // Simpan referensi ke Supabase
      await saveFileReference(projectId, {
        file_name: fileData.name,
        file_url: result[0].url,
        drive_file_id: result[0].id,
        file_type: fileType,
        mime_type: fileData.mimeType
      });

      showSuccess('File berhasil diunggah ke Drive');
      return result[0];
    }
  } catch (err) {
    console.error('Error uploading to Drive:', err);
    showError('Gagal mengunggah file: ' + err.message);
    throw err;
  }
}

/**
 * Simpan referensi file ke Supabase
 */
export async function saveFileReference(projectId, fileInfo) {
  try {
    const { data, error } = await supabase
      .from(ACCESSIBILITY_TABLES.FILES)
      .insert({
        project_id: projectId,
        ...fileInfo,
        created_at: new Date().toISOString()
      });

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Error saving file reference:', err);
    throw err;
  }
}

/**
 * Ambil daftar file dari Google Drive via Supabase cache
 */
export async function fetchAccessibilityFiles(projectId) {
  try {
    const { data, error } = await supabase
      .from(ACCESSIBILITY_TABLES.FILES)
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Error fetching files:', err);
    return [];
  }
}

/**
 * Hapus file dari Google Drive dan Supabase
 */
export async function deleteAccessibilityFile(fileId, driveFileId) {
  try {
    // Hapus dari Google Drive
    if (driveFileId) {
      await deleteFromGoogleDrive(driveFileId);
    }

    // Hapus referensi dari Supabase
    const { error } = await supabase
      .from(ACCESSIBILITY_TABLES.FILES)
      .delete()
      .eq('id', fileId);

    if (error) throw error;
    showSuccess('File berhasil dihapus');
  } catch (err) {
    console.error('Error deleting file:', err);
    showError('Gagal menghapus file: ' + err.message);
    throw err;
  }
}

// ============================================================
// REPORT GENERATION & EXPORT
// ============================================================

/**
 * Generate dan upload laporan ke Google Drive
 */
export async function generateAndUploadReport(projectId, reportData) {
  try {
    showInfo('Membuat laporan aksesibilitas...');

    // 1. Simpan laporan ke Supabase
    const { data: report, error } = await supabase
      .from(ACCESSIBILITY_TABLES.REPORTS)
      .insert({
        project_id: projectId,
        report_type: reportData.type,
        report_content: reportData.content,
        generated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    // 2. Jika ada file PDF, upload ke Drive
    if (reportData.pdfBase64) {
      const fileData = {
        name: `Laporan_Aksesibilitas_${projectId}_${new Date().getTime()}.pdf`,
        base64: reportData.pdfBase64,
        mimeType: 'application/pdf'
      };

      const uploadResult = await uploadAccessibilityFile(
        projectId,
        fileData,
        'report'
      );

      // Update referensi Drive di Supabase
      await supabase
        .from(ACCESSIBILITY_TABLES.REPORTS)
        .update({
          drive_file_url: uploadResult.url,
          drive_file_id: uploadResult.id
        })
        .eq('id', report.id);
    }

    showSuccess('Laporan berhasil dibuat dan disimpan');
    return report;
  } catch (err) {
    console.error('Error generating report:', err);
    showError('Gagal membuat laporan: ' + err.message);
    throw err;
  }
}

/**
 * Export data ke CSV
 */
export async function exportToCSV(projectId, data) {
  try {
    const headers = ['Element Type', 'Location', 'Status', 'Compliance', 'Notes', 'Created At'];
    const rows = [];

    // Flatten all element data
    Object.entries(data).forEach(([type, items]) => {
      if (Array.isArray(items)) {
        items.forEach(item => {
          rows.push([
            type,
            item.location || '-',
            item.status || '-',
            item.compliance || '-',
            item.notes || '-',
            item.created_at || '-'
          ]);
        });
      }
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Simpan ke Drive
    const fileData = {
      name: `Export_Aksesibilitas_${projectId}_${new Date().getTime()}.csv`,
      base64: btoa(csvContent),
      mimeType: 'text/csv'
    };

    const result = await uploadAccessibilityFile(projectId, fileData, 'document');
    
    // Trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileData.name;
    link.click();

    showSuccess('CSV berhasil diexport');
    return result;
  } catch (err) {
    console.error('Error exporting CSV:', err);
    showError('Gagal export CSV: ' + err.message);
    throw err;
  }
}

// ============================================================
// SYNC OPERATIONS
// ============================================================

/**
 * Sinkronisasi data dengan Google Drive
 */
export async function syncWithDrive(projectId) {
  try {
    showInfo('Sinkronisasi dengan Google Drive...');

    // Ambil data terbaru dari Supabase
    const accessibilityData = await fetchAccessibilityData(projectId);

    // Ambil file dari Drive
    const driveFiles = await fetchDriveFiles(projectId);

    // Bandingkan dan update referensi
    const localFiles = await fetchAccessibilityFiles(projectId);

    // Cek file yang belum tersimpan di Supabase
    const missingInDb = driveFiles.filter(df => 
      !localFiles.some(lf => lf.drive_file_id === df.id)
    );

    // Tambahkan referensi yang hilang
    for (const file of missingInDb) {
      await saveFileReference(projectId, {
        file_name: file.name,
        file_url: file.webViewLink || file.webContentLink,
        drive_file_id: file.id,
        file_type: 'synced',
        mime_type: file.mimeType
      });
    }

    showSuccess(`Sinkronisasi selesai. ${missingInDb.length} file diperbarui.`);
    return {
      synced: missingInDb.length,
      total: driveFiles.length
    };
  } catch (err) {
    console.error('Error syncing with Drive:', err);
    showError('Gagal sinkronisasi: ' + err.message);
    throw err;
  }
}

// ============================================================
// BATCH OPERATIONS
// ============================================================

/**
 * Simpan batch data elemen
 */
export async function saveBatchElements(projectId, elements) {
  try {
    showInfo(`Menyimpan ${elements.length} elemen...`);

    const results = [];
    for (const element of elements) {
      const result = await saveAccessibilityElement(
        projectId,
        element.type,
        element.data
      );
      results.push(result);
    }

    showSuccess(`${elements.length} elemen berhasil disimpan`);
    return results;
  } catch (err) {
    console.error('Error saving batch elements:', err);
    showError('Gagal menyimpan batch: ' + err.message);
    throw err;
  }
}

/**
 * Backup semua data aksesibilitas ke Drive
 */
export async function backupToDrive(projectId) {
  try {
    showInfo('Membuat backup ke Google Drive...');

    // Ambil semua data
    const data = await fetchAccessibilityData(projectId);

    // Buat JSON backup
    const backupData = {
      project_id: projectId,
      backup_date: new Date().toISOString(),
      data: data
    };

    const fileData = {
      name: `Backup_Aksesibilitas_${projectId}_${new Date().getTime()}.json`,
      base64: btoa(JSON.stringify(backupData, null, 2)),
      mimeType: 'application/json'
    };

    const result = await uploadAccessibilityFile(projectId, fileData, 'document');

    showSuccess('Backup berhasil dibuat');
    return result;
  } catch (err) {
    console.error('Error creating backup:', err);
    showError('Gagal membuat backup: ' + err.message);
    throw err;
  }
}

// ============================================================
// REAL-TIME SUBSCRIPTIONS
// ============================================================

/**
 * Subscribe ke perubahan data aksesibilitas
 */
export function subscribeToAccessibilityChanges(projectId, callback) {
  const subscription = supabase
    .channel(`accessibility-${projectId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: ACCESSIBILITY_TABLES.SCORES,
        filter: `project_id=eq.${projectId}`
      },
      (payload) => {
        callback(payload);
      }
    )
    .subscribe();

  return subscription;
}

// ============================================================
// ANALYTICS & SUMMARY
// ============================================================

/**
 * Get analytics summary
 */
export async function getAccessibilityAnalytics(projectId) {
  try {
    const data = await fetchAccessibilityData(projectId);

    // Hitung statistik
    const totalElements = 
      data.corridors.length + 
      data.ramps.length + 
      data.stairs.length + 
      data.elevators.length + 
      data.toilets.length;

    const compliantElements = 
      data.corridors.filter(c => c.status === 'C').length +
      data.ramps.filter(r => r.status === 'C').length +
      data.stairs.filter(s => s.status === 'C').length +
      data.elevators.filter(e => e.status === 'C').length +
      data.toilets.filter(t => t.status === 'C').length;

    const files = await fetchAccessibilityFiles(projectId);

    return {
      totalElements,
      compliantElements,
      complianceRate: totalElements > 0 ? (compliantElements / totalElements * 100).toFixed(1) : 0,
      nonCompliant: totalElements - compliantElements,
      score: data.score?.score || 0,
      grade: data.score?.grade || '-',
      totalFiles: files.length,
      lastUpdated: data.score?.updated_at || null
    };
  } catch (err) {
    console.error('Error getting analytics:', err);
    return null;
  }
}
