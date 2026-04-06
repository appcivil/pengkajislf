/**
 * STRUCTURE VISUALIZATION & FLOOR PLAN TOOLS
 * Canvas-based annotation and visualization
 */

/**
 * Initialize Canvas for Floor Plan
 */
export function initFloorPlanCanvas(canvasId, options = {}) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return null;
  
  const ctx = canvas.getContext('2d');
  const { width = 800, height = 600 } = options;
  
  // Set canvas size
  canvas.width = width;
  canvas.height = height;
  
  // State
  const state = {
    elements: [],
    selectedTool: 'select',
    isDrawing: false,
    startPoint: null,
    currentElement: null,
    scale: 1,
    offset: { x: 0, y: 0 },
    backgroundImage: null,
    gridSize: 20
  };
  
  // Drawing tools
  const tools = {
    select: { cursor: 'default' },
    rectangle: { cursor: 'crosshair' },
    circle: { cursor: 'crosshair' },
    line: { cursor: 'crosshair' },
    arrow: { cursor: 'crosshair' },
    text: { cursor: 'text' },
    crack: { cursor: 'crosshair' },
    spalling: { cursor: 'crosshair' },
    corrosion: { cursor: 'crosshair' }
  };
  
  // Event handlers
  function getMousePos(e) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - state.offset.x) / state.scale,
      y: (e.clientY - rect.top - state.offset.y) / state.scale
    };
  }
  
  canvas.addEventListener('mousedown', (e) => {
    const pos = getMousePos(e);
    state.isDrawing = true;
    state.startPoint = pos;
    
    if (state.selectedTool !== 'select') {
      state.currentElement = {
        type: state.selectedTool,
        x: pos.x,
        y: pos.y,
        width: 0,
        height: 0,
        color: getToolColor(state.selectedTool),
        id: Date.now()
      };
    }
  });
  
  canvas.addEventListener('mousemove', (e) => {
    const pos = getMousePos(e);
    
    if (state.isDrawing && state.currentElement) {
      state.currentElement.width = pos.x - state.startPoint.x;
      state.currentElement.height = pos.y - state.startPoint.y;
      redraw();
      drawElement(state.currentElement, true);
    }
  });
  
  canvas.addEventListener('mouseup', () => {
    if (state.isDrawing && state.currentElement) {
      state.elements.push({ ...state.currentElement });
      state.currentElement = null;
      redraw();
    }
    state.isDrawing = false;
  });
  
  function getToolColor(tool) {
    const colors = {
      rectangle: '#3b82f6',
      circle: '#3b82f6',
      line: '#3b82f6',
      arrow: '#ef4444',
      text: '#ffffff',
      crack: '#ef4444',
      spalling: '#f97316',
      corrosion: '#8b5cf6'
    };
    return colors[tool] || '#3b82f6';
  }
  
  function drawElement(el, isDraft = false) {
    ctx.save();
    ctx.strokeStyle = el.color;
    ctx.fillStyle = el.color + '40'; // 25% opacity
    ctx.lineWidth = isDraft ? 1 : 2;
    ctx.setLineDash(isDraft ? [5, 5] : []);
    
    switch(el.type) {
      case 'rectangle':
        ctx.fillRect(el.x, el.y, el.width, el.height);
        ctx.strokeRect(el.x, el.y, el.width, el.height);
        break;
        
      case 'circle':
        ctx.beginPath();
        ctx.ellipse(
          el.x + el.width / 2, 
          el.y + el.height / 2,
          Math.abs(el.width / 2),
          Math.abs(el.height / 2),
          0, 0, 2 * Math.PI
        );
        ctx.fill();
        ctx.stroke();
        break;
        
      case 'line':
        ctx.beginPath();
        ctx.moveTo(el.x, el.y);
        ctx.lineTo(el.x + el.width, el.y + el.height);
        ctx.stroke();
        break;
        
      case 'arrow':
        drawArrow(ctx, el.x, el.y, el.x + el.width, el.y + el.height);
        break;
        
      case 'crack':
        drawCrack(ctx, el.x, el.y, el.x + el.width, el.y + el.height);
        break;
        
      case 'spalling':
        drawSpalling(ctx, el.x, el.y, el.width, el.height);
        break;
        
      case 'corrosion':
        drawCorrosion(ctx, el.x, el.y, el.width, el.height);
        break;
    }
    ctx.restore();
  }
  
  function drawArrow(ctx, x1, y1, x2, y2) {
    const headlen = 15;
    const angle = Math.atan2(y2 - y1, x2 - x1);
    
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(
      x2 - headlen * Math.cos(angle - Math.PI / 6),
      y2 - headlen * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      x2 - headlen * Math.cos(angle + Math.PI / 6),
      y2 - headlen * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fill();
  }
  
  function drawCrack(ctx, x1, y1, x2, y2) {
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    
    // Draw jagged line
    const steps = 10;
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const x = x1 + (x2 - x1) * t;
      const y = y1 + (y2 - y1) * t;
      const offset = (i % 2 === 0 ? 1 : -1) * 3;
      ctx.lineTo(x + offset, y);
    }
    ctx.stroke();
  }
  
  function drawSpalling(ctx, x, y, w, h) {
    ctx.fillStyle = '#f97316';
    ctx.strokeStyle = '#c2410c';
    
    // Draw irregular shape
    ctx.beginPath();
    ctx.moveTo(x, y);
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * 2 * Math.PI;
      const r = 0.3 + Math.random() * 0.4;
      const px = x + w/2 + (w/2) * r * Math.cos(angle);
      const py = y + h/2 + (h/2) * r * Math.sin(angle);
      ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  
  function drawCorrosion(ctx, x, y, w, h) {
    ctx.fillStyle = '#8b5cf6';
    ctx.strokeStyle = '#7c3aed';
    
    // Draw rust pattern
    ctx.beginPath();
    ctx.arc(x + w/2, y + h/2, Math.min(w, h) / 2, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
    
    // Draw dots
    for (let i = 0; i < 5; i++) {
      const cx = x + Math.random() * w;
      const cy = y + Math.random() * h;
      ctx.beginPath();
      ctx.arc(cx, cy, 2, 0, 2 * Math.PI);
      ctx.fillStyle = '#a78bfa';
      ctx.fill();
    }
  }
  
  function drawGrid() {
    ctx.save();
    ctx.strokeStyle = 'hsla(220, 20%, 100%, 0.05)';
    ctx.lineWidth = 1;
    
    for (let x = 0; x < canvas.width; x += state.gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    
    for (let y = 0; y < canvas.height; y += state.gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
    ctx.restore();
  }
  
  function drawBackground() {
    if (state.backgroundImage) {
      ctx.save();
      ctx.globalAlpha = 0.3;
      ctx.drawImage(state.backgroundImage, 0, 0, canvas.width, canvas.height);
      ctx.restore();
    }
  }
  
  function redraw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid();
    drawBackground();
    state.elements.forEach(el => drawElement(el));
  }
  
  // API
  return {
    setTool: (tool) => {
      state.selectedTool = tool;
      canvas.style.cursor = tools[tool]?.cursor || 'default';
    },
    
    addText: (text, x, y) => {
      state.elements.push({
        type: 'text',
        x, y,
        text,
        color: '#ffffff',
        id: Date.now()
      });
      redraw();
    },
    
    setBackgroundImage: (imageSrc) => {
      const img = new Image();
      img.onload = () => {
        state.backgroundImage = img;
        redraw();
      };
      img.src = imageSrc;
    },
    
    clear: () => {
      state.elements = [];
      redraw();
    },
    
    undo: () => {
      state.elements.pop();
      redraw();
    },
    
    export: () => {
      return canvas.toDataURL('image/png');
    },
    
    getElements: () => [...state.elements],
    
    setScale: (scale) => {
      state.scale = scale;
      redraw();
    },
    
    redraw
  };
}

/**
 * Generate Damage Heatmap
 */
export function generateDamageHeatmap(damageData, floorPlan, options = {}) {
  const { width = 400, height = 300 } = options;
  
  const severityColors = {
    'Aman': '#22c55e',
    'Perlu Perhatian': '#eab308',
    'Kritis': '#ef4444'
  };
  
  return `
    <div style="position: relative; width: ${width}px; height: ${height}px; background: hsla(220, 20%, 100%, 0.05); border-radius: 8px; overflow: hidden;">
      <img src="${floorPlan}" style="width: 100%; height: 100%; object-fit: contain; opacity: 0.5;">
      
      ${damageData.map(d => `
        <div style="position: absolute; 
                    left: ${d.x}%; top: ${d.y}%; 
                    width: ${d.radius || 20}px; height: ${d.radius || 20}px;
                    background: ${severityColors[d.severity] || severityColors['Aman']};
                    border-radius: 50%;
                    transform: translate(-50%, -50%);
                    box-shadow: 0 0 10px ${severityColors[d.severity] || severityColors['Aman']};
                    opacity: 0.7;
                    cursor: pointer;"
             title="${d.description || d.severity}">
        </div>
      `).join('')}
      
      <!-- Legend -->
      <div style="position: absolute; bottom: 10px; right: 10px; background: hsla(220, 20%, 100%, 0.9); padding: 8px 12px; border-radius: 6px; backdrop-filter: blur(4px);">
        ${Object.entries(severityColors).map(([label, color]) => `
          <div style="display: flex; align-items: center; gap: 6px; margin: 2px 0;">
            <div style="width: 10px; height: 10px; border-radius: 50%; background: ${color};"></div>
            <span style="font-size: 10px; color: #1e293b;">${label}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}
