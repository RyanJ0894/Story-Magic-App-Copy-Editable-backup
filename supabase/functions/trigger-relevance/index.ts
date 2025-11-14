import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// RelevanceAI configuration
const DIRECTOR_TRIGGER_URL = Deno.env.get("DIRECTOR_TRIGGER_URL") ?? "https://api-bcbe5a.stack.tryrelevance.com/latest/agents/trigger";
const DIRECTOR_API_KEY = Deno.env.get("DIRECTOR_API_KEY");
const NEW_AGENT_ID = "234084c7-e850-4e25-8a73-103f803cfd41";

serve(async (req) => {
  console.log('🚀 trigger-relevance: Request received at', new Date().toISOString());

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    console.log('✅ Handling CORS preflight');
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    // Parse request body
    const { project_id, script_text } = await req.json();
    console.log('📝 Received:', { project_id, scriptLength: script_text?.length });

    // Validate inputs
    if (!project_id || !script_text) {
      console.error('❌ Missing required fields');
      return new Response(JSON.stringify({ 
        error: 'Missing required fields: project_id and script_text' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!DIRECTOR_API_KEY) {
      console.error('❌ DIRECTOR_API_KEY not configured');
      return new Response(JSON.stringify({ 
        error: 'Server misconfiguration: DIRECTOR_API_KEY missing' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate API key format (should be agent_id:secret_key)
    if (!DIRECTOR_API_KEY.includes(':')) {
      console.error('❌ DIRECTOR_API_KEY has invalid format. Expected: {agent_id}:{secret_key}');
      return new Response(JSON.stringify({ 
        error: 'Server misconfiguration: DIRECTOR_API_KEY must be in format {agent_id}:{secret_key}' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Format payload for RelevanceAI agent
    const payload = {
      message: {
        role: "user",
        content: JSON.stringify({
          project_id: project_id,
          script: script_text
        })
      },
      agent_id: NEW_AGENT_ID
    };

    console.log('🎯 Triggering RelevanceAI agent:', NEW_AGENT_ID);
    console.log('📤 Full request URL:', DIRECTOR_TRIGGER_URL);
    console.log('📤 Payload:', JSON.stringify(payload, null, 2));
    console.log('📤 Using API key format:', DIRECTOR_API_KEY.split(':')[0] + ':***');

    // Call RelevanceAI trigger API
    const response = await fetch(DIRECTOR_TRIGGER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': DIRECTOR_API_KEY,
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    console.log('📥 RelevanceAI response status:', response.status);
    console.log('📥 RelevanceAI response body:', responseText);
    console.log('📥 Response body length:', responseText.length);

    if (!response.ok) {
      console.error('❌ RelevanceAI trigger failed:', response.status, responseText);
      return new Response(JSON.stringify({ 
        success: false,
        error: `RelevanceAI API error: ${response.status}`,
        details: responseText
      }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse response
    let responseData;
    try {
      responseData = JSON.parse(responseText);
      console.log('📊 Parsed response data:', JSON.stringify(responseData, null, 2));
    } catch (parseError) {
      console.error('❌ Failed to parse response as JSON:', parseError);
      responseData = { raw: responseText };
    }

    // CRITICAL: Detect if RelevanceAI is just echoing input instead of triggering
    // Check multiple response structures: top-level, nested in received_payload, nested in relevance_response
    const hasTopLevelEcho = responseData.project_id && (responseData.script || responseData.script_text);
    const hasNestedEcho = responseData.received_payload?.project_id || responseData.relevance_response?.inputs?.project_id;
    
    console.log('🔍 Checking for echo:', {
      topLevel: { project_id: !!responseData.project_id, script: !!responseData.script, script_text: !!responseData.script_text },
      nested: { received_payload: !!responseData.received_payload, relevance_response: !!responseData.relevance_response }
    });
    
    if (hasTopLevelEcho || hasNestedEcho) {
      console.error('🚨🚨🚨 ECHO DETECTED! RelevanceAI returned input data instead of job info');
      console.error('Response data:', responseData);
      
      const errorResponse = { 
        success: false,
        error: 'AGENT_NOT_TRIGGERED',
        message: 'RelevanceAI agent did not start - it just echoed your input back',
        details: 'The agent is misconfigured. You are using a WEBHOOK URL instead of the API TRIGGER.\n\nIn RelevanceAI dashboard:\n1. Go to Settings → API & Tools\n2. Enable "API Trigger" (not webhook)\n3. Use the API trigger endpoint, not the webhook endpoint\n4. The callback URL should point to: https://bcuhyyyerxwgkrkbrqbs.supabase.co/functions/v1/ai-director-callback',
        responseReceived: responseData
      };
      
      console.log('📤 Returning error response:', errorResponse);
      
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if we got a proper job/execution ID back
    const hasJobId = responseData.job_id || responseData.execution_id || responseData.studio_id;
    if (!hasJobId) {
      console.warn('⚠️  RelevanceAI response lacks job_id/execution_id - agent may not have started');
      console.warn('Response keys:', Object.keys(responseData));
      
      return new Response(JSON.stringify({ 
        success: false,
        error: 'NO_JOB_ID_RETURNED',
        message: 'RelevanceAI accepted the request but did not return a job ID',
        details: 'The agent appears to accept triggers but is not properly configured. Please verify:\n1. Agent is DEPLOYED (not draft)\n2. API trigger is ENABLED in agent settings\n3. Callback webhook is configured to call your ai-director-callback function',
        responseReceived: responseData
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    console.log('✅ RelevanceAI agent triggered successfully with job ID:', hasJobId);
    
    return new Response(JSON.stringify({ 
      success: true,
      agent_id: NEW_AGENT_ID,
      project_id: project_id,
      job_id: hasJobId,
      response: responseData
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error in trigger-relevance:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
