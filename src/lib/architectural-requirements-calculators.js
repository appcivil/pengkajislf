/**
 * ARCHITECTURAL REQUIREMENTS CALCULATORS
 * Pemeriksaan Aspek Persyaratan Arsitektur berdasarkan:
 * - PP Nomor 16 Tahun 2021 (Pasal 218)
 * - SNI 03-6197-2000 (Tata Cara Perencanaan Tata Ruang Dalam)
 * - SNI 03-2396-2001 (Tata Cara Perencanaan Lingkungan)
 * - SNI 03-6389-2000 (ETTV - Energy Efficiency)
 * - Standar Arsitektur Indonesia
 */

// ============================================================
// 1. PENAMPILAN BANGUNAN - FASADE ANALYSIS
// ============================================================

/**
 * Analisis Proporsi Golden Ratio pada Fasad
 * @param {number} totalHeight - Tinggi total bangunan (m)
 * @param {number} width - Lebar fasad (m)
 * @param {Array} floorHeights - Array tinggi per lantai [m]
 * @returns {Object} Analisis proporsi fasad
 */
export function analyzeFacadeProportion(totalHeight, width, floorHeights = []) {
  const goldenRatio = 1.618;
  const ratio = totalHeight / width;
  const deviation = Math.abs(ratio - goldenRatio) / goldenRatio;
  
  // Analisis ritme lantai
  const floorRhythm = floorHeights.map((h, i) => {
    if (i === 0) return { type: 'base', height: h, note: 'Lantai dasar/lobi' };
    if (i === floorHeights.length - 1) return { type: 'crown', height: h, note: 'Lantai atas/atap' };
    return { type: 'typical', height: h, note: 'Lantai typical' };
  });
  
  // Modulasi vertikal analysis
  const avgFloorHeight = floorHeights.length > 0 
    ? floorHeights.reduce((a, b) => a + b, 0) / floorHeights.length 
    : 0;
  
  return {
    dimensions: {
      totalHeight,
      width,
      depth: null // Would need additional input
    },
    proportions: {
      heightToWidth: ratio,
      heightToWidthFormatted: ratio.toFixed(3),
      goldenRatio,
      deviation: deviation,
      deviationPercent: (deviation * 100).toFixed(1) + '%'
    },
    analysis: {
      status: deviation < 0.15 ? 'Harmonis' : deviation < 0.25 ? 'Cukup' : 'Perlu penyesuaian',
      isGoldenRatio: deviation < 0.15,
      styleClassification: ratio > 2.5 ? 'Tower/Vertical Dominant' : 
                          ratio > 1.8 ? 'High-rise' :
                          ratio > 1.2 ? 'Mid-rise Proportional' :
                          ratio > 0.8 ? 'Low-rise Balanced' : 'Horizontal/Low-rise',
      visualImpact: ratio > 2 ? 'Dominan vertikal, monumental' :
                    ratio > 1.5 ? 'Proporsional elegan' :
                    ratio > 1 ? 'Balance horizontal-vertikal' : 'Mendatar, terintegrasi landscape'
    },
    rhythm: {
      floorCount: floorHeights.length,
      floorHeights: floorRhythm,
      averageHeight: avgFloorHeight.toFixed(2) + ' m',
      rhythmConsistency: calculateRhythmConsistency(floorHeights)
    },
    recommendations: {
      goldenRatio: deviation > 0.15 ? 'Pertimbangkan modulasi horizontal untuk mendekati golden ratio' : null,
      height: ratio > 3 ? 'Bangunan sangat tinggi, perhatikan detail vertikal' : null,
      width: ratio < 0.5 ? 'Bangunan terlalu mendatar, pertimbangkan penambahan elemen vertikal' : null
    }
  };
}

function calculateRhythmConsistency(heights) {
  if (heights.length < 2) return 'N/A';
  const avg = heights.reduce((a, b) => a + b, 0) / heights.length;
  const variance = heights.reduce((acc, h) => acc + Math.pow(h - avg, 2), 0) / heights.length;
  const stdDev = Math.sqrt(variance);
  const cv = (stdDev / avg) * 100; // Coefficient of variation
  
  return {
    coefficient: cv.toFixed(1) + '%',
    status: cv < 5 ? 'Sangat konsisten' : cv < 15 ? 'Cukup konsisten' : 'Bervariasi (penting untuk desain)',
    note: cv > 20 ? 'Variasi tinggi signifikan - mungkin untuk lobi/mezzanine' : null
  };
}

/**
 * Analisis Solid-to-Void Ratio pada Fasad
 * @param {number} solidArea - Luas area padat/dinding (m²)
 * @param {number} voidArea - Luas area bukaan/jendela (m²)
 * @param {string} buildingType - Tipe bangunan (residential, commercial, office)
 * @returns {Object} Analisis solid-to-void
 */
export function analyzeSolidToVoid(solidArea, voidArea, buildingType = 'residential') {
  const totalArea = solidArea + voidArea;
  const solidRatio = (solidArea / totalArea) * 100;
  const voidRatio = (voidArea / totalArea) * 100;
  const ratio = solidArea / voidArea;
  
  // Ideal ratios by building type
  const ideals = {
    'residential': { solid: 40, void: 60, range: '35:65 - 45:55' },
    'commercial': { solid: 50, void: 50, range: '40:60 - 60:40' },
    'office': { solid: 60, void: 40, range: '55:45 - 70:30' },
    'heritage': { solid: 70, void: 30, range: '60:40 - 80:20' }
  };
  
  const ideal = ideals[buildingType] || ideals['residential'];
  const deviation = Math.abs(voidRatio - ideal.void);
  
  return {
    areas: {
      solid: solidArea,
      void: voidArea,
      total: totalArea
    },
    ratios: {
      solid: solidRatio.toFixed(1) + '%',
      void: voidRatio.toFixed(1) + '%',
      solidToVoid: ratio.toFixed(2) + ':1',
      formatted: `${solidRatio.toFixed(0)}:${voidRatio.toFixed(0)}`
    },
    ideal: ideal,
    analysis: {
      status: deviation < 10 ? 'C' : deviation < 20 ? 'Perhatian' : 'NC',
      isCompliant: deviation < 15,
      naturalLighting: voidRatio > 50 ? 'Baik' : voidRatio > 30 ? 'Cukup' : 'Kurang (pertimbangkan bukaan tambahan)',
      thermalPerformance: voidRatio > 60 ? 'Perlu shading device' : voidRatio > 40 ? 'Optimal' : 'Baik (hemat energi)',
      privacy: solidRatio > 60 ? 'Tinggi' : solidRatio > 40 ? 'Cukup' : 'Rendah'
    },
    recommendations: {
      tooMuchVoid: voidRatio > 70 ? 'Tambahkan elemen solid atau sunshade untuk mengurangi heat gain' : null,
      tooMuchSolid: voidRatio < 20 ? 'Tambahkan bukaan jendela untuk pencahayaan alami' : null,
      shading: voidRatio > 55 ? 'Disarankan overhang 60-100cm atau vertical fin' : null
    }
  };
}

// ============================================================
// 2. PLAN EFFICIENCY ANALYSIS
// ============================================================

/**
 * Perhitungan Efisiensi Denah (Plan Efficiency)
 * @param {Object} areas - Luasan berbagai area
 * @param {number} totalArea - Luas total lantai
 * @returns {Object} Analisis efisiensi denah
 */
export function calculatePlanEfficiency(areas, totalArea) {
  const { 
    program = 0,      // Ruang program utama
    circulation = 0,    // Ruang sirkulasi (koridor, tangga)
    service = 0,        // Ruang service (toilet, utility)
    structure = 0       // Area struktur (kolom, dinding tebal)
  } = areas;
  
  const usedArea = program + circulation + service + structure;
  const efficiency = (program / totalArea) * 100;
  const circulationRatio = (circulation / totalArea) * 100;
  const serviceRatio = (service / totalArea) * 100;
  const structureRatio = (structure / totalArea) * 100;
  
  // Grading system
  let grade, status, description;
  if (efficiency >= 85) {
    grade = 'A';
    status = 'C';
    description = 'Sangat Efisien';
  } else if (efficiency >= 75) {
    grade = 'B';
    status = 'C';
    description = 'Efisien';
  } else if (efficiency >= 65) {
    grade = 'C';
    status = 'C';
    description = 'Cukup';
  } else if (efficiency >= 50) {
    grade = 'D';
    status = 'NC';
    description = 'Kurang Efisien';
  } else {
    grade = 'E';
    status = 'NC';
    description = 'Tidak Efisien';
  }
  
  // NEUF (Netto Efficiency Factor) - European standard
  const neuf = ((program + circulation) / totalArea) * 100;
  
  return {
    areas: {
      program,
      circulation,
      service,
      structure,
      total: totalArea,
      used: usedArea,
      unused: totalArea - usedArea
    },
    ratios: {
      program: efficiency.toFixed(1) + '%',
      circulation: circulationRatio.toFixed(1) + '%',
      service: serviceRatio.toFixed(1) + '%',
      structure: structureRatio.toFixed(1) + '%'
    },
    efficiency: {
      grossEfficiency: efficiency.toFixed(1) + '%',
      neuf: neuf.toFixed(1) + '%',
      grade,
      description,
      status
    },
    benchmarks: {
      ideal: '80-85%',
      acceptable: '70-80%',
      minimum: '65%',
      current: efficiency.toFixed(1) + '%'
    },
    analysis: {
      circulationEfficiency: circulationRatio < 12 ? 'Efisien' : circulationRatio < 18 ? 'Standar' : 'Boros',
      serviceEfficiency: serviceRatio < 8 ? 'Minimal' : serviceRatio < 15 ? 'Adekuat' : 'Generous',
      spaceWaste: (totalArea - usedArea) > (totalArea * 0.05) ? 'Ada ruang tidak terdefinisi' : 'Optimal'
    },
    recommendations: {
      improve: efficiency < 70 ? [
        'Kurangi lebar koridor (ideal 1.2-1.5m)',
        'Gabungkan ruang service jika memungkinkan',
        'Gunakan open plan untuk area publik'
      ] : null,
      circulation: circulationRatio > 18 ? 'Koridor terlalu lebar atau terlalu panjang' : null,
      service: serviceRatio > 15 ? 'Ruang utility bisa dikurangi atau digabung' : null
    }
  };
}

/**
 * Analisis Orientasi dan Daylight Access
 * @param {Array} rooms - Array ruang dengan properti
 * @returns {Object} Analisis daylight access
 */
export function analyzeDaylightAccess(rooms) {
  const orientationScore = {
    'north': 80,
    'south': 90,
    'east': 70,
    'west': 60,
    'northeast': 75,
    'northwest': 75,
    'southeast': 65,
    'southwest': 55
  };
  
  let totalScore = 0;
  let roomAnalysis = [];
  
  rooms.forEach(room => {
    const score = orientationScore[room.orientation?.toLowerCase()] || 50;
    const hasWindow = room.windowArea > 0;
    const wfr = hasWindow ? (room.windowArea / room.floorArea) * 100 : 0; // Window-to-floor ratio
    
    const daylightFactor = hasWindow ? Math.min((wfr / 10) * score, 100) : 0;
    
    roomAnalysis.push({
      name: room.name,
      orientation: room.orientation,
      windowToFloorRatio: wfr.toFixed(1) + '%',
      daylightFactor: daylightFactor.toFixed(1),
      status: daylightFactor > 50 ? 'Baik' : daylightFactor > 30 ? 'Cukup' : 'Kurang',
      recommendation: daylightFactor < 30 ? 'Tambahkan bukaan atau gunakan skylight' : null
    });
    
    totalScore += daylightFactor;
  });
  
  const avgScore = rooms.length > 0 ? totalScore / rooms.length : 0;
  
  return {
    rooms: roomAnalysis,
    summary: {
      averageDaylightFactor: avgScore.toFixed(1),
      status: avgScore > 50 ? 'C' : avgScore > 30 ? 'Perhatian' : 'NC',
      goodRooms: roomAnalysis.filter(r => r.status === 'Baik').length,
      poorRooms: roomAnalysis.filter(r => r.status === 'Kurang').length
    },
    recommendations: avgScore < 40 ? [
      'Pertimbangkan penambahan bukaan pada ruang dengan akses cahaya terbatas',
      'Gunakan warna dinding terang untuk memaksimalkan refleksi cahaya',
      'Pertimbangkan lightwell untuk ruang di tengah bangunan'
    ] : null
  };
}

// ============================================================
// 3. ROOF ANALYSIS
// ============================================================

/**
 * Analisis Atap
 * @param {Object} params - Parameter atap
 * @returns {Object} Analisis atap
 */
export function analyzeRoof(params) {
  const {
    type = 'pelana',           // pelana, limas, perisai, flat, kombinasi
    pitch = 30,                 // Kemiringan derajat
    material = 'genteng',       // genteng, metal, beton, green
    overhang = 60,              // Overstek cm
    hasGutter = true,           // Ada talang
    hasRidge = true             // Ada bubungan
  } = params;
  
  // Standard requirements
  const standards = {
    'pelana': { minPitch: 30, maxPitch: 45, ideal: 35 },
    'limas': { minPitch: 30, maxPitch: 40, ideal: 35 },
    'perisai': { minPitch: 30, maxPitch: 60, ideal: 45 },
    'flat': { minPitch: 0, maxPitch: 5, ideal: 2, note: 'Memerlukan drainage slope' }
  };
  
  const std = standards[type] || standards['pelana'];
  const isPitchValid = pitch >= std.minPitch && pitch <= std.maxPitch;
  const isOverhangValid = overhang >= 60;
  
  // Material durability
  const materialLifespan = {
    'genteng': 30,
    'metal': 25,
    'beton': 50,
    'shingle': 20,
    'green': 50
  };
  
  return {
    specifications: {
      type,
      pitch: pitch + '°',
      material,
      overhang: overhang + ' cm',
      hasGutter,
      hasRidge
    },
    standards: std,
    compliance: {
      pitch: isPitchValid ? 'C' : 'NC',
      overhang: isOverhangValid ? 'C' : 'NC',
      gutter: hasGutter ? 'C' : 'NC',
      ridge: hasRidge ? 'C' : type === 'flat' ? 'N/A' : 'NC'
    },
    analysis: {
      drainage: type === 'flat' ? 'Perlu drainage system baik' : pitch > 30 ? 'Drainase sangat baik' : 'Cukup',
      windResistance: pitch > 45 ? 'Perlu pengikat tambahan' : 'Baik',
      thermal: material === 'metal' ? 'Perlu insulasi' : material === 'green' ? 'Thermal mass baik' : 'Standar',
      lifespan: materialLifespan[material] + ' tahun'
    },
    recommendations: {
      pitch: !isPitchValid ? `Kemiringan ideal untuk ${type} adalah ${std.ideal}°` : null,
      overhang: !isOverhangValid ? 'Tambahkan overstek minimal 60cm untuk perlindungan dinding' : null,
      gutter: !hasGutter ? 'Wajib dipasang talang untuk drainase air hujan' : null,
      material: material === 'metal' ? 'Pertimbangkan insulasi thermal untuk mengurangi panas' : null
    }
  };
}

// ============================================================
// 4. THERMAL PERFORMANCE - ETTV
// ============================================================

/**
 * Perhitungan ETTV (Envelope Thermal Transfer Value)
 * SNI 03-6389-2000
 * @param {Object} params - Parameter thermal
 * @returns {Object} Analisis ETTV
 */
export function calculateETTV(params) {
  const {
    wallArea = 100,
    windowArea = 30,
    wallUvalue = 1.5,           // W/m²K - typical for concrete with plaster
    windowUvalue = 5.8,         // W/m²K - single glass
    windowSHGC = 0.7,           // Solar Heat Gain Coefficient
    orientation = 'east'        // Arah orientasi
  } = params;
  
  const totalArea = wallArea + windowArea;
  const windowRatio = (windowArea / totalArea) * 100;
  
  // Solar Factor by orientation (W/m²) - Indonesia tropical climate
  const solarFactors = {
    'north': 130,
    'south': 130,
    'east': 210,
    'west': 210,
    'northeast': 170,
    'northwest': 170,
    'southeast': 190,
    'southwest': 190
  };
  
  const sf = solarFactors[orientation?.toLowerCase()] || 150;
  const deltaT = 5; // Temperature difference (°C) - typical indoor-outdoor
  
  // ETTV Formula: (Aw x Uw x ΔT) + (Af x Uf x ΔT) + (Af x SHGC x SF) / Atotal
  const wallHeatTransfer = wallArea * wallUvalue * deltaT;
  const windowHeatTransfer = windowArea * windowUvalue * deltaT;
  const solarHeatGain = windowArea * windowSHGC * sf;
  
  const ettv = (wallHeatTransfer + windowHeatTransfer + solarHeatGain) / totalArea;
  
  // SNI 03-6389-2000: Max 45 W/m²
  const maxETTV = 45;
  const isCompliant = ettv <= maxETTV;
  
  // Energy efficiency rating
  let rating;
  if (ettv < 30) rating = { grade: 'A', desc: 'Sangat Efisien' };
  else if (ettv < 40) rating = { grade: 'B', desc: 'Efisien' };
  else if (ettv <= 45) rating = { grade: 'C', desc: 'Memenuhi Standar' };
  else if (ettv < 55) rating = { grade: 'D', desc: 'Kurang Efisien' };
  else rating = { grade: 'E', desc: 'Tidak Efisien' };
  
  return {
    areas: {
      wall: wallArea + ' m²',
      window: windowArea + ' m²',
      total: totalArea + ' m²',
      windowRatio: windowRatio.toFixed(1) + '%'
    },
    thermalProperties: {
      wallUvalue: wallUvalue + ' W/m²K',
      windowUvalue: windowUvalue + ' W/m²K',
      windowSHGC: windowSHGC,
      orientation: orientation,
      solarFactor: sf + ' W/m²'
    },
    ettv: {
      value: ettv.toFixed(2) + ' W/m²',
      raw: ettv,
      maxAllowed: maxETTV + ' W/m²',
      status: isCompliant ? 'C' : 'NC',
      isCompliant
    },
    rating,
    heatTransfer: {
      wall: wallHeatTransfer.toFixed(0) + ' W',
      window: windowHeatTransfer.toFixed(0) + ' W',
      solar: solarHeatGain.toFixed(0) + ' W',
      total: (wallHeatTransfer + windowHeatTransfer + solarHeatGain).toFixed(0) + ' W'
    },
    recommendations: {
      tooHigh: ettv > maxETTV ? [
        'Gunakan low-E glass atau double glazing (U-value < 3.0)',
        'Tambahkan shading device/overhang pada jendela',
        'Pertimbangkan insulated wall (U-value < 1.0)'
      ] : null,
      windowSHGC: windowSHGC > 0.5 ? 'Gunakan glass dengan SHGC < 0.5 untuk mengurangi heat gain' : null,
      westFacing: orientation === 'west' ? 'Fasad barat memiliki heat gain tinggi - pertimbangkan external shading' : null
    }
  };
}

// ============================================================
// 5. FENCE & BOUNDARY ANALYSIS
// ============================================================

/**
 * Analisis Pagar dan Batas Fisik
 * @param {Object} params - Parameter pagar
 * @returns {Object} Analisis pagar
 */
export function analyzeFence(params) {
  const {
    frontHeight = 1.0,          // Tinggi pagar depan (m)
    sideHeight = 2.0,           // Tinggi pagar samping (m)
    rearHeight = 2.0,           // Tinggi pagar belakang (m)
    frontMaterial = 'hollow',   // solid, hollow, combination
    gateWidth = 3.0,            // Lebar gerbang (m)
    setbackDistance = 3.0     // Jarak pagar ke garis sempadan (m)
  } = params;
  
  // Standards
  const standards = {
    front: { max: 1.2, transparency: 'required' },
    side: { max: 2.0 },
    rear: { max: 2.0 },
    gate: { min: 3.0 } // For vehicle access
  };
  
  const isFrontValid = frontHeight <= standards.front.max;
  const isFrontTransparent = frontMaterial !== 'solid' || frontHeight <= 0.8;
  const isSideValid = sideHeight <= standards.side.max;
  const isRearValid = rearHeight <= standards.rear.max;
  const isGateValid = gateWidth >= standards.gate.min;
  
  return {
    specifications: {
      front: frontHeight + ' m (' + frontMaterial + ')',
      side: sideHeight + ' m',
      rear: rearHeight + ' m',
      gate: gateWidth + ' m',
      setback: setbackDistance + ' m'
    },
    compliance: {
      front: {
        height: isFrontValid ? 'C' : 'NC',
        transparency: isFrontTransparent ? 'C' : 'NC - Pagar depan solid harus < 0.8m'
      },
      side: isSideValid ? 'C' : 'NC',
      rear: isRearValid ? 'C' : 'NC',
      gate: isGateValid ? 'C' : 'NC'
    },
    analysis: {
      visibility: isFrontTransparent ? 'Baik - tidak menghalangi pandangan' : 'Terhalang - pertimbangkan desain berlubang',
      security: sideHeight >= 1.8 ? 'Baik' : 'Cukup - bisa ditambahi planting',
      privacy: rearHeight >= 1.8 ? 'Baik' : 'Kurang - bisa ditambahi tanaman',
      accessibility: gateWidth >= 3 ? 'Akses kendaraan baik' : gateWidth >= 1.2 ? 'Hanya akses pejalan kaki' : 'Terlalu sempit'
    },
    recommendations: {
      front: !isFrontValid ? `Tinggi pagar depan maksimal ${standards.front.max}m` : null,
      frontTransparency: !isFrontTransparent ? 'Pagar depan solid wajib < 0.8m atau gunakan desain berlubang' : null,
      gate: !isGateValid ? `Lebar gerbang minimal ${standards.gate.min}m untuk akses mobil` : null
    }
  };
}

// ============================================================
// 6. ROOM & INTERIOR SPACE ANALYSIS
// ============================================================

/**
 * Validasi Program Ruang
 * @param {string} roomType - Tipe ruang
 * @param {number} area - Luas ruang (m²)
 * @param {number} height - Tinggi ruang (m)
 * @returns {Object} Validasi ruang
 */
export function validateRoom(roomType, area, height) {
  // SNI 03-6197-2000 standards
  const standards = {
    'tidur': { minArea: 9, minHeight: 2.4, idealArea: 12, idealHeight: 2.8 },
    'keluarga': { minArea: 12, minHeight: 2.6, idealArea: 20, idealHeight: 2.8 },
    'makan': { minArea: 9, minHeight: 2.4, idealArea: 12, idealHeight: 2.6 },
    'dapur': { minArea: 5, minHeight: 2.4, idealArea: 8, idealHeight: 2.6 },
    'mandi': { minArea: 2, minHeight: 2.2, idealArea: 3, idealHeight: 2.4 },
    'kerja': { minArea: 6, minHeight: 2.6, idealArea: 10, idealHeight: 2.8 },
    'rapat': { minArea: 12, minHeight: 2.8, idealArea: 20, idealHeight: 3.0 },
    'lobi': { minArea: 15, minHeight: 3.0, idealArea: 30, idealHeight: 4.5 },
    'koridor': { minWidth: 1.2, minHeight: 2.4, idealWidth: 1.5, idealHeight: 2.6 },
    'tangga': { minWidth: 0.9, minHeight: 2.4, idealWidth: 1.2, idealHeight: 2.6 }
  };
  
  const std = standards[roomType];
  if (!std) return { error: 'Tipe ruang tidak dikenal' };
  
  const isAreaValid = std.minArea ? area >= std.minArea : true;
  const isHeightValid = std.minHeight ? height >= std.minHeight : true;
  const isWidthValid = std.minWidth ? area >= std.minWidth : true;
  
  return {
    roomType,
    actual: {
      area: area + ' m²',
      height: height + ' m'
    },
    standards: std,
    compliance: {
      area: isAreaValid ? 'C' : 'NC',
      height: isHeightValid ? 'C' : 'NC',
      width: isWidthValid ? 'C' : 'N/A'
    },
    comfort: {
      spaciousness: area >= std.idealArea ? 'Baik' : area >= std.minArea ? 'Cukup' : 'Terbatas',
      vertical: height >= std.idealHeight ? 'Baik' : height >= std.minHeight ? 'Cukup' : 'Sesak'
    },
    recommendations: {
      area: !isAreaValid ? `Luas minimal ${std.minArea}m², ideal ${std.idealArea}m²` : null,
      height: !isHeightValid ? `Tinggi minimal ${std.minHeight}m, ideal ${std.idealHeight}m` : null
    }
  };
}

// ============================================================
// 7. ARCHITECTURAL COMPLIANCE SCORE
// ============================================================

/**
 * Skor Compliance Komposit Arsitektur
 * @param {Object} scores - Skor tiap aspek
 * @returns {Object} Skor komposit
 */
export function calculateArchitectureComplianceScore(scores) {
  const {
    penampilan = 0,    // 30%
    tataRuang = 0,     // 40%
    keselarasan = 0    // 30%
  } = scores;
  
  // Weighted calculation
  const weightedScore = (penampilan * 0.30) + (tataRuang * 0.40) + (keselarasan * 0.30);
  
  let grade, status;
  if (weightedScore >= 90) {
    grade = 'A';
    status = 'Sangat Baik';
  } else if (weightedScore >= 80) {
    grade = 'B+';
    status = 'Baik';
  } else if (weightedScore >= 70) {
    grade = 'B';
    status = 'Memenuhi';
  } else if (weightedScore >= 60) {
    grade = 'C';
    status = 'Cukup';
  } else {
    grade = 'D';
    status = 'Kurang';
  }
  
  return {
    components: {
      penampilan: { score: penampilan, weight: '30%', weighted: (penampilan * 0.30).toFixed(1) },
      tataRuang: { score: tataRuang, weight: '40%', weighted: (tataRuang * 0.40).toFixed(1) },
      keselarasan: { score: keselarasan, weight: '30%', weighted: (keselarasan * 0.30).toFixed(1) }
    },
    total: {
      score: weightedScore.toFixed(1),
      grade,
      status,
      isPass: weightedScore >= 70
    },
    breakdown: {
      excellent: weightedScore >= 85 ? 'Bangunan memiliki kualitas arsitektur tinggi' : null,
      improvements: weightedScore < 70 ? 'Perlu perbaikan untuk memenuhi standar minimum' : null
    }
  };
}

// ============================================================
// DEFAULT EXPORTS
// ============================================================

export default {
  analyzeFacadeProportion,
  analyzeSolidToVoid,
  calculatePlanEfficiency,
  analyzeDaylightAccess,
  analyzeRoof,
  calculateETTV,
  analyzeFence,
  validateRoom,
  calculateArchitectureComplianceScore
};
