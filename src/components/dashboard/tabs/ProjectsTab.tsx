import { Link } from "react-router-dom";
import { Eye, Trash2, AlertTriangle, Plus, FolderOpen, Users, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { type UserRole, type RolePermissions } from "@/types/roles";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ProjectsTabProps {
  userRole: UserRole;
  permissions: RolePermissions;
  projects: any[];
  onDeleteProject: (id: string, title: string) => void;
  deletingId: string | null;
}

export function ProjectsTab({ userRole, permissions, projects, onDeleteProject, deletingId }: ProjectsTabProps) {
  const [teamMembers, setTeamMembers] = useState<{[key: string]: {role: string}}>({});
  
  // Load team member information for displaying project creators
  useEffect(() => {
    if (userRole === 'Master' || userRole === 'Team Lead') {
      const loadTeamMembers = async () => {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('user_id, role');
          
          if (error) throw error;
          
          const memberMap = (data || []).reduce((acc: any, member: any) => {
            acc[member.user_id] = { role: member.role };
            return acc;
          }, {});
          
          setTeamMembers(memberMap);
        } catch (error) {
          console.error('Error loading team members:', error);
        }
      };
      
      loadTeamMembers();
    }
  }, [userRole]);
  
  const getProjectStats = () => {
    const total = projects.length;
    const completed = projects.filter(p => p.audio_url).length;
    const inProgress = projects.filter(p => p.ai_director_json && !p.audio_url).length;
    const drafts = projects.filter(p => !p.ai_director_json).length;
    
    return { total, completed, inProgress, drafts };
  };

  const stats = getProjectStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Projects</h2>
          <p className="text-muted-foreground">
            {permissions.canSeeAllProjects 
              ? 'All organizational projects' 
              : userRole === 'Team Lead' 
                ? 'Your team projects' 
                : 'Your individual projects'
            }
          </p>
        </div>
        <Link to="/projects/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Create New Project
          </Button>
        </Link>
      </div>

      {/* Project Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.inProgress}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Drafts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{stats.drafts}</div>
          </CardContent>
        </Card>
      </div>

      {/* Projects List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            All Projects ({projects.length})
          </CardTitle>
          <CardDescription>
            Manage and organize your projects
          </CardDescription>
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                <FolderOpen className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-medium">No projects yet</h3>
                <p className="text-muted-foreground">Create your first project to get started</p>
              </div>
              <Link to="/projects/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Project
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {projects.map((project) => (
                <div key={project.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium truncate">
                        {project.title || "Untitled Project"}
                      </h3>
                      <Badge variant="outline" className="shrink-0">
                        {project.audio_url ? (
                          <span className="text-green-600">Complete</span>
                        ) : project.ai_director_json ? (
                          <span className="text-yellow-600">In Progress</span>
                        ) : (
                          <span className="text-gray-600">Draft</span>
                        )}
                      </Badge>
                    </div>
                    
                     <div className="flex items-center gap-4 text-sm text-muted-foreground">
                       <div className="flex items-center gap-1">
                         <Clock className="h-3 w-3" />
                         {new Date(project.created_at).toLocaleDateString()}
                       </div>
                       
                       {/* Show creator info for team visibility */}
                       {(userRole === 'Master' || userRole === 'Team Lead') && teamMembers[project.user_id] && (
                         <div className="flex items-center gap-1">
                           <Users className="h-3 w-3" />
                           Created by {teamMembers[project.user_id].role}
                         </div>
                       )}
                     </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <Link to={`/projects/${project.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                    </Link>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          disabled={deletingId === project.id}
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
                            Are you sure you want to delete "{project.title || "Untitled Project"}"? 
                            This action cannot be undone and will permanently remove all project data.
                            {(userRole === 'Master' || userRole === 'Team Lead') && 
                              " This will also remove access for all team members."}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => onDeleteProject(project.id, project.title || "Untitled Project")}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete Project
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}