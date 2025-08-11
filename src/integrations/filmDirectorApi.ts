// src/integrations/filmDirectorApi.ts
// Client-side helpers for Supabase Edge Functions

import { supabase } from "@/integrations/supabase/client";

// Name your deployed Supabase Edge Functions here
const EDGE_DIRECTOR_FN = "ai-director";   // returns the director JSON
const EDGE_AUDIO_FN    = "generate-audio"; // returns { audio_url, ... } or similar

const DEBUG = true;

// ---- Types (kept loose so the app doesn't break if the server response changes) ----
export type DirectorLine = {
  text: string;
  voice_key?: string;
  style_prompt?: string;
};

export type DirectorJSON = any;

// ---- Ask the AI Director (Edge Function) to analyze the script ----
export async function getDirectorJSON(script: string, projectId: string) {
  if (DEBUG) console.log("[AI Director] invoking", EDGE_DIRECTOR_FN, { projectId });

  const { data, error } = await supabase.functions.invoke(EDGE_DIRECTOR_FN, {
    body: { project_id: projectId, script },
  });

  if (error) {
    console.error("[AI Director] getDirectorJSON error:", error);
    throw error;
  }

  if (DEBUG) console.log("[AI Director] getDirectorJSON ok:", data);
  return data as DirectorJSON;
}

// ---- Ask the audio generator (Edge Function) to produce audio for a project ----
export async function generateAudio(projectId: string, directorJSON: DirectorJSON) {
  if (DEBUG) console.log("[Audio] invoking", EDGE_AUDIO_FN, { projectId });

  const { data, error } = await supabase.functions.invoke(EDGE_AUDIO_FN, {
    body: {
      project_id: projectId,
      director: directorJSON, // send whatever the director returned
    },
  });

  if (error) {
    console.error("[Audio] generateAudio error:", error);
    throw error;
  }

  if (DEBUG) console.log("[Audio] generateAudio ok:", data);
  return data;
}
