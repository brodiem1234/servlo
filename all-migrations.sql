-- Add contractor-specific columns to the employees table.
-- Contractors share the employees table (role = 'contractor').
-- day_rate and trade_speciality are new fields for contractor tracking.

ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS day_rate      numeric,
  ADD COLUMN IF NOT EXISTS trade_speciality text;

-- Partial index to speed up contractor-specific queries
CREATE INDEX IF NOT EXISTS idx_employees_contractors
  ON public.employees (owner_id)
  WHERE role = 'contractor' AND deleted_at IS NULL;
-- Idempotent soft-delete columns for every owner-scoped table.
-- The original 20260509100100_soft_deletes.sql references a
-- non-existent 'contractors' table (contractors are rows in 'employees'
-- with role='contractor'), causing that migration to abort before
-- adding deleted_at to clients, invoices, quotes, etc.
--
-- This migration adds/ensures all columns without touching 'contractors'.

ALTER TABLE public.businesses  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL;
ALTER TABLE public.jobs        ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL;
ALTER TABLE public.clients     ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL;
ALTER TABLE public.invoices    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL;
ALTER TABLE public.quotes      ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL;
ALTER TABLE public.employees   ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL;
ALTER TABLE public.timesheets  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL;

-- Partial indexes for fast "non-deleted" scans on the high-volume tables
CREATE INDEX IF NOT EXISTS idx_businesses_active  ON public.businesses (owner_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_jobs_active        ON public.jobs       (owner_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_clients_active     ON public.clients    (owner_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_invoices_active    ON public.invoices   (owner_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_quotes_active      ON public.quotes     (owner_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_employees_active   ON public.employees  (owner_id) WHERE deleted_at IS NULL;
-- Owner app queries use jobs.owner_id = auth.uid(). Legacy templates used profiles.business_id; many accounts have NULL business_id â†’ empty lists.
-- Also allow employees to SELECT jobs assigned to them (matches employees.email to JWT email, or legacy employee_id = auth.uid()).

ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners can manage jobs; employees read assigned" ON public.jobs;
DROP POLICY IF EXISTS jobs_owner_all ON public.jobs;
DROP POLICY IF EXISTS jobs_select_owner ON public.jobs;
DROP POLICY IF EXISTS jobs_employee_select ON public.jobs;
DROP POLICY IF EXISTS jobs_employee_auth_id ON public.jobs;

CREATE POLICY jobs_owner_all ON public.jobs
  FOR ALL TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY jobs_employee_select ON public.jobs
  FOR SELECT TO authenticated
  USING (
    employee_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.employees e
      WHERE e.id = jobs.employee_id
        AND lower(trim(coalesce(e.email, ''))) = lower(trim(coalesce((auth.jwt() ->> 'email')::text, '')))
    )
  );

CREATE POLICY jobs_employee_auth_id ON public.jobs
  FOR SELECT TO authenticated
  USING (jobs.employee_id = auth.uid());

GRANT ALL ON TABLE public.jobs TO service_role;

NOTIFY pgrst, 'reload schema';
-- SMS messages table (for two-way SMS threads)
CREATE TABLE IF NOT EXISTS sms_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  thread_id UUID,
  to_number TEXT,
  from_number TEXT,
  message TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  status TEXT DEFAULT 'sent',
  is_stub BOOLEAN DEFAULT false,
  sent_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE sms_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY sms_messages_owner_select ON sms_messages FOR SELECT USING (owner_id = auth.uid());
CREATE POLICY sms_messages_owner_insert ON sms_messages FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY sms_messages_owner_update ON sms_messages FOR UPDATE USING (owner_id = auth.uid());
CREATE POLICY sms_messages_owner_delete ON sms_messages FOR DELETE USING (owner_id = auth.uid());

-- Job surveys table (for customer satisfaction surveys)
CREATE TABLE IF NOT EXISTS job_surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  feedback TEXT,
  submitted_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- No RLS on job_surveys since surveys are submitted without auth
-- But add an index
CREATE INDEX IF NOT EXISTS idx_job_surveys_job_id ON job_surveys(job_id);

-- Add survey_token to jobs if not exists
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS survey_token UUID DEFAULT gen_random_uuid();
CREATE INDEX IF NOT EXISTS idx_jobs_survey_token ON jobs(survey_token);

-- Add tracking_token to jobs if not exists
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS tracking_token UUID;
CREATE INDEX IF NOT EXISTS idx_jobs_tracking_token ON jobs(tracking_token);
-- V2 Feature Tables Migration
-- Creates all missing tables needed for GROW, LEADS, ANSWER, PAY, FLEET, FINANCE, HIRE, CORE features.
-- All tables: soft-delete, RLS owner_id, partial indexes.

-- =============================================
-- CORE TABLES
-- =============================================

-- job_events (audit trail for job state changes)
CREATE TABLE IF NOT EXISTS public.job_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id      UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  event_type  TEXT NOT NULL, -- 'status_change','note','photo','sms','email','payment'
  old_value   TEXT,
  new_value   TEXT,
  note        TEXT,
  created_by  UUID REFERENCES auth.users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at  TIMESTAMPTZ NULL
);
ALTER TABLE public.job_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS job_events_owner_select ON public.job_events;
DROP POLICY IF EXISTS job_events_owner_insert ON public.job_events;
DROP POLICY IF EXISTS job_events_owner_update ON public.job_events;
DROP POLICY IF EXISTS job_events_owner_delete ON public.job_events;
CREATE POLICY job_events_owner_select ON public.job_events FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY job_events_owner_insert ON public.job_events FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY job_events_owner_update ON public.job_events FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY job_events_owner_delete ON public.job_events FOR DELETE USING (auth.uid() = owner_id);
CREATE INDEX IF NOT EXISTS idx_job_events_active ON public.job_events (owner_id, job_id) WHERE deleted_at IS NULL;

-- job_templates
CREATE TABLE IF NOT EXISTS public.job_templates (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  description  TEXT,
  service_type TEXT,
  duration_hrs NUMERIC(6,2),
  line_items   JSONB DEFAULT '[]',
  checklist    JSONB DEFAULT '[]',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at   TIMESTAMPTZ NULL
);
ALTER TABLE public.job_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS job_templates_owner_select ON public.job_templates;
DROP POLICY IF EXISTS job_templates_owner_insert ON public.job_templates;
DROP POLICY IF EXISTS job_templates_owner_update ON public.job_templates;
DROP POLICY IF EXISTS job_templates_owner_delete ON public.job_templates;
CREATE POLICY job_templates_owner_select ON public.job_templates FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY job_templates_owner_insert ON public.job_templates FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY job_templates_owner_update ON public.job_templates FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY job_templates_owner_delete ON public.job_templates FOR DELETE USING (auth.uid() = owner_id);
CREATE INDEX IF NOT EXISTS idx_job_templates_active ON public.job_templates (owner_id) WHERE deleted_at IS NULL;

-- owner_notifications
CREATE TABLE IF NOT EXISTS public.owner_notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type        TEXT NOT NULL, -- 'job_update','invoice_paid','churn_risk','reorder','survey'
  title       TEXT NOT NULL,
  body        TEXT,
  link        TEXT,
  read        BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at  TIMESTAMPTZ NULL
);
ALTER TABLE public.owner_notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS owner_notifications_owner_select ON public.owner_notifications;
DROP POLICY IF EXISTS owner_notifications_owner_insert ON public.owner_notifications;
DROP POLICY IF EXISTS owner_notifications_owner_update ON public.owner_notifications;
DROP POLICY IF EXISTS owner_notifications_owner_delete ON public.owner_notifications;
CREATE POLICY owner_notifications_owner_select ON public.owner_notifications FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY owner_notifications_owner_insert ON public.owner_notifications FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY owner_notifications_owner_update ON public.owner_notifications FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY owner_notifications_owner_delete ON public.owner_notifications FOR DELETE USING (auth.uid() = owner_id);
CREATE INDEX IF NOT EXISTS idx_owner_notifications_active ON public.owner_notifications (owner_id, read) WHERE deleted_at IS NULL;

-- sms_messages
CREATE TABLE IF NOT EXISTS public.sms_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id   UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  direction   TEXT NOT NULL CHECK (direction IN ('outbound','inbound')),
  body        TEXT NOT NULL,
  to_number   TEXT,
  from_number TEXT,
  status      TEXT DEFAULT 'sent',
  external_id TEXT,
  sent_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at  TIMESTAMPTZ NULL
);
ALTER TABLE public.sms_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS sms_messages_owner_select ON public.sms_messages;
DROP POLICY IF EXISTS sms_messages_owner_insert ON public.sms_messages;
DROP POLICY IF EXISTS sms_messages_owner_update ON public.sms_messages;
DROP POLICY IF EXISTS sms_messages_owner_delete ON public.sms_messages;
CREATE POLICY sms_messages_owner_select ON public.sms_messages FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY sms_messages_owner_insert ON public.sms_messages FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY sms_messages_owner_update ON public.sms_messages FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY sms_messages_owner_delete ON public.sms_messages FOR DELETE USING (auth.uid() = owner_id);
CREATE INDEX IF NOT EXISTS idx_sms_messages_active ON public.sms_messages (owner_id, client_id) WHERE deleted_at IS NULL;

-- job_surveys
CREATE TABLE IF NOT EXISTS public.job_surveys (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id      UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
  client_id   UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  rating      INTEGER CHECK (rating BETWEEN 1 AND 5),
  comment     TEXT,
  nps_score   INTEGER CHECK (nps_score BETWEEN 0 AND 10),
  submitted_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at  TIMESTAMPTZ NULL
);
ALTER TABLE public.job_surveys ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS job_surveys_owner_select ON public.job_surveys;
DROP POLICY IF EXISTS job_surveys_owner_insert ON public.job_surveys;
DROP POLICY IF EXISTS job_surveys_owner_update ON public.job_surveys;
DROP POLICY IF EXISTS job_surveys_owner_delete ON public.job_surveys;
CREATE POLICY job_surveys_owner_select ON public.job_surveys FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY job_surveys_owner_insert ON public.job_surveys FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY job_surveys_owner_update ON public.job_surveys FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY job_surveys_owner_delete ON public.job_surveys FOR DELETE USING (auth.uid() = owner_id);
CREATE INDEX IF NOT EXISTS idx_job_surveys_active ON public.job_surveys (owner_id) WHERE deleted_at IS NULL;

-- Add survey_token and tracking_token to jobs if not exists
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS survey_token TEXT UNIQUE;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS tracking_token TEXT UNIQUE;
CREATE INDEX IF NOT EXISTS idx_jobs_survey_token ON public.jobs (survey_token) WHERE survey_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_jobs_tracking_token ON public.jobs (tracking_token) WHERE tracking_token IS NOT NULL;

-- pricebook_items
CREATE TABLE IF NOT EXISTS public.pricebook_items (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  description       TEXT,
  sku               TEXT,
  unit_price        NUMERIC(10,2) NOT NULL DEFAULT 0,
  cost_price        NUMERIC(10,2),
  unit              TEXT DEFAULT 'each',
  category          TEXT,
  is_service        BOOLEAN NOT NULL DEFAULT false,
  quantity_on_hand  INTEGER DEFAULT 0,
  reorder_threshold INTEGER DEFAULT 5,
  is_active         BOOLEAN NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at        TIMESTAMPTZ NULL
);
ALTER TABLE public.pricebook_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS pricebook_items_owner_select ON public.pricebook_items;
DROP POLICY IF EXISTS pricebook_items_owner_insert ON public.pricebook_items;
DROP POLICY IF EXISTS pricebook_items_owner_update ON public.pricebook_items;
DROP POLICY IF EXISTS pricebook_items_owner_delete ON public.pricebook_items;
CREATE POLICY pricebook_items_owner_select ON public.pricebook_items FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY pricebook_items_owner_insert ON public.pricebook_items FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY pricebook_items_owner_update ON public.pricebook_items FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY pricebook_items_owner_delete ON public.pricebook_items FOR DELETE USING (auth.uid() = owner_id);
CREATE INDEX IF NOT EXISTS idx_pricebook_items_active ON public.pricebook_items (owner_id) WHERE deleted_at IS NULL;

-- client_notes
CREATE TABLE IF NOT EXISTS public.client_notes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id  UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  note       TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ NULL
);
ALTER TABLE public.client_notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS client_notes_owner_select ON public.client_notes;
DROP POLICY IF EXISTS client_notes_owner_insert ON public.client_notes;
DROP POLICY IF EXISTS client_notes_owner_update ON public.client_notes;
DROP POLICY IF EXISTS client_notes_owner_delete ON public.client_notes;
CREATE POLICY client_notes_owner_select ON public.client_notes FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY client_notes_owner_insert ON public.client_notes FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY client_notes_owner_update ON public.client_notes FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY client_notes_owner_delete ON public.client_notes FOR DELETE USING (auth.uid() = owner_id);
CREATE INDEX IF NOT EXISTS idx_client_notes_active ON public.client_notes (owner_id, client_id) WHERE deleted_at IS NULL;

-- client_properties (for property management)
CREATE TABLE IF NOT EXISTS public.client_properties (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id  UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  address    TEXT NOT NULL,
  suburb     TEXT,
  state      TEXT,
  postcode   TEXT,
  property_type TEXT DEFAULT 'residential',
  notes      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ NULL
);
ALTER TABLE public.client_properties ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS client_properties_owner_select ON public.client_properties;
DROP POLICY IF EXISTS client_properties_owner_insert ON public.client_properties;
DROP POLICY IF EXISTS client_properties_owner_update ON public.client_properties;
DROP POLICY IF EXISTS client_properties_owner_delete ON public.client_properties;
CREATE POLICY client_properties_owner_select ON public.client_properties FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY client_properties_owner_insert ON public.client_properties FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY client_properties_owner_update ON public.client_properties FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY client_properties_owner_delete ON public.client_properties FOR DELETE USING (auth.uid() = owner_id);
CREATE INDEX IF NOT EXISTS idx_client_properties_active ON public.client_properties (owner_id, client_id) WHERE deleted_at IS NULL;

-- compliance_documents
CREATE TABLE IF NOT EXISTS public.compliance_documents (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  doc_type      TEXT NOT NULL, -- 'SWMS','JSA','MSDS','licence','cert'
  template_key  TEXT, -- for built-in templates
  content       JSONB DEFAULT '{}',
  job_id        UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
  signed_at     TIMESTAMPTZ,
  signed_by     TEXT,
  expiry_date   DATE,
  file_url      TEXT,
  status        TEXT DEFAULT 'draft', -- draft, complete, expired
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at    TIMESTAMPTZ NULL
);
ALTER TABLE public.compliance_documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS compliance_documents_owner_select ON public.compliance_documents;
DROP POLICY IF EXISTS compliance_documents_owner_insert ON public.compliance_documents;
DROP POLICY IF EXISTS compliance_documents_owner_update ON public.compliance_documents;
DROP POLICY IF EXISTS compliance_documents_owner_delete ON public.compliance_documents;
CREATE POLICY compliance_documents_owner_select ON public.compliance_documents FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY compliance_documents_owner_insert ON public.compliance_documents FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY compliance_documents_owner_update ON public.compliance_documents FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY compliance_documents_owner_delete ON public.compliance_documents FOR DELETE USING (auth.uid() = owner_id);
CREATE INDEX IF NOT EXISTS idx_compliance_documents_active ON public.compliance_documents (owner_id) WHERE deleted_at IS NULL;

-- =============================================
-- GROW TABLES
-- =============================================

-- grow_campaigns (email/SMS campaigns)
CREATE TABLE IF NOT EXISTS public.grow_campaigns (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  type          TEXT NOT NULL DEFAULT 'email', -- email, sms
  status        TEXT NOT NULL DEFAULT 'draft', -- draft, scheduled, sent, cancelled
  subject       TEXT,
  body          TEXT,
  audience_type TEXT DEFAULT 'all', -- all, segment, manual
  audience_ids  UUID[] DEFAULT '{}',
  segment_rule  JSONB DEFAULT '{}',
  scheduled_at  TIMESTAMPTZ,
  sent_at       TIMESTAMPTZ,
  recipient_count INTEGER DEFAULT 0,
  open_count    INTEGER DEFAULT 0,
  click_count   INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at    TIMESTAMPTZ NULL
);
ALTER TABLE public.grow_campaigns ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS grow_campaigns_owner_select ON public.grow_campaigns;
DROP POLICY IF EXISTS grow_campaigns_owner_insert ON public.grow_campaigns;
DROP POLICY IF EXISTS grow_campaigns_owner_update ON public.grow_campaigns;
DROP POLICY IF EXISTS grow_campaigns_owner_delete ON public.grow_campaigns;
CREATE POLICY grow_campaigns_owner_select ON public.grow_campaigns FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY grow_campaigns_owner_insert ON public.grow_campaigns FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY grow_campaigns_owner_update ON public.grow_campaigns FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY grow_campaigns_owner_delete ON public.grow_campaigns FOR DELETE USING (auth.uid() = owner_id);
CREATE INDEX IF NOT EXISTS idx_grow_campaigns_active ON public.grow_campaigns (owner_id) WHERE deleted_at IS NULL;

-- grow_social_posts
CREATE TABLE IF NOT EXISTS public.grow_social_posts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform      TEXT NOT NULL, -- facebook, instagram, google
  caption       TEXT NOT NULL,
  image_url     TEXT,
  status        TEXT NOT NULL DEFAULT 'draft', -- draft, scheduled, published, failed
  scheduled_at  TIMESTAMPTZ,
  published_at  TIMESTAMPTZ,
  external_id   TEXT,
  like_count    INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  reach         INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at    TIMESTAMPTZ NULL
);
ALTER TABLE public.grow_social_posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS grow_social_posts_owner_select ON public.grow_social_posts;
DROP POLICY IF EXISTS grow_social_posts_owner_insert ON public.grow_social_posts;
DROP POLICY IF EXISTS grow_social_posts_owner_update ON public.grow_social_posts;
DROP POLICY IF EXISTS grow_social_posts_owner_delete ON public.grow_social_posts;
CREATE POLICY grow_social_posts_owner_select ON public.grow_social_posts FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY grow_social_posts_owner_insert ON public.grow_social_posts FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY grow_social_posts_owner_update ON public.grow_social_posts FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY grow_social_posts_owner_delete ON public.grow_social_posts FOR DELETE USING (auth.uid() = owner_id);
CREATE INDEX IF NOT EXISTS idx_grow_social_posts_active ON public.grow_social_posts (owner_id) WHERE deleted_at IS NULL;

-- grow_review_responses
CREATE TABLE IF NOT EXISTS public.grow_review_responses (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform     TEXT NOT NULL, -- google, facebook
  reviewer     TEXT,
  rating       INTEGER CHECK (rating BETWEEN 1 AND 5),
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
CREATE POLICY grow_review_responses_owner_select ON public.grow_review_responses FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY grow_review_responses_owner_insert ON public.grow_review_responses FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY grow_review_responses_owner_update ON public.grow_review_responses FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY grow_review_responses_owner_delete ON public.grow_review_responses FOR DELETE USING (auth.uid() = owner_id);
CREATE INDEX IF NOT EXISTS idx_grow_review_responses_active ON public.grow_review_responses (owner_id) WHERE deleted_at IS NULL;

-- grow_referrals
CREATE TABLE IF NOT EXISTS public.grow_referrals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referrer_id     UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  referred_name   TEXT,
  referred_email  TEXT,
  referred_phone  TEXT,
  status          TEXT NOT NULL DEFAULT 'pending', -- pending, converted, rewarded, expired
  reward_type     TEXT, -- discount, credit, cash
  reward_amount   NUMERIC(10,2),
  reward_paid_at  TIMESTAMPTZ,
  job_id          UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
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
CREATE POLICY grow_referrals_owner_select ON public.grow_referrals FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY grow_referrals_owner_insert ON public.grow_referrals FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY grow_referrals_owner_update ON public.grow_referrals FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY grow_referrals_owner_delete ON public.grow_referrals FOR DELETE USING (auth.uid() = owner_id);
CREATE INDEX IF NOT EXISTS idx_grow_referrals_active ON public.grow_referrals (owner_id) WHERE deleted_at IS NULL;

-- grow_ad_campaigns
CREATE TABLE IF NOT EXISTS public.grow_ad_campaigns (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  platform        TEXT NOT NULL DEFAULT 'google', -- google, facebook, instagram
  objective       TEXT,
  status          TEXT NOT NULL DEFAULT 'draft', -- draft, active, paused, completed
  budget_daily    NUMERIC(10,2),
  budget_total    NUMERIC(10,2),
  spend           NUMERIC(10,2) DEFAULT 0,
  impressions     INTEGER DEFAULT 0,
  clicks          INTEGER DEFAULT 0,
  conversions     INTEGER DEFAULT 0,
  start_date      DATE,
  end_date        DATE,
  ad_copy         JSONB DEFAULT '{}',
  targeting       JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at      TIMESTAMPTZ NULL
);
ALTER TABLE public.grow_ad_campaigns ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS grow_ad_campaigns_owner_select ON public.grow_ad_campaigns;
DROP POLICY IF EXISTS grow_ad_campaigns_owner_insert ON public.grow_ad_campaigns;
DROP POLICY IF EXISTS grow_ad_campaigns_owner_update ON public.grow_ad_campaigns;
DROP POLICY IF EXISTS grow_ad_campaigns_owner_delete ON public.grow_ad_campaigns;
CREATE POLICY grow_ad_campaigns_owner_select ON public.grow_ad_campaigns FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY grow_ad_campaigns_owner_insert ON public.grow_ad_campaigns FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY grow_ad_campaigns_owner_update ON public.grow_ad_campaigns FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY grow_ad_campaigns_owner_delete ON public.grow_ad_campaigns FOR DELETE USING (auth.uid() = owner_id);
CREATE INDEX IF NOT EXISTS idx_grow_ad_campaigns_active ON public.grow_ad_campaigns (owner_id) WHERE deleted_at IS NULL;

-- =============================================
-- LEADS TABLES
-- =============================================

-- marketplace_leads
CREATE TABLE IF NOT EXISTS public.marketplace_leads (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT NOT NULL,
  description     TEXT,
  service_type    TEXT,
  suburb          TEXT,
  state           TEXT,
  postcode        TEXT,
  budget_min      NUMERIC(10,2),
  budget_max      NUMERIC(10,2),
  urgency         TEXT DEFAULT 'normal', -- urgent, normal, flexible
  contact_name    TEXT,
  contact_phone   TEXT,
  contact_email   TEXT,
  job_date        DATE,
  expires_at      TIMESTAMPTZ,
  lead_price      NUMERIC(10,2) DEFAULT 0,
  category        TEXT,
  images          TEXT[] DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at      TIMESTAMPTZ NULL
);
-- marketplace_leads is public read, no RLS owner restriction (all owners can browse)
ALTER TABLE public.marketplace_leads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS marketplace_leads_read ON public.marketplace_leads;
CREATE POLICY marketplace_leads_read ON public.marketplace_leads FOR SELECT USING (auth.role() = 'authenticated');
CREATE INDEX IF NOT EXISTS idx_marketplace_leads_active ON public.marketplace_leads (created_at DESC) WHERE deleted_at IS NULL;

-- leads_accepted (when an owner accepts/purchases a marketplace lead)
CREATE TABLE IF NOT EXISTS public.leads_accepted (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lead_id       UUID NOT NULL REFERENCES public.marketplace_leads(id) ON DELETE CASCADE,
  status        TEXT NOT NULL DEFAULT 'new', -- new, contacted, quoted, won, lost
  ai_score      INTEGER, -- 0-100
  ai_grade      TEXT,    -- A/B/C/D
  ai_summary    TEXT,
  notes         TEXT,
  accepted_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at    TIMESTAMPTZ NULL,
  UNIQUE(owner_id, lead_id)
);
ALTER TABLE public.leads_accepted ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS leads_accepted_owner_select ON public.leads_accepted;
DROP POLICY IF EXISTS leads_accepted_owner_insert ON public.leads_accepted;
DROP POLICY IF EXISTS leads_accepted_owner_update ON public.leads_accepted;
DROP POLICY IF EXISTS leads_accepted_owner_delete ON public.leads_accepted;
CREATE POLICY leads_accepted_owner_select ON public.leads_accepted FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY leads_accepted_owner_insert ON public.leads_accepted FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY leads_accepted_owner_update ON public.leads_accepted FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY leads_accepted_owner_delete ON public.leads_accepted FOR DELETE USING (auth.uid() = owner_id);
CREATE INDEX IF NOT EXISTS idx_leads_accepted_active ON public.leads_accepted (owner_id) WHERE deleted_at IS NULL;

-- lead_pipeline (kanban pipeline for owner's leads)
CREATE TABLE IF NOT EXISTS public.lead_pipeline (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  email         TEXT,
  phone         TEXT,
  source        TEXT DEFAULT 'manual', -- manual, marketplace, referral, website
  status        TEXT NOT NULL DEFAULT 'new', -- new, contacted, qualified, proposal, won, lost
  estimated_value NUMERIC(10,2),
  notes         TEXT,
  lead_id       UUID REFERENCES public.marketplace_leads(id) ON DELETE SET NULL,
  client_id     UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  ai_score      INTEGER,
  ai_grade      TEXT,
  next_follow_up DATE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at    TIMESTAMPTZ NULL
);
ALTER TABLE public.lead_pipeline ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS lead_pipeline_owner_select ON public.lead_pipeline;
DROP POLICY IF EXISTS lead_pipeline_owner_insert ON public.lead_pipeline;
DROP POLICY IF EXISTS lead_pipeline_owner_update ON public.lead_pipeline;
DROP POLICY IF EXISTS lead_pipeline_owner_delete ON public.lead_pipeline;
CREATE POLICY lead_pipeline_owner_select ON public.lead_pipeline FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY lead_pipeline_owner_insert ON public.lead_pipeline FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY lead_pipeline_owner_update ON public.lead_pipeline FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY lead_pipeline_owner_delete ON public.lead_pipeline FOR DELETE USING (auth.uid() = owner_id);
CREATE INDEX IF NOT EXISTS idx_lead_pipeline_active ON public.lead_pipeline (owner_id) WHERE deleted_at IS NULL;

-- =============================================
-- FLEET TABLES
-- =============================================

-- vehicles
CREATE TABLE IF NOT EXISTS public.vehicles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL, -- e.g. "Van 1 - Ford Transit"
  make            TEXT,
  model           TEXT,
  year            INTEGER,
  registration    TEXT,
  vin             TEXT,
  colour          TEXT,
  fuel_type       TEXT DEFAULT 'petrol',
  assigned_to     UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  odometer_km     INTEGER DEFAULT 0,
  status          TEXT DEFAULT 'active', -- active, maintenance, retired
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at      TIMESTAMPTZ NULL
);
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS vehicles_owner_select ON public.vehicles;
DROP POLICY IF EXISTS vehicles_owner_insert ON public.vehicles;
DROP POLICY IF EXISTS vehicles_owner_update ON public.vehicles;
DROP POLICY IF EXISTS vehicles_owner_delete ON public.vehicles;
CREATE POLICY vehicles_owner_select ON public.vehicles FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY vehicles_owner_insert ON public.vehicles FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY vehicles_owner_update ON public.vehicles FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY vehicles_owner_delete ON public.vehicles FOR DELETE USING (auth.uid() = owner_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_active ON public.vehicles (owner_id) WHERE deleted_at IS NULL;

-- vehicle_service_records
CREATE TABLE IF NOT EXISTS public.vehicle_service_records (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vehicle_id      UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  service_type    TEXT NOT NULL, -- oil_change, rego, inspection, tyres, major
  description     TEXT,
  service_date    DATE NOT NULL,
  odometer_at_service INTEGER,
  next_service_date DATE,
  next_service_km INTEGER,
  cost            NUMERIC(10,2),
  provider        TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at      TIMESTAMPTZ NULL
);
ALTER TABLE public.vehicle_service_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS vehicle_service_records_owner_select ON public.vehicle_service_records;
DROP POLICY IF EXISTS vehicle_service_records_owner_insert ON public.vehicle_service_records;
DROP POLICY IF EXISTS vehicle_service_records_owner_update ON public.vehicle_service_records;
DROP POLICY IF EXISTS vehicle_service_records_owner_delete ON public.vehicle_service_records;
CREATE POLICY vehicle_service_records_owner_select ON public.vehicle_service_records FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY vehicle_service_records_owner_insert ON public.vehicle_service_records FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY vehicle_service_records_owner_update ON public.vehicle_service_records FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY vehicle_service_records_owner_delete ON public.vehicle_service_records FOR DELETE USING (auth.uid() = owner_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_service_records_active ON public.vehicle_service_records (owner_id, vehicle_id) WHERE deleted_at IS NULL;

-- vehicle_trips (fuel log / trip log)
CREATE TABLE IF NOT EXISTS public.vehicle_trips (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vehicle_id      UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  driver_id       UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  job_id          UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
  trip_date       DATE NOT NULL DEFAULT CURRENT_DATE,
  start_odometer  INTEGER,
  end_odometer    INTEGER,
  distance_km     INTEGER,
  purpose         TEXT,
  fuel_litres     NUMERIC(6,2),
  fuel_cost       NUMERIC(8,2),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at      TIMESTAMPTZ NULL
);
ALTER TABLE public.vehicle_trips ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS vehicle_trips_owner_select ON public.vehicle_trips;
DROP POLICY IF EXISTS vehicle_trips_owner_insert ON public.vehicle_trips;
DROP POLICY IF EXISTS vehicle_trips_owner_update ON public.vehicle_trips;
DROP POLICY IF EXISTS vehicle_trips_owner_delete ON public.vehicle_trips;
CREATE POLICY vehicle_trips_owner_select ON public.vehicle_trips FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY vehicle_trips_owner_insert ON public.vehicle_trips FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY vehicle_trips_owner_update ON public.vehicle_trips FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY vehicle_trips_owner_delete ON public.vehicle_trips FOR DELETE USING (auth.uid() = owner_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_trips_active ON public.vehicle_trips (owner_id, vehicle_id) WHERE deleted_at IS NULL;

-- =============================================
-- FINANCE TABLES
-- =============================================

-- bank_transactions
CREATE TABLE IF NOT EXISTS public.bank_transactions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date            DATE NOT NULL,
  description     TEXT NOT NULL,
  amount          NUMERIC(12,2) NOT NULL, -- negative = debit
  category        TEXT,
  account         TEXT DEFAULT 'main',
  reconciled      BOOLEAN DEFAULT false,
  invoice_id      UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  external_id     TEXT,
  source          TEXT DEFAULT 'manual', -- manual, xero, myob, csv_import
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at      TIMESTAMPTZ NULL
);
ALTER TABLE public.bank_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS bank_transactions_owner_select ON public.bank_transactions;
DROP POLICY IF EXISTS bank_transactions_owner_insert ON public.bank_transactions;
DROP POLICY IF EXISTS bank_transactions_owner_update ON public.bank_transactions;
DROP POLICY IF EXISTS bank_transactions_owner_delete ON public.bank_transactions;
CREATE POLICY bank_transactions_owner_select ON public.bank_transactions FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY bank_transactions_owner_insert ON public.bank_transactions FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY bank_transactions_owner_update ON public.bank_transactions FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY bank_transactions_owner_delete ON public.bank_transactions FOR DELETE USING (auth.uid() = owner_id);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_active ON public.bank_transactions (owner_id, date DESC) WHERE deleted_at IS NULL;

-- expense_claims
CREATE TABLE IF NOT EXISTS public.expense_claims (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  submitted_by    UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  description     TEXT NOT NULL,
  amount          NUMERIC(10,2) NOT NULL,
  gst_amount      NUMERIC(10,2),
  category        TEXT,
  receipt_url     TEXT,
  job_id          UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
  status          TEXT DEFAULT 'pending', -- pending, approved, rejected, paid
  approved_by     UUID REFERENCES auth.users(id),
  approved_at     TIMESTAMPTZ,
  paid_at         TIMESTAMPTZ,
  expense_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at      TIMESTAMPTZ NULL
);
ALTER TABLE public.expense_claims ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS expense_claims_owner_select ON public.expense_claims;
DROP POLICY IF EXISTS expense_claims_owner_insert ON public.expense_claims;
DROP POLICY IF EXISTS expense_claims_owner_update ON public.expense_claims;
DROP POLICY IF EXISTS expense_claims_owner_delete ON public.expense_claims;
CREATE POLICY expense_claims_owner_select ON public.expense_claims FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY expense_claims_owner_insert ON public.expense_claims FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY expense_claims_owner_update ON public.expense_claims FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY expense_claims_owner_delete ON public.expense_claims FOR DELETE USING (auth.uid() = owner_id);
CREATE INDEX IF NOT EXISTS idx_expense_claims_active ON public.expense_claims (owner_id) WHERE deleted_at IS NULL;

-- bas_lodgements
CREATE TABLE IF NOT EXISTS public.bas_lodgements (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period_start    DATE NOT NULL,
  period_end      DATE NOT NULL,
  quarter         TEXT, -- e.g. Q1 FY2026
  gst_collected   NUMERIC(12,2) DEFAULT 0,
  gst_paid        NUMERIC(12,2) DEFAULT 0,
  gst_net         NUMERIC(12,2) DEFAULT 0,
  total_sales     NUMERIC(12,2) DEFAULT 0,
  total_purchases NUMERIC(12,2) DEFAULT 0,
  status          TEXT DEFAULT 'draft', -- draft, prepared, lodged, assessed
  lodged_at       TIMESTAMPTZ,
  ato_reference   TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at      TIMESTAMPTZ NULL
);
ALTER TABLE public.bas_lodgements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS bas_lodgements_owner_select ON public.bas_lodgements;
DROP POLICY IF EXISTS bas_lodgements_owner_insert ON public.bas_lodgements;
DROP POLICY IF EXISTS bas_lodgements_owner_update ON public.bas_lodgements;
DROP POLICY IF EXISTS bas_lodgements_owner_delete ON public.bas_lodgements;
CREATE POLICY bas_lodgements_owner_select ON public.bas_lodgements FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY bas_lodgements_owner_insert ON public.bas_lodgements FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY bas_lodgements_owner_update ON public.bas_lodgements FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY bas_lodgements_owner_delete ON public.bas_lodgements FOR DELETE USING (auth.uid() = owner_id);
CREATE INDEX IF NOT EXISTS idx_bas_lodgements_active ON public.bas_lodgements (owner_id) WHERE deleted_at IS NULL;

-- =============================================
-- HIRE TABLES
-- =============================================

-- job_postings
CREATE TABLE IF NOT EXISTS public.job_postings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  description     TEXT,
  employment_type TEXT DEFAULT 'full_time', -- full_time, part_time, casual, subcontractor
  trade           TEXT,
  location        TEXT,
  salary_min      NUMERIC(10,2),
  salary_max      NUMERIC(10,2),
  salary_type     TEXT DEFAULT 'annual', -- annual, hourly, daily
  requirements    TEXT[] DEFAULT '{}',
  status          TEXT DEFAULT 'draft', -- draft, published, closed, filled
  published_at    TIMESTAMPTZ,
  closes_at       TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at      TIMESTAMPTZ NULL
);
ALTER TABLE public.job_postings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS job_postings_owner_select ON public.job_postings;
DROP POLICY IF EXISTS job_postings_owner_insert ON public.job_postings;
DROP POLICY IF EXISTS job_postings_owner_update ON public.job_postings;
DROP POLICY IF EXISTS job_postings_owner_delete ON public.job_postings;
CREATE POLICY job_postings_owner_select ON public.job_postings FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY job_postings_owner_insert ON public.job_postings FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY job_postings_owner_update ON public.job_postings FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY job_postings_owner_delete ON public.job_postings FOR DELETE USING (auth.uid() = owner_id);
CREATE INDEX IF NOT EXISTS idx_job_postings_active ON public.job_postings (owner_id) WHERE deleted_at IS NULL;

-- job_applications
CREATE TABLE IF NOT EXISTS public.job_applications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  posting_id      UUID REFERENCES public.job_postings(id) ON DELETE SET NULL,
  applicant_name  TEXT NOT NULL,
  applicant_email TEXT,
  applicant_phone TEXT,
  resume_url      TEXT,
  cover_letter    TEXT,
  stage           TEXT DEFAULT 'applied', -- applied, screening, interview, offer, hired, rejected
  rating          INTEGER CHECK (rating BETWEEN 1 AND 5),
  notes           TEXT,
  interview_date  TIMESTAMPTZ,
  applied_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at      TIMESTAMPTZ NULL
);
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS job_applications_owner_select ON public.job_applications;
DROP POLICY IF EXISTS job_applications_owner_insert ON public.job_applications;
DROP POLICY IF EXISTS job_applications_owner_update ON public.job_applications;
DROP POLICY IF EXISTS job_applications_owner_delete ON public.job_applications;
CREATE POLICY job_applications_owner_select ON public.job_applications FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY job_applications_owner_insert ON public.job_applications FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY job_applications_owner_update ON public.job_applications FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY job_applications_owner_delete ON public.job_applications FOR DELETE USING (auth.uid() = owner_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_active ON public.job_applications (owner_id, stage) WHERE deleted_at IS NULL;

-- onboarding_checklists (for new hire onboarding)
CREATE TABLE IF NOT EXISTS public.onboarding_tasks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_id     UUID REFERENCES public.employees(id) ON DELETE CASCADE,
  task            TEXT NOT NULL,
  category        TEXT DEFAULT 'admin', -- admin, safety, training, access
  completed       BOOLEAN DEFAULT false,
  completed_at    TIMESTAMPTZ,
  due_date        DATE,
  order_index     INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at      TIMESTAMPTZ NULL
);
ALTER TABLE public.onboarding_tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS onboarding_tasks_owner_select ON public.onboarding_tasks;
DROP POLICY IF EXISTS onboarding_tasks_owner_insert ON public.onboarding_tasks;
DROP POLICY IF EXISTS onboarding_tasks_owner_update ON public.onboarding_tasks;
DROP POLICY IF EXISTS onboarding_tasks_owner_delete ON public.onboarding_tasks;
CREATE POLICY onboarding_tasks_owner_select ON public.onboarding_tasks FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY onboarding_tasks_owner_insert ON public.onboarding_tasks FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY onboarding_tasks_owner_update ON public.onboarding_tasks FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY onboarding_tasks_owner_delete ON public.onboarding_tasks FOR DELETE USING (auth.uid() = owner_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_tasks_active ON public.onboarding_tasks (owner_id, employee_id) WHERE deleted_at IS NULL;

-- =============================================
-- ANSWER TABLES
-- =============================================

-- call_logs
CREATE TABLE IF NOT EXISTS public.call_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  caller_number   TEXT,
  caller_name     TEXT,
  direction       TEXT DEFAULT 'inbound',
  duration_seconds INTEGER DEFAULT 0,
  outcome         TEXT DEFAULT 'answered', -- answered, missed, voicemail, booked
  transcript      TEXT,
  recording_url   TEXT,
  client_id       UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  job_id          UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
  ai_summary      TEXT,
  twilio_sid      TEXT,
  called_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at      TIMESTAMPTZ NULL
);
ALTER TABLE public.call_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS call_logs_owner_select ON public.call_logs;
DROP POLICY IF EXISTS call_logs_owner_insert ON public.call_logs;
DROP POLICY IF EXISTS call_logs_owner_update ON public.call_logs;
DROP POLICY IF EXISTS call_logs_owner_delete ON public.call_logs;
CREATE POLICY call_logs_owner_select ON public.call_logs FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY call_logs_owner_insert ON public.call_logs FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY call_logs_owner_update ON public.call_logs FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY call_logs_owner_delete ON public.call_logs FOR DELETE USING (auth.uid() = owner_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_active ON public.call_logs (owner_id, called_at DESC) WHERE deleted_at IS NULL;

-- =============================================
-- PAY TABLES
-- =============================================

-- payment_transactions
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invoice_id      UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  client_id       UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  amount          NUMERIC(12,2) NOT NULL,
  currency        TEXT DEFAULT 'AUD',
  payment_method  TEXT, -- card, bank_transfer, cash, cheque
  status          TEXT DEFAULT 'pending', -- pending, succeeded, failed, refunded
  stripe_pi_id    TEXT,
  stripe_charge_id TEXT,
  fee_amount      NUMERIC(10,2),
  net_amount      NUMERIC(12,2),
  paid_at         TIMESTAMPTZ,
  description     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at      TIMESTAMPTZ NULL
);
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS payment_transactions_owner_select ON public.payment_transactions;
DROP POLICY IF EXISTS payment_transactions_owner_insert ON public.payment_transactions;
DROP POLICY IF EXISTS payment_transactions_owner_update ON public.payment_transactions;
DROP POLICY IF EXISTS payment_transactions_owner_delete ON public.payment_transactions;
CREATE POLICY payment_transactions_owner_select ON public.payment_transactions FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY payment_transactions_owner_insert ON public.payment_transactions FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY payment_transactions_owner_update ON public.payment_transactions FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY payment_transactions_owner_delete ON public.payment_transactions FOR DELETE USING (auth.uid() = owner_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_active ON public.payment_transactions (owner_id, paid_at DESC) WHERE deleted_at IS NULL;

-- =============================================
-- SEED: marketplace_leads demo data
-- =============================================
INSERT INTO public.marketplace_leads (title, description, service_type, suburb, state, postcode, budget_min, budget_max, urgency, contact_name, category, lead_price)
VALUES
  ('Hot water system replacement â€” 80L unit burst', 'Our hot water system burst overnight. Need urgent replacement. 80L gas unit.', 'plumbing', 'Randwick', 'NSW', '2031', 800, 2000, 'urgent', 'Sarah M.', 'plumbing', 15.00),
  ('Bathroom renovation â€” full gut', 'Gut and retile bathroom, new vanity, new shower screen. 3m x 2m.', 'renovation', 'Newtown', 'NSW', '2042', 8000, 15000, 'normal', 'James K.', 'renovation', 25.00),
  ('Split system AC installation x2', 'Need 2x 3.5kW split systems installed in bedrooms. Wiring included.', 'electrical', 'Parramatta', 'NSW', '2150', 2000, 4000, 'normal', 'David L.', 'electrical', 20.00),
  ('End of lease clean â€” 3BR apartment', '3 bedroom apartment, need full bond clean including oven, carpets, walls.', 'cleaning', 'Surry Hills', 'NSW', '2010', 300, 600, 'urgent', 'Emma T.', 'cleaning', 8.00),
  ('Fence repair after storm â€” 15m timber', '15 metres of timber paling fence down after last night''s storm. Need quotes ASAP.', 'fencing', 'Penrith', 'NSW', '2750', 1500, 3500, 'urgent', 'Michael B.', 'fencing', 12.00),
  ('Electrician â€” power outage half house', 'Half the house lost power, suspect circuit board fault. Need licensed electrician.', 'electrical', 'Manly', 'NSW', '2095', 150, 500, 'urgent', 'Lisa P.', 'electrical', 10.00),
  ('Roof inspection + minor repairs', 'Noticed some tiles shifting after heavy rain. Need inspection and quote for repairs.', 'roofing', 'Hornsby', 'NSW', '2077', 500, 2000, 'normal', 'Robert C.', 'roofing', 12.00),
  ('Blocked drains x3 â€” kitchen + 2 bathrooms', 'Multiple slow drains throughout house. Need CCTV inspection and clearing.', 'plumbing', 'Bondi', 'NSW', '2026', 300, 800, 'normal', 'Jennifer A.', 'plumbing', 10.00)
ON CONFLICT DO NOTHING;
-- Quote public token (for shareable quote links)
ALTER TABLE public.quotes
  ADD COLUMN IF NOT EXISTS public_token TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS signed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS signed_by_name TEXT,
  ADD COLUMN IF NOT EXISTS signed_ip TEXT,
  ADD COLUMN IF NOT EXISTS signature_data TEXT,
  ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS parent_quote_id UUID REFERENCES public.quotes(id),
  ADD COLUMN IF NOT EXISTS expiry_date DATE;

-- Index for fast public token lookups
CREATE INDEX IF NOT EXISTS idx_quotes_public_token ON public.quotes (public_token) WHERE public_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_quotes_parent ON public.quotes (parent_quote_id) WHERE parent_quote_id IS NOT NULL;

-- Invoice partial payments
CREATE TABLE IF NOT EXISTS public.invoice_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id),
  invoice_id UUID NOT NULL,
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT NOT NULL DEFAULT 'bank_transfer',
  reference TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

ALTER TABLE public.invoice_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY invoice_payments_owner_select ON public.invoice_payments FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY invoice_payments_owner_insert ON public.invoice_payments FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY invoice_payments_owner_update ON public.invoice_payments FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY invoice_payments_owner_delete ON public.invoice_payments FOR DELETE USING (auth.uid() = owner_id);

CREATE INDEX IF NOT EXISTS idx_invoice_payments_active ON public.invoice_payments (owner_id, invoice_id) WHERE deleted_at IS NULL;

-- Invoice late fees / recurring
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS late_fee_percent NUMERIC(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS late_fee_applied_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS recurring_interval TEXT, -- 'weekly' | 'fortnightly' | 'monthly' | 'quarterly' | 'annually'
  ADD COLUMN IF NOT EXISTS recurring_next_date DATE,
  ADD COLUMN IF NOT EXISTS amount_paid NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_terms_days INTEGER DEFAULT 14;
-- Add is_demo flag to purchase_orders and timesheets so demo seed rows
-- can be tagged and selectively removed without touching real data.

ALTER TABLE public.purchase_orders
  ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;

ALTER TABLE public.timesheets
  ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_purchase_orders_owner_demo
  ON public.purchase_orders (owner_id) WHERE is_demo = true;

CREATE INDEX IF NOT EXISTS idx_timesheets_demo
  ON public.timesheets (employee_id) WHERE is_demo = true;

COMMENT ON COLUMN public.purchase_orders.is_demo IS 'Template PO seeded at signup; can be removed without affecting real data';
COMMENT ON COLUMN public.timesheets.is_demo IS 'Template timesheet entry seeded at signup';
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
-- 20260513100000 â€” Add estimated_value and updated_at to leads_accepted
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
-- Add job_id to invoices so auto-generated invoices (from job completion) can be
-- linked back to the originating job.

ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS job_id uuid REFERENCES public.jobs (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_invoices_job_id ON public.invoices (job_id) WHERE job_id IS NOT NULL;
-- Add external_id column to sms_messages for Twilio SID tracking
ALTER TABLE sms_messages ADD COLUMN IF NOT EXISTS external_id TEXT;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_sms_messages_owner_client ON sms_messages (owner_id, client_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_sms_messages_external_id ON sms_messages (external_id) WHERE external_id IS NOT NULL;
-- Brand kit fields on businesses table
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS tagline        TEXT,
  ADD COLUMN IF NOT EXISTS brand_voice    TEXT CHECK (brand_voice IN ('professional', 'friendly', 'authoritative')),
  ADD COLUMN IF NOT EXISTS logo_url       TEXT;
-- Add employee_id column to expense_claims for direct user ID lookups
-- (submitted_by references employees.id, but employee user id is needed for RLS)
ALTER TABLE public.expense_claims
  ADD COLUMN IF NOT EXISTS employee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS notes       TEXT,
  ADD COLUMN IF NOT EXISTS submitted_at DATE;

CREATE INDEX IF NOT EXISTS idx_expense_claims_employee_id ON public.expense_claims (employee_id);
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
