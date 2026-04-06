// ============================================================
//  AI SERVICE - Client untuk Supabase Edge Functions
//  Fitur #8: Auto-Fill Daftar Simak
//  Fitur #22: Photo-to-Checklist Mapper
//  Menggunakan Hybrid Router untuk optimal cost
// ============================================================

import { supabase } from './supabase.js';
import { GEMINI_ROUTER, runOCRAnalysis, runBatchPhotoAnalysis, generateDaftarSimak } from './ai-router.js';

const EDGE_FUNCTION_BASE = import.meta.env.VITE_EDGE_FUNCTION_BASE || '';

/**
 * Client untuk Auto-Fill Daftar Simak Edge Function
 * @param {Object} proyekData - Data proyek SLF
 * @param {Array} checklistTemplate - Template checklist (opsional)
 * @param {string} proyekId - ID proyek untuk tracking
 */
export async function autoFillDaftarSimak(proyekData, checklistTemplate = null, proyekId = null) {
  const session = await supabase.auth.getSession();
  const token = session.data?.session?.access_token;
  
  if (!token) throw new Error('Sesi tidak valid - silakan login ulang');

  const url = EDGE_FUNCTION_BASE 
    ? `${EDGE_FUNCTION_BASE}/auto-fill-simak`
    : '/functions/v1/auto-fill-simak';

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({
      proyekData,
      checklistTemplate,
      proyekId
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || `Auto-fill error: ${res.status}`);
  }

  const data = await res.json();
  return {
    items: data.items || [],
    stats: data.stats,
    generatedAt: data.generatedAt
  };
}

/**
 * Client untuk Photo-to-Checklist Mapper Edge Function
 * @param {Array} photos - Array foto dengan base64
 * @param {Object} proyekData - Data proyek untuk context
 * @param {Array} checklistContext - Context checklist yang tersedia
 * @param {string} proyekId - ID proyek
 * @param {number} batchSize - Ukuran batch (default: 5)
 */
export async function photoToChecklistMapper(photos, proyekData = {}, checklistContext = null, proyekId = null, batchSize = 5) {
  const session = await supabase.auth.getSession();
  const token = session.data?.session?.access_token;
  
  if (!token) throw new Error('Sesi tidak valid - silakan login ulang');

  // Validate photos
  const validPhotos = photos.filter(p => p.base64 && p.mimeType).slice(0, 20);
  if (validPhotos.length === 0) {
    throw new Error('Tidak ada foto valid untuk diproses');
  }

  const url = EDGE_FUNCTION_BASE 
    ? `${EDGE_FUNCTION_BASE}/photo-checklist-mapper`
    : '/functions/v1/photo-checklist-mapper';

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({
      photos: validPhotos,
      proyekData,
      checklistContext,
      proyekId,
      batchSize
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || `Photo mapper error: ${res.status}`);
  }

  return await res.json();
}

/**
 * Helper untuk batch upload dan analisis foto dari Google Drive
 * @param {Array} fileUrls - URL file di Google Drive
 * @param {Object} proyekData - Data proyek
 */
export async function analyzeDrivePhotos(fileUrls, proyekData = {}) {
  // Convert URLs to base64 (implementasi tergantung pada drive integration)
  const photos = await Promise.all(
    fileUrls.map(async (url, idx) => {
      try {
        // Fetch file dan convert ke base64
        const response = await fetch(url);
        const blob = await response.blob();
        const base64 = await blobToBase64(blob);
        
        return {
          id: `photo-${idx}`,
          base64: base64.split(',')[1], // Remove data URI prefix
          mimeType: blob.type || 'image/jpeg',
          filename: url.split('/').pop()
        };
      } catch (err) {
        console.warn(`[analyzeDrivePhotos] Failed to fetch ${url}:`, err);
        return null;
      }
    })
  );

  const validPhotos = photos.filter(p => p !== null);
  
  if (validPhotos.length === 0) {
    throw new Error('Gagal mengambil foto dari Google Drive');
  }

  return await photoToChecklistMapper(validPhotos, proyekData);
}

/**
 * Convert Blob ke Base64
 */
function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Re-export fungsi dari ai-router untuk kemudahan
 */
export { GEMINI_ROUTER, runOCRAnalysis, runBatchPhotoAnalysis, generateDaftarSimak };

/**
 * Hook untuk menggunakan Gemini Hybrid Router dengan tracking
 */
export async function callAIWithTracking(prompt, options = {}) {
  const selection = GEMINI_ROUTER.selectModel(options);
  
  console.log(`[AI Tracking] Using ${selection.model.name} - ${selection.reason} (${selection.estimatedCost})`);
  
  // Log untuk analytics
  if (options.trackUsage) {
    await logAIUsage({
      model: selection.model.id,
      taskType: options.taskType,
      cost: selection.estimatedCost,
      timestamp: new Date().toISOString()
    });
  }

  // Call AI via router
  const result = await GEMINI_ROUTER.routeWithFallback([selection], async (model) => {
    // Implementasi callAI sesuai dengan ai-router.js
    const { callAI } = await import('./ai-router.js');
    return await callAI(model, prompt, options);
  });

  return result;
}

/**
 * Log AI usage untuk analytics
 */
async function logAIUsage(usage) {
  try {
    await supabase.from('ai_usage_logs').insert([usage]);
  } catch (err) {
    // Silent fail untuk logging
    console.warn('[AI Tracking] Failed to log usage:', err);
  }
}

/**
 * Cost estimation untuk batch requests
 */
export function estimateBatchCost(requests) {
  const plan = GEMINI_ROUTER.batchOptimize(requests);
  
  // Estimasi biaya (dalam tokens/requests)
  const costs = {
    pro: { tokens: 8192, pricePer1K: 0.005 },
    flash: { tokens: 4096, pricePer1K: 0.0003 },
    lite: { tokens: 2048, pricePer1K: 0.0002 }
  };

  const totalCost = 
    (plan.batches.pro.length * costs.pro.tokens * costs.pro.pricePer1K / 1000) +
    (plan.batches.flash.length * costs.flash.tokens * costs.flash.pricePer1K / 1000) +
    (plan.batches.lite.length * costs.lite.tokens * costs.lite.pricePer1K / 1000);

  return {
    ...plan,
    estimatedCostUSD: Math.round(totalCost * 1000) / 1000,
    savingsVsAllPro: Math.round(
      ((requests.length * costs.pro.tokens * costs.pro.pricePer1K / 1000) - totalCost) /
      (requests.length * costs.pro.tokens * costs.pro.pricePer1K / 1000) * 100
    )
  };
}
