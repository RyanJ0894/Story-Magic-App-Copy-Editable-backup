export type AudioType = "music" | "ambience" | "sfx" | "voice" | "other";

// Types từ chunk.json
export type ChunkData = {
  chunk_id: string;
  project_id: string;
  scene_title: string;
  version: number;
  lines: ChunkLine[];
  audio_direction: AudioDirection;
  director_notes: string;
};

export type ChunkLine = {
  line_id: string;
  type: string; // "narration" | "dialogue" - using string for flexibility
  text: string;
  tts_settings: TTSSettings;
  src: string | null;
  start: number;
  duration: number;
  volume: number;
  fade_in: number;
  fade_out: number;
};

export type TTSSettings = {
  provider: string;
  voice_key: string;
  style: string;
  character: string | null;
  language: string;
  speed?: number;
  pitch?: number;
  status: string; // "pending" | "done" | "dirty" | "failed" - using string for flexibility
  credits_used: number;
};

export type AudioDirection = {
  music: AudioTrack[];
  ambience: AudioTrack[];
  sfx: AudioTrack[];
};

export type AudioTrack = {
  track_id: string;
  label: string;
  src: string;
  start: number;
  duration: number;
  volume: number;
  fade_in: number;
  fade_out: number;
};

// Timeline component types
export type TimelineItem = {
  id: string;
  title: string;
  type: AudioType;
  src?: string;
  start: number;
  end: number;
  volume?: number;
  fadeIn?: number;
  fadeOut?: number;
  loop?: boolean;
  color?: string;
  muted?: boolean;
  hidden?: boolean;
};

export type TimelineCardData = {
  id: string;
  title: string;
  start: number;
  duration: number;
  volume?: number;
  type?: AudioType;
  color?: string;
  src?: string;
  muted?: boolean;
  hidden?: boolean;
};

export type BasicTimelineProps = {
  duration: number;
  pixelsPerSecond?: number;
  secondsPerMark?: number;
  height?: number;
  items: TimelineItem[];
  onItemsChange?: (items: TimelineItem[]) => void;
  onPlayPause?: (isPlaying: boolean) => void;
  onSeek?: (time: number) => void;
};

export type TimelineCardProps = {
  data: TimelineCardData;
  pixelsPerSecond: number;
  trackHeight: number;
  currentTime?: number;
  isPlaying?: boolean;
  onChange?: (next: { start: number; duration: number }) => void;
  onMetaChange?: (next: Partial<TimelineCardData>) => void;
};

// Hook types
export type UseTimelinePlaybackProps = {
  duration: number;
  isPlaying: boolean;
  onTimeUpdate?: (time: number) => void;
  onPlaybackEnd?: () => void;
};

export type UseTimelinePlaybackReturn = {
  currentTime: number;
  setCurrentTime: (time: number) => void;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  seek: (time: number) => void;
};

// Utility types
export type TimelineExportData = {
  id: string;
  title: string;
  type: AudioType;
  src?: string;
  start: number;
  end: number;
  volume?: number;
  muted?: boolean;
  hidden?: boolean;
  color?: string;
};
