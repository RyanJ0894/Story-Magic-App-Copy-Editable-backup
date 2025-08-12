// src/integrations/filmDirectorApi.ts
// Client-side helpers for Supabase Edge Functions (no secrets here).

import { supabase } from "./supabase/client";

const EDGE_DIRECTOR_FN = "ai-director";   // returns the director JSON
const EDGE_AUDIO_FN = "generate-audio";   // returns { audio_url, ... } or similar

export type DirectorLine = {
  text: string;
  voice_key: string;
  style_prompt?: string;
};

export type DirectorJSON = {
  lines: DirectorLine[];
}[];

/** Create a project record and return its id */
export async function createProject(input: { title: string; script: string }): Promise<string> {
  const { data, error } = await supabase
    .from("user_projects")
    .insert({ title: input.title, script: input.script })
    .select("id")
    .single();

  if (error || !data) throw new Error(error?.message || "Failed to create project");
  return data.id as string;
}

/** Call AI Director edge function */
export async function runDirector(projectId: string, sceneText: string): Promise<DirectorJSON> {
  const { data, error } = await supabase.functions.invoke(EDGE_DIRECTOR_FN, {
    body: { project_id: projectId, script: sceneText },
  });

  if (error) throw error;
  return data as DirectorJSON;
}

/** Call audio generator edge function */
export async function runAudio(projectId: string, directorJSON?: DirectorJSON): Promise<any> {
  const { data, error } = await supabase.functions.invoke(EDGE_AUDIO_FN, {
    body: { project_id: projectId, director: directorJSON },
  });

  if (error) throw error;
  return data;
}
