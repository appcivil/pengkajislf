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

// ============================================================
export function renderBab3(checklist = [], proyek = {}) {
  const items = Array.isArray(checklist) ? checklist : [];

  const normalizeText = (v) => safeText(v ?? '-');

  const normalizeStatus = (status) => {
    const s = String(status || '').trim().toLowerCase();

    if (
      ['baik', 'sesuai', 'ada', 'ada_sesuai', 'tersedia', 'lengkap', 'lulus', 'ok'].includes(s)
    ) return 'sesuai';

    if (
      ['tidak sesuai', 'tidak_sesuai', 'ada_tidak_sesuai', 'buruk', 'kritis', 'rusak berat', 'tidak ada', 'tidak_ada'].includes(s)
    ) return 'tidak_sesuai';

    if (
      ['belum diperiksa', 'tidak dapat diverifikasi', 'perlu verifikasi', 'perlu pemeriksaan', 'perlu pengujian'].includes(s)
    ) return 'belum_terverifikasi';

    if (['rusak ringan'].includes(s)) return 'rusak_ringan';
    if (['rusak sedang'].includes(s)) return 'rusak_sedang';
    if (['tidak rusak'].includes(s)) return 'tidak_rusak';

    return 'lainnya';
  };

  const statusLabelAuto = (status) => {
    const n = normalizeStatus(status);
    if (n === 'sesuai') return 'Sesuai';
    if (n === 'tidak_sesuai') return 'Tidak Sesuai';
    if (n === 'belum_terverifikasi') return 'Belum Terverifikasi';
    if (n === 'rusak_ringan') return 'Rusak Ringan';
    if (n === 'rusak_sedang') return 'Rusak Sedang';
    if (n === 'tidak_rusak') return 'Tidak Rusak';
    return safeText(status || '-');
  };

  const statusColor = (status) => {
    const n = normalizeStatus(status);
    if (n === 'sesuai' || n === 'tidak_rusak') return COLOR_SUCCESS;
    if (n === 'tidak_sesuai' || n === 'rusak_sedang' || n === 'rusak_ringan') return COLOR_DANGER;
    if (n === 'belum_terverifikasi') return COLOR_WARNING;
    return COLOR_MUTED;
  };

  const statusBackground = (status) => {
    const n = normalizeStatus(status);
    if (n === 'sesuai' || n === 'tidak_rusak') return COLOR_TABLE_ALT;
    if (n === 'tidak_sesuai' || n === 'rusak_sedang' || n === 'rusak_ringan') return COLOR_TABLE_ALT;
    if (n === 'belum_terverifikasi') return COLOR_TABLE_ALT;
    return COLOR_TABLE_ALT;
  };

  const getItemTitle = (item) =>
    item.nama || item.item || item.title || item.deskripsi || item.keterangan_item || '-';

  const getItemCode = (item) =>
    item.kode || item.id || item.no || item.nomor || item.code || '-';

  const getItemCatatan = (item) =>
    item.catatan || item.keterangan || item.comment || item.komentar || '-';

  const getItemRekomendasi = (item) =>
    item.rekomendasi || item.recommendation || item.saran || '-';

  const getItemKategori = (item) =>
    String(item.kategori || item.category || 'lainnya').trim().toLowerCase();

  const kategoriLabel = (kategori) => {
    const k = String(kategori || '').trim().toLowerCase();
    if (k === 'administrasi') return 'Administrasi Teknis';
    if (k === 'arsitektur') return 'Arsitektur';
    if (k === 'struktur') return 'Struktur';
    if (k === 'mep') return 'MEP / Utilitas Bangunan';
    if (k === 'mekanikal') return 'Mekanikal';
    if (k === 'elektrikal') return 'Elektrikal';
    if (k === 'plumbing') return 'Plumbing';
    if (k === 'keselamatan') return 'Keselamatan';
    if (k === 'kesehatan') return 'Kesehatan';
    if (k === 'kemudahan') return 'Kemudahan';
    if (k === 'kenyamanan') return 'Kenyamanan';
    return kategori ? safeText(kategori) : 'Lainnya';
  };

  const fmtM2 = (value) =>
    value || value === 0 ? `${Number(value).toLocaleString('id-ID')} m²` : '-';

  const identityRows = [
    ['Nama Bangunan', proyek.nama_bangunan || '-'],
    ['Fungsi Bangunan', proyek.fungsi_bangunan || '-'],
    ['Alamat / Lokasi', proyek.alamat || '-'],
    ['Pemilik / Pengelola', proyek.pemilik || '-'],
    ['Koordinat', proyek.latitude != null && proyek.longitude != null ? `${proyek.latitude}, ${proyek.longitude}` : proyek.koordinat || '-'],
    ['Tahun Dibangun', proyek.tahun_dibangun || '-'],
    ['Jumlah Lantai', proyek.jumlah_lantai || '-'],
    ['Luas Bangunan', fmtM2(proyek.luas_bangunan)],
    ['Luas Lahan', fmtM2(proyek.luas_lahan)],
    ['Nomor PBG / IMB', proyek.nomor_pbg || '-'],
    ['As-Built Drawing', proyek.as_built_drawing ? 'Tersedia' : 'Belum tersedia'],
    ['Riwayat Pemeliharaan', proyek.riwayat_pemeliharaan ? 'Tersedia' : 'Belum tersedia'],
  ];

  const summary = items.reduce(
    (acc, item) => {
      const s = normalizeStatus(item.status);
      acc.total += 1;

      if (s === 'sesuai' || s === 'tidak_rusak') acc.sesuai += 1;
      else if (s === 'tidak_sesuai' || s === 'rusak_sedang' || s === 'rusak_ringan') acc.tidak_sesuai += 1;
      else if (s === 'belum_terverifikasi') acc.belum_terverifikasi += 1;
      else acc.lainnya += 1;

      const k = getItemKategori(item);
      if (!acc.perKategori[k]) {
        acc.perKategori[k] = {
          total: 0,
          sesuai: 0,
          tidak_sesuai: 0,
          belum_terverifikasi: 0,
          lainnya: 0,
        };
      }
      acc.perKategori[k].total += 1;
      if (s === 'sesuai' || s === 'tidak_rusak') acc.perKategori[k].sesuai += 1;
      else if (s === 'tidak_sesuai' || s === 'rusak_sedang' || s === 'rusak_ringan') acc.perKategori[k].tidak_sesuai += 1;
      else if (s === 'belum_terverifikasi') acc.perKategori[k].belum_terverifikasi += 1;
      else acc.perKategori[k].lainnya += 1;

      return acc;
    },
    {
      total: 0,
      sesuai: 0,
      tidak_sesuai: 0,
      belum_terverifikasi: 0,
      lainnya: 0,
      perKategori: {},
    }
  );

  const percent = (n) => (summary.total > 0 ? ((n / summary.total) * 100).toFixed(1) : '0.0');

  const grouped = items.reduce((acc, item) => {
    const key = getItemKategori(item);
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  const categoryOrder = [
    'administrasi',
    'arsitektur',
    'struktur',
    'mep',
    'mekanikal',
    'elektrikal',
    'plumbing',
    'keselamatan',
    'kesehatan',
    'kenyamanan',
    'kemudahan',
    'lainnya',
  ];

  const orderedCategories = [
    ...categoryOrder.filter((cat) => grouped[cat] && grouped[cat].length > 0),
    ...Object.keys(grouped).filter((cat) => !categoryOrder.includes(cat)),
  ];

  const buildChecklistTable = (list) => {
    if (!list || list.length === 0) {
      return [
        bodyText('Data checklist tidak tersedia pada kategori ini.', {
          italics: true,
          color: COLOR_MUTED,
        }),
      ];
    }

    return [
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: createTableBorders(),
        rows: [
          new TableRow({
            tableHeader: true,
            cantSplit: true,
            children: [
              headerCell('KODE', 10),
              headerCell('ITEM PEMERIKSAAN', 28),
              headerCell('STATUS', 14),
              headerCell('CATATAN', 24),
              headerCell('REKOMENDASI', 24),
            ],
          }),
          ...list.map((item, idx) => {
            const code = getItemCode(item);
            const title = getItemTitle(item);
            const status = item.status;
            const catatan = getItemCatatan(item);
            const rekomendasi = getItemRekomendasi(item);

            return new TableRow({
              cantSplit: true,
              children: [
                dataCell(normalizeText(code), 10, {
                  center: true,
                  bold: true,
                  size: FONT_SIZE_SMALL,
                  shading: idx % 2 === 0 ? COLOR_TABLE_ALT : undefined,
                }),
                dataCell(normalizeText(title), 28, {
                  shading: idx % 2 === 0 ? COLOR_TABLE_ALT : undefined,
                }),
                dataCell(statusLabelAuto(status), 14, {
                  center: true,
                  bold: true,
                  color: statusColor(status),
                  shading: idx % 2 === 0 ? COLOR_TABLE_ALT : undefined,
                }),
                dataCell(normalizeText(catatan), 24, {
                  size: FONT_SIZE_SMALL,
                  shading: idx % 2 === 0 ? COLOR_TABLE_ALT : undefined,
                }),
                dataCell(normalizeText(rekomendasi), 24, {
                  size: FONT_SIZE_SMALL,
                  shading: idx % 2 === 0 ? COLOR_TABLE_ALT : undefined,
                }),
              ],
            });
          }),
        ],
      }),
    ];
  };

  const summaryRows = [
    ['Total Item', String(summary.total), 'Seluruh item checklist yang berhasil dibaca dari data proyek.'],
    ['Sesuai / Memenuhi', `${summary.sesuai} (${percent(summary.sesuai)}%)`, 'Item yang dinyatakan sesuai, tersedia, atau memenuhi verifikasi.'],
    ['Tidak Sesuai / Risiko', `${summary.tidak_sesuai} (${percent(summary.tidak_sesuai)}%)`, 'Item yang menunjukkan ketidaksesuaian, kerusakan, atau risiko teknis.'],
    ['Belum Terverifikasi', `${summary.belum_terverifikasi} (${percent(summary.belum_terverifikasi)}%)`, 'Item yang belum cukup bukti atau belum dapat diverifikasi.'],
    ['Status Lainnya', `${summary.lainnya} (${percent(summary.lainnya)}%)`, 'Item di luar kategori utama atau perlu penyesuaian status.'],
  ];

  const tableIdentitas = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: createTableBorders(),
    rows: identityRows.map((row, idx) =>
      new TableRow({
        children: [
          dataCell(row[0], 32, {
            bold: true,
            shading: idx % 2 === 0 ? COLOR_TABLE_ALT : undefined,
          }),
          dataCell(normalizeText(row[1]), 68, {
            shading: idx % 2 === 0 ? COLOR_TABLE_ALT : undefined,
          }),
        ],
      })
    ),
  });

  const tableSummary = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: createTableBorders(),
    rows: [
      new TableRow({
        tableHeader: true,
        cantSplit: true,
        children: [
          headerCell('URAIAN', 28),
          headerCell('NILAI', 22),
          headerCell('KETERANGAN', 50),
        ],
      }),
      ...summaryRows.map((row, idx) =>
        new TableRow({
          children: [
            dataCell(row[0], 28, {
              bold: true,
              shading: idx % 2 === 0 ? COLOR_TABLE_ALT : undefined,
            }),
            dataCell(row[1], 22, {
              center: true,
              bold: true,
              color:
                row[0] === 'Sesuai / Memenuhi'
                  ? COLOR_SUCCESS
                  : row[0] === 'Tidak Sesuai / Risiko'
                    ? COLOR_DANGER
                    : row[0] === 'Belum Terverifikasi'
                      ? COLOR_WARNING
                      : COLOR_MUTED,
              shading: idx % 2 === 0 ? COLOR_TABLE_ALT : undefined,
            }),
            dataCell(row[2], 50, {
              shading: idx % 2 === 0 ? COLOR_TABLE_ALT : undefined,
            }),
          ],
        })
      ),
    ],
  });

  const tableRekapPerKategori = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: createTableBorders(),
    rows: [
      new TableRow({
        tableHeader: true,
        cantSplit: true,
        children: [
          headerCell('KATEGORI', 24),
          headerCell('TOTAL', 10),
          headerCell('SESUAI', 14),
          headerCell('TIDAK SESUAI', 16),
          headerCell('BELUM VERIFIKASI', 18),
          headerCell('LAINNYA', 18),
        ],
      }),
      ...orderedCategories.map((cat, idx) => {
        const s = summary.perKategori[cat] || {
          total: grouped[cat]?.length || 0,
          sesuai: 0,
          tidak_sesuai: 0,
          belum_terverifikasi: 0,
          lainnya: 0,
        };

        return new TableRow({
          children: [
            dataCell(kategoriLabel(cat), 24, {
              bold: true,
              shading: idx % 2 === 0 ? COLOR_TABLE_ALT : undefined,
            }),
            dataCell(String(s.total), 10, {
              center: true,
              shading: idx % 2 === 0 ? COLOR_TABLE_ALT : undefined,
            }),
            dataCell(String(s.sesuai), 14, {
              center: true,
              bold: true,
              color: COLOR_SUCCESS,
              shading: idx % 2 === 0 ? COLOR_TABLE_ALT : undefined,
            }),
            dataCell(String(s.tidak_sesuai), 16, {
              center: true,
              bold: true,
              color: COLOR_DANGER,
              shading: idx % 2 === 0 ? COLOR_TABLE_ALT : undefined,
            }),
            dataCell(String(s.belum_terverifikasi), 18, {
              center: true,
              bold: true,
              color: COLOR_WARNING,
              shading: idx % 2 === 0 ? COLOR_TABLE_ALT : undefined,
            }),
            dataCell(String(s.lainnya), 18, {
              center: true,
              shading: idx % 2 === 0 ? COLOR_TABLE_ALT : undefined,
            }),
          ],
        });
      }),
    ],
  });

  return [
    heading1('BAB III: HASIL PEMERIKSAAN'),

    bodyText(
      'Bab ini menyajikan hasil pemeriksaan yang dihasilkan secara otomatis dari data proyek dan checklist pemeriksaan. Penyajian dilakukan secara berlapis, dimulai dari identitas bangunan, ringkasan rekap, rekap per kategori, kemudian checklist detail per kategori agar setiap temuan dapat ditelusuri secara mudah dan konsisten.'
    ),

    heading2('3.1. Identitas Bangunan Gedung'),
    bodyText(
      'Data identitas berikut menjadi dasar pengaitan hasil checklist dengan objek bangunan yang diperiksa. Informasi ini disusun otomatis dari data proyek.'
    ),
    tableIdentitas,

    heading2('3.2. Rekap Hasil Pemeriksaan'),
    bodyText(
      'Rekap berikut merangkum distribusi status checklist dari seluruh item yang tersedia di data input. Rekap ini memberikan gambaran awal mengenai kondisi umum hasil pemeriksaan sebelum masuk ke analisis rinci.'
    ),
    tableSummary,

    heading2('3.3. Rekap per Kategori Pemeriksaan'),
    bodyText(
      'Rekap kategori disusun otomatis berdasarkan pengelompokan data checklist. Bagian ini membantu pembaca melihat kategori mana yang paling banyak memiliki temuan sesuai, tidak sesuai, atau belum terverifikasi.'
    ),
    tableRekapPerKategori,

    heading2('3.4. Hasil Checklist Pemeriksaan per Kategori'),
    bodyText(
      'Berikut disajikan hasil pemeriksaan per kategori. Setiap item dilengkapi status, catatan teknis, dan rekomendasi awal bila tersedia.'
    ),

    ...(orderedCategories.length > 0
      ? orderedCategories.flatMap((cat) => {
        const list = grouped[cat] || [];
        const summaryCat = summary.perKategori[cat] || {
          total: list.length,
          sesuai: 0,
          tidak_sesuai: 0,
          belum_terverifikasi: 0,
          lainnya: 0,
        };

        return [
          heading3(kategoriLabel(cat)),
          bodyText(
            `Kategori ini memuat ${summaryCat.total} item pemeriksaan. Dari total tersebut, ${summaryCat.sesuai} item sesuai, ${summaryCat.tidak_sesuai} item tidak sesuai, ${summaryCat.belum_terverifikasi} item belum terverifikasi, dan ${summaryCat.lainnya} item berada pada status lainnya.`
          ),
          ...buildChecklistTable(list),
          emptyLine(),
        ];
      })
      : [
        bodyText('Data checklist tidak tersedia untuk ditampilkan.', {
          italics: true,
          color: COLOR_MUTED,
        }),
      ]),

    heading2('3.5. Catatan Teknis Awal'),
    bodyText(
      'Hasil pada bab ini menjadi dasar bagi analisis dan evaluasi pada bab berikutnya. Item dengan status tidak sesuai, belum terverifikasi, atau menunjukkan indikasi kerusakan akan ditelaah lebih lanjut untuk menentukan dampak teknis, tingkat risiko, dan kebutuhan rekomendasi perbaikan.'
    ),
    bulletItem('Item yang menunjukkan ketidaksesuaian akan dibahas lebih detail pada BAB IV.'),
    bulletItem('Item tanpa bukti cukup akan dinyatakan belum dapat diverifikasi sampai ada data pendukung.'),
    bulletItem('Temuan penting akan diturunkan menjadi rekomendasi teknis dan estimasi waktu perbaikan pada BAB VI.'),

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