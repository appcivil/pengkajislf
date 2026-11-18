-- CI-only bootstrap for the legacy SmartAI schema, installed from the
-- documented SQL setup script rather than a committed migration.
\ir ../supabase_smartai_pipeline_tables.sql

-- Reapply committed SmartAI RLS after the legacy tables and RPC exist.
\ir ../migrations/20261117040000_smartai_tenant_rls.sql
\ir ../migrations/20261117080000_harden_smartai_project_scope_and_rag_rpc.sql
