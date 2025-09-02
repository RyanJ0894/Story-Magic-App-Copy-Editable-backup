import { Button } from "@/components/ui/button";
import { Film, Menu, LogOut, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";

export const Header = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-lg">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <img 
            src="/lovable-uploads/2a81761c-efdc-4094-9e5d-f297e2f44571.png" 
            alt="Story Magic" 
            className="h-8"
          />
        </Link>
        
        <nav className="hidden md:flex items-center gap-6">
          <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
            Features
          </a>
          <a href="#demo" className="text-muted-foreground hover:text-foreground transition-colors">
            Demo
          </a>
          <Link to="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">
            Pricing
          </Link>
          <a href="#voices" className="text-muted-foreground hover:text-foreground transition-colors">
            Voice Marketplace
          </a>
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="hidden md:flex text-sm text-muted-foreground">
                {user.email}
              </span>
              <Link to="/dashboard" className="hidden md:block">
                <Button variant="ghost">
                  Dashboard
                </Button>
              </Link>
              <Button 
                variant="ghost"
                className="hidden md:flex"
                onClick={async () => {
                  await signOut();
                  navigate("/signin");
                }}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Link to="/signin" className="hidden md:block">
                <Button variant="ghost">
                  Sign In
                </Button>
              </Link>
              <Link to="/signup" className="hidden md:block">
                <Button variant="cinema">
                  Get Started
                </Button>
              </Link>
            </>
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden relative z-50"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 bg-background/95 backdrop-blur-lg border-b border-border z-40">
          <div className="container mx-auto px-4 py-4 space-y-4">
            <nav className="flex flex-col space-y-4">
              <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
                Features
              </a>
              <a href="#demo" className="text-muted-foreground hover:text-foreground transition-colors">
                Demo
              </a>
              <Link to="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">
                Pricing
              </Link>
              <a href="#voices" className="text-muted-foreground hover:text-foreground transition-colors">
                Voice Marketplace
              </a>
            </nav>
            
            {user ? (
              <div className="flex flex-col space-y-3 pt-4 border-t border-border">
                <span className="text-sm text-muted-foreground">{user.email}</span>
                <Link to="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start">
                    Dashboard
                  </Button>
                </Link>
                <Button 
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={async () => {
                    await signOut();
                    navigate("/signin");
                    setIsMobileMenuOpen(false);
                  }}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="flex flex-col space-y-3 pt-4 border-t border-border">
                <Link to="/signin" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full">
                    Sign In
                  </Button>
                </Link>
                <Link to="/signup" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="cinema" className="w-full">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};