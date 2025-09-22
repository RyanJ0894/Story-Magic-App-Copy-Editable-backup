import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useProjectChunks } from "../projectChunks";
import { projectChunksApi } from "../services/projectChunksApi";
import { chunkText } from "../utils/text-chunker";
import { toast } from "sonner"; 
import { ProjectChunk, ChunkCreateData } from "../project-chunk.type";
import { v4 as uuidv4 } from 'uuid';
import { useInvokeAiDirector } from "../projectChunks";

export const useChunkProduction = (projectId?: string) => {
  const queryClient = useQueryClient();

  const { data: chunks = [], isLoading: isLoadingChunks } = useProjectChunks(projectId);
  const { mutateAsync: invokeAiDirector, isPending: isInvokingAiDirector } = useInvokeAiDirector();

  const createChunksMutation = useMutation({
    mutationFn: async (data: ChunkCreateData): Promise<ProjectChunk[]> => {
      const textChunks = chunkText(data.script, {
        maxChunkLength: 2000,
        overlap: 200,
        minChunkLength: 500
      });


      if (textChunks.length === 0) {
        throw new Error('No chunks created from script');
      }   

      const uuid = uuidv4();
      const chunkInserts = textChunks.map((chunk, index) => (
        {
          chunk_key: `chunk_${data.projectId}_${uuid}_${index + 1}`,
          project_id: data.projectId,
          scene_title: chunk.scene_title,
          content: chunk.text,
          chunk_index: chunk.order,
          start: chunk.start,
          duration: chunk.duration,
          status: 'pending' as const,
          version: 1,
          lines: null,
          audio_direction: null,
          director_notes: '',
        }));

      const insertedChunks = await projectChunksApi.createChunks(chunkInserts);

      return insertedChunks;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-chunks', projectId] });
      toast.success("Chunks created with pending status");
    },
    onError: (error) => {
      toast.error("Error", {
        description: error.message,
      });
    }
  });

  const processChunksMutation = useMutation({
    mutationFn: async (projectId: string): Promise<void> => {
      // Wait a bit for chunks to be created
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Fetch chunks from database using API
      const allChunks = await projectChunksApi.getProjectChunks(projectId);
      const chunksToProcess = allChunks.filter(chunk => chunk.status === 'pending');

      if (!chunksToProcess || chunksToProcess.length === 0) {
        // Don't throw error, just return - chunks might already be processed
        return;
      }

      // Process chunks in parallel - invoke AI Director for each chunk
      const processChunk = async (chunk: ProjectChunk) => {
        try {
          // Update status to processing using API
          await projectChunksApi.updateChunkToProcessing(chunk.id);

          // Invoke AI Director for this chunk with additional metadata
          await invokeAiDirector({
            projectId: projectId,
            chunkKey: chunk.chunk_key,
            script: chunk.content,
            chunkIndex: chunk.chunk_index,
            start: chunk.start,
            duration: chunk.duration
          });

          // AI Director will handle the rest asynchronously
          // Polling will pick up the status changes

        } catch (error) {
          console.error(`Error processing chunk ${chunk.chunk_key}:`, error);
          await projectChunksApi.updateChunkStatus(chunk.id, 'error');
          throw error;
        }
      };

      // Process all chunks in parallel
      await Promise.all(chunksToProcess.map(chunk => processChunk(chunk as ProjectChunk)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-chunks', projectId] });
      toast.success("AI Director invoked for all chunks");
    },
    onError: (error) => {
      toast.error("Error", {
        description: error.message,
      });
    }
  });

  return {
    // Data
    chunks,
    isLoadingChunks,

    // Create chunks
    createChunks: createChunksMutation.mutateAsync,
    isCreatingChunks: createChunksMutation.isPending,
    createError: createChunksMutation.error,

    // Process chunks (invoke AI Director)
    processChunks: processChunksMutation.mutateAsync,
    isProcessingChunks: processChunksMutation.isPending,
    processError: processChunksMutation.error,
  };
};
