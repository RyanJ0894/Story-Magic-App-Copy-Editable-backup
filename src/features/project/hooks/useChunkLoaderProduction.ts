import { useState, useCallback, useMemo, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
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

export const useChunkLoaderProduction = (chunkRefs: ChunkRef[]) => {
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
    console.log(`🔄 Attempting to load chunk: ${chunkId}`);
    setChunkStates(prev => prev.map(state => 
      state.chunkId === chunkId 
        ? { ...state, isLoading: true, error: undefined }
        : state
    ));

    try {
      console.log(`🔄 Loading chunk from database: ${chunkId}`);
      
      const { data, error } = await supabase
        .from('project_chunks')
        .select('*')
        .eq('chunk_key', chunkId)
        .single();

      if (error) {
        console.log(`❌ Database error for chunk ${chunkId}:`, error);
        throw error;
      }

      console.log(`📊 Chunk ${chunkId} data:`, data);
      console.log(`📊 Chunk ${chunkId} status:`, data.status);

      // Check if chunk is ready (status = 'done')
      if (data.status !== 'done') {
        console.log(`⏳ Chunk ${chunkId} status: ${data.status} - still processing, will retry later`);
      }

      // Convert ProjectChunk to ChunkData format
      const chunkData: ChunkData = {
        chunk_id: data.chunk_key,
        project_id: data.project_id,
        scene_title: data.scene_title,
        version: data.version,
        lines: Array.isArray(data.lines) ? data.lines as any[] : [],
        audio_direction: data.audio_direction && typeof data.audio_direction === 'object' 
          ? data.audio_direction as any 
          : { music: [], ambience: [], sfx: [] },
        director_notes: data.director_notes || ''
      };

      console.log(`✅ Loaded chunk: ${chunkId}`, chunkData);

      setChunkStates(prev => prev.map(state => 
        state.chunkId === chunkId 
          ? { ...state, isLoading: false, data: chunkData, error: undefined }
          : state
      ));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Chunk not ready yet';
      console.log(`⏳ Chunk ${chunkId} not ready yet: ${errorMessage}`);
      
      const isNotReadyError = errorMessage.includes('not ready');
        setChunkStates(prev => prev.map(state => 
        state.chunkId === chunkId 
          ? { 
              ...state, 
              isLoading: false, 
              error: isNotReadyError ? undefined : errorMessage
            }
          : state
      ));
    }
  }, []);

  // Load all chunks with random order (like ShowAudio)
  const loadAllChunks = useCallback(async () => {
    console.log('🚀 Loading all chunks:', chunkRefs.length);
    
    // Shuffle chunk refs for random loading order (like ShowAudio)
    const shuffledRefs = [...chunkRefs].sort(() => Math.random() - 0.5);
    
    // Load all chunks in parallel (but with random delays)
    const loadPromises = shuffledRefs.map(async (ref, index) => {
      // Add random delay before starting each chunk load
      await new Promise(resolve => setTimeout(resolve, Math.random() * 1000));
      return loadChunk(ref.chunk_id);
    });
    
    // Wait for all chunks to complete (or fail)
    await Promise.allSettled(loadPromises);
  }, [chunkRefs, loadChunk]);

  // Auto-load chunks when chunkRefs change (only once)
  useEffect(() => {
    if (chunkRefs.length > 0) {
      console.log('🔄 Chunk refs available, waiting for processing...');
    }
  }, [chunkRefs.length]);

  // Update chunkStates when chunkRefs change
  useEffect(() => {
    console.log('🔍 useChunkLoaderProduction - chunkRefs changed:', chunkRefs);
    if (chunkRefs.length > 0) {
      console.log('🔄 Initializing chunk states for', chunkRefs.length, 'chunks');
      setChunkStates(chunkRefs.map(ref => ({
        chunkId: ref.chunk_id,
        isLoading: false, // Start as not loading, polling will handle loading
        data: undefined,
        error: undefined
      })));
    }
  }, [chunkRefs]);

  useEffect(() => {
    if (chunkRefs.length === 0) return;

    console.log('🔄 Starting polling mechanism for', chunkRefs.length, 'chunks');
    
    const pollChunks = async () => {
      const pendingChunks = chunkStates.filter(state => 
        !state.data && !state.isLoading && !state.error
      );

      console.log(`🔄 Polling check: ${pendingChunks.length} pending chunks out of ${chunkStates.length} total`);
      
      if (pendingChunks.length > 0) {
        console.log(`🔄 Polling for ${pendingChunks.length} pending chunks:`, pendingChunks.map(s => s.chunkId));
        for (const state of pendingChunks) {
          try {
            await loadChunk(state.chunkId);
          } catch (error) {
            console.log(`⏳ Chunk ${state.chunkId} not ready yet, will retry...`);
          }
        }
      } else if (chunkStates.length > 0) {
        console.log('✅ All chunks loaded or processing complete - stopping polling');
        // Clear interval when all chunks are done
        clearInterval(intervalRef.current);
      }
    };

    // Create interval ref
    const intervalRef = { current: null as NodeJS.Timeout | null };

    // Poll immediately
    pollChunks();
    
    // Then poll every 3 seconds
    intervalRef.current = setInterval(pollChunks, 3000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [chunkRefs.length, chunkStates, loadChunk]);

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
  const pendingCount = chunkStates.filter(state => 
    !state.isLoading && !state.data && !state.error
  ).length;
  const errorCount = chunkStates.filter(state => state.error).length;

  return {
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
    totalCount: chunkRefs.length
  };
};
