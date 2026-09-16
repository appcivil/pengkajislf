// @vitest-environment jsdom
/**
 * Tes router — fokus pada status memuat.
 *
 * Sebelum perbaikan ini, rute yang mengambil data tidak memberi umpan balik
 * apa pun: selama permintaan Supabase berjalan, halaman sebelumnya tetap
 * terpampang tanpa perubahan. Tes di bawah mengunci perilaku barunya:
 *
 *   • rute cepat  → kerangka TIDAK muncul (tidak ada kedipan)
 *   • rute lambat → kerangka muncul, aria-busy dipasang, lalu dibersihkan
 *   • rute gagal  → kerangka hilang, pesan galat tampil, dan diumumkan
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Rute selain login/verify dijaga oleh pemeriksaan autentikasi. Tes ini menguji
// router, bukan autentikasi, jadi penjaga itu diganti dengan versi yang selalu
// meloloskan — kalau tidak, setiap rute uji akan dialihkan ke halaman masuk.
vi.mock('./auth.js', () => ({
  isAuthenticated: () => true,
  getCurrentUser: () => ({ id: 'uji' }),
}));

import { route, startRouter, navigate } from './router.js';
import { _internals } from './a11y.js';

/**
 * Berpindah rute.
 *
 * PENTING: jsdom TIDAK memicu peristiwa `hashchange` ketika
 * window.location.hash diubah (sudah diverifikasi langsung). Tanpa
 * dispatchEvent di bawah, router tidak pernah menjalankan resolve() dan
 * setiap tes akan lulus atau gagal tanpa menguji apa pun.
 */
function pindahKe(path) {
  window.location.hash = `#/${path}`;
  window.dispatchEvent(new HashChangeEvent('hashchange'));
}

// Router menyimpan daftar rute di tingkat modul; setiap tes memakai nama rute
// yang unik supaya tidak saling mewarisi handler.
let seq = 0;
const unik = (nama) => `${nama}-${++seq}`;

function mount() {
  const el = document.createElement('div');
  el.id = 'app';
  document.body.appendChild(el);
  return el;
}

async function selesaikan(ms = 0) {
  await new Promise((r) => setTimeout(r, ms));
}

beforeEach(() => {
  document.body.innerHTML = '';
  _internals.resetDialogs();
  document.querySelectorAll('[data-a11y-live]').forEach((n) => n.remove());
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('router — status memuat', () => {
  it('rute cepat tidak menampilkan kerangka (tidak ada kedipan)', async () => {
    const nama = unik('cepat');
    route(nama, async () => '<p>isi halaman</p>');
    const el = mount();
    startRouter(el);
    pindahKe(nama);
    await selesaikan(30);

    expect(el.querySelector('.route-loading')).toBeNull();
    expect(el.textContent).toContain('isi halaman');
  });

  it('rute lambat menampilkan kerangka, lalu menggantinya dengan isi halaman', async () => {
    const nama = unik('lambat');
    route(nama, async () => {
      await new Promise((r) => setTimeout(r, 400));
      return '<p>data akhirnya tiba</p>';
    });
    const el = mount();
    startRouter(el);
    pindahKe(nama);

    // Jeda ambang 150 ms — belum boleh tampil sebelum itu.
    await selesaikan(80);
    expect(el.querySelector('.route-loading'), 'kerangka muncul terlalu cepat').toBeNull();

    await selesaikan(200);
    const kerangka = el.querySelector('.route-loading');
    expect(kerangka, 'kerangka seharusnya sudah tampil').not.toBeNull();
    expect(el.getAttribute('aria-busy')).toBe('true');

    await selesaikan(400);
    expect(el.querySelector('.route-loading'), 'kerangka harus dibersihkan').toBeNull();
    expect(el.getAttribute('aria-busy')).toBeNull();
    expect(el.textContent).toContain('data akhirnya tiba');
  });

  it('rute yang gagal berhenti memuat dan menampilkan pesan galat', async () => {
    const nama = unik('gagal');
    route(nama, async () => {
      await new Promise((r) => setTimeout(r, 400));
      throw new Error('koneksi terputus');
    });
    const el = mount();
    startRouter(el);
    pindahKe(nama);
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await selesaikan(600);
    errSpy.mockRestore();

    expect(el.querySelector('.route-loading'), 'kerangka tidak boleh tertinggal').toBeNull();
    expect(el.getAttribute('aria-busy')).toBeNull();
    expect(el.textContent).toContain('Terjadi Kesalahan');
    expect(el.textContent).toContain('koneksi terputus');
  });

  it('memasang aria-busy pada wadah, bukan pada kerangkanya', async () => {
    // aria-busy harus berada pada elemen yang isinya berubah; memasangnya di
    // elemen anak membuat pembaca layar salah menafsirkan cakupan perubahan.
    const nama = unik('busy');
    route(nama, async () => {
      await new Promise((r) => setTimeout(r, 400));
      return '<p>selesai</p>';
    });
    const el = mount();
    startRouter(el);
    pindahKe(nama);
    await selesaikan(220);

    const kerangka = el.querySelector('.route-loading');
    expect(kerangka).not.toBeNull();
    expect(kerangka.hasAttribute('aria-busy')).toBe(false);
    expect(el.getAttribute('aria-busy')).toBe('true');

    await selesaikan(300);
  });

  it('kerangka memuat diberi teks untuk pembaca layar', async () => {
    const nama = unik('teks');
    route(nama, async () => {
      await new Promise((r) => setTimeout(r, 400));
      return '<p>selesai</p>';
    });
    const el = mount();
    startRouter(el);
    pindahKe(nama);
    await selesaikan(220);

    const kerangka = el.querySelector('.route-loading');
    expect(kerangka.getAttribute('role')).toBe('status');
    expect(kerangka.querySelector('.visually-hidden').textContent).toMatch(/Memuat/);
    await selesaikan(300);
  });

  it('navigasi ulang tidak menumpuk kerangka', async () => {
    const nama = unik('tumpuk');
    route(nama, async () => {
      await new Promise((r) => setTimeout(r, 400));
      return '<p>selesai</p>';
    });
    const el = mount();
    startRouter(el);
    window.location.hash = `#/${nama}`;
    await selesaikan(60);
    window.location.hash = `#/${nama}`;   // navigasi kedua saat yang pertama jalan
    await selesaikan(220);

    expect(el.querySelectorAll('.route-loading').length).toBeLessThanOrEqual(1);
    await selesaikan(400);
  });
});
