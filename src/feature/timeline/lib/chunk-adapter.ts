import type { ChunkData, ChunkLine, AudioTrack, TimelineItem, AudioType } from "@/feature/timeline/types";

/**
 * Convert chunk lines (narration/dialogue) to timeline items
 */
export function convertLinesToTimelineItems(lines: ChunkLine[]): TimelineItem[] {
  return lines.map((line) => {
    const title = line.tts_settings?.character || 
                 (line.type === "narration" ? "Narration" : "Dialogue");
    
    return {
      id: line.line_id,
      title,
      type: "voice" as AudioType,
      src: line.src || undefined,
      start: line.start,
      end: line.start + line.duration,
      volume: Math.max(0, Math.min(1, line.volume)),
      fadeIn: line.fade_in,
      fadeOut: line.fade_out,
    };
  });
}

/**
 * Convert audio tracks (music/ambience/sfx) to timeline items
 */
export function convertTracksToTimelineItems(
  tracks: AudioTrack[], 
  type: AudioType
): TimelineItem[] {
  return tracks.map((track) => ({
    id: track.track_id,
    title: track.label,
    type,
    src: track.src,
    start: track.start,
    end: track.start + track.duration,
    volume: Math.max(0, Math.min(1, track.volume)),
    fadeIn: track.fade_in,
    fadeOut: track.fade_out,
  }));
}

/**
 * Convert entire chunk data to timeline items
 */
export function convertChunkToTimelineItems(chunk: ChunkData): TimelineItem[] {
  const items: TimelineItem[] = [];

  // Convert voice lines
  const voiceItems = convertLinesToTimelineItems(chunk.lines);
  items.push(...voiceItems);

  // Convert audio direction tracks
  if (chunk.audio_direction) {
    const musicItems = convertTracksToTimelineItems(
      chunk.audio_direction.music || [], 
      "music"
    );
    const ambienceItems = convertTracksToTimelineItems(
      chunk.audio_direction.ambience || [], 
      "ambience"
    );
    const sfxItems = convertTracksToTimelineItems(
      chunk.audio_direction.sfx || [], 
      "sfx"
    );
    
    items.push(...musicItems, ...ambienceItems, ...sfxItems);
  }

  // Sort by start time
  return items.sort((a, b) => a.start - b.start);
}

/**
 * Calculate total duration from timeline items
 */
export function calculateTimelineDuration(items: TimelineItem[]): number {
  if (items.length === 0) return 0;
  return Math.max(...items.map(item => item.end));
}

/**
 * Convert multiple chunks to timeline items with offset
 */
export function convertChunksToTimelineItems(
  chunks: ChunkData[], 
  offsetStart: number = 0
): TimelineItem[] {
  const allItems: TimelineItem[] = [];
  let currentOffset = offsetStart;

  for (const chunk of chunks) {
    const chunkItems = convertChunkToTimelineItems(chunk);
    
    // Apply offset to all items in this chunk
    const offsetItems = chunkItems.map(item => ({
      ...item,
      start: item.start + currentOffset,
      end: item.end + currentOffset,
    }));
    
    allItems.push(...offsetItems);
    
    // Update offset for next chunk
    const chunkDuration = calculateTimelineDuration(chunkItems);
    currentOffset += chunkDuration;
  }

  return allItems;
}

/**
 * Export timeline items to JSON format
 */
export function exportTimelineItems(items: TimelineItem[]): string {
  const exportData = items.map(item => ({
    id: item.id,
    title: item.title,
    type: item.type,
    src: item.src,
    start: item.start,
    end: item.end,
    volume: item.volume,
    muted: item.muted,
    hidden: item.hidden,
    color: item.color,
  }));
  
  return JSON.stringify(exportData, null, 2);
}
