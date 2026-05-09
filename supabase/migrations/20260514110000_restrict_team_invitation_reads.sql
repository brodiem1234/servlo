-- Invite acceptance is handled by server routes with the service role.
-- A permissive SELECT policy exposes every invite token to any authenticated user.
DROP POLICY IF EXISTS team_invitations_accept ON public.team_invitations;

NOTIFY pgrst, 'reload schema';
