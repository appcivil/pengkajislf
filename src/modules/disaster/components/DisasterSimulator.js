import { HazardEngine } from '../core/HazardEngine.js';
import { VulnerabilityCalculator } from '../core/VulnerabilityCalculator.js';
import { RiskMatrix } from '../core/RiskMatrix.js';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export class DisasterSimulator extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.engine = null;
    this.vulnCalc = new VulnerabilityCalculator();
    this.riskMatrix = new RiskMatrix();
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.buildings = [];
    this.isSimulating = false;
  }

  connectedCallback() {
    this.render();
    this.init3D();
    this.setupEvents();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; width: 100%; height: 100%; position: relative; }
        #canvas { width: 100%; height: 100%; background: #0f172a; }
        .panel {
          position: absolute; right: 16px; top: 16px; width: 380px;
          background: rgba(30, 41, 59, 0.98); padding: 20px;
          border-radius: 12px; color: white; max-height: calc(100% - 32px);
          overflow-y: auto; border: 1px solid rgba(255,255,255,0.1);
          box-shadow: 0 8px 32px rgba(0,0,0,0.4);
        }
        h2 { color: #ef4444; margin: 0 0 16px; font-size: 16px; font-weight: 700; }
        .scenario-box {
          background: rgba(255,255,255,0.05); padding: 14px; border-radius: 8px;
          margin-bottom: 12px;
        }
        .form-row { margin-bottom: 10px; }
        label { display: block; font-size: 11px; color: #94a3b8; margin-bottom: 4px; }
        select, input {
          width: 100%; padding: 8px; background: #334155; border: 1px solid #475569;
          color: white; border-radius: 6px; font-size: 13px;
        }
        button.run {
          width: 100%; padding: 12px; background: linear-gradient(135deg, #ef4444, #dc2626);
          color: white; border: none; border-radius: 8px; font-weight: 700;
          cursor: pointer; transition: all 0.2s;
        }
        button.run:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(239,68,68,0.3); }
        button.run:disabled { opacity: 0.6; cursor: not-allowed; }
        .result-card {
          background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
          padding: 16px; border-radius: 8px; margin: 10px 0;
        }
        .result-card.danger {
          background: linear-gradient(135deg, #7f1d1d 0%, #dc2626 100%);
        }
        .risk-meter {
          height: 20px; background: rgba(0,0,0,0.3); border-radius: 10px;
          overflow: hidden; margin-top: 8px;
        }
        .risk-fill {
          height: 100%; border-radius: 10px;
          background: linear-gradient(90deg, #10b981, #f59e0b, #ef4444, #7f1d1d);
          transition: width 0.5s;
        }
        .controls-3d {
          position: absolute; bottom: 16px; left: 16px;
          display: flex; gap: 8px;
        }
        .control-btn {
          background: rgba(30,41,59,0.9); color: white; border: 1px solid rgba(255,255,255,0.2);
          padding: 8px 12px; border-radius: 6px; cursor: pointer; font-size: 12px;
        }
        .control-btn:hover { background: rgba(59,130,246,0.3); }
      </style>

      <div class="panel">
        <h2>🌋 Simulasi Mitigasi Bencana</h2>
        
        <div class="scenario-box">
          <div class="form-row">
            <label>Jenis Bencana</label>
            <select id="hazard-type">
              <option value="earthquake">Gempa Bumi</option>
              <option value="flood">Banjir</option>
              <option value="tsunami">Tsunami</option>
              <option value="landslide">Longsor</option>
            </select>
          </div>
          <div class="form-row">
            <label>Intensitas</label>
            <select id="intensity">
              <option value="low">Rendah</option>
              <option value="moderate" selected>Sedang</option>
              <option value="high">Tinggi</option>
              <option value="extreme">Ekstrem</option>
            </select>
          </div>
        </div>

        <div class="scenario-box">
          <div class="form-row">
            <label>Tipe Struktur</label>
            <select id="struct-type">
              <option value="c1">Concrete Moment Frame</option>
              <option value="rm1">Reinforced Masonry</option>
              <option value="w1">Wood Light Frame</option>
              <option value="c2">Concrete Shear Wall</option>
              <option value="s1">Steel Moment Frame</option>
            </select>
          </div>
          <div class="form-row">
            <label>Nilai Bangunan (Miliar Rp)</label>
            <input type="number" id="building-value" value="50" min="1">
          </div>
        </div>

        <button class="run" id="btn-run">▶ Jalankan Simulasi</button>
        <button class="run" id="btn-stop" style="display:none;background:#647483;margin-top:8px;">⏹ Stop</button>

        <div id="results" style="display: none; margin-top: 16px;">
          <div class="result-card">
            <div style="font-size: 11px; opacity: 0.9;">Kerugian Ekonomi</div>
            <div style="font-size: 22px; font-weight: 700; margin: 6px 0;" id="economic-loss">Rp 0 M</div>
            <div class="risk-meter"><div class="risk-fill" id="damage-bar" style="width: 0%"></div></div>
            <div style="font-size: 10px; margin-top: 4px; text-align: center;" id="damage-percent">0% kerusakan</div>
          </div>

          <div class="result-card danger">
            <div style="font-size: 11px; opacity: 0.9;">Tingkat Risiko</div>
            <div style="font-size: 26px; font-weight: 700; margin: 6px 0;" id="risk-level">-</div>
            <div style="font-size: 11px;" id="risk-description">-</div>
          </div>

          <div style="margin-top: 14px; font-size: 11px; color: #94a3b8;">
            <strong style="color: #fbbf24;">Rekomendasi:</strong>
            <ul id="mitigation-list" style="margin-top: 6px; padding-left: 16px; line-height: 1.6;"></ul>
          </div>
        </div>
      </div>

      <div class="controls-3d">
        <button class="control-btn" id="btn-reset">Reset View</button>
        <button class="control-btn" id="btn-toggle-grid">Toggle Grid</button>
      </div>

      <div id="canvas"></div>
    `;
  }

  init3D() {
    const container = this.shadowRoot.getElementById('canvas');
    
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0f172a);
    
    this.camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 1000);
    this.camera.position.set(30, 25, 40);
    
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.shadowMap.enabled = true;
    container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    this.scene.add(ambientLight);
    
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(50, 100, 50);
    dirLight.castShadow = true;
    this.scene.add(dirLight);
    
    // Initialize hazard engine
    this.engine = new HazardEngine(this.scene, this.camera, this.renderer);
    
    // Load building
    this.loadBuilding();
    
    // Start animation loop
    this.animate();
    
    // Handle resize
    new ResizeObserver(() => {
      this.camera.aspect = container.clientWidth / container.clientHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(container.clientWidth, container.clientHeight);
    }).observe(container);
  }

  loadBuilding() {
    const floorPlans = window.appState?.state?.floorPlans || [];
    if (!floorPlans.length) {
      // Create default building
      this.createDefaultBuilding();
      return;
    }

    floorPlans.forEach((floor, level) => {
      if (!floor.points?.length) return;
      
      const shape = new THREE.Shape(floor.points.map(p => new THREE.Vector2(p.x / 10, p.y / 10)));
      const geometry = new THREE.ExtrudeGeometry(shape, { depth: 2.8, bevelEnabled: false });
      const material = new THREE.MeshStandardMaterial({ 
        color: 0x64748b,
        roughness: 0.7
      });
      
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.y = level * 3;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData = {
        isBuilding: true,
        id: `floor_${level}`,
        name: `Floor ${level + 1}`,
        seismicCapacity: 0.3,
        foundationHeight: 1.0,
        value: 50000000,
        area: 100
      };
      
      this.scene.add(mesh);
      this.buildings.push(mesh);
    });
  }

  createDefaultBuilding() {
    // Simple cube building for demo
    const geometry = new THREE.BoxGeometry(20, 15, 15);
    const material = new THREE.MeshStandardMaterial({ color: 0x64748b });
    const building = new THREE.Mesh(geometry, material);
    building.position.y = 7.5;
    building.castShadow = true;
    building.userData = {
      isBuilding: true,
      id: 'building_1',
      name: 'Main Building',
      seismicCapacity: 0.3,
      foundationHeight: 1.0,
      value: 500000000,
      area: 300
    };
    this.scene.add(building);
    this.buildings.push(building);
  }

  setupEvents() {
    this.shadowRoot.getElementById('btn-run').addEventListener('click', () => this.runSimulation());
    this.shadowRoot.getElementById('btn-stop').addEventListener('click', () => this.stopSimulation());
    this.shadowRoot.getElementById('btn-reset').addEventListener('click', () => this.resetView());
    
    this.shadowRoot.getElementById('hazard-type').addEventListener('change', (e) => {
      const intensitySelect = this.shadowRoot.getElementById('intensity');
      if (e.target.value === 'flood') {
        intensitySelect.innerHTML = `
          <option value="low">Rendah (0.5m)</option>
          <option value="moderate" selected>Sedang (1.5m)</option>
          <option value="high">Tinggi (3m)</option>
          <option value="extreme">Ekstrem (5m)</option>
        `;
      } else {
        intensitySelect.innerHTML = `
          <option value="low">Rendah</option>
          <option value="moderate" selected>Sedang</option>
          <option value="high">Tinggi</option>
          <option value="extreme">Ekstrem</option>
        `;
      }
    });
  }

  runSimulation() {
    const hazardType = this.shadowRoot.getElementById('hazard-type').value;
    const intensityLevel = this.shadowRoot.getElementById('intensity').value;
    const structType = this.shadowRoot.getElementById('struct-type').value;
    const buildingValue = parseFloat(this.shadowRoot.getElementById('building-value').value) * 1000000000;

    // Map intensity ke nilai numerik
    const intensityMap = {
      earthquake: { low: 0.15, moderate: 0.3, high: 0.5, extreme: 0.8 },
      flood: { low: 0.5, moderate: 1.5, high: 3, extreme: 5 },
      tsunami: { low: 3, moderate: 8, high: 15, extreme: 25 },
      landslide: { low: 0.3, moderate: 0.5, high: 0.7, extreme: 0.9 }
    };

    const intensity = intensityMap[hazardType][intensityLevel];
    
    // Setup hazard
    this.engine.setHazard(hazardType, intensity, { waterLevel: intensity });
    this.engine.start();
    this.isSimulating = true;

    // Update UI
    this.shadowRoot.getElementById('btn-run').style.display = 'none';
    this.shadowRoot.getElementById('btn-stop').style.display = 'block';
    this.shadowRoot.getElementById('results').style.display = 'none';

    // Calculate vulnerability
    const vuln = this.vulnCalc.calculateVulnerability(hazardType, structType, intensity);
    
    // Update building parameters
    this.buildings.forEach(building => {
      building.userData.value = buildingValue;
      building.userData.seismicCapacity = structType === 'c1' ? 0.4 : 
                                          structType === 'c2' ? 0.5 : 
                                          structType === 's1' ? 0.45 : 0.25;
    });

    // Stop after duration
    setTimeout(() => {
      this.stopSimulation();
      this.showResults(vuln, buildingValue, hazardType);
    }, this.engine.params.duration * 1000);
  }

  stopSimulation() {
    this.engine.stop();
    this.isSimulating = false;
    this.shadowRoot.getElementById('btn-run').style.display = 'block';
    this.shadowRoot.getElementById('btn-stop').style.display = 'none';
  }

  showResults(vulnerability, buildingValue, hazardType) {
    const resultsDiv = this.shadowRoot.getElementById('results');
    resultsDiv.style.display = 'block';
    
    const loss = vulnerability.meanDamageRatio * buildingValue;
    const lossMillion = loss / 1000000000;
    
    this.shadowRoot.getElementById('economic-loss').textContent = `Rp ${lossMillion.toFixed(1)} M`;
    this.shadowRoot.getElementById('damage-bar').style.width = `${vulnerability.meanDamageRatio * 100}%`;
    this.shadowRoot.getElementById('damage-percent').textContent = 
      `${(vulnerability.meanDamageRatio * 100).toFixed(1)}% kerusakan`;
    
    // Risk level
    const risk = vulnerability.meanDamageRatio;
    let riskLevel = 'RENDAH';
    let riskDesc = 'Risiko dapat diterima dengan mitigasi standar';
    let riskClass = '';
    
    if (risk > 0.6) {
      riskLevel = 'TINGGI';
      riskDesc = 'Perlu mitigasi struktural segera';
      riskClass = 'danger';
    } else if (risk > 0.3) {
      riskLevel = 'SEDANG';
      riskDesc = 'Perlu evaluasi detail dan perkuatan';
    }
    
    this.shadowRoot.getElementById('risk-level').textContent = riskLevel;
    this.shadowRoot.getElementById('risk-description').textContent = riskDesc;

    // Recommendations
    const recs = [];
    if (risk > 0.3) recs.push('Retrofitting struktur (strengthening)');
    if (risk > 0.5) recs.push('Penambahan dinding geser (shear walls)');
    if (buildingValue > 100000000000) recs.push('Asuransi bencana komprehensif');
    if (hazardType === 'earthquake') recs.push('Base isolation system');
    if (hazardType === 'flood') recs.push('Sistem pompa dan waterproofing');
    recs.push('Sistem peringatan dini');
    recs.push('Pelatihan evakuasi berkala');
    
    this.shadowRoot.getElementById('mitigation-list').innerHTML = 
      recs.map(r => `<li>${r}</li>`).join('');

    // Save to appState
    if (window.appState) {
      window.appState.setState({
        disasterSimulation: {
          hazard: hazardType,
          intensity: this.engine.intensity,
          vulnerability,
          economicLoss: loss,
          riskLevel
        }
      });
    }
  }

  resetView() {
    this.camera.position.set(30, 25, 40);
    this.controls.reset();
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    
    if (this.isSimulating && this.engine) {
      this.engine.simulate(0.016);
    }
    
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}

customElements.define('disaster-simulator', DisasterSimulator);
export default DisasterSimulator;
