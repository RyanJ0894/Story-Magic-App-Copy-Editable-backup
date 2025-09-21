import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from './services/authApi';
import { SignInFormData, SignUpFormData, ResetPasswordFormData } from './auth.type';

export const AUTH_KEY_FACTORY = {
  all: ["auth"] as const,
  user: () => [...AUTH_KEY_FACTORY.all, "user"] as const,
  session: () => [...AUTH_KEY_FACTORY.all, "session"] as const,
};

// Get current user
export const useAuth = () => {
  return useQuery({
    queryKey: AUTH_KEY_FACTORY.user(),
    queryFn: async () => {
      const { data: { user } } = await authApi.getCurrentUser();
      return user;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });
};

// Sign in mutation
export const useSignIn = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: SignInFormData) => {
      const { data: result, error } = await authApi.signIn(data);
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUTH_KEY_FACTORY.user() });
    },
  });
};

// Sign up mutation
export const useSignUp = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ data, redirectUrl }: { data: SignUpFormData; redirectUrl?: string }) => {
      const { data: result, error } = await authApi.signUp(data, redirectUrl);
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUTH_KEY_FACTORY.user() });
    },
  });
};

// Reset password mutation
export const useResetPassword = () => {
  return useMutation({
    mutationFn: async ({ email, redirectUrl }: { email: string; redirectUrl: string }) => {
      const { error } = await authApi.resetPassword(email, redirectUrl);
      if (error) throw error;
    },
  });
};

// Update password mutation
export const useUpdatePassword = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ResetPasswordFormData) => {
      const { data: result, error } = await authApi.updatePassword(data.newPassword);
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUTH_KEY_FACTORY.user() });
    },
  });
};

// Sign out mutation
export const useSignOut = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { error } = await authApi.signOut();
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.setQueryData(AUTH_KEY_FACTORY.user(), null);
      queryClient.invalidateQueries({ queryKey: AUTH_KEY_FACTORY.all });
    },
  });
};
