
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can delete own advisor messages" ON public.advisor_messages;
DROP POLICY IF EXISTS "Users can insert own advisor messages" ON public.advisor_messages;
DROP POLICY IF EXISTS "Users can read own advisor messages" ON public.advisor_messages;

-- Recreate as PERMISSIVE policies
CREATE POLICY "Users can read own advisor messages"
ON public.advisor_messages FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own advisor messages"
ON public.advisor_messages FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own advisor messages"
ON public.advisor_messages FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
