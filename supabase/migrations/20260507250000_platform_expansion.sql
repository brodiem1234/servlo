-- Platform Expansion migration — safe to re-run (IF NOT EXISTS / IF NOT EXISTS guards)

-- ─── New tables ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.job_materials (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id      uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  description text NOT NULL,
  qty         numeric NOT NULL DEFAULT 1,
  unit        text,
  unit_cost   numeric NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type       text NOT NULL,
  title      text NOT NULL,
  body       text,
  action_url text,
  read       boolean NOT NULL DEFAULT false,
  read_at    timestamptz,
  message    text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.lead_alert_preferences (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service_types text[],
  suburbs       text[],
  radius_km     integer DEFAULT 25,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.client_enquiries (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id      uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  owner_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service_type   text,
  description    text,
  preferred_date date,
  urgency        text,
  status         text NOT NULL DEFAULT 'new',
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- ─── jobs columns ─────────────────────────────────────────────────────────────
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS recurrence_rule      text;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS recurrence_group_id  uuid;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS digital_signoff_image text;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS signoff_name         text;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS signoff_at           timestamptz;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS materials_cost       numeric;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS labour_hours         numeric;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS hourly_rate          numeric;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS job_type             text;

-- ─── businesses columns ───────────────────────────────────────────────────────
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS logo_url           text;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS google_review_url  text;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS referral_code      text UNIQUE;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS suburb             text;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS state              text;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS postcode           text;

-- ─── profiles columns ────────────────────────────────────────────────────────
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS notification_preferences jsonb NOT NULL DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_completed     boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stripe_customer_id       text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stripe_subscription_id   text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS card_last4               text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS card_brand               text;

-- ─── grow_referrals columns ───────────────────────────────────────────────────
ALTER TABLE public.grow_referrals ADD COLUMN IF NOT EXISTS estimated_value numeric;
ALTER TABLE public.grow_referrals ADD COLUMN IF NOT EXISTS reward_amount   numeric DEFAULT 50;
ALTER TABLE public.grow_referrals ADD COLUMN IF NOT EXISTS referred_name   text;
ALTER TABLE public.grow_referrals ADD COLUMN IF NOT EXISTS chased_up_at    timestamptz;

-- ─── grow_campaigns columns ───────────────────────────────────────────────────
ALTER TABLE public.grow_campaigns ADD COLUMN IF NOT EXISTS goal           text;
ALTER TABLE public.grow_campaigns ADD COLUMN IF NOT EXISTS target_suburb  text;
ALTER TABLE public.grow_campaigns ADD COLUMN IF NOT EXISTS target_radius  integer DEFAULT 10;
ALTER TABLE public.grow_campaigns ADD COLUMN IF NOT EXISTS headline       text;
ALTER TABLE public.grow_campaigns ADD COLUMN IF NOT EXISTS primary_text   text;
ALTER TABLE public.grow_campaigns ADD COLUMN IF NOT EXISTS cta            text;

-- ─── RLS ──────────────────────────────────────────────────────────────────────
ALTER TABLE public.job_materials        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_alert_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_enquiries     ENABLE ROW LEVEL SECURITY;

-- job_materials: owner access via jobs.owner_id
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='job_materials' AND policyname='job_materials_owner'
  ) THEN
    CREATE POLICY job_materials_owner ON public.job_materials
      FOR ALL TO authenticated
      USING (EXISTS (
        SELECT 1 FROM public.jobs j WHERE j.id = job_materials.job_id AND j.owner_id = auth.uid()
      ));
  END IF;
END $$;

-- notifications
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='notifications' AND policyname='notifications_owner_select'
  ) THEN
    CREATE POLICY notifications_owner_select ON public.notifications FOR SELECT TO authenticated USING (owner_id = auth.uid());
    CREATE POLICY notifications_owner_insert ON public.notifications FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
    CREATE POLICY notifications_owner_update ON public.notifications FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
    CREATE POLICY notifications_owner_delete ON public.notifications FOR DELETE TO authenticated USING (owner_id = auth.uid());
  END IF;
END $$;

-- lead_alert_preferences
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='lead_alert_preferences' AND policyname='lead_alerts_owner_select'
  ) THEN
    CREATE POLICY lead_alerts_owner_select ON public.lead_alert_preferences FOR SELECT TO authenticated USING (owner_id = auth.uid());
    CREATE POLICY lead_alerts_owner_insert ON public.lead_alert_preferences FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
    CREATE POLICY lead_alerts_owner_update ON public.lead_alert_preferences FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
    CREATE POLICY lead_alerts_owner_delete ON public.lead_alert_preferences FOR DELETE TO authenticated USING (owner_id = auth.uid());
  END IF;
END $$;

-- client_enquiries
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='client_enquiries' AND policyname='client_enquiries_owner_select'
  ) THEN
    CREATE POLICY client_enquiries_owner_select ON public.client_enquiries FOR SELECT TO authenticated USING (owner_id = auth.uid());
    CREATE POLICY client_enquiries_owner_insert ON public.client_enquiries FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
    CREATE POLICY client_enquiries_owner_update ON public.client_enquiries FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
    CREATE POLICY client_enquiries_owner_delete ON public.client_enquiries FOR DELETE TO authenticated USING (owner_id = auth.uid());
  END IF;
END $$;
