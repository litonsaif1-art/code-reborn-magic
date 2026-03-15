
-- Create saved_suggestions table for permanent suggestion storage
CREATE TABLE public.saved_suggestions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  field_label text NOT NULL,
  section_key text NOT NULL,
  suggestions text[] NOT NULL DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add unique constraint on user_id + field_label + section_key
ALTER TABLE public.saved_suggestions ADD CONSTRAINT saved_suggestions_user_field_section_unique UNIQUE (user_id, field_label, section_key);

-- Enable RLS
ALTER TABLE public.saved_suggestions ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users manage own saved_suggestions" ON public.saved_suggestions
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Updated_at trigger
CREATE TRIGGER update_saved_suggestions_updated_at
  BEFORE UPDATE ON public.saved_suggestions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
