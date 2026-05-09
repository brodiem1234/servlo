DROP POLICY IF EXISTS team_invitations_accept ON public.team_invitations;
DROP POLICY IF EXISTS team_invitations_owner ON public.team_invitations;

CREATE POLICY team_invitations_owner_select ON public.team_invitations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.businesses
      WHERE businesses.id = team_invitations.business_id
        AND businesses.owner_id = auth.uid()
    )
  );

CREATE POLICY team_invitations_owner_insert ON public.team_invitations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    invited_by_user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.businesses
      WHERE businesses.id = team_invitations.business_id
        AND businesses.owner_id = auth.uid()
    )
  );

CREATE POLICY team_invitations_owner_update ON public.team_invitations
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.businesses
      WHERE businesses.id = team_invitations.business_id
        AND businesses.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.businesses
      WHERE businesses.id = team_invitations.business_id
        AND businesses.owner_id = auth.uid()
    )
  );

CREATE POLICY team_invitations_owner_delete ON public.team_invitations
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.businesses
      WHERE businesses.id = team_invitations.business_id
        AND businesses.owner_id = auth.uid()
    )
  );
