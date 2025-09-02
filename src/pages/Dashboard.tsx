// src/pages/Dashboard.tsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DashboardTabs } from "@/components/dashboard/DashboardTabs";
import { type PlanTier } from "@/types/plans";

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
  const [currentPlan] = useState<PlanTier>('individual'); // TODO: Get from user data
  const { toast } = useToast();

  useEffect(() => {
    let alive = true;
    (async () => {
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
    })();
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

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading…</div>;
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
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
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
