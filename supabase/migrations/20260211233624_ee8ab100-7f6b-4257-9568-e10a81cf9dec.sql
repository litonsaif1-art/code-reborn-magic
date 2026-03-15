
-- Blueprint version history table
CREATE TABLE public.blueprint_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  user_id UUID NOT NULL,
  blueprint_content TEXT NOT NULL DEFAULT '',
  blueprint_params JSONB NOT NULL DEFAULT '{}',
  snapshot_label TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for fast lookup
CREATE INDEX idx_blueprint_history_session ON public.blueprint_history (session_id, created_at DESC);
CREATE INDEX idx_blueprint_history_user ON public.blueprint_history (user_id);

-- Enable RLS
ALTER TABLE public.blueprint_history ENABLE ROW LEVEL SECURITY;

-- Users can only see their own history
CREATE POLICY "Users can view their own blueprint history"
  ON public.blueprint_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own blueprint history"
  ON public.blueprint_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own blueprint history"
  ON public.blueprint_history FOR DELETE
  USING (auth.uid() = user_id);
