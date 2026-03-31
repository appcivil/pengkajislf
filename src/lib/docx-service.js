// ============================================================
//  DOCX SERVICE — WORD_SAFE_EXPORT MODE
//  Professional Engineering Report Generator
//  Standar: PUPR / SNI 9273:2025 / ASCE 41-17
//  Format: A4, Calibri, Margin 3cm/2.5cm
// ============================================================
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType, HeadingLevel, PageNumber,
  VerticalAlign, BorderStyle, ShadingType, Header, Footer,
  TableOfContents, PageBreak, Tab, TabStopType, TabStopPosition,
  LevelFormat, convertInchesToTwip
} from 'docx';
import { saveAs } from 'file-saver';
import { getStructuredDataForDocx } from './report-formatter.js';
import { getSettings } from './settings.js';

// ── CONSTANTS ─────────────────────────────────────────────────
const FONT_MAIN = 'Calibri';
const FONT_SIZE_BODY = 22;       // 11pt
const FONT_SIZE_H1 = 32;        // 16pt
const FONT_SIZE_H2 = 28;        // 14pt
const FONT_SIZE_H3 = 24;        // 12pt
const FONT_SIZE_SMALL = 20;     // 10pt
const FONT_SIZE_CAPTION = 18;   // 9pt

const COLOR_PRIMARY = '1a1a2e';
const COLOR_HEADING = '1e3a8a';
const COLOR_SUBHEADING = '374151';
const COLOR_MUTED = '6b7280';
const COLOR_SUCCESS = '065f46';
const COLOR_DANGER = '991b1b';
const COLOR_WARNING = '92400e';
const COLOR_HEADER_BG = 'f1f5f9';
const COLOR_TABLE_ALT = 'f9fafb';
const COLOR_BORDER = 'd1d5db';
const COLOR_COVER_BG = '1e3a8a';

// Margin: Atas 3cm, Bawah 2.5cm, Kiri 3cm, Kanan 2.5cm
const MARGIN_TOP = 1701;    // 3cm in twips
const MARGIN_BOTTOM = 1417; // 2.5cm
const MARGIN_LEFT = 1701;   // 3cm
const MARGIN_RIGHT = 1417;  // 2.5cm

const LINE_SPACING = 360; // 1.5 line spacing

// ── UTILS ─────────────────────────────────────────────────────
function getStatusLabel(s) {
  const map = {
    'ada_sesuai': 'Sesuai',
    'ada_tidak_sesuai': 'Tidak Sesuai',
    'tidak_ada': 'Tidak Ada',
    'pertama_kali': 'Pertama Kali',
    'baik': 'Baik',
    'sedang': 'Sedang',
    'buruk': 'Buruk',
    'kritis': 'Kritis',
    'tidak_wajib': 'Tidak Wajib',
    'tidak_ada_renovasi': 'Tidak Ada Renovasi'
  };
  return map[s] || s || '-';
}

function getRiskLabel(level) {
  const map = { low: 'Rendah', medium: 'Sedang', high: 'Tinggi', critical: 'Kritis' };
  return map[level] || level || '-';
}

function getStatusSLFLabel(s) {
  const map = {
    'LAIK_FUNGSI': 'LAIK FUNGSI',
    'LAIK_FUNGSI_BERSYARAT': 'LAIK FUNGSI BERSYARAT',
    'TIDAK_LAIK_FUNGSI': 'TIDAK LAIK FUNGSI',
    'DALAM_PENGKAJIAN': 'DALAM PENGKAJIAN'
  };
  return map[s] || s || 'BELUM DIANALISIS';
}

function formatTanggal(d) {
  try {
    return new Date(d).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
  } catch { return String(d || ''); }
}

function safeText(t) {
  // Strip emoji and special chars for Word safety
  return String(t || '').replace(/[\u{1F600}-\u{1F9FF}]/gu, '')
    .replace(/[\u{2600}-\u{26FF}]/gu, '')
    .replace(/[\u{2700}-\u{27BF}]/gu, '')
    .replace(/[\u{FE00}-\u{FE0F}]/gu, '')
    .replace(/[\u{1F000}-\u{1F02F}]/gu, '')
    .trim();
}

// ── TABLE BUILDER HELPERS ─────────────────────────────────────
function createTableBorders() {
  return {
    top: { style: BorderStyle.SINGLE, size: 1, color: COLOR_BORDER },
    bottom: { style: BorderStyle.SINGLE, size: 1, color: COLOR_BORDER },
    left: { style: BorderStyle.SINGLE, size: 1, color: COLOR_BORDER },
    right: { style: BorderStyle.SINGLE, size: 1, color: COLOR_BORDER },
    insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: COLOR_BORDER },
    insideVertical: { style: BorderStyle.SINGLE, size: 1, color: COLOR_BORDER },
  };
}

function headerCell(text, widthPct) {
  return new TableCell({
    width: { size: widthPct, type: WidthType.PERCENTAGE },
    shading: { fill: COLOR_HEADER_BG, type: ShadingType.CLEAR },
    margins: { top: 80, bottom: 80, left: 100, right: 100 },
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: safeText(text), bold: true, size: FONT_SIZE_SMALL, font: FONT_MAIN, color: COLOR_HEADING })]
    })]
  });
}

function dataCell(text, widthPct, opts = {}) {
  return new TableCell({
    width: { size: widthPct, type: WidthType.PERCENTAGE },
    shading: opts.shading ? { fill: opts.shading, type: ShadingType.CLEAR } : undefined,
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({
      alignment: opts.center ? AlignmentType.CENTER : AlignmentType.LEFT,
      children: [new TextRun({
        text: safeText(text),
        size: opts.size || FONT_SIZE_SMALL,
        font: FONT_MAIN,
        bold: opts.bold || false,
        color: opts.color || COLOR_PRIMARY,
        italics: opts.italics || false
      })]
    })]
  });
}

// ── PARAGRAPH HELPERS ─────────────────────────────────────────
function heading1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    alignment: AlignmentType.CENTER,
    spacing: { before: 400, after: 200 },
    children: [new TextRun({
      text: safeText(text).toUpperCase(),
      bold: true,
      size: FONT_SIZE_H1,
      font: FONT_MAIN,
      color: COLOR_HEADING,
      allCaps: true
    })]
  });
}

function heading2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 300, after: 150 },
    children: [new TextRun({
      text: safeText(text),
      bold: true,
      size: FONT_SIZE_H2,
      font: FONT_MAIN,
      color: COLOR_HEADING
    })]
  });
}

function heading3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 100 },
    children: [new TextRun({
      text: safeText(text),
      bold: true,
      size: FONT_SIZE_H3,
      font: FONT_MAIN,
      color: COLOR_SUBHEADING
    })]
  });
}

function bodyText(text, opts = {}) {
  if (!text) return new Paragraph({ spacing: { before: 60 } });
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: opts.spacingAfter || 120, line: LINE_SPACING },
    indent: opts.indent ? { left: opts.indent } : undefined,
    children: [new TextRun({
      text: safeText(text),
      size: opts.size || FONT_SIZE_BODY,
      font: FONT_MAIN,
      bold: opts.bold || false,
      italics: opts.italics || false,
      color: opts.color || COLOR_PRIMARY
    })]
  });
}

function bulletItem(text, level = 0) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 80, line: LINE_SPACING },
    bullet: { level },
    children: [new TextRun({
      text: safeText(text),
      size: FONT_SIZE_BODY,
      font: FONT_MAIN,
      color: COLOR_PRIMARY
    })]
  });
}

function numberedItem(num, text, bold = false) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 80, line: LINE_SPACING },
    indent: { left: 360 },
    children: [
      new TextRun({ text: `${num}. `, bold: true, size: FONT_SIZE_BODY, font: FONT_MAIN }),
      new TextRun({ text: safeText(text), bold, size: FONT_SIZE_BODY, font: FONT_MAIN })
    ]
  });
}

function emptyLine() {
  return new Paragraph({ spacing: { before: 100 } });
}

function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}

function horizontalLine() {
  return new Paragraph({
    spacing: { before: 200, after: 200 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: COLOR_BORDER } }
  });
}

/**
 * Generate DOCX and trigger download
 */
export async function generateDocx(proyek, analisis, checklist, onProgress) {
  const { blob, fileName } = await generateDocxBlob(proyek, analisis, checklist, onProgress);
  saveAs(blob, fileName);

  if (onProgress) onProgress(100, 'Selesai!');
  return fileName;
}

/**
 * Generate DOCX as a Blob (useful for cloud upload)
 */
export async function generateDocxBlob(proyek, analisis, checklist, onProgress) {
  if (onProgress) onProgress(5, 'Menyiapkan struktur dokumen...');
  
  const settings = await getSettings();

  const doc = new Document({
    creator: 'Smart AI Pengkaji SLF v1.0',
    title: `Laporan Kajian SLF - ${proyek.nama_bangunan}`,
    description: `Laporan Penilaian Kelaikan Fungsi oleh ${settings.consultant.name}`,
    styles: {
      default: {
        document: {
          run: { size: FONT_SIZE_BODY, font: FONT_MAIN, color: COLOR_PRIMARY },
          paragraph: {
            alignment: AlignmentType.JUSTIFIED,
            spacing: { line: LINE_SPACING }
          }
        }
      },
      paragraphStyles: [
        {
          id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: FONT_SIZE_H1, bold: true, font: FONT_MAIN, allCaps: true, color: COLOR_HEADING },
          paragraph: { alignment: AlignmentType.CENTER, spacing: { before: 400, after: 200 } }
        },
        {
          id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: FONT_SIZE_H2, bold: true, font: FONT_MAIN, color: COLOR_HEADING },
          paragraph: { spacing: { before: 300, after: 150 } }
        },
        {
          id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: FONT_SIZE_H3, bold: true, font: FONT_MAIN, color: COLOR_SUBHEADING },
          paragraph: { spacing: { before: 200, after: 100 } }
        }
      ]
    },
    numbering: {
      config: [{
        reference: "ordered-list",
        levels: [{
          level: 0,
          format: LevelFormat.DECIMAL,
          text: "%1.",
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 360, hanging: 260 } } }
        }, {
          level: 1,
          format: LevelFormat.DECIMAL,
          text: "%1.%2",
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } }
        }]
      }]
    },
    sections: [
      // SECTION 1: COVER PAGE (no header/footer)
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838 }, // A4
            margin: { top: 0, right: 0, bottom: 0, left: 0 },
          },
        },
        children: renderCover(proyek, settings),
      },
      // SECTION 2: MAIN CONTENT (with headers/footers)
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838 },
            margin: { top: MARGIN_TOP, right: MARGIN_RIGHT, bottom: MARGIN_BOTTOM, left: MARGIN_LEFT },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                spacing: { after: 120 },
                border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: COLOR_BORDER } },
                children: [
                  new TextRun({ text: `${settings.consultant.name.toUpperCase()} - LAPORAN KAJIAN SLF - `, size: FONT_SIZE_CAPTION, color: COLOR_MUTED, font: FONT_MAIN }),
                  new TextRun({ text: safeText(proyek.nama_bangunan).toUpperCase(), size: FONT_SIZE_CAPTION, color: COLOR_MUTED, font: FONT_MAIN, bold: true }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                border: { top: { style: BorderStyle.SINGLE, size: 1, color: COLOR_BORDER } },
                spacing: { before: 120 },
                children: [
                  new TextRun({ text: 'Smart AI Pengkaji SLF v1.0  |  Halaman ', size: FONT_SIZE_CAPTION, color: COLOR_MUTED, font: FONT_MAIN }),
                  new TextRun({ children: [PageNumber.CURRENT], size: FONT_SIZE_CAPTION, color: COLOR_MUTED, font: FONT_MAIN }),
                ],
              }),
            ],
          }),
        },
        children: [
          // BAB I
          ...renderBab1(proyek),
          pageBreak(),

          // BAB II
          ...renderBab2(),
          pageBreak(),

          // BAB III
          ...renderBab3(checklist),
          pageBreak(),

          // BAB IV
          ...renderBab4(analisis, checklist),
          pageBreak(),

          // BAB V
          ...renderBab5(analisis, proyek),
          pageBreak(),

          // BAB VI
          ...renderBab6(analisis),
          pageBreak(),

          // PENUTUP & TIM AHLI
          ...renderExpertTeam(settings, proyek),
        ],
      },
    ],
  });

  if (onProgress) onProgress(95, 'Finalisasi dokumen...');

  const blob = await Packer.toBlob(doc);
  const tanggal = new Date().toISOString().split('T')[0];
  const fileName = `SLF_${safeText(proyek.nama_bangunan).replace(/\s+/g, '_')}_${tanggal}.docx`;

  return { blob, fileName };
}

// ============================================================
//  COVER PAGE
// ============================================================
function renderCover(proyek, settings) {
  return [
    // Top spacer
    ...Array(4).fill(null).map(() => new Paragraph({ spacing: { before: 400 } })),

    // Consultant Logo (Placeholder logic for now)
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
      children: [new TextRun({
        text: 'LOGO KONSULTAN',
        size: 24, bold: true, color: COLOR_MUTED, font: FONT_MAIN, italics: true
      })]
    }),

    // Header line
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
      children: [new TextRun({
        text: '________________________________________',
        size: 24, color: COLOR_HEADING, font: FONT_MAIN
      })]
    }),

    // Main title
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 400, after: 100 },
      children: [new TextRun({
        text: 'LAPORAN', size: 40, bold: true, color: COLOR_HEADING, font: FONT_MAIN
      })]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
      children: [new TextRun({
        text: 'PENILAIAN KELAIKAN FUNGSI', size: 36, bold: true, color: COLOR_HEADING, font: FONT_MAIN
      })]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [new TextRun({
        text: 'BANGUNAN GEDUNG', size: 36, bold: true, color: COLOR_HEADING, font: FONT_MAIN
      })]
    }),

    // Separator
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 100, after: 200 },
      children: [new TextRun({
        text: '________________________________________',
        size: 24, color: COLOR_HEADING, font: FONT_MAIN
      })]
    }),

    // Building name
    new Paragraph({ spacing: { before: 600 } }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
      children: [new TextRun({
        text: safeText(proyek.nama_bangunan).toUpperCase(),
        size: 32, bold: true, color: COLOR_PRIMARY, font: FONT_MAIN
      })]
    }),

    // Location
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [new TextRun({
        text: safeText(proyek.alamat || ''),
        size: 24, color: COLOR_SUBHEADING, font: FONT_MAIN
      })]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [new TextRun({
        text: `${safeText(proyek.kota || '')}, ${safeText(proyek.provinsi || '')}`,
        size: 24, color: COLOR_SUBHEADING, font: FONT_MAIN
      })]
    }),

    // Spacer
    ...Array(4).fill(null).map(() => new Paragraph({ spacing: { before: 400 } })),

    // Owner
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
      children: [new TextRun({
        text: 'Diajukan oleh:', size: FONT_SIZE_SMALL, color: COLOR_MUTED, font: FONT_MAIN
      })]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [new TextRun({
        text: safeText(proyek.pemilik || 'N/A').toUpperCase(),
        size: 28, bold: true, color: COLOR_PRIMARY, font: FONT_MAIN
      })]
    }),

    // Date & Year
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 100 },
      children: [new TextRun({
        text: formatTanggal(new Date()),
        size: FONT_SIZE_BODY, color: COLOR_MUTED, font: FONT_MAIN
      })]
    }),

    // Footer
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 600 },
      children: [new TextRun({
        text: 'Ditetapkan Dan Diterbitkan oleh:',
        size: FONT_SIZE_SMALL, color: COLOR_MUTED, font: FONT_MAIN
      })]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 100 },
      children: [new TextRun({
        text: settings.consultant.name.toUpperCase(),
        size: 32, bold: true, color: COLOR_HEADING, font: FONT_MAIN
      })]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 60 },
      children: [new TextRun({
        text: 'Smart AI Pengkaji SLF v1.0',
        size: FONT_SIZE_SMALL, color: COLOR_MUTED, font: FONT_MAIN, italics: true
      })]
    }),
  ];
}

/**
 * HALAMAN TIM TENAGA AHLI & TANDA TANGAN
 */
function renderExpertTeam(settings, proyek) {
  const rows = [];
  
  // Headers
  rows.push(new TableRow({
    children: [
      headerCell('NO', 10),
      headerCell('NAMA TENAGA AHLI', 60),
      headerCell('TANDA TANGAN', 30),
    ]
  }));

  // Data (Handling as Object)
  Object.entries(settings.experts).forEach(([type, exp], idx) => {
    const roleLabel = type === 'architecture' ? 'Bidang Arsitektur' : type === 'structure' ? 'Bidang Struktur' : 'Bidang MEP';
    rows.push(new TableRow({
      children: [
        dataCell(String(idx + 1), 10, { center: true }),
        new TableCell({
          width: { size: 60, type: WidthType.PERCENTAGE },
          margins: { top: 100, bottom: 100, left: 100, right: 100 },
          children: [
            new Paragraph({
              children: [new TextRun({ text: safeText(exp.name || 'NAMA AHLI'), bold: true, size: FONT_SIZE_BODY, font: FONT_MAIN })]
            }),
            new Paragraph({
              children: [
                new TextRun({ text: `${roleLabel}  |  SKA/SKK: ${safeText(exp.skk || exp.ska || '-')}`, size: FONT_SIZE_SMALL, font: FONT_MAIN, color: COLOR_MUTED }),
              ]
            }),
          ]
        }),
        new TableCell({
          width: { size: 30, type: WidthType.PERCENTAGE },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ text: "TTE VERIFIED", size: 14, bold: true, color: COLOR_SUCCESS }),
                new dx.Break(),
                new TextRun({ text: "Digital Certificate", size: 10, color: COLOR_MUTED, italics: true })
              ]
            })
          ],
          verticalAlign: VerticalAlign.CENTER
        })
      ]
    }));
  });

  return [
    heading1('TIM TENAGA AHLI PENGKAJI TEKNIS'),
    bodyText(`Laporan kajian teknis kelaikan fungsi bangunan gedung ${proyek.nama_bangunan} ini disusun dan dipertanggungjawabkan oleh Tim Tenaga Ahli ${settings.consultant.name} sebagai berikut:`),
    
    emptyLine(),
    
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: createTableBorders(),
      rows: rows
    }),
    
    emptyLine(),
    bodyText(`Ditetapkan di: ${proyek.kota || 'Jakarta'}`),
    bodyText(`Tanggal: ${formatTanggal(new Date())}`),
    
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: 'Mengetahui & Mengesahkan,', size: FONT_SIZE_BODY, font: FONT_MAIN }),
        new dx.Break(),
        new TextRun({ text: settings.consultant.name.toUpperCase(), bold: true, size: FONT_SIZE_BODY, font: FONT_MAIN }),
      ]
    }),

    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: dx.TableBorders.NONE,
      rows: [
        new TableRow({
          children: [
            // e-Materai Placeholder
            new TableCell({
              width: { size: 40, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({ text: "MATERAI ELEKTRONIK", size: 12, bold: true, color: "3b82f6" }),
                    new dx.Break(),
                    new TextRun({ text: "TTE VERIFIED", size: 10, color: "1e40af" }),
                  ],
                  border: {
                    top: { style: BorderStyle.SINGLE, size: 1, color: "3b82f6" },
                    bottom: { style: BorderStyle.SINGLE, size: 1, color: "3b82f6" },
                    left: { style: BorderStyle.SINGLE, size: 1, color: "3b82f6" },
                    right: { style: BorderStyle.SINGLE, size: 1, color: "3b82f6" },
                  },
                  shading: { fill: "eff6ff" },
                  spacing: { before: 200, after: 200 }
                })
              ],
              verticalAlign: VerticalAlign.CENTER
            }),
            // Signature Space
            new TableCell({
              width: { size: 60, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Tanda Tangan Elektronik", size: 11, italics: true, color: "666666" })], spacing: { before: 600 } }),
              ]
            })
          ]
        })
      ]
    }),

    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: (settings.consultant?.director_name || 'NAMA DIREKTUR').toUpperCase(), bold: true, size: FONT_SIZE_BODY, font: FONT_MAIN, underline: {} }),
        new dx.Break(),
        new TextRun({ text: settings.consultant?.director_job || 'Direktur', size: FONT_SIZE_SMALL, font: FONT_MAIN, color: COLOR_MUTED }),
      ]
    }),
    
    emptyLine(),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: `ID Dokumen: ${proyek.id.toUpperCase()}`, size: 14, font: FONT_MAIN, color: "888888" }),
      ]
    }),
  ];
}

// ============================================================
//  BAB I: GAMBARAN UMUM
// ============================================================
function renderBab1(proyek) {
  const dataRows = [
    ['Nama Bangunan', proyek.nama_bangunan || '-'],
    ['Jenis Bangunan', proyek.jenis_bangunan || '-'],
    ['Fungsi Bangunan', proyek.fungsi_bangunan || '-'],
    ['Alamat Lokasi', `${proyek.alamat || '-'}, ${proyek.kota || '-'}, ${proyek.provinsi || '-'}`],
    ['Nama Pemilik', proyek.pemilik || '-'],
    ['Tahun Dibangun', String(proyek.tahun_dibangun || '-')],
    ['Jumlah Lantai', `${proyek.jumlah_lantai || '-'} Lantai`],
    ['Luas Bangunan', proyek.luas_bangunan ? `${Number(proyek.luas_bangunan).toLocaleString('id-ID')} m2` : '-'],
    ['Luas Lahan', proyek.luas_lahan ? `${Number(proyek.luas_lahan).toLocaleString('id-ID')} m2` : '-'],
    ['Konstruksi Utama', proyek.jenis_konstruksi || '-'],
    ['Nomor PBG/IMB', proyek.nomor_pbg || 'Belum tersedia'],
  ];

  return [
    heading1('BAB I: GAMBARAN UMUM'),

    heading2('1.1. Latar Belakang'),
    bodyText('Penilaian kelaikan fungsi bangunan gedung merupakan kewajiban yang diamanatkan dalam Peraturan Pemerintah Nomor 16 Tahun 2021 tentang Peraturan Pelaksanaan Undang-Undang Nomor 28 Tahun 2002 tentang Bangunan Gedung. Penilaian ini bertujuan untuk memastikan bahwa bangunan gedung memenuhi persyaratan teknis yang mencakup aspek keselamatan, kesehatan, kenyamanan, dan kemudahan.'),
    bodyText('Sertifikat Laik Fungsi (SLF) diterbitkan sebagai bukti formal bahwa bangunan gedung telah memenuhi persyaratan kelaikan fungsi dan layak untuk digunakan sesuai dengan fungsi yang ditetapkan. Kajian ini dilakukan untuk mengevaluasi kondisi eksisting bangunan secara menyeluruh berdasarkan standar teknis yang berlaku.'),

    heading2('1.2. Maksud dan Tujuan'),
    bodyText('Maksud dari kajian ini adalah:'),
    numberedItem('1', 'Menilai kelengkapan dokumen administratif bangunan gedung.'),
    numberedItem('2', 'Mengevaluasi kondisi teknis eksisting bangunan gedung terhadap persyaratan standar.'),
    numberedItem('3', 'Menentukan kelayakan fungsi bangunan gedung untuk penerbitan atau perpanjangan SLF.'),
    numberedItem('4', 'Menyusun rekomendasi teknis untuk perbaikan atau peningkatan kinerja bangunan.'),

    heading2('1.3. Ruang Lingkup'),
    bodyText('Ruang lingkup kajian meliputi aspek-aspek berikut:'),
    bulletItem('Administrasi: Kelengkapan dokumen perizinan (PBG/IMB, SLF, as-built drawing, dll).'),
    bulletItem('Struktur: Evaluasi kondisi elemen struktur (kolom, balok, pelat, pondasi).'),
    bulletItem('Arsitektur: Penilaian selubung bangunan, tata ruang, dan finishing.'),
    bulletItem('MEP (Mekanikal, Elektrikal, Plumbing): Audit instalasi utilitas bangunan.'),
    bulletItem('Keselamatan Kebakaran: Proteksi aktif dan pasif terhadap bahaya kebakaran.'),
    bulletItem('Kesehatan, Kenyamanan, dan Kemudahan: Aspek K3 bangunan gedung.'),

    heading2('1.4. Dasar Hukum'),
    bulletItem('Undang-Undang Nomor 28 Tahun 2002 tentang Bangunan Gedung.'),
    bulletItem('Peraturan Pemerintah Nomor 16 Tahun 2021 tentang Peraturan Pelaksanaan UU No. 28/2002.'),
    bulletItem('SNI 9273:2025 - Evaluasi dan Rehabilitasi Seismik Bangunan Gedung Eksisting.'),
    bulletItem('ASCE/SEI 41-17 - Seismic Evaluation and Retrofit of Existing Buildings.'),
    bulletItem('Peraturan Menteri PUPR terkait Persyaratan Teknis Bangunan Gedung.'),

    heading2('1.5. Data Umum Bangunan'),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: createTableBorders(),
      rows: dataRows.map((row, idx) => new TableRow({
        children: [
          dataCell(row[0], 35, { bold: true, shading: idx % 2 === 0 ? COLOR_TABLE_ALT : undefined }),
          dataCell(row[1], 65, { shading: idx % 2 === 0 ? COLOR_TABLE_ALT : undefined }),
        ],
      })),
    }),
  ];
}

// ============================================================
//  BAB II: METODOLOGI
// ============================================================
function renderBab2() {
  return [
    heading1('BAB II: METODOLOGI PEMERIKSAAN'),

    heading2('2.1. Pendekatan Analisis'),
    bodyText('Kajian teknis bangunan gedung ini dilakukan menggunakan pendekatan multi-layer yang mengintegrasikan beberapa metode evaluasi:'),
    numberedItem('1', 'Rule-based Analysis: Evaluasi berbasis aturan mengacu pada Norma, Standar, Pedoman, dan Kriteria (NSPK) yang berlaku di Indonesia, khususnya PP No. 16 Tahun 2021 dan peraturan turunannya.'),
    numberedItem('2', 'Risk-based Assessment: Penilaian berbasis risiko yang mengidentifikasi dampak potensial dari ketidaksesuaian terhadap keselamatan, kesehatan, dan keberlanjutan operasional bangunan.'),
    numberedItem('3', 'Performance-based Evaluation: Evaluasi berbasis kinerja mengacu pada SNI 9273:2025 dan ASCE/SEI 41-17 untuk menentukan level kinerja struktur (IO, LS, CP).'),
    numberedItem('4', 'AI-based Deep Reasoning: Analisis mendalam menggunakan engine kecerdasan buatan (Smart AI Pengkaji SLF) yang telah dilatih dengan basis pengetahuan teknis PUPR.'),

    heading2('2.2. Sumber Data'),
    bodyText('Data yang digunakan dalam analisis diperoleh dari:'),
    bulletItem('Dokumen administratif yang diunggah pemilik/pengelola bangunan.'),
    bulletItem('Hasil pemeriksaan visual lapangan (visual assessment).'),
    bulletItem('Data checklist pemeriksaan yang diisi oleh tim pemeriksa.'),
    bulletItem('Hasil pengujian material (jika tersedia): hammer test, UPV, core drill.'),
    bulletItem('Database regulasi dan standar teknis PUPR yang terintegrasi dalam sistem AI.'),

    heading2('2.3. Metode Penilaian'),
    bodyText('Penilaian dilakukan dengan sistem skoring kuantitatif (0-100) untuk setiap aspek kelaikan fungsi. Klasifikasi status kelaikan berdasarkan hasil evaluasi:'),

    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: createTableBorders(),
      rows: [
        new TableRow({
          children: [
            headerCell('SKOR', 20),
            headerCell('STATUS KELAIKAN', 40),
            headerCell('KETERANGAN', 40),
          ],
        }),
        new TableRow({
          children: [
            dataCell('>= 80', 20, { center: true, bold: true, color: COLOR_SUCCESS }),
            dataCell('Laik Fungsi', 40, { bold: true, color: COLOR_SUCCESS }),
            dataCell('Bangunan memenuhi seluruh persyaratan teknis.', 40),
          ],
        }),
        new TableRow({
          children: [
            dataCell('60 - 79', 20, { center: true, bold: true, color: COLOR_WARNING }),
            dataCell('Laik Fungsi Bersyarat', 40, { bold: true, color: COLOR_WARNING }),
            dataCell('Terdapat ketidaksesuaian minor yang perlu ditindaklanjuti.', 40, { shading: COLOR_TABLE_ALT }),
          ],
        }),
        new TableRow({
          children: [
            dataCell('< 60', 20, { center: true, bold: true, color: COLOR_DANGER }),
            dataCell('Tidak Laik Fungsi', 40, { bold: true, color: COLOR_DANGER }),
            dataCell('Ditemukan ketidaksesuaian kritis terhadap standar keselamatan.', 40),
          ],
        }),
      ],
    }),

    heading2('2.4. Alur Analisis AI'),
    bodyText('Proses audit mengikuti alur evaluasi sistematis sebagai berikut:'),
    bodyText('Input Data  -->  Validasi Data  -->  Analisis Rule-based  -->  Deep Reasoning AI  -->  Skoring per Aspek  -->  Kesimpulan & Rekomendasi', { bold: true }),
    bodyText('Setiap tahap dilengkapi dengan mekanisme validasi dan cross-check untuk memastikan konsistensi dan akurasi output analisis.', { italics: true }),

    heading2('2.5. Bobot Penilaian per Aspek'),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: createTableBorders(),
      rows: [
        new TableRow({
          children: [
            headerCell('NO', 10), headerCell('ASPEK', 50), headerCell('BOBOT (%)', 20), headerCell('ACUAN STANDAR', 20),
          ],
        }),
        ...([
          ['1', 'Administrasi', '10', 'PP 16/2021'],
          ['2', 'Struktur', '25', 'SNI 9273:2025'],
          ['3', 'Arsitektur', '10', 'NSPK BG'],
          ['4', 'MEP (Utilitas)', '15', 'SNI PUIL/Plumbing'],
          ['5', 'Keselamatan Kebakaran', '20', 'Permen PU 26/2008'],
          ['6', 'Kesehatan', '8', 'Permen PUPR 14/2017'],
          ['7', 'Kenyamanan', '6', 'SNI Kenyamanan'],
          ['8', 'Kemudahan', '6', 'Permen PU 30/2006'],
        ].map((r, idx) => new TableRow({
          children: [
            dataCell(r[0], 10, { center: true, shading: idx % 2 === 0 ? COLOR_TABLE_ALT : undefined }),
            dataCell(r[1], 50, { shading: idx % 2 === 0 ? COLOR_TABLE_ALT : undefined }),
            dataCell(r[2], 20, { center: true, bold: true, shading: idx % 2 === 0 ? COLOR_TABLE_ALT : undefined }),
            dataCell(r[3], 20, { italics: true, color: COLOR_MUTED, shading: idx % 2 === 0 ? COLOR_TABLE_ALT : undefined }),
          ],
        }))),
      ],
    }),
  ];
}

// ============================================================
//  BAB III: HASIL CHECKLIST
// ============================================================
function renderBab3(checklist) {
  const adminItems = (checklist || []).filter(c => c.kategori === 'administrasi');
  const teknisItems = (checklist || []).filter(c => c.kategori === 'teknis');

  const buildChecklistTable = (items) => {
    if (!items || items.length === 0) {
      return [bodyText('Data checklist tidak tersedia.', { italics: true, color: COLOR_MUTED })];
    }
    return [new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: createTableBorders(),
      rows: [
        new TableRow({
          children: [
            headerCell('KODE', 12),
            headerCell('ITEM PEMERIKSAAN', 38),
            headerCell('STATUS', 18),
            headerCell('CATATAN TEKNIS', 32),
          ],
        }),
        ...items.map((item, idx) => new TableRow({
          children: [
            dataCell(item.kode || '-', 12, { center: true, bold: true, size: FONT_SIZE_SMALL, shading: idx % 2 === 0 ? COLOR_TABLE_ALT : undefined }),
            dataCell(item.nama || '-', 38, { shading: idx % 2 === 0 ? COLOR_TABLE_ALT : undefined }),
            dataCell(getStatusLabel(item.status), 18, {
              center: true,
              bold: true,
              color: ['baik', 'ada_sesuai'].includes(item.status) ? COLOR_SUCCESS
                   : ['buruk', 'kritis', 'tidak_ada', 'ada_tidak_sesuai'].includes(item.status) ? COLOR_DANGER
                   : COLOR_WARNING,
              shading: idx % 2 === 0 ? COLOR_TABLE_ALT : undefined,
            }),
            dataCell(item.catatan || '-', 32, { size: FONT_SIZE_SMALL, shading: idx % 2 === 0 ? COLOR_TABLE_ALT : undefined }),
          ],
        })),
      ],
    })];
  };

  return [
    heading1('BAB III: HASIL PEMERIKSAAN CHECKLIST'),
    bodyText('Berikut adalah hasil pemeriksaan kelengkapan dokumen dan kondisi teknis bangunan gedung yang dirangkum berdasarkan data input pemeriksaan lapangan.'),

    heading2('3.1. Checklist Dokumen Administrasi'),
    bodyText(`Total item administrasi yang diperiksa: ${adminItems.length} item.`),
    ...buildChecklistTable(adminItems),

    emptyLine(),
    heading2('3.2. Checklist Kondisi Teknis Eksisting'),
    bodyText(`Total item teknis yang diperiksa: ${teknisItems.length} item.`),
    ...buildChecklistTable(teknisItems),
  ];
}

// ============================================================
//  BAB IV: ANALISIS AI (INTI LAPORAN)
// ============================================================
function renderBab4(analisis, checklist) {
  if (!analisis) {
    return [
      heading1('BAB IV: ANALISIS AI'),
      bodyText('Analisis belum dilakukan. Jalankan analisis AI terlebih dahulu.', { italics: true }),
    ];
  }

  const skorAspek = [
    { label: 'Administrasi', skor: analisis.skor_administrasi, bobot: 10 },
    { label: 'Struktur', skor: analisis.skor_struktur, bobot: 25 },
    { label: 'Arsitektur', skor: analisis.skor_arsitektur, bobot: 10 },
    { label: 'MEP (Utilitas)', skor: analisis.skor_mep, bobot: 15 },
    { label: 'Keselamatan Kebakaran', skor: analisis.skor_kebakaran, bobot: 20 },
    { label: 'Kesehatan', skor: analisis.skor_kesehatan, bobot: 8 },
    { label: 'Kenyamanan', skor: analisis.skor_kenyamanan, bobot: 6 },
    { label: 'Kemudahan', skor: analisis.skor_kemudahan, bobot: 6 },
  ];

  // Count statuses
  const allItems = checklist || [];
  const sesuaiCount = allItems.filter(i => ['ada_sesuai', 'baik'].includes(i.status)).length;
  const tidakSesuaiCount = allItems.filter(i => ['ada_tidak_sesuai', 'buruk', 'kritis'].includes(i.status)).length;
  const tidakAdaCount = allItems.filter(i => ['tidak_ada'].includes(i.status)).length;

  const result = [
    heading1('BAB IV: ANALISIS AI (INTI LAPORAN)'),
    bodyText(`Berdasarkan pemrosesan data checklist menggunakan engine AI (${safeText(analisis.ai_provider || 'Smart AI')}), berikut adalah hasil analisis mendalam terhadap setiap aspek kelaikan fungsi bangunan gedung.`),

    // Ringkasan Analisis
    heading2('4.1. Ringkasan Hasil Analisis'),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: createTableBorders(),
      rows: [
        new TableRow({
          children: [
            headerCell('PARAMETER', 50),
            headerCell('NILAI', 50),
          ],
        }),
        new TableRow({ children: [
          dataCell('Total Item Diperiksa', 50, { bold: true }),
          dataCell(`${allItems.length} item`, 50, { center: true }),
        ]}),
        new TableRow({ children: [
          dataCell('Item Sesuai / Baik', 50, { bold: true, shading: COLOR_TABLE_ALT }),
          dataCell(`${sesuaiCount} item`, 50, { center: true, color: COLOR_SUCCESS, bold: true, shading: COLOR_TABLE_ALT }),
        ]}),
        new TableRow({ children: [
          dataCell('Item Tidak Sesuai / Buruk', 50, { bold: true }),
          dataCell(`${tidakSesuaiCount} item`, 50, { center: true, color: COLOR_DANGER, bold: true }),
        ]}),
        new TableRow({ children: [
          dataCell('Item Tidak Ada', 50, { bold: true, shading: COLOR_TABLE_ALT }),
          dataCell(`${tidakAdaCount} item`, 50, { center: true, color: COLOR_WARNING, bold: true, shading: COLOR_TABLE_ALT }),
        ]}),
        new TableRow({ children: [
          dataCell('Skor Kepatuhan Total', 50, { bold: true }),
          dataCell(`${analisis.skor_total || 0}%`, 50, { center: true, bold: true, size: FONT_SIZE_H2 }),
        ]}),
        new TableRow({ children: [
          dataCell('Level Risiko', 50, { bold: true, shading: COLOR_TABLE_ALT }),
          dataCell(getRiskLabel(analisis.risk_level).toUpperCase(), 50, {
            center: true, bold: true, shading: COLOR_TABLE_ALT,
            color: analisis.risk_level === 'low' ? COLOR_SUCCESS
                 : analisis.risk_level === 'high' || analisis.risk_level === 'critical' ? COLOR_DANGER
                 : COLOR_WARNING
          }),
        ]}),
      ],
    }),

    emptyLine(),

    // Skor per aspek
    heading2('4.2. Skor Per Aspek Kelaikan Fungsi'),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: createTableBorders(),
      rows: [
        new TableRow({
          children: [
            headerCell('NO', 8),
            headerCell('ASPEK', 32),
            headerCell('BOBOT (%)', 15),
            headerCell('SKOR (0-100)', 20),
            headerCell('KATEGORI', 25),
          ],
        }),
        ...skorAspek.map((a, idx) => {
          const skor = a.skor || 0;
          const kategori = skor >= 80 ? 'Baik' : skor >= 60 ? 'Cukup' : skor >= 40 ? 'Perlu Perbaikan' : 'Kritis';
          const color = skor >= 80 ? COLOR_SUCCESS : skor >= 60 ? COLOR_WARNING : COLOR_DANGER;
          return new TableRow({
            children: [
              dataCell(String(idx + 1), 8, { center: true, shading: idx % 2 === 0 ? COLOR_TABLE_ALT : undefined }),
              dataCell(a.label, 32, { shading: idx % 2 === 0 ? COLOR_TABLE_ALT : undefined }),
              dataCell(String(a.bobot), 15, { center: true, shading: idx % 2 === 0 ? COLOR_TABLE_ALT : undefined }),
              dataCell(String(skor), 20, { center: true, bold: true, color, shading: idx % 2 === 0 ? COLOR_TABLE_ALT : undefined }),
              dataCell(kategori.toUpperCase(), 25, { center: true, bold: true, color, shading: idx % 2 === 0 ? COLOR_TABLE_ALT : undefined }),
            ],
          });
        }),
      ],
    }),

    emptyLine(),
  ];

  // Narasi Teknis AI
  if (analisis.narasi_teknis) {
    result.push(heading2('4.3. Analisis Mendalam per Item'));
    
    // Gunakan formatter profesional baru
    try {
      const parsedData = getStructuredDataForDocx(analisis.narasi_teknis);

      if (parsedData && parsedData.items && parsedData.items.length > 0) {
        
        // 1. Render Summary if any
        if (parsedData.summary && parsedData.summary.temuanKritis) {
          result.push(heading3('Ringkasan Temuan Kritis'));
          result.push(bodyText(parsedData.summary.temuanKritis));
          result.push(emptyLine());
        }

        // 2. Render Items
        parsedData.items.forEach(item => {
          // Item Header
          result.push(new Paragraph({
            spacing: { before: 200, after: 100 },
            children: [
              new TextRun({ 
                text: `${item.kode ? item.kode + ' - ' : ''}${item.nama}`, 
                bold: true, 
                size: FONT_SIZE_H3, 
                color: COLOR_PRIMARY 
              })
            ]
          }));

          // Item Content Table
          result.push(new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: createTableBorders(),
            rows: [
              // Status & Risk Level
              new TableRow({
                children: [
                  dataCell('Status Kepatuhan', 25, { bold: true, shading: COLOR_TABLE_ALT }),
                  dataCell(item.status || '-', 75, { 
                    bold: true, 
                    color: item.riskLevel === 'critical' || item.riskLevel === 'high' ? COLOR_DANGER : 
                           item.riskLevel === 'low' ? COLOR_SUCCESS : COLOR_WARNING 
                  }),
                ]
              }),
              // Analisis
              new TableRow({
                children: [
                  dataCell('Temuan & Analisis', 25, { bold: true }),
                  new TableCell({
                    width: { size: 75, type: WidthType.PERCENTAGE },
                    margins: { top: 100, bottom: 100, left: 100, right: 100 },
                    borders: { left: { size: 1, color: COLOR_BORDER, style: BorderStyle.SINGLE } },
                    children: [
                      new Paragraph({
                        text: item.analisis ? safeText(item.analisis) : '-',
                        size: FONT_SIZE_BODY,
                        font: FONT_MAIN,
                        alignment: AlignmentType.JUSTIFIED,
                      })
                    ]
                  })
                ]
              }),
              // Dasar Hukum
              new TableRow({
                children: [
                  dataCell('Standar Acuan', 25, { bold: true, shading: COLOR_TABLE_ALT }),
                  new TableCell({
                    width: { size: 75, type: WidthType.PERCENTAGE },
                    margins: { top: 100, bottom: 100, left: 100, right: 100 },
                    shading: { fill: COLOR_TABLE_ALT, type: ShadingType.CLEAR },
                    borders: { left: { size: 1, color: COLOR_BORDER, style: BorderStyle.SINGLE } },
                    children: [
                      new Paragraph({
                        text: item.dasarHukum ? safeText(item.dasarHukum) : '-',
                        size: FONT_SIZE_BODY,
                        font: FONT_MAIN,
                        alignment: AlignmentType.JUSTIFIED,
                      })
                    ]
                  })
                ]
              }),
              // Dampak Risiko
              new TableRow({
                children: [
                  dataCell('Dampak Risiko', 25, { bold: true }),
                  new TableCell({
                    width: { size: 75, type: WidthType.PERCENTAGE },
                    margins: { top: 100, bottom: 100, left: 100, right: 100 },
                    borders: { left: { size: 1, color: COLOR_BORDER, style: BorderStyle.SINGLE } },
                    children: [
                      new Paragraph({
                        text: item.risiko ? safeText(item.risiko) : '-',
                        size: FONT_SIZE_BODY,
                        font: FONT_MAIN,
                        alignment: AlignmentType.JUSTIFIED,
                      })
                    ]
                  })
                ]
              }),
              // Rekomendasi
              new TableRow({
                children: [
                  dataCell('Rekomendasi', 25, { bold: true, shading: COLOR_TABLE_ALT }),
                  new TableCell({
                    width: { size: 75, type: WidthType.PERCENTAGE },
                    margins: { top: 100, bottom: 100, left: 100, right: 100 },
                    shading: { fill: COLOR_TABLE_ALT, type: ShadingType.CLEAR },
                    borders: { left: { size: 1, color: COLOR_BORDER, style: BorderStyle.SINGLE } },
                    children: [
                      new Paragraph({
                        text: item.rekomendasi ? safeText(item.rekomendasi) : '-',
                        size: FONT_SIZE_BODY,
                        font: FONT_MAIN,
                        alignment: AlignmentType.JUSTIFIED,
                      })
                    ]
                  })
                ]
              })
            ]
          }));
          result.push(emptyLine());
        });

      } else {
        // Fallback ke raw markdown
        result.push(bodyText('Berikut adalah narasi teknis hasil analisis AI untuk setiap aspek yang telah dievaluasi:'));
        result.push(emptyLine());
        result.push(...renderMarkdownToDocx(analisis.narasi_teknis));
      }
    } catch (e) {
      console.error('Error formatting docx narrative:', e);
      result.push(...renderMarkdownToDocx(analisis.narasi_teknis));
    }
  }

  return result;
}

// ============================================================
//  BAB V: KESIMPULAN
// ============================================================
function renderBab5(analisis, proyek) {
  const statusText = getStatusSLFLabel(analisis?.status_slf);
  const skor = analisis?.skor_total || 0;

  let interpretasi = '';
  if (analisis?.status_slf === 'LAIK_FUNGSI') {
    interpretasi = `Berdasarkan hasil evaluasi mendalam terhadap seluruh aspek kelaikan fungsi, bangunan gedung "${safeText(proyek.nama_bangunan)}" dinyatakan memenuhi persyaratan teknis sesuai PP No. 16 Tahun 2021. Skor kepatuhan total mencapai ${skor}/100 yang mengindikasikan kesiapan operasional penuh. Bangunan dapat dioperasikan dan diterbitkan Sertifikat Laik Fungsi (SLF).`;
  } else if (analisis?.status_slf === 'LAIK_FUNGSI_BERSYARAT') {
    interpretasi = `Berdasarkan hasil evaluasi mendalam, bangunan gedung "${safeText(proyek.nama_bangunan)}" dinyatakan layak secara bersyarat dengan skor kepatuhan ${skor}/100. Terdapat beberapa ketidaksesuaian minor yang tidak mempengaruhi keselamatan utama namun perlu ditindaklanjuti dalam jangka waktu yang ditentukan. Bangunan dapat beroperasi dengan catatan harus menyelesaikan rekomendasi perbaikan.`;
  } else {
    interpretasi = `Berdasarkan hasil evaluasi mendalam, bangunan gedung "${safeText(proyek.nama_bangunan)}" BELUM memenuhi persyaratan kelaikan fungsi dengan skor kepatuhan ${skor}/100. Ditemukan ketidaksesuaian kritis yang berpotensi membahayakan keselamatan penghuni. Bangunan TIDAK DAPAT diterbitkan SLF sampai seluruh temuan kritis ditindaklanjuti melalui program rehabilitasi/retrofit.`;
  }

  return [
    heading1('BAB V: KESIMPULAN'),

    heading2('5.1. Status Kelaikan Fungsi'),
    bodyText(interpretasi),

    emptyLine(),

    // Status box
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: createTableBorders(),
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 100, type: WidthType.PERCENTAGE },
              shading: { fill: COLOR_HEADER_BG, type: ShadingType.CLEAR },
              margins: { top: 200, bottom: 200, left: 200, right: 200 },
              verticalAlign: VerticalAlign.CENTER,
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({
                    text: `STATUS: ${statusText}`,
                    bold: true,
                    size: FONT_SIZE_H1,
                    font: FONT_MAIN,
                    color: analisis?.status_slf === 'LAIK_FUNGSI' ? COLOR_SUCCESS
                         : analisis?.status_slf === 'LAIK_FUNGSI_BERSYARAT' ? COLOR_WARNING
                         : COLOR_DANGER
                  })]
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  spacing: { before: 100 },
                  children: [new TextRun({
                    text: `Skor Kepatuhan: ${skor}/100  |  Risiko: ${getRiskLabel(analisis?.risk_level).toUpperCase()}`,
                    size: FONT_SIZE_H3,
                    font: FONT_MAIN,
                    color: COLOR_SUBHEADING
                  })]
                })
              ]
            }),
          ],
        }),
      ],
    }),

    emptyLine(),

    heading2('5.2. Interpretasi Skor'),
    bodyText(`Skor total ${skor}/100 diperoleh dari perhitungan rata-rata berbobot seluruh aspek kelaikan fungsi. Evaluasi ini bersifat indikatif berdasarkan data yang tersedia dan harus dikonfirmasi oleh tenaga ahli pengkaji bangunan gedung yang bersertifikat sebelum diterbitkan Sertifikat Laik Fungsi resmi dari instansi berwenang.`),
  ];
}

// ============================================================
//  BAB VI: REKOMENDASI
// ============================================================
function renderBab6(analisis) {
  let rekomendasi = [];
  try {
    rekomendasi = typeof analisis?.rekomendasi === 'string'
      ? JSON.parse(analisis.rekomendasi)
      : (analisis?.rekomendasi || []);
  } catch (e) {}

  const p1 = rekomendasi.filter(r => ['kritis', 'tinggi'].includes(r.prioritas?.toLowerCase()));
  const p2 = rekomendasi.filter(r => r.prioritas?.toLowerCase() === 'sedang');
  const p3 = rekomendasi.filter(r => r.prioritas?.toLowerCase() === 'rendah');

  const renderGroup = (title, items, prioritasLabel) => {
    if (items.length === 0) return [];
    const result = [heading3(title)];

    // Tabel rekomendasi terstruktur
    result.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: createTableBorders(),
      rows: [
        new TableRow({
          children: [
            headerCell('NO', 8),
            headerCell('ASPEK', 15),
            headerCell('TINDAKAN', 47),
            headerCell('STANDAR ACUAN', 15),
            headerCell('PRIORITAS', 15),
          ],
        }),
        ...items.map((r, idx) => new TableRow({
          children: [
            dataCell(String(idx + 1), 8, { center: true, shading: idx % 2 === 0 ? COLOR_TABLE_ALT : undefined }),
            dataCell(safeText(r.aspek || '-'), 15, { bold: true, shading: idx % 2 === 0 ? COLOR_TABLE_ALT : undefined }),
            dataCell(safeText(`${r.judul || ''}: ${r.tindakan || ''}`), 47, { shading: idx % 2 === 0 ? COLOR_TABLE_ALT : undefined }),
            dataCell(safeText(r.standar || '-'), 15, { italics: true, color: COLOR_MUTED, shading: idx % 2 === 0 ? COLOR_TABLE_ALT : undefined }),
            dataCell(safeText(r.prioritas || '-').toUpperCase(), 15, {
              center: true, bold: true,
              color: ['kritis', 'tinggi'].includes(r.prioritas?.toLowerCase()) ? COLOR_DANGER : r.prioritas?.toLowerCase() === 'sedang' ? COLOR_WARNING : COLOR_SUCCESS,
              shading: idx % 2 === 0 ? COLOR_TABLE_ALT : undefined,
            }),
          ],
        })),
      ],
    }));

    return result;
  };

  const result = [
    heading1('BAB VI: REKOMENDASI'),
    bodyText('Berdasarkan hasil analisis dan evaluasi mendalam terhadap seluruh aspek kelaikan fungsi bangunan, disusun rekomendasi teknis berikut ini yang dikelompokkan berdasarkan tingkat prioritas pelaksanaan.'),
    bodyText(`Total rekomendasi: ${rekomendasi.length} item.`),

    ...renderGroup('Prioritas 1: URGENT (Kritis/Tinggi)', p1, 'Kritis'),
    ...renderGroup('Prioritas 2: Jangka Pendek (Sedang)', p2, 'Sedang'),
    ...renderGroup('Prioritas 3: Jangka Menengah (Rendah)', p3, 'Rendah'),
  ];

  if (rekomendasi.length === 0) {
    result.push(bodyText('Tidak ditemukan temuan kritis yang memerlukan tindakan prioritas. Bangunan dalam kondisi memadai.'));
  }

  // Tanda tangan
  result.push(emptyLine());
  result.push(emptyLine());
  result.push(horizontalLine());
  result.push(new Paragraph({
    alignment: AlignmentType.RIGHT,
    spacing: { after: 60 },
    children: [new TextRun({
      text: 'Dianalisis dan disusun oleh,',
      size: FONT_SIZE_BODY, font: FONT_MAIN
    })]
  }));
  result.push(new Paragraph({
    alignment: AlignmentType.RIGHT,
    spacing: { after: 60 },
    children: [new TextRun({
      text: 'Tim Pengkaji Teknis Bangunan Gedung',
      size: FONT_SIZE_BODY, font: FONT_MAIN, bold: true
    })]
  }));
  result.push(emptyLine());
  result.push(emptyLine());
  result.push(emptyLine());
  result.push(new Paragraph({
    alignment: AlignmentType.RIGHT,
    border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: COLOR_PRIMARY } },
    spacing: { after: 60 },
    children: [new TextRun({ text: '                                          ', size: FONT_SIZE_BODY })]
  }));
  result.push(new Paragraph({
    alignment: AlignmentType.RIGHT,
    spacing: { after: 60 },
    children: [new TextRun({
      text: 'Generated by Smart AI Pengkaji SLF v1.0',
      size: FONT_SIZE_SMALL, font: FONT_MAIN, italics: true, color: COLOR_MUTED
    })]
  }));
  result.push(new Paragraph({
    alignment: AlignmentType.RIGHT,
    children: [new TextRun({
      text: formatTanggal(new Date()),
      size: FONT_SIZE_SMALL, font: FONT_MAIN, color: COLOR_MUTED
    })]
  }));

  return result;
}

// ============================================================
//  ADVANCED MARKDOWN TO DOCX CONVERTER
//  Word-Safe: No emoji, stable tables, clean formatting
// ============================================================
function renderMarkdownToDocx(md = '') {
  if (!md) return [bodyText('Tidak ada narasi teknis.', { italics: true })];

  // Clean emoji first
  const cleanMd = safeText(md);
  const lines = cleanMd.split('\n');
  const result = [];
  let currentTableRows = [];

  const processTable = () => {
    if (currentTableRows.length < 2) { currentTableRows = []; return; }

    const dataRows = currentTableRows.filter(r => !r.match(/^\|[\s\-:|]+\|$/));
    if (dataRows.length === 0) { currentTableRows = []; return; }

    const parseColumns = (line) => {
      return line.split('|').map(c => c.trim()).filter((c, i, arr) => {
        if (i === 0 && c === '') return false;
        if (i === arr.length - 1 && c === '') return false;
        return true;
      });
    };

    const numCols = parseColumns(dataRows[0]).length;
    if (numCols === 0) { currentTableRows = []; return; }
    const colWidth = Math.floor(100 / numCols);

    try {
      const docxTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: createTableBorders(),
        rows: dataRows.map((line, idx) => {
          const columns = parseColumns(line);
          // Pad columns to match header count
          while (columns.length < numCols) columns.push('-');

          return new TableRow({
            children: columns.slice(0, numCols).map(colText => {
              const isHeader = idx === 0;
              return isHeader
                ? headerCell(colText, colWidth)
                : dataCell(colText, colWidth, { shading: idx % 2 === 0 ? COLOR_TABLE_ALT : undefined });
            })
          });
        })
      });

      result.push(docxTable);
      result.push(emptyLine());
    } catch (e) {
      // Fallback: render as text
      dataRows.forEach(r => result.push(bodyText(r)));
    }

    currentTableRows = [];
  };

  lines.forEach(line => {
    const trimmed = line.trim();

    // Detect table line
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      currentTableRows.push(trimmed);
      return;
    } else if (currentTableRows.length > 0) {
      processTable();
    }

    if (!trimmed) {
      result.push(emptyLine());
      return;
    }

    // Headings
    if (trimmed.startsWith('### ')) {
      result.push(heading3(trimmed.replace(/^###\s+/, '')));
    } else if (trimmed.startsWith('## ')) {
      result.push(heading2(trimmed.replace(/^##\s+/, '')));
    } else if (trimmed.startsWith('# ')) {
      result.push(heading1(trimmed.replace(/^#\s+/, '')));
    }
    // Horizontal rule
    else if (trimmed.match(/^-{3,}$/) || trimmed.match(/^\*{3,}$/)) {
      result.push(horizontalLine());
    }
    // Bullets
    else if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
      result.push(bulletItem(trimmed.substring(2)));
    }
    // Numbered items
    else if (trimmed.match(/^\d+\.\s/)) {
      const match = trimmed.match(/^(\d+\.)\s(.+)$/);
      if (match) {
        result.push(new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 80, line: LINE_SPACING },
          indent: { left: 360 },
          children: [
            new TextRun({ text: `${match[1]} `, bold: true, size: FONT_SIZE_BODY, font: FONT_MAIN }),
            ...parseFormattingRuns(match[2])
          ]
        }));
      }
    }
    // Normal text with formatting
    else {
      result.push(new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 120, line: LINE_SPACING },
        children: parseFormattingRuns(trimmed)
      }));
    }
  });

  // Flush remaining table
  if (currentTableRows.length > 0) processTable();

  return result;
}

/**
 * Parse inline formatting: **bold**, *italic*, `code`
 */
function parseFormattingRuns(text) {
  if (!text) return [new TextRun({ text: '', size: FONT_SIZE_BODY, font: FONT_MAIN })];

  const runs = [];
  // Pattern: **bold**, *italic*, `code`, or plain text
  const regex = /(\*\*.*?\*\*|\*.*?\*|`.*?`|[^*`]+)/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    const part = match[1];
    if (part.startsWith('**') && part.endsWith('**')) {
      runs.push(new TextRun({
        text: safeText(part.slice(2, -2)),
        bold: true, size: FONT_SIZE_BODY, font: FONT_MAIN, color: COLOR_PRIMARY
      }));
    } else if (part.startsWith('*') && part.endsWith('*') && !part.startsWith('**')) {
      runs.push(new TextRun({
        text: safeText(part.slice(1, -1)),
        italics: true, size: FONT_SIZE_BODY, font: FONT_MAIN, color: COLOR_SUBHEADING
      }));
    } else if (part.startsWith('`') && part.endsWith('`')) {
      runs.push(new TextRun({
        text: safeText(part.slice(1, -1)),
        size: FONT_SIZE_SMALL, font: 'Consolas', color: '7c3aed'
      }));
    } else {
      runs.push(new TextRun({
        text: safeText(part),
        size: FONT_SIZE_BODY, font: FONT_MAIN, color: COLOR_PRIMARY
      }));
    }
  }

  if (runs.length === 0) {
    runs.push(new TextRun({ text: safeText(text), size: FONT_SIZE_BODY, font: FONT_MAIN }));
  }

  return runs;
}
