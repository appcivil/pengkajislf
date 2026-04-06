// ============================================================
// ELECTRICAL SYSTEM INSPECTION - VISUALIZATION COMPONENTS
// Charts, Single Line Diagrams, Heatmaps, Dashboard
// ============================================================

// ============================================================
// 1. CHART CONFIGURATION & UTILITIES
// ============================================================

export const CHART_COLORS = {
  safe: '#22c55e',
  warning: '#eab308',
  critical: '#f97316',
  emergency: '#ef4444',
  normal: '#3b82f6',
  neutral: '#6b7280',
  phaseR: '#ef4444',
  phaseS: '#eab308',
  phaseT: '#3b82f6',
  grid: 'rgba(255, 255, 255, 0.1)',
  text: 'rgba(255, 255, 255, 0.8)'
};

/**
 * Create chart configuration for load profile
 * @param {Array} data - Time series data
 * @param {string} label - Chart label
 * @returns {Object} Chart.js configuration
 */
export function createLoadProfileChartConfig(data, label = 'Load Profile') {
  return {
    type: 'line',
    data: {
      labels: data.map(d => d.time || d.timestamp),
      datasets: [{
        label: label,
        data: data.map(d => d.value || d.current || d.loading),
        borderColor: CHART_COLORS.normal,
        backgroundColor: CHART_COLORS.normal + '20',
        fill: true,
        tension: 0.4,
        pointRadius: 2,
        pointHoverRadius: 5
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          mode: 'index',
          intersect: false,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#fff',
          bodyColor: '#fff'
        }
      },
      scales: {
        x: {
          grid: { color: CHART_COLORS.grid },
          ticks: { color: CHART_COLORS.text }
        },
        y: {
          grid: { color: CHART_COLORS.grid },
          ticks: { color: CHART_COLORS.text },
          beginAtZero: true
        }
      }
    }
  };
}

/**
 * Create chart configuration for 3-phase imbalance
 * @param {Object} phases - Phase currents {R, S, T}
 * @returns {Object} Chart.js configuration
 */
export function createPhaseImbalanceChartConfig(phases) {
  return {
    type: 'bar',
    data: {
      labels: ['Phase R', 'Phase S', 'Phase T'],
      datasets: [{
        label: 'Current (A)',
        data: [phases.R, phases.S, phases.T],
        backgroundColor: [CHART_COLORS.phaseR, CHART_COLORS.phaseS, CHART_COLORS.phaseT],
        borderWidth: 0,
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
        y: {
          beginAtZero: true,
          grid: { color: CHART_COLORS.grid },
          ticks: { color: CHART_COLORS.text }
        },
        x: {
          grid: { display: false },
          ticks: { color: CHART_COLORS.text }
        }
      }
    }
  };
}

/**
 * Create chart configuration for thermal trending
 * @param {Array} history - Temperature history data
 * @returns {Object} Chart.js configuration
 */
export function createThermalTrendChartConfig(history) {
  return {
    type: 'line',
    data: {
      labels: history.map(h => {
        const d = new Date(h.date);
        return `${d.getDate()}/${d.getMonth() + 1}`;
      }),
      datasets: [{
        label: 'Temperature (°C)',
        data: history.map(h => h.temp),
        borderColor: CHART_COLORS.warning,
        backgroundColor: 'transparent',
        borderWidth: 2,
        pointRadius: 4,
        pointBackgroundColor: CHART_COLORS.warning,
        tension: 0.3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        annotation: {
          annotations: {
            line1: {
              type: 'line',
              yMin: 70,
              yMax: 70,
              borderColor: CHART_COLORS.critical,
              borderWidth: 2,
              borderDash: [6, 6],
              label: { content: 'Critical (70°C)', enabled: true }
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          grid: { color: CHART_COLORS.grid },
          ticks: { color: CHART_COLORS.text }
        },
        x: {
          grid: { color: CHART_COLORS.grid },
          ticks: { color: CHART_COLORS.text }
        }
      }
    }
  };
}

/**
 * Create chart configuration for load distribution pie
 * @param {Object} distribution - Load distribution by type
 * @returns {Object} Chart.js configuration
 */
export function createLoadDistributionChartConfig(distribution) {
  const labels = Object.keys(distribution);
  const values = Object.values(distribution);
  const colors = [CHART_COLORS.phaseR, CHART_COLORS.phaseS, CHART_COLORS.phaseT, CHART_COLORS.warning, CHART_COLORS.safe];
  
  return {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: values,
        backgroundColor: colors,
        borderWidth: 0,
        hoverOffset: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '60%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: CHART_COLORS.text, padding: 15 }
        }
      }
    }
  };
}

// ============================================================
// 2. SINGLE LINE DIAGRAM GENERATOR
// ============================================================

/**
 * Generate Single Line Diagram SVG
 * @param {Object} panel - Panel configuration
 * @param {Array} measurements - Current measurements
 * @returns {string} SVG markup
 */
export function generateSingleLineDiagram(panel, measurements = []) {
  const mainMeasurement = measurements[0] || { current: 0, voltage: 380 };
  const loading = calculatePanelLoading(mainMeasurement.current, panel.mcbRating);
  
  const width = 800;
  const height = 500;
  
  return `
    <svg viewBox="0 0 ${width} ${height}" class="single-line-diagram">
      <defs>
        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="#22c55e" />
        </marker>
        <linearGradient id="busbarGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#eab308;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#ca8a04;stop-opacity:1" />
        </linearGradient>
      </defs>
      
      <!-- Title -->
      <text x="400" y="30" text-anchor="middle" fill="#fff" font-size="16" font-weight="bold">
        Single Line Diagram - ${escapeHtml(panel.name || 'Panel')}
      </text>
      
      <!-- Incoming Supply -->
      <g transform="translate(50, 80)">
        <text x="0" y="-10" fill="#9ca3af" font-size="11">Incoming Supply</text>
        <rect x="0" y="0" width="80" height="60" rx="4" fill="#1e293b" stroke="#3b82f6" stroke-width="2"/>
        <text x="40" y="25" text-anchor="middle" fill="#fff" font-size="10">${panel.voltage || 380}V</text>
        <text x="40" y="45" text-anchor="middle" fill="#9ca3af" font-size="9">3-Phase</text>
      </g>
      
      <!-- Main MCB -->
      <g transform="translate(180, 80)">
        <text x="30" y="-10" fill="#9ca3af" font-size="11">Main MCB</text>
        <rect x="0" y="0" width="60" height="60" rx="4" fill="#1e293b" stroke="${loading > 100 ? '#ef4444' : loading > 80 ? '#eab308' : '#22c55e'}" stroke-width="2"/>
        <text x="30" y="25" text-anchor="middle" fill="#fff" font-size="10">${panel.mcbRating || 100}A</text>
        <text x="30" y="45" text-anchor="middle" fill="#9ca3af" font-size="9">${panel.mcbType || 'MCCB'}</text>
        <text x="30" y="85" text-anchor="middle" fill="${loading > 100 ? '#ef4444' : '#22c55e'}" font-size="10">${loading}%</text>
      </g>
      
      <!-- Busbar -->
      <g transform="translate(280, 100)">
        <rect x="0" y="0" width="400" height="20" rx="2" fill="url(#busbarGradient)"/>
        <text x="200" y="-8" text-anchor="middle" fill="#9ca3af" font-size="10">Busbar ${panel.busbarRating || 200}A</text>
      </g>
      
      <!-- Phase R -->
      <g transform="translate(300, 140)">
        <line x1="0" y1="0" x2="0" y2="40" stroke="#ef4444" stroke-width="2"/>
        <circle cx="0" cy="60" r="25" fill="#1e293b" stroke="#ef4444" stroke-width="2"/>
        <text x="0" y="65" text-anchor="middle" fill="#ef4444" font-size="12" font-weight="bold">R</text>
        ${generateBranchMCBs(panel.branches?.R || [], 0, 'R')}
      </g>
      
      <!-- Phase S -->
      <g transform="translate(450, 140)">
        <line x1="0" y1="0" x2="0" y2="40" stroke="#eab308" stroke-width="2"/>
        <circle cx="0" cy="60" r="25" fill="#1e293b" stroke="#eab308" stroke-width="2"/>
        <text x="0" y="65" text-anchor="middle" fill="#eab308" font-size="12" font-weight="bold">S</text>
        ${generateBranchMCBs(panel.branches?.S || [], 150, 'S')}
      </g>
      
      <!-- Phase T -->
      <g transform="translate(600, 140)">
        <line x1="0" y1="0" x2="0" y2="40" stroke="#3b82f6" stroke-width="2"/>
        <circle cx="0" cy="60" r="25" fill="#1e293b" stroke="#3b82f6" stroke-width="2"/>
        <text x="0" y="65" text-anchor="middle" fill="#3b82f6" font-size="12" font-weight="bold">T</text>
        ${generateBranchMCBs(panel.branches?.T || [], 300, 'T')}
      </g>
      
      <!-- Connection Lines -->
      <line x1="130" y1="110" x2="180" y2="110" stroke="#6b7280" stroke-width="2" marker-end="url(#arrowhead)"/>
      <line x1="240" y1="110" x2="280" y2="110" stroke="#6b7280" stroke-width="2"/>
      
      <!-- Legend -->
      <g transform="translate(50, 420)">
        <rect x="0" y="0" width="12" height="12" fill="#22c55e" rx="2"/> <text x="18" y="10" fill="#9ca3af" font-size="10">Normal (<80%)</text>
        <rect x="100" y="0" width="12" height="12" fill="#eab308" rx="2"/> <text x="118" y="10" fill="#9ca3af" font-size="10">Warning (80-100%)</text>
        <rect x="230" y="0" width="12" height="12" fill="#ef4444" rx="2"/> <text x="248" y="10" fill="#9ca3af" font-size="10">Overload (>100%)</text>
      </g>
    </svg>
  `;
}

function generateBranchMCBs(branches, offsetX, phase) {
  if (!branches || branches.length === 0) return '';
  
  const colors = { R: '#ef4444', S: '#eab308', T: '#3b82f6' };
  const color = colors[phase] || '#6b7280';
  
  return branches.map((branch, idx) => {
    const y = 120 + (idx * 70);
    const loading = calculatePanelLoading(branch.current || 0, branch.rating || 16);
    const statusColor = loading > 100 ? '#ef4444' : loading > 80 ? '#eab308' : '#22c55e';
    
    return `
      <g transform="translate(-30, ${y})">
        <line x1="30" y1="0" x2="30" y2="20" stroke="${color}" stroke-width="1"/>
        <rect x="0" y="20" width="60" height="40" rx="2" fill="#1e293b" stroke="${statusColor}" stroke-width="1"/>
        <text x="30" y="35" text-anchor="middle" fill="#fff" font-size="8">${branch.rating || 16}A</text>
        <text x="30" y="52" text-anchor="middle" fill="${statusColor}" font-size="8">${loading}%</text>
        <text x="30" y="75" text-anchor="middle" fill="#9ca3af" font-size="7">${escapeHtml(branch.name || `MCB ${idx + 1}`)}</text>
      </g>
    `;
  }).join('');
}

function calculatePanelLoading(current, rating) {
  if (!rating || rating === 0) return 0;
  return Math.round((current / rating) * 100);
}

function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ============================================================
// 3. THERMAL HEATMAP GENERATOR
// ============================================================

/**
 * Generate thermal heatmap HTML
 * @param {Array} hotspots - Array of hotspot data
 * @returns {string} HTML markup for heatmap
 */
export function generateThermalHeatmap(hotspots) {
  const maxTemp = Math.max(...hotspots.map(h => h.temp), 100);
  
  return `
    <div class="thermal-heatmap">
      <div class="heatmap-grid">
        ${hotspots.map(spot => {
          const grade = getTemperatureGrade(spot.temp);
          const intensity = spot.temp / maxTemp;
          
          return `
            <div class="heatmap-cell" 
                 style="--heat-color: ${grade.color}; --intensity: ${intensity}"
                 data-temp="${spot.temp.toFixed(1)}°C"
                 data-component="${spot.component}">
              <div class="cell-content">
                <span class="temp-value">${spot.temp.toFixed(0)}°C</span>
                <span class="component">${spot.component}</span>
              </div>
              <div class="cell-status ${grade.class}">${grade.grade}</div>
            </div>
          `;
        }).join('')}
      </div>
      <div class="heatmap-legend">
        <div class="legend-item"><span class="legend-color" style="background:#22c55e"></span> Normal (&lt;45°C)</div>
        <div class="legend-item"><span class="legend-color" style="background:#eab308"></span> Waspada (45-70°C)</div>
        <div class="legend-item"><span class="legend-color" style="background:#f97316"></span> Kritis (70-90°C)</div>
        <div class="legend-item"><span class="legend-color" style="background:#ef4444"></span> Darurat (&gt;90°C)</div>
      </div>
    </div>
  `;
}

function getTemperatureGrade(temp) {
  if (temp < 45) return { grade: 'Normal', color: '#22c55e', class: 'status-safe' };
  if (temp < 70) return { grade: 'Waspada', color: '#eab308', class: 'status-warning' };
  if (temp < 90) return { grade: 'Kritis', color: '#f97316', class: 'status-critical' };
  return { grade: 'Darurat', color: '#ef4444', class: 'status-emergency' };
}

// ============================================================
// 4. DASHBOARD COMPONENTS
// ============================================================

/**
 * Generate loading indicator
 * @param {number} percentage - Loading percentage
 * @returns {string} HTML markup
 */
export function generateLoadingIndicator(percentage) {
  const status = percentage > 100 ? 'overload' : percentage > 80 ? 'warning' : 'safe';
  const colors = { safe: '#22c55e', warning: '#eab308', overload: '#ef4444' };
  const color = colors[status];
  
  return `
    <div class="loading-indicator ${status}">
      <div class="loading-ring" style="--progress: ${Math.min(percentage, 100)}; --color: ${color}">
        <svg viewBox="0 0 100 100">
          <circle class="bg" cx="50" cy="50" r="45"/>
          <circle class="progress" cx="50" cy="50" r="45" 
                  stroke-dasharray="${Math.min(percentage, 100) * 2.83} 283"/>
        </svg>
        <div class="loading-value">
          <span class="percentage">${percentage.toFixed(1)}</span>
          <span class="unit">%</span>
        </div>
      </div>
      <div class="loading-label">${status.toUpperCase()}</div>
    </div>
  `;
}

/**
 * Generate dashboard card for panel status
 * @param {Object} panel - Panel data
 * @returns {string} HTML markup
 */
export function generatePanelStatusCard(panel) {
  const latestMeasurement = panel.measurements?.[panel.measurements.length - 1];
  const loading = latestMeasurement ? (latestMeasurement.current / panel.mcbRating * 100) : 0;
  const status = loading > 100 ? 'critical' : loading > 80 ? 'warning' : 'normal';
  const statusColors = { normal: '#22c55e', warning: '#eab308', critical: '#ef4444' };
  
  const lastUpdated = panel.updatedAt 
    ? new Date(panel.updatedAt).toLocaleDateString('id-ID')
    : 'Belum diukur';
  
  return `
    <div class="panel-card ${status}" onclick="viewPanel('${panel.id}')">
      <div class="panel-header">
        <div class="panel-icon" style="background:${statusColors[status]}20; color:${statusColors[status]}">
          <i class="fas fa-bolt"></i>
        </div>
        <div class="panel-status-badge" style="background:${statusColors[status]}20; color:${statusColors[status]}">
          ${status.toUpperCase()}
        </div>
      </div>
      <h4 class="panel-name">${escapeHtml(panel.name || 'Unnamed Panel')}</h4>
      <p class="panel-location">${escapeHtml(panel.location || 'Unknown Location')}</p>
      <div class="panel-metrics">
        <div class="metric">
          <span class="metric-value">${loading.toFixed(1)}%</span>
          <span class="metric-label">Loading</span>
        </div>
        <div class="metric">
          <span class="metric-value">${latestMeasurement?.current?.toFixed(1) || '-'}</span>
          <span class="metric-label">Ampere</span>
        </div>
        <div class="metric">
          <span class="metric-value">${panel.mcbRating || '-'}</span>
          <span class="metric-label">MCB (A)</span>
        </div>
      </div>
      <div class="panel-footer">
        <span class="last-updated">${lastUpdated}</span>
        <span class="measurement-count">${panel.measurements?.length || 0} pengukuran</span>
      </div>
    </div>
  `;
}

/**
 * Generate compliance status summary
 * @param {Object} compliance - Compliance check results
 * @returns {string} HTML markup
 */
export function generateComplianceSummary(compliance) {
  const score = parseFloat(compliance.complianceScore) || 0;
  const statusColor = score >= 90 ? '#22c55e' : score >= 70 ? '#eab308' : '#ef4444';
  
  return `
    <div class="compliance-summary">
      <div class="compliance-score" style="--score-color: ${statusColor}">
        <div class="score-ring">
          <svg viewBox="0 0 100 100">
            <circle class="bg" cx="50" cy="50" r="45"/>
            <circle class="progress" cx="50" cy="50" r="45" 
                    stroke-dasharray="${score * 2.83} 283"/>
          </svg>
          <div class="score-value">${score.toFixed(0)}%</div>
        </div>
        <div class="score-label">Compliance Score</div>
      </div>
      <div class="compliance-details">
        <div class="detail-item">
          <span class="detail-value" style="color:#22c55e">${compliance.passedCount || 0}</span>
          <span class="detail-label">Pass</span>
        </div>
        <div class="detail-item">
          <span class="detail-value" style="color:#ef4444">${(compliance.totalCount || 0) - (compliance.passedCount || 0)}</span>
          <span class="detail-label">Fail</span>
        </div>
        <div class="detail-item">
          <span class="detail-value">${compliance.totalCount || 0}</span>
          <span class="detail-label">Total Checks</span>
        </div>
      </div>
    </div>
  `;
}

// ============================================================
// 5. MEASUREMENT TABLE GENERATOR
// ============================================================

/**
 * Generate measurement results table
 * @param {Array} measurements - Measurement records
 * @returns {string} HTML table markup
 */
export function generateMeasurementTable(measurements) {
  if (!measurements || measurements.length === 0) {
    return '<p class="no-data">Belum ada data pengukuran</p>';
  }
  
  return `
    <table class="data-table measurement-table">
      <thead>
        <tr>
          <th>No</th>
          <th>Waktu</th>
          <th>Lokasi</th>
          <th>Fasa</th>
          <th>V (V)</th>
          <th>I (A)</th>
          <th>kW</th>
          <th>cos φ</th>
          <th>Loading %</th>
          <th>Suhu (°C)</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${measurements.map((m, idx) => {
          const loading = m.mcbRating ? ((m.current / m.mcbRating) * 100).toFixed(1) : '-';
          const status = m.loadingStatus || 'Unknown';
          const statusClass = status.toLowerCase().replace(' ', '-');
          
          return `
            <tr>
              <td>${idx + 1}</td>
              <td>${new Date(m.timestamp).toLocaleString('id-ID')}</td>
              <td>${escapeHtml(m.location || '-')}</td>
              <td>${m.phase || '3P'}</td>
              <td>${m.voltage?.toFixed(1) || '-'}</td>
              <td>${m.current?.toFixed(2) || '-'}</td>
              <td>${m.power ? (m.power / 1000).toFixed(2) : '-'}</td>
              <td>${m.powerFactor?.toFixed(2) || '-'}</td>
              <td>${loading}</td>
              <td>${m.temperature?.toFixed(1) || '-'}</td>
              <td><span class="status-badge ${statusClass}">${status}</span></td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;
}

// Export all functions
export default {
  createLoadProfileChartConfig,
  createPhaseImbalanceChartConfig,
  createThermalTrendChartConfig,
  createLoadDistributionChartConfig,
  generateSingleLineDiagram,
  generateThermalHeatmap,
  generateLoadingIndicator,
  generatePanelStatusCard,
  generateComplianceSummary,
  generateMeasurementTable,
  CHART_COLORS
};
