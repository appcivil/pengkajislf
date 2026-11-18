# Rancangan Kuota AI Atomik — Free Tier

Status: desain untuk review; belum ada migrasi atau implementasi kuota.

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

## Implementasi database yang disarankan

- Fungsi reserve/finalize berada di skema privat dan memakai `SECURITY DEFINER` hanya jika benar-benar diperlukan.
- Semua fungsi privileged wajib memakai `SET search_path = ''`, nama objek fully-qualified, validasi parameter, serta revoke dari `PUBLIC` dan `anon`.
- Fungsi reserve memverifikasi `auth.uid()` atau menerima klaim pengguna yang sudah diverifikasi melalui jalur server yang tidak dapat dipalsukan klien.
- Lock baris dilakukan dalam urutan deterministik (user lalu organization) untuk menghindari deadlock.
- Update dua bucket dan pembuatan reservation harus berada dalam satu transaksi PostgreSQL.
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

Dokumen ini hanya rancangan. Belum membuat tabel, fungsi, cron, secret, atau mengubah Supabase. Implementasi baru dilakukan setelah nilai batas dan perilaku paket gratis disetujui serta diuji pada database lokal CI.
