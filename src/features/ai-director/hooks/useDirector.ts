import { useMutation, useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { directorApi } from '../services/directorApi';


export const AI_DIRECTOR_KEY_FACTORY = {
  all: ["director"] as const,
  lists: () => [...AI_DIRECTOR_KEY_FACTORY.all, "list"] as const,
  list: () => [...AI_DIRECTOR_KEY_FACTORY.lists()] as const,
  details: () => [...AI_DIRECTOR_KEY_FACTORY.all, "detail"] as const,
  detail: (id: string) => [...AI_DIRECTOR_KEY_FACTORY.details(), id] as const,
};


export const useDirector = (projectId?: string) => {
  const { toast } = useToast();
  const [directorJson, setDirectorJson] = useState<any>(null);
  const [waitingForDirector, setWaitingForDirector] = useState(false);
  const [directorError, setDirectorError] = useState<string>("");

  // Get director analysis for project
  const { data: existingDirectorJson } = useQuery({
    queryKey: AI_DIRECTOR_KEY_FACTORY.detail(projectId!),
    queryFn: () => directorApi.getByProjectId(projectId!),
    enabled: !!projectId,
  });

  // Trigger director analysis
  const triggerDirectorMutation = useMutation({
    mutationFn: ({ projectId, script }: { projectId: string; script: string }) =>
      directorApi.trigger(projectId, script),
    onSuccess: () => {
      setWaitingForDirector(true);
      setDirectorError("");
    },
    onError: (error: any) => {
      setDirectorError(error?.message || "Failed to trigger director analysis");
      setWaitingForDirector(false);
    },
  });

  // Handle director completion
  const handleDirectorComplete = (json: any) => {
    setDirectorJson(json);
    setWaitingForDirector(false);
    setDirectorError("");
  };

  const clearDirectorData = () => {
    setDirectorJson(null);
    setWaitingForDirector(false);
    setDirectorError("");
  };

  // Set up real-time subscription
  useEffect(() => {
    if (!projectId) return;

    const unsubscribe = directorApi.subscribe(projectId, (analysis) => {
      if (typeof analysis === 'object' && analysis.error) {
        setDirectorError(analysis.error);
        setWaitingForDirector(false);
        toast({
          title: "AI Director Failed",
          description: "AI Director analysis failed: " + analysis.error,
          variant: "destructive"
        });
      } else {
        handleDirectorComplete(analysis);
        toast({
          title: "AI Director Complete",
          description: "Director analysis has been generated successfully!",
          variant: "default"
        });
      }
    });

    return unsubscribe;
  }, [projectId, toast]);

  // Load existing director data
  useEffect(() => {
    if (existingDirectorJson) {
      handleDirectorComplete(existingDirectorJson);
    }
  }, [existingDirectorJson]);

  return {
    directorJson,
    waitingForDirector,
    directorError,
    triggerDirector: (projectId: string, script: string) => 
      triggerDirectorMutation.mutateAsync({ projectId, script }),
    handleDirectorComplete,
    clearDirectorData,
    isTriggering: triggerDirectorMutation.isPending,
  };
};
