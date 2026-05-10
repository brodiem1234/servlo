-- Add employee_id column to expense_claims for direct user ID lookups
-- (submitted_by references employees.id, but employee user id is needed for RLS)
ALTER TABLE public.expense_claims
  ADD COLUMN IF NOT EXISTS employee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS notes       TEXT,
  ADD COLUMN IF NOT EXISTS submitted_at DATE;

CREATE INDEX IF NOT EXISTS idx_expense_claims_employee_id ON public.expense_claims (employee_id);
