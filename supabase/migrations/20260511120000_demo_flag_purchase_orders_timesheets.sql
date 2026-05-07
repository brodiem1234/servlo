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
