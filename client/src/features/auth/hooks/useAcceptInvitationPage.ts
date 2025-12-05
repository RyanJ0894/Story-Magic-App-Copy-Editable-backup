import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { useValidateInvitation, useAcceptInvitation, useAuth } from "../auth";

export const useAcceptInvitationPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const token = searchParams.get('token');
  
  // React Query hooks
  const { data: user } = useAuth();
  const { data: invitationData, isLoading: loadingInvitation, error: invitationError } = useValidateInvitation(token);
  const acceptInvitationMutation = useAcceptInvitation();

  const [accepting, setAccepting] = useState(false);

  const invitation = invitationData && invitationData.length > 0 ? {
    id: invitationData[0].invitation_id,
    email: invitationData[0].invited_email,
    role: invitationData[0].role,
    expires_at: invitationData[0].expires_at,
    status: invitationData[0].status,
    invited_by: invitationData[0].invited_by
  } : null;

  const acceptInvitation = async () => {
    if (!invitation || !user) return;

    setAccepting(true);
    try {
      await acceptInvitationMutation.mutateAsync({
        invitationId: invitation.id,
        userId: user.id,
        role: invitation.role,
        invitedBy: invitation.invited_by
      });

      toast({
        title: "Invitation Accepted!",
        description: `Welcome to the team! You now have ${invitation.role} access.`,
      });

      navigate('/dashboard');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setAccepting(false);
    }
  };

  const handleAcceptClick = async () => {
    if (!user) {
      // Redirect to auth with the invitation token to continue after signup
      navigate(`/auth?invitation=${token}`);
      return;
    }

    await acceptInvitation();
  };

  return {
    token,
    invitation,
    loading: loadingInvitation,
    accepting,
    error: invitationError?.message || null,
    handleAcceptClick,
  };
};
