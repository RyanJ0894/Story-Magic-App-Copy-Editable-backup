import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Folder, FileText, Volume2, Plus, Calendar } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Project {
  id: string;
  project_name: string;
  script_url: string | null;
  audio_url: string | null;
  created_at: string;
  updated_at: string;
}

export const ProjectsList = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user]);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('user_projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching projects:', error);
        toast({
          title: "Error loading projects",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast({
        title: "Error loading projects",
        description: "Failed to load your projects",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createNewProject = async () => {
    if (!user) return;

    try {
      const projectName = `New Project ${projects.length + 1}`;
      const { data, error } = await supabase
        .from('user_projects')
        .insert([
          {
            user_id: user.id,
            project_name: projectName,
          }
        ])
        .select()
        .single();

      if (error) {
        toast({
          title: "Error creating project",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Project created!",
        description: `${projectName} has been created successfully.`,
      });

      fetchProjects();
    } catch (error) {
      console.error('Error creating project:', error);
      toast({
        title: "Error creating project",
        description: "Failed to create new project",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center">Loading your projects...</div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Your
            <span className="block bg-gradient-accent bg-clip-text text-transparent">
              Projects
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Manage your screenplay projects and audio productions
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-2xl font-semibold">All Projects</h3>
            <Button onClick={createNewProject} className="gap-2">
              <Plus className="h-4 w-4" />
              New Project
            </Button>
          </div>

          {projects.length === 0 ? (
            <Card className="bg-gradient-card border-border shadow-cinematic">
              <CardContent className="text-center py-12">
                <Folder className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
                <h3 className="text-xl font-semibold mb-2">No projects yet</h3>
                <p className="text-muted-foreground mb-6">
                  Create your first project to get started with Story Magic
                </p>
                <Button onClick={createNewProject} size="lg" className="gap-2">
                  <Plus className="h-5 w-5" />
                  Create Your First Project
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <Card key={project.id} className="bg-gradient-card border-border shadow-cinematic hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2 line-clamp-2">
                          {project.project_name}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3" />
                          {new Date(project.created_at).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      <div className="flex flex-col gap-1">
                        {project.script_url && (
                          <Badge variant="secondary" className="text-xs">
                            <FileText className="h-3 w-3 mr-1" />
                            Script
                          </Badge>
                        )}
                        {project.audio_url && (
                          <Badge variant="secondary" className="text-xs">
                            <Volume2 className="h-3 w-3 mr-1" />
                            Audio
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Status:</span>
                        <Badge variant={project.audio_url ? "default" : "outline"}>
                          {project.audio_url ? "Complete" : "In Progress"}
                        </Badge>
                      </div>
                      
                      <Link to={`/project/${project.id}`}>
                        <Button variant="outline" className="w-full">
                          Open Project
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};