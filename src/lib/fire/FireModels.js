/**
 * FireModels.js - Fire Source, Material, Ventilation, Detector classes
 * Models untuk Fire Dynamics Simulation
 */

import * as THREE from 'three';

/**
 * FireSource - Represents a fire dengan T-squared growth
 */
export class FireSource {
  constructor(options = {}) {
    this.id = options.id || `fire_${Date.now()}`;
    this.position = options.position || new THREE.Vector3(0, 0, 0);
    
    // T-squared parameters
    this.type = options.type || 'medium'; // slow, medium, fast, ultra
    this.alpha = this.getAlphaValue(this.type);
    this.maxHRR = options.maxHRR || 5000; // kW
    this.startTime = options.startTime || 0;
    
    // Fuel properties
    this.fuel = options.fuel || 'wood';
    this.fuelProps = this.getFuelProperties(this.fuel);
    
    // Geometry
    this.area = options.area || 2.0; // m²
    this.diameter = Math.sqrt(this.area / Math.PI) * 2; // Equivalent diameter
    
    // State
    this.burning = false;
    this.currentHRR = 0;
    this.totalEnergy = 0; // MJ
    
    // Visual
    this.mesh = null;
  }

  getAlphaValue(type) {
    const alphas = {
      'slow': 0.00293,
      'medium': 0.01172,
      'fast': 0.0469,
      'ultra': 0.1876
    };
    return alphas[type] || 0.01172;
  }

  getFuelProperties(fuel) {
    const fuels = {
      'wood': { 
        heatOfCombustion: 17, // MJ/kg
        sootYield: 0.015, // kg soot / kg fuel
        coYield: 0.004, // kg CO / kg fuel
        smokeProduced: 0.1, // g/g
        density: 400 // kg/m³
      },
      'plastic': {
        heatOfCombustion: 30,
        sootYield: 0.10,
        coYield: 0.01,
        smokeProduced: 0.5,
        density: 900
      },
      'liquid': {
        heatOfCombustion: 44,
        sootYield: 0.06,
        coYield: 0.02,
        smokeProduced: 0.2,
        density: 800
      },
      'cellulose': {
        heatOfCombustion: 16,
        sootYield: 0.01,
        coYield: 0.003,
        smokeProduced: 0.05,
        density: 250
      },
      'pufoam': {
        heatOfCombustion: 25,
        sootYield: 0.20,
        coYield: 0.05,
        smokeProduced: 0.8,
        density: 30
      }
    };
    return fuels[fuel] || fuels.wood;
  }

  calculateHRR(time) {
    const tFire = time - this.startTime;
    if (tFire < 0) return 0;
    
    // T-squared: Q = α * t²
    const hrr = this.alpha * Math.pow(tFire, 2);
    return Math.min(hrr, this.maxHRR);
  }

  calculateMassFlow(time) {
    // Mass flow rate = HRR / Heat of Combustion
    const hrr = this.calculateHRR(time); // kW
    const hrrMJ = hrr * 0.001; // Convert to MJ/s
    return hrrMJ / this.fuelProps.heatOfCombustion; // kg/s
  }

  update(time, dt) {
    this.currentHRR = this.calculateHRR(time);
    this.burning = this.currentHRR > 0;
    
    // Accumulate total energy
    this.totalEnergy += this.currentHRR * dt * 0.001; // kW * s = kJ, convert to MJ
    
    return {
      HRR: this.currentHRR,
      burning: this.burning,
      massFlow: this.calculateMassFlow(time)
    };
  }

  getPlumeHeight(time) {
    // Estimated plume height based on HRR (Zukoski)
    const hrr = this.calculateHRR(time);
    if (hrr <= 0) return 0;
    
    // z = 0.23 * Q^(2/5) - 1.02 * D (simplified)
    return Math.max(0, 0.23 * Math.pow(hrr, 0.4) - 1.02 * this.diameter);
  }

  toJSON() {
    return {
      id: this.id,
      position: { x: this.position.x, y: this.position.y, z: this.position.z },
      type: this.type,
      alpha: this.alpha,
      maxHRR: this.maxHRR,
      fuel: this.fuel,
      area: this.area,
      startTime: this.startTime
    };
  }
}

/**
 * MaterialFire - Thermal properties untuk material
 */
export class MaterialFire {
  constructor(options = {}) {
    this.name = options.name || 'Unknown';
    
    // Thermal properties
    this.conductivity = options.conductivity || 0.5; // W/mK
    this.specificHeat = options.specificHeat || 1000; // J/kgK
    this.density = options.density || 800; // kg/m³
    this.thickness = options.thickness || 0.1; // m
    
    // Fire properties
    this.ignitionTemp = options.ignitionTemp || 573; // K (300°C)
    this.heatOfCombustion = options.heatOfCombustion || 15; // MJ/kg
    this.sootYield = options.sootYield || 0.015; // kg/kg
    this.coYield = options.coYield || 0.004; // kg/kg
    
    // Surface properties
    this.surfaceArea = options.surfaceArea || 1.0; // m²
    this.orientation = options.orientation || 'horizontal'; // horizontal, vertical
    
    // State
    this.temperature = 293; // K (20°C ambient)
    this.ignited = false;
    this.mass = this.density * this.thickness * this.surfaceArea;
    this.massRemaining = this.mass;
  }

  calculateThermalInertia() {
    // k·ρ·c (thermal inertia)
    return this.conductivity * this.density * this.specificHeat;
  }

  calculateHeatFlux(incidentFlux) {
    // Convective heat transfer
    const h = this.orientation === 'vertical' ? 25 : 20; // W/m²K
    const deltaT = this.temperature - 293;
    const qConv = h * deltaT;
    
    // Radiative heat loss (simplified)
    const epsilon = 0.8; // emissivity
    const sigma = 5.67e-8; // Stefan-Boltzmann
    const qRad = epsilon * sigma * (Math.pow(this.temperature, 4) - Math.pow(293, 4));
    
    return incidentFlux - qConv - qRad;
  }

  update(dt, incidentHeatFlux) {
    // Heat transfer calculation
    const heatAbsorbed = this.calculateHeatFlux(incidentHeatFlux) * this.surfaceArea * dt;
    
    // Temperature rise
    const deltaT = heatAbsorbed / (this.mass * this.specificHeat);
    this.temperature += deltaT;
    
    // Check ignition
    if (!this.ignited && this.ignitionTemp && this.temperature >= this.ignitionTemp) {
      this.ignited = true;
    }
    
    // If ignited, calculate mass loss
    if (this.ignited && this.heatOfCombustion > 0) {
      const massLoss = heatAbsorbed / (this.heatOfCombustion * 1e6); // kg
      this.massRemaining = Math.max(0, this.massRemaining - massLoss);
    }
    
    return {
      temperature: this.temperature,
      ignited: this.ignited,
      massRemaining: this.massRemaining,
      massLossRate: this.ignited ? heatAbsorbed / (this.heatOfCombustion * 1e6) / dt : 0
    };
  }

  toJSON() {
    return {
      name: this.name,
      conductivity: this.conductivity,
      specificHeat: this.specificHeat,
      density: this.density,
      thickness: this.thickness,
      ignitionTemp: this.ignitionTemp,
      heatOfCombustion: this.heatOfCombustion,
      sootYield: this.sootYield,
      coYield: this.coYield
    };
  }
}

/**
 * Ventilation - Doors, windows, vents
 */
export class Ventilation {
  constructor(options = {}) {
    this.id = options.id || `vent_${Date.now()}`;
    this.type = options.type || 'door'; // door, window, vent, mechanical
    
    // Geometry
    this.position = options.position || new THREE.Vector3(0, 0, 0);
    this.area = options.area || 1.0; // m²
    this.width = options.width || 1.0; // m
    this.height = options.height || 1.0; // m from floor
    this.elevation = options.elevation || 0; // m (floor level)
    
    // Properties
    this.status = options.status || 'closed'; // open, closed, partially_open
    this.openPercentage = options.openPercentage || 100; // %
    this.autoClose = options.autoClose || false;
    this.closeTemp = options.closeTemp || 343; // K (70°C) for fusible link
    
    // Flow properties (calculated)
    this.flowRate = 0; // m³/s
    this.inflow = 0; // m³/s
    this.outflow = 0; // m³/s
    
    // Pressure (calculated)
    this.pressureDiff = 0; // Pa
  }

  getEffectiveArea() {
    const Cd = 0.6; // discharge coefficient
    const openFactor = this.status === 'open' ? 1.0 : 
                      this.status === 'closed' ? 0.0 : 
                      this.openPercentage / 100;
    return Cd * this.area * openFactor;
  }

  calculateFlow(pressureDiff, tempDiff) {
    // Simplified flow calculation
    // Q = C_d * A * sqrt(2 * ΔP / ρ) atau natural draft
    
    const rho = 1.2; // kg/m³
    const g = 9.81;
    const h = this.height;
    
    if (pressureDiff > 0) {
      // Forced flow
      this.flowRate = this.getEffectiveArea() * Math.sqrt(2 * Math.abs(pressureDiff) / rho);
      if (pressureDiff > 0) {
        this.inflow = this.flowRate;
        this.outflow = 0;
      } else {
        this.inflow = 0;
        this.outflow = this.flowRate;
      }
    } else if (tempDiff > 0) {
      // Natural convection (stack effect)
      // Q = C_d * A * sqrt(2 * g * h * ΔT / T_ambient)
      const T_ambient = 293;
      this.flowRate = this.getEffectiveArea() * Math.sqrt(2 * g * h * tempDiff / T_ambient);
      this.inflow = this.flowRate * 0.5;
      this.outflow = this.flowRate * 0.5;
    } else {
      this.flowRate = 0;
      this.inflow = 0;
      this.outflow = 0;
    }
    
    this.pressureDiff = pressureDiff;
    return this.flowRate;
  }

  checkAutoClose(upperLayerTemp) {
    if (this.autoClose && this.status === 'open' && upperLayerTemp >= this.closeTemp) {
      this.status = 'closed';
      return true;
    }
    return false;
  }

  toJSON() {
    return {
      id: this.id,
      type: this.type,
      position: { x: this.position.x, y: this.position.y, z: this.position.z },
      area: this.area,
      height: this.height,
      status: this.status,
      flowRate: this.flowRate
    };
  }
}

/**
 * Detector - Smoke and heat detectors
 */
export class Detector {
  constructor(options = {}) {
    this.id = options.id || `detector_${Date.now()}`;
    this.type = options.type || 'smoke'; // smoke, heat, co, multi
    this.position = options.position || new THREE.Vector3(0, 3, 0);
    
    // Response parameters
    this.activationTemp = options.activationTemp || 343; // K (70°C)
    this.activationSmoke = options.activationSmoke || 5; // %/m obscuration
    this.activationCO = options.activationCO || 50; // ppm
    
    // Time lag (simplified)
    this.responseTime = options.responseTime || 10; // seconds
    
    // State
    this.activated = false;
    this.activationTime = null;
    this.currentReading = {
      temperature: 293,
      smokeObscuration: 0,
      coConcentration: 0
    };
  }

  checkActivation(upperLayer, time) {
    let shouldActivate = false;
    
    switch (this.type) {
      case 'heat':
        shouldActivate = upperLayer.temperature >= this.activationTemp;
        break;
      case 'smoke':
        // Convert visibility to obscuration
        const K = 3 / Math.max(upperLayer.visibility, 0.1); // 1/m
        const obscuration = (1 - Math.exp(-K * 0.1)) * 100; // %
        shouldActivate = obscuration >= this.activationSmoke;
        break;
      case 'co':
        shouldActivate = upperLayer.coConcentration >= this.activationCO;
        break;
      case 'multi':
        shouldActivate = (
          upperLayer.temperature >= this.activationTemp ||
          upperLayer.coConcentration >= this.activationCO
        );
        break;
    }
    
    if (shouldActivate && !this.activated) {
      this.activated = true;
      this.activationTime = time;
      return true;
    }
    
    return false;
  }

  updateReading(upperLayer) {
    this.currentReading = {
      temperature: upperLayer.temperature,
      smokeObscuration: this.calculateObscuration(upperLayer.visibility),
      coConcentration: upperLayer.coConcentration
    };
  }

  calculateObscuration(visibility) {
    if (visibility <= 0) return 100;
    const K = 3 / visibility;
    return (1 - Math.exp(-K * 0.1)) * 100;
  }

  toJSON() {
    return {
      id: this.id,
      type: this.type,
      position: { x: this.position.x, y: this.position.y, z: this.position.z },
      activated: this.activated,
      activationTime: this.activationTime
    };
  }
}

export default { FireSource, MaterialFire, Ventilation, Detector };
