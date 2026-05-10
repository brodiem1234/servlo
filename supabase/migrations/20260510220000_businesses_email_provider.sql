-- Add email provider columns to businesses
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS email_provider TEXT CHECK (email_provider IN ('gmail', 'outlook', 'resend')),
  ADD COLUMN IF NOT EXISTS email_access_token TEXT,
  ADD COLUMN IF NOT EXISTS email_refresh_token TEXT,
  ADD COLUMN IF NOT EXISTS email_token_expiry TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS email_connected_address TEXT,
  ADD COLUMN IF NOT EXISTS email_sync_enabled BOOLEAN DEFAULT false;

-- Ensure tokens are never readable via the anon key (they're stored encrypted anyway)
COMMENT ON COLUMN public.businesses.email_access_token IS 'AES-256-GCM encrypted. Never expose via client API.';
COMMENT ON COLUMN public.businesses.email_refresh_token IS 'AES-256-GCM encrypted. Never expose via client API.';
