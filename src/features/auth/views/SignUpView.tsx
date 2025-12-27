import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SignUpForm } from "@/features/auth/components/SignUpForm";
import { EmailVerificationView } from "@/features/auth/views/EmailVerificationView";
import { useAuthPage } from "@/features/auth/hooks/useAuthPage";
import heroImage from "@/assets/hero-cinema.jpg";
import { useState } from "react";
import storyMagicLogo from "@/assets/Story_Magic_Logo_Concept_10.5_1766873340720.png";

export const SignUpView = () => {
  const {
    authState,
    isLoading,
    handleSignUp,
    handleResendVerification,
    toggleAuthMode,
  } = useAuthPage();
  
  const [userEmail, setUserEmail] = useState("");

  // If email was sent, show verification view
  if (authState.emailSent || authState.emailVerified) {
    return (
      <EmailVerificationView
        email={userEmail}
        resendCooldown={authState.resendCooldown}
        onResendVerification={handleResendVerification}
        isLoading={isLoading}
        error={authState.error}
        emailVerified={authState.emailVerified}
      />
    );
  }

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
              src={storyMagicLogo} 
              alt="Story Magic" 
              className="h-24"
            />
          </Link>
        </div>

        <Card className="bg-card/50 border-border backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-foreground">
              {authState.invitationToken ? "Complete Your Invitation" : "Create Account"}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {authState.invitationToken
                ? "Create your account to accept the team invitation"
                : "Sign up to start creating amazing voice content"
              }
            </CardDescription>
          </CardHeader>

          <CardContent>
            <SignUpForm
              onSubmit={(data) => {
                setUserEmail(data.email);
                handleSignUp(data.email, data.password);
              }}
              loading={isLoading}
              error={authState.error}
              invitationToken={authState.invitationToken}
            />
            
            <div className="mt-6 text-center">
              <p className="text-muted-foreground">Already have an account?</p>
              <Button
                variant="link"
                onClick={toggleAuthMode}
                className="text-cinema-gold hover:text-cinema-gold/80"
              >
                Sign in instead
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
