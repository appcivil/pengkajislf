/**
 * CalculationPanel - Lighting Analysis Controls
 * Web Component for calculation settings and results display
 */

export class CalculationPanel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.pendingResolve = null;
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <style>
        :host { 
          display: block; 
          background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%);
          color: #f1f5f9; 
          padding: 0;
          height: 100%;
          overflow-y: auto;
          font-family: 'Inter', system-ui, sans-serif;
        }
        .section { 
          padding: 16px;
          border-bottom: 1px solid rgba(59, 130, 246, 0.2);
        }
        .section:last-child { border-bottom: none; }
        h3 { 
          margin: 0 0 12px 0; 
          color: #60a5fa; 
          font-size: 11px; 
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-weight: 600;
        }
        .grid-settings { 
          display: grid; 
          grid-template-columns: 1fr 1fr; 
          gap: 12px; 
        }
        label { 
          font-size: 11px; 
          color: #94a3b8; 
          display: block;
          margin-bottom: 4px;
        }
        input, select {
          width: 100%;
          padding: 8px 10px;
          background: rgba(30, 41, 59, 0.8);
          border: 1px solid rgba(59, 130, 246, 0.3);
          color: #f1f5f9;
          border-radius: 6px;
          font-size: 12px;
          transition: border-color 0.2s;
        }
        input:focus, select:focus {
          outline: none;
          border-color: #3b82f6;
        }
        input[type="number"]::-webkit-inner-spin-button {
          opacity: 0.5;
        }
        .results { 
          background: rgba(15, 23, 42, 0.8); 
          padding: 16px; 
          border-radius: 8px;
          border: 1px solid rgba(59, 130, 246, 0.2);
        }
        .stat-row { 
          display: flex; 
          justify-content: space-between; 
          padding: 8px 0; 
          border-bottom: 1px solid rgba(59, 130, 246, 0.1);
          font-size: 12px;
        }
        .stat-row:last-child { border-bottom: none; }
        .stat-label { color: #94a3b8; }
        .value { 
          font-weight: 600; 
          color: #34d399;
          font-family: 'JetBrains Mono', monospace;
        }
        .value.warning { color: #fbbf24; }
        .value.error { color: #f87171; }
        button.calculate {
          width: 100%; 
          padding: 12px; 
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: white; 
          border: none; 
          border-radius: 8px;
          font-weight: 600; 
          cursor: pointer; 
          margin-top: 16px;
          font-size: 13px;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        button.calculate:hover:not(:disabled) {
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          transform: translateY(-1px);
        }
        button.calculate:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        button.secondary {
          background: rgba(59, 130, 246, 0.15);
          border: 1px solid rgba(59, 130, 246, 0.4);
          margin-top: 8px;
        }
        button.secondary:hover:not(:disabled) {
          background: rgba(59, 130, 246, 0.25);
        }
        .progress-container {
          margin-top: 12px;
          display: none;
        }
        .progress-bar {
          width: 100%; 
          height: 4px; 
          background: rgba(59, 130, 246, 0.2);
          border-radius: 2px; 
          overflow: hidden;
        }
        .progress-fill {
          height: 100%; 
          background: linear-gradient(90deg, #3b82f6, #60a5fa);
          width: 0%;
          transition: width 0.3s;
        }
        .progress-text {
          font-size: 10px;
          color: #94a3b8;
          margin-top: 4px;
          text-align: center;
        }
        .compliance-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
        }
        .compliant {
          background: rgba(16, 185, 129, 0.2);
          color: #34d399;
        }
        .non-compliant {
          background: rgba(239, 68, 68, 0.2);
          color: #f87171;
        }
        .heatmap-legend {
          display: flex;
          gap: 2px;
          margin-top: 8px;
          height: 12px;
          border-radius: 6px;
          overflow: hidden;
        }
        .legend-gradient {
          flex: 1;
          background: linear-gradient(90deg, 
            #0000ff 0%,
            #00ffff 20%,
            #00ff00 40%,
            #ffff00 60%,
            #ff8000 80%,
            #ff0000 100%
          );
        }
        .legend-labels {
          display: flex;
          justify-content: space-between;
          font-size: 9px;
          color: #64748b;
          margin-top: 2px;
        }
        .export-buttons {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin-top: 12px;
        }
        .export-btn {
          padding: 8px;
          background: rgba(16, 185, 129, 0.15);
          border: 1px solid rgba(16, 185, 129, 0.3);
          color: #34d399;
          border-radius: 6px;
          font-size: 11px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .export-btn:hover {
          background: rgba(16, 185, 129, 0.25);
        }
        .info-box {
          background: rgba(59, 130, 246, 0.1);
          border: 1px solid rgba(59, 130, 246, 0.3);
          border-radius: 6px;
          padding: 10px;
          font-size: 11px;
          color: #94a3b8;
          margin-bottom: 12px;
        }
      </style>

      <div class="section">
        <div class="info-box">
          <strong style="color:#60a5fa;">💡 Tip:</strong> Set workplane height to 0.85m for desk-level calculations.
        </div>
        <h3>⚙️ Calculation Settings</h3>
        <div class="grid-settings">
          <div>
            <label>Grid Spacing (m)</label>
            <input type="number" id="grid-spacing" value="0.5" min="0.1" max="2" step="0.1">
          </div>
          <div>
            <label>Workplane Height (m)</label>
            <input type="number" id="workplane-height" value="0.85" min="0" max="2" step="0.05">
          </div>
          <div>
            <label>Maintenance Factor</label>
            <input type="number" id="maint-factor" value="0.8" min="0.5" max="1" step="0.05">
          </div>
          <div>
            <label>Calculation Method</label>
            <select id="calc-method">
              <option value="radiosity">Radiosity (Accurate)</option>
              <option value="direct">Direct Only (Fast)</option>
              <option value="hybrid">Hybrid (Balanced)</option>
            </select>
          </div>
        </div>
      </div>

      <div class="section">
        <h3>🎯 Target Standards (SNI)</h3>
        <select id="standard-select" style="width: 100%; padding: 8px; background: rgba(30, 41, 59, 0.8); color: #f1f5f9; border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 6px; font-size: 12px;">
          <option value="office">🏢 Office / Workspace (SNI: 300-500 lux)</option>
          <option value="classroom">📚 Classroom (SNI: 250-350 lux)</option>
          <option value="hospital">🏥 Hospital Ward (SNI: 100-200 lux)</option>
          <option value="retail">🛒 Retail Shop (SNI: 300-500 lux)</option>
          <option value="industry">🏭 Industry (SNI: 300-750 lux)</option>
          <option value="meeting">🤝 Meeting Room (SNI: 300-500 lux)</option>
          <option value="corridor">🚶 Corridor (SNI: 100-150 lux)</option>
          <option value="stairs">🪜 Stairs (SNI: 150-200 lux)</option>
        </select>
        
        <div style="margin-top: 12px; font-size: 11px; color: #64748b;">
          <div>Standard: <span id="std-name">SNI 03-6197-2000</span></div>
          <div>Uniformity U0: <span id="std-u0">≥ 0.7</span></div>
        </div>
      </div>

      <div class="section">
        <button class="calculate" id="btn-calculate">
          <span>🚀</span> Start Calculation
        </button>
        
        <div class="progress-container" id="progress-container">
          <div class="progress-bar">
            <div class="progress-fill" id="progress-fill"></div>
          </div>
          <div class="progress-text" id="progress-text">Initializing...</div>
        </div>
        
        <button class="calculate secondary" id="btn-cancel" style="display: none;">
          Cancel Calculation
        </button>
      </div>

      <div class="section" id="results-section" style="display: none;">
        <h3>📊 Calculation Results</h3>
        <div class="results">
          <div class="stat-row">
            <span class="stat-label">Average Illuminance</span>
            <span class="value" id="res-avg">0 lux</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Minimum Illuminance</span>
            <span class="value" id="res-min">0 lux</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Maximum Illuminance</span>
            <span class="value" id="res-max">0 lux</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Uniformity U0 (Min/Avg)</span>
            <span class="value" id="res-u0">0.00</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Uniformity U1 (Min/Max)</span>
            <span class="value" id="res-u1">0.00</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Power Density (LPD)</span>
            <span class="value" id="res-lpd">0 W/m²</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Compliance Status</span>
            <span id="res-status" class="compliance-badge non-compliant">Pending</span>
          </div>
        </div>
        
        <h3 style="margin-top: 16px;">🔥 Heatmap Scale</h3>
        <div class="heatmap-legend">
          <div class="legend-gradient"></div>
        </div>
        <div class="legend-labels">
          <span>0 lux</span>
          <span>250</span>
          <span>500</span>
          <span>750</span>
          <span>1000+</span>
        </div>
        
        <div class="export-buttons">
          <button class="export-btn" id="btn-export-csv">📄 Export CSV</button>
          <button class="export-btn" id="btn-report">📋 Full Report</button>
        </div>
      </div>
    `;

    this.setupEvents();
  }

  setupEvents() {
    this.shadowRoot.getElementById('btn-calculate').addEventListener('click', () => {
      this.startCalculation();
    });

    this.shadowRoot.getElementById('standard-select').addEventListener('change', (e) => {
      this.updateStandardInfo(e.target.value);
    });

    this.shadowRoot.getElementById('btn-export-csv').addEventListener('click', () => {
      this.exportCSV();
    });

    this.shadowRoot.getElementById('btn-report').addEventListener('click', () => {
      this.generateReport();
    });
  }

  updateStandardInfo(standard) {
    const standards = {
      office: { name: 'SNI 03-6197-2000', u0: '≥ 0.7', minLux: 300, maxLux: 500 },
      classroom: { name: 'SNI 03-6197-2000', u0: '≥ 0.7', minLux: 250, maxLux: 350 },
      hospital: { name: 'SNI 03-6197-2000', u0: '≥ 0.7', minLux: 100, maxLux: 200 },
      retail: { name: 'SNI 03-6197-2000', u0: '≥ 0.7', minLux: 300, maxLux: 500 },
      industry: { name: 'SNI 03-6197-2000', u0: '≥ 0.6', minLux: 300, maxLux: 750 },
      meeting: { name: 'SNI 03-6197-2000', u0: '≥ 0.7', minLux: 300, maxLux: 500 },
      corridor: { name: 'SNI 03-6197-2000', u0: '≥ 0.5', minLux: 100, maxLux: 150 },
      stairs: { name: 'SNI 03-6197-2000', u0: '≥ 0.5', minLux: 150, maxLux: 200 }
    };
    
    const std = standards[standard];
    if (std) {
      this.shadowRoot.getElementById('std-name').textContent = std.name;
      this.shadowRoot.getElementById('std-u0').textContent = std.u0;
    }
  }

  async startCalculation() {
    const btn = this.shadowRoot.getElementById('btn-calculate');
    const progressContainer = this.shadowRoot.getElementById('progress-container');
    const fill = this.shadowRoot.getElementById('progress-fill');
    const text = this.shadowRoot.getElementById('progress-text');
    const resultsSection = this.shadowRoot.getElementById('results-section');
    
    btn.disabled = true;
    progressContainer.style.display = 'block';
    resultsSection.style.display = 'none';
    
    // Get settings
    const settings = {
      gridSpacing: parseFloat(this.shadowRoot.getElementById('grid-spacing').value),
      workplaneHeight: parseFloat(this.shadowRoot.getElementById('workplane-height').value),
      maintenanceFactor: parseFloat(this.shadowRoot.getElementById('maint-factor').value),
      method: this.shadowRoot.getElementById('calc-method').value,
      standard: this.shadowRoot.getElementById('standard-select').value,
      onProgress: (pct, message) => {
        fill.style.width = pct + '%';
        if (message) text.textContent = message;
      }
    };

    // Dispatch calculation event
    const event = new CustomEvent('calculate-lighting', {
      detail: { settings },
      bubbles: true,
      composed: true
    });
    
    this.dispatchEvent(event);
  }

  displayResults(data, standard) {
    const resultsSection = this.shadowRoot.getElementById('results-section');
    const progressContainer = this.shadowRoot.getElementById('progress-container');
    const btn = this.shadowRoot.getElementById('btn-calculate');
    
    progressContainer.style.display = 'none';
    resultsSection.style.display = 'block';
    btn.disabled = false;
    
    // Update values
    this.shadowRoot.getElementById('res-avg').textContent = data.average.toFixed(1) + ' lux';
    this.shadowRoot.getElementById('res-min').textContent = data.minimum.toFixed(1) + ' lux';
    this.shadowRoot.getElementById('res-max').textContent = data.maximum.toFixed(1) + ' lux';
    
    const u0 = data.uniformityU0 || (data.average > 0 ? data.minimum / data.average : 0);
    const u1 = data.uniformityU1 || (data.maximum > 0 ? data.minimum / data.maximum : 0);
    
    this.shadowRoot.getElementById('res-u0').textContent = u0.toFixed(2);
    this.shadowRoot.getElementById('res-u1').textContent = u1.toFixed(2);
    this.shadowRoot.getElementById('res-lpd').textContent = (data.powerDensity || 0).toFixed(2) + ' W/m²';
    
    // Compliance check
    const standards = {
      office: { min: 300, max: 500, minU0: 0.7 },
      classroom: { min: 250, max: 350, minU0: 0.7 },
      hospital: { min: 100, max: 200, minU0: 0.7 },
      retail: { min: 300, max: 500, minU0: 0.7 },
      industry: { min: 300, max: 750, minU0: 0.6 },
      meeting: { min: 300, max: 500, minU0: 0.7 },
      corridor: { min: 100, max: 150, minU0: 0.5 },
      stairs: { min: 150, max: 200, minU0: 0.5 }
    };
    
    const req = standards[standard];
    const statusEl = this.shadowRoot.getElementById('res-status');
    
    let isCompliant = false;
    if (req) {
      isCompliant = data.average >= req.min && data.average <= req.max && u0 >= req.minU0;
    }
    
    if (isCompliant) {
      statusEl.textContent = '✓ COMPLIANT';
      statusEl.className = 'compliance-badge compliant';
    } else {
      statusEl.textContent = '✗ NOT COMPLIANT';
      statusEl.className = 'compliance-badge non-compliant';
    }
    
    // Store results for export
    this.lastResults = { ...data, standard, isCompliant };
  }

  exportCSV() {
    if (!this.lastResults || !this.lastResults.grid) {
      alert('No calculation data to export');
      return;
    }
    
    const grid = this.lastResults.grid;
    let csv = 'X,Y,Z,Illuminance (lux)\n';
    
    grid.forEach(point => {
      csv += `${point.point.x.toFixed(3)},${point.point.y.toFixed(3)},${point.point.z.toFixed(3)},${point.illuminance.toFixed(2)}\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lighting-calculation-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  generateReport() {
    if (!this.lastResults) {
      alert('No calculation data available');
      return;
    }
    
    this.dispatchEvent(new CustomEvent('generate-report', {
      detail: { results: this.lastResults },
      bubbles: true,
      composed: true
    }));
  }

  setResults(data) {
    const standard = this.shadowRoot.getElementById('standard-select').value;
    this.displayResults(data, standard);
  }
}

customElements.define('calculation-panel', CalculationPanel);
