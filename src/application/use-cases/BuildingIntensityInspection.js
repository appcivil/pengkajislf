// ============================================================
// BUILDING INTENSITY INSPECTION - Clean Architecture Implementation
// ============================================================

import { BaseInspection } from './BaseInspection.js';
import { InspectionWidgets } from '../../components/inspection/inspection-widgets.js';
import { showSuccess, showError, showInfo } from '../../components/toast.js';

export class BuildingIntensityInspection extends BaseInspection {
  constructor() {
    super({
      moduleName: 'intensity',
      phaseCode: 'PHASE 01B',
      title: 'Pemeriksaan Intensitas Bangunan',
      badge: 'PP 16/2021',
      icon: 'ruler-combined',
      accentColor: 'var(--warning-400)',
      description: 'Evaluasi intensitas bangunan berdasarkan Peraturan Pemerintah No. 16 Tahun 2021. Meliputi KDB, KLB, KDH, dan tinggi bangunan.',
      tables: ['building_intensity_data', 'floor_plans', 'height_analysis']
    });

    this.STANDARDS = {
      kdb_max: { residential: 60, commercial: 80, industrial: 70 },
      klb_max: { residential: 3.5, commercial: 5.0, industrial: 2.5 },
      kdh_min: 10 // percent
    };
  }

  async loadData() {
    const projectId = this._state.projectId;
    const data = await this.repository.query('building_intensity_data', { project_id: projectId });
    
    const floorPlans = await this.repository.query('floor_plans', { project_id: projectId });
    const height = await this.repository.query('height_analysis', { project_id: projectId });

    this._setData('intensity', data?.[0] || {});
    this._setData('floorPlans', floorPlans || []);
    this._setData('height', height?.[0] || null);
  }

  getTabs() {
    return [
      { id: 'dashboard', icon: 'chart-pie', label: 'DASHBOARD' },
      { id: 'kdb', icon: 'percentage', label: 'KDB' },
      { id: 'klb', icon: 'layer-group', label: 'KLB' },
      { id: 'kdh', icon: 'tree', label: 'KDH' },
      { id: 'height', icon: 'ruler-vertical', label: 'TINGGI' },
      { id: 'floors', icon: 'building', label: 'LANTAI' }
    ];
  }

  renderTabContent(tabId) {
    switch (tabId) {
      case 'dashboard': return this.renderDashboardTab();
      case 'kdb': return this.renderKdbTab();
      case 'klb': return this.renderKlbTab();
      case 'kdh': return this.renderKdhTab();
      case 'height': return this.renderHeightTab();
      case 'floors': return this.renderFloorsTab();
      default: return this.renderDashboardTab();
    }
  }

  renderDashboardTab() {
    const intensity = this._getData('intensity') || {};
    const { projectData } = this._state;
    const floorPlans = this._getData('floorPlans') || [];
    const height = this._getData('height') || {};

    const kdbStatus = intensity.kdb && intensity.kdb_max ? (intensity.kdb <= intensity.kdb_max ? 'COMPLIANT' : 'EXCEEDED') : 'PENDING';
    const klbStatus = intensity.klb && intensity.klb_max ? (intensity.klb <= intensity.klb_max ? 'COMPLIANT' : 'EXCEEDED') : 'PENDING';
    const kdhStatus = intensity.kdh ? (intensity.kdh >= this.STANDARDS.kdh_min ? 'COMPLIANT' : 'INSUFFICIENT') : 'PENDING';

    const stats = [
      { icon: 'percentage', value: intensity.kdb ? intensity.kdb.toFixed(2) + '%' : '-', label: 'KDB', sublabel: kdbStatus, accentColor: kdbStatus === 'COMPLIANT' ? 'var(--success-400)' : kdbStatus === 'EXCEEDED' ? 'var(--danger-400)' : 'var(--warning-400)' },
      { icon: 'layer-group', value: intensity.klb || '-', label: 'KLB', sublabel: klbStatus, accentColor: klbStatus === 'COMPLIANT' ? 'var(--success-400)' : klbStatus === 'EXCEEDED' ? 'var(--danger-400)' : 'var(--warning-400)' },
      { icon: 'tree', value: intensity.kdh ? intensity.kdh.toFixed(2) + '%' : '-', label: 'KDH', sublabel: kdhStatus, accentColor: kdhStatus === 'COMPLIANT' ? 'var(--success-400)' : kdhStatus === 'INSUFFICIENT' ? 'var(--danger-400)' : 'var(--warning-400)' },
      { icon: 'ruler-vertical', value: height.building_height ? height.building_height.toFixed(1) + ' m' : '-', label: 'Tinggi', sublabel: projectData?.jumlah_lantai + ' Lantai', accentColor: 'var(--brand-400)' }
    ];

    return `
      <div id="intensity-tab-dashboard" class="intensity-tab-content">
        ${InspectionWidgets.renderStatsGrid(stats)}
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
          ${InspectionWidgets.renderSectionCard({
            title: 'Data Dasar',
            icon: 'database',
            accentColor: 'var(--brand-400)',
            content: `
              <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;">
                <div>
                  <label style="font-size: 0.7rem; color: var(--text-tertiary);">Luas Tapak</label>
                  <div style="font-size: 1.2rem; font-weight: 600; color: white;">${this._formatNumber(intensity.site_area, 1)} m²</div>
                </div>
                <div>
                  <label style="font-size: 0.7rem; color: var(--text-tertiary);">Luas Bangunan Dasar</label>
                  <div style="font-size: 1.2rem; font-weight: 600; color: white;">${this._formatNumber(intensity.base_building_area, 1)} m²</div>
                </div>
                <div>
                  <label style="font-size: 0.7rem; color: var(--text-tertiary);">Total Luas Lantai</label>
                  <div style="font-size: 1.2rem; font-weight: 600; color: white;">${this._formatNumber(intensity.total_floor_area, 1)} m²</div>
                </div>
                <div>
                  <label style="font-size: 0.7rem; color: var(--text-tertiary);">Luas Ruang Terbuka Hijau</label>
                  <div style="font-size: 1.2rem; font-weight: 600; color: white;">${this._formatNumber(intensity.open_green_space, 1)} m²</div>
                </div>
              </div>
            `
          })}
          
          ${InspectionWidgets.renderSectionCard({
            title: 'Status Compliance',
            icon: 'check-circle',
            accentColor: 'var(--success-400)',
            content: `
              <div style="display: flex; flex-direction: column; gap: 12px;">
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: ${kdbStatus === 'COMPLIANT' ? 'hsla(160, 100%, 45%, 0.1)' : 'hsla(0, 80%, 60%, 0.1)'}; border-radius: 8px;">
                  <span style="font-size: 0.9rem; color: var(--text-primary);">KDB</span>
                  <span style="font-weight: 600; color: ${kdbStatus === 'COMPLIANT' ? 'var(--success-400)' : 'var(--danger-400)'};">${kdbStatus === 'COMPLIANT' ? '✓ Sesuai' : kdbStatus === 'EXCEEDED' ? '✗ Melebihi' : '⏳ Pending'}</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: ${klbStatus === 'COMPLIANT' ? 'hsla(160, 100%, 45%, 0.1)' : 'hsla(0, 80%, 60%, 0.1)'}; border-radius: 8px;">
                  <span style="font-size: 0.9rem; color: var(--text-primary);">KLB</span>
                  <span style="font-weight: 600; color: ${klbStatus === 'COMPLIANT' ? 'var(--success-400)' : 'var(--danger-400)'};">${klbStatus === 'COMPLIANT' ? '✓ Sesuai' : klbStatus === 'EXCEEDED' ? '✗ Melebihi' : '⏳ Pending'}</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: ${kdhStatus === 'COMPLIANT' ? 'hsla(160, 100%, 45%, 0.1)' : 'hsla(0, 80%, 60%, 0.1)'}; border-radius: 8px;">
                  <span style="font-size: 0.9rem; color: var(--text-primary);">KDH</span>
                  <span style="font-weight: 600; color: ${kdhStatus === 'COMPLIANT' ? 'var(--success-400)' : 'var(--danger-400)'};">${kdhStatus === 'COMPLIANT' ? '✓ Sesuai' : kdhStatus === 'INSUFFICIENT' ? '✗ Kurang' : '⏳ Pending'}</span>
                </div>
              </div>
            `
          })}
        </div>
      </div>
    `;
  }

  renderKdbTab() {
    const intensity = this._getData('intensity') || {};
    const kdbValue = intensity.kdb || 0;
    const kdbMax = intensity.kdb_max || 60;
    const compliance = kdbValue <= kdbMax;

    return InspectionWidgets.renderSectionCard({
      title: 'Koefisien Dasar Bangunan (KDB)',
      icon: 'percentage',
      accentColor: compliance ? 'var(--success-400)' : 'var(--danger-400)',
      content: `
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="font-size: 5rem; font-weight: 800; color: ${compliance ? 'var(--success-400)' : 'var(--danger-400)'};">${kdbValue.toFixed(2)}%</div>
          <div style="font-size: 1rem; color: var(--text-tertiary);">dari ${kdbMax}% maksimum</div>
        </div>
        
        <div style="margin-bottom: 20px;">
          <div style="height: 20px; background: hsla(220, 20%, 20%, 0.5); border-radius: 10px; overflow: hidden;">
            <div style="width: ${Math.min((kdbValue / kdbMax) * 100, 100)}%; height: 100%; background: ${compliance ? 'var(--success-400)' : 'var(--danger-400)'}; transition: width 0.5s ease;"></div>
          </div>
          <div style="display: flex; justify-content: space-between; margin-top: 8px; font-size: 0.75rem; color: var(--text-tertiary);">
            <span>0%</span>
            <span style="color: ${compliance ? 'var(--success-400)' : 'var(--danger-400)'}; font-weight: 600;">Current: ${kdbValue.toFixed(2)}%</span>
            <span>Max: ${kdbMax}%</span>
          </div>
        </div>
        
        <div style="padding: 16px; background: hsla(220, 20%, 15%, 0.5); border-radius: 12px;">
          <h4 style="font-size: 0.9rem; color: var(--text-primary); margin-bottom: 12px;">Perhitungan KDB:</h4>
          <code style="font-family: monospace; font-size: 0.85rem; color: var(--brand-400);">
            KDB = (Luas Bangunan Dasar / Luas Tapak) × 100%
          </code>
          <p style="font-size: 0.8rem; color: var(--text-tertiary); margin-top: 12px;">
            ${this._formatNumber(intensity.base_building_area, 1)} m² / ${this._formatNumber(intensity.site_area, 1)} m² × 100% = ${kdbValue.toFixed(2)}%
          </p>
        </div>
      `
    });
  }

  renderKlbTab() {
    const intensity = this._getData('intensity') || {};
    const klbValue = intensity.klb || 0;
    const klbMax = intensity.klb_max || 3.5;
    const compliance = klbValue <= klbMax;

    return InspectionWidgets.renderSectionCard({
      title: 'Koefisien Lantai Bangunan (KLB)',
      icon: 'layer-group',
      accentColor: compliance ? 'var(--success-400)' : 'var(--danger-400)',
      content: `
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="font-size: 5rem; font-weight: 800; color: ${compliance ? 'var(--success-400)' : 'var(--danger-400)'};">${klbValue.toFixed(2)}</div>
          <div style="font-size: 1rem; color: var(--text-tertiary);">maksimum ${klbMax}</div>
        </div>
        
        <div style="margin-bottom: 20px;">
          <div style="height: 20px; background: hsla(220, 20%, 20%, 0.5); border-radius: 10px; overflow: hidden;">
            <div style="width: ${Math.min((klbValue / klbMax) * 100, 100)}%; height: 100%; background: ${compliance ? 'var(--success-400)' : 'var(--danger-400)'}; transition: width 0.5s ease;"></div>
          </div>
          <div style="display: flex; justify-content: space-between; margin-top: 8px; font-size: 0.75rem; color: var(--text-tertiary);">
            <span>0</span>
            <span style="color: ${compliance ? 'var(--success-400)' : 'var(--danger-400)'}; font-weight: 600;">Current: ${klbValue.toFixed(2)}</span>
            <span>Max: ${klbMax}</span>
          </div>
        </div>
        
        <div style="padding: 16px; background: hsla(220, 20%, 15%, 0.5); border-radius: 12px;">
          <h4 style="font-size: 0.9rem; color: var(--text-primary); margin-bottom: 12px;">Perhitungan KLB:</h4>
          <code style="font-family: monospace; font-size: 0.85rem; color: var(--brand-400);">
            KLB = Total Luas Lantai / Luas Tapak
          </code>
          <p style="font-size: 0.8rem; color: var(--text-tertiary); margin-top: 12px;">
            ${this._formatNumber(intensity.total_floor_area, 1)} m² / ${this._formatNumber(intensity.site_area, 1)} m² = ${klbValue.toFixed(2)}
          </p>
        </div>
      `
    });
  }

  renderKdhTab() {
    const intensity = this._getData('intensity') || {};
    const kdhValue = intensity.kdh || 0;
    const kdhMin = this.STANDARDS.kdh_min;
    const compliance = kdhValue >= kdhMin;

    return InspectionWidgets.renderSectionCard({
      title: 'Koefisien Dasar Hijau (KDH)',
      icon: 'tree',
      accentColor: compliance ? 'var(--success-400)' : 'var(--danger-400)',
      content: `
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="font-size: 5rem; font-weight: 800; color: ${compliance ? 'var(--success-400)' : 'var(--danger-400)'};">${kdhValue.toFixed(2)}%</div>
          <div style="font-size: 1rem; color: var(--text-tertiary);">minimum ${kdhMin}%</div>
        </div>
        
        <div style="margin-bottom: 20px;">
          <div style="height: 20px; background: hsla(220, 20%, 20%, 0.5); border-radius: 10px; overflow: hidden;">
            <div style="width: ${Math.min((kdhValue / (kdhMin * 2)) * 100, 100)}%; height: 100%; background: ${compliance ? 'var(--success-400)' : 'var(--danger-400)'}; transition: width 0.5s ease;"></div>
          </div>
          <div style="display: flex; justify-content: space-between; margin-top: 8px; font-size: 0.75rem; color: var(--text-tertiary);">
            <span>0%</span>
            <span style="color: ${compliance ? 'var(--success-400)' : 'var(--danger-400)'}; font-weight: 600;">Current: ${kdhValue.toFixed(2)}%</span>
            <span>Target: ${kdhMin}%</span>
          </div>
        </div>
        
        <div style="padding: 16px; background: hsla(220, 20%, 15%, 0.5); border-radius: 12px;">
          <h4 style="font-size: 0.9rem; color: var(--text-primary); margin-bottom: 12px;">Perhitungan KDH:</h4>
          <code style="font-family: monospace; font-size: 0.85rem; color: var(--brand-400);">
            KDH = (Luas Ruang Terbuka Hijau / Luas Tapak) × 100%
          </code>
          <p style="font-size: 0.8rem; color: var(--text-tertiary); margin-top: 12px;">
            ${this._formatNumber(intensity.open_green_space, 1)} m² / ${this._formatNumber(intensity.site_area, 1)} m² × 100% = ${kdhValue.toFixed(2)}%
          </p>
        </div>
      `
    });
  }

  renderHeightTab() {
    const height = this._getData('height') || {};
    const { projectData } = this._state;

    return InspectionWidgets.renderSectionCard({
      title: 'Analisis Tinggi Bangunan',
      icon: 'ruler-vertical',
      accentColor: 'var(--brand-400)',
      content: `
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;">
          <div class="card-quartz" style="padding: 20px; text-align: center;">
            <div style="font-size: 0.8rem; color: var(--text-tertiary); margin-bottom: 8px;">Tinggi Bangunan</div>
            <div style="font-size: 2.5rem; font-weight: 800; color: white;">${height.building_height ? height.building_height.toFixed(1) : '-'}<span style="font-size: 1rem;"> m</span></div>
          </div>
          <div class="card-quartz" style="padding: 20px; text-align: center;">
            <div style="font-size: 0.8rem; color: var(--text-tertiary); margin-bottom: 8px;">Jumlah Lantai</div>
            <div style="font-size: 2.5rem; font-weight: 800; color: white;">${projectData?.jumlah_lantai || '-'}</div>
          </div>
          <div class="card-quartz" style="padding: 20px;">
            <div style="font-size: 0.8rem; color: var(--text-tertiary); margin-bottom: 4px;">Tinggi Lantai Rata-rata</div>
            <div style="font-size: 1.5rem; font-weight: 600; color: white;">${height.floor_height_avg ? height.floor_height_avg.toFixed(2) + ' m' : '-'}</div>
          </div>
          <div class="card-quartz" style="padding: 20px;">
            <div style="font-size: 0.8rem; color: var(--text-tertiary); margin-bottom: 4px;">Tinggi Basement</div>
            <div style="font-size: 1.5rem; font-weight: 600; color: white;">${height.basement_height ? height.basement_height.toFixed(2) + ' m' : 'N/A'}</div>
          </div>
        </div>
        
        ${height.max_allowed_height ? `
        <div style="margin-top: 20px; padding: 16px; background: ${height.building_height <= height.max_allowed_height ? 'hsla(160, 100%, 45%, 0.1)' : 'hsla(0, 80%, 60%, 0.1)'}; border-radius: 12px; text-align: center;">
          <div style="font-size: 0.9rem; color: var(--text-tertiary);">Batas Maksimum Tinggi</div>
          <div style="font-size: 1.8rem; font-weight: 700; color: ${height.building_height <= height.max_allowed_height ? 'var(--success-400)' : 'var(--danger-400)'};">${height.max_allowed_height} m</div>
          <div style="font-size: 0.85rem; color: ${height.building_height <= height.max_allowed_height ? 'var(--success-400)' : 'var(--danger-400)'}; margin-top: 8px;">
            ${height.building_height <= height.max_allowed_height ? '✓ Sesuai Batas Zonasi' : '✗ Melebihi Batas Zonasi'}
          </div>
        </div>
        ` : ''}
      `
    });
  }

  renderFloorsTab() {
    const floorPlans = this._getData('floorPlans') || [];
    
    return `
      <div id="intensity-tab-floors" class="intensity-tab-content">
        ${InspectionWidgets.renderActionBar([
          { icon: 'plus', label: 'Tambah Data Lantai', variant: 'primary', onclick: `window._inspectionControllers['intensity'].showAddFloorModal()` }
        ])}
        
        ${floorPlans.length > 0
          ? InspectionWidgets.renderDataTable({
              headers: ['Lantai', 'Luas (m²)', 'Fungsi', 'Tinggi (m)', 'Keterangan'],
              rows: floorPlans.map((f, i) => [
                f.floor_number || i + 1,
                this._formatNumber(f.area, 1),
                f.function || '-',
                f.height || '-',
                f.notes || '-'
              ]),
              align: ['center', 'right', 'left', 'right', 'left']
            })
          : InspectionWidgets.renderEmptyState({
              icon: 'building',
              title: 'Belum Ada Data Lantai',
              message: 'Tambahkan data detail setiap lantai.',
              actionLabel: 'Tambah Data Lantai',
              actionOnClick: `window._inspectionControllers['intensity'].showAddFloorModal()`
            })
        }
      </div>
    `;
  }

  showAddFloorModal() { showInfo('Modal tambah data lantai akan ditampilkan'); }

  afterRender() {
    super.afterRender();
    if (typeof window !== 'undefined') {
      window._inspectionControllers = window._inspectionControllers || {};
      window._inspectionControllers['intensity'] = this;
    }
  }
}

let buildingIntensityInspectionInstance = null;

export async function buildingIntensityInspectionPage(params = {}) {
  if (buildingIntensityInspectionInstance) buildingIntensityInspectionInstance.destroy();
  buildingIntensityInspectionInstance = new BuildingIntensityInspection();
  return await buildingIntensityInspectionInstance.initialize(params);
}

export function afterBuildingIntensityInspectionRender() {
  if (buildingIntensityInspectionInstance) buildingIntensityInspectionInstance.afterRender();
}
