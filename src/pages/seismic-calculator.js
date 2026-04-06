/**
 * SEISMIC CALCULATOR PAGE
 * SNI 1726:2019 Seismic Parameter Calculator
 */

import { 
  calculateSeismicParameters, 
  generateResponseSpectrum,
  PUSGEN_DATA,
  SITE_CLASSES 
} from '../lib/seismic-calculator.js';

import { showSuccess, showInfo } from '../components/toast.js';

let spectrumChart = null;
let lastResult = null;

export async function seismicCalculatorPage(params = {}) {
  const root = document.getElementById('page-root');
  if (!root) return '';
  
  root.innerHTML = `
    <div id="seismic-page" style="padding: 24px;">
      <div class="page-header" style="margin-bottom: 24px;">
        <h1 class="page-title"><i class="fas fa-earthquake text-brand"></i> Seismic Analysis Calculator</h1>
        <p class="text-secondary">Kalkulator parameter gempa berdasarkan SNI 1726:2019 & ASCE 41-17</p>
      </div>

      <div class="grid-2-1" style="gap: 24px;">
        <!-- Left: Input Panel -->
        <div>
          <div class="card" style="margin-bottom: 24px;">
            <div class="card-title"><i class="fas fa-sliders-h"></i> Parameter Input</div>
            
            <!-- Quick Select Region -->
            <div style="margin-bottom: 20px;">
              <label style="font-size: 0.8rem; color: var(--text-tertiary); display: block; margin-bottom: 8px;">
                Cepat: Pilih Wilayah (PuSGeN)
              </label>
              <select id="region-select" class="form-select" style="width: 100%; margin-bottom: 8px;">
                <option value="">-- Pilih Wilayah --</option>
                ${Object.entries(PUSGEN_DATA).map(([key, data]) => `
                  <option value="${key}">${data.region} (Ss=${data.Ss}, S1=${data.S1})</option>
                `).join('')}
              </select>
              <button class="btn btn-secondary btn-sm" onclick="window._applyRegion()" style="width: 100%;">
                <i class="fas fa-map-marker-alt"></i> Terapkan Parameter Wilayah
              </button>
            </div>

            <div style="border-top: 1px solid var(--border-subtle); padding-top: 20px; margin-bottom: 20px;">
              <div style="font-size: 0.75rem; color: var(--text-tertiary); text-align: center; margin-bottom: 12px;">
                atau input manual
              </div>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
                <div>
                  <label style="font-size: 0.8rem; color: var(--text-tertiary); display: block; margin-bottom: 4px;">
                    Ss (g) - Short Period
                  </label>
                  <input type="number" id="input-ss" class="form-input" placeholder="0.00" step="0.01" min="0" max="3">
                </div>
                <div>
                  <label style="font-size: 0.8rem; color: var(--text-tertiary); display: block; margin-bottom: 4px;">
                    S1 (g) - 1 Second
                  </label>
                  <input type="number" id="input-s1" class="form-input" placeholder="0.00" step="0.01" min="0" max="3">
                </div>
              </div>

              <div style="margin-bottom: 16px;">
                <label style="font-size: 0.8rem; color: var(--text-tertiary); display: block; margin-bottom: 4px;">
                  Site Class (Kelas Situs)
                </label>
                <select id="input-site-class" class="form-select" style="width: 100%;">
                  ${Object.entries(SITE_CLASSES).map(([code, data]) => `
                    <option value="${code}">${code} - ${data.name} (${data.description})</option>
                  `).join('')}
                </select>
              </div>
            </div>

            <button class="btn btn-primary" onclick="window._calculateSeismic()" style="width: 100%;">
              <i class="fas fa-calculator"></i> Hitung Parameter Gempa
            </button>
          </div>

          <!-- Reference Tables -->
          <div class="card">
            <div class="card-title"><i class="fas fa-table"></i> Tabel Referensi SNI 1726:2019</div>
            <div style="font-size: 0.8rem; line-height: 1.8; color: var(--text-secondary);">
              <p><strong>Tabel 6 - Faktor Fa:</strong></p>
              <ul style="margin-left: 16px; margin-bottom: 12px;">
                <li>SA, SB: Fa = 1.0</li>
                <li>SC: Fa = 1.2 - 1.0 (Ss 0.25-1.5+)</li>
                <li>SD: Fa = 1.6 - 1.0 (Ss 0.25-1.5+)</li>
                <li>SE: Fa = 2.5 - 0.9 (Ss 0.25-1.5+)</li>
              </ul>
              <p><strong>Tabel 7 - Faktor Fv:</strong></p>
              <ul style="margin-left: 16px;">
                <li>SA, SB: Fv = 0.8</li>
                <li>SC: Fv = 1.5 - 1.0 (S1 0.1-0.6+)</li>
                <li>SD: Fv = 2.0 - 1.0 (S1 0.1-0.6+)</li>
                <li>SE: Fv = 3.5 - 1.0 (S1 0.1-0.6+)</li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Right: Results Panel -->
        <div>
          <div id="result-card" class="card" style="display: none; margin-bottom: 24px;">
            <div class="card-title"><i class="fas fa-chart-bar"></i> Hasil Perhitungan</div>
            <div id="result-content"></div>
          </div>

          <!-- Spectrum Plot -->
          <div id="spectrum-card" class="card" style="display: none;">
            <div class="card-title" style="display: flex; justify-content: space-between; align-items: center;">
              <span><i class="fas fa-chart-line"></i> Spektrum Respons Desain</span>
              <button class="btn btn-xs btn-ghost" onclick="window._exportSpectrum()">
                <i class="fas fa-download"></i>
              </button>
            </div>
            <div id="spectrum-plot" style="height: 350px; background: hsla(220, 20%, 100%, 0.03); border-radius: 8px;"></div>
            <div style="display: flex; justify-content: center; gap: 16px; margin-top: 12px; font-size: 0.75rem;">
              <span style="display: flex; align-items: center; gap: 6px;">
                <div style="width: 12px; height: 3px; background: #3b82f6;"></div> Sa (g)
              </span>
              <span style="display: flex; align-items: center; gap: 6px;">
                <div style="width: 12px; height: 3px; background: #ef4444; border: 1px dashed;"></div> Demand
              </span>
            </div>
          </div>

          <!-- Initial empty state -->
          <div id="empty-state" class="card" style="text-align: center; padding: 48px 24px;">
            <i class="fas fa-calculator" style="font-size: 3rem; color: var(--text-tertiary); margin-bottom: 16px; opacity: 0.5;"></i>
            <p style="color: var(--text-tertiary);">Input parameter untuk melihat hasil perhitungan seismik dan spektrum respons</p>
          </div>
        </div>
      </div>
    </div>
  `;

  setupGlobalFunctions();
  
  return root.innerHTML;
}

function setupGlobalFunctions() {
  window._applyRegion = () => {
    const regionKey = document.getElementById('region-select')?.value;
    if (!regionKey) {
      showInfo('Pilih wilayah terlebih dahulu');
      return;
    }
    
    const region = PUSGEN_DATA[regionKey];
    if (region) {
      document.getElementById('input-ss').value = region.Ss;
      document.getElementById('input-s1').value = region.S1;
      showSuccess(`Parameter ${region.region} diterapkan`);
    }
  };
  
  window._calculateSeismic = () => {
    const Ss = parseFloat(document.getElementById('input-ss')?.value);
    const S1 = parseFloat(document.getElementById('input-s1')?.value);
    const siteClass = document.getElementById('input-site-class')?.value || 'SD';
    
    if (!Ss || !S1) {
      showInfo('Masukkan nilai Ss dan S1');
      return;
    }
    
    const result = calculateSeismicParameters(Ss, S1, siteClass);
    lastResult = result;
    
    displayResults(result);
    plotSpectrum(result);
    
    // Hide empty state, show results
    document.getElementById('empty-state').style.display = 'none';
    document.getElementById('result-card').style.display = 'block';
    document.getElementById('spectrum-card').style.display = 'block';
  };
  
  window._exportSpectrum = () => {
    if (!lastResult) return;
    
    const csv = [
      ['T (s)', 'Sa (g)'],
      ...lastResult.spectrum.map(p => [p.T, p.Sa])
    ].map(r => r.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Spectrum_${lastResult.input.siteClass}_Ss${lastResult.input.Ss}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };
}

function displayResults(result) {
  const content = document.getElementById('result-content');
  if (!content) return;
  
  const { design, site, category, periodParams } = result;
  
  content.innerHTML = `
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
      <div style="text-align: center; padding: 16px; background: var(--bg-subtle); border-radius: 8px;">
        <div style="font-size: 2rem; font-weight: 700; color: var(--brand-400);">${design.SDS}</div>
        <div class="text-xs text-tertiary">SDS (g)</div>
      </div>
      <div style="text-align: center; padding: 16px; background: var(--bg-subtle); border-radius: 8px;">
        <div style="font-size: 2rem; font-weight: 700; color: var(--brand-400);">${design.SD1}</div>
        <div class="text-xs text-tertiary">SD1 (g)</div>
      </div>
    </div>
    
    <div style="padding: 16px; background: ${category.description.color}20; border: 1px solid ${category.description.color}40; border-radius: 8px; margin-bottom: 16px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <span style="font-weight: 700; color: ${category.description.color}; font-size: 1.1rem;">
          Level Seismisitas: ${category.seismicity}
        </span>
        <span style="padding: 4px 12px; background: ${category.description.color}; color: white; border-radius: 4px; font-size: 0.8rem; font-weight: 700;">
          SDC ${category.sdc}
        </span>
      </div>
      <div style="font-size: 0.85rem; color: var(--text-secondary);">
        ${category.description.description}
      </div>
    </div>
    
    <div style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.8;">
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
        <div><strong>Fa:</strong> ${site.Fa}</div>
        <div><strong>Fv:</strong> ${site.Fv}</div>
        <div><strong>SMS:</strong> ${result.max.SMS} g</div>
        <div><strong>SM1:</strong> ${result.max.SM1} g</div>
        <div><strong>T0:</strong> ${periodParams.T0.toFixed(3)} s</div>
        <div><strong>Ts:</strong> ${periodParams.Ts.toFixed(3)} s</div>
      </div>
    </div>
  `;
}

function plotSpectrum(result) {
  const container = document.getElementById('spectrum-plot');
  if (!container) return;
  
  const spectrum = generateResponseSpectrum(result.design.SDS, result.design.SD1);
  
  // Generate SVG
  const width = container.clientWidth || 500;
  const height = 350;
  const margin = { top: 20, right: 20, bottom: 40, left: 50 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;
  
  const maxT = 6;
  const maxSa = Math.max(...spectrum.map(p => p.Sa)) * 1.1;
  
  const xScale = (t) => (t / maxT) * innerWidth;
  const yScale = (sa) => innerHeight - (sa / maxSa) * innerHeight;
  
  const pathData = spectrum.map((p, i) => 
    `${i === 0 ? 'M' : 'L'} ${xScale(p.T)} ${yScale(p.Sa)}`
  ).join(' ');
  
  // Mark key points
  const T0 = result.periodParams.T0;
  const Ts = result.periodParams.Ts;
  
  container.innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" style="width: 100%; height: 100%;">
      <defs>
        <linearGradient id="spectrumGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:hsla(220, 95%, 52%, 0.3)"/>
          <stop offset="100%" style="stop-color:hsla(220, 95%, 52%, 0.05)"/>
        </linearGradient>
      </defs>
      
      <g transform="translate(${margin.left}, ${margin.top})">
        <!-- Grid -->
        ${[0, 1, 2, 3, 4, 5, 6].map(t => `
          <line x1="${xScale(t)}" y1="0" x2="${xScale(t)}" y2="${innerHeight}" 
                stroke="hsla(220, 20%, 100%, 0.1)" stroke-dasharray="2,2"/>
          <text x="${xScale(t)}" y="${innerHeight + 20}" 
                fill="hsla(220, 20%, 100%, 0.5)" font-size="10" text-anchor="middle">${t}s</text>
        `).join('')}
        
        ${[0, 0.2, 0.4, 0.6, 0.8, 1.0].map((s, i) => {
          const sa = s * maxSa;
          return `
            <line x1="0" y1="${yScale(sa)}" x2="${innerWidth}" y2="${yScale(sa)}" 
                  stroke="hsla(220, 20%, 100%, 0.1)" stroke-dasharray="2,2"/>
            <text x="-10" y="${yScale(sa) + 4}" 
                  fill="hsla(220, 20%, 100%, 0.5)" font-size="10" text-anchor="end">${sa.toFixed(2)}</text>
          `;
        }).join('')}
        
        <!-- Axes -->
        <line x1="0" y1="${innerHeight}" x2="${innerWidth}" y2="${innerHeight}" 
              stroke="hsla(220, 20%, 100%, 0.3)" stroke-width="2"/>
        <line x1="0" y1="0" x2="0" y2="${innerHeight}" 
              stroke="hsla(220, 20%, 100%, 0.3)" stroke-width="2"/>
        
        <!-- Fill area -->
        <path d="${pathData} L ${innerWidth} ${innerHeight} L 0 ${innerHeight} Z" 
              fill="url(#spectrumGrad)"/>
        
        <!-- Spectrum line -->
        <path d="${pathData}" fill="none" stroke="#3b82f6" stroke-width="2"/>
        
        <!-- Key points -->
        <line x1="${xScale(T0)}" y1="0" x2="${xScale(T0)}" y2="${innerHeight}" 
              stroke="#eab308" stroke-width="1" stroke-dasharray="4,4"/>
        <text x="${xScale(T0)}" y="10" fill="#eab308" font-size="9" text-anchor="middle">T0</text>
        
        <line x1="${xScale(Ts)}" y1="0" x2="${xScale(Ts)}" y2="${innerHeight}" 
              stroke="#22c55e" stroke-width="1" stroke-dasharray="4,4"/>
        <text x="${xScale(Ts)}" y="10" fill="#22c55e" font-size="9" text-anchor="middle">Ts</text>
      </g>
    </svg>
  `;
}
