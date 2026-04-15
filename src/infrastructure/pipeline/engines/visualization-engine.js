/**
 * Visualization Engine
 * Engine untuk visualisasi data dan 3D rendering
 * Menggunakan Chart.js, ECharts, dan Three.js
 * @module infrastructure/pipeline/engines/visualization-engine
 */

import { IEngine } from '../../../core/smart-ai/engine-interface.js';

/**
 * Engine untuk data visualization dan 3D rendering
 */
export class VisualizationEngine extends IEngine {
  constructor(config = {}) {
    super('VisualizationEngine', config);
    
    this.supportedTypes = ['chart', '3d', 'map', 'dashboard'];
    
    // Libraries (lazy loaded)
    this.chartJS = null;
    this.echarts = null;
    this.threeJS = null;
    
    // Default chart options
    this.defaultChartOptions = {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'top'
        }
      }
    };

    // 3D scene cache
    this.scenes = new Map();
  }

  /**
   * Inisialisasi engine
   * @returns {Promise<boolean>}
   */
  async initialize() {
    this.isInitialized = true;
    return true;
  }

  /**
   * Proses data dan generate visualisasi
   * @param {Object} input - Input data dan konfigurasi
   * @param {Object} options - Options
   * @returns {Promise<Object>}
   */
  async process(input, options = {}) {
    await this.initialize();

    const { type, data, config } = input;

    switch (type) {
      case 'chart':
        return await this.generateChart(data, config, options);
      case '3d':
        return await this.generate3D(data, config, options);
      case 'dashboard':
        return await this.generateDashboard(data, config, options);
      default:
        throw new Error(`Tipe visualisasi tidak didukung: ${type}`);
    }
  }

  /**
   * Generate chart menggunakan Chart.js
   * @param {Object} data - Data chart
   * @param {Object} config - Konfigurasi chart
   * @param {Object} options - Options
   * @returns {Promise<Object>}
   */
  async generateChart(data, config, options = {}) {
    const chartType = config.type || 'bar';
    const canvas = options.canvas || this._createCanvas(config.width, config.height);
    
    // Load Chart.js jika belum loaded
    if (!this.chartJS && typeof Chart === 'undefined') {
      await this._loadChartJS();
    }

    const ctx = canvas.getContext('2d');
    
    // Build chart configuration
    const chartConfig = this._buildChartConfig(chartType, data, config);
    
    // Create chart
    let chart;
    if (typeof Chart !== 'undefined') {
      chart = new Chart(ctx, chartConfig);
    }

    return {
      canvas,
      chart,
      type: chartType,
      data,
      toImage: () => canvas.toDataURL('image/png'),
      toBlob: () => new Promise(resolve => canvas.toBlob(resolve, 'image/png'))
    };
  }

  /**
   * Generate 3D visualization menggunakan Three.js
   * @param {Object} data - Data 3D (geometri, material, dll)
   * @param {Object} config - Konfigurasi scene
   * @param {Object} options - Options
   * @returns {Promise<Object>}
   */
  async generate3D(data, config, options = {}) {
    // Load Three.js jika belum loaded
    if (!this.threeJS) {
      await this._loadThreeJS();
    }

    const THREE = this.threeJS;
    const container = options.container || this._createContainer(config.width, config.height);
    
    // Create scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(config.backgroundColor || 0xf0f0f0);

    // Camera
    const camera = new THREE.PerspectiveCamera(
      config.fov || 75,
      (config.width || 800) / (config.height || 600),
      0.1,
      1000
    );
    camera.position.set(
      config.cameraPosition?.x || 5,
      config.cameraPosition?.y || 5,
      config.cameraPosition?.z || 5
    );
    camera.lookAt(0, 0, 0);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(config.width || 800, config.height || 600);
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 7);
    scene.add(directionalLight);

    // Add objects dari data
    if (data.objects) {
      data.objects.forEach(obj => {
        const mesh = this._create3DObject(obj, THREE);
        if (mesh) scene.add(mesh);
      });
    }

    // Controls (OrbitControls)
    let controls = null;
    if (options.enableControls !== false) {
      const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls.js');
      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
    }

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls?.update();
      renderer.render(scene, camera);
    };

    if (options.animate !== false) {
      animate();
    }

    // Store scene
    const sceneId = `scene-${Date.now()}`;
    this.scenes.set(sceneId, { scene, camera, renderer, controls });

    return {
      container,
      scene,
      camera,
      renderer,
      controls,
      sceneId,
      toImage: () => renderer.domElement.toDataURL('image/png'),
      dispose: () => {
        renderer.dispose();
        this.scenes.delete(sceneId);
      }
    };
  }

  /**
   * Generate dashboard dengan multiple charts
   * @param {Object} data - Data untuk dashboard
   * @param {Object} config - Konfigurasi layout
   * @param {Object} options - Options
   * @returns {Promise<Object>}
   */
  async generateDashboard(data, config, options = {}) {
    const container = options.container || this._createContainer(config.width, config.height);
    container.style.display = 'grid';
    container.style.gridTemplateColumns = `repeat(${config.columns || 2}, 1fr)`;
    container.style.gap = '20px';

    const charts = [];

    // Generate setiap chart
    for (const [key, chartConfig] of Object.entries(config.charts || {})) {
      const chartData = data[key] || {};
      const chartContainer = document.createElement('div');
      chartContainer.style.height = `${chartConfig.height || 300}px`;
      container.appendChild(chartContainer);

      const chart = await this.generateChart(chartData, chartConfig, {
        container: chartContainer
      });

      charts.push({
        key,
        chart,
        container: chartContainer
      });
    }

    return {
      container,
      charts,
      toImage: async () => {
        // Capture entire dashboard sebagai image
        const { default: html2canvas } = await import('html2canvas');
        const canvas = await html2canvas(container);
        return canvas.toDataURL('image/png');
      }
    };
  }

  /**
   * Create structural visualization (FEM results, etc)
   * @param {Object} structuralData - Data struktur
   * @param {Object} options - Options
   * @returns {Promise<Object>}
   */
  async visualizeStructure(structuralData, options = {}) {
    const objects = [];

    // Convert nodes dan elements ke 3D objects
    if (structuralData.nodes && structuralData.elements) {
      // Nodes sebagai spheres
      structuralData.nodes.forEach(node => {
        objects.push({
          type: 'sphere',
          position: { x: node.x, y: node.y, z: node.z || 0 },
          radius: 0.1,
          color: 0x333333
        });
      });

      // Elements sebagai lines/cylinders
      structuralData.elements.forEach(element => {
        const node1 = structuralData.nodes[element.node1];
        const node2 = structuralData.nodes[element.node2];
        
        if (node1 && node2) {
          objects.push({
            type: 'cylinder',
            start: { x: node1.x, y: node1.y, z: node1.z || 0 },
            end: { x: node2.x, y: node2.y, z: node2.z || 0 },
            radius: 0.05,
            color: this._getStressColor(element.stress)
          });
        }
      });
    }

    // Generate 3D dengan data objects
    return await this.generate3D({ objects }, {
      width: options.width || 800,
      height: options.height || 600,
      backgroundColor: 0xffffff,
      cameraPosition: { x: 10, y: 10, z: 10 }
    }, options);
  }

  // ============================================================================
  // PRIVATE METHODS - Chart Configuration
  // ============================================================================

  /**
   * Build Chart.js configuration
   * @private
   */
  _buildChartConfig(type, data, config) {
    const baseConfig = {
      type,
      data: {
        labels: data.labels || [],
        datasets: data.datasets || []
      },
      options: {
        ...this.defaultChartOptions,
        ...config.options
      }
    };

    // Type-specific configurations
    switch (type) {
      case 'bar':
        baseConfig.options.scales = {
          y: { beginAtZero: true }
        };
        break;
      
      case 'line':
        baseConfig.options.elements = {
          line: { tension: 0.4 }
        };
        break;
      
      case 'pie':
      case 'doughnut':
        baseConfig.options.plugins.legend.position = 'right';
        break;
      
      case 'scatter':
        baseConfig.options.scales = {
          x: { type: 'linear', position: 'bottom' },
          y: { type: 'linear' }
        };
        break;
    }

    return baseConfig;
  }

  // ============================================================================
  // PRIVATE METHODS - 3D Objects
  // ============================================================================

  /**
   * Create 3D object dari config
   * @private
   */
  _create3DObject(obj, THREE) {
    let geometry, material, mesh;

    material = new THREE.MeshPhongMaterial({
      color: obj.color || 0x808080
    });

    switch (obj.type) {
      case 'box':
        geometry = new THREE.BoxGeometry(
          obj.width || 1,
          obj.height || 1,
          obj.depth || 1
        );
        break;

      case 'sphere':
        geometry = new THREE.SphereGeometry(obj.radius || 0.5, 32, 32);
        break;

      case 'cylinder':
        geometry = new THREE.CylinderGeometry(
          obj.radius || 0.5,
          obj.radius || 0.5,
          obj.height || 1,
          32
        );
        break;

      case 'line':
        const material_line = new THREE.LineBasicMaterial({ color: obj.color || 0x000000 });
        const points = [
          new THREE.Vector3(obj.start.x, obj.start.y, obj.start.z || 0),
          new THREE.Vector3(obj.end.x, obj.end.y, obj.end.z || 0)
        ];
        geometry = new THREE.BufferGeometry().setFromPoints(points);
        return new THREE.Line(geometry, material_line);

      default:
        return null;
    }

    mesh = new THREE.Mesh(geometry, material);
    
    if (obj.position) {
      mesh.position.set(
        obj.position.x || 0,
        obj.position.y || 0,
        obj.position.z || 0
      );
    }

    return mesh;
  }

  /**
   * Get color berdasarkan stress level
   * @private
   */
  _getStressColor(stress) {
    if (stress === undefined) return 0x808080;
    
    // Blue (low) -> Green -> Yellow -> Red (high)
    if (stress < 0.3) return 0x0000ff;
    if (stress < 0.5) return 0x00ff00;
    if (stress < 0.7) return 0xffff00;
    return 0xff0000;
  }

  // ============================================================================
  // PRIVATE METHODS - Helpers
  // ============================================================================

  /**
   * Load Chart.js dynamically
   * @private
   */
  async _loadChartJS() {
    if (typeof Chart !== 'undefined') return;
    
    // Chart.js seharusnya sudah loaded via script tag atau bundle
    // Jika belum, load dari CDN
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  /**
   * Load Three.js dynamically
   * @private
   */
  async _loadThreeJS() {
    const THREE = await import('three');
    this.threeJS = THREE;
  }

  /**
   * Create canvas element
   * @private
   */
  _createCanvas(width = 800, height = 600) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas;
  }

  /**
   * Create container div
   * @private
   */
  _createContainer(width = 800, height = 600) {
    const div = document.createElement('div');
    div.style.width = `${width}px`;
    div.style.height = `${height}px`;
    div.style.position = 'relative';
    return div;
  }

  /**
   * Cleanup resources
   */
  async dispose() {
    // Dispose all scenes
    for (const [id, scene] of this.scenes.entries()) {
      scene.renderer.dispose();
    }
    this.scenes.clear();
    
    this.chartJS = null;
    this.threeJS = null;
    this.isInitialized = false;
  }
}

export default VisualizationEngine;
