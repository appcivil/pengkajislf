// ============================================================
//  REPORT FORMATTER — Post-Processing AI Output
//  Mengubah narasi AI mentah menjadi format laporan profesional
//  Standar: PUPR / Engineering Report / Justifikasi Teknis
// ============================================================

/**
 * 6-STEP ANALYTICAL ENGINE (The "Expert Brain")
 * Menghasilkan narasi teknis mendalam untuk setiap item pemeriksaan.
 */
export function analyzeChecklistItem(item, proyek) {
  const { kategori, sub_kategori, item_pemeriksaan, hasil, status, keterangan } = item;
  
  // STEP 1: IDENTIFIKASI
  const identifikasi = `Pemeriksaan dilakukan pada aspek ${kategori} khususnya bagian ${sub_kategori} terkait ${item_pemeriksaan}.`;

  // STEP 2: INTERPRETASI HASIL
  let interpretasi = "";
  const isOk = ['ada_sesuai', 'baik', 'sesuai'].includes(status?.toLowerCase());
  if (isOk) {
    interpretasi = `Berdasarkan pengamatan visual dan verifikasi lapangan, kondisi dinyatakan MEMENUHI standar teknis kelaikan fungsi.`;
  } else {
    interpretasi = `Hasil pemeriksaan menunjukkan adanya KETIDAKSESUAIAN (Deficiency) terhadap standar teknis yang berlaku. Kondisi tercatat: ${hasil || keterangan || 'Tidak memadai'}.`;
  }

  // STEP 3: ANALISIS TEKNIS
  let analisis = "";
  if (kategori?.toLowerCase() === 'struktur') {
    analisis = isOk 
      ? `Komponen struktural menunjukkan integritas yang baik dalam memikul beban desain, sehingga stabilitas bangunan tetap terjaga.`
      : `Kerusakan atau ketidaksesuaian pada komponen struktur ini dapat mereduksi kapasitas dukung beban bangunan dan berpotensi memicu kegagalan parsial jika tidak segera ditangani.`;
  } else if (kategori?.toLowerCase() === 'kebakaran') {
    analisis = isOk
      ? `Sistem proteksi kebakaran aktif/pasif dalam kondisi siaga, meminimalisir risiko penyebaran api dan menjamin keamanan jalur evakuasi.`
      : `Gangguan pada sistem ini secara langsung menurunkan tingkat keselamatan jiwa (Life Safety) penghuni dalam skenario darurat kebakaran.`;
  } else {
    analisis = isOk
      ? `Fungsi komponen ${kategori} berjalan optimal sesuai peruntukannya, mendukung operasional bangunan secara efisien.`
      : `Kondisi ini mengganggu keandalan operasional bangunan dan dapat menyebabkan penurunan kualitas layanan (Serviceability) secara keseluruhan.`;
  }

  // STEP 4: PENILAIAN RISIKO
  let risiko = "Rendah";
  if (!isOk) {
    if (kategori?.toLowerCase() === 'struktur' || kategori?.toLowerCase() === 'kebakaran') risiko = "Tinggi";
    else if (status?.toLowerCase() === 'kritis' || status?.toLowerCase() === 'buruk') risiko = "Tinggi";
    else risiko = "Sedang";
  }

  // STEP 5: KESIMPULAN ITEM
  const kesimpulan = isOk ? "LAYAK / MEMENUHI" : (risiko === "Tinggi" ? "TIDAK LAYAK / HARUS DIPERBAIKI SEGERA" : "PERLU PERBAIKAN MINOR");

  // STEP 6: REKOMENDASI SPESIFIK
  let rekomendasi = isOk ? "Lakukan pemeliharaan rutin sesuai SOP bangunan." : "";
  if (!isOk) {
    if (kategori?.toLowerCase() === 'struktur') rekomendasi = `Lakukan audit struktur mendalam (NDT/DT) dan perkuatan (Retrofitting) pada area terdampak sesuai rekomendasi tenaga ahli struktur Terlisensi.`;
    else if (kategori?.toLowerCase() === 'mep' || kategori?.toLowerCase() === 'utilitas') rekomendasi = `Lakukan penggantian atau perbaikan komponen pada sistem utilitas dan pastikan pengujian fungsi ulang sebelum dioperasikan kembali.`;
    else rekomendasi = `Lakukan perbaikan teknis pada komponen ${item_pemeriksaan} agar kembali sesuai dengan standar teknis Peraturan Menteri PUPR yang berlaku.`;
  }

  return {
    identifikasi,
    interpretasi,
    analisis,
    risiko,
    kesimpulan,
    rekomendasi
  };
}

/**
 * MENGHASILKAN NARASI BAB IV SECARA DINAMIS
 */
export function generateBab4Narrative(checklist, proyek) {
  if (!checklist || checklist.length === 0) return "Tidak ada data pemeriksaan untuk dianalisis.";

  const categories = [...new Set(checklist.map(c => c.kategori))];
  let narrative = "";

  categories.forEach(cat => {
    narrative += `\n### ANALISIS ASPEK ${cat.toUpperCase()}\n\n`;
    const items = checklist.filter(c => c.kategori === cat);
    
    items.forEach(item => {
      const a = analyzeChecklistItem(item, proyek);
      narrative += `#### ${item.item_pemeriksaan}\n`;
      narrative += `- **Kondisi Eksisting:** ${item.hasil || item.status || '-'}\n`;
      narrative += `- **Evaluasi Teknis:** ${a.interpretasi} ${a.analisis}\n`;
      narrative += `- **Risiko:** ${a.risiko}\n`;
      narrative += `- **Kesimpulan:** ${a.kesimpulan}\n\n`;
    });
  });

  return narrative;
}

/**
 * MENGHASILKAN TABEL REKOMENDASI BAB VI
 */
export function generateRecommendationData(checklist, proyek) {
  return checklist
    .filter(i => !['ada_sesuai', 'baik', 'sesuai'].includes(i.status?.toLowerCase()))
    .map(i => {
      const a = analyzeChecklistItem(i, proyek);
      return {
        item: i.item_pemeriksaan,
        masalah: i.hasil || i.keterangan || i.status,
        rekomendasi: a.rekomendasi,
        prioritas: a.risiko === 'Tinggi' ? 'Tinggi' : a.risiko === 'Sedang' ? 'Sedang' : 'Rendah',
        waktu: a.risiko === 'Tinggi' ? 'Segera' : '3-6 Bulan'
      };
    });
}

/**
 * Parse narasi AI mentah dan ubah menjadi format terstruktur profesional
 * @param {string} rawMarkdown - Output AI mentah (markdown)
 * @returns {Object} Structured report data
 */
export function parseNarasiAI(rawMarkdown) {
  if (!rawMarkdown || typeof rawMarkdown !== 'string') {
    return { sections: [], summary: null, items: [] };
  }

  const cleaned = cleanMarkdown(rawMarkdown);
  const items = extractAnalysisItems(cleaned);
  const summary = extractSummary(cleaned);
  const globalAnalysis = extractGlobalAnalysis(cleaned);

  return {
    items,
    summary,
    globalAnalysis,
    raw: cleaned
  };
}

/**
 * Render parsed data menjadi HTML profesional untuk preview
 * @param {Object} parsed - Hasil dari parseNarasiAI()
 * @returns {string} HTML string
 */
export function renderToHTML(parsed) {
  if (!parsed || (!parsed.items.length && !parsed.raw)) {
    return '<p style="font-style:italic;color:#64748b">Narasi teknis tidak tersedia.</p>';
  }

  let html = '';

  // Ringkasan jika ada
  if (parsed.summary) {
    html += renderSummaryHTML(parsed.summary);
  }

  // Analisis per item
  if (parsed.items.length > 0) {
    html += '<div class="report-items-container">';
    parsed.items.forEach((item, idx) => {
      html += renderItemHTML(item, idx);
    });
    html += '</div>';
  }

  // Analisis Global jika ada
  if (parsed.globalAnalysis) {
    html += renderGlobalAnalysisHTML(parsed.globalAnalysis);
  }

  // Fallback: jika tidak ada item terstruktur, render raw tapi bersih
  if (parsed.items.length === 0 && parsed.raw) {
    html += renderCleanNarrativeHTML(parsed.raw);
  }

  return html;
}

// ============================================================
//  EXTRACTION FUNCTIONS
// ============================================================

function cleanMarkdown(md) {
  return md
    .replace(/[\u{1F600}-\u{1F9FF}]/gu, '')
    .replace(/[\u{2600}-\u{26FF}]/gu, '')
    .replace(/[\u{2700}-\u{27BF}]/gu, '')
    .replace(/[\u{FE00}-\u{FE0F}]/gu, '')
    .replace(/[\u{1F000}-\u{1F02F}]/gu, '')
    .replace(/[📊🔹🔥⏳📈📌📋🤖🎯🧠🔍📐🧾🔤🧱📖⚙️💡⚠️✅❌🚧]/g, '')
    .trim();
}

/**
 * Extract individual analysis items (A01, A02, S01, etc.)
 */
function extractAnalysisItems(md) {
  const items = [];

  // Pattern: Match item headers like "A01 – NAMA ITEM" or "### A01" or "**A01 – Nama**"
  const itemPattern = /(?:^|\n)(?:#{1,4}\s*)?(?:\*{0,2})?\s*((?:[A-Z]{1,3}\d{1,3})\s*[–\-—]\s*.+?)(?:\*{0,2})?(?:\n|$)/g;
  let match;
  const headerPositions = [];

  while ((match = itemPattern.exec(md)) !== null) {
    headerPositions.push({
      title: match[1].trim().replace(/^\*+|\*+$/g, ''),
      start: match.index,
      end: match.index + match[0].length
    });
  }

  // Extract content between headers
  for (let i = 0; i < headerPositions.length; i++) {
    const startContent = headerPositions[i].end;
    const endContent = i + 1 < headerPositions.length ? headerPositions[i + 1].start : md.length;
    const content = md.substring(startContent, endContent).trim();

    const item = parseItemContent(headerPositions[i].title, content);
    if (item) items.push(item);
  }

  return items;
}

/**
 * Parse content of a single analysis item into structured fields
 */
function parseItemContent(title, content) {
  // Extract kode from title
  const kodeMatch = title.match(/^([A-Z]{1,3}\d{1,3})/);
  const kode = kodeMatch ? kodeMatch[1] : '';
  const nama = title.replace(/^[A-Z]{1,3}\d{1,3}\s*[–\-—]\s*/, '').trim();

  const item = {
    kode,
    nama,
    fullTitle: title,
    status: extractField(content, ['STATUS KEPATUHAN', 'STATUS', 'Status']),
    analisis: extractField(content, ['ANALISIS TEKNIS', 'ANALISIS', 'Analisis']),
    dasarHukum: extractField(content, ['DASAR REGULASI', 'DASAR HUKUM', 'Dasar Hukum', 'Dasar Regulasi']),
    risiko: extractField(content, ['RISIKO TEKNIS & HUKUM', 'RISIKO TEKNIS', 'RISIKO', 'Risiko']),
    tingkatRisiko: extractField(content, ['TINGKAT RISIKO', 'LEVEL RISIKO', 'Level Risiko', 'Tingkat Risiko']),
    rekomendasi: extractField(content, ['REKOMENDASI TEKNIS', 'REKOMENDASI', 'Rekomendasi']),
    rawContent: content
  };

  // Normalize tingkat risiko
  if (item.tingkatRisiko) {
    const tr = item.tingkatRisiko.toLowerCase();
    if (tr.includes('kritis') || tr.includes('critical')) item.riskLevel = 'critical';
    else if (tr.includes('tinggi') || tr.includes('high')) item.riskLevel = 'high';
    else if (tr.includes('sedang') || tr.includes('medium')) item.riskLevel = 'medium';
    else if (tr.includes('rendah') || tr.includes('low')) item.riskLevel = 'low';
    else item.riskLevel = 'medium';
  } else {
    item.riskLevel = 'medium';
  }

  return item;
}

/**
 * Extract a field value from content using multiple possible labels
 */
function extractField(content, labels) {
  for (const label of labels) {
    // Pattern 1: "**LABEL:** value" or "* **LABEL:** value" or "- **LABEL:** value"
    const p1 = new RegExp(`(?:^|\\n)\\s*(?:[*\\-]\\s*)?\\*{0,2}${escapeRegex(label)}\\*{0,2}\\s*[:：]\\s*(.+?)(?=\\n\\s*(?:[*\\-]\\s*)?\\*{0,2}(?:${getNextFieldPattern()})|$)`, 'is');
    const m1 = content.match(p1);
    if (m1) return cleanFieldValue(m1[1]);

    // Pattern 2: "LABEL:\n value" (multiline)
    const p2 = new RegExp(`(?:^|\\n)\\s*(?:[*\\-]\\s*)?\\*{0,2}${escapeRegex(label)}\\*{0,2}\\s*[:：]\\s*\\n([\\s\\S]+?)(?=\\n\\s*(?:[*\\-]\\s*)?\\*{0,2}(?:${getNextFieldPattern()})|$)`, 'is');
    const m2 = content.match(p2);
    if (m2) return cleanFieldValue(m2[1]);
  }
  return '';
}

function getNextFieldPattern() {
  return [
    'STATUS KEPATUHAN', 'STATUS', 'ANALISIS TEKNIS', 'ANALISIS',
    'DASAR REGULASI', 'DASAR HUKUM', 'RISIKO TEKNIS', 'RISIKO',
    'TINGKAT RISIKO', 'LEVEL RISIKO', 'REKOMENDASI TEKNIS', 'REKOMENDASI',
    'SKOR', 'KESIMPULAN', 'TEMUAN'
  ].map(escapeRegex).join('|');
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\&]/g, '\\$&');
}

function cleanFieldValue(val) {
  return val
    .replace(/^\s*[\-\*]\s*/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^\s+/gm, '')
    .trim();
}

/**
 * Extract summary/ringkasan section
 */
function extractSummary(md) {
  const patterns = [
    /(?:#{1,3}\s*)?(?:Ringkasan|Summary|Ringkasan Analisis|Ikhtisar)\s*[:：]?\s*\n([\s\S]+?)(?=\n#{1,3}\s|$)/i,
    /SKOR KEPATUHAN(?:\s+ADMINISTRASI)?.*?[:：]\s*(\d+)/i,
  ];

  const summary = {};

  // Find skor
  const skorMatch = md.match(/SKOR KEPATUHAN(?:\s+\w+)?.*?[:：]\s*(\d+)/i);
  if (skorMatch) summary.skor = parseInt(skorMatch[1]);

  // Find kategori
  const katMatch = md.match(/KATEGORI KELAYAKAN.*?[:：]\s*(.+)/i);
  if (katMatch) summary.kategori = katMatch[1].trim();

  // Find temuan kritis
  const temuanMatch = md.match(/TEMUAN KRITIS.*?[:：]\s*([\s\S]+?)(?=\n#{1,3}\s|\n\*{2}[A-Z]|$)/i);
  if (temuanMatch) summary.temuanKritis = temuanMatch[1].trim();

  return Object.keys(summary).length > 0 ? summary : null;
}

/**
 * Extract global analysis sections
 */
function extractGlobalAnalysis(md) {
  const sections = {};

  // Hubungan antar dokumen
  const hubMatch = md.match(/(?:HUBUNGAN ANTAR DOKUMEN|Dependency.*?Analysis).*?[:：]\s*([\s\S]+?)(?=\n#{1,3}\s|\n\*{2}[A-Z]|$)/i);
  if (hubMatch) sections.dependencyAnalysis = hubMatch[1].trim();

  // Prediksi risiko
  const predMatch = md.match(/(?:PREDIKSI RISIKO|Risk Prediction).*?[:：]\s*([\s\S]+?)(?=\n#{1,3}\s|\n\*{2}[A-Z]|$)/i);
  if (predMatch) sections.riskPrediction = predMatch[1].trim();

  return Object.keys(sections).length > 0 ? sections : null;
}

// ============================================================
//  HTML RENDERERS — Format Profesional
// ============================================================

function renderSummaryHTML(summary) {
  return `
    <div class="report-summary-card" style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:10px;padding:20px 24px;margin-bottom:24px">
      <div style="font-size:0.85rem;font-weight:700;color:#0369a1;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:12px;border-bottom:2px solid #0ea5e9;padding-bottom:6px">
        Ringkasan Eksekutif Analisis
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
        ${summary.skor != null ? `
          <div style="display:flex;align-items:center;gap:12px">
            <div style="width:48px;height:48px;border-radius:50%;background:${summary.skor >= 80 ? '#dcfce7' : summary.skor >= 60 ? '#fef9c3' : '#fee2e2'};display:flex;align-items:center;justify-content:center;font-size:1.1rem;font-weight:800;color:${summary.skor >= 80 ? '#166534' : summary.skor >= 60 ? '#854d0e' : '#991b1b'}">${summary.skor}</div>
            <div>
              <div style="font-size:0.78rem;color:#64748b">Skor Kepatuhan</div>
              <div style="font-size:0.9rem;font-weight:700;color:#0f172a">${summary.skor}%</div>
            </div>
          </div>
        ` : ''}
        ${summary.kategori ? `
          <div style="display:flex;align-items:center;gap:12px">
            <div style="width:48px;height:48px;border-radius:50%;background:#f0f4ff;display:flex;align-items:center;justify-content:center;font-size:1rem;color:#1e3a8a">
              <i class="fas fa-shield-alt"></i>
            </div>
            <div>
              <div style="font-size:0.78rem;color:#64748b">Status Kelayakan</div>
              <div style="font-size:0.9rem;font-weight:700;color:#1e3a8a">${escH(summary.kategori)}</div>
            </div>
          </div>
        ` : ''}
      </div>
      ${summary.temuanKritis ? `
        <div style="margin-top:16px;padding-top:12px;border-top:1px solid #bae6fd">
          <div style="font-size:0.78rem;font-weight:700;color:#991b1b;margin-bottom:6px">Temuan Kritis:</div>
          <div style="font-size:0.825rem;color:#374151;line-height:1.6">${formatBullets(summary.temuanKritis)}</div>
        </div>
      ` : ''}
    </div>
  `;
}

function renderItemHTML(item, idx) {
  const riskColors = {
    critical: { bg: '#fef2f2', border: '#fca5a5', accent: '#dc2626', label: 'KRITIS' },
    high: { bg: '#fff7ed', border: '#fed7aa', accent: '#ea580c', label: 'TINGGI' },
    medium: { bg: '#fefce8', border: '#fde68a', accent: '#ca8a04', label: 'SEDANG' },
    low: { bg: '#f0fdf4', border: '#bbf7d0', accent: '#16a34a', label: 'RENDAH' }
  };
  const rc = riskColors[item.riskLevel] || riskColors.medium;

  return `
    <div class="report-item-card" style="background:white;border:1px solid #e2e8f0;border-radius:10px;margin-bottom:20px;overflow:hidden;page-break-inside:avoid">
      <!-- Header -->
      <div style="background:${rc.bg};padding:14px 20px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid ${rc.border}">
        <div style="display:flex;align-items:center;gap:12px">
          <div style="width:36px;height:36px;border-radius:8px;background:white;border:2px solid ${rc.accent};display:flex;align-items:center;justify-content:center;font-size:0.75rem;font-weight:800;color:${rc.accent};font-family:monospace">${escH(item.kode)}</div>
          <div>
            <div style="font-size:0.95rem;font-weight:700;color:#0f172a">${escH(item.nama)}</div>
            ${item.status ? `<div style="font-size:0.78rem;color:${rc.accent};font-weight:600;margin-top:2px">Status: ${escH(item.status)}</div>` : ''}
          </div>
        </div>
        <span style="background:${rc.accent};color:white;padding:3px 10px;border-radius:999px;font-size:0.68rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em">${rc.label}</span>
      </div>

      <!-- Body -->
      <div style="padding:16px 20px">
        ${item.analisis ? `
          <div class="report-field" style="margin-bottom:14px">
            <div class="report-field-label" style="font-size:0.72rem;font-weight:700;color:#1e3a8a;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px;display:flex;align-items:center;gap:6px">
              <span style="width:4px;height:14px;border-radius:2px;background:#2563eb;display:inline-block"></span>
              Temuan dan Analisis
            </div>
            <div style="font-size:0.85rem;color:#374151;line-height:1.7;text-align:justify">${formatParagraphs(item.analisis)}</div>
          </div>
        ` : ''}

        ${item.dasarHukum ? `
          <div class="report-field" style="margin-bottom:14px">
            <div class="report-field-label" style="font-size:0.72rem;font-weight:700;color:#1e3a8a;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px;display:flex;align-items:center;gap:6px">
              <span style="width:4px;height:14px;border-radius:2px;background:#0ea5e9;display:inline-block"></span>
              Standar Acuan / Dasar Hukum
            </div>
            <div style="font-size:0.825rem;color:#374151;background:#f8fafc;border-left:3px solid #0ea5e9;padding:10px 14px;border-radius:0 6px 6px 0;line-height:1.7">${formatBullets(item.dasarHukum)}</div>
          </div>
        ` : ''}

        ${item.risiko ? `
          <div class="report-field" style="margin-bottom:14px">
            <div class="report-field-label" style="font-size:0.72rem;font-weight:700;color:#dc2626;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px;display:flex;align-items:center;gap:6px">
              <span style="width:4px;height:14px;border-radius:2px;background:#dc2626;display:inline-block"></span>
              Dampak Risiko
            </div>
            <div style="font-size:0.825rem;color:#374151;background:#fef2f2;border-left:3px solid #fca5a5;padding:10px 14px;border-radius:0 6px 6px 0;line-height:1.7">${formatParagraphs(item.risiko)}</div>
          </div>
        ` : ''}

        ${item.rekomendasi ? `
          <div class="report-field">
            <div class="report-field-label" style="font-size:0.72rem;font-weight:700;color:#059669;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px;display:flex;align-items:center;gap:6px">
              <span style="width:4px;height:14px;border-radius:2px;background:#059669;display:inline-block"></span>
              Rekomendasi Teknis
            </div>
            <div style="font-size:0.825rem;color:#374151;background:#f0fdf4;border-left:3px solid #86efac;padding:10px 14px;border-radius:0 6px 6px 0;line-height:1.7">${formatBullets(item.rekomendasi)}</div>
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

function renderGlobalAnalysisHTML(globalAnalysis) {
  let html = '';

  if (globalAnalysis.dependencyAnalysis) {
    html += `
      <div style="background:#faf5ff;border:1px solid #e9d5ff;border-radius:10px;padding:20px 24px;margin-top:20px">
        <div style="font-size:0.85rem;font-weight:700;color:#7c3aed;margin-bottom:10px;text-transform:uppercase;letter-spacing:0.05em">Analisis Keterkaitan Antar Dokumen</div>
        <div style="font-size:0.85rem;color:#374151;line-height:1.7;text-align:justify">${formatParagraphs(globalAnalysis.dependencyAnalysis)}</div>
      </div>
    `;
  }

  if (globalAnalysis.riskPrediction) {
    html += `
      <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:20px 24px;margin-top:16px">
        <div style="font-size:0.85rem;font-weight:700;color:#ea580c;margin-bottom:10px;text-transform:uppercase;letter-spacing:0.05em">Prediksi Risiko Kedepan</div>
        <div style="font-size:0.85rem;color:#374151;line-height:1.7;text-align:justify">${formatParagraphs(globalAnalysis.riskPrediction)}</div>
      </div>
    `;
  }

  return html;
}

function renderCleanNarrativeHTML(raw) {
  // Fallback: render as professional narrative with proper styling
  const paragraphs = raw.split(/\n{2,}/);
  let html = '<div class="report-clean-narrative">';

  paragraphs.forEach(p => {
    const trimmed = p.trim();
    if (!trimmed) return;

    if (trimmed.startsWith('### ') || trimmed.startsWith('## ') || trimmed.startsWith('# ')) {
      const level = trimmed.startsWith('### ') ? 'h4' : trimmed.startsWith('## ') ? 'h3' : 'h2';
      const text = trimmed.replace(/^#{1,4}\s*/, '');
      html += `<${level} style="font-size:${level === 'h2' ? '1.1rem' : level === 'h3' ? '1rem' : '0.95rem'};font-weight:700;color:#1e3a8a;margin:20px 0 10px;border-bottom:1px solid #e2e8f0;padding-bottom:6px">${escH(text)}</${level}>`;
    } else if (trimmed.match(/^\|.*\|$/m)) {
      // Table - pass through as-is (will be handled by marked)
      html += `<div class="markdown-content">${formatTable(trimmed)}</div>`;
    } else {
      html += `<p style="font-size:0.85rem;color:#374151;line-height:1.7;text-align:justify;margin-bottom:10px">${formatInline(trimmed)}</p>`;
    }
  });

  html += '</div>';
  return html;
}

// ============================================================
//  FORMATTING HELPERS
// ============================================================

function formatParagraphs(text) {
  if (!text) return '';
  return text
    .split(/\n{2,}/)
    .map(p => p.trim())
    .filter(p => p)
    .map(p => {
      // Check if it's a list
      if (p.match(/^[\-\*]\s/m)) {
        return formatBullets(p);
      }
      // Check if it starts with numbered item
      if (p.match(/^\d+\.\s/m)) {
        return formatNumbered(p);
      }
      return `<p style="margin:0 0 8px;text-align:justify">${formatInline(p)}</p>`;
    })
    .join('');
}

function formatBullets(text) {
  if (!text) return '';
  const lines = text.split('\n').filter(l => l.trim());
  const isBulletList = lines.some(l => l.trim().match(/^[\-\*]\s/));

  if (isBulletList) {
    const items = [];
    let current = '';
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed.match(/^[\-\*]\s/)) {
        if (current) items.push(current);
        current = trimmed.replace(/^[\-\*]\s/, '');
      } else if (trimmed.match(/^[a-z]\)\s|^[ivx]+\)\s/i)) {
        // Sub-bullet
        current += '<br>&nbsp;&nbsp;&nbsp;' + trimmed;
      } else {
        current += ' ' + trimmed;
      }
    });
    if (current) items.push(current);

    return `<ul style="margin:0;padding-left:20px;list-style:disc">${items.map(i => 
      `<li style="margin-bottom:4px;font-size:0.825rem;line-height:1.6">${formatInline(i)}</li>`
    ).join('')}</ul>`;
  }

  // Not a bullet list, render as paragraphs
  return lines.map(l => `<p style="margin:0 0 6px">${formatInline(l.trim())}</p>`).join('');
}

function formatNumbered(text) {
  if (!text) return '';
  const lines = text.split('\n').filter(l => l.trim());
  const items = [];
  let current = '';

  lines.forEach(line => {
    const trimmed = line.trim();
    if (trimmed.match(/^\d+\.\s/)) {
      if (current) items.push(current);
      current = trimmed.replace(/^\d+\.\s/, '');
    } else {
      current += ' ' + trimmed;
    }
  });
  if (current) items.push(current);

  return `<ol style="margin:0;padding-left:20px">${items.map(i => 
    `<li style="margin-bottom:4px;font-size:0.825rem;line-height:1.6">${formatInline(i)}</li>`
  ).join('')}</ol>`;
}

function formatInline(text) {
  if (!text) return '';
  return escH(text)
    .replace(/\*\*(.+?)\*\*/g, '<strong style="color:#0f172a;font-weight:700">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code style="background:#f1f5f9;padding:1px 4px;border-radius:3px;font-size:0.85em">$1</code>')
    .replace(/\n/g, '<br>');
}

function formatTable(tableText) {
  const lines = tableText.trim().split('\n').filter(l => l.trim().startsWith('|'));
  if (lines.length < 2) return `<p>${escH(tableText)}</p>`;

  const parseRow = (line) => line.split('|').map(c => c.trim()).filter((c, i, arr) => i > 0 && i < arr.length);
  const isDelimiter = (line) => line.match(/^\|[\s\-:|]+\|$/);

  const dataLines = lines.filter(l => !isDelimiter(l));
  if (dataLines.length === 0) return '';

  let html = '<table style="width:100%;border-collapse:collapse;margin:12px 0;font-size:0.825rem">';

  dataLines.forEach((line, idx) => {
    const cols = parseRow(line);
    const isHeader = idx === 0;
    html += '<tr>';
    cols.forEach(col => {
      if (isHeader) {
        html += `<th style="background:#f1f5f9;color:#1e3a8a;font-weight:700;padding:8px 12px;border:1px solid #d1d5db;text-align:left;font-size:0.78rem">${escH(col)}</th>`;
      } else {
        html += `<td style="padding:8px 12px;border:1px solid #e5e7eb;color:#374151">${formatInline(col)}</td>`;
      }
    });
    html += '</tr>';
  });

  html += '</table>';
  return html;
}

function escH(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ============================================================
//  DOCX EXPORT HELPERS
//  Untuk digunakan oleh docx-service.js
// ============================================================

/**
 * Mendapatkan data terstruktur dari narasi AI untuk digunakan di DOCX
 * @param {string} rawMarkdown
 * @returns {Object} parsed data
 */
export function getStructuredDataForDocx(rawMarkdown) {
  return parseNarasiAI(rawMarkdown);
}
