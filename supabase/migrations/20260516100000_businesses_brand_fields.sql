-- Brand kit fields on businesses table
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS tagline        TEXT,
  ADD COLUMN IF NOT EXISTS brand_voice    TEXT CHECK (brand_voice IN ('professional', 'friendly', 'authoritative')),
  ADD COLUMN IF NOT EXISTS logo_url       TEXT;
