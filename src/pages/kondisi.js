// ============================================================
//  PEMERIKSAAN KONDISI PAGE (PERMEN PU 16/2010)
//  Menghitung Tingkat Kerusakan Bangunan berdasarkan bobot
// ============================================================
import { supabase } from '../lib/supabase.js';
import { navigate } from '../lib/router.js';
import { showSuccess, showError } from '../components/toast.js';
import { confirm } from '../components/modal.js';

// ── Standards Data ───────────────────────────────────────────
function getKomponenKondisi(jumlahLantai = 1) {
  const isMultiFloor = jumlahLantai >= 2;
  const isHighRise   = jumlahLantai >= 3;

  const strukturItems = [
    { id: 's1', nama: 'Pondasi', bobot: 10 },
    { id: 's2', nama: 'Kolom', bobot: isHighRise ? 10 : 15 },
    { id: 's3', nama: 'Balok', bobot: isHighRise ? 10 : 10 },
    { id: 's4', nama: 'Plat Lantai', bobot: isMultiFloor ? 10 : 0 },
    { id: 's5', nama: 'Rangka Atap', bobot: isHighRise ? 5 : (isMultiFloor ? 0 : 10) },
    { id: 's6', nama: 'Tangga Struktur', bobot: isMultiFloor ? 5 : 0 }
  ].filter(i => i.bobot > 0);

  // Normalize Struktur to exactly 45% if rounding issues occur, but here they sum correctly
  // s1(10)+s2(15)+s3(10)+s5(10) = 45 (1 floor)
  // s1(10)+s2(15)+s3(10)+s4(10)          = 45 (Wait, s6 missing? Let's refine)

  // REFINED WEIGHTING (Always sum to 45, 30, 25)
  let s = [];
  if (jumlahLantai === 1) {
    s = [
      { id: 's1', nama: 'Pondasi', bobot: 15 },
      { id: 's2', nama: 'Kolom & Balok', bobot: 20 },
      { id: 's3', nama: 'Rangka Atap', bobot: 10 }
    ];
  } else if (jumlahLantai === 2) {
    s = [
      { id: 's1', nama: 'Pondasi', bobot: 10 },
      { id: 's2', nama: 'Kolom & Balok', bobot: 15 },
      { id: 's3', nama: 'Plat Lantai', bobot: 10 },
      { id: 's4', nama: 'Tangga Struktur', bobot: 5 },
      { id: 's5', nama: 'Rangka Atap', bobot: 5 }
    ];
  } else {
    s = [
      { id: 's1', nama: 'Pondasi', bobot: 10 },
      { id: 's2', nama: 'Kolom & Balok', bobot: 10 },
      { id: 's3', nama: 'Plat Lantai', bobot: 10 },
      { id: 's4', nama: 'Tangga & Core Wall', bobot: 10 },
      { id: 's5', nama: 'Rangka Atap', bobot: 5 }
    ];
  }

  let a = [];
  if (jumlahLantai === 1) {
    a = [
      { id: 'a1', nama: 'Dinding / Finishing', bobot: 15 },
      { id: 'a2', nama: 'Plafon & Lantai', bobot: 10 },
      { id: 'a3', nama: 'Pintu & Jendela', bobot: 5 }
    ];
  } else {
    a = [
      { id: 'a1', nama: 'Fasad & Dinding', bobot: 10 },
      { id: 'a2', nama: 'Plafon', bobot: 5 },
      { id: 'a3', nama: 'Lantai', bobot: 5 },
      { id: 'a4', nama: 'Kusen / Pintu / Jendela', bobot: 5 },
      { id: 'a5', nama: 'Atap (Penutup)', bobot: 5 }
    ];
  }

  let u = [];
  if (jumlahLantai < 3) {
    u = [
      { id: 'u1', nama: 'Instalasi Listrik', bobot: 10 },
      { id: 'u2', nama: 'Air Bersih & Sanitasi', bobot: 10 },
      { id: 'u3', nama: 'Proteksi Kebakaran (APAR/Hydrant)', bobot: 5 }
    ];
  } else {
    u = [
      { id: 'u1', nama: 'Listrik & Pencahayaan', bobot: 5 },
      { id: 'u2', nama: 'Plambing & Sanitasi', bobot: 5 },
      { id: 'u3', nama: 'Sistem Kebakaran Aktif', bobot: 5 },
      { id: 'u4', nama: 'Lift / Escalator', bobot: 5 },
      { id: 'u5', nama: 'Tata Udara (AC Central/Ducting)', bobot: 5 }
    ];
  }

  return [
    { id: 'struktur', nama: 'STRUKTUR', bobot_total: 45, items: s },
    { id: 'arsitektur', nama: 'ARSITEKTUR', bobot_total: 30, items: a },
    { id: 'utilitas', nama: 'UTILITAS / MEP', bobot_total: 25, items: u }
  ];
}

// ── Page Entry ────────────────────────────────────────────────
export async function kondisiPage(params = {}) {
  const id = params.id;
  if (!id) { navigate('proyek'); return ''; }

  const root = document.getElementById('page-root');
  if (root) root.innerHTML = renderSkeleton();

  const [proyek, existingData, lastAnalisis] = await Promise.all([
    fetchProyek(id),
    fetchKondisiData(id),
    fetchLastAnalisis(id)
  ]);

  if (!proyek) { navigate('proyek'); showError('Proyek tidak ditemukan.'); return ''; }

  window._kondisiProyekId = id;
  window._kondisiJumlahLantai = proyek.jumlah_lantai || 1;
  window._kondisiLastAnalisis = lastAnalisis;
  
  // Generate dynamic components
  const komponenDinamis = getKomponenKondisi(window._kondisiJumlahLantai);
  window._komponenDinamis = komponenDinamis;

  // Map existing scores
  const scoreMap = {};
  (existingData || []).forEach(d => {
    if (d.metadata && d.metadata.bobot_item !== undefined) {
      scoreMap[d.kode] = d.metadata.persentase_kerusakan || 0;
    }
  });

  window._kondisiScoreMap = scoreMap;

  const html = buildHtml(proyek);
  if (root) {
    root.innerHTML = html;
    initKondisiLogic();
  }
  return html;
}

// ── HTML Builder ──────────────────────────────────────────────
function buildHtml(proyek) {
  const fl = window._kondisiJumlahLantai;
  const badgeLantai = fl >= 3 ? 'badge-tidak-laik' : fl >= 2 ? 'badge-bersyarat' : 'badge-laik';

  return `
    <div id="kondisi-page">
      <div class="page-header">
        <div class="flex-between">
          <div>
            <button class="btn btn-ghost btn-sm" onclick="window.navigate('proyek-detail',{id:'${proyek.id}'})" style="margin-bottom:8px">
              <i class="fas fa-arrow-left"></i> Kembali ke Proyek
            </button>
            <h1 class="page-title">Pemeriksaan Kondisi Bangunan</h1>
            <div style="display:flex; align-items:center; gap:12px; margin-top:4px">
               <p class="page-subtitle">Penilaian Tingkat Kerusakan Sesuai Permen PU No. 16/PRT/M/2010</p>
               <span class="badge ${badgeLantai}" style="font-size:0.7rem">Jumlah Lantai: ${fl}</span>
            </div>
          </div>
          <div class="flex gap-3">
             <button class="btn btn-secondary" onclick="window._pullAIData()">
               <i class="fas fa-robot"></i> Ambil Data AI
             </button>
             <button class="btn btn-primary" onclick="window._saveKondisi()">
               <i class="fas fa-save"></i> Simpan Penilaian
             </button>
          </div>
        </div>
      </div>

      <div class="grid-main-responsive" style="display:grid; grid-template-columns: 1fr 340px; gap:var(--space-6)">
        
        <!-- Left: Scoring Form -->
        <div style="display:flex; flex-direction:column; gap:var(--space-5)">
          ${window._komponenDinamis.map(group => `
            <div class="card" style="padding:0; overflow:hidden">
              <div class="card-header" style="background:var(--bg-elevated); padding:var(--space-4) var(--space-5); border-bottom:1px solid var(--border-subtle); display:flex; justify-content:space-between; align-items:center">
                <div style="display:flex; align-items:center; gap:12px">
                   <div style="width:10px; height:10px; border-radius:50%; background:${group.id === 'struktur' ? 'var(--danger-400)' : group.id === 'arsitektur' ? 'var(--brand-400)' : 'var(--blue-400)'}"></div>
                   <span class="font-bold text-primary">${group.nama} (Bobot ${group.bobot_total}%)</span>
                </div>
                <div class="text-xs font-bold text-tertiary" id="subtotal-${group.id}">Subtotal: 0.00%</div>
              </div>
              <div style="padding:var(--space-4) var(--space-5)">
                <table style="width:100%; border-collapse:collapse">
                  <thead>
                    <tr style="text-align:left; font-size:0.75rem; color:var(--text-tertiary); text-transform:uppercase">
                      <th style="padding:8px 0; font-weight:700">Item Pekerjaan</th>
                      <th style="padding:8px 0; font-weight:700; text-align:center; width:80px">Bobot (%)</th>
                      <th style="padding:8px 0; font-weight:700; width:180px">Tingkat Kerusakan</th>
                      <th style="padding:8px 0; font-weight:700; text-align:right; width:100px">Skor Akhir</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${group.items.map(item => {
                      const savedVal = window._kondisiScoreMap[item.id] || 0;
                      return `
                        <tr style="border-bottom:1px solid var(--border-subtle)">
                          <td style="padding:12px 0; font-size:var(--text-sm); font-weight:600; color:var(--text-secondary)">${item.nama}</td>
                          <td style="padding:12px 0; font-size:var(--text-sm); text-align:center; color:var(--text-tertiary)">${item.bobot}%</td>
                          <td style="padding:12px 0">
                            <div style="display:flex; align-items:center; gap:10px">
                              <input type="range" min="0" max="100" step="1" 
                                     class="kondisi-slider" 
                                     id="slider-${item.id}" 
                                     data-id="${item.id}" 
                                     data-bobot="${item.bobot}"
                                     data-group="${group.id}"
                                     value="${savedVal}"
                                     oninput="window._updateItemValue('${item.id}')">
                              <input type="number" min="0" max="100" 
                                     id="input-${item.id}" 
                                     value="${savedVal}"
                                     style="width:50px; padding:4px; border:1px solid var(--border-subtle); border-radius:4px; font-size:0.75rem; text-align:center"
                                     onchange="window._updateItemInput('${item.id}')">
                              <span style="font-size:0.75rem">%</span>
                            </div>
                          </td>
                          <td style="padding:12px 0; text-align:right; font-weight:bold; color:var(--text-primary)" id="result-${item.id}">
                            ${((savedVal / 100) * item.bobot).toFixed(2)}%
                          </td>
                        </tr>
                      `;
                    }).join('')}
                  </tbody>
                </table>
              </div>
            </div>
          `).join('')}
        </div>

        <!-- Right: Summary Dashboard -->
        <div style="display:flex; flex-direction:column; gap:var(--space-5)">
          
          <div class="card" style="position:sticky; top:20px; border-top: 4px solid var(--brand-500)">
            <div class="card-title" style="margin-bottom:var(--space-4)">Ringkasan Penilaian</div>
            
            <div style="background:var(--bg-elevated); border-radius:var(--radius-lg); padding:var(--space-5); text-align:center; margin-bottom:var(--space-4)">
               <div class="text-xs text-tertiary font-bold uppercase mb-2">Tingkat Kerusakan Total</div>
               <div id="kerusakan-total-display" style="font-size:2.5rem; font-weight:900; color:var(--brand-500); line-height:1">0.00%</div>
               <div id="kategori-kerusakan-badge" class="badge badge-laik" style="margin-top:12px; padding:6px 16px; font-size:0.8rem">BAIK / RINGAN</div>
            </div>

            <div style="display:flex; flex-direction:column; gap:12px">
               <div class="flex-between">
                  <span class="text-sm text-tertiary">Indeks Kondisi Fisik (IKF)</span>
                  <span class="text-sm font-bold text-primary" id="ikf-display">100.00</span>
               </div>
               <div class="progress-wrap" style="height:6px">
                  <div class="progress-fill green" id="ikf-progress" style="width:100%"></div>
               </div>

               <div style="margin-top:12px; padding-top:12px; border-top:1px solid var(--border-subtle)">
                 <div class="text-xs text-tertiary font-bold mb-3 uppercase">Komposisi Kerusakan</div>
                 ${window._komponenDinamis.map(g => `
                   <div style="margin-bottom:8px">
                      <div class="flex-between text-xs mb-1">
                        <span>${g.nama}</span>
                        <span id="summary-val-${g.id}">0.00%</span>
                      </div>
                      <div class="progress-wrap" style="height:4px">
                        <div class="progress-fill ${g.id === 'struktur' ? 'red' : 'blue'}" id="summary-bar-${g.id}" style="width:0%"></div>
                      </div>
                   </div>
                 `).join('')}
               </div>

               <div style="margin-top:12px; padding:12px; background:rgba(59,130,246,0.1); border-radius:8px; border-left:3px solid var(--brand-400)">
                 <p class="text-xs text-secondary" style="line-height:1.4">
                   <i class="fas fa-info-circle" style="margin-right:6px"></i>
                   Komponen dinilai berdasarkan <strong>Bangunan Lantai ${fl}</strong>. Gunakan tombol Ambil Data AI jika Anda sudah menjalankan analisis AI sebelumnya.
                 </p>
               </div>
            </div>
          </div>
          
        </div>

      </div>
    </div>
  `;
}

// ── Logic ─────────────────────────────────────────────────────
function initKondisiLogic() {
  window._updateItemValue = (id) => {
    const slider = document.getElementById(`slider-${id}`);
    const input = document.getElementById(`input-${id}`);
    const result = document.getElementById(`result-${id}`);
    
    if (!slider || !input || !result) return;

    const val = parseInt(slider.value);
    const bobot = parseFloat(slider.dataset.bobot);
    
    input.value = val;
    result.innerText = ((val / 100) * bobot).toFixed(2) + '%';
    
    updateTotals();
  };

  window._updateItemInput = (id) => {
    const slider = document.getElementById(`slider-${id}`);
    const input = document.getElementById(`input-${id}`);
    
    let val = parseInt(input.value) || 0;
    if (val < 0) val = 0;
    if (val > 100) val = 100;
    
    input.value = val;
    slider.value = val;
    window._updateItemValue(id);
  };

  function updateTotals() {
    let grandTotal = 0;
    const groupTotals = { struktur: 0, arsitektur: 0, utilitas: 0 };

    document.querySelectorAll('.kondisi-slider').forEach(s => {
      const val = parseInt(s.value);
      const bobot = parseFloat(s.dataset.bobot);
      const group = s.dataset.group;
      
      const weighted = (val / 100) * bobot;
      groupTotals[group] += weighted;
      grandTotal += weighted;
    });

    // Update UI Group Subtotals
    Object.keys(groupTotals).forEach(gid => {
      const el = document.getElementById(`subtotal-${gid}`);
      const summaryVal = document.getElementById(`summary-val-${gid}`);
      const summaryBar = document.getElementById(`summary-bar-${gid}`);
      
      const valText = groupTotals[gid].toFixed(2) + '%';
      if (el) el.innerText = 'Subtotal: ' + valText;
      if (summaryVal) summaryVal.innerText = valText;
      
      const groupDef = window._komponenDinamis.find(g => g.id === gid);
      if (groupDef && summaryBar) {
        summaryBar.style.width = (groupTotals[gid] / groupDef.bobot_total * 100) + '%';
      }
    });

    const displayTotal = document.getElementById('kerusakan-total-display');
    const badge = document.getElementById('kategori-kerusakan-badge');
    const ikfDisplay = document.getElementById('ikf-display');
    const ikfProgress = document.getElementById('ikf-progress');

    if (displayTotal) displayTotal.innerText = grandTotal.toFixed(2) + '%';
    if (ikfDisplay) ikfDisplay.innerText = (100 - grandTotal).toFixed(2);
    if (ikfProgress) ikfProgress.style.width = (100 - grandTotal) + '%';

    if (badge) {
      if (grandTotal <= 30) {
        badge.innerText = 'BAIK / RUSAK RINGAN'; badge.className = 'badge badge-laik';
        displayTotal.style.color = 'var(--brand-500)';
      } else if (grandTotal <= 45) {
        badge.innerText = 'RUSAK SEDANG'; badge.className = 'badge badge-bersyarat';
        displayTotal.style.color = 'var(--warning-500)';
      } else {
        badge.innerText = 'RUSAK BERAT'; badge.className = 'badge badge-tidak-laik';
        displayTotal.style.color = 'var(--danger-500)';
      }
    }
  }

  updateTotals();
}

// ── AI Sync ───────────────────────────────────────────────────
window._pullAIData = async () => {
  const ai = window._kondisiLastAnalisis;
  if (!ai) return showError('Lakukan "Analisis AI" terlebih dahulu untuk menarik data kelaikan.');

  const ok = await confirm({
    title: 'Ambil Data AI',
    message: 'Data AI (Skor Kelaikan) akan dikonversi menjadi Estimasi Kerusakan Fisik. Data manual yang Anda isi sebelumnya akan ditimpa. Lanjutkan?',
    confirmText: 'Ya, Sinkronkan AI',
  });
  if (!ok) return;

  // Formula: % Kerusakan = 100 - Skor Aspek AI
  const damageMapping = {
    struktur: 100 - (ai.skor_struktur || 0),
    arsitektur: 100 - (ai.skor_arsitektur || 0),
    utilitas: 100 - (ai.skor_mep || 0)
  };

  document.querySelectorAll('.kondisi-slider').forEach(s => {
    const group = s.dataset.group;
    const val = damageMapping[group] || 0;
    s.value = val;
    window._updateItemValue(s.dataset.id);
  });

  showSuccess('Sinkronisasi AI berhasil dilakukan!');
};

// ── Persistence ───────────────────────────────────────────────
window._saveKondisi = async () => {
  const proyekId = window._kondisiProyekId;
  const items = [];
  
  let grandTotalDamage = 0;
  const groupDamage = { struktur: 0, arsitektur: 0, utilitas: 0 };

  document.querySelectorAll('.kondisi-slider').forEach(s => {
    const id = s.dataset.id;
    const val = parseInt(s.value);
    const bobot = parseFloat(s.dataset.bobot);
    const group = s.dataset.group;
    
    // Mapping for AI Analysis Integration
    const aspectMap = { 
      'struktur': 'Struktur', 
      'arsitektur': 'Arsitektur', 
      'utilitas': 'Mekanikal' 
    };

    const weighted = (val / 100) * bobot;
    groupDamage[group] += weighted;
    grandTotalDamage += weighted;

    items.push({
      proyek_id: proyekId,
      kode: id,
      nama: s.closest('tr').cells[0].innerText, // Capture name from table cell
      kategori: 'kondisi_fisik',
      aspek: aspectMap[group] || 'Lainnya',
      status: val === 0 ? 'baik' : val <= 30 ? 'ringan' : val <= 45 ? 'sedang' : 'berat',
      metadata: {
        persentase_kerusakan: val,
        bobot_item: bobot,
        weighted_score: weighted,
        is_dynamic: true,
        floor_context: window._kondisiJumlahLantai,
        last_updated: new Date().toISOString()
      },
      catatan: `Persentase kerusakan: ${val}%. Bobot elemen: ${bobot}%.`
    });
  });

  try {
    const btn = document.querySelector('.btn-primary');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Sinkronisasi & Menyimpan...';

    // 1. Save Checklist Items (Individual)
    const { error: clErr } = await supabase.from('checklist_items').upsert(items, { onConflict: 'proyek_id, kode' });
    if (clErr) throw clErr;

    // 2. Integration: Update Hasil Analisis Scores
    // Calculate 0-100 scores based on weights
    const scores = {
      skor_struktur: Math.round(((45 - groupDamage.struktur) / 45) * 100),
      skor_arsitektur: Math.round(((30 - groupDamage.arsitektur) / 30) * 100),
      skor_mep: Math.round(((25 - groupDamage.utilitas) / 25) * 100)
    };

    // Fetch existing analysis to merge narasi if necessary
    const { data: existingAn } = await supabase.from('hasil_analisis').select('*').eq('proyek_id', proyekId).order('created_at', { ascending: false }).limit(1).maybeSingle();

    const payload = {
      proyek_id: proyekId,
      ...scores,
      skor_total: Math.round(100 - grandTotalDamage),
      risk_level: grandTotalDamage <= 30 ? 'low' : grandTotalDamage <= 45 ? 'high' : 'critical',
      status_slf: grandTotalDamage <= 30 ? 'LAIK_FUNGSI' : grandTotalDamage <= 45 ? 'LAIK_FUNGSI_BERSYARAT' : 'TIDAK_LAIK_FUNGSI',
      ai_provider: 'pemeriksaan-fisik-manual'
    };

    if (existingAn) {
      // Update the latest one to keep recommendations and narasi
      await supabase.from('hasil_analisis').update(payload).eq('id', existingAn.id);
    } else {
      await supabase.from('hasil_analisis').insert([payload]);
    }

    // 3. Update Proyek Status & Progress
    await supabase.from('proyek').update({
      status_slf: payload.status_slf,
      progress: 60 // Minimum progress once physical inspection is saved
    }).eq('id', proyekId);

    showSuccess('Data kondisi fisik & skor kelaikan berhasil disinkronkan ke database!');
    
    // Auto-navigate back to Detail after a short delay
    setTimeout(() => {
      navigate('proyek-detail', { id: proyekId });
    }, 1500);

  } catch (err) {
    showError('Gagal menyimpan: ' + err.message);
  } finally {
    const btn = document.querySelector('.btn-primary');
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-save"></i> Simpan Penilaian';
    }
  }
};

// ── Data Fetchers ─────────────────────────────────────────────
async function fetchProyek(id) {
  const { data } = await supabase.from('proyek').select('*').eq('id', id).maybeSingle();
  return data;
}

async function fetchLastAnalisis(id) {
  const { data } = await supabase.from('hasil_analisis').select('*').eq('proyek_id', id).order('created_at', { ascending: false }).limit(1).maybeSingle();
  return data;
}

async function fetchKondisiData(proyekId) {
  const { data } = await supabase.from('checklist_items').select('*').eq('proyek_id', proyekId).eq('kategori', 'kondisi_fisik');
  return data;
}

// ── Skeleton ──────────────────────────────────────────────────
function renderSkeleton() {
  return `
    <div class="page-header">
      <div class="skeleton" style="height:20px;width:160px;margin-bottom:8px"></div>
      <div class="skeleton" style="height:36px;width:400px;margin-bottom:8px"></div>
    </div>
    <div style="display:grid; grid-template-columns: 1fr 340px; gap:var(--space-6)">
      <div style="display:flex; flex-direction:column; gap:20px">
        <div class="skeleton" style="height:300px; border-radius:12px"></div>
        <div class="skeleton" style="height:300px; border-radius:12px"></div>
      </div>
      <div class="skeleton" style="height:500px; border-radius:12px"></div>
    </div>
  `;
}
