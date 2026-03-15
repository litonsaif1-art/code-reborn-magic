
-- Create session_variants table
CREATE TABLE public.session_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_session_id uuid NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  variant_label text NOT NULL DEFAULT 'A',
  blueprint_content text DEFAULT '',
  blueprint_params jsonb DEFAULT '{}'::jsonb,
  blueprint_locked boolean DEFAULT false,
  pinned boolean DEFAULT false,
  is_active boolean DEFAULT false,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.session_variants ENABLE ROW LEVEL SECURITY;

-- RLS policy
CREATE POLICY "Users manage own session_variants" ON public.session_variants
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add variant_id to chat_messages (nullable - null means original session messages)
ALTER TABLE public.chat_messages ADD COLUMN variant_id uuid REFERENCES public.session_variants(id) ON DELETE CASCADE;

-- Add active_variant_id to chat_sessions (no FK to avoid circular dependency)
ALTER TABLE public.chat_sessions ADD COLUMN active_variant_id uuid;

-- Updated_at trigger for session_variants
CREATE TRIGGER update_session_variants_updated_at
  BEFORE UPDATE ON public.session_variants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
