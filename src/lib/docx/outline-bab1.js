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

  const legalBullet = (text) => bulletItem(text);

  return [
    heading1('BAB I: GAMBARAN UMUM'),
    bodyText(
      'Bab ini menyajikan gambaran umum objek kajian sebagai dasar penyusunan pemeriksaan teknis bangunan gedung. Uraian meliputi latar belakang, tujuan, ruang lingkup, dasar hukum dan rujukan teknis, data umum bangunan, lokasi bangunan, dan kondisi awal eksisting yang menjadi dasar analisis pada bab-bab berikutnya.'
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

    heading3('1.4.1 Undang-Undang'),
    numberedItem('a', 'Undang-Undang Nomor 28 Tahun 2002 tentang Bangunan Gedung.'),
    numberedItem('b', 'Undang-Undang Nomor 2 Tahun 2017 tentang Jasa Konstruksi.'),
    numberedItem('c', 'Undang-Undang Nomor 6 Tahun 2017 tentang Arsitek.'),
    numberedItem('d', 'Undang-Undang Nomor 11 Tahun 2020 tentang Cipta Kerja.'),
    numberedItem('e', 'Peraturan Pemerintah Pengganti Undang-Undang Nomor 2 Tahun 2022 tentang Cipta Kerja.'),
    numberedItem('f', 'Undang-Undang Nomor 6 Tahun 2023 tentang Penetapan Peraturan Pemerintah Pengganti Undang-Undang Nomor 2 Tahun 2022 tentang Cipta Kerja Menjadi Undang-Undang.'),

    heading3('1.4.2 Peraturan Pemerintah'),
    numberedItem('a', 'Peraturan Pemerintah Nomor 6 Tahun 2021 tentang Penyelenggaraan Perizinan Berusaha di Daerah.'),
    numberedItem('b', 'Peraturan Pemerintah Nomor 14 Tahun 2021 tentang Perubahan atas Peraturan Pemerintah Nomor 22 Tahun 2020 tentang Peraturan Pelaksanaan Undang-Undang Nomor 2 Tahun 2017 tentang Jasa Konstruksi.'),
    numberedItem('c', 'Peraturan Pemerintah Nomor 15 Tahun 2021 tentang Peraturan Pelaksanaan Undang-Undang Nomor 6 Tahun 2017 tentang Arsitek.'),
    numberedItem('d', 'Peraturan Pemerintah Nomor 16 Tahun 2021 tentang Peraturan Pelaksanaan Undang-Undang Nomor 28 Tahun 2002 tentang Bangunan Gedung.'),

    heading3('1.4.3 Peraturan Menteri PUPR'),
    numberedItem('a', 'Peraturan Menteri Pekerjaan Umum dan Perumahan Rakyat Nomor 24/PRT/M/2008 tentang Pedoman Pemeliharaan dan Perawatan Bangunan Gedung.'),
    numberedItem('b', 'Peraturan Menteri Pekerjaan Umum dan Perumahan Rakyat Nomor 16/PRT/M/2010 tentang Pedoman Teknis Pemeriksaan Berkala Bangunan Gedung.'),
    numberedItem('c', 'Peraturan Menteri Pekerjaan Umum dan Perumahan Rakyat Nomor 14/PRT/M/2017 tentang Persyaratan Kemudahan Bangunan Gedung.'),
    numberedItem('d', 'Peraturan Menteri Pekerjaan Umum dan Perumahan Rakyat Nomor 11/PRT/M/2018 tentang Tim Ahli Bangunan Gedung, Pengkaji Teknis, dan Penilik Bangunan.'),
    numberedItem('e', 'Peraturan Menteri Pekerjaan Umum dan Perumahan Rakyat Nomor 22/PRT/M/2018 tentang Pembangunan Bangunan Gedung Negara.'),
    numberedItem('f', 'Peraturan Menteri Pekerjaan Umum dan Perumahan Rakyat Nomor 27/PRT/M/2018 tentang Sertifikat Laik Fungsi Bangunan Gedung.'),
    numberedItem('g', 'Peraturan Menteri Pekerjaan Umum dan Perumahan Rakyat Nomor 2 Tahun 2020 tentang Perubahan Kedua atas Peraturan Menteri Pekerjaan Umum dan Perumahan Rakyat Nomor 05/PRT/M/2016 tentang Izin Mendirikan Bangunan Gedung.'),
    numberedItem('h', 'Peraturan Menteri Pekerjaan Umum dan Perumahan Rakyat Nomor 3 Tahun 2020 tentang Perubahan atas Peraturan Menteri Pekerjaan Umum dan Perumahan Rakyat Nomor 27/PRT/M/2018 tentang Sertifikat Laik Fungsi Bangunan Gedung.'),
    numberedItem('i', 'Peraturan Menteri Pekerjaan Umum dan Perumahan Rakyat Nomor 8 Tahun 2021 tentang Penilai Ahli, Kegagalan Bangunan, dan Penilaian Kegagalan Bangunan.'),
    numberedItem('j', 'Peraturan Menteri Pekerjaan Umum dan Perumahan Rakyat Nomor 18 Tahun 2021 tentang Standar Pembongkaran Bangunan Gedung.'),
    numberedItem('k', 'Peraturan Menteri Pekerjaan Umum dan Perumahan Rakyat Nomor 19 Tahun 2021 tentang Pedoman Teknis Penyelenggaraan Bangunan Gedung Cagar Budaya yang Dilestarikan.'),
    numberedItem('l', 'Peraturan Menteri Pekerjaan Umum dan Perumahan Rakyat Nomor 20 Tahun 2021 tentang Bangunan Gedung Fungsi Khusus.'),
    numberedItem('m', 'Peraturan Menteri Pekerjaan Umum dan Perumahan Rakyat Nomor 10 Tahun 2023 tentang Bangunan Gedung Cerdas.'),

    heading3('1.4.4 Standar Nasional Indonesia'),
    bodyText('a. SNI Arsitektur'),
    legalBullet('SNI 02-1733-2004 tentang Tata Cara Perencanaan Lingkungan Perumahan di Perkotaan.'),

    bodyText('b. SNI Struktur'),
    legalBullet('SNI 1726:2019 tentang Tata Cara Perencanaan Ketahanan Gempa untuk Struktur Bangunan Gedung dan Non Gedung.'),
    legalBullet('SNI 1727:2020 tentang Beban Desain Minimum dan Kriteria Terkait untuk Bangunan Gedung dan Struktur Lain.'),
    legalBullet('SNI 1729:2020 tentang Spesifikasi untuk Bangunan Gedung Baja Struktural.'),
    legalBullet('SNI 8900:2020 tentang Panduan Desain Sederhana untuk Bangunan Gedung.'),
    legalBullet('SNI 7860:2020 tentang Ketentuan Seismik untuk Bangunan Gedung Baja Struktural.'),
    legalBullet('SNI 2847:2019 tentang Persyaratan Beton Struktural untuk Bangunan Gedung.'),
    legalBullet('SNI 2052:2017 tentang Baja Tulangan Beton.'),
    legalBullet('SNI 8046:2016 tentang Stabilitas Lereng.'),
    legalBullet('SNI 03-1734-1989 tentang Tata Cara Perencanaan Beton dan Struktur Dinding Bertulang untuk Rumah dan Gedung.'),
    legalBullet('SNI 03-3976-1995 tentang Tata Cara Pengadukan dan Pengecoran Beton.'),
    legalBullet('SNI 03-2834-2000 tentang Tata Cara Pembuatan Rencana Campuran Beton Normal.'),
    legalBullet('SNI 03-3449-2002 tentang Tata Cara Rencana Pembuatan Campuran Beton Ringan dengan Agregat Ringan.'),
    legalBullet('SNI 03-2847-2002 tentang Jumlah Benda Uji.'),
    legalBullet('SNI 03-4803-1998 tentang Uji Pantul Beton.'),
    legalBullet('SNI 03-1973-1980 tentang Metode Pengujian Berat Isi Beton.'),
    legalBullet('SNI 03-4330-1997 tentang Metode Pengujian Elemen Struktur Beton dengan Alat Palu Beton.'),
    legalBullet('SNI 03-2459-2002 tentang Spesifikasi Sumur Resapan Air Hujan untuk Lahan Pekarangan.'),
    legalBullet('SNI 03-6481-2000 tentang Sistem Plambing 2000.'),
    legalBullet('SNI 04-7018-2004 tentang Sistem Pasokan Daya Listrik Darurat dan Siaga.'),
    legalBullet('SNI 04-7019-2004 tentang Sistem Pasokan Daya Listrik Darurat Menggunakan Energi Tersimpan.'),
    legalBullet('SNI 03-6572-2001 tentang Tata Cara Perancangan Sistem Ventilasi dan Pengkondisian Udara pada Bangunan Gedung.'),
    legalBullet('SNI 03-6169-2000 tentang Prosedur Audit Energi pada Bangunan Gedung.'),
    legalBullet('SNI 03-7017.2-2004 tentang Lift Traksi Listrik pada Bangunan Gedung Bagian 2: Pemeriksaan dan Pengujian Berkala.'),
    legalBullet('SNI 03-6575-2001 tentang Tata Cara Perancangan Sistem Pencahayaan Buatan pada Bangunan Gedung.'),
    legalBullet('SNI 03-2453-2002 tentang Tata Cara Perencanaan Perancangan Sumur Resapan Air Hujan untuk Lahan Pekarangan.'),
    legalBullet('SNI 03-2396-2001 tentang Tata Cara Perancangan Sistem Pencahayaan Alami pada Bangunan Gedung.'),

    bodyText('c. SNI MEP'),
    legalBullet('SNI 0225:2020 tentang Persyaratan Umum Instalasi Listrik (PUIL 2020).'),
    legalBullet('SNI 0225:2011 tentang Persyaratan Umum Instalasi Listrik (PUIL 2011).'),
    legalBullet('SNI 6390:2020 tentang Konservasi Energi Sistem Tata Udara pada Bangunan Gedung.'),
    legalBullet('SNI 6389:2020 tentang Konservasi Energi Selubung Bangunan pada Bangunan Gedung.'),
    legalBullet('SNI 6197:2020 tentang Konservasi Energi pada Sistem Pencahayaan.'),
    legalBullet('SNI 8153:2015 tentang Sistem Plambing pada Bangunan Gedung.'),
    legalBullet('SNI 04-0227-2003 tentang Tegangan Standar.'),
    legalBullet('SNI 03-1746-2000 tentang Tata Cara Perencanaan dan Pemasangan Sarana Jalan Keluar untuk Penyelamatan terhadap Bahaya Kebakaran pada Bangunan Gedung.'),
    legalBullet('SNI 03-6573-2001 tentang Tata Cara Perancangan Sistem Transportasi Vertikal dalam Gedung (Lift).'),
    legalBullet('SNI 05-7052-2004 tentang Syarat-syarat Umum Konstruksi Lift Penumpang yang Dijalankan dengan Motor Traksi Tanpa Kamar Mesin.'),
    legalBullet('SNI 03-3987-1995 tentang Tata Cara Perencanaan dan Pemasangan Pemadam Api Ringan untuk Pencegahan Bahaya Kebakaran pada Bangunan Rumah dan Gedung.'),
    legalBullet('SNI 03-1745-2000 tentang Tata Cara Perencanaan dan Pemasangan Sistem Pipa Tegak dan Slang untuk Pencegahan Bahaya Kebakaran pada Bangunan Gedung.'),
    legalBullet('SNI 03-3985-2000 tentang Tata Cara Perencanaan, Pemasangan, dan Pengujian Sistem Deteksi dan Alarm Kebakaran untuk Pencegahan Bahaya Kebakaran pada Bangunan Gedung.'),
    legalBullet('SNI 03-3989-2000 tentang Tata Cara Perencanaan dan Pemasangan Sistem Springkler Otomatik untuk Pencegahan Bahaya Kebakaran pada Bangunan Gedung.'),
    legalBullet('SNI 03-6571-2001 tentang Sistem Pengendalian Asap Kebakaran pada Bangunan Gedung.'),
    legalBullet('SNI 03-0712-2004 tentang Sistem Manajemen Asap dalam Mal, Atrium, dan Ruangan Bervolume Besar.'),
    legalBullet('SNI 7062:2019 tentang Pengukuran Intensitas Pencahayaan di Tempat Kerja.'),
    legalBullet('SNI 0225:2011 tentang Persyaratan Umum Instalasi Listrik.'),

    heading3('1.4.5 Aturan Terkait Lainnya'),
    numberedItem('a', 'Kementerian Lingkungan Hidup dan Kehutanan, antara lain terkait pedoman pelaksanaan 3R melalui bank sampah dan baku mutu air limbah.'),
    numberedItem('b', 'Kementerian ESDM, antara lain terkait penyediaan infrastruktur pengisian listrik untuk kendaraan bermotor listrik berbasis baterai.'),
    numberedItem('c', 'Kementerian Kesehatan, antara lain terkait persyaratan kualitas air minum dan standar baku mutu kesehatan lingkungan.'),
    numberedItem('d', 'Kementerian ATR/BPN, antara lain terkait penyediaan dan pemanfaatan ruang terbuka hijau.'),
    numberedItem('e', 'Kementerian Dalam Negeri, antara lain terkait penataan ruang terbuka hijau.'),
    numberedItem('f', 'Kementerian Perdagangan, antara lain terkait pedoman pembangunan dan pengelolaan sarana perdagangan.'),

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
      'Visualisasi lokasi bangunan ditampilkan menggunakan citra satelit untuk memberikan gambaran kondisi eksisting tapak, lingkungan sekitar, serta hubungan spasial dengan infrastruktur di sekitarnya.'
    ),

    proyek.maps_screenshot
      ? new Paragraph({
        children: [
          new TextRun({
            text: 'Gambar 1.1. Lokasi Bangunan (Citra Satelit)',
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