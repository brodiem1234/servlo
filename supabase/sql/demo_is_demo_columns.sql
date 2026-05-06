-- Demo/template rows for new owner accounts. Apply in Supabase SQL Editor.
-- Keeps sample data marked so it can be hidden once real records exist.

ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_clients_owner_demo ON public.clients (owner_id) WHERE is_demo = TRUE;
CREATE INDEX IF NOT EXISTS idx_jobs_owner_demo ON public.jobs (owner_id) WHERE is_demo = TRUE;
CREATE INDEX IF NOT EXISTS idx_invoices_owner_demo ON public.invoices (owner_id) WHERE is_demo = TRUE;

COMMENT ON COLUMN public.clients.is_demo IS 'Template row seeded at signup; hidden when owner has real clients';
COMMENT ON COLUMN public.employees.is_demo IS 'Template employee; hidden when owner has real employees';
COMMENT ON COLUMN public.jobs.is_demo IS 'Template job; hidden when owner has real jobs';
COMMENT ON COLUMN public.quotes.is_demo IS 'Template quote; hidden when owner has real quotes';
COMMENT ON COLUMN public.invoices.is_demo IS 'Template invoice; excluded from financial actions';
