import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Plus, BarChart3, Users, FolderOpen, MessageSquare, Share2, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { type UserRole, type RolePermissions } from "@/types/roles";

interface OverviewTabProps {
  userRole: UserRole;
  permissions: RolePermissions;
  projects: any[];
  onDeleteProject: (id: string, title: string) => void;
  deletingId: string | null;
}

export function OverviewTab({ userRole, permissions, projects }: OverviewTabProps) {
  const [teamStats, setTeamStats] = useState({
    totalMembers: 0,
    activeProjects: 0,
    completedProjects: 0,
    pendingInvites: 0
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOverviewData();
  }, []);

  const loadOverviewData = async () => {
    try {
      // Load team members count
      const { data: members, error: membersError } = await supabase
        .from('profiles')
        .select('user_id, role, created_at');

      if (membersError) throw membersError;

      // Load pending invitations count  
      const { data: invites, error: invitesError } = await supabase
        .from('team_invitations')
        .select('id')
        .eq('status', 'pending');

      if (invitesError) throw invitesError;

      const completedProjects = projects.filter(p => p.audio_url).length;
      const activeProjects = projects.filter(p => !p.audio_url).length;

      setTeamStats({
        totalMembers: members?.length || 0,
        activeProjects,
        completedProjects,
        pendingInvites: invites?.length || 0
      });

      // Mock recent activity for demo
      setRecentActivity([
        {
          id: 1,
          type: 'project_created',
          message: 'New project "Marketing Campaign" created',
          user: 'Sarah Johnson',
          timestamp: '2 hours ago'
        },
        {
          id: 2,
          type: 'member_joined',
          message: 'Mike Chen joined the team',
          user: 'System',
          timestamp: '1 day ago'
        },
        {
          id: 3,
          type: 'project_completed',
          message: 'Project "Product Demo" audio generated',
          user: 'Alex Smith',
          timestamp: '2 days ago'
        }
      ]);
    } catch (error: any) {
      console.error('Error loading overview data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-8">Loading overview...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projects.length}</div>
            <p className="text-xs text-muted-foreground">
              {teamStats.activeProjects} active, {teamStats.completedProjects} completed
            </p>
          </CardContent>
        </Card>
        
        {(userRole === 'Master' || userRole === 'Team Lead') && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{teamStats.totalMembers}</div>
              <p className="text-xs text-muted-foreground">
                {teamStats.pendingInvites} pending invites
              </p>
            </CardContent>
          </Card>
        )}
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {projects.length > 0 ? Math.round((teamStats.completedProjects / projects.length) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">Projects with audio</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {projects.filter(p => {
                const created = new Date(p.created_at);
                const now = new Date();
                return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
              }).length}
            </div>
            <p className="text-xs text-muted-foreground">New projects</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest team activity and updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No recent activity</p>
              ) : (
                recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      {activity.type === 'project_created' && <FolderOpen className="h-4 w-4 text-primary" />}
                      {activity.type === 'member_joined' && <Users className="h-4 w-4 text-primary" />}
                      {activity.type === 'project_completed' && <TrendingUp className="h-4 w-4 text-primary" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.message}</p>
                      <p className="text-xs text-muted-foreground">{activity.user} • {activity.timestamp}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link to="/projects/new">
              <Button variant="outline" className="w-full justify-start gap-2">
                <Plus className="h-4 w-4" />
                Create New Project
              </Button>
            </Link>
            
            {(userRole === 'Master' || userRole === 'Team Lead') && (
              <>
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Users className="h-4 w-4" />
                  Invite Team Member
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Share2 className="h-4 w-4" />
                  Share Project Library
                </Button>
              </>
            )}
            
            <Button variant="outline" className="w-full justify-start gap-2">
              <MessageSquare className="h-4 w-4" />
              Contact Support
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Projects Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Projects</CardTitle>
          <CardDescription>Your latest project activity</CardDescription>
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <div className="text-center py-8 space-y-4">
              <p className="text-muted-foreground">No projects yet. Create your first one!</p>
              <Link to="/projects/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Project
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {projects.slice(0, 3).map((project) => (
                <div key={project.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{project.title || "Untitled Project"}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(project.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {project.audio_url ? 'Complete' : project.ai_director_json ? 'Analyzed' : 'Draft'}
                    </Badge>
                    <Link to={`/projects/${project.id}`}>
                      <Button variant="outline" size="sm">View</Button>
                    </Link>
                  </div>
                </div>
              ))}
              {projects.length > 3 && (
                <div className="text-center pt-2">
                  <Button variant="ghost" size="sm">
                    View All Projects ({projects.length})
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}