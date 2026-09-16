#!/usr/bin/env node
/**
 * ============================================================
 *  CODE AUDIT — pemindai kesehatan modul
 *
 *  Yang diperiksa (statis, tanpa menjalankan aplikasi):
 *
 *   1. IMPORT RUSAK      → path relatif/alias yang tidak menunjuk
 *                          ke berkas mana pun.
 *   2. EXPORT RUSAK      → nama yang diimpor tidak diekspor oleh
 *                          modul tujuan (menyebabkan error build/run,
 *                          seperti bug checkAIHealth yang pernah ada).
 *   3. DEPENDENSI HILANG → import paket npm yang tidak terdaftar di
 *                          package.json (lupa npm install).
 *   4. MODUL ORPHAN      → berkas yang tidak diimpor siapa pun
 *                          (kode mati / lupa didaftarkan).
 *   5. ROUTE vs HALAMAN  → halaman di src/pages yang tidak pernah
 *                          dirender oleh router (halaman tidak bisa
 *                          diakses pengguna).
 *   6. IMPORT SIRKULAR   → A → B → A (penyebab bug inisialisasi).
 *
 *  Pemakaian:
 *    node scripts/code-audit.mjs
 *    node scripts/code-audit.mjs --json code-audit.json
 *    node scripts/code-audit.mjs --verbose     (tampilkan detail semua temuan)
 *    node scripts/code-audit.mjs --top 40
 * ============================================================
 */

import { readdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const ROOT = path.resolve(import.meta.dirname, '..');
const SRC = path.join(ROOT, 'src');

const args = process.argv.slice(2);
const VERBOSE = args.includes('--verbose');
const jsonIdx = args.indexOf('--json');
const JSON_OUT = jsonIdx !== -1 ? args[jsonIdx + 1] : null;
const topIdx = args.indexOf('--top');
const TOP = topIdx !== -1 ? Number(args[topIdx + 1]) || 25 : 25;

const SKIP_DIRS = new Set(['node_modules', 'dist', 'coverage', '.git']);
const CODE_EXT = ['.js', '.mjs'];

/** Alias dari vite.config.js / vitest.config.js */
const ALIASES = [
  ['@/', 'src/'],
  ['@lib/', 'src/lib/'],
  ['@domain/', 'src/domain/'],
  ['@application/', 'src/application/'],
  ['@infrastructure/', 'src/infrastructure/'],
];

const isBare = (spec) => !spec.startsWith('.') && !spec.startsWith('/') && !spec.startsWith('@/')
  && !spec.startsWith('@lib/') && !spec.startsWith('@domain/')
  && !spec.startsWith('@application/') && !spec.startsWith('@infrastructure/');

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await walk(full));
    else if (CODE_EXT.includes(path.extname(entry.name))) out.push(full);
  }
  return out;
}

/** Resolusi specifier ke berkas nyata. */
function resolveSpecifier(spec, fromFile) {
  if (isBare(spec)) return { kind: 'bare', spec };

  let target = null;
  for (const [alias, replacement] of ALIASES) {
    if (spec.startsWith(alias)) {
      target = path.join(ROOT, replacement, spec.slice(alias.length));
      break;
    }
  }
  if (!target) {
    if (spec.startsWith('/')) target = path.join(ROOT, spec.slice(1));
    else target = path.resolve(path.dirname(fromFile), spec);
  }

  const candidates = [
    target,
    `${target}.js`,
    `${target}.mjs`,
    path.join(target, 'index.js'),
    path.join(target, 'index.mjs'),
  ];

  for (const c of candidates) {
    if (existsSync(c) && !c.includes('node_modules')) {
      // Abaikan berkas non-JS (css, json, gambar)
      const ext = path.extname(c);
      if (CODE_EXT.includes(ext)) return { kind: 'file', path: c };
      return { kind: 'asset', path: c };
    }
  }
  return { kind: 'missing', tried: candidates.map(c => path.relative(ROOT, c)) };
}

/**
 * Tandai setiap karakter: 1 = kode, 0 = komentar / isi string / isi template.
 *
 * v2 — tokenizer berbasis stack. Versi sebelumnya gagal pada TEMPLATE
 * LITERAL BERSARANG (`${cond ? \`...\` : ''}`) yang sangat umum di file UI,
 * sehingga pola itu membuat seluruh sisa berkas dianggap "teks" dan
 * export yang sah jadi tidak terdeteksi (positif palsu).
 *
 * Teks asli tetap dipertahankan (specifier seperti './utils.js' tetap
 * terbaca); hanya posisi yang ditandai non-kode yang diabaikan saat
 * mencocokkan kata kunci import/export.
 */
function computeCodeMask(code) {
  const n = code.length;
  const mask = new Uint8Array(n).fill(1);
  const markZero = (from, to) => { for (let k = Math.max(0, from); k < to && k < n; k++) mask[k] = 0; };
  const regexAllowedAfter = new Set(['(', ',', '=', ':', '[', '!', '&', '|', '?', '{', '}', ';', '+', '-', '*', '%', '<', '>', '\n', '\t', '']);

  const prevNonSpace = (idx) => {
    for (let k = idx - 1; k >= 0; k--) if (!/\s/.test(code[k])) return code[k];
    return '';
  };

  // stack konteks: { type: 'code' } | { type: 'template' } | { type: 'expr', braceDepth }
  const stack = [{ type: 'code' }];
  const top = () => stack[stack.length - 1];
  let i = 0;

  while (i < n) {
    const st = top();
    const ch = code[i];
    const next = code[i + 1];

    // ---------- Di dalam TEMPLATE: isi literal, bukan kode ----------
    if (st.type === 'template') {
      if (ch === '\\') { markZero(i, i + 2); i += 2; continue; }
      if (ch === '`') { mask[i] = 0; i++; stack.pop(); continue; }
      if (ch === '$' && next === '{') {
        markZero(i, i + 2);
        i += 2;
        stack.push({ type: 'expr', braceDepth: 0 });   // ${ ... } kembali jadi kode
        continue;
      }
      mask[i] = 0;
      i++;
      continue;
    }

    // ---------- Di dalam KODE (top-level atau di dalam ${ }) ----------
    if (ch === '/' && next === '/') {                    // komentar baris
      const s = i;
      while (i < n && code[i] !== '\n') i++;
      markZero(s, i);
      continue;
    }
    if (ch === '/' && next === '*') {                    // komentar blok
      const s = i;
      i += 2;
      while (i < n && !(code[i] === '*' && code[i + 1] === '/')) i++;
      i = Math.min(n, i + 2);
      markZero(s, i);
      continue;
    }
    if (ch === '`') {                                    // mulai template
      mask[i] = 0;
      i++;
      stack.push({ type: 'template' });
      continue;
    }
    if (ch === '"' || ch === "'") {                      // string biasa
      const s = i;
      const q = ch;
      i++;
      while (i < n) {
        if (code[i] === '\\') { i += 2; continue; }
        if (code[i] === q) { i++; break; }
        if (code[i] === '\n') break;                    // tak tertutup → jangan telan berkas
        i++;
      }
      markZero(s, i);
      continue;
    }
    if (ch === '/') {                                    // regex literal
      if (regexAllowedAfter.has(prevNonSpace(i))) {
        const s = i;
        i++;
        let inClass = false;
        while (i < n) {
          const c = code[i];
          if (c === '\\') { i += 2; continue; }
          if (c === '[') inClass = true;
          else if (c === ']') inClass = false;
          else if (c === '/' && !inClass) { i++; break; }
          else if (c === '\n') break;
          i++;
        }
        markZero(s, i);
        continue;
      }
    }
    if (st.type === 'expr') {                            // keseimbangan { } di dalam ${ }
      if (ch === '{') { st.braceDepth++; i++; continue; }
      if (ch === '}') {
        if (st.braceDepth === 0) { mask[i] = 0; i++; stack.pop(); continue; }
        st.braceDepth--;
        i++;
        continue;
      }
    }

    i++;
  }

  return mask;
}

/** Ambil daftar nama yang diekspor (termasuk re-export). */
function extractExports(code, mask = computeCodeMask(code)) {
  const names = new Set();
  let hasDefault = false;
  const isCode = (idx) => mask[idx] === 1;

  // export function / const / class / let / var / async function
  for (const m of code.matchAll(/export\s+(?:async\s+)?(?:function\*?|class|const|let|var)\s+([A-Za-z0-9_$]+)/g)) {
    if (isCode(m.index)) names.add(m[1]);
  }

  // Blok `export { ... }` — mendukung multi-baris, dengan atau tanpa `from`.
  const blockRe = /export\s*\{([\s\S]*?)\}/g;
  let m;
  while ((m = blockRe.exec(code))) {
    if (!isCode(m.index)) continue;
    const after = code.slice(m.index + m[0].length).trimStart();

    for (const rawPart of m[1].split(',')) {
      const part = rawPart.trim();
      if (!part) continue;

      const asMatch = part.match(/^([A-Za-z0-9_$]+)\s+as\s+([A-Za-z0-9_$]+)$/);
      if (asMatch) {
        if (asMatch[2] === 'default') hasDefault = true;
        else names.add(asMatch[2]);       // re-export maupun alias lokal → nama yang tersedia
      } else if (/^[A-Za-z0-9_$]+$/.test(part)) {
        if (part === 'default') hasDefault = true;
        else names.add(part);
      }
    }
  }

  // export default
  for (const m2 of code.matchAll(/export\s+default\b/g)) {
    if (isCode(m2.index)) { hasDefault = true; break; }
  }

  return { names, hasDefault };
}

/** Ambil re-export `export ... from '...'` untuk ditelusuri. */
function extractReExports(code, mask = computeCodeMask(code)) {
  const out = [];
  for (const m of code.matchAll(/export\s*(?:\{[\s\S]*?\}|\*)\s*from\s*['"]([^'"]+)['"]/g)) {
    if (mask[m.index] === 1) out.push(m[1]);
  }
  return out;
}

/** Ambil import (statik & dinamis) beserta nama yang diminta. */
function extractImports(code, mask = computeCodeMask(code)) {
  const results = [];   // { spec, named: [], default: bool, namespace: bool, line }
  const lineOf = (idx) => code.slice(0, idx).split('\n').length;
  // Hanya terima kata kunci "import"/"export" yang benar-benar berada di luar
  // komentar & string (mis. kata "import" di dalam HTML template ditolak).
  const isCode = (idx) => mask[idx] === 1;

  // import ... from 'x'   (multi-baris aman)
  const staticRe = /import\s+([\s\S]{0,400}?)\s*from\s*['"]([^'"]+)['"]/g;
  for (const m of code.matchAll(staticRe)) {
    if (!isCode(m.index)) continue;
    const clause = m[1].trim();
    const spec = m[2];
    const named = [];
    let hasDefault = false;
    let namespace = false;

    const braceMatch = clause.match(/\{([\s\S]*)\}/);
    if (braceMatch) {
      for (const part of braceMatch[1].split(',')) {
        const name = part.split(/\s+as\s+/)[0].trim();
        if (name) named.push(name);
      }
    }
    if (clause.startsWith('*')) namespace = true;
    else if (!clause.startsWith('{') && clause.length > 0) hasDefault = true;

    results.push({ spec, named, hasDefault, namespace, line: lineOf(m.index) });
  }

  // import 'x'  (side-effect saja)
  for (const m of code.matchAll(/import\s*['"]([^'"]+)['"]/g)) {
    if (!isCode(m.index)) continue;
    results.push({ spec: m[1], named: [], hasDefault: false, namespace: false, line: lineOf(m.index), sideEffect: true });
  }

  // dynamic import('x')
  for (const m of code.matchAll(/import\(\s*['"]([^'"]+)['"]\s*\)/g)) {
    if (!isCode(m.index)) continue;
    results.push({ spec: m[1], named: [], hasDefault: false, namespace: false, line: lineOf(m.index), dynamic: true });
  }

  return results;
}

/** Ekspor efektif sebuah berkas, menelusuri `export * from`. */
function effectiveExports(file, exportsMap, reExportMap, depth = 0, seen = new Set()) {
  if (seen.has(file) || depth > 4) return { names: new Set(), hasDefault: false };
  seen.add(file);

  const self = exportsMap.get(file) || { names: new Set(), hasDefault: false };
  const names = new Set(self.names);
  let hasDefault = self.hasDefault;

  for (const spec of reExportMap.get(file) || []) {
    const resolved = resolveSpecifier(spec, file);
    if (resolved.kind !== 'file') continue;
    const sub = effectiveExports(resolved.path, exportsMap, reExportMap, depth + 1, seen);
    sub.names.forEach(n => names.add(n));
    hasDefault = hasDefault || sub.hasDefault;
  }
  return { names, hasDefault };
}

async function main() {
  const files = await walk(SRC);
  const fileSet = new Set(files);

  const exportsMap = new Map();
  const reExportMap = new Map();
  const importsMap = new Map();
  /** graph untuk deteksi sirkular & orphan */
  const graph = new Map();

  for (const file of files) {
    const code = await readFile(file, 'utf8');
    const mask = computeCodeMask(code);          // dihitung sekali per berkas
    exportsMap.set(file, extractExports(code, mask));
    reExportMap.set(file, extractReExports(code, mask));
    const imps = extractImports(code, mask);
    importsMap.set(file, imps);
    graph.set(file, imps
      .map(i => resolveSpecifier(i.spec, file))
      .filter(r => r.kind === 'file')
      .map(r => r.path));
  }

  const findings = {
    brokenImports: [],
    brokenExports: [],
    missingDeps: [],
    cdnImports: [],
    deadRoutes: [],
    orphanModules: [],
    unwiredPages: [],
    circular: [],
  };

  // ---- 1 & 2 & 3. Periksa setiap import ----
  const pkg = JSON.parse(await readFile(path.join(ROOT, 'package.json'), 'utf8'));
  const declaredDeps = new Set([
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
  ]);

  for (const [file, imps] of importsMap) {
    for (const imp of imps) {
      const resolved = resolveSpecifier(imp.spec, file);

      if (resolved.kind === 'bare') {
        // Import dari CDN/URL (mis. jsdelivr, unpkg) — bukan paket npm.
        // Tetap dilaporkan terpisah karena berkas ini TIDAK ikut di-bundle
        // dan gagal saat offline.
        if (/^https?:\/\//.test(imp.spec)) {
          findings.cdnImports.push({ file: path.relative(ROOT, file), spec: imp.spec, line: imp.line });
          continue;
        }

        // paket npm — cek deklarasi (termasuk subpath: @scope/pkg/sub)
        const pkgName = imp.spec.startsWith('@')
          ? imp.spec.split('/').slice(0, 2).join('/')
          : imp.spec.split('/')[0];
        const isNodeBuiltin = ['node:fs', 'node:path', 'fs', 'path', 'crypto', 'os', 'util']
          .includes(pkgName) || imp.spec.startsWith('node:');
        if (!declaredDeps.has(pkgName) && !isNodeBuiltin) {
          findings.missingDeps.push({ file: path.relative(ROOT, file), spec: imp.spec, pkg: pkgName, line: imp.line });
        }
        continue;
      }

      if (resolved.kind === 'missing') {
        // CDN/URL di dalam import dinamis → bukan error
        if (/^https?:\/\//.test(imp.spec)) continue;
        findings.brokenImports.push({
          file: path.relative(ROOT, file),
          spec: imp.spec,
          line: imp.line,
          tried: resolved.tried.slice(0, 3),
        });
        continue;
      }

      if (resolved.kind !== 'file') continue;

      // Cek nama yang diimpor benar-benar diekspor
      if (imp.named.length > 0) {
        // Berkas tujuan di LUAR src/ (mis. berkas pengujian yang mengimpor
        // dari scripts/) belum ada di exportsMap karena peta itu dibangun
        // hanya dari src/. Baca berkasnya sekarang supaya tidak dilaporkan
        // sebagai "export tidak ditemukan" — positif palsu.
        if (!exportsMap.has(resolved.path)) {
          try {
            const outside = await readFile(resolved.path, 'utf8');
            exportsMap.set(resolved.path, extractExports(outside, computeCodeMask(outside)));
          } catch { /* berkas tak terbaca → biarkan kosong */ }
        }
        const available = effectiveExports(resolved.path, exportsMap, reExportMap);
        for (const name of imp.named) {
          if (!available.names.has(name)) {
            findings.brokenExports.push({
              file: path.relative(ROOT, file),
              target: path.relative(ROOT, resolved.path),
              name,
              line: imp.line,
              availableSample: [...available.names].slice(0, 6),
            });
          }
        }
      }
    }
  }

  // ---- 4. Modul orphan ----
  const importers = new Map(files.map(f => [f, new Set()]));
  for (const [file, deps] of graph) {
    for (const dep of deps) importers.get(dep)?.add(file);
  }

  const ENTRY_FILES = new Set([
    path.join(SRC, 'main.js'),
    path.join(SRC, 'style.css'),
  ]);
  const isTest = (f) => /\.test\.js$/.test(f);

  for (const file of files) {
    if (ENTRY_FILES.has(file) || isTest(file)) continue;
    if ((importers.get(file)?.size || 0) === 0) {
      findings.orphanModules.push({
        file: path.relative(ROOT, file),
        bytes: (await readFile(file, 'utf8')).length,
      });
    }
  }
  findings.orphanModules.sort((a, b) => b.bytes - a.bytes);

  // ---- 5. Halaman yang tidak ter-wire ke router ----
  const mainCode = await readFile(path.join(SRC, 'main.js'), 'utf8');
  // Kumpulkan semua target import dinamis di main.js (registry `pages` + route lazy load)
  const lazyTargets = new Set();
  for (const m of mainCode.matchAll(/import\(\s*['"]\.\/([^'"]+)['"]\s*\)/g)) {
    const resolved = resolveSpecifier(`./${m[1]}`, path.join(SRC, 'main.js'));
    if (resolved.kind === 'file') lazyTargets.add(resolved.path);
  }

  const pagesDir = path.join(SRC, 'pages');
  const pageFiles = files.filter(f => f.startsWith(pagesDir + path.sep) && !isTest(f));

  for (const page of pageFiles) {
    const reachable = lazyTargets.has(page)
      || (importers.get(page)?.size || 0) > 0;
    if (!reachable) {
      findings.unwiredPages.push({
        file: path.relative(ROOT, page),
        bytes: (await readFile(page, 'utf8')).length,
      });
    }
  }
  findings.unwiredPages.sort((a, b) => b.bytes - a.bytes);

  // ---- 5b. Rute yang dinavigasi tetapi TIDAK terdaftar ----
  // Ini penyebab paling menjengkelkan: tombol terlihat aktif, tetapi
  // pengguna mendarat di halaman 404 / kosong.
  const registeredRoutes = new Set();
  for (const m of mainCode.matchAll(/route\(\s*['"]([^'"]+)['"]/g)) {
    if (computeCodeMask(mainCode)[m.index] === 1) registeredRoutes.add(m[1]);
  }
  // Alias rute juga dianggap terdaftar
  for (const m of mainCode.matchAll(/^\s*'([a-z0-9-]+)':\s*'([a-z0-9-]+)',?\s*$/gm)) {
    registeredRoutes.add(m[1]);
  }

  const navigatedRoutes = new Map();   // route → lokasi pemanggil pertama
  for (const file of files) {
    const code = await readFile(file, 'utf8');
    const mask = computeCodeMask(code);
    for (const m of code.matchAll(/navigate\(\s*['"]([a-z0-9-]+)['"]/g)) {
      if (mask[m.index] !== 1) continue;                 // lewati komentar
      const route = m[1];
      if (!navigatedRoutes.has(route)) {
        navigatedRoutes.set(route, {
          file: path.relative(ROOT, file),
          line: code.slice(0, m.index).split('\n').length,
        });
      }
    }
  }

  for (const [route, where] of navigatedRoutes) {
    if (!registeredRoutes.has(route) && route !== 'login' && route !== 'dashboard') {
      findings.deadRoutes.push({ route, ...where });
    }
  }
  findings.deadRoutes.sort((a, b) => a.route.localeCompare(b.route));

  // ---- 6. Import sirkular ----
  const seenPairs = new Set();
  const dfs = (node, stack, visiting) => {
    visiting.add(node);
    for (const dep of graph.get(node) || []) {
      if (visiting.has(dep)) {
        // temukan siklus
        const cycleStart = stack.indexOf(dep);
        if (cycleStart !== -1) {
          const cycle = [...stack.slice(cycleStart), dep].map(f => path.relative(ROOT, f));
          const key = cycle.slice().sort().join('|');
          if (!seenPairs.has(key)) {
            seenPairs.add(key);
            findings.circular.push({ length: cycle.length, cycle });
          }
        }
        continue;
      }
      if (stack.includes(dep)) continue;
      dfs(dep, [...stack, dep], visiting);
    }
    visiting.delete(node);
  };
  for (const file of files) {
    if (!seenPairs.has('__done__') || true) dfs(file, [file], new Set());
  }
  findings.circular.sort((a, b) => a.length - b.length);

  // ---- Laporan ----
  const rel = (p) => p;
  console.log('\n' + '='.repeat(76));
  console.log('  CODE AUDIT — kesehatan modul & integrasi');
  console.log('='.repeat(76));
  console.log(`  Berkas diperiksa: ${files.length}\n`);

  const sections = [
    ['IMPORT RUSAK (path tidak ditemukan)', findings.brokenImports, 'fatal'],
    ['EXPORT RUSAK (nama tidak diekspor modul tujuan)', findings.brokenExports, 'fatal'],
    ['DEPENDENSI NPM TIDAK TERDAFTAR', findings.missingDeps, 'fatal'],
    ['RUTE DINAVIGASI TAPI TIDAK TERDAFTAR', findings.deadRoutes, 'fatal'],
    ['IMPORT SIRKULAR', findings.circular, 'warn'],
    ['HALAMAN TIDAK TER-WIRE KE ROUTER', findings.unwiredPages, 'warn'],
    ['IMPORT DARI CDN (tidak ikut di-bundle)', findings.cdnImports, 'warn'],
    ['MODUL ORPHAN (tidak diimpor siapa pun)', findings.orphanModules, 'info'],
  ];

  const icons = { fatal: '❌', warn: '⚠️ ', info: 'ℹ️ ' };

  for (const [title, list, sev] of sections) {
    console.log(`${icons[sev]} ${title}: ${list.length}`);
  }
  console.log();

  const show = (title, list, fmt, limit = TOP) => {
    if (list.length === 0) return;
    console.log('─'.repeat(76));
    console.log(`  ${title}`);
    console.log('─'.repeat(76));
    const slice = VERBOSE ? list : list.slice(0, limit);
    for (const item of slice) console.log('  ' + fmt(item));
    if (!VERBOSE && list.length > limit) {
      console.log(`  … dan ${list.length - limit} temuan lain (pakai --verbose)`);
    }
    console.log();
  };

  show('IMPORT RUSAK', findings.brokenImports,
    (i) => `❌ ${i.file}:${i.line}\n     → '${i.spec}'\n     dicoba: ${i.tried.join(', ')}`);
  show('EXPORT RUSAK', findings.brokenExports,
    (i) => `❌ ${i.file}:${i.line}  tidak menemukan export '${i.name}' di ${i.target}\n     tersedia: ${i.availableSample.join(', ') || '(tidak ada)'}`);
  show('DEPENDENSI NPM TIDAK TERDAFTAR', findings.missingDeps,
    (i) => `❌ ${i.file}:${i.line}  import '${i.spec}' → paket '${i.pkg}' tidak ada di package.json`);
  show('IMPORT SIRKULAR', findings.circular,
    (c) => `⚠️  ${c.length} modul: ${c.cycle.join('\n        → ')}`);
  show('HALAMAN TIDAK TER-WIRE KE ROUTER', findings.unwiredPages,
    (p) => `⚠️  ${p.file}  (${(p.bytes / 1024).toFixed(1)} KB) — tidak ada route yang merendernya`);
  show('RUTE DINAVIGASI TAPI TIDAK TERDAFTAR', findings.deadRoutes,
    (d) => `❌ navigate('${d.route}') di ${d.file}:${d.line} → tombol akan mendarat di halaman 404`);
  show('IMPORT DARI CDN', findings.cdnImports,
    (c) => `⚠️  ${c.file}:${c.line}  '${c.spec.slice(0, 70)}'\n     → tidak ikut di-bundle; gagal saat offline`);
  show('MODUL ORPHAN', findings.orphanModules,
    (o) => `ℹ️  ${o.file}  (${(o.bytes / 1024).toFixed(1)} KB)`);

  const fatal = findings.brokenImports.length + findings.brokenExports.length
    + findings.missingDeps.length + findings.deadRoutes.length;
  console.log('='.repeat(76));
  console.log(fatal === 0
    ? '  ✅ Tidak ada import/export/rute rusak — semua modul & tombol tersambung.'
    : `  ❌ ${fatal} masalah FATAL: ada tautan/modul yang tidak tersambung.`);
  console.log('='.repeat(76) + '\n');

  if (JSON_OUT) {
    await writeFile(path.join(ROOT, JSON_OUT), JSON.stringify({
      generatedAt: new Date().toISOString(),
      filesChecked: files.length,
      summary: {
        brokenImports: findings.brokenImports.length,
        brokenExports: findings.brokenExports.length,
        missingDeps: findings.missingDeps.length,
        deadRoutes: findings.deadRoutes.length,
        cdnImports: findings.cdnImports.length,
        circular: findings.circular.length,
        unwiredPages: findings.unwiredPages.length,
        orphanModules: findings.orphanModules.length,
      },
      ...findings,
    }, null, 2), 'utf8');
    console.log(`  📄 Laporan JSON: ${JSON_OUT}\n`);
  }

  process.exit(fatal > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('Audit gagal:', err);
  process.exit(2);
});
