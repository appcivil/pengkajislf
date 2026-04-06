// ============================================================
//  EXECUTIVE DASHBOARD & PORTFOLIO BENCHMARK PAGE
//  Fitur #25: Portfolio & Benchmark Antar Proyek
//  Fitur: KPI, Charts, Benchmarking, Trend Analysis, Export
// ============================================================
import { supabase } from '../lib/supabase.js';
import { BOBOT_ASPEK } from '../lib/scoring-engine.js';

export async function executivePage() {
  const root = document.getElementById('page-root');
  if (root) root.innerHTML = renderSkeleton();

  const [proyekData, analisisData, checklistData] = await Promise.all([
    fetchProyekAll(),
    fetchAnalisisAll(),
    fetchChecklistAll()
  ]);

  const html = buildHtml(proyekData, analisisData, checklistData);
  if (root) {
    root.innerHTML = html;
    initCharts(proyekData, analisisData, checklistData);
    initBenchmarkFeatures(proyekData, analisisData);
  }
  return html;
}

function buildHtml(proyekData, analisisData, checklistData) {
  // Aggregate KPIs
  const total = proyekData.length;
  let sLaik = 0, sBersyarat = 0, sTidakLaik = 0, sProses = 0;
  let riskKritis = 0, riskTinggi = 0, avgSkor = 0;

  proyekData.forEach(p => {
    if(p.status_slf === 'LAIK_FUNGSI') sLaik++;
    else if(p.status_slf === 'LAIK_FUNGSI_BERSYARAT') sBersyarat++;
    else if(p.status_slf === 'TIDAK_LAIK_FUNGSI') sTidakLaik++;
    else sProses++;
  });

  // Calculate benchmark stats by aspek
  const aspekStats = calculateAspekBenchmark(checklistData);

  if (analisisData.length > 0) {
    avgSkor = Math.round(analisisData.reduce((acc, a) => acc + (a.skor_total||0), 0) / analisisData.length);
    riskKritis = analisisData.filter(a => a.risk_level === 'critical').length;
    riskTinggi = analisisData.filter(a => a.risk_level === 'high').length;
  }

  return `
    <div id="executive-page">
      <div class="page-header" style="background:var(--bg-elevated);margin:-24px -24px 24px;padding:32px 24px;border-bottom:1px solid var(--border-subtle)">
        <div class="flex-between">
          <div>
            <div class="test-sm text-tertiary font-bold" style="letter-spacing:1px;text-transform:uppercase;margin-bottom:4px"><i class="fas fa-chart-line text-brand"></i> Executive View</div>
            <h1 class="page-title" style="font-size:2rem;margin-bottom:8px">Portofolio SLF Kota/Kabupaten</h1>
            <p class="text-secondary" style="max-width:600px;line-height:1.5">
              Dashboard analitik tingkat manajemen untuk memantau status kelaikan fungsi seluruh gedung. 
              Benchmark antar proyek & analisis trend kelaikan.
            </p>
          </div>
          <div style="text-align:right">
             <div class="text-2xl font-bold text-primary">${new Date().toLocaleString('id-ID', { month:'long', year:'numeric'})}</div>
             <div class="text-sm text-tertiary">Live System Update</div>
             <button class="btn btn-secondary btn-sm mt-2" onclick="window.exportPortfolioReport()">
               <i class="fas fa-download"></i> Export Report
             </button>
          </div>
        </div>
      </div>

      <!-- KPI Ribbon (Responsive 4-to-2-to-1) -->
      <div class="grid-4" style="margin-bottom:var(--space-5)">
        ${[
           { lbl: 'Total Bangunan', count: total, icon: 'fa-city', c: 'kpi-blue', sub: `${sProses} dalam proses` },
           { lbl: 'SLF Terbit (Laik)', count: sLaik, icon: 'fa-check-circle', c: 'kpi-green', sub: `${Math.round(sLaik/total*100)}% dari total` },
           { lbl: 'Risiko Tinggi/Kritis', count: riskTinggi + riskKritis, icon: 'fa-triangle-exclamation', c: 'kpi-red', sub: `${riskKritis} kritis` },
           { lbl: 'Rata-Rata Skor AI', count: avgSkor+'/100', icon: 'fa-brain', c: 'kpi-purple', sub: 'Nasional avg: 72' },
        ].map(k => `
           <div class="card" style="display:flex;align-items:center;gap:16px">
             <div class="kpi-icon-wrap ${k.c}" style="width:48px;height:48px;font-size:1.2rem;margin:0">
               <i class="fas ${k.icon}"></i>
             </div>
             <div>
               <div class="text-xs text-tertiary font-bold" style="text-transform:uppercase">${k.lbl}</div>
               <div style="font-size:1.8rem;font-weight:800;letter-spacing:-1px;line-height:1.2">${k.count}</div>
               <div class="text-xs text-tertiary">${k.sub}</div>
             </div>
           </div>
        `).join('')}
      </div>

      <!-- Benchmark by Aspek -->
      <div class="card" style="margin-bottom:var(--space-5)">
        <div class="card-title" style="margin-bottom:var(--space-4)">
          <i class="fas fa-balance-scale text-brand"></i> Benchmark Rata-Rata per Aspek (Nasional)
        </div>
        <div class="grid-4" style="gap:12px">
          ${Object.entries(aspekStats).map(([aspek, stat]) => `
            <div style="background:var(--bg-subtle);padding:16px;border-radius:8px">
              <div class="flex-between" style="margin-bottom:8px">
                <span class="text-sm font-bold capitalize">${aspek}</span>
                <span class="text-xs text-tertiary">Bobot: ${BOBOT_ASPEK[aspek] || 10}%</span>
              </div>
              <div style="font-size:1.5rem;font-weight:700;color:${stat.avg >= 80 ? 'var(--success)' : stat.avg >= 60 ? 'var(--warning)' : 'var(--danger)'}">
                ${stat.avg}
              </div>
              <div class="text-xs text-tertiary">${stat.count} item dinilai</div>
              <div style="margin-top:8px;height:4px;background:var(--bg-elevated);border-radius:2px;overflow:hidden">
                <div style="height:100%;width:${stat.avg}%;background:${stat.avg >= 80 ? 'var(--success)' : stat.avg >= 60 ? 'var(--warning)' : 'var(--danger)'};border-radius:2px"></div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Charts Row -->
      <div class="grid-main-responsive" style="margin-bottom:var(--space-5)">
        <div class="card">
          <div class="card-title" style="margin-bottom:var(--space-4)">Status Keseluruhan SLF</div>
          <div class="chart-wrap" style="height:300px">
             <canvas id="bar-chart"></canvas>
          </div>
        </div>
        <div class="card">
          <div class="card-title" style="margin-bottom:var(--space-4)">Sebaran Tingkat Risiko (AI Score)</div>
          <div class="chart-wrap" style="height:300px">
             <canvas id="doughnut-chart"></canvas>
          </div>
        </div>
      </div>

      <!-- Benchmark Comparison Table -->
      <div class="card" style="margin-bottom:var(--space-5)">
        <div class="card-title" style="margin-bottom:var(--space-4)">
          <i class="fas fa-ranking-star text-brand"></i> Benchmark Perbandingan Proyek
        </div>
        <div style="overflow-x:auto">
          <table class="checklist-table" id="benchmark-table">
            <thead>
              <tr>
                <th>Ranking</th>
                <th>Bangunan</th>
                <th>Status SLF</th>
                <th>Skor Total</th>
                <th>Struktur</th>
                <th>Mekanikal</th>
                <th>Administrasi</th>
                <th>Risiko</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody id="benchmark-tbody">
              <!-- Populated by JS -->
            </tbody>
          </table>
        </div>
      </div>

      <!-- Tabel Urgent -->
      <div class="card">
        <div class="card-title" style="margin-bottom:var(--space-4)">
          <i class="fas fa-exclamation-circle text-danger"></i> Top 5 Bangunan Kritis (Area Prioritas Perbaikan)
        </div>
        <table class="checklist-table">
          <thead>
            <tr>
              <th>Bangunan</th>
              <th>Status SLF</th>
              <th>Evaluasi Terakhir</th>
              <th>Skor Total AI</th>
            </tr>
          </thead>
          <tbody>
            ${[...proyekData].filter(p => p.status_slf === 'TIDAK_LAIK_FUNGSI').slice(0,5).map(p => `
              <tr>
                <td><b>${escHtml(p.nama_bangunan)}</b><br><span class="text-xs text-tertiary">${escHtml(p.alamat)}</span></td>
                <td><span class="badge" style="background:var(--danger-bg);color:var(--danger-400)">Tidak Laik Fungsi</span></td>
                <td class="text-tertiary">${new Date().toLocaleDateString('id-ID')}</td>
                <td><span class="text-danger font-bold text-lg">${analisisData.find(a=>a.proyek_id===p.id)?.skor_total||0}</span>/100</td>
              </tr>
            `).join('')}
            ${proyekData.filter(p => p.status_slf === 'TIDAK_LAIK_FUNGSI').length === 0 ? `<tr><td colspan="4" class="text-center text-tertiary">Tidak ada bangunan berstatus Tidak Laik Fungsi dalam sistem.</td></tr>` : ''}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// Calculate benchmark statistics by aspek
function calculateAspekBenchmark(checklistData) {
  const aspekGroups = {};
  const aspekMap = {
    'administrasi': ['A01','A02','A03','A04','A05','A06','A07','A08','A09','A10','ITEM-09A'],
    'pemanfaatan':  ['ITEM-01A','ITEM-01B','ITEM-01C','ITEM-02A','ITEM-02B','ITEM-02C','ITEM-02D','ITEM-02E','ITEM-02F','ITEM-02G','ITEM-02H','ITEM-02I','ITEM-02J'],
    'arsitektur':   ['ITEM-03A','ITEM-03B','ITEM-03C','ITEM-04A'],
    'struktur':     ['ITEM-05A1','ITEM-05A2','ITEM-05A3','ITEM-05A4','ITEM-05A5','ITEM-05A6','ITEM-05A7','ITEM-05A8','ITEM-05A9','ITEM-05A10'],
    'mekanikal':    ['ITEM-05B','ITEM-05C','ITEM-05D','ITEM-05E'],
    'kesehatan':    ['ITEM-06A','ITEM-06B','ITEM-06C1','ITEM-06C2','ITEM-06C3','ITEM-06C4','ITEM-06D'],
    'kenyamanan':   ['ITEM-07A','ITEM-07B','ITEM-07C','ITEM-07D'],
    'kemudahan':    ['ITEM-08A','ITEM-08B'],
  };

  // Initialize
  Object.keys(aspekMap).forEach(aspek => {
    aspekGroups[aspek] = { scores: [], count: 0 };
  });

  // Group scores by aspek
  checklistData.forEach(item => {
    for (const [aspek, codes] of Object.entries(aspekMap)) {
      if (codes.includes(item.kode)) {
        const nilai = parseFloat(item.nilai) || 0;
        if (nilai > 0) {
          aspekGroups[aspek].scores.push(nilai);
          aspekGroups[aspek].count++;
        }
      }
    }
  });

  // Calculate averages
  const stats = {};
  for (const [aspek, data] of Object.entries(aspekGroups)) {
    const avg = data.scores.length > 0 
      ? Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length)
      : 0;
    stats[aspek] = { avg, count: data.count };
  }

  return stats;
}

function initBenchmarkFeatures(proyekData, analisisData) {
  // Populate benchmark table
  const tbody = document.getElementById('benchmark-tbody');
  if (!tbody) return;

  // Merge proyek with analisis
  const merged = proyekData.map(p => {
    const analisis = analisisData.find(a => a.proyek_id === p.id);
    return {
      ...p,
      skor_total: analisis?.skor_total || 0,
      skor_struktur: analisis?.skor_struktur || 0,
      skor_mekanikal: analisis?.skor_mekanikal || 0,
      skor_admin: analisis?.skor_administrasi || 0,
      risk_level: analisis?.risk_level || 'unknown'
    };
  }).sort((a, b) => b.skor_total - a.skor_total);

  tbody.innerHTML = merged.slice(0, 10).map((p, idx) => `
    <tr>
      <td><span class="font-bold" style="color:${idx < 3 ? 'var(--brand-400)' : 'var(--text-secondary)'}">#${idx + 1}</span></td>
      <td>
        <b>${escHtml(p.nama_bangunan)}</b>
        <div class="text-xs text-tertiary">${escHtml(p.fungsi_bangunan || '-')}</div>
      </td>
      <td>${renderStatusBadge(p.status_slf)}</td>
      <td>
        <span class="font-bold" style="color:${getScoreColor(p.skor_total)}">${p.skor_total}</span>
      </td>
      <td><span style="color:${getScoreColor(p.skor_struktur)}">${p.skor_struktur}</span></td>
      <td><span style="color:${getScoreColor(p.skor_mekanikal)}">${p.skor_mekanikal}</span></td>
      <td><span style="color:${getScoreColor(p.skor_admin)}">${p.skor_admin}</span></td>
      <td>${renderRiskBadge(p.risk_level)}</td>
      <td>
        <button class="btn btn-ghost btn-sm" onclick="window.navigate('proyek-detail', {id:'${p.id}'})">
          <i class="fas fa-eye"></i>
        </button>
      </td>
    </tr>
  `).join('');

  // Export function
  window.exportPortfolioReport = () => {
    const reportData = {
      exportedAt: new Date().toISOString(),
      summary: {
        totalBangunan: proyekData.length,
        laikFungsi: proyekData.filter(p => p.status_slf === 'LAIK_FUNGSI').length,
        tidakLaik: proyekData.filter(p => p.status_slf === 'TIDAK_LAIK_FUNGSI').length,
        rataSkor: Math.round(merged.reduce((a, p) => a + p.skor_total, 0) / merged.length) || 0
      },
      projects: merged.map(p => ({
        nama: p.nama_bangunan,
        fungsi: p.fungsi_bangunan,
        status: p.status_slf,
        skor: p.skor_total,
        risiko: p.risk_level
      }))
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Portfolio_SLF_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
}

function getScoreColor(score) {
  if (score >= 80) return 'var(--success)';
  if (score >= 60) return 'var(--warning)';
  return 'var(--danger)';
}

function renderStatusBadge(status) {
  const colors = {
    'LAIK_FUNGSI': 'background:var(--success-bg);color:var(--success-400)',
    'LAIK_FUNGSI_BERSYARAT': 'background:var(--warning-bg);color:var(--warning-400)',
    'TIDAK_LAIK_FUNGSI': 'background:var(--danger-bg);color:var(--danger-400)',
    'DALAM_PENGKAJIAN': 'background:var(--info-bg);color:var(--info-400)'
  };
  const labels = {
    'LAIK_FUNGSI': 'Laik Fungsi',
    'LAIK_FUNGSI_BERSYARAT': 'Laik Bersyarat',
    'TIDAK_LAIK_FUNGSI': 'Tidak Laik',
    'DALAM_PENGKAJIAN': 'Dalam Pengkajian'
  };
  return `<span class="badge" style="${colors[status] || colors['DALAM_PENGKAJIAN']}">${labels[status] || status}</span>`;
}

function renderRiskBadge(risk) {
  const colors = {
    'low': 'var(--success)',
    'medium': 'var(--warning)',
    'high': 'var(--danger)',
    'critical': 'var(--danger)',
    'unknown': 'var(--text-tertiary)'
  };
  const labels = {
    'low': 'Rendah',
    'medium': 'Sedang',
    'high': 'Tinggi',
    'critical': 'Kritis',
    'unknown': '-'
  };
  return `<span style="color:${colors[risk] || colors.unknown};font-weight:600">${labels[risk] || risk}</span>`;
}

function initCharts(proyekData, analisisData, checklistData) {
  const tryInit = () => {
    if (!window.Chart) return setTimeout(tryInit, 100);
    
    // Bar Chart - Status SLF
    const barCtx = document.getElementById('bar-chart');
    if (barCtx) {
       let sLaik = 0, sBersyarat = 0, sTidakLaik = 0, sProses = 0;
       proyekData.forEach(p => {
         if(p.status_slf === 'LAIK_FUNGSI') sLaik++;
         else if(p.status_slf === 'LAIK_FUNGSI_BERSYARAT') sBersyarat++;
         else if(p.status_slf === 'TIDAK_LAIK_FUNGSI') sTidakLaik++;
         else sProses++;
       });

       new window.Chart(barCtx, {
         type: 'bar',
         data: {
           labels: ['Laik Fungsi', 'Bersyarat', 'Tidak Laik', 'Proses/Belum'],
           datasets: [{
             label: 'Total Bangunan',
             data: [sLaik, sBersyarat, sTidakLaik, sProses],
             backgroundColor: ['hsl(160,65%,46%)', 'hsl(40,80%,55%)', 'hsl(0,74%,52%)', 'hsl(220,10%,50%)'],
             borderRadius: 6
           }]
         },
         options: { 
           responsive: true, 
           maintainAspectRatio: false, 
           plugins: { 
             legend: { display: false },
             tooltip: {
               callbacks: {
                 afterLabel: (ctx) => {
                   const pct = proyekData.length > 0 ? Math.round((ctx.raw / proyekData.length) * 100) : 0;
                   return `${pct}% dari total`;
                 }
               }
             }
           } 
         }
       });
    }

    // Doughnut - Risk Distribution
    const doughnutCtx = document.getElementById('doughnut-chart');
    if (doughnutCtx) {
       let critically = 0, high = 0, mid = 0, low = 0;
       analisisData.forEach(a => {
         if(a.risk_level === 'critical') critically++;
         else if(a.risk_level === 'high') high++;
         else if(a.risk_level === 'medium') mid++;
         else low++;
       });
       if(analisisData.length === 0) low = 1;
       
       new window.Chart(doughnutCtx, {
         type: 'doughnut',
         data: {
           labels: ['Low Risk', 'Medium', 'High', 'Critical'],
           datasets: [{
             data: [low, mid, high, critically],
             backgroundColor: ['hsl(160,65%,46%)', 'hsl(40,80%,55%)', 'hsl(20,80%,55%)', 'hsl(0,74%,52%)'],
             borderWidth: 0,
             cutout: '70%'
           }]
         },
         options: { 
           responsive: true, 
           maintainAspectRatio: false, 
           plugins: { 
             legend: { position: 'bottom' },
             tooltip: {
               callbacks: {
                 label: (ctx) => {
                   const total = low + mid + high + critically;
                   const pct = total > 0 ? Math.round((ctx.raw / total) * 100) : 0;
                   return `${ctx.label}: ${ctx.raw} (${pct}%)`;
                 }
               }
             }
           } 
         }
       });
    }
  };

  if (window.Chart) tryInit();
  else {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js';
    s.onload = tryInit;
    document.head.appendChild(s);
  }
}

// Data Fetching
async function fetchProyekAll() {
  try {
    const { data } = await supabase.from('proyek').select('*');
    return data || [];
  } catch { return []; }
}

async function fetchAnalisisAll() {
  try {
    const { data } = await supabase.from('hasil_analisis').select('*');
    return data || [];
  } catch { return []; } 
}

async function fetchChecklistAll() {
  try {
    const { data } = await supabase.from('checklist_items').select('*');
    return data || [];
  } catch { return []; }
}

function renderSkeleton() {
  return `<div class="skeleton" style="height:200px;margin-bottom:24px;width:100%"></div>
          <div class="grid-2-1">
            <div class="skeleton" style="height:350px"></div>
            <div class="skeleton" style="height:350px"></div>
          </div>`;
}

function escHtml(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
