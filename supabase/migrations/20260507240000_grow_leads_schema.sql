-- ============================================================
-- 20260507240000 — Grow + Leads schema, job fields, referrals
-- ============================================================

-- ── Grow: campaigns ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.grow_campaigns (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name          text,
  goal          text,
  target_suburb text,
  target_radius integer     NOT NULL DEFAULT 10,
  photo_urls    text[],
  headline      text,
  primary_text  text,
  cta           text,
  status        text        NOT NULL DEFAULT 'draft',
  platform      text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- ── Grow: review responses ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.grow_review_responses (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id        uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  review_id       text,
  review_text     text,
  reviewer_name   text,
  rating          integer,
  response_draft  text,
  response_status text        NOT NULL DEFAULT 'draft',
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ── Grow: social posts ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.grow_social_posts (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platforms    text[],
  caption      text,
  photo_urls   text[],
  scheduled_at timestamptz,
  published_at timestamptz,
  status       text        NOT NULL DEFAULT 'scheduled',
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ── Grow: referrals ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.grow_referrals (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id         uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code    text        UNIQUE,
  referred_email   text,
  referred_user_id uuid,
  status           text        NOT NULL DEFAULT 'pending',
  reward_amount    numeric     NOT NULL DEFAULT 50,
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- ── Leads: marketplace ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.leads_marketplace (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  suburb           text,
  postcode         text,
  service_type     text,
  description      text,
  urgency          text,
  estimated_budget numeric,
  contact_name     text,
  contact_email    text,
  contact_phone    text,
  status           text        NOT NULL DEFAULT 'available',
  is_demo          boolean     NOT NULL DEFAULT false,
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- ── Leads: accepted ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.leads_accepted (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id            uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  marketplace_lead_id uuid        REFERENCES public.leads_marketplace(id),
  status              text        NOT NULL DEFAULT 'new',
  notes               text,
  converted_client_id uuid        REFERENCES public.clients(id),
  created_at          timestamptz NOT NULL DEFAULT now()
);

-- ── Notifications table ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id   uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type       text        NOT NULL,
  title      text        NOT NULL,
  body       text,
  read       boolean     NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ── Businesses: referral code ────────────────────────────────
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS referral_code text UNIQUE;

-- ── Jobs: recurrence + digital sign-off ─────────────────────
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS recurrence_rule      text;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS digital_signoff_image text;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS signoff_name         text;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS signoff_at           timestamptz;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS materials_cost       numeric;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS labour_hours         numeric;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS hourly_rate          numeric;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS job_type             text;

-- ── RLS: enable on all new tables ────────────────────────────
ALTER TABLE public.grow_campaigns        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grow_review_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grow_social_posts     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grow_referrals        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads_accepted        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications         ENABLE ROW LEVEL SECURITY;

-- grow_campaigns: owner can do everything
CREATE POLICY grow_campaigns_owner_select ON public.grow_campaigns
  FOR SELECT TO authenticated USING (owner_id = auth.uid());
CREATE POLICY grow_campaigns_owner_insert ON public.grow_campaigns
  FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY grow_campaigns_owner_update ON public.grow_campaigns
  FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY grow_campaigns_owner_delete ON public.grow_campaigns
  FOR DELETE TO authenticated USING (owner_id = auth.uid());

-- grow_review_responses
CREATE POLICY grow_reviews_owner_select ON public.grow_review_responses
  FOR SELECT TO authenticated USING (owner_id = auth.uid());
CREATE POLICY grow_reviews_owner_insert ON public.grow_review_responses
  FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY grow_reviews_owner_update ON public.grow_review_responses
  FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY grow_reviews_owner_delete ON public.grow_review_responses
  FOR DELETE TO authenticated USING (owner_id = auth.uid());

-- grow_social_posts
CREATE POLICY grow_posts_owner_select ON public.grow_social_posts
  FOR SELECT TO authenticated USING (owner_id = auth.uid());
CREATE POLICY grow_posts_owner_insert ON public.grow_social_posts
  FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY grow_posts_owner_update ON public.grow_social_posts
  FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY grow_posts_owner_delete ON public.grow_social_posts
  FOR DELETE TO authenticated USING (owner_id = auth.uid());

-- grow_referrals
CREATE POLICY grow_referrals_owner_select ON public.grow_referrals
  FOR SELECT TO authenticated USING (owner_id = auth.uid());
CREATE POLICY grow_referrals_owner_insert ON public.grow_referrals
  FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY grow_referrals_owner_update ON public.grow_referrals
  FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY grow_referrals_owner_delete ON public.grow_referrals
  FOR DELETE TO authenticated USING (owner_id = auth.uid());

-- leads_accepted
CREATE POLICY leads_accepted_owner_select ON public.leads_accepted
  FOR SELECT TO authenticated USING (owner_id = auth.uid());
CREATE POLICY leads_accepted_owner_insert ON public.leads_accepted
  FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY leads_accepted_owner_update ON public.leads_accepted
  FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY leads_accepted_owner_delete ON public.leads_accepted
  FOR DELETE TO authenticated USING (owner_id = auth.uid());

-- notifications
CREATE POLICY notifications_owner_select ON public.notifications
  FOR SELECT TO authenticated USING (owner_id = auth.uid());
CREATE POLICY notifications_owner_insert ON public.notifications
  FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY notifications_owner_update ON public.notifications
  FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY notifications_owner_delete ON public.notifications
  FOR DELETE TO authenticated USING (owner_id = auth.uid());

-- leads_marketplace: all authenticated users can SELECT
ALTER TABLE public.leads_marketplace ENABLE ROW LEVEL SECURITY;
CREATE POLICY leads_marketplace_select ON public.leads_marketplace
  FOR SELECT TO authenticated USING (true);

-- ── Demo marketplace leads ───────────────────────────────────
INSERT INTO public.leads_marketplace
  (suburb, postcode, service_type, description, urgency, estimated_budget, is_demo)
VALUES
  ('Norwood',       '5067', 'Plumbing',    'Blocked drain in bathroom, water not draining at all. Need urgent fix.',             'Today',      350,  true),
  ('Glenelg',       '5045', 'Electrical',  'Power point sparking in kitchen, tripped the circuit breaker. Urgent safety issue.','Today',      280,  true),
  ('Prospect',      '5082', 'Building',    'Need pergola built in backyard, approx 4x5 metres. Have council approval.',          'This week', 4500,  true),
  ('Unley',         '5061', 'Cleaning',    'End of lease clean for 3 bedroom house, need ASAP for bond return.',                 'Today',      380,  true),
  ('Modbury',       '5092', 'HVAC',        'Ducted air con not cooling properly, making a grinding noise. 3 bedroom home.',      'This week',  650,  true),
  ('Henley Beach',  '5022', 'Landscaping', 'Front yard redesign, remove old plants, new turf, irrigation system.',               'Flexible',  3200,  true),
  ('Edwardstown',   '5039', 'Pest Control','German cockroaches in kitchen, tried DIY treatment with no luck.',                   'This week',  220,  true),
  ('Burnside',      '5066', 'Plumbing',    'Hot water system leaking from the base, 12 years old. Likely needs replacement.',    'Today',     1800,  true),
  ('Mile End',      '5031', 'Electrical',  'Installing 3 ceiling fans and 2 extra power points in living areas.',                'Flexible',   420,  true),
  ('Tea Tree Gully','5091', 'Building',    'Bathroom renovation — new tiles, vanity, shower screen, toilet. Full reno.',         'This week', 8500,  true)
ON CONFLICT DO NOTHING;
