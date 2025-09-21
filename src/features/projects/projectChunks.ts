import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectChunksApi } from './services/projectChunksApi';

export const PROJECT_CHUNKS_KEY_FACTORY = {
  all: ["project-chunks"] as const,
  lists: () => [...PROJECT_CHUNKS_KEY_FACTORY.all, "list"] as const,
  details: () => [...PROJECT_CHUNKS_KEY_FACTORY.all, "detail"] as const,
  detail: (id: string) => [...PROJECT_CHUNKS_KEY_FACTORY.details(), id] as const,
  project: (projectId: string) => [...PROJECT_CHUNKS_KEY_FACTORY.all, "project", projectId] as const,
};

// Get all chunks for a project
export const useProjectChunks = (projectId: string | undefined, options?: {
  enabled?: boolean;
  refetchInterval?: number | false;
  refetchIntervalInBackground?: boolean;
}) => {
  return useQuery({
    queryKey: PROJECT_CHUNKS_KEY_FACTORY.project(projectId!),
    queryFn: () => projectChunksApi.getProjectChunks(projectId!),
    enabled: options?.enabled ?? !!projectId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: options?.refetchInterval,
    refetchIntervalInBackground: options?.refetchIntervalInBackground,
  });
};

// Get single chunk
export const useChunk = (chunkId: string | undefined) => {
  return useQuery({
    queryKey: PROJECT_CHUNKS_KEY_FACTORY.detail(chunkId!),
    queryFn: () => projectChunksApi.getChunk(chunkId!),
    enabled: !!chunkId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Get chunk by project_id and chunk_key
export const useChunkByKey = (projectId: string | undefined, chunkKey: string | undefined) => {
  return useQuery({
    queryKey: [...PROJECT_CHUNKS_KEY_FACTORY.project(projectId!), "key", chunkKey!],
    queryFn: () => projectChunksApi.getChunkByKey(projectId!, chunkKey!),
    enabled: !!projectId && !!chunkKey,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Update chunk status mutation
export const useUpdateChunkStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ chunkId, status }: { chunkId: string; status: string }) => 
      projectChunksApi.updateChunkStatus(chunkId, status),
    onSuccess: (data) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: PROJECT_CHUNKS_KEY_FACTORY.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: PROJECT_CHUNKS_KEY_FACTORY.project(data.project_id) });
    },
  });
};

// Update chunk data mutation
export const useUpdateChunkData = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ chunkId, updates }: { 
      chunkId: string; 
      updates: {
        lines?: any;
        audio_direction?: any;
        director_notes?: string;
        content?: string;
        scene_title?: string;
        start?: number;
        duration?: number;
        version?: number;
      }
    }) => projectChunksApi.updateChunkData(chunkId, updates),
    onSuccess: (data) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: PROJECT_CHUNKS_KEY_FACTORY.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: PROJECT_CHUNKS_KEY_FACTORY.project(data.project_id) });
    },
  });
};

// Delete chunk mutation
export const useDeleteChunk = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (chunkId: string) => projectChunksApi.deleteChunk(chunkId),
    onSuccess: (_, chunkId) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: PROJECT_CHUNKS_KEY_FACTORY.detail(chunkId) });
      queryClient.invalidateQueries({ queryKey: PROJECT_CHUNKS_KEY_FACTORY.lists() });
    },
  });
};

// Delete all chunks for a project mutation
export const useDeleteProjectChunks = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (projectId: string) => projectChunksApi.deleteProjectChunks(projectId),
    onSuccess: (_, projectId) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: PROJECT_CHUNKS_KEY_FACTORY.project(projectId) });
      queryClient.invalidateQueries({ queryKey: PROJECT_CHUNKS_KEY_FACTORY.lists() });
    },
  });
};
