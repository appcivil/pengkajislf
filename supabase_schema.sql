-- ============================================================
--  SMART AI PENGKAJI SLF - SUPABASE DATABASE SETUP
--  Versi: v14.0
--  Jalankan seluruh script ini di Supabase SQL Editor
-- ============================================================

-- Extensions (pastikan tersedia)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ===========================================================
-- TABEL 1: proyek
-- Menyimpan data induk proyek pengkajian SLF
-- ===========================================================
CREATE TABLE IF NOT EXISTS public.proyek (
  id               uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_by       uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  nama_bangunan    text NOT NULL,
  jenis_bangunan   text,
  jenis_konstruksi text,
  fungsi_bangunan  text,
  alamat           text,
  kecamatan        text,
  kelurahan        text,
  kota             text,
  provinsi         text,
  latitude         double precision,
  longitude        double precision,
  luas_bangunan    numeric,
  luas_lahan       numeric,
  jumlah_lantai    integer,
  tahun_dibangun   integer,
  nomor_pbg        text,
  pemilik          text,
  penanggung_jawab text,
  telepon          text,
  email_pemilik    text,
  kondisi_umum     text,
  catatan          text,
  status_slf       text DEFAULT 'DALAM_PENGKAJIAN' CHECK (status_slf IN (
                     'DALAM_PENGKAJIAN','LAIK_FUNGSI','LAIK_FUNGSI_BERSYARAT','TIDAK_LAIK_FUNGSI'
                   )),
  tanggal_mulai    date,
  tanggal_target   date,
  progress         integer DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  
  -- SIMBG Step 1: Intensitas Teknis
  gsb              numeric,
  kdb              numeric,
  klb              numeric,
  kdh              numeric,
  simbg_id         text,
  simbg_email      text,
  simbg_password   text,

  -- SIMBG Step 2: Detail Data Tanah
  jenis_dokumen_tanah  text,
  no_dokumen_tanah     text,
  tgl_terbit_tanah     date,
  hak_kepemilikan      text,
  nama_pemilik_tanah   text,
  tanah_provinsi       text,
  tanah_kota           text,
  tanah_kecamatan      text,
  tanah_kelurahan      text,
  alamat_tanah_lengkap text,
  pemilik_tanah_sama   boolean DEFAULT true,
  no_surat_perjanjian  text,
  tgl_surat_perjanjian date,
  penerima_perjanjian  text,

  updated_at       timestamptz DEFAULT now(),
  created_at       timestamptz DEFAULT now()
);

-- ===========================================================
-- TABEL: proyek_files
-- Menyimpan metadata berkas proyek dari Supabase/Drive
-- ===========================================================
CREATE TABLE IF NOT EXISTS public.proyek_files (
  id           uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  proyek_id    uuid REFERENCES public.proyek(id) ON DELETE CASCADE,
  name         text NOT NULL,
  file_url     text NOT NULL,
  category     text,
  subcategory  text,
  storage_type text DEFAULT 'supabase',
  source       text DEFAULT 'manual',
  created_at   timestamptz DEFAULT now()
);

-- RLS Policies - proyek_files
ALTER TABLE public.proyek_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage all proyek files" ON public.proyek_files FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- RLS Policies - proyek
ALTER TABLE public.proyek ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage all projects"
  ON public.proyek FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Index
CREATE INDEX IF NOT EXISTS idx_proyek_created_by ON public.proyek(created_by);
CREATE INDEX IF NOT EXISTS idx_proyek_status_slf ON public.proyek(status_slf);


-- ===========================================================
-- TABEL 2: checklist_items
-- Menyimpan poin-poin checklist pemeriksaan SLF per proyek
-- ===========================================================
CREATE TABLE IF NOT EXISTS public.checklist_items (
  id          uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  proyek_id   uuid NOT NULL REFERENCES public.proyek(id) ON DELETE CASCADE,
  kode        text NOT NULL,
  nama        text NOT NULL,
  aspek       text,
  kategori    text DEFAULT 'teknis',
  sub_kategori text,
  status      text,
  catatan     text,
  foto_urls   jsonb DEFAULT '[]',
  evidence_links jsonb DEFAULT '[]',
  nilai       numeric,
  bobot       numeric,
  is_wajib    boolean DEFAULT false,
  source      text DEFAULT 'manual',
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now(),
  UNIQUE (proyek_id, kode)
);

-- RLS Policies - checklist_items
ALTER TABLE public.checklist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage all checklist items"
  ON public.checklist_items FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Index
CREATE INDEX IF NOT EXISTS idx_checklist_proyek ON public.checklist_items(proyek_id);
CREATE INDEX IF NOT EXISTS idx_checklist_kode ON public.checklist_items(kode);


-- ===========================================================
-- TABEL 3: hasil_analisis
-- Menyimpan skor dan hasil analisis AI per proyek
-- ===========================================================
CREATE TABLE IF NOT EXISTS public.hasil_analisis (
  id                  uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  proyek_id           uuid NOT NULL REFERENCES public.proyek(id) ON DELETE CASCADE,
  skor_administrasi   numeric DEFAULT 0,
  skor_struktur       numeric DEFAULT 0,
  skor_arsitektur     numeric DEFAULT 0,
  skor_mep            numeric DEFAULT 0,
  skor_kebakaran      numeric DEFAULT 0,
  skor_kesehatan      numeric DEFAULT 0,
  skor_kenyamanan     numeric DEFAULT 0,
  skor_kemudahan      numeric DEFAULT 0,
  skor_total          numeric DEFAULT 0,
  status_slf          text CHECK (status_slf IN (
                        'DALAM_PENGKAJIAN','LAIK_FUNGSI','LAIK_FUNGSI_BERSYARAT','TIDAK_LAIK_FUNGSI'
                      )),
  risk_level          text CHECK (risk_level IN ('low','medium','high','critical')),
  rekomendasi         jsonb DEFAULT '[]',
  narasi_teknis       text,
  metadata            jsonb DEFAULT '{}',
  ai_provider         text DEFAULT 'Rule-Based',
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

-- RLS Policies - hasil_analisis
ALTER TABLE public.hasil_analisis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage all hasil analisis"
  ON public.hasil_analisis FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Index
CREATE INDEX IF NOT EXISTS idx_hasil_proyek ON public.hasil_analisis(proyek_id);


-- ===========================================================
-- TABEL 4: proyek_files
-- Menyimpan file-file lampiran yang diunggah per proyek
-- ===========================================================
CREATE TABLE IF NOT EXISTS public.proyek_files (
  id          uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  proyek_id   uuid NOT NULL REFERENCES public.proyek(id) ON DELETE CASCADE,
  name        text NOT NULL,
  file_url    text,
  drive_link  text,
  category    text DEFAULT 'umum',
  subcategory text,
  ai_status   text DEFAULT 'pending' CHECK (ai_status IN ('pending','processing','ready','error')),
  source      text DEFAULT 'local',
  created_at  timestamptz DEFAULT now()
);

-- RLS Policies - proyek_files
ALTER TABLE public.proyek_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage all proyek files"
  ON public.proyek_files FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Index
CREATE INDEX IF NOT EXISTS idx_files_proyek ON public.proyek_files(proyek_id);


-- ===========================================================
-- TABEL 5: todo_tasks
-- Menyimpan task dan manajemen pekerjaan TODO Board
-- ===========================================================
CREATE TABLE IF NOT EXISTS public.todo_tasks (
  id          uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  proyek_id   uuid REFERENCES public.proyek(id) ON DELETE SET NULL,
  proyek_nama text,
  judul       text,
  title       text,
  priority    text DEFAULT 'medium' CHECK (priority IN ('low','medium','high','critical')),
  status      text DEFAULT 'todo' CHECK (status IN ('todo','in_progress','review','done')),
  due_date    date,
  catatan     text,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- RLS Policies - todo_tasks
ALTER TABLE public.todo_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage all todo tasks"
  ON public.todo_tasks FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Index
CREATE INDEX IF NOT EXISTS idx_todo_user ON public.todo_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_todo_status ON public.todo_tasks(status);


-- ===========================================================
-- TABEL 6: notifications (Real-Time Notifications)
-- Menyimpan notifikasi per pengguna
-- ===========================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id          uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       text NOT NULL,
  message     text,
  type        text DEFAULT 'info' CHECK (type IN ('info','success','warning','alert','error')),
  is_read     boolean DEFAULT false,
  link        text,
  created_at  timestamptz DEFAULT timezone('utc'::text, now())
);

-- RLS Policies - notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Index
CREATE INDEX IF NOT EXISTS idx_notif_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notif_read ON public.notifications(user_id, is_read);

-- Aktifkan Real-Time untuk tabel notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;


-- ===========================================================
-- USER PROFILES (Opsional - diperlukan untuk full_name & avatar)
-- Menyimpan data profil pengguna yang terasosiasi auth.users
-- ===========================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   text,
  avatar_url  text,
  role        text DEFAULT 'pengkaji',
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Trigger: Auto-create profile saat user baru mendaftar
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- ===========================================================
-- TABEL: settings (Global Configuration)
-- ===========================================================
CREATE TABLE IF NOT EXISTS public.settings (
  id          UUID PRIMARY KEY DEFAULT '00000000-0000-0000-0000-000000000000',
  data        JSONB NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now(),
  created_by  UUID REFERENCES auth.users(id)
);

-- Kebijakan RLS Global
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view settings" ON public.settings;
CREATE POLICY "Public can view settings"
  ON public.settings FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can maintain settings" ON public.settings;
CREATE POLICY "Authenticated users can maintain settings"
  ON public.settings FOR ALL
  USING (true)
  WITH CHECK (true);

-- Trigger updated_at
CREATE OR REPLACE TRIGGER trg_settings_updated_at
  BEFORE UPDATE ON public.settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ===========================================================
-- FUNCTION: Update Timestamp otomatis
-- ===========================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Terapkan trigger updated_at ke tabel yang relevan
CREATE OR REPLACE TRIGGER trg_proyek_updated_at
  BEFORE UPDATE ON public.proyek
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER trg_checklist_updated_at
  BEFORE UPDATE ON public.checklist_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER trg_hasil_analisis_updated_at
  BEFORE UPDATE ON public.hasil_analisis
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER trg_todo_updated_at
  BEFORE UPDATE ON public.todo_tasks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ===========================================================
-- TABEL: hasil_simulasi (Fitur Simulasi Engineering per Proyek)
-- Menyimpan hasil simulasi pencahayaan, ventilasi, evakuasi, NDT
-- ===========================================================
CREATE TABLE IF NOT EXISTS public.hasil_simulasi (
  id              uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  proyek_id       uuid NOT NULL REFERENCES public.proyek(id) ON DELETE CASCADE,
  created_by      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Jenis Simulasi
  tipe_simulasi   text NOT NULL CHECK (tipe_simulasi IN (
    'pencahayaan', 'ventilasi', 'evakuasi', 'ndt_rebound', 'ndt_upv'
  )),
  
  -- Input Parameters (JSON)
  input_params    jsonb NOT NULL DEFAULT '{}',
  
  -- Hasil Simulasi (JSON)
  hasil           jsonb NOT NULL DEFAULT '{}',
  
  -- Summary Metrics
  skor_kelayakan  integer,  -- 0-100
  status          text DEFAULT 'draft' CHECK (status IN ('draft', 'final', 'archived')),
  
  -- Compliance & Rekomendasi
  compliance      jsonb DEFAULT '{}',
  rekomendasi     text[],
  
  -- Metadata
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- RLS Policies - hasil_simulasi
ALTER TABLE public.hasil_simulasi ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage simulasi for their projects"
  ON public.hasil_simulasi FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Index untuk hasil_simulasi
CREATE INDEX IF NOT EXISTS idx_simulasi_proyek ON public.hasil_simulasi(proyek_id);
CREATE INDEX IF NOT EXISTS idx_simulasi_tipe ON public.hasil_simulasi(tipe_simulasi);
CREATE INDEX IF NOT EXISTS idx_simulasi_status ON public.hasil_simulasi(status);

-- Trigger updated_at
CREATE OR REPLACE TRIGGER trg_hasil_simulasi_updated_at
  BEFORE UPDATE ON public.hasil_simulasi
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ===========================================================
-- VIEW: simulasi_summary (Aggregated view per proyek)
-- ===========================================================
CREATE OR REPLACE VIEW public.simulasi_summary AS
SELECT 
  proyek_id,
  COUNT(*) as total_simulasi,
  COUNT(*) FILTER (WHERE tipe_simulasi = 'pencahayaan') as sim_pencahayaan,
  COUNT(*) FILTER (WHERE tipe_simulasi = 'ventilasi') as sim_ventilasi,
  COUNT(*) FILTER (WHERE tipe_simulasi = 'evakuasi') as sim_evakuasi,
  COUNT(*) FILTER (WHERE tipe_simulasi IN ('ndt_rebound', 'ndt_upv')) as sim_ndt,
  AVG(skor_kelayakan) as avg_skor_kelayakan,
  MAX(created_at) as last_simulasi_at
FROM public.hasil_simulasi
GROUP BY proyek_id;

-- ===========================================================
-- TABEL: field_test_data - Data pengujian lapangan (Excel, PDF, CSV, CAD)
-- ===========================================================
CREATE TABLE IF NOT EXISTS public.field_test_data (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  proyek_id uuid NOT NULL REFERENCES public.proyek(id) ON DELETE CASCADE,
  tipe_pengujian text NOT NULL CHECK (tipe_pengujian IN ('pencahayaan', 'ventilasi', 'evakuasi', 'ndt_rebound', 'ndt_upv', 'unknown')),
  source_filename text NOT NULL,
  source_format text NOT NULL CHECK (source_format IN ('excel', 'csv', 'pdf', 'dwg', 'rvt', 'unknown')),
  raw_data jsonb NOT NULL DEFAULT '{}',
  parsed_params jsonb DEFAULT '{}',
  storage_url text,
  storage_path text,
  imported_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  imported_at timestamptz DEFAULT now(),
  notes text,
  linked_simulasi_id uuid REFERENCES public.hasil_simulasi(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE public.field_test_data ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access their own project field data
CREATE POLICY "Field data access policy" ON public.field_test_data
  FOR ALL USING (
    auth.uid() IN (
      SELECT created_by FROM public.proyek WHERE id = proyek_id
    ) OR auth.uid() IN (
      SELECT user_id FROM public.proyek_access WHERE proyek_id = proyek_id
    )
  );

-- Index untuk pencarian cepat
CREATE INDEX IF NOT EXISTS idx_field_test_proyek ON public.field_test_data(proyek_id);
CREATE INDEX IF NOT EXISTS idx_field_test_tipe ON public.field_test_data(tipe_pengujian);
CREATE INDEX IF NOT EXISTS idx_field_test_imported_at ON public.field_test_data(imported_at);

-- View untuk summary field data per proyek
CREATE OR REPLACE VIEW public.field_test_summary AS
SELECT 
  proyek_id,
  COUNT(*) as total_imports,
  COUNT(*) FILTER (WHERE tipe_pengujian = 'pencahayaan') as import_pencahayaan,
  COUNT(*) FILTER (WHERE tipe_pengujian = 'ventilasi') as import_ventilasi,
  COUNT(*) FILTER (WHERE tipe_pengujian = 'evakuasi') as import_evakuasi,
  COUNT(*) FILTER (WHERE tipe_pengujian IN ('ndt_rebound', 'ndt_upv')) as import_ndt,
  array_agg(DISTINCT source_format) as available_formats,
  MAX(imported_at) as last_import_at
FROM public.field_test_data
GROUP BY proyek_id;

-- ===========================================================
-- SELESAI: Semua tabel berhasil disiapkan!
-- ===========================================================
