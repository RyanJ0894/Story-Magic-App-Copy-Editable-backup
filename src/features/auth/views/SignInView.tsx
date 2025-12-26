import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SignInForm } from "@/features/auth/components/SignInForm";
import { useAuthPage } from "@/features/auth/hooks/useAuthPage";
import heroImage from "@/assets/hero-cinema.jpg";

export const SignInView = () => {
  const {
    authState,
    isLoading,
    handleSignIn,
    handleForgotPassword,
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
              src="/attached_assets/Story_Magic_Logo_Concept_10.3_1766711462473.png" 
              alt="Story Magic" 
              className="h-24"
            />
          </Link>
        </div>

        <Card className="bg-card/50 border-border backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-foreground">
              Welcome Back
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Sign in to your account to continue
            </CardDescription>
          </CardHeader>

          <CardContent>
            <SignInForm
              onSubmit={(data) => handleSignIn(data.email, data.password)}
              onForgotPassword={handleForgotPassword}
              loading={isLoading}
              error={authState.error}
            />
            
            <div className="mt-6 text-center">
              <p className="text-muted-foreground">Don't have an account?</p>
              <Button
                variant="link"
                onClick={toggleAuthMode}
                className="text-cinema-gold hover:text-cinema-gold/80"
              >
                Create an account
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};