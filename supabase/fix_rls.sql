-- ============================================================================
--  fix_rls.sql — PEMULIHAN KEAMANAN ROW LEVEL SECURITY
--  Revisi 2026-09-16 (audit mendalam)
-- ============================================================================
--
--  ⚠️  PERUBAHAN PERILAKU PENTING
--
--  Versi sebelumnya file ini berisi:
--
--      ALTER TABLE public.proyek           DISABLE ROW LEVEL SECURITY;
--      ALTER TABLE public.checklist_items  DISABLE ROW LEVEL SECURITY;
--      ALTER TABLE public.hasil_analisis   DISABLE ROW LEVEL SECURITY;
--
--  Perintah itu MEMATIKAN proteksi RLS. Kalau dijalankan di proyek produksi,
--  ketiga tabel berisi data klien menjadi:
--
--      dapat dibaca, diubah, dan dihapus oleh siapa pun yang memiliki
--      anon key — dan anon key SELALU ter-bundle di dalam file JS publik
--      (nilai VITE_SUPABASE_ANON_KEY ikut ter-inline saat `npm run build`).
--
--  Artinya: satu kali menjalankan skrip lama = seluruh data proyek terbuka
--  di internet, tanpa perlu login. Ini bukan risiko teoretis, karena skrip
--  ini dulu didokumentasikan sebagai langkah setup yang normal.
--
--  Sekarang skrip ini melakukan KEBALIKANNYA: mengembalikan RLS ke kondisi
--  aman. Skrip ini aman dijalankan berulang kali (idempoten).
--
--  Jalankan di: Supabase Dashboard → SQL Editor
--  Setelah selesai, verifikasi dengan supabase/security/rls_audit.sql
-- ============================================================================


-- ---------------------------------------------------------------------------
-- LANGKAH 1 — Hidupkan kembali RLS pada tabel yang berisiko
-- ---------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.proyek           ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.checklist_items  ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.hasil_analisis   ENABLE ROW LEVEL SECURITY;

-- FORCE ROW LEVEL SECURITY juga menutup celah bagi pemilik tabel
-- (mis. service_role yang tidak memakai BYPASSRLS).
-- ALTER TABLE IF EXISTS public.proyek FORCE ROW LEVEL SECURITY;
-- ALTER TABLE IF EXISTS public.checklist_items FORCE ROW LEVEL SECURITY;
-- ALTER TABLE IF EXISTS public.hasil_analisis FORCE ROW LEVEL SECURITY;


-- ---------------------------------------------------------------------------
-- LANGKAH 2 — Pastikan policy untuk pengguna terautentikasi tersedia
--
--  CREATE POLICY tidak idempoten, jadi DROP lebih dulu.
--  Policy "hanya authenticated" dipertahankan sesuai desain awal aplikasi:
--  seluruh staf yang login boleh mengelola semua proyek (satu instansi).
--  Anon TIDAK mendapat akses.
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Authenticated users can manage all projects"    ON public.proyek;
CREATE POLICY "Authenticated users can manage all projects"
  ON public.proyek FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can manage all checklist items" ON public.checklist_items;
CREATE POLICY "Authenticated users can manage all checklist items"
  ON public.checklist_items FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can manage all hasil analisis" ON public.hasil_analisis;
CREATE POLICY "Authenticated users can manage all hasil analisis"
  ON public.hasil_analisis FOR ALL TO authenticated
  USING (true) WITH CHECK (true);


-- ---------------------------------------------------------------------------
-- LANGKAH 3 — Cabut hak akses `anon` (sabuk pengaman kedua)
--
--  RLS saja sudah cukup, tetapi mencabut GRANT berarti bahkan jika RLS
--  tidak sengaja dimatikan lagi, anon tetap tidak bisa menyentuh tabel ini.
-- ---------------------------------------------------------------------------
REVOKE ALL ON TABLE public.proyek          FROM anon;
REVOKE ALL ON TABLE public.checklist_items FROM anon;
REVOKE ALL ON TABLE public.hasil_analisis  FROM anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.proyek          TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.checklist_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.hasil_analisis  TO authenticated;


-- ---------------------------------------------------------------------------
-- LANGKAH 4 — Verifikasi
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  v_open text;
BEGIN
  SELECT string_agg(format('%s.%s', schemaname, tablename), ', ')
    INTO v_open
  FROM pg_tables
  WHERE schemaname = 'public'
    AND NOT rowsecurity;

  IF v_open IS NULL THEN
    RAISE NOTICE 'RLS: AMAN — semua tabel di schema public sudah mengaktifkan RLS.';
  ELSE
    RAISE WARNING 'RLS: PERIKSA — tabel berikut masih TANPA RLS: %', v_open;
  END IF;
END $$;

SELECT schemaname, tablename, rowsecurity AS rls_aktif
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY rowsecurity, tablename;


-- ============================================================================
--  DEV-ONLY — JANGAN DIJALANKAN DI PRODUKSI
-- ============================================================================
--
--  Kalau benar-benar butuh mematikan RLS untuk pengujian lokal (mis. seed
--  data lewat anon key), jalankan blok ini HANYA pada database pengembangan
--  dan HANYA sementara. Setelah selesai, jalankan ulang LANGSUNG dari
--  LANGKAH 1 di atas.
--
--  ALTER TABLE public.proyek          DISABLE ROW LEVEL SECURITY;
--  ALTER TABLE public.checklist_items DISABLE ROW LEVEL SECURITY;
--  ALTER TABLE public.hasil_analisis  DISABLE ROW LEVEL SECURITY;
--
-- ============================================================================
