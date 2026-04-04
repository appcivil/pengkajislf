// ============================================================
//  DOCX SERVICE — WORD_SAFE_EXPORT MODE
//  Professional Engineering Report Generator
//  Standar: PUPR / SNI 9273:2025 / ASCE 41-17
//  Format: A4, Calibri, Margin 3cm/2.5cm
// ============================================================
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType, HeadingLevel, PageNumber,
  VerticalAlign, BorderStyle, ShadingType, Header, Footer,
  TableOfContents, PageBreak, Tab, TabStopType, TabStopPosition,
  LevelFormat, convertInchesToTwip
} from 'docx';
import { saveAs } from 'file-saver';
import { getStructuredDataForDocx } from '../report-formatter.js';
import { getSettings } from '../settings.js';
import PizZip from 'pizzip/dist/pizzip.js';
import Docxtemplater from 'docxtemplater';
import { buildPlaceholderData } from '../gdocs-template-service.js';
import { supabase } from '../supabase.js';

// ── CONSTANTS ─────────────────────────────────────────────────
export const FONT_MAIN = 'Calibri';
export const FONT_SIZE_BODY = 22;       // 11pt
export const FONT_SIZE_H1 = 32;        // 16pt
export const FONT_SIZE_H2 = 28;        // 14pt
export const FONT_SIZE_H3 = 24;        // 12pt
export const FONT_SIZE_SMALL = 20;     // 10pt
export const FONT_SIZE_CAPTION = 18;   // 9pt

export const COLOR_PRIMARY = '1a1a2e';
export const COLOR_HEADING = '1e3a8a';
export const COLOR_SUBHEADING = '374151';
export const COLOR_MUTED = '6b7280';
export const COLOR_SUCCESS = '065f46';
export const COLOR_DANGER = '991b1b';
export const COLOR_WARNING = '92400e';
export const COLOR_HEADER_BG = 'f1f5f9';
export const COLOR_TABLE_ALT = 'f9fafb';
export const COLOR_BORDER = 'd1d5db';
export const COLOR_COVER_BG = '1e3a8a';
export const COLOR_ACCENT = 'c5a059'; // Gold accent for premium feel
export const COLOR_WHITE = 'ffffff';
export const COLOR_NAVY = '0f172a';

// Margin: Atas 3cm, Bawah 2.5cm, Kiri 3cm, Kanan 2.5cm
export const MARGIN_TOP = 1701;    // 3cm in twips
export const MARGIN_BOTTOM = 1417; // 2.5cm
export const MARGIN_LEFT = 1701;   // 3cm
export const MARGIN_RIGHT = 1417;  // 2.5cm

export const LINE_SPACING = 360; // 1.5 line spacing

// ── UTILS ─────────────────────────────────────────────────────
export function getStatusLabel(s) {
  const map = {
    'ada_sesuai': 'Sesuai',
    'ada_tidak_sesuai': 'Tidak Sesuai',
    'tidak_ada': 'Tidak Ada',
    'pertama_kali': 'Pertama Kali',
    'baik': 'Baik',
    'sedang': 'Sedang',
    'buruk': 'Buruk',
    'kritis': 'Kritis',
    'tidak_wajib': 'Tidak Wajib',
    'tidak_ada_renovasi': 'Tidak Ada Renovasi'
  };
  return map[s] || s || '-';
}

export function getRiskLabel(level) {
  const map = { low: 'Rendah', medium: 'Sedang', high: 'Tinggi', critical: 'Kritis' };
  return map[level] || level || '-';
}

export function getStatusSLFLabel(s) {
  const map = {
    'LAIK_FUNGSI': 'LAIK FUNGSI',
    'LAIK_FUNGSI_BERSYARAT': 'LAIK FUNGSI BERSYARAT',
    'TIDAK_LAIK_FUNGSI': 'TIDAK LAIK FUNGSI',
    'DALAM_PENGKAJIAN': 'DALAM PENGKAJIAN'
  };
  return map[s] || s || 'BELUM DIANALISIS';
}

export function formatTanggal(d) {
  try {
    return new Date(d).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
  } catch { return String(d || ''); }
}

export function safeText(t) {
  // Strip emoji and special chars for Word safety
  return String(t || '').replace(/[\u{1F600}-\u{1F9FF}]/gu, '')
    .replace(/[\u{2600}-\u{26FF}]/gu, '')
    .replace(/[\u{2700}-\u{27BF}]/gu, '')
    .replace(/[\u{FE00}-\u{FE0F}]/gu, '')
    .replace(/[\u{1F000}-\u{1F02F}]/gu, '')
    .trim();
}

// ── TABLE BUILDER HELPERS ─────────────────────────────────────
export function createTableBorders() {
  return {
    top: { style: BorderStyle.SINGLE, size: 1, color: COLOR_BORDER },
    bottom: { style: BorderStyle.SINGLE, size: 1, color: COLOR_BORDER },
    left: { style: BorderStyle.SINGLE, size: 1, color: COLOR_BORDER },
    right: { style: BorderStyle.SINGLE, size: 1, color: COLOR_BORDER },
    insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: COLOR_BORDER },
    insideVertical: { style: BorderStyle.SINGLE, size: 1, color: COLOR_BORDER },
  };
}

export function headerCell(text, widthPct) {
  return new TableCell({
    width: { size: widthPct, type: WidthType.PERCENTAGE },
    shading: { fill: COLOR_HEADER_BG, type: ShadingType.CLEAR },
    margins: { top: 80, bottom: 80, left: 100, right: 100 },
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      keepNext: true, // Header tabel menempel ke baris pertama
      children: [new TextRun({ text: safeText(text), bold: true, size: FONT_SIZE_SMALL, font: FONT_MAIN, color: COLOR_HEADING })]
    })]
  });
}

export function dataCell(text, widthPct, opts = {}) {
  return new TableCell({
    width: { size: widthPct, type: WidthType.PERCENTAGE },
    shading: opts.shading ? { fill: opts.shading, type: ShadingType.CLEAR } : undefined,
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({
      alignment: opts.center ? AlignmentType.CENTER : AlignmentType.LEFT,
      widowControl: true, // Hindari teks orphans di split table
      children: [new TextRun({
        text: safeText(text),
        size: opts.size || FONT_SIZE_SMALL,
        font: FONT_MAIN,
        bold: opts.bold || false,
        color: opts.color || COLOR_PRIMARY,
        italics: opts.italics || false
      })]
    })]
  });
}

// ── PARAGRAPH HELPERS ─────────────────────────────────────────
export function heading1(text, opts = {}) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    alignment: AlignmentType.CENTER,
    spacing: { before: 400, after: 200 },
    keepNext: true,
    keepLines: true,
    pageBreakBefore: opts.pageBreakBefore !== false, // Default true
    children: [new TextRun({
      text: safeText(text).toUpperCase(),
      bold: true,
      size: FONT_SIZE_H1,
      font: FONT_MAIN,
      color: COLOR_HEADING,
      allCaps: true
    })]
  });
}

export function heading2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 300, after: 150 },
    keepNext: true,
    keepLines: true,
    children: [new TextRun({
      text: safeText(text),
      bold: true,
      size: FONT_SIZE_H2,
      font: FONT_MAIN,
      color: COLOR_HEADING
    })]
  });
}

export function heading3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 100 },
    keepNext: true,
    keepLines: true,
    children: [new TextRun({
      text: safeText(text),
      bold: true,
      size: FONT_SIZE_H3,
      font: FONT_MAIN,
      color: COLOR_SUBHEADING
    })]
  });
}

export function bodyText(text, opts = {}) {
  if (!text) return new Paragraph({ spacing: { before: 60 } });
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: opts.spacingAfter || 120, line: LINE_SPACING },
    indent: opts.indent ? { left: opts.indent } : undefined,
    widowControl: true, // Cegah widow/orphan
    children: [new TextRun({
      text: safeText(text),
      size: opts.size || FONT_SIZE_BODY,
      font: FONT_MAIN,
      bold: opts.bold || false,
      italics: opts.italics || false,
      color: opts.color || COLOR_PRIMARY
    })]
  });
}

export function bulletItem(text, level = 0) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 80, line: LINE_SPACING },
    bullet: { level },
    children: [new TextRun({
      text: safeText(text),
      size: FONT_SIZE_BODY,
      font: FONT_MAIN,
      color: COLOR_PRIMARY
    })]
  });
}

export function numberedItem(num, text, bold = false) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 80, line: LINE_SPACING },
    indent: { left: 360 },
    children: [
      new TextRun({ text: `${num}. `, bold: true, size: FONT_SIZE_BODY, font: FONT_MAIN }),
      new TextRun({ text: safeText(text), bold, size: FONT_SIZE_BODY, font: FONT_MAIN })
    ]
  });
}

export function emptyLine() {
  return new Paragraph({ spacing: { before: 100 } });
}

export function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}

export function horizontalLine() {
  return new Paragraph({
    spacing: { before: 200, after: 200 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: COLOR_BORDER } }
  });
}

/**
 * Generate DOCX and trigger download
 */
/**
 * Helpers for markdown to DOCX
 */
export function renderMarkdownToDocx(mdText) {
  if (!mdText) return [];
  const lines = mdText.split('\n');
  return lines.map(line => {
    line = line.trim();
    if (!line) return emptyLine();
    
    // Check if it's a list item
    if (line.startsWith('- ') || line.startsWith('* ')) {
      return bulletItem(line.substring(2));
    }
    if (/^\d+\.\s/.test(line)) {
      const match = line.match(/^(\d+)\.\s(.*)/);
      return numberedItem(match[1], match[2]);
    }
    
    // Bold parsing basic
    const runs = [];
    const parts = line.split(/(\*\*.*?\*\*)/g);
    parts.forEach(part => {
      if (part.startsWith('**') && part.endsWith('**')) {
        runs.push(new TextRun({ text: safeText(part.slice(2, -2)), bold: true, size: FONT_SIZE_BODY, font: FONT_MAIN, color: COLOR_PRIMARY }));
      } else if (part) {
        runs.push(new TextRun({ text: safeText(part), size: FONT_SIZE_BODY, font: FONT_MAIN, color: COLOR_PRIMARY }));
      }
    });

    return new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 120, line: LINE_SPACING },
      children: runs
    });
  });
}

export { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType, HeadingLevel, PageNumber,
  VerticalAlign, BorderStyle, ShadingType, Header, Footer,
  TableOfContents, PageBreak, Tab, TabStopType, TabStopPosition,
  LevelFormat, convertInchesToTwip } from 'docx';
