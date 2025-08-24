
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  console.log('🚀 AI Director Callback: Request received');
  console.log('📋 Method:', req.method);
  console.log('🌐 URL:', req.url);
  console.log('📡 Headers:', JSON.stringify([...req.headers.entries()]));
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('✅ Handling CORS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Log raw request details
    const contentType = req.headers.get('content-type');
    console.log('📄 Content-Type:', contentType);
    
    let requestBody;
    try {
      const rawBody = await req.text();
      console.log('📝 Raw request body:', rawBody);
      
      if (rawBody) {
        requestBody = JSON.parse(rawBody);
        console.log('🔍 Parsed request body:', JSON.stringify(requestBody, null, 2));
      } else {
        console.log('⚠️  Empty request body received');
        requestBody = {};
      }
    } catch (parseError) {
      console.error('❌ Error parsing request body:', parseError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid JSON in request body',
          details: parseError.message
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { project_id, director_json } = requestBody;
    
    console.log('🎯 Extracted project_id:', project_id);
    console.log('🎬 Extracted director_json:', JSON.stringify(director_json, null, 2));

    // Validate required parameters
    if (!project_id) {
      console.log('❌ Missing project_id parameter');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required parameter: project_id',
          received_body: requestBody
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!director_json) {
      console.log('❌ Missing director_json parameter');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required parameter: director_json',
          received_body: requestBody
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('🔍 Attempting to update project in database...');
    
    // Update the project with the director JSON
    const { data, error } = await supabase
      .from('user_projects')
      .update({ 
        ai_director_json: JSON.stringify(director_json),
        updated_at: new Date().toISOString()
      })
      .eq('id', project_id)
      .select();

    if (error) {
      console.error('❌ Database update error:', error);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to update project',
          details: error.message,
          project_id: project_id
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('✅ Database update successful:', data);

    // Success response
    const successResponse = {
      success: true,
      message: 'Director JSON successfully received and stored',
      project_id: project_id,
      timestamp: new Date().toISOString(),
      updated_records: data?.length || 0
    };

    console.log('🎉 Sending success response:', JSON.stringify(successResponse, null, 2));

    return new Response(
      JSON.stringify(successResponse),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('💥 Unexpected error in ai-director-callback:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error',
        details: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
