-- Close invite-token leakage and prevent employees from seeing soft-deleted jobs.

DROP POLICY IF EXISTS team_invitations_accept ON public.team_invitations;

DROP POLICY IF EXISTS jobs_employee_select ON public.jobs;
DROP POLICY IF EXISTS jobs_employee_auth_id ON public.jobs;

CREATE POLICY jobs_employee_select ON public.jobs
  FOR SELECT TO authenticated
  USING (
    deleted_at IS NULL
    AND employee_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.employees e
      WHERE e.id = jobs.employee_id
        AND lower(trim(coalesce(e.email, ''))) = lower(trim(coalesce((auth.jwt() ->> 'email')::text, '')))
    )
  );

CREATE POLICY jobs_employee_auth_id ON public.jobs
  FOR SELECT TO authenticated
  USING (
    deleted_at IS NULL
    AND jobs.employee_id = auth.uid()
  );

NOTIFY pgrst, 'reload schema';
