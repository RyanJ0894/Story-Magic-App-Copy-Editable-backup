// src/pages/NewProject.tsx
import PdfToText from "@/components/PdfToText";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { createProject, runAudio } from "@/integrations/filmDirectorApi";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { useDirector } from "@/hooks/useDirector";

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
  const { toast } = useToast();
  const [title, setTitle] = useState("Untitled Project");
  const [script, setScript] = useState(DEFAULT_SCRIPT);

  const [doDirector, setDoDirector] = useState(true);
  const [doAudio, setDoAudio] = useState(false);

  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [projectId, setProjectId] = useState<string>("");

  const [audioResult, setAudioResult] = useState<any | null>(null);
  const [error, setError] = useState<string>("");
  const [generatingAudio, setGeneratingAudio] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string>("");

  // Use the new director hook
  const {
    directorJson,
    waitingForDirector,
    directorError,
    triggerDirector,
    handleDirectorComplete,
    clearDirectorData
  } = useDirector();

  async function ensureSignedIn() {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw new Error("Please sign in first.");
  }

  async function handleGenerateAudio() {
    try {
      setGeneratingAudio(true);
      setStatus("Generating audio...");
      setError("");

      // Show loading toast
      toast({
        title: "Audio Generation Started",
        description: "Converting your story to audio... This may take a few moments.",
        variant: "default",
        duration: 3000
      });

      if (!projectId) {
        const errorMsg = "No project id. Create a project first.";
        setError(errorMsg);
        setGeneratingAudio(false);
        toast({
          title: "Error",
          description: errorMsg,
          variant: "destructive"
        });
        return;
      }
      if (!directorJson) {
        const errorMsg = "No director JSON available. Run AI Director first.";
        setError(errorMsg);
        setGeneratingAudio(false);
        toast({
          title: "Error", 
          description: errorMsg,
          variant: "destructive"
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke("generate-audio", {
        body: { project_id: projectId, director: directorJson },
      });

      if (error) {
        const errorMsg = error.message || "Edge function error";
        setStatus("Audio generation failed");
        setError(errorMsg);
        setGeneratingAudio(false);
        toast({
          title: "Audio Generation Failed",
          description: errorMsg,
          variant: "destructive"
        });
        return;
      }

      const ok = !!data?.merged_audio?.success && !!data?.merged_audio?.audio_url;
      if (!ok) {
        const errorMsg = data?.merged_audio?.message || "No audio_url returned";
        setStatus("Audio generation failed");
        setError(errorMsg);
        setGeneratingAudio(false);
        toast({
          title: "Audio Generation Failed",
          description: errorMsg,
          variant: "destructive"
        });
        return;
      }

      // success
      setAudioUrl(data.merged_audio.audio_url);
      setAudioResult(data);
      setStatus("Audio generated successfully");
      setError("");
      toast({
        title: "Audio Generation Complete",
        description: "Your story has been successfully converted to audio!",
        variant: "default"
      });
    } catch (e: any) {
      const errorMsg = e?.message || String(e);
      setStatus("Audio generation failed");
      setError(errorMsg);
      toast({
        title: "Audio Generation Error",
        description: errorMsg,
        variant: "destructive"
      });
    } finally {
      setGeneratingAudio(false);
    }
  }

  function downloadAudio() {
    if (!audioUrl) return;
    const link = document.createElement("a");
    link.href = audioUrl;
    link.download = "story-magic.mp3";
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Real-time listener for AI Director updates
  useEffect(() => {
    if (!projectId) return;

    async function loadProjectData() {
      try {
        const { data, error } = await supabase
          .from("user_projects")
          .select("audio_url, ai_director_json")
          .eq("id", projectId)
          .maybeSingle();

        if (error) throw error;

        if (data?.audio_url) {
          setAudioUrl(data.audio_url);
          setAudioResult({ success: true, public_url: data.audio_url });
        }

        if (data?.ai_director_json) {
          handleDirectorComplete(data.ai_director_json);
        }
      } catch (err) {
        console.error("Failed to load project data:", err);
      }
    }

    loadProjectData();

    // Set up real-time subscription for ai_director_json updates
    const channel = supabase
      .channel('project-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_projects',
          filter: `id=eq.${projectId}`
        },
        (payload) => {
          console.log('Project updated:', payload);
          const newData = payload.new as any;
          
          if (newData.ai_director_json) {
            // Check if it's an error
            if (typeof newData.ai_director_json === 'object' && newData.ai_director_json.error) {
              setError(newData.ai_director_json.error);
              setStatus("AI Director analysis failed.");
              toast({
                title: "AI Director Failed",
                description: "AI Director analysis failed: " + newData.ai_director_json.error,
                variant: "destructive"
              });
            } else {
              // Success
              handleDirectorComplete(newData.ai_director_json);
              setError("");
              setStatus("AI Director analysis completed!");
              toast({
                title: "AI Director Complete",
                description: "Director analysis has been generated successfully!",
                variant: "default"
              });
              
              // Auto-generate audio if doAudio was checked
              if (doAudio) {
                handleAutoGenerateAudio(newData.ai_director_json, projectId);
              }
            }
          }

          if (newData.audio_url) {
            setAudioUrl(newData.audio_url);
            setAudioResult({ success: true, public_url: newData.audio_url });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, toast, doAudio]);

  // Handle director status changes with toasts
  useEffect(() => {
    if (waitingForDirector) {
      toast({
        title: "AI Director Analysis Started",
        description: "Analyzing your script... This may take a few moments.",
        variant: "default",
        duration: 3000
      });
    }
  }, [waitingForDirector, toast]);

  useEffect(() => {
    if (directorJson && !waitingForDirector) {
      toast({
        title: "AI Director Analysis Complete",
        description: "Your script has been successfully analyzed!",
        variant: "default"
      });
    }
  }, [directorJson, waitingForDirector, toast]);

  useEffect(() => {
    if (directorError) {
      toast({
        title: directorError.includes("timeout") ? "Analysis Timeout" : "AI Director Analysis Failed",
        description: directorError,
        variant: "destructive"
      });
    }
  }, [directorError, toast]);

  // Auto-generate audio when director JSON is ready
  async function handleAutoGenerateAudio(dirJson: any, projId: string) {
    try {
      setStatus("Generating audio…");
      
      toast({
        title: "Auto Audio Generation Started",
        description: "Converting your story to audio automatically...",
        variant: "default",
        duration: 3000
      });

      const audio = await runAudio(projId, dirJson);
      if (audio.merged_audio?.success && audio.merged_audio?.audio_url) {
        setAudioUrl(audio.merged_audio.audio_url);
        setAudioResult(audio);
        setStatus("Audio generated successfully! Redirecting to project…");
        
        toast({
          title: "Auto Audio Generation Complete",
          description: "Your story has been converted to audio! Redirecting...",
          variant: "default"
        });
        
        setTimeout(() => navigate(`/projects/${projId}`), 1500);
      } else {
        throw new Error(audio.merged_audio?.message || "Audio generation failed");
      }
    } catch (audioErr: any) {
      console.error("Audio generation failed:", audioErr);
      setError(audioErr?.message ?? String(audioErr));
      setStatus("Project created, but audio generation failed.");
      
      toast({
        title: "Auto Audio Generation Failed",
        description: audioErr?.message ?? "Failed to generate audio automatically",
        variant: "destructive"
      });
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(false);
    setStatus("");
    setError("");
    clearDirectorData();

    try {
      await ensureSignedIn();

      setStatus("Creating project…");
      const created = await createProject(title, script);
      setProjectId(created.id);

      if (doDirector) {
        setStatus("Starting AI Director analysis…");
        toast({
          title: "AI Director Started",
          description: "Processing your script... This may take a few moments.",
          variant: "default",
          duration: 3000
        });
        await triggerDirector(created.id, script);
        setStatus("AI Director analysis in progress…");
      }

      // Auto-run audio generation if checked - will be handled by real-time listener
      if (doAudio && !doDirector) {
        // If not running director but want audio, show message
        setStatus("Please enable AI Director to generate audio automatically.");
      } else if (!doDirector) {
        setStatus("Project created successfully! You can head to your Dashboard.");
      }
      // If doDirector is true, the real-time listener will handle next steps
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
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-2">
              Title
            </label>
            <input
              id="title"
              className="w-full rounded-md border px-3 py-2 bg-black/20"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="My Project"
            />
          </div>

          {/* PDF upload helper — shows Replace/Append, then fills the Script box */}
          <div className="mb-2">
            <PdfToText
              onText={(txt: string, mode: "replace" | "append" = "replace") => {
                if (mode === "replace") {
                  setScript(txt);
                } else {
                  setScript((prev) => (prev ? `${prev}\n\n${txt}` : txt));
                }
              }}
            />
          </div>

          {/* Script textarea */}
          <div>
            <label htmlFor="script" className="block text-sm font-medium mb-2">
              Script
            </label>
            <Textarea
              id="script"
              rows={14}
              placeholder="Paste your script here, or upload a PDF above…"
              value={script}
              onChange={(e) => setScript(e.target.value)}
            />
          </div>

          {/* Options */}
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

        {/* Status / IDs / Errors */}
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

        {/* Director JSON preview + manual Generate Audio */}
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

        {/* Audio player & download */}
        {audioUrl && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Generated Audio</h2>

            <div className="bg-black/30 rounded-md p-4 space-y-4">
              <audio controls src={audioUrl} className="w-full">
                Your browser does not support the audio element.
              </audio>

              <Button
                onClick={() => downloadAudio()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
              >
                <Download className="h-4 w-4" />
                Download MP3
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
