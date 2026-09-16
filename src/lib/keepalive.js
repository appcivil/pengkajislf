/**
 * ============================================================
 *  KEEPALIVE SUPABASE (SISI KLIEN)
 *
 *  Supabase Free mem-pause proyek setelah 7 hari TANPA AKTIVITAS
 *  DATABASE. Modul ini memastikan setiap kali aplikasi dibuka —
 *  oleh siapa pun, di perangkat mana pun — ada satu query kecil
 *  ke database, dengan pembatas maksimal 1x per 48 jam per perangkat.
 *
 *  Ini adalah lapisan cadangan (defense in depth):
 *    1. GitHub Actions cron tiap 2 hari  (lihat .github/workflows/supabase-keepalive.yml)
 *    2. Ping dari aplikasi saat dibuka   (modul ini)
 *    3. Edge Function /functions/v1/keepalive (jalur alternatif bila RLS menolak)
 *
 *  Biaya egress: ± 1 baris × beberapa ratus byte per ping.
 *  Ping 15x/bulan ≈ < 50 KB/bulan → tidak signifikan.
 * ============================================================
 *
 * @module lib/keepalive
 */

import { supabase, isSupabaseConfigured } from './supabase.js';
import { createLogger } from './logger.js';

const log = createLogger('KeepAlive');

const LS_KEY = 'slf_keepalive_last';
const HOUR = 60 * 60 * 1000;

/** Jeda sebelum ping pertama — jangan berebut dengan boot aplikasi. */
const START_DELAY_MS = 8 * 1000;

/** Interval default: 2 hari, sesuai permintaan (jauh di bawah batas 7 hari). */
export const DEFAULT_INTERVAL_HOURS = 48;

/** Tabel keepalive (dibuat oleh migration 20260916_keepalive_and_indexes.sql). */
const KEEPALIVE_TABLE = 'keepalive_ping';

/** Tabel cadangan bila keepalive_ping belum ada / RLS menolak. */
const FALLBACK_TABLE = 'proyek';

function readLastPing() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    const val = raw ? Number(raw) : 0;
    return Number.isFinite(val) ? val : 0;
  } catch (_) {
    return 0; // localStorage diblokir → anggap belum pernah ping
  }
}

function writeLastPing(ts = Date.now()) {
  try { localStorage.setItem(LS_KEY, String(ts)); } catch (_) { /* noop */ }
}

/**
 * Kirim satu ping ringan yang benar-benar menyentuh database.
 *
 * Egress minimal: `select('id').limit(1)` hanya menarik 1 baris kecil
 * (bukan `select('*')`).
 *
 * @param {{force?: boolean}} [options]
 * @returns {Promise<{ok: boolean, via: string, ms: number, skipped?: string}>}
 */
export async function pingKeepAlive(options = {}) {
  const { force = false } = options;
  const started = Date.now();

  if (!isSupabaseConfigured()) {
    log.warn('Supabase belum dikonfigurasi — ping dilewati.');
    return { ok: false, via: 'none', ms: 0, skipped: 'not-configured' };
  }

  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return { ok: false, via: 'none', ms: 0, skipped: 'offline' };
  }

  // 1. Jalur utama: tabel keepalive_ping (1 baris, kolom id saja)
  try {
    const { error } = await supabase
      .from(KEEPALIVE_TABLE)
      .select('id')
      .limit(1);

    if (!error) {
      if (force) log.info('Ping keepalive terkirim (tabel keepalive_ping).');
      return { ok: true, via: 'table:keepalive_ping', ms: Date.now() - started };
    }
    log.debug('Tabel keepalive_ping tidak tersedia:', error.message);
  } catch (err) {
    log.debug('Ping tabel gagal:', err?.message);
  }

  // 2. Jalur cadangan: HEAD request (hanya header, nol baris data)
  try {
    const { error } = await supabase
      .from(FALLBACK_TABLE)
      .select('id', { count: 'exact', head: true })
      .limit(1);

    if (!error) {
      log.info('Ping keepalive terkirim (head count pada proyek).');
      return { ok: true, via: 'head:proyek', ms: Date.now() - started };
    }
    log.debug('Head count gagal:', error.message);
  } catch (err) {
    log.debug('Head count error:', err?.message);
  }

  // 3. Jalur terakhir: Edge Function keepalive (jalan dengan service role)
  try {
    const { data, error } = await supabase.functions.invoke('keepalive', {
      method: 'POST',
      body: { source: 'client', ts: Date.now() },
    });
    if (!error) {
      log.info('Ping keepalive via Edge Function:', data?.ok ?? true);
      return { ok: true, via: 'edge:keepalive', ms: Date.now() - started };
    }
    log.warn('Edge Function keepalive gagal:', error.message);
  } catch (err) {
    log.warn('Edge Function keepalive error:', err?.message);
  }

  log.warn('Semua jalur ping keepalive gagal — periksa koneksi/konfigurasi.');
  return { ok: false, via: 'none', ms: Date.now() - started, skipped: 'all-failed' };
}

/**
 * Ping bila sudah lewat interval (default 48 jam). Tidak pernah melempar error.
 *
 * @param {{force?: boolean, intervalHours?: number}} [options]
 */
export async function maybePing(options = {}) {
  const { force = false, intervalHours = DEFAULT_INTERVAL_HOURS } = options;
  const last = readLastPing();
  const ageMs = Date.now() - last;

  if (!force && last && ageMs < intervalHours * HOUR) {
    log.debug(`Ping dilewati — terakhir ${(ageMs / HOUR).toFixed(1)} jam lalu.`);
    return { ok: true, via: 'throttled', ms: 0, skipped: 'throttled' };
  }

  try {
    const result = await pingKeepAlive({ force });
    if (result.ok) writeLastPing();
    return result;
  } catch (err) {
    log.warn('maybePing gagal (diabaikan):', err?.message);
    return { ok: false, via: 'none', ms: 0, skipped: 'exception' };
  }
}

/**
 * Inisialisasi keepalive otomatis. Dipanggil sekali dari main.js.
 *
 * @param {{intervalHours?: number, delayMs?: number}} [options]
 * @returns {() => void} fungsi pembersih (clearTimeout)
 */
export function initKeepalive(options = {}) {
  const { intervalHours = DEFAULT_INTERVAL_HOURS, delayMs = START_DELAY_MS } = options;

  const timer = setTimeout(() => {
    maybePing({ intervalHours }).catch(() => {});
  }, delayMs);

  // Kesempatan kedua: saat tab kembali aktif (mis. besok pagi dibuka lagi)
  const onVisible = () => {
    if (document.visibilityState === 'visible') {
      maybePing({ intervalHours }).catch(() => {});
    }
  };
  document.addEventListener?.('visibilitychange', onVisible);

  log.debug(`Keepalive aktif — interval ${intervalHours} jam.`);

  return () => {
    clearTimeout(timer);
    document.removeEventListener?.('visibilitychange', onVisible);
  };
}

/** Status terakhir untuk ditampilkan di UI pengaturan (opsional). */
export function getKeepaliveStatus() {
  const last = readLastPing();
  return {
    lastPing: last || null,
    lastPingAgoHours: last ? Number(((Date.now() - last) / HOUR).toFixed(1)) : null,
    intervalHours: DEFAULT_INTERVAL_HOURS,
    nextDueInHours: last
      ? Math.max(0, Number((DEFAULT_INTERVAL_HOURS - (Date.now() - last) / HOUR).toFixed(1)))
      : 0,
  };
}

export default { initKeepalive, maybePing, pingKeepAlive, getKeepaliveStatus };
