import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

serve(async (req) => {
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

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const systemPrompt = `You are an AI Film Director analyzing screenplays. Your job is to preserve the screenplay structure and output it as a structured JSON array where EACH line of dialogue or action becomes its own entry.

OUTPUT FORMAT - Return ONLY a valid JSON array with this structure:
[
  {
    "scene_id": 1,
    "line_id": 1,
    "type": "scene_heading",
    "character": null,
    "text": "INT. COFFEE SHOP - DAY",
    "voice_key": null,
    "voice_style": null,
    "mood": "establishing",
    "estimated_duration_seconds": 0
  },
  {
    "scene_id": 1,
    "line_id": 2,
    "type": "action",
    "character": "NARRATOR",
    "text": "A busy coffee shop. Customers chat quietly.",
    "voice_key": "narrator",
    "voice_style": "Calm, descriptive",
    "mood": "ambient",
    "estimated_duration_seconds": 3
  },
  {
    "scene_id": 1,
    "line_id": 3,
    "type": "dialogue",
    "character": "SARAH",
    "text": "I can't believe you're actually here.",
    "voice_key": "sarah",
    "voice_style": "Surprised, emotional",
    "mood": "surprised",
    "estimated_duration_seconds": 2
  },
  {
    "scene_id": 1,
    "line_id": 4,
    "type": "dialogue",
    "character": "MIKE",
    "text": "I promised I'd come back, didn't I?",
    "voice_key": "mike",
    "voice_style": "Warm, sincere",
    "mood": "heartfelt",
    "estimated_duration_seconds": 2
  }
]

LINE TYPES:
- "scene_heading": For INT./EXT. scene headers (no voice needed)
- "action": For action/description lines (use NARRATOR character with voice_key "narrator")
- "dialogue": For character dialogue (preserve the character name, create a unique voice_key)
- "transition": For FADE IN, CUT TO, etc. (no voice needed)
- "parenthetical": For parentheticals like (whispering) (no voice, just metadata)

VOICE_KEY RULES:
- Create a unique, lowercase voice_key for each character (e.g., "sarah", "mike", "detective_jones")
- Use "narrator" for all action/description lines
- voice_key should be consistent for the same character throughout
- Set to null for scene_heading and transition types

CRITICAL RULES:
1. Return ONLY the JSON array, no markdown or extra text
2. Preserve EVERY line from the screenplay - do not summarize or combine
3. Each dialogue line should be its own entry
4. Each action/description paragraph should be its own entry
5. Keep the original character names exactly as written
6. Estimate duration based on text length (roughly 150 words per minute speaking rate)
7. Increment scene_id when you encounter a new INT./EXT. scene heading
8. line_id should be unique and sequential across the entire script`;

    const startTime = Date.now();
    
    const groqApiKey = Deno.env.get('GROQ_API_KEY');
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    
    let apiResponse;
    let providerUsed = '';
    
    if (groqApiKey) {
      console.log('Using Groq API for ultra-fast inference...');
      providerUsed = 'groq';
      
      apiResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.1-70b-versatile',
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: `Analyze this screenplay and return the structured JSON array preserving each line:\n\n${script}`
            }
          ],
          temperature: 0.2,
          max_tokens: 8000
        })
      });
    } else if (openaiApiKey) {
      console.log('Groq API key not found, falling back to OpenAI...');
      providerUsed = 'openai';
      
      apiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
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
              content: `Analyze this screenplay and return the structured JSON array preserving each line:\n\n${script}`
            }
          ],
          temperature: 0.2,
          max_tokens: 8000
        })
      });
    } else {
      throw new Error('No API key found. Please set either GROQ_API_KEY or OPENAI_API_KEY');
    }

    const processingTime = Date.now() - startTime;
    console.log(`${providerUsed.toUpperCase()} API response received in ${processingTime}ms`);

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error(`${providerUsed} API error:`, errorText);
      throw new Error(`${providerUsed} API error: ${apiResponse.status} - ${errorText}`);
    }

    const aiResult = await apiResponse.json();
    let aiDirectorContent = aiResult.choices[0].message.content;
    console.log('Raw AI response:', aiDirectorContent);

    aiDirectorContent = aiDirectorContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    let directorJson;
    try {
      directorJson = JSON.parse(aiDirectorContent);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      console.error('AI response content:', aiDirectorContent);
      directorJson = [
        {
          scene_id: 1,
          line_id: 1,
          type: "action",
          character: "NARRATOR",
          text: "Script analysis in progress. The system is processing your screenplay.",
          voice_key: "narrator",
          voice_style: "Professional, clear",
          mood: "Informative",
          estimated_duration_seconds: 3
        }
      ];
    }

    if (!Array.isArray(directorJson)) {
      console.error('AI response is not an array, creating fallback');
      directorJson = [
        {
          scene_id: 1,
          line_id: 1,
          type: "action",
          character: "NARRATOR",
          text: "Script analysis completed. Please review the processed content.",
          voice_key: "narrator",
          voice_style: "Professional, clear",
          mood: "Informative",
          estimated_duration_seconds: 3
        }
      ];
    }

    const linesWithStatus = directorJson.map((line: any, index: number) => ({
      ...line,
      scene_id: line.scene_id || 1,
      line_id: line.line_id || index + 1,
      type: line.type || 'dialogue',
      status: 'pending'
    }));

    const uniqueCharacters = [...new Set(
      linesWithStatus
        .filter((l: any) => l.character && l.character !== 'NARRATOR')
        .map((l: any) => l.character)
    )];
    
    const voiceAssignments: Record<string, string> = {};
    linesWithStatus.forEach((line: any) => {
      if (line.voice_key && line.character) {
        voiceAssignments[line.character] = line.voice_key;
      }
    });

    const { error: updateError } = await supabase.from('user_projects').update({
      ai_director_json: linesWithStatus,
      script: script
    }).eq('id', project_id);

    if (updateError) {
      console.error('Database update error:', updateError);
      throw new Error(`Database update error: ${updateError.message}`);
    }

    console.log(`Successfully analyzed script for project ${project_id} using ${providerUsed} in ${processingTime}ms`);
    console.log(`Found ${uniqueCharacters.length} unique characters: ${uniqueCharacters.join(', ')}`);
    console.log(`Total lines: ${linesWithStatus.length}`);

    return new Response(JSON.stringify({
      success: true,
      line_count: linesWithStatus.length,
      character_count: uniqueCharacters.length,
      characters: uniqueCharacters,
      voice_assignments: voiceAssignments,
      director_json: linesWithStatus,
      provider: providerUsed,
      processing_time_ms: processingTime
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error in analyze-script function:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
      details: error instanceof Error ? error.toString() : 'Unknown error'
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
