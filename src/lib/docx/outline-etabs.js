/**
 * DOCX Outline for ETABS/FEMA 356 Structural Analysis Report
 * Generates sections for imported ETABS models, FEMA 356 pushover, and time history analysis
 */

import { Paragraph, TextRun, Table, TableCell, TableRow, WidthType, AlignmentType, HeadingLevel, BorderStyle } from 'docx';
import { FONT_MAIN, FONT_SIZE_BODY, FONT_SIZE_H2, FONT_SIZE_H3, COLOR_HEADING, COLOR_PRIMARY, safeText, formatTanggal } from './utils.js';

/**
 * Render ETABS/FEMA 356 Structural Analysis Section for DOCX
 */
export function renderEtabsAnalysisSection(proyek, etabsData = {}, settings = {}) {
  const children = [];
  
  // Section Heading
  children.push(
    new Paragraph({
      text: 'BAB 6 - ANALISIS STRUKTUR NUMERIK',
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { before: 400, after: 300 }
    })
  );

  // 6.1 Overview
  children.push(
    new Paragraph({
      text: '6.1 Deskripsi Model Struktur',
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 300, after: 200 }
    }),
    new Paragraph({
      spacing: { after: 200, line: 360 },
      children: [
        new TextRun({
          text: `Analisis struktur numerik dilakukan menggunakan model elemen hingga yang diimpor dari ETABS/SAP2000. Model struktur mencakup ${safeText(etabsData.nodes?.length || 0)} node dan ${safeText(etabsData.elements?.length || 0)} elemen struktural.`,
          font: FONT_MAIN,
          size: FONT_SIZE_BODY
        })
      ]
    })
  );

  // Model Properties Table
  if (etabsData.metadata) {
    children.push(
      new Paragraph({
        text: 'Tabel 6.1 - Ringkasan Model Struktur',
        alignment: AlignmentType.CENTER,
        spacing: { before: 200, after: 100 }
      }),
      createModelSummaryTable(etabsData),
      new Paragraph({
        text: `Sumber: ETABS Model (${safeText(etabsData.metadata?.source || 'Unknown')})`,
        alignment: AlignmentType.CENTER,
        spacing: { after: 300 },
        style: 'Caption'
      })
    );
  }

  // 6.2 FEMA 356 Pushover Analysis
  if (etabsData.fema356Results) {
    children.push(
      new Paragraph({
        text: '6.2 Analisis Pushover FEMA 356',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 400, after: 200 }
      }),
      new Paragraph({
        spacing: { after: 200, line: 360 },
        children: [
          new TextRun({
            text: `Analisis pushover dilakukan sesuai dengan standar FEMA 356 untuk mengevaluasi performa struktur terhadap beban gempa lateral. Analisis ini menghasilkan kurva kapasitas dan tracking pembentukan sendi plastis (hinge) pada elemen struktural.`,
            font: FONT_MAIN,
            size: FONT_SIZE_BODY
          })
        ]
      })
    );

    // Performance Level
    const perfLevel = etabsData.fema356Results.performanceLevel || 'Unknown';
    const perfDesc = getPerformanceDescription(perfLevel);
    
    children.push(
      new Paragraph({
        text: `Level Performa: ${perfLevel} - ${perfDesc}`,
        spacing: { before: 200, after: 200 },
        children: [
          new TextRun({ text: 'Level Performa: ', bold: true }),
          new TextRun({ text: `${perfLevel} - ${perfDesc}` })
        ]
      })
    );

    // Pushover Results Table
    children.push(
      new Paragraph({
        text: 'Tabel 6.2 - Hasil Analisis Pushover',
        alignment: AlignmentType.CENTER,
        spacing: { before: 200, after: 100 }
      }),
      createPushoverResultsTable(etabsData.fema356Results),
      new Paragraph({
        text: 'Sumber: FEMA 356 Pushover Analysis',
        alignment: AlignmentType.CENTER,
        spacing: { after: 300 },
        style: 'Caption'
      })
    );

    // Performance Points
    if (etabsData.fema356Results.performancePoints) {
      children.push(
        new Paragraph({
          text: 'Tabel 6.3 - Performance Points FEMA 356',
          alignment: AlignmentType.CENTER,
          spacing: { before: 200, after: 100 }
        }),
        createPerformancePointsTable(etabsData.fema356Results.performancePoints),
        new Paragraph({
          text: 'Keterangan: IO = Immediate Occupancy, LS = Life Safety, CP = Collapse Prevention',
          alignment: AlignmentType.CENTER,
          spacing: { after: 300 },
          style: 'Caption'
        })
      );
    }

    // Hinge Summary
    if (etabsData.fema356Results.hinges && etabsData.fema356Results.hinges.length > 0) {
      children.push(
        new Paragraph({
          text: '6.2.1 Ringkasan Hinge Formation',
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 300, after: 200 }
        }),
        createHingeSummaryTable(etabsData.fema356Results.hinges)
      );
    }
  }

  // 6.3 Time History Analysis
  if (etabsData.timeHistoryResults) {
    children.push(
      new Paragraph({
        text: '6.3 Analisis Time History - El Centro 1940',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 400, after: 200 }
      }),
      new Paragraph({
        spacing: { after: 200, line: 360 },
        children: [
          new TextRun({
            text: `Analisis riwayat waktu dilakukan menggunakan data gempa El Centro 1940 (Imperial Valley Earthquake, M6.95, PGA 0.313g). Integrasi numerik menggunakan metode Newmark-beta dengan damping 5%.`,
            font: FONT_MAIN,
            size: FONT_SIZE_BODY
          })
        ]
      })
    );

    // Time History Results Table
    const peaks = etabsData.timeHistoryResults.peaks || {};
    children.push(
      new Paragraph({
        text: 'Tabel 6.4 - Hasil Analisis Time History',
        alignment: AlignmentType.CENTER,
        spacing: { before: 200, after: 100 }
      }),
      createTimeHistoryResultsTable(peaks),
      new Paragraph({
        text: 'Sumber: El Centro 1940 NS Component Analysis',
        alignment: AlignmentType.CENTER,
        spacing: { after: 300 },
        style: 'Caption'
      })
    );
  }

  // 6.4 Material Properties
  if (etabsData.materials && etabsData.materials.length > 0) {
    children.push(
      new Paragraph({
        text: '6.4 Properti Material',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 400, after: 200 }
      }),
      new Paragraph({
        text: 'Tabel 6.5 - Properti Material Struktural',
        alignment: AlignmentType.CENTER,
        spacing: { before: 200, after: 100 }
      }),
      createMaterialsTable(etabsData.materials),
      new Paragraph({
        text: 'Sumber: ETABS Material Database',
        alignment: AlignmentType.CENTER,
        spacing: { after: 300 },
        style: 'Caption'
      })
    );
  }

  // 6.5 Conclusion
  children.push(
    new Paragraph({
      text: '6.5 Kesimpulan Analisis',
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 400, after: 200 }
    }),
    new Paragraph({
      spacing: { after: 200, line: 360 },
      children: [
        new TextRun({
          text: `Berdasarkan analisis struktur numerik yang telah dilakukan, struktur ${safeText(proyek.nama_bangunan)} menunjukkan performa ${safeText(etabsData.fema356Results?.performanceLevel || 'yang perlu dievaluasi lebih lanjut')}. `,
          font: FONT_MAIN,
          size: FONT_SIZE_BODY
        })
      ]
    })
  );

  return children;
}

// Helper Functions

function createModelSummaryTable(data) {
  const rows = [
    new TableRow({
      children: [
        createHeaderCell('Parameter'),
        createHeaderCell('Nilai')
      ]
    }),
    createDataRow('Jumlah Node', data.nodes?.length || 0),
    createDataRow('Jumlah Elemen', data.elements?.length || 0),
    createDataRow('Jumlah Material', data.materials?.length || 0),
    createDataRow('Jumlah Section', data.sections?.length || 0),
    createDataRow('Jumlah Story', data.metadata?.source?.stories || 0),
    createDataRow('Tanggal Import', formatTanggal(data.metadata?.source?.date))
  ];

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows
  });
}

function createPushoverResultsTable(results) {
  const rows = [
    new TableRow({
      children: [
        createHeaderCell('Parameter'),
        createHeaderCell('Nilai'),
        createHeaderCell('Satuan')
      ]
    }),
    createDataRow('Maximum Displacement', results.maxRoofDisplacement?.toFixed(3) || '-', 'm'),
    createDataRow('Maximum Base Shear', (results.maxBaseShear / 1000)?.toFixed(2) || '-', 'MN'),
    createDataRow('Ductility Ratio', results.ductility?.toFixed(2) || '-', '-'),
    createDataRow('Performance Level', results.performanceLevel || '-', '-')
  ];

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows
  });
}

function createPerformancePointsTable(points) {
  const rows = [
    new TableRow({
      children: [
        createHeaderCell('Level'),
        createHeaderCell('Deskripsi'),
        createHeaderCell('Displacement'),
        createHeaderCell('Base Shear')
      ]
    })
  ];

  points.forEach(point => {
    rows.push(
      new TableRow({
        children: [
          createCell(point.level || '-'),
          createCell(point.description || '-'),
          createCell(point.displacement ? `${point.displacement.toFixed(3)} m` : '-'),
          createCell(point.baseShear ? `${(point.baseShear / 1000).toFixed(2)} MN` : '-')
        ]
      })
    );
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows
  });
}

function createHingeSummaryTable(hinges) {
  // Group by state
  const byState = {};
  hinges.forEach(h => {
    byState[h.state] = (byState[h.state] || 0) + 1;
  });

  const rows = [
    new TableRow({
      children: [
        createHeaderCell('Hinge State'),
        createHeaderCell('Jumlah'),
        createHeaderCell('Keterangan')
      ]
    })
  ];

  const stateLabels = {
    'B': { label: 'Before IO', desc: 'Elastic' },
    'IO': { label: 'Immediate Occupancy', desc: 'Minor damage' },
    'LS': { label: 'Life Safety', desc: 'Moderate damage' },
    'CP': { label: 'Collapse Prevention', desc: 'Severe damage' },
    'E': { label: 'Beyond CP', desc: 'Near collapse' }
  };

  Object.keys(byState).forEach(state => {
    const info = stateLabels[state] || { label: state, desc: '' };
    rows.push(
      new TableRow({
        children: [
          createCell(`${state} - ${info.label}`),
          createCell(byState[state].toString()),
          createCell(info.desc)
        ]
      })
    );
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows
  });
}

function createTimeHistoryResultsTable(peaks) {
  const rows = [
    new TableRow({
      children: [
        createHeaderCell('Parameter'),
        createHeaderCell('Nilai'),
        createHeaderCell('Satuan')
      ]
    }),
    createDataRow('Maximum Displacement', peaks.maxDisplacement ? (peaks.maxDisplacement * 1000).toFixed(2) : '-', 'mm'),
    createDataRow('Maximum Velocity', peaks.maxVelocity ? peaks.maxVelocity.toFixed(3) : '-', 'm/s'),
    createDataRow('Maximum Acceleration', peaks.maxAcceleration ? peaks.maxAcceleration.toFixed(3) : '-', 'm/s²'),
    createDataRow('Maximum Base Shear', peaks.maxBaseShear ? (peaks.maxBaseShear / 1000).toFixed(2) : '-', 'MN')
  ];

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows
  });
}

function createMaterialsTable(materials) {
  const rows = [
    new TableRow({
      children: [
        createHeaderCell('Material'),
        createHeaderCell('Type'),
        createHeaderCell('E (MPa)'),
        createHeaderCell('Density (kg/m³)')
      ]
    })
  ];

  materials.slice(0, 10).forEach(mat => { // Limit to 10 rows
    rows.push(
      new TableRow({
        children: [
          createCell(mat.name || mat.id || '-'),
          createCell(mat.type || '-'),
          createCell(mat.E?.toLocaleString() || '-'),
          createCell(mat.density?.toLocaleString() || '-')
        ]
      })
    );
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows
  });
}

// Cell Helpers
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
      createCell(`${safeText(value)} ${unit}`)
    ]
  });
}

function getPerformanceDescription(level) {
  const desc = {
    'IO': 'Immediate Occupancy - Damage minor, operasional segera',
    'LS': 'Life Safety - Damage moderate, keamanan terjaga',
    'CP': 'Collapse Prevention - Damage severe, tidak runtuh',
    'E': 'Beyond Collapse Prevention - Near collapse'
  };
  return desc[level] || 'Unknown';
}

export default { renderEtabsAnalysisSection };
