import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useProjectChunks } from "../projectChunks";
import { projectChunksApi } from "../services/projectChunksApi";
import { chunkText } from "../utils/text-chunker";
import { toast } from "sonner"; 
import { ProjectChunk, ChunkCreateData } from "../project-chunk.type";
import { v4 as uuidv4 } from 'uuid';
import { runAudioForChunk, type AudioGenerationRequest, type ChunkLine, type AudioTrack } from "../../../../supabase/filmDirectorApi";

// Generate chunk data for API request
const generateChunkDataForAPI = (chunk: ProjectChunk, project: any): AudioGenerationRequest => {
  // Create lines with proper tts_settings structure
  const lines: ChunkLine[] = [
    {
      line_id: `${chunk.chunk_key}_1`,
      text: "Exterior. Park. Day.",
      type: "narration",
      start: 0,
      duration: 3,
      volume: 1,
      src: null,
      tts_settings: {
        style: "neutral, steady",
        status: "pending",
        language: "en-US",
        provider: "elevenlabs",
        character: null,
        voice_key: "MF3mGyEYCl7XYWbV9V6O",
        stability: 0.8,
        similarity_boost: 0.85,
        credits_used: 0
      }
    },
    {
      line_id: `${chunk.chunk_key}_2`,
      text: "It's peaceful here.",
      type: "dialogue",
      start: 1,
      duration: 1,
      volume: 1,
      src: null,
      tts_settings: {
        style: "soft, content",
        status: "pending",
        language: "en-US",
        provider: "elevenlabs",
        character: "MARY",
        voice_key: "ErXwobaYiN019PkySvjV",
        stability: 0.4,
        similarity_boost: 0.7,
        credits_used: 90
      }
    }
  ];

  // Create audio direction
  const audio_direction = {
    music: [
      {
        track_id: "m_jazz_retro_playful_01.mp3",
        label: "Piano Soft Mysterious",
        src: null,
        start: 0,
        duration: 20,
        volume: 0.4,
        fade_in: 1,
        fade_out: 2
      }
    ] as AudioTrack[],
    ambience: [
      {
        track_id: "a_rain_on_roof_01.wav",
        label: "Soul Jazz Love",
        src: "",
        start: 0,
        duration: 20,
        volume: 0.3,
        fade_in: 0.5,
        fade_out: 0
      }
    ] as AudioTrack[],
    sfx: [
      {
        track_id: "s_cat_meow_01.wav",
        label: "Cat Meow",
        src: "",
        start: 4,
        duration: 0.5,
        volume: 0.5,
        fade_in: 0.2,
        fade_out: 0
      }
    ] as AudioTrack[]
  };

  return {
    project: {
      id: project.id,
      title: project.title || "Untitled Project",
      created_at: project.created_at
    },
    chunks: {
      chunk_id: chunk.chunk_key,
      scene_title: chunk.scene_title,
      lines,
      audio_direction
    }
  };
};

export const useChunkProduction = (projectId?: string) => {
  const queryClient = useQueryClient();

  const { data: chunks = [], isLoading: isLoadingChunks } = useProjectChunks(projectId);

  const createChunksMutation = useMutation({
    mutationFn: async (data: ChunkCreateData): Promise<ProjectChunk[]> => {
      console.log('🔄 Step 1: Checking for existing chunks...');
      
      // Check if chunks already exist for this project
      const existingChunks = await projectChunksApi.getProjectChunks(data.projectId);
      if (existingChunks.length > 0) {
        console.log(`📊 Found ${existingChunks.length} existing chunks, skipping creation`);
        return existingChunks;
      }
      
      console.log('🔄 No existing chunks found, creating new chunks...');

      const textChunks = chunkText(data.script, {
        maxChunkLength: 2000,
        overlap: 200,
        minChunkLength: 500
      });

      console.log('📝 Text chunking result:', {
        originalScriptLength: data.script.length,
        chunksCreated: textChunks.length,
        chunks: textChunks.map(c => ({
          id: c.id,
          order: c.order,
          textLength: c.text.length,
          sceneTitle: c.scene_title,
          start: c.start,
          duration: c.duration
        }))
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

      console.log(`✅ Created ${insertedChunks.length} chunks with pending status`);
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
      console.log('🔄 Step 2: Processing chunks (calling generate-audio API)...');

      // Wait a bit for chunks to be created
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Fetch chunks from database using API
      const allChunks = await projectChunksApi.getProjectChunks(projectId);
      const chunksToProcess = allChunks.filter(chunk => chunk.status === 'pending');

      console.log(`📊 All chunks for project ${projectId}:`, allChunks.length, 'total');
      console.log(`📊 Chunks to process:`, chunksToProcess.length, 'pending');

      if (!chunksToProcess || chunksToProcess.length === 0) {
        console.log('❌ No pending chunks to process');
        // Don't throw error, just return - chunks might already be processed
        return;
      }

      console.log(`✅ Found ${chunksToProcess.length} chunks to process:`, chunksToProcess.map(c => c.chunk_key));

      // Get project info for API request
      const projectInfo = await projectChunksApi.getProjectInfo(projectId);

      // Process chunks in parallel
      const processChunk = async (chunk: ProjectChunk) => {
        try {
          console.log(`🔄 Processing chunk: ${chunk.chunk_key}`);

          // Update status to processing using API
          await projectChunksApi.updateChunkToProcessing(chunk.id);

          // Generate API request data
          const apiRequest = generateChunkDataForAPI(chunk, projectInfo);
          
          console.log(`📤 Sending chunk ${chunk.chunk_key} to generate-audio API:`, apiRequest);

          // Call the generate-audio API
          const result = await runAudioForChunk(apiRequest);
          
          console.log(`✅ API response for chunk ${chunk.chunk_key}:`, result);

          // Note: The API will automatically update the chunk status and data
          // No need to manually update here as the API handles it

        } catch (error) {
          console.error(`Error processing chunk ${chunk.chunk_key}:`, error);
          await projectChunksApi.updateChunkStatus(chunk.id, 'error');
          throw error;
        }
      };

      // Process all chunks in parallel
      await Promise.all(chunksToProcess.map(chunk => processChunk(chunk as ProjectChunk)));

      console.log('✅ All chunks sent to generate-audio API successfully!');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-chunks', projectId] });
      toast.success("Chunks sent to audio generation API");
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

    // Process chunks
    processChunks: processChunksMutation.mutateAsync,
    isProcessingChunks: processChunksMutation.isPending,
    processError: processChunksMutation.error,
  };
};
