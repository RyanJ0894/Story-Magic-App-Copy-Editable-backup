import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
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
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    console.log("Reset password page loaded with params:", {
      search: location.search,
      pathname: location.pathname,
      params: Object.fromEntries(params.entries())
    });

    // Check for Supabase recovery parameters
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    const type = params.get("type");

    if (type === "recovery" && accessToken) {
      console.log("Valid password reset token detected");
    } else {
      console.log("No valid reset token found, redirecting to auth");
      setError("Invalid or expired password reset link. Please request a new one.");
    }
  }, [location]);

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
    } catch (_) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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
              Reset Your Password
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Enter your new password below
            </CardDescription>
          </CardHeader>

          <CardContent>
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;