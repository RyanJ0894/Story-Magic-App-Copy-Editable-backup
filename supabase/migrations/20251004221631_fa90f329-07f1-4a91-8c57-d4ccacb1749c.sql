-- Drop existing SELECT policy to replace with more secure versions
DROP POLICY IF EXISTS "Users can only view their own sent invitations" ON public.team_invitations;

-- Explicitly deny all unauthenticated access
CREATE POLICY "Deny unauthenticated access to team_invitations"
ON public.team_invitations
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- Allow authenticated users to view invitations they sent
CREATE POLICY "Users can view invitations they sent"
ON public.team_invitations
FOR SELECT
TO authenticated
USING (invited_by = auth.uid());

-- Allow authenticated users to view invitations sent to their email
CREATE POLICY "Users can view invitations sent to their email"
ON public.team_invitations
FOR SELECT
TO authenticated
USING (
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- Service role retains full access for backend operations (e.g., sending emails)
CREATE POLICY "Service role has full access to team_invitations"
ON public.team_invitations
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);