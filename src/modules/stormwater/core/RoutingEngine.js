/**
 * RoutingEngine - Kinematic Wave & Hydraulic Routing
 * Routing aliran melalui saluran dan pipa menggunakan berbagai metode
 * Standar: SNI 2415:2016, EPA SWMM
 */

export class RoutingEngine {
  constructor() {
    this.channels = [];
    this.junctions = [];
    this.storageNodes = [];
    this.timeStep = 60; // seconds (default 1 minute)
    this.totalTime = 3600; // 1 hour default
    this.gravity = 9.81; // m/s2
  }

  /**
   * Add a channel/pipe to the network
   */
  addChannel(id, fromNode, toNode, length, crossSection, roughness, slope = 0.001) {
    this.channels.push({
      id,
      fromNode,
      toNode,
      length,
      crossSection, // { type: 'circular', diameter: 0.6 } or { type: 'rectangular', width: 1, height: 0.8 }
      roughness, // Manning's n
      slope,
      inflowHydrograph: [],
      outflowHydrograph: [],
      velocityHydrograph: [],
      depthHydrograph: [],
      flooding: 0
    });
  }

  /**
   * Add a junction/node
   */
  addJunction(id, elevation, maxDepth = 5, baseArea = 1) {
    this.junctions.push({
      id,
      elevation,
      maxDepth,
      baseArea, // m2 (surface area at node)
      depth: 0,
      inflow: 0,
      outflow: 0,
      flooding: 0,
      volume: 0
    });
  }

  /**
   * Add a storage node (detention pond, tank, etc)
   */
  addStorageNode(id, elevation, storageCurve, maxDepth, outlet) {
    this.storageNodes.push({
      id,
      elevation,
      storageCurve, // Array of { depth, area } or function
      maxDepth,
      outlet, // { type: 'culvert', diameter, invertElev } or { type: 'weir', crestElev, length }
      depth: 0,
      inflow: 0,
      outflow: 0,
      volume: 0,
      flooding: 0
    });
  }

  /**
   * Route flow through the network
   * @param {Array} inflowHydrograph - Inflow hydrograph array
   * @param {string} method - Routing method: 'Muskingum', 'Kinematic', 'Dynamic'
   */
  routeFlow(inflowHydrograph, method = 'Muskingum') {
    const results = {
      channels: [],
      junctions: [],
      storageNodes: [],
      maxFlow: 0,
      maxDepth: 0,
      totalFlooding: 0
    };

    switch (method) {
      case 'Muskingum':
        return this.routeMuskingum(inflowHydrograph);
      case 'Kinematic':
        return this.routeKinematicWave(inflowHydrograph);
      case 'Dynamic':
        return this.routeDynamicWave(inflowHydrograph);
      default:
        return this.routeMuskingum(inflowHydrograph);
    }
  }

  /**
   * Muskingum-Cunge routing method
   */
  routeMuskingum(inflowHydrograph) {
    const steps = Math.ceil(this.totalTime / this.timeStep);
    const results = {
      channels: [],
      maxFlow: 0,
      maxDepth: 0,
      totalFlooding: 0
    };

    this.channels.forEach(channel => {
      const outflow = new Array(steps).fill(0);
      const depths = new Array(steps).fill(0);
      const velocities = new Array(steps).fill(0);

      // Calculate reference discharge (average inflow)
      const Qref = inflowHydrograph.reduce((a, b) => a + (b.flow || 0), 0) / inflowHydrograph.length || 0.1;

      // Muskingum parameters
      const c = this.calculateWaveCelerity(channel, Qref);
      const K = channel.length / c; // travel time
      const x = 0.5 - (Qref / (2 * c * channel.slope * channel.length)); // weighting factor

      // Constrained x
      const xEff = Math.max(0, Math.min(0.5, x));

      // Muskingum coefficients
      const D = this.timeStep;
      const denom = 2 * K * (1 - xEff) + D;
      const C0 = (-2 * K * xEff + D) / denom;
      const C1 = (2 * K * xEff + D) / denom;
      const C2 = (2 * K * (1 - xEff) - D) / denom;

      for (let t = 1; t < steps; t++) {
        const I = inflowHydrograph[t]?.flow || 0;
        const I_prev = inflowHydrograph[t - 1]?.flow || 0;

        // Muskingum equation
        outflow[t] = C0 * I + C1 * I_prev + C2 * outflow[t - 1];

        // Ensure non-negative
        outflow[t] = Math.max(0, outflow[t]);

        // Calculate depth and velocity
        depths[t] = this.calculateDepthFromFlow(channel, outflow[t]);
        velocities[t] = this.calculateVelocity(channel, outflow[t]);

        // Check capacity
        const capacity = this.calculateCapacity(channel);
        if (outflow[t] > capacity) {
          channel.flooding = outflow[t] - capacity;
          results.totalFlooding += channel.flooding * this.timeStep;
          outflow[t] = capacity;
        }
      }

      channel.outflowHydrograph = outflow.map((q, i) => ({
        time: i * this.timeStep,
        flow: q
      }));

      channel.depthHydrograph = depths.map((d, i) => ({
        time: i * this.timeStep,
        depth: d
      }));

      channel.velocityHydrograph = velocities.map((v, i) => ({
        time: i * this.timeStep,
        velocity: v
      }));

      // Track max values
      const maxQ = Math.max(...outflow);
      const maxD = Math.max(...depths);

      if (maxQ > results.maxFlow) results.maxFlow = maxQ;
      if (maxD > results.maxDepth) results.maxDepth = maxD;

      results.channels.push({
        id: channel.id,
        maxFlow: maxQ,
        maxDepth: maxD,
        capacity: this.calculateCapacity(channel),
        velocity: Math.max(...velocities),
        flooding: channel.flooding
      });
    });

    return results;
  }

  /**
   * Kinematic wave routing (simplified explicit finite difference)
   */
  routeKinematicWave(inflowHydrograph) {
    const steps = Math.ceil(this.totalTime / this.timeStep);
    const dx = 10; // spatial step in meters

    const results = {
      channels: [],
      maxFlow: 0,
      maxDepth: 0,
      totalFlooding: 0
    };

    this.channels.forEach(channel => {
      const nx = Math.ceil(channel.length / dx);
      const outflow = new Array(steps).fill(0);
      const depths = new Array(steps).fill(0).map(() => new Array(nx).fill(0));
      const flows = new Array(steps).fill(0).map(() => new Array(nx).fill(0));

      // Courant condition check
      const c = this.calculateWaveCelerity(channel, 1.0);
      const courant = c * this.timeStep / dx;

      if (courant > 1) {
        console.warn(`Courant condition violated: ${courant.toFixed(2)} > 1`);
      }

      for (let t = 1; t < steps; t++) {
        const inflow = inflowHydrograph[t]?.flow || 0;

        // Boundary condition
        flows[t][0] = inflow;
        depths[t][0] = this.calculateDepthFromFlow(channel, inflow);

        // Interior points
        for (let i = 1; i < nx; i++) {
          // Simplified upwind scheme
          const alpha = 1.0;
          const beta = 0.6; // from Manning: Q = alpha * A^beta

          const Q_prev = flows[t - 1][i];
          const Q_up = flows[t][i - 1];

          // Kinematic wave approximation
          const Q_new = Q_prev - (c * this.timeStep / dx) * (Q_prev - Q_up);
          flows[t][i] = Math.max(0, Q_new);
          depths[t][i] = this.calculateDepthFromFlow(channel, flows[t][i]);
        }

        outflow[t] = flows[t][nx - 1];

        // Check capacity
        const capacity = this.calculateCapacity(channel);
        if (outflow[t] > capacity) {
          channel.flooding = outflow[t] - capacity;
          results.totalFlooding += channel.flooding * this.timeStep;
          outflow[t] = capacity;
        }
      }

      channel.outflowHydrograph = outflow.map((q, i) => ({
        time: i * this.timeStep,
        flow: q
      }));

      const maxQ = Math.max(...outflow);
      const maxD = Math.max(...depths.flat());

      if (maxQ > results.maxFlow) results.maxFlow = maxQ;
      if (maxD > results.maxDepth) results.maxDepth = maxD;

      results.channels.push({
        id: channel.id,
        maxFlow: maxQ,
        maxDepth: maxD,
        capacity: this.calculateCapacity(channel),
        velocity: this.calculateVelocity(channel, maxQ),
        flooding: channel.flooding
      });
    });

    return results;
  }

  /**
   * Dynamic wave routing (placeholder for full implementation)
   */
  routeDynamicWave(inflowHydrograph) {
    // Full Saint-Venant equations would go here
    // For now, fall back to Muskingum with warning
    console.warn('Dynamic wave routing not fully implemented. Using Muskingum-Cunge.');
    return this.routeMuskingum(inflowHydrograph);
  }

  /**
   * Calculate wave celerity
   */
  calculateWaveCelerity(channel, flow) {
    // c = (5/3) * v for wide channels (from Manning)
    const area = this.calculateArea(channel, flow);
    if (area <= 0) return 1.0;
    const velocity = flow / area;
    return (5 / 3) * velocity;
  }

  /**
   * Calculate flow area given discharge (iterative solution)
   */
  calculateArea(channel, flow) {
    // Manning: Q = (1/n) * A * R^(2/3) * S^(1/2)
    // Iterative solution for A given Q
    const S = channel.slope || 0.001;
    const n = channel.roughness;

    if (flow <= 0) return 0;

    // Initial guess
    let A = flow / 0.5; // assume velocity 0.5 m/s

    for (let i = 0; i < 20; i++) {
      const P = this.calculateWettedPerimeter(channel, A);
      if (P <= 0) break;
      const R = A / P;
      const Q_calc = (1 / n) * A * Math.pow(R, 2 / 3) * Math.sqrt(S);
      if (Math.abs(Q_calc - flow) < 0.0001) break;
      A = A * Math.sqrt(flow / Q_calc);
    }

    return A;
  }

  /**
   * Calculate depth from flow (reverse of calculateArea)
   */
  calculateDepthFromFlow(channel, flow) {
    if (flow <= 0) return 0;

    const A = this.calculateArea(channel, flow);
    const cs = channel.crossSection;

    if (cs.type === 'circular') {
      const D = cs.diameter;
      // Approximate solution for circular pipe
      // A = (D^2/4) * (theta - sin(theta))/2 where theta = 2*acos(1 - 2h/D)
      const theta = 2 * Math.acos(1 - (4 * A) / (Math.PI * D * D));
      return (D / 2) * (1 - Math.cos(theta / 2));
    } else if (cs.type === 'rectangular') {
      return A / cs.width;
    } else if (cs.type === 'trapezoidal') {
      // A = (b + z*y)*y where z is side slope
      const b = cs.bottomWidth;
      const z = cs.sideSlope || 1;
      // Solve quadratic: z*y^2 + b*y - A = 0
      const y = (-b + Math.sqrt(b * b + 4 * z * A)) / (2 * z);
      return y;
    }

    return 0;
  }

  /**
   * Calculate wetted perimeter
   */
  calculateWettedPerimeter(channel, area) {
    const cs = channel.crossSection;

    if (cs.type === 'circular') {
      const D = cs.diameter;
      const theta = 2 * Math.acos(Math.max(-1, Math.min(1, 1 - (4 * area) / (Math.PI * D * D))));
      return D * theta / 2;
    } else if (cs.type === 'rectangular') {
      const depth = area / cs.width;
      return cs.width + 2 * depth;
    } else if (cs.type === 'trapezoidal') {
      const b = cs.bottomWidth;
      const z = cs.sideSlope || 1;
      const y = (-b + Math.sqrt(b * b + 4 * z * area)) / (2 * z);
      return b + 2 * y * Math.sqrt(1 + z * z);
    }

    return 1;
  }

  /**
   * Calculate full pipe/channel capacity using Manning
   */
  calculateCapacity(channel) {
    const cs = channel.crossSection;
    let A, P;

    if (cs.type === 'circular') {
      A = Math.PI * Math.pow(cs.diameter, 2) / 4;
      P = Math.PI * cs.diameter;
    } else if (cs.type === 'rectangular') {
      A = cs.width * cs.height;
      P = cs.width + 2 * cs.height;
    } else if (cs.type === 'trapezoidal') {
      const z = cs.sideSlope || 1;
      A = (cs.bottomWidth + z * cs.height) * cs.height;
      P = cs.bottomWidth + 2 * cs.height * Math.sqrt(1 + z * z);
    }

    const R = A / P;
    const S = channel.slope || 0.001;
    return (1 / channel.roughness) * A * Math.pow(R, 2 / 3) * Math.sqrt(S);
  }

  /**
   * Calculate velocity
   */
  calculateVelocity(channel, flow) {
    const A = this.calculateArea(channel, flow);
    return A > 0 ? flow / A : 0;
  }

  /**
   * Check if velocity is within acceptable range
   */
  checkVelocity(channel, flow) {
    const v = this.calculateVelocity(channel, flow);
    return {
      velocity: v,
      status: v >= 0.6 && v <= 3.0 ? 'OK' : v < 0.6 ? 'LOW' : 'HIGH',
      minRecommended: 0.6, // m/s - prevent sedimentation
      maxRecommended: 3.0  // m/s - prevent erosion
    };
  }

  /**
   * Set simulation time parameters
   */
  setTimeParameters(timeStep, totalTime) {
    this.timeStep = timeStep;
    this.totalTime = totalTime;
  }

  /**
   * Clear network
   */
  clearNetwork() {
    this.channels = [];
    this.junctions = [];
    this.storageNodes = [];
  }
}

export default RoutingEngine;
