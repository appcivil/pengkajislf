/**
 * NDT CALCULATOR PAGE
 * UI for Schmidt Hammer, UPV, Core Drill, Rebar Scanner, Ultrasonic Thickness
 */

import { 
  analyzeSchmidtHammer, 
  analyzeUPV, 
  analyzeCoreDrill,
  evaluateSteelThickness,
  combinedNDTAnalysis
} from '../lib/ndt-calculators.js';

import { saveNDTTest, getNDTTestsByProject } from '../lib/local-data-manager.js';
import { showSuccess, showError } from '../components/toast.js';

let currentProyek = null;
let activeTest = 'schmidt';
let testHistory = [];

export async function ndtCalculatorPage(params = {}) {
  const root = document.getElementById('page-root');
  if (!root) return '';
  
  const proyekId = params.proyekId || params.id;
  if (proyekId) {
    const { supabase } = await import('../lib/supabase.js');
    const { data } = await supabase.from('proyek').select('*').eq('id', proyekId).single();
    currentProyek = data;
    
    // Load test history
    testHistory = await getNDTTestsByProject(proyekId);
  }
  
  root.innerHTML = `
    <div id="ndt-page" style="padding: 24px;">
      <div class="page-header" style="margin-bottom: 24px;">
        <div class="flex-between">
          <div>
            <h1 class="page-title"><i class="fas fa-microscope text-brand"></i> NDT/MDT Calculator</h1>
            <p class="text-secondary">Kalkulator pengujian material: Schmidt Hammer, UPV, Core Drill, dan lainnya</p>
          </div>
          ${currentProyek ? `
            <div style="text-align: right;">
              <div class="badge" style="background: var(--brand-bg); color: var(--brand-400);">
                <i class="fas fa-building"></i> ${currentProyek.nama_bangunan || 'Loading...'}
              </div>
            </div>
          ` : ''}
        </div>
      </div>

      <!-- Test Type Selection -->
      <div class="card" style="margin-bottom: 24px;">
        <div class="card-title">Pilih Jenis Pengujian</div>
        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
          <button class="btn ${activeTest === 'schmidt' ? 'btn-primary' : 'btn-secondary'} test-tab" data-test="schmidt">
            <i class="fas fa-hammer"></i> Schmidt Hammer
          </button>
          <button class="btn ${activeTest === 'upv' ? 'btn-primary' : 'btn-secondary'} test-tab" data-test="upv">
            <i class="fas fa-wave-square"></i> UPV
          </button>
          <button class="btn ${activeTest === 'core' ? 'btn-primary' : 'btn-secondary'} test-tab" data-test="core">
            <i class="fas fa-database"></i> Core Drill
          </button>
          <button class="btn ${activeTest === 'steel' ? 'btn-primary' : 'btn-secondary'} test-tab" data-test="steel">
            <i class="fas fa-ruler"></i> Ultrasonic Thickness
          </button>
          <button class="btn ${activeTest === 'combined' ? 'btn-primary' : 'btn-secondary'} test-tab" data-test="combined">
            <i class="fas fa-layer-group"></i> Combined Analysis
          </button>
        </div>
      </div>

      <div class="grid-2-1" style="gap: 24px;">
        <!-- Left: Calculator Form -->
        <div>
          <div id="calculator-panel" class="card" style="margin-bottom: 24px;">
            <!-- Calculator form rendered here -->
          </div>
          
          <!-- Test History -->
          <div class="card">
            <div class="card-title" style="display: flex; justify-content: space-between; align-items: center;">
              <span><i class="fas fa-history"></i> Riwayat Pengujian</span>
              <button class="btn btn-sm btn-ghost" onclick="window._exportNDTResults()">
                <i class="fas fa-download"></i> Export
              </button>
            </div>
            <div id="ndt-history" style="max-height: 300px; overflow-y: auto;">
              ${renderTestHistory()}
            </div>
          </div>
        </div>

        <!-- Right: Results & Standards -->
        <div>
          <div id="result-card" class="card" style="display: none; margin-bottom: 24px;">
            <div class="card-title"><i class="fas fa-chart-bar"></i> Hasil Analisis</div>
            <div id="result-content"></div>
            ${currentProyek ? `
              <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--border-subtle);">
                <button class="btn btn-primary" onclick="window._saveNDTResult()" style="width: 100%;">
                  <i class="fas fa-save"></i> Simpan ke Proyek
                </button>
              </div>
            ` : ''}
          </div>

          <div class="card">
            <div class="card-title"><i class="fas fa-info-circle"></i> Standar Referensi</div>
            <div class="text-sm" style="line-height: 1.8;">
              <p><strong>ASTM C805:</strong> Schmidt Hammer Test - Rebound Number</p>
              <p><strong>ASTM C597:</strong> UPV Test - Pulse Velocity</p>
              <p><strong>ASTM C42:</strong> Core Drill - Compressive Strength</p>
              <p><strong>SNI 2847:2019:</strong> Kekuatan beton minimum K-250 (20.75 MPa)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Setup tabs
  setupTabs();
  
  // Render initial calculator
  renderCalculator();
  
  // Setup global functions
  setupGlobalFunctions();
  
  return root.innerHTML;
}

function renderTestHistory() {
  if (!testHistory || testHistory.length === 0) {
    return '<div style="text-align: center; padding: 24px; color: var(--text-tertiary);">Belum ada data pengujian</div>';
  }
  
  return `
    <div style="display: flex; flex-direction: column; gap: 8px;">
      ${testHistory.slice(0, 10).map(test => `
        <div style="padding: 12px; background: var(--bg-subtle); border-radius: 6px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-weight: 600; font-size: 0.9rem; color: white;">${test.type}</div>
            <div style="font-size: 0.75rem; color: var(--text-tertiary);">
              ${test.location || 'No location'} • ${new Date(test.createdAt).toLocaleDateString('id-ID')}
            </div>
          </div>
          <div style="text-align: right;">
            <div style="font-weight: 700; color: var(--brand-400);">${test.resultValue || '-'}</div>
            <div style="font-size: 0.7rem; color: var(--text-tertiary);">${test.resultUnit || ''}</div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderCalculator() {
  const panel = document.getElementById('calculator-panel');
  if (!panel) return;
  
  switch(activeTest) {
    case 'schmidt':
      panel.innerHTML = renderSchmidtCalculator();
      break;
    case 'upv':
      panel.innerHTML = renderUPVCalculator();
      break;
    case 'core':
      panel.innerHTML = renderCoreDrillCalculator();
      break;
    case 'steel':
      panel.innerHTML = renderSteelThicknessCalculator();
      break;
    case 'combined':
      panel.innerHTML = renderCombinedCalculator();
      break;
  }
}

function renderSchmidtCalculator() {
  return `
    <div class="card-title"><i class="fas fa-hammer"></i> Schmidt Hammer Test (ASTM C805)</div>
    <div style="margin-bottom: 16px;">
      <label style="font-size: 0.8rem; color: var(--text-tertiary); display: block; margin-bottom: 4px;">Lokasi Pengujian</label>
      <input type="text" id="schmidt-location" class="form-input" placeholder="Contoh: Kolom Lantai 1 - K1.1" style="width: 100%;">
    </div>
    
    <div style="margin-bottom: 16px;">
      <label style="font-size: 0.8rem; color: var(--text-tertiary); display: block; margin-bottom: 4px;">Sudut Pukulan</label>
      <select id="schmidt-angle" class="form-select" style="width: 100%;">
        <option value="0">Horizontal (0°)</option>
        <option value="90">Ke atas (90°)</option>
        <option value="45">45° ke atas</option>
        <option value="-45">45° ke bawah</option>
        <option value="-90">Ke bawah (-90°)</option>
      </select>
    </div>

    <div style="margin-bottom: 16px;">
      <label style="font-size: 0.8rem; color: var(--text-tertiary); display: block; margin-bottom: 8px;">
        10 Nilai Pantul (Rebound Number)
      </label>
      <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px;">
        ${Array.from({ length: 10 }, (_, i) => `
          <input type="number" id="schmidt-rn-${i}" class="form-input schmidt-rn" 
                 placeholder="${i + 1}" min="0" max="100" 
                 style="text-align: center;">
        `).join('')}
      </div>
    </div>

    <button class="btn btn-primary" onclick="window._calculateSchmidt()" style="width: 100%;">
      <i class="fas fa-calculator"></i> Hitung fc'
    </button>
  `;
}

function renderUPVCalculator() {
  return `
    <div class="card-title"><i class="fas fa-wave-square"></i> UPV Test (ASTM C597)</div>
    <div style="margin-bottom: 16px;">
      <label style="font-size: 0.8rem; color: var(--text-tertiary); display: block; margin-bottom: 4px;">Lokasi Pengujian</label>
      <input type="text" id="upv-location" class="form-input" placeholder="Contoh: Balok Lantai 2 - B2.3" style="width: 100%;">
    </div>
    
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
      <div>
        <label style="font-size: 0.8rem; color: var(--text-tertiary); display: block; margin-bottom: 4px;">Waktu Tempuh (μs)</label>
        <input type="number" id="upv-time" class="form-input" placeholder="0.0" step="0.1">
      </div>
      <div>
        <label style="font-size: 0.8rem; color: var(--text-tertiary); display: block; margin-bottom: 4px;">Jarak Transduser (mm)</label>
        <input type="number" id="upv-distance" class="form-input" placeholder="0" step="10">
      </div>
    </div>

    <button class="btn btn-primary" onclick="window._calculateUPV()" style="width: 100%;">
      <i class="fas fa-calculator"></i> Hitung Kecepatan & Kualitas
    </button>
  `;
}

function renderCoreDrillCalculator() {
  return `
    <div class="card-title"><i class="fas fa-database"></i> Core Drill Test (ASTM C42)</div>
    <div style="margin-bottom: 16px;">
      <label style="font-size: 0.8rem; color: var(--text-tertiary); display: block; margin-bottom: 4px;">Lokasi Pengujian</label>
      <input type="text" id="core-location" class="form-input" placeholder="Contoh: Slab Lantai 3" style="width: 100%;">
    </div>
    
    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 16px;">
      <div>
        <label style="font-size: 0.8rem; color: var(--text-tertiary); display: block; margin-bottom: 4px;">Diameter (mm)</label>
        <input type="number" id="core-diameter" class="form-input" placeholder="100" value="100">
      </div>
      <div>
        <label style="font-size: 0.8rem; color: var(--text-tertiary); display: block; margin-bottom: 4px;">Tinggi (mm)</label>
        <input type="number" id="core-height" class="form-input" placeholder="200" value="200">
      </div>
      <div>
        <label style="font-size: 0.8rem; color: var(--text-tertiary); display: block; margin-bottom: 4px;">Beban Max (kN)</label>
        <input type="number" id="core-load" class="form-input" placeholder="0.0" step="0.1">
      </div>
    </div>

    <button class="btn btn-primary" onclick="window._calculateCoreDrill()" style="width: 100%;">
      <i class="fas fa-calculator"></i> Hitung Kuat Tekan
    </button>
  `;
}

function renderSteelThicknessCalculator() {
  return `
    <div class="card-title"><i class="fas fa-ruler"></i> Ultrasonic Thickness Gauge (UTG)</div>
    <div style="margin-bottom: 16px;">
      <label style="font-size: 0.8rem; color: var(--text-tertiary); display: block; margin-bottom: 4px;">Lokasi Pengujian</label>
      <input type="text" id="steel-location" class="form-input" placeholder="Contoh: Kolom Baja K1 - Flange" style="width: 100%;">
    </div>
    
    <div style="margin-bottom: 16px;">
      <label style="font-size: 0.8rem; color: var(--text-tertiary); display: block; margin-bottom: 4px;">Elemen</label>
      <select id="steel-element" class="form-select" style="width: 100%;">
        <option value="flange">Flange</option>
        <option value="web">Web</option>
      </select>
    </div>
    
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
      <div>
        <label style="font-size: 0.8rem; color: var(--text-tertiary); display: block; margin-bottom: 4px;">Tebal Nominal (mm)</label>
        <input type="number" id="steel-nominal" class="form-input" placeholder="0.0" step="0.1">
      </div>
      <div>
        <label style="font-size: 0.8rem; color: var(--text-tertiary); display: block; margin-bottom: 4px;">Tebal Terukur (mm)</label>
        <input type="number" id="steel-measured" class="form-input" placeholder="0.0" step="0.1">
      </div>
    </div>

    <button class="btn btn-primary" onclick="window._calculateSteel()" style="width: 100%;">
      <i class="fas fa-calculator"></i> Evaluasi Penipisan
    </button>
  `;
}

function renderCombinedCalculator() {
  return `
    <div class="card-title"><i class="fas fa-layer-group"></i> Combined NDT Analysis</div>
    <p style="font-size: 0.85rem; color: var(--text-tertiary); margin-bottom: 16px;">
      Analisis kombinasi Schmidt Hammer + UPV untuk estimasi kuat tekan yang lebih akurat
    </p>
    
    <div style="margin-bottom: 16px;">
      <label style="font-size: 0.8rem; color: var(--text-tertiary); display: block; margin-bottom: 4px;">Lokasi Pengujian</label>
      <input type="text" id="combined-location" class="form-input" placeholder="Contoh: Kolom K1.1" style="width: 100%;">
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
      <div>
        <label style="font-size: 0.8rem; color: var(--text-tertiary); display: block; margin-bottom: 4px;">fc' Schmidt Hammer (MPa)</label>
        <input type="number" id="combined-schmidt" class="form-input" placeholder="0.0" step="0.1">
      </div>
      <div>
        <label style="font-size: 0.8rem; color: var(--text-tertiary); display: block; margin-bottom: 4px;">fc' UPV (MPa)</label>
        <input type="number" id="combined-upv" class="form-input" placeholder="0.0" step="0.1">
      </div>
    </div>

    <button class="btn btn-primary" onclick="window._calculateCombined()" style="width: 100%;">
      <i class="fas fa-calculator"></i> Hitung Kombinasi
    </button>
  `;
}

function setupTabs() {
  document.querySelectorAll('.test-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      activeTest = btn.dataset.test;
      
      // Update button states
      document.querySelectorAll('.test-tab').forEach(b => {
        b.classList.remove('btn-primary');
        b.classList.add('btn-secondary');
      });
      btn.classList.remove('btn-secondary');
      btn.classList.add('btn-primary');
      
      // Hide results
      const resultCard = document.getElementById('result-card');
      if (resultCard) resultCard.style.display = 'none';
      
      renderCalculator();
    });
  });
}

let lastResult = null;

function setupGlobalFunctions() {
  window._calculateSchmidt = () => {
    const location = document.getElementById('schmidt-location')?.value || '-';
    const angle = parseInt(document.getElementById('schmidt-angle')?.value || '0');
    
    const readings = [];
    for (let i = 0; i < 10; i++) {
      const val = parseFloat(document.getElementById(`schmidt-rn-${i}`)?.value);
      if (!isNaN(val)) readings.push(val);
    }
    
    if (readings.length < 5) {
      showError('Masukkan minimal 5 nilai pantul');
      return;
    }
    
    const result = analyzeSchmidtHammer(readings, angle);
    displayResult(result, 'schmidt', location);
  };
  
  window._calculateUPV = () => {
    const location = document.getElementById('upv-location')?.value || '-';
    const time = parseFloat(document.getElementById('upv-time')?.value);
    const distance = parseFloat(document.getElementById('upv-distance')?.value);
    
    if (!time || !distance) {
      showError('Masukkan waktu tempuh dan jarak transduser');
      return;
    }
    
    const result = analyzeUPV(time, distance);
    displayResult(result, 'upv', location);
  };
  
  window._calculateCoreDrill = () => {
    const location = document.getElementById('core-location')?.value || '-';
    const diameter = parseFloat(document.getElementById('core-diameter')?.value);
    const height = parseFloat(document.getElementById('core-height')?.value);
    const load = parseFloat(document.getElementById('core-load')?.value);
    
    if (!diameter || !load) {
      showError('Masukkan diameter dan beban maksimum');
      return;
    }
    
    const l_d_ratio = height / diameter;
    const result = analyzeCoreDrill(diameter, height, load, l_d_ratio);
    displayResult(result, 'core', location);
  };
  
  window._calculateSteel = () => {
    const location = document.getElementById('steel-location')?.value || '-';
    const nominal = parseFloat(document.getElementById('steel-nominal')?.value);
    const measured = parseFloat(document.getElementById('steel-measured')?.value);
    const element = document.getElementById('steel-element')?.value || 'flange';
    
    if (!nominal || !measured) {
      showError('Masukkan tebal nominal dan tebal terukur');
      return;
    }
    
    const result = evaluateSteelThickness(nominal, measured, element);
    displayResult(result, 'steel', location);
  };
  
  window._calculateCombined = () => {
    const location = document.getElementById('combined-location')?.value || '-';
    const schmidtFc = parseFloat(document.getElementById('combined-schmidt')?.value);
    const upvFc = parseFloat(document.getElementById('combined-upv')?.value);
    
    if (!schmidtFc || !upvFc) {
      showError('Masukkan nilai fc\' dari kedua metode');
      return;
    }
    
    // Mock the full analysis objects
    const schmidtResult = { concrete: { fc: schmidtFc }, quality: { label: 'Combined' } };
    const upvResult = { velocity: 0, concrete: { fcEstimate: upvFc }, classification: { label: 'Combined' } };
    
    const result = combinedNDTAnalysis(schmidtResult, upvResult);
    result.location = location;
    displayResult(result, 'combined', location);
  };
  
  window._saveNDTResult = async () => {
    if (!lastResult || !currentProyek?.id) return;
    
    try {
      await saveNDTTest({
        proyekId: currentProyek.id,
        type: activeTest,
        location: lastResult.location,
        resultValue: lastResult.displayValue,
        resultUnit: lastResult.unit,
        data: lastResult.raw
      });
      
      showSuccess('Hasil pengujian berhasil disimpan');
      
      // Refresh history
      testHistory = await getNDTTestsByProject(currentProyek.id);
      document.getElementById('ndt-history').innerHTML = renderTestHistory();
    } catch (err) {
      showError('Gagal menyimpan: ' + err.message);
    }
  };
  
  window._exportNDTResults = () => {
    if (!testHistory.length) {
      showError('Tidak ada data untuk diexport');
      return;
    }
    
    const csv = [
      ['Tipe', 'Lokasi', 'Nilai', 'Satuan', 'Tanggal'],
      ...testHistory.map(t => [t.type, t.location, t.resultValue, t.resultUnit, t.createdAt])
    ].map(r => r.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NDT_Results_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };
}

function displayResult(result, type, location) {
  const resultCard = document.getElementById('result-card');
  const resultContent = document.getElementById('result-content');
  
  if (!resultCard || !resultContent) return;
  
  lastResult = { raw: result, location, type };
  
  let html = '';
  let displayValue = '';
  let unit = '';
  
  switch(type) {
    case 'schmidt':
      displayValue = result.concrete.fc;
      unit = 'MPa';
      html = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
          <div style="text-align: center; padding: 16px; background: var(--bg-subtle); border-radius: 8px;">
            <div style="font-size: 2rem; font-weight: 700; color: ${result.quality.color};">${result.concrete.fc}</div>
            <div class="text-xs text-tertiary">fc' (MPa)</div>
          </div>
          <div style="text-align: center; padding: 16px; background: var(--bg-subtle); border-radius: 8px;">
            <div style="font-size: 2rem; font-weight: 700; color: white;">${result.statistics.meanRn}</div>
            <div class="text-xs text-tertiary">Mean Rn</div>
          </div>
        </div>
        <div style="padding: 12px; background: ${result.quality.color}20; border-radius: 8px; margin-bottom: 12px;">
          <div style="font-weight: 700; color: ${result.quality.color};">${result.quality.label}</div>
          <div style="font-size: 0.8rem; color: var(--text-tertiary);">${result.compliance.message}</div>
        </div>
        <div style="font-size: 0.8rem; color: var(--text-tertiary);">
          <div>Min Rn: ${result.statistics.minRn} | Max Rn: ${result.statistics.maxRn}</div>
          <div>Std Dev: ${result.statistics.stdRn} | CV: ${result.statistics.cv}%</div>
          ${result.grubbsTest.outliers.length > 0 ? `<div style="color: #ef4444;">Outlier terdeteksi: ${result.grubbsTest.outliers.length}</div>` : ''}
        </div>
      `;
      break;
      
    case 'upv':
      displayValue = result.velocity;
      unit = 'km/s';
      html = `
        <div style="text-align: center; padding: 24px; background: var(--bg-subtle); border-radius: 8px; margin-bottom: 16px;">
          <div style="font-size: 2.5rem; font-weight: 700; color: ${result.classification.color};">${result.velocity}</div>
          <div class="text-sm text-tertiary">km/s</div>
          <div style="font-size: 1rem; color: ${result.classification.color}; margin-top: 8px;">${result.classification.quality}</div>
        </div>
        <div style="font-size: 0.85rem; color: var(--text-tertiary); margin-bottom: 8px;">
          <div><strong>Klasifikasi:</strong> ${result.classification.label}</div>
          <div><strong>Estimasi fc':</strong> ${result.concrete.fcEstimate} MPa</div>
          <div><strong>Modulus Dinamis:</strong> ${result.concrete.dynamicModulus} GPa</div>
        </div>
        <div style="font-size: 0.8rem; color: var(--text-tertiary); font-style: italic;">
          ${result.classification.description}
        </div>
      `;
      break;
      
    case 'core':
      displayValue = result.strength.fcCylinder;
      unit = 'MPa';
      html = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
          <div style="text-align: center; padding: 16px; background: var(--bg-subtle); border-radius: 8px;">
            <div style="font-size: 2rem; font-weight: 700; color: var(--brand-400);">${result.strength.fcCylinder}</div>
            <div class="text-xs text-tertiary">fc' Cylinder (MPa)</div>
          </div>
          <div style="text-align: center; padding: 16px; background: var(--bg-subtle); border-radius: 8px;">
            <div style="font-size: 2rem; font-weight: 700; color: white;">${result.strength.class}</div>
            <div class="text-xs text-tertiary">Kelas Beton</div>
          </div>
        </div>
        <div style="font-size: 0.85rem; color: var(--text-tertiary);">
          <div>fc' Core: ${result.strength.fcCore} MPa</div>
          <div>L/D Ratio: ${result.geometry.l_d_ratio}</div>
          ${result.correction.factor !== 1 ? `<div>Faktor Koreksi: ${result.correction.factor}</div>` : ''}
        </div>
      `;
      break;
      
    case 'steel':
      displayValue = result.loss.percent;
      unit = '%';
      html = `
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 16px;">
          <div style="text-align: center; padding: 12px; background: var(--bg-subtle); border-radius: 8px;">
            <div style="font-size: 1.5rem; font-weight: 700; color: ${result.assessment.condition.color};">${result.loss.percent}%</div>
            <div class="text-xs text-tertiary">Penipisan</div>
          </div>
          <div style="text-align: center; padding: 12px; background: var(--bg-subtle); border-radius: 8px;">
            <div style="font-size: 1.5rem; font-weight: 700; color: white;">${result.remaining.percent}%</div>
            <div class="text-xs text-tertiary">Tersisa</div>
          </div>
          <div style="text-align: center; padding: 12px; background: var(--bg-subtle); border-radius: 8px;">
            <div style="font-size: 1.5rem; font-weight: 700; color: white;">${result.remaining.capacity}</div>
            <div class="text-xs text-tertiary">Kapasitas</div>
          </div>
        </div>
        <div style="padding: 12px; background: ${result.assessment.condition.color}20; border-radius: 8px;">
          <div style="font-weight: 700; color: ${result.assessment.condition.color};">${result.assessment.condition.label}</div>
          <div style="font-size: 0.8rem; color: var(--text-tertiary);">${result.assessment.action}</div>
        </div>
      `;
      break;
      
    case 'combined':
      displayValue = result.combined.corrected;
      unit = 'MPa';
      html = `
        <div style="text-align: center; padding: 24px; background: var(--bg-subtle); border-radius: 8px; margin-bottom: 16px;">
          <div style="font-size: 2.5rem; font-weight: 700; color: var(--success-400);">${result.combined.corrected}</div>
          <div class="text-sm text-tertiary">MPa (fc' Terkoreksi)</div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
          <div style="text-align: center; padding: 12px; background: var(--bg-subtle); border-radius: 8px;">
            <div style="font-size: 1.2rem; color: var(--text-secondary);">${result.methods.schmidt} MPa</div>
            <div class="text-xs text-tertiary">Schmidt</div>
          </div>
          <div style="text-align: center; padding: 12px; background: var(--bg-subtle); border-radius: 8px;">
            <div style="font-size: 1.2rem; color: var(--text-secondary);">${result.methods.upv} MPa</div>
            <div class="text-xs text-tertiary">UPV</div>
          </div>
        </div>
        <div style="font-size: 0.85rem; color: var(--text-tertiary);">
          ${result.recommendation}
        </div>
      `;
      break;
  }
  
  lastResult.displayValue = displayValue;
  lastResult.unit = unit;
  
  resultContent.innerHTML = html;
  resultCard.style.display = 'block';
}
