-- ============================================================================
--  rls_audit.sql — PEMERIKSAAN KEAMANAN RLS (hanya baca, tidak mengubah apa pun)
--  Jalankan di Supabase Dashboard → SQL Editor.
--  Aman dijalankan kapan saja, termasuk di produksi.
-- ============================================================================

-- 1) Tabel mana saja yang RLS-nya MATI?
--    Setiap baris di sini = tabel yang bisa dibaca/ditulis anon key.
SELECT
  n.nspname AS schema,
  c.relname AS tabel,
  CASE WHEN c.relrowsecurity THEN 'AKTIF' ELSE '❌ MATI' END AS rls,
  CASE WHEN c.relforcerowsecurity THEN 'ya' ELSE 'tidak' END AS force_rls,
  pg_get_userbyid(c.relowner) AS pemilik
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
ORDER BY c.relrowsecurity, c.relname;


-- 2) Tabel yang RLS-nya AKTIF tetapi TIDAK punya policy sama sekali.
--    Ini juga berbahaya: RLS aktif tanpa policy = tidak ada yang bisa akses
--    (aplikasi akan tampak "rusak" dan orang cenderung mematikan RLS).
SELECT
  c.relname AS tabel_tanpa_policy
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
LEFT JOIN pg_policy p ON p.polrelid = c.oid
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND c.relrowsecurity
GROUP BY c.relname
HAVING count(p.oid) = 0
ORDER BY c.relname;


-- 3) Ringkasan policy untuk tabel yang sensitif
SELECT
  tablename,
  policyname,
  cmd  AS operasi,
  roles,
  qual AS kondisi_using,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('proyek', 'checklist_items', 'hasil_analisis', 'profiles', 'settings')
ORDER BY tablename, cmd;


-- 4) Apakah `anon` punya hak langsung ke tabel?
--    Idealnya hanya tabel yang benar-benar publik (mis. cache read-only).
SELECT
  table_name,
  grantee,
  string_agg(privilege_type, ', ' ORDER BY privilege_type) AS hak
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND grantee IN ('anon', 'authenticated')
GROUP BY table_name, grantee
ORDER BY table_name, grantee;


-- 5) RLS pada storage.objects (bucket privat)
SELECT
  c.relname AS tabel,
  CASE WHEN c.relrowsecurity THEN 'AKTIF' ELSE '❌ MATI' END AS rls
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'storage' AND c.relname = 'objects';
