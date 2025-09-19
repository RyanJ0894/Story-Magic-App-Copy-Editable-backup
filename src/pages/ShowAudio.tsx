import React from "react";
import TimelineAudio from "@/feature/timeline/components/TimelineAudio";
import chunk from "@/feature/timeline/data/chunk.json";
import project from "@/feature/timeline/data/project.json";
import type { ChunkData, TimelineItem } from "@/feature/timeline/types";

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

// Simulate API call to load individual chunk
const loadChunkData = async (chunkId: string): Promise<ChunkData> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 500));
  
  // Return mock data based on chunkId
  if (chunkId === "chunk_proj001_001") {
    return chunk;
  } else {
    // Generate mock chunk for other IDs
    return {
      ...chunk,
      chunk_id: chunkId,
      scene_title: `Scene ${chunkId.split('_').pop()}`,
      lines: chunk.lines.map(line => ({
        ...line,
        line_id: `${chunkId}_${line.line_id.split('_').pop()}`,
        start: line.start + (chunkId === "chunk_proj001_002" ? 30 : 0)
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

  // Load chunks in order
  React.useEffect(() => {
    const loadChunksInOrder = async () => {
      for (const ref of chunkRefs) {
        await loadChunk(ref.chunk_id);
        // Small delay between chunks for better UX
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    };

    loadChunksInOrder();
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