import { useState } from "react";
import { Link } from "react-router-dom";
import { 
  Eye, Trash2, AlertTriangle, Plus, Crown, Shield, 
  BarChart3, Mic, Zap, Settings, Users, Headphones, Star
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
import { VoiceLibrary } from "@/components/feature/VoiceLibrary";

interface StudioEnterpriseTabProps {
  projects: any[];
  onDeleteProject: (id: string, title: string) => void;
  deletingId: string | null;
}

export function StudioEnterpriseTab({ projects, onDeleteProject, deletingId }: StudioEnterpriseTabProps) {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Crown className="h-6 w-6 text-primary" />
            Master Dashboard
          </h1>
          <p className="text-muted-foreground">Enterprise-scale production tools with unlimited custom voices for up to 75 users</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="lg">
            <Headphones className="h-4 w-4 mr-2" />
            Contact Account Manager
          </Button>
          <Link to="/projects/new">
            <Button size="lg" className="gap-2">
              <Plus className="h-4 w-4" />
              Create New Project
            </Button>
          </Link>
        </div>
      </div>

      {/* Premium Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Enterprise Projects</CardTitle>
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
            <div className="text-2xl font-bold">42</div>
            <p className="text-xs text-muted-foreground">of 75 max</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Custom Voices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">∞</div>
            <p className="text-xs text-muted-foreground">Unlimited</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Dedicated Infrastructure</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold text-primary">Active</div>
            <p className="text-xs text-muted-foreground">99.9% uptime</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Support</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold flex items-center gap-1">
              <Star className="h-3 w-3 text-primary" />
              24/7
            </div>
            <p className="text-xs text-muted-foreground">Dedicated + Priority</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Security</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold flex items-center gap-1">
              <Shield className="h-3 w-3 text-primary" />
              SSO
            </div>
            <p className="text-xs text-muted-foreground">Enterprise-grade</p>
          </CardContent>
        </Card>
      </div>

      {/* Voice Library */}
      <VoiceLibrary />

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-6 w-full md:w-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="team">Enterprise Team</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="voices">Voice Studio</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="admin">Admin</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Studio Features Showcase */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Mic className="h-5 w-5 text-primary" />
                  Unlimited Voice Cloning
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">Create unlimited custom voices for your organization</p>
                <div className="text-2xl font-bold text-primary">12</div>
                <p className="text-xs text-muted-foreground">Active custom voices</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Zap className="h-5 w-5 text-secondary" />
                  Dedicated Infrastructure
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">Private processing cluster for your team</p>
                <div className="text-2xl font-bold text-secondary">5x</div>
                <p className="text-xs text-muted-foreground">Faster processing</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Shield className="h-5 w-5 text-accent" />
                  Enterprise Security
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">SSO, advanced permissions, compliance</p>
                <Badge className="bg-accent text-accent-foreground">SOC 2 Ready</Badge>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-muted/10 to-muted/5 border-muted/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Settings className="h-5 w-5" />
                  White-Label Options
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">Custom branding for client-facing work</p>
                <Button variant="outline" size="sm" className="w-full">Configure</Button>
              </CardContent>
            </Card>
          </div>

          {/* Executive Dashboard */}
          <Card>
            <CardHeader>
              <CardTitle>Executive Overview</CardTitle>
              <CardDescription>High-level insights for leadership team</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Production Metrics</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Audio Hours Produced</span>
                      <span className="font-medium">45.2h</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Projects Completed</span>
                      <span className="font-medium">128</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Processing Efficiency</span>
                      <span className="font-medium text-primary">95%</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-3">Team Performance</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Active Departments</span>
                      <span className="font-medium">6</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Collaboration Score</span>
                      <span className="font-medium text-primary">92%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Training Completed</span>
                      <span className="font-medium">38/42</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-3">Infrastructure</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">System Uptime</span>
                      <span className="font-medium text-primary">99.9%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Processing Speed</span>
                      <span className="font-medium">5x Standard</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Security Status</span>
                      <span className="font-medium text-primary">Compliant</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Enterprise Team Management</CardTitle>
              <CardDescription>Advanced user hierarchies and department management for up to 75 users</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Department Structure */}
              <div>
                <h4 className="font-medium mb-3">Department Overview</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Production Department</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-lg font-bold">15 users</div>
                      <p className="text-xs text-muted-foreground">8 Editors, 5 Admins, 2 Viewers</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Creative Department</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-lg font-bold">12 users</div>
                      <p className="text-xs text-muted-foreground">10 Editors, 2 Admins</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Client Services</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-lg font-bold">8 users</div>
                      <p className="text-xs text-muted-foreground">5 Editors, 2 Admins, 1 Viewer</p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Advanced Team Features */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-3">Multi-Level Administration</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Super Admins</span>
                      <span className="font-medium">3</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Department Admins</span>
                      <span className="font-medium">9</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Project Managers</span>
                      <span className="font-medium">12</span>
                    </div>
                  </div>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-3">Enterprise Features</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-primary" />
                      SSO Integration Active
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      Advanced Permissions
                    </div>
                    <div className="flex items-center gap-2">
                      <Settings className="h-4 w-4 text-primary" />
                      Custom User Policies
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Studio-Grade Project Management</CardTitle>
              <CardDescription>Advanced workflow automation and production-level collaboration</CardDescription>
            </CardHeader>
            <CardContent>
              {projects.length === 0 ? (
                <div className="text-center py-8 space-y-4">
                  <div className="text-muted-foreground">No studio projects yet. Create your first production-grade project.</div>
                  <Link to="/projects/new">
                    <Button>Create Studio Project</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {projects.map((project) => (
                    <div key={project.id} className="flex items-center justify-between p-4 border rounded-lg bg-gradient-to-r from-background to-muted/20">
                      <div className="flex-1">
                        <div className="font-medium flex items-center gap-2">
                          {project.title || "Untitled Project"}
                          <Badge variant="default">Studio</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(project.created_at).toLocaleDateString()} • Production Department • Automated Workflow
                        </div>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="outline">
                            {project.ai_director_json ? (project.audio_url ? 'Complete' : 'Analyzed') : 'Draft'}
                          </Badge>
                          <Badge variant="secondary">Priority Processing</Badge>
                          <Badge variant="outline">v3.2</Badge>
                          <Badge variant="outline">White-Label Ready</Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">Workflow</Button>
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
                                Delete Studio Project
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete the studio project and all automated workflows. This action affects the entire production pipeline.
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
              <CardTitle>Studio Voice Production Suite</CardTitle>
              <CardDescription>Unlimited custom voice cloning and custom ambient soundscapes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Unlimited Custom Voices */}
                <div>
                  <h4 className="font-medium mb-3">Custom Voice Library (12 Active)</h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {[
                      { name: "CEO Executive Voice", dept: "Corporate", quality: "Studio Grade" },
                      { name: "Brand Narrator", dept: "Marketing", quality: "Professional" },
                      { name: "Training Instructor", dept: "Training", quality: "Clear & Engaging" },
                      { name: "Sales Pitch Voice", dept: "Sales", quality: "Persuasive" },
                      { name: "Technical Expert", dept: "Product", quality: "Authoritative" },
                      { name: "Customer Service Rep", dept: "Support", quality: "Friendly" },
                    ].map((voice, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{voice.name}</p>
                          <p className="text-sm text-muted-foreground">{voice.dept} • {voice.quality}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">Edit</Button>
                          <Button variant="outline" size="sm">Use Voice</Button>
                        </div>
                      </div>
                    ))}
                    <div className="p-3 border-2 border-dashed rounded-lg text-center">
                      <Button>Create New Custom Voice</Button>
                      <p className="text-xs text-muted-foreground mt-1">Unlimited creation</p>
                    </div>
                  </div>
                </div>

                {/* Custom Ambient Soundscapes */}
                <div>
                  <h4 className="font-medium mb-3">Custom Ambient Soundscapes</h4>
                  <div className="space-y-2">
                    <div className="p-3 border rounded-lg">
                      <p className="font-medium">Corporate Office Ambience</p>
                      <p className="text-sm text-muted-foreground">Custom-designed for presentations</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <p className="font-medium">Training Room Environment</p>
                      <p className="text-sm text-muted-foreground">Optimized for learning content</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <p className="font-medium">Product Demo Background</p>
                      <p className="text-sm text-muted-foreground">Branded audio environment</p>
                    </div>
                    <div className="p-3 border-2 border-dashed rounded-lg text-center">
                      <Button variant="outline">Commission Custom Soundscape</Button>
                      <p className="text-xs text-muted-foreground mt-1">Bespoke audio environments</p>
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
              <CardTitle>Executive Analytics & Reporting Suite</CardTitle>
              <CardDescription>Detailed reporting suite with exportable analytics for decision-making</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="p-4 border rounded-lg text-center">
                  <h4 className="font-medium mb-2">Total Audio Production</h4>
                  <div className="text-3xl font-bold text-primary">156.7h</div>
                  <p className="text-sm text-muted-foreground">This quarter</p>
                </div>
                <div className="p-4 border rounded-lg text-center">
                  <h4 className="font-medium mb-2">ROI on Voice Production</h4>
                  <div className="text-3xl font-bold text-primary">340%</div>
                  <p className="text-sm text-muted-foreground">vs traditional methods</p>
                </div>
                <div className="p-4 border rounded-lg text-center">
                  <h4 className="font-medium mb-2">Processing Efficiency</h4>
                  <div className="text-3xl font-bold text-primary">98.2%</div>
                  <p className="text-sm text-muted-foreground">Dedicated infrastructure</p>
                </div>
                <div className="p-4 border rounded-lg text-center">
                  <h4 className="font-medium mb-2">User Satisfaction</h4>
                  <div className="text-3xl font-bold text-primary">9.4/10</div>
                  <p className="text-sm text-muted-foreground">Average rating</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <Button>Export Full Report</Button>
                <Button variant="outline">Schedule Quarterly Review</Button>
                <Button variant="outline">View Advanced Metrics</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="admin" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Enterprise Administration</CardTitle>
              <CardDescription>Advanced security, compliance, and organizational settings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Security & Compliance</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-primary" />
                        <span>SSO Integration</span>
                      </div>
                      <Badge className="bg-primary text-primary-foreground">Active</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-primary" />
                        <span>Advanced Permissions</span>
                      </div>
                      <Badge className="bg-primary text-primary-foreground">Configured</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        <span>SOC 2 Compliance</span>
                      </div>
                      <Button variant="outline" size="sm">Configure</Button>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-3">White-Label Configuration</h4>
                  <div className="space-y-3">
                    <div className="p-3 border rounded-lg">
                      <label className="text-sm font-medium">Custom Logo URL</label>
                      <input className="w-full mt-1 p-2 border rounded text-sm" placeholder="https://company.com/logo.png" />
                    </div>
                    <div className="p-3 border rounded-lg">
                      <label className="text-sm font-medium">Brand Colors</label>
                      <div className="flex gap-2 mt-1">
                        <input type="color" className="w-12 h-8 border rounded" />
                        <input type="color" className="w-12 h-8 border rounded" />
                      </div>
                    </div>
                    <Button className="w-full">Update Branding</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}