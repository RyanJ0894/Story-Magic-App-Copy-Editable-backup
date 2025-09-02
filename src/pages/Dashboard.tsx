// src/pages/Dashboard.tsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LogOut, User } from "lucide-react";
import { supabase } from "../integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DashboardTabs } from "@/components/dashboard/DashboardTabs";
import { type PlanTier } from "@/types/plans";
import { usePlanProtection } from "@/hooks/usePlanProtection";

type ProjectRow = { 
  id: string; 
  title: string | null; 
  created_at: string;
  ai_director_json: string | null;
  audio_url: string | null;
};

export default function Dashboard() {
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const { toast } = useToast();
  const { profile, loading: planLoading } = usePlanProtection();

  // Derive current plan from profile
  const currentPlan = (profile?.plan_type?.toLowerCase().replace(' ', '-') || 'individual') as PlanTier;

  useEffect(() => {
    let alive = true;
    
    // Get current user
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (alive) setUser(user);
    };
    
    // Load projects
    const loadProjects = async () => {
      try {
        const { data, error } = await supabase
          .from("user_projects")
          .select("id,title,created_at,ai_director_json,audio_url")
          .order("created_at", { ascending: false });
        if (error) throw error;
        if (alive) setProjects(data as ProjectRow[]);
      } catch (e: any) {
        setErr(e.message || "Failed to load projects");
      } finally {
        if (alive) setLoading(false);
      }
    };

    getCurrentUser();
    loadProjects();
    
    return () => {
      alive = false;
    };
  }, []);

  const handleDeleteProject = async (projectId: string, projectTitle: string) => {
    setDeletingId(projectId);
    try {
      const { error } = await supabase
        .from("user_projects")
        .delete()
        .eq("id", projectId);

      if (error) throw error;

      // Remove from local state
      setProjects(prev => prev.filter(p => p.id !== projectId));
      
      toast({
        title: "Project deleted",
        description: `"${projectTitle}" has been successfully deleted.`,
      });
    } catch (error: any) {
      console.error("Delete error:", error);
      toast({
        title: "Delete failed",
        description: error.message || "Failed to delete project. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast({
        title: "Logged out successfully",
        description: "You have been signed out of your account.",
      });
      
      // Redirect to home page
      window.location.href = "/";
    } catch (error: any) {
      toast({
        title: "Logout failed",
        description: error.message || "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading || planLoading) return <div className="min-h-screen flex items-center justify-center">Loading…</div>;
  if (err) return <div className="min-h-screen flex items-center justify-center text-destructive">{err}</div>;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-lg">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <img 
              src="/lovable-uploads/2a81761c-efdc-4094-9e5d-f297e2f44571.png" 
              alt="Story Magic" 
              className="h-28"
            />
          </Link>
          
          {/* User Menu */}
          <div className="flex items-center gap-4">
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {user.email?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium">{user.email}</p>
                      <p className="text-xs text-muted-foreground">
                        {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1).replace('-', ' ')} Plan
                      </p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      Profile Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Status Banners */}
        {profile?.account_status === 'trial' && (
          <div className="mb-6 p-4 bg-cinema-gold/10 border border-cinema-gold/20 rounded-lg">
            <p className="text-center text-foreground">
              <strong>Free Trial Active!</strong> 
              {profile.trial_end_date && ` ${Math.ceil((new Date(profile.trial_end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days remaining.`}
              <Link to="/pricing" className="ml-2 text-cinema-gold hover:underline">
                Upgrade anytime →
              </Link>
            </p>
          </div>
        )}
        
        {profile?.account_status === 'pending_enterprise_setup' && (
          <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <p className="text-center text-foreground">
              <strong>Enterprise setup in progress</strong> - we'll contact you within 24 hours to finalize your account.
            </p>
          </div>
        )}
        
        {profile?.account_status === 'pending_academic_verification' && (
          <div className="mb-6 p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
            <p className="text-center text-foreground">
              <strong>Academic verification in progress</strong> - we'll review your status within 48 hours.
            </p>
          </div>
        )}

        <DashboardTabs
          currentPlan={currentPlan}
          projects={projects}
          onDeleteProject={handleDeleteProject}
          deletingId={deletingId}
        />
      </div>
    </div>
  );
}
