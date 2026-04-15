/**
 * RadiosityEngine - Global illumination calculation using progressive refinement radiosity
 * Implements form factor calculation with ray-casting for visibility testing
 */

import * as THREE from 'three';
import { IESLoader } from './IESLoader.js';

export class RadiosityEngine {
  constructor(scene) {
    this.scene = scene;
    this.patches = [];          // Surface patches for radiosity
    this.formFactors = [];      // View factors between patches
    this.luminaires = [];       // Light sources
    this.ambientLight = 0;      // Ambient term
    this.convergenceThreshold = 0.001;
    this.maxIterations = 200;
    this.calculationGrid = [];
    this.workplaneHeight = 0.85;
    this.gridSpacing = 0.5;
    this.maintenanceFactor = 0.8;
    this.raycaster = new THREE.Raycaster();
  }

  /**
   * Initialize patches from room geometry
   */
  buildPatches(walls, floor, ceiling, gridSpacing = 0.5) {
    this.gridSpacing = gridSpacing;
    this.patches = [];
    
    const surfaces = [
      { mesh: floor, type: 'floor', reflectance: 0.3, color: 0xcccccc },
      { mesh: ceiling, type: 'ceiling', reflectance: 0.7, color: 0xffffff },
      ...walls.map(w => ({ mesh: w, type: 'wall', reflectance: 0.5, color: 0xffffff }))
    ];

    surfaces.forEach(surface => {
      if (!surface.mesh) return;
      
      const geom = surface.mesh.geometry;
      const posAttribute = geom.attributes.position;
      const uvAttribute = geom.attributes.uv;
      
      // Get world matrix for transformation
      const worldMatrix = surface.mesh.matrixWorld;
      
      // Subdivide into patches based on grid spacing
      if (geom.index) {
        // Indexed geometry - process triangles
        for (let i = 0; i < geom.index.count; i += 3) {
          const idx1 = geom.index.getX(i);
          const idx2 = geom.index.getX(i + 1);
          const idx3 = geom.index.getX(i + 2);
          
          const v1 = new THREE.Vector3().fromBufferAttribute(posAttribute, idx1);
          const v2 = new THREE.Vector3().fromBufferAttribute(posAttribute, idx2);
          const v3 = new THREE.Vector3().fromBufferAttribute(posAttribute, idx3);
          
          // Transform to world space
          v1.applyMatrix4(worldMatrix);
          v2.applyMatrix4(worldMatrix);
          v3.applyMatrix4(worldMatrix);
          
          this.subdivideTriangle(v1, v2, v3, surface, gridSpacing);
        }
      } else {
        // Non-indexed geometry
        for (let i = 0; i < posAttribute.count; i += 3) {
          const v1 = new THREE.Vector3().fromBufferAttribute(posAttribute, i);
          const v2 = new THREE.Vector3().fromBufferAttribute(posAttribute, i + 1);
          const v3 = new THREE.Vector3().fromBufferAttribute(posAttribute, i + 2);
          
          v1.applyMatrix4(worldMatrix);
          v2.applyMatrix4(worldMatrix);
          v3.applyMatrix4(worldMatrix);
          
          this.subdivideTriangle(v1, v2, v3, surface, gridSpacing);
        }
      }
    });

    console.log(`[RadiosityEngine] Built ${this.patches.length} patches`);
    return this.patches.length;
  }

  /**
   * Subdivide a triangle into smaller patches
   */
  subdivideTriangle(v1, v2, v3, surface, maxSize) {
    // Calculate triangle size
    const edge1 = new THREE.Vector3().subVectors(v2, v1);
    const edge2 = new THREE.Vector3().subVectors(v3, v1);
    const edge3 = new THREE.Vector3().subVectors(v3, v2);
    
    const maxEdge = Math.max(edge1.length(), edge2.length(), edge3.length());
    
    if (maxEdge <= maxSize * 1.5) {
      // Small enough - add as single patch
      this.addPatch(v1, v2, v3, surface);
    } else {
      // Subdivide into 4 triangles
      const mid1 = new THREE.Vector3().addVectors(v1, v2).multiplyScalar(0.5);
      const mid2 = new THREE.Vector3().addVectors(v2, v3).multiplyScalar(0.5);
      const mid3 = new THREE.Vector3().addVectors(v3, v1).multiplyScalar(0.5);
      
      this.subdivideTriangle(v1, mid1, mid3, surface, maxSize);
      this.subdivideTriangle(mid1, v2, mid2, surface, maxSize);
      this.subdivideTriangle(mid3, mid2, v3, surface, maxSize);
      this.subdivideTriangle(mid1, mid2, mid3, surface, maxSize);
    }
  }

  /**
   * Add a patch to the calculation
   */
  addPatch(v1, v2, v3, surface) {
    const e1 = new THREE.Vector3().subVectors(v2, v1);
    const e2 = new THREE.Vector3().subVectors(v3, v1);
    
    const normal = new THREE.Vector3().crossVectors(e1, e2).normalize();
    const area = e1.cross(e2).length() * 0.5;
    
    // Skip very small patches
    if (area < 0.001) return;
    
    const centroid = new THREE.Vector3().addVectors(v1, v2).add(v3).multiplyScalar(1/3);
    
    this.patches.push({
      vertices: [v1.clone(), v2.clone(), v3.clone()],
      centroid: centroid,
      normal: normal,
      area: area,
      reflectance: surface.reflectance,
      color: new THREE.Color(surface.color),
      emission: 0,        // Unshot energy
      radiosity: 0,       // Total accumulated energy
      incident: 0,        // Incident light
      type: surface.type
    });
  }

  /**
   * Progressive Refinement Radiosity
   */
  async calculate(settings = {}) {
    const {
      workplaneHeight = 0.85,
      maintenanceFactor = 0.8,
      onProgress = null
    } = settings;
    
    this.workplaneHeight = workplaneHeight;
    this.maintenanceFactor = maintenanceFactor;
    
    let iteration = 0;
    let maxDelta = Infinity;
    
    // Initialize luminaires as light sources
    this.initializeLuminaires();
    
    // Progressive refinement loop
    while (maxDelta > this.convergenceThreshold && iteration < this.maxIterations) {
      maxDelta = 0;
      
      // Find patch with most unshot energy
      let shooterIndex = -1;
      let maxUnshot = 0;
      
      this.patches.forEach((patch, i) => {
        const unshot = patch.emission * patch.area;
        if (unshot > maxUnshot) {
          maxUnshot = unshot;
          shooterIndex = i;
        }
      });
      
      if (shooterIndex === -1) break;
      
      const shooter = this.patches[shooterIndex];
      const shotEnergy = shooter.emission;
      shooter.emission = 0; // Mark as shot
      
      // Distribute to all other patches
      for (let i = 0; i < this.patches.length; i++) {
        if (i === shooterIndex) continue;
        
        const receiver = this.patches[i];
        const formFactor = this.calculateFormFactor(shooter, receiver);
        
        if (formFactor > 0) {
          const delta = shotEnergy * formFactor * receiver.reflectance;
          receiver.radiosity += delta;
          receiver.emission += delta;
          maxDelta = Math.max(maxDelta, delta);
        }
      }
      
      iteration++;
      
      if (onProgress && iteration % 10 === 0) {
        onProgress((iteration / this.maxIterations) * 100);
      }
      
      // Yield to event loop periodically
      if (iteration % 50 === 0) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }
    
    console.log(`[RadiosityEngine] Calculation completed in ${iteration} iterations`);
    
    return this.generateResults();
  }

  /**
   * Calculate form factor between two patches
   */
  calculateFormFactor(p1, p2) {
    const distance = p1.centroid.distanceTo(p2.centroid);
    
    // Cutoff for performance
    if (distance > 15 || distance < 0.01) return 0;
    
    // Direction from p1 to p2
    const direction = new THREE.Vector3().subVectors(p2.centroid, p1.centroid).normalize();
    
    // Check visibility with ray casting
    this.raycaster.set(p1.centroid, direction);
    this.raycaster.near = 0.01;
    this.raycaster.far = distance - 0.01;
    
    const intersects = this.raycaster.intersectObjects(this.scene.children, true);
    if (intersects.length > 0) {
      return 0; // Occluded
    }
    
    // Geometric term (cosine law)
    const cos1 = Math.max(0, p1.normal.dot(direction));
    const cos2 = Math.max(0, p2.normal.dot(direction.clone().negate()));
    
    if (cos1 <= 0 || cos2 <= 0) return 0;
    
    // Form factor formula
    return (cos1 * cos2 * p2.area) / (Math.PI * distance * distance + p2.area);
  }

  /**
   * Initialize luminaires as emissive patches
   */
  initializeLuminaires() {
    this.luminaires.forEach(lum => {
      const luminousIntensity = lum.iesData?.lampData?.lumens || 1000;
      
      // Create virtual patches for luminaire
      const patch = {
        vertices: [lum.position.clone()],
        centroid: lum.position.clone(),
        normal: new THREE.Vector3(0, -1, 0), // Default downward
        area: 0.1,
        reflectance: 0,
        emission: luminousIntensity / (0.1 * Math.PI), // Convert to radiance
        radiosity: luminousIntensity / (0.1 * Math.PI),
        incident: 0,
        color: new THREE.Color(0xffffaa),
        isLuminaire: true,
        iesData: lum.iesData,
        rotation: lum.rotation || { x: 0, y: 0, z: 0 }
      };
      
      this.patches.push(patch);
    });
  }

  /**
   * Calculate illuminance at a specific point using direct + indirect
   */
  calculatePointIlluminance(point, normal, includeIndirect = true) {
    let illuminance = 0;
    
    // Direct contribution from luminaires
    this.luminaires.forEach(lum => {
      const toLight = new THREE.Vector3().subVectors(lum.position, point);
      const distance = toLight.length();
      const direction = toLight.normalize();
      
      // Check visibility
      this.raycaster.set(point, direction);
      this.raycaster.near = 0.01;
      this.raycaster.far = distance - 0.01;
      
      const intersects = this.raycaster.intersectObjects(this.scene.children, true);
      if (intersects.length > 0) return;
      
      // Get intensity from IES data
      let intensity = lum.intensity || 1000;
      if (lum.iesData) {
        const localDir = direction.clone();
        if (lum.rotation) {
          if (lum.rotation.x) localDir.applyAxisAngle(new THREE.Vector3(1, 0, 0), -lum.rotation.x);
          if (lum.rotation.y) localDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), -lum.rotation.y);
          if (lum.rotation.z) localDir.applyAxisAngle(new THREE.Vector3(0, 0, 1), -lum.rotation.z);
        }
        
        const hAngle = Math.atan2(localDir.z, localDir.x) * (180 / Math.PI);
        const vAngle = Math.acos(Math.max(-1, Math.min(1, localDir.y))) * (180 / Math.PI);
        intensity = IESLoader.getIntensity(lum.iesData, hAngle, vAngle);
      }
      
      // Inverse square law with cosine
      const cosTheta = Math.max(0, normal.dot(direction));
      illuminance += (intensity * cosTheta) / (distance * distance);
    });
    
    // Indirect contribution from patches
    if (includeIndirect) {
      this.patches.forEach(patch => {
        if (patch.isLuminaire || patch.radiosity <= 0) return;
        
        const toPatch = new THREE.Vector3().subVectors(patch.centroid, point);
        const distance = toPatch.length();
        
        if (distance > 10) return;
        
        const direction = toPatch.normalize();
        
        // Visibility check
        this.raycaster.set(point, direction);
        this.raycaster.near = 0.01;
        this.raycaster.far = distance - 0.01;
        
        const intersects = this.raycaster.intersectObjects(this.scene.children, true);
        if (intersects.length > 0) return;
        
        const cosTheta = Math.max(0, normal.dot(direction));
        illuminance += (patch.radiosity * patch.area * cosTheta) / (distance * distance);
      });
    }
    
    return illuminance * this.maintenanceFactor;
  }

  /**
   * Generate calculation grid on workplane
   */
  generateCalculationGrid(bounds, gridSpacing = 0.5) {
    const grid = [];
    const y = this.workplaneHeight;
    
    for (let x = bounds.minX; x <= bounds.maxX; x += gridSpacing) {
      for (let z = bounds.minZ; z <= bounds.maxZ; z += gridSpacing) {
        const point = new THREE.Vector3(x, y, z);
        const normal = new THREE.Vector3(0, 1, 0);
        
        grid.push({
          point: point,
          normal: normal,
          illuminance: 0
        });
      }
    }
    
    return grid;
  }

  /**
   * Calculate illuminance for entire grid
   */
  async calculateGrid(bounds, onProgress = null) {
    this.calculationGrid = this.generateCalculationGrid(bounds, this.gridSpacing);
    const totalPoints = this.calculationGrid.length;
    
    for (let i = 0; i < totalPoints; i++) {
      const gridPoint = this.calculationGrid[i];
      gridPoint.illuminance = this.calculatePointIlluminance(gridPoint.point, gridPoint.normal);
      
      if (onProgress && i % 100 === 0) {
        onProgress((i / totalPoints) * 100);
      }
      
      // Yield periodically
      if (i % 500 === 0) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }
    
    return this.calculationGrid;
  }

  /**
   * Generate results summary
   */
  generateResults() {
    const validPatches = this.patches.filter(p => !p.isLuminaire && p.type !== 'ceiling');
    
    if (validPatches.length === 0) {
      return {
        average: 0,
        minimum: 0,
        maximum: 0,
        uniformityU0: 0,
        uniformityU1: 0,
        patches: []
      };
    }
    
    const values = validPatches.map(p => p.radiosity * this.maintenanceFactor);
    const average = values.reduce((a, b) => a + b, 0) / values.length;
    const minimum = Math.min(...values);
    const maximum = Math.max(...values);
    
    return {
      average,
      minimum,
      maximum,
      uniformityU0: average > 0 ? minimum / average : 0,
      uniformityU1: maximum > 0 ? minimum / maximum : 0,
      patches: validPatches,
      grid: this.calculationGrid
    };
  }

  /**
   * Clear all patches and reset state
   */
  clear() {
    this.patches = [];
    this.luminaires = [];
    this.calculationGrid = [];
  }
}
