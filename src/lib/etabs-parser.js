/**
 * ETABS/SAP2000 File Parser
 * Supports: .e2k (text), .s2k (text)
 * Reference: CSI ETABS 2016/2017/2018 E2K Format Specification
 * Convert ETABS/SAP2000 models to internal FEAScript format
 */

export class ETABSParser {
  constructor() {
    this.rawData = {
      stories: [],
      points: [],      // Nodes
      lines: [],       // Frame elements
      areas: [],       // Shell elements
      materials: [],
      sections: [],
      loadPatterns: [],
      loadCases: [],
      constraints: [],
      groups: []
    };
    this.errors = [];
    this.warnings = [];
    this.nodeIdMap = new Map(); // ETABS ID -> Internal ID
  }

  async parseFile(file) {
    const extension = file.name.split('.').pop().toLowerCase();
    const content = await file.text();
    
    switch(extension) {
      case 'e2k':
        return this.parseE2K(content);
      case 's2k':
        return this.parseS2K(content);
      case 'txt':
        // Try auto-detect
        if (content.includes('$ STORY') || content.includes('$ POINT')) {
          return this.parseE2K(content);
        }
        if (content.includes('TABLE:')) {
          return this.parseS2K(content);
        }
        throw new Error('Unknown text format');
      default:
        throw new Error(`Unsupported format: .${extension}`);
    }
  }

  parseE2K(content) {
    // E2K format uses $ delimiters untuk sections
    const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    let currentSection = null;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Section headers start with $ and end with DATA, PROPERTIES, etc
      if (line.startsWith('$')) {
        currentSection = this.identifySection(line);
        continue;
      }
      
      // Skip comments and empty lines
      if (line.startsWith('!') || line.startsWith('\\')) continue;
      
      // Parse line based on current section
      try {
        this.parseLineBySection(line, currentSection, i);
      } catch (err) {
        this.errors.push({ line: i, content: line, error: err.message });
      }
    }
    
    return this.convertToInternalFormat();
  }

  parseS2K(content) {
    // S2K format: TABLE: "TABLE NAME"
    const lines = content.split('\n');
    let currentTable = null;
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      if (trimmed.startsWith('TABLE:')) {
        const match = trimmed.match(/TABLE:\s*"(.+?)"/);
        currentTable = match ? match[1] : null;
        continue;
      }
      
      if (!currentTable || trimmed.startsWith('\'')) continue;
      
      this.parseSAPTableLine(trimmed, currentTable);
    }
    
    return this.convertToInternalFormat();
  }

  identifySection(headerLine) {
    const upper = headerLine.toUpperCase();
    if (upper.includes('STORY')) return 'stories';
    if (upper.includes('POINT') || upper.includes('JOINT')) return 'points';
    if (upper.includes('LINE') || upper.includes('FRAME')) return 'lines';
    if (upper.includes('AREA') || upper.includes('SHELL')) return 'areas';
    if (upper.includes('MATERIAL')) return 'materials';
    if (upper.includes('SECTION') || upper.includes('PROP')) return 'sections';
    if (upper.includes('LOAD PATTERN')) return 'loadPatterns';
    if (upper.includes('LOAD CASE')) return 'loadCases';
    if (upper.includes('CONSTRAINT')) return 'constraints';
    if (upper.includes('GROUP')) return 'groups';
    return 'unknown';
  }

  parseLineBySection(line, section, lineNum) {
    const tokens = line.split(/\s+/).filter(t => t.length > 0);
    if (tokens.length === 0) return;
    
    switch(section) {
      case 'stories':
        this.parseStoryLine(tokens);
        break;
      case 'points':
        this.parsePointLine(tokens, line);
        break;
      case 'lines':
        this.parseLineElement(tokens, line);
        break;
      case 'areas':
        this.parseAreaElement(tokens, line);
        break;
      case 'materials':
        this.parseMaterial(tokens, line);
        break;
      case 'sections':
        this.parseSection(tokens, line);
        break;
      case 'loadPatterns':
        this.parseLoadPattern(tokens);
        break;
      case 'constraints':
        this.parseConstraint(tokens, line);
        break;
    }
  }

  parseStoryLine(tokens) {
    if (tokens[0].toUpperCase() !== 'STORY') return;
    
    const story = {
      name: this.extractString(tokens[1]),
      height: parseFloat(tokens[2]) || 0,
      elevation: 0,
      masterStory: tokens[3] || null,
      isSimilarTo: tokens[4] || null
    };
    
    this.rawData.stories.push(story);
  }

  parsePointLine(tokens, fullLine) {
    if (tokens[0].toUpperCase() !== 'POINT') return;
    
    const point = {
      id: this.extractString(tokens[1]),
      x: parseFloat(tokens[2]) || 0,
      y: parseFloat(tokens[3]) || 0,
      z: parseFloat(tokens[4]) || 0,
      story: this.extractString(tokens[5]) || 'Base',
      restraint: null,
      mass: 0
    };
    
    if (tokens.length > 6) {
      const lastToken = this.extractString(tokens[tokens.length - 1]);
      if (['FIXED', 'PINNED', 'ROLLER'].includes(lastToken.toUpperCase())) {
        point.restraint = lastToken.toUpperCase();
      }
    }
    
    this.rawData.points.push(point);
  }

  parseLineElement(tokens, fullLine) {
    if (tokens[0].toUpperCase() !== 'LINE') return;
    
    const element = {
      id: this.extractString(tokens[1]),
      type: 'frame',
      nodeI: this.extractString(tokens[2]),
      nodeJ: this.extractString(tokens[3]),
      story: this.extractString(tokens[4]),
      section: this.extractString(tokens[5]),
      material: this.extractString(tokens[6]) || 'Default',
      releases: { i: [0,0,0,0,0,0], j: [0,0,0,0,0,0] },
      angle: 0
    };
    
    this.rawData.lines.push(element);
  }

  parseAreaElement(tokens, fullLine) {
    if (tokens[0].toUpperCase() !== 'AREA') return;
    
    const numPoints = parseInt(tokens[2]) || 4;
    const points = [];
    for (let i = 0; i < numPoints; i++) {
      points.push(this.extractString(tokens[3 + i]));
    }
    
    const area = {
      id: this.extractString(tokens[1]),
      type: 'shell',
      nodes: points,
      story: this.extractString(tokens[3 + numPoints]),
      section: this.extractString(tokens[4 + numPoints]),
      material: this.extractString(tokens[5 + numPoints]) || 'Default'
    };
    
    this.rawData.areas.push(area);
  }

  parseMaterial(tokens, line) {
    if (tokens[0].toUpperCase() !== 'MATERIAL') return;
    
    const mat = {
      name: this.extractString(tokens[1]),
      type: this.extractString(tokens[2]).toLowerCase(),
      density: parseFloat(tokens[3]) || 2400,
      poisson: parseFloat(tokens[4]) || 0.2,
      E: parseFloat(tokens[5]) || 30000000,
      thermal: parseFloat(tokens[6]) || 0.00001,
      fc: 0,
      fy: 0
    };
    
    if (mat.type === 'concrete' && tokens.length > 7) {
      mat.fc = parseFloat(tokens[7]) || 30;
    }
    if (mat.type === 'steel' && tokens.length > 7) {
      mat.fy = parseFloat(tokens[7]) || 400;
    }
    
    this.rawData.materials.push(mat);
  }

  parseSection(tokens, line) {
    if (tokens[0].toUpperCase() !== 'SECTION' && tokens[0].toUpperCase() !== 'PROP') return;
    
    const section = {
      name: this.extractString(tokens[1]),
      type: this.extractString(tokens[2]).toUpperCase(),
      dimensions: tokens.slice(3, -1).map(parseFloat),
      material: this.extractString(tokens[tokens.length - 1]) || 'Default',
      properties: {}
    };
    
    switch(section.type) {
      case 'RECT':
        const [b, h] = section.dimensions;
        section.properties = {
          A: b * h,
          Iy: (b * Math.pow(h, 3)) / 12,
          Iz: (h * Math.pow(b, 3)) / 12,
          J: 0.3 * b * Math.pow(h, 3)
        };
        break;
    }
    
    this.rawData.sections.push(section);
  }

  parseLoadPattern(tokens) {
    if (tokens[0].toUpperCase() !== 'LOADPATTERN') return;
    
    const pattern = {
      name: this.extractString(tokens[1]),
      type: this.extractString(tokens[2]),
      selfWeight: parseFloat(tokens[3]) || 0,
      multiplier: parseFloat(tokens[4]) || 1
    };
    
    this.rawData.loadPatterns.push(pattern);
  }

  parseConstraint(tokens, line) {
    if (tokens[0].toUpperCase() !== 'CONSTRAINT') return;
    
    const constraint = {
      name: this.extractString(tokens[1]),
      type: this.extractString(tokens[2]),
      nodes: tokens.slice(3).map(t => this.extractString(t))
    };
    
    this.rawData.constraints.push(constraint);
  }

  parseSAPTableLine(line, tableName) {
    const pairs = line.split(/\s+/);
    const data = {};
    
    pairs.forEach(pair => {
      const [key, val] = pair.split('=');
      if (key && val) {
        data[key] = val.replace(/"/g, '');
      }
    });
    
    switch(tableName) {
      case 'JOINT COORDINATES':
        this.rawData.points.push({
          id: data.Joint,
          x: parseFloat(data.CoordX) || 0,
          y: parseFloat(data.CoordY) || 0,
          z: parseFloat(data.CoordZ) || 0,
          restraint: null
        });
        break;
        
      case 'CONNECTIVITY - FRAME':
        this.rawData.lines.push({
          id: data.Frame,
          nodeI: data.JointI,
          nodeJ: data.JointJ,
          story: 'Default',
          section: data.Section,
          material: 'Default',
          type: 'frame'
        });
        break;
        
      case 'MATERIAL PROPERTIES 02 - MECHANICAL':
        this.rawData.materials.push({
          name: data.Material,
          type: data.Type || 'Concrete',
          E: parseFloat(data.E) || 30000000,
          poisson: parseFloat(data.Poisson) || 0.2,
          density: parseFloat(data.UnitWeight) || 2400
        });
        break;
    }
  }

  extractString(token) {
    if (!token) return '';
    return token.replace(/^["']|["']$/g, '');
  }

  convertToInternalFormat() {
    // Calculate cumulative elevations
    let cumulativeElev = 0;
    this.rawData.stories.forEach(story => {
      story.elevation = cumulativeElev;
      cumulativeElev += story.height;
    });
    
    const model = {
      metadata: {
        source: 'ETABS Import',
        date: new Date().toISOString(),
        stories: this.rawData.stories.length,
        points: this.rawData.points.length,
        elements: this.rawData.lines.length + this.rawData.areas.length,
        materials: this.rawData.materials.length,
        sections: this.rawData.sections.length
      },
      nodes: this.convertNodes(),
      elements: this.convertElements(),
      materials: this.convertMaterials(),
      sections: this.convertSections(),
      loads: this.convertLoads(),
      constraints: this.convertConstraints(),
      errors: this.errors,
      warnings: this.warnings
    };
    
    this.validateModel(model);
    return model;
  }

  convertNodes() {
    this.nodeIdMap.clear();
    let internalId = 1;
    
    return this.rawData.points.map(p => {
      this.nodeIdMap.set(p.id, internalId);
      
      return {
        id: internalId++,
        x: p.x,
        y: p.y,
        z: p.z,
        mass: p.mass || 0,
        restraints: this.parseRestraint(p.restraint)
      };
    });
  }

  parseRestraint(restraintStr) {
    if (!restraintStr) return [0,0,0,0,0,0];
    
    switch(restraintStr.toUpperCase()) {
      case 'FIXED':
        return [1,1,1,1,1,1];
      case 'PINNED':
        return [1,1,1,0,0,0];
      case 'ROLLER':
        return [0,0,1,0,0,0];
      default:
        return [0,0,0,0,0,0];
    }
  }

  convertElements() {
    const elements = [];
    
    // Convert frame elements
    this.rawData.lines.forEach(line => {
      const nodeI = this.nodeIdMap.get(line.nodeI);
      const nodeJ = this.nodeIdMap.get(line.nodeJ);
      
      if (!nodeI || !nodeJ) {
        this.warnings.push(`Line ${line.id} references missing nodes`);
        return;
      }
      
      const section = this.rawData.sections.find(s => s.name === line.section);
      const material = this.rawData.materials.find(m => m.name === line.material);
      
      elements.push({
        id: parseInt(line.id) || elements.length + 1,
        type: 'frame',
        node1: nodeI,
        node2: nodeJ,
        section: line.section,
        material: line.material,
        E: material?.E || 30000000,
        G: (material?.E || 30000000) / (2 * (1 + (material?.poisson || 0.2))),
        A: section?.properties?.A || 0.18,
        Iy: section?.properties?.Iy || 0.0054,
        Iz: section?.properties?.Iz || 0.00135,
        J: section?.properties?.J || 0.0081,
        releases: line.releases || { i: [0,0,0,0,0,0], j: [0,0,0,0,0,0] }
      });
    });
    
    // Convert shell elements
    this.rawData.areas.forEach(area => {
      const nodeIds = area.nodes.map(n => this.nodeIdMap.get(n)).filter(n => n);
      
      if (nodeIds.length < 3) {
        this.warnings.push(`Area ${area.id} has insufficient nodes`);
        return;
      }
      
      elements.push({
        id: 1000 + (parseInt(area.id.replace(/\D/g,'')) || elements.length + 1),
        type: 'shell',
        nodes: nodeIds,
        section: area.section,
        material: area.material,
        thickness: 0.2,
        membrane: true,
        bending: true
      });
    });
    
    return elements;
  }

  convertMaterials() {
    return this.rawData.materials.map(m => ({
      id: m.name,
      name: m.name,
      type: m.type,
      E: m.E,
      G: m.E / (2 * (1 + m.poisson)),
      poisson: m.poisson,
      density: m.density,
      fc: m.fc,
      fy: m.fy,
      thermal: m.thermal
    }));
  }

  convertSections() {
    return this.rawData.sections.map(s => ({
      id: s.name,
      name: s.name,
      type: s.type,
      material: s.material,
      dimensions: s.dimensions,
      properties: s.properties
    }));
  }

  convertLoads() {
    const loads = [];
    
    this.rawData.loadPatterns.forEach(pattern => {
      if (pattern.type === 'QUAKE' || pattern.name.toUpperCase().includes('EARTHQUAKE')) {
        loads.push({
          pattern: pattern.name,
          type: 'seismic',
          direction: 'X',
          distribution: 'inverted_triangle',
          baseForce: 1000
        });
      }
    });
    
    return loads;
  }

  convertConstraints() {
    return this.rawData.constraints.map(c => ({
      name: c.name,
      type: c.type === 'BODY' ? 'rigid_diaphragm' : c.type.toLowerCase(),
      nodes: c.nodes.map(n => this.nodeIdMap.get(n)).filter(n => n),
      masterNode: c.type === 'BODY' ? this.nodeIdMap.get(c.nodes[0]) : null
    }));
  }

  validateModel(model) {
    // Check duplicate IDs
    const nodeIds = model.nodes.map(n => n.id);
    const duplicates = nodeIds.filter((item, index) => nodeIds.indexOf(item) !== index);
    if (duplicates.length > 0) {
      this.warnings.push(`Duplicate node IDs found: ${duplicates.join(', ')}`);
    }
    
    // Check floating nodes
    const connectedNodes = new Set();
    model.elements.forEach(e => {
      if (e.type === 'frame') {
        connectedNodes.add(e.node1);
        connectedNodes.add(e.node2);
      } else if (e.type === 'shell') {
        e.nodes.forEach(n => connectedNodes.add(n));
      }
    });
    
    const floating = model.nodes.filter(n => !connectedNodes.has(n.id));
    if (floating.length > 0) {
      this.warnings.push(`${floating.length} floating nodes detected`);
    }
  }
}

/**
 * Export model back to E2K format
 */
export class ETABSExporter {
  exportToE2K(model) {
    let e2k = '! ETABS Export from SLF Analysis\n';
    e2k += '! Date: ' + new Date().toISOString() + '\n\n';
    
    // Stories
    e2k += '$ STORY DATA\n';
    const uniqueZ = [...new Set(model.nodes.map(n => n.z))].sort((a, b) => a - b);
    uniqueZ.forEach((z, i) => {
      const height = i > 0 ? z - uniqueZ[i-1] : z;
      e2k += `   STORY   "Story${i+1}"   ${height.toFixed(4)}   0   0\n`;
    });
    
    // Points
    e2k += '\n$ POINT ASSIGNS\n';
    model.nodes.forEach(node => {
      const restraintStr = node.restraints.every(r => r === 1) ? '   "Fixed"' : '';
      const storyName = this.getStoryName(node.z, uniqueZ);
      e2k += `   POINT   "${node.id}"   ${node.x.toFixed(4)}   ${node.y.toFixed(4)}   ${node.z.toFixed(4)}   "${storyName}"${restraintStr}\n`;
    });
    
    // Lines (Frames)
    e2k += '\n$ LINE ASSIGNS\n';
    model.elements.filter(e => e.type === 'frame').forEach(elem => {
      e2k += `   LINE   "${elem.id}"   "${elem.node1}"   "${elem.node2}"   "Story1"   "${elem.section || 'Default'}"   "${elem.material || 'Concrete30'}"\n`;
    });
    
    // Materials
    e2k += '\n$ MATERIAL PROPERTIES\n';
    model.materials.forEach(mat => {
      if (mat.type === 'concrete') {
        e2k += `   MATERIAL   "${mat.id}"   CONCRETE   ${mat.density}   ${mat.poisson}   ${mat.E}   ${mat.thermal || 0.00001}   ${mat.fc || 30}\n`;
      }
    });
    
    return e2k;
  }

  getStoryName(z, uniqueZ) {
    const index = uniqueZ.indexOf(z);
    return index >= 0 ? `Story${index + 1}` : 'Story1';
  }

  downloadE2K(model, filename = 'model_export.e2k') {
    const content = this.exportToE2K(model);
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

// ============================================================
// GOOGLE DRIVE INTEGRATION FOR ETABS FILES
// ============================================================

import { uploadToGoogleDrive } from './drive.js';

/**
 * Upload ETABS model file to Google Drive
 */
export async function uploadEtabsFileToDrive(file, proyekId, options = {}) {
  try {
    // Convert file to base64
    const base64 = await fileToBase64(file);
    
    const fileData = [{
      base64: base64.split(',')[1], // Remove data URI prefix
      mimeType: file.type || 'text/plain',
      name: file.name
    }];

    const results = await uploadToGoogleDrive(
      fileData, 
      proyekId, 
      'Struktur', // Aspek
      'ETABS_Model', // Item code
      options.gasUrl
    );

    if (results && results.length > 0) {
      return {
        success: true,
        fileId: results[0].id,
        url: results[0].url,
        message: 'File uploaded to Google Drive'
      };
    }

    return { success: false, error: 'Upload failed' };
  } catch (err) {
    console.error('[ETABS Drive] Upload error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Export and upload model to Google Drive as E2K
 */
export async function exportAndUploadE2K(model, proyekId, filename, options = {}) {
  try {
    const exporter = new ETABSExporter();
    const content = exporter.exportToE2K(model);
    
    // Create blob from content
    const blob = new Blob([content], { type: 'text/plain' });
    const file = new File([blob], filename || 'model_export.e2k', { type: 'text/plain' });
    
    return await uploadEtabsFileToDrive(file, proyekId, options);
  } catch (err) {
    console.error('[ETABS Drive] Export error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Save analysis results as JSON to Google Drive
 */
export async function saveAnalysisResultsToDrive(results, proyekId, analysisType, options = {}) {
  try {
    const filename = `Analysis_${analysisType}_${new Date().toISOString().split('T')[0]}.json`;
    const content = JSON.stringify(results, null, 2);
    
    const blob = new Blob([content], { type: 'application/json' });
    const file = new File([blob], filename, { type: 'application/json' });
    
    const base64 = await fileToBase64(file);
    
    const fileData = [{
      base64: base64.split(',')[1],
      mimeType: 'application/json',
      name: filename
    }];

    const uploadResults = await uploadToGoogleDrive(
      fileData,
      proyekId,
      'Struktur',
      `Analysis_${analysisType}`,
      options.gasUrl
    );

    if (uploadResults && uploadResults.length > 0) {
      return {
        success: true,
        fileId: uploadResults[0].id,
        url: uploadResults[0].url,
        filename
      };
    }

    return { success: false, error: 'Upload failed' };
  } catch (err) {
    console.error('[ETABS Drive] Save results error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Helper: Convert File to Base64
 */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
