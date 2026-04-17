// ============================================================
// FIRE PROTECTION INSPECTION - Clean Architecture Implementation
// Refactor dari fire-protection-inspection.js
// ============================================================

import { BaseInspection } from './BaseInspection.js';
import { InspectionWidgets } from '../../components/inspection/inspection-widgets.js';
import { showSuccess, showError, showInfo } from '../../components/toast.js';

/**
 * Kelas FireProtectionInspection mengextends BaseInspection.
 * Menangani pemeriksaan sistem proteksi kebakaran.
 * 
 * @extends BaseInspection
 */
export class FireProtectionInspection extends BaseInspection {
  constructor() {
    super({
      moduleName: 'fire',
      phaseCode: 'PHASE 03A',
      title: 'Pemeriksaan Proteksi Kebakaran',
      badge: 'SNI 03-6572',
      icon: 'fire-extinguisher',
      accentColor: 'var(--danger-400)',
      description: 'Evaluasi sistem proteksi kebakaran berdasarkan SNI 03-6572-2001 dan standar NFPA. Meliputi APAR, hydrant, sprinkler, dan sistem deteksi.',
      tables: ['fire_assets', 'fire_project_summary', 'fire_inspections']
    });

    // Fire protection standards
    this.ASSET_TYPES = {
      APAR: { label: 'APAR', icon: 'fire-extinguisher', standard: 'SNI 03-6572' },
      HYDRANT: { label: 'Hydrant', icon: 'tint', standard: 'SNI 03-6572' },
      SPRINKLER: { label: 'Sprinkler', icon: 'shower', standard: 'NFPA 13' },
      DETECTOR: { label: 'Smoke Detector', icon: 'bell', standard: 'NFPA 72' }
    };
  }

  // ============================================================
  // DATA LOADING
  // ============================================================

  async loadData() {
    const projectId = this._state.projectId;

    // Load fire assets
    const assets = await this.repository.query('fire_assets', 
      { project_id: projectId }, 
      { orderBy: 'created_at' }
    );

    // Load summary
    const summary = await this.repository.query('fire_project_summary',
      { project_id: projectId },
      { limit: 1 }
    );

    // Group assets by type
    this._setData('assets', {
      apar: assets.filter(a => a.asset_type === 'APAR'),
      hydrant: assets.filter(a => a.asset_type === 'HYDRANT'),
      sprinkler: assets.filter(a => a.asset_type === 'SPRINKLER'),
      detector: assets.filter(a => a.asset_type === 'DETECTOR')
    });

    this._setData('summary', summary[0] || null);
    this._setData('totalAssets', assets.length);
  }

  // ============================================================
  // TAB CONFIGURATION
  // ============================================================

  getTabs() {
    const assets = this._getData('assets') || {};
    const total = this._getData('totalAssets') || 0;

    return [
      { id: 'dashboard', icon: 'chart-pie', label: 'DASHBOARD' },
      { id: 'apar', icon: 'fire-extinguisher', label: `APAR (${assets.apar?.length || 0})` },
      { id: 'hydrant', icon: 'tint', label: `HYDRANT (${assets.hydrant?.length || 0})` },
      { id: 'sprinkler', icon: 'shower', label: `SPRINKLER (${assets.sprinkler?.length || 0})` },
      { id: 'detector', icon: 'bell', label: `DETECTOR (${assets.detector?.length || 0})` },
      { id: 'compliance', icon: 'check-circle', label: 'COMPLIANCE' },
      { id: 'report', icon: 'file-pdf', label: 'LAPORAN' }
    ];
  }

  // ============================================================
  // TAB RENDERING
  // ============================================================

  renderTabContent(tabId) {
    switch (tabId) {
      case 'dashboard': return this.renderDashboardTab();
      case 'apar': return this.renderAssetTab('apar');
      case 'hydrant': return this.renderAssetTab('hydrant');
      case 'sprinkler': return this.renderAssetTab('sprinkler');
      case 'detector': return this.renderAssetTab('detector');
      case 'compliance': return this.renderComplianceTab();
      case 'report': return this.renderReportTab();
      default: return this.renderDashboardTab();
    }
  }

  // ============================================================
  // DASHBOARD TAB
  // ============================================================

  renderDashboardTab() {
    const assets = this._getData('assets') || {};
    const summary = this._getData('summary');
    const totalAssets = this._getData('totalAssets') || 0;

    const aparReady = assets.apar?.filter(a => a.status === 'READY').length || 0;
    const hydrantReady = assets.hydrant?.filter(a => a.status === 'READY').length || 0;
    const sprinklerReady = assets.sprinkler?.filter(a => a.status === 'READY').length || 0;
    const detectorReady = assets.detector?.filter(a => a.status === 'READY').length || 0;

    const totalReady = aparReady + hydrantReady + sprinklerReady + detectorReady;
    const complianceRate = totalAssets > 0 ? Math.round((totalReady / totalAssets) * 100) : 0;

    const stats = [
      { icon: 'fire-extinguisher', value: assets.apar?.length || 0, label: 'Unit APAR', sublabel: `${aparReady} Ready`, accentColor: 'var(--danger-400)' },
      { icon: 'tint', value: assets.hydrant?.length || 0, label: 'Hydrant', sublabel: `${hydrantReady} Ready`, accentColor: 'var(--brand-400)' },
      { icon: 'shower', value: assets.sprinkler?.length || 0, label: 'Sprinkler', sublabel: `${sprinklerReady} Ready`, accentColor: 'var(--success-400)' },
      { icon: 'bell', value: assets.detector?.length || 0, label: 'Detector', sublabel: `${detectorReady} Ready`, accentColor: 'var(--warning-400)' }
    ];

    return `
      <div id="fire-tab-dashboard" class="fire-tab-content">
        ${InspectionWidgets.renderStatsGrid(stats)}
        
        <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 20px;">
          ${InspectionWidgets.renderSectionCard({
            title: 'Status Compliance',
            icon: 'check-circle',
            accentColor: 'var(--success-400)',
            content: `
              <div style="text-align: center; margin-bottom: 24px;">
                ${InspectionWidgets.renderScoreIndicator({ score: complianceRate, label: 'Compliance Rate', size: 'md' })}
              </div>
              <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">
                <div style="padding: 16px; background: hsla(160, 100%, 45%, 0.1); border-radius: 10px; text-align: center;">
                  <div style="font-size: 1.5rem; font-weight: 700; color: var(--success-400);">${totalReady}</div>
                  <div style="font-size: 0.75rem; color: var(--text-tertiary);">Ready</div>
                </div>
                <div style="padding: 16px; background: hsla(0, 80%, 60%, 0.1); border-radius: 10px; text-align: center;">
                  <div style="font-size: 1.5rem; font-weight: 700; color: var(--danger-400);">${totalAssets - totalReady}</div>
                  <div style="font-size: 0.75rem; color: var(--text-tertiary);">Need Action</div>
                </div>
              </div>
            `
          })}
          
          ${InspectionWidgets.renderSectionCard({
            title: 'Ringkasan',
            icon: 'info-circle',
            accentColor: 'var(--brand-400)',
            content: `
              <div style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.6;">
                <p style="margin-bottom: 12px;"><strong>Total Aset:</strong> ${totalAssets} unit</p>
                <p style="margin-bottom: 12px;"><strong>Terakhir Inspeksi:</strong> ${summary?.last_inspection ? this._formatDate(summary.last_inspection) : 'Belum pernah'}</p>
                <p><strong>Status:</strong> ${summary?.status || 'Pending'}</p>
              </div>
            `
          })}
        </div>
      </div>
    `;
  }

  // ============================================================
  // ASSET TABS
  // ============================================================

  renderAssetTab(assetType) {
    const assets = this._getData('assets') || {};
    const typeAssets = assets[assetType] || [];
    const typeConfig = this.ASSET_TYPES[assetType.toUpperCase()];

    return `
      <div id="fire-tab-${assetType}" class="fire-tab-content">
        ${InspectionWidgets.renderActionBar([
          { icon: 'plus', label: `Tambah ${typeConfig?.label || assetType}`, variant: 'primary', onclick: `window._inspectionControllers['fire'].showAddAssetModal('${assetType.toUpperCase()}')` },
          { icon: 'clipboard-check', label: 'Inspeksi', variant: 'secondary', onclick: `window._inspectionControllers['fire'].showInspectionModal('${assetType.toUpperCase()}')` }
        ])}
        
        ${typeAssets.length > 0
          ? InspectionWidgets.renderDataTable({
              headers: ['ID', 'Lokasi', 'Tipe', 'Status', 'Expired', 'Aksi'],
              rows: typeAssets.map(a => [
                a.asset_code || a.id?.slice(0, 8),
                a.location || '-',
                a.subtype || a.spec_type || '-',
                this.renderStatusBadge(a.status),
                a.expiry_date ? this._formatDate(a.expiry_date) : '-',
                `<button onclick="window._inspectionControllers['fire'].editAsset('${a.id}')" style="background: none; border: none; color: var(--brand-400); cursor: pointer;"><i class="fas fa-edit"></i></button>`
              ]),
              align: ['left', 'left', 'left', 'center', 'left', 'center']
            })
          : InspectionWidgets.renderEmptyState({
              icon: typeConfig?.icon || 'box',
              title: `Belum Ada ${typeConfig?.label || assetType}`,
              message: `Tambahkan data ${typeConfig?.label || assetType} untuk memulai.`,
              actionLabel: `Tambah ${typeConfig?.label || assetType}`,
              actionOnClick: `window._inspectionControllers['fire'].showAddAssetModal('${assetType.toUpperCase()}')`
            })
        }
      </div>
    `;
  }

  renderStatusBadge(status) {
    const styles = {
      READY: { color: 'var(--success-400)', bg: 'hsla(160, 100%, 45%, 0.15)' },
      EXPIRED: { color: 'var(--danger-400)', bg: 'hsla(0, 80%, 60%, 0.15)' },
      NEED_MAINTENANCE: { color: 'var(--warning-400)', bg: 'hsla(35, 100%, 50%, 0.15)' },
      NOT_READY: { color: 'var(--text-tertiary)', bg: 'hsla(220, 20%, 30%, 0.3)' }
    };
    const style = styles[status] || styles.NOT_READY;
    const labels = { READY: 'Ready', EXPIRED: 'Expired', NEED_MAINTENANCE: 'Perlu Perawatan', NOT_READY: 'Not Ready' };
    
    return `<span style="padding: 4px 10px; border-radius: 6px; font-size: 0.7rem; font-weight: 600; background: ${style.bg}; color: ${style.color};">${labels[status] || status}</span>`;
  }

  // ============================================================
  // COMPLIANCE TAB
  // ============================================================

  renderComplianceTab() {
    const assets = this._getData('assets') || {};
    const checks = this.runComplianceChecks(assets);

    return `
      <div id="fire-tab-compliance" class="fire-tab-content">
        ${InspectionWidgets.renderScoreIndicator({ score: checks.overallScore, label: 'Fire Protection Compliance', size: 'lg' })}
        
        <div style="margin-top: 24px;">
          ${InspectionWidgets.renderSectionCard({
            title: 'Checklist Compliance',
            icon: 'clipboard-check',
            accentColor: 'var(--danger-400)',
            content: `
              <div style="display: flex; flex-direction: column; gap: 12px;">
                ${checks.items.map(check => `
                  <div style="display: flex; align-items: center; gap: 12px; padding: 16px; background: hsla(220, 20%, 15%, 0.5); border-radius: 10px;">
                    <div style="width: 32px; height: 32px; border-radius: 50%; background: ${check.passed ? 'hsla(160, 100%, 45%, 0.2)' : 'hsla(0, 80%, 60%, 0.2)'}; display: flex; align-items: center; justify-content: center; color: ${check.passed ? 'var(--success-400)' : 'var(--danger-400)'};">
                      <i class="fas fa-${check.passed ? 'check' : 'times'}"></i>
                    </div>
                    <div style="flex: 1;">
                      <div style="font-size: 0.9rem; font-weight: 600; color: var(--text-primary);">${check.name}</div>
                      <div style="font-size: 0.8rem; color: var(--text-tertiary);">${check.description}</div>
                    </div>
                    <div style="text-align: right;">
                      <div style="font-size: 1.2rem; font-weight: 700; color: ${check.passed ? 'var(--success-400)' : 'var(--danger-400)'}">${check.value}</div>
                      <div style="font-size: 0.7rem; color: var(--text-tertiary);">${check.requirement}</div>
                    </div>
                  </div>
                `).join('')}
              </div>
            `
          })}
        </div>
      </div>
    `;
  }

  runComplianceChecks(assets) {
    const checks = [];
    const totalApar = assets.apar?.length || 0;
    const readyApar = assets.apar?.filter(a => a.status === 'READY').length || 0;

    // APAR checks
    checks.push({
      name: 'APAR Tersedia',
      description: 'Jumlah APAR minimum sesuai luas bangunan',
      passed: totalApar >= 2,
      value: `${totalApar} unit`,
      requirement: 'Min. 2'
    });

    checks.push({
      name: 'APAR Ready',
      description: 'Semua APAR dalam kondisi siap pakai',
      passed: totalApar > 0 && readyApar === totalApar,
      value: `${readyApar}/${totalApar}`,
      requirement: '100%'
    });

    // Hydrant checks
    const totalHydrant = assets.hydrant?.length || 0;
    checks.push({
      name: 'Hydrant Tersedia',
      description: 'Sistem hydrant terinstall',
      passed: totalHydrant >= 1,
      value: `${totalHydrant} unit`,
      requirement: 'Min. 1'
    });

    // Sprinkler checks (jika diperlukan)
    const totalSprinkler = assets.sprinkler?.length || 0;
    
    // Detector checks
    const totalDetector = assets.detector?.length || 0;
    checks.push({
      name: 'Smoke Detector',
      description: 'Sistem deteksi asap terinstall',
      passed: totalDetector >= 2,
      value: `${totalDetector} unit`,
      requirement: 'Sesuai luas'
    });

    const passedCount = checks.filter(c => c.passed).length;
    const overallScore = checks.length > 0 ? Math.round((passedCount / checks.length) * 100) : 0;

    return { items: checks, overallScore };
  }

  // ============================================================
  // REPORT TAB
  // ============================================================

  renderReportTab() {
    return InspectionWidgets.renderSectionCard({
      title: 'Laporan Proteksi Kebakaran',
      icon: 'file-pdf',
      accentColor: 'var(--danger-400)',
      content: `
        <p style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.6; margin-bottom: 20px;">
          Generate laporan inspeksi sistem proteksi kebakaran sesuai SNI 03-6572-2001.
          Laporan mencakup status semua aset, compliance check, dan rekomendasi perbaikan.
        </p>
        
        ${InspectionWidgets.renderActionBar([
          { icon: 'file-pdf', label: 'Generate PDF', variant: 'primary', onclick: `window._inspectionControllers['fire'].generateReport('pdf')` },
          { icon: 'file-excel', label: 'Export Excel', variant: 'secondary', onclick: `window._inspectionControllers['fire'].generateReport('excel')` }
        ])}
      `
    });
  }

  // ============================================================
  // EVENT HANDLERS
  // ============================================================

  showAddAssetModal(assetType) {
    showInfo(`Modal tambah ${assetType} akan ditampilkan`);
  }

  showInspectionModal(assetType) {
    showInfo(`Modal inspeksi ${assetType} akan ditampilkan`);
  }

  editAsset(assetId) {
    showInfo(`Edit asset ${assetId}`);
  }

  generateReport(format) {
    showInfo(`Generate ${format.toUpperCase()} report - Dalam pengembangan`);
  }

  // ============================================================
  // AFTER RENDER
  // ============================================================

  afterRender() {
    super.afterRender();
    if (typeof window !== 'undefined') {
      window._inspectionControllers = window._inspectionControllers || {};
      window._inspectionControllers['fire'] = this;
    }
  }
}

// ============================================================
// PAGE EXPORTS (Legacy Compatibility)
// ============================================================

let fireProtectionInspectionInstance = null;

export async function fireProtectionInspectionPage(params = {}) {
  if (fireProtectionInspectionInstance) {
    fireProtectionInspectionInstance.destroy();
  }

  fireProtectionInspectionInstance = new FireProtectionInspection();
  return await fireProtectionInspectionInstance.initialize(params);
}

export function afterFireProtectionInspectionRender() {
  if (fireProtectionInspectionInstance) {
    fireProtectionInspectionInstance.afterRender();
  }
}
