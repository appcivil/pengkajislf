#!/usr/bin/env node
/**
 * db-schema-sync.mjs — membuat migrasi untuk tabel yang dipakai kode tetapi
 * belum ada di dalam repositori.
 *
 * MASALAH YANG DIPECAHKAN
 * -----------------------
 * Kode aplikasi menyentuh 123 tabel, sementara seluruh berkas di `supabase/`
 * hanya mendefinisikan 27. Artinya 112 tabel — 53 di antaranya menerima
 * operasi tulis — hanya ada di dashboard Supabase, tidak di version control.
 *
 * Akibatnya:
 *   - repo ini TIDAK bisa di-deploy dari nol (ikuti docs/SUPABASE-SETUP.md
 *     dan aplikasi akan gagal dengan "relation does not exist"),
 *   - tidak ada backup skema yang bisa direproduksi,
 *   - tidak ada cara me-review perubahan skema lewat pull request.
 *
 * KENAPA SKRIP INI, BUKAN DDL HASIL TERKAAN
 * -----------------------------------------
 * Menebak definisi 112 tabel dari cara kode memakainya pasti salah: tipe
 * kolom, constraint, index, dan default value tidak bisa diketahui dari
 * sisi klien. Karena itu skrip ini MEMBACA SKEMA LANGSUNG dari database
 * (yang memang sudah memuat tabel-tabel itu) lalu menuliskannya sebagai
 * migrasi yang bisa dijalankan ulang.
 *
 * CARA PAKAI
 * ----------
 *   1. Ambil connection string database Supabase:
 *      Dashboard → Project Settings → Database → Connection string → URI
 *      (pakai koneksi "Session pooler" bila jaringan Anda IPv4-only)
 *
 *   2. Simpan sebagai variabel lingkungan, JANGAN di dalam .env repo:
 *        export SUPABASE_DB_URL='postgresql://postgres.xxxx:PASSWORD@aws-0-....pooler.supabase.com:5432/postgres'
 *
 *   3. Jalankan:
 *        npm run db:schema-sync              # periksa & tulis migrasi
 *        npm run db:schema-sync -- --dry     # periksa saja, tanpa menulis
 *        npm run db:schema-sync -- --all     # sertakan juga tabel yang sudah ada
 *
 *   4. Periksa berkas yang dihasilkan di supabase/migrations/, commit.
 *
 * HASILNYA: `supabase db reset` atau deployment dari nol menjadi mungkin,
 * dan setiap perubahan skema berikutnya bisa lewat pull request.
 *
 * Skrip ini HANYA MEMBACA database. Tidak ada DDL/DML yang dijalankan.
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const ROOT = process.cwd();
const SRC = path.join(ROOT, 'src');
const SUPABASE = path.join(ROOT, 'supabase');
const MIGRATIONS = path.join(SUPABASE, 'migrations');

const DRY = process.argv.includes('--dry');
const ALL = process.argv.includes('--all');

// ─────────────────────────────────────────────────────────────────────────────
// 1. Kumpulkan nama tabel yang dipakai kode
// ─────────────────────────────────────────────────────────────────────────────
function walk(dir, acc = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (e.name !== 'node_modules') walk(p, acc); }
    else if (e.name.endsWith('.js') && !e.name.endsWith('.test.js')) acc.push(p);
  }
  return acc;
}

function tablesUsedInCode() {
  const used = new Map();          // tabel → { files, reads, writes }
  for (const f of walk(SRC)) {
    const code = readFileSync(f, 'utf8');
    for (const m of code.matchAll(/\.from\(\s*['"]([a-z_][a-z0-9_]*)['"]\s*\)/g)) {
      const t = m[1];
      const entry = used.get(t) || { files: new Set(), reads: 0, writes: 0 };
      entry.files.add(path.relative(ROOT, f).replace(/\\/g, '/'));
      const after = code.slice(m.index, m.index + 200);
      if (/\.(insert|upsert|update|delete)\s*\(/.test(after)) entry.writes++;
      else entry.reads++;
      used.set(t, entry);
    }
  }
  return used;
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Kumpulkan nama tabel yang sudah didefinisikan di SQL
// ─────────────────────────────────────────────────────────────────────────────
function tablesDefinedInSql() {
  const defined = new Set();
  const dirs = [SUPABASE, MIGRATIONS, path.join(SUPABASE, 'security')];
  for (const dir of dirs) {
    if (!existsSync(dir)) continue;
    for (const name of readdirSync(dir)) {
      if (!name.endsWith('.sql')) continue;
      const sql = readFileSync(path.join(dir, name), 'utf8');
      for (const line of sql.split('\n')) {
        const code = line.replace(/--.*$/, '');
        const m = code.match(/create\s+table\s+(?:if\s+not\s+exists\s+)?(?:public\.)?["']?([a-z_][a-z0-9_]*)["']?/i);
        if (m) defined.add(m[1]);
      }
    }
  }
  return defined;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Intropeksi database (hanya baca)
// ─────────────────────────────────────────────────────────────────────────────
async function introspect(url, wanted) {
  let pg;
  try {
    pg = await import('pg');
  } catch {
    console.error(
      '\n❌ Paket `pg` belum terpasang. Skrip ini memerlukannya untuk membaca skema:\n' +
      '     npm install --save-dev pg\n'
    );
    process.exit(2);
  }

  const client = new pg.default.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await client.connect();

  try {
    const { rows } = await client.query(`
      SELECT
        c.relname                                AS table_name,
        a.attname                                AS column_name,
        pg_catalog.format_type(a.atttypid, a.atttypmod) AS data_type,
        a.attnotnull                             AS not_null,
        pg_get_expr(d.adbin, d.adrelid)          AS default_expr,
        a.attidentity                            AS identity
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum > 0 AND NOT a.attisdropped
      LEFT JOIN pg_attrdef d ON d.adrelid = c.oid AND d.adnum = a.attnum
      WHERE n.nspname = 'public' AND c.relkind = 'r'
        AND c.relname = ANY($1)
      ORDER BY c.relname, a.attnum
    `, [wanted]);

    const { rows: constraints } = await client.query(`
      SELECT c.relname AS table_name, con.conname, con.contype,
             pg_get_constraintdef(con.oid) AS definition
      FROM pg_constraint con
      JOIN pg_class c ON c.oid = con.conrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relname = ANY($1)
      ORDER BY c.relname, con.contype DESC, con.conname
    `, [wanted]);

    const { rows: indexes } = await client.query(`
      SELECT tablename, indexname, indexdef
      FROM pg_indexes
      WHERE schemaname = 'public' AND tablename = ANY($1)
      ORDER BY tablename, indexname
    `, [wanted]);

    const { rows: rls } = await client.query(`
      SELECT c.relname AS table_name, c.relrowsecurity AS rls_enabled
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relname = ANY($1)
    `, [wanted]);

    return { columns: rows, constraints, indexes, rls };
  } finally {
    await client.end();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Susun DDL
// ─────────────────────────────────────────────────────────────────────────────
function buildDdl({ columns, constraints, indexes, rls }, wanted) {
  const byTable = new Map();
  for (const t of wanted) byTable.set(t, { cols: [], cons: [], idx: [] });
  for (const r of columns) byTable.get(r.table_name)?.cols.push(r);
  for (const r of constraints) byTable.get(r.table_name)?.cons.push(r);
  for (const r of indexes) {
    // index yang lahir dari constraint sudah ikut tertulis di constraint-nya
    if (/^CREATE UNIQUE INDEX .* _pkey$/.test(r.indexdef)) continue;
    byTable.get(r.table_name)?.idx.push(r);
  }
  const rlsMap = new Map(rls.map(r => [r.table_name, r.rls_enabled]));

  const parts = [];
  for (const [table, { cols, cons, idx }] of byTable) {
    if (!cols.length) continue;

    const colLines = cols.map(c => {
      let def = `  ${c.column_name} ${c.data_type}`;
      if (c.identity && c.identity !== '') def += ' GENERATED BY DEFAULT AS IDENTITY';
      else if (c.default_expr) def += ` DEFAULT ${c.default_expr}`;
      if (c.not_null) def += ' NOT NULL';
      return def;
    });

    const conLines = cons.map(c => `  CONSTRAINT ${c.conname} ${c.definition}`);

    parts.push(
      `-- ${table}\n` +
      `CREATE TABLE IF NOT EXISTS public.${table} (\n` +
      [...colLines, ...conLines].join(',\n') +
      `\n);\n` +
      `ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY;\n` +
      (idx.length ? idx.map(i => `${i.indexdef};`).join('\n') + '\n' : '')
    );
  }
  return { sql: parts.join('\n'), rlsMap };
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Program utama
// ─────────────────────────────────────────────────────────────────────────────
async function main() {
  const used = tablesUsedInCode();
  const defined = tablesDefinedInSql();
  const missing = [...used.keys()].filter(t => !defined.has(t)).sort();

  console.log(`\n${'='.repeat(74)}`);
  console.log('  SINKRONISASI SKEMA — kode vs SQL');
  console.log(`${'='.repeat(74)}`);
  console.log(`  Tabel dipakai kode ................. ${used.size}`);
  console.log(`  Tabel didefinisikan di SQL ......... ${defined.size}`);
  console.log(`  Tabel HILANG dari repo ............. ${missing.length}`);
  console.log(`  Tabel di SQL tapi tak dipakai ...... ${[...defined].filter(t => !used.has(t)).length}`);
  console.log(`${'='.repeat(74)}\n`);

  if (!missing.length) {
    console.log('  ✅ Repositori sudah memuat seluruh tabel yang dipakai kode.\n');
    return;
  }

  const writeTargets = ALL ? [...used.keys()].sort() : missing;
  console.log(`  ${writeTargets.length} tabel akan dituliskan:\n`);
  for (const t of writeTargets.slice(0, 40)) {
    const u = used.get(t);
    const w = u ? `baca ${u.reads} / tulis ${u.writes}` : '';
    console.log(`     ${w ? (u.writes ? '✎' : ' ') : ' '} ${t.padEnd(38)} ${w}`);
  }
  if (writeTargets.length > 40) console.log(`     … dan ${writeTargets.length - 40} tabel lain`);

  const url = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
  if (!url) {
    console.error(`
  ❌ SUPABASE_DB_URL belum diisi, jadi definisi tabel tidak bisa dibaca.

     Skrip ini SENGAJA tidak menebak-nebak DDL: tipe kolom, constraint,
     index, dan default value tidak dapat diketahui dari sisi klien. Menebak
     112 definisi tabel hanya akan menghasilkan skema yang salah.

     Ambil connection string lalu jalankan ulang:
       Dashboard → Project Settings → Database → Connection string → URI
       export SUPABASE_DB_URL='postgresql://postgres.<ref>:<PASSWORD>@...:5432/postgres'
       npm run db:schema-sync

     File migrasi hasilnya bisa langsung di-commit, dan sejak itu skema
     ikut ter-version-control.
`);
    process.exit(1);
  }

  console.log('\n  Membaca skema dari database (hanya baca)…');
  const data = await introspect(url, writeTargets);
  const { sql } = buildDdl(data, writeTargets);

  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const file = path.join(MIGRATIONS, `${stamp}_baseline_missing_tables.sql`);

  const header = `-- ============================================================================
--  BASELINE SKEMA — tabel yang dipakai kode tetapi belum ada di repositori
--  Dihasilkan oleh: npm run db:schema-sync (${new Date().toISOString()})
--
--  ISI BERKAS INI DIAMBIL LANGSUNG DARI DATABASE, bukan hasil terkaan.
--  Sebelumnya tabel-tabel ini hanya ada di dashboard Supabase sehingga repo
--  tidak dapat di-deploy dari nol.
--
--  Jalankan SETELAH migrasi lain, lalu verifikasi:
--    npm run audit:deep        → bagian "integritas skema" harus 0
-- ============================================================================

${sql}`;

  if (DRY) {
    console.log(`\n  [DRY-RUN] berkas berikut TIDAK ditulis: ${path.relative(ROOT, file)}`);
    console.log(`  Panjang DDL: ${sql.length} karakter\n`);
    return;
  }

  if (!existsSync(MIGRATIONS)) {
    console.error(`\n  ❌ Direktori tidak ada: ${path.relative(ROOT, MIGRATIONS)}\n`);
    process.exit(1);
  }
  writeFileSync(file, header);
  console.log(`\n  ✅ Migrasi ditulis: ${path.relative(ROOT, file)}`);
  console.log('     Periksa isinya, lalu commit. Setelah itu `supabase db reset`');
  console.log('     dan deployment dari nol akan berjalan.\n');
}

main().catch((err) => {
  console.error(`\n❌ Gagal: ${err.message}\n`);
  process.exit(1);
});
