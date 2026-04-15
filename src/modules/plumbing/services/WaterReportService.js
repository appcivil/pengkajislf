// ============================================================
// WATER REPORT SERVICE - DOCX Report Generator
// Laporan Evaluasi Sistem Air Bersih SLF
// ============================================================

import { Document, Packer, Paragraph, Table, TableCell, TableRow, HeadingLevel, AlignmentType, BorderStyle } from 'docx';
import { saveAs } from 'file-saver';

export class WaterReportService {
  constructor() {
    this.companyName = 'Konsultan SLF Indonesia';
  }

  async generateReport(data) {
    const { pasal, results, network, simulation } = data;
    
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          // Title
          new Paragraph({
            text: 'LAPORAN EVALUASI SISTEM AIR BERSIH',
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 }
          }),
          new Paragraph({
            text: 'Berdasarkan Pasal 224 ayat (2) Peraturan Menteri PUPR',
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 }
          }),
          new Paragraph({
            text: `No. 14/PRT/M/2017 tentang Bangunan Gedung`,
            alignment: AlignmentType.CENTER,
            spacing: { after: 600 }
          }),

          // Executive Summary
          new Paragraph({
            text: 'RINGKASAN EVALUASI',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 }
          }),
          new Paragraph({
            text: `Total Compliance Score: ${results.score}%`,
            bold: true,
            spacing: { after: 100 }
          }),
          new Paragraph({
            text: `Status: ${results.score >= 80 ? 'MEMENUHI STANDAR' : results.score >= 60 ? 'MEMENUHI DENGAN CATATAN' : 'TIDAK MEMENUHI STANDAR'}`,
            spacing: { after: 300 }
          }),

          // Section A: Sumber Air
          new Paragraph({
            text: 'A. SUMBER AIR BERSIH',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 }
          }),
          new Paragraph({
            text: 'Berdasarkan Pasal 224 ayat (2)a: Sumber air bersih harus tersedia dalam jumlah dan kualitas yang memadai.',
            italics: true,
            spacing: { after: 200 }
          }),
          ...this.generateChecklistParagraphs(results.checks.sumber.items),

          // Section B: Sistem Distribusi
          new Paragraph({
            text: 'B. SISTEM DISTRIBUSI AIR BERSIH',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 }
          }),
          new Paragraph({
            text: 'Berdasarkan Pasal 224 ayat (2)b: Sistem distribusi harus dirancang untuk memenuhi kebutuhan debit dan tekanan di titik penggunaan.',
            italics: true,
            spacing: { after: 200 }
          }),
          ...this.generateChecklistParagraphs(results.checks.distribusi.items),

          // Hydraulic Analysis Table
          new Paragraph({
            text: 'Analisis Hydraulic Network',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 }
          }),
          this.generateHydraulicTable(simulation),

          // Section C: Kualitas Air
          new Paragraph({
            text: 'C. KUALITAS AIR BERSIH',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 }
          }),
          new Paragraph({
            text: 'Berdasarkan Permenkes dan SNI 7509:2011 tentang syarat-syarat kualitas air minum.',
            italics: true,
            spacing: { after: 200 }
          }),
          ...this.generateChecklistParagraphs(results.checks.kualitas.items),

          // Section D: Debit & Neraca
          new Paragraph({
            text: 'D. DEBIT DAN NERACA AIR',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 }
          }),
          new Paragraph({
            text: 'Berdasarkan SNI 6774:2008 tentang Tata Cara Perencanaan Instalasi Air Bersih.',
            italics: true,
            spacing: { after: 200 }
          }),
          ...this.generateChecklistParagraphs(results.checks.debit.items),
          this.generateFlowBalanceTable(simulation),

          // Conclusion
          new Paragraph({
            text: 'KESIMPULAN',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 600, after: 200 }
          }),
          new Paragraph({
            text: this.generateConclusion(results),
            spacing: { after: 200 }
          }),

          // Recommendations
          new Paragraph({
            text: 'REKOMENDASI',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 }
          }),
          ...this.generateRecommendations(results),

          // Signatures
          new Paragraph({ text: '', spacing: { before: 800 } }),
          new Paragraph({
            text: 'Dibuat oleh:',
            spacing: { before: 200, after: 600 }
          }),
          new Paragraph({
            text: '_______________________',
            spacing: { after: 100 }
          }),
          new Paragraph({
            text: 'Tim Teknis SLF',
            bold: true
          })
        ]
      }]
    });

    const blob = await Packer.toBlob(doc);
    const fileName = `Evaluasi_Air_Bersih_${new Date().toISOString().split('T')[0]}.docx`;
    saveAs(blob, fileName);
    return blob;
  }

  generateChecklistParagraphs(items) {
    return items.map(item => new Paragraph({
      children: [
        { text: item.pass ? '☑ ' : '☐ ', bold: true },
        { text: `${item.name}: `, bold: true },
        { text: item.value },
        { text: ` (Standard: ${item.standard})`, italics: true, color: '666666' }
      ],
      spacing: { after: 100 },
      bullet: { level: 0 }
    }));
  }

  generateHydraulicTable(simulation) {
    const summary = simulation.summary || {};
    
    return new Table({
      width: { size: 100, type: 'pct' },
      rows: [
        new TableRow({
          children: [
            this.createCell('Parameter', true),
            this.createCell('Nilai', true),
            this.createCell('Satuan', true)
          ]
        }),
        new TableRow({ children: [this.createCell('Total Demand'), this.createCell(summary.totalDemand || '-'), this.createCell('L/s')] }),
        new TableRow({ children: [this.createCell('Minimum Pressure'), this.createCell(summary.minPressure || '-'), this.createCell('mH2O')] }),
        new TableRow({ children: [this.createCell('Maximum Pressure'), this.createCell(summary.maxPressure || '-'), this.createCell('mH2O')] }),
        new TableRow({ children: [this.createCell('Maximum Velocity'), this.createCell(summary.maxVelocity || '-'), this.createCell('m/s')] }),
        new TableRow({ children: [this.createCell('Total Head Loss'), this.createCell(summary.totalHeadloss || '-'), this.createCell('m')] }),
        new TableRow({ children: [this.createCell('Iterations'), this.createCell(String(summary.iterations || '-')), this.createCell('')] }),
        new TableRow({ children: [this.createCell('Converged'), this.createCell(summary.converged ? 'Yes' : 'No'), this.createCell('')] })
      ]
    });
  }

  generateFlowBalanceTable(simulation) {
    const nodes = simulation.nodes || [];
    const tableRows = [
      new TableRow({
        children: [
          this.createCell('Node ID', true),
          this.createCell('Elevation', true),
          this.createCell('Demand', true),
          this.createCell('Head', true),
          this.createCell('Pressure', true)
        ]
      })
    ];

    nodes.slice(0, 20).forEach(node => {
      tableRows.push(new TableRow({
        children: [
          this.createCell(node.id),
          this.createCell(String(node.elevation)),
          this.createCell(String(node.demand)),
          this.createCell(String(node.head)),
          this.createCell(String(node.pressure))
        ]
      }));
    });

    if (nodes.length > 20) {
      tableRows.push(new TableRow({
        children: [{
          columnSpan: 5,
          children: [new Paragraph({ text: `... and ${nodes.length - 20} more nodes`, italics: true })]
        }]
      }));
    }

    return new Table({
      width: { size: 100, type: 'pct' },
      rows: tableRows
    });
  }

  createCell(text, bold = false) {
    return new TableCell({
      children: [new Paragraph({
        text: String(text),
        bold: bold,
        size: 20
      })],
      borders: {
        top: { style: BorderStyle.SINGLE },
        bottom: { style: BorderStyle.SINGLE },
        left: { style: BorderStyle.SINGLE },
        right: { style: BorderStyle.SINGLE }
      }
    });
  }

  generateConclusion(results) {
    const score = results.score;
    if (score >= 80) {
      return `Sistem air bersih dinilai MEMENUHI standar Pasal 224 ayat (2) Permen PUPR 14/PRT/M/2017 dengan skor compliance ${score}%. Sistem memiliki sumber air yang memadai, distribusi dengan tekanan dan kecepatan yang sesuai SNI 6774:2008, serta memenuhi persyaratan kualitas air minum yang ditetapkan oleh Kementerian Kesehatan.`;
    } else if (score >= 60) {
      return `Sistem air bersih dinilai MEMENUHI STANDAR DENGAN CATATAN (skor ${score}%). Terdapat beberapa parameter yang perlu diperbaiki sesuai rekomendasi teknis agar sepenuhnya memenuhi standar Pasal 224 ayat (2).`;
    } else {
      return `Sistem air bersih dinilai TIDAK MEMENUHI standar Pasal 224 ayat (2) dengan skor ${score}%. Diperlukan perbaikan signifikan pada sistem sebelum dapat dinyatakan laik fungsi.`;
    }
  }

  generateRecommendations(results) {
    const recs = [];
    
    // Check each section for failures
    Object.entries(results.checks).forEach(([section, data]) => {
      data.items.forEach(item => {
        if (!item.pass) {
          recs.push(`Perbaiki ${item.name} (nilai: ${item.value}, standard: ${item.standard})`);
        }
      });
    });

    if (recs.length === 0) {
      return [new Paragraph({ text: 'Tidak ada rekomendasi kritis. Sistem telah memenuhi standar.', spacing: { after: 100 } })];
    }

    return recs.map(rec => new Paragraph({
      text: `• ${rec}`,
      spacing: { after: 100 },
      bullet: { level: 0 }
    }));
  }

  generatePDFReport(data) {
    // Placeholder for PDF generation using jsPDF
    // This would be implemented with jspdf-autotable
    console.log('PDF report generation placeholder', data);
    return Promise.resolve();
  }
}
