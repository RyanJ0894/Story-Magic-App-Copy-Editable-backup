import React from "react";
import BasicTimeline from "./BasicTimeline";
import ChunkProgressBar from "./ChunkProgressBar";
import { convertChunksToTimelineItems, calculateTimelineDuration } from "@/features/timeline/lib/chunk-adapter";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, RefreshCw } from "lucide-react";
import type { ChunkData, TimelineItem } from "@/features/timeline/types";

type ChunkRef = {
  chunk_id: string;
  scene_title: string;
  order: number;
  start: number;
  duration: number;
};

type ChunkLoadingState = {
  chunkId: string;
  isLoading: boolean;
  data?: ChunkData;
  error?: string;
};

export type TimelineAudioProps = {
  chunks: ChunkData[];
  chunkStates?: ChunkLoadingState[];
  chunkRefs?: ChunkRef[];
  onItemsChange?: (items: TimelineItem[]) => void;
  onPlayPause?: (isPlaying: boolean) => void;
  onSeek?: (time: number) => void;
  onChunkUpdate?: (chunkId: string, updatedChunk: ChunkData) => void;
  onGenerateAudio?: (chunkId: string, lineId: string) => void;
  onVoiceChange?: (chunkId: string, lineId: string, voiceKey: string) => void;
  onRetryChunk?: (chunkId: string) => void;
};

export default function TimelineAudio({ 
  chunks, 
  chunkStates = [],
  chunkRefs = [],
  onItemsChange, 
  onPlayPause, 
  onSeek,
  onChunkUpdate,
  onGenerateAudio,
  onVoiceChange,
  onRetryChunk
}: TimelineAudioProps) {
  const [duration, setDuration] = React.useState(30);

  // Convert chunks array to timeline items with offset - optimized for async loading
  const items = React.useMemo(() => {
    console.log('🔄 Converting chunks to timeline items:', chunks);
    if (chunks.length === 0) {
      console.log('❌ No chunks to convert');
      return [];
    }
    
    chunks.forEach((chunk, index) => {
      console.log(`Chunk ${index}:`, {
        chunk_id: chunk.chunk_id,
        lines: chunk.lines?.length || 0,
        audio_direction: chunk.audio_direction ? 'exists' : 'missing',
        lines_data: chunk.lines,
        audio_direction_data: chunk.audio_direction
      });
    });
    
    const convertedItems = convertChunksToTimelineItems(chunks, 0);
    console.log('✅ Converted items:', convertedItems);
    console.log('✅ Total items count:', convertedItems.length);
    
    // Debug từng item được tạo
    convertedItems.forEach((item, index) => {
      console.log(`Timeline Item ${index}:`, {
        id: item.id,
        title: item.title,
        type: item.type,
        start: item.start,
        end: item.end,
        src: item.src || 'no audio'
      });
    });
    
    return convertedItems;
  }, [chunks]);

  // Show loading state for chunks that are still being processed
  const hasLoadingChunks = chunkStates.some(state => state.isLoading);
  const hasAnyChunks = chunkStates.length > 0;

  // Calculate auto duration from timeline items - memoized for performance
  const autoDuration = React.useMemo(() => {
    if (items.length === 0) return 0;
    return calculateTimelineDuration(items);
  }, [items]);

  // Memoize chunks info to prevent unnecessary re-renders
  const chunksInfo = React.useMemo(() => ({
    count: chunks.length,
    totalItems: items.length,
    totalDuration: autoDuration
  }), [chunks.length, items.length, autoDuration]);

  const handleItemsChange = (newItems: TimelineItem[]) => {
    console.log("Timeline items changed:", newItems);
    onItemsChange?.(newItems);
  };

  const handlePlayPause = (isPlaying: boolean) => {
    console.log("Playback state:", isPlaying ? "Playing" : "Paused");
    onPlayPause?.(isPlaying);
  };

  const handleSeek = (time: number) => {
    console.log("Seek to:", time);
    onSeek?.(time);
  };


  // Không hiển thị loading state riêng - luôn hiển thị timeline với progress bar

  // Show progress bar if chunks are still loading
  const isLoading = chunkStates.some(state => state.isLoading);
  const hasErrors = chunkStates.some(state => state.error);

  return (
    <div className="mt-10 py-4 space-y-6">
      {/* Chunk Progress Section - luôn hiển thị */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Chunk Loading Progress</h2>
        <ChunkProgressBar 
          chunkRefs={chunkRefs}
          chunkStates={chunkStates}
          onRetryChunk={onRetryChunk}
        />
      </div>

      {/* Timeline Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Timeline Audio</h2>
          <div className="text-sm text-muted-foreground">
            {chunksInfo.count} chunk{chunksInfo.count !== 1 ? 's' : ''} loaded
            {isLoading && ` • ${chunkStates.filter(s => s.isLoading).length} loading`}
            {hasErrors && ` • ${chunkStates.filter(s => s.error).length} errors`}
            {chunksInfo.totalItems > 0 && ` • ${chunksInfo.totalItems} items • ${chunksInfo.totalDuration.toFixed(1)}s total`}
          </div>
        </div>
      
        {/* Duration controls */}
        <div className="flex gap-8 items-center">
          <Label>Duration (s)</Label>
          <Input
            type="number"
            value={duration}
            min={1}
            max={600}
            className="w-20 p-4 rounded-md scroll-thin"
            onChange={(e) => setDuration(Math.max(1, Math.min(600, Number(e.target.value) || 0)))}
          />
          <p className="text-sm text-muted-foreground">
            Auto: {autoDuration.toFixed(2)}s
          </p>
        </div>
        
        {hasAnyChunks ? (
          <div className="relative">
            {items.length > 0 ? (
              <BasicTimeline 
                duration={Math.max(duration, autoDuration)} 
                pixelsPerSecond={80} 
                secondsPerMark={1} 
                height={50} 
                items={items}
                onItemsChange={handleItemsChange}
                onPlayPause={handlePlayPause}
                onSeek={handleSeek}
              />
            ) : (
              <div className="flex items-center justify-center h-32 border-2 border-dashed border-muted-foreground/25 rounded-lg">
                <div className="text-center">
                  <p className="text-muted-foreground mb-2">Waiting for chunks to load...</p>
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <span>Loading chunks...</span>
                  </div>
                </div>
              </div>
            )}
            {hasLoadingChunks && (
              <div className="absolute top-2 right-2 bg-blue-500/90 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Loading chunks...</span>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-32 border-2 border-dashed border-muted-foreground/25 rounded-lg">
            <div className="text-center">
              <p className="text-muted-foreground mb-2">Waiting for chunks to be processed...</p>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                <span>Processing chunks...</span>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Debug info - only show if items exist */}
      {items.length > 0 && (
        <div className="mt-4">
          <h2 className="text-lg font-semibold mb-2">Timeline Items ({items.length})</h2>
          <pre className="scroll-thin whitespace-pre-wrap text-xs rounded-xl bg-black/30 p-4 border border-white/10 overflow-auto max-h-60">
            {JSON.stringify(items, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
