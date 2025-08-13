// src/pages/NewProject.tsx
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Film, ArrowLeft, Download } from "lucide-react";
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
  const navigate = useNavigate();
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
  const [generatingAudio, setGeneratingAudio] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string>("");

  async function ensureSignedIn() {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw new Error("Please sign in first.");
  }

  async function handleGenerateAudio() {
    if (!projectId || !directorJson) return;
    
    setGeneratingAudio(true);
    setError("");
    
    try {
      setStatus("Generating audio…");
      const audio = await runAudio(projectId, directorJson);
      setAudioResult(audio);
      
      if (audio.success && audio.audio_url) {
        // Update database with audio URL and status
        await supabase
          .from("user_projects")
          .update({ 
            audio_url: audio.audio_url,
            status: "ready"
          })
          .eq("id", projectId);
        
        setAudioUrl(audio.audio_url);
        setStatus("Audio generated successfully!");
      } else {
        throw new Error(audio.message || "Audio generation failed");
      }
    } catch (err: any) {
      console.error("Audio generation failed:", err);
      setError(err?.message ?? String(err));
      setStatus("Audio generation failed.");
    } finally {
      setGeneratingAudio(false);
    }
  }

  function downloadAudio() {
    if (!audioUrl) return;
    
    const link = document.createElement('a');
    link.href = `data:audio/wav;base64,${audioUrl}`;
    link.download = 'story-magic.wav';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Load existing project data if we have a project ID
  useEffect(() => {
    if (!projectId) return;
    
    async function loadProjectData() {
      try {
        const { data, error } = await supabase
          .from("user_projects")
          .select("audio_url, status")
          .eq("id", projectId)
          .single();
          
        if (error) throw error;
        
        if (data?.audio_url) {
          setAudioUrl(data.audio_url);
          setAudioResult({ success: true, audio_url: data.audio_url });
        }
      } catch (err) {
        console.error("Failed to load project data:", err);
      }
    }
    
    loadProjectData();
  }, [projectId]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setStatus("");
    setError("");
    setDirectorJson(null);

    try {
      await ensureSignedIn();

      setStatus("Creating project…");
      const created = await createProject(title, script);
      setProjectId(created.id);

      let dirJson: any | null = null;
      if (doDirector) {
        setStatus("Analyzing script with AI Director…");
        dirJson = await runDirector(created.id, script);
        setDirectorJson(dirJson);
      }

      // Auto-run audio generation if checked
      if (doAudio && dirJson) {
        await handleGenerateAudio();
        setStatus("Redirecting to project…");
        setTimeout(() => navigate(`/projects/${created.id}`), 1500);
      } else {
        setStatus("All done! You can head to your Dashboard.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message ?? String(err));
      setStatus("Something went wrong.");
      
      // Update project status to error if we have a project ID
      if (projectId) {
        try {
          await supabase
            .from("user_projects")
            .update({ ai_director_json: JSON.stringify({ error: err?.message ?? String(err) }) })
            .eq("id", projectId);
        } catch (updateErr) {
          console.error("Failed to update project with error status:", updateErr);
        }
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-lg">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <img 
              src="/lovable-uploads/2a81761c-efdc-4094-9e5d-f297e2f44571.png" 
              alt="Story Magic" 
              className="h-28"
            />
          </Link>
          
          <Link 
            to="/dashboard" 
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-10">
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
          
          {!doAudio && !audioResult && (
            <button
              onClick={handleGenerateAudio}
              disabled={generatingAudio || !projectId}
              className="mt-4 rounded-md px-4 py-2 bg-yellow-400 text-black disabled:opacity-60 flex items-center gap-2"
            >
              {generatingAudio ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  Generating Audio...
                </>
              ) : (
                "Generate Audio"
              )}
            </button>
          )}
        </div>
      )}

      {audioResult && audioUrl && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Generated Audio</h2>
          
          <div className="bg-black/30 rounded-md p-4 space-y-4">
            <audio 
              controls 
              className="w-full"
              src={`data:audio/wav;base64,${audioUrl}`}
            >
              Your browser does not support the audio element.
            </audio>
            
            <button
              onClick={downloadAudio}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
            >
              <Download className="h-4 w-4" />
              Download WAV
            </button>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
