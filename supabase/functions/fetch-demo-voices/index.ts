import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
serve(async (req)=>{
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }
  try {
    // Get ElevenLabs API key from Supabase secrets
    const elevenLabsApiKey = Deno.env.get('ELEVENLABS_API_KEY');
    if (!elevenLabsApiKey) {
      console.log('ElevenLabs API key not configured, returning empty demo voices list');
      return new Response(JSON.stringify({
        voices: [],
        count: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    // Fetch voices from ElevenLabs API
    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      method: 'GET',
      headers: {
        'xi-api-key': elevenLabsApiKey,
        'Accept': 'application/json'
      }
    });
    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText}`);
    }
    const voicesData = await response.json();
    // Demo voices that match exactly the characters shown in the Voice Cast Assignment
    const demoVoiceMapping = {
      // Stacy - use a different Female 20s to 30s voice (not African American)
      "XhNlP8uwiH6XZSFnH1yL": "Female 20s to 30s",
      // Lucky - use a Male 20s to 30s voice (LUCKY CLONE)
      "PSqRw3ln34TxQZrTS6Wt": "Male 20s to 30s",
      // Cody McAvoy (Male 20s to 30s)
      "1RVpBInY9YUYMLSUQReV": "Male 20s to 30s",
      // Nathaniel C (Narrator)
      "AeRdCCKzvd23BpJoofzx": "Narrator"
    };
    // Filter to ONLY include the demo voices
    const demoVoices = voicesData.voices.filter((voice: any)=>demoVoiceMapping.hasOwnProperty(voice.voice_id));
    // Transform the voice data and assign the correct categories
    const voices = demoVoices.map((voice: any)=>({
        voice_id: voice.voice_id,
        name: voice.name,
        category: (demoVoiceMapping as any)[voice.voice_id],
        description: voice.description,
        preview_url: voice.preview_url,
        available_for_tiers: voice.available_for_tiers,
        settings: voice.settings,
        labels: voice.labels || {},
        samples: voice.samples || [],
        high_quality_base_model_ids: voice.high_quality_base_model_ids || []
      }));
    return new Response(JSON.stringify({
      voices,
      count: voices.length
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error fetching demo ElevenLabs voices:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Failed to fetch demo voices',
      voices: [],
      count: 0
    }), {
      status: 400,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
