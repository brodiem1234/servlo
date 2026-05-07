-- 20260513100000 — Add estimated_value and updated_at to leads_accepted
-- Add estimated_value column so owners can override the marketplace budget
ALTER TABLE public.leads_accepted
  ADD COLUMN IF NOT EXISTS estimated_value numeric;

-- Add updated_at column used for avg-days-to-close calculation
ALTER TABLE public.leads_accepted
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Backfill updated_at to created_at for existing rows
UPDATE public.leads_accepted
  SET updated_at = created_at
  WHERE updated_at = now() AND created_at IS NOT NULL;

-- Add unique constraint on owner_id for lead_alert_preferences upsert
ALTER TABLE public.lead_alert_preferences
  ADD COLUMN IF NOT EXISTS suburb text;

ALTER TABLE public.lead_alert_preferences
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Add unique constraint so upsert on owner_id works
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'lead_alert_preferences_owner_id_key'
  ) THEN
    ALTER TABLE public.lead_alert_preferences
      ADD CONSTRAINT lead_alert_preferences_owner_id_key UNIQUE (owner_id);
  END IF;
END $$;
