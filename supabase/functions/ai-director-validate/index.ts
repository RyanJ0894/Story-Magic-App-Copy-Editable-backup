// functions/ai-director-validate/index.ts
// Validates composite JSON (lines + director_json) against catalogs,
// then forwards to ai-director-callback (no auth assumptions; callback will accept).
// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const CATALOG_BUCKET = Deno.env.get("CATALOG_BUCKET") ?? "story-magic-assets";
const CATALOG_PATH = Deno.env.get("CATALOG_PATH") ?? "ai_director_catalogs.v2.json";
const CALLBACK_URL = Deno.env.get("CALLBACK_URL") ?? ""; // if empty -> no forward
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
function cors() {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-allow-headers": "authorization, x-client-info, apikey, content-type",
    "content-type": "application/json"
  };
}
async function loadCatalogs() {
  const { data, error } = await supabase.storage.from(CATALOG_BUCKET).download(CATALOG_PATH);
  if (error) throw new Error(`Catalog download failed: ${error.message}`);
  const text = await data.text();
  const json = JSON.parse(text);
  if (!json?.catalogs?.music || !json?.catalogs?.ambience || !json?.catalogs?.sfx) {
    throw new Error("Catalog shape invalid (missing catalogs.music/ambience/sfx)");
  }
  return json.catalogs;
}
function makeIdSets(cats) {
  return {
    music: new Set(cats.music.map((x)=>x.id)),
    ambience: new Set(cats.ambience.map((x)=>x.id)),
    sfx: new Set(cats.sfx.map((x)=>x.id))
  };
}
const TIME_RE = /^\d{2}:\d{2}:\d{2}\.\d{3}$/;
const WHEN = new Set([
  "enter",
  "swell",
  "duck",
  "out"
]);
function validate(body, ids) {
  const errs = [];
  if (!body || typeof body !== "object") errs.push("Body must be a JSON object.");
  if (!Array.isArray(body.lines)) errs.push("Missing or invalid 'lines' (must be an array).");
  if (!body.director_json || typeof body.director_json !== "object") errs.push("Missing or invalid 'director_json'.");
  if (Array.isArray(body.lines)) {
    for (const [i, line] of body.lines.entries()){
      if (!line || typeof line !== "object") {
        errs.push(`lines[${i}] not an object`);
        continue;
      }
      if (line.type !== "narration" && line.type !== "dialogue") errs.push(`lines[${i}].type must be "narration" or "dialogue"`);
      if (typeof line.text !== "string" || !line.text.trim()) errs.push(`lines[${i}].text must be a non-empty string`);
      if (line.type === "dialogue" && (!line.character || !String(line.character).trim())) {
        errs.push(`lines[${i}].character required for dialogue`);
      }
    }
  }
  const dj = body.director_json ?? {};
  const checkArr = (arr, label)=>{
    if (!Array.isArray(arr)) return;
    for (const [i, it] of arr.entries()){
      if (!it || typeof it !== "object") {
        errs.push(`${label}[${i}] not an object`);
        continue;
      }
      if (!it.id || typeof it.id !== "string") errs.push(`${label}[${i}].id missing or not a string`);
      if (!it.time || !TIME_RE.test(it.time)) errs.push(`${label}[${i}].time must be hh:mm:ss.mmm`);
      if (label === "music" && it.when && !WHEN.has(it.when)) errs.push(`${label}[${i}].when invalid (enter|swell|duck|out)`);
      const set = label === "music" ? ids.music : label === "ambience" ? ids.ambience : ids.sfx;
      if (it.id && !set.has(it.id)) errs.push(`${label}[${i}].id not found in ${label} catalog: ${it.id}`);
    }
  };
  checkArr(dj.music, "music");
  checkArr(dj.ambience, "ambience");
  checkArr(dj.sfx, "sfx");
  // Allow predictable top-level keys (+ project_id passthrough)
  for (const k of Object.keys(body)){
    if (k !== "lines" && k !== "director_json" && k !== "meta" && k !== "project_id") {
      errs.push(`Unexpected top-level key: ${k}`);
    }
  }
  return errs;
}
async function maybeForward(project_id, payload) {
  if (!CALLBACK_URL) return {
    forwarded: false
  };
  const res = await fetch(CALLBACK_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({
      project_id,
      lines: payload.lines,
      director_json: payload.director_json
    })
  });
  const text = await res.text();
  return {
    forwarded: true,
    callback_status: res.status,
    callback_body: text
  };
}
Deno.serve(async (req)=>{
  if (req.method === "OPTIONS") return new Response(null, {
    headers: cors()
  });
  try {
    const incoming = await req.json();
    const composite = incoming.agent_response ?? incoming;
    const project_id = incoming.project_id ?? composite.project_id;
    const catalogs = await loadCatalogs();
    const ids = makeIdSets(catalogs);
    const errs = validate(composite, ids);
    if (errs.length) {
      return new Response(JSON.stringify({
        ok: false,
        errors: errs
      }), {
        status: 400,
        headers: cors()
      });
    }
    const forwarded = await maybeForward(project_id, composite);
    return new Response(JSON.stringify({
      ok: true,
      ...forwarded
    }), {
      headers: cors()
    });
  } catch (e) {
    return new Response(JSON.stringify({
      ok: false,
      error: String(e)
    }), {
      status: 500,
      headers: cors()
    });
  }
});
