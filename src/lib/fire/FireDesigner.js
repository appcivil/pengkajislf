/**
 * FireDesigner.js - 3D Fire Simulation Web Component
 * Visualisasi kebakaran dengan zone model, smoke layer, dan ASET monitoring
 */

import { FireDynamicsEngine } from './FireDynamicsEngine.js';
import { archState } from '../archsim/StateManager.js';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export class FireDesigner extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.engine = null;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.isSimulating = false;
    this.fireMesh = null;
    this.smokeLayer = null;
    this.fireLight = null;
    this.animationId = null;
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <style>
        :host { 
          display: block; 
          width: 100%; 
          height: 100%; 
          position: relative; 
          background: linear-gradient(180deg, #0a0a0a 0%, #1a1a2e 100%);
          border-radius: 12px;
          overflow: hidden;
        }
        #canvas-container { 
          width: 100%; 
          height: 100%;
        }
        .control-panel {
          position: absolute; 
          right: 16px; 
          top: 16px; 
          width: 360px;
          background: rgba(20, 20, 30, 0.95); 
          backdrop-filter: blur(16px);
          padding: 24px;
          border-radius: 16px; 
          color: white; 
          border: 1px solid rgba(255, 100, 50, 0.15);
          max-height: calc(100% - 32px); 
          overflow-y: auto;
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
        }
        .panel-title {
          margin: 0 0 20px 0;
          color: #ef4444;
          font-size: 18px;
          font-weight: 800;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .form-group {
          margin-bottom: 16px;
        }
        .form-label {
          font-size: 12px;
          color: #a3a3a3;
          margin-bottom: 6px;
          display: block;
        }
        .form-select, .form-input {
          width: 100%;
          padding: 12px 14px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 100, 50, 0.2);
          border-radius: 10px;
          color: white;
          font-size: 13px;
          transition: all 0.2s;
        }
        .form-select:focus, .form-input:focus {
          outline: none;
          border-color: rgba(239, 68, 68, 0.5);
          background: rgba(255, 255, 255, 0.08);
        }
        .form-select option {
          background: #1a1a2e;
        }
        .fire-params {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        
        .metric-card {
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(239, 68, 68, 0.05) 100%);
          padding: 18px;
          border-radius: 12px;
          margin-bottom: 14px;
          border-left: 4px solid #ef4444;
        }
        .metric-card.warning {
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(245, 158, 11, 0.05) 100%);
          border-left-color: #f59e0b;
        }
        .metric-card.safe {
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.05) 100%);
          border-left-color: #10b981;
        }
        .metric-value { 
          font-size: 32px; 
          font-weight: 800; 
          color: #fbbf24;
          margin-bottom: 4px;
        }
        .metric-value.danger { color: #ef4444; }
        .metric-value.safe { color: #10b981; }
        .metric-label { 
          font-size: 11px; 
          color: #fca5a5;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .btn-fire {
          width: 100%;
          padding: 16px;
          background: linear-gradient(135deg, #ef4444, #dc2626);
          color: white;
          border: none;
          border-radius: 12px;
          font-weight: 700;
          cursor: pointer;
          font-size: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: all 0.2s;
          box-shadow: 0 4px 20px rgba(239, 68, 68, 0.3);
        }
        .btn-fire:hover {
          background: linear-gradient(135deg, #dc2626, #b91c1c);
          transform: translateY(-2px);
          box-shadow: 0 6px 24px rgba(239, 68, 68, 0.4);
        }
        .btn-fire:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }
        .btn-integrate {
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          box-shadow: 0 4px 20px rgba(59, 130, 246, 0.3);
          margin-top: 10px;
        }
        .btn-integrate:hover {
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          box-shadow: 0 6px 24px rgba(59, 130, 246, 0.4);
        }
        
        .progress-container {
          margin-top: 16px;
          background: rgba(255, 255, 255, 0.08);
          height: 8px;
          border-radius: 4px;
          overflow: hidden;
        }
        .progress-bar {
          height: 100%;
          background: linear-gradient(90deg, #ef4444, #fbbf24);
          width: 0%;
          transition: width 0.3s ease;
          border-radius: 4px;
        }
        
        .layer-visual {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-top: 16px;
        }
        .layer-bar {
          height: 36px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          padding: 0 14px;
          font-size: 12px;
          font-weight: 600;
          transition: all 0.3s;
        }
        .upper-layer { 
          background: linear-gradient(90deg, rgba(127, 29, 29, 0.9), rgba(220, 38, 38, 0.8));
          color: #fca5a5;
        }
        .lower-layer { 
          background: linear-gradient(90deg, rgba(30, 64, 175, 0.6), rgba(59, 130, 246, 0.4));
          color: #93c5fd;
        }
        
        .criteria-list {
          margin-top: 16px;
          padding: 16px;
          background: rgba(239, 68, 68, 0.08);
          border: 1px solid rgba(239, 68, 68, 0.15);
          border-radius: 10px;
          font-size: 11px;
          line-height: 1.6;
        }
        .criteria-title {
          font-weight: 700;
          color: #fca5a5;
          margin-bottom: 8px;
          font-size: 12px;
        }
        .results-panel {
          display: none;
          margin-top: 20px;
          animation: fadeIn 0.5s ease;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .hidden { display: none !important; }
      </style>

      <div class="control-panel">
        <div class="panel-title">🔥 Simulasi Kebakaran</div>
        
        <div class="form-group">
          <label class="form-label">Profil Pertumbuhan Api (T-squared)</label>
          <select id="fire-type" class="form-select">
            <option value="slow">Slow (300s to 1MW) - α=0.00293</option>
            <option value="medium" selected>Medium (150s to 1MW) - α=0.01172</option>
            <option value="fast">Fast (75s to 1MW) - α=0.0469</option>
            <option value="ultra">Ultra-fast (37s to 1MW) - α=0.1876</option>
          </select>
        </div>

        <div class="fire-params">
          <div class="form-group">
            <label class="form-label">HRR Max (kW)</label>
            <input type="number" id="hrr-max" class="form-input" value="5000" step="100" min="100">
          </div>
          <div class="form-group">
            <label class="form-label">Luas Api (m²)</label>
            <input type="number" id="fire-area" class="form-input" value="2" step="0.5" min="0.5">
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Bahan Bakar</label>
          <select id="fuel-type" class="form-select">
            <option value="wood">Kayu (Wood) - HC=17 MJ/kg</option>
            <option value="plastic">Plastik (PU/PVC) - HC=30 MJ/kg</option>
            <option value="liquid">Cairan Mudah Terbakar - HC=44 MJ/kg</option>
            <option value="cellulose">Kertas/Karton - HC=16 MJ/kg</option>
          </select>
        </div>

        <button class="btn-fire" id="btn-run">
          <span>▶</span> Jalankan Simulasi
        </button>
        
        <button class="btn-fire btn-integrate" id="btn-integrate">
          <span>🔗</span> Integrasi dengan Evakuasi
        </button>

        <div class="progress-container">
          <div class="progress-bar" id="sim-progress"></div>
        </div>

        <div class="results-panel" id="results-panel">
          <div class="metric-card" id="aset-card">
            <div class="metric-label">ASET (Available Safe Egress Time)</div>
            <div class="metric-value" id="aset-value">0 s</div>
            <div style="font-size: 11px; color: #a3a3a3; margin-top: 4px;">Waktu tersedia sebelum kondisi tidak tenable</div>
          </div>
          
          <div class="metric-card warning">
            <div class="metric-label">Suhu Lapisan Atas (Max)</div>
            <div class="metric-value" id="temp-value">0 °C</div>
          </div>

          <div class="metric-card safe">
            <div class="metric-label">Visibilitas (Min)</div>
            <div class="metric-value" id="vis-value">0 m</div>
          </div>

          <div class="metric-card">
            <div class="metric-label">Safety Factor (ASET/RSET)</div>
            <div class="metric-value" id="sf-value">-</div>
          </div>

          <div class="layer-visual">
            <div class="layer-bar upper-layer" id="upper-bar">
              Lapisan Panas/Asap: 0%
            </div>
            <div class="layer-bar lower-layer" id="lower-bar">
              Lapisan Bersih: 100%
            </div>
          </div>

          <div class="criteria-list">
            <div class="criteria-title">Kriteria Ketidaktenablean (SNI 03-1736-2000):</div>
            • Suhu konvektif > 60°C<br>
            • Visibilitas < 10m (koridor) / 5m (ruang)<br>
            • CO > 1000 ppm<br>
            • O₂ < 15%<br>
            • Lapisan asap turun < 1.6m
          </div>
        </div>
      </div>

      <div id="canvas-container"></div>
    `;

    this.init3D();
    this.setupEvents();
    this.loadArchitectureData();
  }

  init3D() {
    const container = this.shadowRoot.getElementById('canvas-container');
    
    // Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0a0a);
    this.scene.fog = new THREE.FogExp2(0x0a0a0a, 0.015);
    
    // Camera
    this.camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 1000);
    this.camera.position.set(15, 15, 25);
    
    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    container.appendChild(this.renderer.domElement);

    // Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxPolarAngle = Math.PI / 2.2;
    this.controls.minDistance = 5;
    this.controls.maxDistance = 60;

    // Lighting
    const ambient = new THREE.AmbientLight(0x404040, 0.3);
    this.scene.add(ambient);
    
    // Fire light (dynamic)
    this.fireLight = new THREE.PointLight(0xff6600, 0, 30);
    this.fireLight.castShadow = true;
    this.fireLight.shadow.mapSize.width = 1024;
    this.fireLight.shadow.mapSize.height = 1024;
    this.scene.add(this.fireLight);

    // Directional light (moon/ambient)
    const moonLight = new THREE.DirectionalLight(0x6688ff, 0.3);
    moonLight.position.set(-10, 20, -10);
    this.scene.add(moonLight);

    // Grid
    const grid = new THREE.GridHelper(60, 60, 0x333333, 0x1a1a1a);
    this.scene.add(grid);

    // Floor plane for raycasting
    const floorGeo = new THREE.PlaneGeometry(100, 100);
    const floorMat = new THREE.MeshBasicMaterial({ visible: false });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.name = 'floor';
    this.scene.add(floor);

    // Initialize engine
    this.engine = new FireDynamicsEngine();
    
    // Start animation
    this.animate();
    
    // Resize handler
    new ResizeObserver(() => {
      this.camera.aspect = container.clientWidth / container.clientHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(container.clientWidth, container.clientHeight);
    }).observe(container);
  }

  setupEvents() {
    // Run simulation
    this.shadowRoot.getElementById('btn-run').addEventListener('click', () => {
      this.runSimulation();
    });

    // Integrate with evacuation
    this.shadowRoot.getElementById('btn-integrate').addEventListener('click', () => {
      this.integrateWithEvacuation();
    });

    // Listen for ASET reached
    window.addEventListener('fire:asetReached', (e) => {
      this.onASETReached(e.detail);
    });

    window.addEventListener('fire:tick', (e) => {
      this.onSimulationTick(e.detail);
    });
  }

  loadArchitectureData() {
    const archData = archState.state;
    
    if (archData.floorPlans && archData.floorPlans.length > 0) {
      this.engine.initializeFromArchitecture(archData.floorPlans, archData);
      this.drawBuildingGeometry(archData.floorPlans);
      
      // Place fire at center of first floor
      const firstFloor = archData.floorPlans[0];
      if (firstFloor?.points?.length > 0) {
        const center = this.calculateCenter(firstFloor.points);
        this.placeFireSource(center, 0);
      }
    } else {
      // Default room if no architecture data
      this.engine.initializeFromArchitecture([{
        points: [{x: -5, y: -5}, {x: 5, y: -5}, {x: 5, y: 5}, {x: -5, y: 5}],
        height: 3
      }], {});
      this.drawBuildingGeometry([{
        points: [{x: -5, y: -5}, {x: 5, y: -5}, {x: 5, y: 5}, {x: -5, y: 5}],
        height: 3
      }]);
      this.placeFireSource({x: 0, y: 0}, 0);
    }
  }

  drawBuildingGeometry(floorPlans) {
    floorPlans.forEach((floor, level) => {
      if (!floor.points || floor.points.length < 3) return;
      
      const points = floor.points.map(p => new THREE.Vector2(p.x, p.y));
      const shape = new THREE.Shape(points);
      const yOffset = level * 3;
      
      // Floor
      const floorGeo = new THREE.ShapeGeometry(shape);
      const floorMat = new THREE.MeshBasicMaterial({ 
        color: 0x1a1a2e, 
        transparent: true, 
        opacity: 0.5,
        side: THREE.DoubleSide
      });
      const floorMesh = new THREE.Mesh(floorGeo, floorMat);
      floorMesh.rotation.x = -Math.PI / 2;
      floorMesh.position.y = yOffset + 0.01;
      this.scene.add(floorMesh);

      // Walls (wireframe)
      const wallPoints = [];
      for (let i = 0; i < points.length; i++) {
        const j = (i + 1) % points.length;
        wallPoints.push(
          new THREE.Vector3(points[i].x, yOffset, points[i].y),
          new THREE.Vector3(points[j].x, yOffset, points[j].y),
          new THREE.Vector3(points[j].x, yOffset + 3, points[j].y),
          new THREE.Vector3(points[i].x, yOffset + 3, points[i].y),
          new THREE.Vector3(points[i].x, yOffset, points[i].y)
        );
      }
      
      const wallGeo = new THREE.BufferGeometry().setFromPoints(wallPoints);
      const wallMat = new THREE.LineBasicMaterial({ color: 0x444466, opacity: 0.5, transparent: true });
      const walls = new THREE.Line(wallGeo, wallMat);
      this.scene.add(walls);
    });
  }

  placeFireSource(position, level) {
    // Remove existing fire
    if (this.fireMesh) {
      this.scene.remove(this.fireMesh);
    }
    
    // Create fire cone
    const geometry = new THREE.ConeGeometry(0.6, 2, 8);
    const material = new THREE.MeshBasicMaterial({ 
      color: 0xff4500,
      emissive: 0xff2200,
      emissiveIntensity: 0.8
    });
    this.fireMesh = new THREE.Mesh(geometry, material);
    this.fireMesh.position.set(position.x, level * 3 + 1, position.y);
    this.scene.add(this.fireMesh);
    
    // Update fire light position
    this.fireLight.position.copy(this.fireMesh.position);
    this.fireLight.position.y += 1;
    
    // Store fire position
    this.firePosition = new THREE.Vector3(position.x, level * 3, position.y);
  }

  async runSimulation() {
    const btn = this.shadowRoot.getElementById('btn-run');
    const resultsPanel = this.shadowRoot.getElementById('results-panel');
    
    btn.disabled = true;
    btn.innerHTML = '<span>⏳</span> Simulating...';
    
    this.isSimulating = true;
    resultsPanel.style.display = 'none';
    
    // Configure fire
    const fireConfig = {
      type: this.shadowRoot.getElementById('fire-type').value,
      maxHRR: parseFloat(this.shadowRoot.getElementById('hrr-max').value),
      area: parseFloat(this.shadowRoot.getElementById('fire-area').value),
      location: this.firePosition,
      fuel: this.shadowRoot.getElementById('fuel-type').value
    };
    
    this.engine.setFireSource(fireConfig);
    
    // Run simulation dengan callback untuk update UI
    const results = await this.engine.runSimulation(600, async (state, time, max) => {
      this.updateVisualization(state);
      this.updateUI(state, time, max);
      await new Promise(r => setTimeout(r, 10));
    });
    
    this.isSimulating = false;
    
    btn.disabled = false;
    btn.innerHTML = '<span>▶</span> Jalankan Simulasi';
    
    // Show final results
    this.displayFinalResults(results);
    resultsPanel.style.display = 'block';
    
    // Save to state
    archState.setState({
      fireResults: results,
      ASET: results.ASET
    });
  }

  updateVisualization(state) {
    if (!this.fireMesh) return;
    
    // Animate fire based on HRR
    const hrr = state.fire?.HRR || 0;
    const scale = Math.sqrt(hrr / 1000) * 0.5 + 0.5;
    this.fireMesh.scale.setScalar(scale);
    
    // Update fire light
    this.fireLight.intensity = Math.min(5, hrr / 500);
    
    // Update smoke layer
    if (!this.smokeLayer) {
      const room = this.engine.room;
      const geom = new THREE.BoxGeometry(room.width, room.height, room.length);
      const mat = new THREE.MeshBasicMaterial({
        color: 0x333333,
        transparent: true,
        opacity: 0,
        side: THREE.BackSide
      });
      this.smokeLayer = new THREE.Mesh(geom, mat);
      this.smokeLayer.position.y = room.height / 2;
      this.scene.add(this.smokeLayer);
    }
    
    // Adjust smoke layer
    const upperHeight = state.upperLayer.height;
    const roomHeight = this.engine.room.height;
    const ratio = upperHeight / roomHeight;
    
    this.smokeLayer.scale.y = ratio;
    this.smokeLayer.position.y = roomHeight - (upperHeight / 2);
    
    // Opacity based on smoke density
    const opacity = Math.min(0.7, (state.upperLayer.smokeDensity / 1000) * 0.5);
    this.smokeLayer.material.opacity = opacity;
    
    // Color based on temperature (blue -> red)
    const temp = state.upperLayer.temperature;
    const tempRatio = Math.min(1, (temp - 293) / 200);
    const r = tempRatio;
    const b = 1 - tempRatio;
    this.smokeLayer.material.color.setRGB(r * 0.5 + 0.2, 0.2, b * 0.3 + 0.1);
  }

  updateUI(state, current, total) {
    const progress = (current / total) * 100;
    this.shadowRoot.getElementById('sim-progress').style.width = progress + '%';
    
    // Update layer bars
    const roomHeight = this.engine.room.height;
    const upperPercent = (state.upperLayer.height / roomHeight) * 100;
    const lowerPercent = 100 - upperPercent;
    
    this.shadowRoot.getElementById('upper-bar').textContent = 
      `Lapisan Panas/Asap: ${upperPercent.toFixed(0)}% (${(state.upperLayer.temperature - 273).toFixed(0)}°C)`;
    this.shadowRoot.getElementById('lower-bar').textContent = 
      `Lapisan Bersih: ${lowerPercent.toFixed(0)}%`;
  }

  displayFinalResults(results) {
    const aset = results.ASET;
    const maxTemp = results.maxTemperature - 273; // to Celsius
    const minVis = results.minVisibility;
    
    // Update ASET display
    const asetEl = this.shadowRoot.getElementById('aset-value');
    asetEl.textContent = aset.toFixed(0) + ' s';
    
    // Color code ASET
    const asetCard = this.shadowRoot.getElementById('aset-card');
    if (aset < 180) {
      asetEl.className = 'metric-value danger';
      asetCard.className = 'metric-card';
    } else if (aset < 300) {
      asetEl.className = 'metric-value';
      asetCard.className = 'metric-card warning';
    } else {
      asetEl.className = 'metric-value safe';
      asetCard.className = 'metric-card safe';
    }
    
    this.shadowRoot.getElementById('temp-value').textContent = maxTemp.toFixed(0) + ' °C';
    this.shadowRoot.getElementById('vis-value').textContent = minVis.toFixed(1) + ' m';
    
    // Calculate Safety Factor jika ada RSET dari evakuasi
    const evacResults = archState.state.evacuationResults;
    if (evacResults?.rset) {
      const rset = parseFloat(evacResults.rset);
      const sf = aset / rset;
      const sfEl = this.shadowRoot.getElementById('sf-value');
      sfEl.textContent = sf.toFixed(2);
      
      if (sf >= 1.5) {
        sfEl.className = 'metric-value safe';
      } else if (sf >= 1.0) {
        sfEl.className = 'metric-value';
      } else {
        sfEl.className = 'metric-value danger';
      }
    }
  }

  onASETReached(detail) {
    console.log(`[FireDesigner] ASET reached at ${detail.time}s, reason: ${detail.reason}`);
  }

  onSimulationTick(detail) {
    // Update progress
    const progress = (detail.time / 600) * 100;
    this.shadowRoot.getElementById('sim-progress').style.width = progress + '%';
  }

  integrateWithEvacuation() {
    const fireResults = archState.state.fireResults;
    const evacResults = archState.state.evacuationResults;
    
    if (!fireResults || !evacResults) {
      showError('Jalankan simulasi kebakaran DAN evakuasi terlebih dahulu!');
      return;
    }
    
    const aset = fireResults.ASET;
    const rset = parseFloat(evacResults.rset);
    const safetyFactor = aset / rset;
    
    // Update state dengan integrated results
    archState.setState({
      integratedSafetyAnalysis: {
        ASET: aset,
        RSET: rset,
        safetyFactor: safetyFactor,
        status: safetyFactor >= 1.5 ? 'SAFE' : safetyFactor >= 1.0 ? 'MARGINAL' : 'UNSAFE',
        timestamp: new Date().toISOString()
      }
    });
    
    showSuccess(`Integrasi berhasil! Safety Factor: ${safetyFactor.toFixed(2)}`);
    
    // Update UI
    this.shadowRoot.getElementById('sf-value').textContent = safetyFactor.toFixed(2);
  }

  calculateCenter(points) {
    if (!points || points.length === 0) return { x: 0, y: 0 };
    const sum = points.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
    return { x: sum.x / points.length, y: sum.y / points.length };
  }

  animate() {
    this.animationId = requestAnimationFrame(() => this.animate());
    
    // Animate fire flicker
    if (this.fireMesh) {
      this.fireMesh.rotation.y += 0.08;
      const flicker = 0.8 + Math.sin(Date.now() * 0.02) * 0.2 + Math.random() * 0.1;
      this.fireMesh.material.emissiveIntensity = flicker;
      if (this.fireLight) {
        this.fireLight.intensity = flicker * (this.engine?.fire?.currentHRR || 1000) / 200;
      }
    }
    
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  disconnectedCallback() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    if (this.engine) {
      this.engine.stop();
    }
  }
}

// Define custom element
customElements.define('fire-designer', FireDesigner);

export default { FireDesigner };
