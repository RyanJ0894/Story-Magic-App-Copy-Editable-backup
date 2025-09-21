import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../../supabase/client';
import { createProject, runAudio } from '@/integrations/filmDirectorApi';

export const PROJECT_KEY_FACTORY = {
  all: ["projects"] as const,
  lists: () => [...PROJECT_KEY_FACTORY.all, "list"] as const,
  list: () => [...PROJECT_KEY_FACTORY.lists()] as const,
  details: () => [...PROJECT_KEY_FACTORY.all, "detail"] as const,
  detail: (id: string) => [...PROJECT_KEY_FACTORY.details(), id] as const,
};

export type Project = {
  id: string;
  title: string;
  script: string;
  user_id: string;
  created_at: string;
  audio_url?: string;
  ai_director_json?: any;
};

// Get all projects for current user
export const useProjects = () => {
  return useQuery({
    queryKey: PROJECT_KEY_FACTORY.list(),
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('user_projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Project[];
    },
  });
};

// Get single project by ID
export const useProject = (id: string) => {
  return useQuery({
    queryKey: PROJECT_KEY_FACTORY.detail(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_projects')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Project;
    },
    enabled: !!id,
  });
};

// Create new project
export const useCreateProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ title, script }: { title: string; script: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      return createProject(title, script);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROJECT_KEY_FACTORY.list() });
    },
  });
};

// Update project
export const useUpdateProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      updates 
    }: { 
      id: string; 
      updates: Partial<Pick<Project, 'title' | 'script' | 'audio_url' | 'ai_director_json'>> 
    }) => {
      const { data, error } = await supabase
        .from('user_projects')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Project;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: PROJECT_KEY_FACTORY.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: PROJECT_KEY_FACTORY.list() });
    },
  });
};

// Delete project
export const useDeleteProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('user_projects')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROJECT_KEY_FACTORY.list() });
    },
  });
};
