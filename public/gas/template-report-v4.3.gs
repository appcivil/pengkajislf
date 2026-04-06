// ============================================================
//  GOOGLE APPS SCRIPT — SLF REPORT TEMPLATE ENGINE v4.3
//  Smart AI Pengkaji SLF — Template-based Report Generator
//  Changelog v4.3: Merge dengan Modular DOCX Engine
//
//  CARA DEPLOY:
//  1. Buka script.google.com → New Project
//  2. Paste script ini
//  3. Deploy → New Deployment → Web App
//     - Execute as: Me (your account)
//     - Who has access: Anyone
//  4. Copy deployment URL ke .env: VITE_GOOGLE_APPS_SCRIPT_URL
// ============================================================

// ── KONFIGURASI GLOBAL ────────────────────────────────────────
const CONFIG = {
  // ID folder root di Google Drive untuk menyimpan hasil laporan
  ROOT_FOLDER_ID: '19RLtLY1CMdRd92PjygN681VI_LsJuRzM',
  
  // ID template Google Docs master (dari .env)
  DEFAULT_TEMPLATE_ID: '1o7wGODOTtybJz-OrO63OmTNGQyPz-opvqNzopbfayrw',
  
  // Nama folder output
  OUTPUT_FOLDER_NAME: 'Laporan SLF Generated',
  
  // CORS — domain yang diizinkan
  ALLOWED_ORIGINS: [],
  
  // Versi
  VERSION: '4.3.0'
};

// =============================================================================
// ENTRY POINTS
// =============================================================================

/**
 * Handler HTTP GET — Untuk health check dan info
 */
function doGet(e) {
  const action = e?.parameter?.action || 'getInfo';
  
  try {
    if (action === 'getInfo') {
      return buildJsonResponse({
        status: 'ok',
        service: 'SLF Report Template Engine',
        version: CONFIG.VERSION,
        templateConfigured: !!CONFIG.DEFAULT_TEMPLATE_ID,
        folderConfigured: !!CONFIG.ROOT_FOLDER_ID && CONFIG.ROOT_FOLDER_ID !== 'ISI_DENGAN_ID_FOLDER_ROOT_DRIVE_ANDA',
        timestamp: new Date().toISOString(),
      });
    }
    
    if (action === 'checkTemplate') {
      const templateId = e?.parameter?.templateId || CONFIG.DEFAULT_TEMPLATE_ID;
      return checkTemplateValidity(templateId);
    }

    if (action === 'list' && e.parameter.folderId) {
      const folder = DriveApp.getFolderById(e.parameter.folderId);
      const files = [];
      const it = folder.getFiles();
      while (it.hasNext()) {
        const f = it.next();
        const dUrl = "https://drive.google.com/uc?export=download&id=" + f.getId();
        files.push({ id: f.getId(), name: f.getName(), url: dUrl });
      }
      return buildJsonResponse({ status: 'success', files: files });
    }

    // ACTION: FETCH DRIVE BINARY
    if (action === 'fetch_drive_binary' && e.parameter.fileId) {
      try {
        const fileId = e.parameter.fileId;
        const f = DriveApp.getFileById(fileId);
        const b64 = Utilities.base64Encode(f.getBlob().getBytes());
        return buildJsonResponse({ status: 'success', base64: b64, mimeType: f.getMimeType() });
      } catch(err) {
        return buildJsonResponse({ status: 'error', message: err.toString() });
      }
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
    var data = {};
    var action = '';

    // BINARY GUARD: Triple-Check Detection (PostData > Parameter > Parameters)
    if (e && e.postData && e.postData.contents && e.postData.type && e.postData.type.indexOf('application/json') > -1) {
      try { data = JSON.parse(e.postData.contents); } catch(ex) { /* skip */ }
    }
    
    // Merge with URL Parameters
    if (e && e.parameter) {
       for (var k in e.parameter) { data[k] = e.parameter[k]; }
    }

    action = data.action || (e && e.parameter ? e.parameter.action : '');

    if (action === 'generateFromTemplate') return handleGenerateFromTemplate(data);
    if (action === 'updateDocument')       return handleUpdateDocument(data);

    // Folder & Project Resolution
    var folder;
    var rawProyekId = data.proyekId || (e && e.parameter ? e.parameter.proyekId : '');
    var folderName = data.folderName || rawProyekId || 'Untitled';
    var folderId = data.folderId || (e && e.parameter ? e.parameter.folderId : '');
    
    if (folderId && folderId !== 'null' && folderId !== 'undefined') {
      try { folder = DriveApp.getFolderById(folderId); }
      catch(err) { folder = getOrCreateOutputFolder(rawProyekId); }
    } else {
      folder = getOrCreateOutputFolder(rawProyekId);
    }

    if (action === 'create_folder') {
      return buildJsonResponse({ status: 'success', folderId: folder.getId(), name: folder.getName(), version: CONFIG.VERSION });
    }

    // NEW: Robust Binary Upload
    if (action === 'upload_binary') {
      var aspek = data.aspek || (e && e.parameter ? e.parameter.aspek : 'Umum');
      var subFolder = getSubFolder(folder, aspek);
      
      var fileBlob = e && e.parameter ? e.parameter.file : null; 
      if (!fileBlob && e && e.parameters && e.parameters.file) {
        fileBlob = e.parameters.file[0];
      }

      if (!fileBlob) {
        var foundKeys = e && e.parameter ? Object.keys(e.parameter).join(', ') : 'none';
        var hasPostData = e && e.postData ? "YES (" + e.postData.type + ")" : "NO";
        return buildJsonResponse({ 
          status: 'error', 
          version: CONFIG.VERSION,
          message: 'ERROR_NO_BLOB: GAS v' + CONFIG.VERSION + ' tidak menemukan file blob. Keys: [' + foundKeys + ']. PostData: ' + hasPostData
        });
      }

      var fileName = data.fileName || (e && e.parameter ? e.parameter.fileName : '') || fileBlob.getName() || 'Dokumen_Upload.bin';
      fileBlob.setName(fileName);
      
      var uploaded = subFolder.createFile(fileBlob);
      var fileId = uploaded.getId();
      var downloadUrl = "https://drive.google.com/uc?export=download&id=" + fileId;
      
      if (data.setPublic === true || data.setPublic === 'true') {
        uploaded.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      }
      return buildJsonResponse({ 
         status: 'success', 
         version: CONFIG.VERSION,
         count: 1, 
         data: [{ url: downloadUrl, id: fileId, name: fileName }], 
         folderId: folder.getId() 
      });
    }

    // Legacy Base64 Upload
    const legacySubFolder = getSubFolder(folder, data.aspek || 'Lampiran');
    var results = [];
    var files = data.files || [{ base64: data.base64, fileName: data.fileName, mimeType: data.mimeType }];

    for (var i = 0; i < files.length; i++) {
      var f = files[i];
      if (f.base64 && f.fileName) {
        // BINARY GUARD: Cek jika konten adalah HTML
        var decoded = Utilities.newBlob(Utilities.base64Decode(f.base64)).getDataAsString().toLowerCase();
        if (decoded.indexOf('<!doctype html') > -1 || decoded.indexOf('<html>') > -1) {
            if (f.mimeType === 'application/pdf' || f.mimeType.indexOf('image/') > -1) {
                results.push({ status: 'error', message: 'KONTEN_ORUP: File terdeteksi sebagai HTML.', name: f.fileName });
                continue;
            }
        }

        var blob = Utilities.newBlob(Utilities.base64Decode(f.base64), f.mimeType, f.fileName);
        var uploaded = legacySubFolder.createFile(blob);
        var fileId = uploaded.getId();
        var downloadUrl = "https://drive.google.com/uc?export=download&id=" + fileId;
        
        if (data.setPublic) {
          uploaded.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        }
        results.push({ status: 'success', url: downloadUrl, id: fileId, name: f.fileName });
      }
    }

    return buildJsonResponse({ status: 'success', count: results.length, data: results, folderId: folder.getId(), version: CONFIG.VERSION });

  } catch (err) {
    Logger.log('doPost ERROR: ' + err.message + '\n' + err.stack);
    return buildJsonResponse({ status: 'error', message: err.toString(), version: CONFIG.VERSION + "_CATCH" });
  }
}

// =============================================================================
// REPORT GENERATION
// =============================================================================

function handleGenerateFromTemplate(data) {
  const templateId = data.templateId || CONFIG.DEFAULT_TEMPLATE_ID;
  const docTitle = data.docTitle || `Laporan SLF - ${data.data?.NAMA_BANGUNAN || 'Bangunan'} - ${formatDateId(new Date())}`;
  const payload = data.data || {};

  if (!templateId || templateId === 'ISI_DENGAN_ID_TEMPLATE_GOOGLE_DOCS_ANDA') {
    return buildJsonResponse({ error: 'Template ID belum dikonfigurasi.' }, 400);
  }

  const newFile = DriveApp.getFileById(templateId).makeCopy(docTitle, getOrCreateOutputFolder(data.proyekId));
  const docId = newFile.getId();
  const doc = DocumentApp.openById(docId);

  fillDocument(doc, payload);
  
  // Set sharing
  newFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.EDIT);

  return buildJsonResponse({
    status: 'success',
    id: docId,
    title: doc.getName(),
    editUrl: `https://docs.google.com/document/d/${docId}/edit`,
    embedUrl: `https://docs.google.com/document/d/${docId}/edit?embedded=true&rm=minimal`,
    exportDocxUrl: `https://docs.google.com/document/d/${docId}/export?format=docx`,
    exportPdfUrl: `https://docs.google.com/document/d/${docId}/export?format=pdf`
  });
}

function handleUpdateDocument(data) {
  const doc = DocumentApp.openById(data.docId);
  fillDocument(doc, data.data || {});
  return buildJsonResponse({ status: 'success', message: 'Document updated successfully.' });
}

// =============================================================================
// CORE FILL ENGINE
// =============================================================================

function fillDocument(doc, data) {
  const body = doc.getBody();

  // FASE 1: Render loop tabel generik
  renderAllLoops(doc, data);

  // FASE 2: Ganti semua flat tag {{KEY}} → nilai
  replaceFlatTags(body, data);

  doc.saveAndClose();
}

// =============================================================================
// LOOP TABLE RENDERER — SISTEM GENERIK
// =============================================================================

const KNOWN_LOOPS = [
  '_checklistAdmin', '_checklistTeknis', '_auditForensik',
  '_checklistIdentitas', '_checklistTataBangunan', '_checklistPeruntukan',
  '_checklistIntensitas', '_checklistArsitektur', '_checklistStruktur',
  '_checklistKebakaran', '_checklistKebPasif', '_checklistKebAktif',
  '_checklistPetir', '_checklistListrik', '_checklistPetirListrik',
  '_checklistKesehatan', '_checklistPenghawaan', '_checklistPencahayaan',
  '_checklistAirBersih', '_checklistSanitasi', '_checklistKemudahan',
  '_checklistKoridor', '_checklistVertical', '_checklistFasilitas',
  '_temuanSemua', '_temuanKritis', '_temuanStrukturKritis',
  '_fotoEvidences', '_timAhli', '_rekomendasiP1', '_rekomendasiP2',
  '_rekomendasiP3', '_skorAspek'
];

function renderAllLoops(doc, data) {
  const body = doc.getBody();
  const tables = body.getTables();

  for (var t = 0; t < tables.length; t++) {
    tryRenderTableLoop(tables[t], data);
  }

  // Bersihkan marker di paragraf
  var numChildren = body.getNumChildren();
  for (var c = 0; c < numChildren; c++) {
    var child = body.getChild(c);
    if (child.getType() === DocumentApp.ElementType.PARAGRAPH) {
      var text = child.asParagraph().getText();
      for (var li = 0; li < KNOWN_LOOPS.length; li++) {
        var loopKey = KNOWN_LOOPS[li];
        var openMarker = '{#' + loopKey + '}';
        var closeMarker = '{/' + loopKey + '}';
        if (text.indexOf(openMarker) > -1 || text.indexOf(closeMarker) > -1) {
          child.asParagraph().clear();
        }
      }
    }
  }
}

function tryRenderTableLoop(table, data) {
  if (table.getNumRows() < 2) return;

  var loopKey = null;
  var markerRowIdx = -1;
  var templateRowIdx = -1;
  var closeRowIdx = -1;

  for (var r = 0; r < table.getNumRows(); r++) {
    var rowText = getRowText(table.getRow(r));
    for (var li = 0; li < KNOWN_LOOPS.length; li++) {
      var key = KNOWN_LOOPS[li];
      if (rowText.indexOf('{#' + key + '}') > -1) {
        loopKey = key;
        markerRowIdx = r;
        templateRowIdx = r + 1;
      }
      if (loopKey && rowText.indexOf('{/' + loopKey + '}') > -1) {
        closeRowIdx = r;
      }
    }
  }

  if (!loopKey || templateRowIdx < 0) return;
  if (!data[loopKey] || !Array.isArray(data[loopKey])) {
    safeRemoveRow(table, markerRowIdx);
    if (closeRowIdx > -1) safeRemoveRow(table, closeRowIdx > markerRowIdx ? closeRowIdx - 1 : closeRowIdx);
    return;
  }

  var items = data[loopKey];
  var templateRow = table.getRow(templateRowIdx).copy();

  if (closeRowIdx > -1 && closeRowIdx !== templateRowIdx) {
    safeRemoveRow(table, closeRowIdx);
  }
  safeRemoveRow(table, templateRowIdx);
  safeRemoveRow(table, markerRowIdx);

  var insertAt = markerRowIdx;
  for (var i = 0; i < items.length; i++) {
    var newRow = templateRow.copy();
    fillRowWithItem(newRow, items[i], i);
    if (insertAt >= table.getNumRows()) {
      table.appendTableRow(newRow);
    } else {
      table.insertTableRow(insertAt, newRow);
    }
    insertAt++;
  }

  if (items.length === 0) {
    var emptyRow = templateRow.copy();
    clearRowText(emptyRow);
    emptyRow.getCell(0).setText('(Tidak ada data)');
    table.insertTableRow(markerRowIdx, emptyRow);
  }
}

function fillRowWithItem(row, item, idx) {
  var itemWithNo = JSON.parse(JSON.stringify(item));
  if (!itemWithNo.no) itemWithNo.no = String(idx + 1);
  itemWithNo.status_label = itemWithNo.status_label || mapStatusLabel(itemWithNo.status);
  itemWithNo.nama_item = itemWithNo.nama_item || itemWithNo.nama || '-';
  itemWithNo.kode_item = itemWithNo.kode_item || itemWithNo.kode || '-';

  for (var c = 0; c < row.getNumCells(); c++) {
    var cell = row.getCell(c);
    var cellText = cell.getText();
    var replaced = replacePlaceholdersInText(cellText, itemWithNo);
    if (replaced !== cellText) {
      cell.setText(replaced);
    }
  }
}

function replacePlaceholdersInText(text, item) {
  var result = text;
  for (var key in item) {
    if (item.hasOwnProperty(key)) {
      var val = item[key];
      if (typeof val === 'string' || typeof val === 'number') {
        result = result.replace(new RegExp('\\{\\{' + key + '\\}\\}', 'g'), String(val));
      }
    }
  }
  return result;
}

function replaceFlatTags(body, data) {
  for (var key in data) {
    if (!data.hasOwnProperty(key)) continue;
    var val = data[key];
    if (typeof val === 'string' || typeof val === 'number') {
      var safeVal = String(val).substring(0, 8000);
      try {
        body.replaceText('\\{\\{' + escapeRegex(key) + '\\}\\}', safeVal);
      } catch(e) {}
    }
  }
  try {
    body.replaceText('\\{[#/][^}]+\\}', '');
  } catch(e) {}
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

function getRowText(row) {
  var text = '';
  for (var c = 0; c < row.getNumCells(); c++) {
    text += row.getCell(c).getText() + ' ';
  }
  return text;
}

function clearRowText(row) {
  for (var c = 0; c < row.getNumCells(); c++) {
    row.getCell(c).setText('');
  }
}

function safeRemoveRow(table, rowIdx) {
  try {
    if (rowIdx >= 0 && rowIdx < table.getNumRows()) {
      table.removeRow(rowIdx);
    }
  } catch(e) {}
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function mapStatusLabel(status) {
  var map = {
    'ada_sesuai': 'Ada & Sesuai',
    'ada_tidak_sesuai': 'Ada, Tidak Sesuai',
    'tidak_ada': 'Tidak Ada',
    'pertama_kali': 'Pertama Kali',
    'tidak_wajib': 'Tidak Wajib',
    'tidak_ada_renovasi': 'Tidak Ada (Renovasi)',
    'tanpa_kerusakan': 'Tanpa Kerusakan',
    'rusak_ringan': 'Rusak Ringan',
    'rusak_sedang': 'Rusak Sedang',
    'rusak_berat': 'Rusak Berat',
    'baik': 'Baik',
    'sedang': 'Sedang',
    'buruk': 'Buruk',
    'kritis': 'Kritis',
    'tidak_wajib': 'Tdk Wajib',
    'tidak_ada_renovasi': 'Tdk Ada'
  };
  return map[status] || status || '-';
}

function getOrCreateOutputFolder(proyekId, subFolder) {
  let rootFolder;
  try {
    rootFolder = DriveApp.getFolderById(CONFIG.ROOT_FOLDER_ID);
  } catch(e) {
    rootFolder = DriveApp.getRootFolder();
  }
  
  let outputFolder = findOrCreateFolder(rootFolder, CONFIG.OUTPUT_FOLDER_NAME);
  
  if (proyekId) {
    outputFolder = findOrCreateFolder(outputFolder, `Proyek_${proyekId}`);
  }
  
  if (subFolder) {
    outputFolder = findOrCreateFolder(outputFolder, subFolder);
  }
  
  return outputFolder;
}

function getSubFolder(parent, name) {
  var fs = parent.getFoldersByName(name);
  var folder = fs.hasNext() ? fs.next() : parent.createFolder(name);
  folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return folder;
}

function findOrCreateFolder(parent, name) {
  const existing = parent.getFoldersByName(name);
  if (existing.hasNext()) return existing.next();
  return parent.createFolder(name);
}

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

function formatDateId(date) {
  const months = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

function buildJsonResponse(data, statusCode) {
  const output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}
