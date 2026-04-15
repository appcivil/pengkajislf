/**
 * HAZARD ENGINE
 * Simulator bencana 3D menggunakan Three.js/WebGL
 * - Gempa Bumi (Shake animation, PGA-based damage)
 * - Banjir (Water level rising, particle flow)
 * - Tsunami (Wave propagation)
 * - Longsor (Debris flow)
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export class HazardEngine {
  constructor(scene, camera, renderer) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.type = null;
    this.intensity = 0;
    this.time = 0;
    this.isRunning = false;
    this.objects = new Map();
    this.animationId = null;
    
    // Simulation parameters
    this.params = {
      duration: 30,
      timestep: 0.016,
      shakeMagnitude: 0,
      waveSpeed: 0,
      waterRiseRate: 0,
      debrisVelocity: 0
    };
  }

  /**
   * Set hazard type dan intensity
   */
  setHazard(type, intensity, params = {}) {
    this.type = type;
    this.intensity = intensity;
    this.params = { ...this.params, ...params };
    this.time = 0;
    
    // Clear previous hazard objects
    this.clearHazardObjects();
    
    // Setup visual berdasarkan tipe
    switch(type) {
      case 'earthquake':
        this.setupEarthquakeSimulation(intensity);
        break;
      case 'flood':
        this.setupFloodSimulation(intensity, params.waterLevel || 0);
        break;
      case 'tsunami':
        this.setupTsunamiSimulation(intensity);
        break;
      case 'landslide':
        this.setupLandslideSimulation(intensity);
        break;
      default:
        console.warn(`[HazardEngine] Unknown hazard type: ${type}`);
    }
  }

  /**
   * Setup earthquake simulation
   * @param {number} pga - Peak Ground Acceleration (g)
   */
  setupEarthquakeSimulation(pga) {
    this.params.shakeMagnitude = pga * 2; // Scale for visual
    this.params.frequency = pga > 0.3 ? 3 : 1.5; // Hz
    this.params.duration = 30;
    
    // Ground plane dengan grid
    const groundGeometry = new THREE.PlaneGeometry(200, 200, 50, 50);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a2e,
      roughness: 0.8,
      metalness: 0.2,
      wireframe: false
    });
    
    this.groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
    this.groundMesh.rotation.x = -Math.PI / 2;
    this.groundMesh.receiveShadow = true;
    this.groundMesh.name = 'hazard_ground';
    this.scene.add(this.groundMesh);
    
    // Grid helper
    const gridHelper = new THREE.GridHelper(200, 50, 0x444466, 0x222233);
    gridHelper.name = 'hazard_grid';
    this.scene.add(gridHelper);
    this.objects.set('grid', gridHelper);
    
    // Epicenter indicator
    const epicenterGeometry = new THREE.RingGeometry(2, 3, 32);
    const epicenterMaterial = new THREE.MeshBasicMaterial({
      color: 0xff4444,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide
    });
    const epicenter = new THREE.Mesh(epicenterGeometry, epicenterMaterial);
    epicenter.rotation.x = -Math.PI / 2;
    epicenter.position.y = 0.1;
    epicenter.name = 'epicenter';
    this.scene.add(epicenter);
    this.objects.set('epicenter', epicenter);
    
    // Seismic waves
    this.seismicWaves = [];
    for (let i = 0; i < 3; i++) {
      const waveGeometry = new THREE.RingGeometry(1, 2, 32);
      const waveMaterial = new THREE.MeshBasicMaterial({
        color: 0xff6666,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide
      });
      const wave = new THREE.Mesh(waveGeometry, waveMaterial);
      wave.rotation.x = -Math.PI / 2;
      wave.position.y = 0.2 + i * 0.1;
      wave.name = `seismic_wave_${i}`;
      this.scene.add(wave);
      this.seismicWaves.push({
        mesh: wave,
        delay: i * 2,
        speed: 10 + i * 5
      });
    }
    
    this.objects.set('ground', this.groundMesh);
    this.objects.set('seismicWaves', this.seismicWaves);
  }

  /**
   * Setup flood simulation
   * @param {number} depth - Maximum flood depth (m)
   * @param {number} baseLevel - Base water level (m)
   */
  setupFloodSimulation(depth, baseLevel = 0) {
    this.params.waterLevel = depth;
    this.params.baseLevel = baseLevel;
    this.params.riseRate = depth / 60; // Reach max in 60 seconds
    this.params.duration = 120;
    
    // Water plane
    const waterGeometry = new THREE.PlaneGeometry(200, 200, 64, 64);
    const waterMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x006994,
      transmission: 0.9,
      opacity: 0.85,
      transparent: true,
      roughness: 0.1,
      metalness: 0.1,
      reflectivity: 0.8,
      ior: 1.33,
      side: THREE.DoubleSide
    });
    
    this.waterMesh = new THREE.Mesh(waterGeometry, waterMaterial);
    this.waterMesh.rotation.x = -Math.PI / 2;
    this.waterMesh.position.y = baseLevel;
    this.waterMesh.name = 'flood_water';
    this.scene.add(this.waterMesh);
    this.objects.set('water', this.waterMesh);
    
    // Water particles (flow)
    this.setupWaterParticles();
    
    // Depth markers
    for (let i = 1; i <= Math.ceil(depth); i++) {
      const markerGeometry = new THREE.PlaneGeometry(5, 0.5);
      const markerMaterial = new THREE.MeshBasicMaterial({
        color: 0x00aaff,
        transparent: true,
        opacity: 0.5
      });
      const marker = new THREE.Mesh(markerGeometry, markerMaterial);
      marker.position.set(-90, baseLevel + i, -90);
      marker.name = `depth_marker_${i}`;
      
      // Add label (simplified as sprite)
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 64;
      const context = canvas.getContext('2d');
      context.fillStyle = 'rgba(0, 0, 0, 0.7)';
      context.fillRect(0, 0, 128, 64);
      context.fillStyle = '#00aaff';
      context.font = 'bold 24px Arial';
      context.textAlign = 'center';
      context.fillText(`${i}m`, 64, 40);
      
      const texture = new THREE.CanvasTexture(canvas);
      const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
      const sprite = new THREE.Sprite(spriteMaterial);
      sprite.position.set(-85, baseLevel + i + 0.5, -90);
      sprite.scale.set(4, 2, 1);
      
      this.scene.add(marker);
      this.scene.add(sprite);
      this.objects.set(`marker_${i}`, marker);
      this.objects.set(`label_${i}`, sprite);
    }
  }

  /**
   * Setup water particle system
   */
  setupWaterParticles() {
    const particleCount = 2000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
      // Random positions within simulation area
      positions[i * 3] = (Math.random() - 0.5) * 180;
      positions[i * 3 + 1] = Math.random() * 5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 180;
      
      // Flow velocities
      velocities[i * 3] = 2 + Math.random() * 3; // X direction
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.5; // Y turbulence
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 1; // Z spread
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
    
    const material = new THREE.PointsMaterial({
      color: 0xaaccff,
      size: 0.8,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    });
    
    this.particles = new THREE.Points(geometry, material);
    this.particles.name = 'water_particles';
    this.scene.add(this.particles);
    this.objects.set('particles', this.particles);
  }

  /**
   * Setup tsunami simulation
   * @param {number} height - Tsunami wave height (m)
   */
  setupTsunamiSimulation(height) {
    this.params.waveHeight = height;
    this.params.waveSpeed = 15; // m/s scaled
    this.params.duration = 60;
    
    // Main wave
    const waveGeometry = new THREE.BoxGeometry(200, height, 20, 50, 10, 5);
    const waveMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x003344,
      transmission: 0.6,
      opacity: 0.9,
      transparent: true,
      roughness: 0.2
    });
    
    this.tsunamiWave = new THREE.Mesh(waveGeometry, waveMaterial);
    this.tsunamiWave.position.set(-110, height / 2, 0);
    this.tsunamiWave.name = 'tsunami_wave';
    this.scene.add(this.tsunamiWave);
    this.objects.set('tsunami', this.tsunamiWave);
    
    // Wave foam (top)
    const foamGeometry = new THREE.BoxGeometry(200, 1, 20, 50, 1, 5);
    const foamMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.8
    });
    
    this.waveFoam = new THREE.Mesh(foamGeometry, foamMaterial);
    this.waveFoam.position.set(-110, height, 0);
    this.waveFoam.name = 'wave_foam';
    this.scene.add(this.waveFoam);
    this.objects.set('foam', this.waveFoam);
    
    // Preceding depression
    const depressionGeometry = new THREE.BoxGeometry(200, height * 0.3, 15);
    const depressionMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x001122,
      transmission: 0.8,
      opacity: 0.7,
      transparent: true
    });
    
    this.waveDepression = new THREE.Mesh(depressionGeometry, depressionMaterial);
    this.waveDepression.position.set(-135, height * 0.15, 0);
    this.waveDepression.name = 'wave_depression';
    this.scene.add(this.waveDepression);
    this.objects.set('depression', this.waveDepression);
  }

  /**
   * Setup landslide simulation
   * @param {number} volume - Landslide volume index
   */
  setupLandslideSimulation(volume) {
    this.params.debrisVolume = volume;
    this.params.slideSpeed = 5;
    this.params.duration = 45;
    
    // Slope terrain
    const slopeGeometry = new THREE.PlaneGeometry(200, 100, 32, 16);
    const slopeMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a3728,
      roughness: 0.9
    });
    
    // Modify vertices untuk membuat lereng
    const positions = slopeGeometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      const height = (x + 100) / 200 * 50; // Lereng 50m tinggi
      positions.setZ(i, height);
    }
    slopeGeometry.computeVertexNormals();
    
    this.slopeMesh = new THREE.Mesh(slopeGeometry, slopeMaterial);
    this.slopeMesh.rotation.x = -Math.PI / 3;
    this.slopeMesh.position.y = 25;
    this.slopeMesh.name = 'landslide_slope';
    this.scene.add(this.slopeMesh);
    this.objects.set('slope', this.slopeMesh);
    
    // Debris particles
    const debrisCount = Math.floor(volume * 1000);
    const debrisGeometry = new THREE.BufferGeometry();
    const debrisPositions = new Float32Array(debrisCount * 3);
    
    for (let i = 0; i < debrisCount; i++) {
      debrisPositions[i * 3] = (Math.random() - 0.5) * 80;
      debrisPositions[i * 3 + 1] = 40 + Math.random() * 10;
      debrisPositions[i * 3 + 2] = (Math.random() - 0.5) * 40;
    }
    
    debrisGeometry.setAttribute('position', new THREE.BufferAttribute(debrisPositions, 3));
    
    const debrisMaterial = new THREE.PointsMaterial({
      color: 0x5c4033,
      size: 1.5,
      transparent: true,
      opacity: 0.9
    });
    
    this.debrisParticles = new THREE.Points(debrisGeometry, debrisMaterial);
    this.debrisParticles.name = 'debris_particles';
    this.scene.add(this.debrisParticles);
    this.objects.set('debris', this.debrisParticles);
  }

  /**
   * Main simulation loop
   */
  simulate(deltaTime) {
    if (!this.isRunning) return;

    this.time += deltaTime;
    
    switch(this.type) {
      case 'earthquake':
        this.animateEarthquake(deltaTime);
        break;
      case 'flood':
        this.animateFlood(deltaTime);
        break;
      case 'tsunami':
        this.animateTsunami(deltaTime);
        break;
      case 'landslide':
        this.animateLandslide(deltaTime);
        break;
    }
    
    // Check if simulation should end
    if (this.time >= this.params.duration) {
      this.stop();
    }
  }

  /**
   * Animate earthquake effects
   */
  animateEarthquake(deltaTime) {
    const shake = Math.sin(this.time * this.params.frequency * Math.PI * 2) * 
                  this.params.shakeMagnitude * 0.1;
    
    // Shake ground
    if (this.groundMesh) {
      this.groundMesh.position.x = shake;
      this.groundMesh.position.z = shake * 0.7;
    }
    
    // Animate seismic waves
    this.seismicWaves.forEach((wave, i) => {
      const waveTime = Math.max(0, this.time - wave.delay);
      const radius = 1 + waveTime * wave.speed * 0.5;
      
      wave.mesh.geometry.dispose();
      wave.mesh.geometry = new THREE.RingGeometry(radius, radius + 2, 32);
      wave.mesh.material.opacity = Math.max(0, 0.3 - waveTime * 0.03);
    });
    
    // Apply damage ke buildings
    this.scene.traverse((object) => {
      if (object.userData.isBuilding && object.userData.originalPosition) {
        // Shake building
        object.position.x = object.userData.originalPosition.x + shake;
        object.position.z = object.userData.originalPosition.z + shake * 0.5;
        
        // Rotation damage berdasarkan PGA
        const pga = this.intensity;
        const capacity = object.userData.seismicCapacity || 0.3;
        
        if (pga > capacity) {
          const damageRatio = (pga - capacity) / capacity;
          object.rotation.z = shake * 0.1 * damageRatio;
          object.rotation.x = shake * 0.05 * damageRatio;
          
          // Color code damage
          if (damageRatio > 0.5) {
            object.material.emissive.setHex(0xff0000);
            object.material.emissiveIntensity = 0.3;
          } else if (damageRatio > 0.2) {
            object.material.emissive.setHex(0xffaa00);
            object.material.emissiveIntensity = 0.2;
          }
        }
      }
    });
  }

  /**
   * Animate flood effects
   */
  animateFlood(deltaTime) {
    if (!this.waterMesh) return;
    
    // Rising water level
    const currentLevel = Math.min(
      this.params.waterLevel,
      this.params.baseLevel + this.params.riseRate * this.time
    );
    this.waterMesh.position.y = currentLevel;
    
    // Wave animation pada water surface
    const positions = this.waterMesh.geometry.attributes.position;
    if (positions) {
      for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i);
        const y = positions.getY(i);
        const wave = Math.sin(x * 0.1 + this.time * 2) * 0.3 + 
                     Math.cos(y * 0.1 + this.time * 1.5) * 0.2;
        positions.setZ(i, wave);
      }
      positions.needsUpdate = true;
    }
    
    // Animate particles
    if (this.particles) {
      const positions = this.particles.geometry.attributes.position.array;
      const velocities = this.particles.geometry.attributes.velocity.array;
      
      for (let i = 0; i < positions.length / 3; i++) {
        // Update positions
        positions[i * 3] += velocities[i * 3] * deltaTime;
        positions[i * 3 + 1] += velocities[i * 3 + 1] * deltaTime;
        positions[i * 3 + 2] += velocities[i * 3 + 2] * deltaTime;
        
        // Turbulensi
        positions[i * 3 + 1] += Math.sin(positions[i * 3] * 0.1 + this.time) * 0.01;
        
        // Reset particles yang keluar dari area
        if (positions[i * 3] > 100) {
          positions[i * 3] = -100;
          positions[i * 3 + 1] = currentLevel + Math.random() * 2;
        }
        if (positions[i * 3 + 1] > currentLevel + 3) {
          positions[i * 3 + 1] = currentLevel;
        }
      }
      
      this.particles.geometry.attributes.position.needsUpdate = true;
    }
    
    // Check building flooding
    this.scene.traverse((object) => {
      if (object.userData.isBuilding && object.userData.foundationHeight !== undefined) {
        if (currentLevel > object.userData.foundationHeight) {
          const floodDepth = currentLevel - object.userData.foundationHeight;
          object.userData.floodDepth = floodDepth;
          
          // Visual: lower floors flooded
          if (floodDepth > 0.5) {
            object.material.color.setHex(0x0044aa);
            object.material.emissive.setHex(0x0022aa);
            object.material.emissiveIntensity = 0.1;
          }
        }
      }
    });
  }

  /**
   * Animate tsunami wave
   */
  animateTsunami(deltaTime) {
    if (!this.tsunamiWave) return;
    
    // Move wave inland
    const newX = -110 + this.time * this.params.waveSpeed;
    this.tsunamiWave.position.x = newX;
    
    if (this.waveFoam) {
      this.waveFoam.position.x = newX;
    }
    
    if (this.waveDepression) {
      this.waveDepression.position.x = newX - 25;
    }
    
    // Wave height variation (breaking)
    if (newX > -20) {
      const breaking = Math.max(0.3, 1 - (newX + 20) / 80);
      this.tsunamiWave.scale.y = breaking;
      this.tsunamiWave.position.y = this.params.waveHeight * breaking / 2;
    }
    
    // Check building hit by wave
    this.scene.traverse((object) => {
      if (object.userData.isBuilding && !object.userData.tsunamiHit) {
        const dist = Math.abs(object.position.x - newX);
        if (dist < 15) {
          // Wave impact
          object.userData.tsunamiHit = true;
          object.userData.originalRotation = object.rotation.clone();
          
          // Apply hydrodynamic force
          const force = this.params.waveHeight * 0.05;
          object.rotation.z = Math.min(force, Math.PI / 3);
          
          // Mark damaged
          object.material.color.setHex(0x336699);
        }
      }
    });
  }

  /**
   * Animate landslide
   */
  animateLandslide(deltaTime) {
    if (!this.debrisParticles) return;
    
    const positions = this.debrisParticles.geometry.attributes.position.array;
    
    for (let i = 0; i < positions.length / 3; i++) {
      // Gravitational slide
      positions[i * 3 + 1] -= this.params.slideSpeed * deltaTime;
      positions[i * 3] += (Math.random() - 0.3) * this.params.slideSpeed * deltaTime;
      positions[i * 3 + 2] += (Math.random() - 0.5) * this.params.slideSpeed * deltaTime * 0.5;
      
      // Accumulation at bottom
      if (positions[i * 3 + 1] < 5) {
        positions[i * 3 + 1] = 5 + Math.random() * 2;
        // Spread out
        positions[i * 3] *= 1.02;
      }
    }
    
    this.debrisParticles.geometry.attributes.position.needsUpdate = true;
  }

  /**
   * Start simulation
   */
  start() {
    this.isRunning = true;
    this.time = 0;
    
    // Save original building positions
    this.scene.traverse((object) => {
      if (object.userData.isBuilding) {
        object.userData.originalPosition = object.position.clone();
        object.userData.originalRotation = object.rotation.clone();
        object.userData.tsunamiHit = false;
        object.userData.floodDepth = 0;
        
        // Reset materials
        if (object.material) {
          object.material.emissive.setHex(0x000000);
          object.material.emissiveIntensity = 0;
        }
      }
    });
  }

  /**
   * Stop simulation
   */
  stop() {
    this.isRunning = false;
    
    // Return buildings to original positions
    this.scene.traverse((object) => {
      if (object.userData.isBuilding && object.userData.originalPosition) {
        object.position.copy(object.userData.originalPosition);
        object.rotation.copy(object.userData.originalRotation);
        object.userData.tsunamiHit = false;
      }
    });
  }

  /**
   * Pause simulation
   */
  pause() {
    this.isRunning = false;
  }

  /**
   * Resume simulation
   */
  resume() {
    this.isRunning = true;
  }

  /**
   * Get damage assessment
   */
  getDamageAssessment() {
    const damaged = [];
    
    this.scene.traverse((object) => {
      if (object.userData.isBuilding) {
        let damageLevel = 'none';
        let damageScore = 0;
        
        if (this.type === 'earthquake') {
          const pga = this.intensity;
          const capacity = object.userData.seismicCapacity || 0.3;
          damageScore = Math.max(0, (pga - capacity * 0.8) / capacity);
        } else if (this.type === 'flood') {
          damageScore = object.userData.floodDepth ? 
            Math.min(object.userData.floodDepth / 3, 1) : 0;
        } else if (this.type === 'tsunami') {
          damageScore = object.userData.tsunamiHit ? 
            this.params.waveHeight / 20 : 0;
        }
        
        // Classify damage level
        if (damageScore > 0.8) damageLevel = 'collapse';
        else if (damageScore > 0.5) damageLevel = 'heavy';
        else if (damageScore > 0.2) damageLevel = 'moderate';
        else if (damageScore > 0.05) damageLevel = 'light';
        
        damaged.push({
          id: object.userData.id,
          name: object.userData.name || `Building ${object.userData.id}`,
          damageLevel,
          damageScore: parseFloat(damageScore.toFixed(3)),
          repairCost: (object.userData.value || 50000000) * damageScore * 0.6,
          affectedArea: damageScore * (object.userData.area || 100)
        });
      }
    });
    
    return damaged;
  }

  /**
   * Clear hazard objects dari scene
   */
  clearHazardObjects() {
    this.objects.forEach((obj, key) => {
      if (key === 'seismicWaves' && Array.isArray(obj)) {
        obj.forEach(w => {
          this.scene.remove(w.mesh);
          w.mesh.geometry.dispose();
          w.mesh.material.dispose();
        });
      } else if (obj instanceof THREE.Object3D) {
        this.scene.remove(obj);
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach(m => m.dispose());
          } else {
            obj.material.dispose();
          }
        }
      }
    });
    
    this.objects.clear();
    this.groundMesh = null;
    this.waterMesh = null;
    this.particles = null;
    this.tsunamiWave = null;
    this.waveFoam = null;
    this.waveDepression = null;
    this.slopeMesh = null;
    this.debrisParticles = null;
    this.seismicWaves = null;
  }

  /**
   * Reset entire engine
   */
  reset() {
    this.stop();
    this.clearHazardObjects();
    this.type = null;
    this.intensity = 0;
    this.time = 0;
  }
}

export default HazardEngine;
