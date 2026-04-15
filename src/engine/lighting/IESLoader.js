/**
 * IESLoader - Parser for IESNA LM-63 photometric data files
 * Supports IESNA:LM-63-2002 standard format
 */

export class IESLoader {
  static async parse(file) {
    const text = await file.text();
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    
    const data = {
      version: 'IESNA:LM-63-2002',
      keywords: {},
      tiltData: null,
      lampData: {},
      photometricData: {}
    };

    let lineIndex = 0;
    let inTilt = false;
    let tiltLines = [];
    
    // Parse header
    while (lineIndex < lines.length) {
      const line = lines[lineIndex];
      
      if (line.startsWith('[')) {
        const match = line.match(/\[(.*?)\](.*)/);
        if (match) data.keywords[match[1]] = match[2].trim();
      } else if (line === 'TILT=NONE') {
        data.tiltData = { type: 'NONE' };
      } else if (line.startsWith('TILT=INCLUDE')) {
        inTilt = true;
      } else if (inTilt && !line.match(/^[\d\s\-\.]+$/)) {
        inTilt = false;
      } else if (inTilt) {
        tiltLines.push(line);
      } else if (line.match(/^[\d\s\-\.]+$/)) {
        break; // Start of numeric data
      }
      lineIndex++;
    }

    // Parse photometric data
    const numbers = lines.slice(lineIndex).join(' ').split(/\s+/).map(Number).filter(n => !isNaN(n));
    let ptr = 0;
    
    data.lampData = {
      count: numbers[ptr++] || 1,
      lumens: numbers[ptr++] || 1000,
      multiplyingFactor: numbers[ptr++] || 1,
      numVertical: numbers[ptr++],
      numHorizontal: numbers[ptr++],
      photometricType: numbers[ptr++], // 1=C, 2=B, 3=C (rotated)
      unitsType: numbers[ptr++], // 1=feet, 2=meters
      width: numbers[ptr++],
      length: numbers[ptr++],
      height: numbers[ptr++]
    };

    // Angles
    data.photometricData.verticalAngles = numbers.slice(ptr, ptr + data.lampData.numVertical);
    ptr += data.lampData.numVertical;
    
    data.photometricData.horizontalAngles = numbers.slice(ptr, ptr + data.lampData.numHorizontal);
    ptr += data.lampData.numHorizontal;

    // Candela values [horizontal][vertical]
    data.photometricData.candela = [];
    for (let h = 0; h < data.lampData.numHorizontal; h++) {
      const row = numbers.slice(ptr, ptr + data.lampData.numVertical);
      data.photometricData.candela.push(row);
      ptr += data.lampData.numVertical;
    }

    // Ballast and wattage data
    data.ballastFactor = numbers[ptr++] || 1;
    data.ballastLampFactor = numbers[ptr++] || 1;
    data.inputWatts = numbers[ptr++] || 0;

    return data;
  }

  static getIntensity(ies, horizontalAngle, verticalAngle) {
    const { verticalAngles, horizontalAngles, candela } = ies.photometricData;
    
    // Normalize angles
    horizontalAngle = ((horizontalAngle % 360) + 360) % 360;
    verticalAngle = Math.max(0, Math.min(180, verticalAngle));
    
    // Interpolate vertical
    let vIndex = 0;
    while (vIndex < verticalAngles.length - 1 && verticalAngles[vIndex + 1] < verticalAngle) vIndex++;
    
    const vDelta = verticalAngles[vIndex + 1] - verticalAngles[vIndex] || 1;
    const vRatio = Math.max(0, Math.min(1, (verticalAngle - verticalAngles[vIndex]) / vDelta));
    
    // Interpolate horizontal  
    let hIndex = 0;
    while (hIndex < horizontalAngles.length - 1 && horizontalAngles[hIndex + 1] < horizontalAngle) hIndex++;
    
    const hDelta = horizontalAngles[hIndex + 1] - horizontalAngles[hIndex] || 1;
    const hRatio = Math.max(0, Math.min(1, (horizontalAngle - horizontalAngles[hIndex]) / hDelta));

    // Bilinear interpolation with bounds checking
    const c00 = candela[hIndex]?.[vIndex] || 0;
    const c01 = candela[hIndex]?.[vIndex + 1] || c00;
    const c10 = candela[hIndex + 1]?.[vIndex] || c00;
    const c11 = candela[hIndex + 1]?.[vIndex + 1] || c00;

    const c0 = c00 * (1 - vRatio) + c01 * vRatio;
    const c1 = c10 * (1 - vRatio) + c11 * vRatio;
    
    return c0 * (1 - hRatio) + c1 * hRatio;
  }

  /**
   * Calculate luminous intensity at a given direction
   * @param {Object} ies - Parsed IES data
   * @param {THREE.Vector3} direction - Direction vector from luminaire
   * @param {THREE.Euler} rotation - Luminaire rotation
   * @returns {number} - Intensity in candela
   */
  static getIntensityInDirection(ies, direction, rotation = { x: 0, y: 0, z: 0 }) {
    // Transform direction to local luminaire space
    const localDir = direction.clone();
    
    // Apply inverse rotation
    if (rotation.x) localDir.applyAxisAngle(new THREE.Vector3(1, 0, 0), -rotation.x);
    if (rotation.y) localDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), -rotation.y);
    if (rotation.z) localDir.applyAxisAngle(new THREE.Vector3(0, 0, 1), -rotation.z);
    
    // Calculate spherical coordinates
    const r = localDir.length();
    const horizontalAngle = Math.atan2(localDir.z, localDir.x) * (180 / Math.PI);
    const verticalAngle = Math.acos(Math.max(-1, Math.min(1, localDir.y / r))) * (180 / Math.PI);
    
    return this.getIntensity(ies, horizontalAngle, verticalAngle);
  }

  /**
   * Create a visual representation of the IES light distribution
   */
  static createDistributionVisualization(ies, scale = 1) {
    const points = [];
    const { verticalAngles, horizontalAngles, candela } = ies.photometricData;
    
    // Sample the distribution
    for (let h = 0; h < horizontalAngles.length; h += Math.max(1, Math.floor(horizontalAngles.length / 36))) {
      for (let v = 0; v < verticalAngles.length; v += Math.max(1, Math.floor(verticalAngles.length / 18))) {
        const intensity = candela[h][v];
        const hRad = horizontalAngles[h] * (Math.PI / 180);
        const vRad = verticalAngles[v] * (Math.PI / 180);
        
        // Spherical to Cartesian
        const r = intensity / 1000 * scale; // Normalize
        const x = r * Math.sin(vRad) * Math.cos(hRad);
        const y = r * Math.cos(vRad);
        const z = r * Math.sin(vRad) * Math.sin(hRad);
        
        points.push(new THREE.Vector3(x, y, z));
      }
    }
    
    return points;
  }
}

// Import THREE.js for vector operations
import * as THREE from 'three';
