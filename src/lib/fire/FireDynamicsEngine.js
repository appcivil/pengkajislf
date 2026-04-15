/**
 * FireDynamicsEngine.js - Zone Model Fire Simulation
 * Two-zone model dengan T-squared fire growth, smoke transport, dan ASET calculation
 * Based on SNI 03-1736-2000 dan NFPA 92
 */

import * as THREE from 'three';

export class FireDynamicsEngine {
  constructor(roomGeometry = null) {
    this.room = roomGeometry || {
      width: 10,
      length: 10,
      height: 3,
      volume: 300,
      floorArea: 100,
      ceilingArea: 100
    };
    
    this.time = 0;
    this.dt = 1; // 1 second timestep
    this.isRunning = false;
    
    // Two-zone model variables
    this.upperLayer = {
      height: 0,           // m from ceiling (0 = empty, room.height = full)
      temperature: 293,    // K (20°C ambient)
      smokeDensity: 0,     // mg/m³
      coConcentration: 0,  // ppm
      o2Concentration: 21, // %
      visibility: 30,      // m
      entrainmentRate: 0   // kg/s
    };
    
    this.lowerLayer = {
      height: this.room.height, // m (full height initially)
      temperature: 293,
      visibility: 30
    };
    
    // Fire source
    this.fire = null;
    
    // Ventilation
    this.ventilation = [];
    this.materials = [];
    
    // Simulation results storage
    this.timeline = [];
    this.ASET = null;
    this.criticalEvents = [];
    
    // Physical constants
    this.Cp = 1005;       // J/kg·K (specific heat of air)
    this.rho = 1.2;       // kg/m³ (air density at 20°C)
    this.g = 9.81;        // m/s² (gravity)
    this.ambientTemp = 293; // K (20°C)
    this.ambientDensity = 1.2; // kg/m³
    
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
    window.dispatchEvent(new CustomEvent(`fire:${event}`, { detail: data }));
  }

  /**
   * Initialize dari data arsitektur (floor plans, building data)
   */
  initializeFromArchitecture(floorPlans, buildingData = {}) {
    let totalVolume = 0;
    let totalArea = 0;
    let maxHeight = 0;
    let totalCeilingArea = 0;
    
    floorPlans.forEach((floor, level) => {
      const area = this.calculatePolygonArea(floor.points || []);
      const height = floor.height || 3;
      
      totalVolume += area * height;
      totalArea += area;
      totalCeilingArea += area;
      maxHeight = Math.max(maxHeight, height * (level + 1));
    });

    // Update room geometry
    const avgDimension = Math.sqrt(totalArea);
    this.room = {
      width: avgDimension,
      length: avgDimension,
      height: maxHeight,
      volume: totalVolume,
      floorArea: totalArea,
      ceilingArea: totalCeilingArea,
      floors: floorPlans.length
    };

    // Reset layers
    this.upperLayer.height = 0;
    this.lowerLayer.height = this.room.height;
    
    // Material properties dari arsitektur
    this.materials = buildingData.materials?.map(m => ({
      name: m.name || 'Unknown',
      conductivity: m.thermalConductivity || 0.5,     // W/mK
      specificHeat: m.specificHeat || 1000,          // J/kgK
      density: m.density || 800,                     // kg/m³
      thickness: m.thickness || 0.1,                  // m
      ignitionTemp: m.ignitionTemp || 573,            // K (300°C)
      heatOfCombustion: m.heatOfCombustion || 15,     // MJ/kg
      sootYield: m.sootYield || 0.015,               // kg soot/kg fuel
      coYield: m.coYield || 0.004                    // kg CO/kg fuel
    })) || this.getDefaultMaterials();

    console.log(`[FireEngine] Initialized: ${totalVolume.toFixed(1)} m³, ${floorPlans.length} floors`);
    this.emit('initialized', { room: this.room, materials: this.materials.length });
  }

  getDefaultMaterials() {
    return [
      { name: 'Concrete', conductivity: 1.5, specificHeat: 1000, density: 2300, thickness: 0.15, ignitionTemp: null, heatOfCombustion: 0, sootYield: 0, coYield: 0 },
      { name: 'Wood', conductivity: 0.12, specificHeat: 1500, density: 600, thickness: 0.02, ignitionTemp: 573, heatOfCombustion: 17, sootYield: 0.015, coYield: 0.004 },
      { name: 'Gypsum', conductivity: 0.25, specificHeat: 900, density: 800, thickness: 0.012, ignitionTemp: null, heatOfCombustion: 0, sootYield: 0, coYield: 0 }
    ];
  }

  /**
   * Set fire source dengan T-squared growth
   */
  setFireSource(config) {
    // T-squared fire: Q = α * t²
    // α values: Slow (0.00293), Medium (0.01172), Fast (0.0469), Ultra-fast (0.1876) kW/s²
    const alphas = {
      'slow': 0.00293,
      'medium': 0.01172,
      'fast': 0.0469,
      'ultra': 0.1876
    };

    const fuelData = this.getFuelProperties(config.fuel || 'wood');

    this.fire = {
      type: config.type || 'medium',
      alpha: alphas[config.type] || 0.01172,
      maxHRR: config.maxHRR || 5000,      // kW
      fuel: config.fuel || 'wood',
      area: config.area || 2.0,            // m²
      location: config.location || new THREE.Vector3(0, 0, 0),
      startTime: config.startTime || 0,
      tEnd: config.tEnd || 1800,          // s (30 min max)
      heatOfCombustion: fuelData.heatOfCombustion,
      sootYield: fuelData.sootYield,
      coYield: fuelData.coYield,
      burning: false,
      currentHRR: 0
    };

    console.log(`[FireEngine] Fire set: ${this.fire.type}, max ${this.fire.maxHRR} kW`);
  }

  getFuelProperties(fuel) {
    const fuels = {
      'wood': { heatOfCombustion: 17, sootYield: 0.015, coYield: 0.004, density: 400 },
      'plastic': { heatOfCombustion: 30, sootYield: 0.10, coYield: 0.01, density: 900 },
      'liquid': { heatOfCombustion: 44, sootYield: 0.06, coYield: 0.02, density: 800 },
      'cellulose': { heatOfCombustion: 16, sootYield: 0.01, coYield: 0.003, density: 250 },
      'pufoam': { heatOfCombustion: 25, sootYield: 0.20, coYield: 0.05, density: 30 }
    };
    return fuels[fuel] || fuels.wood;
  }

  /**
   * Add ventilation (doors, windows, vents)
   */
  addVentilation(vents) {
    this.ventilation = vents.map(v => ({
      id: v.id || `vent_${this.ventilation.length}`,
      area: v.area || 1.0,           // m²
      height: v.height || 1.0,       // m from floor
      type: v.type || 'door',        // door, window, vent
      status: v.status || 'open',    // open, closed
      flow: 0,                       // m³/s (calculated)
      inflow: 0,                     // m³/s
      outflow: 0,                    // m³/s
      position: v.position || new THREE.Vector3(0, 0, 0)
    }));
  }

  /**
   * Calculate T-squared HRR
   */
  calculateHRR(tFire) {
    if (!this.fire || tFire < 0) return 0;
    
    // Q = α * t² (capped at maxHRR)
    const hrr = this.fire.alpha * Math.pow(tFire, 2);
    return Math.min(hrr, this.fire.maxHRR);
  }

  /**
   * Calculate plume mass flow rate (Zukoski correlation)
   * m_p = 0.071 * Q^(1/3) * z^(5/3) + 1.92e-3 * Q
   */
  calculatePlumeMassFlow(Q, z) {
    if (Q <= 0 || z <= 0.1) return 0;
    
    const QkW = Q; // Q already in kW
    const zEff = Math.max(0.1, z);
    
    // Zukoski correlation
    const mPlume = 0.071 * Math.pow(QkW, 0.333) * Math.pow(zEff, 1.667) + 0.00192 * QkW;
    
    return mPlume; // kg/s
  }

  /**
   * Single simulation step (1 second)
   */
  step() {
    if (!this.fire) return this.getState();

    const tFire = this.time - this.fire.startTime;
    
    // Fire not started yet
    if (tFire < 0) {
      this.time += this.dt;
      return this.getState();
    }

    // 1. Calculate HRR (T-squared)
    const Q = this.calculateHRR(tFire);
    this.fire.currentHRR = Q;
    this.fire.burning = Q > 0;

    // 2. Calculate layer interface height
    const z = this.room.height - this.upperLayer.height; // interface height from floor
    
    // 3. Calculate plume mass flow rate
    const mPlume = this.calculatePlumeMassFlow(Q, z);
    this.upperLayer.entrainmentRate = mPlume;

    // 4. Calculate layer interface descent
    // dh/dt = m_p / (ρ * A)
    const volFlow = mPlume / this.rho; // m³/s
    const dh = (volFlow / this.room.floorArea) * this.dt; // m per second
    
    // Update layer heights
    this.upperLayer.height = Math.min(this.room.height, this.upperLayer.height + dh);
    this.lowerLayer.height = Math.max(0, this.room.height - this.upperLayer.height);

    // 5. Calculate upper layer temperature rise
    // ΔT = Q / (m * Cp) dengan heat loss
    const massUpper = this.room.floorArea * this.upperLayer.height * this.rho;
    const heatLoss = this.calculateHeatLoss();
    const netHeat = (Q * 1000) - heatLoss; // Convert kW to W
    const deltaT = (netHeat * this.dt) / (massUpper * this.Cp);
    this.upperLayer.temperature += deltaT;

    // 6. Calculate smoke concentration
    // Soot mass = m_p * sootYield * dt
    const sootMass = mPlume * this.dt * this.fire.sootYield; // kg
    const upperVolume = this.room.floorArea * this.upperLayer.height;
    const sootDensityIncrement = (sootMass * 1e9) / Math.max(upperVolume, 0.1); // mg/m³
    this.upperLayer.smokeDensity += sootDensityIncrement;

    // 7. Calculate visibility
    // K = extinction coefficient = K_m * smokeDensity (m²/g)
    // K_m ≈ 7.6 m²/g for typical smoke
    // Visibility = C / K (C ≈ 3 for light reflecting signs, C ≈ 8 for light emitting)
    const K = 7.6e-4 * this.upperLayer.smokeDensity; // 1/m
    this.upperLayer.visibility = K > 0 ? Math.min(30, 3.0 / K) : 30; // m

    // 8. Calculate CO concentration
    // CO mass = m_p * coYield * dt
    const coMass = mPlume * this.dt * this.fire.coYield; // kg
    const coConcentrationIncrement = (coMass / Math.max(upperVolume, 0.1)) * 1e6; // ppm
    this.upperLayer.coConcentration += coConcentrationIncrement;

    // 9. Calculate O2 depletion (simplified)
    // O2 consumed ≈ Q / (heatOfCombustion * stoichiometricRatio)
    const o2Consumed = (Q * this.dt) / (this.fire.heatOfCombustion * 15); // Rough estimate
    this.upperLayer.o2Concentration = Math.max(0, this.upperLayer.o2Concentration - o2Consumed * 0.001);

    // 10. Ventilation effects
    this.calculateVentilationExchange();

    // 11. Check tenability (ASET calculation)
    const tenability = this.checkTenability();
    if (!tenability.isTenable && !this.ASET) {
      this.ASET = this.time;
      this.criticalEvents.push({
        time: this.time,
        type: 'ASET_REACHED',
        reason: tenability.limitingFactor,
        value: tenability.criteria[tenability.limitingFactor]?.actual
      });
      this.emit('asetReached', { time: this.time, reason: tenability.limitingFactor });
    }

    // Store timeline data
    this.timeline.push({
      time: this.time,
      hrr: Q,
      upperLayer: { ...this.upperLayer },
      lowerLayer: { ...this.lowerLayer },
      tenability: { ...tenability }
    });

    this.time += this.dt;
    
    // Emit progress setiap 10 detik
    if (this.time % 10 === 0) {
      this.emit('tick', { time: this.time, ASET: this.ASET, HRR: Q });
    }

    return this.getState();
  }

  calculateHeatLoss() {
    // Heat loss to boundaries (simplified)
    // Q_loss = h * A * (T_upper - T_ambient)
    const h = 25; // W/m²K (convective heat transfer coefficient)
    const area = this.room.ceilingArea + (this.room.floorArea * 0.5); // Ceiling + partial walls
    const deltaT = this.upperLayer.temperature - this.ambientTemp;
    return h * area * deltaT; // W
  }

  calculateVentilationExchange() {
    // Simplified natural ventilation due to stack effect
    // Q = C_d * A * sqrt(2 * g * H * (T_upper - T_ambient) / T_ambient)
    
    const deltaT = this.upperLayer.temperature - this.ambientTemp;
    if (deltaT <= 0) return;

    this.ventilation.forEach(vent => {
      if (vent.status === 'closed') {
        vent.flow = 0;
        return;
      }

      const Cd = 0.6; // Discharge coefficient
      const H = vent.height;
      
      // Stack effect
      const stackPressure = Math.sqrt(2 * this.g * H * deltaT / this.ambientTemp);
      vent.flow = Cd * vent.area * stackPressure; // m³/s
      
      // Heat loss due to ventilation
      const heatLoss = vent.flow * this.rho * this.Cp * deltaT; // W
      this.upperLayer.temperature -= (heatLoss * this.dt) / 
        (this.room.floorArea * this.upperLayer.height * this.rho * this.Cp);
      
      // Smoke dilution
      if (vent.flow > 0) {
        const dilution = (vent.flow * this.dt) / (this.room.floorArea * this.upperLayer.height);
        this.upperLayer.smokeDensity *= (1 - dilution * 0.1);
        this.upperLayer.coConcentration *= (1 - dilution * 0.1);
      }
    });
  }

  /**
   * Check tenability criteria (SNI 03-1736-2000)
   */
  checkTenability(location = null) {
    // Tenability criteria (SNI 03-1736-2000 / NFPA 130):
    // 1. Temperature < 60°C (333K) for convective
    // 2. Radiant heat flux < 2.5 kW/m²
    // 3. Visibility > 10m (corridors), > 5m (rooms)
    // 4. CO < 1000 ppm
    // 5. O2 > 15%
    // 6. Clear layer height > 1.6m (for standing)

    const criteria = {
      temperature: { limit: 333, actual: this.upperLayer.temperature, unit: 'K', name: 'Suhu' },
      visibility: { limit: 10, actual: this.upperLayer.visibility, unit: 'm', name: 'Visibilitas' },
      co: { limit: 1000, actual: this.upperLayer.coConcentration, unit: 'ppm', name: 'CO' },
      o2: { limit: 15, actual: this.upperLayer.o2Concentration, unit: '%', name: 'O2', reverse: true },
      layerHeight: { limit: 1.6, actual: this.lowerLayer.height, unit: 'm', name: 'Tinggi Lapisan Bersih' }
    };

    let limitingFactor = null;
    let minSafetyRatio = Infinity;

    for (const [key, criterion] of Object.entries(criteria)) {
      let ratio;
      if (criterion.reverse) {
        // For O2 (should be > limit)
        ratio = criterion.actual / criterion.limit;
      } else {
        // For others (should be < limit)
        ratio = criterion.limit / Math.max(criterion.actual, 0.001);
      }

      if (ratio < minSafetyRatio) {
        minSafetyRatio = ratio;
        if (ratio < 1.0) {
          limitingFactor = key;
        }
      }
    }

    return {
      isTenable: !limitingFactor,
      limitingFactor: limitingFactor,
      criteria: criteria,
      safetyRatio: minSafetyRatio,
      time: this.time
    };
  }

  /**
   * Calculate ASET untuk specific location
   */
  calculateASETAt(location) {
    return this.checkTenability(location);
  }

  /**
   * Run full simulation
   */
  async runSimulation(maxTime = 1800, callback = null) {
    this.isRunning = true;
    this.timeline = [];
    this.ASET = null;
    this.criticalEvents = [];
    this.time = 0;
    
    // Reset layers
    this.upperLayer.height = 0;
    this.upperLayer.temperature = this.ambientTemp;
    this.upperLayer.smokeDensity = 0;
    this.upperLayer.coConcentration = 0;
    this.upperLayer.o2Concentration = 21;
    this.upperLayer.visibility = 30;
    
    this.lowerLayer.height = this.room.height;
    this.lowerLayer.temperature = this.ambientTemp;
    
    this.emit('simulationStart', { maxTime, room: this.room });

    while (this.time < maxTime && this.isRunning) {
      this.step();
      
      // Callback untuk UI updates
      if (callback && this.time % 5 === 0) {
        await callback(this.getState(), this.time, maxTime);
      }
      
      // Stop jika ASET tercapai dan sudah 30 detik setelahnya
      if (this.ASET && this.time > this.ASET + 30) {
        break;
      }
      
      // Small delay untuk prevent blocking
      if (this.time % 10 === 0) {
        await new Promise(r => setTimeout(r, 1));
      }
    }

    this.isRunning = false;
    
    const results = this.generateResults();
    this.emit('simulationComplete', results);
    
    return results;
  }

  stop() {
    this.isRunning = false;
  }

  generateResults() {
    const finalState = this.timeline[this.timeline.length - 1] || {};
    
    return {
      ASET: this.ASET || this.time,
      maxTime: this.time,
      timeline: this.timeline,
      criticalEvents: this.criticalEvents,
      room: this.room,
      fire: this.fire,
      maxTemperature: Math.max(...this.timeline.map(t => t.upperLayer.temperature), this.ambientTemp),
      minVisibility: Math.min(...this.timeline.map(t => t.upperLayer.visibility), 30),
      maxCO: Math.max(...this.timeline.map(t => t.upperLayer.coConcentration), 0),
      finalSmokeDensity: finalState.upperLayer?.smokeDensity || 0,
      finalLayerHeight: finalState.lowerLayer?.height || this.room.height,
      layerDescentRate: this.calculateAverageDescentRate(),
      tenabilityStatus: this.checkTenability()
    };
  }

  calculateAverageDescentRate() {
    if (this.timeline.length < 60) return 0;
    
    const start = this.timeline[60]; // After 1 minute
    const end = this.timeline[this.timeline.length - 1];
    
    const dh = end.upperLayer.height - start.upperLayer.height;
    const dt = end.time - start.time;
    
    return dt > 0 ? dh / dt : 0; // m/s
  }

  getState() {
    return {
      time: this.time,
      fire: this.fire ? {
        burning: this.fire.burning,
        HRR: this.fire.currentHRR,
        type: this.fire.type,
        maxHRR: this.fire.maxHRR
      } : null,
      upperLayer: { ...this.upperLayer },
      lowerLayer: { ...this.lowerLayer },
      ASET: this.ASET,
      ventilation: this.ventilation.map(v => ({ id: v.id, flow: v.flow }))
    };
  }

  calculatePolygonArea(points) {
    if (!points || points.length < 3) return 0;
    
    let area = 0;
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      area += (points[i].x || 0) * (points[j].y || 0);
      area -= (points[j].x || 0) * (points[i].y || 0);
    }
    return Math.abs(area) / 2;
  }
}

export default { FireDynamicsEngine };
