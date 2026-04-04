import {
  getStatusLabel, getRiskLabel, getStatusSLFLabel, formatTanggal, safeText,
  createTableBorders, headerCell, dataCell, heading1, heading2, heading3,
  bodyText, bulletItem, numberedItem, emptyLine, pageBreak, horizontalLine,
  FONT_MAIN, FONT_SIZE_BODY, FONT_SIZE_H1, FONT_SIZE_H2, FONT_SIZE_H3, FONT_SIZE_SMALL, FONT_SIZE_CAPTION,
  COLOR_PRIMARY, COLOR_HEADING, COLOR_SUBHEADING, COLOR_MUTED, COLOR_SUCCESS, COLOR_DANGER, COLOR_WARNING, COLOR_HEADER_BG, COLOR_TABLE_ALT, COLOR_BORDER, COLOR_COVER_BG, COLOR_ACCENT, COLOR_WHITE, COLOR_NAVY,
  MARGIN_TOP, MARGIN_BOTTOM, MARGIN_LEFT, MARGIN_RIGHT, LINE_SPACING,
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType, HeadingLevel, PageNumber,
  VerticalAlign, BorderStyle, ShadingType, Header, Footer,
  TableOfContents, PageBreak, Tab, TabStopType, TabStopPosition,
  LevelFormat, convertInchesToTwip
} from './utils.js';

// ============================================================
export function renderBab4(checklist = [], proyek = {}) {
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
  // RISK ENGINE (AI CORE)
  // =========================
  const riskMatrix = {
    aman: { skor: 0, level: 'LOW' },
    minor: { skor: 25, level: 'MEDIUM' },
    major: { skor: 60, level: 'HIGH' },
    kritis: { skor: 90, level: 'CRITICAL' },
    unknown: { skor: 50, level: 'UNCERTAIN' },
  };

  // =========================
  // AI REASONING ENGINE
  // =========================
  const generateAIAnalysis = (item) => {
    const status = normalizeStatus(item.status);

    if (status === 'aman') {
      return 'Elemen memenuhi standar teknis dan tidak menunjukkan indikasi kegagalan fungsi. Tidak terdapat deviasi signifikan terhadap NSPK.';
    }

    if (status === 'minor') {
      return 'Ditemukan kerusakan ringan yang belum mempengaruhi kinerja struktur/komponen secara signifikan, namun berpotensi berkembang apabila tidak dilakukan pemeliharaan.';
    }

    if (status === 'major') {
      return 'Kerusakan atau ketidaksesuaian sudah mempengaruhi sebagian fungsi teknis dan dapat menurunkan keandalan sistem. Diperlukan intervensi teknis dalam waktu dekat.';
    }

    if (status === 'kritis') {
      return 'Terjadi kegagalan fungsi atau kondisi yang berpotensi membahayakan keselamatan jiwa. Risiko tinggi terhadap kegagalan struktur/sistem.';
    }

    return 'Data belum cukup untuk dilakukan analisis menyeluruh.';
  };

  const generateImpact = (item) => {
    const status = normalizeStatus(item.status);

    if (status === 'kritis') {
      return 'Berpotensi menyebabkan kegagalan sistem total, kecelakaan, atau kerugian besar.';
    }

    if (status === 'major') {
      return 'Menurunkan performa sistem dan dapat mengganggu operasional bangunan.';
    }

    if (status === 'minor') {
      return 'Dampak terbatas namun dapat berkembang menjadi risiko lebih besar.';
    }

    return 'Tidak ada dampak signifikan.';
  };

  const generateRecommendation = (item) => {
    const status = normalizeStatus(item.status);

    if (status === 'kritis') {
      return 'Segera lakukan perbaikan darurat dan hentikan penggunaan elemen terkait jika diperlukan.';
    }

    if (status === 'major') {
      return 'Lakukan perbaikan teknis dalam jangka pendek dan evaluasi ulang setelah perbaikan.';
    }

    if (status === 'minor') {
      return 'Masukkan dalam program pemeliharaan rutin.';
    }

    return 'Tidak diperlukan tindakan.';
  };

  // =========================
  // GROUPING PER KATEGORI
  // =========================
  const grouped = items.reduce((acc, item) => {
    const key = item.kategori || 'lainnya';
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  // =========================
  // BUILD TABLE AI ANALYSIS
  // =========================
  const buildAITable = (list) => {
    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: createTableBorders(),
      rows: [
        new TableRow({
          tableHeader: true,
          children: [
            headerCell('KODE', 10),
            headerCell('URAIAN', 20),
            headerCell('KONDISI', 12),
            headerCell('ANALISIS AI', 20),
            headerCell('DAMPAK', 18),
            headerCell('RISIKO', 10),
            headerCell('REKOMENDASI', 20),
          ],
        }),
        ...list.map((item, idx) => {
          const norm = normalizeStatus(item.status);
          const risk = riskMatrix[norm];

          return new TableRow({
            children: [
              dataCell(item.kode || '-', 10),
              dataCell(item.nama || '-', 20),
              dataCell(item.status || '-', 12),
              dataCell(generateAIAnalysis(item), 20),
              dataCell(generateImpact(item), 18),
              dataCell(risk.level, 10, {
                bold: true,
                color:
                  risk.level === 'CRITICAL'
                    ? COLOR_DANGER
                    : risk.level === 'HIGH'
                      ? COLOR_WARNING
                      : COLOR_SUCCESS,
              }),
              dataCell(generateRecommendation(item), 20),
            ],
          });
        }),
      ],
    });
  };

  // =========================
  // GLOBAL RISK INDEX
  // =========================
  const totalRisk = items.reduce((acc, item) => {
    const norm = normalizeStatus(item.status);
    return acc + riskMatrix[norm].skor;
  }, 0);

  const avgRisk = items.length ? totalRisk / items.length : 0;

  const globalRiskLevel =
    avgRisk > 70 ? 'CRITICAL' :
      avgRisk > 50 ? 'HIGH' :
        avgRisk > 25 ? 'MEDIUM' : 'LOW';

  // =========================
  // OUTPUT DOCUMENT
  // =========================
  return [
    heading1('BAB IV: ANALISIS DAN EVALUASI TEKNIS BERBASIS AI'),

    bodyText(
      'Bab ini merupakan hasil analisis mendalam berbasis kecerdasan buatan yang mengintegrasikan pendekatan rule-based, risk-based, dan performance-based untuk mengevaluasi kondisi bangunan secara komprehensif.'
    ),

    heading2('4.1. Indeks Risiko Global Bangunan'),
    bodyText(
      `Berdasarkan hasil komputasi AI, diperoleh nilai rata-rata risiko sebesar ${avgRisk.toFixed(
        2
      )} dengan kategori ${globalRiskLevel}.`
    ),

    heading2('4.2. Analisis Per Sub Sistem Bangunan'),

    ...Object.keys(grouped).flatMap((cat) => [
      heading3(cat.toUpperCase()),
      bodyText(
        'Analisis berikut disusun berdasarkan hasil pemeriksaan lapangan dan diproses menggunakan AI reasoning untuk menentukan tingkat risiko, dampak, dan rekomendasi.'
      ),
      buildAITable(grouped[cat]),
      emptyLine(),
    ]),

    heading2('4.3. Kesimpulan Analisis AI'),

    bodyText(
      'Berdasarkan seluruh hasil evaluasi, sistem AI menyimpulkan bahwa kondisi bangunan berada pada tingkat risiko ' +
      globalRiskLevel +
      ' dengan kebutuhan intervensi teknis yang disesuaikan dengan tingkat keparahan masing-masing elemen.'
    ),

    bulletItem('Elemen dengan risiko CRITICAL harus ditangani segera'),
    bulletItem('Elemen risiko HIGH memerlukan perbaikan dalam waktu dekat'),
    bulletItem('Elemen risiko MEDIUM perlu monitoring berkala'),
    bulletItem('Elemen LOW dianggap aman'),

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