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

    if (!project_id || !director) {
      throw new Error('Missing required parameters: project_id and director');
    }

    // Extract dialogue from director JSON - it has a "lines" array structure
    const dialogueText = director.lines
      ? director.lines.map((line: any) => line.text || '').join(' ').trim()
      : director.map?.((scene: any) => scene.dialogue || '').join(' ').trim() || '';

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

    let audioArray = new Uint8Array(audioBuffer);
    
    // Strip ID3 tags if present (they start with "ID3")
    if (audioArray[0] === 0x49 && audioArray[1] === 0x44 && audioArray[2] === 0x33) {
      console.log('Generate Audio: Stripping ID3 tags');
      // ID3v2 header is 10 bytes, then size is in bytes 6-9
      const size = ((audioArray[6] & 0x7f) << 21) |
                   ((audioArray[7] & 0x7f) << 14) |
                   ((audioArray[8] & 0x7f) << 7) |
                   (audioArray[9] & 0x7f);
      const headerSize = 10;
      const totalTagSize = headerSize + size;
      console.log('Generate Audio: ID3 tag size:', totalTagSize);
      
      // Skip the ID3 tag
      audioArray = audioArray.slice(totalTagSize);
    }

    // Convert to base64 properly without call stack issues
    let binary = '';
    
    // Convert byte array to binary string without using apply()
    for (let i = 0; i < audioArray.length; i++) {
      binary += String.fromCharCode(audioArray[i]);
    }
    
    // Convert to base64
    const base64Audio = btoa(binary);
    
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