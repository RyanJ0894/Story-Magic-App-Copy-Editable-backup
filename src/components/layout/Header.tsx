import { Button } from "@/components/ui/button";
import { Film, Menu, LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useState } from "react";

export const Header = () => {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-lg">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <img 
            src="/attached_assets/Story_Magic_Logo_Concept_9.1_1766710255734.png" 
            alt="Story Magic" 
            className="h-12 md:h-14"
          />
        </Link>
        
        <nav className="hidden md:flex items-center gap-6">
          <Link to="/features" className="text-muted-foreground hover:text-foreground transition-colors">
            Features
          </Link>
                    <Link to="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">
            Pricing
          </Link>
          <Link to="/voice-marketplace" className="text-muted-foreground hover:text-foreground transition-colors">
            Voice Marketplace
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          {loading ? (
            <div className="w-20 h-8 bg-muted animate-pulse rounded"></div>
          ) : user ? (
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
                onClick={async () => {
                  await signOut();
                  navigate("/signin");
                }}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link to="/features" className="w-full">
                      Features
                    </Link>
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem asChild>
                    <Link to="/pricing" className="w-full">
                      Pricing
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/voice-marketplace" className="w-full">
                      Voice Marketplace
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard" className="w-full">
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link to="/features" className="w-full">
                      Features
                    </Link>
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem asChild>
                    <Link to="/pricing" className="w-full">
                      Pricing
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/voice-marketplace" className="w-full">
                      Voice Marketplace
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/signin" className="w-full">
                      Sign In
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/signup" className="w-full">
                      Get Started
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </div>
    </header>
  );
};