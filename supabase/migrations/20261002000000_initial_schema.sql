-- RulePilot AI MVP - Initial Database Schema
-- Run this in your Supabase SQL Editor or apply via Supabase CLI.
-- Repository compiles without an active Supabase connection.

-- ---------------------------------------------------------------------------
-- MANUAL SETUP (required once per Supabase project)
-- 1. Enable the Database → Extensions → vector (pgvector) if not auto-created.
-- 2. Run this entire migration in the SQL Editor.
-- 3. Storage → New bucket → name: policies → Private bucket; use signed URLs for previews.
-- 4. Copy Project URL + anon key + service_role key into .env.local (never commit).
-- ---------------------------------------------------------------------------

-- 1. Enable pgvector extension for chunk embeddings and semantic retrieval
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Documents table
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    file_url TEXT,
    storage_path TEXT,
    status TEXT NOT NULL DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'processing', 'processed', 'failed')),
    page_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Document chunks table (for page-aware RAG & citations)
CREATE TABLE IF NOT EXISTS document_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    page_number INTEGER NOT NULL CHECK (page_number >= 1),
    section TEXT,
    content TEXT NOT NULL,
    embedding vector(768), -- Storage contract: choose a supported model with explicit 768-dimensional output
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_document_chunks_doc_id ON document_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_page ON document_chunks(page_number);

-- Optional ANN index for cosine similarity (requires rows with embeddings before heavy use)
-- CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding
--   ON document_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- 4. Extracted Policy Rules table
CREATE TABLE IF NOT EXISTS policy_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    rule_code TEXT NOT NULL,
    rule_name TEXT NOT NULL,
    field_name TEXT NOT NULL,
    operator TEXT NOT NULL CHECK (operator IN ('>', '<', '>=', '<=', '==', '!=')),
    value JSONB NOT NULL,
    action TEXT NOT NULL,
    citation_page INTEGER NOT NULL CHECK (citation_page >= 1),
    citation_section TEXT,
    raw_rule_text TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE (document_id, rule_code)
);

CREATE INDEX IF NOT EXISTS idx_policy_rules_doc_id ON policy_rules(document_id);
CREATE INDEX IF NOT EXISTS idx_policy_rules_code ON policy_rules(rule_code);

-- 5. Workflows table (generated visual workflow structure)
CREATE TABLE IF NOT EXISTS workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    workflow_json JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_workflows_doc_id ON workflows(document_id);

-- 6. Cases table (submitted expense claims / business requests)
CREATE TABLE IF NOT EXISTS cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID REFERENCES workflows(id) ON DELETE SET NULL,
    employee_name TEXT NOT NULL,
    category TEXT NOT NULL,
    amount NUMERIC NOT NULL CHECK (amount >= 0),
    input_json JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'ACTION_REQUIRED', 'REJECTED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_cases_workflow_id ON cases(workflow_id);

-- 7. Case Results table (deterministic rule evaluations + citations + next actions)
CREATE TABLE IF NOT EXISTS case_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    decision TEXT NOT NULL CHECK (decision IN ('APPROVED', 'ACTION_REQUIRED', 'REJECTED')),
    reason TEXT,
    violations_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    evidence_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    action TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_case_results_case_id ON case_results(case_id);

-- 8. Semantic Similarity Search Function (Vector RPC)
CREATE OR REPLACE FUNCTION match_document_chunks (
    query_embedding vector(768),
    match_threshold float,
    match_count int,
    filter_document_id uuid DEFAULT NULL
)
RETURNS TABLE (
    id uuid,
    document_id uuid,
    page_number int,
    section text,
    content text,
    similarity float
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT
        dc.id,
        dc.document_id,
        dc.page_number,
        dc.section,
        dc.content,
        1 - (dc.embedding <=> query_embedding) AS similarity
    FROM document_chunks dc
    WHERE dc.embedding IS NOT NULL
      AND (filter_document_id IS NULL OR dc.document_id = filter_document_id)
      AND 1 - (dc.embedding <=> query_embedding) > match_threshold
    ORDER BY dc.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;
