import * as docx from 'docx';
import { saveAs } from 'file-saver';

/**
 * Generate and download professional .docx for Legal Statements (HF Version)
 */
export async function downloadLegalDocx(p, s, type, html) {
  const { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel, ImageRun, Table, TableRow, TableCell, BorderStyle, WidthType } = docx;

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: { top: 1417, bottom: 1417, left: 1417, right: 1134 } 
        }
      },
      children: type === 'konsultan' ? 
        await buildConsultantDoc(p, s, docx) : 
        await buildOwnerDoc(p, docx)
    }]
  });

  const blob = await Packer.toBlob(doc);
  const fileName = type === 'konsultan' ? 
    `Surat Pernyataan Konsultan - ${p.nama_bangunan}.docx` : 
    `Surat Pernyataan Pemilik - ${p.nama_bangunan}.docx`;
    
  saveAs(blob, fileName);
}

async function buildConsultantDoc(p, s, dx) {
  const { Paragraph, TextRun, AlignmentType, HeadingLevel, Table, TableRow, TableCell, BorderStyle, WidthType, ImageRun } = dx;
  const experts = s.experts || {};
  const dateStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  // Pre-fetch images
  const kopImgBuffer = s.consultant?.kop_image ? await getImageData(s.consultant.kop_image) : null;
  const experts_data = await Promise.all([
    { 
      id: 'architecture',
      role: "Bidang Arsitektur / Tata Ruang Luar", 
      name: experts.architecture?.name, 
      skk: experts.architecture?.skk,
      sig: experts.architecture?.signature ? await getImageData(experts.architecture.signature) : null,
    },
    { 
      id: 'structure',
      role: "Bidang Struktur", 
      name: experts.structure?.name, 
      skk: experts.structure?.skk,
      sig: experts.structure?.signature ? await getImageData(experts.structure.signature) : null,
    },
    { 
      id: 'mep',
      role: "Bidang Utilitas / MEP", 
      name: experts.mep?.name, 
      skk: experts.mep?.skk,
      sig: experts.mep?.signature ? await getImageData(experts.mep.signature) : null,
    }
  ].map(async (ex) => {
    const verifyUrl = `${window.location.origin}${window.location.pathname}#/verify?id=${p.id}&expert=${ex.id}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(verifyUrl)}`;
    return { ...ex, qr: await getImageData(qrUrl) };
  }));

  const directorSigBuffer = s.consultant?.signature ? await getImageData(s.consultant.signature) : null;
  const directorVerifyUrl = `${window.location.origin}${window.location.pathname}#/verify?id=${p.id}&expert=director`;
  const directorQrBuffer = await getImageData(`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(directorVerifyUrl)}`);

  const headerChildren = [];
  if (kopImgBuffer) {
    headerChildren.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new ImageRun({
          data: kopImgBuffer,
          transformation: { width: 550, height: 100 }
        })
      ],
      spacing: { after: 300 }
    }));
  } else {
    const kopLines = (s.consultant?.kop_text || "KOP SURAT").split('\n');
    kopLines.forEach((line, i) => {
      headerChildren.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ 
            text: line.toUpperCase(), 
            bold: i < 2, 
            size: i === 0 ? 32 : (i === 1 ? 28 : 18) 
          })
        ]
      }));
    });
    headerChildren[headerChildren.length - 1].border = { bottom: { color: "auto", space: 1, value: BorderStyle.DOUBLE, size: 12 } };
    headerChildren[headerChildren.length - 1].spacing = { after: 300 };
  }

  const children = [
    ...headerChildren,

    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: "SURAT PERNYATAAN KELAIKAN FUNGSI", bold: true, size: 26 }),
        new dx.Break(),
        new TextRun({ text: "BANGUNAN GEDUNG", bold: true, size: 26 }),
      ],
      spacing: { after: 300 }
    }),

    // Meta Info
    createMetaRow(dx, "Nomor", ": __________"),
    createMetaRow(dx, "Tanggal", `: ${dateStr}`),
    createMetaRow(dx, "Lampiran", ": 1 (Satu) Berkas"),

    new Paragraph({
      children: [
        new TextRun({ text: `Pada hari ini, tanggal ${new Date().getDate()} bulan ${new Date().toLocaleDateString('id-ID', {month: 'long'})} tahun ${new Date().getFullYear()}, yang bertanda tangan di bawah ini:`, size: 23 }),
      ],
      spacing: { before: 200, after: 150 }
    }),

    new Paragraph({
      children: [
        new TextRun({ text: "□  Penyedia jasa pengkaji teknis / Penyedia jasa pengawas konstruksi / Penyedia jasa manajemen konstruksi / Instansi penyelenggara SLF Pemerintah Daerah", size: 23 }),
      ],
      spacing: { after: 150 }
    }),

    new Table({
      width: { size: 90, type: WidthType.PERCENTAGE },
      indent: { size: 400, type: WidthType.DXA },
      borders: dx.TableBorders.NONE,
      rows: [
        createDataRow(dx, "Nama perusahaan/instansi", s.consultant?.name || "-"),
        createDataRow(dx, "Alamat", s.consultant?.address || "-"),
        createDataRow(dx, "Telepon", p.telepon || "-"),
        createDataRow(dx, "Email", p.email_pemilik || "-"),
      ],
    }),

    new Paragraph({
      children: [new TextRun({ text: "Pelaksana pemeriksaan kelaikan fungsi bangunan gedung:", bold: true, size: 23 })],
      spacing: { before: 200 }
    }),

    new Table({
      width: { size: 95, type: WidthType.PERCENTAGE },
      indent: { size: 400, type: WidthType.DXA },
      borders: dx.TableBorders.NONE,
      rows: [
        createExpertRow(dx, "1)", "Bidang Arsitektur / Tata Ruang-Luar:", experts.architecture?.name, experts.architecture?.skk),
        createExpertRow(dx, "2)", "Bidang Struktur:", experts.structure?.name, experts.structure?.skk),
        createExpertRow(dx, "3)", "Bidang Utilitas / MEP:", experts.mep?.name, experts.mep?.skk),
      ],
    }),

    new Paragraph({
      children: [new TextRun({ text: "Telah melaksanakan pemeriksaan kelaikan fungsi bangunan gedung pada:", bold: true, size: 23 })],
      spacing: { before: 200, after: 100 }
    }),

    new Table({
      width: { size: 95, type: WidthType.PERCENTAGE },
      indent: { size: 400, type: WidthType.DXA },
      borders: dx.TableBorders.NONE,
      rows: [
        createProjectDetailRow(dx, "1)", "Nama bangunan", p.nama_bangunan),
        createProjectDetailRow(dx, "2)", "Alamat bangunan", p.alamat || "-"),
        createProjectDetailRow(dx, "3)", "Posisi koordinat", `${p.latitude || 0}, ${p.longitude || 0}`),
        createProjectDetailRow(dx, "4)", "Fungsi bangunan", p.fungsi_bangunan || "-"),
        createProjectDetailRow(dx, "5)", "Klasifikasi kompleksitas", "Sederhana / Tidak Sederhana"),
        createProjectDetailRow(dx, "6)", "Ketinggian bangunan", "-"),
        createProjectDetailRow(dx, "7)", "Jumlah lantai bangunan", `${p.jumlah_lantai || 1} Lantai`),
        createProjectDetailRow(dx, "8)", "Luas lantai bangunan", `${p.luas_bangunan || 0} m2`),
        createProjectDetailRow(dx, "9)", "Jumlah basement", "-"),
        createProjectDetailRow(dx, "10)", "Luas lantai basement", "-"),
        createProjectDetailRow(dx, "11)", "Luas tanah", `${p.luas_lahan || 0} m2`),
      ],
    }),

    new Paragraph({
      children: [new TextRun({ text: "Berdasarkan hasil pemeriksaan persyaratan kelaikan fungsi yang terdiri dari:", bold: true, size: 23 })],
      spacing: { before: 200, after: 100 }
    }),

    new Paragraph({ text: "1) Pemeriksaan dokumen administratif bangunan gedung;", bullet: { level: 0 }, indent: { left: 400 } }),
    new Paragraph({ text: "2) Pemeriksaan persyaratan teknis bangunan gedung, yaitu:", bullet: { level: 0 }, indent: { left: 400 } }),
    new Paragraph({ text: "a. pemeriksaan persyaratan tata bangunan, meliputi peruntukan, intensitas, arsitektur dan pengendalian dampak lingkungan;", indent: { left: 800 } }),
    new Paragraph({ text: "b. pemeriksaan persyaratan keandalan bangunan gedung, meliputi keselamatan, kesehatan, kenyamanan, dan kemudahan.", indent: { left: 800 } }),

    new Paragraph({ text: "Dengan ini menyatakan bahwa:", spacing: { before: 200, after: 100 } }),

    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "BANGUNAN GEDUNG DINYATAKAN LAIK FUNGSI", bold: true, size: 26 })] })],
              shading: { fill: "F0F0F0" },
              verticalAlign: dx.VerticalAlign.CENTER,
              margins: { top: 200, bottom: 200 }
            })
          ]
        })
      ],
      spacing: { after: 200 }
    }),

    new Paragraph({ text: "Sesuai kesimpulan dari analisis dan evaluasi terhadap hasil pemeriksaan dokumen dan pemeriksaan kondisi fisik bangunan gedung sebagaimana termuat dalam Laporan Pemeriksaan Kelaikan Fungsi Bangunan Gedung terlampir.", size: 22, spacing: { after: 150 } }),
    new Paragraph({ text: "Surat pernyataan ini berlaku sepanjang tidak ada perubahan yang dilakukan oleh pemilik atau pengguna terhadap bangunan gedung atau penyebab gangguan lainnya yang dibuktikan kemudian.", size: 22, spacing: { after: 150 } }),
    new Paragraph({ text: "Demikian surat pernyataan ini dibuat dengan penuh tanggung jawab profesional sesuai dengan ketentuan dalam Undang-undang Nomor 2 Tahun 2017 tentang Jasa Konstruksi.", size: 22, spacing: { after: 400 } }),

    new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `${p.kota || 'Bandung'}, ${dateStr}`, size: 23 })] }),
    // Director Signature Block (Standard BSN - Centered Design)
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: dx.TableBorders.NONE,
      rows: [
        new TableRow({
          children: [
            // Left Cell: Materai Placeholder (BSN Standard position)
            new TableCell({
              width: { size: 30, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({ text: "MATERAI", size: 16, bold: true, color: "64748b" }),
                    new dx.Break(),
                    new TextRun({ text: "ELEKTRONIK", size: 12, color: "64748b" }),
                    new dx.Break(),
                    new TextRun({ text: "10.000", size: 12, bold: true, color: "94a3b8" }),
                  ],
                  spacing: { before: 400, after: 400 },
                  border: { 
                    top: { style: BorderStyle.DASHED, size: 1, color: "64748b" },
                    bottom: { style: BorderStyle.DASHED, size: 1, color: "64748b" },
                    left: { style: BorderStyle.DASHED, size: 1, color: "64748b" },
                    right: { style: BorderStyle.DASHED, size: 1, color: "64748b" },
                  }
                })
              ],
              verticalAlign: dx.VerticalAlign.CENTER
            }),
            // Right Cell: TTE & Name Stack (Centered within Right align)
            new TableCell({
              width: { size: 70, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: (s.consultant?.name || "NAMA PERUSAHAAN").toUpperCase(), bold: true, size: 23 })],
                  spacing: { after: 200 }
                }),
                directorQrBuffer ? new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new ImageRun({ data: directorQrBuffer, transformation: { width: 60, height: 60 } })
                  ],
                  spacing: { after: 100 }
                }) : new Paragraph({}),
                directorSigBuffer ? new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new ImageRun({ data: directorSigBuffer, transformation: { width: 100, height: 50 }, floating: {
                        horizontalPosition: { offset: 400000 }, 
                        verticalPosition: { offset: 200000 },
                        wrap: { type: dx.TextWrappingType.SQUARE },
                    } })
                  ],
                  spacing: { after: 100 }
                }) : new Paragraph({ spacing: { before: 400 } }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({ text: (s.consultant?.director_name || "NAMA DIREKTUR").toUpperCase(), bold: true, size: 22, underline: { type: dx.UnderlineType.SINGLE } }),
                    new dx.Break(),
                    new TextRun({ text: s.consultant?.director_job || "Direktur", size: 18 }),
                    new dx.Break(),
                    new TextRun({ text: "Scan untuk Verifikasi Digital (Direktur)", size: 11, italic: true, color: "888888" }),
                  ],
                  spacing: { before: 100 }
                })
              ],
              verticalAlign: dx.VerticalAlign.CENTER
            })
          ]
        })
      ],
      spacing: { after: 400 }
    }),

    // 3 Column Signature Table
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: dx.TableBorders.NONE,
      rows: [
        new TableRow({
          children: experts_data.map(ex => createSigCell(dx, ex.role, ex.name, ex.skk, ex.sig, ex.qr))
        })
      ]
    })
  ];

  return children;
}

async function buildOwnerDoc(p, dx) {
  // Keeping owner simple but matched style
  const { Paragraph, TextRun, AlignmentType, HeadingLevel, Table, TableRow, TableCell, BorderStyle, WidthType } = dx;
  const dateStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: "SURAT PERNYATAAN PEMILIK / PENGELOLA", bold: true, size: 26 }),
        new dx.Break(),
        new TextRun({ text: "TENTANG KESEDIAAN MEMELIHARA BANGUNAN GEDUNG", bold: true, size: 22 }),
      ],
      spacing: { after: 600 }
    }),
    new Paragraph({ text: "Yang bertanda tangan di bawah ini:", spacing: { after: 200 } }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: dx.TableBorders.NONE,
      rows: [
        createDataRow(dx, "Nama Pemilik", p.pemilik || "____________________"),
        createDataRow(dx, "Nomor Identitas", p.ktp_pemilik || "____________________"),
        createDataRow(dx, "Alamat", p.alamat_pemilik || "____________________"),
      ],
    }),
    new Paragraph({ text: "Adalah selaku pemilik/pengelola bangunan gedung yang berlokasi di:", spacing: { before: 200, after: 200 } }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: dx.TableBorders.NONE,
      rows: [
        createDataRow(dx, "Nama Bangunan", p.nama_bangunan),
        createProjectDetailRow(dx, "", "Alamat Bangunan", p.alamat || "-"),
      ],
    }),
    new Paragraph({ 
      text: "Dengan ini menyatakan bahwa saya akan memelihara dan merawat bangunan gedung tersebut sesuai dengan standar teknis dan peruntukannya, serta menjamin kebenaran seluruh dokumen yang disampaikan dalam permohonan SLF melalui sistem SIMBG.",
      spacing: { before: 300, after: 150 } 
    }),
    new Paragraph({ 
      text: "Apabila dikemudian hari ditemukan ketidakbenaran atas pernyataan ini, saya bersedia mempertanggungjawabkannya sesuai ketentuan hukum yang berlaku.",
      spacing: { after: 800 } 
    }),
    new Paragraph({ alignment: AlignmentType.RIGHT, text: `${p.kota || 'Bandung'}, ${dateStr}` }),
    new Paragraph({ alignment: AlignmentType.RIGHT, text: "Pemilik Bangunan,", bold: true, spacing: { after: 1000 } }),
    new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: (p.pemilik || "NAME").toUpperCase(), bold: true, underline: {} })] }),
  ];
}

function createMetaRow(dx, label, value) {
  return new dx.Paragraph({
    children: [
      new dx.TextRun({ text: label, size: 23 }),
      new dx.TextRun({ text: "\t: ", size: 23 }),
      new dx.TextRun({ text: value, size: 23 }),
    ],
    tabStops: [{ type: dx.TabStopType.LEFT, position: 1000 }],
  });
}

function createDataRow(dx, label, value) {
  return new dx.TableRow({
    children: [
      new dx.TableCell({ children: [new dx.Paragraph({ text: label, size: 22 })], width: { size: 35, type: dx.WidthType.PERCENTAGE } }),
      new dx.TableCell({ children: [new dx.Paragraph({ text: ":" })], width: { size: 2, type: dx.WidthType.PERCENTAGE } }),
      new dx.TableCell({ children: [new dx.Paragraph({ text: value || "-" })], width: { size: 63, type: dx.WidthType.PERCENTAGE } }),
    ],
  });
}

function createExpertRow(dx, num, label, name, skk) {
  return new dx.TableRow({
    children: [
      new dx.TableCell({ children: [new dx.Paragraph({ text: num })], width: { size: 5, type: dx.WidthType.PERCENTAGE } }),
      new dx.TableCell({ 
        children: [
          new dx.Paragraph({ children: [new dx.TextRun({ text: label, bold: true })] }),
          new dx.Paragraph({ text: `a) Nama\t: ${name || '____________________'}`, tabStops: [{ type: dx.TabStopType.LEFT, position: 1000 }] }),
          new dx.Paragraph({ text: `b) No. SKK\t: ${skk || '____________________'}`, tabStops: [{ type: dx.TabStopType.LEFT, position: 1000 }] }),
        ], 
        width: { size: 95, type: dx.WidthType.PERCENTAGE } 
      }),
    ],
  });
}

function createProjectDetailRow(dx, num, label, value) {
  return new dx.TableRow({
    children: [
      new dx.TableCell({ children: [new dx.Paragraph({ text: num })], width: { size: 5, type: dx.WidthType.PERCENTAGE } }),
      new dx.TableCell({ children: [new dx.Paragraph({ text: label })], width: { size: 30, type: dx.WidthType.PERCENTAGE } }),
      new dx.TableCell({ children: [new dx.Paragraph({ text: ":" })], width: { size: 2, type: dx.WidthType.PERCENTAGE } }),
      new dx.TableCell({ children: [new dx.Paragraph({ text: value || "-" })], width: { size: 63, type: dx.WidthType.PERCENTAGE } }),
    ],
  });
}

function createSigCell(dx, role, name, skk, sigBuffer, qrBuffer) {
  const children = [
    new dx.Paragraph({ alignment: dx.AlignmentType.CENTER, children: [new dx.TextRun({ text: role, bold: true, size: 18 })] }),
  ];

  if (sigBuffer || qrBuffer) {
    const images = [];
    if (qrBuffer) {
      images.push(new dx.ImageRun({
        data: qrBuffer,
        transformation: { width: 60, height: 60 }
      }));
    }
    if (sigBuffer) {
      images.push(new dx.ImageRun({
        data: sigBuffer,
        transformation: { width: 80, height: 40 },
        floating: qrBuffer ? {
            horizontalPosition: { offset: 400000 }, 
            verticalPosition: { offset: 200000 },
            wrap: { type: dx.TextWrappingType.SQUARE },
        } : undefined
      }));
    }
    children.push(new dx.Paragraph({ alignment: dx.AlignmentType.CENTER, children: images, spacing: { before: 100, after: 100 } }));
  } else {
    children.push(new dx.Paragraph({ alignment: dx.AlignmentType.CENTER, children: [new dx.TextRun({ text: "\n\n\n", size: 20 })] }));
  }

  children.push(new dx.Paragraph({ alignment: dx.AlignmentType.CENTER, children: [new dx.TextRun({ text: (name || "NAME").toUpperCase(), bold: true, size: 20, underline: {} })] }));
  children.push(new dx.Paragraph({ alignment: dx.AlignmentType.CENTER, children: [new dx.TextRun({ text: `No. SKK: ${skk || "-"}`, size: 16 })] }));
  children.push(new dx.Paragraph({ alignment: dx.AlignmentType.CENTER, children: [new dx.TextRun({ text: "Scan untuk Verifikasi Digital", size: 12, italic: true, color: "666666" })] }));

  return new dx.TableCell({
    width: { size: 33, type: dx.WidthType.PERCENTAGE },
    children: children,
    verticalAlign: dx.VerticalAlign.CENTER
  });
}

async function getImageData(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.arrayBuffer();
  } catch (e) {
    return null;
  }
}
