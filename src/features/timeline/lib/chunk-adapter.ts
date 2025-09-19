import type { ChunkData, ChunkLine, AudioTrack, TimelineItem, AudioType } from "@/features/timeline/types";

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

  console.log(`🎬 Converting chunk ${chunk.chunk_id} to timeline items`);
  console.log(`🎬 Chunk lines:`, chunk.lines?.length || 0, 'lines');
  console.log(`🎬 Chunk audio_direction:`, chunk.audio_direction ? 'exists' : 'missing');

  // Convert voice lines
  const voiceItems = convertLinesToTimelineItems(chunk.lines);
  console.log(`🎬 Voice items:`, voiceItems.length, voiceItems.map(item => ({
    id: item.id,
    title: item.title,
    start: item.start,
    src: item.src 
  })));
  items.push(...voiceItems);

  // Convert audio direction tracks
  if (chunk.audio_direction) {
    console.log(`🎬 Audio direction data:`, chunk.audio_direction);
    
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
    
    console.log(`🎬 Music items:`, musicItems.length, musicItems.map(item => ({
      id: item.id,
      title: item.title,
      start: item.start,
      src: item.src 
    })));
    console.log(`🎬 Ambience items:`, ambienceItems.length, ambienceItems.map(item => ({
      id: item.id,
      title: item.title,
      start: item.start,
      src: item.src ? 'has audio' : 'no audio'
    })));
    console.log(`🎬 SFX items:`, sfxItems.length, sfxItems.map(item => ({
      id: item.id,
      title: item.title,
      start: item.start,
      src: item.src 
    })));
    
    items.push(...musicItems, ...ambienceItems, ...sfxItems);
  }

  // Sort by start time
  const sortedItems = items.sort((a, b) => a.start - b.start);
  console.log(`🎬 Final chunk items (${sortedItems.length}):`, sortedItems.map(item => ({
    id: item.id,
    title: item.title,
    type: item.type,
    start: item.start,
    end: item.end,
    src: item.src 
  })));
  
  return sortedItems;
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

  console.log('🔄 convertChunksToTimelineItems - Processing', chunks.length, 'chunks');

  for (const chunk of chunks) {
    console.log(`📦 Processing chunk ${chunk.chunk_id} with offset ${currentOffset}`);
    const chunkItems = convertChunkToTimelineItems(chunk);
    console.log(`📦 Chunk ${chunk.chunk_id} has ${chunkItems.length} items:`, chunkItems.map(item => ({
      id: item.id,
      title: item.title,
      type: item.type,
      start: item.start,
      end: item.end,
      src: item.src ? 'has audio' : 'no audio'
    })));
    
    // Apply offset to all items in this chunk
    const offsetItems = chunkItems.map(item => ({
      ...item,
      start: item.start + currentOffset,
      end: item.end + currentOffset,
    }));
    
    console.log(`📦 After offset ${currentOffset}, items become:`, offsetItems.map(item => ({
      id: item.id,
      title: item.title,
      type: item.type,
      start: item.start,
      end: item.end,
      src: item.src ? 'has audio' : 'no audio'
    })));
    
    allItems.push(...offsetItems);
    
    // Update offset for next chunk
    const chunkDuration = calculateTimelineDuration(chunkItems);
    console.log(`📦 Chunk ${chunk.chunk_id} duration: ${chunkDuration}, next offset: ${currentOffset + chunkDuration}`);
    currentOffset += chunkDuration;
  }

  console.log('✅ Final timeline items:', allItems.length, 'items');
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
