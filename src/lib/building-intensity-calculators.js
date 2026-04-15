/**
 * BUILDING INTENSITY & ZONING COMPLIANCE CALCULATORS
 * Pemeriksaan Aspek Intensitas Bangunan berdasarkan:
 * - PP Nomor 16 Tahun 2021 (Pasal 216 & 217)
 * - Permen ATR/BPN Nomor 6 Tahun 2023 (KKPR)
 * - Perda Kabupaten Garut Nomor 6 Tahun 2012 (RTRW)
 * - Perda Provinsi Jawa Barat Nomor 1 Tahun 2022 (RDTR)
 * - SNI 03-6197-2000 (Pemanfaatan Ruang Dalam)
 * - SNI 03-1736-2000 (Jarak Antar Bangunan)
 */

// ============================================================
// 1. DATABASE ZONING & REGULATIONS
// ============================================================

export const ZONING_DATABASE = {
  // Zona Perumahan
  'R': {
    name: 'Perumahan',
    name_full: 'Zona Perumahan',
    allowed_functions: ['rumah_tinggal', 'rumah_kos', 'daycare', 'home_office', 'tempat_ibadah'],
    KDB_max: 60,
    KLB_max: 1.2,
    KDH_min: 30,
    KTB_max: 100,
    height_max: 12, // meter (4 lantai)
    floors_max: 4,
    floor_height_standard: 3.0,
    parking_requirement: 1, // per 100 m² LTB
    description: 'Zona untuk kegiatan perumahan dan fasilitas penunjang'
  },
  
  // Zona Perdagangan dan Jasa
  'C': {
    name: 'Komersial',
    name_full: 'Zona Perdagangan dan Jasa',
    allowed_functions: ['ruko', 'mall', 'hotel', 'restoran', 'kantor', 'pusat_perbelanjaan'],
    KDB_max: 80,
    KLB_max: 4.0,
    KDH_min: 10,
    KTB_max: 100,
    height_max: 45,
    floors_max: 15,
    floor_height_standard: 3.5,
    floor_height_lobby: 4.5,
    parking_requirement: 1.5,
    description: 'Zona untuk kegiatan perdagangan, jasa, dan perkantoran'
  },
  
  // Zona Industri
  'I': {
    name: 'Industri',
    name_full: 'Zona Industri',
    allowed_functions: ['pabrik', 'gudang', 'bengkel', 'industri_ringan', 'indiri'],
    KDB_max: 70,
    KLB_max: 2.0,
    KDH_min: 20,
    KTB_max: 100,
    height_max: 30,
    floors_max: 8,
    floor_height_standard: 4.0,
    floor_height_factory: 6.0,
    parking_requirement: 0.5,
    description: 'Zona untuk kegiatan industri dan pergudangan'
  },
  
  // Zona Perkantoran
  'K': {
    name: 'Perkantoran',
    name_full: 'Zona Perkantoran',
    allowed_functions: ['kantor', 'bank', 'asuransi', 'konsultasi'],
    KDB_max: 75,
    KLB_max: 5.0,
    KDH_min: 15,
    KTB_max: 100,
    height_max: 60,
    floors_max: 20,
    floor_height_standard: 3.8,
    floor_height_lobby: 4.5,
    parking_requirement: 1.2,
    description: 'Zona untuk kegiatan perkantoran'
  },
  
  // Zona Campuran
  'M': {
    name: 'Campuran',
    name_full: 'Zona Peruntukan Campuran',
    allowed_functions: ['campuran', 'ruko', 'apartemen', 'hotel', 'kantor'],
    KDB_max: 75,
    KLB_max: 6.0,
    KDH_min: 15,
    KTB_max: 100,
    height_max: 80,
    floors_max: 25,
    floor_height_standard: 3.5,
    parking_requirement: 1.3,
    description: 'Zona untuk kegiatan campuran (perumahan, perdagangan, jasa)'
  },
  
  // Zona Ruang Terbuka Hijau
  'RT': {
    name: 'RTH',
    name_full: 'Zona Ruang Terbuka Hijau',
    allowed_functions: ['taman', 'stadion', 'tempat_ibadah', 'makam'],
    KDB_max: 20,
    KLB_max: 0.5,
    KDH_min: 80,
    KTB_max: 20,
    height_max: 15,
    floors_max: 2,
    floor_height_standard: 4.5,
    parking_requirement: 0.2,
    description: 'Zona untuk ruang terbuka hijau dan fasilitas publik terbuka'
  },
  
  // Zona Perlindungan
  'L': {
    name: 'Lindung',
    name_full: 'Zona Perlindungan',
    allowed_functions: ['konservasi', 'hutan', 'pertanian'],
    KDB_max: 10,
    KLB_max: 0.2,
    KDH_min: 90,
    KTB_max: 0,
    height_max: 8,
    floors_max: 1,
    floor_height_standard: 3.0,
    parking_requirement: 0,
    description: 'Zona untuk kegiatan konservasi dan perlindungan lingkungan'
  },
  
  // Zona Pusaka/Cagar Budaya (Garut)
  'PUS': {
    name: 'Kawasan Pusaka',
    name_full: 'Zona Kawasan Pusaka/Cagar Budaya',
    allowed_functions: ['museum', 'rumah_adat', 'pertokoan_tradisional', 'penginapan'],
    KDB_max: 40,
    KLB_max: 0.8,
    KDH_min: 40,
    KTB_max: 80,
    height_max: 8,
    floors_max: 2,
    floor_height_standard: 3.5,
    floor_height_traditional: 4.5,
    parking_requirement: 0.3,
    description: 'Kawasan dengan nilai sejarah/budaya tinggi (Cipanas, Cangkuang Garut)'
  },
  
  // Zona Rawan Bencana (Garut - Gunung Galunggung)
  'RB': {
    name: 'Rawan Bencana',
    name_full: 'Zona Rawan Bencana Alam',
    allowed_functions: ['rumah_tinggal_terbatas', 'fasilitas_umum darurat'],
    KDB_max: 30,
    KLB_max: 0.6,
    KDH_min: 50,
    KTB_max: 50,
    height_max: 6,
    floors_max: 1,
    floor_height_standard: 3.0,
    parking_requirement: 0.5,
    description: 'Kawasan rawan bencana alam dengan pembatasan ketat'
  }
};

// Klasifikasi Jalan untuk Sempadan
export const ROAD_CLASSIFICATION = {
  'arteri': {
    name: 'Jalan Arteri',
    setback_min: 8,
    setback_max: 15,
    width_min: 30,
    description: 'Jalan utama penghubung kota-kota besar'
  },
  'kolektor': {
    name: 'Jalan Kolektor',
    setback_min: 5,
    setback_max: 8,
    width_min: 20,
    description: 'Jalan pengumpul/penghubung antar wilayah'
  },
  'lokal': {
    name: 'Jalan Lokal',
    setback_min: 3,
    setback_max: 5,
    width_min: 10,
    description: 'Jalan melayani lokal/lingkungan'
  },
  'lingkungan': {
    name: 'Jalan Lingkungan',
    setback_min: 1.5,
    setback_max: 3,
    width_min: 6,
    description: 'Jalan setapak/lingkungan perumahan'
  },
  'setapak': {
    name: 'Gang/Setapak',
    setback_min: 1,
    setback_max: 1.5,
    width_min: 3,
    description: 'Gang/setapak dengan lebar < 4m'
  }
};

// ============================================================
// 2. INTENSITAS BANGUNAN CALCULATORS (Pasal 217 PP 16/2021)
// ============================================================

/**
 * Kalkulator KDB - Koefisien Dasar Bangunan
 * Rumus: KDB = (LLD / Luas Persil) × 100%
 * @param {number} footprintArea - Luas lantai dasar/footprint (m²)
 * @param {number} siteArea - Luas persil (m²)
 * @returns {Object} Hasil perhitungan KDB dengan status compliance
 */
export function calculateKDB(footprintArea, siteArea) {
  if (!siteArea || siteArea <= 0) {
    return { error: 'Luas persil harus > 0' };
  }
  
  const KDB = (footprintArea / siteArea) * 100;
  
  return {
    value: KDB,
    percentage: KDB.toFixed(2) + '%',
    decimal: parseFloat(KDB.toFixed(4)),
    footprintArea,
    siteArea,
    remainingArea: siteArea - footprintArea,
    utilizationPercentage: KDB,
    
    // Compliance check (generic - will be validated against zone)
    isCompliant: (maxKDB) => KDB <= maxKDB,
    getStatus: (maxKDB) => KDB <= maxKDB ? 'C' : 'NC',
    getMargin: (maxKDB) => (maxKDB - KDB).toFixed(2),
    
    // Recommendations
    recommendations: {
      optimize: KDB > 80 ? 'Pertimbangkan efisiensi footprint atau basement' : null,
      reduce: null, // Will be set based on zone validation
      addBasement: KDB > 70 ? 'Basement dapat menambah luas tanpa mempengaruhi KDB' : null
    }
  };
}

/**
 * Kalkulator KLB - Koefisien Lantai Bangunan (FAR)
 * Rumus: KLB = LTB / Luas Persil
 * @param {number} totalFloorArea - Luas total seluruh lantai (LTB) (m²)
 * @param {number} siteArea - Luas persil (m²)
 * @returns {Object} Hasil perhitungan KLB dengan status compliance
 */
export function calculateKLB(totalFloorArea, siteArea) {
  if (!siteArea || siteArea <= 0) {
    return { error: 'Luas persil harus > 0' };
  }
  
  const KLB = totalFloorArea / siteArea;
  
  return {
    value: KLB,
    ratio: KLB.toFixed(2) + ':1',
    decimal: parseFloat(KLB.toFixed(4)),
    totalFloorArea,
    siteArea,
    averageFloorArea: totalFloorArea / (Math.ceil(KLB) || 1),
    
    // FAR (Floor Area Ratio) - istilah internasional
    FAR: KLB,
    
    // Compliance check
    isCompliant: (maxKLB) => KLB <= maxKLB,
    getStatus: (maxKLB) => KLB <= maxKLB ? 'C' : 'NC',
    getMargin: (maxKLB) => (maxKLB - KLB).toFixed(2),
    
    // Building efficiency
    efficiency: {
      canAddFloors: (maxKLB) => KLB < maxKLB,
      remainingFAR: (maxKLB) => Math.max(0, maxKLB - KLB).toFixed(2),
      maxAdditionalArea: (maxKLB) => Math.max(0, (maxKLB - KLB) * siteArea).toFixed(2)
    }
  };
}

/**
 * Kalkulator KDH - Koefisien Daerah Hijau
 * Rumus: KDH = (Luas RTH / Luas Persil) × 100%
 * @param {number} greenArea - Luas ruang terbuka hijau (m²)
 * @param {number} siteArea - Luas persil (m²)
 * @returns {Object} Hasil perhitungan KDH dengan status compliance
 */
export function calculateKDH(greenArea, siteArea) {
  if (!siteArea || siteArea <= 0) {
    return { error: 'Luas persil harus > 0' };
  }
  
  const KDH = (greenArea / siteArea) * 100;
  
  return {
    value: KDH,
    percentage: KDH.toFixed(2) + '%',
    decimal: parseFloat(KDH.toFixed(4)),
    greenArea,
    siteArea,
    nonGreenArea: siteArea - greenArea,
    
    // Compliance check
    isCompliant: (minKDH) => KDH >= minKDH,
    getStatus: (minKDH) => KDH >= minKDH ? 'C' : 'NC',
    getShortfall: (minKDH) => Math.max(0, minKDH - KDH).toFixed(2),
    
    // Additional green area needed
    requiredAdditional: (minKDH) => Math.max(0, (minKDH - KDH) / 100 * siteArea).toFixed(2),
    
    // Vegetation suggestions
    suggestions: {
      roofGarden: KDH < 20 ? 'Pertimbangkan roof garden untuk menambah KDH' : null,
      verticalGarden: KDH < 15 ? 'Vertical garden dapat menambah KDH tanpa mengurangi footprint' : null,
      openSpace: KDH < 10 ? 'Tambahkan area terbuka dengan vegetasi' : null
    }
  };
}

/**
 * Kalkulator KTB - Koefisien Tapak Basement
 * Rumus: KTB = (Luas Basement / Luas Persil) × 100%
 * @param {number} basementArea - Luas total basement (m²)
 * @param {number} siteArea - Luas persil (m²)
 * @returns {Object} Hasil perhitungan KTB dengan status compliance
 */
export function calculateKTB(basementArea, siteArea) {
  if (!siteArea || siteArea <= 0) {
    return { error: 'Luas persil harus > 0' };
  }
  
  const KTB = (basementArea / siteArea) * 100;
  
  return {
    value: KTB,
    percentage: KTB.toFixed(2) + '%',
    decimal: parseFloat(KTB.toFixed(4)),
    basementArea,
    siteArea,
    basementLevels: Math.ceil(basementArea / siteArea), // estimate
    
    // Compliance check (max 100% usually)
    isCompliant: (maxKTB = 100) => KTB <= maxKTB,
    getStatus: (maxKTB = 100) => KTB <= maxKTB ? 'C' : 'NC',
    
    // Basement effectiveness
    providesAdditionalArea: KTB > 0,
    doesNotAffectKDB: true, // Basement tidak masuk KDB
    
    // Limitations
    limitations: {
      septicTank: 'Tidak boleh membangun septic tank di bawah basement',
      IPAL: 'IPAL harus di luar area basement',
      waterproofing: 'Perlu sistem waterproofing yang baik'
    }
  };
}

/**
 * Kalkulator Komprehensif Intensitas Bangunan
 * Menghitung KDB, KLB, KDH, KTB sekaligus
 * @param {Object} params - Parameter perhitungan
 * @returns {Object} Hasil lengkap intensitas bangunan
 */
export function calculateBuildingIntensity(params) {
  const {
    siteArea,           // Luas persil (m²)
    footprintArea,      // Luas lantai dasar (m²)
    totalFloorArea,     // Luas total lantai (m²)
    greenArea,          // Luas hijau (m²)
    basementArea = 0,   // Luas basement (m²)
    zoneCode = 'R'      // Kode zona
  } = params;
  
  const zone = ZONING_DATABASE[zoneCode];
  
  const kdb = calculateKDB(footprintArea, siteArea);
  const klb = calculateKLB(totalFloorArea, siteArea);
  const kdh = calculateKDH(greenArea, siteArea);
  const ktb = calculateKTB(basementArea, siteArea);
  
  // Calculate building coverage (area utilized)
  const utilizedArea = footprintArea + greenArea + (siteArea - footprintArea - greenArea);
  const hardscapeArea = siteArea - footprintArea - greenArea;
  
  return {
    parameters: {
      siteArea,
      footprintArea,
      totalFloorArea,
      greenArea,
      basementArea,
      hardscapeArea: Math.max(0, hardscapeArea),
      openArea: Math.max(0, siteArea - footprintArea)
    },
    
    KDB: {
      ...kdb,
      limit: zone?.KDB_max || 60,
      status: zone ? kdb.getStatus(zone.KDB_max) : 'Unknown',
      margin: zone ? kdb.getMargin(zone.KDB_max) : null
    },
    
    KLB: {
      ...klb,
      limit: zone?.KLB_max || 1.2,
      status: zone ? klb.getStatus(zone.KLB_max) : 'Unknown',
      margin: zone ? klb.getMargin(zone.KLB_max) : null
    },
    
    KDH: {
      ...kdh,
      limit: zone?.KDH_min || 30,
      status: zone ? kdh.getStatus(zone.KDH_min) : 'Unknown',
      shortfall: zone ? kdh.getShortfall(zone.KDH_min) : null,
      requiredAdditional: zone ? kdh.requiredAdditional(zone.KDH_min) : null
    },
    
    KTB: {
      ...ktb,
      limit: zone?.KTB_max || 100,
      status: zone ? ktb.getStatus(zone.KTB_max) : 'Unknown'
    },
    
    summary: {
      buildingCoverage: kdb.percentage,
      floorRatio: klb.ratio,
      greenCoverage: kdh.percentage,
      basementCoverage: ktb.percentage,
      hardscapeCoverage: ((Math.max(0, hardscapeArea) / siteArea) * 100).toFixed(1) + '%'
    },
    
    compliance: {
      overall: zone ? 
        (kdb.getStatus(zone.KDB_max) === 'C' && 
         klb.getStatus(zone.KLB_max) === 'C' && 
         kdh.getStatus(zone.KDH_min) === 'C') ? 'C' : 'NC'
        : 'Unknown',
      violations: zone ? [
        kdb.getStatus(zone.KDB_max) === 'NC' && 'KDB melebihi batas',
        klb.getStatus(zone.KLB_max) === 'NC' && 'KLB melebihi batas',
        kdh.getStatus(zone.KDH_min) === 'NC' && 'KDH di bawah minimum',
        ktb.getStatus(zone.KTB_max) === 'NC' && 'KTB melebihi batas'
      ].filter(Boolean) : []
    },
    
    zoneInfo: zone || null
  };
}

// ============================================================
// 3. TINGGI BANGUNAN & LANTAI CALCULATORS
// ============================================================

/**
 * Kalkulator Tinggi dan Jumlah Lantai
 * @param {number} buildingHeight - Tinggi total bangunan (m)
 * @param {number} floorHeightStandard - Tinggi lantai standar (m) - default 3m
 * @param {number} groundFloorHeight - Tinggi lantai dasar/lobi (m) - default 4m untuk komersial
 * @param {boolean} hasMezzanine - Ada mezzanine?
 * @returns {Object} Analisis tinggi dan jumlah lantai
 */
export function calculateBuildingHeight(
  buildingHeight, 
  floorHeightStandard = 3.0, 
  groundFloorHeight = null,
  hasMezzanine = false
) {
  const effectiveGroundHeight = groundFloorHeight || floorHeightStandard;
  
  // Hitung jumlah lantai efektif
  let remainingHeight = buildingHeight - effectiveGroundHeight;
  let upperFloors = Math.floor(remainingHeight / floorHeightStandard);
  
  // Jika ada sisa tinggi > 2.5m, hitung sebagai setengah lantai
  const remainder = remainingHeight % floorHeightStandard;
  const partialFloor = remainder >= 2.5 ? 0.5 : 0;
  
  const totalFloors = 1 + upperFloors + partialFloor;
  
  // Mezzanine consideration
  const mezzanineInfo = hasMezzanine ? {
    countsAsFloor: effectiveGroundHeight >= 4.5, // Jika lobi tinggi, mezzanine = 1 lantai
    height: effectiveGroundHeight / 2,
    note: 'Mezzanine setengah lantai jika di bawah 4.5m, 1 lantai jika di atas'
  } : null;
  
  // Lift requirement (SNI 03-6197-2000)
  const requiresLift = totalFloors > 4;
  const requiresServiceLift = totalFloors > 8;
  const requiresFiremanLift = totalFloors > 12;
  
  // Emergency stair requirement
  const requiresEmergencyStair = totalFloors > 2;
  const requiresFireStairEnclosure = totalFloors > 4;
  
  return {
    buildingHeight,
    floorHeightStandard,
    groundFloorHeight: effectiveGroundHeight,
    
    floorCount: {
      total: totalFloors,
      upperFloors,
      groundFloor: 1,
      partial: partialFloor,
      mezzanine: mezzanineInfo,
      calculation: `${effectiveGroundHeight}m + (${upperFloors} × ${floorHeightStandard}m) + ${remainder.toFixed(2)}m = ${buildingHeight}m`
    },
    
    requirements: {
      lift: {
        required: requiresLift,
        count: requiresLift ? Math.ceil(totalFloors / 10) : 0, // 1 lift per 10 lantai approx
        type: requiresServiceLift ? 'Passenger + Service' : 'Passenger only',
        firemanLift: requiresFiremanLift
      },
      stair: {
        required: requiresEmergencyStair,
        fireEnclosure: requiresFireStairEnclosure,
        minWidth: totalFloors > 8 ? 1.5 : 1.2 // meter
      }
    },
    
    // Compliance check
    checkHeightLimit: (maxHeight) => ({
      isCompliant: buildingHeight <= maxHeight,
      status: buildingHeight <= maxHeight ? 'C' : 'NC',
      excess: Math.max(0, buildingHeight - maxHeight).toFixed(2) + ' m'
    }),
    
    // Height categories
    category: buildingHeight <= 8 ? 'Rendah (1-2 lantai)' :
              buildingHeight <= 15 ? 'Sedang (3-5 lantai)' :
              buildingHeight <= 40 ? 'Menengah (6-12 lantai)' :
              buildingHeight <= 80 ? 'Tinggi (13-25 lantai)' : 'Sangat Tinggi (>25 lantai)'
  };
}

// ============================================================
// 4. SEKAP & JARAK PEMBATAS CALCULATORS
// ============================================================

/**
 * Kalkulator Jarak Sempadan Komprehensif
 * Menghitung semua jenis setback yang diperlukan
 * @param {Object} params - Parameter setback
 * @returns {Object} Hasil perhitungan setback
 */
export function calculateSetbacks(params) {
  const {
    roadClass = null,        // Klasifikasi jalan (arteri, kolektor, lokal, lingkungan)
    roadWidth = null,        // Lebar jalan (m) - alternatif klasifikasi
    riverWidth = 0,          // Lebar sungai (m)
    voltage = 0,             // Tegangan listrik (kV)
    railwayType = null,      // Tipe rel (utama, lokal, industri)
    coastalZone = false,     // Zona pantai?
    lakeArea = 0,            // Luas danau (ha)
    neighborHeight = 0,      // Tinggi bangunan tetangga (m)
    buildingHeight = 0,      // Tinggi bangunan ini (m)
    isHeritageZone = false,  // Zona cagar budaya?
    isFloodProne = false     // Zona rawan banjir?
  } = params;
  
  const setbacks = {
    road: calculateRoadSetback(roadClass, roadWidth),
    river: calculateRiverSetback(riverWidth),
    voltage: calculateVoltageSetback(voltage),
    railway: calculateRailwaySetback(railwayType),
    coastal: calculateCoastalSetback(coastalZone),
    lake: calculateLakeSetback(lakeArea),
    building: calculateBuildingSeparation(buildingHeight, neighborHeight),
    site: calculateSiteSetbacks(roadClass)
  };
  
  // Determine the controlling setback
  const allSetbacks = [
    setbacks.road?.distance || 0,
    setbacks.river?.distance || 0,
    setbacks.voltage?.distance || 0,
    setbacks.railway?.distance || 0,
    setbacks.coastal?.distance || 0,
    setbacks.lake?.distance || 0
  ];
  
  const controllingSetback = Math.max(...allSetbacks);
  const controllingType = Object.entries(setbacks)
    .find(([key, val]) => val?.distance === controllingSetback)?.[0];
  
  return {
    ...setbacks,
    controlling: {
      distance: controllingSetback,
      type: controllingType,
      note: `Setback ${controllingType} adalah yang paling ketat (${controllingSetback}m)`
    },
    
    // Special zones
    specialZones: {
      heritage: isHeritageZone ? {
        applies: true,
        additionalSetback: 3,
        note: 'Zona cagar budaya memerlukan setback tambahan 3m untuk pelestarian'
      } : null,
      floodProne: isFloodProne ? {
        applies: true,
        minFloorLevel: 0.5, // meter di atas muka air banjir
        note: 'Bangunan harus ditinggikan minimum 0.5m dari muka air banjir rencana'
      } : null
    }
  };
}

function calculateRoadSetback(roadClass, roadWidth = null) {
  if (!roadClass && roadWidth) {
    // Auto-determine class from width
    if (roadWidth >= 30) roadClass = 'arteri';
    else if (roadWidth >= 20) roadClass = 'kolektor';
    else if (roadWidth >= 10) roadClass = 'lokal';
    else if (roadWidth >= 6) roadClass = 'lingkungan';
    else roadClass = 'setapak';
  }
  
  const road = ROAD_CLASSIFICATION[roadClass];
  if (!road) return null;
  
  return {
    distance: road.setback_min,
    range: `${road.setback_min}-${road.setback_max}m`,
    class: roadClass,
    name: road.name,
    description: road.description,
    roadWidth: roadWidth,
    status: 'mandatory',
    regulation: 'CJJR & Perda Kabupaten/Kota',
    
    // Garis sempadan jalan (GSJ)
    GSJ: {
      fromRoadCenter: roadWidth ? (roadWidth / 2) + road.setback_min : null,
      fromRoadEdge: road.setback_min
    }
  };
}

function calculateRiverSetback(riverWidth) {
  if (!riverWidth || riverWidth <= 0) {
    return { distance: 0, status: 'N/A', note: 'Tidak ada sungai' };
  }
  
  let distance;
  if (riverWidth < 10) distance = 5;
  else if (riverWidth <= 20) distance = 10;
  else if (riverWidth <= 50) distance = 15;
  else distance = 20;
  
  return {
    distance,
    riverWidth: riverWidth + ' m',
    category: riverWidth < 10 ? 'Sungai Kecil' :
                riverWidth <= 20 ? 'Sungai Sedang' :
                riverWidth <= 50 ? 'Sungai Besar' : 'Sungai Utama',
    status: 'mandatory',
    regulation: 'PP 38/2011 tentang Sungai',
    note: 'Sempadan sungai untuk perlindungan ekosistem dan mitigasi banjir'
  };
}

function calculateVoltageSetback(voltage) {
  if (!voltage || voltage <= 0) {
    return { distance: 0, status: 'N/A', note: 'Tidak ada jaringan tegangan tinggi' };
  }
  
  let distance;
  let category;
  
  if (voltage <= 20) {
    distance = 5;
    category = 'Tegangan Rendah';
  } else if (voltage <= 70) {
    distance = 10;
    category = 'Tegangan Menengah';
  } else if (voltage <= 150) {
    distance = 15;
    category = 'Tegangan Tinggi';
  } else if (voltage <= 500) {
    distance = 20;
    category = 'Tegangan Ekstra Tinggi';
  } else {
    distance = 30;
    category = 'Tegangan Ultra Tinggi';
  }
  
  return {
    distance,
    voltage: voltage + ' kV',
    category,
    status: 'danger zone',
    regulation: 'SPLN 1:1978, Kepmen ESDM 020/2004',
    note: 'Sempadan tegangan tinggi untuk keselamatan manusia',
    warning: voltage > 150 ? '⚠️ Zona berbahaya - koordinasi dengan PLN diperlukan' : null
  };
}

function calculateRailwaySetback(railwayType) {
  if (!railwayType) {
    return { distance: 0, status: 'N/A', note: 'Tidak ada rel kereta api' };
  }
  
  const distances = {
    'utama': 20,
    'lokal': 10,
    'industri': 15
  };
  
  const distance = distances[railwayType] || 10;
  
  return {
    distance,
    type: railwayType,
    description: railwayType === 'utama' ? 'Jalur utama penghubung kota' :
                  railwayType === 'lokal' ? 'Jalur lokal/commuter' : 'Jalur industri',
    status: 'safety zone',
    regulation: 'PM 11/2023 tentang Kawasan Rawan Bencana Perkeretaapian',
    note: 'Sempadan rel untuk keselamatan operasional dan penanganan darurat'
  };
}

function calculateCoastalSetback(isCoastalZone) {
  if (!isCoastalZone) {
    return { distance: 0, status: 'N/A', note: 'Bukan zona pantai' };
  }
  
  return {
    distance: 100,
    from: 'Garis Pasang Tertinggi (HWS)',
    status: 'mandatory',
    regulation: 'SNI 8053:2015 tentang Tata Bangunan dan Lingkungan di Wilayah Pesisir',
    note: 'Garis Sempadan Pantai (GSP) 100m dari HWS untuk perlindungan pantai',
    exceptions: 'Fasilitas umum kecil (pos jaga, dermaga) dapat dikecualikan dengan izin khusus'
  };
}

function calculateLakeSetback(lakeArea) {
  if (!lakeArea || lakeArea <= 0) {
    return { distance: 0, status: 'N/A', note: 'Tidak ada danau' };
  }
  
  let distance;
  if (lakeArea < 10) distance = 30;
  else if (lakeArea < 50) distance = 50;
  else distance = 100;
  
  return {
    distance,
    lakeArea: lakeArea + ' ha',
    category: lakeArea < 10 ? 'Danau Kecil' :
                lakeArea < 50 ? 'Danau Sedang' : 'Danau Besar',
    status: 'mandatory',
    regulation: 'Perda Kabupaten/Kota tentang Ruang Terbuka Hijau',
    note: 'Sempadan danau untuk pelestarian ekosistem air'
  };
}

function calculateBuildingSeparation(buildingHeight, neighborHeight) {
  const maxHeight = Math.max(buildingHeight, neighborHeight);
  
  // Minimum 3m untuk ventilasi cahaya
  const minSpacing = 3;
  
  // Spacing based on height (0.3 × tinggi bangunan lebih tinggi)
  const heightBasedSpacing = maxHeight * 0.3;
  
  // Fire separation distance (SNI 03-1736-2000)
  // Simplified - actually depends on fire rating
  const fireSeparation = buildingHeight > 15 ? 6 : 3;
  
  const requiredSpacing = Math.max(minSpacing, heightBasedSpacing, fireSeparation);
  
  return {
    distance: requiredSpacing,
    minLegal: minSpacing,
    heightBased: heightBasedSpacing.toFixed(2),
    fireSeparation,
    maxHeight,
    regulation: 'SNI 03-6197-2000, SNI 03-1736-2000',
    purpose: [
      'Akses ventilasi dan pencahayaan alami',
      'Akses pemadam kebakaran',
      'Privasi antar penghuni',
      'Pencegahan penyebaran api'
    ]
  };
}

function calculateSiteSetbacks(roadClass) {
  const roadSetback = ROAD_CLASSIFICATION[roadClass]?.setback_min || 5;
  
  return {
    front: {
      distance: roadSetback,
      name: 'Sisi Depan (Front Yard)',
      purpose: 'Sempadan jalan dan area tamu',
      note: 'Biasanya diatur oleh sempadan jalan'
    },
    side: {
      distance: 1.5,
      name: 'Sisi Samping (Side Yard)',
      purpose: 'Akses samping dan ventilasi',
      min: 1.5,
      max: 3,
      note: 'Minimum 1.5m untuk bangunan di bawah 8m, 3m untuk bangunan tinggi'
    },
    rear: {
      distance: 2,
      name: 'Sisi Belakang (Rear Yard)',
      purpose: 'Service area dan ventilasi belakang',
      min: 2,
      max: 5,
      note: 'Minimum 2m, disarankan 5m untuk area servis'
    }
  };
}

// ============================================================
// 5. VALIDASI ZONING & FUNGSI (Pasal 216 PP 16/2021)
// ============================================================

/**
 * Validasi Kesesuaian Fungsi dengan Zona (Pasal 216)
 * @param {string} plannedFunction - Fungsi rencana bangunan
 * @param {string} zoneCode - Kode zona
 * @param {Object} kkprData - Data KKPR jika ada
 * @returns {Object} Hasil validasi kesesuaian
 */
export function validateZoningCompliance(plannedFunction, zoneCode, kkprData = null) {
  const zone = ZONING_DATABASE[zoneCode];
  
  if (!zone) {
    return {
      error: true,
      message: `Zona ${zoneCode} tidak ditemukan dalam database`,
      recommendation: 'Verifikasi kode zona dengan Dinas PUPR setempat'
    };
  }
  
  const isAllowed = zone.allowed_functions.includes(plannedFunction);
  
  // Check for special cases
  const specialCases = {
    homeOffice: plannedFunction === 'home_office' && zoneCode === 'R',
    mixedUse: plannedFunction === 'campuran' && zoneCode === 'M',
    smallCommercial: plannedFunction === 'rumah_toko' && zoneCode === 'R'
  };
  
  // Determine recommendation
  let recommendation;
  let permitType;
  
  if (isAllowed) {
    recommendation = 'Fungsi sesuai dengan peruntukan zona';
    permitType = 'IMB Standar';
  } else if (specialCases.homeOffice) {
    recommendation = 'Home office diperbolehkan dengan skala terbatas (maks 30% luas) dan tidak mengganggu lingkungan';
    permitType = 'IMB dengan Izin Usaha Rumahan';
  } else if (specialCases.mixedUse) {
    recommendation = 'Fungsi campuran memerlukan analisis dampak lalu lintas dan lingkungan';
    permitType = 'IMB dengan Persetujuan Teknis';
  } else {
    recommendation = 'Fungsi tidak sesuai zona. Diperlukan perubahan KKPR ke zona yang sesuai atau pengurangan skala fungsi';
    permitType = 'KKPR Baru / Izin Penyimpangan';
  }
  
  return {
    zoneCode,
    zoneName: zone.name_full,
    plannedFunction,
    allowed: isAllowed,
    allowedFunctions: zone.allowed_functions,
    
    compliance: {
      status: isAllowed ? 'SESUAI' : 'TIDAK SESUAI',
      level: isAllowed ? 'C' : 'NC',
      canProceedWithIMB: isAllowed || specialCases.homeOffice,
      requiresKKPRChange: !isAllowed && !specialCases.homeOffice
    },
    
    parameters: {
      KDB_max: zone.KDB_max + '%',
      KLB_max: zone.KLB_max,
      KDH_min: zone.KDH_min + '%',
      height_max: zone.height_max + ' m',
      floors_max: zone.floors_max + ' lantai'
    },
    
    recommendation,
    permitType,
    
    kkprIntegration: kkprData ? {
      kkprNumber: kkprData.number,
      kkprZone: kkprData.zone,
      match: kkprData.zone === zoneCode,
      note: kkprData.zone !== zoneCode ? 'Konflik antara KKPR dan zona RDTR - perlu harmonisasi' : null
    } : null,
    
    specialCases,
    
    // Actions required
    actions: isAllowed ? [] : [
      'Ajukan perubahan KKPR ke zona ' + findZoneForFunction(plannedFunction),
      'Pertimbangkan fungsi alternatif yang diperbolehkan di zona ' + zoneCode,
      'Konsultasi dengan Dinas Penanaman Modal untuk solusi izin khusus'
    ]
  };
}

function findZoneForFunction(functionName) {
  const zones = [];
  for (const [code, zone] of Object.entries(ZONING_DATABASE)) {
    if (zone.allowed_functions.includes(functionName)) {
      zones.push(`${code} (${zone.name})`);
    }
  }
  return zones.join(', ');
}

// ============================================================
// 6. ANALISIS SHADOW & VIEW CORRIDOR
// ============================================================

/**
 * Analisis Bayangan Bangunan (Hak Cahaya)
 * @param {Object} params - Parameter analisis bayangan
 * @returns {Object} Hasil analisis bayangan
 */
export function calculateShadowImpact(params) {
  const {
    buildingHeight,
    distanceToNeighbor,
    neighborHeight = 8, // default 2 lantai
    sunAzimuth = 0,     // 0 = selatan (bayangan ke utara)
    sunAltitude = 45   // sudut matahari di atas horizon
  } = params;
  
  // Panjang bayangan horizontal
  const shadowLength = buildingHeight / Math.tan(sunAltitude * Math.PI / 180);
  
  // Apakah membayangi tetangga?
  const affectsNeighbor = shadowLength > distanceToNeighbor;
  
  // Ketinggian bayangan pada tembok tetangga
  const shadowHeightOnNeighbor = affectsNeighbor 
    ? Math.max(0, buildingHeight - (distanceToNeighbor * Math.tan(sunAltitude * Math.PI / 180)))
    : 0;
    
  // Persentase area tetangga terbayangi
  const shadowPercentage = affectsNeighbor && neighborHeight > 0
    ? (shadowHeightOnNeighbor / neighborHeight) * 100 
    : 0;
  
  // Durasi bayangan (simplified - based on sun path)
  const shadowDuration = affectsNeighbor ? '4-6 jam' : '0 jam';
  
  return {
    input: {
      buildingHeight,
      distanceToNeighbor,
      neighborHeight,
      sunAltitude
    },
    
    shadow: {
      length: shadowLength.toFixed(2) + ' m',
      lengthRaw: shadowLength,
      affectsNeighbor,
      heightOnNeighbor: shadowHeightOnNeighbor.toFixed(2) + ' m',
      percentageOfNeighbor: shadowPercentage.toFixed(1) + '%',
      duration: shadowDuration
    },
    
    // Hak cahaya analysis
    rightToLight: {
      maximumAllowed: '50%',
      isViolated: shadowPercentage > 50,
      status: shadowPercentage > 50 ? 'NC' : 'C',
      
      // Winter solstice is worst case
      worstCaseNote: 'Analisis pada solstice musim dingin (21 Juni) - bayangan terpanjang'
    },
    
    recommendations: {
      reduceHeight: shadowPercentage > 50 
        ? `Kurangi tinggi bangunan minimal ${(shadowHeightOnNeighbor - (neighborHeight * 0.5)).toFixed(1)}m`
        : null,
      shiftPosition: shadowPercentage > 50 && distanceToNeighbor < 6
        ? 'Geser posisi bangunan menjauhi tetangga'
        : null,
      steppedDesign: shadowPercentage > 40
        ? 'Pertimbangkan desain bertingkat (setback) untuk mengurangi bayangan'
        : null,
      legalNotice: shadowPercentage > 30
        ? 'Wajib memperoleh persetujuan tertulis dari tetangga terdampak'
        : null
    }
  };
}

/**
 * Analisis View Corridor (Koridor Pandang)
 * @param {Object} params - Parameter view corridor
 * @returns {Object} Hasil analisis view corridor
 */
export function analyzeViewCorridor(params) {
  const {
    landmarkPosition,     // {lat, lng} posisi landmark
    sitePosition,       // {lat, lng} posisi site
    buildingHeight,
    maxHeightAllowed,   // Tinggi maksimum yang diperbolehkan untuk menjaga view
    viewAngle = 30      // Sudut pandang dari landmark ke site (derajat)
  } = params;
  
  // Calculate distance
  const distance = calculateDistance(landmarkPosition, sitePosition);
  
  // Maximum height to maintain view
  const heightLimit = maxHeightAllowed || (distance * Math.tan(viewAngle * Math.PI / 180));
  
  const isBlocking = buildingHeight > heightLimit;
  
  return {
    landmark: landmarkPosition,
    site: sitePosition,
    distance: distance.toFixed(2) + ' km',
    distanceRaw: distance,
    
    view: {
      angle: viewAngle + '°',
      maxHeightAllowed: heightLimit.toFixed(2) + ' m',
      proposedHeight: buildingHeight + ' m',
      isBlocking,
      status: isBlocking ? 'NC' : 'C'
    },
    
    regulation: {
      basis: 'RDTR Provinsi - View Corridor Protection',
      zones: [
        'View ke Gunung Gede',
        'View ke Gunung Galunggang',
        'View ke Gunung Guntur',
        'View ke Gunung Cikuray'
      ]
    },
    
    recommendation: isBlocking
      ? `Kurangi tinggi bangunan ke ${heightLimit.toFixed(1)}m atau desain setback bertingkat`
      : 'Bangunan tidak menghalangi koridor pandang'
  };
}

// Helper: Calculate distance between two coordinates (Haversine formula)
function calculateDistance(pos1, pos2) {
  const R = 6371; // Earth's radius in km
  const dLat = (pos2.lat - pos1.lat) * Math.PI / 180;
  const dLon = (pos2.lng - pos1.lng) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(pos1.lat * Math.PI / 180) * Math.cos(pos2.lat * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// ============================================================
// 7. PERDA KHUSUS COMPLIANCE
// ============================================================

/**
 * Validasi Perda Khusus Garut
 * @param {Object} params - Parameter validasi
 * @returns {Object} Hasil validasi Perda Garut
 */
export function validateGarutSpecialRegulations(params) {
  const {
    location,           // 'cipanas', 'cangkuang', 'galunggung', 'pertanian'
    KDB,
    KLB,
    height,
    floors,
    buildingType
  } = params;
  
  const regulations = [];
  let zoneSpecific = null;
  
  // Kawasan Pusaka (Cipanas, Cangkuang)
  if (location === 'cipanas' || location === 'cangkuang') {
    zoneSpecific = {
      name: 'Kawasan Pusaka ' + location.charAt(0).toUpperCase() + location.slice(1),
      KDB_max: 40,
      KLB_max: 0.8,
      height_max: 8,
      floors_max: 2,
      restrictions: [
        'Desain harus mengacu arsitektur tradisional Sunda',
        'Material lokal (bata, kayu, anyaman) wajib 60%',
        'Larangan penggunaan genteng metal atau aluminium'
      ]
    };
    
    if (KDB > 40) regulations.push({ type: 'error', message: 'KDB melebihi 40% untuk kawasan pusaka' });
    if (height > 8) regulations.push({ type: 'error', message: 'Tinggi maksimal 8m untuk kawasan pusaka' });
  }
  
  // Kawasan Rawan Bencana (Gunung Galunggang)
  if (location === 'galunggung') {
    zoneSpecific = {
      name: 'Kawasan Rawan Bencana Gunung Galunggung',
      KDB_max: 30,
      KLB_max: 0.6,
      height_max: 6,
      floors_max: 1,
      restrictions: [
        'Wajib ada ruang perlindungan darurat di dalam bangunan',
        'Struktur bangunan harus tahan gempa dan lahar (SNI 1726 + faktor 1.5)',
        'Sistem peringatan dini harus terintegrasi dengan BPBD'
      ]
    };
    
    if (KDB > 30) regulations.push({ type: 'error', message: 'KDB melebihi 30% untuk zona rawan bencana' });
    if (floors > 1) regulations.push({ type: 'error', message: 'Maksimal 1 lantai untuk zona rawan bencana' });
  }
  
  // Kawasan Pertanian
  if (location === 'pertanian') {
    zoneSpecific = {
      name: 'Kawasan Pertanian (LP2B)',
      KDB_max: 20,
      KLB_max: 0.4,
      height_max: 8,
      conversionAllowed: false,
      restrictions: [
        'Konversi lahan pertanian sangat terbatas (izin Menteri)',
        'Kegiatan harus mendukung pertanian (gudang, packing house)',
        'Tidak diperbolehkan untuk perumahan atau komersial'
      ]
    };
    
    if (buildingType === 'rumah_tinggal') {
      regulations.push({ type: 'error', message: 'Perumahan tidak diperbolehkan di LP2B' });
    }
  }
  
  return {
    location,
    zoneSpecific,
    violations: regulations,
    isCompliant: regulations.length === 0,
    requiresSpecialPermit: zoneSpecific !== null,
    contact: 'Dinas PUPR Kabupaten Garut - Bidang Perizinan'
  };
}

/**
 * Validasi RDTR Jawa Barat
 * @param {Object} params - Parameter validasi
 * @returns {Object} Hasil validasi RDTR Jabar
 */
export function validateJabarRDTR(params) {
  const {
    region,             // 'bandung_raya', 'cekungan', 'pantura', 'selatan'
    zone,
    KLB,
    KDH,
    buildingType
  } = params;
  
  const regionRules = {
    'bandung_raya': {
      name: 'Kawasan Bandung Raya',
      zones: {
        'CBD': { KLB_max: 8.0, KDH_min: 10 },
        'suburb': { KLB_max: 2.0, KDH_min: 30 },
        'industrial': { KLB_max: 1.5, KDH_min: 25 }
      },
      environmental: 'Baku mutu udara Bandung (PM2.5 < 35 μg/m³)'
    },
    'cekungan': {
      name: 'Kawasan Cekungan Bandung',
      zones: {
        'utara': { KLB_max: 3.0, KDH_min: 25 },
        'selatan': { KLB_max: 2.5, KDH_min: 30 }
      },
      environmental: 'Tambahan rekomendasi: green roof untuk mengurangi UHI'
    }
  };
  
  const regionData = regionRules[region];
  
  if (!regionData) {
    return { note: 'Wilayah di luar zona khusus RDTR Jabar' };
  }
  
  const zoneRule = regionData.zones[zone];
  
  return {
    region: regionData.name,
    zone,
    parameters: zoneRule,
    compliance: {
      KLB: KLB <= zoneRule.KLB_max ? 'C' : 'NC',
      KDH: KDH >= zoneRule.KDH_min ? 'C' : 'NC'
    },
    environmentalRequirement: regionData.environmental,
    greenBelt: region === 'bandung_raya' ? {
      required: KDH >= 30,
      note: 'Jalur hijau (green belt) minimum 30% untuk keseimbangan ekosistem Bandung Raya'
    } : null
  };
}

// ============================================================
// 8. GENERATOR LAPORAN & OUTPUT
// ============================================================

/**
 * Generate Berita Acara Pemeriksaan Kesesuaian
 * @param {Object} data - Data pemeriksaan lengkap
 * @returns {Object} Format berita acara
 */
export function generateInspectionReport(data) {
  const {
    project,
    intensity,
    zoning,
    setbacks,
    compliance,
    date = new Date().toISOString().split('T')[0]
  } = data;
  
  const baNumber = `BA/KF/${new Date().getFullYear()}/${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
  
  return {
    document: {
      type: 'Berita Acara Pemeriksaan Kesesuaian Fungsi dan Intensitas Bangunan',
      number: baNumber,
      date,
      based_on: [
        'PP Nomor 16 Tahun 2021 (Pasal 216 & 217)',
        'Permen ATR/BPN Nomor 6 Tahun 2023 (KKPR)',
        'Perda Kabupaten Garut Nomor 6 Tahun 2012',
        'Perda Provinsi Jawa Barat Nomor 1 Tahun 2022'
      ]
    },
    
    project: {
      name: project.name,
      owner: project.owner,
      address: project.address,
      landStatus: project.landStatus, // SHM/SHGB/HGB
      landArea: project.landArea + ' m²'
    },
    
    findings: {
      functionCompliance: {
        planned: zoning.plannedFunction,
        zone: zoning.zoneName,
        status: zoning.compliance.status,
        recommendation: zoning.recommendation
      },
      
      intensity: {
        KDB: { value: intensity.KDB.percentage, limit: intensity.KDB.limit + '%', status: intensity.KDB.status },
        KLB: { value: intensity.KLB.ratio, limit: intensity.KLB.limit, status: intensity.KLB.status },
        KDH: { value: intensity.KDH.percentage, limit: intensity.KDH.limit + '%', status: intensity.KDH.status },
        KTB: { value: intensity.KTB.percentage, limit: intensity.KTB.limit + '%', status: intensity.KTB.status }
      },
      
      setbacks: {
        road: setbacks.road,
        river: setbacks.river,
        building: setbacks.building
      }
    },
    
    conclusion: compliance.overall === 'C' 
      ? 'SESUAI - Bangunan memenuhi persyaratan fungsi dan intensitas'
      : 'TIDAK SESUAI - Terdapat pelanggaran yang perlu diperbaiki',
    
    recommendations: compliance.violations.length > 0 ? [
      'Ajukan perubahan KKPR sesuai rekomendasi',
      'Lakukan redesign untuk mengurangi pelanggaran',
      'Konsultasi dengan Dinas PUPR untuk solusi terbaik'
    ] : ['Dapat melanjutkan pengajuan IMB'],
    
    signature: {
      inspector: '',
      owner: '',
      date: ''
    }
  };
}

// ============================================================
// DEFAULT EXPORTS
// ============================================================

export default {
  // Database
  ZONING_DATABASE,
  ROAD_CLASSIFICATION,
  
  // Calculators
  calculateKDB,
  calculateKLB,
  calculateKDH,
  calculateKTB,
  calculateBuildingIntensity,
  calculateBuildingHeight,
  calculateSetbacks,
  
  // Validators
  validateZoningCompliance,
  validateGarutSpecialRegulations,
  validateJabarRDTR,
  
  // Analysis
  calculateShadowImpact,
  analyzeViewCorridor,
  
  // Report
  generateInspectionReport
};
