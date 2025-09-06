// src/pages/Index.tsx
import { useEffect, useMemo, useState } from "react";

// --- your existing sections (keep these imports as-is) ---
import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { ScriptUpload } from "@/components/ScriptUpload";
import { VoiceCasting } from "@/components/VoiceCasting";
import { AudioPlayer } from "@/components/AudioPlayer";
import { FeedbackForm } from "@/components/FeedbackForm";

// --- integrations you already have ---
import { supabase } from "@/integrations/supabase/client";
import { getDirectorJSON, generateAudio } from "@/integrations/filmDirectorApi";

// Utility: try different orders safely without crashing if column doesn't exist
async function selectLatestProjectId(userId: string | null) {
  if (!userId) {
    throw new Error("User must be authenticated to access projects");
  }

  const base = supabase.from("user_projects").select("id, created_at", { head: false });
  const scoped = base.eq("user_id", userId);

  // Try common timestamp columns in order; if error, fall back to a plain select
  const orders = [
    { column: "created_at", ascending: false },
    { column: "inserted_at", ascending: false },
    { column: "updated_at", ascending: false },
  ];

  for (const o of orders) {
    const { data, error } = await scoped.order(o.column as any, { ascending: o.ascending }).limit(1);
    if (!error && data && data.length > 0) return data[0].id as string;
  }

  // Fallback: no order, just grab one row
  const { data } = await scoped.limit(1);
  if (data && data.length > 0) return data[0].id as string;

  return null;
}

function AIDirectorDebugPanel() {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [autoProjectId, setAutoProjectId] = useState<string | null>(null);
  const [manualProjectId, setManualProjectId] = useState<string>("");

  const [directorOut, setDirectorOut] = useState<any>(null);
  const [audioOut, setAudioOut] = useState<any>(null);

  const defaultScript = useMemo(
    () =>
      `EXT. PARK – DAY
NARRATOR: A gentle breeze moves through the trees as Mary and John walk.
MARY: It’s peaceful here.
JOHN: Yeah, let’s keep moving.`,
    []
  );
  const [script, setScript] = useState<string>(defaultScript);

  // Try to auto-resolve (or create) a project on mount
  useEffect(() => {
    let mounted = true;

    (async () => {
      setStatus("Resolving project…");
      setErrorMsg(null);

      try {
        // 1) Get auth user (must be authenticated)
        const { data: auth } = await supabase.auth.getUser();
        const userId = auth?.user?.id;

        if (!userId) {
          if (mounted) {
            setStatus(null);
            setErrorMsg("Please sign in to access your projects.");
          }
          return;
        }

        // 2) Try to find the latest project for this user (or any if no user)
        let projectId = await selectLatestProjectId(userId);

        // 3) If none found or selection blocked by RLS, try to create one
        if (!projectId) {
          const { data: inserted, error: insertErr } = await supabase
            .from("user_projects")
            .insert([{ user_id: userId, title: "Untitled Project", status: "draft" }])
            .select("id")
            .single();

          if (!insertErr && inserted?.id) {
            projectId = inserted.id as string;
          }
        }

        if (mounted) {
          if (projectId) {
            setAutoProjectId(projectId);
            setStatus("Project ready.");
          } else {
            setStatus(null);
            setErrorMsg(
              "Couldn’t auto-resolve a project (RLS or empty table). Paste a project_id below or sign in."
            );
          }
        }
      } catch (err: any) {
        if (mounted) {
          setStatus(null);
          setErrorMsg(err?.message ?? "Failed to resolve project.");
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const effectiveProjectId = autoProjectId || manualProjectId || "";

  async function runPipeline() {
    setBusy(true);
    setStatus("Running AI Director → Audio…");
    setErrorMsg(null);
    setDirectorOut(null);
    setAudioOut(null);

    try {
      if (!effectiveProjectId) {
        throw new Error("No project_id available. Paste one or let the app create it.");
      }

      // 1) Analyze with AI Director
      const director = await getDirectorJSON(script, effectiveProjectId);
      setDirectorOut(director);

      // 2) Generate audio
      const audio = await generateAudio(effectiveProjectId, director);
      setAudioOut(audio);

      setStatus("Done.");
    } catch (err: any) {
      console.error("Pipeline error:", err);
      setErrorMsg(err?.message ?? "Something went wrong. Check console for details.");
      setStatus(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 mt-12">
      <h2 className="text-xl font-semibold mb-4">AI Director Debug Panel</h2>

      {status && <p className="text-sm mb-3 opacity-80">{status}</p>}
      {errorMsg && <p className="text-sm mb-3 text-red-400">{errorMsg}</p>}

      {autoProjectId ? (
        <div className="mb-4">
          <div className="text-sm opacity-80 mb-1">Resolved Project</div>
          <div className="text-xs break-all font-mono rounded-lg bg-black/20 border border-white/10 px-3 py-2">
            {autoProjectId}
          </div>
          <button
            onClick={async () => {
              setStatus("Refreshing project…");
              setErrorMsg(null);
              setAutoProjectId(null);
              setManualProjectId("");
              setDirectorOut(null);
              setAudioOut(null);
              // re-run the auto-resolve flow
              const { data: auth } = await supabase.auth.getUser();
              const userId = auth?.user?.id;
              if (!userId) {
                setErrorMsg("Please sign in to access your projects.");
                return;
              }
              let pid = await selectLatestProjectId(userId);
              if (!pid) {
                const { data: inserted } = await supabase
                  .from("user_projects")
                  .insert([{ user_id: userId, title: "Untitled Project", status: "draft" }])
                  .select("id")
                  .single();
                pid = inserted?.id ?? null;
              }
              if (pid) {
                setAutoProjectId(pid);
                setStatus("Project ready.");
              } else {
                setStatus(null);
                setErrorMsg("Couldn’t resolve or create a project automatically.");
              }
            }}
            className="mt-2 inline-flex items-center rounded-xl px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-sm"
          >
            Refresh Project
          </button>
        </div>
      ) : (
        <div className="mb-4">
          <label className="block text-sm mb-1">Project ID (UUID)</label>
          <input
            className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2"
            placeholder="Paste a user_projects.id UUID"
            value={manualProjectId}
            onChange={(e) => setManualProjectId(e.target.value)}
          />
        </div>
      )}

      <label className="block text-sm mb-1 mt-4">Script</label>
      <textarea
        className="w-full min-h-[160px] rounded-lg border border-white/10 bg-black/20 px-3 py-2 mb-4"
        value={script}
        onChange={(e) => setScript(e.target.value)}
      />

      <button
        onClick={runPipeline}
        disabled={busy || !effectiveProjectId}
        className="inline-flex items-center rounded-xl px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50"
      >
        {busy ? "Running…" : "Run (analyze script → generate audio)"}
      </button>

      {directorOut && (
        <div className="mt-6">
          <h3 className="font-semibold mb-2">Director JSON</h3>
          <pre className="whitespace-pre-wrap text-xs rounded-xl bg-black/30 p-4 border border-white/10 overflow-auto">
            {JSON.stringify(directorOut, null, 2)}
          </pre>
        </div>
      )}

      {audioOut && (
        <div className="mt-6">
          <h3 className="font-semibold mb-2">Audio Response</h3>
          <pre className="whitespace-pre-wrap text-xs rounded-xl bg-black/30 p-4 border border-white/10 overflow-auto">
            {JSON.stringify(audioOut, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

const Index = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main>
        <HeroSection />
        <section className="container mx-auto px-4 py-8 md:py-16 space-y-8 md:space-y-16">
          <ScriptUpload />
          <VoiceCasting />
          <AudioPlayer />
          <FeedbackForm />

          {/* Auto-resolving debug panel - hidden on mobile to save space */}
          <div className="hidden md:block">
            <AIDirectorDebugPanel />
          </div>
        </section>
      </main>
    </div>
  );
};

export default Index;
