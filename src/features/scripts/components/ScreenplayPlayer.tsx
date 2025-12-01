import { useRef, useEffect, useMemo } from 'react';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

interface ScreenplayPlayerProps {
  scriptText: string;
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

function parseScreenplay(scriptText: string, totalDuration: number): ScriptLine[] {
  if (!scriptText || !scriptText.trim()) {
    return [];
  }

  const rawLines = scriptText.split('\n');
  
  const sceneHeadingPattern = /^(INT\.|EXT\.|INT\/EXT\.|I\/E\.).*$/i;
  const transitionPattern = /^(FADE IN:|FADE OUT:|CUT TO:|DISSOLVE TO:|SMASH CUT:|MATCH CUT:).*$/i;
  const characterPattern = /^[A-Z][A-Z\s\.']+(\s*\([^)]+\))?$/;
  const parentheticalPattern = /^\([^)]+\)$/;
  
  let currentCharacter = '';
  let lastLineWasCharacter = false;
  
  const parsedLines: { type: string; text: string; character?: string; charWeight: number }[] = [];
  
  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i].trim();
    
    if (!line) {
      lastLineWasCharacter = false;
      continue;
    }
    
    if (sceneHeadingPattern.test(line)) {
      parsedLines.push({ type: 'scene_heading', text: line, charWeight: 0 });
      currentCharacter = '';
      lastLineWasCharacter = false;
    } else if (transitionPattern.test(line)) {
      parsedLines.push({ type: 'transition', text: line, charWeight: 0 });
      lastLineWasCharacter = false;
    } else if (parentheticalPattern.test(line) && currentCharacter) {
      parsedLines.push({ type: 'parenthetical', text: line, character: currentCharacter, charWeight: 0 });
      lastLineWasCharacter = false;
    } else if (characterPattern.test(line) && line.length < 40) {
      const charName = line.replace(/\s*\([^)]+\)$/, '').trim();
      if (charName.length > 1 && !charName.startsWith('(')) {
        currentCharacter = charName;
        parsedLines.push({ type: 'character', text: charName, character: charName, charWeight: 0 });
        lastLineWasCharacter = true;
      }
    } else if (lastLineWasCharacter || currentCharacter) {
      parsedLines.push({ type: 'dialogue', text: line, character: currentCharacter, charWeight: line.length });
      lastLineWasCharacter = false;
    } else {
      parsedLines.push({ type: 'action', text: line, charWeight: line.length });
      lastLineWasCharacter = false;
    }
  }
  
  const totalWeight = parsedLines.reduce((sum, l) => sum + l.charWeight, 0);
  
  if (totalWeight === 0) {
    return parsedLines.map((line, index) => ({
      id: `line_${index}`,
      type: line.type as ScriptLine['type'],
      text: line.text,
      character: line.character,
      start: 0,
      duration: 0,
      end: 0,
    }));
  }
  
  const effectiveDuration = Math.max(totalDuration, 1);
  
  const lines: ScriptLine[] = [];
  let currentTime = 0;
  let lineIndex = 0;
  
  for (const parsedLine of parsedLines) {
    const lineStart = currentTime;
    const lineDuration = parsedLine.charWeight > 0 
      ? (parsedLine.charWeight / totalWeight) * effectiveDuration
      : 0;
    
    lines.push({
      id: `line_${lineIndex++}`,
      type: parsedLine.type as ScriptLine['type'],
      text: parsedLine.text,
      character: parsedLine.character,
      start: lineStart,
      duration: lineDuration,
      end: lineStart + lineDuration,
    });
    
    currentTime += lineDuration;
  }
  
  return lines;
}

export default function ScreenplayPlayer({
  scriptText,
  currentTime,
  isPlaying,
  duration,
  onSeek,
  onPlayPause,
}: ScreenplayPlayerProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);
  
  const scriptLines = useMemo(() => parseScreenplay(scriptText, duration), [scriptText, duration]);
  
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
        return `${baseClasses} font-mono text-sm uppercase tracking-wider text-amber-500 dark:text-amber-400 mb-6 mt-8 first:mt-0 font-bold`;
      case 'action':
        return `${baseClasses} font-mono text-sm leading-relaxed mb-4 max-w-[60ch] ${
          isActive 
            ? 'bg-amber-500/20 text-amber-200 px-2 py-1 -mx-2 rounded' 
            : 'text-foreground/80'
        }`;
      case 'character':
        return `${baseClasses} font-mono text-sm uppercase tracking-wide mt-6 mb-1 ml-[35%] font-semibold ${
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
    <div className="flex flex-col h-[70vh] border rounded-lg bg-zinc-900 overflow-hidden">
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-8 py-6"
        style={{
          scrollBehavior: 'smooth',
        }}
      >
        <div className="max-w-2xl mx-auto">
          {scriptLines.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">
              <p>No script content to display</p>
            </div>
          ) : (
            scriptLines.map((line, index) => {
              const isActive = line.id === currentLineId;
              
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
            })
          )}
        </div>
      </div>
      
      <div className="border-t border-zinc-800 bg-zinc-900/95 backdrop-blur-sm p-4">
        <div className="max-w-2xl mx-auto space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-zinc-400 w-12">
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
            <span className="text-xs font-mono text-zinc-400 w-12 text-right">
              {formatTime(duration)}
            </span>
          </div>
          
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={skipBackward}
              className="text-zinc-300 hover:text-white"
              data-testid="button-skip-backward"
            >
              <SkipBack className="h-4 w-4" />
            </Button>
            
            <Button
              variant="default"
              size="icon"
              onClick={() => onPlayPause(!isPlaying)}
              className="h-12 w-12 bg-amber-500 hover:bg-amber-600 text-black"
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
              className="text-zinc-300 hover:text-white"
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
