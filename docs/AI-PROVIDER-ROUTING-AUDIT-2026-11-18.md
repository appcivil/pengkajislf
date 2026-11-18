# Audit Jalur Provider AI dan Isolasi Proyek — 2026-11-18

Status: perubahan kode berada pada branch Draft; CI belum diverifikasi. Tidak ada deployment atau perubahan database produksi.

## Ringkasan

Audit menemukan beberapa kelas jalur provider yang tidak konsisten:
- router utama memiliki jalur proxy dan jalur provider langsung untuk development;
- router infrastruktur memiliki fallback langsung;
- modul vision/dokumen memanggil provider langsung dari browser;
- helper provider yang diekspor dapat dipanggil oleh service lain tanpa melewati autentikasi/project scope;
- beberapa jalur analisis proyek belum meneruskan projectId secara konsisten.

Perubahan pada branch ini mengarahkan browser AI ke Edge Function `ai-proxy`, menutup direct provider fetchers pada router utama/infrastruktur, dan mewajibkan projectId untuk operasi vision berbasis proyek.

## Jalur yang diperiksa dan perubahan

| Area | Hasil audit | Perubahan branch |
|---|---|---|
| `src/lib/ai-router.js` | Sebelumnya memiliki registry provider dan fetcher langsung | Registry tidak lagi menyimpan API key provider; request browser hanya ke ai-proxy |
| `src/infrastructure/ai/AIRouter.js` | Memiliki executeDirect dan accessor API key | executeDirect dinonaktifkan; router selalu menggunakan ai-proxy |
| `src/lib/gemini.js` | Vision, dokumen, dan komparatif memakai fetch provider langsung | Semua memakai ai-proxy; projectId wajib; tidak ada provider API key di modul |
| `src/lib/voice-service.js` | Formalisasi dan inferensi status menggunakan helper provider | Menggunakan callAI dan memerlukan projectId |
| `src/lib/checklist-ai-service.js` | Pemanggil vision checklist belum meneruskan projectId | Pemanggil aktif meneruskan currentProyekId |
| `src/infrastructure/ai/deep-reasoning-integration.js` | Jalur checklist, dokumen, dan komparatif dapat memanggil fungsi dasar kembali secara rekursif | Opsi useDeepReasoning=false diteruskan ke eksekusi dasar |
| `src/services/ai-workspace-service.js` | Helper OpenRouter dipanggil langsung; project scope tidak diteruskan; Supabase import tidak ada | Menggunakan helper proxy dengan file.proyek_id; menolak file tanpa project scope |
| `src/application/use-cases/AnalisisDokumenAI.js` | projectId dokumen tidak diteruskan ke AI service | Mengambil projectId dari record berkas dan meneruskannya |
| `src/infrastructure/ai/OpenRouterService.js` | Helper provider diekspor dan dapat dipanggil langsung | Helper publik diarahkan melalui callAI/proxy |
| `vite.config.js` | Tersedia proxy dev langsung ke beberapa provider | Endpoint proxy provider langsung dihapus; proxy /functions tetap ada |

## Multi-image proxy

AI Proxy menerima array `images` khusus Gemini dengan batas:
- maksimal 10 gambar;
- total base64 maksimal 4.000.000 karakter;
- MIME hanya JPEG, PNG, atau WebP;
- request multi-image wajib membawa projectId;
- projectId diverifikasi menggunakan JWT pemanggil dan RLS sebelum provider dipanggil.

Payload satu gambar lama tetap tersedia untuk OCR sebelum proyek dibuat. Jalur tersebut tetap memerlukan sesi pengguna. Setelah proyek ada, operasi bukti proyek wajib membawa projectId. Local Ollama tidak lagi dipanggil langsung dari browser karena belum tersedia sebagai provider di ai-proxy; opsi Ollama pada pengaturan belum diintegrasikan kembali ke jalur proxy.

## Perlindungan bundel browser

Repository sudah memiliki:
- `prebuild`: `scripts/check-client-secrets.mjs`, memblokir variabel VITE_* yang berisi rahasia server;
- `postbuild`: `scripts/check-bundle-secrets.mjs`, memindai artefak `dist` untuk signature rahasia.

Branch ini menghapus referensi provider key dari registry utama dan router infrastruktur. Namun pemeriksaan akhir artefak build tetap harus dijalankan CI; belum ada hasil CI branch ini yang dapat dinyatakan lulus.

## Otorisasi role — belum diterapkan

AI Proxy saat ini memverifikasi user JWT dan memastikan proyek dapat dibaca melalui RLS. Ini belum membedakan role owner/admin/member/viewer. Hak baca proyek tidak boleh dianggap otomatis sebagai hak menjalankan AI.

Usulan matriks role dan test matrix dicatat di `docs/AI-ATOMIC-QUOTA-DESIGN.md`. Implementasi role guard menunggu keputusan produk final, khususnya hak AI member, izin penyimpanan hasil, dan approval operasi berbiaya tinggi.

## Kuota atomik — belum diimplementasikan

Dokumen `docs/AI-ATOMIC-QUOTA-DESIGN.md` menjadi rancangan utama:
- kuota user untuk seluruh request;
- kuota organisasi tambahan untuk request proyek;
- reserve dan finalize atomik;
- idempotency untuk retry/fallback;
- tidak ada provider call jika reserve ditolak;
- angka batas belum ditetapkan.

Belum ada migration, tabel, RPC, cron, atau secret kuota dibuat.

## Risiko tersisa dan langkah verifikasi

1. Jalankan CI lengkap: unit tests, static security audits, Deno security tests, local Supabase migration replay, tenant isolation tests, dan production build.
2. Periksa bundle `dist` dan pastikan tidak ada signature API key.
3. Uji user A/B, tenant A/B, projectId asing, viewer, revoked member, anon, token kedaluwarsa, oversize payload, dan multi-image.
4. Tetapkan kebijakan role AI sebelum menambahkan server-side role guard.
5. Setujui angka kuota dan perilaku hard block/grace period sebelum membuat implementasi atomik.
6. Deploy Edge Function hanya melalui prosedur manual dan setelah persetujuan eksplisit; perubahan branch tidak mengubah versi Edge Function yang sedang deployed.

