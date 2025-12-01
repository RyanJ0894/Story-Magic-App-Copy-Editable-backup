import { useRef, useEffect, useMemo } from 'react';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import type { ChunkProgressData } from '@/features/projects/project-chunk.type';

interface ScreenplayPlayerProps {
  chunks: ChunkProgressData[];
  currentTime: number;
  isPlaying: boolean;
  duration: number;
  onSeek: (time: number) => void;
  onPlayPause: (playing: boolean) => void;
}

interface ScriptLine {
  id: string;
  type: 'scene_heading' | 'action' | 'character' | 'dialogue' | 'parenthetical' | 'transition';
  text: string;
  character?: string;
  start: number;
  duration: number;
  end: number;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function parseScriptLines(chunks: ChunkProgressData[]): ScriptLine[] {
  const lines: ScriptLine[] = [];
  
  chunks.forEach((chunk) => {
    if (chunk.scene_title) {
      lines.push({
        id: `scene_${chunk.chunk_id}`,
        type: 'scene_heading',
        text: chunk.scene_title,
        start: chunk.lines[0]?.start || 0,
        duration: 0,
        end: chunk.lines[0]?.start || 0,
      });
    }
    
    chunk.lines.forEach((line: any) => {
      const lineType = line.type?.toLowerCase() || 'dialogue';
      const character = line.tts_settings?.character || line.character || '';
      
      if (lineType === 'narration' || lineType === 'action' || !character) {
        lines.push({
          id: line.line_id,
          type: 'action',
          text: line.text,
          start: line.start,
          duration: line.duration,
          end: line.start + line.duration,
        });
      } else {
        lines.push({
          id: `char_${line.line_id}`,
          type: 'character',
          text: character.toUpperCase(),
          character: character,
          start: line.start,
          duration: 0,
          end: line.start,
        });
        
        lines.push({
          id: line.line_id,
          type: 'dialogue',
          text: line.text,
          character: character,
          start: line.start,
          duration: line.duration,
          end: line.start + line.duration,
        });
      }
    });
  });
  
  return lines;
}

export default function ScreenplayPlayer({
  chunks,
  currentTime,
  isPlaying,
  duration,
  onSeek,
  onPlayPause,
}: ScreenplayPlayerProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);
  
  const scriptLines = useMemo(() => parseScriptLines(chunks), [chunks]);
  
  const currentLineId = useMemo(() => {
    for (let i = scriptLines.length - 1; i >= 0; i--) {
      const line = scriptLines[i];
      if (line.type === 'dialogue' || line.type === 'action') {
        if (currentTime >= line.start && currentTime < line.end) {
          return line.id;
        }
      }
    }
    return null;
  }, [scriptLines, currentTime]);
  
  useEffect(() => {
    if (activeLineRef.current && scrollContainerRef.current && isPlaying) {
      const container = scrollContainerRef.current;
      const activeLine = activeLineRef.current;
      
      const containerRect = container.getBoundingClientRect();
      const lineRect = activeLine.getBoundingClientRect();
      
      const lineTop = lineRect.top - containerRect.top + container.scrollTop;
      const targetScroll = lineTop - containerRect.height / 3;
      
      container.scrollTo({
        top: targetScroll,
        behavior: 'smooth'
      });
    }
  }, [currentLineId, isPlaying]);
  
  const handleSliderChange = (value: number[]) => {
    onSeek(value[0]);
  };
  
  const skipBackward = () => {
    onSeek(Math.max(0, currentTime - 10));
  };
  
  const skipForward = () => {
    onSeek(Math.min(duration, currentTime + 10));
  };
  
  const getLineClassName = (line: ScriptLine): string => {
    const baseClasses = 'transition-all duration-200';
    const isActive = line.id === currentLineId;
    const isCharacterOfActive = line.type === 'character' && 
      scriptLines.find(l => l.id === currentLineId)?.character === line.character &&
      scriptLines.findIndex(l => l.id === line.id) === 
      scriptLines.findIndex(l => l.id === currentLineId) - 1;
    
    switch (line.type) {
      case 'scene_heading':
        return `${baseClasses} font-mono text-sm uppercase tracking-wider text-muted-foreground mb-6 mt-8 first:mt-0`;
      case 'action':
        return `${baseClasses} font-mono text-sm leading-relaxed mb-4 max-w-[60ch] ${
          isActive 
            ? 'bg-amber-500/20 text-amber-200 px-2 py-1 -mx-2 rounded' 
            : 'text-foreground/90'
        }`;
      case 'character':
        return `${baseClasses} font-mono text-sm uppercase tracking-wide mt-6 mb-1 ml-[35%] ${
          isCharacterOfActive 
            ? 'text-amber-300' 
            : 'text-foreground'
        }`;
      case 'dialogue':
        return `${baseClasses} font-mono text-sm leading-relaxed ml-[25%] max-w-[35ch] mb-4 ${
          isActive 
            ? 'bg-amber-500/20 text-amber-200 px-2 py-1 -mx-2 rounded' 
            : 'text-foreground/90'
        }`;
      case 'parenthetical':
        return `${baseClasses} font-mono text-sm italic ml-[30%] text-muted-foreground mb-1`;
      case 'transition':
        return `${baseClasses} font-mono text-sm uppercase text-right text-muted-foreground mt-6 mb-6`;
      default:
        return `${baseClasses} font-mono text-sm`;
    }
  };
  
  return (
    <div className="flex flex-col h-[70vh] border rounded-lg bg-background/95 overflow-hidden">
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-8 py-6 screenplay-scroll"
        style={{
          scrollBehavior: 'smooth',
        }}
      >
        <div className="max-w-2xl mx-auto">
          {scriptLines.map((line, index) => {
            const isActive = line.id === currentLineId;
            const isCharacterOfActive = line.type === 'character' && 
              scriptLines.find(l => l.id === currentLineId)?.character === line.character &&
              index === scriptLines.findIndex(l => l.id === currentLineId) - 1;
            
            return (
              <div
                key={line.id}
                ref={isActive ? activeLineRef : null}
                className={getLineClassName(line)}
                onClick={() => {
                  if (line.type === 'dialogue' || line.type === 'action') {
                    onSeek(line.start);
                  }
                }}
                style={{
                  cursor: (line.type === 'dialogue' || line.type === 'action') ? 'pointer' : 'default',
                }}
                data-testid={`screenplay-line-${line.id}`}
              >
                {line.text}
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="border-t bg-card/50 backdrop-blur-sm p-4">
        <div className="max-w-2xl mx-auto space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-muted-foreground w-12">
              {formatTime(currentTime)}
            </span>
            <Slider
              value={[currentTime]}
              min={0}
              max={duration}
              step={0.1}
              onValueChange={handleSliderChange}
              className="flex-1"
              data-testid="slider-playback"
            />
            <span className="text-xs font-mono text-muted-foreground w-12 text-right">
              {formatTime(duration)}
            </span>
          </div>
          
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={skipBackward}
              data-testid="button-skip-backward"
            >
              <SkipBack className="h-4 w-4" />
            </Button>
            
            <Button
              variant="default"
              size="icon"
              onClick={() => onPlayPause(!isPlaying)}
              className="h-12 w-12"
              data-testid="button-play-pause"
            >
              {isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5 ml-0.5" />
              )}
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={skipForward}
              data-testid="button-skip-forward"
            >
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
