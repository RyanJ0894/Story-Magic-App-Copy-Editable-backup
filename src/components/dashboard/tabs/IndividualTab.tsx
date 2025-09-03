import { Link } from "react-router-dom";
import { Eye, Trash2, AlertTriangle, Plus, Users, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
interface IndividualTabProps {
  projects: any[];
  onDeleteProject: (id: string, title: string) => void;
  deletingId: string | null;
}
export function IndividualTab({
  projects,
  onDeleteProject,
  deletingId
}: IndividualTabProps) {
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
            <div className="text-2xl font-bold">50+</div>
            <p className="text-xs text-muted-foreground">Standard voices</p>
          </CardContent>
        </Card>
      </div>

      {/* Projects Section */}
      <Card>
        <CardHeader>
          <CardTitle>My Projects</CardTitle>
          <CardDescription>Manage your personal audio projects</CardDescription>
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
              {projects.map(project => <div key={project.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{project.title || "Untitled Project"}</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(project.created_at).toLocaleDateString()}
                    </div>
                    <Badge variant="outline" className="mt-1">
                      {project.ai_director_json ? project.audio_url ? 'Complete' : 'Analyzed' : 'Draft'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link to={`/projects/${project.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                    </Link>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" disabled={deletingId === project.id} className="text-destructive hover:text-destructive hover:bg-destructive/10">
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