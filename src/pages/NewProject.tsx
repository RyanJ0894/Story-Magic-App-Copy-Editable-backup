// src/pages/NewProject.tsx
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

// Feature imports
import { useProjectCreate } from "@/features/project/hooks/useProjectCreate";
import { useChunkProductionFixed } from "@/features/project/hooks/useChunkProductionFixed";
import { useChunkLoaderProduction } from "@/features/project/hooks/useChunkLoaderProduction";
import ProjectForm from "@/features/project/components/ProjectForm";
import ProjectOptions from "@/features/project/components/ProjectOptions";
import ProjectStatus from "@/features/project/components/ProjectStatus";
import TimelineAudio from "@/features/timeline/components/TimelineAudio";
import type { ChunkRef, ChunkLoadingState } from "@/features/project/hooks/useChunkLoaderProduction";
import type { TimelineItem } from "@/features/timeline/types";
import React from "react";

export default function NewProject() {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Form state
  const [title, setTitle] = useState("Untitled Project");
  const [script, setScript] = useState(`EXT. PARK – DAY
NARRATOR: A gentle breeze moves through the trees as Mary and John walk.
MARY: It's peaceful here.
JOHN: Yeah, let's keep moving.`);
  const [doDirector, setDoDirector] = useState(true);
  const [doAudio, setDoAudio] = useState(false);

  // Project state
  const [projectId, setProjectId] = useState<string>("");

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

  // Convert project chunks to chunk refs for TimelineAudio - memoized to prevent re-renders
  const chunkRefs: ChunkRef[] = React.useMemo(() => 
    projectChunks.map(chunk => ({
      chunk_id: chunk.chunk_key,
      scene_title: chunk.scene_title,
      order: chunk.chunk_index,
      start: chunk.start,
      duration: chunk.duration
    })), [projectChunks]
  );

  // Chunk loader hook (like ShowAudio)
  const {
    chunkStates,
    loadedChunks,
    loadChunk,
    loadAllChunks,
    allChunksLoaded,
    hasErrors,
    loadingCount,
    loadedCount,
    pendingCount,
    errorCount,
    totalCount
  } = useChunkLoaderProduction(chunkRefs);

  // Debug logs
  console.log('🔍 NewProject Debug:');
  console.log('- projectId:', projectId);
  console.log('- projectChunks:', projectChunks);
  console.log('- chunkRefs:', chunkRefs);
  console.log('- chunkStates:', chunkStates);
  console.log('- loadedChunks:', loadedChunks);
  
  // Chi tiết chunkStates
  chunkStates.forEach((state, index) => {
    console.log(`ChunkState ${index}:`, {
      chunkId: state.chunkId,
      isLoading: state.isLoading,
      hasData: !!state.data,
      error: state.error
    });
  });


  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.log('🚀 Step 1: Creating project...');
      const project = await createProject({ title, script });
      setProjectId(project.id);
      
      console.log('✅ Project created:', project.id);
      
      // Step 2: Create chunks with pending status
      console.log('🔄 Step 2: Creating chunks with pending status...');
      await createChunks({ projectId: project.id, script });
      
      console.log('✅ Chunks created, starting processing...');
      
      // Step 3: Process chunks (simulate director function)
      console.log('🔄 Step 3: Processing chunks (simulating director function)...');
      await processChunks(project.id);
      
      console.log('✅ All steps completed, timeline will show automatically...');
      
    } catch (error) {
      console.error("Project creation failed:", error);
    }
  };

  // Timeline event handlers
  const handleItemsChange = (items: TimelineItem[]) => {
    console.log("Timeline items changed:", items);
  };

  const handlePlayPause = (isPlaying: boolean) => {
    console.log("Playback state:", isPlaying ? "Playing" : "Paused");
  };

  const handleSeek = (time: number) => {
    console.log("Seek to:", time);
  };

  const handleChunkUpdate = (chunkId: string, updatedChunk: any) => {
    console.log("Chunk updated:", chunkId, updatedChunk);
  };

  const handleGenerateAudio = (chunkId: string, lineId: string) => {
    console.log("Generate audio for:", chunkId, lineId);
  };

  const handleVoiceChange = (chunkId: string, lineId: string, voiceKey: string) => {
    console.log("Voice changed:", chunkId, lineId, voiceKey);
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
        <div className="space-y-6">
          <ProjectForm
            title={title}
            setTitle={setTitle}
            script={script}
            setScript={setScript}
            onSubmit={handleSubmit}
            isSubmitting={isCreating || isCreatingChunks || isProcessingChunks}
          />

          <ProjectOptions
            doDirector={doDirector}
            setDoDirector={setDoDirector}
            doAudio={doAudio}
            setDoAudio={setDoAudio}
          />
        </div>

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

        {/* Timeline Audio Editor - luôn hiển thị */}
        {projectId && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">{title}</h1>
                <p className="text-muted-foreground">
                  {totalCount > 0 ? (
                    <>
                      {loadedCount}/{totalCount} chunks loaded
                      {loadingCount > 0 && ` • ${loadingCount} loading...`}
                      {pendingCount > 0 && ` • ${pendingCount} pending...`}
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

            <TimelineAudio 
              chunks={loadedChunks}
              chunkStates={chunkStates}
              chunkRefs={chunkRefs}
              onItemsChange={handleItemsChange}
              onPlayPause={handlePlayPause}
              onSeek={handleSeek}
              onChunkUpdate={handleChunkUpdate}
              onGenerateAudio={handleGenerateAudio}
              onVoiceChange={handleVoiceChange}
              onRetryChunk={loadChunk}
            />
          </div>
        )}
      </div>
    </div>
  );
}
