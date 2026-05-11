-- Jobs missing columns
ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS recurrence_rule TEXT,
  ADD COLUMN IF NOT EXISTS recurrence_end_date DATE,
  ADD COLUMN IF NOT EXISTS recurrence_parent_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS internal_notes TEXT,
  ADD COLUMN IF NOT EXISTS completion_notes TEXT,
  ADD COLUMN IF NOT EXISTS materials_cost NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS labour_cost NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS travel_time_mins INTEGER,
  ADD COLUMN IF NOT EXISTS job_number TEXT,
  ADD COLUMN IF NOT EXISTS checklist JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS survey_token TEXT,
  ADD COLUMN IF NOT EXISTS tracking_token TEXT;

-- Clients missing columns
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS company_name TEXT,
  ADD COLUMN IF NOT EXISTS abn TEXT,
  ADD COLUMN IF NOT EXISTS billing_address TEXT,
  ADD COLUMN IF NOT EXISTS client_type TEXT DEFAULT 'residential',
  ADD COLUMN IF NOT EXISTS credit_limit NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS payment_terms_days INTEGER DEFAULT 14,
  ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES public.clients(id),
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS do_not_contact BOOLEAN DEFAULT false;

-- Invoices missing columns
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS invoice_number TEXT,
  ADD COLUMN IF NOT EXISTS purchase_order_ref TEXT,
  ADD COLUMN IF NOT EXISTS footer_text TEXT,
  ADD COLUMN IF NOT EXISTS discount_percent NUMERIC(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS viewed_at TIMESTAMPTZ;

-- Quotes missing columns
ALTER TABLE public.quotes
  ADD COLUMN IF NOT EXISTS quote_number TEXT,
  ADD COLUMN IF NOT EXISTS terms TEXT,
  ADD COLUMN IF NOT EXISTS discount_percent NUMERIC(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS revision_number INTEGER DEFAULT 1;

-- Businesses subscription + referral fields
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS is_founding_member BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS founding_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS commitment_end_date DATE,
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS grow_addon_active BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive',
  ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS referred_by_code TEXT,
  ADD COLUMN IF NOT EXISTS free_months_balance INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS free_months_used INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS bugs_reported INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS valid_bugs_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS trade_type TEXT;

-- Plan limits canonical table
CREATE TABLE IF NOT EXISTS public.plan_limits (
  plan TEXT PRIMARY KEY,
  jobs_per_month INTEGER,
  max_clients INTEGER,
  max_users INTEGER,
  ai_calls INTEGER,
  price_monthly NUMERIC(10,2),
  price_annual NUMERIC(10,2),
  founding_price NUMERIC(10,2)
);

INSERT INTO public.plan_limits VALUES
  ('free',     5,    3,    1,    0,    0,    0,    0),
  ('solo',     NULL, NULL, 1,    50,   29,   290,  7.25),
  ('team',     NULL, NULL, NULL, 200,  79,   790,  19.75),
  ('business', NULL, NULL, NULL, 500,  149,  1490, 37.25),
  ('enterprise',NULL,NULL, NULL, 9999, 299,  2990, 0)
ON CONFLICT (plan) DO UPDATE SET
  jobs_per_month = EXCLUDED.jobs_per_month,
  max_clients = EXCLUDED.max_clients,
  max_users = EXCLUDED.max_users,
  ai_calls = EXCLUDED.ai_calls,
  price_monthly = EXCLUDED.price_monthly,
  price_annual = EXCLUDED.price_annual,
  founding_price = EXCLUDED.founding_price;

-- AI usage tables
CREATE TABLE IF NOT EXISTS public.plan_ai_limits (
  plan TEXT PRIMARY KEY,
  monthly_limit INTEGER NOT NULL
);

INSERT INTO public.plan_ai_limits VALUES
  ('free', 0),('solo', 50),('team', 200),('business', 500),('enterprise', 9999)
ON CONFLICT (plan) DO UPDATE SET monthly_limit = EXCLUDED.monthly_limit;

CREATE TABLE IF NOT EXISTS public.ai_usage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature TEXT NOT NULL,
  tokens_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_usage_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS ai_usage_log_owner ON public.ai_usage_log;
CREATE POLICY ai_usage_log_owner ON public.ai_usage_log FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

-- Email tables
CREATE TABLE IF NOT EXISTS public.email_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  subject TEXT,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ NULL
);

CREATE TABLE IF NOT EXISTS public.email_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES public.email_threads(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('outbound','inbound')),
  subject TEXT,
  body TEXT NOT NULL,
  from_email TEXT,
  to_email TEXT,
  sent_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.email_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS email_threads_owner ON public.email_threads;
DROP POLICY IF EXISTS email_messages_owner ON public.email_messages;
CREATE POLICY email_threads_owner ON public.email_threads FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY email_messages_owner ON public.email_messages FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

-- Referral system
CREATE TABLE IF NOT EXISTS public.referral_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  referral_code TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','qualified','rewarded','cancelled')),
  signed_up_at TIMESTAMPTZ DEFAULT now(),
  qualified_at TIMESTAMPTZ,
  reward_applied_at TIMESTAMPTZ,
  free_months_granted INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.referral_rewards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS referral_rewards_owner_select ON public.referral_rewards;
CREATE POLICY referral_rewards_owner_select ON public.referral_rewards FOR SELECT USING (auth.uid() = referrer_id);

-- Bug bounty
CREATE TABLE IF NOT EXISTS public.bug_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  page_url TEXT,
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low','medium','high','critical')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','verified','duplicate','fixed','rejected')),
  free_month_awarded BOOLEAN DEFAULT false,
  awarded_at TIMESTAMPTZ,
  admin_notes TEXT,
  screenshot_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ
);
ALTER TABLE public.bug_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS bug_reports_owner ON public.bug_reports;
CREATE POLICY bug_reports_owner ON public.bug_reports FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

-- Account credits
CREATE TABLE IF NOT EXISTS public.account_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_cents INTEGER NOT NULL,
  reason TEXT NOT NULL,
  applied_to_invoice TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  applied_at TIMESTAMPTZ
);
ALTER TABLE public.account_credits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS account_credits_owner ON public.account_credits;
CREATE POLICY account_credits_owner ON public.account_credits FOR SELECT USING (auth.uid() = owner_id);

-- Job follow-up queue (from previous session)
CREATE TABLE IF NOT EXISTS public.job_follow_up_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id UUID,
  client_id UUID,
  send_at TIMESTAMPTZ NOT NULL,
  type TEXT NOT NULL,
  subject TEXT,
  body TEXT,
  channel TEXT DEFAULT 'email',
  status TEXT DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.job_follow_up_queue ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS job_follow_up_queue_owner_select ON public.job_follow_up_queue;
DROP POLICY IF EXISTS job_follow_up_queue_owner_insert ON public.job_follow_up_queue;
CREATE POLICY job_follow_up_queue_owner_select ON public.job_follow_up_queue FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY job_follow_up_queue_owner_insert ON public.job_follow_up_queue FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- RLS sweep for all common tables
DO $$
DECLARE
  tables TEXT[] := ARRAY[
    'businesses','jobs','clients','invoices','quotes','employees',
    'timesheets','pricebook_items','owner_notifications',
    'grow_campaigns','grow_social_posts','grow_review_responses',
    'grow_referrals','leads_accepted','lead_alert_preferences'
  ];
  t TEXT;
BEGIN
  FOREACH t IN ARRAY tables LOOP
    BEGIN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
      EXECUTE format('DROP POLICY IF EXISTS %I_owner_select ON public.%I', t, t);
      EXECUTE format('DROP POLICY IF EXISTS %I_owner_insert ON public.%I', t, t);
      EXECUTE format('DROP POLICY IF EXISTS %I_owner_update ON public.%I', t, t);
      EXECUTE format('DROP POLICY IF EXISTS %I_owner_delete ON public.%I', t, t);
      EXECUTE format('CREATE POLICY %I_owner_select ON public.%I FOR SELECT USING (auth.uid() = owner_id)', t, t);
      EXECUTE format('CREATE POLICY %I_owner_insert ON public.%I FOR INSERT WITH CHECK (auth.uid() = owner_id)', t, t);
      EXECUTE format('CREATE POLICY %I_owner_update ON public.%I FOR UPDATE USING (auth.uid() = owner_id)', t, t);
      EXECUTE format('CREATE POLICY %I_owner_delete ON public.%I FOR DELETE USING (auth.uid() = owner_id)', t, t);
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Skipped table %: %', t, SQLERRM;
    END;
  END LOOP;
END $$;
