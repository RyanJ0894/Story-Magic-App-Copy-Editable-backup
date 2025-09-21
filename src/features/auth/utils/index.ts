import { AuthError } from "@supabase/supabase-js";

export const getAuthErrorMessage = (error: AuthError): string => {
  if (error.message.includes("User already registered")) {
    return "An account with this email already exists. Please sign in instead.";
  }
  
  if (error.message.includes("Invalid login credentials")) {
    return "Invalid email or password. Please check your credentials and try again.";
  }
  
  if (error.message.includes("Email not confirmed")) {
    return "Please check your email and click the confirmation link before signing in.";
  }
  
  return error.message || "An unexpected error occurred. Please try again.";
};

export const getRedirectUrl = (path: string = "/"): string => {
  return `${window.location.protocol}//${window.location.host}${path}`;
};

export const parseUrlParams = (search: string) => {
  const params = new URLSearchParams(search);
  return {
    mode: params.get("mode"),
    type: params.get("type"),
    accessToken: params.get("access_token"),
    invitation: params.get("invitation"),
  };
};
