-- Fix the grant_invitations_select_by_invite_email policy
-- The issue is that querying auth.users requires special permissions
-- Instead, we should compare directly with auth.email()

DROP POLICY IF EXISTS grant_invitations_select_by_invite_email ON public.grant_invitations;

CREATE POLICY grant_invitations_select_by_invite_email
  ON public.grant_invitations
  FOR SELECT
  TO authenticated
  USING (
    lower(invited_email) = lower((SELECT auth.email()))
  );
