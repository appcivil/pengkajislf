import { InaRiskConnector } from '../core/InaRiskConnector.js';

export class DisasterMap extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.inarisk = new InaRiskConnector();
    this.currentHazard = null;
    this.stage = null;
    this.layer = null;
    this.gridLayer = null;
    this.buildingLayer = null;
    this.hazardLayer = null;
  }

  connectedCallback() {
    this.render();
    this.initMap();
    this.setupEvents();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host { 
          display: block; 
          width: 100%; 
          height: 100%; 
          position: relative; 
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
          overflow: hidden;
        }
        
        #map { 
          width: 100%; 
          height: 100%;
          cursor: grab;
        }
        
        #map:active {
          cursor: grabbing;
        }
        
        .controls {
          position: absolute; 
          top: 16px; 
          left: 16px;
          background: rgba(30, 41, 59, 0.95); 
          padding: 16px;
          border-radius: 12px; 
          border: 1px solid rgba(255,255,255,0.1);
          color: white; 
          z-index: 1000;
          backdrop-filter: blur(10px);
          max-width: 280px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        }
        
        .hazard-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%; 
          padding: 10px 12px; 
          margin: 4px 0;
          background: rgba(255,255,255,0.05); 
          border: 1px solid rgba(255,255,255,0.1); 
          color: white;
          border-radius: 8px; 
          cursor: pointer; 
          text-align: left;
          transition: all 0.2s;
          font-size: 13px;
        }
        
        .hazard-btn:hover { 
          background: rgba(255,255,255,0.1); 
          border-color: rgba(255,255,255,0.2);
        }
        
        .hazard-btn.active { 
          background: rgba(239, 68, 68, 0.2); 
          border-color: #ef4444;
        }
        
        .hazard-btn .icon {
          font-size: 16px;
        }
        
        .legend {
          position: absolute; 
          bottom: 16px; 
          right: 16px;
          background: rgba(15, 23, 42, 0.95); 
          padding: 16px;
          border-radius: 12px; 
          color: white; 
          font-size: 12px;
          z-index: 1000;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.1);
          min-width: 180px;
          display: none;
        }
        
        .legend.show {
          display: block;
        }
        
        .legend-item { 
          display: flex; 
          align-items: center; 
          gap: 10px; 
          margin: 6px 0; 
        }
        
        .color-box { 
          width: 24px; 
          height: 18px; 
          border-radius: 4px;
          border: 1px solid rgba(255,255,255,0.2);
        }
        
        .return-period-select {
          width: 100%;
          padding: 8px;
          background: rgba(51, 65, 85, 0.8);
          border: 1px solid rgba(71, 85, 105, 0.8);
          color: white;
          border-radius: 6px;
          margin-top: 4px;
          font-size: 12px;
        }
        
        .tooltip {
          position: absolute;
          background: rgba(0, 0, 0, 0.9);
          color: white;
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 12px;
          pointer-events: none;
          z-index: 2000;
          display: none;
          border: 1px solid rgba(255,255,255,0.2);
        }
        
        h3 {
          margin: 0 0 12px;
          color: #fbbf24;
          font-size: 14px;
          font-weight: 600;
        }
        
        h4 {
          margin: 0 0 8px;
          font-size: 12px;
          font-weight: 600;
        }
        
        .divider {
          border: none;
          border-top: 1px solid rgba(255,255,255,0.1);
          margin: 12px 0;
        }
        
        .info-panel {
          position: absolute;
          bottom: 16px;
          left: 16px;
          background: rgba(15, 23, 42, 0.95);
          padding: 12px 16px;
          border-radius: 8px;
          color: #94a3b8;
          font-size: 11px;
          z-index: 1000;
          border: 1px solid rgba(255,255,255,0.1);
        }
      </style>

      <div class="controls">
        <h3><span class="icon">🗺️</span> INARisk Hazard Map</h3>
        
        <button class="hazard-btn ${this.currentHazard === 'earthquake' ? 'active' : ''}" data-type="earthquake">
          <span class="icon">🏔️</span> Gempa Bumi (PGA)
        </button>
        <button class="hazard-btn ${this.currentHazard === 'tsunami' ? 'active' : ''}" data-type="tsunami">
          <span class="icon">🌊</span> Tsunami
        </button>
        <button class="hazard-btn ${this.currentHazard === 'flood' ? 'active' : ''}" data-type="flood">
          <span class="icon">💧</span> Banjir
        </button>
        <button class="hazard-btn ${this.currentHazard === 'landslide' ? 'active' : ''}" data-type="landslide">
          <span class="icon">⛰️</span> Tanah Longsor
        </button>
        
        <hr class="divider">
        
        <label style="font-size: 11px; color: #94a3b8; display: block; margin-bottom: 4px;">
          Periode Ulang (Tahun)
        </label>
        <select class="return-period-select" id="return-period">
          <option value="100">100 Tahun (Standar)</option>
          <option value="250">250 Tahun</option>
          <option value="500">500 Tahun</option>
          <option value="1000">1000 Tahun</option>
        </select>
      </div>

      <div class="legend" id="legend">
        <h4>Intensitas</h4>
        <div id="legend-content"></div>
      </div>
      
      <div class="info-panel" id="info-panel">
        Klik untuk melihat detail hazard
      </div>

      <div id="map"></div>
      <div class="tooltip" id="tooltip"></div>
    `;
  }

  initMap() {
    // Wait for Konva to be available
    if (typeof Konva === 'undefined') {
      setTimeout(() => this.initMap(), 100);
      return;
    }

    const container = this.shadowRoot.getElementById('map');
    
    this.stage = new Konva.Stage({
      container: container,
      width: container.clientWidth,
      height: container.clientHeight,
      draggable: true
    });

    this.gridLayer = new Konva.Layer({ name: 'grid' });
    this.buildingLayer = new Konva.Layer({ name: 'building' });
    this.hazardLayer = new Konva.Layer({ name: 'hazard' });
    
    this.stage.add(this.gridLayer);
    this.stage.add(this.hazardLayer);
    this.stage.add(this.buildingLayer);

    this.drawGrid();
    this.loadBuildingFromArchitecture();
    
    // Handle resize
    new ResizeObserver(() => {
      this.stage.width(container.clientWidth);
      this.stage.height(container.clientHeight);
      this.drawGrid();
    }).observe(container);
  }

  drawGrid() {
    this.gridLayer.destroyChildren();
    
    const width = this.stage.width();
    const height = this.stage.height();
    const gridSize = 50;
    
    for (let i = 0; i < width; i += gridSize) {
      this.gridLayer.add(new Konva.Line({
        points: [i, 0, i, height],
        stroke: 'rgba(148, 163, 184, 0.1)',
        strokeWidth: 1
      }));
    }
    
    for (let i = 0; i < height; i += gridSize) {
      this.gridLayer.add(new Konva.Line({
        points: [0, i, width, i],
        stroke: 'rgba(148, 163, 184, 0.1)',
        strokeWidth: 1
      }));
    }
    
    this.gridLayer.batchDraw();
  }

  setupEvents() {
    this.shadowRoot.querySelectorAll('.hazard-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const type = e.currentTarget.dataset.type;
        await this.loadHazardData(type);
      });
    });

    this.shadowRoot.getElementById('return-period').addEventListener('change', async (e) => {
      if (this.currentHazard) {
        await this.loadHazardData(this.currentHazard);
      }
    });
  }

  async loadHazardData(type) {
    this.shadowRoot.querySelectorAll('.hazard-btn').forEach(b => b.classList.remove('active'));
    this.shadowRoot.querySelector(`[data-type="${type}"]`)?.classList.add('active');
    
    this.currentHazard = type;
    const returnPeriod = parseInt(this.shadowRoot.getElementById('return-period').value) || 100;
    
    // Show loading state
    this.shadowRoot.getElementById('info-panel').textContent = 'Memuat data hazard...';
    
    // Fetch data
    const bounds = [95, -11, 141, 6]; // Indonesia bounds
    const data = await this.inarisk.fetchHazardData(type, bounds, returnPeriod);
    
    this.visualizeHazard(data);
    this.updateLegend(type);
    
    this.shadowRoot.getElementById('info-panel').textContent = 
      `Intensitas max: ${data.intensity.toFixed(3)} ${data.unit || ''}`;
    
    // Dispatch event
    this.dispatchEvent(new CustomEvent('hazard-loaded', {
      detail: { type, data },
      bubbles: true,
      composed: true
    }));
  }

  visualizeHazard(data) {
    this.hazardLayer.destroyChildren();
    
    const width = this.stage.width();
    const height = this.stage.height();
    
    // Scale coordinates to canvas
    const scaleX = width / (data.bounds[2] - data.bounds[0]);
    const scaleY = height / (data.bounds[3] - data.bounds[1]);
    
    // Draw hazard grid
    data.grid.forEach(cell => {
      const x = (cell.lon - data.bounds[0]) * scaleX;
      const y = height - (cell.lat - data.bounds[1]) * scaleY;
      const color = this.getHazardColor(data.type, cell.intensity);
      
      const rect = new Konva.Rect({
        x: x,
        y: y,
        width: 4,
        height: 4,
        fill: color,
        opacity: 0.7
      });
      
      rect.on('mouseover', (e) => {
        this.showTooltip(e.evt, cell, data.type);
      });
      
      rect.on('mouseout', () => {
        this.hideTooltip();
      });
      
      this.hazardLayer.add(rect);
    });
    
    this.hazardLayer.batchDraw();
    this.shadowRoot.getElementById('legend').classList.add('show');
  }

  getHazardColor(type, intensity) {
    const colors = {
      earthquake: [
        { max: 0.1, color: '#10b981' },
        { max: 0.2, color: '#34d399' },
        { max: 0.3, color: '#fbbf24' },
        { max: 0.4, color: '#f59e0b' },
        { max: 0.5, color: '#ef4444' },
        { max: 1.0, color: '#dc2626' }
      ],
      tsunami: [
        { max: 3, color: '#10b981' },
        { max: 8, color: '#fbbf24' },
        { max: 15, color: '#ef4444' },
        { max: 100, color: '#dc2626' }
      ],
      flood: [
        { max: 0.5, color: '#10b981' },
        { max: 1.5, color: '#fbbf24' },
        { max: 3, color: '#ef4444' },
        { max: 100, color: '#dc2626' }
      ],
      landslide: [
        { max: 0.3, color: '#10b981' },
        { max: 0.5, color: '#fbbf24' },
        { max: 0.7, color: '#ef4444' },
        { max: 1.0, color: '#dc2626' }
      ]
    };
    
    const typeColors = colors[type] || colors.earthquake;
    for (const item of typeColors) {
      if (intensity <= item.max) return item.color;
    }
    return typeColors[typeColors.length - 1].color;
  }

  updateLegend(type) {
    const legend = this.shadowRoot.getElementById('legend');
    const content = this.shadowRoot.getElementById('legend-content');
    
    const legends = {
      earthquake: [
        { color: '#10b981', label: '< 0.1 g (Rendah)' },
        { color: '#fbbf24', label: '0.1 - 0.3 g (Sedang)' },
        { color: '#ef4444', label: '0.3 - 0.5 g (Tinggi)' },
        { color: '#dc2626', label: '> 0.5 g (Ekstrem)' }
      ],
      tsunami: [
        { color: '#10b981', label: '< 3 m' },
        { color: '#fbbf24', label: '3 - 8 m' },
        { color: '#ef4444', label: '8 - 15 m' },
        { color: '#dc2626', label: '> 15 m' }
      ],
      flood: [
        { color: '#10b981', label: '< 0.5 m' },
        { color: '#fbbf24', label: '0.5 - 1.5 m' },
        { color: '#ef4444', label: '1.5 - 3 m' },
        { color: '#dc2626', label: '> 3 m' }
      ],
      landslide: [
        { color: '#10b981', label: 'Rendah' },
        { color: '#fbbf24', label: 'Sedang' },
        { color: '#ef4444', label: 'Tinggi' },
        { color: '#dc2626', label: 'Ekstrem' }
      ]
    };
    
    content.innerHTML = (legends[type] || legends.earthquake).map(item => `
      <div class="legend-item">
        <div class="color-box" style="background: ${item.color}"></div>
        <span>${item.label}</span>
      </div>
    `).join('');
  }

  showTooltip(evt, cell, type) {
    const tooltip = this.shadowRoot.getElementById('tooltip');
    const units = { earthquake: 'g', tsunami: 'm', flood: 'm', landslide: '' };
    
    tooltip.innerHTML = `
      <div><strong>Intensitas:</strong> ${cell.intensity.toFixed(3)} ${units[type]}</div>
      <div><strong>Lat:</strong> ${cell.lat.toFixed(4)}</div>
      <div><strong>Lon:</strong> ${cell.lon.toFixed(4)}</div>
      <div><strong>Risk Score:</strong> ${(cell.riskScore * 100).toFixed(1)}%</div>
    `;
    
    tooltip.style.left = evt.pageX + 10 + 'px';
    tooltip.style.top = evt.pageY - 30 + 'px';
    tooltip.style.display = 'block';
  }

  hideTooltip() {
    this.shadowRoot.getElementById('tooltip').style.display = 'none';
  }

  loadBuildingFromArchitecture() {
    // Load from appState if available
    const floorPlans = window.appState?.state?.floorPlans;
    if (!floorPlans || !floorPlans.length) return;

    const width = this.stage.width();
    const height = this.stage.height();
    const centerX = width / 2;
    const centerY = height / 2;
    
    floorPlans.forEach((floor, i) => {
      if (!floor.points || !floor.points.length) return;
      
      // Scale and center building
      const points = floor.points.map(p => [
        centerX + (p.x - 500) / 10,
        centerY + (p.y - 500) / 10
      ]).flat();
      
      const building = new Konva.Line({
        points: points,
        closed: true,
        fill: 'rgba(59, 130, 246, 0.2)',
        stroke: '#3b82f6',
        strokeWidth: 2
      });
      
      building.on('click', () => {
        this.dispatchEvent(new CustomEvent('building-selected', {
          detail: { floorIndex: i, data: floor },
          bubbles: true,
          composed: true
        }));
      });
      
      this.buildingLayer.add(building);
    });
    
    this.buildingLayer.batchDraw();
  }
}

customElements.define('disaster-map', DisasterMap);
export default DisasterMap;
