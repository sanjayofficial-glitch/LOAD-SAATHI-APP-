-- Fix: templates policy used auth.uid() which casts Clerk's user_xxx sub to uuid → throws
-- "invalid input syntax for type uuid" on every authenticated query.
-- All other tables use (auth.jwt() ->> 'sub'::text) which avoids the cast.

DROP POLICY IF EXISTS "Users manage own templates" ON public.templates;

CREATE POLICY "Users manage own templates" ON public.templates
  FOR ALL
  USING ((auth.jwt() ->> 'sub'::text) = user_id)
  WITH CHECK ((auth.jwt() ->> 'sub'::text) = user_id);
