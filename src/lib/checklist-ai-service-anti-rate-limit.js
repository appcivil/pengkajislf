/**
 * CHECKLIST AI SERVICE - ANTI-RATE LIMIT EDITION
 * Enhanced version dengan automatic fallback dan deduplication
 * 
 * Usage: Ganti import di file utama dari './checklist-ai-service.js' 
 * ke './checklist-ai-service-anti-rate-limit.js' untuk production
 */

import { 
  analyzeWithAntiRateLimit, 
  analyzeBatchWithAntiRateLimit,
  checkAIHealth 
} from './ai-rate-limit-index.js';
import { analyzeChecklistImage, analyzeComparativeAudit } from './gemini.js';
import { uploadToGoogleDrive } from './drive.js';
import { store, updateChecklist } from './store.js';
import { getSettings } from './settings.js';
import { registerFileMetadata } from './file-service.js';
import { voiceService } from './voice-service.js';

/**
 * Analyze checklist item dengan anti-rate limit protection
 * Enhanced version dari analyzeChecklistItem biasa
 */
export async function analyzeChecklistItemAntiRateLimit(item, aspek, options = {}) {
  const startTime = Date.now();
  
  try {
    // Use anti-rate limit system
    const result = await analyzeWithAntiRateLimit(item, aspek, {
      ...options,
      useAntiRateLimit: true,
      fallbackOnError: true,
      useDeduplication: true
    });
    
    const endTime = Date.now();
    
    return {
      ...result,
      responseTime: endTime - startTime,
      optimized: true
    };
    
  } catch (error) {
    console.error('[ChecklistAI Anti-Rate Limit] Analysis failed:', error);
    
    // Fallback ke deterministic synthesis
    return {
      success: false,
      result: null,
      error: error.message,
      fallback: 'deterministic'
    };
  }
}

/**
 * Batch analyze multiple checklist items
 * Optimal untuk analisis banyak item sekaligus
 */
export async function analyzeChecklistBatchAntiRateLimit(items, aspek, onProgress, options = {}) {
  const startTime = Date.now();
  const results = [];
  
  try {
    // Pre-check AI health
    const health = await checkAIHealth();
    console.log('[ChecklistAI Batch] AI Health:', health.providers.overall);
    
    // Use batch processing dengan anti-rate limit
    const batchResults = await analyzeBatchWithAntiRateLimit(
      items,
      aspek,
      {
        ...options,
        maxConcurrency: 3,
        continueOnError: true
      }
    );
    
    // Process results
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const result = batchResults.results[i];
      const error = batchResults.errors[i];
      
      if (result && result.success) {
        results.push({
          kode: item.kode,
          nama: item.nama,
          ...result.result,
          _meta: {
            provider: result.provider,
            fromCache: result.fromCache,
            responseTime: result.responseTime
          }
        });
      } else {
        // Fallback: create basic result
        results.push({
          kode: item.kode,
          nama: item.nama,
          status: 'Tidak Sesuai',
          faktual: item.catatan || 'Tidak ada catatan',
          analisis: `Analisis gagal: ${error || 'Unknown error'}`,
          risiko: 'Sedang',
          rekomendasi: 'Periksa kembali data teknis',
          _meta: { error: error || 'Unknown error' }
        });
      }
      
      // Call progress callback
      if (onProgress) {
        onProgress(i + 1, items.length, results[i]);
      }
    }
    
    const endTime = Date.now();
    const fromCache = results.filter(r => r._meta?.fromCache).length;
    
    return {
      results,
      summary: {
        total: items.length,
        success: results.filter(r => !r._meta?.error).length,
        failed: results.filter(r => r._meta?.error).length,
        fromCache,
        totalTime: endTime - startTime,
        avgTimePerItem: ((endTime - startTime) / items.length).toFixed(0)
      }
    };
    
  } catch (error) {
    console.error('[ChecklistAI Batch] Batch analysis failed:', error);
    throw error;
  }
}

/**
 * Enhanced photo analysis dengan automatic model selection
 * Vision tasks otomatis menggunakan Gemini Pro
 */
export async function analyzePhotoAntiRateLimit(base64Data, mimeType, options = {}) {
  const startTime = Date.now();
  
  try {
    // Vision tasks menggunakan Gemini Pro langsung (bukan fallback chain)
    const result = await analyzeChecklistImage(base64Data, mimeType);
    
    const endTime = Date.now();
    
    return {
      success: true,
      result,
      provider: 'gemini_pro',
      responseTime: endTime - startTime,
      taskType: 'vision'
    };
    
  } catch (error) {
    console.error('[ChecklistAI Photo] Vision analysis failed:', error);
    
    // Fallback: return basic structure
    return {
      success: false,
      error: error.message,
      fallback: 'basic'
    };
  }
}

/**
 * Get service status untuk monitoring
 */
export async function getChecklistAIServiceStatus() {
  const health = await checkAIHealth();
  
  return {
    ...health,
    service: 'checklist-ai-service-anti-rate-limit',
    features: {
      antiRateLimit: true,
      deduplication: true,
      batchProcessing: true,
      automaticFallback: true
    },
    recommendations: health.providers.overall === 'critical' 
      ? ['Switch to offline mode', 'Use deterministic synthesis']
      : health.providers.overall === 'degraded'
        ? ['Reduce concurrency', 'Increase cache TTL']
        : ['System operating normally']
  };
}

/**
 * Migration helper untuk migrasi dari service lama
 */
export async function migrateFromLegacyService(legacyItems, aspek, onProgress) {
  console.log('[Migration] Starting migration to Anti-Rate Limit service...');
  
  const startTime = Date.now();
  
  // Convert legacy items format jika diperlukan
  const normalizedItems = legacyItems.map(item => ({
    kode: item.kode || item.code,
    nama: item.nama || item.name,
    status: item.status,
    catatan: item.catatan || item.notes || ''
  }));
  
  // Execute dengan anti-rate limit
  const result = await analyzeChecklistBatchAntiRateLimit(
    normalizedItems,
    aspek,
    onProgress,
    { priority: 'normal' }
  );
  
  const endTime = Date.now();
  
  console.log(`[Migration] Completed in ${endTime - startTime}ms`);
  console.log(`[Migration] Cache hits: ${result.summary.fromCache}/${result.summary.total}`);
  
  return result;
}

// Re-export fungsi lain dari service lama untuk compatibility
export { 
  openLiveViewfinder,
  closeViewfinder, 
  flipCamera,
  takePhoto,
  drawWatermark,
  startGpsTracking,
  renderWmPreview,
  showError
} from './checklist-ai-service.js';

// Default export dengan semua fungsi
export default {
  analyzeChecklistItemAntiRateLimit,
  analyzeChecklistBatchAntiRateLimit,
  analyzePhotoAntiRateLimit,
  getChecklistAIServiceStatus,
  migrateFromLegacyService
};
