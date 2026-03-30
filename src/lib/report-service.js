import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, HeadingLevel, VerticalAlign, PageBreak, ImageRun } from 'docx';
import { saveAs } from 'file-saver';
import { supabase } from './supabase.js';

/**
 * ============================================================
 * AUTOMATED SLF REPORT GENERATOR (.DOCX) - V2 (WITH IMAGES)
 * Engine untuk menyusun laporan pengkajian teknis bangunan
 * ============================================================
 */

export async function generateSLFReport(proyekId, agentResults = []) {
  try {
    // 1. Ambil Data Dasar Proyek
    const { data: proyek, error: pErr } = await supabase.from('proyek').select('*').eq('id', proyekId).single();
    if (pErr) throw new Error("Gagal mengambil data proyek");

    // 2. Ambil Data Checklist (Admin & Kajian Teknis)
    const { data: checklist } = await supabase.from('checklist_items')
      .select('*')
      .eq('proyek_id', proyekId)
      .in('kategori', ['administrasi', 'kajian_teknis']);

    const adminChecklist = (checklist || []).filter(c => c.kategori === 'administrasi');
    const kajianChecklist = (checklist || []).filter(c => c.kategori === 'kajian_teknis');

    // 3. Menghasilkan konten dinamis (Analisis Agen + Foto) secara asinkron
    const agentSections = await renderAgentAnalysisSections(agentResults);

    // 4. Inisialisasi Dokumen Word
    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 }, // 1 inch = 1440 twips
            },
          },
          children: [
            // --- HALAMAN JUDUL ---
            renderTitlePage(proyek),
            new Paragraph({ children: [new PageBreak()] }),

            // --- BAB I: PENDAHULUAN ---
            new Paragraph({ text: "BAB I", heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER }),
            new Paragraph({ text: "PENDAHULUAN", heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER, spacing: { after: 400 } }),
            
            new Paragraph({ 
              children: [new TextRun({ text: "1.1 Latar Belakang", bold: true })],
              spacing: { before: 200, after: 100 }
            }),
            new Paragraph({
              text: `Pengkajian teknis bangunan gedung ini dilakukan untuk memastikan bahwa gedung "${proyek.nama_bangunan}" telah memenuhi standar kelaikan fungsi sesuai dengan regulasi yang berlaku di Indonesia. Dokumen ini disusun sebagai persyaratan administrasi dan teknis dalam pengajuan Sertifikat Laik Fungsi (SLF).`,
              alignment: AlignmentType.JUSTIFY,
              spacing: { after: 200 }
            }),

            // --- BAB II: DATA BANGUNAN GEDUNG ---
            new Paragraph({ children: [new PageBreak()] }),
            new Paragraph({ text: "BAB II", heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER }),
            new Paragraph({ text: "DATA UMUM BANGUNAN", heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER, spacing: { after: 400 } }),
            renderBuildingDataTable(proyek),

            // --- BAB III: HASIL PEMERIKSAAN ADMINISTRASI ---
            new Paragraph({ children: [new PageBreak()] }),
            new Paragraph({ text: "BAB III", heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER }),
            new Paragraph({ text: "PEMERIKSAAN ADMINISTRASI", heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER, spacing: { after: 400 } }),
            renderAdminChecklistTable(checklist),

            // --- BAB IV: ANALISIS TEKNIS (15 AGEN AI + FOTO) ---
            new Paragraph({ children: [new PageBreak()] }),
            new Paragraph({ text: "BAB IV", heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER }),
            new Paragraph({ text: "HASIL ANALISIS TEKNIS (KONSORSIUM AHLI)", heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER, spacing: { after: 400 } }),
            ...agentSections,

            // --- BAB V: KESIMPULAN ---
            new Paragraph({ children: [new PageBreak()] }),
            new Paragraph({ text: "BAB V", heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER }),
            new Paragraph({ text: "KESIMPULAN DAN REKOMENDASI", heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER, spacing: { after: 400 } }),
            renderConclusion(proyek, agentResults),
          ],
        },
      ],
    });

    // 5. Export & Download
    const buffer = await Packer.toBlob(doc);
    saveAs(buffer, `Laporan_SLF_${proyek.nama_bangunan.replace(/\s+/g, '_')}.docx`);
    
    return true;
  } catch (err) {
    console.error("Gagal membuat laporan .docx:", err);
    throw err;
  }
}

/**
 * MENGUNDUH GAMBAR DARI DRIVE (VIA PROXY)
 */
async function fetchImageBuffer(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    return await response.arrayBuffer();
  } catch (e) {
    console.warn("Gagal fetch image buffer dari Drive:", url, e);
    return null;
  }
}

/**
 * RENDER ANALISIS AGEN + FOTO BUKTI (ASINKRON)
 */
async function renderAgentAnalysisSections(results) {
  const paragraphs = [];

  if (!results || results.length === 0) {
    paragraphs.push(new Paragraph({ text: "(Belum ada data analisis)", color: "999999", spacing: { before: 200 } }));
    return paragraphs;
  }

  for (let i = 0; i < results.length; i++) {
    const res = results[i];
    paragraphs.push(new Paragraph({ 
      children: [new TextRun({ text: `4.${i + 1} Bidang Keahlian: ${res.name}`, bold: true, size: 24 })],
      spacing: { before: 300, after: 100 }
    }));
    
    paragraphs.push(new Paragraph({ 
      text: res.analisis || "Pemeriksaan teknis telah dilakukan.",
      alignment: AlignmentType.JUSTIFY,
      spacing: { after: 100 }
    }));

    // --- DASAR HUKUM / NSPK SECTION (Auto-Generated if Image Missing) ---
    const hasNspkPhoto = res.nspk_photos && res.nspk_photos.length > 0;
    
    paragraphs.push(new Paragraph({ 
      children: [new TextRun({ text: "Dasar Hukum & Standar Teknis (NSPK):", bold: true, color: "1E40AF" })], 
      spacing: { before: 200, after: 100 } 
    }));

    if (hasNspkPhoto) {
      for (const nspk of res.nspk_photos) {
        const nspkBuffer = await fetchImageBuffer(nspk.url);
        if (nspkBuffer) {
          paragraphs.push(new Paragraph({
            children: [
              new ImageRun({
                data: nspkBuffer,
                transformation: { width: 450, height: 250 },
              }),
              new TextRun({ text: `\nRef: ${nspk.name}`, size: 14, italics: true, color: "666666" })
            ],
            spacing: { before: 100, after: 150 },
            alignment: AlignmentType.CENTER
          }));
        }
      }
    } else if (res.legal_citation) {
      // RENDER DIGITAL REFERENCE CARD
      paragraphs.push(new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                shading: { fill: "F8FAFC" },
                borders: { 
                  top: { style: BorderStyle.SINGLE, size: 2, color: "3B82F6" },
                  bottom: { style: BorderStyle.SINGLE, size: 2, color: "3B82F6" },
                  left: { style: BorderStyle.SINGLE, size: 2, color: "3B82F6" },
                  right: { style: BorderStyle.SINGLE, size: 2, color: "3B82F6" },
                },
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({ text: "REFERENSI ATURAN RESMI (AUTO-GENERATED)", bold: true, size: 16, color: "3B82F6" }),
                    ],
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 100, after: 100 }
                  }),
                  new Paragraph({
                    children: [
                      new TextRun({ text: res.legal_citation, italics: true, size: 18 }),
                    ],
                    alignment: AlignmentType.JUSTIFY,
                    spacing: { before: 100, after: 100 }
                  })
                ],
                verticalAlign: VerticalAlign.CENTER,
              })
            ]
          })
        ],
        spacing: { after: 200 }
      }));
    }

    // --- FOTO BUKTI LAPANGAN SECTION ---
    if (res.evidence_photos && res.evidence_photos.length > 0) {
      paragraphs.push(new Paragraph({ 
        children: [new TextRun({ text: "Lampiran Bukti Lapangan:", bold: true, italics: true, color: "444444" })], 
        spacing: { before: 100, after: 100 } 
      }));
      
      for (const photo of res.evidence_photos) {
        const imgBuffer = await fetchImageBuffer(photo.url);
        if (imgBuffer) {
          paragraphs.push(new Paragraph({
            children: [
              new ImageRun({
                data: imgBuffer,
                transformation: { width: 300, height: 200 },
              }),
              new TextRun({ text: `\nGambaran: ${photo.name}`, size: 16, italics: true })
            ],
            spacing: { before: 100, after: 100 },
            alignment: AlignmentType.CENTER
          }));
        }
      }
    }

    paragraphs.push(new Paragraph({ 
      children: [new TextRun({ text: "Rekomendasi Ahli:", bold: true, italics: true })],
      spacing: { after: 50 }
    }));
    paragraphs.push(new Paragraph({ 
      text: res.rekomendasi || "Tidak ada rekomendasi khusus.",
      alignment: AlignmentType.JUSTIFY,
      spacing: { after: 200 }
    }));
  }

  return paragraphs;
}

/**
 * RENDER HALAMAN JUDUL
 */
function renderTitlePage(proyek) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [
      new TextRun({ text: "LAPORAN KONSEP PENGKAJIAN TEKNIS", bold: true, size: 32 }),
      new TextRun({ text: "\nSERTIFIKAT LAIK FUNGSI (SLF)", bold: true, size: 28 }),
      new TextRun({ text: "\n\nNAMA BANGUNAN:", size: 20 }),
      new TextRun({ text: `\n${proyek.nama_bangunan.toUpperCase()}`, bold: true, size: 36 }),
      new TextRun({ text: `\n\nLOKASI: ${proyek.alamat?.toUpperCase() || "ALAMAT TIDAK TERSEDIA"}`, size: 24 }),
      new TextRun({ text: `\nTAHUN PEMERIKSAAN: ${new Date().getFullYear()}`, size: 20 }),
    ],
    spacing: { before: 2000 }
  });
}

/**
 * TABEL DATA BANGUNAN
 */
function renderBuildingDataTable(proyek) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      createTableRow("Nama Bangunan", proyek.nama_bangunan),
      createTableRow("Pemilik", proyek.pemilik || "-"),
      createTableRow("Alamat Lokasi", proyek.alamat || "-"),
      createTableRow("Fungsi Bangunan", proyek.fungsi_bangunan || "Umum"),
      createTableRow("Jumlah Lantai", (proyek.jumlah_lantai || 1) + " Lantai"),
    ],
  });
}

/**
 * TABEL CHECKLIST ADMINISTRASI
 */
function renderAdminChecklistTable(checklist) {
  const tableRows = [
    new TableRow({
      children: [
        createHeaderCell("Kode"),
        createHeaderCell("Dokumen Administrasi"),
        createHeaderCell("Status"),
      ],
    }),
  ];

  (checklist || []).forEach(item => {
    tableRows.push(new TableRow({
      children: [
        createCell(item.kode),
        createCell(item.nama),
        createCell(item.status === 'ada_sesuai' ? 'LENGKAP' : 'TIDAK TERSEDIA'),
      ],
    }));
  });

  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: tableRows });
}

/**
 * KESIMPULAN
 */
function renderConclusion(proyek, results) {
  const scores = results.map(r => r.skor || 0);
  const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b) / scores.length) : 0;
  
  let status = "TIDAK LAIK";
  let color = "DC2626";
  if (avgScore >= 85) { status = "LAIK FUNGSI"; color = "059669"; }
  else if (avgScore >= 70) { status = "LAIK FUNGSI DENGAN CATATAN"; color = "D97706"; }

  return new Paragraph({
    children: [
      new TextRun({ text: "Berdasarkan hasil analisis teknis, bangunan gedung ini dinyatakan:", size: 24 }),
      new TextRun({ text: `\n\n${status}`, bold: true, size: 48, underline: {}, color: color }),
      new TextRun({ text: `\n\nIndeks Kelaikan: ${avgScore}%`, size: 20 }),
    ],
    alignment: AlignmentType.CENTER,
    spacing: { before: 500 }
  });
}

// --- HELPERS ---
function createTableRow(label, value) {
  return new TableRow({
    children: [
      new TableCell({ children: [new Paragraph({ text: label, bold: true })], width: { size: 30, type: WidthType.PERCENTAGE } }),
      new TableCell({ children: [new Paragraph({ text: value || "-" })], width: { size: 70, type: WidthType.PERCENTAGE } }),
    ],
  });
}

function createHeaderCell(text) {
  return new TableCell({ children: [new Paragraph({ text, bold: true, alignment: AlignmentType.CENTER })], shading: { fill: "f3f4f6" }, verticalAlign: VerticalAlign.CENTER });
}

function createCell(text) {
  return new TableCell({ children: [new Paragraph({ text: text || "-" })], verticalAlign: VerticalAlign.CENTER });
}
