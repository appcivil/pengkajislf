/**
 * ArchViewport.js - Main Architectural Viewport Component
 * Web Component dengan 3D rendering dan UI overlay
 */

import { Renderer3D } from './Renderer3D.js';
import { archState } from './StateManager.js';
import { Pasal218Engine } from './Pasal218Engine.js';

export class ArchViewport extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.engine = new Pasal218Engine();
    this.renderer = null;
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <style>
        :host { 
          display: block; 
          width: 100%; 
          height: 600px; 
          position: relative; 
          overflow: hidden;
          border-radius: 12px;
        }
        #canvas-container { 
          width: 100%; 
          height: 100%;
          background: #0a0a0a;
        }
        .ui-overlay {
          position: absolute; 
          top: 16px; 
          left: 16px; 
          right: 16px;
          pointer-events: none; 
          display: flex; 
          justify-content: space-between;
          gap: 16px;
        }
        .panel {
          background: rgba(20, 20, 25, 0.85); 
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.08); 
          border-radius: 12px;
          padding: 16px; 
          pointer-events: all; 
          color: #fff;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
          min-width: 200px;
        }
        .panel h3 {
          margin: 0 0 12px 0;
          font-size: 14px;
          font-weight: 600;
          color: #e5e5e5;
        }
        .panel h4 {
          margin: 0 0 10px 0;
          font-size: 12px;
          font-weight: 500;
          color: #a3a3a3;
        }
        .compliance-badge {
          display: inline-flex; 
          align-items: center; 
          gap: 8px;
          padding: 8px 14px; 
          border-radius: 20px; 
          font-weight: 600;
          font-size: 13px;
        }
        .compliant { 
          background: linear-gradient(135deg, #10b981, #059669); 
          color: #fff; 
        }
        .partial { 
          background: linear-gradient(135deg, #f59e0b, #d97706); 
          color: #fff; 
        }
        .non-compliant { 
          background: linear-gradient(135deg, #ef4444, #dc2626); 
          color: #fff; 
        }
        .pending {
          background: linear-gradient(135deg, #6b7280, #4b5563);
          color: #fff;
        }
        .toolbar {
          position: absolute; 
          bottom: 20px; 
          left: 50%; 
          transform: translateX(-50%);
          display: flex; 
          gap: 8px; 
          background: rgba(20, 20, 25, 0.9);
          padding: 10px; 
          border-radius: 14px; 
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        }
        .toolbar button {
          background: transparent; 
          border: none; 
          color: #a3a3a3;
          padding: 10px 16px; 
          border-radius: 10px; 
          cursor: pointer;
          transition: all 0.2s; 
          display: flex; 
          align-items: center; 
          gap: 6px;
          font-size: 12px;
          font-weight: 500;
        }
        .toolbar button:hover { 
          background: rgba(255, 255, 255, 0.06); 
          color: #e5e5e5;
        }
        .toolbar button.active { 
          background: linear-gradient(135deg, #3b82f6, #2563eb); 
          color: #fff;
        }
        .toolbar button.active:hover {
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
        }
        .checklist-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 0;
          font-size: 11px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
        .checklist-item:last-child {
          border-bottom: none;
        }
        .check-icon {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
        }
        .check-pass {
          background: rgba(16, 185, 129, 0.2);
          color: #10b981;
        }
        .check-fail {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
        }
        .mode-indicator {
          font-size: 11px;
          color: #737373;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
          margin-top: 10px;
        }
        .stat-box {
          background: rgba(255, 255, 255, 0.03);
          padding: 8px;
          border-radius: 8px;
          text-align: center;
        }
        .stat-value {
          font-size: 16px;
          font-weight: 700;
          color: #3b82f6;
        }
        .stat-label {
          font-size: 9px;
          color: #737373;
          text-transform: uppercase;
        }
      </style>

      <div id="canvas-container"></div>
      
      <div class="ui-overlay">
        <div class="panel">
          <h3>🏛️ ArchSim Pro</h3>
          <div id="compliance-display">
            <span class="compliance-badge pending">
              ⏳ Evaluasi Belum Dilakukan
            </span>
          </div>
          <div class="mode-indicator" style="margin-top: 10px;">
            Mode: <span id="mode-display">3D View</span>
          </div>
          <div class="stats-grid">
            <div class="stat-box">
              <div class="stat-value" id="pass-count">-</div>
              <div class="stat-label">Passed</div>
            </div>
            <div class="stat-box">
              <div class="stat-value" id="fail-count">-</div>
              <div class="stat-label">Failed</div>
            </div>
          </div>
        </div>
        
        <div class="panel" style="width: 260px; max-height: 350px; overflow-y: auto;">
          <h4>📋 Evaluasi Pasal 218</h4>
          <div id="checklist-container">
            <div style="font-size: 12px; color: #737373; text-align: center; padding: 20px;">
              Klik "Evaluate" untuk melakukan evaluasi compliance
            </div>
          </div>
        </div>
      </div>

      <div class="toolbar">
        <button id="btn-3d" class="active">
          <span>3D</span>
        </button>
        <button id="btn-2d">
          <span>2D Plan</span>
        </button>
        <button id="btn-section">
          <span>Section</span>
        </button>
        <button id="btn-sun">☀️ Sun</button>
        <button id="btn-shadows">🌑 Shadows</button>
        <button id="btn-eval">✓ Evaluate</button>
      </div>
    `;

    this.init3D();
    this.setupUI();
    this.setupStoreListeners();
  }

  init3D() {
    const container = this.shadowRoot.getElementById('canvas-container');
    this.renderer = new Renderer3D(container);
    
    // Default sun position
    this.renderer.updateSunPosition(45, 30);
  }

  setupUI() {
    // Toolbar actions
    this.shadowRoot.getElementById('btn-3d').addEventListener('click', () => {
      archState.setState({ mode: '3d' });
      this.updateToolbar('btn-3d');
      this.updateModeDisplay('3D View');
    });

    this.shadowRoot.getElementById('btn-2d').addEventListener('click', () => {
      archState.setState({ mode: '2d' });
      this.updateToolbar('btn-2d');
      this.updateModeDisplay('2D Plan View');
    });

    this.shadowRoot.getElementById('btn-section').addEventListener('click', () => {
      archState.setState({ mode: 'section' });
      this.updateToolbar('btn-section');
      this.updateModeDisplay('Section View');
    });

    this.shadowRoot.getElementById('btn-sun').addEventListener('click', () => {
      const current = archState.state.sunPosition;
      const newAzimuth = (current.azimuth + 30) % 360;
      archState.setState({ 
        sunPosition: { ...current, azimuth: newAzimuth }
      });
      this.renderer.updateSunPosition(newAzimuth, current.elevation);
    });

    this.shadowRoot.getElementById('btn-shadows').addEventListener('click', (e) => {
      const enabled = !archState.state.shadows;
      archState.setState({ shadows: enabled });
      this.renderer.toggleShadows(enabled);
      e.target.classList.toggle('active', enabled);
    });

    this.shadowRoot.getElementById('btn-eval').addEventListener('click', () => {
      const projectData = archState.state.project || this.getSampleData();
      const result = this.engine.evaluate(projectData);
      this.updateComplianceUI(result);
      this.updateChecklistUI(result);
    });

    // Initial button state
    this.shadowRoot.getElementById('btn-shadows').classList.add('active');
  }

  updateToolbar(activeId) {
    this.shadowRoot.querySelectorAll('.toolbar button').forEach(btn => {
      btn.classList.toggle('active', btn.id === activeId);
    });
  }

  updateModeDisplay(text) {
    this.shadowRoot.getElementById('mode-display').textContent = text;
  }

  updateComplianceUI(compliance) {
    const display = this.shadowRoot.getElementById('compliance-display');
    const status = compliance.status || 'PENDING';
    const badgeClass = status === 'COMPLIANT' ? 'compliant' : 
                      status === 'PARTIAL_COMPLIANT' ? 'partial' : 
                      status === 'PENDING' ? 'pending' : 'non-compliant';
    
    const icon = status === 'COMPLIANT' ? '✓' : 
                 status === 'PARTIAL_COMPLIANT' ? '◐' : 
                 status === 'PENDING' ? '⏳' : '✕';
    
    const label = status === 'COMPLIANT' ? 'Sesuai Pasal 218' :
                  status === 'PARTIAL_COMPLIANT' ? 'Sebagian Sesuai' :
                  status === 'PENDING' ? 'Evaluasi Belum Dilakukan' : 'Tidak Sesuai';

    display.innerHTML = `
      <span class="compliance-badge ${badgeClass}">
        ${icon} ${label} (${compliance.score || 0}%)
      </span>
    `;

    // Update stats
    this.shadowRoot.getElementById('pass-count').textContent = compliance.passedCount || 0;
    this.shadowRoot.getElementById('fail-count').textContent = compliance.failedCount || 0;
  }

  updateChecklistUI(compliance) {
    const container = this.shadowRoot.getElementById('checklist-container');
    
    if (!compliance.details || Object.keys(compliance.details).length === 0) {
      container.innerHTML = `
        <div style="font-size: 12px; color: #737373; text-align: center; padding: 20px;">
          Tidak ada data evaluasi
        </div>
      `;
      return;
    }

    let html = '';
    Object.entries(compliance.details).forEach(([category, data]) => {
      const catScore = ((data.score / data.maxScore) * 100).toFixed(0);
      const catColor = catScore >= 70 ? '#10b981' : catScore >= 50 ? '#f59e0b' : '#ef4444';
      
      html += `
        <div style="margin-bottom: 12px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <span style="font-size: 11px; font-weight: 600; color: #d4d4d4;">${data.title}</span>
            <span style="font-size: 10px; color: ${catColor};">${catScore}%</span>
          </div>
      `;
      
      Object.entries(data.items).forEach(([itemId, item]) => {
        const icon = item.passed ? '✓' : '✕';
        const iconClass = item.passed ? 'check-pass' : 'check-fail';
        
        html += `
          <div class="checklist-item">
            <span class="check-icon ${iconClass}">${icon}</span>
            <span style="color: ${item.passed ? '#a3a3a3' : '#fca5a5'};">${item.label}</span>
          </div>
        `;
      });
      
      html += `</div>`;
    });

    container.innerHTML = html;
  }

  setupStoreListeners() {
    archState.subscribe('compliance', (comp) => {
      this.updateComplianceUI(comp);
      this.updateChecklistUI(comp);
    });

    archState.subscribe('floorPlans', (plans) => {
      if (this.renderer && plans.length > 0) {
        this.renderer.createBuilding(plans);
      }
    });

    archState.subscribe('sunPosition', (pos) => {
      if (this.renderer) {
        this.renderer.updateSunPosition(pos.azimuth, pos.elevation);
      }
    });
  }

  getSampleData() {
    return {
      shape: 'regular',
      floorEfficiency: 0.75,
      facadeRatio: 0.45,
      roofType: 'pelana',
      materials: ['beton', 'kaca', 'baja'],
      hasFence: true,
      fenceHeight: 1.5,
      cladding: 'composite',
      mainRooms: 4,
      wallHeight: 2.9,
      partitions: ['gypsum', 'bata'],
      openingRatio: 0.25,
      ceilingHeight: 2.7,
      groundFloorHeight: 0.8,
      roofSpace: 0.8,
      floorFinish: 'granit',
      ceilingFinish: 'gypsum',
      siteLevel: 1.2,
      openSpaceRatio: 0.35,
      setback: 4,
      greenArea: 50,
      greenAreaRatio: 0.15,
      landscaping: ['pohon', 'semak', 'rumput'],
      pavement: 'paving',
      pavementArea: 30,
      hasCirculation: true,
      circulationWidth: 2.5,
      pedestrianPath: true,
      pedestrianWidth: 1.5,
      streetFurniture: ['bench', 'lampu'],
      signage: true,
      outdoorLighting: true,
      luxLevel: 10
    };
  }

  disconnectedCallback() {
    if (this.renderer) {
      this.renderer.dispose();
    }
  }
}

// Define custom element
customElements.define('arch-viewport', ArchViewport);

export default { ArchViewport };
