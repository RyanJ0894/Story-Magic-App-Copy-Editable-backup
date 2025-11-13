// supabase/functions/ai-director/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
const DIRECTOR_TRIGGER_URL = Deno.env.get("DIRECTOR_TRIGGER_URL") ?? "https://api-bcbe5a.stack.tryrelevance.com/latest/agents/trigger";
const DIRECTOR_API_KEY = Deno.env.get("DIRECTOR_API_KEY") ?? "234084c7-e850-4e25-8a73-103f803cfd41:sk-ODZkNWI5YjItNjMyMS00YTIzLWFlYTItNmIyMTMzM2NhMTE4"; // must be set in Supabase secrets
const AGENT_ID = Deno.env.get("DIRECTOR_AGENT_ID") ?? "f40094cf-ff18-4135-a70d-15a3d240edd9";
const baseHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};
function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...baseHeaders,
      "Content-Type": "application/json"
    }
  });
}
serve(async (req)=>{
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: baseHeaders
    });
  }
  if (req.method !== "POST") {
    return json({
      error: "Method not allowed. Use POST."
    }, 405);
  }
  let userMessage = null;
  const ct = req.headers.get("content-type") ?? "";
  // Parse request body
  if (ct.includes("application/json")) {
    try {
      const body = await req.json();
      if (typeof body?.message === "string" && body.message.trim() !== "") {
        userMessage = body.message;
      } else {
        return json({
          error: 'Invalid JSON. Provide { "message": "..." }.'
        }, 400);
      }
    } catch  {
      return json({
        error: "Invalid JSON body."
      }, 400);
    }
  } else {
    const text = await req.text();
    if (text && text.trim() !== "") {
      userMessage = text;
    } else {
      return json({
        error: "No message found."
      }, 400);
    }
  }
  // Forward request to Relevance trigger API
  try {
    const upstream = await fetch(DIRECTOR_TRIGGER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `${DIRECTOR_API_KEY}`
      },
      body: JSON.stringify({
        message: {
          role: "user",
          content: userMessage
        },
        agent_id: AGENT_ID
      })
    });
    const responseText = await upstream.text();
    console.log("Relevance status:", upstream.status);
    console.log("Relevance body:", responseText);
    return new Response(responseText, {
      status: upstream.status,
      headers: {
        ...baseHeaders,
        "Content-Type": upstream.headers.get("content-type") ?? "application/json"
      }
    });
  } catch (err) {
    return json({
      error: "Failed to reach Relevance trigger.",
      detail: String(err)
    }, 502);
  }
});
