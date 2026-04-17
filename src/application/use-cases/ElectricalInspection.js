// ============================================================
// ELECTRICAL INSPECTION - Clean Architecture Implementation
// Refactor dari electrical-inspection.js (2300+ baris → ~400 baris)
// ============================================================

import { BaseInspection } from './BaseInspection.js';
import { InspectionWidgets } from '../../components/inspection/inspection-widgets.js';
import { showSuccess, showError, showInfo } from '../../components/toast.js';

// Import libraries spesifik electrical
import {
  calculatePower,
  calculateActualLoading,
  calculatePhaseImbalance,
  calculateVoltageDrop,
  analyzeThermalData,
  estimateShortCircuitCurrent,
  verifyBreakingCapacity,
  generateComplianceCheck
} from '../../lib/electrical-calculator.js';

import {
  generateSingleLineDiagram,
  generateLoadingIndicator,
  generatePanelStatusCard
} from '../../lib/electrical-visualization.js';

import {
  MEASUREMENT_POINT_TYPES,
  PUIL_DATABASE
} from '../../lib/electrical-constants.js';

/**
 * Kelas ElectricalInspection mengextends BaseInspection.
 * Menangani pemeriksaan sistem kelistrikan berdasarkan PUIL 2020.
 * 
 * @extends BaseInspection
 */
export class ElectricalInspection extends BaseInspection {
  constructor() {
    super({
      moduleName: 'electrical',
      phaseCode: 'PHASE 02C',
      title: 'Pemeriksaan Sistem Kelistrikan',
      badge: 'PUIL 2020',
      icon: 'bolt',
      accentColor: 'var(--brand-400)',
      description: 'Evaluasi sistem kelistrikan bangunan berdasarkan Pedoman Umum Instalasi Listrik (PUIL) 2020, SNI, dan standar IEC. Meliputi analisis beban, proteksi, dan koordinasi.',
      tables: ['electrical_panels', 'electrical_measurements', 'electrical_thermal_images']
    });

    // PUIL Standards
    this.VOLTAGE_STANDARDS = {
      lv: { nominal: 230, tolerance: 0.05 }, // 5% tolerance
      mv: { nominal: 20000, tolerance: 0.1 }
    };

    this.LOADING_LIMITS = {
      normal: 80,
      warning: 90,
      critical: 100
    };
  }

  // ============================================================
  // DATA LOADING
  // ============================================================

  /**
   * Load data spesifik modul electrical.
   * @override
   */
  async loadData() {
    const projectId = this._state.projectId;

    // Load panels dengan measurements dan thermal images
    const panels = await this.repository.getElectricalPanels(projectId);
    
    // Load additional data untuk setiap panel
    const panelsWithData = await Promise.all(
      panels.map(async (panel) => {
        const [measurements, thermalImages] = await Promise.all([
          this.repository.getElectricalMeasurements(panel.id, { limit: 100 }),
          this.repository.getElectricalThermalImages(panel.id)
        ]);
        return { ...panel, measurements, thermalImages };
      })
    );

    this._setData('panels', panelsWithData);
    this._setData('selectedPanel', panelsWithData.length > 0 ? panelsWithData[0] : null);
  }

  // ============================================================
  // TAB CONFIGURATION
  // ============================================================

  /**
   * Definisi tabs untuk modul electrical.
   * @override
   * @returns {Array<TabConfig>}
   */
  getTabs() {
    const panels = this._getData('panels') || [];
    const measurements = panels.flatMap(p => p.measurements || []);
    const thermalImages = panels.flatMap(p => p.thermalImages || []);

    return [
      { id: 'dashboard', icon: 'chart-pie', label: 'DASHBOARD' },
      { id: 'panels', icon: 'server', label: `PANEL (${panels.length})` },
      { id: 'measurements', icon: 'wave-square', label: `UKUR (${measurements.length})` },
      { id: 'thermal', icon: 'fire', label: `THERMAL (${thermalImages.length})` },
      { id: 'analysis', icon: 'microscope', label: 'ANALISIS' },
      { id: 'protection', icon: 'shield-alt', label: 'PROTEKSI' },
      { id: 'compliance', icon: 'check-circle', label: 'COMPLIANCE' },
      { id: 'simulation', icon: 'flask', label: 'SIMULASI' },
      { id: 'reports', icon: 'file-pdf', label: 'LAPORAN' }
    ];
  }

  // ============================================================
  // TAB RENDERING
  // ============================================================

  /**
   * Render content berdasarkan tab aktif.
   * @override
   * @param {string} tabId - ID tab yang aktif
   * @returns {string} HTML content
   */
  renderTabContent(tabId) {
    switch (tabId) {
      case 'dashboard': return this.renderDashboardTab();
      case 'panels': return this.renderPanelsTab();
      case 'measurements': return this.renderMeasurementsTab();
      case 'thermal': return this.renderThermalTab();
      case 'analysis': return this.renderAnalysisTab();
      case 'protection': return this.renderProtectionTab();
      case 'compliance': return this.renderComplianceTab();
      case 'simulation': return this.renderSimulationTab();
      case 'reports': return this.renderReportsTab();
      default: return this.renderDashboardTab();
    }
  }

  // ============================================================
  // DASHBOARD TAB
  // ============================================================

  renderDashboardTab() {
    const panels = this._getData('panels') || [];
    const selectedPanel = this._getData('selectedPanel');

    const totalPanels = panels.length;
    const safePanels = panels.filter(p => this.getPanelLoading(p) < this.LOADING_LIMITS.normal).length;
    const warningPanels = panels.filter(p => {
      const loading = this.getPanelLoading(p);
      return loading >= this.LOADING_LIMITS.normal && loading < this.LOADING_LIMITS.warning;
    }).length;
    const criticalPanels = panels.filter(p => this.getPanelLoading(p) >= this.LOADING_LIMITS.critical).length;

    const totalMeasurements = panels.reduce((sum, p) => sum + (p.measurements?.length || 0), 0);
    const totalThermalImages = panels.reduce((sum, p) => sum + (p.thermalImages?.length || 0), 0);

    const stats = [
      { 
        icon: 'server', 
        value: totalPanels, 
        label: 'Total Panel', 
        sublabel: `${safePanels} Aman`, 
        accentColor: 'var(--brand-400)' 
      },
      { 
        icon: 'exclamation-triangle', 
        value: warningPanels, 
        label: 'Panel Warning', 
        sublabel: `> ${this.LOADING_LIMITS.normal}% Loading`, 
        accentColor: warningPanels > 0 ? 'var(--warning-400)' : 'var(--success-400)' 
      },
      { 
        icon: 'times-circle', 
        value: criticalPanels, 
        label: 'Panel Kritis', 
        sublabel: `Overload`, 
        accentColor: criticalPanels > 0 ? 'var(--danger-400)' : 'var(--success-400)' 
      },
      { 
        icon: 'wave-square', 
        value: totalMeasurements, 
        label: 'Pengukuran', 
        sublabel: `${totalThermalImages} Thermal`, 
        accentColor: 'var(--success-400)' 
      }
    ];

    return `
      <div id="electrical-tab-dashboard" class="electrical-tab-content">
        ${InspectionWidgets.renderStatsGrid(stats)}
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
          ${InspectionWidgets.renderSectionCard({
            title: 'Panel Overview',
            icon: 'server',
            accentColor: 'var(--brand-400)',
            content: this.renderPanelsOverview(panels)
          })}
          
          ${selectedPanel ? InspectionWidgets.renderSectionCard({
            title: `Panel Aktif: ${selectedPanel.name}`,
            icon: 'bolt',
            accentColor: 'var(--warning-400)',
            content: this.renderSelectedPanelSummary(selectedPanel)
          }) : ''}
        </div>
      </div>
    `;
  }

  getPanelLoading(panel) {
    if (!panel.measurements || panel.measurements.length === 0) return 0;
    const latest = panel.measurements[0];
    if (!panel.mcb_rating || panel.mcb_rating === 0) return 0;
    return ((latest.current || 0) / panel.mcb_rating * 100);
  }

  renderPanelsOverview(panels) {
    if (panels.length === 0) {
      return InspectionWidgets.renderEmptyState({
        icon: 'server',
        title: 'Belum Ada Panel',
        message: 'Tambahkan data panel listrik untuk memulai evaluasi.',
        actionLabel: 'Tambah Panel',
        actionOnClick: `window._inspectionControllers['electrical'].showAddPanelModal()`
      });
    }

    const rows = panels.map(panel => {
      const loading = this.getPanelLoading(panel);
      const status = loading > this.LOADING_LIMITS.critical ? 'Kritis' : 
                     loading > this.LOADING_LIMITS.normal ? 'Warning' : 'Aman';
      const statusColor = loading > this.LOADING_LIMITS.critical ? 'var(--danger-400)' : 
                          loading > this.LOADING_LIMITS.normal ? 'var(--warning-400)' : 'var(--success-400)';

      return [
        panel.name || '-',
        panel.panel_type || '-',
        `${panel.mcb_rating || 0}A`,
        `${loading.toFixed(1)}%`,
        `<span style="color: ${statusColor}; font-weight: 600;">${status}</span>`
      ];
    });

    return InspectionWidgets.renderDataTable({
      headers: ['Nama Panel', 'Tipe', 'MCB Rating', 'Loading', 'Status'],
      rows,
      align: ['left', 'left', 'center', 'right', 'center']
    });
  }

  renderSelectedPanelSummary(panel) {
    const loading = this.getPanelLoading(panel);
    const latestMeasurement = panel.measurements?.[0];

    return `
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 16px;">
        <div style="padding: 16px; background: hsla(220, 20%, 15%, 0.5); border-radius: 10px;">
          <div style="font-size: 0.7rem; color: var(--text-tertiary); margin-bottom: 4px;">Tegangan (V)</div>
          <div style="font-size: 1.5rem; font-weight: 700; color: white;">${latestMeasurement?.voltage || '-'}</div>
        </div>
        <div style="padding: 16px; background: hsla(220, 20%, 15%, 0.5); border-radius: 10px;">
          <div style="font-size: 0.7rem; color: var(--text-tertiary); margin-bottom: 4px;">Arus (A)</div>
          <div style="font-size: 1.5rem; font-weight: 700; color: white;">${latestMeasurement?.current || '-'}</div>
        </div>
        <div style="padding: 16px; background: hsla(220, 20%, 15%, 0.5); border-radius: 10px;">
          <div style="font-size: 0.7rem; color: var(--text-tertiary); margin-bottom: 4px;">Power (kW)</div>
          <div style="font-size: 1.5rem; font-weight: 700; color: white;">${latestMeasurement?.power ? (latestMeasurement.power / 1000).toFixed(2) : '-'}</div>
        </div>
        <div style="padding: 16px; background: ${loading > this.LOADING_LIMITS.critical ? 'hsla(0, 80%, 60%, 0.15)' : loading > this.LOADING_LIMITS.normal ? 'hsla(35, 100%, 50%, 0.15)' : 'hsla(160, 100%, 45%, 0.15)'}; border-radius: 10px;">
          <div style="font-size: 0.7rem; color: var(--text-tertiary); margin-bottom: 4px;">Loading</div>
          <div style="font-size: 1.5rem; font-weight: 700; color: ${loading > this.LOADING_LIMITS.critical ? 'var(--danger-400)' : loading > this.LOADING_LIMITS.normal ? 'var(--warning-400)' : 'var(--success-400)'};">${loading.toFixed(1)}%</div>
        </div>
      </div>
      
      ${InspectionWidgets.renderActionBar([
        { icon: 'edit', label: 'Edit Panel', variant: 'secondary', onclick: `window._inspectionControllers['electrical'].editPanel('${panel.id}')` },
        { icon: 'plus', label: 'Tambah Pengukuran', variant: 'primary', onclick: `window._inspectionControllers['electrical'].showAddMeasurementModal('${panel.id}')` }
      ])}
    `;
  }

  // ============================================================
  // PANELS TAB
  // ============================================================

  renderPanelsTab() {
    const panels = this._getData('panels') || [];
    const selectedPanel = this._getData('selectedPanel');

    return `
      <div id="electrical-tab-panels" class="electrical-tab-content">
        ${InspectionWidgets.renderActionBar([
          { icon: 'plus', label: 'Tambah Panel', variant: 'primary', onclick: `window._inspectionControllers['electrical'].showAddPanelModal()` },
          { icon: 'sitemap', label: 'Single Line Diagram', variant: 'secondary', onclick: `window._inspectionControllers['electrical'].showSLD()` }
        ])}
        
        <div style="display: grid; grid-template-columns: 300px 1fr; gap: 20px;">
          <div class="card-quartz" style="padding: 16px; max-height: 600px; overflow-y: auto;">
            <h5 style="font-family: 'Outfit', sans-serif; font-size: 0.85rem; color: var(--text-primary); margin-bottom: 12px;">Daftar Panel</h5>
            ${panels.length > 0 
              ? panels.map(panel => {
                  const loading = this.getPanelLoading(panel);
                  const statusColor = loading > this.LOADING_LIMITS.critical ? 'var(--danger-400)' : 
                                      loading > this.LOADING_LIMITS.normal ? 'var(--warning-400)' : 'var(--success-400)';
                  
                  return `
                    <div onclick="window._inspectionControllers['electrical'].selectPanel('${panel.id}')" 
                         class="panel-list-item ${selectedPanel?.id === panel.id ? 'active' : ''}"
                         style="padding: 12px; border-radius: 10px; cursor: pointer; margin-bottom: 8px; transition: all 0.2s; ${selectedPanel?.id === panel.id ? 'background: var(--gradient-brand);' : 'background: hsla(220, 20%, 20%, 0.3);'}">
                      <div style="font-weight: 600; font-size: 0.85rem; color: ${selectedPanel?.id === panel.id ? 'white' : 'var(--text-primary)'};">${panel.name}</div>
                      <div style="font-size: 0.75rem; color: ${selectedPanel?.id === panel.id ? 'rgba(255,255,255,0.8)' : 'var(--text-tertiary)'};">
                        ${panel.panel_type} • ${panel.mcb_rating}A • <span style="color: ${selectedPanel?.id === panel.id ? 'white' : statusColor};">${loading.toFixed(0)}%</span>
                      </div>
                    </div>
                  `;
                }).join('')
              : InspectionWidgets.renderEmptyState({ icon: 'server', title: 'Tidak Ada Panel', message: 'Tambahkan panel pertama Anda.' })
            }
          </div>
          
          <div>
            ${selectedPanel 
              ? this.renderPanelDetail(selectedPanel)
              : InspectionWidgets.renderEmptyState({ icon: 'mouse-pointer', title: 'Pilih Panel', message: 'Klik panel di sidebar untuk melihat detail.' })
            }
          </div>
        </div>
      </div>
    `;
  }

  renderPanelDetail(panel) {
    return InspectionWidgets.renderSectionCard({
      title: `Detail Panel: ${panel.name}`,
      icon: 'server',
      accentColor: 'var(--brand-400)',
      content: `
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 20px;">
          <div>
            <label style="font-size: 0.7rem; color: var(--text-tertiary); text-transform: uppercase;">Nama Panel</label>
            <div style="font-size: 1rem; font-weight: 600; color: white;">${panel.name || '-'}</div>
          </div>
          <div>
            <label style="font-size: 0.7rem; color: var(--text-tertiary); text-transform: uppercase;">Tipe Panel</label>
            <div style="font-size: 1rem; font-weight: 600; color: white;">${panel.panel_type || '-'}</div>
          </div>
          <div>
            <label style="font-size: 0.7rem; color: var(--text-tertiary); text-transform: uppercase;">Lokasi</label>
            <div style="font-size: 1rem; font-weight: 600; color: white;">${panel.location || '-'}</div>
          </div>
          <div>
            <label style="font-size: 0.7rem; color: var(--text-tertiary); text-transform: uppercase;">MCB Rating</label>
            <div style="font-size: 1rem; font-weight: 600; color: white;">${panel.mcb_rating || '-'} A</div>
          </div>
        </div>
        
        ${InspectionWidgets.renderActionBar([
          { icon: 'edit', label: 'Edit Panel', variant: 'secondary', onclick: `window._inspectionControllers['electrical'].editPanel('${panel.id}')` },
          { icon: 'trash', label: 'Hapus', variant: 'danger', onclick: `window._inspectionControllers['electrical'].deletePanel('${panel.id}')` }
        ])}
      `
    });
  }

  // ============================================================
  // MEASUREMENTS TAB
  // ============================================================

  renderMeasurementsTab() {
    const panels = this._getData('panels') || [];
    const allMeasurements = panels.flatMap(p => 
      (p.measurements || []).map(m => ({ ...m, panelName: p.name }))
    ).sort((a, b) => new Date(b.measured_at || b.timestamp) - new Date(a.measured_at || a.timestamp));

    return `
      <div id="electrical-tab-measurements" class="electrical-tab-content">
        ${InspectionWidgets.renderActionBar([
          { icon: 'plus', label: 'Tambah Pengukuran', variant: 'primary', onclick: `window._inspectionControllers['electrical'].showAddMeasurementModal()` },
          { icon: 'file-import', label: 'Import Data', variant: 'secondary', onclick: `window._inspectionControllers['electrical'].showImportModal()` },
          { icon: 'file-export', label: 'Export CSV', variant: 'ghost', onclick: `window._inspectionControllers['electrical'].exportMeasurements()` }
        ])}
        
        ${allMeasurements.length > 0
          ? InspectionWidgets.renderDataTable({
              headers: ['Waktu', 'Panel', 'Tegangan (V)', 'Arus (A)', 'Daya (kW)', 'Cos φ'],
              rows: allMeasurements.slice(0, 50).map(m => [
                this._formatDate(m.measured_at || m.timestamp),
                m.panelName,
                this._formatNumber(m.voltage, 1),
                this._formatNumber(m.current, 2),
                this._formatNumber(m.power ? m.power / 1000 : 0, 3),
                this._formatNumber(m.power_factor, 2)
              ]),
              align: ['left', 'left', 'right', 'right', 'right', 'center']
            })
          : InspectionWidgets.renderEmptyState({
              icon: 'wave-square',
              title: 'Belum Ada Pengukuran',
              message: 'Tambahkan data pengukuran tegangan, arus, dan daya.',
              actionLabel: 'Tambah Pengukuran',
              actionOnClick: `window._inspectionControllers['electrical'].showAddMeasurementModal()`
            })
        }
      </div>
    `;
  }

  // ============================================================
  // THERMAL TAB
  // ============================================================

  renderThermalTab() {
    const panels = this._getData('panels') || [];
    const allThermal = panels.flatMap(p => 
      (p.thermalImages || []).map(t => ({ ...t, panelName: p.name }))
    ).sort((a, b) => new Date(b.captured_at) - new Date(a.captured_at));

    return `
      <div id="electrical-tab-thermal" class="electrical-tab-content">
        ${InspectionWidgets.renderActionBar([
          { icon: 'plus', label: 'Upload Thermal', variant: 'primary', onclick: `window._inspectionControllers['electrical'].showUploadThermalModal()` },
          { icon: 'thermometer-full', label: 'Analisis', variant: 'secondary', onclick: `window._inspectionControllers['electrical'].analyzeThermal()` }
        ])}
        
        ${allThermal.length > 0
          ? `<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 16px;">
              ${allThermal.map(t => `
                <div class="card-quartz" style="padding: 12px;">
                  <div style="aspect-ratio: 4/3; background: hsla(220, 20%, 15%, 0.5); border-radius: 8px; margin-bottom: 12px; display: flex; align-items: center; justify-content: center; color: var(--text-tertiary);">
                    <i class="fas fa-image" style="font-size: 2rem;"></i>
                  </div>
                  <div style="font-size: 0.85rem; font-weight: 600; color: var(--text-primary);">${t.panelName}</div>
                  <div style="font-size: 0.75rem; color: var(--text-tertiary);">${this._formatDate(t.captured_at)}</div>
                  <div style="font-size: 0.75rem; color: ${t.max_temp > 70 ? 'var(--danger-400)' : t.max_temp > 50 ? 'var(--warning-400)' : 'var(--success-400)'}; margin-top: 4px;">
                    Max: ${t.max_temp}°C
                  </div>
                </div>
              `).join('')}
            </div>`
          : InspectionWidgets.renderEmptyState({
              icon: 'fire',
              title: 'Belum Ada Data Thermal',
              message: 'Upload gambar thermal untuk analisis hotspot.',
              actionLabel: 'Upload Thermal',
              actionOnClick: `window._inspectionControllers['electrical'].showUploadThermalModal()`
            })
        }
      </div>
    `;
  }

  // ============================================================
  // ANALYSIS TAB (Placeholder)
  // ============================================================

  renderAnalysisTab() {
    return InspectionWidgets.renderSectionCard({
      title: 'Analisis Sistem Kelistrikan',
      icon: 'microscope',
      accentColor: 'var(--brand-400)',
      content: `
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;">
          <div class="card-quartz" style="padding: 20px;">
            <div style="font-size: 0.85rem; font-weight: 600; color: var(--text-primary); margin-bottom: 8px;">Load Profile Analysis</div>
            <div style="font-size: 0.75rem; color: var(--text-tertiary);">Analisis profil beban per panel akan ditampilkan di sini.</div>
          </div>
          <div class="card-quartz" style="padding: 20px;">
            <div style="font-size: 0.85rem; font-weight: 600; color: var(--text-primary); margin-bottom: 8px;">Phase Imbalance</div>
            <div style="font-size: 0.75rem; color: var(--text-tertiary);">Analisis ketidakseimbangan fase akan ditampilkan di sini.</div>
          </div>
          <div class="card-quartz" style="padding: 20px;">
            <div style="font-size: 0.85rem; font-weight: 600; color: var(--text-primary); margin-bottom: 8px;">Harmonic Analysis</div>
            <div style="font-size: 0.75rem; color: var(--text-tertiary);">Analisis harmonisa akan ditampilkan di sini.</div>
          </div>
          <div class="card-quartz" style="padding: 20px;">
            <div style="font-size: 0.85rem; font-weight: 600; color: var(--text-primary); margin-bottom: 8px;">Voltage Drop</div>
            <div style="font-size: 0.75rem; color: var(--text-tertiary);">Analisis jatuh tegangan akan ditampilkan di sini.</div>
          </div>
        </div>
      `
    });
  }

  // ============================================================
  // PROTECTION TAB (Placeholder)
  // ============================================================

  renderProtectionTab() {
    return InspectionWidgets.renderSectionCard({
      title: 'Analisis Proteksi & Koordinasi',
      icon: 'shield-alt',
      accentColor: 'var(--warning-400)',
      content: `
        <p style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.6;">
          Analisis koordinasi proteksi MCB, MCCB, dan relay akan ditampilkan di sini.
          Termasuk verifikasi breaking capacity dan selectivity analysis.
        </p>
      `
    });
  }

  // ============================================================
  // COMPLIANCE TAB
  // ============================================================

  renderComplianceTab() {
    const panels = this._getData('panels') || [];
    const complianceChecks = this.runComplianceChecks(panels);

    return `
      <div id="electrical-tab-compliance" class="electrical-tab-content">
        ${InspectionWidgets.renderScoreIndicator({ 
          score: complianceChecks.overallScore, 
          label: 'Skor Compliance PUIL 2020', 
          size: 'lg' 
        })}
        
        <div style="margin-top: 24px;">
          ${InspectionWidgets.renderSectionCard({
            title: 'Checklist Compliance',
            icon: 'check-circle',
            accentColor: 'var(--success-400)',
            content: `
              <div style="display: flex; flex-direction: column; gap: 12px;">
                ${complianceChecks.checks.map(check => `
                  <div style="display: flex; align-items: center; gap: 12px; padding: 12px; background: hsla(220, 20%, 15%, 0.5); border-radius: 10px;">
                    <div style="width: 24px; height: 24px; border-radius: 50%; background: ${check.passed ? 'hsla(160, 100%, 45%, 0.2)' : 'hsla(0, 80%, 60%, 0.2)'}; display: flex; align-items: center; justify-content: center; color: ${check.passed ? 'var(--success-400)' : 'var(--danger-400)'};">
                      <i class="fas fa-${check.passed ? 'check' : 'times'}"></i>
                    </div>
                    <div style="flex: 1;">
                      <div style="font-size: 0.85rem; font-weight: 600; color: var(--text-primary);">${check.name}</div>
                      <div style="font-size: 0.75rem; color: var(--text-tertiary);">${check.description}</div>
                    </div>
                  </div>
                `).join('')}
              </div>
            `
          })}
        </div>
      </div>
    `;
  }

  runComplianceChecks(panels) {
    const checks = [];
    
    // Check 1: All panels have MCB rating
    checks.push({
      name: 'MCB Rating Terdefinisi',
      description: 'Semua panel memiliki rating MCB yang terdefinisi',
      passed: panels.every(p => p.mcb_rating && p.mcb_rating > 0)
    });

    // Check 2: No panels over 100% loading
    checks.push({
      name: 'Loading Aman',
      description: 'Tidak ada panel dengan loading > 100%',
      passed: panels.every(p => this.getPanelLoading(p) < 100)
    });

    // Check 3: Measurements within voltage tolerance
    const allMeasurements = panels.flatMap(p => p.measurements || []);
    const voltageOk = allMeasurements.every(m => {
      if (!m.voltage) return true;
      const nominal = this.VOLTAGE_STANDARDS.lv.nominal;
      const tolerance = this.VOLTAGE_STANDARDS.lv.tolerance;
      return m.voltage >= nominal * (1 - tolerance) && m.voltage <= nominal * (1 + tolerance);
    });
    checks.push({
      name: 'Tegangan Dalam Toleransi',
      description: 'Tegangan dalam batas ±5% dari 230V',
      passed: voltageOk
    });

    const passedCount = checks.filter(c => c.passed).length;
    const overallScore = Math.round((passedCount / checks.length) * 100);

    return { checks, overallScore };
  }

  // ============================================================
  // SIMULATION TAB (Placeholder)
  // ============================================================

  renderSimulationTab() {
    return InspectionWidgets.renderSectionCard({
      title: 'Simulasi "What-If"',
      icon: 'flask',
      accentColor: 'var(--brand-400)',
      content: `
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;">
          <div class="card-quartz" style="padding: 20px; text-align: center; cursor: pointer;" onclick="showInfo('Simulasi upgrade MCB')">
            <i class="fas fa-arrow-up" style="font-size: 2rem; color: var(--brand-400); margin-bottom: 12px;"></i>
            <div style="font-size: 0.9rem; font-weight: 600; color: var(--text-primary);">MCB Upgrade</div>
            <div style="font-size: 0.75rem; color: var(--text-tertiary);">Simulasi peningkatan rating MCB</div>
          </div>
          <div class="card-quartz" style="padding: 20px; text-align: center; cursor: pointer;" onclick="showInfo('Simulasi pemindahan beban')">
            <i class="fas fa-exchange-alt" style="font-size: 2rem; color: var(--success-400); margin-bottom: 12px;"></i>
            <div style="font-size: 0.9rem; font-weight: 600; color: var(--text-primary);">Load Transfer</div>
            <div style="font-size: 0.75rem; color: var(--text-tertiary);">Simulasi pemindahan beban antar panel</div>
          </div>
          <div class="card-quartz" style="padding: 20px; text-align: center; cursor: pointer;" onclick="showInfo('Simulasi sizing kabel')">
            <i class="fas fa-ruler" style="font-size: 2rem; color: var(--warning-400); margin-bottom: 12px;"></i>
            <div style="font-size: 0.9rem; font-weight: 600; color: var(--text-primary);">Cable Sizing</div>
            <div style="font-size: 0.75rem; color: var(--text-tertiary);">Kalkulasi ukuran kabel</div>
          </div>
        </div>
      `
    });
  }

  // ============================================================
  // REPORTS TAB
  // ============================================================

  renderReportsTab() {
    return InspectionWidgets.renderSectionCard({
      title: 'Laporan Teknis',
      icon: 'file-pdf',
      accentColor: 'var(--brand-400)',
      content: `
        <p style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.6; margin-bottom: 20px;">
          Generate laporan teknis sistem kelistrikan dalam format PDF atau Excel.
          Laporan mencakup data pengukuran, analisis loading, dan compliance check.
        </p>
        
        ${InspectionWidgets.renderActionBar([
          { icon: 'file-pdf', label: 'Generate PDF Report', variant: 'primary', onclick: `window._inspectionControllers['electrical'].generateReport('pdf')` },
          { icon: 'file-excel', label: 'Export Excel', variant: 'secondary', onclick: `window._inspectionControllers['electrical'].generateReport('excel')` },
          { icon: 'file-word', label: 'Export Word', variant: 'ghost', onclick: `window._inspectionControllers['electrical'].generateReport('word')` }
        ])}
      `
    });
  }

  // ============================================================
  // EVENT HANDLERS
  // ============================================================

  selectPanel(panelId) {
    const panels = this._getData('panels') || [];
    const panel = panels.find(p => p.id === panelId);
    if (panel) {
      this._setData('selectedPanel', panel);
      this.switchTab('panels');
    }
  }

  showAddPanelModal() {
    showInfo('Modal tambah panel akan ditampilkan');
  }

  showAddMeasurementModal(panelId = null) {
    showInfo(`Modal tambah pengukuran ${panelId || ''} akan ditampilkan`);
  }

  showUploadThermalModal() {
    showInfo('Modal upload thermal akan ditampilkan');
  }

  showSLD() {
    showInfo('Single Line Diagram viewer akan ditampilkan');
  }

  showImportModal() {
    showInfo('Modal import data akan ditampilkan');
  }

  editPanel(panelId) {
    showInfo(`Edit panel ${panelId}`);
  }

  async deletePanel(panelId) {
    if (confirm('Apakah Anda yakin ingin menghapus panel ini? Semua pengukuran terkait akan ikut terhapus.')) {
      try {
        await this.repository.delete('electrical_panels', panelId);
        showSuccess('Panel berhasil dihapus');
        await this.loadData();
        this.switchTab('panels');
      } catch (error) {
        showError('Gagal menghapus panel');
      }
    }
  }

  analyzeThermal() {
    showInfo('Analisis thermal dalam pengembangan');
  }

  exportMeasurements() {
    showInfo('Export measurements dalam pengembangan');
  }

  generateReport(format) {
    showInfo(`Generate ${format.toUpperCase()} report - Dalam pengembangan`);
  }

  // ============================================================
  // AFTER RENDER
  // ============================================================

  afterRender() {
    super.afterRender();
    if (typeof window !== 'undefined') {
      window._inspectionControllers = window._inspectionControllers || {};
      window._inspectionControllers['electrical'] = this;
    }
  }
}

// ============================================================
// PAGE EXPORTS (Legacy Compatibility)
// ============================================================

let electricalInspectionInstance = null;

/**
 * Entry point untuk router (legacy compatibility).
 */
export async function electricalInspectionPage(params = {}) {
  if (electricalInspectionInstance) {
    electricalInspectionInstance.destroy();
  }

  electricalInspectionInstance = new ElectricalInspection();
  return await electricalInspectionInstance.initialize(params);
}

/**
 * After render hook (legacy compatibility).
 */
export function afterElectricalInspectionRender() {
  if (electricalInspectionInstance) {
    electricalInspectionInstance.afterRender();
  }
}
