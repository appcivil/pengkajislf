// ============================================================
// ENVIRONMENTAL INSPECTION - Clean Architecture Implementation
// ============================================================

import { BaseInspection } from './BaseInspection.js';
import { InspectionWidgets } from '../../components/inspection/inspection-widgets.js';
import { showSuccess, showError, showInfo } from '../../components/toast.js';

export class EnvironmentalInspection extends BaseInspection {
  constructor() {
    super({
      moduleName: 'environmental',
      phaseCode: 'PHASE 05A',
      title: 'Pemeriksaan Dampak Lingkungan',
      badge: 'AMDAL/UKL-UPL',
      icon: 'leaf',
      accentColor: 'var(--success-400)',
      description: 'Evaluasi dampak lingkungan berdasarkan regulasi AMDAL/UKL-UPL. Meliputi udara, air, tanah, dan kebisingan.',
      tables: ['environmental_assessments', 'air_quality_data', 'noise_measurements', 'waste_management_plans']
    });
  }

  async loadData() {
    const projectId = this._state.projectId;
    const data = await this.repository.query('environmental_assessments', { project_id: projectId });
    
    const airQuality = await this.repository.query('air_quality_data', { project_id: projectId });
    const noise = await this.repository.query('noise_measurements', { project_id: projectId });
    const waste = await this.repository.query('waste_management_plans', { project_id: projectId });

    this._setData('assessment', data?.[0] || {});
    this._setData('airQuality', airQuality || []);
    this._setData('noise', noise || []);
    this._setData('wastePlan', waste?.[0] || null);
  }

  getTabs() {
    const data = this._getData.bind(this);
    return [
      { id: 'dashboard', icon: 'chart-pie', label: 'DASHBOARD' },
      { id: 'air', icon: 'wind', label: 'UDARA' },
      { id: 'water', icon: 'tint', label: 'AIR' },
      { id: 'noise', icon: 'volume-up', label: `BISING (${data('noise')?.length || 0})` },
      { id: 'waste', icon: 'recycle', label: 'SAMPAH' },
      { id: 'permit', icon: 'file-alt', label: 'PERIZINAN' }
    ];
  }

  renderTabContent(tabId) {
    switch (tabId) {
      case 'dashboard': return this.renderDashboardTab();
      case 'air': return this.renderAirTab();
      case 'water': return this.renderWaterTab();
      case 'noise': return this.renderNoiseTab();
      case 'waste': return this.renderWasteTab();
      case 'permit': return this.renderPermitTab();
      default: return this.renderDashboardTab();
    }
  }

  renderDashboardTab() {
    const assessment = this._getData('assessment') || {};
    const airQuality = this._getData('airQuality') || [];
    const noise = this._getData('noise') || [];

    const stats = [
      { icon: 'wind', value: airQuality.length, label: 'Pengukuran Udara', sublabel: 'Data', accentColor: 'var(--success-400)' },
      { icon: 'volume-up', value: noise.length, label: 'Pengukuran Bising', sublabel: 'Data', accentColor: 'var(--warning-400)' },
      { icon: 'recycle', value: assessment.waste_categories || 0, label: 'Kategori Sampah', sublabel: 'Jenis', accentColor: 'var(--brand-400)' },
      { icon: 'file-alt', value: assessment.permit_status === 'COMPLETE' ? '✓' : '✗', label: 'Perizinan', sublabel: assessment.permit_status || 'Pending', accentColor: assessment.permit_status === 'COMPLETE' ? 'var(--success-400)' : 'var(--warning-400)' }
    ];

    return `
      <div id="environmental-tab-dashboard" class="environmental-tab-content">
        ${InspectionWidgets.renderStatsGrid(stats)}
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
          ${InspectionWidgets.renderSectionCard({
            title: 'Status AMDAL/UKL-UPL',
            icon: 'file-alt',
            accentColor: 'var(--brand-400)',
            content: `
              <div style="text-align: center; padding: 20px;">
                <div style="font-size: 1.2rem; font-weight: 700; color: ${assessment.amdal_required ? 'var(--warning-400)' : 'var(--success-400)'}; margin-bottom: 12px;">
                  ${assessment.amdal_required ? 'AMDAL Required' : 'UKL-UPL Sufficient'}
                </div>
                <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 16px;">
                  ${assessment.amdal_required 
                    ? 'Bangunan memerlukan Analisis Mengenai Dampak Lingkungan (AMDAL)' 
                    : 'Bangunan cukup dengan Upaya Pengelolaan Lingkungan (UKL-UPL)'}
                </p>
                <div style="font-size: 0.8rem; color: var(--text-tertiary);">
                  Status: <strong style="color: var(--text-primary);">${assessment.amdal_status || 'Belum diajukan'}</strong>
                </div>
              </div>
            `
          })}
          
          ${InspectionWidgets.renderSectionCard({
            title: 'Ringkasan Dampak',
            icon: 'exclamation-triangle',
            accentColor: 'var(--warning-400)',
            content: `
              <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">
                <div style="padding: 12px; background: hsla(220, 20%, 15%, 0.5); border-radius: 8px; text-align: center;">
                  <div style="font-size: 1.5rem; font-weight: 700; color: ${assessment.air_impact === 'LOW' ? 'var(--success-400)' : assessment.air_impact === 'MEDIUM' ? 'var(--warning-400)' : 'var(--danger-400)'};">${assessment.air_impact || '-'}</div>
                  <div style="font-size: 0.75rem; color: var(--text-tertiary);">Dampak Udara</div>
                </div>
                <div style="padding: 12px; background: hsla(220, 20%, 15%, 0.5); border-radius: 8px; text-align: center;">
                  <div style="font-size: 1.5rem; font-weight: 700; color: ${assessment.water_impact === 'LOW' ? 'var(--success-400)' : assessment.water_impact === 'MEDIUM' ? 'var(--warning-400)' : 'var(--danger-400)'};">${assessment.water_impact || '-'}</div>
                  <div style="font-size: 0.75rem; color: var(--text-tertiary);">Dampak Air</div>
                </div>
                <div style="padding: 12px; background: hsla(220, 20%, 15%, 0.5); border-radius: 8px; text-align: center;">
                  <div style="font-size: 1.5rem; font-weight: 700; color: ${assessment.noise_impact === 'LOW' ? 'var(--success-400)' : assessment.noise_impact === 'MEDIUM' ? 'var(--warning-400)' : 'var(--danger-400)'};">${assessment.noise_impact || '-'}</div>
                  <div style="font-size: 0.75rem; color: var(--text-tertiary);">Dampak Kebisingan</div>
                </div>
                <div style="padding: 12px; background: hsla(220, 20%, 15%, 0.5); border-radius: 8px; text-align: center;">
                  <div style="font-size: 1.5rem; font-weight: 700; color: ${assessment.waste_impact === 'LOW' ? 'var(--success-400)' : assessment.waste_impact === 'MEDIUM' ? 'var(--warning-400)' : 'var(--danger-400)'};">${assessment.waste_impact || '-'}</div>
                  <div style="font-size: 0.75rem; color: var(--text-tertiary);">Dampak Sampah</div>
                </div>
              </div>
            `
          })}
        </div>
      </div>
    `;
  }

  renderAirTab() {
    const airQuality = this._getData('airQuality') || [];
    
    return `
      <div id="environmental-tab-air" class="environmental-tab-content">
        ${InspectionWidgets.renderActionBar([
          { icon: 'plus', label: 'Tambah Data Udara', variant: 'primary', onclick: `window._inspectionControllers['environmental'].showAddAirModal()` }
        ])}
        
        ${airQuality.length > 0
          ? InspectionWidgets.renderDataTable({
              headers: ['Waktu', 'Lokasi', 'PM2.5', 'PM10', 'SO2', 'NO2', 'Status'],
              rows: airQuality.map(a => [
                this._formatDate(a.measured_at),
                a.location || '-',
                a.pm25 || '-',
                a.pm10 || '-',
                a.so2 || '-',
                a.no2 || '-',
                this.renderAirStatus(a.status)
              ]),
              align: ['left', 'left', 'center', 'center', 'center', 'center', 'center']
            })
          : InspectionWidgets.renderEmptyState({
              icon: 'wind',
              title: 'Belum Ada Data Udara',
              message: 'Tambahkan data pengukuran kualitas udara.',
              actionLabel: 'Tambah Data',
              actionOnClick: `window._inspectionControllers['environmental'].showAddAirModal()`
            })
        }
      </div>
    `;
  }

  renderAirStatus(status) {
    const colors = { GOOD: 'var(--success-400)', MODERATE: 'var(--warning-400)', UNHEALTHY: 'var(--danger-400)' };
    return `<span style="color: ${colors[status] || 'var(--text-tertiary)'}; font-weight: 600;">${status || '-'}</span>`;
  }

  renderWaterTab() {
    return InspectionWidgets.renderSectionCard({
      title: 'Kualitas Air Limbah',
      icon: 'tint',
      accentColor: 'var(--brand-400)',
      content: InspectionWidgets.renderEmptyState({
        icon: 'vial',
        title: 'Data Kualitas Air',
        message: 'Data pengujian kualitas air limbah akan ditampilkan di sini.'
      })
    });
  }

  renderNoiseTab() {
    const noise = this._getData('noise') || [];
    
    return `
      <div id="environmental-tab-noise" class="environmental-tab-content">
        ${InspectionWidgets.renderActionBar([
          { icon: 'plus', label: 'Tambah Pengukuran', variant: 'primary', onclick: `window._inspectionControllers['environmental'].showAddNoiseModal()` }
        ])}
        
        ${noise.length > 0
          ? InspectionWidgets.renderDataTable({
              headers: ['Waktu', 'Lokasi', 'Day (dB)', 'Night (dB)', 'Status'],
              rows: noise.map(n => [
                this._formatDate(n.measured_at),
                n.location || '-',
                n.day_level || '-',
                n.night_level || '-',
                n.compliance_status === 'COMPLIANT' ? '<span style="color: var(--success-400);">✓ Sesuai</span>' : '<span style="color: var(--warning-400);">✗ Melebihi</span>'
              ]),
              align: ['left', 'left', 'center', 'center', 'center']
            })
          : InspectionWidgets.renderEmptyState({
              icon: 'volume-up',
              title: 'Belum Ada Data Kebisingan',
              message: 'Tambahkan data pengukuran tingkat kebisingan.',
              actionLabel: 'Tambah Data',
              actionOnClick: `window._inspectionControllers['environmental'].showAddNoiseModal()`
            })
        }
      </div>
    `;
  }

  renderWasteTab() {
    const wastePlan = this._getData('wastePlan');
    
    return InspectionWidgets.renderSectionCard({
      title: 'Pengelolaan Sampah',
      icon: 'recycle',
      accentColor: 'var(--success-400)',
      content: wastePlan
        ? `
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;">
            <div>
              <label style="font-size: 0.7rem; color: var(--text-tertiary);">Total Sampah/Hari</label>
              <div style="font-size: 1.5rem; font-weight: 700; color: white;">${this._formatNumber(wastePlan.daily_waste, 1)} kg</div>
            </div>
            <div>
              <label style="font-size: 0.7rem; color: var(--text-tertiary);">Persentase Reduce</label>
              <div style="font-size: 1.5rem; font-weight: 700; color: white;">${wastePlan.reduce_percentage || 0}%</div>
            </div>
            <div>
              <label style="font-size: 0.7rem; color: var(--text-tertiary);">Persentase Reuse</label>
              <div style="font-size: 1.5rem; font-weight: 700; color: white;">${wastePlan.reuse_percentage || 0}%</div>
            </div>
            <div>
              <label style="font-size: 0.7rem; color: var(--text-tertiary);">Persentase Recycle</label>
              <div style="font-size: 1.5rem; font-weight: 700; color: white;">${wastePlan.recycle_percentage || 0}%</div>
            </div>
          </div>
        `
        : InspectionWidgets.renderEmptyState({
            icon: 'recycle',
            title: 'Belum Ada Rencana Pengelolaan',
            message: 'Tambahkan rencana pengelolaan sampah (Reduce, Reuse, Recycle).'
          })
    });
  }

  renderPermitTab() {
    const assessment = this._getData('assessment') || {};
    
    const permits = [
      { name: 'AMDAL/UKL-UPL', status: assessment.amdal_status || 'NOT_SUBMITTED', required: assessment.amdal_required },
      { name: 'Izin Lingkungan', status: assessment.env_permit_status || 'NOT_SUBMITTED', required: true },
      { name: 'Izin Pembuangan Air', status: assessment.waste_discharge_permit || 'NOT_SUBMITTED', required: true }
    ];

    return InspectionWidgets.renderSectionCard({
      title: 'Status Perizinan Lingkungan',
      icon: 'file-alt',
      accentColor: 'var(--brand-400)',
      content: `
        <div style="display: flex; flex-direction: column; gap: 12px;">
          ${permits.map(p => `
            <div style="display: flex; align-items: center; gap: 12px; padding: 16px; background: hsla(220, 20%, 15%, 0.5); border-radius: 10px;">
              <div style="flex: 1;">
                <div style="font-size: 0.9rem; font-weight: 600; color: var(--text-primary);">${p.name}</div>
                <div style="font-size: 0.75rem; color: var(--text-tertiary);">${p.required ? 'Wajib' : 'Opsional'}</div>
              </div>
              <div style="padding: 6px 12px; border-radius: 6px; font-size: 0.75rem; font-weight: 600; 
                background: ${p.status === 'APPROVED' ? 'hsla(160, 100%, 45%, 0.2)' : p.status === 'PROCESSING' ? 'hsla(35, 100%, 50%, 0.2)' : 'hsla(220, 20%, 30%, 0.3)'};
                color: ${p.status === 'APPROVED' ? 'var(--success-400)' : p.status === 'PROCESSING' ? 'var(--warning-400)' : 'var(--text-tertiary)'};">
                ${p.status === 'APPROVED' ? '✓ Disetujui' : p.status === 'PROCESSING' ? '⏳ Diproses' : '✗ Belum Diajukan'}
              </div>
            </div>
          `).join('')}
        </div>
      `
    });
  }

  showAddAirModal() { showInfo('Modal tambah data udara akan ditampilkan'); }
  showAddNoiseModal() { showInfo('Modal tambah data kebisingan akan ditampilkan'); }

  afterRender() {
    super.afterRender();
    if (typeof window !== 'undefined') {
      window._inspectionControllers = window._inspectionControllers || {};
      window._inspectionControllers['environmental'] = this;
    }
  }
}

let environmentalInspectionInstance = null;

export async function environmentalInspectionPage(params = {}) {
  if (environmentalInspectionInstance) environmentalInspectionInstance.destroy();
  environmentalInspectionInstance = new EnvironmentalInspection();
  return await environmentalInspectionInstance.initialize(params);
}

export function afterEnvironmentalInspectionRender() {
  if (environmentalInspectionInstance) environmentalInspectionInstance.afterRender();
}
