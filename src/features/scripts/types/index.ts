
import type { ChunkProgressData } from '@/features/projects/project-chunk.type';

export interface ScriptPlayerProps {
  chunks: ChunkProgressData[];                
  currentTime: number;
  isPlaying?: boolean;
  duration?: number;
  onSeek?: (time: number) => void;
  onPlayPause?: (isPlaying: boolean) => void;
  onLineChange?: (lineId: string) => void;
  onVoiceChange?: (lineId: string, voiceKey: string) => void;
  onVolumeChange?: (trackId: string, volume: number) => void;
  onSfxChange?: (trackId: string, sfxKey: string) => void;
}

export interface ScriptEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedItems: Set<string>;
  chunks: ChunkProgressData[];
  onSave: (changes: any) => void;
}

export interface AudioControls {
  musicVolume: number;
  ambienceVolume: number;
  sfxVolume: number;
  masterVolume: number;
  selectedVoices: { [lineId: string]: string };
  selectedSfx: { [trackId: string]: string };
}

export interface TimelineEvent {
  id: string;
  type: 'script' | 'audio';
  subtype: string;
  start: number;
  duration: number;
  data: any;
  action?: string;
}

export interface FormData {
  [itemId: string]: {
    volume?: number;
    voice_key?: string;
    character?: string;
    style?: string;
    duration?: number;
    fade_in?: number;
    fade_out?: number;
    label?: string;
  };
}

export interface VoiceOption {
  key: string;
  label: string;
  type: 'dialogue' | 'narration' | 'neutral';
}

export interface AudioOption {
  key: string;
  label: string;
}

export interface AudioOptions {
  music: AudioOption[];
  ambience: AudioOption[];
  sfx: AudioOption[];
}
