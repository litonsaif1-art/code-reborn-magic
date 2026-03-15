CREATE TABLE IF NOT EXISTS public.scene_params_defaults (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  params jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.scene_params_defaults ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own scene params"
  ON public.scene_params_defaults FOR SELECT
  TO authenticated
  USING (user_id = auth.uid()::text);

CREATE POLICY "Users can insert own scene params"
  ON public.scene_params_defaults FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can update own scene params"
  ON public.scene_params_defaults FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid()::text);