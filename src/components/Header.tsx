import { Button } from "@/components/ui/button";
import { Film, Menu, LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export const Header = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-lg">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <img 
            src="/lovable-uploads/2a81761c-efdc-4094-9e5d-f297e2f44571.png" 
            alt="Story Magic" 
            className="h-28"
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
              <Link to="/dashboard">
                <Button variant="ghost">
                  Dashboard
                </Button>
              </Link>
              <Button 
                variant="ghost"
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
              <Link to="/signin">
                <Button variant="ghost">
                  Sign In
                </Button>
              </Link>
              <Link to="/signup">
                <Button variant="cinema">
                  Get Started
                </Button>
              </Link>
            </>
          )}
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
};