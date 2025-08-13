// src/pages/Dashboard.tsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Trash2, AlertTriangle, Film } from "lucide-react";
import { supabase } from "../integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

type ProjectRow = { id: string; title: string | null; created_at: string };

export default function Dashboard() {
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("user_projects")
          .select("id,title,created_at")
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-lg">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <img 
              src="/lovable-uploads/2a81761c-efdc-4094-9e5d-f297e2f44571.png" 
              alt="Story Magic" 
              className="h-10"
            />
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 text-foreground">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Your Projects</h1>
        <Link
          to="/projects/new"
          className="rounded-lg px-4 py-2 bg-primary text-primary-foreground hover:opacity-90"
        >
          + Create New Project
        </Link>
      </div>

      {loading && <div>Loading…</div>}
      {err && <div className="text-red-500">{err}</div>}

      {!loading && !err && projects.length === 0 && (
        <div className="opacity-75">No projects yet. Create your first one.</div>
      )}

      <ul className="space-y-3">
        {projects.map((p) => (
          <li key={p.id} className="rounded-xl border border-border p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="font-medium">{p.title || "Untitled Project"}</div>
                <div className="text-sm opacity-70">{new Date(p.created_at).toLocaleString()}</div>
              </div>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    disabled={deletingId === p.id}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                      Delete Project
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete "{p.title || "Untitled Project"}"? 
                      This action cannot be undone and will permanently remove all project data.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDeleteProject(p.id, p.title || "Untitled Project")}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete Project
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </li>
        ))}
      </ul>
      </div>
    </div>
  );
}
