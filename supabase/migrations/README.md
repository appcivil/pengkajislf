# Supabase Database Migrations

## Struktur Folder

Folder ini berisi semua migrasi database untuk aplikasi Pengkajian SLF dengan format penamaan sekuensial.

## Format Penamaan

```
YYYYMMDD_NN_nama_migrasi.sql
```

- `YYYYMMDD`: Tanggal migrasi dibuat
- `NN`: Nomor urut (01, 02, 03, ...)
- `nama_migrasi`: Deskripsi singkat migrasi

## Daftar Migrasi

| File | Deskripsi | Status |
|------|-----------|--------|
| `20240401_01_initial_schema.sql` | Schema dasar dan tabel inti | ✅ Applied |
| `20240401_02_chat_tables.sql` | Tabel untuk chat system | ✅ Applied |
| `20240401_03_archsim_tables.sql` | Tabel arsitektur dan simulasi | ✅ Applied |
| `20240401_04_lps_tables.sql` | Tabel Lightning Protection System | ✅ Applied |
| `20240401_05_egress_tables.sql` | Tabel sistem evakuasi | ✅ Applied |
| `20240401_06_intensity_tables.sql` | Tabel intensitas bangunan | ✅ Applied |
| `20240401_07_architectural_tables.sql` | Tabel persyaratan arsitektur | ✅ Applied |
| `20240401_08_comfort_tables.sql` | Tabel aspek kenyamanan | ✅ Applied |
| `20240401_09_accessibility_tables.sql` | Tabel aksesibilitas | ✅ Applied |
| `20240401_10_water_system.sql` | Tabel sistem air bersih | ✅ Applied |
| `20240401_11_stormwater_tables.sql` | Tabel pengelolaan air hujan | ✅ Applied |
| `20240401_12_wastewater_tables.sql` | Tabel air limbah | ✅ Applied |
| `20240401_13_sanitation_tables.sql` | Tabel sanitasi | ✅ Applied |
| `20240401_14_environmental_tables.sql` | Tabel dampak lingkungan | ✅ Applied |
| `20240401_15_disaster_tables.sql` | Tabel mitigasi bencana | ✅ Applied |
| `20240401_16_fire_protection_tables.sql` | Tabel proteksi kebakaran | ✅ Applied |
| `20240401_17_electrical_tables.sql` | Tabel sistem kelistrikan | ✅ Applied |
| `20240401_18_memory_tables.sql` | Tabel AI memory system | ✅ Applied |
| `20240401_19_database_comprehensive_fix.sql` | Hotfix komprehensif | ✅ Applied |
| `20240401_20_hotfix_406_errors.sql` | Fix error 406 | ✅ Applied |
| `20240401_21_hotfix_environmental.sql` | Hotfix tabel environmental | ✅ Applied |
| `20240401_22_etabs_tables.sql` | Tabel ETABS integration | ✅ Applied |
| `20240401_23_evacuation_tables.sql` | Tabel evakuasi | ✅ Applied |
| `20240401_24_fire_tables.sql` | Tabel fire systems | ✅ Applied |
| `20240401_25_lighting_schema.sql` | Schema pencahayaan | ✅ Applied |

## Cara Menjalankan Migrasi

### Via Supabase CLI:

```bash
# Push semua migrasi yang belum dijalankan
supabase db push

# Reset database dan jalankan ulang semua migrasi
supabase db reset
```

### Via SQL Editor (Manual):

1. Buka Supabase Dashboard > SQL Editor
2. Copy-paste isi file migrasi
3. Jalankan per query atau batch

## Best Practices

1. **Selalu buat migrasi baru** untuk perubahan schema, jangan edit migrasi yang sudah dijalankan
2. **Test migrasi** di environment staging sebelum production
3. **Backup database** sebelum menjalankan migrasi di production
4. **Sertakan rollback script** jika migrasi kompleks
5. **Gunakan transactions** untuk operasi yang atomic

## Troubleshooting

### Error 406 (Not Acceptable)

Biasanya terjadi karena:
- RLS (Row Level Security) policy blocking
- Missing column atau type mismatch
- Constraint violation

Solution: Jalankan `hotfix_406_errors.sql`

### Memory Issues

Jika migrasi besar menyebabkan timeout:
- Split ke multiple migrasi lebih kecil
- Jalankan di waktu low-traffic
- Gunakan connection pooling

## Referensi

- [Supabase Migrations Docs](https://supabase.com/docs/guides/database/migrations)
- [PostgreSQL Migration Best Practices](https://www.postgresql.org/docs/current/migration.html)
