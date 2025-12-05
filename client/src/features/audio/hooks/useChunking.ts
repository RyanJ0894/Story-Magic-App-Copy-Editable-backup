import { useState, useCallback } from 'react';
import { chunkText } from '@/features/timeline/lib/text-chunker';
import { processChunks } from '@/features/timeline/services/chunk-api';
import type { TextChunk } from '@/features/timeline/lib/text-chunker';
import type { ChunkData } from '@/features/timeline/types';

export const useChunking = () => {
  const [chunks, setChunks] = useState<TextChunk[]>([]);
  const [processedChunks, setProcessedChunks] = useState<ChunkData[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Chunk text from PDF upload
  const chunkTextFromPdf = useCallback((text: string) => {
    try {
      setError(null);
      
      // Use the chunking function from text-chunker
      const textChunks = chunkText(text, {
        maxChunkLength: 2000,
        overlap: 200,
        minChunkLength: 500
      });

      console.log('📄 PDF text chunked into:', textChunks.length, 'chunks');
      console.log('📋 Chunks:', textChunks);
      
      setChunks(textChunks);
      return textChunks;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to chunk text';
      setError(errorMsg);
      console.error('❌ Chunking failed:', errorMsg);
      return [];
    }
  }, []);

  // Process chunks through API simulation
  const processChunksWithApi = useCallback(async (projectId: string) => {
    if (chunks.length === 0) {
      console.warn('⚠️ No chunks to process');
      return [];
    }

    setIsProcessing(true);
    setError(null);

    try {
      console.log('🚀 Processing chunks through API simulation...');
      
      const results = await processChunks(chunks, {
        projectId,
        voiceSettings: {
          provider: "elevenlabs",
          voiceKey: "MF3mGyEYCl7XYWbV9V6O",
          language: "en-US"
        },
        audioSettings: {
          music: true,
          ambience: true,
          sfx: false
        }
      }, 3); // Process 3 chunks at a time

      const successfulChunks = results
        .filter(result => result.success && result.data)
        .map(result => result.data!);

      console.log('✅ Successfully processed chunks:', successfulChunks);
      setProcessedChunks(successfulChunks);
      
      return successfulChunks;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to process chunks';
      setError(errorMsg);
      console.error('❌ Chunk processing failed:', errorMsg);
      return [];
    } finally {
      setIsProcessing(false);
    }
  }, [chunks]);

  // Clear all chunks
  const clearChunks = useCallback(() => {
    setChunks([]);
    setProcessedChunks([]);
    setError(null);
  }, []);

  return {
    chunks,
    processedChunks,
    isProcessing,
    error,
    chunkTextFromPdf,
    processChunksWithApi,
    clearChunks
  };
};
