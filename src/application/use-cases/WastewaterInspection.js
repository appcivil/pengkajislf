// ============================================================
// WASTEWATER INSPECTION - Clean Architecture Implementation
// ============================================================

import { BaseInspection } from './BaseInspection.js';
import { InspectionWidgets } from '../../components/inspection/inspection-widgets.js';
import { showSuccess, showError, showInfo } from '../../components/toast.js';

export class WastewaterInspection extends BaseInspection {
  constructor() {
    super({
      moduleName: 'wastewater',
      phaseCode: 'PHASE 04B',
      title: 'Pemeriksaan Sistem Air Kotor',
      badge: 'SNI 8153',
      icon: 'water',
      accentColor: 'var(--warning-400)',
      description: 'Evaluasi sistem pembuangan air kotor berdasarkan SNI 8153:2015. Meliputi sewer, ventilasi, dan pengolahan air limbah.',
      tables: ['wastewater_assessments', 'sewer_lines', 'stp_units', 'grease_traps']
    });
  }

  async loadData() {
    const projectId = this._state.projectId;
    const data = await this.repository.getWastewaterData(projectId);
    
    const sewers = await this.repository.query('sewer_lines', { project_id: projectId });
    const stp = await this.repository.query('stp_units', { project_id: projectId });

    this._setData('assessment', data || {});
    this._setData('sewers', sewers || []);
    this._setData('stp', stp?.[0] || null);
  }

  getTabs() {
    const data = this._getData.bind(this);
    return [
      { id: 'dashboard', icon: 'chart-pie', label: 'DASHBOARD' },
      { id: 'sewer', icon: 'project-diagram', label: `SEWER (${data('sewers')?.length || 0})` },
      { id: 'stp', icon: 'industry', label: 'STP/IPAL' },
      { id: 'grease', icon: 'oil-can', label: 'GREASE TRAP' },
      { id: 'compliance', icon: 'check-circle', label: 'COMPLIANCE' }
    ];
  }

  renderTabContent(tabId) {
    switch (tabId) {
      case 'dashboard': return this.renderDashboardTab();
      case 'sewer': return this.renderSewerTab();
      case 'stp': return this.renderStpTab();
      case 'grease': return this.renderGreaseTab();
      case 'compliance': return this.renderComplianceTab();
      default: return this.renderDashboardTab();
    }
  }

  renderDashboardTab() {
    const assessment = this._getData('assessment') || {};
    const sewers = this._getData('sewers') || [];
    const stp = this._getData('stp');

    const stats = [
      { icon: 'water', value: this._formatNumber(assessment.daily_discharge, 0), label: 'Debit/Hari', sublabel: 'Liter', accentColor: 'var(--warning-400)' },
      { icon: 'project-diagram', value: sewers.length, label: 'Jalur Sewer', sublabel: 'Lines', accentColor: 'var(--brand-400)' },
      { icon: 'industry', value: stp ? '1' : '0', label: 'STP/IPAL', sublabel: stp?.status || 'N/A', accentColor: stp ? 'var(--success-400)' : 'var(--danger-400)' },
      { icon: 'percentage', value: assessment.treatment_percentage || '-', label: 'Treatment Rate', sublabel: '%', accentColor: 'var(--success-400)' }
    ];

    return `
      <div id="wastewater-tab-dashboard" class="wastewater-tab-content">
        ${InspectionWidgets.renderStatsGrid(stats)}
        
        ${InspectionWidgets.renderSectionCard({
          title: 'Jenis Sistem',
          icon: 'info-circle',
          accentColor: 'var(--brand-400)',
          content: `
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;">
              ${['Separate', 'Combined'].map(type => `
                <div class="card-quartz" style="padding: 20px; text-align: center; ${assessment.system_type === type ? 'border: 2px solid var(--brand-400);' : ''}">
                  <i class="fas fa-${type === 'Separate' ? 'code-branch' : 'arrows-alt'}" style="font-size: 1.8rem; color: var(--brand-400); margin-bottom: 8px;"></i>
                  <div style="font-size: 1rem; font-weight: 600; color: white;">${type} System</div>
                  <div style="font-size: 0.75rem; color: var(--text-tertiary);">
                    ${type === 'Separate' ? 'Air kotor & hujan terpisah' : 'Air kotor & hujan bersama'}
                  </div>
                </div>
              `).join('')}
            </div>
          `
        })}
      </div>
    `;
  }

  renderSewerTab() {
    const sewers = this._getData('sewers') || [];
    
    return `
      <div id="wastewater-tab-sewer" class="wastewater-tab-content">
        ${InspectionWidgets.renderActionBar([
          { icon: 'plus', label: 'Tambah Sewer', variant: 'primary', onclick: `window._inspectionControllers['wastewater'].showAddSewerModal()` }
        ])}
        
        ${sewers.length > 0
          ? InspectionWidgets.renderDataTable({
              headers: ['ID', 'Lokasi', 'Diameter (mm)', 'Material', 'Kemiringan (%)', 'Status'],
              rows: sewers.map(s => [
                s.line_code || s.id?.slice(0, 8),
                s.location || '-',
                s.diameter || '-',
                s.material || '-',
                s.slope_percent ? s.slope_percent.toFixed(2) + '%' : '-',
                s.status === 'ACTIVE' ? '<span style="color: var(--success-400);">Aktif</span>' : '<span style="color: var(--warning-400);">Non-Aktif</span>'
              ]),
              align: ['left', 'left', 'right', 'left', 'right', 'center']
            })
          : InspectionWidgets.renderEmptyState({
              icon: 'project-diagram',
              title: 'Belum Ada Data Sewer',
              message: 'Tambahkan data jalur pembuangan air kotor.',
              actionLabel: 'Tambah Sewer',
              actionOnClick: `window._inspectionControllers['wastewater'].showAddSewerModal()`
            })
        }
      </div>
    `;
  }

  renderStpTab() {
    const stp = this._getData('stp');
    
    return `
      <div id="wastewater-tab-stp" class="wastewater-tab-content">
        ${InspectionWidgets.renderActionBar([
          { icon: 'plus', label: stp ? 'Edit STP' : 'Tambah STP', variant: 'primary', onclick: `window._inspectionControllers['wastewater'].showStpModal()` }
        ])}
        
        ${stp
          ? InspectionWidgets.renderSectionCard({
              title: 'Data STP/IPAL',
              icon: 'industry',
              accentColor: 'var(--brand-400)',
              content: `
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;">
                  <div>
                    <label style="font-size: 0.7rem; color: var(--text-tertiary);">Kapasitas</label>
                    <div style="font-size: 1.2rem; font-weight: 600; color: white;">${this._formatNumber(stp.capacity, 0)} L/hari</div>
                  </div>
                  <div>
                    <label style="font-size: 0.7rem; color: var(--text-tertiary);">Tipe Treatment</label>
                    <div style="font-size: 1.2rem; font-weight: 600; color: white;">${stp.treatment_type || '-'}</div>
                  </div>
                  <div>
                    <label style="font-size: 0.7rem; color: var(--text-tertiary);">Efisiensi</label>
                    <div style="font-size: 1.2rem; font-weight: 600; color: white;">${stp.efficiency || '-'}%</div>
                  </div>
                  <div>
                    <label style="font-size: 0.7rem; color: var(--text-tertiary);">Status</label>
                    <div style="font-size: 1.2rem; font-weight: 600; color: ${stp.status === 'ACTIVE' ? 'var(--success-400)' : 'var(--warning-400)'};">${stp.status || 'N/A'}</div>
                  </div>
                </div>
              `
            })
          : InspectionWidgets.renderEmptyState({
              icon: 'industry',
              title: 'Belum Ada Data STP',
              message: 'Tambahkan data Sewage Treatment Plant (STP) atau IPAL.',
              actionLabel: 'Tambah STP',
              actionOnClick: `window._inspectionControllers['wastewater'].showStpModal()`
            })
        }
      </div>
    `;
  }

  renderGreaseTab() {
    return InspectionWidgets.renderSectionCard({
      title: 'Grease Trap',
      icon: 'oil-can',
      accentColor: 'var(--warning-400)',
      content: InspectionWidgets.renderEmptyState({
        icon: 'utensils',
        title: 'Data Grease Trap',
        message: 'Data grease trap untuk dapur/restoran akan ditampilkan di sini.'
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
          ${InspectionWidgets.renderScoreIndicator({ score, label: 'Wastewater System Compliance', size: 'lg' })}
        </div>
        <p style="font-size: 0.85rem; color: var(--text-secondary); text-align: center;">
          ${score >= 80 ? '✓ Sistem air kotor memenuhi standar' : 
            score >= 60 ? '⚠ Sebagian sistem perlu perbaikan' : 
            '✗ Sistem tidak memenuhi standar'}
        </p>
      `
    });
  }

  showAddSewerModal() { showInfo('Modal tambah sewer akan ditampilkan'); }
  showStpModal() { showInfo('Modal STP akan ditampilkan'); }

  afterRender() {
    super.afterRender();
    if (typeof window !== 'undefined') {
      window._inspectionControllers = window._inspectionControllers || {};
      window._inspectionControllers['wastewater'] = this;
    }
  }
}

let wastewaterInspectionInstance = null;

export async function wastewaterInspectionPage(params = {}) {
  if (wastewaterInspectionInstance) wastewaterInspectionInstance.destroy();
  wastewaterInspectionInstance = new WastewaterInspection();
  return await wastewaterInspectionInstance.initialize(params);
}

export function afterWastewaterInspectionRender() {
  if (wastewaterInspectionInstance) wastewaterInspectionInstance.afterRender();
}
