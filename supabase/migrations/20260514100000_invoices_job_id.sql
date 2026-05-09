-- Add job_id to invoices so auto-generated invoices (from job completion) can be
-- linked back to the originating job.

ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS job_id uuid REFERENCES public.jobs (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_invoices_job_id ON public.invoices (job_id) WHERE job_id IS NOT NULL;
