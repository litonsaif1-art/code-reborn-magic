
-- Update export_all_data to include saved_suggestions
CREATE OR REPLACE FUNCTION public.export_all_data()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _uid uuid := auth.uid();
  result jsonb;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT jsonb_build_object(
    'version', '1.0',
    'exported_at', now()::text,
    'profiles', COALESCE((SELECT jsonb_agg(row_to_json(p)) FROM profiles p WHERE p.user_id = _uid), '[]'::jsonb),
    'chat_sessions', COALESCE((SELECT jsonb_agg(row_to_json(cs)) FROM chat_sessions cs WHERE cs.user_id = _uid), '[]'::jsonb),
    'chat_messages', COALESCE((SELECT jsonb_agg(row_to_json(cm)) FROM chat_messages cm WHERE cm.user_id = _uid), '[]'::jsonb),
    'saved_blueprints', COALESCE((SELECT jsonb_agg(row_to_json(sb)) FROM saved_blueprints sb WHERE sb.user_id = _uid), '[]'::jsonb),
    'blueprint_history', COALESCE((SELECT jsonb_agg(row_to_json(bh)) FROM blueprint_history bh WHERE bh.user_id = _uid), '[]'::jsonb),
    'bookmarked_concepts', COALESCE((SELECT jsonb_agg(row_to_json(bc)) FROM bookmarked_concepts bc WHERE bc.user_id = _uid), '[]'::jsonb),
    'concept_scores', COALESCE((SELECT jsonb_agg(row_to_json(cs2)) FROM concept_scores cs2 WHERE cs2.user_id = _uid), '[]'::jsonb),
    'evolution_chains', COALESCE((SELECT jsonb_agg(row_to_json(ec)) FROM evolution_chains ec WHERE ec.user_id = _uid), '[]'::jsonb),
    'creative_knowledge_base', COALESCE((SELECT jsonb_agg(row_to_json(ckb)) FROM creative_knowledge_base ckb WHERE ckb.user_id = _uid), '[]'::jsonb),
    'ai_memory', COALESCE((SELECT jsonb_agg(row_to_json(am)) FROM ai_memory am WHERE am.user_id = _uid), '[]'::jsonb),
    'analytics_events', COALESCE((SELECT jsonb_agg(row_to_json(ae)) FROM analytics_events ae WHERE ae.user_id = _uid), '[]'::jsonb),
    'storyboard_frames', COALESCE((SELECT jsonb_agg(row_to_json(sf)) FROM storyboard_frames sf WHERE sf.user_id = _uid), '[]'::jsonb),
    'theme_dna', COALESCE((SELECT jsonb_agg(row_to_json(td)) FROM theme_dna td WHERE td.user_id = _uid), '[]'::jsonb),
    'used_elements', COALESCE((SELECT jsonb_agg(row_to_json(ue)) FROM used_elements ue WHERE ue.user_id = _uid::text), '[]'::jsonb),
    'saved_suggestions', COALESCE((SELECT jsonb_agg(row_to_json(ss)) FROM saved_suggestions ss WHERE ss.user_id = _uid), '[]'::jsonb)
  ) INTO result;

  RETURN result;
END;
$function$;

-- Update import_all_data to include saved_suggestions
CREATE OR REPLACE FUNCTION public.import_all_data(payload jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _uid uuid := auth.uid();
  _uid_text text;
  _item jsonb;
  _counts jsonb := '{}'::jsonb;
  _count int;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  _uid_text := _uid::text;

  -- 1. Import chat_sessions
  _count := 0;
  FOR _item IN SELECT * FROM jsonb_array_elements(COALESCE(payload->'chat_sessions', '[]'::jsonb))
  LOOP
    INSERT INTO chat_sessions (id, user_id, title, blueprint_content, blueprint_locked, blueprint_params, provider, model, created_at, updated_at)
    VALUES (
      (_item->>'id')::uuid, _uid,
      _item->>'title', _item->>'blueprint_content',
      COALESCE((_item->>'blueprint_locked')::boolean, false),
      COALESCE(_item->'blueprint_params', '{}'::jsonb),
      COALESCE(_item->>'provider', 'auto'),
      COALESCE(_item->>'model', 'gemini-2.5-flash'),
      COALESCE((_item->>'created_at')::timestamptz, now()),
      COALESCE((_item->>'updated_at')::timestamptz, now())
    ) ON CONFLICT (id) DO UPDATE SET
      title = EXCLUDED.title,
      blueprint_content = EXCLUDED.blueprint_content,
      blueprint_locked = EXCLUDED.blueprint_locked,
      blueprint_params = EXCLUDED.blueprint_params,
      updated_at = now();
    _count := _count + 1;
  END LOOP;
  _counts := _counts || jsonb_build_object('chat_sessions', _count);

  -- 2. Import chat_messages
  _count := 0;
  FOR _item IN SELECT * FROM jsonb_array_elements(COALESCE(payload->'chat_messages', '[]'::jsonb))
  LOOP
    INSERT INTO chat_messages (id, session_id, user_id, role, content, model, created_at)
    VALUES (
      (_item->>'id')::uuid, (_item->>'session_id')::uuid, _uid,
      _item->>'role', _item->>'content', _item->>'model',
      COALESCE((_item->>'created_at')::timestamptz, now())
    ) ON CONFLICT (id) DO NOTHING;
    _count := _count + 1;
  END LOOP;
  _counts := _counts || jsonb_build_object('chat_messages', _count);

  -- 3. Import saved_blueprints
  _count := 0;
  FOR _item IN SELECT * FROM jsonb_array_elements(COALESCE(payload->'saved_blueprints', '[]'::jsonb))
  LOOP
    INSERT INTO saved_blueprints (id, user_id, name, content, is_default, serial_number, created_at, updated_at)
    VALUES (
      (_item->>'id')::uuid, _uid,
      _item->>'name', _item->>'content',
      COALESCE((_item->>'is_default')::boolean, false),
      COALESCE((_item->>'serial_number')::int, 1),
      COALESCE((_item->>'created_at')::timestamptz, now()),
      COALESCE((_item->>'updated_at')::timestamptz, now())
    ) ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name, content = EXCLUDED.content, updated_at = now();
    _count := _count + 1;
  END LOOP;
  _counts := _counts || jsonb_build_object('saved_blueprints', _count);

  -- 4. Import blueprint_history
  _count := 0;
  FOR _item IN SELECT * FROM jsonb_array_elements(COALESCE(payload->'blueprint_history', '[]'::jsonb))
  LOOP
    INSERT INTO blueprint_history (id, user_id, session_id, blueprint_content, blueprint_params, snapshot_label, created_at)
    VALUES (
      (_item->>'id')::uuid, _uid,
      _item->>'session_id', COALESCE(_item->>'blueprint_content', ''),
      COALESCE(_item->'blueprint_params', '{}'::jsonb),
      _item->>'snapshot_label',
      COALESCE((_item->>'created_at')::timestamptz, now())
    ) ON CONFLICT (id) DO NOTHING;
    _count := _count + 1;
  END LOOP;
  _counts := _counts || jsonb_build_object('blueprint_history', _count);

  -- 5. Import bookmarked_concepts
  _count := 0;
  FOR _item IN SELECT * FROM jsonb_array_elements(COALESCE(payload->'bookmarked_concepts', '[]'::jsonb))
  LOOP
    INSERT INTO bookmarked_concepts (id, user_id, session_id, message_id, concept_content, label, created_at)
    VALUES (
      (_item->>'id')::uuid, _uid,
      _item->>'session_id', _item->>'message_id',
      _item->>'concept_content', COALESCE(_item->>'label', ''),
      COALESCE((_item->>'created_at')::timestamptz, now())
    ) ON CONFLICT (id) DO NOTHING;
    _count := _count + 1;
  END LOOP;
  _counts := _counts || jsonb_build_object('bookmarked_concepts', _count);

  -- 6. Import concept_scores
  _count := 0;
  FOR _item IN SELECT * FROM jsonb_array_elements(COALESCE(payload->'concept_scores', '[]'::jsonb))
  LOOP
    INSERT INTO concept_scores (id, user_id, session_id, concept_text, creativity_score, coherence_score, virality_score, overall_score, hook_power, emotional_depth, rewatch_value, uniqueness_index, ai_feedback, created_at)
    VALUES (
      (_item->>'id')::uuid, _uid,
      _item->>'session_id', _item->>'concept_text',
      (_item->>'creativity_score')::int, (_item->>'coherence_score')::int,
      (_item->>'virality_score')::int, (_item->>'overall_score')::int,
      COALESCE((_item->>'hook_power')::int, 0), COALESCE((_item->>'emotional_depth')::int, 0),
      COALESCE((_item->>'rewatch_value')::int, 0), COALESCE((_item->>'uniqueness_index')::int, 0),
      _item->>'ai_feedback',
      COALESCE((_item->>'created_at')::timestamptz, now())
    ) ON CONFLICT (id) DO NOTHING;
    _count := _count + 1;
  END LOOP;
  _counts := _counts || jsonb_build_object('concept_scores', _count);

  -- 7. Import evolution_chains
  _count := 0;
  FOR _item IN SELECT * FROM jsonb_array_elements(COALESCE(payload->'evolution_chains', '[]'::jsonb)) ORDER BY (_item->>'generation')::int ASC NULLS FIRST
  LOOP
    INSERT INTO evolution_chains (id, user_id, session_id, parent_concept, parent_chain_id, parent_variant, generation, evolved_concepts, scores, best_variant_index, quality_trajectory, audience_persona, knowledge_extracted, min_quality_floor, created_at)
    VALUES (
      (_item->>'id')::uuid, _uid,
      _item->>'session_id', _item->>'parent_concept',
      CASE WHEN _item->>'parent_chain_id' IS NOT NULL THEN (_item->>'parent_chain_id')::uuid ELSE NULL END,
      (_item->>'parent_variant')::int,
      COALESCE((_item->>'generation')::int, 1),
      COALESCE(_item->'evolved_concepts', '[]'::jsonb),
      COALESCE(_item->'scores', '[]'::jsonb),
      (_item->>'best_variant_index')::int,
      COALESCE(_item->'quality_trajectory', '[]'::jsonb),
      COALESCE(_item->>'audience_persona', 'global'),
      COALESCE((_item->>'knowledge_extracted')::boolean, false),
      COALESCE((_item->>'min_quality_floor')::int, 0),
      COALESCE((_item->>'created_at')::timestamptz, now())
    ) ON CONFLICT (id) DO NOTHING;
    _count := _count + 1;
  END LOOP;
  _counts := _counts || jsonb_build_object('evolution_chains', _count);

  -- 8. Import creative_knowledge_base
  _count := 0;
  FOR _item IN SELECT * FROM jsonb_array_elements(COALESCE(payload->'creative_knowledge_base', '[]'::jsonb))
  LOOP
    INSERT INTO creative_knowledge_base (id, user_id, session_id, title, content, category, knowledge_type, source_chain_id, source_score, usage_count, effectiveness_score, metadata, created_at, updated_at)
    VALUES (
      (_item->>'id')::uuid, _uid,
      _item->>'session_id', _item->>'title', _item->>'content',
      COALESCE(_item->>'category', 'general'),
      COALESCE(_item->>'knowledge_type', 'pattern'),
      CASE WHEN _item->>'source_chain_id' IS NOT NULL THEN (_item->>'source_chain_id')::uuid ELSE NULL END,
      COALESCE((_item->>'source_score')::int, 0),
      COALESCE((_item->>'usage_count')::int, 0),
      COALESCE((_item->>'effectiveness_score')::numeric, 0.5),
      COALESCE(_item->'metadata', '{}'::jsonb),
      COALESCE((_item->>'created_at')::timestamptz, now()),
      COALESCE((_item->>'updated_at')::timestamptz, now())
    ) ON CONFLICT (id) DO NOTHING;
    _count := _count + 1;
  END LOOP;
  _counts := _counts || jsonb_build_object('creative_knowledge_base', _count);

  -- 9. Import ai_memory
  _count := 0;
  FOR _item IN SELECT * FROM jsonb_array_elements(COALESCE(payload->'ai_memory', '[]'::jsonb))
  LOOP
    INSERT INTO ai_memory (id, user_id, key, value, memory_type, context, weight, created_at, updated_at)
    VALUES (
      (_item->>'id')::uuid, _uid,
      _item->>'key', _item->>'value', _item->>'memory_type',
      _item->>'context',
      COALESCE((_item->>'weight')::numeric, 0.5),
      COALESCE((_item->>'created_at')::timestamptz, now()),
      COALESCE((_item->>'updated_at')::timestamptz, now())
    ) ON CONFLICT (id) DO NOTHING;
    _count := _count + 1;
  END LOOP;
  _counts := _counts || jsonb_build_object('ai_memory', _count);

  -- 10. Import storyboard_frames
  _count := 0;
  FOR _item IN SELECT * FROM jsonb_array_elements(COALESCE(payload->'storyboard_frames', '[]'::jsonb))
  LOOP
    INSERT INTO storyboard_frames (id, user_id, session_id, concept_id, frame_number, scene_description, image_url, prompt_used, generation_status, created_at, updated_at)
    VALUES (
      (_item->>'id')::uuid, _uid,
      _item->>'session_id', _item->>'concept_id',
      (_item->>'frame_number')::int, _item->>'scene_description',
      _item->>'image_url', _item->>'prompt_used',
      COALESCE(_item->>'generation_status', 'pending'),
      COALESCE((_item->>'created_at')::timestamptz, now()),
      COALESCE((_item->>'updated_at')::timestamptz, now())
    ) ON CONFLICT (id) DO NOTHING;
    _count := _count + 1;
  END LOOP;
  _counts := _counts || jsonb_build_object('storyboard_frames', _count);

  -- 11. Import theme_dna
  _count := 0;
  FOR _item IN SELECT * FROM jsonb_array_elements(COALESCE(payload->'theme_dna', '[]'::jsonb))
  LOOP
    INSERT INTO theme_dna (id, user_id, dna_string, selections, created_at, updated_at)
    VALUES (
      (_item->>'id')::uuid, _uid,
      COALESCE(_item->>'dna_string', ''),
      COALESCE(_item->'selections', '{}'::jsonb),
      COALESCE((_item->>'created_at')::timestamptz, now()),
      COALESCE((_item->>'updated_at')::timestamptz, now())
    ) ON CONFLICT (id) DO NOTHING;
    _count := _count + 1;
  END LOOP;
  _counts := _counts || jsonb_build_object('theme_dna', _count);

  -- 12. Import used_elements
  _count := 0;
  FOR _item IN SELECT * FROM jsonb_array_elements(COALESCE(payload->'used_elements', '[]'::jsonb))
  LOOP
    INSERT INTO used_elements (id, user_id, session_id, element_type, element_value, element_family, source_concept_id, created_at)
    VALUES (
      (_item->>'id')::uuid, _uid_text,
      _item->>'session_id', _item->>'element_type',
      _item->>'element_value', _item->>'element_family',
      _item->>'source_concept_id',
      COALESCE((_item->>'created_at')::timestamptz, now())
    ) ON CONFLICT (id) DO NOTHING;
    _count := _count + 1;
  END LOOP;
  _counts := _counts || jsonb_build_object('used_elements', _count);

  -- 13. Import saved_suggestions
  _count := 0;
  FOR _item IN SELECT * FROM jsonb_array_elements(COALESCE(payload->'saved_suggestions', '[]'::jsonb))
  LOOP
    INSERT INTO saved_suggestions (id, user_id, field_label, section_key, suggestions, created_at, updated_at)
    VALUES (
      (_item->>'id')::uuid, _uid,
      _item->>'field_label', _item->>'section_key',
      COALESCE(ARRAY(SELECT jsonb_array_elements_text(_item->'suggestions')), '{}'::text[]),
      COALESCE((_item->>'created_at')::timestamptz, now()),
      COALESCE((_item->>'updated_at')::timestamptz, now())
    ) ON CONFLICT (id) DO UPDATE SET
      suggestions = EXCLUDED.suggestions,
      updated_at = now();
    _count := _count + 1;
  END LOOP;
  _counts := _counts || jsonb_build_object('saved_suggestions', _count);

  RETURN jsonb_build_object('success', true, 'imported', _counts);
END;
$function$;
