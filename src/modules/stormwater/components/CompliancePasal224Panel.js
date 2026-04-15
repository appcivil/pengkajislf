/**
 * CompliancePasal224Panel - Evaluasi Kepatuhan Pasal 224 ayat (11)
 * Panel evaluasi lengkap untuk sistem pengelolaan air hujan
 */

import { RainwaterManagementEvaluator } from '../evaluation/RainwaterManagementEvaluator.js';

export class CompliancePasal224Panel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.evaluator = new RainwaterManagementEvaluator();
    this.activeTab = 'catchment';
    this.data = this.getDefaultData();
    this.results = null;
  }

  getDefaultData() {
    return {
      roof: {
        area: 200,
        material: 'metal',
        runoffCoefficient: 0.95,
        gutter: { width: 150, height: 100 },
        firstFlushVolume: 0.2,
        hasLeafGuard: true,
        hasRainwaterHead: true
      },
      rainfall: {
        intensity: 50,
        duration: 120
      },
      pipes: [
        { diameter: 150, slope: 0.02, designFlow: 0.05, floor: 1 },
        { diameter: 150, slope: 0.02, designFlow: 0.05, floor: 2 }
      ],
      siteDrainage: [
        { length: 20, diameter: 200, slope: 0.01, flow: 0.08, manholeSpacing: 25, manholeDiameter: 600 }
      ],
      storage: {
        volume: 10,
        leakageTest: true,
        hasOverflow: true,
        manholeDiameter: 600,
        catchmentArea: 200
      },
      infiltration: {
        rate: 1.2,
        soilType: 'pasir',
        distanceFromBuilding: 5,
        groundwaterDepth: 2.0
      },
      outlet: {
        dischargeRate: 0.001,
        orificeDiameter: 50
      },
      demand: {
        toilet: 500,
        irrigation: 300,
        cleaning: 200,
        useType: 'toilet',
        hasDualPlumbing: true
      },
      supply: {
        catchmentYield: 800,
        hasBackup: true,
        storageVolume: 10,
        dryDays: 7
      },
      treatment: {
        processes: ['sedimentation', 'filtration'],
        hasFilter: true,
        hasUV: false
      }
    };
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = this.getStyles() + this.getTemplate();
    this.setupTabs();
    this.setupEvents();
    this.renderCurrentTab();
  }

  getStyles() {
    return `
      <style>
        :host { 
          display: block; 
          background: #0f172a; 
          color: #e2e8f0; 
          height: 100%; 
          overflow-y: auto;
          font-family: 'Inter', sans-serif;
        }
        .header { 
          padding: 20px; 
          background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); 
        }
        h2 { 
          margin: 0; 
          font-size: 18px; 
          font-weight: 700;
        }
        .subtitle { 
          margin-top: 4px; 
          font-size: 12px; 
          opacity: 0.9; 
        }
        
        .tabs { 
          display: flex; 
          border-bottom: 1px solid #334155; 
          background: #1e293b; 
        }
        .tab { 
          flex: 1; 
          padding: 12px; 
          text-align: center; 
          cursor: pointer;
          font-size: 11px; 
          font-weight: 600; 
          border-bottom: 3px solid transparent;
          transition: all 0.2s;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .tab:hover { 
          background: #334155; 
        }
        .tab.active { 
          border-bottom-color: #3b82f6; 
          color: #60a5fa; 
        }
        
        .content { 
          padding: 16px; 
        }
        
        .system-card { 
          background: #1e293b; 
          border: 1px solid #334155; 
          border-radius: 8px;
          margin-bottom: 16px; 
          overflow: hidden;
        }
        .system-header { 
          background: #334155; 
          padding: 12px 16px; 
          font-weight: 600;
          display: flex; 
          justify-content: space-between; 
          align-items: center;
          font-size: 13px;
        }
        .system-score { 
          color: white;
          padding: 4px 12px; 
          border-radius: 12px; 
          font-size: 11px;
          font-weight: 700;
        }
        
        .check-item { 
          padding: 12px 16px; 
          border-bottom: 1px solid #334155;
          display: grid; 
          grid-template-columns: 1fr auto 80px; 
          gap: 12px;
          align-items: center; 
          font-size: 12px;
        }
        .check-item:last-child { 
          border-bottom: none; 
        }
        
        .check-desc { 
          display: flex; 
          flex-direction: column; 
        }
        .check-title { 
          font-weight: 500; 
          margin-bottom: 2px; 
        }
        .check-detail { 
          font-size: 10px; 
          color: #94a3b8; 
        }
        .check-value { 
          text-align: right; 
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
        }
        
        .status { 
          padding: 4px 8px; 
          border-radius: 4px; 
          font-size: 10px; 
          font-weight: 700;
          text-align: center;
          text-transform: uppercase;
        }
        .status.PASS { 
          background: #10b981; 
          color: white; 
        }
        .status.FAIL { 
          background: #ef4444; 
          color: white; 
        }
        .status.WARN { 
          background: #f59e0b; 
          color: white; 
        }
        
        .input-group { 
          margin-bottom: 12px; 
        }
        label { 
          display: block; 
          font-size: 11px; 
          margin-bottom: 4px; 
          color: #94a3b8; 
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        input, select {
          width: 100%; 
          padding: 10px; 
          background: #0f172a; 
          border: 1px solid #334155;
          color: #e2e8f0; 
          border-radius: 6px; 
          font-size: 13px;
          font-family: 'Inter', sans-serif;
        }
        input:focus, select:focus {
          outline: none;
          border-color: #3b82f6;
        }
        
        .summary-card {
          background: linear-gradient(135deg, #064e3b 0%, #10b981 100%);
          padding: 20px; 
          border-radius: 12px; 
          margin: 16px;
          text-align: center;
        }
        .summary-card.PARTIAL {
          background: linear-gradient(135deg, #92400e 0%, #f59e0b 100%);
        }
        .summary-card.NON_COMPLIANT {
          background: linear-gradient(135deg, #991b1b 0%, #ef4444 100%);
        }
        .big-score { 
          font-size: 48px; 
          font-weight: 800; 
          margin: 10px 0;
          font-family: 'JetBrains Mono', monospace;
        }
        .status-text { 
          font-size: 14px; 
          text-transform: uppercase; 
          letter-spacing: 2px;
          font-weight: 600;
        }
        .score-detail {
          font-size: 11px;
          margin-top: 8px;
          opacity: 0.9;
        }
        
        button.action {
          width: calc(100% - 32px); 
          margin: 0 16px 16px; 
          padding: 14px;
          background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
          color: white; 
          border: none; 
          border-radius: 8px;
          font-weight: 600; 
          cursor: pointer;
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          transition: all 0.2s;
        }
        button.action:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
        }
        button.action:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }
        button.action.success {
          background: linear-gradient(135deg, #065f46 0%, #10b981 100%);
        }
        
        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
        }
        .checkbox-label input[type="checkbox"] {
          width: auto;
        }
        
        .info-box {
          background: rgba(59, 130, 246, 0.1);
          border: 1px solid rgba(59, 130, 246, 0.3);
          border-radius: 6px;
          padding: 12px;
          margin-bottom: 16px;
          font-size: 12px;
          color: #94a3b8;
        }
        .info-box strong {
          color: #60a5fa;
        }
      </style>
    `;
  }

  getTemplate() {
    return `
      <div class="header">
        <h2>🌧️ Evaluasi Pengelolaan Air Hujan</h2>
        <div class="subtitle">Pasal 224 ayat (11) - Sistem Drainase Bangunan Gedung</div>
      </div>

      <div class="tabs">
        <div class="tab active" data-tab="catchment">Tangkapan</div>
        <div class="tab" data-tab="conveyance">Penyaluran</div>
        <div class="tab" data-tab="treatment">Penampungan</div>
        <div class="tab" data-tab="reuse">Pemanfaatan</div>
      </div>

      <div class="content" id="tab-content">
        <!-- Dynamic content -->
      </div>

      <div class="summary-card" id="summary-card" style="display: none;">
        <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; opacity: 0.8;">Total Compliance Score</div>
        <div class="big-score" id="total-score">0%</div>
        <div class="status-text" id="overall-status">EVALUASI BELUM DILAKUKAN</div>
        <div class="score-detail" id="score-detail"></div>
      </div>

      <button class="action" id="btn-evaluate">
        <i class="fas fa-play" style="margin-right: 8px;"></i> Jalankan Evaluasi Lengkap
      </button>
      <button class="action success" id="btn-report" style="display: none;">
        <i class="fas fa-file-alt" style="margin-right: 8px;"></i> Generate Laporan
      </button>
    `;
  }

  setupTabs() {
    this.shadowRoot.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', () => {
        this.shadowRoot.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.activeTab = tab.dataset.tab;
        this.renderCurrentTab();
      });
    });
  }

  setupEvents() {
    this.shadowRoot.getElementById('btn-evaluate').addEventListener('click', () => {
      this.runEvaluation();
    });

    this.shadowRoot.getElementById('btn-report').addEventListener('click', () => {
      this.generateReport();
    });
  }

  renderCurrentTab() {
    const container = this.shadowRoot.getElementById('tab-content');

    if (this.results) {
      this.renderResultsTab(container);
    } else {
      this.renderInputsTab(container);
    }
  }

  renderInputsTab(container) {
    switch (this.activeTab) {
      case 'catchment':
        this.renderCatchmentInputs(container);
        break;
      case 'conveyance':
        this.renderConveyanceInputs(container);
        break;
      case 'treatment':
        this.renderTreatmentInputs(container);
        break;
      case 'reuse':
        this.renderReuseInputs(container);
        break;
    }
  }

  renderResultsTab(container) {
    const currentSystem = this.results?.systems?.find(s => {
      const map = {
        'catchment': 'Sistem Tangkapan',
        'conveyance': 'Sistem Penyaluran',
        'treatment': 'Penampungan & Pengolahan',
        'reuse': 'Pemanfaatan Air Hujan'
      };
      return s.category === map[this.activeTab];
    });

    if (!currentSystem) {
      container.innerHTML = '<p style="text-align:center;color:#64748b;padding:20px;">Tidak ada data untuk tab ini</p>';
      return;
    }

    const score = this.calculateSystemScore(currentSystem.items);

    container.innerHTML = `
      <div class="info-box">
        <strong>Status:</strong> Evaluasi berdasarkan SNI 2415:2016, SNI 6398:2011, dan Permen PUPR 22/PRT/M/2020
      </div>
      <div class="system-card">
        <div class="system-header">
          <span>${currentSystem.category}</span>
          <span class="system-score" style="background: ${this.getScoreColor(score)};">${score}%</span>
        </div>
        ${currentSystem.items.map(item => `
          <div class="check-item">
            <div class="check-desc">
              <div class="check-title">${item.description}</div>
              <div class="check-detail">Standar: ${item.standard}${item.note ? ' • ' + item.note : ''}</div>
            </div>
            <div class="check-value">${item.actual}<br><small style="color: #64748b">${item.value || ''}</small></div>
            <div class="status ${item.status}">${item.status}</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  renderCatchmentInputs(container) {
    container.innerHTML = `
      <div class="info-box">
        <strong>Sistem Tangkapan:</strong> Evaluasi luas efektif, material atap, talang air, dan first flush diverter.
      </div>
      <div class="input-group">
        <label>Luas Atap Tangkap (m²)</label>
        <input type="number" id="roof-area" value="${this.data.roof.area}">
      </div>
      <div class="input-group">
        <label>Material Atap</label>
        <select id="roof-material">
          <option value="metal" ${this.data.roof.material === 'metal' ? 'selected' : ''}>Metal/Galvalum</option>
          <option value="clay" ${this.data.roof.material === 'clay' ? 'selected' : ''}>Genteng Tanah Liat</option>
          <option value="concrete" ${this.data.roof.material === 'concrete' ? 'selected' : ''}>Beton</option>
          <option value="asphalt_shingle" ${this.data.roof.material === 'asphalt_shingle' ? 'selected' : ''}>Aspal Shingle</option>
          <option value="ceramic" ${this.data.roof.material === 'ceramic' ? 'selected' : ''}>Keramik</option>
        </select>
      </div>
      <div class="input-group">
        <label>Lebar Talang (mm)</label>
        <input type="number" id="gutter-width" value="${this.data.roof.gutter.width}">
      </div>
      <div class="input-group">
        <label>Tinggi Talang (mm)</label>
        <input type="number" id="gutter-height" value="${this.data.roof.gutter.height}">
      </div>
      <div class="input-group">
        <label>Volume First Flush (m³)</label>
        <input type="number" id="first-flush" value="${this.data.roof.firstFlushVolume}" step="0.1">
      </div>
      <div class="input-group">
        <label class="checkbox-label">
          <input type="checkbox" id="leaf-guard" ${this.data.roof.hasLeafGuard ? 'checked' : ''}>
          <span>Ada Leaf Guard/Saringan</span>
        </label>
      </div>
      <div class="input-group">
        <label class="checkbox-label">
          <input type="checkbox" id="rainwater-head" ${this.data.roof.hasRainwaterHead ? 'checked' : ''}>
          <span>Ada Rainwater Head</span>
        </label>
      </div>
    `;

    // Bind inputs
    const updateData = () => {
      this.data.roof.area = parseFloat(container.querySelector('#roof-area').value) || 0;
      this.data.roof.material = container.querySelector('#roof-material').value;
      this.data.roof.gutter.width = parseFloat(container.querySelector('#gutter-width').value) || 0;
      this.data.roof.gutter.height = parseFloat(container.querySelector('#gutter-height').value) || 0;
      this.data.roof.firstFlushVolume = parseFloat(container.querySelector('#first-flush').value) || 0;
      this.data.roof.hasLeafGuard = container.querySelector('#leaf-guard').checked;
      this.data.roof.hasRainwaterHead = container.querySelector('#rainwater-head').checked;
    };

    container.querySelectorAll('input, select').forEach(el => {
      el.addEventListener('change', updateData);
    });
  }

  renderConveyanceInputs(container) {
    container.innerHTML = `
      <div class="info-box">
        <strong>Sistem Penyaluran:</strong> Evaluasi pipa tegak, drainase persil, dan manhole.
      </div>
      
      <div style="margin-bottom: 16px;">
        <div style="font-size: 11px; color: #94a3b8; margin-bottom: 8px; text-transform: uppercase;">Pipa Tegak (Downspouts)</div>
        ${this.data.pipes.map((p, i) => `
          <div style="background: #334155; padding: 12px; border-radius: 6px; margin-bottom: 8px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 12px;">
              <span>Pipa Lantai ${p.floor}</span>
              <span style="color: #60a5fa;">Ø${p.diameter}mm</span>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
              <div class="input-group" style="margin: 0;">
                <label style="font-size: 10px;">Diameter (mm)</label>
                <input type="number" class="pipe-diam" data-idx="${i}" value="${p.diameter}" style="padding: 6px;">
              </div>
              <div class="input-group" style="margin: 0;">
                <label style="font-size: 10px;">Slope (%)</label>
                <input type="number" class="pipe-slope" data-idx="${i}" value="${(p.slope * 100).toFixed(1)}" step="0.1" style="padding: 6px;">
              </div>
            </div>
          </div>
        `).join('')}
      </div>
      
      <div class="input-group">
        <label>Panjang Drainase Persil (m)</label>
        <input type="number" id="drain-length" value="${this.data.siteDrainage[0]?.length || 0}">
      </div>
      <div class="input-group">
        <label>Diameter Drainase (mm)</label>
        <input type="number" id="drain-diam" value="${this.data.siteDrainage[0]?.diameter || 200}">
      </div>
      <div class="input-group">
        <label>Jarak Manhole (m)</label>
        <input type="number" id="manhole-spacing" value="${this.data.siteDrainage[0]?.manholeSpacing || 25}">
      </div>
    `;
  }

  renderTreatmentInputs(container) {
    container.innerHTML = `
      <div class="info-box">
        <strong>Penampungan & Pengolahan:</strong> Evaluasi volume tangki, kedap air, peresapan, dan overflow.
      </div>
      <div class="input-group">
        <label>Volume Tangki Penampung (m³)</label>
        <input type="number" id="tank-vol" value="${this.data.storage.volume}">
      </div>
      <div class="input-group">
        <label>Tingkat Peresapan Tanah (m/hari)</label>
        <input type="number" id="infil-rate" value="${this.data.infiltration?.rate || 0}" step="0.1">
      </div>
      <div class="input-group">
        <label>Jenis Tanah</label>
        <select id="soil-type">
          <option value="pasir" ${this.data.infiltration?.soilType === 'pasir' ? 'selected' : ''}>Pasir</option>
          <option value="lempung" ${this.data.infiltration?.soilType === 'lempung' ? 'selected' : ''}>Lempung</option>
          <option value="loam" ${this.data.infiltration?.soilType === 'loam' ? 'selected' : ''}>Loam</option>
        </select>
      </div>
      <div class="input-group">
        <label>Jarak dari Fondasi (m)</label>
        <input type="number" id="dist-found" value="${this.data.infiltration?.distanceFromBuilding || 0}">
      </div>
      <div class="input-group">
        <label>Kedalaman Muka Air Tanah (m)</label>
        <input type="number" id="gw-depth" value="${this.data.infiltration?.groundwaterDepth || 2.0}" step="0.1">
      </div>
      <div class="input-group">
        <label class="checkbox-label">
          <input type="checkbox" id="has-overflow" ${this.data.storage.hasOverflow ? 'checked' : ''}>
          <span>Sistem Overflow Tersedia</span>
        </label>
      </div>
      <div class="input-group">
        <label class="checkbox-label">
          <input type="checkbox" id="leakage-test" ${this.data.storage.leakageTest ? 'checked' : ''}>
          <span>Uji Kedap Air (Leakage Test) Lulus</span>
        </label>
      </div>
    `;
  }

  renderReuseInputs(container) {
    container.innerHTML = `
      <div class="info-box">
        <strong>Pemanfaatan Air Hujan:</strong> Evaluasi neraca air, kualitas, dan sistem piping.
      </div>
      <div class="input-group">
        <label>Kebutuhan Toilet (L/hari)</label>
        <input type="number" id="demand-toilet" value="${this.data.demand.toilet || 0}">
      </div>
      <div class="input-group">
        <label>Kebutuhan Irigasi (L/hari)</label>
        <input type="number" id="demand-irrigation" value="${this.data.demand.irrigation || 0}">
      </div>
      <div class="input-group">
        <label>Produksi Air Hujan (L/hari)</label>
        <input type="number" id="supply-yield" value="${this.data.supply.catchmentYield || 0}">
      </div>
      <div class="input-group">
        <label>Tahap Pengolahan</label>
        <select id="treatment-type">
          <option value="basic" ${!this.data.treatment.hasUV ? 'selected' : ''}>Sedimentasi + Filtrasi</option>
          <option value="advanced" ${this.data.treatment.hasUV ? 'selected' : ''}>+ Disinfeksi (UV/Klorin)</option>
          <option value="none">Tidak ada</option>
        </select>
      </div>
      <div class="input-group">
        <label class="checkbox-label">
          <input type="checkbox" id="dual-pipe" ${this.data.demand.hasDualPlumbing ? 'checked' : ''}>
          <span>Sistem Pipa Ganda (Dual Plumbing)</span>
        </label>
      </div>
      <div class="input-group">
        <label class="checkbox-label">
          <input type="checkbox" id="backup-supply" ${this.data.supply.hasBackup ? 'checked' : ''}>
          <span>Cadangan Air PDAM Tersedia</span>
        </label>
      </div>
    `;
  }

  runEvaluation() {
    // Update data from inputs first
    this.updateDataFromInputs();

    // Run evaluation
    this.results = this.evaluator.runFullEvaluation(this.data);

    // Update UI
    this.renderCurrentTab();
    this.updateSummary();

    // Show report button
    this.shadowRoot.getElementById('btn-report').style.display = 'block';

    // Dispatch event
    this.dispatchEvent(new CustomEvent('evaluation-complete', {
      detail: this.results,
      bubbles: true,
      composed: true
    }));
  }

  updateDataFromInputs() {
    const container = this.shadowRoot.getElementById('tab-content');

    // Update based on current tab
    if (this.activeTab === 'catchment') {
      this.data.roof.area = parseFloat(container.querySelector('#roof-area')?.value) || this.data.roof.area;
      this.data.roof.material = container.querySelector('#roof-material')?.value || this.data.roof.material;
      this.data.roof.gutter.width = parseFloat(container.querySelector('#gutter-width')?.value) || this.data.roof.gutter.width;
      this.data.roof.gutter.height = parseFloat(container.querySelector('#gutter-height')?.value) || this.data.roof.gutter.height;
      this.data.roof.firstFlushVolume = parseFloat(container.querySelector('#first-flush')?.value) || this.data.roof.firstFlushVolume;
      this.data.roof.hasLeafGuard = container.querySelector('#leaf-guard')?.checked ?? this.data.roof.hasLeafGuard;
      this.data.roof.hasRainwaterHead = container.querySelector('#rainwater-head')?.checked ?? this.data.roof.hasRainwaterHead;
    }
  }

  updateSummary() {
    const summary = this.results.summary;
    const scoreEl = this.shadowRoot.getElementById('total-score');
    const statusEl = this.shadowRoot.getElementById('overall-status');
    const card = this.shadowRoot.getElementById('summary-card');
    const detailEl = this.shadowRoot.getElementById('score-detail');

    scoreEl.textContent = summary.score + '%';
    statusEl.textContent = summary.status;

    // Update card color based on status
    card.className = 'summary-card ' + summary.status;

    detailEl.textContent = `${summary.passedChecks}/${summary.totalChecks} checks passed`;
    card.style.display = 'block';
  }

  calculateSystemScore(items) {
    const pass = items.filter(i => i.status === 'PASS').length;
    const warn = items.filter(i => i.status === 'WARN').length;
    const total = items.length;
    return total > 0 ? Math.round(((pass + warn * 0.5) / total) * 100) : 0;
  }

  getScoreColor(score) {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  }

  generateReport() {
    this.dispatchEvent(new CustomEvent('generate-report', {
      detail: {
        results: this.results,
        data: this.data
      },
      bubbles: true,
      composed: true
    }));
  }
}

customElements.define('compliance-pasal224-panel', CompliancePasal224Panel);
export default CompliancePasal224Panel;
