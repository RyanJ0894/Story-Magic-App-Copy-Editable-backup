import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../../supabase/client';
import { useToast } from '@/hooks/use-toast';

export type ProjectCreateData = {
  title: string;
  script: string;
};

export type Project = {
  id: string;
  project_key: string;
  user_id: string;
  title: string;
  script: string;
  status: string;
  created_at: string;
  updated_at: string;
};

export const useProjectCreate = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createProjectMutation = useMutation({
    mutationFn: async (data: ProjectCreateData): Promise<Project> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Generate unique project key
      const projectKey = `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const { data: project, error } = await supabase
        .from('projects')
        .insert({
          project_key: projectKey,
          user_id: user.id,
          title: data.title,
          script: data.script,
          status: 'in_progress'
        })
        .select()
        .single();

      if (error) throw error;
      return project;
    },
    onSuccess: (project) => {
      toast({
        title: "Project Created",
        description: `Project "${project.title}" created successfully!`,
        variant: "default"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Project Creation Failed",
        description: error?.message || "Failed to create project",
        variant: "destructive"
      });
    }
  });

  return {
    createProject: createProjectMutation.mutateAsync,
    isCreating: createProjectMutation.isPending,
    error: createProjectMutation.error,
  };
};
