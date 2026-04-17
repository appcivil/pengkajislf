/**
 * SISTEM JALUR EVAKUASI (MEANS OF EGRESS) MODULE
 * Komponen UI komprehensif untuk sistem jalur evakuasi
 * Berdasarkan Permen PUPR No. 14/PRT/M/2017 (Pasal 220) dan Permen PUPR No. 26/PRT/M/2008
 * UI Style: Presidential Quartz (matching struktur-bangunan-module.js)
 */

import { supabase } from '../lib/supabase.js';
import { navigate } from '../lib/router.js';
import { showSuccess, showError, showInfo } from '../components/toast.js';
import { openModal, confirm } from '../components/modal.js';
import {
  calculateOccupantLoad,
  calculateTotalOccupantLoad,
  calculateEgressWidth,
  calculateCapacityFromWidth,
  checkTravelDistance,
  classifyBuilding,
  checkCommonPathDistance,
  validateStairDimensions,
  checkHeadroomClearance,
  checkEmergencyLighting,
  checkSmokeZone,
  calculateRefugeArea,
  calculateEgressComplianceScore,
  calculateRSET,
  getLegalReferences,
  getReferenceByCategory,
  OCCUPANT_FACTORS,
  CAPACITY_FACTORS,
  BUILDING_FIRE_CLASSES,
  TRAVEL_DISTANCE_LIMITS
} from '../lib/egress-calculators.js';

// ============================================================
// 1. SUMMARY FETCH FUNCTION
// ============================================================

export async function fetchEgressSummary(projectId) {
  try {
    // Get egress routes count
    const { data: routes, error: routesError } = await supabase
      .from('egress_routes')
      .select('id, compliance_status')
      .eq('project_id', projectId);
    
    if (routesError) throw routesError;
    
    // Get exit components count
    const { data: components, error: compError } = await supabase
      .from('exit_components')
      .select('id, component_type, status')
      .eq('project_id', projectId);
    
    if (compError) throw compError;
    
    // Get emergency lighting count
    const { data: lighting, error: lightError } = await supabase
      .from('emergency_lighting')
      .select('id, status')
      .eq('project_id', projectId);
    
    if (lightError) throw lightError;
    
    // Get occupant loads
    const { data: occupantLoads, error: occError } = await supabase
      .from('occupant_loads')
      .select('*')
      .eq('project_id', projectId);
    
    if (occError) throw occError;
    
    // Get latest analysis (gunakan maybeSingle untuk menghindari error 406)
    const { data: analysis, error: analysisError } = await supabase
      .from('egress_analysis')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    // Log error untuk debugging tapi jangan throw
    if (analysisError && analysisError.code !== 'PGRST116') {
      console.warn('[fetchEgressSummary] Analysis query warning:', analysisError.message);
    }
    
    const totalOccupantLoad = occupantLoads?.reduce((sum, o) => sum + (o.calculated_load || 0), 0) || 0;
    const nonCompliantRoutes = routes?.filter(r => r.compliance_status === 'NON_COMPLIANT' || r.compliance_status === 'FAIL').length || 0;
    const nonCompliantComponents = components?.filter(c => c.status === 'FAIL').length || 0;
    const nonCompliantLighting = lighting?.filter(l => l.status === 'FAIL').length || 0;
    
    const hasData = (routes?.length > 0) || (components?.length > 0) || (occupantLoads?.length > 0);
    
    return {
      hasData,
      complianceScore: analysis?.compliance_score || 0,
      status: analysis?.status || 'NOT_STARTED',
      totalRoutes: routes?.length || 0,
      totalComponents: components?.length || 0,
      totalLighting: lighting?.length || 0,
      totalOccupantLoad,
      nonCompliantItems: nonCompliantRoutes + nonCompliantComponents + nonCompliantLighting,
      latestAnalysis: analysis || null,
      
      // Breakdown by component type
      doors: components?.filter(c => c.component_type === 'DOOR').length || 0,
      stairs: components?.filter(c => c.component_type === 'STAIR').length || 0,
      corridors: components?.filter(c => c.component_type === 'CORRIDOR').length || 0,
      ramps: components?.filter(c => c.component_type === 'RAMP').length || 0,
      
      // Compliance summary
      compliantRoutes: (routes?.length || 0) - nonCompliantRoutes,
      compliantComponents: (components?.length || 0) - nonCompliantComponents,
      compliantLighting: (lighting?.length || 0) - nonCompliantLighting
    };
  } catch (error) {
    console.error('Error fetching egress summary:', error);
    return {
      hasData: false,
      complianceScore: 0,
      status: 'ERROR',
      totalRoutes: 0,
      totalComponents: 0,
      totalLighting: 0,
      totalOccupantLoad: 0,
      nonCompliantItems: 0
    };
  }
}

// ============================================================
// 2. SUMMARY CARD RENDERER
// ============================================================

export function renderEgressSystemCard(project, summary = {}) {
  const statusColors = {
    'COMPLIANT': { bg: 'hsla(158, 85%, 45%, 0.1)', text: 'var(--success-400)', border: 'var(--success-500)' },
    'PASS': { bg: 'hsla(158, 85%, 45%, 0.1)', text: 'var(--success-400)', border: 'var(--success-500)' },
    'IN_PROGRESS': { bg: 'hsla(220, 95%, 52%, 0.1)', text: 'var(--brand-400)', border: 'var(--brand-500)' },
    'NON_COMPLIANT': { bg: 'hsla(0, 85%, 60%, 0.1)', text: 'var(--danger-400)', border: 'var(--danger-500)' },
    'FAIL': { bg: 'hsla(0, 85%, 60%, 0.1)', text: 'var(--danger-400)', border: 'var(--danger-500)' },
    'NOT_STARTED': { bg: 'hsla(220, 20%, 100%, 0.05)', text: 'var(--text-tertiary)', border: 'var(--text-tertiary)' },
    'ERROR': { bg: 'hsla(0, 85%, 60%, 0.1)', text: 'var(--danger-400)', border: 'var(--danger-500)' }
  };
  
  const st = statusColors[summary.status] || statusColors['NOT_STARTED'];
  const hasData = summary.hasData;
  
  return `
    <div class="card-quartz" id="egress-system-card" style="padding: var(--space-6); grid-column: 1 / -1;">
      <div class="flex-between" style="margin-bottom: 20px;">
        <div style="display: flex; align-items: center; gap: 16px;">
          <div style="width: 48px; height: 48px; border-radius: 14px; background: hsla(200, 100%, 45%, 0.1); display: flex; align-items: center; justify-content: center; color: hsla(200, 100%, 55%, 1);">
            <i class="fas fa-person-walking-arrow-right" style="font-size: 1.4rem;"></i>
          </div>
          <div>
            <div style="font-family: var(--font-mono); font-size: 12px; font-weight: 800; color: hsla(200, 100%, 55%, 1);">PHASE 02E</div>
            <h3 style="font-family: 'Outfit', sans-serif; font-weight: 800; font-size: 1.1rem; color: white; margin: 0;">Sistem Jalur Evakuasi</h3>
          </div>
        </div>
        <div style="display: flex; gap: 8px;">
          <span class="badge" style="background: ${st.bg}; color: ${st.text}; border: 1px solid ${st.border}44; font-size: 10px;">
            <i class="fas ${summary.status === 'COMPLIANT' || summary.status === 'PASS' ? 'fa-check-circle' : summary.status === 'NOT_STARTED' ? 'fa-circle-minus' : 'fa-triangle-exclamation'}" style="margin-right: 6px;"></i>
            ${summary.status === 'COMPLIANT' || summary.status === 'PASS' ? 'LAIK' : summary.status === 'NOT_STARTED' ? 'BELUM DINILAI' : 'PERLU PERHATIAN'}
          </span>
          <span class="badge" style="background: hsla(200, 100%, 45%, 0.1); color: hsla(200, 100%, 55%, 1); border: 1px solid hsla(200, 100%, 45%, 0.2); font-size: 10px;">
            <i class="fas fa-book" style="margin-right: 6px;"></i>Permen 14/2017
          </span>
        </div>
      </div>
      
      <p style="font-size: 0.75rem; color: var(--text-tertiary); line-height: 1.5; margin-bottom: 20px;">
        Analisis jalur evakuasi berdasarkan Permen PUPR No. 14/PRT/M/2017 Pasal 220 dan Permen PUPR No. 26/PRT/M/2008. Meliputi occupant load, travel distance, egress capacity, dan emergency lighting.
      </p>

      ${hasData ? `
        <!-- Stats Grid -->
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px;">
          <div style="background: hsla(220, 20%, 100%, 0.02); border: 1px solid hsla(220, 20%, 100%, 0.05); border-radius: 12px; padding: 16px; text-align: center;">
            <div style="font-family: var(--font-mono); font-size: 24px; font-weight: 800; color: white;">${summary.totalOccupantLoad}</div>
            <div style="font-size: 10px; color: var(--text-tertiary); margin-top: 4px;">OCCUPANT LOAD</div>
          </div>
          <div style="background: hsla(220, 20%, 100%, 0.02); border: 1px solid hsla(220, 20%, 100%, 0.05); border-radius: 12px; padding: 16px; text-align: center;">
            <div style="font-family: var(--font-mono); font-size: 24px; font-weight: 800; color: ${summary.nonCompliantItems > 0 ? 'var(--danger-400)' : 'var(--success-400)'}">${summary.totalRoutes}</div>
            <div style="font-size: 10px; color: var(--text-tertiary); margin-top: 4px;">ROUTES</div>
          </div>
          <div style="background: hsla(220, 20%, 100%, 0.02); border: 1px solid hsla(220, 20%, 100%, 0.05); border-radius: 12px; padding: 16px; text-align: center;">
            <div style="font-family: var(--font-mono); font-size: 24px; font-weight: 800; color: ${summary.nonCompliantItems > 0 ? 'var(--danger-400)' : 'var(--success-400)'}">${summary.totalComponents}</div>
            <div style="font-size: 10px; color: var(--text-tertiary); margin-top: 4px;">COMPONENTS</div>
          </div>
          <div style="background: hsla(220, 20%, 100%, 0.02); border: 1px solid hsla(220, 20%, 100%, 0.05); border-radius: 12px; padding: 16px; text-align: center;">
            <div style="font-family: var(--font-mono); font-size: 24px; font-weight: 800; color: white;">${summary.totalLighting}</div>
            <div style="font-size: 10px; color: var(--text-tertiary); margin-top: 4px;">LIGHTING</div>
          </div>
        </div>
        
        <!-- Compliance Score -->
        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid hsla(220, 20%, 100%, 0.1);">
          <div class="flex-between" style="margin-bottom: 8px;">
            <span style="font-size: 0.7rem; font-weight: 700; color: var(--text-tertiary);">COMPLIANCE SCORE</span>
            <span style="font-size: 0.7rem; font-weight: 800; color: ${summary.complianceScore >= 80 ? 'var(--success-400)' : summary.complianceScore >= 50 ? 'var(--warning-400)' : 'var(--danger-400)'}">${summary.complianceScore}/100</span>
          </div>
          <div style="height: 6px; background: hsla(220, 20%, 100%, 0.05); border-radius: 10px;">
            <div style="width: ${summary.complianceScore}%; height: 100%; border-radius: 10px; background: ${summary.complianceScore >= 80 ? 'var(--success-500)' : summary.complianceScore >= 50 ? 'var(--warning-500)' : 'var(--danger-500)'}; box-shadow: 0 0 10px ${summary.complianceScore >= 80 ? 'var(--success-500)' : summary.complianceScore >= 50 ? 'var(--warning-500)' : 'var(--danger-500)'}66;"></div>
          </div>
          ${summary.nonCompliantItems > 0 ? `
            <div style="margin-top: 8px; font-size: 10px; color: var(--danger-400);">
              <i class="fas fa-triangle-exclamation" style="margin-right: 4px;"></i>
              ${summary.nonCompliantItems} item tidak laik
            </div>
          ` : ''}
        </div>

        <!-- Presidential Tab Navigation -->
        <div class="card-quartz" style="padding: 6px; margin-top: 24px; display: flex; gap: 8px; background: hsla(224, 25%, 4%, 0.6); flex-wrap: wrap;">
          <button onclick="window._switchEgressTab('screening', this)" 
                  class="egress-tab-item active"
                  data-tab="screening"
                  style="flex: 1; min-width: 140px; height: 44px; border: none; border-radius: 10px; cursor: pointer; font-family: var(--font-mono); font-size: 10px; font-weight: 800; letter-spacing: 1px; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.3s; background: var(--gradient-brand); color: white; box-shadow: var(--shadow-sapphire);">
            <i class="fas fa-users"></i> SCREENING
          </button>
          <button onclick="window._switchEgressTab('horizontal', this)" 
                  class="egress-tab-item"
                  data-tab="horizontal"
                  style="flex: 1; min-width: 140px; height: 44px; border: none; border-radius: 10px; cursor: pointer; font-family: var(--font-mono); font-size: 10px; font-weight: 800; letter-spacing: 1px; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.3s; color: var(--text-tertiary);">
            <i class="fas fa-arrows-left-right"></i> HORIZONTAL
          </button>
          <button onclick="window._switchEgressTab('stairs', this)" 
                  class="egress-tab-item"
                  data-tab="stairs"
                  style="flex: 1; min-width: 140px; height: 44px; border: none; border-radius: 10px; cursor: pointer; font-family: var(--font-mono); font-size: 10px; font-weight: 800; letter-spacing: 1px; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.3s; color: var(--text-tertiary);">
            <i class="fas fa-stairs"></i> STAIRS
          </button>
          <button onclick="window._switchEgressTab('lighting', this)" 
                  class="egress-tab-item"
                  data-tab="lighting"
                  style="flex: 1; min-width: 140px; height: 44px; border: none; border-radius: 10px; cursor: pointer; font-family: var(--font-mono); font-size: 10px; font-weight: 800; letter-spacing: 1px; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.3s; color: var(--text-tertiary);">
            <i class="fas fa-lightbulb"></i> LIGHTING
          </button>
          <button onclick="window._switchEgressTab('smoke', this)" 
                  class="egress-tab-item"
                  data-tab="smoke"
                  style="flex: 1; min-width: 140px; height: 44px; border: none; border-radius: 10px; cursor: pointer; font-family: var(--font-mono); font-size: 10px; font-weight: 800; letter-spacing: 1px; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.3s; color: var(--text-tertiary);">
            <i class="fas fa-smog"></i> SMOKE
          </button>
        </div>

        <!-- TAB CONTENT: SCREENING -->
        <div id="egress-tab-screening" class="egress-tab-content active" style="margin-top: 20px;">
          ${renderScreeningTab()}
        </div>

        <!-- TAB CONTENT: HORIZONTAL -->
        <div id="egress-tab-horizontal" class="egress-tab-content" style="display: none; margin-top: 20px;">
          ${renderHorizontalTab()}
        </div>

        <!-- TAB CONTENT: STAIRS -->
        <div id="egress-tab-stairs" class="egress-tab-content" style="display: none; margin-top: 20px;">
          ${renderStairsTab()}
        </div>

        <!-- TAB CONTENT: LIGHTING -->
        <div id="egress-tab-lighting" class="egress-tab-content" style="display: none; margin-top: 20px;">
          ${renderLightingTab()}
        </div>

        <!-- TAB CONTENT: SMOKE -->
        <div id="egress-tab-smoke" class="egress-tab-content" style="display: none; margin-top: 20px;">
          ${renderSmokeTab()}
        </div>
      ` : `
        <div style="margin-top: 20px; padding: 24px; background: hsla(220, 20%, 100%, 0.02); border: 1px dashed hsla(220, 20%, 100%, 0.1); border-radius: 12px; text-align: center;">
          <i class="fas fa-person-walking-arrow-right" style="font-size: 2rem; color: var(--text-tertiary); margin-bottom: 12px;"></i>
          <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 8px;">Belum ada data jalur evakuasi</p>
          <p style="font-size: 0.75rem; color: var(--text-tertiary); margin-bottom: 16px;">Mulai analisis dengan mengisi occupant load dan komponen evakuasi</p>
          <button onclick="window._initEgressAnalysis('${project.id}')" class="btn btn-primary btn-sm">
            <i class="fas fa-play" style="margin-right: 6px;"></i> Mulai Analisis
          </button>
        </div>
      `}

      <style>
        .egress-tab-item:hover { background: hsla(220, 20%, 100%, 0.05); }
        .egress-tab-item.active { background: var(--gradient-brand) !important; color: white !important; }
        .egress-tab-content { animation: fadeIn 0.3s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      </style>
    </div>
  `;
}

// ============================================================
// 3. TAB CONTENT RENDERERS
// ============================================================

function renderScreeningTab() {
  return `
    <div class="grid-2-col" style="gap: 16px;">
      <!-- Occupant Load Calculator -->
      <div class="card-quartz" style="padding: 20px;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
          <div style="width: 36px; height: 36px; border-radius: 8px; background: hsla(220, 95%, 52%, 0.1); display: flex; align-items: center; justify-content: center; color: var(--brand-400);">
            <i class="fas fa-users"></i>
          </div>
          <div>
            <div style="font-weight: 700; color: white; font-size: 0.9rem;">Occupant Load Calculator</div>
            <div style="font-size: 0.7rem; color: var(--text-tertiary);">Permen 14/2017 Pasal 220</div>
          </div>
        </div>
        
        <div style="margin-bottom: 12px;">
          <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Fungsi Ruang</label>
          <select id="egress-room-function" class="form-select" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1); color: white;">
            ${Object.entries(OCCUPANT_FACTORS).map(([key, val]) => `
              <option value="${key}">${val.label}</option>
            `).join('')}
          </select>
        </div>
        
        <div style="margin-bottom: 12px;">
          <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Luas Ruang (m²)</label>
          <input type="number" id="egress-room-area" class="form-input" placeholder="0.00" step="0.1" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1);">
        </div>
        
        <button onclick="window._calculateOccupantLoad()" class="btn btn-primary btn-sm" style="width: 100%;">
          <i class="fas fa-calculator" style="margin-right: 6px;"></i> Hitung Occupant Load
        </button>
        
        <div id="occupant-load-result" style="margin-top: 12px; display: none;"></div>
      </div>

      <!-- Building Classification -->
      <div class="card-quartz" style="padding: 20px;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
          <div style="width: 36px; height: 36px; border-radius: 8px; background: hsla(160, 100%, 45%, 0.1); display: flex; align-items: center; justify-content: center; color: var(--success-400);">
            <i class="fas fa-building"></i>
          </div>
          <div>
            <div style="font-weight: 700; color: white; font-size: 0.9rem;">Building Classification</div>
            <div style="font-size: 0.7rem; color: var(--text-tertiary);">Permen 26/2008</div>
          </div>
        </div>
        
        <div style="margin-bottom: 12px;">
          <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Fungsi Bangunan</label>
          <select id="egress-building-function" class="form-select" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1); color: white;">
            <option value="HEALTHCARE">Rumah Sakit</option>
            <option value="OFFICE">Kantor</option>
            <option value="HOTEL">Hotel</option>
            <option value="RESIDENTIAL">Hunian</option>
            <option value="ASSEMBLY">Aula/Assembly</option>
            <option value="EDUCATION">Pendidikan</option>
            <option value="RETAIL">Perdagangan</option>
          </select>
        </div>
        
        <div style="margin-bottom: 12px;">
          <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Jumlah Lantai</label>
          <input type="number" id="egress-floor-count" class="form-input" placeholder="0" min="1" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1);">
        </div>
        
        <button onclick="window._classifyBuilding()" class="btn btn-primary btn-sm" style="width: 100%; background: hsla(160, 100%, 45%, 0.2); border-color: hsla(160, 100%, 45%, 0.3); color: var(--success-400);">
          <i class="fas fa-tag" style="margin-right: 6px;"></i> Klasifikasikan
        </button>
        
        <div id="building-class-result" style="margin-top: 12px; display: none;"></div>
      </div>

      <!-- Egress Capacity Calculator -->
      <div class="card-quartz" style="padding: 20px;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
          <div style="width: 36px; height: 36px; border-radius: 8px; background: hsla(45, 90%, 60%, 0.1); display: flex; align-items: center; justify-content: center; color: var(--gold-400);">
            <i class="fas fa-ruler-combined"></i>
          </div>
          <div>
            <div style="font-weight: 700; color: white; font-size: 0.9rem;">Egress Capacity</div>
            <div style="font-size: 0.7rem; color: var(--text-tertiary);">Width & Capacity Check</div>
          </div>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px;">
          <div>
            <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Occupant Load</label>
            <input type="number" id="egress-capacity-load" class="form-input" placeholder="0" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1);">
          </div>
          <div>
            <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Tipe Komponen</label>
            <select id="egress-component-type" class="form-select" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1); color: white;">
              ${Object.entries(CAPACITY_FACTORS).map(([key, val]) => `
                <option value="${key}">${val.label}</option>
              `).join('')}
            </select>
          </div>
        </div>
        
        <div style="margin-bottom: 12px;">
          <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Lebar Terukur (meter)</label>
          <input type="number" id="egress-measured-width" class="form-input" placeholder="0.00" step="0.01" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1);">
        </div>
        
        <button onclick="window._calculateEgressCapacity()" class="btn btn-primary btn-sm" style="width: 100%; background: hsla(45, 90%, 60%, 0.2); border-color: hsla(45, 90%, 60%, 0.3); color: var(--gold-400);">
          <i class="fas fa-calculator" style="margin-right: 6px;"></i> Hitung Kebutuhan Lebar
        </button>
        
        <div id="egress-capacity-result" style="margin-top: 12px; display: none;"></div>
      </div>

      <!-- Compliance Scorecard -->
      <div class="card-quartz" style="padding: 20px; background: hsla(220, 20%, 100%, 0.05);">
        <div style="font-weight: 700; color: white; margin-bottom: 12px;">
          <i class="fas fa-clipboard-check" style="margin-right: 8px; color: var(--brand-400);"></i>Egress Compliance Scorecard
        </div>
        <div style="font-size: 0.75rem; color: var(--text-tertiary); line-height: 1.6; margin-bottom: 12px;">
          <p><strong>Exit Number:</strong> 20 poin</p>
          <p><strong>Travel Distance:</strong> 20 poin</p>
          <p><strong>Width Capacity:</strong> 20 poin</p>
          <p><strong>Stair Protection:</strong> 20 poin</p>
          <p><strong>Lighting/Sign:</strong> 20 poin</p>
          <p style="margin-top: 8px; color: var(--success-400);">Pass threshold: 80/100</p>
        </div>
        <button onclick="window._calculateComplianceScore()" class="btn btn-ghost btn-sm" style="width: 100%;">
          <i class="fas fa-calculator" style="margin-right: 6px;"></i> Hitung Skor Kelaikan
        </button>
      </div>
    </div>
  `;
}

function renderHorizontalTab() {
  return `
    <div class="grid-2-col" style="gap: 16px;">
      <!-- Travel Distance Calculator -->
      <div class="card-quartz" style="padding: 20px;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
          <div style="width: 36px; height: 36px; border-radius: 8px; background: hsla(220, 95%, 52%, 0.1); display: flex; align-items: center; justify-content: center; color: var(--brand-400);">
            <i class="fas fa-arrows-left-right"></i>
          </div>
          <div>
            <div style="font-weight: 700; color: white; font-size: 0.9rem;">Travel Distance</div>
            <div style="font-size: 0.7rem; color: var(--text-tertiary);">Max 45-60 meter</div>
          </div>
        </div>
        
        <div style="margin-bottom: 12px;">
          <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Jarak Tempuh (meter)</label>
          <input type="number" id="egress-travel-distance" class="form-input" placeholder="0.00" step="0.1" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1);">
        </div>
        
        <div style="margin-bottom: 12px;">
          <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Kelas Bangunan</label>
          <select id="egress-travel-class" class="form-select" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1); color: white;">
            ${Object.entries(TRAVEL_DISTANCE_LIMITS).map(([key, val]) => `
              <option value="${key}">${val.label} (${val.base}m)</option>
            `).join('')}
          </select>
        </div>
        
        <div style="display: flex; gap: 12px; margin-bottom: 12px;">
          <label style="display: flex; align-items: center; gap: 6px; font-size: 0.8rem; color: var(--text-secondary); cursor: pointer;">
            <input type="checkbox" id="egress-has-sprinkler" style="accent-color: var(--brand-500);">
            <span>Sprinkler (+25%)</span>
          </label>
          <label style="display: flex; align-items: center; gap: 6px; font-size: 0.8rem; color: var(--text-secondary); cursor: pointer;">
            <input type="checkbox" id="egress-is-dead-end" style="accent-color: var(--brand-500);">
            <span>Dead End</span>
          </label>
        </div>
        
        <button onclick="window._checkTravelDistance()" class="btn btn-primary btn-sm" style="width: 100%;">
          <i class="fas fa-ruler" style="margin-right: 6px;"></i> Cek Compliance
        </button>
        
        <div id="travel-distance-result" style="margin-top: 12px; display: none;"></div>
      </div>

      <!-- Common Path Calculator -->
      <div class="card-quartz" style="padding: 20px;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
          <div style="width: 36px; height: 36px; border-radius: 8px; background: hsla(160, 100%, 45%, 0.1); display: flex; align-items: center; justify-content: center; color: var(--success-400);">
            <i class="fas fa-code-branch"></i>
          </div>
          <div>
            <div style="font-weight: 700; color: white; font-size: 0.9rem;">Common Path</div>
            <div style="font-size: 0.7rem; color: var(--text-tertiary);">Max 15-30 meter</div>
          </div>
        </div>
        
        <div style="margin-bottom: 12px;">
          <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Jarak Common Path (meter)</label>
          <input type="number" id="egress-common-path" class="form-input" placeholder="0.00" step="0.1" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1);">
        </div>
        
        <div style="margin-bottom: 12px;">
          <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Fungsi Bangunan</label>
          <select id="egress-common-path-function" class="form-select" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1); color: white;">
            <option value="HEALTHCARE">RS (max 30m)</option>
            <option value="ASSEMBLY">Aula (max 23m)</option>
            <option value="HAZARDOUS">Hazardous (max 15m)</option>
            <option value="OFFICE">Kantor (max 23m)</option>
          </select>
        </div>
        
        <button onclick="window._checkCommonPath()" class="btn btn-primary btn-sm" style="width: 100%; background: hsla(160, 100%, 45%, 0.2); border-color: hsla(160, 100%, 45%, 0.3); color: var(--success-400);">
          <i class="fas fa-check" style="margin-right: 6px;"></i> Cek Common Path
        </button>
        
        <div id="common-path-result" style="margin-top: 12px; display: none;"></div>
      </div>

      <!-- Corridor Width Analysis -->
      <div class="card-quartz" style="padding: 20px;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
          <div style="width: 36px; height: 36px; border-radius: 8px; background: hsla(45, 90%, 60%, 0.1); display: flex; align-items: center; justify-content: center; color: var(--gold-400);">
            <i class="fas fa-ruler-horizontal"></i>
          </div>
          <div>
            <div style="font-weight: 700; color: white; font-size: 0.9rem;">Corridor Width</div>
            <div style="font-size: 0.7rem; color: var(--text-tertiary);">Clear width check</div>
          </div>
        </div>
        
        <div style="margin-bottom: 12px;">
          <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Lebar Koridor (meter)</label>
          <input type="number" id="egress-corridor-width" class="form-input" placeholder="0.00" step="0.01" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1);">
        </div>
        
        <div style="margin-bottom: 12px;">
          <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Tipe Bangunan</label>
          <select id="egress-corridor-type" class="form-select" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1); color: white;">
            <option value="RS">Rumah Sakit (min 1.8-2.4m)</option>
            <option value="OFFICE">Kantor (min 1.5m)</option>
            <option value="HIGH_RISE">Gedung >8 Lantai (min 1.5m)</option>
            <option value="ASSEMBLY">Aula (min 2.0m)</option>
          </select>
        </div>
        
        <button onclick="window._checkCorridorWidth()" class="btn btn-primary btn-sm" style="width: 100%; background: hsla(45, 90%, 60%, 0.2); border-color: hsla(45, 90%, 60%, 0.3); color: var(--gold-400);">
          <i class="fas fa-ruler" style="margin-right: 6px;"></i> Cek Lebar Koridor
        </button>
        
        <div id="corridor-width-result" style="margin-top: 12px; display: none;"></div>
      </div>

      <!-- Door Swing Check -->
      <div class="card-quartz" style="padding: 20px;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
          <div style="width: 36px; height: 36px; border-radius: 8px; background: hsla(0, 85%, 60%, 0.1); display: flex; align-items: center; justify-content: center; color: var(--danger-400);">
            <i class="fas fa-door-open"></i>
          </div>
          <div>
            <div style="font-weight: 700; color: white; font-size: 0.9rem;">Door Swing Direction</div>
            <div style="font-size: 0.7rem; color: var(--text-tertiary);">Wajib searah evakuasi</div>
          </div>
        </div>
        
        <div style="margin-bottom: 12px;">
          <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Occupant Load</label>
          <input type="number" id="egress-door-occupant" class="form-input" placeholder="0" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1);">
        </div>
        
        <div style="margin-bottom: 12px;">
          <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Arah Buka Pintu</label>
          <select id="egress-door-swing" class="form-select" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1); color: white;">
            <option value="OUT">Keluar (OUT) - Compliant</option>
            <option value="IN">Masuk (IN) - Non-Compliant</option>
            <option value="SLIDING">Sliding</option>
          </select>
        </div>
        
        <button onclick="window._checkDoorSwing()" class="btn btn-primary btn-sm" style="width: 100%; background: hsla(0, 85%, 60%, 0.2); border-color: hsla(0, 85%, 60%, 0.3); color: var(--danger-400);">
          <i class="fas fa-check" style="margin-right: 6px;"></i> Cek Arah Buka
        </button>
        
        <div id="door-swing-result" style="margin-top: 12px; display: none;"></div>
      </div>
    </div>
  `;
}

function renderStairsTab() {
  return `
    <div class="grid-2-col" style="gap: 16px;">
      <!-- Stair Dimensions Check -->
      <div class="card-quartz" style="padding: 20px;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
          <div style="width: 36px; height: 36px; border-radius: 8px; background: hsla(220, 95%, 52%, 0.1); display: flex; align-items: center; justify-content: center; color: var(--brand-400);">
            <i class="fas fa-stairs"></i>
          </div>
          <div>
            <div style="font-weight: 700; color: white; font-size: 0.9rem;">Stair Dimensions</div>
            <div style="font-size: 0.7rem; color: var(--text-tertiary);">Riser & Tread Check</div>
          </div>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px;">
          <div>
            <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Riser (O) mm</label>
            <input type="number" id="egress-riser" class="form-input" placeholder="0" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1);">
          </div>
          <div>
            <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Tread (A) mm</label>
            <input type="number" id="egress-tread" class="form-input" placeholder="0" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1);">
          </div>
        </div>
        
        <div style="margin-bottom: 12px;">
          <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Nosing (mm)</label>
          <input type="number" id="egress-nosing" class="form-input" placeholder="0" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1);">
        </div>
        
        <button onclick="window._checkStairDimensions()" class="btn btn-primary btn-sm" style="width: 100%;">
          <i class="fas fa-ruler" style="margin-right: 6px;"></i> Validasi Dimensi
        </button>
        
        <div id="stair-dimensions-result" style="margin-top: 12px; display: none;"></div>
      </div>

      <!-- Stair Width Calculator -->
      <div class="card-quartz" style="padding: 20px;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
          <div style="width: 36px; height: 36px; border-radius: 8px; background: hsla(160, 100%, 45%, 0.1); display: flex; align-items: center; justify-content: center; color: var(--success-400);">
            <i class="fas fa-arrows-left-right"></i>
          </div>
          <div>
            <div style="font-weight: 700; color: white; font-size: 0.9rem;">Stair Width</div>
            <div style="font-size: 0.7rem; color: var(--text-tertiary);">Clear width & Capacity</div>
          </div>
        </div>
        
        <div style="margin-bottom: 12px;">
          <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Lebar Tangga (meter)</label>
          <input type="number" id="egress-stair-width" class="form-input" placeholder="0.00" step="0.01" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1);">
        </div>
        
        <div style="margin-bottom: 12px;">
          <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Jumlah Handrail</label>
          <select id="egress-handrail-count" class="form-select" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1); color: white;">
            <option value="0">Tidak ada</option>
            <option value="1">1 sisi</option>
            <option value="2">2 sisi</option>
          </select>
        </div>
        
        <button onclick="window._calculateStairCapacity()" class="btn btn-primary btn-sm" style="width: 100%; background: hsla(160, 100%, 45%, 0.2); border-color: hsla(160, 100%, 45%, 0.3); color: var(--success-400);">
          <i class="fas fa-calculator" style="margin-right: 6px;"></i> Hitung Kapasitas
        </button>
        
        <div id="stair-width-result" style="margin-top: 12px; display: none;"></div>
      </div>

      <!-- Headroom Clearance -->
      <div class="card-quartz" style="padding: 20px;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
          <div style="width: 36px; height: 36px; border-radius: 8px; background: hsla(45, 90%, 60%, 0.1); display: flex; align-items: center; justify-content: center; color: var(--gold-400);">
            <i class="fas fa-arrows-up-down"></i>
          </div>
          <div>
            <div style="font-weight: 700; color: white; font-size: 0.9rem;">Headroom Clearance</div>
            <div style="font-size: 0.7rem; color: var(--text-tertiary);">Minimum 2.0-2.1 meter</div>
          </div>
        </div>
        
        <div style="margin-bottom: 12px;">
          <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Tinggi Bebas (mm)</label>
          <input type="number" id="egress-headroom" class="form-input" placeholder="0" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1);">
        </div>
        
        <div style="margin-bottom: 12px;">
          <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Lokasi</label>
          <select id="egress-headroom-location" class="form-select" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1); color: white;">
            <option value="STAIR_STRINGER">Stair Stringer (min 2000mm)</option>
            <option value="LANDING">Landing (min 2100mm)</option>
            <option value="EXIT">Exit Door (min 2100mm)</option>
          </select>
        </div>
        
        <button onclick="window._checkHeadroom()" class="btn btn-primary btn-sm" style="width: 100%; background: hsla(45, 90%, 60%, 0.2); border-color: hsla(45, 90%, 60%, 0.3); color: var(--gold-400);">
          <i class="fas fa-check" style="margin-right: 6px;"></i> Cek Headroom
        </button>
        
        <div id="headroom-result" style="margin-top: 12px; display: none;"></div>
      </div>

      <!-- Stair Enclosure Classification -->
      <div class="card-quartz" style="padding: 20px;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
          <div style="width: 36px; height: 36px; border-radius: 8px; background: hsla(0, 85%, 60%, 0.1); display: flex; align-items: center; justify-content: center; color: var(--danger-400);">
            <i class="fas fa-shield-halved"></i>
          </div>
          <div>
            <div style="font-weight: 700; color: white; font-size: 0.9rem;">Stair Enclosure</div>
            <div style="font-size: 0.7rem; color: var(--text-tertiary);">Protection Classification</div>
          </div>
        </div>
        
        <div style="font-size: 0.75rem; color: var(--text-secondary); line-height: 1.6; margin-bottom: 12px;">
          <p><strong>Smoke-proof Tower:</strong> Terpisah total dengan lobby terbuka</p>
          <p><strong>Pressurized:</strong> Tekanan positif 25-50 Pa</p>
          <p><strong>Protected Lobby:</strong> Anteroom dengan pressurization</p>
        </div>
        
        <div style="margin-bottom: 12px;">
          <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Tipe Enclosure</label>
          <select id="egress-enclosure-type" class="form-select" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1); color: white;">
            <option value="SMOKE_PROOF">Smoke-proof Tower</option>
            <option value="PRESSURIZED">Pressurized Staircase</option>
            <option value="PROTECTED_LOBBY">Protected Lobby</option>
            <option value="STANDARD">Standard (Non-pressurized)</option>
          </select>
        </div>
        
        <div style="margin-bottom: 12px;">
          <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Tekanan Differential (Pa)</label>
          <input type="number" id="egress-pressure" class="form-input" placeholder="0" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1);">
        </div>
        
        <button onclick="window._checkStairEnclosure()" class="btn btn-primary btn-sm" style="width: 100%; background: hsla(0, 85%, 60%, 0.2); border-color: hsla(0, 85%, 60%, 0.3); color: var(--danger-400);">
          <i class="fas fa-check" style="margin-right: 6px;"></i> Cek Enclosure
        </button>
      </div>
    </div>
  `;
}

function renderLightingTab() {
  return `
    <div class="grid-2-col" style="gap: 16px;">
      <!-- Emergency Lighting Lux Check -->
      <div class="card-quartz" style="padding: 20px;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
          <div style="width: 36px; height: 36px; border-radius: 8px; background: hsla(220, 95%, 52%, 0.1); display: flex; align-items: center; justify-content: center; color: var(--brand-400);">
            <i class="fas fa-lightbulb"></i>
          </div>
          <div>
            <div style="font-weight: 700; color: white; font-size: 0.9rem;">Emergency Lighting</div>
            <div style="font-size: 0.7rem; color: var(--text-tertiary);">Lux Level Check</div>
          </div>
        </div>
        
        <div style="margin-bottom: 12px;">
          <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Lux Level Terukur</label>
          <input type="number" id="egress-lux-level" class="form-input" placeholder="0" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1);">
        </div>
        
        <div style="margin-bottom: 12px;">
          <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Jenis Lokasi</label>
          <select id="egress-lux-location" class="form-select" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1); color: white;">
            <option value="EXIT_SIGN">Exit Sign (min 50 lux)</option>
            <option value="STAIR_TREAD">Tangga Tread (min 20 lux)</option>
            <option value="CORRIDOR_FLOOR">Koridor Floor (min 10 lux)</option>
            <option value="OPERATING_ROOM">Kamar Operasi (min 200 lux)</option>
            <option value="MOSQUE">Masjid (min 200 lux)</option>
          </select>
        </div>
        
        <button onclick="window._checkLuxLevel()" class="btn btn-primary btn-sm" style="width: 100%;">
          <i class="fas fa-check" style="margin-right: 6px;"></i> Cek Lux Level
        </button>
        
        <div id="lux-result" style="margin-top: 12px; display: none;"></div>
      </div>

      <!-- Exit Sign Visibility -->
      <div class="card-quartz" style="padding: 20px;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
          <div style="width: 36px; height: 36px; border-radius: 8px; background: hsla(160, 100%, 45%, 0.1); display: flex; align-items: center; justify-content: center; color: var(--success-400);">
            <i class="fas fa-signs-post"></i>
          </div>
          <div>
            <div style="font-weight: 700; color: white; font-size: 0.9rem;">Exit Sign Visibility</div>
            <div style="font-size: 0.7rem; color: var(--text-tertiary);">Position & Illumination</div>
          </div>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px;">
          <div>
            <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Jarak Pandang (m)</label>
            <input type="number" id="egress-visibility-distance" class="form-input" placeholder="0" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1);">
          </div>
          <div>
            <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Tinggi Sign (mm)</label>
            <input type="number" id="egress-sign-height" class="form-input" placeholder="0" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1);">
          </div>
        </div>
        
        <div style="display: flex; gap: 12px; margin-bottom: 12px;">
          <label style="display: flex; align-items: center; gap: 6px; font-size: 0.8rem; color: var(--text-secondary); cursor: pointer;">
            <input type="checkbox" id="egress-photoluminescent" style="accent-color: var(--brand-500);">
            <span>Photoluminescent</span>
          </label>
        </div>
        
        <button onclick="window._checkExitSign()" class="btn btn-primary btn-sm" style="width: 100%; background: hsla(160, 100%, 45%, 0.2); border-color: hsla(160, 100%, 45%, 0.3); color: var(--success-400);">
          <i class="fas fa-check" style="margin-right: 6px;"></i> Cek Exit Sign
        </button>
        
        <div id="exit-sign-result" style="margin-top: 12px; display: none;"></div>
      </div>
    </div>
  `;
}

function renderSmokeTab() {
  return `
    <div class="grid-2-col" style="gap: 16px;">
      <!-- Smoke Zone Compartmentation -->
      <div class="card-quartz" style="padding: 20px;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
          <div style="width: 36px; height: 36px; border-radius: 8px; background: hsla(220, 95%, 52%, 0.1); display: flex; align-items: center; justify-content: center; color: var(--brand-400);">
            <i class="fas fa-smog"></i>
          </div>
          <div>
            <div style="font-weight: 700; color: white; font-size: 0.9rem;">Smoke Zone</div>
            <div style="font-size: 0.7rem; color: var(--text-tertiary);">Compartmentation Check</div>
          </div>
        </div>
        
        <div style="margin-bottom: 12px;">
          <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Luas Zona (m²)</label>
          <input type="number" id="egress-smoke-area" class="form-input" placeholder="0" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1);">
        </div>
        
        <div style="margin-bottom: 12px;">
          <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Tinggi Smoke Layer (m)</label>
          <input type="number" id="egress-smoke-height" class="form-input" placeholder="2.5" step="0.1" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1);">
        </div>
        
        <button onclick="window._checkSmokeZone()" class="btn btn-primary btn-sm" style="width: 100%;">
          <i class="fas fa-check" style="margin-right: 6px;"></i> Cek Smoke Zone
        </button>
        
        <div id="smoke-zone-result" style="margin-top: 12px; display: none;"></div>
      </div>

      <!-- Pressurization System -->
      <div class="card-quartz" style="padding: 20px;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
          <div style="width: 36px; height: 36px; border-radius: 8px; background: hsla(160, 100%, 45%, 0.1); display: flex; align-items: center; justify-content: center; color: var(--success-400);">
            <i class="fas fa-wind"></i>
          </div>
          <div>
            <div style="font-weight: 700; color: white; font-size: 0.9rem;">Pressurization</div>
            <div style="font-size: 0.7rem; color: var(--text-tertiary);">Stairwell Pressure Check</div>
          </div>
        </div>
        
        <div style="margin-bottom: 12px;">
          <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Differential Pressure (Pa)</label>
          <input type="number" id="egress-pressure-diff" class="form-input" placeholder="25-50" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1);">
        </div>
        
        <div style="margin-bottom: 12px;">
          <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Escape Air Velocity (m/s)</label>
          <input type="number" id="egress-escape-velocity" class="form-input" placeholder="min 2.5" step="0.1" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1);">
        </div>
        
        <button onclick="window._checkPressurization()" class="btn btn-primary btn-sm" style="width: 100%; background: hsla(160, 100%, 45%, 0.2); border-color: hsla(160, 100%, 45%, 0.3); color: var(--success-400);">
          <i class="fas fa-check" style="margin-right: 6px;"></i> Cek Pressurization
        </button>
        
        <div id="pressurization-result" style="margin-top: 12px; display: none;"></div>
      </div>

      <!-- Refuge Area Calculator -->
      <div class="card-quartz" style="padding: 20px;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
          <div style="width: 36px; height: 36px; border-radius: 8px; background: hsla(45, 90%, 60%, 0.1); display: flex; align-items: center; justify-content: center; color: var(--gold-400);">
            <i class="fas fa-house-chimney-medical"></i>
          </div>
          <div>
            <div style="font-weight: 700; color: white; font-size: 0.9rem;">Refuge Area</div>
            <div style="font-size: 0.7rem; color: var(--text-tertiary);">Untuk gedung >40m</div>
          </div>
        </div>
        
        <div style="margin-bottom: 12px;">
          <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Occupant Load</label>
          <input type="number" id="egress-refuge-occupant" class="form-input" placeholder="0" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1);">
        </div>
        
        <div style="margin-bottom: 12px;">
          <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Luas Tersedia (m²)</label>
          <input type="number" id="egress-refuge-area" class="form-input" placeholder="0" step="0.1" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1);">
        </div>
        
        <button onclick="window._calculateRefugeArea()" class="btn btn-primary btn-sm" style="width: 100%; background: hsla(45, 90%, 60%, 0.2); border-color: hsla(45, 90%, 60%, 0.3); color: var(--gold-400);">
          <i class="fas fa-calculator" style="margin-right: 6px;"></i> Hitung Refuge Area
        </button>
        
        <div id="refuge-area-result" style="margin-top: 12px; display: none;"></div>
      </div>

      <!-- RSET Calculator -->
      <div class="card-quartz" style="padding: 20px;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
          <div style="width: 36px; height: 36px; border-radius: 8px; background: hsla(0, 85%, 60%, 0.1); display: flex; align-items: center; justify-content: center; color: var(--danger-400);">
            <i class="fas fa-stopwatch"></i>
          </div>
          <div>
            <div style="font-weight: 700; color: white; font-size: 0.9rem;">RSET Calculator</div>
            <div style="font-size: 0.7rem; color: var(--text-tertiary);">Required Safe Egress Time</div>
          </div>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px;">
          <div>
            <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Jarak (m)</label>
            <input type="number" id="egress-rset-distance" class="form-input" placeholder="0" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1);">
          </div>
          <div>
            <label style="font-family: var(--font-mono); font-size: 9px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Tipe Jalur</label>
            <select id="egress-rset-path" class="form-select" style="width: 100%; background: hsla(220, 20%, 100%, 0.03); border-color: hsla(220, 20%, 100%, 0.1); color: white;">
              <option value="HORIZONTAL">Horizontal (1.2 m/s)</option>
              <option value="STAIR_DOWN">Tangga Turun (0.6 m/s)</option>
              <option value="STAIR_UP">Tangga Naik (0.4 m/s)</option>
            </select>
          </div>
        </div>
        
        <button onclick="window._calculateRSET()" class="btn btn-primary btn-sm" style="width: 100%; background: hsla(0, 85%, 60%, 0.2); border-color: hsla(0, 85%, 60%, 0.3); color: var(--danger-400);">
          <i class="fas fa-calculator" style="margin-right: 6px;"></i> Hitung RSET
        </button>
        
  `;
}

// ============================================================
// 5. INITIALIZATION HANDLERS
// ============================================================

export function initEgressSystemHandlers(projectId) {
  // Tab switching - Scoped to egress-system-card only
  window._switchEgressTab = (tabId, btn) => {
    const card = document.getElementById('egress-system-card');
    if (!card) {
      console.error('[EgressSystem] Card not found');
      return;
    }

    // Update button states - scoped within card
    card.querySelectorAll('.egress-tab-item').forEach(b => {
      b.classList.remove('active');
      b.style.background = '';
      b.style.color = 'var(--text-tertiary)';
      b.style.boxShadow = 'none';
    });

    if (btn) {
      btn.classList.add('active');
      btn.style.background = 'var(--gradient-brand)';
      btn.style.color = 'white';
      btn.style.boxShadow = 'var(--shadow-sapphire)';
    }

    // Show/hide content - scoped within card
    card.querySelectorAll('.egress-tab-content').forEach(content => {
      content.style.display = 'none';
      content.classList.remove('active');
    });

    const targetContent = card.querySelector(`#egress-tab-${tabId}`);
    if (targetContent) {
      targetContent.style.display = 'block';
      targetContent.classList.add('active');
    } else {
      console.warn(`[EgressSystem] Tab content not found: egress-tab-${tabId}`);
    }
  };

  // Initialize Egress Analysis
  window._initEgressAnalysis = (id) => {
    navigate('egress-system', { id });
  };

  // Occupant Load Calculator
  window._calculateOccupantLoad = () => {
    const roomFunction = document.getElementById('egress-room-function')?.value;
    const area = parseFloat(document.getElementById('egress-room-area')?.value);
    
    if (!area || area <= 0) {
      showError('Masukkan luas ruang yang valid');
      return;
    }
    
    const result = calculateOccupantLoad(area, roomFunction);
    const resultDiv = document.getElementById('occupant-load-result');
    
    if (resultDiv) {
      resultDiv.style.display = 'block';
      resultDiv.innerHTML = `
        <div style="padding: 12px; background: ${result.occupantLoad > 0 ? 'hsla(160, 100%, 45%, 0.1)' : 'hsla(0, 85%, 60%, 0.1)'}; border-radius: 8px; border: 1px solid ${result.occupantLoad > 0 ? 'hsla(160, 100%, 45%, 0.2)' : 'hsla(0, 85%, 60%, 0.2)'};">
          <div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 4px;">Occupant Load:</div>
          <div style="font-size: 1.5rem; font-weight: 800; color: ${result.occupantLoad > 0 ? 'var(--success-400)' : 'var(--danger-400)'};">${result.occupantLoad} orang</div>
          <div style="font-size: 0.7rem; color: var(--text-tertiary); margin-top: 4px;">
            Faktor: ${result.occupantFactor} m²/orang | Kategori: ${result.category}
          </div>
        </div>
      `;
    }
    
    showSuccess(`Occupant Load: ${result.occupantLoad} orang`);
  };

  // Building Classification
  window._classifyBuilding = () => {
    const buildingFunction = document.getElementById('egress-building-function')?.value;
    const floorCount = parseInt(document.getElementById('egress-floor-count')?.value);
    
    if (!floorCount || floorCount <= 0) {
      showError('Masukkan jumlah lantai yang valid');
      return;
    }
    
    const result = classifyBuilding(buildingFunction, floorCount);
    const resultDiv = document.getElementById('building-class-result');
    
    if (resultDiv) {
      resultDiv.style.display = 'block';
      resultDiv.innerHTML = `
        <div style="padding: 12px; background: hsla(220, 95%, 52%, 0.1); border-radius: 8px; border: 1px solid hsla(220, 95%, 52%, 0.2);">
          <div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 4px;">Klasifikasi:</div>
          <div style="font-size: 1.2rem; font-weight: 800; color: var(--brand-400);">${result.name}</div>
          <div style="font-size: 0.7rem; color: var(--text-tertiary); margin-top: 4px;">${result.description}</div>
          <div style="font-size: 0.7rem; color: var(--text-tertiary); margin-top: 4px;">Stringensi: ${result.stringency}</div>
        </div>
      `;
    }
    
    showSuccess(`Klasifikasi: ${result.name}`);
  };

  // Egress Capacity Calculator
  window._calculateEgressCapacity = () => {
    const occupantLoad = parseInt(document.getElementById('egress-capacity-load')?.value);
    const componentType = document.getElementById('egress-component-type')?.value;
    const measuredWidth = parseFloat(document.getElementById('egress-measured-width')?.value);
    
    if (!occupantLoad || occupantLoad <= 0) {
      showError('Masukkan occupant load yang valid');
      return;
    }
    
    const result = calculateEgressWidth(occupantLoad, componentType, measuredWidth || null);
    const resultDiv = document.getElementById('egress-capacity-result');
    
    if (resultDiv) {
      resultDiv.style.display = 'block';
      const statusColor = result.status === 'PASS' ? 'var(--success-400)' : result.status === 'FAIL' ? 'var(--danger-400)' : 'var(--text-tertiary)';
      resultDiv.innerHTML = `
        <div style="padding: 12px; background: ${result.status === 'PASS' ? 'hsla(160, 100%, 45%, 0.1)' : result.status === 'FAIL' ? 'hsla(0, 85%, 60%, 0.1)' : 'hsla(220, 20%, 100%, 0.05)'}; border-radius: 8px; border: 1px solid ${result.status === 'PASS' ? 'hsla(160, 100%, 45%, 0.2)' : result.status === 'FAIL' ? 'hsla(0, 85%, 60%, 0.2)' : 'hsla(220, 20%, 100%, 0.1)'};">
          <div style="font-size: 0.85rem; color: var(--text-secondary);">Lebar yang Dibutuhkan: <strong>${result.compliantWidth} m</strong></div>
          ${measuredWidth ? `
            <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 4px;">Lebar Terukur: <strong>${result.measuredWidth} m</strong></div>
            <div style="font-size: 0.9rem; font-weight: 800; color: ${statusColor}; margin-top: 8px;">Status: ${result.status}</div>
          ` : ''}
        </div>
      `;
    }
    
    showSuccess(`Lebar dibutuhkan: ${result.compliantWidth} meter`);
  };

  // Travel Distance Check
  window._checkTravelDistance = () => {
    const distance = parseFloat(document.getElementById('egress-travel-distance')?.value);
    const buildingClass = document.getElementById('egress-travel-class')?.value;
    const hasSprinkler = document.getElementById('egress-has-sprinkler')?.checked;
    const isDeadEnd = document.getElementById('egress-is-dead-end')?.checked;
    
    if (!distance || distance <= 0) {
      showError('Masukkan jarak tempuh yang valid');
      return;
    }
    
    const result = checkTravelDistance(distance, buildingClass, hasSprinkler, isDeadEnd);
    const resultDiv = document.getElementById('travel-distance-result');
    
    if (resultDiv) {
      resultDiv.style.display = 'block';
      const statusColor = result.status === 'COMPLIANT' ? 'var(--success-400)' : 'var(--danger-400)';
      resultDiv.innerHTML = `
        <div style="padding: 12px; background: ${result.status === 'COMPLIANT' ? 'hsla(160, 100%, 45%, 0.1)' : 'hsla(0, 85%, 60%, 0.1)'}; border-radius: 8px; border: 1px solid ${result.status === 'COMPLIANT' ? 'hsla(160, 100%, 45%, 0.2)' : 'hsla(0, 85%, 60%, 0.2)'};">
          <div style="font-size: 0.85rem; color: var(--text-secondary);">Jarak Terukur: <strong>${result.measured} m</strong></div>
          <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 4px;">Batas Maksimum: <strong>${result.allowed} m</strong></div>
          <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 4px;">Utilisasi: <strong>${result.utilization}%</strong></div>
          <div style="font-size: 0.9rem; font-weight: 800; color: ${statusColor}; margin-top: 8px;">Status: ${result.status}</div>
        </div>
      `;
    }
    
    showSuccess(result.status === 'COMPLIANT' ? 'Travel distance compliant' : 'Travel distance melebihi batas!');
  };

  // Common Path Check
  window._checkCommonPath = () => {
    const distance = parseFloat(document.getElementById('egress-common-path')?.value);
    const buildingFunction = document.getElementById('egress-common-path-function')?.value;
    
    if (!distance || distance <= 0) {
      showError('Masukkan jarak common path yang valid');
      return;
    }
    
    const result = checkCommonPathDistance(distance, buildingFunction);
    const resultDiv = document.getElementById('common-path-result');
    
    if (resultDiv) {
      resultDiv.style.display = 'block';
      const statusColor = result.status === 'COMPLIANT' ? 'var(--success-400)' : 'var(--danger-400)';
      resultDiv.innerHTML = `
        <div style="padding: 12px; background: ${result.status === 'COMPLIANT' ? 'hsla(160, 100%, 45%, 0.1)' : 'hsla(0, 85%, 60%, 0.1)'}; border-radius: 8px; border: 1px solid ${result.status === 'COMPLIANT' ? 'hsla(160, 100%, 45%, 0.2)' : 'hsla(0, 85%, 60%, 0.2)'};">
          <div style="font-size: 0.85rem; color: var(--text-secondary);">Jarak: <strong>${result.measured} m</strong></div>
          <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 4px;">Batas: <strong>${result.allowed} m</strong></div>
          <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 4px;">Utilisasi: <strong>${result.utilization}%</strong></div>
          <div style="font-size: 0.9rem; font-weight: 800; color: ${statusColor}; margin-top: 8px;">Status: ${result.status}</div>
        </div>
      `;
    }
    
    showSuccess(result.status === 'COMPLIANT' ? 'Common path compliant' : 'Common path melebihi batas!');
  };

  // Corridor Width Check
  window._checkCorridorWidth = () => {
    const width = parseFloat(document.getElementById('egress-corridor-width')?.value);
    const buildingType = document.getElementById('egress-corridor-type')?.value;
    
    if (!width || width <= 0) {
      showError('Masukkan lebar koridor yang valid');
      return;
    }
    
    const minWidths = { RS: 1.8, OFFICE: 1.5, HIGH_RISE: 1.5, ASSEMBLY: 2.0 };
    const minWidth = minWidths[buildingType] || 1.5;
    const isCompliant = width >= minWidth;
    
    const resultDiv = document.getElementById('corridor-width-result');
    if (resultDiv) {
      resultDiv.style.display = 'block';
      resultDiv.innerHTML = `
        <div style="padding: 12px; background: ${isCompliant ? 'hsla(160, 100%, 45%, 0.1)' : 'hsla(0, 85%, 60%, 0.1)'}; border-radius: 8px; border: 1px solid ${isCompliant ? 'hsla(160, 100%, 45%, 0.2)' : 'hsla(0, 85%, 60%, 0.2)'};">
          <div style="font-size: 0.85rem; color: var(--text-secondary);">Lebar Terukur: <strong>${width} m</strong></div>
          <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 4px;">Minimum: <strong>${minWidth} m</strong></div>
          <div style="font-size: 0.9rem; font-weight: 800; color: ${isCompliant ? 'var(--success-400)' : 'var(--danger-400)'}; margin-top: 8px;">Status: ${isCompliant ? 'COMPLIANT' : 'NON-COMPLIANT'}</div>
        </div>
      `;
    }
    
    showSuccess(isCompliant ? 'Lebar koridor compliant' : 'Lebar koridor tidak mencukupi!');
  };

  // Door Swing Check
  window._checkDoorSwing = () => {
    const occupantLoad = parseInt(document.getElementById('egress-door-occupant')?.value);
    const swingDirection = document.getElementById('egress-door-swing')?.value;
    
    if (!occupantLoad || occupantLoad < 0) {
      showError('Masukkan occupant load yang valid');
      return;
    }
    
    const isCompliant = occupantLoad <= 50 || swingDirection === 'OUT' || swingDirection === 'SLIDING';
    
    const resultDiv = document.getElementById('door-swing-result');
    if (resultDiv) {
      resultDiv.style.display = 'block';
      resultDiv.innerHTML = `
        <div style="padding: 12px; background: ${isCompliant ? 'hsla(160, 100%, 45%, 0.1)' : 'hsla(0, 85%, 60%, 0.1)'}; border-radius: 8px; border: 1px solid ${isCompliant ? 'hsla(160, 100%, 45%, 0.2)' : 'hsla(0, 85%, 60%, 0.2)'};">
          <div style="font-size: 0.85rem; color: var(--text-secondary);">Occupant Load: <strong>${occupantLoad} orang</strong></div>
          <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 4px;">Arah Buka: <strong>${swingDirection}</strong></div>
          <div style="font-size: 0.9rem; font-weight: 800; color: ${isCompliant ? 'var(--success-400)' : 'var(--danger-400)'}; margin-top: 8px;">Status: ${isCompliant ? 'COMPLIANT' : 'NON-COMPLIANT'}</div>
        </div>
      `;
    }
    
    showSuccess(isCompliant ? 'Arah buka pintu compliant' : 'Arah buka pintu tidak compliant!');
  };

  // Stair Dimensions Check
  window._checkStairDimensions = () => {
    const riser = parseFloat(document.getElementById('egress-riser')?.value);
    const tread = parseFloat(document.getElementById('egress-tread')?.value);
    const nosing = parseFloat(document.getElementById('egress-nosing')?.value) || 0;
    
    if (!riser || !tread) {
      showError('Masukkan dimensi anak tangga yang valid');
      return;
    }
    
    const result = validateStairDimensions(riser, tread, nosing);
    const resultDiv = document.getElementById('stair-dimensions-result');
    
    if (resultDiv) {
      resultDiv.style.display = 'block';
      resultDiv.innerHTML = `
        <div style="padding: 12px; background: ${result.overallOk ? 'hsla(160, 100%, 45%, 0.1)' : 'hsla(0, 85%, 60%, 0.1)'}; border-radius: 8px; border: 1px solid ${result.overallOk ? 'hsla(160, 100%, 45%, 0.2)' : 'hsla(0, 85%, 60%, 0.2)'};">
          <div style="font-size: 0.8rem; color: var(--text-secondary);">Riser (O): ${result.riserOk ? '✓' : '✗'} ${result.riserHeight}mm</div>
          <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 4px;">Tread (A): ${result.treadOk ? '✓' : '✗'} ${result.treadDepth}mm</div>
          <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 4px;">2O + A: ${result.comfortOk ? '✓' : '✗'} ${result.comfortValue}mm</div>
          <div style="font-size: 0.9rem; font-weight: 800; color: ${result.overallOk ? 'var(--success-400)' : 'var(--danger-400)'}; margin-top: 8px;">Status: ${result.overallOk ? 'COMPLIANT' : 'NON-COMPLIANT'}</div>
        </div>
      `;
    }
    
    showSuccess(result.overallOk ? 'Dimensi tangga compliant' : 'Dimensi tangga tidak compliant!');
  };

  // Stair Capacity Calculator
  window._calculateStairCapacity = () => {
    const width = parseFloat(document.getElementById('egress-stair-width')?.value);
    const handrailCount = parseInt(document.getElementById('egress-handrail-count')?.value) || 0;
    
    if (!width || width <= 0) {
      showError('Masukkan lebar tangga yang valid');
      return;
    }
    
    const clearWidth = width - (handrailCount * 0.09);
    const capacity = calculateCapacityFromWidth(clearWidth, 'STAIR');
    const minWidth = 1.2;
    const isCompliant = clearWidth >= minWidth;
    
    const resultDiv = document.getElementById('stair-width-result');
    if (resultDiv) {
      resultDiv.style.display = 'block';
      resultDiv.innerHTML = `
        <div style="padding: 12px; background: ${isCompliant ? 'hsla(160, 100%, 45%, 0.1)' : 'hsla(0, 85%, 60%, 0.1)'}; border-radius: 8px; border: 1px solid ${isCompliant ? 'hsla(160, 100%, 45%, 0.2)' : 'hsla(0, 85%, 60%, 0.2)'};">
          <div style="font-size: 0.85rem; color: var(--text-secondary);">Lebar Efektif: <strong>${clearWidth.toFixed(2)} m</strong></div>
          <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 4px;">Kapasitas: <strong>${capacity} orang</strong></div>
          <div style="font-size: 0.9rem; font-weight: 800; color: ${isCompliant ? 'var(--success-400)' : 'var(--danger-400)'}; margin-top: 8px;">Status: ${isCompliant ? 'COMPLIANT' : 'NON-COMPLIANT'}</div>
        </div>
      `;
    }
    
    showSuccess(`Kapasitas tangga: ${capacity} orang`);
  };

  // Headroom Check
  window._checkHeadroom = () => {
    const headroom = parseFloat(document.getElementById('egress-headroom')?.value);
    const location = document.getElementById('egress-headroom-location')?.value;
    
    if (!headroom || headroom <= 0) {
      showError('Masukkan tinggi bebas yang valid');
      return;
    }
    
    const result = checkHeadroomClearance(headroom, location);
    const resultDiv = document.getElementById('headroom-result');
    
    if (resultDiv) {
      resultDiv.style.display = 'block';
      resultDiv.innerHTML = `
        <div style="padding: 12px; background: ${result.status === 'PASS' ? 'hsla(160, 100%, 45%, 0.1)' : 'hsla(0, 85%, 60%, 0.1)'}; border-radius: 8px; border: 1px solid ${result.status === 'PASS' ? 'hsla(160, 100%, 45%, 0.2)' : 'hsla(0, 85%, 60%, 0.2)'};">
          <div style="font-size: 0.85rem; color: var(--text-secondary);">Tinggi Terukur: <strong>${result.measured} mm</strong></div>
          <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 4px;">Minimum: <strong>${result.required} mm</strong></div>
          <div style="font-size: 0.9rem; font-weight: 800; color: ${result.status === 'PASS' ? 'var(--success-400)' : 'var(--danger-400)'}; margin-top: 8px;">Status: ${result.status}</div>
        </div>
      `;
    }
    
    showSuccess(result.status === 'PASS' ? 'Headroom compliant' : 'Headroom tidak mencukupi!');
  };

  // Emergency Lighting Check
  window._checkLuxLevel = () => {
    const luxLevel = parseFloat(document.getElementById('egress-lux-level')?.value);
    const locationType = document.getElementById('egress-lux-location')?.value;
    
    if (!luxLevel || luxLevel < 0) {
      showError('Masukkan lux level yang valid');
      return;
    }
    
    const result = checkEmergencyLighting(luxLevel, locationType);
    const resultDiv = document.getElementById('lux-result');
    
    if (resultDiv) {
      resultDiv.style.display = 'block';
      resultDiv.innerHTML = `
        <div style="padding: 12px; background: ${result.status === 'PASS' ? 'hsla(160, 100%, 45%, 0.1)' : 'hsla(0, 85%, 60%, 0.1)'}; border-radius: 8px; border: 1px solid ${result.status === 'PASS' ? 'hsla(160, 100%, 45%, 0.2)' : 'hsla(0, 85%, 60%, 0.2)'};">
          <div style="font-size: 0.85rem; color: var(--text-secondary);">Lux Terukur: <strong>${result.measured} lux</strong></div>
          <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 4px;">Minimum: <strong>${result.required} lux</strong></div>
          <div style="font-size: 0.9rem; font-weight: 800; color: ${result.status === 'PASS' ? 'var(--success-400)' : 'var(--danger-400)'}; margin-top: 8px;">Status: ${result.status}</div>
        </div>
      `;
    }
    
    showSuccess(result.status === 'PASS' ? 'Lux level compliant' : 'Lux level tidak mencukupi!');
  };

  // Exit Sign Check
  window._checkExitSign = () => {
    const visibilityDistance = parseFloat(document.getElementById('egress-visibility-distance')?.value);
    const signHeight = parseFloat(document.getElementById('egress-sign-height')?.value);
    const isPhotoluminescent = document.getElementById('egress-photoluminescent')?.checked;
    
    const maxDistance = 30;
    const maxHeight = 1800;
    
    const distanceOk = !visibilityDistance || visibilityDistance <= maxDistance;
    const heightOk = !signHeight || signHeight <= maxHeight;
    const isCompliant = distanceOk && heightOk;
    
    const resultDiv = document.getElementById('exit-sign-result');
    if (resultDiv) {
      resultDiv.style.display = 'block';
      resultDiv.innerHTML = `
        <div style="padding: 12px; background: ${isCompliant ? 'hsla(160, 100%, 45%, 0.1)' : 'hsla(0, 85%, 60%, 0.1)'}; border-radius: 8px; border: 1px solid ${isCompliant ? 'hsla(160, 100%, 45%, 0.2)' : 'hsla(0, 85%, 60%, 0.2)'};">
          <div style="font-size: 0.8rem; color: var(--text-secondary);">Jarak Pandang: ${distanceOk ? '✓' : '✗'} ${visibilityDistance}m</div>
          <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 4px;">Tinggi Sign: ${heightOk ? '✓' : '✗'} ${signHeight}mm</div>
          <div style="font-size: 0.9rem; font-weight: 800; color: ${isCompliant ? 'var(--success-400)' : 'var(--danger-400)'}; margin-top: 8px;">Status: ${isCompliant ? 'COMPLIANT' : 'NON-COMPLIANT'}</div>
        </div>
      `;
    }
    
    showSuccess(isCompliant ? 'Exit sign compliant' : 'Exit sign tidak compliant!');
  };

  // Smoke Zone Check
  window._checkSmokeZone = () => {
    const area = parseFloat(document.getElementById('egress-smoke-area')?.value);
    const smokeLayerHeight = parseFloat(document.getElementById('egress-smoke-height')?.value);
    
    if (!area || area <= 0) {
      showError('Masukkan luas zona yang valid');
      return;
    }
    
    const result = checkSmokeZone(area, smokeLayerHeight || 2.5);
    const resultDiv = document.getElementById('smoke-zone-result');
    
    if (resultDiv) {
      resultDiv.style.display = 'block';
      resultDiv.innerHTML = `
        <div style="padding: 12px; background: ${result.overallOk ? 'hsla(160, 100%, 45%, 0.1)' : 'hsla(0, 85%, 60%, 0.1)'}; border-radius: 8px; border: 1px solid ${result.overallOk ? 'hsla(160, 100%, 45%, 0.2)' : 'hsla(0, 85%, 60%, 0.2)'};">
          <div style="font-size: 0.8rem; color: var(--text-secondary);">Luas: ${result.areaOk ? '✓' : '✗'} ${result.area}m²</div>
          <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 4px;">Smoke Layer: ${result.smokeLayerOk ? '✓' : '✗'} ${result.smokeLayerHeight}m</div>
          <div style="font-size: 0.9rem; font-weight: 800; color: ${result.overallOk ? 'var(--success-400)' : 'var(--danger-400)'}; margin-top: 8px;">Status: ${result.overallOk ? 'COMPLIANT' : 'NON-COMPLIANT'}</div>
        </div>
      `;
    }
    
    showSuccess(result.overallOk ? 'Smoke zone compliant' : 'Smoke zone tidak compliant!');
  };

  // Pressurization Check
  window._checkPressurization = () => {
    const pressureDiff = parseFloat(document.getElementById('egress-pressure-diff')?.value);
    const escapeVelocity = parseFloat(document.getElementById('egress-escape-velocity')?.value);
    
    const pressureOk = pressureDiff >= 25 && pressureDiff <= 50;
    const velocityOk = escapeVelocity >= 2.5;
    const isCompliant = pressureOk && velocityOk;
    
    const resultDiv = document.getElementById('pressurization-result');
    if (resultDiv) {
      resultDiv.style.display = 'block';
      resultDiv.innerHTML = `
        <div style="padding: 12px; background: ${isCompliant ? 'hsla(160, 100%, 45%, 0.1)' : 'hsla(0, 85%, 60%, 0.1)'}; border-radius: 8px; border: 1px solid ${isCompliant ? 'hsla(160, 100%, 45%, 0.2)' : 'hsla(0, 85%, 60%, 0.2)'};">
          <div style="font-size: 0.8rem; color: var(--text-secondary);">Pressure: ${pressureOk ? '✓' : '✗'} ${pressureDiff} Pa</div>
          <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 4px;">Velocity: ${velocityOk ? '✓' : '✗'} ${escapeVelocity} m/s</div>
          <div style="font-size: 0.9rem; font-weight: 800; color: ${isCompliant ? 'var(--success-400)' : 'var(--danger-400)'}; margin-top: 8px;">Status: ${isCompliant ? 'COMPLIANT' : 'NON-COMPLIANT'}</div>
        </div>
      `;
    }
    
    showSuccess(isCompliant ? 'Pressurization compliant' : 'Pressurization tidak compliant!');
  };

  // Refuge Area Calculator
  window._calculateRefugeArea = () => {
    const occupantLoad = parseInt(document.getElementById('egress-refuge-occupant')?.value);
    const providedArea = parseFloat(document.getElementById('egress-refuge-area')?.value);
    
    if (!occupantLoad || !providedArea || occupantLoad <= 0 || providedArea <= 0) {
      showError('Masukkan nilai yang valid');
      return;
    }
    
    const result = calculateRefugeArea(occupantLoad, providedArea);
    const resultDiv = document.getElementById('refuge-area-result');
    
    if (resultDiv) {
      resultDiv.style.display = 'block';
      resultDiv.innerHTML = `
        <div style="padding: 12px; background: ${result.status === 'PASS' ? 'hsla(160, 100%, 45%, 0.1)' : 'hsla(0, 85%, 60%, 0.1)'}; border-radius: 8px; border: 1px solid ${result.status === 'PASS' ? 'hsla(160, 100%, 45%, 0.2)' : 'hsla(0, 85%, 60%, 0.2)'};">
          <div style="font-size: 0.85rem; color: var(--text-secondary);">Luas Dibutuhkan: <strong>${result.requiredArea} m²</strong></div>
          <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 4px;">Luas Tersedia: <strong>${result.providedArea} m²</strong></div>
          <div style="font-size: 0.9rem; font-weight: 800; color: ${result.status === 'PASS' ? 'var(--success-400)' : 'var(--danger-400)'}; margin-top: 8px;">Status: ${result.status}</div>
        </div>
      `;
    }
    
    showSuccess(result.status === 'PASS' ? 'Refuge area mencukupi' : 'Refuge area tidak mencukupi!');
  };

  // RSET Calculator
  window._calculateRSET = () => {
    const distance = parseFloat(document.getElementById('egress-rset-distance')?.value);
    const pathType = document.getElementById('egress-rset-path')?.value;
    
    if (!distance || distance <= 0) {
      showError('Masukkan jarak yang valid');
      return;
    }
    
    const result = calculateRSET(distance, pathType);
    const resultDiv = document.getElementById('rset-result');
    
    if (resultDiv) {
      resultDiv.style.display = 'block';
      resultDiv.innerHTML = `
        <div style="padding: 12px; background: hsla(220, 95%, 52%, 0.1); border-radius: 8px; border: 1px solid hsla(220, 95%, 52%, 0.2);">
          <div style="font-size: 0.8rem; color: var(--text-secondary);">Travel Time: <strong>${result.travelTime} detik</strong></div>
          <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 4px;">RSET Total: <strong>${result.rset} detik</strong></div>
        </div>
      `;
    }
    
    showSuccess(`RSET: ${result.rset} detik`);
  };

  // Compliance Score Calculator
  window._calculateComplianceScore = () => {
    const params = { exitNumberOk: true, travelDistanceOk: true, widthCapacityOk: true, stairProtectionOk: true, lightingSignOk: true };
    const result = calculateEgressComplianceScore(params);
    showSuccess(`Compliance Score: ${result.score}/100`);
  };

  // Stair Enclosure Check
  window._checkStairEnclosure = () => {
    const enclosureType = document.getElementById('egress-enclosure-type')?.value;
    const pressure = parseFloat(document.getElementById('egress-pressure')?.value);
    
    const isPressurized = enclosureType === 'PRESSURIZED' || enclosureType === 'SMOKE_PROOF';
    const pressureOk = !isPressurized || (pressure >= 25 && pressure <= 50);
    const isCompliant = enclosureType !== 'STANDARD' && pressureOk;
    
    showSuccess(isCompliant ? 'Stair enclosure compliant' : 'Stair enclosure tidak compliant!');
  };
}
