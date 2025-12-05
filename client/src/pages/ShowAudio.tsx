import React from "react";
import TimelineAudio from "@/features/timeline/components/TimelineAudio";
import type { ChunkData, TimelineItem } from "@/features/timeline/types";
import chunk from "@/features/projects/data/chunk.json";
import project from "@/features/projects/data/project.json";

// Types for chunk loading
type ChunkRef = {
  chunk_id: string;
  scene_title: string;
  order: number;
  start: number;
  duration: number;
};

type ChunkLoadingState = {
  chunkId: string;
  isLoading: boolean;
  data?: ChunkData;
  error?: string;
};

// Simulate API call to load individual chunk with different test cases
const loadChunkData = async (chunkId: string): Promise<ChunkData> => {
  // Different delay patterns for testing
  let delay = 0;
  let shouldError = false;
  
  switch (chunkId) {
    case "chunk_proj001_001":
      delay = 3000; // Fast load
      break;
    case "chunk_proj001_002":
      delay = 8000; // Medium load
      shouldError = true; // This one will fail
      break;
    case "chunk_proj001_003":
      delay = 15000; // Slow load
      break;
    case "chunk_proj001_004":
      delay = 5000; // Medium-fast load
      break;
    case "chunk_proj001_005":
      delay = 12000; // Slow load
      break;
    default:
      delay = 10000 + Math.random() * 5000; // Random 10-15s
  }
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, delay));
  
  // Simulate error for specific chunk
  if (shouldError) {
    throw new Error(`Failed to load chunk ${chunkId}: Network timeout after ${delay}ms`);
  }
  
  // Return mock data based on chunkId
  if (chunkId === "chunk_proj001_001") {
      return chunk;
  } else {
    // Generate mock chunk for other IDs
    const offset = parseInt(chunkId.split('_').pop() || '0') * 30;
    return {
      ...chunk,
      chunk_id: chunkId,
      scene_title: `Scene ${chunkId.split('_').pop()}`,
      lines: chunk.lines.map(line => ({
        ...line,
        line_id: `${chunkId}_${line.line_id.split('_').pop()}`,
        start: line.start + offset
      }))
    };
  }
};

export default function ShowAudio() {
  // Chunk references from project
  const [chunkRefs] = React.useState<ChunkRef[]>(project.chunks);
  
  // Loading states for each chunk
  const [chunkStates, setChunkStates] = React.useState<ChunkLoadingState[]>(() =>
    chunkRefs.map(ref => ({
      chunkId: ref.chunk_id,
      isLoading: true,
      data: undefined,
      error: undefined
    }))
  );

  // Load individual chunk
  const loadChunk = React.useCallback(async (chunkId: string) => {
    setChunkStates(prev => prev.map(state => 
      state.chunkId === chunkId 
        ? { ...state, isLoading: true, error: undefined }
        : state
    ));

    try {
      const data = await loadChunkData(chunkId);
      setChunkStates(prev => prev.map(state => 
        state.chunkId === chunkId 
          ? { ...state, isLoading: false, data, error: undefined }
          : state
      ));
    } catch (error) {
      setChunkStates(prev => prev.map(state => 
        state.chunkId === chunkId 
          ? { ...state, isLoading: false, error: error instanceof Error ? error.message : 'Failed to load' }
          : state
      ));
    }
  }, []);

  // Load chunks in random order
  React.useEffect(() => {
    const loadChunksRandomly = async () => {
      // Shuffle chunk refs for random loading order
      const shuffledRefs = [...chunkRefs].sort(() => Math.random() - 0.5);
      
      // Load all chunks in parallel (but with random delays)
      const loadPromises = shuffledRefs.map(async (ref, index) => {
        // Add random delay before starting each chunk load
        await new Promise(resolve => setTimeout(resolve, Math.random() * 1000));
        return loadChunk(ref.chunk_id);
      });
      
      // Wait for all chunks to complete (or fail)
      await Promise.allSettled(loadPromises);
    };

    loadChunksRandomly();
  }, [chunkRefs, loadChunk]);

  // Get loaded chunks
  const loadedChunks = React.useMemo(() => 
    chunkStates
      .filter(state => state.data && !state.isLoading)
      .map(state => state.data!)
      .sort((a, b) => {
        const aRef = chunkRefs.find(ref => ref.chunk_id === a.chunk_id);
        const bRef = chunkRefs.find(ref => ref.chunk_id === b.chunk_id);
        return (aRef?.order || 0) - (bRef?.order || 0);
      }),
    [chunkStates, chunkRefs]
  );

  // Check if all chunks are loaded
  const allChunksLoaded = chunkStates.every(state => !state.isLoading);
  const hasErrors = chunkStates.some(state => state.error);

  const handleItemsChange = (items: TimelineItem[]) => {
    console.log("Timeline items changed:", items);
  };

  const handlePlayPause = (isPlaying: boolean) => {
    console.log("Playback state:", isPlaying ? "Playing" : "Paused");
  };

  const handleSeek = (time: number) => {
    console.log("Seek to:", time);
  };

  const handleChunkUpdate = (chunkId: string, updatedChunk: ChunkData) => {
    console.log("Chunk updated:", chunkId, updatedChunk);
    setChunkStates(prev => prev.map(state => 
      state.chunkId === chunkId 
        ? { ...state, data: updatedChunk }
        : state
    ));
  };

  const handleGenerateAudio = (chunkId: string, lineId: string) => {
    console.log("Generate audio for:", chunkId, lineId);
    // TODO: Call API to generate audio
  };

  const handleVoiceChange = (chunkId: string, lineId: string, voiceKey: string) => {
    console.log("Voice changed:", chunkId, lineId, voiceKey);
    // TODO: Update voice in chunk
  };

  return (
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
  );
}