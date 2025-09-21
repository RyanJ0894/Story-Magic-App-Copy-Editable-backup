import { useState, useCallback, useMemo } from 'react';
import { supabase } from '../../../../supabase/client';
import type { ChunkData } from '@/features/timeline/types';

export type ChunkRef = {
  chunk_id: string;
  scene_title: string;
  order: number;
  start: number;
  duration: number;
};

export type ChunkLoadingState = {
  chunkId: string;
  isLoading: boolean;
  data?: ChunkData;
  error?: string;
};

export const useChunkLoader = (chunkRefs: ChunkRef[]) => {
  const [chunkStates, setChunkStates] = useState<ChunkLoadingState[]>(() =>
    chunkRefs.map(ref => ({
      chunkId: ref.chunk_id,
      isLoading: true,
      data: undefined,
      error: undefined
    }))
  );

  // Load individual chunk from database
  const loadChunk = useCallback(async (chunkId: string) => {
    setChunkStates(prev => prev.map(state => 
      state.chunkId === chunkId 
        ? { ...state, isLoading: true, error: undefined }
        : state
    ));

    try {
      console.log(`🔄 Loading chunk: ${chunkId}`);
      
      const { data, error } = await supabase
        .from('project_chunks')
        .select('*')
        .eq('chunk_key', chunkId)
        .single();

      if (error) throw error;

      // Convert ProjectChunk to ChunkData format
      const chunkData: ChunkData = {
        chunk_id: data.chunk_key,
        project_id: data.project_id,
        scene_title: data.scene_title,
        version: data.version,
        lines: data.lines || [],
        audio_direction: data.audio_direction || { music: [], ambience: [], sfx: [] },
        director_notes: data.director_notes || ''
      };

      console.log(`✅ Loaded chunk: ${chunkId}`, chunkData);

      setChunkStates(prev => prev.map(state => 
        state.chunkId === chunkId 
          ? { ...state, isLoading: false, data: chunkData, error: undefined }
          : state
      ));
    } catch (error) {
      console.error(`❌ Failed to load chunk: ${chunkId}`, error);
      setChunkStates(prev => prev.map(state => 
        state.chunkId === chunkId 
          ? { 
              ...state, 
              isLoading: false, 
              error: error instanceof Error ? error.message : 'Failed to load chunk' 
            }
          : state
      ));
    }
  }, []);

  // Load all chunks
  const loadAllChunks = useCallback(async () => {
    console.log('🚀 Loading all chunks:', chunkRefs.length);
    
    // Load chunks in parallel with random delays (like ShowAudio)
    const loadPromises = chunkRefs.map(async (ref, index) => {
      // Add random delay before starting each chunk load
      await new Promise(resolve => setTimeout(resolve, Math.random() * 1000));
      return loadChunk(ref.chunk_id);
    });
    
    // Wait for all chunks to complete (or fail)
    await Promise.allSettled(loadPromises);
  }, [chunkRefs, loadChunk]);

  // Get loaded chunks
  const loadedChunks = useMemo(() => 
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

  // Check loading states
  const allChunksLoaded = chunkStates.every(state => !state.isLoading);
  const hasErrors = chunkStates.some(state => state.error);
  const loadingCount = chunkStates.filter(state => state.isLoading).length;
  const loadedCount = chunkStates.filter(state => state.data && !state.isLoading).length;

  return {
    chunkStates,
    loadedChunks,
    loadChunk,
    loadAllChunks,
    allChunksLoaded,
    hasErrors,
    loadingCount,
    loadedCount,
    totalCount: chunkRefs.length
  };
};
