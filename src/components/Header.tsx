import { Button } from "@/components/ui/button";
import { Film, Menu } from "lucide-react";

export const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-lg">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Film className="h-8 w-8 text-cinema-gold" />
          <h1 className="text-xl font-bold bg-gradient-accent bg-clip-text text-transparent">
            Story Magic
          </h1>
        </div>
        
        <nav className="hidden md:flex items-center gap-6">
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

        <div className="flex items-center gap-3">
          <Button variant="ghost" className="hidden md:flex">
            Sign In
          </Button>
          <Button variant="cinema">
            Get Started
          </Button>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
};