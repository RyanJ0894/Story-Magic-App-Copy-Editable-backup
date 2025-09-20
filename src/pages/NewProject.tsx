// src/pages/NewProject.tsx
import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";

// Feature imports
import { useProjectCreate } from "@/features/project/hooks/useProjectCreate";
import { useChunkProductionFixed } from "@/features/project/hooks/useChunkProductionFixed";
import { useChunkPolling } from "@/features/project/hooks/useChunkPolling";
import ProjectForm from "@/features/project/components/ProjectForm";
import ProjectOptions from "@/features/project/components/ProjectOptions";
import ProjectStatus from "@/features/project/components/ProjectStatus";
import type { ChunkRef } from "@/features/project/hooks/useChunkLoaderProduction";
import React from "react";
import ScriptPlayer from "@/features/scripts/components/ScriptPlayer";
import AudioPlayer from "@/features/scripts/components/AudioPlayer";
import ChunkProgressBar from "@/features/timeline/components/ChunkProgressBar";

interface ProjectFormData {
  title: string;
  script: string;
  doDirector: boolean;
  doAudio: boolean;
}

export default function NewProject() {
  const { register, handleSubmit, watch, formState: { errors } } = useForm<ProjectFormData>({
    defaultValues: {
      title: "Untitled Project",
      script: `EXT. PARK – DAY
NARRATOR: A gentle breeze moves through the trees as Mary and John walk.
MARY: It's peaceful here.
JOHN: Yeah, let's keep moving.`,
      doDirector: true,
      doAudio: false
    }
  });

  const watchedValues = watch();

  // Project state
  const [projectId, setProjectId] = useState<string>("");
  
  // Timeline playback state
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(30);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Project creation hook
  const { createProject, isCreating, error: createError } = useProjectCreate();

  // Chunk production hook (2-step process)
  const { 
    chunks: projectChunks, 
    isLoadingChunks, 
    createChunks,
    isCreatingChunks,
    processChunks,
    isProcessingChunks,
    createError: chunkCreateError,
    processError: chunkProcessError
  } = useChunkProductionFixed(projectId);

  const {
    chunks: polledChunks,
    pendingChunks,
    processingChunks,
    completedChunks,
    errorChunks,
    totalChunks,
    completedCount,
    errorCount
  } = useChunkPolling(projectId, !!projectId);

  const loadedChunks = completedChunks.map(chunk => ({
    chunk_id: chunk.chunk_key,
    project_id: chunk.project_id,
    scene_title: chunk.scene_title,
    version: chunk.version,
    director_notes: chunk.director_notes || "",
    lines: chunk.lines || [],
    audio_direction: chunk.audio_direction || { music: [], ambience: [], sfx: [] }
  }));

  const chunkRefs: ChunkRef[] = React.useMemo(() => 
    polledChunks.map(chunk => ({
      chunk_id: chunk.chunk_key,
      scene_title: chunk.scene_title,
      order: chunk.chunk_index,
      start: chunk.start,
      duration: chunk.duration
    })), [polledChunks]
  );

  const chunkStates = polledChunks.map(chunk => ({
    chunkId: chunk.chunk_key,
    isLoading: chunk.status === 'processing',
    data: chunk.status === 'done' ? chunk : undefined,
    error: chunk.status === 'error' ? `Chunk ${chunk.chunk_key} failed` : undefined
  }));


  const onSubmit = async (data: ProjectFormData) => {
    try {
      const project = await createProject({ title: data.title, script: data.script });
      setProjectId(project.id);
      await createChunks({ projectId: project.id, script: data.script });
      await processChunks(project.id);
    } catch (error) {
      console.error("Project creation failed:", error);
    }
  };

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentTime(prev => {
          const newTime = prev + 0.1;
          if (newTime >= duration) {
            setIsPlaying(false);
            return duration;
          }
          return newTime;
        });
      }, 100);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isPlaying, duration]);

  useEffect(() => {
    if (loadedChunks.length > 0) {
      let maxEndTime = 0;
      loadedChunks.forEach(chunk => {
        chunk.lines.forEach(line => {
          const endTime = line.start + line.duration;
          if (endTime > maxEndTime) maxEndTime = endTime;
        });
        
        [...chunk.audio_direction.music, ...chunk.audio_direction.ambience, ...chunk.audio_direction.sfx].forEach(audio => {
          const endTime = audio.start + audio.duration;
          if (endTime > maxEndTime) maxEndTime = endTime;
        });
      });
      
      if (maxEndTime > 0) {
        setDuration(Math.ceil(maxEndTime));
      }
    }
  }, [loadedChunks]);

  const handleSeek = (time: number) => {
    setCurrentTime(time);
  };

  const handlePlayPause = (isPlaying: boolean) => {
    setIsPlaying(isPlaying);
  };

  const handleLineChange = (lineId: string) => {
    console.log("Active line changed:", lineId);
  };

  const handleVoiceChange = (lineId: string, voiceKey: string) => {
    console.log("Voice changed:", lineId, voiceKey);
  };

  const handleVolumeChange = (trackId: string, volume: number) => {
    console.log("Volume changed:", trackId, volume);
  };

  const handleSfxChange = (trackId: string, sfxKey: string) => {
    console.log("SFX changed:", trackId, sfxKey);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
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

      <div className="max-w-4xl mx-auto py-10">
        <h1 className="text-3xl font-bold mb-6">Create New Project</h1>
        
        {/* Project Creation Form - luôn hiển thị */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <ProjectForm
            register={register}
            errors={errors}
            isSubmitting={isCreating || isCreatingChunks || isProcessingChunks}
          />

          <ProjectOptions
            register={register}
            errors={errors}
          />
        </form>

        {/* Loading Status - hiển thị khi đang tạo project hoặc chunks */}
        {(isCreating || isCreatingChunks || isProcessingChunks) && (
          <div className="space-y-6">
            <ProjectStatus
              projectId={projectId}
              status={
                isCreating ? "Creating project..." :
                isCreatingChunks ? "Creating chunks with pending status..." :
                isProcessingChunks ? "Processing chunks (10s delay each)..." :
                ""
              }
              error={createError?.message || chunkCreateError?.message || chunkProcessError?.message}
              isCreating={isCreating || isCreatingChunks || isProcessingChunks}
            />
          </div>
        )}

        {projectId && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">{watchedValues.title}</h1>
                <p className="text-muted-foreground">
                  {totalChunks > 0 ? (
                    <>
                      {completedCount}/{totalChunks} chunks completed
                      {processingChunks.length > 0 && ` • ${processingChunks.length} processing...`}
                      {pendingChunks.length > 0 && ` • ${pendingChunks.length} pending...`}
                      {errorCount > 0 && ` • ${errorCount} errors`}
                    </>
                  ) : (
                    "Waiting for chunks..."
                  )}
                  {isProcessingChunks && ` • Processing chunks with 10s delay...`}
                </p>
                {isProcessingChunks && (
                  <div className="mt-2 p-3 bg-blue-900/30 rounded-lg">
                    <p className="text-sm text-blue-300">
                      ⏳ Processing chunks... Each chunk takes 10 seconds to process.
                      Timeline will show chunks as they become available.
                    </p>
                  </div>
                )}
              </div>
            </div>


            <ChunkProgressBar 
              chunkRefs={chunkRefs}
              chunkStates={chunkStates}
              onRetryChunk={() => {}}
            />

            <AudioPlayer 
              chunks={loadedChunks}
              currentTime={currentTime}
              isPlaying={isPlaying}
            />

            {loadedChunks.length > 0 && (
              <ScriptPlayer 
                chunks={loadedChunks} 
                currentTime={currentTime}
                isPlaying={isPlaying}
                duration={duration}
                onSeek={handleSeek}
                onPlayPause={handlePlayPause}
                onLineChange={handleLineChange}
                onVoiceChange={handleVoiceChange}
                onVolumeChange={handleVolumeChange}
                onSfxChange={handleSfxChange}
              />
            )}

            {totalChunks > 0 && loadedChunks.length === 0 && (
              <div className="p-6 text-center border rounded-lg bg-muted/30">
                <div className="text-lg font-semibold mb-2">Processing Script...</div>
                <div className="text-muted-foreground mb-4">
                  {processingChunks.length > 0 
                    ? `Processing ${processingChunks.length} chunk(s)...` 
                    : `Waiting for ${pendingChunks.length} chunk(s) to start processing...`
                  }
                </div>
                <div className="text-sm text-muted-foreground">
                  Script will appear here as chunks are completed
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
