-- Mirror auth user id on both owner_id and user_id so queries/policies stay consistent.

ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users (id) ON DELETE CASCADE;

UPDATE public.businesses
SET user_id = owner_id
WHERE user_id IS NULL AND owner_id IS NOT NULL;

ALTER TABLE public.businesses
  ALTER COLUMN user_id SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS businesses_user_id_unique ON public.businesses (user_id);

CREATE OR REPLACE FUNCTION public.businesses_mirror_owner_user()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.owner_id IS NULL AND NEW.user_id IS NULL THEN
    RAISE EXCEPTION 'businesses row requires owner_id or user_id';
  END IF;
  IF NEW.owner_id IS NOT NULL AND NEW.user_id IS NULL THEN
    NEW.user_id := NEW.owner_id;
  ELSIF NEW.user_id IS NOT NULL AND NEW.owner_id IS NULL THEN
    NEW.owner_id := NEW.user_id;
  END IF;
  IF NEW.owner_id IS DISTINCT FROM NEW.user_id THEN
    RAISE EXCEPTION 'businesses.owner_id and businesses.user_id must be equal';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS businesses_mirror_owner_user ON public.businesses;
CREATE TRIGGER businesses_mirror_owner_user
  BEFORE INSERT OR UPDATE OF owner_id, user_id ON public.businesses
  FOR EACH ROW
  EXECUTE PROCEDURE public.businesses_mirror_owner_user();

COMMENT ON COLUMN public.businesses.user_id IS 'Mirrors owner_id (same auth.users id); kept in sync via trigger and app upserts.';

-- Tighten RLS: row belongs to caller when both ids match session user (OR handles legacy rows mid-migration).

DROP POLICY IF EXISTS "Users can insert their own business" ON public.businesses;
DROP POLICY IF EXISTS "Users can view their own business" ON public.businesses;
DROP POLICY IF EXISTS "Users can update their own business" ON public.businesses;

CREATE POLICY "Users can insert their own business"
  ON public.businesses FOR INSERT
  TO authenticated
  WITH CHECK (
    owner_id = auth.uid()
    AND user_id = auth.uid()
    AND owner_id = user_id
  );

CREATE POLICY "Users can view their own business"
  ON public.businesses FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid() OR user_id = auth.uid());

CREATE POLICY "Users can update their own business"
  ON public.businesses FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid() OR user_id = auth.uid())
  WITH CHECK (
    owner_id = auth.uid()
    AND user_id = auth.uid()
    AND owner_id = user_id
  );
