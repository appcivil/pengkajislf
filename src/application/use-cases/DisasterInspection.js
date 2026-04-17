// ============================================================
// DISASTER INSPECTION - Clean Architecture Implementation
// ============================================================

import { BaseInspection } from './BaseInspection.js';
import { InspectionWidgets } from '../../components/inspection/inspection-widgets.js';
import { showSuccess, showError, showInfo } from '../../components/toast.js';

export class DisasterInspection extends BaseInspection {
  constructor() {
    super({
      moduleName: 'disaster',
      phaseCode: 'PHASE 03C',
      title: 'Pemeriksaan Ketahanan Bencana',
      badge: 'SNI 1726',
      icon: 'house-damage',
      accentColor: 'var(--warning-400)',
      description: 'Evaluasi ketahanan bangunan terhadap bencana berdasarkan SNI 1726:2019 dan SNI 2847. Meliputi ketahanan gempa, angin, dan banjir.',
      tables: ['disaster_assessments', 'structural_analysis', 'emergency_kits', 'evacuation_procedures']
    });

    this.SEISMIC_ZONES = {
      1: { description: 'Rendah', color: 'var(--success-400)' },
      2: { description: 'Sedang', color: 'var(--warning-400)' },
      3: { description: 'Tinggi', color: 'var(--danger-400)' },
      4: { description: 'Sangat Tinggi', color: 'var(--danger-400)' },
      5: { description: 'Ekstrem', color: 'var(--danger-400)' }
    };
  }

  async loadData() {
    const projectId = this._state.projectId;
    const data = await this.repository.query('disaster_assessments', { project_id: projectId });
    
    const structural = await this.repository.query('structural_analysis', { project_id: projectId });
    const kits = await this.repository.query('emergency_kits', { project_id: projectId });
    const procedures = await this.repository.query('evacuation_procedures', { project_id: projectId });

    this._setData('assessment', data?.[0] || {});
    this._setData('structural', structural?.[0] || null);
    this._setData('kits', kits || []);
    this._setData('procedures', procedures?.[0] || null);
  }

  getTabs() {
    const data = this._getData.bind(this);
    return [
      { id: 'dashboard', icon: 'chart-pie', label: 'DASHBOARD' },
      { id: 'earthquake', icon: 'globe-asia', label: 'GEMPA' },
      { id: 'structural', icon: 'building', label: 'STRUKTUR' },
      { id: 'emergency', icon: 'first-aid', label: `DARURAT (${data('kits')?.length || 0})` },
      { id: 'procedures', icon: 'clipboard-list', label: 'SOP' },
      { id: 'compliance', icon: 'check-circle', label: 'COMPLIANCE' }
    ];
  }

  renderTabContent(tabId) {
    switch (tabId) {
      case 'dashboard': return this.renderDashboardTab();
      case 'earthquake': return this.renderEarthquakeTab();
      case 'structural': return this.renderStructuralTab();
      case 'emergency': return this.renderEmergencyTab();
      case 'procedures': return this.renderProceduresTab();
      case 'compliance': return this.renderComplianceTab();
      default: return this.renderDashboardTab();
    }
  }

  renderDashboardTab() {
    const assessment = this._getData('assessment') || {};
    const kits = this._getData('kits') || [];
    const zone = this.SEISMIC_ZONES[assessment.seismic_zone] || this.SEISMIC_ZONES[2];

    const stats = [
      { icon: 'globe-asia', value: assessment.seismic_zone || '-', label: 'Zona Gempa', sublabel: zone.description, accentColor: zone.color },
      { icon: 'wave-square', value: assessment.pga ? assessment.pga.toFixed(2) : '-', label: 'PGA (g)', sublabel: 'Peak Ground Accel', accentColor: 'var(--brand-400)' },
      { icon: 'building', value: assessment.structure_type || '-', label: 'Sistem Struktur', sublabel: 'Type', accentColor: 'var(--success-400)' },
      { icon: 'first-aid', value: kits.length, label: 'Emergency Kits', sublabel: 'Unit', accentColor: kits.length > 0 ? 'var(--success-400)' : 'var(--warning-400)' }
    ];

    return `
      <div id="disaster-tab-dashboard" class="disaster-tab-content">
        ${InspectionWidgets.renderStatsGrid(stats)}
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
          ${InspectionWidgets.renderSectionCard({
            title: 'Resiko Bencana',
            icon: 'exclamation-triangle',
            accentColor: 'var(--warning-400)',
            content: `
              <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">
                ${[
                  { name: 'Gempa Bumi', level: assessment.earthquake_risk || 'MEDIUM' },
                  { name: 'Angin Kencang', level: assessment.wind_risk || 'LOW' },
                  { name: 'Banjir', level: assessment.flood_risk || 'LOW' },
                  { name: 'Kebakaran', level: assessment.fire_risk || 'MEDIUM' }
                ].map(risk => `
                  <div style="padding: 16px; background: hsla(220, 20%, 15%, 0.5); border-radius: 10px; text-align: center;">
                    <div style="font-size: 0.85rem; color: var(--text-tertiary); margin-bottom: 4px;">${risk.name}</div>
                    <div style="font-size: 1.2rem; font-weight: 700; color: ${risk.level === 'LOW' ? 'var(--success-400)' : risk.level === 'MEDIUM' ? 'var(--warning-400)' : 'var(--danger-400)'};">${risk.level}</div>
                  </div>
                `).join('')}
              </div>
            `
          })}
          
          ${InspectionWidgets.renderSectionCard({
            title: 'Status SOP',
            icon: 'clipboard-list',
            accentColor: 'var(--brand-400)',
            content: `
              <div style="text-align: center; padding: 20px;">
                <div style="font-size: 4rem; color: ${this._getData('procedures') ? 'var(--success-400)' : 'var(--warning-400)'}; margin-bottom: 12px;">
                  <i class="fas fa-${this._getData('procedures') ? 'file-alt' : 'file-excel'}"></i>
                </div>
                <div style="font-size: 1rem; font-weight: 600; color: ${this._getData('procedures') ? 'var(--success-400)' : 'var(--warning-400)'};">
                  ${this._getData('procedures') ? 'SOP Tersedia' : 'SOP Belum Tersedia'}
                </div>
                ${this._getData('procedures') ? `
                <div style="font-size: 0.85rem; color: var(--text-tertiary); margin-top: 8px;">
                  Terakhir Update: ${this._formatDate(this._getData('procedures').updated_at)}
                </div>
                ` : ''}
              </div>
            `
          })}
        </div>
      </div>
    `;
  }

  renderEarthquakeTab() {
    const assessment = this._getData('assessment') || {};
    const zone = this.SEISMIC_ZONES[assessment.seismic_zone] || this.SEISMIC_ZONES[2];

    return InspectionWidgets.renderSectionCard({
      title: 'Analisis Gempa (SNI 1726:2019)',
      icon: 'globe-asia',
      accentColor: zone.color,
      content: `
        <div style="text-align: center; margin-bottom: 24px; padding: 30px; background: ${zone.color}15; border-radius: 16px;">
          <div style="font-size: 6rem; font-weight: 800; color: ${zone.color};">${assessment.seismic_zone || '-'}</div>
          <div style="font-size: 1.2rem; color: var(--text-secondary); margin-top: 8px;">Zona Gempa</div>
          <div style="font-size: 1rem; color: ${zone.color}; margin-top: 4px;">${zone.description}</div>
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 16px;">
          <div class="card-quartz" style="padding: 20px;">
            <div style="font-size: 0.8rem; color: var(--text-tertiary); margin-bottom: 4px;">PGA (Peak Ground Acceleration)</div>
            <div style="font-size: 2rem; font-weight: 700; color: white;">${assessment.pga ? assessment.pga.toFixed(3) : '-'} <span style="font-size: 1rem;">g</span></div>
          </div>
          <div class="card-quartz" style="padding: 20px;">
            <div style="font-size: 0.8rem; color: var(--text-tertiary); margin-bottom: 4px;">Ss (Spectral Accel Short)</div>
            <div style="font-size: 2rem; font-weight: 700; color: white;">${assessment.ss ? assessment.ss.toFixed(3) : '-'} <span style="font-size: 1rem;">g</span></div>
          </div>
          <div class="card-quartz" style="padding: 20px;">
            <div style="font-size: 0.8rem; color: var(--text-tertiary); margin-bottom: 4px;">S1 (Spectral Accel 1s)</div>
            <div style="font-size: 2rem; font-weight: 700; color: white;">${assessment.s1 ? assessment.s1.toFixed(3) : '-'} <span style="font-size: 1rem;">g</span></div>
          </div>
          <div class="card-quartz" style="padding: 20px;">
            <div style="font-size: 0.8rem; color: var(--text-tertiary); margin-bottom: 4px;">Faktor Keutamaan (Ie)</div>
            <div style="font-size: 2rem; font-weight: 700; color: white;">${assessment.importance_factor || '-'}</div>
          </div>
        </div>
        
        <div style="padding: 16px; background: hsla(220, 20%, 15%, 0.5); border-radius: 12px;">
          <h4 style="font-size: 0.9rem; color: var(--text-primary); margin-bottom: 12px;">Parameter Desain Gempa:</h4>
          <div style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.6;">
            <p><strong>SDs:</strong> ${assessment.sds ? assessment.sds.toFixed(3) : '-'} g (Design Spectral Response Short Period)</p>
            <p><strong>SD1:</strong> ${assessment.sd1 ? assessment.sd1.toFixed(3) : '-'} g (Design Spectral Response 1s Period)</p>
            <p><strong>T0:</strong> ${assessment.t0 ? assessment.t0.toFixed(3) : '-'} s (Initial Period)</p>
            <p><strong>Ts:</strong> ${assessment.ts ? assessment.ts.toFixed(3) : '-'} s (Characteristic Period)</p>
          </div>
        </div>
      `
    });
  }

  renderStructuralTab() {
    const structural = this._getData('structural') || {};

    return InspectionWidgets.renderSectionCard({
      title: 'Analisis Struktur',
      icon: 'building',
      accentColor: 'var(--brand-400)',
      content: `
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;">
          <div class="card-quartz" style="padding: 20px;">
            <div style="font-size: 0.8rem; color: var(--text-tertiary); margin-bottom: 4px;">Sistem Struktur</div>
            <div style="font-size: 1.2rem; font-weight: 600; color: white;">${structural.system_type || '-'}</div>
          </div>
          <div class="card-quartz" style="padding: 20px;">
            <div style="font-size: 0.8rem; color: var(--text-tertiary); margin-bottom: 4px;">Material Utama</div>
            <div style="font-size: 1.2rem; font-weight: 600; color: white;">${structural.material || '-'}</div>
          </div>
          <div class="card-quartz" style="padding: 20px;">
            <div style="font-size: 0.8rem; color: var(--text-tertiary); margin-bottom: 4px;">Faktor Reduksi (R)</div>
            <div style="font-size: 1.2rem; font-weight: 600; color: white;">${structural.r_factor || '-'}</div>
          </div>
          <div class="card-quartz" style="padding: 20px;">
            <div style="font-size: 0.8rem; color: var(--text-tertiary); margin-bottom: 4px;">Perioda Struktur (T)</div>
            <div style="font-size: 1.2rem; font-weight: 600; color: white;">${structural.period ? structural.period.toFixed(3) + ' s' : '-'}</div>
          </div>
        </div>
        
        <div style="margin-top: 20px; padding: 20px; background: hsla(220, 20%, 15%, 0.5); border-radius: 12px;">
          <h4 style="font-size: 0.9rem; color: var(--text-primary); margin-bottom: 16px;">Hasil Analisis ETABS:</h4>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;">
            <div style="text-align: center;">
              <div style="font-size: 0.75rem; color: var(--text-tertiary);">Base Shear X</div>
              <div style="font-size: 1.1rem; font-weight: 600; color: white;">${structural.base_shear_x ? this._formatNumber(structural.base_shear_x, 1) + ' kN' : '-'}</div>
            </div>
            <div style="text-align: center;">
              <div style="font-size: 0.75rem; color: var(--text-tertiary);">Base Shear Y</div>
              <div style="font-size: 1.1rem; font-weight: 600; color: white;">${structural.base_shear_y ? this._formatNumber(structural.base_shear_y, 1) + ' kN' : '-'}</div>
            </div>
            <div style="text-align: center;">
              <div style="font-size: 0.75rem; color: var(--text-tertiary);">Max Drift</div>
              <div style="font-size: 1.1rem; font-weight: 600; color: ${structural.max_drift && structural.max_drift <= 0.02 ? 'var(--success-400)' : 'var(--warning-400)'};">${structural.max_drift ? (structural.max_drift * 100).toFixed(3) + '%' : '-'}</div>
            </div>
          </div>
        </div>
      `
    });
  }

  renderEmergencyTab() {
    const kits = this._getData('kits') || [];
    
    return `
      <div id="disaster-tab-emergency" class="disaster-tab-content">
        ${InspectionWidgets.renderActionBar([
          { icon: 'plus', label: 'Tambah Emergency Kit', variant: 'primary', onclick: `window._inspectionControllers['disaster'].showAddKitModal()` }
        ])}
        
        ${kits.length > 0
          ? InspectionWidgets.renderDataTable({
              headers: ['ID', 'Lokasi', 'Isi', 'Expired', 'Terakhir Cek', 'Status'],
              rows: kits.map(k => [
                k.kit_code || k.id?.slice(0, 8),
                k.location || '-',
                k.contents || '-',
                k.expiry_date ? this._formatDate(k.expiry_date) : '-',
                k.last_checked ? this._formatDate(k.last_checked) : '-',
                k.status === 'READY' ? '<span style="color: var(--success-400);">✓ Ready</span>' : '<span style="color: var(--warning-400);">⚠ Perlu Cek</span>'
              ]),
              align: ['left', 'left', 'left', 'left', 'left', 'center']
            })
          : InspectionWidgets.renderEmptyState({
              icon: 'first-aid',
              title: 'Belum Ada Emergency Kit',
              message: 'Tambahkan emergency kit untuk kesiapsiagaan bencana.',
              actionLabel: 'Tambah Kit',
              actionOnClick: `window._inspectionControllers['disaster'].showAddKitModal()`
            })
        }
      </div>
    `;
  }

  renderProceduresTab() {
    const procedures = this._getData('procedures');

    return InspectionWidgets.renderSectionCard({
      title: 'SOP Evakuasi & Tanggap Darurat',
      icon: 'clipboard-list',
      accentColor: 'var(--brand-400)',
      content: procedures
        ? `
          <div style="margin-bottom: 20px;">
            <h4 style="font-size: 0.9rem; color: var(--text-primary); margin-bottom: 12px;">Dokumen Tersedia:</h4>
            <div style="display: flex; flex-direction: column; gap: 8px;">
              ${procedures.has_earthquake_sop ? `<div style="padding: 10px 16px; background: hsla(160, 100%, 45%, 0.1); border-radius: 8px; color: var(--success-400);"><i class="fas fa-check" style="margin-right: 8px;"></i>SOP Gempa Bumi</div>` : ''}
              ${procedures.has_fire_sop ? `<div style="padding: 10px 16px; background: hsla(160, 100%, 45%, 0.1); border-radius: 8px; color: var(--success-400);"><i class="fas fa-check" style="margin-right: 8px;"></i>SOP Kebakaran</div>` : ''}
              ${procedures.has_flood_sop ? `<div style="padding: 10px 16px; background: hsla(160, 100%, 45%, 0.1); border-radius: 8px; color: var(--success-400);"><i class="fas fa-check" style="margin-right: 8px;"></i>SOP Banjir</div>` : ''}
              ${procedures.has_evacuation_sop ? `<div style="padding: 10px 16px; background: hsla(160, 100%, 45%, 0.1); border-radius: 8px; color: var(--success-400);"><i class="fas fa-check" style="margin-right: 8px;"></i>SOP Evakuasi</div>` : ''}
            </div>
          </div>
          <div style="font-size: 0.85rem; color: var(--text-tertiary);">
            Terakhir Update: ${this._formatDate(procedures.updated_at)}
          </div>
        `
        : InspectionWidgets.renderEmptyState({
            icon: 'clipboard-list',
            title: 'SOP Belum Tersedia',
            message: 'Upload SOP evakuasi dan tanggap darurat.'
          })
    });
  }

  renderComplianceTab() {
    const assessment = this._getData('assessment') || {};
    const kits = this._getData('kits') || [];
    const procedures = this._getData('procedures');

    const checks = [
      { name: 'Zona Gempa Teridentifikasi', passed: !!assessment.seismic_zone, value: `Zona ${assessment.seismic_zone || '-'}` },
      { name: 'Analisis Struktur', passed: !!this._getData('structural'), value: 'ETABS' },
      { name: 'Emergency Kit', passed: kits.length > 0, value: `${kits.length} kit` },
      { name: 'SOP Tersedia', passed: !!procedures, value: procedures ? 'Ada' : 'Tidak' }
    ];

    const passedCount = checks.filter(c => c.passed).length;
    const overallScore = Math.round((passedCount / checks.length) * 100);

    return `
      <div id="disaster-tab-compliance" class="disaster-tab-content">
        ${InspectionWidgets.renderScoreIndicator({ score: overallScore, label: 'Disaster Preparedness', size: 'lg' })}
        
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

  showAddKitModal() { showInfo('Modal tambah emergency kit akan ditampilkan'); }

  afterRender() {
    super.afterRender();
    if (typeof window !== 'undefined') {
      window._inspectionControllers = window._inspectionControllers || {};
      window._inspectionControllers['disaster'] = this;
    }
  }
}

let disasterInspectionInstance = null;

export async function disasterInspectionPage(params = {}) {
  if (disasterInspectionInstance) disasterInspectionInstance.destroy();
  disasterInspectionInstance = new DisasterInspection();
  return await disasterInspectionInstance.initialize(params);
}

export function afterDisasterInspectionRender() {
  if (disasterInspectionInstance) disasterInspectionInstance.afterRender();
}
