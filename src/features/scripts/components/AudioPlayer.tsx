import { useEffect, useRef, useCallback } from 'react';

interface AudioPlayerProps {
  audioUrl: string;
  isPlaying: boolean;
  currentTime: number;
  onTimeUpdate: (time: number) => void;
  onDurationChange: (duration: number) => void;
  onPlayPause: (playing: boolean) => void;
  onEnded: () => void;
}

export default function AudioPlayer({ 
  audioUrl,
  isPlaying,
  currentTime,
  onTimeUpdate,
  onDurationChange,
  onPlayPause,
  onEnded,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const lastSeekTime = useRef<number>(0);
  const isSeeking = useRef<boolean>(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      if (!isSeeking.current) {
        onTimeUpdate(audio.currentTime);
      }
    };

    const handleDurationChange = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        onDurationChange(audio.duration);
      }
    };

    const handleEnded = () => {
      onEnded();
      onPlayPause(false);
    };

    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        onDurationChange(audio.duration);
      }
    };

    const handleCanPlay = () => {
      console.log('Audio can play, duration:', audio.duration);
    };

    const handleError = (e: Event) => {
      console.error('Audio error:', e);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('error', handleError);
    };
  }, [onTimeUpdate, onDurationChange, onPlayPause, onEnded]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((e) => {
          console.error('Play failed:', e);
          onPlayPause(false);
        });
      }
    } else {
      audio.pause();
    }
  }, [isPlaying, onPlayPause]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (Math.abs(audio.currentTime - currentTime) > 0.5) {
      isSeeking.current = true;
      audio.currentTime = currentTime;
      lastSeekTime.current = currentTime;
      
      setTimeout(() => {
        isSeeking.current = false;
      }, 100);
    }
  }, [currentTime]);

  return (
    <audio
      ref={audioRef}
      src={audioUrl}
      preload="metadata"
      crossOrigin="anonymous"
      style={{ display: 'none' }}
      data-testid="audio-element"
    />
  );
}
