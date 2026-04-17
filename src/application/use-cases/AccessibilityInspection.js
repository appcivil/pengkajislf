// ============================================================
// ACCESSIBILITY INSPECTION - Clean Architecture Implementation
// ============================================================

import { BaseInspection } from './BaseInspection.js';
import { InspectionWidgets } from '../../components/inspection/inspection-widgets.js';
import { showSuccess, showError, showInfo } from '../../components/toast.js';

export class AccessibilityInspection extends BaseInspection {
  constructor() {
    super({
      moduleName: 'accessibility',
      phaseCode: 'PHASE 02B',
      title: 'Pemeriksaan Aspek Kemudahan',
      badge: 'SNI 8131:2015',
      icon: 'wheelchair',
      accentColor: 'var(--success-400)',
      description: 'Evaluasi aspek kemudahan (accessibility) berdasarkan SNI 8131:2015. Meliputi ramp, tangga, pintu, koridor, dan fasilitas difabel.',
      tables: ['accessibility_assessments', 'accessibility_ramps', 'accessibility_doors', 'accessibility_elevators']
    });

    this.STANDARDS = {
      ramp_max_slope: 8.33, // %
      ramp_min_width: 1200, // mm
      door_min_width: 900, // mm
      corridor_min_width: 1800, // mm
      handrail_height: { min: 800, max: 900 } // mm
    };
  }

  async loadData() {
    const projectId = this._state.projectId;
    const data = await this.repository.getAccessibilityData(projectId);
    
    const ramps = await this.repository.query('accessibility_ramps', { project_id: projectId });
    const doors = await this.repository.query('accessibility_doors', { project_id: projectId });
    const elevators = await this.repository.query('accessibility_elevators', { project_id: projectId });

    this._setData('assessment', data || {});
    this._setData('ramps', ramps || []);
    this._setData('doors', doors || []);
    this._setData('elevators', elevators || []);
  }

  getTabs() {
    const data = this._getData.bind(this);
    return [
      { id: 'dashboard', icon: 'chart-pie', label: 'DASHBOARD' },
      { id: 'ramps', icon: 'road', label: `RAMP (${data('ramps')?.length || 0})` },
      { id: 'doors', icon: 'door-open', label: `PINTU (${data('doors')?.length || 0})` },
      { id: 'elevators', icon: 'arrow-up', label: `LIFT (${data('elevators')?.length || 0})` },
      { id: 'tactile', icon: 'hand-pointer', label: 'TACTILE' },
      { id: 'compliance', icon: 'check-circle', label: 'COMPLIANCE' }
    ];
  }

  renderTabContent(tabId) {
    switch (tabId) {
      case 'dashboard': return this.renderDashboardTab();
      case 'ramps': return this.renderRampsTab();
      case 'doors': return this.renderDoorsTab();
      case 'elevators': return this.renderElevatorsTab();
      case 'tactile': return this.renderTactileTab();
      case 'compliance': return this.renderComplianceTab();
      default: return this.renderDashboardTab();
    }
  }

  renderDashboardTab() {
    const assessment = this._getData('assessment') || {};
    const ramps = this._getData('ramps') || [];
    const doors = this._getData('doors') || [];
    const elevators = this._getData('elevators') || [];

    const compliantRamps = ramps.filter(r => r.slope_percent <= this.STANDARDS.ramp_max_slope).length;
    const compliantDoors = doors.filter(d => d.width >= this.STANDARDS.door_min_width).length;

    const stats = [
      { icon: 'road', value: ramps.length, label: 'Ramp', sublabel: `${compliantRamps} Sesuai`, accentColor: 'var(--brand-400)' },
      { icon: 'door-open', value: doors.length, label: 'Pintu', sublabel: `${compliantDoors} Sesuai`, accentColor: 'var(--success-400)' },
      { icon: 'arrow-up', value: elevators.length, label: 'Lift', sublabel: elevators.length > 0 ? 'Tersedia' : 'Tidak Ada', accentColor: elevators.length > 0 ? 'var(--success-400)' : 'var(--warning-400)' },
      { icon: 'hand-pointer', value: assessment.tactile_blocks || 0, label: 'Tactile Block', sublabel: 'Guiding', accentColor: 'var(--warning-400)' }
    ];

    return `
      <div id="accessibility-tab-dashboard" class="accessibility-tab-content">
        ${InspectionWidgets.renderStatsGrid(stats)}
        
        ${InspectionWidgets.renderSectionCard({
          title: 'Standar SNI 8131:2015',
          icon: 'book',
          accentColor: 'var(--brand-400)',
          content: `
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; font-size: 0.85rem;">
              <div style="padding: 12px; background: hsla(220, 20%, 15%, 0.5); border-radius: 8px;">
                <strong style="color: white;">Kemiringan Ramp:</strong> Max ${this.STANDARDS.ramp_max_slope}%
              </div>
              <div style="padding: 12px; background: hsla(220, 20%, 15%, 0.5); border-radius: 8px;">
                <strong style="color: white;">Lebar Ramp:</strong> Min ${this.STANDARDS.ramp_min_width}mm
              </div>
              <div style="padding: 12px; background: hsla(220, 20%, 15%, 0.5); border-radius: 8px;">
                <strong style="color: white;">Lebar Pintu:</strong> Min ${this.STANDARDS.door_min_width}mm
              </div>
              <div style="padding: 12px; background: hsla(220, 20%, 15%, 0.5); border-radius: 8px;">
                <strong style="color: white;">Tinggi Pegangan:</strong> ${this.STANDARDS.handrail_height.min}-${this.STANDARDS.handrail_height.max}mm
              </div>
            </div>
          `
        })}
      </div>
    `;
  }

  renderRampsTab() {
    const ramps = this._getData('ramps') || [];
    
    return `
      <div id="accessibility-tab-ramps" class="accessibility-tab-content">
        ${InspectionWidgets.renderActionBar([
          { icon: 'plus', label: 'Tambah Ramp', variant: 'primary', onclick: `window._inspectionControllers['accessibility'].showAddRampModal()` }
        ])}
        
        ${ramps.length > 0
          ? InspectionWidgets.renderDataTable({
              headers: ['Lokasi', 'Panjang (m)', 'Tinggi (m)', 'Kemiringan (%)', 'Lebar (mm)', 'Status'],
              rows: ramps.map(r => {
                const slopeOk = r.slope_percent <= this.STANDARDS.ramp_max_slope;
                const widthOk = r.width >= this.STANDARDS.ramp_min_width;
                const status = slopeOk && widthOk ? '✓ Sesuai' : '✗ Tidak Sesuai';
                const statusColor = slopeOk && widthOk ? 'var(--success-400)' : 'var(--danger-400)';
                
                return [
                  r.location || '-',
                  r.length || '-',
                  r.height || '-',
                  r.slope_percent ? r.slope_percent.toFixed(2) + '%' : '-',
                  r.width || '-',
                  `<span style="color: ${statusColor}; font-weight: 600;">${status}</span>`
                ];
              }),
              align: ['left', 'right', 'right', 'right', 'right', 'center']
            })
          : InspectionWidgets.renderEmptyState({
              icon: 'road',
              title: 'Belum Ada Data Ramp',
              message: 'Tambahkan data ramp untuk evaluasi kemudahan akses.',
              actionLabel: 'Tambah Ramp',
              actionOnClick: `window._inspectionControllers['accessibility'].showAddRampModal()`
            })
        }
      </div>
    `;
  }

  renderDoorsTab() {
    const doors = this._getData('doors') || [];
    
    return `
      <div id="accessibility-tab-doors" class="accessibility-tab-content">
        ${InspectionWidgets.renderActionBar([
          { icon: 'plus', label: 'Tambah Pintu', variant: 'primary', onclick: `window._inspectionControllers['accessibility'].showAddDoorModal()` }
        ])}
        
        ${doors.length > 0
          ? InspectionWidgets.renderDataTable({
              headers: ['Lokasi', 'Lebar (mm)', 'Tipe', 'Akses Difabel', 'Status'],
              rows: doors.map(d => {
                const widthOk = d.width >= this.STANDARDS.door_min_width;
                const status = widthOk ? '✓ Sesuai' : '✗ Tidak Sesuai';
                const statusColor = widthOk ? 'var(--success-400)' : 'var(--danger-400)';
                
                return [
                  d.location || '-',
                  d.width || '-',
                  d.door_type || '-',
                  d.accessible ? 'Ya' : 'Tidak',
                  `<span style="color: ${statusColor}; font-weight: 600;">${status}</span>`
                ];
              }),
              align: ['left', 'right', 'left', 'center', 'center']
            })
          : InspectionWidgets.renderEmptyState({
              icon: 'door-open',
              title: 'Belum Ada Data Pintu',
              message: 'Tambahkan data pintu untuk evaluasi accessibility.',
              actionLabel: 'Tambah Pintu',
              actionOnClick: `window._inspectionControllers['accessibility'].showAddDoorModal()`
            })
        }
      </div>
    `;
  }

  renderElevatorsTab() {
    const elevators = this._getData('elevators') || [];
    
    return `
      <div id="accessibility-tab-elevators" class="accessibility-tab-content">
        ${InspectionWidgets.renderActionBar([
          { icon: 'plus', label: 'Tambah Lift', variant: 'primary', onclick: `window._inspectionControllers['accessibility'].showAddElevatorModal()` }
        ])}
        
        ${elevators.length > 0
          ? InspectionWidgets.renderDataTable({
              headers: ['ID', 'Lokasi', 'Kapasitas (kg)', 'Lebar Pintu (mm)', 'Tombol Braille', 'Status'],
              rows: elevators.map(e => [
                e.elevator_code || e.id?.slice(0, 8),
                e.location || '-',
                e.capacity || '-',
                e.door_width || '-',
                e.has_braille ? '✓' : '✗',
                e.accessible ? '✓ Accessible' : '✗ Not Accessible'
              ]),
              align: ['left', 'left', 'right', 'right', 'center', 'center']
            })
          : InspectionWidgets.renderEmptyState({
              icon: 'arrow-up',
              title: 'Belum Ada Data Lift',
              message: 'Tambahkan data lift untuk evaluasi accessibility.',
              actionLabel: 'Tambah Lift',
              actionOnClick: `window._inspectionControllers['accessibility'].showAddElevatorModal()`
            })
        }
      </div>
    `;
  }

  renderTactileTab() {
    return InspectionWidgets.renderSectionCard({
      title: 'Tactile Guidance',
      icon: 'hand-pointer',
      accentColor: 'var(--warning-400)',
      content: InspectionWidgets.renderEmptyState({
        icon: 'route',
        title: 'Tactile Blocks & Guiding',
        message: 'Data tactile blocks dan guiding path untuk difabel akan ditampilkan di sini.'
      })
    });
  }

  renderComplianceTab() {
    const assessment = this._getData('assessment') || {};
    const score = assessment.compliance_score || 0;

    return `
      <div id="accessibility-tab-compliance" class="accessibility-tab-content">
        ${InspectionWidgets.renderScoreIndicator({ score, label: 'Accessibility Compliance (SNI 8131)', size: 'lg' })}
        
        <div style="margin-top: 24px;">
          ${InspectionWidgets.renderSectionCard({
            title: 'Evaluasi Compliance',
            icon: 'clipboard-check',
            accentColor: 'var(--success-400)',
            content: `
              <p style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.6;">
                ${score >= 80 ? '✓ Bangunan memenuhi standar accessibility SNI 8131:2015' : 
                  score >= 60 ? '⚠ Sebagian fasilitas accessibility perlu perbaikan' : 
                  '✗ Bangunan belum memenuhi standar accessibility'}
              </p>
            `
          })}
        </div>
      </div>
    `;
  }

  showAddRampModal() { showInfo('Modal tambah ramp akan ditampilkan'); }
  showAddDoorModal() { showInfo('Modal tambah pintu akan ditampilkan'); }
  showAddElevatorModal() { showInfo('Modal tambah lift akan ditampilkan'); }

  afterRender() {
    super.afterRender();
    if (typeof window !== 'undefined') {
      window._inspectionControllers = window._inspectionControllers || {};
      window._inspectionControllers['accessibility'] = this;
    }
  }
}

let accessibilityInspectionInstance = null;

export async function accessibilityInspectionPage(params = {}) {
  if (accessibilityInspectionInstance) accessibilityInspectionInstance.destroy();
  accessibilityInspectionInstance = new AccessibilityInspection();
  return await accessibilityInspectionInstance.initialize(params);
}

export function afterAccessibilityInspectionRender() {
  if (accessibilityInspectionInstance) accessibilityInspectionInstance.afterRender();
}
