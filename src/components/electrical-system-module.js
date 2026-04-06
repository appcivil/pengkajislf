/**
 * SISTEM KELISTRIKAN MODULE
 * Electrical System Inspection Component
 * Integrated with PUIL 2020, SNI 0225:2011, IEC 60364
 * UI Style: Presidential Quartz (matching struktur-bangunan-module.js)
 */

import { supabase } from '../lib/supabase.js';
import { navigate } from '../lib/router.js';
import { showSuccess, showError, showInfo } from '../components/toast.js';

/**
 * Fetch electrical system summary for a project
 */
export async function fetchElectricalSummary(proyekId) {
  try {
    // Get panels count
    const { data: panels, error: panelsError } = await supabase
      .from('electrical_panels')
      .select('*')
      .eq('project_id', proyekId);
    
    if (panelsError) throw panelsError;
    
    const totalPanels = panels?.length || 0;
    
    // Get measurements count
    const { data: measurements, error: measError } = await supabase
      .from('electrical_measurements')
      .select('*, panel:panel_id(type, mcb_rating, ambient_temp)')
      .in('panel_id', panels?.map(p => p.id) || []);
    
    if (measError) throw measError;
    
    // Get thermal images count
    const { data: thermalImages, error: thermalError } = await supabase
      .from('electrical_thermal_images')
      .select('*')
      .in('panel_id', panels?.map(p => p.id) || []);
    
    if (thermalError) throw thermalError;
    
    // Calculate summary stats
    const safePanels = measurements?.filter(m => m.loading_status === 'SAFE').length || 0;
    const warningPanels = measurements?.filter(m => m.loading_status === 'WARNING').length || 0;
    const overloadPanels = measurements?.filter(m => m.loading_status === 'OVERLOAD').length || 0;
    
    // Thermal stats
    const criticalHotspots = thermalImages?.filter(t => t.temp_max > 70).length || 0;
    const warningHotspots = thermalImages?.filter(t => t.temp_max > 45 && t.temp_max <= 70).length || 0;
    
    return {
      totalPanels,
      totalMeasurements: measurements?.length || 0,
      totalThermalImages: thermalImages?.length || 0,
      safePanels,
      warningPanels,
      overloadPanels,
      criticalHotspots,
      warningHotspots,
      panels: panels || [],
      latestMeasurement: measurements?.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0] || null
    };
  } catch (error) {
    console.error('Error fetching electrical summary:', error);
    return {
      totalPanels: 0,
      totalMeasurements: 0,
      totalThermalImages: 0,
      safePanels: 0,
      warningPanels: 0,
      overloadPanels: 0,
      criticalHotspots: 0,
      warningHotspots: 0,
      panels: [],
      latestMeasurement: null
    };
  }
}

/**
 * Render Electrical System Module Card
 */
export function renderElectricalSystemCard(p, summary = {}) {
  const hasData = summary.totalPanels > 0;
  const statusColor = summary.overloadPanels > 0 ? 'var(--danger-400)' : 
                     summary.warningPanels > 0 ? 'var(--warning-400)' : 
                     hasData ? 'var(--success-400)' : 'var(--text-tertiary)';
  
  const statusIcon = summary.overloadPanels > 0 ? 'fa-triangle-exclamation' : 
                    summary.warningPanels > 0 ? 'fa-exclamation-circle' : 
                    hasData ? 'fa-check-circle' : 'fa-circle-minus';
  
  const statusText = summary.overloadPanels > 0 ? 'OVERLOAD DETECTED' : 
                    summary.warningPanels > 0 ? 'WARNING' : 
                    hasData ? 'NORMAL' : 'NO DATA';
  
  return `
    <div class="card-quartz" id="electrical-system-card" style="padding: var(--space-6); grid-column: 1 / -1;">
      <div class="flex-between" style="margin-bottom: 20px;">
        <div style="display: flex; align-items: center; gap: 16px;">
          <div style="width: 48px; height: 48px; border-radius: 14px; background: hsla(220, 95%, 52%, 0.1); display: flex; align-items: center; justify-content: center; color: var(--brand-400);">
            <i class="fas fa-bolt" style="font-size: 1.4rem;"></i>
          </div>
          <div>
            <div style="font-family: var(--font-mono); font-size: 12px; font-weight: 800; color: var(--brand-400);">PHASE 02C</div>
            <h3 style="font-family: 'Outfit', sans-serif; font-weight: 800; font-size: 1.1rem; color: white; margin: 0;">Sistem Kelistrikan</h3>
          </div>
        </div>
        <div style="display: flex; gap: 8px; align-items: center;">
          <span class="badge" style="background: ${statusColor}20; color: ${statusColor}; border: 1px solid ${statusColor}40; font-size: 10px;">
            <i class="fas ${statusIcon}" style="margin-right: 6px;"></i>${statusText}
          </span>
          <span class="badge" style="background: hsla(220, 95%, 52%, 0.1); color: var(--brand-400); border: 1px solid hsla(220, 95%, 52%, 0.2); font-size: 10px;">
            <i class="fas fa-book" style="margin-right: 6px;"></i>PUIL 2020
          </span>
        </div>
      </div>
      
      <p style="font-size: 0.75rem; color: var(--text-tertiary); line-height: 1.5; margin-bottom: 20px;">
        Evaluasi sistem kelistrikan berdasarkan PUIL 2020, SNI 0225:2011, IEC 60364. Meliputi analisis pembebanan, thermal imaging, proteksi, dan compliance check.
      </p>

      ${hasData ? `
        <!-- Stats Grid -->
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px;">
          <div style="background: hsla(220, 20%, 100%, 0.02); border: 1px solid hsla(220, 20%, 100%, 0.05); border-radius: 12px; padding: 16px; text-align: center;">
            <div style="font-family: var(--font-mono); font-size: 24px; font-weight: 800; color: white;">${summary.totalPanels}</div>
            <div style="font-size: 10px; color: var(--text-tertiary); margin-top: 4px;">PANEL</div>
          </div>
          <div style="background: hsla(220, 20%, 100%, 0.02); border: 1px solid hsla(220, 20%, 100%, 0.05); border-radius: 12px; padding: 16px; text-align: center;">
            <div style="font-family: var(--font-mono); font-size: 24px; font-weight: 800; color: ${summary.overloadPanels > 0 ? 'var(--danger-400)' : 'var(--success-400)'};">${summary.overloadPanels > 0 ? summary.overloadPanels : summary.safePanels}</div>
            <div style="font-size: 10px; color: var(--text-tertiary); margin-top: 4px;">${summary.overloadPanels > 0 ? 'OVERLOAD' : 'SAFE'}</div>
          </div>
          <div style="background: hsla(220, 20%, 100%, 0.02); border: 1px solid hsla(220, 20%, 100%, 0.05); border-radius: 12px; padding: 16px; text-align: center;">
            <div style="font-family: var(--font-mono); font-size: 24px; font-weight: 800; color: ${summary.criticalHotspots > 0 ? 'var(--danger-400)' : summary.warningHotspots > 0 ? 'var(--warning-400)' : 'var(--success-400)'};">${summary.criticalHotspots + summary.warningHotspots}</div>
            <div style="font-size: 10px; color: var(--text-tertiary); margin-top: 4px;">HOTSPOT</div>
          </div>
          <div style="background: hsla(220, 20%, 100%, 0.02); border: 1px solid hsla(220, 20%, 100%, 0.05); border-radius: 12px; padding: 16px; text-align: center;">
            <div style="font-family: var(--font-mono); font-size: 24px; font-weight: 800; color: white;">${summary.totalMeasurements}</div>
            <div style="font-size: 10px; color: var(--text-tertiary); margin-top: 4px;">MEASUREMENTS</div>
          </div>
        </div>
      ` : ''}

      <!-- Action Buttons -->
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;">
        <button class="btn-presidential" 
                style="width: 100%; height: 44px; border-radius: 12px; font-size: 10px; background: ${hasData ? 'var(--gradient-brand)' : 'var(--gradient-dark)'};"
                onclick="window._openElectricalInspection('${p.id}')">
          <i class="fas fa-ruler-combined" style="margin-right: 8px;"></i> ${hasData ? 'LANJUTKAN INSPEKSI' : 'MULAI INSPEKSI'}
        </button>
        ${hasData ? `
          <button class="btn btn-outline" 
                  style="width: 100%; height: 44px; border-radius: 12px; font-size: 10px; border-color: hsla(220, 95%, 52%, 0.2); color: white;"
                  onclick="window._viewElectricalReport('${p.id}')">
            <i class="fas fa-file-pdf" style="margin-right: 8px;"></i> LAPORAN
          </button>
          <button class="btn btn-outline" 
                  style="width: 100%; height: 44px; border-radius: 12px; font-size: 10px; border-color: hsla(45, 90%, 60%, 0.2); color: var(--gold-400);"
                  onclick="window._exportElectricalData('${p.id}')">
            <i class="fas fa-download" style="margin-right: 8px;"></i> EXPORT DATA
          </button>
        ` : `
          <button class="btn btn-outline" disabled
                  style="width: 100%; height: 44px; border-radius: 12px; font-size: 10px; border-color: hsla(220, 20%, 100%, 0.1); color: var(--text-tertiary); opacity: 0.5;">
            <i class="fas fa-file-pdf" style="margin-right: 8px;"></i> LAPORAN
          </button>
          <button class="btn btn-outline" disabled
                  style="width: 100%; height: 44px; border-radius: 12px; font-size: 10px; border-color: hsla(220, 20%, 100%, 0.1); color: var(--text-tertiary); opacity: 0.5;">
            <i class="fas fa-download" style="margin-right: 8px;"></i> EXPORT DATA
          </button>
        `}
      </div>

      ${summary.latestMeasurement ? `
        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid hsla(220, 20%, 100%, 0.05);">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="font-size: 11px; color: var(--text-tertiary);">
              <i class="fas fa-clock" style="margin-right: 6px;"></i>
              Pemeriksaan terakhir: ${new Date(summary.latestMeasurement.timestamp).toLocaleString('id-ID')}
            </div>
            <div style="font-size: 11px; color: var(--text-tertiary);">
              Panel: ${summary.latestMeasurement.panel?.type || '-'}
            </div>
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

/**
 * Initialize Electrical System Handlers
 */
export function initElectricalSystemHandlers(proyekId, summary = {}) {
  // Open Electrical Inspection Page
  window._openElectricalInspection = (id) => {
    navigate('electrical-inspection', { id });
  };

  // View Electrical Report (placeholder for now)
  window._viewElectricalReport = async (id) => {
    showInfo('Generating electrical inspection report...');
    try {
      // Import report generator
      const { generateElectricalReport } = await import('../lib/electrical-report-generator.js');
      const { formatReportData } = await import('../lib/electrical-report-generator.js');
      
      // Get fresh data
      const freshSummary = await fetchElectricalSummary(id);
      
      // Generate report
      const reportData = formatReportData(
        { name: 'Proyek SLF', location: '' },
        freshSummary.panels || [],
        { compliance: null, recommendations: [] }
      );
      
      generateElectricalReport(reportData);
      showSuccess('Laporan kelistrikan berhasil di-generate');
    } catch (error) {
      console.error('Error generating report:', error);
      showError('Gagal generate laporan: ' + error.message);
    }
  };

  // Export Electrical Data
  window._exportElectricalData = async (id) => {
    showInfo('Mengexport data kelistrikan...');
    try {
      // Get fresh data
      const freshSummary = await fetchElectricalSummary(id);
      
      // Prepare export data
      const exportData = {
        project_id: id,
        export_date: new Date().toISOString(),
        panels: freshSummary.panels || [],
        measurements: freshSummary.totalMeasurements || 0,
        thermal_images: freshSummary.totalThermalImages || 0,
        summary: {
          safe_panels: freshSummary.safePanels,
          warning_panels: freshSummary.warningPanels,
          overload_panels: freshSummary.overloadPanels,
          critical_hotspots: freshSummary.criticalHotspots,
          warning_hotspots: freshSummary.warningHotspots
        }
      };
      
      // Download as JSON
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `electrical_data_${id}_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      showSuccess('Data kelistrikan berhasil di-export');
    } catch (error) {
      console.error('Error exporting data:', error);
      showError('Gagal export data: ' + error.message);
    }
  };
}
