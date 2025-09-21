import { useState, useEffect, useRef } from 'react';

interface UseScriptPlayerControlsProps {
  duration: number;
  onLineChange?: (lineId: string) => void;
  onVoiceChange?: (lineId: string, voiceKey: string) => void;
  onVolumeChange?: (trackId: string, volume: number) => void;
  onSfxChange?: (trackId: string, sfxKey: string) => void;
}

export const useScriptPlayerControls = ({
  duration,
  onLineChange,
  onVoiceChange,
  onVolumeChange,
  onSfxChange
}: UseScriptPlayerControlsProps) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Timer logic for playback
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentTime(prevTime => {
          const newTime = prevTime + 0.1;
          if (newTime >= duration) {
            setIsPlaying(false);
            return duration;
          }
          return newTime;
        });
      }, 100);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isPlaying, duration]);

  const handleSeek = (time: number) => {
    setCurrentTime(time);
  };

  const handlePlayPause = (playing: boolean) => {
    setIsPlaying(playing);
  };

  const handleLineChange = (lineId: string) => {
    onLineChange?.(lineId);
  };

  const handleVoiceChange = (lineId: string, voiceKey: string) => {
    onVoiceChange?.(lineId, voiceKey);
  };

  const handleVolumeChange = (trackId: string, volume: number) => {
    onVolumeChange?.(trackId, volume);
  };

  const handleSfxChange = (trackId: string, sfxKey: string) => {
    onSfxChange?.(trackId, sfxKey);
  };

  return {
    currentTime,
    isPlaying,
    handleSeek,
    handlePlayPause,
    handleLineChange,
    handleVoiceChange,
    handleVolumeChange,
    handleSfxChange,
  };
};
