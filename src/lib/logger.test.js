import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger, createLogger, Logger, IS_DEV, LOG_LEVELS } from './logger.js';

describe('Logger', () => {
  let consoleSpy;

  beforeEach(() => {
    consoleSpy = {
      log: vi.spyOn(console, 'log').mockImplementation(() => {}),
      info: vi.spyOn(console, 'info').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
      debug: vi.spyOn(console, 'debug').mockImplementation(() => {})
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Constants', () => {
    it('should export LOG_LEVELS', () => {
      expect(LOG_LEVELS).toEqual({
        DEBUG: 0,
        INFO: 1,
        WARN: 2,
        ERROR: 3
      });
    });

    it('should export IS_DEV', () => {
      expect(typeof IS_DEV).toBe('boolean');
    });
  });

  describe('createLogger', () => {
    it('should create logger with namespace', () => {
      const testLogger = createLogger('TestNamespace');
      expect(testLogger.namespace).toBe('TestNamespace');
    });
  });

  describe('Logger methods', () => {
    let testLogger;

    beforeEach(() => {
      testLogger = new Logger('Test');
    });

    it('should format message with namespace and level', () => {
      testLogger.log('test message');

      expect(consoleSpy.log).toHaveBeenCalled();
      const callArg = consoleSpy.log.mock.calls[0][0];
      expect(callArg).toContain('[Test]');
      expect(callArg).toContain('[INFO]');
      expect(callArg).toContain('test message');
    });

    it('should include timestamp', () => {
      testLogger.log('test');

      const callArg = consoleSpy.log.mock.calls[0][0];
      expect(callArg).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('should pass additional arguments', () => {
      const extraData = { key: 'value' };
      testLogger.log('message', extraData);

      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining('message'),
        extraData
      );
    });

    it('should handle info level', () => {
      testLogger.info('info message');
      expect(consoleSpy.info).toHaveBeenCalled();
      const callArg = consoleSpy.info.mock.calls[0][0];
      expect(callArg).toContain('[INFO]');
      expect(callArg).toContain('info message');
    });

    it('should handle warn level', () => {
      testLogger.warn('warning message');
      expect(consoleSpy.warn).toHaveBeenCalled();
      const callArg = consoleSpy.warn.mock.calls[0][0];
      expect(callArg).toContain('[WARN]');
      expect(callArg).toContain('warning message');
    });

    it('should handle error level', () => {
      testLogger.error('error message');
      expect(consoleSpy.error).toHaveBeenCalled();
      const callArg = consoleSpy.error.mock.calls[0][0];
      expect(callArg).toContain('[ERROR]');
      expect(callArg).toContain('error message');
    });
  });

  describe('Global logger', () => {
    it('should have Global namespace', () => {
      expect(logger.namespace).toBe('Global');
    });
  });
});
