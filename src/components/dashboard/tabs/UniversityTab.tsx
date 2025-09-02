import { useState } from "react";
import { Link } from "react-router-dom";
import { 
  Eye, Trash2, AlertTriangle, Plus, GraduationCap, 
  Users, BookOpen, Calendar, Award, CheckCircle 
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

interface UniversityTabProps {
  projects: any[];
  onDeleteProject: (id: string, title: string) => void;
  deletingId: string | null;
}

export function UniversityTab({ projects, onDeleteProject, deletingId }: UniversityTabProps) {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" />
            University Program Dashboard
          </h1>
          <p className="text-muted-foreground">Academic-focused tools for film programs and educational institutions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="lg">
            <BookOpen className="h-4 w-4 mr-2" />
            Academic Resources
          </Button>
          <Link to="/projects/new">
            <Button size="lg" className="gap-2">
              <Plus className="h-4 w-4" />
              Create Student Project
            </Button>
          </Link>
        </div>
      </div>

      {/* Academic Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Student Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projects.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">28</div>
            <p className="text-xs text-muted-foreground">of 30 enrolled</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Faculty</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">Professors</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Academic Year</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold">2024-2025</div>
            <p className="text-xs text-muted-foreground">Sept - May</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold">Academic Pro</div>
            <p className="text-xs text-muted-foreground">$3,000/year</p>
          </CardContent>
        </Card>
      </div>

      {/* Academic Verification Status */}
      <Card className="bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-primary" />
            Academic Verification Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">University of Film Arts - Verified</p>
              <p className="text-sm text-muted-foreground">Film Production Program • Accreditation #FA-2024-001</p>
            </div>
            <Badge className="bg-primary text-primary-foreground">Verified</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 w-full md:w-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
          <TabsTrigger value="admin">Admin</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Academic Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="h-5 w-5 text-primary" />
                  Student Portfolios
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">Individual portfolio development tools for students</p>
                <div className="text-2xl font-bold text-primary">28</div>
                <p className="text-xs text-muted-foreground">Active portfolios</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <BookOpen className="h-5 w-5 text-secondary" />
                  Faculty Oversight
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">Professor controls and grading integration</p>
                <Button variant="outline" size="sm" className="w-full">Access Tools</Button>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Calendar className="h-5 w-5 text-accent" />
                  Academic Calendar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">Semester-aligned project management</p>
                <Badge className="bg-accent text-accent-foreground">Spring 2024</Badge>
              </CardContent>
            </Card>
          </div>

          {/* Recent Academic Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Academic Activity</CardTitle>
              <CardDescription>Latest student submissions and faculty feedback</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <Award className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Student project "Short Film Voiceover" submitted</p>
                    <p className="text-xs text-muted-foreground">Emma Rodriguez • Film 301 • 2 hours ago</p>
                  </div>
                  <Badge variant="outline">Awaiting Review</Badge>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="w-8 h-8 bg-secondary/10 rounded-full flex items-center justify-center">
                    <BookOpen className="h-4 w-4 text-secondary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Faculty feedback provided on "Documentary Narration"</p>
                    <p className="text-xs text-muted-foreground">Prof. Johnson • 4 hours ago</p>
                  </div>
                  <Badge variant="secondary">Graded</Badge>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center">
                    <Users className="h-4 w-4 text-accent" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Group project collaboration started</p>
                    <p className="text-xs text-muted-foreground">Advanced Production Class • 6 hours ago</p>
                  </div>
                  <Badge variant="outline">In Progress</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="students" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Student Management</CardTitle>
              <CardDescription>Enrolled students and their academic progress</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Student List */}
              <div className="space-y-3">
                <h4 className="font-medium">Enrolled Students (28/30)</h4>
                <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
                  {[
                    { name: "Emma Rodriguez", email: "emma.r@university.edu", class: "Film 301", projects: 3, grade: "A-" },
                    { name: "James Chen", email: "james.c@university.edu", class: "Film 301", projects: 2, grade: "B+" },
                    { name: "Sofia Martinez", email: "sofia.m@university.edu", class: "Film 401", projects: 5, grade: "A" },
                    { name: "Michael Johnson", email: "michael.j@university.edu", class: "Film 201", projects: 1, grade: "B" },
                    { name: "Ashley Kim", email: "ashley.k@university.edu", class: "Film 401", projects: 4, grade: "A-" },
                  ].map((student, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{student.name}</p>
                        <p className="text-sm text-muted-foreground">{student.email} • {student.class}</p>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <span>{student.projects} projects</span>
                        <Badge variant="outline">{student.grade}</Badge>
                        <Button variant="outline" size="sm">View Portfolio</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add Student */}
              <div className="p-4 border rounded-lg bg-muted/20">
                <h4 className="font-medium mb-3">Add New Student</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium">Student Email</label>
                    <input className="w-full mt-1 p-2 border rounded text-sm" placeholder="student@university.edu" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Class/Course</label>
                    <select className="w-full mt-1 p-2 border rounded text-sm">
                      <option>Film 201 - Introduction to Film</option>
                      <option>Film 301 - Advanced Production</option>
                      <option>Film 401 - Senior Capstone</option>
                    </select>
                  </div>
                </div>
                <Button className="mt-3">Send Invitation</Button>
              </div>

              {/* Academic Pricing Info */}
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm">
                  <strong>Academic Pricing:</strong> Additional students: $15/month each (Academic rate)
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Student Projects</CardTitle>
              <CardDescription>Academic projects with faculty oversight and grading</CardDescription>
            </CardHeader>
            <CardContent>
              {projects.length === 0 ? (
                <div className="text-center py-8 space-y-4">
                  <div className="text-muted-foreground">No student projects yet. Create the first academic project.</div>
                  <Link to="/projects/new">
                    <Button>Create Student Project</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {projects.map((project) => (
                    <div key={project.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{project.title || "Untitled Project"}</div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(project.created_at).toLocaleDateString()} • Film 301 • Emma Rodriguez
                        </div>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="outline">
                            {project.ai_director_json ? (project.audio_url ? 'Complete' : 'Analyzed') : 'Draft'}
                          </Badge>
                          <Badge variant="secondary">Academic</Badge>
                          <Badge variant="outline">Awaiting Grade</Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <Award className="h-4 w-4 mr-2" />
                          Grade
                        </Button>
                        <Button variant="outline" size="sm">Faculty Review</Button>
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
                                Delete Student Project
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete the student project and all associated academic records.
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

        <TabsContent value="curriculum" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Curriculum Integration</CardTitle>
              <CardDescription>Course alignment and educational features</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Course Modules</h4>
                  <div className="space-y-2">
                    <div className="p-3 border rounded-lg">
                      <h5 className="font-medium">Film 201: Introduction to Voice Acting</h5>
                      <p className="text-sm text-muted-foreground">Basic voice recording and character development</p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline">12 students</Badge>
                        <Badge variant="secondary">Beginner</Badge>
                      </div>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <h5 className="font-medium">Film 301: Advanced Audio Production</h5>
                      <p className="text-sm text-muted-foreground">Professional voice work and audio engineering</p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline">10 students</Badge>
                        <Badge variant="secondary">Intermediate</Badge>
                      </div>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <h5 className="font-medium">Film 401: Senior Capstone</h5>
                      <p className="text-sm text-muted-foreground">Professional portfolio development</p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline">6 students</Badge>
                        <Badge variant="secondary">Advanced</Badge>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-3">Educational Resources</h4>
                  <div className="space-y-2">
                    <div className="p-3 border rounded-lg">
                      <h5 className="font-medium">Voice Acting Fundamentals</h5>
                      <p className="text-sm text-muted-foreground">Basic techniques and practices</p>
                      <Button variant="outline" size="sm" className="mt-2">Access Materials</Button>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <h5 className="font-medium">Industry Best Practices</h5>
                      <p className="text-sm text-muted-foreground">Professional standards and workflows</p>
                      <Button variant="outline" size="sm" className="mt-2">View Guidelines</Button>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <h5 className="font-medium">Portfolio Development</h5>
                      <p className="text-sm text-muted-foreground">Building professional demo reels</p>
                      <Button variant="outline" size="sm" className="mt-2">Student Guide</Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="admin" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Academic Administration</CardTitle>
              <CardDescription>University program management and verification</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Academic Verification</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">University Status</p>
                        <p className="text-sm text-muted-foreground">Accredited Institution</p>
                      </div>
                      <Badge className="bg-primary text-primary-foreground">Verified</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">Program Accreditation</p>
                        <p className="text-sm text-muted-foreground">Film Production Degree</p>
                      </div>
                      <Badge className="bg-primary text-primary-foreground">Valid</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">Educational Use</p>
                        <p className="text-sm text-muted-foreground">Non-commercial only</p>
                      </div>
                      <Badge variant="outline">Enforced</Badge>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-3">Renewal Management</h4>
                  <div className="space-y-3">
                    <div className="p-3 border rounded-lg">
                      <h5 className="font-medium">Current Academic Year</h5>
                      <p className="text-sm text-muted-foreground">September 2024 - May 2025</p>
                      <div className="flex gap-2 mt-2">
                        <Badge className="bg-primary text-primary-foreground">Active</Badge>
                        <Button variant="outline" size="sm">Extend</Button>
                      </div>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <h5 className="font-medium">Summer Session</h5>
                      <p className="text-sm text-muted-foreground">June 2025 - August 2025</p>
                      <Button variant="outline" size="sm" className="mt-2">Add Summer Access</Button>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <h5 className="font-medium">Annual Renewal</h5>
                      <p className="text-sm text-muted-foreground">Renewal required by June 2025</p>
                      <Button variant="outline" size="sm" className="mt-2">Prepare Renewal</Button>
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