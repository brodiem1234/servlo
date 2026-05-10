-- User-to-user referral program
-- Tracks when one owner refers another owner to SERVLO
CREATE TABLE IF NOT EXISTS public.user_referrals (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_email   TEXT NOT NULL,
  referred_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status           TEXT NOT NULL DEFAULT 'pending', -- pending, signed_up, subscribed
  converted_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_referrals_referrer ON public.user_referrals (referrer_user_id);
CREATE INDEX IF NOT EXISTS idx_user_referrals_referred ON public.user_referrals (referred_user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_referrals_email_unique ON public.user_referrals (referred_email);

ALTER TABLE public.user_referrals ENABLE ROW LEVEL SECURITY;

-- Referrer can read their own referrals
DROP POLICY IF EXISTS user_referrals_referrer_select ON public.user_referrals;
CREATE POLICY user_referrals_referrer_select ON public.user_referrals
  FOR SELECT USING (auth.uid() = referrer_user_id);

-- Referrer can insert referrals they initiate
DROP POLICY IF EXISTS user_referrals_referrer_insert ON public.user_referrals;
CREATE POLICY user_referrals_referrer_insert ON public.user_referrals
  FOR INSERT WITH CHECK (auth.uid() = referrer_user_id);
