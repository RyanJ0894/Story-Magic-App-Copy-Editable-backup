import type { TimelineEvent, AudioControls } from '../types';
import type { ChunkProgressData } from '@/features/projects/project-chunk.type';

/**
 * Create timeline events from chunks data
 */
export function createTimelineEvents(chunks: ChunkProgressData[]): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  
  chunks.forEach(chunk => {
    // Add script lines
    chunk.lines.forEach(line => {
      events.push({
        id: line.line_id,
        type: 'script',
        subtype: line.type,
        start: line.start,
        duration: line.duration,
        data: line
      });
    });

    // Add audio events
    [...chunk.audio_direction.music, ...chunk.audio_direction.ambience, ...chunk.audio_direction.sfx].forEach(audio => {
      const audioType = chunk.audio_direction.music.includes(audio) ? 'music' : 
                       chunk.audio_direction.ambience.includes(audio) ? 'ambience' : 'sfx';
      
      // Determine action based on duration (0 = end, >0 = start)
      const action = audio.duration === 0 ? 'end' : 'start';
      
      events.push({
        id: audio.track_id + '_' + action,
        type: 'audio',
        subtype: audioType,
        start: audio.start,
        duration: 0, // System messages are instant
        data: audio,
        action: action
      });
    });
  });

  return events.sort((a, b) => {
    if (a.start === b.start) {
      // Audio events first, then script
      return a.type === 'audio' ? -1 : 1;
    }
    return a.start - b.start;
  });
}

/**
 * Group events that happen at the same time
 */
export function groupEventsByTime(events: TimelineEvent[]): { time: number; events: TimelineEvent[] }[] {
  const groups: { time: number; events: TimelineEvent[] }[] = [];
  let currentGroup: { time: number; events: TimelineEvent[] } | null = null;
  let currentTime = -1;

  events.forEach(event => {
    if (event.start !== currentTime) {
      // New time point
      if (currentGroup) groups.push(currentGroup);
      currentGroup = {
        time: event.start,
        events: [event]
      };
      currentTime = event.start;
    } else {
      // Same time point, add to current group
      currentGroup!.events.push(event);
    }
  });
  
  if (currentGroup) groups.push(currentGroup);
  return groups;
}

/**
 * Filter events by chunk
 */
export function filterEventsByChunk(events: TimelineEvent[], chunk: ChunkProgressData): TimelineEvent[] {
  return events.filter(event => {
    if (event.type === 'script') {
      return chunk.lines.some(line => line.line_id === event.id);
    } else {
      return [...chunk.audio_direction.music, ...chunk.audio_direction.ambience, ...chunk.audio_direction.sfx]
        .some(audio => event.id.includes(audio.track_id));
    }
  });
}

/**
 * Get selected events from chunks
 */
export function getSelectedEvents(selectedItems: Set<string>, chunks: ChunkProgressData[]): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  
  chunks.forEach(chunk => {
    // Script lines
    chunk.lines.forEach(line => {
      if (selectedItems.has(line.line_id)) {
      events.push({
        id: line.line_id,
        type: 'script',
        subtype: line.type,
        start: line.start,
        duration: line.duration,
        data: line
      });
      }
    });

    // Audio events
    [...chunk.audio_direction.music, ...chunk.audio_direction.ambience, ...chunk.audio_direction.sfx].forEach(audio => {
      const audioId = audio.track_id + '_start';
      if (selectedItems.has(audioId)) {
        const audioType = chunk.audio_direction.music.includes(audio) ? 'music' : 
                         chunk.audio_direction.ambience.includes(audio) ? 'ambience' : 'sfx';
      events.push({
        id: audioId,
        type: 'audio',
        subtype: audioType,
        start: audio.start,
        duration: 0,
        data: audio
      });
      }
    });
  });

  return events;
}

/**
 * Create default form values for selected events
 */
export function createDefaultFormValues(events: TimelineEvent[]): Record<string, any> {
  const defaultValues: Record<string, any> = {};
  
  events.forEach(event => {
    if (event.type === 'script') {
      defaultValues[event.id] = {
        volume: event.data.volume || 1,
        voice_key: event.data.tts_settings?.voice_key || 'natural',
        character: event.data.tts_settings?.character || '',
        style: event.data.tts_settings?.style || 'normal'
      };
    } else {
      defaultValues[event.id] = {
        volume: event.data.volume || 0.5,
        duration: event.data.duration || 0,
        fade_in: event.data.fade_in || 0,
        fade_out: event.data.fade_out || 0,
        label: event.data.label || ''
      };
    }
  });
  
  return defaultValues;
}

/**
 * Format time in MM:SS format
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Calculate progress percentage
 */
export function calculateProgress(currentTime: number, start: number, duration: number): number {
  return Math.min(1, Math.max(0, (currentTime - start) / duration));
}

/**
 * Check if item is active at current time
 */
export function isItemActive(event: TimelineEvent, currentTime: number): boolean {
  if (event.type === 'script') {
    return currentTime >= event.start && currentTime < event.start + event.duration;
  } else {
    // Audio events are "active" briefly when triggered
    return currentTime >= event.start && currentTime < event.start + 0.3;
  }
}
