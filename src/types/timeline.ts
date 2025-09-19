export type TimelineClip = {
  id: string;
  label: string;
  start: number; // seconds
  duration: number; // seconds
  color?: string;
};

export type TimelineTrack = {
  id: string;
  name: string;
  clips: TimelineClip[];
};

export type AudioTimeline = {
  sampleRate: number;
  duration: number; // seconds
  tracks: TimelineTrack[];
  audioUrl?: string;
};
