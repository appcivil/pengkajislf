/**
 * StormwaterEngine - Main Integration Engine
 * Mengintegrasikan semua komponen simulasi stormwater
 */

import { RainfallEngine } from './RainfallEngine.js';
import { RunoffCalculator } from './RunoffCalculator.js';
import { RoutingEngine } from './RoutingEngine.js';
import { LIDController } from './LIDController.js';
import { WaterQualityModel } from './WaterQualityModel.js';

export class StormwaterEngine {
  constructor() {
    this.rainfall = new RainfallEngine();
    this.runoff = new RunoffCalculator();
    this.routing = new RoutingEngine();
    this.lid = new LIDController();
    this.waterQuality = new WaterQualityModel();

    this.catchments = [];
    this.channels = [];
    this.lidSystems = [];
    this.simulationResults = null;
  }

  /**
   * Run complete stormwater simulation
   * @param {Object} config - Simulation configuration
   * @returns {Object} Complete simulation results
   */
  runSimulation(config) {
    const {
      city = 'Jakarta',
      returnPeriod = 25,
      duration = 120,
      timestep = 5,
      stormType = 'SCS Type II',
      catchments = [],
      channels = [],
      lidSystems = [],
      includeWaterQuality = false
    } = config;

    // 1. Generate design storm
    const storm = this.rainfall.generateHyetograph(duration, timestep, returnPeriod, stormType, city);

    // 2. Calculate runoff for each catchment
    const catchmentResults = catchments.map(c => {
      const hydrograph = this.runoff.generateHydrograph(c, storm, 'SCS');
      return {
        ...c,
        hydrograph,
        peakFlow: Math.max(...hydrograph.map(h => h.flow)),
        totalVolume: hydrograph.reduce((a, h) => a + h.flow, 0) * timestep * 60
      };
    });

    // 3. Route flow through channels
    let routingResults = null;
    if (channels.length > 0) {
      // Combine all catchment hydrographs
      const combinedInflow = this.combineHydrographs(catchmentResults.map(c => c.hydrograph));

      // Clear and rebuild routing network
      this.routing.clearNetwork();
      channels.forEach(ch => {
        this.routing.addChannel(
          ch.id,
          ch.fromNode,
          ch.toNode,
          ch.length,
          ch.crossSection,
          ch.roughness,
          ch.slope
        );
      });

      routingResults = this.routing.routeFlow(combinedInflow, 'Muskingum');
    }

    // 4. Simulate LID performance
    const lidResults = lidSystems.map(lid => {
      // Find inflow for this LID (could be from catchment or upstream LID)
      const sourceHydrograph = catchmentResults.find(c => c.id === lid.sourceId)?.hydrograph ||
        catchmentResults[0]?.hydrograph ||
        [{ time: 0, flow: 0 }];

      return this.lid.simulateLID(sourceHydrograph, lid.type, lid.area, lid.options);
    });

    // 5. Water quality simulation (if requested)
    let waterQualityResults = null;
    if (includeWaterQuality && catchments.length > 0) {
      waterQualityResults = catchments.map(c => {
        const runoffHydrograph = catchmentResults.find(cr => cr.id === c.id)?.hydrograph || [];
        return {
          catchmentId: c.id,
          results: this.waterQuality.simulateEvent(c, storm, runoffHydrograph)
        };
      });
    }

    this.simulationResults = {
      storm,
      catchments: catchmentResults,
      routing: routingResults,
      lid: lidResults,
      waterQuality: waterQualityResults,
      summary: this.calculateSummary(catchmentResults, routingResults, lidResults)
    };

    return this.simulationResults;
  }

  /**
   * Combine multiple hydrographs
   */
  combineHydrographs(hydrographs) {
    if (hydrographs.length === 0) return [];
    if (hydrographs.length === 1) return hydrographs[0];

    const length = Math.max(...hydrographs.map(h => h.length));
    const combined = [];

    for (let i = 0; i < length; i++) {
      let totalFlow = 0;
      let time = 0;

      hydrographs.forEach(h => {
        if (i < h.length) {
          totalFlow += h[i].flow || 0;
          time = h[i].time;
        }
      });

      combined.push({ time, flow: totalFlow });
    }

    return combined;
  }

  /**
   * Calculate simulation summary
   */
  calculateSummary(catchments, routing, lid) {
    const totalInflow = catchments.reduce((a, c) => a + c.totalVolume, 0);
    const peakInflow = Math.max(...catchments.map(c => c.peakFlow), 0);

    const totalLidOutflow = lid.reduce((a, l) => a + l.summary.totalOutflow, 0);
    const peakLidOutflow = lid.length > 0 ? Math.max(...lid.map(l => l.summary.peakOutflow)) : peakInflow;

    return {
      totalInflow,
      totalOutflow: totalLidOutflow || (routing?.maxFlow ? routing.maxFlow * 3600 : totalInflow),
      peakInflow,
      peakOutflow: peakLidOutflow || routing?.maxFlow || peakInflow,
      volumeReduction: totalInflow > 0 ? (totalInflow - totalLidOutflow) / totalInflow : 0,
      peakReduction: peakInflow > 0 ? (peakInflow - peakLidOutflow) / peakInflow : 0,
      catchmentCount: catchments.length,
      channelCount: routing?.channels?.length || 0,
      lidCount: lid.length
    };
  }

  /**
   * Add catchment to simulation
   */
  addCatchment(catchment) {
    this.catchments.push(catchment);
  }

  /**
   * Add channel to network
   */
  addChannel(channel) {
    this.channels.push(channel);
  }

  /**
   * Add LID system
   */
  addLIDSystem(lid) {
    this.lidSystems.push(lid);
  }

  /**
   * Get available cities
   */
  getAvailableCities() {
    return this.rainfall.getAvailableCities();
  }

  /**
   * Get storm types
   */
  getStormTypes() {
    return this.rainfall.getStormTypes();
  }

  /**
   * Get LID types
   */
  getLIDTypes() {
    return this.lid.getLIDTypes();
  }

  /**
   * Size LID for target performance
   */
  sizeLID(lidType, targetReduction, catchmentArea) {
    // Create dummy hydrograph for sizing
    const dummyHydrograph = [
      { time: 0, flow: 0 },
      { time: 300, flow: 0.5 },
      { time: 600, flow: 1.0 },
      { time: 900, flow: 0.5 },
      { time: 1200, flow: 0 }
    ];

    return this.lid.sizeLIDSystem(lidType, dummyHydrograph, targetReduction);
  }

  /**
   * Clear all data
   */
  clear() {
    this.catchments = [];
    this.channels = [];
    this.lidSystems = [];
    this.simulationResults = null;
    this.routing.clearNetwork();
  }
}

export default StormwaterEngine;
