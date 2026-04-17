# SQL Migration Mapping

Dokumen ini memetakan file SQL yang ada di root ke folder `migrations/` dengan format penamaan sekuensial.

## File SQL di Root → Migrations

| No | File Asli (Root) | File Target (Migrations) | Keterangan |
|----|------------------|------------------------|------------|
| 1 | `supabase_schema.sql` | `20240401_01_initial_schema.sql` | Schema dasar |
| 2 | `supabase_chat_tables.sql` | `20240401_02_chat_tables.sql` | Chat system |
| 3 | `supabase_archsim_tables.sql` | `20240401_03_archsim_tables.sql` | Arsitektur & Simulasi |
| 4 | `supabase_lps_tables.sql` | `20240401_04_lps_tables.sql` | Lightning Protection |
| 5 | `supabase_egress_tables.sql` | `20240401_05_egress_tables.sql` | Sistem Evakuasi |
| 6 | `supabase_intensity_tables.sql` | `20240401_06_intensity_tables.sql` | Intensitas Bangunan |
| 7 | `supabase_architectural_tables.sql` | `20240401_07_architectural_tables.sql` | Persyaratan Arsitektur |
| 8 | `supabase_comfort_tables.sql` | `20240401_08_comfort_tables.sql` | Aspek Kenyamanan |
| 9 | `supabase_accessibility_schema.sql` | `20240401_09_accessibility_tables.sql` | Aksesibilitas |
| 10 | `supabase_water_system_schema.sql` | `20240401_10_water_system.sql` | Sistem Air Bersih |
| 11 | `supabase_stormwater_tables.sql` | `20240401_11_stormwater_tables.sql` | Air Hujan |
| 12 | `supabase_wastewater_tables.sql` | `20240401_12_wastewater_tables.sql` | Air Limbah |
| 13 | `supabase_all_tables_final.sql` | `20240401_13_sanitation_tables.sql` | Sanitasi (termasuk di all_tables) |
| 14 | `supabase_environmental_tables.sql` | `20240401_14_environmental_tables.sql` | Dampak Lingkungan |
| 15 | `supabase_disaster_tables.sql` | `20240401_15_disaster_tables.sql` | Mitigasi Bencana |
| 16 | `supabase_fire_protection_tables.sql` | `20240401_16_fire_protection_tables.sql` | Proteksi Kebakaran |
| 17 | `supabase_fire_tables.sql` | `20240401_17_fire_systems.sql` | Fire Systems |
| 18 | `supabase_electrical_tables.sql` | `20240401_18_electrical_tables.sql` | Sistem Kelistrikan |
| 19 | `supabase_memory_tables.sql` | `20240401_19_memory_tables.sql` | AI Memory System |
| 20 | `supabase_evacuation_tables.sql` | `20240401_20_evacuation_tables.sql` | Evakuasi |
| 21 | `supabase_etabs_tables.sql` | `20240401_21_etabs_tables.sql` | ETABS Integration |
| 22 | `supabase_lighting_schema.sql` | `20240401_22_lighting_schema.sql` | Pencahayaan |
| 23 | `supabase_database_comprehensive_fix.sql` | `20240401_23_comprehensive_fix.sql` | Comprehensive Fix |
| 24 | `supabase_hotfix_406_errors.sql` | `20240401_24_hotfix_406_errors.sql` | Fix Error 406 |
| 25 | `supabase_hotfix_environmental_tables.sql` | `20240401_25_hotfix_environmental.sql` | Hotfix Environmental |

## File SQL di Folder `supabase/`

| No | File Asli | File Target | Keterangan |
|----|-----------|-------------|------------|
| 26 | `supabase/supabase_smartai_pipeline_tables.sql` | `20240401_26_smartai_pipeline.sql` | SmartAI Pipeline |

## File SQL Arsip (di `_arsip/sql-hotfix-lama/`)

File-file ini adalah arsip dan tidak perlu dimigrasi ke folder migrations:
- `supabase_hotfix_checklist_items.sql`
- `supabase_update_v14_1.sql`
- `supabase_full_update_v14_1.sql`
- `supabase_full_update_v14_1_fixed.sql`
- `supabase_create_missing_tables.sql`
- `supabase_fix_missing_tables.sql`
- `supabase_fix_missing_tables_v2.sql`
- `supabase_fix_missing_tables_v3.sql`
- `supabase_database_hotfix_v14_2.sql`
- `supabase_rls_security_fix_v14_2.sql`
- `supabase_rls_emergency_fix.sql`
- `supabase_hotfix_fire_project_summary.sql`
- `supabase_hotfix_fire_protection_full.sql`
- `supabase_hotfix_drop_table_and_recreate.sql`
- `supabase_update_checklist_kenyamanan.sql`
- `supabase_fix_missing_columns.sql`

## Cara Migrasi

### Opsi 1: Copy File (Manual)

```powershell
# Contoh untuk file pertama
Copy-Item "supabase_schema.sql" "supabase/migrations/20240401_01_initial_schema.sql"
```

### Opsi 2: PowerShell Script Otomatis

```powershell
# Jalankan script migrasi
./scripts/organize-migrations.ps1
```

## Struktur Akhir

```
supabase/
├── migrations/
│   ├── README.md
│   ├── migration-mapping.md
│   ├── 20240401_01_initial_schema.sql
│   ├── 20240401_02_chat_tables.sql
│   ├── 20240401_03_archsim_tables.sql
│   ├── ... (semua file SQL sekuensial)
│   └── 20240401_26_smartai_pipeline.sql
├── functions/          # Edge Functions
└── config.toml         # Konfigurasi Supabase
```

## Rekomendasi

1. **Backup dahulu** sebelum memindahkan file
2. **Jangan hapus** file asli sampai yakin migrasi berhasil
3. **Update CI/CD** untuk menggunakan folder migrations
4. **Dokumentasikan** dependencies antar migrasi
