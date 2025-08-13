// src/pages/NewProject.tsx
import { useState } from "react";
import { createProject, runDirector, runAudio } from "@/integrations/filmDirectorApi";
import { supabase } from "@/integrations/supabase/client";

type DirectorScene = {
  scene_id: number;
  character: string;
  dialogue: string;
  voice_style?: string;
  mood?: string;
  background_ambiance?: string;
  background_music?: string;
  mixing_parameters?: Record<string, number | string>;
  status?: string;
};

type DirectorJSON = DirectorScene[];

const DEFAULT_SCRIPT = `EXT. PARK — DAY
NARRATOR: A gentle breeze moves through the trees as Mary and John walk.
MARY: It's peaceful here.
JOHN: Yeah, let's keep moving.`;

// Small helper to ensure the audio string is playable in <audio>
function toDataUrl(audioUrl: string | undefined): string | null {
  if (!audioUrl) return null;
  if (audioUrl.startsWith("http") || audioUrl.startsWith("data:")) return audioUrl;
  return `data:audio/wav;base64,${audioUrl}`;
}

export default function NewProject() {
  const [title, setTitle] = useState("Untitled Project");
  const [script, setScript] = useState(DEFAULT_SCRIPT);

  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const [projectId, setProjectId] = useState<string>("");
  const [directorJson, setDirectorJson] = useState<DirectorJSON | null>(null);

  const [audioBusy, setAudioBusy] = useState(false);
  const [audioResult, setAudioResult] = useState<any | null>(null);

  async function ensureSignedIn() {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw new Error("Please sign in first.");
  }

  async function onCreateProject(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setStatus("Creating project…");
    setDirectorJson(null);
    setAudioResult(null);

    try {
      await ensureSignedIn();

      const project = await createProject({ title, script });
      const newId: string = project?.id || project?.[0]?.id || project?.data?.id;
      if (!newId) throw new Error("Could not get new project id.");
      setProjectId(newId);

      setStatus("Analyzing script with AI Director…");
      const dj = await runDirector(script);
      setDirectorJson(dj);

      setStatus("All done! You can head to your Dashboard.");
    } catch (err: any) {
      setError(err.message || String(err));
      setStatus("");
    } finally {
      setBusy(false);
    }
  }

  async function onGenerateAudio() {
    if (!projectId || !directorJson) return;
    setAudioBusy(true);
    setError("");
    setStatus("Generating audio…");

    try {
      const res = await runAudio(projectId, directorJson);
      setAudioResult(res);
      setStatus("Audio generated successfully!");
    } catch (err: any) {
      setError(err.message || String(err));
      setStatus("");
    } finally {
      setAudioBusy(false);
    }
  }

  const audioUrl = toDataUrl(audioResult?.audio_url);

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Create New Project</h1>
        <a href="/dashboard" className="text-sm text-blue-400 hover:underline">
          ← Back to Dashboard
        </a>
      </div>

      <form onSubmit={onCreateProject} className="space-y-6">
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
            className="w-full h-56 rounded-md bg-neutral-900 border border-neutral-700 px-3 py-2 font-mono text-sm"
            value={script}
            onChange={(e) => setScript(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3">
          <input type="checkbox" checked readOnly className="h-4 w-4" />
          <span className="text-sm">Run AI Director (analyze script)</span>
        </div>

        <button
          type="submit"
          disabled={busy}
          className="inline-flex items-center rounded-md bg-yellow-500 hover:bg-yellow-400 text-black font-medium px-4 py-2 disabled:opacity-60"
        >
          {busy ? "Working…" : "Create Project"}
        </button>
      </form>

      {(status || error) && (
        <div className="mt-4">
          {status && <div className="text-sm text-green-400">{status}</div>}
          {error && <div className="text-sm text-red-400">Error: {error}</div>}
          {projectId && (
            <div className="text-xs text-neutral-400 mt-1">
              Project ID: <span className="font-mono">{projectId}</span>{" "}
              (<a className="underline" href="/dashboard">Go to Dashboard</a>)
            </div>
          )}
        </div>
      )}

      {/* Director JSON preview */}
      {directorJson && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold mb-2">Director JSON (preview)</h2>
          <div className="rounded-md border border-neutral-700 bg-black/40">
            <pre className="overflow-auto p-3 text-xs leading-relaxed">
              {JSON.stringify(directorJson, null, 2)}
            </pre>
          </div>

          {/* Generate Audio button (only after analysis) */}
          <div className="mt-4">
            <button
              onClick={onGenerateAudio}
              disabled={audioBusy}
              className="inline-flex items-center rounded-md bg-yellow-500 hover:bg-yellow-400 text-black font-medium px-4 py-2 disabled:opacity-60"
            >
              {audioBusy ? "Generating…" : "Generate Audio"}
            </button>
          </div>
        </section>
      )}

      {/* Audio result + player */}
      {audioResult && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold mb-2">Audio</h2>

          {audioUrl ? (
            <div className="space-y-3">
              <audio controls className="w-full" src={audioUrl}>
                Your browser does not support audio playback.
              </audio>
              <div>
                <a
                  href={audioUrl}
                  download={(projectId || "story-magic") + ".wav"}
                  className="rounded-md bg-neutral-800 hover:bg-neutral-700 px-3 py-2 text-sm"
                >
                  Download .wav
                </a>
              </div>
            </div>
          ) : (
            <div className="text-sm text-red-400">
              Couldn’t build a playable URL from the response.
            </div>
          )}

          <div className="mt-4 rounded-md border border-neutral-700 bg-black/40">
            <pre className="overflow-auto p-3 text-xs leading-relaxed">
              {JSON.stringify(audioResult, null, 2)}
            </pre>
          </div>
        </section>
      )}
    </div>
  );
}
