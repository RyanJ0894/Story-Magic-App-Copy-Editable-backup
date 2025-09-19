import React from "react";
import TimelineRuler from "./TimelineRuler";
import TimelinePlayhead from "./TimelinePlayhead";
import TimelineCard from "./TimelineCard";
import { useTimelinePlayback } from "@/feature/timeline/hooks/useTimelinePlayback";
import { useTimelineItems } from "@/feature/timeline/hooks/useTimelineItems";
import { Play, Pause, Download, Music, Volume2, VolumeX, Eye, EyeOff, Trash2 } from "lucide-react";
import type { BasicTimelineProps } from "@/feature/timeline/types";

export default function BasicTimeline({ 
  duration, 
  pixelsPerSecond = 80, 
  secondsPerMark = 1, 
  height = 50, 
  items,
  onItemsChange,
  onPlayPause,
  onSeek
}: BasicTimelineProps) {
  const {
    isPlaying,
    setIsPlaying,
    rows,
    updateRow,
    deleteRow,
    exportItems,
    handlePlayPause,
    handleSeek,
  } = useTimelineItems(items);

  const {
    currentTime,
    setCurrentTime,
    play,
    pause,
    toggle,
    seek,
  } = useTimelinePlayback({
    duration,
    isPlaying,
    onTimeUpdate: (time) => {
      setCurrentTime(time);
    },
    onPlaybackEnd: () => {
      setIsPlaying(false);
    },
  });

  const labelWidth = 220; // space for row controls
  const timelineWidth = duration * pixelsPerSecond;
  const rowHeight = height;
  const contentHeight = rows.length * rowHeight;

  const handlePlayPauseClick = () => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
    setIsPlaying(!isPlaying);
    onPlayPause?.(!isPlaying);
  };

  const handleSeekClick = (time: number) => {
    seek(time);
    setCurrentTime(time);
    onSeek?.(time);
  };

  const handleExport = () => {
    const exportedItems = exportItems();
    console.log("Export timeline items:", JSON.stringify(exportedItems, null, 2));
    onItemsChange?.(exportedItems);
  };

  const handleClickSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left - labelWidth;
    const t = Math.max(0, Math.min(duration, x / pixelsPerSecond));
    handleSeekClick(t);
  };

  return (
    <div className="border rounded-md bg-background overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b bg-muted/30 sticky top-0 z-40">
        <div className="text-sm text-muted-foreground">
          Time: {currentTime.toFixed(2)}s / {duration.toFixed(2)}s
        </div>
        <div className="mx-1 h-5 w-px bg-muted-foreground mr-auto" />
        <button 
          onClick={handlePlayPauseClick}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          {isPlaying ? "Pause" : "Play"}
        </button>
        <button 
          onClick={handleExport}
          className="flex items-center gap-2 px-3 py-1.5 text-sm border border-input bg-background rounded-md hover:bg-accent"
        >
          <Download className="w-4 h-4" />
          Export JSON
        </button>
      </div>

      {/* Internal editor scroll area with custom thin scrollbar */}
      <div 
        className="thin-scrollbar overflow-x-auto overflow-y-hidden" 
        style={{ height: contentHeight + 28 }}
      >
        <div 
          className="relative select-none" 
          style={{ width: labelWidth + timelineWidth }} 
          onClick={handleClickSeek}
        >
          <TimelineRuler 
            duration={duration} 
            pixelsPerSecond={pixelsPerSecond} 
            secondsPerMark={secondsPerMark} 
            contentLeftOffset={labelWidth} 
          />

          <div className="relative" style={{ height: contentHeight }}>
            {/* Row controls column */}
            <div 
              className="absolute inset-y-0 left-0 border-r bg-muted/20" 
              style={{ width: labelWidth }}
            >
              {rows.map((row, idx) => (
                <div 
                  key={row.id} 
                  className="flex items-center justify-between px-2 border-b" 
                  style={{ height: rowHeight }}
                >
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Music className="w-4 h-4" />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        updateRow(idx, { muted: !row.muted }); 
                      }}
                      title={row.muted ? "Unmute" : "Mute"}
                      className="relative"
                    >
                      {row.muted ? <VolumeX className="w-4 h-4 text-destructive" /> : <Volume2 className="w-4 h-4 text-muted-foreground" />}
                    </button>
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        updateRow(idx, { hidden: !row.hidden }); 
                      }} 
                      title={row.hidden ? "Show" : "Hide"}
                    >
                      {row.hidden ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
                    </button>
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        deleteRow(idx); 
                      }} 
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Rows plane */}
            <div 
              className="relative" 
              style={{ 
                marginLeft: labelWidth, 
                width: timelineWidth, 
                height: contentHeight 
              }}
            >
              <TimelinePlayhead 
                time={currentTime} 
                pixelsPerSecond={pixelsPerSecond} 
                totalHeight={contentHeight} 
                contentLeftOffset={0} 
              />
              {rows.map((c, idx) => (
                <div 
                  key={c.id} 
                  className="absolute left-0 right-0" 
                  style={{ top: idx * rowHeight, height: rowHeight }}
                >
                  <div 
                    className={`w-full h-full relative ${c.hidden ? "opacity-40" : "opacity-100"}`} 
                    style={{ width: "100%", height: "100%", position: "relative" }}
                  >
                    <TimelineCard
                      data={c}
                      pixelsPerSecond={pixelsPerSecond}
                      trackHeight={rowHeight}
                      currentTime={currentTime}
                      isPlaying={isPlaying}
                      onChange={(next) => updateRow(idx, next)}
                      onMetaChange={(meta) => updateRow(idx, meta)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
