
-- Add 7D scoring columns to concept_scores
ALTER TABLE public.concept_scores
  ADD COLUMN hook_power INTEGER DEFAULT 0,
  ADD COLUMN emotional_depth INTEGER DEFAULT 0,
  ADD COLUMN uniqueness_index INTEGER DEFAULT 0,
  ADD COLUMN rewatch_value INTEGER DEFAULT 0;

-- Add anti-patterns tracking to knowledge base (already exists, just add index)
CREATE INDEX IF NOT EXISTS idx_knowledge_base_category ON public.creative_knowledge_base(category);

-- Add audience_persona to evolution_chains
ALTER TABLE public.evolution_chains
  ADD COLUMN audience_persona TEXT DEFAULT 'global';
