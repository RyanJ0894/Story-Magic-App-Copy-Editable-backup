// src/pages/NewProject.tsx
import { useState } from "react";
import { createProject, runDirector, runAudio } from "@/integrations/filmDirectorApi";
import { supabase } from "@/integrations/supabase/client";

const DEFAULT_SCRIPT = `EXT. PARK — DAY

NARRATOR: A gentle breeze moves through the trees as Mary and John walk.
MARY: It’s peaceful here.
JOHN: Yeah, let’s keep moving.`

export default function NewProject() {
  const [title, setTitle] = useState("Untitled Project");
  const [script, setScript] = useState(DEFAULT_SCRIPT);
  const [doDirector, setDoDirector] = useState(true);
  const [doAudio, setDoAudio] = useState(false);

  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [projectId, setProjectId] = useState<string>("");
  const [directorJson, setDirectorJson] = useState<any>(null);
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
      const id = await createProject({ title, script });
      setProjectId(id);

      if (doDirector) {
        setStatus("Analyzing script with AI Director…");
        const dj = await runDirector({ projectId: id, script });
        setDirectorJson(dj);
      }

      if (doAudio) {
        setStatus("Generating audio…");
        const res = await runAudio({
          projectId: id,
          directorJSON: directorJson,
        });
        setStatus(`Audio job started: ${JSON.stringify(res)}`);
      }

      setStatus("Done!");
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <h1 className="text-3xl font-bold">New Project</h1>

      <form onSubmit={onSubmit} className="grid gap-6 max-w-3xl">
        <label className="grid gap-2">
          <span className="font-medium">Title</span>
          <input
            className="border rounded px-3 py-2 bg-background"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={busy}
          />
        </label>

        <label className="grid gap-2">
          <span className="font-medium">Script</span>
          <textarea
            className="border rounded px-3 py-2 min-h-[180px] bg-background"
            value={script}
            onChange={(e) => setScript(e.target.value)}
            disabled={busy}
          />
        </label>

        <div className="flex items-center gap-6">
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={doDirector}
              onChange={(e) => setDoDirector(e.target.checked)}
              disabled={busy}
            />
            <span>Analyze with AI Director</span>
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={doAudio}
              onChange={(e) => setDoAudio(e.target.checked)}
              disabled={busy}
            />
            <span>Generate audio after analysis</span>
          </label>
        </div>

        <button
          type="submit"
          disabled={busy}
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50"
        >
          {busy ? "Working…" : "Create"}
        </button>
      </form>

      {/* Status + Errors */}
      {status && <p className="text-sm text-muted-foreground">Status: {status}</p>}
      {error && <p className="text-sm text-red-500">Error: {error}</p>}

      {/* Output preview */}
      {projectId && (
        <div className="border rounded p-4">
          <h2 className="font-semibold mb-2">Project Created</h2>
          <p className="text-sm break-all">id: {projectId}</p>
        </div>
      )}

      {directorJson && (
        <div className="border rounded p-4">
          <h2 className="font-semibold mb-2">Director JSON</h2>
          <pre className="text-xs whitespace-pre-wrap">
            {JSON.stringify(directorJson, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
