
-- Add UPDATE RLS policy for chat_messages
CREATE POLICY "Users can update own messages"
ON public.chat_messages
FOR UPDATE
USING (auth.uid() = user_id);

-- Add UPDATE RLS policy for blueprint_history
CREATE POLICY "Users can update their own blueprint history"
ON public.blueprint_history
FOR UPDATE
USING (auth.uid() = user_id);
