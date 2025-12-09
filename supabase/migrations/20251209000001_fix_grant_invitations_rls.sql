-- Drop existing policies to avoid duplicates
DROP POLICY IF EXISTS grant_invitations_select_policy ON public.grant_invitations;
DROP POLICY IF EXISTS grant_invitations_insert_policy ON public.grant_invitations;
DROP POLICY IF EXISTS grant_invitations_update_policy ON public.grant_invitations;
DROP POLICY IF EXISTS grant_invitations_delete_policy ON public.grant_invitations;
DROP POLICY IF EXISTS grant_invitations_service_full ON public.grant_invitations;

-- Ensure RLS is enabled
ALTER TABLE public.grant_invitations ENABLE ROW LEVEL SECURITY;

-- 1. Allow service_role to bypass RLS entirely (needed for edge functions)
CREATE POLICY grant_invitations_service_full
  ON public.grant_invitations
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 2. Allow grant owner to read all invitations for their grant
CREATE POLICY grant_invitations_select_owner
  ON public.grant_invitations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.grants g
      WHERE g.grant_id = public.grant_invitations.grant_id
        AND g.created_by = (SELECT auth.uid())
    )
  );

-- 3. Allow members to read invitations for grants they are members of
CREATE POLICY grant_invitations_select_members
  ON public.grant_invitations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.grant_memberships gm
      WHERE gm.grant_id = public.grant_invitations.grant_id
        AND gm.user_id = (SELECT auth.uid())
        AND gm.status = 'accepted'
    )
  );

-- 4. Allow the person who created the invite to read it (by email match)
CREATE POLICY grant_invitations_select_by_invite_email
  ON public.grant_invitations
  FOR SELECT
  TO authenticated
  USING (
    invited_email = (SELECT email FROM auth.users WHERE id = (SELECT auth.uid()))
  );

-- 5. Allow grant owner or members to insert invitations
CREATE POLICY grant_invitations_insert
  ON public.grant_invitations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    invited_by = (SELECT auth.uid())
    AND (
      EXISTS (
        SELECT 1 FROM public.grants g
        WHERE g.grant_id = public.grant_invitations.grant_id
          AND g.created_by = (SELECT auth.uid())
      )
      OR
      EXISTS (
        SELECT 1 FROM public.grant_memberships gm
        WHERE gm.grant_id = public.grant_invitations.grant_id
          AND gm.user_id = (SELECT auth.uid())
          AND gm.status = 'accepted'
      )
    )
  );

-- 6. Allow the inviter or grant owner to update an invitation
CREATE POLICY grant_invitations_update
  ON public.grant_invitations
  FOR UPDATE
  TO authenticated
  USING (
    invited_by = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.grants g
      WHERE g.grant_id = public.grant_invitations.grant_id
        AND g.created_by = (SELECT auth.uid())
    )
  )
  WITH CHECK (true);

-- 7. Allow the inviter or grant owner to delete an invitation
CREATE POLICY grant_invitations_delete
  ON public.grant_invitations
  FOR DELETE
  TO authenticated
  USING (
    invited_by = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.grants g
      WHERE g.grant_id = public.grant_invitations.grant_id
        AND g.created_by = (SELECT auth.uid())
    )
  );
