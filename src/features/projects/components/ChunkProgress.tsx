import { useEffect, useRef } from "react";
import { useChunkProduction } from "../hooks/useChunkProduction";
import { useChunkPolling } from "../hooks/useChunkPolling";
import ChunkProgressBar from "./ChunkProgressBar";
import { toast } from "sonner";
import { ChunkProgressData } from "../project-chunk.type";

interface ChunkProgressProps {
  projectId: string;
  script: string;
  onChunksChange?: (chunks: ChunkProgressData[]) => void;
  onComplete?: (chunks: ChunkProgressData[]) => void;
}

export const ChunkProgress = ({ projectId, script, onChunksChange, onComplete }: ChunkProgressProps) => {
  const lastChunksRef = useRef<string>(""); // Prevent infinite loop

  const {
    createChunks,
    isCreatingChunks,
    processChunks,
    isProcessingChunks,
    createError,
    processError
  } = useChunkProduction(projectId);

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


  const handleStartProcessing = async () => {
    try {
      // Step 1: Create chunks
      await createChunks({ projectId, script });
      
      // Step 2: Process chunks
      await processChunks(projectId);
      
      toast.success("Processing Started", {
        description: "Chunks are being processed. This may take a few minutes.",
      });
    } catch (error: any) {
      toast.error("Processing Failed",{
        description: error.message,
      });
    }
  };

  // Convert completed chunks to ScriptPlayer format
  const loadedChunks: ChunkProgressData[] = completedChunks.map(chunk => ({
    chunk_id: chunk.chunk_key,
    project_id: chunk.project_id,
    scene_title: chunk.scene_title,
    version: chunk.version,
    director_notes: chunk.director_notes || "",
    lines: (chunk.lines as any[]) || [],
    audio_direction: (chunk.audio_direction as any) || { music: [], ambience: [], sfx: [] }
  }));

  // Debug logs (inside component)
  useEffect(() => {
    console.log('🔍 ChunkProgress Debug:', {
      totalChunks: totalChunks,
      completedCount: completedCount,
      completedChunks: completedChunks.length,
      loadedChunks: loadedChunks.length,
      polledChunks: polledChunks.map(c => ({ 
        id: c.chunk_key, 
        status: c.status, 
        hasLines: !!c.lines,
        hasAudioDirection: !!c.audio_direction 
      }))
    });
  }, [totalChunks, completedCount, completedChunks.length, loadedChunks.length, polledChunks]);

  // Create chunk refs for progress bar
  const chunkRefs = polledChunks.map(chunk => ({
    chunk_id: chunk.chunk_key,
    scene_title: chunk.scene_title,
    order: chunk.chunk_index,
    start: chunk.start || 0,
    duration: chunk.duration || 10
  }));

  // Create chunk states for progress bar
  const chunkStates = polledChunks.map(chunk => ({
    chunkId: chunk.chunk_key,
    isLoading: chunk.status === 'pending',
    data: chunk.status === 'done' ? chunk : undefined,
    error: chunk.status === 'error' ? `Chunk ${chunk.chunk_key} failed` : undefined
  }));


  // Notify parent when chunks change (prevent infinite loop)
  useEffect(() => {
    if (onChunksChange && loadedChunks.length > 0) {
      const chunksString = JSON.stringify(loadedChunks.map(c => c.chunk_id));
      if (lastChunksRef.current !== chunksString) {
        lastChunksRef.current = chunksString;
        onChunksChange(loadedChunks);
      }
    }
  }, [loadedChunks, onChunksChange]);

  // Notify parent when all chunks are completed
  useEffect(() => {
    if (totalChunks > 0 && completedCount === totalChunks && onComplete) {
      onComplete(loadedChunks);
    }
  }, [totalChunks, completedCount, loadedChunks, onComplete]);


  // Create header text with progress info
  const headerText = totalChunks > 0 ? (
    `${completedCount}/${totalChunks} chunks completed${
      processingChunks.length > 0 ? ` • ${processingChunks.length} processing...` : ''
    }${
      pendingChunks.length > 0 ? ` • ${pendingChunks.length} pending...` : ''
    }${
      errorCount > 0 ? ` • ${errorCount} errors` : ''
    }${
      isProcessingChunks ? ` • Processing chunks...` : ''
    }`
  ) : (
    "Initializing chunks..."
  );

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      {totalChunks > 0 && (
        <ChunkProgressBar
          chunkRefs={chunkRefs}
          chunkStates={chunkStates}
          onRetryChunk={() => {}}
          headerText={headerText}
        />
      )}

      {/* Error Messages */}
      {(createError || processError) && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          {createError && (
            <p className="text-sm text-destructive">Error: {createError.message}</p>
          )}
          {processError && (
            <p className="text-sm text-destructive">Error: {processError.message}</p>
          )}
        </div>
      )}


      {/* Loading State */}
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
  );
};
