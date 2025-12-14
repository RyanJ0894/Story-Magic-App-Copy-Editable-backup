import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectApi } from './services/projectApi';
import { audioGenerationApi, AudioGenerationRequest } from './services/audioGenerationApi';
import { CreateProjectData } from './project.type';

export const PROJECTS_KEY_FACTORY = {
  all: ["projects"] as const,
  lists: () => [...PROJECTS_KEY_FACTORY.all, "list"] as const,
  details: () => [...PROJECTS_KEY_FACTORY.all, "detail"] as const,
  detail: (id: string) => [...PROJECTS_KEY_FACTORY.details(), id] as const,
};

// Get all projects
export const useProjects = () => {
  return useQuery({
    queryKey: PROJECTS_KEY_FACTORY.lists(),
    queryFn: () => projectApi.getAllProjects(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Get single project
export const useProject = (id: string | undefined) => {
  return useQuery({
    queryKey: PROJECTS_KEY_FACTORY.detail(id!),
    queryFn: () => projectApi.getProject(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Get project with details (for backward compatibility)
export const useProjectWithDetails = (id: string | undefined) => {
  return useQuery({
    queryKey: [...PROJECTS_KEY_FACTORY.details(), id!, "details"],
    queryFn: () => projectApi.getProjectWithDetails(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Create project mutation
export const useCreateProject =  () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProjectData) => projectApi.createProject(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROJECTS_KEY_FACTORY.lists() });
    },
  });
};

// Delete project mutation
export const useDeleteProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => projectApi.deleteProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROJECTS_KEY_FACTORY.lists() });
    },
  });
};

// Bulk delete projects mutation
export const useBulkDeleteProjects = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: string[]) => {
      const results = await Promise.allSettled(
        ids.map(id => projectApi.deleteProject(id))
      );
      const failed = results.filter(r => r.status === 'rejected');
      if (failed.length > 0) {
        throw new Error(`Failed to delete ${failed.length} of ${ids.length} projects`);
      }
      return results.length;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROJECTS_KEY_FACTORY.lists() });
    },
  });
};

// Update project mutation
export const useUpdateProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<CreateProjectData> }) => 
      projectApi.updateProject(id, updates),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: PROJECTS_KEY_FACTORY.lists() });
      queryClient.invalidateQueries({ queryKey: PROJECTS_KEY_FACTORY.detail(id) });
    },
  });
};

// Update project status mutation
export const useUpdateProjectStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => 
      projectApi.updateProjectStatus(id, status),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: PROJECTS_KEY_FACTORY.lists() });
      queryClient.invalidateQueries({ queryKey: PROJECTS_KEY_FACTORY.detail(id) });
    },
  });
};

// Generate project audio mutation
export const useGenerateProjectAudio = () => {
  return useMutation({
    mutationFn: (request: AudioGenerationRequest) => audioGenerationApi.generateProjectAudio(request),
  });
};

