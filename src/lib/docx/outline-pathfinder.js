/**
 * DOCX Outline for Pathfinder Evacuation Simulation Report
 * Generates sections for RSET (Required Safe Egress Time) analysis
 */

import { Paragraph, TextRun, Table, TableCell, TableRow, WidthType, AlignmentType, HeadingLevel, BorderStyle } from 'docx';
import { FONT_MAIN, FONT_SIZE_BODY, FONT_SIZE_H2, FONT_SIZE_H3, COLOR_HEADING, COLOR_PRIMARY, COLOR_SUCCESS, COLOR_DANGER, COLOR_WARNING, safeText } from './utils.js';

/**
 * Render Pathfinder Evacuation Analysis Section for DOCX
 */
export function renderPathfinderSection(proyek, pathfinderData = {}, settings = {}) {
  const children = [];
  
  const results = pathfinderData.results || pathfinderData || {};
  const totalAgents = results.totalAgents || 0;
  const evacuated = results.evacuated || 0;
  const stranded = results.stranded || 0;
  const rset = results.rset || 0;
  const rsetSeconds = results.rsetSeconds || 0;
  const evacuationRate = results.evacuationRate || 0;
  const agentDetails = results.agentDetails || [];
  const flowRates = results.flowRates || {};
  const evacuationCurve = results.evacuationCurve || [];
  
  // Section Heading
  children.push(
    new Paragraph({
      text: 'ANALISIS SIMULASI EVAKUASI - PATHFINDER',
      heading: HeadingLevel.HEADING_2,
      alignment: AlignmentType.LEFT,
      spacing: { before: 400, after: 300 }
    })
  );

  // Overview
  children.push(
    new Paragraph({
      text: '8.1 Deskripsi Simulasi Evakuasi',
      heading: HeadingLevel.HEADING_3,
      spacing: { before: 300, after: 200 }
    }),
    new Paragraph({
      spacing: { after: 200, line: 360 },
      children: [
        new TextRun({
          text: `Analisis simulasi evakuasi dilakukan menggunakan Social Force Model berbasis algoritma Helbing & Molnár dengan integrasi A* Pathfinding. Simulasi ini menghitung RSET (Required Safe Egress Time) sebagai waktu yang dibutuhkan seluruh penghuni untuk mencapai tempat aman saat keadaan darurat.`,
          font: FONT_MAIN,
          size: FONT_SIZE_BODY
        })
      ]
    })
  );

  // Simulation Parameters
  children.push(
    new Paragraph({
      text: '8.2 Parameter Simulasi',
      heading: HeadingLevel.HEADING_3,
      spacing: { before: 400, after: 200 }
    }),
    new Paragraph({
      text: 'Tabel 8.1 - Parameter Simulasi Evakuasi',
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 100 }
    }),
    createSimulationParamsTable(pathfinderData),
    new Paragraph({
      spacing: { after: 300 },
      style: 'Caption'
    })
  );

  // RSET Results Summary
  const rsetStatus = rsetSeconds <= 180 ? 'Optimal' : rsetSeconds <= 300 ? 'Memenuhi' : rsetSeconds <= 600 ? 'Perlu Perhatian' : 'Kritis';
  const rsetColor = rsetSeconds <= 300 ? COLOR_SUCCESS : rsetSeconds <= 600 ? COLOR_WARNING : COLOR_DANGER;
  
  children.push(
    new Paragraph({
      text: '8.3 Hasil Analisis RSET',
      heading: HeadingLevel.HEADING_3,
      spacing: { before: 400, after: 200 }
    }),
    new Paragraph({
      text: 'Tabel 8.2 - Ringkasan Hasil Evakuasi',
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 100 }
    }),
    createRSETSummaryTable(results),
    new Paragraph({
      spacing: { after: 200 },
      style: 'Caption'
    }),
    new Paragraph({
      spacing: { before: 200, after: 200 },
      children: [
        new TextRun({ text: 'Status RSET: ', bold: true, font: FONT_MAIN, size: FONT_SIZE_BODY }),
        new TextRun({ text: `${rsetStatus} (${rsetSeconds} detik)`, bold: true, color: rsetColor, font: FONT_MAIN, size: FONT_SIZE_BODY })
      ]
    }),
    new Paragraph({
      spacing: { after: 200, line: 360 },
      children: [
        new TextRun({
          text: `RSET (Required Safe Egress Time) untuk ${safeText(proyek.nama_bangunan)} adalah ${rsetSeconds} detik (${rset} menit). ${getRSETInterpretation(rsetSeconds, evacuationRate, stranded)}`,
          font: FONT_MAIN,
          size: FONT_SIZE_BODY
        })
      ]
    })
  );

  // Agent Profile Distribution
  if (agentDetails.length > 0) {
    children.push(
      new Paragraph({
        text: '8.4 Distribusi Profil Agens',
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 400, after: 200 }
      }),
      new Paragraph({
        text: 'Tabel 8.3 - Distribusi Profil Populasi',
        alignment: AlignmentType.CENTER,
        spacing: { before: 200, after: 100 }
      }),
      createAgentProfileTable(agentDetails),
      new Paragraph({
        spacing: { after: 300 },
        style: 'Caption'
      })
    );
  }

  // Exit Flow Analysis
  if (Object.keys(flowRates).length > 0) {
    children.push(
      new Paragraph({
        text: '8.5 Analisis Aliran Keluar (Exit Flow)',
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 400, after: 200 }
      }),
      new Paragraph({
        text: 'Tabel 8.4 - Kapasitas dan Aliran Pintu Keluar',
        alignment: AlignmentType.CENTER,
        spacing: { before: 200, after: 100 }
      }),
      createExitFlowTable(flowRates),
      new Paragraph({
        spacing: { after: 300 },
        style: 'Caption'
      })
    );
  }

  // Evacuation Timeline
  if (evacuationCurve.length > 0) {
    children.push(
      new Paragraph({
        text: '8.6 Kurva Waktu Evakuasi',
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 400, after: 200 }
      }),
      new Paragraph({
        text: 'Tabel 8.5 - Persentase Evakuasi per Interval Waktu',
        alignment: AlignmentType.CENTER,
        spacing: { before: 200, after: 100 }
      }),
      createEvacuationCurveTable(evacuationCurve),
      new Paragraph({
        spacing: { after: 300 },
        style: 'Caption'
      })
    );
  }

  // Performance Metrics
  children.push(
    new Paragraph({
      text: '8.7 Metrik Kinerja Evakuasi',
      heading: HeadingLevel.HEADING_3,
      spacing: { before: 400, after: 200 }
    }),
    new Paragraph({
      text: 'Tabel 8.6 - Metrik Kinerja Evakuasi',
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 100 }
      }),
    createPerformanceMetricsTable(results),
    new Paragraph({
      spacing: { after: 300 },
      style: 'Caption'
    })
  );

  // Comparison with Standards
  children.push(
    new Paragraph({
      text: '8.8 Perbandingan dengan Standar',
      heading: HeadingLevel.HEADING_3,
      spacing: { before: 400, after: 200 }
    }),
    new Paragraph({
      text: 'Tabel 8.7 - Evaluasi terhadap Standar Internasional',
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 100 }
    }),
    createStandardsComparisonTable(rsetSeconds, evacuationRate, totalAgents),
    new Paragraph({
      spacing: { after: 300 },
      style: 'Caption'
    })
  );

  // Conclusion
  children.push(
    new Paragraph({
      text: '8.9 Kesimpulan dan Rekomendasi',
      heading: HeadingLevel.HEADING_3,
      spacing: { before: 400, after: 200 }
    }),
    new Paragraph({
      spacing: { after: 200, line: 360 },
      children: [
        new TextRun({
          text: getEvacuationConclusion(rsetSeconds, evacuationRate, stranded, proyek.nama_bangunan),
          font: FONT_MAIN,
          size: FONT_SIZE_BODY
        })
      ]
    })
  );

  // Safety Factor Note (if integrated with fire simulation)
  if (pathfinderData.integratedASET) {
    const aset = pathfinderData.integratedASET;
    const sf = aset / rsetSeconds;
    const sfStatus = sf >= 1.5 ? 'Aman' : sf >= 1.0 ? 'Marginal' : 'Tidak Aman';
    const sfColor = sf >= 1.5 ? COLOR_SUCCESS : sf >= 1.0 ? COLOR_WARNING : COLOR_DANGER;
    
    children.push(
      new Paragraph({
        text: '8.10 Analisis ASET-RSET Integration',
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 400, after: 200 }
      }),
      new Paragraph({
        spacing: { after: 200 },
        children: [
          new TextRun({ text: 'ASET (Available Safe Egress Time): ', bold: true, font: FONT_MAIN, size: FONT_SIZE_BODY }),
          new TextRun({ text: `${aset.toFixed(0)} detik`, font: FONT_MAIN, size: FONT_SIZE_BODY })
        ]
      }),
      new Paragraph({
        spacing: { after: 200 },
        children: [
          new TextRun({ text: 'RSET (Required Safe Egress Time): ', bold: true, font: FONT_MAIN, size: FONT_SIZE_BODY }),
          new TextRun({ text: `${rsetSeconds} detik`, font: FONT_MAIN, size: FONT_SIZE_BODY })
        ]
      }),
      new Paragraph({
        spacing: { after: 200 },
        children: [
          new TextRun({ text: 'Safety Factor (ASET/RSET): ', bold: true, font: FONT_MAIN, size: FONT_SIZE_BODY }),
          new TextRun({ text: `${sf.toFixed(2)} (${sfStatus})`, bold: true, color: sfColor, font: FONT_MAIN, size: FONT_SIZE_BODY })
        ]
      }),
      new Paragraph({
        spacing: { after: 200, line: 360 },
        children: [
          new TextRun({
            text: getSafetyFactorInterpretation(sf),
            font: FONT_MAIN,
            size: FONT_SIZE_BODY
          })
        ]
      })
    );
  }

  return children;
}

// Helper Functions

function createSimulationParamsTable(data) {
  const params = data.params || {
    desiredSpeed: 1.2,
    maxSpeed: 2.0,
    agentRadius: 0.3,
    relaxationTime: 0.5,
    repulsionStrength: 2000,
    repulsionRange: 0.5
  };

  const rows = [
    new TableRow({
      children: [
        createHeaderCell('Parameter'),
        createHeaderCell('Nilai'),
        createHeaderCell('Satuan'),
        createHeaderCell('Keterangan')
      ]
    }),
    createDataRow4('Desired Speed', params.desiredSpeed || 1.2, 'm/s', 'Kecepatan berjalan normal'),
    createDataRow4('Max Speed', params.maxSpeed || 2.0, 'm/s', 'Kecepatan lari maksimum'),
    createDataRow4('Agent Radius', params.agentRadius || 0.3, 'm', 'Lebar bahu / 2'),
    createDataRow4('Relaxation Time', params.relaxationTime || 0.5, 's', 'Waktu reaksi'),
    createDataRow4('Repulsion Strength', params.repulsionStrength || 2000, 'N', 'Kekuatan tolak antar agens'),
    createDataRow4('Repulsion Range', params.repulsionRange || 0.5, 'm', 'Jarak interaksi sosial'),
    createDataRow4('Wall Repulsion', params.wallRepulsion || 1500, 'N', 'Kekuatan tolak dinding'),
    createDataRow4('Exit Attraction', params.exitAttraction || 3000, 'N', 'Gaya tarik keluar')
  ];

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows
  });
}

function createRSETSummaryTable(results) {
  const rows = [
    new TableRow({
      children: [
        createHeaderCell('Parameter'),
        createHeaderCell('Nilai'),
        createHeaderCell('Satuan')
      ]
    }),
    createDataRow('Total Agens', results.totalAgents || 0, 'orang'),
    createDataRow('Berhasil Evakuasi', results.evacuated || 0, 'orang'),
    createDataRow('Tertinggal/Stranded', results.stranded || 0, 'orang'),
    createDataRow('Tingkat Evakuasi', results.evacuationRate || 0, '%'),
    createDataRow('RSET (Waktu Total)', results.rset || 0, 'menit'),
    createDataRow('RSET (Waktu Total)', results.rsetSeconds || 0, 'detik'),
    createDataRow('Waktu Evakuasi Tercepat', results.minTime || 0, 'detik'),
    createDataRow('Waktu Evakuasi Rata-rata', results.avgTime || 0, 'detik'),
    createDataRow('Waktu Evakuasi Terlama', results.maxTime || 0, 'detik')
  ];

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows
  });
}

function createAgentProfileTable(agentDetails) {
  // Group by profile
  const profiles = {};
  agentDetails.forEach(agent => {
    if (!profiles[agent.profile]) {
      profiles[agent.profile] = { count: 0, evacuated: 0, avgTime: 0, totalTime: 0 };
    }
    profiles[agent.profile].count++;
    if (agent.evacuated) {
      profiles[agent.profile].evacuated++;
      profiles[agent.profile].totalTime += parseFloat(agent.exitTime || 0);
    }
  });

  // Calculate averages
  Object.keys(profiles).forEach(key => {
    const p = profiles[key];
    p.avgTime = p.evacuated > 0 ? (p.totalTime / p.evacuated).toFixed(1) : '-';
    p.evacuationRate = p.count > 0 ? ((p.evacuated / p.count) * 100).toFixed(1) : 0;
  });

  const profileLabels = {
    'normal': 'Normal (Dewasa)',
    'elderly': 'Lansia',
    'child': 'Anak-anak',
    'disabled': 'Disabilitas'
  };

  const rows = [
    new TableRow({
      children: [
        createHeaderCell('Profil'),
        createHeaderCell('Jumlah'),
        createHeaderCell('Terevakuasi'),
        createHeaderCell('Tingkat Evakuasi'),
        createHeaderCell('Waktu Rata-rata')
      ]
    })
  ];

  Object.entries(profiles).forEach(([profile, data]) => {
    rows.push(
      new TableRow({
        children: [
          createCell(profileLabels[profile] || profile),
          createCell(data.count.toString()),
          createCell(data.evacuated.toString()),
          createCell(`${data.evacuationRate}%`),
          createCell(`${data.avgTime} detik`)
        ]
      })
    );
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows
  });
}

function createExitFlowTable(flowRates) {
  const rows = [
    new TableRow({
      children: [
        createHeaderCell('Exit ID'),
        createHeaderCell('Tipe'),
        createHeaderCell('Lebar (m)'),
        createHeaderCell('Total Keluar'),
        createHeaderCell('Flow Rate (p/m)'),
        createHeaderCell('Specific Flow (p/m/m)')
      ]
    })
  ];

  Object.entries(flowRates).forEach(([exitId, data]) => {
    rows.push(
      new TableRow({
        children: [
          createCell(exitId),
          createCell(data.type || 'door'),
          createCell(data.width?.toString() || '-'),
          createCell(data.total?.toString() || '0'),
          createCell(data.flowRate || '-'),
          createCell(data.specificFlow || '-')
        ]
      })
    );
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows
  });
}

function createEvacuationCurveTable(curve) {
  const rows = [
    new TableRow({
      children: [
        createHeaderCell('Waktu (detik)'),
        createHeaderCell('Terevakuasi (orang)'),
        createHeaderCell('Persentase (%)')
      ]
    })
  ];

  curve.forEach(point => {
    rows.push(
      new TableRow({
        children: [
          createCell(point.time?.toString() || '-'),
          createCell(point.evacuated?.toString() || '0'),
          createCell(`${point.percent || 0}%`)
        ]
      })
    );
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows
  });
}

function createPerformanceMetricsTable(results) {
  const rows = [
    new TableRow({
      children: [
        createHeaderCell('Metrik'),
        createHeaderCell('Nilai'),
        createHeaderCell('Standar Referensi'),
        createHeaderCell('Status')
      ]
    }),
    createMetricsRow('RSET', `${results.rsetSeconds || 0} detik`, '< 180 detik (ruang kecil) / < 600 detik (gedung)', results.rsetSeconds <= 600),
    createMetricsRow('Evacuation Rate', `${results.evacuationRate || 0}%`, '> 95%', (results.evacuationRate || 0) >= 95),
    createMetricsRow('Stranded Agents', results.stranded || 0, '0', (results.stranded || 0) === 0),
    createMetricsRow('Specific Flow Rate', 'Tergantung lebar exit', '> 60 persons/m/minute', null)
  ];

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows
  });
}

function createStandardsComparisonTable(rsetSeconds, evacuationRate, totalAgents) {
  const rows = [
    new TableRow({
      children: [
        createHeaderCell('Standar'),
        createHeaderCell('Kriteria'),
        createHeaderCell('Nilai Simulasi'),
        createHeaderCell('Status')
      ]
    }),
    createStandardsRow('NFPA 130', 'Egress time < 6 menit (kereta)', `${(rsetSeconds / 60).toFixed(1)} menit`, rsetSeconds <= 360),
    createStandardsRow('SNI 03-1736-2000', 'RSET < ASET', `RSET = ${rsetSeconds} detik`, null),
    createStandardsRow('ISO 13571', '> 90% evacuation dalam 5 menit', `${evacuationRate}%`, (evacuationRate || 0) >= 90),
    createStandardsRow('SFPE Handbook', 'Specific flow > 60 p/m/m', 'Dihitung per exit', null)
  ];

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows
  });
}

function createHeaderCell(text) {
  return new TableCell({
    children: [new Paragraph({
      text: safeText(text),
      bold: true,
      alignment: AlignmentType.CENTER
    })],
    shading: { fill: 'f3f4f6' }
  });
}

function createCell(text) {
  return new TableCell({
    children: [new Paragraph({
      text: safeText(text),
      alignment: AlignmentType.LEFT
    })]
  });
}

function createDataRow(label, value, unit = '') {
  return new TableRow({
    children: [
      createCell(label),
      createCell(`${safeText(value)} ${unit}`.trim()),
      createCell(unit)
    ]
  });
}

function createDataRow4(label, value, unit, desc) {
  return new TableRow({
    children: [
      createCell(label),
      createCell(safeText(value)),
      createCell(unit),
      createCell(desc)
    ]
  });
}

function createMetricsRow(metric, value, standard, passed) {
  const status = passed === null ? 'N/A' : passed ? 'Memenuhi' : 'Tidak Memenuhi';
  const color = passed === null ? COLOR_PRIMARY : passed ? COLOR_SUCCESS : COLOR_DANGER;
  
  return new TableRow({
    children: [
      createCell(metric),
      createCell(value),
      createCell(standard),
      new TableCell({
        children: [new Paragraph({
          text: status,
          bold: true,
          color: color,
          alignment: AlignmentType.CENTER
        })]
      })
    ]
  });
}

function createStandardsRow(standard, criteria, value, passed) {
  const status = passed === null ? 'Perlu Data' : passed ? 'Sesuai' : 'Tidak Sesuai';
  const color = passed === null ? COLOR_PRIMARY : passed ? COLOR_SUCCESS : COLOR_DANGER;
  
  return new TableRow({
    children: [
      createCell(standard),
      createCell(criteria),
      createCell(value),
      new TableCell({
        children: [new Paragraph({
          text: status,
          bold: true,
          color: color,
          alignment: AlignmentType.CENTER
        })]
      })
    ]
  });
}

function getRSETInterpretation(rsetSeconds, evacuationRate, stranded) {
  if (stranded > 0) {
    return `Teridentifikasi ${stranded} agens yang tidak berhasil terevakuasi. Hal ini menunjukkan potensi bottleneck atau hambatan pada jalur evakuasi yang perlu ditinjau ulang.`;
  }
  if (rsetSeconds <= 180) {
    return `Waktu evakuasi sangat optimal dan berada dalam standar terbaik untuk bangunan dengan kompleksitas rendah hingga sedang.`;
  } else if (rsetSeconds <= 300) {
    return `Waktu evakuasi memenuhi standar umum untuk bangunan gedung dengan multipleksitas normal.`;
  } else if (rsetSeconds <= 600) {
    return `Waktu evakuasi masih dalam batas toleransi untuk gedung besar atau kompleks, namun perlu perhatian pada optimasi jalur keluar.`;
  } else {
    return `Waktu evakuasi melebihi batas yang umumnya diterima. Direkomendasikan untuk menambah lebar exit, menambah jumlah exit, atau mengoptimasi penempatan exit.`;
  }
}

function getEvacuationConclusion(rsetSeconds, evacuationRate, stranded, buildingName) {
  const name = safeText(buildingName || 'bangunan');
  
  if (stranded > 0) {
    return `Simulasi evakuasi untuk ${name} menunjukkan terdapat ${stranded} individu yang tidak berhasil mencapai tempat aman dalam waktu simulasi. RSET sebesar ${rsetSeconds} detik dengan tingkat evakuasi ${evacuationRate}%. Perlu dilakukan kajian ulang terhadap kapasitas dan penempatan pintu keluar, serta identifikasi bottleneck pada jalur evakuasi.`;
  }
  
  if (rsetSeconds <= 300 && evacuationRate >= 95) {
    return `Simulasi evakuasi untuk ${name} menunjukkan performa yang sangat baik dengan RSET ${rsetSeconds} detik dan tingkat evakuasi ${evacuationRate}%. Bangunan memenuhi persyaratan evakuasi untuk keadaan darurat.`;
  } else if (rsetSeconds <= 600 && evacuationRate >= 90) {
    return `Simulasi evakuasi untuk ${name} menunjukkan performa yang memenuhi standar dengan RSET ${rsetSeconds} detik. Meskipun masih dalam batas yang dapat diterima, disarankan untuk mengoptimasi jalur evakuasi guna memperoleh margin keamanan yang lebih baik.`;
  } else {
    return `Simulasi evakuasi untuk ${name} menunjukkan RSET ${rsetSeconds} detik dengan tingkat evakuasi ${evacuationRate}%. Hasil ini menunjukkan perlunya perbaikan pada sistem evakuasi, baik dari segi kuantitas maupun penempatan komponen sistem evakuasi (exit, koridor, tangga).`;
  }
}

function getSafetyFactorInterpretation(sf) {
  if (sf >= 1.5) {
    return `Safety Factor ${sf.toFixed(2)} menunjukkan kondisi AMAN dengan margin keamanan yang memadai antara waktu tersedia (ASET) dan waktu yang dibutuhkan (RSET).`;
  } else if (sf >= 1.0) {
    return `Safety Factor ${sf.toFixed(2)} menunjukkan kondisi MARGINAL. Meskipun masih memenuhi persyaratan minimum (ASET > RSET), margin keamanan terbatas dan disarankan untuk melakukan optimasi.`;
  } else {
    return `Safety Factor ${sf.toFixed(2)} menunjukkan kondisi TIDAK AMAN. Waktu yang dibutuhkan untuk evakuasi melebihi waktu yang tersedia sebelum kondisi menjadi tidak tenable. Diperlukan perbaikan signifikan pada sistem evakuasi atau proteksi kebakaran.`;
  }
}

export default { renderPathfinderSection };
