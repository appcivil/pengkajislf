// ============================================================
// LOGGER UTILITY - Production-safe logging
// Menggantikan console.log/raw untuk environment-aware logging
// ============================================================

const IS_DEV = import.meta.env?.DEV ?? false;
const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
};

// Default level: DEBUG di dev, WARN di production
const CURRENT_LEVEL = IS_DEV ? LOG_LEVELS.DEBUG : LOG_LEVELS.WARN;

class Logger {
  constructor(namespace = 'App') {
    this.namespace = namespace;
  }

  _shouldLog(level) {
    return level >= CURRENT_LEVEL;
  }

  _formatMessage(level, message) {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${this.namespace}] [${level}] ${message}`;
  }

  debug(message, ...args) {
    if (!this._shouldLog(LOG_LEVELS.DEBUG)) return;
    console.debug(this._formatMessage('DEBUG', message), ...args);
  }

  log(message, ...args) {
    if (!this._shouldLog(LOG_LEVELS.INFO)) return;
    console.log(this._formatMessage('INFO', message), ...args);
  }

  info(message, ...args) {
    if (!this._shouldLog(LOG_LEVELS.INFO)) return;
    console.info(this._formatMessage('INFO', message), ...args);
  }

  warn(message, ...args) {
    if (!this._shouldLog(LOG_LEVELS.WARN)) return;
    console.warn(this._formatMessage('WARN', message), ...args);
  }

  error(message, ...args) {
    if (!this._shouldLog(LOG_LEVELS.ERROR)) return;
    console.error(this._formatMessage('ERROR', message), ...args);
  }

  // Khusus untuk development only - tidak akan muncul di production
  devLog(message, ...args) {
    if (!IS_DEV) return;
    console.log(`[DEV] [${this.namespace}] ${message}`, ...args);
  }

  // Group logging untuk structured output
  group(label) {
    if (!IS_DEV) return;
    console.group(`[${this.namespace}] ${label}`);
  }

  groupEnd() {
    if (!IS_DEV) return;
    console.groupEnd();
  }

  // Performance timing
  time(label) {
    if (!IS_DEV) return;
    console.time(`[${this.namespace}] ${label}`);
  }

  timeEnd(label) {
    if (!IS_DEV) return;
    console.timeEnd(`[${this.namespace}] ${label}`);
  }
}

// Singleton instance untuk global logging
const globalLogger = new Logger('Global');

// Factory function untuk namespace-specific loggers
export function createLogger(namespace) {
  return new Logger(namespace);
}

// Named exports untuk convenience
export const logger = globalLogger;
export { Logger, IS_DEV, LOG_LEVELS };

export default logger;
