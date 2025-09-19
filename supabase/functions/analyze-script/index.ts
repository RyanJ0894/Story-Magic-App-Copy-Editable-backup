import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
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
    const { project_id, script } = await req.json();
    if (!project_id || !script) {
      throw new Error('Missing project_id or script');
    }
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    // System prompt to keep the script as one cohesive scene
    const systemPrompt = `You are an AI Film Director. Analyze the script and return ONLY a valid JSON array. For any script provided, create exactly ONE scene that contains the complete narrative:

[
  {
    "scene_id": 1,
    "character": "NARRATOR",
    "dialogue": "[Complete script content converted to narrative form - include all dialogue, action, and scene descriptions as one flowing story]",
    "voice_style": "Cinematic, dramatic",
    "mood": "Appropriate to the script's tone",
    "background_ambiance": "Sound effects matching the scene",
    "background_music": "Musical underscore matching the mood",
    "mixing_parameters": {
      "voiceVolume": 0.8,
      "ambianceVolume": 0.4,
      "musicVolume": 0.3,
      "crossfadeDuration": 2.0
    }
  }
]

CRITICAL RULES:
- Return ONLY the JSON array, no other text or markdown
- Create exactly ONE scene object (scene_id: 1)
- Convert the entire script into a single flowing narrative dialogue
- Use NARRATOR as the character for everything
- Include all character dialogue and actions in the narrative
- Choose appropriate voice_style, mood, background_ambiance, and background_music`;
    // Call OpenAI API
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: `Analyze this script excerpt and return the JSON array:\n\n${script}`
          }
        ],
        temperature: 0.3,
        max_tokens: 4000
      })
    });
    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${openAIResponse.status} - ${errorText}`);
    }
    const aiResult = await openAIResponse.json();
    let aiDirectorContent = aiResult.choices[0].message.content;
    console.log('Raw AI response:', aiDirectorContent);
    // Clean up the response - remove any markdown formatting
    aiDirectorContent = aiDirectorContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    // Parse and validate JSON
    let directorJson;
    try {
      directorJson = JSON.parse(aiDirectorContent);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      console.error('AI response content:', aiDirectorContent);
      // Create a fallback simple structure
      directorJson = [
        {
          scene_id: 1,
          character: "NARRATOR",
          dialogue: "Script analysis in progress. The system is processing your screenplay.",
          voice_style: "Professional, clear",
          mood: "Informative",
          background_ambiance: "Quiet studio",
          background_music: "None",
          mixing_parameters: {
            voiceVolume: 0.8,
            ambianceVolume: 0.1,
            musicVolume: 0.0,
            crossfadeDuration: 1.0
          }
        }
      ];
    }
    // Validate structure
    if (!Array.isArray(directorJson)) {
      console.error('AI response is not an array, creating fallback');
      directorJson = [
        {
          scene_id: 1,
          character: "NARRATOR",
          dialogue: "Script analysis completed. Please review the processed content.",
          voice_style: "Professional, clear",
          mood: "Informative",
          background_ambiance: "Quiet studio",
          background_music: "None",
          mixing_parameters: {
            voiceVolume: 0.8,
            ambianceVolume: 0.1,
            musicVolume: 0.0,
            crossfadeDuration: 1.0
          }
        }
      ];
    }
    // Add status to each scene segment
    const scenesWithStatus = directorJson.map((scene, index)=>({
        ...scene,
        scene_id: scene.scene_id || index + 1,
        status: 'pending'
      }));
    // Update project with AI director JSON
    const { error: updateError } = await supabase.from('user_projects').update({
      ai_director_json: scenesWithStatus,
      script: script
    }).eq('id', project_id);
    if (updateError) {
      console.error('Database update error:', updateError);
      throw new Error(`Database update error: ${updateError.message}`);
    }
    console.log(`Successfully analyzed script for project ${project_id}`);
    return new Response(JSON.stringify({
      success: true,
      scene_count: scenesWithStatus.length,
      director_json: scenesWithStatus
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error in analyze-script function:', error);
    return new Response(JSON.stringify({
      error: error.message || 'An unexpected error occurred',
      details: error.toString()
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
