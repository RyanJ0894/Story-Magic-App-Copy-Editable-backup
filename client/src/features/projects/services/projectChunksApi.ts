import { supabase } from "../../../../../supabase/client";
import { ProjectChunk } from "../project-chunk.type";

export const projectChunksApi = {
  // Create multiple chunks
  createChunks: async (chunks: Omit<ProjectChunk, 'id' | 'created_at' | 'updated_at'>[]): Promise<ProjectChunk[]> => {
    const { data, error } = await supabase
      .from("project_chunks")
      .insert(chunks)
      .select("*");

    if (error) throw error;
    return data as ProjectChunk[];
  },

  // Get all chunks for a project
  getProjectChunks: async (projectId: string): Promise<ProjectChunk[]> => {
    const { data, error } = await supabase
      .from("project_chunks")
      .select("*")
      .eq("project_id", projectId)
      .order("chunk_index", { ascending: true });

    if (error) throw error;
    return data as ProjectChunk[];
  },

  // Get single chunk by ID
  getChunk: async (chunkId: string): Promise<ProjectChunk> => {
    const { data, error } = await supabase
      .from("project_chunks")
      .select("*")
      .eq("id", chunkId)
      .single();

    if (error) throw error;
    return data as ProjectChunk;
  },

  // Get chunk by project_id and chunk_key
  getChunkByKey: async (projectId: string, chunkKey: string): Promise<ProjectChunk> => {
    const { data, error } = await supabase
      .from("project_chunks")
      .select("*")
      .eq("project_id", projectId)
      .eq("chunk_key", chunkKey)
      .single();

    if (error) throw error;
    return data as ProjectChunk;
  },

  // Update chunk status
  updateChunkStatus: async (chunkId: string, status: string): Promise<ProjectChunk> => {
    const { data, error } = await supabase
      .from("project_chunks")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", chunkId)
      .select()
      .single();

    if (error) throw error;
    return data as ProjectChunk;
  },

  // Update chunk data (lines, audio_direction, etc.)
  updateChunkData: async (chunkId: string, updates: {
    lines?: any;
    audio_direction?: any;
    director_notes?: string;
    content?: string;
    scene_title?: string;
    start?: number;
    duration?: number;
    version?: number;
  }): Promise<ProjectChunk> => {
    const { data, error } = await supabase
      .from("project_chunks")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", chunkId)
      .select()
      .single();

    if (error) throw error;
    return data as ProjectChunk;
  },

  // Delete chunk
  deleteChunk: async (chunkId: string): Promise<void> => {
    const { error } = await supabase
      .from("project_chunks")
      .delete()
      .eq("id", chunkId);

    if (error) throw error;
  },

  // Delete all chunks for a project
  deleteProjectChunks: async (projectId: string): Promise<void> => {
    const { error } = await supabase
      .from("project_chunks")
      .delete()
      .eq("project_id", projectId);

    if (error) throw error;
  },

  // Update chunk status to processing
  updateChunkToProcessing: async (chunkId: string): Promise<ProjectChunk> => {
    return projectChunksApi.updateChunkStatus(chunkId, 'processing');
  },

  // Update chunk with processing results
  updateChunkWithResults: async (chunkId: string, results: {
    lines?: any;
    audio_direction?: any;
    director_notes?: string;
    start?: number;
    duration?: number;
    version?: number;
  }): Promise<ProjectChunk> => {
    const { data, error } = await supabase
      .from("project_chunks")
      .update({
        status: 'done',
        ...results,
        updated_at: new Date().toISOString(),
      })
      .eq("id", chunkId)
      .select()
      .single();

    if (error) throw error;
    return data as ProjectChunk;
  },

  // Get project info for API requests
  getProjectInfo: async (projectId: string): Promise<{ id: string; title: string; created_at: string }> => {
    const { data, error } = await supabase
      .from("projects")
      .select("id, title, created_at")
      .eq("id", projectId)
      .single();

    if (error) throw error;
    return data as { id: string; title: string; created_at: string };
  },
};
