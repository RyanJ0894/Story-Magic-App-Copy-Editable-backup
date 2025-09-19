import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const elevenlabsApiKey = Deno.env.get("ELEVENLABS_API_KEY");
const supabase = createClient(supabaseUrl, supabaseServiceKey);
async function ensureAudioBucket() {
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  if (listError) throw new Error("Failed to check storage buckets");
  const exists = buckets.some((b)=>b.name === "audio");
  if (!exists) {
    const { error: createError } = await supabase.storage.createBucket("audio", {
      public: true
    });
    if (createError) throw new Error("Failed to create bucket 'audio'");
  }
}
serve(async (req)=>{
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders
    });
  }
  try {
    const { project_id, director } = await req.json();
    if (!project_id || !director || !Array.isArray(director.lines)) {
      throw new Error("Missing required parameters: project_id and director.lines");
    }
    await ensureAudioBucket();
    const inputs = director.lines.filter((l)=>l.text && l.voice_key).map((l)=>({
        text: l.text,
        voice_id: l.voice_key
      }));
    const resp = await fetch("https://api.elevenlabs.io/v1/text-to-dialogue", {
      method: "POST",
      headers: {
        Accept: "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": elevenlabsApiKey
      },
      body: JSON.stringify({
        inputs,
        model_id: "eleven_v3",
        output_format: "mp3_44100_128"
      })
    });
    if (!resp.ok) {
      throw new Error(`ElevenLabs API error: ${resp.status} - ${await resp.text()}`);
    }
    const arr = new Uint8Array(await resp.arrayBuffer());
    const fileName = `projects/${project_id}/dialogue_${Date.now()}.mp3`;
    const { data: mergedUpload, error: mergedError } = await supabase.storage.from("audio").upload(fileName, arr.buffer, {
      contentType: "audio/mpeg",
      cacheControl: "3600",
      upsert: true
    });
    if (mergedError) {
      throw new Error(`Failed to upload dialogue: ${mergedError.message}`);
    }
    const { data: mergedPublicUrl } = supabase.storage.from("audio").getPublicUrl(fileName);
    const mergedResponse = {
      success: true,
      audio_url: mergedPublicUrl.publicUrl,
      path: mergedUpload?.path,
      message: "Audio generated successfully",
      format: "mp3_44100_128",
      size_bytes: arr.byteLength
    };
    await supabase.from("user_projects").update({
      audio_url: mergedResponse.audio_url
    }).eq("id", project_id);
    return new Response(JSON.stringify({
      success: true,
      project_id,
      merged_audio: mergedResponse
    }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      details: "Audio generation failed"
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
});
