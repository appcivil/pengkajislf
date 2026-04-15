/**
 * PathfinderEngine.js - Social Force Model + A* Pathfinding
 * Simulasi evakuasi berbasis Helbing & Molnár Social Force Model
 */

import * as THREE from 'three';

export class PathfinderEngine {
  constructor(scene) {
    this.scene = scene;
    this.agents = [];
    this.exits = [];
    this.obstacles = [];
    this.navMesh = null;
    this.time = 0;
    this.dt = 0.05; // 50ms timestep
    this.isRunning = false;
    
    // Social Force Model parameters (Helbing & Molnár)
    this.params = {
      desiredSpeed: 1.2,        // m/s (normal walking speed)
      maxSpeed: 2.0,            // m/s (running speed)
      relaxationTime: 0.5,      // tau (reaction time)
      agentRadius: 0.3,         // m (shoulder width / 2)
      repulsionStrength: 2000,  // A (N)
      repulsionRange: 0.5,      // B (m)
      wallRepulsion: 1500,      // wall strength (N)
      exitAttraction: 3000,     // exit pull force (N)
      friction: 0.3             // friction coefficient
    };

    // Event listeners
    this.listeners = new Map();
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(cb => cb(data));
    }
    // Also dispatch DOM event for UI
    window.dispatchEvent(new CustomEvent(`pathfinder:${event}`, { detail: data }));
  }

  /**
   * Initialize dari data arsitektur (floor plans, walls, stairs)
   */
  initializeFromArchitecture(floorPlans, walls = [], stairs = [], doors = []) {
    this.buildNavMesh(floorPlans);
    
    // Convert walls ke obstacles
    walls.forEach(wall => {
      this.obstacles.push({
        type: 'wall',
        position: new THREE.Vector3(wall.x, wall.y, wall.z || 0),
        normal: new THREE.Vector3(wall.nx, wall.ny, wall.nz || 0),
        length: wall.length || 1,
        height: wall.height || 3
      });
    });

    // Convert doors/exit ke exits
    doors.forEach(door => {
      this.exits.push({
        id: `door_${door.id}`,
        position: new THREE.Vector3(door.x, door.y, door.z || 0),
        type: 'door',
        capacity: door.width * 1.5, // persons/m/s
        width: door.width || 1.2,
        isFinalExit: door.isFinalExit !== false,
        level: door.level || 0
      });
    });

    // Convert stairs ke vertical exits
    stairs.forEach(stair => {
      this.exits.push({
        id: `stair_${stair.id}`,
        position: new THREE.Vector3(stair.x, stair.y, stair.z || 0),
        type: 'stair',
        capacity: stair.width * 1.0, // stairs slower
        width: stair.width || 1.2,
        isFinalExit: false,
        level: stair.level || 0,
        leadsTo: stair.leadsTo || (stair.level + 1)
      });
    });

    console.log(`[Pathfinder] Initialized: ${this.obstacles.length} obstacles, ${this.exits.length} exits`);
    this.emit('initialized', { obstacles: this.obstacles.length, exits: this.exits.length });
  }

  /**
   * Build navigation mesh dari floor plans
   */
  buildNavMesh(floorPlans) {
    this.navMesh = {
      nodes: [],
      edges: [],
      levels: new Map()
    };

    floorPlans.forEach((floor, level) => {
      const levelNodes = [];
      
      // Create nodes dari floor plan vertices
      if (floor.points && floor.points.length > 0) {
        floor.points.forEach((point, i) => {
          const node = {
            id: `${level}_${i}`,
            x: point.x,
            y: point.y,
            z: level * 3, // 3m per floor
            level: level,
            connections: [],
            isExit: false
          };
          this.navMesh.nodes.push(node);
          levelNodes.push(node);
        });
      }

      // Connect nodes (simplified visibility graph)
      for (let i = 0; i < levelNodes.length; i++) {
        for (let j = i + 1; j < levelNodes.length; j++) {
          const n1 = levelNodes[i];
          const n2 = levelNodes[j];
          
          if (this.hasLineOfSight(n1, n2, floor.walls)) {
            const dist = Math.sqrt(
              Math.pow(n1.x - n2.x, 2) + 
              Math.pow(n1.y - n2.y, 2) + 
              Math.pow(n1.z - n2.z, 2)
            );
            
            if (dist < 15) { // Max connection distance
              n1.connections.push({ target: n2.id, distance: dist, weight: dist });
              n2.connections.push({ target: n1.id, distance: dist, weight: dist });
            }
          }
        }
      }

      this.navMesh.levels.set(level, levelNodes);
    });

    // Mark exit nodes
    this.exits.forEach(exit => {
      const nearest = this.findNearestNode(exit.position);
      if (nearest) {
        nearest.isExit = true;
        nearest.exitId = exit.id;
      }
    });
  }

  hasLineOfSight(n1, n2, walls = []) {
    // Simplified line-of-sight check
    const dx = n2.x - n1.x;
    const dy = n2.y - n1.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist > 20) return false; // Max visibility
    
    // Check wall intersections (simplified)
    for (const wall of walls || []) {
      // AABB intersection check
      if (this.lineIntersectsWall(n1, n2, wall)) {
        return false;
      }
    }
    
    return true;
  }

  lineIntersectsWall(n1, n2, wall) {
    // Simplified intersection check
    const tolerance = 0.5;
    const minX = Math.min(wall.x, wall.x + wall.nx * wall.length) - tolerance;
    const maxX = Math.max(wall.x, wall.x + wall.nx * wall.length) + tolerance;
    const minY = Math.min(wall.y, wall.y + wall.ny * wall.length) - tolerance;
    const maxY = Math.max(wall.y, wall.y + wall.ny * wall.length) + tolerance;
    
    const lineMinX = Math.min(n1.x, n2.x);
    const lineMaxX = Math.max(n1.x, n2.x);
    const lineMinY = Math.min(n1.y, n2.y);
    const lineMaxY = Math.max(n1.y, n2.y);
    
    return !(lineMaxX < minX || lineMinX > maxX || lineMaxY < minY || lineMinY > maxY);
  }

  findNearestNode(position) {
    let nearest = null;
    let minDist = Infinity;
    
    this.navMesh.nodes.forEach(node => {
      if (Math.abs(node.z - position.z) > 2) return; // Different level
      
      const dist = Math.sqrt(
        Math.pow(node.x - position.x, 2) + 
        Math.pow(node.y - position.y, 2)
      );
      
      if (dist < minDist) {
        minDist = dist;
        nearest = node;
      }
    });
    
    return nearest;
  }

  /**
   * Add agent dengan profile karakteristik
   */
  addAgent(spawnPoint, profile = 'normal') {
    const profiles = {
      'normal': { 
        speed: 1.2, 
        radius: 0.3, 
        color: 0x3b82f6,
        label: 'Normal',
        age: 35
      },
      'elderly': { 
        speed: 0.8, 
        radius: 0.35, 
        color: 0xf59e0b,
        label: 'Lansia',
        age: 70
      },
      'child': { 
        speed: 0.9, 
        radius: 0.25, 
        color: 0x10b981,
        label: 'Anak',
        age: 10
      },
      'disabled': { 
        speed: 0.5, 
        radius: 0.4, 
        color: 0xef4444,
        label: 'Disabilitas',
        age: 40
      }
    };

    const p = profiles[profile] || profiles.normal;
    const agent = {
      id: `agent_${this.agents.length}_${Date.now()}`,
      position: new THREE.Vector3(spawnPoint.x, spawnPoint.y, spawnPoint.z),
      velocity: new THREE.Vector3(0, 0, 0),
      acceleration: new THREE.Vector3(0, 0, 0),
      target: null,
      path: [],
      speed: p.speed,
      radius: p.radius,
      color: p.color,
      profile: profile,
      label: p.label,
      age: p.age,
      exitTime: null,
      distanceTraveled: 0,
      waiting: false,
      stuck: false,
      level: Math.floor(spawnPoint.z / 3),
      mesh: null
    };

    // Assign target exit
    this.assignTargetExit(agent);
    this.agents.push(agent);
    
    this.emit('agentAdded', { agent, count: this.agents.length });
    return agent;
  }

  assignTargetExit(agent) {
    // Find nearest suitable exit
    let nearest = null;
    let minScore = Infinity;
    
    this.exits.forEach(exit => {
      // Check if exit is on same level or accessible
      if (exit.level !== agent.level && exit.type !== 'stair') return;
      
      const dist = Math.sqrt(
        Math.pow(agent.position.x - exit.position.x, 2) +
        Math.pow(agent.position.y - exit.position.y, 2) +
        Math.pow(agent.position.z - exit.position.z, 2)
      );
      
      // Score = distance / capacity (prefer less crowded exits)
      const score = dist / (exit.capacity || 1);
      
      if (score < minScore) {
        minScore = score;
        nearest = exit;
      }
    });

    if (nearest) {
      agent.target = nearest.position.clone();
      agent.exitId = nearest.id;
      agent.exitType = nearest.type;
      
      // Calculate A* path
      this.calculateAStarPath(agent);
    }
  }

  /**
   * A* Pathfinding pada navmesh
   */
  calculateAStarPath(agent) {
    if (!agent.target) return;
    
    const start = this.findNearestNode(agent.position);
    const goal = this.findNearestNode(agent.target);
    
    if (!start || !goal) {
      agent.path = [agent.target]; // Direct path fallback
      return;
    }
    
    // A* algorithm
    const open = new Map();
    const closed = new Set();
    const cameFrom = new Map();
    const gScore = new Map();
    const fScore = new Map();
    
    open.set(start.id, start);
    gScore.set(start.id, 0);
    fScore.set(start.id, this.heuristic(start, goal));
    
    while (open.size > 0) {
      // Get node with lowest fScore
      let current = null;
      let minF = Infinity;
      
      for (const [id, node] of open) {
        const f = fScore.get(id) || Infinity;
        if (f < minF) {
          minF = f;
          current = node;
        }
      }
      
      if (!current) break;
      
      if (current.id === goal.id) {
        // Reconstruct path
        const path = [];
        let curr = goal;
        while (cameFrom.has(curr.id)) {
          path.unshift(new THREE.Vector3(curr.x, curr.y, curr.z));
          curr = cameFrom.get(curr.id);
        }
        path.unshift(new THREE.Vector3(start.x, start.y, start.z));
        agent.path = path;
        return;
      }
      
      open.delete(current.id);
      closed.add(current.id);
      
      // Check neighbors
      for (const conn of current.connections || []) {
        const neighbor = this.navMesh.nodes.find(n => n.id === conn.target);
        if (!neighbor || closed.has(neighbor.id)) continue;
        
        const tentativeG = (gScore.get(current.id) || 0) + conn.distance;
        
        if (!open.has(neighbor.id)) {
          open.set(neighbor.id, neighbor);
        } else if (tentativeG >= (gScore.get(neighbor.id) || Infinity)) {
          continue;
        }
        
        cameFrom.set(neighbor.id, current);
        gScore.set(neighbor.id, tentativeG);
        fScore.set(neighbor.id, tentativeG + this.heuristic(neighbor, goal));
      }
    }
    
    // Fallback ke direct path
    agent.path = [agent.target];
  }

  heuristic(a, b) {
    return Math.sqrt(
      Math.pow(a.x - b.x, 2) + 
      Math.pow(a.y - b.y, 2) + 
      Math.pow(a.z - b.z, 2)
    );
  }

  /**
   * Social Force Model - Calculate forces untuk semua agents
   */
  calculateForces(agent) {
    const force = new THREE.Vector3(0, 0, 0);
    
    // 1. Driving force (desired velocity - actual velocity)
    if (agent.target && agent.exitTime === null) {
      let direction;
      
      if (agent.path.length > 0) {
        // Follow path
        const nextPoint = agent.path[0];
        const distToPoint = agent.position.distanceTo(nextPoint);
        
        if (distToPoint < 0.5) {
          agent.path.shift(); // Reached waypoint
        }
        
        direction = new THREE.Vector3()
          .subVectors(nextPoint || agent.target, agent.position)
          .normalize();
      } else {
        direction = new THREE.Vector3()
          .subVectors(agent.target, agent.position)
          .normalize();
      }
      
      const desiredVelocity = direction.multiplyScalar(agent.speed);
      const velocityDiff = new THREE.Vector3().subVectors(desiredVelocity, agent.velocity);
      force.add(velocityDiff.multiplyScalar(1 / this.params.relaxationTime));
    }

    // 2. Agent-agent repulsion (Social Force)
    let neighborCount = 0;
    this.agents.forEach(other => {
      if (other.id === agent.id || other.exitTime !== null) return;
      
      const diff = new THREE.Vector3().subVectors(agent.position, other.position);
      const dist = diff.length();
      const minDist = agent.radius + other.radius;
      
      if (dist < this.params.repulsionRange && dist > 0.01) {
        // Exponential repulsion (Helbing model)
        const repulsion = diff.normalize().multiplyScalar(
          this.params.repulsionStrength * 
          Math.exp((minDist - dist) / this.params.repulsionRange)
        );
        force.add(repulsion);
        neighborCount++;
      }
      
      // Physical contact force (when actually touching)
      if (dist < minDist && dist > 0.01) {
        const overlap = minDist - dist;
        const contactForce = diff.normalize().multiplyScalar(overlap * 5000); // Stiff spring
        force.add(contactForce);
      }
    });

    // 3. Wall/Obstacle repulsion
    this.obstacles.forEach(obstacle => {
      const closest = this.closestPointOnObstacle(agent.position, obstacle);
      const diff = new THREE.Vector3().subVectors(agent.position, closest);
      const dist = diff.length();
      
      if (dist < 1.0 && dist > 0.01) {
        const repulsion = diff.normalize().multiplyScalar(
          this.params.wallRepulsion / (dist * dist)
        );
        force.add(repulsion);
      }
    });

    // 4. Exit attraction (if close)
    if (agent.target) {
      const toExit = new THREE.Vector3().subVectors(agent.target, agent.position);
      const distToExit = toExit.length();
      
      if (distToExit < 10 && distToExit > 0.5) {
        force.add(toExit.normalize().multiplyScalar(this.params.exitAttraction));
      }
    }

    // 5. Random fluctuation (noise)
    const noise = new THREE.Vector3(
      (Math.random() - 0.5) * 10,
      (Math.random() - 0.5) * 10,
      0
    );
    force.add(noise);

    return force;
  }

  closestPointOnObstacle(position, obstacle) {
    if (obstacle.type === 'wall') {
      const wallStart = obstacle.position;
      const wallEnd = new THREE.Vector3().addVectors(
        obstacle.position,
        obstacle.normal.clone().multiplyScalar(obstacle.length)
      );
      
      return this.closestPointOnLineSegment(position, wallStart, wallEnd);
    }
    
    return obstacle.position;
  }

  closestPointOnLineSegment(point, lineStart, lineEnd) {
    const line = new THREE.Vector3().subVectors(lineEnd, lineStart);
    const len = line.length();
    
    if (len === 0) return lineStart;
    
    const t = Math.max(0, Math.min(1,
      new THREE.Vector3().subVectors(point, lineStart).dot(line) / (len * len)
    ));
    
    return new THREE.Vector3().addVectors(lineStart, line.multiplyScalar(t));
  }

  /**
   * Single simulation step
   */
  step() {
    if (!this.isRunning) return;

    const activeAgents = [];
    
    this.agents.forEach(agent => {
      if (agent.exitTime !== null) return; // Already evacuated
      
      activeAgents.push(agent);

      // Calculate forces
      const force = this.calculateForces(agent);
      
      // Update velocity: F = ma, v = v + (F/m) * dt
      const mass = 80; // Average person mass (kg)
      agent.acceleration = force.clone().divideScalar(mass);
      agent.velocity.add(agent.acceleration.clone().multiplyScalar(this.dt));
      
      // Speed limit
      const speed = agent.velocity.length();
      if (speed > this.params.maxSpeed) {
        agent.velocity.multiplyScalar(this.params.maxSpeed / speed);
      }
      
      // Apply friction
      agent.velocity.multiplyScalar(1 - this.params.friction);

      // Update position
      const movement = agent.velocity.clone().multiplyScalar(this.dt);
      agent.position.add(movement);
      agent.distanceTraveled += movement.length();

      // Update stuck detection
      if (speed < 0.1) {
        agent.stuckTime = (agent.stuckTime || 0) + this.dt;
        agent.stuck = agent.stuckTime > 5; // Stuck if not moving for 5s
      } else {
        agent.stuckTime = 0;
        agent.stuck = false;
      }

      // Check exit reached
      if (agent.target) {
        const distToExit = agent.position.distanceTo(agent.target);
        
        if (distToExit < 0.5) {
          const exit = this.exits.find(e => e.id === agent.exitId);
          
          if (exit && exit.isFinalExit) {
            // Evacuated!
            agent.exitTime = this.time;
            agent.evacuated = true;
            this.emit('agentEvacuated', { agent, time: this.time });
          } else if (exit && exit.type === 'stair') {
            // Move to next level
            agent.level = exit.leadsTo || (agent.level + 1);
            agent.position.y = agent.level * 3;
            this.assignTargetExit(agent);
          }
        }
      }

      // Boundary check
      agent.position.x = Math.max(-100, Math.min(100, agent.position.x));
      agent.position.y = Math.max(-5, Math.min(50, agent.position.y));
      agent.position.z = Math.max(-100, Math.min(100, agent.position.z));
    });

    this.time += this.dt;
    
    // Emit progress every second
    if (Math.floor(this.time) > Math.floor(this.time - this.dt)) {
      this.emit('tick', { 
        time: this.time, 
        activeAgents: activeAgents.length,
        evacuated: this.agents.filter(a => a.exitTime !== null).length,
        stuck: this.agents.filter(a => a.stuck).length
      });
    }
  }

  getActiveCount() {
    return this.agents.filter(a => a.exitTime === null).length;
  }

  getEvacuatedCount() {
    return this.agents.filter(a => a.exitTime !== null).length;
  }

  async runSimulation(maxTime = 600, realTime = false) {
    this.isRunning = true;
    this.time = 0;
    
    // Reset agents
    this.agents.forEach(a => {
      a.exitTime = null;
      a.evacuated = false;
      a.velocity.set(0, 0, 0);
      a.acceleration.set(0, 0, 0);
      a.distanceTraveled = 0;
      a.stuck = false;
      a.stuckTime = 0;
    });

    this.emit('simulationStart', { 
      agents: this.agents.length, 
      maxTime 
    });

    return new Promise((resolve) => {
      const interval = setInterval(() => {
        // Run multiple substeps for stability
        const stepsPerFrame = realTime ? 1 : 20;
        
        for (let i = 0; i < stepsPerFrame; i++) {
          this.step();
          
          // Check completion
          if (this.getActiveCount() === 0 || this.time >= maxTime) {
            break;
          }
        }

        // Check completion atau timeout
        if (this.getActiveCount() === 0 || this.time >= maxTime) {
          clearInterval(interval);
          this.isRunning = false;
          
          const results = this.generateResults();
          this.emit('simulationComplete', results);
          resolve(results);
        }
      }, realTime ? 50 : 50); // 20 FPS
    });
  }

  generateResults() {
    const evacuated = this.agents.filter(a => a.exitTime !== null);
    const stranded = this.agents.filter(a => a.exitTime === null);
    
    const exitTimes = evacuated.map(a => a.exitTime).filter(t => t !== null);
    
    let minTime = Infinity, maxTime = 0, totalTime = 0;
    exitTimes.forEach(t => {
      if (t < minTime) minTime = t;
      if (t > maxTime) maxTime = t;
      totalTime += t;
    });
    
    const avgTime = exitTimes.length > 0 ? totalTime / exitTimes.length : 0;
    
    // RSET = waktu terakhir keluar (99th percentile lebih akurat)
    const sortedTimes = [...exitTimes].sort((a, b) => a - b);
    const rsetIndex = Math.floor(sortedTimes.length * 0.99);
    const rset = sortedTimes[rsetIndex] || maxTime;

    return {
      totalAgents: this.agents.length,
      evacuated: evacuated.length,
      stranded: stranded.length,
      evacuationRate: this.agents.length > 0 ? 
        (evacuated.length / this.agents.length * 100).toFixed(1) : 0,
      rset: rset.toFixed(2),
      rsetSeconds: Math.ceil(rset),
      minTime: minTime === Infinity ? 0 : minTime.toFixed(2),
      avgTime: avgTime.toFixed(2),
      maxTime: maxTime.toFixed(2),
      flowRates: this.calculateFlowRates(),
      densityMap: this.calculateDensityMap(),
      evacuationCurve: this.generateEvacuationCurve(),
      agentDetails: this.agents.map(a => ({
        id: a.id,
        profile: a.profile,
        exitTime: a.exitTime,
        distance: a.distanceTraveled.toFixed(2),
        avgSpeed: a.exitTime ? (a.distanceTraveled / a.exitTime).toFixed(2) : '0',
        evacuated: a.exitTime !== null,
        stuck: a.stuck
      })),
      timestamp: new Date().toISOString()
    };
  }

  calculateFlowRates() {
    const rates = {};
    
    this.exits.forEach(exit => {
      const exitAgents = this.agents.filter(a => a.exitId === exit.id && a.exitTime !== null);
      const count = exitAgents.length;
      
      // Flow rate = persons / minute
      const flowRate = this.time > 0 ? (count / (this.time / 60)) : 0;
      
      // Specific flow (persons / m / minute)
      const specificFlow = exit.width > 0 ? (flowRate / exit.width) : 0;
      
      rates[exit.id] = {
        total: count,
        flowRate: flowRate.toFixed(2),
        specificFlow: specificFlow.toFixed(2),
        width: exit.width,
        capacity: exit.capacity
      };
    });
    
    return rates;
  }

  calculateDensityMap(gridSize = 1) {
    const density = {};
    
    this.agents.forEach(agent => {
      if (agent.exitTime !== null) return;
      
      const key = `${Math.floor(agent.position.x / gridSize)},${Math.floor(agent.position.y / gridSize)}`;
      density[key] = (density[key] || 0) + 1;
    });
    
    // Calculate area dan persons/m2
    const densityPerArea = {};
    Object.entries(density).forEach(([key, count]) => {
      densityPerArea[key] = {
        count,
        density: count / (gridSize * gridSize), // persons/m²
        level: 'low'
      };
      
      if (densityPerArea[key].density > 4) densityPerArea[key].level = 'extreme';
      else if (densityPerArea[key].density > 2) densityPerArea[key].level = 'high';
      else if (densityPerArea[key].density > 1) densityPerArea[key].level = 'medium';
    });
    
    return densityPerArea;
  }

  generateEvacuationCurve() {
    const curve = [];
    const interval = 10; // Every 10 seconds
    
    for (let t = 0; t <= Math.ceil(this.time); t += interval) {
      const evacuated = this.agents.filter(a => a.exitTime !== null && a.exitTime <= t).length;
      const percent = this.agents.length > 0 ? (evacuated / this.agents.length * 100) : 0;
      
      curve.push({
        time: t,
        evacuated,
        percent: percent.toFixed(1)
      });
    }
    
    return curve;
  }

  stop() {
    this.isRunning = false;
  }

  reset() {
    this.agents = [];
    this.exits = [];
    this.obstacles = [];
    this.navMesh = null;
    this.time = 0;
    this.isRunning = false;
    this.emit('reset');
  }
}

export default { PathfinderEngine };
