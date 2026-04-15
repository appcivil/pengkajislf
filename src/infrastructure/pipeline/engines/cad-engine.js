/**
 * CAD Engine untuk pemrosesan file DXF/DWG
 * Menggunakan dxf-parser untuk parsing DXF
 * @module infrastructure/pipeline/engines/cad-engine
 */

import { ICADEngine } from '../../../core/smart-ai/engine-interface.js';
import { FileType, PipelineType } from '../../../core/smart-ai/types.js';

/**
 * Engine untuk pemrosesan file CAD (DXF/DWG)
 */
export class CADEngine extends ICADEngine {
  constructor(config = {}) {
    super('CADEngine', config);
    
    this.supportedTypes = [
      FileType.DXF,
      FileType.DWG
    ];
    
    this.enable3D = config.enable3D !== false;
    this.renderMode = config.renderMode || '2d';
    this.dxfParser = null;
    this.maxFileSize = config.maxFileSize || 30 * 1024 * 1024; // 30MB
    
    // Entity types yang didukung
    this.supportedEntities = [
      'LINE',
      'CIRCLE',
      'ARC',
      'POLYLINE',
      'LWPOLYLINE',
      'ELLIPSE',
      'SPLINE',
      'TEXT',
      'MTEXT',
      'INSERT', // Block reference
      'DIMENSION'
    ];
  }

  /**
   * Inisialisasi engine dan load dxf-parser
   * @returns {Promise<boolean>}
   */
  async initialize() {
    try {
      // Dynamic import dxf-parser
      const DxfParserModule = await import('dxf-parser');
      const DxfParser = DxfParserModule.default || DxfParserModule;
      this.dxfParser = new DxfParser();
      
      console.log('[CADEngine] Initialized successfully');
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('[CADEngine] Initialization failed:', error);
      // Fallback mode - tetap bisa jalan dengan limited functionality
      this.isInitialized = true;
      return false;
    }
  }

  /**
   * Proses file CAD lengkap
   * @param {Object} input - Input dengan file atau content
   * @param {Object} options - Options
   * @returns {Promise<Object>}
   */
  async process(input, options = {}) {
    await this.initialize();
    
    const file = input.file || input;
    
    let content;
    if (file instanceof File || file instanceof Blob) {
      // Validasi ukuran
      if (file.size > this.maxFileSize) {
        throw new Error(`File terlalu besar. Maksimum ${this.maxFileSize / 1024 / 1024}MB`);
      }
      
      content = await file.text();
    } else if (typeof file === 'string') {
      content = file;
    } else {
      throw new Error('Input harus berupa File, Blob, atau string');
    }

    // Parse CAD
    const model = await this.parse(content);
    
    // Ekstrak entities
    const entities = await this.extractEntities(model, options.entityFilter);
    
    // Analisis pengukuran
    const measurements = await this.analyzeMeasurements(model);
    
    // Ekstrak layers
    const layers = this._extractLayers(model);
    
    // Ekstrak blocks
    const blocks = this._extractBlocks(model);

    return {
      success: true,
      type: PipelineType.CAD,
      fileType: content.includes('DWG') ? FileType.DWG : FileType.DXF,
      model,
      entities,
      layers,
      blocks,
      measurements,
      metadata: {
        entityCount: entities.length,
        layerCount: layers.length,
        blockCount: blocks.length,
        bounds: measurements.bounds
      }
    };
  }

  /**
   * Parse file CAD ke model internal
   * @param {string|ArrayBuffer} content - Konten file CAD
   * @returns {Promise<Object>}
   */
  async parse(content) {
    if (!this.dxfParser) {
      throw new Error('DXF Parser not initialized');
    }

    try {
      // Parse menggunakan dxf-parser
      const model = this.dxfParser.parseSync(content);
      
      // Normalize model structure
      return this._normalizeModel(model);
    } catch (error) {
      console.error('[CADEngine] Parse error:', error);
      
      // Return minimal model jika parsing gagal
      return {
        header: {},
        tables: {},
        blocks: {},
        entities: [],
        parseError: error.message
      };
    }
  }

  /**
   * Ekstrak entity geometri dari model
   * @param {Object} model - Model CAD yang sudah diparse
   * @param {Array<string>} [filter] - Filter entity types
   * @returns {Promise<Array<Object>>}
   */
  async extractEntities(model, filter = null) {
    const entities = [];
    const entityList = model.entities || [];
    
    entityList.forEach((entity, index) => {
      const type = entity.type;
      
      // Skip jika tidak dalam filter
      if (filter && !filter.includes(type)) {
        return;
      }
      
      // Skip jika type tidak didukung
      if (!this.supportedEntities.includes(type)) {
        return;
      }

      const normalizedEntity = this._normalizeEntity(entity, index);
      if (normalizedEntity) {
        entities.push(normalizedEntity);
      }
    });

    return entities;
  }

  /**
   * Render CAD ke canvas/target
   * @param {Object} model - Model CAD
   * @param {HTMLElement} target - Target element (canvas atau container)
   * @returns {Promise<Object>}
   */
  async render(model, target) {
    if (!target) {
      throw new Error('Target element diperlukan untuk rendering');
    }

    const canvas = target instanceof HTMLCanvasElement 
      ? target 
      : this._createCanvas(target);
    
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Hitung bounds dan scale
    const bounds = this._calculateBounds(model);
    const scale = this._calculateScale(bounds, canvas.width, canvas.height);
    const offset = this._calculateOffset(bounds, canvas.width, canvas.height, scale);
    
    // Draw entities
    const entities = model.entities || [];
    entities.forEach(entity => {
      this._drawEntity(ctx, entity, scale, offset);
    });

    return {
      canvas,
      bounds,
      scale,
      offset,
      entityCount: entities.length
    };
  }

  /**
   * Analisis dimensi dan pengukuran
   * @param {Object} model - Model CAD
   * @returns {Promise<Object>}
   */
  async analyzeMeasurements(model) {
    const entities = model.entities || [];
    
    // Hitung bounds
    const bounds = this._calculateBounds(model);
    
    // Hitung total length dari line entities
    let totalLineLength = 0;
    let entityCounts = {};
    
    entities.forEach(entity => {
      const type = entity.type;
      entityCounts[type] = (entityCounts[type] || 0) + 1;
      
      if (type === 'LINE' && entity.vertices) {
        const [v1, v2] = entity.vertices;
        const length = Math.sqrt(
          Math.pow(v2.x - v1.x, 2) + Math.pow(v2.y - v1.y, 2)
        );
        totalLineLength += length;
      }
      
      if (type === 'CIRCLE' && entity.radius) {
        totalLineLength += 2 * Math.PI * entity.radius;
      }
      
      if (type === 'ARC' && entity.radius && entity.startAngle !== undefined && entity.endAngle !== undefined) {
        const angleSpan = entity.endAngle - entity.startAngle;
        totalLineLength += entity.radius * Math.abs(angleSpan);
      }
    });

    // Hitung area (approximate dari bounding box)
    const area = bounds.width * bounds.height;

    return {
      bounds,
      area,
      totalLineLength,
      entityCounts,
      center: {
        x: bounds.minX + bounds.width / 2,
        y: bounds.minY + bounds.height / 2
      }
    };
  }

  /**
   * Export ke format lain
   * @param {Object} model - Model CAD
   * @param {string} format - Format target (svg, json, dxf)
   * @returns {Promise<Blob>}
   */
  async export(model, format) {
    switch (format.toLowerCase()) {
      case 'json':
        return this._exportToJSON(model);
      case 'svg':
        return this._exportToSVG(model);
      case 'dxf':
        return this._exportToDXF(model);
      default:
        throw new Error(`Format export tidak didukung: ${format}`);
    }
  }

  // ============================================================================
  // PRIVATE METHODS - Model Normalization
  // ============================================================================

  /**
   * Normalisasi struktur model dari dxf-parser
   * @private
   */
  _normalizeModel(model) {
    return {
      header: model.header || {},
      tables: {
        layers: model.tables?.layer?.layers || {},
        lineTypes: model.tables?.lineType?.lineTypes || {},
        ...model.tables
      },
      blocks: model.blocks || {},
      entities: model.entities || [],
      objects: model.objects || {}
    };
  }

  /**
   * Normalisasi entity ke format standar
   * @private
   */
  _normalizeEntity(entity, index) {
    const base = {
      id: `entity-${index}`,
      type: entity.type,
      layer: entity.layer,
      visible: entity.visible !== false,
      color: entity.color,
      lineType: entity.lineType
    };

    switch (entity.type) {
      case 'LINE':
        return {
          ...base,
          start: { x: entity.startX || entity.vertices?.[0]?.x, y: entity.startY || entity.vertices?.[0]?.y },
          end: { x: entity.endX || entity.vertices?.[1]?.x, y: entity.endY || entity.vertices?.[1]?.y }
        };
      
      case 'CIRCLE':
        return {
          ...base,
          center: { x: entity.centerX || entity.center?.x, y: entity.centerY || entity.center?.y },
          radius: entity.radius
        };
      
      case 'ARC':
        return {
          ...base,
          center: { x: entity.centerX || entity.center?.x, y: entity.centerY || entity.center?.y },
          radius: entity.radius,
          startAngle: entity.startAngle,
          endAngle: entity.endAngle
        };
      
      case 'POLYLINE':
      case 'LWPOLYLINE':
        return {
          ...base,
          vertices: entity.vertices?.map(v => ({ x: v.x, y: v.y })) || [],
          closed: entity.closed || false
        };
      
      case 'TEXT':
      case 'MTEXT':
        return {
          ...base,
          text: entity.text || entity.string,
          position: { x: entity.x || entity.startPoint?.x, y: entity.y || entity.startPoint?.y },
          height: entity.height,
          rotation: entity.rotation || 0
        };
      
      default:
        return base;
    }
  }

  // ============================================================================
  // PRIVATE METHODS - Layer & Block Extraction
  // ============================================================================

  /**
   * Ekstrak layer information
   * @private
   */
  _extractLayers(model) {
    const layers = model.tables?.layers || {};
    return Object.entries(layers).map(([name, layer]) => ({
      name,
      color: layer.color,
      visible: layer.visible !== false,
      frozen: layer.frozen || false,
      lineType: layer.lineType
    }));
  }

  /**
   * Ekstrak block definitions
   * @private
   */
  _extractBlocks(model) {
    const blocks = model.blocks || {};
    return Object.entries(blocks).map(([name, block]) => ({
      name,
      entityCount: block.entities?.length || 0,
      basePoint: block.basePoint
    }));
  }

  // ============================================================================
  // PRIVATE METHODS - Rendering
  // ============================================================================

  /**
   * Create canvas element
   * @private
   */
  _createCanvas(container) {
    const canvas = document.createElement('canvas');
    canvas.width = container.clientWidth || 800;
    canvas.height = container.clientHeight || 600;
    container.appendChild(canvas);
    return canvas;
  }

  /**
   * Calculate bounding box dari semua entities
   * @private
   */
  _calculateBounds(model) {
    const entities = model.entities || [];
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    entities.forEach(entity => {
      const points = this._getEntityPoints(entity);
      points.forEach(p => {
        minX = Math.min(minX, p.x);
        minY = Math.min(minY, p.y);
        maxX = Math.max(maxX, p.x);
        maxY = Math.max(maxY, p.y);
      });
    });

    // Default jika tidak ada entities
    if (minX === Infinity) {
      minX = 0; minY = 0; maxX = 100; maxY = 100;
    }

    return {
      minX, minY, maxX, maxY,
      width: maxX - minX,
      height: maxY - minY
    };
  }

  /**
   * Get points dari entity untuk bounds calculation
   * @private
   */
  _getEntityPoints(entity) {
    const points = [];
    
    switch (entity.type) {
      case 'LINE':
        points.push(
          { x: entity.start?.x || entity.startX, y: entity.start?.y || entity.startY },
          { x: entity.end?.x || entity.endX, y: entity.end?.y || entity.endY }
        );
        break;
      
      case 'CIRCLE':
      case 'ARC':
        const center = entity.center || { x: entity.centerX, y: entity.centerY };
        const radius = entity.radius || 0;
        points.push(
          { x: center.x - radius, y: center.y - radius },
          { x: center.x + radius, y: center.y + radius }
        );
        break;
      
      case 'POLYLINE':
      case 'LWPOLYLINE':
        (entity.vertices || []).forEach(v => {
          points.push({ x: v.x, y: v.y });
        });
        break;
      
      case 'TEXT':
      case 'MTEXT':
        points.push({
          x: entity.position?.x || entity.x,
          y: entity.position?.y || entity.y
        });
        break;
    }
    
    return points;
  }

  /**
   * Calculate scale untuk fit ke canvas
   * @private
   */
  _calculateScale(bounds, canvasWidth, canvasHeight) {
    const padding = 20;
    const availableWidth = canvasWidth - padding * 2;
    const availableHeight = canvasHeight - padding * 2;
    
    const scaleX = availableWidth / bounds.width;
    const scaleY = availableHeight / bounds.height;
    
    return Math.min(scaleX, scaleY);
  }

  /**
   * Calculate offset untuk center drawing
   * @private
   */
  _calculateOffset(bounds, canvasWidth, canvasHeight, scale) {
    const drawingWidth = bounds.width * scale;
    const drawingHeight = bounds.height * scale;
    
    return {
      x: (canvasWidth - drawingWidth) / 2 - bounds.minX * scale,
      y: (canvasHeight - drawingHeight) / 2 + bounds.maxY * scale // Flip Y axis
    };
  }

  /**
   * Transform world coordinates ke canvas coordinates
   * @private
   */
  _transformPoint(point, scale, offset) {
    return {
      x: point.x * scale + offset.x,
      y: offset.y - point.y * scale // Flip Y axis
    };
  }

  /**
   * Draw single entity
   * @private
   */
  _drawEntity(ctx, entity, scale, offset) {
    if (!entity.visible) return;
    
    ctx.beginPath();
    
    switch (entity.type) {
      case 'LINE':
        this._drawLine(ctx, entity, scale, offset);
        break;
      
      case 'CIRCLE':
        this._drawCircle(ctx, entity, scale, offset);
        break;
      
      case 'ARC':
        this._drawArc(ctx, entity, scale, offset);
        break;
      
      case 'POLYLINE':
      case 'LWPOLYLINE':
        this._drawPolyline(ctx, entity, scale, offset);
        break;
      
      case 'TEXT':
      case 'MTEXT':
        this._drawText(ctx, entity, scale, offset);
        break;
    }
    
    ctx.stroke();
  }

  /**
   * Draw line entity
   * @private
   */
  _drawLine(ctx, entity, scale, offset) {
    const start = this._transformPoint(
      entity.start || { x: entity.startX, y: entity.startY },
      scale, offset
    );
    const end = this._transformPoint(
      entity.end || { x: entity.endX, y: entity.endY },
      scale, offset
    );
    
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
  }

  /**
   * Draw circle entity
   * @private
   */
  _drawCircle(ctx, entity, scale, offset) {
    const center = this._transformPoint(
      entity.center || { x: entity.centerX, y: entity.centerY },
      scale, offset
    );
    const radius = entity.radius * scale;
    
    ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
  }

  /**
   * Draw arc entity
   * @private
   */
  _drawArc(ctx, entity, scale, offset) {
    const center = this._transformPoint(
      entity.center || { x: entity.centerX, y: entity.centerY },
      scale, offset
    );
    const radius = entity.radius * scale;
    
    // Convert angles (DXF angles are in degrees, CCW from positive X)
    let startAngle = -(entity.endAngle * Math.PI / 180);
    let endAngle = -(entity.startAngle * Math.PI / 180);
    
    ctx.arc(center.x, center.y, radius, startAngle, endAngle);
  }

  /**
   * Draw polyline entity
   * @private
   */
  _drawPolyline(ctx, entity, scale, offset) {
    const vertices = entity.vertices || [];
    if (vertices.length === 0) return;
    
    const first = this._transformPoint(vertices[0], scale, offset);
    ctx.moveTo(first.x, first.y);
    
    for (let i = 1; i < vertices.length; i++) {
      const point = this._transformPoint(vertices[i], scale, offset);
      ctx.lineTo(point.x, point.y);
    }
    
    if (entity.closed) {
      ctx.closePath();
    }
  }

  /**
   * Draw text entity
   * @private
   */
  _drawText(ctx, entity, scale, offset) {
    const position = this._transformPoint(
      entity.position || { x: entity.x, y: entity.y },
      scale, offset
    );
    const text = entity.text || '';
    const height = (entity.height || 10) * scale;
    
    ctx.font = `${height}px sans-serif`;
    ctx.fillText(text, position.x, position.y);
  }

  // ============================================================================
  // PRIVATE METHODS - Export
  // ============================================================================

  /**
   * Export ke JSON
   * @private
   */
  _exportToJSON(model) {
    const jsonStr = JSON.stringify(model, null, 2);
    return new Blob([jsonStr], { type: 'application/json' });
  }

  /**
   * Export ke SVG
   * @private
   */
  _exportToSVG(model) {
    const bounds = this._calculateBounds(model);
    const width = bounds.width;
    const height = bounds.height;
    
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${bounds.minX} ${-bounds.maxY} ${width} ${height}" width="${width}" height="${height}">`;
    svg += `<g transform="scale(1,-1)">`; // Flip Y axis
    
    const entities = model.entities || [];
    entities.forEach(entity => {
      svg += this._entityToSVG(entity);
    });
    
    svg += '</g></svg>';
    
    return new Blob([svg], { type: 'image/svg+xml' });
  }

  /**
   * Convert entity ke SVG string
   * @private
   */
  _entityToSVG(entity) {
    const color = entity.color || '#000000';
    
    switch (entity.type) {
      case 'LINE':
        const x1 = entity.start?.x || entity.startX;
        const y1 = entity.start?.y || entity.startY;
        const x2 = entity.end?.x || entity.endX;
        const y2 = entity.end?.y || entity.endY;
        return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" />`;
      
      case 'CIRCLE':
        const cx = entity.center?.x || entity.centerX;
        const cy = entity.center?.y || entity.centerY;
        return `<circle cx="${cx}" cy="${cy}" r="${entity.radius}" stroke="${color}" fill="none" />`;
      
      case 'POLYLINE':
      case 'LWPOLYLINE':
        const points = (entity.vertices || [])
          .map(v => `${v.x},${v.y}`)
          .join(' ');
        return `<polyline points="${points}" stroke="${color}" fill="none" />`;
      
      default:
        return '';
    }
  }

  /**
   * Export ke DXF (reconstruct)
   * @private
   */
  _exportToDXF(model) {
    // Placeholder - DXF reconstruction memerlukan implementasi yang lebih kompleks
    // Return original content atau simplified DXF
    return new Blob(['DXF export not fully implemented'], { type: 'text/plain' });
  }

  /**
   * Cleanup resources
   */
  async dispose() {
    this.dxfParser = null;
    this.isInitialized = false;
  }
}

export default CADEngine;
