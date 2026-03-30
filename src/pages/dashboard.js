// ============================================================
//  DASHBOARD PAGE
//  KPI overview, charts, AI insight, todo monitoring
// ============================================================
import { supabase } from '../lib/supabase.js';
import { getUserInfo } from '../lib/auth.js';
import { navigate } from '../lib/router.js';
import { APP_CONFIG } from '../lib/config.js';
import { showError } from '../components/toast.js';
import { fetchTeamMembers, fetchTeamWorkload } from '../lib/team-service.js';

export async function dashboardPage() {
  // Render skeleton immediately
  const skeletonHtml = renderSkeleton();
  const root = document.getElementById('page-root');
  if (root) root.innerHTML = skeletonHtml;

  // Fetch data
  const [kpi, projects, todos, workload] = await Promise.all([
    fetchKPI(),
    fetchRecentProjects(),
    fetchRecentTodos(),
    fetchTeamWorkload(),
  ]);

  const user = getUserInfo();
  const now  = new Date();
  const greeting = getGreeting(now.getHours());

  triggerDashboardMount(projects, kpi);

  return `
    <div id="dashboard-page">
      <!-- Page Header -->
      <div class="page-header">
        <div class="flex-between">
          <div>
            <h1 class="page-title">${greeting}, ${user?.name?.split(' ')[0] || 'User'}! 👋</h1>
            <p class="page-subtitle">Monitoring pengkajian SLF &bull; ${formatDate(now)}</p>
          </div>
          <div class="flex gap-3">
            <button class="btn btn-secondary" onclick="window.navigate('laporan')">
              <i class="fas fa-file-export"></i> Export Laporan
            </button>
            <button class="btn btn-primary" onclick="window.navigate('proyek-baru')">
              <i class="fas fa-plus"></i> Proyek Baru
            </button>
          </div>
        </div>
      </div>

      <!-- KPI Grid -->
      <div class="kpi-grid">
        ${renderKPICards(kpi)}
      </div>

      <!-- Map Overview -->
      <div class="card" style="margin-top:var(--space-5); overflow:hidden; padding:0; display:flex; flex-direction:column">
        <div class="card-header" style="border-bottom:1px solid var(--border-subtle); background:var(--bg-elevated); z-index:10">
          <div>
            <div class="card-title">Peta Distribusi Proyek</div>
            <div class="card-subtitle">Visualisasi spasial lokasi pengkajian SLF</div>
          </div>
        </div>
        <div id="dashboard-map" style="width:100%; height:320px; z-index:1"></div>
      </div>

      <!-- Main Grid (Responsive 3-to-1) -->
      <div class="grid-3-1" style="margin-top:var(--space-5)">

        <!-- Chart: Distribusi Temuan -->
        <div class="card">
          <div class="card-header">
            <div>
              <div class="card-title">Distribusi Temuan per Aspek</div>
              <div class="card-subtitle">Berdasarkan seluruh proyek aktif</div>
            </div>
            <button class="btn btn-ghost btn-sm" onclick="refreshCharts()">
              <i class="fas fa-rotate"></i>
            </button>
          </div>
          <div class="chart-wrap">
            <canvas id="chart-distribusi"></canvas>
          </div>
        </div>

        <!-- Chart: Risiko -->
        <div class="card">
          <div class="card-header">
            <div>
              <div class="card-title">Level Risiko</div>
              <div class="card-subtitle">Agregat semua temuan</div>
            </div>
          </div>
          <div class="chart-wrap">
            <canvas id="chart-risiko"></canvas>
          </div>
        </div>

        <!-- Right: AI Panel + TODO -->
        <div style="display:flex;flex-direction:column;gap:var(--space-4)">
          <!-- AI Insight Panel -->
          <div class="ai-panel">
            <div class="ai-panel-header">
              <div class="ai-icon"><i class="fas fa-brain"></i></div>
              <div>
                <div class="ai-panel-title">AI Insight</div>
                <div class="ai-panel-subtitle">Analisis otomatis sistem</div>
              </div>
            </div>
            ${renderAIInsights(kpi)}
          </div>

          <!-- SLF Status Summary -->
          <div class="card">
            <div class="card-header">
              <div class="card-title">Status SLF</div>
              <button class="btn btn-ghost btn-sm" onclick="window.navigate('proyek')">
                Lihat Semua →
              </button>
            </div>
            ${renderSLFStatus(kpi)}
          </div>

          <!-- Team Workload Widget -->
          <div class="card" style="border-left:3px solid var(--brand-400)">
            <div class="card-header">
              <div class="card-title">Beban Kerja Tim</div>
              <button class="btn btn-ghost btn-sm" onclick="window.navigate('tim-kerja')">
                Manajemen →
              </button>
            </div>
            <div style="display:flex; flex-direction:column; gap:12px">
              ${workload.slice(0, 4).map(w => `
                <div style="display:flex; align-items:center; justify-content:space-between">
                  <div class="text-xs font-semibold text-secondary truncate" style="max-width:120px">${w.full_name}</div>
                  <div style="display:flex; align-items:center; gap:8px; flex:1; justify-content:flex-end">
                    <div class="progress-wrap" style="height:4px; max-width:60px">
                      <div class="progress-fill blue" style="width:${(w.activeProjects / 5) * 100}%"></div>
                    </div>
                    <span class="text-xs font-bold text-primary">${w.activeProjects}</span>
                  </div>
                </div>
              `).join('')}
              ${workload.length === 0 ? '<p class="text-xs text-tertiary">Belum ada data tim.</p>' : ''}
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom Grid (Responsive 2-to-1) -->
      <div class="grid-2-1" style="margin-top:var(--space-5)">

        <!-- Recent Projects -->
        <div class="card">
          <div class="card-header">
            <div>
              <div class="card-title">Proyek Terkini</div>
              <div class="card-subtitle">${projects.length} dari ${kpi.totalProyek || 0} proyek</div>
            </div>
            <button class="btn btn-secondary btn-sm" onclick="window.navigate('proyek')">
              Semua Proyek
            </button>
          </div>
          ${renderProjectTable(projects)}
        </div>

        <!-- TODO Monitoring -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">TODO Monitoring</div>
            <button class="btn btn-ghost btn-sm" onclick="window.navigate('todo')">
              Lihat Semua →
            </button>
          </div>
          ${renderTodoList(todos)}
        </div>
      </div>
    </div>
  `;
}

// ── KPI Cards ──────────────────────────────────────────────
function renderKPICards(kpi) {
  const cards = [
    { label: 'Total Proyek',     value: kpi.totalProyek     || 0, icon: 'fa-folder-open',       color: 'kpi-blue',   trend: null },
    { label: 'Proyek Aktif',     value: kpi.proyekAktif     || 0, icon: 'fa-play-circle',        color: 'kpi-green',  trend: null },
    { label: 'Laik Fungsi',      value: kpi.laikFungsi      || 0, icon: 'fa-circle-check',       color: 'kpi-green',  trend: '+2' },
    { label: 'Laik Bersyarat',   value: kpi.laikBersyarat   || 0, icon: 'fa-triangle-exclamation',color: 'kpi-yellow', trend: null },
    { label: 'Tidak Laik',       value: kpi.tidakLaik       || 0, icon: 'fa-circle-xmark',       color: 'kpi-red',    trend: null },
    { label: 'Task Selesai',     value: kpi.taskSelesai     || 0, icon: 'fa-check-double',       color: 'kpi-purple', trend: '+5' },
    { label: 'Task Terlambat',   value: kpi.taskTerlambat   || 0, icon: 'fa-clock',              color: 'kpi-red',    trend: null },
    { label: 'Analisis AI',      value: kpi.totalAnalisis   || 0, icon: 'fa-brain',              color: 'kpi-purple', trend: null },
    { label: 'Anggota Tim',     value: kpi.memberCount      || 0, icon: 'fa-user-group',         color: 'kpi-blue',   trend: null },
  ];

  return cards.map(c => `
    <div class="kpi-card" onclick="window.navigate('proyek')">
      <div class="kpi-icon-wrap ${c.color}">
        <i class="fas ${c.icon}"></i>
      </div>
      <div class="kpi-value" style="color:inherit">${c.value}</div>
      <div class="kpi-label">${c.label}</div>
      ${c.trend ? `<div class="kpi-trend up"><i class="fas fa-arrow-trend-up"></i> ${c.trend} bulan ini</div>` : ''}
    </div>
  `).join('');
}

// ── AI Insights ─────────────────────────────────────────────
function renderAIInsights(kpi) {
  const total = (kpi.totalProyek || 0);
  const laik  = (kpi.laikFungsi || 0);
  const rate  = total > 0 ? Math.round((laik / total) * 100) : 0;

  const insights = [];

  if (kpi.taskTerlambat > 0) {
    insights.push({ type: 'critical', text: `${kpi.taskTerlambat} task melewati batas waktu. Tindak segera.` });
  }
  if (kpi.tidakLaik > 0) {
    insights.push({ type: 'warning', text: `${kpi.tidakLaik} bangunan berstatus Tidak Laik Fungsi — perlu rehabilitasi.` });
  }
  insights.push({ type: 'success', text: `Tingkat kelulusan SLF: ${rate}% dari total proyek.` });
  if (kpi.proyekAktif > 0) {
    insights.push({ type: '', text: `${kpi.proyekAktif} proyek sedang dalam proses pengkajian.` });
  }

  if (!insights.length) {
    return `<div class="ai-finding">Belum ada data proyek untuk dianalisis.</div>`;
  }

  return insights.slice(0, 4).map(i => `
    <div class="ai-finding ${i.type}">
      <i class="fas ${i.type === 'critical' ? 'fa-triangle-exclamation' : i.type === 'warning' ? 'fa-exclamation' : i.type === 'success' ? 'fa-circle-check' : 'fa-circle-info'}" style="margin-right:6px"></i>
      ${i.text}
    </div>
  `).join('');
}

// ── SLF Status Donut ────────────────────────────────────────
function renderSLFStatus(kpi) {
  const items = [
    { label: 'Laik Fungsi',          value: kpi.laikFungsi    || 0, cls: 'kpi-green',  bar: 'green' },
    { label: 'Laik Bersyarat',       value: kpi.laikBersyarat || 0, cls: 'kpi-yellow', bar: 'yellow' },
    { label: 'Tidak Laik',           value: kpi.tidakLaik     || 0, cls: 'kpi-red',    bar: 'red' },
    { label: 'Dalam Pengkajian',     value: kpi.proyekAktif   || 0, cls: 'kpi-blue',   bar: 'blue' },
  ];
  const total = items.reduce((s, i) => s + i.value, 0) || 1;

  return `<div style="display:flex;flex-direction:column;gap:10px">
    ${items.map(i => `
      <div>
        <div class="flex-between mb-1">
          <span class="text-sm text-secondary">${i.label}</span>
          <span class="text-sm font-semibold text-primary">${i.value}</span>
        </div>
        <div class="progress-wrap">
          <div class="progress-fill ${i.bar}" style="width:${Math.round((i.value/total)*100)}%"></div>
        </div>
      </div>
    `).join('')}
  </div>`;
}

// ── Project Table ────────────────────────────────────────────
function renderProjectTable(projects) {
  if (!projects.length) {
    return `<div class="empty-state"><div class="empty-icon"><i class="fas fa-folder-open"></i></div><p class="empty-title">Belum ada proyek</p><button class="btn btn-primary mt-4" onclick="window.navigate('proyek-baru')"><i class="fas fa-plus"></i> Buat Proyek</button></div>`;
  }

  const statusMap = {
    LAIK_FUNGSI:           { label: 'Laik Fungsi',          cls: 'badge-laik' },
    LAIK_FUNGSI_BERSYARAT: { label: 'Laik Bersyarat',       cls: 'badge-bersyarat' },
    TIDAK_LAIK_FUNGSI:     { label: 'Tidak Laik',           cls: 'badge-tidak-laik' },
    DALAM_PENGKAJIAN:      { label: 'Dalam Pengkajian',     cls: 'badge-proses' },
  };

  return `
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Nama Bangunan</th>
            <th>Pemilik</th>
            <th>Progress</th>
            <th>Status SLF</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          ${projects.map(p => {
            const s = statusMap[p.status_slf] || { label: p.status_slf, cls: 'badge-proses' };
            const prog = p.progress || 0;
            return `
              <tr style="cursor:pointer" onclick="window.navigate('proyek-detail', { id: '${p.id}' })">
                <td>
                  <div class="font-semibold text-primary truncate" style="max-width:180px">${p.nama_bangunan || '-'}</div>
                  <div class="text-xs text-tertiary truncate" style="max-width:180px">${p.alamat || ''}</div>
                </td>
                <td class="text-secondary truncate" style="max-width:120px">${p.pemilik || '-'}</td>
                <td style="min-width:100px">
                  <div class="flex-between mb-1">
                    <span class="text-xs text-tertiary">${prog}%</span>
                  </div>
                  <div class="progress-wrap">
                    <div class="progress-fill ${prog >= 80 ? 'green' : prog >= 40 ? 'blue' : 'yellow'}" style="width:${prog}%"></div>
                  </div>
                </td>
                <td><span class="badge ${s.cls}">${s.label}</span></td>
                <td>
                  <button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();window.navigate('proyek-detail', {id:'${p.id}'})">
                    <i class="fas fa-arrow-right"></i>
                  </button>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// ── TODO List ────────────────────────────────────────────────
function renderTodoList(todos) {
  if (!todos.length) {
    return `<div class="empty-state"><div class="empty-icon"><i class="fas fa-list-check"></i></div><p class="empty-title">Tidak ada task</p></div>`;
  }

  const priorityClass = { critical: 'badge-critical', high: 'badge-high', medium: 'badge-medium', low: 'badge-low' };

  return `<div style="display:flex;flex-direction:column;gap:8px">
    ${todos.slice(0, 8).map(t => `
      <div style="background:var(--bg-elevated);border:1px solid var(--border-subtle);border-radius:var(--radius-md);padding:10px 12px;display:flex;align-items:center;gap:10px;cursor:pointer;transition:all var(--transition-fast)"
           onmouseenter="this.style.borderColor='var(--border-default)'"
           onmouseleave="this.style.borderColor='var(--border-subtle)'"
           onclick="window.navigate('todo-detail', {id:'${t.id}'})">
        <div style="width:3px;height:36px;border-radius:2px;background:${t.priority === 'critical' ? 'var(--danger-400)' : t.priority === 'high' ? 'var(--warning-400)' : 'var(--brand-400)'};flex-shrink:0"></div>
        <div style="flex:1;overflow:hidden">
          <div class="text-sm font-semibold text-primary truncate">${t.judul || t.title || '-'}</div>
          <div class="text-xs text-tertiary truncate">${t.proyek_nama || 'Umum'}</div>
        </div>
        <span class="badge ${priorityClass[t.priority] || 'badge-medium'}" style="font-size:0.65rem">${t.priority || 'medium'}</span>
      </div>
    `).join('')}
  </div>`;
}

// ── Skeleton ─────────────────────────────────────────────────
function renderSkeleton() {
  return `
    <div class="page-header">
      <div class="skeleton" style="height:36px;width:300px;margin-bottom:8px"></div>
      <div class="skeleton" style="height:20px;width:200px"></div>
    </div>
    <div class="kpi-grid">
      ${Array(8).fill(0).map(() => `
        <div class="kpi-card">
          <div class="skeleton" style="height:44px;width:44px;border-radius:10px;margin-bottom:12px"></div>
          <div class="skeleton" style="height:40px;width:60px;margin-bottom:8px"></div>
          <div class="skeleton" style="height:16px;width:100px"></div>
        </div>
      `).join('')}
    </div>
  `;
}

// ── Data Fetchers ────────────────────────────────────────────
async function fetchKPI() {
  const getCount = async (table, filterFn = null) => {
    try {
      let query = supabase.from(table).select('*', { count: 'exact', head: true });
      if (filterFn) query = filterFn(query);
      const { count, error } = await query;
      if (error) throw error;
      return count || 0;
    } catch (e) {
      console.warn(`[Dashboard] Skip ${table}:`, e.message);
      return 0;
    }
  };

  const results = await Promise.all([
    getCount('proyek'),
    getCount('proyek', q => q.eq('status_slf', 'DALAM_PENGKAJIAN')),
    getCount('proyek', q => q.eq('status_slf', 'LAIK_FUNGSI')),
    getCount('proyek', q => q.eq('status_slf', 'LAIK_FUNGSI_BERSYARAT')),
    getCount('proyek', q => q.eq('status_slf', 'TIDAK_LAIK_FUNGSI')),
    getCount('todo_tasks', q => q.eq('status', 'Done')),
    getCount('todo_tasks', q => q.lt('due_date', new Date().toISOString()).neq('status', 'Done')),
    getCount('hasil_analisis'),
    getCount('profiles'),
    // Agregat Aspek & Risiko untuk Chart
    supabase.from('hasil_analisis').select('skor_administrasi, skor_struktur, skor_arsitektur, skor_mep, skor_kebakaran, skor_kesehatan, skor_kenyamanan, skor_kemudahan, risk_level')
  ]);

  const hData = results[9].data || [];
  
  // Hitung distribusi temuan (Skor < 65 dianggap temuan)
  const distribusi = {
    administrasi: hData.filter(d => d.skor_administrasi < 65 && d.skor_administrasi > 0).length,
    struktur: hData.filter(d => d.skor_struktur < 65 && d.skor_struktur > 0).length,
    arsitektur: hData.filter(d => d.skor_arsitektur < 65 && d.skor_arsitektur > 0).length,
    mep: hData.filter(d => (d.skor_mep || d.skor_kebakaran) < 65 && (d.skor_mep || d.skor_kebakaran) > 0).length,
    kebakaran: hData.filter(d => d.skor_kebakaran < 65 && d.skor_kebakaran > 0).length,
    kesehatan: hData.filter(d => d.skor_kesehatan < 65 && d.skor_kesehatan > 0).length,
    kenyamanan: hData.filter(d => d.skor_kenyamanan < 65 && d.skor_kenyamanan > 0).length,
    kemudahan: hData.filter(d => d.skor_kemudahan < 65 && d.skor_kemudahan > 0).length,
  };

  const risiko = {
    low: hData.filter(d => d.risk_level === 'low').length,
    medium: hData.filter(d => d.risk_level === 'medium').length,
    high: hData.filter(d => d.risk_level === 'high').length,
    critical: hData.filter(d => d.risk_level === 'critical').length,
  };

  return {
    totalProyek:   results[0],
    proyekAktif:   results[1],
    laikFungsi:    results[2],
    laikBersyarat: results[3],
    tidakLaik:      results[4],
    taskSelesai:   results[5],
    taskTerlambat: results[6],
    totalAnalisis: results[7],
    memberCount:   results[8] || 4,
    chartData: { distribusi, risiko }
  };
}

async function fetchRecentProjects() {
  try {
    const { data } = await supabase
      .from('proyek')
      .select('id, nama_bangunan, kota, alamat, pemilik, status_slf, progress, latitude, longitude, updated_at')
      .not('latitude', 'is', null) // Prioritaskan yang ada koordinat
      .order('updated_at', { ascending: false })
      .limit(30);
    return data || [];
  } catch { return []; }
}

async function fetchRecentTodos() {
  try {
    const { data } = await supabase
      .from('todo_tasks')
      .select('id, judul, title, priority, status, due_date, proyek_nama')
      .neq('status', 'Done')
      .order('priority', { ascending: false })
      .limit(8);
    return data || [];
  } catch { return []; }
}

// ── After Render: init charts & map ───────────────────────────
export async function afterDashboardRender(kpi) {
  // Dipanggil melalui setTimeout di atas jika diperlukan
}

export function triggerDashboardMount(projects, kpi) {
  setTimeout(() => {
    initCharts(kpi);
    initMap(projects);
  }, 100);
}

function initMap(projects) {
  if (typeof window.L === 'undefined') return;
  const mapEl = document.getElementById('dashboard-map');
  if (!mapEl) return;

  if (window._dashMap) {
    try { window._dashMap.remove(); } catch(e) {}
    window._dashMap = null;
  }

  const map = window.L.map('dashboard-map', { zoomControl: false });
  map.setView([-2.5489, 118.0149], 5); // Indonesia center
  window.L.control.zoom({ position: 'bottomright' }).addTo(map);
  window._dashMap = map;

  window.L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; CARTO',
    subdomains: 'abcd',
    maxZoom: 20
  }).addTo(map);

  const markers = window.L.featureGroup().addTo(map);

  projects.forEach((p) => {
    let lat = p.latitude;
    let lng = p.longitude;
    
    // Default fallback if no coordinates
    if (!lat || !lng) {
       lat = -6.2088 + (Math.random() * 0.1 - 0.05); // Near Jakarta
       lng = 106.8456 + (Math.random() * 0.1 - 0.05);
    }

    const color = p.status_slf === 'LAIK_FUNGSI' ? '#10b981' : 
                  p.status_slf === 'TIDAK_LAIK_FUNGSI' ? '#ef4444' : 
                  p.status_slf === 'LAIK_FUNGSI_BERSYARAT' ? '#f59e0b' : '#3b82f6';
    
    const icon = window.L.divIcon({
      className: 'custom-marker',
      html: `<div style="background:${color}; width:12px; height:12px; border-radius:50%; border:2px solid white; box-shadow:0 0 10px ${color}"></div>`,
      iconSize: [12, 12]
    });

    const mk = window.L.marker([lat, lng], { icon }).addTo(markers);
    
    mk.bindPopup(`
      <div style="font-family:'Outfit',sans-serif; min-width:200px; padding:4px">
        <div style="font-weight:800; color:#1e293b; margin-bottom:4px; font-size:14px">${p.nama_bangunan}</div>
        <div style="font-size:11px; color:#64748b; margin-bottom:10px"><i class="fas fa-location-dot"></i> ${p.kota || 'Lokasi tidak spesifik'}</div>
        <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid #f1f5f9; pt:8px; margin-top:8px">
           <span style="font-size:9px; font-weight:700; text-transform:uppercase; color:${color}">${p.status_slf?.replace(/_/g, ' ')}</span>
           <button class="btn btn-primary btn-xs" onclick="window.navigate('proyek-detail', {id:'${p.id}'})" style="padding:2px 8px; font-size:10px">Detail &rarr;</button>
        </div>
      </div>
    `);
  });

  if (projects.length > 0) {
    const latest = projects[0];
    const hasRealCoords = latest.latitude && latest.longitude;

    setTimeout(() => { 
      try {
        if (!window._dashMap || !document.getElementById('dashboard-map')) return;
        
        if (hasRealCoords) {
          // Fokus ke Proyek Terbaru dengan animasi flyTo (Zoom 15 untuk detail)
          window._dashMap.flyTo([latest.latitude, latest.longitude], 15, {
            animate: true,
            duration: 2
          });
        } else {
          // Fallback ke Fit Bounds jika tidak ada koordinat spesifik di proyek terbaru
          const bounds = markers.getBounds();
          if (bounds.isValid()) {
            window._dashMap.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 }); 
          }
        }
      } catch (err) {
        console.warn("[Dashboard Map] Suppressed focus error:", err.message);
      }
    }, 800);
  }
}

async function initCharts(kpi) {
  if (typeof window.Chart === 'undefined' || !kpi.chartData) return;

  const distribusiCtx = document.getElementById('chart-distribusi');
  const risikoCtx     = document.getElementById('chart-risiko');
  const d = kpi.chartData;

  if (window._distChart) { window._distChart.destroy(); }
  if (window._riskChart) { window._riskChart.destroy(); }

  if (distribusiCtx) {
    window._distChart = new window.Chart(distribusiCtx, {
      type: 'doughnut',
      data: {
        labels: ['Admin', 'Pemanfaatan', 'Arsitektur', 'Struktur', 'MEP', 'Kesehatan', 'Kenyamanan', 'Kemudahan'],
        datasets: [{
          data: [
            d.distribusi.administrasi, d.distribusi.pemanfaatan || 0, d.distribusi.arsitektur,
            d.distribusi.struktur, d.distribusi.mep || d.distribusi.kebakaran, d.distribusi.kesehatan,
            d.distribusi.kenyamanan, d.distribusi.kemudahan
          ],
          backgroundColor: [
            '#3b82f6', '#8b5cf6', '#ef4444', '#f59e0b', '#dc2626', '#10b981', '#f59e0b', '#06b6d4'
          ],
          borderWidth: 0,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: { position: 'right', labels: { color: 'hsl(220,12%,70%)', usePointStyle: true, font: { size: 10 } } },
        },
      },
    });
  }

  if (risikoCtx) {
    window._riskChart = new window.Chart(risikoCtx, {
      type: 'bar',
      data: {
        labels: ['Rendah', 'Sedang', 'Tinggi', 'Kritis'],
        datasets: [{
          data: [d.risiko.low, d.risiko.medium, d.risiko.high, d.risiko.critical],
          backgroundColor: ['#10b981', '#f59e0b', '#ef4444', '#7f1d1d'],
          borderRadius: 8,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } },
          x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
        }
      },
    });
  }
}

// ── Helpers ──────────────────────────────────────────────────
function getGreeting(hour) {
  if (hour < 11) return 'Selamat Pagi';
  if (hour < 15) return 'Selamat Siang';
  if (hour < 18) return 'Selamat Sore';
  return 'Selamat Malam';
}

function formatDate(d) {
  return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

// Expose navigate globally for onclick handlers
window.navigate = navigate;
window.refreshCharts = () => window.location.reload();
