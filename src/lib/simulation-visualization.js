// ============================================================
//  SIMULATION VISUALIZATION SERVICE
//  Generate gambar teknis dari hasil simulasi untuk laporan
//  Output: PNG/SVG yang siap disematkan ke Google Doc
// ============================================================

/**
 * Generate visualisasi jalur evakuasi sebagai SVG
 * @param {Object} result - Hasil simulasi evakuasi
 * @returns {string} SVG string
 */
export function generateEvacuationVisualization(result) {
  const { node_details, bottlenecks, total_nodes } = result;
  
  // Grid layout untuk visualisasi
  const width = 800;
  const height = 600;
  const padding = 40;
  
  // Definisi node positions (simplified layout)
  const nodePositions = {
    'room1': { x: 150, y: 100, label: 'Ruang A' },
    'room2': { x: 400, y: 100, label: 'Ruang B' },
    'room3': { x: 650, y: 100, label: 'Ruang C' },
    'corridor1': { x: 400, y: 250, label: 'Koridor' },
    'stair1': { x: 400, y: 400, label: 'Tangga' },
    'exit1': { x: 250, y: 500, label: 'Exit 1' },
    'exit2': { x: 550, y: 500, label: 'Exit 2' }
  };
  
  // Color mapping berdasarkan waktu evakuasi
  const getNodeColor = (nodeId) => {
    const detail = node_details[nodeId];
    if (!detail) return '#6b7280';
    const time = detail.evacuation_time;
    if (time <= 120) return '#10b981'; // Green - fast
    if (time <= 240) return '#f59e0b'; // Yellow - medium
    return '#ef4444'; // Red - slow
  };
  
  // Generate SVG
  let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;
  
  // Background
  svg += `<rect width="${width}" height="${height}" fill="#f8fafc"/>`;
  
  // Title
  svg += `<text x="${width/2}" y="30" text-anchor="middle" font-family="sans-serif" font-size="18" font-weight="bold" fill="#1e293b">DIAGRAM JALUR EVAKUASI</text>`;
  
  // Edges (connections)
  const connections = [
    ['room1', 'corridor1'],
    ['room2', 'corridor1'],
    ['room3', 'corridor1'],
    ['corridor1', 'stair1'],
    ['stair1', 'exit1'],
    ['stair1', 'exit2']
  ];
  
  connections.forEach(([from, to]) => {
    const fromPos = nodePositions[from];
    const toPos = nodePositions[to];
    if (fromPos && toPos) {
      // Check if this edge is a bottleneck
      const isBottleneck = bottlenecks.some(b => 
        (b.edge[0] === from && b.edge[1] === to) || 
        (b.edge[0] === to && b.edge[1] === from)
      );
      
      const strokeColor = isBottleneck ? '#ef4444' : '#94a3b8';
      const strokeWidth = isBottleneck ? 4 : 2;
      const dashArray = isBottleneck ? '5,5' : '0';
      
      svg += `<line x1="${fromPos.x}" y1="${fromPos.y}" x2="${toPos.x}" y2="${toPos.y}" 
        stroke="${strokeColor}" stroke-width="${strokeWidth}" stroke-dasharray="${dashArray}"/>`;
    }
  });
  
  // Nodes
  Object.entries(nodePositions).forEach(([nodeId, pos]) => {
    const detail = node_details[nodeId];
    const color = getNodeColor(nodeId);
    const isExit = nodeId.startsWith('exit');
    
    // Node circle
    const radius = isExit ? 30 : 25;
    svg += `<circle cx="${pos.x}" cy="${pos.y}" r="${radius}" fill="${color}" stroke="white" stroke-width="3"/>`;
    
    // Label
    svg += `<text x="${pos.x}" y="${pos.y - radius - 10}" text-anchor="middle" font-family="sans-serif" font-size="12" fill="#475968">${pos.label}</text>`;
    
    // Time label (if available)
    if (detail) {
      svg += `<text x="${pos.x}" y="${pos.y + 5}" text-anchor="middle" font-family="sans-serif" font-size="11" font-weight="bold" fill="white">${Math.round(detail.evacuation_time)}s</text>`;
    }
    
    // Exit icon
    if (isExit) {
      svg += `<text x="${pos.x}" y="${pos.y + radius + 15}" text-anchor="middle" font-family="sans-serif" font-size="10" fill="#10b981" font-weight="bold">EXIT</text>`;
    }
  });
  
  // Legend
  const legendY = height - 80;
  svg += `<rect x="30" y="${legendY}" width="200" height="70" fill="white" stroke="#e2e8f0" stroke-width="1" rx="8"/>`;
  svg += `<text x="40" y="${legendY + 20}" font-family="sans-serif" font-size="12" font-weight="bold" fill="#1e293b">LEGENDA:</text>`;
  
  // Legend items
  const legendItems = [
    { color: '#10b981', label: '≤ 2 menit (Aman)' },
    { color: '#f59e0b', label: '2-4 menit (Waspada)' },
    { color: '#ef4444', label: '> 4 menit (Kritis)' }
  ];
  
  legendItems.forEach((item, i) => {
    const y = legendY + 35 + (i * 15);
    svg += `<circle cx="50" cy="${y}" r="6" fill="${item.color}"/>`;
    svg += `<text x="65" y="${y + 4}" font-family="sans-serif" font-size="10" fill="#475968">${item.label}</text>`;
  });
  
  // Bottleneck indicator
  if (bottlenecks.length > 0) {
    svg += `<line x1="130" y1="${legendY + 30}" x2="180" y2="${legendY + 55}" stroke="#ef4444" stroke-width="3" stroke-dasharray="5,5"/>`;
    svg += `<text x="185" y="${legendY + 50}" font-family="sans-serif" font-size="9" fill="#ef4444">Bottleneck</text>`;
  }
  
  // Stats box
  svg += `<rect x="${width - 220}" y="${legendY}" width="190" height="70" fill="white" stroke="#e2e8f0" stroke-width="1" rx="8"/>`;
  svg += `<text x="${width - 210}" y="${legendY + 20}" font-family="sans-serif" font-size="12" font-weight="bold" fill="#1e293b">STATISTIK:</text>`;
  svg += `<text x="${width - 210}" y="${legendY + 38}" font-family="sans-serif" font-size="10" fill="#475968">Waktu rata-rata: ${result.average_evacuation_time}s</text>`;
  svg += `<text x="${width - 210}" y="${legendY + 55}" font-family="sans-serif" font-size="10" fill="#475968">Waktu maksimum: ${result.maximum_evacuation_time}s</text>`;
  
  svg += `</svg>`;
  
  return svg;
}

/**
 * Generate heatmap pencahayaan sebagai SVG
 * @param {Object} result - Hasil simulasi pencahayaan
 * @returns {string} SVG string
 */
export function generateLightingHeatmap(result) {
  const { zones, daylight_factor_avg, illuminance_avg } = result;
  
  const width = 600;
  const height = 400;
  const cellWidth = 150;
  const cellHeight = 100;
  
  // Color scale untuk daylight factor
  const getDFColor = (df) => {
    if (df >= 2.0) return '#22c55e'; // Good - green
    if (df >= 1.0) return '#84cc16'; // Adequate - yellow-green
    if (df >= 0.5) return '#eab308'; // Minimum - yellow
    return '#ef4444'; // Poor - red
  };
  
  let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;
  
  // Background
  svg += `<rect width="${width}" height="${height}" fill="#f8fafc"/>`;
  
  // Title
  svg += `<text x="${width/2}" y="30" text-anchor="middle" font-family="sans-serif" font-size="18" font-weight="bold" fill="#1e293b">DISTRIBUSI PENCAYAAN ALAMI</text>`;
  svg += `<text x="${width/2}" y="50" text-anchor="middle" font-family="sans-serif" font-size="12" fill="#64748b">Daylight Factor per Zona | Rata-rata: ${daylight_factor_avg}%</text>`;
  
  // Grid layout (2x2)
  const gridLayout = [
    { x: 50, y: 80, label: 'Depan', zone: zones.find(z => z.zone.includes('Depan')) },
    { x: 320, y: 80, label: 'Tengah', zone: zones.find(z => z.zone.includes('Tengah')) },
    { x: 50, y: 220, label: 'Belakang', zone: zones.find(z => z.zone.includes('Belakang')) },
  ];
  
  // Draw room outline
  svg += `<rect x="40" y="70" width="520" height="250" fill="none" stroke="#94a3b8" stroke-width="2" stroke-dasharray="5,5"/>`;
  
  // Window indicator (left side)
  svg += `<rect x="20" y="150" width="20" height="80" fill="#3b82f6" opacity="0.6"/>`;
  svg += `<text x="30" y="240" text-anchor="middle" font-family="sans-serif" font-size="10" fill="#3b82f6" transform="rotate(-90, 30, 240)">JENDELA</text>`;
  
  // Zones
  gridLayout.forEach((cell) => {
    const df = cell.zone?.daylight_factor || 0;
    const color = getDFColor(df);
    
    // Cell rectangle
    svg += `<rect x="${cell.x}" y="${cell.y}" width="${cellWidth}" height="${cellHeight}" 
      fill="${color}" opacity="0.3" stroke="${color}" stroke-width="2" rx="8"/>`;
    
    // Zone label
    svg += `<text x="${cell.x + cellWidth/2}" y="${cell.y + 25}" text-anchor="middle" font-family="sans-serif" font-size="14" font-weight="bold" fill="#1e293b">${cell.label}</text>`;
    
    // Daylight factor value
    svg += `<text x="${cell.x + cellWidth/2}" y="${cell.y + 55}" text-anchor="middle" font-family="sans-serif" font-size="24" font-weight="bold" fill="${color}">${df}%</text>`;
    
    // Illuminance
    const lux = cell.zone?.illuminance || 0;
    svg += `<text x="${cell.x + cellWidth/2}" y="${cell.y + 75}" text-anchor="middle" font-family="sans-serif" font-size="11" fill="#64748b">${Math.round(lux)} lux</text>`;
  });
  
  // Legend
  const legendY = height - 50;
  svg += `<text x="40" y="${legendY}" font-family="sans-serif" font-size="11" font-weight="bold" fill="#1e293b">Daylight Factor (SNI 03-2396-2001):</text>`;
  
  const legendItems = [
    { color: '#22c55e', label: 'Baik (≥2%)', min: 2 },
    { color: '#84cc16', label: 'Cukup (1-2%)', min: 1 },
    { color: '#eab308', label: 'Minimum (0.5-1%)', min: 0.5 },
    { color: '#ef4444', label: 'Kurang (<0.5%)', min: 0 }
  ];
  
  legendItems.forEach((item, i) => {
    const x = 40 + (i * 130);
    svg += `<rect x="${x}" y="${legendY + 10}" width="15" height="15" fill="${item.color}" rx="3"/>`;
    svg += `<text x="${x + 20}" y="${legendY + 22}" font-family="sans-serif" font-size="9" fill="#475968">${item.label}</text>`;
  });
  
  svg += `</svg>`;
  
  return svg;
}

/**
 * Generate chart NDT sebagai SVG
 * @param {Object} result - Hasil simulasi NDT
 * @returns {string} SVG string
 */
export function generateNDTChart(result) {
  const isRebound = result.test_type?.includes('Rebound');
  const values = isRebound ? result.rebound_values : result.pulse_velocities;
  const testPoints = values?.length || 0;
  
  const width = 700;
  const height = 400;
  const chartPadding = { top: 80, right: 40, bottom: 80, left: 60 };
  const chartWidth = width - chartPadding.left - chartPadding.right;
  const chartHeight = height - chartPadding.top - chartPadding.bottom;
  
  let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;
  
  // Background
  svg += `<rect width="${width}" height="${height}" fill="#f8fafc"/>`;
  
  // Title
  const title = isRebound ? 'HASIL UJI REBOUND HAMMER' : 'HASIL UJI UPV';
  svg += `<text x="${width/2}" y="30" text-anchor="middle" font-family="sans-serif" font-size="18" font-weight="bold" fill="#1e293b">${title}</text>`;
  svg += `<text x="${width/2}" y="50" text-anchor="middle" font-family="sans-serif" font-size="12" fill="#64748b">${testPoints} Titik Pengujian</text>`;
  
  // Chart area background
  svg += `<rect x="${chartPadding.left}" y="${chartPadding.top}" width="${chartWidth}" height="${chartHeight}" fill="white" stroke="#e2e8f0" stroke-width="1"/>`;
  
  // Y-axis grid lines
  const yMax = isRebound ? 60 : 5;
  const ySteps = 5;
  for (let i = 0; i <= ySteps; i++) {
    const y = chartPadding.top + chartHeight - (i * chartHeight / ySteps);
    const value = Math.round(i * yMax / ySteps);
    
    svg += `<line x1="${chartPadding.left}" y1="${y}" x2="${width - chartPadding.right}" y2="${y}" stroke="#e2e8f0" stroke-width="1"/>`;
    svg += `<text x="${chartPadding.left - 10}" y="${y + 4}" text-anchor="end" font-family="sans-serif" font-size="10" fill="#64748b">${value}</text>`;
  }
  
  // Y-axis label
  const yLabel = isRebound ? 'Nilai Rebound (R)' : 'Pulse Velocity (km/s)';
  svg += `<text x="20" y="${height/2}" text-anchor="middle" font-family="sans-serif" font-size="11" fill="#64748b" transform="rotate(-90, 20, ${height/2})">${yLabel}</text>`;
  
  // Bars
  const barWidth = Math.min(40, chartWidth / testPoints - 5);
  const maxValue = isRebound ? 60 : 5;
  
  values?.forEach((val, i) => {
    const x = chartPadding.left + (i * (chartWidth / testPoints)) + 10;
    const barHeight = (val / maxValue) * chartHeight;
    const y = chartPadding.top + chartHeight - barHeight;
    
    // Color based on value
    let color = '#3b82f6';
    if (isRebound) {
      if (val < 20) color = '#ef4444';
      else if (val < 30) color = '#f59e0b';
      else color = '#22c55e';
    } else {
      if (val < 3.0) color = '#ef4444';
      else if (val < 3.5) color = '#f59e0b';
      else if (val < 4.0) color = '#84cc16';
      else color = '#22c55e';
    }
    
    svg += `<rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" fill="${color}" opacity="0.8" rx="4"/>`;
    
    // Value label on top
    svg += `<text x="${x + barWidth/2}" y="${y - 5}" text-anchor="middle" font-family="sans-serif" font-size="9" fill="#1e293b">${val}</text>`;
    
    // X-axis label
    svg += `<text x="${x + barWidth/2}" y="${chartPadding.top + chartHeight + 20}" text-anchor="middle" font-family="sans-serif" font-size="9" fill="#64748b">T${i+1}</text>`;
  });
  
  // Mean line
  const meanValue = isRebound ? result.rebound_mean : result.velocity_mean;
  const meanY = chartPadding.top + chartHeight - ((meanValue / maxValue) * chartHeight);
  svg += `<line x1="${chartPadding.left}" y1="${meanY}" x2="${width - chartPadding.right}" y2="${meanY}" stroke="#dc2626" stroke-width="2" stroke-dasharray="5,5"/>`;
  svg += `<text x="${width - chartPadding.right + 5}" y="${meanY + 4}" font-family="sans-serif" font-size="10" fill="#dc2626" font-weight="bold">Mean: ${meanValue}</text>`;
  
  // Stats box
  const statsY = height - 40;
  svg += `<rect x="${width - 200}" y="${statsY}" width="180" height="35" fill="white" stroke="#e2e8f0" stroke-width="1" rx="6"/>`;
  
  const meanLabel = isRebound ? `fc = ${result.fc_mean} MPa` : `VP = ${result.velocity_mean} km/s`;
  const category = result.compliance?.category || result.quality_rating || '-';
  const categoryColor = category === 'Good' || category === 'Excellent' ? '#22c55e' : 
                        category === 'Fair' ? '#84cc16' : '#ef4444';
  
  svg += `<text x="${width - 190}" y="${statsY + 15}" font-family="sans-serif" font-size="10" font-weight="bold" fill="#1e293b">${meanLabel}</text>`;
  svg += `<text x="${width - 190}" y="${statsY + 28}" font-family="sans-serif" font-size="9" fill="${categoryColor}" font-weight="bold">Kategori: ${category}</text>`;
  
  svg += `</svg>`;
  
  return svg;
}

/**
 * Generate visualisasi ventilasi sebagai SVG
 * @param {Object} result - Hasil simulasi ventilasi
 * @returns {string} SVG string
 */
export function generateVentilationVisualization(result) {
  const { air_changes_per_hour, airflow_rate, zones, compliance } = result;
  
  const width = 600;
  const height = 400;
  
  let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;
  
  // Background
  svg += `<rect width="${width}" height="${height}" fill="#f8fafc"/>`;
  
  // Title
  svg += `<text x="${width/2}" y="30" text-anchor="middle" font-family="sans-serif" font-size="18" font-weight="bold" fill="#1e293b">ANALISIS VENTILASI ALAMI</text>`;
  svg += `<text x="${width/2}" y="50" text-anchor="middle" font-family="sans-serif" font-size="12" fill="#64748b">Air Changes per Hour (ACH) | Standar SNI: 5-6 ACH</text>`;
  
  // Main gauge for ACH
  const centerX = width / 2;
  const centerY = 180;
  const radius = 100;
  
  // Gauge background arc
  const startAngle = 135;
  const endAngle = 45;
  
  // Draw arc background
  svg += `<path d="${describeArc(centerX, centerY, radius, startAngle, endAngle)}" fill="none" stroke="#e2e8f0" stroke-width="20" stroke-linecap="round"/>`;
  
  // Draw value arc
  const maxAch = 10;
  const achAngle = startAngle + (air_changes_per_hour / maxAch) * (endAngle - startAngle + 360);
  const achColor = air_changes_per_hour >= 5 ? '#22c55e' : air_changes_per_hour >= 3 ? '#f59e0b' : '#ef4444';
  
  svg += `<path d="${describeArc(centerX, centerY, radius, startAngle, achAngle)}" fill="none" stroke="${achColor}" stroke-width="20" stroke-linecap="round"/>`;
  
  // Center text
  svg += `<text x="${centerX}" y="${centerY - 10}" text-anchor="middle" font-family="sans-serif" font-size="36" font-weight="bold" fill="#1e293b">${air_changes_per_hour.toFixed(1)}</text>`;
  svg += `<text x="${centerX}" y="${centerY + 15}" text-anchor="middle" font-family="sans-serif" font-size="12" fill="#64748b">ACH</text>`;
  svg += `<text x="${centerX}" y="${centerY + 35}" text-anchor="middle" font-family="sans-serif" font-size="10" fill="${achColor}" font-weight="bold">${compliance?.category || 'Unknown'}</text>`;
  
  // Airflow info
  svg += `<text x="${centerX}" y="${centerY + 70}" text-anchor="middle" font-family="sans-serif" font-size="11" fill="#64748b">Airflow: ${airflow_rate.toFixed(3)} m³/s</text>`;
  
  // Zone temperatures
  const zoneY = 320;
  svg += `<text x="40" y="${zoneY}" font-family="sans-serif" font-size="11" font-weight="bold" fill="#1e293b">Distribusi Suhu per Zona:</text>`;
  
  zones?.forEach((zone, i) => {
    const x = 40 + (i * 180);
    const tempColor = zone.temperature < 28 ? '#22c55e' : zone.temperature < 30 ? '#f59e0b' : '#ef4444';
    
    svg += `<rect x="${x}" y="${zoneY + 10}" width="160" height="50" fill="white" stroke="#e2e8f0" stroke-width="1" rx="6"/>`;
    svg += `<text x="${x + 10}" y="${zoneY + 28}" font-family="sans-serif" font-size="10" font-weight="bold" fill="#1e293b">${zone.zone}</text>`;
    svg += `<text x="${x + 10}" y="${zoneY + 45}" font-family="sans-serif" font-size="14" font-weight="bold" fill="${tempColor}">${zone.temperature}°C</text>`;
    svg += `<text x="${x + 80}" y="${zoneY + 45}" font-family="sans-serif" font-size="9" fill="#64748b">${zone.comfort}</text>`;
  });
  
  svg += `</svg>`;
  
  return svg;
}

// Helper function untuk menggambar arc SVG
function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
  const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
  return {
    x: centerX + (radius * Math.cos(angleInRadians)),
    y: centerY + (radius * Math.sin(angleInRadians))
  };
}

function describeArc(x, y, radius, startAngle, endAngle) {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  
  return [
    "M", start.x, start.y,
    "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
  ].join(" ");
}

/**
 * Convert SVG string to PNG menggunakan canvas
 * @param {string} svgString - SVG string
 * @returns {Promise<string>} Base64 PNG string
 */
export async function svgToPng(svgString, width = 800, height = 600) {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    const img = new Image();
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    
    img.onload = () => {
      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/png'));
    };
    
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };
    
    img.src = url;
  });
}

/**
 * Export semua visualisasi simulasi untuk laporan
 * @param {string} tipe - Tipe simulasi
 * @param {Object} result - Hasil simulasi
 * @returns {Promise<Object>} Object berisi SVG dan PNG base64
 */
export async function exportSimulationVisuals(tipe, result) {
  const visuals = {
    svg: null,
    png: null,
    metadata: {
      tipe,
      generatedAt: new Date().toISOString(),
      description: ''
    }
  };
  
  try {
    switch (tipe) {
      case 'evakuasi':
        visuals.svg = generateEvacuationVisualization(result);
        visuals.metadata.description = 'Diagram jalur evakuasi dengan heatmap waktu dan bottleneck';
        break;
      case 'pencahayaan':
        visuals.svg = generateLightingHeatmap(result);
        visuals.metadata.description = 'Heatmap distribusi pencahayaan alami per zona';
        break;
      case 'ventilasi':
        visuals.svg = generateVentilationVisualization(result);
        visuals.metadata.description = 'Analisis ventilasi alami dengan gauge ACH';
        break;
      case 'ndt_rebound':
      case 'ndt_upv':
        visuals.svg = generateNDTChart(result);
        visuals.metadata.description = `Chart hasil uji ${tipe === 'ndt_rebound' ? 'Rebound Hammer' : 'UPV'}`;
        break;
    }
    
    // Convert SVG to PNG
    if (visuals.svg) {
      visuals.png = await svgToPng(visuals.svg);
    }
    
    return visuals;
  } catch (err) {
    console.error('[SimulationViz] Export failed:', err);
    throw err;
  }
}

// Export all functions
export default {
  generateEvacuationVisualization,
  generateLightingHeatmap,
  generateVentilationVisualization,
  generateNDTChart,
  svgToPng,
  exportSimulationVisuals
};
