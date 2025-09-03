import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get the authorization header
    const authorization = req.headers.get('Authorization')
    if (!authorization) {
      throw new Error('No authorization header')
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authorization } } }
    )

    // Verify user is authenticated
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      throw new Error('User not authenticated')
    }

    // Get ElevenLabs API key from Supabase secrets
    const elevenLabsApiKey = Deno.env.get('ELEVENLABS_API_KEY')
    if (!elevenLabsApiKey) {
      throw new Error('ElevenLabs API key not configured')
    }

    // Fetch voices from ElevenLabs API
    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      method: 'GET',
      headers: {
        'xi-api-key': elevenLabsApiKey,
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText}`)
    }

    const voicesData = await response.json()
    
    // Filter to only include user's actual voices (exclude premade and professional)
    const userVoices = voicesData.voices.filter((voice: any) => 
      voice.category === 'cloned' || voice.category === 'generated'
    )
    
    // Transform the voice data to include preview URLs and other useful info
    const voices = userVoices.map((voice: any) => ({
      voice_id: voice.voice_id,
      name: voice.name,
      category: voice.category,
      description: voice.description,
      preview_url: voice.preview_url,
      available_for_tiers: voice.available_for_tiers,
      settings: voice.settings,
      labels: voice.labels || {},
      samples: voice.samples || [],
      high_quality_base_model_ids: voice.high_quality_base_model_ids || []
    }))

    return new Response(
      JSON.stringify({ 
        voices,
        count: voices.length 
      }),
      {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
      }
    )

  } catch (error) {
    console.error('Error fetching ElevenLabs voices:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to fetch voices',
        voices: [],
        count: 0
      }),
      {
        status: 400,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
      }
    )
  }
})