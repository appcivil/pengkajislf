import {
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
} from './utils.js';
import { ImageRun } from 'docx';
import { DEEP_REASONING_RULES } from '../../infrastructure/ai/deep-reasoning-rules.js';

// Helper function untuk legal bullet - didefinisikan di level modul
const legalBullet = (text) => bulletItem(text);

// ============================================================
// DYNAMIC LEGAL REFERENCES GENERATOR
// Mengambil data regulasi dari DEEP_REASONING_RULES untuk
// menghindari hardcoding dan memudahkan maintenance.
// ============================================================

/**
 * Generate numbered items dari array rules
 * @param {Array} rules - Array rule objects dari DEEP_REASONING_RULES
 * @param {string} prefix - Prefix untuk numbering (a, b, c, ...)
 * @returns {Array} Array of numberedItem components
 */
function generateNumberedItemsFromRules(rules, startChar = 'a') {
  if (!rules || !Array.isArray(rules) || rules.length === 0) {
    return [bodyText('(Data regulasi tidak tersedia)')];
  }
  
  return rules.map((rule, index) => {
    const char = String.fromCharCode(startChar.charCodeAt(0) + index);
    return numberedItem(char, rule.name || rule.id || 'Regulasi tidak bernama');
  });
}

/**
 * Generate bullet items dari array SNI rules
 * @param {Array} sniRules - Array SNI rule objects
 * @returns {Array} Array of legalBullet components
 */
function generateSNIBullets(sniRules) {
  if (!sniRules || !Array.isArray(sniRules) || sniRules.length === 0) {
    return [bodyText('(Data SNI tidak tersedia)')];
  }
  
  return sniRules.map(rule => legalBullet(rule.name || rule.id || 'SNI tidak bernama'));
}

/**
 * Render section dasar hukum secara dinamis dari DEEP_REASONING_RULES
 * Fase 3 Audit Report: Dynamic Referencing Implementation
 */
function renderDynamicLegalReferences() {
  const nspk = DEEP_REASONING_RULES?.nspkCompliance;
  
  if (!nspk) {
    return [
      heading3('1.4.1 Undang-Undang'),
      bodyText('(Data regulasi tidak tersedia - DEEP_REASONING_RULES tidak dimuat)'),
    ];
  }

  const sections = [
    heading3('1.4.1 Undang-Undang'),
    ...(nspk.undangUndang?.rules ? generateNumberedItemsFromRules(nspk.undangUndang.rules, 'a') : []),
    
    heading3('1.4.2 Peraturan Pemerintah'),
    ...(nspk.peraturanPemerintah?.rules ? generateNumberedItemsFromRules(nspk.peraturanPemerintah.rules, 'a') : []),
    
    heading3('1.4.3 Peraturan Menteri PUPR'),
    ...(nspk.permenPUPR?.rules ? generateNumberedItemsFromRules(nspk.permenPUPR.rules, 'a') : []),
    
    heading3('1.4.4 Standar Nasional Indonesia'),
    bodyText('a. SNI Arsitektur'),
    ...(nspk.sniArsitektur ? generateSNIBullets(nspk.sniArsitektur) : []),
    
    bodyText('b. SNI Struktur'),
    ...(nspk.sniStruktur ? generateSNIBullets(nspk.sniStruktur) : []),
    
    bodyText('c. SNI MEP'),
    ...(nspk.sniMep ? generateSNIBullets(nspk.sniMep) : []),
    
    heading3('1.4.5 Aturan Terkait Lainnya'),
    ...(nspk.aturanLain ? renderOtherRegulations(nspk.aturanLain) : []),
  ];
  
  return sections;
}

/**
 * Render aturan dari kementerian lain
 */
function renderOtherRegulations(aturanLain) {
  const items = [];
  
  if (aturanLain.lingkunganHidup?.length > 0) {
    items.push(numberedItem('a', `Kementerian Lingkungan Hidup dan Kehutanan: ${aturanLain.lingkunganHidup.map(r => r.name).join(', ')}.`));
  }
  if (aturanLain.esdm?.length > 0) {
    items.push(numberedItem('b', `Kementerian ESDM: ${aturanLain.esdm.map(r => r.name).join(', ')}.`));
  }
  if (aturanLain.kesehatan?.length > 0) {
    items.push(numberedItem('c', `Kementerian Kesehatan: ${aturanLain.kesehatan.map(r => r.name).join(', ')}.`));
  }
  if (aturanLain.atrBpn?.length > 0) {
    items.push(numberedItem('d', `Kementerian ATR/BPN: ${aturanLain.atrBpn.map(r => r.name).join(', ')}.`));
  }
  if (aturanLain.dalamNegeri?.length > 0) {
    items.push(numberedItem('e', `Kementerian Dalam Negeri: ${aturanLain.dalamNegeri.map(r => r.name).join(', ')}.`));
  }
  if (aturanLain.perdagangan?.length > 0) {
    items.push(numberedItem('f', `Kementerian Perdagangan: ${aturanLain.perdagangan.map(r => r.name).join(', ')}.`));
  }
  
  return items.length > 0 ? items : [numberedItem('a', 'Referensi aturan terkait lainnya sesuai kebutuhan teknis.')];
}

// ============================================================
export function renderBab1(proyek) {
  const fmtM2 = (value) =>
    value ? `${Number(value).toLocaleString('id-ID')} m²` : '-';

  const coordText =
    proyek.latitude != null && proyek.longitude != null
      ? `${proyek.latitude}, ${proyek.longitude}`
      : proyek.koordinat || '-';

  const dataRows = [
    ['Nama Bangunan', proyek.nama_bangunan || '-'],
    ['Jenis Bangunan', proyek.jenis_bangunan || '-'],
    ['Fungsi Bangunan', proyek.fungsi_bangunan || '-'],
    [
      'Alamat Lokasi',
      [proyek.alamat, proyek.kota, proyek.provinsi].filter(Boolean).join(', ') || '-',
    ],
    ['Koordinat Lokasi', coordText],
    ['Nama Pemilik', proyek.pemilik || '-'],
    ['Nama Konsultan Pengkaji', proyek.konsultan || '-'],
    ['Tahun Dibangun', String(proyek.tahun_dibangun || '-')],
    ['Jumlah Lantai', proyek.jumlah_lantai ? `${proyek.jumlah_lantai} lantai` : '-'],
    ['Luas Bangunan', fmtM2(proyek.luas_bangunan)],
    ['Luas Lahan', fmtM2(proyek.luas_lahan)],
    ['Konstruksi Utama', proyek.jenis_konstruksi || '-'],
    ['Sistem Struktur Dominan', proyek.sistem_struktur || '-'],
    ['Nomor PBG/IMB', proyek.nomor_pbg || 'Belum tersedia'],
    ['Status As-Built Drawing', proyek.as_built_drawing ? 'Tersedia' : 'Belum tersedia'],
    ['Riwayat Pemeliharaan', proyek.riwayat_pemeliharaan ? 'Tersedia' : 'Belum tersedia'],
  ];

  const kondisiAwal = [
    proyek.kondisi_bangunan
      ? `Kondisi bangunan teridentifikasi sebagai ${safeText(proyek.kondisi_bangunan)}.`
      : null,
    proyek.catatan_umum ? safeText(proyek.catatan_umum) : null,
  ]
    .filter(Boolean)
    .join(' ');

  return [
    heading1('BAB I: GAMBARAN UMUM'),
    bodyText(
      'Bab ini menyajikan gambaran umum objek kajian sebagai dasar penyusunan pemeriksaan teknis bangunan gedung. Uraian meliputi latar belakang, tujuan, ruang lingkup, dasar hukum dan rujukan teknis, data umum bangunan, TITIK KOORDINAT BG, dan kondisi awal eksisting yang menjadi dasar analisis pada bab-bab berikutnya.'
    ),

    heading2('1.1. Latar Belakang'),
    bodyText(
      `Penilaian kelaikan fungsi bangunan gedung merupakan proses penting untuk memastikan bahwa bangunan dapat digunakan secara aman, sehat, nyaman, dan andal sesuai dengan fungsi yang ditetapkan. Kajian ini disusun terhadap bangunan ${safeText(
        proyek.nama_bangunan || 'objek kajian'
      )} yang berlokasi di ${safeText(
        [proyek.alamat, proyek.kota, proyek.provinsi].filter(Boolean).join(', ') || '-'
      )}.`
    ),
    bodyText(
      'Penyusunan laporan ini dilakukan untuk memberikan dasar teknis yang objektif dalam menilai kesesuaian kondisi eksisting bangunan terhadap dokumen rencana teknis, gambar terbangun, serta persyaratan kelaikan fungsi bangunan gedung. Dengan demikian, hasil kajian tidak hanya berfungsi sebagai dokumen administratif, tetapi juga sebagai instrumen evaluasi teknis yang dapat dipertanggungjawabkan.'
    ),
    bodyText(
      'Dalam praktik pemeriksaan bangunan gedung, sering dijumpai perbedaan antara kondisi desain awal, kondisi aktual lapangan, dan riwayat pemeliharaan yang telah dilaksanakan. Oleh sebab itu, kajian ini disusun secara sistematis agar mampu mengidentifikasi kesesuaian, ketidaksesuaian, indikasi kerusakan, potensi risiko, dan kebutuhan tindak lanjut teknis pada setiap aspek pemeriksaan.'
    ),

    heading2('1.2. Maksud dan Tujuan'),
    bodyText(
      'Maksud dari kajian ini adalah menyusun evaluasi teknis menyeluruh terhadap bangunan gedung berdasarkan hasil pemeriksaan lapangan, verifikasi dokumen, dan data pendukung yang tersedia.'
    ),
    bodyText('Adapun tujuan penyusunan laporan ini adalah:'),
    numberedItem('1', 'Menilai kelengkapan dan kebenaran data administratif bangunan gedung sebagai dasar pemeriksaan kelaikan fungsi.'),
    numberedItem('2', 'Menganalisis kondisi eksisting bangunan terhadap gambar rencana, gambar terbangun, dan persyaratan teknis yang berlaku.'),
    numberedItem('3', 'Mengidentifikasi potensi ketidaksesuaian, kerusakan, atau kelemahan teknis pada elemen bangunan.'),
    numberedItem('4', 'Menyusun kesimpulan teknis mengenai tingkat kelayakan fungsi bangunan gedung.'),
    numberedItem('5', 'Merumuskan rekomendasi teknis yang spesifik, realistis, dan dapat ditindaklanjuti.'),
    numberedItem('6', 'Menyediakan dasar penyusunan tindak lanjut perbaikan, pengawasan, atau pengajuan dokumen lanjutan apabila diperlukan.'),

    heading2('1.3. Ruang Lingkup'),
    bodyText(
      'Ruang lingkup pemeriksaan dalam kajian ini disusun secara berlapis agar dapat menilai bangunan dari sisi administratif, visual, teknis, dan operasional. Pemeriksaan difokuskan pada aspek-aspek yang berkaitan langsung dengan kelaikan fungsi bangunan gedung.'
    ),
    bulletItem('Administrasi teknis: kelengkapan dokumen perizinan, dokumen pendukung, dan kesesuaian data awal bangunan.'),
    bulletItem('Arsitektur: tata bangunan, pemanfaatan ruang, fasad, penutup bangunan, dan keserasian dengan lingkungan.'),
    bulletItem('Struktur: kondisi elemen struktur utama, indikasi kerusakan, dan kebutuhan pemeriksaan lanjutan.'),
    bulletItem('MEP: instalasi mekanikal, elektrikal, plumbing, dan sistem utilitas bangunan.'),
    bulletItem('Keselamatan: sistem proteksi kebakaran, jalur evakuasi, dan sistem penyelamatan.'),
    bulletItem('Kesehatan: penghawaan, pencahayaan, kualitas udara, air bersih, air limbah, dan kenyamanan ruang.'),
    bulletItem('Kemudahan: aksesibilitas horizontal dan vertikal, kelengkapan prasarana, dan sarana pendukung.'),
    bulletItem('Pendokumentasian: foto lapangan, catatan pengukuran, dan bukti pemeriksaan teknis.'),

    heading2('1.4. Dasar Hukum dan Rujukan Teknis'),
    bodyText(
      'Penyusunan laporan kajian teknis ini berpedoman pada ketentuan peraturan perundang-undangan, peraturan pelaksanaan, serta standar nasional Indonesia yang relevan dengan penyelenggaraan bangunan gedung. Seluruh dasar hukum dan rujukan teknis berikut digunakan sebagai acuan dalam pemeriksaan administratif, pengamatan visual, pengujian teknis, analisis kesesuaian, dan penyusunan rekomendasi kelaikan fungsi bangunan gedung.'
    ),

    // Fase 3 Audit Report: Dynamic Referencing dari DEEP_REASONING_RULES
    // Menggantikan hardcoded string dengan data dinamis dari Single Source of Truth
    ...renderDynamicLegalReferences(),

    bodyText(
      'Seluruh dasar hukum dan rujukan teknis tersebut digunakan secara selektif sesuai relevansi objek pemeriksaan, jenis bangunan, dan ketersediaan data lapangan. Apabila terdapat perbedaan tingkat penerapan antarstandar, maka penilaian teknis didasarkan pada hierarki regulasi, konteks penggunaan bangunan, dan bukti pemeriksaan yang dapat diverifikasi.'
    ),

    heading2('1.5. Data Umum Bangunan'),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: createTableBorders(),
      rows: dataRows.map((row, idx) =>
        new TableRow({
          children: [
            dataCell(row[0], 35, {
              bold: true,
              shading: idx % 2 === 0 ? COLOR_TABLE_ALT : undefined,
            }),
            dataCell(row[1], 65, {
              shading: idx % 2 === 0 ? COLOR_TABLE_ALT : undefined,
            }),
          ],
        })
      ),
    }),

    heading2('1.6. Lokasi dan Titik Koordinat'),
    bodyText(
      `Bangunan yang menjadi objek kajian berlokasi pada koordinat geografis ${safeText(coordText)}. Penentuan koordinat ini dilakukan untuk memastikan akurasi posisi bangunan terhadap konteks lingkungan sekitar, aksesibilitas kawasan, serta keterkaitan dengan tata ruang wilayah.`
    ),
    bodyText(
      'Visualisasi TITIK KOORDINAT BG ditampilkan menggunakan citra satelit untuk memberikan gambaran kondisi eksisting tapak, lingkungan sekitar, serta hubungan spasial dengan infrastruktur di sekitarnya.'
    ),

    proyek.maps_screenshot
      ? new Paragraph({
        children: [
          new TextRun({
            text: 'Gambar 1.1. TITIK KOORDINAT BG (Citra Satelit)',
            italics: true,
            size: FONT_SIZE_CAPTION,
          }),
        ],
        alignment: AlignmentType.CENTER,
      })
      : bodyText('Gambar lokasi belum tersedia.'),

    proyek.maps_screenshot
      ? new Paragraph({
        children: [
          new ImageRun({
            data: proyek.maps_screenshot,
            transformation: { width: 500, height: 300 },
          }),
        ],
        alignment: AlignmentType.CENTER,
      })
      : emptyLine(),

    heading2('1.7. Gambaran Kondisi Awal Bangunan'),
    bodyText(
      kondisiAwal ||
      'Berdasarkan data awal yang tersedia, kondisi bangunan perlu diverifikasi lebih lanjut melalui pemeriksaan visual, verifikasi dokumen, dan pengujian teknis sesuai kebutuhan.'
    ),
    bodyText(
      'Gambaran awal ini digunakan sebagai titik tolak analisis pada bab berikutnya, khususnya dalam membandingkan kondisi eksisting dengan persyaratan teknis, gambar rencana, dan gambar terbangun. Seluruh temuan akan disusun secara sistematis agar menghasilkan kesimpulan teknis yang akurat, transparan, dan mudah ditelusuri.'
    ),

    emptyLine(),
    horizontalLine(),
  ];
}
// ============================================================
export function renderDaftarIsi() {
  return [
    heading1('DAFTAR ISI'),
    new TableOfContents("ToC", {
      hyperlink: true,
      headingStyleRange: "1-3",
    }),
    pageBreak(),
  ];
}