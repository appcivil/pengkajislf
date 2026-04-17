// ============================================================
// ELECTRICAL SYSTEM INSPECTION - DATA MANAGEMENT
// IndexedDB Storage with Dexie.js pattern
// Local storage for panel data, measurements, thermal images
// ============================================================

const DB_NAME = 'SLFElectricalDB';
const DB_VERSION = 1;

// Database schema definition
const DB_SCHEMA = {
  panels: '++id, projectId, name, location, type, createdAt, updatedAt',
  measurements: '++id, panelId, timestamp, location, phase, [panelId+timestamp]',
  thermalImages: '++id, panelId, timestamp, component, tempMax, [panelId+timestamp]',
  history: '++id, panelId, date, type, data',
  projects: '++id, name, createdAt, updatedAt',
  backups: '++id, projectId, timestamp, data'
};

let db = null;

// ============================================================
// 1. DATABASE INITIALIZATION
// ============================================================

/**
 * Initialize IndexedDB database
 * @returns {Promise<IDBDatabase>} Database instance
 */
export async function initDatabase() {
  if (db) return db;
  
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };
    
    request.onupgradeneeded = (event) => {
      const database = event.target.result;
      
      // Create object stores
      if (!database.objectStoreNames.contains('panels')) {
        const panelsStore = database.createObjectStore('panels', { keyPath: 'id', autoIncrement: true });
        panelsStore.createIndex('projectId', 'projectId', { unique: false });
        panelsStore.createIndex('name', 'name', { unique: false });
      }
      
      if (!database.objectStoreNames.contains('measurements')) {
        const measurementsStore = database.createObjectStore('measurements', { keyPath: 'id', autoIncrement: true });
        measurementsStore.createIndex('panelId', 'panelId', { unique: false });
        measurementsStore.createIndex('timestamp', 'timestamp', { unique: false });
        measurementsStore.createIndex('panelId_timestamp', ['panelId', 'timestamp'], { unique: false });
      }
      
      if (!database.objectStoreNames.contains('thermalImages')) {
        const thermalStore = database.createObjectStore('thermalImages', { keyPath: 'id', autoIncrement: true });
        thermalStore.createIndex('panelId', 'panelId', { unique: false });
        thermalStore.createIndex('component', 'component', { unique: false });
      }
      
      if (!database.objectStoreNames.contains('history')) {
        const historyStore = database.createObjectStore('history', { keyPath: 'id', autoIncrement: true });
        historyStore.createIndex('panelId', 'panelId', { unique: false });
        historyStore.createIndex('date', 'date', { unique: false });
      }
      
      if (!database.objectStoreNames.contains('projects')) {
        database.createObjectStore('projects', { keyPath: 'id', autoIncrement: true });
      }
      
      if (!database.objectStoreNames.contains('backups')) {
        const backupStore = database.createObjectStore('backups', { keyPath: 'id', autoIncrement: true });
        backupStore.createIndex('projectId', 'projectId', { unique: false });
        backupStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

// ============================================================
// 2. PANEL CRUD OPERATIONS
// ============================================================

/**
 * Create new panel
 * @param {Object} panelData - Panel data
 * @returns {Promise<number>} Panel ID
 */
export async function createPanel(panelData) {
  const database = await initDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['panels'], 'readwrite');
    const store = transaction.objectStore('panels');
    
    const data = {
      ...panelData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      measurements: panelData.measurements || [],
      thermalImages: panelData.thermalImages || []
    };
    
    const request = store.add(data);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get panel by ID
 * @param {number} id - Panel ID
 * @returns {Promise<Object>} Panel data
 */
export async function getPanel(id) {
  const database = await initDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['panels', 'measurements', 'thermalImages'], 'readonly');
    const panelStore = transaction.objectStore('panels');
    const measurementStore = transaction.objectStore('measurements');
    const thermalStore = transaction.objectStore('thermalImages');
    
    const request = panelStore.get(id);
    
    request.onsuccess = async () => {
      const panel = request.result;
      if (!panel) {
        resolve(null);
        return;
      }
      
      // Load related measurements
      const measurements = await getMeasurementsByPanelId(measurementStore, id);
      const thermalImages = await getThermalImagesByPanelId(thermalStore, id);
      
      resolve({
        ...panel,
        measurements,
        thermalImages
      });
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get all panels for a project
 * @param {string} projectId - Project ID
 * @returns {Promise<Array>} Array of panels
 */
export async function getPanelsByProject(projectId) {
  const database = await initDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['panels'], 'readonly');
    const store = transaction.objectStore('panels');
    const index = store.index('projectId');
    
    const request = index.getAll(projectId);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Update panel
 * @param {number} id - Panel ID
 * @param {Object} updates - Updated data
 * @returns {Promise<void>}
 */
export async function updatePanel(id, updates) {
  const database = await initDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['panels'], 'readwrite');
    const store = transaction.objectStore('panels');
    
    const getRequest = store.get(id);
    getRequest.onsuccess = () => {
      const panel = getRequest.result;
      if (!panel) {
        reject(new Error('Panel not found'));
        return;
      }
      
      const updatedData = {
        ...panel,
        ...updates,
        id: id,
        updatedAt: new Date().toISOString()
      };
      
      const putRequest = store.put(updatedData);
      putRequest.onsuccess = () => resolve();
      putRequest.onerror = () => reject(putRequest.error);
    };
    getRequest.onerror = () => reject(getRequest.error);
  });
}

/**
 * Delete panel and related data
 * @param {number} id - Panel ID
 * @returns {Promise<void>}
 */
export async function deletePanel(id) {
  const database = await initDatabase();
  
  return new Promise(async (resolve, reject) => {
    const transaction = database.transaction(
      ['panels', 'measurements', 'thermalImages', 'history'],
      'readwrite'
    );
    
    try {
      // Delete panel
      await deleteFromStore(transaction.objectStore('panels'), id);
      
      // Delete related measurements
      const measurementStore = transaction.objectStore('measurements');
      const measurementIndex = measurementStore.index('panelId');
      const measurements = await getAllFromIndex(measurementIndex, id);
      for (const m of measurements) {
        await deleteFromStore(measurementStore, m.id);
      }
      
      // Delete related thermal images
      const thermalStore = transaction.objectStore('thermalImages');
      const thermalIndex = thermalStore.index('panelId');
      const thermalImages = await getAllFromIndex(thermalIndex, id);
      for (const t of thermalImages) {
        await deleteFromStore(thermalStore, t.id);
      }
      
      // Delete history
      const historyStore = transaction.objectStore('history');
      const historyIndex = historyStore.index('panelId');
      const history = await getAllFromIndex(historyIndex, id);
      for (const h of history) {
        await deleteFromStore(historyStore, h.id);
      }
      
      resolve();
    } catch (error) {
      reject(error);
    }
  });
}

// ============================================================
// 3. MEASUREMENT OPERATIONS
// ============================================================

/**
 * Add measurement to panel
 * @param {number} panelId - Panel ID
 * @param {Object} measurement - Measurement data
 * @returns {Promise<number>} Measurement ID
 */
export async function addMeasurement(panelId, measurement) {
  const database = await initDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['measurements'], 'readwrite');
    const store = transaction.objectStore('measurements');
    
    // eslint-disable-next-line no-unused-vars
    const { id, ...measurementWithoutId } = measurement;
    const data = {
      ...measurementWithoutId,
      panelId,
      timestamp: measurement.timestamp || new Date().toISOString()
    };
    
    const request = store.add(data);
    request.onsuccess = () => {
      // Update panel's updatedAt timestamp
      updatePanel(panelId, { updatedAt: new Date().toISOString() });
      resolve(request.result);
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get measurements by panel ID
 * @param {number} panelId - Panel ID
 * @param {Object} options - Query options {limit, offset, startDate, endDate}
 * @returns {Promise<Array>} Measurements
 */
export async function getMeasurements(panelId, options = {}) {
  const database = await initDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['measurements'], 'readonly');
    const store = transaction.objectStore('measurements');
    const index = store.index('panelId');
    
    const request = index.openCursor(IDBKeyRange.only(panelId), 'prev');
    const results = [];
    let count = 0;
    
    request.onsuccess = (event) => {
      const cursor = event.target.result;
      
      if (!cursor || (options.limit && count >= options.limit)) {
        resolve(results);
        return;
      }
      
      const measurement = cursor.value;
      
      // Apply date filters
      if (options.startDate && new Date(measurement.timestamp) < new Date(options.startDate)) {
        cursor.continue();
        return;
      }
      if (options.endDate && new Date(measurement.timestamp) > new Date(options.endDate)) {
        cursor.continue();
        return;
      }
      
      // Apply offset
      if (options.offset && count < options.offset) {
        count++;
        cursor.continue();
        return;
      }
      
      results.push(measurement);
      count++;
      cursor.continue();
    };
    
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get measurement history for trending
 * @param {number} panelId - Panel ID
 * @param {string} component - Component name
 * @param {number} days - Number of days back
 * @returns {Promise<Array>} History data
 */
export async function getMeasurementHistory(panelId, component, days = 30) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return getMeasurements(panelId, {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString()
  });
}

// ============================================================
// 4. THERMAL IMAGE OPERATIONS
// ============================================================

/**
 * Add thermal image
 * @param {number} panelId - Panel ID
 * @param {Object} thermalData - Thermal image data
 * @returns {Promise<number>} Thermal image ID
 */
export async function addThermalImage(panelId, thermalData) {
  const database = await initDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['thermalImages'], 'readwrite');
    const store = transaction.objectStore('thermalImages');
    
    const data = {
      ...thermalData,
      panelId,
      timestamp: thermalData.timestamp || new Date().toISOString()
    };
    
    const request = store.add(data);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get thermal images by panel
 * @param {number} panelId - Panel ID
 * @returns {Promise<Array>} Thermal images
 */
export async function getThermalImages(panelId) {
  const database = await initDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['thermalImages'], 'readonly');
    const store = transaction.objectStore('thermalImages');
    const index = store.index('panelId');
    
    const request = index.getAll(panelId);
    request.onsuccess = () => resolve(request.result.reverse());
    request.onerror = () => reject(request.error);
  });
}

// ============================================================
// 5. BACKUP & EXPORT OPERATIONS
// ============================================================

/**
 * Create full project backup
 * @param {string} projectId - Project ID
 * @returns {Promise<Object>} Backup data
 */
export async function createProjectBackup(projectId) {
  const database = await initDatabase();
  
  const backup = {
    projectId,
    timestamp: new Date().toISOString(),
    version: '1.0',
    panels: [],
    measurements: [],
    thermalImages: []
  };
  
  // Get all panels
  const panels = await getPanelsByProject(projectId);
  backup.panels = panels;
  
  // Get all related data
  for (const panel of panels) {
    const measurements = await getMeasurements(panel.id);
    backup.measurements.push(...measurements);
    
    const thermalImages = await getThermalImages(panel.id);
    backup.thermalImages.push(...thermalImages);
  }
  
  // Store backup
  await new Promise((resolve, reject) => {
    const transaction = database.transaction(['backups'], 'readwrite');
    const store = transaction.objectStore('backups');
    
    const request = store.add({
      projectId,
      timestamp: backup.timestamp,
      data: backup
    });
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
  
  return backup;
}

/**
 * Export project data as JSON
 * @param {string} projectId - Project ID
 * @returns {Promise<Object>} Export data
 */
export async function exportProjectData(projectId) {
  const backup = await createProjectBackup(projectId);
  
  return {
    exportDate: new Date().toISOString(),
    exportVersion: '1.0',
    projectId,
    data: backup
  };
}

/**
 * Download project backup as file
 * @param {string} projectId - Project ID
 * @param {string} projectName - Project name for filename
 */
export async function downloadProjectBackup(projectId, projectName = 'project') {
  const data = await exportProjectData(projectId);
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `SLF_Electrical_${projectName}_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Import project data from JSON
 * @param {string} jsonStr - JSON string
 * @returns {Promise<Object>} Import result
 */
export async function importProjectData(jsonStr) {
  try {
    const data = JSON.parse(jsonStr);
    
    if (!data.data || !data.data.panels) {
      throw new Error('Invalid backup format');
    }
    
    const database = await initDatabase();
    
    // Import panels
    for (const panel of data.data.panels) {
      const { id, ...panelData } = panel;
      await createPanel(panelData);
    }
    
    // Import measurements
    for (const measurement of data.data.measurements) {
      const { id, ...measurementData } = measurement;
      await addMeasurement(measurementData.panelId, measurementData);
    }
    
    // Import thermal images
    for (const thermal of data.data.thermalImages) {
      const { id, ...thermalData } = thermal;
      await addThermalImage(thermalData.panelId, thermalData);
    }
    
    return { success: true, importedPanels: data.data.panels.length };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ============================================================
// 6. UTILITY FUNCTIONS
// ============================================================

function deleteFromStore(store, id) {
  return new Promise((resolve, reject) => {
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

function getAllFromIndex(index, value) {
  return new Promise((resolve, reject) => {
    const request = index.getAll(value);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function getMeasurementsByPanelId(store, panelId) {
  return new Promise((resolve, reject) => {
    const index = store.index('panelId');
    const request = index.getAll(panelId);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function getThermalImagesByPanelId(store, panelId) {
  return new Promise((resolve, reject) => {
    const index = store.index('panelId');
    const request = index.getAll(panelId);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// ============================================================
// 7. SYNC WITH SUPABASE
// ============================================================

/**
 * Sync local data to Supabase
 * @param {string} projectId - Project ID
 * @param {Object} supabaseClient - Supabase client instance
 * @returns {Promise<Object>} Sync result
 */
export async function syncToSupabase(projectId, supabaseClient) {
  try {
    const panels = await getPanelsByProject(projectId);
    
    for (const panel of panels) {
      // Upsert panel to Supabase
      const { error: panelError } = await supabaseClient
        .from('electrical_panels')
        .upsert({
          id: panel.id,
          project_id: projectId,
          name: panel.name,
          location: panel.location,
          type: panel.type,
          voltage: panel.voltage,
          mcb_rating: panel.mcbRating,
          mcb_type: panel.mcbType,
          busbar_rating: panel.busbarRating,
          cable_size: panel.cableSize,
          cable_type: panel.cableType,
          cable_length: panel.cableLength,
          ambient_temp: panel.ambientTemp,
          created_at: panel.createdAt,
          updated_at: panel.updatedAt
        });
      
      if (panelError) throw panelError;
      
      // Sync measurements
      const measurements = await getMeasurements(panel.id);
      for (const measurement of measurements) {
        const { error: measurementError } = await supabaseClient
          .from('electrical_measurements')
          .upsert({
            id: measurement.id,
            panel_id: panel.id,
            timestamp: measurement.timestamp,
            location: measurement.location,
            phase: measurement.phase,
            voltage: measurement.voltage,
            current: measurement.current,
            power: measurement.power,
            power_factor: measurement.powerFactor,
            temperature: measurement.temperature,
            thd: measurement.thd,
            loading_percentage: measurement.loadingPercentage,
            status: measurement.status
          });
        
        if (measurementError) throw measurementError;
      }
    }
    
    return { success: true, syncedPanels: panels.length };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Export all functions
export default {
  initDatabase,
  createPanel,
  getPanel,
  getPanelsByProject,
  updatePanel,
  deletePanel,
  addMeasurement,
  getMeasurements,
  getMeasurementHistory,
  addThermalImage,
  getThermalImages,
  createProjectBackup,
  exportProjectData,
  downloadProjectBackup,
  importProjectData,
  syncToSupabase,
  DB_SCHEMA
};
