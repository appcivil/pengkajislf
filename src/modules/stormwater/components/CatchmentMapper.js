/**
 * CatchmentMapper - Interactive Catchment Delineation Component
 * Komponen untuk menggambar dan mengelola catchment area dengan visualisasi Konva.js
 */

export class CatchmentMapper extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.catchments = [];
    this.subcatchments = [];
    this.stage = null;
    this.layer = null;
    this.mapLayer = null;
    this.selectedTool = 'select';
    this.buildingFootprints = [];
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <style>
        :host { 
          display: block; 
          width: 100%; 
          height: 100%; 
          background: #0f172a; 
          position: relative; 
          overflow: hidden;
        }
        #container { 
          width: 100%; 
          height: 100%; 
        }
        .toolbar {
          position: absolute; 
          top: 10px; 
          left: 10px;
          background: rgba(30, 41, 59, 0.95); 
          padding: 12px;
          border-radius: 12px; 
          display: flex; 
          gap: 8px; 
          flex-direction: column;
          border: 1px solid rgba(255,255,255,0.1);
          backdrop-filter: blur(10px);
          z-index: 100;
        }
        .tool-btn {
          padding: 10px 14px; 
          background: rgba(255,255,255,0.08);
          color: #e2e8f0; 
          border: none; 
          border-radius: 8px;
          cursor: pointer; 
          font-size: 12px; 
          text-align: left;
          display: flex; 
          align-items: center; 
          gap: 10px;
          transition: all 0.2s;
          font-family: 'Inter', sans-serif;
        }
        .tool-btn:hover { 
          background: rgba(255,255,255,0.15); 
        }
        .tool-btn.active {
          background: rgba(59, 130, 246, 0.3);
          border: 1px solid rgba(59, 130, 246, 0.5);
          color: #60a5fa;
        }
        .tool-btn i {
          font-size: 14px;
          width: 16px;
          text-align: center;
        }
        .panel {
          position: absolute; 
          right: 10px; 
          top: 10px; 
          width: 320px;
          background: rgba(30, 41, 59, 0.95); 
          padding: 16px;
          border-radius: 12px; 
          color: #e2e8f0; 
          border: 1px solid rgba(255,255,255,0.1);
          backdrop-filter: blur(10px);
          z-index: 100;
          max-height: calc(100% - 40px);
          overflow-y: auto;
        }
        .panel::-webkit-scrollbar {
          width: 6px;
        }
        .panel::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.2);
          border-radius: 3px;
        }
        h3 { 
          margin: 0 0 12px; 
          color: #60a5fa; 
          font-size: 14px; 
          font-weight: 600;
        }
        .stat { 
          display: flex; 
          justify-content: space-between; 
          margin: 8px 0; 
          font-size: 12px;
          padding: 6px 0;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .stat:last-child {
          border-bottom: none;
        }
        .value { 
          color: #34d399; 
          font-weight: 600;
          font-family: 'JetBrains Mono', monospace;
        }
        .divider {
          width: 100%; 
          height: 1px; 
          background: rgba(255,255,255,0.1);
          margin: 10px 0;
        }
        .legend {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 12px;
        }
        .legend-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          color: #94a3b8;
        }
        .legend-color {
          width: 12px;
          height: 12px;
          border-radius: 3px;
        }
        .catchment-list {
          margin-top: 12px;
        }
        .catchment-item {
          background: rgba(255,255,255,0.05);
          padding: 8px 12px;
          border-radius: 6px;
          margin-bottom: 6px;
          font-size: 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          transition: all 0.2s;
        }
        .catchment-item:hover {
          background: rgba(255,255,255,0.1);
        }
        .catchment-item.selected {
          border: 1px solid #3b82f6;
        }
        .delete-btn {
          color: #ef4444;
          cursor: pointer;
          padding: 2px 6px;
          border-radius: 3px;
        }
        .delete-btn:hover {
          background: rgba(239, 68, 68, 0.2);
        }
        .input-group {
          margin-bottom: 12px;
        }
        .input-group label {
          display: block;
          font-size: 11px;
          color: #94a3b8;
          margin-bottom: 4px;
        }
        .input-group input, .input-group select {
          width: 100%;
          padding: 8px 10px;
          background: rgba(15, 23, 42, 0.8);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 6px;
          color: #e2e8f0;
          font-size: 12px;
        }
        .input-group input:focus, .input-group select:focus {
          outline: none;
          border-color: #3b82f6;
        }
        .btn-primary {
          width: 100%;
          padding: 10px;
          background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          font-size: 12px;
          margin-top: 10px;
        }
        .btn-primary:hover {
          opacity: 0.9;
        }
        .btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .results-panel {
          display: none;
        }
        .results-panel.show {
          display: block;
        }
        .chart-container {
          height: 150px;
          background: rgba(15, 23, 42, 0.8);
          border-radius: 8px;
          margin-top: 12px;
          position: relative;
          overflow: hidden;
        }
        .notification {
          position: absolute;
          top: 10px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(30, 41, 59, 0.95);
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 12px;
          color: #e2e8f0;
          border: 1px solid rgba(255,255,255,0.1);
          z-index: 200;
          display: none;
        }
        .notification.show {
          display: block;
          animation: fadeIn 0.3s;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateX(-50%) translateY(-10px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      </style>

      <div class="notification" id="notification"></div>

      <div class="toolbar">
        <div style="font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Tools</div>
        <button class="tool-btn ${this.selectedTool === 'select' ? 'active' : ''}" id="btn-select" data-tool="select">
          <i class="fas fa-mouse-pointer"></i> Select
        </button>
        <button class="tool-btn" id="btn-auto" data-tool="auto">
          <i class="fas fa-magic"></i> Auto Delineate
        </button>
        <button class="tool-btn" id="btn-roof" data-tool="roof">
          <i class="fas fa-home"></i> Roof Area
        </button>
        <button class="tool-btn" id="btn-pavement" data-tool="pavement">
          <i class="fas fa-road"></i> Pavement
        </button>
        <button class="tool-btn" id="btn-green" data-tool="green">
          <i class="fas fa-leaf"></i> Green Space
        </button>
        <button class="tool-btn" id="btn-lid" data-tool="lid">
          <i class="fas fa-cloud-rain"></i> LID Control
        </button>
        <div class="divider"></div>
        <div style="font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Simulation</div>
        <button class="tool-btn" id="btn-rain">
          <i class="fas fa-cloud-showers-heavy"></i> Design Storm
        </button>
        <button class="tool-btn" id="btn-run" style="background: rgba(16, 185, 129, 0.2); color: #34d399;">
          <i class="fas fa-play"></i> Run Simulation
        </button>
      </div>

      <div class="panel" id="properties-panel">
        <h3><i class="fas fa-layer-group" style="margin-right: 8px;"></i>Catchment Properties</h3>
        <div id="catchment-properties">
          <p style="font-size: 12px; color: #64748b; text-align: center; padding: 20px;">
            Select a catchment to edit properties
          </p>
        </div>
      </div>

      <div class="panel results-panel" id="results-panel" style="right: 340px;">
        <h3><i class="fas fa-chart-bar" style="margin-right: 8px;"></i>Simulation Results</h3>
        <div class="stat"><span>Peak Runoff:</span><span class="value" id="peak-runoff">0 m³/s</span></div>
        <div class="stat"><span>Total Volume:</span><span class="value" id="total-vol">0 m³</span></div>
        <div class="stat"><span>Flood Events:</span><span class="value" id="flood-count">0</span></div>
        <div class="stat"><span>LID Capture:</span><span class="value" id="lid-capture">0%</span></div>
        
        <div class="legend">
          <div class="legend-item"><div class="legend-color" style="background: #64748b;"></div>Roof</div>
          <div class="legend-item"><div class="legend-color" style="background: #475569;"></div>Pavement</div>
          <div class="legend-item"><div class="legend-color" style="background: #10b981;"></div>Green</div>
          <div class="legend-item"><div class="legend-color" style="background: #3b82f6;"></div>LID</div>
        </div>

        <div class="chart-container" id="hydrograph-chart">
          <!-- Hydrograph will be drawn here -->
        </div>
      </div>

      <div id="container"></div>
    `;

    this.initKonva();
    this.setupEvents();
    this.loadBuildingData();
  }

  async initKonva() {
    // Dynamically import Konva
    const Konva = await import('https://unpkg.com/konva@9.2.0/konva.min.js');
    this.Konva = Konva.default || Konva;

    const container = this.shadowRoot.getElementById('container');
    this.stage = new this.Konva.Stage({
      container: container,
      width: container.clientWidth,
      height: container.clientHeight,
      draggable: true
    });

    // Grid layer
    this.gridLayer = new this.Konva.Layer();
    this.drawGrid();
    this.stage.add(this.gridLayer);

    // Map layer for building footprints
    this.mapLayer = new this.Konva.Layer();
    this.stage.add(this.mapLayer);

    // Main layer for catchments
    this.layer = new this.Konva.Layer();
    this.stage.add(this.layer);

    // UI layer for tooltips
    this.uiLayer = new this.Konva.Layer();
    this.stage.add(this.uiLayer);

    // Handle window resize
    window.addEventListener('resize', () => {
      this.stage.width(container.clientWidth);
      this.stage.height(container.clientHeight);
      this.drawGrid();
    });
  }

  drawGrid() {
    if (!this.gridLayer) return;
    this.gridLayer.destroyChildren();

    const gridSize = 20;
    const width = this.stage.width();
    const height = this.stage.height();

    for (let x = 0; x <= width; x += gridSize) {
      this.gridLayer.add(new this.Konva.Line({
        points: [x, 0, x, height],
        stroke: 'rgba(255,255,255,0.03)',
        strokeWidth: 1
      }));
    }

    for (let y = 0; y <= height; y += gridSize) {
      this.gridLayer.add(new this.Konva.Line({
        points: [0, y, width, y],
        stroke: 'rgba(255,255,255,0.03)',
        strokeWidth: 1
      }));
    }

    this.gridLayer.batchDraw();
  }

  setupEvents() {
    // Tool buttons
    this.shadowRoot.querySelectorAll('.tool-btn[data-tool]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.setTool(e.currentTarget.dataset.tool);
      });
    });

    // Action buttons
    this.shadowRoot.getElementById('btn-auto').addEventListener('click', () => {
      this.autoDelineateFromBuilding();
    });

    this.shadowRoot.getElementById('btn-run').addEventListener('click', async () => {
      await this.runSimulation();
    });

    this.shadowRoot.getElementById('btn-rain').addEventListener('click', () => {
      this.showDesignStormDialog();
    });

    // Stage click for drawing
    if (this.stage) {
      this.stage.on('click', (e) => {
        if (e.target === this.stage || e.target === this.gridLayer) {
          this.handleStageClick(e);
        }
      });
    }
  }

  setTool(tool) {
    this.selectedTool = tool;
    this.shadowRoot.querySelectorAll('.tool-btn[data-tool]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tool === tool);
    });
    this.showNotification(`Tool: ${tool}`);
  }

  handleStageClick(e) {
    if (this.selectedTool === 'select') return;

    const pos = this.stage.getPointerPosition();
    if (!pos) return;

    switch (this.selectedTool) {
      case 'roof':
        this.addCatchmentAt(pos.x, pos.y, 'roof');
        break;
      case 'pavement':
        this.addCatchmentAt(pos.x, pos.y, 'pavement');
        break;
      case 'green':
        this.addCatchmentAt(pos.x, pos.y, 'green');
        break;
      case 'lid':
        this.addLIDAt(pos.x, pos.y);
        break;
    }
  }

  addCatchmentAt(x, y, type) {
    const configs = {
      roof: { name: 'Roof Area', color: '#64748b', cn: 98 },
      pavement: { name: 'Pavement', color: '#475569', cn: 96 },
      green: { name: 'Green Space', color: '#10b981', cn: 74 }
    };

    const config = configs[type];
    const id = `${type}_${Date.now()}`;

    this.addCatchment({
      id,
      name: config.name,
      type,
      area: 100,
      cn: config.cn,
      color: config.color,
      x,
      y
    });
  }

  addLIDAt(x, y) {
    const id = `lid_${Date.now()}`;
    this.addCatchment({
      id,
      name: 'LID Control',
      type: 'lid',
      area: 50,
      cn: 70,
      color: '#3b82f6',
      x,
      y,
      isLID: true,
      lidType: 'Rain Garden'
    });
  }

  showNotification(message) {
    const notif = this.shadowRoot.getElementById('notification');
    notif.textContent = message;
    notif.classList.add('show');
    setTimeout(() => notif.classList.remove('show'), 2000);
  }

  loadBuildingData() {
    // Try to get data from app state or localStorage
    try {
      const archData = localStorage.getItem('architecturalData');
      if (archData) {
        const data = JSON.parse(archData);
        if (data.floorPlans) {
          this.drawBuildingFootprint(data.floorPlans);
        }
      }
    } catch (e) {
      console.warn('Could not load building data:', e);
    }
  }

  drawBuildingFootprint(floorPlans) {
    if (!this.Konva) return;

    const centerX = this.stage.width() / 2;
    const centerY = this.stage.height() / 2;

    floorPlans.forEach((plan, i) => {
      if (!plan.points) return;

      const points = plan.points.flatMap(p => [p.x + centerX, p.y + centerY]);

      const building = new this.Konva.Line({
        points: points,
        closed: true,
        fill: 'rgba(148, 163, 184, 0.2)',
        stroke: '#94a3b8',
        strokeWidth: 2
      });

      this.mapLayer.add(building);

      // Store footprint data
      this.buildingFootprints.push({
        id: `footprint_${i}`,
        points: plan.points,
        area: this.calculateArea(plan.points)
      });
    });

    this.mapLayer.batchDraw();
  }

  autoDelineateFromBuilding() {
    if (this.buildingFootprints.length === 0) {
      this.showNotification('No building data available');
      return;
    }

    // Create catchments from building footprints
    this.buildingFootprints.forEach((footprint, i) => {
      const centerX = this.stage.width() / 2;
      const centerY = this.stage.height() / 2;

      // Calculate centroid
      let cx = 0, cy = 0;
      footprint.points.forEach(p => {
        cx += p.x;
        cy += p.y;
      });
      cx = cx / footprint.points.length + centerX;
      cy = cy / footprint.points.length + centerY;

      // Add roof catchment
      this.addCatchment({
        id: `auto_roof_${i}`,
        name: `Roof ${i + 1}`,
        type: 'roof',
        area: footprint.area,
        cn: 98,
        color: '#64748b',
        x: cx,
        y: cy,
        footprint: footprint
      });
    });

    // Add surrounding areas
    this.addSurroundingCatchments();
    this.showNotification(`Auto-delineated ${this.buildingFootprints.length} roof areas`);
  }

  addSurroundingCatchments() {
    const totalBuildingArea = this.buildingFootprints.reduce((a, f) => a + f.area, 0);
    const siteArea = totalBuildingArea * 1.5; // Assume site is 1.5x building
    const landscapeArea = siteArea - totalBuildingArea;

    // Add driveway/pavement (30% of remaining)
    const drivewayArea = landscapeArea * 0.3;
    this.addCatchment({
      id: 'auto_driveway',
      name: 'Driveway & Parking',
      type: 'pavement',
      area: drivewayArea,
      cn: 96,
      color: '#475569',
      x: this.stage.width() / 2 + 200,
      y: this.stage.height() / 2
    });

    // Add green space (70% of remaining)
    const greenArea = landscapeArea * 0.7;
    this.addCatchment({
      id: 'auto_green',
      name: 'Landscape Areas',
      type: 'green',
      area: greenArea,
      cn: 74,
      color: '#10b981',
      x: this.stage.width() / 2 - 200,
      y: this.stage.height() / 2
    });
  }

  addCatchment(data) {
    if (!this.Konva) return;

    const x = data.x || 100 + (this.catchments.length * 150) % (this.stage.width() - 200);
    const y = data.y || 100 + Math.floor(this.catchments.length / 4) * 120;

    const group = new this.Konva.Group({
      x,
      y,
      draggable: true,
      id: data.id
    });

    // Visual representation
    const width = Math.min(120, Math.sqrt(data.area) * 2);
    const height = width * 0.8;

    const rect = new this.Konva.Rect({
      width,
      height,
      fill: data.color,
      opacity: 0.7,
      cornerRadius: 8,
      stroke: '#fff',
      strokeWidth: 1
    });

    const text = new this.Konva.Text({
      text: `${data.name}\n${data.area.toFixed(0)} m²\nCN: ${data.cn}`,
      fontSize: 10,
      fill: '#fff',
      padding: 5,
      width,
      align: 'center',
      y: height / 2 - 20
    });

    group.add(rect, text);

    // Selection indicator
    const selection = new this.Konva.Rect({
      width: width + 6,
      height: height + 6,
      stroke: '#3b82f6',
      strokeWidth: 2,
      cornerRadius: 10,
      x: -3,
      y: -3,
      visible: false
    });
    group.add(selection);

    // Events
    group.on('click', () => {
      this.selectCatchment(data.id);
    });

    group.on('dragend', () => {
      data.x = group.x();
      data.y = group.y();
    });

    this.layer.add(group);
    this.layer.batchDraw();

    // Store data
    data.konvaGroup = group;
    data.konvaSelection = selection;
    this.catchments.push(data);

    this.updateCatchmentList();
  }

  selectCatchment(id) {
    // Deselect all
    this.catchments.forEach(c => {
      if (c.konvaSelection) c.konvaSelection.visible(false);
    });

    // Select target
    const catchment = this.catchments.find(c => c.id === id);
    if (catchment && catchment.konvaSelection) {
      catchment.konvaSelection.visible(true);
      this.layer.batchDraw();
      this.showCatchmentProperties(catchment);
    }
  }

  showCatchmentProperties(catchment) {
    const container = this.shadowRoot.getElementById('catchment-properties');

    container.innerHTML = `
      <div class="input-group">
        <label>Name</label>
        <input type="text" id="prop-name" value="${catchment.name}">
      </div>
      <div class="input-group">
        <label>Area (m²)</label>
        <input type="number" id="prop-area" value="${catchment.area}">
      </div>
      <div class="input-group">
        <label>Curve Number</label>
        <input type="number" id="prop-cn" value="${catchment.cn}" min="30" max="100">
      </div>
      <div class="input-group">
        <label>Type</label>
        <select id="prop-type">
          <option value="roof" ${catchment.type === 'roof' ? 'selected' : ''}>Roof</option>
          <option value="pavement" ${catchment.type === 'pavement' ? 'selected' : ''}>Pavement</option>
          <option value="green" ${catchment.type === 'green' ? 'selected' : ''}>Green Space</option>
          <option value="lid" ${catchment.type === 'lid' ? 'selected' : ''}>LID Control</option>
        </select>
      </div>
      ${catchment.type === 'lid' ? `
      <div class="input-group">
        <label>LID Type</label>
        <select id="prop-lid-type">
          <option value="Rain Garden" ${catchment.lidType === 'Rain Garden' ? 'selected' : ''}>Rain Garden</option>
          <option value="Green Roof" ${catchment.lidType === 'Green Roof' ? 'selected' : ''}>Green Roof</option>
          <option value="Permeable Pavement" ${catchment.lidType === 'Permeable Pavement' ? 'selected' : ''}>Permeable Pavement</option>
          <option value="Bioswale" ${catchment.lidType === 'Bioswale' ? 'selected' : ''}>Bioswale</option>
          <option value="Detention Pond" ${catchment.lidType === 'Detention Pond' ? 'selected' : ''}>Detention Pond</option>
        </select>
      </div>
      ` : ''}
      <button class="btn-primary" id="btn-update">Update Properties</button>
      <button class="btn-primary" style="background: rgba(239, 68, 68, 0.8);" id="btn-delete">Delete Catchment</button>
    `;

    // Bind update button
    container.querySelector('#btn-update').addEventListener('click', () => {
      catchment.name = container.querySelector('#prop-name').value;
      catchment.area = parseFloat(container.querySelector('#prop-area').value);
      catchment.cn = parseInt(container.querySelector('#prop-cn').value);
      catchment.type = container.querySelector('#prop-type').value;

      if (catchment.type === 'lid') {
        catchment.lidType = container.querySelector('#prop-lid-type').value;
      }

      this.updateCatchmentVisual(catchment);
      this.updateCatchmentList();
      this.showNotification('Properties updated');
    });

    container.querySelector('#btn-delete').addEventListener('click', () => {
      this.deleteCatchment(catchment.id);
    });
  }

  updateCatchmentVisual(catchment) {
    if (!catchment.konvaGroup) return;

    const colors = {
      roof: '#64748b',
      pavement: '#475569',
      green: '#10b981',
      lid: '#3b82f6'
    };

    const rect = catchment.konvaGroup.children[0];
    const text = catchment.konvaGroup.children[1];

    rect.fill(colors[catchment.type] || catchment.color);
    text.text(`${catchment.name}\n${catchment.area.toFixed(0)} m²\nCN: ${catchment.cn}`);

    this.layer.batchDraw();
  }

  deleteCatchment(id) {
    const idx = this.catchments.findIndex(c => c.id === id);
    if (idx >= 0) {
      const catchment = this.catchments[idx];
      if (catchment.konvaGroup) {
        catchment.konvaGroup.destroy();
        this.layer.batchDraw();
      }
      this.catchments.splice(idx, 1);
      this.updateCatchmentList();

      // Clear properties panel
      this.shadowRoot.getElementById('catchment-properties').innerHTML = `
        <p style="font-size: 12px; color: #64748b; text-align: center; padding: 20px;">
          Select a catchment to edit properties
        </p>
      `;
    }
  }

  updateCatchmentList() {
    // Update panel with catchment list
    const panel = this.shadowRoot.getElementById('properties-panel');

    // Keep the header and properties section
    const existingContent = panel.querySelector('#catchment-properties');

    // Add catchment list if not exists
    let listContainer = panel.querySelector('.catchment-list');
    if (!listContainer) {
      listContainer = document.createElement('div');
      listContainer.className = 'catchment-list';
      panel.appendChild(listContainer);
    }

    listContainer.innerHTML = this.catchments.map(c => `
      <div class="catchment-item ${c.selected ? 'selected' : ''}" data-id="${c.id}">
        <div>
          <div style="font-weight: 500;">${c.name}</div>
          <div style="font-size: 10px; color: #64748b;">${c.area.toFixed(0)} m² • CN ${c.cn}</div>
        </div>
        <span class="delete-btn" data-delete="${c.id}"><i class="fas fa-trash"></i></span>
      </div>
    `).join('');

    // Bind list events
    listContainer.querySelectorAll('.catchment-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if (!e.target.closest('.delete-btn')) {
          this.selectCatchment(item.dataset.id);
        }
      });
    });

    listContainer.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.deleteCatchment(btn.dataset.delete);
      });
    });
  }

  async runSimulation() {
    if (this.catchments.length === 0) {
      this.showNotification('Add catchments first');
      return;
    }

    this.showNotification('Running simulation...');

    // Import engines dynamically
    const { StormwaterEngine } = await import('../core/StormwaterEngine.js');
    const engine = new StormwaterEngine();

    // Configure simulation
    const config = {
      city: 'Jakarta',
      returnPeriod: 25,
      duration: 120,
      timestep: 5,
      stormType: 'SCS Type II',
      catchments: this.catchments.map(c => ({
        id: c.id,
        area: c.area,
        curveNumber: c.cn,
        landUse: c.type,
        flowLength: 100,
        slope: 0.01
      })),
      lidSystems: this.catchments
        .filter(c => c.type === 'lid')
        .map(c => ({
          type: c.lidType || 'Rain Garden',
          area: c.area,
          sourceId: c.id
        }))
    };

    // Run simulation
    const results = engine.runSimulation(config);

    // Display results
    this.displayResults(results);

    // Dispatch event for other components
    this.dispatchEvent(new CustomEvent('simulation-complete', {
      detail: results,
      bubbles: true,
      composed: true
    }));
  }

  displayResults(results) {
    const panel = this.shadowRoot.getElementById('results-panel');
    panel.classList.add('show');

    this.shadowRoot.getElementById('peak-runoff').textContent =
      `${(results.summary.peakOutflow || 0).toFixed(3)} m³/s`;
    this.shadowRoot.getElementById('total-vol').textContent =
      `${(results.summary.totalOutflow || 0).toFixed(1)} m³`;
    this.shadowRoot.getElementById('flood-count').textContent =
      results.routing?.channels?.filter(c => c.flooding > 0).length || 0;
    this.shadowRoot.getElementById('lid-capture').textContent =
      `${((results.summary.volumeReduction || 0) * 100).toFixed(0)}%`;

    // Draw hydrograph
    this.drawHydrograph(results.catchments[0]?.hydrograph || []);
  }

  drawHydrograph(data) {
    const container = this.shadowRoot.getElementById('hydrograph-chart');
    if (!data || data.length === 0) {
      container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#64748b;font-size:12px;">No data</div>';
      return;
    }

    const maxFlow = Math.max(...data.map(d => d.flow), 0.001);
    const width = container.clientWidth;
    const height = container.clientHeight;
    const padding = 20;

    // Create SVG
    const points = data.map((d, i) => {
      const x = padding + (i / (data.length - 1)) * (width - 2 * padding);
      const y = height - padding - (d.flow / maxFlow) * (height - 2 * padding);
      return `${x},${y}`;
    }).join(' ');

    container.innerHTML = `
      <svg width="100%" height="100%" style="overflow:visible;">
        <!-- Grid lines -->
        <line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}" stroke="rgba(255,255,255,0.1)" />
        <line x1="${padding}" y1="${padding}" x2="${padding}" y2="${height - padding}" stroke="rgba(255,255,255,0.1)" />
        
        <!-- Hydrograph line -->
        <polyline points="${points}" fill="none" stroke="#3b82f6" stroke-width="2" />
        
        <!-- Area fill -->
        <polygon points="${padding},${height - padding} ${points} ${width - padding},${height - padding}" 
          fill="rgba(59, 130, 246, 0.2)" />
        
        <!-- Labels -->
        <text x="${width - padding}" y="${height - 5}" fill="#64748b" font-size="10" text-anchor="end">Time</text>
        <text x="10" y="${padding}" fill="#64748b" font-size="10">Qmax: ${maxFlow.toFixed(3)}</text>
      </svg>
    `;
  }

  showDesignStormDialog() {
    // Dispatch event to parent for modal handling
    this.dispatchEvent(new CustomEvent('show-design-storm', {
      bubbles: true,
      composed: true
    }));
  }

  calculateArea(points) {
    // Shoelace formula
    let area = 0;
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      area += points[i].x * points[j].y;
      area -= points[j].x * points[i].y;
    }
    return Math.abs(area) / 2;
  }

  getCatchments() {
    return this.catchments.map(c => ({
      id: c.id,
      name: c.name,
      type: c.type,
      area: c.area,
      cn: c.cn,
      lidType: c.lidType
    }));
  }
}

// Register custom element
customElements.define('catchment-mapper', CatchmentMapper);

export default CatchmentMapper;
