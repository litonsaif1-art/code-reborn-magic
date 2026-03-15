-- Evolution chains table for storing auto-evolved concept variations
CREATE TABLE public.evolution_chains (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  parent_concept TEXT NOT NULL,
  generation INTEGER NOT NULL DEFAULT 1,
  evolved_concepts JSONB NOT NULL DEFAULT '[]'::jsonb,
  scores JSONB NOT NULL DEFAULT '[]'::jsonb,
  best_variant_index INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.evolution_chains ENABLE ROW LEVEL SECURITY;

-- Public RLS policies (no auth in this project)
CREATE POLICY "Public read access for evolution_chains" 
ON public.evolution_chains 
FOR SELECT 
USING (true);

CREATE POLICY "Public insert access for evolution_chains" 
ON public.evolution_chains 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Public update access for evolution_chains" 
ON public.evolution_chains 
FOR UPDATE 
USING (true);

CREATE POLICY "Public delete access for evolution_chains" 
ON public.evolution_chains 
FOR DELETE 
USING (true);