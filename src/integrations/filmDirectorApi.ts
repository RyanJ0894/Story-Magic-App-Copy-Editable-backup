// src/integrations/filmDirectorApi.ts

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://eyfxxhkbotkjsazvhxlj.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5Znh4aGtib3RranNhenZoeGxqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzMjc1NDEsImV4cCI6MjA2ODkwMzU0MX0.IKlj4-494b6k5Te9Qbv5CZpJt25INYchGRixQYBEdoM";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function getDirectorJSON(sceneText: string) {
  const { data, error } = await supabase.functions.invoke('get-director-json', {
    body: { sceneText }
  });
  
  if (error) throw error;
  return data;
}

export async function generateAudio(projectId: string, directorJSON: Record<string, any>) {
  const { data, error } = await supabase.functions.invoke('generate-audio', {
    body: { project_id: projectId, ...directorJSON }
  });
  
  if (error) throw error;
  return data;
}
