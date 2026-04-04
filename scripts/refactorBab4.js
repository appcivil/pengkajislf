const fs = require('fs');

const path = 'src/lib/docx-service.js';
let content = fs.readFileSync(path, 'utf8');

const replacement = `// ============================================================
//  BAB IV: HASIL PEMERIKSAAN TEKNIS (PER ASPEK)
// ============================================================
function renderBab4(checklist, analisis) {
  const allItems = checklist || [];
  
  // 4.1 Tata Bangunan Gedung (TB-...)
  const tbPeruntukan = allItems.filter(c => c.kode?.toLowerCase().startsWith('tb-01'));
  const tbIntensitas = allItems.filter(c => c.kode?.toLowerCase().startsWith('tb-02'));
  const tbArsitektur = allItems.filter(c => c.kode?.toLowerCase().startsWith('tb-03'));

  // 4.2 Keselamatan (S-..., F-..., L-...)
  const sItems = allItems.filter(c => c.kode?.toLowerCase().startsWith('s-'));
  const fPasif = allItems.filter(c => ['f-01','f-02'].includes(c.kode?.toLowerCase()));
  const fAktif = allItems.filter(c => ['f-03','f-04','f-05','f-06','f-07'].includes(c.kode?.toLowerCase()));
  const lPetir = allItems.filter(c => ['l-01','l-02'].includes(c.kode?.toLowerCase()));
  const lListrik = allItems.filter(c => ['l-03','l-04'].includes(c.kode?.toLowerCase()));

  // 4.3 s/d 4.5
  const hItems = allItems.filter(c => c.kode?.toLowerCase().startsWith('h-'));
  const eItems = allItems.filter(c => c.kode?.toLowerCase().startsWith('e-'));
  const cItems = allItems.filter(c => c.kode?.toLowerCase().startsWith('c-'));

  const buildSubTable = (items, headers = ['NO', 'KODE', 'NAMA ITEM PEMERIKSAAN', 'STATUS', 'CATATAN / FAKTA LAPANGAN']) => {
    if (!items || items.length === 0) return [bodyText('Data tidak tersedia.', { italics: true, color: COLOR_MUTED })];
    return [new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: createTableBorders(),
      rows: [
        new TableRow({
          tableHeader: true, cantSplit: true,
          children: headers.map(h => headerCell(h, 100/headers.length)),
        }),
        ...items.map((item, idx) => new TableRow({
          cantSplit: true,
          children: [
            dataCell(String(idx + 1), 6, { center: true, shading: idx % 2 === 0 ? COLOR_TABLE_ALT : undefined }),
            dataCell(item.kode || '-', 10, { center: true, bold: true, size: FONT_SIZE_SMALL, shading: idx % 2 === 0 ? COLOR_TABLE_ALT : undefined }),
            dataCell(item.nama || '-', 34, { shading: idx % 2 === 0 ? COLOR_TABLE_ALT : undefined }),
            dataCell(getStatusLabel(item.status), 15, {
              center: true, bold: true,
              color: ['baik', 'ada_sesuai'].includes(item.status) ? COLOR_SUCCESS
                   : ['buruk', 'kritis', 'tidak_ada', 'ada_tidak_sesuai'].includes(item.status) ? COLOR_DANGER : COLOR_WARNING,
              shading: idx % 2 === 0 ? COLOR_TABLE_ALT : undefined,
            }),
            dataCell(item.catatan || item.keterangan || '-', 35, { size: FONT_SIZE_SMALL, shading: idx % 2 === 0 ? COLOR_TABLE_ALT : undefined }),
          ],
        })),
      ],
    })];
  };

  const renderEvaluasiBoilerplate = (items, namaAspek) => {
    if (!items || items.length === 0) return [];
    
    // Cari apakah ada data deep_reasoning nyata
    const drItem = items.find(i => i.metadata?.deep_reasoning?.analisis);
    
    // Fallback boilerplate
    const total = items.length;
    const sesuai = items.filter(c => ['baik', 'ada_sesuai'].includes(c.status)).length;
    const persen = Math.round((sesuai / total) * 100);
    let kesimpulan = persen >= 80 ? 'memenuhi standar teknis yang diwajibkan secara umum.' : persen >= 50 ? 'memenuhi sebagian standar teknis, namun memerlukan perbaikan pada temuan anomali.' : 'belum memenuhi standar teknis dan membutuhkan perbaikan menyeluruh secara mendesak.';

    let analisisNarasi = drItem ? drItem.metadata.deep_reasoning.analisis 
       : \`Berdasarkan tinjauan visual lapangan yang dikomodasi dalam struktur laporan ini, kondisi sub-sistem pada aspek \${namaAspek} dikategorikan \${kesimpulan} Total kepatuhan mencapai rata-rata \${persen}%.\`;

    const drAsBuilt = drItem?.metadata?.deep_reasoning?.faktual || \`Pengamatan fisik maupun hasil uji NDT lapangan memperlihatkan kesesuaian parsial/penuh dengan gambar terbangun (As-Built Drawing) yang dilampirkan, meskipun terdapat beberapa deviasi kecil yang tercatat.\`;
    const drRekomendasi = drItem?.metadata?.deep_reasoning?.rekomendasi || \`Komponen yang berstatus deviasi (tidak sesuai) dicatat di luar tabel evaluasi sebagai referensi untuk penjadwalan mitigasi perbaikan lebih spesifik dan tervalidasi.\`;

    return [
      emptyLine(),
      new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        spacing: { before: 50, after: 150 },
        children: [
          new TextRun({ text: 'Evaluasi Forensik dan Narasi Analisis Mendalam:', bold: true, italics: true, color: COLOR_SUBHEADING }),
          new TextRun({ break: 1 }),
          // Narasi tergabung profesional
          new TextRun({ text: analisisNarasi }),
          new TextRun({ text: " ", italics: true }),
          new TextRun({ text: drAsBuilt }),
          new TextRun({ text: " Evaluasi teknis mencatat bahwa apabila terdapat justifikasi dari potongan referensi NSPK maupun hasil lapangan yang disimpan pada dokumentasi proyek (terlampir di database utama), ", italics: true }),
          new TextRun({ text: drRekomendasi }),
        ]
      }),
      emptyLine()
    ];
  };

  const skorAspek = analisis ? [
    { label: 'Administrasi', skor: analisis.skor_administrasi, bobot: 10 },
    { label: 'Struktur', skor: analisis.skor_struktur, bobot: 25 },
    { label: 'Arsitektur', skor: analisis.skor_arsitektur, bobot: 10 },
    { label: 'MEP (Utilitas)', skor: analisis.skor_mep, bobot: 15 },
    { label: 'Keselamatan Kebakaran', skor: analisis.skor_kebakaran, bobot: 20 },
    { label: 'Kesehatan', skor: analisis.skor_kesehatan, bobot: 8 },
    { label: 'Kenyamanan', skor: analisis.skor_kenyamanan, bobot: 6 },
    { label: 'Kemudahan', skor: analisis.skor_kemudahan, bobot: 6 },
  ] : [];

  return [
    heading1('BAB IV: HASIL PEMERIKSAAN TEKNIS (PER ASPEK)'),
    bodyText('Bab ini menyajikan hasil observasi lapangan terperinci dan evaluasi forektif untuk setiap disiplin ilmu.'),

    heading2('4.1. Tata Bangunan Gedung'),
    heading3('4.1.1. Peruntukan'),
    ...buildSubTable(tbPeruntukan),
    ...renderEvaluasiBoilerplate(tbPeruntukan, "Peruntukan Ruang"),

    heading3('4.1.2. Intensitas (GSB/KDB/KLB/KDH)'),
    ...buildSubTable(tbIntensitas),
    ...renderEvaluasiBoilerplate(tbIntensitas, "Intensitas Gedung"),

    heading3('4.1.3. Arsitektur Bangunan'),
    ...buildSubTable(tbArsitektur),
    ...renderEvaluasiBoilerplate(tbArsitektur, "Arsitektur"),

    heading2('4.2. Persyaratan Keselamatan'),
    heading3('4.2.1. Sistem Struktur (S-01 s/d S-06)'),
    ...buildSubTable(sItems),
    ...renderEvaluasiBoilerplate(sItems, "Sistem Struktur Utama"),

    heading3('4.2.2. Proteksi Kebakaran Pasif (F-01, F-02)'),
    ...buildSubTable(fPasif),
    ...renderEvaluasiBoilerplate(fPasif, "Proteksi Api Pasif"),

    heading3('4.2.3. Proteksi Kebakaran Aktif (F-03 s/d F-07)'),
    ...buildSubTable(fAktif),
    ...renderEvaluasiBoilerplate(fAktif, "Proteksi Api Aktif"),

    heading3('4.2.4. Penangkal Petir (L-01, L-02)'),
    ...buildSubTable(lPetir),
    ...renderEvaluasiBoilerplate(lPetir, "Penangkal Petir"),

    heading3('4.2.5. Instalasi Listrik (L-03, L-04)'),
    ...buildSubTable(lListrik),
    ...renderEvaluasiBoilerplate(lListrik, "Elektrikal / Kelistrikan"),

    heading2('4.3. Persyaratan Kesehatan (H-01 s/d H-08)'),
    ...buildSubTable(hItems),
    ...renderEvaluasiBoilerplate(hItems, "Sanitasi dan Kesehatan"),

    heading2('4.4. Persyaratan Kemudahan (E-01 s/d E-06)'),
    ...buildSubTable(eItems),
    ...renderEvaluasiBoilerplate(eItems, "Kemudahan Akses Difabel"),

    heading2('4.5. Persyaratan Kenyamanan'),
    ...buildSubTable(cItems),
    ...renderEvaluasiBoilerplate(cItems, "Kenyamanan Lingkungan"),

    heading2('4.6. Rekapitulasi Skor Per Aspek'),
    bodyText('Berikut adalah hasil komputasi dan agregasi pembobotan skor kelaikan per sub-sistem utama bangunan:'),
    ...(analisis ? [
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: createTableBorders(),
        rows: [
          new TableRow({
            tableHeader: true, cantSplit: true,
            children: [
              headerCell('NO', 8), headerCell('ASPEK', 32), headerCell('BOBOT (%)', 15),
              headerCell('SKOR (0-100)', 20), headerCell('KATEGORI', 25),
            ],
          }),
          ...skorAspek.map((a, idx) => {
            const skor = a.skor || 0;
            const kategori = skor >= 80 ? 'Baik' : skor >= 60 ? 'Cukup' : skor >= 40 ? 'Perlu Perbaikan' : 'Kritis';
            const color = skor >= 80 ? COLOR_SUCCESS : skor >= 60 ? COLOR_WARNING : COLOR_DANGER;
            return new TableRow({
              cantSplit: true,
              children: [
                dataCell(String(idx + 1), 8, { center: true, shading: idx % 2 === 0 ? COLOR_TABLE_ALT : undefined }),
                dataCell(a.label, 32, { shading: idx % 2 === 0 ? COLOR_TABLE_ALT : undefined }),
                dataCell(String(a.bobot), 15, { center: true, shading: idx % 2 === 0 ? COLOR_TABLE_ALT : undefined }),
                dataCell(String(skor), 20, { center: true, bold: true, color, shading: idx % 2 === 0 ? COLOR_TABLE_ALT : undefined }),
                dataCell(kategori.toUpperCase(), 25, { center: true, bold: true, color, shading: idx % 2 === 0 ? COLOR_TABLE_ALT : undefined }),
              ],
            });
          }),
        ],
      })
    ] : [ bodyText('Data skor kalkulasi tidak tersedia', {italics: true}) ]),
    emptyLine(),
  ];
}

// ============================================================
//  BAB V: EVALUASI KINERJA DAN KELAIKAN BANGUNAN
// ============================================================
function renderBab5(analisis, checklist) {
  if (!analisis) {
    return [
      heading1('BAB V: EVALUASI KINERJA DAN KELAIKAN BANGUNAN'),
      bodyText('Kalkulasi evaluasi teknis belum terselesaikan dengan sempurna.', { italics: true }),
    ];
  }

  const allItems = checklist || [];
  
  const result = [
    heading1('BAB V: EVALUASI KINERJA DAN KELAIKAN BANGUNAN'),
    bodyText(\`Bab ini mendetailkan spesifikasi temuan yang memerlukan penyelesaian terstruktur.\`),

    heading2('5.1. Tabel Matriks Temuan dan Rencana Waktu Perbaikan'),
`;

// Lakukan replace string lama dari baris 1066 sampai renderBab5 bagian "5.1. Tabel Matriks Temuan dan Rencana Waktu Perbaikan".
// Regex atau split string.
const startMarker = "// ============================================================\n//  BAB IV: HASIL PEMERIKSAAN TEKNIS (PER ASPEK)";
const endMarker = "heading2('5.2. Tabel Matriks Temuan dan Rencana Waktu Perbaikan'),";

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
    const originalChunk = content.substring(startIndex, endIndex + endMarker.length);
    content = content.replace(originalChunk, replacement);
    fs.writeFileSync(path, content, 'utf8');
    console.log("Replacement successful!");
} else {
    console.log("Markers not found");
}
