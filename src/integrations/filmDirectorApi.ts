// src/integrations/filmDirectorApi.ts

console.log("Supabase URL is:", process.env.SUPABASE_URL);
console.log("Service role key prefix:", process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0,4));

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export async function getDirectorJSON(sceneText: string) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are the AI Film Director for Story Magic—output only the JSON format we defined.",
        },
        { role: "user", content: sceneText + "\n\nPlease respond in the JSON format only." },
      ],
    }),
  });
  const data = await res.json();
  return JSON.parse(data.choices[0].message.content);
}

export async function generateAudio(projectId: string, directorJSON: Record<string, any>) {
  const res = await fetch(process.env.AUDIO_FUNCTION_URL!, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ project_id: projectId, ...directorJSON }),
  });
  return res.json();
}
