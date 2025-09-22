import { useState, useEffect } from "react";
import ScriptPlayer from "./ScriptPlayer";
import AudioPlayer from "./AudioPlayer";
import { ChunkProgressData } from "@/features/projects/project-chunk.type";
import chunk from "@/features/projects/data/chunk.json";

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

interface ScriptPlayerDemoProps {
  chunks: ChunkProgressData[];
  isVisible: boolean;
}

export default function ScriptPlayerDemo({ chunks, isVisible }: ScriptPlayerDemoProps) {
  const [selectedChunk, setSelectedChunk] = useState<ChunkProgressData | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  // Use provided chunks or fallback to demo chunks
  const availableChunks = chunks.length > 0 ? chunks : demoChunks;

  useEffect(() => {
    if (availableChunks.length > 0 && !selectedChunk) {
      setSelectedChunk(availableChunks[0]);
    }
  }, [availableChunks, selectedChunk]);

  const handleChunkSelect = (chunk: ChunkProgressData) => {
    setSelectedChunk(chunk);
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handlePlayPause = (playing: boolean) => {
    setIsPlaying(playing);
  };

  const handleSeek = (time: number) => {
    setCurrentTime(time);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Script Player Demo</h3>
        <div className="text-sm text-gray-600">
          {availableChunks.length} chunk(s) available
        </div>
      </div>

      {/* Chunk Selection */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Select Chunk:</label>
        <select
          value={selectedChunk?.chunk_id || ""}
          onChange={(e) => {
            const chunk = availableChunks.find(c => c.chunk_id === e.target.value);
            if (chunk) handleChunkSelect(chunk);
          }}
          className="w-full p-2 border border-gray-300 rounded-lg"
        >
          {availableChunks.map((chunk) => (
            <option key={chunk.chunk_id} value={chunk.chunk_id}>
              {chunk.scene_title} ({chunk.lines.length} lines)
            </option>
          ))}
        </select>
      </div>

      {/* Script Player */}
      {selectedChunk && (
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-2">{selectedChunk.scene_title}</h4>
            <p className="text-sm text-gray-600 mb-3">
              {selectedChunk.director_notes}
            </p>
            <ScriptPlayer
              chunks={[selectedChunk]}
              currentTime={currentTime}
              isPlaying={isPlaying}
              onSeek={handleSeek}
              onPlayPause={handlePlayPause}
            />
          </div>

          {/* Audio Player */}
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium mb-2">Audio Preview</h4>
            <AudioPlayer
              chunks={[selectedChunk]}
              currentTime={currentTime}
              isPlaying={isPlaying}
            />
          </div>
        </div>
      )}
    </div>
  );
}