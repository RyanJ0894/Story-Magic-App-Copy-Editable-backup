import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useCreateProject } from './useProject';
import { useDirector } from '@/hooks/useDirector';
import { useChunking } from '@/features/audio/hooks/useChunking';
import type { TextChunk } from '@/features/timeline/lib/text-chunker';
import type { ChunkData } from '@/features/timeline/types';

export const useProjectCreation = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const createProjectMutation = useCreateProject();
  const {
    directorJson,
    waitingForDirector,
    directorError,
    triggerDirector,
    handleDirectorComplete,
    clearDirectorData
  } = useDirector();

  const [title, setTitle] = useState("Untitled Project");
  const [script, setScript] = useState(`EXT. PARK – DAY
NARRATOR: A gentle breeze moves through the trees as Mary and John walk.
MARY: It's peaceful here.
JOHN: Yeah, let's keep moving.`);
  const [doDirector, setDoDirector] = useState(true);
  const [doAudio, setDoAudio] = useState(false);
  const [projectId, setProjectId] = useState<string>("");
  const [generatedChunks, setGeneratedChunks] = useState<TextChunk[]>([]);
  const [processedChunks, setProcessedChunks] = useState<ChunkData[]>([]);

  // Chunking hook
  const { processChunksWithApi } = useChunking();

  // Handle chunks generated from PDF
  const handleChunksGenerated = (chunks: TextChunk[]) => {
    console.log('📄 Chunks generated from PDF:', chunks);
    setGeneratedChunks(chunks);
  };

  // Handle project creation
  const handleCreateProject = async () => {
    try {
      clearDirectorData();
      
      const result = await createProjectMutation.mutateAsync({ title, script });
      setProjectId(result.id);

      // Process chunks if we have them
      if (generatedChunks.length > 0) {
        console.log('🚀 Processing chunks for project:', result.id);
        const processed = await processChunksWithApi(result.id);
        setProcessedChunks(processed);
        
        // TODO: Save processed chunks to project in database
        console.log('💾 Processed chunks ready to save:', processed);
      }

      if (doDirector) {
        toast({
          title: "AI Director Started",
          description: "Processing your script... This may take a few moments.",
          variant: "default",
          duration: 3000
        });
        await triggerDirector(result.id, script);
      }

      if (doAudio && !doDirector) {
        toast({
          title: "Notice",
          description: "Please enable AI Director to generate audio automatically.",
          variant: "default"
        });
      } else if (!doDirector) {
        toast({
          title: "Project Created",
          description: "Project created successfully! You can head to your Dashboard.",
          variant: "default"
        });
      }

      return result;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message ?? "Failed to create project",
        variant: "destructive"
      });
      throw error;
    }
  };

  // Handle director status changes with toasts
  useEffect(() => {
    if (waitingForDirector) {
      toast({
        title: "AI Director Analysis Started",
        description: "Analyzing your script... This may take a few moments.",
        variant: "default",
        duration: 3000
      });
    }
  }, [waitingForDirector, toast]);

  useEffect(() => {
    if (directorJson && !waitingForDirector) {
      toast({
        title: "AI Director Analysis Complete",
        description: "Your script has been successfully analyzed!",
        variant: "default"
      });
    }
  }, [directorJson, waitingForDirector, toast]);

  useEffect(() => {
    if (directorError) {
      toast({
        title: directorError.includes("timeout") ? "Analysis Timeout" : "AI Director Analysis Failed",
        description: directorError,
        variant: "destructive"
      });
    }
  }, [directorError, toast]);

  return {
    // State
    title,
    setTitle,
    script,
    setScript,
    doDirector,
    setDoDirector,
    doAudio,
    setDoAudio,
    projectId,
    setProjectId,
    
    // Chunks state
    generatedChunks,
    processedChunks,
    handleChunksGenerated,
    
    // Director state
    directorJson,
    waitingForDirector,
    directorError,
    handleDirectorComplete,
    clearDirectorData,
    
    // Actions
    handleCreateProject,
    isCreating: createProjectMutation.isPending,
    createError: createProjectMutation.error,
  };
};
