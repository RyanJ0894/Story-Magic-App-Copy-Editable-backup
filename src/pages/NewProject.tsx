// src/pages/NewProject.tsx
import { useState, type FormEvent } from "react";
import { createProject, runDirector, runAudio } from "@/integrations/filmDirectorApi";
import { supabase } from "@/integrations/supabase/client";

const DEFAULT_SCRIPT = `EXT. PARK – DAY
NARRATOR: A gentle breeze moves through the trees as Mary and John walk.
MARY: It's peaceful here.
JOHN: Yeah, let's keep moving.`.trim();

export default function NewProject() {
  const [title, setTitle] = useState("Untitled Project");
  const [script, setScript] = useState(DEFAULT_SCRIPT);

  const [doDirector, setDoDirector] = useState(true);
  const [doAudio, setDoAudio] = useState(false);

  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [projectId, setProjectId] = useState("");
  const [directorJson, setDirectorJson] = useState<any[] | null>(null);
  const [error, setError] = useState("");

  async function ensureSignedIn() {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    if (!data.user) throw new Error("Please sign in first.");
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
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
        setStatus("Analyzing script (AI Director)...");
        const dj = await runDirector(id, script);
        setDirectorJson(dj);
      }

      if (doAudio) {
        setStatus("Generating audio…");
        await runAudio(projectId || id, directorJson ?? undefined);
      }

      setStatus("Done!");
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Something went wrong");
      setStatus("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-10 space-y-6">
      <h1 className="text-3xl font-semibold">Create New Project</h1>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm mb-1">Title</label>
          <input
            className="w-full rounded-md bg-neutral-900 border border-neutral-700 px-3 py-2"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Project title"
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Script</label>
          <textarea
            className="w-full h-48 rounded-md bg-neutral-900 border border-neutral-700 px-3 py-2"
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
            <span>Run AI Director</span>
          </label>

          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={doAudio}
              onChange={(e) => setDoAudio(e.target.checked)}
            />
            <span>Generate Audio</span>
          </label>
        </div>

        <button
          type="submit"
          disabled={busy}
          className="rounded-md bg-gradient-to-r from-yellow-400 to-blue-500 px-4 py-2 font-medium disabled:opacity-60"
        >
          {busy ? "Working…" : "Create Project"}
        </button>
      </form>

      {status && <p className="text-sm text-blue-400">{status}</p>}
      {projectId && <p className="text-sm">Project ID: <code>{projectId}</code></p>}
      {error && <p className="text-sm text-red-400">{error}</p>}

      {directorJson && (
        <div className="mt-6">
          <h2 className="text-xl mb-2">Director JSON</h2>
          <pre className="text-xs bg-neutral-900 border border-neutral-700 p-3 rounded-md overflow-auto">
            {JSON.stringify(directorJson, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
