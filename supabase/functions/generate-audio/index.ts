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
    console.log('Generate Audio: Director structure:', JSON.stringify(director, null, 2));

    if (!project_id || !director) {
      throw new Error('Missing required parameters: project_id and director');
    }

    // Extract dialogue from director JSON
    let dialogueText = '';
    
    console.log('Generate Audio: Raw director data type:', typeof director);
    console.log('Generate Audio: Is array?', Array.isArray(director));
    
    if (Array.isArray(director)) {
      // If it's an array of scenes
      dialogueText = director
        .map((scene: any) => {
          console.log('Generate Audio: Scene object keys:', Object.keys(scene || {}));
          return scene?.dialogue || '';
        })
        .filter(d => d.length > 0)
        .join(' ')
        .trim();
    } else if (director?.lines && Array.isArray(director.lines)) {
      // If it's a director object with lines array
      dialogueText = director.lines
        .map((line: any) => line.text || line.dialogue || '')
        .filter(d => d.length > 0)
        .join(' ')
        .trim();
    } else {
      console.error('Generate Audio: Unexpected director structure:', director);
    }

    console.log('Generate Audio: Extracted dialogue:', dialogueText);
    console.log('Generate Audio: Dialogue length:', dialogueText.length);

    if (!dialogueText || dialogueText.length === 0) {
      throw new Error(`No dialogue found in director JSON. Structure: ${JSON.stringify(director, null, 2)}`);
    }

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

    // Convert ArrayBuffer to Uint8Array for proper binary handling
    const audioBytes = new Uint8Array(audioBuffer);
    
    // Create a proper blob with correct MIME type
    const audioBlob = new Blob([audioBytes], { type: 'audio/mpeg' });

    // Upload audio to Supabase Storage with proper path structure
    const fileName = `projects/${project_id}/${Date.now()}.mp3`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('audio')
      .upload(fileName, audioBlob, {
        contentType: 'audio/mpeg',
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      throw new Error(`Failed to upload audio: ${uploadError.message}`);
    }

    console.log('Generate Audio: File uploaded successfully:', uploadData.path);

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('audio')
      .getPublicUrl(fileName);

    const publicUrl = publicUrlData.publicUrl;
    console.log('Generate Audio: Public URL:', publicUrl);

    // Update the project in the database with public URL
    const { error: updateError } = await supabase
      .from('user_projects')
      .update({ audio_url: publicUrl })
      .eq('id', project_id);

    if (updateError) {
      console.error('Database update error:', updateError);
      throw new Error(`Failed to update project: ${updateError.message}`);
    }

    console.log('Generate Audio: Project updated successfully');

    return new Response(
      JSON.stringify({
        success: true,
        audio_url: publicUrl,
        path: uploadData.path,
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