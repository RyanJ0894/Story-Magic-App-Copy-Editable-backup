-- Make sure team_invitations has DELETE permissions for user who sent invitation
DROP POLICY IF EXISTS "Users can delete invitations they sent" ON team_invitations;
CREATE POLICY "Users can delete invitations they sent" 
ON team_invitations 
FOR DELETE 
USING (invited_by = auth.uid());