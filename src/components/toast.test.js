/**
 * @vitest-environment jsdom
 *
 * Tes komponen notifikasi (toast).
 *
 * Yang dikunci di sini adalah perilaku yang pernah salah di produksi: pesan
 * galat tidak hilang sendiri (memang disengaja), tetapi karena itu pula
 * tumpukannya bisa mencapai sembilan buah dan MENUTUPI separuh layar. Batas
 * jumlah inilah yang diuji — termasuk bahwa yang dibuang adalah notifikasi
 * TERTUA, bukan yang baru muncul.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { toast } from './toast.js';

beforeEach(() => {
  document.body.innerHTML = '';
});

describe('toast — batas jumlah', () => {
  it('menampilkan satu notifikasi', () => {
    toast('Halo', 'info', 0);
    expect(document.querySelectorAll('.toast').length).toBe(1);
    expect(document.querySelector('.toast').textContent).toContain('Halo');
  });

  it('membatasi tumpukan menjadi 3 dan membuang yang tertua', () => {
    for (let n = 1; n <= 9; n++) toast(`Galat ${n}`, 'error');

    const semua = [...document.querySelectorAll('.toast')];
    expect(semua.length).toBe(3);
    // Yang bertahan adalah tiga TERAKHIR — pesan paling baru yang relevan.
    expect(semua.map((el) => el.textContent).join(' | ')).not.toContain('Galat 1');
    expect(semua.map((el) => el.textContent).join(' | ')).toContain('Galat 9');
    expect(semua.map((el) => el.textContent).join(' | ')).toContain('Galat 8');
    expect(semua.map((el) => el.textContent).join(' | ')).toContain('Galat 7');
  });

  it('tidak membuang apa pun sebelum melewati batas', () => {
    toast('Satu', 'success', 0);
    toast('Dua', 'info', 0);
    toast('Tiga', 'warning', 0);
    expect(document.querySelectorAll('.toast').length).toBe(3);
    expect(document.querySelector('.toast-container').textContent).toContain('Satu');
  });

  it('mengabaikan pesan kosong', () => {
    toast('   ', 'info', 0);
    toast(null, 'info', 0);
    expect(document.querySelectorAll('.toast').length).toBe(0);
  });

  it('galat bertahan sampai ditutup (durasi bawaan 0)', async () => {
    const tutup = toast('Gagal menyimpan', 'error');
    await new Promise((r) => setTimeout(r, 30));
    expect(document.querySelectorAll('.toast').length).toBe(1);
    tutup();
    await new Promise((r) => setTimeout(r, 30));
    // Animasi keluar 400 ms; yang penting kelas 'hide' sudah dipasang.
    expect(document.querySelector('.toast')?.classList.contains('hide') || !document.querySelector('.toast')).toBe(true);
  });

  it('judul memakai bahasa Indonesia', () => {
    toast('Ada masalah', 'error', 0);
    expect(document.querySelector('.toast').textContent).toContain('Gagal');
  });
});
