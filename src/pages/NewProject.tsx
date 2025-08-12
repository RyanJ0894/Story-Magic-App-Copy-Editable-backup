// src/pages/NewProject.tsx
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { createProject, runDirector, runAudio } from "../integrations/filmDirectorApi";

// A tiny starter script so the form isn't empty
const DEFAULT_SCRIPT = `EXT. PARK – DAY
NARRATOR: A gentle breeze moves through the trees as Mary and John walk.
MARY: It’s peaceful here.
JOHN: Yeah, let’s keep moving.`;

/**
 * NewProject – simple wizard
 * 1) Creates a row in user_projects
 * 2) Optionally invokes ai-director to get director_json
 * 3) Optionally invokes generate-audio with that director_json
 */
export default function NewProject() {
  const [title, setTitle] = useState("Untitled Project");
  const [script, setScript] = useState(DEFAULT_SCRIPT);

  const [doDirector, setDoDirector] = useState(true);
  const [doAudio, setDoAudio] = useState(false);

  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [projectId, setProjectId] = useState<string>("");

  const [directorJson, setDirectorJson] = useState<any | null>(null);
  const [audioResult, setAudioResult] = useState<any | null>(null);
  const [error, setError] = useState<string>("");

  async function ensureSignedIn() {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw new Error("Please sign in first.");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setStatus("");
    setError("");
    setDirectorJson(null);

    try {
      await ensureSignedIn();

      setStatus("Creating project…");
      const created = await createProject({ title, script });
      setProjectId(created.id);

      let dirJson: any | null = null;
      if (doDirector) {
        setStatus("Analyzing script with AI Director…");
        dirJson = await runDirector(created.id, script);
        setDirectorJson(dirJson);
      }

      if (doAudio) {
        setStatus("Generating audio…");
        const audio = await runAudio(created.id, dirJson ?? []);
        setAudioResult(audio);
      }

      setStatus("All done! You can head to your Dashboard.");
    } catch (err: any) {
      console.error(err);
      setError(err?.message ?? String(err));
      setStatus("Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen max-w-4xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-bold mb-6">Create New Project</h1>

      <form onSubmit={onSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Title</label>
          <input
            className="w-full rounded-md border px-3 py-2 bg-black/20"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="My Project"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Script</label>
          <textarea
            className="w-full h-56 rounded-md border px-3 py-2 bg-black/20"
            value={script}
            onChange={(e) => setScript(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-6">
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={doDirector}
              onChange={(e) => setDoDirector(e.target.checked)}
            />
            <span>Run AI Director (analyze script)</span>
          </label>

          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={doAudio}
              onChange={(e) => setDoAudio(e.target.checked)}
            />
            <span>Generate Audio after analysis</span>
          </label>
        </div>

        <button
          type="submit"
          disabled={busy}
          className="rounded-md px-4 py-2 bg-yellow-400 text-black disabled:opacity-60"
        >
          {busy ? "Working…" : "Create Project"}
        </button>
      </form>

      <div className="mt-8 space-y-3">
        {status && <p className="text-sm opacity-80">Status: {status}</p>}
        {projectId && (
          <p className="text-sm">
            Project ID: <code className="opacity-80">{projectId}</code>{" "}
            (<a className="underline" href="/dashboard">Go to Dashboard</a>)
          </p>
        )}
        {error && <p className="text-red-400 text-sm">Error: {error}</p>}
      </div>

      {directorJson && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-2">Director JSON (preview)</h2>
          <pre className="text-xs bg-black/30 rounded-md p-3 overflow-auto max-h-80">
            {JSON.stringify(directorJson, null, 2)}
          </pre>
        </div>
      )}

      {audioResult && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-2">Audio Result</h2>
          <pre className="text-xs bg-black/30 rounded-md p-3 overflow-auto max-h-80">
            {JSON.stringify(audioResult, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
