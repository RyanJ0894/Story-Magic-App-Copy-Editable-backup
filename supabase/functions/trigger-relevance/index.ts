import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { project_id, script_text } = await req.json();
    
    if (!project_id || !script_text) {
      console.error('❌ Missing required fields:', { has_project_id: !!project_id, has_script_text: !!script_text });
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing project_id or script_text'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      });
    }
    
    console.log('🎬 [v2] Triggering RelevanceAI for project:', project_id, '| script length:', script_text.length);
    
    // Hardcoded working webhook URL (verified via direct testing)
    const webhookUrl = 'https://api-bcbe5a.stack.tryrelevance.com/latest/agents/hooks/custom-trigger/234084c7-e850-4e25-8a73-103f803cfd41/c79e2bc6-9126-455d-9623-a50b703605e1';
    
    console.log('📡 Calling RelevanceAI webhook...');
    
    // Callback URL where RelevanceAI should send results
    const callbackUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/ai-director-callback`;
    console.log('🔔 Callback URL:', callbackUrl);
    
    // Call RelevanceAI - webhook URL is self-authenticating, NO auth headers needed
    const relevanceResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        project_id: project_id,
        script_text: script_text,
        callback_url: callbackUrl
      })
    });
    
    const responseText = await relevanceResponse.text();
    console.log('📥 RelevanceAI status:', relevanceResponse.status);
    console.log('📥 RelevanceAI raw response:', responseText);
    
    if (!relevanceResponse.ok) {
      console.error('❌ RelevanceAI error response:', { status: relevanceResponse.status, body: responseText });
      return new Response(JSON.stringify({
        success: false,
        error: `RelevanceAI returned ${relevanceResponse.status}: ${responseText}`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      });
    }
    
    console.log('✅ [v2] RelevanceAI triggered successfully');
    
    // CRITICAL: Return success=true so frontend knows it worked
    return new Response(JSON.stringify({
      success: true,
      message: 'RelevanceAI webhook triggered successfully [v2]',
      project_id: project_id,
      relevance_status: relevanceResponse.status,
      relevance_response: responseText
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
