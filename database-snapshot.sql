-- ============================================================
-- DATABASE SNAPSHOT — Creative Core Project
-- Version: v2.0
-- Date: 2026-03-15
-- ============================================================
--
-- ⚠️ CRITICAL NOTES (AI অবশ্যই পড়বে):
-- 1. auth.users টেবিলে কোনো foreign key দেবে না — profiles টেবিল ব্যবহার করো
-- 2. used_elements.user_id হলো TEXT, UUID না — cast করতে হবে RLS এ
-- 3. সব RLS policy PERMISSIVE (default) — CREATE POLICY তে explicitly RESTRICTIVE লিখো না
-- 4. blueprint_history.session_id হলো TEXT, UUID না
-- 5. handle_new_user trigger auth.users এ attach হয় — reserved schema modify করো না
-- 6. NEVER use "ALTER DATABASE postgres" — not allowed
-- 7. supabase/config.toml, client.ts, types.ts NEVER edit manually
-- 8. .env ফাইল NEVER edit manually — auto-configured
-- 9. used_elements এ intentionally কোনো UPDATE policy নেই
-- 10. সব column default values মেনে চলো — nullable columns NULL default রাখো
-- ============================================================

-- ============================================================
-- PART A: TABLES (20 tables)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.chat_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT 'New Session',
  blueprint_content TEXT DEFAULT '',
  blueprint_locked BOOLEAN DEFAULT false,
  blueprint_params JSONB DEFAULT '{}',
  provider TEXT DEFAULT 'auto',
  model TEXT DEFAULT 'gemini-2.5-flash',
  pinned BOOLEAN DEFAULT false,
  serial_label TEXT,
  active_variant_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.session_variants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_session_id UUID NOT NULL REFERENCES public.chat_sessions(id),
  user_id UUID NOT NULL,
  variant_label TEXT NOT NULL DEFAULT 'Variant',
  blueprint_content TEXT,
  blueprint_locked BOOLEAN DEFAULT false,
  blueprint_params JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT false,
  pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.chat_sessions(id),
  user_id UUID NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  model TEXT,
  variant_id UUID REFERENCES public.session_variants(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.blueprint_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  session_id TEXT NOT NULL,
  blueprint_content TEXT NOT NULL DEFAULT '',
  blueprint_params JSONB NOT NULL DEFAULT '{}',
  snapshot_label TEXT,
  concept_count INTEGER DEFAULT 0,
  pinned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.saved_blueprints (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  serial_number INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.bookmarked_concepts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  session_id TEXT NOT NULL,
  message_id TEXT NOT NULL,
  concept_content TEXT NOT NULL,
  label TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.concept_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  session_id TEXT NOT NULL,
  concept_text TEXT NOT NULL,
  creativity_score INTEGER NOT NULL,
  coherence_score INTEGER NOT NULL,
  virality_score INTEGER NOT NULL,
  overall_score INTEGER NOT NULL,
  hook_power INTEGER DEFAULT 0,
  emotional_depth INTEGER DEFAULT 0,
  rewatch_value INTEGER DEFAULT 0,
  uniqueness_index INTEGER DEFAULT 0,
  ai_feedback TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.concept_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  session_id TEXT NOT NULL,
  input_theme TEXT,
  draft_concept TEXT,
  final_concept TEXT,
  status TEXT DEFAULT 'pending',
  strictness INTEGER NOT NULL DEFAULT 5,
  passes_used INTEGER DEFAULT 0,
  realism_score INTEGER,
  strategy_mode TEXT,
  visual_lock_enabled BOOLEAN DEFAULT false,
  qc_json JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.evolution_chains (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  session_id TEXT NOT NULL,
  parent_concept TEXT NOT NULL,
  parent_chain_id UUID REFERENCES public.evolution_chains(id),
  parent_variant INTEGER,
  generation INTEGER NOT NULL DEFAULT 1,
  evolved_concepts JSONB NOT NULL DEFAULT '[]',
  scores JSONB NOT NULL DEFAULT '[]',
  best_variant_index INTEGER,
  quality_trajectory JSONB DEFAULT '[]',
  audience_persona TEXT DEFAULT 'global',
  knowledge_extracted BOOLEAN DEFAULT false,
  min_quality_floor INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.creative_knowledge_base (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  session_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  knowledge_type TEXT NOT NULL DEFAULT 'pattern',
  tags TEXT[] DEFAULT '{}',
  source_chain_id UUID REFERENCES public.evolution_chains(id),
  source_score INTEGER DEFAULT 0,
  usage_count INTEGER DEFAULT 0,
  effectiveness_score NUMERIC DEFAULT 0.5,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ai_memory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  memory_type TEXT NOT NULL,
  context TEXT,
  weight NUMERIC NOT NULL DEFAULT 0.5,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  event_type TEXT NOT NULL,
  session_id TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.storyboard_frames (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  session_id TEXT NOT NULL,
  concept_id TEXT NOT NULL,
  frame_number INTEGER NOT NULL,
  scene_description TEXT NOT NULL,
  image_url TEXT,
  prompt_used TEXT,
  generation_status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.theme_dna (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  dna_string TEXT NOT NULL DEFAULT '',
  selections JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ⚠️ NOTE: user_id is TEXT here, not UUID!
CREATE TABLE IF NOT EXISTS public.used_elements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT,
  session_id TEXT NOT NULL,
  element_type TEXT NOT NULL,
  element_value TEXT NOT NULL,
  element_family TEXT,
  source_concept_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.advisor_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  session_id TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.app_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL,
  setting_value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID
);

CREATE TABLE IF NOT EXISTS public.saved_suggestions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  section_key TEXT NOT NULL,
  field_label TEXT NOT NULL,
  suggestions JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.scene_params_defaults (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  params JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- PART B: ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blueprint_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_blueprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarked_concepts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.concept_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.concept_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evolution_chains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creative_knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.storyboard_frames ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.theme_dna ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.used_elements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advisor_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scene_params_defaults ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PART C: RLS POLICIES
-- ============================================================

-- profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own profile" ON public.profiles FOR DELETE USING (auth.uid() = user_id);

-- chat_sessions
CREATE POLICY "Users can view own sessions" ON public.chat_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sessions" ON public.chat_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sessions" ON public.chat_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own sessions" ON public.chat_sessions FOR DELETE USING (auth.uid() = user_id);

-- session_variants
CREATE POLICY "Users can view own variants" ON public.session_variants FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own variants" ON public.session_variants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own variants" ON public.session_variants FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own variants" ON public.session_variants FOR DELETE USING (auth.uid() = user_id);

-- chat_messages
CREATE POLICY "Users can view own messages" ON public.chat_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own messages" ON public.chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own messages" ON public.chat_messages FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own messages" ON public.chat_messages FOR DELETE USING (auth.uid() = user_id);

-- blueprint_history
CREATE POLICY "Users can view their own blueprint history" ON public.blueprint_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own blueprint history" ON public.blueprint_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own blueprint history" ON public.blueprint_history FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own blueprint history" ON public.blueprint_history FOR DELETE USING (auth.uid() = user_id);

-- saved_blueprints
CREATE POLICY "Users can view own blueprints" ON public.saved_blueprints FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own blueprints" ON public.saved_blueprints FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own blueprints" ON public.saved_blueprints FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own blueprints" ON public.saved_blueprints FOR DELETE USING (auth.uid() = user_id);

-- bookmarked_concepts
CREATE POLICY "Users can view their own bookmarks" ON public.bookmarked_concepts FOR SELECT USING ((auth.uid())::text = (user_id)::text);
CREATE POLICY "Users can create their own bookmarks" ON public.bookmarked_concepts FOR INSERT WITH CHECK ((auth.uid())::text = (user_id)::text);
CREATE POLICY "Users can update their own bookmarks" ON public.bookmarked_concepts FOR UPDATE USING ((auth.uid())::text = (user_id)::text);
CREATE POLICY "Users can delete their own bookmarks" ON public.bookmarked_concepts FOR DELETE USING ((auth.uid())::text = (user_id)::text);

-- concept_scores
CREATE POLICY "Users manage own concept_scores" ON public.concept_scores FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- concept_runs
CREATE POLICY "Users manage own concept_runs" ON public.concept_runs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- evolution_chains
CREATE POLICY "Users manage own evolution_chains" ON public.evolution_chains FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- creative_knowledge_base
CREATE POLICY "Users manage own creative_knowledge_base" ON public.creative_knowledge_base FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ai_memory
CREATE POLICY "Users manage own ai_memory" ON public.ai_memory FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- analytics_events
CREATE POLICY "Users manage own analytics_events" ON public.analytics_events FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- storyboard_frames
CREATE POLICY "Users manage own storyboard_frames" ON public.storyboard_frames FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- theme_dna
CREATE POLICY "Users can view own theme_dna" ON public.theme_dna FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own theme_dna" ON public.theme_dna FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own theme_dna" ON public.theme_dna FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own theme_dna" ON public.theme_dna FOR DELETE USING (auth.uid() = user_id);

-- used_elements (⚠️ user_id is TEXT, needs cast; NO UPDATE policy — intentional)
CREATE POLICY "Users can view their own used elements" ON public.used_elements FOR SELECT USING ((auth.uid())::text = user_id);
CREATE POLICY "Users can insert their own used elements" ON public.used_elements FOR INSERT WITH CHECK ((auth.uid())::text = user_id);
CREATE POLICY "Users can delete their own used elements" ON public.used_elements FOR DELETE USING ((auth.uid())::text = user_id);

-- advisor_messages
CREATE POLICY "Users manage own advisor_messages" ON public.advisor_messages FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- app_settings (authenticated users can read; only updater can modify)
CREATE POLICY "Authenticated users can view settings" ON public.app_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert settings" ON public.app_settings FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update own settings" ON public.app_settings FOR UPDATE TO authenticated USING (auth.uid() = updated_by);

-- saved_suggestions
CREATE POLICY "Users manage own saved_suggestions" ON public.saved_suggestions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- scene_params_defaults
CREATE POLICY "Users manage own scene_params_defaults" ON public.scene_params_defaults FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- PART D: FUNCTIONS
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- export_all_data: সব user data JSON এ export
-- (full function in migration — see supabase/migrations/)

-- import_all_data(payload jsonb): JSON থেকে সব data restore
-- (full function in migration — see supabase/migrations/)

-- ============================================================
-- PART E: TRIGGERS
-- ============================================================

-- ⚠️ handle_new_user trigger: এটা auth.users এ attach হয়
-- Lovable Cloud এ migration tool দিয়ে এটা run করতে হবে:
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
--
-- কিন্তু Supabase reserved schema modify করা যায় না migration tool দিয়ে।
-- তাই Lovable AI কে বলতে হবে: "handle_new_user trigger টি auth.users এ attach করো"

-- updated_at triggers (safe to create)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_profiles_updated_at') THEN
    CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_chat_sessions_updated_at') THEN
    CREATE TRIGGER update_chat_sessions_updated_at BEFORE UPDATE ON public.chat_sessions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_saved_blueprints_updated_at') THEN
    CREATE TRIGGER update_saved_blueprints_updated_at BEFORE UPDATE ON public.saved_blueprints FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_theme_dna_updated_at') THEN
    CREATE TRIGGER update_theme_dna_updated_at BEFORE UPDATE ON public.theme_dna FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_storyboard_frames_updated_at') THEN
    CREATE TRIGGER update_storyboard_frames_updated_at BEFORE UPDATE ON public.storyboard_frames FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_creative_knowledge_base_updated_at') THEN
    CREATE TRIGGER update_creative_knowledge_base_updated_at BEFORE UPDATE ON public.creative_knowledge_base FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_ai_memory_updated_at') THEN
    CREATE TRIGGER update_ai_memory_updated_at BEFORE UPDATE ON public.ai_memory FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_session_variants_updated_at') THEN
    CREATE TRIGGER update_session_variants_updated_at BEFORE UPDATE ON public.session_variants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_saved_suggestions_updated_at') THEN
    CREATE TRIGGER update_saved_suggestions_updated_at BEFORE UPDATE ON public.saved_suggestions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- ============================================================
-- PART F: STORAGE BUCKETS
-- ============================================================

-- storyboard-images bucket (public)
INSERT INTO storage.buckets (id, name, public) VALUES ('storyboard-images', 'storyboard-images', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- PART G: REALTIME
-- ============================================================
-- Currently no tables have realtime enabled.
-- To enable: ALTER PUBLICATION supabase_realtime ADD TABLE public.table_name;

-- ============================================================
-- END OF SNAPSHOT v2.0
-- ============================================================
