// ============================================================
// STORMWATER INSPECTION - Clean Architecture Implementation
// ============================================================

import { BaseInspection } from './BaseInspection.js';
import { InspectionWidgets } from '../../components/inspection/inspection-widgets.js';
import { showSuccess, showError, showInfo } from '../../components/toast.js';

export class StormwaterInspection extends BaseInspection {
  constructor() {
    super({
      moduleName: 'stormwater',
      phaseCode: 'PHASE 04D',
      title: 'Pemeriksaan Pengelolaan Air Hujan',
      badge: 'SNI 2414',
      icon: 'cloud-rain',
      accentColor: 'var(--brand-400)',
      description: 'Evaluasi sistem pengelolaan air hujan berdasarkan SNI 2414:2016. Meliputi drainase, resapan, detensi, dan retensi.',
      tables: ['stormwater_assessments', 'drainage_channels', 'infiltration_wells', 'retention_ponds']
    });

    this.RUNOFF_COEFFICIENTS = {
      roof: 0.95,
      asphalt: 0.85,
      concrete: 0.80,
      grass: 0.25,
      soil: 0.15,
      forest: 0.10
    };
  }

  async loadData() {
    const projectId = this._state.projectId;
    const data = await this.repository.query('stormwater_assessments', { project_id: projectId });
    
    const drainage = await this.repository.query('drainage_channels', { project_id: projectId });
    const infiltration = await this.repository.query('infiltration_wells', { project_id: projectId });
    const retention = await this.repository.query('retention_ponds', { project_id: projectId });

    this._setData('assessment', data?.[0] || {});
    this._setData('drainage', drainage || []);
    this._setData('infiltration', infiltration || []);
    this._setData('retention', retention?.[0] || null);
  }

  getTabs() {
    const data = this._getData.bind(this);
    return [
      { id: 'dashboard', icon: 'chart-pie', label: 'DASHBOARD' },
      { id: 'rainfall', icon: 'cloud-showers-heavy', label: 'CURAH HUJAN' },
      { id: 'drainage', icon: 'water', label: `DRAINASE (${data('drainage')?.length || 0})` },
      { id: 'infiltration', icon: 'arrow-down', label: `RESAPAN (${data('infiltration')?.length || 0})` },
      { id: 'retention', icon: 'database', label: 'RETENSI' },
      { id: 'compliance', icon: 'check-circle', label: 'COMPLIANCE' }
    ];
  }

  renderTabContent(tabId) {
    switch (tabId) {
      case 'dashboard': return this.renderDashboardTab();
      case 'rainfall': return this.renderRainfallTab();
      case 'drainage': return this.renderDrainageTab();
      case 'infiltration': return this.renderInfiltrationTab();
      case 'retention': return this.renderRetentionTab();
      case 'compliance': return this.renderComplianceTab();
      default: return this.renderDashboardTab();
    }
  }

  renderDashboardTab() {
    const assessment = this._getData('assessment') || {};
    const drainage = this._getData('drainage') || [];
    const infiltration = this._getData('infiltration') || [];
    const retention = this._getData('retention');

    const catchmentArea = assessment.catchment_area || 0;
    const runoffCoeff = assessment.runoff_coefficient || 0.7;
    
    const stats = [
      { icon: 'ruler-combined', value: this._formatNumber(catchmentArea, 0), label: 'Catchment Area', sublabel: 'm²', accentColor: 'var(--brand-400)' },
      { icon: 'water', value: this._formatNumber(assessment.peak_runoff, 1), label: 'Debit Puncak', sublabel: 'L/s', accentColor: 'var(--warning-400)' },
      { icon: 'arrow-down', value: infiltration.length, label: 'Sumur Resapan', sublabel: 'Unit', accentColor: 'var(--success-400)' },
      { icon: 'percentage', value: this._formatNumber((1 - runoffCoeff) * 100, 0), label: 'Infiltrasi', sublabel: '% Air Hujan', accentColor: 'var(--success-400)' }
    ];

    return `
      <div id="stormwater-tab-dashboard" class="stormwater-tab-content">
        ${InspectionWidgets.renderStatsGrid(stats)}
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
          ${InspectionWidgets.renderSectionCard({
            title: 'Data Curah Hujan',
            icon: 'cloud-showers-heavy',
            accentColor: 'var(--brand-400)',
            content: `
              <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;">
                <div>
                  <label style="font-size: 0.7rem; color: var(--text-tertiary);">Intensitas (mm/jam)</label>
                  <div style="font-size: 1.2rem; font-weight: 600; color: white;">${assessment.rainfall_intensity || '-'}</div>
                </div>
                <div>
                  <label style="font-size: 0.7rem; color: var(--text-tertiary);">Return Period</label>
                  <div style="font-size: 1.2rem; font-weight: 600; color: white;">${assessment.return_period || '-'} Tahun</div>
                </div>
                <div>
                  <label style="font-size: 0.7rem; color: var(--text-tertiary);">Durasi (menit)</label>
                  <div style="font-size: 1.2rem; font-weight: 600; color: white;">${assessment.duration || '-'}</div>
                </div>
                <div>
                  <label style="font-size: 0.7rem; color: var(--text-tertiary);">Koefisien Limpasan</label>
                  <div style="font-size: 1.2rem; font-weight: 600; color: white;">${runoffCoeff}</div>
                </div>
              </div>
            `
          })}
          
          ${InspectionWidgets.renderSectionCard({
            title: 'Sistem Pengelolaan',
            icon: 'cogs',
            accentColor: 'var(--success-400)',
            content: `
              <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">
                <div style="padding: 12px; background: hsla(220, 20%, 15%, 0.5); border-radius: 8px; text-align: center;">
                  <div style="font-size: 1.5rem; font-weight: 700; color: var(--brand-400);">${drainage.length}</div>
                  <div style="font-size: 0.75rem; color: var(--text-tertiary);">Saluran Drainase</div>
                </div>
                <div style="padding: 12px; background: hsla(220, 20%, 15%, 0.5); border-radius: 8px; text-align: center;">
                  <div style="font-size: 1.5rem; font-weight: 700; color: var(--success-400);">${infiltration.length}</div>
                  <div style="font-size: 0.75rem; color: var(--text-tertiary);">Sumur Resapan</div>
                </div>
                <div style="padding: 12px; background: hsla(220, 20%, 15%, 0.5); border-radius: 8px; text-align: center;">
                  <div style="font-size: 1.5rem; font-weight: 700; color: ${retention ? 'var(--success-400)' : 'var(--text-tertiary)'};">${retention ? '1' : '0'}</div>
                  <div style="font-size: 0.75rem; color: var(--text-tertiary);">Kolam Retensi</div>
                </div>
                <div style="padding: 12px; background: hsla(220, 20%, 15%, 0.5); border-radius: 8px; text-align: center;">
                  <div style="font-size: 1.5rem; font-weight: 700; color: ${assessment.has_reuse ? 'var(--success-400)' : 'var(--text-tertiary)'};">${assessment.has_reuse ? '✓' : '✗'}</div>
                  <div style="font-size: 0.75rem; color: var(--text-tertiary);">Reuse System</div>
                </div>
              </div>
            `
          })}
        </div>
      </div>
    `;
  }

  renderRainfallTab() {
    const assessment = this._getData('assessment') || {};

    return InspectionWidgets.renderSectionCard({
      title: 'Analisis Curah Hujan',
      icon: 'cloud-showers-heavy',
      accentColor: 'var(--brand-400)',
      content: `
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="font-size: 5rem; font-weight: 800; color: var(--brand-400);">${assessment.rainfall_intensity || '-'}</div>
          <div style="font-size: 1rem; color: var(--text-tertiary);">mm/jam</div>
          <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 12px;">
            Periode Ulang: ${assessment.return_period || '-'} Tahun
          </div>
        </div>
        
        <div style="padding: 16px; background: hsla(220, 20%, 15%, 0.5); border-radius: 12px; margin-bottom: 16px;">
          <h4 style="font-size: 0.9rem; color: var(--text-primary); margin-bottom: 12px;">Rumus Rational Method:</h4>
          <code style="font-family: monospace; font-size: 0.85rem; color: var(--brand-400);">
            Q = 0.00278 × C × I × A
          </code>
          <p style="font-size: 0.75rem; color: var(--text-tertiary); margin-top: 8px;">
            Q = Debit (L/s) | C = Koefisien | I = Intensitas (mm/jam) | A = Luas (m²)
          </p>
        </div>
        
        <p style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.6;">
          Perhitungan berdasarkan SNI 2414:2016 tentang Tata Cara Perencanaan Sistem Drainase.
        </p>
      `
    });
  }

  renderDrainageTab() {
    const drainage = this._getData('drainage') || [];
    
    return `
      <div id="stormwater-tab-drainage" class="stormwater-tab-content">
        ${InspectionWidgets.renderActionBar([
          { icon: 'plus', label: 'Tambah Saluran', variant: 'primary', onclick: `window._inspectionControllers['stormwater'].showAddDrainageModal()` }
        ])}
        
        ${drainage.length > 0
          ? InspectionWidgets.renderDataTable({
              headers: ['ID', 'Lokasi', 'Tipe', 'Dimensi (mm)', 'Kemiringan (%)', 'Kapasitas (L/s)', 'Status'],
              rows: drainage.map(d => [
                d.channel_code || d.id?.slice(0, 8),
                d.location || '-',
                d.channel_type || '-',
                d.dimensions || '-',
                d.slope_percent ? d.slope_percent.toFixed(2) + '%' : '-',
                this._formatNumber(d.capacity, 1),
                d.status === 'ACTIVE' ? '<span style="color: var(--success-400);">Aktif</span>' : '<span style="color: var(--warning-400);">Non-Aktif</span>'
              ]),
              align: ['left', 'left', 'left', 'right', 'right', 'right', 'center']
            })
          : InspectionWidgets.renderEmptyState({
              icon: 'water',
              title: 'Belum Ada Data Drainase',
              message: 'Tambahkan data saluran drainase.',
              actionLabel: 'Tambah Saluran',
              actionOnClick: `window._inspectionControllers['stormwater'].showAddDrainageModal()`
            })
        }
      </div>
    `;
  }

  renderInfiltrationTab() {
    const infiltration = this._getData('infiltration') || [];
    
    return `
      <div id="stormwater-tab-infiltration" class="stormwater-tab-content">
        ${InspectionWidgets.renderActionBar([
          { icon: 'plus', label: 'Tambah Sumur Resapan', variant: 'primary', onclick: `window._inspectionControllers['stormwater'].showAddInfiltrationModal()` }
        ])}
        
        ${infiltration.length > 0
          ? InspectionWidgets.renderDataTable({
              headers: ['ID', 'Lokasi', 'Diameter (m)', 'Kedalaman (m)', 'Kapasitas (L)', 'Status'],
              rows: infiltration.map(i => [
                i.well_code || i.id?.slice(0, 8),
                i.location || '-',
                i.diameter || '-',
                i.depth || '-',
                this._formatNumber(i.capacity, 0),
                i.status === 'ACTIVE' ? '<span style="color: var(--success-400);">Aktif</span>' : '<span style="color: var(--warning-400);">Non-Aktif</span>'
              ]),
              align: ['left', 'left', 'right', 'right', 'right', 'center']
            })
          : InspectionWidgets.renderEmptyState({
              icon: 'arrow-down',
              title: 'Belum Ada Sumur Resapan',
              message: 'Tambahkan data sumur resapan air hujan.',
              actionLabel: 'Tambah Sumur Resapan',
              actionOnClick: `window._inspectionControllers['stormwater'].showAddInfiltrationModal()`
            })
        }
      </div>
    `;
  }

  renderRetentionTab() {
    const retention = this._getData('retention');

    return `
      <div id="stormwater-tab-retention" class="stormwater-tab-content">
        ${InspectionWidgets.renderActionBar([
          { icon: 'plus', label: retention ? 'Edit Kolam Retensi' : 'Tambah Kolam Retensi', variant: 'primary', onclick: `window._inspectionControllers['stormwater'].showRetentionModal()` }
        ])}
        
        ${retention
          ? InspectionWidgets.renderSectionCard({
              title: 'Data Kolam Retensi',
              icon: 'database',
              accentColor: 'var(--brand-400)',
              content: `
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;">
                  <div>
                    <label style="font-size: 0.7rem; color: var(--text-tertiary);">Kapasitas</label>
                    <div style="font-size: 1.5rem; font-weight: 700; color: white;">${this._formatNumber(retention.capacity, 0)}</div>
                    <div style="font-size: 0.75rem; color: var(--text-tertiary);">Liter</div>
                  </div>
                  <div>
                    <label style="font-size: 0.7rem; color: var(--text-tertiary);">Luas Permukaan</label>
                    <div style="font-size: 1.5rem; font-weight: 700; color: white;">${this._formatNumber(retention.surface_area, 1)}</div>
                    <div style="font-size: 0.75rem; color: var(--text-tertiary);">m²</div>
                  </div>
                  <div>
                    <label style="font-size: 0.7rem; color: var(--text-tertiary);">Kedalaman</label>
                    <div style="font-size: 1.2rem; font-weight: 600; color: white;">${retention.depth || '-'} m</div>
                  </div>
                  <div>
                    <label style="font-size: 0.7rem; color: var(--text-tertiary);">Status</label>
                    <div style="font-size: 1.2rem; font-weight: 600; color: ${retention.status === 'ACTIVE' ? 'var(--success-400)' : 'var(--warning-400)'};">${retention.status || 'N/A'}</div>
                  </div>
                </div>
              `
            })
          : InspectionWidgets.renderEmptyState({
              icon: 'database',
              title: 'Belum Ada Kolam Retensi',
              message: 'Tambahkan data kolam retensi/detensi.',
              actionLabel: 'Tambah Kolam Retensi',
              actionOnClick: `window._inspectionControllers['stormwater'].showRetentionModal()`
            })
        }
      </div>
    `;
  }

  renderComplianceTab() {
    const assessment = this._getData('assessment') || {};
    const infiltration = this._getData('infiltration') || [];
    
    const score = assessment.compliance_score || 0;
    const requiredInfiltration = Math.ceil((assessment.catchment_area || 0) / 100); // 1 per 100 m²
    const infiltrationOk = infiltration.length >= requiredInfiltration;

    return InspectionWidgets.renderSectionCard({
      title: 'Compliance SNI 2414:2016',
      icon: 'check-circle',
      accentColor: 'var(--success-400)',
      content: `
        <div style="text-align: center; margin-bottom: 24px;">
          ${InspectionWidgets.renderScoreIndicator({ score, label: 'Stormwater Management Compliance', size: 'lg' })}
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 16px;">
          <div style="padding: 16px; background: ${infiltrationOk ? 'hsla(160, 100%, 45%, 0.1)' : 'hsla(0, 80%, 60%, 0.1)'}; border-radius: 10px; text-align: center;">
            <div style="font-size: 1.5rem; font-weight: 700; color: ${infiltrationOk ? 'var(--success-400)' : 'var(--danger-400)'};">${infiltration.length}/${requiredInfiltration}</div>
            <div style="font-size: 0.75rem; color: var(--text-tertiary);">Sumur Resapan (1 per 100m²)</div>
          </div>
          <div style="padding: 16px; background: ${assessment.has_reuse ? 'hsla(160, 100%, 45%, 0.1)' : 'hsla(35, 100%, 50%, 0.1)'}; border-radius: 10px; text-align: center;">
            <div style="font-size: 1.5rem; font-weight: 700; color: ${assessment.has_reuse ? 'var(--success-400)' : 'var(--warning-400)'};">${assessment.has_reuse ? '✓' : '✗'}</div>
            <div style="font-size: 0.75rem; color: var(--text-tertiary);">Sistem Reuse</div>
          </div>
        </div>
        
        <p style="font-size: 0.85rem; color: var(--text-secondary); text-align: center;">
          ${score >= 80 ? '✓ Sistem pengelolaan air hujan memenuhi standar' : 
            score >= 60 ? '⚠ Sebagian sistem perlu perbaikan' : 
            '✗ Sistem tidak memenuhi standar'}
        </p>
      `
    });
  }

  showAddDrainageModal() { showInfo('Modal tambah drainase akan ditampilkan'); }
  showAddInfiltrationModal() { showInfo('Modal tambah sumur resapan akan ditampilkan'); }
  showRetentionModal() { showInfo('Modal kolam retensi akan ditampilkan'); }

  afterRender() {
    super.afterRender();
    if (typeof window !== 'undefined') {
      window._inspectionControllers = window._inspectionControllers || {};
      window._inspectionControllers['stormwater'] = this;
    }
  }
}

let stormwaterInspectionInstance = null;

export async function stormwaterInspectionPage(params = {}) {
  if (stormwaterInspectionInstance) stormwaterInspectionInstance.destroy();
  stormwaterInspectionInstance = new StormwaterInspection();
  return await stormwaterInspectionInstance.initialize(params);
}

export function afterStormwaterInspectionRender() {
  if (stormwaterInspectionInstance) stormwaterInspectionInstance.afterRender();
}
