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
    
    // Define the exact voice IDs and their categories as specified by the user
    const userVoiceMapping: Record<string, string> = {
      // Female 20s to 30s
      "xZVrOjUURog02K298cjt": "Female 20s to 30s",
      "XhNlP8uwiH6XZSFnH1yL": "Female 20s to 30s",
      "C3x1TEM7scV4p2AXJyrp": "Female 20s to 30s",
      "uYXf8XasLslADfZ2MB4u": "Female 20s to 30s",
      "WAhoMTNdLdMoq1j3wf3I": "Female 20s to 30s",
      "S2fYVrVpl5QYHVJ1LkgT": "Female 20s to 30s",
      "ccczwhcFl5t2kkNhz4Xg": "Female 20s to 30s",
      "4D9Pkpgb8u9YXb1E2jKB": "Female 20s to 30s",
      "LElbsnORyWdRipDG9D4D": "Female 20s to 30s",
      "cnPPy2dWDNfzwhzvZ3CJ": "Female 20s to 30s",
      "vr5WKaGvRWsoaX5LCVax": "Female 20s to 30s",
      "5BkEaSrc8SxSp7cOflae": "Female 20s to 30s",
      
      // Female Teen
      "bMxLr8fP6hzNRRi9nJxU": "Female Teen",
      "wrxvN1LZJIfL3HHvffqe": "Female Teen",
      "T7eLpgAAhoXHlrNajG8v": "Female Teen",
      "JGwmRZcgvck23cD2TuYq": "Female Teen",
      "4amdp26YcC12p4g0caal": "Female Teen",
      "PV8O5l7QO8ZTd5Rln7Z5": "Female Teen",
      "2bIeDnqItemdU7o6zCwq": "Female Teen",
      "Djjbjv1y8TG5IpNX5YAK": "Female Teen",
      "VmeYJ8yn9LbQxhPAl5wO": "Female Teen",
      "dP9ClfrTRIUt2zMBr00W": "Female Teen",
      
      // Female Under 10
      "jLreTVzdmVFjzOZ4f2Jx": "Female Under 10",
      "TkSyBjII8TcWww0CSouI": "Female Under 10",
      
      // Male 20s to 30s
      "PSqRw3ln34TxQZrTS6Wt": "Male 20s to 30s",
      "mcuuWJIofmzgKEGk3EMA": "Male 20s to 30s",
      "Yy9hdn23JDNfhVPIWlHY": "Male 20s to 30s",
      "1RVpBInY9YUYMLSUQReV": "Male 20s to 30s",
      "XvfwInXiPC6BcAjGWhmS": "Male 20s to 30s",
      "MWYZAv88R6kW8dvZNtvU": "Male 20s to 30s",
      "JRt8VLagGlOd5Vi5tMfX": "Male 20s to 30s",
      "m9Ul0apeWDFimb3H9yGY": "Male 20s to 30s",
      "Tm4QO7PzRBQqp7MSSl5w": "Male 20s to 30s",
      "k1SgXRmVVqpFcQpNU1ou": "Male 20s to 30s",
      
      // Male Teen
      "DTKMou8ccj1ZaWGBiotd": "Male Teen",
      "3XOBzXhnDY98yeWQ3GdM": "Male Teen",
      "Pb8RZcHs3ga4StE7wiPM": "Male Teen",
      "FIsP50cHv9JY47BkNVR7": "Male Teen",
      "iRR5JQNuSp2XN7iF7jPL": "Male Teen",
      "BFnAlAvxDrOEsXlGCLZ2": "Male Teen",
      "QEDAiBNESWY7Es1bu9HY": "Male Teen",
      "AtHOGgML51i4RHBVD0le": "Male Teen",
      "ZhLVlARQZoYYz5GikrfB": "Male Teen",
      "ciopqvYA9WYw3xOGbodX": "Male Teen",
      
      // Male Under 10
      "RnC1vV4hTIG6mpspiNMw": "Male Under 10",
      "OzETXvniP8ZpkhCsvTBQ": "Male Under 10",
      
      // Narrator
      "L0Dsvb3SLTyegXwtm47J": "Narrator",
      "uju3wxzG5OhpWcoi3SMy": "Narrator",
      "XjLkpWUlnhS8i7gGz3lZ": "Narrator",
      "AeRdCCKzvd23BpJoofzx": "Narrator",
      "L1aJrPa7pLJEyYlh3Ilq": "Narrator",
      "wJqPPQ618aTW29mptyoc": "Narrator",
      "RILOU7YmBhvwJGDGjNmP": "Narrator",
      "e5WNhrdI30aXpS2RSGm1": "Narrator",
      "pcKdPWtbF6bM9o7NHjCI": "Narrator",
      
      // Older Female
      "XxY7LfDr5SzeemL30EAJ": "Older Female",
      "lIgS04i5awvulQMifXvy": "Older Female",
      "xMZOFuTAHKtUd0aelHvM": "Older Female",
      "Mh8UZv56BYw5HLxsvw5K": "Older Female",
      "loP8wMysfD4AP5kifsuy": "Older Female",
      "dvw9ITErgRa9TX7AkMgx": "Older Female",
      "4eC0mcIIjlMstsKu8fMF": "Older Female",
      "AFDn1vVPITHRYD7x7GhG": "Older Female",
      "Blpxl6Q79PMW6Pr2PNq1": "Older Female",
      "zUZjZwPQKfsRlH9QVPnK": "Older Female",
      
      // Older Male
      "iiidtqDt9FBdT1vfBluA": "Older Male",
      "NOpBlnGInO9m6vDvFkFC": "Older Male",
      "tp4cRlXymyN4yXXo3DYv": "Older Male",
      "yW0E1QYarnD3WCLTdWuX": "Older Male",
      "Vv4DE9DtUpdmwjp7ucgc": "Older Male",
      "1muICAxikLeZXeIglHdH": "Older Male",
      "Vnuyx38AQEZgAlsJN8mB": "Older Male",
      "1G9Ya1Fy4Ju2EAKyjGYJ": "Older Male",
      "00y4m1PbCBtjIPrwiynB": "Older Male"
    }

    // Filter to ONLY include the user's specified voices
    const userVoices = voicesData.voices.filter((voice: any) => 
      userVoiceMapping.hasOwnProperty(voice.voice_id)
    )
    
    // Transform the voice data and assign the correct user categories
    const voices = userVoices.map((voice: any) => ({
      voice_id: voice.voice_id,
      name: voice.name,
      category: userVoiceMapping[voice.voice_id], // Use user's specified category
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