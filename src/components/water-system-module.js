// ============================================================
// WATER SYSTEM MODULE - Proyek Detail Card Integration
// Card untuk ringkasan Sistem Air Bersih di halaman proyek-detail
// ============================================================

import { supabase } from '../lib/supabase.js';
import { navigate } from '../lib/router.js';

export function renderWaterSystemCard(proyek, summary = {}) {
  const hasData = summary && (summary.evaluation || summary.network);
  const score = summary?.evaluation?.score || 0;
  
  const statusColors = {
    compliant: { bg: 'rgba(16, 185, 129, 0.1)', color: '#10b981', icon: 'fa-check-circle' },
    partial: { bg: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', icon: 'fa-exclamation-circle' },
    none: { bg: 'rgba(100, 116, 139, 0.1)', color: '#64748b', icon: 'fa-water' }
  };

  const status = score >= 80 ? 'compliant' : score >= 60 ? 'partial' : hasData ? 'partial' : 'none';
  const colors = statusColors[status];

  return `
    <div class="card-quartz clickable water-system-card" 
         id="water-system-card"
         onclick="window.navigate('water-inspection', {id:'${proyek.id}'})"
         style="padding: var(--space-6); position: relative; overflow: hidden;">
      
      <!-- Background Decoration -->
      <div style="position: absolute; right: -30px; top: -30px; width: 120px; height: 120px; 
                  background: radial-gradient(circle, ${colors.color}15 0%, transparent 70%); 
                  pointer-events: none;"></div>

      <div class="flex-between" style="margin-bottom: 20px; position: relative; z-index: 1;">
        <div style="width: 48px; height: 48px; border-radius: 14px; 
                    background: ${colors.bg}; 
                    display: flex; align-items: center; justify-content: center; 
                    color: ${colors.color}; border: 1px solid ${colors.color}30;">
          <i class="fas ${colors.icon}" style="font-size: 1.4rem;"></i>
        </div>
        <div style="font-family: var(--font-mono); font-size: 11px; font-weight: 700; 
                    color: ${colors.color}; text-transform: uppercase; letter-spacing: 1px;
                    background: ${colors.bg}; padding: 4px 10px; border-radius: 20px;">
          ${score > 0 ? score + '%' : 'BELUM DIEVALUASI'}
        </div>
      </div>

      <h3 style="font-family: 'Outfit', sans-serif; font-weight: 800; font-size: 1.1rem; 
                 color: var(--text-primary); margin-bottom: 4px; position: relative; z-index: 1;">
        Sistem Air Bersih
      </h3>
      <p style="font-size: 0.75rem; color: var(--text-tertiary); line-height: 1.5; 
                margin-bottom: 16px; position: relative; z-index: 1;">
        Hydraulic network analysis & compliance Pasal 224 ayat (2) Permen 14/2017
      </p>

      ${hasData ? `
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; 
                    margin-top: 16px; position: relative; z-index: 1;">
          <div style="text-align: center; padding: 12px 8px; 
                      background: rgba(15, 23, 42, 0.4); border-radius: 10px;
                      border: 1px solid rgba(59, 130, 246, 0.1);">
            <div style="font-size: 18px; font-weight: 700; color: #3b82f6;">
              ${summary.network?.nodes?.length || summary.simulation?.nodes?.length || '-'}
            </div>
            <div style="font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">
              Nodes
            </div>
          </div>
          <div style="text-align: center; padding: 12px 8px; 
                      background: rgba(15, 23, 42, 0.4); border-radius: 10px;
                      border: 1px solid rgba(59, 130, 246, 0.1);">
            <div style="font-size: 18px; font-weight: 700; color: #3b82f6;">
              ${summary.network?.pipes?.length || summary.simulation?.pipes?.length || '-'}
            </div>
            <div style="font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">
              Pipes
            </div>
          </div>
          <div style="text-align: center; padding: 12px 8px; 
                      background: rgba(15, 23, 42, 0.4); border-radius: 10px;
                      border: 1px solid rgba(59, 130, 246, 0.1);">
            <div style="font-size: 18px; font-weight: 700; color: #3b82f6;">
              ${summary.simulation?.summary?.totalDemand ? parseFloat(summary.simulation.summary.totalDemand).toFixed(1) : '-'}
            </div>
            <div style="font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">
              L/s
            </div>
          </div>
        </div>

        ${summary.evaluation ? `
          <div style="margin-top: 16px; padding: 12px; 
                      background: ${score >= 80 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)'}; 
                      border-radius: 10px; border-left: 3px solid ${score >= 80 ? '#10b981' : '#f59e0b'};">
            <div style="font-size: 11px; color: ${score >= 80 ? '#10b981' : '#f59e0b'}; font-weight: 600;">
              ${score >= 80 ? '✓ COMPLIANT - Memenuhi Standar' : '⚠️ Perlu Perbaikan'}
            </div>
            <div style="font-size: 10px; color: #64748b; margin-top: 4px;">
              Pasal 224 ayat (2) • ${summary.evaluation.timestamp ? new Date(summary.evaluation.timestamp).toLocaleDateString('id-ID') : ''}
            </div>
          </div>
        ` : ''}

      ` : `
        <div style="text-align: center; padding: 24px; margin-top: 8px;
                    background: rgba(15, 23, 42, 0.4); border-radius: 12px;
                    border: 1px dashed rgba(100, 116, 139, 0.3);">
          <div style="font-size: 32px; margin-bottom: 8px; opacity: 0.5;">💧</div>
          <div style="font-size: 12px; color: #64748b;">
            Klik untuk mulai analisis<br>sistem air bersih
          </div>
        </div>
      `}

      <div style="margin-top: 16px; display: flex; gap: 8px; position: relative; z-index: 1;">
        <button class="btn btn-sm btn-primary" style="flex: 1; font-size: 11px;"
                onclick="event.stopPropagation(); window.navigate('water-inspection', {id:'${proyek.id}', tab:'demand'})">
          <i class="fas fa-calculator"></i> Kalkulator
        </button>
        <button class="btn btn-sm btn-secondary" style="flex: 1; font-size: 11px;"
                onclick="event.stopPropagation(); window.navigate('water-inspection', {id:'${proyek.id}', tab:'network'})">
          <i class="fas fa-network-wired"></i> Jaringan
        </button>
      </div>
    </div>
  `;
}

export function initWaterSystemHandlers() {
  // Add hover effects
  const card = document.getElementById('water-system-card');
  if (card) {
    card.addEventListener('mouseenter', () => {
      card.style.transform = 'translateY(-2px)';
      card.style.boxShadow = '0 8px 30px rgba(59, 130, 246, 0.15)';
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      card.style.boxShadow = '';
    });
  }
}

export async function fetchWaterSystemSummary(projectId) {
  if (!projectId) return null;
  
  try {
    const { data, error } = await supabase
      .from('water_systems')
      .select('*')
      .eq('project_id', projectId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;

    return {
      network: data.network_data,
      simulation: data.simulation_results,
      evaluation: data.evaluation_results,
      demand: data.demand_calculation,
      lastUpdated: data.updated_at
    };
  } catch (err) {
    console.error('Error fetching water system:', err);
    return null;
  }
}
