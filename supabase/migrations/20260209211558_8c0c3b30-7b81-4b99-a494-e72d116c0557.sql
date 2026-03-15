
-- Knowledge Base: stores learned patterns, strategies, high-scoring elements
CREATE TABLE public.creative_knowledge_base (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  knowledge_type TEXT NOT NULL DEFAULT 'pattern',
  category TEXT NOT NULL DEFAULT 'general',
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  source_chain_id UUID REFERENCES public.evolution_chains(id) ON DELETE SET NULL,
  source_score INTEGER DEFAULT 0,
  usage_count INTEGER DEFAULT 0,
  effectiveness_score NUMERIC DEFAULT 0.5,
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.creative_knowledge_base ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access for creative_knowledge_base" ON public.creative_knowledge_base FOR SELECT USING (true);
CREATE POLICY "Public insert access for creative_knowledge_base" ON public.creative_knowledge_base FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access for creative_knowledge_base" ON public.creative_knowledge_base FOR UPDATE USING (true);
CREATE POLICY "Public delete access for creative_knowledge_base" ON public.creative_knowledge_base FOR DELETE USING (true);

-- Indexes for fast lookups
CREATE INDEX idx_knowledge_base_session ON public.creative_knowledge_base(session_id);
CREATE INDEX idx_knowledge_base_type ON public.creative_knowledge_base(knowledge_type);
CREATE INDEX idx_knowledge_base_effectiveness ON public.creative_knowledge_base(effectiveness_score DESC);
CREATE INDEX idx_knowledge_base_tags ON public.creative_knowledge_base USING GIN(tags);

-- Trigger for updated_at
CREATE TRIGGER update_creative_knowledge_base_updated_at
BEFORE UPDATE ON public.creative_knowledge_base
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add parent tracking and quality trajectory to evolution_chains
ALTER TABLE public.evolution_chains 
  ADD COLUMN parent_chain_id UUID REFERENCES public.evolution_chains(id) ON DELETE SET NULL,
  ADD COLUMN parent_variant INTEGER,
  ADD COLUMN quality_trajectory JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN min_quality_floor INTEGER DEFAULT 0,
  ADD COLUMN knowledge_extracted BOOLEAN DEFAULT false;

CREATE INDEX idx_evolution_chains_parent ON public.evolution_chains(parent_chain_id);
CREATE INDEX idx_evolution_chains_session ON public.evolution_chains(session_id);
