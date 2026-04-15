/**
 * AI Rate Limit System - Public API Index
 * Single entry point untuk semua fungsi anti-rate limit
 * @module lib/ai-rate-limit-index
 */

// Export dari rate limit manager
export {
  AICircuitBreaker,
  TokenBucketRateLimiter,
  AIProviderRegistry,
  getAIProviderRegistry
} from './ai-rate-limit-manager.js';

// Export dari request deduplicator
export {
  AIRequestDeduplicator,
  AIBatchProcessor,
  getAIRequestDeduplicator,
  getAIBatchProcessor
} from './ai-request-deduplicator.js';

// Export dari anti-rate limit integration
export {
  callAIWithFallback,
  executeAIRequest,
  executeAIBatch,
  getAIProviderHealth,
  getAIDeduplicationStats,
  resetAIProviders,
  prewarmAICache,
  disposeAntiRateLimit,
  smartAIAnalysis
} from './ai-router-anti-rate-limit.js';

// Re-export MODELS untuk convenience
export { MODELS, getDefaultModel, GEMINI_ROUTER, MODEL_COMPARATOR } from './ai-router.js';

// Utility function untuk quick analysis dengan anti-rate limit
export async function analyzeWithAntiRateLimit(item, aspek, options = {}) {
  const { smartAIAnalysis } = await import('./ai-router-anti-rate-limit.js');
  return await smartAIAnalysis(item, aspek, options);
}

// Utility untuk batch analysis
export async function analyzeBatchWithAntiRateLimit(items, aspek, options = {}) {
  const { executeAIBatch } = await import('./ai-router-anti-rate-limit.js');
  
  const requests = items.map(item => ({
    prompt: buildPromptForItem(item, aspek, options),
    options: {
      taskType: 'analysis',
      priority: item.risiko === 'Kritis' ? 'high' : 'normal',
      ...options
    }
  }));
  
  return await executeAIBatch(requests, options);
}

// Helper untuk build prompt
function buildPromptForItem(item, aspek, options = {}) {
  const statusLabel = {
    'ada_sesuai': 'Ada & Sesuai Standar',
    'ada_tidak_sesuai': 'Penyimpangan Dokumen/Kondisi',
    'tidak_ada': 'Ketidakadaan (Missing Data/Component)',
    'buruk': 'Degradasi Berat',
    'kritis': 'Kegagalan Teknis Kritis',
    'tidak_wajib': 'Pengecualian (N/A)',
  }[item.status] || item.status;

  return `Anda adalah ${options.roleTitle || 'Digital Technical Consultant SLF'} - Pakar Audit Forensik Bangunan Gedung.

Tugas: Susun Analisis Forensik komprehensif.

# INFORMASI ITEM
- ASPEK: ${aspek.toUpperCase()}
- KODE: ${item.kode}
- PARAMETER: ${item.nama}
- HASIL LAPANGAN: ${statusLabel}
- CATATAN TEKNIS: ${item.catatan || 'Kondisi memerlukan tinjauan teori rekayasa.'}
- STANDAR ACUAN: ${options.standard || 'NSPK & PP No. 16 Tahun 2021'}

# OUTPUT WAJIB FORMAT JSON dengan field: kode, nama, status, faktual, analisis, risiko, rekomendasi, narasi_item_lengkap`;
}

// Health check utility
export async function checkAIHealth() {
  const { getAIProviderHealth, getAIDeduplicationStats } = await import('./ai-router-anti-rate-limit.js');
  
  return {
    providers: getAIProviderHealth(),
    deduplication: getAIDeduplicationStats(),
    timestamp: Date.now()
  };
}

// Default export - lazy loading wrapper
const AIRateLimitAPI = {
  // Core functions
  callAIWithFallback: (...args) => import('./ai-router-anti-rate-limit.js').then(m => m.callAIWithFallback(...args)),
  executeAIRequest: (...args) => import('./ai-router-anti-rate-limit.js').then(m => m.executeAIRequest(...args)),
  executeAIBatch: (...args) => import('./ai-router-anti-rate-limit.js').then(m => m.executeAIBatch(...args)),
  
  // Monitoring
  getAIProviderHealth: () => import('./ai-router-anti-rate-limit.js').then(m => m.getAIProviderHealth()),
  getAIDeduplicationStats: () => import('./ai-router-anti-rate-limit.js').then(m => m.getAIDeduplicationStats()),
  resetAIProviders: () => import('./ai-router-anti-rate-limit.js').then(m => m.resetAIProviders()),
  
  // Utilities
  analyzeWithAntiRateLimit,
  analyzeBatchWithAntiRateLimit,
  checkAIHealth
};

export default AIRateLimitAPI;
