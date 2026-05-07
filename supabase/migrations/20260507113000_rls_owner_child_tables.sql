-- Ensure owner-scoped access for child tables used by owner dashboard pages.
-- Safe to run repeatedly.

ALTER TABLE IF EXISTS public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.timesheets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS invoice_items_owner_select ON public.invoice_items;
DROP POLICY IF EXISTS invoice_items_owner_insert ON public.invoice_items;
DROP POLICY IF EXISTS invoice_items_owner_update ON public.invoice_items;
DROP POLICY IF EXISTS invoice_items_owner_delete ON public.invoice_items;

CREATE POLICY invoice_items_owner_select ON public.invoice_items
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.invoices i
      WHERE i.id = invoice_items.invoice_id
        AND i.owner_id = auth.uid()
    )
  );

CREATE POLICY invoice_items_owner_insert ON public.invoice_items
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.invoices i
      WHERE i.id = invoice_items.invoice_id
        AND i.owner_id = auth.uid()
    )
  );

CREATE POLICY invoice_items_owner_update ON public.invoice_items
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.invoices i
      WHERE i.id = invoice_items.invoice_id
        AND i.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.invoices i
      WHERE i.id = invoice_items.invoice_id
        AND i.owner_id = auth.uid()
    )
  );

CREATE POLICY invoice_items_owner_delete ON public.invoice_items
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.invoices i
      WHERE i.id = invoice_items.invoice_id
        AND i.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS quote_items_owner_select ON public.quote_items;
DROP POLICY IF EXISTS quote_items_owner_insert ON public.quote_items;
DROP POLICY IF EXISTS quote_items_owner_update ON public.quote_items;
DROP POLICY IF EXISTS quote_items_owner_delete ON public.quote_items;

CREATE POLICY quote_items_owner_select ON public.quote_items
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.quotes q
      WHERE q.id = quote_items.quote_id
        AND q.owner_id = auth.uid()
    )
  );

CREATE POLICY quote_items_owner_insert ON public.quote_items
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.quotes q
      WHERE q.id = quote_items.quote_id
        AND q.owner_id = auth.uid()
    )
  );

CREATE POLICY quote_items_owner_update ON public.quote_items
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.quotes q
      WHERE q.id = quote_items.quote_id
        AND q.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.quotes q
      WHERE q.id = quote_items.quote_id
        AND q.owner_id = auth.uid()
    )
  );

CREATE POLICY quote_items_owner_delete ON public.quote_items
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.quotes q
      WHERE q.id = quote_items.quote_id
        AND q.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS timesheets_owner_select ON public.timesheets;
DROP POLICY IF EXISTS timesheets_owner_insert ON public.timesheets;
DROP POLICY IF EXISTS timesheets_owner_update ON public.timesheets;
DROP POLICY IF EXISTS timesheets_owner_delete ON public.timesheets;
DROP POLICY IF EXISTS timesheets_employee_self_select ON public.timesheets;
DROP POLICY IF EXISTS timesheets_employee_self_insert ON public.timesheets;
DROP POLICY IF EXISTS timesheets_employee_self_update ON public.timesheets;
DROP POLICY IF EXISTS timesheets_employee_self_delete ON public.timesheets;

CREATE POLICY timesheets_owner_select ON public.timesheets
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.employees e
      WHERE e.id = timesheets.employee_id
        AND e.owner_id = auth.uid()
    )
  );

CREATE POLICY timesheets_owner_insert ON public.timesheets
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.employees e
      WHERE e.id = timesheets.employee_id
        AND e.owner_id = auth.uid()
    )
  );

CREATE POLICY timesheets_owner_update ON public.timesheets
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.employees e
      WHERE e.id = timesheets.employee_id
        AND e.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.employees e
      WHERE e.id = timesheets.employee_id
        AND e.owner_id = auth.uid()
    )
  );

CREATE POLICY timesheets_owner_delete ON public.timesheets
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.employees e
      WHERE e.id = timesheets.employee_id
        AND e.owner_id = auth.uid()
    )
  );

CREATE POLICY timesheets_employee_self_select ON public.timesheets
  FOR SELECT TO authenticated
  USING (employee_id = auth.uid());

CREATE POLICY timesheets_employee_self_insert ON public.timesheets
  FOR INSERT TO authenticated
  WITH CHECK (employee_id = auth.uid());

CREATE POLICY timesheets_employee_self_update ON public.timesheets
  FOR UPDATE TO authenticated
  USING (employee_id = auth.uid())
  WITH CHECK (employee_id = auth.uid());

CREATE POLICY timesheets_employee_self_delete ON public.timesheets
  FOR DELETE TO authenticated
  USING (employee_id = auth.uid());

GRANT ALL ON TABLE public.invoice_items TO service_role;
GRANT ALL ON TABLE public.quote_items TO service_role;
GRANT ALL ON TABLE public.timesheets TO service_role;

NOTIFY pgrst, 'reload schema';
