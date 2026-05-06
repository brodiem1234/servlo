-- Per-business workspace feature toggles (see src/lib/workspace-features.ts).
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS feature_flags jsonb DEFAULT NULL;

COMMENT ON COLUMN public.businesses.feature_flags IS 'Optional JSON { "enabled": ["feature_id", ...] }. Null = legacy behaviour (all features enabled).';
