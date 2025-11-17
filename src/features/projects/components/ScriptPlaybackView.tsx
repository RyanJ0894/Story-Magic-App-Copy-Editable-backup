import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause, Download } from "lucide-react";
import { parseScreenplayLines, type ScreenplayBlock } from "../utils/screenplayParser";

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
  
  // Parse script into screenplay blocks
  const screenplayBlocks = parseScreenplayLines(script);
  const totalLines = script.split('\n').length;
  
  // Calculate which line should be highlighted based on current time
  useEffect(() => {
    if (duration > 0) {
      // Rough estimate: distribute lines evenly across the audio duration
      const timePerLine = duration / totalLines;
      const currentLineIndex = Math.min(
        Math.floor(currentTime / timePerLine),
        totalLines - 1
      );
      setHighlightedLineIndex(currentLineIndex);
    }
  }, [currentTime, duration, totalLines]);

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
        {/* Fixed-width screenplay container (60 characters wide, standard screenplay width) */}
        <div className="w-full max-w-[60ch] mx-auto px-4 py-8">
          <div className="font-mono text-sm leading-6 w-[60ch]">
            {screenplayBlocks.map((block, blockIndex) => {
              const isHighlighted = block.lineIndex === highlightedLineIndex && block.text.trim();

              // Base classes for all blocks
              let blockClasses = "transition-all duration-300 min-h-[1.5rem] ";
              
              if (isHighlighted) {
                blockClasses += "bg-orange-500/20 text-orange-300 font-medium ";
              } else {
                blockClasses += "text-white ";
              }

              // Type-specific formatting per industry standard (using character positions)
              let contentClasses = "";
              
              switch (block.type) {
                case 'scene_heading':
                  // Scene headings: left-aligned, bold, uppercase
                  contentClasses = "font-bold uppercase";
                  break;
                  
                case 'character':
                  // Character names: centered at ~3.7" from left (37 chars in 60-char page)
                  // Using flex with margin-left to position, then center the text
                  contentClasses = "ml-[22ch] text-left uppercase font-semibold";
                  break;
                  
                case 'parenthetical':
                  // Parentheticals: indented ~3.1" from left (31 chars in 60-char page)
                  contentClasses = "ml-[18ch]";
                  break;
                  
                case 'dialogue':
                  // Dialogue: indented ~2.5" from left, width ~3.5" (25 to 60 chars in 60-char page)
                  // Left margin of 15ch, right margin creates ~35ch column width
                  contentClasses = "ml-[15ch] mr-[10ch]";
                  break;
                  
                case 'transition':
                  // Transitions: right-aligned across full 60ch width
                  contentClasses = "text-right uppercase font-semibold";
                  break;
                  
                case 'action':
                  // Action: left-aligned, full width
                  contentClasses = "";
                  break;
                  
                case 'blank':
                  // Blank lines: preserve spacing
                  contentClasses = "";
                  break;
              }

              return (
                <div
                  key={blockIndex}
                  data-line-index={block.lineIndex}
                  className={blockClasses}
                  data-testid={`script-line-${block.lineIndex}`}
                >
                  <div className={contentClasses}>
                    {block.text || '\u00A0'}
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
