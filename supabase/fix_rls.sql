-- RELAX RLS POLICIES FOR DEVELOPMENT/AI AUTO-FILL
ALTER TABLE public.checklist_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.hasil_analisis DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.proyek DISABLE ROW LEVEL SECURITY;

-- Re-enable with more permissive authenticated policies if needed, but for now just disable for AI testing
-- ALTER TABLE public.checklist_items ENABLE ROW LEVEL SECURITY;
-- DROP POLICY IF EXISTS "Authenticated users manage all" ON public.checklist_items;
-- CREATE POLICY "Authenticated users manage all" ON public.checklist_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
