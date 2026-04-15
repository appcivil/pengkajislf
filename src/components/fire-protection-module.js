/**
 * FIRE PROTECTION & LIFE SAFETY MODULE
 * Komponen UI komprehensif untuk sistem proteksi kebakaran
 * Berdasarkan SNI 03-1735-2004, SNI 03-1745-2000, NFPA 13/101
 * UI/UX: Presidential Quartz Style
 */

import { supabase } from '../lib/supabase.js';
import * as FireCalc from '../lib/fire-protection-calculators.js';
import { showSuccess, showError, showInfo } from './toast.js';
import { openModal, confirm } from './modal.js';

// ============================================================
// 1. SUMMARY FETCH FUNCTION
// ============================================================

export async function fetchFireProtectionSummary(projectId) {
  try {
    const { data, error } = await supabase
      .from('fire_project_summary')
      .select('*')
      .eq('project_id', projectId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    
    return data || {
      total_assets: 0,
      apar_count: 0,
      hydrant_count: 0,
      sprinkler_count: 0,
      detector_count: 0,
      compliance_rate: 0,
      recent_failures: 0,
      overall_status: 'NOT_STARTED'
    };
  } catch (error) {
    console.error('Error fetching fire protection summary:', error);
    return { total_assets: 0, overall_status: 'ERROR' };
  }
}

// ============================================================
// 2. SUMMARY CARD RENDERER
// ============================================================

export function renderFireProtectionCard(project, summary = {}) {
  const statusColors = {
    'COMPLIANT': { bg: 'hsla(158, 85%, 45%, 0.1)', text: 'var(--success-400)', border: 'var(--success-500)' },
    'IN_PROGRESS': { bg: 'hsla(220, 95%, 52%, 0.1)', text: 'var(--brand-400)', border: 'var(--brand-500)' },
    'ATTENTION_REQUIRED': { bg: 'hsla(0, 85%, 60%, 0.1)', text: 'var(--danger-400)', border: 'var(--danger-500)' },
    'NOT_STARTED': { bg: 'hsla(220, 20%, 100%, 0.05)', text: 'var(--text-tertiary)', border: 'var(--text-tertiary)' },
    'ERROR': { bg: 'hsla(0, 85%, 60%, 0.1)', text: 'var(--danger-400)', border: 'var(--danger-500)' }
  };
  
  const st = statusColors[summary.overall_status] || statusColors['NOT_STARTED'];
  const hasData = summary.total_assets > 0;
  
  return `
    <div class="card-quartz clickable" id="fire-protection-card" onclick="window.navigate('fire-protection', {id:'${project.id}'})" style="padding: var(--space-6); background: ${st.bg}; border-color: ${st.border}44">
      <div class="flex-between" style="margin-bottom: 20px">
        <div style="width: 48px; height: 48px; border-radius: 14px; background: ${st.bg}; display: flex; align-items: center; justify-content: center; color: ${st.text}; border: 1px solid ${st.border}44">
          <i class="fas fa-fire-extinguisher" style="font-size: 1.4rem"></i>
        </div>
        <div style="font-family: var(--font-mono); font-size: 12px; font-weight: 800; color: ${st.text}">
          ${summary.overall_status?.replace('_', ' ') || 'NOT STARTED'}
        </div>
      </div>
      
      <h3 style="font-family: 'Outfit', sans-serif; font-weight: 800; font-size: 1.1rem; color: var(--text-primary); margin-bottom: 4px">
        Fire Protection & Life Safety
      </h3>
      <p style="font-size: 0.75rem; color: var(--text-tertiary); line-height: 1.5">
        Sistem deteksi, pemadam, evakuasi, dan analisis risiko kebakaran per SNI & NFPA.
      </p>
      
      ${hasData ? `
        <div style="margin-top: 20px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px">
          <div style="background: hsla(220, 20%, 100%, 0.03); padding: 8px; border-radius: 8px; text-align: center">
            <div style="font-size: 1rem; font-weight: 800; color: var(--success-400)">${summary.apar_count || 0}</div>
            <div style="font-size: 9px; color: var(--text-tertiary)">APAR</div>
          </div>
          <div style="background: hsla(220, 20%, 100%, 0.03); padding: 8px; border-radius: 8px; text-align: center">
            <div style="font-size: 1rem; font-weight: 800; color: var(--brand-400)">${summary.hydrant_count || 0}</div>
            <div style="font-size: 9px; color: var(--text-tertiary)">Hydrant</div>
          </div>
          <div style="background: hsla(220, 20%, 100%, 0.03); padding: 8px; border-radius: 8px; text-align: center">
            <div style="font-size: 1rem; font-weight: 800; color: var(--gold-400)">${summary.sprinkler_count || 0}</div>
            <div style="font-size: 9px; color: var(--text-tertiary)">Sprinkler</div>
          </div>
          <div style="background: hsla(220, 20%, 100%, 0.03); padding: 8px; border-radius: 8px; text-align: center">
            <div style="font-size: 1rem; font-weight: 800; color: var(--text-secondary)">${summary.detector_count || 0}</div>
            <div style="font-size: 9px; color: var(--text-tertiary)">Detector</div>
          </div>
        </div>
        
        <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid hsla(220, 20%, 100%, 0.05)">
          <div class="flex-between" style="margin-bottom: 8px">
            <span style="font-size: 0.7rem; font-weight: 700; color: var(--text-tertiary)">COMPLIANCE RATE</span>
            <span style="font-size: 0.7rem; font-weight: 800; color: ${st.text}">${summary.compliance_rate || 0}%</span>
          </div>
          <div style="height: 4px; background: hsla(220, 20%, 100%, 0.05); border-radius: 10px">
            <div style="width: ${Math.min(100, summary.compliance_rate || 0)}%; height: 100%; border-radius: 10px; background: ${st.text}; box-shadow: 0 0 10px ${st.text}66"></div>
          </div>
          ${summary.recent_failures > 0 ? `
            <div style="margin-top: 8px; font-size: 10px; color: var(--danger-400)">
              <i class="fas fa-triangle-exclamation" style="margin-right: 4px"></i>
              ${summary.recent_failures} kegagalan inspeksi dalam 30 hari terakhir
            </div>
          ` : ''}
        </div>
      ` : `
        <div style="margin-top: 20px; padding: 16px; background: hsla(220, 20%, 100%, 0.02); border: 1px dashed hsla(220, 20%, 100%, 0.1); border-radius: 12px; text-align: center">
          <p style="font-size: 0.75rem; color: var(--text-tertiary); margin-bottom: 12px">
            Belum ada data fire protection
          </p>
          <span class="badge" style="background: ${st.bg}; color: ${st.text}; border: 1px solid ${st.border}44; font-size: 10px">
            KLIK UNTUK MEMULAI
          </span>
        </div>
      `}
    </div>
  `;
}

// ============================================================
// 3. MAIN MODULE COMPONENT
// ============================================================

export async function renderFireProtectionModule(projectId) {
  const assets = await fetchFireAssets(projectId);
  
  return `
    <div id="fire-protection-module" style="animation: page-fade-in 0.5s ease-out">
      <!-- Module Header -->
      <div class="card-quartz" style="padding: var(--space-6); margin-bottom: var(--space-6); background: var(--gradient-dark); border-color: hsla(0, 85%, 60%, 0.2)">
        <div class="flex-between" style="align-items: flex-start">
          <div>
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px">
              <i class="fas fa-fire-extinguisher" style="color: var(--danger-400); font-size: 1.5rem"></i>
              <h2 style="font-family: 'Outfit', sans-serif; font-weight: 800; color: white; margin: 0">
                Fire Protection & Life Safety
              </h2>
            </div>
            <p style="font-size: 0.8rem; color: var(--text-tertiary); margin: 0">
              SNI 03-1735-2004 | SNI 03-1745-2000 | NFPA 13/101
            </p>
          </div>
          <div class="flex gap-3">
            <button class="btn btn-outline btn-sm" onclick="window._exportFireData('${projectId}')">
              <i class="fas fa-download" style="margin-right: 8px"></i> Export
            </button>
            <button class="btn btn-primary btn-sm" onclick="window._generateFireReport('${projectId}')">
              <i class="fas fa-file-pdf" style="margin-right: 8px"></i> Laporan
            </button>
          </div>
        </div>
      </div>

      <!-- Tab Navigation -->
      <div class="card-quartz" style="padding: 0; margin-bottom: var(--space-6); overflow: hidden">
        <div class="flex" style="border-bottom: 1px solid hsla(220, 20%, 100%, 0.05)">
          ${renderTabButton('assets', 'Aset & Inventori', 'fa-boxes-stacked', true)}
          ${renderTabButton('detection', 'Deteksi & Alarm', 'fa-bell')}
          ${renderTabButton('suppression', 'Pemadam & Hydrant', 'fa-fire-extinguisher')}
          ${renderTabButton('egress', 'Evakuasi & Egress', 'fa-person-running')}
          ${renderTabButton('calculations', 'Perhitungan', 'fa-calculator')}
          ${renderTabButton('risk', 'Analisis Risiko', 'fa-chart-line')}
        </div>
      </div>

      <!-- TAB CONTENT: ASSETS -->
      <div id="fire-tab-assets" class="fire-tab-content active">
        ${renderAssetsTab(projectId, assets)}
      </div>

      <!-- TAB CONTENT: DETECTION -->
      <div id="fire-tab-detection" class="fire-tab-content" style="display: none;">
        ${renderDetectionTab()}
      </div>

      <!-- TAB CONTENT: SUPPRESSION -->
      <div id="fire-tab-suppression" class="fire-tab-content" style="display: none;">
        ${renderSuppressionTab()}
      </div>

      <!-- TAB CONTENT: EGRESS -->
      <div id="fire-tab-egress" class="fire-tab-content" style="display: none;">
        ${renderEgressTab()}
      </div>

      <!-- TAB CONTENT: CALCULATIONS -->
      <div id="fire-tab-calculations" class="fire-tab-content" style="display: none;">
        ${renderCalculationsTab()}
      </div>

      <!-- TAB CONTENT: RISK -->
      <div id="fire-tab-risk" class="fire-tab-content" style="display: none;">
        ${renderRiskTab()}
      </div>
    </div>
  `;
}

function renderTabButton(id, label, icon, active = false) {
  return `
    <button class="fire-tab-btn ${active ? 'active' : ''}" data-tab="${id}" 
            onclick="window._switchFireTab('${id}', this)"
            style="flex: 1; padding: 16px; background: ${active ? 'hsla(0, 85%, 60%, 0.1)' : 'transparent'}; 
                   border: none; border-bottom: 2px solid ${active ? 'var(--danger-400)' : 'transparent'}; 
                   color: ${active ? 'white' : 'var(--text-tertiary)'}; cursor: pointer;
                   font-size: 0.75rem; font-weight: 700; letter-spacing: 0.5px;
                   display: flex; align-items: center; justify-content: center; gap: 8px;
                   transition: all 0.2s">
      <i class="fas ${icon}"></i>
      ${label}
    </button>
  `;
}

// ============================================================
// 4. ASSETS TAB
// ============================================================

function renderAssetsTab(projectId, assets = []) {
  const assetTypes = [
    { type: 'APAR', icon: 'fa-fire-extinguisher', color: 'var(--success-400)' },
    { type: 'HYDRANT', icon: 'fa-faucet', color: 'var(--brand-400)' },
    { type: 'SPRINKLER', icon: 'fa-shower', color: 'var(--gold-400)' },
    { type: 'DETECTOR', icon: 'fa-smoke', color: 'var(--text-secondary)' },
    { type: 'MCP', icon: 'fa-hand-point-up', color: 'var(--danger-400)' },
    { type: 'FIRE_PUMP', icon: 'fa-gear', color: 'var(--warning-400)' }
  ];
  
  return `
    <div class="fire-tab-panel" id="tab-assets">
      <!-- Asset Type Quick Add -->
      <div class="grid-3-col" style="margin-bottom: var(--space-6)">
        ${assetTypes.map(at => `
          <div class="card-quartz clickable" onclick="window._addFireAsset('${projectId}', '${at.type}')" 
               style="padding: var(--space-4); text-align: center; background: hsla(220, 20%, 100%, 0.02)">
            <i class="fas ${at.icon}" style="font-size: 1.5rem; color: ${at.color}; margin-bottom: 8px"></i>
            <div style="font-size: 0.75rem; font-weight: 700; color: white">${at.type}</div>
            <div style="font-size: 0.65rem; color: var(--text-tertiary)">Tambah Aset</div>
          </div>
        `).join('')}
      </div>

      <!-- Assets Table -->
      <div class="card-quartz" style="padding: var(--space-6)">
        <div class="flex-between" style="margin-bottom: 20px">
          <h4 style="font-family: 'Outfit', sans-serif; font-weight: 800; color: white; margin: 0">
            <i class="fas fa-list" style="margin-right: 8px; color: var(--brand-400)"></i>
            Daftar Aset
          </h4>
          <div class="flex gap-2">
            <input type="text" id="asset-search" placeholder="Cari aset..." 
                   style="padding: 8px 12px; border-radius: 8px; background: hsla(220, 20%, 100%, 0.05); 
                          border: 1px solid hsla(220, 20%, 100%, 0.1); color: white; font-size: 0.75rem">
            <button class="btn btn-outline btn-xs" onclick="window._scanQRAsset()">
              <i class="fas fa-qrcode"></i> Scan QR
            </button>
          </div>
        </div>
        
        ${assets.length > 0 ? renderAssetsTable(assets) : `
          <div style="text-align: center; padding: 40px; color: var(--text-tertiary)">
            <i class="fas fa-box-open" style="font-size: 3rem; margin-bottom: 16px; opacity: 0.3"></i>
            <p>Belum ada aset fire protection</p>
            <button class="btn btn-primary btn-sm" style="margin-top: 12px" onclick="window._addFireAsset('${projectId}')">
              <i class="fas fa-plus" style="margin-right: 8px"></i> Tambah Aset Pertama
            </button>
          </div>
        `}
      </div>
    </div>
  `;
}

function renderAssetsTable(assets) {
  return `
    <div style="overflow-x: auto">
      <table style="width: 100%; border-collapse: collapse; font-size: 0.8rem">
        <thead>
          <tr style="border-bottom: 1px solid hsla(220, 20%, 100%, 0.1)">
            <th style="padding: 12px; text-align: left; color: var(--text-tertiary); font-weight: 700">Tipe</th>
            <th style="padding: 12px; text-align: left; color: var(--text-tertiary); font-weight: 700">Lokasi</th>
            <th style="padding: 12px; text-align: left; color: var(--text-tertiary); font-weight: 700">Lantai</th>
            <th style="padding: 12px; text-align: center; color: var(--text-tertiary); font-weight: 700">Status</th>
            <th style="padding: 12px; text-align: center; color: var(--text-tertiary); font-weight: 700">Inspeksi Terakhir</th>
            <th style="padding: 12px; text-align: center; color: var(--text-tertiary); font-weight: 700">Aksi</th>
          </tr>
        </thead>
        <tbody>
          ${assets.map(asset => `
            <tr style="border-bottom: 1px solid hsla(220, 20%, 100%, 0.05)">
              <td style="padding: 12px; color: white; font-weight: 600">
                <i class="fas ${getAssetIcon(asset.asset_type)}" style="margin-right: 8px; color: var(--brand-400)"></i>
                ${asset.asset_type}
              </td>
              <td style="padding: 12px; color: var(--text-secondary)">${asset.location_name || '-'}</td>
              <td style="padding: 12px; color: var(--text-secondary)">${asset.floor_level || '-'}</td>
              <td style="padding: 12px; text-align: center">
                <span class="badge" style="background: ${getStatusColor(asset.status)}1a; color: ${getStatusColor(asset.status)}; border: 1px solid ${getStatusColor(asset.status)}44; font-size: 10px">
                  ${asset.status}
                </span>
              </td>
              <td style="padding: 12px; text-align: center; color: var(--text-secondary)">
                ${asset.last_inspection_date ? new Date(asset.last_inspection_date).toLocaleDateString('id-ID') : '-'}
              </td>
              <td style="padding: 12px; text-align: center">
                <button class="btn btn-ghost btn-xs" onclick="window._inspectAsset('${asset.id}')">
                  <i class="fas fa-clipboard-check"></i>
                </button>
                <button class="btn btn-ghost btn-xs" onclick="window._editAsset('${asset.id}')">
                  <i class="fas fa-pen"></i>
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function getAssetIcon(type) {
  const icons = {
    'APAR': 'fa-fire-extinguisher',
    'HYDRANT': 'fa-faucet',
    'SPRINKLER': 'fa-shower',
    'DETECTOR': 'fa-smoke',
    'MCP': 'fa-hand-point-up',
    'FIRE_PUMP': 'fa-gear',
    'TANK': 'fa-database',
    'FIRE_DOOR': 'fa-door-closed'
  };
  return icons[type] || 'fa-box';
}

function getStatusColor(status) {
  const colors = {
    'ACTIVE': 'var(--success-400)',
    'INACTIVE': 'var(--text-tertiary)',
    'MAINTENANCE': 'var(--warning-400)',
    'EXPIRED': 'var(--danger-400)'
  };
  return colors[status] || 'var(--text-tertiary)';
}

// ============================================================
// 5. DETECTION & ALARM TAB
// ============================================================

function renderDetectionTab() {
  return `
    <div class="fire-tab-panel" id="tab-detection" style="display: none">
      <div class="grid-2-col">
        <!-- Smoke Detector Calculator -->
        <div class="card-quartz" style="padding: var(--space-6)">
          <h4 style="font-family: 'Outfit', sans-serif; font-weight: 800; color: white; margin-bottom: 20px">
            <i class="fas fa-smoke" style="margin-right: 8px; color: var(--brand-400)"></i>
            Smoke Detector Coverage
          </h4>
          <div class="form-group" style="margin-bottom: 16px">
            <label style="display: block; margin-bottom: 8px; font-size: 0.75rem; color: var(--text-secondary)">
              Tinggi Ceiling (m)
            </label>
            <input type="number" id="ceiling-height" class="form-control" value="3" min="0" max="15" step="0.1"
                   style="width: 100%; padding: 12px; border-radius: 8px; background: hsla(220, 20%, 100%, 0.05); 
                          border: 1px solid hsla(220, 20%, 100%, 0.1); color: white">
          </div>
          <div class="form-group" style="margin-bottom: 16px">
            <label style="display: block; margin-bottom: 8px; font-size: 0.75rem; color: var(--text-secondary)">
              Luas Area (m²)
            </label>
            <input type="number" id="floor-area-det" class="form-control" value="100" min="0"
                   style="width: 100%; padding: 12px; border-radius: 8px; background: hsla(220, 20%, 100%, 0.05); 
                          border: 1px solid hsla(220, 20%, 100%, 0.1); color: white">
          </div>
          <button class="btn btn-primary" style="width: 100%" onclick="window._calculateSmokeCoverage()">
            <i class="fas fa-calculator" style="margin-right: 8px"></i> Hitung
          </button>
          <div id="smoke-coverage-result" style="margin-top: 20px; padding: 16px; background: hsla(220, 20%, 100%, 0.02); 
                                                   border-radius: 12px; display: none">
          </div>
        </div>

        <!-- MCP Placement Check -->
        <div class="card-quartz" style="padding: var(--space-6)">
          <h4 style="font-family: 'Outfit', sans-serif; font-weight: 800; color: white; margin-bottom: 20px">
            <i class="fas fa-hand-point-up" style="margin-right: 8px; color: var(--danger-400)"></i>
            Manual Call Point Check
          </h4>
          <div class="form-group" style="margin-bottom: 16px">
            <label style="display: block; margin-bottom: 8px; font-size: 0.75rem; color: var(--text-secondary)">
              Jarak antar MCP (m)
            </label>
            <input type="number" id="mcp-spacing" class="form-control" value="25" min="0" max="50"
                   style="width: 100%; padding: 12px; border-radius: 8px; background: hsla(220, 20%, 100%, 0.05); 
                          border: 1px solid hsla(220, 20%, 100%, 0.1); color: white">
          </div>
          <div class="form-group" style="margin-bottom: 16px">
            <label style="display: block; margin-bottom: 8px; font-size: 0.75rem; color: var(--text-secondary)">
              Tinggi Pemasangan (m)
            </label>
            <input type="number" id="mcp-height" class="form-control" value="1.4" min="0" max="3" step="0.1"
                   style="width: 100%; padding: 12px; border-radius: 8px; background: hsla(220, 20%, 100%, 0.05); 
                          border: 1px solid hsla(220, 20%, 100%, 0.1); color: white">
          </div>
          <button class="btn btn-primary" style="width: 100%" onclick="window._checkMCPPlacement()">
            <i class="fas fa-check-circle" style="margin-right: 8px"></i> Cek Compliance
          </button>
          <div id="mcp-check-result" style="margin-top: 20px; padding: 16px; background: hsla(220, 20%, 100%, 0.02); 
                                              border-radius: 12px; display: none">
          </div>
        </div>
      </div>

      <!-- Fire Alarm Panel Status -->
      <div class="card-quartz" style="padding: var(--space-6); margin-top: var(--space-6)">
        <h4 style="font-family: 'Outfit', sans-serif; font-weight: 800; color: white; margin-bottom: 20px">
          <i class="fas fa-server" style="margin-right: 8px; color: var(--gold-400)"></i>
          Fire Alarm Panel Status
        </h4>
        <div class="grid-4-col">
          ${renderStatusCard('NORMAL', 'var(--success-400)', 'fa-check-circle', 'Sistem Normal')}
          ${renderStatusCard('ALARM', 'var(--danger-400)', 'fa-bell', 'Alarm Aktif')}
          ${renderStatusCard('FAULT', 'var(--warning-400)', 'fa-triangle-exclamation', 'Gangguan')}
          ${renderStatusCard('DISABLE', 'var(--text-tertiary)', 'fa-ban', 'Zona Non-Aktif')}
        </div>
      </div>
    </div>
  `;
}

function renderStatusCard(status, color, icon, label) {
  return `
    <div class="card-quartz" style="padding: var(--space-4); text-align: center; background: ${color}1a; border-color: ${color}44">
      <i class="fas ${icon}" style="font-size: 2rem; color: ${color}; margin-bottom: 12px"></i>
      <div style="font-size: 0.9rem; font-weight: 800; color: white">${status}</div>
      <div style="font-size: 0.7rem; color: var(--text-tertiary)">${label}</div>
    </div>
  `;
}

// ============================================================
// 6. SUPPRESSION TAB
// ============================================================

function renderSuppressionTab() {
  return `
    <div class="fire-tab-panel" id="tab-suppression" style="display: none">
      <div class="grid-2-col">
        <!-- APAR Requirements -->
        <div class="card-quartz" style="padding: var(--space-6)">
          <h4 style="font-family: 'Outfit', sans-serif; font-weight: 800; color: white; margin-bottom: 20px">
            <i class="fas fa-fire-extinguisher" style="margin-right: 8px; color: var(--success-400)"></i>
            APAR Requirements (SNI 03-3973)
          </h4>
          <div class="form-group" style="margin-bottom: 16px">
            <label style="display: block; margin-bottom: 8px; font-size: 0.75rem; color: var(--text-secondary)">
              Kelas Bahaya
            </label>
            <select id="apar-hazard-class" class="form-control"
                    style="width: 100%; padding: 12px; border-radius: 8px; background: hsla(220, 20%, 100%, 0.05); 
                           border: 1px solid hsla(220, 20%, 100%, 0.1); color: white">
              <option value="A">Kelas A - Bahan Padat (kayu, kertas)</option>
              <option value="B">Kelas B - Bahan Cair (minyak, bensin)</option>
              <option value="C">Kelas C - Peralatan Listrik</option>
            </select>
          </div>
          <div class="form-group" style="margin-bottom: 16px">
            <label style="display: block; margin-bottom: 8px; font-size: 0.75rem; color: var(--text-secondary)">
              Luas Lantai (m²)
            </label>
            <input type="number" id="apar-floor-area" class="form-control" value="500" min="0"
                   style="width: 100%; padding: 12px; border-radius: 8px; background: hsla(220, 20%, 100%, 0.05); 
                          border: 1px solid hsla(220, 20%, 100%, 0.1); color: white">
          </div>
          <div class="form-group" style="margin-bottom: 16px">
            <label style="display: block; margin-bottom: 8px; font-size: 0.75rem; color: var(--text-secondary)">
              Tipe Bangunan
            </label>
            <select id="apar-building-type" class="form-control"
                    style="width: 100%; padding: 12px; border-radius: 8px; background: hsla(220, 20%, 100%, 0.05); 
                           border: 1px solid hsla(220, 20%, 100%, 0.1); color: white">
              <option value="office">Kantor</option>
              <option value="healthcare">Rumah Sakit</option>
              <option value="industrial">Industri</option>
              <option value="highrise">Gedung Bertingkat</option>
            </select>
          </div>
          <button class="btn btn-primary" style="width: 100%" onclick="window._calculateAPARRequirements()">
            <i class="fas fa-calculator" style="margin-right: 8px"></i> Hitung Kebutuhan
          </button>
          <div id="apar-requirements-result" style="margin-top: 20px; padding: 16px; background: hsla(220, 20%, 100%, 0.02); 
                                                      border-radius: 12px; display: none">
          </div>
        </div>

        <!-- Hydrant Flow Calculator -->
        <div class="card-quartz" style="padding: var(--space-6)">
          <h4 style="font-family: 'Outfit', sans-serif; font-weight: 800; color: white; margin-bottom: 20px">
            <i class="fas fa-faucet" style="margin-right: 8px; color: var(--brand-400)"></i>
            Hydrant Flow Calculator
          </h4>
          <div class="form-group" style="margin-bottom: 16px">
            <label style="display: block; margin-bottom: 8px; font-size: 0.75rem; color: var(--text-secondary)">
              Diameter Nozzle (mm)
            </label>
            <input type="number" id="hydrant-nozzle-dia" class="form-control" value="65" min="0"
                   style="width: 100%; padding: 12px; border-radius: 8px; background: hsla(220, 20%, 100%, 0.05); 
                          border: 1px solid hsla(220, 20%, 100%, 0.1); color: white">
          </div>
          <div class="form-group" style="margin-bottom: 16px">
            <label style="display: block; margin-bottom: 8px; font-size: 0.75rem; color: var(--text-secondary)">
              Tekanan (kPa)
            </label>
            <input type="number" id="hydrant-pressure" class="form-control" value="700" min="0"
                   style="width: 100%; padding: 12px; border-radius: 8px; background: hsla(220, 20%, 100%, 0.05); 
                          border: 1px solid hsla(220, 20%, 100%, 0.1); color: white">
          </div>
          <button class="btn btn-primary" style="width: 100%" onclick="window._calculateHydrantFlow()">
            <i class="fas fa-calculator" style="margin-right: 8px"></i> Hitung Debit
          </button>
          <div id="hydrant-flow-result" style="margin-top: 20px; padding: 16px; background: hsla(220, 20%, 100%, 0.02); 
                                               border-radius: 12px; display: none">
          </div>
        </div>
      </div>

      <!-- Sprinkler Design -->
      <div class="card-quartz" style="padding: var(--space-6); margin-top: var(--space-6)">
        <h4 style="font-family: 'Outfit', sans-serif; font-weight: 800; color: white; margin-bottom: 20px">
          <i class="fas fa-shower" style="margin-right: 8px; color: var(--gold-400)"></i>
          Sprinkler Design (SNI 03-1745 / NFPA 13)
        </h4>
        <div class="grid-3-col">
          <div class="form-group">
            <label style="display: block; margin-bottom: 8px; font-size: 0.75rem; color: var(--text-secondary)">
              Kelas Bahaya
            </label>
            <select id="sprinkler-hazard" class="form-control"
                    style="width: 100%; padding: 12px; border-radius: 8px; background: hsla(220, 20%, 100%, 0.05); 
                           border: 1px solid hsla(220, 20%, 100%, 0.1); color: white">
              <option value="Light">Light Hazard</option>
              <option value="Ordinary-I">Ordinary Hazard I</option>
              <option value="Ordinary-II">Ordinary Hazard II</option>
              <option value="Extra">Extra Hazard</option>
            </select>
          </div>
          <div class="form-group">
            <label style="display: block; margin-bottom: 8px; font-size: 0.75rem; color: var(--text-secondary)">
              Design Area (m²)
            </label>
            <input type="number" id="sprinkler-area" class="form-control" value="139" min="0"
                   style="width: 100%; padding: 12px; border-radius: 8px; background: hsla(220, 20%, 100%, 0.05); 
                          border: 1px solid hsla(220, 20%, 100%, 0.1); color: white">
          </div>
          <div style="display: flex; align-items: flex-end">
            <button class="btn btn-primary" style="width: 100%" onclick="window._calculateSprinklerDesign()">
              <i class="fas fa-calculator" style="margin-right: 8px"></i> Hitung Design
            </button>
          </div>
        </div>
        <div id="sprinkler-design-result" style="margin-top: 20px; padding: 16px; background: hsla(220, 20%, 100%, 0.02); 
                                                  border-radius: 12px; display: none">
        </div>
      </div>
    </div>
  `;
}

// ============================================================
// 7. EGRESS TAB
// ============================================================

function renderEgressTab() {
  return `
    <div class="fire-tab-panel" id="tab-egress" style="display: none">
      <div class="grid-2-col">
        <!-- Egress Analysis -->
        <div class="card-quartz" style="padding: var(--space-6)">
          <h4 style="font-family: 'Outfit', sans-serif; font-weight: 800; color: white; margin-bottom: 20px">
            <i class="fas fa-person-running" style="margin-right: 8px; color: var(--success-400)"></i>
            Egress Analysis (NFPA 101 / PUJK)
          </h4>
          <div class="form-group" style="margin-bottom: 16px">
            <label style="display: block; margin-bottom: 8px; font-size: 0.75rem; color: var(--text-secondary)">
              Luas Lantai (m²)
            </label>
            <input type="number" id="egress-floor-area" class="form-control" value="1000" min="0"
                   style="width: 100%; padding: 12px; border-radius: 8px; background: hsla(220, 20%, 100%, 0.05); 
                          border: 1px solid hsla(220, 20%, 100%, 0.1); color: white">
          </div>
          <div class="form-group" style="margin-bottom: 16px">
            <label style="display: block; margin-bottom: 8px; font-size: 0.75rem; color: var(--text-secondary)">
              Tipe Okupansi
            </label>
            <select id="egress-occupancy" class="form-control"
                    style="width: 100%; padding: 12px; border-radius: 8px; background: hsla(220, 20%, 100%, 0.05); 
                           border: 1px solid hsla(220, 20%, 100%, 0.1); color: white">
              <option value="RS">Rumah Sakit (RS)</option>
              <option value="office">Kantor</option>
              <option value="retail">Retail</option>
              <option value="assembly">Assembly</option>
            </select>
          </div>
          <div class="form-group" style="margin-bottom: 16px">
            <label style="display: block; margin-bottom: 8px; font-size: 0.75rem; color: var(--text-secondary)">
              Jarak Tempuh (m)
            </label>
            <input type="number" id="egress-travel-dist" class="form-control" value="40" min="0"
                   style="width: 100%; padding: 12px; border-radius: 8px; background: hsla(220, 20%, 100%, 0.05); 
                          border: 1px solid hsla(220, 20%, 100%, 0.1); color: white">
          </div>
          <div class="form-group" style="margin-bottom: 16px">
            <label style="display: block; margin-bottom: 8px; font-size: 0.75rem; color: var(--text-secondary)">
              Lebar Pintu Keluar (m)
            </label>
            <input type="number" id="egress-exit-width" class="form-control" value="1.2" min="0" step="0.1"
                   style="width: 100%; padding: 12px; border-radius: 8px; background: hsla(220, 20%, 100%, 0.05); 
                          border: 1px solid hsla(220, 20%, 100%, 0.1); color: white">
          </div>
          <button class="btn btn-primary" style="width: 100%" onclick="window._calculateEgress()">
            <i class="fas fa-calculator" style="margin-right: 8px"></i> Analisis Egress
          </button>
          <div id="egress-analysis-result" style="margin-top: 20px; padding: 16px; background: hsla(220, 20%, 100%, 0.02); 
                                                  border-radius: 12px; display: none">
          </div>
        </div>

        <!-- Emergency Lighting -->
        <div class="card-quartz" style="padding: var(--space-6)">
          <h4 style="font-family: 'Outfit', sans-serif; font-weight: 800; color: white; margin-bottom: 20px">
            <i class="fas fa-lightbulb" style="margin-right: 8px; color: var(--gold-400)"></i>
            Emergency Lighting
          </h4>
          <div class="form-group" style="margin-bottom: 16px">
            <label style="display: block; margin-bottom: 8px; font-size: 0.75rem; color: var(--text-secondary)">
              Area (m²)
            </label>
            <input type="number" id="lighting-area" class="form-control" value="200" min="0"
                   style="width: 100%; padding: 12px; border-radius: 8px; background: hsla(220, 20%, 100%, 0.05); 
                          border: 1px solid hsla(220, 20%, 100%, 0.1); color: white">
          </div>
          <div class="form-group" style="margin-bottom: 16px">
            <label style="display: block; margin-bottom: 8px; font-size: 0.75rem; color: var(--text-secondary)">
              Tipe Lokasi
            </label>
            <select id="lighting-type" class="form-control"
                    style="width: 100%; padding: 12px; border-radius: 8px; background: hsla(220, 20%, 100%, 0.05); 
                           border: 1px solid hsla(220, 20%, 100%, 0.1); color: white">
              <option value="exit_sign">Exit Sign</option>
              <option value="corridor">Corridor</option>
              <option value="stairway">Stairway</option>
              <option value="assembly">Assembly Area</option>
            </select>
          </div>
          <button class="btn btn-primary" style="width: 100%" onclick="window._calculateEmergencyLighting()">
            <i class="fas fa-calculator" style="margin-right: 8px"></i> Hitung Kebutuhan
          </button>
          <div id="lighting-calc-result" style="margin-top: 20px; padding: 16px; background: hsla(220, 20%, 100%, 0.02); 
                                                 border-radius: 12px; display: none">
          </div>
        </div>
      </div>
    </div>
  `;
}

// ============================================================
// 8. CALCULATIONS TAB
// ============================================================

function renderCalculationsTab() {
  return `
    <div class="fire-tab-panel" id="tab-calculations" style="display: none">
      <div class="grid-2-col">
        <!-- Water Supply Duration -->
        <div class="card-quartz" style="padding: var(--space-6)">
          <h4 style="font-family: 'Outfit', sans-serif; font-weight: 800; color: white; margin-bottom: 20px">
            <i class="fas fa-database" style="margin-right: 8px; color: var(--brand-400)"></i>
            Water Supply Duration
          </h4>
          <div class="form-group" style="margin-bottom: 16px">
            <label style="display: block; margin-bottom: 8px; font-size: 0.75rem; color: var(--text-secondary)">
              Volume Tangki (liter)
            </label>
            <input type="number" id="tank-volume" class="form-control" value="30000" min="0"
                   style="width: 100%; padding: 12px; border-radius: 8px; background: hsla(220, 20%, 100%, 0.05); 
                          border: 1px solid hsla(220, 20%, 100%, 0.1); color: white">
          </div>
          <div class="form-group" style="margin-bottom: 16px">
            <label style="display: block; margin-bottom: 8px; font-size: 0.75rem; color: var(--text-secondary)">
              Debit Sprinkler (LPM)
            </label>
            <input type="number" id="sprinkler-flow-calc" class="form-control" value="1000" min="0"
                   style="width: 100%; padding: 12px; border-radius: 8px; background: hsla(220, 20%, 100%, 0.05); 
                          border: 1px solid hsla(220, 20%, 100%, 0.1); color: white">
          </div>
          <div class="form-group" style="margin-bottom: 16px">
            <label style="display: block; margin-bottom: 8px; font-size: 0.75rem; color: var(--text-secondary)">
              Debit Hydrant (LPM)
            </label>
            <input type="number" id="hydrant-flow-calc" class="form-control" value="400" min="0"
                   style="width: 100%; padding: 12px; border-radius: 8px; background: hsla(220, 20%, 100%, 0.05); 
                          border: 1px solid hsla(220, 20%, 100%, 0.1); color: white">
          </div>
          <button class="btn btn-primary" style="width: 100%" onclick="window._calculateWaterDuration()">
            <i class="fas fa-calculator" style="margin-right: 8px"></i> Hitung Durasi
          </button>
          <div id="water-duration-result" style="margin-top: 20px; padding: 16px; background: hsla(220, 20%, 100%, 0.02); 
                                                  border-radius: 12px; display: none">
          </div>
        </div>

        <!-- Fire Pump Power -->
        <div class="card-quartz" style="padding: var(--space-6)">
          <h4 style="font-family: 'Outfit', sans-serif; font-weight: 800; color: white; margin-bottom: 20px">
            <i class="fas fa-gear" style="margin-right: 8px; color: var(--warning-400)"></i>
            Fire Pump Power
          </h4>
          <div class="form-group" style="margin-bottom: 16px">
            <label style="display: block; margin-bottom: 8px; font-size: 0.75rem; color: var(--text-secondary)">
              Debit (LPM)
            </label>
            <input type="number" id="pump-flow" class="form-control" value="1500" min="0"
                   style="width: 100%; padding: 12px; border-radius: 8px; background: hsla(220, 20%, 100%, 0.05); 
                          border: 1px solid hsla(220, 20%, 100%, 0.1); color: white">
          </div>
          <div class="form-group" style="margin-bottom: 16px">
            <label style="display: block; margin-bottom: 8px; font-size: 0.75rem; color: var(--text-secondary)">
              Total Head (meter)
            </label>
            <input type="number" id="pump-head" class="form-control" value="60" min="0"
                   style="width: 100%; padding: 12px; border-radius: 8px; background: hsla(220, 20%, 100%, 0.05); 
                          border: 1px solid hsla(220, 20%, 100%, 0.1); color: white">
          </div>
          <div class="form-group" style="margin-bottom: 16px">
            <label style="display: block; margin-bottom: 8px; font-size: 0.75rem; color: var(--text-secondary)">
              Efisiensi Pompa (%)
            </label>
            <input type="number" id="pump-efficiency" class="form-control" value="70" min="0" max="100"
                   style="width: 100%; padding: 12px; border-radius: 8px; background: hsla(220, 20%, 100%, 0.05); 
                          border: 1px solid hsla(220, 20%, 100%, 0.1); color: white">
          </div>
          <button class="btn btn-primary" style="width: 100%" onclick="window._calculatePumpPower()">
            <i class="fas fa-calculator" style="margin-right: 8px"></i> Hitung Daya
          </button>
          <div id="pump-power-result" style="margin-top: 20px; padding: 16px; background: hsla(220, 20%, 100%, 0.02); 
                                              border-radius: 12px; display: none">
          </div>
        </div>
      </div>

      <!-- FRR Check -->
      <div class="card-quartz" style="padding: var(--space-6); margin-top: var(--space-6)">
        <h4 style="font-family: 'Outfit', sans-serif; font-weight: 800; color: white; margin-bottom: 20px">
          <i class="fas fa-shield-halved" style="margin-right: 8px; color: var(--danger-400)"></i>
          Fire Resistance Rating (FRR) Check
        </h4>
        <div class="grid-4-col">
          <div class="form-group">
            <label style="display: block; margin-bottom: 8px; font-size: 0.75rem; color: var(--text-secondary)">
              Elemen Struktur
            </label>
            <select id="frr-element" class="form-control"
                    style="width: 100%; padding: 12px; border-radius: 8px; background: hsla(220, 20%, 100%, 0.05); 
                           border: 1px solid hsla(220, 20%, 100%, 0.1); color: white">
              <option value="column">Kolom</option>
              <option value="beam">Balok</option>
              <option value="floor">Lantai</option>
              <option value="wall">Dinding</option>
              <option value="door">Pintu</option>
            </select>
          </div>
          <div class="form-group">
            <label style="display: block; margin-bottom: 8px; font-size: 0.75rem; color: var(--text-secondary)">
              Tinggi Bangunan (m)
            </label>
            <input type="number" id="frr-height" class="form-control" value="15" min="0"
                   style="width: 100%; padding: 12px; border-radius: 8px; background: hsla(220, 20%, 100%, 0.05); 
                          border: 1px solid hsla(220, 20%, 100%, 0.1); color: white">
          </div>
          <div class="form-group">
            <label style="display: block; margin-bottom: 8px; font-size: 0.75rem; color: var(--text-secondary)">
              Tipe Okupansi
            </label>
            <select id="frr-occupancy" class="form-control"
                    style="width: 100%; padding: 12px; border-radius: 8px; background: hsla(220, 20%, 100%, 0.05); 
                           border: 1px solid hsla(220, 20%, 100%, 0.1); color: white">
              <option value="office">Kantor</option>
              <option value="assembly">Assembly</option>
              <option value="high_hazard">High Hazard</option>
            </select>
          </div>
          <div style="display: flex; align-items: flex-end">
            <button class="btn btn-primary" style="width: 100%" onclick="window._checkFRR()">
              <i class="fas fa-check-circle" style="margin-right: 8px"></i> Cek FRR
            </button>
          </div>
        </div>
        <div id="frr-check-result" style="margin-top: 20px; padding: 16px; background: hsla(220, 20%, 100%, 0.02); 
                                          border-radius: 12px; display: none">
        </div>
      </div>
    </div>
  `;
}

// ============================================================
// 9. RISK ANALYSIS TAB
// ============================================================

function renderRiskTab() {
  return `
    <div class="fire-tab-panel" id="tab-risk" style="display: none">
      <div class="grid-2-col">
        <!-- Risk Matrix Calculator -->
        <div class="card-quartz" style="padding: var(--space-6)">
          <h4 style="font-family: 'Outfit', sans-serif; font-weight: 800; color: white; margin-bottom: 20px">
            <i class="fas fa-chart-line" style="margin-right: 8px; color: var(--danger-400)"></i>
            Fire Risk Assessment Matrix
          </h4>
          <div class="form-group" style="margin-bottom: 16px">
            <label style="display: block; margin-bottom: 8px; font-size: 0.75rem; color: var(--text-secondary)">
              Probabilitas (1-5)
            </label>
            <select id="risk-probability" class="form-control"
                    style="width: 100%; padding: 12px; border-radius: 8px; background: hsla(220, 20%, 100%, 0.05); 
                           border: 1px solid hsla(220, 20%, 100%, 0.1); color: white">
              <option value="1">1 - Sangat Jarang</option>
              <option value="2">2 - Jarang</option>
              <option value="3" selected>3 - Mungkin</option>
              <option value="4">4 - Sering</option>
              <option value="5">5 - Sangat Sering</option>
            </select>
          </div>
          <div class="form-group" style="margin-bottom: 16px">
            <label style="display: block; margin-bottom: 8px; font-size: 0.75rem; color: var(--text-secondary)">
              Konsekuensi (1-5)
            </label>
            <select id="risk-consequence" class="form-control"
                    style="width: 100%; padding: 12px; border-radius: 8px; background: hsla(220, 20%, 100%, 0.05); 
                           border: 1px solid hsla(220, 20%, 100%, 0.1); color: white">
              <option value="1">1 - Trivial</option>
              <option value="2">2 - Minor</option>
              <option value="3" selected>3 - Moderate</option>
              <option value="4">4 - Major</option>
              <option value="5">5 - Catastrophic</option>
            </select>
          </div>
          <div class="form-group" style="margin-bottom: 16px">
            <label style="display: block; margin-bottom: 8px; font-size: 0.75rem; color: var(--text-secondary)">
              Jenis Konsekuensi
            </label>
            <select id="risk-consequence-type" class="form-control"
                    style="width: 100%; padding: 12px; border-radius: 8px; background: hsla(220, 20%, 100%, 0.05); 
                           border: 1px solid hsla(220, 20%, 100%, 0.1); color: white">
              <option value="life">Life Safety</option>
              <option value="property">Property</option>
              <option value="business">Business</option>
              <option value="environment">Environment</option>
            </select>
          </div>
          <button class="btn btn-primary" style="width: 100%" onclick="window._calculateFireRisk()">
            <i class="fas fa-calculator" style="margin-right: 8px"></i> Hitung Risk Score
          </button>
          <div id="risk-calc-result" style="margin-top: 20px; padding: 16px; background: hsla(220, 20%, 100%, 0.02); 
                                            border-radius: 12px; display: none">
          </div>
        </div>

        <!-- Deficiency Scorecard -->
        <div class="card-quartz" style="padding: var(--space-6)">
          <h4 style="font-family: 'Outfit', sans-serif; font-weight: 800; color: white; margin-bottom: 20px">
            <i class="fas fa-clipboard-check" style="margin-right: 8px; color: var(--warning-400)"></i>
            Deficiency Scorecard (SLF)
          </h4>
          <div style="margin-bottom: 20px">
            <div class="flex-between" style="margin-bottom: 12px; padding: 12px; background: hsla(0, 85%, 60%, 0.1); border-radius: 8px">
              <div>
                <div style="font-size: 0.8rem; font-weight: 700; color: white">Critical (Life Safety)</div>
                <div style="font-size: 0.7rem; color: var(--text-tertiary)">Bobot: 10 poin per item</div>
              </div>
              <input type="number" id="def-critical" class="form-control" value="0" min="0"
                     style="width: 80px; padding: 8px; border-radius: 6px; background: hsla(220, 20%, 100%, 0.05); 
                            border: 1px solid hsla(220, 20%, 100%, 0.1); color: white; text-align: center">
            </div>
            <div class="flex-between" style="margin-bottom: 12px; padding: 12px; background: hsla(45, 90%, 60%, 0.1); border-radius: 8px">
              <div>
                <div style="font-size: 0.8rem; font-weight: 700; color: white">Major</div>
                <div style="font-size: 0.7rem; color: var(--text-tertiary)">Bobot: 5 poin per item</div>
              </div>
              <input type="number" id="def-major" class="form-control" value="0" min="0"
                     style="width: 80px; padding: 8px; border-radius: 6px; background: hsla(220, 20%, 100%, 0.05); 
                            border: 1px solid hsla(220, 20%, 100%, 0.1); color: white; text-align: center">
            </div>
            <div class="flex-between" style="padding: 12px; background: hsla(220, 20%, 100%, 0.05); border-radius: 8px">
              <div>
                <div style="font-size: 0.8rem; font-weight: 700; color: white">Minor</div>
                <div style="font-size: 0.7rem; color: var(--text-tertiary)">Bobot: 1 poin per item</div>
              </div>
              <input type="number" id="def-minor" class="form-control" value="0" min="0"
                     style="width: 80px; padding: 8px; border-radius: 6px; background: hsla(220, 20%, 100%, 0.05); 
                            border: 1px solid hsla(220, 20%, 100%, 0.1); color: white; text-align: center">
            </div>
          </div>
          <button class="btn btn-primary" style="width: 100%" onclick="window._calculateDeficiencyScore()">
            <i class="fas fa-calculator" style="margin-right: 8px"></i> Hitung Score
          </button>
          <div id="deficiency-score-result" style="margin-top: 20px; padding: 16px; background: hsla(220, 20%, 100%, 0.02); 
                                                    border-radius: 12px; display: none">
          </div>
        </div>
      </div>

      <!-- Risk Matrix Visualization -->
      <div class="card-quartz" style="padding: var(--space-6); margin-top: var(--space-6)">
        <h4 style="font-family: 'Outfit', sans-serif; font-weight: 800; color: white; margin-bottom: 20px">
          <i class="fas fa-table-cells" style="margin-right: 8px; color: var(--brand-400)"></i>
          Risk Matrix Reference
        </h4>
        <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 4px; max-width: 500px; margin: 0 auto">
          ${renderRiskMatrixCell('', 'transparent', '#')}
          ${[1, 2, 3, 4, 5].map(c => renderRiskMatrixCell(`C${c}`, 'transparent', c)).join('')}
          ${[5, 4, 3, 2, 1].map(p => {
            let color;
            if (p * 1 <= 4) color = '#22c55e'; // LOW - Green
            else if (p * 1 <= 9) color = '#eab308'; // MEDIUM - Yellow
            else if (p * 1 <= 14) color = '#f97316'; // HIGH - Orange
            else color = '#ef4444'; // EXTREME - Red
            
            return renderRiskMatrixCell(`P${p}`, 'transparent', p) + 
              [1, 2, 3, 4, 5].map(c => {
                const score = p * c;
                let bg = '#22c55e33';
                if (score > 4) bg = '#eab30833';
                if (score > 9) bg = '#f9731633';
                if (score > 14) bg = '#ef444433';
                return renderRiskMatrixCell(score.toString(), bg, '');
              }).join('');
          }).join('')}
        </div>
        <div style="display: flex; justify-content: center; gap: 16px; margin-top: 20px">
          <div style="display: flex; align-items: center; gap: 6px">
            <div style="width: 20px; height: 20px; background: #22c55e33; border: 1px solid #22c55e"></div>
            <span style="font-size: 0.75rem; color: var(--text-secondary)">LOW (1-4)</span>
          </div>
          <div style="display: flex; align-items: center; gap: 6px">
            <div style="width: 20px; height: 20px; background: #eab30833; border: 1px solid #eab308"></div>
            <span style="font-size: 0.75rem; color: var(--text-secondary)">MEDIUM (5-9)</span>
          </div>
          <div style="display: flex; align-items: center; gap: 6px">
            <div style="width: 20px; height: 20px; background: #f9731633; border: 1px solid #f97316"></div>
            <span style="font-size: 0.75rem; color: var(--text-secondary)">HIGH (10-14)</span>
          </div>
          <div style="display: flex; align-items: center; gap: 6px">
            <div style="width: 20px; height: 20px; background: #ef444433; border: 1px solid #ef4444"></div>
            <span style="font-size: 0.75rem; color: var(--text-secondary)">EXTREME (15-25)</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderRiskMatrixCell(text, bg, label) {
  const color = label ? 'var(--text-tertiary)' : 'white';
  return `
    <div style="aspect-ratio: 1; display: flex; align-items: center; justify-content: center; 
                background: ${bg}; border: 1px solid hsla(220, 20%, 100%, 0.1); 
                font-size: 0.75rem; font-weight: 700; color: ${color}; 
                border-radius: 4px">
      ${text}
    </div>
  `;
}

// ============================================================
// 10. DATA FETCH FUNCTIONS
// ============================================================

async function fetchFireAssets(projectId) {
  try {
    const { data, error } = await supabase
      .from('fire_assets')
      .select('*')
      .eq('project_id', projectId)
      .order('asset_type', { ascending: true });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching fire assets:', error);
    return [];
  }
}

// ============================================================
// 11. HANDLERS INITIALIZATION
// ============================================================

export function initFireProtectionHandlers(projectId) {
  // Tab Switching
  window._switchFireTab = (tabId, btn) => {
    // Update button states
    document.querySelectorAll('.fire-tab-btn').forEach(b => {
      b.classList.remove('active');
      b.style.background = 'transparent';
      b.style.borderBottomColor = 'transparent';
      b.style.color = 'var(--text-tertiary)';
    });
    if (btn) {
      btn.classList.add('active');
      btn.style.background = 'hsla(0, 85%, 60%, 0.1)';
      btn.style.borderBottomColor = 'var(--danger-400)';
      btn.style.color = 'white';
    }

    // Show/hide tab content
    document.querySelectorAll('.fire-tab-content').forEach(content => {
      content.style.display = 'none';
    });
    const targetContent = document.getElementById(`fire-tab-${tabId}`);
    if (targetContent) {
      targetContent.style.display = 'block';
    }
  };
  
  // Calculator Handlers
  window._calculateSmokeCoverage = () => {
    const ceilingHeight = parseFloat(document.getElementById('ceiling-height')?.value || 3);
    const floorArea = parseFloat(document.getElementById('floor-area-det')?.value || 100);
    
    const coverage = FireCalc.calculateSmokeDetectorCoverage(ceilingHeight);
    const recommendedQty = coverage.recommendedQuantity(floorArea);
    
    const resultDiv = document.getElementById('smoke-coverage-result');
    if (resultDiv) {
      resultDiv.style.display = 'block';
      resultDiv.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px">
          <div style="background: hsla(220, 20%, 100%, 0.03); padding: 12px; border-radius: 8px">
            <div style="font-size: 0.7rem; color: var(--text-tertiary)">Radius Coverage</div>
            <div style="font-size: 1.2rem; font-weight: 800; color: var(--success-400)">${coverage.maxRadius} m</div>
          </div>
          <div style="background: hsla(220, 20%, 100%, 0.03); padding: 12px; border-radius: 8px">
            <div style="font-size: 0.7rem; color: var(--text-tertiary)">Max Area per Detector</div>
            <div style="font-size: 1.2rem; font-weight: 800; color: var(--success-400)">${coverage.maxArea} m²</div>
          </div>
          <div style="background: hsla(220, 20%, 100%, 0.03); padding: 12px; border-radius: 8px">
            <div style="font-size: 0.7rem; color: var(--text-tertiary)">Max Spacing</div>
            <div style="font-size: 1.2rem; font-weight: 800; color: var(--success-400)">${coverage.spacing} m</div>
          </div>
          <div style="background: hsla(220, 20%, 100%, 0.03); padding: 12px; border-radius: 8px">
            <div style="font-size: 0.7rem; color: var(--text-tertiary)">Recommended Qty</div>
            <div style="font-size: 1.2rem; font-weight: 800; color: var(--danger-400)">${recommendedQty} unit</div>
          </div>
        </div>
        <div style="margin-top: 12px; padding: 12px; background: hsla(220, 95%, 52%, 0.1); border-radius: 8px; font-size: 0.75rem; color: var(--text-secondary)">
          <i class="fas fa-info-circle" style="margin-right: 6px; color: var(--brand-400)"></i>
          Berdasarkan SNI 03-1735-2004 Pasal 5.2.1
        </div>
      `;
    }
  };
  
  window._checkMCPPlacement = () => {
    const spacing = parseFloat(document.getElementById('mcp-spacing')?.value || 25);
    const height = parseFloat(document.getElementById('mcp-height')?.value || 1.4);
    
    const result = FireCalc.checkMCPPlacement(spacing, height, true);
    
    const resultDiv = document.getElementById('mcp-check-result');
    if (resultDiv) {
      resultDiv.style.display = 'block';
      resultDiv.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px">
          <div style="width: 48px; height: 48px; border-radius: 50%; background: ${result.allPass ? 'var(--success-400)22' : 'var(--danger-400)22'}; 
                      display: flex; align-items: center; justify-content: center">
            <i class="fas ${result.allPass ? 'fa-check' : 'fa-xmark'}" style="font-size: 1.5rem; color: ${result.allPass ? 'var(--success-400)' : 'var(--danger-400)'}"></i>
          </div>
          <div>
            <div style="font-size: 1rem; font-weight: 800; color: white">${result.status}</div>
            <div style="font-size: 0.75rem; color: var(--text-tertiary)">SNI 03-1735-2004 Pasal 6.1</div>
          </div>
        </div>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px">
          <div style="padding: 12px; background: ${result.checks.spacing.pass ? 'hsla(158, 85%, 45%, 0.1)' : 'hsla(0, 85%, 60%, 0.1)'}; border-radius: 8px">
            <div style="font-size: 0.7rem; color: var(--text-tertiary)">Jarak antar MCP</div>
            <div style="font-size: 1rem; font-weight: 700; color: white">${result.checks.spacing.value} m</div>
            <div style="font-size: 0.65rem; color: ${result.checks.spacing.pass ? 'var(--success-400)' : 'var(--danger-400)'}">
              Max: ${result.checks.spacing.max} m
            </div>
          </div>
          <div style="padding: 12px; background: ${result.checks.height.pass ? 'hsla(158, 85%, 45%, 0.1)' : 'hsla(0, 85%, 60%, 0.1)'}; border-radius: 8px">
            <div style="font-size: 0.7rem; color: var(--text-tertiary)">Tinggi Pemasangan</div>
            <div style="font-size: 1rem; font-weight: 700; color: white">${result.checks.height.value} m</div>
            <div style="font-size: 0.65rem; color: ${result.checks.height.pass ? 'var(--success-400)' : 'var(--danger-400)'}">
              Ideal: ${result.checks.height.ideal} m
            </div>
          </div>
        </div>
      `;
    }
  };
  
  window._calculateAPARRequirements = () => {
    const hazardClass = document.getElementById('apar-hazard-class')?.value || 'A';
    const floorArea = parseFloat(document.getElementById('apar-floor-area')?.value || 500);
    const buildingType = document.getElementById('apar-building-type')?.value || 'office';
    
    const req = FireCalc.calculateAPARRequirements(hazardClass, floorArea, buildingType);
    
    const resultDiv = document.getElementById('apar-requirements-result');
    if (resultDiv) {
      resultDiv.style.display = 'block';
      resultDiv.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px">
          <div style="padding: 12px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px">
            <div style="font-size: 0.7rem; color: var(--text-tertiary)">Jumlah APAR Dibutuhkan</div>
            <div style="font-size: 1.5rem; font-weight: 800; color: var(--danger-400)">${req.requiredQuantity} unit</div>
          </div>
          <div style="padding: 12px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px">
            <div style="font-size: 0.7rem; color: var(--text-tertiary)">Kapasitas Minimum</div>
            <div style="font-size: 1.2rem; font-weight: 800; color: var(--success-400)">${req.capacity.minCapacity} kg</div>
            <div style="font-size: 0.65rem; color: var(--text-tertiary)">${req.capacity.type}</div>
          </div>
          <div style="padding: 12px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px">
            <div style="font-size: 0.7rem; color: var(--text-tertiary)">Max Travel Distance</div>
            <div style="font-size: 1.2rem; font-weight: 800; color: var(--brand-400)">${req.placement.maxTravelDistance} m</div>
          </div>
          <div style="padding: 12px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px">
            <div style="font-size: 0.7rem; color: var(--text-tertiary)">Mounting Height</div>
            <div style="font-size: 1.2rem; font-weight: 800; color: var(--gold-400)">${req.placement.mountingHeight.min}-${req.placement.mountingHeight.max} m</div>
          </div>
        </div>
        <div style="margin-top: 12px; font-size: 0.7rem; color: var(--text-tertiary)">
          <i class="fas fa-book" style="margin-right: 6px; color: var(--brand-400)"></i>
          SNI 03-3973-2003 & NFPA 10
        </div>
      `;
    }
  };
  
  window._calculateHydrantFlow = () => {
    const nozzleDia = parseFloat(document.getElementById('hydrant-nozzle-dia')?.value || 65);
    const pressure = parseFloat(document.getElementById('hydrant-pressure')?.value || 700);
    
    const result = FireCalc.calculateHydrantFlow(nozzleDia, pressure, 'kPa');
    
    const resultDiv = document.getElementById('hydrant-flow-result');
    if (resultDiv) {
      resultDiv.style.display = 'block';
      resultDiv.innerHTML = `
        <div style="text-align: center; margin-bottom: 16px">
          <div style="font-size: 0.75rem; color: var(--text-tertiary)">Debit Aliran</div>
          <div style="font-size: 2.5rem; font-weight: 800; color: ${result.compliance.outdoor ? 'var(--success-400)' : 'var(--danger-400)'}">
            ${result.flowRate.value}
          </div>
          <div style="font-size: 1rem; color: var(--text-secondary)">LPM</div>
        </div>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px">
          <div style="padding: 12px; background: ${result.compliance.indoor ? 'hsla(158, 85%, 45%, 0.1)' : 'hsla(0, 85%, 60%, 0.1)'}; border-radius: 8px; text-align: center">
            <div style="font-size: 0.7rem; color: var(--text-tertiary)">Indoor Standard</div>
            <div style="font-size: 0.9rem; font-weight: 700; color: white">${result.standards.indoor.min} LPM</div>
            <div style="font-size: 0.65rem; color: ${result.compliance.indoor ? 'var(--success-400)' : 'var(--danger-400)'}">
              ${result.compliance.indoor ? '✓ COMPLIANT' : '✗ FAIL'}
            </div>
          </div>
          <div style="padding: 12px; background: ${result.compliance.outdoor ? 'hsla(158, 85%, 45%, 0.1)' : 'hsla(0, 85%, 60%, 0.1)'}; border-radius: 8px; text-align: center">
            <div style="font-size: 0.7rem; color: var(--text-tertiary)">Outdoor Standard</div>
            <div style="font-size: 0.9rem; font-weight: 700; color: white">${result.standards.outdoor.min} LPM</div>
            <div style="font-size: 0.65rem; color: ${result.compliance.outdoor ? 'var(--success-400)' : 'var(--danger-400)'}">
              ${result.compliance.outdoor ? '✓ COMPLIANT' : '✗ FAIL'}
            </div>
          </div>
        </div>
        <div style="margin-top: 12px; padding: 12px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px">
          <div style="font-size: 0.7rem; color: var(--text-tertiary); margin-bottom: 4px">Formula</div>
          <div style="font-size: 0.8rem; color: var(--text-secondary); font-family: monospace">
            Q = 0.067 × d² × √P = 0.067 × ${nozzleDia}² × √${Math.round(pressure/100 * 10)/10}
          </div>
        </div>
      `;
    }
  };
  
  window._calculateSprinklerDesign = () => {
    const hazard = document.getElementById('sprinkler-hazard')?.value || 'Light';
    const area = parseFloat(document.getElementById('sprinkler-area')?.value || 139);
    
    const design = FireCalc.calculateSprinklerRequirements(hazard, area);
    
    const resultDiv = document.getElementById('sprinkler-design-result');
    if (resultDiv) {
      resultDiv.style.display = 'block';
      resultDiv.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px">
          <div style="padding: 12px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px; text-align: center">
            <div style="font-size: 0.7rem; color: var(--text-tertiary)">Design Density</div>
            <div style="font-size: 1.5rem; font-weight: 800; color: var(--success-400)">${design.criteria.density}</div>
            <div style="font-size: 0.65rem; color: var(--text-tertiary)">mm/min</div>
          </div>
          <div style="padding: 12px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px; text-align: center">
            <div style="font-size: 0.7rem; color: var(--text-tertiary)">Required Flow</div>
            <div style="font-size: 1.5rem; font-weight: 800; color: var(--danger-400)">${design.requiredFlow}</div>
            <div style="font-size: 0.65rem; color: var(--text-tertiary)">LPM</div>
          </div>
          <div style="padding: 12px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px; text-align: center">
            <div style="font-size: 0.7rem; color: var(--text-tertiary)">K-Factor</div>
            <div style="font-size: 1.5rem; font-weight: 800; color: var(--brand-400)">${design.kFactor}</div>
            <div style="font-size: 0.65rem; color: var(--text-tertiary)">@ 0.7 bar</div>
          </div>
        </div>
        <div style="margin-top: 16px; display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px">
          <div style="padding: 12px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px">
            <div style="font-size: 0.7rem; color: var(--text-tertiary)">Max Spacing</div>
            <div style="font-size: 1rem; font-weight: 700; color: white">${design.placement.maxSpacing} m</div>
          </div>
          <div style="padding: 12px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px">
            <div style="font-size: 0.7rem; color: var(--text-tertiary)">Max Coverage Area</div>
            <div style="font-size: 1rem; font-weight: 700; color: white">${design.placement.maxCoverageArea} m²</div>
          </div>
          <div style="padding: 12px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px">
            <div style="font-size: 0.7rem; color: var(--text-tertiary)">Sprinklers in Design Area</div>
            <div style="font-size: 1rem; font-weight: 700; color: white">${design.sprinklersInArea} heads</div>
          </div>
          <div style="padding: 12px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px">
            <div style="font-size: 0.7rem; color: var(--text-tertiary)">Flow per Sprinkler</div>
            <div style="font-size: 1rem; font-weight: 700; color: white">${design.flowPerSprinkler} LPM</div>
          </div>
        </div>
        <div style="margin-top: 12px; font-size: 0.7rem; color: var(--text-tertiary)">
          <i class="fas fa-book" style="margin-right: 6px; color: var(--brand-400)"></i>
          SNI 03-1745-2000 & NFPA 13
        </div>
      `;
    }
  };
  
  // More calculator handlers...
  window._calculateEgress = () => {
    const floorArea = parseFloat(document.getElementById('egress-floor-area')?.value || 1000);
    const occupancy = document.getElementById('egress-occupancy')?.value || 'office';
    const travelDist = parseFloat(document.getElementById('egress-travel-dist')?.value || 40);
    const exitWidth = parseFloat(document.getElementById('egress-exit-width')?.value || 1.2);
    
    const result = FireCalc.calculateEgressRequirements(floorArea, occupancy, travelDist, exitWidth);
    
    const resultDiv = document.getElementById('egress-analysis-result');
    if (resultDiv) {
      resultDiv.style.display = 'block';
      resultDiv.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px">
          <div style="padding: 12px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px">
            <div style="font-size: 0.7rem; color: var(--text-tertiary)">Occupant Load</div>
            <div style="font-size: 1.5rem; font-weight: 800; color: var(--danger-400)">${result.occupantLoad} orang</div>
            <div style="font-size: 0.65rem; color: var(--text-tertiary)">${result.loadFactor} m²/person</div>
          </div>
          <div style="padding: 12px; background: ${result.travelDistance.compliant ? 'hsla(158, 85%, 45%, 0.1)' : 'hsla(0, 85%, 60%, 0.1)'}; border-radius: 8px">
            <div style="font-size: 0.7rem; color: var(--text-tertiary)">Travel Distance</div>
            <div style="font-size: 1.2rem; font-weight: 800; color: ${result.travelDistance.compliant ? 'var(--success-400)' : 'var(--danger-400)'}">
              ${result.travelDistance.actual} m
            </div>
            <div style="font-size: 0.65rem; color: ${result.travelDistance.compliant ? 'var(--success-400)' : 'var(--danger-400)'}">
              ${result.travelDistance.compliant ? '✓ COMPLIANT' : '✗ FAIL (Max: ' + result.travelDistance.maxSprinklered + 'm)'}
            </div>
          </div>
          <div style="padding: 12px; background: ${result.exitWidth.compliant ? 'hsla(158, 85%, 45%, 0.1)' : 'hsla(0, 85%, 60%, 0.1)'}; border-radius: 8px">
            <div style="font-size: 0.7rem; color: var(--text-tertiary)">Exit Width</div>
            <div style="font-size: 1.2rem; font-weight: 800; color: ${result.exitWidth.compliant ? 'var(--success-400)' : 'var(--danger-400)'}">
              ${result.exitWidth.actual} m
            </div>
            <div style="font-size: 0.65rem; color: ${result.exitWidth.compliant ? 'var(--success-400)' : 'var(--danger-400)'}">
              ${result.exitWidth.compliant ? '✓ COMPLIANT' : '✗ FAIL (Min: ' + result.exitWidth.required + 'm)'}
            </div>
          </div>
          <div style="padding: 12px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px">
            <div style="font-size: 0.7rem; color: var(--text-tertiary)">Dead End Limit</div>
            <div style="font-size: 1.2rem; font-weight: 800; color: var(--brand-400)">${result.deadEndLimit} m</div>
          </div>
        </div>
        <div style="margin-top: 12px; padding: 12px; background: hsla(0, 85%, 60%, 0.05); border-radius: 8px">
          <div style="font-size: 0.75rem; color: var(--text-secondary)">
            <i class="fas fa-door-open" style="margin-right: 6px; color: var(--danger-400)"></i>
            Panic Bar Required: ${result.doorRequirements.panicBar ? 'YA' : 'TIDAK'} | 
            Swing Direction: ${result.doorRequirements.swingDirection}
          </div>
        </div>
      `;
    }
  };
  
  window._calculateEmergencyLighting = () => {
    const area = parseFloat(document.getElementById('lighting-area')?.value || 200);
    const type = document.getElementById('lighting-type')?.value || 'corridor';
    
    const result = FireCalc.calculateEmergencyLighting(area, type);
    
    const resultDiv = document.getElementById('lighting-calc-result');
    if (resultDiv) {
      resultDiv.style.display = 'block';
      resultDiv.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px">
          <div style="padding: 12px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px; text-align: center">
            <div style="font-size: 0.7rem; color: var(--text-tertiary)">Required Lux</div>
            <div style="font-size: 1.5rem; font-weight: 800; color: var(--success-400)">${result.requiredLux}</div>
            <div style="font-size: 0.65rem; color: var(--text-tertiary)">lux</div>
          </div>
          <div style="padding: 12px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px; text-align: center">
            <div style="font-size: 0.7rem; color: var(--text-tertiary)">Fixtures Required</div>
            <div style="font-size: 1.5rem; font-weight: 800; color: var(--danger-400)">${result.requiredFixtures}</div>
            <div style="font-size: 0.65rem; color: var(--text-tertiary)">units</div>
          </div>
        </div>
        <div style="margin-top: 12px; padding: 12px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px">
          <div style="font-size: 0.7rem; color: var(--text-tertiary); margin-bottom: 4px">Battery Backup</div>
          <div style="font-size: 0.9rem; color: var(--text-secondary)">
            Min Duration: ${result.batteryBackup.minDuration} minutes | 
            Est. Load: ${result.batteryBackup.load} W
          </div>
        </div>
      `;
    }
  };
  
  window._calculateWaterDuration = () => {
    const tankVol = parseFloat(document.getElementById('tank-volume')?.value || 30000);
    const sprinklerFlow = parseFloat(document.getElementById('sprinkler-flow-calc')?.value || 1000);
    const hydrantFlow = parseFloat(document.getElementById('hydrant-flow-calc')?.value || 400);
    
    const result = FireCalc.calculateWaterSupplyDuration(tankVol, sprinklerFlow, hydrantFlow);
    
    const resultDiv = document.getElementById('water-duration-result');
    if (resultDiv) {
      resultDiv.style.display = 'block';
      resultDiv.innerHTML = `
        <div style="text-align: center; margin-bottom: 16px">
          <div style="font-size: 0.75rem; color: var(--text-tertiary)">Water Supply Duration</div>
          <div style="font-size: 2.5rem; font-weight: 800; color: ${result.compliance ? 'var(--success-400)' : 'var(--danger-400)'}">
            ${result.durationMinutes}
          </div>
          <div style="font-size: 1rem; color: var(--text-secondary)">minutes (${result.durationHours} hours)</div>
        </div>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px">
          <div style="padding: 12px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px">
            <div style="font-size: 0.7rem; color: var(--text-tertiary)">Required Duration</div>
            <div style="font-size: 1.2rem; font-weight: 800; color: white">${result.requiredDuration} min</div>
          </div>
          <div style="padding: 12px; background: ${result.compliance ? 'hsla(158, 85%, 45%, 0.1)' : 'hsla(0, 85%, 60%, 0.1)'}; border-radius: 8px">
            <div style="font-size: 0.7rem; color: var(--text-tertiary)">Status</div>
            <div style="font-size: 1.2rem; font-weight: 800; color: ${result.compliance ? 'var(--success-400)' : 'var(--danger-400)'}">
              ${result.compliance ? '✓ ADEQUATE' : '✗ INSUFFICIENT'}
            </div>
          </div>
        </div>
        ${!result.compliance ? `
          <div style="margin-top: 12px; padding: 12px; background: hsla(0, 85%, 60%, 0.1); border-radius: 8px">
            <div style="font-size: 0.75rem; color: var(--danger-400)">
              <i class="fas fa-triangle-exclamation" style="margin-right: 6px"></i>
              Minimum tank volume required: ${Math.round(result.tankVolumeRequired)} liters
            </div>
          </div>
        ` : ''}
      `;
    }
  };
  
  window._calculatePumpPower = () => {
    const flow = parseFloat(document.getElementById('pump-flow')?.value || 1500);
    const head = parseFloat(document.getElementById('pump-head')?.value || 60);
    const efficiency = parseFloat(document.getElementById('pump-efficiency')?.value || 70);
    
    const result = FireCalc.calculateFirePumpPower(flow, head, efficiency / 100, 'LPM');
    
    const resultDiv = document.getElementById('pump-power-result');
    if (resultDiv) {
      resultDiv.style.display = 'block';
      resultDiv.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 16px">
          <div style="padding: 12px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px; text-align: center">
            <div style="font-size: 0.7rem; color: var(--text-tertiary)">Power Required</div>
            <div style="font-size: 1.8rem; font-weight: 800; color: var(--danger-400)">${result.powerKW}</div>
            <div style="font-size: 0.8rem; color: var(--text-tertiary)">kW (${result.powerHP} HP)</div>
          </div>
          <div style="padding: 12px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px">
            <div style="font-size: 0.7rem; color: var(--text-tertiary)">Electrical</div>
            <div style="font-size: 0.9rem; font-weight: 700; color: white">${result.electrical.voltage}V / ${result.electrical.current}A</div>
            <div style="font-size: 0.65rem; color: var(--text-tertiary)">Cable: ${result.electrical.cableSize}</div>
          </div>
        </div>
        <div style="padding: 12px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px">
          <div style="font-size: 0.7rem; color: var(--text-tertiary); margin-bottom: 8px">Backup Power Required</div>
          <div style="display: flex; gap: 12px">
            <span class="badge" style="background: ${result.backupRequired.diesel ? 'var(--warning-400)22' : 'var(--text-tertiary)22'}; 
                          color: ${result.backupRequired.diesel ? 'var(--warning-400)' : 'var(--text-tertiary)'}; 
                          border: 1px solid ${result.backupRequired.diesel ? 'var(--warning-400)44' : 'var(--text-tertiary)44'}; font-size: 10px">
              Diesel: ${result.backupRequired.diesel ? 'YES' : 'Optional'}
            </span>
            <span class="badge" style="background: var(--success-400)22; color: var(--success-400); 
                          border: 1px solid var(--success-400)44; font-size: 10px">
              Electric: Required
            </span>
          </div>
        </div>
      `;
    }
  };
  
  window._checkFRR = () => {
    const element = document.getElementById('frr-element')?.value || 'column';
    const height = parseFloat(document.getElementById('frr-height')?.value || 15);
    const occupancy = document.getElementById('frr-occupancy')?.value || 'office';
    
    const result = FireCalc.checkFRRRequirements(element, height, occupancy, true);
    
    const resultDiv = document.getElementById('frr-check-result');
    if (resultDiv) {
      resultDiv.style.display = 'block';
      resultDiv.innerHTML = `
        <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 16px">
          <div style="width: 80px; height: 80px; border-radius: 50%; background: hsla(0, 85%, 60%, 0.1); 
                      display: flex; align-items: center; justify-content: center; border: 3px solid var(--danger-400)">
            <div style="text-align: center">
              <div style="font-size: 1.5rem; font-weight: 800; color: var(--danger-400)">${result.requiredFRR}</div>
              <div style="font-size: 0.6rem; color: var(--text-tertiary)">HOURS</div>
            </div>
          </div>
          <div>
            <div style="font-size: 1.2rem; font-weight: 800; color: white">${result.elementType.toUpperCase()}</div>
            <div style="font-size: 0.8rem; color: var(--text-tertiary)">Risk Level: ${result.riskLevel}</div>
            <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 4px">
              ${result.requiredFRRMinutes} minutes FRR required
            </div>
          </div>
        </div>
        <div style="padding: 12px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px">
          <div style="font-size: 0.75rem; color: var(--text-secondary)">
            <i class="fas fa-info-circle" style="margin-right: 6px; color: var(--brand-400)"></i>
            ${result.notes}
          </div>
        </div>
      `;
    }
  };
  
  window._calculateFireRisk = () => {
    const prob = parseInt(document.getElementById('risk-probability')?.value || 3);
    const cons = parseInt(document.getElementById('risk-consequence')?.value || 3);
    const type = document.getElementById('risk-consequence-type')?.value || 'life';
    
    const result = FireCalc.calculateFireRisk(prob, cons, type);
    
    const resultDiv = document.getElementById('risk-calc-result');
    if (resultDiv) {
      resultDiv.style.display = 'block';
      resultDiv.innerHTML = `
        <div style="text-align: center; margin-bottom: 16px">
          <div style="width: 100px; height: 100px; border-radius: 50%; background: ${result.colorCode}22; 
                      display: flex; align-items: center; justify-content: center; margin: 0 auto 12px; 
                      border: 4px solid ${result.colorCode}">
            <div>
              <div style="font-size: 2rem; font-weight: 800; color: ${result.colorCode}">${result.riskScore}</div>
              <div style="font-size: 0.6rem; color: var(--text-tertiary)">SCORE</div>
            </div>
          </div>
          <div style="font-size: 1.2rem; font-weight: 800; color: ${result.colorCode}">${result.riskLevel}</div>
          <div style="font-size: 0.75rem; color: var(--text-tertiary)">${result.probabilityLabel} × ${result.consequenceLabel}</div>
        </div>
        <div style="padding: 12px; background: ${result.colorCode}22; border-radius: 8px">
          <div style="font-size: 0.75rem; color: var(--text-secondary)">
            <i class="fas fa-exclamation-triangle" style="margin-right: 6px; color: ${result.colorCode}"></i>
            <strong>Action Required:</strong> ${result.actionRequired}
          </div>
        </div>
      `;
    }
  };
  
  window._calculateDeficiencyScore = () => {
    const critical = parseInt(document.getElementById('def-critical')?.value || 0);
    const major = parseInt(document.getElementById('def-major')?.value || 0);
    const minor = parseInt(document.getElementById('def-minor')?.value || 0);
    
    const deficiencies = [
      { severity: 'critical', count: critical },
      { severity: 'major', count: major },
      { severity: 'minor', count: minor }
    ];
    
    const result = FireCalc.calculateDeficiencyScore(deficiencies);
    
    const resultDiv = document.getElementById('deficiency-score-result');
    if (resultDiv) {
      resultDiv.style.display = 'block';
      resultDiv.innerHTML = `
        <div style="text-align: center; margin-bottom: 16px">
          <div style="width: 100px; height: 100px; border-radius: 50%; 
                      background: ${result.result === 'PASS' ? 'var(--success-400)22' : 'var(--danger-400)22'}; 
                      display: flex; align-items: center; justify-content: center; margin: 0 auto 12px; 
                      border: 4px solid ${result.result === 'PASS' ? 'var(--success-400)' : 'var(--danger-400)'}">
            <div>
              <div style="font-size: 2rem; font-weight: 800; 
                          color: ${result.result === 'PASS' ? 'var(--success-400)' : 'var(--danger-400)'}">
                ${result.totalScore}
              </div>
              <div style="font-size: 0.6rem; color: var(--text-tertiary)">POINTS</div>
            </div>
          </div>
          <div style="font-size: 1.2rem; font-weight: 800; 
                      color: ${result.result === 'PASS' ? 'var(--success-400)' : 'var(--danger-400)'}">
            ${result.result}
          </div>
          <div style="font-size: 0.75rem; color: var(--text-tertiary)">
            Pass Threshold: ${result.passThreshold} points
          </div>
        </div>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 12px">
          <div style="padding: 8px; background: hsla(0, 85%, 60%, 0.1); border-radius: 8px; text-align: center">
            <div style="font-size: 0.65rem; color: var(--text-tertiary)">Critical (×10)</div>
            <div style="font-size: 1rem; font-weight: 700; color: var(--danger-400)">${result.breakdown.critical.count}</div>
            <div style="font-size: 0.65rem; color: var(--danger-400)">${result.breakdown.critical.score} pts</div>
          </div>
          <div style="padding: 8px; background: hsla(45, 90%, 60%, 0.1); border-radius: 8px; text-align: center">
            <div style="font-size: 0.65rem; color: var(--text-tertiary)">Major (×5)</div>
            <div style="font-size: 1rem; font-weight: 700; color: var(--warning-400)">${result.breakdown.major.count}</div>
            <div style="font-size: 0.65rem; color: var(--warning-400)">${result.breakdown.major.score} pts</div>
          </div>
          <div style="padding: 8px; background: hsla(220, 20%, 100%, 0.05); border-radius: 8px; text-align: center">
            <div style="font-size: 0.65rem; color: var(--text-tertiary)">Minor (×1)</div>
            <div style="font-size: 1rem; font-weight: 700; color: var(--text-secondary)">${result.breakdown.minor.count}</div>
            <div style="font-size: 0.65rem; color: var(--text-secondary)">${result.breakdown.minor.score} pts</div>
          </div>
        </div>
        ${result.recommendations.length > 0 ? `
          <div style="padding: 12px; background: hsla(0, 85%, 60%, 0.1); border-radius: 8px">
            <div style="font-size: 0.75rem; color: var(--danger-400)">
              <i class="fas fa-exclamation-circle" style="margin-right: 6px"></i>
              ${result.recommendations[0]}
            </div>
          </div>
        ` : ''}
      `;
    }
  };
  
  // Asset Management Handlers
  window._addFireAsset = async (projectId, assetType) => {
    openModal({
      title: `Tambah Aset ${assetType}`,
      body: `
        <div style="padding: 10px 0">
          <div class="form-group" style="margin-bottom: 16px">
            <label style="display: block; margin-bottom: 8px; font-size: 0.75rem; font-weight: 700; color: var(--text-secondary)">
              Lokasi
            </label>
            <input type="text" id="asset-location" class="form-control" placeholder="Contoh: Lantai 1, Ruang Lobby"
                   style="width: 100%; padding: 12px; border-radius: 8px; background: hsla(220, 20%, 100%, 0.05); 
                          border: 1px solid hsla(220, 20%, 100%, 0.1); color: white">
          </div>
          <div class="form-group" style="margin-bottom: 16px">
            <label style="display: block; margin-bottom: 8px; font-size: 0.75rem; font-weight: 700; color: var(--text-secondary)">
              Lantai
            </label>
            <input type="number" id="asset-floor" class="form-control" value="1"
                   style="width: 100%; padding: 12px; border-radius: 8px; background: hsla(220, 20%, 100%, 0.05); 
                          border: 1px solid hsla(220, 20%, 100%, 0.1); color: white">
          </div>
          ${assetType === 'APAR' ? `
            <div class="form-group" style="margin-bottom: 16px">
              <label style="display: block; margin-bottom: 8px; font-size: 0.75rem; font-weight: 700; color: var(--text-secondary)">
                Kapasitas (kg)
              </label>
              <select id="asset-capacity" class="form-control"
                      style="width: 100%; padding: 12px; border-radius: 8px; background: hsla(220, 20%, 100%, 0.05); 
                             border: 1px solid hsla(220, 20%, 100%, 0.1); color: white">
                <option value="2.5">2.5 kg</option>
                <option value="4">4 kg</option>
                <option value="6">6 kg</option>
                <option value="9">9 kg</option>
                <option value="12">12 kg</option>
              </select>
            </div>
            <div class="form-group" style="margin-bottom: 16px">
              <label style="display: block; margin-bottom: 8px; font-size: 0.75rem; font-weight: 700; color: var(--text-secondary)">
                Jenis Agen
              </label>
              <select id="asset-agent" class="form-control"
                      style="width: 100%; padding: 12px; border-radius: 8px; background: hsla(220, 20%, 100%, 0.05); 
                             border: 1px solid hsla(220, 20%, 100%, 0.1); color: white">
                <option value="DCP">DCP (Dry Chemical Powder)</option>
                <option value="CO2">CO2</option>
                <option value="Foam">Foam</option>
                <option value="Water">Water</option>
              </select>
            </div>
          ` : ''}
        </div>
      `,
      footer: `
        <button class="btn btn-ghost" onclick="closeModal()">Batal</button>
        <button class="btn btn-primary" onclick="window._saveFireAsset('${projectId}', '${assetType}')">Simpan</button>
      `
    });
  };
  
  window._saveFireAsset = async (projectId, assetType) => {
    const location = document.getElementById('asset-location')?.value;
    const floor = parseInt(document.getElementById('asset-floor')?.value || 1);
    
    const specs = {};
    if (assetType === 'APAR') {
      specs.capacity_kg = document.getElementById('asset-capacity')?.value;
      specs.agent_type = document.getElementById('asset-agent')?.value;
    }
    
    try {
      const { data, error } = await supabase
        .from('fire_assets')
        .insert({
          project_id: projectId,
          asset_type: assetType,
          location_name: location,
          floor_level: floor,
          specifications: specs,
          status: 'ACTIVE'
        })
        .select()
        .single();
      
      if (error) throw error;
      
      showSuccess('Aset berhasil ditambahkan');
      closeModal();
      
      // Refresh assets tab
      window._switchFireTab('assets');
    } catch (error) {
      console.error('Error saving asset:', error);
      showError('Gagal menyimpan aset');
    }
  };
  
  window._inspectAsset = (assetId) => {
    // Navigate to inspection form
    navigate('fire-inspection', { assetId });
  };
  
  window._editAsset = (assetId) => {
    // Open edit modal
    showInfo('Fitur edit aset akan segera hadir');
  };
  
  window._scanQRAsset = () => {
    showInfo('Fitur scan QR akan segera hadir');
  };
  
  window._exportFireData = (projectId) => {
    showInfo('Mengekspor data fire protection...');
    // Implementation for export
  };
  
  window._generateFireReport = (projectId) => {
    showInfo('Menghasilkan laporan fire protection...');
    // Implementation for report generation
  };
}

// Default export
export default {
  renderFireProtectionCard,
  renderFireProtectionModule,
  fetchFireProtectionSummary,
  initFireProtectionHandlers
};
