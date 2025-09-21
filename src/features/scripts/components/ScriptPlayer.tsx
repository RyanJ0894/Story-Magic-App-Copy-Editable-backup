import { Clock } from "lucide-react";
import ScriptEditModal from "./ScriptEditModal";
import { ScriptHeader } from "./ScriptHeader";
import { ScriptPlaybackControls } from "./ScriptPlaybackControls";
import { ScriptEvent } from "./ScriptEvent";
import { useScriptPlayer } from "../hooks/useScriptPlayer";
import type { ScriptPlayerProps } from "../types";

export default function ScriptPlayer({ 
  chunks, 
  currentTime,
  isPlaying = false,
  duration = 30,
  onSeek, 
  onPlayPause,
  onLineChange,
  onVoiceChange,
  onVolumeChange,
  onSfxChange
}: ScriptPlayerProps) {
  const {
    scrollAreaRef,
    activeItems,
    isSelectionMode,
    selectedItems,
    isEditModalOpen,
    timelineEvents,
    groupedEvents,
    toggleSelectionMode,
    toggleItemSelection,
    selectAllItems,
    clearSelection,
    handleVoiceChange,
    handleSfxChange,
    handleBulkSave,
    setIsEditModalOpen,
    isItemActive,
    calculateProgress
  } = useScriptPlayer(chunks, currentTime, onLineChange);

  const handleEventClick = (event: any) => {
    onSeek?.(event.start);
  };

  if (chunks.length === 0) {
    return (
      <div className="h-[500px] border rounded-lg bg-card flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <Clock className="h-8 w-8 mx-auto mb-2" />
          <p>Waiting for chunks to be created...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg bg-card">
      <ScriptHeader
        isSelectionMode={isSelectionMode}
        selectedItemsCount={selectedItems.size}
        onToggleSelectionMode={toggleSelectionMode}
        onSelectAll={selectAllItems}
        onClearSelection={clearSelection}
        onEditSelected={() => setIsEditModalOpen(true)}
      />

      <ScriptPlaybackControls
        currentTime={currentTime}
        isPlaying={isPlaying}
        duration={duration}
        onSeek={onSeek || (() => {})}
        onPlayPause={onPlayPause || (() => {})}
      />

      <div 
        ref={scrollAreaRef}
        className="max-h-[800px] overflow-y-auto thin-scrollbar"
      >
        <div className="p-4 space-y-4">
          {chunks.map((chunk, chunkIndex) => {
            const chunkEvents = timelineEvents.filter(event => {
              if (event.type === 'script') {
                return chunk.lines.some(line => line.line_id === event.id);
              } else {
                return [...chunk.audio_direction.music, ...chunk.audio_direction.ambience, ...chunk.audio_direction.sfx]
                  .some(audio => event.id.includes(audio.track_id));
              }
            });

            return (
              <div key={chunkIndex} className="space-y-3">
                {/* Scene Title */}
                <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b pb-2 z-10">
                  <h4 className="font-medium text-foreground/80 text-sm uppercase tracking-wide">
                    {chunk.scene_title}
                  </h4>
                </div>

                {/* Events for this chunk */}
                <div className="space-y-1">
                  {chunkEvents.map((event) => {
                    const isActive = isItemActive(event);
                    const isSelected = selectedItems.has(event.id);
                    
                    return (
                      <ScriptEvent
                        key={event.id}
                        event={event}
                        isActive={isActive}
                        isSelected={isSelected}
                        isSelectionMode={isSelectionMode}
                        progress={isActive ? calculateProgress(event) : 0}
                        onEventClick={handleEventClick}
                        onToggleSelection={toggleItemSelection}
                        onItemActive={isItemActive}
                        calculateProgress={calculateProgress}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Edit Modal */}
      <ScriptEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        selectedItems={selectedItems}
        chunks={chunks}
        onSave={handleBulkSave}
      />
    </div>
  );
}