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
