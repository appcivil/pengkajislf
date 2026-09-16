#!/usr/bin/env node
/**
 * ============================================================
 *  EGRESS AUDIT — pemindai statis risiko egress Supabase
 *
 *  Memeriksa kode di src/ dan melaporkan pola yang membuat
 *  transfer data keluar dari Supabase membengkak:
 *
 *    1. select('*')              → kolom besar ikut terkirim
 *    2. Query tanpa .limit()      → satu query bisa menarik 1.000 baris
 *    3. Upload Storage tanpa      → CDN tidak menyimpan lama,
 *       cacheControl panjang         file ditarik ulang terus-menerus
 *    4. Realtime .channel()       → payload tiap perubahan
 *    5. setInterval polling       → request berulang tanpa henti
 *    6. base64 di database        → baris membengkak, ikut terkirim
 *       setiap kali tabel dibaca
 *
 *  Pemakaian:
 *    node scripts/egress-audit.mjs
 *    node scripts/egress-audit.mjs --json egress-audit.json
 *    node scripts/egress-audit.mjs --top 20
 * ============================================================
 */

import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const ROOT = path.resolve(import.meta.dirname, '..');
const SRC = path.join(ROOT, 'src');

const args = process.argv.slice(2);
const jsonIdx = args.indexOf('--json');
const JSON_OUT = jsonIdx !== -1 ? args[jsonIdx + 1] : null;
const topIdx = args.indexOf('--top');
const TOP = topIdx !== -1 ? Number(args[topIdx + 1]) || 15 : 15;

const SKIP_DIRS = new Set(['node_modules', 'dist', 'coverage', '.git', 'tests']);
const SKIP_FILES = /\.test\.js$/;

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await walk(full));
    else if (entry.name.endsWith('.js') && !SKIP_FILES.test(entry.name)) out.push(full);
  }
  return out;
}

const rel = (p) => path.relative(ROOT, p);

/** Ambil nama tabel dari potongan kode `from('nama')`. */
const tableOf = (code) => code.match(/from\(\s*['"`]([^'"`]+)['"`]\s*\)/)?.[1] || 'unknown';

function analyzeFile(file, code) {
  const findings = {
    selectStar: [],
    noLimit: [],
    unboundedWrites: [],
    storageNoCacheControl: [],
    realtimeChannels: [],
    intervals: [],
    base64InDb: [],
  };

  const lines = code.split('\n');

  lines.forEach((rawLine, i) => {
    const lineNo = i + 1;
    const line = rawLine;

    // Lewati baris komentar — sering memuat contoh kode (positif palsu).
    const isComment = /^\s*(\/\/|\*|\/\*)/.test(line);
    if (isComment) return;

    // 1. select('*')
    if (/\.select\(\s*['"`]\*['"`]/.test(line)) {
      findings.selectStar.push({ line: lineNo, table: tableOf(lines.slice(Math.max(0, i - 3), i + 1).join('\n')) });
    }

    // 3. upload Storage tanpa cacheControl panjang.
    //    Periksa blok beberapa baris karena opsi sering ditulis multi-baris.
    if (/\.upload\(/.test(line)) {
      const block = lines.slice(i, Math.min(lines.length, i + 12)).join('\n');
      const hasCacheControl = /cacheControl\s*:/.test(block);
      const longTtl = /cacheControl\s*:\s*['"`](\d{6,}|31536000|max)/.test(block);
      if (!hasCacheControl || !longTtl) {
        findings.storageNoCacheControl.push({
          line: lineNo,
          reason: hasCacheControl ? 'cacheControl terlalu pendek (file ditarik ulang)' : 'cacheControl tidak diset',
          snippet: line.trim().slice(0, 90),
        });
      }
    }

    // 4. Realtime
    if (/\.channel\(/.test(line)) {
      findings.realtimeChannels.push({ line: lineNo, snippet: line.trim().slice(0, 90) });
    }

    // 5. Polling
    if (/setInterval\(/.test(line)) {
      findings.intervals.push({ line: lineNo, snippet: line.trim().slice(0, 90) });
    }

    // 6. base64 di database
    if (/base64/i.test(line) && /(metadata|jsonb|proyek|insert|update)/i.test(line)) {
      findings.base64InDb.push({ line: lineNo, snippet: line.trim().slice(0, 90) });
    }
  });

  // 2. Query SELECT tanpa .limit() — heuristik per statement (dipisah ';')
  const statements = code.split(/;/);
  let cursor = 0;
  for (const stmt of statements) {
    const idx = code.indexOf(stmt, cursor);
    cursor = idx + stmt.length;
    if (!/\.select\(/.test(stmt)) continue;
    const hasBound = /\.(limit|single|maybeSingle|range|head\s*:\s*true)\s*\(?/.test(stmt) || /head:\s*true/.test(stmt);
    if (!hasBound && stmt.length > 40) {
      const lineNo = code.slice(0, idx).split('\n').length;
      findings.noLimit.push({ line: lineNo, table: tableOf(stmt), chars: stmt.length });
    }
  }

  return findings;
}

function bump(map, key, n = 1) {
  map[key] = (map[key] || 0) + n;
}

function bar(n, max, width = 24) {
  if (!max) return '';
  const len = Math.max(1, Math.round((n / max) * width));
  return '█'.repeat(len);
}

async function main() {
  const files = await walk(SRC);
  const totals = {
    files: files.length,
    selectStar: 0, noLimit: 0, storageNoCacheControl: 0,
    realtimeChannels: 0, intervals: 0, base64InDb: 0,
  };
  const byTable = {};
  const hotspots = [];
  const details = [];

  for (const file of files) {
    const code = await readFile(file, 'utf8');
    const f = analyzeFile(file, code);
    const counts = {
      selectStar: f.selectStar.length,
      noLimit: f.noLimit.length,
      storageNoCacheControl: f.storageNoCacheControl.length,
      realtimeChannels: f.realtimeChannels.length,
      intervals: f.intervals.length,
      base64InDb: f.base64InDb.length,
    };
    for (const [k, v] of Object.entries(counts)) totals[k] += v;

    f.selectStar.forEach(s => bump(byTable, s.table));

    const risk = counts.selectStar * 3 + counts.noLimit * 4 + counts.storageNoCacheControl * 2
      + counts.realtimeChannels * 6 + counts.base64InDb * 10;

    if (risk > 0) {
      hotspots.push({ file: rel(file), risk, ...counts });
      details.push({ file: rel(file), counts, findings: f });
    }
  }

  hotspots.sort((a, b) => b.risk - a.risk);

  // ---------- Laporan ----------
  console.log('\n' + '='.repeat(74));
  console.log('  EGRESS AUDIT — risiko transfer data Supabase');
  console.log('='.repeat(74));
  console.log(`  Berkas diperiksa: ${totals.files}\n`);

  const rows = [
    ['select(\'*\') — kolom besar ikut terkirim', totals.selectStar],
    ['Query SELECT tanpa .limit()', totals.noLimit],
    ['Upload Storage tanpa cacheControl', totals.storageNoCacheControl],
    ['Realtime channel (payload tiap perubahan)', totals.realtimeChannels],
    ['setInterval (potensi polling berulang)', totals.intervals],
    ['base64 tersimpan di database', totals.base64InDb],
  ];
  const max = Math.max(...rows.map(r => r[1]), 1);
  for (const [label, n] of rows) {
    console.log(`  ${label.padEnd(44)} ${String(n).padStart(5)}  ${bar(n, max)}`);
  }

  console.log('\n  — Tabel paling sering dibaca dengan select(\'*\') —');
  const topTables = Object.entries(byTable).sort((a, b) => b[1] - a[1]).slice(0, TOP);
  const maxT = Math.max(...topTables.map(t => t[1]), 1);
  for (const [table, n] of topTables) {
    console.log(`  ${table.padEnd(30)} ${String(n).padStart(4)}  ${bar(n, maxT, 20)}`);
  }

  console.log(`\n  — ${Math.min(TOP, hotspots.length)} berkas dengan risiko tertinggi —`);
  for (const h of hotspots.slice(0, TOP)) {
    console.log(`  ${String(h.risk).padStart(4)}  ${h.file}`);
    console.log(`        select*:${h.selectStar}  tanpa-limit:${h.noLimit}  storage:${h.storageNoCacheControl}  realtime:${h.realtimeChannels}  base64:${h.base64InDb}`);
  }

  console.log('\n  Catatan: ini pemindaian statis (heuristik). Angka "tanpa-limit"');
  console.log('  bisa berupa positif palsu jika query dibatasi lewat helper lain.\n');

  if (JSON_OUT) {
    await writeFile(path.join(ROOT, JSON_OUT), JSON.stringify({
      generatedAt: new Date().toISOString(),
      totals,
      byTable,
      hotspots,
      details,
    }, null, 2), 'utf8');
    console.log(`  📄 Laporan JSON: ${JSON_OUT}\n`);
  }
}

main().catch((err) => {
  console.error('Audit gagal:', err);
  process.exit(1);
});
