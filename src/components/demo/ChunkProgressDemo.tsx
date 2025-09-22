import { useState, useEffect } from "react";
import { ChunkProgressData } from "@/features/projects/project-chunk.type";
import { toast } from "sonner";
import chunk from "@/features/projects/data/chunk.json";

interface ChunkProgressDemoProps {
  onChunksChange?: (chunks: ChunkProgressData[]) => void;
  onComplete?: (chunks: ChunkProgressData[]) => void;
}

// Demo data - sử dụng chunk.json
const demoChunks: ChunkProgressData[] = [
  {
    chunk_id: chunk.chunk_id,
    project_id: chunk.project_id,
    scene_title: chunk.scene_title,
    version: chunk.version,
    director_notes: chunk.director_notes,
    lines: chunk.lines,
    audio_direction: chunk.audio_direction
  }
];

export default function ChunkProgressDemo({ onChunksChange, onComplete }: ChunkProgressDemoProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("Ready to process");

  const handleStartProcessing = async () => {
    setIsProcessing(true);
    setProgress(0);
    setStatus("Creating chunks...");

    // Simulate chunk creation and processing
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 200));
      setProgress(i);
      
      if (i === 50) {
        setStatus("Processing chunks...");
      } else if (i === 100) {
        setStatus("Completed!");
      }
    }

    setIsProcessing(false);
    toast.success("Demo chunks processed!", {
      description: "Chunks are ready for playback",
    });

    // Notify parent components
    if (onChunksChange) {
      onChunksChange(demoChunks);
    }
    if (onComplete) {
      onComplete(demoChunks);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Demo Chunk Processing</h3>
        <button
          onClick={handleStartProcessing}
          disabled={isProcessing}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg"
        >
          {isProcessing ? "Processing..." : "Start Demo"}
        </button>
      </div>

      {isProcessing && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>{status}</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {!isProcessing && progress === 100 && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 text-sm">
            ✅ Demo chunks are ready! You can now use the script player below.
          </p>
        </div>
      )}
    </div>
  );
}
