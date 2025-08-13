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

    try {
      // Clean the base64 string and create a blob URL
      const cleanBase64 = audioUrl.replace(/\s/g, '');
      const byteCharacters = atob(cleanBase64);
      const byteNumbers = new Array(byteCharacters.length);
      
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      
      setAudioSrc(url);
      setError("");

      // Cleanup function
      return () => {
        URL.revokeObjectURL(url);
      };
    } catch (err) {
      console.error('Failed to create audio URL:', err);
      setError('Failed to load audio');
    }
  }, [audioUrl]);

  const handleAudioError = () => {
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