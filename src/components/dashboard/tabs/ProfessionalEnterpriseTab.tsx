import { useState } from "react";
import { Link } from "react-router-dom";
import { 
  Eye, Trash2, AlertTriangle, Plus, Users, Crown, 
  BarChart3, Share2, MessageSquare, Mic, Zap, Phone 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

interface ProfessionalEnterpriseTabProps {
  projects: any[];
  onDeleteProject: (id: string, title: string) => void;
  deletingId: string | null;
}

export function ProfessionalEnterpriseTab({ projects, onDeleteProject, deletingId }: ProfessionalEnterpriseTabProps) {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Crown className="h-6 w-6 text-primary" />
            Professional Enterprise Dashboard
          </h1>
          <p className="text-muted-foreground">Advanced team collaboration and premium voice features for up to 30 users</p>
        </div>
        <Link to="/projects/new">
          <Button size="lg" className="gap-2">
            <Plus className="h-4 w-4" />
            Create New Project
          </Button>
        </Link>
      </div>

      {/* Enhanced Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">of 30 max</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Voice Library</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">50+</div>
            <p className="text-xs text-muted-foreground">Premium voices</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Custom Voices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2/5</div>
            <p className="text-xs text-muted-foreground">Cloned voices</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Support</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold flex items-center gap-1">
              <Phone className="h-3 w-3" />
              24h
            </div>
            <p className="text-xs text-muted-foreground">Phone + Email</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 w-full md:w-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="voices">Voices</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Professional Features Showcase */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mic className="h-5 w-5 text-primary" />
                  Custom Voice Cloning
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">Create up to 5 custom voices for your team</p>
                <Button size="sm" className="w-full">Create Custom Voice</Button>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-secondary" />
                  Priority Processing
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">Faster audio generation for your projects</p>
                <div className="text-2xl font-bold text-secondary">2x</div>
                <p className="text-xs text-muted-foreground">Faster than standard</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-accent" />
                  Advanced Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">Detailed insights into team performance</p>
                <Button variant="outline" size="sm" className="w-full">View Analytics</Button>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Team Activity</CardTitle>
              <CardDescription>Latest collaboration and project updates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <Mic className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">New custom voice "CEO Voice" created</p>
                    <p className="text-xs text-muted-foreground">Marketing Team • 1 hour ago</p>
                  </div>
                  <Badge variant="outline">Custom Voice</Badge>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="w-8 h-8 bg-secondary/10 rounded-full flex items-center justify-center">
                    <MessageSquare className="h-4 w-4 text-secondary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Version control update on "Product Demo Script"</p>
                    <p className="text-xs text-muted-foreground">Sarah Johnson • 3 hours ago</p>
                  </div>
                  <Badge variant="secondary">Version Control</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Team Management</CardTitle>
              <CardDescription>Manage up to 30 users with department organization</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Department Organization */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Marketing Department</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-bold">3 users</div>
                    <p className="text-xs text-muted-foreground">2 Editors, 1 Admin</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Sales Department</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-bold">2 users</div>
                    <p className="text-xs text-muted-foreground">1 Editor, 1 Viewer</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Training Department</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-bold">3 users</div>
                    <p className="text-xs text-muted-foreground">2 Editors, 1 Viewer</p>
                  </CardContent>
                </Card>
              </div>

              {/* Bulk User Actions */}
              <div className="p-4 border rounded-lg bg-muted/20">
                <h4 className="font-medium mb-3">Bulk User Management</h4>
                <div className="flex gap-3">
                  <Button variant="outline">Import CSV</Button>
                  <Button variant="outline">Export User List</Button>
                  <Button variant="outline">Send Bulk Invites</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Professional Project Management</CardTitle>
              <CardDescription>Advanced collaboration with version control and approval workflows</CardDescription>
            </CardHeader>
            <CardContent>
              {projects.length === 0 ? (
                <div className="text-center py-8 space-y-4">
                  <div className="text-muted-foreground">No projects yet. Create your first professional project.</div>
                  <Link to="/projects/new">
                    <Button>Create Professional Project</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {projects.map((project) => (
                    <div key={project.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{project.title || "Untitled Project"}</div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(project.created_at).toLocaleDateString()} • Marketing Department
                        </div>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="outline">
                            {project.ai_director_json ? (project.audio_url ? 'Complete' : 'Analyzed') : 'Draft'}
                          </Badge>
                          <Badge variant="secondary">Professional</Badge>
                          <Badge variant="outline">v2.1</Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Comments (3)
                        </Button>
                        <Button variant="outline" size="sm">Approve</Button>
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
                                This will permanently delete the project and all its versions. All team members will lose access.
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
        </TabsContent>

        <TabsContent value="voices" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Premium Voice Library & Custom Voices</CardTitle>
              <CardDescription>50+ premium voices plus custom voice cloning (up to 5)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Custom Voices */}
                <div>
                  <h4 className="font-medium mb-3">Custom Voices (2/5)</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">CEO Voice</p>
                        <p className="text-sm text-muted-foreground">Created by Marketing Team</p>
                      </div>
                      <Button variant="outline" size="sm">Use Voice</Button>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">Training Narrator</p>
                        <p className="text-sm text-muted-foreground">Created by Training Dept</p>
                      </div>
                      <Button variant="outline" size="sm">Use Voice</Button>
                    </div>
                    <div className="p-3 border-2 border-dashed rounded-lg text-center">
                      <Button>Create New Custom Voice</Button>
                      <p className="text-xs text-muted-foreground mt-1">3 remaining</p>
                    </div>
                  </div>
                </div>

                {/* Premium Voice Library */}
                <div>
                  <h4 className="font-medium mb-3">Premium Voice Library (50+)</h4>
                  <div className="space-y-2">
                    <div className="p-3 border rounded-lg">
                      <p className="font-medium">Professional Collection</p>
                      <p className="text-sm text-muted-foreground">20 business-focused voices</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <p className="font-medium">Character Collection</p>
                      <p className="text-sm text-muted-foreground">15 character voices</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <p className="font-medium">Narrator Collection</p>
                      <p className="text-sm text-muted-foreground">15 narrative voices</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Analytics Dashboard</CardTitle>
              <CardDescription>Comprehensive insights and team performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Audio Generated</h4>
                  <div className="text-2xl font-bold">12.5h</div>
                  <p className="text-sm text-muted-foreground">This month</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Team Productivity</h4>
                  <div className="text-2xl font-bold">92%</div>
                  <p className="text-sm text-muted-foreground">Efficiency score</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Voice Usage</h4>
                  <div className="text-2xl font-bold">15</div>
                  <p className="text-sm text-muted-foreground">Different voices used</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Processing Speed</h4>
                  <div className="text-2xl font-bold">2.1x</div>
                  <p className="text-sm text-muted-foreground">Priority boost</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}