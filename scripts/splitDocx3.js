import fs from 'fs';

const fileContent = fs.readFileSync('src/lib/docx-service.js', 'utf8');

function extractFunc(name) {
  // Find start
  const startStr = `function ${name}(`;
  const startIdx = fileContent.indexOf(startStr);
  if (startIdx === -1) throw new Error(`Func ${name} not found`);

  // find the block comment before it
  let blockStart = startIdx;
  const commentIdx = fileContent.lastIndexOf('// =================================', startIdx);
  if (commentIdx !== -1 && (startIdx - commentIdx) < 150) {
     blockStart = commentIdx;
  }

  // Find end of function using brace counting
  let openBraces = 0;
  let inFunc = false;
  let endIdx = -1;

  for (let i = startIdx; i < fileContent.length; i++) {
    if (fileContent[i] === '{') {
      openBraces++;
      inFunc = true;
    } else if (fileContent[i] === '}') {
      openBraces--;
      if (inFunc && openBraces === 0) {
        endIdx = i + 1;
        break;
      }
    }
  }

  if (endIdx === -1) throw new Error(`End of ${name} not found`);
  
  let block = fileContent.substring(blockStart, endIdx);
  return block.replace(`function ${name}`, `export function ${name}`);
}

const generateIdx = fileContent.indexOf('export async function generateDocx');
const utilsPart1 = fileContent.substring(0, generateIdx);

let autoExportedUtils = utilsPart1
  .replace(/const FONT/g, 'export const FONT')
  .replace(/const COLOR/g, 'export const COLOR')
  .replace(/const MARGIN/g, 'export const MARGIN')
  .replace(/const LINE_SPACING/g, 'export const LINE_SPACING')
  .replace(/function /g, 'export function ');

autoExportedUtils += `\nexport { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType, HeadingLevel, PageNumber,
  VerticalAlign, BorderStyle, ShadingType, Header, Footer,
  TableOfContents, PageBreak, Tab, TabStopType, TabStopPosition,
  LevelFormat, convertInchesToTwip } from 'docx';\n`;

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

// Extraksi
fs.writeFileSync('src/lib/docx/utils.js', autoExportedUtils);

fs.writeFileSync('src/lib/docx/outline-cover.js', utilsImports + extractFunc('renderCover') + '\n\n' + extractFunc('renderKataPengantar') + '\n\n' + extractFunc('renderDaftarIsi'));
fs.writeFileSync('src/lib/docx/outline-bab1.js', utilsImports + extractFunc('renderBab1'));
fs.writeFileSync('src/lib/docx/outline-bab2.js', utilsImports + extractFunc('renderBab2'));
fs.writeFileSync('src/lib/docx/outline-bab3.js', utilsImports + extractFunc('renderBab3'));
fs.writeFileSync('src/lib/docx/outline-bab4.js', utilsImports + extractFunc('renderBab4'));
fs.writeFileSync('src/lib/docx/outline-bab5.js', utilsImports + extractFunc('renderBab5'));
fs.writeFileSync('src/lib/docx/outline-bab6.js', utilsImports + extractFunc('renderBab6'));
fs.writeFileSync('src/lib/docx/outline-lampiran.js', utilsImports + extractFunc('renderExpertTeam') + '\n\n' + extractFunc('renderLampiranA') + '\n\n' + extractFunc('renderLampiranB'));

// docx-service.js
const generatePart = extractFunc('generateDocx').replace('export export ', 'export ') + '\n\n' + extractFunc('generateDocxBlob').replace('export export ', 'export ');

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
console.log("Extraction complete.");
