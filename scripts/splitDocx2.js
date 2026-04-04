import fs from 'fs';
import path from 'path';

const fileContent = fs.readFileSync('src/lib/docx-service.js', 'utf8');

// We will explicitly carve out blocks using their big headers
const blocks = {
  utils: { start: '', end: '// ============================================================\n//  COVER PAGE' },
  cover: { start: '//  COVER PAGE', end: '// ============================================================\n//  KATA PENGANTAR' },
  kataPengantar: { start: '//  KATA PENGANTAR', end: '// ============================================================\n//  DAFTAR ISI' },
  daftarIsi: { start: '//  DAFTAR ISI', end: '// ============================================================\n//  BAB I: PENDAHULUAN' },
  bab1: { start: '//  BAB I: PENDAHULUAN', end: '// ============================================================\n//  BAB II: METODOLOGI' },
  bab2: { start: '//  BAB II: METODOLOGI', end: '// ============================================================\n//  BAB III: IDENTITAS BANGUNAN' },
  bab3: { start: '//  BAB III: IDENTITAS BANGUNAN', end: '// ============================================================\n//  BAB IV: HASIL PEMERIKSAAN' },
  bab4: { start: '//  BAB IV: HASIL PEMERIKSAAN', end: '// ============================================================\n//  BAB V: EVALUASI KINERJA' },
  bab5: { start: '//  BAB V: EVALUASI KINERJA', end: '// ============================================================\n//  BAB VI: KESIMPULAN & REKOMENDASI' },
  bab6: { start: '//  BAB VI: KESIMPULAN & REKOMENDASI', end: '// ============================================================\n//  PENUTUP & TIM AHLI' },
  expertInfo: { start: '//  PENUTUP & TIM AHLI', end: '// ============================================================\n//  LAMPIRAN A' },
  lampiranA: { start: '//  LAMPIRAN A', end: '// ============================================================\n//  LAMPIRAN B' },
  lampiranB: { start: '//  LAMPIRAN B', end: '' } // end of file
};

function extractBlock(content, startMatch, endMatch) {
  let startIndex = 0;
  if (startMatch) {
    const idx = content.indexOf(startMatch);
    if (idx === -1) throw new Error(`Could not find start match: ${startMatch}`);
    // Go up one line to get the `// ==`
    startIndex = content.lastIndexOf('// ==', idx);
    if(startIndex === -1) startIndex = idx;
  }
  
  let endIndex = content.length;
  if (endMatch) {
    const idx = content.indexOf(endMatch);
    if (idx === -1) throw new Error(`Could not find end match: ${endMatch}`);
    // we stop right AT the endMatch (which is the beginning of the next block)
    endIndex = idx;
  }
  
  return content.substring(startIndex, endIndex);
}

// 1. Extract utils
// Wait, utils contains the generateDocxBlob which imports from these modules!
// So it's best to split the first block into 'imports/constants/utils' and 'generateDocxBlob'.
const generateIdx = fileContent.indexOf('export async function generateDocx');

const utilsPart1 = fileContent.substring(0, generateIdx);

const coreDocxIdxEnd = fileContent.indexOf('// ============================================================\n//  COVER PAGE');
const generatePart = fileContent.substring(generateIdx, coreDocxIdxEnd);

// Lets define what we put in docs-utils.js
// We need to export all functions in utilsPart1.
// They are: getStatusLabel, getRiskLabel, getStatusSLFLabel, formatTanggal, safeText
// createTableBorders, headerCell, dataCell, heading1, heading2, heading3, bodyText, bulletItem, numberedItem, emptyLine, pageBreak, horizontalLine
// Constants: FONT_MAIN, FONT_SIZE_BODY, FONT_SIZE_H1... COLOR_PRIMARY... COLOR_DANGER... etc.

let autoExportedUtils = utilsPart1.replace(/const FONT/g, 'export const FONT').replace(/const COLOR/g, 'export const COLOR').replace(/const MARGIN/g, 'export const MARGIN').replace(/const LINE_SPACING/g, 'export const LINE_SPACING').replace(/function /g, 'export function ');
// fix some things that shouldn't be exported maybe? No, all functions and constants are safe to export.

autoExportedUtils += `
export { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType, HeadingLevel, PageNumber,
  VerticalAlign, BorderStyle, ShadingType, Header, Footer,
  TableOfContents, PageBreak, Tab, TabStopType, TabStopPosition,
  LevelFormat, convertInchesToTwip } from 'docx';
`;

fs.writeFileSync('src/lib/docx/utils.js', autoExportedUtils);

const utilsImports = `import {
  getStatusLabel, getRiskLabel, getStatusSLFLabel, formatTanggal, safeText,
  createTableBorders, headerCell, dataCell, heading1, heading2, heading3, 
  bodyText, bulletItem, numberedItem, emptyLine, pageBreak, horizontalLine,
  FONT_MAIN, FONT_SIZE_BODY, FONT_SIZE_H1, FONT_SIZE_H2, FONT_SIZE_H3, FONT_SIZE_SMALL, FONT_SIZE_CAPTION,
  COLOR_PRIMARY, COLOR_HEADING, COLOR_SUBHEADING, COLOR_MUTED, COLOR_SUCCESS, COLOR_DANGER, COLOR_WARNING, COLOR_HEADER_BG, COLOR_TABLE_ALT, COLOR_BORDER, COLOR_COVER_BG, COLOR_ACCENT, COLOR_WHITE, COLOR_NAVY,
  MARGIN_TOP, MARGIN_BOTTOM, MARGIN_LEFT, MARGIN_RIGHT, LINE_SPACING,
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType, HeadingLevel, PageNumber,
  VerticalAlign, BorderStyle, ShadingType, Header, Footer,
  TableOfContents, PageBreak, Tab, TabStopType, TabStopPosition,
  LevelFormat, convertInchesToTwip
} from './utils.js';\n\n`;

// 2. Extract sections
const coverSrc = extractBlock(fileContent, blocks.cover.start, blocks.cover.end) + extractBlock(fileContent, blocks.kataPengantar.start, blocks.kataPengantar.end) + extractBlock(fileContent, blocks.daftarIsi.start, blocks.daftarIsi.end);
fs.writeFileSync('src/lib/docx/outline-cover.js', utilsImports + coverSrc.replace(/function render/g, 'export function render'));

const bab1Src = extractBlock(fileContent, blocks.bab1.start, blocks.bab1.end);
fs.writeFileSync('src/lib/docx/outline-bab1.js', utilsImports + bab1Src.replace(/function render/g, 'export function render'));

const bab2Src = extractBlock(fileContent, blocks.bab2.start, blocks.bab2.end);
fs.writeFileSync('src/lib/docx/outline-bab2.js', utilsImports + bab2Src.replace(/function render/g, 'export function render'));

const bab3Src = extractBlock(fileContent, blocks.bab3.start, blocks.bab3.end);
fs.writeFileSync('src/lib/docx/outline-bab3.js', utilsImports + bab3Src.replace(/function render/g, 'export function render'));

const bab4Src = extractBlock(fileContent, blocks.bab4.start, blocks.bab4.end);
fs.writeFileSync('src/lib/docx/outline-bab4.js', utilsImports + bab4Src.replace(/function render/g, 'export function render'));

const bab5Src = extractBlock(fileContent, blocks.bab5.start, blocks.bab5.end);
fs.writeFileSync('src/lib/docx/outline-bab5.js', utilsImports + bab5Src.replace(/function render/g, 'export function render'));

const bab6Src = extractBlock(fileContent, blocks.bab6.start, blocks.bab6.end);
fs.writeFileSync('src/lib/docx/outline-bab6.js', utilsImports + bab6Src.replace(/function render/g, 'export function render'));

const lampiranSrc = extractBlock(fileContent, blocks.expertInfo.start, blocks.expertInfo.end) + extractBlock(fileContent, blocks.lampiranA.start, blocks.lampiranA.end) + extractBlock(fileContent, blocks.lampiranB.start, blocks.lampiranB.end);
fs.writeFileSync('src/lib/docx/outline-lampiran.js', utilsImports + lampiranSrc.replace(/function render/g, 'export function render'));

// 3. Rebuild docx-service.js
const docxServiceNew = `// ============================================================
//  DOCX SERVICE — WORD_SAFE_EXPORT MODE
//  Integrator Hub for outline components.
// ============================================================
import { Document, Packer, Header, Footer, Paragraph, AlignmentType, BorderStyle, TextRun, PageNumber } from 'docx';
import { saveAs } from 'file-saver';
import { getSettings } from './settings.js';
// Utils
import { FONT_SIZE_CAPTION, COLOR_MUTED, FONT_MAIN, COLOR_BORDER, MARGIN_TOP, MARGIN_RIGHT, MARGIN_BOTTOM, MARGIN_LEFT, safeText } from './docx/utils.js';

// Modular Outlines
import { renderCover, renderKataPengantar, renderDaftarIsi } from './docx/outline-cover.js';
import { renderBab1 } from './docx/outline-bab1.js';
import { renderBab2 } from './docx/outline-bab2.js';
import { renderBab3 } from './docx/outline-bab3.js';
import { renderBab4 } from './docx/outline-bab4.js';
import { renderBab5 } from './docx/outline-bab5.js';
import { renderBab6 } from './docx/outline-bab6.js';
import { renderExpertTeam, renderLampiranA, renderLampiranB } from './docx/outline-lampiran.js';

${generatePart}
`;

fs.writeFileSync('src/lib/docx-service.js', docxServiceNew);

console.log("Successfully splitted all files!");
