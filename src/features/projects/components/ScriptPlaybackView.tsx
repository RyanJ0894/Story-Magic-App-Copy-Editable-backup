import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause, Download } from "lucide-react";

interface ScriptPlaybackViewProps {
  script: string;
  audioUrl: string;
  onBack?: () => void;
}

export function ScriptPlaybackView({ script, audioUrl, onBack }: ScriptPlaybackViewProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const scriptContainerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [highlightedLineIndex, setHighlightedLineIndex] = useState(0);
  
  // Split script into lines - KEEP blank lines for proper screenplay spacing
  const scriptLines = script.split('\n');
  
  // Calculate which line should be highlighted based on current time
  useEffect(() => {
    if (duration > 0) {
      // Rough estimate: distribute lines evenly across the audio duration
      const timePerLine = duration / scriptLines.length;
      const currentLineIndex = Math.min(
        Math.floor(currentTime / timePerLine),
        scriptLines.length - 1
      );
      setHighlightedLineIndex(currentLineIndex);
    }
  }, [currentTime, duration, scriptLines.length]);

  // Auto-scroll to highlighted line
  useEffect(() => {
    if (scriptContainerRef.current) {
      const highlightedElement = scriptContainerRef.current.querySelector(
        `[data-line-index="${highlightedLineIndex}"]`
      );
      if (highlightedElement) {
        highlightedElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }
    }
  }, [highlightedLineIndex]);

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    setHighlightedLineIndex(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Determine if a line is a scene heading (all caps)
  const isSceneHeading = (line: string) => {
    return line === line.toUpperCase() && line.trim().length > 0 && /^[A-Z\s\.\-]+$/.test(line.trim());
  };

  // Determine if a line is a character name (indented and all caps before dialogue)
  const isCharacterName = (line: string, index: number) => {
    const trimmed = line.trim();
    const isAllCaps = trimmed === trimmed.toUpperCase() && /^[A-Z\s\(\)]+$/.test(trimmed);
    const isShort = trimmed.length < 40;
    
    // Check if next line exists and is likely dialogue
    const nextLine = scriptLines[index + 1];
    const hasDialogueAfter = nextLine && nextLine.trim().length > 0 && !isSceneHeading(nextLine);
    
    return isAllCaps && isShort && hasDialogueAfter;
  };

  // Determine if a line is an action/description (not heading, not character, not dialogue after character)
  const isAction = (line: string, index: number) => {
    if (index === 0) return false;
    const prevLine = scriptLines[index - 1];
    return !isSceneHeading(line) && !isCharacterName(prevLine, index - 1);
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex flex-col">
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        data-testid="audio-player"
      />

      {/* Header */}
      <div className="sticky top-0 z-50 bg-[#0f0f0f] border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4 mb-4">
            {onBack && (
              <Button
                variant="ghost"
                onClick={onBack}
                data-testid="button-back"
              >
                ← Back
              </Button>
            )}
            <div className="flex-1" />
            <a
              href={audioUrl}
              download
              data-testid="button-download-audio"
            >
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </a>
          </div>

          {/* Audio Controls */}
          <div className="p-4 bg-[#1a1a1a] border border-gray-800 rounded-md">
            <div className="flex items-center gap-4">
              <Button
                size="icon"
                variant="default"
                onClick={handlePlayPause}
                data-testid="button-play-pause"
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5 ml-0.5" />
                )}
              </Button>

              <div className="flex-1">
                <div className="flex items-center justify-between text-sm text-gray-400 mb-1">
                  <span data-testid="text-current-time">{formatTime(currentTime)}</span>
                  <span data-testid="text-duration">{formatTime(duration)}</span>
                </div>
                
                <div className="relative h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="absolute top-0 left-0 h-full bg-yellow-500 transition-all duration-200"
                    style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                    data-testid="progress-bar"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Script Content */}
      <div
        ref={scriptContainerRef}
        className="flex-1 overflow-y-auto"
        data-testid="script-container"
      >
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="font-mono text-sm leading-relaxed">
            {scriptLines.map((line, index) => {
              const isHighlighted = index === highlightedLineIndex && line.trim();
              const isHeading = isSceneHeading(line);
              const isChar = isCharacterName(line, index);
              const isActionLine = isAction(line, index);
              const isBlank = !line.trim();

              let lineClasses = "transition-all duration-300 px-3 py-1.5 rounded min-h-[1.5rem] ";
              
              if (isHighlighted) {
                lineClasses += "bg-orange-500/20 text-orange-300 font-medium scale-[1.02] ";
              } else {
                lineClasses += "text-white ";
              }

              // Screenplay formatting
              let textClasses = "";
              if (isHeading) {
                textClasses = "font-bold tracking-wide uppercase";
              } else if (isChar) {
                textClasses = "ml-32 font-semibold uppercase";
              } else if (isActionLine) {
                textClasses = "";
              } else if (!isBlank) {
                textClasses = "ml-20 mr-20";
              }

              return (
                <div
                  key={index}
                  data-line-index={index}
                  className={lineClasses}
                  data-testid={`script-line-${index}`}
                >
                  <div className={textClasses}>
                    {line || '\u00A0'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
