import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
const ELEVENLABS_VOICE_MAP = {
  "Narrator – George": "elevenlabs-narrator-id",
  "Wounded Male Hero": "elevenlabs-wounded-male-id",
  "Warm Female Mentor": "elevenlabs-warm-female-id"
};

serve(async (req) => {
  const { project_id } = await req.json();

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: project, error } = await supabaseClient
    .from("user_projects")
    .select("ai_director_json, user_id")
    .eq("id", project_id)
    .single();

  if (error || !project || !project.ai_director_json) {
    return new Response(JSON.stringify({ error: "Project not found or JSON missing." }), { status: 400 });
  }

  const lines = project.ai_director_json.lines;
  const audioBuffers: Uint8Array[] = [];

  for (const line of lines) {
    const voiceId = ELEVENLABS_VOICE_MAP[line.voice] || ELEVENLABS_VOICE_MAP["Narrator – George"];
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        text: line.text,
        model_id: "eleven_monolingual_v1",
        voice_settings: { stability: 0.3, similarity_boost: 0.8 }
      })
    });

    const arrayBuffer = await response.arrayBuffer();
    audioBuffers.push(new Uint8Array(arrayBuffer));
  }

  // Combine buffers into one final audio file
  const finalAudio = audioBuffers.reduce((acc, cur) => {
    const combined = new Uint8Array(acc.length + cur.length);
    combined.set(acc, 0);
    combined.set(cur, acc.length);
    return combined;
  });

  const fileName = `generated/${project_id}/final_audio_${Date.now()}.mp3`;
  const { error: uploadError } = await supabaseClient.storage
    .from("user-files")
    .upload(fileName, finalAudio.buffer, {
      contentType: "audio/mpeg",
      upsert: true
    });

  if (uploadError) {
    return new Response(JSON.stringify({ error: "Upload failed", details: uploadError }), { status: 500 });
  }

  await supabaseClient
    .from("user_projects")
    .update({ audio_url: fileName })
    .eq("id", project_id);

  return new Response(JSON.stringify({ success: true, audio_url: fileName }), {
    headers: { "Content-Type": "application/json" },
    status: 200
  });
});
