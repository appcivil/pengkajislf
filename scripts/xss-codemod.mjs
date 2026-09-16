#!/usr/bin/env node
/**
 * xss-codemod.mjs — menyuntikkan escapeHtml() ke interpolasi data pada
 * setiap sink innerHTML, sehingga XSS tersimpan (stored XSS) tertutup.
 *
 * KENAPA ESCAPE, BUKAN SANITASI DI SINK?
 *   Aplikasi ini memakai atribut inline (`onclick`, `style`) secara masif.
 *   DOMPurify akan menghapus `on*`, sehingga sanitisasi di titik sink
 *   justru melumpuhkan seluruh antarmuka. Karena itu yang di-escape adalah
 *   DATA-nya, bukan markahnya:
 *       el.innerHTML = `<td>${row.nama}</td>`      → berbahaya
 *       el.innerHTML = `<td>${escapeHtml(row.nama)}</td>` → aman
 *
 * AMAN KARENA:
 *   - Hanya ekspresi "data path" murni yang dibungkus (mis. `a.b.c`,
 *     `a?.b`, `a[0]`, `a.b ?? '-'`). Pemanggilan fungsi, template bersarang,
 *     ekspresi ternary, dan operator aritmetika DILEWATI.
 *   - Nama yang mengindikasikan markah (…Html, …svg, icon, badge, dst.)
 *     dilewati agar markah sah tidak ikut ter-escape.
 *   - Nilai di dalam atribut HTML di-decode ulang oleh peramban sebelum
 *     dipakai, jadi `&amp;`/`&#39;` tidak merusak nilai asli.
 *   - escapeHtml(number) === String(number), jadi angka tidak berubah.
 *
 * Pemakaian:
 *   node scripts/xss-codemod.mjs --dry          # tampilkan rencana
 *   node scripts/xss-codemod.mjs --dry --verbose
 *   node scripts/xss-codemod.mjs                # terapkan
 *   node scripts/xss-codemod.mjs --json laporan.json
 *   node scripts/xss-codemod.mjs --only src/pages/electrical-inspection.js
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const ROOT = process.cwd();
const SRC = path.join(ROOT, 'src');
const SAFE_MARKDOWN = path.join(SRC, 'lib', 'safe-markdown.js');

const argv = process.argv.slice(2);
const DRY = argv.includes('--dry');
const VERBOSE = argv.includes('--verbose');
const jsonAt = argv.indexOf('--json');
const JSON_OUT = jsonAt >= 0 ? argv[jsonAt + 1] : null;
const onlyAt = argv.indexOf('--only');
const ONLY = onlyAt >= 0 ? argv[onlyAt + 1] : null;

// ── Ekspresi yang aman & boleh dibungkus ────────────────────────────────────
// Data path murni: identifier, lalu rantai .prop / ?.prop / [indeks].
const LEAF_RE = /^[A-Za-z_$][\w$]*(?:(?:\?\.)?\.[A-Za-z_$][\w$]*|\[\s*(?:\d+|'[^']*'|"[^"]*"|`[^`]*`)\s*\])*$/;
const STRING_LITERAL_RE = /^(?:'[^']*'|"[^"]*"|`[^`]*`|-?\d+(?:\.\d+)?|true|false|null|undefined)$/;

// Berkas yang templatenya BUKAN markah HTML (dokumen Word/XML, worker).
// Escaping di sini justru akan merusak format berkas keluaran.
const NON_MARKUP_FILE = /docx|pdf|xslx|xlsx|workers\//i;

// Nama yang menandakan nilai tersebut MEMANG markah — jangan di-escape.
// CATATAN: versi awal pola ini memakai `star` tanpa batas kata, sehingga
// nama seperti "NOT STARTED" ikut dianggap markah dan datanya dilewatkan.
// Sekarang dipisah: camelCase (peka huruf besar-kecil, mis. `badgeHtml`)
// dan kata mandiri lowercase (dengan batas kata, mis. `svg`, `icon`).
const MARKUP_HINT = new RegExp(
  [
    // Substring apa pun: kata-kata ini praktis tidak pernah muncul di dalam
    // data pengguna, dan selalu menandakan nilai berupa markah.
    'html', 'svg', 'markup', 'snippet', 'fragment', 'tmpl', 'template',
    // CamelCase peka huruf besar-kecil: `statusBadge`, `userIcon`, `badgeHtml`.
    '(?:Html|Svg|Icon|Badge|Chip|Node|Element|Marker|Star|Sprite|Raw)\\b',
    // Kata mandiri lowercase: BUTUH batas kata. Tanpa ini, "NOT STARTED"
    // ikut dianggap markah hanya karena memuat "star".
    '\\b(?:icons?|badges?|chips?|nodes?|elements?|markers?|stars?|sprites?|raw)\\b',
  ].join('|'),
  'i'
);

// Rantai method yang HANYA ada pada string dan pasti mengembalikan string.
// Contoh nyata yang ditemukan audit: `${summary.overall_status?.replace('_', ' ')}`
// — sebelumnya dilewatkan oleh codemod, padahal hasilnya data mentah.
//
// SENGAJA TIDAK disertakan: split/join/slice/concat/filter/map, karena
// method itu juga ada pada array. Meng-escape hasil `.join()` atas array
// markah justru akan merusak tampilan.
const SAFE_CHAIN_METHODS = [
  'replace', 'replaceAll', 'toUpperCase', 'toLowerCase',
  'trim', 'trimStart', 'trimEnd', 'padStart', 'padEnd', 'repeat',
  'substring', 'substr', 'normalize', 'toFixed',
  'toLocaleString', 'toLocaleDateString', 'toLocaleTimeString', 'toString',
];

// Fungsi yang sudah menangani escaping sendiri.
const ALREADY_SAFE_RE = /^(?:escapeHtml|escapeHTML|escHtml|esc|sanitizeHtml|safeHtml|safeMarkdown|encodeURIComponent|encodeHtml)$/;

/**
 * Cari seluruh rentang `${ ... }` di dalam sebuah template literal,
 * menghormati string dan template bersarang.
 * @param {string} code
 * @param {number} start indeks tepat setelah backtick pembuka
 * @returns {{start:number,end:number,expr:string}[]} start/end = rentang isi ekspresi
 */
function findInterpolations(code, start) {
  const out = [];
  let i = start;
  const n = code.length;
  while (i < n) {
    const ch = code[i];
    if (ch === '\\') { i += 2; continue; }
    if (ch === '`') break;                       // template selesai
    if (ch === '$' && code[i + 1] === '{') {
      const exprStart = i + 2;
      const exprEnd = matchBrace(code, exprStart);
      if (exprEnd < 0) break;
      out.push({ start: exprStart, end: exprEnd, expr: code.slice(exprStart, exprEnd) });
      i = exprEnd + 1;
      continue;
    }
    i++;
  }
  return out;
}

/** Cari pasangan `}` untuk `{` yang sudah terbuka di posisi sebelum `from`. */
function matchBrace(code, from) {
  let depth = 1, i = from;
  const n = code.length;
  while (i < n) {
    const ch = code[i];
    if (ch === '\\') { i += 2; continue; }
    if (ch === '"' || ch === "'") {
      const q = ch; i++;
      while (i < n && code[i] !== q) { if (code[i] === '\\') i++; i++; }
      i++; continue;
    }
    if (ch === '`') {
      // template bersarang: lompati sampai backtick penutupnya
      i++;
      while (i < n && code[i] !== '`') {
        if (code[i] === '\\') { i += 2; continue; }
        if (code[i] === '$' && code[i + 1] === '{') {
          const e = matchBrace(code, i + 2);
          if (e < 0) break;
          i = e + 1; continue;
        }
        i++;
      }
      i++; continue;
    }
    if (ch === '{') depth++;
    else if (ch === '}') { depth--; if (depth === 0) return i; }
    i++;
  }
  return -1;
}

/**
 * Buang tanda kurung PEMBUNGKUS saja, mis. `(a ?? b)` → `a ?? b`.
 *
 * Versi sebelumnya memakai `.replace(/\)+$/, '')` yang ikut memotong
 * tanda kurung penutup dari pemanggilan method — sehingga
 * `x.toUpperCase()` berubah menjadi `x.toUpperCase(` dan tidak lagi
 * dikenali sebagai bagian data. Fungsi ini hanya membuang kurung yang
 * benar-benar memasangkan seluruh ekspresi.
 */
function unwrapParens(text) {
  let t = text.trim();
  while (t.startsWith('(') && t.endsWith(')')) {
    let depth = 0, balanced = true;
    for (let i = 0; i < t.length; i++) {
      if (t[i] === '(') depth++;
      else if (t[i] === ')') {
        depth--;
        if (depth === 0 && i !== t.length - 1) { balanced = false; break; }
      }
    }
    if (!balanced) break;
    t = t.slice(1, -1).trim();
  }
  return t;
}

/** Apakah ekspresi ini boleh dibungkus escapeHtml()? */
export function shouldEscape(expr) {
  const e = expr.trim();
  if (!e) return false;

  // Sudah dibungkus / sudah aman
  const callMatch = e.match(/^([A-Za-z_$][\w$.]*)\s*\(/);
  if (callMatch && ALREADY_SAFE_RE.test(callMatch[1])) return false;

  // Markah sah — jangan diutak-atik
  if (MARKUP_HINT.test(e)) return false;

  // Argumen yang memuat '<'/'>' menandakan method dipakai untuk MENYISIPKAN
  // markah (mis. `.replace(/x/g, '<br>')`), bukan mengolah data.
  if (e.includes('<') || e.includes('>')) return false;

  // Satu "bagian data": data path murni, literal, atau data path yang
  // diikuti method pengolah string (`a.b?.trim()`).
  const CALL = `\\??\\.(?:${SAFE_CHAIN_METHODS.join('|')})\\s*\\([^()]*\\)`;
  const CHAIN_RE = new RegExp(`^${LEAF_RE.source.slice(1, -1)}(?:${CALL})+$`);
  const isDataPart = (part) =>
    LEAF_RE.test(part) || STRING_LITERAL_RE.test(part) || CHAIN_RE.test(part);

  // Rantai `??` / `||`: aman bila SELURUH bagiannya bagian data.
  // Contoh: `a.b ?? '-'`, `x.role?.toUpperCase() || 'USER'`
  const chain = e.split(/\?\?|\|\|/);
  if (chain.length > 1) {
    return chain.every(part => isDataPart(unwrapParens(part)));
  }

  return isDataPart(e);
}

/** Cari template literal yang menjadi sisi kanan `.innerHTML = ...`. */
function statementSpan(code, innerHtmlIdx) {
  const eq = code.indexOf('=', innerHtmlIdx);
  if (eq < 0) return null;
  let depth = 0, quote = null, i = eq + 1;
  const n = Math.min(code.length, eq + 20000);
  while (i < n) {
    const ch = code[i];
    if (quote) {
      if (ch === '\\') { i += 2; continue; }
      if (ch === quote) quote = null;
      i++; continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') { quote = ch; i++; continue; }
    if (ch === '(' || ch === '[' || ch === '{') depth++;
    else if (ch === ')' || ch === ']' || ch === '}') { if (depth === 0) return { start: eq + 1, end: i }; depth--; }
    else if (ch === ';' && depth === 0) return { start: eq + 1, end: i };
    i++;
  }
  return { start: eq + 1, end: n };
}

// ── Kumpulkan berkas sumber ─────────────────────────────────────────────────
function walk(dir, acc = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) { if (entry.name !== 'node_modules') walk(p, acc); }
    else if (entry.name.endsWith('.js') && !entry.name.endsWith('.test.js')) acc.push(p);
  }
  return acc;
}

function relImport(fromFile) {
  let r = path.relative(path.dirname(fromFile), SAFE_MARKDOWN).replace(/\\/g, '/');
  if (!r.startsWith('.')) r = './' + r;
  return r.replace(/\.js$/, '.js');
}

/** Tambahkan `import { escapeHtml } from '...'` bila belum ada. */
function ensureImport(code, file) {
  if (/import\s*\{[^}]*\bescapeHtml\b[^}]*\}\s*from/.test(code)) return code;
  // Berkas yang sudah punya escapeHtml sendiri TIDAK boleh diberi import:
  // akan terjadi "Identifier 'escapeHtml' has already been declared".
  if (/(?:function|const|let|var)\s+escapeHtml\b/.test(code)) return code;
  const spec = relImport(file);
  const m = code.match(/^import\s+[^\n]*;\s*$/m);
  const line = `import { escapeHtml } from '${spec}';`;
  if (!m) return `${line}\n${code}`;
  return code.slice(0, m.index + m[0].length) + `\n${line}` + code.slice(m.index + m[0].length);
}

// ── Proses satu berkas ──────────────────────────────────────────────────────

/**
 * Telusuri satu template literal secara rekursif dan kumpulkan ekspresi
 * yang perlu di-escape — termasuk yang berada di dalam template bersarang.
 * @param {string} code
 * @param {number} tkStart indeks tepat setelah backtick pembuka
 * @param {number} limit batas atas pencarian
 * @param {{start:number,end:number,expr:string}[]} edits
 */
function collectEdits(code, tkStart, limit, edits) {
  let i = tkStart;
  while (i < limit) {
    const ch = code[i];
    if (ch === '\\') { i += 2; continue; }
    if (ch === '`') return;                       // template ini selesai
    if (ch === '$' && code[i + 1] === '{') {
      const eStart = i + 2;
      const eEnd = matchBrace(code, eStart);
      if (eEnd < 0) return;
      const expr = code.slice(eStart, eEnd);

      // Ekspresi ini sendiri berupa data path → bungkus.
      if (shouldEscape(expr)) {
        edits.push({ start: eStart, end: eEnd, expr: expr.trim() });
      } else if (expr.includes('`')) {
        // Bukan data path, tetapi di dalamnya ada template bersarang —
        // telusuri agar data di dalamnya tetap ter-escape.
        for (let k = eStart; k < eEnd; k++) {
          if (code[k] === '`') {
            collectEdits(code, k + 1, eEnd, edits);
            const close = findTemplateEnd(code, k + 1);
            if (close < 0 || close >= eEnd) break;
            k = close;
          }
        }
      }
      i = eEnd + 1;
      continue;
    }
    i++;
  }
}

/**
 * Terapkan seluruh edit pada SATU berkas.
 *
 * PENTING: semua rentang dihitung dari kode ASLI, baru diterapkan sekaligus
 * dari posisi paling belakang. Versi pertama codemod ini menerapkan edit
 * sambil berjalan, sehingga penyisipan `escapeHtml(` menggeser offset setiap
 * sink berikutnya — akibatnya banyak sink terlewat dan sebagian edit mendarat
 * di tempat yang salah. Dua fase ini menghilangkan seluruh kelas bug tersebut.
 */
function applyAll(code, edits) {
  const seen = new Set();
  const uniq = edits
    .filter(e => {
      if (seen.has(e.start)) return false;
      seen.add(e.start);
      return true;
    })
    .sort((a, b) => b.start - a.start);

  let out = code;
  for (const e of uniq) {
    out = out.slice(0, e.start) + `escapeHtml(${e.expr})` + out.slice(e.end);
  }
  return { code: out, edits: uniq };
}

/**
 * Kumpulkan semua ekspresi yang MASIH perlu di-escape pada sebuah berkas.
 * Diekspor agar dapat dipakai sebagai gerbang regresi oleh
 * `src/lib/xss-guard.test.js` — satu implementasi, tidak ada duplikasi logika.
 *
 * @param {string} code isi berkas
 * @param {string} relPath jalur relatif (untuk pengecualian berkas non-markah)
 * @returns {{start:number,end:number,expr:string}[]}
 */
export function collectEscapes(code, relPath = '') {
  const collected = [];
  const collect = (tkStart, limit) => {
    const edits = [];
    collectEdits(code, tkStart, limit, edits);
    collected.push(...edits);
  };
  const hasMarkup = (text) => /<\s*[a-zA-Z/!]/.test(text);

  // ── 1. Sink langsung: .innerHTML = `...` ──
  for (const m of [...code.matchAll(/\.innerHTML\s*=/g)]) {
    const span = statementSpan(code, m.index);
    if (!span) continue;
    for (let i = span.start; i < span.end; i++) {
      if (code[i] !== '`') continue;
      collect(i + 1, span.end);
      const close = findTemplateEnd(code, i + 1);
      if (close < 0 || close >= span.end) break;
      i = close;
    }
  }

  // ── 2. Fungsi pembangun markah yang hasilnya dipasang ke innerHTML ──
  //    Contoh: el.innerHTML = renderTabContent(tabId)
  //            el.innerHTML = this.renderTabContent(tabId)
  //    Escaping harus terjadi di dalam fungsi tersebut, bukan di pemasangan.
  const builderNames = new Set();
  for (const m of code.matchAll(/\.innerHTML\s*=\s*((?:this\.)?[A-Za-z_$][\w$.]*)\s*\(/g)) {
    builderNames.add(m[1]);
  }
  for (const full of builderNames) {
    const name = full.split('.').pop();
    const defRe = new RegExp(
      `(?:function\\s+${name}\\s*\\(|${name.replace(/\./g, '\\.')}\\s*\\([^)]*\\)\\s*\\{|(?:const|let|var)\\s+${name}\\s*=\\s*(?:async\\s*)?(?:\\([^)]*\\)|[A-Za-z_$][\\w$]*)\\s*=>)`,
      'g'
    );
    for (const def of code.matchAll(defRe)) {
      const braceAt = code.indexOf('{', def.index + def[0].length - 1);
      if (braceAt < 0) continue;
      const bodyEnd = matchBrace(code, braceAt + 1);
      if (bodyEnd < 0) continue;
      if (!hasMarkup(code.slice(braceAt, bodyEnd))) continue;
      for (let i = braceAt; i < bodyEnd; i++) {
        if (code[i] !== '`') continue;
        collect(i + 1, bodyEnd);
        const close = findTemplateEnd(code, i + 1);
        if (close < 0 || close >= bodyEnd) break;
        i = close;
      }
    }
  }

  // ── 3b. Semua template literal yang MEMANG berisi markah ──
  //
  // Banyak pembangun markah dipanggil dari berkas lain
  // (mis. `el.innerHTML = renderAccessibilityCard(...)` di halaman lain),
  // sehingga penelusuran per-berkas tidak menemukannya. Aturannya di sini
  // sederhana dan aman: setiap template literal yang memuat tag nyata
  // (`<div`, `<span`, `<td`, …) adalah markah, jadi data di dalamnya
  // di-escape. escapeHtml(number) === String(number), jadi angka tidak
  // berubah, dan nilai di dalam atribut di-decode ulang oleh peramban.
  if (!NON_MARKUP_FILE.test(relPath)) {
    for (let i = 0; i < code.length; i++) {
      if (code[i] !== '`') continue;
      const close = findTemplateEnd(code, i + 1);
      if (close < 0) break;
      const body = code.slice(i + 1, close);
      // hanya template yang memuat tag, dan punya interpolasi
      if (/<\s*[a-zA-Z][\w-]*[\s/>]/.test(body) && body.includes('${')) {
        collect(i + 1, close);
      }
      i = close;
    }
  }

  // ── 3. Variabel perantara yang nanti dipasang ke innerHTML ──
  //    Contoh: const quickActionsHtml = `...`;  el.innerHTML = quickActionsHtml;
  const varNames = new Set();
  for (const m of code.matchAll(/\.innerHTML\s*=\s*([A-Za-z_$][\w$]*)\s*[;\n]/g)) {
    if (!builderNames.has(m[1])) varNames.add(m[1]);
  }
  for (const name of varNames) {
    const defRe = new RegExp(`(?:const|let|var)\\s+${name}\\s*=\\s*`, 'g');
    for (const def of code.matchAll(defRe)) {
      const from = def.index + def[0].length;
      const tk = code.indexOf('`', from);
      if (tk < 0 || tk - from > 60) continue;
      collect(tk + 1, code.length);
      const close = findTemplateEnd(code, tk + 1);
      if (close < 0) break;
    }
  }

  return collected;
}

function processFile(file) {
  const code = readFileSync(file, 'utf8');
  const collected = collectEscapes(code, rel(file));
  if (!collected.length) return { changes: [], code };

  const { code: out, edits } = applyAll(code, collected);
  const changes = edits
    .map(e => ({ file: rel(file), offset: e.start, before: e.expr, after: `escapeHtml(${e.expr})` }))
    .sort((a, b) => a.offset - b.offset);
  const finalCode = ensureImport(out, file);
  if (!DRY) writeFileSync(file, finalCode);
  return { changes, code: finalCode };
}

/** Indeks backtick penutup template yang dibuka pada `start`. */
function findTemplateEnd(code, start) {
  let i = start;
  const n = code.length;
  while (i < n) {
    const ch = code[i];
    if (ch === '\\') { i += 2; continue; }
    if (ch === '`') return i;
    if (ch === '$' && code[i + 1] === '{') {
      const e = matchBrace(code, i + 2);
      if (e < 0) return -1;
      i = e + 1; continue;
    }
    i++;
  }
  return -1;
}

const rel = (p) => path.relative(ROOT, p).replace(/\\/g, '/');

// ── Jalankan (hanya bila dipanggil langsung, bukan saat di-import tes) ──────
const _isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (_isMain) {
const files = ONLY
  ? [path.resolve(ROOT, ONLY)].filter(f => existsSync(f))
  : walk(SRC);

const report = { filesTouched: 0, totalEdits: 0, byFile: {}, dryRun: DRY };
let touchedCode = 0;
for (const f of files) {
  const { changes, code } = processFile(f);
  if (!changes.length) continue;
  touchedCode++;
  report.filesTouched++;
  report.totalEdits += changes.length;
  report.byFile[rel(f)] = changes.length;
  if (VERBOSE) {
    console.log(`\n${rel(f)}  (${changes.length} ekspresi)`);
    for (const c of changes.slice(0, 8)) console.log(`   ${c.before}  →  ${c.after}`);
    if (changes.length > 8) console.log(`   … dan ${changes.length - 8} lagi`);
  }
}

console.log(`\n${'='.repeat(72)}`);
console.log(`  ${DRY ? 'DRY-RUN (tidak ada berkas diubah)' : 'CODEMOD DITERAPKAN'}`);
console.log(`${'='.repeat(72)}`);
console.log(`  Berkas diperiksa ............. ${files.length}`);
console.log(`  Berkas disentuh .............. ${report.filesTouched}`);
console.log(`  Ekspresi di-escape ........... ${report.totalEdits}`);
console.log(`${'='.repeat(72)}\n`);

if (JSON_OUT) {
  writeFileSync(JSON_OUT, JSON.stringify(report, null, 2));
  console.log(`  Laporan: ${JSON_OUT}\n`);
}
}
