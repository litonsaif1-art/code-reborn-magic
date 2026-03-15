
-- Delete conflicting rows first
DELETE FROM scene_params_defaults WHERE user_id = 'cfe92286-1cfd-460b-ac97-15224fec9a9e';
DELETE FROM profiles WHERE user_id = 'cfe92286-1cfd-460b-ac97-15224fec9a9e';
DELETE FROM theme_dna WHERE user_id = 'cfe92286-1cfd-460b-ac97-15224fec9a9e';

-- Transfer all data from old user to auto-login user
UPDATE chat_sessions SET user_id = 'cfe92286-1cfd-460b-ac97-15224fec9a9e' WHERE user_id = 'deb03216-dba7-45e3-b04a-cd945d753e33';
UPDATE chat_messages SET user_id = 'cfe92286-1cfd-460b-ac97-15224fec9a9e' WHERE user_id = 'deb03216-dba7-45e3-b04a-cd945d753e33';
UPDATE blueprint_history SET user_id = 'cfe92286-1cfd-460b-ac97-15224fec9a9e' WHERE user_id = 'deb03216-dba7-45e3-b04a-cd945d753e33';
UPDATE bookmarked_concepts SET user_id = 'cfe92286-1cfd-460b-ac97-15224fec9a9e' WHERE user_id = 'deb03216-dba7-45e3-b04a-cd945d753e33';
UPDATE concept_runs SET user_id = 'cfe92286-1cfd-460b-ac97-15224fec9a9e' WHERE user_id = 'deb03216-dba7-45e3-b04a-cd945d753e33';
UPDATE concept_scores SET user_id = 'cfe92286-1cfd-460b-ac97-15224fec9a9e' WHERE user_id = 'deb03216-dba7-45e3-b04a-cd945d753e33';
UPDATE evolution_chains SET user_id = 'cfe92286-1cfd-460b-ac97-15224fec9a9e' WHERE user_id = 'deb03216-dba7-45e3-b04a-cd945d753e33';
UPDATE ai_memory SET user_id = 'cfe92286-1cfd-460b-ac97-15224fec9a9e' WHERE user_id = 'deb03216-dba7-45e3-b04a-cd945d753e33';
UPDATE analytics_events SET user_id = 'cfe92286-1cfd-460b-ac97-15224fec9a9e' WHERE user_id = 'deb03216-dba7-45e3-b04a-cd945d753e33';
UPDATE storyboard_frames SET user_id = 'cfe92286-1cfd-460b-ac97-15224fec9a9e' WHERE user_id = 'deb03216-dba7-45e3-b04a-cd945d753e33';
UPDATE saved_blueprints SET user_id = 'cfe92286-1cfd-460b-ac97-15224fec9a9e' WHERE user_id = 'deb03216-dba7-45e3-b04a-cd945d753e33';
UPDATE scene_params_defaults SET user_id = 'cfe92286-1cfd-460b-ac97-15224fec9a9e' WHERE user_id = 'deb03216-dba7-45e3-b04a-cd945d753e33';
UPDATE theme_dna SET user_id = 'cfe92286-1cfd-460b-ac97-15224fec9a9e' WHERE user_id = 'deb03216-dba7-45e3-b04a-cd945d753e33';
UPDATE used_elements SET user_id = 'cfe92286-1cfd-460b-ac97-15224fec9a9e' WHERE user_id = 'deb03216-dba7-45e3-b04a-cd945d753e33';
UPDATE creative_knowledge_base SET user_id = 'cfe92286-1cfd-460b-ac97-15224fec9a9e' WHERE user_id = 'deb03216-dba7-45e3-b04a-cd945d753e33';
UPDATE profiles SET user_id = 'cfe92286-1cfd-460b-ac97-15224fec9a9e' WHERE user_id = 'deb03216-dba7-45e3-b04a-cd945d753e33';
