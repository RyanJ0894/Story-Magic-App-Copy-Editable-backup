import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  console.log('🚀🚀🚀 AI Director Callback: Request received at', new Date().toISOString());
  console.log('📋 Method:', req.method);
  console.log('🌐 URL:', req.url);
  console.log('🔍 User-Agent:', req.headers.get('user-agent'));
  console.log('📡 ALL Headers:', JSON.stringify([...req.headers.entries()], null, 2));

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('✅ Handling CORS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  // Add a simple health check
  if (req.method === 'GET') {
    console.log('📍 Health check requested');
    return new Response(JSON.stringify({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      function: 'ai-director-callback'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
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
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid JSON in request body',
        details: parseError instanceof Error ? parseError.message : 'Unknown error'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { project_id, director_json } = requestBody;
    console.log('🎯 Extracted project_id:', project_id);
    console.log('🎬 Extracted director_json:', JSON.stringify(director_json, null, 2));

    // Validate required parameters
    if (!project_id) {
      console.log('❌ Missing project_id parameter');
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required parameter: project_id',
        received_body: requestBody
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!director_json) {
      console.log('❌ Missing director_json parameter');
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required parameter: director_json',
        received_body: requestBody
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Validate director_json structure
    if (!director_json.scenes || !Array.isArray(director_json.scenes)) {
      console.log('⚠️  director_json missing scenes array');
      return new Response(JSON.stringify({
        success: false,
        error: 'director_json must contain a scenes array',
        received_structure: Object.keys(director_json)
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('🔍 Inserting director JSON into database...');
    console.log('📊 Director JSON has', director_json.scenes.length, 'scenes');
    
    // Insert into director_json table (JSONB type - pass object directly)
    const { data, error } = await supabase
      .from('director_json')
      .insert({
        project_id: project_id,     // TEXT type
        json_data: director_json    // JSONB type - store as object
      })
      .select();

    if (error) {
      console.error('❌ Database insert error:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to insert director JSON into database',
        details: error
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('✅ Director JSON inserted successfully into database');
    console.log('📊 Inserted data:', JSON.stringify(data, null, 2));

    // Return success response
    return new Response(JSON.stringify({
      success: true,
      message: 'Director JSON saved successfully',
      project_id: project_id,
      scenes_count: director_json.scenes.length
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Unexpected error in ai-director-callback:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
