import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, Mail, Clock } from "lucide-react";
import heroImage from "@/assets/hero-cinema.jpg";

interface EmailVerificationViewProps {
  email: string;
  resendCooldown: number;
  onResendVerification: (email: string) => void;
  isLoading: boolean;
  error?: string;
  emailVerified?: boolean;
}

export const EmailVerificationView = ({
  email,
  resendCooldown,
  onResendVerification,
  isLoading,
  error,
  emailVerified = false,
}: EmailVerificationViewProps) => {
  const canResend = resendCooldown === 0 && !isLoading;

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 bg-cover bg-left bg-no-repeat" style={{
        backgroundImage: `url(${heroImage})`
      }}>
        <div className="absolute inset-0 bg-gradient-to-r from-cinema-dark/90 via-cinema-dark/70 to-transparent" />
      </div>
      
      <div className="relative z-10 w-full max-w-md space-y-0">
        {/* Logo */}
        <div className="text-center mb-[-1rem]">
          <Link to="/" className="inline-flex items-center gap-2 hover:opacity-80 transition-opacity">
            <img 
              src="/attached_assets/Story_Magic_Logo_Concept_10.3_1766711462473.png" 
              alt="Story Magic" 
              className="h-24"
            />
          </Link>
        </div>

        <Card className="bg-card/50 border-border backdrop-blur-sm">
          <CardHeader className="text-center">
            {emailVerified ? (
              <>
                <div className="mx-auto mb-4 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <CardTitle className="text-2xl font-bold text-foreground">
                  Email Verified!
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Your email has been successfully verified. You can now sign in to your account.
                </CardDescription>
              </>
            ) : (
              <>
                <div className="mx-auto mb-4 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Mail className="w-6 h-6 text-blue-600" />
                </div>
                <CardTitle className="text-2xl font-bold text-foreground">
                  Check Your Email
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  We've sent a verification link to <strong>{email}</strong>
                </CardDescription>
              </>
            )}
          </CardHeader>

          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {emailVerified ? (
              <div className="space-y-4">
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Your account is now active! You can sign in with your email and password.
                  </AlertDescription>
                </Alert>
                
                <Button
                  className="w-full"
                  variant="cinema"
                  onClick={() => window.location.href = "/signin"}
                >
                  Sign In Now
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <Alert>
                  <Mail className="h-4 w-4" />
                  <AlertDescription>
                    Click the verification link in your email to activate your account. 
                    Check your spam folder if you don't see it.
                  </AlertDescription>
                </Alert>

                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Didn't receive the email?
                  </p>
                  
                  {resendCooldown > 0 ? (
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>Resend available in {resendCooldown}s</span>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => onResendVerification(email)}
                      disabled={!canResend}
                      className="text-cinema-gold border-cinema-gold hover:bg-cinema-gold hover:text-white"
                    >
                      {isLoading ? "Sending..." : "Resend Verification Email"}
                    </Button>
                  )}
                </div>

                <div className="text-center">
                  <Button
                    variant="link"
                    onClick={() => window.location.href = "/signin"}
                    className="text-cinema-gold hover:text-cinema-gold/80"
                  >
                    Back to Sign In
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
