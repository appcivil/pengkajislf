/**
 * Lighting Simulation Page - Main Application
 * Professional lighting design tool similar to DIALux Evo
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Room3D } from '../engine/scene/Room3D.js';
import { RadiosityEngine } from '../engine/lighting/RadiosityEngine.js';
import { IESLoader } from '../engine/lighting/IESLoader.js';
import { RoomBuilder } from '../ui/components/RoomBuilder.js';
import { CalculationPanel } from '../ui/components/CalculationPanel.js';
import { LuminaireTool } from '../ui/components/LuminaireTool.js';
import { supabase } from '../lib/supabase.js';

let scene, camera, renderer, controls;
let room3D, radiosityEngine;
let roomBuilder, calcPanel, luminaireTool;
let is3DView = false;
let heatmapMesh = null;
let calculationResults = null;

export async function lightingSimulationPage(params = {}) {
  const projectId = params?.id || 'demo';
  
  return `
    <div class="lighting-simulation-page">
      <div class="simulation-layout">
        <!-- Left Panel: Room Builder / 2D View -->
        <div class="panel panel-left" id="room-panel">
          <div class="panel-header">
            <h3><i class="fas fa-drafting-compass"></i> Room Layout</h3>
            <div class="view-toggle">
              <button class="toggle-btn active" data-view="2d">2D</button>
              <button class="toggle-btn" data-view="3d">3D</button>
            </div>
          </div>
          <div class="panel-content">
            <room-builder id="room-builder"></room-builder>
          </div>
        </div>

        <!-- Center: 3D View -->
        <div class="panel panel-center" id="view-panel">
          <div class="panel-header">
            <h3><i class="fas fa-cube"></i> 3D Visualization</h3>
            <div class="header-actions">
              <button id="btn-reset-view" title="Reset Camera"><i class="fas fa-compress-arrows-alt"></i></button>
              <button id="btn-toggle-heatmap" title="Toggle Heatmap"><i class="fas fa-fire"></i></button>
              <button id="btn-screenshot" title="Take Screenshot"><i class="fas fa-camera"></i></button>
            </div>
          </div>
          <div class="panel-content" id="canvas-container">
            <div id="three-canvas"></div>
            <div class="view-overlay" id="view-overlay">
              <div class="overlay-message">Draw a room in 2D view to start</div>
            </div>
          </div>
        </div>

        <!-- Right Panel: Tools -->
        <div class="panel panel-right" id="tools-panel">
          <div class="tabs">
            <button class="tab-btn active" data-tab="luminaires">💡 Luminaires</button>
            <button class="tab-btn" data-tab="calculation">📊 Calculate</button>
          </div>
          <div class="tab-content">
            <div class="tab-panel active" id="tab-luminaires">
              <luminaire-tool id="luminaire-tool"></luminaire-tool>
            </div>
            <div class="tab-panel" id="tab-calculation">
              <calculation-panel id="calc-panel"></calculation-panel>
            </div>
          </div>
        </div>
      </div>

      <!-- Floating Toolbar -->
      <div class="floating-toolbar">
        <button id="btn-add-furniture" title="Add Furniture">
          <i class="fas fa-chair"></i>
        </button>
        <button id="btn-daylight" title="Daylight Analysis">
          <i class="fas fa-sun"></i>
        </button>
        <button id="btn-save-project" title="Save Project">
          <i class="fas fa-save"></i>
        </button>
        <button id="btn-load-project" title="Load Project">
          <i class="fas fa-folder-open"></i>
        </button>
      </div>

      <!-- Report Modal -->
      <div class="modal" id="report-modal" style="display: none;">
        <div class="modal-backdrop"></div>
        <div class="modal-content">
          <div class="modal-header">
            <h3>📋 Lighting Calculation Report</h3>
            <button class="btn-close">&times;</button>
          </div>
          <div class="modal-body" id="report-content"></div>
          <div class="modal-footer">
            <button id="btn-export-docx" class="btn-primary">Export DOCX</button>
            <button id="btn-export-pdf" class="btn-secondary">Export PDF</button>
            <button class="btn-close-modal">Close</button>
          </div>
        </div>
      </div>
    </div>

    <style>
      .lighting-simulation-page {
        height: 100vh;
        overflow: hidden;
        background: #0a0f1d;
      }
      .simulation-layout {
        display: grid;
        grid-template-columns: 350px 1fr 320px;
        height: 100%;
      }
      .panel {
        display: flex;
        flex-direction: column;
        background: #0f172a;
        border-right: 1px solid rgba(59, 130, 246, 0.2);
      }
      .panel:last-child {
        border-right: none;
        border-left: 1px solid rgba(59, 130, 246, 0.2);
      }
      .panel-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 16px;
        background: linear-gradient(90deg, rgba(59, 130, 246, 0.1) 0%, transparent 100%);
        border-bottom: 1px solid rgba(59, 130, 246, 0.2);
      }
      .panel-header h3 {
        margin: 0;
        font-size: 13px;
        font-weight: 600;
        color: #f1f5f9;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .panel-header h3 i {
        color: #60a5fa;
      }
      .panel-content {
        flex: 1;
        overflow: hidden;
        position: relative;
      }
      .view-toggle {
        display: flex;
        background: rgba(30, 41, 59, 0.8);
        border-radius: 6px;
        padding: 2px;
      }
      .toggle-btn {
        padding: 4px 12px;
        border: none;
        background: transparent;
        color: #94a3b8;
        font-size: 11px;
        cursor: pointer;
        border-radius: 4px;
        transition: all 0.2s;
      }
      .toggle-btn.active {
        background: #3b82f6;
        color: white;
      }
      .header-actions {
        display: flex;
        gap: 4px;
      }
      .header-actions button {
        width: 28px;
        height: 28px;
        border: none;
        background: rgba(59, 130, 246, 0.15);
        color: #60a5fa;
        border-radius: 6px;
        cursor: pointer;
        font-size: 12px;
        transition: all 0.2s;
      }
      .header-actions button:hover {
        background: rgba(59, 130, 246, 0.3);
        color: #93c5fd;
      }
      #three-canvas {
        width: 100%;
        height: 100%;
      }
      #three-canvas canvas {
        display: block;
      }
      .view-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(15, 23, 42, 0.9);
        transition: opacity 0.3s;
      }
      .view-overlay.hidden {
        opacity: 0;
        pointer-events: none;
      }
      .overlay-message {
        text-align: center;
        color: #94a3b8;
        font-size: 14px;
      }
      .overlay-message::before {
        content: '📐';
        display: block;
        font-size: 48px;
        margin-bottom: 16px;
        opacity: 0.5;
      }
      .tabs {
        display: flex;
        background: rgba(30, 41, 59, 0.8);
        padding: 4px;
        gap: 4px;
      }
      .tab-btn {
        flex: 1;
        padding: 10px;
        border: none;
        background: transparent;
        color: #94a3b8;
        font-size: 12px;
        cursor: pointer;
        border-radius: 6px;
        transition: all 0.2s;
      }
      .tab-btn.active {
        background: rgba(59, 130, 246, 0.2);
        color: #60a5fa;
        font-weight: 500;
      }
      .tab-content {
        flex: 1;
        overflow: hidden;
      }
      .tab-panel {
        height: 100%;
        overflow-y: auto;
        display: none;
      }
      .tab-panel.active {
        display: block;
      }
      .floating-toolbar {
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        gap: 8px;
        background: rgba(15, 23, 42, 0.95);
        padding: 8px;
        border-radius: 12px;
        border: 1px solid rgba(59, 130, 246, 0.3);
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
        z-index: 100;
      }
      .floating-toolbar button {
        width: 40px;
        height: 40px;
        border: none;
        background: rgba(59, 130, 246, 0.15);
        color: #60a5fa;
        border-radius: 8px;
        cursor: pointer;
        font-size: 16px;
        transition: all 0.2s;
      }
      .floating-toolbar button:hover {
        background: rgba(59, 130, 246, 0.3);
        color: #93c5fd;
        transform: translateY(-2px);
      }
      .modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .modal-backdrop {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(4px);
      }
      .modal-content {
        position: relative;
        background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
        border: 1px solid rgba(59, 130, 246, 0.3);
        border-radius: 12px;
        width: 90%;
        max-width: 800px;
        max-height: 90vh;
        display: flex;
        flex-direction: column;
        box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
      }
      .modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px 20px;
        border-bottom: 1px solid rgba(59, 130, 246, 0.2);
      }
      .modal-header h3 {
        margin: 0;
        color: #f1f5f9;
        font-size: 16px;
      }
      .btn-close {
        background: none;
        border: none;
        color: #94a3b8;
        font-size: 24px;
        cursor: pointer;
        line-height: 1;
      }
      .modal-body {
        padding: 20px;
        overflow-y: auto;
        max-height: 60vh;
      }
      .modal-footer {
        display: flex;
        gap: 12px;
        justify-content: flex-end;
        padding: 16px 20px;
        border-top: 1px solid rgba(59, 130, 246, 0.2);
      }
      .btn-primary {
        padding: 10px 20px;
        background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
        color: white;
        border: none;
        border-radius: 6px;
        font-weight: 500;
        cursor: pointer;
      }
      .btn-secondary {
        padding: 10px 20px;
        background: rgba(59, 130, 246, 0.15);
        border: 1px solid rgba(59, 130, 246, 0.4);
        color: #60a5fa;
        border-radius: 6px;
        font-weight: 500;
        cursor: pointer;
      }
      .btn-close-modal {
        padding: 10px 20px;
        background: transparent;
        border: 1px solid rgba(148, 163, 184, 0.3);
        color: #94a3b8;
        border-radius: 6px;
        cursor: pointer;
      }
      @media (max-width: 1200px) {
        .simulation-layout {
          grid-template-columns: 300px 1fr 280px;
        }
      }
      @media (max-width: 900px) {
        .simulation-layout {
          grid-template-columns: 1fr;
          grid-template-rows: 200px 1fr 250px;
        }
        .panel-left, .panel-right {
          max-height: 250px;
        }
      }
    </style>
  `;
}

export async function afterLightingSimulationRender(params = {}) {
  const projectId = params?.id || 'demo';
  
  // Initialize Three.js
  initThreeJS();
  
  // Initialize components
  initComponents(projectId);
  
  // Setup event handlers
  setupEventHandlers();
  
  // Start animation loop
  animate();
  
  // Load project if exists
  if (projectId !== 'demo') {
    loadProject(projectId);
  }
}

function initThreeJS() {
  const container = document.getElementById('three-canvas');
  if (!container) return;
  
  // Scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0f172a);
  
  // Camera
  const width = container.clientWidth || 800;
  const height = container.clientHeight || 600;
  camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
  camera.position.set(8, 8, 8);
  
  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  container.appendChild(renderer.domElement);
  
  // Controls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.target.set(0, 1.5, 0);
  controls.maxPolarAngle = Math.PI / 2 - 0.1;
  
  // Lighting
  const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
  scene.add(ambientLight);
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
  directionalLight.position.set(5, 10, 5);
  directionalLight.castShadow = true;
  scene.add(directionalLight);
  
  // Initialize Room3D
  room3D = new Room3D();
  scene.add(room3D.room);
  
  // Initialize Radiosity Engine
  radiosityEngine = new RadiosityEngine(scene);
  
  // Handle resize
  window.addEventListener('resize', onWindowResize);
}

function initComponents(projectId) {
  // Room Builder
  roomBuilder = document.getElementById('room-builder');
  if (roomBuilder) {
    roomBuilder.addEventListener('room-completed', handleRoomCompleted);
    roomBuilder.addEventListener('switch-to-3d', () => switchTo3DView());
  }
  
  // Calculation Panel
  calcPanel = document.getElementById('calc-panel');
  if (calcPanel) {
    calcPanel.addEventListener('calculate-lighting', handleCalculateLighting);
    calcPanel.addEventListener('generate-report', handleGenerateReport);
  }
  
  // Luminaire Tool
  luminaireTool = document.getElementById('luminaire-tool');
  if (luminaireTool) {
    luminaireTool.addEventListener('add-luminaire', handleAddLuminaire);
    luminaireTool.addEventListener('update-luminaire', handleUpdateLuminaire);
    luminaireTool.addEventListener('delete-luminaire', handleDeleteLuminaire);
    luminaireTool.addEventListener('ies-loaded', handleIESLoaded);
  }
}

function setupEventHandlers() {
  // View toggle
  document.querySelectorAll('.toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      if (btn.dataset.view === '3d') {
        switchTo3DView();
      } else {
        switchTo2DView();
      }
    });
  });
  
  // Tab switching
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      
      btn.classList.add('active');
      document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
    });
  });
  
  // Header actions
  document.getElementById('btn-reset-view')?.addEventListener('click', resetCamera);
  document.getElementById('btn-toggle-heatmap')?.addEventListener('click', toggleHeatmap);
  document.getElementById('btn-screenshot')?.addEventListener('click', takeScreenshot);
  
  // Floating toolbar
  document.getElementById('btn-add-furniture')?.addEventListener('click', () => {
    addFurnitureItem('desk', { x: 0, y: 0, z: 0 }, { width: 1.4, height: 0.73, depth: 0.7 });
  });
  
  document.getElementById('btn-daylight')?.addEventListener('click', enableDaylightAnalysis);
  document.getElementById('btn-save-project')?.addEventListener('click', () => saveProject(projectId));
  document.getElementById('btn-load-project')?.addEventListener('click', () => loadProject(projectId));
  
  // Modal
  document.querySelectorAll('.btn-close, .btn-close-modal, .modal-backdrop').forEach(el => {
    el.addEventListener('click', closeModal);
  });
  
  document.getElementById('btn-export-docx')?.addEventListener('click', exportDOCX);
  document.getElementById('btn-export-pdf')?.addEventListener('click', exportPDF);
}

function handleRoomCompleted(e) {
  const { points } = e.detail;
  
  // Clear existing room
  room3D.clear();
  
  // Create new room
  room3D.createFromFloorPlan(points, 3);
  
  // Center camera
  const bounds = room3D.getBounds();
  if (bounds) {
    controls.target.set(
      (bounds.minX + bounds.maxX) / 2,
      1.5,
      (bounds.minZ + bounds.maxZ) / 2
    );
    resetCamera();
  }
  
  // Hide overlay
  document.getElementById('view-overlay')?.classList.add('hidden');
  
  // Switch to 3D view
  switchTo3DView();
  
  // Add default lighting
  addDefaultLights();
  
  // Update luminaire tool with empty list
  luminaireTool?.updateLuminaireList(room3D.luminaires);
}

function addDefaultLights() {
  const bounds = room3D.getBounds();
  if (!bounds) return;
  
  // Add 2x2 grid of lights for typical office
  const xPositions = [bounds.minX + bounds.width * 0.25, bounds.minX + bounds.width * 0.75];
  const zPositions = [bounds.minZ + bounds.length * 0.25, bounds.minZ + bounds.length * 0.75];
  
  xPositions.forEach(x => {
    zPositions.forEach(z => {
      const iesData = luminaireTool?.createDefaultIES(3600, 'lambertian');
      const luminaire = {
        id: `default-${Date.now()}-${x}-${z}`,
        name: 'LED Panel 600x600',
        type: 'led-panel',
        intensity: 3600,
        wattage: 36,
        iesData: iesData
      };
      
      const position = new THREE.Vector3(x, 2.8, z);
      room3D.addLuminaire(luminaire.iesData, position, { x: 0, y: 0, z: 0 }, {
        id: luminaire.id,
        name: luminaire.name,
        intensity: luminaire.intensity,
        wattage: luminaire.wattage
      });
    });
  });
  
  // Update luminaire list
  luminaireTool?.updateLuminaireList(room3D.luminaires);
}

async function handleCalculateLighting(e) {
  const { settings } = e.detail;
  const { onProgress } = settings;
  
  // Build patches
  const numPatches = radiosityEngine.buildPatches(
    room3D.walls,
    room3D.floor,
    room3D.ceiling,
    settings.gridSpacing
  );
  
  if (numPatches === 0) {
    alert('No room geometry available. Please draw a room first.');
    return;
  }
  
  // Set luminaires
  radiosityEngine.luminaires = room3D.luminaires.map(lum => ({
    position: lum.position.clone(),
    iesData: lum.iesData,
    intensity: lum.intensity,
    rotation: lum.rotation
  }));
  
  // Run calculation
  onProgress?.(10, 'Initializing radiosity...');
  
  let lastProgress = 10;
  const results = await radiosityEngine.calculate({
    ...settings,
    onProgress: (pct) => {
      const overallProgress = 10 + (pct * 0.4); // Radiosity takes 40% of total
      if (overallProgress - lastProgress > 5) {
        lastProgress = overallProgress;
        onProgress?.(overallProgress, `Calculating radiosity... ${pct.toFixed(0)}%`);
      }
    }
  });
  
  // Calculate grid
  onProgress?.(50, 'Generating calculation grid...');
  const bounds = room3D.getBounds();
  if (bounds) {
    await radiosityEngine.calculateGrid(bounds, (pct) => {
      const overallProgress = 50 + (pct * 0.5);
      if (overallProgress - lastProgress > 5) {
        lastProgress = overallProgress;
        onProgress?.(overallProgress, 'Calculating point illuminance...');
      }
    });
  }
  
  // Calculate power density
  const totalWattage = room3D.luminaires.reduce((sum, lum) => sum + (lum.wattage || 36), 0);
  const roomArea = bounds ? bounds.width * bounds.length : 1;
  results.powerDensity = totalWattage / roomArea;
  results.grid = radiosityEngine.calculationGrid;
  
  // Store results
  calculationResults = results;
  
  // Display results
  calcPanel?.setResults(results);
  
  // Visualize
  onProgress?.(100, 'Complete!');
  visualizeResults(results);
  
  // Save to Supabase
  await saveCalculation(projectId, settings, results);
}

function visualizeResults(results) {
  // Remove existing heatmap
  if (heatmapMesh) {
    scene.remove(heatmapMesh);
    heatmapMesh = null;
  }
  
  if (!results.grid || results.grid.length === 0) return;
  
  // Create heatmap geometry
  const points = [];
  const colors = [];
  
  const colorScale = new THREE.Color();
  
  results.grid.forEach(point => {
    const lux = point.illuminance;
    
    // Position
    points.push(point.point.x, point.point.y, point.point.z);
    
    // Color based on lux value (blue -> cyan -> green -> yellow -> orange -> red)
    const t = Math.min(lux / 500, 1);
    colorScale.setHSL(0.6 - (t * 0.6), 1, 0.5);
    colors.push(colorScale.r, colorScale.g, colorScale.b);
  });
  
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  
  const material = new THREE.PointsMaterial({
    size: 0.15,
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
    sizeAttenuation: true
  });
  
  heatmapMesh = new THREE.Points(geometry, material);
  heatmapMesh.name = 'heatmap';
  scene.add(heatmapMesh);
}

function toggleHeatmap() {
  if (heatmapMesh) {
    heatmapMesh.visible = !heatmapMesh.visible;
  }
}

function handleAddLuminaire(e) {
  const { luminaire } = e.detail;
  const bounds = room3D.getBounds();
  
  if (!bounds) {
    alert('Please create a room first');
    return;
  }
  
  // Default position at center of room
  const position = new THREE.Vector3(
    (bounds.minX + bounds.maxX) / 2,
    2.8,
    (bounds.minZ + bounds.maxZ) / 2
  );
  
  const added = room3D.addLuminaire(luminaire.iesData, position, { x: 0, y: 0, z: 0 }, {
    id: luminaire.id,
    name: luminaire.name,
    intensity: luminaire.intensity,
    wattage: luminaire.wattage
  });
  
  // Update luminaire tool
  luminaireTool?.updateLuminaireList(room3D.luminaires);
  
  // Select the new luminaire
  setTimeout(() => luminaireTool?.selectLuminaire(luminaire.id), 100);
}

function handleUpdateLuminaire(e) {
  const { id, position, rotation, ...props } = e.detail;
  
  const luminaire = room3D.luminaires.find(l => l.id === id);
  if (!luminaire) return;
  
  // Update position
  if (position) {
    luminaire.position.copy(position);
    luminaire.mesh.position.copy(position);
  }
  
  // Update rotation
  if (rotation) {
    luminaire.rotation = { ...rotation };
    luminaire.mesh.rotation.set(rotation.x, rotation.y, rotation.z);
  }
  
  // Update other properties
  if (props.intensity !== undefined) luminaire.intensity = props.intensity;
  if (props.wattage !== undefined) luminaire.wattage = props.wattage;
  if (props.name !== undefined) luminaire.name = props.name;
  
  luminaireTool?.updateLuminaireList(room3D.luminaires);
}

function handleDeleteLuminaire(e) {
  const { id } = e.detail;
  const luminaire = room3D.luminaires.find(l => l.id === id);
  if (luminaire) {
    room3D.removeLuminaire(luminaire);
    luminaireTool?.updateLuminaireList(room3D.luminaires);
  }
}

function handleIESLoaded(e) {
  const { luminaire } = e.detail;
  // IES file is ready to be placed
  console.log('[LightingSim] IES loaded:', luminaire.name);
}

function addFurnitureItem(type, position, dimensions) {
  room3D.addFurniture(type, position, dimensions);
}

function enableDaylightAnalysis() {
  // Add sunlight simulation
  const sunLight = new THREE.DirectionalLight(0xffffee, 1);
  sunLight.position.set(10, 20, 10);
  sunLight.name = 'sunlight';
  sunLight.castShadow = true;
  scene.add(sunLight);
  
  alert('Daylight simulation enabled. Adjust sun position in scene.');
}

async function saveProject(projectId) {
  try {
    const roomData = room3D.exportData();
    const projectData = {
      id: projectId,
      name: `Project ${projectId}`,
      room_data: roomData,
      updated_at: new Date().toISOString()
    };
    
    const { error } = await supabase
      .from('lighting_projects')
      .upsert(projectData);
    
    if (error) throw error;
    
    alert('Project saved successfully!');
  } catch (err) {
    console.error('Failed to save project:', err);
    alert('Failed to save project. See console for details.');
  }
}

async function loadProject(projectId) {
  try {
    const { data, error } = await supabase
      .from('lighting_projects')
      .select('*')
      .eq('id', projectId)
      .single();
    
    if (error) {
      console.log('No saved project found');
      return;
    }
    
    if (data?.room_data) {
      // Restore room
      roomBuilder?.loadRoom(data.room_data);
      handleRoomCompleted({ detail: { points: data.room_data.luminaires.map(() => ({x:0,y:0})) } });
    }
  } catch (err) {
    console.error('Failed to load project:', err);
  }
}

async function saveCalculation(projectId, settings, results) {
  try {
    const { error } = await supabase
      .from('lighting_calculations')
      .insert({
        project_id: projectId,
        settings: settings,
        results: {
          average: results.average,
          minimum: results.minimum,
          maximum: results.maximum,
          uniformityU0: results.uniformityU0,
          uniformityU1: results.uniformityU1,
          powerDensity: results.powerDensity,
          calculated_at: new Date().toISOString()
        },
        luminaires: room3D.luminaires.map(l => ({
          id: l.id,
          name: l.name,
          intensity: l.intensity,
          wattage: l.wattage,
          position: { x: l.position.x, y: l.position.y, z: l.position.z }
        })),
        created_at: new Date().toISOString()
      });
    
    if (error) throw error;
    console.log('[LightingSim] Calculation saved to Supabase');
  } catch (err) {
    console.error('Failed to save calculation:', err);
  }
}

function handleGenerateReport(e) {
  const { results } = e.detail;
  const modal = document.getElementById('report-modal');
  const content = document.getElementById('report-content');
  
  if (!modal || !content) return;
  
  const standards = {
    office: { name: 'Office / Workspace', min: 300, max: 500, u0: 0.7 },
    classroom: { name: 'Classroom', min: 250, max: 350, u0: 0.7 },
    hospital: { name: 'Hospital Ward', min: 100, max: 200, u0: 0.7 },
    retail: { name: 'Retail Shop', min: 300, max: 500, u0: 0.7 },
    industry: { name: 'Industry', min: 300, max: 750, u0: 0.6 },
    meeting: { name: 'Meeting Room', min: 300, max: 500, u0: 0.7 },
    corridor: { name: 'Corridor', min: 100, max: 150, u0: 0.5 },
    stairs: { name: 'Stairs', min: 150, max: 200, u0: 0.5 }
  };
  
  const std = standards[results.standard];
  const isCompliant = results.isCompliant;
  
  content.innerHTML = `
    <div class="report-header" style="text-align: center; margin-bottom: 24px;">
      <h2 style="margin: 0 0 8px 0; color: #f1f5f9;">Lighting Calculation Report</h2>
      <p style="margin: 0; color: #94a3b8; font-size: 12px;">
        Generated on ${new Date().toLocaleDateString('id-ID')}
      </p>
    </div>
    
    <div class="report-section" style="background: rgba(30, 41, 59, 0.5); padding: 16px; border-radius: 8px; margin-bottom: 16px;">
      <h4 style="margin: 0 0 12px 0; color: #60a5fa; font-size: 13px;">Project Information</h4>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 12px;">
        <div><span style="color: #64748b;">Standard:</span> <span style="color: #f1f5f9;">${std?.name || 'Custom'}</span></div>
        <div><span style="color: #64748b;">Compliance:</span> 
          <span style="color: ${isCompliant ? '#34d399' : '#f87171'}; font-weight: 600;">
            ${isCompliant ? '✓ COMPLIANT' : '✗ NOT COMPLIANT'}
          </span>
        </div>
      </div>
    </div>
    
    <div class="report-section" style="background: rgba(30, 41, 59, 0.5); padding: 16px; border-radius: 8px; margin-bottom: 16px;">
      <h4 style="margin: 0 0 12px 0; color: #60a5fa; font-size: 13px;">Calculation Results</h4>
      <table style="width: 100%; font-size: 12px; border-collapse: collapse;">
        <tr style="border-bottom: 1px solid rgba(59, 130, 246, 0.2);">
          <td style="padding: 8px 0; color: #94a3b8;">Average Illuminance</td>
          <td style="padding: 8px 0; text-align: right; color: #f1f5f9; font-weight: 500;">${results.average.toFixed(1)} lux</td>
          <td style="padding: 8px 0; text-align: right; color: #64748b;">Target: ${std?.min}-${std?.max} lux</td>
        </tr>
        <tr style="border-bottom: 1px solid rgba(59, 130, 246, 0.2);">
          <td style="padding: 8px 0; color: #94a3b8;">Minimum Illuminance</td>
          <td style="padding: 8px 0; text-align: right; color: #f1f5f9; font-weight: 500;">${results.minimum.toFixed(1)} lux</td>
          <td style="padding: 8px 0; text-align: right;"></td>
        </tr>
        <tr style="border-bottom: 1px solid rgba(59, 130, 246, 0.2);">
          <td style="padding: 8px 0; color: #94a3b8;">Maximum Illuminance</td>
          <td style="padding: 8px 0; text-align: right; color: #f1f5f9; font-weight: 500;">${results.maximum.toFixed(1)} lux</td>
          <td style="padding: 8px 0; text-align: right;"></td>
        </tr>
        <tr style="border-bottom: 1px solid rgba(59, 130, 246, 0.2);">
          <td style="padding: 8px 0; color: #94a3b8;">Uniformity U0 (Min/Avg)</td>
          <td style="padding: 8px 0; text-align: right; color: ${(results.uniformityU0 || 0) >= (std?.u0 || 0) ? '#34d399' : '#f87171'}; font-weight: 500;">${(results.uniformityU0 || 0).toFixed(2)}</td>
          <td style="padding: 8px 0; text-align: right; color: #64748b;">≥ ${std?.u0 || 0.7}</td>
        </tr>
        <tr style="border-bottom: 1px solid rgba(59, 130, 246, 0.2);">
          <td style="padding: 8px 0; color: #94a3b8;">Uniformity U1 (Min/Max)</td>
          <td style="padding: 8px 0; text-align: right; color: #f1f5f9; font-weight: 500;">${(results.uniformityU1 || 0).toFixed(2)}</td>
          <td style="padding: 8px 0; text-align: right;"></td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #94a3b8;">Power Density (LPD)</td>
          <td style="padding: 8px 0; text-align: right; color: #f1f5f9; font-weight: 500;">${(results.powerDensity || 0).toFixed(2)} W/m²</td>
          <td style="padding: 8px 0; text-align: right; color: #64748b;">SNI Limit: 15 W/m²</td>
        </tr>
      </table>
    </div>
    
    <div class="report-section" style="background: rgba(30, 41, 59, 0.5); padding: 16px; border-radius: 8px;">
      <h4 style="margin: 0 0 12px 0; color: #60a5fa; font-size: 13px;">Luminaire Summary</h4>
      <div style="font-size: 12px; color: #94a3b8;">
        Total luminaires: <span style="color: #f1f5f9;">${room3D?.luminaires?.length || 0}</span>
      </div>
    </div>
  `;
  
  modal.style.display = 'flex';
}

function closeModal() {
  const modal = document.getElementById('report-modal');
  if (modal) modal.style.display = 'none';
}

async function exportDOCX() {
  if (!calculationResults) {
    alert('No calculation data to export');
    return;
  }
  
  // Generate report using docx library
  const { Document, Paragraph, TextRun, Table, TableCell, TableRow, WidthType, AlignmentType } = await import('docx');
  
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          children: [new TextRun({ text: 'Lighting Calculation Report', bold: true, size: 32 })],
          alignment: AlignmentType.CENTER
        }),
        new Paragraph({
          children: [new TextRun({ text: `Generated: ${new Date().toLocaleDateString('id-ID')}`, size: 20 })],
          alignment: AlignmentType.CENTER
        }),
        new Paragraph({ text: '' }),
        new Paragraph({
          children: [new TextRun({ text: 'Calculation Results', bold: true, size: 24 })]
        }),
        new Paragraph({ text: '' }),
      ]
    }]
  });
  
  // For now, use a simple download approach
  alert('DOCX export feature requires additional implementation. Use CSV export for now.');
}

function exportPDF() {
  window.print();
}

function switchTo3DView() {
  is3DView = true;
  document.getElementById('room-panel').style.display = 'none';
  document.getElementById('view-panel').style.gridColumn = '1 / 2';
  
  // Update toggle buttons
  document.querySelectorAll('.toggle-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === '3d');
  });
}

function switchTo2DView() {
  is3DView = false;
  document.getElementById('room-panel').style.display = 'flex';
  document.getElementById('view-panel').style.gridColumn = 'auto';
  
  // Update toggle buttons
  document.querySelectorAll('.toggle-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === '2d');
  });
}

function resetCamera() {
  const bounds = room3D?.getBounds();
  if (bounds) {
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerZ = (bounds.minZ + bounds.maxZ) / 2;
    const size = Math.max(bounds.width, bounds.length);
    
    camera.position.set(
      centerX + size * 0.8,
      Math.max(size * 0.5, 4),
      centerZ + size * 0.8
    );
    controls.target.set(centerX, 1.5, centerZ);
    controls.update();
  } else {
    camera.position.set(8, 8, 8);
    controls.target.set(0, 1.5, 0);
    controls.update();
  }
}

function takeScreenshot() {
  renderer.render(scene, camera);
  const dataURL = renderer.domElement.toDataURL('image/png');
  
  const a = document.createElement('a');
  a.href = dataURL;
  a.download = `lighting-design-${new Date().toISOString().split('T')[0]}.png`;
  a.click();
}

function onWindowResize() {
  const container = document.getElementById('three-canvas');
  if (!container || !camera || !renderer) return;
  
  const width = container.clientWidth;
  const height = container.clientHeight;
  
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}

function animate() {
  requestAnimationFrame(animate);
  controls?.update();
  renderer?.render(scene, camera);
}

// Cleanup function
export function cleanup() {
  window.removeEventListener('resize', onWindowResize);
  
  if (renderer) {
    renderer.dispose();
    renderer.domElement?.remove();
  }
  
  if (room3D) {
    room3D.clear();
  }
  
  if (radiosityEngine) {
    radiosityEngine.clear();
  }
}
