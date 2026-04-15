import {
  createTableBorders, headerCell, dataCell, heading2, heading3,
  bodyText, bulletItem, emptyLine, horizontalLine, pageBreak,
  FONT_MAIN, FONT_SIZE_BODY, FONT_SIZE_SMALL,
  COLOR_PRIMARY, COLOR_HEADING, COLOR_SUCCESS, COLOR_DANGER, COLOR_WARNING, COLOR_MUTED, COLOR_INFO,
  Table, TableRow, Paragraph, TextRun, WidthType, AlignmentType
} from './utils.js';

/**
 * Render Egress System (Means of Egress) Section for DOCX
 * Based on Permen PUPR No. 14/PRT/M/2017 (Pasal 220) & No. 26/PRT/M/2008
 */
export function renderEgressSystemSection(egressData = {}) {
  const {
    routes = [],
    components = [],
    lighting = [],
    smokeZones = [],
    occupantLoads = [],
    analyses = [],
    summary = {}
  } = egressData;

  const hasData = routes.length > 0 || components.length > 0;

  if (!hasData) {
    return [
      heading2('3.8. Pemeriksaan Sistem Jalur Evakuasi'),
      bodyText(
        'Data pemeriksaan sistem jalur evakuasi belum tersedia. Pemeriksaan mencakup evaluasi occupant load, travel distance, egress width, stair dimensions, emergency lighting, smoke zone, dan compliance dengan Permen PUPR No. 14/PRT/M/2017 (Pasal 220) serta No. 26/PRT/M/2008.'
      ),
      emptyLine(),
    ];
  }

  // Calculate statistics
  const compliantRoutes = routes.filter(r => r.compliance_status === 'COMPLIANT').length;
  const nonCompliantRoutes = routes.filter(r => r.compliance_status === 'NON_COMPLIANT').length;
  const passComponents = components.filter(c => c.status === 'PASS').length;
  const failComponents = components.filter(c => c.status === 'FAIL').length;
  const totalOccupantLoad = occupantLoads.reduce((sum, o) => sum + (o.calculated_load || 0), 0);
  const passLighting = lighting.filter(l => l.status === 'PASS').length;
  const compliantSmokeZones = smokeZones.filter(s => s.compliance_status === 'COMPLIANT').length;

  // Latest analysis
  const latestAnalysis = analyses.sort((a, b) => new Date(b.analyzed_at || 0) - new Date(a.analyzed_at || 0))[0] || {};
  const complianceScore = latestAnalysis.compliance_score || 0;

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
          dataCell('Total Jalur Evakuasi', 40, { bold: true }),
          dataCell(String(routes.length), 30, { center: true }),
          dataCell('Normal', 30, { center: true, color: COLOR_SUCCESS }),
        ],
      }),
      new TableRow({
        children: [
          dataCell('Jalur Compliant', 40, { bold: true }),
          dataCell(String(compliantRoutes), 30, { center: true }),
          dataCell(compliantRoutes > 0 ? 'OK' : '-', 30, { center: true, color: compliantRoutes > 0 ? COLOR_SUCCESS : COLOR_MUTED }),
        ],
      }),
      new TableRow({
        children: [
          dataCell('Jalur Non-Compliant', 40, { bold: true }),
          dataCell(String(nonCompliantRoutes), 30, { center: true }),
          dataCell(nonCompliantRoutes > 0 ? 'Perlu Perbaikan' : '-', 30, { center: true, color: nonCompliantRoutes > 0 ? COLOR_DANGER : COLOR_MUTED }),
        ],
      }),
      new TableRow({
        children: [
          dataCell('Total Occupant Load', 40, { bold: true }),
          dataCell(`${totalOccupantLoad} orang`, 30, { center: true }),
          dataCell(totalOccupantLoad > 0 ? 'Calculated' : '-', 30, { center: true, color: totalOccupantLoad > 0 ? COLOR_SUCCESS : COLOR_MUTED }),
        ],
      }),
      new TableRow({
        children: [
          dataCell('Komponen Exit Pass', 40, { bold: true }),
          dataCell(String(passComponents), 30, { center: true }),
          dataCell(passComponents > 0 ? 'OK' : '-', 30, { center: true, color: passComponents > 0 ? COLOR_SUCCESS : COLOR_MUTED }),
        ],
      }),
      new TableRow({
        children: [
          dataCell('Komponen Exit Fail', 40, { bold: true }),
          dataCell(String(failComponents), 30, { center: true }),
          dataCell(failComponents > 0 ? 'Kritis' : '-', 30, { center: true, color: failComponents > 0 ? COLOR_DANGER : COLOR_MUTED }),
        ],
      }),
      new TableRow({
        children: [
          dataCell('Penerangan Darurat Pass', 40, { bold: true }),
          dataCell(String(passLighting), 30, { center: true }),
          dataCell(passLighting > 0 ? 'OK' : '-', 30, { center: true, color: passLighting > 0 ? COLOR_SUCCESS : COLOR_MUTED }),
        ],
      }),
      new TableRow({
        children: [
          dataCell('Smoke Zone Compliant', 40, { bold: true }),
          dataCell(`${compliantSmokeZones}/${smokeZones.length}`, 30, { center: true }),
          dataCell(compliantSmokeZones === smokeZones.length && smokeZones.length > 0 ? 'OK' : 'Perlu Review', 30, { center: true, color: compliantSmokeZones === smokeZones.length && smokeZones.length > 0 ? COLOR_SUCCESS : COLOR_WARNING }),
        ],
      }),
      new TableRow({
        children: [
          dataCell('Skor Compliance', 40, { bold: true }),
          dataCell(`${complianceScore}/100`, 30, { center: true }),
          dataCell(complianceScore >= 80 ? 'BAIK' : complianceScore >= 60 ? 'SEDANG' : 'PERLU PERBAIKAN', 30, { center: true, bold: true, color: complianceScore >= 80 ? COLOR_SUCCESS : complianceScore >= 60 ? COLOR_WARNING : COLOR_DANGER }),
        ],
      }),
    ],
  });

  // Occupant Load Analysis
  const occupantRows = occupantLoads.map((load, idx) => new TableRow({
    children: [
      dataCell(load.room_name || `Ruang ${idx + 1}`, 25, { shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
      dataCell(load.room_function || '-', 20, { shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
      dataCell(`${load.room_area?.toFixed(1) || '-'} m²`, 15, { center: true, shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
      dataCell(`${load.occupant_factor || '-'} m²/orang`, 15, { center: true, shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
      dataCell(`${load.calculated_load || '-'} orang`, 15, { center: true, bold: true, shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
      dataCell(load.actual_load || '-', 10, { center: true, shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
    ],
  }));

  const occupantTable = occupantRows.length > 0 ? new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: createTableBorders(),
    rows: [
      new TableRow({
        tableHeader: true,
        cantSplit: true,
        children: [
          headerCell('RUANG', 25),
          headerCell('FUNGSI', 20),
          headerCell('LUAS', 15),
          headerCell('FAKTOR', 15),
          headerCell('OCCUPANT', 15),
          headerCell('AKTUAL', 10),
        ],
      }),
      ...occupantRows,
    ],
  }) : null;

  // Route Analysis Table
  const routeRows = routes.map((route, idx) => {
    const statusColor = route.compliance_status === 'COMPLIANT' ? COLOR_SUCCESS :
                       route.compliance_status === 'NON_COMPLIANT' ? COLOR_DANGER : COLOR_WARNING;

    return new TableRow({
      children: [
        dataCell(route.floor_level || '-', 10, { center: true, shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
        dataCell(route.room_origin || '-', 20, { shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
        dataCell(route.exit_destination || '-', 20, { shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
        dataCell(`${route.travel_distance?.toFixed(2) || '-'} m`, 12, { center: true, shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
        dataCell(`${route.width_clear?.toFixed(2) || '-'} m`, 12, { center: true, shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
        dataCell(`${route.occupant_load || '-'}`, 10, { center: true, shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
        dataCell(route.is_dead_end ? 'Ya' : 'Tidak', 10, { center: true, shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
        dataCell(route.compliance_status || '-', 16, { center: true, bold: true, color: statusColor, shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
      ],
    });
  });

  const routeTable = routeRows.length > 0 ? new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: createTableBorders(),
    rows: [
      new TableRow({
        tableHeader: true,
        cantSplit: true,
        children: [
          headerCell('LT', 10),
          headerCell('ASAL', 20),
          headerCell('TUJUAN', 20),
          headerCell('JARAK', 12),
          headerCell('LEBAR', 12),
          headerCell('ORANG', 10),
          headerCell('DEAD END', 10),
          headerCell('STATUS', 16),
        ],
      }),
      ...routeRows,
    ],
  }) : null;

  // Component Analysis (Doors, Stairs, etc.)
  const componentRows = components.map((comp, idx) => {
    const statusColor = comp.status === 'PASS' ? COLOR_SUCCESS :
                       comp.status === 'FAIL' ? COLOR_DANGER : COLOR_WARNING;

    return new TableRow({
      children: [
        dataCell(comp.component_type || '-', 15, { shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
        dataCell(comp.location_description || '-', 25, { shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
        dataCell(`${comp.width_measured?.toFixed(2) || '-'} m`, 12, { center: true, shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
        dataCell(comp.swing_direction || '-', 12, { center: true, shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
        dataCell(comp.riser_height ? `O:${comp.riser_height} A:${comp.tread_depth}` : '-', 20, { center: true, shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
        dataCell(`${comp.headroom_clearance?.toFixed(0) || '-'} mm`, 10, { center: true, shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
        dataCell(comp.status || '-', 16, { center: true, bold: true, color: statusColor, shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
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
          headerCell('TIPE', 15),
          headerCell('LOKASI', 25),
          headerCell('LEBAR', 12),
          headerCell('SWING', 12),
          headerCell('DIMENSI TANGGA', 20),
          headerCell('HEADROOM', 10),
          headerCell('STATUS', 16),
        ],
      }),
      ...componentRows,
    ],
  }) : null;

  // Emergency Lighting Table
  const lightingRows = lighting.map((light, idx) => {
    const statusColor = light.status === 'PASS' ? COLOR_SUCCESS :
                       light.status === 'FAIL' ? COLOR_DANGER : COLOR_WARNING;
    const luxStatus = (light.lux_level || 0) >= 50 ? 'OK' : (light.lux_level || 0) >= 20 ? 'Minimal' : 'Kurang';

    return new TableRow({
      children: [
        dataCell(light.floor_level || '-', 12, { center: true, shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
        dataCell(light.location || '-', 28, { shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
        dataCell(`${light.lux_level?.toFixed(1) || '-'} lux`, 15, { center: true, shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
        dataCell(luxStatus, 15, { center: true, color: statusColor, shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
        dataCell(light.exit_sign_visible ? 'Ya' : 'Tidak', 14, { center: true, shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
        dataCell(light.battery_backup ? `${light.battery_backup} menit` : '-', 16, { center: true, shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
      ],
    });
  });

  const lightingTable = lightingRows.length > 0 ? new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: createTableBorders(),
    rows: [
      new TableRow({
        tableHeader: true,
        cantSplit: true,
        children: [
          headerCell('LT', 12),
          headerCell('LOKASI', 28),
          headerCell('LUX LEVEL', 15),
          headerCell('STATUS LUX', 15),
          headerCell('EXIT SIGN', 14),
          headerCell('BATTERY', 16),
        ],
      }),
      ...lightingRows,
    ],
  }) : null;

  // Smoke Zone Table
  const smokeRows = smokeZones.map((zone, idx) => {
    const areaOk = (zone.area || 0) <= 1600;
    const heightOk = (zone.smoke_layer_height || 0) >= 2.5;
    const statusColor = areaOk && heightOk ? COLOR_SUCCESS : COLOR_DANGER;

    return new TableRow({
      children: [
        dataCell(zone.floor_level || '-', 12, { center: true, shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
        dataCell(zone.zone_name || `Zona ${idx + 1}`, 20, { shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
        dataCell(`${zone.area?.toFixed(0) || '-'} m²`, 15, { center: true, shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
        dataCell(areaOk ? '✓' : '✗', 8, { center: true, color: areaOk ? COLOR_SUCCESS : COLOR_DANGER, shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
        dataCell(`${zone.smoke_layer_height?.toFixed(1) || '-'} m`, 15, { center: true, shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
        dataCell(heightOk ? '✓' : '✗', 8, { center: true, color: heightOk ? COLOR_SUCCESS : COLOR_DANGER, shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
        dataCell(zone.pressurized ? 'Ya' : 'Tidak', 12, { center: true, shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
        dataCell(zone.compliance_status || '-', 20, { center: true, bold: true, color: statusColor, shading: idx % 2 === 0 ? 'F5F5F5' : undefined }),
      ],
    });
  });

  const smokeTable = smokeRows.length > 0 ? new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: createTableBorders(),
    rows: [
      new TableRow({
        tableHeader: true,
        cantSplit: true,
        children: [
          headerCell('LT', 12),
          headerCell('ZONA', 20),
          headerCell('LUAS', 15),
          headerCell('≤1600m²', 8),
          headerCell('SMOKE LAYER', 15),
          headerCell('≥2.5m', 8),
          headerCell('PRESSURE', 12),
          headerCell('STATUS', 20),
        ],
      }),
      ...smokeRows,
    ],
  }) : null;

  // Build final content
  const content = [
    heading2('3.8. Pemeriksaan Sistem Jalur Evakuasi'),
    bodyText('Pemeriksaan sistem jalur evakuasi dilakukan berdasarkan Permen PUPR No. 14/PRT/M/2017 (Pasal 220) dan No. 26/PRT/M/2008. Evaluasi mencakup occupant load, travel distance, egress capacity, stair dimensions, emergency lighting, dan smoke zone compliance.'),
    emptyLine(),
    heading3('3.8.1. Summary Compliance'),
    summaryTable,
    emptyLine(),
  ];

  if (occupantTable) {
    content.push(heading3('3.8.2. Analisis Occupant Load'), occupantTable, emptyLine());
  }

  if (routeTable) {
    content.push(heading3('3.8.3. Detail Jalur Evakuasi'), routeTable, emptyLine());
  }

  if (componentTable) {
    content.push(heading3('3.8.4. Komponen Exit (Pintu, Tangga)'), componentTable, emptyLine());
  }

  if (lightingTable) {
    content.push(heading3('3.8.5. Penerangan dan Signage Darurat'), lightingTable, emptyLine());
  }

  if (smokeTable) {
    content.push(heading3('3.8.6. Zona Asap dan Pressurization'), smokeTable, emptyLine());
  }

  // Analysis Summary
  if (latestAnalysis && latestAnalysis.status) {
    content.push(
      heading3('3.8.7. Hasil Analisis Kelayakan'),
      bodyText(`Status Compliance: ${latestAnalysis.status || 'N/A'}`),
      bodyText(`Skor Compliance: ${latestAnalysis.compliance_score || 0}/100`),
      bodyText(`Total Occupant Load: ${latestAnalysis.total_occupant_load || 0} orang`),
      bodyText(`Jumlah Exit: ${latestAnalysis.number_of_exits || 0} (Required: ${latestAnalysis.required_number_of_exits || 2})`),
      bodyText(`Max Travel Distance: ${latestAnalysis.max_travel_distance?.toFixed(2) || '-'} m (Allowed: ${latestAnalysis.allowed_travel_distance?.toFixed(2) || '-'} m)`),
      emptyLine(),
      bodyText('Rekomendasi:'),
      bulletItem(`Exit Number Compliance: ${latestAnalysis.number_of_exits >= latestAnalysis.required_number_of_exits ? 'Memenuhi' : 'Perlu penambahan exit'}`),
      bulletItem(`Travel Distance: ${latestAnalysis.max_travel_distance <= latestAnalysis.allowed_travel_distance ? 'Memenuhi' : 'Perlu review jalur evakuasi'}`),
      bulletItem(`Width & Capacity: ${latestAnalysis.provided_exit_width >= latestAnalysis.required_exit_width ? 'Memenuhi' : 'Perlu penambahan lebar exit'}`),
      emptyLine(),
      bodyText(`Referensi: Permen PUPR No. 14/PRT/M/2017 (Pasal 220), Permen PUPR No. 26/PRT/M/2008, NFPA 101 Life Safety Code`),
      emptyLine(),
    );
  }

  return content;
}
