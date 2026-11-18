# Rancangan Kuota AI Atomik — Free Tier

Status: fondasi ledger dan RPC atomik ditambahkan pada migration 20261118090000; jendela pencatatan penggunaan sudah disiapkan dalam keadaan nonaktif (tanpa batas numerik); AI Proxy belum terhubung ke RPC.

## Tujuan

1. Batas pengguna berlaku untuk seluruh permintaan AI, termasuk permintaan tanpa konteks proyek.
2. Batas organisasi/tenant menjadi batas tambahan untuk permintaan yang terkait proyek.
3. Permintaan proyek harus diotorisasi lebih dahulu dengan access token pengguna dan RLS.
4. Penghitungan kuota harus konsisten lintas tab, perangkat, dan instance Edge Function.
5. Seluruh batas ditetapkan server-side; klien tidak boleh mengirim atau mengubah nilai batas.

## Prinsip otorisasi

- Identitas pengguna berasal dari token yang telah diverifikasi oleh Supabase Auth.
- Jika request membawa `projectId`, AI Proxy memeriksa bahwa pengguna dapat membaca baris `public.proyek` tersebut melalui RLS.
- Tenant tidak pernah diterima sebagai fakta dari payload klien. Setelah project access lolos, organisasi diambil dari relasi proyek di database.
- Request umum tanpa `projectId` tetap dikenai kuota pengguna, tetapi tidak dikenai kuota tenant.
- Service-role tidak boleh digunakan untuk memutuskan apakah pengguna merupakan anggota proyek.

## Model pencatatan

Usulan tabel internal (skema privat, bukan tabel yang dapat dibaca klien):

- `private.ai_quota_policies`: konfigurasi batas menurut plan dan scope (user / organization), periode, jumlah request, dan token.
- `private.ai_usage_buckets`: agregat penggunaan berdasarkan subject, periode, request count, token reserved, dan token final.
- `private.ai_usage_reservations`: reservasi per request dengan idempotency key, user, optional organization, perkiraan token, status, dan waktu kedaluwarsa.

Jendela pencatatan 1 menit, 1 jam, 1 hari, dan 30 hari dibuat untuk scope user dan organization dengan `enabled=false` serta batas `NULL`. Reservasi tetap memperbarui counter reserved/used pada jendela ini. Dengan demikian, penggunaan tercatat sebelum batas numerik disetujui; mengaktifkan batas pada jendela yang sudah ada tidak menghilangkan histori penggunaan di periode berjalan.

Jangan menyimpan prompt, isi dokumen, gambar, API key provider, atau access token dalam tabel usage. Simpan metadata minimum untuk audit dan rekonsiliasi.

## Alur reserve → provider → finalize

1. Verifikasi JWT dan ambil user ID dari Auth.
2. Validasi payload, ukuran, provider/model, serta token maksimum.
3. Bila ada projectId, validasi UUID dan cek akses proyek memakai JWT pengguna. Ambil organization_id dari baris proyek yang lolos RLS.
4. Hitung estimasi biaya konservatif: token input dari teks dan payload, ditambah batas token output; gambar memakai bobot estimasi tersendiri.
5. Panggil satu fungsi database atomik untuk mereservasi kuota pengguna dan, bila ada, kuota organisasi. Kedua scope harus berhasil atau keduanya gagal dalam transaksi yang sama.
6. Jika salah satu batas terlampaui, jangan hubungi provider; kembalikan HTTP 429 dengan kode stabil dan waktu reset.
7. Setelah provider merespons, finalisasi reservasi memakai usage aktual bila provider menyediakannya. Jika usage tidak tersedia, gunakan jumlah reservasi sebagai biaya konservatif.
8. Finalisasi harus idempotent. Timeout atau retry tidak boleh menggandakan hitungan; reservation yang kedaluwarsa direkonsiliasi oleh proses terjadwal.

## Implementasi database yang sudah dibuat

- Fungsi `ai_quota_reserve`, `ai_quota_finalize`, `ai_quota_release`, dan `ai_quota_expire_reservations` berada di skema privat dan memakai `SECURITY DEFINER`.
- Semua fungsi privileged wajib memakai `SET search_path = ''`, nama objek fully-qualified, validasi parameter, serta revoke dari `PUBLIC` dan `anon`.
- RPC hanya dapat dipanggil `service_role`; karena itu pemanggil Edge Function wajib mengambil `user_id` dari JWT yang sudah diverifikasi dan `organization_id` dari baris proyek yang berhasil diakses lewat RLS pengguna. Jangan pernah meneruskan ID organisasi dari payload klien.
- Lock baris dilakukan dalam urutan deterministik (user lalu organization) untuk menghindari deadlock.
- Pemeriksaan seluruh bucket dan pembuatan reservasi berjalan dalam satu transaksi PostgreSQL; advisory lock deterministik mengambil lock user lebih dahulu, kemudian organization. Finalize/release/expire mengunci reservasi dan memperbarui semua bucket yang direferensikan.
- Client roles tidak mendapat SELECT/INSERT/UPDATE/DELETE langsung atas tabel privat.
- Jika Edge Function memakai service-role untuk finalisasi, RPC wajib mengikat reservation ke ID request yang dibuat saat reserve; service-role tidak boleh dapat mengubah identitas pemilik reservation sembarang.

## Retry, fallback, dan cache

- Satu permintaan logis dengan fallback antar-provider dihitung sebagai satu permintaan pengguna/tenant, bukan satu hitungan per provider.
- Retry internal menggunakan reservation/idempotency key yang sama.
- Cache hit dapat dikecualikan dari token provider, tetapi keputusan ini harus konsisten dan dicatat; jangan mengizinkan klien menandai request sebagai cache hit.
- Rate limiter di browser hanya optimasi UX. Token bucket in-memory tidak dapat menjadi kontrol kuota server karena dapat direset, berjalan per tab, dan tidak dibagi antar instance.

## Kebijakan paket gratis

Kebijakan harus dapat dikonfigurasi melalui data server, bukan konstanta di JavaScript. Nilai numerik belum ditetapkan dalam desain ini. Sebelum implementasi, owner perlu menyetujui:
- jumlah request per pengguna per menit/jam/hari;
- token input/output per pengguna per hari/bulan;
- jumlah request dan token per organisasi per hari/bulan;
- batas ukuran gambar/dokumen dan concurrency;
- perilaku saat batas habis (hard block atau masa tenggang).

Tidak boleh mengaktifkan batas numerik default secara diam-diam karena dapat menghentikan alur kerja tenant.

## Pengujian wajib

- User A dan B: batas pengguna terpisah.
- Dua anggota organisasi sama: kuota tenant dibagi, kuota user tetap terpisah.
- Dua organisasi: kuota tenant tidak saling memengaruhi.
- User tanpa projectId: hanya kuota user.
- projectId asing / tidak terlihat RLS: 403 dan tidak membuat reservation.
- Dua request bersamaan tepat di batas: hanya jumlah yang diizinkan berhasil.
- Retry, timeout, fallback provider, dan finalisasi berulang: tidak menggandakan penggunaan.
- Reservation kedaluwarsa: dilepas atau direkonsiliasi secara aman.
- Viewer: tetap dapat menggunakan AI hanya bila kebijakan produk mengizinkan; RLS project access sendiri tidak otomatis berarti role viewer boleh menjalankan operasi AI yang mengubah data.

## Status dan batas keselamatan

Fondasi implementasi dibuat dalam migration 20261118090000_ai_atomic_quota_foundation.sql: tabel privat untuk policy, bucket penggunaan, dan reservasi; RPC reserve/finalize/release/expire dengan advisory lock deterministik, idempotency, dan finalisasi idempotent. Jendela pencatatan sudah tersedia tanpa batas numerik aktif. AI Proxy belum memanggil RPC ini, belum ada cron/secret/deployment, dan CI kuota pertama menemukan kesalahan delimiter pada SQL test expiry; delimiter telah diperbaiki. Test lanjutan menambahkan pemeriksaan ACL, usage tracking tanpa caps, conflicting finalize, serta dua sesi concurrent; hasil CI terbaru untuk head PR #24 masih menunggu. Tidak ada migrasi yang diterapkan pada database produksi.


## Matriks role untuk operasi AI — disetujui 2026-11-18

Akses baca proyek melalui RLS tidak otomatis memberikan hak menjalankan AI. Matriks berikut telah disetujui sebagai kebijakan produk.

| Role organisasi | Membaca proyek | Menjalankan AI proyek | Mengubah data hasil AI |
|---|---:|---:|---:|
| owner | sesuai RLS | ya | ya |
| admin | sesuai RLS | ya | ya |
| member | sesuai RLS | ya | sesuai izin modul |
| viewer | sesuai RLS | tidak | tidak |
| platform admin | dukungan lintas tenant hanya dengan otorisasi eksplisit dan audit | tidak otomatis | tidak otomatis |

**Keputusan yang telah disetujui:** owner/admin/member boleh menjalankan AI proyek; viewer hanya membaca dan tidak boleh menjalankan AI atau mengubah hasil; platform admin tidak memperoleh akses lintas tenant otomatis. Hak simpan hasil untuk member mengikuti izin modul dan RLS yang berlaku. Approval untuk operasi mahal belum diputuskan dan tetap menunggu kebijakan kuota.

### Pengujian role wajib

- owner/admin/member yang sah dapat menjalankan permintaan proyek.
- viewer dapat membaca proyek sesuai RLS, tetapi permintaan AI ditolak; request tanpa projectId juga harus menolak akun yang seluruh membership-nya viewer.
- anggota tenant A tidak dapat meminta AI dengan projectId tenant B.
- user yang sudah dikeluarkan dari organisasi langsung ditolak walaupun masih memiliki sesi login.
- platform admin tidak memperoleh akses AI lintas tenant secara implisit; jalur dukungan harus eksplisit, terbatas, dan tercatat.
- permintaan tanpa projectId hanya dapat memakai kuota user dan tidak boleh mengakses data proyek melalui prompt yang dikirim klien.

## Kunci provider dan batas browser

- Browser hanya mengirim permintaan ke `ai-proxy`; provider key berada di Edge Function secrets.
- Build wajib menjalankan `prebuild` (`check-client-secrets.mjs`) dan `postbuild` (`check-bundle-secrets.mjs`).
- Vision project requests menggunakan payload multi-image yang dibatasi jumlah, MIME, dan total ukuran serta wajib membawa projectId.
- OCR saat pembuatan proyek dapat berjalan sebelum projectId tersedia, tetapi tetap memerlukan sesi pengguna; setelah proyek dibuat, operasi lanjutan harus membawa projectId.
- Pemeriksaan role harus dilakukan server-side setelah project membership diverifikasi, sebelum reservasi kuota dan sebelum provider dipanggil.
