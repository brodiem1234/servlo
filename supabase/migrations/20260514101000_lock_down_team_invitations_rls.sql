-- Invitation tokens are bearer credentials delivered by email. Do not expose
-- them through public RLS; accept flows use server-side service-role lookups.

ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS team_invitations_accept ON public.team_invitations;
DROP POLICY IF EXISTS team_invitations_owner ON public.team_invitations;
DROP POLICY IF EXISTS team_invitations_owner_select ON public.team_invitations;
DROP POLICY IF EXISTS team_invitations_owner_insert ON public.team_invitations;
DROP POLICY IF EXISTS team_invitations_owner_update ON public.team_invitations;
DROP POLICY IF EXISTS team_invitations_owner_delete ON public.team_invitations;

CREATE POLICY team_invitations_owner_select ON public.team_invitations
  FOR SELECT TO authenticated
  USING (
    business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid())
  );

CREATE POLICY team_invitations_owner_insert ON public.team_invitations
  FOR INSERT TO authenticated
  WITH CHECK (
    business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid())
  );

CREATE POLICY team_invitations_owner_update ON public.team_invitations
  FOR UPDATE TO authenticated
  USING (
    business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid())
  )
  WITH CHECK (
    business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid())
  );

CREATE POLICY team_invitations_owner_delete ON public.team_invitations
  FOR DELETE TO authenticated
  USING (
    business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid())
  );

NOTIFY pgrst, 'reload schema';
