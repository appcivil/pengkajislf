import { 
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, 
  WidthType, AlignmentType, HeadingLevel, PageBreak, 
  BorderStyle, VerticalAlign, PageNumber, Header, Footer
} from 'docx';
import fs from 'fs';
import path from 'path';

// --- Constants (Matching app style) ---
const FONT_MAIN = 'Calibri';
const COLOR_HEADING = '1e3a8a';
const COLOR_PRIMARY = '1a1a2e';
const MARGIN = 1440; // ~2.54cm

// --- Helpers ---
const createHeading = (text, level) => new Paragraph({
  text: text,
  heading: level,
  spacing: { before: 400, after: 200 },
  children: [new TextRun({ text, bold: true, font: FONT_MAIN, color: COLOR_HEADING, size: level === HeadingLevel.HEADING_1 ? 32 : 28 })]
});

const createBody = (text, opts = {}) => new Paragraph({
  spacing: { after: 120, line: 360 },
  children: [new TextRun({ text, font: FONT_MAIN, size: 22, ...opts })]
});

const createTableCell = (text, opts = {}) => new TableCell({
  children: [new Paragraph({
    children: [new TextRun({ text, font: FONT_MAIN, size: 20, ...opts })]
  })],
  verticalAlign: VerticalAlign.CENTER,
  margins: { top: 100, bottom: 100, left: 100, right: 100 }
});

// --- Document Definition ---
const doc = new Document({
  sections: [
    {
      properties: {
        page: { margin: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN } }
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [new TextRun({ text: "{{NAMA_BANGUNAN}}", color: "94a3b8", size: 18, font: FONT_MAIN })]
            })
          ],
        }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ text: "Halaman ", size: 18, font: FONT_MAIN }),
                new TextRun({ children: [PageNumber.CURRENT], size: 18, font: FONT_MAIN }),
              ]
            })
          ],
        }),
      },
      children: [
        // COVER PAGE
        new Paragraph({ spacing: { before: 2000 }, alignment: AlignmentType.CENTER }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "LAPORAN KAJIAN TEKNIS", size: 36, bold: true, font: FONT_MAIN, color: COLOR_HEADING })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "SERTIFIKAT LAIK FUNGSI (SLF)", size: 48, bold: true, font: FONT_MAIN, color: COLOR_HEADING })]
        }),
        new Paragraph({ spacing: { before: 1000 } }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "{{NAMA_BANGUNAN}}", size: 32, bold: true, font: FONT_MAIN })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "{{ALAMAT_LENGKAP}}", size: 24, font: FONT_MAIN })]
        }),
        new Paragraph({ spacing: { before: 2000 } }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "PEMILIK:", size: 20, font: FONT_MAIN })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "{{PEMILIK}}", size: 28, bold: true, font: FONT_MAIN })]
        }),
        new Paragraph({ spacing: { before: 2000 } }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "TANGGAL LAPORAN: {{TANGGAL_LAPORAN}}", size: 20, font: FONT_MAIN })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "KONSULTAN: {{NAMA_KONSULTAN}}", size: 24, bold: true, font: FONT_MAIN })]
        }),
        
        new PageBreak(),

        // BAB I
        createHeading("BAB I: GAMBARAN UMUM", HeadingLevel.HEADING_1),
        createHeading("1.1 Latar Belakang", HeadingLevel.HEADING_2),
        createBody("Penilaian kelaikan fungsi bangunan gedung merupakan kewajiban yang diamanatkan dalam Peraturan Pemerintah Nomor 16 Tahun 2021. Laporan ini merupakan hasil pengkajian teknis untuk bangunan {{NAMA_BANGUNAN}}."),
        
        createHeading("1.2 Identitas Bangunan", HeadingLevel.HEADING_2),
        createBody("Nama Bangunan: {{NAMA_BANGUNAN}}"),
        createBody("Fungsi: {{FUNGSI_BANGUNAN}} / {{JENIS_BANGUNAN}}"),
        createBody("Alamat: {{ALAMAT_LENGKAP}}"),
        createBody("Luas Bangunan: {{LUAS_BANGUNAN}}"),
        createBody("Jumlah Lantai: {{JUMLAH_LANTAI}}"),
        createBody("Tahun Dibangun: {{TAHUN_DIBANGUN}}"),

        new PageBreak(),

        // BAB II
        createHeading("BAB II: METODOLOGI", HeadingLevel.HEADING_1),
        createBody("Pengkajian dilakukan dengan metode pemeriksaan visual, pengujian non-destruktif, dan analisis berbasis risiko menggunakan sistem Smart AI Pengkaji SLF."),
        
        new PageBreak(),

        // BAB III
        createHeading("BAB III: HASIL PEMERIKSAAN CHECKLIST", HeadingLevel.HEADING_1),
        createHeading("3.1 Pemeriksaan Dokumen Administrasi", HeadingLevel.HEADING_2),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({ children: [ createTableCell("{{TABLE_CHECKLIST_ADMIN}}", { bold: true }) ] }),
            new TableRow({ children: [ createTableCell("No"), createTableCell("Kode"), createTableCell("Item"), createTableCell("Status"), createTableCell("Catatan") ] }),
          ]
        }),
        
        createHeading("3.2 Pemeriksaan Teknis Eksisting", HeadingLevel.HEADING_2),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({ children: [ createTableCell("{{TABLE_CHECKLIST_TEKNIS}}", { bold: true }) ] }),
            new TableRow({ children: [ createTableCell("No"), createTableCell("Kode"), createTableCell("Item"), createTableCell("Status"), createTableCell("Catatan") ] }),
          ]
        }),

        new PageBreak(),

        // BAB IV
        createHeading("BAB IV: ANALISIS HASIL PENGKAJIAN", HeadingLevel.HEADING_1),
        createBody("Berdasarkan skoring sistem, bangunan mendapatkan nilai kepatuhan sebesar {{SKOR_TOTAL}}% dengan tingkat risiko {{RISK_LEVEL}}."),
        createHeading("4.1 Skor Per Aspek", HeadingLevel.HEADING_2),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({ children: [ createTableCell("{{TABLE_SKOR_ASPEK}}", { bold: true }) ] }),
            new TableRow({ children: [ createTableCell("No"), createTableCell("Aspek"), createTableCell("Skor"), createTableCell("Bobot"), createTableCell("Acuan") ] }),
          ]
        }),
        
        createHeading("4.2 Analisis Teknis Komprehensif", HeadingLevel.HEADING_2),
        createBody("{{NARASI_BAB4}}"),

        new PageBreak(),

        // BAB V
        createHeading("BAB V: KESIMPULAN STATUS KELAIKAN", HeadingLevel.HEADING_1),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 1000, after: 1000 },
          children: [
            new TextRun({ text: "STATUS KELAIKAN FUNGSI:", size: 24, font: FONT_MAIN }),
            new PageBreak(),
            new TextRun({ text: "{{STATUS_SLF}}", size: 48, bold: true, font: FONT_MAIN, color: "DC2626" })
          ]
        }),
        createBody("{{STATUS_SLF_NARATIF}}"),

        new PageBreak(),

        // BAB VI
        createHeading("BAB VI: REKOMENDASI TERUKUR", HeadingLevel.HEADING_1),
        createHeading("Prioritas 1: Kritis / Sangat Mendesak", HeadingLevel.HEADING_2),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({ children: [ createTableCell("{{TABLE_REKOMENDASI_P1}}", { bold: true }) ] }),
            new TableRow({ children: [ createTableCell("No"), createTableCell("Aspek"), createTableCell("Tindakan"), createTableCell("Standar"), createTableCell("Prioritas") ] }),
          ]
        }),
        
        createHeading("Prioritas 2: Jangka Pendek", HeadingLevel.HEADING_2),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({ children: [ createTableCell("{{TABLE_REKOMENDASI_P2}}", { bold: true }) ] }),
          ]
        }),

        new PageBreak(),

        // PENUTUP
        createHeading("TIM TENAGA AHLI PENGKAJI", HeadingLevel.HEADING_1),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({ children: [ createTableCell("{{TABLE_TIM_AHLI}}", { bold: true }) ] }),
            new TableRow({ children: [ createTableCell("No"), createTableCell("Nama"), createTableCell("SKA"), createTableCell("Paraf") ] }),
          ]
        }),
        
        new Paragraph({ spacing: { before: 1000 } }),
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [
            new TextRun({ text: "Ditetapkan di {{KOTA_PENETAPAN}}, {{TANGGAL_PENETAPAN}}", font: FONT_MAIN }),
            new PageBreak(),
            new TextRun({ text: "{{NAMA_KONSULTAN}}", bold: true, font: FONT_MAIN }),
          ]
        })
      ],
    },
  ],
});

// Write file
const outputDir = './public/templates';
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(path.join(outputDir, 'SLF_Template_Master.docx'), buffer);
  console.log('Template berhasil dibuat: public/templates/SLF_Template_Master.docx');
});
