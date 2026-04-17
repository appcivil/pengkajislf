// ============================================================
// VITEST SETUP FILE
// Konfigurasi global untuk semua test
// ============================================================

import { vi } from 'vitest';

// Mock import.meta.env
vi.mock('import.meta.env', () => ({
  DEV: true,
  PROD: false,
  MODE: 'test'
}));

// Mock localStorage and sessionStorage
const createStorageMock = () => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = String(value);
    }),
    removeItem: vi.fn((key) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index) => Object.keys(store)[index] || null)
  };
};

Object.defineProperty(global, 'localStorage', {
  value: createStorageMock()
});

Object.defineProperty(global, 'sessionStorage', {
  value: createStorageMock()
});

// Mock window.location
delete window.location;
window.location = {
  href: 'http://localhost:3000',
  origin: 'http://localhost:3000',
  pathname: '/',
  search: '',
  hash: ''
};

// Mock console methods untuk mengurangi noise di test
global.console = {
  ...console,
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn()
};

// Helper untuk test async
global.waitFor = (ms) => new Promise(resolve => setTimeout(resolve, ms));
