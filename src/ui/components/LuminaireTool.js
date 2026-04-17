import { IESLoader } from '../../engine/lighting/IESLoader.js';

/**
 * LuminaireTool - Light Fixture Management Component
 * Web Component for managing luminaires in the scene
 */

export class LuminaireTool extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.luminaires = [];
    this.selectedLuminaire = null;
    this.iesLibrary = [];
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
        h3 { 
          margin: 0 0 12px 0; 
          color: #60a5fa; 
          font-size: 11px; 
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-weight: 600;
        }
        .upload-area {
          border: 2px dashed rgba(59, 130, 246, 0.4);
          border-radius: 8px;
          padding: 20px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s;
          background: rgba(59, 130, 246, 0.05);
        }
        .upload-area:hover {
          border-color: #3b82f6;
          background: rgba(59, 130, 246, 0.1);
        }
        .upload-area.dragover {
          border-color: #10b981;
          background: rgba(16, 185, 129, 0.1);
        }
        .upload-icon {
          font-size: 24px;
          margin-bottom: 8px;
        }
        .upload-text {
          font-size: 12px;
          color: #94a3b8;
        }
        .upload-hint {
          font-size: 10px;
          color: #64748b;
          margin-top: 4px;
        }
        input[type="file"] {
          display: none;
        }
        .luminaire-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .luminaire-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px;
          background: rgba(30, 41, 59, 0.6);
          border: 1px solid rgba(59, 130, 246, 0.2);
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .luminaire-item:hover {
          border-color: rgba(59, 130, 246, 0.4);
          background: rgba(30, 41, 59, 0.8);
        }
        .luminaire-item.selected {
          border-color: #3b82f6;
          background: rgba(59, 130, 246, 0.15);
        }
        .luminaire-icon {
          width: 32px;
          height: 32px;
          background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
        }
        .luminaire-info {
          flex: 1;
        }
        .luminaire-name {
          font-size: 12px;
          font-weight: 500;
          color: #f1f5f9;
        }
        .luminaire-specs {
          font-size: 10px;
          color: #94a3b8;
        }
        .luminaire-actions {
          display: flex;
          gap: 4px;
        }
        .btn-icon {
          width: 24px;
          height: 24px;
          border: none;
          background: transparent;
          color: #94a3b8;
          cursor: pointer;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          transition: all 0.2s;
        }
        .btn-icon:hover {
          background: rgba(239, 68, 68, 0.2);
          color: #f87171;
        }
        .properties-form {
          display: grid;
          gap: 10px;
        }
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .form-group.full-width {
          grid-column: 1 / -1;
        }
        label {
          font-size: 10px;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }
        input, select {
          padding: 6px 8px;
          background: rgba(30, 41, 59, 0.8);
          border: 1px solid rgba(59, 130, 246, 0.3);
          color: #f1f5f9;
          border-radius: 4px;
          font-size: 12px;
        }
        input:focus, select:focus {
          outline: none;
          border-color: #3b82f6;
        }
        .action-buttons {
          display: flex;
          gap: 8px;
          margin-top: 12px;
        }
        .btn {
          flex: 1;
          padding: 8px 12px;
          border: none;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-primary {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: white;
        }
        .btn-primary:hover {
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
        }
        .btn-secondary {
          background: rgba(59, 130, 246, 0.15);
          border: 1px solid rgba(59, 130, 246, 0.4);
          color: #60a5fa;
        }
        .btn-secondary:hover {
          background: rgba(59, 130, 246, 0.25);
        }
        .empty-state {
          text-align: center;
          padding: 24px;
          color: #64748b;
          font-size: 12px;
        }
        .empty-icon {
          font-size: 32px;
          margin-bottom: 8px;
          opacity: 0.5;
        }
        .preset-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }
        .preset-btn {
          padding: 10px;
          background: rgba(30, 41, 59, 0.6);
          border: 1px solid rgba(59, 130, 246, 0.2);
          border-radius: 6px;
          color: #f1f5f9;
          font-size: 11px;
          cursor: pointer;
          transition: all 0.2s;
          text-align: center;
        }
        .preset-btn:hover {
          border-color: #3b82f6;
          background: rgba(59, 130, 246, 0.15);
        }
        .stats-bar {
          display: flex;
          gap: 16px;
          padding: 10px 0;
          font-size: 11px;
        }
        .stat {
          display: flex;
          align-items: center;
          gap: 4px;
          color: #94a3b8;
        }
        .stat-value {
          color: #34d399;
          font-weight: 600;
        }
      </style>

      <div class="section">
        <h3>💡 Quick Add</h3>
        <div class="preset-grid">
          <button class="preset-btn" data-preset="led-panel">
            ⬜ LED Panel
          </button>
          <button class="preset-btn" data-preset="downlight">
            🔘 Downlight
          </button>
          <button class="preset-btn" data-preset="spotlight">
            🔦 Spotlight
          </button>
          <button class="preset-btn" data-preset="tube">
            📊 Tube Light
          </button>
        </div>
      </div>

      <div class="section">
        <h3>📤 Import IES File</h3>
        <div class="upload-area" id="upload-area">
          <div class="upload-icon">📄</div>
          <div class="upload-text">Click or drag IES file here</div>
          <div class="upload-hint">IESNA LM-63 format supported</div>
        </div>
        <input type="file" id="ies-file" accept=".ies,.IES" />
      </div>

      <div class="section">
        <h3>💡 Luminaires (<span id="lum-count">0</span>)</h3>
        <div class="stats-bar">
          <div class="stat">
            💪 <span class="stat-value" id="total-wattage">0</span> W
          </div>
          <div class="stat">
            💡 <span class="stat-value" id="total-lumens">0</span> lm
          </div>
        </div>
        <div class="luminaire-list" id="luminaire-list">
          <div class="empty-state">
            <div class="empty-icon">💡</div>
            No luminaires added yet
          </div>
        </div>
      </div>

      <div class="section" id="properties-section" style="display: none;">
        <h3>⚙️ Properties</h3>
        <div class="properties-form">
          <div class="form-group full-width">
            <label>Name</label>
            <input type="text" id="prop-name" placeholder="Luminaire name">
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>X Position (m)</label>
              <input type="number" id="prop-x" step="0.1">
            </div>
            <div class="form-group">
              <label>Z Position (m)</label>
              <input type="number" id="prop-z" step="0.1">
            </div>
          </div>
          <div class="form-group">
            <label>Mounting Height (m)</label>
            <input type="number" id="prop-y" step="0.1" value="2.8">
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Rotation Y (°)</label>
              <input type="number" id="prop-rot-y" step="1" value="0">
            </div>
            <div class="form-group">
              <label>Tilt X (°)</label>
              <input type="number" id="prop-rot-x" step="1" value="0">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Intensity (lm)</label>
              <input type="number" id="prop-intensity" step="100" value="1000">
            </div>
            <div class="form-group">
              <label>Wattage (W)</label>
              <input type="number" id="prop-wattage" step="1" value="36">
            </div>
          </div>
        </div>
        <div class="action-buttons">
          <button class="btn btn-primary" id="btn-update">Update</button>
          <button class="btn btn-secondary" id="btn-duplicate">Duplicate</button>
        </div>
      </div>
    `;

    this.setupEvents();
  }

  setupEvents() {
    // File upload
    const uploadArea = this.shadowRoot.getElementById('upload-area');
    const fileInput = this.shadowRoot.getElementById('ies-file');

    uploadArea.addEventListener('click', () => fileInput.click());
    
    uploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadArea.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', () => {
      uploadArea.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadArea.classList.remove('dragover');
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        this.handleIESUpload(files[0]);
      }
    });

    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        this.handleIESUpload(e.target.files[0]);
      }
    });

    // Preset buttons
    this.shadowRoot.querySelectorAll('.preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.addPresetLuminaire(btn.dataset.preset);
      });
    });

    // Property controls
    this.shadowRoot.getElementById('btn-update').addEventListener('click', () => {
      this.updateSelectedLuminaire();
    });

    this.shadowRoot.getElementById('btn-duplicate').addEventListener('click', () => {
      this.duplicateSelectedLuminaire();
    });

    // Input change handlers for real-time updates
    ['prop-x', 'prop-y', 'prop-z', 'prop-rot-x', 'prop-rot-y'].forEach(id => {
      this.shadowRoot.getElementById(id).addEventListener('input', () => {
        this.liveUpdatePosition();
      });
    });
  }

  async handleIESUpload(file) {
    try {
      const iesData = await IESLoader.parse(file);
      
      const luminaire = {
        id: `ies-${Date.now()}`,
        name: file.name.replace('.ies', '').replace('.IES', ''),
        iesData: iesData,
        type: 'custom',
        intensity: iesData.lampData.lumens || 1000,
        wattage: iesData.inputWatts || 36
      };

      this.iesLibrary.push(luminaire);
      this.dispatchEvent(new CustomEvent('ies-loaded', {
        detail: { luminaire },
        bubbles: true,
        composed: true
      }));

      this.showNotification(`IES file loaded: ${luminaire.name}`);
    } catch (err) {
      console.error('Failed to parse IES file:', err);
      this.showNotification('Failed to parse IES file', 'error');
    }
  }

  addPresetLuminaire(preset) {
    const presets = {
      'led-panel': {
        name: 'LED Panel 600x600',
        intensity: 3600,
        wattage: 36,
        distribution: 'lambertian'
      },
      'downlight': {
        name: 'LED Downlight',
        intensity: 1000,
        wattage: 12,
        distribution: 'cosine'
      },
      'spotlight': {
        name: 'LED Spotlight',
        intensity: 800,
        wattage: 10,
        distribution: 'narrow'
      },
      'tube': {
        name: 'LED Tube 1200mm',
        intensity: 2400,
        wattage: 20,
        distribution: 'linear'
      }
    };

    const config = presets[preset];
    if (!config) return;

    const luminaire = {
      id: `preset-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name: config.name,
      type: preset,
      intensity: config.intensity,
      wattage: config.wattage,
      iesData: this.createDefaultIES(config.intensity, config.distribution)
    };

    this.dispatchEvent(new CustomEvent('add-luminaire', {
      detail: { luminaire },
      bubbles: true,
      composed: true
    }));
  }

  createDefaultIES(lumens, distribution) {
    // Create a simplified IES-like data structure for presets
    const numVertical = 37; // 0-180 degrees in 5 degree steps
    const numHorizontal = 1; // Symmetric
    
    const verticalAngles = [];
    const candela = [];
    
    for (let i = 0; i < numVertical; i++) {
      verticalAngles.push(i * 5);
      
      let factor;
      switch(distribution) {
        case 'narrow':
          factor = Math.exp(-Math.pow((i - 0) / 10, 2));
          break;
        case 'linear':
          factor = Math.cos(i * 5 * Math.PI / 180);
          break;
        case 'lambertian':
        default:
          factor = Math.pow(Math.cos(i * 5 * Math.PI / 180), 2);
      }
      
      candela.push([lumens * factor / (2 * Math.PI)]);
    }

    return {
      version: 'IESNA:LM-63-2002',
      keywords: { MANUFAC: 'Generic', LAMPTYPE: 'LED' },
      tiltData: { type: 'NONE' },
      lampData: {
        count: 1,
        lumens: lumens,
        multiplyingFactor: 1,
        numVertical: numVertical,
        numHorizontal: numHorizontal,
        photometricType: 1,
        unitsType: 2,
        width: 0,
        length: 0,
        height: 0
      },
      photometricData: {
        verticalAngles: verticalAngles,
        horizontalAngles: [0],
        candela: candela
      },
      ballastFactor: 1,
      ballastLampFactor: 1,
      inputWatts: 36
    };
  }

  updateLuminaireList(luminaires) {
    this.luminaires = luminaires;
    const list = this.shadowRoot.getElementById('luminaire-list');
    const count = this.shadowRoot.getElementById('lum-count');
    
    count.textContent = luminaires.length;
    
    if (luminaires.length === 0) {
      list.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">💡</div>
          No luminaires added yet
        </div>
      `;
      this.updateStats();
      return;
    }

    list.innerHTML = luminaires.map((lum, i) => `
      <div class="luminaire-item ${this.selectedLuminaire?.id === lum.id ? 'selected' : ''}" data-id="${lum.id}">
        <div class="luminaire-icon">💡</div>
        <div class="luminaire-info">
          <div class="luminaire-name">${lum.name || `Lamp ${i + 1}`}</div>
          <div class="luminaire-specs">${lum.intensity} lm · ${lum.wattage || 36}W</div>
        </div>
        <div class="luminaire-actions">
          <button class="btn-icon" data-action="delete" data-id="${lum.id}">🗑️</button>
        </div>
      </div>
    `).join('');

    // Add click handlers
    list.querySelectorAll('.luminaire-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if (!e.target.closest('.btn-icon')) {
          this.selectLuminaire(item.dataset.id);
        }
      });
    });

    list.querySelectorAll('.btn-icon').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (btn.dataset.action === 'delete') {
          this.deleteLuminaire(btn.dataset.id);
        }
      });
    });

    this.updateStats();
  }

  updateStats() {
    const totalWattage = this.luminaires.reduce((sum, lum) => sum + (lum.wattage || 36), 0);
    const totalLumens = this.luminaires.reduce((sum, lum) => sum + (lum.intensity || 1000), 0);
    
    this.shadowRoot.getElementById('total-wattage').textContent = totalWattage;
    this.shadowRoot.getElementById('total-lumens').textContent = totalLumens.toLocaleString();
  }

  selectLuminaire(id) {
    this.selectedLuminaire = this.luminaires.find(l => l.id === id);
    this.updateLuminaireList(this.luminaires);
    this.showProperties();
  }

  showProperties() {
    const section = this.shadowRoot.getElementById('properties-section');
    const lum = this.selectedLuminaire;
    
    if (!lum) {
      section.style.display = 'none';
      return;
    }

    section.style.display = 'block';
    
    this.shadowRoot.getElementById('prop-name').value = lum.name || '';
    this.shadowRoot.getElementById('prop-x').value = lum.position?.x?.toFixed(2) || '0';
    this.shadowRoot.getElementById('prop-y').value = lum.position?.y?.toFixed(2) || '2.8';
    this.shadowRoot.getElementById('prop-z').value = lum.position?.z?.toFixed(2) || '0';
    this.shadowRoot.getElementById('prop-rot-x').value = ((lum.rotation?.x || 0) * 180 / Math.PI).toFixed(0);
    this.shadowRoot.getElementById('prop-rot-y').value = ((lum.rotation?.y || 0) * 180 / Math.PI).toFixed(0);
    this.shadowRoot.getElementById('prop-intensity').value = lum.intensity || 1000;
    this.shadowRoot.getElementById('prop-wattage').value = lum.wattage || 36;
  }

  liveUpdatePosition() {
    if (!this.selectedLuminaire) return;

    const position = {
      x: parseFloat(this.shadowRoot.getElementById('prop-x').value) || 0,
      y: parseFloat(this.shadowRoot.getElementById('prop-y').value) || 2.8,
      z: parseFloat(this.shadowRoot.getElementById('prop-z').value) || 0
    };

    const rotation = {
      x: parseFloat(this.shadowRoot.getElementById('prop-rot-x').value) * Math.PI / 180 || 0,
      y: parseFloat(this.shadowRoot.getElementById('prop-rot-y').value) * Math.PI / 180 || 0,
      z: 0
    };

    this.dispatchEvent(new CustomEvent('update-luminaire', {
      detail: {
        id: this.selectedLuminaire.id,
        position,
        rotation
      },
      bubbles: true,
      composed: true
    }));
  }

  updateSelectedLuminaire() {
    if (!this.selectedLuminaire) return;

    const updates = {
      id: this.selectedLuminaire.id,
      name: this.shadowRoot.getElementById('prop-name').value,
      position: {
        x: parseFloat(this.shadowRoot.getElementById('prop-x').value) || 0,
        y: parseFloat(this.shadowRoot.getElementById('prop-y').value) || 2.8,
        z: parseFloat(this.shadowRoot.getElementById('prop-z').value) || 0
      },
      rotation: {
        x: parseFloat(this.shadowRoot.getElementById('prop-rot-x').value) * Math.PI / 180 || 0,
        y: parseFloat(this.shadowRoot.getElementById('prop-rot-y').value) * Math.PI / 180 || 0,
        z: 0
      },
      intensity: parseFloat(this.shadowRoot.getElementById('prop-intensity').value) || 1000,
      wattage: parseFloat(this.shadowRoot.getElementById('prop-wattage').value) || 36
    };

    this.dispatchEvent(new CustomEvent('update-luminaire', {
      detail: updates,
      bubbles: true,
      composed: true
    }));
  }

  duplicateSelectedLuminaire() {
    if (!this.selectedLuminaire) return;

    const duplicate = {
      ...this.selectedLuminaire,
      id: `dup-${Date.now()}`,
      name: `${this.selectedLuminaire.name} (Copy)`,
      position: {
        ...this.selectedLuminaire.position,
        x: this.selectedLuminaire.position.x + 0.5
      }
    };

    this.dispatchEvent(new CustomEvent('add-luminaire', {
      detail: { luminaire: duplicate },
      bubbles: true,
      composed: true
    }));
  }

  deleteLuminaire(id) {
    this.dispatchEvent(new CustomEvent('delete-luminaire', {
      detail: { id },
      bubbles: true,
      composed: true
    }));

    if (this.selectedLuminaire?.id === id) {
      this.selectedLuminaire = null;
      this.shadowRoot.getElementById('properties-section').style.display = 'none';
    }
  }

  showNotification(message, type = 'success') {
    // Simple notification - could be enhanced
    console.log(`[LuminaireTool] ${message}`);
  }
}

customElements.define('luminaire-tool', LuminaireTool);
