/**
 * EvacuationReportService.js - Generator Laporan DOCX untuk Simulasi Evakuasi
 * Generate laporan analisis evakuasi dengan grafik dan compliance SNI 03-1746-2000
 */

import { Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun, 
         AlignmentType, HeadingLevel, ImageRun, WidthType } from 'docx';
import { saveAs } from 'file-saver';
import { formatTanggal } from '../docx/utils.js';

export class EvacuationReportService {
  constructor() {
    this.templates = {
      header: 'LAPORAN HASIL SIMULASI EVAKUASI',
      standard: 'SNI 03-1746-2000 & NFPA 101'
    };
  }

  async generateReport(results, projectData = {}) {
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          ...this.renderHeader(projectData),
          ...this.renderExecutiveSummary(results),
          ...this.renderSimulationParameters(results),
          ...this.renderResultsTable(results),
          ...this.renderComplianceAnalysis(results),
          ...this.renderFlowRates(results),
          ...this.renderAgentDetails(results),
          ...this.renderRecommendations(results),
          ...this.renderConclusion(results)
        ]
      }]
    });

    const blob = await Packer.toBlob(doc);
    const fileName = `Laporan_Evakuasi_${projectData.nama_bangunan || 'Proyek'}_${new Date().toISOString().split('T')[0]}.docx`;
    
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
    const rset = parseFloat(results.rset);
    const aset = 300; // Default ASET
    const safetyFactor = (aset / rset).toFixed(2);
    const status = safetyFactor >= 1.5 ? 'AMAN' : safetyFactor >= 1.0 ? 'MEMENUHI MINIMUM' : 'TIDAK AMAN';
    const statusColor = safetyFactor >= 1.5 ? 'HIJAU' : safetyFactor >= 1.0 ? 'KUNING' : 'MERAH';

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
            text: `Simulasi evakuasi telah dilakukan untuk ${results.totalAgents} occupant dengan ${Object.keys(results.flowRates || {}).length} exit. ` +
                  `Waktu evakuasi yang diperlukan (RSET) adalah ${results.rset} detik, sedangkan waktu aman yang tersedia (ASET) adalah ${aset} detik. ` +
                  `Safety factor yang diperoleh adalah ${safetyFactor}, yang menunjukkan status ${status}.`
          })
        ]
      }),
      new Paragraph({
        spacing: { after: 100 },
        children: [
          new TextRun({ text: 'Status Keselamatan: ', bold: true }),
          new TextRun({ text: status, bold: true, color: statusColor === 'HIJAU' ? '10b981' : statusColor === 'KUNING' ? 'f59e0b' : 'ef4444' })
        ]
      }),
      new Paragraph({
        spacing: { after: 300 },
        children: [
          new TextRun({ text: 'Tingkat Evakuasi: ', bold: true }),
          new TextRun({ text: `${results.evacuationRate}% (${results.evacuated} dari ${results.totalAgents} occupant)` })
        ]
      })
    ];
  }

  renderSimulationParameters(results) {
    return [
      new Paragraph({
        text: 'PARAMATER SIMULASI',
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
              new TableCell({ children: [new Paragraph('Jumlah Occupant')] }),
              new TableCell({ children: [new Paragraph(results.totalAgents.toString())] })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph('Jumlah Exit')] }),
              new TableCell({ children: [new Paragraph(Object.keys(results.flowRates || {}).length.toString())] })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph('Time Step')] }),
              new TableCell({ children: [new Paragraph('0.05 detik (50 ms)')] })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph('Max Simulation Time')] }),
              new TableCell({ children: [new Paragraph('600 detik (10 menit)')] })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph('Speed Normal')] }),
              new TableCell({ children: [new Paragraph('1.2 m/s')] })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph('Speed Elderly')] }),
              new TableCell({ children: [new Paragraph('0.8 m/s')] })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph('Speed Child')] }),
              new TableCell({ children: [new Paragraph('0.9 m/s')] })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph('Speed Disabled')] }),
              new TableCell({ children: [new Paragraph('0.5 m/s')] })
            ]
          })
        ]
      })
    ];
  }

  renderResultsTable(results) {
    return [
      new Paragraph({
        text: 'HASIL SIMULASI',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 200 }
      }),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph({ text: 'Metrik', bold: true })] }),
              new TableCell({ children: [new Paragraph({ text: 'Nilai', bold: true })] }),
              new TableCell({ children: [new Paragraph({ text: 'Satuan', bold: true })] })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph('RSET (Required Safe Egress Time)')] }),
              new TableCell({ children: [new Paragraph(results.rset)] }),
              new TableCell({ children: [new Paragraph('detik')] })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph('ASET (Available Safe Egress Time)')] }),
              new TableCell({ children: [new Paragraph('300')] }),
              new TableCell({ children: [new Paragraph('detik')] })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph('Safety Factor')] }),
              new TableCell({ children: [new Paragraph((300 / parseFloat(results.rset)).toFixed(2))] }),
              new TableCell({ children: [new Paragraph('-')] })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph('Waktu Minimum')] }),
              new TableCell({ children: [new Paragraph(results.minTime)] }),
              new TableCell({ children: [new Paragraph('detik')] })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph('Waktu Rata-rata')] }),
              new TableCell({ children: [new Paragraph(results.avgTime)] }),
              new TableCell({ children: [new Paragraph('detik')] })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph('Waktu Maksimum')] }),
              new TableCell({ children: [new Paragraph(results.maxTime)] }),
              new TableCell({ children: [new Paragraph('detik')] })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph('Jarak Tempuh Rata-rata')] }),
              new TableCell({ children: [new Paragraph(
                results.agentDetails?.length > 0 
                  ? (results.agentDetails.reduce((sum, a) => sum + parseFloat(a.distance || 0), 0) / results.agentDetails.length).toFixed(2)
                  : '0'
              )] }),
              new TableCell({ children: [new Paragraph('meter')] })
            ]
          })
        ]
      })
    ];
  }

  renderComplianceAnalysis(results) {
    const rset = parseFloat(results.rset);
    const compliance = rset < 180 ? 'Sangat Baik' : rset < 300 ? 'Memenuhi' : 'Tidak Memenuhi';
    
    return [
      new Paragraph({
        text: 'ANALISIS KELAYAKAN',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 200 }
      }),
      new Paragraph({
        spacing: { after: 200 },
        children: [
          new TextRun({
            text: 'Berdasarkan SNI 03-1746-2000, waktu evakuasi maksimum yang diizinkan adalah 5 menit (300 detik) untuk gedung bertingkat rendah dan 3 menit (180 detik) untuk area high-risk.'
          })
        ]
      }),
      new Paragraph({
        spacing: { after: 100 },
        children: [
          new TextRun({ text: 'Status Kelengkapan: ', bold: true }),
          new TextRun({ text: compliance })
        ]
      }),
      new Paragraph({
        spacing: { after: 300 },
        children: [
          new TextRun({ text: 'Persyaratan: ', bold: true }),
          new TextRun({ text: `RSET ${rset < 300 ? '≤' : '>'} 300 detik` })
        ]
      })
    ];
  }

  renderFlowRates(results) {
    const flowRates = results.flowRates || {};
    
    const rows = [
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ text: 'Exit ID', bold: true })] }),
          new TableCell({ children: [new Paragraph({ text: 'Tipe', bold: true })] }),
          new TableCell({ children: [new Paragraph({ text: 'Lebar', bold: true })] }),
          new TableCell({ children: [new Paragraph({ text: 'Total', bold: true })] }),
          new TableCell({ children: [new Paragraph({ text: 'Flow Rate', bold: true })] }),
          new TableCell({ children: [new Paragraph({ text: 'Specific Flow', bold: true })] })
        ]
      })
    ];

    Object.entries(flowRates).forEach(([id, data]) => {
      rows.push(new TableRow({
        children: [
          new TableCell({ children: [new Paragraph(id)] }),
          new TableCell({ children: [new Paragraph(id.includes('stair') ? 'Tangga' : 'Pintu')] }),
          new TableCell({ children: [new Paragraph(`${data.width} m`)] }),
          new TableCell({ children: [new Paragraph(data.total.toString())] }),
          new TableCell({ children: [new Paragraph(`${data.flowRate} pers/min`)] }),
          new TableCell({ children: [new Paragraph(`${data.specificFlow} pers/m/min`)] })
        ]
      }));
    });

    return [
      new Paragraph({
        text: 'ANALISIS FLOW RATE',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 200 }
      }),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows
      })
    ];
  }

  renderAgentDetails(results) {
    // Limit to first 20 agents untuk laporan
    const agents = (results.agentDetails || []).slice(0, 20);
    
    const rows = [
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ text: 'ID', bold: true })] }),
          new TableCell({ children: [new Paragraph({ text: 'Profil', bold: true })] }),
          new TableCell({ children: [new Paragraph({ text: 'Waktu', bold: true })] }),
          new TableCell({ children: [new Paragraph({ text: 'Jarak', bold: true })] }),
          new TableCell({ children: [new Paragraph({ text: 'Kecepatan', bold: true })] }),
          new TableCell({ children: [new Paragraph({ text: 'Status', bold: true })] })
        ]
      })
    ];

    agents.forEach(agent => {
      rows.push(new TableRow({
        children: [
          new TableCell({ children: [new Paragraph(agent.id.split('_')[1] || agent.id)] }),
          new TableCell({ children: [new Paragraph(agent.profile)] }),
          new TableCell({ children: [new Paragraph(agent.exitTime ? `${agent.exitTime} s` : '-')] }),
          new TableCell({ children: [new Paragraph(`${agent.distance} m`)] }),
          new TableCell({ children: [new Paragraph(`${agent.avgSpeed} m/s`)] }),
          new TableCell({ children: [new Paragraph(agent.evacuated ? 'Evacuated' : 'Stranded')] })
        ]
      }));
    });

    return [
      new Paragraph({
        text: 'DETAIL AGENT (20 Pertama)',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 200 }
      }),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows
      })
    ];
  }

  renderRecommendations(results) {
    const recs = this.generateRecommendations(results);
    
    const items = recs.map((rec, i) => 
      new Paragraph({
        spacing: { after: 100 },
        children: [
          new TextRun({ text: `${i + 1}. ${rec}` })
        ]
      })
    );

    return [
      new Paragraph({
        text: 'REKOMENDASI',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 200 }
      }),
      ...items
    ];
  }

  generateRecommendations(results) {
    const recs = [];
    const rset = parseFloat(results.rset);
    
    if (rset > 300) {
      recs.push('Tambahkan exit door atau perlebar existing exit untuk mengurangi RSET di bawah 5 menit');
    }
    
    if (results.stranded > 0) {
      recs.push(`Perbaiki penempatan exit: ${results.stranded} occupant tidak dapat menemukan jalur evakuasi`);
    }
    
    if (parseFloat(results.evacuationRate) < 95) {
      recs.push('Tingkatkan kapasitas exit untuk mencapai target evakuasi > 95%');
    }
    
    const avgSpeed = results.agentDetails?.length > 0 
      ? results.agentDetails.reduce((sum, a) => sum + parseFloat(a.avgSpeed || 0), 0) / results.agentDetails.length 
      : 0;
    
    if (avgSpeed < 0.5) {
      recs.push('Kepadatan tinggi terdeteksi - pertimbangkan penambahan exit untuk mengurangi bottleneck');
    }
    
    return recs.length > 0 ? recs : ['Desain jalur evakuasi sudah memenuhi persyaratan standar'];
  }

  renderConclusion(results) {
    const rset = parseFloat(results.rset);
    const status = rset < 300 ? 'memenuhi' : 'tidak memenuhi';
    
    return [
      new Paragraph({
        text: 'KESIMPULAN',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 200 }
      }),
      new Paragraph({
        spacing: { after: 200 },
        children: [
          new TextRun({
            text: `Berdasarkan hasil simulasi, desain jalur evakuasi ${status} persyaratan SNI 03-1746-2000 dengan RSET ${results.rset} detik. ` +
                  `Safety factor sebesar ${(300 / rset).toFixed(2)} menunjukkan ${rset < 300 ? 'margin keamanan yang memadai' : 'perlunya perbaikan desain'}.`
          })
        ]
      }),
      new Paragraph({
        spacing: { before: 400 },
        alignment: AlignmentType.RIGHT,
        children: [
          new TextRun({ text: 'Dibuat oleh: ', bold: true }),
          new TextRun({ text: 'Sistem Simulasi Evakuasi' })
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

export default { EvacuationReportService };
