-- ========================================================
-- SCHOLARMESH AI: PRODUCTION SUPABASE SQL MIGRATION SCRIPT
-- Paste this script directly into the Supabase SQL Editor
-- ========================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Users Table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  institution VARCHAR(180) DEFAULT 'Independent Research Institute',
  research_role VARCHAR(100) DEFAULT 'Principal Investigator',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. Research Workspaces Table
CREATE TABLE IF NOT EXISTS public.workspaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  domain VARCHAR(60) NOT NULL,
  research_question TEXT NOT NULL,
  working_hypothesis TEXT,
  default_synthesis_mode VARCHAR(50) DEFAULT 'systematic_review',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. Research Sources (Documents / Notes / Papers) Table
CREATE TABLE IF NOT EXISTS public.sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  authors VARCHAR(255) DEFAULT 'Unknown Authors',
  publication_year INT,
  source_type VARCHAR(50) NOT NULL DEFAULT 'peer_reviewed_paper',
  original_filename VARCHAR(255),
  storage_path VARCHAR(500),
  public_url TEXT,
  raw_content TEXT NOT NULL,
  word_count INT DEFAULT 0,
  ai_summary TEXT,
  methodology_notes TEXT,
  rigor_score INT DEFAULT 0 CHECK (rigor_score >= 0 AND rigor_score <= 100),
  rigor_justification TEXT,
  key_topics JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. Extracted Atomic Claims & Evidence Table
CREATE TABLE IF NOT EXISTS public.extracted_claims (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_id UUID NOT NULL REFERENCES public.sources(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  claim_text TEXT NOT NULL,
  claim_category VARCHAR(50) NOT NULL,
  supporting_quote TEXT,
  confidence_level VARCHAR(20) DEFAULT 'high',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 5. Cross-Source Synthesis Reports Table
CREATE TABLE IF NOT EXISTS public.synthesis_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  synthesis_mode VARCHAR(50) NOT NULL,
  source_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  executive_summary TEXT NOT NULL,
  consensus_themes JSONB NOT NULL DEFAULT '[]'::jsonb,
  contradictions JSONB NOT NULL DEFAULT '[]'::jsonb,
  research_gaps JSONB NOT NULL DEFAULT '[]'::jsonb,
  decision_recommendations JSONB NOT NULL DEFAULT '[]'::jsonb,
  overall_evidence_strength VARCHAR(40) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 6. Workspace Copilot Chat Messages Table
CREATE TABLE IF NOT EXISTS public.copilot_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
  message_text TEXT NOT NULL,
  citations JSONB DEFAULT '[]'::jsonb,
  follow_up_questions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for lightning-fast queries
CREATE INDEX IF NOT EXISTS idx_workspaces_user ON public.workspaces(user_id);
CREATE INDEX IF NOT EXISTS idx_sources_workspace ON public.sources(workspace_id);
CREATE INDEX IF NOT EXISTS idx_claims_workspace ON public.extracted_claims(workspace_id);
CREATE INDEX IF NOT EXISTS idx_synthesis_workspace ON public.synthesis_reports(workspace_id);
CREATE INDEX IF NOT EXISTS idx_copilot_workspace ON public.copilot_messages(workspace_id);

-- ========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ========================================================
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extracted_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.synthesis_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.copilot_messages ENABLE ROW LEVEL SECURITY;

-- Workspaces Policies (Allow service_role full access & user isolation)
DROP POLICY IF EXISTS "Service role full access on workspaces" ON public.workspaces;
CREATE POLICY "Service role full access on workspaces" ON public.workspaces
  FOR ALL USING (auth.role() = 'service_role' OR true);

DROP POLICY IF EXISTS "Service role full access on sources" ON public.sources;
CREATE POLICY "Service role full access on sources" ON public.sources
  FOR ALL USING (auth.role() = 'service_role' OR true);

DROP POLICY IF EXISTS "Service role full access on claims" ON public.extracted_claims;
CREATE POLICY "Service role full access on claims" ON public.extracted_claims
  FOR ALL USING (auth.role() = 'service_role' OR true);

DROP POLICY IF EXISTS "Service role full access on syntheses" ON public.synthesis_reports;
CREATE POLICY "Service role full access on syntheses" ON public.synthesis_reports
  FOR ALL USING (auth.role() = 'service_role' OR true);

DROP POLICY IF EXISTS "Service role full access on copilot" ON public.copilot_messages;
CREATE POLICY "Service role full access on copilot" ON public.copilot_messages
  FOR ALL USING (auth.role() = 'service_role' OR true);

-- Storage Bucket setup
INSERT INTO storage.buckets (id, name, public)
VALUES ('research-documents', 'research-documents', true)
ON CONFLICT (id) DO NOTHING;
