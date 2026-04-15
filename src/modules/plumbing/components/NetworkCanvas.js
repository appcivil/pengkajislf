// ============================================================
// NETWORK CANVAS - WaterCAD-style 2D Interface
// Interactive Hydraulic Network Builder
// ============================================================

import { HydraulicEngine } from '../core/HydraulicEngine.js';
import { globalEventBus } from '../../../core/EventBus.js';

export class NetworkCanvas extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.engine = new HydraulicEngine();
    this.nodes = [];
    this.pipes = [];
    this.selectedTool = 'select';
    this.isDragging = false;
    this.tempLine = null;
    this.sourceNode = null;
    this.canvas = null;
    this.ctx = null;
    this.scale = 1;
    this.offsetX = 0;
    this.offsetY = 0;
    this.isPanning = false;
    this.lastPanX = 0;
    this.lastPanY = 0;
    this.gridSize = 20;
  }

  connectedCallback() {
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
        #canvas-container { 
          width: 100%; 
          height: 100%; 
          cursor: crosshair;
          position: relative;
        }
        #network-canvas {
          display: block;
        }
        .toolbar {
          position: absolute; 
          top: 12px; 
          left: 12px;
          background: rgba(15, 23, 42, 0.95); 
          backdrop-filter: blur(12px);
          padding: 10px; 
          border-radius: 12px; 
          display: flex; 
          gap: 6px;
          border: 1px solid rgba(59, 130, 246, 0.2); 
          z-index: 100;
          box-shadow: 0 4px 20px rgba(0,0,0,0.3);
          flex-wrap: wrap;
          max-width: 300px;
        }
        .tool-btn {
          width: 38px; 
          height: 38px; 
          border: 2px solid transparent;
          background: rgba(255,255,255,0.05); 
          color: #94a3b8;
          border-radius: 8px; 
          cursor: pointer; 
          font-size: 16px;
          transition: all 0.2s; 
          display: flex; 
          align-items: center; 
          justify-content: center;
        }
        .tool-btn:hover { 
          background: rgba(59, 130, 246, 0.2); 
          color: white;
          transform: translateY(-1px);
        }
        .tool-btn.active { 
          border-color: #3b82f6; 
          background: rgba(59, 130, 246, 0.25); 
          color: white;
          box-shadow: 0 0 10px rgba(59, 130, 246, 0.3);
        }
        .tool-divider {
          width: 1px; 
          background: rgba(255,255,255,0.1); 
          margin: 0 4px;
        }
        .info-panel {
          position: absolute; 
          bottom: 12px; 
          left: 12px;
          background: rgba(15, 23, 42, 0.95); 
          color: #e2e8f0;
          padding: 12px 16px; 
          border-radius: 10px; 
          font-family: 'JetBrains Mono', monospace; 
          font-size: 11px;
          border: 1px solid rgba(59, 130, 246, 0.2);
          backdrop-filter: blur(10px);
          z-index: 100;
        }
        .legend {
          position: absolute; 
          top: 12px; 
          right: 12px;
          background: rgba(15, 23, 42, 0.95); 
          padding: 14px; 
          border-radius: 12px; 
          border: 1px solid rgba(59, 130, 246, 0.2);
          color: #e2e8f0; 
          font-size: 11px;
          backdrop-filter: blur(12px);
          z-index: 100;
          min-width: 160px;
        }
        .legend h4 { 
          margin: 0 0 10px; 
          font-size: 12px; 
          color: #60a5fa;
          font-weight: 600;
        }
        .legend-item { 
          display: flex; 
          align-items: center; 
          gap: 8px; 
          margin: 5px 0; 
        }
        .legend-color { 
          width: 20px; 
          height: 3px; 
          border-radius: 2px; 
        }
        .controls {
          position: absolute;
          bottom: 12px;
          right: 12px;
          display: flex;
          gap: 6px;
          z-index: 100;
        }
        .control-btn {
          width: 36px;
          height: 36px;
          background: rgba(15, 23, 42, 0.95);
          border: 1px solid rgba(59, 130, 246, 0.2);
          border-radius: 8px;
          color: #94a3b8;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          transition: all 0.2s;
        }
        .control-btn:hover {
          background: rgba(59, 130, 246, 0.2);
          color: white;
        }
        .simulation-overlay {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: rgba(15, 23, 42, 0.98);
          border: 1px solid rgba(59, 130, 246, 0.3);
          border-radius: 16px;
          padding: 24px 32px;
          text-align: center;
          z-index: 200;
          display: none;
          box-shadow: 0 0 40px rgba(59, 130, 246, 0.2);
        }
        .simulation-overlay.show {
          display: block;
        }
        .simulation-spinner {
          width: 48px;
          height: 48px;
          border: 3px solid rgba(59, 130, 246, 0.2);
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 16px;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .node-tooltip {
          position: absolute;
          background: rgba(0,0,0,0.9);
          color: white;
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 11px;
          pointer-events: none;
          z-index: 150;
          display: none;
          border: 1px solid rgba(59, 130, 246, 0.3);
          max-width: 200px;
        }
      </style>

      <div class="toolbar">
        <button class="tool-btn active" data-tool="select" title="Select/Move (V)">🖱️</button>
        <button class="tool-btn" data-tool="junction" title="Junction Node (J)">🔵</button>
        <button class="tool-btn" data-tool="reservoir" title="Reservoir (R)">💧</button>
        <button class="tool-btn" data-tool="tank" title="Storage Tank (T)">🚰</button>
        <button class="tool-btn" data-tool="pump" title="Pump Station (P)">⚡</button>
        <button class="tool-btn" data-tool="pipe" title="Pipe (L)">📏</button>
        <div class="tool-divider"></div>
        <button class="tool-btn" id="btn-auto" title="Auto Generate Network">🔄</button>
        <button class="tool-btn" id="btn-clear" title="Clear All">🗑️</button>
        <button class="tool-btn" id="btn-export" title="Export to EPANET">📤</button>
      </div>

      <div class="legend">
        <h4>💧 Hydraulic Grade</h4>
        <div class="legend-item">
          <div class="legend-color" style="background: #ef4444;"></div>
          <span>High Pressure (&gt;50m)</span>
        </div>
        <div class="legend-item">
          <div class="legend-color" style="background: #f59e0b;"></div>
          <span>Medium (20-50m)</span>
        </div>
        <div class="legend-item">
          <div class="legend-color" style="background: #10b981;"></div>
          <span>Normal (10-20m)</span>
        </div>
        <div class="legend-item">
          <div class="legend-color" style="background: #3b82f6;"></div>
          <span>Low (&lt;10m)</span>
        </div>
        <div class="legend-item" style="margin-top:10px;">
          <div class="legend-color" style="background: #6366f1;"></div>
          <span>Flow Direction →</span>
        </div>
      </div>

      <div id="canvas-container">
        <canvas id="network-canvas"></canvas>
      </div>

      <div class="info-panel" id="info">
        <div>Nodes: <span id="node-count">0</span> | Pipes: <span id="pipe-count">0</span></div>
        <div>Tool: <span id="current-tool">Select</span></div>
        <div style="margin-top:6px; opacity:0.7;">Scale: <span id="scale-display">100%</span></div>
      </div>

      <div class="controls">
        <button class="control-btn" id="btn-zoom-in" title="Zoom In">+</button>
        <button class="control-btn" id="btn-zoom-out" title="Zoom Out">−</button>
        <button class="control-btn" id="btn-fit" title="Fit to View">⊡</button>
      </div>

      <div class="simulation-overlay" id="sim-overlay">
        <div class="simulation-spinner"></div>
        <div style="color: #60a5fa; font-weight: 600;">Running Hydraulic Analysis...</div>
        <div id="sim-status" style="color: #94a3b8; font-size: 12px; margin-top: 8px;">Initializing...</div>
      </div>

      <div class="node-tooltip" id="tooltip"></div>
    `;

    this.initCanvas();
    this.setupToolbar();
    this.setupControls();
    this.setupKeyboardShortcuts();
    this.loadArchitectureData();
  }

  initCanvas() {
    const container = this.shadowRoot.getElementById('canvas-container');
    this.canvas = this.shadowRoot.getElementById('network-canvas');
    this.ctx = this.canvas.getContext('2d');

    const resize = () => {
      this.canvas.width = container.clientWidth;
      this.canvas.height = container.clientHeight;
      this.draw();
    };
    resize();
    new ResizeObserver(resize).observe(container);

    // Canvas events
    this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
    this.canvas.addEventListener('wheel', (e) => this.handleWheel(e));
    this.canvas.addEventListener('dblclick', (e) => this.handleDoubleClick(e));
    this.canvas.addEventListener('contextmenu', (e) => { e.preventDefault(); this.handleRightClick(e); });
  }

  setupToolbar() {
    const buttons = this.shadowRoot.querySelectorAll('.tool-btn[data-tool]');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        buttons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.selectedTool = btn.dataset.tool;
        this.sourceNode = null;
        this.updateInfo();
      });
    });

    this.shadowRoot.getElementById('btn-auto').addEventListener('click', () => this.generateAutoNetwork());
    this.shadowRoot.getElementById('btn-clear').addEventListener('click', () => this.clearNetwork());
    this.shadowRoot.getElementById('btn-export').addEventListener('click', () => this.exportNetwork());
  }

  setupControls() {
    this.shadowRoot.getElementById('btn-zoom-in').addEventListener('click', () => this.zoom(1.2));
    this.shadowRoot.getElementById('btn-zoom-out').addEventListener('click', () => this.zoom(0.8));
    this.shadowRoot.getElementById('btn-fit').addEventListener('click', () => this.fitToView());
  }

  setupKeyboardShortcuts() {
    this.canvas.tabIndex = 0;
    this.canvas.addEventListener('keydown', (e) => {
      switch(e.key.toLowerCase()) {
        case 'v': this.selectTool('select'); break;
        case 'j': this.selectTool('junction'); break;
        case 'r': this.selectTool('reservoir'); break;
        case 't': this.selectTool('tank'); break;
        case 'p': this.selectTool('pump'); break;
        case 'l': this.selectTool('pipe'); break;
        case 'delete': case 'backspace': this.deleteSelected(); break;
        case '0': this.fitToView(); break;
        case '+': case '=': this.zoom(1.2); break;
        case '-': case '_': this.zoom(0.8); break;
      }
    });
  }

  selectTool(tool) {
    this.selectedTool = tool;
    this.shadowRoot.querySelectorAll('.tool-btn[data-tool]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tool === tool);
    });
    this.sourceNode = null;
    this.updateInfo();
  }

  getMousePos(e) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - this.offsetX) / this.scale,
      y: (e.clientY - rect.top - this.offsetY) / this.scale
    };
  }

  snapToGrid(x, y) {
    return {
      x: Math.round(x / this.gridSize) * this.gridSize,
      y: Math.round(y / this.gridSize) * this.gridSize
    };
  }

  handleMouseDown(e) {
    this.canvas.focus();
    const pos = this.getMousePos(e);
    const snapped = this.snapToGrid(pos.x, pos.y);

    if (e.button === 1 || (e.button === 0 && this.selectedTool === 'select' && e.shiftKey)) {
      // Pan start
      this.isPanning = true;
      this.lastPanX = e.clientX;
      this.lastPanY = e.clientY;
      return;
    }

    if (this.selectedTool === 'select') {
      // Check for node selection
      const clickedNode = this.findNodeAt(pos.x, pos.y);
      if (clickedNode) {
        this.selectedNode = clickedNode;
        this.isDragging = true;
        this.dragStartX = pos.x;
        this.dragStartY = pos.y;
        this.showNodeProperties(clickedNode.id);
      } else {
        this.selectedNode = null;
      }
    } else if (['junction', 'reservoir', 'tank', 'pump'].includes(this.selectedTool)) {
      this.addNode(snapped.x, snapped.y, this.selectedTool);
    } else if (this.selectedTool === 'pipe') {
      const node = this.findNodeAt(pos.x, pos.y);
      if (node) {
        if (!this.sourceNode) {
          this.sourceNode = node;
        } else if (this.sourceNode !== node) {
          this.addPipe(this.sourceNode, node);
          this.sourceNode = null;
        }
      }
    }
    this.draw();
  }

  handleMouseMove(e) {
    const pos = this.getMousePos(e);
    const snapped = this.snapToGrid(pos.x, pos.y);

    if (this.isPanning) {
      const dx = e.clientX - this.lastPanX;
      const dy = e.clientY - this.lastPanY;
      this.offsetX += dx;
      this.offsetY += dy;
      this.lastPanX = e.clientX;
      this.lastPanY = e.clientY;
      this.draw();
      return;
    }

    if (this.isDragging && this.selectedNode) {
      this.selectedNode.x = snapped.x;
      this.selectedNode.y = snapped.y;
      this.updateConnectedPipes(this.selectedNode.id);
      this.draw();
    }

    // Tooltip
    const hoveredNode = this.findNodeAt(pos.x, pos.y);
    const tooltip = this.shadowRoot.getElementById('tooltip');
    if (hoveredNode) {
      tooltip.style.display = 'block';
      tooltip.style.left = (e.clientX + 10) + 'px';
      tooltip.style.top = (e.clientY - 30) + 'px';
      tooltip.innerHTML = `
        <strong>${hoveredNode.id}</strong><br>
        Type: ${hoveredNode.type}<br>
        ${hoveredNode.pressure ? `Pressure: ${hoveredNode.pressure.toFixed(1)} kPa<br>` : ''}
        ${hoveredNode.demand ? `Demand: ${hoveredNode.demand.toFixed(2)} L/s` : ''}
      `;
    } else {
      tooltip.style.display = 'none';
    }

    // Draw temp line for pipe
    if (this.selectedTool === 'pipe' && this.sourceNode) {
      this.tempLine = { x1: this.sourceNode.x, y1: this.sourceNode.y, x2: snapped.x, y2: snapped.y };
      this.draw();
    }
  }

  handleMouseUp(e) {
    this.isDragging = false;
    this.isPanning = false;
    this.tempLine = null;
  }

  handleWheel(e) {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    this.zoom(zoomFactor);
  }

  handleDoubleClick(e) {
    const pos = this.getMousePos(e);
    const node = this.findNodeAt(pos.x, pos.y);
    if (node) {
      this.showNodeProperties(node.id);
    }
  }

  handleRightClick(e) {
    this.sourceNode = null;
    this.selectedNode = null;
    this.tempLine = null;
    this.draw();
  }

  zoom(factor) {
    this.scale = Math.max(0.3, Math.min(3, this.scale * factor));
    this.draw();
    this.updateInfo();
  }

  fitToView() {
    if (this.nodes.length === 0) return;
    const bounds = this.getBounds();
    const padding = 50;
    const scaleX = (this.canvas.width - padding * 2) / (bounds.maxX - bounds.minX);
    const scaleY = (this.canvas.height - padding * 2) / (bounds.maxY - bounds.minY);
    this.scale = Math.min(scaleX, scaleY, 1.5);
    this.offsetX = -bounds.minX * this.scale + padding;
    this.offsetY = -bounds.minY * this.scale + padding;
    this.draw();
    this.updateInfo();
  }

  getBounds() {
    if (this.nodes.length === 0) return { minX: 0, maxX: 800, minY: 0, maxY: 600 };
    const xs = this.nodes.map(n => n.x);
    const ys = this.nodes.map(n => n.y);
    return {
      minX: Math.min(...xs) - 50,
      maxX: Math.max(...xs) + 50,
      minY: Math.min(...ys) - 50,
      maxY: Math.max(...ys) + 50
    };
  }

  findNodeAt(x, y) {
    const threshold = 20 / this.scale;
    return this.nodes.find(n => Math.sqrt((n.x - x) ** 2 + (n.y - y) ** 2) < threshold);
  }

  addNode(x, y, type) {
    const id = `${type}_${this.nodes.length + 1}`;
    const colors = {
      junction: '#3b82f6',
      reservoir: '#60a5fa',
      tank: '#f59e0b',
      pump: '#8b5cf6'
    };
    const sizes = {
      junction: 6,
      reservoir: 14,
      tank: 12,
      pump: 10
    };

    const node = {
      id,
      type,
      x, y,
      color: colors[type],
      size: sizes[type],
      elevation: type === 'reservoir' ? 50 : 0,
      demand: 0,
      head: type === 'reservoir' ? 50 : 0
    };

    this.nodes.push(node);
    this.engine.addNode(id, type, x, y, node.elevation, 0);
    this.updateInfo();
    this.draw();
    return node;
  }

  addPipe(node1, node2) {
    const id = `pipe_${this.pipes.length + 1}`;
    const length = Math.sqrt((node2.x - node1.x) ** 2 + (node2.y - node1.y) ** 2) / 10; // scale 1:10

    const pipe = {
      id,
      node1: node1.id,
      node2: node2.id,
      diameter: 50,
      length,
      material: 'PVC',
      flow: 0,
      velocity: 0,
      headloss: 0,
      color: '#64748b'
    };

    this.pipes.push(pipe);
    this.engine.addPipe(id, node1.id, node2.id, 50, length, { material: 'PVC', roughness: 140 });
    this.updateInfo();
    this.draw();
    return pipe;
  }

  updateConnectedPipes(nodeId) {
    const node = this.nodes.find(n => n.id === nodeId);
    if (!node) return;

    this.pipes.forEach(pipe => {
      if (pipe.node1 === nodeId || pipe.node2 === nodeId) {
        // Update engine data
        const enginePipe = this.engine.pipes.get(pipe.id);
        if (enginePipe) {
          const otherNodeId = pipe.node1 === nodeId ? pipe.node2 : pipe.node1;
          const otherNode = this.nodes.find(n => n.id === otherNodeId);
          if (otherNode) {
            enginePipe.length = Math.sqrt((node.x - otherNode.x) ** 2 + (node.y - otherNode.y) ** 2) / 10;
          }
        }
      }
    });
  }

  deleteSelected() {
    if (this.selectedNode) {
      // Remove connected pipes
      this.pipes = this.pipes.filter(p => p.node1 !== this.selectedNode.id && p.node2 !== this.selectedNode.id);
      // Remove node
      this.nodes = this.nodes.filter(n => n.id !== this.selectedNode.id);
      // Update engine
      this.engine.nodes.delete(this.selectedNode.id);
      this.selectedNode = null;
      this.draw();
      this.updateInfo();
    }
  }

  clearNetwork() {
    if (confirm('Clear all nodes and pipes?')) {
      this.nodes = [];
      this.pipes = [];
      this.engine.nodes.clear();
      this.engine.pipes.clear();
      this.selectedNode = null;
      this.sourceNode = null;
      this.draw();
      this.updateInfo();
    }
  }

  draw() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Clear
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, w, h);

    // Draw grid
    this.drawGrid(ctx);

    ctx.save();
    ctx.translate(this.offsetX, this.offsetY);
    ctx.scale(this.scale, this.scale);

    // Draw temp line
    if (this.tempLine) {
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(this.tempLine.x1, this.tempLine.y1);
      ctx.lineTo(this.tempLine.x2, this.tempLine.y2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw pipes
    this.pipes.forEach(pipe => {
      const n1 = this.nodes.find(n => n.id === pipe.node1);
      const n2 = this.nodes.find(n => n.id === pipe.node2);
      if (!n1 || !n2) return;

      // Color based on flow/headloss
      let strokeColor = pipe.color;
      let lineWidth = 3;
      if (pipe.headloss > 0) {
        if (pipe.headloss > 10) { strokeColor = '#ef4444'; lineWidth = 4; }
        else if (pipe.headloss > 5) { strokeColor = '#f59e0b'; lineWidth = 3; }
        else { strokeColor = '#10b981'; lineWidth = 2; }
      }

      // Draw pipe line
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(n1.x, n1.y);
      ctx.lineTo(n2.x, n2.y);
      ctx.stroke();

      // Draw flow direction arrow
      if (Math.abs(pipe.flow) > 0.01) {
        const midX = (n1.x + n2.x) / 2;
        const midY = (n1.y + n2.y) / 2;
        const angle = Math.atan2(n2.y - n1.y, n2.x - n1.x);
        const arrowLen = 8;
        const arrowAngle = 0.5;

        let arrowAngle1 = angle + Math.PI - arrowAngle;
        let arrowAngle2 = angle + Math.PI + arrowAngle;
        if (pipe.flow < 0) {
          arrowAngle1 = angle - arrowAngle;
          arrowAngle2 = angle + arrowAngle;
        }

        ctx.fillStyle = '#6366f1';
        ctx.beginPath();
        ctx.moveTo(midX + arrowLen * Math.cos(arrowAngle1), midY + arrowLen * Math.sin(arrowAngle1));
        ctx.lineTo(midX, midY);
        ctx.lineTo(midX + arrowLen * Math.cos(arrowAngle2), midY + arrowLen * Math.sin(arrowAngle2));
        ctx.fill();
      }
    });

    // Draw nodes
    this.nodes.forEach(node => {
      // Selection highlight
      if (this.selectedNode?.id === node.id) {
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.size + 4, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Node body
      ctx.fillStyle = node.color;
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.size, 0, Math.PI * 2);
      ctx.fill();

      // Pressure indicator ring
      if (node.pressureHead > 0) {
        let ringColor = '#3b82f6';
        if (node.pressureHead > 50) ringColor = '#ef4444';
        else if (node.pressureHead > 20) ringColor = '#f59e0b';
        else if (node.pressureHead > 10) ringColor = '#10b981';

        ctx.strokeStyle = ringColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.size + 2, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Label
      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px JetBrains Mono';
      ctx.textAlign = 'center';
      ctx.fillText(node.id, node.x, node.y + node.size + 14);
    });

    ctx.restore();
  }

  drawGrid(ctx) {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const gridSize = this.gridSize * this.scale;

    ctx.strokeStyle = 'rgba(59, 130, 246, 0.1)';
    ctx.lineWidth = 1;

    const offsetX = this.offsetX % gridSize;
    const offsetY = this.offsetY % gridSize;

    ctx.beginPath();
    for (let x = offsetX; x < w; x += gridSize) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
    }
    for (let y = offsetY; y < h; y += gridSize) {
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
    }
    ctx.stroke();
  }

  updateInfo() {
    this.shadowRoot.getElementById('node-count').textContent = this.nodes.length;
    this.shadowRoot.getElementById('pipe-count').textContent = this.pipes.length;
    this.shadowRoot.getElementById('current-tool').textContent = 
      this.selectedTool.charAt(0).toUpperCase() + this.selectedTool.slice(1);
    this.shadowRoot.getElementById('scale-display').textContent = Math.round(this.scale * 100) + '%';
  }

  showNodeProperties(id) {
    const node = this.nodes.find(n => n.id === id);
    if (!node) return;
    
    this.dispatchEvent(new CustomEvent('node-selected', {
      detail: { id, node },
      bubbles: true,
      composed: true
    }));
  }

  generateAutoNetwork() {
    // Generate from project data if available
    const projectData = window._currentProjectData;
    if (projectData) {
      const result = this.engine.initializeFromArchitecture({
        floorPlans: projectData.floors || [{}, {}, {}],
        buildingType: projectData.buildingType || 'office'
      });

      // Sync engine nodes/pipes to canvas
      this.syncFromEngine();
      this.fitToView();
      this.updateInfo();
    } else {
      // Create demo network
      this.createDemoNetwork();
    }
  }

  createDemoNetwork() {
    this.clearNetwork();
    
    // Reservoir
    this.addNode(100, 300, 'reservoir');
    // Ground tank
    this.addNode(250, 300, 'tank');
    // Junctions
    this.addNode(400, 200, 'junction');
    this.addNode(400, 400, 'junction');
    this.addNode(550, 250, 'junction');
    this.addNode(550, 350, 'junction');
    // Fixtures
    this.addNode(650, 220, 'junction');
    this.addNode(650, 280, 'junction');
    this.addNode(650, 340, 'junction');
    this.addNode(650, 400, 'junction');

    // Connect
    const find = (t, i) => this.nodes.filter(n => n.type === t)[i];
    this.addPipe(find('reservoir', 0), find('tank', 0));
    this.addPipe(find('tank', 0), find('junction', 0));
    this.addPipe(find('tank', 0), find('junction', 1));
    this.addPipe(find('junction', 0), find('junction', 2));
    this.addPipe(find('junction', 1), find('junction', 3));
    this.addPipe(find('junction', 2), find('junction', 0));
    this.addPipe(find('junction', 2), find('junction', 3));
    this.addPipe(find('junction', 2), this.nodes[6]);
    this.addPipe(find('junction', 2), this.nodes[7]);
    this.addPipe(find('junction', 3), this.nodes[8]);
    this.addPipe(find('junction', 3), this.nodes[9]);

    this.fitToView();
  }

  syncFromEngine() {
    this.nodes = [];
    this.pipes = [];

    for (const [id, node] of this.engine.nodes) {
      this.nodes.push({
        id: node.id,
        type: node.type,
        x: node.x,
        y: node.y,
        elevation: node.elevation,
        demand: node.demand,
        head: node.head,
        pressure: node.pressure,
        pressureHead: node.pressureHead,
        color: this.getNodeColor(node.type),
        size: this.getNodeSize(node.type)
      });
    }

    for (const [id, pipe] of this.engine.pipes) {
      this.pipes.push({
        id: pipe.id,
        node1: pipe.node1,
        node2: pipe.node2,
        diameter: pipe.diameter * 1000,
        length: pipe.length,
        material: pipe.material,
        flow: pipe.flow,
        velocity: pipe.velocity,
        headloss: pipe.headloss,
        color: '#64748b'
      });
    }

    this.draw();
  }

  getNodeColor(type) {
    const colors = { junction: '#3b82f6', reservoir: '#60a5fa', tank: '#f59e0b', pump: '#8b5cf6' };
    return colors[type] || '#3b82f6';
  }

  getNodeSize(type) {
    const sizes = { junction: 6, reservoir: 14, tank: 12, pump: 10 };
    return sizes[type] || 6;
  }

  async runSimulation() {
    const overlay = this.shadowRoot.getElementById('sim-overlay');
    const status = this.shadowRoot.getElementById('sim-status');
    overlay.classList.add('show');

    this.engine.on('solver:progress', (data) => {
      status.textContent = `Iteration ${data.iteration}, Error: ${data.error.toExponential(2)}`;
    });

    try {
      const results = await this.engine.solve();
      
      // Update node pressures
      results.nodes.forEach(rn => {
        const node = this.nodes.find(n => n.id === rn.id);
        if (node) {
          node.pressure = rn.pressure;
          node.pressureHead = rn.pressureHead;
          node.head = rn.head;
        }
      });

      // Update pipe flows
      results.pipes.forEach(rp => {
        const pipe = this.pipes.find(p => p.id === rp.id);
        if (pipe) {
          pipe.flow = rp.flow;
          pipe.velocity = rp.velocity;
          pipe.headloss = rp.headloss;
        }
      });

      this.draw();
      
      // Emit results
      globalEventBus.emit('hydraulic-results', results);
      
      return results;
    } finally {
      overlay.classList.remove('show');
    }
  }

  loadArchitectureData() {
    // Load from global state or localStorage
    const projectId = localStorage.getItem('currentProjectId');
    if (projectId) {
      // Try to load saved network
      const saved = localStorage.getItem(`water_network_${projectId}`);
      if (saved) {
        const data = JSON.parse(saved);
        this.nodes = data.nodes || [];
        this.pipes = data.pipes || [];
        this.draw();
        this.updateInfo();
      }
    }
  }

  getNetworkData() {
    return {
      nodes: this.nodes.map(n => ({
        id: n.id,
        type: n.type,
        x: n.x,
        y: n.y,
        elevation: n.elevation,
        demand: n.demand,
        pressure: n.pressure,
        head: n.head
      })),
      pipes: this.pipes.map(p => ({
        id: p.id,
        node1: p.node1,
        node2: p.node2,
        diameter: p.diameter,
        length: p.length,
        material: p.material,
        flow: p.flow,
        velocity: p.velocity,
        headloss: p.headloss
      }))
    };
  }

  exportNetwork() {
    const inp = this.engine.exportToEPANET();
    const blob = new Blob([inp], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `water_network_${Date.now()}.inp`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

customElements.define('network-canvas', NetworkCanvas);
