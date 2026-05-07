-- Owner app queries use jobs.owner_id = auth.uid(). Legacy templates used profiles.business_id; many accounts have NULL business_id → empty lists.
-- Also allow employees to SELECT jobs assigned to them (matches employees.email to JWT email, or legacy employee_id = auth.uid()).

ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners can manage jobs; employees read assigned" ON public.jobs;
DROP POLICY IF EXISTS jobs_owner_all ON public.jobs;
DROP POLICY IF EXISTS jobs_select_owner ON public.jobs;
DROP POLICY IF EXISTS jobs_employee_select ON public.jobs;
DROP POLICY IF EXISTS jobs_employee_auth_id ON public.jobs;

CREATE POLICY jobs_owner_all ON public.jobs
  FOR ALL TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY jobs_employee_select ON public.jobs
  FOR SELECT TO authenticated
  USING (
    employee_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.employees e
      WHERE e.id = jobs.employee_id
        AND lower(trim(coalesce(e.email, ''))) = lower(trim(coalesce((auth.jwt() ->> 'email')::text, '')))
    )
  );

CREATE POLICY jobs_employee_auth_id ON public.jobs
  FOR SELECT TO authenticated
  USING (jobs.employee_id = auth.uid());

GRANT ALL ON TABLE public.jobs TO service_role;

NOTIFY pgrst, 'reload schema';
