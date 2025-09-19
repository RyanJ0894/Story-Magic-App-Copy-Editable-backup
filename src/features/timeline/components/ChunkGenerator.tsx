import React from "react";
import { Button } from "@/components/ui/button";
import { Play, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { chunkText } from "@/features/timeline/lib/text-chunker";
import type { TextChunk } from "@/features/timeline/lib/text-chunker";
import type { ChunkData } from "@/features/timeline/types";
import { processChunks } from "../services/chunk-api";

export type ChunkGeneratorProps = {
  text: string;
  projectId: string;
  onChunksGenerated?: (chunks: ChunkData[]) => void;
  onError?: (error: string) => void;
};

type ProcessingState = {
  isProcessing: boolean;
  currentChunk: number;
  totalChunks: number;
  successCount: number;
  errorCount: number;
  results: Array<{
    chunkId: string;
    success: boolean;
    error?: string;
  }>;
};

export default function ChunkGenerator({ 
  text, 
  projectId, 
  onChunksGenerated, 
  onError 
}: ChunkGeneratorProps) {
  const [processingState, setProcessingState] = React.useState<ProcessingState>({
    isProcessing: false,
    currentChunk: 0,
    totalChunks: 0,
    successCount: 0,
    errorCount: 0,
    results: []
  });

  const [chunks, setChunks] = React.useState<TextChunk[]>([]);

  const handleGenerateChunks = async () => {
    if (!text.trim()) {
      onError?.("No text to process");
      return;
    }

    try {
      setProcessingState({
        isProcessing: true,
        currentChunk: 0,
        totalChunks: 0,
        successCount: 0,
        errorCount: 0,
        results: []
      });

      // Step 1: Chunk the text
      console.log("📝 Chunking text...");
      const textChunks = chunkText(text, {
        maxChunkLength: 2000,
        overlap: 200,
        minChunkLength: 500
      });

      console.log(`📦 Generated ${textChunks.length} chunks:`, textChunks);
      setChunks(textChunks);

      setProcessingState(prev => ({
        ...prev,
        totalChunks: textChunks.length
      }));

      // Step 2: Process chunks through API
      console.log("🚀 Processing chunks through API...");
      const results = await processChunks(textChunks, {
        projectId,
        audioSettings: {
          music: true,
          ambience: true,
          sfx: false
        }
      }, 2); // Process 2 chunks at a time

      // Step 3: Process results
      const successResults = results.filter(r => r.success);
      const errorResults = results.filter(r => !r.success);
      const chunkData = successResults.map(r => r.data!);

      console.log(`✅ Processing complete: ${successResults.length} success, ${errorResults.length} errors`);
      console.log("📊 Generated chunk data:", chunkData);

      setProcessingState(prev => ({
        ...prev,
        isProcessing: false,
        successCount: successResults.length,
        errorCount: errorResults.length,
        results: results.map(r => ({
          chunkId: r.chunkId,
          success: r.success,
          error: r.error
        }))
      }));

      // Notify parent component
      if (chunkData.length > 0) {
        onChunksGenerated?.(chunkData);
      }

      if (errorResults.length > 0) {
        onError?.(`${errorResults.length} chunks failed to process`);
      }

    } catch (error) {
      console.error("❌ Chunk generation failed:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      onError?.(errorMessage);
      
      setProcessingState(prev => ({
        ...prev,
        isProcessing: false
      }));
    }
  };

  const progressPercentage = processingState.totalChunks > 0 
    ? (processingState.successCount + processingState.errorCount) / processingState.totalChunks * 100 
    : 0;

  return (
    <div className="space-y-4">
      {/* Generate Button */}
      <div className="flex items-center gap-4">
        <Button
          onClick={handleGenerateChunks}
          disabled={processingState.isProcessing || !text.trim()}
          className="flex items-center gap-2"
        >
          {processingState.isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Generate Chunks
            </>
          )}
        </Button>

        {processingState.isProcessing && (
          <div className="text-sm text-muted-foreground">
            {processingState.successCount + processingState.errorCount} / {processingState.totalChunks} processed
          </div>
        )}
      </div>

      {/* Progress Bar */}
      {processingState.isProcessing && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Processing Chunks</span>
            <span>{Math.round(progressPercentage)}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Results Summary */}
      {!processingState.isProcessing && processingState.totalChunks > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1 text-green-600">
              <CheckCircle className="w-4 h-4" />
              {processingState.successCount} success
            </div>
            {processingState.errorCount > 0 && (
              <div className="flex items-center gap-1 text-destructive">
                <AlertCircle className="w-4 h-4" />
                {processingState.errorCount} errors
              </div>
            )}
          </div>

          {/* Chunk Preview */}
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {chunks.map((chunk, index) => {
              const result = processingState.results.find(r => r.chunkId === chunk.id);
              return (
                <div 
                  key={chunk.id}
                  className="flex items-center justify-between p-2 rounded border text-sm"
                >
                  <div className="flex items-center gap-2">
                    {result?.success ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : result?.error ? (
                      <AlertCircle className="w-4 h-4 text-destructive" />
                    ) : (
                      <div className="w-4 h-4 rounded-full bg-muted" />
                    )}
                    <div>
                      <div className="font-medium">{chunk.scene_title}</div>
                      <div className="text-xs text-muted-foreground">
                        {chunk.text.length} chars • {chunk.duration}s
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Chunk {index + 1}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
