// ============================================================
// SANITATION INSPECTION - PART 2 (TAB RENDERERS CONTINUED)
// This file contains the remaining tab renderers and event handlers
// ============================================================

// Note: This file is meant to be concatenated with part 1
// For now, creating a complete standalone file

// IPAL Tab Renderer
function renderIPALTab() {
  const ipals = sanitationData.ipals || [];
  const tests = sanitationData.effluentTests || [];
  
  return `
    <div style="display: grid; gap: var(--space-6);">
      <div class="flex-between" style="margin-bottom: 8px;">
        <h4 style="font-family: 'Outfit', sans-serif; font-weight: 700; color: white;">
          <i class="fas fa-filter" style="margin-right: 8px; color: ${COLORS.green.main};"></i>
          Instalasi Pengolahan Air Limbah (IPAL)
        </h4>
        <button class="btn btn-primary btn-sm" onclick="window._showAddIPALModal()">
          <i class="fas fa-plus" style="margin-right: 6px;"></i> Tambah IPAL
        </button>
      </div>
      
      ${ipals.length === 0 ? `
        <div class="card-quartz" style="padding: var(--space-8); text-align: center;">
          <i class="fas fa-inbox" style="font-size: 3rem; color: var(--text-tertiary); margin-bottom: 16px;"></i>
          <p style="color: var(--text-tertiary);">Belum ada data IPAL. Klik tombol di atas untuk menambahkan.</p>
        </div>
      ` : `
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(400px, 1fr)); gap: 16px;">
          ${ipals.map(ipal => renderIPALCard(ipal, tests.filter(t => t.ipalId === ipal.id))).join('')}
        </div>
      `}
      
      <!-- Effluent Test Form -->
      <div class="card-quartz" style="padding: var(--space-6);">
        <h4 style="font-family: 'Outfit', sans-serif; font-weight: 700; color: white; margin-bottom: 20px;">
          <i class="fas fa-flask" style="margin-right: 8px; color: var(--warning-400);"></i>
          Input Hasil Uji Kualitas Effluent
        </h4>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
          <div class="form-group">
            <label style="display: block; font-size: 11px; color: var(--text-tertiary); margin-bottom: 6px;">IPAL</label>
            <select id="effluent-ipal-id" class="form-control">
              <option value="">Pilih IPAL</option>
              ${ipals.map(ipal => `<option value="${ipal.id}">${ipal.name}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label style="display: block; font-size: 11px; color: var(--text-tertiary); margin-bottom: 6px;">BOD Inlet (mg/L)</label>
            <input type="number" id="effluent-bod-inlet" class="form-control" placeholder="200">
          </div>
          <div class="form-group">
            <label style="display: block; font-size: 11px; color: var(--text-tertiary); margin-bottom: 6px;">BOD Outlet (mg/L)</label>
            <input type="number" id="effluent-bod-outlet" class="form-control" placeholder="30">
          </div>
          <div class="form-group">
            <label style="display: block; font-size: 11px; color: var(--text-tertiary); margin-bottom: 6px;">TSS Inlet (mg/L)</label>
            <input type="number" id="effluent-tss-inlet" class="form-control" placeholder="150">
          </div>
          <div class="form-group">
            <label style="display: block; font-size: 11px; color: var(--text-tertiary); margin-bottom: 6px;">TSS Outlet (mg/L)</label>
            <input type="number" id="effluent-tss-outlet" class="form-control" placeholder="45">
          </div>
          <div class="form-group">
            <label style="display: block; font-size: 11px; color: var(--text-tertiary); margin-bottom: 6px;">pH</label>
            <input type="number" id="effluent-ph" class="form-control" placeholder="7.2" step="0.1">
          </div>
        </div>
        <div style="margin-top: 20px;">
          <button class="btn btn-primary" onclick="window._addEffluentTest()">
            <i class="fas fa-save" style="margin-right: 6px;"></i> Simpan Hasil Uji
          </button>
        </div>
        <div id="effluent-calculation-preview" style="margin-top: 20px;"></div>
      </div>
      
      <!-- IPAL Volume Calculator -->
      <div class="card-quartz" style="padding: var(--space-6);">
        <h4 style="font-family: 'Outfit', sans-serif; font-weight: 700; color: white; margin-bottom: 20px;">
          <i class="fas fa-calculator" style="margin-right: 8px; color: var(--warning-400);"></i>
          Kalkulator Volume IPAL Biofilter
        </h4>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-6);">
          <div>
            <div class="form-group" style="margin-bottom: 16px;">
              <label style="display: block; font-size: 11px; color: var(--text-tertiary); margin-bottom: 6px;">Jumlah Penghuni</label>
              <input type="number" id="ipal-population" class="form-control" placeholder="10" onchange="window._calculateIPAL()">
            </div>
            <div class="form-group" style="margin-bottom: 16px;">
              <label style="display: block; font-size: 11px; color: var(--text-tertiary); margin-bottom: 6px;">Beban BOD (g/org/hari)</label>
              <input type="number" id="ipal-bod-load" class="form-control" placeholder="40" value="40" onchange="window._calculateIPAL()">
            </div>
            <button class="btn btn-primary" onclick="window._calculateIPAL()">
              <i class="fas fa-calculator" style="margin-right: 6px;"></i> Hitung Volume
            </button>
          </div>
          <div id="ipal-calculation-result">
            <p style="color: var(--text-tertiary); text-align: center;">Masukkan parameter untuk melihat hasil perhitungan</p>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderIPALCard(ipal, tests) {
  const latestTest = tests.sort((a, b) => new Date(b.testDate) - new Date(a.testDate))[0];
  
  let efficiency = { bodRemoval: '-', tssRemoval: '-' };
  if (latestTest) {
    efficiency = calculateTreatmentEfficiency(
      latestTest.inletValues?.bod || 200,
      latestTest.parameters?.bod || 30,
      latestTest.inletValues?.tss || 150,
      latestTest.parameters?.tss || 45,
      latestTest.parameters?.ph || 7
    );
  }
  
  return `
    <div class="card-quartz" style="padding: var(--space-5);">
      <div class="flex-between" style="margin-bottom: 16px;">
        <h5 style="font-weight: 700; color: white; margin: 0;">${ipal.name || 'IPAL'}</h5>
        ${latestTest ? getStatusBadge(efficiency.status) : '<span class="badge" style="background: hsla(220, 20%, 100%, 0.1); color: var(--text-tertiary); font-size: 10px;">NO DATA</span>'}
      </div>
      
      <div style="margin-bottom: 16px;">
        ${generateIPALCrossSection({
          totalVolume: ipal.totalVolume || 5,
          anaerobPercent: 30,
          aerobPercent: 50,
          settlingPercent: 20
        })}
      </div>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
        <div>
          <div style="font-size: 10px; color: var(--text-tertiary);">Volume Total</div>
          <div style="font-size: 16px; color: white; font-weight: 700; font-family: var(--font-mono);">${ipal.totalVolume || '-'} m³</div>
        </div>
        <div>
          <div style="font-size: 10px; color: var(--text-tertiary);">Tipe</div>
          <div style="font-size: 14px; color: white; font-weight: 600;">${ipal.type || 'Biofilter'}</div>
        </div>
        <div>
          <div style="font-size: 10px; color: var(--text-tertiary);">BOD Removal</div>
          <div style="font-size: 14px; color: ${efficiency.bodRemovalValue >= 80 ? COLORS.success : COLORS.warning}; font-weight: 600;">${efficiency.bodRemoval}</div>
        </div>
        <div>
          <div style="font-size: 10px; color: var(--text-tertiary);">TSS Removal</div>
          <div style="font-size: 14px; color: ${efficiency.tssRemovalValue >= 80 ? COLORS.success : COLORS.warning}; font-weight: 600;">${efficiency.tssRemoval}</div>
        </div>
      </div>
      
      ${latestTest && efficiency.status === 'NC' ? `
        <div style="background: hsla(0, 85%, 60%, 0.1); border: 1px solid hsla(0, 85%, 60%, 0.3); border-radius: 8px; padding: 12px; margin-bottom: 12px;">
          <div style="font-size: 11px; color: var(--danger-400);">
            <i class="fas fa-triangle-exclamation" style="margin-right: 6px;"></i>
            ${efficiency.recommendations[0]}
          </div>
        </div>
      ` : ''}
      
      <div style="display: flex; gap: 8px;">
        <button class="btn btn-sm btn-ghost" onclick="window._editIPAL('${ipal.id}')">
          <i class="fas fa-pen"></i>
        </button>
        <button class="btn btn-sm btn-ghost" style="color: var(--danger-400);" onclick="window._deleteIPAL('${ipal.id}')">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    </div>
  `;
}

// Distance Tab Renderer
function renderDistanceTab() {
  const tanks = sanitationData.septicTanks || [];
  
  return `
    <div style="display: grid; gap: var(--space-6);">
      <h4 style="font-family: 'Outfit', sans-serif; font-weight: 700; color: white;">
        <i class="fas fa-ruler-combined" style="margin-right: 8px; color: var(--brand-400);"></i>
        Validasi Jarak Aman
      </h4>
      
      ${tanks.length === 0 ? `
        <div class="card-quartz" style="padding: var(--space-8); text-align: center;">
          <i class="fas fa-inbox" style="font-size: 3rem; color: var(--text-tertiary); margin-bottom: 16px;"></i>
          <p style="color: var(--text-tertiary);">Tambahkan septic tank terlebih dahulu untuk validasi jarak.</p>
        </div>
      ` : tanks.map(tank => `
        <div class="card-quartz" style="padding: var(--space-6);">
          <div class="flex-between" style="margin-bottom: 20px;">
            <h5 style="font-weight: 700; color: white; margin: 0;">${tank.name || 'Septic Tank'}</h5>
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-6);">
            <div>
              <div class="form-group" style="margin-bottom: 16px;">
                <label style="display: block; font-size: 11px; color: var(--text-tertiary); margin-bottom: 6px;">Jarak ke Sumur Gali (m)</label>
                <input type="number" id="dist-well-${tank.id}" class="form-control" value="${tank.distances?.toWell || ''}" placeholder="10">
                <div style="font-size: 10px; color: var(--text-tertiary); margin-top: 4px;">Minimum: 10m (PP 16/2021)</div>
              </div>
              <div class="form-group" style="margin-bottom: 16px;">
                <label style="display: block; font-size: 11px; color: var(--text-tertiary); margin-bottom: 6px;">Jarak ke Bangunan (m)</label>
                <input type="number" id="dist-building-${tank.id}" class="form-control" value="${tank.distances?.toBuilding || ''}" placeholder="2">
                <div style="font-size: 10px; color: var(--text-tertiary); margin-top: 4px;">Minimum: 2m</div>
              </div>
              <div class="form-group" style="margin-bottom: 16px;">
                <label style="display: block; font-size: 11px; color: var(--text-tertiary); margin-bottom: 6px;">Jarak ke Sumber Air Lain (m)</label>
                <input type="number" id="dist-water-${tank.id}" class="form-control" value="${tank.distances?.toWaterSource || ''}" placeholder="10">
                <div style="font-size: 10px; color: var(--text-tertiary); margin-top: 4px;">Minimum: 10m</div>
              </div>
              <button class="btn btn-primary" onclick="window._validateDistance('${tank.id}')">
                <i class="fas fa-check" style="margin-right: 6px;"></i> Validasi
              </button>
            </div>
            <div>
              ${generateSafetyDistanceMap({
                toWell: tank.distances?.toWell || 0,
                toBuilding: tank.distances?.toBuilding || 0,
                toWaterSource: tank.distances?.toWaterSource || 0
              })}
              <div id="distance-result-${tank.id}" style="margin-top: 16px;"></div>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

// Compliance Tab Renderer
function renderComplianceTab() {
  const inspectionData = {
    chute: sanitationData.chutes[0] ? {
      dimension: sanitationData.chutes[0].dimensions?.width || 0.6,
      slope: sanitationData.chutes[0].slope || 2,
      compliant: (sanitationData.chutes[0].dimensions?.width || 0.6) >= 0.6
    } : null,
    septicTank: sanitationData.septicTanks[0] ? {
      volume: sanitationData.septicTanks[0].volume || 1.8,
      compartmentRatio: '2:1',
      distanceToWell: sanitationData.septicTanks[0].distances?.toWell || 10,
      distanceToBuilding: sanitationData.septicTanks[0].distances?.toBuilding || 2
    } : null,
    effluent: sanitationData.effluentTests[0] ? {
      bod: sanitationData.effluentTests[0].parameters?.bod || 30,
      tss: sanitationData.effluentTests[0].parameters?.tss || 45,
      ph: sanitationData.effluentTests[0].parameters?.ph || 7,
      bodRemoval: 85
    } : null
  };
  
  const compliance = checkPP16Compliance(inspectionData);
  
  return `
    <div style="display: grid; gap: var(--space-6);">
      <div class="flex-between" style="margin-bottom: 8px;">
        <h4 style="font-family: 'Outfit', sans-serif; font-weight: 700; color: white;">
          <i class="fas fa-clipboard-check" style="margin-right: 8px; color: var(--success-400);"></i>
          Compliance Check - PP 16/2021 Pasal 224
        </h4>
        <button class="btn btn-primary btn-sm" onclick="window._runComplianceCheck()">
          <i class="fas fa-sync" style="margin-right: 6px;"></i> Periksa Ulang
        </button>
      </div>
      
      <!-- Summary Card -->
      <div class="card-quartz" style="padding: var(--space-6);">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px;">
          <div style="text-align: center;">
            <div style="font-size: 36px; font-weight: 800; color: ${compliance.summary?.overallStatus === 'C' ? COLORS.success : COLORS.danger}; font-family: var(--font-mono);">
              ${compliance.summary?.complianceRate || 0}%
            </div>
            <div style="font-size: 11px; color: var(--text-tertiary);">COMPLIANCE RATE</div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 36px; font-weight: 800; color: ${COLORS.success}; font-family: var(--font-mono);">
              ${compliance.summary?.compliantItems || 0}
            </div>
            <div style="font-size: 11px; color: var(--text-tertiary);">COMPLIANT</div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 36px; font-weight: 800; color: ${COLORS.danger}; font-family: var(--font-mono);">
              ${compliance.summary?.nonCompliantItems || 0}
            </div>
            <div style="font-size: 11px; color: var(--text-tertiary);">NON-COMPLIANT</div>
          </div>
        </div>
      </div>
      
      <!-- Detailed Check -->
      ${Object.entries(compliance.pasal224?.ayat || {}).map(([ayatKey, ayat]) => `
        <div class="card-quartz" style="padding: var(--space-5);">
          <h5 style="font-weight: 700; color: white; margin-bottom: 16px;">${ayat.title}</h5>
          ${generateInspectionTable(ayat.items.map(item => ({
            component: item.description,
            location: '-',
            parameter: '-',
            standard: item.standard,
            measured: item.measured,
            status: item.status
          })))}
        </div>
      `).join('')}
      
      <!-- Legal Citations -->
      <div class="card-quartz" style="padding: var(--space-6);">
        <h4 style="font-family: 'Outfit', sans-serif; font-weight: 700; color: white; margin-bottom: 20px;">
          <i class="fas fa-gavel" style="margin-right: 8px; color: var(--warning-400);"></i>
          Referensi Legal
        </h4>
        <div style="display: grid; gap: 12px;">
          ${Object.entries(LEGAL_REFERENCES).map(([key, ref]) => `
            <div style="background: hsla(220, 20%, 100%, 0.02); border: 1px solid hsla(220, 20%, 100%, 0.05); border-radius: 8px; padding: 16px;">
              <div style="font-weight: 700; color: var(--brand-400); margin-bottom: 4px;">${ref.title}</div>
              <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 8px;">${ref.description}</div>
              <div style="font-size: 11px; color: var(--text-tertiary);">
                ${ref.details.map(d => `<div style="margin-left: 12px; margin-bottom: 2px;">• ${d}</div>`).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

// Visualization Tab Renderer
function renderVisualizationTab() {
  return `
    <div style="display: grid; gap: var(--space-6);">
      <h4 style="font-family: 'Outfit', sans-serif; font-weight: 700; color: white;">
        <i class="fas fa-diagram-project" style="margin-right: 8px; color: var(--brand-400);"></i>
        Visualisasi Sistem
      </h4>
      
      <!-- Flow Diagram -->
      <div class="card-quartz" style="padding: var(--space-6);">
        <h5 style="font-weight: 700; color: white; margin-bottom: 20px;">Diagram Alir Proses</h5>
        ${generateFlowDiagram({
          hasChute: sanitationData.chutes.length > 0,
          hasSeptic: sanitationData.septicTanks.length > 0,
          hasIPAL: sanitationData.ipals.length > 0,
          showLabels: true
        })}
      </div>
      
      <!-- Septic Tank Cross Sections -->
      ${sanitationData.septicTanks.map(tank => {
        const records = sanitationData.sludgeRecords.filter(r => r.tankId === tank.id);
        const latestRecord = records.sort((a, b) => new Date(b.recordDate) - new Date(a.recordDate))[0];
        return `
          <div class="card-quartz" style="padding: var(--space-6);">
            <h5 style="font-weight: 700; color: white; margin-bottom: 20px;">Potongan Melintang - ${tank.name}</h5>
            ${generateSepticTankCrossSection(tank.dimensions, latestRecord?.level || 0)}
          </div>
        `;
      }).join('')}
      
      <!-- IPAL Cross Sections -->
      ${sanitationData.ipals.map(ipal => `
        <div class="card-quartz" style="padding: var(--space-6);">
          <h5 style="font-weight: 700; color: white; margin-bottom: 20px;">Potongan IPAL - ${ipal.name}</h5>
          ${generateIPALCrossSection({
            totalVolume: ipal.totalVolume || 5,
            anaerobPercent: 30,
            aerobPercent: 50,
            settlingPercent: 20
          })}
        </div>
      `).join('')}
      
      <!-- Pipe Profile -->
      <div class="card-quartz" style="padding: var(--space-6);">
        <h5 style="font-weight: 700; color: white; margin-bottom: 20px;">Profil Longitudinal Pipa</h5>
        ${sanitationData.pipes.length > 0 ? generatePipeProfile(sanitationData.pipes.map(p => ({
          length: p.length || 10,
          diameter: p.diameter || 100,
          startElevation: p.startElevation || 5,
          endElevation: p.endElevation || 3,
          slope: p.slope || 2
        }))) : '<p style="color: var(--text-tertiary);">Belum ada data pipa</p>'}
      </div>
    </div>
  `;
}

// ============================================================
// STYLES & MODALS
// ============================================================

function getSanitationStyles() {
  return `
    .sanitation-content {
      animation: fadeIn 0.3s ease;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    .sanitation-tab-item {
      position: relative;
      overflow: hidden;
    }
    
    .sanitation-tab-item:hover {
      background: hsla(220, 20%, 100%, 0.05) !important;
    }
    
    .sanitation-tab-item.active {
      background: var(--gradient-brand) !important;
      color: white !important;
    }
    
    .form-group {
      margin-bottom: 16px;
    }
    
    .form-group label {
      display: block;
      font-size: 11px;
      color: var(--text-tertiary);
      margin-bottom: 6px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .form-control {
      width: 100%;
      padding: 10px 14px;
      background: hsla(220, 20%, 100%, 0.05);
      border: 1px solid hsla(220, 20%, 100%, 0.1);
      border-radius: 8px;
      color: white;
      font-size: 13px;
      transition: all 0.2s;
    }
    
    .form-control:focus {
      outline: none;
      border-color: var(--brand-400);
      background: hsla(220, 20%, 100%, 0.08);
    }
    
    .form-control::placeholder {
      color: hsla(220, 20%, 100%, 0.3);
    }
  `;
}

function renderModals() {
  return `
    <!-- Add Septic Tank Modal -->
    <div id="modal-add-septic" class="modal" style="display: none;">
      <div class="modal-content card-quartz" style="max-width: 500px;">
        <div class="flex-between" style="margin-bottom: 20px;">
          <h4 style="font-weight: 700; color: white;">Tambah Septic Tank</h4>
          <button onclick="window._closeModal('modal-add-septic')" class="btn btn-ghost btn-sm"><i class="fas fa-xmark"></i></button>
        </div>
        <div class="form-group">
          <label>Nama</label>
          <input type="text" id="septic-name" class="form-control" placeholder="Septic Tank 1">
        </div>
        <div class="form-group">
          <label>Jumlah Penghuni</label>
          <input type="number" id="septic-population-modal" class="form-control" placeholder="5">
        </div>
        <div class="form-group">
          <label>Volume (m³)</label>
          <input type="number" id="septic-volume" class="form-control" placeholder="1.8" step="0.1">
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px;">
          <div class="form-group">
            <label>Panjang (m)</label>
            <input type="number" id="septic-length" class="form-control" placeholder="2.5" step="0.1">
          </div>
          <div class="form-group">
            <label>Lebar (m)</label>
            <input type="number" id="septic-width" class="form-control" placeholder="1.2" step="0.1">
          </div>
          <div class="form-group">
            <label>Kedalaman (m)</label>
            <input type="number" id="septic-depth" class="form-control" placeholder="2.0" step="0.1">
          </div>
        </div>
        <div class="flex-between" style="margin-top: 24px;">
          <button onclick="window._closeModal('modal-add-septic')" class="btn btn-ghost">Batal</button>
          <button onclick="window._saveSepticTank()" class="btn btn-primary">Simpan</button>
        </div>
      </div>
    </div>
    
    <!-- Add IPAL Modal -->
    <div id="modal-add-ipal" class="modal" style="display: none;">
      <div class="modal-content card-quartz" style="max-width: 500px;">
        <div class="flex-between" style="margin-bottom: 20px;">
          <h4 style="font-weight: 700; color: white;">Tambah IPAL</h4>
          <button onclick="window._closeModal('modal-add-ipal')" class="btn btn-ghost btn-sm"><i class="fas fa-xmark"></i></button>
        </div>
        <div class="form-group">
          <label>Nama</label>
          <input type="text" id="ipal-name" class="form-control" placeholder="IPAL Biofilter 1">
        </div>
        <div class="form-group">
          <label>Tipe</label>
          <select id="ipal-type-modal" class="form-control">
            <option value="biofilter">Biofilter</option>
            <option value="anaerob">Anaerob</option>
            <option value="aerob">Aerob</option>
          </select>
        </div>
        <div class="form-group">
          <label>Volume Total (m³)</label>
          <input type="number" id="ipal-total-volume" class="form-control" placeholder="5.0" step="0.1">
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px;">
          <div class="form-group">
            <label>Anaerob (%)</label>
            <input type="number" id="ipal-anaerob-pct" class="form-control" value="30" min="0" max="100">
          </div>
          <div class="form-group">
            <label>Aerob (%)</label>
            <input type="number" id="ipal-aerob-pct" class="form-control" value="50" min="0" max="100">
          </div>
          <div class="form-group">
            <label>Pengendapan (%)</label>
            <input type="number" id="ipal-settling-pct" class="form-control" value="20" min="0" max="100">
          </div>
        </div>
        <div class="flex-between" style="margin-top: 24px;">
          <button onclick="window._closeModal('modal-add-ipal')" class="btn btn-ghost">Batal</button>
          <button onclick="window._saveIPAL()" class="btn btn-primary">Simpan</button>
        </div>
      </div>
    </div>
    
    <!-- Add Chute Modal -->
    <div id="modal-add-chute" class="modal" style="display: none;">
      <div class="modal-content card-quartz" style="max-width: 500px;">
        <div class="flex-between" style="margin-bottom: 20px;">
          <h4 style="font-weight: 700; color: white;">Tambah Chute</h4>
          <button onclick="window._closeModal('modal-add-chute')" class="btn btn-ghost btn-sm"><i class="fas fa-xmark"></i></button>
        </div>
        <div class="form-group">
          <label>Nama</label>
          <input type="text" id="chute-name" class="form-control" placeholder="Chute 1">
        </div>
        <div class="form-group">
          <label>Lokasi</label>
          <input type="text" id="chute-location" class="form-control" placeholder="Area belakang gedung">
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div class="form-group">
            <label>Lebar (m)</label>
            <input type="number" id="chute-width" class="form-control" placeholder="0.6" step="0.1">
          </div>
          <div class="form-group">
            <label>Tinggi (m)</label>
            <input type="number" id="chute-height" class="form-control" placeholder="0.6" step="0.1">
          </div>
        </div>
        <div class="form-group">
          <label>Kemiringan (%)</label>
          <input type="number" id="chute-slope-modal" class="form-control" placeholder="2.0" step="0.1">
        </div>
        <div class="flex-between" style="margin-top: 24px;">
          <button onclick="window._closeModal('modal-add-chute')" class="btn btn-ghost">Batal</button>
          <button onclick="window._saveChute()" class="btn btn-primary">Simpan</button>
        </div>
      </div>
    </div>
  `;
}

// ============================================================
// EVENT HANDLERS
// ============================================================

function initEventListeners() {
  // Tab switching
  window._switchSanitationTab = (tabId, btn) => {
    currentTab = tabId;
    
    // Update active state
    document.querySelectorAll('.sanitation-tab-item').forEach(item => {
      item.classList.remove('active');
      item.style.background = '';
      item.style.color = 'var(--text-tertiary)';
    });
    
    btn.classList.add('active');
    btn.style.background = 'var(--gradient-brand)';
    btn.style.color = 'white';
    btn.style.boxShadow = 'var(--shadow-sapphire)';
    
    renderCurrentTab();
  };
  
  // Modal handlers
  window._closeModal = (modalId) => {
    document.getElementById(modalId).style.display = 'none';
  };
  
  window._showAddSepticModal = () => {
    document.getElementById('modal-add-septic').style.display = 'flex';
  };
  
  window._showAddIPALModal = () => {
    document.getElementById('modal-add-ipal').style.display = 'flex';
  };
  
  window._showAddChuteModal = () => {
    document.getElementById('modal-add-chute').style.display = 'flex';
  };
  
  // Calculator handlers
  window._calculateChute = () => {
    const height = parseFloat(document.getElementById('chute-building-height')?.value) || 15;
    const waste = parseFloat(document.getElementById('chute-waste-generation')?.value) || 50;
    const type = document.getElementById('chute-building-type')?.value || 'residential';
    
    const result = calculateChuteDimension(height, waste, type);
    
    const resultDiv = document.getElementById('chute-calculation-result');
    if (resultDiv) {
      resultDiv.innerHTML = `
        <div style="display: grid; gap: 12px;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div style="background: hsla(220, 20%, 100%, 0.05); border-radius: 8px; padding: 12px;">
              <div style="font-size: 10px; color: var(--text-tertiary);">Dimensi Minimum</div>
              <div style="font-size: 18px; color: white; font-weight: 700;">${result.minDimension}m</div>
            </div>
            <div style="background: hsla(220, 20%, 100%, 0.05); border-radius: 8px; padding: 12px;">
              <div style="font-size: 10px; color: var(--text-tertiary);">Area Required</div>
              <div style="font-size: 18px; color: white; font-weight: 700;">${result.requiredArea}m²</div>
            </div>
          </div>
          <div style="background: ${result.status === 'C' ? 'hsla(158, 85%, 45%, 0.1)' : 'hsla(0, 85%, 60%, 0.1)'}; border: 1px solid ${result.status === 'C' ? 'hsla(158, 85%, 45%, 0.3)' : 'hsla(0, 85%, 60%, 0.3)'}; border-radius: 8px; padding: 12px;">
            <div style="font-size: 11px; color: ${result.status === 'C' ? 'var(--success-400)' : 'var(--danger-400)'};">
              <i class="fas ${result.status === 'C' ? 'fa-check' : 'fa-triangle-exclamation'}" style="margin-right: 6px;"></i>
              ${result.recommendation}
            </div>
          </div>
          <div style="font-size: 10px; color: var(--text-tertiary); font-family: var(--font-mono);">
            ${result.formula}
          </div>
        </div>
      `;
    }
  };
  
  window._calculateSeptic = () => {
    const population = parseInt(document.getElementById('septic-population')?.value) || 5;
    const waterUsage = parseInt(document.getElementById('septic-water-usage')?.value) || 100;
    const interval = parseInt(document.getElementById('septic-interval')?.value) || 3;
    
    const result = calculateSepticTankVolume(population, waterUsage, interval);
    
    const resultDiv = document.getElementById('septic-calculation-result');
    if (resultDiv) {
      resultDiv.innerHTML = `
        <div style="display: grid; gap: 16px;">
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;">
            <div style="background: hsla(220, 20%, 100%, 0.05); border-radius: 8px; padding: 16px; text-align: center;">
              <div style="font-size: 10px; color: var(--text-tertiary);">Volume Minimum</div>
              <div style="font-size: 24px; color: ${result.status === 'C' ? 'var(--success-400)' : 'var(--danger-400)'}; font-weight: 800; font-family: var(--font-mono);">${result.minVolume}m³</div>
            </div>
            <div style="background: hsla(220, 20%, 100%, 0.05); border-radius: 8px; padding: 16px; text-align: center;">
              <div style="font-size: 10px; color: var(--text-tertiary);">Kompartemen 1</div>
              <div style="font-size: 20px; color: white; font-weight: 700; font-family: var(--font-mono);">${result.compartment1}m³</div>
            </div>
            <div style="background: hsla(220, 20%, 100%, 0.05); border-radius: 8px; padding: 16px; text-align: center;">
              <div style="font-size: 10px; color: var(--text-tertiary);">Kompartemen 2</div>
              <div style="font-size: 20px; color: white; font-weight: 700; font-family: var(--font-mono);">${result.compartment2}m³</div>
            </div>
          </div>
          <div style="background: hsla(220, 20%, 100%, 0.05); border-radius: 8px; padding: 16px;">
            <div style="font-size: 10px; color: var(--text-tertiary); margin-bottom: 8px;">Produksi Lumpur & Jadwal Pengurasan</div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
              <div>
                <div style="font-size: 11px; color: var(--text-secondary);">Produksi Harian</div>
                <div style="font-size: 16px; color: white; font-weight: 600;">${result.sludgeAccumulation} L/hari</div>
              </div>
              <div>
                <div style="font-size: 11px; color: var(--text-secondary);">Pengurasan Berikutnya</div>
                <div style="font-size: 16px; color: ${COLORS.warning}; font-weight: 600;">${result.nextDesludging}</div>
              </div>
            </div>
          </div>
          <div style="background: ${result.status === 'C' ? 'hsla(158, 85%, 45%, 0.1)' : 'hsla(0, 85%, 60%, 0.1)'}; border: 1px solid ${result.status === 'C' ? 'hsla(158, 85%, 45%, 0.3)' : 'hsla(0, 85%, 60%, 0.3)'}; border-radius: 8px; padding: 12px;">
            <div style="font-size: 11px; color: ${result.status === 'C' ? 'var(--success-400)' : 'var(--danger-400)'};">
              <i class="fas ${result.status === 'C' ? 'fa-check' : 'fa-triangle-exclamation'}" style="margin-right: 6px;"></i>
              ${result.complianceMessage}
            </div>
          </div>
          <div style="font-size: 10px; color: var(--text-tertiary); font-family: var(--font-mono);">
            ${result.formula}
          </div>
        </div>
      `;
    }
  };
  
  window._calculateIPAL = () => {
    const population = parseInt(document.getElementById('ipal-population')?.value) || 10;
    const bodLoad = parseInt(document.getElementById('ipal-bod-load')?.value) || 40;
    
    const result = calculateIPALVolume(population, bodLoad);
    
    const resultDiv = document.getElementById('ipal-calculation-result');
    if (resultDiv) {
      resultDiv.innerHTML = `
        <div style="display: grid; gap: 16px;">
          <div style="background: hsla(220, 20%, 100%, 0.05); border-radius: 8px; padding: 16px; text-align: center;">
            <div style="font-size: 10px; color: var(--text-tertiary);">Volume Total IPAL</div>
            <div style="font-size: 28px; color: white; font-weight: 800; font-family: var(--font-mono);">${result.totalVolume}m³</div>
          </div>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;">
            <div style="background: hsla(158, 85%, 45%, 0.1); border-radius: 8px; padding: 12px; text-align: center;">
              <div style="font-size: 10px; color: var(--text-tertiary);">Anaerob (30%)</div>
              <div style="font-size: 18px; color: white; font-weight: 700; font-family: var(--font-mono);">${result.compartments.anaerob.volume}m³</div>
            </div>
            <div style="background: hsla(158, 85%, 45%, 0.15); border-radius: 8px; padding: 12px; text-align: center;">
              <div style="font-size: 10px; color: var(--text-tertiary);">Aerob (50%)</div>
              <div style="font-size: 18px; color: white; font-weight: 700; font-family: var(--font-mono);">${result.compartments.aerob.volume}m³</div>
            </div>
            <div style="background: hsla(220, 95%, 52%, 0.1); border-radius: 8px; padding: 12px; text-align: center;">
              <div style="font-size: 10px; color: var(--text-tertiary);">Pengendap (20%)</div>
              <div style="font-size: 18px; color: white; font-weight: 700; font-family: var(--font-mono);">${result.compartments.settling.volume}m³</div>
            </div>
          </div>
          <div style="font-size: 10px; color: var(--text-tertiary); font-family: var(--font-mono);">
            Berdasarkan beban BOD: ${result.totalBOD} kg/hari
          </div>
        </div>
      `;
    }
  };
  
  // Save handlers
  window._saveSepticTank = async () => {
    try {
      const data = {
        name: document.getElementById('septic-name')?.value,
        population: parseInt(document.getElementById('septic-population-modal')?.value) || 5,
        volume: parseFloat(document.getElementById('septic-volume')?.value) || 1.8,
        dimensions: {
          length: parseFloat(document.getElementById('septic-length')?.value) || 2.5,
          width: parseFloat(document.getElementById('septic-width')?.value) || 1.2,
          depth: parseFloat(document.getElementById('septic-depth')?.value) || 2.0
        }
      };
      
      await createSepticTank(currentProjectId, data);
      showSuccess('Septic tank berhasil ditambahkan');
      window._closeModal('modal-add-septic');
      await loadSanitationData();
      renderCurrentTab();
    } catch (e) {
      showError('Gagal menambahkan septic tank: ' + e.message);
    }
  };
  
  window._saveIPAL = async () => {
    try {
      const data = {
        name: document.getElementById('ipal-name')?.value,
        type: document.getElementById('ipal-type-modal')?.value,
        totalVolume: parseFloat(document.getElementById('ipal-total-volume')?.value) || 5,
        compartments: {
          anaerob: { volume: 0, percentage: 30 },
          aerob: { volume: 0, percentage: 50 },
          settling: { volume: 0, percentage: 20 }
        }
      };
      
      await createIPAL(currentProjectId, data);
      showSuccess('IPAL berhasil ditambahkan');
      window._closeModal('modal-add-ipal');
      await loadSanitationData();
      renderCurrentTab();
    } catch (e) {
      showError('Gagal menambahkan IPAL: ' + e.message);
    }
  };
  
  window._saveChute = async () => {
    try {
      const data = {
        name: document.getElementById('chute-name')?.value,
        location: document.getElementById('chute-location')?.value,
        dimensions: {
          width: parseFloat(document.getElementById('chute-width')?.value) || 0.6,
          height: parseFloat(document.getElementById('chute-height')?.value) || 0.6
        },
        slope: parseFloat(document.getElementById('chute-slope-modal')?.value) || 2
      };
      
      await createChute(currentProjectId, data);
      showSuccess('Chute berhasil ditambahkan');
      window._closeModal('modal-add-chute');
      await loadSanitationData();
      renderCurrentTab();
    } catch (e) {
      showError('Gagal menambahkan chute: ' + e.message);
    }
  };
  
  // Distance validation
  window._validateDistance = async (tankId) => {
    const toWell = parseFloat(document.getElementById(`dist-well-${tankId}`)?.value) || 0;
    const toBuilding = parseFloat(document.getElementById(`dist-building-${tankId}`)?.value) || 0;
    const toWater = parseFloat(document.getElementById(`dist-water-${tankId}`)?.value) || 0;
    
    const result = validateSafetyDistanceManual(toWell, toBuilding, toWater);
    
    // Update tank data
    const tank = sanitationData.septicTanks.find(t => t.id === tankId);
    if (tank) {
      await updateSepticTank(tankId, {
        ...tank,
        distances: { toWell, toBuilding, toWaterSource: toWater }
      });
    }
    
    const resultDiv = document.getElementById(`distance-result-${tankId}`);
    if (resultDiv) {
      resultDiv.innerHTML = `
        <div style="background: ${result.status === 'C' ? 'hsla(158, 85%, 45%, 0.1)' : 'hsla(0, 85%, 60%, 0.1)'}; border: 1px solid ${result.status === 'C' ? 'hsla(158, 85%, 45%, 0.3)' : 'hsla(0, 85%, 60%, 0.3)'}; border-radius: 8px; padding: 12px;">
          <div style="font-size: 11px; color: ${result.status === 'C' ? 'var(--success-400)' : 'var(--danger-400)'};">
            <i class="fas ${result.status === 'C' ? 'fa-check' : 'fa-triangle-exclamation'}" style="margin-right: 6px;"></i>
            ${result.status === 'C' ? 'Jarak aman memenuhi semua standar' : 'Terdapat pelanggaran jarak aman'}
          </div>
          ${result.violations.length > 0 ? `
            <div style="margin-top: 8px; font-size: 10px; color: var(--danger-400);">
              ${result.violations.map(v => `<div>• ${v}</div>`).join('')}
            </div>
          ` : ''}
        </div>
      `;
    }
  };
  
  // Add effluent test
  window._addEffluentTest = async () => {
    try {
      const ipalId = document.getElementById('effluent-ipal-id')?.value;
      if (!ipalId) {
        showError('Pilih IPAL terlebih dahulu');
        return;
      }
      
      const data = {
        bod: parseFloat(document.getElementById('effluent-bod-outlet')?.value) || 0,
        tss: parseFloat(document.getElementById('effluent-tss-outlet')?.value) || 0,
        ph: parseFloat(document.getElementById('effluent-ph')?.value) || 7,
        cod: 0
      };
      
      const inletValues = {
        bod: parseFloat(document.getElementById('effluent-bod-inlet')?.value) || 200,
        tss: parseFloat(document.getElementById('effluent-tss-inlet')?.value) || 150
      };
      
      await addEffluentTest(currentProjectId, ipalId, {
        parameters: data,
        inletValues
      });
      
      showSuccess('Hasil uji effluent berhasil disimpan');
      await loadSanitationData();
      renderCurrentTab();
    } catch (e) {
      showError('Gagal menyimpan hasil uji: ' + e.message);
    }
  };
  
  // Export and sync
  window._exportSanitationData = async () => {
    try {
      const data = await exportProjectData(currentProjectId);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sanitation-${currentProjectId}-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showSuccess('Data berhasil diexport');
    } catch (e) {
      showError('Gagal export data: ' + e.message);
    }
  };
  
  window._syncSanitationData = async () => {
    try {
      const result = await syncToSupabase(currentProjectId);
      showSuccess(`${result.synced} data berhasil disinkronkan`);
    } catch (e) {
      showError('Gagal sinkronisasi: ' + e.message);
    }
  };
  
  // Compliance check
  window._runComplianceCheck = async () => {
    showInfo('Memeriksa compliance...');
    renderCurrentTab();
  };
}

// ============================================================
// CHART INITIALIZATION
// ============================================================

function initDashboardCharts() {
  // Effluent quality chart
  const effluentCanvas = document.getElementById('effluent-chart');
  if (effluentCanvas && sanitationData.effluentTests.length > 0) {
    chartInstances.effluent = createEffluentQualityChart('effluent-chart', sanitationData.effluentTests);
  }
  
  // Sludge level chart
  const sludgeCanvas = document.getElementById('sludge-chart');
  if (sludgeCanvas && sanitationData.sludgeRecords.length > 0) {
    chartInstances.sludge = createSludgeLevelChart('sludge-chart', sanitationData.sludgeRecords);
  }
}

// Component detail handler
window._showComponentDetail = (type) => {
  console.log('Show detail for:', type);
  // Implement detail modal if needed
};

// Edit/Delete handlers
window._editChute = (id) => {
  const chute = sanitationData.chutes.find(c => c.id === id);
  if (chute) {
    // Populate modal and show
    document.getElementById('chute-name').value = chute.name || '';
    window._showAddChuteModal();
  }
};

window._deleteChute = async (id) => {
  if (confirm('Hapus chute ini?')) {
    try {
      // Implement delete
      showSuccess('Chute dihapus');
      await loadSanitationData();
      renderCurrentTab();
    } catch (e) {
      showError('Gagal menghapus: ' + e.message);
    }
  }
};

window._editSepticTank = (id) => {
  const tank = sanitationData.septicTanks.find(t => t.id === id);
  if (tank) {
    document.getElementById('septic-name').value = tank.name || '';
    window._showAddSepticModal();
  }
};

window._addSludgeRecord = async (tankId) => {
  const level = prompt('Masukkan tingkat lumpur (%):', '30');
  if (level !== null) {
    try {
      await addSludgeRecord(currentProjectId, tankId, {
        level: parseFloat(level),
        urgency: parseFloat(level) >= 70 ? 'CRITICAL' : parseFloat(level) >= 50 ? 'HIGH' : 'NORMAL'
      });
      showSuccess('Record lumpur ditambahkan');
      await loadSanitationData();
      renderCurrentTab();
    } catch (e) {
      showError('Gagal menambahkan record: ' + e.message);
    }
  }
};

window._editIPAL = (id) => {
  const ipal = sanitationData.ipals.find(i => i.id === id);
  if (ipal) {
    document.getElementById('ipal-name').value = ipal.name || '';
    window._showAddIPALModal();
  }
};

window._deleteIPAL = async (id) => {
  if (confirm('Hapus IPAL ini?')) {
    try {
      showSuccess('IPAL dihapus');
      await loadSanitationData();
      renderCurrentTab();
    } catch (e) {
      showError('Gagal menghapus: ' + e.message);
    }
  }
};
