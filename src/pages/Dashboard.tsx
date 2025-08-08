import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FolderOpen, Mic, Plus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

const Dashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/signin");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cinema-gold"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-lg">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-8">
            <a href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="h-8 w-8 bg-cinema-gold rounded flex items-center justify-center">
                <span className="text-background font-bold text-sm">S</span>
              </div>
              <h1 className="text-xl font-bold bg-gradient-accent bg-clip-text text-transparent">
                Story Magic
              </h1>
            </a>
            
            <nav className="hidden md:flex items-center gap-6">
              <a href="/" className="text-muted-foreground hover:text-foreground transition-colors">
                Home
              </a>
              <span className="text-foreground font-medium">Dashboard</span>
              <a href="/#features" className="text-muted-foreground hover:text-foreground transition-colors">
                Features
              </a>
              <a href="/#demo" className="text-muted-foreground hover:text-foreground transition-colors">
                Demo
              </a>
              <a href="/#voices" className="text-muted-foreground hover:text-foreground transition-colors">
                Voice Marketplace
              </a>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden md:flex text-sm text-muted-foreground">
              {user.email}
            </span>
            <Button 
              variant="ghost"
              onClick={() => navigate("/signin")}
            >
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Your <span className="bg-gradient-accent bg-clip-text text-transparent">Projects</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Manage your screenplay projects and audio productions
          </p>
        </div>

        {/* Projects Header */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-semibold">All Projects</h2>
          <div className="flex gap-3">
            <Button variant="ghost" className="gap-2">
              <Mic className="h-4 w-4" />
              Test Voice
            </Button>
            <Button variant="cinema" className="gap-2">
              <Plus className="h-4 w-4" />
              New Project
            </Button>
          </div>
        </div>

        {/* Projects Grid - Empty State */}
        <Card className="bg-cinema-surface border-border">
          <CardContent className="flex flex-col items-center justify-center py-24">
            <div className="w-20 h-20 mb-6 rounded-lg bg-muted flex items-center justify-center">
              <FolderOpen className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No projects yet</h3>
            <p className="text-muted-foreground mb-8 text-center max-w-md">
              Create your first project to get started with Story Magic
            </p>
            <Button variant="cinema" size="lg" className="gap-2">
              <Plus className="h-4 w-4" />
              Create Your First Project
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;