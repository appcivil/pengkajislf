// ============================================================
// ARCHITECTURAL INSPECTION - Clean Architecture Implementation
// ============================================================

import { BaseInspection } from './BaseInspection.js';
import { InspectionWidgets } from '../../components/inspection/inspection-widgets.js';
import { showSuccess, showError, showInfo } from '../../components/toast.js';

export class ArchitecturalInspection extends BaseInspection {
  constructor() {
    super({
      moduleName: 'architectural',
      phaseCode: 'PHASE 01A',
      title: 'Pemeriksaan Aspek Arsitektur',
      badge: 'PP 16/2021',
      icon: 'building',
      accentColor: 'var(--brand-400)',
      description: 'Evaluasi aspek arsitektur bangunan berdasarkan PP Nomor 16 Tahun 2021. Meliputi kesesuaian tapak, intensitas bangunan, dan persyaratan arsitektural.',
      tables: ['architectural_assessments', 'building_intensity_data', 'site_plan_analysis']
    });
  }

  async loadData() {
    const projectId = this._state.projectId;
    const data = await this.repository.getArchitecturalData(projectId);
    this._setData('assessment', data || {});
  }

  getTabs() {
    return [
      { id: 'dashboard', icon: 'chart-pie', label: 'DASHBOARD' },
      { id: 'site', icon: 'map-marked-alt', label: 'TAPAK' },
      { id: 'intensity', icon: 'ruler-combined', label: 'INTENSITAS' },
      { id: 'access', icon: 'road', label: 'AKSES' },
      { id: 'utilities', icon: 'water', label: 'UTILITAS' },
      { id: 'compliance', icon: 'check-circle', label: 'COMPLIANCE' }
    ];
  }

  renderTabContent(tabId) {
    switch (tabId) {
      case 'dashboard': return this.renderDashboardTab();
      case 'site': return this.renderSiteTab();
      case 'intensity': return this.renderIntensityTab();
      case 'access': return this.renderAccessTab();
      case 'utilities': return this.renderUtilitiesTab();
      case 'compliance': return this.renderComplianceTab();
      default: return this.renderDashboardTab();
    }
  }

  renderDashboardTab() {
    const assessment = this._getData('assessment') || {};
    const { projectData } = this._state;

    const stats = [
      { icon: 'ruler', value: this._formatNumber(projectData?.luas_bangunan, 0), label: 'Luas Bangunan', sublabel: 'm²', accentColor: 'var(--brand-400)' },
      { icon: 'layer-group', value: projectData?.jumlah_lantai || '-', label: 'Jumlah Lantai', sublabel: 'Lantai', accentColor: 'var(--success-400)' },
      { icon: 'percentage', value: assessment.kdb || '-', label: 'KDB', sublabel: '%', accentColor: 'var(--warning-400)' },
      { icon: 'percentage', value: assessment.klb || '-', label: 'KLB', sublabel: '%', accentColor: 'var(--warning-400)' }
    ];

    return `
      <div id="architectural-tab-dashboard" class="architectural-tab-content">
        ${InspectionWidgets.renderStatsGrid(stats)}
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
          ${InspectionWidgets.renderSectionCard({
            title: 'Data Bangunan',
            icon: 'building',
            accentColor: 'var(--brand-400)',
            content: `
              <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;">
                <div>
                  <label style="font-size: 0.7rem; color: var(--text-tertiary);">Fungsi Bangunan</label>
                  <div style="font-size: 1rem; font-weight: 600; color: white;">${projectData?.fungsi_bangunan || '-'}</div>
                </div>
                <div>
                  <label style="font-size: 0.7rem; color: var(--text-tertiary);">Type Bangunan</label>
                  <div style="font-size: 1rem; font-weight: 600; color: white;">${projectData?.type_bangunan || '-'}</div>
                </div>
                <div>
                  <label style="font-size: 0.7rem; color: var(--text-tertiary);">Ketinggian</label>
                  <div style="font-size: 1rem; font-weight: 600; color: white;">${assessment.building_height ? assessment.building_height + ' m' : '-'}</div>
                </div>
                <div>
                  <label style="font-size: 0.7rem; color: var(--text-tertiary);">Basement</label>
                  <div style="font-size: 1rem; font-weight: 600; color: white;">${assessment.has_basement ? 'Ya' : 'Tidak'}</div>
                </div>
              </div>
            `
          })}
          
          ${InspectionWidgets.renderSectionCard({
            title: 'Status Compliance',
            icon: 'check-circle',
            accentColor: 'var(--success-400)',
            content: `
              <div style="text-align: center;">
                ${InspectionWidgets.renderScoreIndicator({ score: assessment.compliance_score || 0, label: 'Compliance Score', size: 'md' })}
              </div>
            `
          })}
        </div>
      </div>
    `;
  }

  renderSiteTab() {
    return InspectionWidgets.renderSectionCard({
      title: 'Analisis Tapak',
      icon: 'map-marked-alt',
      accentColor: 'var(--brand-400)',
      content: InspectionWidgets.renderEmptyState({
        icon: 'map',
        title: 'Data Tapak',
        message: 'Analisis kesesuaian rencana tapak akan ditampilkan di sini.'
      })
    });
  }

  renderIntensityTab() {
    const assessment = this._getData('assessment') || {};

    return InspectionWidgets.renderSectionCard({
      title: 'Intensitas Bangunan',
      icon: 'ruler-combined',
      accentColor: 'var(--warning-400)',
      content: `
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;">
          <div class="card-quartz" style="padding: 20px; text-align: center;">
            <div style="font-size: 0.8rem; color: var(--text-tertiary); margin-bottom: 8px;">KDB (Koefisien Dasar Bangunan)</div>
            <div style="font-size: 2rem; font-weight: 800; color: var(--brand-400);">${assessment.kdb || '-'}%</div>
            <div style="font-size: 0.75rem; color: var(--text-tertiary);">Max: ${assessment.kdb_max || 60}%</div>
          </div>
          <div class="card-quartz" style="padding: 20px; text-align: center;">
            <div style="font-size: 0.8rem; color: var(--text-tertiary); margin-bottom: 8px;">KLB (Koefisien Lantai Bangunan)</div>
            <div style="font-size: 2rem; font-weight: 800; color: var(--warning-400);">${assessment.klb || '-'}%</div>
            <div style="font-size: 0.75rem; color: var(--text-tertiary);">Max: ${assessment.klb_max || 'N/A'}</div>
          </div>
          <div class="card-quartz" style="padding: 20px; text-align: center;">
            <div style="font-size: 0.8rem; color: var(--text-tertiary); margin-bottom: 8px;">KDH (Koefisien Dasar Hijau)</div>
            <div style="font-size: 2rem; font-weight: 800; color: var(--success-400);">${assessment.kdh || '-'}%</div>
            <div style="font-size: 0.75rem; color: var(--text-tertiary);">Min: ${assessment.kdh_min || 10}%</div>
          </div>
        </div>
      `
    });
  }

  renderAccessTab() {
    return InspectionWidgets.renderSectionCard({
      title: 'Akses dan Parkir',
      icon: 'road',
      accentColor: 'var(--brand-400)',
      content: InspectionWidgets.renderEmptyState({
        icon: 'car',
        title: 'Data Akses',
        message: 'Evaluasi akses jalan, parkir, dan pedestrian akan ditampilkan di sini.'
      })
    });
  }

  renderUtilitiesTab() {
    return InspectionWidgets.renderSectionCard({
      title: 'Utilitas Bangunan',
      icon: 'water',
      accentColor: 'var(--brand-400)',
      content: InspectionWidgets.renderEmptyState({
        icon: 'plug',
        title: 'Data Utilitas',
        message: 'Evaluasi utilitas bangunan (listrik, air, telekomunikasi) akan ditampilkan di sini.'
      })
    });
  }

  renderComplianceTab() {
    const assessment = this._getData('assessment') || {};
    const score = assessment.compliance_score || 0;

    return InspectionWidgets.renderSectionCard({
      title: 'Compliance Check',
      icon: 'check-circle',
      accentColor: 'var(--success-400)',
      content: `
        <div style="text-align: center; margin-bottom: 24px;">
          ${InspectionWidgets.renderScoreIndicator({ score, label: 'Overall Compliance', size: 'lg' })}
        </div>
        <p style="font-size: 0.85rem; color: var(--text-secondary); text-align: center;">
          ${score >= 80 ? '✓ Bangunan memenuhi persyaratan arsitektur' : 
            score >= 60 ? '⚠ Sebagian persyaratan belum terpenuhi' : 
            '✗ Bangunan tidak memenuhi persyaratan'}
        </p>
      `
    });
  }

  afterRender() {
    super.afterRender();
    if (typeof window !== 'undefined') {
      window._inspectionControllers = window._inspectionControllers || {};
      window._inspectionControllers['architectural'] = this;
    }
  }
}

let architecturalInspectionInstance = null;

export async function architecturalInspectionPage(params = {}) {
  if (architecturalInspectionInstance) architecturalInspectionInstance.destroy();
  architecturalInspectionInstance = new ArchitecturalInspection();
  return await architecturalInspectionInstance.initialize(params);
}

export function afterArchitecturalInspectionRender() {
  if (architecturalInspectionInstance) architecturalInspectionInstance.afterRender();
}
