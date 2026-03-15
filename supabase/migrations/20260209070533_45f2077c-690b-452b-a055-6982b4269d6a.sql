-- AI Memory System টেবিল
CREATE TABLE public.ai_memory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  memory_type TEXT NOT NULL CHECK (memory_type IN ('preference', 'pattern', 'feedback', 'style')),
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  weight DECIMAL(3,2) NOT NULL DEFAULT 0.5 CHECK (weight >= 0.0 AND weight <= 1.0),
  context TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Concept Scores টেবিল
CREATE TABLE public.concept_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  concept_text TEXT NOT NULL,
  creativity_score INTEGER NOT NULL CHECK (creativity_score >= 0 AND creativity_score <= 100),
  coherence_score INTEGER NOT NULL CHECK (coherence_score >= 0 AND coherence_score <= 100),
  virality_score INTEGER NOT NULL CHECK (virality_score >= 0 AND virality_score <= 100),
  overall_score INTEGER NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
  ai_feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS Enable করুন (পাবলিক অ্যাক্সেস)
ALTER TABLE public.ai_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.concept_scores ENABLE ROW LEVEL SECURITY;

-- পাবলিক পলিসি - ai_memory
CREATE POLICY "Public read access for ai_memory" 
ON public.ai_memory 
FOR SELECT 
USING (true);

CREATE POLICY "Public insert access for ai_memory" 
ON public.ai_memory 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Public update access for ai_memory" 
ON public.ai_memory 
FOR UPDATE 
USING (true);

CREATE POLICY "Public delete access for ai_memory" 
ON public.ai_memory 
FOR DELETE 
USING (true);

-- পাবলিক পলিসি - concept_scores
CREATE POLICY "Public read access for concept_scores" 
ON public.concept_scores 
FOR SELECT 
USING (true);

CREATE POLICY "Public insert access for concept_scores" 
ON public.concept_scores 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Public update access for concept_scores" 
ON public.concept_scores 
FOR UPDATE 
USING (true);

CREATE POLICY "Public delete access for concept_scores" 
ON public.concept_scores 
FOR DELETE 
USING (true);

-- updated_at ট্রিগার ফাংশন
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ai_memory-এ ট্রিগার
CREATE TRIGGER update_ai_memory_updated_at
BEFORE UPDATE ON public.ai_memory
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- ইনডেক্স
CREATE INDEX idx_ai_memory_type ON public.ai_memory(memory_type);
CREATE INDEX idx_ai_memory_key ON public.ai_memory(key);
CREATE INDEX idx_concept_scores_session ON public.concept_scores(session_id);
CREATE INDEX idx_concept_scores_created ON public.concept_scores(created_at DESC);