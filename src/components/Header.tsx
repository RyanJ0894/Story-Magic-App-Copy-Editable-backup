import { Button } from "@/components/ui/button";
import { Film, Menu, Mic, Volume2, Home, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Header = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleHomeClick = () => {
    navigate('/');
    setMobileMenuOpen(false);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-lg">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div 
          className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={handleHomeClick}
          title="Go to Homepage"
        >
          <Film className="h-8 w-8 text-cinema-gold" />
          <h1 className="text-xl font-bold bg-gradient-accent bg-clip-text text-transparent">
            Story Magic
          </h1>
        </div>
        
        {user && (
          <nav className="hidden md:flex items-center gap-6">
            <Button
              variant="ghost"
              onClick={handleHomeClick}
              className="flex items-center gap-2"
            >
              <Home className="h-4 w-4" />
              Home
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigate('/test-voice')}
              className="flex items-center gap-2"
            >
              <Volume2 className="h-4 w-4" />
              Single Voice
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigate('/multi-voice')}
              className="flex items-center gap-2"
            >
              <Mic className="h-4 w-4" />
              Multi-Voice
            </Button>
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#demo" className="text-muted-foreground hover:text-foreground transition-colors">
              Demo
            </a>
            <a href="#voices" className="text-muted-foreground hover:text-foreground transition-colors">
              Voice Marketplace
            </a>
          </nav>
        )}

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Button variant="ghost" onClick={handleSignOut} className="hidden md:flex">
                Sign Out
              </Button>
              <DropdownMenu open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden">
                    {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={handleHomeClick}>
                    <Home className="h-4 w-4 mr-2" />
                    Home
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleNavigation('/test-voice')}>
                    <Volume2 className="h-4 w-4 mr-2" />
                    Single Voice
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleNavigation('/multi-voice')}>
                    <Mic className="h-4 w-4 mr-2" />
                    Multi-Voice
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSignOut}>
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button variant="ghost" className="hidden md:flex" onClick={() => navigate('/auth')}>
                Sign In
              </Button>
              <Button variant="cinema" onClick={() => navigate('/auth')}>
                Get Started
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};