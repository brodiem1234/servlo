-- ============================================================
-- 20260514110000 — Grow v2: idempotent RLS fix
-- ============================================================
-- Root cause: 20260510220000_v2_feature_tables.sql shares a timestamp
-- prefix with 20260510220000_businesses_email_provider.sql.  When
-- Supabase's migration tracker deduplicates by numeric prefix the v2
-- feature-tables file may have been skipped entirely, leaving
-- grow_ad_campaigns non-existent and the DROP/CREATE POLICY blocks
-- for the older Grow tables never executing.
--
-- This migration is fully idempotent:
--   • CREATE TABLE IF NOT EXISTS (no-op if table already exists)
--   • ALTER TABLE … ENABLE ROW LEVEL SECURITY (no-op if already on)
--   • DROP POLICY IF EXISTS … / CREATE POLICY (safe re-entrant)
--
-- Tables covered (all use owner_id as the owner column):
--   grow_campaigns, grow_social_posts, grow_review_responses,
--   grow_referrals, grow_ad_campaigns
-- ============================================================

-- ── grow_campaigns ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.grow_campaigns (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id        UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name            TEXT        NOT NULL,
  type            TEXT        NOT NULL DEFAULT 'email',
  status          TEXT        NOT NULL DEFAULT 'draft',
  subject         TEXT,
  body            TEXT,
  audience_type   TEXT        DEFAULT 'all',
  audience_ids    UUID[]      DEFAULT '{}',
  segment_rule    JSONB       DEFAULT '{}',
  scheduled_at    TIMESTAMPTZ,
  sent_at         TIMESTAMPTZ,
  recipient_count INTEGER     DEFAULT 0,
  open_count      INTEGER     DEFAULT 0,
  click_count     INTEGER     DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at      TIMESTAMPTZ NULL
);
ALTER TABLE public.grow_campaigns ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS grow_campaigns_owner_select ON public.grow_campaigns;
DROP POLICY IF EXISTS grow_campaigns_owner_insert ON public.grow_campaigns;
DROP POLICY IF EXISTS grow_campaigns_owner_update ON public.grow_campaigns;
DROP POLICY IF EXISTS grow_campaigns_owner_delete ON public.grow_campaigns;
-- also drop old-name variants from 20260507240000_grow_leads_schema.sql
DROP POLICY IF EXISTS "grow_campaigns_owner_select" ON public.grow_campaigns;
DROP POLICY IF EXISTS "grow_campaigns_owner_insert" ON public.grow_campaigns;
DROP POLICY IF EXISTS "grow_campaigns_owner_update" ON public.grow_campaigns;
DROP POLICY IF EXISTS "grow_campaigns_owner_delete" ON public.grow_campaigns;
CREATE POLICY grow_campaigns_owner_select ON public.grow_campaigns
  FOR SELECT TO authenticated USING (auth.uid() = owner_id);
CREATE POLICY grow_campaigns_owner_insert ON public.grow_campaigns
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY grow_campaigns_owner_update ON public.grow_campaigns
  FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY grow_campaigns_owner_delete ON public.grow_campaigns
  FOR DELETE TO authenticated USING (auth.uid() = owner_id);
CREATE INDEX IF NOT EXISTS idx_grow_campaigns_owner_active
  ON public.grow_campaigns (owner_id) WHERE deleted_at IS NULL;
GRANT ALL ON TABLE public.grow_campaigns TO service_role;
GRANT ALL ON TABLE public.grow_campaigns TO authenticated;
GRANT SELECT ON TABLE public.grow_campaigns TO anon;

-- ── grow_social_posts ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.grow_social_posts (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform      TEXT        NOT NULL DEFAULT 'facebook',
  caption       TEXT        NOT NULL DEFAULT '',
  image_url     TEXT,
  status        TEXT        NOT NULL DEFAULT 'draft',
  scheduled_at  TIMESTAMPTZ,
  published_at  TIMESTAMPTZ,
  external_id   TEXT,
  like_count    INTEGER     DEFAULT 0,
  comment_count INTEGER     DEFAULT 0,
  reach         INTEGER     DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at    TIMESTAMPTZ NULL
);
ALTER TABLE public.grow_social_posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS grow_social_posts_owner_select ON public.grow_social_posts;
DROP POLICY IF EXISTS grow_social_posts_owner_insert ON public.grow_social_posts;
DROP POLICY IF EXISTS grow_social_posts_owner_update ON public.grow_social_posts;
DROP POLICY IF EXISTS grow_social_posts_owner_delete ON public.grow_social_posts;
DROP POLICY IF EXISTS grow_posts_owner_select ON public.grow_social_posts;
DROP POLICY IF EXISTS grow_posts_owner_insert ON public.grow_social_posts;
DROP POLICY IF EXISTS grow_posts_owner_update ON public.grow_social_posts;
DROP POLICY IF EXISTS grow_posts_owner_delete ON public.grow_social_posts;
CREATE POLICY grow_social_posts_owner_select ON public.grow_social_posts
  FOR SELECT TO authenticated USING (auth.uid() = owner_id);
CREATE POLICY grow_social_posts_owner_insert ON public.grow_social_posts
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY grow_social_posts_owner_update ON public.grow_social_posts
  FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY grow_social_posts_owner_delete ON public.grow_social_posts
  FOR DELETE TO authenticated USING (auth.uid() = owner_id);
CREATE INDEX IF NOT EXISTS idx_grow_social_posts_owner_active
  ON public.grow_social_posts (owner_id) WHERE deleted_at IS NULL;
GRANT ALL ON TABLE public.grow_social_posts TO service_role;
GRANT ALL ON TABLE public.grow_social_posts TO authenticated;
GRANT SELECT ON TABLE public.grow_social_posts TO anon;

-- ── grow_review_responses ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.grow_review_responses (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform     TEXT        NOT NULL DEFAULT 'google',
  reviewer     TEXT,
  rating       INTEGER     CHECK (rating BETWEEN 1 AND 5),
  review_text  TEXT,
  response     TEXT,
  responded_at TIMESTAMPTZ,
  review_date  DATE,
  external_id  TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at   TIMESTAMPTZ NULL
);
ALTER TABLE public.grow_review_responses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS grow_review_responses_owner_select ON public.grow_review_responses;
DROP POLICY IF EXISTS grow_review_responses_owner_insert ON public.grow_review_responses;
DROP POLICY IF EXISTS grow_review_responses_owner_update ON public.grow_review_responses;
DROP POLICY IF EXISTS grow_review_responses_owner_delete ON public.grow_review_responses;
DROP POLICY IF EXISTS grow_reviews_owner_select ON public.grow_review_responses;
DROP POLICY IF EXISTS grow_reviews_owner_insert ON public.grow_review_responses;
DROP POLICY IF EXISTS grow_reviews_owner_update ON public.grow_review_responses;
DROP POLICY IF EXISTS grow_reviews_owner_delete ON public.grow_review_responses;
CREATE POLICY grow_review_responses_owner_select ON public.grow_review_responses
  FOR SELECT TO authenticated USING (auth.uid() = owner_id);
CREATE POLICY grow_review_responses_owner_insert ON public.grow_review_responses
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY grow_review_responses_owner_update ON public.grow_review_responses
  FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY grow_review_responses_owner_delete ON public.grow_review_responses
  FOR DELETE TO authenticated USING (auth.uid() = owner_id);
CREATE INDEX IF NOT EXISTS idx_grow_review_responses_owner_active
  ON public.grow_review_responses (owner_id) WHERE deleted_at IS NULL;
GRANT ALL ON TABLE public.grow_review_responses TO service_role;
GRANT ALL ON TABLE public.grow_review_responses TO authenticated;
GRANT SELECT ON TABLE public.grow_review_responses TO anon;

-- ── grow_referrals ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.grow_referrals (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id        UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referrer_id     UUID        REFERENCES public.clients(id) ON DELETE SET NULL,
  referred_name   TEXT,
  referred_email  TEXT,
  referred_phone  TEXT,
  status          TEXT        NOT NULL DEFAULT 'pending',
  reward_type     TEXT,
  reward_amount   NUMERIC(10,2),
  reward_paid_at  TIMESTAMPTZ,
  job_id          UUID        REFERENCES public.jobs(id) ON DELETE SET NULL,
  referral_code   TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at      TIMESTAMPTZ NULL
);
ALTER TABLE public.grow_referrals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS grow_referrals_owner_select ON public.grow_referrals;
DROP POLICY IF EXISTS grow_referrals_owner_insert ON public.grow_referrals;
DROP POLICY IF EXISTS grow_referrals_owner_update ON public.grow_referrals;
DROP POLICY IF EXISTS grow_referrals_owner_delete ON public.grow_referrals;
CREATE POLICY grow_referrals_owner_select ON public.grow_referrals
  FOR SELECT TO authenticated USING (auth.uid() = owner_id);
CREATE POLICY grow_referrals_owner_insert ON public.grow_referrals
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY grow_referrals_owner_update ON public.grow_referrals
  FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY grow_referrals_owner_delete ON public.grow_referrals
  FOR DELETE TO authenticated USING (auth.uid() = owner_id);
CREATE INDEX IF NOT EXISTS idx_grow_referrals_owner_active
  ON public.grow_referrals (owner_id) WHERE deleted_at IS NULL;
GRANT ALL ON TABLE public.grow_referrals TO service_role;
GRANT ALL ON TABLE public.grow_referrals TO authenticated;
GRANT SELECT ON TABLE public.grow_referrals TO anon;

-- ── grow_ad_campaigns ────────────────────────────────────────────────────────
-- This table was ONLY defined in 20260510220000_v2_feature_tables.sql.
-- If that migration was skipped (duplicate-timestamp conflict), this table
-- does not yet exist in the database.
CREATE TABLE IF NOT EXISTS public.grow_ad_campaigns (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name         TEXT        NOT NULL,
  platform     TEXT        NOT NULL DEFAULT 'google',
  objective    TEXT,
  status       TEXT        NOT NULL DEFAULT 'draft',
  budget_daily NUMERIC(10,2),
  budget_total NUMERIC(10,2),
  spend        NUMERIC(10,2) DEFAULT 0,
  impressions  INTEGER     DEFAULT 0,
  clicks       INTEGER     DEFAULT 0,
  conversions  INTEGER     DEFAULT 0,
  start_date   DATE,
  end_date     DATE,
  ad_copy      JSONB       DEFAULT '{}',
  targeting    JSONB       DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at   TIMESTAMPTZ NULL
);
ALTER TABLE public.grow_ad_campaigns ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS grow_ad_campaigns_owner_select ON public.grow_ad_campaigns;
DROP POLICY IF EXISTS grow_ad_campaigns_owner_insert ON public.grow_ad_campaigns;
DROP POLICY IF EXISTS grow_ad_campaigns_owner_update ON public.grow_ad_campaigns;
DROP POLICY IF EXISTS grow_ad_campaigns_owner_delete ON public.grow_ad_campaigns;
CREATE POLICY grow_ad_campaigns_owner_select ON public.grow_ad_campaigns
  FOR SELECT TO authenticated USING (auth.uid() = owner_id);
CREATE POLICY grow_ad_campaigns_owner_insert ON public.grow_ad_campaigns
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY grow_ad_campaigns_owner_update ON public.grow_ad_campaigns
  FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY grow_ad_campaigns_owner_delete ON public.grow_ad_campaigns
  FOR DELETE TO authenticated USING (auth.uid() = owner_id);
CREATE INDEX IF NOT EXISTS idx_grow_ad_campaigns_owner_active
  ON public.grow_ad_campaigns (owner_id) WHERE deleted_at IS NULL;
GRANT ALL ON TABLE public.grow_ad_campaigns TO service_role;
GRANT ALL ON TABLE public.grow_ad_campaigns TO authenticated;
GRANT SELECT ON TABLE public.grow_ad_campaigns TO anon;

-- Notify PostgREST to reload its schema cache
NOTIFY pgrst, 'reload schema';
