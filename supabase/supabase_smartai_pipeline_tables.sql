-- ============================================================================
-- SmartAI Pipeline Tables
-- SQL Migration untuk tabel-tabel pipeline SmartAI
-- ============================================================================

-- Aktifkan extension pgvector untuk embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- 1. Tabel untuk tracking jobs
CREATE TABLE IF NOT EXISTS smartai_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(50) NOT NULL, -- document, image, cad, web, rag, query
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed, cancelled
    progress INTEGER DEFAULT 0, -- 0-100
    
    -- Input metadata
    input_metadata JSONB DEFAULT '{}',
    
    -- Results
    result JSONB,
    error JSONB,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- User & Project context
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    project_id UUID, -- References projects table if exists
    
    -- Queue management
    priority VARCHAR(20) DEFAULT 'normal', -- high, normal, low
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    tags TEXT[] DEFAULT '{}',
    
    -- Performance metrics
    processing_time_ms INTEGER,
    
    -- Soft delete
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Indexes untuk smartai_jobs
CREATE INDEX IF NOT EXISTS idx_smartai_jobs_status ON smartai_jobs(status);
CREATE INDEX IF NOT EXISTS idx_smartai_jobs_type ON smartai_jobs(type);
CREATE INDEX IF NOT EXISTS idx_smartai_jobs_user_id ON smartai_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_smartai_jobs_project_id ON smartai_jobs(project_id);
CREATE INDEX IF NOT EXISTS idx_smartai_jobs_created_at ON smartai_jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_smartai_jobs_priority ON smartai_jobs(priority, created_at);

-- 2. Tabel untuk dokumen yang diproses
CREATE TABLE IF NOT EXISTS smartai_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES smartai_jobs(id) ON DELETE CASCADE,
    
    -- File info
    file_name VARCHAR(500),
    file_type VARCHAR(50),
    file_size INTEGER,
    
    -- Google Drive reference
    google_drive_id VARCHAR(255),
    drive_folder_id VARCHAR(255),
    
    -- Extracted content
    extracted_text TEXT,
    structure JSONB DEFAULT '[]',
    tables JSONB DEFAULT '[]',
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- User & Project context
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    project_id UUID
);

-- Indexes untuk smartai_documents
CREATE INDEX IF NOT EXISTS idx_smartai_documents_job_id ON smartai_documents(job_id);
CREATE INDEX IF NOT EXISTS idx_smartai_documents_user_id ON smartai_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_smartai_documents_project_id ON smartai_documents(project_id);
CREATE INDEX IF NOT EXISTS idx_smartai_documents_file_type ON smartai_documents(file_type);

-- 3. Tabel untuk chunks (RAG)
CREATE TABLE IF NOT EXISTS smartai_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES smartai_documents(id) ON DELETE CASCADE,
    
    -- Chunk info
    chunk_index INTEGER NOT NULL,
    text TEXT NOT NULL,
    
    -- Embedding vector (gunakan pgvector)
    embedding VECTOR(384), -- Untuk MiniLM atau USE
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    -- Character positions dalam dokumen
    char_start INTEGER,
    char_end INTEGER,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes untuk smartai_chunks
CREATE INDEX IF NOT EXISTS idx_smartai_chunks_document_id ON smartai_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_smartai_chunks_chunk_index ON smartai_chunks(document_id, chunk_index);

-- Index untuk vector similarity search (pgvector)
CREATE INDEX IF NOT EXISTS idx_smartai_chunks_embedding 
ON smartai_chunks 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- 4. Tabel untuk embeddings cache
CREATE TABLE IF NOT EXISTS smartai_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    text_hash VARCHAR(64) UNIQUE NOT NULL, -- SHA256 hash dari teks
    text_preview VARCHAR(200),
    
    -- Embedding
    embedding VECTOR(384),
    
    -- Model info
    model_name VARCHAR(100) DEFAULT 'universal-sentence-encoder',
    model_version VARCHAR(50),
    
    -- Usage stats
    usage_count INTEGER DEFAULT 1,
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Expiration untuk cache cleanup
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '30 days'
);

-- Indexes untuk smartai_embeddings
CREATE INDEX IF NOT EXISTS idx_smartai_embeddings_hash ON smartai_embeddings(text_hash);
CREATE INDEX IF NOT EXISTS idx_smartai_embeddings_expires ON smartai_embeddings(expires_at);
CREATE INDEX IF NOT EXISTS idx_smartai_embeddings_embedding 
ON smartai_embeddings 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- 5. Tabel untuk cache entries
CREATE TABLE IF NOT EXISTS smartai_cache (
    key VARCHAR(255) PRIMARY KEY,
    data JSONB NOT NULL,
    tag VARCHAR(100) DEFAULT 'general',
    
    -- User context (null untuk global cache)
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Access stats
    access_count INTEGER DEFAULT 1,
    last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes untuk smartai_cache
CREATE INDEX IF NOT EXISTS idx_smartai_cache_tag ON smartai_cache(tag);
CREATE INDEX IF NOT EXISTS idx_smartai_cache_user_id ON smartai_cache(user_id);
CREATE INDEX IF NOT EXISTS idx_smartai_cache_expires ON smartai_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_smartai_cache_key_user ON smartai_cache(key, user_id);

-- 6. Tabel untuk logging
CREATE TABLE IF NOT EXISTS smartai_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    level VARCHAR(20) NOT NULL, -- info, warn, error, debug
    message TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    
    -- Context
    job_id UUID REFERENCES smartai_jobs(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Source
    source VARCHAR(100), -- engine name, component name
    function_name VARCHAR(200),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes untuk smartai_logs
CREATE INDEX IF NOT EXISTS idx_smartai_logs_level ON smartai_logs(level);
CREATE INDEX IF NOT EXISTS idx_smartai_logs_job_id ON smartai_logs(job_id);
CREATE INDEX IF NOT EXISTS idx_smartai_logs_user_id ON smartai_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_smartai_logs_created_at ON smartai_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_smartai_logs_level_created ON smartai_logs(level, created_at DESC);

-- ============================================================================
-- Functions
-- ============================================================================

-- Function untuk vector similarity search
CREATE OR REPLACE FUNCTION match_documents(
    query_embedding VECTOR(384),
    match_threshold FLOAT,
    match_count INTEGER,
    filter_document_ids UUID[] DEFAULT NULL
)
RETURNS TABLE(
    id UUID,
    document_id UUID,
    chunk_index INTEGER,
    text TEXT,
    metadata JSONB,
    similarity FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.id,
        c.document_id,
        c.chunk_index,
        c.text,
        c.metadata,
        1 - (c.embedding <=> query_embedding) AS similarity
    FROM smartai_chunks c
    WHERE 
        1 - (c.embedding <=> query_embedding) > match_threshold
        AND (filter_document_ids IS NULL OR c.document_id = ANY(filter_document_ids))
    ORDER BY c.embedding <=> query_embedding
    LIMIT match_count;
END;
$$ LANGUAGE plpgsql;

-- Function untuk update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers untuk update timestamp
CREATE TRIGGER update_smartai_jobs_updated_at
    BEFORE UPDATE ON smartai_jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_smartai_documents_updated_at
    BEFORE UPDATE ON smartai_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- RLS Policies (Row Level Security)
-- ============================================================================

-- Enable RLS
ALTER TABLE smartai_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE smartai_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE smartai_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE smartai_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE smartai_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE smartai_logs ENABLE ROW LEVEL SECURITY;

-- Policies untuk smartai_jobs
CREATE POLICY "Users can view their own jobs"
    ON smartai_jobs FOR SELECT
    USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users can create their own jobs"
    ON smartai_jobs FOR INSERT
    WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users can update their own jobs"
    ON smartai_jobs FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own jobs"
    ON smartai_jobs FOR DELETE
    USING (user_id = auth.uid());

-- Policies untuk smartai_documents (same as jobs)
CREATE POLICY "Users can view their own documents"
    ON smartai_documents FOR SELECT
    USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users can create their own documents"
    ON smartai_documents FOR INSERT
    WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

-- Policies untuk smartai_cache
CREATE POLICY "Users can view their own cache or global cache"
    ON smartai_cache FOR SELECT
    USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users can create their own cache"
    ON smartai_cache FOR INSERT
    WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

-- ============================================================================
-- Cleanup Function
-- ============================================================================

-- Function untuk cleanup expired cache dan old logs
CREATE OR REPLACE FUNCTION smartai_cleanup()
RETURNS INTEGER AS $$
DECLARE
    deleted_cache INTEGER;
    deleted_embeddings INTEGER;
    deleted_logs INTEGER;
BEGIN
    -- Delete expired cache
    DELETE FROM smartai_cache WHERE expires_at < NOW();
    GET DIAGNOSTICS deleted_cache = ROW_COUNT;
    
    -- Delete expired embeddings
    DELETE FROM smartai_embeddings WHERE expires_at < NOW();
    GET DIAGNOSTICS deleted_embeddings = ROW_COUNT;
    
    -- Delete old logs (older than 30 days)
    DELETE FROM smartai_logs WHERE created_at < NOW() - INTERVAL '30 days';
    GET DIAGNOSTICS deleted_logs = ROW_COUNT;
    
    RETURN deleted_cache + deleted_embeddings + deleted_logs;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE smartai_jobs IS 'Tracking table untuk semua jobs pipeline SmartAI';
COMMENT ON TABLE smartai_documents IS 'Metadata dan extracted content dari dokumen';
COMMENT ON TABLE smartai_chunks IS 'RAG chunks dengan embeddings';
COMMENT ON TABLE smartai_embeddings IS 'Cache untuk embeddings untuk mengurangi API calls';
COMMENT ON TABLE smartai_cache IS 'General cache untuk hasil pemrosesan';
COMMENT ON TABLE smartai_logs IS 'Audit logs untuk pipeline SmartAI';
