import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SignUpForm } from "@/features/auth/components/SignUpForm";
import { useAuthPage } from "@/features/auth/hooks/useAuthPage";
import heroImage from "@/assets/hero-cinema.jpg";

export const SignUpView = () => {
  const {
    authState,
    handleSignUp,
    toggleAuthMode,
  } = useAuthPage();

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
              src="/lovable-uploads/2a81761c-efdc-4094-9e5d-f297e2f44571.png" 
              alt="Story Magic" 
              className="h-56"
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
              onSubmit={(data) => handleSignUp(data.email, data.password)}
              loading={authState.loading}
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
