import { AuthError } from "@supabase/supabase-js";

export const getAuthErrorMessage = (error: AuthError): string => {
  const msg = error?.message || "";

  if (msg === "Failed to fetch" || msg.includes("NetworkError") || msg.includes("fetch")) {
    return "Cannot connect to the authentication server. Your Supabase project may be paused — please visit your Supabase dashboard to resume it, then try again.";
  }

  if (msg.includes("User already registered")) {
    return "An account with this email already exists. Please sign in instead.";
  }
  
  if (msg.includes("Invalid login credentials")) {
    return "Invalid email or password. Please check your credentials and try again.";
  }
  
  if (msg.includes("Email not confirmed")) {
    return "Please check your email and click the confirmation link before signing in.";
  }
  
  if (msg.includes("sending confirmation email") || msg.includes("email rate limit")) {
    return "Unable to send verification email. Please try again in a few minutes, or contact support if the issue persists.";
  }
  
  return msg || "An unexpected error occurred. Please try again.";
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
    verified: params.get("verified"),
  };
};
