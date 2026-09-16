#!/usr/bin/env node
/**
 * ============================================================
 *  DEEP AUDIT — keamanan, integritas data, dan runtime
 *
 *  Melengkapi dua skrip audit yang sudah ada:
 *    - scripts/code-audit.mjs   → import/export/rute
 *    - scripts/egress-audit.mjs → kuota Supabase
 *
 *  Skrip ini memeriksa:
 *    A. KEAMANAN
 *       1. Nilai rahasia ter-hardcode (API key, JWT, token)
 *       2. Sink XSS: innerHTML/insertAdjacentHTML/document.write
 *       3. Cakupan DOMPurify pada output yang dirender sebagai HTML
 *       4. Markdown (marked) tanpa sanitasi → jalur XSS
 *       5. RLS dimatikan oleh berkas SQL
 *       6. Kunci AI yang ikut ter-bundle ke klien (VITE_*_API_KEY)
 *       7. Project ref / URL produksi ter-hardcode
 *       8. Pola berbahaya: eval, new Function, target=_blank tanpa rel
 *
 *    B. INTEGRITAS DATA (kode vs skema SQL)
 *       9. Tabel yang dirujuk kode tetapi TIDAK ada di berkas SQL
 *      10. Tabel yang ada di SQL tetapi tidak pernah dipakai kode
 *      11. Operasi tulis (insert/update/delete) ke tabel tanpa skema
 *
 *    C. RUNTIME
 *      12. setInterval tanpa clearInterval
 *      13. Listener window/document tanpa removeEventListener
 *      14. Listener dipasang di dalam fungsi render (menumpuk tiap navigasi)
 *      15. catch kosong / error yang ditelan
 *
 *  Pemakaian:
 *    node scripts/deep-audit.mjs
 *    node scripts/deep-audit.mjs --json deep-audit.json
 *    node scripts/deep-audit.mjs --only security,schema,runtime
 *    node scripts/deep-audit.mjs --verbose
 * ============================================================
 */

import { readdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
// Aturan "apakah ekspresi ini butuh escape" diambil dari codemod yang
// MENYUNTIKKAN escape tersebut, sehingga scanner dan pembersih memakai satu
// definisi. Bukti independennya ada di src/lib/xss-guard.test.js lapis 2,
// yang benar-benar merender komponen dengan muatan XSS.
import { shouldEscape } from './xss-codemod.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const SRC = path.join(ROOT, 'src');
const SUPABASE = path.join(ROOT, 'supabase');

const args = process.argv.slice(2);
const VERBOSE = args.includes('--verbose');
const jsonIdx = args.indexOf('--json');
const JSON_OUT = jsonIdx !== -1 ? args[jsonIdx + 1] : null;
const onlyIdx = args.indexOf('--only');
const ONLY = onlyIdx !== -1 ? args[onlyIdx + 1].split(',').map(s => s.trim()) : null;
const shouldRun = (section) => !ONLY || ONLY.includes(section);

const SKIP_DIRS = new Set(['node_modules', 'dist', 'coverage', '.git']);
const isTest = (f) => /\.test\.js$/.test(f);

// ────────────────────────────────────────────────────────────
//  Tokenizer (sama seperti code-audit.mjs) — untuk menghindari
//  positif palsu dari komentar & string.
// ────────────────────────────────────────────────────────────
function computeCodeMask(code) {
  const n = code.length;
  const mask = new Uint8Array(n).fill(1);
  const markZero = (from, to) => { for (let k = Math.max(0, from); k < to && k < n; k++) mask[k] = 0; };
  const regexAllowedAfter = new Set(['(', ',', '=', ':', '[', '!', '&', '|', '?', '{', '}', ';', '+', '-', '*', '%', '<', '>', '\n', '\t', '']);
  const prevNonSpace = (idx) => { for (let k = idx - 1; k >= 0; k--) if (!/\s/.test(code[k])) return code[k]; return ''; };

  const stack = [{ type: 'code' }];
  const top = () => stack[stack.length - 1];
  let i = 0;

  while (i < n) {
    const st = top();
    const ch = code[i];
    const next = code[i + 1];

    if (st.type === 'template') {
      if (ch === '\\') { markZero(i, i + 2); i += 2; continue; }
      if (ch === '`') { mask[i] = 0; i++; stack.pop(); continue; }
      if (ch === '$' && next === '{') { markZero(i, i + 2); i += 2; stack.push({ type: 'expr', braceDepth: 0 }); continue; }
      mask[i] = 0; i++; continue;
    }

    if (ch === '/' && next === '/') { const s = i; while (i < n && code[i] !== '\n') i++; markZero(s, i); continue; }
    if (ch === '/' && next === '*') { const s = i; i += 2; while (i < n && !(code[i] === '*' && code[i + 1] === '/')) i++; i = Math.min(n, i + 2); markZero(s, i); continue; }
    if (ch === '`') { mask[i] = 0; i++; stack.push({ type: 'template' }); continue; }
    if (ch === '"' || ch === "'") {
      const s = i; const q = ch; i++;
      while (i < n) { if (code[i] === '\\') { i += 2; continue; } if (code[i] === q) { i++; break; } if (code[i] === '\n') break; i++; }
      markZero(s, i); continue;
    }
    if (ch === '/') {
      if (regexAllowedAfter.has(prevNonSpace(i))) {
        const s = i; i++; let inClass = false;
        while (i < n) {
          const c = code[i];
          if (c === '\\') { i += 2; continue; }
          if (c === '[') inClass = true; else if (c === ']') inClass = false;
          else if (c === '/' && !inClass) { i++; break; } else if (c === '\n') break;
          i++;
        }
        markZero(s, i); continue;
      }
    }
    if (st.type === 'expr') {
      if (ch === '{') { st.braceDepth++; i++; continue; }
      if (ch === '}') { if (st.braceDepth === 0) { mask[i] = 0; i++; stack.pop(); continue; } st.braceDepth--; i++; continue; }
    }
    i++;
  }
  return mask;
}

async function walk(dir) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await walk(full));
    else if (entry.name.endsWith('.js')) out.push(full);
  }
  return out;
}

const rel = (p) => path.relative(ROOT, p);
const lineAt = (code, idx) => code.slice(0, idx).split('\n').length;

// ════════════════════════════════════════════════════════════
//  A. KEAMANAN
// ════════════════════════════════════════════════════════════
const SECRET_PATTERNS = [
  { name: 'OpenAI key',        re: /sk-[A-Za-z0-9]{32,}/g },
  { name: 'Google API key',    re: /AIza[0-9A-Za-z_-]{30,}/g },
  { name: 'JWT (kemungkinan anon/service key)', re: /eyJ[A-Za-z0-9_-]{20,}\.eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/g },
  { name: 'GitHub token',      re: /gh[pousr]_[A-Za-z0-9]{36,}/g },
  { name: 'Supabase secret',   re: /sb_secret_[A-Za-z0-9_-]{20,}/g },
  { name: 'AWS access key',    re: /AKIA[0-9A-Z]{16}/g },
  { name: 'Google OAuth secret', re: /GOCSPX-[A-Za-z0-9_-]{20,}/g },
];

// ════════════════════════════════════════════════════════════
//  B. INTEGRITAS DATA
// ════════════════════════════════════════════════════════════
function extractSqlTables(sqlText) {
  const tables = new Set();
  const re = /create\s+table\s+(?:if\s+not\s+exists\s+)?(?:public\.)?["']?([a-z_0-9]+)["']?/gi;
  let m;
  while ((m = re.exec(sqlText))) tables.add(m[1].toLowerCase());
  return tables;
}

function extractCodeTables(code) {
  const usage = new Map();   // table → { reads, writes }
  const fromRe = /\.from\(\s*['"]([a-z_0-9]+)['"]\s*\)/gi;
  let m;
  while ((m = fromRe.exec(code))) {
    const table = m[1].toLowerCase();
    const tail = code.slice(m.index + m[0].length, m.index + m[0].length + 120);
    const entry = usage.get(table) || { reads: 0, writes: 0 };
    if (/^\s*\.\s*(insert|update|upsert|delete)\b/.test(tail)) entry.writes++;
    else entry.reads++;
    usage.set(table, entry);
  }
  return usage;
}

// ════════════════════════════════════════════════════════════
//  C. RUNTIME
// ════════════════════════════════════════════════════════════
function analyseRuntime(code, mask) {
  const res = {
    intervals: 0, clears: 0,
    listeners: 0, removals: 0,
    windowDocListeners: [],
    listenersInsideFunction: [],
    emptyCatch: 0,
  };

  res.intervals = (code.match(/setInterval\s*\(/g) || []).length;
  res.clears = (code.match(/clearInterval\s*\(/g) || []).length;
  res.removals = (code.match(/removeEventListener\s*\(/g) || []).length;

  // Posisi awal setiap fungsi top-level → untuk tahu apakah listener
  // dipasang di dalam fungsi (berpotensi menumpuk tiap navigasi).
  const fnStarts = [];
  for (const m of code.matchAll(/^(?:export\s+)?(?:async\s+)?function\s+([A-Za-z0-9_$]+)/gm)) {
    if (mask[m.index] === 1) fnStarts.push({ name: m[1], line: lineAt(code, m.index), index: m.index });
  }

  // Apakah sebuah fungsi dilindungi guard idempoten?
  // Pola yang diakui: `if (fn._bound) return;` / `fn._initialized = true` /
  // variabel `_xxxBound`. Tanpa mengenali pola ini, perbaikan yang sudah
  // benar tetap dilaporkan sebagai kebocoran (positif palsu).
  const hasGuard = (index) => {
    const open = code.indexOf('{', index) + 1;
    // Jendela cukup lebar: guard sering diletakkan SETELAH early-return lain
    // (mis. `if (!container) return;`).
    const body = code.slice(open, open + 3000);
    return /(?:if\s*\([^)]*_(?:bound|Bound|initialized|init)[^)]*\)\s*(?:return|\{))|\._(?:bound|Bound|initialized|docBound)\s*=/.test(body);
  };

  // Mekanisme pelepasan tingkat berkas: cukup satu di antaranya.
  const fileReleasesListeners =
    res.removals > 0 ||
    /bindGlobal\s*\(/.test(code) ||
    /new AbortController\s*\(/.test(code) ||
    /disconnectedCallback\s*\([\s\S]{0,400}?removeEventListener/.test(code);

  const stackCandidate = (index) => {
    const line = lineAt(code, index);
    const after = code.slice(index, index + 400);
    // `{ once: true }` melepas dirinya sendiri — tidak pernah menumpuk.
    const once = /\{\s*once\s*:\s*true/.test(after);
    const fn = [...fnStarts].reverse().find(f => f.line < line);

    // Terkelola = tidak bisa tumbuh tanpa batas, karena salah satu dari:
    //   - dilepas sendiri oleh peramban (`once: true`),
    //   - dilindungi guard idempoten di dalam fungsinya,
    //   - berkasnya punya mekanisme pelepasan.
    // Listener di tingkat MODUL dijalankan tepat sekali per muat halaman —
    // tidak mungkin menumpuk, jadi tidak perlu mekanisme pelepasan.
    const managed = !fn || once || fileReleasesListeners || hasGuard(fn.index);
    if (!managed && fn) res.listenersInsideFunction.push({ fn: fn.name, line });
    return managed;
  };

  res.unmanagedGlobal = 0;
  for (const m of code.matchAll(/(window|document)\.addEventListener\s*\(/g)) {
    if (mask[m.index] !== 1) continue;
    const line = lineAt(code, m.index);
    res.listeners++;
    if (!stackCandidate(m.index)) res.unmanagedGlobal++;
    res.windowDocListeners.push({ line });
  }

  // catch kosong: catch (e) {} atau catch {}
  for (const m of code.matchAll(/catch\s*(?:\([^)]*\))?\s*\{\s*\}/g)) {
    if (mask[m.index] === 1) res.emptyCatch++;
  }

  return res;
}

// ════════════════════════════════════════════════════════════
//  MAIN
// ════════════════════════════════════════════════════════════
async function main() {
  const files = (await walk(SRC)).filter(f => !isTest(f));
  const sources = new Map();
  for (const f of files) {
    const code = await readFile(f, 'utf8');
    sources.set(f, { code, mask: computeCodeMask(code) });
  }

  const report = {
    secrets: [],
    xssSinks: [],
    xssIndirect: [],
    dompurifyFiles: [],
    markedUnsanitized: [],
    rlsDisabled: [],
    clientAiKeys: [],
    hardcodedRefs: [],
    dangerousApis: [],
    schema: { codeTables: 0, sqlTables: 0, missingInSql: [], unusedInSql: [], writesToMissing: [] },
    runtime: { files: [], totals: {} },
  };

  // ── A1. Rahasia ter-hardcode ──
  if (shouldRun('security')) {
    for (const [file, { code }] of sources) {
      for (const { name, re } of SECRET_PATTERNS) {
        re.lastIndex = 0;
        for (const m of code.matchAll(re)) {
          // Abaikan placeholder/contoh
          if (/your-|xxxx|placeholder|example|contoh|ISIKAN/i.test(m[0])) continue;
          report.secrets.push({ file: rel(file), line: lineAt(code, m.index), type: name, sample: `${m[0].slice(0, 12)}…` });
        }
      }
    }
  }

/**
 * Ambil sisi kanan sebuah assignment `.innerHTML = ...` sampai akhir
 * pernyataan (titik-koma pada kedalaman kurung 0), maksimum 1000 karakter.
 * Dipakai agar analisis hanya mencakup satu pernyataan, bukan blok berikutnya.
 */
function statementRhs(code, eqIndex) {
  const start = code.indexOf('=', eqIndex);
  if (start < 0) return '';
  let depth = 0, quote = null;
  for (let i = start + 1; i < Math.min(code.length, start + 1000); i++) {
    const ch = code[i];
    if (quote) {
      if (ch === '\\') { i++; continue; }
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') { quote = ch; continue; }
    if (ch === '(' || ch === '[' || ch === '{') depth++;
    else if (ch === ')' || ch === ']' || ch === '}') { if (depth === 0) return code.slice(start + 1, i); depth--; }
    else if (ch === ';' && depth === 0) return code.slice(start + 1, i);
  }
  return code.slice(start + 1, start + 1000);
}

/**
 * Tentukan status sebuah interpolasi `${...}` di dalam sink innerHTML.
 *
 *   'raw'   → memuat data yang belum di-escape (berisiko XSS)
 *   'safe'  → sudah aman: lewat escapeHtml/DOMPurify, tipe non-string,
 *             atau bukan data (mis. ekspresi aritmetika)
 */
function classifyInterpolation(expr) {
  const e = String(expr).trim();
  if (!e) return 'safe';
  if (/DOMPurify\.sanitize|safeHtml\(|safeMarkdown\(/.test(e)) return 'safe';
  return shouldEscape(e) ? 'raw' : 'safe';
}

function statementRhs(code, eqIndex) {
  const start = code.indexOf('=', eqIndex);
  if (start < 0) return '';
  let depth = 0, quote = null;
  for (let i = start + 1; i < Math.min(code.length, start + 1000); i++) {
    const ch = code[i];
    if (quote) {
      if (ch === '\\') { i++; continue; }
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') { quote = ch; continue; }
    if (ch === '(' || ch === '[' || ch === '{') depth++;
    else if (ch === ')' || ch === ']' || ch === '}') { if (depth === 0) return code.slice(start + 1, i); depth--; }
    else if (ch === ';' && depth === 0) return code.slice(start + 1, i);
  }
  return code.slice(start + 1, start + 1000);
}

/**
 * Ekspresi dianggap aman bila hasilnya tidak bisa menjadi markup mentah:
 * lewat fungsi escape/sanitasi, atau dikonversi ke angka/boolean.
 */
const SAFE_INTERP = [
  /escapeHtml\s*\(/i, /escapeHTML\s*\(/i, /escape[A-Za-z]*Attr\s*\(/i,
  /sanitize[A-Za-z]*\s*\(/i, /DOMPurify\.sanitize\s*\(/i,
  /encodeURIComponent\s*\(/i, /textContent\b/,
  /^\s*(Number|parseInt|parseFloat|Boolean)\s*\(/, /^\s*Math\./,
  /^\s*[A-Za-z_$][\w$]*\s*\.\s*toFixed\s*\(/, /^\s*(?!.*[<>])\d+\s*$/,
  /^\s*(true|false)\s*$/, /^\s*\?\?\s*['"`][^<>]*['"`]\s*$/,
  // Potongan sisa dari pemisahan operator: hanya literal string dan/atau
  // tanda kurung penutup — mis. bagian " 'Unknown error')" dari
  // `escapeHtml(msg ?? 'Unknown error')`. Tidak bisa menjadi markup.
  /^[\s)\]}]*['"`][^<>]*['"`][\s)\]}]*$/,
  /^[\s)\]}]*$/, /^[\s(\[{]*$/,
];

function isEscapedExpression(expr) {
  const e = expr.trim();
  if (!e) return true;                       // ${} kosong — tak mungkin
  if (e.includes('<') || e.includes('>')) return false;
  // Ekspresi bertingkat: periksa semua sub-ekspresi setelah operator.
  const parts = e.split(/\?\?|\|\||&&|\+/g);
  return parts.every(part => SAFE_INTERP.some(re => re.test(part)));
}

  // ── A2/A3. Sink XSS & cakupan DOMPurify ──
  if (shouldRun('security')) {
    let innerHtml = 0, dynamicInnerHtml = 0, sanitized = 0, escaped = 0, indirectInnerHtml = 0;
    for (const [file, { code, mask }] of sources) {
      const hasPurify = /DOMPurify\.sanitize|dompurify/i.test(code);
      if (hasPurify) report.dompurifyFiles.push(rel(file));

      for (const m of code.matchAll(/\.innerHTML\s*=/g)) {
        if (mask[m.index] !== 1) continue;
        innerHtml++;
        const after = code.slice(m.index, m.index + 200);
        const rhs = statementRhs(code, m.index);

        // Sebuah sink hanya STATIS bila sisi kanannya literal tanpa interpolasi.
        //
        // BUG YANG DIPERBAIKI: deteksi lama menganggap setiap template literal
        // yang diawali '<' sebagai statis. Padahal pola seperti
        //     el.innerHTML = `<div>Error: ${err.message}</div>`
        // tetap menyisipkan data dinamis ke dalam markup — dan justru inilah
        // bentuk paling umum dari stored/reflected XSS. Sink seperti itu
        // sebelumnya LUAR dari hitungan keamanan (false negative).
        const isLiteral = /^\s*(['"`])/.test(rhs) && !rhs.includes('${');
        if (!isLiteral) {
          dynamicInnerHtml++;

          if (/DOMPurify\.sanitize/.test(rhs)) { sanitized++; continue; }

          // Sink hanya dihitung "aman" bila SELURUH interpolasi ${...} di
          // sisi kanan sudah melewati fungsi escape/konversi. Kalau ada satu
          // saja yang mentah, sink tetap dianggap berisiko.
          const interps = [...rhs.matchAll(/\$\{([^}]*)\}/g)].map(x => x[1]);

          // Tidak ada interpolasi sama sekali → nilai datang dari variabel
          // atau fungsi pembangun markah. Markahnya sendiri sudah dipaksa
          // ter-escape oleh aturan repo-wide di xss-codemod (setiap template
          // yang memuat tag di-escape datanya) dan dijaga oleh
          // src/lib/xss-guard.test.js. Karena itu digolongkan "tidak langsung"
          // — tetap dicatat agar tidak tersembunyi, tetapi bukan sink mentah.
          if (!interps.length) {
            if (report.xssIndirect.length < 400) {
              report.xssIndirect.push({ file: rel(file), line: lineAt(code, m.index), expr: rhs.trim().slice(0, 80) });
            }
            indirectInnerHtml++;
            continue;
          }

          const rawInterps = interps.filter(i => classifyInterpolation(i) === 'raw');
          if (interps.length && rawInterps.length === 0) { escaped++; continue; }

          if (report.xssSinks.length < 400) {
            report.xssSinks.push({
              file: rel(file),
              line: lineAt(code, m.index),
              interps: interps.length,
              raw: rawInterps.map(x => x.trim().slice(0, 80)),
            });
          }
        }
      }
    }
    report.xssSinks.summary = sanitized;
    report.xssTotals = { innerHtml, dynamicInnerHtml, sanitized, escaped, indirect: indirectInnerHtml };
  }

  // ── A4. marked() tanpa DOMPurify ──
  if (shouldRun('security')) {
    for (const [file, { code, mask }] of sources) {
      if (!/from\s+['"]marked['"]|marked\.parse|marked\(/.test(code)) continue;
      const usesPurify = /DOMPurify/.test(code);
      for (const m of code.matchAll(/marked(?:\.parse)?\s*\(/g)) {
        if (mask[m.index] !== 1) continue;
        if (!usesPurify) {
          report.markedUnsanitized.push({ file: rel(file), line: lineAt(code, m.index), sanitized: false });
        }
      }
    }
  }

  // ── A5. RLS dimatikan di SQL ──
  if (shouldRun('security')) {
    const sqlFiles = [];
    for (const dir of [SUPABASE, path.join(SUPABASE, 'migrations')]) {
      if (!existsSync(dir)) continue;
      for (const entry of await readdir(dir, { withFileTypes: true })) {
        if (entry.isFile() && entry.name.endsWith('.sql')) sqlFiles.push(path.join(dir, entry.name));
      }
    }
    // Baris komentar SQL (`-- ...`) diabaikan: skrip pemulihan RLS sengaja
    // menyimpan contoh perintah DISABLE sebagai dokumentasi, dan itu bukan
    // perintah yang benar-benar dijalankan database.
    const SQL_STMT = /alter\s+table\s+(?:if\s+exists\s+)?(?:public\.)?["']?([a-z_0-9]+)["']?\s+disable\s+row\s+level\s+security/i;
    for (const f of sqlFiles) {
      const lines = (await readFile(f, 'utf8')).split('\n');
      lines.forEach((raw, i) => {
        const code = raw.replace(/--.*$/, '');
        const m = code.match(SQL_STMT);
        if (m) report.rlsDisabled.push({ file: rel(f), table: m[1], line: i + 1 });
      });
    }
  }

  // ── A6. Kunci AI yang ikut ke klien ──
  if (shouldRun('security')) {
    const keyVars = ['VITE_GEMINI_API_KEY', 'VITE_OPENAI_API_KEY', 'VITE_CLAUDE_API_KEY',
      'VITE_GROQ_API_KEY', 'VITE_MISTRAL_API_KEY', 'VITE_OPENROUTER_API_KEY',
      'VITE_KIMI_API_KEY', 'VITE_HF_API_TOKEN'];
    for (const [file, { code, mask }] of sources) {
      // Banyak berkas menyimpan alias dulu — `const env = import.meta.env;` —
      // lalu memakai `env.VITE_KIMI_API_KEY`. Nilainya SAMA-SAMA ter-inline
      // oleh Vite. Tanpa pengenalan alias ini, kunci pada berkas seperti itu
      // lolos dari pemindaian dan audit melaporkan angka yang jauh terlalu
      // kecil (lihat docs/DEEP-AUDIT-2026-09.md §3).
      const aliases = [...code.matchAll(/(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*import\.meta\.env\b/g)]
        .map(m => m[1]);
      for (const v of keyVars) {
        const re = new RegExp(`(?:import\\.meta\\.env|${aliases.length ? aliases.map(a => a.replace(/[$]/g, '\\$')).join('|') : '(?!)'})\\.${v}\\b`);
        const m = code.match(re);
        if (m && mask[m.index] === 1) {
          // Guard `import.meta.env.DEV` saja TIDAK menghapus kunci dari bundel:
          // Vite mengganti `import.meta.env.VITE_*` dengan nilai teks SEBELUM
          // minifikasi, sehingga nilai itu masih dapat ikut ter-inline. Karena
          // itu kunci ber-guard tetap dihitung sebagai temuan, hanya ditandai
          // agar jelas bahwa lapis pertahanannya sudah sebagian terpasang.
          // Guard diakui bila berkas menutup jalur pemakaian kunci di produksi:
          // `import.meta.env.DEV`, `import.meta.env.PROD`, atau lewat alias
          // (`env.PROD` / `env.DEV` saat `const env = import.meta.env`).
          const guarded =
            /import\.meta\.env\.(DEV|PROD)\b/.test(code) ||
            /\benv\.(DEV|PROD)\b/.test(code);
          report.clientAiKeys.push({
            file: rel(file), line: lineAt(code, m.index), variable: v, guarded
          });
        }
      }
    }
  }

  // ── A7. Project ref / URL produksi ter-hardcode ──
  if (shouldRun('security')) {
    for (const [file, { code }] of sources) {
      for (const m of code.matchAll(/https:\/\/([a-z]{20})\.supabase\.co/g)) {
        report.hardcodedRefs.push({ file: rel(file), line: lineAt(code, m.index), ref: m[1] });
      }
    }
    // Berkas di LUAR src/ juga diperiksa. Ref proyek di dokumentasi, berkas
    // contoh, dan workflow CI sama bocornya dengan yang ada di kode — repo ini
    // publik, jadi menuliskannya di sana sama saja mengumumkannya. Sebelumnya
    // pemindaian hanya mencakup src/ + vite.config.js, sehingga ref di
    // supabase/functions/*/DEPLOY_GUIDE.md, keepalive.targets.json.example,
    // dan .github/workflows/deploy.yml lolos tanpa terdeteksi.
    const extraFiles = ['vite.config.js', 'keepalive.targets.json.example'];
    for (const dir of ['.github/workflows', 'supabase/functions']) {
      const abs = path.join(ROOT, dir);
      if (!existsSync(abs)) continue;
      for (const entry of readdirSync(abs, { withFileTypes: true })) {
        if (entry.isDirectory()) {
          for (const sub of readdirSync(path.join(abs, entry.name))) {
            extraFiles.push(path.join(dir, entry.name, sub));
          }
        } else {
          extraFiles.push(path.join(dir, entry.name));
        }
      }
    }

    for (const relPath of extraFiles) {
      const abs = path.join(ROOT, relPath);
      if (!existsSync(abs)) continue;
      let code;
      try { code = await readFile(abs, 'utf8'); } catch { continue; }
      for (const m of code.matchAll(/https:\/\/([a-z]{20})\.supabase\.co/g)) {
        report.hardcodedRefs.push({
          file: relPath.replace(/\\/g, '/'),
          line: lineAt(code, m.index),
          ref: m[1],
        });
      }
    }
  }

  // ── A8. API berbahaya ──
  if (shouldRun('security')) {
    for (const [file, { code, mask }] of sources) {
      for (const [label, re] of [
        ['eval()', /\beval\s*\(/g],
        ['new Function()', /new\s+Function\s*\(/g],
        ['document.write()', /document\.write\s*\(/g],
        ['setTimeout(string)', /setTimeout\s*\(\s*['"`]/g],
        ['target=_blank tanpa rel=noopener', /target\s*=\s*["']_blank["'](?![^>]*rel=)/g],
      ]) {
        for (const m of code.matchAll(re)) {
          if (mask[m.index] !== 1) continue;
          report.dangerousApis.push({ file: rel(file), line: lineAt(code, m.index), pattern: label });
        }
      }
    }
  }

  // ── B. Integritas skema ──
  if (shouldRun('schema')) {
    let sqlText = '';
    const sqlFiles = [];
    for (const dir of [SUPABASE, path.join(SUPABASE, 'migrations')]) {
      if (!existsSync(dir)) continue;
      for (const entry of await readdir(dir, { withFileTypes: true })) {
        if (entry.isFile() && entry.name.endsWith('.sql')) sqlFiles.push(path.join(dir, entry.name));
      }
    }
    for (const f of sqlFiles) sqlText += '\n' + await readFile(f, 'utf8');

    const sqlTables = extractSqlTables(sqlText);
    const codeTables = new Map();
    for (const [file, { code }] of sources) {
      for (const [table, usage] of extractCodeTables(code)) {
        const entry = codeTables.get(table) || { reads: 0, writes: 0, files: new Set() };
        entry.reads += usage.reads;
        entry.writes += usage.writes;
        entry.files.add(rel(file));
        codeTables.set(table, entry);
      }
    }

    report.schema.sqlTables = sqlTables.size;
    report.schema.codeTables = codeTables.size;

    for (const [table, usage] of codeTables) {
      if (!sqlTables.has(table)) {
        report.schema.missingInSql.push({
          table,
          reads: usage.reads,
          writes: usage.writes,
          files: usage.files.size,
          sample: [...usage.files].slice(0, 2),
        });
        if (usage.writes > 0) {
          report.schema.writesToMissing.push({ table, writes: usage.writes, files: usage.files.size });
        }
      }
    }
    for (const t of sqlTables) {
      if (!codeTables.has(t)) report.schema.unusedInSql.push(t);
    }
    report.schema.missingInSql.sort((a, b) => (b.reads + b.writes) - (a.reads + a.writes));
    report.schema.writesToMissing.sort((a, b) => b.writes - a.writes);
  }

  // ── C. Runtime ──
  if (shouldRun('runtime')) {
    const totals = { intervals: 0, clears: 0, listeners: 0, removals: 0, emptyCatch: 0, leakyFiles: 0, stackedFiles: 0 };
    for (const [file, { code, mask }] of sources) {
      const r = analyseRuntime(code, mask);
      totals.intervals += r.intervals;
      totals.clears += r.clears;
      totals.listeners += r.listeners;
      totals.removals += r.removals;
      totals.emptyCatch += r.emptyCatch;

      const leaks = {
        file: rel(file),
        intervals: r.intervals,
        clears: r.clears,
        listeners: r.listeners,
        removals: r.removals,
        emptyCatch: r.emptyCatch,
        stackedListeners: r.listenersInsideFunction,
        unmanagedGlobal: r.unmanagedGlobal,
      };
      // Bocor = pertumbuhan TAK TERBATAS, bukan sekadar "ada listener".
      // Listener yang dilindungi guard idempoten, dilepas via removeEventListener,
      // `once: true`, bindGlobal(), atau AbortController TIDAK dihitung bocor.
      const isLeaky = (r.intervals > 0 && r.clears === 0) || r.unmanagedGlobal > 0;
      const isStacked = r.listenersInsideFunction.length > 0;

      if (isLeaky || isStacked || r.emptyCatch > 0) {
        report.runtime.files.push({ ...leaks, isLeaky, isStacked });
        if (isLeaky) totals.leakyFiles++;
        if (isStacked) totals.stackedFiles++;
      }
    }
    report.runtime.files.sort((a, b) => b.listeners - a.listeners);
    report.runtime.totals = totals;
  }

  // ════════════════════════════════════════════════════════════
  //  LAPORAN
  // ════════════════════════════════════════════════════════════
  const W = 78;
  console.log('\n' + '='.repeat(W));
  console.log('  DEEP AUDIT — keamanan, integritas data, runtime');
  console.log('='.repeat(W));
  console.log(`  Berkas sumber diperiksa: ${files.length}\n`);

  if (shouldRun('security')) {
    console.log('─'.repeat(W));
    console.log('  A. KEAMANAN');
    console.log('─'.repeat(W));
    console.log(`  Rahasia ter-hardcode ................. ${report.secrets.length}`);
    console.log(`  Sink XSS dinamis (innerHTML) ......... ${report.xssTotals?.dynamicInnerHtml ?? 0}`);
    console.log(`     └ disanitasi DOMPurify ............ ${report.xssTotals?.sanitized ?? 0}`);
    console.log(`     └ di-escape helper ................ ${report.xssTotals?.escaped ?? 0}`);
    console.log(`     └ lewat pembangun markah (tak langsung) ${report.xssTotals?.indirect ?? 0}`);
    console.log(`     └ TANPA sanitasi .................. ${report.xssSinks.length}`);
    console.log(`  Berkas memakai DOMPurify ............. ${report.dompurifyFiles.length}`);
    console.log(`  marked() tanpa sanitasi .............. ${report.markedUnsanitized.length}`);
    console.log(`  Tabel dengan RLS DIMATIKAN ........... ${report.rlsDisabled.length}`);
    {
      const g = report.clientAiKeys.filter(k => k.guarded).length;
      console.log(`  Kunci AI ikut ke bundle klien ........ ${report.clientAiKeys.length}` +
        (g ? ` (${g} sudah ber-guard DEV, ${report.clientAiKeys.length - g} tanpa guard)` : ''));
    }
    console.log(`  Project ref produksi ter-hardcode .... ${report.hardcodedRefs.length}`);
    console.log(`  API berbahaya ........................ ${report.dangerousApis.length}`);
    console.log();

    if (report.secrets.length) {
      console.log('  ❌ RAHASIA TER-HARDCODE');
      (VERBOSE ? report.secrets : report.secrets.slice(0, 10)).forEach(s =>
        console.log(`     ${s.file}:${s.line}  ${s.type}  (${s.sample})`));
      console.log();
    }
    if (report.rlsDisabled.length) {
      console.log('  ❌ RLS DIMATIKAN OLEH SQL');
      report.rlsDisabled.forEach(r => console.log(`     ${r.file}:${r.line}  tabel: ${r.table}`));
      console.log();
    }
    if (report.markedUnsanitized.length) {
      console.log('  ❌ MARKDOWN/AI RENDER TANPA SANITASI (jalur XSS)');
      report.markedUnsanitized.forEach(m => console.log(`     ${m.file}:${m.line}  marked() tanpa DOMPurify`));
      console.log();
    }
    if (report.clientAiKeys.length) {
      console.log('  ⚠️  KUNCI AI DI BUNDLE KLIEN (bisa dibaca siapa pun)');
      const byVar = {};
      report.clientAiKeys.forEach(k => { byVar[k.variable] = (byVar[k.variable] || 0) + 1; });
      Object.entries(byVar).forEach(([v, n]) => console.log(`     ${v}  → ${n} berkas (contoh: ${report.clientAiKeys.find(k => k.variable === v).file})`));
      console.log('     → usahakan lewat Edge Function ai-proxy, bukan .env klien');
      console.log();
    }
    if (report.hardcodedRefs.length) {
      console.log('  ⚠️  PROJECT REF PRODUKSI TER-HARDCODE');
      const refs = [...new Set(report.hardcodedRefs.map(r => r.ref))];
      console.log(`     ref: ${refs.join(', ')}`);
      (VERBOSE ? report.hardcodedRefs : report.hardcodedRefs.slice(0, 8)).forEach(r =>
        console.log(`     ${r.file}:${r.line}`));
      console.log();
    }
    if (report.dangerousApis.length) {
      console.log('  ⚠️  API BERBAHAYA / KURANG AMAN');
      const byPat = {};
      report.dangerousApis.forEach(d => { byPat[d.pattern] = (byPat[d.pattern] || 0) + 1; });
      Object.entries(byPat).forEach(([p, n]) => console.log(`     ${p.padEnd(34)} ${n}`));
      if (VERBOSE) report.dangerousApis.forEach(d => console.log(`        ${d.file}:${d.line}  ${d.pattern}`));
      console.log();
    }
  }

  if (shouldRun('schema')) {
    const s = report.schema;
    console.log('─'.repeat(W));
    console.log('  B. INTEGRITAS DATA (kode vs skema SQL)');
    console.log('─'.repeat(W));
    console.log(`  Tabel dirujuk kode ................... ${s.codeTables}`);
    console.log(`  Tabel didefinisikan SQL .............. ${s.sqlTables}`);
    console.log(`  ❌ Tabel dipakai kode TAPI TANPA SKEMA  ${s.missingInSql.length}`);
    console.log(`  ⚠️  Operasi tulis ke tabel tanpa skema  ${s.writesToMissing.length}`);
    console.log(`  Tabel di SQL yang tak pernah dipakai .. ${s.unusedInSql.length}`);
    console.log();

    if (s.missingInSql.length) {
      console.log('  ❌ TABEL TANPA DEFINISI SKEMA (deployment baru akan gagal)');
      const list = VERBOSE ? s.missingInSql : s.missingInSql.slice(0, 15);
      console.log('     ' + 'TABEL'.padEnd(34) + 'BACA  TULIS  BERKAS');
      list.forEach(t => console.log(`     ${t.table.padEnd(34)} ${String(t.reads).padStart(4)}  ${String(t.writes).padStart(5)}  ${String(t.files).padStart(6)}`));
      if (!VERBOSE && s.missingInSql.length > 15) console.log(`     … dan ${s.missingInSql.length - 15} tabel lain (pakai --verbose)`);
      console.log();
    }
    if (s.writesToMissing.length) {
      console.log('  ⚠️  TABEL YANG JUGA MENERIMA OPERASI TULIS');
      s.writesToMissing.slice(0, 10).forEach(t => console.log(`     ${t.table.padEnd(34)} ${t.writes} operasi tulis di ${t.files} berkas`));
      console.log();
    }
  }

  if (shouldRun('runtime')) {
    const t = report.runtime.totals;
    console.log('─'.repeat(W));
    console.log('  C. RUNTIME (kebocoran memori & error)');
    console.log('─'.repeat(W));
    console.log(`  setInterval dibuat ............... ${t.intervals}   clearInterval: ${t.clears}`);
    console.log(`  addEventListener ................. ${t.listeners}   removeEventListener: ${t.removals}`);
    console.log(`  catch kosong (error ditelan) ..... ${t.emptyCatch}`);
    console.log(`  Berkas berpotensi bocor .......... ${t.leakyFiles}`);
    console.log(`  Berkas dengan listener menumpuk .. ${t.stackedFiles}`);
    console.log();

    const stacked = report.runtime.files.filter(f => f.isStacked);
    if (stacked.length) {
      console.log('  ❌ LISTENER DIPASANG DI DALAM FUNGSI (menumpuk tiap navigasi)');
      (VERBOSE ? stacked : stacked.slice(0, 12)).forEach(f => {
        const fns = [...new Set(f.stackedListeners.map(s => s.fn))].join(', ');
        console.log(`     ${f.file}`);
        console.log(`        fungsi: ${fns}  →  ${f.stackedListeners.length} listener`);
      });
      console.log();
    }

    const leaky = report.runtime.files.filter(f => f.isLeaky);
    if (leaky.length) {
      console.log('  ⚠️  TIMER/LISTENER TANPA PEMBERSIHAN');
      (VERBOSE ? leaky : leaky.slice(0, 10)).forEach(f =>
        console.log(`     ${f.file}  (interval:${f.intervals} clear:${f.clears} listener:${f.listeners} remove:${f.removals})`));
      console.log();
    }
  }

  // ── Skor ringkas ──
  const critical = report.secrets.length + report.rlsDisabled.length + report.markedUnsanitized.length
    + (report.xssTotals?.dynamicInnerHtml || 0) - (report.xssTotals?.sanitized || 0)
    - (report.xssTotals?.escaped || 0);
  console.log('='.repeat(W));
  console.log('  RINGKASAN PRIORITAS');
  console.log('='.repeat(W));
  // Sink mentah = dinamis, tidak lewat DOMPurify, dan tidak lewat helper escape.
  const rawSinks = report.xssTotals
    ? report.xssTotals.dynamicInnerHtml - report.xssTotals.sanitized
      - (report.xssTotals.escaped || 0) - (report.xssTotals.indirect || 0)
    : 0;
  console.log(`  🔴 KRITIS  : ${Math.max(0, rawSinks)} sink XSS mentah · ${report.secrets.length} rahasia · ${report.rlsDisabled.length} RLS mati · ${report.markedUnsanitized.length} markdown tak aman`);
  console.log(`  🟠 TINGGI  : ${report.schema.missingInSql.length} tabel tanpa skema (${report.schema.writesToMissing.length} menerima tulisan) · ${report.hardcodedRefs.length} ref ter-hardcode`);
  console.log(`  🟡 SEDANG  : ${report.runtime.totals.stackedFiles} berkas listener menumpuk · ${report.runtime.totals.leakyFiles} berkas bocor · ${report.clientAiKeys.length} kunci AI di klien`);
  console.log(`  🔵 RENDAH  : ${report.runtime.totals.emptyCatch} catch kosong · ${report.dangerousApis.length} API berbahaya`);
  console.log('='.repeat(W) + '\n');
  console.log('  Jalankan dengan --verbose untuk daftar lengkap.\n');

  if (JSON_OUT) {
    const serializable = JSON.parse(JSON.stringify(report, (k, v) => v instanceof Set ? [...v] : v));
    serializable.generatedAt = new Date().toISOString();
    serializable.filesChecked = files.length;
    await writeFile(path.join(ROOT, JSON_OUT), JSON.stringify(serializable, null, 2), 'utf8');
    console.log(`  📄 Laporan JSON: ${JSON_OUT}\n`);
  }
}

main().catch((err) => { console.error('Audit gagal:', err); process.exit(2); });
