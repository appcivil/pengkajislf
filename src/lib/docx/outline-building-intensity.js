import {
  createTableBorders, headerCell, dataCell, heading2, heading3,
  bodyText, bulletItem, numberedItem, emptyLine, horizontalLine, pageBreak,
  FONT_MAIN, FONT_SIZE_BODY, FONT_SIZE_SMALL,
  COLOR_PRIMARY, COLOR_HEADING, COLOR_SUCCESS, COLOR_DANGER, COLOR_WARNING, COLOR_MUTED, COLOR_INFO,
  Table, TableRow, Paragraph, TextRun, WidthType, AlignmentType
} from './utils.js';

/**
 * Render Building Intensity Section for DOCX
 * Based on Permen PUPR 16/PRT/M/2017 (KDB/HSB/KLB)
 */
export function renderBuildingIntensitySection(intensityData = {}) {
  const {
    calculations = [],
    compliance = {},
    summary = {}
  } = intensityData;

  const hasData = summary.hasData || calculations.length > 0;

  if (!hasData) {
    return [
      heading2('3.12. Pemeriksaan Intensitas Bangunan'),
      bodyText(
        'Data pemeriksaan intensitas bangunan belum tersedia. Pemeriksaan mencakup KDB (Koefisien Dasar Bangunan), HSB (Hijau Sudut Bangunan), KLB (Koefisien Lantai Bangunan), dan kesesuaian fungsi berdasarkan Permen PUPR No. 16/PRT/M/2017 dan Perda DKI Jakarta.'
      ),
      emptyLine(),
    ];
  }

  // Statistics
  const kdb = summary.kdb || 0;
  const kdbMax = summary.kdb_max || 0;
  const klb = summary.klb || 0;
  const klbMax = summary.klb_max || 0;
  const hsb = summary.hsb || 0;
  const hsbMin = summary.hsb_min || 0;
  const gsb = summary.gsb || 0;
  
  const kdbCompliance = kdb <= kdbMax;
  const klbCompliance = klb <= klbMax;
  const hsbCompliance = hsb >= hsbMin;

  // Summary table
  const summaryTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: createTableBorders(),
    rows: [
      new TableRow({
        tableHeader: true,
        cantSplit: true,
        children: [
          headerCell('PARAMETER', 30),
          headerCell('NILAI', 20),
          headerCell('BATAS', 20),
          headerCell('STATUS', 30),
        ],
      }),
      new TableRow({
        children: [
          dataCell('KDB (Koefisien Dasar Bangunan)', 30, { bold: true }),
          dataCell(`${kdb.toFixed(2)}%`, 20, { center: true }),
          dataCell(`≤ ${kdbMax.toFixed(2)}%`, 20, { center: true }),
          dataCell(kdbCompliance ? 'COMPLIANT' : 'EXCEEDED', 30, { center: true, bold: true, color: kdbCompliance ? COLOR_SUCCESS : COLOR_DANGER }),
        ],
      }),
      new TableRow({
        children: [
          dataCell('KLB (Koefisien Lantai Bangunan)', 30, { bold: true }),
          dataCell(klb.toFixed(2), 20, { center: true }),
          dataCell(`≤ ${klbMax.toFixed(2)}`, 20, { center: true }),
          dataCell(klbCompliance ? 'COMPLIANT' : 'EXCEEDED', 30, { center: true, bold: true, color: klbCompliance ? COLOR_SUCCESS : COLOR_DANGER }),
        ],
      }),
      new TableRow({
        children: [
          dataCell('HSB (Hijau Sudut Bangunan)', 30, { bold: true }),
          dataCell(`${hsb.toFixed(2)}%`, 20, { center: true }),
          dataCell(`≥ ${hsbMin.toFixed(2)}%`, 20, { center: true }),
          dataCell(hsbCompliance ? 'COMPLIANT' : 'INSUFFICIENT', 30, { center: true, bold: true, color: hsbCompliance ? COLOR_SUCCESS : COLOR_WARNING }),
        ],
      }),
      new TableRow({
        children: [
          dataCell('GSB (Garis Sempadan Bangunan)', 30, { bold: true }),
          dataCell(`${gsb.toFixed(2)} m`, 20, { center: true }),
          dataCell('Sesuai Perda', 20, { center: true }),
          dataCell(gsb > 0 ? 'OK' : 'CHECK', 30, { center: true, color: gsb > 0 ? COLOR_SUCCESS : COLOR_WARNING }),
        ],
      }),
      new TableRow({
        children: [
          dataCell('Jumlah Lantai', 30, { bold: true }),
          dataCell(String(summary.jumlah_lantai || 0), 20, { center: true }),
          dataCell('-', 20, { center: true }),
          dataCell((summary.jumlah_lantai || 0) > 0 ? 'OK' : '-', 30, { center: true, color: (summary.jumlah_lantai || 0) > 0 ? COLOR_SUCCESS : COLOR_MUTED }),
        ],
      }),
      new TableRow({
        children: [
          dataCell('Luas Lantai Total', 30, { bold: true }),
          dataCell(`${(summary.luas_lantai_total || 0).toLocaleString('id-ID')} m²`, 20, { center: true }),
          dataCell('-', 20, { center: true }),
          dataCell((summary.luas_lantai_total || 0) > 0 ? 'OK' : '-', 30, { center: true, color: (summary.luas_lantai_total || 0) > 0 ? COLOR_SUCCESS : COLOR_MUTED }),
        ],
      }),
    ],
  });

  // Building function compliance
  const functionRows = (summary.function_compliance || []).map((fn, idx) => {
    const statusColor = fn.compliant ? COLOR_SUCCESS : COLOR_DANGER;

    return new TableRow({
      children: [
        dataCell(fn.function_name || '-', 30, { shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
        dataCell(fn.zone_type || '-', 25, { shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
        dataCell(fn.kdb_allowed ? `${fn.kdb_allowed}%` : '-', 15, { center: true, shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
        dataCell(fn.klb_allowed ? fn.klb_allowed.toString() : '-', 15, { center: true, shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
        dataCell(fn.compliant ? '✓ SESUAI' : '✗ TIDAK SESUAI', 15, { center: true, bold: true, color: statusColor, shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
      ],
    });
  });

  const functionTable = functionRows.length > 0 ? new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: createTableBorders(),
    rows: [
      new TableRow({
        tableHeader: true,
        cantSplit: true,
        children: [
          headerCell('FUNGSI BANGUNAN', 30),
          headerCell('ZONA', 25),
          headerCell('KDB BOLEH', 15),
          headerCell('KLB BOLEH', 15),
          headerCell('STATUS', 15),
        ],
      }),
      ...functionRows,
    ],
  }) : null;

  // Calculation details
  const calcRows = calculations.map((calc, idx) => new TableRow({
    children: [
      dataCell(calc.floor_level || `L${idx + 1}`, 15, { center: true, shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
      dataCell(calc.luas_lantai ? `${calc.luas_lantai.toLocaleString('id-ID')} m²` : '-', 20, { center: true, shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
      dataCell(calc.luas_tanah ? `${calc.luas_tanah.toLocaleString('id-ID')} m²` : '-', 20, { center: true, shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
      dataCell(calc.kdb ? `${calc.kdb.toFixed(2)}%` : '-', 15, { center: true, shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
      dataCell(calc.klb ? calc.klb.toFixed(2) : '-', 15, { center: true, shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
      dataCell(calc.hsb ? `${calc.hsb.toFixed(2)}%` : '-', 15, { center: true, shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
    ],
  }));

  const calcTable = calcRows.length > 0 ? new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: createTableBorders(),
    rows: [
      new TableRow({
        tableHeader: true,
        cantSplit: true,
        children: [
          headerCell('LT', 15),
          headerCell('LUAS LANTAI', 20),
          headerCell('LUAS TANAH', 20),
          headerCell('KDB', 15),
          headerCell('KLB', 15),
          headerCell('HSB', 15),
        ],
      }),
      ...calcRows,
    ],
  }) : null;

  // Build final content
  const content = [
    heading2('3.12. Pemeriksaan Intensitas Bangunan'),
    bodyText('Pemeriksaan intensitas bangunan dilakukan berdasarkan Permen PUPR No. 16/PRT/M/2017 tentang Pedoman Penetapan Koefisien Dasar Bangunan (KDB), Koefisien Lantai Bangunan (KLB), dan Hijau Sudut Bangunan (HSB), serta Perda DKI Jakarta No. 11 Tahun 2022 tentang Bangunan Gedung.'),
    emptyLine(),
    heading3('3.12.1. Summary Intensitas Bangunan'),
    summaryTable,
    emptyLine(),
  ];

  if (functionTable) {
    content.push(
      heading3('3.12.2. Kesesuaian Fungsi Bangunan'),
      bodyText('Evaluasi kesesuaian fungsi bangunan dengan zona peruntukan dan ketentuan KDB/HSB/KLB yang berlaku.'),
      functionTable, 
      emptyLine()
    );
  }

  if (calcTable) {
    content.push(
      heading3('3.12.3. Detail Perhitungan Intensitas'),
      bodyText('Rumus: KDB = (Luas Dasar Bangunan / Luas Tanah) × 100%, KLB = Total Luas Lantai / Luas Tanah'),
      calcTable, 
      emptyLine()
    );
  }

  // Add recommendations
  const recommendations = [];
  if (!kdbCompliance) {
    recommendations.push(`KDB melebihi batas maksimum ${kdbMax.toFixed(2)}%. Perlu revisi desain atau pengurangan footprint bangunan.`);
  }
  if (!klbCompliance) {
    recommendations.push(`KLB melebihi batas maksimum ${klbMax.toFixed(2)}. Pertimbangkan pengurangan jumlah lantai atau luas per lantai.`);
  }
  if (!hsbCompliance) {
    recommendations.push(`HSB di bawah minimum ${hsbMin.toFixed(2)}%. Wajib penambahan area hijau terbuka atau green roof.`);
  }
  if (kdbCompliance && klbCompliance && hsbCompliance) {
    recommendations.push('Seluruh parameter intensitas bangunan memenuhi ketentuan regulasi.');
  }

  if (recommendations.length > 0) {
    content.push(
      heading3('3.12.4. Rekomendasi'),
      ...recommendations.map((rec, idx) => numberedItem(rec, idx + 1)),
      emptyLine()
    );
  }

  content.push(
    bodyText(`Referensi: Permen PUPR No. 16/PRT/M/2017, Perda DKI Jakarta No. 11 Tahun 2022, SNI 03-7066-2005 (Tata Cara Perhitungan Koefisien Dasar Bangunan).`),
    emptyLine()
  );

  return content;
}
