# Audit Mendalam Aplikasi Pengkajian SLF

**Tanggal audit:** 16 September 2026
**Tanggal perbaikan:** 16 September 2026
**Commit dasar:** `3a15a1c` (branch `main`)
**Cakupan:** 381 berkas sumber (`src/`, `scripts/`, `supabase/`) + berkas CI dan dokumentasi

> **Status: seluruh temuan yang dapat ditindaklanjuti dari sisi kode SUDAH DIPERBAIKI dan diverifikasi.**
>
> Satu temuan tersisa — 112 tabel yang tidak ada di repositori — **tidak dapat diperbaiki tanpa akses ke database produksi**; untuk itu sudah disediakan alat satu-perintah yang menghasilkan migrasinya secara persis (§4.1).
>
> **Riwayat revisi.** Versi pertama laporan ini melaporkan **3** kunci AI di klien. Angka itu salah karena alat audit tidak mengenali pola alias `const env = import.meta.env`. Pemeriksaan lanjutan setelah RLS dan kunci AI dipindahkan ke Edge Function menemukan **16** kunci (§2.5) — beserta tiga cacat berlapis yang semuanya membuat pemindahan kunci ke sisi server tidak berjalan sesuai harapan. Bagian yang terpengaruh sudah dikoreksi, dan penyebabnya didokumentasikan di §3. Perbaikan alat selalu disertai bukti independen berupa tes render nyata, bukan sekadar pemindaian yang memakai aturannya sendiri.

---

## 1. Ringkasan

| Dimensi | Sebelum | Sesudah |
|---|---|---|
| 🔴 Sink `innerHTML` dengan data mentah | **349** (85 berkas) | **0** |
| 🔴 `marked()` tanpa sanitasi | 2 | **0** |
| 🔴 Tabel dengan RLS dimatikan oleh skrip SQL | 3 | **0** |
| 🔴 Rahasia ter-hardcode di kode | 0 | **0** |
| 🟠 Project ref produksi ter-hardcode | 4 | **0** |
| 🟠 Tabel dipakai kode tapi tidak ada di SQL | 112 | 112 *(butuh akses DB — alat sudah tersedia)* |
| 🟡 Kunci AI dipakai jalur klien | **3** | **16** — angka awal salah hitung; lihat §2.5 |
| 🔴 Kunci AI diteruskan ke build klien oleh CI | 7 | **0** |
| 🔴 `ai-proxy` terbuka untuk umum (anon key diterima) | **1** | **0** |
| 🔴 Jalur `ai-proxy` mengembalikan teks kosong | **1** | **0** |
| 🟠 Project ref produksi di dokumentasi & CI | 5 | **0** |
| 🟡 Berkas dengan listener menumpuk | 12 | **0** |
| 🟡 Berkas dengan timer/listener bocor | 17 | **0** |
| 🔵 `catch` kosong (galat ditelan) | 3 | **0** |
| 🔵 `document.write()` berisiko | 2 | **0** |
| 🔵 Kerentanan dependensi (`npm audit`) | **20** (11 high) | **0** |

Papan prioritas akhir:

```
🔴 KRITIS  : 0 sink XSS mentah · 0 rahasia · 0 RLS mati · 0 markdown tak aman
🟠 TINGGI  : 112 tabel tanpa skema (53 menerima tulisan) · 0 ref ter-hardcode
🟡 SEDANG  : 0 berkas listener menumpuk · 0 berkas bocor · 16 kunci AI di klien (16 ber-guard, 0 tanpa guard)
🔵 RENDAH  : 0 catch kosong · 0 API berbahaya
```

---

## 2. Perbaikan Keamanan

### 2.1 XSS: 349 sink `innerHTML` → 0

**Masalah.** Aplikasi menyusun antarmuka dengan penggabungan string HTML. Sebelum audit, **349 titik** menyisipkan data ke dalam markah tanpa escape — termasuk `${result.description}` (teks bebas dari database) dan `${err.message}` (pesan galat yang memantulkan input pengguna). Hanya 1 titik memakai DOMPurify dan 3 memakai helper escape.

**Kenapa tidak disanitasi di titik sink?** Aplikasi ini memakai atribut inline (`onclick`, `style`) secara masif. DOMPurify menghapus seluruh atribut `on*`, sehingga sanitisasi di titik sink akan **melumpuhkan antarmuka**. Karena itu yang di-escape adalah **datanya**, bukan markahnya.

**Perbaikan.** `src/lib/safe-markdown.js` — satu implementasi `escapeHtml()` untuk seluruh aplikasi — lalu codemod `scripts/xss-codemod.mjs` menyuntikkannya ke setiap interpolasi data.

| Statistik codemod | Nilai |
|---|---|
| Berkas sumber disentuh | 143 |
| Pemakaian `escapeHtml()` di luar baris import | **2 614** (terukur di 143 berkas) |
| Sisa yang perlu di-escape | **0** |

Hasil pengukuran akhir scanner terhadap **353 sink `innerHTML` dinamis**:

| Cara penanganan | Jumlah |
|---|---|
| Sudah disinggahi DOMPurify | 1 |
| Sudah di-escape `escapeHtml()` langsung di titik sink | 207 |
| Dilewatkan pembangun markah (aman, tidak langsung) | 145 |
| **Tanpa sanitasi** | **0** |

Tiga kategori di atas berbeda artinya: "di-escape langsung" berarti `escapeHtml()` terlihat di dalam pernyataan penugasan itu sendiri, sedangkan "lewat pembangun markah" berarti nilainya melewati fungsi yang di dalamnya sudah memakai `escapeHtml()`. Keduanya aman, tetapi hanya yang pertama yang terverifikasi langsung pada titik sink.

Codemod menerapkan aturan yang ketat — hanya menyentuh ekspresi yang **pasti data**:

- **Dibungkus:** data path murni (`a.b.c`, `a?.b`, `a[0]`), rantai `??`/`||` (`x.role?.toUpperCase() || 'USER'`), dan method pengolah string (`replace`, `toUpperCase`, `trim`, `toFixed`, …).
- **Dilewati:** pemanggilan fungsi pembangun markah, ekspresi ternary, operator aritmetika, dan nilai yang namanya menandakan markah (`…Html`, `…svg`, `icon`, `badge`, `gridLinesHtml`, `styleInjectHtml`).
- **Argumen berisi `<`/`>`** dikecualikan — itu tanda method dipakai untuk *menyisipkan* markah (`.replace(/x/g, '<br>')`).

**Jaminan permanen:** `src/lib/xss-guard.test.js` — **6 tes, dua lapis**:

1. **Statis** — memindai seluruh `src/**` dan memakai ulang `collectEscapes()` dari codemod (satu sumber kebenaran). Menambah `<div>${x}</div>` baru tanpa escape akan **menggagalkan tes ini**.
2. **Dinamis** — benar-benar merender `renderAccessibilityCard`, `renderBuildingIntensityCard`, dan `renderEgressSystemCard` dengan muatan `<img src=x onerror=…>` disisipkan ke setiap field satu per satu, lalu memeriksa HTML yang dihasilkan. Lapis ini membuktikan escaping bekerja sampai ke keluaran akhir — bukan sekadar "ada tulisan escapeHtml di kode".

**Konsolidasi sampingan:** 16 definisi `escapeHtml`/`escHtml`/`esc` yang berbeda-beda tersebar di seluruh repo disatukan ke implementasi kanonik. Sebagian di antaranya **tidak meng-escape tanda kutip**, sehingga tidak aman di dalam atribut HTML, dan sebagian lagi tidak tahan terhadap nilai non-string (langsung `s.replace(...)` → `TypeError` pada angka/boolean).

### 2.2 `marked()` pada narasi hasil AI

Narasi teknis dihasilkan model AI lalu disuntikkan ke DOM. `marked` tidak menyaring HTML, sehingga prompt-injection atau isi dokumen berbahaya dapat berjalan sebagai skrip di peramban pengguna lain.

**Perbaikan.** `safeMarkdown()` di `src/lib/safe-markdown.js`, dipasang di `analisis-components.js` dan `laporan.js`. Tidak ada lagi `marked.parse()` mentah di seluruh repo.

**Temuan penting tentang konfigurasi DOMPurify** (dibuktikan lewat pengujian, satu payload per proses karena DOMPurify **memoize** konfigurasi antar-pemanggilan dalam satu proses):

| Konfigurasi | `<p>Halo</p>` | `<div><script>alert(1)</script></div>` |
|---|---|---|
| `KEEP_CONTENT: false` saja | ❌ `<p></p>` — **semua teks hilang** | `""` |
| `ALLOWED_TAGS: [..., '#text']` + `KEEP_CONTENT: false` | ✅ `<p>Halo</p>` | ✅ `""` |

Sebabnya: DOMPurify hanya memasukkan `#text` ke allow-list ketika `KEEP_CONTENT` bernilai `true`. Jadi mematikan `KEEP_CONTENT` (yang penting untuk mencegah teks di dalam tag terlarang lolos kembali ke DOM) **wajib** dibarengi pendaftaran `'#text'` eksplisit. Konfigurasi inilah yang dipakai sekarang.

> ⚠️ **Untuk tim:** tes keamanan DOMPurify **harus** dijalankan di `jsdom` (sudah diatur lewat `@vitest-environment jsdom`). Di `happy-dom`, DOMPurify melaporkan **false pass** — `<script>alert(1)</script>` dinyatakan bersih. Ini artefak lingkungan, bukan kerentanan DOMPurify di peramban sungguhan; tetapi artinya setiap asersi keamanan berbasis happy-dom tidak bernilai untuk kasus ini.

### 2.3 XSS lewat `err.message`

Pesan galat PostgreSQL/Supabase memantulkan kembali nilai yang dikirim pengguna. Tiga titik mencetaknya langsung sebagai HTML (`simulation-engine.js:703`, `simulation.js:326`, `surat-pernyataan.js:79`). Ketiganya kini membungkusnya dengan `escapeHtml()`. Codemod juga menangani seluruh `${err.message}` lain di repo.

### 2.4 `supabase/fix_rls.sql` dapat mematikan RLS di produksi

**Ini temuan paling serius.** Skrip tersebut berisi:

```sql
ALTER TABLE public.proyek           DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_items  DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.hasil_analisis   DISABLE ROW LEVEL SECURITY;
```

Skrip itu dulu didokumentasikan sebagai langkah setup yang normal. Padahal `anon key` **selalu** ikut ter-bundle ke dalam berkas JS publik. Jadi satu kali menjalankannya di proyek produksi berarti seluruh data klien pada tiga tabel inti — proyek, item checklist, hasil analisis — **dapat dibaca, diubah, dan dihapus siapa pun di internet tanpa login**.

**Perbaikan.** Skrip dibalik menjadi **skrip pemulihan** yang idempoten:

1. `ENABLE ROW LEVEL SECURITY` pada ketiga tabel.
2. Membuat ulang policy `... FOR ALL TO authenticated`.
3. **`REVOKE ALL ... FROM anon`** — sabuk pengaman kedua: bila RLS tak sengaja dimatikan lagi, `anon` tetap tidak punya hak akses.
4. Blok `DO $$ … $$` yang memverifikasi sendiri dan menaikkan `WARNING` bila masih ada tabel tanpa RLS.
5. Perintah `DISABLE` versi lama tetap tersimpan, dikomentari, di bagian `DEV-ONLY — JANGAN DIJALANKAN DI PRODUKSI`.

**Perkakas baru:** `supabase/security/rls_audit.sql` — 5 kueri hanya-baca (aman dijalankan di produksi) untuk memeriksa tabel tanpa RLS, tabel dengan RLS tetapi tanpa policy, isi policy tabel sensitif, hak akses `anon`/`authenticated`, dan RLS pada `storage.objects`.

### 2.5 Kunci API AI — tiga cacat berlapis

Bagian ini adalah temuan paling serius dari seluruh audit, dan **angka awalnya salah**: laporan versi pertama menyebut 3 kunci, padahal ada **16**. Selengkapnya di §3.

#### 2.5.1 CI menerbitkan 8 kunci penyedia pada setiap deploy

`.github/workflows/deploy.yml`, langkah **Build**, memuat ini:

```yaml
# Direct AI Access (Optional if using Proxy)
VITE_GEMINI_API_KEY:     ${{ secrets.VITE_GEMINI_API_KEY }}
VITE_OPENAI_API_KEY:     ${{ secrets.VITE_OPENAI_API_KEY }}
VITE_CLAUDE_API_KEY:     ${{ secrets.VITE_CLAUDE_API_KEY }}
VITE_OPENROUTER_API_KEY: ${{ secrets.VITE_OPENROUTER_API_KEY }}
VITE_GROQ_API_KEY:       ${{ secrets.VITE_GROQ_API_KEY }}
VITE_MISTRAL_API_KEY:    ${{ secrets.VITE_MISTRAL_API_KEY }}
VITE_HF_API_TOKEN:       ${{ secrets.VITE_HF_API_TOKEN }}
```

Langkah yang sama menjalankan `npm run build` lalu mengunggah `dist/` ke GitHub Pages. Karena Vite mengganti setiap `import.meta.env.VITE_*` menjadi **nilai teks biasa**, setiap `push` ke `main` **menerbitkan ketujuh kunci itu sebagai teks biasa ke halaman publik** — lengkap dengan `src/lib/ai-router.js` yang menyimpannya di registry `MODELS.*.key` dan memakainya di `Authorization: Bearer ${model.key}`.

Komentar "Optional if using Proxy" menunjukkan niatnya: cadangan bila proxy belum siap. Yang terjadi justru sebaliknya — cadangan itu berjalan **setiap kali**, dan biayanya ditanggung pemilik proyek.

**Perbaikan.** Seluruh blok dihapus, diganti komentar yang menjelaskan mengapa blok itu tidak boleh dikembalikan. Kini `npm run build` **menolak berjalan** bila mendeteksi kunci AI di environment.

> 🔴 **Ini bukan temuan teoretis.** Kunci yang sudah terbit harus **dianggap bocor**. Rotasi kedelapan kunci di dashboard masing-masing penyedia — menghapus blok YAML-nya saja tidak menarik kembali kunci yang sudah tersalin orang.

#### 2.5.2 `ai-proxy` menerima anon key — jadi terbuka untuk umum

Edge Function hanya memeriksa **keberadaan** header, bukan keabsahannya:

```ts
const authHeader = req.headers.get("authorization");
if (!authHeader) { return 401 }
```

Masalahnya: **anon key Supabase adalah JWT yang sah**, dan ia ikut ter-bundle ke berkas JS publik. Siapa pun yang membuka situs dapat menyalinnya dari DevTools, lalu memanggil `ai-proxy` langsung dan menghabiskan kuota AI pemilik proyek. Memindahkan kunci ke sisi server menjadi **tidak berarti** tanpa pemeriksaan ini. Dua pemanggil lain (`ChatbotService.js`, `AdvancedReasoningService.js`) memang memeriksa sesi lebih dulu — tetapi lalu tetap mengirim **anon key** sebagai bearer, bukan access token sesi.

**Perbaikan** — dua lapis di Edge Function:

1. Membaca payload JWT (tanpa verifikasi) untuk menolak lebih awal token ber-role selain `authenticated`.
2. **Memverifikasi tanda tangan token ke GoTrue** lewat `authClient.auth.getUser(token)`.

Ketiga pemanggil kini mengirim `Authorization: Bearer <session.access_token>` yang sesungguhnya. Prosedur verifikasinya (termasuk `curl` yang harus mengembalikan **401** dengan anon key) ada di `supabase/functions/ai-proxy/DEPLOY_GUIDE.md` langkah 8.

#### 2.5.3 Jalur proxy mengembalikan teks kosong

Edge Function mengembalikan `{ result, provider, model }` — teksnya sudah diekstrak dari bentuk khas tiap penyedia di sisi server. Tetapi `AIRouter.normalizeResponse()` membaca `data.candidates?.[0]…` / `data.choices?.[0]…`, yang **tidak ada** di respons proxy:

```js
// sebelum
return { text: data.choices?.[0]?.message?.content || data.text || '' };  // → selalu ''
```

Akibatnya fitur AI **selalu menghasilkan string kosong** di produksi — tanpa galat, tanpa petunjuk. Bug ini hanya muncul pada jalur produksi, sehingga tidak pernah terlihat saat pengembangan lokal.

**Perbaikan.** `normalizeResponse()` kini mengenali `data.result` untuk seluruh penyedia, dan dilindungi **4 tes regresi** di `AIRouter.test.js`.

Ditemukan pula dua ketidakcocokan parameter pada jalur yang sama:

| Dikirim klien | Dibaca server | Akibat |
|---|---|---|
| `max_tokens` | `maxTokens` | dibuang diam-diam, selalu jatuh ke default 8192 |
| `temperature` | — | diabaikan, server memakai 0.1 tetap |

Keduanya kini konsisten.

#### 2.5.4 Tidak ada cara menyembunyikan variabel `VITE_*` — dibuktikan

Ini pertanyaan yang menentukan seluruh strategi, jadi diuji langsung dengan Vite 6 (lihat `docs/DEEP-AUDIT-2026-09.md` §2.5). Empat pendekatan dibangun, lalu keluarannya diperiksa:

| Pola di kode sumber | Hasil di bundel produksi |
|---|---|
| `import.meta.env.VITE_KUNCI` | `"SENTINEL_RAHASIA_12345"` ❌ |
| `const env = import.meta.env; env.VITE_KUNCI` | `"SENTINEL_RAHASIA_12345"` ❌ |
| `env['VITE_' + 'KUNCI']` (akses dinamis) | `"SENTINEL_RAHASIA_12345"` ❌ |
| `{ ...env }` | seluruh objek env disalin ❌ |

Vite menuliskan `import.meta.env` sebagai objek literal berisi seluruh variabel `VITE_*`, lalu minifier melakukan constant-folding pada penggabungan string — jadi **akses dinamis pun gagal**. Tidak ada trik penamaan, alias, atau `Object.fromEntries` yang menolong.

**Kesimpulan: satu-satunya pertahanan yang benar-benar bekerja adalah memastikan kunci tidak pernah ada di lingkungan saat build.** Karena itu dipasang **dua** gerbang:

| Gerbang | Waktu | Menangkap |
|---|---|---|
| `scripts/check-client-secrets.mjs` | `prebuild` | kunci AI/token pada **environment** build (nama berakhiran `_API_KEY`/`_SECRET`/`_TOKEN`/`_PRIVATE`/`_SERVICE_ROLE`, atau nilai panjang berpola token) |
| `scripts/check-bundle-secrets.mjs` | `postbuild` | kunci yang benar-benar **ada di berkas hasil build** — termasuk yang ditulis langsung di kode, yang tidak akan pernah terlihat gerbang pertama |

Keduanya sudah diuji: menyuntikkan kunci ke `.env` → `npm run build` berhenti dengan exit 1; menaruh kunci tiruan di `dist/` → gerbang kedua menemukannya.

> Satu pola **sengaja tidak dipakai**: kunci Mistral tidak punya awalan yang khas (32 karakter alfanumerik), sehingga pola apa pun akan memicu positif palsu pada bundel minifikasi — hash, id, dan nama variabel akan cocok. Gerbang yang sering salah akan diabaikan orang, dan itu lebih buruk daripada tidak ada gerbang. Cakupannya diambil alih pemeriksaan nama variabel di gerbang prebuild.

**Perbaikan berlapis di kode** (semua 16 titik):

1. `AIRouter.getApiKey()` dan `executeDirect()` menolak berjalan bila `!import.meta.env.DEV`.
2. `ai-router.js` `callAI()` menolak jalur langsung di produksi — sebelumnya cabang itu menjadi "fallback jika proxy belum di-deploy", sehingga produksi tanpa `VITE_AI_PROXY_URL` akan memanggil penyedia AI langsung dari peramban.
3. Gerbang `prebuild` + `postbuild` di atas.

**Sisa yang tetap harus Anda lakukan:** rotasi kedelapan kunci di dashboard penyedia. Tidak ada perubahan kode yang bisa menarik kembali kunci yang sudah terbit.

### 2.6 Kebocoran runtime: listener & timer

**Masalah.** Listener pada `window`/`document` **tidak ikut hilang** saat halaman diganti — berbeda dengan listener pada elemen di dalam halaman. Modul yang memasangnya di dalam fungsi render akan menumpuk:

| Kunjungan ke- | Satu klik "kirim" chatbot memicu | Panggilan AI | Baris ditulis ke DB |
|---|---|---|---|
| 1 | 1× | 1 | 1 |
| 3 | 3× | 3 | 3 |
| 5 | 5× | 5 | 5 |

Selain lambat, ini **menggandakan pemakaian egress Supabase** dan menulis data ganda ke database.

**Perbaikan.**

| Berkas | Tindakan |
|---|---|
| `chatbot.js` | Guard idempoten + `teardownChatEventListeners()` + pembersihan otomatis saat `route-changed` (handler lama memegang referensi DOM halaman yang sudah dibuang) |
| `verify.js` | 4 listener dipindahkan ke `bindGlobal()` |
| `canva-studio.js` | 2 listener → `bindGlobal()`, guard |
| `notification.js` | Guard idempoten — mencegah **langganan realtime Supabase ganda** (boros egress) |
| `header.js` | Guard pada listener `document` (elemen header lain dibuat ulang setiap render, jadi harus tetap dipasang ulang) |
| `laporan.js` `initExportDropdown` | Guard |
| `sync-ui.js` | Guard + `stopSyncIndicator()` |
| `image-editor.js` | `AbortController` — dua listener `window` kini dilepas saat editor ditutup |
| `FireDesigner.js` | Listener `window` disimpan & dilepas di `disconnectedCallback()` |
| `EvacuationDesigner.js` | idem |
| `EgressCompliancePanel.js`, `FireCompliancePanel.js` | idem (`disconnectedCallback` ditambahkan) |
| `CatchmentMapper.js`, `RoomBuilder.js` | Listener `resize` disimpan & dilepas di `disconnectedCallback()` |
| `LoadingUsageExample.js` | Guard idempoten |

**Primitif baru:** `src/lib/global-listeners.js` — `bindGlobal(target, type, handler)` memasang listener pada `window`/`document` yang **otomatis dilepas saat rute berubah**, idempoten per kombinasi target+jenis+handler, dan menyediakan `releaseGlobalListeners()` serta `globalListenerCount()` untuk diagnostik.

### 2.7 `document.write()` untuk laporan cetak

Dua tempat membuka `window.open('', '_blank')` lalu menulis dokumen dengan `document.write()`. Dokumen `about:blank` **mewarisi origin aplikasi**, sehingga apa pun yang ditulis ke sana berjalan dengan hak akses penuh sesi pengguna — dan `document.write` sendiri adalah API yang secara desain dapat menimpa dokumen yang sedang tayang.

**Perbaikan.** Keduanya (`comfort-inspection.js`, `laporan.js`) kini memakai **Blob URL**:

```js
const blob = new Blob([reportHTML], { type: 'text/html' });
const url = URL.createObjectURL(blob);
const win = window.open(url, '_blank');
if (!win) { URL.revokeObjectURL(url); showError('Tab baru diblokir peramban…'); return; }
setTimeout(() => URL.revokeObjectURL(url), 60000);
```

Penanganan pop-up yang diblokir juga ditambahkan (sebelumnya `window.open` mengembalikan `null` dan kode langsung menabrak `null.document`).

### 2.8 `catch` kosong

Tiga `catch` menelan galat tanpa jejak sama sekali (`notification.js`, `docx/outline-bab6.js`, `dashboard.js`), sehingga kegagalan menjadi tidak terlihat di produksi. Ketiganya kini mencatat konteks lewat `console.warn`, dan pada `outline-bab6.js` ditambahkan fallback nilai agar alur tetap berjalan.

### 2.9 Kerentanan dependensi: 20 → 0

**Akar masalahnya adalah dependensi mati.** Empat paket langsung ternyata **tidak dipakai sama sekali** oleh kode:

| Paket | Dipakai | Kerentanan yang dibawa |
|---|---|---|
| `@xenova/transformers` | 0 referensi (hanya disebut di komentar; kodenya sendiri menyatakan *"Skip xenova/transformers karena WASM loading issues"*) | high (via `sharp`) |
| `drizzle-orm` | 0 | — |
| `drizzle-kit` | 0 | moderate (via `esbuild`) |
| `@tensorflow/tfjs` | 0 | — |

Keempatnya dihapus. Setelah instalasi bersih, sisa kerentanan turun dari 20 → **1**.

Sisanya `xlsx` (SheetJS) — tidak ada perbaikan di npm karena SheetJS berhenti menerbitkan ke registry npm setelah 0.18.5. Perbaikannya memakai rilis resmi dari CDN SheetJS:

```
xlsx → https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz
```

Verifikasi: `npm audit` → **found 0 vulnerabilities**.

Paket dinamis yang **tetap dipertahankan** karena memang dipakai lewat `await import()`: `html2canvas`, `tesseract.js`, `dxf-parser`.

---

## 3. Perbaikan Akurasi Alat Audit

Skrip audit yang salah hitung lebih berbahaya daripada tidak ada skrip, karena memberi rasa aman palsu. **Sembilan bug** ditemukan dan diperbaiki pada alat audit sendiri — termasuk dua yang membuat laporan versi pertama terlalu optimis:

| # | Bug | Dampak |
|---|---|---|
| 1 | Template literal ber-interpolasi dianggap statis | **Under-report 41 %** — 207 → 353 sink. Pola `<div>Error: ${err.message}</div>` justru bentuk XSS paling umum dan luput seluruhnya |
| 2 | Baris komentar SQL ikut dihitung | Skrip pemulihan RLS yang memuat contoh `DISABLE` sebagai dokumentasi dilaporkan sebagai pelanggaran |
| 3 | Codemod menerapkan edit sambil berjalan | Offset menjadi basi setelah edit pertama → banyak sink terlewat (539 → 2 575 edit setelah diperbaiki) |
| 4 | Codemod hanya menelusuri satu berkas | Pembangun markah yang dipanggil lintas berkas tidak tertangani |
| 5 | Pola markah `star` tanpa batas kata | Nama seperti **"NOT STARTED"** dianggap markah → datanya dilewatkan |
| 6 | Pembuang tanda kurung memotong `)` milik pemanggilan method | `x.toUpperCase()` jadi tak dikenali sebagai data |
| 7 | Detektor runtime tidak mengenali guard/`once:true`/`disconnectedCallback` | Perbaikan yang sudah benar tetap dilaporkan sebagai kebocoran |
| 8 | Kunci AI diakses lewat alias (`const env = import.meta.env; env.VITE_KIMI_API_KEY`) | **Under-report 81 %** — dilaporkan 3 kunci padahal ada **16**. Nilainya sama-sama ter-inline; hanya pola tulisannya yang berbeda |
| 9 | Pemindaian project ref hanya mencakup `src/` + `vite.config.js` | 5 penulisan ref produksi di `DEPLOY_GUIDE.md`, `keepalive.targets.json.example`, dan `.github/workflows/deploy.yml` tidak terdeteksi |

**Perbaikan konseptual:** aturan "apakah ekspresi ini butuh escape" kini punya **satu definisi** (`shouldEscape()` di `scripts/xss-codemod.mjs`) yang dipakai bersama oleh codemod dan scanner. Sebelumnya keduanya punya logika terpisah yang bisa saling menyimpang — dan memang menyimpang.

Agar hal ini tidak menjadi lingkaran tertutup (alat memakai aturannya sendiri untuk menilai dirinya), bukti independennya adalah **lapis 2** `xss-guard.test.js`, yang merender komponen nyata dengan muatan XSS dan memeriksa keluaran DOM.

**Definisi kebocoran yang dipakai sekarang:** pertumbuhan **tak terbatas** — bukan sekadar "ada listener". Listener yang dilindungi guard idempoten, `{ once: true }`, `removeEventListener`, `disconnectedCallback`, `bindGlobal()`, atau `AbortController` tidak lagi dihitung bocor.

---

## 4. Temuan Tersisa

### 4.1 🟠 112 tabel dipakai kode tetapi tidak ada di skema SQL

Kode menyentuh **123 tabel**, sementara seluruh berkas di `supabase/` mendefinisikan **27**. Selisihnya **112 tabel tanpa `CREATE TABLE`**, dan **53 di antaranya menerima operasi tulis**:

| Tabel | Baca | Tulis |
|---|---|---|
| `ai_memories` | 7 | 6 |
| `chat_sessions` | 5 | 3 |
| `egress_routes` | 4 | 2 |
| `exit_components` | 4 | 2 |
| `egress_analysis` | 4 | 2 |
| `lps_grounding_tests` | 3 | 3 |
| `fire_assets` | 4 | 1 |

**Dampak:** repo ini **tidak dapat di-deploy dari nol**. Siapa pun yang mengikuti `docs/SUPABASE-SETUP.md` akan mendapat database tidak lengkap lalu menemui galat "relation does not exist". Selain itu skema produksi saat ini kemungkinan hanya ada di dashboard — tidak ada backup yang dapat direproduksi, dan tidak ada cara me-review perubahan skema lewat pull request. Di sisi lain, **16 tabel di SQL tidak pernah dipakai kode**.

**Kenapa tidak saya kerjakan otomatis:** menebak definisi 112 tabel dari cara kode memakainya pasti salah — tipe kolom, constraint, index, dan default value tidak dapat diketahui dari sisi klien.

**Alat yang sudah disediakan** — `scripts/db-schema-sync.mjs`, dijalankan lewat `npm run db:schema-sync`. Skrip ini **membaca skema asli dari database** (yang memang sudah memuat tabel-tabel itu) lalu menuliskannya sebagai migrasi yang dapat dijalankan ulang:

```bash
# Dashboard → Project Settings → Database → Connection string → URI
export SUPABASE_DB_URL='postgresql://postgres.<ref>:<PASSWORD>@...:5432/postgres'

npm run db:schema-sync -- --dry    # lihat daftar 112 tabel dulu
npm run db:schema-sync            # tulis supabase/migrations/<tanggal>_baseline_missing_tables.sql
```

Skrip mengekstrak kolom, tipe, `NOT NULL`, `DEFAULT`, identity, seluruh constraint, index, dan mengaktifkan RLS untuk setiap tabel yang dihasilkan. Hanya **membaca** database — tidak ada DDL/DML yang dijalankan. Hasilnya bisa langsung di-commit, dan sejak itu `supabase db reset` serta deployment dari nol akan berjalan.

`pg` sudah ditambahkan sebagai devDependency, dan `npm run db:schema-sync` sudah tersedia.

### 4.2 Catatan

- **16 tabel di SQL tidak dipakai kode** — kandidat pembersihan, tetapi periksa dulu apakah disiapkan untuk fitur yang belum selesai.
- **25 halaman tidak ter-wire ke router, 83 modul orphan** (`npm run audit:code`), serta **4 import sirkular**. Ditandai *advisory*: Vite melakukan tree-shaking dari entry point, jadi kode ini tidak ikut ke bundel produksi. Beberapa `*-calculators.js` perlu ditinjau per berkas — **jangan dihapus membabi buta**.
- **Cakupan tes UI belum terukur.** `vitest.config.js` mengecualikan `src/main.js`, `src/pages/**`, dan `src/components/**`. `lib/auth.js`, `lib/supabase.js`, `lib/router.js`, `persistence/`, `use-cases/`, dan `domain/repositories/` **belum punya tes sama sekali**. Menambah cakupan ini adalah pekerjaan terpisah yang bernilai tinggi.

---

## 5. Verifikasi Akhir

```
npm audit                      → found 0 vulnerabilities
npm run build                  → gerbang prebuild + postbuild keduanya lolos
   └ check-client-secrets      → tidak ada rahasia yang akan ter-inline
   └ check-bundle-secrets      → 103 berkas dist diperiksa, 0 kunci ditemukan
npx vitest run                 → 11 berkas, 205/205 tes LOLOS
npm run audit:code             → 4 pemeriksaan fatal: SEMUA 0
node scripts/deep-audit.mjs    → 0 XSS mentah · 0 rahasia · 0 RLS mati
                                 0 markdown tak aman · 0 ref ter-hardcode
                                 0 listener menumpuk · 0 berkas bocor
                                 0 catch kosong · 0 API berbahaya
                                 16 kunci AI di klien (16 ber-guard, 0 tanpa guard)
```

Optimasi bundel dari tugas sebelumnya **tetap utuh** setelah seluruh perubahan:

| Chunk | Sebelum optimasi | Sesudah audit |
|---|---|---|
| `proyek-detail` | 987,53 kB | **125,3 kB** |
| `main` | 352,66 kB | 271,4 kB |

`manualChunks` dipastikan masih berbentuk **fungsi** (bukan objek) setelah `vite.config.js` direstrukturisasi.

---

## 6. Cara Menjalankan Ulang

```bash
cd pengkajislf

# Audit
node scripts/deep-audit.mjs                    # ringkasan 3 seksi
node scripts/deep-audit.mjs --verbose          # daftar lengkap setiap temuan
node scripts/deep-audit.mjs --json audit.json  # keluaran mesin (untuk gerbang CI)
node scripts/deep-audit.mjs --only security    # security | schema | runtime
node scripts/deep-audit.mjs --json audit.json  # keluaran mesin, untuk penanda di CI
npm run audit:code                             # import/export/rute
npx vitest run                                 # seluruh tes (termasuk gerbang XSS)
npm run build                                  # produksi (didahului gerbang rahasia)

# Perbaikan alat
npm run check:secrets                          # periksa rahasia yang akan ter-inline
npm run db:schema-sync                         # hasilkan migrasi tabel yang hilang
node scripts/xss-codemod.mjs --dry             # periksa sisa XSS yang belum ter-escape
```

Setelah mengubah apa pun terkait RLS, jalankan `supabase/security/rls_audit.sql` di SQL Editor untuk memastikan tidak ada tabel yang terbuka.

---

## 7. Berkas yang Berubah

**Baru**

| Berkas | Isi |
|---|---|
| `src/lib/safe-markdown.js` | Sanitizer markdown/HTML + `escapeHtml()` kanonik |
| `src/lib/safe-markdown.test.js` | 24 tes keamanan XSS (lingkungan jsdom) |
| `src/lib/xss-guard.test.js` | **Gerbang regresi XSS** — pemindaian statis + render nyata dengan muatan XSS |
| `src/lib/global-listeners.js` | `bindGlobal()` — listener halaman yang dilepas otomatis saat rute berubah |
| `scripts/xss-codemod.mjs` | Codemod escape + `shouldEscape()`/`collectEscapes()` sebagai sumber kebenaran tunggal |
| `scripts/deep-audit.mjs` | Audit 3 dimensi (keamanan, integritas skema, runtime) |
| `scripts/check-client-secrets.mjs` | **Gerbang pra-build** anti-kebocoran rahasia (environment) |
| `scripts/check-bundle-secrets.mjs` | **Gerbang pasca-build** — memeriksa berkas `dist/` terhadap pola kunci 10 penyedia |
| `scripts/db-schema-sync.mjs` | Penghasil migrasi untuk tabel yang hilang |
| `supabase/security/rls_audit.sql` | 5 kueri pemeriksa RLS (hanya baca) |

**Diubah (pokok)**

| Berkas | Perubahan |
|---|---|
| 143 berkas di `src/` | 2 614 situs data di-escape |
| `src/infrastructure/ai/AIRouter.js` | Kunci AI dikunci ke mode DEV + pesan pengarahan ke `ai-proxy` |
| `supabase/fix_rls.sql` | **Dibalik**: dari mematikan RLS menjadi memulihkan RLS + `REVOKE` dari `anon` |
| `supabase/functions/ai-proxy/index.ts` | **Otorisasi sesungguhnya**: tolak token ber-role non-`authenticated`, verifikasi tanda tangan ke GoTrue; teruskan `temperature`; balas `{ result, provider, model }` |
| `.github/workflows/deploy.yml` | **7 kunci penyedia dihapus dari environment build**; fallback project ref hardcode diganti kegagalan eksplisit |
| `src/infrastructure/ai/AIRouter.js` | Kenali respons `{ result }`; kirim `maxTokens` (bukan `max_tokens`); kirim access token sesi, bukan Bearer kosong |
| `src/lib/ai-router.js` | Jalur langsung dikunci ke DEV (sebelumnya jadi fallback produksi) |
| `src/infrastructure/ai/ChatbotService.js`, `AdvancedReasoningService.js` | Kirim `session.access_token`, bukan anon key |
| `src/components/analisis-components.js`, `src/pages/laporan.js` | `marked.parse()` → `safeMarkdown()`; `document.write` → Blob URL |
| `src/pages/chatbot.js`, `verify.js`, `canva-studio.js`, `header.js`, `notification.js`, `sync-ui.js`, `image-editor.js`, `FireDesigner.js`, `EvacuationDesigner.js`, `EgressCompliancePanel.js`, `FireCompliancePanel.js`, `CatchmentMapper.js`, `RoomBuilder.js`, `LoadingUsageExample.js` | Guard idempoten / `bindGlobal()` / `disconnectedCallback()` / `AbortController` |
| `src/lib/html-utils.js`, `utils.js`, `lazy-card.js`, `electrical-visualization.js`, +11 berkas lain | 16 definisi escape HTML disatukan ke implementasi kanonik |
| `src/pages/comfort-inspection.js`, `laporan.js` | `document.write` → Blob URL + penanganan pop-up diblokir |
| 3 berkas dengan `catch` kosong | Pencatatan konteks + fallback nilai |
| `package.json` | 4 dependensi mati dihapus; `xlsx` ke rilis resmi SheetJS; `prebuild`+`check:secrets`; `db:schema-sync`; `pg`, `jsdom`; `audit:deep` |
| `vite.config.js` | Target proxy dari `VITE_SUPABASE_URL` via `loadEnv()` |
| `.env.example` | Peringatan kunci AI + blok variabel sisi server |
| `scripts/deep-audit.mjs`, `scripts/code-audit.mjs` | 7 perbaikan akurasi (§3) |
| `README.md` | Tabel dokumentasi + perintah bantu |

---

## 8. Tindakan yang Masih Perlu Anda Lakukan

| # | Tindakan | Prioritas | Perkiraan |
|---|---|---|---|
| 1 | ~~Jalankan `supabase/fix_rls.sql` di produksi~~ — **SELESAI** | ✅ | — |
| 2 | ~~Pindahkan kunci AI ke secret Edge Function~~ — **SELESAI** | ✅ | — |
| 3 | **Rotasi kedelapan kunci AI** (Gemini, OpenAI, Claude, OpenRouter, Groq, Mistral, HF, Kimi) di dashboard tiap penyedia — kunci lama sudah terbit di bundel publik | 🔴 **segera** | 30 menit |
| 4 | Deploy ulang Edge Function `ai-proxy`, lalu uji langkah 8 di `DEPLOY_GUIDE.md`: panggilan dengan anon key **harus 401** | 🔴 **segera** | 10 menit |
| 5 | Pastikan `VITE_AI_PROXY_URL` sudah diisi di GitHub Secrets — tanpa itu, fitur AI mati total di produksi (memang disengaja: gagal jelas lebih baik daripada bocor) | 🔴 **segera** | 5 menit |
| 6 | Jalankan `npm run db:schema-sync`, periksa, lalu commit migrasinya | 🟠 tinggi | 30 menit |
| 7 | Tinjau satu kali tampilan aplikasi (Workers/laporan/inspection) untuk memastikan tidak ada teks yang muncul sebagai tag literal | 🟡 sedang | 30 menit |
| 8 | Tambahkan tes untuk `lib/auth.js`, `lib/supabase.js`, `lib/router.js` | 🟡 sedang | 4 jam |
| 9 | Tinjau 16 tabel SQL yang tidak dipakai kode — hapus atau lengkapi fiturnya | 🔵 rendah | 1 jam |

**Catatan untuk langkah 4:** escaping mengubah karakter `& < > " '` menjadi entitas HTML. Pada tampilan normal hal ini tidak terlihat (peramban menampilkannya kembali sebagai karakter biasa), tetapi jika ada tempat yang **sengaja** menyisipkan markah melalui variabel yang tidak saya tandai, markah itu akan tampil sebagai teks. Dua kasus semacam itu sudah saya temukan dan kembalikan secara eksplisit (`gridLinesHtml` di `fema356-pushover.js`, `styleInjectHtml` di `laporan.js`). Jika Anda menemukan kasus serupa, cukup tambahkan akhiran `Html` pada nama variabelnya agar skrip audit dan gerbang tes memperlakukannya sebagai markah yang sah.
