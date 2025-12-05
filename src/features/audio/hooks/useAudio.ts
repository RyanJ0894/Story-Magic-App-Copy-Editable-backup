import { useMutation, useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { audioApi, AudioGeneration } from '../services/audioApi';

export const useAudio = (projectId?: string) => {
  const { toast } = useToast();
  const [audioUrl, setAudioUrl] = useState<string>("");
  const [audioResult, setAudioResult] = useState<any>(null);

  // Get existing audio for project
  const { data: existingAudioUrl } = useQuery({
    queryKey: ['audio', projectId],
    queryFn: () => audioApi.getByProjectId(projectId!),
    enabled: !!projectId,
  });

  // Generate audio mutation
  const generateAudioMutation = useMutation({
    mutationFn: ({ projectId, directorJson, useRunAudio = false }: { 
      projectId: string; 
      directorJson: any; 
      useRunAudio?: boolean;
    }) => {
      if (useRunAudio) {
        return audioApi.generateWithRunAudio(projectId, directorJson);
      }
      return audioApi.generateMerged(projectId, directorJson);
    },
    onSuccess: (data) => {
      if (data?.merged_audio?.success && data?.merged_audio?.audio_url) {
        setAudioUrl(data.merged_audio.audio_url);
        setAudioResult(data);
        toast({
          title: "Audio Generation Complete",
          description: "Your story has been successfully converted to audio!",
          variant: "default"
        });
      } else {
        throw new Error(data?.merged_audio?.message || "No audio_url returned");
      }
    },
    onError: (error: any) => {
      toast({
        title: "Audio Generation Failed",
        description: error?.message || "Failed to generate audio",
        variant: "destructive"
      });
    },
  });

  // Set up real-time subscription
  useEffect(() => {
    if (!projectId) return;

    const unsubscribe = audioApi.subscribe(projectId, (audio: AudioGeneration) => {
      if (audio.audio_url) {
        setAudioUrl(audio.audio_url);
        setAudioResult({ success: true, public_url: audio.audio_url });
        toast({
          title: "Audio Generation Complete",
          description: "Your story has been converted to audio!",
          variant: "default"
        });
      }
    });

    return unsubscribe;
  }, [projectId, toast]);

  // Load existing audio
  useEffect(() => {
    if (existingAudioUrl) {
      setAudioUrl(existingAudioUrl);
      setAudioResult({ success: true, public_url: existingAudioUrl });
    }
  }, [existingAudioUrl]);

  const downloadAudio = () => {
    if (!audioUrl) return;
    const link = document.createElement("a");
    link.href = audioUrl;
    link.download = "story-magic.mp3";
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return {
    audioUrl,
    audioResult,
    generateAudio: (projectId: string, directorJson: any, useRunAudio = false) =>
      generateAudioMutation.mutateAsync({ projectId, directorJson, useRunAudio }),
    downloadAudio,
    isGenerating: generateAudioMutation.isPending,
    generateError: generateAudioMutation.error,
  };
};
