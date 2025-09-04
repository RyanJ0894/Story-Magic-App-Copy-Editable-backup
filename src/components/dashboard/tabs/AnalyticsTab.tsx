import { useState, useEffect } from "react";
import { BarChart3, TrendingUp, Users, Clock, FolderOpen, Zap } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { type UserRole, type RolePermissions } from "@/types/roles";

interface AnalyticsTabProps {
  userRole: UserRole;
  permissions: RolePermissions;
  projects: any[];
  onDeleteProject?: (id: string, title: string) => void;
  deletingId?: string | null;
}

export function AnalyticsTab({ userRole, permissions, projects }: AnalyticsTabProps) {
  const [analytics, setAnalytics] = useState({
    totalProjects: 0,
    completedProjects: 0,
    totalAudioHours: 0,
    averageCompletionTime: 0,
    teamProductivity: 0,
    monthlyGrowth: 0,
    activeUsers: 0,
    topPerformers: [] as { name: string; projects: number; completion: number }[]
  });

  useEffect(() => {
    calculateAnalytics();
  }, [projects]);

  const calculateAnalytics = () => {
    const total = projects.length;
    const completed = projects.filter(p => p.audio_url).length;
    const completionRate = total > 0 ? (completed / total) * 100 : 0;
    
    // Mock calculations for demo
    const mockAudioHours = completed * 0.25; // Assume 15min average per project
    const mockAvgCompletionTime = 2.5; // 2.5 days average
    const mockTeamProductivity = Math.min(completionRate + 15, 100);
    const mockMonthlyGrowth = 12;
    
    // Calculate monthly projects
    const thisMonth = projects.filter(p => {
      const created = new Date(p.created_at);
      const now = new Date();
      return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
    }).length;

    setAnalytics({
      totalProjects: total,
      completedProjects: completed,
      totalAudioHours: mockAudioHours,
      averageCompletionTime: mockAvgCompletionTime,
      teamProductivity: mockTeamProductivity,
      monthlyGrowth: mockMonthlyGrowth,
      activeUsers: userRole === 'Master' ? 8 : userRole === 'Team Lead' ? 3 : 1,
      topPerformers: [
        { name: 'Sarah Johnson', projects: 12, completion: 95 },
        { name: 'Mike Chen', projects: 8, completion: 88 },
        { name: 'Alex Smith', projects: 6, completion: 92 }
      ]
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold">Analytics & Insights</h2>
        <p className="text-muted-foreground">
          {permissions.canSeeAllProjects 
            ? 'Organization-wide analytics and performance metrics' 
            : userRole === 'Team Lead' 
              ? 'Your team performance metrics' 
              : 'Your individual performance metrics'
          }
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              <FolderOpen className="h-4 w-4" />
              Total Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalProjects}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.monthlyGrowth > 0 ? '+' : ''}{analytics.monthlyGrowth}% this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              Completion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.totalProjects > 0 ? Math.round((analytics.completedProjects / analytics.totalProjects) * 100) : 0}%
            </div>
            <Progress 
              value={analytics.totalProjects > 0 ? (analytics.completedProjects / analytics.totalProjects) * 100 : 0} 
              className="mt-2" 
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              <Clock className="h-4 w-4" />
              Audio Generated
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalAudioHours.toFixed(1)}h</div>
            <p className="text-xs text-muted-foreground">Total duration</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              <Users className="h-4 w-4" />
              Active Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.activeUsers}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team Performance */}
        {(userRole === 'Master' || userRole === 'Team Lead') && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Team Performance
              </CardTitle>
              <CardDescription>Overall team productivity metrics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Team Productivity</span>
                  <Badge variant="outline" className="text-green-600">
                    {analytics.teamProductivity.toFixed(0)}%
                  </Badge>
                </div>
                <Progress value={analytics.teamProductivity} />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Average Completion Time</span>
                  <span className="text-sm text-muted-foreground">{analytics.averageCompletionTime} days</span>
                </div>
                <Progress value={Math.max(0, 100 - (analytics.averageCompletionTime * 10))} />
              </div>

              <div className="pt-2">
                <h4 className="text-sm font-medium mb-3">Top Performers</h4>
                <div className="space-y-2">
                  {analytics.topPerformers.map((performer, index) => (
                    <div key={performer.name} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center">
                          {index + 1}
                        </Badge>
                        <span className="text-sm font-medium">{performer.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{performer.projects} projects</div>
                        <div className="text-xs text-muted-foreground">{performer.completion}% completion</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Project Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Project Trends
            </CardTitle>
            <CardDescription>Project creation and completion patterns</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 border rounded-lg">
                <div className="text-lg font-semibold">{analytics.completedProjects}</div>
                <div className="text-sm text-muted-foreground">Completed</div>
              </div>
              <div className="p-3 border rounded-lg">
                <div className="text-lg font-semibold">{analytics.totalProjects - analytics.completedProjects}</div>
                <div className="text-sm text-muted-foreground">In Progress</div>
              </div>
            </div>

            <div className="pt-2">
              <h4 className="text-sm font-medium mb-3">Recent Milestones</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Reached {analytics.completedProjects} completed projects</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Generated {analytics.totalAudioHours.toFixed(1)} hours of audio</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>
                    {analytics.totalProjects > 0 ? Math.round((analytics.completedProjects / analytics.totalProjects) * 100) : 0}% completion rate achieved
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Detailed Insights
          </CardTitle>
          <CardDescription>
            In-depth analysis and recommendations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2 text-green-600">What's Working Well</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• High completion rate for new projects</li>
                <li>• Consistent project creation rhythm</li>
                <li>• Good team collaboration patterns</li>
              </ul>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2 text-yellow-600">Areas for Improvement</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Average completion time could be faster</li>
                <li>• Some projects remain in draft stage</li>
                <li>• Voice library utilization could increase</li>
              </ul>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2 text-blue-600">Recommendations</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Set up project templates for faster creation</li>
                <li>• Implement regular check-ins for drafts</li>
                <li>• Explore voice library training sessions</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}