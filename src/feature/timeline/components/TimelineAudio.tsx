import React from "react";
import BasicTimeline from "./BasicTimeline";
import { convertChunksToTimelineItems, calculateTimelineDuration } from "@/feature/timeline/lib/chunk-adapter";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, RefreshCw } from "lucide-react";
import type { ChunkData, TimelineItem } from "@/feature/timeline/types";

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
    if (chunks.length === 0) return [];
    return convertChunksToTimelineItems(chunks, 0);
  }, [chunks]);

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

  // Skeleton component for loading chunks
  const ChunkSkeleton = ({ chunkRef }: { chunkRef: ChunkRef }) => (
    <div className="mb-4 p-3 bg-muted/20 rounded-lg border border-dashed border-muted-foreground/25">
      <div className="flex items-center justify-between mb-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-20" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-3/4" />
      </div>
    </div>
  );

  // Error component for failed chunks
  const ChunkError = ({ chunkRef, error, onRetry }: { chunkRef: ChunkRef; error: string; onRetry?: () => void }) => (
    <div className="mb-4 p-3 bg-destructive/10 rounded-lg border border-destructive/20">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-destructive" />
          <span className="text-sm font-medium text-destructive">{chunkRef.scene_title}</span>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-destructive/20 text-destructive rounded hover:bg-destructive/30"
          >
            <RefreshCw className="w-3 h-3" />
            Retry
          </button>
        )}
      </div>
      <p className="text-xs text-destructive/80">{error}</p>
    </div>
  );

  // Show loading state if no chunks loaded yet
  if (chunks.length === 0 && chunkStates.length === 0) {
    return (
      <div className="p-4">
        <h1 className="text-lg font-semibold mb-3">Timeline Audio Editor</h1>
        <div className="flex items-center justify-center h-64 border-2 border-dashed border-muted-foreground/25 rounded-lg">
          <p className="text-muted-foreground">Loading chunks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Chunks info */}
      <div className="mb-4 p-3 bg-muted/30 rounded-lg">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {chunksInfo.count} chunk{chunksInfo.count !== 1 ? 's' : ''} loaded
            {chunkStates.length > 0 && ` • ${chunkStates.filter(s => s.isLoading).length} loading`}
          </p>
          <div className="text-xs text-muted-foreground">
            {chunksInfo.totalItems} items • {chunksInfo.totalDuration.toFixed(1)}s total
          </div>
        </div>
      </div>

      {/* Show skeleton loading for chunks that are still loading */}
      {chunkRefs
        .filter(ref => {
          const state = chunkStates.find(s => s.chunkId === ref.chunk_id);
          return state?.isLoading;
        })
        .map(ref => (
          <ChunkSkeleton key={ref.chunk_id} chunkRef={ref} />
        ))}

      {/* Show error states for failed chunks */}
      {chunkStates
        .filter(state => state.error)
        .map(state => {
          const ref = chunkRefs.find(r => r.chunk_id === state.chunkId);
          if (!ref) return null;
          return (
            <ChunkError
              key={state.chunkId}
              chunkRef={ref}
              error={state.error!}
              onRetry={() => onRetryChunk?.(state.chunkId)}
            />
          );
        })}
      
      {/* Duration controls */}
      <div className="flex gap-8 items-center mb-4">
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
      
      {/* Timeline component - only show if we have loaded chunks */}
      {chunks.length > 0 && (
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
      )}
      
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
