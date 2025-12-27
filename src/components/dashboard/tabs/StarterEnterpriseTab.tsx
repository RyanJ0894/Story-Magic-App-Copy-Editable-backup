import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Eye, Trash2, AlertTriangle, Plus, Users, Mail, BarChart3, Share2, MessageSquare, Settings, ThumbsUp, ThumbsDown, HelpCircle, StickyNote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { VoiceLibrary } from "@/components/feature/VoiceLibrary";
import { TeamManagementTab } from "@/components/dashboard/tabs/TeamManagementTab";
import { useUserRole } from "@/hooks/useUserRole";
import { ROLE_PERMISSIONS } from "@/types/roles";

interface ProjectNote {
  id: string;
  projectId: string;
  lineId: string;
  text: string;
  createdAt: string;
  updatedAt: string;
}
interface StarterEnterpriseTabProps {
  projects: any[];
  onDeleteProject: (id: string, title: string) => void;
  onBulkDeleteProjects?: (ids: string[]) => Promise<number>;
  deletingId: string | null;
  isBulkDeleting?: boolean;
}
export function StarterEnterpriseTab({
  projects,
  onDeleteProject,
  onBulkDeleteProjects,
  deletingId,
  isBulkDeleting = false
}: StarterEnterpriseTabProps) {
  const [activeTeamTab, setActiveTeamTab] = useState("overview");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [projectRatings, setProjectRatings] = useState<Record<string, string | null>>({});
  const [projectNotes, setProjectNotes] = useState<Record<string, ProjectNote[]>>({});
  const [updatingRating, setUpdatingRating] = useState<string | null>(null);

  // Fetch ratings and notes from local API for all projects
  useEffect(() => {
    const fetchProjectData = async () => {
      const ratings: Record<string, string | null> = {};
      const notes: Record<string, ProjectNote[]> = {};
      
      await Promise.all(
        projects.map(async (project) => {
          try {
            // Fetch rating
            const ratingResponse = await fetch(`/api/projects/${project.id}`);
            if (ratingResponse.ok) {
              const data = await ratingResponse.json();
              ratings[project.id] = data.reviewStatus || null;
            }
            
            // Fetch notes
            const notesResponse = await fetch(`/api/projects/${project.id}/notes`);
            if (notesResponse.ok) {
              const notesData = await notesResponse.json();
              notes[project.id] = notesData;
            }
          } catch (error) {
            console.error(`Failed to fetch data for project ${project.id}:`, error);
          }
        })
      );
      setProjectRatings(ratings);
      setProjectNotes(notes);
    };
    if (projects.length > 0) {
      fetchProjectData();
    }
  }, [projects]);

  const handleRatingChange = async (projectId: string, rating: 'like' | 'pass' | 'undecided') => {
    const currentRating = projectRatings[projectId];
    const newRating = currentRating === rating ? null : rating;
    
    setUpdatingRating(projectId);
    try {
      const response = await fetch(`/api/projects/${projectId}/rating`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewStatus: newRating })
      });
      if (response.ok) {
        setProjectRatings(prev => ({ ...prev, [projectId]: newRating }));
      }
    } catch (error) {
      console.error('Failed to update rating:', error);
    } finally {
      setUpdatingRating(null);
    }
  };

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
  const { currentRole } = useUserRole();
  const permissions = currentRole ? ROLE_PERMISSIONS[currentRole] : ROLE_PERMISSIONS['Staff'];
  return <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Master Dashboard</h1>
          <p className="text-muted-foreground">Team collaboration and project management for up to 10 users</p>
        </div>
        <Link to="/projects/new">
          <Button size="lg" className="gap-2">
            <Plus className="h-4 w-4" />
            Create New Project
          </Button>
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Team Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projects.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">of 10 max</p>
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
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Support</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold">Email</div>
            <p className="text-xs text-muted-foreground">48h response</p>
          </CardContent>
        </Card>
      </div>

      {/* Voice Library */}
      <VoiceLibrary />

      {/* Main Content Tabs */}
      <Tabs value={activeTeamTab} onValueChange={setActiveTeamTab}>
        <TabsList className="grid grid-cols-4 w-full md:w-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Team Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Team Activity
              </CardTitle>
              <CardDescription>Recent team activity and collaboration</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <MessageSquare className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">New comment on "Project Alpha"</p>
                    <p className="text-xs text-muted-foreground">Sarah Johnson • 2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <Share2 className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Project shared with team</p>
                    <p className="text-xs text-muted-foreground">Mike Chen • 5 hours ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card 
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => setActiveTeamTab("team")}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="h-4 w-4" />
                  Invite Team Members
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Add up to 7 more users to your team</p>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Share2 className="h-4 w-4" />
                  Shared Library
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Access team script library</p>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Mail className="h-4 w-4" />
                  Contact Support
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">48-hour email support</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="team" className="space-y-6">
          <TeamManagementTab 
            userRole={currentRole || 'Staff'} 
            permissions={permissions}
            projects={projects}
            onDeleteProject={onDeleteProject}
            deletingId={deletingId}
          />
        </TabsContent>

        <TabsContent value="projects" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle>Team Projects</CardTitle>
                <CardDescription>Shared projects and collaboration</CardDescription>
              </div>
              {projects.length > 0 && selectedIds.size > 0 && (
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
            </CardHeader>
            <CardContent>
              {projects.length === 0 ? <div className="text-center py-8 space-y-4">
                  <div className="text-muted-foreground">No team projects yet. Create the first one.</div>
                  <Link to="/projects/new">
                    <Button>Create Team Project</Button>
                  </Link>
                </div> : <div className="space-y-3">
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
                  {projects.map(project => <div key={project.id} className="flex flex-col gap-3 p-3 border rounded-lg">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={selectedIds.has(project.id)}
                          onCheckedChange={() => toggleSelection(project.id)}
                          data-testid={`checkbox-project-${project.id}`}
                          className="mt-1"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium">{project.title || "Untitled Project"}</div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(project.created_at).toLocaleDateString()} • Shared with 2 members
                          </div>
                          <div className="flex flex-wrap gap-2 mt-1">
                            <Badge variant="outline">
                              {project.ai_director_json ? project.audio_url ? 'Complete' : 'Analyzed' : 'Draft'}
                            </Badge>
                            <Badge variant="secondary">Team</Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap ml-7">
                        <div className="flex items-center gap-1 mr-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            disabled={updatingRating === project.id}
                            className={`toggle-elevate ${projectRatings[project.id] === 'like' ? 'toggle-elevated bg-emerald-500/20 text-emerald-500' : 'text-muted-foreground'}`}
                            onClick={() => handleRatingChange(project.id, 'like')}
                            data-testid={`button-like-${project.id}`}
                          >
                            <ThumbsUp className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            disabled={updatingRating === project.id}
                            className={`toggle-elevate ${projectRatings[project.id] === 'pass' ? 'toggle-elevated bg-red-500/20 text-red-500' : 'text-muted-foreground'}`}
                            onClick={() => handleRatingChange(project.id, 'pass')}
                            data-testid={`button-pass-${project.id}`}
                          >
                            <ThumbsDown className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            disabled={updatingRating === project.id}
                            className={`toggle-elevate ${projectRatings[project.id] === 'undecided' ? 'toggle-elevated bg-amber-500/20 text-amber-500' : 'text-muted-foreground'}`}
                            onClick={() => handleRatingChange(project.id, 'undecided')}
                            data-testid={`button-undecided-${project.id}`}
                          >
                            <HelpCircle className="h-4 w-4" />
                          </Button>
                        </div>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className="relative">
                              <StickyNote className="h-4 w-4 mr-2" />
                              Notes
                              {(projectNotes[project.id]?.length || 0) > 0 && (
                                <Badge variant="secondary" className="ml-2 bg-yellow-500/20 text-yellow-600 dark:text-yellow-400">
                                  {projectNotes[project.id].length}
                                </Badge>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80" align="start">
                            <div className="space-y-2">
                              <h4 className="font-medium text-sm">Script Notes</h4>
                              {(projectNotes[project.id]?.length || 0) === 0 ? (
                                <p className="text-sm text-muted-foreground">No notes yet. Add notes from the player page.</p>
                              ) : (
                                <ScrollArea className="h-[200px]">
                                  <div className="space-y-2 pr-2">
                                    {projectNotes[project.id].map((note) => (
                                      <div key={note.id} className="p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-md">
                                        <div className="flex items-center gap-2 mb-1">
                                          <StickyNote className="h-3 w-3 text-yellow-600 dark:text-yellow-400" />
                                          <span className="text-xs text-muted-foreground">{note.lineId}</span>
                                        </div>
                                        <p className="text-sm">{note.text}</p>
                                      </div>
                                    ))}
                                  </div>
                                </ScrollArea>
                              )}
                            </div>
                          </PopoverContent>
                        </Popover>
                        <Link to={`/projects/${project.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                        </Link>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" disabled={deletingId === project.id} className="text-destructive hover:text-destructive hover:bg-destructive/10">
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
                                This will also remove it for all team members.
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
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Usage Analytics</CardTitle>
              <CardDescription>Team engagement and usage metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Projects Created</h4>
                  <div className="text-2xl font-bold">12</div>
                  <p className="text-sm text-muted-foreground">This month</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Audio Generated</h4>
                  <div className="text-2xl font-bold">4.2h</div>
                  <p className="text-sm text-muted-foreground">Total duration</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Team Engagement</h4>
                  <div className="text-2xl font-bold">85%</div>
                  <p className="text-sm text-muted-foreground">Active users</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>;
}