import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ResetPasswordForm } from "@/features/auth/components/ResetPasswordForm";
import { useAuthPage } from "@/features/auth/hooks/useAuthPage";
import heroImage from "@/assets/hero-cinema.jpg";
import storyMagicLogo from "@/assets/Story_Magic_Logo_Concept_10.5_1766873340720.png";

export const ResetPasswordView = () => {
  const {
    authState,
    isLoading,
    handlePasswordReset,
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
              src={storyMagicLogo} 
              alt="Story Magic" 
              className="h-28"
            />
          </Link>
        </div>

        <Card className="bg-card/50 border-border backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-foreground">
              Reset Password
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Enter your new password below
            </CardDescription>
          </CardHeader>

          <CardContent>
            <ResetPasswordForm
              onSubmit={(data) => handlePasswordReset(data.newPassword, data.confirmPassword)}
              loading={isLoading}
              error={authState.error}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
