import { Music, Zap, Wind, Volume2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { formatTime } from "../lib";
import type { TimelineEvent } from "../types";

interface ScriptEventProps {
  event: TimelineEvent;
  isActive: boolean;
  isSelected: boolean;
  isSelectionMode: boolean;
  progress: number;
  onEventClick: (event: TimelineEvent) => void;
  onToggleSelection: (eventId: string) => void;
  onItemActive: (event: TimelineEvent) => boolean;
  calculateProgress: (event: TimelineEvent) => number;
}

const getAudioIcon = (subtype: string) => {
  switch(subtype) {
    case 'music': return Music;
    case 'ambience': return Wind;
    case 'sfx': return Zap;
    default: return Volume2;
  }
};

export const ScriptEvent = ({
  event,
  isActive,
  isSelected,
  isSelectionMode,
  progress,
  onEventClick,
  onToggleSelection,
  onItemActive,
  calculateProgress
}: ScriptEventProps) => {
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
        onClick={() => isSelectionMode ? onToggleSelection(event.id) : onEventClick(event)}
      >
        <div className="flex gap-4">
          {/* Checkbox for selection mode */}
          {isSelectionMode && (
            <div className="flex items-center">
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => onToggleSelection(event.id)}
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
        onClick={() => isSelectionMode ? onToggleSelection(event.id) : onEventClick(event)}
      >
        <div className="flex gap-4">
          {/* Checkbox for selection mode */}
          {isSelectionMode && (
            <div className="flex items-center">
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => onToggleSelection(event.id)}
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
};
