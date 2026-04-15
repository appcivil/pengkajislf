import {
  createTableBorders, headerCell, dataCell, heading2, heading3,
  bodyText, bulletItem, numberedItem, emptyLine, horizontalLine, pageBreak,
  FONT_MAIN, FONT_SIZE_BODY, FONT_SIZE_SMALL,
  COLOR_PRIMARY, COLOR_HEADING, COLOR_SUCCESS, COLOR_DANGER, COLOR_WARNING, COLOR_MUTED, COLOR_INFO,
  Table, TableRow, Paragraph, TextRun, WidthType, AlignmentType
} from './utils.js';

/**
 * Render Architectural Requirements Section for DOCX
 * Based on Permen PUPR 6/PRT/M/2023 (Standar Konstruksi Bangunan Gedung)
 */
export function renderArchitecturalSection(architecturalData = {}) {
  const {
    requirements = [],
    simulations = [],
    compliance = {},
    summary = {}
  } = architecturalData;

  const hasData = summary.hasData || requirements.length > 0;

  if (!hasData) {
    return [
      heading2('3.13. Pemeriksaan Persyaratan Arsitektur'),
      bodyText(
        'Data pemeriksaan persyaratan arsitektur belum tersedia. Pemeriksaan mencakup evaluasi pencahayaan alami, ventilasi udara, kebisingan, getaran, energi, serta aksesibilitas dan kemudahan berdasarkan Permen PUPR No. 6/PRT/M/2023 dan SNI seri arsitektur.'
      ),
      emptyLine(),
    ];
  }

  // Statistics
  const totalReqs = summary.total_requirements || requirements.length || 0;
  const compliantReqs = summary.compliant_count || requirements.filter(r => r.status === 'COMPLIANT').length || 0;
  const nonCompliantReqs = summary.non_compliant_count || requirements.filter(r => r.status === 'NON_COMPLIANT').length || 0;
  const notChecked = totalReqs - compliantReqs - nonCompliantReqs;
  const complianceRate = totalReqs > 0 ? Math.round((compliantReqs / totalReqs) * 100) : 0;

  // Simulation counts
  const simPencahayaan = simulations.filter(s => s.type === 'PENCAHAYAAN').length;
  const simVentilasi = simulations.filter(s => s.type === 'VENTILASI').length;
  const simKebisingan = simulations.filter(s => s.type === 'KEBISINGAN').length;
  const simGetaran = simulations.filter(s => s.type === 'GETARAN').length;

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
          dataCell('Total Persyaratan', 40, { bold: true }),
          dataCell(String(totalReqs), 30, { center: true }),
          dataCell(totalReqs > 0 ? 'OK' : '-', 30, { center: true, color: totalReqs > 0 ? COLOR_SUCCESS : COLOR_MUTED }),
        ],
      }),
      new TableRow({
        children: [
          dataCell('Persyaratan Compliant', 40, { bold: true }),
          dataCell(String(compliantReqs), 30, { center: true }),
          dataCell(compliantReqs > 0 ? '✓' : '-', 30, { center: true, color: compliantReqs > 0 ? COLOR_SUCCESS : COLOR_MUTED }),
        ],
      }),
      new TableRow({
        children: [
          dataCell('Persyaratan Non-Compliant', 40, { bold: true }),
          dataCell(String(nonCompliantReqs), 30, { center: true }),
          dataCell(nonCompliantReqs === 0 ? 'OK' : `${nonCompliantReqs} ISSUES`, 30, { center: true, bold: true, color: nonCompliantReqs === 0 ? COLOR_SUCCESS : COLOR_DANGER }),
        ],
      }),
      new TableRow({
        children: [
          dataCell('Compliance Rate', 40, { bold: true }),
          dataCell(`${complianceRate}%`, 30, { center: true }),
          dataCell(complianceRate >= 90 ? 'EXCELLENT' : complianceRate >= 70 ? 'GOOD' : complianceRate >= 50 ? 'NEEDS WORK' : 'CRITICAL', 30, { center: true, bold: true, color: complianceRate >= 70 ? COLOR_SUCCESS : complianceRate >= 50 ? COLOR_WARNING : COLOR_DANGER }),
        ],
      }),
      new TableRow({
        children: [
          dataCell('Simulasi Pencahayaan', 40, { bold: true }),
          dataCell(String(simPencahayaan), 30, { center: true }),
          dataCell(simPencahayaan > 0 ? 'OK' : '-', 30, { center: true, color: simPencahayaan > 0 ? COLOR_SUCCESS : COLOR_MUTED }),
        ],
      }),
      new TableRow({
        children: [
          dataCell('Simulasi Ventilasi', 40, { bold: true }),
          dataCell(String(simVentilasi), 30, { center: true }),
          dataCell(simVentilasi > 0 ? 'OK' : '-', 30, { center: true, color: simVentilasi > 0 ? COLOR_SUCCESS : COLOR_MUTED }),
        ],
      }),
    ],
  });

  // Requirements by category
  const categories = [...new Set(requirements.map(r => r.category))];
  
  const reqRows = requirements.slice(0, 25).map((req, idx) => {
    const statusColor = req.status === 'COMPLIANT' ? COLOR_SUCCESS :
                       req.status === 'NON_COMPLIANT' ? COLOR_DANGER : COLOR_WARNING;

    return new TableRow({
      children: [
        dataCell(req.code || `R-${idx + 1}`, 12, { shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
        dataCell(req.category || '-', 18, { shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
        dataCell(req.description || '-', 35, { shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
        dataCell(req.requirement_value || '-', 15, { center: true, shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
        dataCell(req.actual_value || '-', 15, { center: true, shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
        dataCell(req.status || '-', 15, { center: true, bold: true, color: statusColor, shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
      ],
    });
  });

  const reqTable = reqRows.length > 0 ? new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: createTableBorders(),
    rows: [
      new TableRow({
        tableHeader: true,
        cantSplit: true,
        children: [
          headerCell('KODE', 12),
          headerCell('KATEGORI', 18),
          headerCell('DESKRIPSI', 35),
          headerCell('SYARAT', 15),
          headerCell('AKTUAL', 15),
          headerCell('STATUS', 15),
        ],
      }),
      ...reqRows,
    ],
  }) : null;

  // Simulations table
  const simRows = simulations.map((sim, idx) => {
    const statusColor = sim.status === 'PASS' ? COLOR_SUCCESS :
                       sim.status === 'FAIL' ? COLOR_DANGER : COLOR_WARNING;

    return new TableRow({
      children: [
        dataCell(sim.type || '-', 20, { shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
        dataCell(sim.room_name || '-', 25, { shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
        dataCell(sim.parameter || '-', 20, { shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
        dataCell(`${sim.calculated_value || '-'} ${sim.unit || ''}`, 20, { center: true, shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
        dataCell(`${sim.standard_value || '-'} ${sim.unit || ''}`, 20, { center: true, shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
        dataCell(sim.status || '-', 15, { center: true, bold: true, color: statusColor, shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
      ],
    });
  });

  const simTable = simRows.length > 0 ? new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: createTableBorders(),
    rows: [
      new TableRow({
        tableHeader: true,
        cantSplit: true,
        children: [
          headerCell('TIPE SIMULASI', 20),
          headerCell('RUANG', 25),
          headerCell('PARAMETER', 20),
          headerCell('NILAI HITUNG', 20),
          headerCell('STANDAR', 20),
          headerCell('STATUS', 15),
        ],
      }),
      ...simRows,
    ],
  }) : null;

  // Category summary
  const catRows = categories.map((cat, idx) => {
    const catReqs = requirements.filter(r => r.category === cat);
    const catCompliant = catReqs.filter(r => r.status === 'COMPLIANT').length;
    const catRate = catReqs.length > 0 ? Math.round((catCompliant / catReqs.length) * 100) : 0;

    return new TableRow({
      children: [
        dataCell(cat || '-', 40, { shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
        dataCell(String(catReqs.length), 20, { center: true, shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
        dataCell(`${catCompliant}/${catReqs.length}`, 20, { center: true, shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
        dataCell(`${catRate}%`, 20, { center: true, bold: true, color: catRate >= 70 ? COLOR_SUCCESS : catRate >= 50 ? COLOR_WARNING : COLOR_DANGER, shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
      ],
    });
  });

  const catTable = catRows.length > 0 ? new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: createTableBorders(),
    rows: [
      new TableRow({
        tableHeader: true,
        cantSplit: true,
        children: [
          headerCell('KATEGORI', 40),
          headerCell('TOTAL', 20),
          headerCell('COMPLIANT', 20),
          headerCell('RATE', 20),
        ],
      }),
      ...catRows,
    ],
  }) : null;

  // Build final content
  const content = [
    heading2('3.13. Pemeriksaan Persyaratan Arsitektur'),
    bodyText('Pemeriksaan persyaratan arsitektur dilakukan berdasarkan Permen PUPR No. 6/PRT/M/2023 tentang Standar Konstruksi Bangunan Gedung, SNI 03-6389-2019 (Pencahayaan Alami), SNI 03-7068-2005 (Ventilasi dan Pengkondisian Udara), dan SNI 03-6388-2019 (Aksesibilitas).'),
    emptyLine(),
    heading3('3.13.1. Summary Persyaratan Arsitektur'),
    summaryTable,
    emptyLine(),
  ];

  if (catTable) {
    content.push(
      heading3('3.13.2. Compliance per Kategori'),
      bodyText('Ringkasan compliance persyaratan arsitektur berdasarkan kategori teknis.'),
      catTable, 
      emptyLine()
    );
  }

  if (reqTable) {
    content.push(
      heading3('3.13.3. Detail Persyaratan'),
      bodyText(`Total ${requirements.length} persyaratan tercatat (menampilkan 25 pertama). Kategori: ${categories.join(', ')}`),
      reqTable, 
      emptyLine()
    );
  }

  if (simTable) {
    content.push(
      heading3('3.13.4. Hasil Simulasi Engineering'),
      bodyText('Hasil simulasi pencahayaan, ventilasi, kebisingan, dan getaran struktur berdasarkan parameter SNI.'),
      simTable, 
      emptyLine()
    );
  }

  // Add recommendations
  const recommendations = [];
  if (nonCompliantReqs > 0) {
    recommendations.push(`Perbaiki ${nonCompliantReqs} persyaratan yang belum compliant dengan standar arsitektur.`);
  }
  if (complianceRate < 70) {
    recommendations.push('Tingkatkan compliance rate arsitektur ke target minimum 70%, idealnya 90%.');
  }
  if (simPencahayaan === 0) {
    recommendations.push('Lakukan simulasi pencahayaan alami untuk memastikan kenyamanan visual dan hemat energi.');
  }
  if (simVentilasi === 0) {
    recommendations.push('Lakukan simulasi ventilasi untuk memastikan kualitas udara dalam ruangan sesuai SNI.');
  }
  if (notChecked > 0) {
    recommendations.push(`${notChecked} persyaratan belum diperiksa. Lengkapi pemeriksaan seluruh aspek arsitektur.`);
  }

  if (recommendations.length > 0) {
    content.push(
      heading3('3.13.5. Rekomendasi'),
      ...recommendations.map((rec, idx) => numberedItem(rec, idx + 1)),
      emptyLine()
    );
  }

  content.push(
    bodyText(`Referensi: Permen PUPR No. 6/PRT/M/2023, SNI 03-6389-2019 (Pencahayaan Alami), SNI 03-7068-2005 (Ventilasi), SNI 03-6388-2019 (Aksesibilitas).`),
    emptyLine()
  );

  return content;
}
