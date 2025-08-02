import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Voice style to ElevenLabs voice ID mapping (now optimized for cleaner audio generation)
const voiceMap: Record<string, string> = {
  'Narrator Deep': 'JBFqnCBsd6RMkjVDRZzb', // George - Primary narrator voice
  'Narrator Soothing': 'TX3LPaxmHKxFdv7VOQHJ', // Liam - Alternative narrator
  'Warm Female': 'EXAVITQu4vr4xnSDxMaL', // Sarah
  'Assertive Female': 'cgSgspJ2msm6clMCkdW9', // Jessica
  'Neutral Male': 'nPczCjzI2devNBz1zQrb', // Brian
  'Comedic Male': 'iP95p4xoKVk53GoZ742B', // Chris
  'Elderly Male Mentor': 'pqHfZKP75CvOlQylNhV4', // Bill
  'Elderly Female Mentor': 'XrExE9yKIg1WjnnlVkGX', // Matilda
  'Young Hero': 'IKne3meq5aSn9XLyUdCD', // Charlie
}

// Function to filter script content for cleaner audio generation
function filterScriptForAudio(scriptText: string): string {
  console.log('Starting filterScriptForAudio with text length:', scriptText.length)
  
  const lines = scriptText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  const filteredLines: string[] = [];
  
  // Enhanced patterns to exclude more script elements
  const pageNumberPattern = /^\d+$|^Page\s+\d+|^PAGE\s+\d+/i;
  const stageDirectionPattern = /^\([^)]+\)|^\[[^\]]+\]|^\{[^}]+\}|^CONT'D$|^CONTINUED$/i;
  const sceneNumberPattern = /^SCENE\s+\d+|^ACT\s+\d+/i;
  const characterNamePattern = /^[A-Z][A-Z\s\-'\.]+$|^[A-Z][A-Z\s]+:$/;
  const transitionPattern = /^(FADE IN|FADE OUT|CUT TO|DISSOLVE TO|INT\.|EXT\.|INT\/EXT\.)/i;
  
  let skipNext = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    console.log(`Processing line ${i}: "${line}"`)
    
    // Skip if we flagged this line to skip
    if (skipNext) {
      skipNext = false;
      console.log('  -> Skipped (flagged)')
      continue;
    }
    
    // Skip page numbers
    if (pageNumberPattern.test(line)) {
      console.log('  -> Skipped (page number)')
      continue;
    }
    
    // Skip stage directions
    if (stageDirectionPattern.test(line)) {
      console.log('  -> Skipped (stage direction)')
      continue;
    }
    
    // Skip scene numbers and transitions
    if (sceneNumberPattern.test(line)) {
      console.log('  -> Skipped (scene number)')
      continue;
    }
    
    // Skip transitions and scene headings
    if (transitionPattern.test(line)) {
      console.log('  -> Skipped (transition)')
      continue;
    }
    
    // For character names, skip the name but include the following dialogue
    if (characterNamePattern.test(line) && !stageDirectionPattern.test(line)) {
      console.log('  -> Skipped (character name)')
      continue;
    }
    
    // Include everything else (dialogue, scene descriptions, action lines)
    if (line.length > 2) {
      console.log('  -> Included')
      filteredLines.push(line);
    } else {
      console.log('  -> Skipped (too short)')
    }
  }
  
  const result = filteredLines.join(' ').replace(/\s+/g, ' ').trim();
  console.log('Filter result length:', result.length)
  console.log('Filter result preview:', result.substring(0, 200))
  
  return result;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { voiceStyle, mood, userId, projectId, customText } = await req.json()

    if (!userId || !projectId) {
      throw new Error('userId and projectId are required')
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    let textToGenerate: string

    // Use dynamic text from script or custom text
    if (customText) {
      console.log('Original custom text length:', customText.length)
      console.log('Original custom text preview:', customText.substring(0, 200))
      
      // Apply filtering to custom text as well
      const filteredCustomText = filterScriptForAudio(customText)
      
      console.log('Filtered text length:', filteredCustomText.length)
      console.log('Filtered text preview:', filteredCustomText.substring(0, 200))
      
      // Truncate filtered text to 800 characters for performance
      textToGenerate = filteredCustomText.length > 800 
        ? filteredCustomText.substring(0, 800) + '...'
        : filteredCustomText
    } else {
      // Otherwise, fetch script content from storage
      const { data: project, error: projectError } = await supabase
        .from('user_projects')
        .select('script_url')
        .eq('id', projectId)
        .eq('user_id', userId)
        .single()

      if (projectError || !project) {
        throw new Error('Project not found or access denied')
      }

      if (!project.script_url) {
        throw new Error('No script uploaded for this project')
      }

      const { data: scriptData, error: scriptError } = await supabase.storage
        .from('user-files')
        .download(project.script_url.split('/').pop()!)

      if (scriptError || !scriptData) {
        throw new Error('Failed to fetch script content')
      }

      const scriptContent = await scriptData.text()
      
      // Parse and filter the script to remove unwanted elements
      const filteredContent = filterScriptForAudio(scriptContent)
      
      // Use first 800 characters for efficient audio generation
      textToGenerate = filteredContent.length > 800 
        ? filteredContent.substring(0, 800) + '...'
        : filteredContent
    }

    console.log('Generating audio for:', { voiceStyle, mood, textLength: textToGenerate.length, usingCustomText: !!customText })

    // Get ElevenLabs API key
    const elevenLabsApiKey = Deno.env.get('ELEVENLABS_API_KEY')
    if (!elevenLabsApiKey) {
      throw new Error('ElevenLabs API key not configured')
    }

    // Map voice style to ElevenLabs voice ID
    const voiceId = voiceMap[voiceStyle] || 'EXAVITQu4vr4xnSDxMaL' // Default to Sarah

    // Create prompt that incorporates mood
    let styledText = textToGenerate
    if (mood) {
      const moodInstructions = {
        'Tense': 'Speak with tension and urgency in your voice.',
        'Inspiring': 'Speak with inspiration and motivation.',
        'Dark': 'Speak with a dark and mysterious tone.',
        'Comedic': 'Speak with humor and lightness.',
        'Melancholy': 'Speak with a sad and reflective tone.',
        'Hopeful': 'Speak with hope and optimism.',
        'Romantic': 'Speak with warmth and romance.',
        'Epic': 'Speak with grandeur and epicness.'
      }
      
      const instruction = moodInstructions[mood as keyof typeof moodInstructions]
      if (instruction) {
        styledText = `${instruction} ${textToGenerate}`
      }
    }

    console.log('Using voice ID:', voiceId)

    // Generate audio with ElevenLabs
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': elevenLabsApiKey,
      },
      body: JSON.stringify({
        text: styledText,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5,
        },
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('ElevenLabs API error:', errorText)
      throw new Error(`ElevenLabs API error: ${response.status}`)
    }

    // Get audio buffer
    const audioBuffer = await response.arrayBuffer()
    console.log('Audio generated, size:', audioBuffer.byteLength)

    // Upload to Supabase Storage
    const fileName = `${userId}/${projectId}-audio.mp3`
    const { error: uploadError } = await supabase.storage
      .from('user-files')
      .upload(fileName, audioBuffer, {
        cacheControl: '3600',
        upsert: true,
        contentType: 'audio/mpeg'
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      throw new Error(`Upload failed: ${uploadError.message}`)
    }

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from('user-files')
      .getPublicUrl(fileName)

    console.log('Audio uploaded successfully:', urlData.publicUrl)

    return new Response(
      JSON.stringify({ 
        audioUrl: urlData.publicUrl,
        success: true 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error in generate-audio function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})