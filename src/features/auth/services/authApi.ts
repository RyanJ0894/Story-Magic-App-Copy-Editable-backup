import { supabase } from "@/integrations/supabase/client";

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
};