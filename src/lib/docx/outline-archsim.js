/**
 * DOCX Outline for ArchSim (Architectural Simulation) Report
 * Generates sections for Pasal 218 compliance evaluation
 */

import { Paragraph, TextRun, Table, TableCell, TableRow, WidthType, AlignmentType, HeadingLevel, BorderStyle } from 'docx';
import { FONT_MAIN, FONT_SIZE_BODY, FONT_SIZE_H2, FONT_SIZE_H3, COLOR_HEADING, COLOR_PRIMARY, COLOR_SUCCESS, COLOR_DANGER, COLOR_WARNING, safeText } from './utils.js';

/**
 * Render ArchSim Pasal 218 Compliance Section for DOCX
 */
export function renderArchSimSection(proyek, archSimData = {}, settings = {}) {
  const children = [];
  
  const compliance = archSimData.compliance || {};
  const details = compliance.details || {};
  const score = compliance.score || 0;
  const status = compliance.status || 'PENDING';
  const passedCount = compliance.passedCount || 0;
  const failedCount = compliance.failedCount || 0;
  
  // Section Heading
  children.push(
    new Paragraph({
      text: 'EVALUASI KEPATUHAN PASAL 218 PERMEN PUPR 6/2023',
      heading: HeadingLevel.HEADING_2,
      alignment: AlignmentType.LEFT,
      spacing: { before: 400, after: 300 }
    })
  );

  // Overview
  children.push(
    new Paragraph({
      text: '7.1 Deskripsi Evaluasi Arsitektur',
      heading: HeadingLevel.HEADING_3,
      spacing: { before: 300, after: 200 }
    }),
    new Paragraph({
      spacing: { after: 200, line: 360 },
      children: [
        new TextRun({
          text: `Evaluasi kepatuhan arsitektur dilakukan berdasarkan Pasal 218 Peraturan Menteri Pekerjaan Umum dan Perumahan Rakyat Nomor 6 Tahun 2023 tentang Standar Bangunan Gedung Hijau. Evaluasi ini mencakup aspek tata bangunan, efisiensi lantai, penutup bangunan, dan aspek keserasian lingkungan.`,
          font: FONT_MAIN,
          size: FONT_SIZE_BODY
        })
      ]
    })
  );

  // Compliance Summary Table
  children.push(
    new Paragraph({
      text: 'Tabel 7.1 - Ringkasan Hasil Evaluasi Pasal 218',
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 100 }
    }),
    createComplianceSummaryTable(compliance),
    new Paragraph({
      text: `Sumber: ArchSim Pro Analysis (${safeText(proyek.nama_bangunan)})`,
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
      style: 'Caption'
    })
  );

  // Overall Status
  const statusLabel = getStatusLabel(status);
  const statusColor = status === 'COMPLIANT' ? COLOR_SUCCESS : status === 'PARTIAL_COMPLIANT' ? COLOR_WARNING : COLOR_DANGER;
  
  children.push(
    new Paragraph({
      spacing: { before: 200, after: 200 },
      children: [
        new TextRun({ text: 'Status Keputusan: ', bold: true, font: FONT_MAIN, size: FONT_SIZE_BODY }),
        new TextRun({ text: statusLabel, bold: true, color: statusColor, font: FONT_MAIN, size: FONT_SIZE_BODY })
      ]
    }),
    new Paragraph({
      spacing: { after: 200, line: 360 },
      children: [
        new TextRun({
          text: `Berdasarkan hasil evaluasi terhadap ${passedCount + failedCount} kriteria Pasal 218, bangunan ${safeText(proyek.nama_bangunan)} mencapai tingkat kepatuhan ${score.toFixed(1)}% dengan ${passedCount} kriteria memenuhi standar dan ${failedCount} kriteria tidak memenuhi standar.`,
          font: FONT_MAIN,
          size: FONT_SIZE_BODY
        })
      ]
    })
  );

  // Detailed Categories
  if (Object.keys(details).length > 0) {
    children.push(
      new Paragraph({
        text: '7.2 Detail Evaluasi per Aspek',
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 400, after: 200 }
      })
    );

    Object.entries(details).forEach(([category, data], index) => {
      const catScore = data.maxScore > 0 ? ((data.score / data.maxScore) * 100).toFixed(1) : 0;
      const catStatus = catScore >= 70 ? 'Memenuhi' : catScore >= 50 ? 'Sebagian Memenuhi' : 'Tidak Memenuhi';
      
      children.push(
        new Paragraph({
          text: `7.2.${index + 1} ${data.title || category}`,
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 300, after: 150 }
        }),
        new Paragraph({
          spacing: { after: 150 },
          children: [
            new TextRun({ text: `Skor: ${catScore}% (${catStatus})`, bold: true, font: FONT_MAIN, size: FONT_SIZE_BODY })
          ]
        })
      );

      // Items table for this category
      if (data.items && Object.keys(data.items).length > 0) {
        children.push(
          new Paragraph({
            text: `Tabel 7.${index + 2} - Detail Kriteria ${data.title || category}`,
            alignment: AlignmentType.CENTER,
            spacing: { before: 150, after: 100 }
          }),
          createCategoryItemsTable(data.items),
          new Paragraph({
            spacing: { after: 300 },
            style: 'Caption'
          })
        );
      }
    });
  }

  // Project Parameters
  if (archSimData.projectData) {
    children.push(
      new Paragraph({
        text: '7.3 Parameter Bangunan',
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 400, after: 200 }
      }),
      new Paragraph({
        text: 'Tabel 7.99 - Parameter Arsitektur Bangunan',
        alignment: AlignmentType.CENTER,
        spacing: { before: 200, after: 100 }
      }),
      createProjectParametersTable(archSimData.projectData),
      new Paragraph({
        spacing: { after: 300 },
        style: 'Caption'
      })
    );
  }

  // Conclusion
  children.push(
    new Paragraph({
      text: '7.4 Kesimpulan Evaluasi',
      heading: HeadingLevel.HEADING_3,
      spacing: { before: 400, after: 200 }
    }),
    new Paragraph({
      spacing: { after: 200, line: 360 },
      children: [
        new TextRun({
          text: getConclusionText(status, score, proyek.nama_bangunan),
          font: FONT_MAIN,
          size: FONT_SIZE_BODY
        })
      ]
    })
  );

  // Recommendations
  if (failedCount > 0) {
    children.push(
      new Paragraph({
        text: '7.5 Rekomendasi Perbaikan',
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 300, after: 200 }
      })
    );

    Object.entries(details).forEach(([category, data]) => {
      if (data.items) {
        Object.entries(data.items).forEach(([itemId, item]) => {
          if (!item.passed) {
            children.push(
              new Paragraph({
                spacing: { after: 100, line: 360 },
                children: [
                  new TextRun({ text: `• ${item.label}: `, bold: true, font: FONT_MAIN, size: FONT_SIZE_BODY }),
                  new TextRun({ text: item.recommendation || 'Perlu ditinjau ulang sesuai standar Pasal 218.', font: FONT_MAIN, size: FONT_SIZE_BODY })
                ]
              })
            );
          }
        });
      }
    });
  }

  return children;
}

// Helper Functions

function createComplianceSummaryTable(compliance) {
  const rows = [
    new TableRow({
      children: [
        createHeaderCell('Parameter'),
        createHeaderCell('Nilai')
      ]
    }),
    createDataRow('Status Keputusan', getStatusLabel(compliance.status)),
    createDataRow('Tingkat Kepatuhan', `${(compliance.score || 0).toFixed(1)}%`),
    createDataRow('Kriteria Lulus', compliance.passedCount || 0),
    createDataRow('Kriteria Gagal', compliance.failedCount || 0),
    createDataRow('Total Kriteria', (compliance.passedCount || 0) + (compliance.failedCount || 0))
  ];

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows
  });
}

function createCategoryItemsTable(items) {
  const rows = [
    new TableRow({
      children: [
        createHeaderCell('No.'),
        createHeaderCell('Kriteria'),
        createHeaderCell('Status'),
        createHeaderCell('Keterangan')
      ]
    })
  ];

  let index = 1;
  Object.entries(items).forEach(([itemId, item]) => {
    rows.push(
      new TableRow({
        children: [
          createCell(index.toString()),
          createCell(item.label || itemId),
          createCell(item.passed ? '✓ Sesuai' : '✗ Tidak Sesuai'),
          createCell(item.notes || '-')
        ]
      })
    );
    index++;
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows
  });
}

function createProjectParametersTable(data) {
  const params = [
    ['Bentuk Bangunan', data.shape || '-'],
    ['Efisiensi Lantai', data.floorEfficiency ? `${(data.floorEfficiency * 100).toFixed(0)}%` : '-'],
    ['Rasio Fasad', data.facadeRatio ? `${(data.facadeRatio * 100).toFixed(0)}%` : '-'],
    ['Tipe Atap', data.roofType || '-'],
    ['Jumlah Ruang Utama', data.mainRooms || '-'],
    ['Tinggi Dinding', data.wallHeight ? `${data.wallHeight} m` : '-'],
    ['Tinggi Plafon', data.ceilingHeight ? `${data.ceilingHeight} m` : '-'],
    ['Rasio Bukaan', data.openingRatio ? `${(data.openingRatio * 100).toFixed(0)}%` : '-'],
    ['Rasio Ruang Terbuka', data.openSpaceRatio ? `${(data.openSpaceRatio * 100).toFixed(0)}%` : '-'],
    ['Rasio Area Hijau', data.greenAreaRatio ? `${(data.greenAreaRatio * 100).toFixed(0)}%` : '-'],
    ['Lebar Sirkulasi', data.circulationWidth ? `${data.circulationWidth} m` : '-'],
    ['Lebar Trotoar', data.pedestrianWidth ? `${data.pedestrianWidth} m` : '-'],
    ['Setback', data.setback ? `${data.setback} m` : '-']
  ];

  const rows = [
    new TableRow({
      children: [
        createHeaderCell('Parameter'),
        createHeaderCell('Nilai')
      ]
    })
  ];

  params.forEach(([label, value]) => {
    rows.push(createDataRow(label, value));
  });

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

function createDataRow(label, value) {
  return new TableRow({
    children: [
      createCell(label),
      createCell(safeText(value))
    ]
  });
}

function getStatusLabel(status) {
  const labels = {
    'COMPLIANT': 'Sesuai Pasal 218',
    'PARTIAL_COMPLIANT': 'Sebagian Sesuai',
    'NON_COMPLIANT': 'Tidak Sesuai',
    'PENDING': 'Evaluasi Belum Dilakukan'
  };
  return labels[status] || status || '-';
}

function getConclusionText(status, score, buildingName) {
  const name = safeText(buildingName || 'bangunan');
  
  if (status === 'COMPLIANT') {
    return `Berdasarkan evaluasi komprehensif terhadap ${name}, bangunan mencapai kepatuhan penuh terhadap standar Pasal 218 Permen PUPR 6/2023 dengan tingkat kepatuhan ${score.toFixed(1)}%. Seluruh aspek tata bangunan, efisiensi ruang, dan keserasian lingkungan telah memenuhi persyaratan yang ditetapkan.`;
  } else if (status === 'PARTIAL_COMPLIANT') {
    return `Evaluasi terhadap ${name} menunjukkan kepatuhan sebagian terhadap standar Pasal 218 Permen PUPR 6/2023 dengan tingkat kepatuhan ${score.toFixed(1)}%. Terdapat beberapa aspek yang memerlukan perhatian khusus dan perbaikan untuk mencapai kepatuhan penuh.`;
  } else if (status === 'NON_COMPLIANT') {
    return `Hasil evaluasi ${name} menunjukkan tingkat kepatuhan ${score.toFixed(1)}% terhadap standar Pasal 218 Permen PUPR 6/2023, yang berada di bawah ambang batas yang disyaratkan. Diperlukan perbaikan menyeluruh pada beberapa aspek arsitektur dan perencanaan bangunan.`;
  }
  return `Evaluasi kepatuhan ${name} terhadap Pasal 218 belum dapat ditentukan. Silakan lakukan evaluasi lengkap melalui modul ArchSim.`;
}

export default { renderArchSimSection };
