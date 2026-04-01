/**
 * =========================================================
 * GOOGLE DRIVE API CONNECTOR 
 * Menghubungkan Frontend ke Google Apps Script (Drive)
 * =========================================================
 */
import { APP_CONFIG } from './config.js';

const GAS_URL = import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL;

/**
 * Inisialisasi Folder Proyek dan dapatkan Folder ID unik
 */
export async function initializeProjectFolder(proyekId, name, customGasUrl = null) {
  const targetUrl = customGasUrl || GAS_URL;
  if (!targetUrl) return null;

  try {
      const payload = {
          action: 'create_folder',
          proyekId: name,
          internalId: proyekId
      };

      const response = await fetch(targetUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload)
      });

      const data = await response.json();
      return data.folderId || null;
  } catch (e) {
      console.error("Gagal inisialisasi folder Drive:", e);
  }
  return null;
}

/**
 * Mengunggah array of base64 objek ke Google Drive melalui Webhook GAS
 */
export async function uploadToGoogleDrive(filesData, proyekId, aspek = 'Umum', itemCode = 'General', customGasUrl = null) {
  const targetUrl = customGasUrl || GAS_URL;
  if (!targetUrl) return [];

  const results = [];
  for (const file of filesData) {
    try {
      const payload = {
        base64: file.base64,
        mimeType: file.mimeType,
        fileName: file.name || `Lampiran_${new Date().getTime()}`,
        proyekId: proyekId,
        folderId: file.folderId || null, // Tambahkan folderId jika ada
        aspek: aspek,
        itemCode: itemCode
      };

      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        // data.data is an array from GAS doPost
        if (data && data.data && data.data[0]) {
            results.push({
                url: data.data[0].url,
                id: data.data[0].id
            });
        }
      }
    } catch (e) {
      console.error("Gagal mengunggah ke Drive:", e);
    }
  }
  return results;
}

/**
 * Mengambil daftar file dari folder proyek di Google Drive
 */
export async function fetchDriveFiles(proyekId, folderId = null, customGasUrl = null) {
  const targetUrl = customGasUrl || GAS_URL;
  if (!targetUrl) return [];

  try {
    const query = folderId ? `folderId=${folderId}` : `proyekId=${proyekId}`;
    const response = await fetch(`${targetUrl}?${query}&action=list`);
    if (response.ok) {
      const data = await response.json();
      return data.files || [];
    }
  } catch (e) {
    console.error("Gagal mengambil daftar file Drive:", e);
  }
  return [];
}

/**
 * Meminta hasil scan OCR dari file tertentu di Drive
 */
export async function fetchFileOCR(fileId, customGasUrl = null) {
  const targetUrl = customGasUrl || GAS_URL;
  if (!targetUrl) return null;

  try {
    const response = await fetch(`${targetUrl}?fileId=${fileId}&action=ocr`);
    if (response.ok) {
      const data = await response.json();
      return data.text || null;
    }
  } catch (e) {
    console.error("Gagal melakukan OCR pada file:", e);
  }
  return null;
}

/**
 * Memindahkan berkas ke Trash di Google Drive (Otomatis hapus dalam 30 hari)
 */
export async function deleteFromGoogleDrive(fileId, customGasUrl = null) {
  const targetUrl = customGasUrl || GAS_URL;
  if (!targetUrl || !fileId) return false;

  try {
    const response = await fetch(`${targetUrl}?fileId=${fileId}&action=delete`);
    if (response.ok) {
      const data = await response.json();
      return data.status === 'success';
    }
  } catch (e) {
    console.error("Gagal menghapus file Drive:", e);
  }
  return false;
}
