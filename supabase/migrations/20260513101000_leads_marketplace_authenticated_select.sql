-- Restore the intended authenticated-only marketplace visibility.
-- 20260508000000_overnight_complete recreated this policy without TO authenticated,
-- making it apply to PUBLIC and exposing marketplace rows to anon if table grants allow it.

ALTER TABLE public.leads_marketplace ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS leads_marketplace_select ON public.leads_marketplace;
CREATE POLICY leads_marketplace_select ON public.leads_marketplace
  FOR SELECT TO authenticated
  USING (true);

NOTIFY pgrst, 'reload schema';
