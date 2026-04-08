/// <reference types="vite/client" />
  import { supabase } from "@/integrations/supabase/client";

const WEBHOOK_N8N_URL = import.meta.env.VITE_WEBHOOK_N8N_AI;

  export type DirectorLine = {
    text: string;
    voice_key: string;
    style_prompt?: string;
  };

  export type DirectorJSON = {
    lines: DirectorLine[];
  };

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

  export async function createProject(title: string, script: string): Promise<{ id: string }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User must be authenticated to create a project");

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

  export const getDirectorJSON = runDirector;
  export const generateAudio = runAudio;

type DirectorMessage = {
  project_id: string;
  chunk_key: string;
  script: string;
  chunk_index?: number;
  start?: number;
  duration?: number;
};

function buildDirectorMessage(
  projectId: string,
  chunkKey: string,
  script: string,
  chunkIndex?: number,
  start?: number,
  duration?: number
): DirectorMessage {
  const payload: DirectorMessage = { project_id: projectId, chunk_key: chunkKey, script };
  if (chunkIndex !== undefined) payload.chunk_index = chunkIndex;
  if (start !== undefined) payload.start = start;
  if (duration !== undefined) payload.duration = duration;
  return payload;
}

export async function runDirectorViaSupabase(
  projectId: string,
  chunkKey: string,
  script: string,
  chunkIndex?: number,
  start?: number,
  duration?: number
): Promise<void> {
  const message = buildDirectorMessage(projectId, chunkKey, script, chunkIndex, start, duration);
  const { error } = await supabase.functions.invoke("ai-director", {
    body: { message: JSON.stringify(message) },
  });
  if (error) throw new Error(`ai-director error: ${error.message}`);
}

export async function runDirectorViaWebhook(
  projectId: string,
  chunkKey: string,
  script: string,
  chunkIndex?: number,
  start?: number,
  duration?: number
): Promise<void> {
  if (!WEBHOOK_N8N_URL) throw new Error("Missing VITE_WEBHOOK_N8N_AI");
  const message = buildDirectorMessage(projectId, chunkKey, script, chunkIndex, start, duration);
  const res = await fetch(WEBHOOK_N8N_URL as string, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: JSON.stringify(message) }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`webhook ai-director error: ${res.status} ${text}`);
  }
}

// Backward compatible alias (defaults to Supabase)
export async function runDirector(
  projectId: string,
  chunkKey: string,
  script: string,
  chunkIndex?: number,
  start?: number,
  duration?: number
): Promise<void> {

  console.log("runDirectorViaWebhook");
  // return runDirectorViaSupabase(projectId, chunkKey, script, chunkIndex, start, duration);
  return runDirectorViaWebhook(projectId, chunkKey, script, chunkIndex, start, duration);
}

  export async function runAudio(projectId: string, directorJSON: DirectorJSON): Promise<any> {
    const { data, error } = await supabase.functions.invoke("generate-audio", {
      body: { project_id: projectId, director: directorJSON },
    });

    if (error) throw new Error(`generate-audio error: ${error.message}`);
    return data;
  }

  export async function runAudioForChunk(request: AudioGenerationRequest): Promise<any> {
    const { data, error } = await supabase.functions.invoke("generate-audio", {
      body: request,
    });

    if (error) throw new Error(`generate-audio error: ${error.message}`);
    return data;
  }
