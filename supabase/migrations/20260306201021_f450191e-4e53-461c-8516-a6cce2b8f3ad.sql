CREATE TABLE public.app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read app_settings"
ON public.app_settings FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert app_settings"
ON public.app_settings FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update app_settings"
ON public.app_settings FOR UPDATE TO authenticated USING (true) WITH CHECK (true);