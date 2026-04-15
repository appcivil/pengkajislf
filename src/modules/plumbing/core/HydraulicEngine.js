// ============================================================
// HYDRAULIC ENGINE - Hardy-Cross Method Solver
// Network Analysis untuk Sistem Air Bersih
// Based on SNI 03-7065-2005 Standard
// ============================================================

import { EventEmitter } from '../../core/EventBus.js';

export class HydraulicEngine extends EventEmitter {
  constructor() {
    super();
    this.nodes = new Map();      // Junctions, Tanks, Reservoirs
    this.pipes = new Map();      // Pipes, Pumps, Valves
    this.iterations = 0;
    this.maxIterations = 100;
    this.tolerance = 0.001;      // 0.1% convergence
    this.gravity = 9.81;
    this.rho = 1000;             // kg/m3 water density
    this.viscosity = 0.000001;   // kinematic viscosity m2/s
    this.isRunning = false;
  }

  // Initialize network from building data (auto-populate)
  initializeFromArchitecture(archData) {
    const { floorPlans, buildingType = 'office' } = archData;
    
    // Calculate total fixture units based on SNI 03-7065-2005
    const totalFixtures = this.calculateFixtureUnits(floorPlans, buildingType);
    const totalDemand = this.calculateDemandFlow(totalFixtures);
    
    // Create skeleton network
    this.createSkeletonNetwork(floorPlans, totalDemand);
    
    return {
      nodes: this.nodes.size,
      pipes: this.pipes.size,
      totalDemand: totalDemand.toFixed(2) + ' L/s',
      fixtureUnits: totalFixtures
    };
  }

  calculateFixtureUnits(floorPlans, type) {
    // SNI Standard Fixture Units
    const fixtures = {
      office: { toilet: 3, sink: 1, pantry: 2 },
      residential: { toilet: 4, sink: 1, shower: 2, kitchen: 2 },
      hospital: { toilet: 4, sink: 2, shower: 3, bedpan: 4 },
      commercial: { toilet: 3, sink: 2, shower: 2 },
      industrial: { toilet: 2, sink: 1, shower: 1 }
    };
    
    const unit = fixtures[type] || fixtures.office;
    const rooms = floorPlans?.length || 10;
    const fixturesPerRoom = Object.values(unit).reduce((a, b) => a + b, 0);
    
    return fixturesPerRoom * rooms;
  }

  calculateDemandFlow(fixtureUnits) {
    // Hunter's Curve simplified (SNI method)
    // Q = 0.14 * sqrt(FU) for FU < 1000
    if (fixtureUnits < 1000) {
      return 0.14 * Math.sqrt(fixtureUnits); // L/s
    }
    return 0.35 * Math.pow(fixtureUnits, 0.54); // L/s
  }

  // Demand berdasarkan fungsi bangunan (SNI 6774:2008 & Permen 14/2017)
  calculateBuildingDemand(buildingType, units) {
    const standards = {
      'hospital_inpatient': { daily: 1000, unit: 'bed', peakFactor: 1.5 },
      'hospital_outpatient': { daily: 40, unit: 'patient', peakFactor: 1.3 },
      'office': { daily: 100, unit: 'person', peakFactor: 1.2 },
      'public': { daily: 20, unit: 'person', peakFactor: 1.5 },
      'residential': { daily: 250, unit: 'person', peakFactor: 1.3 },
      'commercial': { daily: 40, unit: 'person', peakFactor: 1.4 },
      'school': { daily: 50, unit: 'student', peakFactor: 1.3 },
      'hotel': { daily: 300, unit: 'room', peakFactor: 1.4 }
    };

    const std = standards[buildingType] || standards.office;
    const dailyDemand = units * std.daily; // L/day
    const peakHourFlow = (dailyDemand / 24) * std.peakFactor; // L/hour
    const peakFlowRate = peakHourFlow / 3600; // L/s

    return {
      dailyDemand,
      peakHourFlow,
      peakFlowRate,
      groundTankVolume: dailyDemand * 0.3, // 30% daily demand
      roofTankVolume: dailyDemand * 0.15,  // 15% daily demand
      fireReserve: 144000, // 30 min @ 4800 LPM = 144 m3
      unit: std.unit,
      peakFactor: std.peakFactor
    };
  }

  addNode(id, type, x, y, elevation = 0, demand = 0, options = {}) {
    this.nodes.set(id, {
      id,
      type,           // 'junction', 'tank', 'reservoir', 'pump', 'valve'
      x, y,
      elevation,      // m
      demand,         // L/s (positive = consumption, negative = source)
      head: options.head || elevation,        // Hydraulic head (m)
      pressure: 0,     // kPa
      pressureHead: 0, // m
      quality: {      // Water quality parameters
        chlorine: options.chlorine || 0.5, // mg/L
        ph: options.ph || 7.0,
        turbidity: options.turbidity || 0,
        tds: options.tds || 150,
        temperature: options.temperature || 25
      },
      ...options
    });
    return id;
  }

  addPipe(id, node1, node2, diameter, length, options = {}) {
    // Hazen-Williams C factor (100 = steel, 140 = PVC, 110 = CI, 150 = PE)
    const defaults = {
      roughness: options.roughness || 140,
      material: options.material || 'PVC',
      flow: 0,
      velocity: 0,
      headloss: 0,
      status: 'open',
      minorLoss: options.minorLoss || 0 // K coefficient for fittings
    };

    this.pipes.set(id, {
      id,
      node1, node2,
      diameter: diameter / 1000, // convert to meters
      length,                    // meters
      ...defaults
    });
    return id;
  }

  addPump(id, node1, node2, specs) {
    const pump = {
      id,
      type: 'pump',
      node1, node2,
      ...specs,
      flow: 0,
      head: 0,
      efficiency: specs.efficiency || 0.75,
      power: specs.power || 0, // kW
      status: 'on'
    };
    this.pipes.set(id, pump);
    return id;
  }

  addTank(id, x, y, specs) {
    const tank = {
      id,
      type: 'tank',
      x, y,
      elevation: specs.elevation || 0,
      capacity: specs.capacity || 10000, // liters
      currentLevel: specs.currentLevel || 0.8, // 80% full
      minLevel: specs.minLevel || 0.1,
      maxLevel: specs.maxLevel || 0.95,
      diameter: specs.diameter || 3, // m
      head: specs.elevation || 0,
      demand: 0,
      quality: {
        chlorine: specs.chlorine || 0.5,
        ph: specs.ph || 7.0,
        turbidity: specs.turbidity || 0
      }
    };
    this.nodes.set(id, tank);
    return id;
  }

  // Hardy-Cross iterative solution
  async solve() {
    if (this.isRunning) {
      throw new Error('Solver is already running');
    }

    this.isRunning = true;
    this.emit('solver:start');
    let maxError = Infinity;
    this.iterations = 0;

    // Initialize flows (balanced initially)
    this.initializeFlows();

    try {
      while (maxError > this.tolerance && this.iterations < this.maxIterations) {
        maxError = 0;
        
        // Loop equations (Hardy-Cross)
        for (const [pipeId, pipe] of this.pipes) {
          if (pipe.status === 'closed' || pipe.type === 'pump') continue;
          
          const nodeA = this.nodes.get(pipe.node1);
          const nodeB = this.nodes.get(pipe.node2);
          
          if (!nodeA || !nodeB) continue;
          
          // Calculate head difference
          const deltaHead = nodeA.head - nodeB.head;
          
          // Hazen-Williams headloss calculation
          // hL = 10.67 * L * Q^1.852 / (C^1.852 * D^4.87)
          const Q = Math.abs(pipe.flow) / 1000; // m3/s
          const hL = this.calculateHeadLoss(Q, pipe);
          
          pipe.headloss = hL * Math.sign(pipe.flow);
          
          // Flow correction (Hardy-Cross formula)
          const derivative = 1.852 * hL / Math.max(Q, 0.0001);
          const correction = -deltaHead / derivative;
          
          const oldFlow = pipe.flow;
          pipe.flow += correction * 1000; // back to L/s
          
          const error = Math.abs((pipe.flow - oldFlow) / Math.max(oldFlow, 0.001));
          maxError = Math.max(maxError, error);
          
          // Update velocity
          const area = Math.PI * Math.pow(pipe.diameter / 2, 2);
          pipe.velocity = (pipe.flow / 1000) / area; // m/s
        }

        // Process pumps
        this.processPumps();

        // Node continuity (mass balance)
        this.balanceNodes();

        this.iterations++;
        
        // Emit progress every 10 iterations or on significant change
        if (this.iterations % 10 === 0 || maxError < this.tolerance * 10) {
          this.emit('solver:progress', { 
            iteration: this.iterations, 
            error: maxError,
            converged: maxError <= this.tolerance 
          });
        }

        // Allow UI to update
        if (this.iterations % 20 === 0) {
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      }

      // Calculate final pressures
      this.calculatePressures();

      const converged = maxError <= this.tolerance;
      this.emit('solver:complete', { 
        iterations: this.iterations, 
        converged,
        maxError: maxError.toFixed(6)
      });

      return this.generateResults();
    } finally {
      this.isRunning = false;
    }
  }

  calculateHeadLoss(Q, pipe) {
    // Hazen-Williams equation
    // hL = 10.67 * L * (Q/C)^1.852 / D^4.87
    if (Q === 0) return 0;
    
    const hL = 10.67 * pipe.length * Math.pow(Q / pipe.roughness, 1.852) / 
               Math.pow(pipe.diameter, 4.87);
    
    // Add minor losses if specified
    if (pipe.minorLoss > 0) {
      const velocity = Q / (Math.PI * Math.pow(pipe.diameter / 2, 2));
      const minorLoss = pipe.minorLoss * Math.pow(velocity, 2) / (2 * this.gravity);
      return hL + minorLoss;
    }
    
    return hL;
  }

  calculateDarcyWeisbach(Q, pipe) {
    // Alternative method for accuracy
    const velocity = Q / (Math.PI * Math.pow(pipe.diameter / 2, 2));
    const Re = (velocity * pipe.diameter) / this.viscosity;
    
    // Colebrook-White approximation (Swamee-Jain)
    const epsilon = 0.000046; // roughness for commercial steel (m)
    const f = 0.25 / Math.pow(
      Math.log10(epsilon / (3.7 * pipe.diameter) + 5.74 / Math.pow(Re, 0.9)), 2
    );
    
    const hL = f * (pipe.length / pipe.diameter) * (Math.pow(velocity, 2) / (2 * this.gravity));
    return hL;
  }

  processPumps() {
    for (const pipe of this.pipes.values()) {
      if (pipe.type !== 'pump' || pipe.status !== 'on') continue;
      
      const nodeA = this.nodes.get(pipe.node1);
      const nodeB = this.nodes.get(pipe.node2);
      
      if (!nodeA || !nodeB) continue;
      
      // Simple pump curve: H = H0 - k*Q^2
      const H0 = pipe.shutoffHead || 50; // m
      const k = pipe.curveCoefficient || 0.001;
      const Q = Math.abs(pipe.flow) / 1000; // m3/s
      
      pipe.head = H0 - k * Math.pow(Q * 3600, 2); // Convert Q to m3/h for typical curves
      
      // Update downstream node head
      if (pipe.flow > 0) {
        nodeB.head = nodeA.head + pipe.head;
      } else {
        nodeA.head = nodeB.head + pipe.head;
      }
      
      // Calculate power
      pipe.power = (pipe.flow / 1000) * pipe.head * this.rho * this.gravity / (3600 * pipe.efficiency);
    }
  }

  initializeFlows() {
    // Initial flow distribution based on demand
    const sources = Array.from(this.nodes.values()).filter(n => n.demand < 0 || n.type === 'reservoir');
    const totalSource = sources.reduce((sum, n) => sum + Math.abs(n.demand), 0);
    
    if (totalSource === 0) {
      // Even distribution if no demands set
      for (const pipe of this.pipes.values()) {
        if (pipe.type === 'pump') continue;
        const nodeA = this.nodes.get(pipe.node1);
        const nodeB = this.nodes.get(pipe.node2);
        const avgDemand = ((nodeA?.demand || 0) + (nodeB?.demand || 0)) / 2;
        pipe.flow = avgDemand || 1.0; // Default 1 L/s
      }
    } else {
      // Proportional to connected node demands
      for (const pipe of this.pipes.values()) {
        if (pipe.type === 'pump') continue;
        const nodeA = this.nodes.get(pipe.node1);
        const nodeB = this.nodes.get(pipe.node2);
        const demandSum = (nodeA?.demand || 0) + (nodeB?.demand || 0);
        pipe.flow = demandSum > 0 ? demandSum / 2 : 0.5;
      }
    }
  }

  balanceNodes() {
    // Ensure continuity: Sum(Qin) = Sum(Qout) + Demand
    for (const node of this.nodes.values()) {
      if (node.type === 'reservoir') continue; // Fixed head node
      
      let inflow = 0;
      let outflow = 0;
      
      for (const pipe of this.pipes.values()) {
        if (pipe.status === 'closed') continue;
        
        if (pipe.node1 === node.id) {
          // Flow leaving node
          if (pipe.flow > 0) outflow += pipe.flow;
          else inflow += Math.abs(pipe.flow);
        }
        if (pipe.node2 === node.id) {
          // Flow entering node
          if (pipe.flow > 0) inflow += pipe.flow;
          else outflow += Math.abs(pipe.flow);
        }
      }
      
      // Mass balance equation
      const imbalance = inflow - outflow - node.demand;
      
      // Distribute imbalance to connected pipes
      const connectedPipes = Array.from(this.pipes.values()).filter(
        p => p.status === 'open' && (p.node1 === node.id || p.node2 === node.id)
      );
      
      if (connectedPipes.length > 0) {
        const correction = imbalance / connectedPipes.length;
        connectedPipes.forEach(pipe => {
          if (pipe.type === 'pump') return;
          if (pipe.node1 === node.id) pipe.flow -= correction;
          else pipe.flow += correction;
        });
      }
      
      // Update hydraulic head for non-tank nodes
      if (node.type === 'junction') {
        // H = z + P/γ (from connecting pipe average)
        let totalHead = 0;
        let count = 0;
        for (const pipe of this.pipes.values()) {
          if (pipe.status === 'closed') continue;
          if (pipe.node1 === node.id) {
            const other = this.nodes.get(pipe.node2);
            if (other) {
              totalHead += other.head - pipe.headloss;
              count++;
            }
          } else if (pipe.node2 === node.id) {
            const other = this.nodes.get(pipe.node1);
            if (other) {
              totalHead += other.head + pipe.headloss;
              count++;
            }
          }
        }
        if (count > 0) {
          node.head = totalHead / count;
        }
      }
    }
  }

  calculatePressures() {
    for (const node of this.nodes.values()) {
      // Pressure head = Hydraulic head - Elevation
      node.pressureHead = node.head - node.elevation;
      // Pressure in kPa = γ * h
      node.pressure = node.pressureHead * this.rho * this.gravity / 1000; // kPa
      // Also in mH2O (same as pressureHead)
      node.pressureMh2o = node.pressureHead;
    }
  }

  generateResults() {
    const nodes = Array.from(this.nodes.values());
    const pipes = Array.from(this.pipes.values());

    // Compliance checks (SNI 6774 & Permen 14)
    const minPressure = Math.min(...nodes.filter(n => n.type === 'junction').map(n => n.pressureHead));
    const maxPressure = Math.max(...nodes.filter(n => n.type === 'junction').map(n => n.pressureHead));
    const maxVelocity = Math.max(...pipes.filter(p => p.type !== 'pump').map(p => p.velocity));
    const minVelocity = Math.min(...pipes.filter(p => p.type !== 'pump' && p.velocity > 0).map(p => p.velocity));

    const results = {
      nodes: nodes.map(n => ({
        id: n.id,
        type: n.type,
        elevation: n.elevation,
        demand: n.demand,
        head: parseFloat(n.head.toFixed(3)),
        pressure: parseFloat(n.pressure.toFixed(2)),      // kPa
        pressureHead: parseFloat(n.pressureHead.toFixed(2)), // m
        quality: n.quality
      })),
      pipes: pipes.map(p => ({
        id: p.id,
        type: p.type || 'pipe',
        node1: p.node1,
        node2: p.node2,
        diameter: (p.diameter * 1000).toFixed(0), // mm
        length: p.length.toFixed(1),
        material: p.material,
        flow: parseFloat(p.flow.toFixed(3)),              // L/s
        velocity: parseFloat(p.velocity.toFixed(2)),      // m/s
        headloss: parseFloat(p.headloss.toFixed(3)),      // m
        status: p.status,
        power: p.power ? parseFloat(p.power.toFixed(2)) : null // kW for pumps
      })),
      summary: {
        totalDemand: nodes.reduce((a, n) => a + (n.demand > 0 ? n.demand : 0), 0).toFixed(2),
        totalSupply: nodes.reduce((a, n) => a + (n.demand < 0 ? Math.abs(n.demand) : 0), 0).toFixed(2),
        minPressure: minPressure.toFixed(2),
        maxPressure: maxPressure.toFixed(2),
        maxVelocity: maxVelocity.toFixed(2),
        minVelocity: minVelocity === Infinity ? '0.00' : minVelocity.toFixed(2),
        totalHeadloss: pipes.reduce((a, p) => a + Math.abs(p.headloss), 0).toFixed(2),
        iterations: this.iterations,
        converged: this.iterations < this.maxIterations
      },
      compliance: {
        pressureOk: minPressure >= 10 && maxPressure <= 80, // 10-80 mH2O
        velocityOk: maxVelocity <= 3.0 && (minVelocity === Infinity || minVelocity >= 0.6), // 0.6-3.0 m/s
        continuityOk: Math.abs(
          nodes.reduce((a, n) => a + n.demand, 0)
        ) < 0.01
      }
    };

    return results;
  }

  // Water Quality Simulation (EPANET-style)
  simulateQuality(timesteps = 24, dt = 3600) {
    const qualityResults = [];
    
    for (let t = 0; t < timesteps; t++) {
      const stepData = { 
        time: t, 
        timeLabel: `${t}:00`,
        nodes: [] 
      };
      
      for (const node of this.nodes.values()) {
        // Get upstream average quality
        const upstream = this.getUpstreamNodes(node.id);
        let avgChlorine = node.quality.chlorine;
        let avgPH = node.quality.ph;
        
        if (upstream.length > 0) {
          avgChlorine = upstream.reduce((sum, uid) => {
            const un = this.nodes.get(uid);
            return sum + (un?.quality?.chlorine || 0);
          }, 0) / upstream.length;
          
          avgPH = upstream.reduce((sum, uid) => {
            const un = this.nodes.get(uid);
            return sum + (un?.quality?.ph || 7);
          }, 0) / upstream.length;
        }
        
        // First-order decay: C(t) = C0 * exp(-kt)
        const kCl = 0.0001; // chlorine decay coefficient per second
        const newChlorine = avgChlorine * Math.exp(-kCl * dt);
        
        // pH mixing (approximate)
        const newPH = avgPH;
        
        node.quality.chlorine = Math.max(0, newChlorine);
        node.quality.ph = newPH;
        
        stepData.nodes.push({
          id: node.id,
          chlorine: parseFloat(node.quality.chlorine.toFixed(3)),
          ph: parseFloat(node.quality.ph.toFixed(2))
        });
      }
      
      qualityResults.push(stepData);
    }
    
    return qualityResults;
  }

  getUpstreamNodes(nodeId) {
    const upstream = [];
    for (const pipe of this.pipes.values()) {
      if (pipe.status === 'closed') continue;
      if (pipe.node2 === nodeId && pipe.flow > 0) {
        upstream.push(pipe.node1);
      } else if (pipe.node1 === nodeId && pipe.flow < 0) {
        upstream.push(pipe.node2);
      }
    }
    return upstream;
  }

  createSkeletonNetwork(floorPlans, totalDemand) {
    // Clear existing
    this.nodes.clear();
    this.pipes.clear();

    // Create reservoir (sumber air)
    this.addNode('RES_001', 'reservoir', 100, 300, 50, -totalDemand, { head: 50 });
    
    // Create ground tank
    this.addTank('GTK_001', 200, 300, {
      elevation: 5,
      capacity: totalDemand * 86400 * 0.3, // 30% daily demand
      currentLevel: 0.8
    });
    
    // Connect reservoir to ground tank
    this.addPipe('P_RES_GTK', 'RES_001', 'GTK_001', 150, 50, { material: 'PVC' });
    
    if (floorPlans && floorPlans.length > 0) {
      let x = 350;
      floorPlans.forEach((room, i) => {
        const y = 200 + (i * 80);
        const nodeId = `JUNC_${i + 1}`;
        
        this.addNode(nodeId, 'junction', x, y, 3 * (i + 1), totalDemand / floorPlans.length);
        
        // Connect from previous or from ground tank
        if (i === 0) {
          this.addPipe(`P_GTK_${nodeId}`, 'GTK_001', nodeId, 100, 30, { material: 'PVC' });
        } else {
          this.addPipe(`P_JUNC_${i}`, `JUNC_${i}`, nodeId, 80, 20, { material: 'PVC' });
        }
        
        // Add fixtures
        const fixtures = 3;
        for (let j = 0; j < fixtures; j++) {
          const fixtureId = `FIX_${i}_${j}`;
          this.addNode(fixtureId, 'junction', x + 80 + (j * 40), y + 20, 3 * (i + 1), 0.2);
          this.addPipe(`P_${nodeId}_${fixtureId}`, nodeId, fixtureId, 25, 10, { material: 'PVC' });
        }
        
        x += 120;
      });
    }
  }

  // Get pipe recommendations based on velocity constraints
  getPipeRecommendations() {
    const recommendations = [];
    
    for (const pipe of this.pipes.values()) {
      if (pipe.type === 'pump') continue;
      
      const velocity = pipe.velocity;
      const diameter = pipe.diameter * 1000; // mm
      
      if (velocity > 3.0) {
        // Too fast - increase diameter
        const newDiameter = Math.ceil(diameter * Math.sqrt(velocity / 2.5));
        recommendations.push({
          pipeId: pipe.id,
          issue: 'Velocity too high',
          currentValue: `${velocity.toFixed(2)} m/s`,
          recommendation: `Increase diameter to ${newDiameter}mm or add parallel pipe`,
          priority: 'high'
        });
      } else if (velocity > 0 && velocity < 0.6) {
        // Too slow - may cause sedimentation
        recommendations.push({
          pipeId: pipe.id,
          issue: 'Velocity too low',
          currentValue: `${velocity.toFixed(2)} m/s`,
          recommendation: 'Consider smaller diameter or check if pipe is oversized',
          priority: 'medium'
        });
      }
    }
    
    return recommendations;
  }

  // Get pressure zone analysis for multi-story buildings
  getPressureZones() {
    const zones = {
      low: { min: 0, max: 10, nodes: [], status: 'low' },      // < 10 m (insufficient)
      normal: { min: 10, max: 50, nodes: [], status: 'normal' }, // 10-50 m (good)
      high: { min: 50, max: 80, nodes: [], status: 'high' },   // 50-80 m (acceptable)
      excessive: { min: 80, max: Infinity, nodes: [], status: 'excessive' } // > 80 m (needs PRV)
    };

    for (const node of this.nodes.values()) {
      if (node.type === 'reservoir') continue;
      
      const p = node.pressureHead;
      if (p < 10) zones.low.nodes.push(node);
      else if (p < 50) zones.normal.nodes.push(node);
      else if (p < 80) zones.high.nodes.push(node);
      else zones.excessive.nodes.push(node);
    }

    return zones;
  }

  exportToEPANET() {
    // Export network in EPANET INP format for external analysis
    let inp = '[TITLE]\nExported from SLF Water System\n\n';
    inp += '[JUNCTIONS]\n';
    inp += ';ID\tElev\tDemand\n';
    
    for (const node of this.nodes.values()) {
      if (node.type === 'junction') {
        inp += `${node.id}\t${node.elevation.toFixed(2)}\t${(node.demand * 1000).toFixed(2)}\n`;
      }
    }
    
    inp += '\n[RESERVOIRS]\n';
    inp += ';ID\tHead\n';
    for (const node of this.nodes.values()) {
      if (node.type === 'reservoir') {
        inp += `${node.id}\t${node.head.toFixed(2)}\n`;
      }
    }
    
    inp += '\n[PIPES]\n';
    inp += ';ID\tNode1\tNode2\tLength\tDiameter\tRoughness\n';
    for (const pipe of this.pipes.values()) {
      if (pipe.type !== 'pump') {
        inp += `${pipe.id}\t${pipe.node1}\t${pipe.node2}\t${pipe.length.toFixed(1)}\t${(pipe.diameter * 1000).toFixed(0)}\t${pipe.roughness}\n`;
      }
    }
    
    inp += '\n[OPTIONS]\n';
    inp += 'Units\tLPS\n';
    inp += 'Headloss\tH-W\n';
    
    return inp;
  }
}
