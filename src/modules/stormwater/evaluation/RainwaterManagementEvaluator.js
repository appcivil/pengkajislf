/**
 * RainwaterManagementEvaluator
 * Engine evaluasi sistem pengelolaan air hujan sesuai Pasal 224 ayat (11) PP 16/2021
 * Mencakup: Sistem Tangkapan, Penyaluran, Penampungan/Pengolahan, Pemanfaatan
 * Standar: SNI 2415:2016, SNI 6398:2011, Permen PUPR 22/PRT/M/2020
 */

export class RainwaterManagementEvaluator {
  constructor() {
    this.standards = {
      // SNI 2415:2016 & Permen PUPR No. 22/PRT/M/2020
      firstFlushVolume: 1.0, // mm (diabetes pertama yang dibuang)
      minCatchmentEfficiency: 0.8,
      minPipeSlope: 0.01, // 1%
      maxPipeSlope: 0.15, // 15%
      minInfiltrationRate: 0.5, // m/hari
      minVelocity: 0.6, // m/s - prevent sedimentation
      maxVelocity: 3.0, // m/s - prevent erosion
      maxManholeSpacing: 30, // m
      minManholeDiameter: 600, // mm
      minDistanceFromBuilding: 3, // m for infiltration
      reuseQualityClasses: {
        'A': { turbidity: 5, ecoli: 0, use: 'Minum' },
        'B': { turbidity: 25, ecoli: 10, use: 'Mandi/Cuci' },
        'C': { turbidity: 50, ecoli: 100, use: 'Siram/Flush' }
      }
    };
  }

  // ============================================================================
  // 1. SISTEM TANGKAPAN AIR HUJAN (Roof Catchment System)
  // ============================================================================

  evaluateCatchmentSystem(roofData, rainfall) {
    const results = {
      category: 'Sistem Tangkapan',
      items: []
    };

    // a. Luas tangkapan efektif
    const effectiveArea = (roofData.area || 0) * (roofData.runoffCoefficient || 0.95);
    const efficiency = roofData.area > 0 ? (effectiveArea / roofData.area) : 0;

    results.items.push({
      id: 'catch_01',
      description: 'Luas tangkapan air hujan efektif',
      standard: '≥ 70% luas atap',
      actual: `${(efficiency * 100).toFixed(1)}%`,
      status: efficiency >= 0.7 ? 'PASS' : 'FAIL',
      value: `${effectiveArea.toFixed(2)} m²`,
      note: 'Memperhitungkan koefisien limpasan material atap'
    });

    // b. Material atap (tidak beracun)
    const safeMaterials = ['metal', 'clay', 'concrete', 'ceramic', 'asphalt_shingle'];
    const unsafeMaterials = ['asbestos', 'zinc_galvanized', 'lead'];
    const material = (roofData.material || '').toLowerCase();

    results.items.push({
      id: 'catch_02',
      description: 'Material penutup atap aman (tidak beracun)',
      standard: 'Bukan asbes/zinc murah',
      actual: roofData.material || 'Tidak diketahui',
      status: unsafeMaterials.includes(material) ? 'FAIL' :
        safeMaterials.includes(material) ? 'PASS' : 'WARN',
      note: 'Hindari atap seng yang berkarat atau berlapis kimia berbahaya'
    });

    // c. Gutter/Talang
    const gutterCapacity = this.calculateGutterCapacity(roofData.gutter);
    const peakRunoff = this.calculatePeakRunoff(effectiveArea, rainfall);

    results.items.push({
      id: 'catch_03',
      description: 'Kapasitas talang air (Gutter)',
      standard: `≥ ${peakRunoff.toFixed(3)} m³/dt`,
      actual: `${gutterCapacity.toFixed(3)} m³/dt`,
      status: gutterCapacity >= peakRunoff * 0.9 ? 'PASS' :
        gutterCapacity >= peakRunoff * 0.7 ? 'WARN' : 'FAIL',
      value: roofData.gutter ?
        `Dimensi: ${roofData.gutter.width}×${roofData.gutter.height} mm` : 'Belum diatur',
      note: 'Talang harus mampu menampung aliran puncak 5-tahun'
    });

    // d. First Flush Diverter (Pembuang air pertama)
    const firstFlushVolume = effectiveArea * this.standards.firstFlushVolume / 1000; // m³

    results.items.push({
      id: 'catch_04',
      description: 'Sistem pembuang air pertama (First Flush)',
      standard: `≥ ${firstFlushVolume.toFixed(2)} m³`,
      actual: `${(roofData.firstFlushVolume || 0).toFixed(2)} m³`,
      status: (roofData.firstFlushVolume || 0) >= firstFlushVolume ? 'PASS' : 'FAIL',
      note: 'Air hujan 10 menit pertama harus dibuang karena mengandung kotoran'
    });

    // e. Leaf Guard/Saringan
    results.items.push({
      id: 'catch_05',
      description: 'Filter/saringan daun pada talang',
      standard: 'Mesh ≤ 5mm',
      actual: roofData.hasLeafGuard ? 'Ada' : 'Tidak ada',
      status: roofData.hasLeafGuard ? 'PASS' : 'WARN',
      note: 'Mencegah clogging pada sistem penyaluran'
    });

    // f. Rainwater head ( sump )
    results.items.push({
      id: 'catch_06',
      description: 'Rainwater head / sump outlet',
      standard: 'Tersedia',
      actual: roofData.hasRainwaterHead ? 'Ada' : 'Tidak',
      status: roofData.hasRainwaterHead ? 'PASS' : 'WARN',
      note: 'Menyalurkan air dari talang ke pipa tegak'
    });

    return results;
  }

  // ============================================================================
  // 2. SISTEM PENYALURAN (Vertical Pipes & Site Drainage)
  // ============================================================================

  evaluateConveyanceSystem(pipes, siteDrainage) {
    const results = {
      category: 'Sistem Penyaluran',
      items: []
    };

    // a. Pipa Tegak (Vertical Pipes/Downspouts)
    if (pipes && pipes.length > 0) {
      pipes.forEach((pipe, idx) => {
        const capacity = this.calculatePipeCapacity(pipe.diameter, pipe.slope);
        const required = pipe.designFlow || 0.05;

        const velocity = this.calculateVelocity(capacity, pipe.diameter);
        const slopePercent = (pipe.slope || 0) * 100;

        results.items.push({
          id: `conv_vert_${idx}`,
          description: `Pipa tegak lantai ${pipe.floor || idx + 1}`,
          standard: `Kapasitas ≥ ${required.toFixed(3)} m³/dt`,
          actual: `${capacity.toFixed(3)} m³/dt`,
          status: capacity >= required ? 'PASS' : 'FAIL',
          value: `Ø${pipe.diameter} mm, slope ${slopePercent.toFixed(1)}%`,
          note: slopePercent < 1 ? 'Kemiringan terlalu landai (risiko sedimentasi)' :
            slopePercent > 15 ? 'Kemiringan terlalu curam' :
              velocity < 0.6 ? 'Kecepatan rendah (risiko sedimentasi)' :
                velocity > 3.0 ? 'Kecepatan tinggi (risiko erosi)' : 'OK'
        });
      });
    } else {
      results.items.push({
        id: 'conv_vert_0',
        description: 'Pipa tegak (Downspouts)',
        standard: 'Tersedia',
        actual: 'Tidak ada data',
        status: 'FAIL',
        value: '-',
        note: 'Wajib menyediakan pipa tegak untuk penyaluran'
      });
    }

    // b. Drainase dalam Persil (Site Drainage)
    if (siteDrainage && siteDrainage.length > 0) {
      siteDrainage.forEach((drain, idx) => {
        const velocity = this.calculateVelocity(drain.flow, drain.diameter);

        results.items.push({
          id: `conv_site_${idx}`,
          description: `Drainase dalam persil segmen ${idx + 1}`,
          standard: `V: ${this.standards.minVelocity}-${this.standards.maxVelocity} m/s`,
          actual: `${velocity.toFixed(2)} m/s`,
          status: (velocity >= this.standards.minVelocity && velocity <= this.standards.maxVelocity) ? 'PASS' :
            velocity < this.standards.minVelocity ? 'WARN' : 'FAIL',
          value: `${drain.length}m, Ø${drain.diameter}mm`,
          note: velocity < this.standards.minVelocity ? 'Risiko sedimentasi' :
            velocity > this.standards.maxVelocity ? 'Risiko erosi' : 'Optimal'
        });
      });
    }

    // c. Manhole/Inspection Chamber
    const maxSpacing = this.standards.maxManholeSpacing;
    results.items.push({
      id: 'conv_manhole',
      description: 'Jarak antar manhole',
      standard: `≤ ${maxSpacing} m`,
      actual: siteDrainage?.manholeSpacing ? `${siteDrainage.manholeSpacing} m` : 'N/A',
      status: (siteDrainage?.manholeSpacing || 0) <= maxSpacing ? 'PASS' : 'WARN',
      note: 'Untuk pemeliharaan dan flushing'
    });

    // d. Manhole diameter
    results.items.push({
      id: 'conv_manhole_diam',
      description: 'Diameter manhole',
      standard: `≥ ${this.standards.minManholeDiameter} mm`,
      actual: siteDrainage?.manholeDiameter ? `${siteDrainage.manholeDiameter} mm` : 'N/A',
      status: (siteDrainage?.manholeDiameter || 0) >= this.standards.minManholeDiameter ? 'PASS' : 'WARN',
      note: 'Akses untuk pemeliharaan'
    });

    return results;
  }

  // ============================================================================
  // 3. SISTEM PENAMPUNGAN, PENGOLAHAN, PERESAPAN, PEMBUANGAN
  // ============================================================================

  evaluateTreatmentStorage(storage, infiltration, outlet) {
    const results = {
      category: 'Penampungan & Pengolahan',
      items: []
    };

    // a. Volume penampungan
    const catchmentArea = storage.catchmentArea || 100; // m2
    const requiredVolume = catchmentArea * 0.05; // 5% dari luas tangkapan (50 L/m2) - standar绿色建筑
    const actualVolume = storage.volume || 0;

    results.items.push({
      id: 'store_01',
      description: 'Volume tangki tampungan (Tank)',
      standard: `≥ ${requiredVolume.toFixed(2)} m³ (5% luas tangkapan)`,
      actual: `${actualVolume} m³`,
      status: actualVolume >= requiredVolume ? 'PASS' :
        actualVolume >= requiredVolume * 0.7 ? 'WARN' : 'FAIL',
      value: `${((actualVolume / requiredVolume) * 100).toFixed(0)}% dari standar`,
      note: 'Perhitungan berdasarkan curah hujan 24 jam'
    });

    // b. Material tangki (tidak bocor)
    results.items.push({
      id: 'store_02',
      description: 'Kedap air (Water tightness)',
      standard: 'Nol kebocoran',
      actual: storage.leakageTest ? 'Lulus uji' : 'Belum diuji',
      status: storage.leakageTest ? 'PASS' : 'WARN',
      note: 'Wajib uji tekanan sebelum operasi'
    });

    // c. Sistem peresapan (Infiltration)
    if (infiltration) {
      const infilRate = infiltration.rate || 0;

      results.items.push({
        id: 'store_03',
        description: 'Tingkat peresapan tanah',
        standard: `≥ ${this.standards.minInfiltrationRate} m/hari`,
        actual: `${infilRate} m/hari`,
        status: infilRate >= this.standards.minInfiltrationRate ? 'PASS' : 'FAIL',
        value: `Jenis tanah: ${infiltration.soilType || 'Tidak diketahui'}`,
        note: 'Tidak cocok untuk tanah liat (clay)'
      });

      // d. Jarak aman dari bangunan
      const distance = infiltration.distanceFromBuilding || 0;
      results.items.push({
        id: 'store_04',
        description: 'Jarak sumur resapan dari fondasi',
        standard: `≥ ${this.standards.minDistanceFromBuilding} m`,
        actual: `${distance} m`,
        status: distance >= this.standards.minDistanceFromBuilding ? 'PASS' : 'FAIL',
        note: 'Mencegah kelongsoran fondasi'
      });

      // e. Kedalaman muka air tanah
      results.items.push({
        id: 'store_05',
        description: 'Kedalaman muka air tanah',
        standard: '≥ 1.5 m dari dasar sumur',
        actual: infiltration.groundwaterDepth ? `${infiltration.groundwaterDepth} m` : 'N/A',
        status: (infiltration.groundwaterDepth || 0) >= 1.5 ? 'PASS' : 'WARN',
        note: 'Mencegah kontaminasi air tanah'
      });
    }

    // f. Overflow/Pembuangan berlebih
    results.items.push({
      id: 'store_06',
      description: 'Sistem overflow',
      standard: 'Tersedia',
      actual: storage.hasOverflow ? 'Ada' : 'Tidak',
      status: storage.hasOverflow ? 'PASS' : 'FAIL',
      note: 'Mencegah banjir saat tangki penuh'
    });

    // g. Akses maintenance
    results.items.push({
      id: 'store_07',
      description: 'Akses pembersihan',
      standard: `Manhole ≥ ${this.standards.minManholeDiameter}mm`,
      actual: `${storage.manholeDiameter || 0} mm`,
      status: (storage.manholeDiameter || 0) >= this.standards.minManholeDiameter ? 'PASS' : 'WARN',
      note: 'Untuk sediment removal'
    });

    // h. Outlet discharge rate
    if (outlet) {
      results.items.push({
        id: 'store_08',
        description: 'Laju pelepasan outlet',
        standard: 'Sesuai perhitungan',
        actual: `${outlet.dischargeRate || 0} m³/dt`,
        status: outlet.dischargeRate > 0 ? 'PASS' : 'WARN',
        value: `Orifice: Ø${outlet.orificeDiameter || 0}mm`,
        note: 'Detention time biasanya 24-48 jam'
      });
    }

    return results;
  }

  // ============================================================================
  // 4. SISTEM PEMANFAATAN AIR HUJAN (Rainwater Harvesting for Reuse)
  // ============================================================================

  evaluateReuseSystem(demand, supply, treatment) {
    const results = {
      category: 'Pemanfaatan Air Hujan',
      items: []
    };

    // a. Neraca air (Water Balance)
    const dailyDemand = (demand.toilet || 0) + (demand.irrigation || 0) + (demand.cleaning || 0); // Liter/hari
    const dailySupply = supply.catchmentYield || 0; // Liter/hari (rata-rata)
    const reliability = dailyDemand > 0 ? dailySupply / dailyDemand : 0;

    results.items.push({
      id: 'reuse_01',
      description: 'Reliabilitas pasokan (Supply/Demand)',
      standard: '≥ 30% kebutuhan non-potable',
      actual: `${(reliability * 100).toFixed(0)}%`,
      status: reliability >= 0.3 ? 'PASS' : 'WARN',
      value: `${dailySupply.toFixed(0)}/${dailyDemand.toFixed(0)} L/hari`,
      note: reliability < 0.3 ? 'Tambah tangki atau kurangi demand' : 'Optimal'
    });

    // b. Kualitas air sesuai penggunaan
    const requiredClass = demand.useType === 'toilet' ? 'C' :
      demand.useType === 'bath' ? 'B' : 'A';
    const actualQuality = this.assessWaterQuality(treatment);

    results.items.push({
      id: 'reuse_02',
      description: 'Kualitas air untuk ' + (demand.useType || 'umum'),
      standard: `Kelas ${requiredClass}`,
      actual: `Kelas ${actualQuality.class}`,
      status: this.isQualitySufficient(actualQuality, requiredClass) ? 'PASS' : 'FAIL',
      value: `Turbidity: ${actualQuality.turbidity} NTU`,
      note: `Standar: ${this.standards.reuseQualityClasses[requiredClass]?.turbidity || 50} NTU`
    });

    // c. Treatment train
    const requiredTreatments = ['sedimentation', 'filtration'];
    const processes = treatment?.processes || [];
    const hasAll = requiredTreatments.every(t => processes.includes(t));

    results.items.push({
      id: 'reuse_03',
      description: 'Rangkaian pengolahan (Treatment train)',
      standard: 'Sedimentasi + Filtrasi',
      actual: processes.length > 0 ? processes.join(' → ') : 'Belum diatur',
      status: hasAll ? 'PASS' : 'FAIL',
      note: 'Minimum 2 tahap pengolahan sebelum reuse'
    });

    // d. Dual plumbing system
    results.items.push({
      id: 'reuse_04',
      description: 'Pipa terpisah (Non-potable)',
      standard: 'Tidak tercampur air PDAM',
      actual: demand.hasDualPlumbing ? 'Terpisah' : 'Campur',
      status: demand.hasDualPlumbing ? 'PASS' : 'FAIL',
      note: 'Wajib labeling warna ungu/hijau'
    });

    // e. Backup supply (air PDAM saat kemarau)
    results.items.push({
      id: 'reuse_05',
      description: 'Cadangan air PDAM',
      standard: 'Tersedia',
      actual: supply.hasBackup ? 'Ada' : 'Tidak',
      status: supply.hasBackup ? 'PASS' : 'WARN',
      note: 'Untuk musim kemarau > 7 hari'
    });

    // f. Storage sizing adequacy
    const dryDays = supply.dryDays || 7;
    const requiredStorage = (dailyDemand * dryDays) / 1000; // m3
    const actualStorage = supply.storageVolume || 0;

    results.items.push({
      id: 'reuse_06',
      description: 'Volume storage untuk dry season',
      standard: `${dryDays} hari × ${dailyDemand} L = ${requiredStorage.toFixed(1)} m³`,
      actual: `${actualStorage} m³`,
      status: actualStorage >= requiredStorage ? 'PASS' :
        actualStorage >= requiredStorage * 0.7 ? 'WARN' : 'FAIL',
      note: 'Autonomy selama musim kemarau'
    });

    return results;
  }

  // ============================================================================
  // HELPER CALCULATIONS
  // ============================================================================

  calculateGutterCapacity(gutter) {
    if (!gutter) return 0;
    // Manning untuk saluran terbuka
    const A = (gutter.width / 1000) * (gutter.height / 1000); // m²
    const P = (gutter.width / 1000) + 2 * (gutter.height / 1000); // m
    const R = A / P;
    const S = 0.01; // asumsi slope 1%
    const n = 0.016; // PVC/concrete
    return (1 / n) * A * Math.pow(R, 2 / 3) * Math.sqrt(S);
  }

  calculatePeakRunoff(area, rainfall) {
    const intensity = rainfall?.intensity || 50; // mm/jam
    const C = 0.9; // roof runoff coefficient
    return (C * intensity * area) / 3600; // m³/dt
  }

  calculatePipeCapacity(diameter, slope) {
    if (!diameter || !slope) return 0;
    const D = diameter / 1000; // m
    const A = Math.PI * D * D / 4;
    const R = D / 4; // for circular pipe full flow
    const n = 0.013; // PVC
    return (1 / n) * A * Math.pow(R, 2 / 3) * Math.sqrt(slope);
  }

  calculateVelocity(flow, diameter) {
    if (!flow || !diameter) return 0;
    const Q = flow;
    const D = diameter / 1000;
    const A = Math.PI * D * D / 4;
    return A > 0 ? Q / A : 0;
  }

  assessWaterQuality(treatment) {
    if (!treatment) return { class: 'C', turbidity: 50 };

    // Simplified assessment
    if (treatment.hasUV && treatment.hasFilter) return { class: 'A', turbidity: 2 };
    if (treatment.hasFilter) return { class: 'B', turbidity: 15 };
    return { class: 'C', turbidity: 30 };
  }

  isQualitySufficient(actual, required) {
    const classes = ['A', 'B', 'C'];
    return classes.indexOf(actual.class) <= classes.indexOf(required);
  }

  // ============================================================================
  // MAIN EVALUATION RUNNER
  // ============================================================================

  runFullEvaluation(data) {
    const systems = [
      this.evaluateCatchmentSystem(data.roof, data.rainfall),
      this.evaluateConveyanceSystem(data.pipes, data.siteDrainage),
      this.evaluateTreatmentStorage(data.storage, data.infiltration, data.outlet),
      this.evaluateReuseSystem(data.demand, data.supply, data.treatment)
    ];

    return {
      pasal: '224 ayat (11)',
      timestamp: new Date().toISOString(),
      systems,
      summary: this.calculateOverallCompliance(systems)
    };
  }

  calculateOverallCompliance(allResults) {
    let total = 0;
    let passed = 0;

    allResults.forEach(system => {
      system.items.forEach(item => {
        total++;
        if (item.status === 'PASS') passed++;
        if (item.status === 'WARN') passed += 0.5;
      });
    });

    const score = total > 0 ? (passed / total) * 100 : 0;
    return {
      score: score.toFixed(1),
      status: score >= 80 ? 'COMPLIANT' : score >= 60 ? 'PARTIAL' : 'NON_COMPLIANT',
      totalChecks: total,
      passedChecks: Math.floor(passed),
      warningChecks: total - Math.floor(passed) - (total - Math.ceil(passed))
    };
  }

  // ============================================================================
  // QUICK CHECK FUNCTIONS
  // ============================================================================

  /**
   * Quick check if system meets basic requirements
   */
  quickCheck(data) {
    const criticalItems = [
      { check: data.roof?.area > 0, name: 'Roof area defined' },
      { check: (data.pipes?.length || 0) > 0, name: 'Conveyance pipes exist' },
      { check: data.storage?.volume > 0, name: 'Storage volume defined' },
      { check: data.storage?.hasOverflow, name: 'Overflow system exists' }
    ];

    return {
      passed: criticalItems.every(i => i.check),
      items: criticalItems,
      missing: criticalItems.filter(i => !i.check).map(i => i.name)
    };
  }
}

export default RainwaterManagementEvaluator;
