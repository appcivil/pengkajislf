-- ============================================================
--  KEEPALIVE + PENGHEMATAN EGRESS
--  Dibuat: 2026-09-16
--
--  Isi:
--   1. Tabel keepalive_ping  → target ping "murah" (aktivitas DB nyata)
--   2. RLS: anon/authenticated boleh SELECT (tanpa data sensitif),
--      INSERT hanya lewat service_role / Edge Function.
--   3. Retensi otomatis agar tabel tidak tumbuh selamanya.
--   4. Opsional: pg_cron sebagai sinyal tambahan.
--
--  Jalankan di Supabase SQL Editor, atau:
--    supabase db push
-- ============================================================

-- ------------------------------------------------------------
-- 1. Tabel keepalive
-- ------------------------------------------------------------
create table if not exists public.keepalive_ping (
  id          bigserial primary key,
  source      text        not null default 'unknown',
  created_at  timestamptz not null default now()
);

comment on table public.keepalive_ping is
  'Tabel ping untuk mencegah proyek Free di-pause (7 hari tanpa aktivitas DB). Tanpa data pengguna.';

-- Indeks untuk pembersihan berbasis waktu
create index if not exists keepalive_ping_created_at_idx
  on public.keepalive_ping (created_at desc);

-- ------------------------------------------------------------
-- 2. RLS
-- ------------------------------------------------------------
alter table public.keepalive_ping enable row level security;

-- Baca: diizinkan untuk anon & authenticated (isinya hanya cap waktu).
-- Ini yang membuat ping dari klien (src/lib/keepalive.js) berhasil.
drop policy if exists "keepalive_read_all" on public.keepalive_ping;
create policy "keepalive_read_all"
  on public.keepalive_ping
  for select
  to anon, authenticated
  using (true);

-- Tulis: TIDAK ada policy untuk anon/authenticated → hanya service_role
-- (Edge Function keepalive) yang bisa menambah baris.
-- service_role melewati RLS, jadi tidak perlu policy tambahan.

-- ------------------------------------------------------------
-- 3. Batas jumlah baris (retensi)
--    Panggil berkala; menyisakan 200 baris terakhir saja (~ < 50 KB).
-- ------------------------------------------------------------
create or replace function public.keepalive_prune()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted integer;
begin
  delete from public.keepalive_ping
  where id not in (
    select id from public.keepalive_ping
    order by created_at desc
    limit 200
  );
  get diagnostics deleted = row_count;
  return deleted;
end;
$$;

comment on function public.keepalive_prune() is
  'Menyisakan 200 baris keepalive_ping terbaru agar tabel tidak membengkak.';

revoke all on function public.keepalive_prune() from anon, authenticated;

-- ------------------------------------------------------------
-- 4. Opsional: pg_cron (sinyal tambahan selama proyek masih aktif)
--
--    PENTING: pg_cron berjalan DI DALAM database. Bila proyek sudah
--    ter-pause, cron tidak bisa membangunkannya (compute mati).
--    Jadi pg_cron adalah pelengkap, BUKAN pengganti ping eksternal
--    (GitHub Actions / cron-job.org).
-- ------------------------------------------------------------
-- create extension if not exists pg_cron;
--
-- select cron.schedule(
--   'keepalive-ping',          -- nama job
--   '17 */12 * * *',           -- tiap 12 jam
--   $$ select count(*) from public.keepalive_ping; $$
-- );
--
-- select cron.schedule(
--   'keepalive-prune',
--   '23 3 * * *',              -- harian 03:23
--   $$ select public.keepalive_prune(); $$
-- );

-- ------------------------------------------------------------
-- 5. Pembersihan awal (jalankan sekali saat migrasi)
-- ------------------------------------------------------------
select public.keepalive_prune();

-- ------------------------------------------------------------
-- 6. Catatan penghematan egress pada tabel metadata
--    Kolom besar (base64) membuat SETIAP select proyek ikut menarik
--    ratusan KB. Setelah template dipindah ke Storage, kosongkan:
-- ------------------------------------------------------------
update public.proyek
set metadata = metadata - 'report_template_base64'
where metadata ? 'report_template_base64';
