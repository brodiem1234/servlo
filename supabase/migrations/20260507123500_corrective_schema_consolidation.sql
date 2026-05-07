-- Corrective consolidation migration:
-- - migrate duplicated profile business fields into businesses
-- - migrate trial_end_date into trial_end
-- - drop duplicate columns
-- - remove businesses.user_id duplication and enforce owner_id-only RLS

-- ---------------------------------------------------------------------------
-- 1) Data migrations first
-- ---------------------------------------------------------------------------

-- Copy profile business fields into existing businesses rows where business values are missing.
UPDATE public.businesses b
SET
  business_name = COALESCE(NULLIF(b.business_name, ''), NULLIF(p.business_name, '')),
  abn = COALESCE(NULLIF(b.abn, ''), NULLIF(p.abn, '')),
  address = COALESCE(
    NULLIF(b.address, ''),
    NULLIF(
      concat_ws(', ', NULLIF(p.address, ''), NULLIF(p.suburb, ''), NULLIF(p.state, ''), NULLIF(p.postcode, '')),
      ''
    )
  )
FROM public.profiles p
WHERE b.owner_id = p.id
  AND (
    (b.business_name IS NULL AND p.business_name IS NOT NULL)
    OR (b.abn IS NULL AND p.abn IS NOT NULL)
    OR (
      b.address IS NULL
      AND (p.address IS NOT NULL OR p.suburb IS NOT NULL OR p.state IS NOT NULL OR p.postcode IS NOT NULL)
    )
  );

-- Move legacy trial end date into canonical trial_end when missing.
UPDATE public.profiles
SET trial_end = COALESCE(trial_end, trial_end_date)
WHERE trial_end IS NULL
  AND trial_end_date IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 2) Drop duplicate columns
-- ---------------------------------------------------------------------------

ALTER TABLE IF EXISTS public.invoices
  DROP COLUMN IF EXISTS amount,
  DROP COLUMN IF EXISTS gst_amount;

ALTER TABLE IF EXISTS public.quotes
  DROP COLUMN IF EXISTS gst_amount,
  DROP COLUMN IF EXISTS client_name;

ALTER TABLE IF EXISTS public.profiles
  DROP COLUMN IF EXISTS business_name,
  DROP COLUMN IF EXISTS abn,
  DROP COLUMN IF EXISTS address,
  DROP COLUMN IF EXISTS suburb,
  DROP COLUMN IF EXISTS state,
  DROP COLUMN IF EXISTS postcode,
  DROP COLUMN IF EXISTS trial_end_date;

-- ---------------------------------------------------------------------------
-- 3) Resolve businesses owner_id/user_id duplication
-- ---------------------------------------------------------------------------

ALTER TABLE IF EXISTS public.businesses ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies (including user_id-based variants) before removing user_id.
DROP POLICY IF EXISTS businesses_owner_select ON public.businesses;
DROP POLICY IF EXISTS businesses_owner_insert ON public.businesses;
DROP POLICY IF EXISTS businesses_owner_update ON public.businesses;
DROP POLICY IF EXISTS "Users can view their own business" ON public.businesses;
DROP POLICY IF EXISTS "Users can insert their own business" ON public.businesses;
DROP POLICY IF EXISTS "Users can update their own business" ON public.businesses;
DROP POLICY IF EXISTS "Users can view own business" ON public.businesses;
DROP POLICY IF EXISTS "Users can update own business" ON public.businesses;
DROP POLICY IF EXISTS "Allow authenticated insert" ON public.businesses;

ALTER TABLE IF EXISTS public.businesses
  DROP CONSTRAINT IF EXISTS businesses_owner_user_match;

ALTER TABLE IF EXISTS public.businesses
  DROP CONSTRAINT IF EXISTS businesses_user_id_key;

ALTER TABLE IF EXISTS public.businesses
  DROP CONSTRAINT IF EXISTS businesses_user_id_fkey;

DROP INDEX IF EXISTS public.businesses_user_id_key;
DROP INDEX IF EXISTS public.businesses_user_id_unique;

DROP TRIGGER IF EXISTS businesses_mirror_owner_user ON public.businesses;
DROP FUNCTION IF EXISTS public.businesses_mirror_owner_user();

ALTER TABLE IF EXISTS public.businesses
  DROP COLUMN IF EXISTS user_id;

-- Ensure owner_id remains unique for upserts.
CREATE UNIQUE INDEX IF NOT EXISTS businesses_owner_id_key ON public.businesses (owner_id);

-- ---------------------------------------------------------------------------
-- 4) owner_id-only businesses RLS policies
-- ---------------------------------------------------------------------------

CREATE POLICY businesses_owner_select ON public.businesses
  FOR SELECT TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY businesses_owner_insert ON public.businesses
  FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY businesses_owner_update ON public.businesses
  FOR UPDATE TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

NOTIFY pgrst, 'reload schema';
