import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { useAuth, useSignIn, useSignUp, useResetPassword, useUpdatePassword, useResendVerification } from "../auth";
import { parseUrlParams, getAuthErrorMessage, getRedirectUrl } from "../utils";
import { AuthState } from "../auth.type";

export const useAuthPage = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isLogin: true,
    isPasswordReset: false,
    loading: false,
    error: "",
    resetSent: false,
    invitationToken: null,
    emailSent: false,
    resendCooldown: 0,
    emailVerified: false,
  });

  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  // React Query hooks
  const { data: user, isLoading: authLoading } = useAuth();
  const signInMutation = useSignIn();
  const signUpMutation = useSignUp();
  const resetPasswordMutation = useResetPassword();
  const updatePasswordMutation = useUpdatePassword();
  const resendVerificationMutation = useResendVerification();

  useEffect(() => {
    const params = parseUrlParams(location.search);
    const path = location.pathname;
    
    const newState = { ...authState };
    
    if (params.invitation) {
      newState.invitationToken = params.invitation;
      newState.isLogin = false;
    }
    
    if (params.type === "recovery" && params.accessToken) {
      newState.isPasswordReset = true;
    }
    
    // Check if email was verified
    if (params?.verified === "true") {
      newState.emailVerified = true;
      newState.emailSent = false;
      toast({
        title: "Email verified!",
        description: "Your email has been successfully verified. You can now sign in."
      });
    }
    
    if (params.mode === "signup" || path.endsWith("/signup")) {
      newState.isLogin = false;
    } else if (params.mode === "login" || path.endsWith("/signin")) {
      newState.isLogin = true;
    }
    
    setAuthState(newState);
  }, [location.search, location.pathname, toast]);

  useEffect(() => {
    if (!authLoading && user) {
      navigate("/dashboard");
    }
  }, [authLoading, user, navigate]);

  // Countdown timer for resend email
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (authState.resendCooldown > 0) {
      interval = setInterval(() => {
        setAuthState(prev => ({
          ...prev,
          resendCooldown: prev.resendCooldown - 1
        }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [authState.resendCooldown]);

  const handleSignIn = async (email: string, password: string) => {
    try {
      await signInMutation.mutateAsync({ email, password });
      toast({ title: "Welcome back!", description: "You have successfully signed in." });
      
      if (authState.invitationToken) {
        navigate(`/accept-invitation?token=${authState.invitationToken}`);
      } else {
        navigate("/dashboard");
      }
    } catch (error: any) {
      const message = getAuthErrorMessage(error);
      setAuthState(prev => ({ ...prev, error: message }));
    }
  };

  const handleSignUp = async (email: string, password: string) => {
    try {
      const redirectUrl = getRedirectUrl("/signup?verified=true");
      await signUpMutation.mutateAsync({ data: { email, password }, redirectUrl });
      
      // Show email verification message
      setAuthState(prev => ({
        ...prev,
        emailSent: true,
        resendCooldown: 60, // 60 seconds cooldown
        error: ""
      }));
      
      toast({ 
        title: "Check your email!", 
        description: "We've sent you a verification link. Please check your email to complete registration." 
      });
    } catch (error: any) {
      const message = getAuthErrorMessage(error);
      setAuthState(prev => ({ 
        ...prev, 
        error: message,
        isLogin: message.includes("already exists") ? true : prev.isLogin
      }));
    }
  };

  const handleForgotPassword = async (email: string) => {
    if (!email || email.trim() === "") {
      setAuthState(prev => ({ ...prev, error: "Please enter your email address first." }));
      return;
    }

    try {
      const redirectUrl = getRedirectUrl("/reset-password");
      await resetPasswordMutation.mutateAsync({ email, redirectUrl });
      toast({ 
        title: "Reset email sent!", 
        description: "Check your email for password reset instructions." 
      });
      setAuthState(prev => ({ ...prev, resetSent: true }));
    } catch (error: any) {
      const message = getAuthErrorMessage(error);
      setAuthState(prev => ({ ...prev, error: message }));
    }
  };

  const handlePasswordReset = async (newPassword: string, confirmPassword: string) => {
    try {
      await updatePasswordMutation.mutateAsync({ newPassword, confirmPassword });
      toast({ 
        title: "Password updated!", 
        description: "Your password has been successfully reset." 
      });
      navigate("/dashboard");
    } catch (error: any) {
      const message = getAuthErrorMessage(error);
      setAuthState(prev => ({ ...prev, error: message }));
    }
  };

  const handleResendVerification = useCallback(async (email: string) => {
    if (authState.resendCooldown > 0) return;
    
    try {
      const redirectUrl = getRedirectUrl("/signup?verified=true");
      await resendVerificationMutation.mutateAsync({ email, redirectUrl });
      
      setAuthState(prev => ({
        ...prev,
        resendCooldown: 60,
        error: ""
      }));
      
      toast({
        title: "Email sent again!",
        description: "We've sent another verification email to your inbox."
      });
    } catch (error: any) {
      const message = getAuthErrorMessage(error);
      setAuthState(prev => ({ ...prev, error: message }));
    }
  }, [authState.resendCooldown, resendVerificationMutation, toast]);

  const toggleAuthMode = () => {
    if (authState.isLogin) {
      // Switch to sign up
      navigate("/signup");
    } else {
      // Switch to sign in
      navigate("/signin");
    }
  };

  return {
    authState,
    authLoading,
    isLoading: authLoading || signInMutation.isPending || signUpMutation.isPending || resetPasswordMutation.isPending || updatePasswordMutation.isPending || resendVerificationMutation.isPending,
    handleSignIn,
    handleSignUp,
    handleForgotPassword,
    handlePasswordReset,
    handleResendVerification,
    toggleAuthMode,
  };
};
