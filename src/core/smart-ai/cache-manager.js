/**
 * Cache Manager untuk caching hasil pemrosesan
 * Menggunakan IndexedDB untuk persistence
 * @module core/smart-ai/cache-manager
 */

import { openDB } from 'idb';

/**
 * Class untuk mengelola cache hasil pemrosesan
 */
export class CacheManager {
  constructor(config = {}) {
    this.config = {
      dbName: config.dbName || 'smartai_cache',
      storeName: config.storeName || 'cache_entries',
      version: config.version || 1,
      defaultTTL: config.defaultTTL || 24 * 60 * 60 * 1000, // 24 jam
      maxEntries: config.maxEntries || 1000,
      ...config
    };

    this.db = null;
    this.memoryCache = new Map(); // L1 cache (memory)
    this.isInitialized = false;
  }

  /**
   * Inisialisasi database
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      this.db = await openDB(this.config.dbName, this.config.version, {
        upgrade: (db, oldVersion, newVersion) => {
          if (!db.objectStoreNames.contains(this.config.storeName)) {
            const store = db.createObjectStore(this.config.storeName, { keyPath: 'key' });
            store.createIndex('timestamp', 'timestamp', { unique: false });
            store.createIndex('tag', 'tag', { unique: false });
            store.createIndex('expires', 'expires', { unique: false });
          }
        }
      });

      this.isInitialized = true;
      console.log('[CacheManager] Initialized successfully');
    } catch (error) {
      console.error('[CacheManager] Initialization failed:', error);
      // Fallback ke memory-only cache
      this.db = null;
      this.isInitialized = true;
    }
  }

  /**
   * Generate cache key dari input
   * @param {string} type - Tipe cache (ocr, embedding, parse, etc)
   * @param {Object} input - Input data
   * @returns {string}
   */
  generateKey(type, input) {
    // Simple hash function untuk generate key
    const str = JSON.stringify(input);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return `${type}_${Math.abs(hash).toString(36)}`;
  }

  /**
   * Simpan data ke cache
   * @param {string} key - Cache key
   * @param {Object} data - Data yang akan di-cache
   * @param {Object} options - Options
   * @returns {Promise<boolean>}
   */
  async set(key, data, options = {}) {
    await this.initialize();

    const entry = {
      key,
      data,
      timestamp: Date.now(),
      expires: options.ttl ? Date.now() + options.ttl : Date.now() + this.config.defaultTTL,
      tag: options.tag || 'general',
      size: JSON.stringify(data).length
    };

    // Simpan ke memory cache (L1)
    this.memoryCache.set(key, entry);

    // Simpan ke IndexedDB (L2) jika available
    if (this.db) {
      try {
        await this.db.put(this.config.storeName, entry);
        
        // Cleanup jika melebihi max entries
        await this._cleanupIfNeeded();
        
        return true;
      } catch (error) {
        console.error('[CacheManager] Error saving to IndexedDB:', error);
        return false;
      }
    }

    return true;
  }

  /**
   * Ambil data dari cache
   * @param {string} key - Cache key
   * @returns {Promise<Object|null>}
   */
  async get(key) {
    await this.initialize();

    // Cek memory cache dulu (L1)
    const memoryEntry = this.memoryCache.get(key);
    if (memoryEntry) {
      if (memoryEntry.expires > Date.now()) {
        return memoryEntry.data;
      } else {
        // Expired - hapus dari memory
        this.memoryCache.delete(key);
      }
    }

    // Cek IndexedDB (L2)
    if (this.db) {
      try {
        const entry = await this.db.get(this.config.storeName, key);
        
        if (entry) {
          // Cek expired
          if (entry.expires > Date.now()) {
            // Promote ke memory cache
            this.memoryCache.set(key, entry);
            return entry.data;
          } else {
            // Expired - hapus
            await this.db.delete(this.config.storeName, key);
          }
        }
      } catch (error) {
        console.error('[CacheManager] Error reading from IndexedDB:', error);
      }
    }

    return null;
  }

  /**
   * Cek apakah key ada di cache
   * @param {string} key - Cache key
   * @returns {Promise<boolean>}
   */
  async has(key) {
    const data = await this.get(key);
    return data !== null;
  }

  /**
   * Hapus entry dari cache
   * @param {string} key - Cache key
   * @returns {Promise<boolean>}
   */
  async delete(key) {
    await this.initialize();

    // Hapus dari memory
    this.memoryCache.delete(key);

    // Hapus dari IndexedDB
    if (this.db) {
      try {
        await this.db.delete(this.config.storeName, key);
        return true;
      } catch (error) {
        console.error('[CacheManager] Error deleting from IndexedDB:', error);
        return false;
      }
    }

    return true;
  }

  /**
   * Hapus semua entry dengan tag tertentu
   * @param {string} tag - Tag untuk difilter
   * @returns {Promise<number>} Jumlah entry yang dihapus
   */
  async deleteByTag(tag) {
    await this.initialize();
    
    if (!this.db) return 0;

    try {
      const entries = await this.db.getAllFromIndex(this.config.storeName, 'tag', tag);
      const tx = this.db.transaction(this.config.storeName, 'readwrite');
      
      let count = 0;
      for (const entry of entries) {
        // Hapus dari memory juga
        this.memoryCache.delete(entry.key);
        await tx.store.delete(entry.key);
        count++;
      }
      
      await tx.done;
      return count;
    } catch (error) {
      console.error('[CacheManager] Error deleting by tag:', error);
      return 0;
    }
  }

  /**
   * Clear semua cache
   * @returns {Promise<boolean>}
   */
  async clear() {
    await this.initialize();

    // Clear memory
    this.memoryCache.clear();

    // Clear IndexedDB
    if (this.db) {
      try {
        await this.db.clear(this.config.storeName);
        return true;
      } catch (error) {
        console.error('[CacheManager] Error clearing IndexedDB:', error);
        return false;
      }
    }

    return true;
  }

  /**
   * Dapatkan statistik cache
   * @returns {Promise<Object>}
   */
  async getStats() {
    await this.initialize();

    const stats = {
      memoryEntries: this.memoryCache.size,
      dbEntries: 0,
      totalSize: 0
    };

    if (this.db) {
      try {
        const entries = await this.db.getAll(this.config.storeName);
        stats.dbEntries = entries.length;
        stats.totalSize = entries.reduce((sum, entry) => sum + (entry.size || 0), 0);
      } catch (error) {
        console.error('[CacheManager] Error getting stats:', error);
      }
    }

    return stats;
  }

  /**
   * Cleanup expired entries dan jika melebihi max entries
   * @private
   */
  async _cleanupIfNeeded() {
    if (!this.db) return;

    try {
      // Hitung total entries
      const count = await this.db.count(this.config.storeName);
      
      if (count > this.config.maxEntries) {
        // Hapus entries yang paling lama tidak diakses
        const entries = await this.db.getAllFromIndex(
          this.config.storeName, 
          'timestamp'
        );
        
        const toDelete = entries
          .sort((a, b) => a.timestamp - b.timestamp)
          .slice(0, count - this.config.maxEntries * 0.8); // Hapus 20% terlama

        const tx = this.db.transaction(this.config.storeName, 'readwrite');
        for (const entry of toDelete) {
          this.memoryCache.delete(entry.key);
          await tx.store.delete(entry.key);
        }
        await tx.done;
      }

      // Hapus expired entries
      const expiredEntries = await this.db.getAllFromIndex(
        this.config.storeName,
        'expires',
        IDBKeyRange.upperBound(Date.now())
      );

      const tx = this.db.transaction(this.config.storeName, 'readwrite');
      for (const entry of expiredEntries) {
        this.memoryCache.delete(entry.key);
        await tx.store.delete(entry.key);
      }
      await tx.done;

    } catch (error) {
      console.error('[CacheManager] Cleanup error:', error);
    }
  }

  /**
   * Cache wrapper untuk async function (memoization)
   * @param {Function} fn - Function yang akan di-cache
   * @param {string} cacheType - Tipe cache
   * @param {number} [ttl] - Time-to-live dalam ms
   * @returns {Function}
   */
  memoize(fn, cacheType, ttl = null) {
    return async (...args) => {
      const cacheKey = this.generateKey(cacheType, args);
      
      // Cek cache
      const cached = await this.get(cacheKey);
      if (cached !== null) {
        return cached;
      }

      // Execute function
      const result = await fn(...args);
      
      // Simpan ke cache
      await this.set(cacheKey, result, { ttl, tag: cacheType });
      
      return result;
    };
  }

  /**
   * Batch get multiple keys
   * @param {Array<string>} keys - Array cache keys
   * @returns {Promise<Object>} Map key -> data
   */
  async getMultiple(keys) {
    const results = {};
    
    await Promise.all(
      keys.map(async key => {
        const data = await this.get(key);
        if (data !== null) {
          results[key] = data;
        }
      })
    );

    return results;
  }

  /**
   * Batch set multiple entries
   * @param {Object} entries - Map key -> { data, options }
   * @returns {Promise<boolean>}
   */
  async setMultiple(entries) {
    await this.initialize();

    const promises = Object.entries(entries).map(([key, { data, options }]) =>
      this.set(key, data, options)
    );

    await Promise.all(promises);
    return true;
  }

  /**
   * Dispose dan cleanup resources
   */
  dispose() {
    this.memoryCache.clear();
    
    if (this.db) {
      this.db.close();
      this.db = null;
    }
    
    this.isInitialized = false;
  }
}

// Singleton instance
let cacheInstance = null;

/**
 * Dapatkan singleton instance CacheManager
 * @param {Object} [config] - Konfigurasi (hanya digunakan saat inisialisasi)
 * @returns {CacheManager}
 */
export function getCacheManager(config) {
  if (!cacheInstance) {
    cacheInstance = new CacheManager(config);
  }
  return cacheInstance;
}

export default CacheManager;
