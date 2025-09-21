import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useProjectChunks } from "../projectChunks";
import { ProjectChunk } from "../project-chunk.type";

export const useChunkPolling = (projectId: string, enabled: boolean = true) => {
  const queryClient = useQueryClient();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [shouldStopPolling, setShouldStopPolling] = useState(false);

  // Use existing React Query hook with polling
  const { data: chunks = [], isLoading, error } = useProjectChunks(projectId, {
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
