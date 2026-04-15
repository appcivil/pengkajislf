/**
 * SunSimulator.js - Solar Analysis dan Shadow Engine
 * Simulasi posisi matahari dan analisis bayangan
 */

export class SunSimulator {
  constructor() {
    this.latitude = -6.2088; // Default Jakarta
    this.longitude = 106.8456;
    this.timezone = 7; // WIB
  }

  setLocation(lat, lon, tz = 7) {
    this.latitude = lat;
    this.longitude = lon;
    this.timezone = tz;
  }

  // Calculate sun position for given date/time
  calculateSunPosition(date = new Date()) {
    const julianDay = this.getJulianDay(date);
    const n = julianDay - 2451545.0;
    
    // Mean longitude of the sun
    let L = (280.460 + 0.9856474 * n) % 360;
    if (L < 0) L += 360;
    
    // Mean anomaly
    let g = (357.528 + 0.9856003 * n) % 360;
    if (g < 0) g += 360;
    
    // Ecliptic longitude
    const lambda = L + 1.915 * Math.sin(this.toRad(g)) + 0.020 * Math.sin(this.toRad(2 * g));
    
    // Obliquity of ecliptic
    const epsilon = 23.439 - 0.0000004 * n;
    
    // Right ascension and declination
    let alpha = this.toDeg(Math.atan2(
      Math.cos(this.toRad(epsilon)) * Math.sin(this.toRad(lambda)),
      Math.cos(this.toRad(lambda))
    ));
    if (alpha < 0) alpha += 360;
    
    const delta = this.toDeg(Math.asin(
      Math.sin(this.toRad(epsilon)) * Math.sin(this.toRad(lambda))
    ));
    
    // Local sidereal time
    const d = julianDay - 2451545;
    const GMST = 18.697374558 + 24.06570982441908 * d;
    const LMST = (GMST * 15 + this.longitude) % 360;
    if (LMST < 0) LMST += 360;
    
    // Hour angle
    let H = LMST - alpha;
    if (H < -180) H += 360;
    if (H > 180) H -= 360;
    
    // Altitude and azimuth
    const sinAlt = Math.sin(this.toRad(delta)) * Math.sin(this.toRad(this.latitude)) +
                   Math.cos(this.toRad(delta)) * Math.cos(this.toRad(this.latitude)) * Math.cos(this.toRad(H));
    const altitude = this.toDeg(Math.asin(sinAlt));
    
    const cosAz = (Math.sin(this.toRad(delta)) - Math.sin(this.toRad(this.latitude)) * sinAlt) /
                  (Math.cos(this.toRad(this.latitude)) * Math.cos(Math.asin(sinAlt)));
    let azimuth = this.toDeg(Math.acos(cosAz));
    if (H > 0) azimuth = 360 - azimuth;
    
    return {
      azimuth: Math.round(azimuth * 100) / 100,
      elevation: Math.round(altitude * 100) / 100,
      hourAngle: H,
      declination: delta
    };
  }

  // Get sun path for a day (every hour)
  getSunPath(date = new Date()) {
    const path = [];
    const baseDate = new Date(date);
    baseDate.setHours(0, 0, 0, 0);
    
    for (let hour = 6; hour <= 18; hour++) {
      const d = new Date(baseDate);
      d.setHours(hour);
      const pos = this.calculateSunPosition(d);
      if (pos.elevation > 0) {
        path.push({
          time: `${hour}:00`,
          hour,
          ...pos
        });
      }
    }
    
    return path;
  }

  // Calculate shadow length for given object height
  calculateShadow(objectHeight, sunElevation) {
    if (sunElevation <= 0) return Infinity;
    return objectHeight / Math.tan(this.toRad(sunElevation));
  }

  // Solar analysis for building
  analyzeSolar(floorPlans, date = new Date()) {
    const analysis = {
      date: date.toISOString(),
      hourly: [],
      summary: {
        maxSunExposure: 0,
        minSunExposure: 0,
        avgSunExposure: 0,
        shadowHours: 0
      }
    };

    // Analyze every hour
    const baseDate = new Date(date);
    for (let hour = 6; hour <= 18; hour++) {
      const d = new Date(baseDate);
      d.setHours(hour);
      const sunPos = this.calculateSunPosition(d);
      
      if (sunPos.elevation > 0) {
        // Calculate which floors get direct sun
        const sunExposure = this.calculateBuildingExposure(floorPlans, sunPos);
        
        analysis.hourly.push({
          hour,
          sunPosition: sunPos,
          exposure: sunExposure
        });
      }
    }

    return analysis;
  }

  calculateBuildingExposure(floorPlans, sunPos) {
    // Simplified exposure calculation
    // Returns percentage of facade exposed to sun
    const facadeCount = floorPlans.length * 4; // 4 sides per floor
    const azimuthRad = this.toRad(sunPos.azimuth);
    
    // Determine which facades are sun-facing based on azimuth
    let sunFacingFacades = 0;
    
    // East (90°)
    if (sunPos.azimuth > 45 && sunPos.azimuth < 135) sunFacingFacades++;
    // South (180°)
    if (sunPos.azimuth > 135 && sunPos.azimuth < 225) sunFacingFacades++;
    // West (270°)
    if (sunPos.azimuth > 225 && sunPos.azimuth < 315) sunFacingFacades++;
    // North (0°/360°)
    if (sunPos.azimuth < 45 || sunPos.azimuth > 315) sunFacingFacades++;
    
    return (sunFacingFacades / 4) * 100;
  }

  // Helper functions
  getJulianDay(date) {
    return (date.getTime() / 86400000) + 2440587.5;
  }

  toRad(deg) {
    return deg * Math.PI / 180;
  }

  toDeg(rad) {
    return rad * 180 / Math.PI;
  }
}

/**
 * SpaceAnalyzer - Auto-calculate areas dan analisis ruang
 */
export class SpaceAnalyzer {
  constructor() {
    this.rules = {
      minRoomArea: 9, // m²
      minCeilingHeight: 2.4, // m
      minOpeningRatio: 0.2, // 20%
      minCirculationWidth: 1.2 // m
    };
  }

  analyzeFloorPlan(floorPlan) {
    const areas = this.calculateAreas(floorPlan);
    const volumes = this.calculateVolumes(floorPlan, areas);
    const efficiencies = this.calculateEfficiencies(floorPlan, areas);
    
    return {
      areas,
      volumes,
      efficiencies,
      compliance: this.checkCompliance(floorPlan, areas),
      recommendations: this.generateRecommendations(floorPlan, areas)
    };
  }

  calculateAreas(floorPlan) {
    // Calculate gross floor area
    const grossArea = floorPlan.points ? this.polygonArea(floorPlan.points) : 0;
    
    // Calculate usable area (subtract walls, columns)
    const wallThickness = floorPlan.wallThickness || 0.2;
    const wallArea = floorPlan.perimeter ? floorPlan.perimeter * wallThickness : 0;
    const usableArea = Math.max(0, grossArea - wallArea);
    
    // Calculate by room type
    const roomAreas = floorPlan.rooms?.map(room => ({
      id: room.id,
      type: room.type,
      area: room.points ? this.polygonArea(room.points) : 0,
      compliance: this.checkRoomCompliance(room)
    })) || [];

    return {
      gross: grossArea,
      usable: usableArea,
      wallArea,
      rooms: roomAreas,
      totalRoomArea: roomAreas.reduce((sum, r) => sum + r.area, 0)
    };
  }

  calculateVolumes(floorPlan, areas) {
    const height = floorPlan.height || 3;
    
    return {
      gross: areas.gross * height,
      usable: areas.usable * height,
      roomVolumes: areas.rooms.map(r => ({
        id: r.id,
        volume: r.area * height
      }))
    };
  }

  calculateEfficiencies(floorPlan, areas) {
    const circulationArea = floorPlan.circulationArea || 0;
    const serviceArea = floorPlan.serviceArea || 0;
    
    const usableEfficiency = areas.gross > 0 ? (areas.usable / areas.gross) * 100 : 0;
    const netEfficiency = areas.gross > 0 ? 
      ((areas.usable - circulationArea - serviceArea) / areas.gross) * 100 : 0;
    
    return {
      usableEfficiency: Math.round(usableEfficiency * 100) / 100,
      netEfficiency: Math.round(netEfficiency * 100) / 100,
      circulationRatio: areas.gross > 0 ? (circulationArea / areas.gross) * 100 : 0
    };
  }

  checkCompliance(floorPlan, areas) {
    const checks = [];
    
    // Check room sizes
    areas.rooms.forEach(room => {
      if (room.area < this.rules.minRoomArea) {
        checks.push({
          type: 'room_size',
          roomId: room.id,
          passed: false,
          message: `Ruang ${room.id} di bawah minimum ${this.rules.minRoomArea}m²`
        });
      }
    });
    
    // Check ceiling height
    if ((floorPlan.ceilingHeight || 0) < this.rules.minCeilingHeight) {
      checks.push({
        type: 'ceiling_height',
        passed: false,
        message: `Tinggi plafon di bawah minimum ${this.rules.minCeilingHeight}m`
      });
    }
    
    // Check opening ratio
    const openingRatio = floorPlan.openingRatio || 0;
    if (openingRatio < this.rules.minOpeningRatio) {
      checks.push({
        type: 'opening_ratio',
        passed: false,
        message: `Rasio bukaan ${(openingRatio * 100).toFixed(0)}% di bawah minimum ${(this.rules.minOpeningRatio * 100).toFixed(0)}%`
      });
    }
    
    return {
      passed: checks.length === 0,
      checks,
      score: checks.length === 0 ? 100 : Math.max(0, 100 - (checks.length * 10))
    };
  }

  generateRecommendations(floorPlan, areas) {
    const recs = [];
    
    if (areas.usableEfficiency < 70) {
      recs.push('Efisiensi lantai rendah. Pertimbangkan mengurangi area sirkulasi.');
    }
    
    if (areas.rooms.some(r => r.area < this.rules.minRoomArea)) {
      recs.push('Beberapa ruang di bawah ukuran minimum. Perluas atau gabungkan ruang.');
    }
    
    return recs;
  }

  checkRoomCompliance(room) {
    const area = room.points ? this.polygonArea(room.points) : 0;
    return {
      minArea: area >= this.rules.minRoomArea,
      hasOpening: (room.openingArea || 0) > 0,
      area
    };
  }

  polygonArea(points) {
    if (!points || points.length < 3) return 0;
    
    let area = 0;
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      area += points[i].x * points[j].y;
      area -= points[j].x * points[i].y;
    }
    return Math.abs(area / 2);
  }

  // Quick area calculation from coordinates
  quickArea(coords) {
    return this.polygonArea(coords.map((c, i) => ({ x: c[0], y: c[1] })));
  }
}

export default { SunSimulator, SpaceAnalyzer };
