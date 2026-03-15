
-- Create concept_runs table for QC logging
CREATE TABLE public.concept_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  input_theme TEXT,
  draft_concept TEXT,
  final_concept TEXT,
  qc_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  strictness INTEGER NOT NULL DEFAULT 4,
  strategy_mode TEXT DEFAULT 'auto',
  visual_lock_enabled BOOLEAN DEFAULT true,
  realism_score INTEGER DEFAULT 0,
  passes_used INTEGER DEFAULT 0,
  status TEXT DEFAULT 'PASS'
);

-- Enable RLS
ALTER TABLE public.concept_runs ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users manage own concept_runs"
ON public.concept_runs
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Index for fast lookups
CREATE INDEX idx_concept_runs_user_session ON public.concept_runs (user_id, session_id);
CREATE INDEX idx_concept_runs_created ON public.concept_runs (created_at DESC);
