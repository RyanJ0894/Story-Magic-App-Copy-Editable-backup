import { Music, Zap, Wind, Volume2, Clock, Edit, CheckSquare, Square, Play, Pause, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import ScriptEditModal from "./ScriptEditModal";
import { useScriptPlayer } from "../hooks/useScriptPlayer";
import { formatTime } from "../lib";
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

  const getAudioIcon = (subtype: string) => {
    switch(subtype) {
      case 'music': return Music;
      case 'ambience': return Wind;
      case 'sfx': return Zap;
      default: return Volume2;
    }
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
      {/* Header with Action Buttons */}
      <div className="border-b p-4 bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant={isSelectionMode ? "default" : "outline"}
              size="sm"
              onClick={toggleSelectionMode}
            >
              {isSelectionMode ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
              {isSelectionMode ? "Exit Selection" : "Select Items"}
            </Button>
            
            {isSelectionMode && (
              <>
                <Button variant="outline" size="sm" onClick={selectAllItems}>
                  Select All
                </Button>
                <Button variant="outline" size="sm" onClick={clearSelection}>
                  Clear
                </Button>
                <Badge variant="secondary">
                  {selectedItems.size} selected
                </Badge>
              </>
            )}
          </div>

          {isSelectionMode && selectedItems.size > 0 && (
            <Button 
              size="sm"
              onClick={() => setIsEditModalOpen(true)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Selected ({selectedItems.size})
            </Button>
          )}
        </div>
      </div>

      {/* Playback Controls */}
      <div className="p-4 border-b bg-muted/30">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => onPlayPause?.(!isPlaying)}
              className="h-8 w-8 p-0"
            >
              {isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onSeek?.(0)}
              className="h-8 w-8 p-0"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{formatTime(currentTime)}</span>
            <span>/</span>
            <span>{formatTime(duration)}</span>
          </div>

          <div className="flex-1 max-w-xs">
            <Slider
              value={[currentTime]}
              onValueChange={(value) => onSeek?.(value[0])}
              max={duration}
              step={0.1}
              className="w-full"
            />
          </div>
        </div>
      </div>

      <div 
        ref={scrollAreaRef}
        className="max-h-96 overflow-y-auto thin-scrollbar"
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
                  {chunkEvents.map((event, eventIndex) => {
                    const isActive = isItemActive(event);
                    const isSelected = selectedItems.has(event.id);
                    const isScript = event.type === 'script';
                    const isAudio = event.type === 'audio';
                    
                    if (isAudio) {
                      const Icon = getAudioIcon(event.subtype);
                      
                      return (
                        <div
                          key={event.id}
                          id={`event-${event.id}`}
                          className={`
                            p-3 rounded-lg cursor-pointer transition-all border
                            ${isActive 
                              ? 'bg-muted border-border shadow-sm' 
                              : 'bg-card hover:bg-muted/30 border-border'
                            }
                            ${isSelected ? 'ring-2 ring-primary' : ''}
                          `}
                          onClick={() => isSelectionMode ? toggleItemSelection(event.id) : handleEventClick(event)}
                        >
                          <div className="flex gap-4">
                            {/* Checkbox for selection mode */}
                            {isSelectionMode && (
                              <div className="flex items-center">
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={() => toggleItemSelection(event.id)}
                                />
                              </div>
                            )}
                            
                            <div className="w-12 text-right">
                              <div className="text-xs font-mono text-muted-foreground">
                                {formatTime(event.start)}
                              </div>
                            </div>

                            <div className="flex-1 min-w-0 space-y-2">
                              {/* Dòng 1: Action + Audio Type + Label */}
                              <div className="flex items-center gap-2">
                                <Icon size={16} />
                                <span className="text-sm font-medium capitalize">
                                  {event.action} {event.subtype}:
                                </span>
                                <span className="text-sm text-foreground">
                                  {event.data.label}
                                </span>
                              </div>

                              {/* Dòng 2: Thông số từ JSON */}
                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <span className="px-2 py-1 rounded bg-muted">
                                  {event.subtype}
                                </span>
                                <span>Vol: {Math.round(event.data.volume * 100)}%</span>
                                <span>Duration: {event.data.duration}s</span>
                                <span>Fade In: {event.data.fade_in}s</span>
                                <span>Fade Out: {event.data.fade_out}s</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    
                    if (isScript) {
                      const progress = isActive ? calculateProgress(event) : 0;
                      
                      return (
                        <div
                          key={event.id}
                          id={`event-${event.id}`}
                          className={`
                            relative p-4 rounded-lg cursor-pointer transition-all border
                            ${isActive 
                              ? 'bg-primary/5 border-primary/20 shadow-sm' 
                              : 'bg-card hover:bg-muted/30 border-border'
                            }
                            ${isSelected ? 'ring-2 ring-primary' : ''}
                          `}
                          onClick={() => isSelectionMode ? toggleItemSelection(event.id) : handleEventClick(event)}
                        >
                          <div className="flex gap-4">
                            {/* Checkbox for selection mode */}
                            {isSelectionMode && (
                              <div className="flex items-center">
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={() => toggleItemSelection(event.id)}
                                />
                              </div>
                            )}
                            
                            <div className="w-12 text-right">
                              <div className="text-xs font-mono text-muted-foreground">
                                {formatTime(event.start)}
                              </div>
                            </div>

                            <div className="flex-1 min-w-0 space-y-2">
                              {/* Dòng 1: Character + Script Text */}
                              <div>
                                {event.subtype === 'dialogue' && event.data.tts_settings.character && (
                                  <div className="text-sm font-medium text-foreground mb-1">
                                    {event.data.tts_settings.character}
                                  </div>
                                )}
                                <p className={`text-sm leading-relaxed ${
                                  event.subtype === 'narration' 
                                    ? 'italic text-muted-foreground' 
                                    : 'text-foreground'
                                } ${isActive ? 'font-medium' : ''}`}>
                                  {event.data.text}
                                </p>
                              </div>

                              {/* Dòng 2: Thông số từ JSON */}
                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <span className={`px-2 py-1 rounded ${
                                  event.subtype === 'narration' 
                                    ? 'bg-muted' 
                                    : 'bg-secondary'
                                }`}>
                                  {event.subtype}
                                </span>
                                <span>{event.data.duration}s</span>
                                <span>Vol: {Math.round((event.data.volume || 1) * 100)}%</span>
                                <span>Voice: {event.data.tts_settings.voice_key || 'Default'}</span>
                                <span>Style: {event.data.tts_settings.style || 'Normal'}</span>
                              </div>

                              {/* Progress bar */}
                              {isActive && progress > 0 && (
                                <div className="w-full bg-secondary rounded-full h-1">
                                  <div 
                                    className="bg-primary h-1 rounded-full transition-all duration-100"
                                    style={{ width: `${progress * 100}%` }}
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    }
                    
                    return null;
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