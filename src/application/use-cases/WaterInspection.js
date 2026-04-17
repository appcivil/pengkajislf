// ============================================================
// WATER SYSTEM INSPECTION - Clean Architecture Implementation
// ============================================================

import { BaseInspection } from './BaseInspection.js';
import { InspectionWidgets } from '../../components/inspection/inspection-widgets.js';
import { showSuccess, showError, showInfo } from '../../components/toast.js';

export class WaterInspection extends BaseInspection {
  constructor() {
    super({
      moduleName: 'water',
      phaseCode: 'PHASE 04A',
      title: 'Pemeriksaan Sistem Air Bersih',
      badge: 'SNI 8153',
      icon: 'tint',
      accentColor: 'var(--brand-400)',
      description: 'Evaluasi sistem air bersih berdasarkan SNI 8153:2015 dan Permenkes. Meliputi kebutuhan air, sumber, distribusi, dan penyimpanan.',
      tables: ['water_system_assessments', 'water_storage', 'water_pumps', 'water_distribution']
    });

    this.WATER_REQUIREMENTS = {
      office: 50, residential: 120, hospital: 300,
      school: 50, hotel: 200, mall: 10, // per m²
      industrial: 100, worship: 20
    };
  }

  async loadData() {
    const projectId = this._state.projectId;
    const data = await this.repository.getWaterSystemData(projectId);
    
    const storage = await this.repository.query('water_storage', { project_id: projectId });
    const pumps = await this.repository.query('water_pumps', { project_id: projectId });

    this._setData('assessment', data || {});
    this._setData('storage', storage || []);
    this._setData('pumps', pumps || []);
  }

  getTabs() {
    const data = this._getData.bind(this);
    return [
      { id: 'dashboard', icon: 'chart-pie', label: 'DASHBOARD' },
      { id: 'requirement', icon: 'calculator', label: 'KEBUTUHAN' },
      { id: 'storage', icon: 'database', label: `TANGKI (${data('storage')?.length || 0})` },
      { id: 'pumps', icon: 'cog', label: `POMPA (${data('pumps')?.length || 0})` },
      { id: 'distribution', icon: 'network-wired', label: 'DISTRIBUSI' },
      { id: 'compliance', icon: 'check-circle', label: 'COMPLIANCE' }
    ];
  }

  renderTabContent(tabId) {
    switch (tabId) {
      case 'dashboard': return this.renderDashboardTab();
      case 'requirement': return this.renderRequirementTab();
      case 'storage': return this.renderStorageTab();
      case 'pumps': return this.renderPumpsTab();
      case 'distribution': return this.renderDistributionTab();
      case 'compliance': return this.renderComplianceTab();
      default: return this.renderDashboardTab();
    }
  }

  renderDashboardTab() {
    const assessment = this._getData('assessment') || {};
    const storage = this._getData('storage') || [];
    const pumps = this._getData('pumps') || [];

    const totalCapacity = storage.reduce((sum, s) => sum + (s.capacity || 0), 0);
    const workingPumps = pumps.filter(p => p.status === 'WORKING').length;

    const stats = [
      { icon: 'tint', value: this._formatNumber(assessment.daily_requirement, 0), label: 'Kebutuhan/Hari', sublabel: 'Liter', accentColor: 'var(--brand-400)' },
      { icon: 'database', value: this._formatNumber(totalCapacity, 0), label: 'Kapasitas Tangki', sublabel: 'Liter', accentColor: 'var(--success-400)' },
      { icon: 'cog', value: pumps.length, label: 'Jumlah Pompa', sublabel: `${workingPumps} Aktif`, accentColor: 'var(--warning-400)' },
      { icon: 'percentage', value: assessment.storage_percentage || '-', label: 'Storage Ratio', sublabel: '% dari kebutuhan', accentColor: 'var(--success-400)' }
    ];

    return `
      <div id="water-tab-dashboard" class="water-tab-content">
        ${InspectionWidgets.renderStatsGrid(stats)}
        
        ${InspectionWidgets.renderSectionCard({
          title: 'Sumber Air',
          icon: 'water',
          accentColor: 'var(--brand-400)',
          content: `
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;">
              ${['PDAM', 'Sumur Bor', 'Air Hujan'].map(source => `
                <div class="card-quartz" style="padding: 16px; text-align: center; ${assessment.water_source === source ? 'border: 2px solid var(--brand-400);' : ''}">
                  <i class="fas fa-${source === 'PDAM' ? 'faucet' : source === 'Sumur Bor' ? 'arrow-down' : 'cloud-rain'}" style="font-size: 1.5rem; color: var(--brand-400); margin-bottom: 8px;"></i>
                  <div style="font-size: 0.9rem; font-weight: 600; color: white;">${source}</div>
                  ${assessment.water_source === source ? '<div style="font-size: 0.75rem; color: var(--success-400);">✓ Digunakan</div>' : ''}
                </div>
              `).join('')}
            </div>
          `
        })}
      </div>
    `;
  }

  renderRequirementTab() {
    const assessment = this._getData('assessment') || {};
    const { projectData } = this._state;
    const buildingType = projectData?.type_bangunan || 'office';
    const requirement = this.WATER_REQUIREMENTS[buildingType] || 50;

    return InspectionWidgets.renderSectionCard({
      title: 'Kalkulasi Kebutuhan Air',
      icon: 'calculator',
      accentColor: 'var(--brand-400)',
      content: `
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 20px;">
          <div class="card-quartz" style="padding: 20px;">
            <div style="font-size: 0.8rem; color: var(--text-tertiary); margin-bottom: 8px;">Standar Kebutuhan</div>
            <div style="font-size: 1.8rem; font-weight: 800; color: var(--brand-400);">${requirement}</div>
            <div style="font-size: 0.75rem; color: var(--text-tertiary);">Liter/orang/hari (${buildingType})</div>
          </div>
          <div class="card-quartz" style="padding: 20px;">
            <div style="font-size: 0.8rem; color: var(--text-tertiary); margin-bottom: 8px;">Total Kebutuhan/Hari</div>
            <div style="font-size: 1.8rem; font-weight: 800; color: var(--success-400);">${this._formatNumber(assessment.daily_requirement, 0)}</div>
            <div style="font-size: 0.75rem; color: var(--text-tertiary);">Liter</div>
          </div>
        </div>
        <p style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.6;">
          Perhitungan berdasarkan SNI 8153:2015 tentang Tata Cara Perencanaan Sistem Plambing.
        </p>
      `
    });
  }

  renderStorageTab() {
    const storage = this._getData('storage') || [];
    
    return `
      <div id="water-tab-storage" class="water-tab-content">
        ${InspectionWidgets.renderActionBar([
          { icon: 'plus', label: 'Tambah Tangki', variant: 'primary', onclick: `window._inspectionControllers['water'].showAddStorageModal()` }
        ])}
        
        ${storage.length > 0
          ? InspectionWidgets.renderDataTable({
              headers: ['ID', 'Lokasi', 'Kapasitas (L)', 'Material', 'Ketinggian', 'Status'],
              rows: storage.map(s => [
                s.tank_code || s.id?.slice(0, 8),
                s.location || '-',
                this._formatNumber(s.capacity, 0),
                s.material || '-',
                s.elevation ? s.elevation + ' m' : '-',
                s.status === 'ACTIVE' ? '<span style="color: var(--success-400);">Aktif</span>' : '<span style="color: var(--warning-400);">Non-Aktif</span>'
              ]),
              align: ['left', 'left', 'right', 'left', 'center', 'center']
            })
          : InspectionWidgets.renderEmptyState({
              icon: 'database',
              title: 'Belum Ada Data Tangki',
              message: 'Tambahkan data tangki penyimpanan air.',
              actionLabel: 'Tambah Tangki',
              actionOnClick: `window._inspectionControllers['water'].showAddStorageModal()`
            })
        }
      </div>
    `;
  }

  renderPumpsTab() {
    const pumps = this._getData('pumps') || [];
    
    return `
      <div id="water-tab-pumps" class="water-tab-content">
        ${InspectionWidgets.renderActionBar([
          { icon: 'plus', label: 'Tambah Pompa', variant: 'primary', onclick: `window._inspectionControllers['water'].showAddPumpModal()` }
        ])}
        
        ${pumps.length > 0
          ? InspectionWidgets.renderDataTable({
              headers: ['ID', 'Tipe', 'Kapasitas (L/m)', 'Head (m)', 'Daya (kW)', 'Status'],
              rows: pumps.map(p => [
                p.pump_code || p.id?.slice(0, 8),
                p.pump_type || '-',
                this._formatNumber(p.capacity, 1),
                p.head || '-',
                p.power || '-',
                p.status === 'WORKING' ? '<span style="color: var(--success-400);">✓ Working</span>' : 
                  p.status === 'STANDBY' ? '<span style="color: var(--warning-400);">⏸ Standby</span>' : 
                  '<span style="color: var(--danger-400);">✗ Failed</span>'
              ]),
              align: ['left', 'left', 'right', 'right', 'right', 'center']
            })
          : InspectionWidgets.renderEmptyState({
              icon: 'cog',
              title: 'Belum Ada Data Pompa',
              message: 'Tambahkan data pompa air.',
              actionLabel: 'Tambah Pompa',
              actionOnClick: `window._inspectionControllers['water'].showAddPumpModal()`
            })
        }
      </div>
    `;
  }

  renderDistributionTab() {
    return InspectionWidgets.renderSectionCard({
      title: 'Sistem Distribusi',
      icon: 'network-wired',
      accentColor: 'var(--brand-400)',
      content: InspectionWidgets.renderEmptyState({
        icon: 'project-diagram',
        title: 'Data Distribusi',
        message: 'Evaluasi sistem distribusi air bersih akan ditampilkan di sini.'
      })
    });
  }

  renderComplianceTab() {
    const assessment = this._getData('assessment') || {};
    const score = assessment.compliance_score || 0;

    return InspectionWidgets.renderSectionCard({
      title: 'Compliance Check SNI 8153',
      icon: 'check-circle',
      accentColor: 'var(--success-400)',
      content: `
        <div style="text-align: center; margin-bottom: 20px;">
          ${InspectionWidgets.renderScoreIndicator({ score, label: 'Water System Compliance', size: 'lg' })}
        </div>
        <p style="font-size: 0.85rem; color: var(--text-secondary); text-align: center;">
          ${score >= 80 ? '✓ Sistem air bersih memenuhi standar SNI 8153' : 
            score >= 60 ? '⚠ Sebagian sistem perlu perbaikan' : 
            '✗ Sistem tidak memenuhi standar'}
        </p>
      `
    });
  }

  showAddStorageModal() { showInfo('Modal tambah tangki akan ditampilkan'); }
  showAddPumpModal() { showInfo('Modal tambah pompa akan ditampilkan'); }

  afterRender() {
    super.afterRender();
    if (typeof window !== 'undefined') {
      window._inspectionControllers = window._inspectionControllers || {};
      window._inspectionControllers['water'] = this;
    }
  }
}

let waterInspectionInstance = null;

export async function waterInspectionPage(params = {}) {
  if (waterInspectionInstance) waterInspectionInstance.destroy();
  waterInspectionInstance = new WaterInspection();
  return await waterInspectionInstance.initialize(params);
}

export function afterWaterInspectionRender() {
  if (waterInspectionInstance) waterInspectionInstance.afterRender();
}
