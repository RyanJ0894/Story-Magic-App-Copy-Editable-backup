// src/integrations/filmDirectorApi.ts
// Client-side helpers for the AI Film Director.
// No secrets here; all heavy lifting happens in server-side functions.

import { supabase } from "@/integrations/supabase/client";

// 🔧 Set these to your actual Supabase Edge Function names
const EDGE_DIRECTOR_FN = "ai-director";     // returns the director JSON
const EDGE_AUDIO_FN    = "generate-audio";  // returns { audio_url, ... } or similar

const DEBUG = true;

export type DirectorLine = {
  text: string;
  voice_key: string;
  style_prompt?: string;
};

export type DirectorJSON = {
  lines: DirectorLine[];
};

// --- AI Director JSON (server-side via Supabase Edge Functions) ---
export async function getDirectorJSON(sceneText: string): Promise<DirectorJSON> {
  const { data, error } = await supabase.functions.invoke(EDGE_DIRECTOR_FN, {
    body: { sceneText },
  });

  if (error) {
    if (DEBUG) console.error("[AI Director] getDirectorJSON error:", error);
    throw error;
  }

  if (DEBUG) console.log("[AI Director] getDirectorJSON ok:", data);
  return data as DirectorJSON;
}

// --- Audio generation (server-side via Supabase Edge Functions) ---
export async function generateAudio(
  projectId: string,
  directorJSON: DirectorJSON
): Promise<any> {
  const { data, error } = await supabase.functions.invoke(EDGE_AUDIO_FN, {
    body: { project_id: projectId, director: directorJSON },
  });

  if (error) {
    if (DEBUG) console.error("[AI Director] generateAudio error:", error);
    throw error;
  }

  if (DEBUG) console.log("[AI Director] generateAudio ok:", data);
  return data;
}

/*
  💡 If you're NOT using Supabase Edge Functions and instead have a Netlify/Cloudflare
  function, you can use the pattern below. Keep it commented until you need it.

  const AUDIO_FUNCTION_URL = "/.netlify/functions/generateAudio";

  export async function generateAudio(projectId: string, directorJSON: DirectorJSON) {
    const res = await fetch(AUDIO_FUNCTION_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project_id: projectId, director: directorJSON }),
    });
    if (!res.ok) throw new Error("Audio function failed");
    return res.json();
  }
*/
