import { useState, useRef } from "react";
import { Download, AlertCircle, Play, Pause } from "lucide-react";

interface AudioPlayerProps {
  audioUrl: string;
}

export function AudioPlayerSimple({ audioUrl }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string>("");
  const [showFallback, setShowFallback] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const handleAudioError = (e: any) => {
    console.error('Audio playback error:', e.target?.error);
    setError('Browser audio playback failed');
    setShowFallback(true);
  };

  const handleCanPlay = () => {
    console.log('Audio can play successfully');
    setError("");
    setShowFallback(false);
  };

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(err => {
          console.error('Play failed:', err);
          setError('Playback failed');
          setShowFallback(true);
        });
      }
      setIsPlaying(!isPlaying);
    }
  };

  const downloadAudio = () => {
    if (!audioUrl) return;
    
    try {
      const cleanBase64 = audioUrl.replace(/\s/g, '');
      const byteCharacters = atob(cleanBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'audio/mpeg' });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'story-magic.mp3';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      setError('Download failed');
    }
  };

  // If we hit an error or need fallback, show download-only interface
  if (showFallback || error) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 p-3 bg-orange-500/10 border border-orange-500/20 rounded-md">
          <AlertCircle className="h-5 w-5 text-orange-500 flex-shrink-0" />
          <div className="text-sm text-orange-700 dark:text-orange-300">
            <p className="font-medium">Audio Player Issue</p>
            <p className="text-xs opacity-80">
              Browser playback failed. Please download to play in your preferred audio player.
            </p>
          </div>
        </div>
        
        <button
          onClick={downloadAudio}
          className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
        >
          <Download className="h-4 w-4" />
          Download MP3 File
        </button>
        
        <div className="text-xs text-muted-foreground text-center">
          Audio file size: {Math.round(audioUrl.length * 0.75 / 1024)} KB
        </div>
      </div>
    );
  }

  // Try browser audio player first
  return (
    <div className="space-y-4">
      <div className="bg-background border rounded-md p-4">
        <audio 
          ref={audioRef}
          src={`data:audio/mpeg;base64,${audioUrl}`}
          onError={handleAudioError}
          onCanPlay={handleCanPlay}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
          preload="metadata"
        />
        
        <div className="flex items-center gap-4">
          <button
            onClick={togglePlay}
            className="flex items-center justify-center w-10 h-10 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors"
          >
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
          </button>
          
          <div className="flex-1 text-sm text-muted-foreground">
            Click play to hear your generated audio
          </div>
          
          <button
            onClick={downloadAudio}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-secondary hover:bg-secondary/80 rounded-md transition-colors"
          >
            <Download className="h-4 w-4" />
            Download
          </button>
        </div>
      </div>
      
      <div className="text-xs text-muted-foreground text-center">
        Audio file size: {Math.round(audioUrl.length * 0.75 / 1024)} KB
      </div>
    </div>
  );
}