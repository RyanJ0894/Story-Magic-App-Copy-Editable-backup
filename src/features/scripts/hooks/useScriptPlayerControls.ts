import { useState, useCallback } from 'react';

interface UseScriptPlayerControlsProps {
  initialDuration?: number;
  onLineChange?: (lineId: string) => void;
  onVoiceChange?: (lineId: string, voiceKey: string) => void;
  onVolumeChange?: (trackId: string, volume: number) => void;
  onSfxChange?: (trackId: string, sfxKey: string) => void;
}

export const useScriptPlayerControls = ({
  initialDuration = 60,
  onLineChange,
  onVoiceChange,
  onVolumeChange,
  onSfxChange
}: UseScriptPlayerControlsProps = {}) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(initialDuration);

  const handleSeek = useCallback((time: number) => {
    setCurrentTime(time);
  }, []);

  const handlePlayPause = useCallback((playing: boolean) => {
    setIsPlaying(playing);
  }, []);

  const handleTimeUpdate = useCallback((time: number) => {
    setCurrentTime(time);
  }, []);

  const handleDurationChange = useCallback((newDuration: number) => {
    if (newDuration && !isNaN(newDuration) && newDuration > 0) {
      setDuration(newDuration);
    }
  }, []);

  const handleEnded = useCallback(() => {
    setIsPlaying(false);
    setCurrentTime(0);
  }, []);

  const handleLineChange = useCallback((lineId: string) => {
    onLineChange?.(lineId);
  }, [onLineChange]);

  const handleVoiceChange = useCallback((lineId: string, voiceKey: string) => {
    onVoiceChange?.(lineId, voiceKey);
  }, [onVoiceChange]);

  const handleVolumeChange = useCallback((trackId: string, volume: number) => {
    onVolumeChange?.(trackId, volume);
  }, [onVolumeChange]);

  const handleSfxChange = useCallback((trackId: string, sfxKey: string) => {
    onSfxChange?.(trackId, sfxKey);
  }, [onSfxChange]);

  return {
    currentTime,
    isPlaying,
    duration,
    handleSeek,
    handlePlayPause,
    handleTimeUpdate,
    handleDurationChange,
    handleEnded,
    handleLineChange,
    handleVoiceChange,
    handleVolumeChange,
    handleSfxChange,
  };
};
