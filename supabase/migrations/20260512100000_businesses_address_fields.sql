-- Add separate suburb, state, postcode columns to businesses table.
-- Previously the corrective consolidation concatenated these into a single address field.
-- These new columns allow the profile form to display and edit them independently.

ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS suburb text,
  ADD COLUMN IF NOT EXISTS state text,
  ADD COLUMN IF NOT EXISTS postcode text;

-- Add notification_preferences JSONB column to profiles for per-owner email notification settings.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS notification_preferences jsonb;
