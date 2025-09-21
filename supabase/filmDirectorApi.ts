// src/integrations/filmDirectorApi.ts
// Client-side helpers. Heavy lifting happens in Edge Functions.

import { supabase } from "./client";

export type DirectorLine = {
  text: string;
  voice_key: string;
  style_prompt?: string;
};

export type DirectorJSON = {
  lines: DirectorLine[];
};

// New types for chunk-based audio generation
export type ChunkLine = {
  line_id: string;
  text: string;
  type: string;
  start: number;
  duration: number;
  volume: number;
  src: string | null;
  tts_settings: {
    style: string;
    status: string;
    language: string;
    provider: string;
    character: string | null;
    voice_key: string;
    stability: number;
    similarity_boost: number;
    credits_used: number;
  };
};

export type AudioTrack = {
  track_id: string;
  label: string;
  src: string | null;
  start: number;
  duration: number;
  volume: number;
  fade_in: number;
  fade_out: number;
};

export type ChunkAudioDirection = {
  music: AudioTrack[];
  ambience: AudioTrack[];
  sfx: AudioTrack[];
};

export type ChunkData = {
  chunk_id: string;
  scene_title: string;
  lines: ChunkLine[];
  audio_direction: ChunkAudioDirection;
};

export type ProjectInfo = {
  id: string;
  title: string;
  created_at: string;
};

export type AudioGenerationRequest = {
  project: ProjectInfo;
  chunks: ChunkData;
};

// ---- create a project row and return the id ----
export async function createProject(title: string, script: string): Promise<{ id: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("User must be authenticated to create a project");

  // Try the original column names that the cache expects
  const { data, error } = await supabase
    .from("user_projects")
    .insert({
      title: title,
      user_id: user.id,
      script: script,
    } as any)
    .select("id")
    .single();

  if (error) throw new Error(`Create project failed: ${error.message}`);
  return { id: data!.id as string };
}

// Legacy exports for compatibility
export const getDirectorJSON = runDirector;
export const generateAudio = runAudio;

// ---- call the AI director Edge Function, trigger job only ----
export async function runDirector(projectId: string, script: string): Promise<void> {
  const { error } = await supabase.functions.invoke("ai-director", {
    body: { 
      message: JSON.stringify({ project_id: projectId, script })
    },
  });

  if (error) throw new Error(`ai-director error: ${error.message}`);
  
  // Job triggered successfully, real-time listener will handle the result
}

// ---- call the audio generator Edge Function (legacy) ----
export async function runAudio(projectId: string, directorJSON: DirectorJSON): Promise<any> {
  const { data, error } = await supabase.functions.invoke("generate-audio", {
    body: { project_id: projectId, director: directorJSON },
  });

  if (error) throw new Error(`generate-audio error: ${error.message}`);
  return data;
}

// ---- call the audio generator Edge Function for chunks ----
export async function runAudioForChunk(request: AudioGenerationRequest): Promise<any> {
  const { data, error } = await supabase.functions.invoke("generate-audio", {
    body: request,
  });

  if (error) throw new Error(`generate-audio error: ${error.message}`);
  return data;
}
