-- ============================================================
--  ANALISIS EGRESS — Jalankan di Supabase SQL Editor
--
--  Tujuan: menemukan query/tabel yang PALING BANYAK mengirim
--  byte ke klien, supaya optimasi tepat sasaran (bukan menebak).
--
--  Catatan: egress dihitung dari byte yang DIKIRIM ke klien,
--  jadi yang dicari adalah query dengan total hasil terbesar
--  dan frekuensi pemanggilan tertinggi.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Query yang paling sering dipanggil & paling berat
--    (membutuhkan ekstensi pg_stat_statements)
-- ------------------------------------------------------------
-- create extension if not exists pg_stat_statements;

with q as (
  select
    calls,
    rows,
    round(total_exec_time::numeric, 1)                        as total_ms,
    round(mean_exec_time::numeric, 2)                          as avg_ms,
    rows / nullif(calls, 0)                                    as avg_rows_per_call,
    calls * (rows / nullif(calls, 0))                          as est_rows_served,
    left(regexp_replace(query, '\s+', ' ', 'g'), 160)          as query_preview
  from pg_stat_statements
  where query ilike '%select%'
    and query not ilike '%pg_stat%'
)
select *
from q
order by est_rows_served desc nulls last
limit 25;

-- ------------------------------------------------------------
-- 2. Beban baca per tabel (indikator tabel "panas")
-- ------------------------------------------------------------
select
  schemaname,
  relname                                   as tabel,
  seq_scan                                  as pemindaian_penuh,
  idx_scan                                  as lewat_index,
  n_live_tup                                as jumlah_baris,
  pg_size_pretty(pg_total_relation_size(relid)) as ukuran_total
from pg_stat_user_tables
where schemaname = 'public'
order by seq_scan desc, n_live_tup desc
limit 25;

-- ------------------------------------------------------------
-- 3. Kolom "berat" — kandidat utama penyebab egress membengkak
--    (kolom besar yang ikut terkirim saat select('*'))
-- ------------------------------------------------------------
select
  table_name                                as tabel,
  column_name                               as kolom,
  data_type,
  pg_size_pretty(pg_column_size(null))      as dummy
from information_schema.columns
where table_schema = 'public'
  and (
    data_type in ('text', 'jsonb', 'json')
    and column_name ilike any (array['%base64%', '%content%', '%data%', '%metadata%', '%payload%', '%report%', '%html%', '%attachment%'])
  )
order by table_name, column_name;

-- ------------------------------------------------------------
-- 4. Ukuran baris rata-rata per tabel — tabel dengan baris gemuk
--    adalah tersangka utama saat klien melakukan select('*')
-- ------------------------------------------------------------
select
  relname                                                        as tabel,
  n_live_tup                                                     as baris,
  pg_size_pretty(pg_total_relation_size(relid))                  as ukuran,
  case when n_live_tup > 0
       then pg_size_pretty((pg_total_relation_size(relid) / n_live_tup)::bigint)
       else '-' end                                              as rata_rata_per_baris
from pg_stat_user_tables
where schemaname = 'public' and n_live_tup > 0
order by (pg_total_relation_size(relid) / greatest(n_live_tup, 1)) desc
limit 20;

-- ------------------------------------------------------------
-- 5. Apakah masih ada base64 tersimpan di tabel proyek?
--    (setiap SELECT proyek akan ikut menariknya)
-- ------------------------------------------------------------
select
  count(*)                                              as proyek_dengan_base64,
  pg_size_pretty(sum(length(metadata ->> 'report_template_base64'))::bigint) as total_ukuran
from public.proyek
where metadata ? 'report_template_base64';

-- Perbaikan (setelah template dipindah ke Storage):
-- update public.proyek
-- set metadata = metadata - 'report_template_base64'
-- where metadata ? 'report_template_base64';

-- ------------------------------------------------------------
-- 6. Tabel yang tumbuh tanpa batas (kandidat retensi/pembersihan)
-- ------------------------------------------------------------
select
  relname                                        as tabel,
  n_live_tup                                     as baris,
  pg_size_pretty(pg_total_relation_size(relid))  as ukuran
from pg_stat_user_tables
where schemaname = 'public'
  and relname ilike any (array['%log%', '%notification%', '%history%', '%event%', '%ping%', '%job%'])
order by pg_total_relation_size(relid) desc;

-- ------------------------------------------------------------
-- 7. Indeks yang hilang pada kolom yang sering difilter klien
--    (mempercepat query → lebih sedikit timeout & retry)
-- ------------------------------------------------------------
select
  t.relname                         as tabel,
  count(i.indexrelid)               as jumlah_index,
  pg_size_pretty(sum(pg_relation_size(i.indexrelid))) as ukuran_index
from pg_class t
join pg_namespace n on n.oid = t.relnamespace
left join pg_index i on i.indrelid = t.oid
where n.nspname = 'public' and t.relkind = 'r'
group by t.relname
having count(i.indexrelid) = 0
order by t.relname;
