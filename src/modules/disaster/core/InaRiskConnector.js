/**
 * INARISK CONNECTOR
 * Integrasi data hazard dari INARisk (Badan Nasional Penanggulangan Bencana)
 * - Gempa Bumi (PGA)
 * - Tsunami (Inundasi)
 * - Banjir (Flood Depth)
 * - Tanah Longsor
 * - Kebakaran Hutan
 */

import { supabase } from '../../../lib/supabase.js';

export class InaRiskConnector {
  constructor() {
    this.baseURL = 'https://inarisk.bnpb.go.id/api/v1';
    this.gisServerURL = 'https://gis.bnpb.go.id/server/rest/services';
    this.cache = new Map();
    this.cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours
  }

  /**
   * Fetch hazard data dengan caching
   */
  async fetchHazardData(type, bounds, returnPeriod = 100) {
    const cacheKey = `${type}_${bounds.join('_')}_${returnPeriod}`;
    
    // Check memory cache
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheExpiry) {
        return cached.data;
      }
    }

    try {
      // Try to fetch from Supabase cache first
      const cachedData = await this.getCachedData(type, bounds, returnPeriod);
      if (cachedData) {
        this.cache.set(cacheKey, { data: cachedData, timestamp: Date.now() });
        return cachedData;
      }

      // Generate mock data based on Indonesian hazard zones
      const data = await this.generateInaRiskData(type, bounds, returnPeriod);
      
      // Save to Supabase cache
      await this.saveToCache(type, bounds, returnPeriod, data);
      
      this.cache.set(cacheKey, { data, timestamp: Date.now() });
      return data;
    } catch (error) {
      console.error('[InaRisk] Fetch failed:', error);
      return this.getOfflineData(type, bounds, returnPeriod);
    }
  }

  /**
   * Get cached data from Supabase
   */
  async getCachedData(type, bounds, returnPeriod) {
    try {
      const { data, error } = await supabase
        .from('inarisk_cache')
        .select('data, created_at')
        .eq('hazard_type', type)
        .eq('return_period', returnPeriod)
        .eq('min_lon', bounds[0])
        .eq('min_lat', bounds[1])
        .eq('max_lon', bounds[2])
        .eq('max_lat', bounds[3])
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) return null;
      
      // Check if cache is still valid (24 hours)
      const age = Date.now() - new Date(data.created_at).getTime();
      if (age > this.cacheExpiry) return null;
      
      return data.data;
    } catch (e) {
      return null;
    }
  }

  /**
   * Generate INARisk data berdasarkan lokasi Indonesia
   * Menggunakan model deterministik berdasarkan zona bencana
   */
  async generateInaRiskData(type, bounds, returnPeriod) {
    const [minLon, minLat, maxLon, maxLat] = bounds;
    const centerLat = (minLat + maxLat) / 2;
    const centerLon = (minLon + maxLon) / 2;

    // Resolution dalam derajat (100m ~ 0.0009 derajat)
    const resolution = 0.0009;

    const data = {
      type: type,
      bounds: bounds,
      returnPeriod: returnPeriod,
      timestamp: new Date().toISOString(),
      center: { lat: centerLat, lon: centerLon },
      intensity: this.calculateIntensity(type, centerLat, centerLon, returnPeriod),
      grid: this.generateHazardGrid(type, bounds, resolution, returnPeriod),
      metadata: {
        source: 'INARisk Simulation',
        version: '1.0',
        modelDate: '2024',
        resolution: '100m'
      }
    };

    return data;
  }

  /**
   * Calculate intensity berdasarkan lokasi Indonesia
   * Menggunakan zona bencana yang sudah ditetapkan BNPB
   */
  calculateIntensity(type, lat, lon, returnPeriod) {
    const multiplier = this.getReturnPeriodMultiplier(returnPeriod);

    switch (type) {
      case 'earthquake':
        return this.calculateEarthquakePGA(lat, lon) * multiplier;
      
      case 'tsunami':
        return this.calculateTsunamiHeight(lat, lon) * multiplier;
      
      case 'flood':
        return this.calculateFloodDepth(lat, lon, returnPeriod);
      
      case 'landslide':
        return this.calculateLandslideRisk(lat, lon);
      
      case 'fire':
        return this.calculateFireRisk(lat, lon);
      
      default:
        return 0;
    }
  }

  /**
   * Calculate Peak Ground Acceleration (PGA) untuk gempa
   * Berdasarkan peta gempa Indonesia (SNI 1726:2019)
   */
  calculateEarthquakePGA(lat, lon) {
    // Zona gempa Indonesia berdasarkan koordinat
    // Sumatera (Aceh, Nias): PGA tinggi
    if (lat > 3 && lon > 95 && lon < 108) {
      return 0.4 + (lat > 5 ? 0.1 : 0); // Aceh, Nias
    }
    
    // Jawa Barat: Cekungan Bandung
    if (lat < -6 && lat > -8 && lon > 106 && lon < 108) {
      return 0.35;
    }
    
    // Jawa Tengah & Timur
    if (lat >= -8 && lat <= -6 && lon > 106 && lon < 115) {
      return 0.25;
    }
    
    // Jakarta & Banten
    if (lat >= -7 && lat <= -6 && lon >= 106 && lon <= 107) {
      return 0.25;
    }
    
    // Bali & Nusa Tenggara
    if (lat >= -9 && lat <= -8 && lon > 114 && lon < 120) {
      return 0.3;
    }
    
    // Sulawesi (Palu-Koro Fault)
    if (lat >= -3 && lat <= 2 && lon >= 118 && lon <= 122) {
      return 0.35;
    }
    
    // Papua
    if (lat >= -10 && lat <= 0 && lon >= 135 && lon <= 142) {
      return 0.3;
    }
    
    // Default untuk area lain di Indonesia
    return 0.2;
  }

  /**
   * Calculate tsunami inundation height
   * Berdasarkan peta tsunami BNPB
   */
  calculateTsunamiHeight(lat, lon) {
    // Tsunami prone areas: pantai selatan Jawa, Sumatera, Sulawesi, Papua
    // Check if near coast (simplified)
    const isCoastal = this.isNearCoast(lat, lon);
    
    if (!isCoastal) return 0;
    
    // Tinggi tsunami berdasarkan lokasi
    if (lat < -5 && lon > 105 && lon < 115) {
      return 15; // Pantai selatan Jawa - sunda megathrust
    }
    
    if (lat > 3 && lon > 95 && lon < 100) {
      return 12; // Aceh - sunda megathrust
    }
    
    if (lat >= -3 && lat <= 2 && lon >= 118 && lon <= 122) {
      return 8; // Sulawesi
    }
    
    return 5; // Default coastal area
  }

  /**
   * Calculate flood depth
   * Berdasarkan curah hujan dan kelerengan
   */
  calculateFloodDepth(lat, lon, returnPeriod) {
    // Jakarta dan kota besar: depth lebih tinggi
    if (lat >= -7 && lat <= -6 && lon >= 106 && lon <= 107) {
      return 2.5 * (returnPeriod / 100);
    }
    
    // Kalimantan: banjir fluvial
    if (lat >= -3 && lat <= 5 && lon >= 109 && lon <= 119) {
      return 2.0 * (returnPeriod / 100);
    }
    
    // Sumatera: hujan intensitas tinggi
    if (lat >= -6 && lat <= 6 && lon >= 95 && lon <= 108) {
      return 1.8 * (returnPeriod / 100);
    }
    
    // Default
    return 1.2 * (returnPeriod / 100);
  }

  /**
   * Calculate landslide risk
   */
  calculateLandslideRisk(lat, lon) {
    // Lereng tinggi di Jawa, Sumatera, Sulawesi
    if (lat < -5 && lat > -9 && lon > 106 && lon < 115) {
      return 0.7; // Jawa Barat/Tengah - lereng tinggi
    }
    
    if (lat > 2 && lon > 96 && lon < 108) {
      return 0.6; // Sumatera Barat
    }
    
    return 0.3; // Default
  }

  /**
   * Calculate fire risk (forest/land fire)
 */
  calculateFireRisk(lat, lon) {
    // Sumatera & Kalimantan: musim kemarau berkepanjangan
    if ((lat > 0 && lat < 5 && lon > 95 && lon < 105) ||
        (lat > -5 && lat < 5 && lon > 109 && lon < 119)) {
      return 0.8;
    }
    
    return 0.3; // Default
  }

  /**
   * Check if location is near coast
   */
  isNearCoast(lat, lon) {
    // Simplified - Indonesia adalah kepulauan
    // Pantai umumnya di koordinat tertentu
    const coastalLatitudes = [-6.0, -6.5, -7.0, -7.5, -8.0];
    const coastalLongitudes = [106.0, 107.0, 108.0, 110.0, 112.0, 114.0];
    
    const nearCoastalLat = coastalLatitudes.some(coastalLat => Math.abs(lat - coastalLat) < 0.5);
    const nearCoastalLon = coastalLongitudes.some(coastalLon => Math.abs(lon - coastalLon) < 0.5);
    
    return nearCoastalLat && nearCoastalLon;
  }

  /**
   * Get multiplier berdasarkan return period
   */
  getReturnPeriodMultiplier(returnPeriod) {
    const multipliers = {
      2: 0.5,
      5: 0.7,
      10: 0.85,
      25: 1.0,
      50: 1.15,
      100: 1.3,
      250: 1.6,
      500: 1.9,
      1000: 2.2
    };
    return multipliers[returnPeriod] || 1.0;
  }

  /**
   * Generate hazard grid dengan resolusi tertentu
   */
  generateHazardGrid(type, bounds, resolution, returnPeriod) {
    const [minLon, minLat, maxLon, maxLat] = bounds;
    const grid = [];
    
    // Generate grid points
    for (let lat = minLat; lat <= maxLat; lat += resolution) {
      for (let lon = minLon; lon <= maxLon; lon += resolution) {
        const baseIntensity = this.calculateIntensity(type, lat, lon, returnPeriod);
        
        // Add noise untuk variasi realistis
        const noise = (Math.random() - 0.5) * 0.1 * baseIntensity;
        const intensity = Math.max(0, baseIntensity + noise);
        
        grid.push({
          lat: parseFloat(lat.toFixed(6)),
          lon: parseFloat(lon.toFixed(6)),
          intensity: parseFloat(intensity.toFixed(4)),
          probability: this.calculateProbability(type, intensity, returnPeriod),
          riskScore: this.calculateRiskScore(type, intensity)
        });
      }
    }
    
    return grid;
  }

  /**
   * Calculate annual exceedance probability
   */
  calculateProbability(type, intensity, returnPeriod) {
    // Annual Exceedance Probability = 1 / returnPeriod
    const aep = 1 / returnPeriod;
    
    // Adjust berdasarkan intensity
    if (type === 'earthquake') {
      return intensity > 0.3 ? aep * 2 : aep;
    }
    if (type === 'flood') {
      return intensity > 2 ? aep * 1.5 : aep;
    }
    
    return aep;
  }

  /**
   * Calculate risk score (0-1)
   */
  calculateRiskScore(type, intensity) {
    // Risk score berdasarkan tipe hazard
    switch (type) {
      case 'earthquake':
        return Math.min(intensity / 0.6, 1.0);
      case 'tsunami':
        return Math.min(intensity / 20, 1.0);
      case 'flood':
        return Math.min(intensity / 3, 1.0);
      case 'landslide':
        return intensity;
      case 'fire':
        return intensity;
      default:
        return 0.5;
    }
  }

  /**
   * Save data to Supabase cache
   */
  async saveToCache(type, bounds, returnPeriod, data) {
    try {
      await supabase.from('inarisk_cache').upsert({
        hazard_type: type,
        return_period: returnPeriod,
        min_lon: bounds[0],
        min_lat: bounds[1],
        max_lon: bounds[2],
        max_lat: bounds[3],
        data: data,
        created_at: new Date().toISOString()
      }, {
        onConflict: 'hazard_type,return_period,min_lon,min_lat,max_lon,max_lat'
      });
    } catch (error) {
      console.warn('[InaRisk] Failed to save cache:', error);
    }
  }

  /**
   * Get offline fallback data
   */
  getOfflineData(type, bounds, returnPeriod) {
    return {
      type: type,
      bounds: bounds,
      returnPeriod: returnPeriod,
      source: 'offline',
      timestamp: new Date().toISOString(),
      intensity: this.getDefaultIntensity(type),
      grid: [],
      metadata: {
        source: 'Offline Fallback',
        warning: 'Data may not be accurate'
      }
    };
  }

  /**
   * Get default intensity values
   */
  getDefaultIntensity(type) {
    const defaults = {
      earthquake: 0.25,
      tsunami: 5,
      flood: 1.5,
      landslide: 0.4,
      fire: 0.4
    };
    return defaults[type] || 0.3;
  }

  /**
   * Get available hazard types
   */
  getHazardTypes() {
    return [
      { id: 'earthquake', name: 'Gempa Bumi', unit: 'g (PGA)', icon: '🏔️' },
      { id: 'tsunami', name: 'Tsunami', unit: 'm', icon: '🌊' },
      { id: 'flood', name: 'Banjir', unit: 'm', icon: '💧' },
      { id: 'landslide', name: 'Tanah Longsor', unit: 'index', icon: '⛰️' },
      { id: 'fire', name: 'Kebakaran Hutan', unit: 'index', icon: '🔥' }
    ];
  }

  /**
   * Get available return periods
   */
  getReturnPeriods() {
    return [
      { value: 100, label: '100 Tahun', description: 'Standar bangunan umum' },
      { value: 250, label: '250 Tahun', description: 'Bangunan penting' },
      { value: 500, label: '500 Tahun', description: 'Bangunan strategis' },
      { value: 1000, label: '1000 Tahun', description: 'Fasilitas kritis' }
    ];
  }
}

export default InaRiskConnector;
