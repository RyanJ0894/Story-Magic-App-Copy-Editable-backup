import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
      throw new Error('Missing project_id or script_text');
    }
    
    console.log('🎬 Triggering RelevanceAI for project:', project_id);
    
    // Hardcoded working webhook URL (verified via direct testing)
    const webhookUrl = 'https://api-bcbe5a.stack.tryrelevance.com/latest/agents/hooks/custom-trigger/234084c7-e850-4e25-8a73-103f803cfd41/c79e2bc6-9126-455d-9623-a50b703605e1';
    
    console.log('📡 Calling RelevanceAI webhook...');
    
    // Call RelevanceAI - webhook URL is self-authenticating, NO auth headers needed
    const relevanceResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        project_id: project_id,
        script_text: script_text
      })
    });
    
    const responseText = await relevanceResponse.text();
    console.log('📥 RelevanceAI status:', relevanceResponse.status);
    console.log('📥 RelevanceAI response:', responseText);
    
    if (!relevanceResponse.ok) {
      throw new Error(`RelevanceAI returned ${relevanceResponse.status}: ${responseText}`);
    }
    
    console.log('✅ RelevanceAI triggered successfully');
    
    return new Response(JSON.stringify({
      success: true,
      message: 'RelevanceAI webhook triggered successfully',
      project_id,
      relevance_status: relevanceResponse.status,
      data: responseText
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
