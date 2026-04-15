/**
 * SANITATION VISUALIZATION LIBRARY
 * Diagrams, Charts, and Flow Visualizations for Sanitation Systems
 * Uses Chart.js for graphs and SVG for flow diagrams
 */

import Chart from 'chart.js/auto';

// Color scheme
const COLORS = {
  brown: { main: '#8B4513', light: '#CD853F', dark: '#5D3A1A' },
  green: { main: '#228B22', light: '#90EE90', dark: '#006400' },
  blue: { main: '#4682B4', light: '#87CEEB', dark: '#1E3A5F' },
  gray: { main: '#6B7280', light: '#9CA3AF', dark: '#374151' },
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#3B82F6'
};

// ============================================================
// 1. FLOW DIAGRAM (SVG)
// ============================================================

/**
 * Generate flow diagram showing Inlet → Septic → IPAL → Outlet
 * @param {Object} config - System configuration
 * @returns {string} SVG HTML
 */
export function generateFlowDiagram(config = {}) {
  const {
    hasChute = true,
    hasSeptic = true,
    hasIPAL = true,
    septicStatus = 'normal', // normal, warning, critical
    ipalStatus = 'normal',
    flowRate = 100, // percentage
    showLabels = true
  } = config;
  
  const septicColor = septicStatus === 'critical' ? COLORS.danger : 
                      septicStatus === 'warning' ? COLORS.warning : 
                      COLORS.brown.main;
  
  const ipalColor = ipalStatus === 'critical' ? COLORS.danger : 
                    ipalStatus === 'warning' ? COLORS.warning : 
                    COLORS.green.main;
  
  return `
    <svg viewBox="0 0 800 200" style="width: 100%; max-width: 900px; height: auto;">
      <defs>
        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="${COLORS.gray.main}" />
        </marker>
        <linearGradient id="septicGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${septicColor};stop-opacity:0.8" />
          <stop offset="100%" style="stop-color:${septicColor};stop-opacity:1" />
        </linearGradient>
        <linearGradient id="ipalGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${ipalColor};stop-opacity:0.8" />
          <stop offset="100%" style="stop-color:${ipalColor};stop-opacity:1" />
        </linearGradient>
      </defs>
      
      <!-- Connection Lines -->
      <line x1="140" y1="100" x2="200" y2="100" stroke="${COLORS.brown.main}" stroke-width="4" marker-end="url(#arrowhead)" />
      <line x1="340" y1="100" x2="420" y2="100" stroke="${COLORS.brown.main}" stroke-width="4" marker-end="url(#arrowhead)" />
      <line x1="580" y1="100" x2="660" y2="100" stroke="${COLORS.blue.main}" stroke-width="4" marker-end="url(#arrowhead)" />
      
      <!-- Chute/Inlet -->
      ${hasChute ? `
      <g transform="translate(50, 50)">
        <rect x="0" y="0" width="80" height="100" rx="10" fill="hsla(220, 20%, 100%, 0.05)" stroke="${COLORS.gray.main}" stroke-width="2" />
        <rect x="20" y="20" width="40" height="60" rx="5" fill="url(#septicGradient)" opacity="0.8" />
        <text x="40" y="95" text-anchor="middle" fill="white" font-size="10" font-family="monospace">INLET</text>
        ${showLabels ? `<text x="40" y="-10" text-anchor="middle" fill="${COLORS.gray.light}" font-size="9">Chute/Pipa</text>` : ''}
      </g>
      ` : ''}
      
      <!-- Septic Tank -->
      ${hasSeptic ? `
      <g transform="translate(220, 50)" style="cursor: pointer;" onclick="window._showComponentDetail('septic')">
        <rect x="0" y="0" width="100" height="100" rx="15" fill="hsla(220, 20%, 100%, 0.05)" stroke="${septicColor}" stroke-width="3" />
        <rect x="10" y="15" width="35" height="70" rx="5" fill="url(#septicGradient)" opacity="0.6" />
        <rect x="55" y="35" width="35" height="50" rx="5" fill="url(#septicGradient)" opacity="0.8" />
        <text x="50" y="95" text-anchor="middle" fill="white" font-size="10" font-weight="bold" font-family="monospace">SEPTIC</text>
        <text x="27" y="55" text-anchor="middle" fill="white" font-size="8">2/3</text>
        <text x="72" y="65" text-anchor="middle" fill="white" font-size="8">1/3</text>
        ${showLabels ? `<text x="50" y="-10" text-anchor="middle" fill="${COLORS.gray.light}" font-size="9">Penampungan</text>` : ''}
        ${septicStatus !== 'normal' ? `
          <circle cx="90" cy="10" r="8" fill="${septicStatus === 'critical' ? COLORS.danger : COLORS.warning}" />
          <text x="90" y="14" text-anchor="middle" fill="white" font-size="10">!</text>
        ` : ''}
      </g>
      ` : ''}
      
      <!-- IPAL -->
      ${hasIPAL ? `
      <g transform="translate(440, 40)" style="cursor: pointer;" onclick="window._showComponentDetail('ipal')">
        <rect x="0" y="0" width="120" height="120" rx="15" fill="hsla(220, 20%, 100%, 0.05)" stroke="${ipalColor}" stroke-width="3" />
        <!-- Anaerob compartment -->
        <rect x="10" y="15" width="30" height="90" rx="5" fill="url(#ipalGradient)" opacity="0.4" />
        <text x="25" y="65" text-anchor="middle" fill="white" font-size="7">ANA</text>
        <!-- Aerob compartment -->
        <rect x="45" y="15" width="30" height="90" rx="5" fill="url(#ipalGradient)" opacity="0.6" />
        <text x="60" y="65" text-anchor="middle" fill="white" font-size="7">AER</text>
        <!-- Settling compartment -->
        <rect x="80" y="35" width="30" height="70" rx="5" fill="url(#ipalGradient)" opacity="0.8" />
        <text x="95" y="75" text-anchor="middle" fill="white" font-size="7">SET</text>
        <text x="60" y="115" text-anchor="middle" fill="white" font-size="10" font-weight="bold" font-family="monospace">IPAL</text>
        ${showLabels ? `<text x="60" y="-5" text-anchor="middle" fill="${COLORS.gray.light}" font-size="9">Pengolahan</text>` : ''}
        ${ipalStatus !== 'normal' ? `
          <circle cx="110" cy="10" r="8" fill="${ipalStatus === 'critical' ? COLORS.danger : COLORS.warning}" />
          <text x="110" y="14" text-anchor="middle" fill="white" font-size="10">!</text>
        ` : ''}
      </g>
      ` : ''}
      
      <!-- Outlet -->
      <g transform="translate(680, 50)">
        <rect x="0" y="0" width="80" height="100" rx="10" fill="hsla(220, 20%, 100%, 0.05)" stroke="${COLORS.blue.main}" stroke-width="2" />
        <path d="M 20 35 L 60 35 L 60 25 L 75 50 L 60 75 L 60 65 L 20 65 Z" fill="${COLORS.blue.light}" opacity="0.7" />
        <text x="40" y="95" text-anchor="middle" fill="white" font-size="10" font-family="monospace">OUTLET</text>
        ${showLabels ? `<text x="40" y="-10" text-anchor="middle" fill="${COLORS.gray.light}" font-size="9">Effluent</text>` : ''}
      </g>
      
      <!-- Flow Rate Indicator -->
      <text x="400" y="170" text-anchor="middle" fill="${COLORS.gray.light}" font-size="10" font-family="monospace">
        FLOW RATE: ${flowRate}%
      </text>
    </svg>
  `;
}

// ============================================================
// 2. CROSS-SECTION VIEWER (Septic Tank / IPAL)
// ============================================================

/**
 * Generate cross-section view of septic tank
 * @param {Object} dimensions - Tank dimensions
 * @param {number} sludgeLevel - Current sludge level (percentage)
 * @returns {string} SVG HTML
 */
export function generateSepticTankCrossSection(dimensions = {}, sludgeLevel = 30) {
  const {
    length = 2.5,
    width = 1.2,
    depth = 2.0,
    wallThickness = 0.15
  } = dimensions;
  
  const scale = 80; // pixels per meter
  const svgWidth = (length + wallThickness * 2) * scale + 100;
  const svgHeight = (depth + wallThickness * 2) * scale + 100;
  
  const tankWidth = length * scale;
  const tankHeight = depth * scale;
  const wallThick = wallThickness * scale;
  const offsetX = 50;
  const offsetY = 50;
  
  // Sludge height
  const sludgeHeight = (sludgeLevel / 100) * tankHeight;
  
  // Compartment divider position (2/3 length)
  const dividerX = offsetX + wallThick + (tankWidth * 2 / 3);
  
  return `
    <svg viewBox="0 0 ${svgWidth} ${svgHeight}" style="width: 100%; max-width: ${svgWidth}px; height: auto;">
      <!-- Tank walls -->
      <rect x="${offsetX}" y="${offsetY}" 
            width="${tankWidth + wallThick * 2}" height="${tankHeight + wallThick * 2}" 
            fill="none" stroke="${COLORS.gray.main}" stroke-width="${wallThick}" rx="5" />
      
      <!-- Inner tank -->
      <rect x="${offsetX + wallThick}" y="${offsetY + wallThick}" 
            width="${tankWidth}" height="${tankHeight}" 
            fill="hsla(200, 20%, 50%, 0.1)" stroke="none" />
      
      <!-- Sludge -->
      <rect x="${offsetX + wallThick}" y="${offsetY + wallThick + tankHeight - sludgeHeight}" 
            width="${tankWidth}" height="${sludgeHeight}" 
            fill="${COLORS.brown.main}" opacity="0.6" />
      
      <!-- Compartment divider -->
      <line x1="${dividerX}" y1="${offsetY + wallThick}" 
            x2="${dividerX}" y2="${offsetY + wallThick + tankHeight}" 
            stroke="${COLORS.gray.main}" stroke-width="3" stroke-dasharray="5,3" />
      
      <!-- Water level -->
      <line x1="${offsetX + wallThick}" y1="${offsetY + wallThick + tankHeight * 0.8}" 
            x2="${offsetX + wallThick + tankWidth}" y2="${offsetY + wallThick + tankHeight * 0.8}" 
            stroke="${COLORS.blue.main}" stroke-width="2" stroke-dasharray="3,3" />
      
      <!-- Inlet pipe -->
      <rect x="${offsetX - 20}" y="${offsetY + wallThick + 20}" 
            width="25" height="12" fill="${COLORS.gray.dark}" />
      
      <!-- Outlet pipe -->
      <rect x="${offsetX + tankWidth + wallThick - 5}" y="${offsetY + wallThick + tankHeight - 40}" 
            width="25" height="12" fill="${COLORS.gray.dark}" />
      
      <!-- Dimensions -->
      <text x="${offsetX + wallThick + tankWidth/2}" y="${offsetY + wallThick + tankHeight + 25}" 
            text-anchor="middle" fill="white" font-size="11" font-family="monospace">
        L: ${length}m
      </text>
      <text x="${offsetX - 5}" y="${offsetY + wallThick + tankHeight/2}" 
            text-anchor="end" fill="white" font-size="11" font-family="monospace" transform="rotate(-90, ${offsetX - 5}, ${offsetY + wallThick + tankHeight/2})">
        D: ${depth}m
      </text>
      
      <!-- Labels -->
      <text x="${dividerX - tankWidth/6}" y="${offsetY + 25}" text-anchor="middle" fill="white" font-size="9">Sedimentasi (2/3)</text>
      <text x="${dividerX + tankWidth/6}" y="${offsetY + 25}" text-anchor="middle" fill="white" font-size="9">Pembusukan (1/3)</text>
      
      <!-- Sludge level indicator -->
      <text x="${offsetX + tankWidth + wallThick + 10}" y="${offsetY + wallThick + tankHeight - sludgeHeight/2}" 
            fill="${COLORS.brown.light}" font-size="9">Lumpur: ${sludgeLevel}%</text>
    </svg>
  `;
}

/**
 * Generate cross-section view of IPAL
 * @param {Object} config - IPAL configuration
 * @returns {string} SVG HTML
 */
export function generateIPALCrossSection(config = {}) {
  const {
    totalVolume = 5,
    anaerobPercent = 30,
    aerobPercent = 50,
    settlingPercent = 20,
    depth = 2
  } = config;
  
  const scale = 60;
  const totalLength = Math.sqrt(totalVolume / depth) * 2; // Approximation
  const svgWidth = totalLength * scale + 120;
  const svgHeight = depth * scale + 100;
  
  const tankLength = totalLength * scale;
  const tankHeight = depth * scale;
  const offsetX = 60;
  const offsetY = 50;
  
  const anaerobWidth = tankLength * (anaerobPercent / 100);
  const aerobWidth = tankLength * (aerobPercent / 100);
  const settlingWidth = tankLength * (settlingPercent / 100);
  
  return `
    <svg viewBox="0 0 ${svgWidth} ${svgHeight}" style="width: 100%; max-width: ${svgWidth}px; height: auto;">
      <!-- Anaerob compartment -->
      <g transform="translate(${offsetX}, ${offsetY})">
        <rect x="0" y="0" width="${anaerobWidth}" height="${tankHeight}" 
              fill="${COLORS.green.dark}" opacity="0.5" stroke="${COLORS.gray.main}" stroke-width="2" />
        <text x="${anaerobWidth/2}" y="${tankHeight/2}" text-anchor="middle" fill="white" font-size="10" font-weight="bold">ANAEROB</text>
        <text x="${anaerobWidth/2}" y="${tankHeight/2 + 15}" text-anchor="middle" fill="white" font-size="9">${anaerobPercent}%</text>
        <text x="${anaerobWidth/2}" y="${tankHeight + 20}" text-anchor="middle" fill="${COLORS.gray.light}" font-size="10">${(totalVolume * anaerobPercent/100).toFixed(1)}m³</text>
      </g>
      
      <!-- Aerob compartment -->
      <g transform="translate(${offsetX + anaerobWidth}, ${offsetY})">
        <rect x="0" y="0" width="${aerobWidth}" height="${tankHeight}" 
              fill="${COLORS.green.main}" opacity="0.6" stroke="${COLORS.gray.main}" stroke-width="2" />
        <text x="${aerobWidth/2}" y="${tankHeight/2}" text-anchor="middle" fill="white" font-size="10" font-weight="bold">AEROB</text>
        <text x="${aerobWidth/2}" y="${tankHeight/2 + 15}" text-anchor="middle" fill="white" font-size="9">${aerobPercent}%</text>
        <text x="${aerobWidth/2}" y="${tankHeight + 20}" text-anchor="middle" fill="${COLORS.gray.light}" font-size="10">${(totalVolume * aerobPercent/100).toFixed(1)}m³</text>
      </g>
      
      <!-- Settling compartment -->
      <g transform="translate(${offsetX + anaerobWidth + aerobWidth}, ${offsetY})">
        <rect x="0" y="0" width="${settlingWidth}" height="${tankHeight}" 
              fill="${COLORS.blue.main}" opacity="0.5" stroke="${COLORS.gray.main}" stroke-width="2" />
        <text x="${settlingWidth/2}" y="${tankHeight/2}" text-anchor="middle" fill="white" font-size="9" font-weight="bold">SETTLING</text>
        <text x="${settlingWidth/2}" y="${tankHeight/2 + 15}" text-anchor="middle" fill="white" font-size="8">${settlingPercent}%</text>
        <text x="${settlingWidth/2}" y="${tankHeight + 20}" text-anchor="middle" fill="${COLORS.gray.light}" font-size="10">${(totalVolume * settlingPercent/100).toFixed(1)}m³</text>
      </g>
      
      <!-- Arrows showing flow -->
      <g transform="translate(${offsetX}, ${offsetY - 20})">
        <line x1="0" y1="10" x2="${tankLength}" y2="10" stroke="${COLORS.blue.light}" stroke-width="2" stroke-dasharray="5,3" marker-end="url(#arrowhead-ipal)" />
      </g>
      
      <defs>
        <marker id="arrowhead-ipal" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="${COLORS.blue.light}" />
        </marker>
      </defs>
      
      <!-- Title -->
      <text x="${svgWidth/2}" y="25" text-anchor="middle" fill="white" font-size="12" font-weight="bold" font-family="monospace">
        IPAL Biofilter - Total: ${totalVolume}m³
      </text>
    </svg>
  `;
}

// ============================================================
// 3. PIPE PROFILE (Longitudinal Section)
// ============================================================

/**
 * Generate longitudinal pipe profile with slope indicators
 * @param {Array} segments - Pipe segments with elevation data
 * @returns {string} SVG HTML
 */
export function generatePipeProfile(segments = []) {
  if (segments.length === 0) return '<div style="padding: 20px; text-align: center; color: var(--text-tertiary);">Tidak ada data segmen pipa</div>';
  
  const width = 800;
  const height = 300;
  const padding = { top: 40, right: 40, bottom: 60, left: 60 };
  
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  
  // Calculate scales
  const totalLength = segments.reduce((sum, s) => sum + s.length, 0);
  const elevations = segments.map(s => s.startElevation);
  elevations.push(segments[segments.length - 1].endElevation);
  const minElevation = Math.min(...elevations);
  const maxElevation = Math.max(...elevations);
  const elevationRange = maxElevation - minElevation || 1;
  
  const xScale = chartWidth / totalLength;
  const yScale = chartHeight / elevationRange;
  
  // Generate points for the pipe line
  let currentX = 0;
  const points = segments.map((seg, i) => {
    const x1 = padding.left + currentX * xScale;
    const y1 = padding.top + chartHeight - (seg.startElevation - minElevation) * yScale;
    const x2 = padding.left + (currentX + seg.length) * xScale;
    const y2 = padding.top + chartHeight - (seg.endElevation - minElevation) * yScale;
    currentX += seg.length;
    return { x1, y1, x2, y2, slope: seg.slope, length: seg.length, diameter: seg.diameter };
  });
  
  return `
    <svg viewBox="0 0 ${width} ${height}" style="width: 100%; max-width: ${width}px; height: auto;">
      <!-- Grid lines -->
      ${Array.from({ length: 6 }, (_, i) => {
        const y = padding.top + (chartHeight * i / 5);
        return `<line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="hsla(220, 20%, 100%, 0.1)" stroke-width="1" />`;
      }).join('')}
      
      <!-- Ground level line -->
      ${points.map((p, i) => {
        // Simplified ground level (2m above pipe)
        const groundY1 = p.y1 - 40;
        const groundY2 = p.y2 - 40;
        return `<line x1="${p.x1}" y1="${groundY1}" x2="${p.x2}" y2="${groundY2}" stroke="${COLORS.brown.light}" stroke-width="2" stroke-dasharray="3,3" />`;
      }).join('')}
      
      <!-- Pipe line -->
      ${points.map((p, i) => `
        <line x1="${p.x1}" y1="${p.y1}" x2="${p.x2}" y2="${p.y2}" 
              stroke="${p.slope >= 2 ? COLORS.success : COLORS.warning}" stroke-width="6" />
        <circle cx="${p.x1}" cy="${p.y1}" r="4" fill="${COLORS.gray.main}" />
        ${i === points.length - 1 ? `<circle cx="${p.x2}" cy="${p.y2}" r="4" fill="${COLORS.gray.main}" />` : ''}
      `).join('')}
      
      <!-- Slope indicators -->
      ${points.map((p, i) => `
        <g transform="translate(${(p.x1 + p.x2) / 2}, ${(p.y1 + p.y2) / 2 - 20})">
          <rect x="-25" y="-10" width="50" height="20" rx="4" fill="hsla(220, 20%, 5%, 0.8)" stroke="${p.slope >= 2 ? COLORS.success : COLORS.warning}" stroke-width="1" />
          <text x="0" y="4" text-anchor="middle" fill="${p.slope >= 2 ? COLORS.success : COLORS.warning}" font-size="9" font-weight="bold">${p.slope}%</text>
        </g>
      `).join('')}
      
      <!-- Distance markers -->
      ${points.map((p, i) => `
        <text x="${p.x1}" y="${height - 20}" text-anchor="middle" fill="${COLORS.gray.light}" font-size="9">${(i * 10)}m</text>
      `).join('')}
      <text x="${width - padding.right}" y="${height - 20}" text-anchor="middle" fill="${COLORS.gray.light}" font-size="9">${totalLength}m</text>
      
      <!-- Labels -->
      <text x="20" y="${height / 2}" text-anchor="middle" fill="${COLORS.gray.light}" font-size="10" transform="rotate(-90, 20, ${height / 2})">Elevasi (m)</text>
      <text x="${width / 2}" y="${height - 5}" text-anchor="middle" fill="${COLORS.gray.light}" font-size="10">Jarak (m)</text>
      <text x="${width / 2}" y="20" text-anchor="middle" fill="white" font-size="12" font-weight="bold">Profil Longitudinal Pipa</text>
    </svg>
  `;
}

// ============================================================
// 4. CHARTS
// ============================================================

/**
 * Create effluent quality trend chart
 * @param {string} canvasId - Canvas element ID
 * @param {Array} data - Array of test results
 */
export function createEffluentQualityChart(canvasId, data = []) {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return null;
  
  const sortedData = [...data].sort((a, b) => new Date(a.testDate) - new Date(b.testDate));
  
  return new Chart(ctx, {
    type: 'line',
    data: {
      labels: sortedData.map(d => new Date(d.testDate).toLocaleDateString('id-ID')),
      datasets: [
        {
          label: 'BOD (mg/L)',
          data: sortedData.map(d => d.parameters?.bod || 0),
          borderColor: COLORS.brown.main,
          backgroundColor: COLORS.brown.main + '33',
          fill: false,
          tension: 0.3
        },
        {
          label: 'TSS (mg/L)',
          data: sortedData.map(d => d.parameters?.tss || 0),
          borderColor: COLORS.gray.main,
          backgroundColor: COLORS.gray.main + '33',
          fill: false,
          tension: 0.3
        },
        {
          label: 'Standar BOD (30)',
          data: sortedData.map(() => 30),
          borderColor: COLORS.danger,
          borderDash: [5, 5],
          fill: false,
          pointRadius: 0
        },
        {
          label: 'Standar TSS (50)',
          data: sortedData.map(() => 50),
          borderColor: COLORS.warning,
          borderDash: [5, 5],
          fill: false,
          pointRadius: 0
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: 'white', font: { size: 11 } }
        }
      },
      scales: {
        x: {
          ticks: { color: 'rgba(255,255,255,0.7)', font: { size: 10 } },
          grid: { color: 'rgba(255,255,255,0.1)' }
        },
        y: {
          ticks: { color: 'rgba(255,255,255,0.7)', font: { size: 10 } },
          grid: { color: 'rgba(255,255,255,0.1)' },
          beginAtZero: true
        }
      }
    }
  });
}

/**
 * Create sludge level trend chart
 * @param {string} canvasId - Canvas element ID
 * @param {Array} data - Array of sludge records
 */
export function createSludgeLevelChart(canvasId, data = []) {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return null;
  
  const sortedData = [...data].sort((a, b) => new Date(a.recordDate) - new Date(b.recordDate));
  
  return new Chart(ctx, {
    type: 'line',
    data: {
      labels: sortedData.map(d => new Date(d.recordDate).toLocaleDateString('id-ID')),
      datasets: [
        {
          label: 'Tingkat Lumpur (%)',
          data: sortedData.map(d => d.level || 0),
          borderColor: COLORS.brown.main,
          backgroundColor: (ctx) => {
            const canvas = ctx.chart.ctx;
            const gradient = canvas.createLinearGradient(0, 0, 0, 200);
            gradient.addColorStop(0, COLORS.danger + '66');
            gradient.addColorStop(0.5, COLORS.warning + '66');
            gradient.addColorStop(1, COLORS.success + '66');
            return gradient;
          },
          fill: true,
          tension: 0.3
        },
        {
          label: 'Batas Kritis (70%)',
          data: sortedData.map(() => 70),
          borderColor: COLORS.danger,
          borderDash: [5, 5],
          fill: false,
          pointRadius: 0
        },
        {
          label: 'Batas Sedang (50%)',
          data: sortedData.map(() => 50),
          borderColor: COLORS.warning,
          borderDash: [5, 5],
          fill: false,
          pointRadius: 0
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: 'white', font: { size: 11 } }
        }
      },
      scales: {
        x: {
          ticks: { color: 'rgba(255,255,255,0.7)', font: { size: 10 } },
          grid: { color: 'rgba(255,255,255,0.1)' }
        },
        y: {
          ticks: { color: 'rgba(255,255,255,0.7)', font: { size: 10 } },
          grid: { color: 'rgba(255,255,255,0.1)' },
          min: 0,
          max: 100
        }
      }
    }
  });
}

/**
 * Create removal efficiency chart
 * @param {string} canvasId - Canvas element ID
 * @param {Object} efficiencyData - BOD and TSS removal data
 */
export function createRemovalEfficiencyChart(canvasId, efficiencyData = {}) {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return null;
  
  const { bodRemoval = 85, tssRemoval = 80, target = 80 } = efficiencyData;
  
  return new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['BOD Removal', 'TSS Removal', 'Target Minimum'],
      datasets: [{
        data: [bodRemoval, tssRemoval, target],
        backgroundColor: [
          bodRemoval >= target ? COLORS.success : COLORS.warning,
          tssRemoval >= target ? COLORS.success : COLORS.warning,
          COLORS.gray.main
        ],
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: {
          ticks: { color: 'rgba(255,255,255,0.7)', font: { size: 10 } },
          grid: { display: false }
        },
        y: {
          ticks: { color: 'rgba(255,255,255,0.7)', font: { size: 10 } },
          grid: { color: 'rgba(255,255,255,0.1)' },
          min: 0,
          max: 100,
          title: {
            display: true,
            text: 'Efisiensi (%)',
            color: 'rgba(255,255,255,0.7)'
          }
        }
      }
    }
  });
}

/**
 * Create compliance status pie/doughnut chart
 * @param {string} canvasId - Canvas element ID
 * @param {Object} complianceData - Compliance counts
 */
export function createComplianceChart(canvasId, complianceData = {}) {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return null;
  
  const { compliant = 0, nonCompliant = 0, pending = 0 } = complianceData;
  
  return new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Compliant', 'Non-Compliant', 'Pending'],
      datasets: [{
        data: [compliant, nonCompliant, pending],
        backgroundColor: [COLORS.success, COLORS.danger, COLORS.gray.main],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '60%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: 'white', font: { size: 10 }, boxWidth: 12 }
        }
      }
    }
  });
}

// ============================================================
// 5. SAFETY DISTANCE MAP (Simple SVG)
// ============================================================

/**
 * Generate safety distance visualization
 * @param {Object} distances - Distance measurements
 * @returns {string} SVG HTML
 */
export function generateSafetyDistanceMap(distances = {}) {
  const {
    toWell = 0,
    toBuilding = 0,
    toWaterSource = 0,
    standards = { toWell: 10, toBuilding: 2, toWaterSource: 10 }
  } = distances;
  
  const wellCompliant = toWell >= standards.toWell;
  const buildingCompliant = toBuilding >= standards.toBuilding;
  const waterSourceCompliant = toWaterSource === 0 || toWaterSource >= standards.toWaterSource;
  
  return `
    <svg viewBox="0 0 400 300" style="width: 100%; max-width: 400px; height: auto;">
      <!-- Background -->
      <rect x="0" y="0" width="400" height="300" fill="hsla(220, 20%, 5%, 0.5)" rx="10" />
      
      <!-- Septic Tank (center) -->
      <g transform="translate(200, 150)">
        <circle r="30" fill="${COLORS.brown.main}" opacity="0.8" stroke="white" stroke-width="2" />
        <text y="5" text-anchor="middle" fill="white" font-size="10" font-weight="bold">SEPTIC</text>
        
        <!-- Compliance zones -->
        <circle r="60" fill="none" stroke="${wellCompliant ? COLORS.success : COLORS.danger}" stroke-width="2" stroke-dasharray="5,3" opacity="0.5" />
        <circle r="20" fill="none" stroke="${buildingCompliant ? COLORS.success : COLORS.danger}" stroke-width="2" stroke-dasharray="3,3" opacity="0.5" />
      </g>
      
      <!-- Well -->
      <g transform="translate(320, 80)">
        <circle r="20" fill="${COLORS.blue.main}" opacity="0.8" stroke="white" stroke-width="2" />
        <text y="4" text-anchor="middle" fill="white" font-size="9">SUMUR</text>
        <text y="40" text-anchor="middle" fill="${wellCompliant ? COLORS.success : COLORS.danger}" font-size="10" font-weight="bold">${toWell}m</text>
        <text y="55" text-anchor="middle" fill="${COLORS.gray.light}" font-size="8">min: ${standards.toWell}m</text>
      </g>
      
      <!-- Building -->
      <g transform="translate(100, 100)">
        <rect x="-25" y="-20" width="50" height="40" rx="5" fill="${COLORS.gray.main}" opacity="0.8" stroke="white" stroke-width="2" />
        <text y="4" text-anchor="middle" fill="white" font-size="8">BANGUNAN</text>
        <text y="45" text-anchor="middle" fill="${buildingCompliant ? COLORS.success : COLORS.danger}" font-size="10" font-weight="bold">${toBuilding}m</text>
        <text y="60" text-anchor="middle" fill="${COLORS.gray.light}" font-size="8">min: ${standards.toBuilding}m</text>
      </g>
      
      <!-- Legend -->
      <g transform="translate(20, 250)">
        <circle r="6" fill="${COLORS.success}" />
        <text x="15" y="4" fill="white" font-size="9">Memenuhi</text>
        <circle cx="80" r="6" fill="${COLORS.danger}" />
        <text x="95" y="4" fill="white" font-size="9">Tidak Memenuhi</text>
      </g>
    </svg>
  `;
}

// ============================================================
// 6. DASHBOARD CARDS
// ============================================================

export function generateVolumeCard(title, volume, capacity, status) {
  const percentage = capacity > 0 ? Math.min(100, (volume / capacity) * 100) : 0;
  const color = percentage > 90 ? COLORS.danger : percentage > 70 ? COLORS.warning : COLORS.success;
  
  return `
    <div style="background: hsla(220, 20%, 100%, 0.02); border: 1px solid hsla(220, 20%, 100%, 0.05); border-radius: 12px; padding: 16px;">
      <div style="font-size: 10px; color: var(--text-tertiary); margin-bottom: 4px;">${title}</div>
      <div style="font-size: 24px; font-weight: 800; color: white; font-family: var(--font-mono);">${volume.toFixed(1)}</div>
      <div style="font-size: 10px; color: var(--text-tertiary); margin-bottom: 8px;">m³ / ${capacity.toFixed(1)} m³</div>
      <div style="height: 6px; background: hsla(220, 20%, 100%, 0.1); border-radius: 3px; overflow: hidden;">
        <div style="width: ${percentage}%; height: 100%; background: ${color}; transition: width 0.3s;"></div>
      </div>
      <div style="margin-top: 6px; font-size: 10px; color: ${color}; text-align: right;">${percentage.toFixed(0)}%</div>
    </div>
  `;
}

export function generateStatusCard(title, status, message = '') {
  const colors = {
    'C': { bg: 'hsla(158, 85%, 45%, 0.1)', border: 'hsla(158, 85%, 45%, 0.3)', text: 'var(--success-400)', icon: 'fa-check' },
    'NC': { bg: 'hsla(0, 85%, 60%, 0.1)', border: 'hsla(0, 85%, 60%, 0.3)', text: 'var(--danger-400)', icon: 'fa-xmark' },
    'PASS': { bg: 'hsla(158, 85%, 45%, 0.1)', border: 'hsla(158, 85%, 45%, 0.3)', text: 'var(--success-400)', icon: 'fa-check' },
    'FAIL': { bg: 'hsla(0, 85%, 60%, 0.1)', border: 'hsla(0, 85%, 60%, 0.3)', text: 'var(--danger-400)', icon: 'fa-xmark' },
    'WARNING': { bg: 'hsla(45, 90%, 60%, 0.1)', border: 'hsla(45, 90%, 60%, 0.3)', text: 'var(--warning-400)', icon: 'fa-exclamation' }
  };
  
  const style = colors[status] || colors['NC'];
  
  return `
    <div style="background: ${style.bg}; border: 1px solid ${style.border}; border-radius: 12px; padding: 16px;">
      <div style="display: flex; align-items: center; justify-content: space-between;">
        <div>
          <div style="font-size: 10px; color: var(--text-tertiary); margin-bottom: 4px;">${title}</div>
          <div style="font-size: 18px; font-weight: 800; color: ${style.text}; font-family: var(--font-mono);">
            <i class="fas ${style.icon}" style="margin-right: 8px;"></i>
            ${status === 'C' ? 'COMPLIANT' : status === 'NC' ? 'NON-COMPLIANT' : status}
          </div>
        </div>
      </div>
      ${message ? `<div style="margin-top: 8px; font-size: 10px; color: var(--text-secondary);">${message}</div>` : ''}
    </div>
  `;
}

export function generateMetricCard(label, value, unit, trend = null) {
  const trendIcon = trend > 0 ? 'fa-arrow-up' : trend < 0 ? 'fa-arrow-down' : 'fa-minus';
  const trendColor = trend > 0 ? COLORS.success : trend < 0 ? COLORS.danger : COLORS.gray.light;
  
  return `
    <div style="background: hsla(220, 20%, 100%, 0.02); border: 1px solid hsla(220, 20%, 100%, 0.05); border-radius: 12px; padding: 16px; text-align: center;">
      <div style="font-size: 10px; color: var(--text-tertiary); margin-bottom: 4px; text-transform: uppercase;">${label}</div>
      <div style="font-size: 28px; font-weight: 800; color: white; font-family: var(--font-mono);">
        ${value}
      </div>
      <div style="font-size: 10px; color: var(--text-tertiary);">${unit}</div>
      ${trend !== null ? `
        <div style="margin-top: 4px; font-size: 10px; color: ${trendColor};">
          <i class="fas ${trendIcon}" style="margin-right: 4px;"></i>
          ${Math.abs(trend).toFixed(1)}%
        </div>
      ` : ''}
    </div>
  `;
}

// ============================================================
// 7. UTILITY FUNCTIONS
// ============================================================

export function generateInspectionTable(inspections = []) {
  if (inspections.length === 0) {
    return '<div style="padding: 20px; text-align: center; color: var(--text-tertiary);">Belum ada data inspeksi</div>';
  }
  
  return `
    <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
      <thead>
        <tr style="background: hsla(220, 20%, 100%, 0.05);">
          <th style="padding: 12px; text-align: left; color: var(--text-tertiary); font-weight: 600;">No</th>
          <th style="padding: 12px; text-align: left; color: var(--text-tertiary); font-weight: 600;">Komponen</th>
          <th style="padding: 12px; text-align: left; color: var(--text-tertiary); font-weight: 600;">Lokasi</th>
          <th style="padding: 12px; text-align: left; color: var(--text-tertiary); font-weight: 600;">Parameter</th>
          <th style="padding: 12px; text-align: left; color: var(--text-tertiary); font-weight: 600;">Standar</th>
          <th style="padding: 12px; text-align: left; color: var(--text-tertiary); font-weight: 600;">Terukur</th>
          <th style="padding: 12px; text-align: center; color: var(--text-tertiary); font-weight: 600;">Status</th>
        </tr>
      </thead>
      <tbody>
        ${inspections.map((insp, i) => `
          <tr style="border-bottom: 1px solid hsla(220, 20%, 100%, 0.05);">
            <td style="padding: 12px; color: var(--text-secondary);">${i + 1}</td>
            <td style="padding: 12px; color: white; font-weight: 600;">${insp.component}</td>
            <td style="padding: 12px; color: var(--text-secondary);">${insp.location}</td>
            <td style="padding: 12px; color: var(--text-secondary);">${insp.parameter}</td>
            <td style="padding: 12px; color: var(--text-secondary);">${insp.standard}</td>
            <td style="padding: 12px; color: white; font-family: var(--font-mono);">${insp.measured}</td>
            <td style="padding: 12px; text-align: center;">
              <span style="display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 50%; background: ${insp.status === 'C' ? COLORS.success + '33' : COLORS.danger + '33'}; color: ${insp.status === 'C' ? COLORS.success : COLORS.danger}; font-weight: bold;">
                ${insp.status === 'C' ? '✓' : '✗'}
              </span>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

// Export all functions
export default {
  generateFlowDiagram,
  generateSepticTankCrossSection,
  generateIPALCrossSection,
  generatePipeProfile,
  generateSafetyDistanceMap,
  createEffluentQualityChart,
  createSludgeLevelChart,
  createRemovalEfficiencyChart,
  createComplianceChart,
  generateVolumeCard,
  generateStatusCard,
  generateMetricCard,
  generateInspectionTable,
  COLORS
};
