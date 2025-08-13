import { useState } from "react";
import { Download, AlertCircle } from "lucide-react";

interface AudioPlayerProps {
  audioUrl: string;
}

export function AudioPlayerSimple({ audioUrl }: AudioPlayerProps) {
  const [downloadError, setDownloadError] = useState<string>("");

  const downloadAudio = () => {
    if (!audioUrl) return;
    
    try {
      // Clean the base64 string and create blob
      const cleanBase64 = audioUrl.replace(/\s/g, '');
      const byteCharacters = atob(cleanBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'audio/mp3' });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'story-magic.mp3';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setDownloadError("");
    } catch (error) {
      console.error('Download failed:', error);
      setDownloadError('Failed to download audio file');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 p-3 bg-orange-500/10 border border-orange-500/20 rounded-md">
        <AlertCircle className="h-5 w-5 text-orange-500 flex-shrink-0" />
        <div className="text-sm text-orange-700 dark:text-orange-300">
          <p className="font-medium">Audio Player Temporarily Unavailable</p>
          <p className="text-xs opacity-80">
            The browser cannot play this audio format. Please download the file to play it in your preferred audio player.
          </p>
        </div>
      </div>
      
      <div className="flex flex-col gap-2">
        <button
          onClick={downloadAudio}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
        >
          <Download className="h-4 w-4" />
          Download MP3 File
        </button>
        
        {downloadError && (
          <div className="text-red-400 text-sm p-2 bg-red-400/10 rounded">
            {downloadError}
          </div>
        )}
        
        <div className="text-xs text-muted-foreground text-center">
          Audio file size: {Math.round(audioUrl.length * 0.75 / 1024)} KB
        </div>
      </div>
    </div>
  );
}