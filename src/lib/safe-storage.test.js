import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  SafeStorage, 
  SafeStorageError, 
  Validators, 
  Sanitizers,
  safeStorage,
  createSafeStorage 
} from './safe-storage.js';

describe('SafeStorage', () => {
  let storage;
  let safeStore;

  beforeEach(() => {
    storage = {
      data: {},
      getItem: vi.fn((key) => storage.data[key] || null),
      setItem: vi.fn((key, value) => { storage.data[key] = value; }),
      removeItem: vi.fn((key) => { delete storage.data[key]; }),
      clear: vi.fn(() => { storage.data = {}; }),
      key: vi.fn((index) => Object.keys(storage.data)[index] || null),
      get length() { return Object.keys(storage.data).length; }
    };
    safeStore = new SafeStorage(storage, 'test_');
  });

  describe('Validators', () => {
    it('should validate string type', () => {
      expect(Validators.string('test')).toBe(true);
      expect(Validators.string(123)).toBe(false);
      expect(Validators.string(null)).toBe(false);
    });

    it('should validate number type', () => {
      expect(Validators.number(123)).toBe(true);
      expect(Validators.number('123')).toBe(false);
      expect(Validators.number(NaN)).toBe(false);
    });

    it('should validate object type', () => {
      expect(Validators.object({})).toBe(true);
      expect(Validators.object([])).toBe(false);
      expect(Validators.object(null)).toBe(false);
    });

    it('should validate array type', () => {
      expect(Validators.array([])).toBe(true);
      expect(Validators.array({})).toBe(false);
      expect(Validators.array('test')).toBe(false);
    });

    it('should validate UUID format', () => {
      expect(Validators.uuid('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
      expect(Validators.uuid('invalid-uuid')).toBe(false);
      expect(Validators.uuid('123')).toBe(false);
    });

    it('should validate JSON format', () => {
      expect(Validators.json('{"key": "value"}')).toBe(true);
      expect(Validators.json('invalid json')).toBe(false);
    });
  });

  describe('Sanitizers', () => {
    it('should sanitize string', () => {
      expect(Sanitizers.string('  test  ')).toBe('test');
      expect(Sanitizers.string(123)).toBe('123');
    });

    it('should sanitize number', () => {
      expect(Sanitizers.number('123')).toBe(123);
      expect(Sanitizers.number('abc')).toBe(null);
      expect(Sanitizers.number(45.67)).toBe(45.67);
    });

    it('should sanitize boolean', () => {
      expect(Sanitizers.boolean('true')).toBe(true);
      expect(Sanitizers.boolean('')).toBe(false);
      expect(Sanitizers.boolean(1)).toBe(true);
    });

    it('should sanitize object from JSON string', () => {
      expect(Sanitizers.object('{"key": "value"}')).toEqual({ key: 'value' });
      expect(Sanitizers.object('invalid')).toBe(null);
    });

    it('should sanitize array from JSON string', () => {
      expect(Sanitizers.array('[1, 2, 3]')).toEqual([1, 2, 3]);
      expect(Sanitizers.array('invalid')).toEqual([]);
    });

    it('should sanitize HTML', () => {
      expect(Sanitizers.html('<script>alert("xss")</script>')).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;');
      expect(Sanitizers.html('<div>test</div>')).toBe('&lt;div&gt;test&lt;&#x2F;div&gt;');
    });
  });

  describe('SafeStorage.set', () => {
    it('should store string with type validation', () => {
      const result = safeStore.set('key', 'value', { type: 'string' });
      expect(result).toBe(true);
      expect(storage.setItem).toHaveBeenCalled();
    });

    it('should throw error for type mismatch', () => {
      expect(() => {
        safeStore.set('key', 123, { type: 'string' });
      }).toThrow(SafeStorageError);
    });

    it('should throw error for max length exceeded', () => {
      expect(() => {
        safeStore.set('key', 'very long string', { type: 'string', maxLength: 5 });
      }).toThrow(SafeStorageError);
    });

    it('should store object', () => {
      const obj = { key: 'value', nested: { data: true } };
      const result = safeStore.set('obj', obj, { type: 'object' });
      expect(result).toBe(true);
    });

    it('should store array', () => {
      const arr = [1, 2, 3];
      const result = safeStore.set('arr', arr, { type: 'array' });
      expect(result).toBe(true);
    });
  });

  describe('SafeStorage.get', () => {
    it('should retrieve stored string', () => {
      safeStore.set('key', 'value', { type: 'string' });
      const result = safeStore.get('key');
      expect(result).toBe('value');
    });

    it('should return default value when key not found', () => {
      const result = safeStore.get('nonexistent', { defaultValue: 'default' });
      expect(result).toBe('default');
    });

    it('should return null when key not found and no default', () => {
      const result = safeStore.get('nonexistent');
      expect(result).toBe(null);
    });

    it('should retrieve stored object', () => {
      const obj = { key: 'value' };
      safeStore.set('obj', obj, { type: 'object' });
      const result = safeStore.get('obj', { type: 'object' });
      expect(result).toEqual(obj);
    });
  });

  describe('SafeStorage.has', () => {
    it('should return true for existing key', () => {
      safeStore.set('key', 'value');
      expect(safeStore.has('key')).toBe(true);
    });

    it('should return false for non-existing key', () => {
      expect(safeStore.has('nonexistent')).toBe(false);
    });

    it('should return false for expired key', () => {
      safeStore.set('key', 'value', { ttl: -1000 }); // Already expired
      expect(safeStore.has('key')).toBe(false);
    });
  });

  describe('SafeStorage.remove', () => {
    it('should remove existing key', () => {
      safeStore.set('key', 'value');
      safeStore.remove('key');
      expect(safeStore.has('key')).toBe(false);
    });
  });

  describe('SafeStorage.keys', () => {
    it('should return all keys without prefix', () => {
      safeStore.set('key1', 'value1');
      safeStore.set('key2', 'value2');
      const keys = safeStore.keys();
      expect(keys).toContain('key1');
      expect(keys).toContain('key2');
    });
  });

  describe('SafeStorageError', () => {
    it('should create error with code and metadata', () => {
      const error = new SafeStorageError('message', 'CODE', { key: 'value' });
      expect(error.message).toBe('message');
      expect(error.code).toBe('CODE');
      expect(error.metadata).toEqual({ key: 'value' });
      expect(error.name).toBe('SafeStorageError');
    });
  });

  describe('Exports', () => {
    it('should export safeStorage instance', () => {
      expect(safeStorage).toBeInstanceOf(SafeStorage);
    });

    it('should create custom storage with factory', () => {
      const custom = createSafeStorage(storage, 'custom_');
      expect(custom).toBeInstanceOf(SafeStorage);
      expect(custom.prefix).toBe('custom_');
    });
  });
});
