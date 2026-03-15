
-- 1. Create handle_new_user trigger on auth.users
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Fix RLS policies: drop RESTRICTIVE and recreate as PERMISSIVE
-- ai_memory
DROP POLICY IF EXISTS "Users manage own ai_memory" ON public.ai_memory;
CREATE POLICY "Users manage own ai_memory" ON public.ai_memory FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- analytics_events
DROP POLICY IF EXISTS "Users manage own analytics_events" ON public.analytics_events;
CREATE POLICY "Users manage own analytics_events" ON public.analytics_events FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- blueprint_history
DROP POLICY IF EXISTS "Users can delete their own blueprint history" ON public.blueprint_history;
DROP POLICY IF EXISTS "Users can insert their own blueprint history" ON public.blueprint_history;
DROP POLICY IF EXISTS "Users can update their own blueprint history" ON public.blueprint_history;
DROP POLICY IF EXISTS "Users can view their own blueprint history" ON public.blueprint_history;
CREATE POLICY "Users can view their own blueprint history" ON public.blueprint_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own blueprint history" ON public.blueprint_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own blueprint history" ON public.blueprint_history FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own blueprint history" ON public.blueprint_history FOR DELETE USING (auth.uid() = user_id);

-- bookmarked_concepts
DROP POLICY IF EXISTS "Users can create their own bookmarks" ON public.bookmarked_concepts;
DROP POLICY IF EXISTS "Users can delete their own bookmarks" ON public.bookmarked_concepts;
DROP POLICY IF EXISTS "Users can update their own bookmarks" ON public.bookmarked_concepts;
DROP POLICY IF EXISTS "Users can view their own bookmarks" ON public.bookmarked_concepts;
CREATE POLICY "Users can view their own bookmarks" ON public.bookmarked_concepts FOR SELECT USING ((auth.uid())::text = (user_id)::text);
CREATE POLICY "Users can create their own bookmarks" ON public.bookmarked_concepts FOR INSERT WITH CHECK ((auth.uid())::text = (user_id)::text);
CREATE POLICY "Users can update their own bookmarks" ON public.bookmarked_concepts FOR UPDATE USING ((auth.uid())::text = (user_id)::text);
CREATE POLICY "Users can delete their own bookmarks" ON public.bookmarked_concepts FOR DELETE USING ((auth.uid())::text = (user_id)::text);

-- chat_messages
DROP POLICY IF EXISTS "Users can delete own messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can insert own messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can update own messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can view own messages" ON public.chat_messages;
CREATE POLICY "Users can view own messages" ON public.chat_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own messages" ON public.chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own messages" ON public.chat_messages FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own messages" ON public.chat_messages FOR DELETE USING (auth.uid() = user_id);

-- chat_sessions
DROP POLICY IF EXISTS "Users can delete own sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Users can insert own sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Users can update own sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Users can view own sessions" ON public.chat_sessions;
CREATE POLICY "Users can view own sessions" ON public.chat_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sessions" ON public.chat_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sessions" ON public.chat_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own sessions" ON public.chat_sessions FOR DELETE USING (auth.uid() = user_id);

-- concept_scores
DROP POLICY IF EXISTS "Users manage own concept_scores" ON public.concept_scores;
CREATE POLICY "Users manage own concept_scores" ON public.concept_scores FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- evolution_chains
DROP POLICY IF EXISTS "Users manage own evolution_chains" ON public.evolution_chains;
CREATE POLICY "Users manage own evolution_chains" ON public.evolution_chains FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- creative_knowledge_base
DROP POLICY IF EXISTS "Users manage own creative_knowledge_base" ON public.creative_knowledge_base;
CREATE POLICY "Users manage own creative_knowledge_base" ON public.creative_knowledge_base FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- storyboard_frames
DROP POLICY IF EXISTS "Users manage own storyboard_frames" ON public.storyboard_frames;
CREATE POLICY "Users manage own storyboard_frames" ON public.storyboard_frames FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- profiles
DROP POLICY IF EXISTS "Users can delete their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own profile" ON public.profiles FOR DELETE USING (auth.uid() = user_id);

-- saved_blueprints
DROP POLICY IF EXISTS "Users can delete own blueprints" ON public.saved_blueprints;
DROP POLICY IF EXISTS "Users can insert own blueprints" ON public.saved_blueprints;
DROP POLICY IF EXISTS "Users can update own blueprints" ON public.saved_blueprints;
DROP POLICY IF EXISTS "Users can view own blueprints" ON public.saved_blueprints;
CREATE POLICY "Users can view own blueprints" ON public.saved_blueprints FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own blueprints" ON public.saved_blueprints FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own blueprints" ON public.saved_blueprints FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own blueprints" ON public.saved_blueprints FOR DELETE USING (auth.uid() = user_id);

-- theme_dna
DROP POLICY IF EXISTS "Users can delete own theme_dna" ON public.theme_dna;
DROP POLICY IF EXISTS "Users can insert own theme_dna" ON public.theme_dna;
DROP POLICY IF EXISTS "Users can update own theme_dna" ON public.theme_dna;
DROP POLICY IF EXISTS "Users can view own theme_dna" ON public.theme_dna;
CREATE POLICY "Users can view own theme_dna" ON public.theme_dna FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own theme_dna" ON public.theme_dna FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own theme_dna" ON public.theme_dna FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own theme_dna" ON public.theme_dna FOR DELETE USING (auth.uid() = user_id);

-- used_elements
DROP POLICY IF EXISTS "Users can delete their own used elements" ON public.used_elements;
DROP POLICY IF EXISTS "Users can insert their own used elements" ON public.used_elements;
DROP POLICY IF EXISTS "Users can view their own used elements" ON public.used_elements;
CREATE POLICY "Users can view their own used elements" ON public.used_elements FOR SELECT USING ((auth.uid())::text = user_id);
CREATE POLICY "Users can insert their own used elements" ON public.used_elements FOR INSERT WITH CHECK ((auth.uid())::text = user_id);
CREATE POLICY "Users can delete their own used elements" ON public.used_elements FOR DELETE USING ((auth.uid())::text = user_id);
