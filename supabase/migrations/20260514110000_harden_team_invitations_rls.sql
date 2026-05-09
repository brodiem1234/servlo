-- Invite acceptance is handled by server routes using the service role.
-- Do not expose invitation emails or bearer tokens through the public API.
DROP POLICY IF EXISTS team_invitations_accept ON public.team_invitations;
