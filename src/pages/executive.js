// ============================================================
//  EXECUTIVE DASHBOARD PAGE
//  Ringkasan level pimpinan (KPI, Charts, Portofolio SLF)
// ============================================================
import { supabase } from '../lib/supabase.js';

export async function executivePage() {
  const root = document.getElementById('page-root');
  if (root) root.innerHTML = renderSkeleton();

  const [proyekData, analisisData] = await Promise.all([
    fetchProyekAll(),
    fetchAnalisisAll()
  ]);

  const html = buildHtml(proyekData, analisisData);
  if (root) {
    root.innerHTML = html;
    initCharts(proyekData, analisisData);
  }
  return html;
}

function buildHtml(proyekData, analisisData) {
  // Aggregate KPIs
  const total = proyekData.length;
  let sLaik = 0, sBersyarat = 0, sTidakLaik = 0, sProses = 0;
  let riskKritis = 0, avgSkor = 0;

  proyekData.forEach(p => {
    if(p.status_slf === 'LAIK_FUNGSI') sLaik++;
    else if(p.status_slf === 'LAIK_FUNGSI_BERSYARAT') sBersyarat++;
    else if(p.status_slf === 'TIDAK_LAIK_FUNGSI') sTidakLaik++;
    else sProses++;
  });

  if (analisisData.length > 0) {
    avgSkor = Math.round(analisisData.reduce((acc, a) => acc + (a.skor_total||0), 0) / analisisData.length);
    riskKritis = analisisData.filter(a => ['critical','high'].includes(a.risk_level)).length;
  }

  return `
    <div id="executive-page">
      <div class="page-header" style="background:var(--bg-elevated);margin:-24px -24px 24px;padding:32px 24px;border-bottom:1px solid var(--border-subtle)">
        <div class="flex-between">
          <div>
            <div class="test-sm text-tertiary font-bold" style="letter-spacing:1px;text-transform:uppercase;margin-bottom:4px"><i class="fas fa-chart-line text-brand"></i> Executive View</div>
            <h1 class="page-title" style="font-size:2rem;margin-bottom:8px">Portofolio SLF Kota/Kabupaten</h1>
            <p class="text-secondary" style="max-width:600px;line-height:1.5">
              Dashboard analitik tingkat manajemen untuk memantau status kelaikan fungsi seluruh gedung yang terdaftar dalam wilayah kerja. Data ditarik real-time dari hasil engine AI.
            </p>
          </div>
          <div style="text-align:right">
             <div class="text-2xl font-bold text-primary">${new Date().toLocaleString('id-ID', { month:'long', year:'numeric'})}</div>
             <div class="text-sm text-tertiary">Live System Update</div>
          </div>
        </div>
      </div>

      <!-- KPI Ribbon (Responsive 4-to-2-to-1) -->
      <div class="grid-4" style="margin-bottom:var(--space-5)">
        ${[
           { lbl: 'Total Bangunan', count: total, icon: 'fa-city', c: 'kpi-blue' },
           { lbl: 'SLF Terbit (Laik)', count: sLaik, icon: 'fa-check-circle', c: 'kpi-green' },
           { lbl: 'Risiko Tinggi/Kritis', count: riskKritis, icon: 'fa-triangle-exclamation', c: 'kpi-red' },
           { lbl: 'Rata-Rata Skor AI', count: avgSkor+'/100', icon: 'fa-brain', c: 'kpi-purple' },
        ].map(k => `
           <div class="card" style="display:flex;align-items:center;gap:16px">
             <div class="kpi-icon-wrap ${k.c}" style="width:48px;height:48px;font-size:1.2rem;margin:0">
               <i class="fas ${k.icon}"></i>
             </div>
             <div>
               <div class="text-xs text-tertiary font-bold" style="text-transform:uppercase">${k.lbl}</div>
               <div style="font-size:1.8rem;font-weight:800;letter-spacing:-1px;line-height:1.2">${k.count}</div>
             </div>
           </div>
        `).join('')}
      </div>

      <!-- Charts (Responsive Layout) -->
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

      <!-- Tabel Urgent -->
      <div class="card">
        <div class="card-title" style="margin-bottom:var(--space-4)"><i class="fas fa-exclamation-circle text-danger"></i> Top 5 Bangunan Kritis (Area Prioritas Perbaikan)</div>
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

function initCharts(proyekData, analisisData) {
  const tryInit = () => {
    if (!window.Chart) return setTimeout(tryInit, 100);
    
    // Bar Chart
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
         options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
       });
    }

    // Doughnut
    const doughnutCtx = document.getElementById('doughnut-chart');
    if (doughnutCtx) {
       let critically = 0, high = 0, mid = 0, low = 0;
       analisisData.forEach(a => {
         if(a.risk_level === 'critical') critically++;
         else if(a.risk_level === 'high') high++;
         else if(a.risk_level === 'medium') mid++;
         else low++;
       });
       if(analisisData.length === 0) low = 1; // dummy fallback
       
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
         options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
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
  } catch { return []; } // Mock fail
}
async function fetchAnalisisAll() {
  try {
    const { data } = await supabase.from('hasil_analisis').select('*');
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
