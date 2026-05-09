-- Invitation lookup/acceptance is handled by server routes using the service role.
-- Do not expose invite tokens through a broad SELECT policy on the public API.

ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS team_invitations_accept ON public.team_invitations;
DROP POLICY IF EXISTS team_invitations_owner ON public.team_invitations;
DROP POLICY IF EXISTS team_invitations_owner_select ON public.team_invitations;
DROP POLICY IF EXISTS team_invitations_owner_insert ON public.team_invitations;
DROP POLICY IF EXISTS team_invitations_owner_update ON public.team_invitations;
DROP POLICY IF EXISTS team_invitations_owner_delete ON public.team_invitations;

CREATE POLICY team_invitations_owner_select
  ON public.team_invitations
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.businesses b
      WHERE b.id = team_invitations.business_id
        AND b.owner_id = auth.uid()
    )
  );

CREATE POLICY team_invitations_owner_insert
  ON public.team_invitations
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.businesses b
      WHERE b.id = team_invitations.business_id
        AND b.owner_id = auth.uid()
    )
  );

CREATE POLICY team_invitations_owner_update
  ON public.team_invitations
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.businesses b
      WHERE b.id = team_invitations.business_id
        AND b.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.businesses b
      WHERE b.id = team_invitations.business_id
        AND b.owner_id = auth.uid()
    )
  );

CREATE POLICY team_invitations_owner_delete
  ON public.team_invitations
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.businesses b
      WHERE b.id = team_invitations.business_id
        AND b.owner_id = auth.uid()
    )
  );

GRANT ALL ON TABLE public.team_invitations TO service_role;

NOTIFY pgrst, 'reload schema';
