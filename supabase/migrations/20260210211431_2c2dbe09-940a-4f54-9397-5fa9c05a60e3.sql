
-- 1. Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Chat sessions table
CREATE TABLE public.chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'New Session',
  model TEXT DEFAULT 'gemini-2.5-flash',
  provider TEXT DEFAULT 'auto',
  blueprint_content TEXT DEFAULT '',
  blueprint_locked BOOLEAN DEFAULT false,
  blueprint_params JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions" ON public.chat_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sessions" ON public.chat_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sessions" ON public.chat_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own sessions" ON public.chat_sessions FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_chat_sessions_updated_at BEFORE UPDATE ON public.chat_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Chat messages table
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  model TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own messages" ON public.chat_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own messages" ON public.chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own messages" ON public.chat_messages FOR DELETE USING (auth.uid() = user_id);

-- 4. Saved blueprints library
CREATE TABLE public.saved_blueprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  serial_number INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.saved_blueprints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own blueprints" ON public.saved_blueprints FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own blueprints" ON public.saved_blueprints FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own blueprints" ON public.saved_blueprints FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own blueprints" ON public.saved_blueprints FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_saved_blueprints_updated_at BEFORE UPDATE ON public.saved_blueprints
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Add user_id to existing tables
ALTER TABLE public.ai_memory ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.concept_scores ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.evolution_chains ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.storyboard_frames ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.creative_knowledge_base ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.analytics_events ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 6. Update RLS policies for existing tables to be user-scoped
-- Drop old public policies and create user-scoped ones

-- ai_memory
DROP POLICY IF EXISTS "Public delete access for ai_memory" ON public.ai_memory;
DROP POLICY IF EXISTS "Public insert access for ai_memory" ON public.ai_memory;
DROP POLICY IF EXISTS "Public read access for ai_memory" ON public.ai_memory;
DROP POLICY IF EXISTS "Public update access for ai_memory" ON public.ai_memory;
CREATE POLICY "Users manage own ai_memory" ON public.ai_memory FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- concept_scores
DROP POLICY IF EXISTS "Public delete access for concept_scores" ON public.concept_scores;
DROP POLICY IF EXISTS "Public insert access for concept_scores" ON public.concept_scores;
DROP POLICY IF EXISTS "Public read access for concept_scores" ON public.concept_scores;
DROP POLICY IF EXISTS "Public update access for concept_scores" ON public.concept_scores;
CREATE POLICY "Users manage own concept_scores" ON public.concept_scores FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- evolution_chains
DROP POLICY IF EXISTS "Public delete access for evolution_chains" ON public.evolution_chains;
DROP POLICY IF EXISTS "Public insert access for evolution_chains" ON public.evolution_chains;
DROP POLICY IF EXISTS "Public read access for evolution_chains" ON public.evolution_chains;
DROP POLICY IF EXISTS "Public update access for evolution_chains" ON public.evolution_chains;
CREATE POLICY "Users manage own evolution_chains" ON public.evolution_chains FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- storyboard_frames
DROP POLICY IF EXISTS "Public delete access for storyboard_frames" ON public.storyboard_frames;
DROP POLICY IF EXISTS "Public insert access for storyboard_frames" ON public.storyboard_frames;
DROP POLICY IF EXISTS "Public read access for storyboard_frames" ON public.storyboard_frames;
DROP POLICY IF EXISTS "Public update access for storyboard_frames" ON public.storyboard_frames;
CREATE POLICY "Users manage own storyboard_frames" ON public.storyboard_frames FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- creative_knowledge_base
DROP POLICY IF EXISTS "Public delete access for creative_knowledge_base" ON public.creative_knowledge_base;
DROP POLICY IF EXISTS "Public insert access for creative_knowledge_base" ON public.creative_knowledge_base;
DROP POLICY IF EXISTS "Public read access for creative_knowledge_base" ON public.creative_knowledge_base;
DROP POLICY IF EXISTS "Public update access for creative_knowledge_base" ON public.creative_knowledge_base;
CREATE POLICY "Users manage own creative_knowledge_base" ON public.creative_knowledge_base FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- analytics_events
DROP POLICY IF EXISTS "Public delete access for analytics_events" ON public.analytics_events;
DROP POLICY IF EXISTS "Public insert access for analytics_events" ON public.analytics_events;
DROP POLICY IF EXISTS "Public read access for analytics_events" ON public.analytics_events;
CREATE POLICY "Users manage own analytics_events" ON public.analytics_events FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user ON public.chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON public.chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_saved_blueprints_user ON public.saved_blueprints(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_memory_user ON public.ai_memory(user_id);
CREATE INDEX IF NOT EXISTS idx_concept_scores_user ON public.concept_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_evolution_chains_user ON public.evolution_chains(user_id);
