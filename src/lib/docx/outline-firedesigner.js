/**
 * DOCX Outline for FireDesigner Fire Simulation Report
 * Generates sections for ASET (Available Safe Egress Time) analysis
 */

import { Paragraph, TextRun, Table, TableCell, TableRow, WidthType, AlignmentType, HeadingLevel, BorderStyle } from 'docx';
import { FONT_MAIN, FONT_SIZE_BODY, FONT_SIZE_H2, FONT_SIZE_H3, COLOR_HEADING, COLOR_PRIMARY, COLOR_SUCCESS, COLOR_DANGER, COLOR_WARNING, safeText } from './utils.js';

/**
 * Render FireDesigner Fire Simulation Section for DOCX
 */
export function renderFireDesignerSection(proyek, fireData = {}, settings = {}) {
  const children = [];
  
  const results = fireData.results || fireData || {};
  const aset = results.ASET || 0;
  const maxTemp = results.maxTemperature ? (results.maxTemperature - 273).toFixed(0) : 0;
  const minVis = results.minVisibility || 0;
  const maxCO = results.maxCO || 0;
  const smokeLayerHeight = results.smokeLayerHeight || 0;
  const fireConfig = fireData.fireConfig || {};
  const upperLayer = results.upperLayer || {};
  const lowerLayer = results.lowerLayer || {};
  
  // Section Heading
  children.push(
    new Paragraph({
      text: 'ANALISIS SIMULASI KEBAKARAN - FIRE DESIGNER',
      heading: HeadingLevel.HEADING_2,
      alignment: AlignmentType.LEFT,
      spacing: { before: 400, after: 300 }
    })
  );

  // Overview
  children.push(
    new Paragraph({
      text: '9.1 Deskripsi Simulasi Kebakaran',
      heading: HeadingLevel.HEADING_3,
      spacing: { before: 300, after: 200 }
    }),
    new Paragraph({
      spacing: { after: 200, line: 360 },
      children: [
        new TextRun({
          text: `Analisis simulasi kebakaran dilakukan menggunakan Zone Model berbasis persamaan konservasi massa dan energi. Simulasi ini menghitung ASET (Available Safe Egress Time) sebagai waktu yang tersedia bagi penghuni untuk mencapai tempat aman sebelum kondisi ruangan menjadi tidak tenable (tidak dapat dihuni).`,
          font: FONT_MAIN,
          size: FONT_SIZE_BODY
        })
      ]
    })
  );

  // Fire Scenario Configuration
  children.push(
    new Paragraph({
      text: '9.2 Skenario Kebakaran',
      heading: HeadingLevel.HEADING_3,
      spacing: { before: 400, after: 200 }
    }),
    new Paragraph({
      text: 'Tabel 9.1 - Konfigurasi Sumber Api',
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 100 }
    }),
    createFireConfigTable(fireConfig),
    new Paragraph({
      spacing: { after: 300 },
      style: 'Caption'
    })
  );

  // ASET Results
  const asetStatus = aset >= 300 ? 'Aman' : aset >= 180 ? 'Perlu Perhatian' : aset >= 60 ? 'Kritis' : 'Berbahaya';
  const asetColor = aset >= 300 ? COLOR_SUCCESS : aset >= 180 ? COLOR_WARNING : COLOR_DANGER;
  
  children.push(
    new Paragraph({
      text: '9.3 Hasil Analisis ASET',
      heading: HeadingLevel.HEADING_3,
      spacing: { before: 400, after: 200 }
    }),
    new Paragraph({
      text: 'Tabel 9.2 - Ringkasan Hasil Simulasi Kebakaran',
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 100 }
    }),
    createASETSummaryTable(results),
    new Paragraph({
      spacing: { after: 200 },
      style: 'Caption'
    }),
    new Paragraph({
      spacing: { before: 200, after: 200 },
      children: [
        new TextRun({ text: 'ASET (Available Safe Egress Time): ', bold: true, font: FONT_MAIN, size: FONT_SIZE_BODY }),
        new TextRun({ text: `${aset.toFixed(0)} detik (${(aset / 60).toFixed(1)} menit)`, bold: true, color: asetColor, font: FONT_MAIN, size: FONT_SIZE_BODY }),
        new TextRun({ text: ` - ${asetStatus}`, bold: true, color: asetColor, font: FONT_MAIN, size: FONT_SIZE_BODY })
      ]
    }),
    new Paragraph({
      spacing: { after: 200, line: 360 },
      children: [
        new TextRun({
          text: getASETInterpretation(aset, proyek.nama_bangunan),
          font: FONT_MAIN,
          size: FONT_SIZE_BODY
        })
      ]
    })
  );

  // Layer Analysis
  children.push(
    new Paragraph({
      text: '9.4 Analisis Lapisan Asap',
      heading: HeadingLevel.HEADING_3,
      spacing: { before: 400, after: 200 }
    }),
    new Paragraph({
      text: 'Tabel 9.3 - Kondisi Lapisan Atas (Upper Layer) saat ASET',
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 100 }
    }),
    createUpperLayerTable(upperLayer, aset),
    new Paragraph({
      spacing: { after: 300 },
      style: 'Caption'
    })
  );

  // Tenability Criteria Check
  children.push(
    new Paragraph({
      text: '9.5 Evaluasi Kriteria Ketidaktenablean',
      heading: HeadingLevel.HEADING_3,
      spacing: { before: 400, after: 200 }
    }),
    new Paragraph({
      text: 'Tabel 9.4 - Evaluasi terhadap Kriteria SNI 03-1736-2000',
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 100 }
    }),
    createTenabilityCriteriaTable(results),
    new Paragraph({
      spacing: { after: 300 },
      style: 'Caption'
    })
  );

  // Fire Growth Curve Data
  if (results.fireGrowthCurve && results.fireGrowthCurve.length > 0) {
    children.push(
      new Paragraph({
        text: '9.6 Kurva Pertumbuhan Api',
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 400, after: 200 }
      }),
      new Paragraph({
        text: 'Tabel 9.5 - Data Pertumbuhan Heat Release Rate (HRR)',
        alignment: AlignmentType.CENTER,
        spacing: { before: 200, after: 100 }
      }),
      createFireGrowthTable(results.fireGrowthCurve.slice(0, 20)), // First 20 points
      new Paragraph({
        spacing: { after: 300 },
        style: 'Caption'
      })
    );
  }

  // Room Parameters
  if (results.room) {
    children.push(
      new Paragraph({
        text: '9.7 Parameter Ruangan',
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 400, after: 200 }
      }),
      new Paragraph({
        text: 'Tabel 9.6 - Geometri dan Properti Ruangan',
        alignment: AlignmentType.CENTER,
        spacing: { before: 200, after: 100 }
      }),
      createRoomParametersTable(results.room),
      new Paragraph({
        spacing: { after: 300 },
        style: 'Caption'
      })
    );
  }

  // Comparison with Standards
  children.push(
    new Paragraph({
      text: '9.8 Perbandingan dengan Standar',
      heading: HeadingLevel.HEADING_3,
      spacing: { before: 400, after: 200 }
    }),
    new Paragraph({
      text: 'Tabel 9.7 - Evaluasi terhadap Standar Internasional',
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 100 }
    }),
    createStandardsComparisonTable(aset, maxTemp, minVis),
    new Paragraph({
      spacing: { after: 300 },
      style: 'Caption'
    })
  );

  // Conclusion
  children.push(
    new Paragraph({
      text: '9.9 Kesimpulan dan Rekomendasi',
      heading: HeadingLevel.HEADING_3,
      spacing: { before: 400, after: 200 }
    }),
    new Paragraph({
      spacing: { after: 200, line: 360 },
      children: [
        new TextRun({
          text: getFireConclusion(aset, maxTemp, minVis, proyek.nama_bangunan),
          font: FONT_MAIN,
          size: FONT_SIZE_BODY
        })
      ]
    })
  );

  // Safety Factor Integration (if RSET available)
  if (fireData.integratedRSET) {
    const rset = fireData.integratedRSET;
    const sf = aset / rset;
    const sfStatus = sf >= 1.5 ? 'Aman' : sf >= 1.0 ? 'Marginal' : 'Tidak Aman';
    const sfColor = sf >= 1.5 ? COLOR_SUCCESS : sf >= 1.0 ? COLOR_WARNING : COLOR_DANGER;
    
    children.push(
      new Paragraph({
        text: '9.10 Analisis ASET-RSET Integration',
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
          new TextRun({ text: `${rset.toFixed(0)} detik`, font: FONT_MAIN, size: FONT_SIZE_BODY })
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
            text: getSafetyFactorInterpretation(sf, aset, rset),
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

function createFireConfigTable(config) {
  const growthRates = {
    'slow': 'Slow (α=0.00293 kW/s²)',
    'medium': 'Medium (α=0.01172 kW/s²)',
    'fast': 'Fast (α=0.0469 kW/s²)',
    'ultra': 'Ultra-fast (α=0.1876 kW/s²)'
  };

  const fuelTypes = {
    'wood': 'Kayu (Wood) - HC=17 MJ/kg',
    'plastic': 'Plastik (PU/PVC) - HC=30 MJ/kg',
    'liquid': 'Cairan Mudah Terbakar - HC=44 MJ/kg',
    'cellulose': 'Kertas/Karton - HC=16 MJ/kg'
  };

  const rows = [
    new TableRow({
      children: [
        createHeaderCell('Parameter'),
        createHeaderCell('Nilai')
      ]
    }),
    createDataRow('Profil Pertumbuhan Api', growthRates[config.type] || config.type || 'Medium'),
    createDataRow('Heat Release Rate Maksimum', config.maxHRR ? `${config.maxHRR} kW` : '5000 kW'),
    createDataRow('Luas Area Api', config.area ? `${config.area} m²` : '2 m²'),
    createDataRow('Tipe Bahan Bakar', fuelTypes[config.fuel] || config.fuel || 'Kayu'),
    createDataRow('Lokasi Api', config.location ? `(${config.location.x?.toFixed(1) || 0}, ${config.location.y?.toFixed(1) || 0}, ${config.location.z?.toFixed(1) || 0})` : 'Pusat ruangan')
  ];

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows
  });
}

function createASETSummaryTable(results) {
  const aset = results.ASET || 0;
  const maxTemp = results.maxTemperature ? (results.maxTemperature - 273).toFixed(0) : 0;
  const minVis = results.minVisibility || 0;
  const maxCO = results.maxCO || 0;
  const maxCO2 = results.maxCO2 || 0;
  const minO2 = results.minO2 || 0;
  
  const rows = [
    new TableRow({
      children: [
        createHeaderCell('Parameter'),
        createHeaderCell('Nilai'),
        createHeaderCell('Satuan'),
        createHeaderCell('Keterangan')
      ]
    }),
    createDataRow4('ASET', aset.toFixed(0), 'detik', 'Waktu tersedia sebelum tidak tenable'),
    createDataRow4('ASET', (aset / 60).toFixed(1), 'menit', '-'),
    createDataRow4('Suhu Lapisan Atas (Max)', maxTemp, '°C', 'Kriteria: < 60°C'),
    createDataRow4('Visibilitas (Min)', minVis.toFixed(1), 'm', 'Kriteria: > 10m (koridor) / 5m (ruang)'),
    createDataRow4('Konsentrasi CO (Max)', maxCO.toFixed(0), 'ppm', 'Kriteria: < 1000 ppm'),
    createDataRow4('Konsentrasi CO₂ (Max)', maxCO2 ? maxCO2.toFixed(0) : '-', 'ppm', '-'),
    createDataRow4('Konsentrasi O₂ (Min)', minO2 ? minO2.toFixed(1) : '-', '%', 'Kriteria: > 15%'),
    createDataRow4('Tinggi Lapisan Asap', results.smokeLayerHeight ? results.smokeLayerHeight.toFixed(2) : '-', 'm', 'Di atas lantai')
  ];

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows
  });
}

function createUpperLayerTable(upperLayer, aset) {
  const rows = [
    new TableRow({
      children: [
        createHeaderCell('Parameter'),
        createHeaderCell('Nilai'),
        createHeaderCell('Satuan')
      ]
    }),
    createDataRow('Temperatur', upperLayer.temperature ? (upperLayer.temperature - 273).toFixed(0) : '-', '°C'),
    createDataRow('Kelembaban', upperLayer.humidity ? `${(upperLayer.humidity * 100).toFixed(0)}` : '-', '%'),
    createDataRow('Kepadatan Asap', upperLayer.smokeDensity ? upperLayer.smokeDensity.toFixed(2) : '-', 'mg/m³'),
    createDataRow('Tinggi Lapisan', upperLayer.height ? upperLayer.height.toFixed(2) : '-', 'm'),
    createDataRow('Volume', upperLayer.volume ? upperLayer.volume.toFixed(1) : '-', 'm³'),
    createDataRow('Massa Asap', upperLayer.mass ? upperLayer.mass.toFixed(1) : '-', 'kg')
  ];

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows
  });
}

function createTenabilityCriteriaTable(results) {
  const maxTemp = results.maxTemperature ? (results.maxTemperature - 273).toFixed(0) : 0;
  const minVis = results.minVisibility || 0;
  const maxCO = results.maxCO || 0;
  const minO2 = results.minO2 || 0;
  const smokeHeight = results.smokeLayerHeight || 0;
  
  const criteria = [
    { name: 'Suhu Konvektif', value: maxTemp, unit: '°C', limit: 60, operator: '<', passed: maxTemp < 60 },
    { name: 'Visibilitas (Koridor)', value: minVis, unit: 'm', limit: 10, operator: '>', passed: minVis >= 10 },
    { name: 'Visibilitas (Ruang)', value: minVis, unit: 'm', limit: 5, operator: '>', passed: minVis >= 5 },
    { name: 'Konsentrasi CO', value: maxCO, unit: 'ppm', limit: 1000, operator: '<', passed: maxCO < 1000 },
    { name: 'Konsentrasi O₂', value: minO2 || 21, unit: '%', limit: 15, operator: '>', passed: (minO2 || 21) > 15 },
    { name: 'Tinggi Lapisan Asap', value: smokeHeight, unit: 'm', limit: 1.6, operator: '>', passed: smokeHeight > 1.6 }
  ];

  const rows = [
    new TableRow({
      children: [
        createHeaderCell('Kriteria'),
        createHeaderCell('Nilai'),
        createHeaderCell('Batas'),
        createHeaderCell('Status')
      ]
    })
  ];

  criteria.forEach(c => {
    const status = c.passed ? 'Memenuhi' : 'Tidak Memenuhi';
    const color = c.passed ? COLOR_SUCCESS : COLOR_DANGER;
    
    rows.push(
      new TableRow({
        children: [
          createCell(c.name),
          createCell(`${c.value} ${c.unit}`),
          createCell(`${c.operator} ${c.limit} ${c.unit}`),
          new TableCell({
            children: [new Paragraph({
              text: status,
              bold: true,
              color: color,
              alignment: AlignmentType.CENTER
            })]
          })
        ]
      })
    );
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows
  });
}

function createFireGrowthTable(curveData) {
  const rows = [
    new TableRow({
      children: [
        createHeaderCell('Waktu (s)'),
        createHeaderCell('HRR (kW)'),
        createHeaderCell('Suhu (°C)'),
        createHeaderCell('Tinggi Lapisan (m)')
      ]
    })
  ];

  curveData.forEach(point => {
    rows.push(
      new TableRow({
        children: [
          createCell(point.time?.toString() || '-'),
          createCell(point.hrr ? point.hrr.toFixed(0) : '-'),
          createCell(point.temperature ? (point.temperature - 273).toFixed(0) : '-'),
          createCell(point.layerHeight ? point.layerHeight.toFixed(2) : '-')
        ]
      })
    );
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows
  });
}

function createRoomParametersTable(room) {
  const rows = [
    new TableRow({
      children: [
        createHeaderCell('Parameter'),
        createHeaderCell('Nilai'),
        createHeaderCell('Satuan')
      ]
    }),
    createDataRow('Panjang', room.length ? room.length.toFixed(2) : '-', 'm'),
    createDataRow('Lebar', room.width ? room.width.toFixed(2) : '-', 'm'),
    createDataRow('Tinggi', room.height ? room.height.toFixed(2) : '-', 'm'),
    createDataRow('Luas Lantai', room.floorArea ? room.floorArea.toFixed(2) : '-', 'm²'),
    createDataRow('Volume', room.volume ? room.volume.toFixed(2) : '-', 'm³'),
    createDataRow('Koefisien Ventilasi', room.ventilationCoeff ? room.ventilationCoeff.toFixed(4) : '-', '-')
  ];

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows
  });
}

function createStandardsComparisonTable(aset, maxTemp, minVis) {
  const rows = [
    new TableRow({
      children: [
        createHeaderCell('Standar'),
        createHeaderCell('Kriteria'),
        createHeaderCell('Nilai Simulasi'),
        createHeaderCell('Status')
      ]
    }),
    createStandardsRow('SNI 03-1736-2000', 'ASET > RSET (umum > 180s)', `${aset.toFixed(0)} detik`, aset >= 180),
    createStandardsRow('ISO 13571', 'ASET > 5 menit (300s)', `${(aset / 60).toFixed(1)} menit`, aset >= 300),
    createStandardsRow('SFPE Handbook', 'Suhu < 60°C untuk tenability', `${maxTemp}°C`, maxTemp < 60),
    createStandardsRow('ISO 13571', 'Visibilitas > 10m (koridor)', `${minVis.toFixed(1)}m`, minVis >= 10),
    createStandardsRow('NFPA 130', 'ASET/RSET > 1.0', 'Dihitung dengan RSET', null)
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
      createCell(`${safeText(value)} ${unit}`.trim())
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

function getASETInterpretation(aset, buildingName) {
  const name = safeText(buildingName || 'bangunan');
  
  if (aset >= 600) {
    return `ASET sebesar ${aset.toFixed(0)} detik (${(aset / 60).toFixed(1)} menit) untuk ${name} menunjukkan waktu tersedia yang sangat baik. Waktu ini memberikan margin keamanan yang memadai bagi seluruh penghuni untuk mencapai tempat aman sebelum kondisi menjadi tidak tenable.`;
  } else if (aset >= 300) {
    return `ASET sebesar ${aset.toFixed(0)} detik (${(aset / 60).toFixed(1)} menit) untuk ${name} menunjukkan waktu tersedia yang memenuhi standar umum. Waktu ini umumnya memadai untuk evakuasi bangunan dengan kompleksitas normal.`;
  } else if (aset >= 180) {
    return `ASET sebesar ${aset.toFixed(0)} detik (${(aset / 60).toFixed(1)} menit) untuk ${name} berada pada ambang batas minimum. Disarankan untuk meninjau kembali sistem proteksi kebakaran atau pertimbangkan penambahan sistem smoke management.`;
  } else {
    return `ASET sebesar ${aset.toFixed(0)} detik untuk ${name} berada di bawah ambang batas yang umumnya diterima. Hal ini mengindikasikan bahwa kondisi ruangan menjadi tidak tenable dalam waktu yang relatif singkat. Diperlukan perbaikan signifikan pada sistem proteksi kebakaran, penambahan sistem smoke exhaust, atau perbaikan pada kompartemenasi.`;
  }
}

function getFireConclusion(aset, maxTemp, minVis, buildingName) {
  const name = safeText(buildingName || 'bangunan');
  
  if (aset >= 300 && maxTemp < 60 && minVis >= 10) {
    return `Simulasi kebakaran untuk ${name} menunjukkan kondisi yang sangat baik dengan ASET ${aset.toFixed(0)} detik, suhu maksimum ${maxTemp}°C, dan visibilitas minimum ${minVis.toFixed(1)}m. Bangunan memiliki margin keamanan yang memadai terhadap potensi kebakaran dengan skenario yang dievaluasi.`;
  } else if (aset >= 180 && maxTemp < 80 && minVis >= 5) {
    return `Simulasi kebakaran untuk ${name} menunjukkan kondisi yang memenuhi standar minimum dengan ASET ${aset.toFixed(0)} detik. Meskipun masih dalam batas yang dapat diterima, disarankan untuk mengoptimasi sistem proteksi kebakaran guna memperoleh margin keamanan yang lebih baik.`;
  } else {
    return `Simulasi kebakaran untuk ${name} menunjukkan ASET ${aset.toFixed(0)} detik dengan suhu ${maxTemp}°C dan visibilitas ${minVis.toFixed(1)}m. Hasil ini menunjukkan perlunya perbaikan pada sistem proteksi kebakaran, termasuk pertimbangan penambahan sistem smoke management, peningkatan ventilasi, atau perbaikan kompartemenasi.`;
  }
}

function getSafetyFactorInterpretation(sf, aset, rset) {
  if (sf >= 1.5) {
    return `Safety Factor ${sf.toFixed(2)} menunjukkan kondisi AMAN. Waktu tersedia (${aset.toFixed(0)} detik) melebihi waktu yang dibutuhkan (${rset.toFixed(0)} detik) dengan margin keamanan 50% atau lebih, sesuai dengan rekomendasi praktik terbaik.`;
  } else if (sf >= 1.0) {
    return `Safety Factor ${sf.toFixed(2)} menunjukkan kondisi MARGINAL. Meskipun ASET (${aset.toFixed(0)} detik) masih lebih besar dari RSET (${rset.toFixed(0)} detik), margin keamanan terbatas. Disarankan untuk melakukan optimasi pada sistem evakuasi atau proteksi kebakaran.`;
  } else {
    return `Safety Factor ${sf.toFixed(2)} menunjukkan kondisi TIDAK AMAN. Waktu yang dibutuhkan untuk evakuasi (${rset.toFixed(0)} detik) melebihi waktu yang tersedia sebelum kondisi tidak tenable (${aset.toFixed(0)} detik). Diperlukan perbaikan signifikan pada sistem evakuasi dan/atau proteksi kebakaran.`;
  }
}

export default { renderFireDesignerSection };
