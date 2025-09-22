import { AuthSekeleton } from "@/features/auth/views/AuthSekeleton";
import { useAuthPage } from "@/features/auth/hooks/useAuthPage";
import { SignInView } from "@/features/auth/views/SignInView";
import { SignUpView } from "@/features/auth/views/SignUpView";
import { ResetPasswordView } from "@/features/auth/views/ResetPasswordView";

const Auth = () => {
  const { authState, isLoading } = useAuthPage();

  // Early return for loading state
  if (isLoading) {
    return <AuthSekeleton />;
  }

  // Early return for password reset
  if (authState.isPasswordReset) {
    return <ResetPasswordView />;
  }

  // Early return for sign in
  if (authState.isLogin) {
    return <SignInView />;
  }

  // Default: sign up view
  return <SignUpView />;
};

export default Auth;
