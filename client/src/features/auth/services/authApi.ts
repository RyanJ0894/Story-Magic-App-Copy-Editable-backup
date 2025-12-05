import { supabase } from "../../../../../supabase/client";

export const authApi = {
  getCurrentUser: async () => {
    return await supabase.auth.getUser();
  },

  signIn: async (data: { email: string; password: string }) => {
    return await supabase.auth.signInWithPassword(data);
  },

  signUp: async (data: { email: string; password: string }, redirectUrl?: string) => {
    return await supabase.auth.signUp({
      ...data,
      options: redirectUrl ? { emailRedirectTo: redirectUrl } : undefined,
    });
  },

  resendVerification: async (email: string, redirectUrl: string) => {
    return await supabase.auth.resend({
      type: 'signup',
      email: email,
      options: { emailRedirectTo: redirectUrl }
    });
  },
  
  resetPassword: async (email: string, redirectUrl: string) => {
    return await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });
  },
  
  updatePassword: async (newPassword: string) => {
    return await supabase.auth.updateUser({
      password: newPassword,
    });
  },

  signOut: async () => {
    return await supabase.auth.signOut();
  },

  validateInvitation: async (token: string) => {
    return await supabase.rpc('validate_invitation_token', { token_to_validate: token });
  },

  acceptInvitation: async (invitationId: string, userId: string, role: string, invitedBy: string) => {
    // Determine plan type based on role
    let planType = 'individual';
    if (role === 'Team Lead') {
      planType = 'starter-enterprise';
    }

    // Update user profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        role: role,
        invited_by: invitedBy,
        plan_type: planType,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (profileError) throw profileError;

    // Mark invitation as accepted
    const { error: inviteError } = await supabase
      .from('team_invitations')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString()
      })
      .eq('id', invitationId);

    if (inviteError) throw inviteError;

    return { success: true };
  },
};