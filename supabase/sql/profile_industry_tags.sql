-- Apply in Supabase SQL Editor: store multi-select industries from signup + optional free-text for "Other".
-- Used for dashboard welcome, getting-started checklist, and future personalisation.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS industry_tags text[] NOT NULL DEFAULT '{}';

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS industry_other_note text;

COMMENT ON COLUMN public.profiles.industry_tags IS 'Industry slugs from signup: trades, cleaning, events, marketing, health, field_services, other';
COMMENT ON COLUMN public.profiles.industry_other_note IS 'Free text when Other is selected at signup';
