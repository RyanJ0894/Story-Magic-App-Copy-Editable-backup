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
    console.log('📝 Request params:', { voiceStyle, mood, userId, projectId, customText: !!customText })

    if (!userId || !projectId) {
      throw new Error('userId and projectId are required')
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    let textToGenerate: string

    // Fetch project data including ai_director_json
    const { data: project, error: projectError } = await supabase
      .from('user_projects')
      .select('script_url, ai_director_json')
      .eq('id', projectId)
      .eq('user_id', userId)
      .single()

    if (projectError || !project) {
      console.error('❌ Project fetch error:', projectError)
      throw new Error('Project not found')
    }

    // Log ai_director_json at the top
    console.log('ai_director_json:', project.ai_director_json)

    let voiceSegments: Array<{type: string, text: string, voice: string}> = []

    // Priority 1: Check AI Director JSON first
    let ai_director_json = null
    if (project.ai_director_json) {
      try {
        ai_director_json = JSON.parse(project.ai_director_json)
      } catch (parseError) {
        console.error('❌ Failed to parse AI Director JSON:', parseError)
      }
    }

    if (ai_director_json && ai_director_json.lines && ai_director_json.lines.length > 0) {
      // Process each line using ai_director_json
      console.log("✅ Using AI DIRECTOR JSON")
      
      voiceSegments = ai_director_json.lines.map((segment: any) => ({
        type: segment.type || 'narration',
        text: segment.text || '',
        voice: segment.voice || voiceStyle || 'Narrator Deep'
      })).filter((segment: any) => segment.text.trim().length > 0)
      
      console.log(`Created ${voiceSegments.length} voice segments from AI Director JSON`)
    }
    // Priority 2: Use custom text if provided and no AI Director JSON
    else if (customText) {
      console.log('🎯 Using custom text input')
      const filteredText = filterScriptForAudio(customText)
      const truncatedText = filteredText.length > 800 
        ? filteredText.substring(0, 800) + '...'
        : filteredText
      
      voiceSegments = [{
        type: 'narration',
        text: truncatedText,
        voice: voiceStyle || 'Narrator Deep'
      }]
    }
    // Priority 3: Fallback to raw script parsing
    else {
      console.log("❌ Fallback to scriptContent")
        
        if (!project.script_url) {
          throw new Error('No script content available')
        }

        const { data: scriptData, error: scriptError } = await supabase.storage
          .from('user-files')
          .download(project.script_url.split('/').pop()!)

        if (scriptError || !scriptData) {
          throw new Error('Failed to fetch script content')
        }

        const scriptContent = await scriptData.text()
        const filteredContent = filterScriptForAudio(scriptContent)
        const truncatedContent = filteredContent.length > 800 
          ? filteredContent.substring(0, 800) + '...'
          : filteredContent

        voiceSegments = [{
          type: 'narration',
          text: truncatedContent,
          voice: voiceStyle || 'Narrator Deep'
        }]
        
        console.log('📄 Using script content fallback')
    }

    // Validate we have segments to generate
    if (voiceSegments.length === 0) {
      throw new Error('No valid content found to generate audio')
    }

    // Get ElevenLabs API key
    const elevenLabsApiKey = Deno.env.get('ELEVENLABS_API_KEY')
    if (!elevenLabsApiKey) {
      throw new Error('ElevenLabs API key not configured')
    }

    // Function to get voice ID from voice name or ID
    const getVoiceId = (voice: string): string => {
      return voiceMap[voice] || voice || 'EXAVITQu4vr4xnSDxMaL' // Default to Sarah
    }

    // Function to apply mood styling to text
    const applyMoodStyling = (text: string, currentMood?: string): string => {
      if (!currentMood && !mood) return text
      
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
      
      const activeMood = currentMood || mood
      const instruction = moodInstructions[activeMood as keyof typeof moodInstructions]
      return instruction ? `${instruction} ${text}` : text
    }

    // Generate audio for each segment
    const audioBuffers: ArrayBuffer[] = []
    
    console.log(`Generating audio for ${voiceSegments.length} segments`)
    
    for (let i = 0; i < voiceSegments.length; i++) {
      const segment = voiceSegments[i]
      const voiceId = getVoiceId(segment.voice)
      const styledText = applyMoodStyling(segment.text)
      
      console.log(`Segment ${i + 1}: ${segment.type} with voice ${segment.voice} (${voiceId})`)
      
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
        throw new Error(`ElevenLabs API error for segment ${i + 1}: ${response.status} - ${errorText}`)
      }

      const audioBuffer = await response.arrayBuffer()
      audioBuffers.push(audioBuffer)
    }

    // Combine all audio buffers (simple concatenation for MP3)
    const totalLength = audioBuffers.reduce((sum, buffer) => sum + buffer.byteLength, 0)
    const combinedBuffer = new Uint8Array(totalLength)
    let offset = 0
    
    for (const buffer of audioBuffers) {
      combinedBuffer.set(new Uint8Array(buffer), offset)
      offset += buffer.byteLength
    }

    // Upload to Supabase Storage
    const fileName = `${userId}/${projectId}-audio.mp3`
    const { error: uploadError } = await supabase.storage
      .from('user-files')
      .upload(fileName, combinedBuffer, {
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
