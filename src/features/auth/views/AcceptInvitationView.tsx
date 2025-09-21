import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, UserPlus, Clock } from "lucide-react";
import { useAcceptInvitationPage } from "../hooks/useAcceptInvitationPage";

export const AcceptInvitationView = () => {
  const navigate = useNavigate();
  const {
    invitation,
    loading,
    accepting,
    error,
    handleAcceptClick,
  } = useAcceptInvitationPage();

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
              onClick={handleAcceptClick}
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
};
