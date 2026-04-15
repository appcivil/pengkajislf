// ============================================================
// EVENT BUS - Central Event Communication System
// Used for cross-module communication without direct coupling
// ============================================================

export class EventBus {
  constructor() {
    this.events = new Map();
  }

  on(event, callback) {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event).push(callback);
    
    // Return unsubscribe function
    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (!this.events.has(event)) return;
    const callbacks = this.events.get(event);
    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
    }
  }

  emit(event, data) {
    if (!this.events.has(event)) return;
    this.events.get(event).forEach(callback => {
      try {
        callback(data);
      } catch (err) {
        console.error(`[EventBus] Error in event "${event}":`, err);
      }
    });
  }

  once(event, callback) {
    const onceWrapper = (data) => {
      this.off(event, onceWrapper);
      callback(data);
    };
    return this.on(event, onceWrapper);
  }

  clear(event) {
    if (event) {
      this.events.delete(event);
    } else {
      this.events.clear();
    }
  }
}

// Global event bus instance
export const globalEventBus = new EventBus();

// EventEmitter-style base class for components
export class EventEmitter {
  constructor() {
    this._events = new EventBus();
  }

  on(event, callback) {
    return this._events.on(event, callback);
  }

  off(event, callback) {
    return this._events.off(event, callback);
  }

  emit(event, data) {
    return this._events.emit(event, data);
  }

  once(event, callback) {
    return this._events.once(event, callback);
  }
}

// Helper for creating custom element with events
export function withEventEmitter(BaseClass) {
  return class extends BaseClass {
    constructor(...args) {
      super(...args);
      this._eventBus = new EventBus();
    }

    on(event, callback) {
      return this._eventBus.on(event, callback);
    }

    off(event, callback) {
      return this._eventBus.off(event, callback);
    }

    emit(event, data) {
      // Emit both to internal bus and as DOM CustomEvent
      this._eventBus.emit(event, data);
      this.dispatchEvent?.(new CustomEvent(event, { detail: data, bubbles: true, composed: true }));
    }
  };
}
