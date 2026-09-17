/**
 * Terjemahkan label antarmuka berdasarkan kamus (kamus-label.json).
 *
 * Skrip ini memakai ULANG pendeteksi yang sama dengan aturan audit E5
 * (teks di antara dua tag + nilai atribut placeholder/title/aria-label/alt),
 * lalu mengganti HANYA potongan yang terdeteksi itu. Jadi:
 *   - label yang tidak ada di kamus dilaporkan, tidak diganti;
 *   - kode/logika (perbandingan string, kunci objek, id) tidak tersentuh,
 *     karena tidak pernah dicocokkan sebagai teks tampilan.
 *
 * Pakai: node alat-periksa/terjemahkan-label.mjs <akar-repo> [--tulis]
 * Tanpa --tulis hanya melaporkan (mode uji).
 */
import { readdirSync, statSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative, isAbsolute } from 'node:path';

const AKAR = process.argv[2] || process.cwd();
const TULIS = process.argv.includes('--tulis');
const kamus = JSON.parse(readFileSync(new URL('./kamus-label.json', import.meta.url), 'utf8')).translation;
const normal = (s) => s.replace(/&[a-z]+;/gi, ' ').replace(/\s+/g, ' ').trim().toLowerCase();

const berkas = [];
(function jalan(d) {
  for (const n of readdirSync(d)) {
    if (/node_modules|\.git$/.test(n)) continue;
    const p = join(d, n), s = statSync(p);
    if (s.isDirectory()) jalan(p);
    else if (/\.(js|html)$/.test(n) && !/\.test\.js$/.test(n)) berkas.push(p);
  }
})(join(AKAR, 'src'));
berkas.push(join(AKAR, 'index.html'));

let jumlahGanti = 0;
const berkasBerubah = [];
const takAdaKamus = new Set();

for (const p of berkas) {
  let code = readFileSync(p, 'utf8');
  const asli = code;
  // Kumpulkan SEMUA kecocokan lebih dahulu, lalu ganti dari belakang supaya
  // indeks kecocokan sebelumnya tidak bergeser.
  const cocok = [];
  // Pola sama dengan aturan E5: teks boleh berada di barisnya sendiri.
  for (const m of code.matchAll(/>([^<>]{4,300})</g)) cocok.push({ isi: m[1], mulai: m.index + 1 });
  for (const m of code.matchAll(/(?:placeholder|title|aria-label|alt)\s*=\s*"([^"\n]{4,120})"/g)) {
    cocok.push({ isi: m[1], mulai: m.index + m[0].length - m[1].length - 1 });
  }
  // Label yang datang dari DATA, mis. { text: 'Quantum Neural Synthesis…' }
  // atau { label: 'Import Data' } — nilainya dirender sebagai label, tetapi
  // bukan "teks di antara dua tag" sehingga tidak terlihat oleh pola kedua.
  for (const m of code.matchAll(/(?:^|[{,\s])(text|label|title|judul|subtitle|heading)\s*:\s*(['"])([^'"\n]{4,110})\2/g)) {
    cocok.push({ isi: m[3], mulai: m.index + m[0].length - m[3].length - 1 });
  }
  cocok.sort((a, b) => b.mulai - a.mulai);

  for (const c of cocok) {
    const kunci = normal(c.isi);
    const ganti = kamus[kunci];
    if (!ganti) {
      if (/[A-Za-z]{3}/.test(kunci) && !kamus[`_lewati ${kunci}`]) takAdaKamus.add(kunci);
      continue;
    }
    // Pertahankan spasi di tepi teks asli (mis. " Label " → " Terjemahan ").
    const depan = c.isi.match(/^\s*/)[0];
    const belakang = c.isi.match(/\s*$/)[0];
    code = code.slice(0, c.mulai) + depan + ganti + belakang + code.slice(c.mulai + c.isi.length);
    jumlahGanti++;
  }
  if (code !== asli) {
    berkasBerubah.push(relative(AKAR, p));
    if (TULIS) writeFileSync(p, code);
  }
}
console.log(`  ${jumlahGanti} penggantian di ${berkasBerubah.length} berkas${TULIS ? ' (ditulis)' : ' (mode uji, belum ditulis)'}`);
for (const b of berkasBerubah) console.log(`   · ${b}`);
if (takAdaKamus.size) {
  console.log(`\n  ${takAdaKamus.size} teks terdeteksi belum ada di kamus (dibiarkan apa adanya):`);
  for (const t of [...takAdaKamus].sort()) console.log(`   ? "${t}"`);
}
