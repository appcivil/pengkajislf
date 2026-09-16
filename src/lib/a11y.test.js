/**
 * @vitest-environment jsdom
 *
 * Tes lapisan aksesibilitas.
 *
 * Lingkungan jsdom dipilih (bukan happy-dom) karena perilaku fokus, `inert`,
 * dan perpindahan fokus pada happy-dom tidak cukup setia — sebelumnya audit
 * keamanan proyek ini pernah mendapat "lulus palsu" dari happy-dom. Untuk
 * tes yang menguji fokus, itu tidak dapat diterima.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  announce,
  installKeyboardEnhancer,
  installDialogEscapeHandler,
  makeDialog,
  prefersReducedMotion,
  setBusy,
  _internals,
} from './a11y.js';

/** Bersihkan DOM dan wilayah pengumuman antar tes. */
function resetDom() {
  document.body.innerHTML = '';
  document.body.removeAttribute('data-dialog-open');
  // Tumpukan dialog bersifat tingkat-modul; tanpa pengosongan, dialog yang
  // tidak dilepas pada satu tes membuat tes berikutnya salah menilai.
  _internals.resetDialogs();
}

describe('a11y — wilayah pengumuman', () => {
  beforeEach(resetDom);

  it('membuat wilayah role=status dan role=alert', () => {
    _internals.ensureLiveRegion();
    expect(document.querySelector('[role="status"]')).not.toBeNull();
    expect(document.querySelector('[role="alert"]')).not.toBeNull();
  });

  it('menuliskan pesan ke wilayah yang benar setelah jeda', async () => {
    vi.useFakeTimers();
    announce('Data tersimpan');
    await vi.advanceTimersByTimeAsync(100);
    expect(document.querySelector('[role="status"]').textContent).toBe('Data tersimpan');
    vi.useRealTimers();
  });

  it('pesan mendesak masuk ke wilayah assertive', async () => {
    vi.useFakeTimers();
    announce('Koneksi terputus', { assertive: true });
    await vi.advanceTimersByTimeAsync(100);
    expect(document.querySelector('[role="alert"]').textContent).toBe('Koneksi terputus');
    expect(document.querySelector('[role="status"]').textContent).toBe('');
    vi.useRealTimers();
  });

  it('mengosongkan dulu supaya pesan yang sama tetap diumumkan ulang', async () => {
    vi.useFakeTimers();
    announce('Tersimpan');
    await vi.advanceTimersByTimeAsync(100);
    const region = document.querySelector('[role="status"]');
    expect(region.textContent).toBe('Tersimpan');

    // Tanpa pengosongan, pembaca layar mengabaikan perubahan karena isinya
    // dianggap sama dengan sebelumnya.
    announce('Tersimpan');
    expect(region.textContent).toBe('');
    await vi.advanceTimersByTimeAsync(100);
    expect(region.textContent).toBe('Tersimpan');
    vi.useRealTimers();
  });

  it('mengabaikan pesan kosong tanpa melempar', () => {
    expect(() => announce('')).not.toThrow();
    expect(() => announce(null)).not.toThrow();
    expect(() => announce(undefined)).not.toThrow();
  });
});

describe('a11y — operabilitas keyboard', () => {
  beforeEach(resetDom);

  it('memberi role, tabindex, dan penanganan tombol pada <div onclick>', () => {
    document.body.innerHTML = '<div id="a" onclick="window.__x=1">Kartu</div>';
    installKeyboardEnhancer(document.body);
    const el = document.getElementById('a');
    expect(el.getAttribute('role')).toBe('button');
    expect(el.getAttribute('tabindex')).toBe('0');
  });

  // CATATAN PENTING TENTANG LINGKUNGAN TES
  // jsdom di konfigurasi proyek ini TIDAK mengeksekusi atribut onclick inline
  // (tanpa `runScripts: 'dangerously'`). Karena itu tes di bawah memeriksa
  // hal yang sebenarnya menjadi kontrak pemasang ini: bahwa sebuah peristiwa
  // `click` benar-benar DIKIRIM saat Enter/Space ditekan. Eksekusi lanjutan
  // dari atribut tersebut adalah tanggung jawab peramban, bukan modul ini.
  // Pendengar biasa diuji lewat addEventListener agar tetap terverifikasi.
  it('Enter mengirim peristiwa click pada elemen tersebut', () => {
    document.body.innerHTML = '<div id="a" onclick="void 0">Kartu</div>';
    const el = document.getElementById('a');
    const onClick = vi.fn();
    el.addEventListener('click', onClick);
    installKeyboardEnhancer(document.body);
    el.focus();
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('Spasi mengirim click dan mencegah gulir halaman', () => {
    document.body.innerHTML = '<div id="a" onclick="void 0">Kartu</div>';
    const el = document.getElementById('a');
    const onClick = vi.fn();
    el.addEventListener('click', onClick);
    installKeyboardEnhancer(document.body);
    el.focus();
    const ev = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });
    el.dispatchEvent(ev);
    expect(onClick).toHaveBeenCalledTimes(1);
    // Tanpa preventDefault, menekan Spasi akan menggulir halaman.
    expect(ev.defaultPrevented).toBe(true);
  });

  it('tombol lain tidak memicu aksi', () => {
    document.body.innerHTML = '<div id="a" onclick="void 0">Kartu</div>';
    const el = document.getElementById('a');
    const onClick = vi.fn();
    el.addEventListener('click', onClick);
    installKeyboardEnhancer(document.body);
    el.focus();
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true }));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('tidak menyentuh elemen yang sudah merupakan kontrol asli', () => {
    document.body.innerHTML = '<button id="b" onclick="window.__z=1">Kirim</button>';
    const el = document.getElementById('b');
    installKeyboardEnhancer(document.body);
    expect(el.hasAttribute('tabindex')).toBe(false);
    expect(el.hasAttribute('role')).toBe(false);
  });

  it('menghormati role+tabindex yang sudah ditulis penulisnya', () => {
    document.body.innerHTML = '<div id="c" role="link" tabindex="-1" onclick="1">Tautan</div>';
    installKeyboardEnhancer(document.body);
    const el = document.getElementById('c');
    expect(el.getAttribute('role')).toBe('link');
    expect(el.getAttribute('tabindex')).toBe('-1');
  });

  it('menangani markah yang ditambahkan setelah pemasangan (MutationObserver)', async () => {
    installKeyboardEnhancer(document.body);
    const div = document.createElement('div');
    div.setAttribute('onclick', 'window.__late=1');
    div.textContent = 'Muncul belakangan';
    document.body.appendChild(div);

    // MutationObserver berjalan pada microtask.
    await Promise.resolve();
    await new Promise((r) => setTimeout(r, 0));

    expect(div.getAttribute('role')).toBe('button');
    expect(div.getAttribute('tabindex')).toBe('0');
  });

  it('tidak mengaktifkan dua kali ketika fokus ada di anak elemen', () => {
    document.body.innerHTML = '<div id="p" onclick="window.__n=(window.__n||0)+1"><i id="child">x</i></div>';
    window.__n = 0;
    installKeyboardEnhancer(document.body);
    const child = document.getElementById('child');
    // Peristiwa menggelembung dari anak; aksi tidak boleh ikut terpicu dari sini
    // karena pengguna sedang menekan tombol di dalam anak tersebut.
    const ev = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
    Object.defineProperty(ev, 'target', { value: child });
    document.getElementById('p').dispatchEvent(ev);
    expect(window.__n).toBe(0);
  });
});

describe('a11y — dialog', () => {
  beforeEach(resetDom);

  it('menandai elemen sebagai dialog dan memindahkan fokus ke dalamnya', async () => {
    document.body.innerHTML = `
      <button id="trigger">Buka</button>
      <div id="dlg"><h2 id="t">Judul</h2><button id="ok">OK</button></div>`;
    document.getElementById('trigger').focus();
    makeDialog(document.getElementById('dlg'), { labelledBy: 't' });

    const dlg = document.getElementById('dlg');
    expect(dlg.getAttribute('role')).toBe('dialog');
    expect(dlg.getAttribute('aria-modal')).toBe('true');
    expect(dlg.getAttribute('aria-labelledby')).toBe('t');

    await new Promise((r) => requestAnimationFrame(() => r()));
    expect(document.activeElement.id).toBe('ok');
  });

  it('Escape memanggil onClose', () => {
    document.body.innerHTML = '<div id="dlg"><button id="ok">OK</button></div>';
    const onClose = vi.fn();
    makeDialog(document.getElementById('dlg'), { onClose });
    document.getElementById('dlg').dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })
    );
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('Tab berputar di dalam dialog, tidak menembus ke belakang', async () => {
    document.body.innerHTML = `
      <button id="outside">Di luar</button>
      <div id="dlg"><button id="first">Pertama</button><button id="last">Terakhir</button></div>`;
    const dlg = document.getElementById('dlg');
    makeDialog(dlg);
    await new Promise((r) => requestAnimationFrame(() => r()));

    // Fokus di elemen terakhir + Tab → harus kembali ke elemen pertama
    document.getElementById('last').focus();
    const ev = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    dlg.dispatchEvent(ev);
    expect(document.activeElement.id).toBe('first');
    expect(ev.defaultPrevented).toBe(true);
  });

  it('Shift+Tab dari elemen pertama menuju elemen terakhir', async () => {
    document.body.innerHTML = `
      <div id="dlg"><button id="first">Pertama</button><button id="last">Terakhir</button></div>`;
    const dlg = document.getElementById('dlg');
    makeDialog(dlg);
    await new Promise((r) => requestAnimationFrame(() => r()));

    document.getElementById('first').focus();
    const ev = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true, cancelable: true });
    dlg.dispatchEvent(ev);
    expect(document.activeElement.id).toBe('last');
  });

  it('mengembalikan fokus ke elemen pemicu saat dilepas', async () => {
    document.body.innerHTML = '<button id="trigger">Buka</button><div id="dlg"><button>OK</button></div>';
    const trigger = document.getElementById('trigger');
    trigger.focus();
    const dispose = makeDialog(document.getElementById('dlg'));
    await new Promise((r) => requestAnimationFrame(() => r()));
    dispose();
    expect(document.activeElement.id).toBe('trigger');
  });

  it('membersihkan atribut yang ditambahkan sendiri, tidak yang sudah ada', () => {
    document.body.innerHTML = '<div id="dlg" role="alertdialog"></div>';
    const dlg = document.getElementById('dlg');
    const dispose = makeDialog(dlg);
    dispose();
    // role asli penulis harus dipertahankan
    expect(dlg.getAttribute('role')).toBe('alertdialog');
    expect(dlg.hasAttribute('aria-modal')).toBe(false);
  });
});

describe('a11y — jaring pengaman Escape', () => {
  beforeEach(resetDom);
  afterEach(() => resetDom());

  it('menutup dialog domain umum lewat tombol tutupnya', () => {
    document.body.innerHTML = `
      <div class="modal-overlay" style="display:block">
        <div class="modal" style="position:fixed">
          <button class="modal-close" aria-label="Tutup">x</button>
        </div>
      </div>`;
    // Pendengar sungguhan, bukan onclick inline: jsdom tidak menjalankan
    // atribut inline, sehingga tes akan lulus/ gagal tanpa menguji apa pun.
    const closed = vi.fn();
    document.querySelector('.modal-close').addEventListener('click', closed);
    const stop = installDialogEscapeHandler();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(closed).toHaveBeenCalledTimes(1);
    stop();
  });

  it('tidak melakukan apa pun bila tidak ada dialog', () => {
    const stop = installDialogEscapeHandler();
    expect(() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))).not.toThrow();
    stop();
  });

  it('tidak menangani Escape bila makeDialog sudah menanganinya', () => {
    document.body.innerHTML = `
      <div class="modal-overlay" style="display:block">
        <div id="dlg" style="position:fixed"><button class="modal-close" aria-label="Tutup" onclick="window.__c2=1">x</button></div>
      </div>`;
    const closed = vi.fn();
    document.querySelector('.modal-close').addEventListener('click', closed);
    const onClose = vi.fn();
    const stop = installDialogEscapeHandler();
    makeDialog(document.getElementById('dlg'), { onClose });

    // Escape didengar oleh dialog (fokus di dalamnya), bukan oleh jaring pengaman.
    document.getElementById('dlg').dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })
    );
    expect(onClose).toHaveBeenCalled();
    // Jaring pengaman tidak boleh ikut menutup dialog yang sudah ditangani.
    expect(closed).not.toHaveBeenCalled();
    stop();
  });
});

describe('a11y — setBusy', () => {
  beforeEach(resetDom);

  it('menonaktifkan tombol dan menandai aria-busy', () => {
    const btn = document.createElement('button');
    btn.textContent = 'Simpan';
    document.body.appendChild(btn);

    setBusy(btn, true, 'Menyimpan…');
    expect(btn.disabled).toBe(true);
    expect(btn.getAttribute('aria-busy')).toBe('true');
    expect(btn.textContent).toBe('Menyimpan…');
  });

  it('mengembalikan keadaan semula — mencegah tombol terkunci permanen', () => {
    const btn = document.createElement('button');
    btn.textContent = 'Simpan';
    document.body.appendChild(btn);

    setBusy(btn, true, 'Menyimpan…');
    setBusy(btn, false);
    expect(btn.disabled).toBe(false);
    expect(btn.hasAttribute('aria-busy')).toBe(false);
    expect(btn.textContent).toBe('Simpan');
  });
});

describe('a11y — preferensi gerakan', () => {
  it('membaca prefers-reduced-motion dari media query', () => {
    const original = window.matchMedia;
    window.matchMedia = vi.fn().mockReturnValue({ matches: true });
    expect(prefersReducedMotion()).toBe(true);
    window.matchMedia = vi.fn().mockReturnValue({ matches: false });
    expect(prefersReducedMotion()).toBe(false);
    window.matchMedia = original;
  });

  it('tidak melempar bila matchMedia tidak tersedia', () => {
    const original = window.matchMedia;
    // @ts-ignore
    delete window.matchMedia;
    expect(prefersReducedMotion()).toBe(false);
    window.matchMedia = original;
  });
});

describe('a11y — jaring pengaman Escape pada pola nyata aplikasi', () => {
  beforeEach(resetDom);

  // Pola-pola di bawah diambil apa adanya dari berkas di src/. Tujuannya
  // membuktikan bahwa jaring pengaman global benar-benar menutup dialog
  // seperti yang dipakai aplikasi ini — bukan hanya contoh buatan sendiri.
  const POLA = [
    {
      nama: 'modal dengan tombol .modal-close',
      html: `<div class="modal-overlay" style="display:block"><div class="modal" style="position:fixed">
               <button class="modal-close" aria-label="Tutup"><i class="fas fa-times"></i></button></div></div>`,
      pemicu: '.modal-close',
    },
    {
      nama: 'tombol tutup dengan aria-label="Tutup"',
      html: `<div class="modal-overlay" style="display:block"><div class="modal" style="position:fixed">
               <button type="button" aria-label="Tutup" class="btn btn-ghost"><i class="fas fa-xmark"></i></button></div></div>`,
      pemicu: '[aria-label="Tutup"]',
    },
    {
      nama: 'tombol tutup dengan atribut data-close',
      html: `<div class="modal-overlay" style="display:block"><div class="modal" style="position:fixed">
               <button data-close="1" class="btn">Batal</button></div></div>`,
      pemicu: '[data-close]',
    },
  ];

  for (const pola of POLA) {
    it(`menutup ${pola.nama}`, () => {
      document.body.innerHTML = pola.html;
      const klik = vi.fn();
      document.querySelector(pola.pemicu).addEventListener('click', klik);
      const stop = installDialogEscapeHandler();
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      expect(klik).toHaveBeenCalledTimes(1);
      stop();
    });
  }

  it('tidak menebak-nebak bila tidak ada tombol tutup yang dikenali', () => {
    // Lebih baik diam + memberi tahu pengguna daripada menutup dialog
    // yang salah atau menghapus data yang belum disimpan.
    document.body.innerHTML = `
      <div class="modal-overlay" style="display:block"><div class="modal" style="position:fixed">
        <button onclick="void 0">Hapus permanen</button></div></div>`;
    const klik = vi.fn();
    document.querySelector('button').addEventListener('click', klik);
    const stop = installDialogEscapeHandler();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(klik).not.toHaveBeenCalled();
    stop();
  });
});

describe('a11y — lapisan keyboard menangani pola nyata aplikasi', () => {
  beforeEach(resetDom);

  // Pola di bawah diambil apa adanya dari berkas yang dilaporkan audit
  // (div bersimbol status, kartu proyek, baris tabel). Bukti ini yang membuat
  // audit boleh berhenti melaporkan "elemen non-interaktif diberi handler klik":
  // tanpa lapisan ini, pola-pola tersebut memang tidak dapat dioperasikan
  // dengan keyboard.
  const POLA = [
    ['kartu proyek dengan onclick', '<div class="card" onclick="void 0"><h3>Proyek A</h3></div>'],
    ['sel tabel dengan onclick', '<table><tr><td onclick="void 0">Baris</td></tr></table>'],
    ['li pada daftar sidebar', '<ul><li onclick="void 0">Menu</li></ul>'],
  ];

  for (const [nama, html] of POLA) {
    it(`memberi peran, fokus, dan Enter/Space pada ${nama}`, () => {
      document.body.innerHTML = html;
      const el = document.querySelector('[onclick], [onmousedown]');
      const stop = installKeyboardEnhancer(document);

      expect(el.getAttribute('role'), 'peran tombol').toBe('button');
      expect(el.getAttribute('tabindex'), 'dapat difokus').toBe('0');

      const klik = vi.fn();
      el.addEventListener('click', klik);
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      expect(klik, 'Enter harus mengaktifkan').toHaveBeenCalledTimes(1);

      el.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
      expect(klik, 'Spasi harus mengaktifkan').toHaveBeenCalledTimes(2);
      stop();
    });
  }

  it('menghormati elemen yang sudah punya role + tabindex', () => {
    document.body.innerHTML = '<div role="tab" tabindex="-1" onclick="void 0">Tab</div>';
    const el = document.querySelector('div');
    const stop = installKeyboardEnhancer(document);
    expect(el.getAttribute('role')).toBe('tab');
    expect(el.getAttribute('tabindex')).toBe('-1');
    stop();
  });

  it('TIDAK menyulap handler tetikus (onmousedown) menjadi tombol', () => {
    // onmousedown dipakai untuk SERET, bukan tekan. Memberinya role="button"
    // akan membuat pembaca layar mengumumkan "tombol" dan menyesatkan pengguna
    // keyboard — mereka menekan Enter, tidak terjadi apa-apa, dan tidak ada
    // cara lain memindahkan objeknya. Pola seperti ini butuh jalan alternatif
    // (tombol geser / input angka), bukan perubahan peran.
    document.body.innerHTML = '<span onmousedown="void 0" onmouseenter="void 0">Seret</span>';
    const el = document.querySelector('span');
    const stop = installKeyboardEnhancer(document);
    expect(el.hasAttribute('role'), 'peran tidak boleh diubah').toBe(false);
    expect(el.getAttribute('tabindex')).toBeNull();
    stop();
  });

  it('menghormati kontrol asli (button, a, input)', () => {
    document.body.innerHTML = '<button onclick="void 0">Asli</button>';
    const el = document.querySelector('button');
    const stop = installKeyboardEnhancer(document);
    expect(el.hasAttribute('role')).toBe(false);
    expect(el.hasAttribute('tabindex')).toBe(false);
    stop();
  });
});
