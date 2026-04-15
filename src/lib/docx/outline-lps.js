import {
  createTableBorders, headerCell, dataCell, heading2, heading3,
  bodyText, bulletItem, numberedItem, emptyLine, horizontalLine, pageBreak,
  FONT_MAIN, FONT_SIZE_BODY, FONT_SIZE_SMALL,
  COLOR_PRIMARY, COLOR_HEADING, COLOR_SUCCESS, COLOR_DANGER, COLOR_WARNING, COLOR_MUTED, COLOR_INFO,
  Table, TableRow, Paragraph, TextRun, WidthType, AlignmentType
} from './utils.js';

/**
 * Render Lightning Protection System (LPS) Section for DOCX
 * Based on SNI 03-7015-2014 (IEC 62305 series)
 */
export function renderLPSSection(lpsData = {}) {
  const {
    riskAssessments = [],
    components = [],
    groundingTests = [],
    inspections = [],
    summary = {}
  } = lpsData;

  const hasData = summary.hasData || (riskAssessments.length > 0 || components.length > 0);

  if (!hasData) {
    return [
      heading2('3.10. Pemeriksaan Sistem Proteksi Petir'),
      bodyText(
        'Data pemeriksaan sistem proteksi petir belum tersedia. Pemeriksaan mencakup risk assessment, analisis rolling sphere, grounding test, dan compliance check berdasarkan SNI 03-7015-2014 (IEC 62305 series).'
      ),
      emptyLine(),
    ];
  }

  // Calculate statistics
  const latestRisk = riskAssessments[0] || {};
  const isRequired = latestRisk.is_required || false;
  const lplLevel = latestRisk.lpl_level || '-';
  const riskValue = latestRisk.risk_calculated || 0;
  
  const totalAirTerminals = components.filter(c => c.component_type === 'AIR_TERMINAL').length;
  const totalDownConductors = components.filter(c => c.component_type === 'DOWN_CONDUCTOR').length;
  const totalGroundingPoints = components.filter(c => c.component_type === 'EARTHING').length;
  
  const passGrounding = groundingTests.filter(t => t.status === 'PASS').length;
  const failGrounding = groundingTests.filter(t => t.status === 'FAIL').length;
  
  // Summary table
  const summaryTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: createTableBorders(),
    rows: [
      new TableRow({
        tableHeader: true,
        cantSplit: true,
        children: [
          headerCell('PARAMETER', 40),
          headerCell('NILAI', 30),
          headerCell('STATUS', 30),
        ],
      }),
      new TableRow({
        children: [
          dataCell('Status Kebutuhan LPS', 40, { bold: true }),
          dataCell(isRequired ? 'WAJIB' : 'TIDAK WAJIB', 30, { center: true }),
          dataCell(isRequired ? 'WAJIB' : 'OPTIONAL', 30, { center: true, color: isRequired ? COLOR_WARNING : COLOR_SUCCESS }),
        ],
      }),
      new TableRow({
        children: [
          dataCell('Level Proteksi Petir (LPL)', 40, { bold: true }),
          dataCell(lplLevel, 30, { center: true }),
          dataCell(lplLevel ? 'OK' : '-', 30, { center: true, color: lplLevel ? COLOR_SUCCESS : COLOR_MUTED }),
        ],
      }),
      new TableRow({
        children: [
          dataCell('Nilai Risiko (R)', 40, { bold: true }),
          dataCell(riskValue ? riskValue.toExponential(2) : '-', 30, { center: true }),
          dataCell(riskValue > 1e-5 ? 'REQUIRED' : 'ACCEPTABLE', 30, { center: true, color: riskValue > 1e-5 ? COLOR_WARNING : COLOR_SUCCESS }),
        ],
      }),
      new TableRow({
        children: [
          dataCell('Air Terminal (Penangkal)', 40, { bold: true }),
          dataCell(String(totalAirTerminals), 30, { center: true }),
          dataCell(totalAirTerminals > 0 ? 'OK' : 'CHECK', 30, { center: true, color: totalAirTerminals > 0 ? COLOR_SUCCESS : COLOR_WARNING }),
        ],
      }),
      new TableRow({
        children: [
          dataCell('Down Conductor', 40, { bold: true }),
          dataCell(String(totalDownConductors), 30, { center: true }),
          dataCell(totalDownConductors > 0 ? 'OK' : 'CHECK', 30, { center: true, color: totalDownConductors > 0 ? COLOR_SUCCESS : COLOR_WARNING }),
        ],
      }),
      new TableRow({
        children: [
          dataCell('Titik Grounding', 40, { bold: true }),
          dataCell(String(totalGroundingPoints), 30, { center: true }),
          dataCell(totalGroundingPoints > 0 ? 'OK' : 'CHECK', 30, { center: true, color: totalGroundingPoints > 0 ? COLOR_SUCCESS : COLOR_WARNING }),
        ],
      }),
      new TableRow({
        children: [
          dataCell('Grounding Test Pass', 40, { bold: true }),
          dataCell(`${passGrounding}/${groundingTests.length}`, 30, { center: true }),
          dataCell(passGrounding === groundingTests.length && groundingTests.length > 0 ? 'COMPLIANT' : 'REVIEW', 30, { center: true, color: passGrounding === groundingTests.length && groundingTests.length > 0 ? COLOR_SUCCESS : COLOR_WARNING }),
        ],
      }),
    ],
  });

  // Risk Assessment Detail
  const riskRows = riskAssessments.map((risk, idx) => new TableRow({
    children: [
      dataCell(new Date(risk.assessment_date).toLocaleDateString('id-ID') || '-', 15, { center: true, shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
      dataCell(risk.building_class || '-', 20, { shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
      dataCell(risk.lpl_level || '-', 12, { center: true, shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
      dataCell(`${risk.risk_calculated?.toExponential(2) || '-'}`, 18, { center: true, shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
      dataCell(risk.tolerable_risk ? risk.tolerable_risk.toExponential(2) : '1×10⁻⁵', 18, { center: true, shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
      dataCell(risk.is_required ? 'WAJIB' : 'TIDAK WAJIB', 17, { center: true, bold: true, color: risk.is_required ? COLOR_WARNING : COLOR_SUCCESS, shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
    ],
  }));

  const riskTable = riskRows.length > 0 ? new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: createTableBorders(),
    rows: [
      new TableRow({
        tableHeader: true,
        cantSplit: true,
        children: [
          headerCell('TANGGAL', 15),
          headerCell('KELAS', 20),
          headerCell('LPL', 12),
          headerCell('RISIKO (R)', 18),
          headerCell('RT', 18),
          headerCell('STATUS', 17),
        ],
      }),
      ...riskRows,
    ],
  }) : null;

  // Components Table
  const componentRows = components.map((comp, idx) => {
    const statusColor = comp.status === 'PASS' ? COLOR_SUCCESS :
                       comp.status === 'FAIL' ? COLOR_DANGER : COLOR_WARNING;

    return new TableRow({
      children: [
        dataCell(comp.component_type || '-', 20, { shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
        dataCell(comp.location_description || '-', 25, { shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
        dataCell(`${comp.height || '-'} m`, 12, { center: true, shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
        dataCell(comp.material || '-', 12, { center: true, shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
        dataCell(`${comp.cross_section || '-'} mm²`, 14, { center: true, shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
        dataCell(comp.status || '-', 17, { center: true, bold: true, color: statusColor, shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
      ],
    });
  });

  const componentTable = componentRows.length > 0 ? new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: createTableBorders(),
    rows: [
      new TableRow({
        tableHeader: true,
        cantSplit: true,
        children: [
          headerCell('TIPE', 20),
          headerCell('LOKASI', 25),
          headerCell('TINGGI', 12),
          headerCell('MATERIAL', 12),
          headerCell('CROSS-SECTION', 14),
          headerCell('STATUS', 17),
        ],
      }),
      ...componentRows,
    ],
  }) : null;

  // Grounding Test Table
  const groundingRows = groundingTests.map((test, idx) => {
    const statusColor = test.status === 'PASS' ? COLOR_SUCCESS :
                       test.status === 'FAIL' ? COLOR_DANGER : COLOR_WARNING;
    const targetRes = test.target_resistance || 5;
    const isPass = (test.resistance_measured || 999) <= targetRes;

    return new TableRow({
      children: [
        dataCell(new Date(test.test_date).toLocaleDateString('id-ID') || '-', 15, { center: true, shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
        dataCell(test.location || '-', 20, { shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
        dataCell(test.test_method || '-', 15, { center: true, shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
        dataCell(`${test.resistance_measured?.toFixed(2) || '-'} Ω`, 15, { center: true, color: isPass ? COLOR_SUCCESS : COLOR_DANGER, shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
        dataCell(`${targetRes} Ω`, 12, { center: true, shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
        dataCell(test.soil_resistivity ? `${test.soil_resistivity} Ω.m` : '-', 15, { center: true, shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
        dataCell(test.status || '-', 18, { center: true, bold: true, color: statusColor, shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
      ],
    });
  });

  const groundingTable = groundingRows.length > 0 ? new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: createTableBorders(),
    rows: [
      new TableRow({
        tableHeader: true,
        cantSplit: true,
        children: [
          headerCell('TANGGAL', 15),
          headerCell('LOKASI', 20),
          headerCell('METODE', 15),
          headerCell('R UKUR', 15),
          headerCell('TARGET', 12),
          headerCell('ρ TANAH', 15),
          headerCell('STATUS', 18),
        ],
      }),
      ...groundingRows,
    ],
  }) : null;

  // LPL Specifications
  const lplSpecs = {
    'LPL_I': { radius: 20, mesh: '5×5', angle: '25°', conductor: '50 mm²' },
    'LPL_II': { radius: 30, mesh: '10×10', angle: '35°', conductor: '50 mm²' },
    'LPL_III': { radius: 45, mesh: '15×15', angle: '45°', conductor: '50 mm²' },
    'LPL_IV': { radius: 60, mesh: '15×15', angle: '55°', conductor: '35 mm²' },
  };
  
  const currentLPL = lplSpecs[lplLevel] || null;

  // Build final content
  const content = [
    heading2('3.10. Pemeriksaan Sistem Proteksi Petir'),
    bodyText('Pemeriksaan sistem proteksi petir dilakukan berdasarkan SNI 03-7015-2014 yang mengacu pada IEC 62305 series. Evaluasi mencakup risk assessment, rolling sphere analysis, grounding system, dan compliance check komponen LPS.'),
    emptyLine(),
    heading3('3.10.1. Summary Compliance LPS'),
    summaryTable,
    emptyLine(),
  ];

  if (riskTable) {
    content.push(
      heading3('3.10.2. Risk Assessment (SNI Pasal 6)'),
      bodyText('Risk assessment mengikuti formula R = N × P × L, dimana RT = 10⁻⁵ adalah toleransi risiko standar.'),
      riskTable, 
      emptyLine()
    );
  }

  if (componentTable) {
    content.push(
      heading3('3.10.3. Komponen Sistem LPS'),
      bodyText('Komponen LPS meliputi air terminal (penangkal petir), down conductor, dan grounding system.'),
      componentTable, 
      emptyLine()
    );
  }

  if (groundingTable) {
    content.push(
      heading3('3.10.4. Grounding Test Results'),
      bodyText('Target resistansi grounding sesuai SNI 03-7015-2014 maksimal 5 Ω untuk sistem grounding umum, atau sesuai perhitungan sistem multiple rod.'),
      groundingTable, 
      emptyLine()
    );
  }

  if (currentLPL) {
    content.push(
      heading3('3.10.5. Spesifikasi LPL (Lightning Protection Level)'),
      bodyText(`Level Proteksi Petir yang diterapkan: ${lplLevel}`),
      bodyText(`• Rolling Sphere Radius: ${currentLPL.radius} m (Metoda Bola Berguling)`),
      bodyText(`• Mesh Size: ${currentLPL.mesh} m (Kabel mesh pada atap)`),
      bodyText(`• Protection Angle: ${currentLPL.angle} (Metoda Sudut Perlindungan)`),
      bodyText(`• Minimum Conductor: ${currentLPL.conductor} Cu/Al`),
      emptyLine()
    );
  }

  // Add recommendations
  const recommendations = [];
  if (!isRequired && riskValue <= 1e-5) {
    recommendations.push('Sistem LPS tidak wajib berdasarkan risk assessment, namun direkomendasikan untuk perlindungan aset.');
  }
  if (isRequired && totalAirTerminals === 0) {
    recommendations.push('Segera instalasi air terminal sesuai LPL yang direkomendasikan.');
  }
  if (failGrounding > 0) {
    recommendations.push(`Perbaiki ${failGrounding} titik grounding yang tidak memenuhi target resistansi.`);
  }
  if (totalDownConductors < 2) {
    recommendations.push('Tambahkan down conductor minimum 2 jalur untuk redundancy.');
  }

  if (recommendations.length > 0) {
    content.push(
      heading3('3.10.6. Rekomendasi'),
      ...recommendations.map((rec, idx) => numberedItem(rec, idx + 1)),
      emptyLine()
    );
  }

  content.push(
    bodyText(`Referensi: SNI 03-7015-2014 Sistem Proteksi Petir pada Bangunan Gedung, IEC 62305-1, IEC 62305-3.`),
    emptyLine()
  );

  return content;
}
