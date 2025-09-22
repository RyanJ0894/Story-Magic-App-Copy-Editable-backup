import { CreateProjectData, Project, ProjectWithDetails } from "../project.type";
import { supabase } from "../../../../supabase/client";
import { runDirector } from "../../../../supabase/filmDirectorApi";

export const projectApi = {
  // Get all projects for current user
  getAllProjects: async (): Promise<Project[]> => {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data as Project[];
  },

  // Get single project by ID
  getProject: async (id: string): Promise<Project> => {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data as Project;
  },

  // Get project with additional details (for backward compatibility)
  getProjectWithDetails: async (id: string): Promise<ProjectWithDetails> => {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    
    // For now, return the project as-is since projects table doesn't have ai_director_json/audio_url
    // These will be handled separately through project_chunks or other tables
    return data as ProjectWithDetails;
  },

  // Create new project
  createProject: async (data: CreateProjectData): Promise<Project> => {
    // Generate a unique project_key
    const projectKey = `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const { data: result, error } = await supabase
      .from("projects")
      .insert({
        title: data.title,
        script: data.script,
        project_key: projectKey,
        status: "draft",
        user_id: data.user_id,
      })
      .select()
      .single();

    if (error) throw error;
    return result as Project;
  },

  // Delete project and return the deleted row to ensure it actually deleted
  deleteProject: async (id: string): Promise<Project> => {
    const { data, error } = await supabase
      .from("projects")
      .delete()
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as Project;
  },

  // Update project
  updateProject: async (id: string, updates: Partial<CreateProjectData>): Promise<Project> => {
    const { data, error } = await supabase
      .from("projects")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as Project;
  },

  // Update project status
  updateProjectStatus: async (id: string, status: string): Promise<Project> => {
    const { data, error } = await supabase
      .from("projects")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as Project;
  },

  // Invoke AI Director for a specific chunk with additional metadata
  invokeAiDirector: async (
    projectId: string, 
    chunkKey: string, 
    script: string, 
    chunkIndex: number, 
    start: number, 
    duration: number
  ): Promise<void> => {
    await runDirector(projectId, chunkKey, script, chunkIndex, start, duration);
  },
};
