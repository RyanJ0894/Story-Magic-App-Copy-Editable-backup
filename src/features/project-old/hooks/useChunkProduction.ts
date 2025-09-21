import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../../supabase/client';
import { chunkText } from '@/features/timeline/lib/text-chunker';
import { toast } from 'sonner';

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
  status: 'pending' | 'processing' | 'done' | 'error';
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

export const useChunkProduction = (projectId?: string) => {
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

  // Step 1: Create chunks with pending status
  const createChunksMutation = useMutation({
    mutationFn: async ({ 
      projectId, 
      script 
    }: { 
      projectId: string; 
      script: string; 
    }): Promise<ProjectChunk[]> => {
      console.log('🔄 Step 1: Creating chunks with pending status...');
      
      // Chunk the text
      const textChunks = chunkText(script, {
        maxChunkLength: 2000,
        overlap: 200,
        minChunkLength: 500
      });

      console.log('📄 Generated text chunks:', textChunks.length);

      // Create chunks in database with pending status
      const chunksToSave = textChunks.map((chunk, index) => ({
        chunk_key: `chunk_${projectId}_${index + 1}`,
        project_id: projectId,
        scene_title: chunk.scene_title,
        version: 1,
        content: chunk.text,
        chunk_index: index + 1,
        start: chunk.start,
        duration: chunk.duration,
        status: 'pending' as const,
        lines: null,
        audio_direction: null,
        director_notes: `Generated from chunk ${index + 1}: ${chunk.scene_title}`
      }));

      console.log('💾 Saving chunks to database with pending status...');

      const { data: savedChunks, error } = await supabase
        .from('project_chunks')
        .insert(chunksToSave)
        .select();

      if (error) throw error;

      console.log('✅ Successfully created chunks:', savedChunks.length);
      return savedChunks as ProjectChunk[];
    },
    onSuccess: (chunks) => {
      toast.success("Chunks Created", {
        description: `Created ${chunks.length} chunks with pending status!`,
      });
      
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: CHUNK_KEY_FACTORY.list(projectId) });
      }
    },
    onError: (error: any) => {
      console.error('❌ Chunk creation failed:', error);
      toast.error("Chunk Creation Failed", {
        description: error?.message || "Failed to create chunks",
      });
    }
  });

  // Step 2: Process chunks (simulate director function)
  const processChunksMutation = useMutation({
    mutationFn: async (projectId: string): Promise<void> => {
      console.log('🔄 Step 2: Processing chunks (simulating director function)...');
      
      // Wait a bit for chunks to be created
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Fetch chunks from database
      const { data: chunksToProcess, error: fetchError } = await supabase
        .from('project_chunks')
        .select('*')
        .eq('project_id', projectId)
        .eq('status', 'pending');
        
      if (fetchError) throw fetchError;
      
      if (!chunksToProcess || chunksToProcess.length === 0) {
        throw new Error('No pending chunks to process');
      }
      
      console.log(`Found ${chunksToProcess.length} chunks to process`);

      // Process chunks with 10s delay each
      for (const chunk of chunksToProcess) {
        try {
          console.log(`🔄 Processing chunk: ${chunk.chunk_key}`);
          
          // Update status to processing
          const { error: updateError } = await supabase
            .from('project_chunks')
            .update({ status: 'processing' })
            .eq('id', chunk.id);

          if (updateError) {
            console.error(`Failed to update chunk ${chunk.chunk_key} to processing:`, updateError);
            continue;
          }

          // Simulate processing delay (10 seconds as requested)
          console.log(`⏳ Processing chunk ${chunk.chunk_key} for 10 seconds...`);
          await new Promise(resolve => setTimeout(resolve, 10000));

          // Generate mock data from chunk.json
          const mockData = await generateMockChunkData(chunk as ProjectChunk);

          // Update chunk with completed data
          const { error: completeError } = await supabase
            .from('project_chunks')
            .update({
              status: 'done',
              lines: mockData.lines,
              audio_direction: mockData.audio_direction,
              director_notes: mockData.director_notes
            })
            .eq('id', chunk.id);

          if (completeError) {
            console.error(`Failed to complete chunk ${chunk.chunk_key}:`, completeError);
            await supabase
              .from('project_chunks')
              .update({ status: 'error' })
              .eq('id', chunk.id);
            continue;
          }

          console.log(`✅ Chunk processed: ${chunk.chunk_key}`);
        } catch (error) {
          console.error(`Error processing chunk ${chunk.chunk_key}:`, error);
          await supabase
            .from('project_chunks')
            .update({ status: 'error' })
            .eq('id', chunk.id);
        }
      }

      console.log('✅ All chunks processed successfully!');
    },
    onSuccess: () => {
      toast.success("Chunks Processed", {
        description: "All chunks have been processed successfully!",
      });
      
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: CHUNK_KEY_FACTORY.list(projectId) });
      }
    },
    onError: (error: any) => {
      console.error('❌ Chunk processing failed:', error);
      toast.error("Chunk Processing Failed", {
        description: error?.message || "Failed to process chunks",
      });
    }
  });

  return {
    chunks: chunks || [],
    isLoadingChunks,
    createChunks: createChunksMutation.mutateAsync,
    isCreatingChunks: createChunksMutation.isPending,
    processChunks: processChunksMutation.mutateAsync,
    isProcessingChunks: processChunksMutation.isPending,
    createError: createChunksMutation.error,
    processError: processChunksMutation.error,
  };
};

// Helper function to generate mock data from chunk.json
async function generateMockChunkData(chunk: ProjectChunk): Promise<{
  lines: any;
  audio_direction: any;
  director_notes: string;
}> {
  // Import chunk.json data
  const chunkData = await import('@/features/timeline/data/chunk.json');
  
  // Generate mock data based on chunk content
  const lines = chunkData.default.lines.map((line: any, index: number) => ({
    ...line,
    line_id: `${chunk.chunk_key}_line_${index + 1}`,
    text: chunk.content.split('\n')[index] || line.text,
    start: line.start + (chunk.chunk_index - 1) * 30, // Offset by chunk index
  }));

  const audio_direction = {
    music: chunkData.default.audio_direction.music.map((music: any) => ({
      ...music,
      track_id: `${chunk.chunk_key}_music_${music.track_id.split('_').pop()}`,
      duration: chunk.duration,
    })),
    ambience: chunkData.default.audio_direction.ambience.map((amb: any) => ({
      ...amb,
      track_id: `${chunk.chunk_key}_amb_${amb.track_id.split('_').pop()}`,
      duration: chunk.duration,
    })),
    sfx: chunkData.default.audio_direction.sfx.map((sfx: any) => ({
      ...sfx,
      track_id: `${chunk.chunk_key}_sfx_${sfx.track_id.split('_').pop()}`,
    }))
  };

  const director_notes = `Processed chunk ${chunk.chunk_index}: ${chunk.scene_title}. ${chunkData.default.director_notes}`;

  return {
    lines,
    audio_direction,
    director_notes
  };
}
