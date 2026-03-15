
-- Table for Infinite Idea Engine: tracks used elements to prevent repetition
CREATE TABLE public.used_elements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  user_id TEXT,
  element_type TEXT NOT NULL, -- 'hunter', 'prey', 'setting', 'tactic', 'emotion'
  element_value TEXT NOT NULL,
  element_family TEXT, -- family-level grouping e.g. 'পাখি', 'মাছ', 'সরীসৃপ'
  source_concept_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX idx_used_elements_session ON public.used_elements(session_id);
CREATE INDEX idx_used_elements_type ON public.used_elements(element_type);

-- Enable RLS
ALTER TABLE public.used_elements ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own used elements"
ON public.used_elements FOR SELECT
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own used elements"
ON public.used_elements FOR INSERT
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own used elements"
ON public.used_elements FOR DELETE
USING (auth.uid()::text = user_id);

-- Service role can do everything (for edge functions)
CREATE POLICY "Service role full access"
ON public.used_elements FOR ALL
USING (true)
WITH CHECK (true);
