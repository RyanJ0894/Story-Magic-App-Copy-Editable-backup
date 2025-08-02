import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Voice style to ElevenLabs voice ID mapping
const voiceMap: Record<string, string> = {
  'Narrator Deep': 'JBFqnCBsd6RMkjVDRZzb', // George
  'Narrator Soothing': 'TX3LPaxmHKxFdv7VOQHJ', // Liam
  'Warm Female': 'EXAVITQu4vr4xnSDxMaL', // Sarah
  'Assertive Female': 'cgSgspJ2msm6clMCkdW9', // Jessica
  'Neutral Male': 'nPczCjzI2devNBz1zQrb', // Brian
  'Comedic Male': 'iP95p4xoKVk53GoZ742B', // Chris
  'Elderly Male Mentor': 'pqHfZKP75CvOlQylNhV4', // Bill
  'Elderly Female Mentor': 'XrExE9yKIg1WjnnlVkGX', // Matilda
  'Young Hero': 'IKne3meq5aSn9XLyUdCD', // Charlie
}

// Function to clean script content for better audio generation
function filterScriptForAudio(scriptText: string): string {
  if (!scriptText || typeof scriptText !== 'string') {
    return '';
  }
  
  const lines = scriptText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  const filteredLines: string[] = [];
  
  // Patterns to remove script formatting elements
  const pageNumberPattern = /^\d+$|^Page\s+\d+|^PAGE\s+\d+/i;
  const stageDirectionPattern = /^\([^)]+\)|^\[[^\]]+\]|^\{[^}]+\}|^CONT'D$|^CONTINUED$|^MORE$/i;
  const sceneNumberPattern = /^SCENE\s+\d+|^ACT\s+\d+|^CHAPTER\s+\d+/i;
  const characterNamePattern = /^[A-Z][A-Z\s\-'\.]{2,}$|^[A-Z][A-Z\s\-'\.]+:$/;
  const transitionPattern = /^(FADE IN|FADE OUT|CUT TO|DISSOLVE TO|INT\.|EXT\.|INT\/EXT\.|INTERIOR|EXTERIOR)/i;
  const sceneHeadingPattern = /^(INT\.|EXT\.|INTERIOR|EXTERIOR)\s+.+\s+[-–—]\s+(DAY|NIGHT|MORNING|EVENING|DAWN|DUSK|LATER|CONTINUOUS)/i;
  
  for (const line of lines) {
    // Skip empty lines
    if (!line.trim()) continue;
    
    // Skip script formatting elements
    if (pageNumberPattern.test(line) || 
        stageDirectionPattern.test(line) || 
        sceneNumberPattern.test(line) || 
        characterNamePattern.test(line) || 
        transitionPattern.test(line) || 
        sceneHeadingPattern.test(line)) {
      continue;
    }
    
    // Keep dialogue and narration
    if (line.length > 2) {
      filteredLines.push(line);
    }
  }
  
  // Join and clean up
  let result = filteredLines.join(' ').replace(/\s+/g, ' ').trim();
  
  // Additional cleanup
  result = result
    .replace(/\b(CONT'D|CONTINUED|MORE)\b/gi, '')
    .replace(/\([^)]*\)/g, '') // Remove parentheticals
    .replace(/\[[^\]]*\]/g, '') // Remove brackets
    .replace(/\{[^}]*\}/g, '') // Remove braces
    .replace(/\s+/g, ' ')
    .trim();
  
  return result;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  console.log('🎵 Generate Audio function called - redeployed with updated filtering')

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

    // Use custom text if provided, otherwise fetch from storage
    if (customText) {
      // Filter the custom text to remove script formatting
      const filteredText = filterScriptForAudio(customText)
      
      // Truncate to 800 characters for performance
      textToGenerate = filteredText.length > 800 
        ? filteredText.substring(0, 800) + '...'
        : filteredText
    } else {
      // Fetch script content from storage
      const { data: project, error: projectError } = await supabase
        .from('user_projects')
        .select('script_url')
        .eq('id', projectId)
        .eq('user_id', userId)
        .single()

      if (projectError || !project?.script_url) {
        throw new Error('Project not found or no script uploaded')
      }

      const { data: scriptData, error: scriptError } = await supabase.storage
        .from('user-files')
        .download(project.script_url.split('/').pop()!)

      if (scriptError || !scriptData) {
        throw new Error('Failed to fetch script content')
      }

      const scriptContent = await scriptData.text()
      const filteredContent = filterScriptForAudio(scriptContent)
      
      textToGenerate = filteredContent.length > 800 
        ? filteredContent.substring(0, 800) + '...'
        : filteredContent
    }

    // Validate we have text to generate
    if (!textToGenerate || textToGenerate.trim().length === 0) {
      throw new Error('No valid content found to generate audio')
    }

    // Get ElevenLabs API key
    const elevenLabsApiKey = Deno.env.get('ELEVENLABS_API_KEY')
    if (!elevenLabsApiKey) {
      throw new Error('ElevenLabs API key not configured')
    }

    // Map voice style to ElevenLabs voice ID
    const voiceId = voiceMap[voiceStyle] || 'EXAVITQu4vr4xnSDxMaL' // Default to Sarah

    // Apply mood styling
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
      throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`)
    }

    // Get audio buffer
    const audioBuffer = await response.arrayBuffer()

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
      throw new Error(`Upload failed: ${uploadError.message}`)
    }

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from('user-files')
      .getPublicUrl(fileName)

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
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
