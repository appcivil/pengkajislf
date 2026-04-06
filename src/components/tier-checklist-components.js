/**
 * TIER CHECKLIST COMPONENTS (ASCE 41-17)
 * UI Components for Tier 1/2/3 Evaluation
 */

import { 
  TIER1_CHECKLIST, 
  TIER2_CHECKLIST, 
  TIER3_CHECKLIST,
  TIER_STATUS_OPTIONS,
  PLASTIC_HINGE_STATUS,
  calculateDCR,
  getDCRStatus,
  checkTier1NeedsTier2,
  checkTier2NeedsTier3
} from '../lib/asce41-tier-data.js';

/**
 * Render Tier Checklist Shell
 */
export function renderTierChecklistShell(proyek, activeTier = 'tier1') {
  return `
    <div id="tier-checklist-page" style="display: grid; grid-template-columns: 300px 1fr; gap: 24px; height: calc(100vh - 120px); overflow: hidden">
      
      <!-- Left Sidebar -->
      <div class="sidebar-quartz" style="display: flex; flex-direction: column; gap: 16px; overflow-y: auto; padding-right: 8px">
        
        <!-- Tier Selection -->
        <div class="card-quartz" style="padding: 20px; background: var(--gradient-dark);">
          <div style="font-family: var(--font-mono); font-size: 9px; font-weight: 800; color: var(--text-tertiary); letter-spacing: 1px; margin-bottom: 16px;">
            ASCE 41-17 EVALUATION
          </div>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <button onclick="window._switchTier('tier1')" class="tier-btn ${activeTier === 'tier1' ? 'active' : ''}" data-tier="tier1">
              <div class="tier-icon"><i class="fas fa-filter"></i></div>
              <div class="tier-info">
                <div class="tier-name">Tier 1</div>
                <div class="tier-desc">Screening</div>
              </div>
            </button>
            <button onclick="window._switchTier('tier2')" class="tier-btn ${activeTier === 'tier2' ? 'active' : ''}" data-tier="tier2">
              <div class="tier-icon"><i class="fas fa-calculator"></i></div>
              <div class="tier-info">
                <div class="tier-name">Tier 2</div>
                <div class="tier-desc">DCR Analysis</div>
              </div>
            </button>
            <button onclick="window._switchTier('tier3')" class="tier-btn ${activeTier === 'tier3' ? 'active' : ''}" data-tier="tier3">
              <div class="tier-icon"><i class="fas fa-chart-line"></i></div>
              <div class="tier-info">
                <div class="tier-name">Tier 3</div>
                <div class="tier-desc">Pushover</div>
              </div>
            </button>
          </div>
        </div>

        <!-- Status Summary -->
        <div id="tier-status-summary" class="card-quartz" style="padding: 20px;">
          <div style="font-family: var(--font-mono); font-size: 9px; font-weight: 800; color: var(--text-tertiary); letter-spacing: 1px; margin-bottom: 12px;">
            STATUS SUMMARY
          </div>
          <div id="status-summary-content">
            <!-- Filled dynamically -->
          </div>
        </div>

        <!-- Navigation -->
        <div style="margin-top: auto; padding: 16px;">
          <button class="btn btn-ghost" onclick="window.navigate('proyek-detail',{id:'${proyek.id}'})" style="width:100%; border-radius:12px; font-size:0.8rem;">
            <i class="fas fa-sign-out-alt" style="margin-right:8px"></i> Kembali ke Proyek
          </button>
        </div>
      </div>

      <!-- Right Content -->
      <div id="tier-content-wrap" style="overflow-y: auto; padding-right: 8px;">
        <div id="tier-content" class="route-fade">
          <!-- Content injected dynamically -->
        </div>
      </div>
    </div>

    <style>
      .tier-btn {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px;
        border-radius: 12px;
        border: 1px solid transparent;
        background: hsla(220, 20%, 100%, 0.03);
        color: white;
        cursor: pointer;
        transition: all 0.3s;
        text-align: left;
        width: 100%;
      }
      .tier-btn:hover {
        background: hsla(220, 20%, 100%, 0.06);
      }
      .tier-btn.active {
        background: hsla(220, 95%, 52%, 0.15);
        border-color: hsla(220, 95%, 52%, 0.3);
      }
      .tier-icon {
        width: 40px;
        height: 40px;
        border-radius: 10px;
        background: hsla(220, 20%, 100%, 0.05);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.1rem;
        color: var(--text-tertiary);
      }
      .tier-btn.active .tier-icon {
        background: var(--gradient-brand);
        color: white;
      }
      .tier-name {
        font-weight: 800;
        font-size: 0.9rem;
        color: var(--text-secondary);
      }
      .tier-btn.active .tier-name {
        color: white;
      }
      .tier-desc {
        font-size: 0.7rem;
        color: var(--text-tertiary);
        margin-top: 2px;
      }
      .status-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px 10px;
        border-radius: 6px;
        font-size: 0.7rem;
        font-weight: 700;
        font-family: var(--font-mono);
      }
    </style>
  `;
}

/**
 * Render Tier 1 Section
 */
export function renderTier1Section(dataMap = {}) {
  const checklist = TIER1_CHECKLIST;
  
  return `
    <div style="animation: slide-up 0.4s ease-out">
      <div class="flex-between flex-stack" style="margin-bottom: 32px">
        <div>
          <h1 style="font-family:'Outfit', sans-serif; font-weight:800; font-size: 2rem; margin:0; color:white">
            ${checklist.name}
          </h1>
          <p style="font-size:0.85rem; color:var(--text-tertiary); margin-top:8px">
            ${checklist.description} | Ref: ${checklist.reference}
          </p>
        </div>
        <div class="flex gap-3">
          <button class="btn btn-secondary btn-sm" onclick="window._saveTierDraft()">
            <i class="fas fa-save" style="margin-right:8px"></i> Simpan Draft
          </button>
          <button class="btn-presidential gold btn-sm" onclick="window._checkTier1Complete()">
            <i class="fas fa-check-circle" style="margin-right:8px"></i> Cek Kelengkapan
          </button>
        </div>
      </div>

      ${checklist.sections.map(section => `
        <div class="tier-section" style="margin-bottom: 32px;">
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px; padding-bottom: 12px; border-bottom: 1px solid hsla(220, 20%, 100%, 0.1);">
            <i class="fas ${section.icon}" style="font-size: 1.2rem; color: var(--brand-400);"></i>
            <div>
              <div style="font-weight: 800; font-size: 1.1rem; color: white;">${section.name}</div>
              <div style="font-size: 0.75rem; color: var(--text-tertiary);">Ref: ${section.reference}</div>
            </div>
          </div>

          <div style="display: flex; flex-direction: column; gap: 16px;">
            ${section.items.map(item => renderTier1Item(item, dataMap[item.kode])).join('')}
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderTier1Item(item, data = {}) {
  const currentStatus = data.status || '';
  const hasNC = currentStatus === 'NC';
  const needsTier2 = item.tier2Required && hasNC;
  
  return `
    <div class="card-quartz tier-item ${needsTier2 ? 'tier-warning' : ''}" style="padding: 20px; border-color: ${needsTier2 ? 'hsla(0, 85%, 60%, 0.3)' : 'hsla(220, 20%, 100%, 0.05)'}; ${needsTier2 ? 'background: hsla(0, 85%, 60%, 0.05);' : ''}">
      <div style="display: grid; grid-template-columns: 1fr auto; gap: 24px; align-items: start;">
        
        <!-- Left: Item Info -->
        <div>
          <div style="display: flex; gap: 12px; align-items: flex-start; margin-bottom: 12px;">
            <div style="font-family: var(--font-mono); font-weight: 800; font-size: 11px; color: var(--brand-400); background: hsla(220, 95%, 52%, 0.1); padding: 4px 10px; border-radius: 6px;">
              ${item.kode}
            </div>
            <div style="font-weight: 700; font-size: 1rem; color: white; line-height: 1.4;">
              ${item.nama}
            </div>
          </div>
          
          ${item.tooltip ? `
            <div style="font-size: 0.75rem; color: var(--text-tertiary); margin-bottom: 8px; font-style: italic;">
              <i class="fas fa-info-circle" style="margin-right: 6px;"></i>${item.tooltip}
            </div>
          ` : ''}
          
          <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
            <a href="#" onclick="window._showPasalRef('${item.pasal}'); return false;" 
               style="font-size: 0.7rem; color: var(--brand-400); text-decoration: none;">
              <i class="fas fa-book" style="margin-right: 4px;"></i>${item.pasal}
            </a>
            ${needsTier2 ? `
              <span class="status-badge" style="background: hsla(0, 85%, 60%, 0.15); color: #ef4444;">
                <i class="fas fa-exclamation-triangle"></i> Lanjut Tier 2
              </span>
            ` : ''}
          </div>
        </div>

        <!-- Right: Status Selection -->
        <div style="display: flex; flex-direction: column; gap: 8px; min-width: 200px;">
          <div style="font-family: var(--font-mono); font-size: 9px; font-weight: 800; color: var(--text-tertiary); letter-spacing: 1px;">
            STATUS
          </div>
          <div class="status-options" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px;">
            ${TIER_STATUS_OPTIONS.map(opt => `
              <button onclick="window._setTier1Status('${item.kode}', '${opt.value}')" 
                      class="status-btn ${currentStatus === opt.value ? 'active' : ''}"
                      style="--status-color: ${opt.color}"
                      title="${opt.description}">
                <span style="font-weight: 800;">${opt.value}</span>
              </button>
            `).join('')}
          </div>
        </div>
      </div>
      
      ${data.catatan ? `
        <div style="margin-top: 12px; padding: 12px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px;">
          <div style="font-size: 0.75rem; color: var(--text-tertiary);">
            <i class="fas fa-sticky-note" style="margin-right: 6px;"></i>${data.catatan}
          </div>
        </div>
      ` : ''}
    </div>

    <style>
      .tier-item {
        transition: all 0.3s;
      }
      .tier-warning {
        animation: pulse-warning 2s infinite;
      }
      @keyframes pulse-warning {
        0%, 100% { box-shadow: 0 0 0 0 hsla(0, 85%, 60%, 0.2); }
        50% { box-shadow: 0 0 0 4px hsla(0, 85%, 60%, 0.1); }
      }
      .status-btn {
        padding: 8px 12px;
        border-radius: 8px;
        border: 1px solid hsla(220, 20%, 100%, 0.1);
        background: hsla(220, 20%, 100%, 0.03);
        color: var(--text-tertiary);
        cursor: pointer;
        transition: all 0.2s;
        font-size: 0.8rem;
      }
      .status-btn:hover {
        border-color: var(--status-color);
        color: var(--status-color);
      }
      .status-btn.active {
        background: var(--status-color);
        border-color: var(--status-color);
        color: white;
      }
    </style>
  `;
}

/**
 * Render Tier 2 Section (DCR Calculations)
 */
export function renderTier2Section(dataMap = {}) {
  const checklist = TIER2_CHECKLIST;
  
  return `
    <div style="animation: slide-up 0.4s ease-out">
      <div class="flex-between flex-stack" style="margin-bottom: 32px">
        <div>
          <h1 style="font-family:'Outfit', sans-serif; font-weight:800; font-size: 2rem; margin:0; color:white">
            ${checklist.name}
          </h1>
          <p style="font-size:0.85rem; color:var(--text-tertiary); margin-top:8px">
            ${checklist.description} | Ref: ${checklist.reference}
          </p>
        </div>
        <div class="flex gap-3">
          <button class="btn btn-secondary btn-sm" onclick="window._calculateAllDCR()">
            <i class="fas fa-calculator" style="margin-right:8px"></i> Hitung Semua DCR
          </button>
          <button class="btn-presidential gold btn-sm" onclick="window._checkTier2Complete()">
            <i class="fas fa-check-circle" style="margin-right:8px"></i> Cek DCR
          </button>
        </div>
      </div>

      <!-- DCR Warning Banner -->
      <div id="dcr-warning-banner" style="display: none; margin-bottom: 24px;" class="card-quartz" style="padding: 16px; background: hsla(0, 85%, 60%, 0.1); border-color: hsla(0, 85%, 60%, 0.3);">
        <div style="display: flex; align-items: center; gap: 12px; color: #ef4444;">
          <i class="fas fa-exclamation-triangle" style="font-size: 1.5rem;"></i>
          <div>
            <div style="font-weight: 700;">DCR Melebihi Batas ( > 2.0 )</div>
            <div style="font-size: 0.8rem;">Item dengan DCR tinggi memerlukan evaluasi Tier 3 (Pushover Analysis)</div>
          </div>
        </div>
      </div>

      ${checklist.sections.map(section => `
        <div class="tier-section" style="margin-bottom: 32px;">
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px; padding-bottom: 12px; border-bottom: 1px solid hsla(220, 20%, 100%, 0.1);">
            <i class="fas ${section.icon}" style="font-size: 1.2rem; color: var(--brand-400);"></i>
            <div>
              <div style="font-weight: 800; font-size: 1.1rem; color: white;">${section.name}</div>
              <div style="font-size: 0.75rem; color: var(--text-tertiary);">Ref: ${section.reference}</div>
            </div>
          </div>

          <div style="display: flex; flex-direction: column; gap: 20px;">
            ${section.items.map(item => renderTier2Item(item, dataMap[item.kode])).join('')}
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderTier2Item(item, data = {}) {
  const hasFields = item.fields && item.fields.length > 0;
  const dcr = data.dcr || 0;
  const dcrStatus = getDCRStatus(dcr, item.batas || 2.0);
  
  return `
    <div class="card-quartz tier2-item" style="padding: 24px;" data-kode="${item.kode}">
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 32px;">
        
        <!-- Left: Info & Formula -->
        <div>
          <div style="display: flex; gap: 12px; align-items: flex-start; margin-bottom: 16px;">
            <div style="font-family: var(--font-mono); font-weight: 800; font-size: 11px; color: var(--brand-400); background: hsla(220, 95%, 52%, 0.1); padding: 4px 10px; border-radius: 6px;">
              ${item.kode}
            </div>
            <div style="font-weight: 700; font-size: 1rem; color: white;">
              ${item.nama}
            </div>
          </div>
          
          <div style="padding: 16px; background: hsla(220, 20%, 100%, 0.03); border-radius: 10px; margin-bottom: 16px;">
            <div style="font-family: var(--font-mono); font-size: 10px; color: var(--text-tertiary); margin-bottom: 8px;">FORMULA:</div>
            <code style="font-size: 0.85rem; color: var(--brand-400); background: none;">${item.formula}</code>
          </div>
          
          <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
            <span style="font-size: 0.75rem; color: var(--text-tertiary);">
              Batas DCR: <strong style="color: white;">${item.batas || 2.0}</strong>
            </span>
            <a href="#" onclick="window._showPasalRef('${item.pasal}'); return false;" 
               style="font-size: 0.7rem; color: var(--brand-400); text-decoration: none;">
              <i class="fas fa-book" style="margin-right: 4px;"></i>${item.pasal}
            </a>
            ${item.tier3Required ? `
              <span class="status-badge" style="background: hsla(258, 70%, 65%, 0.15); color: hsla(258, 70%, 65%, 1);">
                <i class="fas fa-layer-group"></i> Tier 3 Required
              </span>
            ` : ''}
          </div>
        </div>

        <!-- Right: Input Fields & DCR -->
        <div>
          ${hasFields ? `
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 16px;">
              ${item.fields.map(field => `
                <div class="input-group">
                  <label style="font-size: 0.75rem; color: var(--text-tertiary); margin-bottom: 4px; display: block;">${field.label}</label>
                  <input type="${field.type}" 
                         class="form-input tier2-field" 
                         data-field="${field.name}"
                         data-kode="${item.kode}"
                         value="${data[field.name] || ''}"
                         placeholder="0.0"
                         onchange="window._updateTier2Field('${item.kode}', '${field.name}', this.value)"
                         style="background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1); border-radius: 8px; color: white; font-weight: 600;">
                </div>
              `).join('')}
            </div>
          ` : ''}
          
          <!-- DCR Result -->
          <div style="display: flex; gap: 16px; align-items: center; padding: 16px; background: hsla(220, 20%, 100%, 0.03); border-radius: 10px; border: 1px solid ${dcrStatus.color}44;">
            <div style="text-align: center;">
              <div style="font-size: 0.7rem; color: var(--text-tertiary); margin-bottom: 4px;">DCR</div>
              <div id="dcr-value-${item.kode}" style="font-size: 2rem; font-weight: 800; color: ${dcrStatus.color};">
                ${dcr ? dcr.toFixed(2) : '--'}
              </div>
            </div>
            <div style="flex: 1;">
              <div id="dcr-status-${item.kode}" class="status-badge" style="background: ${dcrStatus.color}22; color: ${dcrStatus.color}; margin-bottom: 4px;">
                ${dcrStatus.status}
              </div>
              <div id="dcr-message-${item.kode}" style="font-size: 0.75rem; color: var(--text-tertiary);">
                ${dcrStatus.message}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render Tier 3 Section (Pushover)
 */
export function renderTier3Section(dataMap = {}) {
  const checklist = TIER3_CHECKLIST;
  
  return `
    <div style="animation: slide-up 0.4s ease-out">
      <div class="flex-between flex-stack" style="margin-bottom: 32px">
        <div>
          <h1 style="font-family:'Outfit', sans-serif; font-weight:800; font-size: 2rem; margin:0; color:white">
            ${checklist.name}
          </h1>
          <p style="font-size:0.85rem; color:var(--text-tertiary); margin-top:8px">
            ${checklist.description} | Ref: ${checklist.reference}
          </p>
        </div>
        <div class="flex gap-3">
          <button class="btn btn-secondary btn-sm" onclick="window._importPushoverCSV()">
            <i class="fas fa-file-csv" style="margin-right:8px"></i> Import CSV ETABS
          </button>
          <button class="btn-presidential gold btn-sm" onclick="window._plotPushoverCurve()">
            <i class="fas fa-chart-line" style="margin-right:8px"></i> Plot Kurva
          </button>
        </div>
      </div>

      <!-- Pushover Plot Area -->
      <div class="card-quartz" style="padding: 24px; margin-bottom: 32px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <div style="font-weight: 700; color: white;">Kurva Kapasitas Pushover</div>
          <div style="display: flex; gap: 8px;">
            <button class="btn btn-xs btn-ghost" onclick="window._clearPushoverPlot()">Clear</button>
            <button class="btn btn-xs btn-secondary" onclick="window._exportPushoverPlot()">Export</button>
          </div>
        </div>
        <div id="pushover-plot-container" style="height: 400px; background: hsla(220, 20%, 100%, 0.03); border-radius: 10px; display: flex; align-items: center; justify-content: center;">
          <div style="text-align: center; color: var(--text-tertiary);">
            <i class="fas fa-chart-line" style="font-size: 3rem; margin-bottom: 12px; opacity: 0.5;"></i>
            <p>Upload CSV hasil ETABS atau input data manual</p>
          </div>
        </div>
      </div>

      <!-- Plastic Hinge Status Grid -->
      <div class="card-quartz" style="padding: 24px; margin-bottom: 32px;">
        <div style="font-weight: 700; color: white; margin-bottom: 20px;">
          <i class="fas fa-circle-nodes" style="margin-right: 8px; color: var(--brand-400);"></i>
          Status Sendi Plastis (ASCE 41-17 Table 9-6)
        </div>
        
        <div style="display: flex; gap: 16px; margin-bottom: 20px; flex-wrap: wrap;">
          ${Object.entries(PLASTIC_HINGE_STATUS).map(([key, val]) => `
            <div style="display: flex; align-items: center; gap: 8px;">
              <div style="width: 16px; height: 16px; border-radius: 4px; background: ${val.color};"></div>
              <span style="font-size: 0.8rem; color: var(--text-secondary);">${val.label}</span>
            </div>
          `).join('')}
        </div>

        <div id="hinge-status-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(80px, 1fr)); gap: 8px;">
          <!-- Hinge status items will be added dynamically -->
        </div>
      </div>

      ${checklist.sections.map(section => `
        <div class="tier-section" style="margin-bottom: 32px;">
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px; padding-bottom: 12px; border-bottom: 1px solid hsla(220, 20%, 100%, 0.1);">
            <i class="fas ${section.icon}" style="font-size: 1.2rem; color: var(--brand-400);"></i>
            <div>
              <div style="font-weight: 800; font-size: 1.1rem; color: white;">${section.name}</div>
              <div style="font-size: 0.75rem; color: var(--text-tertiary);">Ref: ${section.reference}</div>
            </div>
          </div>

          <div style="display: flex; flex-direction: column; gap: 20px;">
            ${section.items.map(item => renderTier3Item(item, dataMap[item.kode])).join('')}
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderTier3Item(item, data = {}) {
  return `
    <div class="card-quartz" style="padding: 20px;">
      <div style="display: flex; gap: 12px; align-items: flex-start; margin-bottom: 12px;">
        <div style="font-family: var(--font-mono); font-weight: 800; font-size: 11px; color: var(--brand-400); background: hsla(220, 95%, 52%, 0.1); padding: 4px 10px; border-radius: 6px;">
          ${item.kode}
        </div>
        <div style="font-weight: 700; font-size: 1rem; color: white;">
          ${item.nama}
        </div>
      </div>
      
      ${item.keterangan ? `
        <div style="font-size: 0.75rem; color: var(--text-tertiary); margin-bottom: 12px;">
          <i class="fas fa-info-circle" style="margin-right: 6px;"></i>${item.keterangan}
        </div>
      ` : ''}

      <div style="margin-top: 16px;">
        ${renderTier3Input(item, data)}
      </div>
    </div>
  `;
}

function renderTier3Input(item, data) {
  switch(item.type) {
    case 'number':
      return `
        <div style="display: flex; align-items: center; gap: 12px;">
          <input type="number" 
                 class="form-input" 
                 value="${data.value || ''}"
                 placeholder="0.0"
                 onchange="window._updateTier3Field('${item.kode}', 'value', this.value)"
                 style="flex: 1; max-width: 200px; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1); border-radius: 8px; color: white; font-weight: 600;">
          <span style="color: var(--text-tertiary); font-size: 0.85rem;">${item.unit || ''}</span>
        </div>
      `;
    
    case 'file_upload':
      return `
        <div style="display: flex; gap: 12px; align-items: center;">
          <input type="file" 
                 id="file-${item.kode}" 
                 accept="${item.accept || '.csv,.xlsx'}" 
                 style="display: none;"
                 onchange="window._handleTier3File('${item.kode}', this)">
          <button class="btn btn-secondary btn-sm" onclick="document.getElementById('file-${item.kode}').click()">
            <i class="fas fa-upload" style="margin-right: 6px;"></i> Pilih File
          </button>
          <span id="file-name-${item.kode}" style="font-size: 0.8rem; color: var(--text-tertiary);">
            ${data.filename || 'Belum ada file'}
          </span>
        </div>
      `;
    
    case 'hinge_status_grid':
      return `
        <div style="font-size: 0.8rem; color: var(--text-tertiary);">
          <i class="fas fa-mouse-pointer" style="margin-right: 6px;"></i>
          Klik pada grid plastis di atas untuk mengisi status sendi
        </div>
      `;
    
    case 'mechanism_check':
      return `
        <div style="display: flex; gap: 16px; flex-wrap: wrap;">
          <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
            <input type="radio" name="${item.kode}" value="SCWB" ${data.value === 'SCWB' ? 'checked' : ''} 
                   onchange="window._updateTier3Field('${item.kode}', 'value', this.value)">
            <span style="color: var(--text-secondary);">Strong Column Weak Beam</span>
          </label>
          <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
            <input type="radio" name="${item.kode}" value="SWCB" ${data.value === 'SWCB' ? 'checked' : ''}
                   onchange="window._updateTier3Field('${item.kode}', 'value', this.value)">
            <span style="color: var(--text-secondary);">Strong Weak Column Beam (Bukan)</span>
          </label>
        </div>
      `;
    
    default:
      return `
        <input type="text" 
               class="form-input" 
               value="${data.value || ''}"
               placeholder="Input data..."
               onchange="window._updateTier3Field('${item.kode}', 'value', this.value)"
               style="background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1); border-radius: 8px; color: white;">
      `;
  }
}

/**
 * Render Status Summary
 */
export function renderStatusSummary(tier1Data, tier2Data, tier3Data) {
  const tier1NC = checkTier1NeedsTier2(tier1Data);
  const tier2Need3 = checkTier2NeedsTier3(tier2Data);
  
  const totalTier1 = Object.keys(TIER1_CHECKLIST.sections).reduce((acc, s) => acc + TIER1_CHECKLIST.sections[s].items.length, 0);
  const completedTier1 = Object.keys(tier1Data).filter(k => k.startsWith('T1-')).length;
  
  return `
    <div style="display: flex; flex-direction: column; gap: 12px;">
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px;">
        <span style="font-size: 0.8rem; color: var(--text-secondary);">Tier 1 Progress</span>
        <span style="font-family: var(--font-mono); font-size: 0.9rem; font-weight: 700; color: white;">${completedTier1}/${totalTier1}</span>
      </div>
      
      ${tier1NC ? `
        <div style="padding: 12px; background: hsla(0, 85%, 60%, 0.1); border-radius: 8px; border: 1px solid hsla(0, 85%, 60%, 0.2);">
          <div style="font-size: 0.8rem; color: #ef4444; font-weight: 600; margin-bottom: 4px;">
            <i class="fas fa-exclamation-circle" style="margin-right: 6px;"></i>${tier1NC.length} item NC
          </div>
          <div style="font-size: 0.75rem; color: var(--text-tertiary);">Lanjut ke Tier 2</div>
        </div>
      ` : ''}
      
      ${tier2Need3 ? `
        <div style="padding: 12px; background: hsla(258, 70%, 65%, 0.1); border-radius: 8px; border: 1px solid hsla(258, 70%, 65%, 0.2);">
          <div style="font-size: 0.8rem; color: hsla(258, 70%, 65%, 1); font-weight: 600; margin-bottom: 4px;">
            <i class="fas fa-layer-group" style="margin-right: 6px;"></i>${tier2Need3.length} item perlu Tier 3
          </div>
          <div style="font-size: 0.75rem; color: var(--text-tertiary);">Pushover Analysis Required</div>
        </div>
      ` : ''}
      
      <div style="margin-top: 8px; padding-top: 12px; border-top: 1px solid hsla(220, 20%, 100%, 0.1);">
        <div style="font-size: 0.75rem; color: var(--text-tertiary); margin-bottom: 8px;">Legend:</div>
        <div style="display: flex; flex-wrap: wrap; gap: 8px;">
          ${TIER_STATUS_OPTIONS.map(opt => `
            <div style="display: flex; align-items: center; gap: 4px;">
              <div style="width: 10px; height: 10px; border-radius: 2px; background: ${opt.color};"></div>
              <span style="font-size: 0.7rem; color: var(--text-tertiary);">${opt.value}</span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}
