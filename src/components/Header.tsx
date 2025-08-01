import { Button } from "@/components/ui/button";
import { Film, Menu, Mic, Volume2, Home, X, LayoutDashboard } from "lucide-react";
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
          className="flex items-center cursor-pointer hover:opacity-80 transition-opacity"
          onClick={handleHomeClick}
          title="Go to Homepage"
        >
          <img 
            src="/lovable-uploads/cdb1e7c3-497c-4996-bf08-d03c68bed2a7.png" 
            alt="Story Magic" 
            className="h-10 w-auto object-contain"
          />
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
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2"
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
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
                  <DropdownMenuItem onClick={() => handleNavigation('/dashboard')}>
                    <LayoutDashboard className="h-4 w-4 mr-2" />
                    Dashboard
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