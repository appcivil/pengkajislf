/**
 * EvacuationDesigner.js - UI Komponen Simulasi Evakuasi
 * 3D viewport dengan kontrol simulasi dan visualisasi real-time
 */

import { PathfinderEngine } from './PathfinderEngine.js';
import { archState } from '../archsim/StateManager.js';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export class EvacuationDesigner extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.engine = null;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.isSimulating = false;
    this.agentMeshes = new Map();
    this.currentTool = 'select';
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <style>
        :host { 
          display: block; 
          width: 100%; 
          height: 100%; 
          position: relative; 
          background: #0a0a0a;
          border-radius: 12px;
          overflow: hidden;
        }
        #canvas-container { 
          width: 100%; 
          height: 100%;
        }
        .toolbar {
          position: absolute; 
          top: 16px; 
          left: 16px;
          background: rgba(20, 20, 25, 0.95); 
          backdrop-filter: blur(12px);
          padding: 12px; 
          border-radius: 12px; 
          display: flex; 
          gap: 8px;
          border: 1px solid rgba(255, 255, 255, 0.08); 
          z-index: 100;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        }
        .tool-btn {
          width: 40px; 
          height: 40px; 
          border: 2px solid transparent;
          background: rgba(255, 255, 255, 0.06); 
          color: #a3a3a3;
          border-radius: 10px; 
          cursor: pointer; 
          font-size: 18px;
          display: flex; 
          align-items: center; 
          justify-content: center;
          transition: all 0.2s;
        }
        .tool-btn:hover { 
          background: rgba(255, 255, 255, 0.1); 
          color: #e5e5e5;
        }
        .tool-btn.active { 
          border-color: #3b82f6; 
          background: rgba(59, 130, 246, 0.15);
          color: #3b82f6;
        }
        .tool-divider {
          width: 1px; 
          background: rgba(255, 255, 255, 0.1); 
          margin: 0 4px;
        }
        
        .control-panel {
          position: absolute; 
          right: 16px; 
          top: 16px; 
          width: 320px;
          background: rgba(20, 20, 25, 0.95); 
          backdrop-filter: blur(12px);
          padding: 20px;
          border-radius: 12px; 
          color: white; 
          border: 1px solid rgba(255, 255, 255, 0.08);
          max-height: calc(100% - 32px); 
          overflow-y: auto;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        }
        .panel-title {
          margin: 0 0 16px 0;
          color: #ef4444;
          font-size: 16px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 8px;
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
        .form-select {
          width: 100%;
          padding: 10px 12px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: white;
          font-size: 13px;
        }
        .form-select option {
          background: #1a1a1a;
        }
        
        .stats-grid {
          display: grid; 
          grid-template-columns: 1fr 1fr; 
          gap: 12px; 
          margin-top: 16px;
        }
        .stat-box {
          background: rgba(255, 255, 255, 0.03); 
          padding: 14px; 
          border-radius: 10px; 
          text-align: center;
        }
        .stat-value { 
          font-size: 24px; 
          font-weight: 800; 
          color: #3b82f6; 
        }
        .stat-label { 
          font-size: 10px; 
          color: #737373; 
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-top: 4px;
        }
        
        .progress-container {
          margin-top: 20px;
        }
        .progress-label {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: #a3a3a3;
          margin-bottom: 6px;
        }
        .progress-bar {
          width: 100%; 
          height: 8px; 
          background: rgba(255, 255, 255, 0.06);
          border-radius: 4px; 
          overflow: hidden;
        }
        .progress-fill {
          height: 100%; 
          background: linear-gradient(90deg, #3b82f6, #10b981);
          width: 0%; 
          transition: width 0.3s ease;
          border-radius: 4px;
        }
        
        .btn-primary {
          width: 100%; 
          padding: 14px; 
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          color: white; 
          border: none; 
          border-radius: 10px;
          font-weight: 700; 
          cursor: pointer; 
          margin-top: 16px;
          font-size: 13px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s;
        }
        .btn-primary:hover { 
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          transform: translateY(-1px);
        }
        .btn-primary:disabled { 
          opacity: 0.5; 
          cursor: not-allowed;
          transform: none;
        }
        .btn-secondary {
          background: linear-gradient(135deg, #10b981, #059669);
        }
        .btn-secondary:hover {
          background: linear-gradient(135deg, #059669, #047857);
        }
        
        .occupant-list {
          margin-top: 16px;
          max-height: 180px;
          overflow-y: auto;
        }
        .occupant-item {
          display: flex; 
          align-items: center; 
          gap: 10px; 
          padding: 10px;
          background: rgba(255, 255, 255, 0.03); 
          margin-bottom: 6px;
          border-radius: 8px; 
          font-size: 12px;
        }
        .color-dot { 
          width: 10px; 
          height: 10px; 
          border-radius: 50%; 
          flex-shrink: 0;
        }
        .rset-display {
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.2));
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 12px;
          padding: 16px;
          text-align: center;
          margin-top: 16px;
        }
        .rset-value {
          font-size: 36px;
          font-weight: 800;
          color: #ef4444;
        }
        .rset-label {
          font-size: 11px;
          color: #fca5a5;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
      </style>

      <div class="toolbar">
        <button class="tool-btn active" data-tool="select" title="Select">🔍</button>
        <button class="tool-btn" data-tool="spawn" title="Tambah Occupant">👥</button>
        <button class="tool-btn" data-tool="exit" title="Tambah Exit">🚪</button>
        <button class="tool-btn" data-tool="obstacle" title="Tambah Obstacle">🧱</button>
        <div class="tool-divider"></div>
        <button class="tool-btn" id="btn-import" title="Import dari Arsitektur">🏢</button>
        <button class="tool-btn" id="btn-clear" title="Clear">🗑️</button>
      </div>

      <div class="control-panel">
        <div class="panel-title">🚨 Simulasi Evakuasi</div>
        
        <div class="form-group">
          <label class="form-label">Profil Occupant Default</label>
          <select id="profile-select" class="form-select">
            <option value="normal">Normal (1.2 m/s)</option>
            <option value="elderly">Lansia (0.8 m/s)</option>
            <option value="child">Anak (0.9 m/s)</option>
            <option value="disabled">Disabilitas (0.5 m/s)</option>
          </select>
        </div>

        <div class="stats-grid">
          <div class="stat-box">
            <div class="stat-value" id="stat-total">0</div>
            <div class="stat-label">Total Occupant</div>
          </div>
          <div class="stat-box">
            <div class="stat-value" id="stat-evacuated">0</div>
            <div class="stat-label">Evacuated</div>
          </div>
          <div class="stat-box">
            <div class="stat-value" id="stat-time">0s</div>
            <div class="stat-label">Waktu</div>
          </div>
          <div class="stat-box">
            <div class="stat-value" id="stat-rate">0%</div>
            <div class="stat-label">Evacuation</div>
          </div>
        </div>

        <div class="progress-container">
          <div class="progress-label">
            <span>Progress Evakuasi</span>
            <span id="progress-text">0%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" id="progress-fill"></div>
          </div>
        </div>

        <div class="rset-display" id="rset-display" style="display: none;">
          <div class="rset-label">RSET (Required Safe Egress Time)</div>
          <div class="rset-value" id="rset-value">-</div>
          <div style="font-size: 11px; color: #a3a3a3; margin-top: 4px;">seconds</div>
        </div>

        <button class="btn-primary" id="btn-run">
          <span>▶</span> Jalankan Simulasi
        </button>
        <button class="btn-primary btn-secondary" id="btn-report" style="display: none;">
          <span>📄</span> Generate Laporan
        </button>

        <div class="occupant-list" id="occupant-list">
          <div style="text-align: center; color: #737373; padding: 20px; font-size: 12px;">
            Belum ada occupant. Import dari arsitektur atau tambahkan manual.
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
    
    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0a0a);
    
    // Camera
    this.camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 1000);
    this.camera.position.set(0, 25, 35);
    this.camera.lookAt(0, 0, 0);
    
    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    // Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxPolarAngle = Math.PI / 2.2;
    this.controls.minDistance = 10;
    this.controls.maxDistance = 100;

    // Lighting
    const ambient = new THREE.AmbientLight(0x404040, 0.6);
    this.scene.add(ambient);
    
    const dir = new THREE.DirectionalLight(0xffffff, 1);
    dir.position.set(20, 40, 20);
    dir.castShadow = true;
    dir.shadow.mapSize.width = 2048;
    dir.shadow.mapSize.height = 2048;
    this.scene.add(dir);

    // Grid
    const grid = new THREE.GridHelper(60, 60, 0x333333, 0x1a1a1a);
    this.scene.add(grid);
    
    // Floor plane (invisible, for raycasting)
    const floorGeo = new THREE.PlaneGeometry(100, 100);
    const floorMat = new THREE.MeshBasicMaterial({ visible: false });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.name = 'floor';
    this.scene.add(floor);

    // Initialize engine
    this.engine = new PathfinderEngine(this.scene);
    
    // Raycaster
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    
    // Events
    this.renderer.domElement.addEventListener('click', (e) => this.handleClick(e));
    this.renderer.domElement.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    
    // Animation
    this.animate();
    
    // Resize
    new ResizeObserver(() => {
      this.camera.aspect = container.clientWidth / container.clientHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(container.clientWidth, container.clientHeight);
    }).observe(container);
  }

  setupEvents() {
    // Toolbar
    this.shadowRoot.querySelectorAll('.tool-btn[data-tool]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.shadowRoot.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentTool = btn.dataset.tool;
      });
    });

    // Import
    this.shadowRoot.getElementById('btn-import').addEventListener('click', () => {
      this.importFromArchitecture();
    });

    // Clear
    this.shadowRoot.getElementById('btn-clear').addEventListener('click', () => {
      this.clearAll();
    });

    // Run simulation
    this.shadowRoot.getElementById('btn-run').addEventListener('click', async () => {
      await this.runSimulation();
    });

    // Generate report
    this.shadowRoot.getElementById('btn-report').addEventListener('click', () => {
      this.generateReport();
    });

    // Listen engine events
    window.addEventListener('pathfinder:tick', (e) => {
      this.updateStats(e.detail);
    });

    window.addEventListener('pathfinder:simulationComplete', (e) => {
      this.showResults(e.detail);
    });
  }

  loadArchitectureData() {
    const floorPlans = archState.state.floorPlans;
    if (floorPlans && floorPlans.length > 0) {
      this.drawBuildingOutline(floorPlans);
    }
  }

  drawBuildingOutline(floorPlans) {
    floorPlans.forEach((floor, level) => {
      // Draw perimeter
      if (floor.points && floor.points.length > 0) {
        const points = floor.points.map(p => new THREE.Vector3(p.x, level * 3, p.y));
        const geometry = new THREE.BufferGeometry().setFromPoints([...points, points[0]]);
        const material = new THREE.LineBasicMaterial({ color: 0x666666, linewidth: 2 });
        const line = new THREE.Line(geometry, material);
        this.scene.add(line);
        
        // Floor surface
        const shape = new THREE.Shape();
        shape.moveTo(floor.points[0].x, floor.points[0].y);
        floor.points.slice(1).forEach(p => shape.lineTo(p.x, p.y));
        shape.closePath();
        
        const floorGeo = new THREE.ShapeGeometry(shape);
        const floorMat = new THREE.MeshBasicMaterial({ 
          color: 0x1a1a1a, 
          transparent: true, 
          opacity: 0.4,
          side: THREE.DoubleSide
        });
        const floorMesh = new THREE.Mesh(floorGeo, floorMat);
        floorMesh.rotation.x = Math.PI / 2;
        floorMesh.position.y = level * 3 + 0.01;
        this.scene.add(floorMesh);
      }
    });
  }

  handleClick(event) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.scene.children);
    
    const floor = intersects.find(i => i.object.name === 'floor');
    if (!floor) return;
    
    const point = floor.point;

    switch(this.currentTool) {
      case 'spawn':
        this.addSpawnPoint(point);
        break;
      case 'exit':
        this.addExit(point);
        break;
      case 'obstacle':
        this.addObstacle(point);
        break;
    }
  }

  handleMouseMove(event) {
    // Preview placement (optional)
  }

  addSpawnPoint(position) {
    const profile = this.shadowRoot.getElementById('profile-select').value;
    const agent = this.engine.addAgent(position, profile);
    
    // Visual
    const geometry = new THREE.SphereGeometry(agent.radius, 16, 16);
    const material = new THREE.MeshPhongMaterial({ 
      color: agent.color,
      shininess: 30
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(position);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    
    // Add to scene
    this.scene.add(mesh);
    agent.mesh = mesh;
    this.agentMeshes.set(agent.id, mesh);
    
    this.updateStats();
    this.updateOccupantList();
  }

  addExit(position) {
    const exitId = `exit_${this.engine.exits.length}_${Date.now()}`;
    this.engine.exits.push({
      id: exitId,
      position: position.clone(),
      type: 'door',
      isFinalExit: true,
      width: 1.2,
      capacity: 1.8,
      level: Math.floor(position.y / 3)
    });
    
    // Visual
    const geometry = new THREE.BoxGeometry(1.2, 2.2, 0.15);
    const material = new THREE.MeshPhongMaterial({ 
      color: 0x10b981,
      emissive: 0x059669,
      emissiveIntensity: 0.3
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(position);
    mesh.position.y += 1.1;
    this.scene.add(mesh);
    
    // Exit sign
    const signGeo = new THREE.PlaneGeometry(0.6, 0.3);
    const signMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const sign = new THREE.Mesh(signGeo, signMat);
    sign.position.set(position.x, position.y + 2.8, position.z);
    sign.lookAt(this.camera.position);
    this.scene.add(sign);
  }

  addObstacle(position) {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshPhongMaterial({ color: 0x64748b });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(position);
    mesh.position.y += 0.5;
    mesh.castShadow = true;
    this.scene.add(mesh);
    
    this.engine.obstacles.push({
      type: 'box',
      position: position.clone(),
      size: new THREE.Vector3(1, 1, 1)
    });
  }

  importFromArchitecture() {
    const archData = archState.state;
    if (!archData.floorPlans || archData.floorPlans.length === 0) {
      showError('Tidak ada data bangunan. Buat floor plan di modul Arsitektur terlebih dahulu.');
      return;
    }

    // Auto-generate occupant density berdasarkan building type
    const buildingType = archData.project?.buildingType || 'office';
    const density = {
      'office': 0.1,      // 1 person per 10 m²
      'retail': 0.2,      // 1 person per 5 m²
      'theater': 0.5,     // 1 person per 2 m²
      'classroom': 0.2,   // 1 person per 5 m²
      'hospital': 0.15,   // 1 person per 6.7 m²
      'industrial': 0.05  // 1 person per 20 m²
    }[buildingType] || 0.1;

    let totalAdded = 0;

    archData.floorPlans.forEach((floor, level) => {
      if (!floor.points) return;
      
      const area = this.calculatePolygonArea(floor.points);
      const count = Math.max(1, Math.floor(area * density));
      
      // Place agents randomly dalam floor area
      for (let i = 0; i < count; i++) {
        const pos = this.getRandomPointInPolygon(floor.points, level * 3);
        if (pos) {
          this.addSpawnPoint(pos);
          totalAdded++;
        }
      }
    });

    // Auto-place exits pada perimeter
    this.autoPlaceExits(archData.floorPlans);

    showSuccess(`Import berhasil: ${totalAdded} occupant, ${this.engine.exits.length} exit`);
  }

  calculatePolygonArea(points) {
    let area = 0;
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      area += points[i].x * points[j].y;
      area -= points[j].x * points[i].y;
    }
    return Math.abs(area) / 2;
  }

  getRandomPointInPolygon(points, y) {
    // Simplified: random dalam bounding box
    const minX = Math.min(...points.map(p => p.x));
    const maxX = Math.max(...points.map(p => p.x));
    const minZ = Math.min(...points.map(p => p.y));
    const maxZ = Math.max(...points.map(p => p.y));
    
    // Try 10 times untuk find point inside
    for (let i = 0; i < 10; i++) {
      const x = minX + Math.random() * (maxX - minX);
      const z = minZ + Math.random() * (maxZ - minZ);
      
      if (this.isPointInPolygon({x, y: z}, points)) {
        return new THREE.Vector3(x, y + 1.7, z);
      }
    }
    
    return null;
  }

  isPointInPolygon(point, vs) {
    let inside = false;
    for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
      const xi = vs[i].x, yi = vs[i].y;
      const xj = vs[j].x, yj = vs[j].y;
      
      const intersect = ((yi > point.y) !== (yj > point.y)) &&
        (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }

  autoPlaceExits(floorPlans) {
    floorPlans.forEach((floor, level) => {
      if (!floor.points) return;
      
      // Place exits tiap 2 vertex (corners)
      floor.points.forEach((p, i) => {
        if (i % 2 === 0) {
          this.addExit(new THREE.Vector3(p.x, level * 3, p.y));
        }
      });
    });
  }

  async runSimulation() {
    if (this.engine.agents.length === 0) {
      showError('Tidak ada occupant. Import atau tambahkan occupant terlebih dahulu.');
      return;
    }
    
    if (this.engine.exits.length === 0) {
      showError('Tidak ada exit. Tambahkan exit door terlebih dahulu.');
      return;
    }

    const btn = this.shadowRoot.getElementById('btn-run');
    btn.disabled = true;
    btn.innerHTML = '<span>⏳</span> Simulating...';
    
    this.isSimulating = true;
    const results = await this.engine.runSimulation(600, true); // 10 min max, real-time
    this.isSimulating = false;
    
    btn.disabled = false;
    btn.innerHTML = '<span>▶</span> Jalankan Simulasi';
    
    this.shadowRoot.getElementById('btn-report').style.display = 'block';
  }

  showResults(results) {
    // Update RSET display
    const rsetDisplay = this.shadowRoot.getElementById('rset-display');
    const rsetValue = this.shadowRoot.getElementById('rset-value');
    
    rsetDisplay.style.display = 'block';
    rsetValue.textContent = results.rset;
    
    // Color based on safety
    const rset = parseFloat(results.rset);
    if (rset < 180) {
      rsetValue.style.color = '#10b981'; // Green < 3 min
    } else if (rset < 300) {
      rsetValue.style.color = '#f59e0b'; // Yellow 3-5 min
    } else {
      rsetValue.style.color = '#ef4444'; // Red > 5 min
    }
  }

  updateStats(data) {
    const total = this.engine.agents.length;
    const evacuated = this.engine.getEvacuatedCount();
    const active = this.engine.getActiveCount();
    const time = this.engine.time;
    
    this.shadowRoot.getElementById('stat-total').textContent = total;
    this.shadowRoot.getElementById('stat-evacuated').textContent = evacuated;
    this.shadowRoot.getElementById('stat-time').textContent = Math.floor(time) + 's';
    
    const rate = total > 0 ? ((evacuated / total) * 100).toFixed(0) : 0;
    this.shadowRoot.getElementById('stat-rate').textContent = rate + '%';
    
    // Progress bar
    this.shadowRoot.getElementById('progress-fill').style.width = rate + '%';
    this.shadowRoot.getElementById('progress-text').textContent = rate + '%';
  }

  updateOccupantList() {
    const list = this.shadowRoot.getElementById('occupant-list');
    const profiles = {
      'normal': { label: 'Normal', color: '#3b82f6' },
      'elderly': { label: 'Lansia', color: '#f59e0b' },
      'child': { label: 'Anak', color: '#10b981' },
      'disabled': { label: 'Disabilitas', color: '#ef4444' }
    };
    
    if (this.engine.agents.length === 0) {
      list.innerHTML = `
        <div style="text-align: center; color: #737373; padding: 20px; font-size: 12px;">
          Belum ada occupant. Import dari arsitektur atau tambahkan manual.
        </div>
      `;
      return;
    }
    
    list.innerHTML = this.engine.agents.map((a, i) => `
      <div class="occupant-item">
        <div class="color-dot" style="background: ${profiles[a.profile].color}"></div>
        <span style="flex: 1; font-weight: 500;">Occupant ${i + 1}</span>
        <span style="color: #737373; font-size: 11px;">${profiles[a.profile].label}</span>
      </div>
    `).join('');
  }

  generateReport() {
    const results = this.engine.generateResults();
    
    // Dispatch event untuk report generator
    window.dispatchEvent(new CustomEvent('evacuation-report-request', {
      detail: results
    }));
    
    showSuccess('Laporan evakuasi sedang dibuat...');
  }

  clearAll() {
    // Clear agents
    this.engine.agents.forEach(a => {
      if (a.mesh) {
        this.scene.remove(a.mesh);
      }
    });
    this.engine.reset();
    this.agentMeshes.clear();
    
    // Clear UI
    this.updateStats();
    this.updateOccupantList();
    
    this.shadowRoot.getElementById('rset-display').style.display = 'none';
    this.shadowRoot.getElementById('btn-report').style.display = 'none';
    
    showInfo('Scene cleared');
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    
    // Update agent positions jika sedang simulasi
    if (this.isSimulating) {
      this.engine.agents.forEach(agent => {
        if (agent.mesh && agent.exitTime === null) {
          agent.mesh.position.copy(agent.position);
        }
      });
    }
    
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  disconnectedCallback() {
    // Cleanup
    if (this.engine) {
      this.engine.stop();
    }
  }
}

// Define custom element
customElements.define('evacuation-designer', EvacuationDesigner);

export default { EvacuationDesigner };
