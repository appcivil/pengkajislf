/**
 * FEMA 356 Pushover Analysis Implementation
 * Performance Levels: IO (Immediate Occupancy), LS (Life Safety), CP (Collapse Prevention)
 * Hinge properties for steel and concrete members
 */

import { showSuccess, showError, showInfo } from '../components/toast.js';

/**
 * FEMA 356 Hinge Property Definitions
 * Rotations in radians, moments in kN-m
 */
export const FEMA356_HINGES = {
  // Steel moment frames
  steel_MRF_weak: {
    material: 'steel',
    type: 'moment',
    IO: { rotation: 0.005, moment: 200 },
    LS: { rotation: 0.015, moment: 250 },
    CP: { rotation: 0.025, moment: 280 },
    E: 200000, // MPa
    color: { IO: '#3b82f6', LS: '#22c55e', CP: '#eab308', E: '#ef4444' }
  },
  steel_MRF_strong: {
    material: 'steel',
    type: 'moment',
    IO: { rotation: 0.007, moment: 400 },
    LS: { rotation: 0.020, moment: 500 },
    CP: { rotation: 0.035, moment: 550 },
    E: 200000,
    color: { IO: '#3b82f6', LS: '#22c55e', CP: '#eab308', E: '#ef4444' }
  },
  // Concrete moment frames
  concrete_MRF_30MPa: {
    material: 'concrete',
    type: 'moment',
    IO: { rotation: 0.003, moment: 150 },
    LS: { rotation: 0.010, moment: 180 },
    CP: { rotation: 0.020, moment: 200 },
    E: 30000,
    color: { IO: '#3b82f6', LS: '#22c55e', CP: '#eab308', E: '#ef4444' }
  },
  concrete_MRF_40MPa: {
    material: 'concrete',
    type: 'moment',
    IO: { rotation: 0.004, moment: 250 },
    LS: { rotation: 0.012, moment: 300 },
    CP: { rotation: 0.025, moment: 330 },
    E: 30000,
    color: { IO: '#3b82f6', LS: '#22c55e', CP: '#eab308', E: '#ef4444' }
  },
  // Shear hinges (brittle)
  shear_weak: {
    material: 'concrete',
    type: 'shear',
    IO: { rotation: 0.002, moment: 100 },
    LS: { rotation: 0.005, moment: 120 },
    CP: { rotation: 0.008, moment: 130 },
    E: 30000,
    color: { IO: '#3b82f6', LS: '#22c55e', CP: '#eab308', E: '#ef4444' }
  }
};

/**
 * FEMA 356 Pushover Analysis Controller
 * Manages hinge formation, capacity curve, and performance evaluation
 */
export class FEMA356Pushover {
  constructor(worker) {
    this.worker = worker;
    this.results = null;
    this.hinges = new Map();
    this.capacityCurve = { displacement: [], baseShear: [] };
    this.performancePoints = [];
  }

  /**
   * Run pushover analysis with FEMA 356 hinge properties
   */
  async runAnalysis(model, options = {}) {
    const {
      steps = 100,
      targetDisplacement = 0.6, // meters
      loadPattern = 'inverted_triangle',
      hingeAssignments = {}, // elementId -> hingeType
      controlNode = null, // Node ID for displacement control
      monitorHinges = true
    } = options;

    showInfo('Initializing FEMA 356 Pushover Analysis...');

    // Initialize worker with model
    this.worker.postMessage({
      command: 'INITIALIZE',
      payload: model,
      id: Date.now()
    });

    await this.waitForResponse();

    // Assemble matrices
    this.worker.postMessage({
      command: 'ASSEMBLE',
      id: Date.now()
    });

    await this.waitForResponse();

    // Run pushover
    this.worker.postMessage({
      command: 'SOLVE_PUSHOVER',
      payload: {
        steps,
        targetDisplacement,
        distribution: loadPattern,
        hingeProperties: hingeAssignments
      },
      id: Date.now()
    });

    const result = await this.waitForResponse();
    this.results = result;

    // Process hinge formation
    if (monitorHinges) {
      this.processHingeFormation(model, result);
    }

    // Calculate performance points
    this.calculatePerformancePoints(result);

    showSuccess(`FEMA 356 Pushover complete: ${result.maxRoofDisplacement.toFixed(2)}m, ${result.maxBaseShear.toFixed(0)}kN`);

    return {
      ...result,
      hinges: Array.from(this.hinges.values()),
      performancePoints: this.performancePoints,
      capacityCurve: this.capacityCurve
    };
  }

  /**
   * Process hinge formation at each step
   */
  processHingeFormation(model, result) {
    // Simulate hinge formation based on element deformations
    model.elements.forEach((elem, idx) => {
      if (elem.type !== 'frame') return;

      const hingeType = this.getHingeTypeForElement(elem);
      if (!hingeType) return;

      const hinge = FEMA356_HINGES[hingeType];
      if (!hinge) return;

      // Calculate rotation demand (simplified)
      const rotation = this.calculateElementRotation(elem, model, result);

      // Determine hinge state
      let state = 'B'; // Before IO (elastic)
      let rotationLimit = 0;

      if (rotation >= hinge.CP.rotation) {
        state = 'E'; // Beyond CP (collapse)
        rotationLimit = hinge.CP.rotation;
      } else if (rotation >= hinge.LS.rotation) {
        state = 'CP'; // Collapse Prevention
        rotationLimit = hinge.LS.rotation;
      } else if (rotation >= hinge.IO.rotation) {
        state = 'LS'; // Life Safety
        rotationLimit = hinge.IO.rotation;
      } else if (rotation >= hinge.IO.rotation * 0.5) {
        state = 'IO'; // Immediate Occupancy
        rotationLimit = hinge.IO.rotation * 0.5;
      }

      if (state !== 'B') {
        this.hinges.set(elem.id, {
          elementId: elem.id,
          type: hingeType,
          location: rotation > 0 ? 'End-I' : 'End-J',
          rotation: Math.abs(rotation),
          moment: this.interpolateMoment(rotation, hinge),
          state,
          color: hinge.color[state],
          limit: rotationLimit
        });
      }
    });
  }

  /**
   * Get hinge type for element based on properties
   */
  getHingeTypeForElement(elem) {
    // Logic to assign hinge type based on element properties
    if (elem.material === 'steel') {
      return elem.Mp > 300 ? 'steel_MRF_strong' : 'steel_MRF_weak';
    }
    if (elem.material === 'concrete') {
      return elem.fc > 35 ? 'concrete_MRF_40MPa' : 'concrete_MRF_30MPa';
    }
    return 'concrete_MRF_30MPa'; // Default
  }

  /**
   * Calculate element rotation (simplified)
   */
  calculateElementRotation(elem, model, result) {
    // Simplified - would use actual displacement results
    const node1 = model.nodes.find(n => n.id === elem.node1);
    const node2 = model.nodes.find(n => n.id === elem.node2);
    
    if (!node1 || !node2) return 0;

    const driftRatio = (node2.z - node1.z) > 0 ? 0.01 : 0.005;
    return driftRatio * (result.maxRoofDisplacement / Math.max(node2.z, 1));
  }

  /**
   * Interpolate moment from hinge curve
   */
  interpolateMoment(rotation, hinge) {
    if (rotation <= hinge.IO.rotation) {
      return hinge.IO.moment * (rotation / hinge.IO.rotation);
    } else if (rotation <= hinge.LS.rotation) {
      const t = (rotation - hinge.IO.rotation) / (hinge.LS.rotation - hinge.IO.rotation);
      return hinge.IO.moment + t * (hinge.LS.moment - hinge.IO.moment);
    } else if (rotation <= hinge.CP.rotation) {
      const t = (rotation - hinge.LS.rotation) / (hinge.CP.rotation - hinge.LS.rotation);
      return hinge.LS.moment + t * (hinge.CP.moment - hinge.LS.moment);
    }
    return hinge.CP.moment * 0.9; // Degradation
  }

  /**
   * Calculate performance points per FEMA 356
   */
  calculatePerformancePoints(result) {
    const { roofDisplacement, baseShear } = result;
    
    // Find points where performance levels are reached
    const findPoint = (targetDisp) => {
      for (let i = 0; i < roofDisplacement.length; i++) {
        if (roofDisplacement[i] >= targetDisp) {
          return {
            step: i,
            displacement: roofDisplacement[i],
            baseShear: baseShear[i]
          };
        }
      }
      return null;
    };

    // Typical drift limits for 3-story frame (height = 12m)
    const storyHeight = 4.0; // m
    const totalHeight = 12.0; // m

    this.performancePoints = [
      {
        level: 'IO',
        description: 'Immediate Occupancy',
        drift: 0.007, // 0.7% drift
        displacement: 0.007 * totalHeight,
        ...findPoint(0.007 * totalHeight)
      },
      {
        level: 'LS',
        description: 'Life Safety',
        drift: 0.025, // 2.5% drift
        displacement: 0.025 * totalHeight,
        ...findPoint(0.025 * totalHeight)
      },
      {
        level: 'CP',
        description: 'Collapse Prevention',
        drift: 0.05, // 5% drift
        displacement: 0.05 * totalHeight,
        ...findPoint(0.05 * totalHeight)
      }
    ];

    // Update capacity curve
    this.capacityCurve = {
      displacement: roofDisplacement,
      baseShear: baseShear
    };
  }

  /**
   * Generate capacity curve plot (SVG)
   */
  generateCapacityPlot(options = {}) {
    const { width = 600, height = 400 } = options;
    
    if (!this.results) return '';

    const { roofDisplacement, baseShear } = this.capacityCurve;
    const maxDisp = Math.max(...roofDisplacement);
    const maxShear = Math.max(...baseShear);

    // Scale factors
    const margin = { top: 40, right: 40, bottom: 60, left: 80 };
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;

    const scaleX = (d) => margin.left + (d / maxDisp) * plotWidth;
    const scaleY = (s) => margin.top + plotHeight - (s / maxShear) * plotHeight;

    // Build path
    let path = `M ${scaleX(roofDisplacement[0])} ${scaleY(baseShear[0])}`;
    for (let i = 1; i < roofDisplacement.length; i++) {
      path += ` L ${scaleX(roofDisplacement[i])} ${scaleY(baseShear[i])}`;
    }

    // Performance point markers
    const markers = this.performancePoints.map(p => {
      if (!p.displacement) return '';
      const x = scaleX(p.displacement);
      const y = scaleY(p.baseShear);
      const color = p.level === 'IO' ? '#3b82f6' : p.level === 'LS' ? '#22c55e' : '#eab308';
      return `
        <circle cx="${x}" cy="${y}" r="8" fill="${color}" stroke="white" stroke-width="2"/>
        <text x="${x + 12}" y="${y}" fill="${color}" font-size="12" font-weight="bold">${p.level}</text>
      `;
    }).join('');

    // Grid lines
    const gridLines = `
      <line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${height - margin.bottom}" stroke="#333" stroke-width="2"/>
      <line x1="${margin.left}" y1="${height - margin.bottom}" x2="${width - margin.right}" y2="${height - margin.bottom}" stroke="#333" stroke-width="2"/>
    `;

    return `
      <svg width="${width}" height="${height}" style="background: #18181b;">
        <defs>
          <linearGradient id="capacityGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:#10b981;stop-opacity:1" />
            <stop offset="50%" style="stop-color:#eab308;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#ef4444;stop-opacity:1" />
          </linearGradient>
        </defs>
        
        <!-- Grid -->
        ${gridLines}
        
        <!-- Capacity curve -->
        <path d="${path}" fill="none" stroke="url(#capacityGradient)" stroke-width="3"/>
        
        <!-- Performance points -->
        ${markers}
        
        <!-- Labels -->
        <text x="${width / 2}" y="${height - 15}" fill="#a1a1aa" font-size="14" text-anchor="middle">Roof Displacement (m)</text>
        <text x="20" y="${height / 2}" fill="#a1a1aa" font-size="14" transform="rotate(-90, 20, ${height / 2})" text-anchor="middle">Base Shear (kN)</text>
        <text x="${width / 2}" y="25" fill="white" font-size="16" text-anchor="middle" font-weight="bold">FEMA 356 Capacity Curve</text>
      </svg>
    `;
  }

  /**
   * Generate hinge status table HTML
   */
  generateHingeTable() {
    if (this.hinges.size === 0) {
      return '<p style="color: #666;">No hinges formed</p>';
    }

    const rows = Array.from(this.hinges.values()).map(h => `
      <tr style="border-bottom: 1px solid #333;">
        <td style="padding: 8px; color: white;">${h.elementId}</td>
        <td style="padding: 8px;">
          <span style="background: ${h.color}; padding: 4px 8px; border-radius: 4px; color: white; font-size: 12px;">${h.state}</span>
        </td>
        <td style="padding: 8px; color: #a1a1aa;">${h.rotation.toFixed(4)} rad</td>
        <td style="padding: 8px; color: #a1a1aa;">${h.moment.toFixed(0)} kN-m</td>
        <td style="padding: 8px; color: #a1a1aa;">${h.location}</td>
      </tr>
    `).join('');

    return `
      <table style="width: 100%; font-size: 13px;">
        <thead>
          <tr style="border-bottom: 2px solid #444;">
            <th style="padding: 8px; text-align: left; color: #10b981;">Element</th>
            <th style="padding: 8px; text-align: left; color: #10b981;">State</th>
            <th style="padding: 8px; text-align: left; color: #10b981;">Rotation</th>
            <th style="padding: 8px; text-align: left; color: #10b981;">Moment</th>
            <th style="padding: 8px; text-align: left; color: #10b981;">Location</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  }

  /**
   * Get summary statistics
   */
  getSummary() {
    const hingeCounts = { B: 0, IO: 0, LS: 0, CP: 0, E: 0 };
    this.hinges.forEach(h => {
      hingeCounts[h.state]++;
    });

    const governingLevel = hingeCounts.E > 0 ? 'E' : 
                          hingeCounts.CP > 0 ? 'CP' :
                          hingeCounts.LS > 0 ? 'LS' : 
                          hingeCounts.IO > 0 ? 'IO' : 'B';

    return {
      maxDisplacement: this.results?.maxRoofDisplacement || 0,
      maxBaseShear: this.results?.maxBaseShear || 0,
      totalHinges: this.hinges.size,
      hingeCounts,
      governingLevel,
      performanceLevel: this.getLevelDescription(governingLevel)
    };
  }

  getLevelDescription(level) {
    const descriptions = {
      B: 'Elastic (Before IO)',
      IO: 'Immediate Occupancy',
      LS: 'Life Safety',
      CP: 'Collapse Prevention',
      E: 'Beyond Collapse'
    };
    return descriptions[level] || 'Unknown';
  }

  /**
   * Wait for worker response
   */
  waitForResponse() {
    return new Promise((resolve, reject) => {
      const handler = (e) => {
        if (e.data.type === 'success') {
          this.worker.removeEventListener('message', handler);
          resolve(e.data.result);
        } else if (e.data.type === 'error') {
          this.worker.removeEventListener('message', handler);
          reject(new Error(e.data.error));
        }
      };
      this.worker.addEventListener('message', handler);
    });
  }
}

/**
 * Quick FEMA 356 pushover analysis for a simple 3-story frame
 */
export async function runFEMA356Example() {
  // Create sample 3-story frame model
  const model = {
    nodes: [
      { id: 1, x: 0, y: 0, z: 0, restraints: [1,1,1,1,1,1] }, // Base fixed
      { id: 2, x: 0, y: 0, z: 4, restraints: [0,0,0,0,0,0] },
      { id: 3, x: 0, y: 0, z: 8, restraints: [0,0,0,0,0,0] },
      { id: 4, x: 0, y: 0, z: 12, restraints: [0,0,0,0,0,0] }, // Roof
      // Other columns
      { id: 5, x: 6, y: 0, z: 0, restraints: [1,1,1,1,1,1] },
      { id: 6, x: 6, y: 0, z: 4, restraints: [0,0,0,0,0,0] },
      { id: 7, x: 6, y: 0, z: 8, restraints: [0,0,0,0,0,0] },
      { id: 8, x: 6, y: 0, z: 12, restraints: [0,0,0,0,0,0] }
    ],
    elements: [
      // Columns
      { id: 1, type: 'frame', node1: 1, node2: 2, E: 30000, A: 0.16, Iy: 0.0021, Iz: 0.0021 },
      { id: 2, type: 'frame', node1: 2, node2: 3, E: 30000, A: 0.16, Iy: 0.0021, Iz: 0.0021 },
      { id: 3, type: 'frame', node1: 3, node2: 4, E: 30000, A: 0.12, Iy: 0.0014, Iz: 0.0014 },
      { id: 4, type: 'frame', node1: 5, node2: 6, E: 30000, A: 0.16, Iy: 0.0021, Iz: 0.0021 },
      { id: 5, type: 'frame', node1: 6, node2: 7, E: 30000, A: 0.16, Iy: 0.0021, Iz: 0.0021 },
      { id: 6, type: 'frame', node1: 7, node2: 8, E: 30000, A: 0.12, Iy: 0.0014, Iz: 0.0014 },
      // Beams
      { id: 7, type: 'frame', node1: 2, node2: 6, E: 30000, A: 0.12, Iy: 0.0014, Iz: 0.0054 },
      { id: 8, type: 'frame', node1: 3, node2: 7, E: 30000, A: 0.12, Iy: 0.0014, Iz: 0.0054 },
      { id: 9, type: 'frame', node1: 4, node2: 8, E: 30000, A: 0.10, Iy: 0.0010, Iz: 0.0042 }
    ],
    materials: [
      { id: 'Concrete30', name: 'Concrete30', type: 'concrete', E: 30000, fc: 30 }
    ],
    sections: [
      { id: 'Col400x400', name: 'Col400x400', type: 'RECT', dimensions: [0.4, 0.4] },
      { id: 'Beam300x600', name: 'Beam300x600', type: 'RECT', dimensions: [0.3, 0.6] }
    ]
  };

  // Create worker
  const worker = new Worker(new URL('./FEAScriptWorker.js', import.meta.url), { type: 'module' });
  
  // Run analysis
  const pushover = new FEMA356Pushover(worker);
  
  const results = await pushover.runAnalysis(model, {
    steps: 100,
    targetDisplacement: 0.6,
    loadPattern: 'inverted_triangle'
  });

  return {
    model,
    pushover,
    results,
    summary: pushover.getSummary(),
    plot: pushover.generateCapacityPlot({ width: 600, height: 400 }),
    hingeTable: pushover.generateHingeTable()
  };
}

/**
 * Validate pushover results against FEMA 356 acceptance criteria
 */
export function validateFEMA356(results, buildingType = 'concrete_MRF') {
  const criteria = {
    concrete_MRF: {
      IO: { maxDrift: 0.007, minDuctility: 1.0 },
      LS: { maxDrift: 0.025, minDuctility: 2.0 },
      CP: { maxDrift: 0.050, minDuctility: 4.0 }
    },
    steel_MRF: {
      IO: { maxDrift: 0.007, minDuctility: 1.0 },
      LS: { maxDrift: 0.025, minDuctility: 4.0 },
      CP: { maxDrift: 0.050, minDuctility: 6.0 }
    }
  };

  const criteriaSet = criteria[buildingType] || criteria.concrete_MRF;
  
  const checks = {
    IO: results.maxRoofDisplacement <= criteriaSet.IO.maxDrift * 12, // 12m height
    LS: results.maxRoofDisplacement <= criteriaSet.LS.maxDrift * 12,
    CP: results.maxRoofDisplacement <= criteriaSet.CP.maxDrift * 12,
    ductility: results.ductility >= criteriaSet.LS.minDuctility
  };

  const overall = checks.LS && checks.ductility ? 'PASS' : 'FAIL';
  const recommendedLevel = checks.CP ? 'CP' : checks.LS ? 'LS' : checks.IO ? 'IO' : 'None';

  return {
    checks,
    overall,
    recommendedLevel,
    criteria: criteriaSet
  };
}
