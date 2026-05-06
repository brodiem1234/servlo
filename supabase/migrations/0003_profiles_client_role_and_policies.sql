-- Signup / dashboards: client portal uses profiles.role = 'client'.
-- RLS: authenticated users may insert/update their own profile row.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    WHERE e.enumtypid = 'public.user_role'::regtype
      AND e.enumlabel = 'client'
  ) THEN
    ALTER TYPE public.user_role ADD VALUE 'client';
  END IF;
END $$;

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());
