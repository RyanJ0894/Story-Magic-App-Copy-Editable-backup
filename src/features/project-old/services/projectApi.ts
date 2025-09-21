import { supabase } from "../../../../supabase/client";
import { createProject as createProjectApi } from "@/integrations/filmDirectorApi";

export type Project = {
  id: string;
  title: string;
  script: string;
  user_id: string;
  created_at: string;
  ai_director_json?: any;
  audio_url?: string;
};

export type CreateProjectData = {
  title: string;
  script: string;
};

export type UpdateProjectData = Partial<Pick<Project, 'title' | 'script' | 'ai_director_json' | 'audio_url'>>;

export const projectApi = {
  // Get all projects
  getAll: async (): Promise<Project[]> => {
    const { data, error } = await supabase
      .from("user_projects")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  // Get project by ID
  getById: async (id: string): Promise<Project> => {
    const { data, error } = await supabase
      .from("user_projects")
      .select("*")
      .eq("id", id)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Create new project
  create: async (projectData: CreateProjectData) => {
    const created = await createProjectApi(projectData.title, projectData.script);
    return created;
  },

  // Update project
  update: async (id: string, updates: UpdateProjectData): Promise<Project> => {
    const { data, error } = await supabase
      .from("user_projects")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Delete project
  delete: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from("user_projects")
      .delete()
      .eq("id", id);
    
    if (error) throw error;
  },

  // Subscribe to project updates
  subscribe: (id: string, callback: (project: Project) => void) => {
    const channel = supabase
      .channel('project-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_projects',
          filter: `id=eq.${id}`
        },
        (payload) => {
          callback(payload.new as Project);
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }
};