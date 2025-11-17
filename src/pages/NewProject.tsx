import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useNewProject } from "@/features/projects/hooks/useNewProject";
import { useSimpleProduction } from "@/features/projects/hooks/useSimpleProduction";
import { ProjectForm } from "@/features/projects/components/ProjectForm";
import { ProjectFormData } from "@/features/projects/components/ProjectForm/schema";
import { ScriptPlaybackView } from "@/features/projects/components/ScriptPlaybackView";
import { useAuth } from "@/features/auth/auth";
import { toast } from "sonner";

export default function NewProject() {
  const navigate = useNavigate();
  const { data: currentUser, isLoading: authLoading } = useAuth();
  const [projectId, setProjectId] = useState<string | null>(null);
  const [submittedScript, setSubmittedScript] = useState<string>("");
  const [showPlaybackView, setShowPlaybackView] = useState(false);

  const { createProject, isCreating } = useNewProject();
  const production = useSimpleProduction();

  // Debug logging for auth state
  useEffect(() => {
    console.log('🔐 Auth state:', { 
      currentUser: currentUser?.id, 
      authLoading, 
      isCreating, 
      isProcessing: production.isProcessing 
    });
  }, [currentUser, authLoading, isCreating, production.isProcessing]);

  const handleProjectSubmit = async (data: ProjectFormData) => {
    if (!currentUser) {
      toast.error("User must be authenticated to create a project");
      return;
    }

    try {
      // Save the script for playback view
      setSubmittedScript(data.script);
      
      // Step 1: Create project in database
      const project = await createProject({
        title: data.title,
        script: data.script,
        user_id: currentUser.id,
      });

      setProjectId(project.id);

      // Step 2: Start audio production
      await production.processProduction(data.script, project.id);
    } catch (error) {
      console.error("Failed to create project:", error);
      toast.error("Failed to create project");
    }
  };

  // Show playback view if audio is ready
  if (production.audioUrl && submittedScript && showPlaybackView) {
    return (
      <ScriptPlaybackView
        script={submittedScript}
        audioUrl={production.audioUrl}
        onBack={() => setShowPlaybackView(false)}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Create New Project</h1>

      {/* Development Debug Panel */}
      {import.meta.env.DEV && (
        <div className="mb-6 p-4 bg-muted border border-border rounded text-xs font-mono">
          <p className="font-semibold mb-2">🔍 Debug Info</p>
          <p>Auth: {authLoading ? 'Loading...' : currentUser ? `✅ ${currentUser.id.slice(0, 8)}...` : '❌ Not logged in'}</p>
          <p>Project ID: {projectId || 'None'}</p>
          <p>Processing: {production.isProcessing ? `Yes - ${production.step}` : 'No'}</p>
          {projectId && (
            <a 
              href={`https://supabase.com/dashboard/project/bcuhyyyerxwgkrkbrqbs/logs/edge-functions`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline mt-2 inline-block hover:opacity-80"
            >
              📋 View Supabase Logs
            </a>
          )}
        </div>
      )}

      {/* Show production status */}
      {production.isProcessing && (
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
          <h2 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Processing...</h2>
          <p className="text-blue-700 dark:text-blue-300">{production.step}</p>
          <div className="mt-3 animate-pulse bg-blue-200 dark:bg-blue-700 h-2 rounded"></div>
        </div>
      )}

      {/* Show success with playback button */}
      {production.audioUrl && (
        <div className="mb-6 p-6 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
          <h2 className="font-semibold text-green-900 dark:text-green-100 mb-4 text-xl">
            ✅ Production Complete!
          </h2>

          <p className="text-green-700 dark:text-green-300 mb-4">
            Your audio has been generated successfully. Click below to view the script with synchronized playback.
          </p>

          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => setShowPlaybackView(true)}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-md hover-elevate active-elevate-2 font-medium"
              data-testid="button-view-playback"
            >
              🎬 View Script Playback
            </button>
            <a
              href={production.audioUrl}
              download
              className="px-6 py-3 bg-secondary text-secondary-foreground rounded-md hover-elevate active-elevate-2 font-medium inline-block"
              data-testid="link-download-audio"
            >
              Download Audio
            </a>
            <button
              onClick={() => navigate("/dashboard")}
              className="px-6 py-3 bg-muted text-muted-foreground rounded-md hover-elevate active-elevate-2 font-medium"
              data-testid="button-dashboard"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      )}

      {/* Show error if failed */}
      {production.error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
          <h2 className="font-semibold text-red-900 dark:text-red-100 mb-2">
            ❌ Production Failed
          </h2>
          <p className="text-red-700 dark:text-red-300">{production.error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            data-testid="button-retry"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Project creation form */}
      <ProjectForm
        onSubmit={handleProjectSubmit}
        isSubmitting={authLoading || isCreating || production.isProcessing}
      />
    </div>
  );
}
