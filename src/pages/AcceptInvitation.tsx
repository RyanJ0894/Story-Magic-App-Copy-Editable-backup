import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, UserPlus, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { type UserRole } from "@/types/roles";

export default function AcceptInvitation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [invitation, setInvitation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setError('Invalid invitation link');
      setLoading(false);
      return;
    }

    loadInvitation();
  }, [token]);

  const loadInvitation = async () => {
    try {
      // Use the secure validation function instead of direct table queries
      const { data, error: inviteError } = await supabase
        .rpc('validate_invitation_token', { token_to_validate: token });

      if (inviteError) {
        throw inviteError;
      }

      if (!data || data.length === 0) {
        setError('Invitation not found, expired, or already used');
        return;
      }

      // The function already validates expiry and status, so we can use the data directly
      const invitationData = data[0];
      setInvitation({
        id: invitationData.invitation_id,
        email: invitationData.invited_email,
        role: invitationData.role,
        expires_at: invitationData.expires_at,
        status: invitationData.status,
        invited_by: invitationData.invited_by
      });
    } catch (error: any) {
      console.error('Error loading invitation:', error);
      setError(error.message || 'Failed to load invitation');
    } finally {
      setLoading(false);
    }
  };

  const acceptInvitation = async () => {
    if (!invitation) return;

    setAccepting(true);
    try {
      // First, check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        // Redirect to auth with the invitation token to continue after signup
        navigate(`/auth?invitation=${token}`);
        return;
      }

      // Determine plan type based on role
      let planType = 'individual';
      if (invitation.role === 'Team Lead') {
        planType = 'starter-enterprise';
      }

      // Update the user's profile with the new role, hierarchy, and appropriate plan
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          role: invitation.role,
          invited_by: invitation.invited_by,
          plan_type: planType,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', session.user.id);

      if (profileError) throw profileError;

      // Mark invitation as accepted
      const { error: inviteError } = await supabase
        .from('team_invitations')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString()
        })
        .eq('id', invitation.id);

      if (inviteError) throw inviteError;

      toast({
        title: "Invitation Accepted!",
        description: `Welcome to the team! You now have ${invitation.role} access.`,
      });

      // Redirect to dashboard
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Error accepting invitation:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="text-center">
            <XCircle className="h-12 w-12 text-destructive mx-auto mb-2" />
            <CardTitle>Invitation Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => navigate('/')}
            >
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invitation) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <UserPlus className="h-12 w-12 text-primary mx-auto mb-2" />
          <CardTitle>Team Invitation</CardTitle>
          <CardDescription>
            You've been invited to join a team
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">You're invited as:</p>
            <Badge className="text-sm px-3 py-1">
              {invitation.role}
            </Badge>
          </div>

          <div className="p-4 bg-muted/50 rounded-lg space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Email: {invitation.email}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-blue-500" />
              <span>
                Expires: {new Date(invitation.expires_at).toLocaleDateString()}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={acceptInvitation}
              disabled={accepting}
              className="w-full"
            >
              {accepting ? 'Accepting...' : 'Accept Invitation'}
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => navigate('/')}
            >
              Decline
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            By accepting this invitation, you'll gain {invitation.role} access to the team's projects and features.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}