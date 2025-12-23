import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useNewProject } from "@/features/projects/hooks/useNewProject";
import { useSimpleProduction } from "@/features/projects/hooks/useSimpleProduction";
import { ProjectForm } from "@/features/projects/components/ProjectForm";
import { ProjectFormData } from "@/features/projects/components/ProjectForm/schema";
import { useAuth } from "@/features/auth/auth";
import { toast } from "sonner";
import ScreenplayPlayer from "@/features/scripts/components/ScreenplayPlayer";
import AudioPlayer from "@/features/scripts/components/AudioPlayer";
import { useScriptPlayerControls } from "@/features/scripts/hooks/useScriptPlayerControls";
import { Input } from "@/components/ui/input";
import { Pencil, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { projectApi } from "@/features/projects/services/projectApi";

export default function NewProject() {
  const navigate = useNavigate();
  const { data: currentUser, isLoading: authLoading } = useAuth();
  const [projectId, setProjectId] = useState<string | null>(null);
  const [projectTitle, setProjectTitle] = useState<string>("Untitled Project");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");

  const { createProject, isCreating } = useNewProject();
  const production = useSimpleProduction();

  const {
    currentTime,
    isPlaying,
    duration,
    handleSeek,
    handlePlayPause,
    handleTimeUpdate,
    handleDurationChange,
    handleEnded,
  } = useScriptPlayerControls();

  const handleProjectSubmit = async (data: ProjectFormData) => {
    if (!currentUser) {
      toast.error("User must be authenticated to create a project");
      return;
    }

    try {
      const project = await createProject({
        title: data.title,
        script: data.script,
        user_id: currentUser.id,
      });

      setProjectId(project.id);
      setProjectTitle(data.title);

      const result = await production.processProduction(data.script, project.id);
      
      if (result?.public_url) {
        try {
          await projectApi.updateProjectAudioUrl(project.id, result.public_url);
          console.log('✅ Saved audio URL to project:', result.public_url);
        } catch (saveError) {
          console.error('Failed to save audio URL to project:', saveError);
        }
      }
    } catch (error) {
      console.error("Failed to create project:", error);
      toast.error("Failed to create project");
    }
  };

  const handleTitleEdit = () => {
    setEditedTitle(projectTitle);
    setIsEditingTitle(true);
  };

  const handleTitleSave = async () => {
    if (!projectId || !editedTitle.trim()) return;
    
    try {
      const { error } = await supabase
        .from('projects')
        .update({ title: editedTitle.trim() })
        .eq('id', projectId);
      
      if (error) throw error;
      
      setProjectTitle(editedTitle.trim());
      setIsEditingTitle(false);
      toast.success("Title updated");
    } catch (error) {
      console.error("Failed to update title:", error);
      toast.error("Failed to update title");
    }
  };

  // Memoized shimmer particles for magical background
  const shimmerParticles = useMemo(() => {
    return Array.from({ length: 35 }, (_, i) => ({
      id: i,
      x: (i * 17 + 7) % 100,
      y: (i * 23 + 11) % 100,
      delay: (i * 0.3) % 3,
      duration: 1.5 + (i % 5) * 0.5,
      opacity: 0.3 + (i % 7) * 0.1,
    }));
  }, []);

  return (
    <div className="min-h-screen bg-background relative">
      {/* Magical Background Layer */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {/* Illuminated gradient spots - gold on left, blue on right */}
        <div className="absolute -top-20 -left-[100px] sm:left-[10%] w-[350px] sm:w-[600px] h-[350px] sm:h-[600px] bg-amber-500/60 sm:bg-amber-500/50 rounded-full blur-[100px] sm:blur-[120px]" />
        <div className="absolute top-1/3 -right-[50px] sm:right-[5%] w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-blue-500/55 sm:bg-blue-500/45 rounded-full blur-[80px] sm:blur-[100px]" />
        <div className="absolute bottom-1/4 -left-[80px] sm:left-[20%] w-[280px] sm:w-[450px] h-[280px] sm:h-[450px] bg-blue-400/50 sm:bg-blue-400/40 rounded-full blur-[90px] sm:blur-[110px]" />
        
        {/* Shimmer particles - fixed positions with glow */}
        {shimmerParticles.map((particle) => (
          <div
            key={particle.id}
            className="absolute w-1.5 h-1.5 bg-white rounded-full animate-pulse"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              animationDelay: `${particle.delay}s`,
              animationDuration: `${particle.duration}s`,
              opacity: particle.opacity + 0.2,
              boxShadow: '0 0 6px 2px rgba(255, 255, 255, 0.6)',
            }}
          />
        ))}
      </div>
      
      <div className="max-w-4xl mx-auto px-3 sm:px-6 py-6 sm:py-10 relative z-10">
      {production.isProcessing && !production.audioUrl && (
        <div className="mb-6 p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
          <h2 className="font-semibold text-blue-300 mb-2">Processing...</h2>
          <p className="text-blue-200">{production.step}</p>
          <div className="mt-3 animate-pulse bg-blue-700 h-2 rounded"></div>
        </div>
      )}

      {production.audioUrl && (
        <div className="mb-6 space-y-4">
          <div className="p-4 bg-sky-900/20 border border-sky-700 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold text-sky-300">
                Production Complete!
              </h2>
            </div>
            <div className="flex items-center gap-2 mb-3">
              {isEditingTitle ? (
                <>
                  <Input
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    className="max-w-xs bg-background/50"
                    data-testid="input-edit-title"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleTitleSave();
                      if (e.key === 'Escape') setIsEditingTitle(false);
                    }}
                    autoFocus
                  />
                  <Button size="icon" variant="ghost" onClick={handleTitleSave} data-testid="button-save-title">
                    <Check className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <>
                  <span className="text-lg font-medium text-foreground">{projectTitle}</span>
                  <Button size="icon" variant="ghost" onClick={handleTitleEdit} data-testid="button-edit-title">
                    <Pencil className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
            <div className="flex gap-3 flex-wrap">
              <a
                href={production.audioUrl}
                download
                className="px-4 py-2 bg-sky-600 text-white rounded hover:bg-sky-700"
                data-testid="link-download-audio"
              >
                Download Audio
              </a>
              <button
                onClick={() => navigate("/dashboard")}
                className="px-4 py-2 bg-slate-600 text-white rounded hover:bg-slate-700"
                data-testid="button-go-dashboard"
              >
                Go to Dashboard
              </button>
            </div>
          </div>

          {production.audioUrl && (
            <AudioPlayer
              audioUrl={production.audioUrl}
              isPlaying={isPlaying}
              currentTime={currentTime}
              onTimeUpdate={handleTimeUpdate}
              onDurationChange={handleDurationChange}
              onPlayPause={handlePlayPause}
              onEnded={handleEnded}
            />
          )}
          
          {production.chunks.length > 0 && projectId && (
            <ScreenplayPlayer
              chunks={production.chunks}
              currentTime={currentTime}
              isPlaying={isPlaying}
              duration={duration}
              onSeek={handleSeek}
              onPlayPause={handlePlayPause}
              onRegenerateAudio={async (voiceAssignments) => {
                const result = await production.regenerateWithVoices(projectId, voiceAssignments);
                if (result?.public_url) {
                  try {
                    await projectApi.updateProjectAudioUrl(projectId, result.public_url);
                    console.log('✅ Saved regenerated audio URL to project:', result.public_url);
                  } catch (saveError) {
                    console.error('Failed to save audio URL to project:', saveError);
                  }
                }
              }}
              isRegenerating={production.isProcessing}
            />
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

      {!production.audioUrl && (
        <ProjectForm
          onSubmit={handleProjectSubmit}
          isSubmitting={authLoading || isCreating || production.isProcessing}
        />
      )}
      </div>
    </div>
  );
}
