// ============================================================
// LPS (LIGHTNING PROTECTION SYSTEM) INSPECTION - Clean Architecture
// ============================================================

import { BaseInspection } from './BaseInspection.js';
import { InspectionWidgets } from '../../components/inspection/inspection-widgets.js';
import { showSuccess, showError, showInfo } from '../../components/toast.js';

export class LPSInspection extends BaseInspection {
  constructor() {
    super({
      moduleName: 'lps',
      phaseCode: 'PHASE 02E',
      title: 'Pemeriksaan Sistem Proteksi Petir',
      badge: 'SNI 2848:2020',
      icon: 'bolt',
      accentColor: 'var(--warning-400)',
      description: 'Evaluasi sistem proteksi petir berdasarkan SNI 2848:2020. Meliputi air terminal, down conductor, grounding, dan surge protection.',
      tables: ['lps_assessments', 'lps_air_terminals', 'lps_grounding', 'lspd_units']
    });

    this.LPS_LEVELS = {
      I: { description: 'Special protection', rolling_sphere: '20m' },
      II: { description: 'High protection', rolling_sphere: '30m' },
      III: { description: 'Normal protection', rolling_sphere: '45m' },
      IV: { description: 'Basic protection', rolling_sphere: '60m' }
    };

    this.GROUNDING_MAX_RESISTANCE = 10; // ohm
  }

  async loadData() {
    const projectId = this._state.projectId;
    const data = await this.repository.query('lps_assessments', { project_id: projectId });
    
    const airTerminals = await this.repository.query('lps_air_terminals', { project_id: projectId });
    const grounding = await this.repository.query('lps_grounding', { project_id: projectId });
    const spd = await this.repository.query('lspd_units', { project_id: projectId });

    this._setData('assessment', data?.[0] || {});
    this._setData('airTerminals', airTerminals || []);
    this._setData('grounding', grounding?.[0] || null);
    this._setData('spd', spd || []);
  }

  getTabs() {
    const data = this._getData.bind(this);
    return [
      { id: 'dashboard', icon: 'chart-pie', label: 'DASHBOARD' },
      { id: 'risk', icon: 'calculator', label: 'RISK ASSESSMENT' },
      { id: 'external', icon: 'broadcast-tower', label: `EXTERNAL (${data('airTerminals')?.length || 0})` },
      { id: 'grounding', icon: 'globe', label: 'GROUNDING' },
      { id: 'internal', icon: 'plug', label: `SPD (${data('spd')?.length || 0})` },
      { id: 'compliance', icon: 'check-circle', label: 'COMPLIANCE' }
    ];
  }

  renderTabContent(tabId) {
    switch (tabId) {
      case 'dashboard': return this.renderDashboardTab();
      case 'risk': return this.renderRiskTab();
      case 'external': return this.renderExternalTab();
      case 'grounding': return this.renderGroundingTab();
      case 'internal': return this.renderInternalTab();
      case 'compliance': return this.renderComplianceTab();
      default: return this.renderDashboardTab();
    }
  }

  renderDashboardTab() {
    const assessment = this._getData('assessment') || {};
    const airTerminals = this._getData('airTerminals') || [];
    const grounding = this._getData('grounding');
    const spd = this._getData('spd') || [];

    const lpsLevel = assessment.lps_class || 'IV';
    const levelConfig = this.LPS_LEVELS[lpsLevel] || this.LPS_LEVELS.IV;

    const stats = [
      { icon: 'bolt', value: lpsLevel, label: 'LPS Class', sublabel: levelConfig.description, accentColor: 'var(--warning-400)' },
      { icon: 'broadcast-tower', value: airTerminals.length, label: 'Air Terminals', sublabel: 'Penangkal', accentColor: 'var(--brand-400)' },
      { icon: 'globe', value: grounding ? this._formatNumber(grounding.resistance, 1) : '-', label: 'Grounding', sublabel: 'Ω Resistance', accentColor: grounding?.resistance <= this.GROUNDING_MAX_RESISTANCE ? 'var(--success-400)' : 'var(--danger-400)' },
      { icon: 'plug', value: spd.length, label: 'SPD Units', sublabel: 'Surge Protection', accentColor: 'var(--success-400)' }
    ];

    return `
      <div id="lps-tab-dashboard" class="lps-tab-content">
        ${InspectionWidgets.renderStatsGrid(stats)}
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
          ${InspectionWidgets.renderSectionCard({
            title: 'Karakteristik Petir',
            icon: 'cloud-bolt',
            accentColor: 'var(--warning-400)',
            content: `
              <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;">
                <div>
                  <label style="font-size: 0.7rem; color: var(--text-tertiary);">Ng (Thunder Days/Year)</label>
                  <div style="font-size: 1.2rem; font-weight: 600; color: white;">${assessment.thunder_days || '-'}</div>
                </div>
                <div>
                  <label style="font-size: 0.7rem; color: var(--text-tertiary);">Collection Area (Ae)</label>
                  <div style="font-size: 1.2rem; font-weight: 600; color: white;">${assessment.collection_area ? assessment.collection_area + ' m²' : '-'}</div>
                </div>
                <div>
                  <label style="font-size: 0.7rem; color: var(--text-tertiary);">Risk Level</label>
                  <div style="font-size: 1.2rem; font-weight: 600; color: ${assessment.risk_level === 'HIGH' ? 'var(--danger-400)' : assessment.risk_level === 'MEDIUM' ? 'var(--warning-400)' : 'var(--success-400)'};">${assessment.risk_level || '-'}</div>
                </div>
                <div>
                  <label style="font-size: 0.7rem; color: var(--text-tertiary);">Rolling Sphere</label>
                  <div style="font-size: 1.2rem; font-weight: 600; color: white;">${levelConfig.rolling_sphere}</div>
                </div>
              </div>
            `
          })}
          
          ${InspectionWidgets.renderSectionCard({
            title: 'Standar SNI 2848:2020',
            icon: 'book',
            accentColor: 'var(--brand-400)',
            content: `
              <div style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.6;">
                <p style="margin-bottom: 8px;"><strong>Sistem Proteksi Petir:</strong></p>
                <ul style="margin-left: 20px; margin-bottom: 12px;">
                  <li>External LPS: Air terminal, down conductor, earth termination</li>
                  <li>Internal LPS: Equipotential bonding, SPD</li>
                </ul>
                <p><strong>Resistansi Grounding:</strong> Maksimum ${this.GROUNDING_MAX_RESISTANCE} Ω</p>
              </div>
            `
          })}
        </div>
      </div>
    `;
  }

  renderRiskTab() {
    const assessment = this._getData('assessment') || {};

    return InspectionWidgets.renderSectionCard({
      title: 'Lightning Risk Assessment',
      icon: 'calculator',
      accentColor: 'var(--brand-400)',
      content: `
        <div style="text-align: center; margin-bottom: 24px;">
          ${InspectionWidgets.renderScoreIndicator({ 
            score: assessment.risk_score || 0, 
            label: 'Risk Level Score', 
            size: 'lg' 
          })}
        </div>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;">
          <div class="card-quartz" style="padding: 16px;">
            <div style="font-size: 0.8rem; color: var(--text-tertiary); margin-bottom: 4px;">Probability of Damage (Pd)</div>
            <div style="font-size: 1.5rem; font-weight: 700; color: white;">${assessment.pd || '-'}</div>
          </div>
          <div class="card-quartz" style="padding: 16px;">
            <div style="font-size: 0.8rem; color: var(--text-tertiary); margin-bottom: 4px;">Loss Due to Lightning (Lf)</div>
            <div style="font-size: 1.5rem; font-weight: 700; color: white;">${assessment.lf || '-'}</div>
          </div>
        </div>
      `
    });
  }

  renderExternalTab() {
    const airTerminals = this._getData('airTerminals') || [];
    
    return `
      <div id="lps-tab-external" class="lps-tab-content">
        ${InspectionWidgets.renderActionBar([
          { icon: 'plus', label: 'Tambah Air Terminal', variant: 'primary', onclick: `window._inspectionControllers['lps'].showAddAirTerminalModal()` }
        ])}
        
        ${airTerminals.length > 0
          ? InspectionWidgets.renderDataTable({
              headers: ['ID', 'Lokasi', 'Tipe', 'Tinggi (m)', 'Material', 'Status'],
              rows: airTerminals.map(at => [
                at.terminal_code || at.id?.slice(0, 8),
                at.location || '-',
                at.terminal_type || '-',
                at.height || '-',
                at.material || '-',
                at.status === 'ACTIVE' ? '<span style="color: var(--success-400);">Aktif</span>' : '<span style="color: var(--warning-400);">Non-Aktif</span>'
              ]),
              align: ['left', 'left', 'left', 'right', 'left', 'center']
            })
          : InspectionWidgets.renderEmptyState({
              icon: 'broadcast-tower',
              title: 'Belum Ada Data Air Terminal',
              message: 'Tambahkan data penangkal petir eksternal.',
              actionLabel: 'Tambah Air Terminal',
              actionOnClick: `window._inspectionControllers['lps'].showAddAirTerminalModal()`
            })
        }
      </div>
    `;
  }

  renderGroundingTab() {
    const grounding = this._getData('grounding');
    const resistanceOk = grounding?.resistance <= this.GROUNDING_MAX_RESISTANCE;

    return `
      <div id="lps-tab-grounding" class="lps-tab-content">
        ${InspectionWidgets.renderActionBar([
          { icon: 'plus', label: grounding ? 'Edit Grounding' : 'Tambah Grounding', variant: 'primary', onclick: `window._inspectionControllers['lps'].showGroundingModal()` }
        ])}
        
        ${grounding
          ? InspectionWidgets.renderSectionCard({
              title: 'Data Grounding System',
              icon: 'globe',
              accentColor: 'var(--brand-400)',
              content: `
                <div style="text-align: center; margin-bottom: 24px;">
                  <div style="font-size: 4rem; font-weight: 800; color: ${resistanceOk ? 'var(--success-400)' : 'var(--danger-400)'};">${this._formatNumber(grounding.resistance, 2)}</div>
                  <div style="font-size: 0.9rem; color: var(--text-tertiary);">Ohm (Ω)</div>
                  <div style="font-size: 0.85rem; color: ${resistanceOk ? 'var(--success-400)' : 'var(--danger-400)'}; margin-top: 8px;">
                    ${resistanceOk ? '✓ Memenuhi Standar (≤10Ω)' : '✗ Melebihi Standar (>10Ω)'}
                  </div>
                </div>
                
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;">
                  <div>
                    <label style="font-size: 0.7rem; color: var(--text-tertiary);">Jenis Elektroda</label>
                    <div style="font-size: 1rem; font-weight: 600; color: white;">${grounding.electrode_type || '-'}</div>
                  </div>
                  <div>
                    <label style="font-size: 0.7rem; color: var(--text-tertiary);">Jumlah Elektroda</label>
                    <div style="font-size: 1rem; font-weight: 600; color: white;">${grounding.electrode_count || '-'}</div>
                  </div>
                  <div>
                    <label style="font-size: 0.7rem; color: var(--text-tertiary);">Kedalaman</label>
                    <div style="font-size: 1rem; font-weight: 600; color: white;">${grounding.depth ? grounding.depth + ' m' : '-'}</div>
                  </div>
                  <div>
                    <label style="font-size: 0.7rem; color: var(--text-tertiary);">Terakhir Ukur</label>
                    <div style="font-size: 1rem; font-weight: 600; color: white;">${grounding.last_measured ? this._formatDate(grounding.last_measured) : '-'}</div>
                  </div>
                </div>
              `
            })
          : InspectionWidgets.renderEmptyState({
              icon: 'globe',
              title: 'Belum Ada Data Grounding',
              message: 'Tambahkan data sistem grounding/earthing.',
              actionLabel: 'Tambah Grounding',
              actionOnClick: `window._inspectionControllers['lps'].showGroundingModal()`
            })
        }
      </div>
    `;
  }

  renderInternalTab() {
    const spd = this._getData('spd') || [];
    
    return `
      <div id="lps-tab-internal" class="lps-tab-content">
        ${InspectionWidgets.renderActionBar([
          { icon: 'plus', label: 'Tambah SPD', variant: 'primary', onclick: `window._inspectionControllers['lps'].showAddSPDModal()` }
        ])}
        
        ${spd.length > 0
          ? InspectionWidgets.renderDataTable({
              headers: ['ID', 'Lokasi', 'Tipe', 'Protection Level', 'Status'],
              rows: spd.map(s => [
                s.spd_code || s.id?.slice(0, 8),
                s.location || '-',
                s.spd_type || '-',
                s.protection_level || '-',
                s.status === 'ACTIVE' ? '<span style="color: var(--success-400);">Aktif</span>' : '<span style="color: var(--warning-400);">Non-Aktif</span>'
              ]),
              align: ['left', 'left', 'left', 'center', 'center']
            })
          : InspectionWidgets.renderEmptyState({
              icon: 'plug',
              title: 'Belum Ada Data SPD',
              message: 'Tambahkan data Surge Protection Device (SPD).',
              actionLabel: 'Tambah SPD',
              actionOnClick: `window._inspectionControllers['lps'].showAddSPDModal()`
            })
        }
      </div>
    `;
  }

  renderComplianceTab() {
    const grounding = this._getData('grounding');
    const resistanceOk = grounding?.resistance <= this.GROUNDING_MAX_RESISTANCE;
    const airTerminals = this._getData('airTerminals') || [];
    const spd = this._getData('spd') || [];

    const checks = [
      { name: 'Air Terminal Terpasang', passed: airTerminals.length > 0, value: `${airTerminals.length} unit` },
      { name: 'Grounding Resistance ≤ 10Ω', passed: resistanceOk, value: grounding?.resistance ? grounding.resistance + ' Ω' : 'N/A' },
      { name: 'SPD Terpasang', passed: spd.length > 0, value: `${spd.length} unit` }
    ];

    const passedCount = checks.filter(c => c.passed).length;
    const overallScore = Math.round((passedCount / checks.length) * 100);

    return `
      <div id="lps-tab-compliance" class="lps-tab-content">
        ${InspectionWidgets.renderScoreIndicator({ score: overallScore, label: 'LPS Compliance SNI 2848:2020', size: 'lg' })}
        
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

  showAddAirTerminalModal() { showInfo('Modal tambah air terminal akan ditampilkan'); }
  showGroundingModal() { showInfo('Modal grounding akan ditampilkan'); }
  showAddSPDModal() { showInfo('Modal tambah SPD akan ditampilkan'); }

  afterRender() {
    super.afterRender();
    if (typeof window !== 'undefined') {
      window._inspectionControllers = window._inspectionControllers || {};
      window._inspectionControllers['lps'] = this;
    }
  }
}

let lpsInspectionInstance = null;

export async function lpsInspectionPage(params = {}) {
  if (lpsInspectionInstance) lpsInspectionInstance.destroy();
  lpsInspectionInstance = new LPSInspection();
  return await lpsInspectionInstance.initialize(params);
}

export function afterLPSInspectionRender() {
  if (lpsInspectionInstance) lpsInspectionInstance.afterRender();
}
