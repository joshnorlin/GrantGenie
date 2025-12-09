-- Create grant_invitations table
CREATE TABLE IF NOT EXISTS grant_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grant_id integer NOT NULL REFERENCES grants(grant_id) ON DELETE CASCADE,
  invited_email text NOT NULL,
  invited_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token text UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at timestamptz
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_grant_invitations_grant_id ON grant_invitations(grant_id);
CREATE INDEX IF NOT EXISTS idx_grant_invitations_email ON grant_invitations(invited_email);
CREATE INDEX IF NOT EXISTS idx_grant_invitations_token ON grant_invitations(token);
CREATE INDEX IF NOT EXISTS idx_grant_invitations_status ON grant_invitations(status);

-- Enable RLS
ALTER TABLE grant_invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Admins/owners can insert invites for their grants
CREATE POLICY grant_invitations_insert_admin ON grant_invitations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM grant_memberships gm
      WHERE gm.grant_id = grant_invitations.grant_id
        AND gm.user_id = auth.uid()
        AND gm.role IN ('owner', 'admin')
        AND gm.status = 'active'
    )
  );

-- RLS Policy: Admins/owners can read invites for their grants
CREATE POLICY grant_invitations_read_admin ON grant_invitations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM grant_memberships gm
      WHERE gm.grant_id = grant_invitations.grant_id
        AND gm.user_id = auth.uid()
        AND gm.role IN ('owner', 'admin', 'member')
        AND gm.status = 'active'
    )
  );

-- RLS Policy: Users can read invites by email match
CREATE POLICY grant_invitations_read_by_email ON grant_invitations
  FOR SELECT
  TO authenticated
  USING (
    invited_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- RLS Policy: Users can read invites by token (for validation)
CREATE POLICY grant_invitations_read_by_token ON grant_invitations
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- RLS Policy: Service role can do everything
CREATE POLICY grant_invitations_service_full ON grant_invitations
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
