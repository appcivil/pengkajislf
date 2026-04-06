// ============================================================
//  GOOGLE APPS SCRIPT — SLF REPORT TEMPLATE ENGINE
//  Smart AI Pengkaji SLF — Template-based Report Generator
//
//  CARA DEPLOY:
//  1. Buka script.google.com → New Project
//  2. Paste script ini
//  3. Deploy → New Deployment → Web App
//     - Execute as: Me (your account)
//     - Who has access: Anyone (or Anyone with Google Account)
//  4. Copy deployment URL ke Pengaturan Aplikasi
//
//  ENDPOINTS:
//  POST → action=generateFromTemplate  → Copy template + isi data
//  POST → action=uploadFile            → Upload file ke Drive (existing)
//  POST → action=createFolder          → Buat folder proyek
//  GET  → action=getInfo               → Cek status & template info
// ============================================================

// ── KONFIGURASI GLOBAL ────────────────────────────────────────
const CONFIG = {
  // ID folder root di Google Drive untuk menyimpan hasil laporan
  // Buat folder dulu di Drive, klik kanan → Share → copy ID dari URL
  ROOT_FOLDER_ID: '19RLtLY1CMdRd92PjygN681VI_LsJuRzM',
  
  // ID template Google Docs master
  // Bisa di-override per request dari aplikasi
  DEFAULT_TEMPLATE_ID: '1o7wGODOTtybJz-OrO63OmTNGQyPz-opvqNzopbfayrw',
  
  // Nama folder output (akan dibuat di bawah ROOT_FOLDER_ID)
  OUTPUT_FOLDER_NAME: 'Laporan SLF Generated',
  
  // CORS — domain yang diizinkan (kosongkan untuk izinkan semua)
  ALLOWED_ORIGINS: [], // contoh: ['https://appcivil.github.io']
};

// ── ENTRY POINT ───────────────────────────────────────────────

/**
 * Handler HTTP GET — Untuk health check dan info
 */
function doGet(e) {
  const action = (e?.parameter?.action) || 'getInfo';
  
  try {
    if (action === 'getInfo') {
      return buildJsonResponse({
        status: 'ok',
        service: 'SLF Report Template Engine',
        version: '2.0.0',
        templateConfigured: !!CONFIG.DEFAULT_TEMPLATE_ID && CONFIG.DEFAULT_TEMPLATE_ID !== 'ISI_DENGAN_ID_TEMPLATE_GOOGLE_DOCS_ANDA',
        folderConfigured: !!CONFIG.ROOT_FOLDER_ID && CONFIG.ROOT_FOLDER_ID !== 'ISI_DENGAN_ID_FOLDER_ROOT_DRIVE_ANDA',
        timestamp: new Date().toISOString(),
      });
    }
    
    if (action === 'checkTemplate') {
      const templateId = e?.parameter?.templateId || CONFIG.DEFAULT_TEMPLATE_ID;
      return checkTemplateValidity(templateId);
    }
    
    return buildJsonResponse({ error: 'Unknown GET action' }, 400);
  } catch (err) {
    return buildJsonResponse({ error: err.message, stack: err.stack }, 500);
  }
}

/**
 * Handler HTTP POST — Semua aksi write
 */
function doPost(e) {
  try {
    // Check if e and e.postData exist (handle direct script execution)
    if (!e || !e.postData || !e.postData.contents) {
      Logger.log('doPost called without proper POST data');
      return buildJsonResponse({ 
        error: 'Invalid request: POST data required. This endpoint must be called via HTTP POST with JSON body.' 
      }, 400);
    }
    
    // Parse JSON body
    const body = JSON.parse(e.postData.contents || '{}');
    const action = body.action || 'uploadFile'; // backward-compat: default upload
    
    if (action === 'generateFromTemplate') {
      return handleGenerateFromTemplate(body);
    }
    
    if (action === 'uploadFile') {
      return handleUploadFile(body);
    }
    
    if (action === 'createFolder') {
      return handleCreateFolder(body);
    }
    
    if (action === 'updateDocument') {
      return handleUpdateDocument(body);
    }
    
    return buildJsonResponse({ error: 'Unknown action: ' + action }, 400);
    
  } catch (err) {
    Logger.log('doPost ERROR: ' + err.message + '\n' + err.stack);
    return buildJsonResponse({ error: err.message }, 500);
  }
}

// ── HANDLER: GENERATE FROM TEMPLATE ──────────────────────────

/**
 * Menyalin template Google Docs, mengisi semua placeholder dengan data proyek,
 * dan mengembalikan ID dokumen yang sudah terisi.
 *
 * @param {Object} body - Payload dari frontend
 * @param {string} body.templateId - (Opsional) Override ID template
 * @param {string} body.proyekId - ID proyek untuk penamaan folder
 * @param {Object} body.data - Map lengkap placeholder → nilai
 * @param {string} body.docTitle - Judul dokumen hasil
 * @returns {Object} { id, url, editUrl, embedUrl }
 */
function handleGenerateFromTemplate(body) {
  const templateId = body.templateId || CONFIG.DEFAULT_TEMPLATE_ID;
  
  if (!templateId || templateId === 'ISI_DENGAN_ID_TEMPLATE_GOOGLE_DOCS_ANDA') {
    return buildJsonResponse({
      error: 'Template ID belum dikonfigurasi. Set di Google Apps Script CONFIG atau kirim templateId dalam request.',
    }, 400);
  }
  
  // 1. Pastikan output folder ada
  const outputFolder = getOrCreateOutputFolder(body.proyekId);
  
  // 2. Copy template ke folder output
  const templateFile = DriveApp.getFileById(templateId);
  const docTitle = body.docTitle || `Laporan SLF - ${body.data?.NAMA_BANGUNAN || 'Bangunan'} - ${formatDateId(new Date())}`;
  
  const copiedFile = templateFile.makeCopy(docTitle, outputFolder);
  const docId = copiedFile.getId();
  
  // 3. Buka sebagai Google Doc dan replace semua placeholder
  const doc = DocumentApp.openById(docId);
  const placeholders = body.data || {};
  
  fillDocumentPlaceholders(doc, placeholders);
  fillTablesInDocument(doc, placeholders);
  
  doc.saveAndClose();
  
  // 4. Set sharing ke "anyone with link can view/edit"
  // Agar bisa di-embed sebagai iframe di aplikasi
  const file = DriveApp.getFileById(docId);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.EDIT);
  
  const editUrl   = `https://docs.google.com/document/d/${docId}/edit`;
  const embedUrl  = `https://docs.google.com/document/d/${docId}/edit?embedded=true&rm=minimal`;
  const exportDocx = `https://docs.google.com/document/d/${docId}/export?format=docx`;
  const exportPdf  = `https://docs.google.com/document/d/${docId}/export?format=pdf`;
  
  Logger.log(`[GenerateFromTemplate] Berhasil membuat: ${docTitle} | ID: ${docId}`);
  
  return buildJsonResponse({
    success: true,
    id: docId,
    title: docTitle,
    url: editUrl,
    editUrl,
    embedUrl,
    exportDocxUrl: exportDocx,
    exportPdfUrl: exportPdf,
    folderId: outputFolder.getId(),
    folderUrl: `https://drive.google.com/drive/folders/${outputFolder.getId()}`,
  });
}

// ── PLACEHOLDER ENGINE ────────────────────────────────────────

/**
 * Mengisi semua placeholder {{KEY}} di seluruh body dokumen
 * termasuk header, footer, dan tabel.
 */
function fillDocumentPlaceholders(doc, data) {
  const body = doc.getBody();
  
  // Replace di body paragraphs
  replaceTextInBody(body, data);
  
  // Replace di header  
  try {
    const header = doc.getHeader();
    if (header) replaceTextInBody(header, data);
  } catch(e) { /* Header mungkin tidak ada */ }
  
  // Replace di footer
  try {
    const footer = doc.getFooter();
    if (footer) replaceTextInBody(footer, data);
  } catch(e) { /* Footer mungkin tidak ada */ }
}

/**
 * Replace semua placeholder pada element body/header/footer
 */
function replaceTextInBody(body, data) {
  Object.keys(data).forEach(key => {
    const placeholder = `{{${key}}}`;
    const value = String(data[key] ?? '-');
    
    // Gunakan replaceText bawaan Google Docs (lebih andal)
    try {
      body.replaceText(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), value);
    } catch(e) {
      Logger.log(`Gagal replace ${placeholder}: ${e.message}`);
    }
  });
}

/**
 * Mengisi tabel-tabel khusus yang menggunakan flag di cell pertama.
 * 
 * Konvensi template:
 * - Tabel Checklist Admin → cell pertama row header berisi "{{TABLE_CHECKLIST_ADMIN}}"
 * - Tabel Checklist Teknis → "{{TABLE_CHECKLIST_TEKNIS}}"
 * - Tabel Tim Ahli → "{{TABLE_TIM_AHLI}}"
 * - Tabel Rekomendasi P1 → "{{TABLE_REKOMENDASI_P1}}"
 * - Tabel Rekomendasi P2 → "{{TABLE_REKOMENDASI_P2}}"
 * - Tabel Rekomendasi P3 → "{{TABLE_REKOMENDASI_P3}}"
 */
function fillTablesInDocument(doc, data) {
  const body = doc.getBody();
  const tables = body.getTables();
  
  tables.forEach(table => {
    if (table.getNumRows() === 0) return;
    const firstCell = table.getCell(0, 0).getText().trim();
    
    if (firstCell === '{{TABLE_CHECKLIST_ADMIN}}' && data._checklistAdmin) {
      fillChecklistTable(table, data._checklistAdmin);
    } else if (firstCell === '{{TABLE_CHECKLIST_TEKNIS}}' && data._checklistTeknis) {
      fillChecklistTable(table, data._checklistTeknis);
    } else if (firstCell === '{{TABLE_TIM_AHLI}}' && data._timAhli) {
      fillTimAhliTable(table, data._timAhli);
    } else if (firstCell === '{{TABLE_REKOMENDASI_P1}}' && data._rekomendasiP1) {
      fillRekomendasiTable(table, data._rekomendasiP1);
    } else if (firstCell === '{{TABLE_REKOMENDASI_P2}}' && data._rekomendasiP2) {
      fillRekomendasiTable(table, data._rekomendasiP2);
    } else if (firstCell === '{{TABLE_REKOMENDASI_P3}}' && data._rekomendasiP3) {
      fillRekomendasiTable(table, data._rekomendasiP3);
    } else if (firstCell === '{{TABLE_SKOR_ASPEK}}' && data._skorAspek) {
      fillSkorAspekTable(table, data._skorAspek);
    }
  });
}

/**
 * Mengisi tabel checklist (Admin / Teknis).
 * Struktur tabel di template:
 * Row 0 → Header: {{TABLE_CHECKLIST_ADMIN}}  | - | - | -
 * Row 1 → Header: No | Kode | Item | Status | Catatan
 * Row 2+ → Data rows (bisa ada 1 placeholder row yang akan dihapus dan diganti)
 */
function fillChecklistTable(table, items) {
  if (!items || items.length === 0) return;
  
  // Hapus semua row data (dari row 2 ke bawah, row 0 & 1 adalah header flags & kolom header)
  while (table.getNumRows() > 2) {
    table.removeRow(table.getNumRows() - 1);
  }
  
  const style = { 
    [DocumentApp.Attribute.FONT_SIZE]: 10,
    [DocumentApp.Attribute.FONT_FAMILY]: 'Calibri',
  };
  
  items.forEach((item, idx) => {
    const row = table.appendRow();
    const isGood = ['ada_sesuai', 'baik'].includes(item.status);
    const isBad  = ['ada_tidak_sesuai', 'buruk', 'kritis', 'tidak_ada'].includes(item.status);
    
    // Kolom: No | Kode | Nama Item | Status | Catatan
    appendCell(row, String(idx + 1), true, style);
    appendCell(row, item.kode || '-', false, style);
    appendCell(row, item.nama || '-', true, style);
    appendCell(row, mapStatusLabel(item.status), false, {
      ...style,
      [DocumentApp.Attribute.FOREGROUND_COLOR]: isGood ? '#065f46' : isBad ? '#991b1b' : '#92400e',
      [DocumentApp.Attribute.BOLD]: true,
    });
    appendCell(row, item.catatan || '-', false, style);
  });
  
  // Update flag cell menjadi teks biasa
  table.getCell(0, 0).setText('');
}

/**
 * Mengisi tabel tim ahli dan tanda tangan.
 */
function fillTimAhliTable(table, experts) {
  if (!experts || experts.length === 0) return;
  
  while (table.getNumRows() > 2) {
    table.removeRow(table.getNumRows() - 1);
  }
  
  const style = { 
    [DocumentApp.Attribute.FONT_SIZE]: 10,
    [DocumentApp.Attribute.FONT_FAMILY]: 'Calibri'
  };
  
  experts.forEach((exp, idx) => {
    const row = table.appendRow();
    appendCell(row, String(idx + 1), true, style);
    appendCell(row, exp.name || '-', true, style);
    appendCell(row, exp.ska || '-', false, { ...style, [DocumentApp.Attribute.FOREGROUND_COLOR]: '#64748b' });
    appendCell(row, '', false, style); // Kolom TTD (kosong untuk manual)
  });
  
  table.getCell(0, 0).setText('');
}

/**
 * Mengisi tabel rekomendasi (P1/P2/P3).
 */
function fillRekomendasiTable(table, items) {
  if (!items || items.length === 0) {
    // Set pesan kosong di body tabel
    table.getCell(0, 0).setText('Tidak ada rekomendasi pada level prioritas ini.');
    return;
  }
  
  while (table.getNumRows() > 2) {
    table.removeRow(table.getNumRows() - 1);
  }
  
  const style = { 
    [DocumentApp.Attribute.FONT_SIZE]: 10,
    [DocumentApp.Attribute.FONT_FAMILY]: 'Calibri'
  };
  
  items.forEach((r, idx) => {
    const row = table.appendRow();
    appendCell(row, String(idx + 1), true, style);
    appendCell(row, r.aspek || '-', true, style);
    appendCell(row, `${r.judul || ''}: ${r.tindakan || ''}`.trim(), false, style);
    appendCell(row, r.standar || '-', false, { ...style, [DocumentApp.Attribute.ITALIC]: true });
    appendCell(row, (r.prioritas || '-').toUpperCase(), true, {
      ...style,
      [DocumentApp.Attribute.FOREGROUND_COLOR]: '#991b1b',
    });
  });
  
  table.getCell(0, 0).setText('');
}

/**
 * Mengisi tabel skor per aspek.
 */
function fillSkorAspekTable(table, skorAspek) {
  if (!skorAspek || skorAspek.length === 0) return;
  
  while (table.getNumRows() > 2) {
    table.removeRow(table.getNumRows() - 1);
  }
  
  const style = { 
    [DocumentApp.Attribute.FONT_SIZE]: 10,
    [DocumentApp.Attribute.FONT_FAMILY]: 'Calibri'
  };
  
  skorAspek.forEach((a, idx) => {
    const skor = a.skor || 0;
    const color = skor >= 80 ? '#065f46' : skor >= 60 ? '#92400e' : '#991b1b';
    const row = table.appendRow();
    appendCell(row, String(idx + 1), true, style);
    appendCell(row, a.aspek, false, style);
    appendCell(row, `${skor} / 100`, true, {
      ...style, 
      [DocumentApp.Attribute.FOREGROUND_COLOR]: color,
      [DocumentApp.Attribute.BOLD]: true
    });
    appendCell(row, a.bobot || '-', true, { ...style, [DocumentApp.Attribute.FOREGROUND_COLOR]: '#64748b' });
    appendCell(row, a.acuan || '-', false, { ...style, [DocumentApp.Attribute.ITALIC]: true });
  });
  
  table.getCell(0, 0).setText('');
}

// ── TABEL HELPER ─────────────────────────────────────────────

function appendCell(row, text, isBold, style) {
  const cell = row.appendTableCell();
  const para = cell.editAsText();
  para.setText(text || '');
  para.setAttributes(style || {});
  if (isBold) para.setBold(true);
  cell.setPaddingTop(4);
  cell.setPaddingBottom(4);
  cell.setPaddingLeft(6);
  cell.setPaddingRight(6);
  return cell;
}

// ── HANDLER: UPLOAD FILE ──────────────────────────────────────

/**
 * Upload base64 file ke Google Drive (backward-compat dengan versi lama)
 */
function handleUploadFile(body) {
  const { base64, mimeType, fileName, proyekId, aspek, itemCode } = body;
  
  if (!base64) return buildJsonResponse({ error: 'base64 diperlukan' }, 400);
  
  const folder = getOrCreateOutputFolder(proyekId, aspek || 'Lampiran');
  const blob = Utilities.newBlob(Utilities.base64Decode(base64), mimeType || 'application/octet-stream', fileName || 'file');
  
  const file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  
  return buildJsonResponse({
    success: true,
    id: file.getId(),
    url: file.getUrl(),
    viewUrl: `https://drive.google.com/file/d/${file.getId()}/view`,
    downloadUrl: `https://drive.google.com/uc?export=download&id=${file.getId()}`,
  });
}

// ── HANDLER: CREATE FOLDER ────────────────────────────────────

function handleCreateFolder(body) {
  const { proyekId, folderName } = body;
  const folder = getOrCreateOutputFolder(proyekId, folderName);
  
  return buildJsonResponse({
    success: true,
    id: folder.getId(),
    url: `https://drive.google.com/drive/folders/${folder.getId()}`,
  });
}

// ── HANDLER: UPDATE DOCUMENT ──────────────────────────────────

/**
 * Update placeholder pada dokumen yang sudah ada (bukan copy template).
 * Berguna untuk regenerasi konten tanpa membuat dokumen baru.
 */
function handleUpdateDocument(body) {
  const { docId, data } = body;
  if (!docId) return buildJsonResponse({ error: 'docId diperlukan' }, 400);
  
  const doc = DocumentApp.openById(docId);
  const placeholders = data || {};
  
  fillDocumentPlaceholders(doc, placeholders);
  fillTablesInDocument(doc, placeholders);
  
  doc.saveAndClose();
  
  return buildJsonResponse({
    success: true,
    id: docId,
    editUrl: `https://docs.google.com/document/d/${docId}/edit`,
    embedUrl: `https://docs.google.com/document/d/${docId}/edit?embedded=true&rm=minimal`,
  });
}

// ── UTILITY FUNCTIONS ─────────────────────────────────────────

/**
 * Mendapatkan atau membuat folder output untuk proyek
 */
function getOrCreateOutputFolder(proyekId, subFolder) {
  let rootFolder;
  
  try {
    rootFolder = DriveApp.getFolderById(CONFIG.ROOT_FOLDER_ID);
  } catch(e) {
    // Jika root folder tidak tersedia, gunakan My Drive
    rootFolder = DriveApp.getRootFolder();
  }
  
  // Buat / cari folder Output Laporan
  const outputFolderName = CONFIG.OUTPUT_FOLDER_NAME;
  let outputFolder = findOrCreateFolder(rootFolder, outputFolderName);
  
  // Buat / cari folder per proyek
  if (proyekId) {
    const proyekFolderName = `Proyek_${proyekId}`;
    outputFolder = findOrCreateFolder(outputFolder, proyekFolderName);
  }
  
  // Sub-folder opsional (aspek / subfolder tertentu)
  if (subFolder) {
    outputFolder = findOrCreateFolder(outputFolder, subFolder);
  }
  
  return outputFolder;
}

function findOrCreateFolder(parent, name) {
  const existing = parent.getFoldersByName(name);
  if (existing.hasNext()) return existing.next();
  return parent.createFolder(name);
}

/**
 * Validasi apakah template ID valid dan bisa diakses
 */
function checkTemplateValidity(templateId) {
  try {
    const file = DriveApp.getFileById(templateId);
    const mimeType = file.getMimeType();
    const isDoc = mimeType === MimeType.GOOGLE_DOCS;
    
    return buildJsonResponse({
      valid: isDoc,
      templateId,
      name: file.getName(),
      mimeType,
      isGoogleDoc: isDoc,
      lastModified: file.getLastUpdated().toISOString(),
    });
  } catch(e) {
    return buildJsonResponse({
      valid: false,
      templateId,
      error: 'Tidak dapat mengakses template: ' + e.message,
    });
  }
}

/**
 * Format tanggal ke format Indonesia
 */
function formatDateId(date) {
  const months = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

/**
 * Map status code ke label Indonesia
 */
function mapStatusLabel(s) {
  const map = {
    'ada_sesuai': 'Sesuai',
    'ada_tidak_sesuai': 'Tidak Sesuai',
    'tidak_ada': 'Tidak Ada',
    'pertama_kali': 'Pertama Kali',
    'baik': 'Baik',
    'sedang': 'Sedang',
    'buruk': 'Buruk',
    'kritis': 'Kritis',
    'tidak_wajib': 'Tdk Wajib',
    'tidak_ada_renovasi': 'Tdk Ada',
  };
  return map[s] || s || '-';
}

/**
 * Build JSON response dengan CORS headers
 */
function buildJsonResponse(data, statusCode) {
  const output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}
