// ============================================================
// ELECTRICAL SYSTEM INSPECTION - DATA IMPORT UTILITIES
// CSV/Excel Import from Data Loggers & Thermal Cameras
// Supports: Fluke, Hioki, FLIR thermal data
// ============================================================

import * as XLSX from 'xlsx';

// ============================================================
// 1. CSV PARSING UTILITIES
// ============================================================

/**
 * Parse CSV data from clamp meter data loggers
 * Supports Fluke, Hioki formats
 * @param {string} csvText - Raw CSV text
 * @param {string} deviceType - 'fluke', 'hioki', 'generic'
 * @returns {Array} Parsed measurement records
 */
export function parseDataLoggerCSV(csvText, deviceType = 'generic') {
  const lines = csvText.trim().split('\n');
  const results = [];
  
  switch (deviceType.toLowerCase()) {
    case 'fluke':
      return parseFlukeFormat(lines);
    case 'hioki':
      return parseHiokiFormat(lines);
    default:
      return parseGenericCSV(lines);
  }
}

/**
 * Parse Fluke clamp meter CSV format
 */
function parseFlukeFormat(lines) {
  const records = [];
  // Skip header rows (Fluke has multiple header lines)
  let dataStart = 0;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('Reading') || lines[i].includes('Time')) {
      dataStart = i + 1;
      break;
    }
  }
  
  for (let i = dataStart; i < lines.length; i++) {
    const cols = lines[i].split(',');
    if (cols.length < 3) continue;
    
    records.push({
      timestamp: cols[0]?.trim() || new Date().toISOString(),
      current: parseFloat(cols[1]) || 0,
      voltage: parseFloat(cols[2]) || 0,
      powerFactor: parseFloat(cols[3]) || 0.85,
      frequency: parseFloat(cols[4]) || 50,
      source: 'Fluke Clamp Meter',
      unit: cols[5]?.trim() || 'A'
    });
  }
  
  return records;
}

/**
 * Parse Hioki clamp meter CSV format
 */
function parseHiokiFormat(lines) {
  const records = [];
  // Hioki typically has a specific header format
  const headerIndex = lines.findIndex(l => l.includes('Date') || l.includes('Time'));
  
  for (let i = headerIndex + 1; i < lines.length; i++) {
    const cols = lines[i].split(',');
    if (cols.length < 2) continue;
    
    records.push({
      timestamp: cols[0]?.trim() || new Date().toISOString(),
      current_R: parseFloat(cols[1]) || 0,
      current_S: parseFloat(cols[2]) || 0,
      current_T: parseFloat(cols[3]) || 0,
      voltage_R: parseFloat(cols[4]) || 0,
      voltage_S: parseFloat(cols[5]) || 0,
      voltage_T: parseFloat(cols[6]) || 0,
      power: parseFloat(cols[7]) || 0,
      powerFactor: parseFloat(cols[8]) || 0.85,
      thd: parseFloat(cols[9]) || 0,
      source: 'Hioki Clamp Meter',
      is3Phase: true
    });
  }
  
  return records;
}

/**
 * Parse generic CSV format
 */
function parseGenericCSV(lines) {
  const records = [];
  // Assume first line is header
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',');
    if (cols.length < 2) continue;
    
    const record = { source: 'Generic CSV', timestamp: new Date().toISOString() };
    
    headers.forEach((header, idx) => {
      const val = cols[idx]?.trim();
      if (header.includes('current') || header.includes('arus')) {
        record.current = parseFloat(val) || 0;
      } else if (header.includes('voltage') || header.includes('tegangan')) {
        record.voltage = parseFloat(val) || 0;
      } else if (header.includes('power') || header.includes('daya')) {
        record.power = parseFloat(val) || 0;
      } else if (header.includes('pf') || header.includes('cos')) {
        record.powerFactor = parseFloat(val) || 0.85;
      } else if (header.includes('temp') || header.includes('suhu')) {
        record.temperature = parseFloat(val) || 0;
      } else if (header.includes('thd')) {
        record.thd = parseFloat(val) || 0;
      } else if (header.includes('time') || header.includes('waktu')) {
        record.timestamp = val || record.timestamp;
      }
    });
    
    records.push(record);
  }
  
  return records;
}

// ============================================================
// 2. EXCEL FILE PARSING
// ============================================================

/**
 * Parse Excel file from data logger
 * @param {ArrayBuffer} arrayBuffer - File data
 * @returns {Promise<Array>} Parsed records
 */
export async function parseDataLoggerExcel(arrayBuffer) {
  try {
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
    
    if (data.length < 2) return [];
    
    const headers = data[0].map(h => String(h).trim().toLowerCase());
    const records = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const record = { source: 'Excel Import', timestamp: new Date().toISOString() };
      
      headers.forEach((header, idx) => {
        const val = row[idx];
        if (header.includes('timestamp') || header.includes('time') || header.includes('waktu')) {
          record.timestamp = val instanceof Date ? val.toISOString() : String(val);
        } else if (header.includes('current') || header.includes('arus') || header === 'i' || header === 'a') {
          record.current = parseFloat(val) || 0;
        } else if (header.includes('voltage') || header.includes('tegangan') || header === 'v') {
          record.voltage = parseFloat(val) || 0;
        } else if (header.includes('power') || header.includes('daya') || header === 'p' || header === 'kw') {
          record.power = parseFloat(val) || 0;
        } else if (header.includes('apparent') || header.includes('kva') || header === 's') {
          record.apparentPower = parseFloat(val) || 0;
        } else if (header.includes('pf') || header.includes('cos') || header === 'cosφ') {
          record.powerFactor = parseFloat(val) || 0.85;
        } else if (header.includes('freq') || header.includes('frek')) {
          record.frequency = parseFloat(val) || 50;
        } else if (header.includes('thd')) {
          record.thd = parseFloat(val) || 0;
        } else if (header.includes('temp') || header.includes('suhu') || header === 't') {
          record.temperature = parseFloat(val) || 0;
        } else if (header.includes('ir') || header.includes('r')) {
          record.current_R = parseFloat(val) || 0;
        } else if (header.includes('is') || header.includes('s')) {
          record.current_S = parseFloat(val) || 0;
        } else if (header.includes('it') || header.includes('t')) {
          record.current_T = parseFloat(val) || 0;
        }
      });
      
      records.push(record);
    }
    
    return records;
  } catch (error) {
    console.error('Error parsing Excel:', error);
    return [];
  }
}

// ============================================================
// 3. THERMAL IMAGE METADATA PARSING
// ============================================================

/**
 * Parse FLIR thermal image metadata
 * Uses EXIF data extraction
 * @param {File} imageFile - Thermal image file
 * @returns {Promise<Object>} Thermal metadata
 */
export async function parseThermalImageMetadata(imageFile) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const result = {
        fileName: imageFile.name,
        fileSize: imageFile.size,
        fileType: imageFile.type,
        timestamp: new Date(imageFile.lastModified).toISOString(),
        temperatures: {},
        cameraInfo: {},
        hasThermalData: false
      };
      
      try {
        // Parse JPEG for FLIR metadata
        const data = new Uint8Array(e.target.result);
        const str = new TextDecoder().decode(data);
        
        // Look for FLIR specific markers
        const flirMarker = str.indexOf('FLIR');
        if (flirMarker !== -1) {
          result.hasThermalData = true;
          result.cameraInfo.brand = 'FLIR';
          
          // Extract raw thermal data if available
          const rawDataMarker = str.indexOf('RawThermalImage');
          if (rawDataMarker !== -1) {
            result.hasRawThermal = true;
          }
        }
        
        // Extract EXIF-like temperature data
        const tempPatterns = [
          { pattern: /PlanckR1[\s]*[=:][\s]*([\d.]+)/, key: 'planckR1' },
          { pattern: /PlanckB[\s]*[=:][\s]*([\d.]+)/, key: 'planckB' },
          { pattern: /PlanckF[\s]*[=:][\s]*([\d.]+)/, key: 'planckF' },
          { pattern: /ReflectedApparentTemperature[\s]*[=:][\s]*([\d.]+)/, key: 'reflectedTemp' },
          { pattern: /AtmosphericTemperature[\s]*[=:][\s]*([\d.]+)/, key: 'atmosphericTemp' },
          { pattern: /IRWindowTemperature[\s]*[=:][\s]*([\d.]+)/, key: 'irWindowTemp' },
          { pattern: /RelativeHumidity[\s]*[=:][\s]*([\d.]+)/, key: 'humidity' }
        ];
        
        tempPatterns.forEach(({ pattern, key }) => {
          const match = str.match(pattern);
          if (match) {
            result.temperatures[key] = parseFloat(match[1]);
          }
        });
        
      } catch (err) {
        console.error('Error parsing thermal metadata:', err);
      }
      
      resolve(result);
    };
    
    reader.onerror = () => resolve({ error: 'Failed to read file' });
    reader.readAsArrayBuffer(imageFile);
  });
}

/**
 * Extract temperature from thermal image (if embedded)
 * Note: Full thermal analysis requires specialized FLIR SDK
 * @param {File} imageFile - Thermal image
 * @returns {Promise<Object>} Temperature data
 */
export async function extractThermalTemperatures(imageFile) {
  const metadata = await parseThermalImageMetadata(imageFile);
  
  // For FLIR images, we would need the FLIR SDK or specialized
  // thermal image processing. This is a simplified version.
  return {
    ...metadata,
    hotspots: [],
    maxTemp: null,
    minTemp: null,
    avgTemp: null,
    note: 'Full thermal analysis requires FLIR Atlas SDK or specialized thermal processing'
  };
}

// ============================================================
// 4. DATA VALIDATION & CLEANING
// ============================================================

/**
 * Validate and clean imported measurement data
 * @param {Array} records - Raw records
 * @returns {Object} Cleaned data with statistics
 */
export function validateAndCleanData(records) {
  const validRecords = [];
  const errors = [];
  
  records.forEach((record, idx) => {
    const cleaned = { ...record };
    let hasError = false;
    
    // Validate current values
    if (cleaned.current !== undefined) {
      if (cleaned.current < 0 || cleaned.current > 5000) {
        errors.push({ row: idx, field: 'current', value: cleaned.current, issue: 'Out of range' });
        hasError = true;
      }
    }
    
    // Validate voltage values
    if (cleaned.voltage !== undefined) {
      if (cleaned.voltage < 0 || cleaned.voltage > 1000) {
        errors.push({ row: idx, field: 'voltage', value: cleaned.voltage, issue: 'Out of range' });
        hasError = true;
      }
    }
    
    // Validate power factor
    if (cleaned.powerFactor !== undefined) {
      if (cleaned.powerFactor < 0 || cleaned.powerFactor > 1) {
        cleaned.powerFactor = 0.85; // Default value
      }
    }
    
    // Validate temperature
    if (cleaned.temperature !== undefined) {
      if (cleaned.temperature < -20 || cleaned.temperature > 200) {
        errors.push({ row: idx, field: 'temperature', value: cleaned.temperature, issue: 'Out of range' });
        hasError = true;
      }
    }
    
    if (!hasError) {
      validRecords.push(cleaned);
    }
  });
  
  // Calculate statistics
  const stats = calculateStatistics(validRecords);
  
  return {
    validRecords,
    errors,
    stats,
    totalRows: records.length,
    validRows: validRecords.length,
    errorRate: ((errors.length / records.length) * 100).toFixed(2)
  };
}

function calculateStatistics(records) {
  if (records.length === 0) return {};
  
  const extractValues = (field) => records
    .map(r => r[field])
    .filter(v => v !== undefined && !isNaN(v));
  
  const calcStats = (values) => {
    if (values.length === 0) return null;
    const sorted = [...values].sort((a, b) => a - b);
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const median = sorted[Math.floor(sorted.length / 2)];
    
    return { avg: avg.toFixed(2), min, max, median, count: values.length };
  };
  
  return {
    current: calcStats(extractValues('current')),
    voltage: calcStats(extractValues('voltage')),
    power: calcStats(extractValues('power')),
    powerFactor: calcStats(extractValues('powerFactor')),
    temperature: calcStats(extractValues('temperature')),
    thd: calcStats(extractValues('thd'))
  };
}

// ============================================================
// 5. BATCH PROCESSING UTILITIES
// ============================================================

/**
 * Process multiple measurement files
 * @param {FileList} files - List of files to process
 * @param {Function} progressCallback - Progress callback (loaded, total)
 * @returns {Promise<Object>} Processed data
 */
export async function batchProcessFiles(files, progressCallback = null) {
  const results = {
    measurements: [],
    thermalImages: [],
    errors: [],
    summary: { totalFiles: files.length, processed: 0, failed: 0 }
  };
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    try {
      if (file.name.endsWith('.csv')) {
        const text = await file.text();
        const deviceType = detectDeviceType(file.name, text);
        const records = parseDataLoggerCSV(text, deviceType);
        const validated = validateAndCleanData(records);
        results.measurements.push(...validated.validRecords);
        results.errors.push(...validated.errors);
      } else if (file.name.match(/\.(xlsx?|xls)$/i)) {
        const buffer = await file.arrayBuffer();
        const records = await parseDataLoggerExcel(buffer);
        const validated = validateAndCleanData(records);
        results.measurements.push(...validated.validRecords);
        results.errors.push(...validated.errors);
      } else if (file.name.match(/\.(jpg|jpeg|png|tif)$/i)) {
        const thermalData = await extractThermalTemperatures(file);
        results.thermalImages.push(thermalData);
      }
      
      results.summary.processed++;
    } catch (error) {
      results.errors.push({ file: file.name, error: error.message });
      results.summary.failed++;
    }
    
    if (progressCallback) {
      progressCallback(i + 1, files.length);
    }
  }
  
  return results;
}

/**
 * Detect device type from filename or content
 */
function detectDeviceType(filename, content) {
  const lowerName = filename.toLowerCase();
  
  if (lowerName.includes('fluke')) return 'fluke';
  if (lowerName.includes('hioki')) return 'hioki';
  if (lowerName.includes('hioiki')) return 'hioki';
  
  // Check content patterns
  if (content.includes('Fluke Corporation')) return 'fluke';
  if (content.includes('HIOKI')) return 'hioki';
  
  return 'generic';
}

// ============================================================
// 6. EXPORT UTILITIES
// ============================================================

/**
 * Export measurements to Excel format
 * @param {Array} measurements - Measurement records
 * @param {string} filename - Output filename
 */
export function exportToExcel(measurements, filename = 'electrical_measurements.xlsx') {
  const worksheet = XLSX.utils.json_to_sheet(measurements);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Measurements');
  
  // Generate Excel file
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  
  // Download
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Generate CSV from measurements
 * @param {Array} measurements - Measurement records
 * @returns {string} CSV content
 */
export function exportToCSV(measurements) {
  if (measurements.length === 0) return '';
  
  const headers = Object.keys(measurements[0]);
  const csvRows = [headers.join(',')];
  
  measurements.forEach(record => {
    const values = headers.map(header => {
      const val = record[header];
      if (val === null || val === undefined) return '';
      if (typeof val === 'string' && val.includes(',')) return `"${val}"`;
      return val;
    });
    csvRows.push(values.join(','));
  });
  
  return csvRows.join('\n');
}

// Export all functions
export default {
  parseDataLoggerCSV,
  parseDataLoggerExcel,
  parseThermalImageMetadata,
  extractThermalTemperatures,
  validateAndCleanData,
  batchProcessFiles,
  exportToExcel,
  exportToCSV
};
