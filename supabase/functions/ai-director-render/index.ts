// supabase/functions/ai-director-render/index.ts
import { serve } from "https://deno.land/std@0.212.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.3";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
};
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
/**
 * Minimal shape check. We assume you've already validated upstream,
 * but this keeps obvious junk out of the queue.
 */ function pullDirectorJson(raw: any): any {
  if (!raw || typeof raw !== "object") return null;
  // allow body to be: { director_json: {...} } OR the director_json itself
  // @ts-ignore
  const dj = raw.director_json ? raw.director_json : raw;
  if (!dj || typeof dj !== "object") return null;
  // very light checks that typical payloads have:
  // @ts-ignore
  if (!dj.music && !dj.ambience && !dj.sfx && !dj.dialogue && !dj.script) {
    return null;
  }
  return dj;
}
serve(async (req)=>{
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders
    });
  }
  try {
    const url = new URL(req.url);
    // ---- GET /poll?id=...  (or /?id=...) ----
    if (req.method === "GET") {
      const id = url.searchParams.get("id");
      if (!id) {
        return new Response(JSON.stringify({
          error: "Missing id query param"
        }), {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders
          }
        });
      }
      const { data, error } = await supabase.from("mix_jobs").select("id, status, output_url, error_text, created_at, updated_at").eq("id", id).maybeSingle();
      if (error) {
        console.error("poll error:", error);
        return new Response(JSON.stringify({
          error: error.message
        }), {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders
          }
        });
      }
      if (!data) {
        return new Response(JSON.stringify({
          error: "Job not found"
        }), {
          status: 404,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders
          }
        });
      }
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      });
    }
    // ---- POST /  enqueue job ----
    if (req.method === "POST") {
      if (!req.headers.get("content-type")?.includes("application/json")) {
        return new Response(JSON.stringify({
          error: "Content-Type must be application/json"
        }), {
          status: 415,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders
          }
        });
      }
      const body = await req.json().catch(()=>null);
      const director_json = pullDirectorJson(body);
      if (!director_json) {
        return new Response(JSON.stringify({
          error: "Invalid director_json. Pass either the object directly, or { director_json: {...} }"
        }), {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders
          }
        });
      }
      const { data, error } = await supabase.from("mix_jobs").insert({
        status: "queued",
        payload_json: director_json,
        output_url: null,
        error_text: null
      }).select("id, status, created_at").single();
      if (error) {
        console.error("enqueue insert error:", error);
        return new Response(JSON.stringify({
          error: error.message
        }), {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders
          }
        });
      }
      const origin = `${url.protocol}//${url.host}`;
      const poll_url = `${origin}/functions/v1/ai-director-render?id=${data.id}`;
      return new Response(JSON.stringify({
        job_id: data.id,
        status: data.status,
        poll_url,
        message: "Enqueued"
      }), {
        status: 202,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      });
    }
    return new Response(JSON.stringify({
      error: "Method not allowed"
    }), {
      status: 405,
      headers: {
        "Allow": "GET, POST, OPTIONS",
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
  } catch (err) {
    console.error("unhandled:", err);
    return new Response(JSON.stringify({
      error: "Unhandled server error"
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
  }
});
