import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useNewProject } from "@/features/projects/hooks/useNewProject";
import { useSimpleProduction } from "@/features/projects/hooks/useSimpleProduction";
import { ProjectForm } from "@/features/projects/components/ProjectForm";
import { ProjectFormData } from "@/features/projects/components/ProjectForm/schema";
import { useAuth } from "@/features/auth/auth";
import { toast } from "sonner";
import { ChunkProgress } from "@/features/projects/components/ChunkProgress";
import ScreenplayPlayer from "@/features/scripts/components/ScreenplayPlayer";
import AudioPlayer from "@/features/scripts/components/AudioPlayer";
import { useScriptPlayerControls } from "@/features/scripts/hooks/useScriptPlayerControls";
import type { ChunkProgressData } from "@/features/projects/project-chunk.type";

export default function NewProject() {
  const navigate = useNavigate();
  const { data: currentUser, isLoading: authLoading } = useAuth();
  const [projectId, setProjectId] = useState<string | null>(null);
  const [loadedChunks, setLoadedChunks] = useState<ChunkProgressData[]>([]);
  const [script, setScript] = useState<string>("");

  const { createProject, isCreating } = useNewProject();
  const production = useSimpleProduction();

  const duration = loadedChunks.reduce((total, chunk) => {
    const chunkDuration = chunk.lines.reduce((sum, line) => sum + (line.duration || 0), 0);
    return total + chunkDuration;
  }, 0) || 60;

  const {
    currentTime,
    isPlaying,
    handleSeek,
    handlePlayPause,
  } = useScriptPlayerControls({ duration });

  useEffect(() => {
    console.log('Auth state:', { 
      currentUser: currentUser?.id, 
      authLoading, 
      isCreating, 
      isProcessing: production.isProcessing 
    });
  }, [currentUser, authLoading, isCreating, production.isProcessing]);

  const handleChunksChange = (chunks: ChunkProgressData[]) => {
    console.log('Chunks loaded:', chunks.length);
    setLoadedChunks(chunks);
  };

  const handleProjectSubmit = async (data: ProjectFormData) => {
    if (!currentUser) {
      toast.error("User must be authenticated to create a project");
      return;
    }

    try {
      setScript(data.script);
      
      const project = await createProject({
        title: data.title,
        script: data.script,
        user_id: currentUser.id,
      });

      setProjectId(project.id);

      await production.processProduction(data.script, project.id);
    } catch (error) {
      console.error("Failed to create project:", error);
      toast.error("Failed to create project");
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Create New Project</h1>

      {import.meta.env.DEV && (
        <div className="mb-6 p-4 bg-muted border border-border rounded text-xs font-mono">
          <p className="font-semibold mb-2">Debug Info</p>
          <p>Auth: {authLoading ? 'Loading...' : currentUser ? `${currentUser.id.slice(0, 8)}...` : 'Not logged in'}</p>
          <p>Project ID: {projectId || 'None'}</p>
          <p>Processing: {production.isProcessing ? `Yes - ${production.step}` : 'No'}</p>
          {projectId && (
            <a 
              href={`https://supabase.com/dashboard/project/bcuhyyyerxwgkrkbrqbs/logs/edge-functions`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline mt-2 inline-block"
            >
              View Supabase Logs
            </a>
          )}
        </div>
      )}

      {production.isProcessing && (
        <div className="mb-6 p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
          <h2 className="font-semibold text-blue-300 mb-2">Processing...</h2>
          <p className="text-blue-200">{production.step}</p>
          <div className="mt-3 animate-pulse bg-blue-700 h-2 rounded"></div>
        </div>
      )}

      {production.audioUrl && projectId && (
        <div className="mb-6 space-y-4">
          <div className="p-4 bg-green-900/20 border border-green-700 rounded-lg">
            <h2 className="font-semibold text-green-300 mb-2">
              Production Complete!
            </h2>
            <div className="flex gap-3">
              <a
                href={production.audioUrl}
                download
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                data-testid="link-download-audio"
              >
                Download Audio
              </a>
              <button
                onClick={() => navigate("/dashboard")}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                data-testid="button-go-dashboard"
              >
                Go to Dashboard
              </button>
            </div>
          </div>

          <ChunkProgress
            projectId={projectId}
            script={script}
            onChunksChange={handleChunksChange}
          />

          {loadedChunks.length > 0 && (
            <>
              <AudioPlayer
                chunks={loadedChunks}
                currentTime={currentTime}
                isPlaying={isPlaying}
              />
              
              <ScreenplayPlayer
                chunks={loadedChunks}
                currentTime={currentTime}
                isPlaying={isPlaying}
                duration={duration}
                onSeek={handleSeek}
                onPlayPause={handlePlayPause}
              />
            </>
          )}
        </div>
      )}

      {production.error && (
        <div className="mb-6 p-4 bg-red-900/20 border border-red-700 rounded-lg">
          <h2 className="font-semibold text-red-300 mb-2">
            Production Failed
          </h2>
          <p className="text-red-200">{production.error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            data-testid="button-try-again"
          >
            Try Again
          </button>
        </div>
      )}

      <ProjectForm
        onSubmit={handleProjectSubmit}
        isSubmitting={authLoading || isCreating || production.isProcessing}
      />
    </div>
  );
}
