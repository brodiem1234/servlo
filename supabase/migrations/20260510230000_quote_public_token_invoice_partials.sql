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
