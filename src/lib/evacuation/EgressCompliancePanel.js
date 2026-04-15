/**
 * EgressCompliancePanel.js - Evaluasi Compliance SNI 03-1746-2000 & NFPA 101
 * Panel untuk check width, travel distance, dan RSET/ASET analysis
 */

import { archState } from '../archsim/StateManager.js';

export class EgressCompliancePanel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.results = null;
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <style>
        :host { 
          display: block; 
          background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%); 
          color: white; 
          padding: 24px; 
          height: 100%; 
          overflow-y: auto;
          border-radius: 12px;
        }
        h2 { 
          color: #ef4444; 
          margin: 0 0 8px; 
          font-size: 20px;
          font-weight: 800;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .subtitle {
          font-size: 12px;
          color: #94a3b8;
          margin-bottom: 24px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .section { 
          background: rgba(255, 255, 255, 0.03); 
          padding: 18px; 
          border-radius: 12px; 
          margin-bottom: 16px;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        h3 { 
          margin: 0 0 14px; 
          color: #fca5a5; 
          font-size: 14px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .check-row { 
          display: flex; 
          justify-content: space-between; 
          align-items: center;
          padding: 10px 0; 
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          font-size: 13px;
        }
        .check-row:last-child { 
          border-bottom: none; 
        }
        .check-label {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .check-icon {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: bold;
        }
        .check-icon.pass {
          background: rgba(16, 185, 129, 0.2);
          color: #10b981;
        }
        .check-icon.fail {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
        }
        .check-icon.warn {
          background: rgba(245, 158, 11, 0.2);
          color: #f59e0b;
        }
        .check-value {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .value-actual {
          color: #e5e5e5;
          font-weight: 600;
        }
        .value-required {
          color: #737373;
          font-size: 11px;
        }
        
        .rset-comparison { 
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.2) 100%);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 16px;
          padding: 24px;
          margin: 20px 0;
          text-align: center;
        }
        .safety-factor { 
          font-size: 48px; 
          font-weight: 800;
          margin: 12px 0;
          transition: color 0.3s;
        }
        .safety-factor.safe { color: #10b981; }
        .safety-factor.marginal { color: #f59e0b; }
        .safety-factor.unsafe { color: #ef4444; }
        
        .rset-label { 
          font-size: 11px; 
          text-transform: uppercase;
          letter-spacing: 2px;
          color: #fca5a5;
        }
        .safety-status {
          font-size: 14px;
          font-weight: 600;
          margin-top: 8px;
        }
        .safety-status.safe { color: #10b981; }
        .safety-status.marginal { color: #f59e0b; }
        .safety-status.unsafe { color: #ef4444; }
        
        .metric-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-top: 16px;
        }
        .metric-box {
          background: rgba(255, 255, 255, 0.03);
          padding: 14px;
          border-radius: 10px;
          text-align: center;
        }
        .metric-value {
          font-size: 24px;
          font-weight: 700;
          color: #3b82f6;
        }
        .metric-label {
          font-size: 10px;
          color: #737373;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-top: 4px;
        }
        
        .btn-check {
          width: 100%;
          padding: 14px;
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          color: white;
          border: none;
          border-radius: 10px;
          font-weight: 700;
          cursor: pointer;
          font-size: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s;
        }
        .btn-check:hover {
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          transform: translateY(-1px);
        }
        .btn-check:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }
        
        .recommendation-list {
          margin-top: 16px;
          padding: 16px;
          background: rgba(245, 158, 11, 0.1);
          border: 1px solid rgba(245, 158, 11, 0.2);
          border-radius: 10px;
        }
        .recommendation-title {
          font-size: 12px;
          font-weight: 600;
          color: #f59e0b;
          margin-bottom: 10px;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .recommendation-item {
          font-size: 12px;
          color: #d4d4d4;
          padding: 6px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          display: flex;
          align-items: flex-start;
          gap: 8px;
        }
        .recommendation-item:last-child {
          border-bottom: none;
        }
        .rec-icon {
          color: #f59e0b;
          flex-shrink: 0;
        }
      </style>

      <h2>🚨 Evaluasi Jalur Evakuasi</h2>
      <div class="subtitle">SNI 03-1746-2000 & NFPA 101</div>

      <div class="section">
        <h3>📏 Lebar Jalur Evakuasi</h3>
        <div id="width-checks">
          <div class="check-row">
            <span style="color: #737373;">Belum ada data</span>
          </div>
        </div>
      </div>

      <div class="section">
        <h3>📐 Jarak Tempuh & Waktu</h3>
        <div id="distance-checks">
          <div class="check-row">
            <span style="color: #737373;">Belum ada data</span>
          </div>
        </div>
      </div>

      <div class="section">
        <h3>👥 Kapasitas & Flow Rate</h3>
        <div id="flow-checks">
          <div class="check-row">
            <span style="color: #737373;">Belum ada data</span>
          </div>
        </div>
      </div>

      <div class="rset-comparison">
        <div class="rset-label">Safety Factor (ASET / RSET)</div>
        <div class="safety-factor" id="safety-factor">-</div>
        <div class="metric-grid">
          <div class="metric-box">
            <div class="metric-value" id="rset-value">-</div>
            <div class="metric-label">RSET (s)</div>
          </div>
          <div class="metric-box">
            <div class="metric-value" id="aset-value">300</div>
            <div class="metric-label">ASET (s)</div>
          </div>
        </div>
        <div class="safety-status" id="safety-status">Belum dihitung</div>
      </div>

      <button class="btn-check" id="btn-compliance">
        <span>🔍</span> Check Compliance
      </button>

      <div class="recommendation-list" id="recommendations" style="display: none;">
        <div class="recommendation-title">
          <span>⚠️</span> Rekomendasi Perbaikan
        </div>
        <div id="recommendation-items"></div>
      </div>
    `;

    this.setupEventListeners();
  }

  setupEventListeners() {
    this.shadowRoot.getElementById('btn-compliance').addEventListener('click', () => {
      this.checkCompliance();
    });

    // Listen untuk simulation complete
    window.addEventListener('evacuation-complete', (e) => {
      this.evaluateResults(e.detail);
    });
  }

  checkCompliance() {
    const results = archState.state.evacuationResults;
    if (!results) {
      this.showNotification('Jalankan simulasi evakuasi terlebih dahulu!', 'warning');
      return;
    }

    this.evaluateResults(results);
  }

  evaluateResults(results) {
    this.results = results;
    
    // Build compliance checks
    const widthChecks = this.buildWidthChecks(results);
    const distanceChecks = this.buildDistanceChecks(results);
    const flowChecks = this.buildFlowChecks(results);
    
    // Calculate RSET vs ASET
    const rset = parseFloat(results.rset);
    const aset = this.calculateASET(results);
    const safetyFactor = rset > 0 ? (aset / rset).toFixed(2) : 0;
    
    // Render checks
    this.renderWidthChecks(widthChecks);
    this.renderDistanceChecks(distanceChecks);
    this.renderFlowChecks(flowChecks);
    
    // Update RSET display
    this.updateRSETDisplay(rset, aset, safetyFactor);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(widthChecks, distanceChecks, flowChecks, safetyFactor);
    this.renderRecommendations(recommendations);
  }

  buildWidthChecks(results) {
    const flowRates = results.flowRates || {};
    
    return Object.entries(flowRates).map(([exitId, data]) => {
      const minRequired = exitId.includes('stair') ? 1.2 : 1.0;
      const hasPass = parseFloat(data.specificFlow) > 0.5;
      
      return {
        name: exitId.includes('stair') ? 'Tangga ' + exitId.split('_')[1] : 'Pintu ' + exitId.split('_')[1],
        actual: `${data.width}m (${data.specificFlow} pers/m/s)`,
        required: `≥${minRequired}m (0.5 pers/m/s)`,
        pass: hasPass,
        value: data.width
      };
    });
  }

  buildDistanceChecks(results) {
    const rset = parseFloat(results.rset);
    
    return [
      {
        name: 'RSET (Required Safe Egress Time)',
        actual: `${rset.toFixed(1)} s`,
        required: '< 300 s (5 min)',
        pass: rset < 300
      },
      {
        name: 'Waktu Evakuasi 90%',
        actual: `${this.calculate90thPercentile(results)} s`,
        required: '< 180 s (3 min)',
        pass: this.calculate90thPercentile(results) < 180
      },
      {
        name: 'Waktu Rata-rata',
        actual: `${results.avgTime} s`,
        required: '< 120 s (2 min)',
        pass: parseFloat(results.avgTime) < 120
      }
    ];
  }

  buildFlowChecks(results) {
    const flowRates = results.flowRates || {};
    const totalFlow = Object.values(flowRates).reduce((sum, f) => sum + parseFloat(f.flowRate || 0), 0);
    
    return [
      {
        name: 'Total Flow Rate',
        actual: `${totalFlow.toFixed(1)} pers/min`,
        required: '> 50 pers/min',
        pass: totalFlow > 50
      },
      {
        name: 'Evacuation Rate',
        actual: `${results.evacuationRate}%`,
        required: '> 95%',
        pass: parseFloat(results.evacuationRate) > 95
      },
      {
        name: 'Agent Stranded',
        actual: `${results.stranded} orang`,
        required: '0 orang',
        pass: results.stranded === 0
      }
    ];
  }

  calculateASET(results) {
    // ASET (Available Safe Egress Time) calculation
    // Based on smoke spread, fire growth, etc.
    // Simplified: base 5 minutes + adjustments
    
    let aset = 300; // 5 minutes base
    
    // Adjust for building characteristics
    const totalAgents = results.totalAgents || 0;
    
    // Reduce ASET for large occupant loads
    if (totalAgents > 500) aset -= 60;
    if (totalAgents > 1000) aset -= 120;
    
    // Adjust for evacuation rate
    const rate = parseFloat(results.evacuationRate);
    if (rate < 50) aset -= 60;
    if (rate < 90) aset -= 30;
    
    return Math.max(180, aset); // Minimum 3 minutes
  }

  calculate90thPercentile(results) {
    const times = results.agentDetails
      ?.filter(a => a.exitTime)
      ?.map(a => parseFloat(a.exitTime))
      ?.sort((a, b) => a - b);
    
    if (!times || times.length === 0) return 0;
    
    const index = Math.floor(times.length * 0.9);
    return times[index] || 0;
  }

  renderWidthChecks(checks) {
    const container = this.shadowRoot.getElementById('width-checks');
    container.innerHTML = checks.map(c => this.renderCheckRow(c)).join('');
  }

  renderDistanceChecks(checks) {
    const container = this.shadowRoot.getElementById('distance-checks');
    container.innerHTML = checks.map(c => this.renderCheckRow(c)).join('');
  }

  renderFlowChecks(checks) {
    const container = this.shadowRoot.getElementById('flow-checks');
    container.innerHTML = checks.map(c => this.renderCheckRow(c)).join('');
  }

  renderCheckRow(check) {
    const status = check.pass ? 'pass' : check.value > 0 ? 'fail' : 'warn';
    const icon = check.pass ? '✓' : check.value > 0 ? '✗' : '!';
    
    return `
      <div class="check-row">
        <div class="check-label">
          <div class="check-icon ${status}">${icon}</div>
          <span>${check.name}</span>
        </div>
        <div class="check-value">
          <span class="value-actual">${check.actual}</span>
          <span class="value-required">/ ${check.required}</span>
        </div>
      </div>
    `;
  }

  updateRSETDisplay(rset, aset, safetyFactor) {
    const sfEl = this.shadowRoot.getElementById('safety-factor');
    const rsetEl = this.shadowRoot.getElementById('rset-value');
    const asetEl = this.shadowRoot.getElementById('aset-value');
    const statusEl = this.shadowRoot.getElementById('safety-status');
    
    rsetEl.textContent = Math.ceil(rset);
    asetEl.textContent = aset;
    sfEl.textContent = safetyFactor;
    
    // Determine safety status
    const sf = parseFloat(safetyFactor);
    let status, statusClass;
    
    if (sf >= 1.5) {
      status = 'SAFE - Desain memenuhi standar keamanan';
      statusClass = 'safe';
    } else if (sf >= 1.0) {
      status = 'MARGINAL - Memenuhi minimum requirement';
      statusClass = 'marginal';
    } else {
      status = 'UNSAFE - Perlu peningkatan jalur evakuasi';
      statusClass = 'unsafe';
    }
    
    sfEl.className = `safety-factor ${statusClass}`;
    statusEl.className = `safety-status ${statusClass}`;
    statusEl.textContent = status;
  }

  generateRecommendations(widthChecks, distanceChecks, flowChecks, safetyFactor) {
    const recs = [];
    
    // Width recommendations
    widthChecks.filter(c => !c.pass).forEach(c => {
      recs.push(`Perlebar ${c.name} menjadi minimum ${c.required.split(' ')[0].replace('≥', '')}`);
    });
    
    // Distance/time recommendations
    const rsetCheck = distanceChecks.find(c => c.name.includes('RSET'));
    if (rsetCheck && !rsetCheck.pass) {
      recs.push('Tambahkan exit door untuk mengurangi RSET di bawah 5 menit');
    }
    
    // Flow recommendations
    const strandedCheck = flowChecks.find(c => c.name.includes('Stranded'));
    if (strandedCheck && !strandedCheck.pass) {
      recs.push(`${strandedCheck.actual} orang tidak dapat terevakuasi - perlu tambahan exit`);
    }
    
    // Safety factor
    if (safetyFactor < 1.0) {
      recs.push('Safety Factor < 1.0 - RSET melebihi ASET, risiko tinggi!');
    } else if (safetyFactor < 1.5) {
      recs.push('Safety Factor < 1.5 - pertimbangkan penambahan kapasitas exit');
    }
    
    return recs;
  }

  renderRecommendations(recs) {
    const container = this.shadowRoot.getElementById('recommendations');
    const items = this.shadowRoot.getElementById('recommendation-items');
    
    if (recs.length === 0) {
      container.style.display = 'none';
      return;
    }
    
    items.innerHTML = recs.map(r => `
      <div class="recommendation-item">
        <span class="rec-icon">→</span>
        <span>${r}</span>
      </div>
    `).join('');
    
    container.style.display = 'block';
  }

  showNotification(message, type = 'info') {
    // Could be replaced with toast notification
    console.log(`[EgressCompliance] ${type}: ${message}`);
  }
}

// Define custom element
customElements.define('egress-compliance-panel', EgressCompliancePanel);

export default { EgressCompliancePanel };
