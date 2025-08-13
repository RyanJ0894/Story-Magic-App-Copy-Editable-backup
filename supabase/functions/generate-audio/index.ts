import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const elevenlabsApiKey = Deno.env.get('ELEVENLABS_API_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  console.log('Generate Audio: Request received');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { project_id, director } = await req.json();
    console.log('Generate Audio: Processing project', project_id);

    if (!project_id || !director || !Array.isArray(director)) {
      throw new Error('Missing required parameters: project_id and director array');
    }

    // Extract dialogue from director JSON
    const dialogueText = director
      .map((scene: any) => scene.dialogue || '')
      .join(' ')
      .trim();

    if (!dialogueText) {
      throw new Error('No dialogue found in director JSON');
    }

    console.log('Generate Audio: Dialogue extracted, length:', dialogueText.length);

    // Generate audio using ElevenLabs with browser-compatible settings
    const audioResponse = await fetch('https://api.elevenlabs.io/v1/text-to-speech/9BWtsMINqrJLrRacOk9x', {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': elevenlabsApiKey,
      },
      body: JSON.stringify({
        text: dialogueText,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true
        },
        output_format: 'mp3_44100_128'  // Standard MP3 format for browser compatibility
      }),
    });

    if (!audioResponse.ok) {
      const errorText = await audioResponse.text();
      console.error('ElevenLabs API error:', errorText);
      throw new Error(`ElevenLabs API error: ${audioResponse.status} - ${errorText}`);
    }

    console.log('Generate Audio: ElevenLabs response received');

    // Get the audio data as array buffer
    const audioBuffer = await audioResponse.arrayBuffer();
    console.log('Generate Audio: Audio buffer size:', audioBuffer.byteLength);

    // Convert to base64 using chunks to handle large files
    const audioArray = new Uint8Array(audioBuffer);
    let base64Audio = '';
    const chunkSize = 8192;
    
    for (let i = 0; i < audioArray.length; i += chunkSize) {
      const chunk = audioArray.slice(i, i + chunkSize);
      base64Audio += btoa(String.fromCharCode.apply(null, Array.from(chunk)));
    }
    
    console.log('Generate Audio: Base64 conversion complete, length:', base64Audio.length);

    // Update the project in the database
    const { error: updateError } = await supabase
      .from('user_projects')
      .update({ audio_url: base64Audio })
      .eq('id', project_id);

    if (updateError) {
      console.error('Database update error:', updateError);
      throw new Error(`Failed to update project: ${updateError.message}`);
    }

    console.log('Generate Audio: Project updated successfully');

    return new Response(
      JSON.stringify({
        success: true,
        audio_url: base64Audio,
        message: 'Audio generated successfully',
        format: 'mp3_44100_128',
        size_bytes: audioBuffer.byteLength
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Generate Audio error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        details: 'Audio generation failed'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});