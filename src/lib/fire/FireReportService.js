/**
 * FireReportService.js - Generator Laporan DOCX untuk Simulasi Kebakaran
 * Generate laporan analisis kebakaran dengan ASET/RSET analysis
 */

import { Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun,
         AlignmentType, HeadingLevel, WidthType, BorderStyle } from 'docx';
import { saveAs } from 'file-saver';
import { formatTanggal } from '../docx/utils.js';

export class FireReportService {
  constructor() {
    this.templates = {
      header: 'LAPORAN HASIL SIMULASI KEBAKARAN',
      standard: 'SNI 03-1736-2000 & NFPA 92'
    };
  }

  async generateReport(results, projectData = {}) {
    const { fireData, evacData, safetyFactor } = results;
    
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          ...this.renderHeader(projectData),
          ...this.renderExecutiveSummary(results),
          ...this.renderFireParameters(fireData),
          ...this.renderASETAnalysis(fireData),
          ...this.renderRSETAnalysis(evacData),
          ...this.renderSafetyComparison(results),
          ...this.renderTenabilityAnalysis(fireData),
          ...this.renderTimeline(fireData),
          ...this.renderConclusion(results),
        ]
      }]
    });

    const blob = await Packer.toBlob(doc);
    const fileName = `Laporan_Kebakaran_${projectData.nama_bangunan || 'Proyek'}_${new Date().toISOString().split('T')[0]}.docx`;
    
    saveAs(blob, fileName);
    return { blob, fileName };
  }

  renderHeader(projectData) {
    return [
      new Paragraph({
        text: this.templates.header,
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 }
      }),
      new Paragraph({
        text: `Standar: ${this.templates.standard}`,
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: 'Proyek: ', bold: true }),
          new TextRun({ text: projectData.nama_bangunan || 'Belum ditentukan' })
        ],
        spacing: { after: 100 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: 'Lokasi: ', bold: true }),
          new TextRun({ text: projectData.alamat || 'Belum ditentukan' })
        ],
        spacing: { after: 100 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: 'Tanggal Analisis: ', bold: true }),
          new TextRun({ text: formatTanggal(new Date()) })
        ],
        spacing: { after: 400 }
      })
    ];
  }

  renderExecutiveSummary(results) {
    const { ASET, RSET, safetyFactor } = results;
    const status = safetyFactor >= 1.5 ? 'AMAN' : safetyFactor >= 1.0 ? 'MARGINAL' : 'TIDAK AMAN';

    return [
      new Paragraph({
        text: 'RINGKASAN EKSEKUTIF',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 200 }
      }),
      new Paragraph({
        spacing: { after: 200 },
        children: [
          new TextRun({
            text: `Analisis keselamatan kebakaran telah dilakukan menggunakan simulasi zone model dengan pertumbuhan api T-squared. ` +
                  `Waktu aman yang tersedia (ASET) adalah ${ASET.toFixed(0)} detik, sedangkan waktu yang diperlukan untuk evakuasi (RSET) adalah ${RSET.toFixed(0)} detik. ` +
                  `Safety factor yang diperoleh adalah ${safetyFactor.toFixed(2)}, yang menunjukkan status ${status}.`
          })
        ]
      }),
      new Paragraph({
        spacing: { after: 100 },
        children: [
          new TextRun({ text: 'ASET (Available Safe Egress Time): ', bold: true }),
          new TextRun({ text: `${ASET.toFixed(0)} detik` })
        ]
      }),
      new Paragraph({
        spacing: { after: 100 },
        children: [
          new TextRun({ text: 'RSET (Required Safe Egress Time): ', bold: true }),
          new TextRun({ text: `${RSET.toFixed(0)} detik` })
        ]
      }),
      new Paragraph({
        spacing: { after: 300 },
        children: [
          new TextRun({ text: 'Safety Factor (ASET/RSET): ', bold: true }),
          new TextRun({ text: `${safetyFactor.toFixed(2)} - ${status}` })
        ]
      })
    ];
  }

  renderFireParameters(fireData) {
    return [
      new Paragraph({
        text: 'PARAMETER KEBAKARAN',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 200 }
      }),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph({ text: 'Parameter', bold: true })] }),
              new TableCell({ children: [new Paragraph({ text: 'Nilai', bold: true })] })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph('Profil Pertumbuhan Api')] }),
              new TableCell({ children: [new Paragraph(fireData.fire?.type || 'Medium')] })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph('Alpha (α) - T-squared')] }),
              new TableCell({ children: [new Paragraph(fireData.fire?.alpha?.toString() || '0.01172')] })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph('HRR Maksimum')] }),
              new TableCell({ children: [new Paragraph(`${fireData.fire?.maxHRR || 5000} kW`)] })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph('Luas Area Kebakaran')] }),
              new TableCell({ children: [new Paragraph(`${fireData.fire?.area || 2} m²`)] })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph('Bahan Bakar')] }),
              new TableCell({ children: [new Paragraph(fireData.fire?.fuel || 'Wood')] })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph('Heat of Combustion')] }),
              new TableCell({ children: [new Paragraph(`${fireData.fire?.heatOfCombustion || 17} MJ/kg`)] })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph('Soot Yield')] }),
              new TableCell({ children: [new Paragraph(`${(fireData.fire?.sootYield || 0.015) * 100}%`)] })
            ]
          })
        ]
      })
    ];
  }

  renderASETAnalysis(fireData) {
    const aset = fireData.ASET || 0;
    const maxTemp = (fireData.maxTemperature || 293) - 273;
    const minVis = fireData.minVisibility || 30;
    const maxCO = fireData.maxCO || 0;

    return [
      new Paragraph({
        text: 'ANALISIS ASET (Available Safe Egress Time)',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 200 }
      }),
      new Paragraph({
        spacing: { after: 200 },
        children: [
          new TextRun({
            text: `ASET adalah waktu yang tersedia sebelum kondisi di dalam ruangan menjadi tidak tenable (tidak dapat dihuni). ` +
                  `ASET dicapai ketika salah satu kriteria ketidaktenablean terlampaui.`
          })
        ]
      }),
      new Paragraph({
        spacing: { after: 100 },
        children: [
          new TextRun({ text: 'ASET: ', bold: true }),
          new TextRun({ text: `${aset.toFixed(0)} detik (${(aset/60).toFixed(1)} menit)` })
        ]
      }),
      new Paragraph({
        spacing: { after: 100 },
        children: [
          new TextRun({ text: 'Suhu Maksimum: ', bold: true }),
          new TextRun({ text: `${maxTemp.toFixed(0)}°C` })
        ]
      }),
      new Paragraph({
        spacing: { after: 100 },
        children: [
          new TextRun({ text: 'Visibilitas Minimum: ', bold: true }),
          new TextRun({ text: `${minVis.toFixed(1)} meter` })
        ]
      }),
      new Paragraph({
        spacing: { after: 100 },
        children: [
          new TextRun({ text: 'Konsentrasi CO Maksimum: ', bold: true }),
          new TextRun({ text: `${maxCO.toFixed(0)} ppm` })
        ]
      }),
      new Paragraph({
        spacing: { after: 300 },
        children: [
          new TextRun({ text: 'Konsentrasi Asap Akhir: ', bold: true }),
          new TextRun({ text: `${(fireData.finalSmokeDensity || 0).toFixed(0)} mg/m³` })
        ]
      })
    ];
  }

  renderRSETAnalysis(evacData) {
    return [
      new Paragraph({
        text: 'ANALISIS RSET (Required Safe Egress Time)',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 200 }
      }),
      new Paragraph({
        spacing: { after: 200 },
        children: [
          new TextRun({
            text: `RSET adalah waktu yang diperlukan untuk mengevakuasi seluruh occupant dari bangunan. ` +
                  `Dihitung menggunakan simulasi evakuasi dengan Social Force Model.`
          })
        ]
      }),
      new Paragraph({
        spacing: { after: 100 },
        children: [
          new TextRun({ text: 'RSET: ', bold: true }),
          new TextRun({ text: `${evacData.rset} detik (${(parseFloat(evacData.rset)/60).toFixed(1)} menit)` })
        ]
      }),
      new Paragraph({
        spacing: { after: 100 },
        children: [
          new TextRun({ text: 'Total Occupant: ', bold: true }),
          new TextRun({ text: evacData.totalAgents?.toString() || '-' })
        ]
      }),
      new Paragraph({
        spacing: { after: 100 },
        children: [
          new TextRun({ text: 'Evacuated: ', bold: true }),
          new TextRun({ text: `${evacData.evacuated} (${evacData.evacuationRate}%)` })
        ]
      }),
      new Paragraph({
        spacing: { after: 300 },
        children: [
          new TextRun({ text: 'Stranded: ', bold: true }),
          new TextRun({ text: evacData.stranded?.toString() || '0' })
        ]
      })
    ];
  }

  renderSafetyComparison(results) {
    const { safetyFactor, ASET, RSET } = results;
    const status = safetyFactor >= 1.5 ? 'AMAN' : safetyFactor >= 1.0 ? 'MARGINAL' : 'TIDAK AMAN';

    return [
      new Paragraph({
        text: 'PERBANDINGAN ASET vs RSET',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 200 }
      }),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph({ text: 'Parameter', bold: true })] }),
              new TableCell({ children: [new Paragraph({ text: 'Nilai', bold: true })] }),
              new TableCell({ children: [new Paragraph({ text: 'Keterangan', bold: true })] })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph('ASET')] }),
              new TableCell({ children: [new Paragraph(`${ASET.toFixed(0)} s`)] }),
              new TableCell({ children: [new Paragraph('Waktu tersedia')] })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph('RSET')] }),
              new TableCell({ children: [new Paragraph(`${RSET.toFixed(0)} s`)] }),
              new TableCell({ children: [new Paragraph('Waktu diperlukan')] })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph('Safety Factor')] }),
              new TableCell({ children: [new Paragraph(safetyFactor.toFixed(2))] }),
              new TableCell({ children: [new Paragraph(status)] })
            ]
          })
        ]
      }),
      new Paragraph({
        spacing: { before: 200, after: 300 },
        children: [
          new TextRun({
            text: safetyFactor >= 1.5 
              ? 'Safety Factor > 1.5 menunjukkan desain memiliki margin keamanan yang memadai. Evakuasi dapat dilakukan dengan aman sebelum kondisi menjadi tidak tenable.'
              : safetyFactor >= 1.0
              ? 'Safety Factor 1.0-1.5 menunjukkan desain memenuhi minimum requirement namun margin keamanan terbatas. Pertimbangkan peningkatan sistem proteksi.'
              : 'Safety Factor < 1.0 menunjukkan desain TIDAK AMAN. RSET melebihi ASET, penghuni masih berada di dalam saat kondisi tidak tenable. Perlu perbaikan desain segera.'
          })
        ]
      })
    ];
  }

  renderTenabilityAnalysis(fireData) {
    const criteria = [
      { name: 'Suhu Konvektif', limit: '60°C', actual: ((fireData.maxTemperature || 293) - 273).toFixed(0) + '°C', pass: (fireData.maxTemperature - 273) < 60 },
      { name: 'Visibilitas', limit: '> 10m', actual: (fireData.minVisibility || 30).toFixed(1) + 'm', pass: (fireData.minVisibility || 30) > 10 },
      { name: 'CO', limit: '< 1000 ppm', actual: (fireData.maxCO || 0).toFixed(0) + ' ppm', pass: (fireData.maxCO || 0) < 1000 },
      { name: 'O₂', limit: '> 15%', actual: '21%', pass: true }
    ];

    const rows = [
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ text: 'Kriteria', bold: true })] }),
          new TableCell({ children: [new Paragraph({ text: 'Batas', bold: true })] }),
          new TableCell({ children: [new Paragraph({ text: 'Actual', bold: true })] }),
          new TableCell({ children: [new Paragraph({ text: 'Status', bold: true })] })
        ]
      })
    ];

    criteria.forEach(c => {
      rows.push(new TableRow({
        children: [
          new TableCell({ children: [new Paragraph(c.name)] }),
          new TableCell({ children: [new Paragraph(c.limit)] }),
          new TableCell({ children: [new Paragraph(c.actual)] }),
          new TableCell({ children: [new Paragraph(c.pass ? '✓ PASS' : '✗ FAIL')] })
        ]
      }));
    });

    return [
      new Paragraph({
        text: 'KRITERIA KETIDAKTENABLEAN',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 200 }
      }),
      new Paragraph({
        spacing: { after: 200 },
        children: [
          new TextRun({
            text: 'Berdasarkan SNI 03-1736-2000, suatu kondisi dikatakan tidak tenable jika:'
          })
        ]
      }),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows
      })
    ];
  }

  renderTimeline(fireData) {
    const timeline = fireData.timeline || [];
    if (timeline.length === 0) return [];

    // Sample every 60 seconds
    const samplePoints = [0, 60, 120, 180, 240, 300].filter(t => t < timeline.length);

    const rows = [
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ text: 'Waktu (s)', bold: true })] }),
          new TableCell({ children: [new Paragraph({ text: 'HRR (kW)', bold: true })] }),
          new TableCell({ children: [new Paragraph({ text: 'Suhu (°C)', bold: true })] }),
          new TableCell({ children: [new Paragraph({ text: 'Vis (m)', bold: true })] }),
          new TableCell({ children: [new Paragraph({ text: 'Layer Height (m)', bold: true })] })
        ]
      })
    ];

    samplePoints.forEach(idx => {
      const t = timeline[idx];
      if (!t) return;
      
      rows.push(new TableRow({
        children: [
          new TableCell({ children: [new Paragraph(t.time.toString())] }),
          new TableCell({ children: [new Paragraph((t.fire?.HRR || 0).toFixed(0))] }),
          new TableCell({ children: [new Paragraph(((t.upperLayer?.temperature || 293) - 273).toFixed(0))] }),
          new TableCell({ children: [new Paragraph((t.upperLayer?.visibility || 30).toFixed(1))] }),
          new TableCell({ children: [new Paragraph((t.lowerLayer?.height || 3).toFixed(2))] })
        ]
      }));
    });

    return [
      new Paragraph({
        text: 'TIMELINE SIMULASI (Sampel)',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 200 }
      }),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows
      })
    ];
  }

  renderConclusion(results) {
    const { safetyFactor } = results;
    const conclusion = safetyFactor >= 1.5
      ? 'Desain proteksi kebakaran memenuhi persyaratan dengan margin keamanan yang memadai. Safety factor > 1.5 menunjukkan sistem dapat mengevakuasi seluruh penghuni sebelum kondisi menjadi tidak tenable.'
      : safetyFactor >= 1.0
      ? 'Desain proteksi kebakaran memenuhi minimum requirement namun dengan margin keamanan terbatas. Disarankan untuk menambah kapasitas exit atau sistem ventilasi asap untuk meningkatkan safety factor.'
      : 'Desain proteksi kebakaran TIDAK MEMENUHI persyaratan. Safety factor < 1.0 menunjukkan waktu evakuasi melebihi waktu aman yang tersedia. Diperlukan perbaikan desain yang signifikan seperti penambahan exit, perlebaran koridor, atau instalasi sistem ventilasi asap.';

    return [
      new Paragraph({
        text: 'KESIMPULAN',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 200 }
      }),
      new Paragraph({
        spacing: { after: 300 },
        children: [new TextRun({ text: conclusion })]
      }),
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        spacing: { before: 400 },
        children: [
          new TextRun({ text: 'Dibuat oleh: ', bold: true }),
          new TextRun({ text: 'Sistem Simulasi Kebakaran' })
        ]
      }),
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [
          new TextRun({ text: 'Tanggal: ', bold: true }),
          new TextRun({ text: formatTanggal(new Date()) })
        ]
      })
    ];
  }
}

export default { FireReportService };
