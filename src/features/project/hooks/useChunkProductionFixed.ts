// src/features/project/hooks/useChunkProductionFixed.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import chunkData from "@/features/timeline/data/chunk.json";

// Types
export interface ProjectChunk {
  id: string;
  chunk_key: string;
  project_id: string;
  scene_title: string;
  version: number;
  content: string;
  chunk_index: number;
  start?: number;
  duration?: number;
  status: 'pending' | 'processing' | 'done' | 'error';
  lines?: any;
  audio_direction?: any;
  director_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ChunkCreateData {
  projectId: string;
  script: string;
}

// Generate mock data from chunk.json
const generateMockChunkData = async (chunk: ProjectChunk) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Generate unique data for each chunk - giữ nguyên timing gốc
  return {
    lines: chunkData.lines.map((line, index) => ({
      ...line,
      line_id: `${chunk.chunk_key}_${index + 1}`,
      // Giữ nguyên start và duration từ chunk.json
      start: line.start || 0,
      duration: line.duration || 3
    })),
    audio_direction: {
      ...chunkData.audio_direction,
      music: chunkData.audio_direction.music.map(track => ({
        ...track,
        track_id: `${chunk.chunk_key}_${track.track_id}`,
        // Giữ nguyên start từ chunk.json
        start: track.start || 0
      })),
      ambience: chunkData.audio_direction.ambience.map(track => ({
        ...track,
        track_id: `${chunk.chunk_key}_${track.track_id}`,
        // Giữ nguyên start từ chunk.json
        start: track.start || 0
      })),
      sfx: chunkData.audio_direction.sfx.map(track => ({
        ...track,
        track_id: `${chunk.chunk_key}_${track.track_id}`,
        // Giữ nguyên start từ chunk.json
        start: track.start || 0
      }))
    },
    director_notes: `Processed chunk ${chunk.chunk_key}: ${chunkData.director_notes}`
  };
};

export const useChunkProductionFixed = (projectId: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch chunks for this project
  const { data: chunks = [], isLoading: isLoadingChunks } = useQuery({
    queryKey: ['project-chunks', projectId],
    queryFn: async (): Promise<ProjectChunk[]> => {
      if (!projectId) return [];
      
      const { data, error } = await supabase
        .from('project_chunks')
        .select('*')
        .eq('project_id', projectId)
        .order('chunk_index');

      if (error) throw error;
      return (data || []) as ProjectChunk[];
    },
    enabled: !!projectId
  });

  // Step 1: Create chunks with pending status
  const createChunksMutation = useMutation({
    mutationFn: async (data: ChunkCreateData): Promise<ProjectChunk[]> => {
      console.log('🔄 Step 1: Creating chunks with pending status...');
      
      // Chunking logic (simple by double line breaks)
      const scriptLines = data.script.split('\n');
      const chunks: { sceneTitle: string; content: string }[] = [];
      let currentChunk = { sceneTitle: '', content: '' };
      
      for (const line of scriptLines) {
        const trimmedLine = line.trim();
        if (trimmedLine === '') {
          // Double line break - end current chunk
          if (currentChunk.content.trim()) {
            chunks.push({ ...currentChunk });
            currentChunk = { sceneTitle: '', content: '' };
          }
        } else if (trimmedLine.startsWith('EXT.') || trimmedLine.startsWith('INT.')) {
          // Scene header
          currentChunk.sceneTitle = trimmedLine;
        } else {
          // Content line
          currentChunk.content += (currentChunk.content ? '\n' : '') + trimmedLine;
        }
      }
      
      // Add last chunk if exists
      if (currentChunk.content.trim()) {
        chunks.push({ ...currentChunk });
      }
      
      if (chunks.length === 0) {
        throw new Error('No chunks created from script');
      }
      
      // Insert chunks into database
      const chunkInserts = chunks.map((chunk, index) => ({
        chunk_key: `chunk_${data.projectId}_${index + 1}`,
        project_id: data.projectId,
        scene_title: chunk.sceneTitle || `Scene ${index + 1}`,
        content: chunk.content,
        chunk_index: index + 1,
        status: 'pending' as const
      }));
      
      const { data: insertedChunks, error } = await supabase
        .from('project_chunks')
        .insert(chunkInserts)
        .select('*');
        
      if (error) throw error;
      
      console.log(`✅ Created ${insertedChunks.length} chunks with pending status`);
      return insertedChunks as ProjectChunk[];
    },
    onSuccess: () => {
      // Invalidate chunks query to refetch
      queryClient.invalidateQueries({ queryKey: ['project-chunks', projectId] });
      toast({
        title: "Chunks Created",
        description: "Chunks created with pending status",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
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
      
      console.log(`📊 All chunks for project ${projectId}:`, chunksToProcess);
      
      if (!chunksToProcess || chunksToProcess.length === 0) {
        console.log('❌ No pending chunks to process');
        throw new Error('No pending chunks to process');
      }
      
      console.log(`✅ Found ${chunksToProcess.length} chunks to process:`, chunksToProcess.map(c => c.chunk_key));

      // Process chunks in parallel
      const processChunk = async (chunk: ProjectChunk) => {
        try {
          console.log(`🔄 Processing chunk: ${chunk.chunk_key}`);
          
          const { error: updateError } = await supabase
            .from('project_chunks')
            .update({ status: 'processing' })
            .eq('id', chunk.id);

          if (updateError) {
            console.error(`Failed to update chunk ${chunk.chunk_key} to processing:`, updateError);
            return;
          }

          console.log(`⏳ Processing chunk ${chunk.chunk_key} for 4 seconds...`);
          await new Promise(resolve => setTimeout(resolve, 4000));

          const mockData = await generateMockChunkData(chunk as ProjectChunk);

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
            return;
          }

          console.log(`✅ Chunk processed: ${chunk.chunk_key}`);
        } catch (error) {
          console.error(`Error processing chunk ${chunk.chunk_key}:`, error);
          await supabase
            .from('project_chunks')
            .update({ status: 'error' })
            .eq('id', chunk.id);
        }
      };

      // Process all chunks in parallel
      await Promise.all(chunksToProcess.map(chunk => processChunk(chunk as ProjectChunk)));

      console.log('✅ All chunks processed successfully!');
    },
    onSuccess: () => {
      // Invalidate chunks query to refetch
      queryClient.invalidateQueries({ queryKey: ['project-chunks', projectId] });
      toast({
        title: "Chunks Processed",
        description: "All chunks processed successfully!",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
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
