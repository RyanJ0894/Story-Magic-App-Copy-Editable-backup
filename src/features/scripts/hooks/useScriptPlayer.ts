import { useState, useEffect, useMemo, useRef } from 'react';
import type { TimelineEvent, AudioControls } from '../types';
import type { ChunkData } from '@/features/timeline/types';
import { createTimelineEvents, groupEventsByTime, filterEventsByChunk, isItemActive, calculateProgress } from '../lib';
import { DEFAULT_AUDIO_CONTROLS } from '../constants';

export function useScriptPlayer(
  chunks: ChunkData[],
  currentTime: number,
  onLineChange?: (lineId: string) => void
) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [activeItems, setActiveItems] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [audioControls, setAudioControls] = useState<AudioControls>(DEFAULT_AUDIO_CONTROLS);

  // Create timeline events
  const timelineEvents = useMemo(() => {
    return createTimelineEvents(chunks);
  }, [chunks]);

  // Group events by time
  const groupedEvents = useMemo(() => {
    return groupEventsByTime(timelineEvents);
  }, [timelineEvents]);

  // Find active items
  useEffect(() => {
    const active = new Set<string>();
    
    timelineEvents.forEach(event => {
      if (isItemActive(event, currentTime)) {
        active.add(event.id);
        if (event.type === 'script') {
          onLineChange?.(event.id);
        }
      }
    });

    setActiveItems(active);

    // Auto scroll to active script line
    const activeScriptEvent = timelineEvents.find(event => 
      event.type === 'script' && active.has(event.id)
    );
    
    if (activeScriptEvent) {
      setTimeout(() => {
        const element = document.getElementById(`event-${activeScriptEvent.id}`);
        if (element && scrollAreaRef.current) {
          element.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center'
          });
        }
      }, 50);
    }
  }, [currentTime, timelineEvents, onLineChange]);

  // Selection handlers
  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    if (isSelectionMode) {
      setSelectedItems(new Set());
    }
  };

  const toggleItemSelection = (itemId: string) => {
    if (!isSelectionMode) return;
    
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const selectAllItems = () => {
    const allItemIds = timelineEvents.map(event => event.id);
    setSelectedItems(new Set(allItemIds));
  };

  const clearSelection = () => {
    setSelectedItems(new Set());
  };

  // Audio control handlers
  const handleVoiceChange = (lineId: string, voiceKey: string) => {
    setAudioControls(prev => ({
      ...prev,
      selectedVoices: {
        ...prev.selectedVoices,
        [lineId]: voiceKey
      }
    }));
  };

  const handleSfxChange = (trackId: string, sfxKey: string) => {
    setAudioControls(prev => ({
      ...prev,
      selectedSfx: {
        ...prev.selectedSfx,
        [trackId]: sfxKey
      }
    }));
  };

  const handleBulkSave = (changes: any) => {
    console.log('Bulk save changes:', changes);
    // TODO: Implement bulk save logic
  };

  return {
    // Refs
    scrollAreaRef,
    
    // State
    activeItems,
    isSelectionMode,
    selectedItems,
    isEditModalOpen,
    audioControls,
    
    // Computed
    timelineEvents,
    groupedEvents,
    
    // Actions
    toggleSelectionMode,
    toggleItemSelection,
    selectAllItems,
    clearSelection,
    handleVoiceChange,
    handleSfxChange,
    handleBulkSave,
    setIsEditModalOpen,
    
    // Utilities
    isItemActive: (event: TimelineEvent) => isItemActive(event, currentTime),
    calculateProgress: (event: TimelineEvent) => {
      if (event.type === 'script') {
        return calculateProgress(currentTime, event.start, event.duration);
      }
      return 0;
    }
  };
}
