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
    console.log('AudioPlayerSimple: First 50 chars:', audioUrl.substring(0, 50));

    try {
      // Decode base64 to examine the data
      const cleanBase64 = audioUrl.replace(/\s/g, '');
      const byteCharacters = atob(cleanBase64);
      const byteArray = new Uint8Array(byteCharacters.length);
      
      for (let i = 0; i < byteCharacters.length; i++) {
        byteArray[i] = byteCharacters.charCodeAt(i);
      }
      
      console.log('AudioPlayerSimple: Byte array length:', byteArray.length);
      console.log('AudioPlayerSimple: First 20 bytes:', Array.from(byteArray.slice(0, 20)).map(b => b.toString(16).padStart(2, '0')).join(' '));
      
      // Check for ID3 tag header (ID3v2 starts with "ID3")
      const hasID3 = byteArray[0] === 0x49 && byteArray[1] === 0x44 && byteArray[2] === 0x33;
      console.log('AudioPlayerSimple: Has ID3 tags:', hasID3);
      
      let processedData = byteArray;
      
      if (hasID3) {
        console.log('AudioPlayerSimple: Attempting to strip ID3 tags');
        // ID3v2 header is 10 bytes, followed by size in synchsafe integer format
        const size = ((byteArray[6] & 0x7f) << 21) | 
                    ((byteArray[7] & 0x7f) << 14) | 
                    ((byteArray[8] & 0x7f) << 7) | 
                    (byteArray[9] & 0x7f);
        
        const headerSize = 10;
        const totalID3Size = headerSize + size;
        console.log('AudioPlayerSimple: ID3 tag size:', totalID3Size);
        
        if (totalID3Size < byteArray.length) {
          processedData = byteArray.slice(totalID3Size);
          console.log('AudioPlayerSimple: Stripped ID3, new length:', processedData.length);
          console.log('AudioPlayerSimple: New first 20 bytes:', Array.from(processedData.slice(0, 20)).map(b => b.toString(16).padStart(2, '0')).join(' '));
        }
      }
      
      // Look for MP3 frame sync (0xFF followed by 0xFB, 0xFA, or 0xF3)
      let mp3Start = -1;
      for (let i = 0; i < processedData.length - 1; i++) {
        if (processedData[i] === 0xFF && (processedData[i + 1] & 0xE0) === 0xE0) {
          mp3Start = i;
          console.log('AudioPlayerSimple: Found MP3 sync at byte:', i);
          break;
        }
      }
      
      if (mp3Start > 0) {
        processedData = processedData.slice(mp3Start);
        console.log('AudioPlayerSimple: Trimmed to MP3 sync, new length:', processedData.length);
      }
      
      // Create blob with processed data
      const blob = new Blob([processedData], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      
      console.log('AudioPlayerSimple: Created processed blob URL:', url);
      setAudioSrc(url);
      setError("");

      return () => {
        console.log('AudioPlayerSimple: Cleaning up blob URL');
        URL.revokeObjectURL(url);
      };
    } catch (err) {
      console.error('AudioPlayerSimple: Failed to process audio:', err);
      setError('Failed to process audio data');
    }
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