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
