import { Play, Pause, RotateCcw, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { formatTime } from "../lib";

interface ScriptPlaybackControlsProps {
  currentTime: number;
  isPlaying: boolean;
  duration: number;
  onSeek: (time: number) => void;
  onPlayPause: (isPlaying: boolean) => void;
}

export const ScriptPlaybackControls = ({
  currentTime,
  isPlaying,
  duration,
  onSeek,
  onPlayPause
}: ScriptPlaybackControlsProps) => {
  return (
    <div className="p-4 border-b bg-muted/30">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => onPlayPause(!isPlaying)}
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
            onClick={() => onSeek(0)}
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
            onValueChange={(value) => onSeek(value[0])}
            max={duration}
            step={0.1}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
};
