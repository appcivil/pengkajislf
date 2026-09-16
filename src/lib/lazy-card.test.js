/**
 * Tes mekanisme lazy card — bagian yang membuat halaman detail proyek
 * tidak lagi mengunduh ~990 KB kode sekaligus.
 *
 * Yang diverifikasi:
 *   - kerangka (shell) dirender dengan id root yang benar
 *   - modul diimpor dinamis, kartu asli menggantikan kerangka
 *   - handler init dipanggil setelah DOM kartu terpasang
 *   - fetch ringkasan dijalankan sekali, tidak saat load halaman
 *   - idempoten (tidak dihidrasi dua kali)
 *   - kegagalan modul menampilkan kartu error, bukan halaman kosong
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  defineLazyCard, lazyCardShell, hydrateCard, hydrateLazyCards, resetLazyCards,
} from './lazy-card.js';

const flush = () => new Promise((r) => setTimeout(r, 0));

function setupDom() {
  document.body.innerHTML = '<div id="page-root"></div>';
  return document.getElementById('page-root');
}

describe('lazy-card — kerangka kartu', () => {
  beforeEach(() => {
    resetLazyCards();
    defineLazyCard('demo', {
      rootId: 'demo-card',
      loader: async () => ({ renderDemoCard: () => '<div id="demo-card">ASLI</div>' }),
      renderKey: 'renderDemoCard',
    });
  });

  it('merender kerangka dengan id root yang benar (agar ?tab= tetap bekerja)', () => {
    const html = lazyCardShell('demo', { minHeight: 250, label: 'Memuat demo…' });
    expect(html).toContain('id="demo-card"');
    expect(html).toContain('data-lazy-card="demo"');
    expect(html).toContain('min-height:250px');
    expect(html).toContain('Memuat demo…');
  });

  it('menandai kerangka sebagai belum terisi (bukan kartu asli)', () => {
    expect(lazyCardShell('demo')).not.toContain('ASLI');
  });
});

describe('lazy-card — hidrasi', () => {
  let root;

  beforeEach(() => {
    resetLazyCards();
    root = setupDom();
  });

  it('mengganti kerangka dengan kartu asli dan mempertahankan id root', async () => {
    const init = vi.fn();
    defineLazyCard('fire', {
      rootId: 'fire-protection-card',
      loader: async () => ({
        renderFireProtectionCard: (p, s) => `<div id="fire-protection-card">${p.nama} / ${s.status}</div>`,
        initFireProtectionHandlers: init,
      }),
      renderKey: 'renderFireProtectionCard',
      initKey: 'initFireProtectionHandlers',
    });

    root.innerHTML = lazyCardShell('fire');
    expect(root.querySelector('[data-lazy-card="fire"]')).not.toBeNull();

    const ok = await hydrateCard('fire', { p: { id: 'p1', nama: 'Gedung A' }, id: 'p1' });

    expect(ok).toBe(true);
    expect(root.querySelector('[data-lazy-card="fire"]')).toBeNull();          // kerangka hilang
    const card = document.getElementById('fire-protection-card');
    expect(card).not.toBeNull();                                             // id root dipertahankan
    expect(card.textContent).toContain('Gedung A');
    expect(init).toHaveBeenCalledWith('p1');                                 // handler dipasang
  });

  it('mengambil ringkasan lewat fetchKey hanya saat hidrasi', async () => {
    const fetchSummary = vi.fn(async () => ({ status: 'AMAN' }));
    defineLazyCard('lps', {
      rootId: 'lps-module-card',
      loader: async () => ({
        renderLPSCard: (p, s) => `<div id="lps-module-card">${s.status}</div>`,
        fetchLPSSummary: fetchSummary,
      }),
      fetchKey: 'fetchLPSSummary',
      renderKey: 'renderLPSCard',
    });

    root.innerHTML = lazyCardShell('lps');
    expect(fetchSummary).not.toHaveBeenCalled();        // belum dipanggil saat halaman dibuka

    await hydrateCard('lps', { p: { id: 'p2' }, id: 'p2', summaries: {} });
    expect(fetchSummary).toHaveBeenCalledWith('p2');
    expect(document.getElementById('lps-module-card').textContent).toContain('AMAN');
  });

  it('idempoten — hidrasi kedua tidak mengulang pekerjaan', async () => {
    const init = vi.fn();
    defineLazyCard('intensity', {
      rootId: 'building-intensity-card',
      loader: async () => ({
        renderBuildingIntensityCard: () => '<div id="building-intensity-card">ok</div>',
        initBuildingIntensityHandlers: init,
      }),
      renderKey: 'renderBuildingIntensityCard',
      initKey: 'initBuildingIntensityHandlers',
    });

    root.innerHTML = lazyCardShell('intensity');
    await hydrateCard('intensity', { p: { id: 'p3' }, id: 'p3' });
    await hydrateCard('intensity', { p: { id: 'p3' }, id: 'p3' });

    expect(init).toHaveBeenCalledTimes(1);
  });

  it('kegagalan modul menampilkan kartu error, bukan halaman kosong', async () => {
    defineLazyCard('rusak', {
      rootId: 'rusak-card',
      loader: async () => { throw new Error('chunk gagal diunduh'); },
      renderKey: 'renderRusakCard',
    });

    root.innerHTML = lazyCardShell('rusak');
    const ok = await hydrateCard('rusak', { p: { id: 'p4' }, id: 'p4' });

    expect(ok).toBe(false);
    expect(root.textContent).toContain('Modul gagal dimuat');
    expect(root.textContent).toContain('chunk gagal diunduh');
  });

  it('hidrasi massal bekerja walau IntersectionObserver tidak ada (fallback)', async () => {
    const init = vi.fn();
    defineLazyCard('a', {
      rootId: 'a-card',
      loader: async () => ({ renderA: () => '<div id="a-card">A</div>', initA: init }),
      renderKey: 'renderA',
      initKey: 'initA',
    });
    defineLazyCard('b', {
      rootId: 'b-card',
      loader: async () => ({ renderB: () => '<div id="b-card">B</div>' }),
      renderKey: 'renderB',
    });

    root.innerHTML = lazyCardShell('a') + lazyCardShell('b');
    hydrateLazyCards({ p: { id: 'p5' }, id: 'p5' });
    await flush();

    expect(document.getElementById('a-card')).not.toBeNull();
    expect(document.getElementById('b-card')).not.toBeNull();
  });

  it('kartu yang menjadi target ?tab= dimuat lebih dulu', async () => {
    const loadA = vi.fn(async () => ({ renderA: () => '<div id="a-card">A</div>' }));
    const loadC = vi.fn(async () => ({ renderC: () => '<div id="c-card">C</div>' }));
    defineLazyCard('a', { rootId: 'a-card', loader: loadA, renderKey: 'renderA' });
    defineLazyCard('c', { rootId: 'c-card', loader: loadC, renderKey: 'renderC' });

    root.innerHTML = lazyCardShell('a') + lazyCardShell('c');
    // 'a' berada di luar viewport → tidak diobservasi; 'c' dipaksa (target tab)
    hydrateLazyCards({ p: { id: 'p6' }, id: 'p6' }, { force: ['c'] });
    await flush();

    expect(loadC).toHaveBeenCalled();
    expect(document.getElementById('c-card')).not.toBeNull();
  });
});
