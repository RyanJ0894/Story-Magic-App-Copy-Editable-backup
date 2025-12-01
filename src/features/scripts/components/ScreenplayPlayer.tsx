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

interface DisplayLine {
  id: string;
  type: 'scene_heading' | 'character' | 'dialogue' | 'action';
  text: string;
  character?: string;
  voice_key?: string;
  start: number;
  duration: number;
  end: number;
  sceneId: string;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function extractDisplayLines(chunks: ChunkProgressData[]): DisplayLine[] {
  const lines: DisplayLine[] = [];
  let lineIndex = 0;
  let lastCharacter = '';
  let lastSceneId = '';
  
  for (const chunk of chunks) {
    const sceneId = chunk.chunk_id || chunk.scene_title;
    
    if (sceneId !== lastSceneId) {
      const firstLine = chunk.lines?.[0];
      const sceneStart = firstLine?.start ?? 0;
      
      lines.push({
        id: `scene_heading_${lineIndex++}`,
        type: 'scene_heading',
        text: chunk.scene_title || `Scene ${sceneId.replace('scene_', '')}`,
        start: sceneStart,
        duration: 0,
        end: sceneStart,
        sceneId: sceneId,
      });
      lastSceneId = sceneId;
      lastCharacter = '';
    }
    
    if (!chunk.lines) continue;
    
    for (const line of chunk.lines) {
      const lineStart = line.start ?? 0;
      const lineDuration = line.duration ?? 2;
      const lineEnd = lineStart + lineDuration;
      const lineCharacter = line.character || 'NARRATOR';
      const lineType = line.type || (lineCharacter.toUpperCase() === 'NARRATOR' ? 'action' : 'dialogue');
      
      if (lineCharacter !== lastCharacter && lineCharacter.toUpperCase() !== 'NARRATOR') {
        lines.push({
          id: `character_${lineIndex++}`,
          type: 'character',
          text: lineCharacter,
          character: lineCharacter,
          voice_key: line.voice_key,
          start: lineStart,
          duration: 0,
          end: lineStart,
          sceneId: sceneId,
        });
        lastCharacter = lineCharacter;
      }
      
      lines.push({
        id: `line_${lineIndex++}`,
        type: lineType as 'action' | 'dialogue',
        text: line.text || '',
        character: lineCharacter,
        voice_key: line.voice_key,
        start: lineStart,
        duration: lineDuration,
        end: lineEnd,
        sceneId: sceneId,
      });
    }
  }
  
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
  
  const displayLines = useMemo(() => extractDisplayLines(chunks), [chunks]);
  
  const currentLineId = useMemo(() => {
    for (let i = displayLines.length - 1; i >= 0; i--) {
      const line = displayLines[i];
      if (line.type === 'dialogue' || line.type === 'action') {
        if (currentTime >= line.start && currentTime < line.end) {
          return line.id;
        }
      }
    }
    
    for (let i = 0; i < displayLines.length; i++) {
      const line = displayLines[i];
      if (line.type === 'dialogue' || line.type === 'action') {
        if (currentTime < line.end) {
          return line.id;
        }
      }
    }
    
    return null;
  }, [displayLines, currentTime]);
  
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
  
  const getLineClassName = (line: DisplayLine): string => {
    const baseClasses = 'transition-all duration-200';
    const isActive = line.id === currentLineId;
    
    const currentActiveCharacter = displayLines.find(l => l.id === currentLineId)?.character;
    const isCharacterOfActive = line.type === 'character' && currentActiveCharacter === line.character;
    
    switch (line.type) {
      case 'scene_heading':
        return `${baseClasses} font-mono text-sm uppercase tracking-wider text-sky-400 mb-6 mt-8 first:mt-0 font-bold`;
      case 'action':
        return `${baseClasses} font-mono text-sm leading-relaxed mb-4 ${
          isActive 
            ? 'bg-sky-500/20 text-sky-200 px-2 py-1 -mx-2 rounded' 
            : 'text-slate-300'
        }`;
      case 'character':
        return `${baseClasses} font-mono text-sm uppercase tracking-wide mt-6 mb-1 ml-[35%] font-semibold ${
          isCharacterOfActive 
            ? 'text-sky-300' 
            : 'text-slate-200'
        }`;
      case 'dialogue':
        return `${baseClasses} font-mono text-sm leading-relaxed ml-[25%] max-w-[35ch] mb-4 ${
          isActive 
            ? 'bg-sky-500/20 text-sky-200 px-2 py-1 -mx-2 rounded' 
            : 'text-slate-300'
        }`;
      default:
        return `${baseClasses} font-mono text-sm`;
    }
  };
  
  return (
    <div className="flex flex-col h-[80vh] border border-slate-700 rounded-lg bg-slate-900 overflow-hidden">
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-8 py-6"
        style={{
          scrollBehavior: 'smooth',
        }}
      >
        <div className="max-w-3xl mx-auto">
          {displayLines.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">
              <p>No script content to display</p>
            </div>
          ) : (
            displayLines.map((line) => {
              const isActive = line.id === currentLineId;
              const isClickable = line.type === 'dialogue' || line.type === 'action';
              
              return (
                <div
                  key={line.id}
                  ref={isActive ? activeLineRef : null}
                  className={getLineClassName(line)}
                  onClick={() => {
                    if (isClickable) {
                      onSeek(line.start);
                    }
                  }}
                  style={{
                    cursor: isClickable ? 'pointer' : 'default',
                  }}
                  data-testid={`screenplay-line-${line.id}`}
                >
                  {line.text}
                </div>
              );
            })
          )}
        </div>
      </div>
      
      <div className="border-t border-slate-700 bg-slate-900/95 backdrop-blur-sm p-4">
        <div className="max-w-3xl mx-auto space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-400 w-12">
              {formatTime(currentTime)}
            </span>
            <Slider
              value={[currentTime]}
              min={0}
              max={duration || 1}
              step={0.1}
              onValueChange={handleSliderChange}
              className="flex-1"
              data-testid="slider-playback"
            />
            <span className="text-xs font-mono text-slate-400 w-12 text-right">
              {formatTime(duration)}
            </span>
          </div>
          
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={skipBackward}
              className="text-slate-300 hover:text-white"
              data-testid="button-skip-backward"
            >
              <SkipBack className="h-4 w-4" />
            </Button>
            
            <Button
              variant="default"
              size="icon"
              onClick={() => onPlayPause(!isPlaying)}
              className="h-12 w-12 bg-sky-500 hover:bg-sky-600 text-white"
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
              className="text-slate-300 hover:text-white"
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
