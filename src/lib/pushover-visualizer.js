/**
 * PUSHOVER ANALYSIS VISUALIZER
 * Plot kurva kapasitas dan status sendi plastis
 * Berbasis ASCE 41-17 Chapter 17.5
 */

import { PLASTIC_HINGE_STATUS } from '../lib/asce41-tier-data.js';

/**
 * Parse CSV data dari ETABS
 * Expected format: Step, BaseShear(kN), RoofDisplacement(mm)
 */
export function parsePushoverCSV(csvText) {
  const lines = csvText.trim().split('\n');
  const data = [];
  
  // Skip header
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.trim());
    if (cols.length >= 3) {
      data.push({
        step: parseInt(cols[0]) || i,
        baseShear: parseFloat(cols[1]) || 0,
        displacement: parseFloat(cols[2]) || 0
      });
    }
  }
  
  return data;
}

/**
 * Calculate Performance Point menggunakan metode Capacity Spectrum
 * Simplified approach based on ASCE 41-17
 */
export function calculatePerformancePoint(capacityCurve, demandSpectrum, damping = 5) {
  if (!capacityCurve || capacityCurve.length < 2) return null;
  
  // Find intersection point
  let performancePoint = null;
  let minDiff = Infinity;
  
  for (const point of capacityCurve) {
    // Convert displacement to spectral displacement
    const Sd = point.displacement / 1000; // mm to m
    const Sa_point = point.baseShear / 1000; // kN to approximate g (assuming mass)
    
    // Calculate demand at this period
    const demandSa = interpolateDemand(demandSpectrum, Sd);
    const diff = Math.abs(Sa_point - demandSa);
    
    if (diff < minDiff) {
      minDiff = diff;
      performancePoint = {
        displacement: point.displacement,
        baseShear: point.baseShear,
        step: point.step
      };
    }
  }
  
  return performancePoint;
}

function interpolateDemand(demandSpectrum, Sd) {
  // Simplified - return demand spectral acceleration
  // In real implementation, this would use actual response spectrum
  return demandSpectrum.find(d => d.T >= Sd)?.Sa || demandSpectrum[demandSpectrum.length - 1]?.Sa || 0;
}

/**
 * Generate SVG untuk kurva pushover
 */
export function generatePushoverSVG(data, options = {}) {
  const { 
    width = 800, 
    height = 400, 
    margin = { top: 40, right: 40, bottom: 60, left: 80 },
    performancePoint = null,
    demandCurve = null
  } = options;
  
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;
  
  // Find data ranges
  const maxDisp = Math.max(...data.map(d => d.displacement)) * 1.1;
  const maxShear = Math.max(...data.map(d => d.baseShear)) * 1.1;
  
  // Scale functions
  const xScale = (val) => (val / maxDisp) * innerWidth;
  const yScale = (val) => innerHeight - (val / maxShear) * innerHeight;
  
  // Generate path data
  const pathData = data.map((d, i) => 
    `${i === 0 ? 'M' : 'L'} ${xScale(d.displacement)} ${yScale(d.baseShear)}`
  ).join(' ');
  
  // Generate grid lines
  const xGrid = Array.from({ length: 6 }, (_, i) => (maxDisp / 5) * i);
  const yGrid = Array.from({ length: 6 }, (_, i) => (maxShear / 5) * i);
  
  return `
    <svg viewBox="0 0 ${width} ${height}" style="width: 100%; height: 100%;">
      <defs>
        <linearGradient id="capacityGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:hsla(220, 95%, 52%, 0.3)"/>
          <stop offset="100%" style="stop-color:hsla(220, 95%, 52%, 0.05)"/>
        </linearGradient>
      </defs>
      
      <!-- Background -->
      <rect width="${width}" height="${height}" fill="#0a0f1a"/>
      
      <!-- Grid -->
      <g transform="translate(${margin.left}, ${margin.top})">
        ${xGrid.map(x => `
          <line x1="${xScale(x)}" y1="0" x2="${xScale(x)}" y2="${innerHeight}" 
                stroke="hsla(220, 20%, 100%, 0.1)" stroke-dasharray="2,2"/>
          <text x="${xScale(x)}" y="${innerHeight + 20}" 
                fill="hsla(220, 20%, 100%, 0.5)" font-size="11" text-anchor="middle">
            ${x.toFixed(0)}
          </text>
        `).join('')}
        
        ${yGrid.map(y => `
          <line x1="0" y1="${yScale(y)}" x2="${innerWidth}" y2="${yScale(y)}" 
                stroke="hsla(220, 20%, 100%, 0.1)" stroke-dasharray="2,2"/>
          <text x="-10" y="${yScale(y) + 4}" 
                fill="hsla(220, 20%, 100%, 0.5)" font-size="11" text-anchor="end">
            ${y.toFixed(0)}
          </text>
        `).join('')}
        
        <!-- Axes -->
        <line x1="0" y1="${innerHeight}" x2="${innerWidth}" y2="${innerHeight}" 
              stroke="hsla(220, 20%, 100%, 0.3)" stroke-width="2"/>
        <line x1="0" y1="0" x2="0" y2="${innerHeight}" 
              stroke="hsla(220, 20%, 100%, 0.3)" stroke-width="2"/>
        
        <!-- Capacity Curve Area -->
        <path d="${pathData} L ${xScale(maxDisp)} ${innerHeight} L 0 ${innerHeight} Z" 
              fill="url(#capacityGradient)"/>
        
        <!-- Capacity Curve Line -->
        <path d="${pathData}" fill="none" stroke="#3b82f6" stroke-width="3"/>
        
        <!-- Demand Curve (if provided) -->
        ${demandCurve ? `
          <path d="${demandCurve.map((d, i) => 
            `${i === 0 ? 'M' : 'L'} ${xScale(d.displacement)} ${yScale(d.baseShear)}`
          ).join(' ')}" 
                fill="none" stroke="#ef4444" stroke-width="2" stroke-dasharray="5,5"/>
        ` : ''}
        
        <!-- Performance Point -->
        ${performancePoint ? `
          <circle cx="${xScale(performancePoint.displacement)}" 
                  cy="${yScale(performancePoint.baseShear)}" r="8" 
                  fill="#eab308" stroke="#fff" stroke-width="2"/>
          <text x="${xScale(performancePoint.displacement) + 12}" 
                y="${yScale(performancePoint.baseShear)}"
                fill="#eab308" font-size="11" font-weight="bold">
            Performance Point
          </text>
        ` : ''}
      </g>
      
      <!-- Labels -->
      <text x="${width / 2}" y="${height - 10}" 
            fill="hsla(220, 20%, 100%, 0.7)" font-size="13" text-anchor="middle" font-weight="600">
        Roof Displacement (mm)
      </text>
      <text x="20" y="${height / 2}" 
            fill="hsla(220, 20%, 100%, 0.7)" font-size="13" text-anchor="middle" 
            transform="rotate(-90, 20, ${height / 2})" font-weight="600">
        Base Shear (kN)
      </text>
      
      <!-- Legend -->
      <g transform="translate(${width - 180}, 20)">
        <rect width="160" height="80" rx="8" fill="hsla(220, 20%, 100%, 0.05)" stroke="hsla(220, 20%, 100%, 0.1)"/>
        <line x1="10" y1="20" x2="40" y2="20" stroke="#3b82f6" stroke-width="3"/>
        <text x="50" y="24" fill="hsla(220, 20%, 100%, 0.7)" font-size="11">Capacity Curve</text>
        ${demandCurve ? `
          <line x1="10" y1="45" x2="40" y2="45" stroke="#ef4444" stroke-width="2" stroke-dasharray="5,5"/>
          <text x="50" y="49" fill="hsla(220, 20%, 100%, 0.7)" font-size="11">Demand</text>
        ` : ''}
      </g>
    </svg>
  `;
}

/**
 * Generate Plastic Hinge Status Grid
 */
export function generateHingeStatusGrid(hinges = [], options = {}) {
  const { cols = 10, elementType = 'beam' } = options;
  
  // Default empty grid
  const defaultHinges = Array.from({ length: 40 }, (_, i) => ({
    id: `${elementType}${i + 1}`,
    location: i % 2 === 0 ? 'Start' : 'End',
    status: 'B-IO',
    element: `${elementType}${Math.floor(i / 2) + 1}`
  }));
  
  const data = hinges.length > 0 ? hinges : defaultHinges;
  
  return `
    <div class="hinge-grid" style="display: grid; grid-template-columns: repeat(${cols}, 1fr); gap: 4px;">
      ${data.map(hinge => {
        const status = PLASTIC_HINGE_STATUS[hinge.status] || PLASTIC_HINGE_STATUS['B-IO'];
        return `
          <div class="hinge-cell" 
               style="aspect-ratio: 1; background: ${status.color}; border-radius: 4px; cursor: pointer; position: relative;"
               title="${hinge.element} - ${hinge.location}: ${status.label}"
               onclick="window._showHingeDetail('${hinge.id}')">
            <span style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 9px; color: white; font-weight: bold; text-shadow: 0 1px 2px rgba(0,0,0,0.5);">
              ${hinge.id}
            </span>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

/**
 * Calculate key pushover parameters
 */
export function calculatePushoverMetrics(data) {
  if (!data || data.length < 2) return null;
  
  // Find yield point (first significant stiffness change)
  let yieldPoint = data[1];
  for (let i = 2; i < data.length - 1; i++) {
    const stiffness = (data[i].baseShear - data[i-1].baseShear) / (data[i].displacement - data[i-1].displacement);
    const prevStiffness = (data[i-1].baseShear - data[i-2].baseShear) / (data[i-1].displacement - data[i-2].displacement);
    
    if (stiffness < prevStiffness * 0.5) {
      yieldPoint = data[i];
      break;
    }
  }
  
  // Maximum capacity
  const maxPoint = data.reduce((max, p) => p.baseShear > max.baseShear ? p : max, data[0]);
  
  // Ultimate point (last point or 80% of max)
  const ultimatePoint = data[data.length - 1];
  
  // Ductility
  const ductility = ultimatePoint.displacement / yieldPoint.displacement;
  
  // Overstrength factor
  const overstrength = maxPoint.baseShear / yieldPoint.baseShear;
  
  return {
    yield: yieldPoint,
    maximum: maxPoint,
    ultimate: ultimatePoint,
    ductility: Math.round(ductility * 100) / 100,
    overstrength: Math.round(overstrength * 100) / 100,
    initialStiffness: Math.round((yieldPoint.baseShear / yieldPoint.displacement) * 100) / 100
  };
}

/**
 * Export pushover data to CSV
 */
export function exportPushoverToCSV(metrics, filename = 'pushover_analysis.csv') {
  const csv = [
    ['Parameter', 'Value', 'Unit'],
    ['Yield Displacement', metrics.yield.displacement, 'mm'],
    ['Yield Base Shear', metrics.yield.baseShear, 'kN'],
    ['Maximum Displacement', metrics.maximum.displacement, 'mm'],
    ['Maximum Base Shear', metrics.maximum.baseShear, 'kN'],
    ['Ultimate Displacement', metrics.ultimate.displacement, 'mm'],
    ['Ultimate Base Shear', metrics.ultimate.baseShear, 'kN'],
    ['Ductility Ratio', metrics.ductility, '-'],
    ['Overstrength Factor', metrics.overstrength, '-'],
    ['Initial Stiffness', metrics.initialStiffness, 'kN/mm']
  ].map(row => row.join(',')).join('\n');
  
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
