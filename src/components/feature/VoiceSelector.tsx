import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { USER_VOICE_CATEGORIES, type UserVoiceCategory } from "@/config/userCategories";
import { Play, Pause } from "lucide-react";
import { type ElevenLabsVoice } from "@/hooks/useElevenLabsVoices";

interface VoiceSelectorProps {
  voices: ElevenLabsVoice[];
  selectedVoiceId: string;
  category?: UserVoiceCategory;
  onVoiceChange: (voiceId: string, voice: ElevenLabsVoice) => void;
  disabled?: boolean;
  showPreview?: boolean;
  className?: string;
}

export const VoiceSelector = ({
  voices,
  selectedVoiceId,
  category,
  onVoiceChange,
  disabled = false,
  showPreview = true,
  className = "",
}: VoiceSelectorProps) => {
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);

  const filteredVoices = category
    ? voices.filter((v) => v.category === category)
    : voices;

  const selectedVoice = voices.find((v) => v.voice_id === selectedVoiceId);

  const handlePreviewVoice = async (voice: ElevenLabsVoice, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (!voice.preview_url) {
      console.error("No preview URL available for voice:", voice.name);
      return;
    }

    try {
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        setCurrentAudio(null);
        setPlayingVoiceId(null);
      }

      if (playingVoiceId === voice.voice_id) {
        return;
      }

      const audio = new Audio();
      audio.crossOrigin = "anonymous";
      audio.preload = "metadata";
      audio.setAttribute("playsinline", "true");

      const playAudio = async () => {
        try {
          setPlayingVoiceId(voice.voice_id);
          await audio.play();
        } catch (error) {
          console.error("Audio play failed:", error);
          setPlayingVoiceId(null);
          setCurrentAudio(null);
        }
      };

      audio.onloadeddata = () => {
        playAudio();
      };

      audio.onended = () => {
        setPlayingVoiceId(null);
        setCurrentAudio(null);
      };

      audio.onerror = () => {
        setPlayingVoiceId(null);
        setCurrentAudio(null);
      };

      setCurrentAudio(audio);
      audio.src = voice.preview_url;
      audio.load();
    } catch (error) {
      console.error("Error in handlePreviewVoice:", error);
      setPlayingVoiceId(null);
      setCurrentAudio(null);
    }
  };

  const handleValueChange = (voiceId: string) => {
    const voice = voices.find((v) => v.voice_id === voiceId);
    if (voice) {
      onVoiceChange(voiceId, voice);
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Select
        value={selectedVoiceId}
        onValueChange={handleValueChange}
        disabled={disabled}
      >
        <SelectTrigger 
          className="min-w-[140px] sm:min-w-[180px]" 
          data-testid="select-voice-trigger"
        >
          <SelectValue placeholder="Select a voice">
            {selectedVoice?.name || "Select a voice"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent 
          position="popper" 
          side="bottom" 
          align="end"
          sideOffset={4}
          className="max-h-[280px] min-w-[180px] max-w-[280px]"
        >
          {filteredVoices.length === 0 ? (
            <div className="py-2 px-3 text-sm text-muted-foreground">
              No voices available{category ? ` for ${category}` : ""}
            </div>
          ) : category ? (
            filteredVoices.map((voice) => (
              <SelectItem
                key={voice.voice_id}
                value={voice.voice_id}
                data-testid={`select-voice-option-${voice.voice_id}`}
              >
                <span>{voice.name}</span>
              </SelectItem>
            ))
          ) : (
            <>
              {USER_VOICE_CATEGORIES.map((cat) => {
                const voicesInCategory = filteredVoices.filter(
                  (v) => v.category === cat
                );
                if (voicesInCategory.length === 0) return null;
                return (
                  <SelectGroup key={cat}>
                    <SelectLabel className="text-xs font-semibold text-muted-foreground px-2 py-1.5">
                      {cat}
                    </SelectLabel>
                    {voicesInCategory.map((voice) => (
                      <SelectItem
                        key={voice.voice_id}
                        value={voice.voice_id}
                        data-testid={`select-voice-option-${voice.voice_id}`}
                      >
                        <span>{voice.name}</span>
                      </SelectItem>
                    ))}
                  </SelectGroup>
                );
              })}
              {(() => {
                const uncategorizedVoices = filteredVoices.filter(
                  (v) => !v.category || !USER_VOICE_CATEGORIES.includes(v.category as typeof USER_VOICE_CATEGORIES[number])
                );
                if (uncategorizedVoices.length === 0) return null;
                return (
                  <SelectGroup>
                    <SelectLabel className="text-xs font-semibold text-muted-foreground px-2 py-1.5">
                      Other
                    </SelectLabel>
                    {uncategorizedVoices.map((voice) => (
                      <SelectItem
                        key={voice.voice_id}
                        value={voice.voice_id}
                        data-testid={`select-voice-option-${voice.voice_id}`}
                      >
                        <span>{voice.name}</span>
                      </SelectItem>
                    ))}
                  </SelectGroup>
                );
              })()}
            </>
          )}
        </SelectContent>
      </Select>

      {showPreview && selectedVoice?.preview_url && (
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => handlePreviewVoice(selectedVoice, e)}
          disabled={disabled}
          data-testid="button-preview-voice"
        >
          {playingVoiceId === selectedVoiceId ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </Button>
      )}
    </div>
  );
};
