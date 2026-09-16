# Setup Supabase — Panduan Lengkap & Urutan Deploy

**Proyek:** Smart AI Pengkaji SLF
**Tanggal:** 16 September 2026
**Untuk:** pemasangan baru dari nol, atau verifikasi instalasi yang sudah ada.

> Selain berkas di folder `supabase/`, panduan ini juga mencakup
> **Storage bucket** dan **Edge Function**, karena keduanya wajib ada
> agar fitur berjalan — dan keduanya belum pernah tercatat urutannya.

---

## 0. Ringkasan Alur

```
[1] Buat project Supabase  →  [2] Jalankan SQL (URUT, §2)
        ↓
[3] Buat Storage bucket + policy (§3)
        ↓
[4] Deploy Edge Function (§4)   →  [5] Isi .env (§5)
        ↓
[6] Set secrets GitHub (§6)     →  [7] Verifikasi (§7)
```

Total waktu: ±30–45 menit. Sebagian besar menunggu proses provisioning.

---

## 1. Buat Project Supabase

1. Masuk ke [supabase.com/dashboard](https://supabase.com/dashboard) → **New project**.
2. Catat tiga hal ini (dipakai di §4–§6):

| Data | Lokasi di dashboard |
|---|---|
| **Project URL** | Project Settings → API → *Project URL* |
| **anon / publishable key** | Project Settings → API → *Project API keys* |
| **service_role key** | Project Settings → API → *service_role* — **RAHASIA, jangan dipakai di klien** |
| **Project ref** (`xxxxxxxx`) | Ada di URL dashboard: `supabase.com/dashboard/project/<ref>` |

3. **Penting untuk kuota:** pastikan hanya ada satu project aktif di organisasi
   bila masih di Free Plan — **kuota egress dihitung per organisasi**, bukan per project.

---

## 2. Jalankan SQL — Urutan Wajib

Repo ini punya **5 berkas SQL** di dua lokasi. Urutannya **tidak boleh ditukar**
karena ada ketergantungan kunci asing (foreign key).

### Tabel urutan eksekusi

| # | Berkas | Isi | Wajib? |
|---|---|---|---|
| **1** | `supabase/migrations/20240401_01_initial_schema.sql` | **Skema inti.** Tabel: `proyek`, `proyek_files`, `checklist_items`, `hasil_analisis`, `todo_tasks`, `notifications`, `profiles`, `settings`, `hasil_simulasi`, `field_test_data`. Plus view `simulasi_summary`, fungsi `handle_new_user()` (trigger pembuatan profil otomatis) dan `set_updated_at()`, serta RLS + policy tiap tabel. | ✅ **WAJIB** |
| **2** | `supabase/sanitation_schema.sql` | **Modul sanitasi.** 10 tabel `sanitation_*` (septic tank, IPAL, chute, pipa, titik inspeksi, uji efluen, lumpur, foto, kepatuhan) + trigger `updated_at`. | ✅ Wajib bila memakai modul sanitasi/pengelolaan air limbah |
| **3** | `supabase/supabase_smartai_pipeline_tables.sql` | **Pipeline AI.** `smartai_jobs`, `smartai_documents`, `smartai_chunks`, `smartai_embeddings`, `smartai_cache`, `smartai_logs` + fungsi pencarian vektor `match_documents()` + `smartai_cleanup()`. | ✅ Wajib bila memakai fitur Smart-AI |
| **4** | `supabase/migrations/20260916_keepalive_and_indexes.sql` | **Keepalive + pembersihan.** `keepalive_ping` (anti-pause), fungsi retensi, dan **menghapus `report_template_base64`** dari metadata proyek (penghemat egress). | ✅ Wajib untuk anti-pause & hemat kuota |
| **5** | `supabase/fix_rls.sql` | ⚠️ **JANGAN dijalankan di produksi** — lihat peringatan di bawah. | ❌ Hanya untuk debugging lokal |

### Kenapa urutannya begitu?

```
20240401_01_initial_schema.sql   ← membuat tabel `proyek`
        ↓ (FK: project_id UUID REFERENCES proyek(id))
sanitation_schema.sql            ← 10 tabel sanitasi bergantung pada `proyek`
        ↓ (FK: user_id UUID REFERENCES auth.users(id))
supabase_smartai_pipeline_tables.sql
```

- `sanitation_schema.sql` memuat `project_id UUID NOT NULL REFERENCES proyek(id) ON DELETE CASCADE`
  dan policy RLS-nya melakukan `SELECT 1 FROM proyek WHERE proyek.id = project_id`.
  **Kalau dijalankan sebelum langkah 1, pasti gagal.**
- Berkas Smart-AI merujuk `auth.users(id)` (bawaan Supabase) sehingga tidak bergantung
  pada skema inti, tetapi tetap dijalankan setelahnya agar rapi.

### Cara menjalankan

**Opsi A — SQL Editor (paling mudah):**
Dashboard → **SQL Editor** → *New query* → tempel isi berkas **satu per satu, sesuai urutan** → **Run**.

**Opsi B — Supabase CLI (migrasi otomatis):**

```bash
supabase link --project-ref <project-ref>
supabase db push
```

> ⚠️ `supabase db push` hanya menjalankan berkas di dalam `supabase/migrations/`.
> Dua berkas di luar folder itu (`sanitation_schema.sql`,
> `supabase_smartai_pipeline_tables.sql`) **tetap harus dijalankan manual** dari SQL Editor,
> atau dipindahkan dulu ke `supabase/migrations/`.

### Aktifkan ekstensi `vector`

Berkas `supabase_smartai_pipeline_tables.sql` memerlukan ekstensi **pgvector**
(`CREATE EXTENSION IF NOT EXISTS vector`). Bila role Anda tidak berhak membuat
ekstensi, aktifkan dulu lewat **Database → Extensions → `vector` → Enable**.

### Catatan idempotensi (penting)

| Objek | Aman dijalankan ulang? |
|---|---|
| Tabel (`CREATE TABLE IF NOT EXISTS`) | ✅ Ya |
| Indeks (`CREATE INDEX IF NOT EXISTS`) | ✅ Ya |
| Fungsi (`CREATE OR REPLACE FUNCTION`) | ✅ Ya |
| **Policy (`CREATE POLICY ...`)** | ❌ **Tidak** — error `policy already exists` |

Artinya: menjalankan ulang berkas 1–3 pada database yang sudah terisi akan
gagal di bagian policy. Bila perlu mengulang, hapus dulu policy lama:

```sql
-- Contoh untuk satu policy; ulangi untuk yang lain bila perlu
DROP POLICY IF EXISTS "Authenticated users manage all" ON public.proyek;
```

### ⚠️ Peringatan keamanan: `supabase/fix_rls.sql`

Isi berkas ini adalah:

```sql
ALTER TABLE public.checklist_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.hasil_analisis  DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.proyek          DISABLE ROW LEVEL SECURITY;
```

Menjalankannya berarti **mematikan Row Level Security pada tiga tabel inti**.
Setelah itu **siapa pun yang memiliki anon key** (yang tersimpan di browser pengguna)
dapat membaca dan mengubah **seluruh data proyek semua pengguna**.

- Gunakan **hanya** di database development/percobaan, dan jangan pernah di produksi.
- Untuk mengembalikannya:

```sql
ALTER TABLE public.checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hasil_analisis  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proyek          ENABLE ROW LEVEL SECURITY;
```

---

## 3. Storage Bucket

Bucket **tidak dibuat oleh berkas SQL mana pun** — harus dibuat manual.
Kode aplikasi merujuk empat bucket berikut:

| Bucket | Dipakai untuk | Akses | Rujukan kode |
|---|---|---|---|
| `project-files` | Berkas data lapangan (NDT, hasil uji) | Privat (signed URL) | `src/lib/field-data-import.js` |
| `project-photos` | Foto bukti pemeriksaan egress | Privat | `src/domain/repositories/EgressRepository.js` |
| `templates` | Template laporan DOCX per proyek | Publik (URL publik) | `src/pages/laporan.js` |
| `system-assets` | Aset sistem (logo, dsb.) | Publik | `src/pages/pengaturan.js` |

### Membuat bucket lewat dashboard

**Storage → New bucket** → isi nama → pilih Public/Private → Create.
Ulangi untuk keempat bucket.

### Policy Storage (wajib, kalau tidak unduhan akan ditolak)

Buka **SQL Editor**, jalankan:

```sql
-- ── Bucket privat: hanya pengguna terautentikasi ──
insert into storage.buckets (id, name, public)
values ('project-files', 'project-files', false),
       ('project-photos', 'project-photos', false)
on conflict (id) do nothing;

create policy "Berkas proyek untuk pengguna login"
  on storage.objects for select
  to authenticated
  using (bucket_id in ('project-files', 'project-photos'));

create policy "Unggah berkas proyek"
  on storage.objects for insert
  to authenticated
  with check (bucket_id in ('project-files', 'project-photos'));

create policy "Ubah/hapus berkas proyek milik sendiri"
  on storage.objects for update
  to authenticated
  using (bucket_id in ('project-files', 'project-photos'))
  with check (bucket_id in ('project-files', 'project-photos'));

-- ── Bucket publik: template & aset sistem ──
insert into storage.buckets (id, name, public)
values ('templates', 'templates', true),
       ('system-assets', 'system-assets', true)
on conflict (id) do nothing;

create policy "Template & aset sistem bisa dibaca publik"
  on storage.objects for select
  to public
  using (bucket_id in ('templates', 'system-assets'));

create policy "Unggah template oleh pengguna login"
  on storage.objects for insert
  to authenticated
  with check (bucket_id in ('templates', 'system-assets'));
```

### Setelan cache — pengaruh besar ke kuota egress

Atur **Storage → bucket → Settings → Cache Control** ke nilai **panjang**
(disarankan `31536000` = 1 tahun). Nama berkas di aplikasi ini sudah memuat
timestamp sehingga isinya tidak pernah berubah, jadi aman di-cache lama.

Kode sudah mengirim `cacheControl: '31536000'` saat mengunggah
(`src/lib/field-data-import.js`, `src/pages/laporan.js`, `src/domain/repositories/EgressRepository.js`).
Setelan di dashboard berfungsi sebagai jaring pengaman untuk berkas lama.

> **Kenapa penting:** kuota Free hanya **5 GB egress uncached + 5 GB cached** per
> organisasi. Berkas dengan `cacheControl: 3600` (1 jam) ditarik ulang dari origin
> hampir setiap kali dibuka. Detail: `docs/EGRESS-MITIGATION.md`.

---

## 4. Edge Function

Ada **4 fungsi** di `supabase/functions/`:

| # | Fungsi | Kegunaan | Perlu deploy? | Secret yang dibutuhkan |
|---|---|---|---|---|
| 1 | `ai-proxy` | Perantara aman ke penyedia AI (Gemini/OpenAI/Claude/Groq/Mistral/OpenRouter/HF). Kunci AI tetap di server. | ✅ Ya | `GEMINI_API_KEY`, `OPENAI_API_KEY`, `CLAUDE_API_KEY`, `GROQ_API_KEY`, `OPENROUTER_API_KEY`, `MISTRAL_API_KEY`, `HF_API_TOKEN`, `HF_SLF_OPUS_URL` |
| 2 | `auto-fill-simak` | Pengisian otomatis formulir SIMAK (NSPK). | ✅ Ya | — (memakai `SUPABASE_*` otomatis) |
| 3 | `photo-checklist-mapper` | Pemetaan foto ke item checklist. | ✅ Ya | — |
| 4 | `keepalive` | Ping database agar project Free tidak di-pause (7 hari idle). | ✅ Ya | — |

> ⚠️ **`ai-proxy` hanya boleh dipanggil oleh pengguna yang sudah login.** Fungsi ini
> memverifikasi header `Authorization` ke GoTrue dan **menolak** anon key / publishable
> key (`role: anon`), karena kunci tersebut ikut ter-bundle ke berkas JS publik sehingga
> dapat dibaca siapa pun. Pemanggil harus mengirim `Bearer <session.access_token>` hasil
> login. Setelah deploy, uji dengan prosedur di
> `supabase/functions/ai-proxy/DEPLOY_GUIDE.md` langkah 8 — panggilan memakai anon key
> **harus** mengembalikan 401.

> ⚠️ **Kunci AI tidak boleh ada di environment saat `npm run build`.** Vite mengganti
> setiap `import.meta.env.VITE_*` menjadi nilai teks biasa di dalam berkas JS publik —
> termasuk bila diakses lewat alias atau secara dinamis (sudah diuji; lihat
> `docs/DEEP-AUDIT-2026-09.md` §2.5.4). `npm run build` menolak berjalan bila mendeteksi
> kunci AI pada environment build (`scripts/check-client-secrets.mjs`), dan hasil build
> diperiksa ulang terhadap pola kunci penyedia (`scripts/check-bundle-secrets.mjs`).
> Karena itu di langkah Build cukup `VITE_AI_PROXY_URL` saja — jangan tambahkan
> `VITE_*_API_KEY` ke sana.

### Deploy — urutan dan perintah

```bash
# Sekali di awal saja
npm i -g supabase
supabase login
supabase link --project-ref <project-ref>

# 1) Kunci AI untuk ai-proxy (opsional, isi yang Anda punya)
supabase secrets set \
  GEMINI_API_KEY="..." \
  OPENAI_API_KEY="..." \
  CLAUDE_API_KEY="..." \
  GROQ_API_KEY="..." \
  OPENROUTER_API_KEY="..." \
  MISTRAL_API_KEY="..." \
  HF_API_TOKEN="..." \
  HF_SLF_OPUS_URL="..." \
  --project-ref <project-ref>

# 2) Deploy keempat fungsi (urutan tidak kritikal, tapi ai-proxy dulu lebih rapi)
supabase functions deploy ai-proxy              --project-ref <project-ref>
supabase functions deploy auto-fill-simak       --project-ref <project-ref>
supabase functions deploy photo-checklist-mapper --project-ref <project-ref>
supabase functions deploy keepalive             --project-ref <project-ref>
```

**Otomatis lewat CI:** `.github/workflows/deploy.yml` kini men-deploy **keempat**
fungsi sekaligus (sebelumnya hanya `ai-proxy`, sehingga tiga lainnya harus
di-deploy manual dan sering tertinggal).

Setelan JWT ada di `supabase/config.toml`:

```toml
[functions.ai-proxy]
verify_jwt = true

[functions.keepalive]
verify_jwt = true
```

`verify_jwt = true` berarti pemanggil wajib menyertakan anon key/JWT — jangan
diubah menjadi `false`, kecuali Anda paham konsekuensinya.

### Uji fungsi setelah deploy

```bash
curl -i "https://<project-ref>.supabase.co/functions/v1/keepalive" \
     -H "Authorization: Bearer <ANON_KEY>"
# Harapan: HTTP 200 dengan {"ok":true,"via":"keepalive_ping",...}
```

---

## 5. Isi `.env`

```bash
cp .env.example .env
```

Wajib (nama variabel harus persis):

```dotenv
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon key>
```

Opsional: `VITE_APP_NAME`, `VITE_APP_VERSION`, `VITE_AI_PROXY_URL`,
`VITE_GOOGLE_APPS_SCRIPT_URL`, serta setelan Egress Guard & keepalive.
Daftar lengkap ada di `.env.example`.

> Aplikasi tetap bisa dibuka tanpa `.env` (memakai `placeholder.supabase.co`),
> tetapi login/DB tidak akan berfungsi. Di mode dev tersedia tombol
> **Dev Bypass** (`src/lib/auth.js`) untuk masuk tanpa backend.

---

## 6. Secrets GitHub

**Settings → Secrets and variables → Actions → New repository secret.**

### Untuk `.github/workflows/deploy.yml` (build + deploy Pages + Edge Function)

| Secret | Wajib? | Nilai |
|---|---|---|
| `VITE_SUPABASE_URL` | ✅ | Project URL |
| `VITE_SUPABASE_ANON_KEY` | ✅ | anon key |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` | ✅ | publishable key (format baru) |
| `SUPABASE_ACCESS_TOKEN` | ✅ | Dashboard → Account → Access Tokens |
| `SUPABASE_PROJECT_ID` | ✅ | project ref |
| `VITE_APP_NAME`, `VITE_APP_VERSION` | opsional | identitas aplikasi |
| `VITE_AI_PROXY_URL`, `VITE_EDGE_FUNCTION_BASE` | opsional | URL Edge Function |
| `VITE_GEMINI_API_KEY`, `VITE_OPENAI_API_KEY`, `VITE_CLAUDE_API_KEY`, `VITE_GROQ_API_KEY`, `VITE_MISTRAL_API_KEY`, `VITE_OPENROUTER_API_KEY`, `VITE_HF_API_TOKEN`, `VITE_HF_SLF_OPUS_URL` | opsional | kunci AI — dipakai CI **hanya** untuk `supabase secrets set` di langkah deploy Edge Function. **JANGAN diteruskan ke langkah `npm run build`** (lihat peringatan di bawah) |
| `VITE_GOOGLE_APPS_SCRIPT_URL`, `VITE_GCP_API_KEY`, `VITE_GOOGLE_CLIENT_ID`, `VITE_GOOGLE_DOC_TEMPLATE_ID` | opsional | integrasi Google |

### Untuk `.github/workflows/supabase-keepalive.yml` (ping tiap 2 hari)

| Secret | Wajib? | Nilai |
|---|---|---|
| `SUPABASE_URL` | ✅ | Project URL |
| `SUPABASE_ANON_KEY` | ✅ | anon key (aman dipublikasikan — dilindungi RLS) |

Setelah secrets diisi: **Actions → Supabase Keep-Alive → Run workflow** untuk
menguji, lalu pastikan jadwalnya muncul (**Actions → Supabase Keep-Alive → …**).

---

## 7. Verifikasi

| # | Yang diperiksa | Cara | Harapan |
|---|---|---|---|
| 1 | Tabel inti ada | SQL Editor: `select count(*) from proyek;` | Angka (boleh 0), bukan error |
| 2 | RLS aktif | SQL Editor: `select relname, relrowsecurity from pg_class where relname in ('proyek','checklist_items','hasil_analisis');` | `relrowsecurity = true` untuk ketiganya |
| 3 | Tabel keepalive ada | `select count(*) from keepalive_ping;` | Angka, bukan error |
| 4 | Ekstensi vektor | `select * from pg_extension where extname = 'vector';` | 1 baris |
| 5 | Bucket ada | Dashboard → Storage | 4 bucket |
| 6 | Edge function hidup | `curl .../functions/v1/keepalive` (§4) | `{"ok":true,...}` |
| 7 | .env terbaca | `npm run dev` → console browser | Tidak ada `[Supabase] ❌ KONFIGURASI TIDAK LENGKAP!` |
| 8 | Login berfungsi | Buka aplikasi → login | Masuk ke dashboard |
| 9 | Egress guard aktif | Console: `await window.__slfEgress.report()` | Tabel statistik HIT/MISS muncul |
| 10 | Keepalive tercatat | `select * from keepalive_ping order by created_at desc limit 5;` | Baris bertambah tiap ±2 hari |

---

## 8. Troubleshooting

| Gejala | Sebab & solusi |
|---|---|
| `relation "proyek" does not exist` saat menjalankan skema sanitasi | Urutan SQL salah — jalankan berkas **1** dulu (§2). |
| `policy "..." already exists` | Berkas sudah pernah dijalankan. Tabel aman (IF NOT EXISTS), policy tidak — `DROP POLICY IF EXISTS` dulu (§2). |
| `type "vector" does not exist` | Ekstensi pgvector belum aktif (§2). |
| Login gagal / "Invalid API key" | `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` salah atau tertukar dengan service_role. Isi ulang `.env`, restart `npm run dev`. |
| Unggah berkas gagal `new row violates row-level security policy` | Policy Storage belum dibuat (§3). |
| Foto/lampiran tidak muncul walau terunggah | Bucket privat butuh signed URL; pastikan policy `select` untuk `authenticated` sudah ada (§3). |
| `Edge Function returned a non-2xx status` | Fungsi belum di-deploy atau secret AI kosong (§4). |
| Project "paused" tiba-tiba | Tidak ada aktivitas DB 7 hari. Dashboard → **Restore project**, lalu pastikan keepalive berjalan (§6, `docs/EGRESS-MITIGATION.md`). |
| Kuota habis / API balas **402** | Egress melewati kuota. Lihat `docs/EGRESS-MITIGATION.md`; batas lift saat siklus billing reset atau naik ke Pro. |
| Data lama tiba-tiba muncul kembali setelah edit | Cache Egress Guard belum terinvalidasi (biasanya hanya bila data diubah lewat jalur non-REST). `await window.__slfEgress.invalidate('nama_tabel')` lalu muat ulang. |

---

## 9. Checklist Ringkas

```
[ ] Project Supabase dibuat; URL + anon key + project ref dicatat
[ ] SQL #1 migrations/20240401_01_initial_schema.sql        → Run
[ ] SQL #2 sanitation_schema.sql                            → Run
[ ] SQL #3 supabase_smartai_pipeline_tables.sql             → Run (ekstensi vector aktif)
[ ] SQL #4 migrations/20260916_keepalive_and_indexes.sql    → Run
[ ] (JANGAN jalankan fix_rls.sql di produksi)
[ ] 4 Storage bucket dibuat + policy storage dijalankan
[ ] Cache-Control bucket diset 31536000
[ ] 4 Edge Function di-deploy; secret AI diisi
[ ] .env dibuat dari .env.example dan diisi
[ ] Secrets GitHub diisi (deploy.yml + supabase-keepalive.yml)
[ ] Verifikasi §7 lolos semua
```

---

## Lampiran — Pemetaan Tabel per Berkas SQL

| Berkas | Tabel dibuat | Fungsi/View |
|---|---|---|
| `20240401_01_initial_schema.sql` | `proyek`, `proyek_files`, `checklist_items`, `hasil_analisis`, `todo_tasks`, `notifications`, `profiles`, `settings`, `hasil_simulasi`, `field_test_data` | `handle_new_user()`, `set_updated_at()`, view `simulasi_summary` |
| `sanitation_schema.sql` | `sanitation_septic_tanks`, `sanitation_ipal_units`, `sanitation_chutes`, `sanitation_pipes`, `sanitation_inspection_points`, `sanitation_effluent_tests`, `sanitation_sludge_records`, `sanitation_photos`, `sanitation_compliance_checks` | `update_sanitation_*_updated_at()` |
| `supabase_smartai_pipeline_tables.sql` | `smartai_jobs`, `smartai_documents`, `smartai_chunks`, `smartai_embeddings`, `smartai_cache`, `smartai_logs` | `match_documents()`, `update_updated_at_column()`, `smartai_cleanup()` |
| `20260916_keepalive_and_indexes.sql` | `keepalive_ping` | `keepalive_prune()` |
| `fix_rls.sql` | — | ⚠️ mematikan RLS 3 tabel (hanya untuk dev) |

**Ekstensi yang dibutuhkan:** `uuid-ossp` (dibuat otomatis oleh berkas SQL), `vector` (manual).
