// src/integrations/filmDirectorApi.ts
import { supabase } from "@/integrations/supabase/client";

// These must match your Supabase Edge Function slugs
const EDGE_DIRECTOR_FN = "ai-director";     // returns { success, scene_count, director_json }
const EDGE_AUDIO_FN    = "generate-audio";  // returns { audio_url, ... } or similar

/**
 * Create a new project row and return its UUID.
 * Table: user_projects (id uuid pk, user_id uuid, title text, script text, ...)
 */
export async function createProject(params: { title: string; script: string }): Promise<string> {
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr) throw userErr;
  const user = userData.user;
  if (!user) throw new Error("Please sign in first.");

  const { data, error } = await supabase
    .from("user_projects")
    .insert([{ user_id: user.id, title: params.title, script: params.script }])
    .select("id")
    .single();

  if (error) throw error;
  return data.id as string;
}

/**
 * Call the AI director function and return the director JSON array.
 */
export async function runDirector(projectId: string, script: string): Promise<any[]> {
  const { data, error } = await supabase.functions.invoke(EDGE_DIRECTOR_FN, {
    body: { project_id: projectId, script },
  });

  if (error) throw new Error(error.message || "AI Director invocation failed");
  if (!data) throw new Error("AI Director returned no data");
  if (data.error) throw new Error(data.error);

  // ai-director returns { success, scene_count, director_json }
  return (data.director_json ?? data) as any[];
}

/**
 * Call the audio generation function.
 * If you already have directorJSON, pass it; otherwise the function can fetch it
 * from the DB by project_id (as your server code allows).
 */
export async function runAudio(projectId: string, directorJSON?: any): Promise<any> {
  const body: Record<string, any> = { project_id: projectId };
  if (directorJSON) body.director = directorJSON; // matches our generate-audio handler shape

  const { data, error } = await supabase.functions.invoke(EDGE_AUDIO_FN, { body });
  if (error) throw new Error(error.message || "Audio generation failed");
  if (!data) throw new Error("Audio function returned no data");

  return data;
}
