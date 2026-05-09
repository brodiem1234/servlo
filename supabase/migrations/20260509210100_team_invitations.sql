CREATE TABLE IF NOT EXISTS team_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  invited_by_user_id uuid NOT NULL REFERENCES auth.users(id),
  invited_email text NOT NULL,
  role text NOT NULL DEFAULT 'employee' CHECK (role IN ('employee','contractor','manager')),
  invite_token uuid UNIQUE DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','cancelled','expired')),
  personal_message text,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '7 days'),
  accepted_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_team_invitations_business ON team_invitations(business_id);
CREATE INDEX IF NOT EXISTS idx_team_invitations_token ON team_invitations(invite_token);
CREATE INDEX IF NOT EXISTS idx_team_invitations_email ON team_invitations(invited_email);

ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY team_invitations_owner ON team_invitations
  FOR ALL USING (
    business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  );

CREATE POLICY team_invitations_accept ON team_invitations
  FOR SELECT USING (true); -- anyone can read by token to accept
