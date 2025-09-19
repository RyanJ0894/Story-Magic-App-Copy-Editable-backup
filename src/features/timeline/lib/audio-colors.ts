import type { AudioType } from "@/features/timeline/types";

/**
 * Get color for audio type
 */
export function getColorForType(type: AudioType): string {
  const colors: Record<AudioType, string> = {
    music: "#8B5CF6",      // Purple
    ambience: "#10B981",   // Green
    sfx: "#F59E0B",        // Orange
    voice: "#3B82F6",      // Blue
    other: "#6B7280",      // Gray
  };
  
  return colors[type] || colors.other;
}

/**
 * Get all available colors for audio types
 */
export function getAllAudioColors(): Record<AudioType, string> {
  return {
    music: "#8B5CF6",
    ambience: "#10B981", 
    sfx: "#F59E0B",
    voice: "#3B82F6",
    other: "#6B7280",
  };
}
