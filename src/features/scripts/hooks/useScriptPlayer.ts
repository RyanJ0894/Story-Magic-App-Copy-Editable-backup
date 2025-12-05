import { useState, useEffect, useMemo, useRef } from 'react';
import type { TimelineEvent, AudioControls } from '../types';
import type { ChunkProgressData } from '@/features/projects/project-chunk.type';
import { createTimelineEvents, groupEventsByTime, filterEventsByChunk, isItemActive, calculateProgress } from '../lib';
import { DEFAULT_AUDIO_CONTROLS } from '../constants';

export function useScriptPlayer(
  chunks: ChunkProgressData[],
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
    const events = createTimelineEvents(chunks);
    console.log('🎬 useScriptPlayer - timelineEvents created:', {
      chunksCount: chunks.length,
      eventsCount: events.length,
      events: events.slice(0, 3).map(e => ({
        id: e.id,
        type: e.type,
        start: e.start,
        duration: e.duration
      }))
    });
    return events;
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

    console.log('🎬 useScriptPlayer - active items update:', {
      currentTime,
      activeItemsCount: active.size,
      activeItems: Array.from(active),
      timelineEventsCount: timelineEvents.length
    });

    setActiveItems(active);

    // Auto scroll to active script line (only within ScriptPlayer)
    const activeScriptEvent = timelineEvents.find(event => 
      event.type === 'script' && active.has(event.id)
    );
    
    if (activeScriptEvent && scrollAreaRef.current) {
      setTimeout(() => {
        const element = document.getElementById(`event-${activeScriptEvent.id}`);
        if (element && scrollAreaRef.current) {
          const scrollContainer = scrollAreaRef.current;
          const containerRect = scrollContainer.getBoundingClientRect();
          const elementRect = element.getBoundingClientRect();
          
          // Check if element is visible in container
          const isVisible = elementRect.top >= containerRect.top && 
                           elementRect.bottom <= containerRect.bottom;
          
          if (!isVisible) {
            // Scroll within the container only
            const scrollTop = scrollContainer.scrollTop;
            const elementTop = element.offsetTop;
            const containerHeight = scrollContainer.clientHeight;
            const elementHeight = element.offsetHeight;
            
            const targetScrollTop = elementTop - (containerHeight / 2) + (elementHeight / 2);
            
            scrollContainer.scrollTo({
              top: Math.max(0, targetScrollTop),
              behavior: 'smooth'
            });
          }
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
