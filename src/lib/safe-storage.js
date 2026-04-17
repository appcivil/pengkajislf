// ============================================================
// SAFE STORAGE - Validated localStorage/sessionStorage wrapper
// Menyediakan validasi type, schema, dan sanitasi otomatis
// ============================================================

import { logger } from './logger.js';

class SafeStorageError extends Error {
  constructor(message, code, metadata = {}) {
    super(message);
    this.name = 'SafeStorageError';
    this.code = code;
    this.metadata = metadata;
  }
}

// Validators
const Validators = {
  string: (value) => typeof value === 'string',
  number: (value) => typeof value === 'number' && !isNaN(value),
  boolean: (value) => typeof value === 'boolean',
  object: (value) => typeof value === 'object' && value !== null && !Array.isArray(value),
  array: (value) => Array.isArray(value),
  uuid: (value) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value),
  json: (value) => {
    try {
      JSON.parse(value);
      return true;
    } catch {
      return false;
    }
  }
};

// Sanitizers
const Sanitizers = {
  string: (value) => String(value).trim(),
  number: (value) => {
    const num = Number(value);
    return isNaN(num) ? null : num;
  },
  boolean: (value) => Boolean(value),
  object: (value) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return null;
      }
    }
    return typeof value === 'object' && value !== null ? value : null;
  },
  array: (value) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  },
  // XSS sanitization untuk string
  html: (value) => {
    if (typeof value !== 'string') return '';
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }
};

class SafeStorage {
  constructor(storage = localStorage, prefix = 'slf_') {
    this.storage = storage;
    this.prefix = prefix;
    this.logger = logger;
  }

  _getKey(key) {
    return `${this.prefix}${key}`;
  }

  /**
   * Set item dengan validasi dan sanitasi
   * @param {string} key - Storage key
   * @param {*} value - Value to store
   * @param {Object} options - Validation options
   * @param {string} options.type - Expected type (string, number, boolean, object, array)
   * @param {Function} options.validator - Custom validator function
   * @param {boolean} options.sanitize - Enable XSS sanitization for strings
   * @param {number} options.maxLength - Maximum length for strings
   * @param {number} options.ttl - Time-to-live in milliseconds
   */
  set(key, value, options = {}) {
    try {
      const fullKey = this._getKey(key);
      const { type, validator, sanitize, maxLength, ttl } = options;

      // Type validation
      if (type && !Validators[type](value)) {
        throw new SafeStorageError(
          `Invalid type for key "${key}": expected ${type}, got ${typeof value}`,
          'VALIDATION_TYPE_ERROR',
          { key, expected: type, actual: typeof value }
        );
      }

      // Custom validator
      if (validator && !validator(value)) {
        throw new SafeStorageError(
          `Custom validation failed for key "${key}"`,
          'VALIDATION_CUSTOM_ERROR',
          { key, value }
        );
      }

      // Sanitization
      let sanitizedValue = value;
      if (sanitize && type === 'string') {
        sanitizedValue = Sanitizers.html(value);
      }

      // Max length check
      if (maxLength && typeof sanitizedValue === 'string' && sanitizedValue.length > maxLength) {
        throw new SafeStorageError(
          `Value exceeds max length for key "${key}": ${sanitizedValue.length} > ${maxLength}`,
          'VALIDATION_LENGTH_ERROR',
          { key, length: sanitizedValue.length, maxLength }
        );
      }

      // Serialization
      let serialized;
      if (type === 'object' || type === 'array' || (typeof sanitizedValue === 'object' && sanitizedValue !== null)) {
        serialized = JSON.stringify(sanitizedValue);
      } else {
        serialized = String(sanitizedValue);
      }

      // Store with optional TTL
      const item = {
        value: serialized,
        timestamp: Date.now(),
        ttl: ttl || null,
        type: type || typeof sanitizedValue
      };

      this.storage.setItem(fullKey, JSON.stringify(item));
      this.logger.debug(`SafeStorage: Set "${key}" (${item.type})`);

      return true;
    } catch (error) {
      this.logger.error(`SafeStorage: Failed to set "${key}"`, error);
      if (error instanceof SafeStorageError) throw error;
      throw new SafeStorageError(
        `Failed to set item: ${error.message}`,
        'STORAGE_SET_ERROR',
        { key, originalError: error.message }
      );
    }
  }

  /**
   * Get item dengan validasi dan sanitasi
   * @param {string} key - Storage key
   * @param {Object} options - Retrieval options
   * @param {*} options.defaultValue - Default value if not found
   * @param {string} options.type - Expected type for deserialization
   * @param {boolean} options.validateExpiry - Check TTL expiration
   * @returns {*} Stored value or default
   */
  get(key, options = {}) {
    try {
      const fullKey = this._getKey(key);
      const { defaultValue = null, type, validateExpiry = true } = options;

      const stored = this.storage.getItem(fullKey);
      if (!stored) return defaultValue;

      let parsed;
      try {
        parsed = JSON.parse(stored);
      } catch {
        // Legacy format - plain string
        parsed = { value: stored, timestamp: Date.now(), type: 'string' };
      }

      // TTL validation
      if (validateExpiry && parsed.ttl) {
        const expiry = parsed.timestamp + parsed.ttl;
        if (Date.now() > expiry) {
          this.remove(key);
          this.logger.debug(`SafeStorage: Key "${key}" expired`);
          return defaultValue;
        }
      }

      // Type coercion
      let result = parsed.value;
      const targetType = type || parsed.type;

      if (targetType && Sanitizers[targetType]) {
        result = Sanitizers[targetType](result);
      }

      this.logger.debug(`SafeStorage: Get "${key}" (${targetType || 'string'})`);
      return result;

    } catch (error) {
      this.logger.error(`SafeStorage: Failed to get "${key}"`, error);
      return options.defaultValue !== undefined ? options.defaultValue : null;
    }
  }

  /**
   * Remove item dari storage
   * @param {string} key - Storage key
   */
  remove(key) {
    try {
      const fullKey = this._getKey(key);
      this.storage.removeItem(fullKey);
      this.logger.debug(`SafeStorage: Removed "${key}"`);
    } catch (error) {
      this.logger.error(`SafeStorage: Failed to remove "${key}"`, error);
    }
  }

  /**
   * Check if key exists and not expired
   * @param {string} key - Storage key
   * @returns {boolean}
   */
  has(key) {
    try {
      const fullKey = this._getKey(key);
      const stored = this.storage.getItem(fullKey);
      if (!stored) return false;

      const parsed = JSON.parse(stored);
      if (parsed.ttl) {
        const expiry = parsed.timestamp + parsed.ttl;
        if (Date.now() > expiry) {
          this.remove(key);
          return false;
        }
      }
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get all keys with prefix
   * @returns {Array<string>} Keys without prefix
   */
  keys() {
    try {
      const keys = [];
      for (let i = 0; i < this.storage.length; i++) {
        const key = this.storage.key(i);
        if (key && key.startsWith(this.prefix)) {
          keys.push(key.slice(this.prefix.length));
        }
      }
      return keys;
    } catch (error) {
      this.logger.error('SafeStorage: Failed to get keys', error);
      return [];
    }
  }

  /**
   * Clear all items with prefix
   */
  clear() {
    try {
      const keys = this.keys();
      keys.forEach(key => this.remove(key));
      this.logger.info(`SafeStorage: Cleared ${keys.length} items`);
    } catch (error) {
      this.logger.error('SafeStorage: Failed to clear', error);
    }
  }

  /**
   * Get storage size estimation
   * @returns {Object} Size info
   */
  getSize() {
    try {
      let totalSize = 0;
      const keys = this.keys();
      
      keys.forEach(key => {
        const fullKey = this._getKey(key);
        const item = this.storage.getItem(fullKey);
        if (item) {
          totalSize += item.length * 2; // UTF-16 encoding
        }
      });

      return {
        keys: keys.length,
        bytes: totalSize,
        kilobytes: Math.round(totalSize / 1024 * 100) / 100
      };
    } catch (error) {
      this.logger.error('SafeStorage: Failed to calculate size', error);
      return { keys: 0, bytes: 0, kilobytes: 0 };
    }
  }
}

// Predefined instances
export const safeStorage = new SafeStorage(localStorage, 'slf_');
export const safeSessionStorage = new SafeStorage(sessionStorage, 'slf_sess_');

// Factory function
export function createSafeStorage(storage, prefix) {
  return new SafeStorage(storage, prefix);
}

export { SafeStorage, SafeStorageError, Validators, Sanitizers };
export default safeStorage;
