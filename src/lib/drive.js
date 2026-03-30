/**
 * =========================================================
 * GOOGLE DRIVE API CONNECTOR 
 * Menghubungkan Frontend ke Google Apps Script (Drive)
 * =========================================================
 */
import { APP_CONFIG } from './config.js';

const GAS_URL = import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL;

/**
 * Mengunggah array of base64 objek ke Google Drive melalui Webhook GAS
 */
export async function uploadToGoogleDrive(filesData, proyekId, aspek = 'Umum', itemCode = 'General', customGasUrl = null) {
  const targetUrl = customGasUrl || GAS_URL;
  if (!targetUrl) return [];

  const urls = [];
  for (const file of filesData) {
    try {
      const payload = {
        base64: file.base64,
        mimeType: file.mimeType,
        fileName: file.name || `Lampiran_${new Date().getTime()}`,
        proyekId: proyekId,
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
        if (data && data.url) urls.push(data.url);
      }
    } catch (e) {
      console.error("Gagal mengunggah ke Drive:", e);
    }
  }
  return urls;
}

/**
 * Mengambil daftar file dari folder proyek di Google Drive
 */
export async function fetchDriveFiles(proyekId, customGasUrl = null) {
  const targetUrl = customGasUrl || GAS_URL;
  if (!targetUrl) return [];

  try {
    const response = await fetch(`${targetUrl}?proyekId=${proyekId}&action=list`);
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
