// ============================================================
//  PLACEHOLDER PAGE GENERATOR
//  Used for pages under development
// ============================================================
import { navigate } from '../lib/router.js';

export function placeholderPage({ title, icon, description, links = [] }) {
  return `
    <div>
      <div class="page-header">
        <h1 class="page-title">
          <i class="fas ${icon}" style="color:var(--brand-400);margin-right:10px"></i>${title}
        </h1>
        <p class="page-subtitle">${description}</p>
      </div>

      <div class="card" style="text-align:center;padding:var(--space-12)">
        <div style="width:80px;height:80px;background:var(--gradient-brand);border-radius:var(--radius-xl);display:flex;align-items:center;justify-content:center;font-size:2rem;color:white;margin:0 auto var(--space-5);animation:float 4s ease-in-out infinite">
          <i class="fas ${icon}"></i>
        </div>
        <h2 style="font-size:1.4rem;font-weight:700;margin-bottom:var(--space-3)">${title}</h2>
        <p style="color:var(--text-secondary);max-width:440px;margin:0 auto var(--space-6)">
          Halaman ini sedang dalam pengembangan aktif. Fitur akan segera tersedia.
        </p>

        ${links.length ? `
          <div class="flex gap-3" style="justify-content:center;flex-wrap:wrap">
            ${links.map(l => `
              <button class="btn btn-secondary" onclick="window.navigate('${l.route}')">
                <i class="fas ${l.icon}"></i> ${l.label}
              </button>
            `).join('')}
          </div>
        ` : `
          <button class="btn btn-primary" onclick="window.navigate('dashboard')">
            <i class="fas fa-home"></i> Kembali ke Dashboard
          </button>
        `}

        <!-- Coming soon features preview -->
        <div style="margin-top:var(--space-8);display:grid;grid-template-columns:repeat(3,1fr);gap:var(--space-4);text-align:left;max-width:600px;margin-left:auto;margin-right:auto">
          ${getFeaturesByPage(title).map(f => `
            <div style="background:var(--bg-elevated);border:1px solid var(--border-subtle);border-radius:var(--radius-md);padding:var(--space-4)">
              <i class="fas ${f.icon}" style="color:var(--brand-400);margin-bottom:8px;font-size:1.1rem"></i>
              <div style="font-size:0.8rem;font-weight:600;color:var(--text-primary);margin-bottom:4px">${f.title}</div>
              <div style="font-size:0.75rem;color:var(--text-tertiary)">${f.desc}</div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

function getFeaturesByPage(title) {
  const map = {
    'Checklist': [
      { icon: 'fa-clipboard-list',  title: 'Checklist Administrasi', desc: 'Dokumen perizinan & legalitas' },
      { icon: 'fa-building',        title: 'Checklist Teknis',       desc: 'Struktur, Arsitektur, MEP' },
      { icon: 'fa-camera',          title: 'Dokumentasi Foto',       desc: 'Upload bukti lapangan' },
    ],
    'Analisis AI': [
      { icon: 'fa-brain',           title: 'Rule-based AI',          desc: 'Berbasis NSPK & SNI' },
      { icon: 'fa-chart-pie',       title: 'Risk Scoring',           desc: 'Low/Medium/High/Critical' },
      { icon: 'fa-file-alt',        title: 'Auto Rekomendasi',       desc: 'Saran tindak perbaikan' },
    ],
    'Multi-Agent Analysis': [
      { icon: 'fa-network-wired',   title: 'Agent Struktur',         desc: 'ASCE/SEI 41-17 analysis' },
      { icon: 'fa-fire-extinguisher', title: 'Agent Keselamatan',    desc: 'Fire safety analysis' },
      { icon: 'fa-sync',            title: 'Aggregator',             desc: 'Konsolidasi hasil AI' },
    ],
    'Laporan Kajian SLF': [
      { icon: 'fa-file-pdf',        title: 'Export PDF',             desc: 'Laporan siap cetak' },
      { icon: 'fa-file-word',       title: 'Google Docs',            desc: 'Template profesional' },
      { icon: 'fa-presentation-screen', title: 'Presentasi',         desc: 'Slide eksekutif' },
    ],
    'TODO Board': [
      { icon: 'fa-columns',         title: 'Kanban Board',           desc: 'Drag & drop tasks' },
      { icon: 'fa-bell',            title: 'Reminder',               desc: 'Notifikasi deadline' },
      { icon: 'fa-link',            title: 'Link ke Proyek',         desc: 'Tasks per proyek' },
    ],
    'Executive Dashboard': [
      { icon: 'fa-chart-line',      title: 'Analytics',              desc: 'Tren & statistik' },
      { icon: 'fa-gauge',           title: 'KPI Overview',           desc: 'Ringkasan eksekutif' },
      { icon: 'fa-clock-rotate-left', title: 'Timeline',             desc: 'Histori pengkajian' },
    ],
  };

  return map[title] || [
    { icon: 'fa-wrench',  title: 'Sedang Dikembangkan', desc: 'Fitur segera hadir' },
    { icon: 'fa-rocket',  title: 'Coming Soon',          desc: 'Stay tuned' },
    { icon: 'fa-stars',   title: 'Premium Feature',      desc: 'Eksklusif AI engine' },
  ];
}
