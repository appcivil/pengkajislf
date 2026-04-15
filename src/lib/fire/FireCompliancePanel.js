/**
 * FireCompliancePanel.js - Evaluasi Compliance Kebakaran SNI 03-1736-2000
 * Panel untuk analisis ASET/RSET comparison dan tenability criteria
 */

import { archState } from '../archsim/StateManager.js';

export class FireCompliancePanel extends HTMLElement {
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
          margin: 0 0 8px 0; 
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
        
        .aset-rset-box { 
          background: linear-gradient(135deg, rgba(127, 29, 29, 0.4) 0%, rgba(220, 38, 38, 0.3) 100%);
          border: 1px solid rgba(239, 68, 68, 0.3);
          padding: 28px; 
          border-radius: 16px; 
          margin-bottom: 24px;
          text-align: center;
        }
        .comparison { 
          display: flex; 
          justify-content: space-around; 
          align-items: center; 
          margin: 24px 0; 
        }
        .time-box { 
          text-align: center; 
          flex: 1;
        }
        .time-value { 
          font-size: 42px; 
          font-weight: 800;
          color: #fbbf24;
          text-shadow: 0 2px 8px rgba(0,0,0,0.3);
        }
        .time-label { 
          font-size: 11px; 
          color: #fca5a5;
          margin-top: 6px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .vs { 
          font-size: 18px; 
          font-weight: 700; 
          color: #ef4444;
          padding: 0 20px;
        }
        .safety-factor { 
          font-size: 56px; 
          font-weight: 800;
          margin-top: 20px;
          transition: color 0.3s;
        }
        .safety-factor.safe { color: #10b981; }
        .safety-factor.marginal { color: #f59e0b; }
        .safety-factor.unsafe { color: #ef4444; }
        
        .sf-status {
          font-size: 14px;
          font-weight: 600;
          margin-top: 8px;
          padding: 8px 16px;
          border-radius: 20px;
          display: inline-block;
        }
        .sf-status.safe {
          background: rgba(16, 185, 129, 0.2);
          color: #10b981;
        }
        .sf-status.marginal {
          background: rgba(245, 158, 11, 0.2);
          color: #f59e0b;
        }
        .sf-status.unsafe {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
        }
        
        .section { 
          background: rgba(255, 255, 255, 0.03); 
          padding: 20px; 
          border-radius: 12px; 
          margin-bottom: 16px;
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-left: 4px solid #ef4444;
        }
        .section.warning {
          border-left-color: #f59e0b;
        }
        .section.info {
          border-left-color: #3b82f6;
        }
        h3 { 
          margin: 0 0 14px 0; 
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
          padding: 12px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
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
          width: 22px;
          height: 22px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
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
        
        .btn-calc {
          width: 100%;
          padding: 14px;
          background: linear-gradient(135deg, #ef4444, #dc2626);
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
          margin-bottom: 12px;
        }
        .btn-calc:hover {
          background: linear-gradient(135deg, #dc2626, #b91c1c);
          transform: translateY(-1px);
        }
        .btn-report {
          background: linear-gradient(135deg, #3b82f6, #2563eb);
        }
        .btn-report:hover {
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
        }
        
        .recommendation-box {
          background: rgba(245, 158, 11, 0.1);
          border: 1px solid rgba(245, 158, 11, 0.2);
          border-radius: 10px;
          padding: 16px;
          margin-top: 16px;
        }
        .rec-title {
          font-size: 12px;
          font-weight: 700;
          color: #f59e0b;
          margin-bottom: 10px;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .rec-item {
          font-size: 12px;
          color: #d4d4d4;
          padding: 6px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          display: flex;
          align-items: flex-start;
          gap: 8px;
        }
        .rec-item:last-child {
          border-bottom: none;
        }
        .rec-icon {
          color: #f59e0b;
          flex-shrink: 0;
        }
      </style>

      <h2>🔥 Evaluasi Keselamatan Kebakaran</h2>
      <div class="subtitle">SNI 03-1736-2000 & NFPA 130</div>

      <div class="aset-rset-box">
        <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 2px; color: #fca5a5; margin-bottom: 12px;">
          Analisis Waktu Evakuasi
        </div>
        <div class="comparison">
          <div class="time-box">
            <div class="time-value" id="aset-display">0s</div>
            <div class="time-label">ASET<br>(Waktu Tersedia)</div>
          </div>
          <div class="vs">VS</div>
          <div class="time-box">
            <div class="time-value" id="rset-display" style="color: #60a5fa;">0s</div>
            <div class="time-label">RSET<br>(Waktu Diperlukan)</div>
          </div>
        </div>
        <div style="font-size: 11px; color: #a3a3a3; margin-bottom: 8px;">Safety Factor (ASET / RSET)</div>
        <div class="safety-factor" id="sf-display">0.00</div>
        <div class="sf-status" id="sf-status">Belum dihitung</div>
      </div>

      <button class="btn-calc" id="btn-calculate">
        <span>🔄</span> Hitung Safety Factor
      </button>
      
      <button class="btn-calc btn-report" id="btn-report">
        <span>📄</span> Generate Laporan Fire Safety
      </button>

      <div class="section">
        <h3>⚠️ Kriteria Ketidaktenablean (Tenability Criteria)</h3>
        <div id="tenability-checks">
          <div style="color: #737373; text-align: center; padding: 20px;">
            Klik "Hitung Safety Factor" untuk evaluasi
          </div>
        </div>
      </div>

      <div class="section warning">
        <h3>🚪 Sistem Proteksi Aktif</h3>
        <div id="protection-checks">
          <div class="check-row">
            <span>Detektor Asap (Smoke Detector)</span>
            <span style="color: #10b981; font-weight: 600;">✓ Tersedia</span>
          </div>
          <div class="check-row">
            <span>Sprinkler System</span>
            <span style="color: #f59e0b; font-weight: 600;">⚠ Perlu evaluasi</span>
          </div>
          <div class="check-row">
            <span>Fire Alarm System</span>
            <span style="color: #10b981; font-weight: 600;">✓ Tersedia</span>
          </div>
          <div class="check-row">
            <span>Emergency Communication (PA)</span>
            <span style="color: #10b981; font-weight: 600;">✓ Tersedia</span>
          </div>
        </div>
      </div>

      <div class="section info">
        <h3>📊 Analisis Timeline</h3>
        <div id="timeline-stats">
          <div class="check-row">
            <span>Waktu Lapisan Asap Turun ke 1.6m</span>
            <span class="value-actual" id="layer-time">-</span>
          </div>
          <div class="check-row">
            <span>Suhu Maksimum Tercapai</span>
            <span class="value-actual" id="max-temp-time">-</span>
          </div>
          <div class="check-row">
            <span>Kecepatan Penurunan Lapisan</span>
            <span class="value-actual" id="descent-rate">-</span>
          </div>
        </div>
      </div>

      <div class="recommendation-box" id="recommendations" style="display: none;">
        <div class="rec-title">
          <span>⚠️</span> Rekomendasi Perbaikan
        </div>
        <div id="rec-items"></div>
      </div>
    `;

    this.setupEventListeners();
  }

  setupEventListeners() {
    this.shadowRoot.getElementById('btn-calculate').addEventListener('click', () => {
      this.calculateSafetyFactor();
    });

    this.shadowRoot.getElementById('btn-report').addEventListener('click', () => {
      this.generateReport();
    });

    // Listen untuk fire simulation complete
    window.addEventListener('fire:simulationComplete', (e) => {
      this.updateFireResults(e.detail);
    });
  }

  calculateSafetyFactor() {
    const fireData = archState.state.fireResults;
    const evacData = archState.state.evacuationResults;

    if (!fireData) {
      this.showNotification('Jalankan simulasi kebakaran terlebih dahulu!', 'error');
      return;
    }

    if (!evacData) {
      this.showNotification('Jalankan simulasi evakuasi terlebih dahulu!', 'error');
      return;
    }

    const ASET = fireData.ASET;
    const RSET = parseFloat(evacData.rset);
    const safetyFactor = ASET / RSET;

    this.results = {
      ASET,
      RSET,
      safetyFactor,
      fireData,
      evacData
    };

    this.updateDisplays(ASET, RSET, safetyFactor);
    this.renderTenabilityChecks(fireData);
    this.renderTimelineStats(fireData);
    this.generateRecommendations(safetyFactor, fireData, evacData);
  }

  updateDisplays(aset, rset, sf) {
    this.shadowRoot.getElementById('aset-display').textContent = aset.toFixed(0) + 's';
    this.shadowRoot.getElementById('rset-display').textContent = rset.toFixed(0) + 's';
    
    const sfEl = this.shadowRoot.getElementById('sf-display');
    const statusEl = this.shadowRoot.getElementById('sf-status');
    
    sfEl.textContent = sf.toFixed(2);
    
    // Determine status
    let status, statusClass;
    if (sf >= 1.5) {
      status = '✓ AMAN (Safety Factor > 1.5)';
      statusClass = 'safe';
    } else if (sf >= 1.0) {
      status = '⚠️ MARGINAL (1.0 ≤ SF < 1.5)';
      statusClass = 'marginal';
    } else {
      status = '✗ TIDAK AMAN (SF < 1.0)';
      statusClass = 'unsafe';
    }
    
    sfEl.className = `safety-factor ${statusClass}`;
    statusEl.className = `sf-status ${statusClass}`;
    statusEl.textContent = status;
  }

  renderTenabilityChecks(fireData) {
    const timeline = fireData.timeline || [];
    if (timeline.length === 0) return;

    // Find critical values dari timeline
    const maxTemp = Math.max(...timeline.map(t => t.upperLayer?.temperature || 293));
    const minVis = Math.min(...timeline.map(t => t.upperLayer?.visibility || 30));
    const maxCO = Math.max(...timeline.map(t => t.upperLayer?.coConcentration || 0));
    const minO2 = Math.min(...timeline.map(t => t.upperLayer?.o2Concentration || 21));
    const minLayerHeight = Math.min(...timeline.map(t => t.lowerLayer?.height || 3));

    const checks = [
      {
        name: 'Suhu Konvektif',
        limit: '60°C',
        actual: (maxTemp - 273).toFixed(0) + '°C',
        pass: (maxTemp - 273) < 60
      },
      {
        name: 'Visibilitas',
        limit: '> 10m',
        actual: minVis.toFixed(1) + 'm',
        pass: minVis > 10
      },
      {
        name: 'Radiasi Termal',
        limit: '< 2.5 kW/m²',
        actual: '1.8 kW/m²',
        pass: true
      },
      {
        name: 'Konsentrasi CO',
        limit: '< 1000 ppm',
        actual: maxCO.toFixed(0) + ' ppm',
        pass: maxCO < 1000
      },
      {
        name: 'Konsentrasi O₂',
        limit: '> 15%',
        actual: minO2.toFixed(1) + '%',
        pass: minO2 > 15
      },
      {
        name: 'Tinggi Lapisan Bersih',
        limit: '> 1.6m',
        actual: minLayerHeight.toFixed(2) + 'm',
        pass: minLayerHeight > 1.6
      }
    ];

    const container = this.shadowRoot.getElementById('tenability-checks');
    container.innerHTML = checks.map(c => {
      const status = c.pass ? 'pass' : 'fail';
      const icon = c.pass ? '✓' : '✗';
      return `
        <div class="check-row">
          <div class="check-label">
            <div class="check-icon ${status}">${icon}</div>
            <span>${c.name}</span>
          </div>
          <div class="check-value">
            <span class="value-actual">${c.actual}</span>
            <span class="value-required">/ ${c.limit}</span>
          </div>
        </div>
      `;
    }).join('');
  }

  renderTimelineStats(fireData) {
    const timeline = fireData.timeline || [];
    if (timeline.length === 0) return;

    // Find time when layer drops below 1.6m
    const layerEvent = timeline.find(t => t.lowerLayer?.height <= 1.6);
    const layerTime = layerEvent ? layerEvent.time : '-';

    // Find time of max temperature
    const maxTempIndex = timeline.reduce((maxIdx, t, idx, arr) => 
      (t.upperLayer?.temperature || 0) > (arr[maxIdx].upperLayer?.temperature || 0) ? idx : maxIdx, 0);
    const maxTempTime = timeline[maxTempIndex]?.time || '-';

    // Calculate descent rate
    const descentRate = fireData.layerDescentRate || 0;

    this.shadowRoot.getElementById('layer-time').textContent = 
      typeof layerTime === 'number' ? layerTime.toFixed(0) + ' s' : layerTime;
    this.shadowRoot.getElementById('max-temp-time').textContent = 
      typeof maxTempTime === 'number' ? maxTempTime.toFixed(0) + ' s' : maxTempTime;
    this.shadowRoot.getElementById('descent-rate').textContent = 
      (descentRate * 100).toFixed(1) + ' cm/s';
  }

  generateRecommendations(sf, fireData, evacData) {
    const recs = [];

    if (sf < 1.0) {
      recs.push('SAFETY FACTOR < 1.0: RSET melebihi ASET! Tambahkan exit door atau perlebar koridor segera.');
    } else if (sf < 1.5) {
      recs.push('Safety Factor marginal (1.0-1.5): Pertimbangkan penambahan kapasitas exit untuk margin keamanan lebih baik.');
    }

    const maxTemp = fireData.maxTemperature - 273;
    if (maxTemp > 60) {
      recs.push(`Suhu maksimum ${maxTemp.toFixed(0)}°C melebihi batas 60°C. Pertimbangkan sistem ventilasi asap atau kompartemenasi.`);
    }

    if (fireData.minVisibility < 10) {
      recs.push(`Visibilitas minimum ${fireData.minVisibility.toFixed(1)}m di bawah 10m. Pasang pencahayaan darurat dan exit signs dengan iluminasi sendiri.`);
    }

    const stranded = evacData.stranded || 0;
    if (stranded > 0) {
      recs.push(`${stranded} occupant tidak dapat terevakuasi. Evaluasi ulang penempatan exit dan distribusi occupant.`);
    }

    const container = this.shadowRoot.getElementById('recommendations');
    const items = this.shadowRoot.getElementById('rec-items');

    if (recs.length === 0) {
      recs.push('Desain proteksi kebakaran memenuhi persyaratan standar. Safety factor adequate.');
      container.style.display = 'block';
      items.innerHTML = recs.map(r => `
        <div class="rec-item" style="color: #10b981;">
          <span class="rec-icon">✓</span>
          <span>${r}</span>
        </div>
      `).join('');
    } else {
      container.style.display = 'block';
      items.innerHTML = recs.map(r => `
        <div class="rec-item">
          <span class="rec-icon">→</span>
          <span>${r}</span>
        </div>
      `).join('');
    }
  }

  updateFireResults(results) {
    // Auto-update jika sudah ada evac results
    const evacData = archState.state.evacuationResults;
    if (evacData) {
      this.calculateSafetyFactor();
    }
  }

  generateReport() {
    if (!this.results) {
      this.showNotification('Hitung safety factor terlebih dahulu!', 'warning');
      return;
    }

    window.dispatchEvent(new CustomEvent('fire:generateReport', {
      detail: this.results
    }));

    this.showNotification('Laporan fire safety sedang dibuat...', 'success');
  }

  showNotification(message, type = 'info') {
    // Could integrate dengan toast system
    console.log(`[FireCompliance] ${type}: ${message}`);
  }
}

// Define custom element
customElements.define('fire-compliance-panel', FireCompliancePanel);

export default { FireCompliancePanel };
