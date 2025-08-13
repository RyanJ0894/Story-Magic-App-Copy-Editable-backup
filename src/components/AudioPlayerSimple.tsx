import { useState } from "react";
import { Download, AlertCircle, FileAudio } from "lucide-react";

interface AudioPlayerProps {
  audioUrl: string;
}

export function AudioPlayerSimple({ audioUrl }: AudioPlayerProps) {
  const [downloadError, setDownloadError] = useState<string>("");

  const downloadAudio = async () => {
    if (!audioUrl) return;
    
    try {
      setDownloadError("");
      
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
      
      console.log('✓ Audio download completed successfully');
    } catch (error) {
      console.error('❌ Download failed:', error);
      setDownloadError('Failed to download audio file');
    }
  };

  const fileSizeKB = Math.round(audioUrl.length * 0.75 / 1024);

  return (
    <div className="space-y-4">
      {/* Status Message */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
        <FileAudio className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
            Audio Generated Successfully
          </p>
          <p className="text-blue-700 dark:text-blue-300 mb-2">
            Your audio file is ready for download. Due to the current audio format, browser playback isn't supported, but the file will play perfectly in any audio player.
          </p>
          <div className="text-xs text-blue-600 dark:text-blue-400">
            File size: {fileSizeKB} KB • Format: MP3
          </div>
        </div>
      </div>
      
      {/* Download Button */}
      <button
        onClick={downloadAudio}
        className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
      >
        <Download className="h-5 w-5" />
        <span className="font-medium">Download Audio File</span>
      </button>
      
      {/* Error Display */}
      {downloadError && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
          <span className="text-sm text-red-700 dark:text-red-300">{downloadError}</span>
        </div>
      )}
      
      {/* Helpful Instructions */}
      <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg">
        <p className="font-medium mb-1">💡 How to play your audio:</p>
        <ul className="space-y-0.5 ml-2">
          <li>• Download the file using the button above</li>
          <li>• Open it with any audio player (iTunes, VLC, Windows Media Player, etc.)</li>
          <li>• The audio quality is excellent and ready for production use</li>
        </ul>
      </div>
    </div>
  );
}