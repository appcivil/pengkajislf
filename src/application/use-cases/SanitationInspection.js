// ============================================================
// SANITATION INSPECTION - Clean Architecture Implementation
// ============================================================

import { BaseInspection } from './BaseInspection.js';
import { InspectionWidgets } from '../../components/inspection/inspection-widgets.js';
import { showSuccess, showError, showInfo } from '../../components/toast.js';

export class SanitationInspection extends BaseInspection {
  constructor() {
    super({
      moduleName: 'sanitation',
      phaseCode: 'PHASE 04C',
      title: 'Pemeriksaan Sanitasi',
      badge: 'Permenkes',
      icon: 'broom',
      accentColor: 'var(--success-400)',
      description: 'Evaluasi sistem sanitasi dan pembuangan kotoran berdasarkan Permenkes dan SNI. Meliputi toilet, septic tank, dan pengelolaan sampah.',
      tables: ['sanitation_assessments', 'toilet_units', 'septic_tanks', 'waste_bins']
    });

    this.TOILET_STANDARDS = {
      male_ratio: 50, // 1 toilet per 50 orang
      female_ratio: 25, // 1 toilet per 25 orang
      special_ratio: 100 // 1 toilet difabel per 100 orang
    };
  }

  async loadData() {
    const projectId = this._state.projectId;
    
    const toilets = await this.repository.query('toilet_units', { project_id: projectId });
    const septic = await this.repository.query('septic_tanks', { project_id: projectId });
    const bins = await this.repository.query('waste_bins', { project_id: projectId });

    this._setData('toilets', toilets || []);
    this._setData('septic', septic?.[0] || null);
    this._setData('bins', bins || []);
  }

  getTabs() {
    const data = this._getData.bind(this);
    return [
      { id: 'dashboard', icon: 'chart-pie', label: 'DASHBOARD' },
      { id: 'toilets', icon: 'restroom', label: `TOILET (${data('toilets')?.length || 0})` },
      { id: 'septic', icon: 'trash-alt', label: 'SEPTIC TANK' },
      { id: 'waste', icon: 'recycle', label: `SAMPAH (${data('bins')?.length || 0})` },
      { id: 'compliance', icon: 'check-circle', label: 'COMPLIANCE' }
    ];
  }

  renderTabContent(tabId) {
    switch (tabId) {
      case 'dashboard': return this.renderDashboardTab();
      case 'toilets': return this.renderToiletsTab();
      case 'septic': return this.renderSepticTab();
      case 'waste': return this.renderWasteTab();
      case 'compliance': return this.renderComplianceTab();
      default: return this.renderDashboardTab();
    }
  }

  renderDashboardTab() {
    const toilets = this._getData('toilets') || [];
    const septic = this._getData('septic');
    const bins = this._getData('bins') || [];
    const { projectData } = this._state;

    const maleToilets = toilets.filter(t => t.type === 'MALE').length;
    const femaleToilets = toilets.filter(t => t.type === 'FEMALE').length;
    const specialToilets = toilets.filter(t => t.type === 'SPECIAL').length;

    const stats = [
      { icon: 'restroom', value: toilets.length, label: 'Total Toilet', sublabel: `${maleToilets} Pria, ${femaleToilets} Wanita`, accentColor: 'var(--brand-400)' },
      { icon: 'wheelchair', value: specialToilets, label: 'Toilet Difabel', sublabel: 'Special', accentColor: 'var(--success-400)' },
      { icon: 'trash-alt', value: septic ? '1' : '0', label: 'Septic Tank', sublabel: septic?.status || 'N/A', accentColor: septic ? 'var(--success-400)' : 'var(--warning-400)' },
      { icon: 'recycle', value: bins.length, label: 'Tempat Sampah', sublabel: 'Bins', accentColor: 'var(--warning-400)' }
    ];

    return `
      <div id="sanitation-tab-dashboard" class="sanitation-tab-content">
        ${InspectionWidgets.renderStatsGrid(stats)}
        
        ${InspectionWidgets.renderSectionCard({
          title: 'Standar Sanitasi',
          icon: 'book',
          accentColor: 'var(--brand-400)',
          content: `
            <div style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.6;">
              <p style="margin-bottom: 8px;"><strong>Permenkes No. 3/2014:</strong> Persyaratan kesehatan lingkungan</p>
              <p style="margin-bottom: 8px;"><strong>Perbandingan Toilet:</strong></p>
              <ul style="margin-left: 20px; margin-bottom: 12px;">
                <li>Pria: 1 per ${this.TOILET_STANDARDS.male_ratio} orang</li>
                <li>Wanita: 1 per ${this.TOILET_STANDARDS.female_ratio} orang</li>
                <li>Difabel: 1 per ${this.TOILET_STANDARDS.special_ratio} orang</li>
              </ul>
            </div>
          `
        })}
      </div>
    `;
  }

  renderToiletsTab() {
    const toilets = this._getData('toilets') || [];
    
    return `
      <div id="sanitation-tab-toilets" class="sanitation-tab-content">
        ${InspectionWidgets.renderActionBar([
          { icon: 'plus', label: 'Tambah Toilet', variant: 'primary', onclick: `window._inspectionControllers['sanitation'].showAddToiletModal()` }
        ])}
        
        ${toilets.length > 0
          ? InspectionWidgets.renderDataTable({
              headers: ['ID', 'Lokasi', 'Tipe', 'Jumlah', 'Difabel', 'Status'],
              rows: toilets.map(t => [
                t.toilet_code || t.id?.slice(0, 8),
                t.location || '-',
                t.type || '-',
                t.count || '1',
                t.has_special ? '✓' : '✗',
                t.status === 'ACTIVE' ? '<span style="color: var(--success-400);">Aktif</span>' : '<span style="color: var(--warning-400);">Non-Aktif</span>'
              ]),
              align: ['left', 'left', 'center', 'center', 'center', 'center']
            })
          : InspectionWidgets.renderEmptyState({
              icon: 'restroom',
              title: 'Belum Ada Data Toilet',
              message: 'Tambahkan data unit toilet.',
              actionLabel: 'Tambah Toilet',
              actionOnClick: `window._inspectionControllers['sanitation'].showAddToiletModal()`
            })
        }
      </div>
    `;
  }

  renderSepticTab() {
    const septic = this._getData('septic');
    
    return `
      <div id="sanitation-tab-septic" class="sanitation-tab-content">
        ${InspectionWidgets.renderActionBar([
          { icon: 'plus', label: septic ? 'Edit Septic Tank' : 'Tambah Septic Tank', variant: 'primary', onclick: `window._inspectionControllers['sanitation'].showSepticModal()` }
        ])}
        
        ${septic
          ? InspectionWidgets.renderSectionCard({
              title: 'Data Septic Tank',
              icon: 'trash-alt',
              accentColor: 'var(--warning-400)',
              content: `
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;">
                  <div>
                    <label style="font-size: 0.7rem; color: var(--text-tertiary);">Kapasitas</label>
                    <div style="font-size: 1.2rem; font-weight: 600; color: white;">${this._formatNumber(septic.capacity, 0)} Liter</div>
                  </div>
                  <div>
                    <label style="font-size: 0.7rem; color: var(--text-tertiary);">Dimensi</label>
                    <div style="font-size: 1.2rem; font-weight: 600; color: white;">${septic.dimensions || '-'}</div>
                  </div>
                  <div>
                    <label style="font-size: 0.7rem; color: var(--text-tertiary);">Material</label>
                    <div style="font-size: 1.2rem; font-weight: 600; color: white;">${septic.material || '-'}</div>
                  </div>
                  <div>
                    <label style="font-size: 0.7rem; color: var(--text-tertiary);">Terakhir Sedot</label>
                    <div style="font-size: 1.2rem; font-weight: 600; color: ${septic.last_pumped ? 'var(--success-400)' : 'var(--warning-400)'};">${septic.last_pumped ? this._formatDate(septic.last_pumped) : 'Belum pernah'}</div>
                  </div>
                </div>
              `
            })
          : InspectionWidgets.renderEmptyState({
              icon: 'trash-alt',
              title: 'Belum Ada Data Septic Tank',
              message: 'Tambahkan data septic tank.',
              actionLabel: 'Tambah Septic Tank',
              actionOnClick: `window._inspectionControllers['sanitation'].showSepticModal()`
            })
        }
      </div>
    `;
  }

  renderWasteTab() {
    const bins = this._getData('bins') || [];
    
    return `
      <div id="sanitation-tab-waste" class="sanitation-tab-content">
        ${InspectionWidgets.renderActionBar([
          { icon: 'plus', label: 'Tambah Tempat Sampah', variant: 'primary', onclick: `window._inspectionControllers['sanitation'].showAddBinModal()` }
        ])}
        
        ${bins.length > 0
          ? InspectionWidgets.renderDataTable({
              headers: ['ID', 'Lokasi', 'Tipe', 'Kapasitas (L)', 'Status'],
              rows: bins.map(b => [
                b.bin_code || b.id?.slice(0, 8),
                b.location || '-',
                b.waste_type || '-',
                b.capacity || '-',
                b.status === 'ACTIVE' ? '<span style="color: var(--success-400);">Aktif</span>' : '<span style="color: var(--warning-400);">Non-Aktif</span>'
              ]),
              align: ['left', 'left', 'left', 'right', 'center']
            })
          : InspectionWidgets.renderEmptyState({
              icon: 'recycle',
              title: 'Belum Ada Data Sampah',
              message: 'Tambahkan data tempat sampah.',
              actionLabel: 'Tambah Tempat Sampah',
              actionOnClick: `window._inspectionControllers['sanitation'].showAddBinModal()`
            })
        }
      </div>
    `;
  }

  renderComplianceTab() {
    return InspectionWidgets.renderSectionCard({
      title: 'Compliance Check Permenkes',
      icon: 'check-circle',
      accentColor: 'var(--success-400)',
      content: InspectionWidgets.renderEmptyState({
        icon: 'clipboard-check',
        title: 'Sanitation Compliance',
        message: 'Evaluasi compliance sistem sanitasi akan ditampilkan di sini.'
      })
    });
  }

  showAddToiletModal() { showInfo('Modal tambah toilet akan ditampilkan'); }
  showSepticModal() { showInfo('Modal septic tank akan ditampilkan'); }
  showAddBinModal() { showInfo('Modal tambah tempat sampah akan ditampilkan'); }

  afterRender() {
    super.afterRender();
    if (typeof window !== 'undefined') {
      window._inspectionControllers = window._inspectionControllers || {};
      window._inspectionControllers['sanitation'] = this;
    }
  }
}

let sanitationInspectionInstance = null;

export async function sanitationInspectionPage(params = {}) {
  if (sanitationInspectionInstance) sanitationInspectionInstance.destroy();
  sanitationInspectionInstance = new SanitationInspection();
  return await sanitationInspectionInstance.initialize(params);
}

export function afterSanitationInspectionRender() {
  if (sanitationInspectionInstance) sanitationInspectionInstance.afterRender();
}
