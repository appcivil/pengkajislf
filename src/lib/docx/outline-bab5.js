import {
  getStatusLabel, getRiskLabel, getStatusSLFLabel, formatTanggal, safeText,
  createTableBorders, headerCell, dataCell, heading1, heading2, heading3,
  bodyText, bulletItem, numberedItem, emptyLine, pageBreak, horizontalLine, renderMarkdownToDocx,
  FONT_MAIN, FONT_SIZE_BODY, FONT_SIZE_H1, FONT_SIZE_H2, FONT_SIZE_H3, FONT_SIZE_SMALL, FONT_SIZE_CAPTION,
  COLOR_PRIMARY, COLOR_HEADING, COLOR_SUBHEADING, COLOR_MUTED, COLOR_SUCCESS, COLOR_DANGER, COLOR_WARNING, COLOR_HEADER_BG, COLOR_TABLE_ALT, COLOR_BORDER, COLOR_COVER_BG, COLOR_ACCENT, COLOR_WHITE, COLOR_NAVY,
  MARGIN_TOP, MARGIN_BOTTOM, MARGIN_LEFT, MARGIN_RIGHT, LINE_SPACING,
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType, HeadingLevel, PageNumber,
  VerticalAlign, BorderStyle, ShadingType, Header, Footer,
  TableOfContents, PageBreak, Tab, TabStopType, TabStopPosition,
  LevelFormat, convertInchesToTwip
} from './utils.js';
import { getStructuredDataForDocx } from '../report-formatter.js';

export function renderBab5(checklist = [], proyek = {}) {
  const items = Array.isArray(checklist) ? checklist : [];

  // =========================
  // NORMALISASI STATUS
  // =========================
  const normalizeStatus = (status) => {
    const s = String(status || '').toLowerCase();

    if (['baik', 'sesuai', 'ada', 'ada_sesuai', 'lengkap'].includes(s)) return 'aman';
    if (['rusak ringan'].includes(s)) return 'minor';
    if (['rusak sedang'].includes(s)) return 'major';
    if (['rusak berat', 'tidak sesuai', 'tidak_ada', 'kritis'].includes(s)) return 'kritis';
    if (['belum diperiksa', 'verifikasi'].includes(s)) return 'unknown';

    return 'unknown';
  };

  // =========================
  // PARAMETER PENILAIAN
  // =========================
  const weight = {
    aman: 1,
    minor: 0.75,
    major: 0.4,
    kritis: 0,
    unknown: 0.5,
  };

  const riskScore = {
    aman: 0,
    minor: 25,
    major: 60,
    kritis: 90,
    unknown: 50,
  };

  // =========================
  // PERHITUNGAN UTAMA
  // =========================
  let totalScore = 0;
  let totalRisk = 0;
  let criticalCount = 0;

  items.forEach(item => {
    const n = normalizeStatus(item.status);

    totalScore += weight[n];
    totalRisk += riskScore[n];

    if (n === 'kritis') criticalCount++;
  });

  const maxScore = items.length || 1;
  const compliancePercent = (totalScore / maxScore) * 100;
  const avgRisk = totalRisk / maxScore;

  // =========================
  // STATUS SLF ENGINE
  // =========================
  let statusSLF = 'LAIK FUNGSI';
  let keterangan = '';
  let color = COLOR_SUCCESS;

  if (criticalCount > 0 || avgRisk > 70 || compliancePercent < 60) {
    statusSLF = 'TIDAK LAIK FUNGSI';
    color = COLOR_DANGER;
    keterangan = 'Ditemukan kondisi kritis yang berpotensi membahayakan keselamatan atau kegagalan fungsi bangunan.';
  } else if (avgRisk > 40 || compliancePercent < 80) {
    statusSLF = 'LAIK FUNGSI BERSYARAT';
    color = COLOR_WARNING;
    keterangan = 'Bangunan dapat digunakan dengan syarat dilakukan perbaikan terhadap beberapa komponen.';
  } else {
    statusSLF = 'LAIK FUNGSI';
    color = COLOR_SUCCESS;
    keterangan = 'Bangunan memenuhi seluruh persyaratan teknis dan laik digunakan.';
  }

  // =========================
  // LEVEL RISIKO GLOBAL
  // =========================
  const riskLevel =
    avgRisk > 70 ? 'CRITICAL' :
      avgRisk > 50 ? 'HIGH' :
        avgRisk > 25 ? 'MEDIUM' : 'LOW';

  // =========================
  // AI JUSTIFICATION
  // =========================
  const generateConclusionAI = () => {
    if (statusSLF === 'TIDAK LAIK FUNGSI') {
      return 'Analisis AI menunjukkan adanya elemen kritis yang secara langsung mempengaruhi keselamatan struktur, sistem proteksi, atau utilitas utama. Bangunan tidak memenuhi standar minimum NSPK.';
    }

    if (statusSLF === 'LAIK FUNGSI BERSYARAT') {
      return 'Analisis AI menunjukkan sebagian elemen belum memenuhi standar, namun tidak berada pada tingkat kegagalan kritis. Bangunan masih dapat difungsikan dengan intervensi teknis terbatas.';
    }

    return 'Seluruh sistem bangunan menunjukkan performa yang sesuai dengan standar teknis dan tidak terdapat risiko signifikan.';
  };

  // =========================
  // OUTPUT TABLE
  // =========================
  const tableDecision = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: createTableBorders(),
    rows: [
      new TableRow({
        tableHeader: true,
        children: [
          headerCell('PARAMETER', 30),
          headerCell('NILAI', 30),
          headerCell('KETERANGAN', 40),
        ],
      }),
      new TableRow({
        children: [
          dataCell('Persentase Kepatuhan', 30),
          dataCell(`${compliancePercent.toFixed(2)}%`, 30, { bold: true }),
          dataCell('Rasio kesesuaian terhadap standar teknis', 40),
        ],
      }),
      new TableRow({
        children: [
          dataCell('Rata-rata Risiko', 30),
          dataCell(avgRisk.toFixed(2), 30, { bold: true }),
          dataCell('Nilai rata-rata risiko dari seluruh item pemeriksaan', 40),
        ],
      }),
      new TableRow({
        children: [
          dataCell('Jumlah Temuan Kritis', 30),
          dataCell(String(criticalCount), 30, { bold: true, color: COLOR_DANGER }),
          dataCell('Jumlah item dengan kondisi kritis', 40),
        ],
      }),
      new TableRow({
        children: [
          dataCell('Level Risiko Global', 30),
          dataCell(riskLevel, 30, { bold: true }),
          dataCell('Kategori risiko keseluruhan bangunan', 40),
        ],
      }),
      new TableRow({
        children: [
          dataCell('Status Kelaikan (SLF)', 30, { bold: true }),
          dataCell(statusSLF, 30, { bold: true, color }),
          dataCell(keterangan, 40),
        ],
      }),
    ],
  });

  // =========================
  // OUTPUT
  // =========================
  return [
    heading1('BAB V: PENILAIAN KELAIKAN FUNGSI BANGUNAN'),

    bodyText(
      'Bab ini menyajikan hasil penilaian akhir kelaikan fungsi bangunan berdasarkan analisis AI yang mengintegrasikan tingkat kepatuhan, tingkat risiko, dan temuan kritis secara menyeluruh.'
    ),

    heading2('5.1. Parameter Penilaian Kelaikan'),
    bodyText(
      'Penilaian kelaikan dilakukan berdasarkan tiga parameter utama, yaitu tingkat kepatuhan terhadap standar teknis, tingkat risiko, dan jumlah temuan kritis.'
    ),
    bulletItem('Persentase Kepatuhan terhadap NSPK'),
    bulletItem('Indeks Risiko Bangunan'),
    bulletItem('Jumlah Temuan Kritis'),

    heading2('5.2. Hasil Penilaian Otomatis'),
    tableDecision,

    heading2('5.3. Analisis Keputusan AI'),
    bodyText(generateConclusionAI()),

    heading2('5.4. Rekomendasi Kebijakan Teknis'),

    ...(statusSLF === 'TIDAK LAIK FUNGSI'
      ? [
        bulletItem('Hentikan sementara penggunaan bangunan'),
        bulletItem('Lakukan audit struktur dan sistem secara menyeluruh'),
        bulletItem('Segera lakukan perbaikan kritis sebelum operasional'),
      ]
      : statusSLF === 'LAIK FUNGSI BERSYARAT'
        ? [
          bulletItem('Bangunan dapat digunakan dengan pembatasan tertentu'),
          bulletItem('Lakukan perbaikan pada item risiko sedang–tinggi'),
          bulletItem('Lakukan monitoring berkala'),
        ]
        : [
          bulletItem('Bangunan dinyatakan aman untuk digunakan'),
          bulletItem('Lanjutkan pemeliharaan rutin'),
          bulletItem('Lakukan inspeksi berkala sesuai regulasi'),
        ]),

    heading2('5.5. Pernyataan Akhir'),
    bodyText(
      `Berdasarkan hasil analisis teknis dan evaluasi berbasis AI, bangunan dinyatakan: ${statusSLF}.`
    ),

    horizontalLine(),
  ];
}

// ============================================================
export function renderDaftarIsi() {
  return [
    heading1('DAFTAR ISI'),
    new TableOfContents("ToC", {
      hyperlink: true,
      headingStyleRange: "1-3",
    }),
    pageBreak(),
  ];
}