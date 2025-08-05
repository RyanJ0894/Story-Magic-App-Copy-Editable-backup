import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");

export const ELEVENLABS_VOICE_MAP = {
  "Older Male – Calm (American)": "iiidtqDt9FBdT1vfBluA",
  "Older Male – Friendly (African American)": "NOpBlnGInO9m6vDvFkFC",
  "Older Male – Southern (American)": "tp4cRlXymyN4yXXo3DYv",
  "Older Male – Southern 2 (American)": "yW0E1QYarnD3WCLTdWuX",
  "Older Male – Wise (American)": "Vv4DE9DtUpdmwjp7ucgc",
  "Older Male – Deep (American)": "1muICAxikLeZXeIglHdH",
  "Older Male – Energetic (American)": "Vnuyx38AQEZgAlsJN8mB",
  "Older Male – Southern (African American)": "1G9Ya1Fy4Ju2EAKyjGYJ",
  "Older Male – Stern (American)": "00y4m1PbCBtjIPrwiynB",

  "Female 20s-30s – Polished (American)": "xZVrOjUURog02K298cjt",
  "Female 20s-30s – Calm (American)": "XhNlP8uwiH6XZSFnH1yL",
  "Female 20s-30s – Calm (New Yorker)": "C3x1TEM7scV4p2AXJyrp",
  "Female 20s-30s – Caring (American)": "uYXf8XasLslADfZ2MB4u",
  "Female 20s-30s – Smooth (American)": "WAhoMTNdLdMoq1j3wf3I",
  "Female 20s-30s – Southern (Southern American)": "S2fYVrVpl5QYHVJ1LkgT",
  "Female 20s-30s – Soft (American)": "ccczwhcFl5t2kkNhz4Xg",
  "Female 20s-30s – Southern (African American)": "4D9Pkpgb8u9YXb1E2jKB",
  "Female 20s-30s – Southern 2 (American)": "LElbsnORyWdRipDG9D4D",
  "Female 20s-30s – Southern 3 (American)": "cnPPy2dWDNfzwhzvZ3CJ",
  "Female 20s-30s – Calm 2 (American)": "vr5WKaGvRWsoaX5LCVax",
  "Female 20s-30s – Breathy (British)": "5BkEaSrc8SxSp7cOflae",
  "Female Teen – Playful (American)": "bMxLr8fP6hzNRRi9nJxU",
  "Female Teen – Bubbly (American)": "wrxvN1LZJIfL3HHvffqe",
  "Female Teen – Calm (American)": "T7eLpgAAhoXHlrNajG8v",
  "Female Teen – Energetic (American)": "JGwmRZcgvck23cD2TuYq",
  "Female Teen – Breathy (American)": "4amdp26YcC12p4g0caal",
  "Female Teen – Chill (American)": "PV8O5l7QO8ZTd5Rln7Z5",
  "Female Teen – Breathy (African American)": "2bIeDnqItemdU7o6zCwq",
  "Female Teen – Raspy (American)": "Djjbjv1y8TG5IpNX5YAK",
  "Female Teen – Raspy 2 (American)": "VmeYJ8yn9LbQxhPAl5wO",
  "Female Teen – Calm 2 (American)": "dP9ClfrTRIUt2zMBr00W",

  "Female Under 10 – Soft (American)": "jLreTVzdmVFjzOZ4f2Jx",
  "Female Under 10 – Soft 2 (American)": "TkSyBjII8TcWww0CSouI",

  "Male 20s-30s – Energetic (American)": "PSqRw3ln34TxQZrTS6Wt",
  "Male 20s-30s – Deep (African American)": "mcuuWJIofmzgKEGk3EMA",
  "Male 20s-30s – Casual (American)": "Yy9hdn23JDNfhVPIWlHY",
  "Male 20s-30s – Calm (African American)": "1RVpBInY9YUYMLSUQReV",
  "Male 20s-30s – Warm (African American)": "XvfwInXiPC6BcAjGWhmS",
  "Male 20s-30s – Energetic 2 (American)": "MWYZAv88R6kW8dvZNtvU",
  "Male 20s-30s – Smooth (British)": "JRt8VLagGlOd5Vi5tMfX",
  "Male 20s-30s – Chill (American)": "m9Ul0apeWDFimb3H9yGY",
  "Male 20s-30s – Southern (American)": "Tm4QO7PzRBQqp7MSSl5w",
  "Male 20s-30s – Raspy (Hispanic American)": "k1SgXRmVVqpFcQpNU1ou",
  "Male Teen – Stylish (African American)": "DTKMou8ccj1ZaWGBiotd",
  "Male Teen – Deep (American)": "3XOBzXhnDY98yeWQ3GdM",
  "Male Teen – Chill (American)": "Pb8RZcHs3ga4StE7wiPM",
  "Male Teen – Chill 2 (American Midwestern)": "FIsP50cHv9JY47BkNVR7",
  "Male Teen – Smooth (African American)": "iRR5JQNuSp2XN7iF7jPL",
  "Male Teen – Chill 3 (American)": "BFnAlAvxDrOEsXlGCLZ2",
  "Male Teen – Chill 4 (African American)": "QEDAiBNESWY7Es1bu9HY",
  "Male Teen – Raspy (American)": "AtHOGgML51i4RHBVD0le",
  "Male Teen – Breathy (American)": "ZhLVlARQZoYYz5GikrfB",
  "Male Teen – Breathy 2 (American)": "ciopqvYA9WYw3xOGbodX",

  "Male Under 10 – Soft (American)": "RnC1vV4hTIG6mpspiNMw",
  "Male Under 10 – Soft 2 (American)": "OzETXvniP8ZpkhCsvTBQ",

  "Narrator – Calm (British)": "L0Dsvb3SLTyegXwtm47J",
  "Narrator – Calm (American)": "uju3wxzG5OhpWcoi3SMy",
  "Narrator – Clear and Crisp (American)": "XjLkpWUlnhS8i7gGz3lZ",
  "Narrator – Calm 2 (British)": "AeRdCCKzvd23BpJoofzx",
  "Narrator – Warm (British)": "L1aJrPa7pLJEyYlh3Ilq",
  "Narrator – Smooth (British, Female)": "wJqPPQ618aTW29mptyoc",
  "Narrator – Smooth 2 (British, Female)": "RILOU7YmBhvwJGDGjNmP",
  "Narrator – Deep (American)": "e5WNhrdI30aXpS2RSGm1",
  "Narrator – Warm (New Zealand, Female)": "pcKdPWtbF6bM9o7NHjCI",

  "Older Female – Southern (African American)": "XxY7LfDr5SzeemL30EAJ",
  "Older Female – Raspy (African American)": "lIgS04i5awvulQMifXvy",
  "Older Female – Southern (American)": "xMZOFuTAHKtUd0aelHvM",
  "Older Female – Wise (American)": "Mh8UZv56BYw5HLxsvw5K",
  "Older Female – Wise 2 (American)": "loP8wMysfD4AP5kifsuy",
  "Older Female – Wise 3 (American)": "dvw9ITErgRa9TX7AkMgx",
  "Older Female – Comforting (African American)": "4eC0mcIIjlMstsKu8fMF",
  "Older Female – Wise 4 (American)": "AFDn1vVPITHRYD7x7GhG",
  "Older Female – Comforting (American)": "Blpxl6Q79PMW6Pr2PNq1",
  "Older Female – Southern 2 (American)": "zUZjZwPQKfsRlH9QVPnK",
};

serve(async (req) => {
  const { project_id } = await req.json();

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: project, error } = await supabaseClient
    .from("user_projects")
    .select("ai_director_json, user_id")
    .eq("id", project_id)
    .single();

  if (error || !project || !project.ai_director_json) {
    return new Response(JSON.stringify({ error: "Missing AI Director JSON." }), { status: 400 });
  }

  const lines = project.ai_director_json.lines;
  const audioBuffers: Uint8Array[] = [];

  for (const line of lines) {
    const voiceId = ELEVENLABS_VOICE_MAP[line.voice] || ELEVENLABS_VOICE_MAP["Narrator – Calm (British)"];

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        text: line.text,
        model_id: "eleven_monolingual_v1",
        voice_settings: {
          stability: 0.3,
          similarity_boost: 0.8
        }
      })
    });

    const arrayBuffer = await response.arrayBuffer();
    audioBuffers.push(new Uint8Array(arrayBuffer));
  }

  const finalAudio = audioBuffers.reduce((acc, cur) => {
    const combined = new Uint8Array(acc.length + cur.length);
    combined.set(acc, 0);
    combined.set(cur, acc.length);
    return combined;
  });

  const fileName = `generated/${project_id}/final_audio_${Date.now()}.mp3`;

  const { error: uploadError } = await supabaseClient.storage
    .from("user-files")
    .upload(fileName, finalAudio.buffer, {
      contentType: "audio/mpeg",
      upsert: true
    });

  if (uploadError) {
    return new Response(JSON.stringify({ error: "Upload failed", details: uploadError }), { status: 500 });
  }

  await supabaseClient
    .from("user_projects")
    .update({ audio_url: fileName })
    .eq("id", project_id);

  return new Response(JSON.stringify({ success: true, audio_url: fileName }), {
    headers: { "Content-Type": "application/json" },
    status: 200
  });
});
