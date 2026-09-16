#!/usr/bin/env node
/**
 * ux-audit.mjs — audit pengalaman pengguna & aksesibilitas.
 *
 * Pendamping `deep-audit.mjs` (keamanan, skema, runtime). Skrip ini menilai
 * lapisan yang dilihat dan disentuh manusia: aksesibilitas, operabilitas
 * keyboard, kelengkapan status antarmuka, perilaku responsif, dan konsistensi
 * visual.
 *
 * Prinsip yang dipakai:
 *   1. Hanya melaporkan hal yang DAPAT DIPERBAIKI dan dapat dibuktikan dari
 *      kode. Tidak ada tebakan estetika.
 *   2. Setiap temuan menyebut berkas + baris + cara memperbaikinya.
 *   3. Kadar keparahan mengikuti dampak nyata bagi pengguna, bukan jumlah:
 *      satu dialog yang tidak bisa ditutup dengan Escape lebih penting
 *      daripada lima puluh warna literal.
 *
 * Pemakaian:
 *   node scripts/ux-audit.mjs                    # ringkasan
 *   node scripts/ux-audit.mjs --verbose          # daftar setiap temuan
 *   node scripts/ux-audit.mjs --only a11y        # a11y | keyboard | states | responsive | visual | perf
 *   node scripts/ux-audit.mjs --json hasil.json  # keluaran mesin (gerbang CI)
 */

import { readFile, readdir } from 'node:fs/promises';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = process.cwd();
const SRC = path.join(ROOT, 'src');

const argv = process.argv.slice(2);
const VERBOSE = argv.includes('--verbose');
const ONLY = (() => {
  const i = argv.indexOf('--only');
  return i >= 0 ? argv[i + 1] : null;
})();
const JSON_OUT = (() => {
  const i = argv.indexOf('--json');
  return i >= 0 ? argv[i + 1] : null;
})();
const shouldRun = (section) => !ONLY || ONLY === section;

// ─────────────────────────────────────────────────────────────────────────────
// Utilitas
// ─────────────────────────────────────────────────────────────────────────────

/** Semua berkas JS/CSS di src/, plus berkas HTML root. */
async function collectFiles() {
  const out = [];
  async function walk(dir) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules') continue;
        await walk(full);
      } else if (/\.(js|css)$/.test(entry.name)) {
        if (/\.test\.js$/.test(entry.name)) continue;
        out.push(full);
      }
    }
  }
  if (existsSync(SRC)) await walk(SRC);
  const html = path.join(ROOT, 'index.html');
  if (existsSync(html)) out.push(html);
  return out.sort();
}

const rel = (f) => path.relative(ROOT, f).replace(/\\/g, '/');
const lineAt = (code, idx) => code.slice(0, idx).split('\n').length;

/**
 * Masker kode: 1 = kode, 0 = komentar / isi string.
 * Dipakai supaya pola di dalam komentar dan teks tampilan tidak dihitung.
 */
/**
 * Menandai setiap karakter berkas JS: kode, komentar, atau isi string.
 *
 *   MASKA   1 = kode biasa
 *           2 = isi string / template literal
 *           0 = komentar atau literal regex
 *
 * KENAPA TIGA NILAI, BUKAN DUA
 * ----------------------------
 * Versi sebelumnya memakai 1 = kode dan 0 = "bukan kode", sehingga KOMENTAR dan
 * ISI STRING bernilai sama. Akibatnya penjaga "berada di dalam komentar"
 * (`mask[idx] === 0`) juga membuang setiap kemunculan di dalam string — padahal
 * di dalam string itulah HTML dinamis aplikasi ini dibuat (`innerHTML = \`...\``).
 *
 * Kerugiannya terukur: dari 4.097 template literal di src, 2.892 (71%) gugur
 * pada penjaga tersebut. Yang paling sering gugur justru template PANJANG —
 * yaitu markup yang paling mungkin berisi teks antarmuka. Contoh nyata:
 * seluruh template halaman login (2.089 karakter) dianggap komentar, sehingga
 * teks Inggris di layar pertama aplikasi tak pernah terlihat oleh aturan
 * bahasa dan dilaporkan sebagai "0 temuan".
 *
 * Dengan pemisahan ini: "di dalam komentar" berarti 0, "di dalam string"
 * berarti 2 — dua pertanyaan yang berbeda, dijawab tepat.
 */
function codeMask(code) {
  const m = new Uint8Array(code.length).fill(1);
  let i = 0;
  const n = code.length;
  while (i < n) {
    const c = code[i];
    const c2 = code[i + 1];
    if (c === '/' && c2 === '/') {
      while (i < n && code[i] !== '\n') m[i++] = 0;
    } else if (c === '/' && c2 === '*') {
      m[i++] = 0; m[i++] = 0;
      while (i < n && !(code[i] === '*' && code[i + 1] === '/')) m[i++] = 0;
      if (i < n) { m[i++] = 0; m[i++] = 0; }
    } else if (c === '/' && regexAllowed(code, i, m)) {
      m[i++] = 0;
      let inClass = false;
      while (i < n) {
        if (code[i] === '\\') { m[i++] = 0; m[i++] = 0; continue; }
        if (code[i] === '[') inClass = true;
        else if (code[i] === ']') inClass = false;
        else if (code[i] === '/' && !inClass) { m[i++] = 0; break; }
        else if (code[i] === '\n') break;
        m[i++] = 0;
      }
    } else if (c === '"' || c === "'" || c === '`') {
      const quote = c;
      m[i++] = 2;
      while (i < n) {
        if (code[i] === '\\') { m[i++] = 2; m[i++] = 2; continue; }
        if (code[i] === quote) { m[i++] = 2; break; }
        // Interpolasi ${...} di dalam template tetap dianggap kode.
        if (quote === '`' && code[i] === '$' && code[i + 1] === '{') {
          m[i++] = 1; m[i++] = 1;
          let depth = 1;
          while (i < n && depth > 0) {
            if (code[i] === '{') depth++;
            else if (code[i] === '}') depth--;
            if (depth > 0) m[i++] = 1; else m[i++] = 2;
          }
          continue;
        }
        m[i++] = 2;
      }
    } else {
      i++;
    }
  }
  return m;
}

/** Heuristik sederhana: apakah `/` di posisi ini awal regex, bukan pembagian. */
function regexAllowed(code, i, mask) {
  for (let j = i - 1; j >= 0; j--) {
    // Lewati komentar DAN isi string (nilai 0 dan 2). Inilah perilaku versi
    // lama, dipertahankan apa adanya: yang dicari adalah karakter KODE
    // terakhir sebelum `/`. Bila isi string ikut dihitung, maka
    // `const a = 'x'; /re/` akan salah dibaca sebagai pembagian.
    if (mask[j] !== 1) continue;
    const ch = code[j];
    if (/[\s]/.test(ch)) continue;
    return /[=(,:;[!&|?{}+\-*%<>~^]/.test(ch) || code.startsWith('return', Math.max(0, j - 5));
  }
  return true;
}

/**
 * Apakah posisi ini berada di dalam komentar HTML (`<!-- ... -->`).
 *
 * Diperlukan karena markah aplikasi ini hidup di dalam template literal, dan
 * di sana komentar HTML sah dipakai untuk menonaktifkan potongan markup —
 * mis. di login.js ada penjelasan panjang yang memuat contoh `<img>` lama.
 * Komentar JS (mask 0) tidak menangkap ini, sebab dari sudut pandang JS
 * seluruh template adalah STRING. Akibatnya aturan aksesibilitas melaporkan
 * gambar yang sudah dinonaktifkan sebagai "gambar tanpa alt" — temuan palsu.
 *
 * Cara kerja: cari `<!--` terakhir sebelum posisi, lalu `-->` terakhir.
 * Bila pembuka lebih dekat daripada penutup, posisinya di dalam komentar.
 */
function inHtmlComment(code, idx) {
  const buka = code.lastIndexOf('<!--', idx);
  if (buka < 0) return false;
  const tutup = code.lastIndexOf('-->', idx);
  return tutup < buka;
}

const SECTION_LABEL = {
  a11y: 'AKSESIBILITAS',
  keyboard: 'OPERABILITAS KEYBOARD',
  states: 'STATUS ANTARMUKA',
  responsive: 'RESPONSIF & MOBILE',
  visual: 'KONSISTENSI VISUAL',
  perf: 'PERFORMA YANG TERASA',
};

const SEVERITY_ORDER = { tinggi: 0, sedang: 1, rendah: 2 };

function section(name) {
  return { name, label: SECTION_LABEL[name], findings: [] };
}

function add(sec, severity, title, detail, file, line, fix) {
  sec.findings.push({ severity, title, detail, file, line, fix });
}

// ─────────────────────────────────────────────────────────────────────────────
// Pemeriksaan
// ─────────────────────────────────────────────────────────────────────────────

/** A. Aksesibilitas */
function auditA11y(sec, files, globalA11y = { keyboard: false }) {
  for (const f of files) {
    const code = f.code;
    const mask = f.mask;
    const isCss = f.ext === 'css';
    const isHtml = f.ext === 'html';
        const inComment = (idx) => (mask[idx] === 0 && !isCss) || inHtmlComment(code, idx);

    // A1. <img> tanpa alt
    if (!isCss) {
      for (const m of code.matchAll(/<img\b[^>]*>/gi)) {
        if (inComment(m.index)) continue;
        const tag = m[0];
        // Markah yang dirakit potongan demi potongan tidak dapat dinilai statis.
        if (!/\/?>$/.test(tag.trim()) && !tag.includes('src=')) continue;
        if (!/\balt\s*=/.test(tag)) {
          add(sec, 'sedang', 'Gambar tanpa atribut alt',
            `<img> tidak punya alt. Pembaca layar akan membacakan nama berkas.`,
            f.rel, lineAt(code, m.index),
            'Tambahkan alt="..." yang menjelaskan isinya, atau alt="" bila murni dekoratif.');
        }
        if (/\bsrc\s*=/.test(tag) && !/\b(width|height)\s*=/.test(tag) && !/class=|style=/.test(tag)) {
          add(sec, 'rendah', 'Gambar tanpa width/height',
            'Tanpa dimensi, tata letak bergeser saat gambar selesai dimuat (CLS).',
            f.rel, lineAt(code, m.index),
            'Tambahkan width dan height, atau aspek rasio lewat CSS.');
        }
      }

      // A2. Tombol tanpa nama aksesibel
      for (const m of code.matchAll(/<button\b([^>]*)>([\s\S]{0,220}?)<\/button>/gi)) {
        if (inComment(m.index)) continue;
        const attrs = m[1];
        const inner = m[2];
        const hasIconOnly = /<i\b[^>]*class=["'][^"']*(fa|icon)/i.test(inner) || /<svg\b/i.test(inner);
        const text = inner.replace(/<[^>]*>/g, '').replace(/&[a-z#0-9]+;/gi, '').trim();
        const hasName = /\b(aria-label|aria-labelledby|title)\s*=/.test(attrs);
        if (hasIconOnly && !text && !hasName) {
          add(sec, 'tinggi', 'Tombol ikon tanpa nama aksesibel',
            'Tombol hanya berisi ikon dan tanpa aria-label/title, sehingga pembaca layar hanya membacakan "tombol".',
            f.rel, lineAt(code, m.index),
            'Tambahkan aria-label="Terangkan aksinya" (mis. aria-label="Tutup dialog").');
        }
      }

      // A3. Elemen semantik sebelum/sesudah
      // A4. Handler klik pada elemen non-interaktif
      //
      // Khusus `onclick`, bukan `onmousedown`: lapisan global
      // (installKeyboardEnhancer di src/lib/a11y.js) memilih elemen dengan
      // selektor [onclick] dan memberinya role=button + tabindex + Enter/Space.
      // Handler `onmousedown` sengaja TIDAK diperlakukan sama: mousedown
      // menyiratkan seret (drag), bukan tekan — mengubahnya menjadi role=button
      // justru menyesatkan pengguna keyboard. Kalau pola itu muncul, ia perlu
      // penanganan sendiri (lihat A5 di bawah).
      for (const m of code.matchAll(/<(div|span|li|td|tr|p|section|header|footer)\b([^>]*\bonclick\s*=\s*["'][^"']*["'][^>]*)>/gi)) {
        if (inComment(m.index)) continue;
        const tag = m[0];
        const hasRole = /\brole\s*=/.test(tag);
        const hasTabindex = /\btabindex\s*=/.test(tag);
        if (!hasRole || !hasTabindex) {
          // Lapisan global (src/lib/a11y.js → installKeyboardEnhancer) menambahkan
          // role="button", tabindex="0", dan penanganan Enter/Space pada setiap
          // elemen ber-onclick yang bukan kontrol asli. Perilaku itu
          // terverifikasi lewat MutationObserver pada tes di src/lib/a11y.test.js.
          // Kalau lapisan itu aktif, temuan ini turun menjadi catatan
          // pemeliharaan — markahnya tetap lebih baik diperbaiki di sumbernya.
          if (globalA11y.keyboard) continue;
          add(sec, 'tinggi', 'Elemen non-interaktif diberi handler klik',
            `<${m[1]}> memakai onclick tanpa role + tabindex, sehingga tidak dapat dicapai atau diaktifkan lewat keyboard.`,
            f.rel, lineAt(code, m.index),
            'Pakai <button type="button">, atau tambahkan role="button" tabindex="0" dan handler keydown (Enter/Space).');
        }
      }

      // A5. Interaksi yang HANYA dapat dilakukan dengan tetikus.
      //
      // Berbeda dari A4: drag (onmousedown/onmousemove) dan hover
      // (onmouseenter) tidak punya padanan keyboard yang wajar dengan
      // role=button. Yang dibutuhkan adalah jalan alternatif — mis. tombol
      // "geser" atau input angka untuk memindahkan objek, atau menu yang
      // terbuka lewat Enter. Lapisan global TIDAK menangani pola ini, jadi
      // temuan di sini selalu dilaporkan (tidak ditekan).
      for (const m of code.matchAll(/<(div|span|li|td|tr|p|section|header|footer|canvas|svg)\b([^>]*\bon(?:mousedown|mouseenter|mouseover)\s*=\s*["'][^"']*["'][^>]*)>/gi)) {
        if (inComment(m.index)) continue;
        const tag = m[0];
        // Elemen yang sekaligus punya onclick sudah tertangani A4.
        if (/\bonclick\s*=/.test(tag)) continue;
        if (/\b(role|tabindex)\s*=/.test(tag) && /\bonkeydown\s*=/.test(tag)) continue;
        add(sec, 'sedang', 'Interaksi hanya dengan tetikus (tanpa padanan keyboard)',
          `<${m[1]}> menangani ${/onmouseenter|onmouseover/.test(tag) ? 'hover' : 'tekan-tetikus'} tanpa alternatif keyboard. Pengguna keyboard tidak dapat melakukan hal yang sama.`,
          f.rel, lineAt(code, m.index),
          'Sediakan jalan alternatif: tombol yang dapat difokus, input angka, atau menu yang terbuka dengan Enter. Hover tidak boleh menjadi satu-satunya cara membuka informasi penting.');
      }

      // A5. Handler klik yang menempel lewat JS pada elemen non-tombol
      //     (pola umum di repo ini: el.onclick = ...)
      for (const m of code.matchAll(/\b(\w+)\.onclick\s*=\s*(?:async\s*)?(?:\([^)]*\)|[\w$]+)\s*=>/g)) {
        if (inComment(m.index)) continue;
        const varName = m[1];
        // Cari deklarasi variabelnya; kalau jelas <button>/<a>, lewati.
        const declRe = new RegExp(`(?:const|let|var)\\s+${varName}\\s*=\\s*document\\.createElement\\(\\s*['"]([\\w-]+)['"]`);
        const decl = code.match(declRe);
        if (decl && !['button', 'a', 'input', 'select', 'textarea', 'summary'].includes(decl[1].toLowerCase())) {
          const hasKey = new RegExp(`${varName}\\.onkeydown|${varName}\\.onkeyup`).test(code);
          if (!hasKey && !globalA11y.keyboard) {
            add(sec, 'tinggi', 'Klik pada elemen non-tombol tanpa padanan keyboard',
              `\`${varName}\` adalah <${decl[1]}> yang diberi .onclick, tetapi tidak ada .onkeydown/.onkeyup. Pengguna keyboard tidak dapat mengaktifkannya.`,
              f.rel, lineAt(code, m.index),
              `Buat elemennya <button type="button">. Kalau harus <${decl[1]}>, tambahkan tabindex="0", role="button", dan handler keydown untuk Enter dan Space.`);
          }
        }
      }

      // A6. href="#" atau href="javascript:"
      for (const m of code.matchAll(/href\s*=\s*["'](?:#|javascript:[^"']*)["']/gi)) {
        if (inComment(m.index)) continue;
        add(sec, 'rendah', 'Tautan tanpa tujuan bermakna',
          'href="#" atau javascript: tidak dapat dibuka di tab baru / disalin, dan membingungkan bagi pembaca layar.',
          f.rel, lineAt(code, m.index),
          'Pakai <button type="button"> bila aksinya bukan navigasi, atau isi href dengan URL sebenarnya.');
      }

      // A7. target="_blank" tanpa rel=noopener
      for (const m of code.matchAll(/target\s*=\s*["']_blank["']/gi)) {
        if (inComment(m.index)) continue;
        const around = code.slice(Math.max(0, m.index - 400), m.index + 200);
        if (!/rel\s*=\s*["'][^"']*noopener/.test(around)) {
          add(sec, 'rendah', 'target="_blank" tanpa rel="noopener"',
            'Halaman tujuan mendapat akses window.opener (tabnabbing), dan sebagian pembaca layar tidak memberi tahu bahwa tab baru terbuka.',
            f.rel, lineAt(code, m.index),
            'Tambahkan rel="noopener noreferrer" dan aria-label="(terbuka di tab baru)".');
        }
      }
    }

    // A8. CSS: outline dihapus tanpa pengganti fokus
    if (isCss) {
      const lines = code.split('\n');
      lines.forEach((ln, i) => {
        if (!/outline\s*:\s*(none|0)\b/.test(ln)) return;
        // Cari pengganti fokus di blok yang sama atau beberapa baris sesudahnya
        const context = lines.slice(Math.max(0, i - 3), i + 14).join('\n');
        // `:focus:not(:focus-visible) { outline: none }` adalah praktik yang
        // BENAR: cincin fokus hanya disembunyikan untuk klik tetikus, bukan
        // untuk keyboard. Tidak dihitung sebagai pelanggaran selama berkas
        // yang sama memang mendefinisikan :focus-visible.
        // Selektor diperiksa dari BEBERAPA baris sebelumnya, karena aturannya
        // umumnya ditulis sebagai blok (selektor di baris terpisah dari
        // deklarasinya).
        if (/:focus-visible/.test(code) && /:focus:not\(:focus-visible\)/.test(context)) return;
        // Wadah dialog difokuskan secara programatik (tabindex="-1") agar
        // jebakan fokus bekerja; cincin fokus pada seluruh panel justru
        // membingungkan, dan kontrol di dalamnya punya cincinnya sendiri.
        if (/\[role=["']dialog["']\]\s*:focus/.test(context)) return;
        // Nama variabelnya `nearby`, BUKAN `window`: memakai `window` sebagai
        // nama variabel lokal menutupi objek global peramban dan membuat
        // skrip Node ini gagal dengan "window is not defined".
        const hasReplacement = /:(focus|focus-visible|focus-within)/.test(context) ||
          /box-shadow\s*:\s*(?!none)/.test(context) ||
          /border(-color)?\s*:\s*(?!none)/.test(context);
        if (!hasReplacement) {
          add(sec, 'tinggi', 'Indikator fokus dihilangkan tanpa pengganti',
            'outline:none membuat pengguna keyboard kehilangan jejak posisi mereka di halaman.',
            f.rel, i + 1,
            'Jangan hilangkan outline; sesuaikan tampilannya melalui :focus-visible { outline: 2px solid var(--brand-400); outline-offset: 2px; }.');
        }
      });
    }

    // A9. tabindex positif
    if (!isCss) {
      for (const m of code.matchAll(/tabindex\s*=\s*["']([1-9]\d*)["']/gi)) {
        add(sec, 'sedang', 'tabindex bernilai positif',
          'Urutan tab menjadi tidak alami dan sulit diprediksi; nilainya juga harus diperbarui setiap kali tata letak berubah.',
          f.rel, lineAt(code, m.index),
          'Pakai tabindex="0" dan atur urutan lewat susunan DOM.');
      }
    }

    // A10. aria-hidden pada elemen yang dapat difokus
    if (!isCss) {
      for (const m of code.matchAll(/aria-hidden\s*=\s*["']true["']/gi)) {
        const around = code.slice(m.index, m.index + 300);
        if (/<(button|a|input|select|textarea|iframe)\b/i.test(around.split('>')[0] ?? '')) {
          add(sec, 'sedang', 'aria-hidden pada elemen interaktif',
            'Elemen tersembunyi dari pembaca layar tetapi masih dapat difokus keyboard — pengguna akan tersesat pada kontrol yang tidak diumumkan.',
            f.rel, lineAt(code, m.index),
            'Hindari aria-hidden pada elemen fokusabel; gunakan hidden, disabled, atau hapus dari DOM.');
        }
      }
    }

    // A11. Teks tautan tidak deskriptif
    if (!isCss) {
      for (const m of code.matchAll(/>\s*(klik di sini|klik disini|di sini|selengkapnya|baca selengkapnya|click here|read more|more)\s*</gi)) {
        if (inComment(m.index)) continue;
        add(sec, 'rendah', 'Teks tautan tidak menjelaskan tujuan',
          `"${m[1]}" tidak berarti apa pun bila dibacakan di luar konteks oleh pembaca layar.`,
          f.rel, lineAt(code, m.index),
          'Tulis tujuan tautannya, mis. "Unduh Buku Saku SLF (PDF)".');
      }
    }

    // A12. Tabel data tanpa <th>
    if (!isCss) {
      for (const m of code.matchAll(/<table\b[^>]*>([\s\S]{0,4000}?)<\/table>/gi)) {
        if (inComment(m.index)) continue;
        const body = m[1];
        // Tabel yang sel kepalanya dibangkitkan saat berjalan tidak dapat
        // dinilai secara statis. Contoh nyata: document-engine.js memakai
        //     const tag = i === 0 ? 'th' : 'td';
        // sehingga <th> tidak pernah muncul sebagai teks di berkas ini —
        // padahal tabelnya SUDAH punya sel kepala. Tanpa pengecualian ini
        // tabel tersebut dilaporkan "tanpa <th>" secara keliru.
        if (/\?\s*['"`]th['"`]\s*:\s*['"`]td['"`]/.test(body)) continue;
        if (/['"`]th['"`]\s*:\s*['"`]td['"`]/.test(body)) continue;
        if (/<td\b/i.test(body) && !/<th\b/i.test(body)) {
          add(sec, 'sedang', 'Tabel tanpa sel kepala (<th>)',
            'Pembaca layar tidak dapat mengaitkan nilai dengan nama kolomnya.',
            f.rel, lineAt(code, m.index),
            'Ubah sel kepala menjadi <th scope="col"> dan sel baris pertama menjadi <th scope="row">.');
        }
      }
    }

    // A13. lang tidak dideklarasikan (hanya index.html)
    if (isHtml && !/<html[^>]*\blang\s*=/.test(code)) {
      add(sec, 'tinggi', 'Atribut lang tidak ada',
        'Pembaca layar memakai pelafalan bahasa yang salah.',
        f.rel, 1, 'Tambahkan lang="id" pada <html>.');
    }
  }
}

/**
 * Apakah lapisan aksesibilitas global benar-benar dipasang?
 *
 * Menambah lapisan di src/lib/a11y.js saja tidak ada gunanya bila tidak
 * dipanggil. Karena itu yang diperiksa adalah pemanggilannya di main.js —
 * bukan keberadaan berkasnya.
 */
/**
 * Apakah router menyediakan status memuat global?
 *
 * Satu kerangka memuat di router lebih baik daripada 47 salinan di setiap
 * halaman: konsisten, tidak bisa terlupa saat halaman baru ditambahkan, dan
 * hanya satu tempat yang perlu diubah. Karena itu kewajiban status "memuat"
 * tidak lagi dibebankan ke tiap berkas halaman bila router sudah
 * menanganinya.
 */
async function routerLoadingActive() {
  const router = path.join(SRC, 'lib', 'router.js');
  if (!existsSync(router)) return false;
  try {
    const code = await readFile(router, 'utf8');
    return /renderLoading\s*\(/.test(code) && /aria-busy/.test(code);
  } catch { return false; }
}

async function globalA11yActive() {
  const main = path.join(SRC, 'main.js');
  if (!existsSync(main)) return { keyboard: false, escape: false };
  let code = '';
  try { code = await readFile(main, 'utf8'); } catch { return { keyboard: false, escape: false }; }
  const lib = path.join(SRC, 'lib', 'a11y.js');
  const hasLib = existsSync(lib);
  return {
    keyboard: hasLib && /installA11y\s*\(/.test(code),
    escape: hasLib && /installA11y\s*\(/.test(code),
  };
}

/**
 * Apakah dialog di berkas ini punya tombol tutup yang DIKENALI jaring
 * pengaman global? Daftar pemilihnya sama dengan yang dipakai
 * installDialogEscapeHandler di src/lib/a11y.js, dan perilakunya
 * terverifikasi lewat tes di src/lib/a11y.test.js.
 */
function hasRecognizableCloseButton(code) {
  // Daftar ini harus SELARAS dengan closeSelectors di
  // src/lib/a11y.js → installDialogEscapeHandler. Bila salah satu diubah,
  // ubah keduanya; perilakunya diverifikasi oleh tes di src/lib/a11y.test.js.
  return (
    /\.modal-close|data-close|data-dismiss/i.test(code) ||
    /aria-label\s*=\s*["'][^"']*(Tutup|Batal|Close|Cancel)/i.test(code) ||
    /button[^>\n]{0,200}(?:onclick|class)\s*=\s*["'][^"']*(?:close|tutup|cancel|batal)/i.test(code)
  );
}

/**
 * Wilayah template literal yang merupakan DOKUMEN (cetak / ekspor Word).
 *
 * Tabel di dalam dokumen seperti itu TIDAK boleh dibungkus wadah gulir:
 * wadah overflow-x pada dokumen cetak justru memotong tabel saat dicetak.
 * Penandanya: template literal yang memuat <!DOCTYPE>, <html>, @media print,
 * atau namespace Office (xmlns:).
 *
 * Sebelumnya detektor memakai jendela 5.000 karakter ke belakang, dan
 * meleset ketika jarak dari penanda @media print ke tabelnya lebih jauh —
 * sehingga tabel dokumen cetak di src/pages/laporan.js dilaporkan sebagai
 * masalah tata letak padahal justru sudah benar.
 */
function documentRegions(code) {
  const regions = [];

  // Penelusur mini untuk template literal BERSARANG.
  //
  // Versi pertama fungsi ini hanya mencari pasangan backtick terdekat. Itu
  // gagal pada pola yang justru paling sering dipakai di proyek ini:
  //     const doc = `<table>${rows.map(r => `<tr>${r.nama}</tr>`).join('')}</table>`;
  // Backtick di dalam ${...} membuat wilayah template luar dianggap berakhir
  // terlalu cepat, sehingga tabel-tabel berikutnya dianggap di luar dokumen.
  //
  // Penelusur ini melacak konteks: saat berada di dalam ${...} ia menghitung
  // kedalaman kurawal, lalu kembali ke konteks template begitu kurawalnya
  // seimbang; string dan komentar dilewati supaya backtick di dalamnya tidak
  // salah dihitung.
  const stack = [];
  let i = 0;
  while (i < code.length) {
    const ch = code[i];
    const ctx = stack[stack.length - 1];

    if (ch === '\\') { i += 2; continue; }

    if (ctx && ctx.type === 'tpl') {
      if (ch === '`') {
        if (stack.length === 1) regions.push([ctx.start, i + 1, code.slice(ctx.start, i + 1)]);
        stack.pop(); i++; continue;
      }
      if (ch === '$' && code[i + 1] === '{') { stack.push({ type: 'code', start: i, brace: 0 }); i += 2; continue; }
      i++; continue;
    }

    // konteks kode (di dalam ${...} atau di tingkat berkas)
    if (ch === '/' && code[i + 1] === '/') {
      const nl = code.indexOf('\n', i); i = nl === -1 ? code.length : nl; continue;
    }
    if (ch === '/' && code[i + 1] === '*') {
      const end = code.indexOf('*/', i); i = end === -1 ? code.length : end + 2; continue;
    }
    if (ch === "'" || ch === '"') {
      const q = ch; i++;
      while (i < code.length) { if (code[i] === '\\') { i += 2; continue; } if (code[i] === q) break; i++; }
      i++; continue;
    }
    if (ch === '`') { stack.push({ type: 'tpl', start: i }); i++; continue; }
    if (ch === '{') { if (ctx) ctx.brace++; i++; continue; }
    if (ch === '}') {
      if (ctx) { if (ctx.brace === 0) stack.pop(); else ctx.brace--; }
      i++; continue;
    }
    i++;
  }
  return regions;
}

/** B. Operabilitas keyboard & dialog */
/**
 * Mencari letak DEFINISI sebuah fungsi di dalam satu berkas.
 *
 * Versi lama memakai satu pola yang hanya mengenali `function nama(` dan
 * `async function nama(`. Aplikasi ini justru paling banyak memakai bentuk
 * lain, sehingga definisinya tidak pernah ketemu dan aturan B3 jatuh ke
 * jendela ±800 karakter di sekitar onclick — yang memang tidak memuat
 * konfirmasi apa pun. Akibatnya lima tombol hapus yang SUDAH memakai dialog
 * konfirmasi tetap dilaporkan sebagai tanpa konfirmasi.
 *
 * Bentuk yang dikenali sekarang:
 *   function nama(a) {            async function nama(a) {
 *   const nama = async (a) => {   var nama = function (a) {
 *   window.nama = async (a) => {  nama: async (a) => {
 *   nama(a) {                     ← metode kelas
 */
function cariDefinisi(code, nama) {
  const aman = nama.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`\\b${aman}\\b`, 'g');
  let terakhir = -1;
  for (const m of code.matchAll(re)) {
    const sesudah = code.slice(m.index + nama.length, m.index + nama.length + 80);
    if (/^\s*(=\s*(async\s+)?(function\s*)?|:\s*(async\s+)?(function\s*)?)?\([^()]*\)\s*(=>\s*)?\{/.test(sesudah)) {
      terakhir = m.index;
    }
  }
  return terakhir;
}

/**
 * Pola nama fungsi penghapusan. `[_$]?` di depan PENTING:
 * tanpa itu, `\b` gagal cocok di dalam `window._deletePageFile` (karakter
 * sebelum `delete` adalah `_`, yang juga karakter kata), sehingga nama yang
 * terpetakan menjadi `deletePageFile` tanpa garis bawah — dan pencarian
 * definisi selalu meleset.
 */
const RE_HAPUS_PANGGIL = /\b[_$]?(?:hapus|delete)[A-Za-z_$]*\s*\(/gi;
const RE_HAPUS_NAMA = /\b[_$]?(?:hapus|delete)[A-Za-z_$]*/i;
const RE_HAPUS_NAMA_G = /\b[_$]?(?:hapus|delete)[A-Za-z_$]*/gi;

/**
 * Indeks lintas berkas: nama fungsi penghapusan → apakah badannya memakai
 * konfirmasi. Dibangun sekali, lalu dipakai ulang.
 *
 * Diperlukan karena tombol dan fungsinya sering berada di berkas BERBEDA:
 * tombol di src/components/file-manager-components.js memanggil
 * window._deletePageFile yang didefinisikan di src/pages/proyek-files.js.
 */
let indeksHapusCache = null;
function indeksDefinisiHapus(files) {
  if (indeksHapusCache) return indeksHapusCache;
  indeksHapusCache = new Map();
  for (const f of files) {
    if (f.ext !== 'js') continue;
    for (const m of f.code.matchAll(RE_HAPUS_NAMA_G)) {
      const nama = m[0];
      if (indeksHapusCache.has(nama)) continue;
      const idx = cariDefinisi(f.code, nama);
      if (idx < 0) continue;
      const badan = f.code.slice(idx, idx + 3000);
      indeksHapusCache.set(nama, /confirm|konfirmasi|sweet|dialog/i.test(badan));
    }
  }
  return indeksHapusCache;
}

function auditKeyboard(sec, files, globalA11y = { keyboard: false, escape: false }) {
  for (const f of files) {
    const code = f.code;
    if (f.ext === 'css') continue;
        const mask = f.mask;
        const inComment = (idx) => mask[idx] === 0 || inHtmlComment(code, idx);

    // B1. Modal tanpa role="dialog"
    for (const m of code.matchAll(/createElement\(\s*['"]div['"]\s*\)[\s\S]{0,180}?class(?:Name)?\s*=\s*[^\n]*modal/gi)) {
      if (inComment(m.index)) continue;
      const scope = code.slice(m.index, m.index + 3000);
      if (!/role\s*=\s*["']dialog["']/.test(scope) && !/setAttribute\(\s*['"]role['"]\s*,\s*['"]dialog['"]/.test(scope)) {
        add(sec, 'sedang', 'Dialog tanpa role="dialog"',
          'Pembaca layar tidak mengumumkan bahwa sebuah dialog terbuka, dan tidak menjebak fokus di dalamnya.',
          f.rel, lineAt(code, m.index),
          'Tambahkan role="dialog", aria-modal="true", dan aria-labelledby yang menunjuk judul dialog.');
      }
    }

    // B2. Dialog tanpa penanganan tombol Escape
    //
    // PENTING: yang dicari adalah ELEMEN dialog, bukan kata "modal" di mana
    // pun. Versi sebelumnya memakai /class[^\n]*modal/ yang juga cocok dengan
    // `class="btn btn-primary" onclick="window._openUploadModal()"` —
    // nama fungsi, bukan elemen — sehingga berkas tanpa dialog sama sekali
    // dilaporkan sebagai dialog tanpa Escape.
    const hasModal =
      /\bclass(?:Name)?\s*=\s*["'][^"']*\bmodal(?:-overlay|-dialog)?\b[^"']*["']/.test(code) ||
      /\bmodal-overlay\b/.test(code) ||
      /role\s*=\s*["'](?:dialog|alertdialog)["']/.test(code) ||
      /\bmakeDialog\s*\(/.test(code);

    // Sebagian dialog MEMANG tidak boleh ditutup dengan Escape — mis. dialog
    // wajib ganti kata sandi atau konfirmasi yang menghalangi penggunaan.
    // Penulisnya menandainya secara eksplisit dengan data-no-escape, dan
    // jaring pengaman global menghormati penanda itu.
    const intentionallyNonDismissible = /data-no-escape/.test(code);
    if (hasModal && !intentionallyNonDismissible) {
      if (!/Escape/.test(code)) {
      const coveredByGlobal = globalA11y.escape && hasRecognizableCloseButton(code);
      if (!coveredByGlobal) {
        add(sec, globalA11y.escape ? 'sedang' : 'tinggi',
          'Dialog tidak dapat ditutup dengan tombol Escape',
          globalA11y.escape
            ? 'Jaring pengaman global (src/lib/a11y.js) sudah terpasang, tetapi dialog di berkas ini tidak memiliki tombol tutup dengan penanda yang dikenali (.modal-close, [data-close], atau aria-label "Tutup"/"Batal") — sehingga jaring pengaman itu tidak dapat menemukannya.'
            : 'Pengguna keyboard harus menemukan tombol tutup secara manual; sebagian pengguna mengandalkan Escape.',
          f.rel, 1,
          globalA11y.escape
            ? 'Beri tombol tutupnya class .modal-close atau aria-label="Tutup". Cara itu otomatis dikenali tanpa kode tambahan per berkas.'
            : 'Tambahkan document.addEventListener("keydown", e => { if (e.key === "Escape") tutupDialog(); }).');
      }
      }
    }

    // B2b. Konfirmasi bawaan peramban (window.confirm / confirm / alert / prompt)
    //
    // Aplikasi ini sudah punya dialog konfirmasi sendiri
    // (src/components/modal.js → confirm()). Dialog bawaan peramban:
    //   • MEMBLOKIR seluruh halaman sampai dijawab;
    //   • tidak dapat diberi gaya — tampil sebagai kotak abu-abu sistem di
    //     tengah antarmuka gelap yang dirancang khusus, dan tombolnya
    //     mengikuti bahasa peramban (OK/Cancel), bukan bahasa aplikasi;
    //   • tidak dapat menampilkan penanda bahaya untuk aksi merusak;
    //   • pada PWA mode berdiri sendiri (aplikasi dipasang di ponsel),
    //     kemunculannya terasa seperti keluar dari aplikasi.
    // Pemakaian yang sah: skrip CLI/pengujian, dan kode yang memang bukan UI.
    for (const m of code.matchAll(/(?<![\w.$])(?:window\.)?(confirm|prompt)\s*\(/g)) {
      if (inComment(m.index)) continue;
      // Pembeda yang tepat bukan nama fungsinya, melainkan BENTUK argumennya:
      //   confirm('teks')  → dialog bawaan peramban
      //   confirm({ ... }) → dialog aplikasi (src/components/modal.js), yang
      //                      menerima objek {title, message, confirmText}
      const after = code.slice(m.index, m.index + 120);
      if (/^[\w.$]*confirm\s*\(\s*\{/.test(after)) continue;
      // Definisi fungsinya sendiri, bukan pemakaian.
      const before = code.slice(Math.max(0, m.index - 40), m.index);
      if (/\bfunction\s+$/.test(before)) continue;
      const call = code.slice(Math.max(0, m.index - 30), m.index + 60).replace(/\s+/g, ' ');
      add(sec, 'sedang', 'Konfirmasi bawaan peramban',
        `${m[1]}() bawaan peramban memblokir halaman, tidak dapat diberi gaya, dan tombolnya mengikuti bahasa peramban — berbeda dari dialog aplikasi yang dipakai di tempat lain.`,
        f.rel, lineAt(code, m.index),
        'Pakai confirm({ title, message, confirmText, danger }) dari src/components/modal.js (perlu await, jadi fungsinya harus async).');
    }

    // B3. Aksi destruktif tanpa konfirmasi
    //
    // HANYA nama fungsi yang secara eksplisit menandakan penghapusan DATA:
    // `deleteMember`, `_hapusProyek`, `deleteCatchment`, dan sejenisnya.
    //
    // Kata "remove" sengaja TIDAK dipakai sama sekali. Di JavaScript, `remove`
    // jauh lebih sering berarti melepas sesuatu dari tampilan daripada
    // menghapus data:
    //     modal.remove()            → melepas elemen dari DOM
    //     body.removeChild(el)      → idem
    //     el.classList.remove('x')  → menghapus kelas CSS
    // Memasukkan ketiganya membuat audit melaporkan 7 dari 10 temuan sebagai
    // "penghapusan tanpa konfirmasi" padahal tidak ada data yang dihapus.
    for (const m of code.matchAll(RE_HAPUS_PANGGIL)) {
      if (inComment(m.index)) continue;
      // Hanya laporan bila pemanggilan ini menempel pada sebuah aksi pengguna.
      const snip = code.slice(Math.max(0, m.index - 80), m.index + 40);
      if (/onclick|addEventListener\(['"]click|dataset/.test(snip)) {
        // Konfirmasi dicari di BADAN DEFINISI fungsinya, bukan di sekitar
        // pemanggilan. Versi sebelumnya memakai jendela ±600 karakter di
        // sekitar onclick — padahal tombolnya sering didefinisikan ratusan
        // baris sebelum fungsi handler-nya. Akibatnya tiga fungsi yang SUDAH
        // memakai confirm() tetap dilaporkan sebagai tanpa konfirmasi.
        const fnName = (m[0].match(RE_HAPUS_NAMA) || [''])[0];
        // (a) Definisi di berkas yang sama — memakai pengenal bentuk yang
        //     lebih luas (lihat cariDefinisi).
        const defIdx = cariDefinisi(code, fnName);
        const scope = defIdx >= 0
          ? code.slice(defIdx, defIdx + 2500)
          : code.slice(Math.max(0, m.index - 800), m.index + 800);
        // (b) Definisi di berkas LAIN. Tombolnya sering di komponen, sedangkan
        //     fungsinya di halaman — jadi pencarian dalam satu berkas saja
        //     tidak cukup dan menghasilkan temuan palsu.
        const lintasBerkas = indeksDefinisiHapus(files).get(fnName);
        if (!/confirm|konfirmasi|sweet|dialog/i.test(scope) && lintasBerkas !== true) {
          add(sec, 'sedang', 'Penghapusan tanpa konfirmasi',
            'Aksi yang menghapus data dijalankan langsung dari klik, tanpa langkah konfirmasi.',
            f.rel, lineAt(code, m.index),
            'Tambahkan dialog konfirmasi yang menyebut apa yang akan dihapus, dengan tombol default bukan "Hapus".');
        }
      }
    }

    // B4. alert() yang memblokir
    for (const m of code.matchAll(/(?<![.\w])(?:window\.)?alert\s*\(/g)) {
      if (inComment(m.index)) continue;
      add(sec, 'sedang', 'alert() memblokir antarmuka',
        'alert() menghentikan seluruh halaman, tampil berulang di beberapa peramban, dan tidak dapat digayakan.',
        f.rel, lineAt(code, m.index),
        'Pakai toast/snackbar yang tidak memblokir, atau tampilkan pesan di dekat kolom terkait.');
    }
  }
}

/** C. Status antarmuka (memuat / kosong / galat / aksi asinkron) */
function auditStates(sec, files, routerLoading = false) {
  // Hanya berkas yang benar-benar menjadi HALAMAN. Yang di bawah
  // src/pages/<nama>/components/, /hooks/, /services/, dan /utils/ adalah
  // bagian dari halaman tersebut — mewajibkan status memuat/kosong/galat pada
  // sebuah tombol kontrol hanyalah kebisingan.
  const pages = files.filter((f) => {
    if (!f.rel.startsWith('src/pages/') || f.ext !== 'js') return false;
    if (/\.test\.js$/.test(f.rel)) return false;
    if (/\/pages\/[^/]+\/(components|hooks|services|utils)\//.test(f.rel)) return false;
    return true;
  });
  for (const f of pages) {
    const code = f.code;
    const has = (re) => re.test(code);

    // Status memuat/kosong/galat hanya bermakna pada halaman yang MENGAMBIL
    // data. Halaman statis — teks legal, halaman placeholder, pembungkus
    // lazy-load, kalkulator murni — tidak punya apa pun untuk dimuat, jadi
    // menuntut spinner di sana hanyalah kebisingan yang menutupi temuan nyata.
    const loadsData =
      /\bawait\b|\.then\s*\(|fetch\s*\(|supabase|repository\.|\.select\s*\(/.test(code);
    if (!loadsData) {
      // Tetap periksa perlindungan klik ganda di bawah.
    }

    const missing = [];
    if (!routerLoading && !has(/loading|memuat|spinner|skeleton|Booting/i)) missing.push('memuat');
    if (!has(/empty|kosong|belum ada|tidak ada data/i)) missing.push('kosong');
    if (!has(/catch|error|gagal/i)) missing.push('galat');
    if (loadsData && missing.length >= 2) {
      add(sec, 'sedang', 'Halaman tanpa status ' + missing.join(' / '),
        `Tidak ditemukan penanganan untuk status: ${missing.join(', ')}. Pengguna tidak tahu apakah data masih dimuat, memang kosong, atau gagal.`,
        f.rel, 1,
        'Tambahkan tiga status baku: memuat (skeleton), kosong (ajakan melakukan aksi), dan galat (penjelasan + tombol coba lagi).');
    }

    // Tombol aksi asinkron tanpa perlindungan klik ganda
    const asyncHandlers = [...code.matchAll(/addEventListener\(\s*['"]click['"]\s*,\s*async/g)];
    // setBusy() dari src/lib/a11y.js adalah cara baku di proyek ini: ia
    // menonaktifkan tombol, menandai aria-busy, dan mengembalikan keadaan
    // semula. Kehadirannya sama sahnya dengan disabled manual.
    const guarded = /setBusy\s*\(|disabled\s*=\s*true|classList\.add\(\s*['"][^'"]*loading|\.disabled\s*=/.test(code);
    if (asyncHandlers.length && !guarded) {
      add(sec, 'sedang', 'Aksi asinkron tanpa perlindungan klik ganda',
        `${asyncHandlers.length} handler klik asinkron tanpa menonaktifkan tombol atau menandai status sedang berjalan. Pengguna dapat menekan dua kali dan memicu dua permintaan.`,
        f.rel, lineAt(code, asyncHandlers[0].index),
        'Nonaktifkan tombol (disabled + aria-busy="true") selama menunggu, lalu kembalikan sesudahnya.');
    }
  }

  // C3. Pengumuman untuk pembaca layar
  const anyLive = files.some(f => f.ext !== 'css' && /aria-live|role\s*=\s*["']status["']|role\s*=\s*["']alert["']/.test(f.code));
  if (!anyLive) {
    add(sec, 'tinggi', 'Tidak ada wilayah pengumuman pembaca layar',
      'Seluruh aplikasi tidak memiliki aria-live / role="status". Setiap hasil asinkron (hasil AI, "tersimpan", galat) tidak diumumkan — pengguna pembaca layar tidak tahu pekerjaannya selesai.',
      'src/ (menyeluruh)', 0,
      'Tambahkan satu wadah live region di layout, lalu panggil announce("Pesan") untuk setiap perubahan status penting.');
  }
}

/** D. Responsif & sentuhan */
function auditResponsive(sec, files) {
  const css = files.filter(f => f.ext === 'css');
  const js = files.filter(f => f.ext === 'js');

  // D1. Lebar tetap besar
  for (const f of css) {
    const lines = f.code.split('\n');
    lines.forEach((ln, i) => {
      // PENTING: `(?<![-\w])width` — tanpa batas ini, `\bwidth` juga cocok
      // dengan `max-width` dan `min-width`, sehingga setiap
      // `max-width: 1400px` (yang justru PRAKTIK BAIK) dilaporkan sebagai
      // lebar tetap. Bug ini pernah membuat audit melaporkan 78 temuan palsu.
      const m = ln.match(/(?<![-\w])width\s*:\s*(\d{3,})px/);
      // Elemen dekoratif (::before/::after) yang diposisikan keluar wadah dan
      // dipotong overflow:hidden memang boleh berukuran besar — itu trik
      // membuat lingkaran cahaya, bukan tata letak yang akan meluber.
      const ctx = lines.slice(Math.max(0, i - 12), i + 2).join('\n');
      const isDecorative = /::(?:before|after)\s*\{/.test(ctx) && /position\s*:\s*absolute/.test(ctx);
      // Kerangka screenshot headless memang HARUS seukuran layar desktop —
      // itu justru intinya. Melebarkannya responsif akan merusak hasil tangkapan.
      const isHeadlessFrame = /left:\s*-\d{3,}px|position\s*:\s*fixed/i.test(ctx) && /iframe|screenshot|render/i.test(f.code);
      if (m && Number(m[1]) >= 480 && !/max-width|min-width/.test(ln) && !isDecorative && !isHeadlessFrame) {
        add(sec, 'sedang', `Lebar tetap ${m[1]}px`,
          `Kotak dengan lebar tetap ${m[1]}px akan melampaui layar ponsel (360–414 px) dan memaksa halaman menggeser ke samping.`,
          f.rel, i + 1,
          'Ganti dengan max-width dan width:100%, lalu tambahkan padding sebagai ganti lebar tetap.');
      }
    });
  }
  for (const f of js) {
    for (const m of f.code.matchAll(/(?<![-\w])width\s*:\s*(\d{3,})px/g)) {
      // Baris yang juga memuat max-width/min-width (mis. potongan @media di
      // dalam template literal) tidak dihitung.
      const lineStart = f.code.lastIndexOf('\n', m.index) + 1;
      const lineEnd = f.code.indexOf('\n', m.index);
      const line = f.code.slice(lineStart, lineEnd === -1 ? undefined : lineEnd);
      if (/max-width|min-width/.test(line)) continue;
      // Kerangka screenshot headless memang HARUS seukuran desktop (1920×1080):
      // iframe-nya sengaja diletakkan di luar layar hanya untuk difoto. Membuat
      // ukurannya responsif justru merusak hasil tangkapan.
      if (/iframe|screenshot|render/i.test(f.code) &&
          /position\s*:\s*fixed/i.test(line) && /left\s*:\s*-\d{3,}px/i.test(line)) continue;
      if (Number(m[1]) >= 480) {
        add(sec, 'sedang', `Lebar tetap ${m[1]}px di gaya inline`,
          'Gaya inline dengan lebar besar tidak dapat ditimpa media query, sehingga ponsel pasti meluber.',
          f.rel, lineAt(f.code, m.index),
          'Pindahkan ke kelas CSS dan pakai max-width + width:100%.');
      }
    }
  }

  // D2. Tabel lebar tanpa wadah gulir
  //
  // Mesin di infrastructure/pipeline/engines/ MEMBANGUN DOKUMEN (ekspor Word/HTML),
  // bukan tampilan aplikasi. Membungkus tabel di sana dengan overflow-x tidak
  // ada artinya dan justru merusak hasil cetak. Sama untuk berkas laporan
  // yang menghasilkan HTML untuk diunduh.
  const isDocumentBuilder = (rel) =>
    /infrastructure\/pipeline\/engines\//.test(rel) ||
    /\/laporan\/services\//.test(rel) ||
    /document-generator|report-generator|output-engine|document-engine|screenshot/.test(rel);

  // Kelas CSS yang sudah menyediakan gulir mendatar. Diambil dari berkas
  // gaya supaya tidak perlu di-hardcode — kalau nama kelasnya berubah,
  // detektor ikut menyesuaikan sendiri.
  const overflowClassCache = new Set();
  for (const cssFile of css) {
    const text = cssFile.code;
    // Mencari SETIAP deklarasi overflow-x, lalu menelusuri mundur ke awal
    // bloknya untuk membaca selektornya.
    //
    // KENAPA tidak memakai regex "selektor { isi }" biasa: aturan bersarang
    // seperti `@media (max-width: 768px) { .a { ... } }` membuat pencocokan
    // kurung kurawal meleset, sehingga blok-blok setelahnya terlewat — persis
    // yang membuat .table-container (overflow-x: auto) tidak terbaca padahal
    // sudah ada di main.css.
    for (const decl of text.matchAll(/overflow-x\s*:\s*(?:auto|scroll)/g)) {
      const openBrace = text.lastIndexOf('{', decl.index);
      if (openBrace === -1) continue;
      const prevClose = Math.max(
        text.lastIndexOf('}', openBrace),
        text.lastIndexOf('{', openBrace - 1),
        text.lastIndexOf(';', openBrace)
      );
      const selector = text.slice(prevClose + 1, openBrace)
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .trim();
      if (!selector || selector.startsWith('@')) continue;
      for (const one of selector.split(',')) {
        const cls = one.trim().match(/^\.([\w-]+)/);
        if (cls) overflowClassCache.add(cls[1]);
      }
    }
  }

  for (const f of js) {
    if (isDocumentBuilder(f.rel)) continue;
    const code = f.code;
    for (const m of code.matchAll(/<table\b/gi)) {
      const before = code.slice(Math.max(0, m.index - 260), m.index);

      // Kelas pembungkus yang memang sudah menggulir (mis. .table-container
      // yang didefinisikan overflow-x:auto di main.css).
      const wrapperClasses = [...before.matchAll(/class=["']([^"']+)["']/g)]
        .flatMap((c) => c[1].split(/\s+/));
      if (wrapperClasses.some((c) => overflowClassCache.has(c))) continue;

      // Tabel di dalam DOKUMEN CETAK dengan wadah overflow-x justru akan
      // terpotong saat dicetak — kebalikan dari yang diinginkan.
      const docRegions = documentRegions(code);
      if (docRegions.some(([a, b]) => m.index > a && m.index < b)) continue;

      if (!/(table-wrap|table-responsive|overflow-x|overflow:\s*auto)/.test(before)) {
        add(sec, 'sedang', 'Tabel tanpa wadah gulir',
          'Tabel data dengan banyak kolom akan meluber di layar sempit karena tidak dibungkus wadah ber-overflow-x.',
          f.rel, lineAt(code, m.index),
          'Bungkus dengan <div class="table-wrap"> yang memiliki overflow-x:auto dan tabindex="0" agar dapat digulir dengan keyboard.');
      }
    }
  }

  // D3. Touch target dari CSS
  for (const f of css) {
    const code = f.code;
    // Tombol dengan padding sangat kecil
    for (const m of code.matchAll(/([^{}]*\{[^{}]*?padding\s*:\s*([0-3])px(?:\s+(\d{1,2})px)?[^{}]*\})/g)) {
      const block = m[1];
      if (!/button|btn|\.icon|action/.test(m[0].split('{')[0])) continue;
      const padY = Number(m[2]);
      const padX = m[3] ? Number(m[3]) : padY;
      if (padY <= 3 && padX <= 8 && !/min-height|height\s*:\s*(4[4-9]|[5-9]\d|\d{3,})px/.test(block)) {
        add(sec, 'rendah', 'Sasaran sentuh terlalu kecil',
          `padding ${padY}px/${padX}px menghasilkan tinggi sasaran di bawah 44px (pedoman WCAG 2.5.8). Sulit ditekan dengan jempol.`,
          f.rel, lineAt(code, m.index),
          'Berikan min-height:44px; min-width:44px pada kontrol ikon, atau perbesar padding-nya.');
      }
    }
  }

  // D4. Gerakan tanpa prefers-reduced-motion
  const animFiles = [];
  for (const f of files) {
    if (f.ext === 'css' && /@keyframes|transition\s*:/.test(f.code)) animFiles.push(f.rel);
    if (f.ext === 'js' && /@keyframes|animation\s*:/.test(f.code)) animFiles.push(f.rel);
  }
  const hasReduced = files.some(f => /prefers-reduced-motion/.test(f.code));
  if (animFiles.length && !hasReduced) {
    add(sec, 'tinggi', 'Tidak ada dukungan prefers-reduced-motion',
      `${animFiles.length} berkas memakai animasi/transisi, tetapi tidak ada satu pun yang menghormati setelan sistem "kurangi gerakan". Pengguna dengan gangguan vestibular, migrain, atau ADHD dapat jatuh sakit karena animasi yang tidak bisa dimatikan.`,
      'src/styles/main.css', 0,
      'Tambahkan @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration:.01ms !important; animation-iteration-count:1 !important; transition-duration:.01ms !important; scroll-behavior:auto !important; } }');
  }
}

/** E. Konsistensi visual */
/**
 * E4. Ikon yang dipakai kode tetapi TIDAK ADA di set ikon yang dimuat.
 *
 * Ini kelas cacat yang paling sulit terlihat: tidak ada galat, tidak ada 404,
 * tidak ada apa pun di konsol. Ikon yang tidak dikenal hanya tergambar sebagai
 * kotak kosong — jadi pengguna melihat tombol tanpa lambang, dan pengembang
 * tidak mendapat petunjuk apa pun.
 *
 * Nyata terjadi di repositori ini: 17 nama ikon yang dipakai adalah ikon
 * Font Awesome **Pro**, sedangkan yang dimuat adalah set **Free** (keduanya
 * versi 6.5.0 — jadi ini bukan soal versi). Empat di antaranya ada di halaman
 * login, artinya layar pertama yang dilihat setiap pengguna menampilkan kotak
 * kosong.
 *
 * Cara kerja: kumpulkan seluruh kelas `fa-…` yang dipakai, lalu periksa
 * keberadaannya di CSS set ikon yang benar-benar dimuat. Nama ikon pada CSS
 * bisa digabung (`'.fa-a:before,.fa-b:before{…}'`), jadi kecocokan dicari
 * sebagai `.fa-nama:before` tanpa menuntut tanda `{` tepat sesudahnya.
 */
function auditIcons(sec, files) {
  const berkasCss = ['public/vendor/fontawesome/all.min.css', 'public/vendor/fontawesome/css/all.min.css']
    .map((p) => path.join(ROOT, p))
    .find((p) => existsSync(p));
  if (!berkasCss) return;   // set ikon lokal tidak ada — tidak dapat dinilai
  const css = readFileSync(berkasCss, 'utf8');

  // Dua bentuk pemakaian, karena keduanya nyata ada di repositori ini:
  //   1. langsung  : <i class="fas fa-brain">
  //   2. dari data : { icon: 'fa-brain', text: '…' }  ← lalu disisipkan
  //                  ke dalam template sebagai ${item.icon}
  // Bentuk kedua mudah terlewat: nama ikonnya tidak pernah muncul di samping
  // kelas `fas`, sehingga pencarian yang hanya mengenali bentuk pertama
  // melaporkan "semua ikon tersedia" padahal tidak. Karena itu bentuk kedua
  // dicocokkan sebagai string kutip yang ISINYA hanya nama ikon.
  // Kelas ANIMASI dan UTILITAS Font Awesome BUKAN nama ikon: keduanya tidak
  // punya aturan `:before` di CSS, sehingga tanpa pengecualian ini aturan
  // melaporkan "ikon tidak tersedia" untuk hal yang memang bukan ikon.
  // Contoh nyata: `fa-beat` dipakai untuk membuat ikon berdenyut saat
  // sinkronisasi berjalan.
  const BUKAN_IKON = new Set([
    'fa-beat', 'fa-bounce', 'fa-fade', 'fa-flip', 'fa-shake', 'fa-spin',
    'fa-spin-pulse', 'fa-spin-reverse', 'fa-pulse', 'fa-fw', 'fa-ul', 'fa-li',
    'fa-border', 'fa-inverse', 'fa-stack', 'fa-stack-1x', 'fa-stack-2x',
    'fa-rotate-90', 'fa-rotate-180', 'fa-rotate-270', 'fa-flip-horizontal',
    'fa-flip-vertical', 'fa-flip-both', 'fa-pull-left', 'fa-pull-right',
  ]);

  const dipakai = new Map();
  const catat = (nama, f, index) => {
    if (BUKAN_IKON.has(nama)) return;
    if (!dipakai.has(nama)) dipakai.set(nama, []);
    dipakai.get(nama).push({ rel: f.rel, line: lineAt(f.code, index) });
  };
  for (const f of files) {
    if (f.ext !== 'js') continue;
    for (const m of f.code.matchAll(/\b(?:fas|far|fab|fal|fad|fa)\s+(fa-[a-z0-9-]+)/g)) {
      catat(m[1], f, m.index);
    }
    for (const m of f.code.matchAll(/(['"`])(fa-[a-z0-9-]+)\1/g)) {
      catat(m[2], f, m.index);
    }
  }

  const hilang = [...dipakai.entries()].filter(([nama]) => !css.includes(`.${nama}:before`));
  if (!hilang.length) return;

  const daftar = hilang.map(([nama, tempat]) => `${nama} (mis. ${tempat[0].rel}:${tempat[0].line})`);
  add(sec, 'sedang', `Ikon tidak tersedia di set ikon yang dimuat (${hilang.length} nama)`,
    `${daftar.slice(0, 12).join(', ')}${hilang.length > 12 ? `, … dan ${hilang.length - 12} lagi` : ''}. ` +
    'Ikon yang tidak dikenal tidak menghasilkan galat apa pun — ia hanya tergambar sebagai kotak kosong, sehingga pengguna melihat tombol tanpa lambang dan pengembang tidak mendapat petunjuk.',
    hilang[0][1][0].rel, hilang[0][1][0].line,
    'Ganti dengan padanan dari set yang dimuat (mis. ikon Pro "fa-brain-circuit" → "fa-brain" yang tersedia di set Free), atau tambahkan CSS ikon yang memuatnya.');
}

function auditVisual(sec, files) {
  // E1. Warna heksadesimal literal di JS (di luar token)
  const literalByFile = new Map();
  for (const f of files) {
    if (f.ext !== 'js') continue;
        const matches = [...f.code.matchAll(/#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/g)]
          .filter(m => f.mask[m.index] === 2); // hanya di dalam string (gaya inline)
    if (matches.length >= 6) literalByFile.set(f.rel, matches.length);
  }
  const totalLiterals = [...literalByFile.values()].reduce((a, b) => a + b, 0);
  if (totalLiterals > 50) {
    add(sec, 'rendah', `Warna literal di dalam kode (${totalLiterals} tempat)`,
      `Nilai warna ditulis langsung, bukan lewat token, pada ${literalByFile.size} berkas. Perubahan tema menjadi tidak konsisten dan sulit dirawat.`,
      'src/', 0,
      'Ganti dengan var(--…). Nilai yang benar-benar baru sebaiknya ditambahkan sebagai token di :root, bukan ditulis di tempat pemakaian.');
  }

  // E2. Penskalaan font: nilai px di luar skala
  const fontSizes = new Map();
  for (const f of files) {
    if (f.ext !== 'css') continue;
    for (const m of f.code.matchAll(/font-size\s*:\s*(\d+(?:\.\d+)?)px/g)) {
      const v = Number(m[1]);
      if (!fontSizes.has(v)) fontSizes.set(v, 0);
      fontSizes.set(v, fontSizes.get(v) + 1);
    }
  }
  if (fontSizes.size > 14) {
    const list = [...fontSizes.entries()].sort((a, b) => a[0] - b[0]).map(([v, n]) => `${v}px×${n}`);
    add(sec, 'rendah', `Skala tipografi terlalu banyak (${fontSizes.size} ukuran berbeda)`,
      `Ukuran teks yang dipakai: ${list.slice(0, 20).join(', ')}${fontSizes.size > 20 ? ', …' : ''}. Skala yang terlalu rapat membuat hierarki tidak terbaca dan menghambat konsistensi.`,
      'src/styles/main.css', 0,
      'Tetapkan skala terbatas (mis. 12/14/16/20/24/32) sebagai token --text-xs … --text-3xl, lalu pakai token itu.');
  }

  // E3. Kalimat antarmuka yang belum diterjemahkan
  //
  // Kenapa BUKAN "hitung kata Inggris vs Indonesia": percobaan pertama
  // menghasilkan angka besar yang menyesatkan, karena aplikasi ini memang
  // memakai istilah teknis Inggris yang sudah menjadi kosakata baku bagi
  // insinyur Indonesia — "Daylight Factor", "Air Flow Rate", "Noise Criteria
  // (NC)", "Air Handling Unit (AHU)". Menerjemahkan istilah-istilah itu
  // justru MENURUNKAN mutu karena menyimpang dari rujukan standar yang
  // dipakai profesi (SNI, ASHRAE).
  //
  // Yang benar-benar merugikan pengguna adalah KALIMAT utuh berbahasa Inggris
  // yang belum diterjemahkan di tengah antarmuka berbahasa Indonesia — mis.
  // "The executive report cannot be synthesized until the AI analysis is
  // finalized." Kalimat seperti itulah yang dideteksi di sini: minimal 5 kata
  // dan memuat kata fungsi bahasa Inggris (the/is/will/cannot/until/to/of…).
  const EN_PROSE = /\b(the|and|is|are|will|would|cannot|can't|until|when|while|before|after|please|must|should|to|of|for|with|from|that|this|your|you)\b/gi;

  // Berkas yang isinya INSTRUKSI UNTUK MODEL AI, bukan teks untuk pengguna.
  // Terjemahan di sini justru merusak mutu keluaran model, jadi dilewati.
  const isPromptLibrary = (rel) =>
    /slf-prompt-library|deep-reasoning-hooks|ai-router\.js|infrastructure\/ai\/AdvancedReasoningService/.test(rel) ||
    /prompt-library|prompts?\.js$/.test(rel);

  const proseHits = [];
  for (const f of files) {
    if (f.ext !== 'js') continue;
    if (isPromptLibrary(f.rel)) continue;
    // Posisi setiap string diambil dari matchAll — BUKAN dari
    // f.code.indexOf(raw.slice(0, 24)). Versi lama mencari kemunculan PERTAMA
    // potongan teks itu di seluruh berkas, yang bisa saja berada di komentar
    // atau di string lain; penjaga di bawah lalu memutuskan berdasarkan tempat
    // yang salah. Untuk template panjang (teks antarmuka), salah posisi ini
    // berarti seluruh template dianggap komentar dan tidak pernah diperiksa.
    const strings = [
      ...f.code.matchAll(/`(?:[^`\\]|\\.)*`/g),
      ...f.code.matchAll(/'[^'\n]{12,}'/g),
      ...f.code.matchAll(/"[^"\n]{12,}"/g),
    ].map((m) => ({ isi: m[0].slice(1, -1), index: m.index }));

    for (const { isi: raw, index } of strings) {
      // Lewati teks yang bukan untuk pengguna:
      const before = f.code.slice(Math.max(0, index - 60), index);
      // (1) argumen console.* — diagnostik pengembang
      if (/console\s*\.\s*\w+\s*\(\s*[`'"]?$/.test(before)) continue;
      // (2) berada di dalam komentar (mask 0). Isi string kini bernilai 2,
      //     sehingga tidak lagi tertukar dengan komentar.
      if (f.mask && f.mask[index] === 0) continue;

      const visible = raw
        .replace(/\$\{[\s\S]*?\}/g, ' ')
        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
        .replace(/<[^>]*>/g, ' ')
        .replace(/[a-z-]+\s*=\s*("[^"]*"|'[^']*')/gi, ' ')
        .replace(/&[a-z]+;/gi, ' ');

      for (const sentence of visible.split(/(?<=[.!?])\s+|\n+/)) {
        const t = sentence.replace(/\s+/g, ' ').trim();
        if (t.length < 24) continue;
        // Potongan kode program (Python/JS/SQL) yang kebetulan disimpan
        // sebagai teks — bukan kalimat untuk pengguna. Filter ini berlaku
        // PER KALIMAT, bukan per-string: satu template HTML bisa memuat
        // kalimat biasa sekaligus potongan kode, dan menyaring di tingkat
        // string membuat kalimat yang sah ikut hilang.
        if (/^\s*(#|\/\/|import |def |function |const |export |SELECT |INSERT )/.test(t)) continue;
        if (/[{};]\s*(\/\/|#)?$/.test(t) && /[;{}]/.test(t)) continue;
        const words = t.split(' ').filter((w) => /[A-Za-z]/.test(w));
        if (words.length < 5) continue;
        // Bukan kalimat untuk pengguna — dua jenis yang pernah muncul sebagai
        // positif palsu dan BERBAHAYA bila "diterjemahkan":
        //
        // (1) Fragmen kueri API / URL. Contoh nyata: "and and ' ' in parents
        //     and trashed=false" — itu kueri Google Drive API. Menerjemahkannya
        //     merusak sinkronisasi berkas, bukan memperbaiki tampilan.
        if (/^https?:\/\//i.test(t)) continue;
        if (/[=]/.test(t) && /(trashed=|parents\s+in|select=|order=|limit=|\?[a-z_]+=|&[a-z_]+=)/i.test(t)) continue;
        // (2) Judul standar/regulasi. Contoh nyata: "NFPA 13: Standard for the
        //     Installation of Sprinkler Systems" — nama resmi dokumen rujukan.
        //     Menerjemahkannya mengaburkan rujukan yang dipakai profesi.
        if (/^(NFPA|SNI|ASHRAE|ASCE|ASTM|ACI|AISC|AISI|IEC|ISO|EN|BS|DIN|JIS|FEMA|PP|UU|Permen|Kepmen|SE)\s+[\dIVX]/i.test(t)) continue;
        // Kata fungsi Indonesia yang kuat menandakan kalimat sudah campur —
        // itu kalimat Indonesia, bukan kalimat Inggris yang lupa diterjemahkan.
        if (/\b(yang|dan|dengan|untuk|tidak|adalah|akan|dari|pada|ini|itu|atau|sudah|belum)\b/i.test(t)) continue;
        // Kalimat Indonesia yang seluruhnya istilah teknis juga lolos.
        const fn = (t.match(EN_PROSE) || []).length;
        if (fn >= 2) proseHits.push({ rel: f.rel, line: lineAt(f.code, raw ? f.code.indexOf(t.slice(0, 20)) : 0), text: t });
      }
    }
  }
  if (proseHits.length) {
    add(sec, proseHits.length > 25 ? 'sedang' : 'rendah',
      `Kalimat antarmuka berbahasa Inggris (${proseHits.length} kalimat)`,
      'Kalimat utuh berbahasa Inggris muncul di tengah antarmuka berbahasa Indonesia. Istilah teknis baku (Daylight Factor, AHU, NC) TIDAK dihitung — itu memang kosakata profesi. Yang dihitung hanya kalimat penuh, mis. pesan galat atau keterangan yang harus diterjemahkan pengguna sendiri.',
      proseHits[0]?.rel || 'src/', proseHits[0]?.line || 0,
      'Terjemahkan kalimat-kalimat ini ke bahasa Indonesia. Lihat daftarnya dengan --verbose.');
    if (VERBOSE) {
      for (const h of proseHits.slice(0, 40)) {
        console.log(`       ${h.rel}:${h.line}  "${h.text.slice(0, 96)}"`);
      }
      if (proseHits.length > 40) console.log(`       … dan ${proseHits.length - 40} kalimat lain`);
    }
  }

  // E4. Gaya inline berlebihan
  for (const f of files) {
    if (f.ext !== 'js') continue;
    const inline = [...f.code.matchAll(/\bstyle\s*=\s*["'][^"']{40,}["']/g)];
    if (inline.length >= 40) {
      add(sec, 'rendah', `Gaya inline panjang (${inline.length} tempat)`,
        'Aturan gaya yang ditulis langsung di atribut style tidak dapat ditimpa media query, tidak dapat di-cache, dan menyulitkan perawatan tema.',
        f.rel, lineAt(f.code, inline[0].index),
        'Pindahkan ke kelas di main.css.');
    }
  }
}

/** F. Performa yang dirasakan */
function auditPerf(sec) {
  // F1. Favicon / ikon besar
  const pub = path.join(ROOT, 'public');
  if (existsSync(pub)) {
    for (const name of readdirSync(pub)) {
      const full = path.join(pub, name);
      if (!statSync(full).isFile()) continue;
      const kb = statSync(full).size / 1024;
      if (/favicon|icon|logo/i.test(name) && kb > 100) {
        add(sec, 'tinggi', `Ikon berukuran ${Math.round(kb)} kB`,
          `${name} diunduh peramban pada kunjungan pertama dan ikut masuk cache. Ukuran ini jauh melampaui kebutuhan ikon (idealnya < 20 kB).`,
          `public/${name}`, 0,
          'Sederhanakan menjadi SVG vektor berukuran beberapa kB, atau ekspor ulang ke PNG dengan ukuran tepat (192 dan 512 px).');
      }
    }
  }

  // F2. @import di dalam CSS (menghambat render berantai)
  const cssFiles = readdirSync(SRC, { recursive: true })
    .filter(f => typeof f === 'string' && f.endsWith('.css'));
  for (const c of cssFiles) {
    const code = readFileSync(path.join(SRC, c), 'utf8');
    if (/^\s*@import\s+url\(/m.test(code)) {
      add(sec, 'sedang', '@import di dalam CSS',
        '@import membuat peramban menunggu berkas CSS pertama selesai diunduh sebelum mengetahui berkas berikutnya — render tertunda berantai.',
        `src/${c.replace(/\\/g, '/')}`, code.split('\n').findIndex(l => /^\s*@import/.test(l)) + 1,
        'Impor lewat bundler (import di JS) atau satukan aturannya.');
    }
  }

  // F3. Sumber daya render-blocking dari CDN di index.html
  const html = path.join(ROOT, 'index.html');
  if (existsSync(html)) {
    const code = readFileSync(html, 'utf8');
    for (const m of code.matchAll(/<link\s+[^>]*rel=["']stylesheet["'][^>]*href=["'](https?:[^"']+)["'][^>]*>/g)) {
      const tag = m[0];
      if (!/preload|media=["']print/.test(tag)) {
        add(sec, 'sedang', 'CSS dari CDN menghambat render',
          `${m[1]} harus diunduh sebelum halaman dapat digambar. Bila CDN lambat atau diblokir (termasuk saat offline), antarmuka tampil tanpa gaya.`,
          'index.html', lineAt(code, m.index),
          'Aplikasi ini sudah PWA (memiliki service worker). Bundel CSS-nya sendiri agar dapat dimuat offline, atau tambahkan preload + fallback.');
      }
    }
  }

  // F4. Gambar tanpa loading="lazy"
  for (const f of []) { /* placeholder — ditangani pada audit a11y */ }
}

// ─────────────────────────────────────────────────────────────────────────────
// Program utama
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  const paths = await collectFiles();
  const files = [];
  for (const p of paths) {
    const code = await readFile(p, 'utf8');
    const ext = p.endsWith('.css') ? 'css' : p.endsWith('.html') ? 'html' : 'js';
    files.push({ path: p, rel: rel(p), code, ext, mask: ext === 'js' ? codeMask(code) : new Uint8Array(code.length).fill(1) });
  }

  const sections = [
    section('a11y'),
    section('keyboard'),
    section('states'),
    section('responsive'),
    section('visual'),
    section('perf'),
  ];
  const byName = Object.fromEntries(sections.map(s => [s.name, s]));

  const globalA11y = await globalA11yActive();
  const routerLoading = await routerLoadingActive();
  if (shouldRun('a11y')) auditA11y(byName.a11y, files, globalA11y);
  if (shouldRun('keyboard')) auditKeyboard(byName.keyboard, files, globalA11y);
  if (shouldRun('states')) auditStates(byName.states, files, routerLoading);
  if (shouldRun('responsive')) auditResponsive(byName.responsive, files);
  if (shouldRun('visual')) {
    auditVisual(byName.visual, files);
    auditIcons(byName.visual, files);
  }
  if (shouldRun('perf')) auditPerf(byName.perf);

  const active = sections.filter(s => s.findings.length || shouldRun(s.name));

  // ── Ringkasan ──
  const total = active.reduce((n, s) => n + s.findings.length, 0);
  const bySeverity = { tinggi: 0, sedang: 0, rendah: 0 };
  for (const s of active) for (const f of s.findings) bySeverity[f.severity]++;

  console.log(`\n${'='.repeat(78)}`);
  console.log('  AUDIT UX & AKSESIBILITAS');
  console.log(`${'='.repeat(78)}`);
  console.log(`  Berkas diperiksa ....... ${files.length}`);
  console.log(`  Temuan ................. ${total}`);
  console.log(`     tinggi .............. ${bySeverity.tinggi}`);
  console.log(`     sedang .............. ${bySeverity.sedang}`);
  console.log(`     rendah .............. ${bySeverity.rendah}`);
  console.log(`${'='.repeat(78)}\n`);

  for (const s of active) {
    if (!s.findings.length) {
      console.log(`  ✅ ${s.label} — tidak ada temuan\n`);
      continue;
    }
    const counts = { tinggi: 0, sedang: 0, rendah: 0 };
    for (const f of s.findings) counts[f.severity]++;
    console.log(`  ── ${s.label} — ${s.findings.length} temuan ` +
      `(tinggi ${counts.tinggi} · sedang ${counts.sedang} · rendah ${counts.rendah}) ${'─'.repeat(Math.max(0, 20 - s.label.length))}`);

    // Kelompokkan judul yang sama
    const groups = new Map();
    for (const f of s.findings) {
      if (!groups.has(f.title)) groups.set(f.title, []);
      groups.get(f.title).push(f);
    }
    const sorted = [...groups.entries()].sort((a, b) =>
      SEVERITY_ORDER[a[1][0].severity] - SEVERITY_ORDER[b[1][0].severity] || b[1].length - a[1].length);

    for (const [title, items] of sorted) {
      const mark = { tinggi: '🔴', sedang: '🟠', rendah: '🔵' }[items[0].severity];
      console.log(`\n  ${mark} ${title}${items.length > 1 ? ` — ${items.length} tempat` : ''}`);
      const show = VERBOSE ? items : items.slice(0, 4);
      for (const it of show) {
        console.log(`       ${it.file}${it.line ? ':' + it.line : ''}`);
        if (VERBOSE) {
          console.log(`         ${it.detail}`);
          console.log(`         → ${it.fix}`);
        }
      }
      if (!VERBOSE && items.length > show.length) {
        console.log(`       … dan ${items.length - show.length} tempat lain (pakai --verbose)`);
      }
    }
    console.log('');
  }

  if (JSON_OUT) {
    const payload = {
      generatedAt: new Date().toISOString(),
      filesChecked: files.length,
      totals: { all: total, ...bySeverity },
      sections: active.map(s => ({ section: s.name, label: s.label, count: s.findings.length, findings: s.findings })),
    };
    const target = path.isAbsolute(JSON_OUT) ? JSON_OUT : path.join(ROOT, JSON_OUT);
    const { writeFile } = await import('node:fs/promises');
    await writeFile(target, JSON.stringify(payload, null, 2));
    console.log(`  Laporan JSON: ${rel(target)}\n`);
  }

  process.exit(0);
}

const isMain = process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;
if (isMain) {
  main().catch((err) => {
    console.error(`\n❌ Audit UX gagal: ${err.message}\n${err.stack}\n`);
    process.exit(1);
  });
}

export { codeMask, lineAt };
