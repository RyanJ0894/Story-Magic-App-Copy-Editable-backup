import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    const vectorStoreId = Deno.env.get("DIRECTOR_VECTOR_STORE_ID");
    
    if (!apiKey) {
      return new Response(JSON.stringify({
        error: "Missing OPENAI_API_KEY"
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    if (!vectorStoreId) {
      return new Response(JSON.stringify({
        error: "Missing DIRECTOR_VECTOR_STORE_ID"
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Expect multipart/form-data with a field named "file"
    const form = await req.formData();
    const file = form.get("file");
    
    if (!(file instanceof File)) {
      return new Response(JSON.stringify({
        error: "Upload a file in form field 'file'"
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // First, upload the file to OpenAI
    const uploadForm = new FormData();
    uploadForm.append("file", file);
    uploadForm.append("purpose", "assistants");

    const uploadResponse = await fetch("https://api.openai.com/v1/files", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
      },
      body: uploadForm
    });

    if (!uploadResponse.ok) {
      const error = await uploadResponse.text();
      console.error("File upload error:", error);
      return new Response(JSON.stringify({
        error: `Failed to upload file: ${error}`
      }), {
        status: uploadResponse.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const uploadedFile = await uploadResponse.json();
    console.log("File uploaded:", uploadedFile.id);

    // Then, attach the file to the vector store
    const attachResponse = await fetch(
      `https://api.openai.com/v1/vector_stores/${vectorStoreId}/files`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "OpenAI-Beta": "assistants=v2"
        },
        body: JSON.stringify({
          file_id: uploadedFile.id
        })
      }
    );

    if (!attachResponse.ok) {
      const error = await attachResponse.text();
      console.error("File attachment error:", error);
      return new Response(JSON.stringify({
        error: `Failed to attach file to vector store: ${error}`
      }), {
        status: attachResponse.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const attached = await attachResponse.json();
    console.log("File attached to vector store:", attached.id);

    return new Response(JSON.stringify({
      success: true,
      file_id: attached.id,
      vector_store_file_id: attached.id
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (e) {
    console.error("Error in upload-director-knowledge:", e);
    return new Response(JSON.stringify({
      success: false,
      error: e instanceof Error ? e.message : String(e)
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
