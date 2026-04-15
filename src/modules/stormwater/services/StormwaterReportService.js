/**
 * StormwaterReportService - Technical Report Generator
 * Generates DOCX technical reports for stormwater management
 */

export class StormwaterReportService {
  constructor() {
    this.companyInfo = {
      name: 'Konsultan SLF Indonesia',
      address: 'Jl. Teknik Sipil No. 1, Jakarta',
      phone: '(021) 1234-5678',
      email: 'info@slf-consultant.co.id'
    };
  }

  /**
   * Generate technical report for stormwater simulation
   * @param {Object} simulationData - Simulation results
   * @param {Object} projectInfo - Project information
   * @returns {Object} Report sections
   */
  async generateSimulationReport(simulationData, projectInfo = {}) {
    const { storm, catchments, routing, lid, summary, waterQuality } = simulationData;

    const sections = [
      {
        title: '1. PENDAHULUAN',
        content: [
          `Laporan ini menyajikan hasil analisis sistem pengelolaan air hujan untuk bangunan gedung.`,
          ``,
          `Proyek: ${projectInfo.name || 'Tidak Diberi Nama'}`,
          `Lokasi: ${projectInfo.location || '-'}`,
          `Tanggal Analisis: ${new Date().toLocaleDateString('id-ID')}`,
          ``,
          `Standar yang digunakan:`,
          `- SNI 2415:2016 (Tata Cara Perencanaan Sistem Drainase Perkotaan)`,
          `- SNI 6389:2011 (Tata Cara Perencanaan Teknik Sumur Resapan Air Hujan)`,
          `- EPA SWMM 5.1 (Storm Water Management Model)`,
          `- PP No. 16 Tahun 2021 (Pasal 224 ayat 11)`
        ]
      },
      {
        title: '2. ANALISIS HIDROLOGI',
        content: [
          `2.1 Curah Hujan Rencana`,
          ``,
          `Metode: Intensity-Duration-Frequency (IDF)`,
          `Kota: ${storm?.city || 'Jakarta'}`,
          `Periode Ulang: ${storm?.returnPeriod || 25} tahun`,
          `Durasi: ${storm?.duration || 120} menit`,
          `Distribusi: ${storm?.type || 'SCS Type II'}`,
          `Kedalaman Total: ${(storm?.totalDepth || 0).toFixed(2)} mm`,
          ``,
          `Formula IDF: I = a / (t + b)^c`,
          `Parameter: a = ${this.getIDFParams(storm?.city).a}, b = ${this.getIDFParams(storm?.city).b}, c = ${this.getIDFParams(storm?.city).c}`
        ],
        tables: [
          {
            title: 'Tabel 1: Data Hyetograph',
            headers: ['Waktu (menit)', 'Intensitas (mm/jam)', 'Kedalaman (mm)', 'Kumulatif (mm)'],
            rows: (storm?.data || []).slice(0, 10).map(d => [
              d.time,
              d.intensity.toFixed(2),
              d.depth.toFixed(3),
              d.cumulative.toFixed(2)
            ])
          }
        ]
      },
      {
        title: '3. ANALISIS LIMPASAN PERMUKAAN',
        content: [
          `3.1 Metode SCS Curve Number`,
          ``,
          `Metode perhitungan limpasan menggunakan SCS Curve Number dengan formula:`,
          `Q = (P - Ia)² / (P - Ia + S) untuk P > Ia`,
          ``,
          `Dimana:`,
          `- Q = Kedalaman limpasan (mm)`,
          `- P = Curah hujan (mm)`,
          `- Ia = Abstraksi awal = 0.2S`,
          `- S = Retensi potensial maksimum = (25400/CN) - 254`
        ],
        tables: [
          {
            title: 'Tabel 2: Parameter Catchment',
            headers: ['Catchment', 'Luas (m²)', 'CN', 'S (mm)', 'Ia (mm)', 'Q (mm)', 'Volume (m³)'],
            rows: (catchments || []).map(c => {
              const s = (25400 / c.cn) - 254;
              const ia = 0.2 * s;
              const p = storm?.totalDepth || 0;
              const q = p > ia ? Math.pow(p - ia, 2) / (p - ia + s) : 0;
              return [
                c.name,
                c.area.toFixed(0),
                c.cn,
                s.toFixed(1),
                ia.toFixed(1),
                q.toFixed(2),
                (q * c.area / 1000).toFixed(2)
              ];
            })
          }
        ]
      },
      {
        title: '4. HASIL SIMULASI HIDROLIKA',
        content: [
          `4.1 Routing Aliran`,
          ``,
          `Metode routing: Muskingum-Cunge`,
          `Timestep: 5 menit`,
          ``,
          `Ringkasan Hasil:`,
          `- Debit Puncak Masuk: ${(summary?.peakInflow || 0).toFixed(3)} m³/s`,
          `- Debit Puncak Keluar: ${(summary?.peakOutflow || 0).toFixed(3)} m³/s`,
          `- Pengurangan Puncak: ${((summary?.peakReduction || 0) * 100).toFixed(1)}%`,
          `- Volume Total Masuk: ${(summary?.totalInflow || 0).toFixed(2)} m³`,
          `- Volume Total Keluar: ${(summary?.totalOutflow || 0).toFixed(2)} m³`,
          `- Pengurangan Volume: ${((summary?.volumeReduction || 0) * 100).toFixed(1)}%`
        ],
        tables: routing?.channels ? [
          {
            title: 'Tabel 3: Kapasitas Saluran',
            headers: ['Saluran', 'Debit Puncak (m³/s)', 'Kapasitas (m³/s)', 'Kecepatan (m/s)', 'Status'],
            rows: routing.channels.map(ch => [
              ch.id,
              ch.maxFlow.toFixed(3),
              ch.capacity.toFixed(3),
              ch.velocity.toFixed(2),
              ch.maxFlow <= ch.capacity ? 'Aman' : 'Overkapasitas'
            ])
          }
        ] : undefined
      }
    ];

    // Add LID section if available
    if (lid && lid.length > 0) {
      sections.push({
        title: '5. EVALUASI LID (LOW IMPACT DEVELOPMENT)',
        content: [
          `5.1 Sistem LID yang Dievaluasi`,
          ``,
          `Jumlah sistem LID: ${lid.length}`,
          ``,
          `Ringkasan Performa LID:`
        ],
        tables: [
          {
            title: 'Tabel 4: Performa LID',
            headers: ['Tipe LID', 'Luas (m²)', 'Volume Tertampung (m³)', 'Pengurangan Puncak (%)', 'Status'],
            rows: lid.map(l => [
              l.lidType,
              l.area.toFixed(0),
              l.summary.totalCaptured.toFixed(2),
              (l.summary.peakReduction * 100).toFixed(0),
              l.summary.performance
            ])
          }
        ]
      });
    }

    // Add water quality section if available
    if (waterQuality && waterQuality.length > 0) {
      sections.push({
        title: '6. ANALISIS KUALITAS AIR',
        content: [
          `6.1 Model Buildup-Washoff`,
          ``,
          `Simulasi kualitas air menggunakan model buildup-washoff untuk polutan:`,
          `- TSS (Total Suspended Solids)`,
          `- BOD (Biological Oxygen Demand)`,
          `- COD (Chemical Oxygen Demand)`,
          `- TP (Total Phosphorus)`,
          `- TN (Total Nitrogen)`,
          `- Logam berat (Pb, Zn)`
        ]
      });
    }

    // Add conclusion
    sections.push({
      title: lid && lid.length > 0 ? '7. KESIMPULAN' : '5. KESIMPULAN',
      content: [
        `Berdasarkan analisis yang telah dilakukan:`,
        ``,
        `1. Sistem drainase dirancang untuk menampung curah hujan ${storm?.returnPeriod || 25}-tahun`,
        `2. Debit puncak keluar sistem: ${(summary?.peakOutflow || 0).toFixed(3)} m³/s`,
        lid && lid.length > 0 ? `3. Sistem LID mampu mengurangi volume limpasan sebesar ${((summary?.volumeReduction || 0) * 100).toFixed(0)}%` : '',
        ``,
        `Rekomendasi:`,
        `- Sistem telah memenuhi persyaratan SNI 2415:2016`,
        `- Perlu pemeliharaan rutin terhadap sistem LID dan drainase`,
        `- Monitoring debit dan kualitas air secara berkala`
      ].filter(Boolean)
    });

    return { sections };
  }

  /**
   * Generate report for Pasal 224 evaluation
   */
  async generatePasal224Report(evaluationData, projectInfo = {}) {
    const { systems, summary, pasal } = evaluationData;

    const sections = [
      {
        title: 'EVALUASI SISTEM PENGELOLAAN AIR HUJAN',
        subtitle: `Pasal 224 ayat (11) - ${projectInfo.name || 'Proyek'}`,
        content: [
          `Tanggal Evaluasi: ${new Date().toLocaleDateString('id-ID')}`,
          `Lokasi: ${projectInfo.location || '-'}`,
          ``,
          `Standar Evaluasi:`,
          `- PP Nomor 16 Tahun 2021 Pasal 224 ayat (11)`,
          `- SNI 2415:2016 - Tata Cara Perencanaan Sistem Drainase Perkotaan`,
          `- SNI 6398:2011 - Tata Cara Perencanaan Teknik Sumur Resapan Air Hujan`,
          `- Permen PUPR No. 22/PRT/M/2020`
        ]
      },
      {
        title: 'RINGKASAN HASIL EVALUASI',
        content: [
          `Total Compliance Score: ${summary?.score || 0}%`,
          `Status: ${summary?.status || 'BELUM DINILAI'}`,
          `Jumlah Pemeriksaan: ${summary?.totalChecks || 0}`,
          `Lulus: ${summary?.passedChecks || 0}`,
          ``,
          `Interpretasi Status:`,
          `- COMPLIANT (≥80%): Sistem memenuhi persyaratan`,
          `- PARTIAL (60-79%): Sistem memerlukan perbaikan`,
          `- NON_COMPLIANT (<60%): Sistem tidak memenuhi persyaratan`
        ]
      }
    ];

    // Add each system section
    systems?.forEach(system => {
      const passCount = system.items.filter(i => i.status === 'PASS').length;
      const failCount = system.items.filter(i => i.status === 'FAIL').length;
      const warnCount = system.items.filter(i => i.status === 'WARN').length;

      sections.push({
        title: system.category.toUpperCase(),
        content: [
          `Hasil Evaluasi ${system.category}:`,
          `- Lulus: ${passCount} item`,
          `- Perhatian: ${warnCount} item`,
          `- Tidak Lulus: ${failCount} item`
        ],
        tables: [
          {
            title: `Detail Evaluasi ${system.category}`,
            headers: ['Item', 'Deskripsi', 'Standar', 'Actual', 'Status'],
            rows: system.items.map(item => [
              item.id,
              item.description,
              item.standard,
              item.actual,
              item.status
            ])
          }
        ]
      });
    });

    // Recommendations
    const failedItems = systems?.flatMap(s => s.items.filter(i => i.status === 'FAIL')) || [];
    const warningItems = systems?.flatMap(s => s.items.filter(i => i.status === 'WARN')) || [];

    sections.push({
      title: 'REKOMENDASI PERBAIKAN',
      content: [
        failedItems.length > 0 ? `Item yang Perlu Diperbaiki (${failedItems.length}):` : 'Tidak ada item yang perlu diperbaiki.',
        ...failedItems.map(i => `- ${i.description}: ${i.note || 'Sesuaikan dengan standar'}`),
        ``,
        warningItems.length > 0 ? `Item yang Perlu Perhatian (${warningItems.length}):` : '',
        ...warningItems.map(i => `- ${i.description}: ${i.note || 'Pertimbangkan perbaikan'}`)
      ].filter(Boolean)
    });

    return { sections };
  }

  /**
   * Export report to DOCX format (placeholder)
   * In production, this would use a library like docx.js
   */
  async exportToDOCX(reportData, filename = 'stormwater-report') {
    // This is a placeholder - actual implementation would use docx library
    // For now, return JSON that can be converted
    return {
      type: 'docx',
      filename: `${filename}.docx`,
      data: reportData
    };
  }

  /**
   * Generate CSV export for simulation data
   */
  generateCSV(simulationData) {
    const { storm, catchments } = simulationData;

    let csv = 'Time (min),Rainfall Intensity (mm/hr),Rainfall Depth (mm)';

    // Add headers for each catchment
    catchments?.forEach(c => {
      csv += `,${c.name} Flow (m3/s)`;
    });
    csv += '\n';

    // Add data rows
    const maxRows = Math.max(
      storm?.data?.length || 0,
      ...(catchments?.map(c => c.hydrograph?.length) || [0])
    );

    for (let i = 0; i < maxRows; i++) {
      const stormData = storm?.data?.[i];
      csv += `${stormData?.time || ''},${stormData?.intensity?.toFixed(2) || ''},${stormData?.depth?.toFixed(3) || ''}`;

      catchments?.forEach(c => {
        const hydroData = c.hydrograph?.[i];
        csv += `,${hydroData?.flow?.toFixed(4) || ''}`;
      });

      csv += '\n';
    }

    return csv;
  }

  /**
   * Helper to get IDF parameters
   */
  getIDFParams(city) {
    const params = {
      'Jakarta': { a: 2990.5, b: 18.67, c: 0.86 },
      'Bandung': { a: 2450.3, b: 16.2, c: 0.82 },
      'Surabaya': { a: 2800.7, b: 17.8, c: 0.84 },
      'default': { a: 2990.5, b: 18.67, c: 0.86 }
    };
    return params[city] || params.default;
  }

  /**
   * Generate summary for dashboard
   */
  generateDashboardSummary(simulationData, evaluationData) {
    const sim = simulationData?.summary;
    const eval_ = evaluationData?.summary;

    return {
      simulation: {
        hasData: !!sim,
        peakFlow: sim?.peakOutflow?.toFixed(3) + ' m³/s',
        volumeReduction: ((sim?.volumeReduction || 0) * 100).toFixed(0) + '%',
        stormReturnPeriod: simulationData?.storm?.returnPeriod + ' tahun'
      },
      evaluation: {
        hasData: !!eval_,
        score: eval_?.score + '%',
        status: eval_?.status,
        totalChecks: eval_?.totalChecks,
        passedChecks: eval_?.passedChecks
      },
      overallStatus: this.determineOverallStatus(sim, eval_)
    };
  }

  determineOverallStatus(sim, eval_) {
    if (!sim && !eval_) return 'NOT_STARTED';
    if (eval_?.status === 'NON_COMPLIANT') return 'ATTENTION_REQUIRED';
    if (eval_?.status === 'PARTIAL') return 'NEEDS_IMPROVEMENT';
    if (eval_?.status === 'COMPLIANT') return 'COMPLIANT';
    return 'IN_PROGRESS';
  }
}

export default StormwaterReportService;
