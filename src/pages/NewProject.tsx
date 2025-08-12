// src/pages/NewProject.tsx
import { useState } from "react";
import { createProject, runDirector, runAudio } from "@/integrations/filmDirectorApi";
import { supabase } from "@/integrations/supabase/client";

const DEFAULT_SCRIPT = `EXT. PARK — DAY

NARRATOR: A gentle breeze moves through the trees as Mary and John walk.
MARY: It's peaceful here.
JOHN: Yeah, let's keep moving.`

export default function NewProject() {
  const [title, setTitle] = useState("Untitled Project");
  const [script, setScript] = useState(DEFAULT_SCRIPT);
  const [doDirector, setDoDirector] = useState(true);
  const [doAudio, setDoAudio] = useState(false);

  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
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
      const pid = await createProject({ title, script });
      setProjectId(pid);

      if (doDirector) {
        setStatus("Analyzing script with AI Director…");
        const json = await runDirector(pid, script);
        setDirectorJson(json);
      }

      if (doAudio) {
        setStatus("Generating audio…");
        await runAudio(projectId || pid, directorJson || undefined);
      }

      setStatus("All done! You can return to the dashboard.");
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Unexpected error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container mx-auto max-w-3xl p-6 space-y-6">
      <h1 className="text-2xl font-bold">New Project</h1>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium">Title</label>
          <input
            className="w-full rounded-md border bg-transparent p-2"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Project title"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Script</label>
          <textarea
            className="w-full h-56 rounded-md border bg-transparent p-2 font-mono text-sm"
            value={script}
            onChange={(e) => setScript(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={doDirector}
              onChange={(e) => setDoDirector(e.target.checked)}
            />
            Run AI Director (JSON)
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={doAudio}
              onChange={(e) => setDoAudio(e.target.checked)}
            />
            Generate audio
          </label>
        </div>

        <button
          type="submit"
          disabled={busy}
          className="rounded-md bg-yellow-400 px-4 py-2 font-semibold text-black disabled:opacity-50"
        >
          {busy ? "Working…" : "Create"}
        </button>
      </form>

      {!!status && <p className="text-sm text-blue-400">{status}</p>}
      {!!error && <p className="text-sm text-red-400">{error}</p>}

      {!!projectId && (
        <div className="text-sm">
          <div className="opacity-70">Project ID</div>
          <code className="break-all">{projectId}</code>
        </div>
      )}

      {!!directorJson && (
        <div className="space-y-2">
          <div className="opacity-70">Director JSON</div>
          <pre className="max-h-80 overflow-auto rounded-md border p-3 text-xs">
            {JSON.stringify(directorJson, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
