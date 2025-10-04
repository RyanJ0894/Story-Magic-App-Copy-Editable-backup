-- Drop the problematic policy that tries to query auth.users directly
DROP POLICY IF EXISTS "Users can view invitations sent to their email" ON public.team_invitations;

-- Create a security definer function to safely get user email
CREATE OR REPLACE FUNCTION public.get_user_email()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email FROM auth.users WHERE id = auth.uid()
$$;

-- Recreate the policy using the security definer function
CREATE POLICY "Users can view invitations sent to their email"
ON public.team_invitations
FOR SELECT
TO authenticated
USING (email = public.get_user_email());