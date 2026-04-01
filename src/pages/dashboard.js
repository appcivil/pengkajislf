// ============================================================
//  DASHBOARD PAGE
//  KPI overview, charts, AI insight, todo monitoring
//  PRESIDENTIAL CLASS (QUARTZ PREMIUM)
// ============================================================
import { supabase } from '../lib/supabase.js';
import { getUserInfo } from '../lib/auth.js';
import { navigate } from '../lib/router.js';
import { APP_CONFIG } from '../lib/config.js';
import { showError } from '../components/toast.js';
import { fetchTeamMembers, fetchTeamWorkload } from '../lib/team-service.js';
import { getGlobalAuditLogs } from '../lib/audit-service.js';

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
    <div id="dashboard-page" style="animation: page-fade-in 0.8s ease-out">
      <!-- Page Header -->
      <div class="page-header" style="margin-bottom: var(--space-8)">
        <div class="flex-between">
          <div>
            <h1 class="page-title" style="font-family:'Outfit', sans-serif; font-weight:800; font-size: 2.2rem; letter-spacing:-0.02em; margin-bottom:4px">
              ${greeting}, <span class="text-gradient-gold">${user?.name?.split(' ')[0] || 'User'}</span>!
            </h1>
            <p class="page-subtitle" style="font-family:var(--font-mono); font-size: 0.75rem; letter-spacing:1px; opacity:0.6; text-transform:uppercase">
              PRESIDENTIAL COMMAND CENTER &bull; <i class="fas fa-calendar-day" style="color:var(--brand-400); margin-right:4px"></i> ${formatDate(now)}
            </p>
          </div>
          <div class="flex gap-4">
            <button class="btn btn-outline" onclick="window.navigate('laporan')" style="height:44px; padding:0 24px; border-radius:12px; font-weight:700">
              <i class="fas fa-file-export" style="margin-right:8px"></i> Export Analytics
            </button>
            <button class="btn-presidential gold" onclick="window.navigate('proyek-baru')" style="height:44px; padding:0 24px; border-radius:12px">
              <i class="fas fa-plus" style="margin-right:8px"></i> Proyek Baru
            </button>
          </div>
        </div>
      </div>

      <!-- KPI Grid -->
      <div class="kpi-grid" style="grid-template-columns: repeat(4, 1fr); gap: var(--space-6)">
        ${renderKPICards(kpi)}
      </div>

      <!-- Main Layout Grid -->
      <div class="grid-main-responsive" style="margin-top:var(--space-8); display:grid; grid-template-columns: 1fr 380px; gap: var(--space-8)">
        
        <!-- Left Column: Operations Map -->
        <div class="card-quartz" style="padding:0; display:flex; flex-direction:column; min-height:600px; border: 1px solid var(--border-strong);">
          <div class="card-header" style="padding: var(--space-5) var(--space-6); border-bottom:1px solid var(--border-subtle); background: hsla(220, 20%, 100%, 0.02); display:flex; justify-content:space-between; align-items:center">
            <div>
              <div class="card-title" style="font-family:'Outfit', sans-serif; font-weight:800; font-size: 1.1rem; letter-spacing: 0.05em">STRATEGIC OPERATIONS MAP</div>
              <div class="card-subtitle" style="font-size: 0.7rem; opacity:0.5; text-transform:uppercase; letter-spacing:1px">Real-time geospatial project distribution</div>
            </div>
            <div style="width:40px; height:40px; border-radius:10px; background:hsla(220, 95%, 52%, 0.1); display:flex; align-items:center; justify-content:center; border:1px solid hsla(220, 95%, 52%, 0.2)">
              <i class="fas fa-earth-asia" style="color:var(--brand-400)"></i>
            </div>
          </div>
          <div id="dashboard-map" style="width:100%; flex:1; filter: contrast(1.1); opacity: 0.9">
             <div class="map-legend-modern" style="bottom:20px; right:20px; background:var(--bg-card); border:1px solid var(--glass-border); backdrop-filter:blur(10px); padding:12px; border-radius:12px; z-index:1000; position:absolute; display:flex; gap:16px;">
                <div class="leg-item" style="display:flex; align-items:center; gap:6px; font-size:10px; font-weight:700; color:white;"><div class="leg-clr" style="width:8px; height:8px; border-radius:50%; background:var(--success-500)"></div> Laik</div>
                <div class="leg-item" style="display:flex; align-items:center; gap:6px; font-size:10px; font-weight:700; color:white;"><div class="leg-clr" style="width:8px; height:8px; border-radius:50%; background:var(--gold-500)"></div> Bersyarat</div>
                <div class="leg-item" style="display:flex; align-items:center; gap:6px; font-size:10px; font-weight:700; color:white;"><div class="leg-clr" style="width:8px; height:8px; border-radius:50%; background:var(--danger-500)"></div> Kritis</div>
                <div class="leg-item" style="display:flex; align-items:center; gap:6px; font-size:10px; font-weight:700; color:white;"><div class="leg-clr" style="width:8px; height:8px; border-radius:50%; background:var(--brand-500)"></div> Aktif</div>
             </div>
          </div>
        </div>

        <!-- Right Column: AI Intel & Activity -->
        <div style="display:flex; flex-direction:column; gap:var(--space-6)">
           <!-- AI Power Panel -->
           <div class="card-quartz" style="padding: var(--space-6); background: var(--gradient-dark); border-color: hsla(220, 95%, 52%, 0.2)">
              <div style="display:flex; align-items:center; gap:16px; margin-bottom: 24px">
                <div style="width:48px; height:48px; border-radius:14px; background:var(--gradient-brand); display:flex; align-items:center; justify-content:center; box-shadow: var(--shadow-sapphire)">
                  <i class="fas fa-brain-circuit" style="color:white; font-size: 1.4rem"></i>
                </div>
                <div>
                  <div style="font-family:'Outfit', sans-serif; font-weight:800; font-size: 1.1rem; color:white">AI PORTFOLIO PULSE</div>
                  <div style="font-size: 0.7rem; color:var(--brand-300); text-transform:uppercase; letter-spacing:1px; font-weight:700">Risk Matrix Analysis</div>
                </div>
              </div>
              
              <div class="radar-wrap" style="height:220px; margin-bottom: 24px">
                 <canvas id="chart-risiko-radar"></canvas>
              </div>
              
              <div style="display:flex; flex-direction:column; gap:8px">
                 ${renderAIInsights(kpi)}
              </div>
           </div>

           <!-- Recent Intel Feed -->
           <div class="card-quartz" style="flex:1">
              <div class="flex-between" style="margin-bottom: 20px">
                 <div class="card-title" style="font-size: 0.9rem; font-weight:700; letter-spacing:0.05em">LIVE AUDIT FEED</div>
                 <i class="fas fa-bolt" style="color:var(--gold-500); font-size: 0.8rem"></i>
              </div>
              ${renderFieldFeed(kpi.logs || [])}
           </div>
        </div>
      </div>

      <!-- Secondary Metrics Grid -->
      <div class="grid-3-1" style="margin-top:var(--space-8); display:grid; grid-template-columns: 1.2fr 1fr 1fr; gap: var(--space-6)">
         <!-- Findings Distribution -->
         <div class="card-quartz">
            <div class="flex-between" style="margin-bottom: 20px">
               <div class="card-title" style="font-size: 0.9rem; font-weight:700">SEBARAN TEMUAN</div>
               <span class="badge" style="background:hsla(220,95%,52%,0.1); color:var(--brand-400); border:1px solid hsla(220,95%,52%,0.2)">TECHNICAL</span>
            </div>
            <div class="chart-wrap" style="height:250px">
               <canvas id="chart-distribusi"></canvas>
            </div>
         </div>
         
         <!-- Team Workload -->
         <div class="card-quartz">
            <div class="card-title" style="font-size: 0.9rem; font-weight:700; margin-bottom:20px">ELITE TEAM WORKLOAD</div>
            <div style="display:flex; flex-direction:column; gap:16px">
               ${workload.slice(0, 5).map(w => `
                 <div>
                    <div class="flex-between mb-2">
                       <span style="font-size: 0.75rem; font-weight:600; color:var(--text-secondary)">${w.full_name}</span>
                       <span style="font-size: 0.7rem; font-weight:700; color:var(--brand-400); font-family:var(--font-mono)">${w.activeProjects} PROJECTS</span>
                    </div>
                    <div class="progress-wrap" style="height:6px; background:hsla(220, 20%, 100%, 0.05); border-radius:10px">
                       <div class="progress-fill" style="width:${Math.min((w.activeProjects / 5) * 100, 100)}%; background:var(--gradient-brand); border-radius:10px; box-shadow: var(--shadow-sapphire)"></div>
                    </div>
                 </div>
               `).join('')}
            </div>
         </div>

         <!-- Active Projects Mini List -->
         <div class="card-quartz" style="grid-column: span 1">
           <div class="flex-between" style="margin-bottom: 20px">
              <div class="card-title" style="font-size: 0.9rem; font-weight:700">RECENT OPS</div>
              <button class="btn btn-ghost btn-xs" onclick="window.navigate('proyek')" style="color:var(--text-tertiary)">VIEW ALL</button>
           </div>
           <div style="display:flex; flex-direction:column; gap:12px">
              ${projects.slice(0, 5).map(p => `
                <div class="flex-between clickable" onclick="window.navigate('proyek-detail', {id:'${p.id}'})" style="padding:8px; border-radius:8px; background:hsla(220, 20%, 100%, 0.02); border:1px solid transparent; transition:all 0.2s">
                   <div style="overflow:hidden">
                      <div style="font-size: 0.8rem; font-weight:700; color:var(--text-primary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis">${p.nama_bangunan}</div>
                      <div style="font-size: 0.65rem; color:var(--text-tertiary); text-transform:uppercase">${p.kota}</div>
                   </div>
                   <div style="font-size: 0.75rem; font-weight:800; color:var(--brand-400)">${p.progress}%</div>
                </div>
              `).join('')}
           </div>
         </div>
      </div>
    </div>
  `;
}

// ── KPI Cards ──────────────────────────────────────────────
function renderKPICards(kpi) {
  const cards = [
    { label: 'OP-COMMAND PORTFOLIO', value: kpi.totalProyek || 0, icon: 'fa-briefcase', color: 'var(--brand-400)', bg: 'hsla(220, 95%, 52%, 0.1)' },
    { label: 'STRUCTURAL COMPLIANCE', value: kpi.laikFungsi || 0, icon: 'fa-shield-check', color: 'var(--success-400)', bg: 'hsla(158, 85%, 45%, 0.1)' },
    { label: 'ACTIVE FIELD OPS', value: kpi.proyekAktif || 0, icon: 'fa-location-dot', color: 'var(--gold-400)', bg: 'hsla(45, 90%, 60%, 0.1)' },
    { label: 'REMEDIAL ACTIONS', value: kpi.tidakLaik || 0, icon: 'fa-triangle-exclamation', color: 'var(--danger-400)', bg: 'hsla(350, 95%, 52%, 0.1)' },
  ];

  return cards.map(c => `
    <div class="card-quartz" style="display:flex; flex-direction:column; gap:16px; min-width:200px; cursor:pointer;" onclick="window.navigate('proyek')">
      <div class="flex-between">
        <div style="width:40px; height:40px; border-radius:10px; background:${c.bg}; display:flex; align-items:center; justify-content:center; border:1px solid ${c.color}33">
          <i class="fas ${c.icon}" style="color:${c.color}; font-size:1.1rem"></i>
        </div>
        <div style="font-family:var(--font-mono); font-size:9px; font-weight:700; color:var(--text-tertiary); letter-spacing:1px">DATA LIVE</div>
      </div>
      <div>
        <div style="font-size: 2.2rem; font-weight:800; color:var(--text-primary); font-family:'Outfit', sans-serif; line-height:1">${c.value}</div>
        <div style="font-size: 0.65rem; font-weight:700; color:var(--text-tertiary); text-transform:uppercase; letter-spacing:1px; margin-top:8px">${c.label}</div>
      </div>
      <div style="height:2px; width:100%; background:hsla(220, 20%, 100%, 0.03); border-radius:2px; margin-top:4px">
        <div style="height:100%; width:70%; background:${c.color}; box-shadow:0 0 10px ${c.color}66; border-radius:2px"></div>
      </div>
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
    <div class="ai-finding ${i.type}" style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.05); border-radius:8px; padding:10px; margin-bottom:8px">
      <i class="fas ${i.type === 'critical' ? 'fa-triangle-exclamation' : i.type === 'warning' ? 'fa-exclamation' : i.type === 'success' ? 'fa-circle-check' : 'fa-circle-info'}" style="margin-right:8px; color:var(--text-tertiary)"></i>
      <span style="font-size:0.75rem; color:var(--text-secondary)">${i.text}</span>
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
    <div class="page-header" style="margin-bottom: var(--space-8)">
      <div class="skeleton" style="height:48px;width:400px;margin-bottom:12px"></div>
      <div class="skeleton" style="height:20px;width:250px"></div>
    </div>
    <div class="kpi-grid">
      ${Array(4).fill(0).map(() => `
        <div class="card-quartz" style="height:160px">
          <div class="skeleton" style="height:40px;width:40px;border-radius:10px;margin-bottom:12px"></div>
          <div class="skeleton" style="height:40px;width:80px;margin-bottom:8px"></div>
          <div class="skeleton" style="height:16px;width:120px"></div>
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
    getCount('profiles')
  ]);

  const [hRes, logs] = await Promise.all([
    supabase.from('hasil_analisis').select('skor_administrasi, skor_struktur, skor_arsitektur, skor_mep, skor_kebakaran, skor_kesehatan, skor_kenyamanan, skor_kemudahan, risk_level'),
    getGlobalAuditLogs()
  ]);

  const hData = hRes.data || [];
  
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
    chartData: { distribusi },
    logs: logs
  };
}

async function fetchRecentProjects() {
  try {
    const { data } = await supabase
      .from('proyek')
      .select('id, nama_bangunan, kota, alamat, pemilik, status_slf, progress, latitude, longitude, updated_at')
      .not('latitude', 'is', null)
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

export function triggerDashboardMount(projects, kpi) {
  setTimeout(async () => {
    initCharts(kpi);
    await initMap(projects);
  }, 100);
}

async function geocodeAddress(address) {
  if (!address) return null;
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`;
    const res = await fetch(url, { headers: { 'Accept-Language': 'id' } });
    const data = await res.json();
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      };
    }
  } catch (err) {
    console.warn("[Geocode] Failed for:", address, err.message);
  }
  return null;
}

async function initMap(projects) {
  if (typeof window.L === 'undefined') return;
  const mapEl = document.getElementById('dashboard-map');
  if (!mapEl) return;

  if (window._dashMap) {
    try { window._dashMap.remove(); } catch(e) {}
    window._dashMap = null;
  }

  const map = window.L.map('dashboard-map', { 
    zoomControl: false,
    scrollWheelZoom: true,
    maxZoom: 19
  });
  
  map.setView([-2.5489, 118.0149], 5); 
  window.L.control.zoom({ position: 'bottomright' }).addTo(map);
  window._dashMap = map;

  window.L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; CARTO',
    subdomains: 'abcd',
    maxZoom: 20
  }).addTo(map);

  const markers = window.L.featureGroup().addTo(map);

  const markerPromises = projects.map(async (p) => {
    let lat = p.latitude;
    let lng = p.longitude;
    
    if (!lat || !lng || lat === 0) {
       const geo = await geocodeAddress(p.alamat || p.kota);
       if (geo) {
          lat = geo.lat;
          lng = geo.lng;
       } else {
          lat = -6.2088 + (Math.random() * 0.1 - 0.05);
          lng = 106.8456 + (Math.random() * 0.1 - 0.05);
       }
    }

    const statusConfig = {
      'LAIK_FUNGSI':           { color: 'var(--success-500)', icon: '\uf00c' },
      'TIDAK_LAIK_FUNGSI':     { color: 'var(--danger-500)', icon: '\uf00d' },
      'LAIK_FUNGSI_BERSYARAT': { color: 'var(--gold-500)', icon: '\uf071' },
      'DALAM_PENGKAJIAN':      { color: 'var(--brand-500)', icon: '\uf017' }
    };
    
    const cfg = statusConfig[p.status_slf] || { color: '#8b5cf6', icon: '\uf1ad' };

    const icon = window.L.divIcon({
      className: 'modern-marker-wrap',
      html: `
        <div style="position:relative; width:32px; height:40px; display:flex; align-items:center; justify-content:center;">
           <svg width="32" height="40" viewBox="0 0 24 30" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 0C5.37 0 0 5.37 0 12C0 21 12 30 12 30C12 30 24 21 24 12C24 5.37 18.63 0 12 0Z" fill="${cfg.color}" stroke="white" stroke-width="1.5"/>
              <circle cx="12" cy="12" r="8" fill="white" fill-opacity="0.2"/>
              <text x="12" y="16" font-family="'Font Awesome 6 Free'" font-weight="900" font-size="10px" fill="white" text-anchor="middle">${cfg.icon}</text>
           </svg>
        </div>
      `,
      iconSize: [32, 40],
      iconAnchor: [16, 40],
      popupAnchor: [0, -40]
    });

    const mk = window.L.marker([lat, lng], { icon }).addTo(markers);
    
    mk.bindPopup(`
      <div style="font-family:'Outfit',sans-serif; min-width:200px; padding:4px">
        <div style="font-weight:800; color:#1e293b; margin-bottom:4px; font-size:14px">${p.nama_bangunan}</div>
        <div style="font-size:11px; color:#64748b; margin-bottom:10px"><i class="fas fa-location-dot"></i> ${p.alamat || p.kota || 'Lokasi tidak spesifik'}</div>
        <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid #f1f5f9; padding-top:8px; margin-top:8px">
           <span style="font-size:9px; font-weight:700; text-transform:uppercase; color:${cfg.color}">${p.status_slf?.replace(/_/g, ' ')}</span>
           <button class="btn btn-primary btn-xs" onclick="window.navigate('proyek-detail', {id:'${p.id}'})" style="padding:4px 10px; font-size:10px;">Detail &rarr;</button>
        </div>
      </div>
    `);
    
    return { lat, lng };
  });

  const resolvedCoords = await Promise.all(markerPromises);

  if (projects.length > 0) {
    const latestCoord = resolvedCoords[0];
    setTimeout(() => { 
      try {
        if (!window._dashMap || !document.getElementById('dashboard-map')) return;
        if (latestCoord && latestCoord.lat) {
          window._dashMap.flyTo([latestCoord.lat, latestCoord.lng], 18, { animate: true, duration: 2.5 });
        }
      } catch (err) {}
    }, 1000);
  }
}

async function initCharts(kpi) {
  if (typeof window.Chart === 'undefined' || !kpi.chartData) return;

  const distribusiCtx = document.getElementById('chart-distribusi');
  const radarCtx      = document.getElementById('chart-risiko-radar');
  const d = kpi.chartData;

  if (window._distChart) { window._distChart.destroy(); }
  if (window._radarChart) { window._radarChart.destroy(); }

  const gold = 'hsl(45, 90%, 60%)';
  const sapphire = 'hsl(220, 95%, 52%)';

  if (radarCtx) {
     window._radarChart = new window.Chart(radarCtx, {
        type: 'radar',
        data: {
           labels: ['STRUKTUR', 'ARSITEKTUR', 'ADMIN', 'MEP', 'KESEHATAN', 'KENYAMANAN'],
           datasets: [{
              label: 'Risk Pulse',
              data: [
                 100 - (d.distribusi.struktur * 10), 
                 100 - (d.distribusi.arsitektur * 10),
                 100 - (d.distribusi.administrasi * 10),
                 100 - (d.distribusi.mep * 10),
                 100 - (d.distribusi.kesehatan * 10),
                 100 - (d.distribusi.kenyamanan * 10)
              ],
              fill: true,
              backgroundColor: 'rgba(220, 95, 52, 0.15)',
              borderColor: sapphire,
              pointBackgroundColor: gold,
              pointBorderColor: '#fff',
              pointBorderWidth: 2,
              tension: 0.2
           }]
        },
        options: {
           scales: {
              r: {
                 angleLines: { color: 'rgba(255,255,255,0.05)' },
                 grid: { color: 'rgba(255,255,255,0.05)' },
                 pointLabels: { 
                   color: 'rgba(255,255,255,0.5)', 
                   font: { family: 'var(--font-mono)', size: 9, weight: 'bold' } 
                 },
                 ticks: { display: false },
                 suggestedMin: 0, suggestedMax: 100
              }
           },
           plugins: { legend: { display: false } }
        }
     });
  }

  if (distribusiCtx) {
    window._distChart = new window.Chart(distribusiCtx, {
      type: 'doughnut',
      data: {
        labels: ['Admin', 'Arsitektur', 'Struktur', 'MEP', 'Kesehatan', 'Kenyamanan', 'Kemudahan'],
        datasets: [{
          data: [
            d.distribusi.administrasi, d.distribusi.arsitektur,
            d.distribusi.struktur, d.distribusi.mep || d.distribusi.kebakaran, d.distribusi.kesehatan,
            d.distribusi.kenyamanan, d.distribusi.kemudahan
          ],
          backgroundColor: [
            '#3b82f6', '#ef4444', '#f59e0b', '#dc2626', '#10b981', '#f59e0b', '#06b6d4'
          ],
          hoverOffset: 15,
          borderWidth: 0,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '82%',
        plugins: {
          legend: { 
            position: 'right', 
            labels: { 
              color: 'rgba(255,255,255,0.7)', 
              usePointStyle: true, 
              padding: 20,
              font: { family: 'var(--font-sans)', size: 10, weight: '600' } 
            } 
          },
        },
      },
    });
  }
}

function renderFieldFeed(logs) {
   if (!logs || !logs.length) {
      return `<div class="empty-state" style="padding:40px"><p class="text-xs text-tertiary">Belum ada aktivitas tercatat.</p></div>`;
   }

   return `<div class="field-feed">
     ${logs.map(log => {
        const actionMap = {
           'FINALISASI_DOKUMEN': { icon: 'fa-shield-halved', label: 'Penyegelan Dokumen', color: 'var(--success-400)' },
           'TTE_SIGNATURE':       { icon: 'fa-pen-nib',       label: 'Tanda Tangan TTE', color: 'var(--brand-400)' },
           'VERSI_LAPORAN_BARU': { icon: 'fa-file-pdf',      label: 'Generasi Laporan', color: 'var(--danger-400)' },
           'LOGIN':               { icon: 'fa-user-clock',    label: 'Akses Sistem',     color: 'var(--text-tertiary)' }
        };
        const cfg = actionMap[log.action] || { icon: 'fa-clock', label: log.action, color: 'var(--text-tertiary)' };
        
        const diff = new Date() - new Date(log.created_at);
        const mins = Math.floor(diff / 60000);
        const timeStr = mins < 1 ? 'Just now' : mins < 60 ? `${mins}m ago` : `${Math.floor(mins/60)}h ago`;

        return `
          <div class="feed-item" style="display:flex; align-items:center; gap:12px; margin-bottom:16px;">
             <div class="feed-item-icon" style="width:32px; height:32px; border-radius:8px; background:hsla(220, 20%, 100%, 0.03); display:flex; align-items:center; justify-content:center; color:${cfg.color}; border:1px solid hsla(220, 20%, 100%, 0.05)"><i class="fas ${cfg.icon}" style="font-size:0.8rem"></i></div>
             <div style="flex:1; overflow:hidden">
                <div style="font-size: 0.75rem; font-weight: 700; color: var(--text-primary)">${cfg.label}</div>
                <div style="font-size: 0.65rem; color: var(--text-tertiary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis">${log.proyek?.nama_bangunan || 'Ops System'}</div>
             </div>
             <div style="font-size: 9px; color: var(--text-tertiary); opacity:0.5; font-family:var(--font-mono)">${timeStr}</div>
          </div>
        `;
     }).join('')}
   </div>`;
}

function getGreeting(hour) {
  if (hour < 11) return 'Selamat Pagi';
  if (hour < 15) return 'Selamat Siang';
  if (hour < 18) return 'Selamat Sore';
  return 'Selamat Malam';
}

function formatDate(d) {
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

window.navigate = navigate;
window.refreshCharts = () => window.location.reload();
