// ============================================================
//  DOCX SERVICE — WORD_SAFE_EXPORT MODE
//  Integrator Hub for outline components.
// ============================================================
import { Document, Packer, Header, Footer, Paragraph, AlignmentType, BorderStyle, TextRun, PageNumber, LevelFormat } from 'docx';
import { saveAs } from 'file-saver';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { getSettings } from './settings.js';
import { FONT_SIZE_BODY, FONT_SIZE_CAPTION, COLOR_MUTED, FONT_MAIN, COLOR_BORDER, MARGIN_TOP, MARGIN_RIGHT, MARGIN_BOTTOM, MARGIN_LEFT, safeText, COLOR_PRIMARY, LINE_SPACING, FONT_SIZE_H1, COLOR_HEADING, FONT_SIZE_H2, FONT_SIZE_H3, COLOR_SUBHEADING, formatTanggal } from './docx/utils.js';

// Modular Outlines
import { renderCover, renderKataPengantar, renderDaftarIsi } from './docx/outline-cover.js';
import { renderBab1 } from './docx/outline-bab1.js';
import { renderBab2 } from './docx/outline-bab2.js';
import { renderBab3 } from './docx/outline-bab3.js';
import { renderBab4 } from './docx/outline-bab4.js';
import { renderBab5 } from './docx/outline-bab5.js';
import { renderBab6 } from './docx/outline-bab6.js';
import { renderExpertTeam, renderLampiranA, renderLampiranB } from './docx/outline-lampiran.js';

export async function generateDocx(proyek, analisis, checklist, onProgress) {
  const { blob, fileName } = await generateDocxBlob(proyek, analisis, checklist, onProgress);
  saveAs(blob, fileName);

  if (onProgress) onProgress(100, 'Selesai!');
  return fileName;
}

export async function generateDocxBlob(proyek, analisis, checklist, onProgress) {
  if (onProgress) onProgress(5, 'Cek ketersediaan template kustom...');
  
  const settings = await getSettings();

  // ── TEMPLATE-BASED MODE ──────────────────────────────────────
  // Check project meta first, then global settings
  const customTemplateBase64 = proyek.metadata?.report_template_base64 || settings.report?.customTemplateBase64;

  if (customTemplateBase64 || proyek.metadata?.report_template_url) {
    if (onProgress) onProgress(20, 'Menyiapkan data template...');
    try {
      let tplBase64 = customTemplateBase64;
      
      // Jika ada URL (dari Storage), ambil datanya
      if (!tplBase64 && proyek.metadata?.report_template_url) {
        if (onProgress) onProgress(25, 'Mengunduh template dari storage...');
        // fetchTemplateAsBase64 didefinisikan di bawah
        tplBase64 = await fetchTemplateAsBase64(proyek.metadata.report_template_url);
      }

      if (tplBase64) {
        const blob = await generateFromCustomTemplate(tplBase64, proyek, analisis, checklist, settings, onProgress);
        const tanggal = new Date().toISOString().split('T')[0];
        const fileName = `SLF_${safeText(proyek.nama_bangunan).replace(/\s+/g, '_')}_${tanggal}.docx`;
        return { blob, fileName };
      }
    } catch (err) {
      console.error('Templating failed, falling back to programmatic:', err);
      if (onProgress) onProgress(30, 'Template gagal, beralih ke generator standar...');
    }
  }

  // ── PROGRAMMATIC MODE (FALLBACK) ──────────────────────────────
  if (onProgress) onProgress(10, 'Menyiapkan struktur dokumen standar...');

  const doc = new Document({
    creator: 'Aplikasi Pengkaji Teknis SLF v1.0',
    title: `Laporan Kajian SLF - ${proyek.nama_bangunan}`,
    description: `Laporan Penilaian Kelaikan Fungsi oleh ${settings.consultant.name}`,
    styles: {
      default: {
        document: {
          run: { size: FONT_SIZE_BODY, font: FONT_MAIN, color: COLOR_PRIMARY },
          paragraph: {
            alignment: AlignmentType.JUSTIFIED,
            spacing: { line: LINE_SPACING }
          }
        }
      },
      paragraphStyles: [
        {
          id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: FONT_SIZE_H1, bold: true, font: FONT_MAIN, allCaps: true, color: COLOR_HEADING },
          paragraph: { alignment: AlignmentType.CENTER, spacing: { before: 400, after: 200 } }
        },
        {
          id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: FONT_SIZE_H2, bold: true, font: FONT_MAIN, color: COLOR_HEADING },
          paragraph: { spacing: { before: 300, after: 150 } }
        },
        {
          id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: FONT_SIZE_H3, bold: true, font: FONT_MAIN, color: COLOR_SUBHEADING },
          paragraph: { spacing: { before: 200, after: 100 } }
        }
      ]
    },
    numbering: {
      config: [{
        reference: "ordered-list",
        levels: [{
          level: 0,
          format: LevelFormat.DECIMAL,
          text: "%1.",
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 360, hanging: 260 } } }
        }, {
          level: 1,
          format: LevelFormat.DECIMAL,
          text: "%1.%2",
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } }
        }]
      }]
    },
    sections: [
      // SECTION 1: COVER PAGE (no header/footer)
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838 }, // A4
            margin: { top: 0, right: 0, bottom: 0, left: 0 },
          },
        },
        children: renderCover(proyek, settings),
      },
      // SECTION 2: MAIN CONTENT (with headers/footers)
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838 },
            margin: { top: MARGIN_TOP, right: MARGIN_RIGHT, bottom: MARGIN_BOTTOM, left: MARGIN_LEFT },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                spacing: { after: 120 },
                border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: COLOR_BORDER } },
                children: [
                  new TextRun({ text: `${settings.consultant.name.toUpperCase()} - LAPORAN KAJIAN SLF - `, size: FONT_SIZE_CAPTION, color: COLOR_MUTED, font: FONT_MAIN }),
                  new TextRun({ text: safeText(proyek.nama_bangunan).toUpperCase(), size: FONT_SIZE_CAPTION, color: COLOR_MUTED, font: FONT_MAIN, bold: true }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                border: { top: { style: BorderStyle.SINGLE, size: 1, color: COLOR_BORDER } },
                spacing: { before: 120 },
                children: [
                  new TextRun({ text: 'Laporan Teknis SLF divalidasi oleh Ahli  |  Halaman ', size: FONT_SIZE_CAPTION, color: COLOR_MUTED, font: FONT_MAIN }),
                  new TextRun({ children: [PageNumber.CURRENT], size: FONT_SIZE_CAPTION, color: COLOR_MUTED, font: FONT_MAIN }),
                ],
              }),
            ],
          }),
        },
        children: [
          // KATA PENGANTAR
          ...renderKataPengantar(proyek, settings),

          // DAFTAR ISI
          ...renderDaftarIsi(),

          // BAB I
          ...renderBab1(proyek),

          // BAB II
          ...renderBab2(),

          // BAB III
          ...renderBab3(checklist, proyek),

          // BAB IV
          ...renderBab4(checklist, proyek),

          // BAB V
          ...renderBab5(checklist, proyek),

          // BAB VI
          ...renderBab6(analisis, proyek),

          // PENUTUP & TIM AHLI
          ...renderExpertTeam(settings, proyek),

          // LAMPIRAN A: FOTO DOKUMENTASI
          ...renderLampiranA(checklist),

          // LAMPIRAN B: TENAGA AHLI
          ...renderLampiranB(settings),
        ],
      },
    ],
  });

  if (onProgress) onProgress(95, 'Finalisasi dokumen...');

  const blob = await Packer.toBlob(doc);
  const tanggal = new Date().toISOString().split('T')[0];
  const fileName = `SLF_${safeText(proyek.nama_bangunan).replace(/\s+/g, '_')}_${tanggal}.docx`;

  return { blob, fileName };
}

// ── CUSTOM TEMPLATE HELPERS ──────────────────────────────────

async function generateFromCustomTemplate(base64, proyek, analisis, checklist, settings, onProgress) {
  try {
    if (onProgress) onProgress(40, 'Memproses binary template...');
    
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    
    const zip = new PizZip(bytes.buffer);
    const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
    });

    if (onProgress) onProgress(60, 'Memetakan data ke tag template...');
    
    // Mapping data agar mudah digunakan di template {tag}
    const data = {
        ...proyek,
        alamat_lengkap: [proyek.alamat, proyek.kota, proyek.provinsi].filter(Boolean).join(', '),
        tanggal_laporan: formatTanggal(new Date()),
        consultant: settings.consultant,
        analisis: analisis || {},
        checklist: checklist || [],
        // Summary stats
        total_checklist: checklist?.length || 0,
        total_sesuai: checklist?.filter(c => c.status === 'Sesuai').length || 0,
        total_temuan: checklist?.filter(c => c.status !== 'Sesuai').length || 0,
    };

    doc.render(data);

    if (onProgress) onProgress(80, 'Finalisasi dokumen kustom...');
    const out = doc.getZip().generate({
        type: "blob",
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

    return out;
  } catch (error) {
    console.error('Docxtemplater error:', error);
    throw new Error('Gagal memproses template: ' + error.message);
  }
}

async function fetchTemplateAsBase64(url) {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(',')[1]);
    reader.readAsDataURL(blob);
  });
}
