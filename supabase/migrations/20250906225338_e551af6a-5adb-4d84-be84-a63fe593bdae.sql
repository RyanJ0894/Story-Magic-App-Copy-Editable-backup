-- Drop existing policies on team_invitations table
DROP POLICY IF EXISTS "Users can create invitations based on their role" ON public.team_invitations;
DROP POLICY IF EXISTS "Users can delete invitations they sent" ON public.team_invitations;
DROP POLICY IF EXISTS "Users can update invitations they sent" ON public.team_invitations;
DROP POLICY IF EXISTS "Users can view invitations they sent" ON public.team_invitations;

-- Create more secure policies for team_invitations

-- 1. Only allow users with proper roles to create invitations (unchanged, this was secure)
CREATE POLICY "Users can create invitations based on their role"
ON public.team_invitations
FOR INSERT
TO authenticated
WITH CHECK (
    invited_by = auth.uid() 
    AND EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE user_id = auth.uid() 
        AND role = ANY (ARRAY['Master'::text, 'Team Lead'::text])
    )
);

-- 2. Only allow viewing invitations sent by the current user - no role hierarchy bypass
CREATE POLICY "Users can only view their own sent invitations"
ON public.team_invitations
FOR SELECT
TO authenticated
USING (invited_by = auth.uid());

-- 3. Only allow updating invitations sent by the current user
CREATE POLICY "Users can only update their own sent invitations"
ON public.team_invitations
FOR UPDATE
TO authenticated
USING (invited_by = auth.uid());

-- 4. Only allow deleting invitations sent by the current user  
CREATE POLICY "Users can only delete their own sent invitations"
ON public.team_invitations
FOR DELETE
TO authenticated
USING (invited_by = auth.uid());

-- Create a secure function for invitation token validation that doesn't expose sensitive data
CREATE OR REPLACE FUNCTION public.validate_invitation_token(token_to_validate text)
RETURNS TABLE (
    invitation_id uuid,
    invited_email text,
    role text,
    expires_at timestamp with time zone,
    status text,
    invited_by uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ti.id,
        ti.email,
        ti.role,
        ti.expires_at,
        ti.status,
        ti.invited_by
    FROM public.team_invitations ti
    WHERE ti.token = token_to_validate
    AND ti.status = 'pending'
    AND ti.expires_at > now();
END;
$$;