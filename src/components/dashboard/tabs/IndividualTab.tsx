import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Eye, Trash2, AlertTriangle, Plus, Users, Zap, ThumbsUp, ThumbsDown, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { VoiceLibrary } from "@/components/feature/VoiceLibrary";
import { useVoiceCount } from "@/hooks/useVoiceCount";

function ReviewStatusBadge({ status }: { status: string | null | undefined }) {
  if (!status) return null;
  
  switch (status) {
    case 'like':
      return (
        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/50 gap-1">
          <ThumbsUp className="h-3 w-3" />
          Like
        </Badge>
      );
    case 'pass':
      return (
        <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/50 gap-1">
          <ThumbsDown className="h-3 w-3" />
          Pass
        </Badge>
      );
    case 'undecided':
      return (
        <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/50 gap-1">
          <HelpCircle className="h-3 w-3" />
          Undecided
        </Badge>
      );
    default:
      return null;
  }
}
interface IndividualTabProps {
  projects: any[];
  onDeleteProject: (id: string, title: string) => void;
  onBulkDeleteProjects?: (ids: string[]) => Promise<number>;
  deletingId: string | null;
  isBulkDeleting?: boolean;
}
export function IndividualTab({
  projects,
  onDeleteProject,
  onBulkDeleteProjects,
  deletingId,
  isBulkDeleting = false
}: IndividualTabProps) {
  const { count: voiceCount, loading: voiceCountLoading } = useVoiceCount();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [projectRatings, setProjectRatings] = useState<Record<string, string | null>>({});

  // Fetch ratings from local API for all projects
  useEffect(() => {
    const fetchRatings = async () => {
      const ratings: Record<string, string | null> = {};
      await Promise.all(
        projects.map(async (project) => {
          try {
            const response = await fetch(`/api/projects/${project.id}`);
            if (response.ok) {
              const data = await response.json();
              ratings[project.id] = data.reviewStatus || null;
            }
          } catch (error) {
            console.error(`Failed to fetch rating for project ${project.id}:`, error);
          }
        })
      );
      setProjectRatings(ratings);
    };
    if (projects.length > 0) {
      fetchRatings();
    }
  }, [projects]);

  useEffect(() => {
    const projectIds = new Set(projects.map(p => p.id));
    setSelectedIds(prev => {
      const filtered = new Set([...prev].filter(id => projectIds.has(id)));
      return filtered.size !== prev.size ? filtered : prev;
    });
  }, [projects]);

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === projects.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(projects.map(p => p.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (onBulkDeleteProjects && selectedIds.size > 0) {
      try {
        await onBulkDeleteProjects(Array.from(selectedIds));
        setSelectedIds(new Set());
        setBulkDeleteDialogOpen(false);
      } catch {
        setBulkDeleteDialogOpen(false);
      }
    }
  };
  return <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Individual Dashboard</h1>
          <p className="text-muted-foreground">Manage your personal projects and explore team features</p>
        </div>
        <Link to="/projects/new">
          <Button size="lg" className="gap-2">
            <Plus className="h-4 w-4" />
            Create New Project
          </Button>
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projects.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {projects.filter(p => p.audio_url).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Voice Library</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {voiceCountLoading ? '...' : voiceCount}
            </div>
            <p className="text-xs text-muted-foreground">ElevenLabs voices</p>
          </CardContent>
        </Card>
      </div>

      {/* Projects Section */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>My Projects</CardTitle>
            <CardDescription>Manage your personal audio projects</CardDescription>
          </div>
          {projects.length > 0 && (
            <div className="flex items-center gap-2">
              {selectedIds.size > 0 && (
                <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      disabled={isBulkDeleting}
                      data-testid="button-bulk-delete"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete {selectedIds.size} Selected
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                        Delete {selectedIds.size} Projects
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete {selectedIds.size} project{selectedIds.size !== 1 ? 's' : ''}? 
                        This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleBulkDelete} 
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        disabled={isBulkDeleting}
                      >
                        {isBulkDeleting ? "Deleting..." : "Delete Projects"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          )}
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? <div className="text-center py-8 space-y-4">
              <div className="text-muted-foreground">No projects yet. Create your first one to get started.</div>
              <Link to="/projects/new">
                <Button variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Project
                </Button>
              </Link>
            </div> : <div className="space-y-3">
              {/* Select All Row */}
              <div className="flex items-center gap-3 pb-2 border-b">
                <Checkbox
                  checked={selectedIds.size === projects.length && projects.length > 0}
                  onCheckedChange={toggleSelectAll}
                  data-testid="checkbox-select-all"
                />
                <span className="text-sm text-muted-foreground">
                  {selectedIds.size === 0 
                    ? "Select all" 
                    : `${selectedIds.size} of ${projects.length} selected`}
                </span>
              </div>
              {projects.map(project => <div key={project.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3 flex-1">
                    <Checkbox
                      checked={selectedIds.has(project.id)}
                      onCheckedChange={() => toggleSelection(project.id)}
                      data-testid={`checkbox-project-${project.id}`}
                    />
                    <div className="flex-1">
                      <div className="font-medium">{project.title || "Untitled Project"}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(project.created_at).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge variant="outline">
                          {project.ai_director_json ? project.audio_url ? 'Complete' : 'Analyzed' : 'Draft'}
                        </Badge>
                        <ReviewStatusBadge status={projectRatings[project.id]} />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link to={`/projects/${project.id}`}>
                      <Button variant="outline" size="sm" data-testid={`button-view-project-${project.id}`}>
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                    </Link>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" disabled={deletingId === project.id} className="text-destructive hover:text-destructive hover:bg-destructive/10" data-testid={`button-delete-project-${project.id}`}>
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
                            Are you sure you want to delete "{project.title || "Untitled Project"}"? 
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => onDeleteProject(project.id, project.title || "Untitled Project")} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete Project
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>)}
            </div>}
        </CardContent>
      </Card>

      {/* Voice Library Section */}
      <VoiceLibrary />

      {/* Upgrade Preview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Collaboration
            </CardTitle>
            <CardDescription>See what Enterprise can do</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2 opacity-60">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-muted-foreground rounded-full" />
                Share projects with team members
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-muted-foreground rounded-full" />
                Real-time collaboration on scripts
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-muted-foreground rounded-full" />
                Team voice library management
              </div>
            </div>
            <Button variant="outline" size="sm" className="w-full">
              Explore Enterprise Features
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-secondary/5 to-accent/5 border-secondary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Advanced Features
            </CardTitle>
            <CardDescription>Unlock professional tools</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2 opacity-60">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-muted-foreground rounded-full" />
                Custom voice cloning
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-muted-foreground rounded-full" />
                Priority audio processing
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-muted-foreground rounded-full" />
                Advanced analytics
              </div>
            </div>
            <Button variant="outline" size="sm" className="w-full">
              View Professional Plans
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>;
}