/**
 * Room3D - 3D Room Builder and Scene Manager
 * Creates room geometry, manages luminaires and furniture
 */

import * as THREE from 'three';

export class Room3D {
  constructor() {
    this.room = new THREE.Group();
    this.walls = [];
    this.furniture = [];
    this.luminaires = [];
    this.dimensions = { width: 10, length: 10, height: 3 };
    this.floor = null;
    this.ceiling = null;
    this.wallHeight = 3;
  }

  /**
   * Create room from 2D floor plan points
   */
  createFromFloorPlan(points, height = 3) {
    this.wallHeight = height;
    this.clear();
    
    // Calculate room bounds
    const bounds = this.calculateBounds(points);
    this.dimensions = {
      width: bounds.maxX - bounds.minX,
      length: bounds.maxZ - bounds.minZ,
      height: height
    };

    // Create floor
    const floorShape = new THREE.Shape();
    floorShape.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      floorShape.lineTo(points[i].x, points[i].y);
    }
    floorShape.closePath();

    const floorGeom = new THREE.ShapeGeometry(floorShape);
    const floorMat = new THREE.MeshStandardMaterial({ 
      color: 0xcccccc,
      roughness: 0.8,
      metalness: 0.1,
      side: THREE.DoubleSide
    });
    
    this.floor = new THREE.Mesh(floorGeom, floorMat);
    this.floor.rotation.x = -Math.PI / 2;
    this.floor.userData = { type: 'floor', reflectance: 0.3, color: 0xcccccc };
    this.floor.updateMatrixWorld();
    this.room.add(this.floor);

    // Create ceiling
    const ceilingGeom = floorGeom.clone();
    const ceilingMat = new THREE.MeshStandardMaterial({ 
      color: 0xffffff,
      roughness: 0.9,
      metalness: 0.0,
      side: THREE.DoubleSide
    });
    
    this.ceiling = new THREE.Mesh(ceilingGeom, ceilingMat);
    this.ceiling.rotation.x = -Math.PI / 2;
    this.ceiling.position.y = height;
    this.ceiling.userData = { type: 'ceiling', reflectance: 0.7, color: 0xffffff };
    this.ceiling.updateMatrixWorld();
    this.room.add(this.ceiling);

    // Create walls
    this.walls = [];
    for (let i = 0; i < points.length; i++) {
      const p1 = points[i];
      const p2 = points[(i + 1) % points.length];
      
      const wallLength = Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
      
      if (wallLength < 0.1) continue;
      
      // Create wall geometry
      const wallGeom = new THREE.BoxGeometry(wallLength, height, 0.15);
      const wallMat = new THREE.MeshStandardMaterial({ 
        color: 0xf5f5f5,
        roughness: 0.9,
        metalness: 0.0
      });
      
      const wall = new THREE.Mesh(wallGeom, wallMat);
      
      // Position wall
      const midX = (p1.x + p2.x) / 2;
      const midZ = (p1.y + p2.y) / 2;
      const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
      
      wall.position.set(midX, height / 2, midZ);
      wall.rotation.y = -angle;
      wall.userData = { 
        type: 'wall', 
        reflectance: 0.5, 
        color: 0xf5f5f5,
        wallIndex: i
      };
      wall.updateMatrixWorld();
      
      this.room.add(wall);
      this.walls.push(wall);
    }

    // Add grid helper
    const gridHelper = new THREE.GridHelper(
      Math.max(this.dimensions.width, this.dimensions.length) + 2,
      20,
      0x444444,
      0x222222
    );
    gridHelper.position.y = 0.01;
    this.room.add(gridHelper);

    return this.room;
  }

  /**
   * Calculate bounds from points
   */
  calculateBounds(points) {
    let minX = Infinity, maxX = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;
    
    points.forEach(p => {
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
      minZ = Math.min(minZ, p.y);
      maxZ = Math.max(maxZ, p.y);
    });
    
    return { minX, maxX, minZ, maxZ };
  }

  /**
   * Add a luminaire (light fixture)
   */
  addLuminaire(iesData, position, rotation = { x: 0, y: 0, z: 0 }, options = {}) {
    const fixtureGroup = new THREE.Group();
    fixtureGroup.position.copy(position);
    fixtureGroup.rotation.set(rotation.x, rotation.y, rotation.z);

    // Main fixture body
    const bodyGeom = new THREE.CylinderGeometry(0.08, 0.08, 0.06, 16);
    const bodyMat = new THREE.MeshStandardMaterial({ 
      color: 0xffffff,
      emissive: 0xffffaa,
      emissiveIntensity: 0.3,
      roughness: 0.4,
      metalness: 0.6
    });
    const body = new THREE.Mesh(bodyGeom, bodyMat);
    fixtureGroup.add(body);

    // Light emission indicator
    const glowGeom = new THREE.SphereGeometry(0.04, 16, 16);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xffffaa,
      transparent: true,
      opacity: 0.8
    });
    const glow = new THREE.Mesh(glowGeom, glowMat);
    glow.position.y = -0.02;
    fixtureGroup.add(glow);

    // IES distribution cone visualization
    if (options.showCone !== false) {
      const coneHeight = 2;
      const coneRadius = 1.5;
      const coneGeom = new THREE.ConeGeometry(coneRadius, coneHeight, 32, 1, true);
      const coneMat = new THREE.MeshBasicMaterial({
        color: 0xffff00,
        transparent: true,
        opacity: 0.08,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      });
      const cone = new THREE.Mesh(coneGeom, coneMat);
      cone.rotation.x = Math.PI;
      cone.position.y = -coneHeight / 2;
      cone.userData = { isLightCone: true };
      fixtureGroup.add(cone);
    }

    // Store luminaire data
    const luminaire = {
      id: options.id || `lum-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      mesh: fixtureGroup,
      position: position.clone(),
      rotation: { ...rotation },
      iesData: iesData,
      intensity: options.intensity || (iesData?.lampData?.lumens || 1000),
      name: options.name || `Lamp ${this.luminaires.length + 1}`,
      wattage: options.wattage || iesData?.inputWatts || 36
    };

    fixtureGroup.userData = {
      type: 'luminaire',
      luminaire: luminaire
    };

    this.room.add(fixtureGroup);
    this.luminaires.push(luminaire);

    return luminaire;
  }

  /**
   * Add furniture/object to room
   */
  addFurniture(type, position, dimensions, options = {}) {
    // Convert plain object to Vector3 if needed
    if (!(position instanceof THREE.Vector3)) {
      position = new THREE.Vector3(position.x || 0, position.y || 0, position.z || 0);
    }
    
    let geometry;
    let color = options.color || 0x8B4513;
    let reflectance = options.reflectance || 0.3;
    
    switch(type) {
      case 'table':
        geometry = new THREE.BoxGeometry(
          dimensions.width || 1.2, 
          dimensions.height || 0.75, 
          dimensions.depth || 0.6
        );
        color = options.color || 0x8B4513;
        break;
      case 'chair':
        geometry = new THREE.BoxGeometry(0.5, 0.8, 0.5);
        color = options.color || 0x654321;
        reflectance = 0.25;
        break;
      case 'cabinet':
        geometry = new THREE.BoxGeometry(
          dimensions.width || 1.2, 
          dimensions.height || 2, 
          dimensions.depth || 0.6
        );
        color = options.color || 0x5C4033;
        break;
      case 'desk':
        geometry = new THREE.BoxGeometry(
          dimensions.width || 1.4, 
          dimensions.height || 0.73, 
          dimensions.depth || 0.7
        );
        color = options.color || 0xD2B48C;
        break;
      case 'bookshelf':
        geometry = new THREE.BoxGeometry(
          dimensions.width || 0.9, 
          dimensions.height || 2, 
          dimensions.depth || 0.4
        );
        color = options.color || 0x8B4513;
        break;
      case 'partition':
        geometry = new THREE.BoxGeometry(
          dimensions.width || 2, 
          dimensions.height || 1.5, 
          dimensions.depth || 0.05
        );
        color = options.color || 0xE0E0E0;
        reflectance = 0.6;
        break;
      default:
        geometry = new THREE.BoxGeometry(
          dimensions.width || 1, 
          dimensions.height || 1, 
          dimensions.depth || 1
        );
    }
    
    const material = new THREE.MeshStandardMaterial({ 
      color: color,
      roughness: 0.8,
      metalness: 0.1
    });
    
    const furniture = new THREE.Mesh(geometry, material);
    furniture.position.copy(position);
    if (dimensions.rotation) {
      furniture.rotation.y = dimensions.rotation;
    }
    
    furniture.castShadow = true;
    furniture.receiveShadow = true;
    furniture.userData = { 
      type: 'furniture', 
      reflectance: reflectance,
      color: color,
      furnitureType: type
    };
    furniture.updateMatrixWorld();
    
    this.room.add(furniture);
    this.furniture.push({
      mesh: furniture,
      type: type,
      position: position.clone(),
      dimensions: dimensions
    });
    
    return furniture;
  }

  /**
   * Add a window to a wall
   */
  addWindow(wallIndex, position, width, height, options = {}) {
    // This is a simplified representation
    // In a full implementation, this would use CSG to cut the hole
    const wall = this.walls[wallIndex];
    if (!wall) return null;

    // Create window frame
    const frameGeom = new THREE.BoxGeometry(width + 0.1, height + 0.1, 0.2);
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x444444 });
    const frame = new THREE.Mesh(frameGeom, frameMat);

    // Position relative to wall
    const wallPos = wall.position.clone();
    frame.position.copy(wallPos);
    frame.position.y = position.y || height / 2;
    frame.rotation.copy(wall.rotation);
    frame.userData = { type: 'window', transparency: 0.9 };

    this.room.add(frame);
    return frame;
  }

  /**
   * Remove a luminaire
   */
  removeLuminaire(luminaire) {
    const index = this.luminaires.indexOf(luminaire);
    if (index > -1) {
      this.room.remove(luminaire.mesh);
      this.luminaires.splice(index, 1);
    }
  }

  /**
   * Remove all luminaires
   */
  clearLuminaires() {
    this.luminaires.forEach(lum => {
      this.room.remove(lum.mesh);
    });
    this.luminaires = [];
  }

  /**
   * Remove all furniture
   */
  clearFurniture() {
    this.furniture.forEach(furn => {
      this.room.remove(furn.mesh);
    });
    this.furniture = [];
  }

  /**
   * Clear the entire room
   */
  clear() {
    this.clearLuminaires();
    this.clearFurniture();
    
    // Remove walls
    this.walls.forEach(wall => {
      this.room.remove(wall);
    });
    this.walls = [];
    
    // Remove floor and ceiling
    if (this.floor) {
      this.room.remove(this.floor);
      this.floor = null;
    }
    if (this.ceiling) {
      this.room.remove(this.ceiling);
      this.ceiling = null;
    }
    
    // Remove all other children except lights
    const toRemove = [];
    this.room.children.forEach(child => {
      if (child.type !== 'AmbientLight' && child.type !== 'DirectionalLight' && 
          child.type !== 'PointLight' && child.type !== 'SpotLight') {
        toRemove.push(child);
      }
    });
    toRemove.forEach(child => this.room.remove(child));
  }

  /**
   * Get room bounds for calculation
   */
  getBounds() {
    if (!this.floor) return null;
    
    const box = new THREE.Box3().setFromObject(this.floor);
    return {
      minX: box.min.x,
      maxX: box.max.x,
      minZ: box.min.z,
      maxZ: box.max.z,
      width: this.dimensions.width,
      length: this.dimensions.length,
      height: this.wallHeight
    };
  }

  /**
   * Export room data for saving
   */
  exportData() {
    return {
      dimensions: this.dimensions,
      luminaires: this.luminaires.map(lum => ({
        id: lum.id,
        position: { x: lum.position.x, y: lum.position.y, z: lum.position.z },
        rotation: { ...lum.rotation },
        intensity: lum.intensity,
        name: lum.name,
        wattage: lum.wattage
      })),
      furniture: this.furniture.map(furn => ({
        type: furn.type,
        position: { x: furn.position.x, y: furn.position.y, z: furn.position.z },
        dimensions: furn.dimensions
      }))
    };
  }
}
