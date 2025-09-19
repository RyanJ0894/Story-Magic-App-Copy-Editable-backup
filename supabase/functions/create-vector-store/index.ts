// supabase/functions/create-vector-store/index.ts
import OpenAI from "npm:openai";
Deno.serve(async ()=>{
  try {
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({
        error: "Missing OPENAI_API_KEY"
      }), {
        status: 400
      });
    }
    const openai = new OpenAI({
      apiKey
    });
    const vs = await openai.vectorStores.create({
      name: "Story Magic – Director Knowledge"
    });
    return new Response(JSON.stringify({
      success: true,
      vector_store_id: vs.id,
      name: vs.name
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
