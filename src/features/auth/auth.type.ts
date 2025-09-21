export interface SignInFormData {
  email: string;
  password: string;
}

export interface SignUpFormData {
  email: string;
  password: string;
}

export interface ResetPasswordFormData {
  newPassword: string;
  confirmPassword: string;
}

export interface AuthState {
  isLogin: boolean;
  isPasswordReset: boolean;
  loading: boolean;
  error: string;
  resetSent: boolean;
  invitationToken: string | null;
}

