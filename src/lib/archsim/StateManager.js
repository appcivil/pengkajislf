/**
 * StateManager.js - Reactive State dengan Proxy dan Undo/Redo
 * State management untuk ArchSim Pro dengan pattern Command
 */

export class StateManager {
  constructor(initialState = {}) {
    this.state = new Proxy(initialState, {
      set: (target, key, value) => {
        const oldValue = target[key];
        if (JSON.stringify(oldValue) !== JSON.stringify(value)) {
          target[key] = value;
          this.notify(key, value, oldValue);
        }
        return true;
      }
    });
    this.listeners = new Map();
    this.history = [];
    this.historyIndex = -1;
    this.maxHistory = 50; // Limit history size
  }

  subscribe(key, callback) {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key).add(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners.get(key)?.delete(callback);
    };
  }

  notify(key, newVal, oldVal) {
    if (this.listeners.has(key)) {
      this.listeners.get(key).forEach(cb => {
        try {
          cb(newVal, oldVal);
        } catch (err) {
          console.error(`State listener error for ${key}:`, err);
        }
      });
    }
  }

  setState(updater, options = {}) {
    const prevState = JSON.parse(JSON.stringify(this.state));
    
    if (typeof updater === 'function') {
      updater(this.state);
    } else {
      Object.assign(this.state, updater);
    }

    if (!options.skipHistory) {
      this.pushHistory(prevState);
    }
  }

  pushHistory(state) {
    // Remove future history if we're not at the end
    if (this.historyIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.historyIndex + 1);
    }
    
    this.history.push(JSON.parse(JSON.stringify(state)));
    
    // Limit history size
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    } else {
      this.historyIndex++;
    }
  }

  undo() {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      const historyState = this.history[this.historyIndex];
      Object.assign(this.state, JSON.parse(JSON.stringify(historyState)));
      return true;
    }
    return false;
  }

  redo() {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      const historyState = this.history[this.historyIndex];
      Object.assign(this.state, JSON.parse(JSON.stringify(historyState)));
      return true;
    }
    return false;
  }

  canUndo() {
    return this.historyIndex > 0;
  }

  canRedo() {
    return this.historyIndex < this.history.length - 1;
  }

  getHistoryInfo() {
    return {
      index: this.historyIndex,
      total: this.history.length,
      canUndo: this.canUndo(),
      canRedo: this.canRedo()
    };
  }

  reset() {
    this.history = [];
    this.historyIndex = -1;
    Object.keys(this.state).forEach(key => {
      delete this.state[key];
    });
  }

  // Batch updates untuk performance
  batchUpdate(updates) {
    const prevState = JSON.parse(JSON.stringify(this.state));
    
    Object.entries(updates).forEach(([key, value]) => {
      this.state[key] = value;
    });
    
    this.pushHistory(prevState);
  }
}

// Global app state singleton
export const archState = new StateManager({
  project: null,
  mode: '3d', // '2d' | '3d' | 'section'
  tool: 'select', // 'select' | 'draw' | 'measure' | 'section'
  layers: new Map(),
  compliance: { 
    score: 0, 
    checks: {},
    status: 'NOT_STARTED',
    details: {}
  },
  selection: [],
  camera: { position: [10, 10, 10], target: [0, 0, 0] },
  floorPlans: [],
  sunPosition: { azimuth: 45, elevation: 30 },
  shadows: true,
  measurements: [],
  uploadProgress: 0,
  analysisResults: null
});

// Command pattern untuk operasi kompleks
export class Command {
  constructor(execute, undo, description = '') {
    this.execute = execute;
    this.undo = undo;
    this.description = description;
  }
}

export class CommandManager {
  constructor(stateManager) {
    this.state = stateManager;
    this.commands = [];
    this.index = -1;
  }

  execute(command) {
    // Remove future commands
    this.commands = this.commands.slice(0, this.index + 1);
    
    // Execute and store
    const result = command.execute();
    this.commands.push(command);
    this.index++;
    
    return result;
  }

  undo() {
    if (this.index >= 0) {
      this.commands[this.index].undo();
      this.index--;
      return true;
    }
    return false;
  }

  redo() {
    if (this.index < this.commands.length - 1) {
      this.index++;
      this.commands[this.index].execute();
      return true;
    }
    return false;
  }
}

export default { StateManager, archState, Command, CommandManager };
