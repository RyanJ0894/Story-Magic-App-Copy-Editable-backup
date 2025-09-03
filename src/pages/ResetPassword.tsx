import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    console.log("ResetPassword: Component mounted, checking auth state");
    
    // Check if we have a valid session for password reset
    const checkAuthState = async () => {
      try {
        // First, check if there's a session from URL parameters (from email link)
        const urlParams = new URLSearchParams(window.location.search);
        const urlHash = window.location.hash;
        
        console.log("URL params:", Object.fromEntries(urlParams.entries()));
        console.log("URL hash:", urlHash);
        
        // Supabase puts auth tokens in the URL hash for password reset
        if (urlHash) {
          const hashParams = new URLSearchParams(urlHash.substring(1));
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');
          const type = hashParams.get('type');
          
          console.log("Hash params:", {
            accessToken: accessToken ? 'present' : 'missing',
            refreshToken: refreshToken ? 'present' : 'missing',
            type
          });
          
          if (type === 'recovery' && accessToken && refreshToken) {
            console.log("Setting session from hash parameters");
            try {
              const { data, error } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken
              });
              
              if (error) {
                console.error("Failed to set session:", error);
                setError("Invalid or expired reset link. Please request a new password reset.");
              } else if (data.session) {
                console.log("Session set successfully");
                setIsValidSession(true);
                // Clean up the URL
                window.history.replaceState({}, document.title, "/reset-password");
              }
            } catch (err) {
              console.error("Session setting error:", err);
              setError("Failed to process reset link. Please try again.");
            }
          } else {
            console.log("Invalid hash parameters for password reset");
            setError("Invalid reset link. Please request a new password reset.");
          }
        } else {
          // Check if there's already a valid session
          const { data: { session }, error } = await supabase.auth.getSession();
          console.log("Existing session check:", { hasSession: !!session, error });
          
          if (session) {
            setIsValidSession(true);
          } else {
            setError("No valid session found. Please request a new password reset.");
          }
        }
      } catch (err) {
        console.error("Auth state check error:", err);
        setError("Something went wrong. Please try again.");
      } finally {
        setCheckingSession(false);
      }
    };

    checkAuthState();
  }, []);

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
      console.log("Attempting to update password");
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        console.error("Password update error:", error);
        setError(error.message);
      } else {
        console.log("Password updated successfully");
        setSuccess(true);
        toast({ 
          title: "Password updated!", 
          description: "Your password has been successfully reset." 
        });
        
        // Redirect to auth page after a short delay
        setTimeout(() => {
          navigate("/auth");
        }, 2000);
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while checking session
  if (checkingSession) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-0">
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
                Loading...
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Processing your password reset request
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-0">
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
                Password Reset Successful
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Your password has been updated successfully. You will be redirected to sign in shortly.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <Button asChild variant="cinema">
                  <Link to="/auth">Go to Sign In</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-0">
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
              {isValidSession ? "Reset Your Password" : "Invalid Reset Link"}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {isValidSession 
                ? "Enter your new password below" 
                : "This reset link is invalid or has expired"
              }
            </CardDescription>
          </CardHeader>

          <CardContent>
            {isValidSession ? (
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

                <div className="text-center">
                  <Button variant="link" asChild className="text-cinema-gold hover:text-cinema-gold/80">
                    <Link to="/auth">Back to Sign In</Link>
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                <div className="text-center space-y-4">
                  <p className="text-muted-foreground">
                    Please request a new password reset link.
                  </p>
                  <Button variant="cinema" asChild>
                    <Link to="/auth">Request New Reset Link</Link>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;