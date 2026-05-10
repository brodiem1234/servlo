-- Overnight deep build: add depth columns to core tables
-- All ADD COLUMN IF NOT EXISTS — safe to run multiple times

-- JOBS: new columns for richer job management
ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS job_number TEXT,
  ADD COLUMN IF NOT EXISTS recurrence_end_date DATE,
  ADD COLUMN IF NOT EXISTS recurrence_parent_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS internal_notes TEXT,
  ADD COLUMN IF NOT EXISTS completion_notes TEXT,
  ADD COLUMN IF NOT EXISTS labour_cost NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS travel_time_mins INTEGER,
  ADD COLUMN IF NOT EXISTS checklist JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Index for quick job number lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_jobs_job_number_owner
  ON public.jobs(owner_id, job_number)
  WHERE job_number IS NOT NULL AND deleted_at IS NULL;

-- CLIENTS: CRM depth columns
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS company_name TEXT,
  ADD COLUMN IF NOT EXISTS abn TEXT,
  ADD COLUMN IF NOT EXISTS billing_address TEXT,
  ADD COLUMN IF NOT EXISTS client_type TEXT DEFAULT 'residential',
  ADD COLUMN IF NOT EXISTS credit_limit NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS payment_terms_days INTEGER DEFAULT 14,
  ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS do_not_contact BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS nps_score INTEGER,
  ADD COLUMN IF NOT EXISTS last_contacted_at TIMESTAMPTZ;

-- INVOICES: professional invoice columns
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS purchase_order_ref TEXT,
  ADD COLUMN IF NOT EXISTS footer_text TEXT,
  ADD COLUMN IF NOT EXISTS discount_percent NUMERIC(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS viewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS partial_payments JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS payment_terms_days INTEGER DEFAULT 14,
  ADD COLUMN IF NOT EXISTS late_fee_percent NUMERIC(5,2) DEFAULT 0;

-- QUOTES: professional quote columns
ALTER TABLE public.quotes
  ADD COLUMN IF NOT EXISTS quote_number TEXT,
  ADD COLUMN IF NOT EXISTS terms TEXT,
  ADD COLUMN IF NOT EXISTS discount_percent NUMERIC(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS revision_number INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS optional_items JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS sections JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS viewed_at TIMESTAMPTZ;

-- Index for job number uniqueness per owner
CREATE INDEX IF NOT EXISTS idx_clients_owner_type ON public.clients(owner_id, client_type);
CREATE INDEX IF NOT EXISTS idx_clients_tags ON public.clients USING GIN(tags);
