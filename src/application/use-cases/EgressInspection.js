// ============================================================
// EGRESS INSPECTION - Clean Architecture Implementation
// ============================================================

import { BaseInspection } from './BaseInspection.js';
import { InspectionWidgets } from '../../components/inspection/inspection-widgets.js';
import { showSuccess, showError, showInfo } from '../../components/toast.js';

export class EgressInspection extends BaseInspection {
  constructor() {
    super({
      moduleName: 'egress',
      phaseCode: 'PHASE 03B',
      title: 'Pemeriksaan Jalur Evakuasi',
      badge: 'PP 16/2021',
      icon: 'running',
      accentColor: 'var(--danger-400)',
      description: 'Evaluasi jalur evakuasi dan keluar bangunan berdasarkan PP 16/2021 dan SNI. Meliputi tangga, koridor, pintu keluar, dan tanda exit.',
      tables: ['egress_assessments', 'exit_routes', 'stairwells', 'exit_doors', 'emergency_signs']
    });

    this.EGRESS_STANDARDS = {
      corridor_min_width: 1.5, // meters
      stair_min_width: 1.2, // meters
      door_min_width: 0.9, // meters
      max_travel_distance: 30, // meters
      max_dead_end: 6 // meters
    };
  }

  async loadData() {
    const projectId = this._state.projectId;
    const data = await this.repository.query('egress_assessments', { project_id: projectId });
    
    const exitRoutes = await this.repository.query('exit_routes', { project_id: projectId });
    const stairwells = await this.repository.query('stairwells', { project_id: projectId });
    const exitDoors = await this.repository.query('exit_doors', { project_id: projectId });
    const signs = await this.repository.query('emergency_signs', { project_id: projectId });

    this._setData('assessment', data?.[0] || {});
    this._setData('exitRoutes', exitRoutes || []);
    this._setData('stairwells', stairwells || []);
    this._setData('exitDoors', exitDoors || []);
    this._setData('signs', signs || []);
  }

  getTabs() {
    const data = this._getData.bind(this);
    return [
      { id: 'dashboard', icon: 'chart-pie', label: 'DASHBOARD' },
      { id: 'routes', icon: 'route', label: `RUTE (${data('exitRoutes')?.length || 0})` },
      { id: 'stairs', icon: 'walking', label: `TANGGA (${data('stairwells')?.length || 0})` },
      { id: 'doors', icon: 'door-open', label: `PINTU (${data('exitDoors')?.length || 0})` },
      { id: 'signs', icon: 'sign', label: `TANDA (${data('signs')?.length || 0})` },
      { id: 'capacity', icon: 'calculator', label: 'KAPASITAS' },
      { id: 'compliance', icon: 'check-circle', label: 'COMPLIANCE' }
    ];
  }

  renderTabContent(tabId) {
    switch (tabId) {
      case 'dashboard': return this.renderDashboardTab();
      case 'routes': return this.renderRoutesTab();
      case 'stairs': return this.renderStairsTab();
      case 'doors': return this.renderDoorsTab();
      case 'signs': return this.renderSignsTab();
      case 'capacity': return this.renderCapacityTab();
      case 'compliance': return this.renderComplianceTab();
      default: return this.renderDashboardTab();
    }
  }

  renderDashboardTab() {
    const assessment = this._getData('assessment') || {};
    const exitRoutes = this._getData('exitRoutes') || [];
    const stairwells = this._getData('stairwells') || [];
    const exitDoors = this._getData('exitDoors') || [];
    const signs = this._getData('signs') || [];

    const compliantRoutes = exitRoutes.filter(r => r.compliance_status === 'COMPLIANT').length;
    const compliantStairs = stairwells.filter(s => s.width >= this.EGRESS_STANDARDS.stair_min_width).length;
    const compliantDoors = exitDoors.filter(d => d.width >= this.EGRESS_STANDARDS.door_min_width).length;
    const compliantSigns = signs.filter(s => s.illuminated && s.visible).length;

    const stats = [
      { icon: 'route', value: exitRoutes.length, label: 'Rute Evakuasi', sublabel: `${compliantRoutes} Sesuai`, accentColor: 'var(--brand-400)' },
      { icon: 'walking', value: stairwells.length, label: 'Tangga Darurat', sublabel: `${compliantStairs} Sesuai`, accentColor: 'var(--success-400)' },
      { icon: 'door-open', value: exitDoors.length, label: 'Pintu Keluar', sublabel: `${compliantDoors} Sesuai`, accentColor: 'var(--warning-400)' },
      { icon: 'sign', value: signs.length, label: 'Tanda Exit', sublabel: `${compliantSigns} Fungsional`, accentColor: 'var(--danger-400)' }
    ];

    return `
      <div id="egress-tab-dashboard" class="egress-tab-content">
        ${InspectionWidgets.renderStatsGrid(stats)}
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
          ${InspectionWidgets.renderSectionCard({
            title: 'Waktu Evakuasi',
            icon: 'clock',
            accentColor: 'var(--danger-400)',
            content: `
              <div style="text-align: center; padding: 20px;">
                <div style="font-size: 4rem; font-weight: 800; color: ${assessment.evacuation_time <= 5 ? 'var(--success-400)' : assessment.evacuation_time <= 10 ? 'var(--warning-400)' : 'var(--danger-400)'};">${assessment.evacuation_time || '-'}<span style="font-size: 1.5rem;"> min</span></div>
                <div style="font-size: 0.9rem; color: var(--text-tertiary); margin-top: 8px;">Total Waktu Evakuasi</div>
                <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 12px;">
                  Required: <strong>${assessment.required_evacuation_time || 5} menit</strong>
                </div>
              </div>
            `
          })}
          
          ${InspectionWidgets.renderSectionCard({
            title: 'Standar Egress PP 16/2021',
            icon: 'book',
            accentColor: 'var(--brand-400)',
            content: `
              <div style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.6;">
                <p style="margin-bottom: 8px;"><strong>Lebar Minimum:</strong></p>
                <ul style="margin-left: 20px; margin-bottom: 12px;">
                  <li>Koridor: ${this.EGRESS_STANDARDS.corridor_min_width} m</li>
                  <li>Tangga: ${this.EGRESS_STANDARDS.stair_min_width} m</li>
                  <li>Pintu: ${this.EGRESS_STANDARDS.door_min_width} m</li>
                </ul>
                <p><strong>Jarak Tempuh:</strong> Maks ${this.EGRESS_STANDARDS.max_travel_distance} m</p>
              </div>
            `
          })}
        </div>
      </div>
    `;
  }

  renderRoutesTab() {
    const exitRoutes = this._getData('exitRoutes') || [];
    
    return `
      <div id="egress-tab-routes" class="egress-tab-content">
        ${InspectionWidgets.renderActionBar([
          { icon: 'plus', label: 'Tambah Rute', variant: 'primary', onclick: `window._inspectionControllers['egress'].showAddRouteModal()` }
        ])}
        
        ${exitRoutes.length > 0
          ? InspectionWidgets.renderDataTable({
              headers: ['ID', 'Lokasi', 'Jarak (m)', 'Dead End (m)', 'Kapasitas', 'Status'],
              rows: exitRoutes.map(r => [
                r.route_code || r.id?.slice(0, 8),
                r.location || '-',
                r.travel_distance || '-',
                r.dead_end_distance || '-',
                r.capacity || '-',
                r.compliance_status === 'COMPLIANT' ? '<span style="color: var(--success-400);">✓ Sesuai</span>' : '<span style="color: var(--danger-400);">✗ Tidak Sesuai</span>'
              ]),
              align: ['left', 'left', 'right', 'right', 'right', 'center']
            })
          : InspectionWidgets.renderEmptyState({
              icon: 'route',
              title: 'Belum Ada Rute Evakuasi',
              message: 'Tambahkan data rute evakuasi.',
              actionLabel: 'Tambah Rute',
              actionOnClick: `window._inspectionControllers['egress'].showAddRouteModal()`
            })
        }
      </div>
    `;
  }

  renderStairsTab() {
    const stairwells = this._getData('stairwells') || [];
    
    return `
      <div id="egress-tab-stairs" class="egress-tab-content">
        ${InspectionWidgets.renderActionBar([
          { icon: 'plus', label: 'Tambah Tangga', variant: 'primary', onclick: `window._inspectionControllers['egress'].showAddStairModal()` }
        ])}
        
        ${stairwells.length > 0
          ? InspectionWidgets.renderDataTable({
              headers: ['ID', 'Lokasi', 'Lebar (m)', 'Anak Tangga', 'Platform', 'Status'],
              rows: stairwells.map(s => {
                const widthOk = s.width >= this.EGRESS_STANDARDS.stair_min_width;
                return [
                  s.stair_code || s.id?.slice(0, 8),
                  s.location || '-',
                  s.width || '-',
                  s.riser_height ? s.riser_height + ' mm' : '-',
                  s.has_landing ? '✓' : '✗',
                  widthOk ? '<span style="color: var(--success-400);">✓ Sesuai</span>' : '<span style="color: var(--danger-400);">✗ Terlalu Sempit</span>'
                ];
              }),
              align: ['left', 'left', 'right', 'center', 'center', 'center']
            })
          : InspectionWidgets.renderEmptyState({
              icon: 'walking',
              title: 'Belum Ada Data Tangga',
              message: 'Tambahkan data tangga darurat.',
              actionLabel: 'Tambah Tangga',
              actionOnClick: `window._inspectionControllers['egress'].showAddStairModal()`
            })
        }
      </div>
    `;
  }

  renderDoorsTab() {
    const exitDoors = this._getData('exitDoors') || [];
    
    return `
      <div id="egress-tab-doors" class="egress-tab-content">
        ${InspectionWidgets.renderActionBar([
          { icon: 'plus', label: 'Tambah Pintu', variant: 'primary', onclick: `window._inspectionControllers['egress'].showAddDoorModal()` }
        ])}
        
        ${exitDoors.length > 0
          ? InspectionWidgets.renderDataTable({
              headers: ['ID', 'Lokasi', 'Lebar (m)', 'Push Bar', 'Arah Buka', 'Status'],
              rows: exitDoors.map(d => {
                const widthOk = d.width >= this.EGRESS_STANDARDS.door_min_width;
                return [
                  d.door_code || d.id?.slice(0, 8),
                  d.location || '-',
                  d.width || '-',
                  d.has_push_bar ? '✓' : '✗',
                  d.swing_direction || '-',
                  widthOk ? '<span style="color: var(--success-400);">✓ Sesuai</span>' : '<span style="color: var(--danger-400);">✗ Terlalu Sempit</span>'
                ];
              }),
              align: ['left', 'left', 'right', 'center', 'left', 'center']
            })
          : InspectionWidgets.renderEmptyState({
              icon: 'door-open',
              title: 'Belum Ada Data Pintu',
              message: 'Tambahkan data pintu keluar darurat.',
              actionLabel: 'Tambah Pintu',
              actionOnClick: `window._inspectionControllers['egress'].showAddDoorModal()`
            })
        }
      </div>
    `;
  }

  renderSignsTab() {
    const signs = this._getData('signs') || [];
    
    return `
      <div id="egress-tab-signs" class="egress-tab-content">
        ${InspectionWidgets.renderActionBar([
          { icon: 'plus', label: 'Tambah Tanda', variant: 'primary', onclick: `window._inspectionControllers['egress'].showAddSignModal()` }
        ])}
        
        ${signs.length > 0
          ? InspectionWidgets.renderDataTable({
              headers: ['ID', 'Lokasi', 'Tipe', 'Terang', 'Terlihat', 'Status'],
              rows: signs.map(s => [
                s.sign_code || s.id?.slice(0, 8),
                s.location || '-',
                s.sign_type || '-',
                s.illuminated ? '✓' : '✗',
                s.visible ? '✓' : '✗',
                s.illuminated && s.visible ? '<span style="color: var(--success-400);">✓ Aktif</span>' : '<span style="color: var(--warning-400);">⚠ Perlu Cek</span>'
              ]),
              align: ['left', 'left', 'left', 'center', 'center', 'center']
            })
          : InspectionWidgets.renderEmptyState({
              icon: 'sign',
              title: 'Belum Ada Tanda Exit',
              message: 'Tambahkan data tanda emergency exit.',
              actionLabel: 'Tambah Tanda',
              actionOnClick: `window._inspectionControllers['egress'].showAddSignModal()`
            })
        }
      </div>
    `;
  }

  renderCapacityTab() {
    const assessment = this._getData('assessment') || {};
    const { projectData } = this._state;
    const occupancy = projectData?.estimated_occupancy || 0;
    const exitRoutes = this._getData('exitRoutes') || [];
    const totalCapacity = exitRoutes.reduce((sum, r) => sum + (r.capacity || 0), 0);

    const capacityOk = totalCapacity >= occupancy;

    return InspectionWidgets.renderSectionCard({
      title: 'Analisis Kapasitas Egress',
      icon: 'calculator',
      accentColor: 'var(--warning-400)',
      content: `
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 24px;">
          <div class="card-quartz" style="padding: 24px; text-align: center;">
            <div style="font-size: 0.9rem; color: var(--text-tertiary); margin-bottom: 8px;">Estimated Occupancy</div>
            <div style="font-size: 3rem; font-weight: 800; color: white;">${this._formatNumber(occupancy, 0)}</div>
            <div style="font-size: 0.85rem; color: var(--text-tertiary);">Orang</div>
          </div>
          <div class="card-quartz" style="padding: 24px; text-align: center;">
            <div style="font-size: 0.9rem; color: var(--text-tertiary); margin-bottom: 8px;">Egress Capacity</div>
            <div style="font-size: 3rem; font-weight: 800; color: ${capacityOk ? 'var(--success-400)' : 'var(--danger-400)'};">${this._formatNumber(totalCapacity, 0)}</div>
            <div style="font-size: 0.85rem; color: var(--text-tertiary);">Orang</div>
          </div>
        </div>
        
        <div style="text-align: center; padding: 16px; background: ${capacityOk ? 'hsla(160, 100%, 45%, 0.1)' : 'hsla(0, 80%, 60%, 0.1)'}; border-radius: 12px;">
          <div style="font-size: 1.2rem; font-weight: 700; color: ${capacityOk ? 'var(--success-400)' : 'var(--danger-400)'};">
            ${capacityOk ? '✓ Kapasitas Mencukupi' : '✗ Kapasitas Tidak Mencukupi'}
          </div>
          <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 8px;">
            ${capacityOk ? 'Total kapasitas egress melebihi occupant load' : `Kekurangan: ${occupancy - totalCapacity} orang`}
          </div>
        </div>
      `
    });
  }

  renderComplianceTab() {
    const exitRoutes = this._getData('exitRoutes') || [];
    const stairwells = this._getData('stairwells') || [];
    const exitDoors = this._getData('exitDoors') || [];
    const signs = this._getData('signs') || [];
    const assessment = this._getData('assessment') || {};

    const checks = [
      { name: 'Rute Evakuasi', passed: exitRoutes.every(r => r.travel_distance <= this.EGRESS_STANDARDS.max_travel_distance), value: `${exitRoutes.length} rute` },
      { name: 'Lebar Tangga', passed: stairwells.every(s => s.width >= this.EGRESS_STANDARDS.stair_min_width), value: `${stairwells.length} tangga` },
      { name: 'Lebar Pintu', passed: exitDoors.every(d => d.width >= this.EGRESS_STANDARDS.door_min_width), value: `${exitDoors.length} pintu` },
      { name: 'Tanda Exit', passed: signs.every(s => s.illuminated && s.visible), value: `${signs.length} tanda` },
      { name: 'Waktu Evakuasi', passed: assessment.evacuation_time <= assessment.required_evacuation_time, value: `${assessment.evacuation_time || '-'} menit` }
    ];

    const passedCount = checks.filter(c => c.passed).length;
    const overallScore = Math.round((passedCount / checks.length) * 100);

    return `
      <div id="egress-tab-compliance" class="egress-tab-content">
        ${InspectionWidgets.renderScoreIndicator({ score: overallScore, label: 'Egress Compliance PP 16/2021', size: 'lg' })}
        
        <div style="margin-top: 24px;">
          ${InspectionWidgets.renderSectionCard({
            title: 'Checklist Compliance',
            icon: 'clipboard-check',
            accentColor: 'var(--success-400)',
            content: `
              <div style="display: flex; flex-direction: column; gap: 12px;">
                ${checks.map(check => `
                  <div style="display: flex; align-items: center; gap: 12px; padding: 16px; background: hsla(220, 20%, 15%, 0.5); border-radius: 10px;">
                    <div style="width: 32px; height: 32px; border-radius: 50%; background: ${check.passed ? 'hsla(160, 100%, 45%, 0.2)' : 'hsla(0, 80%, 60%, 0.2)'}; display: flex; align-items: center; justify-content: center; color: ${check.passed ? 'var(--success-400)' : 'var(--danger-400)'};">
                      <i class="fas fa-${check.passed ? 'check' : 'times'}"></i>
                    </div>
                    <div style="flex: 1;">
                      <div style="font-size: 0.9rem; font-weight: 600; color: var(--text-primary);">${check.name}</div>
                    </div>
                    <div style="font-size: 1rem; font-weight: 700; color: ${check.passed ? 'var(--success-400)' : 'var(--danger-400)'};">${check.value}</div>
                  </div>
                `).join('')}
              </div>
            `
          })}
        </div>
      </div>
    `;
  }

  showAddRouteModal() { showInfo('Modal tambah rute akan ditampilkan'); }
  showAddStairModal() { showInfo('Modal tambah tangga akan ditampilkan'); }
  showAddDoorModal() { showInfo('Modal tambah pintu akan ditampilkan'); }
  showAddSignModal() { showInfo('Modal tambah tanda akan ditampilkan'); }

  afterRender() {
    super.afterRender();
    if (typeof window !== 'undefined') {
      window._inspectionControllers = window._inspectionControllers || {};
      window._inspectionControllers['egress'] = this;
    }
  }
}

let egressInspectionInstance = null;

export async function egressInspectionPage(params = {}) {
  if (egressInspectionInstance) egressInspectionInstance.destroy();
  egressInspectionInstance = new EgressInspection();
  return await egressInspectionInstance.initialize(params);
}

export function afterEgressInspectionRender() {
  if (egressInspectionInstance) egressInspectionInstance.afterRender();
}
