-- Clean up duplicate assistant concept messages (keep latest per session)
DELETE FROM chat_messages 
WHERE id IN (
  SELECT id FROM (
    SELECT id, 
      ROW_NUMBER() OVER (PARTITION BY session_id ORDER BY created_at DESC) as rn
    FROM chat_messages
    WHERE role = 'assistant' 
      AND content LIKE '%Setting:%' 
      AND content LIKE '%Characters:%'
      AND content LIKE '%---CONCEPT_SEPARATOR---%'
  ) ranked WHERE rn > 1
);