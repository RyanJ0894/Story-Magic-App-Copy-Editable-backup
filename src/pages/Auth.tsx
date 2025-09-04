import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Film } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isPasswordReset, setIsPasswordReset] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [invitationToken, setInvitationToken] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  // Determine mode from URL and check for password reset
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const mode = params.get("mode");
    const path = location.pathname;
    const invitation = params.get("invitation");
    
    console.log("Auth page loaded with:", {
      search: location.search,
      pathname: location.pathname,
      params: Object.fromEntries(params.entries())
    });
    
    // Check for invitation token
    if (invitation) {
      setInvitationToken(invitation);
      setIsLogin(false); // Force signup mode for invitations
    }
    
    // Check if this is a password reset flow (Supabase adds access_token and type=recovery)
    const accessToken = params.get("access_token");
    const type = params.get("type");
    
    if (type === "recovery" && accessToken) {
      console.log("Password reset flow detected");
      setIsPasswordReset(true);
      return;
    }
    
    if (mode === "signup" || path.endsWith("/signup")) setIsLogin(false);
    else if (mode === "login" || path.endsWith("/signin")) setIsLogin(true);
  }, [location.search, location.pathname]);

  // If already authenticated, send to home (use provider as source of truth)
  useEffect(() => {
    if (!authLoading && user) {
      navigate("/dashboard");
    }
  }, [authLoading, user, navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          setError(error.message);
          return;
        }
        toast({ title: "Welcome back!", description: "You have successfully signed in." });
        navigate("/dashboard");
      } else {
        const redirectUrl = `${window.location.origin}/`;
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: redirectUrl },
        });
        if (error) {
          if (error.message.includes("User already registered")) {
            setError("An account with this email already exists. Please sign in instead.");
            setIsLogin(true);
          } else {
            setError(error.message);
          }
          return;
        }
        toast({ title: "Account created!", description: "Welcome to Story Magic!" });
        
        // If there's an invitation token, redirect to accept it
        if (invitationToken) {
          navigate(`/accept-invitation?token=${invitationToken}`);
        } else {
          // New signups go to pricing page with newuser parameter
          navigate("/pricing?newuser=true");
        }
      }
    } catch (_) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError("Please enter your email address first.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Set redirect to the dedicated reset password page
      const redirectUrl = `${window.location.protocol}//${window.location.host}/reset-password`;
      console.log("Sending reset email with redirect URL:", redirectUrl);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) {
        setError(error.message);
      } else {
        setResetSent(true);
        toast({ 
          title: "Reset email sent!", 
          description: "Check your email for password reset instructions." 
        });
      }
    } catch (_) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        setError(error.message);
      } else {
        toast({ 
          title: "Password updated!", 
          description: "Your password has been successfully reset." 
        });
        navigate("/dashboard");
      }
    } catch (_) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-0">
        {/* Logo */}
        <div className="text-center mb-[-1rem]">
          <Link to="/" className="inline-flex items-center gap-2 hover:opacity-80 transition-opacity">
            <img 
              src="/lovable-uploads/2a81761c-efdc-4094-9e5d-f297e2f44571.png" 
              alt="Story Magic" 
              className="h-56"
            />
          </Link>
        </div>

        <Card className="bg-card border-border">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-foreground">
              {isPasswordReset ? "Reset Password" : (isLogin ? "Welcome Back" : invitationToken ? "Complete Your Invitation" : "Create Account")}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {isPasswordReset 
                ? "Enter your new password below"
                : (isLogin
                  ? "Sign in to your account to continue"
                  : invitationToken
                  ? "Create your account to accept the team invitation"
                  : "Sign up to start creating amazing voice content")
              }
            </CardDescription>
          </CardHeader>

          <CardContent>
            {/* If user is logged in already, prevent form flicker */}
            {authLoading ? (
              <div className="text-center text-muted-foreground">Loading...</div>
            ) : isPasswordReset ? (
              <form onSubmit={handlePasswordReset} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-foreground">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="Enter your new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    className="bg-background border-border text-foreground"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-foreground">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm your new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    className="bg-background border-border text-foreground"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  variant="cinema"
                  disabled={loading}
                >
                  {loading ? "Updating..." : "Update Password"}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleAuth} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-background border-border text-foreground"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-foreground">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="bg-background border-border text-foreground"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  variant="cinema"
                  disabled={loading}
                >
                  {loading ? "Loading..." : (isLogin ? "Sign In" : "Sign Up")}
                </Button>

                {isLogin && (
                  <div className="mt-4 text-center">
                    <Button
                      variant="link"
                      onClick={handleForgotPassword}
                      disabled={loading}
                      className="text-cinema-gold hover:text-cinema-gold/80 text-sm"
                    >
                      {loading ? "Sending..." : "Forgot password?"}
                    </Button>
                  </div>
                )}

                <div className="mt-6 text-center">
                  <p className="text-muted-foreground">
                    {isLogin ? "Don't have an account?" : "Already have an account?"}
                  </p>
                  <Button
                    variant="link"
                    onClick={() => {
                      setIsLogin(!isLogin);
                      setError("");
                      setEmail("");
                      setPassword("");
                      setResetSent(false);
                    }}
                    className="text-cinema-gold hover:text-cinema-gold/80"
                  >
                    {isLogin ? "Create an account" : "Sign in instead"}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
