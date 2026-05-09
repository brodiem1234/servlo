-- The invite acceptance flow uses service-role lookups by token.
-- Do not expose raw invitation rows through permissive RLS.
DROP POLICY IF EXISTS team_invitations_accept ON public.team_invitations;
