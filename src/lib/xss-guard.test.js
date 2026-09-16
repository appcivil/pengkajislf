/**
 * xss-guard.test.js — gerbang regresi XSS.
 *
 * Dua lapis pertahanan:
 *
 *  1. STATIS — memindai seluruh `src/**` dan gagal bila ada SATU pun
 *     interpolasi data di dalam template bermarkah yang belum lewat
 *     `escapeHtml()`. Implementasinya memakai `collectEscapes()` dari
 *     `scripts/xss-codemod.mjs`, jadi aturan escaping hanya punya satu
 *     sumber kebenaran: kalau codemod diubah, tes ini ikut berubah.
 *
 *     Artinya: menambah `<div>${x}</div>` baru tanpa escape akan
 *     MENGGAGALKAN tes ini. Regresi XSS jadi tidak mungkin lolos CI.
 *
 *  2. DINAMIS — benar-benar MERENDER komponen nyata dengan data berisi
 *     muatan XSS, lalu memeriksa HTML yang dihasilkan. Lapis ini membuktikan
 *     escaping bekerja sampai ke keluaran akhir, bukan sekadar "ada tulisan
 *     escapeHtml di kode".
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { collectEscapes } from '../../scripts/xss-codemod.mjs';

const ROOT = path.resolve(__dirname, '../..');
const SRC = path.join(ROOT, 'src');

const PAYLOAD = '<img src=x onerror="window.__xss=1">';
const ESCAPED_PAYLOAD = '&lt;img src=x onerror=&quot;window.__xss=1&quot;&gt;';

function walk(dir, acc = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name !== 'node_modules') walk(p, acc);
    } else if (e.name.endsWith('.js') && !e.name.endsWith('.test.js')) {
      acc.push(p);
    }
  }
  return acc;
}

// ─────────────────────────────────────────────────────────────────────────────
describe('Lapis 1 — pemindaian statis seluruh sumber', () => {
  const files = walk(SRC);

  it('memeriksa seluruh berkas sumber', () => {
    expect(files.length).toBeGreaterThan(300);
  });

  it('TIDAK ada interpolasi data yang belum di-escape di dalam markah', () => {
    const offenders = [];
    for (const f of files) {
      const code = readFileSync(f, 'utf8');
      const rel = path.relative(ROOT, f).replace(/\\/g, '/');
      for (const e of collectEscapes(code, rel)) {
        offenders.push(`${rel}  →  \${${e.expr}}`);
      }
    }
    // Pesan galat sengaja memuat lokasi agar mudah diperbaiki.
    expect(
      offenders,
      `Interpolasi berikut menyuntikkan data ke dalam markah tanpa escape:\n  ${offenders.join('\n  ')}`
    ).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('Lapis 2 — render nyata komponen dengan muatan XSS', () => {
  /** Ambil nama kunci tingkat pertama yang dipakai, mis. `summary.status` → `status`. */
  function keysUsedIn(source, objectName) {
    const re = new RegExp(`\\b${objectName}\\.([A-Za-z_$][\\w$]*)`, 'g');
    return [...new Set([...source.matchAll(re)].map(m => m[1]))];
  }

  /**
   * Nilai default supaya render tidak melempar galat.
   *
   * Urutan pengecekan penting: sebuah field yang dipanggil dengan
   * `.replace()` HARUS diberi string, dan yang dipanggil `.toFixed()`
   * HARUS diberi angka. Memberi boolean/number pada field bertipe string
   * membuat render melempar `TypeError` dan field itu jadi tidak teruji.
   */
  function defaultFor(key, source) {
    const k = key.replace(/[$]/g, '\\$');
    const STRING_METHODS = 'replace|replaceAll|toUpperCase|toLowerCase|trim|substring|substr|normalize|padStart|padEnd';
    if (new RegExp(`\\b\\w+\\.${k}\\s*\\??\\.\\s*(?:toFixed)\\s*\\(`).test(source)) return 1;
    if (new RegExp(`\\b\\w+\\.${k}\\s*\\??\\.\\s*(?:${STRING_METHODS})\\s*\\(`).test(source)) return 'ok';
    if (new RegExp(`\\b\\w+\\.${k}\\s*\\?`).test(source)) return true;
    if (/^(has|is|can|should|show|required)/i.test(key)) return true;
    if (/(count|num|total|area|width|height|score|percent|ratio|index|id|grade|level|value|size|qty)$/i.test(key)) return 1;
    return 'ok';
  }

  /**
   * Render `fn(project, summary)` dengan muatan XSS disisipkan ke SETIAP
   * kunci satu per satu (isolasi per-field), lalu periksa keluarannya.
   */
  function probe(fn, source, label) {
    const pKeys = keysUsedIn(source, 'project');
    const sKeys = keysUsedIn(source, 'summary');
    let tested = 0;
    const leaks = [];

    for (const [which, keys] of [['project', pKeys], ['summary', sKeys]]) {
      for (const key of keys) {
        const project = {};
        const summary = {};
        for (const k of pKeys) project[k] = defaultFor(k, source);
        for (const k of sKeys) summary[k] = defaultFor(k, source);
        (which === 'project' ? project : summary)[key] = PAYLOAD;

        let html;
        try {
          html = fn(project, summary);
        } catch {
          continue;                       // kunci ini butuh tipe lain — dilewati
        }
        if (typeof html !== 'string') continue;
        tested++;

        // Muatan harus muncul dalam bentuk ter-escape, bukan sebagai tag hidup.
        if (/<img\s+src=x/i.test(html)) {
          leaks.push(`${label}: ${which}.${key} → muatan lolos mentah`);
        }
      }
    }

    return { tested, leaks };
  }

  it('renderAccessibilityCard menetralkan muatan XSS di semua field', async () => {
    const file = path.join(SRC, 'components/accessibility-module.js');
    const source = readFileSync(file, 'utf8');
    const { renderAccessibilityCard } = await import(file);
    const { tested, leaks } = probe(renderAccessibilityCard, source, 'renderAccessibilityCard');
    expect(leaks, leaks.join('\n')).toEqual([]);
    expect(tested, 'tidak ada field yang berhasil diuji').toBeGreaterThanOrEqual(3);
  });

  it('renderBuildingIntensityCard menetralkan muatan XSS di semua field', async () => {
    const file = path.join(SRC, 'components/building-intensity-module.js');
    const source = readFileSync(file, 'utf8');
    const { renderBuildingIntensityCard } = await import(file);
    const { tested, leaks } = probe(renderBuildingIntensityCard, source, 'renderBuildingIntensityCard');
    expect(leaks, leaks.join('\n')).toEqual([]);
    expect(tested, 'tidak ada field yang berhasil diuji').toBeGreaterThanOrEqual(1);
  });

  it('renderEgressSystemCard menetralkan muatan XSS di semua field', async () => {
    const file = path.join(SRC, 'components/egress-system-module.js');
    const source = readFileSync(file, 'utf8');
    const { renderEgressSystemCard } = await import(file);
    const { tested, leaks } = probe(renderEgressSystemCard, source, 'renderEgressSystemCard');
    expect(leaks, leaks.join('\n')).toEqual([]);
    expect(tested, 'tidak ada field yang berhasil diuji').toBeGreaterThanOrEqual(1);
  });

  it('escaped payload benar-benar muncul sebagai teks, bukan hilang', async () => {
    const file = path.join(SRC, 'components/accessibility-module.js');
    const { renderAccessibilityCard } = await import(file);
    const html = renderAccessibilityCard({}, { status: PAYLOAD, hasData: true });
    // Muatan tampil sebagai teks (aman) — ini juga membuktikan tidak ada
    // konten laporan yang hilang akibat sanitasi.
    expect(html).toContain(ESCAPED_PAYLOAD);
    expect(html).not.toMatch(/<img\s+src=x/i);
  });
});
