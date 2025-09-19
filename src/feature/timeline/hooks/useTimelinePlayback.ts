import { useState, useRef, useCallback, useEffect } from "react";
import type { UseTimelinePlaybackProps, UseTimelinePlaybackReturn } from "@/feature/timeline/types";

/**
 * Hook for timeline playback functionality
 */
export function useTimelinePlayback({
  duration,
  isPlaying,
  onTimeUpdate,
  onPlaybackEnd,
}: UseTimelinePlaybackProps): UseTimelinePlaybackReturn {
  const [currentTime, setCurrentTime] = useState(0);
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);

  const tick = useCallback((ts: number) => {
    if (!isPlaying) return;
    
    if (lastTsRef.current == null) lastTsRef.current = ts;
    const dt = (ts - lastTsRef.current) / 1000;
    lastTsRef.current = ts;
    
    setCurrentTime((t) => {
      const next = Math.min(duration, t + dt);
      if (next >= duration) {
        cancelAnimationFrame(rafRef.current || 0);
        rafRef.current = null;
        lastTsRef.current = null;
        onPlaybackEnd?.();
        return duration;
      }
      return next;
    });
    
    rafRef.current = requestAnimationFrame(tick);
  }, [duration, isPlaying, onPlaybackEnd]);

  useEffect(() => {
    if (isPlaying) {
      rafRef.current = requestAnimationFrame(tick);
      return () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
        lastTsRef.current = null;
      };
    }
  }, [isPlaying, tick]);

  useEffect(() => {
    onTimeUpdate?.(currentTime);
  }, [currentTime, onTimeUpdate]);

  const play = useCallback(() => {
    if (currentTime >= duration) {
      setCurrentTime(0);
    }
  }, [currentTime, duration]);

  const pause = useCallback(() => {
    // Pause is handled by parent component
  }, []);

  const toggle = useCallback(() => {
    if (currentTime >= duration) {
      setCurrentTime(0);
    }
  }, [currentTime, duration]);

  const seek = useCallback((time: number) => {
    setCurrentTime(Math.max(0, Math.min(duration, time)));
  }, [duration]);

  return {
    currentTime,
    setCurrentTime,
    play,
    pause,
    toggle,
    seek,
  };
}
