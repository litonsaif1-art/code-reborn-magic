
-- Create theme_dna table for storing user's permanent Theme DNA selections
CREATE TABLE public.theme_dna (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  dna_string TEXT NOT NULL DEFAULT '',
  selections JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.theme_dna ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own theme_dna" ON public.theme_dna FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own theme_dna" ON public.theme_dna FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own theme_dna" ON public.theme_dna FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own theme_dna" ON public.theme_dna FOR DELETE USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_theme_dna_updated_at
BEFORE UPDATE ON public.theme_dna
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
