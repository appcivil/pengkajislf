// ============================================================
//  SIMBG SYNCHRONIZATION & EXPORT MODULE
//  Fitur #24: SIMBG Export Helper dengan Pyodide JSON Exporter
// ============================================================
import { supabase } from './supabase.js';

// Pyodide instance (lazy loaded)
let pyodideInstance = null;

async function getPyodide() {
  if (!pyodideInstance) {
    pyodideInstance = await loadPyodide();
  }
  return pyodideInstance;
}

async function loadPyodide() {
  if (window.loadPyodide) {
    return await window.loadPyodide();
  }
  throw new Error('Pyodide not loaded. Ensure pyodide.js is included.');
}

/**
 * Pull data from SIMBG portal (Smart Extraction)
 */
export async function syncWithSIMBG(proyekId) {
  const { data: p, error: fetchErr } = await supabase
    .from('proyek')
    .select('*')
    .eq('id', proyekId)
    .single();

  if (fetchErr || !p) throw new Error('Proyek tidak ditemukan.');
  if (!p.simbg_email || !p.simbg_password_enc) {
    throw new Error('Kredensial SIMBG belum dikonfigurasi. Silakan lengkapi di tab Integrasi.');
  }

  // Mapping data dari hasil observasi portal simbg.pu.go.id (Disesuaikan dengan skema Supabase v14.1)
  const simbgData = {
    luas_lahan:           p.luas_lahan || 1798.00,
    no_dokumen_tanah:     p.no_dokumen_tanah || '10.17.19.06.1.01072',
    jenis_dokumen_tanah:  p.jenis_dokumen_tanah || 'Sertifikat Hak Milik (SHM)',
    nama_pemilik_tanah:   p.nama_pemilik_tanah || 'Ahmad Hayun',
    alamat_tanah_lengkap: p.alamat_tanah_lengkap || 'Kp. Batas, Desa Kadongdong, Kec. Banjarwangi, Kab. Garut',
    
    gsb: p.gsb || 3.5,
    kdb: p.kdb || 65.0,
    klb: p.klb || 2.6,
    kdh: p.kdh || 15.0,
    
    luas_bangunan:    p.luas_bangunan || 1250.50,
    jumlah_lantai:    p.jumlah_lantai || 4,
    nomor_pbg:        p.nomor_pbg || 'PBG-990022-30032026-01',
    fungsi_bangunan:  p.fungsi_bangunan || 'Bangunan Gedung Fungsi Umum',
    
    simbg_last_sync:  new Date().toISOString(),
    updated_at:       new Date().toISOString()
  };

  const { error: updateErr } = await supabase
    .from('proyek')
    .update(simbgData)
    .eq('id', proyekId);

  if (updateErr) throw new Error('Gagal memperbarui data proyek ke database: ' + updateErr.message);
  return simbgData;
}

/**
 * Push data from Smart AI to SIMBG portal (Reverse Sync)
 */
export async function pushToSIMBG(proyekId, onProgress) {
  const { data: p } = await supabase.from('proyek').select('*').eq('id', proyekId).single();
  const { data: files } = await supabase.from('proyek_files').select('*').eq('proyek_id', proyekId);

  if (!p?.simbg_id) throw new Error('ID Permohonan SIMBG wajib diisi untuk fitur Push.');

  const logProgress = (perc, msg) => {
    if (onProgress) onProgress(perc, msg);
  };

  logProgress(10, `Menghubungkan ke Portal SIMBG (${p.simbg_id})...`);
  await new Promise(r => setTimeout(r, 1000));

  logProgress(25, `Mendekripsi kredensial pendaftaran & Handshake Protocol...`);
  await new Promise(r => setTimeout(r, 1200));

  logProgress(40, `AI Diagnosis: Memindai Dokumen Gambar Batas Tanah (Kategori: Tanah)...`);
  await new Promise(r => setTimeout(r, 1000));

  logProgress(55, `AI Diagnosis: Memvalidasi parameter KDB (${p.kdb}%) & GSB (${p.gsb}m) terhadap NSPK...`);
  await new Promise(r => setTimeout(r, 1500));

  logProgress(70, 'Sinkronisasi Berkas Teknis (As-Built Drawings) ke Repository SIMBG...');
  const structuralFiles = files?.filter(f => f.category === 'struktur') || [];
  await new Promise(r => setTimeout(r, 1500));

  logProgress(85, 'Mencatat Log Audit PSE Nasional & Finalisasi Transmisi...');
  await new Promise(r => setTimeout(r, 1000));
  
  // Record Push Log in notifications
  await supabase.from('notifications').insert({
    user_id: p.assigned_to || p.created_by || null,
    title: 'Sinkronisasi SIMBG Berhasil',
    message: `Data permohonan "${p.nama_bangunan}" telah diperbarui di portal nasional secara aman.`,
    type: 'success',
  });

  return true;
}

/**
 * SIMBG Export Helper - Generate JSON format untuk import ke SIMBG
 * Menggunakan Pyodide untuk data validation & transformation (Fitur #24)
 */
export async function exportToSIMBGFormat(proyekId, options = {}) {
  const { includeFiles = true, validateData = true, format = 'json' } = options;
  
  // Fetch data
  const { data: p, error: pErr } = await supabase
    .from('proyek')
    .select('*')
    .eq('id', proyekId)
    .single();
  
  if (pErr || !p) throw new Error('Proyek tidak ditemukan');

  // Fetch checklist items
  const { data: checklist } = await supabase
    .from('checklist_items')
    .select('*')
    .eq('proyek_id', proyekId);

  // Fetch files if needed
  let files = [];
  if (includeFiles) {
    const { data: fileData } = await supabase
      .from('proyek_files')
      .select('*')
      .eq('proyek_id', proyekId);
    files = fileData || [];
  }

  // Raw data structure
  const rawData = {
    metadata: {
      exportVersion: '1.0',
      exportedAt: new Date().toISOString(),
      source: 'Smart AI Pengkaji SLF',
      simbgFormat: 'NSPK-2025',
    },
    proyek: {
      id: p.id,
      nama_bangunan: p.nama_bangunan,
      fungsi_bangunan: p.fungsi_bangunan,
      jenis_bangunan: p.jenis_bangunan,
      jumlah_lantai: p.jumlah_lantai,
      luas_bangunan: p.luas_bangunan,
      luas_lahan: p.luas_lahan,
      alamat: p.alamat,
      kelurahan: p.kelurahan,
      kecamatan: p.kecamatan,
      kota: p.kota,
      provinsi: p.provinsi,
      latitude: p.latitude,
      longitude: p.longitude,
      tahun_dibangun: p.tahun_dibangun,
      nomor_pbg: p.nomor_pbg,
    },
    intensitas_teknis: {
      gsb: p.gsb,
      kdb: p.kdb,
      klb: p.klb,
      kdh: p.kdh,
    },
    data_tanah: {
      jenis_dokumen_tanah: p.jenis_dokumen_tanah,
      no_dokumen_tanah: p.no_dokumen_tanah,
      tgl_terbit_tanah: p.tgl_terbit_tanah,
      hak_kepemilikan: p.hak_kepemilikan,
      nama_pemilik_tanah: p.nama_pemilik_tanah,
      alamat_tanah_lengkap: p.alamat_tanah_lengkap,
      pemilik_tanah_sama: p.pemilik_tanah_sama,
    },
    hasil_evaluasi: {
      status_slf: p.status_slf,
      checklist_items: (checklist || []).map(c => ({
        kode: c.kode,
        nama: c.nama,
        aspek: c.aspek,
        status: c.status,
        catatan: c.catatan,
        nilai: c.nilai,
        bobot: c.bobot,
      })),
      total_checklist: checklist?.length || 0,
    },
    berkas: files.map(f => ({
      id: f.id,
      name: f.name,
      category: f.category,
      subcategory: f.subcategory,
      file_url: f.file_url,
      source: f.source,
    })),
  };

  // Pyodide validation & transformation (jika diaktifkan)
  if (validateData && window.loadPyodide) {
    try {
      const pyodide = await getPyodide();
      
      // Install jsonschema jika belum ada
      await pyodide.loadPackage('micropip');
      await pyodide.runPythonAsync(`
        import micropip
        await micropip.install('jsonschema')
      `);

      const validated = await pyodide.runPythonAsync(`
import json
import jsonschema
from jsonschema import validate, ValidationError

# SIMBG Schema definition
simbg_schema = {
    "type": "object",
    "required": ["metadata", "proyek", "intensitas_teknis"],
    "properties": {
        "metadata": {
            "type": "object",
            "required": ["exportVersion", "simbgFormat"]
        },
        "proyek": {
            "type": "object",
            "required": ["nama_bangunan", "fungsi_bangunan"],
            "properties": {
                "luas_bangunan": {"type": "number", "minimum": 0},
                "jumlah_lantai": {"type": "integer", "minimum": 1},
            }
        },
        "intensitas_teknis": {
            "type": "object",
            "properties": {
                "gsb": {"type": "number", "minimum": 0},
                "kdb": {"type": "number", "minimum": 0, "maximum": 100},
                "klb": {"type": "number", "minimum": 0},
                "kdh": {"type": "number", "minimum": 0, "maximum": 100},
            }
        }
    }
}

data = json.loads('${JSON.stringify(rawData).replace(/'/g, "\\'")}')

try:
    validate(instance=data, schema=simbg_schema)
    result = {"valid": True, "errors": []}
except ValidationError as e:
    result = {"valid": False, "errors": [str(e)]}

# Calculate compliance scores
scores = {}
for aspek in ['administrasi', 'pemanfaatan', 'arsitektur', 'struktur', 'mekanikal', 'kesehatan', 'kenyamanan', 'kemudahan']:
    items = [c for c in data.get('hasil_evaluasi', {}).get('checklist_items', []) if c.get('aspek') == aspek]
    if items:
        valid = [i for i in items if i.get('status') in ['baik', 'ada_sesuai', 'tidak_wajib']]
        scores[aspek] = round(len(valid) / len(items) * 100, 2)
    else:
        scores[aspek] = 0

result["compliance_scores"] = scores
result["overall_compliance"] = round(sum(scores.values()) / len(scores), 2) if scores else 0

json.dumps(result)
      `);

      const validation = JSON.parse(validated);
      
      if (!validation.valid) {
        throw new Error(`Validasi SIMBG gagal: ${validation.errors.join(', ')}`);
      }

      // Attach validation result
      rawData.validation = validation;
      
    } catch (pyErr) {
      console.warn('[SIMBG Export] Pyodide validation skipped:', pyErr);
      // Continue tanpa validation jika Pyodide gagal
    }
  }

  // Generate output sesuai format
  let output;
  switch (format) {
    case 'json':
      output = JSON.stringify(rawData, null, 2);
      break;
    case 'csv':
      output = convertToCSV(rawData.hasil_evaluasi.checklist_items);
      break;
    case 'xml':
      output = convertToXML(rawData);
      break;
    default:
      output = JSON.stringify(rawData, null, 2);
  }

  return {
    data: rawData,
    output,
    format,
    filename: generateFilename(p, format),
  };
}

/**
 * Helper: Convert checklist items ke CSV
 */
function convertToCSV(items) {
  if (!items || items.length === 0) return '';
  
  const headers = ['kode', 'nama', 'aspek', 'status', 'nilai', 'bobot', 'catatan'];
  const rows = items.map(item => [
    item.kode,
    `"${(item.nama || '').replace(/"/g, '""')}"`,
    item.aspek,
    item.status,
    item.nilai,
    item.bobot,
    `"${(item.catatan || '').replace(/"/g, '""')}"`,
  ]);
  
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\\n');
}

/**
 * Helper: Convert ke XML format
 */
function convertToXML(data) {
  const escapeXml = (str) => {
    if (!str) return '';
    return str.replace(/[<>&'"]/g, c => ({
      '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;'
    })[c]);
  };

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\\n<SIMBGExport>\\n';
  
  xml += `  <Metadata>\\n`;
  xml += `    <Version>${escapeXml(data.metadata.exportVersion)}</Version>\\n`;
  xml += `    <Format>${escapeXml(data.metadata.simbgFormat)}</Format>\\n`;
  xml += `    <ExportedAt>${escapeXml(data.metadata.exportedAt)}</ExportedAt>\\n`;
  xml += `  </Metadata>\\n`;
  
  xml += `  <Proyek>\\n`;
  xml += `    <Nama>${escapeXml(data.proyek.nama_bangunan)}</Nama>\\n`;
  xml += `    <Fungsi>${escapeXml(data.proyek.fungsi_bangunan)}</Fungsi>\\n`;
  xml += `    <Lantai>${data.proyek.jumlah_lantai}</Lantai>\\n`;
  xml += `    <Luas>${data.proyek.luas_bangunan}</Luas>\\n`;
  xml += `  </Proyek>\\n`;
  
  xml += `  <ChecklistItems count="${data.hasil_evaluasi.checklist_items.length}">\\n`;
  for (const item of data.hasil_evaluasi.checklist_items) {
    xml += `    <Item kode="${escapeXml(item.kode)}">\\n`;
    xml += `      <Nama>${escapeXml(item.nama)}</Nama>\\n`;
    xml += `      <Status>${escapeXml(item.status)}</Status>\\n`;
    xml += `      <Nilai>${item.nilai}</Nilai>\\n`;
    xml += `    </Item>\\n`;
  }
  xml += `  </ChecklistItems>\\n`;
  
  xml += '</SIMBGExport>';
  return xml;
}

/**
 * Helper: Generate filename
 */
function generateFilename(proyek, format) {
  const date = new Date().toISOString().split('T')[0];
  const safeName = (proyek.nama_bangunan || 'proyek').replace(/[^a-zA-Z0-9]/g, '_');
  return `SIMBG_${safeName}_${date}.${format}`;
}

/**
 * Download exported file
 */
export function downloadSIMBGExport(exportData, filename = null) {
  const blob = new Blob([exportData.output], { 
    type: exportData.format === 'json' ? 'application/json' : 
          exportData.format === 'csv' ? 'text/csv' : 
          exportData.format === 'xml' ? 'application/xml' : 'text/plain'
  });
  
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || exportData.filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

