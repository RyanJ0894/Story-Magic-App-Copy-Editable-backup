import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../../supabase/client';
import { useToast } from '@/hooks/use-toast';
import { chunkText } from '@/features/timeline/lib/text-chunker';
import { processChunks } from '@/features/timeline/services/chunk-api';
import type { TextChunk } from '@/features/timeline/lib/text-chunker';
import type { ChunkData } from '@/features/timeline/types';

export type ProjectChunk = {
  id: string;
  chunk_key: string;
  project_id: string;
  scene_title: string;
  version: number;
  content: string;
  chunk_index: number;
  start: number;
  duration: number;
  status: string;
  lines: any;
  audio_direction: any;
  director_notes: string;
  created_at: string;
  updated_at: string;
};

export const CHUNK_KEY_FACTORY = {
  all: ["project_chunks"] as const,
  lists: () => [...CHUNK_KEY_FACTORY.all, "list"] as const,
  list: (projectId: string) => [...CHUNK_KEY_FACTORY.lists(), projectId] as const,
  details: () => [...CHUNK_KEY_FACTORY.all, "detail"] as const,
  detail: (id: string) => [...CHUNK_KEY_FACTORY.details(), id] as const,
};

export const useChunkGeneration = (projectId?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get chunks for project
  const { data: chunks, isLoading: isLoadingChunks } = useQuery({
    queryKey: CHUNK_KEY_FACTORY.list(projectId!),
    queryFn: async () => {
      if (!projectId) return [];
      
      const { data, error } = await supabase
        .from('project_chunks')
        .select('*')
        .eq('project_id', projectId)
        .order('chunk_index', { ascending: true });

      if (error) throw error;
      return data as ProjectChunk[];
    },
    enabled: !!projectId,
  });

  // Generate chunks from script
  const generateChunksMutation = useMutation({
    mutationFn: async ({ 
      projectId, 
      script 
    }: { 
      projectId: string; 
      script: string; 
    }): Promise<ProjectChunk[]> => {
      console.log('🔄 Starting chunk generation for project:', projectId);
      
      // Step 1: Chunk the text
      const textChunks = chunkText(script, {
        maxChunkLength: 2000,
        overlap: 200,
        minChunkLength: 500
      });

      console.log('📄 Generated text chunks:', textChunks.length);

      // Step 2: Process chunks through API simulation
      const processedChunks = await processChunks(textChunks, {
        projectId,
        audioSettings: {
          music: true,
          ambience: true,
          sfx: false
        }
      }, 3);

      console.log('🔧 Processed chunks through API:', processedChunks.length);

      // Step 3: Save chunks to database
      const chunksToSave = processedChunks
        .filter(result => result.success && result.data)
        .map((result, index) => {
          const chunkData = result.data!;
          const textChunk = textChunks[index];
          
          return {
            chunk_key: `chunk_${projectId}_${index + 1}`,
            project_id: projectId,
            scene_title: chunkData.scene_title,
            version: 1,
            content: textChunk.text,
            chunk_index: index + 1,
            start: textChunk.start,
            duration: textChunk.duration,
            status: 'pending',
            lines: chunkData.lines,
            audio_direction: chunkData.audio_direction,
            director_notes: chunkData.director_notes || `Generated from chunk ${index + 1}`
          };
        });

      console.log('💾 Saving chunks to database:', chunksToSave.length);

      const { data: savedChunks, error } = await supabase
        .from('project_chunks')
        .insert(chunksToSave)
        .select();

      if (error) throw error;

      console.log('✅ Successfully saved chunks:', savedChunks.length);
      return savedChunks as ProjectChunk[];
    },
    onSuccess: (chunks) => {
      toast({
        title: "Chunks Generated",
        description: `Successfully generated ${chunks.length} chunks for your project!`,
        variant: "default"
      });
      
      // Invalidate chunks query
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: CHUNK_KEY_FACTORY.list(projectId) });
      }
    },
    onError: (error: any) => {
      console.error('❌ Chunk generation failed:', error);
      toast({
        title: "Chunk Generation Failed",
        description: error?.message || "Failed to generate chunks",
        variant: "destructive"
      });
    }
  });

  return {
    chunks: chunks || [],
    isLoadingChunks,
    generateChunks: generateChunksMutation.mutateAsync,
    isGenerating: generateChunksMutation.isPending,
    generateError: generateChunksMutation.error,
  };
};
