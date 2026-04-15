/**
 * Evacuation Models
 * Agent, Exit, Obstacle, RoomNode classes untuk PathfinderEngine
 */

import * as THREE from 'three';

/**
 * Agent - Individual occupant dalam simulasi
 */
export class Agent {
  constructor(options = {}) {
    this.id = options.id || `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Position & movement
    this.position = options.position || new THREE.Vector3(0, 0, 0);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.acceleration = new THREE.Vector3(0, 0, 0);
    this.target = options.target || null;
    this.path = [];
    
    // Physical characteristics
    this.radius = options.radius || 0.3; // meters (shoulder width / 2)
    this.mass = options.mass || 80; // kg
    
    // Profile-based properties
    const profiles = {
      normal: { speed: 1.2, color: 0x3b82f6, label: 'Normal', age: 35 },
      elderly: { speed: 0.8, color: 0xf59e0b, label: 'Lansia', age: 70 },
      child: { speed: 0.9, color: 0x10b981, label: 'Anak', age: 10 },
      disabled: { speed: 0.5, color: 0xef4444, label: 'Disabilitas', age: 40 }
    };
    
    const profile = profiles[options.profile] || profiles.normal;
    this.profile = options.profile || 'normal';
    this.speed = options.speed || profile.speed;
    this.color = options.color || profile.color;
    this.label = options.label || profile.label;
    this.age = options.age || profile.age;
    
    // Simulation state
    this.level = options.level || 0;
    this.exitId = null;
    this.exitTime = null;
    this.evacuated = false;
    this.distanceTraveled = 0;
    
    // Behavior flags
    this.waiting = false;
    this.stuck = false;
    this.stuckTime = 0;
    this.waitTime = 0;
    
    // Visual reference
    this.mesh = null;
  }

  update(dt, force) {
    if (this.evacuated) return;
    
    // Update velocity: F = ma, a = F/m
    this.acceleration = force.clone().divideScalar(this.mass);
    this.velocity.add(this.acceleration.clone().multiplyScalar(dt));
    
    // Limit speed
    const speed = this.velocity.length();
    if (speed > this.speed * 2) {
      this.velocity.multiplyScalar((this.speed * 2) / speed);
    }
    
    // Update position
    const movement = this.velocity.clone().multiplyScalar(dt);
    this.position.add(movement);
    this.distanceTraveled += movement.length();
    
    // Check if stuck
    if (speed < 0.1) {
      this.stuckTime += dt;
      this.stuck = this.stuckTime > 5;
    } else {
      this.stuckTime = 0;
      this.stuck = false;
    }
  }

  setTarget(target, path = []) {
    this.target = target;
    this.path = path;
  }

  markEvacuated(time) {
    this.evacuated = true;
    this.exitTime = time;
  }

  toJSON() {
    return {
      id: this.id,
      profile: this.profile,
      position: { x: this.position.x, y: this.position.y, z: this.position.z },
      velocity: { x: this.velocity.x, y: this.velocity.y, z: this.velocity.z },
      speed: this.speed,
      radius: this.radius,
      exitId: this.exitId,
      exitTime: this.exitTime,
      evacuated: this.evacuated,
      distanceTraveled: this.distanceTraveled,
      stuck: this.stuck
    };
  }

  static fromJSON(data) {
    const agent = new Agent({
      id: data.id,
      profile: data.profile,
      position: new THREE.Vector3(data.position.x, data.position.y, data.position.z),
      speed: data.speed,
      radius: data.radius
    });
    
    agent.velocity = new THREE.Vector3(data.velocity.x, data.velocity.y, data.velocity.z);
    agent.exitId = data.exitId;
    agent.exitTime = data.exitTime;
    agent.evacuated = data.evacuated;
    agent.distanceTraveled = data.distanceTraveled;
    agent.stuck = data.stuck;
    
    return agent;
  }
}

/**
 * Exit - Door, stair, atau emergency exit
 */
export class Exit {
  constructor(options = {}) {
    this.id = options.id || `exit_${Date.now()}`;
    this.position = options.position || new THREE.Vector3(0, 0, 0);
    this.type = options.type || 'door'; // door, stair, ramp, elevator
    
    // Physical properties
    this.width = options.width || 1.2; // meters
    this.height = options.height || 2.2; // meters
    
    // Capacity properties
    this.capacity = options.capacity || this.calculateCapacity();
    
    // Classification
    this.isFinalExit = options.isFinalExit !== false;
    this.level = options.level || 0;
    
    // For stairs: which level it leads to
    this.leadsTo = options.leadsTo || null;
    
    // State
    this.open = options.open !== false;
    this.blocked = options.blocked || false;
    
    // Flow tracking
    this.evacuatedCount = 0;
    this.lastEvacuationTime = 0;
    
    // Visual
    this.mesh = null;
  }

  calculateCapacity() {
    // Capacity in persons/m/second based on exit type
    const capacities = {
      door: 1.5,
      stair: 1.0,
      ramp: 1.2,
      elevator: 0.5,
      window: 0.3
    };
    
    const baseCapacity = capacities[this.type] || 1.0;
    return baseCapacity * this.width;
  }

  canAccept(time) {
    if (!this.open || this.blocked) return false;
    
    // Check if capacity allows
    const timeSinceLast = time - this.lastEvacuationTime;
    const minInterval = 1 / this.capacity;
    
    return timeSinceLast >= minInterval;
  }

  recordEvacuation(time) {
    this.evacuatedCount++;
    this.lastEvacuationTime = time;
  }

  getFlowRate(duration) {
    if (duration <= 0) return 0;
    return (this.evacuatedCount / duration) * 60; // persons/minute
  }

  toJSON() {
    return {
      id: this.id,
      type: this.type,
      position: { x: this.position.x, y: this.position.y, z: this.position.z },
      width: this.width,
      height: this.height,
      capacity: this.capacity,
      isFinalExit: this.isFinalExit,
      level: this.level,
      leadsTo: this.leadsTo,
      open: this.open,
      blocked: this.blocked
    };
  }
}

/**
 * Obstacle - Wall, furniture, atau barrier
 */
export class Obstacle {
  constructor(options = {}) {
    this.id = options.id || `obstacle_${Date.now()}`;
    this.type = options.type || 'wall'; // wall, furniture, barrier, column
    
    // Position
    this.position = options.position || new THREE.Vector3(0, 0, 0);
    this.rotation = options.rotation || 0; // radians
    
    // Dimensions
    this.width = options.width || 1.0;
    this.height = options.height || 3.0;
    this.depth = options.depth || 0.2;
    
    // For walls
    this.length = options.length || this.width;
    this.normal = options.normal || new THREE.Vector3(0, 0, 1);
    this.endPoint = options.endPoint || null; // For line obstacles
    
    // Properties
    this.walkable = options.walkable || false;
    this.transparent = options.transparent || false;
    
    // Visual
    this.mesh = null;
  }

  getBoundingBox() {
    const halfW = this.width / 2;
    const halfD = this.depth / 2;
    
    return {
      min: new THREE.Vector3(
        this.position.x - halfW,
        this.position.y,
        this.position.z - halfD
      ),
      max: new THREE.Vector3(
        this.position.x + halfW,
        this.position.y + this.height,
        this.position.z + halfD
      )
    };
  }

  containsPoint(point) {
    const bbox = this.getBoundingBox();
    return point.x >= bbox.min.x && point.x <= bbox.max.x &&
           point.y >= bbox.min.y && point.y <= bbox.max.y &&
           point.z >= bbox.min.z && point.z <= bbox.max.z;
  }

  distanceToPoint(point) {
    if (this.containsPoint(point)) return 0;
    
    const bbox = this.getBoundingBox();
    const dx = Math.max(bbox.min.x - point.x, 0, point.x - bbox.max.x);
    const dy = Math.max(bbox.min.y - point.y, 0, point.y - bbox.max.y);
    const dz = Math.max(bbox.min.z - point.z, 0, point.z - bbox.max.z);
    
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  closestPoint(point) {
    const bbox = this.getBoundingBox();
    
    return new THREE.Vector3(
      Math.max(bbox.min.x, Math.min(point.x, bbox.max.x)),
      Math.max(bbox.min.y, Math.min(point.y, bbox.max.y)),
      Math.max(bbox.min.z, Math.min(point.z, bbox.max.z))
    );
  }

  toJSON() {
    return {
      id: this.id,
      type: this.type,
      position: { x: this.position.x, y: this.position.y, z: this.position.z },
      rotation: this.rotation,
      width: this.width,
      height: this.height,
      depth: this.depth,
      length: this.length,
      normal: { x: this.normal.x, y: this.normal.y, z: this.normal.z },
      walkable: this.walkable
    };
  }
}

/**
 * RoomNode - Node dalam navigation mesh
 */
export class RoomNode {
  constructor(options = {}) {
    this.id = options.id || `node_${Date.now()}`;
    this.x = options.x || 0;
    this.y = options.y || 0;
    this.z = options.z || 0;
    this.level = options.level || 0;
    
    // Connections to other nodes
    this.connections = options.connections || [];
    
    // Properties
    this.isExit = options.isExit || false;
    this.exitId = options.exitId || null;
    this.isSpawn = options.isSpawn || false;
    
    // For A*
    this.gScore = Infinity;
    this.fScore = Infinity;
    this.cameFrom = null;
  }

  distanceTo(other) {
    return Math.sqrt(
      Math.pow(this.x - other.x, 2) +
      Math.pow(this.y - other.y, 2) +
      Math.pow(this.z - other.z, 2)
    );
  }

  addConnection(nodeId, distance = null) {
    const dist = distance || this.distanceTo({ x: nodeId.x, y: nodeId.y, z: nodeId.z });
    
    this.connections.push({
      target: nodeId,
      distance: dist,
      weight: dist
    });
  }

  resetPathfinding() {
    this.gScore = Infinity;
    this.fScore = Infinity;
    this.cameFrom = null;
  }

  toVector3() {
    return new THREE.Vector3(this.x, this.y, this.z);
  }

  toJSON() {
    return {
      id: this.id,
      x: this.x,
      y: this.y,
      z: this.z,
      level: this.level,
      connections: this.connections,
      isExit: this.isExit,
      isSpawn: this.isSpawn
    };
  }

  static fromJSON(data) {
    return new RoomNode({
      id: data.id,
      x: data.x,
      y: data.y,
      z: data.z,
      level: data.level,
      connections: data.connections,
      isExit: data.isExit,
      isSpawn: data.isSpawn
    });
  }
}

export default { Agent, Exit, Obstacle, RoomNode };
