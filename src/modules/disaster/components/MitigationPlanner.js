import { MitigationOptimizer } from '../core/MitigationOptimizer.js';

export class MitigationPlanner extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.optimizer = new MitigationOptimizer();
    this.selectedMeasures = [];
    this.budget = 5000000000; // 5 M default
  }

  connectedCallback() {
    this.render();
    this.setupEvents();
    this.calculateOptimization();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host { 
          display: block; 
          background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%); 
          color: white; 
          padding: 20px; 
          height: 100%; 
          overflow-y: auto;
        }
        h2 { color: #10b981; margin: 0 0 16px; font-size: 16px; }
        .budget-input {
          background: rgba(255,255,255,0.05); padding: 12px; border-radius: 8px;
          margin-bottom: 16px;
        }
        label { display: block; font-size: 11px; color: #94a3b8; margin-bottom: 4px; }
        input[type="range"] { width: 100%; margin: 8px 0; }
        .budget-value { font-size: 18px; font-weight: 600; color: #10b981; }
        .measure-card {
          background: rgba(255,255,255,0.05); padding: 14px; border-radius: 8px;
          margin-bottom: 10px; border-left: 4px solid #10b981;
          transition: all 0.2s;
        }
        .measure-card:hover { background: rgba(255,255,255,0.08); }
        .measure-card.selected {
          background: rgba(16, 185, 129, 0.15);
          border-left-color: #34d399;
        }
        .measure-header {
          display: flex; justify-content: space-between; align-items: flex-start;
        }
        .measure-name { font-size: 13px; font-weight: 600; }
        .measure-category {
          font-size: 10px; color: #94a3b8; text-transform: uppercase;
          margin-top: 2px;
        }
        .measure-cost { font-size: 12px; color: #fbbf24; }
        .efficiency-bar {
          height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px;
          margin-top: 10px; overflow: hidden;
        }
        .efficiency-fill {
          height: 100%; background: linear-gradient(90deg, #10b981, #34d399);
          border-radius: 3px;
        }
        .measure-stats {
          display: flex; gap: 16px; margin-top: 8px;
          font-size: 11px; color: #94a3b8;
        }
        .summary-box {
          background: linear-gradient(135deg, rgba(16,185,129,0.2), rgba(16,185,129,0.05));
          padding: 16px; border-radius: 8px; border: 1px solid #10b981;
          margin-top: 16px;
        }
        .summary-title { font-size: 11px; color: #94a3b8; }
        .summary-value { font-size: 22px; font-weight: 700; color: #10b981; margin: 4px 0; }
        .btn-optimize {
          width: 100%; padding: 12px; background: #10b981; color: white;
          border: none; border-radius: 8px; font-weight: 600; cursor: pointer;
          margin-top: 12px;
        }
        .btn-optimize:hover { background: #34d399; }
        .checkbox {
          width: 18px; height: 18px; accent-color: #10b981;
        }
      </style>

      <h2>🛡️ Perencanaan Mitigasi</h2>
      
      <div class="budget-input">
        <label>Anggaran Mitigasi</label>
        <div class="budget-value" id="budget-display">Rp 5.0 Miliar</div>
        <input type="range" id="budget-slider" min="1000000000" max="50000000000" 
               step="1000000000" value="5000000000">
      </div>

      <div id="measures-list"></div>

      <div class="summary-box">
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">
          <div>
            <div class="summary-title">Total Investasi</div>
            <div class="summary-value" id="total-cost">Rp 0</div>
          </div>
          <div>
            <div class="summary-title">Pengurangan Risiko</div>
            <div class="summary-value" id="risk-reduction">0%</div>
          </div>
        </div>
        <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(16,185,129,0.3);">
          <div class="summary-title">Benefit-Cost Ratio</div>
          <div style="font-size: 18px; font-weight: 600; color: #34d399;" id="bcr">-</div>
        </div>
      </div>

      <button class="btn-optimize" id="btn-optimize">🔄 Optimasi Otomatis</button>
    `;
  }

  setupEvents() {
    const slider = this.shadowRoot.getElementById('budget-slider');
    const display = this.shadowRoot.getElementById('budget-display');
    
    slider.addEventListener('input', (e) => {
      this.budget = parseInt(e.target.value);
      display.textContent = `Rp ${(this.budget / 1000000000).toFixed(1)} Miliar`;
      this.calculateOptimization();
    });

    this.shadowRoot.getElementById('btn-optimize').addEventListener('click', () => {
      this.autoOptimize();
    });
  }

  calculateOptimization() {
    const allMeasures = [
      ...this.optimizer.mitigationMeasures.structural,
      ...this.optimizer.mitigationMeasures.nonStructural
    ];

    const area = 1000; // Default 1000 m²

    const measuresWithCost = allMeasures.map(m => ({
      ...m,
      totalCost: this.optimizer.calculateTotalCost(m, area),
      effectiveness: m.effectiveness.earthquake || m.effectiveness.all || 0
    }));

    this.renderMeasures(measuresWithCost);
  }

  renderMeasures(measures) {
    const container = this.shadowRoot.getElementById('measures-list');
    
    container.innerHTML = measures.map(m => `
      <div class="measure-card ${this.selectedMeasures.includes(m.id) ? 'selected' : ''}" 
           data-id="${m.id}">
        <div class="measure-header">
          <div>
            <div class="measure-name">${m.name}</div>
            <div class="measure-category">${m.category}</div>
          </div>
          <input type="checkbox" class="checkbox" ${this.selectedMeasures.includes(m.id) ? 'checked' : ''}>
        </div>
        <div class="measure-stats">
          <span>💰 Rp ${(m.totalCost / 1000000000).toFixed(2)} M</span>
          <span>⚡ ${(m.effectiveness * 100).toFixed(0)}% efektif</span>
          <span>📅 ${m.lifespan} tahun</span>
        </div>
        <div class="efficiency-bar">
          <div class="efficiency-fill" style="width: ${m.effectiveness * 100}%"></div>
        </div>
      </div>
    `).join('');

    // Add click handlers
    container.querySelectorAll('.measure-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.type !== 'checkbox') {
          const checkbox = card.querySelector('.checkbox');
          checkbox.checked = !checkbox.checked;
        }
        
        const id = card.dataset.id;
        if (this.selectedMeasures.includes(id)) {
          this.selectedMeasures = this.selectedMeasures.filter(m => m !== id);
          card.classList.remove('selected');
        } else {
          this.selectedMeasures.push(id);
          card.classList.add('selected');
        }
        
        this.updateSummary();
      });
    });

    this.updateSummary();
  }

  updateSummary() {
    const allMeasures = [
      ...this.optimizer.mitigationMeasures.structural,
      ...this.optimizer.mitigationMeasures.nonStructural
    ];

    let totalCost = 0;
    let totalEffectiveness = 0;

    this.selectedMeasures.forEach(id => {
      const measure = allMeasures.find(m => m.id === id);
      if (measure) {
        totalCost += this.optimizer.calculateTotalCost(measure, 1000);
        totalEffectiveness += measure.effectiveness.earthquake || measure.effectiveness.all || 0;
      }
    });

    this.shadowRoot.getElementById('total-cost').textContent = 
      `Rp ${(totalCost / 1000000000).toFixed(2)} M`;
    this.shadowRoot.getElementById('risk-reduction').textContent = 
      `${Math.min(totalEffectiveness * 100, 95).toFixed(0)}%`;
    
    const bcr = totalCost > 0 ? (totalEffectiveness * 30 * 500000000) / totalCost : 0;
    this.shadowRoot.getElementById('bcr').textContent = bcr.toFixed(2);
  }

  autoOptimize() {
    // Select best measures within budget
    const allMeasures = [
      ...this.optimizer.mitigationMeasures.structural,
      ...this.optimizer.mitigationMeasures.nonStructural
    ];

    const area = 1000;
    const measuresWithBCR = allMeasures.map(m => {
      const cost = this.optimizer.calculateTotalCost(m, area);
      const benefit = (m.effectiveness.earthquake || 0) * 30 * 500000000; // 30 year benefit
      return { ...m, totalCost: cost, bcr: benefit / cost };
    });

    // Sort by BCR
    measuresWithBCR.sort((a, b) => b.bcr - a.bcr);

    this.selectedMeasures = [];
    let remaining = this.budget;

    for (const m of measuresWithBCR) {
      if (m.totalCost <= remaining && m.bcr > 1) {
        this.selectedMeasures.push(m.id);
        remaining -= m.totalCost;
      }
    }

    this.calculateOptimization();
  }
}

customElements.define('mitigation-planner', MitigationPlanner);
export default MitigationPlanner;
