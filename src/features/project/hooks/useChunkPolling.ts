import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useRef, useState } from "react";

export interface ProjectChunk {
  id: string;
  chunk_key: string;
  project_id: string;
  scene_title: string;
  version: number;
  content: string;
  chunk_index: number;
  start?: number;
  duration?: number;
  status: 'pending' | 'processing' | 'done' | 'error';
  lines?: any;
  audio_direction?: any;
  director_notes?: string;
  created_at: string;
  updated_at: string;
}

export const useChunkPolling = (projectId: string, enabled: boolean = true) => {
  const queryClient = useQueryClient();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [shouldStopPolling, setShouldStopPolling] = useState(false);

  const { data: chunks = [], isLoading, error } = useQuery({
    queryKey: ['project-chunks-polling', projectId],
    queryFn: async (): Promise<ProjectChunk[]> => {
      if (!projectId) return [];
      
      const { data, error } = await supabase
        .from('project_chunks')
        .select('*')
        .eq('project_id', projectId)
        .order('chunk_index');

      if (error) throw error;
      return (data || []) as ProjectChunk[];
    },
    enabled: enabled && !!projectId && !shouldStopPolling,
    refetchInterval: shouldStopPolling ? false : 3000,
    refetchIntervalInBackground: true,
  });

  useEffect(() => {
    if (!chunks.length) return;

    const allDone = chunks.every(chunk => 
      chunk.status === 'done' || chunk.status === 'error'
    );

    if (allDone && !shouldStopPolling) {
      console.log('✅ All chunks completed, stopping polling');
      setShouldStopPolling(true);
      queryClient.setQueryData(['project-chunks-polling', projectId], chunks);
    }
  }, [chunks, projectId, queryClient, shouldStopPolling]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const pendingChunks = chunks.filter(chunk => chunk.status === 'pending');
  const processingChunks = chunks.filter(chunk => chunk.status === 'processing');
  const completedChunks = chunks.filter(chunk => chunk.status === 'done');
  const errorChunks = chunks.filter(chunk => chunk.status === 'error');

  const stuckChunks = pendingChunks.filter(chunk => {
    const createdAt = new Date(chunk.created_at);
    const now = new Date();
    const diffMinutes = (now.getTime() - createdAt.getTime()) / (1000 * 60);
    return diffMinutes > 30;
  });

  return {
    chunks,
    isLoading,
    error,
    pendingChunks,
    processingChunks,
    completedChunks,
    errorChunks,
    stuckChunks,
    totalChunks: chunks.length,
    completedCount: completedChunks.length,
    errorCount: errorChunks.length,
    stuckCount: stuckChunks.length,
  };
};
