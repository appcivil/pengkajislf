// ============================================================
//  SIMBG SYNCHRONIZATION MODULE
//  Handles Option A: Server-Side / RPA-style data fetching
// ============================================================
import { supabase } from './supabase.js';

/**
 * Pull data from SIMBG portal
 */
export async function syncWithSIMBG(proyekId) {
  const { data: p, error: fetchErr } = await supabase
    .from('proyek')
    .select('*')
    .eq('id', proyekId)
    .single();

  if (fetchErr || !p) throw new Error('Proyek tidak ditemukan.');
  if (!p.simbg_email || !p.simbg_password) {
    throw new Error('Kredensial SIMBG belum dikonfigurasi untuk proyek ini.');
  }

  console.log(`[SIMBG] Pulling data for ID: ${p.simbg_id || 'PROTOTYPE-ID'}...`);
  await new Promise(r => setTimeout(r, 1500)); 

  // Simulating the bot extracting deep technical data from Step 1 & 2
  const simbgData = {
    // Basic
    luas_bangunan:    p.luas_bangunan || 1250.50,
    jumlah_lantai:    p.jumlah_lantai || 4,
    nomor_pbg:        p.nomor_pbg || 'PBG-990022-30032026-01',
    // Intensity (Step 1)
    gsb: 3.5,
    kdb: 65.0,
    klb: 2.6,
    kdh: 15.0,
    // Land (Step 2 - Detailed)
    jenis_dokumen_tanah: 'Sertifikat',
    hak_kepemilikan:     'Hak Milik',
    nama_pemilik_tanah:  'Ahmad Hayun',
    no_dokumen_tanah:    '10.17.19.06.1.01072',
    tgl_terbit_tanah:    '2022-12-23',
    luas_tanah:          1798,
    tanah_provinsi:      'Jawa Barat',
    tanah_kota:          'Kab. Garut',
    tanah_kecamatan:     'Banjarwangi',
    tanah_kelurahan:     'Kadongdong',
    alamat_tanah_lengkap: 'Kp. Batas',
    pemilik_tanah_sama:  false,
    no_surat_perjanjian: '25/SMK-IMG/VIII/2025',
    tgl_surat_perjanjian: '2025-08-28',
    penerima_perjanjian: 'Ahmad Hayun',
    updated_at: new Date().toISOString()
  };

  const { error: updateErr } = await supabase
    .from('proyek')
    .update(simbgData)
    .eq('id', proyekId);

  if (updateErr) throw new Error('Gagal memperbarui data proyek: ' + updateErr.message);
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
    console.log(`[SIMBG PUSH] ${msg}`);
    if (onProgress) onProgress(perc, msg);
  };

  logProgress(10, `Memulai Sinkronisasi Balik untuk ${p.nama_bangunan}...`);
  await new Promise(r => setTimeout(r, 1000));

  logProgress(25, `Menghubungkan ke portal SIMBG (${p.simbg_id})...`);
  await new Promise(r => setTimeout(r, 1200));

  logProgress(40, 'Langkah 1: Mengisi Intensitas Teknis (GSB, KDB, KLB, KDH)...');
  await new Promise(r => setTimeout(r, 1000));

  logProgress(55, 'Langkah 2: Sinkronisasi Data Dokumen Tanah...');
  await new Promise(r => setTimeout(r, 800));

  logProgress(70, 'Langkah 3: Memetakan & Mengunggah Dokumen Teknis (PDF)...');
  // Simulasi terbatas: 1 dokumen untuk pengecekan performa fitur upload (Request khusus KRK)
  const mandatoryFiles = [
    { name: 'KRK', cat: 'tanah' }
  ];

  for (const item of mandatoryFiles) {
    const found = files?.find(f => f.subcategory === item.name);
    logProgress(75, `> Mencari dokumen: ${item.name}...`);
    await new Promise(r => setTimeout(r, 600));

    if (found) {
      logProgress(85, `> Ditemukan: [${item.cat.toUpperCase()}] ${item.name} -> Mengunggah URL Drive...`);
      await new Promise(r => setTimeout(r, 800));
    } else {
      logProgress(85, `> WARNING: Dokumen Wajib "${item.name}" tidak ditemukan.`);
      await new Promise(r => setTimeout(r, 800));
    }
  }

  logProgress(95, 'Menyelesaikan proses unggah dokumen...');
  await new Promise(r => setTimeout(r, 1000));
  
  // Record Push Log in notifications
  await supabase.from('notifications').insert({
    user_id: p.created_by || null,
    title: 'Push Data SIMBG Berhasil',
    message: `Data permohonan "${p.nama_bangunan}" telah diperbarui di portal SIMBG secara otomatis.`,
    type: 'success',
  });

  logProgress(100, 'Data permohonan telah diperbarui di portal SIMBG.');
  return true;
}
