import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { useAuth, useSignIn, useSignUp, useResetPassword, useUpdatePassword } from "../auth";
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
    
    if (params.mode === "signup" || path.endsWith("/signup")) {
      newState.isLogin = false;
    } else if (params.mode === "login" || path.endsWith("/signin")) {
      newState.isLogin = true;
    }
    
    setAuthState(newState);
  }, [location.search, location.pathname]);

  useEffect(() => {
    if (!authLoading && user) {
      navigate("/dashboard");
    }
  }, [authLoading, user, navigate]);

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
      const redirectUrl = getRedirectUrl("/");
      await signUpMutation.mutateAsync({ data: { email, password }, redirectUrl });
      toast({ title: "Account created!", description: "Welcome to Story Magic!" });
      
      if (authState.invitationToken) {
        navigate(`/accept-invitation?token=${authState.invitationToken}`);
      } else {
        navigate("/pricing?newuser=true");
      }
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

  const toggleAuthMode = () => {
    setAuthState(prev => ({
      ...prev,
      isLogin: !prev.isLogin,
      error: "",
      resetSent: false,
    }));
  };

  return {
    authState,
    authLoading,
    handleSignIn,
    handleSignUp,
    handleForgotPassword,
    handlePasswordReset,
    toggleAuthMode,
  };
};
