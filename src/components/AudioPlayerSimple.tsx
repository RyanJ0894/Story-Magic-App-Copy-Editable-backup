import { useState, useEffect, useRef } from "react";

interface AudioPlayerProps {
  audioUrl: string;
}

export function AudioPlayerSimple({ audioUrl }: AudioPlayerProps) {
  const [audioSrc, setAudioSrc] = useState<string>("");
  const [error, setError] = useState<string>("");
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (!audioUrl) return;

    console.log('AudioPlayerSimple: Processing audio URL, length:', audioUrl.length);
    console.log('AudioPlayerSimple: First 100 chars:', audioUrl.substring(0, 100));

    try {
      // First, try the simple data URL approach
      const dataUrl = `data:audio/mpeg;base64,${audioUrl}`;
      setAudioSrc(dataUrl);
      setError("");
      console.log('AudioPlayerSimple: Set data URL successfully');

    } catch (err) {
      console.error('AudioPlayerSimple: Failed to create audio URL:', err);
      setError('Failed to load audio');
    }
  }, [audioUrl]);

  const handleAudioError = (e: any) => {
    console.error('AudioPlayerSimple: Audio element error:', e);
    console.error('AudioPlayerSimple: Audio element error details:', e.target?.error);
    setError('Failed to play audio file');
  };

  if (error) {
    return (
      <div className="text-red-400 text-sm p-2 bg-red-400/10 rounded">
        {error}
      </div>
    );
  }

  if (!audioSrc) {
    return (
      <div className="text-muted-foreground text-sm">
        Loading audio...
      </div>
    );
  }

  return (
    <audio 
      ref={audioRef}
      controls 
      className="w-full"
      src={audioSrc}
      onError={handleAudioError}
    >
      Your browser does not support the audio element.
    </audio>
  );
}