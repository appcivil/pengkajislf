/**
 * RoomBuilder - 2D Floor Plan Drawing Tool
 * Web Component for drawing room polygons
 */

export class RoomBuilder extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.points = [];
    this.isDrawing = false;
    this.scale = 0.01; // 1 pixel = 0.01 meter (1cm)
    this.gridSize = 20; // pixels
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <style>
        :host { 
          display: block; 
          width: 100%; 
          height: 100%; 
          position: relative;
        }
        #container { 
          width: 100%; 
          height: 100%; 
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          cursor: crosshair;
        }
        .toolbar {
          position: absolute; 
          top: 12px; 
          left: 12px;
          background: rgba(15, 23, 42, 0.95); 
          padding: 12px;
          border-radius: 12px; 
          display: flex; 
          gap: 8px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.4);
          border: 1px solid rgba(59, 130, 246, 0.3);
          flex-wrap: wrap;
          max-width: calc(100% - 24px);
        }
        button {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: white; 
          border: none;
          padding: 8px 14px; 
          border-radius: 6px; 
          cursor: pointer;
          font-size: 12px;
          font-weight: 500;
          transition: all 0.2s;
          white-space: nowrap;
        }
        button:hover { 
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          transform: translateY(-1px);
        }
        button:active { transform: translateY(0); }
        button.secondary {
          background: rgba(59, 130, 246, 0.15);
          border: 1px solid rgba(59, 130, 246, 0.4);
        }
        button.secondary:hover {
          background: rgba(59, 130, 246, 0.25);
        }
        button.danger {
          background: rgba(239, 68, 68, 0.15);
          border: 1px solid rgba(239, 68, 68, 0.4);
          color: #f87171;
        }
        button.danger:hover {
          background: rgba(239, 68, 68, 0.25);
        }
        button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }
        .info {
          position: absolute; 
          bottom: 12px; 
          left: 12px;
          color: #94a3b8; 
          background: rgba(15, 23, 42, 0.95);
          padding: 10px 14px; 
          border-radius: 8px; 
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          border: 1px solid rgba(59, 130, 246, 0.2);
          max-width: 300px;
        }
        .measurement {
          position: absolute;
          top: 12px;
          right: 12px;
          background: rgba(15, 23, 42, 0.95);
          padding: 12px;
          border-radius: 8px;
          border: 1px solid rgba(59, 130, 246, 0.2);
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          color: #94a3b8;
        }
        .measurement-value {
          color: #34d399;
          font-weight: 600;
          font-size: 13px;
        }
        #svg-container {
          width: 100%;
          height: 100%;
        }
        .room-polygon {
          fill: rgba(16, 185, 129, 0.15);
          stroke: #10b981;
          stroke-width: 2;
        }
        .room-polygon.drawing {
          fill: rgba(59, 130, 246, 0.1);
          stroke: #3b82f6;
          stroke-dasharray: 5,5;
        }
        .vertex {
          fill: #10b981;
          stroke: #fff;
          stroke-width: 2;
          cursor: move;
        }
        .vertex:hover {
          fill: #34d399;
          r: 6;
        }
        .temp-line {
          stroke: #3b82f6;
          stroke-width: 1;
          stroke-dasharray: 5,5;
          fill: none;
        }
        .wall-line {
          stroke: #10b981;
          stroke-width: 3;
          stroke-linecap: round;
        }
        .grid-line {
          stroke: #334155;
          stroke-width: 0.5;
        }
        .dimension-line {
          stroke: #f59e0b;
          stroke-width: 1;
          marker-end: url(#arrow);
          marker-start: url(#arrow);
        }
        .dimension-text {
          fill: #f59e0b;
          font-size: 10px;
          font-family: 'JetBrains Mono', monospace;
          text-anchor: middle;
        }
      </style>
      
      <div id="container">
        <svg id="svg-container">
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5"
                markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#f59e0b" />
            </marker>
          </defs>
          <g id="grid-layer"></g>
          <g id="room-layer"></g>
          <g id="ui-layer"></g>
        </svg>
      </div>
      
      <div class="toolbar">
        <button id="btn-draw">✏️ Draw Room</button>
        <button id="btn-rect" class="secondary">⬜ Rectangle</button>
        <button id="btn-clear" class="danger" disabled>Clear</button>
        <button id="btn-3d">View 3D →</button>
      </div>
      
      <div class="measurement">
        <div>Width: <span class="measurement-value" id="meas-width">0</span> m</div>
        <div>Length: <span class="measurement-value" id="meas-length">0</span> m</div>
        <div>Area: <span class="measurement-value" id="meas-area">0</span> m²</div>
      </div>
      
      <div class="info" id="info">Click to start drawing room</div>
    `;

    this.svg = this.shadowRoot.getElementById('svg-container');
    this.gridLayer = this.shadowRoot.getElementById('grid-layer');
    this.roomLayer = this.shadowRoot.getElementById('room-layer');
    this.uiLayer = this.shadowRoot.getElementById('ui-layer');
    
    this.drawGrid();
    this.setupEvents();
  }

  drawGrid() {
    const width = this.clientWidth || 800;
    const height = this.clientHeight || 600;
    
    this.svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    
    // Clear existing grid
    this.gridLayer.innerHTML = '';
    
    // Draw grid lines
    for (let x = 0; x <= width; x += this.gridSize) {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', x);
      line.setAttribute('y1', 0);
      line.setAttribute('x2', x);
      line.setAttribute('y2', height);
      line.setAttribute('class', 'grid-line');
      this.gridLayer.appendChild(line);
    }
    
    for (let y = 0; y <= height; y += this.gridSize) {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', 0);
      line.setAttribute('y1', y);
      line.setAttribute('x2', width);
      line.setAttribute('y2', y);
      line.setAttribute('class', 'grid-line');
      this.gridLayer.appendChild(line);
    }
  }

  setupEvents() {
    // Drawing events
    this.svg.addEventListener('click', (e) => this.handleClick(e));
    this.svg.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    this.svg.addEventListener('dblclick', (e) => this.handleDoubleClick(e));
    
    // Toolbar buttons
    this.shadowRoot.getElementById('btn-draw').addEventListener('click', () => {
      this.startDrawing();
    });
    
    this.shadowRoot.getElementById('btn-rect').addEventListener('click', () => {
      this.createRectangle();
    });
    
    this.shadowRoot.getElementById('btn-clear').addEventListener('click', () => {
      this.clear();
    });
    
    this.shadowRoot.getElementById('btn-3d').addEventListener('click', () => {
      this.switchTo3D();
    });
    
    // Window resize
    window.addEventListener('resize', () => this.drawGrid());
  }

  getMousePos(e) {
    const rect = this.svg.getBoundingClientRect();
    const x = Math.round((e.clientX - rect.left) / this.gridSize) * this.gridSize;
    const y = Math.round((e.clientY - rect.top) / this.gridSize) * this.gridSize;
    return { x, y };
  }

  handleClick(e) {
    if (!this.isDrawing) return;
    
    const pos = this.getMousePos(e);
    
    if (this.points.length === 0) {
      this.points.push(pos);
      this.updateInfo('Click to add corners, double-click or click near start to finish');
    } else {
      // Check if closing (near start)
      const first = this.points[0];
      const dist = Math.sqrt((pos.x - first.x) ** 2 + (pos.y - first.y) ** 2);
      
      if (dist < this.gridSize * 2 && this.points.length > 2) {
        this.finishRoom();
      } else {
        this.points.push(pos);
        this.drawPolygon();
      }
    }
  }

  handleMouseMove(e) {
    if (!this.isDrawing || this.points.length === 0) return;
    
    const pos = this.getMousePos(e);
    const last = this.points[this.points.length - 1];
    
    // Draw temporary line
    this.drawTempLine(last, pos);
  }

  handleDoubleClick(e) {
    if (this.isDrawing && this.points.length > 2) {
      this.finishRoom();
    }
  }

  startDrawing() {
    this.isDrawing = true;
    this.points = [];
    this.clearRoomLayer();
    this.updateInfo('Click to place first corner point');
    this.shadowRoot.getElementById('btn-draw').disabled = true;
  }

  createRectangle() {
    const centerX = (this.clientWidth || 800) / 2;
    const centerY = (this.clientHeight || 600) / 2;
    const width = 200;
    const height = 150;
    
    this.points = [
      { x: centerX - width/2, y: centerY - height/2 },
      { x: centerX + width/2, y: centerY - height/2 },
      { x: centerX + width/2, y: centerY + height/2 },
      { x: centerX - width/2, y: centerY + height/2 }
    ];
    
    this.isDrawing = false;
    this.drawPolygon();
    this.updateMeasurements();
    this.updateInfo('Room created. Click View 3D to continue.');
    this.shadowRoot.getElementById('btn-clear').disabled = false;
    this.shadowRoot.getElementById('btn-draw').disabled = false;
  }

  drawTempLine(from, to) {
    // Remove existing temp line
    const existing = this.uiLayer.querySelector('.temp-line');
    if (existing) existing.remove();
    
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', from.x);
    line.setAttribute('y1', from.y);
    line.setAttribute('x2', to.x);
    line.setAttribute('y2', to.y);
    line.setAttribute('class', 'temp-line');
    this.uiLayer.appendChild(line);
  }

  drawPolygon() {
    this.roomLayer.innerHTML = '';
    
    if (this.points.length < 2) return;
    
    // Draw walls
    for (let i = 0; i < this.points.length; i++) {
      const p1 = this.points[i];
      const p2 = this.points[(i + 1) % this.points.length];
      
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', p1.x);
      line.setAttribute('y1', p1.y);
      line.setAttribute('x2', p2.x);
      line.setAttribute('y2', p2.y);
      line.setAttribute('class', 'wall-line');
      this.roomLayer.appendChild(line);
    }
    
    // Draw room shape (closed if finished)
    if (!this.isDrawing && this.points.length > 2) {
      const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
      const pointsAttr = this.points.map(p => `${p.x},${p.y}`).join(' ');
      polygon.setAttribute('points', pointsAttr);
      polygon.setAttribute('class', 'room-polygon');
      this.roomLayer.insertBefore(polygon, this.roomLayer.firstChild);
    }
    
    // Draw vertices
    this.points.forEach((p, i) => {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', p.x);
      circle.setAttribute('cy', p.y);
      circle.setAttribute('r', 5);
      circle.setAttribute('class', 'vertex');
      circle.dataset.index = i;
      this.roomLayer.appendChild(circle);
    });
    
    this.updateMeasurements();
  }

  finishRoom() {
    this.isDrawing = false;
    
    // Remove temp line
    const tempLine = this.uiLayer.querySelector('.temp-line');
    if (tempLine) tempLine.remove();
    
    this.drawPolygon();
    this.updateInfo('Room created. Click View 3D to continue.');
    this.shadowRoot.getElementById('btn-clear').disabled = false;
    this.shadowRoot.getElementById('btn-draw').disabled = false;
    
    // Dispatch event with room data
    this.dispatchRoomCompleted();
  }

  dispatchRoomCompleted() {
    const svgWidth = this.clientWidth || 800;
    const svgHeight = this.clientHeight || 600;
    
    // Convert to 3D room coordinates (centered, scale: 1px = 1cm = 0.01m)
    const roomPoints = this.points.map(p => ({
      x: (p.x - svgWidth / 2) * this.scale,
      y: (p.y - svgHeight / 2) * this.scale
    }));
    
    this.dispatchEvent(new CustomEvent('room-completed', {
      detail: { 
        points: roomPoints,
        pixelPoints: this.points,
        scale: this.scale,
        bounds: this.getBounds()
      },
      bubbles: true,
      composed: true
    }));
  }

  getBounds() {
    if (this.points.length === 0) return null;
    
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    
    this.points.forEach(p => {
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y);
      maxY = Math.max(maxY, p.y);
    });
    
    return { minX, maxX, minY, maxY };
  }

  updateMeasurements() {
    if (this.points.length < 2) return;
    
    const bounds = this.getBounds();
    const width = ((bounds.maxX - bounds.minX) * this.scale).toFixed(2);
    const height = ((bounds.maxY - bounds.minY) * this.scale).toFixed(2);
    
    // Calculate area using shoelace formula
    let area = 0;
    for (let i = 0; i < this.points.length; i++) {
      const j = (i + 1) % this.points.length;
      area += this.points[i].x * this.points[j].y;
      area -= this.points[j].x * this.points[i].y;
    }
    area = Math.abs(area) / 2 * this.scale * this.scale;
    
    this.shadowRoot.getElementById('meas-width').textContent = width;
    this.shadowRoot.getElementById('meas-length').textContent = height;
    this.shadowRoot.getElementById('meas-area').textContent = area.toFixed(2);
  }

  clearRoomLayer() {
    this.roomLayer.innerHTML = '';
  }

  clear() {
    this.points = [];
    this.isDrawing = false;
    this.roomLayer.innerHTML = '';
    this.uiLayer.innerHTML = '';
    this.shadowRoot.getElementById('btn-clear').disabled = true;
    this.shadowRoot.getElementById('btn-draw').disabled = false;
    this.shadowRoot.getElementById('meas-width').textContent = '0';
    this.shadowRoot.getElementById('meas-length').textContent = '0';
    this.shadowRoot.getElementById('meas-area').textContent = '0';
    this.updateInfo('Click Draw Room to start');
  }

  switchTo3D() {
    if (this.points.length < 3) {
      this.updateInfo('Please draw a room first');
      return;
    }
    
    this.dispatchEvent(new CustomEvent('switch-to-3d', {
      detail: { points: this.points },
      bubbles: true,
      composed: true
    }));
  }

  updateInfo(text) {
    this.shadowRoot.getElementById('info').textContent = text;
  }

  /**
   * Load room from saved data
   */
  loadRoom(data) {
    if (data.points) {
      const svgWidth = this.clientWidth || 800;
      const svgHeight = this.clientHeight || 600;
      
      this.points = data.points.map(p => ({
        x: (p.x / this.scale) + svgWidth / 2,
        y: (p.y / this.scale) + svgHeight / 2
      }));
      
      this.isDrawing = false;
      this.drawPolygon();
      this.updateMeasurements();
      this.shadowRoot.getElementById('btn-clear').disabled = false;
    }
  }
}

customElements.define('room-builder', RoomBuilder);
