/**
 * Renderer3D.js - Advanced WebGL 2.0 Rendering Engine
 * Three.js dengan post-processing, HDR, dan real-time shadows
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { SAOPass } from 'three/examples/jsm/postprocessing/SAOPass';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass';

export class Renderer3D {
  constructor(container) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a1a);
    
    // High-performance renderer dengan WebGL 2.0
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance"
    });
    
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    
    container.appendChild(this.renderer.domElement);

    // Camera setup
    this.camera = new THREE.PerspectiveCamera(
      45, 
      container.clientWidth / container.clientHeight, 
      0.1, 
      1000
    );
    this.camera.position.set(20, 20, 20);

    // Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxPolarAngle = Math.PI / 2;
    this.controls.minDistance = 5;
    this.controls.maxDistance = 100;

    // Post-processing
    this.setupPostProcess();
    
    // Lighting
    this.setupLighting();
    
    // Grid & Helpers
    this.setupHelpers();
    
    // Animation loop
    this.animate();

    // Resize handler
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(container);
  }

  setupPostProcess() {
    this.composer = new EffectComposer(this.renderer);
    
    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);

    // Ambient Occlusion (SSAO)
    const saoPass = new SAOPass(this.scene, this.camera, false, true);
    saoPass.params.saoBias = 0.5;
    saoPass.params.saoIntensity = 0.05;
    saoPass.params.saoScale = 100;
    saoPass.params.saoKernelRadius = 100;
    saoPass.params.saoMinResolution = 0;
    saoPass.enabled = true;
    this.composer.addPass(saoPass);
    this.saoPass = saoPass;

    // Bloom untuk emissive materials
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(this.container.clientWidth, this.container.clientHeight),
      0.3, // strength
      0.4, // radius
      0.85 // threshold
    );
    bloomPass.enabled = true;
    this.composer.addPass(bloomPass);
    this.bloomPass = bloomPass;

    // Output pass
    const outputPass = new OutputPass();
    this.composer.addPass(outputPass);
  }

  setupLighting() {
    // HDR Environment setup
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    pmremGenerator.compileEquirectangularShader();

    // Sun light (Directional)
    this.sunLight = new THREE.DirectionalLight(0xffffff, 2.5);
    this.sunLight.position.set(50, 100, 50);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 0.5;
    this.sunLight.shadow.camera.far = 500;
    this.sunLight.shadow.camera.left = -50;
    this.sunLight.shadow.camera.right = 50;
    this.sunLight.shadow.camera.top = 50;
    this.sunLight.shadow.camera.bottom = -50;
    this.sunLight.shadow.bias = -0.0005;
    this.scene.add(this.sunLight);

    // Ambient light
    const ambient = new THREE.AmbientLight(0x404040, 0.5);
    this.scene.add(ambient);

    // Hemisphere light untuk sky/ground
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.3);
    hemiLight.position.set(0, 20, 0);
    this.scene.add(hemiLight);
  }

  setupHelpers() {
    // Grid
    const gridHelper = new THREE.GridHelper(50, 50, 0x444444, 0x222222);
    this.scene.add(gridHelper);
    this.gridHelper = gridHelper;
    
    // Axes
    const axesHelper = new THREE.AxesHelper(5);
    this.scene.add(axesHelper);

    // Compass
    this.createCompass();
  }

  createCompass() {
    const compassDiv = document.createElement('div');
    compassDiv.style.cssText = `
      position: absolute;
      bottom: 20px;
      left: 20px;
      width: 60px;
      height: 60px;
      background: rgba(30, 30, 30, 0.8);
      backdrop-filter: blur(10px);
      border-radius: 50%;
      border: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      color: white;
      pointer-events: none;
    `;
    compassDiv.innerHTML = 'N';
    this.container.appendChild(compassDiv);
    this.compass = compassDiv;
  }

  loadHDR(url) {
    new THREE.TextureLoader().load(url, (texture) => {
      texture.mapping = THREE.EquirectangularReflectionMapping;
      this.scene.environment = texture;
      this.scene.background = texture;
    }, undefined, (err) => {
      console.warn('Failed to load HDR:', err);
    });
  }

  updateSunPosition(azimuth, elevation) {
    // Convert spherical to cartesian
    const phi = THREE.MathUtils.degToRad(90 - elevation);
    const theta = THREE.MathUtils.degToRad(azimuth);
    
    const radius = 100;
    this.sunLight.position.x = radius * Math.sin(phi) * Math.cos(theta);
    this.sunLight.position.y = radius * Math.cos(phi);
    this.sunLight.position.z = radius * Math.sin(phi) * Math.sin(theta);
    
    // Update intensity based on elevation
    const intensity = Math.max(0, Math.sin(THREE.MathUtils.degToRad(elevation)) * 2.5);
    this.sunLight.intensity = intensity;
  }

  createBuilding(floorPlans) {
    // Clear existing building
    const existing = this.scene.getObjectByName('building');
    if (existing) this.scene.remove(existing);

    const buildingGroup = new THREE.Group();
    buildingGroup.name = 'building';

    floorPlans.forEach((floor, index) => {
      const floorMesh = this.createFloorMesh(floor, index);
      buildingGroup.add(floorMesh);
    });

    this.scene.add(buildingGroup);
    return buildingGroup;
  }

  createFloorMesh(floorData, floorIndex) {
    const height = floorData.height || 3;
    const yPos = floorIndex * height;

    // Create geometry dari floor plan
    const shape = new THREE.Shape();
    if (floorData.points && floorData.points.length > 0) {
      shape.moveTo(floorData.points[0].x, floorData.points[0].y);
      for (let i = 1; i < floorData.points.length; i++) {
        shape.lineTo(floorData.points[i].x, floorData.points[i].y);
      }
      shape.closePath();
    }

    const extrudeSettings = {
      steps: 1,
      depth: height,
      bevelEnabled: false
    };

    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geometry.translate(0, 0, yPos);
    geometry.rotateX(-Math.PI / 2);

    const material = new THREE.MeshStandardMaterial({
      color: floorData.color || 0xcccccc,
      roughness: 0.7,
      metalness: 0.1
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = { floorIndex, floorData };

    return mesh;
  }

  setPostProcessing(enabled) {
    this.composer.passes.forEach(pass => {
      if (pass !== this.composer.passes[0]) { // Keep render pass
        pass.enabled = enabled;
      }
    });
  }

  toggleShadows(enabled) {
    this.sunLight.castShadow = enabled;
    this.scene.traverse(child => {
      if (child.isMesh) {
        child.castShadow = enabled;
        child.receiveShadow = enabled;
      }
    });
  }

  resize() {
    if (!this.container) return;
    const { clientWidth, clientHeight } = this.container;
    this.camera.aspect = clientWidth / clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(clientWidth, clientHeight);
    this.composer.setSize(clientWidth, clientHeight);
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    this.controls.update();
    this.composer.render();
  }

  dispose() {
    this.resizeObserver.disconnect();
    this.renderer.dispose();
    this.composer.dispose();
    this.scene.traverse(object => {
      if (object.geometry) object.geometry.dispose();
      if (object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach(m => m.dispose());
        } else {
          object.material.dispose();
        }
      }
    });
  }
}

export default { Renderer3D };
