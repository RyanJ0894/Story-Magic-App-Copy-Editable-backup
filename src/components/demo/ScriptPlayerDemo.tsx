import { useState, useEffect } from "react";
import ScriptPlayer from "@/features/scripts/components/ScriptPlayer";
import AudioPlayer from "@/features/scripts/components/AudioPlayer";
import type { ChunkProgressData } from "@/features/projects/project-chunk.type";

interface ScriptPlayerDemoProps {
  chunks: ChunkProgressData[];
  isVisible?: boolean;
}

export default function ScriptPlayerDemo({ chunks, isVisible = false }: ScriptPlayerDemoProps) {
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(15);

  // Calculate duration from chunks
  useEffect(() => {
    if (chunks.length > 0) {
      let maxEndTime = 0;
      chunks.forEach(chunk => {
        chunk.lines.forEach((line: any) => {
          const endTime = line.start + line.duration;
          if (endTime > maxEndTime) maxEndTime = endTime;
        });

        [...chunk.audio_direction.music, ...chunk.audio_direction.ambience, ...chunk.audio_direction.sfx].forEach((audio: any) => {
          const endTime = audio.start + audio.duration;
          if (endTime > maxEndTime) maxEndTime = endTime;
        });
      });

      if (maxEndTime > 0) {
        setDuration(Math.ceil(maxEndTime));
      }
    }
  }, [chunks]);

  // Simple timer for demo
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime(prev => {
          const newTime = prev + 0.1;
          if (newTime >= duration) {
            setIsPlaying(false);
            return duration;
          }
          return newTime;
        });
      }, 100);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, duration]);

  const handleSeek = (time: number) => {
    setCurrentTime(time);
  };

  const handlePlayPause = (playing: boolean) => {
    setIsPlaying(playing);
  };

  const handleLineChange = (lineId: string) => {
    console.log("Active line changed:", lineId);
  };

  const handleVoiceChange = (lineId: string, voiceKey: string) => {
    console.log("Voice changed:", lineId, voiceKey);
  };

  const handleVolumeChange = (trackId: string, volume: number) => {
    console.log("Volume changed:", trackId, volume);
  };

  const handleSfxChange = (trackId: string, sfxKey: string) => {
    console.log("SFX changed:", trackId, sfxKey);
  };

  if (!isVisible || chunks.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Script Player Demo</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Demo script player
        </p>
      </div>

      {/* Audio Player - handles actual audio playback */}
      <AudioPlayer 
        chunks={chunks}
        currentTime={currentTime}
        isPlaying={isPlaying}
      />

      <ScriptPlayer 
        chunks={chunks} 
        currentTime={currentTime}
        isPlaying={isPlaying}
        duration={duration}
        onSeek={handleSeek}
        onPlayPause={handlePlayPause}
        onLineChange={handleLineChange}
        onVoiceChange={handleVoiceChange}
        onVolumeChange={handleVolumeChange}
        onSfxChange={handleSfxChange}
      />
    </div>
  );
}
