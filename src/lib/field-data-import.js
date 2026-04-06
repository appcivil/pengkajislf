// ============================================================
//  FIELD DATA IMPORT SERVICE
//  Import data pengujian lapangan dari Excel, CSV, PDF, DWG, RVT
//  Parse dan konversi ke format yang bisa digunakan simulasi
// ============================================================

import { supabase } from './supabase.js';
import { extractTextFromPDF, parsePDFTables } from './ocr-service.js';

/**
 * Detect file type and route to appropriate parser
 * @param {File} file - File object dari input
 * @returns {Promise<Object>} Parsed data
 */
export async function importFieldData(file, options = {}) {
  const { proyekId, tipePengujian = null } = options;
  
  const fileType = detectFileType(file);
  
  console.log('[FieldImport] Importing:', file.name, 'Type:', fileType);
  
  try {
    let parsedData = null;
    
    switch (fileType) {
      case 'excel':
        parsedData = await parseExcelFile(file);
        break;
      case 'csv':
        parsedData = await parseCSVFile(file);
        break;
      case 'pdf':
        parsedData = await parsePDFFile(file);
        break;
      case 'dwg':
      case 'rvt':
        parsedData = await parseCADFile(file, fileType);
        break;
      default:
        throw new Error(`Format file tidak didukung: ${fileType}`);
    }
    
    // Enrich dengan metadata
    parsedData.metadata = {
      originalFilename: file.name,
      fileType,
      fileSize: file.size,
      importedAt: new Date().toISOString(),
      proyekId
    };
    
    // Auto-detect tipe pengujian jika tidak ditentukan
    if (!tipePengujian) {
      parsedData.detectedType = autoDetectTestType(parsedData, file.name);
    } else {
      parsedData.detectedType = tipePengujian;
    }
    
    // Upload ke storage jika perlu
    if (proyekId) {
      const uploadResult = await uploadFieldDataFile(file, proyekId, parsedData.detectedType);
      parsedData.storageUrl = uploadResult.url;
      parsedData.storagePath = uploadResult.path;
    }
    
    return parsedData;
    
  } catch (err) {
    console.error('[FieldImport] Failed:', err);
    throw err;
  }
}

/**
 * Detect file type dari extension dan mime type
 */
function detectFileType(file) {
  const name = file.name.toLowerCase();
  const ext = name.split('.').pop();
  
  const typeMap = {
    'xlsx': 'excel',
    'xls': 'excel',
    'csv': 'csv',
    'pdf': 'pdf',
    'dwg': 'dwg',
    'rvt': 'rvt',
    'rfa': 'rvt'
  };
  
  return typeMap[ext] || 'unknown';
}

/**
 * Parse Excel file menggunakan SheetJS (xlsx library)
 */
async function parseExcelFile(file) {
  // Dynamic import xlsx library
  const XLSX = await import('xlsx');
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Parse all sheets
        const sheets = {};
        const rawData = [];
        
        workbook.SheetNames.forEach(sheetName => {
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
            header: 1,
            defval: null,
            blankrows: false
          });
          
          sheets[sheetName] = jsonData;
          
          // Try to detect structured data
          const structured = structureExcelData(jsonData, sheetName);
          if (structured) {
            rawData.push(...structured);
          }
        });
        
        resolve({
          format: 'excel',
          sheets,
          data: rawData,
          workbook
        });
        
      } catch (err) {
        reject(new Error('Gagal parse Excel: ' + err.message));
      }
    };
    
    reader.onerror = () => reject(new Error('Gagal membaca file'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Parse CSV file
 */
async function parseCSVFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const lines = text.split(/\r?\n/).filter(line => line.trim());
        
        // Detect delimiter
        const firstLine = lines[0];
        const delimiter = firstLine.includes('\t') ? '\t' : 
                         firstLine.includes(';') ? ';' : ',';
        
        // Parse headers
        const headers = lines[0].split(delimiter).map(h => h.trim().replace(/^"|"$/g, ''));
        
        // Parse data rows
        const data = [];
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(delimiter).map(v => {
            v = v.trim().replace(/^"|"$/g, '');
            // Try to convert to number
            const num = parseFloat(v);
            return isNaN(num) || v === '' ? v : num;
          });
          
          const row = {};
          headers.forEach((header, idx) => {
            row[header] = values[idx] !== undefined ? values[idx] : null;
          });
          
          data.push(row);
        }
        
        resolve({
          format: 'csv',
          delimiter,
          headers,
          data,
          raw: text
        });
        
      } catch (err) {
        reject(new Error('Gagal parse CSV: ' + err.message));
      }
    };
    
    reader.onerror = () => reject(new Error('Gagal membaca file'));
    reader.readAsText(file);
  });
}

/**
 * Parse PDF file - extract text and tables
 */
async function parsePDFFile(file) {
  try {
    // Read file as base64
    const base64 = await fileToBase64(file);
    
    // Extract text using OCR service
    const extractedText = await extractTextFromPDF(base64);
    
    // Try to parse tables from text
    const tables = parseTextTables(extractedText);
    
    // Try to extract field test data patterns
    const fieldData = extractFieldTestData(extractedText);
    
    return {
      format: 'pdf',
      text: extractedText,
      tables,
      data: fieldData,
      pageCount: tables.length > 0 ? tables.length : 1
    };
    
  } catch (err) {
    console.error('[FieldImport] PDF parse error:', err);
    // Return basic info even if parsing fails
    return {
      format: 'pdf',
      text: '',
      error: err.message,
      requiresManualReview: true
    };
  }
}

/**
 * Parse CAD file (DWG/RVT) - store reference only
 */
async function parseCADFile(file, type) {
  // CAD files cannot be parsed in browser
  // Just return metadata for reference
  return {
    format: type,
    filename: file.name,
    fileSize: file.size,
    requiresCADViewer: true,
    cadType: type === 'dwg' ? 'AutoCAD Drawing' : 'Revit Model',
    note: 'File CAD perlu dilihat dengan viewer eksternal atau AutoCAD/Revit'
  };
}

/**
 * Structure raw Excel data into meaningful records
 */
function structureExcelData(rows, sheetName) {
  if (rows.length < 2) return null;
  
  // Try to find header row
  let headerRow = 0;
  for (let i = 0; i < Math.min(5, rows.length); i++) {
    const row = rows[i];
    // Header usually contains text like "No", "Sample", "Test", "Result"
    const hasHeaderKeywords = row.some(cell => 
      String(cell).match(/no|sample|test|result|lokasi|titik|uji|hasil/i)
    );
    if (hasHeaderKeywords) {
      headerRow = i;
      break;
    }
  }
  
  const headers = rows[headerRow].map(h => String(h).trim().toLowerCase());
  const data = [];
  
  for (let i = headerRow + 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.every(cell => cell === null || cell === '')) continue;
    
    const record = { _sheet: sheetName, _rowIndex: i };
    headers.forEach((header, idx) => {
      const value = row[idx];
      record[header] = value !== undefined && value !== null ? value : null;
    });
    
    data.push(record);
  }
  
  return data;
}

/**
 * Parse tables from extracted text
 */
function parseTextTables(text) {
  const tables = [];
  const lines = text.split('\n').filter(l => l.trim());
  
  // Simple table detection - look for lines with multiple numbers
  let currentTable = [];
  
  lines.forEach((line, idx) => {
    // Check if line looks like table row (has multiple numeric values)
    const numbers = line.match(/\d+(?:\.\d+)?/g);
    const words = line.match(/[a-zA-Z\u00C0-\u024F]+/g);
    
    // Likely table row if has numbers and reasonable structure
    if (numbers && numbers.length >= 2 && line.includes('\t') || line.match(/\s{2,}/)) {
      currentTable.push({
        row: idx,
        text: line,
        numbers: numbers.map(n => parseFloat(n))
      });
    } else if (currentTable.length > 0) {
      // End of table
      if (currentTable.length >= 2) {
        tables.push([...currentTable]);
      }
      currentTable = [];
    }
  });
  
  // Don't miss last table
  if (currentTable.length >= 2) {
    tables.push(currentTable);
  }
  
  return tables;
}

/**
 * Extract field test data patterns from text
 */
function extractFieldTestData(text) {
  const data = {
    testType: null,
    testDate: null,
    location: null,
    values: []
  };
  
  // Pattern matching untuk berbagai jenis pengujian
  const patterns = {
    // NDT - Rebound Hammer
    rebound: {
      test: /rebound|schmidt|hammer/i,
      values: /R\s*=\s*(\d+(?:\.\d+)?)|nilai\s+rebound.*?[:=]\s*(\d+(?:\.\d+)?)/gi
    },
    // NDT - UPV
    upv: {
      test: /upv|ultrasonic|pulse velocity/i,
      values: /(\d+(?:\.\d+)?)\s*km\/s|kecepatan\s+pulsa.*?[:=]\s*(\d+(?:\.\d+)?)/gi
    },
    // Concrete Strength
    concrete: {
      test: /kuat tekan|compressive strength|beton/i,
      values: /(\d+(?:\.\d+)?)\s*MPa|kg\/cm².*?[:=]\s*(\d+(?:\.\d+)?)/gi
    },
    // Soil Test
    soil: {
      test: /spt|n-value|tanah|soil/i,
      values: /N\s*=\s*(\d+)|blows.*?[:=]\s*(\d+)/gi
    }
  };
  
  // Detect test type
  for (const [type, pattern] of Object.entries(patterns)) {
    if (pattern.test.test(text)) {
      data.testType = type;
      
      // Extract values
      let match;
      while ((match = pattern.values.exec(text)) !== null) {
        const value = parseFloat(match[1] || match[2]);
        if (!isNaN(value)) {
          data.values.push(value);
        }
      }
      break;
    }
  }
  
  // Extract date
  const dateMatch = text.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})|(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/);
  if (dateMatch) {
    data.testDate = dateMatch[0];
  }
  
  // Extract location
  const locationMatch = text.match(/lokasi[\s:]+([^\n]+)|location[\s:]+([^\n]+)/i);
  if (locationMatch) {
    data.location = (locationMatch[1] || locationMatch[2]).trim();
  }
  
  return data;
}

/**
 * Auto detect tipe pengujian dari data dan filename
 */
function autoDetectTestType(data, filename) {
  const name = filename.toLowerCase();
  
  // Check filename patterns
  if (name.match(/rebound|schmidt|hammer/)) return 'ndt_rebound';
  if (name.match(/upv|ultrasonic/)) return 'ndt_upv';
  if (name.match(/cahaya|lighting|lux|illuminance/)) return 'pencahayaan';
  if (name.match(/ventilasi|ventilation|ach|angin/)) return 'ventilasi';
  if (name.match(/evakuasi|evacuation|escape|exit/)) return 'evakuasi';
  if (name.match(/beton|concrete|cube|cylinder/)) return 'ndt_rebound';
  if (name.match(/tanah|soil|spt/)) return 'ndt_upv';
  
  // Check data content
  const text = JSON.stringify(data).toLowerCase();
  if (text.includes('rebound') || text.includes('schmidt')) return 'ndt_rebound';
  if (text.includes('upv') || text.includes('pulse velocity')) return 'ndt_upv';
  if (text.includes('lux') || text.includes('illuminance') || text.includes('daylight')) return 'pencahayaan';
  if (text.includes('ach') || text.includes('ventilation') || text.includes('airflow')) return 'ventilasi';
  if (text.includes('evacuation') || text.includes('exit') || text.includes('corridor')) return 'evakuasi';
  
  return 'unknown';
}

/**
 * Upload file ke Supabase Storage
 */
async function uploadFieldDataFile(file, proyekId, tipePengujian) {
  const filePath = `field_data/${proyekId}/${tipePengujian}/${Date.now()}_${file.name}`;
  
  const { data, error } = await supabase.storage
    .from('project-files')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true
    });
  
  if (error) throw error;
  
  // Get public URL
  const { data: urlData } = supabase.storage
    .from('project-files')
    .getPublicUrl(filePath);
  
  return {
    path: filePath,
    url: urlData.publicUrl
  };
}

/**
 * Convert file to base64
 */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Convert imported data ke format parameter simulasi
 */
export function convertToSimulationParams(importedData, targetSimulation) {
  const { data, detectedType, format } = importedData;
  
  const converters = {
    // NDT Rebound → simulateNDT parameters
    ndt_rebound: (data) => {
      const values = data.values || [];
      const avgValue = values.length > 0 
        ? values.reduce((a, b) => a + b, 0) / values.length 
        : 30;
      
      return {
        testType: 'rebound_hammer',
        age: estimateBuildingAge(data) || 10,
        exposure: 'moderate',
        numTestPoints: values.length || 10,
        // Override dengan nilai aktual dari field
        fieldValues: values,
        fieldLocation: data.location,
        testDate: data.testDate
      };
    },
    
    // NDT UPV → simulateNDT parameters
    ndt_upv: (data) => {
      const values = data.values || [];
      
      return {
        testType: 'upv',
        age: estimateBuildingAge(data) || 10,
        exposure: 'moderate',
        numTestPoints: values.length || 10,
        fieldVelocities: values,
        fieldLocation: data.location,
        testDate: data.testDate
      };
    },
    
    // Pencahayaan → simulateLighting parameters
    pencahayaan: (data) => {
      // Extract dari data Excel/CSV
      const records = data.data || [];
      const luxValues = records.map(r => r.lux || r.illuminance || r.cahaya).filter(v => v);
      
      return {
        length: getDimension(records, 'panjang', 'length') || 10,
        width: getDimension(records, 'lebar', 'width') || 8,
        height: getDimension(records, 'tinggi', 'height') || 3,
        windowArea: getDimension(records, 'jendela', 'window') || 6,
        fieldMeasurements: luxValues,
        measurementLocations: records.map(r => r.lokasi || r.location).filter(Boolean)
      };
    },
    
    // Ventilasi → simulateVentilation parameters
    ventilasi: (data) => {
      const records = data.data || [];
      
      return {
        length: getDimension(records, 'panjang', 'length') || 10,
        width: getDimension(records, 'lebar', 'width') || 8,
        height: getDimension(records, 'tinggi', 'height') || 3,
        windowArea: getDimension(records, 'bukaan', 'opening') || 4,
        windSpeed: getAverage(records, 'kecepatan_angin', 'wind_speed') || 2,
        fieldACH: getAverage(records, 'ach', 'air_changes') || null,
        temperatureReadings: records.map(r => r.suhu || r.temperature).filter(v => !isNaN(v))
      };
    },
    
    // Evakuasi → simulateEvacuation parameters
    evakuasi: (data) => {
      const records = data.data || [];
      
      return {
        numPeople: getTotal(records, 'jumlah_orang', 'occupants') || 100,
        walkingSpeed: getAverage(records, 'kecepatan', 'speed') || 1.2,
        reactionTime: getAverage(records, 'reaksi', 'reaction') || 60,
        fieldLayout: extractLayoutData(records)
      };
    }
  };
  
  const converter = converters[targetSimulation] || converters[detectedType];
  if (!converter) {
    throw new Error(`Tidak ada converter untuk tipe: ${targetSimulation || detectedType}`);
  }
  
  return converter(data);
}

// Helper functions untuk converter
function getDimension(records, ...keys) {
  for (const key of keys) {
    const val = records.find(r => r[key])?.[key];
    if (val && !isNaN(parseFloat(val))) return parseFloat(val);
  }
  return null;
}

function getAverage(records, ...keys) {
  for (const key of keys) {
    const values = records.map(r => r[key]).filter(v => !isNaN(parseFloat(v)));
    if (values.length > 0) {
      return values.reduce((a, b) => a + b, 0) / values.length;
    }
  }
  return null;
}

function getTotal(records, ...keys) {
  for (const key of keys) {
    const values = records.map(r => r[key]).filter(v => !isNaN(parseFloat(v)));
    if (values.length > 0) {
      return values.reduce((a, b) => a + b, 0);
    }
  }
  return null;
}

function estimateBuildingAge(data) {
  // Try to extract age from date
  const dateStr = data.testDate;
  if (!dateStr) return null;
  
  // Simplified - return null and let simulation use default
  return null;
}

function extractLayoutData(records) {
  // Extract spatial layout data if available
  return records.map(r => ({
    location: r.lokasi || r.location,
    x: r.x || r.koordinat_x || null,
    y: r.y || r.koordinat_y || null,
    width: r.lebar || r.width || null,
    type: r.tipe || r.type || 'room'
  })).filter(r => r.x && r.y);
}

/**
 * Save imported field data ke database
 */
export async function saveImportedFieldData(proyekId, importedData, simulationParams) {
  const { data, error } = await supabase
    .from('field_test_data')
    .insert([{
      proyek_id: proyekId,
      tipe_pengujian: importedData.detectedType,
      source_filename: importedData.metadata.originalFilename,
      source_format: importedData.format,
      raw_data: importedData.data || importedData.sheets || importedData.text,
      parsed_params: simulationParams,
      storage_url: importedData.storageUrl,
      storage_path: importedData.storagePath,
      imported_at: new Date().toISOString()
    }])
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// Export all
export default {
  importFieldData,
  convertToSimulationParams,
  saveImportedFieldData
};
