import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  Eye, Trash2, AlertTriangle, Plus, Crown, Infinity, 
  BarChart3, Shield, Building, Users, Star, Zap, Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
import { TeamManagementTab } from "@/components/dashboard/tabs/TeamManagementTab";
import { useUserRole } from "@/hooks/useUserRole";
import { ROLE_PERMISSIONS } from "@/types/roles";

interface EnterpriseUnlimitedTabProps {
  projects: any[];
  onDeleteProject: (id: string, title: string) => void;
  onBulkDeleteProjects?: (ids: string[]) => Promise<number>;
  deletingId: string | null;
  isBulkDeleting?: boolean;
}

export function EnterpriseUnlimitedTab({ projects, onDeleteProject, onBulkDeleteProjects, deletingId, isBulkDeleting = false }: EnterpriseUnlimitedTabProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Crown className="h-6 w-6 text-primary" />
            <Infinity className="h-5 w-5 text-primary" />
            Master Dashboard
          </h1>
          <p className="text-muted-foreground">Unlimited scale, custom development, and executive-level service for 200+ users</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="lg">
            <Star className="h-4 w-4 mr-2" />
            Schedule Executive Review
          </Button>
          <Link to="/projects/new">
            <Button size="lg" className="gap-2">
              <Plus className="h-4 w-4" />
              Create Enterprise Project
            </Button>
          </Link>
        </div>
      </div>

      {/* Enterprise-Scale Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Enterprise Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projects.length}</div>
            <p className="text-xs text-muted-foreground">Unlimited scale</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">247</div>
            <p className="text-xs text-muted-foreground">No limits</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Custom Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">Developed</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-muted/10 to-muted/5 border-muted/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Infrastructure</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold text-primary">Private Cloud</div>
            <p className="text-xs text-muted-foreground">99.99% SLA</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Compliance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold flex items-center gap-1">
              <Shield className="h-3 w-3 text-primary" />
              SOC 2 + GDPR
            </div>
            <p className="text-xs text-muted-foreground">Certified</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Executive Support</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold flex items-center gap-1">
              <Star className="h-3 w-3 text-secondary" />
              Dedicated
            </div>
            <p className="text-xs text-muted-foreground">Product team direct</p>
          </CardContent>
        </Card>
      </div>

      {/* Voice Library */}
      <VoiceLibrary />

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-6 w-full md:w-auto">
          <TabsTrigger value="overview">Executive</TabsTrigger>
          <TabsTrigger value="organization">Organization</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="development">Development</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="governance">Governance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Executive Dashboard */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="col-span-full bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-primary" />
                  Executive Summary
                </CardTitle>
                <CardDescription>High-level business impact and strategic insights</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary">$2.4M</div>
                    <p className="text-sm text-muted-foreground">Annual Production Value</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary">78%</div>
                    <p className="text-sm text-muted-foreground">Cost Reduction vs Traditional</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary">15x</div>
                    <p className="text-sm text-muted-foreground">Faster Time to Market</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary">99.8%</div>
                    <p className="text-sm text-muted-foreground">Client Satisfaction</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Custom Development Pipeline</CardTitle>
                <CardDescription>Bespoke features under development</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium">Multi-Language Voice Synthesis</p>
                      <p className="text-xs text-muted-foreground">Real-time language switching</p>
                    </div>
                    <Badge className="bg-primary text-primary-foreground">In Progress</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium">AI Script Optimization</p>
                      <p className="text-xs text-muted-foreground">Performance-driven rewriting</p>
                    </div>
                    <Badge variant="outline">Planning</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium">Enterprise API Suite</p>
                      <p className="text-xs text-muted-foreground">Custom integrations</p>
                    </div>
                    <Badge className="bg-secondary text-secondary-foreground">Testing</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Exclusive Benefits</CardTitle>
                <CardDescription>Enterprise Unlimited privileges</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <Star className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Quarterly Business Reviews</p>
                      <p className="text-xs text-muted-foreground">Direct access to product leadership</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-secondary/10 rounded-full flex items-center justify-center">
                      <Zap className="h-4 w-4 text-secondary" />
                    </div>
                    <div>
                      <p className="font-medium">Exclusive Early Access</p>
                      <p className="text-xs text-muted-foreground">Beta features 6 months ahead</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center">
                      <Building className="h-4 w-4 text-accent" />
                    </div>
                    <div>
                      <p className="font-medium">Custom Implementation</p>
                      <p className="text-xs text-muted-foreground">Tailored deployment strategies</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="organization" className="space-y-6">
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
                <CardTitle>Enterprise-Scale Project Portfolio</CardTitle>
                <CardDescription>Unlimited projects with custom feature development and dedicated infrastructure</CardDescription>
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
              {projects.length === 0 ? (
                <div className="text-center py-8 space-y-4">
                  <div className="text-muted-foreground">No enterprise projects yet. Launch your first unlimited-scale project.</div>
                  <Link to="/projects/new">
                    <Button>Create Enterprise Project</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
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
                  {projects.map((project) => (
                    <div key={project.id} className="flex items-center justify-between p-4 border rounded-lg bg-gradient-to-r from-background via-primary/5 to-secondary/5">
                      <div className="flex items-center gap-3 flex-1">
                        <Checkbox
                          checked={selectedIds.has(project.id)}
                          onCheckedChange={() => toggleSelection(project.id)}
                          data-testid={`checkbox-project-${project.id}`}
                        />
                        <div className="flex-1">
                          <div className="font-medium flex items-center gap-2">
                            {project.title || "Untitled Project"}
                            <Badge className="bg-primary text-primary-foreground">Enterprise Unlimited</Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(project.created_at).toLocaleDateString()} • Global Production • Custom Features Active
                          </div>
                          <div className="flex gap-2 mt-2">
                            <Badge variant="outline">
                              {project.ai_director_json ? (project.audio_url ? 'Complete' : 'Analyzed') : 'Draft'}
                            </Badge>
                            <Badge variant="secondary">Private Cloud</Badge>
                            <Badge variant="outline">Multi-Region</Badge>
                            <Badge variant="outline">v4.0-custom</Badge>
                            <Badge className="bg-accent text-accent-foreground">Early Access</Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">Custom Features</Button>
                        <Button variant="outline" size="sm">Global Deploy</Button>
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
                                Delete Enterprise Project
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete the enterprise project across all regions and custom implementations. This action affects global infrastructure.
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

        <TabsContent value="development" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Custom Feature Development</CardTitle>
              <CardDescription>Bespoke functionality and custom voice library development</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Active Development Projects</h4>
                  <div className="space-y-3">
                    <div className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <h5 className="font-medium">Multi-Language Voice Synthesis</h5>
                        <Badge className="bg-primary text-primary-foreground">Sprint 3</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">Real-time voice language switching with accent preservation</p>
                      <div className="flex justify-between text-sm">
                        <span>Progress: 65%</span>
                        <span>Est. delivery: Q2 2024</span>
                      </div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <h5 className="font-medium">Enterprise API Gateway</h5>
                        <Badge variant="outline">Planning</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">Custom API endpoints for enterprise workflow integration</p>
                      <div className="flex justify-between text-sm">
                        <span>Progress: 15%</span>
                        <span>Est. delivery: Q3 2024</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-3">Custom Voice Library Development</h4>
                  <div className="space-y-3">
                    <div className="p-4 border rounded-lg">
                      <h5 className="font-medium">Proprietary Voice Collection</h5>
                      <p className="text-sm text-muted-foreground mb-2">24 custom enterprise voices in development</p>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">View Collection</Button>
                        <Button variant="outline" size="sm">Request Voice</Button>
                      </div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h5 className="font-medium">Advanced Voice Cloning Pipeline</h5>
                      <p className="text-sm text-muted-foreground mb-2">Next-generation voice replication technology</p>
                      <Badge className="bg-secondary text-secondary-foreground">Beta Access</Badge>
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
              <CardTitle>Executive Analytics & Business Intelligence</CardTitle>
              <CardDescription>Comprehensive business insights and predictive analytics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="p-4 border rounded-lg text-center bg-gradient-to-br from-primary/10 to-primary/5">
                  <h4 className="font-medium mb-2">Total Enterprise Value</h4>
                  <div className="text-3xl font-bold text-primary">$5.2M</div>
                  <p className="text-sm text-muted-foreground">Annual production value</p>
                </div>
                <div className="p-4 border rounded-lg text-center bg-gradient-to-br from-secondary/10 to-secondary/5">
                  <h4 className="font-medium mb-2">Global Efficiency</h4>
                  <div className="text-3xl font-bold text-secondary">94.7%</div>
                  <p className="text-sm text-muted-foreground">Cross-region optimization</p>
                </div>
                <div className="p-4 border rounded-lg text-center bg-gradient-to-br from-accent/10 to-accent/5">
                  <h4 className="font-medium mb-2">Innovation Index</h4>
                  <div className="text-3xl font-bold text-accent">8.9/10</div>
                  <p className="text-sm text-muted-foreground">Custom feature adoption</p>
                </div>
                <div className="p-4 border rounded-lg text-center bg-gradient-to-br from-muted/10 to-muted/5">
                  <h4 className="font-medium mb-2">Market Leadership</h4>
                  <div className="text-3xl font-bold">23x</div>
                  <p className="text-sm text-muted-foreground">Competitive advantage</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <Button>Generate Executive Report</Button>
                <Button variant="outline">Export BI Dashboard</Button>
                <Button variant="outline">Predictive Analysis</Button>
                <Button variant="outline">Custom Metrics</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="governance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Enterprise Governance & Compliance</CardTitle>
              <CardDescription>Advanced compliance, security protocols, and corporate governance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Compliance & Security</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-primary" />
                        <span>SOC 2 Type II</span>
                      </div>
                      <Badge className="bg-primary text-primary-foreground">Certified</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-primary" />
                        <span>GDPR Compliance</span>
                      </div>
                      <Badge className="bg-primary text-primary-foreground">Active</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-primary" />
                        <span>HIPAA Ready</span>
                      </div>
                      <Badge className="bg-secondary text-secondary-foreground">Available</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        <span>ISO 27001</span>
                      </div>
                      <Button variant="outline" size="sm">Configure</Button>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-3">Corporate Governance</h4>
                  <div className="space-y-3">
                    <div className="p-3 border rounded-lg">
                      <h5 className="font-medium mb-1">Multi-Year Commitment</h5>
                      <p className="text-sm text-muted-foreground">Volume discounts and strategic partnership terms</p>
                      <Button variant="outline" size="sm" className="mt-2">Review Terms</Button>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <h5 className="font-medium mb-1">Executive Oversight</h5>
                      <p className="text-sm text-muted-foreground">Quarterly business reviews with product leadership</p>
                      <Button variant="outline" size="sm" className="mt-2">Schedule Review</Button>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <h5 className="font-medium mb-1">Strategic Planning</h5>
                      <p className="text-sm text-muted-foreground">Custom roadmap alignment and feature prioritization</p>
                      <Button variant="outline" size="sm" className="mt-2">Access Portal</Button>
                    </div>
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