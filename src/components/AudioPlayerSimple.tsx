import { useState, useEffect, useRef } from "react";

interface AudioPlayerProps {
  audioUrl: string;
}

export function AudioPlayerSimple({ audioUrl }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string>("");
  const [audioSrc, setAudioSrc] = useState<string>("");
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (!audioUrl) {
      console.log('AudioPlayerSimple: No audio URL provided');
      return;
    }

    console.log('AudioPlayerSimple: Processing audio URL, length:', audioUrl.length);
    console.log('AudioPlayerSimple: First 100 chars:', audioUrl.substring(0, 100));

    // Try multiple approaches
    const tryAudioFormats = async () => {
      const formats = [
        'audio/mpeg',
        'audio/mp3', 
        'audio/wav',
        'audio/ogg',
        'audio/webm'
      ];

      for (const format of formats) {
        try {
          console.log(`AudioPlayerSimple: Trying format: ${format}`);
          
          // Clean base64 and create blob URL
          const cleanBase64 = audioUrl.replace(/\s/g, '');
          const byteCharacters = atob(cleanBase64);
          const byteNumbers = new Array(byteCharacters.length);
          
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          
          const byteArray = new Uint8Array(byteNumbers);
          console.log(`AudioPlayerSimple: Created byte array, length: ${byteArray.length}`);
          
          const blob = new Blob([byteArray], { type: format });
          const url = URL.createObjectURL(blob);
          
          console.log(`AudioPlayerSimple: Created blob URL with ${format}:`, url);
          setAudioSrc(url);
          setError("");
          
          return () => {
            console.log('AudioPlayerSimple: Cleaning up blob URL');
            URL.revokeObjectURL(url);
          };
        } catch (err) {
          console.error(`AudioPlayerSimple: Failed with format ${format}:`, err);
          continue;
        }
      }
      
      // If all blob approaches fail, try data URL
      try {
        console.log('AudioPlayerSimple: Trying data URL approach');
        const dataUrl = `data:audio/mpeg;base64,${audioUrl}`;
        setAudioSrc(dataUrl);
        setError("");
      } catch (err) {
        console.error('AudioPlayerSimple: All approaches failed:', err);
        setError('Failed to process audio data - format not supported');
      }
    };

    tryAudioFormats();
  }, [audioUrl]);

  const handleAudioError = (e: any) => {
    console.error('AudioPlayerSimple: Audio error event:', e);
    console.error('AudioPlayerSimple: Audio error code:', e.target?.error?.code);
    console.error('AudioPlayerSimple: Audio error message:', e.target?.error?.message);
    
    const errorMessages = {
      1: 'MEDIA_ERR_ABORTED - The video playback was aborted.',
      2: 'MEDIA_ERR_NETWORK - A network error caused the video download to fail.',
      3: 'MEDIA_ERR_DECODE - The video playback was aborted due to a corruption problem.',
      4: 'MEDIA_ERR_SRC_NOT_SUPPORTED - The video could not be loaded, either because the server or network failed or because the format is not supported.'
    };
    
    const errorCode = e.target?.error?.code;
    const errorMsg = errorMessages[errorCode as keyof typeof errorMessages] || 'Unknown audio error';
    console.error('AudioPlayerSimple: Detailed error:', errorMsg);
    
    setError(`Audio playback failed: ${errorMsg}`);
  };

  const handleCanPlay = () => {
    console.log('AudioPlayerSimple: Audio can play');
    setError("");
  };

  if (error) {
    return (
      <div className="space-y-2">
        <div className="text-red-400 text-sm p-2 bg-red-400/10 rounded">
          {error}
        </div>
        <div className="text-xs text-muted-foreground">
          Debug: Audio URL length: {audioUrl.length}, Source: {audioSrc ? 'Set' : 'Not set'}
        </div>
      </div>
    );
  }

  if (!audioSrc) {
    return (
      <div className="text-muted-foreground text-sm">
        Processing audio... (URL length: {audioUrl.length})
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <audio 
        ref={audioRef}
        controls 
        className="w-full"
        src={audioSrc}
        onError={handleAudioError}
        onCanPlay={handleCanPlay}
        onLoadStart={() => console.log('AudioPlayerSimple: Load started')}
        onLoadedData={() => console.log('AudioPlayerSimple: Data loaded')}
      >
        Your browser does not support the audio element.
      </audio>
      <div className="text-xs text-muted-foreground">
        Audio ready - Source length: {audioSrc.length}
      </div>
    </div>
  );
}