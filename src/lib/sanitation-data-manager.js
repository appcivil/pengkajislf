/**
 * SANITATION DATA MANAGER
 * IndexedDB operations for Sanitation Inspection data
 * Integrates with Supabase for cloud sync
 */

import { openDB } from 'idb';
import { supabase } from './supabase.js';

const DB_NAME = 'SanitationInspectionDB';
const DB_VERSION = 1;

// Store names
const STORES = {
  PROJECTS: 'sanitation_projects',
  INSPECTION_POINTS: 'inspection_points',
  SEPTIC_TANKS: 'septic_tanks',
  IPAL_UNITS: 'ipal_units',
  CHUTES: 'chutes',
  PIPES: 'pipes',
  MEASUREMENTS: 'measurements',
  PHOTOS: 'photos',
  EFFLUENT_TESTS: 'effluent_tests',
  SLUDGE_RECORDS: 'sludge_records',
  COMPLIANCE_CHECKS: 'compliance_checks',
  SYNC_QUEUE: 'sync_queue'
};

let db = null;

// ============================================================
// DATABASE INITIALIZATION
// ============================================================

export async function initSanitationDatabase() {
  if (db) return db;
  
  db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, newVersion) {
      // Projects store
      if (!db.objectStoreNames.contains(STORES.PROJECTS)) {
        const projectStore = db.createObjectStore(STORES.PROJECTS, { keyPath: 'id' });
        projectStore.createIndex('project_id', 'projectId', { unique: false });
        projectStore.createIndex('sync_status', 'syncStatus', { unique: false });
      }
      
      // Inspection points (inlet, chute locations)
      if (!db.objectStoreNames.contains(STORES.INSPECTION_POINTS)) {
        const pointStore = db.createObjectStore(STORES.INSPECTION_POINTS, { keyPath: 'id', autoIncrement: true });
        pointStore.createIndex('project_id', 'projectId', { unique: false });
        pointStore.createIndex('type', 'type', { unique: false });
        pointStore.createIndex('sync_status', 'syncStatus', { unique: false });
      }
      
      // Septic tanks
      if (!db.objectStoreNames.contains(STORES.SEPTIC_TANKS)) {
        const tankStore = db.createObjectStore(STORES.SEPTIC_TANKS, { keyPath: 'id', autoIncrement: true });
        tankStore.createIndex('project_id', 'projectId', { unique: false });
        tankStore.createIndex('sync_status', 'syncStatus', { unique: false });
      }
      
      // IPAL units
      if (!db.objectStoreNames.contains(STORES.IPAL_UNITS)) {
        const ipalStore = db.createObjectStore(STORES.IPAL_UNITS, { keyPath: 'id', autoIncrement: true });
        ipalStore.createIndex('project_id', 'projectId', { unique: false });
        ipalStore.createIndex('sync_status', 'syncStatus', { unique: false });
      }
      
      // Chutes
      if (!db.objectStoreNames.contains(STORES.CHUTES)) {
        const chuteStore = db.createObjectStore(STORES.CHUTES, { keyPath: 'id', autoIncrement: true });
        chuteStore.createIndex('project_id', 'projectId', { unique: false });
        chuteStore.createIndex('sync_status', 'syncStatus', { unique: false });
      }
      
      // Pipes
      if (!db.objectStoreNames.contains(STORES.PIPES)) {
        const pipeStore = db.createObjectStore(STORES.PIPES, { keyPath: 'id', autoIncrement: true });
        pipeStore.createIndex('project_id', 'projectId', { unique: false });
        pipeStore.createIndex('sync_status', 'syncStatus', { unique: false });
      }
      
      // Measurements (CSV import from data loggers)
      if (!db.objectStoreNames.contains(STORES.MEASUREMENTS)) {
        const measurementStore = db.createObjectStore(STORES.MEASUREMENTS, { keyPath: 'id', autoIncrement: true });
        measurementStore.createIndex('project_id', 'projectId', { unique: false });
        measurementStore.createIndex('point_id', 'pointId', { unique: false });
        measurementStore.createIndex('sync_status', 'syncStatus', { unique: false });
      }
      
      // Photos with annotations
      if (!db.objectStoreNames.contains(STORES.PHOTOS)) {
        const photoStore = db.createObjectStore(STORES.PHOTOS, { keyPath: 'id', autoIncrement: true });
        photoStore.createIndex('project_id', 'projectId', { unique: false });
        photoStore.createIndex('component_id', 'componentId', { unique: false });
        photoStore.createIndex('type', 'type', { unique: false });
        photoStore.createIndex('sync_status', 'syncStatus', { unique: false });
      }
      
      // Effluent quality tests
      if (!db.objectStoreNames.contains(STORES.EFFLUENT_TESTS)) {
        const testStore = db.createObjectStore(STORES.EFFLUENT_TESTS, { keyPath: 'id', autoIncrement: true });
        testStore.createIndex('project_id', 'projectId', { unique: false });
        testStore.createIndex('ipal_id', 'ipalId', { unique: false });
        testStore.createIndex('sync_status', 'syncStatus', { unique: false });
      }
      
      // Sludge records
      if (!db.objectStoreNames.contains(STORES.SLUDGE_RECORDS)) {
        const sludgeStore = db.createObjectStore(STORES.SLUDGE_RECORDS, { keyPath: 'id', autoIncrement: true });
        sludgeStore.createIndex('project_id', 'projectId', { unique: false });
        sludgeStore.createIndex('tank_id', 'tankId', { unique: false });
        sludgeStore.createIndex('sync_status', 'syncStatus', { unique: false });
      }
      
      // Compliance checks
      if (!db.objectStoreNames.contains(STORES.COMPLIANCE_CHECKS)) {
        const complianceStore = db.createObjectStore(STORES.COMPLIANCE_CHECKS, { keyPath: 'id', autoIncrement: true });
        complianceStore.createIndex('project_id', 'projectId', { unique: false });
        complianceStore.createIndex('sync_status', 'syncStatus', { unique: false });
      }
      
      // Sync queue for offline support
      if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
        const syncStore = db.createObjectStore(STORES.SYNC_QUEUE, { keyPath: 'id', autoIncrement: true });
        syncStore.createIndex('project_id', 'projectId', { unique: false });
        syncStore.createIndex('store_name', 'storeName', { unique: false });
        syncStore.createIndex('status', 'status', { unique: false });
      }
    }
  });
  
  return db;
}

// ============================================================
// GENERIC CRUD OPERATIONS
// ============================================================

async function addItem(storeName, data) {
  const db = await initSanitationDatabase();
  const item = {
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    syncStatus: navigator.onLine ? 'synced' : 'pending'
  };
  
  const id = await db.add(storeName, item);
  
  // Add to sync queue if offline
  if (!navigator.onLine) {
    await addToSyncQueue(storeName, 'create', { ...item, id });
  }
  
  return { ...item, id };
}

async function getItem(storeName, id) {
  const db = await initSanitationDatabase();
  return await db.get(storeName, id);
}

async function getAllItems(storeName, projectId = null) {
  const db = await initSanitationDatabase();
  
  if (projectId) {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const index = store.index('project_id');
    return await index.getAll(projectId);
  }
  
  return await db.getAll(storeName);
}

async function updateItem(storeName, id, data) {
  const db = await initSanitationDatabase();
  const existing = await db.get(storeName, id);
  
  if (!existing) {
    throw new Error(`Item ${id} not found in ${storeName}`);
  }
  
  const updated = {
    ...existing,
    ...data,
    updatedAt: new Date().toISOString(),
    syncStatus: navigator.onLine ? 'synced' : 'pending'
  };
  
  await db.put(storeName, updated);
  
  // Add to sync queue if offline
  if (!navigator.onLine) {
    await addToSyncQueue(storeName, 'update', updated);
  }
  
  return updated;
}

async function deleteItem(storeName, id) {
  const db = await initSanitationDatabase();
  
  // Add to sync queue if offline
  if (!navigator.onLine) {
    await addToSyncQueue(storeName, 'delete', { id });
  }
  
  await db.delete(storeName, id);
  return true;
}

async function addToSyncQueue(storeName, operation, data) {
  const db = await initSanitationDatabase();
  const queueItem = {
    storeName,
    operation,
    data,
    projectId: data.projectId,
    status: 'pending',
    retries: 0,
    createdAt: new Date().toISOString()
  };
  
  return await db.add(STORES.SYNC_QUEUE, queueItem);
}

// ============================================================
// INSPECTION POINTS (Inlet, Chute Locations)
// ============================================================

export async function createInspectionPoint(projectId, pointData) {
  return await addItem(STORES.INSPECTION_POINTS, {
    projectId,
    ...pointData,
    type: pointData.type || 'inlet', // inlet, chute, manhole
    coordinates: pointData.coordinates || null,
    measurements: pointData.measurements || {},
    condition: pointData.condition || 'good', // good, fair, poor
    notes: pointData.notes || ''
  });
}

export async function getInspectionPoints(projectId, type = null) {
  const points = await getAllItems(STORES.INSPECTION_POINTS, projectId);
  if (type) {
    return points.filter(p => p.type === type);
  }
  return points;
}

export async function updateInspectionPoint(id, data) {
  return await updateItem(STORES.INSPECTION_POINTS, id, data);
}

export async function deleteInspectionPoint(id) {
  return await deleteItem(STORES.INSPECTION_POINTS, id);
}

// ============================================================
// SEPTIC TANKS
// ============================================================

export async function createSepticTank(projectId, tankData) {
  return await addItem(STORES.SEPTIC_TANKS, {
    projectId,
    ...tankData,
    name: tankData.name || 'Septic Tank 1',
    dimensions: tankData.dimensions || {},
    volume: tankData.volume || 0,
    compartmentRatio: tankData.compartmentRatio || '2:1',
    coordinates: tankData.coordinates || null,
    distances: tankData.distances || {}, // to well, building, etc
    waterTightness: tankData.waterTightness || null,
    constructionDate: tankData.constructionDate || null,
    lastDesludging: tankData.lastDesludging || null,
    nextDesludging: tankData.nextDesludging || null,
    status: tankData.status || 'active'
  });
}

export async function getSepticTanks(projectId) {
  return await getAllItems(STORES.SEPTIC_TANKS, projectId);
}

export async function getSepticTank(id) {
  return await getItem(STORES.SEPTIC_TANKS, id);
}

export async function updateSepticTank(id, data) {
  return await updateItem(STORES.SEPTIC_TANKS, id, data);
}

export async function deleteSepticTank(id) {
  return await deleteItem(STORES.SEPTIC_TANKS, id);
}

// ============================================================
// IPAL UNITS
// ============================================================

export async function createIPAL(projectId, ipalData) {
  return await addItem(STORES.IPAL_UNITS, {
    projectId,
    ...ipalData,
    name: ipalData.name || 'IPAL Biofilter 1',
    type: ipalData.type || 'biofilter', // biofilter, anaerob, aerob
    compartments: ipalData.compartments || {
      anaerob: { volume: 0, dimensions: {} },
      aerob: { volume: 0, dimensions: {} },
      settling: { volume: 0, dimensions: {} }
    },
    coordinates: ipalData.coordinates || null,
    designFlow: ipalData.designFlow || 0,
    actualFlow: ipalData.actualFlow || 0,
    effluentQuality: ipalData.effluentQuality || {},
    removalEfficiency: ipalData.removalEfficiency || {},
    status: ipalData.status || 'active'
  });
}

export async function getIPALs(projectId) {
  return await getAllItems(STORES.IPAL_UNITS, projectId);
}

export async function getIPAL(id) {
  return await getItem(STORES.IPAL_UNITS, id);
}

export async function updateIPAL(id, data) {
  return await updateItem(STORES.IPAL_UNITS, id, data);
}

export async function deleteIPAL(id) {
  return await deleteItem(STORES.IPAL_UNITS, id);
}

// ============================================================
// CHUTES
// ============================================================

export async function createChute(projectId, chuteData) {
  return await addItem(STORES.CHUTES, {
    projectId,
    ...chuteData,
    name: chuteData.name || 'Chute 1',
    location: chuteData.location || '',
    dimensions: chuteData.dimensions || { width: 0.6, height: 0.6 },
    slope: chuteData.slope || 0,
    buildingHeight: chuteData.buildingHeight || 0,
    wasteGeneration: chuteData.wasteGeneration || 0,
    servingFloors: chuteData.servingFloors || [],
    condition: chuteData.condition || 'good',
    status: chuteData.status || 'active'
  });
}

export async function getChutes(projectId) {
  return await getAllItems(STORES.CHUTES, projectId);
}

export async function getChute(id) {
  return await getItem(STORES.CHUTES, id);
}

export async function updateChute(id, data) {
  return await updateItem(STORES.CHUTES, id, data);
}

export async function deleteChute(id) {
  return await deleteItem(STORES.CHUTES, id);
}

// ============================================================
// PIPES
// ============================================================

export async function createPipe(projectId, pipeData) {
  return await addItem(STORES.PIPES, {
    projectId,
    ...pipeData,
    name: pipeData.name || 'Pipa 1',
    type: pipeData.type || 'gravity', // gravity, pressure
    diameter: pipeData.diameter || 0,
    length: pipeData.length || 0,
    material: pipeData.material || 'pvc',
    slope: pipeData.slope || 0,
    flowRate: pipeData.flowRate || 0,
    velocity: pipeData.velocity || 0,
    fromComponent: pipeData.fromComponent || '',
    toComponent: pipeData.toComponent || '',
    condition: pipeData.condition || 'good',
    status: pipeData.status || 'active'
  });
}

export async function getPipes(projectId) {
  return await getAllItems(STORES.PIPES, projectId);
}

export async function getPipe(id) {
  return await getItem(STORES.PIPES, id);
}

export async function updatePipe(id, data) {
  return await updateItem(STORES.PIPES, id, data);
}

export async function deletePipe(id) {
  return await deleteItem(STORES.PIPES, id);
}

// ============================================================
// MEASUREMENTS (Data Logger Import)
// ============================================================

export async function addMeasurement(projectId, pointId, measurementData) {
  return await addItem(STORES.MEASUREMENTS, {
    projectId,
    pointId,
    ...measurementData,
    type: measurementData.type || 'flow', // flow, depth, velocity, pressure
    value: measurementData.value || 0,
    unit: measurementData.unit || '',
    timestamp: measurementData.timestamp || new Date().toISOString(),
    device: measurementData.device || '',
    notes: measurementData.notes || ''
  });
}

export async function importMeasurementsFromCSV(projectId, csvData) {
  const measurements = [];
  
  // Parse CSV data using PapaParse or manual parsing
  const rows = csvData.split('\n').filter(row => row.trim());
  const headers = rows[0].split(',').map(h => h.trim());
  
  for (let i = 1; i < rows.length; i++) {
    const values = rows[i].split(',').map(v => v.trim());
    const rowData = {};
    
    headers.forEach((header, index) => {
      rowData[header] = values[index];
    });
    
    const measurement = await addMeasurement(projectId, null, {
      type: rowData.type || 'flow',
      value: parseFloat(rowData.value) || 0,
      unit: rowData.unit || '',
      timestamp: rowData.timestamp || new Date().toISOString(),
      device: rowData.device || '',
      notes: rowData.notes || ''
    });
    
    measurements.push(measurement);
  }
  
  return measurements;
}

export async function getMeasurements(projectId, pointId = null) {
  const measurements = await getAllItems(STORES.MEASUREMENTS, projectId);
  if (pointId) {
    return measurements.filter(m => m.pointId === pointId);
  }
  return measurements;
}

export async function deleteMeasurement(id) {
  return await deleteItem(STORES.MEASUREMENTS, id);
}

// ============================================================
// PHOTOS WITH ANNOTATIONS
// ============================================================

export async function addPhoto(projectId, componentId, photoData) {
  return await addItem(STORES.PHOTOS, {
    projectId,
    componentId,
    ...photoData,
    type: photoData.type || 'general', // general, damage, condition, evidence
    url: photoData.url || '',
    base64: photoData.base64 || '',
    annotations: photoData.annotations || [], // [{type, x, y, description}]
    condition: photoData.condition || 'good', // good, fair, poor, critical
    damageType: photoData.damageType || '', // retak, bocor, sumbat, korosi
    caption: photoData.caption || '',
    takenAt: photoData.takenAt || new Date().toISOString(),
    coordinates: photoData.coordinates || null
  });
}

export async function getPhotos(projectId, componentId = null, type = null) {
  const photos = await getAllItems(STORES.PHOTOS, projectId);
  
  let filtered = photos;
  if (componentId) {
    filtered = filtered.filter(p => p.componentId === componentId);
  }
  if (type) {
    filtered = filtered.filter(p => p.type === type);
  }
  
  return filtered;
}

export async function updatePhoto(id, data) {
  return await updateItem(STORES.PHOTOS, id, data);
}

export async function deletePhoto(id) {
  return await deleteItem(STORES.PHOTOS, id);
}

// ============================================================
// EFFLUENT TESTS
// ============================================================

export async function addEffluentTest(projectId, ipalId, testData) {
  return await addItem(STORES.EFFLUENT_TESTS, {
    projectId,
    ipalId,
    ...testData,
    testDate: testData.testDate || new Date().toISOString(),
    laboratory: testData.laboratory || '',
    parameters: {
      bod: testData.bod || 0,
      tss: testData.tss || 0,
      cod: testData.cod || 0,
      ph: testData.ph || 7,
      coliform: testData.coliform || 0,
      temperature: testData.temperature || 0,
      do: testData.do || 0,
      ...testData.parameters
    },
    inletValues: testData.inletValues || {},
    removalEfficiency: testData.removalEfficiency || {},
    compliance: testData.compliance || {},
    notes: testData.notes || ''
  });
}

export async function getEffluentTests(projectId, ipalId = null) {
  const tests = await getAllItems(STORES.EFFLUENT_TESTS, projectId);
  if (ipalId) {
    return tests.filter(t => t.ipalId === ipalId);
  }
  return tests;
}

export async function getLatestEffluentTest(projectId, ipalId = null) {
  const tests = await getEffluentTests(projectId, ipalId);
  if (tests.length === 0) return null;
  
  return tests.sort((a, b) => new Date(b.testDate) - new Date(a.testDate))[0];
}

export async function updateEffluentTest(id, data) {
  return await updateItem(STORES.EFFLUENT_TESTS, id, data);
}

export async function deleteEffluentTest(id) {
  return await deleteItem(STORES.EFFLUENT_TESTS, id);
}

// ============================================================
// SLUDGE RECORDS
// ============================================================

export async function addSludgeRecord(projectId, tankId, recordData) {
  return await addItem(STORES.SLUDGE_RECORDS, {
    projectId,
    tankId,
    ...recordData,
    recordDate: recordData.recordDate || new Date().toISOString(),
    level: recordData.level || 0, // percentage
    volume: recordData.volume || 0, // m³
    nextDesludging: recordData.nextDesludging || null,
    urgency: recordData.urgency || 'NORMAL', // NORMAL, MEDIUM, HIGH, CRITICAL
    notes: recordData.notes || ''
  });
}

export async function getSludgeRecords(projectId, tankId = null) {
  const records = await getAllItems(STORES.SLUDGE_RECORDS, projectId);
  if (tankId) {
    return records.filter(r => r.tankId === tankId);
  }
  return records;
}

export async function getLatestSludgeRecord(projectId, tankId = null) {
  const records = await getSludgeRecords(projectId, tankId);
  if (records.length === 0) return null;
  
  return records.sort((a, b) => new Date(b.recordDate) - new Date(a.recordDate))[0];
}

// ============================================================
// COMPLIANCE CHECKS
// ============================================================

export async function saveComplianceCheck(projectId, checkData) {
  return await addItem(STORES.COMPLIANCE_CHECKS, {
    projectId,
    ...checkData,
    checkDate: checkData.checkDate || new Date().toISOString(),
    standard: checkData.standard || 'PP_16_2021',
    pasal: checkData.pasal || '',
    items: checkData.items || [],
    overallStatus: checkData.overallStatus || 'NC',
    citations: checkData.citations || [],
    recommendations: checkData.recommendations || []
  });
}

export async function getComplianceChecks(projectId) {
  return await getAllItems(STORES.COMPLIANCE_CHECKS, projectId);
}

export async function getLatestComplianceCheck(projectId) {
  const checks = await getComplianceChecks(projectId);
  if (checks.length === 0) return null;
  
  return checks.sort((a, b) => new Date(b.checkDate) - new Date(a.checkDate))[0];
}

// ============================================================
// SYNC OPERATIONS
// ============================================================

export async function syncToSupabase(projectId) {
  if (!navigator.onLine) {
    console.log('[Sanitation] Offline - sync deferred');
    return { synced: 0, pending: 'offline' };
  }
  
  try {
    const syncItems = [];
    
    // Get all pending items from each store
    for (const storeName of Object.values(STORES)) {
      if (storeName === STORES.SYNC_QUEUE) continue;
      
      const items = await getAllItems(storeName, projectId);
      const pendingItems = items.filter(item => item.syncStatus === 'pending');
      
      for (const item of pendingItems) {
        syncItems.push({ storeName, item });
      }
    }
    
    // Sync to Supabase
    let synced = 0;
    for (const { storeName, item } of syncItems) {
      try {
        // Map to Supabase table names
        const tableName = mapStoreToTable(storeName);
        if (!tableName) continue;
        
        const { id, syncStatus, ...data } = item;
        
        // Upsert to Supabase
        const { error } = await supabase
          .from(tableName)
          .upsert({ ...data, local_id: id });
        
        if (!error) {
          // Mark as synced
          await updateItem(storeName, id, { syncStatus: 'synced' });
          synced++;
        }
      } catch (e) {
        console.error(`[Sanitation] Sync error for ${storeName}:`, e);
      }
    }
    
    return { synced, total: syncItems.length };
  } catch (e) {
    console.error('[Sanitation] Sync error:', e);
    return { synced: 0, error: e.message };
  }
}

function mapStoreToTable(storeName) {
  const mapping = {
    [STORES.INSPECTION_POINTS]: 'sanitation_inspection_points',
    [STORES.SEPTIC_TANKS]: 'sanitation_septic_tanks',
    [STORES.IPAL_UNITS]: 'sanitation_ipal_units',
    [STORES.CHUTES]: 'sanitation_chutes',
    [STORES.PIPES]: 'sanitation_pipes',
    [STORES.MEASUREMENTS]: 'sanitation_measurements',
    [STORES.PHOTOS]: 'sanitation_photos',
    [STORES.EFFLUENT_TESTS]: 'sanitation_effluent_tests',
    [STORES.SLUDGE_RECORDS]: 'sanitation_sludge_records',
    [STORES.COMPLIANCE_CHECKS]: 'sanitation_compliance_checks'
  };
  
  return mapping[storeName];
}

export async function loadFromSupabase(projectId) {
  try {
    // Load data from Supabase and merge with local
    const tables = [
      { name: 'sanitation_septic_tanks', store: STORES.SEPTIC_TANKS },
      { name: 'sanitation_ipal_units', store: STORES.IPAL_UNITS },
      { name: 'sanitation_chutes', store: STORES.CHUTES },
      { name: 'sanitation_pipes', store: STORES.PIPES },
      { name: 'sanitation_inspection_points', store: STORES.INSPECTION_POINTS },
      { name: 'sanitation_effluent_tests', store: STORES.EFFLUENT_TESTS },
      { name: 'sanitation_sludge_records', store: STORES.SLUDGE_RECORDS }
    ];
    
    for (const { name, store } of tables) {
      const { data, error } = await supabase
        .from(name)
        .select('*')
        .eq('project_id', projectId);
      
      if (!error && data) {
        const db = await initSanitationDatabase();
        const tx = db.transaction(store, 'readwrite');
        const objectStore = tx.objectStore(store);
        
        for (const item of data) {
          // Check if exists locally
          const { local_id, ...rest } = item;
          const existing = local_id ? await objectStore.get(local_id) : null;
          
          if (!existing) {
            await objectStore.put({ ...rest, id: local_id || undefined, syncStatus: 'synced' });
          }
        }
      }
    }
    
    return { success: true };
  } catch (e) {
    console.error('[Sanitation] Load error:', e);
    return { success: false, error: e.message };
  }
}

// ============================================================
// EXPORT/IMPORT PROJECT
// ============================================================

export async function exportProjectData(projectId) {
  const data = {
    projectId,
    exportDate: new Date().toISOString(),
    septicTanks: await getSepticTanks(projectId),
    ipals: await getIPALs(projectId),
    chutes: await getChutes(projectId),
    pipes: await getPipes(projectId),
    inspectionPoints: await getInspectionPoints(projectId),
    measurements: await getMeasurements(projectId),
    photos: await getPhotos(projectId),
    effluentTests: await getEffluentTests(projectId),
    sludgeRecords: await getSludgeRecords(projectId),
    complianceChecks: await getComplianceChecks(projectId)
  };
  
  return data;
}

export async function importProjectData(projectId, data) {
  try {
    // Clear existing data for project
    // Then import new data
    
    if (data.septicTanks) {
      for (const tank of data.septicTanks) {
        await createSepticTank(projectId, tank);
      }
    }
    
    if (data.ipals) {
      for (const ipal of data.ipals) {
        await createIPAL(projectId, ipal);
      }
    }
    
    if (data.chutes) {
      for (const chute of data.chutes) {
        await createChute(projectId, chute);
      }
    }
    
    if (data.pipes) {
      for (const pipe of data.pipes) {
        await createPipe(projectId, pipe);
      }
    }
    
    return { success: true };
  } catch (e) {
    console.error('[Sanitation] Import error:', e);
    return { success: false, error: e.message };
  }
}

// ============================================================
// SUMMARY FUNCTIONS
// ============================================================

export async function getSanitationSummary(projectId) {
  const [
    tanks,
    ipals,
    chutes,
    pipes,
    points,
    tests,
    records
  ] = await Promise.all([
    getSepticTanks(projectId),
    getIPALs(projectId),
    getChutes(projectId),
    getPipes(projectId),
    getInspectionPoints(projectId),
    getEffluentTests(projectId),
    getSludgeRecords(projectId)
  ]);
  
  const latestTest = tests.length > 0 
    ? tests.sort((a, b) => new Date(b.testDate) - new Date(a.testDate))[0]
    : null;
  
  const criticalSludge = records.filter(r => r.urgency === 'CRITICAL');
  
  const nonCompliantTests = tests.filter(t => {
    const params = t.parameters || {};
    return params.bod > 30 || params.tss > 50 || params.ph < 6 || params.ph > 9;
  });
  
  return {
    hasData: tanks.length > 0 || ipals.length > 0 || chutes.length > 0,
    counts: {
      septicTanks: tanks.length,
      ipals: ipals.length,
      chutes: chutes.length,
      pipes: pipes.length,
      inspectionPoints: points.length,
      effluentTests: tests.length,
      sludgeRecords: records.length
    },
    compliance: {
      effluentStatus: latestTest ? (nonCompliantTests.length > 0 ? 'NC' : 'C') : 'UNKNOWN',
      sludgeStatus: criticalSludge.length > 0 ? 'CRITICAL' : 'NORMAL'
    },
    latestTest,
    criticalSludge: criticalSludge.length,
    nonCompliantTests: nonCompliantTests.length
  };
}

// Export all functions
export default {
  initSanitationDatabase,
  
  // Inspection points
  createInspectionPoint,
  getInspectionPoints,
  updateInspectionPoint,
  deleteInspectionPoint,
  
  // Septic tanks
  createSepticTank,
  getSepticTanks,
  getSepticTank,
  updateSepticTank,
  deleteSepticTank,
  
  // IPAL
  createIPAL,
  getIPALs,
  getIPAL,
  updateIPAL,
  deleteIPAL,
  
  // Chutes
  createChute,
  getChutes,
  getChute,
  updateChute,
  deleteChute,
  
  // Pipes
  createPipe,
  getPipes,
  getPipe,
  updatePipe,
  deletePipe,
  
  // Measurements
  addMeasurement,
  importMeasurementsFromCSV,
  getMeasurements,
  deleteMeasurement,
  
  // Photos
  addPhoto,
  getPhotos,
  updatePhoto,
  deletePhoto,
  
  // Effluent tests
  addEffluentTest,
  getEffluentTests,
  getLatestEffluentTest,
  updateEffluentTest,
  deleteEffluentTest,
  
  // Sludge
  addSludgeRecord,
  getSludgeRecords,
  getLatestSludgeRecord,
  
  // Compliance
  saveComplianceCheck,
  getComplianceChecks,
  getLatestComplianceCheck,
  
  // Sync
  syncToSupabase,
  loadFromSupabase,
  
  // Export/Import
  exportProjectData,
  importProjectData,
  
  // Summary
  getSanitationSummary
};
