/**
 * Label yang datang dari DATA, bukan dari teks literal di template.
 *
 * Contoh nyata (src/pages/login.js): features = [{ icon, text: 'Quantum Neural
 * Synthesis (SNI 9273:2025)' }, …] lalu dirender sebagai ${f.text}. Pola seperti
 * ini tidak terlihat oleh pemeriksa "teks di antara dua tag", padahal yang
 * tergambar di layar tetap label itu.
 *
 * Pakai: node alat-periksa/daftar-label-data.mjs <akar-repo>
 */
import { readdirSync, statSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const AKAR = process.argv[2] || process.cwd();
// Kosakata yang cukup untuk menilai label pendek bergaya "judul fitur".
const EN = new Set(('quantum neural synthesis automated integrity compliance overwatch official gdocs digital ' +
  'sealing orchestrator strategic data visualization pulse maps encrypted cloud architecture bit aes secure sign ' +
  'in with google authorize direct identity alias email security keycase password override protocol bypass ' +
  'consortium entry executive summary report generate export print download upload settings configuration user ' +
  'profile logout welcome home dashboard project projects building structure analysis result results history ' +
  'search filter sort column row table chart graph total average maximum cost area weight height width length ' +
  'volume time date name description notes instructions steps section list value unit calculation loading failed ' +
  'success warning attention notice please enter select add remove delete save cancel close back page file users ' +
  'role status connected error invalid required optional title subtitle heading label placeholder button submit ' +
  'reset confirm apply preview edit update create new open view details overview recent latest all none yes no the ' +
  'of to for from with without by on at is are will can cannot must should your you this that when while before ' +
  'after until then than there here what which who how why enabled disabled active inactive pending completed ' +
  'running stopped started finished paused retry refresh reload sync synchronize import backup restore asset new ' +
  'run finalized fit document logger lighting gateway proceed final available minimum requirements mode type ' +
  'system version powered supporting technical capacity reference standard specifications metadata confidence ' +
  'permitted authority hereby approved rejected reviewed verified sealed disclosure retrieved estimated forecast ' +
  'scores rating grade level tier phase stage sample manual automatic online offline ranking utilization ' +
  'occupancy envelope resistance reinforcement displacement drift stiffness torsion modal shear moment deflection ' +
  'demand factor code equivalent static dynamic response spectrum dominant period base isolation damping ratio ' +
  'mass participation load profile power target focus secure verification comprehensive generating a see not only').split(/\s+/));
// Ejaan sama di dua bahasa / nama format — bukan bukti bahasa Inggris.
const BERSAMA = new Set(['data', 'volume', 'minimum', 'total', 'area', 'status', 'normal', 'final', 'unit', 'docx', 'pdf', 'xlsx', 'csv', 'excel', 'ies', 'iot', 'kwh', 'lux', 'ppm']);
// Istilah baku profesi / nama merek.
const TETAP = /^(pushover|ach\b|df\b|daylight\s+factor|noise\s+criteria|air\s+changes|air\s+flow|ies\b|lpd\b|cct\b|cri\b|nfpa|sni|asce|ashrae|astm|iso|iec|api\b|ai\b|slf\b|sim\s?bg|google|excel|docx|pdf|xlsx|csv|2d|3d|etabs|sap2000|epanet)/i;

const berkas = [];
(function jalan(d) {
  for (const n of readdirSync(d)) {
    if (/node_modules|\.git$/.test(n)) continue;
    const p = join(d, n), s = statSync(p);
    if (s.isDirectory()) jalan(p);
    else if (/\.js$/.test(n) && !/\.test\.js$/.test(n)) berkas.push(p);
  }
})(join(AKAR, 'src'));

const temuan = new Map();
for (const p of berkas) {
  const code = readFileSync(p, 'utf8');
  const pola = /(?:^|[{,\s])(text|label|title|judul|placeholder|subtitle|heading)\s*:\s*(['"])([^'"\n]{6,110})\2/g;
  for (const m of code.matchAll(pola)) {
    const isi = m[3];
    if (/[${}=<>@]|https?:\/\//.test(isi)) continue;
    const kata = isi.split(/[^A-Za-z]+/).filter(Boolean);   // hanya kata berhuruf yang dinilai
    if (kata.length < 2) continue;
    if (TETAP.test(isi)) continue;
    if (kata.some((w) => !EN.has(w.toLowerCase()))) continue;
    if (kata.every((w) => BERSAMA.has(w.toLowerCase()))) continue;
    const baris = code.slice(0, m.index).split('\n').length;
    if (!temuan.has(isi.toLowerCase())) temuan.set(isi.toLowerCase(), { isi, rel: relative(AKAR, p), baris });
  }
}
console.log(`  ${temuan.size} label dari data yang masih berbahasa Inggris:`);
for (const { isi, rel, baris } of temuan.values()) console.log(`   · ${rel}:${baris}  "${isi}"`);
