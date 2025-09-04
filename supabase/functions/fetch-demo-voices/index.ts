import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

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
    
    // Define a subset of demo voices for public showcase - using some of the best quality voices
    const demoVoiceMapping: Record<string, string> = {
      // Female 20s to 30s
      "C3x1TEM7scV4p2AXJyrp": "Female 20s to 30s", // Zuri - New Yorker
      "4D9Pkpgb8u9YXb1E2jKB": "Female 20s to 30s", // Stacy (African American)
      "5BkEaSrc8SxSp7cOflae": "Female 20s to 30s", // Catherine - 20s to 30s British Female
      
      // Female Teen
      "2bIeDnqItemdU7o6zCwq": "Female Teen", // Meagan Platt
      "4amdp26YcC12p4g0caal": "Female Teen", // Jen
      
      // Male 20s to 30s
      "1RVpBInY9YUYMLSUQReV": "Male 20s to 30s", // Cody McAvoy
      
      // Male Teen
      "DTKMou8ccj1ZaWGBiotd": "Male Teen", // Jamahal
      "3XOBzXhnDY98yeWQ3GdM": "Male Teen", // Brayden - Conversational Older Teen
      "BFnAlAvxDrOEsXlGCLZ2": "Male Teen", // Chad - chill
      "AtHOGgML51i4RHBVD0le": "Male Teen", // Jeff
      
      // Narrator
      "AeRdCCKzvd23BpJoofzx": "Narrator", // Nathaniel C - Suspense, British calm
      
      // Older Female
      "AFDn1vVPITHRYD7x7GhG": "Older Female", // Old Southern Black Woman (Mamma Bec 7)
      "4eC0mcIIjlMstsKu8fMF": "Older Female", // Old Southern Woman (Mamma Bec 6)
      "Blpxl6Q79PMW6Pr2PNq1": "Older Female", // Old Southern Black Woman (Mamma Bec 8)
      
      // Older Male
      "00y4m1PbCBtjIPrwiynB": "Older Male", // Henry -actor (without CLONE)
      "1G9Ya1Fy4Ju2EAKyjGYJ": "Older Male", // Old Southern Male (Henry 10)
      "1muICAxikLeZXeIglHdH": "Older Male", // Old Southern Male (Henry 6)
    }

    // Filter to ONLY include the demo voices
    const demoVoices = voicesData.voices.filter((voice: any) => 
      demoVoiceMapping.hasOwnProperty(voice.voice_id)
    )
    
    // Transform the voice data and assign the correct categories
    const voices = demoVoices.map((voice: any) => ({
      voice_id: voice.voice_id,
      name: voice.name,
      category: demoVoiceMapping[voice.voice_id], // Use demo category
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
    console.error('Error fetching demo ElevenLabs voices:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to fetch demo voices',
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