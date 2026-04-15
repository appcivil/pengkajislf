/**
 * AI Router Anti-Rate Limit Integration - Production Ready
 * Integrasi Circuit Breaker, Fallback Chain, dan Deduplication untuk AI Router
 * @module lib/ai-router-anti-rate-limit
 */

import { getAIProviderRegistry } from './ai-rate-limit-manager.js';
import { getAIRequestDeduplicator } from './ai-request-deduplicator.js';
import { callAI, getDefaultModel, MODELS } from './ai-router.js';

// Singleton instances
let providerRegistry = null;
let requestDeduplicator = null;
let antiRateLimitInitialized = false;

/**
 * Initialize Anti-Rate Limit System
 */
async function initializeAntiRateLimit() {
  if (antiRateLimitInitialized) return;
  
  providerRegistry = getAIProviderRegistry();
  requestDeduplicator = getAIRequestDeduplicator({
    cacheTTL: 10 * 60 * 1000, // 10 menit untuk AI responses
    enableMemoryCache: true,
    enablePersistentCache: true
  });
  
  await requestDeduplicator.initialize();
  antiRateLimitInitialized = true;
  
  console.log('[AI Router Anti-Rate Limit] System initialized');
}

/**
 * Enhanced callAI dengan fallback chain dan deduplication
 * Production-ready anti-rate limit implementation
 */
export async function callAIWithFallback(model, prompt, options = {}) {
  await initializeAntiRateLimit();
  
  const { 
    priority = 'normal', 
    useDeduplication = true,
    preferredProvider = null,
    timeout = 60000 
  } = options;
  
  // Execute dengan fallback chain
  const result = await providerRegistry.executeWithFallback(
    async (fallbackModel) => {
      return await Promise.race([
        callAI(fallbackModel, prompt, options),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), timeout)
        )
      ]);
    },
    { 
      preferredProvider: preferredProvider || model?.proxyProvider,
      priority 
    }
  );
  
  return result;
}

/**
 * Execute AI call dengan automatic retry, fallback, dan deduplication
 * Recommended untuk production use
 */
export async function executeAIRequest(prompt, options = {}) {
  await initializeAntiRateLimit();
  
  const {
    model = null, // Auto-select jika null
    taskType = 'analysis',
    priority = 'normal',
    maxRetries = 3,
    useDeduplication = true,
    fallbackOnError = true,
    timeout = 60000
  } = options;
  
  // Auto-select model jika tidak specified
  let selectedModel = model;
  if (!selectedModel) {
    const defaultSelection = getDefaultModel({
      hasVision: options.hasVision || false,
      complexReasoning: options.complexReasoning || taskType === 'deep_analysis',
      taskType
    });
    selectedModel = defaultSelection.model;
  }
  
  // Generate cache key untuk deduplication
  const dedupKey = useDeduplication ? 
    requestDeduplicator.generateCacheKey(prompt, selectedModel, options) : 
    null;
  
  // Check deduplication - return cached result jika ada
  if (useDeduplication && dedupKey) {
    // Cek memory cache dulu (paling cepat)
    const memoryEntry = requestDeduplicator.memoryCache?.get(dedupKey);
    if (memoryEntry && Date.now() - memoryEntry.timestamp < 10 * 60 * 1000) {
      console.log(`[executeAIRequest] Memory cache hit for: ${dedupKey.substring(0, 20)}...`);
      return {
        success: true,
        result: memoryEntry.data,
        fromCache: true,
        cacheTier: 'memory'
      };
    }
  }
  
  // Execute dengan fallback jika enabled
  const requestFn = async () => {
    if (fallbackOnError) {
      return await callAIWithFallback(selectedModel, prompt, {
        ...options,
        priority,
        timeout,
        useDeduplication: false // Sudah di-handle di level atas
      });
    } else {
      const result = await Promise.race([
        callAI(selectedModel, prompt, options),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), timeout)
        )
      ]);
      return {
        success: true,
        result,
        provider: selectedModel?.proxyProvider || selectedModel?.vendor,
        responseTime: 0,
        fallbackUsed: false
      };
    }
  };
  
  // Execute dengan retry logic
  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await requestFn();
      
      // Cache result jika berhasil dan deduplication enabled
      if (useDeduplication && result.success && result.result) {
        await requestDeduplicator.prewarmCache(prompt, selectedModel, {
          content: result.result,
          provider: result.provider,
          responseTime: result.responseTime,
          _metadata: {
            timestamp: Date.now(),
            model: selectedModel?.id
          }
        }, options);
      }
      
      return {
        success: true,
        result: result.result,
        provider: result.provider,
        responseTime: result.responseTime,
        fallbackUsed: result.fallbackUsed || false,
        fromCache: false
      };
      
    } catch (error) {
      lastError = error;
      const isRateLimit = error.message?.includes('429') || 
                         error.message?.includes('quota') ||
                         error.message?.includes('rate limit') ||
                         error.message?.includes('too many requests');
      
      if (isRateLimit && attempt < maxRetries) {
        const delayMs = Math.min(attempt * 2000, 10000);
        console.warn(`[executeAIRequest] Rate limit, retrying in ${delayMs}ms (attempt ${attempt}/${maxRetries})`);
        await new Promise(r => setTimeout(r, delayMs));
      } else if (attempt < maxRetries && !isRateLimit) {
        const delayMs = attempt * 1000;
        console.warn(`[executeAIRequest] Error: ${error.message}, retrying in ${delayMs}ms (attempt ${attempt}/${maxRetries})`);
        await new Promise(r => setTimeout(r, delayMs));
      } else {
        break;
      }
    }
  }
  
  throw lastError;
}

/**
 * Batch execute multiple AI requests dengan optimization
 */
export async function executeAIBatch(requests, options = {}) {
  await initializeAntiRateLimit();
  
  const {
    maxConcurrency = 3,
    priority = 'normal',
    continueOnError = true,
    timeout = 60000
  } = options;
  
  const results = [];
  const errors = [];
  
  // Process dalam batch dengan concurrency limit
  for (let i = 0; i < requests.length; i += maxConcurrency) {
    const batch = requests.slice(i, i + maxConcurrency);
    
    const batchPromises = batch.map(async (req, index) => {
      try {
        const result = await executeAIRequest(req.prompt, {
          ...req.options,
          priority,
          model: req.model,
          timeout
        });
        return { index: i + index, success: true, result };
      } catch (error) {
        return { index: i + index, success: false, error: error.message };
      }
    });
    
    const batchResults = await Promise.all(batchPromises);
    
    for (const batchResult of batchResults) {
      if (batchResult.success) {
        results[batchResult.index] = batchResult.result;
      } else {
        errors[batchResult.index] = batchResult.error;
        if (continueOnError) {
          results[batchResult.index] = null;
        }
      }
    }
    
    // Rate limiting antar batch
    if (i + maxConcurrency < requests.length) {
      await new Promise(r => setTimeout(r, 500));
    }
  }
  
  return {
    results,
    errors: errors.filter(Boolean),
    summary: {
      total: requests.length,
      success: results.filter(r => r !== null).length,
      failed: errors.filter(Boolean).length
    }
  };
}

/**
 * Get health status dari semua AI providers
 * Untuk monitoring dan alerting
 */
export function getAIProviderHealth() {
  if (!providerRegistry) {
    providerRegistry = getAIProviderRegistry();
  }
  
  return providerRegistry.getHealthStatus();
}

/**
 * Get deduplicator stats
 */
export function getAIDeduplicationStats() {
  if (!requestDeduplicator) {
    return { initialized: false };
  }
  
  return requestDeduplicator.getStats();
}

/**
 * Reset all circuit breakers (emergency recovery)
 */
export function resetAIProviders() {
  if (providerRegistry) {
    providerRegistry.resetAll();
  }
  console.log('[AI Router Anti-Rate Limit] All AI providers reset');
}

/**
 * Pre-warm cache dengan common prompts
 * Berguna untuk loading common analysis patterns
 */
export async function prewarmAICache(prompts, model, options = {}) {
  await initializeAntiRateLimit();
  
  const results = [];
  for (const prompt of prompts) {
    try {
      // Simulate result untuk cache warming
      await requestDeduplicator.prewarmCache(
        prompt,
        model,
        { warmed: true, timestamp: Date.now() },
        options
      );
      results.push({ prompt: prompt.substring(0, 50), success: true });
    } catch (error) {
      results.push({ prompt: prompt.substring(0, 50), success: false, error: error.message });
    }
  }
  
  return results;
}

/**
 * Cleanup anti-rate limit resources
 */
export function disposeAntiRateLimit() {
  if (requestDeduplicator) {
    requestDeduplicator.dispose();
    requestDeduplicator = null;
  }
  providerRegistry = null;
  antiRateLimitInitialized = false;
  console.log('[AI Router Anti-Rate Limit] System disposed');
}

/**
 * Smart AI Analysis dengan automatic tier selection dan anti-rate limit
 * High-level API untuk analisis checklist items
 */
export async function smartAIAnalysis(item, aspek, options = {}) {
  const {
    roleTitle = 'Digital Technical Consultant SLF',
    standard = 'NSPK & PP No. 16 Tahun 2021',
    useAntiRateLimit = true
  } = options;
  
  // Build prompt
  const statusLabel = {
    'ada_sesuai': 'Ada & Sesuai Standar',
    'ada_tidak_sesuai': 'Penyimpangan Dokumen/Kondisi',
    'tidak_ada': 'Ketidakadaan (Missing Data/Component)',
    'buruk': 'Degradasi Berat',
    'kritis': 'Kegagalan Teknis Kritis',
    'tidak_wajib': 'Pengecualian (N/A)',
  }[item.status] || item.status;
  
  const prompt = `Anda adalah ${roleTitle} - Pakar Audit Forensik Bangunan Gedung tingkat lanjut.

Tugas: Susun Analisis Forensik Teknik Sipil/MEP komprehensif untuk parameter berikut.

# INFORMASI ITEM
- ASPEK: ${aspek.toUpperCase()}
- KODE: ${item.kode}
- PARAMETER: ${item.nama}
- HASIL LAPANGAN: ${statusLabel}
- CATATAN TEKNIS: ${item.catatan || 'Kondisi memerlukan tinjauan teori rekayasa.'}
- STANDAR ACUAN: ${standard}

# WAJIB GUNAKAN LOGIKA 6-STEP FORENSIK:
1. IDENTIFIKASI: Temuan visual/faktual di lapangan secara detail.
2. INTERPRETASI: Makna temuan terhadap persyaratan teknis standar.
3. ANALISIS TEKNIS: Penjelasan mendalam menggunakan prinsip rekayasa/rumus/standar SNI relevan.
4. PENILAIAN RISIKO: Evaluasi dampak kegagalan (Rendah/Sedang/Tinggi/Kritis).
5. KESIMPULAN ITEM: Kesesuaian akhir terhadap standar kelaikan.
6. REKOMENDASI: Tindakan perbaikan spesifik, teknis, dan aplikatif.

# OUTPUT WAJIB FORMAT JSON:
{
  "kode": "${item.kode}",
  "nama": "${item.nama}",
  "status": "Sesuai|Tidak Sesuai|Kritis",
  "faktual": "(Step 1 & 2 summary)",
  "analisis": "(Step 3 Technical Depth analysis)",
  "risiko": "Rendah|Sedang|Tinggi|Kritis",
  "rekomendasi": "(Step 6 Recommendation)",
  "narasi_item_lengkap": "### ANALISIS TEKNIS: ${item.kode}\\n\\n**1. Identifikasi & Interpretasi**\\n...\\n**2. Analisis Rekayasa**\\n...\\n**3. Penilaian Risiko & Implikasi**\\n...\\n**4. Kesimpulan & Rekomendasi Mitigasi**\\n..."
}

PENTING: Gunakan terminologi profesional seperti "diskontinuitas", "efek termal", "antropometrik", "karbonasi", dll.`;

  if (useAntiRateLimit) {
    return await executeAIRequest(prompt, {
      taskType: 'analysis',
      priority: 'normal',
      useDeduplication: true,
      fallbackOnError: true,
      ...options
    });
  } else {
    // Fallback ke callAI biasa
    const result = await callAI(MODELS.KIMI, prompt);
    return {
      success: true,
      result,
      provider: 'kimi',
      fallbackUsed: false
    };
  }
}

export default {
  callAIWithFallback,
  executeAIRequest,
  executeAIBatch,
  getAIProviderHealth,
  getAIDeduplicationStats,
  resetAIProviders,
  prewarmAICache,
  disposeAntiRateLimit,
  smartAIAnalysis
};
