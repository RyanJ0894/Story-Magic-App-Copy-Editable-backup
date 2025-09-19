// supabase/functions/upload-director-knowledge/index.ts
import OpenAI from "npm:openai";
Deno.serve(async (req)=>{
  try {
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    const vectorStoreId = Deno.env.get("DIRECTOR_VECTOR_STORE_ID");
    if (!apiKey) return new Response(JSON.stringify({
      error: "Missing OPENAI_API_KEY"
    }), {
      status: 400
    });
    if (!vectorStoreId) return new Response(JSON.stringify({
      error: "Missing DIRECTOR_VECTOR_STORE_ID"
    }), {
      status: 400
    });
    const openai = new OpenAI({
      apiKey
    });
    // Expect multipart/form-data with a field named "file"
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return new Response(JSON.stringify({
        error: "Upload a file in form field 'file'"
      }), {
        status: 400
      });
    }
    // Attach directly to vector store
    const attached = await openai.beta.vectorStores.files.create(vectorStoreId, {
      file
    } // Deno's File is compatible
    );
    return new Response(JSON.stringify({
      success: true,
      file_id: attached.id
    }), {
      headers: {
        "Content-Type": "application/json"
      }
    });
  } catch (e) {
    return new Response(JSON.stringify({
      success: false,
      error: String(e)
    }), {
      status: 500
    });
  }
});
