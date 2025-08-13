// src/integrations/filmDirectorApi.ts
// Client-side helpers. Heavy lifting happens in Edge Functions.

import { supabase } from "../integrations/supabase/client";

export type DirectorLine = {
  text: string;
  voice_key: string;
  style_prompt?: string;
};

export type DirectorJSON = {
  lines: DirectorLine[];
};

// ---- create a project row and return the id ----
export async function createProject(title: string, script: string): Promise<{ id: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("User must be authenticated to create a project");

  const { data, error } = await supabase
    .from("user_projects")
    .insert([{ 
      project_name: title,
      user_id: user.id
    }])
    .select("id")
    .single();

  if (error) throw new Error(`Create project failed: ${error.message}`);
  return { id: data!.id as string };
}

// Legacy exports for compatibility
export const getDirectorJSON = runDirector;
export const generateAudio = runAudio;

// ---- call the AI director Edge Function, return its JSON ----
export async function runDirector(projectId: string, script: string): Promise<DirectorJSON> {
  const { data, error } = await supabase.functions.invoke("ai-director", {
    body: { project_id: projectId, script },
  });

  if (error) throw new Error(`ai-director error: ${error.message}`);

  // The function both updates the DB and returns a summary
  return (data?.director_json as DirectorJSON) ?? { lines: [] };
}

// ---- call the audio generator Edge Function (optional) ----
export async function runAudio(projectId: string, directorJSON: DirectorJSON): Promise<any> {
  const { data, error } = await supabase.functions.invoke("generate-audio", {
    body: { project_id: projectId, director: directorJSON },
  });

  if (error) throw new Error(`generate-audio error: ${error.message}`);
  return data;
}
